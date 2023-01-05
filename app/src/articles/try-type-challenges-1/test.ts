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

type a = [Includes<[{}], { a: "A" }>];

type Check<T, U> = U extends T ? "Yes" : "No";

type b = [
  // Check<boolean, false>,
  // Check<true, boolean>,
  Check<{ a: "A" }, { readonly a: "A" }>,
  Check<{ readonly a: "A" }, { a: "A" }>
  // Check<1, 1 | 2>,
  // Check<1 | 2, 1>
];
