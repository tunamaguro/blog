import type { ButtonHTMLAttributes } from "react";

import { clsx } from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

type Props = { open_dialog_id: string } & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

const openDialog = (dialog_id: string) => {
  const dialogElement: HTMLDialogElement | undefined = document.getElementById(dialog_id)
  console.log(dialogElement)
  dialogElement?.showModal()
}

export const SearchBar = ({ className, open_dialog_id }: Props) => {

  return (
    <div className="p-1">
      <button
        className={clsx(
          "w-full text-lg bg-base-200 rounded-md flex cursor-pointer hover:outline hover:font-bold items-center",
          className,
        )}
        onClick={() => { openDialog(open_dialog_id) }}
      >
        <span className="py-6 px-4">
          <FontAwesomeIcon
            className="h-4 w-4 text-base-content"
            strokeWidth={0.5}
            icon={faMagnifyingGlass}
          />
        </span>
        <div className="grid items-center justify-center text-xl text-base-content focus:outline-none">
          <span>検索</span>
        </div>
      </button>
    </div>
  );
};
