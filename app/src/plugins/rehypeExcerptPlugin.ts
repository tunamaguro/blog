import { toString } from "hast-util-to-string";
import { truncate, type Options as TruncateOptions } from "hast-util-truncate";
import type { AstroPluginOptions } from "./AstroPluginOption.type";

type Options = TruncateOptions & AstroPluginOptions;

/** @type {import('unified').Plugin<[Options]>} */
export function rehypeExcerptContent(
  options: Options = { property: "excerpt", ellipsis: "…" },
):
  | void
  | import("unified").Transformer<import("hast").Root, import("hast").Root> {
  return function (tree, { data }) {
    const truncatedTree = truncate(tree, { ellipsis: "…", ...options });
    const excerpt = toString(truncatedTree).replaceAll(/\s/g, " ");
    // @ts-ignore See https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically
    data.astro.frontmatter[options.property] = excerpt;
  };
}
