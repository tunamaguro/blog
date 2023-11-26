import type { ReactNode } from "react";

type TagProps = { tag: string, children: ReactNode };


export const Tag = ({ tag, children }: TagProps) => {
    return <a href={`/tags/${tag}`}>
        <div className="badge badge-outline">
            {children}
        </div>
    </a>

}