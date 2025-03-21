import type { FunctionComponent } from "react";
import AstroDarkLogo from "@/assets/astro_dark.svg";
import { clsx } from "clsx";
import { sprinkles } from "@/styles/sprinkles.css";
type Props = {
  author: string;
};

export const Footer: FunctionComponent<Props> = ({ author }) => (
  <footer
    className={clsx(
      sprinkles({ backgroundColor: "base200", color: "baseContent" }),
      "flex flex-col items-center gap-y-10 py-10 text-base",
    )}
  >
    <div className="grid grid-flow-col gap-4">
      <a href="/" className="link link-hover">
        Home
      </a>
      <a href="/articles" className="link link-hover">
        Blog
      </a>
      <a href="/about" className="link link-hover">
        利用規約
      </a>
    </div>
    <div>Copyright © 2024 {author}</div>
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
          src={AstroDarkLogo.src}
          width="100%"
          height="100%"
          loading="lazy"
          decoding="async"
        />
      </a>
    </div>
  </footer>
);
