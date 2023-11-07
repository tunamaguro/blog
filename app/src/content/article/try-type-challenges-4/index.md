---
title: "type-challenges をやってみる(medium編その3)"
createdAt: "2023-01-12"
emoji: "✍"
category: "tech"
tags:
  - "TypeScript"
---

Typescript の練習として type-challenges をやった備忘録です。

[type-challenges のリポジトリ](https://github.com/type-challenges/type-challenges)

[前回](/articles/try-type-challenges-3/)の続きをやっていきます。

## MinusOne

Given a number (always positive) as a type. Your type should return the number decreased by one.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/02257-medium-minusone/README.md)

### 解答例

```typescript

```

ちょっと 1 問目から訳わからなくて解けませんでした。またどこかで解こうと思いますが、一応解こうとした過程を下に書いて供養しておきます。

```typescript
type N<T extends number, R extends any[] = []> = R["length"] extends T
  ? R
  : N<T, [...R, never]>;

type Minus<A1 extends number, A2 extends number> = N<A1> extends [
  ...N<A2>,
  ...infer R
]
  ? R["length"]
  : `-${N<A1>["length"]}` extends `${infer M extends number}` //Excessive stack depth comparing types '"length"' and 'keyof N<A1, []>'
  ? M
  : 0;

type MinusOne<T extends number> = Minus<T, 1>;

type A = MinusOne<1101>; // number
```

結果を見ると再帰の限度に引っかかっているようです。T を文字列として解釈し 1 桁ずつ処理することで解ける気はするのですが、
その実装が思いつかず解くことができませんでした。

## PickByType

From T, pick a set of properties whose type are assignable to U.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/02595-medium-pickbytype/README.md)

### 解答例

```typescript
type PickByType<T, U> = { [P in keyof T as T[P] extends U ? P : never]: T[P] };
```

T[P]が U に割り当て可能なプロパティのみ残す型です。この問題は TypeScript4.1 が使用できる Key Remapping を利用して簡単に解くことができます。

[Key Remapping via as](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as)

絶対上の Minus One のほうが難しい...

## StartsWith

Implement StartsWith\<T, U> which takes two exact string types and returns whether T starts with U

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/02688-medium-startswith/README.md)

### 解答例

```typescript
type StartsWith<T extends string, U extends string> = T extends `${U}${string}`
  ? true
  : false;
```

この問題は Conditional Types と Template Literal Types を使って解くことができます。

[Conditional Types](typescriptlang.org/docs/handbook/2/template-literal-types.html)
[Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

## EndsWith

Implement EndsWith\<T, U> which takes two exact string types and returns whether T ends with U

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/02693-medium-endswith/README.md)

### 解答例

```typescript
type EndsWith<T extends string, U extends string> = T extends `${string}${U}`
  ? true
  : false;
```

考え方としては、上の StartsWith と同じでテンプレートリテラルで U が末尾に来るような型を作り、T をその型に割り当て可能かどうか調べます。

## PartialByKeys

Implement a generic PartialByKeys\<T, K> which takes two type argument T and K.

K specify the set of properties of T that should set to be optional. When K is not provided, it should make all properties optional just like the normal Partial\<T>.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/02757-medium-partialbykeys/README.md)

### 解答例

```typescript
type Flat<T extends Record<any, any>> = { [P in keyof T]: T[P] };
type PartialByKeys<T, K extends keyof T = keyof T> = Flat<
  { [P in K]?: T[P] } & Omit<T, K>
>;
```

Mapped Types を用いて単純に下のような型を作ると、交差型になってしまいます。

[Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

```typescript
type PartialByKeys<T, K extends keyof T> = { [P in K]?: T[P] } & Omit<T, K>;

type PartialByKeys<T, K extends keyof T> = { [P in K]?: T[P] } & Omit<T, K>;

interface User {
  name: string;
  age: number;
  address: string;
}

type A = PartialByKeys<User, "name" | "age">;
// type A = {
//     name?: string | undefined;
//     age?: number | undefined;
// } & Omit<User, "name" | "age">
```

なんとかして K を満たす P だけに ? をつけたいところですが、それは不可能です(要出典)。
そこで、交差型を 1 つにまとめるような型 Flat を考えます。

```typescript
type Flat<T extends Record<any, any>> = { [P in keyof T]: T[P] };
type PartialByKeys<T, K extends keyof T> = Flat<
  { [P in K]?: T[P] } & Omit<T, K>
>;

interface User {
  name: string;
  age: number;
  address: string;
}

type A = PartialByKeys<User, "name" | "age">;
// type A = {
//     name?: string | undefined;
//     age?: number | undefined;
//     address: string;
// }
```

最後に K の初期値として keyof T を与えて完成です。

```typescript
type Flat<T extends Record<any, any>> = { [P in keyof T]: T[P] };
type PartialByKeys<T, K extends keyof T = keyof T> = Flat<
  { [P in K]?: T[P] } & Omit<T, K>
>;
```

## RequiredByKeys

Implement a generic RequiredByKeys\<T, K> which takes two type argument T and K.

K specify the set of properties of T that should set to be required. When K is not provided, it should make all properties required just like the normal Required\<T>.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/02759-medium-requiredbykeys/README.md)

