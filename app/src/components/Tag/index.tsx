import type { ReactNode } from "react";
import { clsx } from "clsx";
import { tag as tagClass } from "./style.css";

type TagProps = { tag: string; children: ReactNode };

export const Tag = ({ tag, children }: TagProps) => {
  return (
    <li className={clsx(tagClass, "badge badge-outline whitespace-nowrap")}>
      <a href={`/tags/${tag}`}>{children}</a>
    </li>
  );
};
