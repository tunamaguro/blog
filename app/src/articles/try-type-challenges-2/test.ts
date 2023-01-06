type KebabCase<S extends string> = S extends `${infer L}${infer R}`
  ? R extends Uncapitalize<R>
    ? `${Lowercase<L>}${KebabCase<R>}`
    : `${Lowercase<L>}-${KebabCase<R>}`
  : S;

type A = KebabCase<"ABC">;
