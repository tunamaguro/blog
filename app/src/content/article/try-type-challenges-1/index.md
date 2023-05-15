---

title: "type-challenges をやってみる(easy編)"
date: "2023-01-06"
emoji: "🖊️"
tags: ["tech", "TypeScript"]
---

Typescript の練習として type-challenges をやった備忘録です。

[type-challenges のリポジトリ](https://github.com/type-challenges/type-challenges)

## 内容の訂正

前回の投稿では

```typescript
type A = [...[1, 2, 3]];
```

のようにスプレッド演算子を使って型を展開することを _Spread_ と紹介していましたが、正しくは*variadic-tuple-types*でした。  
誤った情報を掲載してしまい申し訳ありませんでした。

## Hello World

Hello, World!

In Type Challenges, we use the type system itself to do the assertion.

For this challenge, you will need to change the following code to make the tests pass (no type check errors).

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00013-warm-hello-world/README.md)

### 解答例

```typescript
type HelloWorld = string;
```

特に言うことはないです

## Pick

Implement the built-in Pick \<T, K> generic without using it.

Constructs a type by picking the set of properties K from T

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00004-easy-pick/README.md)

### 解答例

```typescript
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
```

組み込み型の Pick を作る問題。これを解くためには以下の 3 つの型を知っておく必要があります。