### 解答例

```typescript
type Flat<T extends Record<any, any>> = { [P in keyof T]: T[P] };
type RequiredByKeys<T, K extends keyof T = keyof T> = Flat<
  { [P in K]-?: T[P] } & Omit<T, K>
>;
```

上の PartialByKeys と同じ考え方で解くことができます。

## Mutable

Implement the generic Mutable \<T> which makes all properties in T mutable (not readonly).

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/02793-medium-mutable/README.md)

### 解答例

```typescript
type Mutable<T extends Record<any, any>> = { -readonly [P in keyof T]: T[P] };
```

Mapped Types を用いることで readonly も取り除く事ができます。

[Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

## OmitByType

From T, pick a set of properties whose type are not assignable to U.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/02852-medium-omitbytype/README.md)

### 解答例

```typescript
type OmitByType<T, U> = { [P in keyof T as T[P] extends U ? never : P]: T[P] };
```

上の PickByType と同じように解くことができます。

[Key Remapping via as](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as)

## ObjectEntries

Implement the type version of Object.entries

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/02946-medium-objectentries/README.md)

### 解答例

```typescript
type ObjectEntries<T, K extends keyof T = keyof T> = K extends never
  ? never
  : [K, T[K] extends undefined | infer V ? V : undefined];
```

T を [ key , value ] なユニオン型にする問題です。最初は下のような型を思いつきました。

```typescript
type ObjectEntries<T, K extends keyof T = keyof T> = K extends never
  ? never
  : [K, T[K]];

interface Model {
  name: string;
  age: number;
  locations: string[] | null;
}

type A = ObjectEntries<Partial<Model>>;
// type A = ["name", string | undefined] | ["age", number | undefined] | ["locations", string[] | null | undefined]
```

しかしこれでは、T が Partial な場合に undefined が入ってしまうようです。そこで、下にあるテストケースも加味すると下のような型を追加で作ればいけそうです。

1. T が undefined | K のように表される型のときは K を返す
1. T が undefined | K のように表せないときは undefined を返す

このような型 RemoveUndefined を追加して完成です。

```typescript
type RemoveUndefined<T> = [T] extends [undefined | infer K] ? K : undefined;

type ObjectEntries<T, K extends keyof T = keyof T> = K extends never
  ? never
  : [K, RemoveUndefined<T[K]>];
```

ちなみに RemoveUndefined で[T]としているのは、分配されるのを防ぐためです。詳しくは以下を参照してください。

[Distributive Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

## Shift

Implement the type version of Array.shift

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03062-medium-shift/README.md)

### 解答例

```typescript
type Shift<T extends any[]> = T extends [any, ...infer R] ? R : [];
```

単純に infer を使って最も左の要素を取り除くことによって解くことができます。

[Inferring Within Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)

## Tuple to Nested Object

Given a tuple type T that only contains string type, and a type U, build an object recursively.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03188-medium-tuple-to-nested-object/README.md)

### 解答例

```typescript
type TupleToNestedObject<T extends string[], U, V = U> = T extends []
  ? V
  : T extends [...infer L extends string[], infer R extends string]
  ? TupleToNestedObject<L, U, { [P in R]: V }>
  : never;
```

とりあえず再帰を使いそうなので、T が空になったときに再帰を終わるようにしておきます。

```typescript
type TupleToNestedObject<T extends string[], U> = T extends [] ? U : false;
```

T の右端のものが深くネストされていくので、なんとなく右端から処理していったほうが良いような気がします。
そこで、型変数 V を導入して毎回のループで \{ R : V } みたいな感じにしていったら良さそうです。

```typescript
type TupleToNestedObject<T extends string[], U, V = U> = T extends []
  ? U
  : T extends [...infer L, infer R]
  ? TupleToNestedObject<L, U, { [P in R]: V }> // Type 'R' is not assignable to type 'string | number | symbol'
  : never;
```

最後にエラーがでないように L と R に制約をつけてあげます。

