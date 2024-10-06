export const slugfy = (s: string) =>
  s
    .replaceAll(/^\p{Z}+|\p{Z}+$/gu, "") // 先頭か末尾の空白を削除
    .toLowerCase()
    .replaceAll(/[^a-zA-Z\d\s]/g, "") // alphanumericまたは空白でない文字列を削除
    .replaceAll(/\s+/g, "-") // 空白をハイフンに置換
    .replaceAll(/-+/g, "-"); // 連続したハイフンを削除

export const iconTransitionName = (slug: string) => `${slug}-icon`;
export const titleTransitionName = (slug: string) => `${slug}-title`;
