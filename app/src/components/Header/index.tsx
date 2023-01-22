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
    <header className="navbar bg-base-300 flex-col md:flex-row">
      <div>
        <Link to="/" className="font-bold text-3xl md:text-3xl mx-4">
          {data.site.siteMetadata.title}
        </Link>
      </div>
      <span className="flex-grow" />
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
