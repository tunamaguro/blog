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
    <article className="card bg-base-200 shadow-xl">
      <a href={`/articles/${slug}`}>
        <figure className="w-16 md:w-24 pt-4 mx-auto">
          <Twemoji emoji={emoji || "😺"} />
        </figure>
        <div className="card-body">
          <div className="flex gap-2 justify-start flex-wrap">
            {tags.map((tag) => (
              <Tag key={tag} tag={tag}>
                {tag}
              </Tag>
            ))}
          </div>
          <a href={`/articles/${slug}`}>
            <h2 className="card-title">{title}</h2>
            <div className="text-right">作成日 : {createdAt}</div>
          </a>
        </div>
      </a>
    </article>
  );
};
