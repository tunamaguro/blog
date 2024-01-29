// 1. Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";

const categories = ["blog", "tech"] as const;
// 2. Define your collection(s)
const ArticleCollection = defineCollection({
  schema: z.object({
    draft:z.boolean().default(false),
    title: z.string(),
    category: z.enum(categories),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    emoji: z.string(),
    tags: z.array(z.string()).optional().default([]),
    description: z.string().optional(),
  }),
});
// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"
export const collections = {
  article: ArticleCollection,
};
