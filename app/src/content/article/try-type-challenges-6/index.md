---

title: "type-challenges をやってみる(medium編その5)"
date: "2023-01-20"
emoji: "🔬"
tags: ["tech", "TypeScript"]
---

Typescript の練習として type-challenges をやった備忘録です。

[type-challenges のリポジトリ](https://github.com/type-challenges/type-challenges)

[前回](/articles/try-type-challenges-5/)に引き続いてやっていきます。
残り 14 問、なんとかこれで解き終えて最終回にしたいです。

## LastIndexOf

Implement the type version of `Array.lastIndexOf`, `LastIndexOf<T, U>` takes an Array `T`, any `U` and returns the index of the last `U` in Array `T`

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/05317-medium-lastindexof/README.md)

### 解答例

```typescript
// type-challengesにコピペするときはコメントアウトしてください
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

type LastIndexOf<
  T extends any[],
  U,
  S extends any[] = [],
  V extends number = -1
> = T extends [infer L, ...infer R]
  ? Equal<L, U> extends true
    ? LastIndexOf<R, U, [...S, L], S["length"]>
    : LastIndexOf<R, U, [...S, L], V>
  : V;
```

前回やった`IndexOf`と同じで実質的に`Equal`を作る問題ですが、
`Equal`について僕は全く理解できていないので解説は下記の素晴らしい記事にお願いしたいと思います。

- [https://qiita.com/Quramy/items/b45711789605ef9f96de](https://qiita.com/Quramy/items/b45711789605ef9f96de)
- [https://zenn.dev/yumemi_inc/articles/ff981be751d26c](https://zenn.dev/yumemi_inc/articles/ff981be751d26c)

## Unique

Implement the type version of `Lodash.uniq`, Unique takes an Array `T`, returns the Array `T` without repeated values.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/05360-medium-unique/README.md)

### 解答例

```typescript
// type-challengesにコピペするときはコメントアウトしてください
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

type Includes<T extends readonly any[], U> = T extends [infer R, ...infer S]
  ? Equal<R, U> extends true
    ? true
    : Includes<S, U>
  : false;

type Unique<T extends any[], V extends any[] = []> = T extends [
  infer L,
  ...infer R
]
  ? Includes<V, L> extends true
    ? Unique<R, [...V]>
    : Unique<R, [...V, L]>
  : V;
```

ひとまずいつものように再帰用の`V`を追加して最後には V を返すようにしておきます。

```typescript
type Unique<T extends any[], V extends any[] = []> = T extends [
  infer L,
  ...infer R
]
  ? 1
  : V;
```

ここで easy 編で作成した型[Includes](https://github.com/type-challenges/type-challenges/blob/main/questions/00898-easy-includes/README.md)
を思い出します。これを使うことで`V`に`L`が含まれていなければ`L`を`V`に追加。そうでなければ追加しないというループを簡単に作る事ができました。

```typescript
type Includes<T extends readonly any[], U> = T extends [infer R, ...infer S]
  ? Equal<R, U> extends true
    ? true
    : Includes<S, U>
  : false;

type Unique<T extends any[], V extends any[] = []> = T extends [
  infer L,
  ...infer R
]
  ? Includes<V, L> extends true
    ? Unique<R, [...V]>
    : Unique<R, [...V, L]>
  : V;
```

## MapTypes

Implement `MapTypes<T, R>` which will transform types in object T to different types defined by type R which has the following structure

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/05821-medium-maptypes/README.md)

### 解答例

```typescript
type MapTypes<T, R extends { mapFrom: any; mapTo: any }> = {
  [P in keyof T]: T[P] extends R["mapFrom"]
    ? R extends { mapFrom: T[P]; mapTo: infer To }
      ? To
      : never
    : T[P];
};
```

沼にはまってしまい解くのに 30 分ほどかかってしまいました 😓。無心で型をいじっていたら完成したためにうまく説明できないので正しく理解してから説明を追記します。

## Construct Tuple

Construct a tuple with a given length.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/07544-medium-construct-tuple/README.md)

### 解答例

```typescript
type ConstructTuple<
  L extends number,
  V extends unknown[] = []
> = V["length"] extends L ? V : ConstructTuple<L, [...V, unknown]>;
```

いつものように再帰用の引数を追加して`V["length"]`が`L`になるまで回します。ありがたいことに`L`が 1000 を超えることはないので上限に引っかかりません。

## Number Range

Sometimes we want to limit the range of numbers...

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/08640-medium-number-range/README.md)

### 解答例

