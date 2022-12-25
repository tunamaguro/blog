import React from "react";
import { PageProps, HeadFC, graphql } from "gatsby";
import Seo from "../../components/Seo";
import { Layout } from "../../components/Layout";
import { Twemoji } from "../../components/Twemoji";

const BlogPost: React.FC<PageProps> = (props) => {
  const { pageContext, data, children } = props;
  console.log(props);
  return (
    <Layout>
      <div className="container max-w-5xl mx-auto py-4">
        <div className="flex flex-col items-center gap-2 pb-8">
          <span className="w-24">
            <Twemoji emoii={data.mdx.frontmatter.emoji} />
          </span>
          <h1 className="text-4xl font-bold text-primary-content">
            {data.mdx.frontmatter.title}
          </h1>
          <p className="">createdAt : {data.mdx.frontmatter.date}</p>
          <div className="grid grid-flow-col gap-4">
            {data.mdx.frontmatter.tags.map((tag) => (
              <div className="badge badge-outline">{tag}</div>
            ))}
          </div>
        </div>
        <div className="bg-base-200 p-8 rounded-3xl">
          <div className="prose max-w-none">{children}</div>
        </div>
      </div>
    </Layout>
  );
};

export const query = graphql`
  query ($id: String) {
    mdx(id: { eq: $id }) {
      frontmatter {
        title
        date(formatString: "yyyy-MM-DD")
        emoji
        tags
      }
    }
  }
`;

export const Head: HeadFC = ({ data }) => (
  <Seo title={data.mdx.frontmatter.title} />
);

export default BlogPost;
