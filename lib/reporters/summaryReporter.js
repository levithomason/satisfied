const chalk = require('chalk')
const _ = require('halcyon')
const logSymbols = require('log-symbols')

const lenArrLen = arr => ('' + arr.length).length
const padNum = len => num => _.padRight(len, ' ', '' + num)

const consoleReporter = (report, opts = {}) => {
  const { debug } = opts
  const { passed, failed, missing } = report

  const hasFailures = failed.length || missing.length
  const hasPasses = debug && passed.length

  // nothing to report
  if (!hasPasses && !hasFailures) return

  const INDENT = '  '
  const padTotal = padNum(_.max(_.map(lenArrLen, [passed, failed, missing])))
  console.log(chalk.gray('–'.repeat(79)))

  if (hasPasses) {
    console.log(
      INDENT + logSymbols.success,
      chalk.bold.green(padTotal(passed.length), 'SATISFIED')
    )
  }

  if (hasFailures) {
    const totalIssues = failed.length + missing.length
    const S = totalIssues > 1 ? 'S' : ''
    console.log(
      INDENT + logSymbols.error,
      chalk.bold.red(padTotal(totalIssues)),
      chalk.bold.red(`ISSUE${S}`),
      chalk.gray(`(${failed.length} missed, ${missing.length} failed)`)
    )
    console.log(chalk.gray('–'.repeat(79)))
  }
}

module.exports = consoleReporter
