---
title: "Rustでジョブキューを実装した"
createdAt: "2025-08-15"
emoji: "🧵"
category: tech
tags:
- Rust
- SQLx
- Postgres
---

## はじめに

Rustの並行処理とStreamの勉強のため、Postgresを使ったシンプルなジョブキュー `tasuki` を実装しました。
この記事では実装したものと学習した点の紹介をします

https://github.com/tunamaguro/tasuki

## 注意

現在の実装は実験的なものであり、実利用を現時点では想定していません


## 動いている様子

カウンターを用意して、200msごとに+1しつつその値をジョブとして追加しています。
ジョブハンドラーは受け取った値を出力して、適当な秒数待機させています。コードの全文は次に示します

![動作中の様子](./tasuki-demo.gif)

## 使い方

```rust
use tasuki::{BackEnd, Client, InsertJob, JobData, JobResult, WorkerBuilder, WorkerContext};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .compact()
        .with_max_level(tracing::Level::DEBUG)
        .init();

    let pool = sqlx::PgPool::connect("postgres://root:password@postgres:5432/app")
        .await
        .unwrap();

    let backend = BackEnd::new(pool.clone());
    let worker = WorkerBuilder::new().build(job_handler);

    let client = Client::<u64>::new(pool.clone());
    let client_handle = async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(200));
        let mut n = 0;
        loop {
            interval.tick().await;
            let job = InsertJob::new(n);
            match client.insert(job).await {
                Ok(_) => {
                    // tracing::info!("Enqueue job {}", n);
                    n += 1
                }
                Err(error) => {
                    tracing::error!(error = %error, "Failed to enqueue job")
                }
            };
        }
    };

    let worker_fut = worker.run(backend);
    let mut tasks = tokio::task::JoinSet::new();
    tasks.spawn(client_handle);
    tasks.spawn(worker_fut);

    tasks.join_all().await;
}

async fn job_handler(
    JobData(count): JobData<u64>,
    WorkerContext(_): WorkerContext<()>,
) -> JobResult {
    let handle = tokio::spawn(async move {
        tracing::info!("-start: job {}", count);
        tokio::time::sleep(std::time::Duration::from_secs(count % 5 + 1)).await;

        tracing::info!("--end: job {}", count)
    });
    match handle.await {
        Ok(_) => JobResult::Cancel,
        Err(_) => JobResult::Retry(None),
    }
}
```

> Ref: https://github.com/tunamaguro/tasuki/blob/17824c6992dd334a3209d04bb42f7c85aa8680d1/examples/simple.rs

`WorkerBuilder`に指定した`job_handler`には`Backend`から取得したデータが順次渡されて並行実行されていきます。
動作はあくまで並行なため、`tokio::spawn`を使わないと並列にはなりません。
`Client`はそれ自体が持っているPoolでジョブを挿入する`Client::insert`と、トランザクション中に挿入する`Client::insert_tx`を用意してあります。


## 実装的な話

### Streamを使ったデータ取得と並行実行

