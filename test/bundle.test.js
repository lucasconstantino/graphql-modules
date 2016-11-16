import { expect } from 'chai'
import bundle from '../src/bundle'

describe('#bundle()', () => {
  describe('types', () => {
    it('should create a type definition', () => {
      const module = {
        schema: `
        type Test {
          attr: String
        }
        `
      }

      const { typeDefs } = bundle([module])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type Test { attr: String } schema { }')
    })

    it('should bundle type definitions', () => {
      const moduleA = {
        schema: `
        type TypeA {
          attr: String
        }
        `
      }

      const moduleB = {
        schema: `
        type TypeB {
          attr: String
        }
        `
      }

      const { typeDefs } = bundle([moduleA, moduleB])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type TypeA { attr: String } type TypeB { attr: String } schema { }')
    })
  })

  describe('queries', () => {
    it('should create query definitions', () => {
      const module = {
        queries: `
          queryA(arg: String): String
        `
      }

      const { typeDefs } = bundle([module])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type RootQuery { queryA(arg: String): String } schema { query: RootQuery }')
    })

    it('should bundle query definitions', () => {
      const moduleA = {
        queries: `
          queryA(arg: String): String
        `
      }

      const moduleB = {
        queries: `
          queryB(arg: String): String
        `
      }

      const { typeDefs } = bundle([moduleA, moduleB])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type RootQuery { queryA(arg: String): String queryB(arg: String): String } schema { query: RootQuery }')
    })
  })

  describe('mutations', () => {
    it('should create mutation definitions', () => {
      const module = {
        mutations: `
          mutationA(arg: String): String
        `
      }

      const { typeDefs } = bundle([module])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type RootMutation { mutationA(arg: String): String } schema { mutation: RootMutation }')
    })

    it('should bundle mutation definitions', () => {
      const moduleA = {
        mutations: `
          mutationA(arg: String): String
        `
      }

      const moduleB = {
        mutations: `
          mutationB(arg: String): String
        `
      }

      const { typeDefs } = bundle([moduleA, moduleB])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type RootMutation { mutationA(arg: String): String mutationB(arg: String): String } schema { mutation: RootMutation }')
    })
  })

  describe('subscriptions', () => {
    it('should create subscription definitions', () => {
      const module = {
        subscriptions: `
          subscriptionA(arg: String): String
        `
      }

      const { typeDefs } = bundle([module])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type RootSubscription { subscriptionA(arg: String): String } schema { subscription: RootSubscription }')
    })

    it('should bundle subscription definitions', () => {
      const moduleA = {
        subscriptions: `
          subscriptionA(arg: String): String
        `
      }

      const moduleB = {
        subscriptions: `
          subscriptionB(arg: String): String
        `
      }

      const { typeDefs } = bundle([moduleA, moduleB])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type RootSubscription { subscriptionA(arg: String): String subscriptionB(arg: String): String } schema { subscription: RootSubscription }')
    })
  })

  describe('resolvers', () => {
    it('should not register resolvers when no query is available', () => {
      const module = {
        // queries: 'queryA(arg: String): String',
        resolvers: { queries: { customQuery: () => null } },
      }
      const { resolvers } = bundle([module])

      expect(resolvers).not.to.have.property('RootQuery')
    })

    it('should register resolvers when queries are available', () => {
      const module = {
        queries: 'customQuery(arg: String): String',
        resolvers: { queries: { customQuery: () => null } },
      }
      const { resolvers } = bundle([module])

      expect(resolvers).to.have.property('RootQuery')
    })

    it('should register multiple module resolvers', () => {
      const moduleA = {
        queries: 'queryA(arg: String): String',
        resolvers: { queries: { queryA: () => null } },
      }

      const moduleB = {
        queries: 'queryB(arg: String): String',
        resolvers: { queries: { queryB: () => null } },
      }

      const { resolvers } = bundle([moduleA, moduleB])

      expect(resolvers).to.have.deep.property('RootQuery.queryA')
      expect(resolvers).to.have.deep.property('RootQuery.queryB')
    })
  })
})
