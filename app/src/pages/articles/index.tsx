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

export const Head: HeadFC = () => <Seo title="Blog Posts" />;

export default BlogPost;