```typescript
type ConstructTuple<
  L extends number,
  V extends unknown[] = []
> = V["length"] extends L ? V : ConstructTuple<L, [...V, unknown]>;

type NumberRange<
  L extends number,
  H extends number,
  V extends unknown[] = ConstructTuple<L>,
  U = never
> = V["length"] extends H
  ? U | H
  : NumberRange<L, H, [...V, unknown], U | V["length"]>;
```

再帰用の引数を作りますが初期値に上で作成した`ConstructTuple`を使います。このようにすれば`V["length"]`を`L`から始められるので、残りはループしてあげるだけです。

## Combination

It's also useful for the prop types like video [controlsList](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/controlsList)

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/08767-medium-combination/README.md)

### 解答例

```typescript
type Combination<
  T extends string[],
  U extends string = T[number],
  S extends string = U
> = U extends string ? `${S}` | `${U} ${Combination<[], Exclude<S, U>>}` : "";
```

以前に[Permutation](https://github.com/type-challenges/type-challenges/blob/main/questions/00296-medium-permutation/README.md)
をやったときには思いつきませんでしたが、ユニオン型と`Exclude`を使えば簡単に作れることに気づきました。自分の TypeScript 筋 💪 の成長を感じます。

## Subsequence

Given an array of unique elements, return all possible subsequences.

A subsequence is a sequence that can be derived from an array by deleting some or no elements without changing the order of the remaining elements.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/08987-medium-subsequence/README.md)

### 解答例

```typescript
type Subsequence<T extends unknown[]> = T extends [infer L, ...infer R]
  ? [L] | [...Subsequence<R>] | [L, ...Subsequence<R>]
  : [];
```

ひとまず順番が重要そうなので`infer`で`T`を分けておきます。

```typescript
type Subsequence<T extends unknown[]> = T extends [infer L, ...infer R]
  ? [L]
  : [];

type A = Subsequence<[1, 2]>;
// type A = [1]
```

当然これでは`[1]`だけになってしまうので、`R`を使って再帰させることを考えます。
現在の処理であれば`Subsequence`は常にタプルを返すのでこれを展開、`[L]`とのユニオン型にすれば最終的にすべての`[L]`になりそうです。

```typescript
type Subsequence<T extends unknown[]> = T extends [infer L, ...infer R]
  ? [L] | [...Subsequence<R>]
  : [];
// type A = [] | [2] | [1]
// [1] | [...Subsequence<[2]>] ->
// [1] | [...([2] | [...Subsequence<[]> ])] ->
// [1] | [...([2] | [...[] ])] ->
// [1] | [...([2] | []) ] ->
// [1] | [2] | []

type A = Subsequence<[1, 2]>;

// タプルのユニオン型を展開したときの動作参考
// ユニオン型が取り出されるような動作
type B = [...([1] | [2, 3] | [])];
// type B = [] | [1] | [2, 3]
```

最後に順番を維持する必要があるので`[L, ...Subsequence<R>]`という風に`L`を先頭につけると...

```typescript
type Subsequence<T extends unknown[]> = T extends [infer L, ...infer R]
  ? [L] | [...Subsequence<R>] | [L, ...Subsequence<R>]
  : [];
// [1] | [...Subsequence<[2]>] | [1, ...Subsequence<[2]>] ->
// [1] | [2] | [] | [1, ...([2] | [...Subsequence<[]>] | [2, ...Subsequence<[]> ] )] ->
// [1] | [2] | [] | [1, ...([2] | [...[]] | [2, ...[] ])] ->
// [1] | [2] | [] | [1, ...([2] | [] | [2] )] ->
// [1] | [2] | [] | [1, ...([2] | [2] )] ->
// [1] | [2] | [] | [1, 2] ->

type A = Subsequence<[1, 2]>;
// type A = [] | [1, 2] | [2] | [1]
```

上のような処理を経て`[1, 2]`に展開されます。`Subsequence<[1, 2, 3]>`の場合はあまりにも長いので割愛しますが、同じように`[1,2,3]`になります。

## FirstUniqueCharIndex

