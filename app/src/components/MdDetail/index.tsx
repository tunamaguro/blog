import React from "react";
import { Twemoji } from "../Twemoji";

type MdDetailProps = {
  title: string;
  emoji?: string;
  createdAt: string;
  tags: string[];
  children: React.ReactNode;
};

export const MdDetail: React.FC<MdDetailProps> = ({
  emoji,
  title,
  tags,
  children,
  createdAt,
}) => {
  return (
    <div className="container max-w-5xl mx-auto py-4">
      <div className="flex flex-col items-center gap-2 pb-8">
        <span className="w-20 md:w-24">
          <Twemoji emoji={emoji || "ℹ️"} />
        </span>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-content">
          {title}
        </h1>
        <p className="">createdAt : {createdAt}</p>
        <div className="grid grid-flow-col gap-4">
          {tags.map((tag) => (
            <div className="badge badge-outline">{tag}</div>
          ))}
        </div>
      </div>
      <div className="bg-base-200 p-8 rounded-3xl">
        <div className="prose max-w-none">{children}</div>
      </div>
    </div>
  );
};
