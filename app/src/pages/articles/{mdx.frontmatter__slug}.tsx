import React from "react";
import { PageProps, HeadFC, graphql } from "gatsby";
import Seo from "../../components/Seo";

const BlogPost: React.FC<PageProps> = ({ pageContext, data, children }) => {
  console.log(pageContext);
  return <div>{children}</div>;
};

export const query = graphql`
  query ($id: String) {
    mdx(id: { eq: $id }) {
      frontmatter {
        title
        date(formatString: "MMMM D, YYYY")
      }
    }
  }
`;

export const Head: HeadFC = ({ data }) => (
  <Seo title={data.mdx.frontmatter.title} />
);

export default BlogPost;