Given a string s, find the first non-repeating character in it and return its index. If it does not exist, return -1. (Inspired by [leetcode 387](https://leetcode.com/problems/first-unique-character-in-a-string/))

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/09286-medium-firstuniquecharindex/README.md)

### 解答例

```typescript
type FirstUniqueCharIndex<
  T extends string,
  S extends string[] = []
> = T extends `${infer L}${infer R}`
  ? L extends S[number]
    ? FirstUniqueCharIndex<R, [...S, L]>
    : R extends `${string}${L}${string}`
    ? FirstUniqueCharIndex<R, [...S, L]>
    : S["length"]
  : -1;
```

ひとまずいつものように再帰用のタプルと infer を使って`T`の先頭 1 文字を取り出します。

```typescript
type FirstUniqueCharIndex<
  T extends string,
  S extends string[] = []
> = T extends `${infer L}${infer R}` ? 1 : -1;
```

ここで問題の繰り返されない文字について考えると`L`が`R`の中に含まれていなければ繰り返されていないと言えそうです。つまり、

```typescript
type FirstUniqueCharIndex<
  T extends string,
  S extends string[] = []
> = T extends `${infer L}${infer R}`
  ? R extends `${string}${L}${string}`
    ? 1 // Lが繰り返しの場合の処理
    : 2 // Lが繰り返しでない場合の処理
  : -1;
```

`${string}${L}${string}`については、[Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
を参照してください。残りは`S`に現在の Index を保持させるようにして再帰させてみます。

```typescript
type FirstUniqueCharIndex<
  T extends string,
  S extends string[] = []
> = T extends `${infer L}${infer R}`
  ? R extends `${string}${L}${string}`
    ? FirstUniqueCharIndex<R, [...S, L]>
    : S["length"]
  : -1;

type A = FirstUniqueCharIndex<"aabb">;
// type A = 1
```

エラーがでてしまっており問題があるようです。冷静に処理を追うと 2 回目の再帰の際`T`には`"abc"`が入るので、`L`が`"a"`,`R`が`"bb"`と推測されます。
当然`"a"`は`"bb"`には含まれないのでこの時点での`S["length"]`===`1`が返ってしまいます。

これを避けるために、`S`に`L`が含まれているかどうかの判定を追加し、含まれていればすぐに再帰するように変更することで上の問題を解決します。

```typescript
type FirstUniqueCharIndex<
  T extends string,
  S extends string[] = []
> = T extends `${infer L}${infer R}`
  ? L extends S[number] // ここでSにLが含まれているか判定
    ? FirstUniqueCharIndex<R, [...S, L]>
    : R extends `${string}${L}${string}`
    ? FirstUniqueCharIndex<R, [...S, L]>
    : S["length"]
  : -1;
```

## GetMiddleElement

Get the middle element of the array by implementing a `GetMiddleElement` method, represented by an array

> If the length of the array is odd, return the middle element
> If the length of the array is even, return the middle two elements

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/09896-medium-get-middle-element/README.md)

### 解答例

```typescript
type GetMiddleElement<T extends unknown[]> = T["length"] extends 2
  ? T
  : T extends [infer _L, ...infer C, infer _R]
  ? GetMiddleElement<C>
  : T;
```

とりあえず infer と再帰 を使って`T`の両端の要素を 1 つずつ取り除きます。1 つずつ取り除いていけば最終的には`T`の要素数は 1 か 2 になるだろうという思考です。

```typescript
type GetMiddleElement<T extends unknown[]> = T extends [
  infer _L,
  ...infer C,
  infer _R
]
  ? C
  : T;

type A = GetMiddleElement<[1, 2, 3, 4, 5]>;
// type A = [3]
type B = GetMiddleElement<[1, 2, 3, 4, 5, 6]>;
// type B = []
```

`T`の要素数が偶数の時、最終的に`C`が`[ ]`と推測されてしまい思ったような動作をしないので、
再帰させる前に`T`の要素数が 2 の際は特例として再帰させずに`T`を返すようにします。

```typescript
type GetMiddleElement<T extends unknown[]> = T["length"] extends 2
  ? T
  : T extends [infer _L, ...infer C, infer _R]
  ? GetMiddleElement<C>
  : T;

type A = GetMiddleElement<[1, 2, 3, 4, 5]>;
// type A = [3]
type B = GetMiddleElement<[1, 2, 3, 4, 5, 6]>;
// type B = [3, 4]
```

## Integer

Please complete type `Integer<T>`, type `T` inherits from `number`, if `T` is an integer return it, otherwise return `never`.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/10969-medium-integer/README.md)

### 解答例

```typescript
type Integer<T> = T extends number
  ? `${T}` extends `${number}.${number}`
    ? never
    : number extends T
    ? never
    : T
  : never;
```

`T extends number`を付けないようにしていたためにあまり美しくない感じになってしまいました。

やっている事自体は単純なので解説は割愛しますが、重要なのは`number extends T`で`T`が`number`だったときの分岐をすることだと感じました。

