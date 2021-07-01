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

export type StringTracker = {
  get: () => string
  getOriginal: () => string
  getIndexOnModified: (index: number) => number
  getIndexOnOriginal: (index: number) => number
  add: (index: number, text: string) => StringTracker
  remove: (startIndex: number, endIndex?: number) => StringTracker
}

enum StringOp {
  Add,
  Remove,
}

type Change = [StringOp, string] | string

const isAdd = (change: Change | undefined) =>
  typeof change !== "string" && change?.[0] === StringOp.Add
const isRemove = (change: Change | undefined) => typeof change !== "string" && change?.[0] === StringOp.Remove
const getChangeText = (change: Change): string => (typeof change === "string" ? change : change[1])
const getChangeLength = (change: Change) => getChangeText(change).length

const cleanChanges = (changes: Change[]): Change[] =>
  changes.reduce<Change[]>((newChanges, change, i) => {
    if (!getChangeLength(change)) return newChanges
    const lastChange = changes[i - 1]
    if (!lastChange) return [change] as Change[]
    if (typeof lastChange === "string" && typeof change === "string")
      return [...newChanges.slice(0, -1), lastChange + change]
    if ((isAdd(lastChange) && isAdd(change)) || (isRemove(lastChange) && isRemove(change)))
      return [
        ...newChanges.slice(0, -1),
        [lastChange[0], getChangeText(lastChange) + getChangeText(change)],
      ] as Change[]
    newChanges.push(change)
    return newChanges
  }, [])

const addChange = (changes: Change[], index: number, change: Change) => [
  ...changes.slice(0, index),
  change,
  ...changes.slice(index),
]

const replaceChangeText = (changes: Change[], index: number, text: string) =>
  typeof changes[index] === "string"
    ? (changes[index] = text)
    : // @ts-ignore
      (changes[index] = [changes[index][0], text])

/**
 * Attempts to find the overlap on the end of the source string
 * and beginning of the diff string
 * Ex. 'hello fob', 'ob hello' returns 2 for 'ob'
 * Ex. 'foo bar', 'a foo bar' returns 0
 * Ex. 'hello world', 'world hello' returns 5 for 'world'
 */
function getOverlap(source: string, diff: string) {
  if (diff === source) return diff.length
  for (let i = diff.length; i > 0; i--) {
    if (source[source.length - i] !== diff[0]) continue
    if (source.endsWith(diff.slice(0, i))) return i
  }
  return 0
}

