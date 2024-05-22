import type { ReactNode } from "react";

type ArticleMeta = {
  key: string | number;
  name: ReactNode;
  value: ReactNode;
};

export type ArticleInfoProps = {
  info?: (ArticleMeta | null)[];
};

export const ArticleInfo = ({ info }: ArticleInfoProps) => {
  if (!info) {
    return null;
  }
  return (
    <div className="flex flex-wrap justify-center text-sm md:text-base gap-x-8 gap-y-4">
      {info.map((v) => {
        if (v === null) {
          return null;
        }
        return (
          <div key={v.key} className="flex flex-col gap-2">
            <div className="font-semibold">{v.name}</div>
            <div>{v.value}</div>
          </div>
        );
      })}
    </div>
  );
};