```typescript
type TupleToNestedObject<T extends string[], U, V = U> = T extends []
  ? U
  : T extends [...infer L extends string[], infer R extends string]
  ? TupleToNestedObject<L, U, { [P in R]: V }>
  : never;
```

## Reverse

Implement the type version of Array.reverse

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03192-medium-reverse/README.md)

### 解答例

```typescript
type Reverse<T extends any[], V extends any[] = []> = T extends []
  ? V
  : T extends [...infer L, infer R]
  ? Reverse<L, [...V, R]>
  : never;
```

上でやったように右端から処理していけば解けると思います。ここまで書いてから思いましたが下のようにすれば条件分岐が少なくなるので、
こっちのほうが見た目がきれいかもしれません。

```typescript
type Reverse<T extends any[], V extends any[] = []> = T extends [
  ...infer L,
  infer R
]
  ? Reverse<L, [...V, R]>
  : V;
```

## Flip Arguments

Implement the type version of lodash's \_.flip.

Type FlipArguments\<T> requires function type T and returns a new function type which has the same return type of T but reversed parameters.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03196-medium-flip-arguments/README.md)

### 解答例

```typescript
type Reverse<T extends any[], V extends any[] = []> = T extends [
  ...infer L,
  infer R
]
  ? Reverse<L, [...V, R]>
  : V;

type FlipArguments<T extends (...args: any) => any> = T extends (
  ...args: infer Args
) => infer Return
  ? (...args: Reverse<Args>) => Return
  : never;
```

上で作った Reverse を使えばそこまで悩むことはないと思います。

## FlattenDepth

Recursively flatten array up to depth times.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03243-medium-flattendepth/README.md)

### 解答例

```typescript
type FlattenDepth<
  T extends any[],
  D extends number = 1,
  M extends never[] = []
> = T extends [infer L, ...infer R]
  ? L extends any[]
    ? M["length"] extends D
      ? [L, ...FlattenDepth<R, D, M>]
      : [...FlattenDepth<L, D, [...M, never]>, ...FlattenDepth<R, D, M>]
    : [L, ...FlattenDepth<R, D, M>]
  : [];
```

条件分岐が 3 回もあってしかも再帰するので、かなりややこしくなってしまいました。行っていることは上から順に、

1. T が要素を 2 つ以上持つことをチェックし、その要素を L,R に格納。
1. L が配列型かどうか確認。配列型ではないなら展開せずに R を再帰させる。
1. M["length"]が D なら展開せずに R を再帰させる。そうでないなら L と R 両方再帰させる。

という感じです。これを書くのに以前やった Flatten という型をベースにしたのでこのような形になりました。

```typescript
type Flatten<T extends any[]> = T extends [infer R, ...infer S]
  ? R extends any[]
    ? [...Flatten<R>, ...Flatten<S>]
    : [R, ...Flatten<S>]
  : [];
```

2 回目の条件分岐までやっていることはだいたい同じです。  
心残りとして、厳密に 19260817 のような大きい回数展開していないので本当にそのレベルの深さのものを展開しようとすると、おそらく再帰回数の制限に引っかかることです。

## BEM style string

The Block, Element, Modifier methodology (BEM) is a popular naming convention for classes in CSS.

For example, the block component would be represented as btn, element that depends upon the block would be represented as btn\_\_price, modifier that changes the style of the block would be represented as btn--big or btn\_\_price--warning.
Implement BEM\<B, E, M> which generate string union from these three parameters. Where B is a string literal, E and M are string arrays (can be empty).

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03326-medium-bem-style-string/README.md)

### 解答例

```typescript
type BEM<
  B extends string,
  E extends string[],
  M extends string[]
> = E["length"] extends 0
  ? M["length"] extends 0
    ? `${B}`
    : `${B}--${M[number]}`
  : M["length"] extends 0
  ? `${B}__${E[number]}`
  : `${B}__${E[number]}--${M[number]}`;
```

非常にかっこ悪いですが、愚直に E,M が空かそうでないかで分岐させました。もっときれいな書き方を私に教えてください(懇願)。

リテラル型にユニオン型を与えると勝手にすべてのパターンのユニオン型にしてくれるのが便利です。

1. [Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
1. [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

## 終わりに

またしても解けなかった問題が増えてしまいました。なかなか悔しい...

なんというか、時々「難易度おかしいでしょ!!」と言いたくなる問題がありますね。こういうものを解けるようになったとき、1 つ成長できるのでしょうか?

ちなみに、[次の問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03376-medium-inordertraversal/README.md)をさらっと読みましたがもう解けない気がしてます。
