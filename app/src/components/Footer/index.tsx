import type { FunctionComponent } from "react";

type Props = {
  author: string;
};

export const Footer: FunctionComponent<Props> = ({ author }) => (
  <footer className="footer footer-center p-10 bg-neutral text-neutral-content rounded">
    <div className="grid grid-flow-col gap-4">
      <a href="/" className="link link-hover">
        Home
      </a>
      <a href="/articles" className="link link-hover">
        Blog
      </a>
      <a href="/articles/about" className="link link-hover">
        About
      </a>
    </div>
    <div>Copyright © 2023 {author}</div>
    <div className="flex items-center">
      Build with
      <a
        href="https://astro.build/"
        aria-label="go to Astro site"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          className="h-6 mx-2"
          alt="Astro logo"
          src="/astro_dark.svg"
          width="100%"
          height="100%"
          loading="lazy"
          decoding="async"
        />
      </a>
    </div>
  </footer>
);
