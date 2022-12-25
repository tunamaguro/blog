import React from "react";
import twemoji from "twemoji";

type TwemojiProps = {
  emoii: string;
};

export const Twemoji: React.FC<TwemojiProps> = ({ emoii }) => {
  return (
    <span
      className="block w-auto h-auto"
      dangerouslySetInnerHTML={{
        __html: twemoji.parse(emoii, {
          folder: "svg",
          ext: ".svg",
        }),
      }}
    />
  );
};
