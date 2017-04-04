#!/usr/bin/env node

// ============================================================
// Check for updates
// ============================================================
const updateNotifier = require('update-notifier')

updateNotifier({ pkg: require('./package.json') }).notify()

// ============================================================
// Parse Args
// ============================================================
const argv = require('yargs')
  .usage('Usage: $0 [options]')
  .option('skip-invalid', {
    alias: 'I',
    describe: 'Skips checking invalid ranges (e.g. github urls)',
    type: 'boolean',
  })
  .option('exact', {
    alias: 'e',
    describe: 'Check and fix using exact versions',
    type: 'boolean',
  })
  .option('fix', {
    alias: 'f',
    describe: 'Install modules that satisfy package.json',
    coerce: val => val === true ? 'npm' : val,
    choices: ['npm', 'yarn'],
  })
  .option('ignore', {
    alias: 'i',
    describe: 'RegExp matching modules names to ignore',
    type: 'string',
    nargs: 1,
  })
  .option('no-deps', {
    alias: 'D',
    describe: 'Exclude dependencies',
    type: 'boolean',
  })
  .option('no-devs', {
    alias: 'V',
    describe: 'Exclude devDependencies',
    type: 'boolean',
  })
  .option('no-peers', {
    alias: 'P',
    describe: 'Exclude peerDependencies',
    type: 'boolean',
  })
  .option('debug', {
    alias: 'd',
    describe: 'Output more info',
    type: 'boolean',
  })
  .example('$0 --fix', 'Fix issues using npm')
  .example('$0 --fix yarn', 'Fix issues using yarn')
  .example('$0 --ignore "babel-plugin-"', 'Ignore babel-plugins')
  .example('$0 --no-peers', 'Exclude peerDependencies')
  .alias('h', 'help')
  .alias('v', 'version')
  .version()
  .help()
  .argv

const { debug, exact, fix, ignore, noDeps, noDevs, skipInvalid, noPeers } = argv

// ============================================================
// Run
// ============================================================
const path = require('path')
const satisfied = require('./lib/satisfied')
const { sh } = require('./lib/utils')

const dir = sh('npm root')
const NPM_PREFIX = sh('npm prefix')

const pkgPath = path.join(NPM_PREFIX, 'package.json')
const pkg = require(pkgPath)

// ----------------------------------------
// Get Satisfied Report
// ----------------------------------------
const runReport = () => {
  const opts = more => Object.assign({
    dir,
    exact,
    ignore,
    skipInvalid,
    peers: !noPeers,
  }, more)

  const createReport = () => ({
    dir,
    pkg,
    pkgPath,
    passed: [],
    failed: [],
    missing: [],
  })

  const report = createReport()

  const parseResults = (pkgKey, results) => {
    results.forEach(result => {
      if (!result.installed) {
        report[pkgKey].missing.push(result)
        report.missing.push(result)
      } else if (!result.satisfied) {
        report[pkgKey].failed.push(result)
        report.failed.push(result)
      } else if (debug) {
        report[pkgKey].passed.push(result)
        report.passed.push(result)
      }
    })
  }

  if (!noDeps) {
    const depResults = satisfied(pkg.dependencies, opts({ type: 'dependencies' }))
    report.dependencies = Object.assign(createReport(), { type: 'dependencies' })
    parseResults('dependencies', depResults)
  }

  if (!noDevs) {
    const devResults = satisfied(pkg.devDependencies, opts({ type: 'devDependencies' }))
    report.devDependencies = Object.assign(createReport(), { type: 'devDependencies' })
    parseResults('devDependencies', devResults)
  }

  return report
}

// ============================================================
// Report
// ============================================================
const consoleReporter = require('./lib/reporters/consoleReporter')
const failReporter = require('./lib/reporters/failReporter')
const fixReporter = require('./lib/reporters/fixReporter')
const summaryReporter = require('./lib/reporters/summaryReporter')
const tipReporter = require('./lib/reporters/tipReporter')
const titleReporter = require('./lib/reporters/titleReporter')

const report = runReport()

const printReport = (report) => {
  titleReporter(report)
  if (!noDeps) consoleReporter(report.dependencies, { debug })
  if (!noDevs) consoleReporter(report.devDependencies, { debug })

  summaryReporter(report, { debug })
  tipReporter(report, { fix })
}

if (fix) {
  if (debug) printReport(report)
  fixReporter(report, { cli: fix })
} else {
  printReport(report)
  failReporter(report)
}
