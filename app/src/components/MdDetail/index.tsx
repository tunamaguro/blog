import "katex/dist/katex.min.css";
import "./expressive_code.css";

import type { FC } from "react";
import { Tag } from "@/components/Tag";
import { Twemoji } from "../Twemoji";
import { ArticleInfo, type ArticleInfoProps } from "./ArticleInfo";
import { iconTransitionName, titleTransitionName } from "@/utils/slugfy";

type MdDetailProps = {
  title: string;
  emoji?: string;
  createdAt: string;
  updatedAt?: string;
  slug?: string;
  metas?: ArticleInfoProps["info"];
  tags: string[];
  children: React.ReactNode;
};

export const MdDetail: FC<MdDetailProps> = ({
  emoji,
  title,
  tags,
  children,
  createdAt,
  updatedAt,
  slug = "",
  metas = [],
}) => {
  return (
    <>
      <div className="flex flex-col items-center gap-4 pb-4">
        <figure style={{ viewTransitionName: iconTransitionName(slug) }}>
          <Twemoji className="w-20 md:w-24" emoji={emoji || "ℹ️"} />
        </figure>
        <h1
          className="text-center break-words text-2xl md:text-3xl font-bold"
          style={{ viewTransitionName: titleTransitionName(slug) }}
        >
          {title}
        </h1>
        <ArticleInfo
          info={[
            { key: "createdAt", name: "createdAt", value: createdAt },
            updatedAt
              ? { key: "updatedAt", name: "updatedAt", value: updatedAt }
              : null,
            ...metas,
          ]}
        />
        <div className="grid grid-flow-col gap-4">
          {tags.map((tag) => (
            <Tag key={tag} tag={tag}>
              {tag}
            </Tag>
          ))}
        </div>
      </div>
      <div className="bg-base-200 p-8 rounded-3xl">
        <div className="prose max-w-none break-words prose-img:mx-auto prose-video:mx-auto">
          {children}
        </div>
      </div>
    </>
  );
};
