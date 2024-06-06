import { getCollection } from "astro:content";

export const getArticles = () => {
  return getCollection("article", (article) => !article.data.draft).then(
    (articles) =>
      articles.sort((a, b) => (a.data.createdAt < b.data.createdAt ? 1 : -1)),
  );
};
