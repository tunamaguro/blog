import { getCollection, type CollectionEntry } from "astro:content";

export const getArticles = () => {
  return getCollection("article", (article) => !article.data.draft).then(
    (articles) =>
      articles.sort((a, b) => (a.data.createdAt < b.data.createdAt ? 1 : -1)),
  );
};


const lastComponent = (s: string) => {
  return s.split("/").at(-1);
};

export const articleToPath = (article: CollectionEntry<"article">): string => {
  const createdAt = new Date(article.data.createdAt);
  const y = createdAt.getFullYear();
  const m = String(createdAt.getMonth() + 1).padStart(2, "0");

  const parts = lastComponent(article.id);

  return `${y}/${m}/${parts}`;
}