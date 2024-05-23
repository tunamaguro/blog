import type { DialogHTMLAttributes, ReactNode } from "react";

import { clsx } from "clsx";

export type Props = {
  dialog_id: string;
  children?: ReactNode;
} & DialogHTMLAttributes<HTMLDialogElement>;

export const SearchDialog = ({ dialog_id, children, className, ...ret }: Props) => {
  return (
    <dialog id={dialog_id} className={clsx("modal items-start", className)} {...ret}>
      <div className="modal-box mt-24 max-w-5xl min-h-64 mx-auto">
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};
