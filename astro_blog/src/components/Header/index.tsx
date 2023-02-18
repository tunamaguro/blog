import type { FunctionComponent } from "preact";

type Props = {
  siteTitle: string;
};

export const Header: FunctionComponent<Props> = ({ siteTitle }) => (
  <header className="navbar bg-base-300 flex-col md:flex-row">
    <div>
      <a href="/" className="font-bold text-3xl md:text-3xl mx-4">
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
          <a href="/articles/about">About</a>
        </li>
      </ul>
    </nav>
  </header>
);
