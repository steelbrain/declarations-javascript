/* @flow */

import traverse from 'babel-traverse'
import { parse } from 'babylon'
import { getBinding } from './helpers'
import type { Declaration, Options } from './types'

export function scanDeclarations(
  filePath: string,
  fileContents: string,
  nodeInRange: ((node: Object) => boolean),
  options: Options = {}
): Array<Declaration> {
  let ast
  const toReturn = []
  try {
    ast = parse(fileContents, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'flow',
        'asyncFunctions',
        'classConstructorCall',
        'doExpressions',
        'trailingFunctionCommas',
        'objectRestSpread',
        'decorators',
        'classProperties',
        'exportExtensions',
        'exponentiationOperator',
        'asyncGenerators',
        'functionBind',
        'functionSent',
      ],
      filename: filePath,
    })
  } catch (_) {
    return []
  }

  traverse(ast, {
    ImportDeclaration(path: Object) {
      if (!path.node.loc || !nodeInRange(path.node) || path.node.source.type !== 'StringLiteral') {
        return
      }
      const node = path.node
      toReturn.push({
        name: null,
        position: node.source.loc,
        source: {
          name: null,
          filePath: node.source.value,
          position: null,
        },
      })
    },
    CallExpression(path: Object) {
      if (!path.node.loc || !nodeInRange(path.node)) {
        return
      }
      const node = path.node
      if (!(
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments.length &&
        node.arguments[0].type === 'StringLiteral'
      )) {
        return
      }
      const argument = node.arguments[0]
      toReturn.push({
        name: null,
        position: argument.loc,
        source: {
          name: null,
          filePath: argument.value,
          position: argument.loc,
        },
      })
    },
    ReferencedIdentifier(path: Object) {
      if (!path.node.loc || !nodeInRange(path.node)) {
        return
      }
      const declaration = getBinding(path.scope, path.node.name)
      if (!declaration) {
        return
      } else if (path.node === declaration.identifier) {
        // Ignore require expressions here, they'll need paths
        return
      }
      toReturn.push({
        name: path.node.name,
        position: path.node.loc,
        source: {
          name: null,
          filePath: null,
          position: declaration.identifier.loc,
        },
      })
    },
  })

  return toReturn
}