## ToPrimitive

Convert a property of type literal (label type) to a primitive type.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/16259-medium-to-primitive/README.md)

### 解答例

```typescript
type Convert<
  T,
  P extends any[] = [string, number, boolean, unknown]
> = P extends [infer L, ...infer R] ? (T extends L ? L : Convert<T, R>) : never;

type ToPrimitive<T> = {
  [P in keyof T]: T[P] extends Record<any, any>
    ? ToPrimitive<T[P]>
    : Convert<T[P]>;
};
```

いきなり「オブジェクト型を展開してなんやかんやして...」と考えるとしんどいので、`T`をプリミティブにするような`Convert<T>`を考えます。

何も考えず`extends`を大量に使ってもいいのですが、流石に辛いので再帰で回すようにします。

[Everyday Types(プリミティブがたくさん書いてあります)](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

```typescript
type Convert<
  T,
  P extends any[] = [string, number, boolean, unknown]
> = P extends [infer L, ...infer R] ? (T extends L ? L : Convert<T, R>) : never;

type A = Convert<"aaaa">;
// type A = string
type B = Convert<123>;
// type B = number
type C = Convert<true>;
// type C = boolean
type D = Convert<() => any>;
// type D = unknown
```

こうしておけば仮にプリミティブな型が増えても`P`に増やすだけでよくなります。
`null`や`undefined`等は今回の例にないので`P`に入れてませんが増やせば問題ありません。

残りはこれを`ToPrimitive<T>`の`T`に使うだけです。最終的に下のようになりました。

```typescript
type Convert<
  T,
  P extends any[] = [string, number, boolean, unknown]
> = P extends [infer L, ...infer R] ? (T extends L ? L : Convert<T, R>) : never;

type ToPrimitive<T> = {
  [P in keyof T]: T[P] extends Record<any, any>
    ? ToPrimitive<T[P]>
    : Convert<T[P]>;
};
```

## DeepMutable

Implement a generic DeepMutable which make every parameter of an object - and its sub-objects recursively - mutable.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/17973-medium-deepmutable/README.md)

### 解答例

```typescript
type DeepMutable<T extends Record<any, any>> = {
  -readonly [P in keyof T]: T[P] extends (...args: any) => any
    ? T[P]
    : T[P] extends Record<any, any>
    ? DeepMutable<T[P]>
    : T[P];
};
```

上と同じように再帰しながら`readonly`を外していきます。
ただし`() => 1`は`Record<any,any>`に割り当て可能なので先に関数の判定をする必要があり、そこでしばらく沼ってました。

## All

Returns true if all elements of the list are equal to the second parameter passed in, false if there are any mismatches.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/18142-medium-all/README.md)

### 解答例

```typescript
// type-challengesにコピペするときはコメントアウトしてください
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

type All<T extends any[], A extends any> = T extends [infer L, ...infer R]
  ? Equal<L, A> extends true
    ? All<R, A>
    : false
  : true;
```

`T[number]`でユニオン型を作りそれが`A`に割り当て可能かチェックします。

今回のテストケースだと下のような型でもエラーはでないのですが、`[1, 1, 1, never]`のような型が与えられた際に予想と異なる動作をするので、`Equal`を使って厳密に判定しています。

```typescript
type All<T extends any[], A extends any> = T[number] extends A ? true : false;

type A = All<[1, 1, 1, never], 1>;
// type A = true
```

## Filter

Implement the type `Filter<T, Predicate>` takes an Array `T`, primitive type or union primitive type `Predicate` and returns an Array include the elements of `Predicate`.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/18220-medium-filter/README.md)

### 解答例

```typescript
type Filter<T extends any[], P extends any, V extends any[] = []> = T extends [
  infer L,
  ...infer R
]
  ? L extends P
    ? Filter<R, P, [...V, L]>
    : Filter<R, P, V>
  : V;
```

いつも通り再帰用の`V`を追加し、1 文字取り出して`P`に割り当て可能か判定、可能なら`V`に`L`を追加して再帰をしています。

## 終わりに

これでついに medium 編完了です!!👏

色々調べてとても勉強になり、型パズル力を解く前に比べて圧倒的に強くすることができました。
ですがまだ良くわかっていないところ、例えば`Equal`の動作について理解できていないので、記事を作るという名目でいつか詳しく調べたいと思います。

hard 編はこれから違う勉強をする予定なので、すぐにやることはないと思いますがどこかで解きたいなと思っています。

今回はこれで終わりです。駄文を読んでくださりありがとうございました。
