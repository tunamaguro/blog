export type Props = {
    dialog_id: string;
};

export const SearchDialog = ({ dialog_id }: Props) => {
    return (
        <dialog id={dialog_id} className="modal modal-top" open>
            <div className="modal-box modal-top">
                <h3 className="font-bold text-lg">Hello!</h3>
                <p className="py-4">Press ESC key or click outside to close</p>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    );
};
