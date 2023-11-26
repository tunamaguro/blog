import type { FC, ComponentProps, ReactNode } from "react";

import { PostCard } from "./PostCard";

type Props = {
  children?: ReactNode;
  cards: ComponentProps<typeof PostCard>[];
};

export const PostList: FC<Props> = ({ children, cards }) => {
  return (
    <div className="container mx-auto">
      {children}
      <div className="flex flex-col px-2">
        {cards.map((card) => (
          <PostCard key={card.slug} {...card} />
        ))}
      </div>
    </div>
  );
};
