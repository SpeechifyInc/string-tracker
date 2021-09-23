// A library for operating on strings while maintaining index maps transparently
// It uses an array of strings and [StringOp, string] to track changes
// This is not a complete list of changes but rather a map of only original <-> modified
// with all history lost

// Modified -> Original
// Removed means index + removeStr.length. Added are ignored
// If was added, give beginning index of added
// For slice, don't include added but include in index, include removed but don't count in index <-- unpredictable length
// For slice, don't include added and don't include in index, include removed and count in index <-- predictable length

// Original -> Modified
// Added means index + addStr.length. Removed are ignored
// If was removed, give index of beginning of remove.
// For slice, don't include removed but include in index, include added but don't count in index <-- unpredictable length
// For slice, don't include removed and don't include in index, include added and count in index <-- predictable length

// TODO: tests for trim and pad

import {
  addChange,
  cleanChanges,
  getChangeLength,
  getChangeText,
  getOverlap,
  isAdd,
  isRemove,
  replaceChange,
  replaceChangeText,
  throwIfNotStringTracker,
} from './helpers'
import {
  split,
  substring,
  substr,
  replace,
  replaceAll,
  trim,
  trimStart,
  trimEnd,
  padStart,
  padEnd,
  repeat,
  slice,
  concat,
} from './prototype-impl'

export const StringTrackerSymbol = Symbol.for('string-tracker')

type StringTrackerPrototype = {
  concat: typeof concat
  slice: typeof slice
  split: typeof split
  substring: typeof substring
  substr: typeof substr
  repeat: typeof repeat
  replace: typeof replace
  replaceAll: typeof replaceAll
  trim: typeof trim
  trimStart: typeof trimStart
  trimEnd: typeof trimEnd
  padStart: typeof padStart
  padEnd: typeof padEnd
  toString: (this: StringTracker) => string
  [Symbol.iterator]: String[typeof Symbol.iterator]
}

type StringTrackerBase = {
  get: () => string
  getOriginal: () => string
  getChanges: () => Change[]
  getIndexOnModified: (index: number) => number
  getIndexOnOriginal: (index: number) => number
  getIndexOfChange: (
    targetIndex: number,
    shouldSkipChange?: (change: Change) => boolean
  ) => { offset: number; index: number; change: Change }
  add: (index: number, text: string) => StringTracker
  remove: (startIndex: number, endIndex?: number) => StringTracker
  [StringTrackerSymbol]: true
} & StringTrackerPrototype

type StringPrototype = {
  [key in keyof Omit<String, keyof StringTrackerBase | 'length'>]: String[key]
}

// @ts-ignore
const reboundStringPrototype: StringPrototype = Object.fromEntries(
  Object.getOwnPropertyNames(String.prototype).map((key) => [
    key,
    function (this: StringTracker) {
      throwIfNotStringTracker(this, key)
      // @ts-ignore
      return String.prototype[key](this.get())
    },
  ])
)

const trackerPrototype: StringTrackerPrototype & StringPrototype & { length: number } = {
  ...reboundStringPrototype,
  concat,
  length: 0,
  slice,
  split,
  substring,
  substr,
  repeat,
  replace,
  replaceAll,
  trim,
  trimStart,
  trimEnd,
  padStart,
  padEnd,
  toString(this: StringTracker) {
    return this.get()
  },
  [Symbol.iterator]: function* (this: StringTracker) {
    for (const char of this.get()) yield char
  },
}

export type StringTracker = StringTrackerBase & StringPrototype & { length: number }

export enum StringOp {
  Add,
  Remove,
}

export type Change = [StringOp, string] | string

/*
export function createTrackerChunk(
  str: string,
  { initialModified = str, initialChanges = [str] }: { initialModified?: string; initialChanges?: Change[] } = {}
) {
  const modifiedStr = initialModified
  const changes: Change[] = initialChanges

  const get = () => modifiedStr
  const getOriginal = () => str
  const getChanges = () => changes
}
*/

