import type { FC } from "react";
import { Twemoji } from "@/components/Twemoji";
import { Tag } from "@/components/Tag";

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
      <div className="flex py-4 gap-4">
        <a href={`/articles/${slug}`}>
          <div className="bg-base-300 p-4 rounded-xl w-20 md:w-24 h-auto flex-shrink-0">
            <Twemoji emoji={emoji || "😺"} />
          </div>
        </a>
        <div className={`flex flex-col justify-between`}>
          <a href={`/articles/${slug}`}>
            <h2 className="text-primary-content font-bold text-lg md:text-2xl break-words">
              {title}
            </h2>
          </a>
          <div>作成日 : {createdAt}</div>
          <div className="flex gap-2 justify-start flex-wrap">
            {tags.map((tag) => (
              <Tag key={tag} tag={tag}>
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};
