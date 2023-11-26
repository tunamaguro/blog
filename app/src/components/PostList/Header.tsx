import type { ReactNode } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faHashtag } from "@fortawesome/free-solid-svg-icons";

type PostListHeaderProps = {
  icon?: IconProp;
  children?: ReactNode;
};
export const PostListHeader = ({
  icon = faHashtag,
  children,
}: PostListHeaderProps) => (
  <div className="flex gap-2 items-center border-b-4 border-base-content py-4 px-2">
    <FontAwesomeIcon className="h-8 w-8" icon={icon} />
    <h1 className="text-2xl md:text-3xl font-bold ">{children}</h1>
  </div>
);
