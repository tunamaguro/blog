import type { ReactNode } from "react";
import { slugfy } from "@/utils/slugfy";

type TagProps = { tag: string; children: ReactNode };

export const Tag = ({ tag, children }: TagProps) => {
  return (
    <a href={`/tags/${slugfy(tag)}`}>
      <div className="badge badge-outline hover:bg-primary hover:text-primary-content">
        {children}
      </div>
    </a>
  );
};
