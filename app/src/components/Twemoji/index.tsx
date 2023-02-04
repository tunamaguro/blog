import React from "react";
import twemoji from "twemoji";

type TwemojiProps = {
  emoji: string;
};

export const Twemoji: React.FC<TwemojiProps> = ({ emoji }) => {
  return (
    <>
      <span
        className="block w-auto h-auto"
        dangerouslySetInnerHTML={{
          __html: twemoji.parse(emoji, {
            folder: "svg",
            ext: ".svg",
            base: "/",
          }),
        }}
      />
    </>
  );
};
