---
title: "type-challenges をやってみる(medium編その1)"
createdAt: "2023-01-07"
emoji: "📝"
category: "tech"
tags:
  - "TypeScript"
---

Typescript の練習として type-challenges をやった備忘録です。

[type-challenges のリポジトリ](https://github.com/type-challenges/type-challenges)

[前回](</articles/20230106-type-challenges%20をやってみる(easy編)>)は easy を解きましたが、今回は medium をやっていきます。

## Get Return Type

Implement the built-in ReturnType\<T> generic without using it.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00002-medium-return-type/README.md)

### 解答例

```typescript
type MyReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : never;
```

ReturnType は T が関数型のとき、その返り値の型を返すような型です。  
easy で使用していた infer を使って解くことができます。それを知っていればそこまで難しくないでしょう。

[Inferring Within Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)

## 問題名

Implement the built-in Omit\<T, K> generic without using it.

Constructs a type by picking all properties from T and then removing K

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00003-medium-omit/README.md)

### 解答例

```typescript
type MyOmit<T extends object, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};
```

Omit は K のプロパティを T から取り除く型です。組み込み型である Exclude を使えば、容易に書くことができます。  
ちなみに Exclude は与えられた U に割り当てられる型を T から取り除く型です。詳細については[前回](</articles/20230106-type-challenges%20をやってみる(easy編)>)を参照してください。

```typescript
type Exclude<T, U> = T extends U ? never : T;
```

## Readonly 2

Implement a generic MyReadonly2\<T, K> which takes two type argument T and K.

K specify the set of properties of T that should set to Readonly. When K is not provided, it should make all properties readonly just like the normal Readonly\<T>.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00008-medium-readonly-2/README.md)

### 解答例

```typescript
type MyReadonly2<T extends object, K extends keyof T = keyof T> = Omit<T, K> & {
  +readonly [P in K]: T[P];
};
```

与えられた T のプロパティのうち、K に割り当てられるものを readonly にする問題です。  
この問題を解くには、以下の 4 個の機能を知っておく必要があります。

