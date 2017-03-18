# declarations-javascript

[![Greenkeeper badge](https://badges.greenkeeper.io/steelbrain/declarations-javascript.svg)](https://greenkeeper.io/)

`declarations-javascript` is a Node.js module that can scan javascript sources and return the list of declarations. It's useful for creating packages that jump to declarations for IDEs/TextEditors.

## Installation

```
npm install --save declarations-javascript
```

## Features

### Scanner

- Supports jumping to declarations
- Supports latest JS syntax with Babel Parser
- Supports jumping to other `import`ed or `require`d files

## API

```js
type Declaration = {
  name: ?string,
  position: { start: { line: number, column: number }, end: { line: number, column: number } },
  source: {
    name: ?string,
    filePath: ?string,
    position: ?{ start: { line: number, column: number }, end: { line: number, column: number } },
  }
}

export function scanDeclarations(
  filePath: string,
  fileContents: string,
  nodeInRange: ((node: Object) => boolean)
): Array<Declaration>
```

## Examples

```js
/* @flow */

import FS from 'fs'
import promisify from 'sb-promisify'
import { scanDeclarations } from 'declarations-javascript'

const readFile = promisify(FS.readFile)

readFile('./test.js', 'utf8').then(function(fileContents) {
  const declarations = scanDeclarations('./test.js', fileContents, function(node) {
    return node.line > 2 && node.line < 10 && node.column > 0
  })
  console.log('declarations', declarations)
}).catch(function(error) {
  console.error('Unable to read file', error)
})
```

## License
This project is licensed under the terms of MIT License. See the LICENSE file for more info.
