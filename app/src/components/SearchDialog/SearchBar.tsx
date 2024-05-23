import type { ButtonHTMLAttributes } from "react";

import { clsx } from "clsx";
import { SearchIcon } from "../Icons/SearchIcon";

type Props = { open_dialog_id: string } & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
>;

const openDialog = (dialog_id: string) => {
  const dialogElement: HTMLDialogElement | undefined =
    document.getElementById(dialog_id);
  dialogElement?.showModal();
};

export const SearchBar = ({ className, open_dialog_id }: Props) => {
  return (
    <div className="p-1">
      <button
        className={clsx(
          "w-60 rounded-md flex cursor-pointer hover:outline hover:font-bold items-center gap-x-4",
          className,
        )}
        onClick={() => {
          openDialog(open_dialog_id);
        }}
      >
        <SearchIcon />
        <div className="grid items-center justify-center text-base-content focus:outline-none">
          <span>検索</span>
        </div>
      </button>
    </div>
  );
};
