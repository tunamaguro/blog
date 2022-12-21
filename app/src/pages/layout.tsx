import * as React from "react";
import type { HeadFC, PageProps } from "gatsby";
import { Header } from "../components/Header";
import Seo from "../components/Seo";

const LayoutCheck: React.FC<PageProps> = ({}) => {
  return <Header></Header>;
};

export const Head: HeadFC = () => <Seo title="レイアウト確認" />;

export default LayoutCheck;
