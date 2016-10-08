/* @flow */

// NOTE: To workaround the error that reads
// Babel 6.7 warning: You or one of the Babel plugins you are using are using Flow declarations as bindings
export function getBinding(givenScope: Object, name: string): ?Object {
  let scope = givenScope

  do {
    const binding = scope.bindings[name]
    if (binding) {
      return binding
    }
    scope = scope.parent
  } while (scope)

  return null
}
