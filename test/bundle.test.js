import chai from 'chai'
import spies from 'chai-spies'
import promise from 'chai-as-promised'
import bundle from '../src/bundle'

import { graphql } from 'graphql'
import { makeExecutableSchema } from 'graphql-tools'

chai.use(spies).use(promise)

const expect = chai.expect

describe('bundle', () => {
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
    it('should register resolvers when queries are available', () => {
      const module = {
        queries: 'customQuery(arg: String): String',
        resolvers: { queries: { customQuery: () => null } },
      }
      const { resolvers } = bundle([module])

      expect(resolvers).to.have.property('RootQuery')
    })

    it('should register field resolvers', () => {
      const module = {
        resolvers: {
          Type: { field: () => null }
        },
      }
      const { resolvers } = bundle([module])

      expect(resolvers).to.have.property('Type')
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

    it('should register multiple module and multiple resolvers for one type', () => {
      const moduleA = {
        schema: `
          type ModuleA {
            id: ID!,
            moduleB: ModuleB,
            moduleC: ModuleC
          }
        `,
        queries: 'queryB(arg: String): String',
        resolvers: { queries: { queryA: () => null } },
      }

      const moduleB = {
        schema: `
          type ModuleB {
            id: ID!
          }
        `,
        resolvers: { ModuleA: { moduleB: () => null } },
      }

      const moduleC = {
        schema: `
          type ModuleC {
            id: ID!
          }
        `,
        resolvers: { ModuleA: { moduleC: () => null } },
      }

      const { resolvers } = bundle([moduleA, moduleB, moduleC])

      expect(resolvers).to.have.deep.property('ModuleA.moduleB')
      expect(resolvers).to.have.deep.property('ModuleA.moduleC')
    })

    it('should combine resolvers when same', () => {
      const moduleA = {
        schema: `
          interface Node {
            id: String!
          }
        `,
      }

      const moduleB = {
        schema: `
          type ModuleB implements Node {
            id: String!
            uniqueBField: String
          }
        `,
        queries: 'queryB: Node',
        resolvers: {
          Node: { __resolveType: obj => obj.hasOwnProperty('uniqueBField') ? 'ModuleB' : undefined },
        },
      }

      const moduleC = {
        schema: `
          type ModuleC {
            id: String!
            uniqueCField: String
          }
        `,
        resolvers: {
          Node: { __resolveType: obj => obj.hasOwnProperty('uniqueCField') ? 'ModuleC' : undefined },
        },
      }

      const { resolvers } = bundle([moduleA, moduleB, moduleC])

      const b = { id: 'B123', uniqueBField: 'this is B' }
      const c = { id: 'C123', uniqueCField: 'this is C' }

      return Promise.all([
        expect(resolvers.Node.__resolveType(b)).to.eventually.equal('ModuleB'),
        expect(resolvers.Node.__resolveType(c)).to.eventually.equal('ModuleC'),
      ])
    })
  })

  describe('alters', () => {
    it('should allow modules to alter result after bundling', () => {
      const module = { alter: cnf => ({ cnf, extra: true }) }

      // Set-up spy.
      chai.spy.on(module, 'alter')

      const config = bundle([module])

      expect(module.alter).to.have.been.called.once
      expect(config).to.have.property('extra')
    })
  })

  describe('factories', () => {
    it('should be possible to use factory modules', () => {
      const factoryModule = () => ({
        schema: `
          type Test {
            attr: String
          }
        `
      })

      const { typeDefs } = bundle([factoryModule])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type Test { attr: String } schema { }')
    })
  })

  describe('dependencies', () => {
    it('should be possible to define dependencies', () => {
      const moduleA = { schema: 'type CustomType { attr: String }' }

      const moduleB = {
        queries: `
          customQuery(arg: String): CustomType
        `,
        modules: [moduleA]
      }

      const { typeDefs } = bundle([moduleB])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type CustomType { attr: String } type RootQuery { customQuery(arg: String): CustomType } schema { query: RootQuery }')
    })

    it('should be possible to define recursive dependencies (using factories)', () => {
      const moduleA = () => ({
        schema: 'type CustomType { attr: String }',
        modules: [moduleB]
      })

      const moduleB = {
        queries: `
          customQuery(arg: String): CustomType
        `,
        modules: [moduleA]
      }

      const { typeDefs } = bundle([moduleB])
      const simplifiedTypeDefs = typeDefs.replace(/[\s]+/g, ' ').trim()

      expect(simplifiedTypeDefs).to.equal('type CustomType { attr: String } type RootQuery { customQuery(arg: String): CustomType } schema { query: RootQuery }')
    })
  })
})

describe('execution', () => {
  const moduleA = {
    schema: 'interface Node { id: String! }',
    queries: `
      hello: String
      nodes: [Node]
    `,
    mutations: 'change: String',
    resolvers: {
      queries: { hello: () => 'Hello world' },
      mutations: { change: () => 'modified something' }
    }
  }

  const moduleB = {
    schema: `
      type TypeB implements Node {
        id: String!
        uniqueBField: String
        resolvedBField: String
      }
    `,
    queries: `
      queryB: TypeB
      queryNodeB: Node
    `,
    resolvers: {
      queries: {
        queryB: () => ({ id: 'B123', uniqueBField: 'this is a B instance' }),
        queryNodeB: () => ({ id: 'B123', uniqueBField: 'this is a B instance' }),
      },
      TypeB: {
        resolvedBField: ({ id }) => `resolved field from TypeB ${id}`,
      },
      Node: { __resolveType: obj => obj.hasOwnProperty('uniqueBField') ? 'TypeB' : undefined },
    },
  }

  const moduleC = {
    schema: 'type TypeC implements Node { id: String!, uniqueCField: String }',
    queries: 'queryNodeC: Node',
    resolvers: {
      queries: { queryNodeC: () => ({ id: 'C123', uniqueCField: 'this is a C instance' }) },
      Node: { __resolveType: obj => obj.hasOwnProperty('uniqueCField') ? 'TypeC' : undefined },
    },
  }

  const schema = makeExecutableSchema(bundle([moduleA, moduleB, moduleC]))

  it('should execute root resolvers', () => {
    return expect(graphql(schema, '{ hello }'))
      .to.eventually.have.deep.property('data.hello', 'Hello world')
  })

  it('should execute root mutations', () => {
    return expect(graphql(schema, 'mutation { change }'))
      .to.eventually.have.deep.property('data.change', 'modified something')
  })

  it('should execute type resolvers', () => {
    return expect(graphql(schema, '{ queryB { id } }'))
      .to.eventually.have.deep.property('data.queryB.id', 'B123')
  })

  it('should resolve custom type field resolvers', () => {
    return expect(graphql(schema, '{ queryB { resolvedBField } }'))
      .to.eventually.have.deep.property('data.queryB.resolvedBField', 'resolved field from TypeB B123')
  })

  it('should resolve fragments of interfaces', () => Promise.all([
    expect(graphql(schema, '{ queryNodeB { ... on TypeB { uniqueBField } } }'))
      .to.eventually.have.deep.property('data.queryNodeB.uniqueBField', 'this is a B instance'),
    expect(graphql(schema, '{ queryNodeC { ... on TypeC { uniqueCField } } }'))
      .to.eventually.have.deep.property('data.queryNodeC.uniqueCField', 'this is a C instance'),
  ]))
})