1. [Keyof Type Operator](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
1. [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
1. [Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

### keyof

keyof はオブジェクト型のキーを リテラル または number のユニオン型として取得できます。  
例えば問題の例にある Todo に使用すると以下のようになります。

```typescript
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type A = keyof Todo; // A = 'title'|'description'|'completed'
```

### Mapped Types

Mapped Types は \{[P in T]:T[P]}のように扱われる型です。T の部分にはユニオン型を入れます。  
P には T のユニオン型の各要素が入れられます。イメージとしては for...in を思い浮かべると理解しやすいかもしれません。  
下に例を示します。

```typescript
type T = "aaa" | "bbb";

// A = {
//   aaa : "aaa"
//   bbb : "bbb"
// }
type A = { [P in T]: P };
```

### Indexed Access Types

Indexed Access Types はオブジェクト型のプロパティの型を取得できます。通常のオブジェクトをイメージすると良いと思います。  
例えば問題の例にある Todo に使用すると以下のようになります。

```typescript
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type A = Todo["title"]; // A = string
```

## Readonly

Implement the built-in Readonly\<T> generic without using it.

Constructs a type with all properties of T set to readonly, meaning the properties of the constructed type cannot be reassigned.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00007-easy-readonly/README.md)

### 解答例

```typescript
type MyReadonly<T> = { readonly [P in keyof T]: T[P] };
```

組み込み型の Readonly を作る問題。これを解くためには Mapping Modifiers を知っておく必要があります。

[Mapping Modifiers](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

### Mapping Modifiers

Mapping Modifiers は上の Mapping Types のマップに*readonly*や?を付ける事ができます。  
+または-で修飾子を追加または削除ができ、これらの接頭辞を与えない場合は+として処理されます。  
下に例を示します。

```typescript
interface Todo {
  readonly title: string;
  description: string;
}

// A={
//   readonly title: string
//   readonly description: string
// }
type A = { +readonly [P in keyof Todo]: Todo[P] };

// B={
//   title: string
//   description: string
// }
type B = { -readonly [P in keyof Todo]: Todo[P] };
```

### Tuple to Object

Given an array, transform it into an object type and the key/value must be in the provided array.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00011-easy-tuple-to-object/README.md)

### 解答例

```typescript
type TupleToObject<T extends readonly any[]> = { [P in T[number]]: P };
```

tuple 型をオブジェクト型に変換する問題です。  
これを Indexed Access Types を少し詳しく知っておく必要があります。

[Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

下に例を示します(上の引用)。

```typescript
const MyArray = [
  { name: "Alice", age: 15 },
  { name: "Bob", age: 23 },
  { name: "Eve", age: 38 },
];

// Person = {
//   name: string;
//   age: number;
// }
type Person = (typeof MyArray)[number];

// Age = number
type Age = (typeof MyArray)[number]["age"];

// Or
// Age2 = number
type Age2 = Person["age"];

// Tips:これはよく知られていることですが、配列のlengthは長さの型を持っています
type A = ["aaa", "bbb"];

// B = 2
type B = A["length"];
```

## First of Array

Implement a generic First\<T> that takes an Array T and returns its first element's type.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00014-easy-first/README.md)

### 解答例

```typescript
type First<T extends any[]> = T extends [] ? never : T[0];
```

配列の先頭の型を取得する問題です。ただし、空配列が渡された際の挙動に注意する必要があります。  
この問題は、以下の 2 つの機能を知っていれば解くことができます。

1. [Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
1. [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

上の問題を解いていれば先頭の型を取得する方法は察しがついているかと思います。ここで注意する必要があるのは空配列が与えられた場合についてです。  
単純に下のようにしてしまうと空配列が与えられた場合うまく動作しません。なぜなら空配列は 0 というプロパティを持っていないからです。

```typescript
type First<T extends any[]> = T[0];

type a = First<[]>; // a = undefined
```

そこで配列が空どうかチェックし、空なら never を、そうでなければ T[0]を返すようにします。  
この条件分岐の実装には Conditional Types が必要です。これは三項演算子のように型を書く事ができます。

```typescript
type First<T extends any[]> = T extends [] ? never : T[0];

type a = First<[]>; // a = never
```

## Length of Tuple

For given a tuple, you need create a generic Length, pick the length of the tuple

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00018-easy-tuple-length/README.md)

### 解答例

```typescript
type Length<T extends readonly any[]> = T["length"];
```

与えられた型の長さを取得する問題です。これは上で紹介した内容を知っていれば解くことができます。  
(予想外にも)上で触れているように配列の長さを T["length"]のように取得できます。  
そのため、下のようにしたいところですがこれではエラーが出てしまいます。

```typescript
type Length<T> = T["length"];
// Type '"length"' cannot be used to index type 'T'.
```

エラーを見ると、"T はプロパティ index を持ってないよ!!"と書いてあるのでそれを持っていることを typescript に教えてあげます。
T extends \{length : number}のようにしても良いですが、これでは string 型も通してしまいます。  
場合によるとは思いますが、今回は配列の長さを取得する型としているので any[]のようにしたほうが無難だと思います。

## Exclude

Implement the built-in Exclude\<T, U>

> Exclude from T those types that are assignable to U

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00043-easy-exclude/README.md)

### 解答例

```typescript
type MyExclude<T, U> = T extends U ? never : T;
```

Exclude は与えられた U に割り当てられる型を T から取り除く型です。ユニオン型から特定の型を取り除く際に使われます。  
この問題を解く際に重要なことは Conditional Types を適用する際に分配されるということです。下に例を引用して示します。

[分配の記載部分](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

```typescript
type ToArray<Type> = Type extends any ? Type[] : never;

// A = string[] | number[];
// not (string|number)[]
type A = ToArray<string | number>;
```

そのため、T の各型について U に割り当てられるなら never を、そうでないなら T を返せば良いです。

## Awaited

If we have a type which is wrapped type like Promise. How we can get a type which is inside the wrapped type?

For example: if we have Promise\<ExampleType> how to get ExampleType?

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00189-easy-awaited/README.md)

### 解答例

※もっときれいな書き方があると思います。

```typescript
type MyAwaited<T extends PromiseLike<any>> = T extends PromiseLike<infer R>
  ? R extends PromiseLike<any>
    ? MyAwaited<R>
    : R
  : never;
```

Promse\<T>の T を返す問題です。この問題は infer を知っていれば解くことができます。

[Inferring Within Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)

infer は Conditional Types で使用することができる型で下のように使います。

```typescript
type Flatten<T> = T extends Array<infer Q> ? Q : T;
// Flatten<number[]> = number

type UnPromise<T> = T extends Promise<infer R> ? R : T;
// UnPromise<Promise<string>> = string
```

あとは再帰に気をつけて書くことができます。

## If

Implement the util type If\<C, T, F> which accepts condition C, a truthy value T, and a falsy value F. C is expected to be either true or false while T and F can be any type.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00268-easy-if/README.md)

### 解答例

```typescript
type If<C extends boolean, T, F> = C extends true ? T : F;
```

型の条件分岐を行う問題です。上で紹介した Conditional Types を使って解くことができます。

[Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

## Concat

Implement the JavaScript Array.concat function in the type system. A type takes the two arguments. The output should be a new array that includes inputs in ltr order

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00533-easy-concat/README.md)

### 解答例

```typescript
type Concat<T extends any[], U extends any[]> = [...T, ...U];
```

与えられた型を Array.concat のように結合する問題です。実は Typescript でもスプレッド演算子を使う事ができます。

[variadic-tuple-types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)

これを知っていればもう解答は想像できるでしょう。

## Includes

Implement the JavaScript Array.includes function in the type system. A type takes the two arguments. The output should be a boolean true or false.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/00898-easy-includes/README.md)

解けませんでした。。。 正直一番この中で難しい問題だと思います。
下の文は色々検証してみた記録です。

配列型 T の中に U
が含まれているか判定する問題。単純に考えると以下のようになると思います。

```typescript
type Includes<T extends readonly any[], U> = U extends T[number] ? true : false;
```

しかし、これではいくつかのケースに対応できません。そこで、簡単なテストを作り実際の動作を見てみましょう。

```typescript
type Check<T, U> = U extends T ? "Yes" : "No";

type boolfalse = Check<boolean, false>; // "Yes"
type truebool = Check<true, boolean>; // "Yes" | "No"

type objreadonlyobj = Check<{ a: "A" }, { readonly a: "A" }>; // "Yes"
type readonlyobjobj = Check<{ readonly a: "A" }, { a: "A" }>; // "Yes"

type unionnumber = Check<1, 1 | 2>; // "Yes" | "No"
type unionnumber = Check<1 | 2, 1>; // "Yes"
```

ユニオン型については予想通りですがそれいがは少し意外ですね。ここから以下の様なことがわかります。

- boolean の実態は true | false
- object の修飾子 readonly は extends に影響しない

つまり、型が同じかどうか厳密に判定できる下のような型 Equals があればいけそうです。

```typescript
type Equals<T, U> =...なんかすごい処理 => true | false;

type A=Equals<{ a: "A" }, { readonly a: "A" }> //false
type B=Equals<true, boolean> // false
type C=Equals<1, 1 | 2> //false

type Includes<T extends readonly any[], U> = T extends [infer R, ...infer S]
  ? Equals<R, U> extends true
    ? true
    : Includes<S, U>
  : false;
```

やっていることは、先頭を取り出して Equals===true なら true を返しそうでなければ残りを再度 Includes に入れているだけです。  
ただ、こうなるような Equals が思いつきませんでした。また時間があるときに詳しく調べて解説記事を書きます。

## Push

Implement the generic version of Array.push

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03057-easy-push/README.md)

