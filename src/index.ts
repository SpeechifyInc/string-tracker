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
  createChunk,
  getChange,
  getChangeLength,
  getChangeText,
  getChunkChanges,
  getOverlap,
  getPosHelpers,
  getPosOffset,
  isAdd,
  isHighestPos,
  isLowestPos,
  isRemove,
  replaceChange,
  replaceChanges,
  replaceChangeText,
  sliceChange,
  splitChunk,
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
  getChangeChunks: () => ChangeChunk[]
  getIndexOnModified: (index: number) => number
  getIndexOnOriginal: (index: number) => number
  getPositionOfChange: (targetIndex: number, shouldSkipChange?: (change: Change) => boolean) => FullPosition
  add(index: number, text: string, inPlace: boolean): undefined
  add(index: number, text: string): StringTracker
  // TODO: Would inPlace: true work?
  remove(startIndex: number, endIndex: number, inPlace: boolean): undefined
  remove(startIndex: number, endIndex?: number): StringTracker
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
    // TODO: yield* this.get() ?
    for (const char of this.get()) yield char
  },
}

export type StringTracker = StringTrackerBase & StringPrototype & { length: number }

export enum StringOp {
  Add,
  Remove,
}

type ChunkIndex = number
type ChangeIndex = number
type Offset = number

export type ChangePosition = [ChunkIndex, ChangeIndex]
export type FullPosition = [ChunkIndex, ChangeIndex, Offset]
export type Position = ChangePosition | FullPosition

export type Change = [StringOp, string] | string

type ChunkLength = number
export type ChangeChunk = [ChunkLength, ChunkLength, Change[]]

