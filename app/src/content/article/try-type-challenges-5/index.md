---
title: "type-challenges をやってみる(medium編その4)"
createdAt: "2023-01-16"
emoji: "✂️"
category: "tech"
tags:
  - "TypeScript"
---

Typescript の練習として type-challenges をやった備忘録です。

[type-challenges のリポジトリ](https://github.com/type-challenges/type-challenges)

[前回](/articles/20230112-type-challenges%20をやってみる(medium編その3))に引き続いてやっていきます。

medium だけでもう 4 記事目ですが、終わるのは 6 か 7 記事目になりそうです(残り 29 問)。

## InorderTraversal

Implement the type version of binary tree inorder traversal.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03376-medium-inordertraversal/README.md)

### 解答例

```typescript
type InorderTraversal<T extends TreeNode | null> = [T] extends [TreeNode]
  ? [...InorderTraversal<T["left"]>, T["val"], ...InorderTraversal<T["right"]>]
  : [];
```

はじめは下のように[Flatten](https://github.com/type-challenges/type-challenges/blob/main/questions/00459-medium-flatten/README.md)
っぽく書きましたが、エラーがでてしまいました。

```typescript
type InorderTraversal<T extends TreeNode | null> = T extends TreeNode
  ? [...InorderTraversal<T["left"]>, T["val"], ...InorderTraversal<T["right"]>]
  : [];
// Type instantiation is excessively deep and possibly infinite.ts(2589)
// Expression produces a union type that is too complex to represent.ts(2590)
```

DeepL で翻訳してみると

> 型のインスタンス化が過度に深くなり、無限大になる可能性がある。  
> 式は、表現が複雑すぎるユニオン型を生成します。

エラー内容から察するに`T`が`TreeNode`と`null`のユニオン型のために`T`が分配されてループし続けてしまうとコンパイラが判断しているのだと思います。
ですが、参考になりそうなページを見つけられなかったので実際のところは不明です。

今回は`T`を配列で包みユニオン型ではなくすことで、上のエラーが出なくなりました。

```typescript
type InorderTraversal<T extends TreeNode | null> = [T] extends [TreeNode]
  ? [...InorderTraversal<T["left"]>, T["val"], ...InorderTraversal<T["right"]>]
  : [];
```

## Flip

Implement the type of just-flip-object.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/04179-medium-flip/README.md)

### 解答例

```typescript
type Flip<T extends Record<any, any>> = {
  [P in keyof T as `${T[P]}`]: P;
};
```

as は P を変更しないことに気をつけてください。

1. [Key Remapping via as](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as)
2. [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

## Fibonacci Sequence

Implement a generic `Fibonacci<T>` that takes a number T and returns its corresponding Fibonacci number.

The sequence starts: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, ...

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/04182-medium-fibonacci-sequence/README.md)

### 解答例

```typescript
type Fibonacci<
  T extends number,
  Arg1 extends any[] = [],
  Arg2 extends any[] = [any],
  Memo extends any[] = [],
> = Memo["length"] extends T
  ? Arg1["length"]
  : Fibonacci<T, Arg2, [...Arg1, ...Arg2], [...Memo, any]>;
```

フィボナッチ数列の定義

$$
  F_0=0 \\
  F_1=1  \\
  F_{n+1}=F_n+F_{n+1}
$$

を愚直に書きました。Arg1 が$F_0$、Arg2 が$F_1$、Memo が$n$に対応してます。

かなり雑に書いたので$n=20$からエラーがでます。

```typescript
type Fibonacci<
  T extends number,
  Arg1 extends any[] = [],
  Arg2 extends any[] = [any],
  Memo extends any[] = [],
> = Memo["length"] extends T
  ? Arg1["length"]
  : Fibonacci<T, Arg2, [...Arg1, ...Arg2], [...Memo, any]>;

type A = Fibonacci<20>; // A=6765
// Type produces a tuple type that is too large to represent.ts(2799)
```

## AllCombinations

Implement type `AllCombinations<S>` that return all combinations of strings which use characters from S at most once.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/04260-medium-nomiwase/README.md)

### 解答例

```typescript
type Replace<
  S extends string,
  From extends string,
  To extends string,
> = From extends ""
  ? S
  : S extends `${infer L}${From}${infer R}`
    ? `${L}${To}${R}`
    : S;

type StrToUnion<T extends string, V = never> = T extends `${infer L}${infer R}`
  ? StrToUnion<R, V | L>
  : V;

type AllCombinations<
  S extends string,
  V extends string = "",
  U extends string = StrToUnion<S>,
> = S extends ""
  ? S
  : U extends never
    ? never
    : V | `${V}${U}` | AllCombinations<Replace<S, U, "">, `${V}${U}`>;
```

