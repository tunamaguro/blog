import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import partytown from "@astrojs/partytown";

import tailwind from "@astrojs/tailwind";

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

// https://astro.build/config
import robotsTxt from "astro-robots-txt";

// https://astro.build/config
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeExcerptContent, rehypeReadingTime],
  },
  integrations: [
    expressiveCode({
      themes: ["one-dark-pro"],
    }),
    mdx(),
    tailwind(),
    react(),
    sitemap(),
    robotsTxt(),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
  site: "https://www.tunamaguro.dev/",
});
