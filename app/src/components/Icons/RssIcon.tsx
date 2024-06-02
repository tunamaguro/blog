import type { SVGProps } from "react";
import { clsx } from "clsx";

type Props = Omit<SVGProps<SVGElement>, "children" | "ref">;

/**
 * @see https://tabler.io/icons/icon/rss
 */
export const RssIcon = ({ className, ...ret }: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx(
        "icon icon-tabler icons-tabler-outline icon-tabler-rss",
        className,
      )}
      {...ret}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <path d="M4 11a9 9 0 0 1 9 9" />
    </svg>
  );
};
