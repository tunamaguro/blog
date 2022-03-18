import React from "react"
import { graphql, Link } from "gatsby"
import PageBase from "../components/PageBase"
import Seo from "../components/Seo"

const BlogIndex = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes
  return (
    <PageBase>
      <Seo />
      <ol>
        {posts.map(post => (
          <Link key={post.fields.slug} to={post.fields.slug} itemProp="url">
            <li className="p-4 border-2 border-gray-300 rounded-2xl hover:bg-slate-100 hover:shadow-md">
              <article itemScope>
                <header>
                  <h2 className="text-3xl">
                    <span itemProp="headline">{post.frontmatter.title}</span>
                  </h2>
                  <small className="text-sm text-gray-500">
                    {post.frontmatter.date} 公開
                  </small>
                </header>
                <p itemProp="description">{post.excerpt}</p>
              </article>
            </li>
          </Link>
        ))}
      </ol>
    </PageBase>
  )
}

export default BlogIndex

export const query = graphql`
  query {
    allMarkdownRemark(sort: { fields: frontmatter___date, order: DESC }) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          date(formatString: "YYYY/MM/DD")
          title
          description
        }
        excerpt
      }
    }
  }
`
