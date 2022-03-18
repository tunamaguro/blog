import React from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"

const PageBase = ({ children }) => (
  <div className="flex flex-col min-h-screen max-w-3xl  mx-auto">
    <header className="px-4 sm:px-6 py-4 border-b-2 border-b-gray-400">
      <Link to="/" className="flex">
        <StaticImage src="../images/icon.png" alt="icon" class="w-10 mr-2" />
        <span className="text-2xl font-bold italic">tunamaguro/blog</span>
      </Link>
    </header>
    <main className="flex-grow p-4">{children}</main>
    <footer className="p-4 border-t-2 border-t-gray-400 text-center text-gray-400">
      <div class="mb-2">© 2022 tunamaguro</div>
      <div>
        Build with{"   "}
        <a href="https://www.gatsbyjs.com/">
          <StaticImage
            src="../images/gatsby-icon.png"
            alt="Gatsby"
            class="w-6"
          />
        </a>
      </div>
    </footer>
  </div>
)

export default PageBase
