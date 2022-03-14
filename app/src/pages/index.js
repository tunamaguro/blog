import * as React from "react"

const BlogIndex = () => {
  return (
    <div className="flex flex-col min-h-screen max-w-3xl  mx-auto">
      <header className="px-4 sm:px-6 py-6 bg-lime-300">Super Header</header>
      
      <section className="flex-grow prose lg:prose-xl max-w-none">
        <h1>This is h1</h1>
        <h2>This is h2</h2>
        <h3>This is h3</h3>
        <ul>
          <li>item 1</li>
          <li>item 2</li>
        </ul>
      </section>
      <footer className="p-4 border-t-4 border-t-gray-200 text-center bg-yellow-200">
        @2022 tunamaguro
      </footer>
    </div>
  )
}

export default BlogIndex
