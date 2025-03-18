import type { ReactNode } from "react";

import { NewsIcon } from "../Icons/NewsIcon";
import { clsx } from "clsx";
import { sprinkles } from "@/styles/sprinkles.css";
type PostListHeaderProps = {
  children?: ReactNode;
};
export const PostListHeader = ({ children }: PostListHeaderProps) => (
  <div
    className={clsx(
      sprinkles({ borderColor: "baseContent" }),
      "flex gap-2 items-center border-b-4 py-4 px-2",
    )}
  >
    <NewsIcon className="h-8 w-8" strokeWidth={1.5} />
    <h1 className="text-2xl md:text-3xl font-bold ">{children}</h1>
  </div>
);
