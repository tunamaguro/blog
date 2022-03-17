import * as React from "react"
import { graphql } from "gatsby"

import PageBase from "../components/PageBase"

const BlogPostTemplate = ({ data }) => {
  const post = data.markdownRemark
  return (
    <PageBase>
      <section
        className="prose lg:prose-lg"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </PageBase>
  )
}

export default BlogPostTemplate

export const query = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      frontmatter {
        date(formatString: "YYYY/MM/DD")
        title
      }
      html
    }
  }
`
