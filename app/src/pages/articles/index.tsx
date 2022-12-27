import React from "react";
import { PageProps, HeadFC, graphql } from "gatsby";
import Seo from "../../components/Seo";
import { Layout } from "../../components/Layout";
import { PostList } from "../../components/PostList";

const BlogPost: React.FC<PageProps> = () => {
  return (
    <Layout>
      <PostList />
    </Layout>
  );
};

export const Head: HeadFC = () => (
  <Seo title="Blog Posts" pathname="/articles" desription="投稿一覧" />
);

export default BlogPost;
