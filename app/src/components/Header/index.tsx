import type { FunctionComponent, ReactNode } from "react";

type Props = {
  siteTitle: string;
  children?: ReactNode
};

export const Header: FunctionComponent<Props> = ({ siteTitle, children }) => (
  <header className="bg-base-300">
    <div className="navbar mx-auto flex-col md:flex-row max-w-5xl">
      <div>
        <a href="/" className="font-bold text-3xl py-2 md:py-0">
          {siteTitle}
        </a>
      </div>
      <span className="flex-grow" />
      {children}
      <nav className="flex-none">
        <ul className="menu menu-horizontal px-1 text-lg">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/articles">Blog</a>
          </li>
          <li>
            <a href="/articles/about">利用規約</a>
          </li>
        </ul>
      </nav>
    </div>
  </header>
);
