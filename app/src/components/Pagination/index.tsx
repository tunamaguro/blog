import { clsx } from "clsx";

type RangeFn = { start?: number; end: number };

const range = ({ start = 0, end }: RangeFn) =>
    Array(end - start)
        .fill(0)
        .map((_, idx) => idx + start);

type Props = {
    count: number;
    currentPage: number;
    moveTo: URL;
};

export const Pagination = ({
    count,
    currentPage,
    moveTo,
}: Props) => {
    return (
        <ul className="join">
            {range({ start: 1, end: count + 1 }).map((page) => {
                const isCurrentPageItem = page === currentPage;
                const isFirstPage = page === 1;
                const relatePath = (isFirstPage ? "" : page).toString();
                const href = new URL(`${moveTo.pathname}/${relatePath}`,
                    moveTo
                )
                return (
                    <li>
                        <a href={href.toString()}>
                            <button
                                className={clsx(
                                    "join-item btn",
                                    isCurrentPageItem && "btn-active",
                                )}
                            >
                                {page}
                            </button>
                        </a>
                    </li>
                );
            })}
        </ul>
    );
};
