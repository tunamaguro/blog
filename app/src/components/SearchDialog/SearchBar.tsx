import type { ButtonHTMLAttributes } from "react";

import { clsx } from "clsx";
import { sprinkles } from "@/styles/sprinkles.css";
import { SearchIcon } from "../Icons/SearchIcon";

type Props = {
  open_dialog_id: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const openDialog = (dialog_id: string) => {
  const dialogElement = document.getElementById(dialog_id) as
    | HTMLDialogElement
    | undefined;
  dialogElement?.showModal();
};

export const SearchBar = ({ className, open_dialog_id, ...rest }: Props) => {
  return (
    <button
      className={clsx(
        "max-w-60 rounded-md flex cursor-pointer hover:outline hover:font-bold items-center gap-x-4",
        className,
      )}
      onClick={() => {
        openDialog(open_dialog_id);
      }}
      aria-label="open search dialog"
      {...rest}
    >
      <SearchIcon />
      <div className={clsx(sprinkles({ color: "baseContent" }), "grid items-center justify-center focus:outline-none")}>
        <span>検索</span>
      </div>
    </button>
  );
};

export const SearchButton = ({ className, open_dialog_id, ...rest }: Props) => {
  return (
    <button
      className={clsx("btn btn-square btn-ghost", className)}
      onClick={() => {
        openDialog(open_dialog_id);
      }}
      aria-label="open search dialog"
      {...rest}
    >
      <SearchIcon />
    </button>
  );
};
