import type { FC, ComponentProps } from "react";

import { PostCard } from "./PostCard";

type Props = {
  cards: ComponentProps<typeof PostCard>[];
};

export const PostList: FC<Props> = ({ cards }) => {
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold border-b-4 border-base-content py-4">
        Blog
      </h1>
      <div className="flex flex-col">
        {cards.map((card) => (
          <PostCard {...card} />
        ))}
      </div>
    </div>
  );
};
