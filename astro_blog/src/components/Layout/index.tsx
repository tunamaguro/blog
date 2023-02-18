import type { FunctionComponent } from "preact";

import { Header } from "../Header";
import { Footer } from "../Footer";

type Props = {
  siteTitle: string;
  author: string;
};

export const Layout: FunctionComponent<Props> = ({
  children,
  author,
  siteTitle,
}) => (
  <div className="flex flex-col min-h-screen">
    <Header siteTitle={siteTitle} />
    <main className="flex-grow">{children}</main>
    <Footer author={author} />
  </div>
);