1. [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
1. [Mapping Modifiers](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
1. [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
1. [Intersection Types](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)

はじめは簡単に、K に割り当て可能なプロパティのみ取り出す型を考えます。[easy で行った Pick 型](https://github.com/type-challenges/type-challenges/blob/main/questions/00004-easy-pick/README.md)そのままです。

```typescript
type MyReadonly2<T extends object, K extends keyof T> = { [P in K]: T[P] };
```

続いて、readonly を Mapping Modifiers を使って付けます。readonly の+はあってもなくても問題ありません。

```typescript
type MyReadonly2<T extends object, K extends keyof T> = {
  +readonly [P in K]: T[P];
};
```

これでは、K に割り当て可能なプロパティしかありませんので、それ以外の型を Omit で取り出しそれと交差型にします。

```typescript
type MyReadonly2<T extends object, K extends keyof T> = Omit<T, K> & {
  +readonly [P in K]: T[P];
};
```

最後に、K が与えられなかった際にすべてのプロパティを readonly にするためにデフォルト型引数を与えます。  
デフォルト型引数は通常のデフォルト引数のように、与えられなかった場合の型を指定する事ができます。
ドキュメントについては以下を参照してください。ただ、[公式のドキュメント](https://www.typescriptlang.org/docs/handbook/2/generics.html)で記載を見つけられなかったので、有志の方々が作られたページです。

[デフォルト型引数](https://typescriptbook.jp/reference/generics/default-type-parameter)

```typescript
type MyReadonly2<T extends object, K extends keyof T = keyof T> = Omit<T, K> & {
  +readonly [P in K]: T[P];
};
```

## Deep Readonly

Implement a generic DeepReadonly\<T> which make every parameter of an object - and its sub-objects recursively - readonly.

You can assume that we are only dealing with Objects in this challenge. Arrays, Functions, Classes and so on do not need to be taken into consideration. However, you can still challenge yourself by covering as many different cases as possible.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00009-medium-deep-readonly/README.md)

### 解答例

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: keyof T[P] extends never ? T[P] : DeepReadonly<T[P]>;
};
```

子要素を含む全てのプロパティを readonly にする問題です。はじめに、通常の Readonly を考えます。

```typescript
type DeepReadonly<T extends object> = { readonly [P in keyof T]: T[P] };
```

T のプロパティ(つまり T[P])がオブジェクト型の場合、それも readonly にしたいので再帰させます。

```typescript
type DeepReadonly<T extends object> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

しかしこれでは T[P]が配列の場合に Expected1 のように配列を readonly にできません。

```typescript
type Expected1 = {
  readonly a: () => 22;
  readonly b: string;
  readonly c: {
    readonly d: boolean;
    readonly e: {
      readonly g: {
        readonly h: {
          readonly i: true;
          readonly j: "string";
        };
        readonly k: "hello";
      };
      // ここから
      readonly l: readonly [
        "hi",
        {
          readonly m: readonly ["hey"];
        },
      ];
      // ここまで
    };
  };
};
```

そこで、すこし発想を変え keyof T[P]が never ではないとき===Array や object であるときに再帰させるようにします。

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: keyof T[P] extends never ? T[P] : DeepReadonly<T[P]>;
};
```

これですべてのテストケースを通ることができました。
ただ、string や number を与えた際の挙動がイメージしにくいのでここまでやらなくても良いかもしれません。

## Tuple to Union

Implement a generic TupleToUnion\<T> which covers the values of a tuple to its values union.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00010-medium-tuple-to-union/README.md)

### 解答例

```typescript
type TupleToUnion<T extends any[]> = T[number];
```

タプルの要素を取り出してユニオン型にする問題です。  
easy の[Tuple to Object](https://github.com/type-challenges/type-challenges/blob/main/questions/00011-easy-tuple-to-object/README.md)が解けていれば簡単に解けると思います。

## Chainable Options

Chainable options are commonly used in Javascript. But when we switch to TypeScript, can you properly type it?

In this challenge, you need to type an object or a class - whatever you like - to provide two function option(key, value) and get(). In option, you can extend the current config type by the given key and value. We should about to access the final result via get.

For example

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00012-medium-chainable-options/README.md)

### 解答例

```typescript
type Chainable<V = {}> = {
  option<T extends string, U extends any>(
    key: T extends keyof V ? never : T,
    value: U,
  ): Chainable<{ [P in T]: U } & Omit<V, T>>;
  get(): V;
};
```

チェーンできるようなオブジェクト型を作る問題。とりあえず、できることからやってみるのが良いと思います。  
はじめに、引数 key と value の型がわからないとどうしようもないのでジェネリクスを付けます。とりあえずで、返り値はプロパティ T が U であるような型にしておきます。

```typescript
type Chainable = {
  option<T extends string, U extends any>(key: T, value: U): { [P in T]: U };
  get(): any;
};
```

次に、Chainable は option の返り値の型を覚えておく必要があるので、それ用のジェネリクスを増やします。  
同時に、option=>Chainable である必要があるのでそのように書き換え、ついでに get=>V にしておきます。

```typescript
type Chainable<V = {}> = {
  option<T extends string, U extends any>(
    key: T,
    value: U,
  ): Chainable<{ [P in T]: U } & V>;
  get(): V;
};
```

これで V には option で呼び出した記録が残されるようになりました。  
現状では、result3 の name が string|number になってしまっているので、同じプロパティの場合それを忘れるようにします。  
これには Utility Types の Omit を使うと楽だと思います。

[Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

```typescript
type Chainable<V = {}> = {
  option<T extends string, U extends any>(
    key: T,
    value: U,
  ): Chainable<{ [P in T]: U } & Omit<V, T>>;
  get(): V;
};
```

最後に同じ key で呼ばれた際にエラーを返すようにします。これは言い換えると T が keyof V を満たすということなので、
その場合に key の型が never になるように書き換えます。

```typescript
type Chainable<V = {}> = {
  option<T extends string, U extends any>(
    key: T extends keyof V ? never : T,
    value: U,
  ): Chainable<{ [P in T]: U } & Omit<V, T>>;
  get(): V;
};
```

三項演算子が大体どこでも使えるのが意外ですね。

## Last of Array

Implement a generic Last\<T> that takes an Array T and returns its last element.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00015-medium-last/README.md)

### 解答例

```typescript
type Last<T extends any[]> = T extends [...any, infer R] ? R : never;
```

配列の最後の型を取得する問題です。はじめは下のようにやりたくなりますが、

```typescript
type Last<T extends any[]> = T[T["length"]-1]
```

型の四則演算は通常の javascript のようにはできません。  
そこで、配列を 1 つずつ取っていって最後の要素を取り出すということを考えてみます。これには[variadic-tuple-types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)
が使えます。雑に言うと、スプレッド演算子を型でも使うことができます。そうしたら、最後の型を infer で取得すれば問題を解くことができました。  
javascript では上のような構文はエラーになってしまうので、思いつきにくいかもしれません。

## Pop

> TypeScript 4.0 is recommended in this challenge

Implement a generic Pop\<T> that takes an Array T and returns an Array without it's last element.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00016-medium-pop/README.md)

### 解答例

```typescript
type Pop<T extends any[]> = T extends [...infer R, any] ? R : [];
```

配列型から最後の要素を取り除く型を作る問題です。  
上の Last が理解できていればつまずくことはないと思います。

## Promise.all

Type the function PromiseAll that accepts an array of PromiseLike objects, the returning value should be Promise\<T> where T is the resolved result array.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00020-medium-promise-all/README.md)

### 解答例

```typescript
declare function PromiseAll<T extends any[]>(
  values: readonly [...T],
): Promise<{
  [P in keyof T]: Awaited<T[P]>;
}>;
```

PromiseAll は配列を受け取りそれを、Promise でラップしたものを返す関数です。とりあえず、そこから書いていきます。

```typescript
declare function PromiseAll<T extends any[]>(values: [...T]): Promise<T>;
```

エラーが出てきました。エラーを見ると*values に readonly が足りないよ!!*と書いてあるので付け加えます。

```typescript
declare function PromiseAll<T extends any[]>(
  values: readonly [...T],
): Promise<T>;
```

残っているエラーを見ると、配列内の Promise をアンラップして返す必要があるようです。  
extends Promise\<infer R>...としてもいいですが、面倒なので Utility Types の Awaited を使います。

[Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

```typescript
declare function PromiseAll<T extends any[]>(
  values: readonly [...T],
): Promise<{
  [P in keyof T]: Awaited<T[P]>;
}>;
```

## Type Lookup

Sometimes, you may want to lookup for a type in a union to by their attributes.

In this challenge, we would like to get the corresponding type by searching for the common type field in the union Cat | Dog. In other words, we will expect to get Dog for LookUp\<Dog | Cat, 'dog'> and Cat for LookUp\<Dog | Cat, 'cat'> in the following example.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00062-medium-type-lookup/README.md)

### 解答例

```typescript
type LookUp<U, T> = U extends { type: T } ? U : never;
```

ユニオン型から特定の要素を使って型を取り出す問題です。  
easy でも取り扱った Conditional Types による型の分配を使って解くことができます。

[分配の記載部分](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

```typescript
type LookUp<U, T> = U extends { type: T } ? U : never;

interface Cat {
  type: "cat";
  breeds: "Abyssinian" | "Shorthair" | "Curl" | "Bengal";
}

interface Dog {
  type: "dog";
  breeds: "Hound" | "Brittany" | "Bulldog" | "Boxer";
  color: "brown" | "white" | "black";
}

type Animal = Cat | Dog;

type A = LookUp<Animal, "dog">; // Dog
// Animal => Cat | Dog
// => never | Dog
// => Dog
```

## Trim Left

Implement TrimLeft\<T> which takes an exact string type and returns a new string with the whitespace beginning removed.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00106-medium-trimleft/README.md)

### 解答例

```typescript
type TrimLeft<S extends string> = S extends `${" " | "\n" | "\t"}${infer R}`
  ? TrimLeft<R>
  : S;
```

文字列リテラルを受け取り先頭の空白を削除した新しい文字列リテラルを返す問題です。  
とりあえず予想で型を書くと下のようになるでしょうか。

```typescript
type TrimLeft<S extends string> = 空白を削除する処理
  ? TrimLeft<R>
  : S;
```

この空白を削除する処理には Template Literal Types を使う事ができます。

[Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

これを用いると下のように書けるでしょう。

```typescript
type TrimLeft<S extends string> = S extends ` ${infer R}` ? TrimLeft<R> : S;
```

しかしこれではいくつかのテストケースでパスしないようです。よく見ると" "だけでなく"\n"や"\t"も含まれています。  
嬉しいことに、Union 型を Template Literal Types で使うと可能性のある全ての文字列リテラルに変換してくれます。  
なので、extends ...extends...と地獄のように何個も書く必要はありません。

```typescript
// `${" " | "\n" | "\t"}${infer R}` = ` ${infer R}` | `\n${infer R}` | `\t${infer R}`;
type TrimLeft<S extends string> = S extends `${" " | "\n" | "\t"}${infer R}`
  ? TrimLeft<R>
  : S;
```

## Trim

Implement Trim\<T> which takes an exact string type and returns a new string with the whitespace from both ends removed.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00108-medium-trim/README.md)

### 解答例

```typescript
type space = " " | "\n" | "\t";
type TrimLeft<S extends string> = S extends `${space}${infer R}`
  ? TrimLeft<R>
  : S;
type TrimRight<S extends string> = S extends `${infer R}${space}`
  ? TrimRight<R>
  : S;
type Trim<S extends string> = TrimLeft<TrimRight<S>>;
```

TrimRight の両端版です。特に言うことはありません。

## Capitalize

Implement Capitalize\<T> which converts the first letter of a string to uppercase and leave the rest as-is.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00110-medium-capitalize/README.md)

### 解答例

```typescript
type MyCapitalize<S extends string> = S extends `${infer R}${infer U}`
  ? `${Uppercase<R>}${U}`
  : Uppercase<S>;
```

先頭の文字を大文字にする問題です。これを行うには Intrinsic String Manipulation Types が必要です。

[Intrinsic String Manipulation Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html#intrinsic-string-manipulation-types)

Intrinsic String Manipulation Types は文字列操作で利用できる型です。これは typescript コンパイラに組み込まれており、typescript の型定義ファイルには含まれていません。  
仮に Intrinsic String Manipulation Types を使わないとしたら以下のようになるでしょうか。

```typescript
type Chars = { a: "A"; b: "B",... };
type MyCapitalize<S extends string> = S extends `${infer R}${infer U}`
  ? `${R extends keyof Chars?Chars[R]:R}${U}`
  : S;
```

動作確認はしてないので各自で確かめてみてください。

## Replace

Implement Replace\<S, From, To> which replace the string From with To once in the given string S

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00116-medium-replace/README.md)

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
```

とりあえず型を書くと下のようになるでしょうか。

```typescript
type Replace<
  S extends string,
  From extends string,
  To extends string,
> = S extends `${infer L}${From}${infer R}` ? `${L}${To}${R}` : S;
```

しかし、これでは From に""が与えられたときにエラーになってしまいます。

```typescript
type Replace<
  S extends string,
  From extends string,
  To extends string,
> = S extends `${infer L}${From}${infer R}` ? `${L}${To}${R}` : S;

type A = Replace<"foobarbar", "", "foo">; // "ffoooobarbar"
```

これはマッチしないパターンのとき、1 文字のみ切り取るという仕様になっているためです。  
そこで、From が""だったときには、さっさと S を返すようにします。

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
```

条件分岐の方法が三項演算子のような extends しかないために、非常に見にくいですね。

## ReplaceAll

Implement ReplaceAll\<S, From, To> which replace the all the substring From with To in the given string S

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00119-medium-replaceall/README.md)

### 解答例

```typescript
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string,
> = From extends ""
  ? S
  : S extends `${infer L}${From}${infer R}`
    ? `${L}${To}${ReplaceAll<R, From, To>}`
    : S;
```

先程の Replace をすべての文字列で行います。  
infer を使った場合最短の文字列が返ってきます(要出典)。したがって、R に対して再帰的に処理をすることですべての From に対して変換をすることができます。

下の例だと処理ができなくなるまでループしてしまうので、今回のテストケースをパスしません。

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

type ReplaceAll<S extends string, From extends string, To extends string> =
  S extends Replace<S, From, To>
    ? S
    : ReplaceAll<Replace<S, From, To>, From, To>;

type A = ReplaceAll<"foobarfoobar", "ob", "b">; // "fbarfbar"
```

## Append Argument

For given function type Fn, and any type A (any in this context means we don't restrict the type, and I don't have in mind any type 😉) create a generic type which will take Fn as the first argument, A as the second, and will produce function type G which will be the same as Fn but with appended argument A as a last one.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00191-medium-append-argument/README.md)

### 解答例

```typescript
type AppendArgument<Fn extends (...args: any) => any, A> = Fn extends (
  ...args: infer R
) => infer S
  ? (...args: [...R, A]) => S
  : never;
```

引数を増やす問題です。おおかた予想通りの解答だと思います。  
...typescript の型では引数名の区別はしていないようです。javascript の仕様通りですね。

## Permutation

Implement permutation type that transforms union types into the array that includes permutations of unions.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00296-medium-permutation/README.md)

### 解答例

```typescript
type Permutation<T, U = T> = [U] extends [never]
  ? []
  : T extends never
    ? []
    : [T, ...Permutation<Exclude<U, T>>];
```

ひとまず、ユニオン型を配列にします。そのために Conditional Types を利用します。

[分配の記載部分](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

```typescript
type Permutation<T> = T extends never ? never : [T];

type A = Permutation<"A" | "B" | "C">; // ["A"] | ["B"] | ["C"]
```

すると、T をユニオン型を構成する型ごとに分解できました。残りは、下のようになれば良さそうです。

```typescript
type Permutation<T> = T extends never ? never : [T, ...Permutation<何か>];

type A = Permutation<"A" | "B" | "C">;
```

ここで、型引数 U で T のコピーを取り、Permutation\<Exclude\<U,T>>のようにしてみます。

```typescript
type Permutation<T, U = T> = T extends never
  ? []
  : [T, ...Permutation<Exclude<U, T>>];

type A = Permutation<"A" | "B" | "C">; // never
```

なにかの都合が良くないようです。試行錯誤していると下のような形になりました。

```typescript
type Permutation<T, U = T> = U extends never
  ? []
  : [T] extends [never]
    ? []
    : [U, Permutation<Exclude<T, U>>];

type A = Permutation<"A" | "B" | "C">; // ["A", ["B", ["C", never]] | ["C", ["B", never]]] | ["B", ["A", ["C", never]] | ["C", ["A", never]]] | ["C", ["A", ["B", never]] | ["B", ["A", never]]]
```

配列をフラットにしたら良さそうなので、T と U の順番を入れ替え更にスプレッド演算子で展開します。

```typescript
type Permutation<T, U = T> = [U] extends [never]
  ? []
  : T extends never
    ? []
    : [T, ...Permutation<Exclude<U, T>>];

type A = Permutation<"A" | "B" | "C">; // ["A", "B", "C"] | ["A", "C", "B"] | ["B", "A", "C"] | ["B", "C", "A"] | ["C", "A", "B"] | ["C", "B", "A"]
```

正直、なぜこれで動いているのかよくわかっていないのでまたどこかで記事にしてまとめます。

## Length of String

Compute the length of a string literal, which behaves like String#length.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00298-medium-length-of-string/README.md)

### 解答例

```typescript
type LengthOfString<S extends string, T extends any[] = []> = S extends ""
  ? T["length"]
  : S extends `${infer L}${infer R}`
    ? LengthOfString<R, [...T, L]>
    : never;
```

文字数を型として取得する問題です。  
単純に S["lenght"]とすれば良さそうですが、number が返ってきてしまいます。

```typescript
type LengthOfString<S extends string> = S["length"];

type A = LengthOfString<"">; // number
```

少し考え方を変え、1 文字ずつ削除していきその回数をタプルとして持っておき、空になった際にタプル["length"]を返すことにします。  
こうすることで、文字数を型として得ることができました。

## Flatten

In this challenge, you would need to write a type that takes an array and emitted the flatten array type.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00459-medium-flatten/README.md)

### 解答例

```typescript
type Flatten<T extends any[]> = T extends [infer R, ...infer S]
  ? R extends any[]
    ? [...Flatten<R>, ...Flatten<S>]
    : [R, ...Flatten<S>]
  : [];
```

型のフラットを行う問題です。  
上の問題と同じように左から 1 要素ずつ配列かどうか検証し、配列なら展開、そうでなければタプル要素として配置を繰り返し行います。

## Append to object

Implement a type that adds a new field to the interface. The type takes the three arguments. The output should be an object with the new field.

For example

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00527-medium-append-to-object/README.md)

