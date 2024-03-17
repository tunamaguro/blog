import { toString } from "hast-util-to-string";
import readingTime from "reading-time";
import type { AstroPluginOptions } from "./AstroPluginOption.type";

/** @type {import('unified').Plugin<[Options]>} */
export function rehypeReadingTime(
  options: AstroPluginOptions = { property: "minutesRead" },
):
  | void
  | import("unified").Transformer<import("hast").Root, import("hast").Root> {
  return function (tree, { data }) {
    const plainText = toString(tree);
    const stats = readingTime(plainText);
    // @ts-ignore See https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically
    data.astro.frontmatter[options.property] = stats.text;
  };
}
