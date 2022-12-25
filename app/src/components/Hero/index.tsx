import React from "react";
import { graphql, useStaticQuery, Link } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTwitterSquare,
  faSquareGithub,
} from "@fortawesome/free-brands-svg-icons";

export const Hero: React.FC = () => {
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
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold border-b-4 border-base-content py-4">
        {data.site.siteMetadata.author}のブログへようこそ👋
      </h1>
      <div className="flex py-4 gap-8">
        <div className="avatar">
          <div className="w-40 p-3 rounded-full bg-base-300">
            <StaticImage
              alt="tsunamaguro icon"
              src="../../images/maguro.png"
              className="transform rotate-45 translate-y-4"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2  justify-center">
          <div className="text-2xl font-bold text-primary-content">
            {data.site.siteMetadata.author}
          </div>
          <div>コードを書かないと死にます</div>
          <div className="flex flex-row gap-4 text-3xl">
            <a href="#">
              <FontAwesomeIcon icon={faTwitterSquare} />
            </a>
            <a href="#">
              <FontAwesomeIcon icon={faSquareGithub} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
