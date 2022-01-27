import {
  Change,
  ChangeChunk,
  ChangePosition,
  FullPosition,
  Position,
  StringOp,
  StringTracker,
  StringTrackerSymbol,
} from '.'

export const CHUNK_SIZE = 64

// Simulates the internal toInterOrInfinity function: https://tc39.es/ecma262/#sec-tointegerorinfinity
export const toIntegerOrInfinity = (num: any) => {
  num = +num
  if (isNaN(num) || num === 0) return 0
  if (num === Infinity || num === -Infinity) return num
  const int = Math.floor(Math.abs(num))
  if (int === 0) return 0
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

//---------------
// Position
//---------------
export const isValidPos = (chunks: ChangeChunk[], pos: Position) =>
  pos.length >= 2 &&
  pos[0] >= 0 &&
  pos[1] >= 0 &&
  pos[0] < chunks.length &&
  pos[1] <= getChunkChanges(chunks[pos[0]]).length
export const isLowestPos = (pos: Position) => pos[0] === 0 && pos[1] === 0
export const isHighestPos = (chunks: ChangeChunk[], pos: Position) =>
  pos[0] === chunks.length - 1 && pos[1] === getChunkChanges(chunks[chunks.length - 1]).length

export const getPrevPos = (chunks: ChangeChunk[], pos: Position): ChangePosition => {
  if (!isValidPos(chunks, pos)) {
    throw new Error('Position is invalid for the given chunks')
  }
  if (isLowestPos(pos)) {
    throw new Error('Position is already pointing to the first chunk and change')
  }
  if (pos[1] > 0) return [pos[0], pos[1] - 1]
  return [pos[0] - 1, getChunkChanges(chunks[pos[0] - 1]).length - 1]
}

export const getNextPos = (chunks: ChangeChunk[], pos: Position): ChangePosition => {
  if (!isValidPos(chunks, pos)) {
    throw new Error('Position is invalid for the given chunks')
  }
  if (isHighestPos(chunks, pos)) {
    throw new Error('Position is already pointing to the last chunk and change')
  }
  if (pos[0] === chunks.length - 1 || pos[1] < getChunkChanges(chunks[pos[0]]).length - 1) return [pos[0], pos[1] + 1]
  return [pos[0] + 1, 0]
}

export const addToPosition = (chunks: ChangeChunk[], pos: Position, count: number) => {
  if (!isValidPos(chunks, pos)) {
    throw new Error('Position is invalid for the given chunks')
  }
  while (count < 0 && !isLowestPos(pos)) {
    count++
    pos = getPrevPos(chunks, pos)
  }
  while (count > 0 && !isHighestPos(chunks, pos)) {
    count--
    pos = getNextPos(chunks, pos)
  }
  return pos
}

export const equalPos = (posA: Position, posB: Position) =>
  posA[0] === posB[0] && posA[1] === posB[1] && (posA.length !== 3 || posA[2] === posB[2])

export const getChange = (chunks: ChangeChunk[], pos: Position) => getChunkChanges(chunks[pos[0]])[pos[1]]

export const getPosHelpers = (chunks: ChangeChunk[]) => ({
  addToPosition: addToPosition.bind(undefined, chunks),
  getPrevPos: getPrevPos.bind(undefined, chunks),
  getNextPos: getNextPos.bind(undefined, chunks),
  getChange: getChange.bind(undefined, chunks),
})

export const getPosChunkIndex = (pos: Position) => pos[0]
export const getPosChangeIndex = (pos: Position) => pos[1]
export const getPosOffset = (pos: FullPosition) => pos[2]

//---------------
// Changes
//---------------
export const isAdd = (change: Change | undefined) => typeof change !== 'string' && change?.[0] === StringOp.Add
export const isRemove = (change: Change | undefined) => typeof change !== 'string' && change?.[0] === StringOp.Remove
export const isString = (change: Change | undefined) => typeof change === 'string'
export const getChangeText = (change: Change): string => (typeof change === 'string' ? change : change[1])
export const getChangeLength = (change: Change) => getChangeText(change).length
export const getTypeBasedChangeLength = (change: Change) => getChangeLength(change) * (isRemove(change) ? -1 : 1)
export const getChangesCharCount = (changes: Change[]) =>
  changes.reduce((length, change) => length + (isRemove(change) ? 0 : getChangeLength(change)), 0)
export const createChunk = (changes: Change[]): ChangeChunk => [
  getChangesCharCount(changes),
  changes.length === 0 ? [''] : changes,
]

//---------------
// Chunks
//---------------
export const getChunkChars = (chunk: ChangeChunk) => chunk[0]
export const getChunkChanges = (chunk: ChangeChunk) => chunk[1]

const shouldChunkBeSplit = (chunk: ChangeChunk) => getChunkChanges(chunk).length > CHUNK_SIZE * 2
export const splitChunk = (chunk: ChangeChunk) => {
  const chunkChanges = getChunkChanges(chunk)
  if (shouldChunkBeSplit(chunk)) {
    const numOfChunks = Math.floor(chunkChanges.length / CHUNK_SIZE)
    const splitChunkChanges = [
      ...new Array(numOfChunks - 1)
        .fill(0)
        .map((_, i) => chunkChanges.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE)),
      chunkChanges.slice((numOfChunks - 1) * CHUNK_SIZE),
    ]

    return splitChunkChanges.map<ChangeChunk>((changes) => [getChangesCharCount(changes), changes])
  }
  return [chunk]
}

