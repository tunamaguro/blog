---
title: "type-challenges をやってみる(medium編その2)"
createdAt: "2023-01-08"
emoji: "📏"
category: "tech"
tags:
  - "TypeScript"
---

Typescript の練習として type-challenges をやった備忘録です。

[type-challenges のリポジトリ](https://github.com/type-challenges/type-challenges)

[前回](</articles/20230107-type-challenges%20をやってみる(medium編その1)>)の続きをやっていきます。

## Diff

Get an Object that is the difference between O & O1

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00645-medium-diff/README.md)

### 解答例

```typescript
type Diff<O, O1> = {
  [P in
    | Exclude<keyof O, keyof O1>
    | Exclude<keyof O1, keyof O>]: P extends keyof O
    ? O[P]
    : P extends keyof O1
      ? O1[P]
      : never;
};
```

お互いのオブジェクト型で重複していないプロパティのみ取り出す問題です。
単純に keyof O,keyof O1 両方から割り当て可能な型を除き、それを Mapped Types でオブジェクト型にまとめます。  
使用している機能の詳細は下のリンクを参照してください。

1. [Keyof Type Operator](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
1. [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
1. [Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
1. [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
1. [Exclude(Utility Types)](https://www.typescriptlang.org/docs/handbook/utility-types.html)

## AnyOf

Implement Python liked any function in the type system. A type takes the Array and returns true if any element of the Array is true. If the Array is empty, return false.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00949-medium-anyof/README.md)

### 解答例

```typescript
type Falsy = [0, "", false, [], Record<any, never>, null, undefined][number];
type AnyOf<T extends readonly any[]> = T extends [infer L, ...infer R]
  ? L extends Falsy
    ? AnyOf<R>
    : true
  : false;
```

T の中に javascript の Falsy のような型が存在するかどうか判定する問題です。

[Falsy(MDN)](https://developer.mozilla.org/en-US/docs/Glossary/Falsy)

最初に思いついたのは下のような形でしたが、予想とは異なり false が返ってきていました。

```typescript
type Falsy = [0, "", false, [], {}, null, undefined][number];
type AnyOf<T extends readonly any[]> = T extends [infer L, ...infer R]
  ? L extends Falsy
    ? AnyOf<R>
    : true
  : false;

type A = AnyOf<[1, "test", true, [1], { name: "test" }, { 1: "test" }]>; // false
```

調べたところ、\{}がかなり特殊な方のようです。

```typescript
type IsEmpty<T> = T extends {} ? true : false;

// falseなやつら
type C = IsEmpty<null>;
type D = IsEmpty<undefined>;

// trueなやつら
type E = IsEmpty<false>;
type F = IsEmpty<number>;
type G = IsEmpty<string>;
type H = IsEmpty<[]>;
type I = IsEmpty<[null]>;
type J = IsEmpty<[number]>;
type K = IsEmpty<{}>;
type L = IsEmpty<{ aaa: string }>;
type M = IsEmpty<{ aaa: null }>;
```

そこで \{} の代わりに Record\<any,never>を使って空オブジェクトを表現します。

```typescript
type IsEmpty<T> = T extends Record<any, never> ? true : false;

// falseなやつら
type C = IsEmpty<null>;
type D = IsEmpty<undefined>;
type E = IsEmpty<false>;
type F = IsEmpty<number>;
type G = IsEmpty<string>;
type H = IsEmpty<[]>;
type I = IsEmpty<[null]>;
type J = IsEmpty<[number]>;
type L = IsEmpty<{ aaa: string }>;
type M = IsEmpty<{ aaa: null }>;

// trueなやつら
type K = IsEmpty<{}>;
```

uhyo 様が記事を書かれていました

[TypeScript の型入門](https://qiita.com/uhyo/items/e2fdef2d3236b9bfe74a#object%E5%9E%8B%E3%81%A8%E5%9E%8B)

## IsNever

Implement a type IsNever, which takes input type T. If the type of resolves to never, return true, otherwise false.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/01042-medium-isnever/README.md)

### 解答例

```typescript
type IsNever<T> = [T] extends [never] ? true : false;
```

T が never かどうか判定する問題です。そのまま書くと下のようにエラーがでてしまいました。

```typescript
type IsNever<T> = T extends never ? true : false;

type A = IsNever<never>; // never
```

T extends ...の T が never だと何があっても never に分類されるようです。

1. [Distributive Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)
2. [T が never の時の、T extends .. は、問答無用で never になる](https://scrapbox.io/mrsekut-p/T_%E3%81%8Cnever%E3%81%AE%E6%99%82%E3%81%AE%E3%80%81T_extends_.._%E3%81%AF%E3%80%81%E5%95%8F%E7%AD%94%E7%84%A1%E7%94%A8%E3%81%A7never%E3%81%AB%E3%81%AA%E3%82%8B)

なので、[T]として、never ではなく[never]として判定させるようにすれば、エラーを解決できました。

## IsUnion

Implement a type IsUnion, which takes an input type T and returns whether T resolves to a union type.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/01097-medium-isunion/README.md)

### 解答例

```typescript
type IsUnion<T, U = T> = [T] extends [never]
  ? false
  : T extends never
    ? never
    : U[] extends T[]
      ? false
      : true;
```

T がユニオン型かどうか判定する問題です。上で少しでてきた Distributive Conditional Types を活用します。  
はじめに下のようにただ分配するだけの型を作ります。

```typescript
type IsUnion<T> = T extends never ? never : T[];

type A = IsUnion<string | number>; // string[] | number[]
```

すると T がユニオン型の場合分配されるので、分配される前の T[]と比較すれば判定できそうです。

```typescript
type IsUnion<T, U = T> = T extends never
  ? never
  : U[] extends T[]
    ? false
    : true;

type A = IsUnion<string | number>;
// = (string | number)[] extends string[] ? false : true
//  |(string | number)[] extends number[] ? false : true
// = true | true
// = true

type B = IsUnion<never>; // never
```

最後に never が与えられた場合に、false を返すように上の IsNever をベースに条件分岐を追加します。

```typescript
type IsUnion<T, U = T> = [T] extends [never]
  ? false // T=never
  : T extends never
    ? never
    : U[] extends T[]
      ? false // T = Not Union
      : true; // T = Union
```

## ReplaceKeys

Implement a type ReplaceKeys, that replace keys in union types, if some type has not this key, just skip replacing, A type takes three arguments.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/01130-medium-replacekeys/README.md)

### 解答例

```typescript
type ReplaceKeys<U, T, Y extends Record<any, unknown>> = U extends never
  ? never
  : {
      [P in keyof U]: P extends T ? (P extends keyof Y ? Y[P] : never) : U[P];
    };
```

はじめに、U が一旦ユニオン型ではないとして考えます。テストケースを見ると次のような処理を組めば良さそうです。

1. U のプロパティから T に割り当て可能なものを探す
2. T が Y のプロパティに存在すれば Y のプロパティ型、存在しなければ never 型に置き換える

やりたいことはわかったのでこれを実装します。おそらく、下のような形になるでしょうか。

```typescript
type ReplaceKeys<U, T, Y extends Record<any, unknown>> = {
  [P in keyof U]: P extends T ? (P extends keyof Y ? Y[P] : never) : U[P];
};
```

最後にこれをユニオン型でも出来ようできるように、T を Conditional Types で分解します。

```typescript
type ReplaceKeys<U, T, Y extends Record<any, unknown>> = U extends never
  ? never // 絶対ここには来ない
  : {
      [P in keyof U]: P extends T ? (P extends keyof Y ? Y[P] : never) : U[P];
    };
```

## Remove Index Signature

Implement RemoveIndexSignature\<T> , exclude the index signature from object types.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/01367-medium-remove-index-signature/README.md)

### 解答例

```typescript
type RemoveIndexSignature<T> = {
  [P in keyof T as string extends P
    ? never
    : number extends P
      ? never
      : symbol extends P
        ? never
        : P]: T[P];
};
```

どう考えても keyof を使う問題ですが、Index Signatures に keyof を使ったときの動作がわからなかったのでとりあえず調べてみます。

1. [Index Signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)
2. [Keyof Type Operator](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

英語ができないので、雰囲気で読んでみると Index Signatures に number が設定されている場合 keyof は number を、
string が設定されている場合は string | number を返すようです。

> ```typescript
> type Arrayish = { [n: number]: unknown };
> type A = keyof Arrayish; // number
> type Mapish = { [k: string]: boolean };
> type M = keyof Mapish; // string | number
> ```
>
> Note that in this example, M is string | number — this is because JavaScript object keys are always coerced to a string, so obj[0] is always the same as obj["0"].

しかし、symbol が設定されている場合の説明がないので、一回試してみます。結果が下です。

```typescript
type Check<T> = { [P in keyof T]: P };

type Foo = {
  [key: string]: any;
  foo(): void;
};

type Bar = {
  [key: number]: any;
  bar(): void;
  0: string;
};

const foobar = Symbol("foobar");

type FooBar = {
  [key: symbol]: any;
  [foobar](): void;
};

type Baz = {
  bar(): void;
  baz: string;
};

type A = Check<Foo>;
// type A = {
//     [x: string]: string;
//     foo: "foo";
// }

type B = Check<Bar>;
// type B = {
//     [x: number]: number;
//     bar: "bar";
//     0: 0;
// }

type C = Check<FooBar>;
// type C = {
//     [x: symbol]: symbol;
//     [foobar]: typeof foobar;
// }
type D = Check<Baz>;
// type D = {
//     bar: "bar";
//     baz: "baz";
// }
```

string が設定されているときに string | number が返ってきていない気がしますが、ひとまず symbol の場合は symbol が返ってくるようです。  
ここまでの検証をまとめると Index Signatures に keyof を使うと string | number | symbol のどれかが返ってくることがわかりました。

ということで、とりあえず Index Signatures が never になるような型を作ってみます。

```typescript
type RemoveIndexSignature<T> = {
  [P in keyof T]: string extends P
    ? never
    : number extends P
      ? never
      : symbol extends P
        ? never
        : T[P];
};

type B = RemoveIndexSignature<Bar>;
// type B = {
//     [x: number]: never;
//     bar: () => void;
//     0: string;
// }
type C = RemoveIndexSignature<FooBar>;
// type C = {
//     [x: symbol]: never;
//     [foobar]: () => void;
// }
```

ここで、Mapped Types で使用できる as を使います。as を使うことで \{[P in T]:...}としていた P に対して変更を加えられます。

[Key Remapping via as](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as)

```typescript
type RemoveIndexSignature<T> = {
  [P in keyof T as string extends P
    ? never
    : number extends P
      ? never
      : symbol extends P
        ? never
        : P]: T[P];
};
```

as を使わなくても keyof T のうち T[P]が never なものを取り除き、それを使って T を再構成すれば行けると思いますが未検証です。

## Percentage Parser

Implement PercentageParser. According to the /^(\+|\-)?(\d\*)?(\%)?$/ regularity to match T and get three matches.

The structure should be: [plus or minus, number, unit] If it is not captured, the default is an empty string.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/01978-medium-percentage-parser/README.md)

### 解答例

```typescript
type ParseSign<A extends string> = A extends `${"+" | "-"}${string}`
  ? A extends `${infer L}${string}`
    ? L
    : never
  : "";

type ParsePercentage<A extends string> = A extends `${string}%` ? "%" : "";

type PercentageParser<
  A extends string,
  S extends string = ParseSign<A>,
  P extends string = ParsePercentage<A>,
> = A extends `${S}${infer N}${P}` ? [S, N, P] : never;
```

この問題は３つの工程に分解して考えます。

1. 符号がついているか判定。ついていたらその符号を返す
2. %がついているか判定。ついていれば%を返す
3. 数字部分を取り出す

まず、1 と 2 の判定部分を作ります。これはサクッと作れるでしょう。

```typescript
type ParseSign<A extends string> = A extends `${"+" | "-"}${string}`
  ? A extends `${infer L}${string}`
    ? L
    : never
  : "";

type ParsePercentage<A extends string> = A extends `${string}%` ? "%" : "";
```

次にこれらを組み合わせて、3 の数字取り出しを実現します。

```typescript
type PercentageParser<
  A extends string,
  S extends string = ParseSign<A>,
  P extends string = ParsePercentage<A>,
> = A extends `${S}${infer N}${P}` ? [S, N, P] : never;

type A = PercentageParser<"+100%">;
```

## Drop Char

Drop a specified char from a string.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/02070-medium-drop-char/README.md)

### 解答例

```typescript
type DropChar<
  S extends string,
  C extends string,
  V extends string = "",
> = S extends ""
  ? V
  : S extends `${infer L}${infer R}`
    ? L extends C
      ? DropChar<R, C, V>
      : DropChar<R, C, `${V}${L}`>
    : never;
```

本当は C が 1 文字かどうかの検証を入れるべきだと思いますが、Drop **Char** なので見なかったことにします。

## 終わりに

今日は時間がとれなかったのに加えて、問題自体の難易度も上がり昨日と比較して 3 分の 1 しか解くことができませんでした(今日 8 問、昨日 24 問)。

問題の難易度が上がったぶん、自分の Typesript 筋が強くなっていっているとありがたいですが...

もし、記事内容に誤り等があれば Issue をだしていただくか、私の DM にお願いします。

残りの問題は明日以降解きます。
