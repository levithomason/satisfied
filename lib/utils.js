const cp = require('child_process')

exports.sh = arg => cp.execSync(arg).toString().replace(/\r?\n$/, '')