//---------------
// Side effect helpers
//---------------
export const cleanChanges = (chunks: ChangeChunk[], startPos: Position, endPos: Position) => {
  for (let currChunk = startPos[0]; currChunk <= endPos[0] && currChunk < chunks.length; currChunk++) {
    let chunkChanges = getChunkChanges(chunks[currChunk])
    let startIndex = startPos[0] === currChunk ? startPos[1] : 0
    let endIndex = endPos[0] === currChunk ? endPos[1] : chunkChanges.length

    for (let currChange = startIndex; currChange < endIndex && currChange < chunkChanges.length; currChange++) {
      const currPosition = [currChunk, currChange] as ChangePosition
      const change = chunkChanges[currChange]
      const changeTypeChecker = isAdd(change) ? isAdd : isRemove(change) ? isRemove : isString

      // Remove empty changes
      if (getChangeLength(change) === 0) {
        removeChangesBetweenPositions(chunks, currPosition, getNextPos(chunks, currPosition))
        if (currChunk >= chunks.length) console.log(currChunk, chunks)
        chunkChanges = getChunkChanges(chunks[currChunk])
        currChange--
        endIndex--
        continue
      }

      // Ignore first change
      if (isLowestPos([currChunk, currChange])) continue

      // Combine two changes next to each other
      const prevChange = getChange(chunks, getPrevPos(chunks, [currChunk, currChange]))
      if (changeTypeChecker(prevChange)) {
        const newChange = replaceChangeText(change, getChangeText(prevChange as Change) + getChangeText(change))
        const newChanges = getChangeLength(newChange) > 0 ? [newChange] : []

        const startPos = getPrevPos(chunks, currPosition)
        const endPos = getNextPos(chunks, currPosition)
        removeChangesBetweenPositions(chunks, startPos, endPos)
        addChangesAtPosition(chunks, startPos, newChanges)

        chunkChanges = getChunkChanges(chunks[currChunk])
        currChange--
        endIndex--
      }
    }
  }
}

export const addChangesAtPosition = (chunks: ChangeChunk[], pos: Position, changes: Change[]) => {
  // Nothing to do
  if (changes.length === 0) return

  const charsAdded = getChangesCharCount(changes)
  const chunk = chunks[pos[0]]

  const chunkChanges = getChunkChanges(chunk).slice()
  chunkChanges.splice(pos[1], 0, ...changes)
  chunks[pos[0]] = [chunk[0] + charsAdded, chunkChanges] as ChangeChunk
}

