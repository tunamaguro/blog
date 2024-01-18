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
    <article className="card bg-base-200 shadow-xl transition hover:scale-95">
      <a href={`/articles/${slug}`} className="absolute inset-0" tabIndex={-1}></a>

      <figure className="w-16 md:w-24 pt-4 mx-auto">
        <Twemoji emoji={emoji || "😺"} />
      </figure>
      <div className="card-body">
        <ul className="flex gap-2 justify-start flex-wrap z-10">
          {tags.map((tag) => (
            <Tag key={tag} tag={tag}>
              {tag}
            </Tag>
          ))}
        </ul>
        <h2 className="card-title">{title}</h2>
        <div className="text-right">作成日 : {createdAt}</div>
      </div>
    </article>
  );
};
