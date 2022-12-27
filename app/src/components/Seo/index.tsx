import React, { FC } from "react";
import { graphql, useStaticQuery } from "gatsby";

import iconImage from "../../images/maguro.png";

type SeoProps = {
  title?: string;
  desription?: string;
  pathname?: string;
  image?: string;
};

const Seo: FC<SeoProps> = ({ title, desription, pathname, image }) => {
  const data = useStaticQuery(graphql`
    query SeoQuery {
      site {
        siteMetadata {
          title
          description
          siteUrl
        }
      }
    }
  `);

  const metaData = data.site.siteMetadata;

  const seo = {
    title: `${title ? `${title} | ` : ""}${metaData.title}`,
    description: desription || metaData.description,
    url: `${metaData.siteUrl}${pathname || ""}`,
    sitename: metaData.title,
    image: `${metaData.siteUrl}${image || iconImage}`,
  };

  return (
    <>
      <title>{seo.title}</title>
      <meta name="twitter:card" content="summary" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:locale" content="ja-JP" />
      <meta property="og:site_name" content={seo.sitename} />
    </>
  );
};

export default Seo;
