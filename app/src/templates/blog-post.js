import * as React from "react"
import { graphql } from "gatsby"

import PageBase from "../components/PageBase"
import Seo from "../components/Seo"

const BlogPostTemplate = ({ data }) => {
  const post = data.markdownRemark

  return (
    <PageBase>
      <Seo
        title={post?.frontmatter?.title || "Title"}
        description={post?.frontmatter?.title || post.excerpt}
      />
      <section
        className="prose lg:prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </PageBase>
  )
}

export default BlogPostTemplate

export const query = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      excerpt(pruneLength: 160)
      frontmatter {
        date(formatString: "YYYY/MM/DD")
        title
        description
      }
      html
    }
  }
`