### 解答例

```typescript
type AppendToObject<T, U extends string, V> = {
  [P in keyof T | U]: P extends keyof T ? T[P] : V;
};
```

交差型ではなく、オブジェクトのプロパティを増やす必要があります。

```typescript
type AppendToObject<T, U extends string, V> = { [P in U]: V } & T;

type test3 = {
  key: "cow";
  value: "yellow";
  sun: false;
};

// A = {
//     isMotherRussia: false | undefined;
// } & test3
type A = AppendToObject<test3, "isMotherRussia", false | undefined>;
```

## Absolute

Implement the Absolute type. A type that take string, number or bigint. The output should be a positive number string

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00529-medium-absolute/README.md)

### 解答例

```typescript
type Absolute<T extends number | string | bigint> = `${T}` extends `-${infer R}`
  ? R
  : `${T}`;
```

今回の問題で重要な点は、Absolute\<-100>が 100 ではなく"100"を返すことです。つまり、数値型ではなく文字列リテラルを返すということに気づければ、解けると思います。

[Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

## String to Union

Implement the String to Union type. Type take string argument. The output should be a union of input letters

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00531-medium-string-to-union/README.md)

### 解答例

```typescript
type StringToUnion<T extends string> = T extends `${infer R}${infer S}`
  ? R | StringToUnion<S>
  : never;
```

