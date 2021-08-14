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
  sliceChange,
  toNumber,
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
  toLowerCaseTracker,
  toUpperCaseTracker,
  repeat,
} from './prototype-impl'

export const StringTrackerSymbol = Symbol.for('string-tracker')

type StringTrackerBase = {
  get: () => string
  getOriginal: () => string
  getChanges: () => Change[]
  getIndexOnModified: (index: number) => number
  getIndexOnOriginal: (index: number) => number
  add: (index: number, text: string) => StringTracker
  remove: (startIndex: number, endIndex?: number) => StringTracker
  concat: (...trackers: StringTracker[]) => StringTracker
  slice: (startIndex?: number, endIndex?: number) => StringTracker
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
  toLowerCaseTracker: typeof toLowerCaseTracker
  toUpperCaseTracker: typeof toUpperCaseTracker
  toString: String['toString']
  [Symbol.iterator]: String[typeof Symbol.iterator]
  [StringTrackerSymbol]: true
}

type StringPrototype = {
  [key in keyof Omit<String, keyof StringTrackerBase | 'length'>]: String[key]
}

export type StringTracker = StringTrackerBase & StringPrototype & { length: number }

export enum StringOp {
  Add,
  Remove,
}

export type Change = [StringOp, string] | string

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
    for (const [i, change] of Object.entries(changes)) {
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
    const { offset, index: lastChangeIndex, change } = getIndexOfChange(targetIndex, isRemove)
    const index = getIndexAfterChanges(lastChangeIndex, isAdd)

    return Math.min(Math.max(index + (isAdd(change) ? 0 : offset), 0), str.length - 1)
  }

  // Original -> Modified
  const getIndexOnModified = (targetIndex: number) => {
    if (targetIndex >= str.length) {
      throw new RangeError('targetIndex must be less than the original strings length')
    }
    const { offset, index: lastChangeIndex, change } = getIndexOfChange(targetIndex, isAdd)
    const index = getIndexAfterChanges(lastChangeIndex, isRemove)

    return Math.min(Math.max(index + (isRemove(change) ? 0 : offset), 0), modifiedStr.length - 1)
  }

  const add = (index: number, text: string) => {
    let { offset, index: changeIndex } = getIndexOfChange(index)
    let newChanges = changes.slice()

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
      if (isRemove(previousChange) && typeof previousChange !== 'string') {
        const overlapAmount = getOverlap(previousText, text)

        newChanges = addChange(newChanges, changeIndex, previousText.slice(previousText.length - overlapAmount))
        newChanges = replaceChange(
          newChanges,
          changeIndex - 1,
          replaceChangeText(newChanges[changeIndex - 1], previousText.slice(0, previousText.length - overlapAmount))
        )

        textToAdd = text.slice(overlapAmount)

        changeIndex++
      }
      newChanges = addChange(newChanges, changeIndex, [StringOp.Add, textToAdd])
    } else if (offset <= getChangeLength(currentChange)) {
      if (typeof currentChange === 'string') {
        newChanges[changeIndex] = currentChange.slice(0, offset)
        newChanges = addChange(newChanges, changeIndex + 1, [StringOp.Add, text])
        newChanges = addChange(newChanges, changeIndex + 2, currentChange.slice(offset))
      }
      // Inferred that it's an Add because currentChange cannot be a Remove
      else {
        const currentText = getChangeText(currentChange)
        newChanges = replaceChange(
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
    let newChanges = changes.slice()

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
    newChanges = replaceChange(
      newChanges,
      changeIndex,
      replaceChangeText(newChanges[changeIndex], currentText.slice(0, offset))
    )
    if (typeof currentChange === 'string') {
      newChanges = addChange(newChanges, changeIndex + 1, [
        StringOp.Remove,
        currentText.slice(offset, offset + endIndex - startIndex),
      ])
    }
    // Check if we are already done
    if (currentText.length > offset + endIndex - startIndex) {
      if (typeof currentChange === 'string') {
        newChanges = addChange(newChanges, changeIndex + 2, currentText.slice(offset + endIndex - startIndex))
      }
      // Inferred that it's an Add
      else {
        newChanges = addChange(newChanges, changeIndex + 2, [
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
        newChanges = addChange(newChanges, changeIndex, [StringOp.Remove, currentText.slice(0, endIndex - startIndex)])
        changeIndex++
        if (newChanges[changeIndex]) {
          newChanges = replaceChange(
            newChanges,
            changeIndex,
            replaceChangeText(newChanges[changeIndex], currentText.slice(endIndex - startIndex))
          )
        }
      }
      // Inferred that it's an Add. We only need to remove content with no need to track since this content
      // isn't on the original string
      else {
        newChanges = replaceChange(
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

  /**
   * Returns a section of a StringTracker.
   * @param start The index to the beginning of the specified portion of StringTracker.
   * @param end The index to the end of the specified portion of StringTracker. The substring includes the characters up to, but not including, the character indicated by end.
   * If this value is not specified, the substring continues to the end of StringTracker.
   */
  const slice = (startIndex: number = 0, endIndex: number = modifiedStr.length): StringTracker => {
    // Sanitize our inputs to match the behavior of the spec
    const trackerLength = modifiedStr.length

    startIndex = +startIndex
    if (isNaN(startIndex)) startIndex = toNumber(startIndex)
    if (startIndex < 0) startIndex = trackerLength + startIndex
    startIndex = Math.max(Math.round(Math.min(startIndex, trackerLength)), 0)

    endIndex = +endIndex
    if (isNaN(endIndex)) endIndex = toNumber(endIndex)
    if (endIndex < 0) endIndex = trackerLength + endIndex
    endIndex = Math.max(Math.round(Math.min(endIndex, trackerLength)), 0)

    const sliceLength = endIndex - startIndex

    if (endIndex <= startIndex) return createStringTracker('')
    const { index, offset, change } = getIndexOfChange(startIndex)

    const slicedOriginalStr = str.slice(getIndexOnOriginal(startIndex), getIndexOnOriginal(endIndex))

    const slicedChanges = [sliceChange(change, offset, offset + sliceLength)]

    if (getChangeLength(slicedChanges[0]) === sliceLength)
      // Early return when the single change contains all the required content
      return createStringTracker(slicedOriginalStr, {
        initialModified: slicedChanges.map(getChangeText).join(''),
        initialChanges: slicedChanges,
      })

    for (const change of changes.slice(index + 1)) {
      if (isRemove(change)) {
        slicedChanges.push(change)
        continue
      }
      const slicedChangesLength = slicedChanges.map(getChangeLength).reduce((a, b) => a + b, 0)
      const charsToAdd = sliceLength - slicedChangesLength

      slicedChanges.push(sliceChange(change, 0, charsToAdd))
      if (charsToAdd <= getChangeLength(change)) break
    }

    return createStringTracker(slicedOriginalStr, {
      initialModified: slicedChanges
        .filter((change) => !isRemove(change))
        .map(getChangeText)
        .join(''),
      initialChanges: slicedChanges,
    })
  }

  /**
   * Concatenates StringTracker arguments to the calling StringTracker and returns a new StringTracker
   * @param trackers One or more StringTracker to concatenate to calling StringTracker
   */
  const concat = (...trackers: StringTracker[]): StringTracker => {
    const newChanges = [...changes, ...trackers.flatMap((tracker) => tracker.getChanges())]
    const newModifiedStr = modifiedStr.concat(...trackers.map((tracker) => tracker.get()))
    const newStr = str.concat(...trackers.map((tracker) => tracker.getOriginal()))
    return createStringTracker(newStr, { initialModified: newModifiedStr, initialChanges: newChanges })
  }

  const tracker: StringTracker = new Proxy<StringTrackerBase>(
    {
      get,
      getOriginal,
      getChanges,
      getIndexOnModified,
      getIndexOnOriginal,
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
      toLowerCaseTracker,
      toUpperCaseTracker,
      toString: () => tracker.get(),
      [Symbol.iterator]: function* () {
        for (const char of this.get()) yield char
      },
      [StringTrackerSymbol]: true,
    },
    {
      get(target, prop) {
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
