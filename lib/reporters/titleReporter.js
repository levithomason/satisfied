const chalk = require('chalk')
const _ = require('halcyon')
const pkg = require('../../package.json')
const path = require('path')

const consoleReporter = (report, opts = {}) => {
  const { debug } = opts
  const hasFailures = report.failed.length || report.missing.length
  const hasPasses = debug && report.passed.length

  // nothing to report
  if (!hasPasses && !hasFailures) return

  console.log()
  console.log(chalk.bold.gray('–'.repeat(79)))
  console.log(chalk.bold.white(_.pad(79, ' ', `Satisfied v${pkg.version}`)))
  console.log(chalk.magenta(_.pad(79, ' ', `./${path.relative(process.cwd(), report.pkgPath)}`)))
}

module.exports = consoleReporter
