import type { FC, ImgHTMLAttributes } from "react";
import { parse } from "twemoji-parser";
import { clsx } from "clsx";

type TwemojiProps = {
  emoji: string;
  className?: string;
} & ImgHTMLAttributes<HTMLImageElement>;

const getFirstwemojiUrl = (text: string) => {
  const entities = parse(text, {
    assetType: "svg",
    buildUrl: (codepoints, assetType) => {
      return `/svg/${codepoints}.${assetType}`;
    },
  });
  return entities.length === 0 ? null : entities[0];
};

export const Twemoji: FC<TwemojiProps> = ({ emoji, className, ...ret }) => {
  const twemojiPath = getFirstwemojiUrl(emoji);
  if (!twemojiPath) {
    throw Error("Not emoji found");
  }
  return (
    <img
      className={clsx(className)}
      draggable="false"
      alt={twemojiPath.text}
      loading="lazy"
      decoding="async"
      src={twemojiPath.url}
      {...ret}
    />
  );
};