export function createStringTracker(
  str: string,
  {
    initialModified = str,
    initialChanges = [str],
  }: { initialModified?: string; initialChanges?: Change[] } = {}
): StringTracker {
  let modifiedStr = initialModified
  let changes: Change[] = initialChanges

  const get = () => modifiedStr
  const getOriginal = () => str

  const getIndexOfChange = (
    targetIndex: number,
    shouldSkipChange: (change: Change) => boolean = isRemove
  ) => {
    let index = 0
    for (const [i, change] of Object.entries(changes)) {
      if (shouldSkipChange(change)) continue
      if (index + getChangeLength(change) > targetIndex)
        return { offset: targetIndex - index, index: +i, change }
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
    if (!lastChange) return { offset: 0, index: 0 }
    return {
      offset: getChangeLength(lastChange),
      index: lastChangeIndex,
      change: lastChange,
    }
  }

  const getIndexAfterChanges = (
    changeIndex: number,
    shouldSkipChange: (change: Change) => boolean
  ) =>
    changes
      .slice(0, changeIndex)
      .reduce(
        (index, change) => (shouldSkipChange(change) ? index : index + getChangeLength(change)),
        0
      )

  // Modified -> Original
  const getIndexOnOriginal = (targetIndex: number) => {
    const { offset, index: lastChangeIndex, change } = getIndexOfChange(targetIndex, isRemove)
    const index = getIndexAfterChanges(lastChangeIndex, isAdd)

    return Math.min(Math.max(index + (isAdd(change) ? 0 : offset), 0), str.length - 1)
  }

  // Original -> Modified
  const getIndexOnModified = (targetIndex: number) => {
    if (targetIndex >= str.length) {
      throw new RangeError("targetIndex must be less than the original strings length")
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
    // ex. ['hello', 'world']. Add at index of 0 would mean
    // (offset: 0, changeIndex: 0) we are cutting like ['addhere', 'hello', 'world']
    // ex. ['hello', 'world']. Add at index of 4 would mean
    // (offset: 4, changeIndex: 0) we are cutting like ['hell', 'addhere', 'o', 'world']
    // ex. ['hello', 'world']. Add at index of 5 would mean
    // (offset: 0, changeIndex: 1) we are cutting like ['hello', 'addhere', 'world']
    // ex. ['hello, 'world']. Add at index of 10 would mean
    // (offset: 5, changeIndex: 1) we are cutting like ['hello', 'addhere', 'world']

    // If the previous was a remove, we try to find the overlap on what we're adding
    // to prevent adding and removing the same piece of text filling up the changes
    // array. typeof check is for type inference only
    const previousChange = newChanges[changeIndex - 1]
    const currentChange = newChanges[changeIndex]
    if (previousChange && offset === 0) {
      const previousText = getChangeText(previousChange)
      if (isRemove(previousChange) && typeof previousChange !== "string") {
        const overlapAmount = getOverlap(previousText, text)

        newChanges = addChange(
          newChanges,
          changeIndex,
          previousText.slice(previousText.length - overlapAmount)
        )
        replaceChangeText(
          newChanges,
          changeIndex - 1,
          previousText.slice(0, previousText.length - overlapAmount)
        )
        text = text.slice(overlapAmount)

        changeIndex++
      }
      newChanges = addChange(newChanges, changeIndex, [StringOp.Add, text])
    } else if (offset <= getChangeLength(currentChange)) {
      if (typeof currentChange === "string") {
        newChanges[changeIndex] = currentChange.slice(0, offset)
        newChanges = addChange(newChanges, changeIndex + 1, [StringOp.Add, text])
        newChanges = addChange(newChanges, changeIndex + 2, currentChange.slice(offset))
      }
      // Inferred that it's an Add
      else {
        const currentText = getChangeText(currentChange)
        replaceChangeText(
          newChanges,
          changeIndex,
          currentText.slice(0, offset) + text + currentText.slice(offset)
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
    if (startIndex > endIndex) throw new Error("startIndex must be less than or equal to endIndex")
    if (endIndex > modifiedStr.length)
      throw new Error("endIndex must be less than or equal to the length of the modified string")

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
    replaceChangeText(newChanges, changeIndex, currentText.slice(0, offset))
    if (typeof currentChange === "string") {
      newChanges = addChange(newChanges, changeIndex + 1, [
        StringOp.Remove,
        currentText.slice(offset, offset + endIndex - startIndex),
      ])
    }
    // Check if we are already done
    if (currentText.length > offset + endIndex - startIndex) {
      if (typeof currentChange === "string") {
        newChanges = addChange(
          newChanges,
          changeIndex + 2,
          currentText.slice(offset + endIndex - startIndex)
        )
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
      const currentChange = changes[changeIndex]
      if (!currentChange) break
      if (isRemove(currentChange)) continue
      const currentText = getChangeText(currentChange)
      if (typeof currentChange === "string") {
        newChanges = addChange(newChanges, changeIndex, [
          StringOp.Remove,
          currentText.slice(0, endIndex - startIndex),
        ])
      }
      if (changes[changeIndex + 1]) {
        replaceChangeText(newChanges, changeIndex + 1, currentText.slice(endIndex - startIndex))
      }

      startIndex += currentText.length
    }

    return createStringTracker(str, {
      initialModified: newModifiedStr,
      initialChanges: cleanChanges(newChanges),
    })
  }

  return {
    get,
    getOriginal,
    getIndexOnModified,
    getIndexOnOriginal,
    add,
    remove,
  }
}
