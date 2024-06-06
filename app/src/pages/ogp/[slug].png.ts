import type { APIContext, APIRoute, InferGetStaticPropsType } from "astro";
import { generateOgp } from "@/server/ogp/generateOgp";
import { getArticles } from "@/utils/getArticles";

export const getStaticPaths = async () => {
  const articles = await getArticles();

  return articles.map((article) => ({
    params: { slug: article.slug },
    props: {
      data: article.data,
    },
  }));
};

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props, site }) => {
  const title = props.data.title;
  const png = await generateOgp(title);
  return new Response(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
    },
  });
};
