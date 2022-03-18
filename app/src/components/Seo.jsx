import { graphql, useStaticQuery } from "gatsby"
import React from "react"
import { Helmet } from "react-helmet"

import ogpImage from "../images/icon.png"

const Seo = ({ descripton, title }) => {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          description
          title
          social {
            twitter
          }
        }
      }
    }
  `)
  const metaDescription = descripton || site.siteMetadata?.descripton
  const defaultTitle = title || site.siteMetadata?.title
  return (
    <Helmet
      htmlAttributes={{ lang: "ja" }}
      title={defaultTitle}
      meta={[
        { name: "description", content: metaDescription },
        { name: "og:title", content: defaultTitle },
        { name: "og:type", content: "website" },
        { name: "og:description", content: metaDescription },
        { name: "og:image", content: ogpImage },
        { name: "twitter:card", content: "summery" },
        {
          name: "twitter:creator",
          content: site.siteMetadata?.social?.twitter || "",
        },
        { name: "twitter:title", content: defaultTitle },
        { name: "twitter:description", content: metaDescription },
      ]}
    />
  )
}

export default Seo
