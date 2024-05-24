import type { FunctionComponent, ReactNode } from "react";

import { routes } from "./routes";

type Props = {
  siteTitle: string;
  children?: ReactNode;
};

export const Header: FunctionComponent<Props> = ({ siteTitle, children }) => (
  <header className="bg-base-300">
    <div className="navbar mx-auto flex-col md:flex-row max-w-5xl justify-between">
      <a href="/" className="font-bold text-3xl py-2 md:py-0">
        {siteTitle}
      </a>
      {children}
      <nav className="flex-none">
        <ul className="menu menu-horizontal px-1 text-lg">
          {
            routes.map((route) => (
              <li>
                <a href={route.href}>{route.text}</a>
              </li>
            ))
          }
        </ul>
      </nav>
    </div>
  </header>
);
