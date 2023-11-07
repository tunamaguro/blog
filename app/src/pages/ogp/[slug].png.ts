import type { APIContext, APIRoute } from "astro";
import { getCollection } from "astro:content";
import { generateOgp } from "@/server/ogp/generateOgp";

export const getStaticPaths = async () => {
  const articles = await getCollection("article");

  return articles.map((article) => ({
    params: { slug: article.slug },
    props: {
      data: article.data,
    },
  }));
};

export const GET: APIRoute = async ({ props, site }: APIContext) => {
  const title = props.data.title;
  const png = await generateOgp(title);
  return new Response(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
    },
  });
};
