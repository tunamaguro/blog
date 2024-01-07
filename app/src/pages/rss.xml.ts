import type { APIContext } from 'astro';
import type { RSSFeedItem } from "@astrojs/rss"
import rss from '@astrojs/rss';
import { z } from "astro:content";

import { getCollection } from "astro:content";
import { siteMeta } from '@/constants/siteMeta';

export async function GET(context: APIContext) {

    const articles = await getCollection("article");

    const feeditems_promise = articles.map(async (article) => {
        const { description: maybeDescription } = article.data
        const frontmatterSchema = z.object({
            excerpt: z.string(),
            minutesRead: z.string(),
        });
        const { remarkPluginFrontmatter } = await article.render();
        const frontmatter = frontmatterSchema.parse(remarkPluginFrontmatter);
        const contentDescription = maybeDescription ?? frontmatter.excerpt;
        return ({
            title: article.data.title,
            pubDate: new Date(article.data.updatedAt ?? article.data.createdAt),
            description: contentDescription,
            link: `/articles/${article.slug}/`,

        })
    })
    const feeditems: RSSFeedItem[] = await Promise.all(feeditems_promise)

    return rss({
        title: siteMeta.title,
        description: siteMeta.description,
        site: context.site!,
        items: feeditems
    })
}