基本的に扱うデータを`Stream`として表現しています。このあたりは既存実装である[apalis](https://github.com/geofmureithi/apalis)を参考にしています。
このようにすることで`futures::stream`に存在する便利なメソッドを多く利用できたため、主にFutureのバッファリングやグレースフルシャットダウンの実装で非常に楽をできました。

```rust
async fn run_worker<Tick, F, M, Ctx>(
    tick: Tick,
    handler: F,
    worker_context: Ctx,
    backend: BackEnd,
    concurrent: usize,
) where
    Tick: Stream,
    F: JobHandler<M, Context = Ctx>,
    F::Data: DeserializeOwned,
    Ctx: Clone,
{
    // `tick`がポーリングのタイミングを決定するタイマーの役割を持ったStream。`tick`の度にDBから8個ジョブを引き抜く
    let data_stream = backend.into_datastream(tick, 8);

    // デシリアライズ失敗などでエラーとなったデータが除去されたStreamにする
    let filtered = data_stream.filter_map(|result| async {
        result
            .inspect_err(|error| tracing::error!(error = %error, "Failed to fetch job"))
            .ok()
    });

    // 取得したジョブに対してハンドラを実行するStream
    let runner = filtered.map(|job| async {
            let Job { context:job_context, data } = job;
            tracing::trace!("Start handler");
            let result = {
                let hb_every = LEASE_DURATION / 3;
                let mut ticker = Ticker::new(hb_every).fuse();

                // ジョブの借用期間を延長しつつ、実行完了を待機
                let mut handler_fut = handler.clone().call(data, worker_context.clone()).boxed().fuse();
                loop {
                    futures::select! {
                        res = handler_fut => break res,
                        _ = ticker.next() =>{
                            let _res = job_context.heartbeat().await.inspect_err(
                                |error| tracing::error!(error = %error, job_id = %job_context.id, "Failed to heartbeat job"),
                            );
                        }
                    }
                }
            };
            tracing::trace!("Finish handler");

            let _ =match result {
                JobResult::Complete => {job_context.complete().await.inspect_err(   |error| tracing::error!(error = %error, "Failed to complete job"))},
                JobResult::Retry(duration) =>  {job_context.retry(duration).await.inspect_err(|error| tracing::error!(error = %error, "Failed to retry job"))},
                JobResult::Cancel => {job_context.cancel().await.inspect_err(|error|tracing::error!(error = %error, "Failed to cancel job"))},
            };
        });

    // ジョブのバッファリングと`tick`が終了するまで実行し続けるFutureに変換
    let fut = runner.buffer_unordered(concurrent).for_each(|_| async {});

    fut.await
}
```

> Ref: https://github.com/tunamaguro/tasuki/blob/17824c6992dd334a3209d04bb42f7c85aa8680d1/src/worker.rs#L405-L456

### ジェネリックなジョブハンドラー

現在`WorkerBuilder::build`の実装は以下のようになっています。

```rust
pub trait JobHandler<M>: Send + Sync + Clone + 'static {
    /// The job data type handled by this function.
    type Data;
    /// Type of the shared context provided to the handler.
    type Context;

    /// Future returned by the handler.
    type Future: Future<Output = JobResult> + Send;

    /// Invoke the handler with the job data and worker context.
    fn call(self, data: Self::Data, context: Self::Context) -> Self::Future;
}

// (snip)

impl<Tick, Ctx> WorkerBuilder<Tick, Ctx>
where
    Tick: Stream,
    Ctx: Clone,
{
    pub fn build<F, M>(self, f: F) -> Worker<Tick, F, Ctx, M>
    where
        F: JobHandler<M, Context = Ctx>,
    {
        Worker {
            tick: self.tick,
            concurrent: self.concurrent,
            job_handler: f,
            context: self.context,
            _marker: std::marker::PhantomData,
        }
    }
}
```

`JobHandler<M>`挿入されたジョブデータやワーカーで共有される状態を引数に取る関数に対して、自動実装されているため適当に定義した関数を渡せます。

<details>
<summary>JobHandler&ltM&gtの自動実装部分</summary>

```rust
/// Wrapper passed to handlers that request the job payload.
pub struct JobData<T>(pub T);

/// Wrapper passed to handlers that require access to shared context.
pub struct WorkerContext<S>(pub S);

impl<F, Fut> JobHandler<()> for F
where
    F: FnOnce() -> Fut + Clone + Send + Sync + 'static,
    Fut: Future<Output = JobResult> + Send,
{
    type Data = serde_json::Value;
    type Context = ();
    type Future = Fut;

    fn call(self, _data: Self::Data, _context: Self::Context) -> Self::Future {
        self()
    }
}

impl<F, Fut, T> JobHandler<JobData<T>> for F
where
    F: FnOnce(JobData<T>) -> Fut + Clone + Send + Sync + 'static,
    Fut: Future<Output = JobResult> + Send,
{
    type Data = T;
    type Context = ();
    type Future = Fut;

    fn call(self, data: Self::Data, _context: Self::Context) -> Self::Future {
        self(JobData(data))
    }
}

impl<F, Fut, S> JobHandler<WorkerContext<S>> for F
where
    F: FnOnce(WorkerContext<S>) -> Fut + Clone + Send + Sync + 'static,
    Fut: Future<Output = JobResult> + Send,
{
    type Data = serde_json::Value;
    type Context = S;
    type Future = Fut;

    fn call(self, _data: Self::Data, context: Self::Context) -> Self::Future {
        self(WorkerContext(context))
    }
}

impl<F, Fut, T, S> JobHandler<(JobData<T>, WorkerContext<S>)> for F
where
    F: FnOnce(JobData<T>, WorkerContext<S>) -> Fut + Clone + Send + Sync + 'static,
    Fut: Future<Output = JobResult> + Send,
{
    type Data = T;
    type Context = S;
    type Future = Fut;

    fn call(self, data: Self::Data, context: Self::Context) -> Self::Future {
        self(JobData(data), WorkerContext(context))
    }
}
```
</details>

この実装は当初`M`を取らない形で実装していたのですが、このように実装するとコンパイルができません。これは複数引数で呼び出し可能なオブジェクトに対して同じトレイトが2つ実装されてしまうためだと理解しています。

```rust
pub struct JobData<T>(pub T);

pub struct WorkerContext<S>(pub S);

pub trait JobHandler: Send + Sync + Clone + 'static {
    type Data;
    type Context;
    type Future: Future<Output = JobResult> + Send;

    fn call(self, data: Self::Data, context: Self::Context) -> Self::Future;
}

impl<F, Fut> JobHandler for F
where
    F: FnOnce() -> Fut + Clone + Send + Sync + 'static,
    Fut: Future<Output = JobResult> + Send,
{
    type Data = serde_json::Value;
    type Context = ();
    type Future = Fut;

    fn call(self, _data: Self::Data, _context: Self::Context) -> Self::Future {
        self()
    }
}

impl<F, Fut, T> JobHandler for F
where
    F: FnOnce(JobData<T>) -> Fut + Clone + Send + Sync + 'static,
    Fut: Future<Output = JobResult> + Send,
{
    type Data = T;
    type Context = ();
    type Future = Fut;

    fn call(self, data: Self::Data, _context: Self::Context) -> Self::Future {
        self(JobData(data))
    }
}
```

> プレイグラウンド: https://play.rust-lang.org/?version=stable&mode=debug&edition=2024&gist=6a14a3121d23a4ec46029453cb0e0bf6  
> この例だとそもそも`T`や`Fut`でコンパイルエラーになっているので適切ではないですが...

調べてみると[axum::handler::Handler](https://docs.rs/axum/0.8.4/axum/handler/trait.Handler.html)もおそらく同様な理由で内部で利用していない`T`をトレイトがとっています。

## 感想

とりあえず基本的なジョブ投入・取得・実行のループまではサクッと実装することができました。
現状一番気に入っていない部分は、DBからジョブを取得する数がどんな時でも8固定なため、これを開いているバッファーの数になるようにしておきたいと考えています
