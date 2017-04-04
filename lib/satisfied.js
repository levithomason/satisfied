const _ = require('halcyon')
const path = require('path')
const semver = require('semver')

const getDepPkgPath = (dir, name) => path.join(dir, name, 'package.json')

const isSatisfied = (version, range, opts) => {
  const { exact } = opts
  const wanted = exact ? range.replace(/^[\^~]/, '') : range

  return semver.satisfies(version, wanted)
}

const shouldCheck = (name, range, opts) => {
  const { ignore, skipInvalid } = opts
  if (skipInvalid && !semver.validRange(range)) return false

  return !ignore || !new RegExp(ignore).test(name)
}

/**
 * Get an array of objects describing node_modules that do not satisfy the package.json.
 *
 * @param {object} spec - An object in the shape of package.json dependencies.
 * @param {object} opts
 * @param {object} [opts.dir=cwd] - A node_modules directory to compare the spec against.
 * @param {object} [opts.type] - The type of dependency (dependencies, devDependencies, peerDependencies)
 * @param {object} [opts.exact] - Require exact version matches.
 * @param {object} [opts.ignore] - Pattern of module names to ignore.
 * @param {object} [opts.skipInvalid] - Skips invalid ranges such as github urls.
 * @param {object} [opts.peers=true] - Whether or not to check peer deps of each module.
 * @returns {Array}
 */
const check = (spec, opts = {}) => {
  if (!spec) return []
  const { dir, type, peers } = opts

  return _.pipe([
    _.keys,
    _.filter(name => shouldCheck(name, spec[name], opts)),
    _.chain(name => {
      const wanted = spec[name]
      const result = { type, name, wanted }

      let depPkg = { version: null }
      try {
        depPkg = require(getDepPkgPath(dir, name))
        result.installed = true
      } catch (err) {
        result.installed = false
      }
      const { version, peerDependencies } = depPkg
      result.version = version
      result.requester = check._peerName ? check._peerName : 'package.json'
      result.peer = !!check._peerName
      check._peerName = null
      result.satisfied = isSatisfied(version, wanted, opts)
      result.passed = result.installed && result.satisfied

      if (peers && peerDependencies) {
        const peerOpts = Object.assign({}, opts, { peers: false })
        // ugly, but works
        // the current package is a dep of some kind
        // it has peer deps we want to check() by recursion
        // we need the current dep's name inside the recursion so we can use it as the requester
        check._peerName = name
        return [result, ..._.flatten(check(peerDependencies, peerOpts))]
      }

      return result
    }),
  ])(spec)
}

module.exports = check
