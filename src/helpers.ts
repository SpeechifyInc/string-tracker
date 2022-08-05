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
export const getChangeType = (change: Change) => (isAdd(change) ? 'add' : isRemove(change) ? 'remove' : 'string')

export const getChangeText = (change: Change): string => (typeof change === 'string' ? change : change[1])
export const getChangesTextImpl = (changes: Change[], shouldSkipChange: (change: Change) => boolean): string =>
  changes.reduce<string>((str, change) => str + (shouldSkipChange(change) ? '' : getChangeText(change)), '')
export const getChangesText = (changes: Change[]): string => getChangesTextImpl(changes, isRemove)
export const getChangesOriginalText = (changes: Change[]): string => getChangesTextImpl(changes, isAdd)

export const getChangeLength = (change: Change) => getChangeText(change).length
export const getTypeBasedChangeLength = (change: Change) => getChangeLength(change) * (isRemove(change) ? -1 : 1)
export const getChangesTextLengthImpl = (changes: Change[], shouldSkipChange: (change: Change) => boolean = isRemove) =>
  changes.reduce((length, change) => length + (shouldSkipChange(change) ? 0 : getChangeLength(change)), 0)
export const getChangesTextLength = (changes: Change[]) => getChangesTextLengthImpl(changes, isRemove)
export const getChangesOriginalTextLength = (changes: Change[]) => getChangesTextLengthImpl(changes, isAdd)

export const createChunk = (changes: Change[]): ChangeChunk => [
  getChangesTextLength(changes),
  getChangesOriginalTextLength(changes),
  changes.length === 0 ? [''] : changes,
]

export const createChunks = (changes: Change[]): ChangeChunk[] =>
  new Array(Math.ceil(changes.length / CHUNK_SIZE))
    .fill(0)
    .map((_, i) => changes.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE))
    .map(createChunk)

//---------------
// Chunks
//---------------
export const getChunkChars = (chunk: ChangeChunk) => chunk[0]
export const getChunkOriginalChars = (chunk: ChangeChunk) => chunk[1]
export const getChunkChanges = (chunk: ChangeChunk) => chunk[2]

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

    return splitChunkChanges.map<ChangeChunk>(createChunk)
  }
  return [chunk]
}

//---------------
// Side effect helpers
//---------------
export const concatChanges = (baseChanges: Change[], changesToAdd: Change[]) => {
  const changes = baseChanges.slice()

  for (const change of changesToAdd) {
    if (getChangeLength(change) === 0) continue
    changes.push(change)

    let index = changes.length - 1
    while (index < changes.length) {
      const change = changes[index]
      const prevChange = changes[index - 1]
      if (prevChange === undefined) {
        index++
        continue
      }

      // Ensure that changes are ALWAYS in the order of [add, remove]. Never [remove, add]
      if (isRemove(prevChange) && isAdd(change)) {
        // Ensure that changes are ALWAYS in the order of [add, remove]. Never [remove, add]
        changes.splice(index - 1, 2, change, prevChange)
        index--
        continue
      }

      if (getChangeType(prevChange) === getChangeType(change)) {
        changes.splice(index - 1, 2, replaceChangeText(change, getChangeText(prevChange) + getChangeText(change)))
        index--
        continue
      }
      index++
    }
  }

  return changes
}

/**
 * Removes changes between two positions and insert newChanges in their place.
 * Return value is the number of chunks removed during this process
 */
export const replaceChanges = (chunks: ChangeChunk[], startPos: Position, endPos: Position, changesToAdd: Change[]) => {
  // Get the index of the chunk before and after
  const startChunkIndex = Math.max(startPos[0] - 1, 0)
  const endChunkIndex = Math.min(endPos[0] + 1, chunks.length - 1)

  // Get the changes between the start chunk and the start position
  const changesBefore = chunks
    .slice(startChunkIndex, startPos[0])
    .flatMap(getChunkChanges)
    .concat(getChunkChanges(chunks[startPos[0]]).slice(0, startPos[1]))
  // Get the changes between the end position and the end of the end chunk
  const changesAfter = getChunkChanges(chunks[endPos[0]])
    .slice(endPos[1])
    .concat(chunks.slice(endPos[0] + 1, endChunkIndex + 1).flatMap(getChunkChanges))

  // Combine all the changes together
  const combinedChanges = concatChanges(changesBefore, changesToAdd.concat(changesAfter))

  // Replace the previous chunks with our new chunks
  chunks.splice(startChunkIndex, endChunkIndex + 1 - startChunkIndex, ...createChunks(combinedChanges))

  // TODO: Check if this is actually necessary
  // Special case since we never want to have an empty array of chunks
  if (chunks.length === 0) {
    chunks.push([0, 0, ['']])
  }
  if (chunks.length === 1 && !getChunkChanges(chunks[0]).some((change) => !isRemove(change))) {
    chunks[0] = [chunks[0][0], chunks[0][1], ['', ...getChunkChanges(chunks[0])]]
  }
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
