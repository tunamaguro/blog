import type { FC } from "react";
import { Twemoji } from "@/components/Twemoji";
import { Tag } from "@/components/Tag";
import { iconTransitionName, titleTransitionName } from "@/utils/slugfy"

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
    <article className="card bg-base-200 hover:shadow-xl">
      <a
        href={`/articles/${slug}`}
        className="absolute inset-0"
        tabIndex={-1}
        aria-label="記事に移動"
      ></a>
      <figure className=" pt-4 mx-auto" style={{ viewTransitionName: iconTransitionName(slug) }}>
        <Twemoji className="w-16 h-16 md:w-24 md:h-24" emoji={emoji || "😺"} />
      </figure>
      <div className="card-body">
        <ul className="flex gap-2 justify-start flex-wrap z-10">
          {tags.map((tag) => (
            <Tag key={tag} tag={tag}>
              {tag}
            </Tag>
          ))}
        </ul>
        <h2 className="card-title" style={{ viewTransitionName: titleTransitionName(slug) }}>{title}</h2>
        <div className="text-right">作成日 : {createdAt}</div>
      </div>
    </article>
  );
};