なんとなく書いていたらすごい長い型になりました。ざっくりとした処理の流れとしては、

1. `S`を 1 文字ずつのユニオン型に変換(型引数`U`)
1. `U`を`never`と比較して分配
1. `S`の中の`U`を削除して再帰

というような感じです。[Permutation](https://github.com/type-challenges/type-challenges/blob/main/questions/00296-medium-permutation/README.md)
とかが結構似ていると思います。

## Greater Than

In This Challenge, You should implement a type `GreaterThan<T, U>` like `T > U`

Negative numbers do not need to be considered.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/04425-medium-greater-than/README.md)

### 解答例

```typescript
type N<T extends number, V extends never[] = []> = V["length"] extends T
  ? V
  : N<T, [...V, never]>;

type GreaterThan<T extends number, U extends number> = T extends U
  ? false // T === U
  : N<T> extends [...never[], ...N<U>]
    ? true
    : false;
```

`N<T>`が`N<U>`より要素を持っているかどうかを検査して判定できました。ただし、`T === U`の際の処理を加える必要があります。

`T >= U` === `N<T> extends [...never[], ...N<U>]`に気づけたので解けました。

## Zip

In This Challenge, You should implement a type `Zip<T, U>`, T and U must be `Tuple`

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/04471-medium-zip/README.md)

### 解答例

```typescript
type Zip<T extends any[], U extends any[], V extends any[] = []> = [
  T,
  U,
] extends [[infer L1, ...infer R1], [infer L2, ...infer R2]]
  ? Zip<R1, R2, [...V, [L1, L2]]>
  : V;
```

`[ T , U ]`というふうにして infer でそれぞれの値を取り出しています。infer が便利ですね。

## IsTuple

Implement a type `IsTuple`, which takes an input type `T` and returns whether `T` is tuple type.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/04484-medium-istuple/README.md)

### 解答例

```typescript
type TupleUnion<T extends readonly any[], V = never> = T extends readonly [
  infer L,
  ...infer R,
]
  ? TupleUnion<R, V | L>
  : V;

type IsTuple<T> = [T] extends [never]
  ? false
  : T extends []
    ? true
    : T extends readonly any[]
      ? [TupleUnion<T>] extends [never]
        ? false
        : true
      : false;
```

とりあえず書けたのですがその場しのぎ的な条件分岐が多いので、うまく書けたとはとてもじゃないですが思えません。

`readonly T[]`に`T[]`を割り当てできないことをこの問題で初めて気づきました。

## Chunk

Do you know `lodash`? `Chunk` is a very useful function in it, now let's implement it.
`Chunk<T, N>` accepts two required type parameters, the `T` must be a `tuple`, and the `N` must be an `integer >=1`

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/04499-medium-chunk/README.md)

### 解答例

```typescript
type Chunk<
  T extends any[],
  N extends number,
  Item extends any[] = [],
  V extends any[] = [],
> = T extends [infer L, ...infer R]
  ? Item["length"] extends N
    ? Chunk<R, N, [L], [...V, Item]>
    : Chunk<R, N, [...Item, L], V>
  : [Item, V] extends [[], []]
    ? []
    : [...V, Item];
```

`chunk`の動作のイメージは[ここ](https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_chunk)を参考にして作りました。

ちょっと躓いたのは、`T === [ ]`のときに返り値が`[ [ ] ]`になってしまったことです。今回は単純に`Item === [ ] && V === [ ]`であることを検査して
`true`なら`[ ]`を返すようにしてます。

## Fill

`Fill`, a common JavaScript function, now let us implement it with types.
`Fill<T, N, Start?, End?>`, as you can see,`Fill` accepts four types of parameters, of which `T` and `N` are required parameters, and `Start` and `End` are optional parameters.
The requirements for these parameters are: `T` must be a `tuple`, `N` can be any type of value, `Start` and `End` must be integers greater than or equal to 0.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/04518-medium-fill/README.md)

### 解答例

```typescript
type Plus1<T extends number, V extends never[] = []> = V["length"] extends T
  ? [...V, never]["length"]
  : Plus1<T, [...V, never]>;

type Fill<
  T extends unknown[],
  N,
  Start extends number = 0,
  End extends number = T["length"],
  V extends any[] = [],
> = T extends [infer L, ...infer R]
  ? V["length"] extends End
    ? Fill<R, N, 0, End, [...V, L]>
    : V["length"] extends Start
      ? Fill<R, N, Plus1<Start>, End, [...V, N]>
      : Fill<R, N, Start, End, [...V, L]>
  : V;
```

適当に書いていたらすごい理解しにくいコードができていました。`V`に最終的に返したい値が入っています。

