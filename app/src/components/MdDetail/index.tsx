import "katex/dist/katex.min.css";
import "./expressive_code.css";
import "./anchor_link.css";

import type { FC } from "react";
import { Tag } from "@/components/Tag";
import { Twemoji } from "../Twemoji";
import { ArticleInfo, type ArticleInfoProps } from "./ArticleInfo";

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
    <article>
      <div className="flex flex-col items-center gap-4 pb-4" data-pagefind-body>
        <figure>
          <Twemoji
            className="w-20 md:w-24"
            emoji={emoji || "ℹ️"}
            data-pagefind-meta="image[src], image_alt[alt]"
          />
        </figure>
        <h1
          className="text-center break-words text-2xl md:text-3xl font-bold"
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
        <ul className="grid grid-flow-col gap-4">
          {tags.map((tag) => (
            <Tag key={tag} tag={tag}>
              {tag}
            </Tag>
          ))}
        </ul>
      </div>
      <div className="bg-base-200 p-8 rounded-3xl">
        <div className="prose max-w-none break-words prose-img:mx-auto prose-video:mx-auto [&:not(th)]:prose-headings:flex [&:not(th)]:prose-headings:items-center [&:not(th)]:prose-headings:gap-x-2">
          {children}
        </div>
      </div>
    </article >
  );
};
