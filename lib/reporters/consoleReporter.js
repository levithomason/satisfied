const chalk = require('chalk')
const _ = require('halcyon')
const logSymbols = require('log-symbols')

const consoleReporter = (report, opts = {}) => {
  const { debug } = opts

  const noFailures = !report.failed.length && !report.missing.length
  const noPasses = !debug || !report.passed.length

  // nothing to report
  if (noPasses && noFailures) return

  const INDENT = '  '
  const GUTTER = '  '

  const padFor = (pad, key) => {
    return _.pipe([
      _.pick(['passed', 'failed', 'missing']),
      _.values,
      _.flatten,
      _.map(_.path([key, 'length'])),
      _.max,
      len => _.when(_.isType('string'), pad(len, ' ')),
    ])(report)
  }

  const padName = padFor(_.padRight, 'name')
  const padWanted = padFor(_.padRight, 'wanted')
  const padVersion = padFor(_.padRight, 'version')
  const padRequester = padFor(_.padRight, 'requester')

  const printSymbol = ({ installed, satisfied }) =>
    !installed ? logSymbols.error
      : !satisfied ? logSymbols.warning
      : logSymbols.success

  const printName = ({ installed, name, satisfied }) => {
    const value = padName(name)
    return !installed ? chalk.bold.red(value) : !satisfied ? chalk.bold.yellow(value) : value
  }

  const printVersion = ({ installed, satisfied, version }) => {
    const value = padVersion(version || '  -  ')
    return !installed ? chalk.bold.red(value)
      : !satisfied ? chalk.bold.yellow(value)
        : chalk.white(value)
  }

  const printReason = ({ installed, satisfied }) => {
    const pad = _.pad(6, ' ')
    return !installed ? chalk.red(pad('failed'))
      : !satisfied ? chalk.yellow(pad('missed'))
        : chalk.gray(pad('passed'))
  }

  const printWanted = ({ installed, satisfied, wanted }) => {
    const value = padWanted(wanted)
    return !installed ? chalk.bold.red(value)
      : !satisfied ? chalk.bold.yellow(value)
        : chalk.white(value)
  }

  const printRequester = ({ passed, peer, requester }) => {
    const value = padRequester(requester)
    if (passed) return chalk.gray(value)
    return peer ? chalk.magenta(value) : value
  }

  //
  // TITLE
  //
  console.log()
  console.log(chalk.underline.bold(report.type))

  //
  // LINES
  //
  const printLine = result => {
    console.log(INDENT + printSymbol(result), [
      printName(result),
      printVersion(result),
      printReason(result),
      printRequester(result),
      printWanted(result),
    ].join(GUTTER))
  }
  if (debug) report.passed.forEach(printLine)
  report.failed.forEach(printLine)
  report.missing.forEach(printLine)
}

module.exports = consoleReporter
