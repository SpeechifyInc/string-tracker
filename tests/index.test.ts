import { createStringTracker, StringOp, StringTracker } from '../src'

const str1 = 'this is my word'

const getChunksCharLength = (tracker: StringTracker) =>
  tracker
    .getChangeChunks()
    .map((chunk) => chunk[0])
    .reduce((a, b) => a + b, 0)

function expectReversable(tracker: StringTracker, [originalIndex, modifiedIndex]: [number, number]) {
  expect(tracker.getIndexOnOriginal(modifiedIndex)).toBe(originalIndex)
  expect(tracker.getIndexOnModified(originalIndex)).toBe(modifiedIndex)
}

// Do all of our setup here to naturally test that we never modify the tracker in place
const operations: ((tracker: StringTracker) => StringTracker)[] = [
  (t) => t.add('this is'.length, 'hello'),
  (t) => t.remove('this is'.length, 'hello'.length + 'this is'.length),
  (t) => t.add('this i'.length, 'hype'),
  (t) => t.add('this ihy'.length, 'hype'),
  (t) => t.remove('this ihy'.length, 'this ihyhypepes m'.length),
  (t) => t.add(0, 'yo'),
  (t) => t.add(t.get().length, 'end'),
  (t) => t.remove(t.get().length - 4),
]

const getTrackedStr = (numOfOps: number) =>
  operations.slice(0, numOfOps).reduce((tracker, op) => op(tracker), createStringTracker(str1))

// TODO: Refactor changes array testing or just never change the changes above ^

test('trivial', () => {
  const trackedStr = getTrackedStr(0)
  expect(trackedStr.get()).toBe(str1)
  expect(trackedStr.getOriginal()).toBe(str1)
  for (const index in Array.from(trackedStr.get())) {
    expectReversable(trackedStr, [+index, +index])
  }
  expect(trackedStr.getChanges()).toStrictEqual([str1])
  expect(getChunksCharLength(trackedStr)).toEqual(trackedStr.get().length)
})

test('add', () => {
  const trackedStr = getTrackedStr(1)
  expect(trackedStr.get()).toBe('this ishello my word')
  expect(trackedStr.getOriginal()).toBe('this is my word')
  expectReversable(trackedStr, [11, 16]) // 11 -> 'w' in 'word'. should be + 5 so 16
  expect(trackedStr.getChanges()).toStrictEqual(['this is', [StringOp.Add, 'hello'], ' my word'])
  expect(getChunksCharLength(trackedStr)).toEqual(trackedStr.get().length)
})

test('remove added', () => {
  const trackedStr = getTrackedStr(2)
  expect(trackedStr.get()).toBe('this is my word')
  expect(trackedStr.getOriginal()).toBe('this is my word')
  expectReversable(trackedStr, [11, 11])
  expect(trackedStr.getChanges()).toStrictEqual(['this is my word'])
  expect(getChunksCharLength(trackedStr)).toEqual(trackedStr.get().length)
})

test('add 2', () => {
  const trackedStr = getTrackedStr(3)
  expect(trackedStr.get()).toBe('this ihypes my word')
  expect(trackedStr.getOriginal()).toBe('this is my word')
  expectReversable(trackedStr, [5, 5]) // 5 -> 'i' in 'is'
  expectReversable(trackedStr, [6, 10]) // 6 -> 's' in 'is'
  expectReversable(trackedStr, [11, 15])
  expect(trackedStr.getChanges()).toStrictEqual(['this i', [StringOp.Add, 'hype'], 's my word'])
  expect(getChunksCharLength(trackedStr)).toEqual(trackedStr.get().length)
})

test('add in middle of previous add', () => {
  const trackedStr = getTrackedStr(4)
  expect(trackedStr.get()).toBe('this ihyhypepes my word')
  expect(trackedStr.getOriginal()).toBe('this is my word')

  expectReversable(trackedStr, [5, 5])
  expectReversable(trackedStr, [6, 14])
  expectReversable(trackedStr, [11, 19])
  expect(trackedStr.getChanges()).toStrictEqual(['this i', [StringOp.Add, 'hyhypepe'], 's my word'])
  expect(getChunksCharLength(trackedStr)).toEqual(trackedStr.get().length)
})