export function createStringTracker(
  str: string,
  {
    initialModified = str,
    initialChangeChunks = [[str.length, str.length, [str]]],
    initialChanges,
  }: { initialModified?: string; initialChanges?: Change[]; initialChangeChunks?: ChangeChunk[] } = {}
): StringTracker {
  let modifiedStr: string = initialModified
  let changeChunks: ChangeChunk[] = initialChanges ? splitChunk(createChunk(initialChanges)) : initialChangeChunks

  const get = () => modifiedStr
  const getOriginal = () => str
  const getChanges = () => changeChunks.flatMap(getChunkChanges)
  const getChangeChunks = () => changeChunks

  const getPositionOfChange = (
    targetIndex: number,
    shouldSkipChange: (change: Change) => boolean = isRemove
  ): FullPosition => {
    // TODO: Use a find?
    let changes = getChunkChanges(changeChunks[changeChunks.length - 1])
    let totalOffset = 0
    let chunkIndex = 0
    const chunkOffsetIndex = shouldSkipChange === isRemove ? 0 : 1
    for (; chunkIndex < changeChunks.length; chunkIndex++) {
      if (changeChunks[chunkIndex][chunkOffsetIndex] + totalOffset < targetIndex) {
        totalOffset += changeChunks[chunkIndex][chunkOffsetIndex]
        continue
      }
      changes = getChunkChanges(changeChunks[chunkIndex])
      break
    }
    chunkIndex = Math.min(chunkIndex, changeChunks.length - 1)

    for (let changeIndex = 0; changeIndex < changes.length; changeIndex++) {
      const change = changes[changeIndex]
      if (shouldSkipChange(change)) continue
      const length = getChangeLength(change)
      if (totalOffset + length > targetIndex) {
        return [chunkIndex, changeIndex, targetIndex - totalOffset]
      }
      totalOffset += length
    }

    // Didn't find change for index...
    // Get the last change that isn't skipped
    let lastChangeIndex = changes.length - 1
    for (; lastChangeIndex > 0; lastChangeIndex--) {
      if (!shouldSkipChange(changes[lastChangeIndex])) break
    }

    const lastChange = changes[lastChangeIndex]
    return [chunkIndex, lastChangeIndex, getChangeLength(lastChange)]
  }

  const getIndexAfterChanges = (position: Position, shouldSkipChange: (change: Change) => boolean) => {
    let index = 0
    const previousChunks = changeChunks.slice(0, position[0])
    const previousChanges = getChunkChanges(changeChunks[position[0]]).slice(0, position[1])
    for (const chunk of previousChunks) {
      index += getChunkChanges(chunk).reduce(
        (index, change) => (shouldSkipChange(change) ? index : index + getChangeLength(change)),
        0
      )
    }
    index += previousChanges.reduce(
      (index, change) => (shouldSkipChange(change) ? index : index + getChangeLength(change)),
      0
    )

    return index
  }

  // Modified -> Original
  const getIndexOnOriginal = (targetIndex: number) => {
    if (targetIndex > modifiedStr.length || targetIndex < 0) {
      throw new RangeError('targetIndex must be a positive number less than or equal to the length')
    }
    // TODO: Add test
    if (targetIndex === modifiedStr.length) return str.length

    const position = getPositionOfChange(targetIndex, isRemove)
    const change = getChange(changeChunks, position)
    const index = getIndexAfterChanges(position, isAdd)

    return Math.min(Math.max(index + (isAdd(change) ? 0 : getPosOffset(position)), 0), str.length - 1)
  }

  // Original -> Modified
  const getIndexOnModified = (targetIndex: number) => {
    if (targetIndex > str.length || targetIndex < 0) {
      throw new RangeError('targetIndex must be a positive number less than or equal to the original length')
    }
    // TODO: Add test
    if (targetIndex === str.length) return modifiedStr.length

    const position = getPositionOfChange(targetIndex, isAdd)
    const change = getChange(changeChunks, position)
    const index = getIndexAfterChanges(position, isRemove)

    return Math.min(Math.max(index + (isRemove(change) ? 0 : getPosOffset(position)), 0), modifiedStr.length - 1)
  }

  const add = ((index: number, text: string, inPlace: boolean = false) => {
    if (typeof text !== 'string') text = String(text)
    // TODO: Better handling of empty. Probably should handle in code
    /*
    if (text.length === 0) {
      if (inPlace) return
      return createStringTracker(str, {
        initialModified: modifiedStr,
        initialChangeChunks: changeChunks,
      })
    }*/

    const position = getPositionOfChange(index)
    const chunks = inPlace ? changeChunks : changeChunks.slice()

    const { getChange, getNextPos, getPrevPos } = getPosHelpers(chunks)
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
    // to prevent adding and removing the same piece of text filling up the changes array.
    const previousChange = isLowestPos(position) ? undefined : getChange(getPrevPos(position))
    const currentChange = getChange(position)

    const offset = position[2]
    if (previousChange && offset === 0) {
      const previousText = getChangeText(previousChange)
      if (isRemove(previousChange)) {
        const overlapAmount = getOverlap(previousText, text)

        replaceChanges(chunks, getPrevPos(position), position, [
          // Has to be preivousText.length because overlapAmount can be 0
          sliceChange(previousChange, 0, previousText.length - overlapAmount),
          previousText.slice(previousText.length - overlapAmount),
          [StringOp.Add, text.slice(overlapAmount)],
        ])
      } else {
        addChange(chunks, position, [StringOp.Add, text])
      }
    } else if (offset <= getChangeLength(currentChange)) {
      if (typeof currentChange === 'string') {
        replaceChanges(chunks, position, getNextPos(position), [
          currentChange.slice(0, offset),
          [StringOp.Add, text],
          currentChange.slice(offset),
        ])
      }
      // Inferred that it's an Add because currentChange cannot be a Remove
      else {
        const currentText = getChangeText(currentChange)
        replaceChange(
          chunks,
          position,
          replaceChangeText(getChange(position), currentText.slice(0, offset) + text + currentText.slice(offset))
        )
      }
    } else {
      addChange(
        chunks,
        [chunks.length - 1, getChunkChanges(chunks[chunks.length - 1]).length - 1],
        [StringOp.Add, text]
      )
    }

    const newModifiedStr = modifiedStr.slice(0, index) + text + modifiedStr.slice(index)
    if (inPlace) {
      modifiedStr = newModifiedStr
      return
    }

    return createStringTracker(str, {
      initialModified: newModifiedStr,
      initialChangeChunks: chunks,
    })
  }) as StringTracker['add']

  const remove = ((startIndex: number, endIndex: number = modifiedStr.length, inPlace: boolean = false) => {
    if (startIndex > endIndex) throw new RangeError('startIndex must be less than or equal to endIndex')
    if (endIndex > modifiedStr.length)
      throw new RangeError('endIndex must be less than or equal to the length of the modified string')

    const newModifiedStr = modifiedStr.slice(0, startIndex) + modifiedStr.slice(endIndex)

    const fullPosition = getPositionOfChange(startIndex)
    const offset = getPosOffset(fullPosition)
    let position = fullPosition.slice(0, 2) as ChangePosition
    const chunks = inPlace ? changeChunks : changeChunks.slice()
    const originalPosition = position

    const { addToPosition, getChange, getNextPos } = getPosHelpers(chunks)

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
    const currentChange = getChange(position)
    const currentText = getChangeText(currentChange)

    // Remove the text from the change
    let changesToRemove = 1
    const changesToAdd: Change[] = [replaceChangeText(getChange(position), currentText.slice(0, offset))]

    if (typeof currentChange === 'string') {
      changesToAdd.push([StringOp.Remove, currentText.slice(offset, offset + endIndex - startIndex)])
    }

    // Check if we are already done
    if (currentText.length > offset + (endIndex - startIndex)) {
      changesToAdd.push(sliceChange(currentChange, offset + endIndex - startIndex))
    }

    startIndex += currentText.length - offset

    // Loop until we no longer need to remove
    if (!isHighestPos(chunks, position)) {
      for (position = getNextPos(position); startIndex < endIndex; position = getNextPos(position)) {
        const currentChange = getChange(position)
        if (!currentChange) break

        // We always need to remove the change that we iterate on
        changesToRemove++
        if (isRemove(currentChange)) {
          changesToAdd.push(currentChange)
          continue
        }

        const currentText = getChangeText(currentChange)
        // If we have a string, add the remove change for tracking and adjust the string for what we removed
        // The only other case would be an add but we don't track content being removed from those changes
        // since it wasn't on the original string
        if (typeof currentChange === 'string') {
          changesToAdd.push([StringOp.Remove, currentText.slice(0, endIndex - startIndex)])
        }
        // Remove the content from the original change
        changesToAdd.push(replaceChangeText(getChange(position), currentText.slice(endIndex - startIndex)))

        startIndex += currentText.length
      }
    }

    const startPos = originalPosition
    const endPos = addToPosition(originalPosition, changesToRemove)
    replaceChanges(chunks, startPos, endPos, changesToAdd)

    if (inPlace) {
      modifiedStr = newModifiedStr
      return
    }
    return createStringTracker(str, {
      initialModified: newModifiedStr,
      initialChangeChunks: chunks,
    })
  }) as StringTracker['remove']

  const tracker: StringTracker = new Proxy<StringTrackerBase>(
    {
      get,
      getOriginal,
      getChanges,
      getChangeChunks,
      getIndexOnModified,
      getIndexOnOriginal,
      getPositionOfChange,
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
