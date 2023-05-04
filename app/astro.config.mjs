import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

// https://astro.build/config
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
import react from "@astrojs/react";

// https://astro.build/config
import sitemap from "@astrojs/sitemap";

// remark
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// https://astro.build/config
import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [mdx(), tailwind(), react(), sitemap(), robotsTxt()],
  site: "http://www.tunamaguro.dev/",
});
