import type { ReactNode } from "react";

import { NewsIcon } from "../Icons/NewsIcon";

type PostListHeaderProps = {
  children?: ReactNode;
};
export const PostListHeader = ({ children }: PostListHeaderProps) => (
  <div className="flex gap-2 items-center border-b-4 border-base-content py-4 px-2">
    <NewsIcon className="h-8 w-8" strokeWidth={1.5} />
    <h1 className="text-2xl md:text-3xl font-bold ">{children}</h1>
  </div>
);
