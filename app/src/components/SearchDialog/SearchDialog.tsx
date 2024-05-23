import type { ReactNode } from "react";

export type Props = {
  dialog_id: string;
  children?: ReactNode;
};

export const SearchDialog = ({ dialog_id, children }: Props) => {
  return (
    <dialog id={dialog_id} className="modal items-start">
      <div className="modal-box mt-24 max-w-5xl min-h-64 mx-auto">
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};