export function createStringTracker(
  str: string,
  { initialModified = str, initialChanges = [str] }: { initialModified?: string; initialChanges?: Change[] } = {}
): StringTracker {
  const modifiedStr = initialModified
  const changes: Change[] = initialChanges

  const get = () => modifiedStr
  const getOriginal = () => str
  const getChanges = () => changes

  const getIndexOfChange = (targetIndex: number, shouldSkipChange: (change: Change) => boolean = isRemove) => {
    // If only JS had find with accumulator (transduce)...
    let index = 0
    for (const [i, change] of changes.entries()) {
      if (shouldSkipChange(change)) continue
      if (index + getChangeLength(change) > targetIndex) return { offset: targetIndex - index, index: +i, change }
      index += getChangeLength(change)
    }
    const lastChangeIndex =
      changes.length -
      changes
        .slice()
        .reverse()
        .findIndex((change) => !shouldSkipChange(change)) -
      1
    const lastChange = changes[lastChangeIndex]
    if (!lastChange) return { offset: 0, index: 0, change: shouldSkipChange(changes[0]) ? changes[1] : changes[0] }
    return {
      offset: getChangeLength(lastChange),
      index: lastChangeIndex,
      change: lastChange,
    }
  }

  const getIndexAfterChanges = (changeIndex: number, shouldSkipChange: (change: Change) => boolean) =>
    changes
      .slice(0, changeIndex)
      .reduce((index, change) => (shouldSkipChange(change) ? index : index + getChangeLength(change)), 0)

  // Modified -> Original
  const getIndexOnOriginal = (targetIndex: number) => {
    if (targetIndex > modifiedStr.length || targetIndex < 0) {
      throw new RangeError('targetIndex must be a positive number less than or equal to the length')
    }
    if (targetIndex === modifiedStr.length) return modifiedStr.length

    const { offset, index: lastChangeIndex, change } = getIndexOfChange(targetIndex, isRemove)
    const index = getIndexAfterChanges(lastChangeIndex, isAdd)

    return Math.min(Math.max(index + (isAdd(change) ? 0 : offset), 0), str.length - 1)
  }

  // Original -> Modified
  const getIndexOnModified = (targetIndex: number) => {
    if (targetIndex > str.length || targetIndex < 0) {
      throw new RangeError('targetIndex must be a positive number less than or equal to the original length')
    }
    if (targetIndex === str.length) return str.length

    const { offset, index: lastChangeIndex, change } = getIndexOfChange(targetIndex, isAdd)
    const index = getIndexAfterChanges(lastChangeIndex, isRemove)

    return Math.min(Math.max(index + (isRemove(change) ? 0 : offset), 0), modifiedStr.length - 1)
  }

  const add = (index: number, text: string) => {
    let { offset, index: changeIndex } = getIndexOfChange(index)
    const newChanges = changes.slice()

    // We only need to check the beginning and middle since the offset can only be
    // equal to the length of the string when we are at the end of the string
    // ex. ['hello world']. Add at index of 0 would mean
    // (offset: 0, changeIndex: 0) we are cutting like [[Add, 'addhere'], 'hello world']
    // ex. ['hello world']. Add at index of 4 would mean
    // (offset: 4, changeIndex: 0) we are cutting like ['hell', [Add, 'addhere'], 'o world']
    // ex. ['hello', 'world']. Add at index of 5 would mean...
    // (offset: 0, changeIndex: 1) we are cutting like ['hello', [Add, 'addhere'], 'world']
    // ^^ Fyi this initial changes array isn't actually possible and only used for example
    // since identical change types get combined during cleanChanges
    // ex. ['hello, 'world']. Add at index of 10 would mean
    // (offset: 5, changeIndex: 1) we are cutting like ['hello', 'world', [Add, 'addhere']]

    // If the previous was a remove, we try to find the overlap on what we're adding
    // to prevent adding and removing the same piece of text filling up the changes
    // array. typeof check is for type inference only
    const previousChange = newChanges[changeIndex - 1]
    const currentChange = newChanges[changeIndex]
    if (previousChange && offset === 0) {
      const previousText = getChangeText(previousChange)
      let textToAdd = text
      if (isRemove(previousChange)) {
        const overlapAmount = getOverlap(previousText, text)

        addChange(newChanges, changeIndex, previousText.slice(previousText.length - overlapAmount))
        replaceChange(
          newChanges,
          changeIndex - 1,
          replaceChangeText(newChanges[changeIndex - 1], previousText.slice(0, previousText.length - overlapAmount))
        )

        textToAdd = text.slice(overlapAmount)

        changeIndex++
      }
      addChange(newChanges, changeIndex, [StringOp.Add, textToAdd])
    } else if (offset <= getChangeLength(currentChange)) {
      if (typeof currentChange === 'string') {
        newChanges[changeIndex] = currentChange.slice(0, offset)
        addChange(newChanges, changeIndex + 1, [StringOp.Add, text])
        addChange(newChanges, changeIndex + 2, currentChange.slice(offset))
      }
      // Inferred that it's an Add because currentChange cannot be a Remove
      else {
        const currentText = getChangeText(currentChange)
        replaceChange(
          newChanges,
          changeIndex,
          replaceChangeText(newChanges[changeIndex], currentText.slice(0, offset) + text + currentText.slice(offset))
        )
      }
    } else {
      newChanges.push([StringOp.Add, text])
    }

    return createStringTracker(str, {
      initialModified: modifiedStr.slice(0, index) + text + modifiedStr.slice(index),
      initialChanges: cleanChanges(newChanges),
    })
  }

  const remove = (startIndex: number, endIndex: number = modifiedStr.length) => {
    if (startIndex > endIndex) throw new RangeError('startIndex must be less than or equal to endIndex')
    if (endIndex > modifiedStr.length)
      throw new RangeError('endIndex must be less than or equal to the length of the modified string')

    const newModifiedStr = modifiedStr.slice(0, startIndex) + modifiedStr.slice(endIndex)

    let { offset, index: changeIndex } = getIndexOfChange(startIndex)
    const newChanges = changes.slice()

    // We first check only the first change because of the offset. In all other cases,
    // we simply remove and modify the original change. If it becomes empty, it will be
    // collected by the clean up.
    // ex. ['hello', 'world']. Removing 0 - 3 would mean
    // (offset: 0, changeIndex: 0) we are cutting like ['hel', 'lo', 'world'] where lo is removed
    // ex. ['hello', 'world']. Removing 4 - 6 would mean
    // (offset: 4, changeIndex: 0) we are cutting like ['hell', 'ow', 'orld'] where ow is removed
    // ex. ['hello', 'world']. Removing 0 - 10
    // (offset: 0, changeIndex: 0) we are cutting like ['helloworld'] where helloworld is removed

    // Check first individually to handle offsets
    const currentChange = newChanges[changeIndex]
    const currentText = getChangeText(currentChange)
    replaceChange(
      newChanges,
      changeIndex,
      replaceChangeText(newChanges[changeIndex], currentText.slice(0, offset))
    )
    if (typeof currentChange === 'string') {
      addChange(newChanges, changeIndex + 1, [
        StringOp.Remove,
        currentText.slice(offset, offset + endIndex - startIndex),
      ])
    }
    // Check if we are already done
    if (currentText.length > offset + endIndex - startIndex) {
      if (typeof currentChange === 'string') {
        addChange(newChanges, changeIndex + 2, currentText.slice(offset + endIndex - startIndex))
      }
      // Inferred that it's an Add
      else {
        addChange(newChanges, changeIndex + 2, [
          StringOp.Add,
          currentText.slice(offset + endIndex - startIndex),
        ])
      }
    }
    startIndex += currentText.length - offset

    // Loop until we no longer need to remove
    for (changeIndex++; startIndex < endIndex; changeIndex++) {
      const currentChange = newChanges[changeIndex]
      if (!currentChange) break
      if (isRemove(currentChange)) continue

      const currentText = getChangeText(currentChange)
      // Add the remove change for tracking and adjust the string for what we removed
      if (typeof currentChange === 'string') {
        addChange(newChanges, changeIndex, [StringOp.Remove, currentText.slice(0, endIndex - startIndex)])
        changeIndex++
        if (newChanges[changeIndex]) {
          replaceChange(
            newChanges,
            changeIndex,
            replaceChangeText(newChanges[changeIndex], currentText.slice(endIndex - startIndex))
          )
        }
      }
      // Inferred that it's an Add. We only need to remove content with no need to track since this content
      // isn't on the original string
      else {
        replaceChange(
          newChanges,
          changeIndex,
          replaceChangeText(newChanges[changeIndex], currentText.slice(endIndex - startIndex))
        )
      }

      startIndex += currentText.length
    }

    return createStringTracker(str, {
      initialModified: newModifiedStr,
      initialChanges: cleanChanges(newChanges),
    })
  }

  const tracker: StringTracker = new Proxy<StringTrackerBase>(
    {
      get,
      getOriginal,
      getChanges,
      getIndexOnModified,
      getIndexOnOriginal,
      getIndexOfChange,
      add,
      remove,
      concat,
      slice,
      split,
      substring,
      substr,
      repeat,
      replace,
      replaceAll,
      trim,
      trimStart,
      trimEnd,
      padStart,
      padEnd,
      toString(this: StringTracker) {
        return this.get()
      },
      [Symbol.iterator]: function* (this: StringTracker) {
        for (const char of this.get()) yield char
      },
      [StringTrackerSymbol]: true,
    },
    {
      get(target, prop) {
        if (prop === '__proto__') return trackerPrototype
        if (prop === 'length') return target.get().length
        if (prop in target) return target[prop as keyof typeof target]
        if (typeof prop !== 'symbol' && !isNaN(+prop)) return target.get()[+prop]
        if (prop in String.prototype) {
          const protoFunc = String.prototype[prop as keyof StringPrototype]
          if (typeof protoFunc === 'string') return target.get()[+(prop as string)]
          return protoFunc.bind(target.get())
        }
        // @ts-ignore
        return target[prop]
      },
      set() {
        return false
      },
      deleteProperty() {
        return false
      },
    }
  ) as StringTracker

  return tracker
}
