# GraphQL Modules

A library to simplify modularization of [Apollo server](http://dev.apollodata.com/tools/graphql-server/index.html) applications.

![Build status](https://travis-ci.org/lucasconstantino/graphql-modules.svg?branch=master)

## Installation

This package is available on [npm](https://www.npmjs.com/package/graphql-modules) as: *graphql-modules*

```
npm install graphql-modules
```

> You should consider using [yarn](https://yarnpkg.com/), though.

## Basic usage

```js
// module-a.js
// -----------
const moduleA = {
  queries: `
    helloWorld: String
  `
  resolvers: {
    queries: {
      helloWorld: () => 'Hello World!'
    }
  }
}

export default moduleA

// module-b.js
// -----------
const moduleB = {
  queries: `
    helloYou(name: String): String
  `,
  resolvers: {
    queries: {
      helloYou: (root, { name }) => `Hello ${name}!`
    }
  }
}

export default moduleB

// schema.js
// ---------
import { bundle } from 'graphql-modules'
import { makeExecutableSchema } from 'graphql-tools'

import moduleA from './module-a'
import moduleB from './module-b'

const modules = [moduleA, moduleB]


export default makeExecutableSchema(bundle(modules))
```

## Complex needs

This library handles complex situations such as cyclic dependencies between modules. For that to work, each module can be a factory function - besides being a module object. That allows for dependencies to be handled on runtime, making ES6 module binding work as desired. This is pretty much what is proposed by the [official Apollo docs](http://dev.apollodata.com/tools/graphql-tools/generate-schema.html#modularizing).

Say you have a system with books and authors - two modules that are interdependent; books have authors and authors have books. You could end up with something like this:

<details>
 <summary>`/books.js`</summary>
 ```js
 import authors, { data as authorList } from './authors'

 export const data = [
   { id: 1, title: 'JavaScript: The Good Parts', author: 1 },
   { id: 2, title: 'End to end testing with Protractor', author: 2 }
 ]

 const schema = `
   type Book {
     id: String
     title: String
     author: Author
   }
 `

 export const queries = `
   books(): [Book]
   book(id: Int): Book
 `
 const books = () => data
 const book = (root, args) => data.find(book => book.id === args.id)

 const resolvers = {
   queries: {
     books,
     book
   },
   Book: {
     author: book => authorList.find(author => author.id === book.author)
   }
 }

 export default = () => ({
   schema,
   queries,
   resolvers,
   modules: [authors]
 })
 ```
</details>

In this file, we define a schema, queries, and resolvers. At the end, we export those assets in a single object - the module.

<details>
 <summary>`/authors.js`</summary>
 ```js
 import books, { data as bookList } from './books'

 export const data = [
    { id: 1, name: 'Douglas Crockford' },
    { id: 2, name: 'Walmyr Lima' }
 ]

 const schema = `
    type Author {
      id: String
      name: String
      books: [Book]
    }
 `

 export const queries = `
    authors(): [Author]
    author(id: Int): Author
 `
 const authors = () => data
 const author = (root, args) => data.find(author => author.id === args.id)

 const resolvers = {
   queries: {
     authors,
     author
   },
   Author: {
     books: author => bookList.filter(book => book.author === author.id)
   }
 }

 export default () => ({
   schema,
   queries,
   resolvers,
   modules: [books]
 })
 ```
</details>

This file is almost copy and paste from the previous.

<details>
 <summary>`/schema.js`</summary>
 ```js
 import { bundle } from 'graphql-modules'
 import { makeExecutableSchema } from 'graphql-tools'

 import books from './books'

 const modules = [books]

 export default makeExecutableSchema(bundle(modules))
 ```
</details>

At this last file, we create our schema (for this example, we are using [graphql-tools](https://github.com/apollostack/graphql-tools)'s `makeExecutableSchema`).

## Further steps

This project is a work in process, a proof of concept, and can be expanded as wish. I believe this should some day be integrated into the *graphql-tools* project somehow.