文字列の先頭から 1 文字ずつ取得し、それをユニオン型に押し込みます。never 型をユニオン型に取っても型は変化しません。

```typescript
type A = number | never; // number
```

## Merge

Merge two types into a new type. Keys of the second type overrides keys of the first type.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00599-medium-merge/README.md)

### 解答例

```typescript
type Merge<F, S> = {
  [P in keyof F | keyof S]: P extends keyof S
    ? S[P]
    : P extends keyof F
      ? F[P]
      : never;
};
```

[Append to object](https://github.com/type-challenges/type-challenges/blob/main/questions/00527-medium-append-to-object/README.md)
と同じ処理をしましょう。ただし、テストケースを見るとプロパティの優先度は S\>F となっているので、条件分岐の順番には注意する必要があります。

## KebabCase

Replace the camelCase or PascalCase string with kebab-case.

FooBarBaz -> foo-bar-baz

[問題](https://github.com/type-challenges/type-challenges/issues/21332)

### 解答例

```typescript
type KebabCase<S extends string> = S extends `${infer L}${infer R}`
  ? R extends Uncapitalize<R>
    ? `${Lowercase<L>}${KebabCase<R>}`
    : `${Lowercase<L>}-${KebabCase<R>}`
  : S;
```

camelCase 及び CamelCase を kebab-case に変換する問題です。  
とりあえず、再帰の原型を書いてみます。L には左端の文字、R には残りが入ってきます。

```typescript
type KebabCase<S extends string> = S extends `${infer L}${infer R}`
  ? `${Lowercase<L>}${KebabCase<R>}`
  : S;
```

R に注目すると R の先頭が大文字のとき、camelCase と CamelCase 両方でハイフンが入ることがわかります。

```typescript
type KebabCase<S extends string> = S extends `${infer L}${infer R}`
  ? R extends 先頭が大文字
    ? `${Lowercase<L>}-${KebabCase<R>}`
    : `${Lowercase<L>}${KebabCase<R>}`
  : S;
```

[ドキュメント](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html#intrinsic-string-manipulation-types)
を読むと、Capitalize がいい感じに使えそうなのでこれを使って判定していきます。

```typescript
type KebabCase<S extends string> = S extends `${infer L}${infer R}`
  ? R extends Capitalize<R>
    ? `${Lowercase<L>}-${KebabCase<R>}`
    : `${Lowercase<L>}${KebabCase<R>}`
  : S;

type A = KebabCase<"FooBarBaz">; // "foo-bar-baz-"
```

いらないところにもハイフンがついてしまいました。よく考えると最終的に R には""が入ってくるため、当然

```typescript
type A = "" extends Capitalize<""> ? true : false; // true
```

となっていました。なので、先頭が大文字**でない**ことを判定するように変更しましょう。

```typescript
type KebabCase<S extends string> = S extends `${infer L}${infer R}`
  ? R extends Uncapitalize<R>
    ? `${Lowercase<L>}${KebabCase<R>}`
    : `${Lowercase<L>}-${KebabCase<R>}`
  : S;
```

## 終わりに

長い駄文をここまで読んでくださりありがとうございます。

そろそろ夜が明けて来てしまったので、今回はここで終わりにしようと思います。  
問題を解いていくと、自分が知らなかった知識やテクニックが見についていってとても楽しいです。  
ですが、まだ良くわかっていないところ(Permutation 等)も多く残っているので時間があるときに調べて、きっちり理解できるようにします。

もし、記事内容に誤り等があれば Issue をだしていただくか、私の DM にお願いします。

残りの問題は明日以降解きます。
