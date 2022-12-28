import React from "react";
import { graphql, useStaticQuery, Link } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";

export const Footer: React.FC = () => {
  const data = useStaticQuery(graphql`
    query AuthorQuery {
      site {
        siteMetadata {
          author
        }
      }
    }
  `);
  return (
    <footer className="footer footer-center p-10 bg-neutral text-neutral-content rounded">
      <div className="grid grid-flow-col gap-4">
        <Link to="/" className="link link-hover">
          Home
        </Link>
        <Link to="/articles" className="link link-hover">
          Blog
        </Link>
        <Link to="/articles/about" className="link link-hover">
          About
        </Link>
      </div>
      <div>
        Copyright © 2022 {data.site.siteMetadata.author}
      </div>
      <div className="grid grid-flow-col items-baseline">
        Build with
        <a href="https://www.gatsbyjs.com/" target="_blank">
          Gatsby.js
          <StaticImage
            alt="GatsbyIcon"
            src="../../images/icon.png"
            className="w-6 mx-2"
          />
        </a>
      </div>
    </footer>
  );
};
