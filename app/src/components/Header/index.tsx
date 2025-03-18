import type { FunctionComponent, ReactNode } from "react";
import { clsx } from "clsx";
import { sprinkles } from "@/styles/sprinkles.css";
import { routes } from "./routes";
import { MenuIcon } from "@/components/Icons/MenuIcon";
import { Drawer } from "./Drawer";

type Props = {
  siteTitle: string;
  children?: ReactNode;
};

export const Header: FunctionComponent<Props> = ({ siteTitle, children }) => (
  <header className={sprinkles({ backgroundColor: "base300" })}>
    <div className="navbar mx-auto flex-row max-w-5xl justify-between gap-x-4">
      <Drawer drawerId="sideMenu" className="w-fit md:invisible md:hidden">
        <div className="flex-none">
          <Drawer.Toggle className="btn btn-square btn-ghost">
            <MenuIcon />
          </Drawer.Toggle>
        </div>
        <Drawer.SideBar className="z-50">
          <Drawer.Overlay />
          <Drawer.Content className="min-w-80 p-4">
            <div className="flex flex-col border-opacity-50">
              <div className="flex justify-between">
                <a
                  href="/"
                  className="font-bold text-lg md:text-3xl py-2 md:py-0"
                >
                  {siteTitle}
                </a>
              </div>
              <div className="divider m-0"></div>
              <ul className="menu px-1 text-lg gap-4">
                {routes.map((route) => (
                  <li key={route.href}>
                    <a href={route.href}>{route.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          </Drawer.Content>
        </Drawer.SideBar>
      </Drawer>
      <a href="/" className="font-bold text-lg md:text-2xl py-2 md:py-0">
        {siteTitle}
      </a>
      {children}
      <nav className="invisible hidden md:visible md:block">
        <ul className="menu menu-horizontal px-1 text-lg">
          {routes.map((route) => (
            <li key={route.href}>
              <a href={route.href}>{route.text}</a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </header>
);
