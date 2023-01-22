import { Link } from "gatsby";
import React from "react";
import { Twemoji } from "../Twemoji";

type PostCardProps = {
  title: string;
  emoji?: string;
  date: string;
  tags: string[];
  slug: string;
};

export const PostCard: React.FC<PostCardProps> = ({
  tags,
  date,
  title,
  emoji,
  slug,
}) => {
  return (
    <article className="px-2">
      <Link to={`/articles/${slug}`}>
        <div className="flex py-4 gap-4">
          <div className="bg-base-300 p-4 rounded-xl w-24 h-24 flex-shrink-0">
            <Twemoji emoji={emoji || "😺"} />
          </div>
          <div className={`flex flex-col gap-2`}>
            <div className="text-primary-content font-bold text-xl md:text-2xl">
              {title}
            </div>
            <div>{date}</div>
            <div className="flex gap-2 justify-start">
              {tags.map((tag) => (
                <div className="badge badge-outline">{tag}</div>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};