test('remove from middle of add to string change', () => {
  const trackedStr = getTrackedStr(5)
  expect(trackedStr.get()).toBe('this ihyy word')
  expect(trackedStr.getOriginal()).toBe('this is my word')

  expectReversable(trackedStr, [5, 5])

  // Not reversable when the text isn't in both
  // Refers to the 's' in 'is'
  // In this case, we should snap to after the added 'hy'
  // and return the index of the last 'y' in 'ihyy word'
  expect(trackedStr.getIndexOnModified(6)).toBe(8)

  // Not reversable when the text isn't in both
  // Refers to the 'h' in 'ihyy'
  // In this case, we should snap back to the last index before the added text
  // so we return the index of 'i' in 'is'
  expect(trackedStr.getIndexOnOriginal(7)).toBe(6)
  expectReversable(trackedStr, [11, 10])

  expect(trackedStr.getChanges()).toStrictEqual(['this i', [StringOp.Add, 'hy'], [StringOp.Remove, 's m'], 'y word'])
  expect(getChunksCharLength(trackedStr)).toEqual(trackedStr.get().length)
})

test('add at beginning', () => {
  const trackedStr = getTrackedStr(6)
  expect(trackedStr.get()).toBe('yothis ihyy word')
  expect(trackedStr.getOriginal()).toBe('this is my word')

  expectReversable(trackedStr, [0, 2]) // 0 -> 't' in 'this'
  expectReversable(trackedStr, [2, 4])
  expectReversable(trackedStr, [11, 12])

  expect(trackedStr.getChanges()).toStrictEqual([
    [StringOp.Add, 'yo'],
    'this i',
    [StringOp.Add, 'hy'],
    [StringOp.Remove, 's m'],
    'y word',
  ])
  expect(getChunksCharLength(trackedStr)).toEqual(trackedStr.get().length)
})

test('add at end', () => {
  const trackedStr = getTrackedStr(7)
  expect(trackedStr.get()).toBe('yothis ihyy wordend')
  expect(trackedStr.getOriginal()).toBe('this is my word')
  expect(trackedStr.getChanges()).toStrictEqual([
    [StringOp.Add, 'yo'],
    'this i',
    [StringOp.Add, 'hy'],
    [StringOp.Remove, 's m'],
    'y word',
    [StringOp.Add, 'end'],
  ])
  expect(getChunksCharLength(trackedStr)).toEqual(trackedStr.get().length)

  expectReversable(trackedStr, [0, 2])
  expectReversable(trackedStr, [2, 4]) // 2 -> 'i' in 'this'
  expectReversable(trackedStr, [11, 12])
  expectReversable(trackedStr, [14, 15])
})

test('remove from end of string to end', () => {
  const trackedStr = getTrackedStr(8)
  expect(trackedStr.get()).toBe('yothis ihyy wor')
  expect(trackedStr.getOriginal()).toBe('this is my word')

  expectReversable(trackedStr, [0, 2])
  expectReversable(trackedStr, [2, 4])
  expectReversable(trackedStr, [11, 12])
  expectReversable(trackedStr, [13, 14]) // 13 -> 'r' in 'word'

  expect(trackedStr.getIndexOnOriginal(14)).toBe(13)
  expect(trackedStr.getIndexOnModified(14)).toBe(14) // 14 -> 'd' in 'word'

  expect(trackedStr.getChanges()).toStrictEqual([
    [StringOp.Add, 'yo'],
    'this i',
    [StringOp.Add, 'hy'],
    [StringOp.Remove, 's m'],
    'y wor',
    [StringOp.Remove, 'd'],
  ])
  expect(getChunksCharLength(trackedStr)).toEqual(trackedStr.get().length)
})

it('should remove subsequent adds/strings with a remove in between in changes array ', () => {
  const tracker = createStringTracker('asda pog', {
    initialChangeChunks: [[8, ['asd', [0, ' '], [1, 'a'], ' ', [0, ' '], 'pog']]],
    initialModified: 'asd  pog',
  }).remove(3, 6)

  expect(tracker.getOriginal()).toEqual('asda pog')
  expect(tracker.get()).toEqual('asdog')
  expect(tracker.getChanges()).toStrictEqual(['asd', [1, 'a '], 'pog'])
})

// getIndexOnOriginal
it('getIndexOnOriginal should throw a RangeError when called with a negative number', () => {
  expect(() => createStringTracker('asd').getIndexOnOriginal(-1))
})

it('getIndexOnOriginal should return original string length when called with modified string length', () => {
  const trackedStr = getTrackedStr(8)
  expect(trackedStr.getIndexOnOriginal(trackedStr.length)).toEqual(trackedStr.getOriginal().length)
})

// getIndexOnModified
it('getIndexOnModified should return modified string length when called with original string length', () => {
  const trackedStr = getTrackedStr(8)
  expect(trackedStr.getIndexOnModified(trackedStr.getOriginal().length)).toEqual(trackedStr.length)
})

it('getIndexOnModified should throw a RangeError when called with a negative number', () => {
  expect(() => createStringTracker('asd').getIndexOnModified(-1))
})
