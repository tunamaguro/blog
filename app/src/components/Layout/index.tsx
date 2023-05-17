import type { FunctionComponent, ReactNode } from "react";

import { Header } from "../Header";
import { Footer } from "../Footer";

type Props = {
  siteTitle: string;
  author: string;
  children: ReactNode;
};

export const Layout: FunctionComponent<Props> = ({
  children,
  author,
  siteTitle,
}) => (
  <div className="flex flex-col min-h-screen">
    <Header siteTitle={siteTitle} />
    <main className="flex-grow container max-w-5xl mx-auto">{children}</main>
    <Footer author={author} />
  </div>
);
