import React from "react"
import { Link } from "gatsby"

const PageBase = ({ children }) => (
  <div className="flex flex-col min-h-screen max-w-3xl  mx-auto">
    <header className="px-4 sm:px-6 py-4 border-b-2 border-b-gray-400">
      <Link to="/">
        <span className="text-2xl font-bold italic">tunamaguro/blog</span>
      </Link>
    </header>
    <main className="flex-grow p-4">{children}</main>
    <footer className="p-4 border-t-2 border-t-gray-400 text-center text-gray-400">
      © 2022 tunamaguro
    </footer>
  </div>
)

export default PageBase
