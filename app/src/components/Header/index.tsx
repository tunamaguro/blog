import React from "react";
import { graphql, useStaticQuery, Link } from "gatsby";

export const Header: React.FC = ({}) => {
  const data = useStaticQuery(graphql`
    query TitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  return (
    <header className="navbar bg-base-300">
      <div className="flex-1">
        <Link to="/" className="flex text-2xl">
          <span className="font-bold text-2xl md:text-3xl mx-4">
            {data.site.siteMetadata.title}
          </span>
        </Link>
      </div>
      <nav className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/articles">Blog</Link>
          </li>
          <li>
            <Link to="/articles/about">About</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};