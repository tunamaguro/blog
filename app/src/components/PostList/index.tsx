import React from "react";
import { useStaticQuery, graphql, Link } from "gatsby";

import { PostCard } from "./PostCard";

export const PostList: React.FC = () => {
  const data = useStaticQuery(graphql`
    query PostsQuery {
      allMdx(sort: { frontmatter: { date: DESC } }) {
        nodes {
          id
          frontmatter {
            title
            date(formatString: "yyyy-MM-DD")
            emoji
            tags
            slug
          }
        }
      }
    }
  `);

  const nodes = data.allMdx.nodes;
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold border-b-4 border-base-content py-4">
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
              slug: string;
            };
          }) => (
            <PostCard
              title={node.frontmatter.title}
              slug={node.frontmatter.slug}
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
