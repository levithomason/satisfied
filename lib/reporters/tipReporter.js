const logSymbols = require('log-symbols')
const chalk = require('chalk')

// show tips to the user
const tipReporter = (report, { fix }) => {
  const tips = []

  if (!fix && (report.failed.length || report.missing.length)) {
    tips.push('Run with `--fix` to resolve issues')
  }

  if (tips.length) {
    tips.forEach(tip => console.log(logSymbols.info, chalk.white(tip)))
  }
}

module.exports = tipReporter
