import type { SVGProps } from "react";
import { clsx } from "clsx";

type Props = Omit<SVGProps<SVGElement>, "children" | "ref">;

/**
 * @see https://tabler.io/icons/icon/news
 */
export const NewsIcon = ({ className, ...ret }: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx(
        "icon icon-tabler icons-tabler-outline icon-tabler-news",
        className,
      )}
      {...ret}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M16 6h3a1 1 0 0 1 1 1v11a2 2 0 0 1 -4 0v-13a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1v12a3 3 0 0 0 3 3h11" />
      <path d="M8 8l4 0" />
      <path d="M8 12l4 0" />
      <path d="M8 16l4 0" />
    </svg>
  );
};
