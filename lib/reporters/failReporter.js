const failReporter = (report) => {
  let failed = false

  if (report.failed.length) failed = true
  if (report.missing.length) failed = true

  if (failed) process.exit(1)
}

module.exports = failReporter
