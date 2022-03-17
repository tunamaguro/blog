import React from "react"

const PageBase = ({ children }) => (
  <div className="flex flex-col min-h-screen max-w-3xl  mx-auto">
    <header className="px-4 sm:px-6 py-6 border-b-2 border-b-gray-600">
      Super Header
    </header>
    <main className="flex-grow">{children}</main>
    <footer className="p-4 border-t-2 border-t-gray-600 text-center text-gray-400">
      @2022 tunamaguro
    </footer>
  </div>
)

export default PageBase