### 解答例

```typescript
type Push<T extends any[], U> = [...T, U];
```

上の Concat と同じように解けます。

## Unshift

Implement the type version of Array.unshift

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03060-easy-unshift/README.md)

### 解答例

```typescript
type Unshift<T extends any[], U> = [U, ...T];
```

上の Push と同じように解けます。

## Parameters

Implement the built-in Parameters generic without using it.

[問題](https://github.com/type-challenges/type-challenges/blob/main/questions/03312-easy-parameters/README.md)

### 解答例

```typescript
type MyParameters<T extends (...args: any[]) => any> = T extends (
  ...args: infer R
) => any
  ? R
  : never;
```

関数の引数の型をタプルで取得する問題です。javascript の残余引数を知っていればすぐ思いついたのではないでしょうか。

1. [残余引数(MDN)](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Functions/rest_parameters)
1. [variadic-tuple-types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)
1. [Inferring Within Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)

## 終わりに

これを書きながら解いていたら夜が明けてしまったので、残りは明日以降解きます。  
やはり、普段からこういった文章を書いていないせいで 1 つ 1 つの文を考えるのに非常に時間がかかりました。  
ただ、人が見ているかもしれないと考えると情報を確かなものにしなくてはならないという**義務感**が生まれたので、これからも学んだことはここに書き連ねていこうと思います。
