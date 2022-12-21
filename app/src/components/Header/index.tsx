import React from "react";
import { graphql, useStaticQuery, Link } from "gatsby";

export const Header: React.FC = ({}) => {
  const data = useStaticQuery(graphql`
    query MyQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  return (
    <header className="navbar bg-base-100">
      <div className="flex-1">
        <Link to="#" className="flex text-2xl md:text-3xl">
          <span className="btn btn-ghost normal-case no-animation text-2xl md:text-3xl">
            {data.site.siteMetadata.title}
          </span>
        </Link>
      </div>
      <nav className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link to="#">Home</Link>
          </li>
          <li>
            <Link to="#">Blog</Link>
          </li>
          <li>
            <Link to="#">About</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};
