import type { ReactNode } from "react";
import { slugfy } from "@/utils/slugfy";

type TagProps = { tag: string; children: ReactNode };

export const Tag = ({ tag, children }: TagProps) => {
  return (
    <li className="badge badge-outline hover:bg-primary hover:text-primary-content whitespace-nowrap">
      <a href={`/tags/${slugfy(tag)}`}>
        {children}
      </a>
    </li>
  );
};