export const removeChangesBetweenPositions = (chunks: ChangeChunk[], startPos: Position, endPos: Position) => {
  // TODO: Shortcut for identical positions
  for (let currChunk = startPos[0]; currChunk <= endPos[0]; currChunk++) {
    const chunkChanges = getChunkChanges(chunks[currChunk])
    const startIndex = startPos[0] === currChunk ? startPos[1] : 0
    const numToRemove = endPos[0] === currChunk ? endPos[1] - startIndex : chunkChanges.length - startIndex

    const isRemovingChunk = numToRemove === chunkChanges.length
    if (isRemovingChunk) {
      chunks[currChunk] = [0, []]
      continue
    }

    const clonedChanges = chunkChanges.slice()
    const removedChanges = clonedChanges.splice(startIndex, numToRemove)
    const charsRemoved = getChangesCharCount(removedChanges)

    chunks[currChunk] = [chunks[currChunk][0] - charsRemoved, clonedChanges]
  }
}

/**
 * Removes changes between two positions and insert newChanges in their place.
 * Return value is the number of chunks removed during this process
 */
export const replaceChanges = (
  chunks: ChangeChunk[],
  startPos: Position,
  endPos: Position,
  newChanges: Change[],
  preventClean?: boolean
): number => {
  // 1. Add new changes to the final chunk
  addChangesAtPosition(chunks, endPos, newChanges)

  // 2. Remove changes between starting and ending positions
  removeChangesBetweenPositions(chunks, startPos, endPos)

  // 3. Clean the chunks
  if (!preventClean) cleanChanges(chunks, startPos, addToPosition(chunks, startPos, newChanges.length + 1))

  // 4. Split chunks if necessary
  for (let currChunk = startPos[0]; currChunk <= endPos[0]; currChunk++) {
    const chunk = chunks[currChunk]
    if (shouldChunkBeSplit(chunk)) {
      const newChunks = splitChunk(chunk)
      chunks.splice(currChunk, 1, ...newChunks)
      currChunk += newChunks.length - 1
    }
  }

  // 5. Remove empty chunks from 1. We do this last to prevent changing the indices for simplicity FIXME: Indices have probably already changed
  let chunksRemoved = 0
  for (let currChunk = startPos[0]; currChunk <= Math.min(endPos[0], chunks.length - 1); currChunk++) {
    if (getChunkChanges(chunks[currChunk]).length !== 0) continue
    chunks.splice(currChunk, 1)
    currChunk--
    chunksRemoved++
  }

  // TODO: Check if this is actually necessary
  // 6. Special case since we never want to have an empty array of chunks
  if (chunks.length === 0) {
    chunks.push([0, ['']])
  }
  if (chunks.length === 1 && !getChunkChanges(chunks[0]).some((change) => !isRemove(change))) {
    chunks[0] = [0, ['', ...getChunkChanges(chunks[0])]]
  }
  return chunksRemoved
}

export const replaceChange = (chunks: ChangeChunk[], pos: Position, change: Change) =>
  replaceChanges(chunks, pos, getNextPos(chunks, pos), [change])

export const addChange = (chunks: ChangeChunk[], pos: Position, change: Change) =>
  replaceChanges(chunks, pos, pos, [change])

export const addChanges = (chunks: ChangeChunk[], pos: Position, newChanges: Change[]) =>
  replaceChanges(chunks, pos, pos, newChanges)

export const removeChanges = (
  chunks: ChangeChunk[],
  startPos: Position,
  endPos: Position = getNextPos(chunks, startPos)
) => replaceChanges(chunks, startPos, endPos, [])

export const removeChange = (chunks: ChangeChunk[], pos: Position) => removeChanges(chunks, pos)

// TODO: Should text be a function originalText => replacementText
export const replaceChangeText = (change: Change, text: string) =>
  (typeof change === 'string' ? text : [change[0], text]) as Change

export const sliceChange = (change: Change, startIndex = 0, endIndex = getChangeLength(change)): Change =>
  typeof change === 'string' ? change.slice(startIndex, endIndex) : [change[0], change[1].slice(startIndex, endIndex)]
