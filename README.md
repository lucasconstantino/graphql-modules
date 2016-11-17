# GraphQL Modules

A library to simplify modularization of [Apollo server](http://dev.apollodata.com/tools/graphql-server/index.html) applications.

![Build status](https://travis-ci.org/lucasconstantino/graphql-modules.svg?branch=master)

## Installation

This package is available on [npm](https://www.npmjs.com/package/graphql-modules) as: *graphql-modules*

```
npm install graphql-modules
```

> You should consider using [yarn](https://yarnpkg.com/), though.

## Usage

Say you have a system with books and authors. You could have a module to define the Books functionality and one for the Authors functionality. Then, you would bundle them up into a single schema using `graphql-modules`. You could end up with something like this:

#### `/books.js`:

```js
const books = [
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
const books = () => books
const book = (root, args) => books.find(book => book.id === args.id)

const resolvers = {
  queries: {
    books,
    book
  }
}

export default {
  schema,
  queries,
  resolvers,
}
```

In this file, we define a schema, queries, and resolvers. At the end, we export those assets in a single object - the module.

#### `/authors.js`:

```js
const authors = [
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
const authors = () => authors
const author = (root, args) => authors.find(author => author.id === args.id)

const resolvers = {
  queries: {
    authors,
    author
  }
}

export default {
  schema,
  queries,
  resolvers,
}
```

This file is almost copy and paste from the previous.

#### `/schema.js`

```js
import { bundle } from 'graphql-modules'
import { makeExecutableSchema } from 'graphql-tools'

import books from './books'
import authors from './authors'

const modules = [books, authors]

export default makeExecutableSchema(bundle(modules))
```

At this last file, we create our schema (for this example, we are using [graphql-tools](https://github.com/apollostack/graphql-tools)'s `makeExecutableSchema`).

## Further steps

This project is a work in process, a proof of concept, and can be expanded as wish. I believe this should some day be integrated into the *graphql-tools* project somehow.
