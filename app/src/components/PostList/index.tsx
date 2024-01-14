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
      <div className="px-4 py-4 grid grid-cols-auto-fill-80 gap-6">
        {cards.map((card) => (
          <PostCard key={card.slug} {...card} />
        ))}
      </div>
    </div>
  );
};
