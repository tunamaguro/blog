import React from "react";
import { PageProps, HeadFC, graphql } from "gatsby";
import Seo from "../../components/Seo";
import { Layout } from "../../components/Layout";
import { MdDetail } from "../../components/MdDetail";

const BlogPost: React.FC<PageProps<Queries.ArticleQueryQuery>> = (props) => {
  const { pageContext, data, children } = props;
  console.log(props);
  return (
    <Layout>
      <MdDetail
        title={data.mdx?.frontmatter?.title || ""}
        createdAt={data.mdx?.frontmatter?.date || ""}
        tags={data.mdx?.frontmatter?.tags || []}
        emoji={data.mdx?.frontmatter?.emoji || ""}
      >
        {children}
      </MdDetail>
    </Layout>
  );
};

export const query = graphql`
  query ArticleQuery($id: String) {
    mdx(id: { eq: $id }) {
      frontmatter {
        title
        date(formatString: "yyyy-MM-DD")
        emoji
        tags
        slug
      }
      excerpt(pruneLength: 50)
    }
  }
`;

export const Head: HeadFC = ({ data }) => (
  <Seo
    title={data.mdx.frontmatter.title}
    desription={data.mdx.excerpt}
    pathname={`/articles/${data.mdx.frontmatter.slug}`}
  />
);

export default BlogPost;
