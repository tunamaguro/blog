type Route = {
    href: string,
    text: string
}

export const routes: Route[] = [
    {
        href: "/",
        text: "Home"
    },
    {
        href: "/articles",
        text: "Blog",
    },
    {
        href: "/articles/about",
        text: "利用規約"
    }
]