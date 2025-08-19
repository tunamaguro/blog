import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
import react from "@astrojs/react";

// https://astro.build/config
import sitemap from "@astrojs/sitemap";

// remark
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// rehype
import { rehypeExcerptContent } from "./src/plugins/rehypeExcerptPlugin";
import { rehypeReadingTime } from "./src/plugins/rehypeReadingTime";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";

// https://astro.build/config
import robotsTxt from "astro-robots-txt";

// https://astro.build/config
import expressiveCode from "astro-expressive-code";

// https://vanilla-extract.style/documentation/integrations/astro/
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      rehypeKatex,
      rehypeExcerptContent,
      rehypeReadingTime,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          content: fromHtmlIsomorphic(
            `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-link anchor_link">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M9 15l6 -6" />
              <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
              <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
            </svg>
            `,
            { fragment: true }
          ).children,
        },
      ],
    ],
  },
  integrations: [
    expressiveCode({
      themes: ["one-dark-pro"],
    }),
    mdx(),
    react(),
    sitemap(),
    robotsTxt(),
  ],
  site: "https://www.tunamaguro.dev/",
  vite: {
    plugins: [tailwindcss(), vanillaExtractPlugin()],
  },
});
