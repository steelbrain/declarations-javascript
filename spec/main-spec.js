/* @flow */

import FS from 'fs'
import Path from 'path'
import { it } from 'jasmine-fix'
import { scanDeclarations } from '../'

const readFile = require('sb-promisify')(FS.readFile)

describe('scanDeclarations', function() {
  async function validateDeclarations(givenPath, write = false) {
    const path = Path.join(__dirname, 'fixtures', givenPath) + '.js'
    const expectedPath = Path.join(Path.dirname(path), `${Path.basename(path).slice(0, -3)}.expected.json`)
    const contents = (await readFile(path, 'utf8')).trim()
    const imports = scanDeclarations(path, contents, () => true)
    if (write) {
      FS.writeFile(expectedPath, JSON.stringify(imports, null, 2))
    } else {
      const expected = (await readFile(expectedPath, 'utf8')).trim()
      expect(JSON.stringify(imports, null, 2)).toBe(expected)
    }
  }

  it('works on import *', async function() {
    await validateDeclarations('import-star')
  })
  it('works on default imports', async function() {
    await validateDeclarations('default-imports/single')
    await validateDeclarations('default-imports/multiple')
  })
  it('works on default requires', async function() {
    await validateDeclarations('default-requires/single')
    await validateDeclarations('default-requires/multiple')
  })
  it('works on named imports', async function() {
    await validateDeclarations('named-imports/single')
    await validateDeclarations('named-imports/multiple')
  })
  it('works on named requires', async function() {
    await validateDeclarations('named-requires/single')
    await validateDeclarations('named-requires/multiple')
  })
})
