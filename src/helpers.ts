import { Change, StringOp, StringTracker, StringTrackerSymbol } from '.'

// Simulates the internal toInterOrInfinity function: https://tc39.es/ecma262/#sec-tointegerorinfinity
export const toIntegerOrInfinity = (num: any) => {
  num = +num
  if (isNaN(num) || num === -0 || num === +0) return 0
  if (num === Infinity || num === -Infinity) return num
  const int = Math.floor(Math.abs(num))
  return num < +0 ? -int : int
}

// Simulates the internal toLength function: https://tc39.es/ecma262/#sec-tolength
export const toLength = (num: any) => {
  const len = toIntegerOrInfinity(num)
  if (len <= 0) return 0
  return Math.min(len, 2 ** 53 - 1)
}

// Simulates the internal toUint32 function: https://tc39.es/ecma262/#sec-touint32
export const toUint32 = (num: any) => new Uint32Array(1).fill(num)[0]

// Snippet taken from escape-string-regexp
// Builds an equivalent regex for a string
export const stringToRegex = (str: string, flags: string = 'g') =>
  new RegExp(String(str).replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'), flags)

/** Throws a TypeError if the first argument is not a string tracker with the funcName included in the error message */
export const throwIfNotStringTracker = (tracker: StringTracker, funcName: string) => {
  if (typeof tracker !== 'object' || !(StringTrackerSymbol in tracker))
    throw new TypeError(`${funcName} must be called on an instance of StringTracker`)
}

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
  const newChanges = changes.reduce<Change[]>((newChanges, change) => {
    // Remove empty changes
    if (getChangeLength(change) === 0) return newChanges

    const lastChange = newChanges[newChanges.length - 1]
    // Handle first iteration
    if (lastChange === undefined) return [change] as Change[]

    // Combine two string changes next to each other
    if (typeof lastChange === 'string' && typeof change === 'string') {
      newChanges[newChanges.length - 1] = lastChange + change
      return newChanges
    }

    // Combine two StringOp changes next to each other
    if ((isAdd(lastChange) && isAdd(change)) || (isRemove(lastChange) && isRemove(change))) {
      newChanges[newChanges.length - 1] = [lastChange[0] as StringOp, getChangeText(lastChange) + getChangeText(change)]
      return newChanges
    }

    // Add change
    newChanges.push(change)
    return newChanges
  }, [])

  // Special case since we never want to have an empty array of changes
  if (newChanges.filter((change) => !isRemove(change)).length === 0) return ['', ...newChanges]
  return newChanges
}

export const addChange = (changes: Change[], index: number, change: Change) => changes.splice(index, 0, change)

export const replaceChangeText = (change: Change, text: string) =>
  (typeof change === 'string' ? text : [change[0], text]) as Change

export const replaceChange = (changes: Change[], index: number, change: Change) => {
  changes[index] = change
  return changes
}

export const sliceChange = (change: Change, startIndex = 0, endIndex = getChangeLength(change)): Change =>
  typeof change === 'string' ? change.slice(startIndex, endIndex) : [change[0], change[1].slice(startIndex, endIndex)]
