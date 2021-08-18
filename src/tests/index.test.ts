import { createStringTracker, StringOp, StringTracker } from '../index'

const str1 = 'this is my word'

function expectReversable(tracker: StringTracker, [originalIndex, modifiedIndex]: [number, number]) {
  expect(tracker.getIndexOnOriginal(modifiedIndex)).toBe(originalIndex)
  expect(tracker.getIndexOnModified(originalIndex)).toBe(modifiedIndex)
}

// Do all of our setup here to naturally test that we never modify the tracker in place
const trackedStr = createStringTracker(str1)
const trackedStr1 = trackedStr.add('this is'.length, 'hello')
const trackedStr2 = trackedStr1.remove('this is'.length, 'hello'.length + 'this is'.length) // Remove the hello
const trackedStr3 = trackedStr2.add('this i'.length, 'hype')
const trackedStr4 = trackedStr3.add('this ihy'.length, 'hype')
const trackedStr5 = trackedStr4.remove('this ihy'.length, 'this ihyhypepes m'.length)
const trackedStr6 = trackedStr5.add(0, 'yo')
const trackedStr7 = trackedStr6.add(trackedStr6.get().length, 'end')
const trackedStr8 = trackedStr7.remove(trackedStr7.get().length - 4)

// TODO: Refactor changes array testing or just never change the changes above ^

test('trivial', () => {
  expect(trackedStr.get()).toBe(str1)
  expect(trackedStr.getOriginal()).toBe(str1)
  for (const index in Array.from(trackedStr.get())) {
    expectReversable(trackedStr, [+index, +index])
  }
  expect(trackedStr.getChanges()).toStrictEqual([str1])
})

test('add', () => {
  expect(trackedStr1.get()).toBe('this ishello my word')
  expect(trackedStr1.getOriginal()).toBe('this is my word')
  expectReversable(trackedStr1, [11, 16]) // 11 -> 'w' in 'word'. should be + 5 so 16
  expect(trackedStr1.getChanges()).toStrictEqual(['this is', [StringOp.Add, 'hello'], ' my word'])
})

test('remove added', () => {
  expect(trackedStr2.get()).toBe('this is my word')
  expect(trackedStr2.getOriginal()).toBe('this is my word')
  expectReversable(trackedStr2, [11, 11])
  expect(trackedStr2.getChanges()).toStrictEqual(['this is my word'])
})

test('add 2', () => {
  expect(trackedStr3.get()).toBe('this ihypes my word')
  expect(trackedStr3.getOriginal()).toBe('this is my word')
  expectReversable(trackedStr3, [5, 5]) // 5 -> 'i' in 'is'
  expectReversable(trackedStr3, [6, 10]) // 6 -> 's' in 'is'
  expectReversable(trackedStr3, [11, 15])
  expect(trackedStr3.getChanges()).toStrictEqual(['this i', [StringOp.Add, 'hype'], 's my word'])
})

test('add in middle of previous add', () => {
  expect(trackedStr4.get()).toBe('this ihyhypepes my word')
  expect(trackedStr4.getOriginal()).toBe('this is my word')

  expectReversable(trackedStr4, [5, 5])
  expectReversable(trackedStr4, [6, 14])
  expectReversable(trackedStr4, [11, 19])
  expect(trackedStr4.getChanges()).toStrictEqual(['this i', [StringOp.Add, 'hyhypepe'], 's my word'])
})

test('remove from middle of add to string change', () => {
  expect(trackedStr5.get()).toBe('this ihyy word')
  expect(trackedStr5.getOriginal()).toBe('this is my word')

  expectReversable(trackedStr5, [5, 5])

  // Not reversable when the text isn't in both
  // Refers to the 's' in 'is'
  // In this case, we should snap to after the added 'hy'
  // and return the index of the last 'y' in 'ihyy word'
  expect(trackedStr5.getIndexOnModified(6)).toBe(8)

  // Not reversable when the text isn't in both
  // Refers to the 'h' in 'ihyy'
  // In this case, we should snap back to the last index before the added text
  // so we return the index of 'i' in 'is'
  expect(trackedStr5.getIndexOnOriginal(7)).toBe(6)
  expectReversable(trackedStr5, [11, 10])

  expect(trackedStr5.getChanges()).toStrictEqual(['this i', [StringOp.Add, 'hy'], [StringOp.Remove, 's m'], 'y word'])
})

test('add at beginning', () => {
  expect(trackedStr6.get()).toBe('yothis ihyy word')
  expect(trackedStr6.getOriginal()).toBe('this is my word')

  expectReversable(trackedStr6, [0, 2]) // 0 -> 't' in 'this'
  expectReversable(trackedStr6, [2, 4])
  expectReversable(trackedStr6, [11, 12])

  expect(trackedStr6.getChanges()).toStrictEqual([
    [StringOp.Add, 'yo'],
    'this i',
    [StringOp.Add, 'hy'],
    [StringOp.Remove, 's m'],
    'y word',
  ])
})

test('add at end', () => {
  expect(trackedStr7.get()).toBe('yothis ihyy wordend')
  expect(trackedStr7.getOriginal()).toBe('this is my word')
  expectReversable(trackedStr7, [0, 2])
  expectReversable(trackedStr7, [2, 4]) // 2 -> 'i' in 'this'
  expectReversable(trackedStr7, [11, 12])
  expectReversable(trackedStr7, [14, 15])

  expect(trackedStr7.getChanges()).toStrictEqual([
    [StringOp.Add, 'yo'],
    'this i',
    [StringOp.Add, 'hy'],
    [StringOp.Remove, 's m'],
    'y word',
    [StringOp.Add, 'end'],
  ])
})

test('remove from end of string to end', () => {
  expect(trackedStr8.get()).toBe('yothis ihyy wor')
  expect(trackedStr8.getOriginal()).toBe('this is my word')

  expectReversable(trackedStr8, [0, 2])
  expectReversable(trackedStr8, [2, 4])
  expectReversable(trackedStr8, [11, 12])
  expectReversable(trackedStr8, [13, 14]) // 13 -> 'r' in 'word'

  expect(trackedStr8.getIndexOnOriginal(14)).toBe(13)
  expect(trackedStr8.getIndexOnModified(14)).toBe(14) // 14 -> 'd' in 'word'

  expect(trackedStr8.getChanges()).toStrictEqual([
    [StringOp.Add, 'yo'],
    'this i',
    [StringOp.Add, 'hy'],
    [StringOp.Remove, 's m'],
    'y wor',
    [StringOp.Remove, 'd'],
  ])
})

it('should remove subsequent adds/strings with a remove in between in changes array ', () => {
  const tracker = createStringTracker('asda pog', {
    initialChanges: ['asd', [0, ' '], [1, 'a'], ' ', [0, ' '], 'pog'],
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
  expect(trackedStr8.getIndexOnOriginal(trackedStr8.length)).toEqual(trackedStr8.getOriginal().length)
})

// getIndexOnModified
it('getIndexOnModified should return modified string length when called with original string length', () => {
  expect(trackedStr8.getIndexOnModified(trackedStr8.getOriginal().length)).toEqual(trackedStr8.length)
})

it('getIndexOnModified should throw a RangeError when called with a negative number', () => {
  expect(() => createStringTracker('asd').getIndexOnModified(-1))
})
