import * as React from "react";
import type { HeadFC, PageProps } from "gatsby";
import { Header } from "../components/Header";
import Seo from "../components/Seo";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { PostList } from "../components/PostList";

const LayoutCheck: React.FC<PageProps> = ({}) => {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <Hero />
        <PostList />
        <Footer />
      </div>
    </>
  );
};

export const Head: HeadFC = () => <Seo title="レイアウト確認" />;

export default LayoutCheck;
