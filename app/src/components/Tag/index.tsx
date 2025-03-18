import type { ReactNode } from "react";

type TagProps = { tag: string; children: ReactNode };

export const Tag = ({ tag, children }: TagProps) => {
  return (
    <li className="badge badge-outline hover:bg-primary hover:text-primary-content whitespace-nowrap">
      <a href={`/tags/${tag}`}>{children}</a>
    </li>
  );
};
