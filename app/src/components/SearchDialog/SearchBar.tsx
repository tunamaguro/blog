import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
export const SearchBar = () => {
    return (
        <div className="p-1">
            <button className="w-full text-lg bg-base-200 rounded-md flex cursor-pointer hover:outline hover:font-bold items-center">
                <span className="py-6 px-4">
                    <FontAwesomeIcon className="h-4 w-4 text-base-content" strokeWidth={0.5} icon={faMagnifyingGlass} />
                </span>
                <div className="grid items-center justify-center text-xl text-base-content focus:outline-none">
                    <span>
                        検索
                    </span>
                </div>
            </button>
        </div>

    );
};
