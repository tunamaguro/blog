import React from "react";
import { graphql, useStaticQuery, Link } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";

export const Hero: React.FC = () => {
  return (
    <div className="hero py-8 bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-xl">
          <h1 className="text-5xl font-bold">TODO:Write message</h1>
          <div className="avatar">
            <div className="h-32 w-24 rounded py-4">
              <StaticImage alt="icon" src="../../images/icon.png" />
            </div>
          </div>
          <p className="pb-4">しょうもないものを作ることが生きがいです</p>
        </div>
      </div>
    </div>
  );
};
