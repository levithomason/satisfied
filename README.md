<!-- Logo -->
<p align="center">
  <img height="128" width="128" src="https://github.com/levithomason/satisfied/raw/master/logo.png">
</p>

<!-- Name -->
<h1 align="center">satisfied</h1>
<p align="center">
  Keep your package.json version requirements satisfied
</p>

# Install

    $ npm install satisfied --save-dev

# Usage

The best way to use `satisfied` is in your package.json scripts:
    

```json
{
  "scripts": {
    "satisfied": "satisfied --fix"
  }
}
```
```
$ npm run satisfied
```

### Fix dependencies before starting your app:

```
satisfied --fix && node index.js 
```

### Fail tests early if node_modules do not match package.json exactly. 

```
satisfied --exact && mocha
```

# --fix

Fixes:

1. `node_modules` that do not satisfy `package.json` requirements
1. `node_modules` that do not satisfy peers
1. `package.json` versions that do not satisfy peers

Installs the latest exact published version that satisfies the current package.json range and every peer's range.  If this silver-bullet-version does not exist `satisfied` throws. There is simply no version in existence that satisfies all the required ranges.

How?

1. Gathers ranges from `package.json` and peers
1. Gets all available versions from NPM
1. Filters only versions that satisfy all ranges
1. Reduces the greatest version
1. Installs that exact version
1. Updates package.json and/or yarn.lock

Review and commit the changes :beers:

# CLI

    Usage: satisfied [options]
    
    Options:
      --skip-invalid, -I  Skips checking invalid ranges (e.g. github urls) [boolean]
      --exact, -e         Check and fix using exact versions               [boolean]
      --fix, -f           Install modules that satisfy package.json
                                                            [choices: "npm", "yarn"]
      --ignore, -i        RegExp matching modules names to ignore           [string]
      --no-deps, -D       Exclude dependencies                             [boolean]
      --no-devs, -V       Exclude devDependencies                          [boolean]
      --no-peers, -P      Exclude peerDependencies                         [boolean]
      --debug, -d         Output more info                                 [boolean]
      -h, --help          Show help                                        [boolean]
      -v, --version       Show version number                              [boolean]
    
    Examples:
      satisfied --fix                     Fix issues using npm
      satisfied --fix yarn                Fix issues using yarn
      satisfied --ignore "babel-plugin-"  Ignore babel-plugins
      satisfied --no-peers                Exclude peerDependencies

# Why?

Having a `package.json` or `yarn.lock` means nothing if it isn't satisfied by the modules that are actually installed.

- Neither `npm` nor `yarn` have a `--fix` command 
- Neither `npm` nor `yarn` respects peer dependency versions
- CI services cache your modules, passing your tests with the wrong deps installed
- You build and publish packages on outdated deps
- You switch branches and have no idea that the updated package.json isn't satisfied with your node_modules  

[1]: https://github.com/yarnpkg/yarn
