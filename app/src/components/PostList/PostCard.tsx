import type { FC } from "react";
import { Twemoji } from "@/components/Twemoji";
import {Tag}from "@/components/Tag"

type PostCardProps = {
  title: string;
  emoji?: string;
  createdAt: string;
  tags: string[];
  slug: string;
};

export const PostCard: FC<PostCardProps> = ({
  tags,
  createdAt,
  title,
  emoji,
  slug,
}) => {
  return (
    <article className="px-2">
      <a href={`/articles/${slug}`}>
        <div className="flex py-4 gap-4">
          <Twemoji
            className="bg-base-300 p-4 rounded-xl w-24 h-24 flex-shrink-0"
            emoji={emoji || "😺"}
          />
          <div className={`flex flex-col gap-2`}>
            <div className="text-primary-content font-bold text-xl md:text-2xl">
              {title}
            </div>
            <div>作成日 : {createdAt}</div>
            <div className="flex gap-2 justify-start">
              {tags.map((tag) => (
                <Tag key={tag} tag={tag}>
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </a>
    </article>
  );
};
