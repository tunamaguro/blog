import type { FC } from "react";
import { parse } from "twemoji-parser";

type TwemojiProps = {
  emoji: string;
  className?: string;
};

const getFirstwemojiUrl = (text: string) => {
  const entities = parse(text, {
    assetType: "svg",
  });
  return entities.length === 0 ? null : entities[0];
};

export const Twemoji: FC<TwemojiProps> = ({ emoji, className }) => {
  const twemojiPath = getFirstwemojiUrl(emoji);
  if (!twemojiPath) {
    throw Error("Not emoji found");
  }
  return (
    <img
      className={`h-8 w-8 ${className}`}
      draggable="false"
      alt={twemojiPath.text}
      loading="lazy"
      src={twemojiPath.url}
    />
  );
};
