import { getCollection } from "astro:content";

export const getArticles = () => {
  return getCollection("article", (article) => !article.data.draft);
};