やっていることは左から 1 つずつ取り出して、`Start <= idx < End`なら置き換え、そうでないならそのまま戻すということをやっています。

だいぶ変なふうに上の処理を行っているので、ざっくりとした流れを下に書いておきます。

1. `V["length"]` === `End`なら、つまり`idx` === `End`なら`Start`を適当に書き換えて再帰
2. `V["length"]` === `Start`なら、つまり`idx` === `Start`なら`N`に置き換えて再帰。このとき`Start + 1`することで次の再帰でもうまく判定できるようにしておきます

我ながらかなり気持ち悪い書き方です。もう少しわかりやすくかけるようになりたいです。

## Trim Right

Implement `TrimRight<T>` which takes an exact string type and returns a new string with the whitespace ending removed.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/04803-medium-trim-right/README.md)

### 解答例

```typescript
type TrimRight<S extends string> = S extends `${infer L}${" " | "\n" | "\t"}`
  ? TrimRight<L>
  : S;
```

[TrimLeft](https://github.com/type-challenges/type-challenges/blob/main/questions/00106-medium-trimleft/README.md)の
右側版です。ほぼ同じように書くことができます。

間違いなく上の`Fill`のほうがこれより難しいと思います。

## Without

Implement the type version of Lodash.without, `Without<T, U>` takes an Array `T`, number or array `U` and returns an Array without the elements of `U`.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/05117-medium-without/README.md)

### 解答例

```typescript
type Without<T extends any[], U, V extends any[] = []> = T extends [
  infer L,
  ...infer R,
]
  ? U extends any[]
    ? L extends U[number]
      ? Without<R, U, [...V]>
      : Without<R, U, [...V, L]>
    : L extends U
      ? Without<R, U, [...V]>
      : Without<R, U, [...V, L]>
  : V;
```

JavaScript でいうところの[Array.prototype.filter()](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
のようなものを作ります。

最終的な帰り値を`V`として、処理の流れは下の通りです。

1. `T`を先頭`L`とそれ以外`R`に分ける
2. `U`が配列型かつ`U[number]`に`L`を割り当て不可能なら`V`に`L`を加え、そうでないなら`L`を加えて再帰
3. `U`が配列型でなく、`U`に`L`を割り当て不可能なら`V`に`L`を加え、そうでないなら`L`を加えて再帰

言語化能力が低すぎてうまく文字にできている気がしません。

## Trunc

Implement the type version of `Math.trunc`, which takes string or number and returns the integer part of a number by removing any fractional digits.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/05140-medium-trunc/README.md)

### 解答例

```typescript
type Trunc<N extends string | number> =
  `${N}` extends `${infer Digit}.${number}` ? Digit : `${N}`;
```

Template Literal Types を使って `N` を整数部と小数部に分割します。分割できなければそのまま`N`を返します。

## IndexOf

Implement the type version of `Array.indexOf`, `indexOf<T, U>` takes an Array `T`, any `U` and returns the index of the first `U` in Array `T`.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/05153-medium-indexof/README.md)

### 解答例

```typescript
// type-challengesにコピペするときはコメントアウトしてください
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

type IndexOf<T extends any[], U, V extends any[] = []> = T extends [
  infer L,
  ...infer R,
]
  ? Equal<L, U> extends true
    ? V["length"]
    : IndexOf<R, U, [...V, never]>
  : -1;
```

実質的に`Equal`を実装する問題ですが、ちょっと僕はまだ理解ができていないので参考にした記事を書くだけにします。

- [https://qiita.com/Quramy/items/b45711789605ef9f96de](https://qiita.com/Quramy/items/b45711789605ef9f96de)
- [https://zenn.dev/yumemi_inc/articles/ff981be751d26c](https://zenn.dev/yumemi_inc/articles/ff981be751d26c)

## Join

Implement the type version of `Array.join`, `Join<T, U>` takes an Array `T`, string or number `U` and returns the Array `T` with `U` stitching up.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/05310-medium-join/README.md)

### 解答例

```typescript
type Join<
  T extends any[],
  U extends string | number,
  V extends string = "",
> = T extends [infer L extends string, ...infer R extends string[]]
  ? Join<R, U, V extends "" ? `${L}` : `${V}${U}${L}`>
  : V;
```

単純に再帰で 1 文字ずつくっつけていきます。ループの 1 回目だけ`U`を挟まないようにしてあげてます。

## 終わりに

`Equal`がまたしてもでてきてしまいました。本当にこの仕組みを理解できていないので、1 度自分でソースコードを読んだほうがいいかもしれません。

おそらく次の記事で medium 編を終わることができると思います。よっぽど hard はやりません。
