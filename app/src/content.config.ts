import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const categories = ["blog", "tech"] as const;



const articleSchema = z.object({
  draft: z.boolean().default(false),
  title: z.string(),
  category: z.enum(categories),
  createdAt: z.string().date(),
  updatedAt: z.string().date().optional(),
  emoji: z.string(),
  tags: z.array(z.string()).optional().default([]),
  description: z.string().optional(),
}).transform(v => {
  const tagsEncoded = v.tags.map(t => encodeURIComponent(t))
  const createdAt = new Date(v.createdAt)
  const y = createdAt.getFullYear();
  const m = String(createdAt.getMonth() + 1).padStart(2, '0');
  const d = String(createdAt.getDate()).padStart(2, '0');

  // Urlエンコードすると以下のエラーになる。おそらく内部で`encodeURIComponent`が呼び出されてる
  // https://docs.astro.build/en/reference/errors/no-matching-static-path-found/
  const slug = `${y}${m}${d}-${v.title}`

  return { slug, tagsEncoded, ...v }
})

const article = defineCollection({
  loader: glob({
    pattern: ["**/*.md", "**/*.mdx"],
    base: "./src/content/article",
  }),
  schema: articleSchema,
});

export const collections = { article };
