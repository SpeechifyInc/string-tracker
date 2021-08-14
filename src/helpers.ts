import { Change, StringOp } from '.'

// Simulates the internal toNumber function: https://tc39.es/ecma262/#sec-tonumber
export const toNumber = (num: any) => new Int32Array(1).fill(num)[0]

// Simulates the internal toUint32 function: https://tc39.es/ecma262/#sec-tonumber
export const toUint32 = (num: any) => new Uint32Array(1).fill(num)[0]

// Snippet taken from escape-string-regexp
// Builds an equivalent regex for a string
export const stringToRegex = (str: string, flags: string = 'g') =>
  new RegExp(String(str).replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'), flags)

/**
 * Attempts to find the overlap on the end of the source string
 * and beginning of the diff string
 * Ex. 'hello fob', 'ob hello' returns 2 for 'ob'
 * Ex. 'foo bar', 'a foo bar' returns 0
 * Ex. 'hello world', 'world hello' returns 5 for 'world'
 */
export function getOverlap(source: string, diff: string) {
  if (diff === source) return diff.length
  for (let i = diff.length; i > 0; i--) {
    if (source[source.length - i] !== diff[0]) continue
    if (source.endsWith(diff.slice(0, i))) return i
  }
  return 0
}

// Change Helpers
export const isAdd = (change: Change | undefined) => typeof change !== 'string' && change?.[0] === StringOp.Add
export const isRemove = (change: Change | undefined) => typeof change !== 'string' && change?.[0] === StringOp.Remove
export const getChangeText = (change: Change): string => (typeof change === 'string' ? change : change[1])
export const getChangeLength = (change: Change) => getChangeText(change).length

export const cleanChanges = (changes: Change[]): Change[] => {
  const newChanges = changes.reduce<Change[]>((newChanges, change, i) => {
    // Remove empty changes
    if (getChangeLength(change) === 0) return newChanges

    const lastChange = newChanges.slice(-1)[0]
    // Handle first iteration
    if (lastChange === undefined) return [change] as Change[]

    // Combine two string changes next to each other
    if (typeof lastChange === 'string' && typeof change === 'string')
      return [...newChanges.slice(0, -1), lastChange + change]
    // Combine two StringOp changes next to each other
    if ((isAdd(lastChange) && isAdd(change)) || (isRemove(lastChange) && isRemove(change)))
      return [
        ...newChanges.slice(0, -1),
        [lastChange[0], getChangeText(lastChange) + getChangeText(change)],
      ] as Change[]
    // Add change
    return [...newChanges, change]
  }, [])

  // Special case since we never want to have an empty array of changes
  if (newChanges.filter((change) => !isRemove(change)).length === 0) return ['', ...newChanges]
  return newChanges
}

export const addChange = (changes: Change[], index: number, change: Change) => [
  ...changes.slice(0, index),
  change,
  ...changes.slice(index),
]

export const replaceChangeText = (change: Change, text: string) =>
  (typeof change === 'string' ? text : [change[0], text]) as Change

export const replaceChange = (changes: Change[], index: number, change: Change) => [
  ...changes.slice(0, index),
  change,
  ...changes.slice(index + 1),
]

export const sliceChange = (change: Change, startIndex = 0, endIndex = getChangeLength(change)): Change =>
  typeof change === 'string' ? change.slice(startIndex, endIndex) : [change[0], change[1].slice(startIndex, endIndex)]
