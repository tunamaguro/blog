import "katex/dist/katex.min.css";

import type { FC } from "react";
import { Twemoji } from "../Twemoji";
import { ArticleInfo, type ArticleInfoProps } from "./ArticleInfo";

type MdDetailProps = {
  title: string;
  emoji?: string;
  createdAt: string;
  updatedAt?: string,
  metas?: ArticleInfoProps["info"]
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
  metas = []
}) => {
  return (
    <div className="container max-w-5xl mx-auto py-4">
      <div className="flex flex-col items-center gap-4 pb-4">
        <Twemoji className="w-20 md:w-24" emoji={emoji || "ℹ️"} />
        <h1 className="text-center break-words text-2xl md:text-4xl font-bold text-primary-content">
          {title}
        </h1>
        <ArticleInfo info={[
          { key: "createdAt", name: "createdAt", value: createdAt }, updatedAt ? { key: "updatedAt", name: "updatedAt", value: updatedAt } : null, ...metas
        ]} />
        <div className="grid grid-flow-col gap-4">
          {tags.map((tag) => (
            <div key={tag} className="badge badge-outline">
              {tag}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-base-200 p-8 rounded-3xl">
        <div className="prose max-w-none break-words prose-img:mx-auto prose-video:mx-auto">{children}</div>
      </div>
    </div>
  );
};
