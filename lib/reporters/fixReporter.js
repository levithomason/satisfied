const logSymbols = require('log-symbols')
const chalk = require('chalk')
const _ = require('halcyon')
const semver = require('semver')

const { sh } = require('../utils')

const fixReporter = (report, opts = {}) => {
  const { cli } = opts
  if (cli !== 'npm' && cli !== 'yarn') {
    throw new Error('fixReporter requires opts.cli of `npm` or `yarn`, got: ' + cli)
  }

  if (!report.failed.length && !report.missing.length) return

  console.log()
  console.log(logSymbols.info, chalk.white('Fixing dependencies...'))
  //
  // Collect ranges (from package.json and peers)
  //
  const requesterSpecs = {
    // [name]: {
    //   type: 'dependencies|devDependencies'
    //   requesters: {
    //     [requester]: <range>
    //   },
    // }
  }

  const collectRequesterSpecs = failed => {
    const { name, requester, wanted } = failed
    requesterSpecs[name] = requesterSpecs[name] || {}

    requesterSpecs[name].type = failed.type

    requesterSpecs[name].requesters = requesterSpecs[name].requesters || {}
    requesterSpecs[name].requesters[requester] = wanted
  }

  report.failed.forEach(collectRequesterSpecs)
  report.missing.forEach(collectRequesterSpecs)

  //
  // Resolve versions to install
  //

  // updates === [{ name, type, version }, ... ]
  const updates = Object.keys(requesterSpecs).reduce((acc, name) => {
    const { type, requesters } = requesterSpecs[name]
    const ranges = _.values(requesters)

    // available versions that satisfy all ranges
    const versions = eval(sh(`npm view ${name} versions --json`)) // eslint-disable-line no-eval
      .filter(version => ranges.every(range => semver.satisfies(version, range)))

    // nothing on npm satisfied every range
    if (!versions.length) {
      console.log()
      console.log(
        logSymbols.error,
        chalk.bold.red(name),
        'no published version satisfies all ranges:',
        Object.keys(requesters).map(key => {
          return [
            '\n  ',
            chalk.white(key),
            chalk.gray('wants'),
            chalk.white(name),
            chalk.gray('in'),
            chalk.white(requesters[key]),
          ].join(' ')
        }).join('')
      )

      process.exit(1)
    }

    // every version here satisfies all ranges
    // use the greatest
    const version = versions.reduce((acc, next) => semver.gt(acc, next) ? acc : next)

    acc.push({ name, type, version })

    return acc
  }, [])

  if (!updates.length) {
    console.log(logSymbols.info, chalk.bold('No updates can be made'))
    return
  }

  //
  // Install
  //
  const cmds = updates.map(({ name, type, version }) => {
    const args = []
    let cmd = ''

    if (cli === 'npm') {
      cmd = 'install'
      args.push(type === 'devDependencies' ? '--save-dev' : '--save')
    } else if (cli === 'yarn') {
      cmd = 'add'
      if (type === 'devDependencies') args.push('--dev')
    }

    const fullCmd = `${cli} ${cmd} ${name}@${version} ${args.join(' ')}`

    // log all commands before running
    console.log(chalk.gray(`  ${fullCmd}`))

    return fullCmd
  })

  cmds.forEach(cmd => sh(cmd))
  console.log()
  console.log(logSymbols.info, chalk.white('Cleaning up extraneous...'))
  //
  // Fix Extraneous
  //
  if (cli === 'npm') {
    sh('npm prune')
  } else if (cli === 'yarn') {
    // yarn has no prune, `install` prunes
    // https://github.com/yarnpkg/yarn/issues/696
    sh('yarn install')
  }

  console.log()
  console.log(logSymbols.success, chalk.bold('Review and commit, if necessary.'))
}

module.exports = fixReporter
