import { defineCollection, z } from "astro:content";

import { glob } from "astro/loaders";

const categories = ["blog", "tech"] as const;

const article = defineCollection({
    loader: glob({ pattern: ["**/*.md", "**/*.mdx"], base: "./src/content/article" }),
    schema: z.object({
        draft: z.boolean().default(false),
        title: z.string(),
        category: z.enum(categories),
        createdAt: z.string(),
        updatedAt: z.string().optional(),
        emoji: z.string(),
        tags: z.array(z.string()).optional().default([]),
        description: z.string().optional(),
    }),
});

export const collections = { article };
