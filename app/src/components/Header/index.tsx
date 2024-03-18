import type { FunctionComponent } from "react";

type Props = {
  siteTitle: string;
};

export const Header: FunctionComponent<Props> = ({ siteTitle }) => (
  <header className="bg-base-300 ">
    <div className="navbar mx-auto flex-col md:flex-row max-w-5xl">
      <div>
        <a href="/" className="font-bold text-3xl md:text-3xl ">
          {siteTitle}
        </a>
      </div>
      <span className="flex-grow" />
      <nav className="flex-none">
        <ul className="menu menu-horizontal px-1">
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
