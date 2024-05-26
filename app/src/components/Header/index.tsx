import type { FunctionComponent, ReactNode } from "react";

import { routes } from "./routes";
import { MenuIcon } from "@/components/Icons/MenuIcon";
import { Drawer } from "./Drawer";

type Props = {
  siteTitle: string;
  children?: ReactNode;
};

export const Header: FunctionComponent<Props> = ({ siteTitle, children }) => (
  <header className="bg-base-300">
    <div className="navbar mx-auto flex-row max-w-5xl justify-between">
      <Drawer drawerId="sample" className="w-fit md:invisible md:hidden">
        <div className="flex-none">
          <Drawer.Toggle className="btn btn-square btn-ghost">
            <MenuIcon />
          </Drawer.Toggle>
        </div>
        <Drawer.SideBar className="z-50">
          <Drawer.Overlay />
          <Drawer.Content>
            <ul className="menu p-4 w-80">
              <li>
                <a>Sidebar Item 1</a>
              </li>
              <li>
                <a>Sidebar Item 2</a>
              </li>
            </ul>
          </Drawer.Content>
        </Drawer.SideBar>
      </Drawer>
      <a href="/" className="font-bold text-lg md:text-3xl py-2 md:py-0">
        {siteTitle}
      </a>
      {children}
      <nav className="invisible hidden md:visible md:block">
        <ul className="menu menu-horizontal px-1 text-lg">
          {routes.map((route) => (
            <li>
              <a href={route.href}>{route.text}</a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </header>
);
