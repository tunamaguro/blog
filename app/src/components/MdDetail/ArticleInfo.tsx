import type { ReactNode } from "react"

type ArticleMeta = {
    key: string | number,
    name: ReactNode,
    value: ReactNode
}

export type ArticleInfoProps = {
    info?: (ArticleMeta | null)[]
}

export const ArticleInfo = ({ info }: ArticleInfoProps) => {
    if (!info) {
        return null
    }
    return <div className="flex justify-center gap-12">
        {info.map((v) => {
            if (v === null) { return null }
            return <div key={v.key} className="flex flex-col gap-2">
                <div className="text-sm font-semibold">{v.name}</div>
                <div className="text-accent-content">{v.value}</div>
            </div>
        })}
    </div>
}