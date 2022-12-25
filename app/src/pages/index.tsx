import * as React from "react";
import type { HeadFC, PageProps } from "gatsby";
import Seo from "../components/Seo";
import { Layout } from "../components/Layout";
import { Hero } from "../components/Hero";
import { PostList } from "../components/PostList";

const LayoutCheck: React.FC<PageProps> = ({}) => {
  return (
    <Layout>
      <Hero />
      <PostList />
    </Layout>
  );
};

export const Head: HeadFC = () => <Seo title="ようこそ👋" />;

export default LayoutCheck;
