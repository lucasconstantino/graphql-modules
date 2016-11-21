import extend from 'extend'

const defaultOptions = {
  rootKeys: {
    query: 'RootQuery',
    mutation: 'RootMutation',
    subscription: 'RootSubscription',
  }
}

// Helper to flatten a deeply nested array.
const flatten = (result, subject) => result.concat(Array.isArray(subject) ? subject.reduce(flatten, []) : subject)

const processedModules = []

const processModule = module => {
  // Recursion security meassure.
  if (processedModules.indexOf(module) !== -1) return []
  processedModules.push(module)

  // 1 - Factory format.
  if (module && module.constructor && module.call && module.apply) {
    return processModule(module())
  }

  // 2 - Array of modules format.
  if (Array.isArray(module)) {
    return module.map(processModule)
  }

  // 3 - Available submodules/dependencies.
  const dependencies = module.modules || []
  delete module.modules

  return [module].concat(dependencies.map(processModule))
}

/**
 * Compiles modules into schema definitions and resolvers as expected by Apollo server.
 *
 * @todo: Add warning for inconsistent data (e.g. resolver without definition).
 * @todo: Add simplified support for custom scalars.
 *
 * @param {Object} modules An array of modules. Each module can be one of the following:
 *                         1 - An object as described in the other params.
 *                         2 - An array of the previous option.
 *                         3 - A factory (function) that returns one of the previous.
 * @param {Array} modules[].modules An array of submodules/dependencies.
 * @param {String} modules[].schema Schema definition string.
 * @param {String} modules[].queries Query definition string.
 * @param {String} modules[].mutations Mutation definition string.
 * @param {String} modules[].subscriptions Subscription definition string.
 * @param {Object} modules[].resolvers Resolver definition object.
 * @param {Object} modules[].resolvers.queries Query resolver map.
 * @param {Object} modules[].resolvers.queries.[key] Query resolver function.
 * @param {Object} modules[].resolvers.mutations Mutation resolver map.
 * @param {Object} modules[].resolvers.mutations.[key] Mutation resolver function.
 * @param {Object} modules[].resolvers.subscriptions Subscription resolver map.
 * @param {Object} modules[].resolvers.subscriptions.[key] Subscription resolver function.
 * @param {Function} modules[].alter A function to alter the resulting configuration object
 *                                 after it's being created.
 * @param {Object} options An object of options.
 * @param {Object} options.rootKeys A map of root query keys.
 * @param {String} [options.rootKeys.query="RootQuery"] The root key for queries.
 * @param {String} [options.rootKeys.mutation="RootMutation"] The root key for mutations.
 * @param {String} [options.rootKeys.subscription="RootSubscription"] The root key for subscriptions.
 *
 * @return {Object} Options as expected by http://dev.apollodata.com/tools/graphql-tools/generate-schema.html#makeExecutableSchema.
 */
export default (modules = [], options = {}) => {
  options = extend(true, {}, defaultOptions, options)
  modules = modules.reduce((modules, module) => modules.concat(processModule(module)), []).reduce(flatten, [])

  const schema = modules.map(module => module.schema || '').filter(Boolean).join(`\n`)
  const queries = modules.map(module => module.queries || '').filter(Boolean).join(`\n`)
  const mutations = modules.map(module => module.mutations || '').filter(Boolean).join(`\n`)
  const subscriptions = modules.map(module => module.subscriptions || '').filter(Boolean).join(`\n`)

  const queriesResolvers = Object.assign.apply(null, modules.map(module => module.resolvers && module.resolvers.queries || {}))
  const mutationsResolvers = Object.assign.apply(null, modules.map(module => module.resolvers && module.resolvers.mutations || {}))
  const subscriptionsResolvers = Object.assign.apply(null, modules.map(module => module.resolvers && module.resolvers.subscriptions || {}))
  const fieldResolvers = Object.assign.apply(null, modules.map(({ resolvers: { queries, mutations, subscriptions, ...fieldResolvers } = {} }) => fieldResolvers))

  const resolvers = {
    ...(queries ? { RootQuery: queriesResolvers } : {}),
    ...(mutations ? { RootMutation: mutationsResolvers } : {}),
    ...(subscriptions ? { RootSubscription: subscriptionsResolvers } : {}),
    ...fieldResolvers
  }

  const RootQuery = queries.length ? `
    type ${options.rootKeys.query} {
      ${queries}
    }
  ` : ''

  const RootMutation = mutations.length ? `
    type ${options.rootKeys.mutation} {
      ${mutations}
    }
  ` : ''

  const RootSubscription = subscriptions.length ? `
    type ${options.rootKeys.subscription} {
      ${subscriptions}
    }
  ` : ''

  const typeDefs = `
    ${schema}
    ${RootQuery}
    ${RootMutation}
    ${RootSubscription}

    schema {
      ${RootQuery && 'query: ' + options.rootKeys.query}
      ${RootMutation && 'mutation: ' + options.rootKeys.mutation}
      ${RootSubscription && 'subscription: ' + options.rootKeys.subscription}
    }
  `

  // typeDefs,
  // resolvers,
  // logger,
  // allowUndefinedInResolve = false,
  // resolverValidationOptions = {},

  const config = { typeDefs, resolvers }

  return modules.reduce((config, { alter = obj => obj }) => alter(config), config)
}
