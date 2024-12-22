import type { APIContext } from "astro";
import type { RSSFeedItem } from "@astrojs/rss";
import rss from "@astrojs/rss";
import { z, render } from "astro:content";

import { siteMeta } from "@/constants/siteMeta";
import { getArticles } from "@/utils/getArticles";

export async function GET(context: APIContext) {
  const articles = await getArticles();

  const feeditems_promise = articles.map(async (article) => {
    const { description: maybeDescription } = article.data;
    const frontmatterSchema = z.object({
      excerpt: z.string(),
      minutesRead: z.string(),
    });
    const { remarkPluginFrontmatter } = await render(article);
    const frontmatter = frontmatterSchema.parse(remarkPluginFrontmatter);
    const contentDescription = maybeDescription ?? frontmatter.excerpt;
    return {
      title: article.data.title,
      pubDate: new Date(article.data.updatedAt ?? article.data.createdAt),
      description: contentDescription,
      link: `/articles/${article.id}/`,
    };
  });
  const feeditems: RSSFeedItem[] = await Promise.all(feeditems_promise);

  return rss({
    title: siteMeta.title,
    description: siteMeta.description,
    site: context.site!,
    items: feeditems,
  });
}
