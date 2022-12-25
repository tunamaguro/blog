import React from "react";
import { useStaticQuery, graphql } from "gatsby";

import { PostCard } from "./PostCard";

export const PostList: React.FC = () => {
  const data = useStaticQuery(graphql`
    query PostsQuery {
      allMdx {
        nodes {
          id
          frontmatter {
            title
            date(formatString: "yyyy-MM-DD")
            emoji
            tags
          }
        }
      }
    }
  `);

  const nodes = data.allMdx.nodes;
  return (
    <div className="container mx-auto flex-grow">
      <h1 className="text-3xl font-bold border-b-4 border-base-content py-4">
        Blog
      </h1>
      <div className="flex flex-col">
        {nodes.map(
          (node: {
            frontmatter: {
              title: string;
              emoji: string | undefined;
              date: string;
              tags: string[];
            };
          }) => (
            <PostCard
              title={node.frontmatter.title}
              emoji={node.frontmatter.emoji}
              date={node.frontmatter.date}
              tags={node.frontmatter.tags}
            />
          )
        )}
      </div>
    </div>
  );
};
