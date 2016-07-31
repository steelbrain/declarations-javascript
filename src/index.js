/* @flow */

import traverse from 'babel-traverse'
import { parse } from 'babylon'
import { getBinding } from './helpers'
import type { Declaration } from './types'

export function scanDeclarations(
  filePath: string,
  fileContents: string,
  nodeInRange: ((node: Object) => boolean)
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
      const importSpecifiers = path.node.specifiers
      for (let i = 0, length = importSpecifiers.length; i < length; ++i) {
        const specifier = importSpecifiers[i]
        toReturn.push({
          name: specifier.local.name,
          position: specifier.local.loc,
          source: {
            name: specifier.imported && specifier.imported.type === 'Identifier' ? specifier.imported.name : null,
            filePath: path.node.source.value,
            position: path.node.source.loc,
          },
        })
      }
    },
    VariableDeclarator(path: Object) {
      if (!path.node.loc || !nodeInRange(path.node)) {
        return
      }
      const node = path.node
      if (!(
        node.init &&
        node.init.type === 'CallExpression' &&
        node.init.callee.type === 'Identifier' &&
        node.init.callee.name === 'require' &&
        node.init.arguments.length &&
        node.init.arguments[0].type === 'StringLiteral'
      )) {
        return
      }
      const argument = node.init.arguments[0]
      if (node.id.type === 'ObjectPattern') {
        for (let i = 0, length = node.id.properties.length; i < length; ++i) {
          const property = node.id.properties[i]
          if (property.type !== 'ObjectProperty') {
            // Ignore super deep requires
            continue
          }
          toReturn.push({
            name: property.value.name,
            position: property.value.loc,
            source: {
              name: property.key.name,
              filePath: argument.value,
              position: argument.loc,
            },
          })
        }
      } else if (node.id.type === 'Identifier') {
        toReturn.push({
          name: node.id.name,
          position: node.id.loc,
          source: {
            name: null,
            filePath: argument.value,
            position: argument.loc,
          },
        })
      }
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
