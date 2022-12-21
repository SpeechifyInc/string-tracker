import { createStringTracker, StringTracker, StringTrackerSymbol } from '../src'
import {
  addToPosition,
  createChunk,
  getBeginningOverlap,
  getEndingOverlap,
  getNextPos,
  getPrevPos,
  isHighestPos,
  isLowestPos,
  throwIfNotStringTracker,
  toIntegerOrInfinity,
  toLength,
} from '../src/helpers'

describe('ToIntegerOrInfinity', () => {
  it('should convert NaN to 0', () => expect(toIntegerOrInfinity(NaN)).toStrictEqual(0))
  it('should convert +0 to 0', () => expect(toIntegerOrInfinity(+0)).toStrictEqual(0))
  it('should convert -0 to 0', () => expect(toIntegerOrInfinity(-0)).toStrictEqual(0))
  it('should convert to whole numbers', () => {
    expect(toIntegerOrInfinity(-5.2)).toStrictEqual(-5)
    expect(toIntegerOrInfinity(-0.2)).toStrictEqual(0)
    expect(toIntegerOrInfinity(0.2)).toStrictEqual(0)
    expect(toIntegerOrInfinity(5.2)).toStrictEqual(5)
  })
  it('should convert strings to numbers', () => {
    expect(toIntegerOrInfinity('5')).toStrictEqual(5)
    expect(toIntegerOrInfinity('asd')).toStrictEqual(0)
  })
})

describe('toLength', () => {
  it('should convert NaN to 0', () => expect(toLength(NaN)).toStrictEqual(0))
  it('should convert +0 to 0', () => expect(toLength(+0)).toStrictEqual(0))
  it('should convert -0 to 0', () => expect(toLength(-0)).toStrictEqual(0))
  it('should convert to positive whole numbers', () => {
    expect(toLength(-5.2)).toStrictEqual(0)
    expect(toLength(-0.2)).toStrictEqual(0)
    expect(toLength(0.2)).toStrictEqual(0)
    expect(toLength(5.2)).toStrictEqual(5)
  })
  it('should convert strings to numbers', () => {
    expect(toLength('5')).toStrictEqual(5)
    expect(toLength('asd')).toStrictEqual(0)
  })
  it('should return a maximum of 2 ^ 53 - 1', () => {
    expect(toLength(2 ** 53)).toStrictEqual(2 ** 53 - 1)
    expect(toLength(2 ** 64)).toStrictEqual(2 ** 53 - 1)
    expect(toLength(2 ** 16)).toStrictEqual(2 ** 16)
  })
})

// TODO: toUint32
// TODO: stringToRegex

describe('throwIfNotStringTracker', () => {
  it('should not throw if StringTrackerSymbol is found', () => {
    expect(() => throwIfNotStringTracker({ [StringTrackerSymbol]: true } as StringTracker, 'test')).not.toThrow()
    expect(() =>
      throwIfNotStringTracker({ [StringTrackerSymbol]: undefined } as unknown as StringTracker, 'test')
    ).not.toThrow()
    expect(() =>
      throwIfNotStringTracker({ [StringTrackerSymbol]: undefined, foo: 'bar' } as unknown as StringTracker, 'test')
    ).not.toThrow()
  })
  it('should throw a TypeError if StringTrackerSymbol is not found', () => {
    expect(() => throwIfNotStringTracker({} as StringTracker, 'test')).toThrow(TypeError)

    const tracker = { ...createStringTracker('') }
    // @ts-ignore
    delete tracker[StringTrackerSymbol]
    expect(() => throwIfNotStringTracker(tracker, 'test')).toThrow(TypeError)

    const noSymbol = new Proxy(
      {},
      {
        get: (_, prop) => (prop === StringTrackerSymbol ? undefined : false),
        has: (_, prop) => prop !== StringTrackerSymbol,
      }
    ) as StringTracker
    expect(() => throwIfNotStringTracker(noSymbol, 'test')).toThrow(TypeError)
  })
})

describe('isLowestPos', () => {
  it('should return true for [0,0]', () => expect(isLowestPos([0, 0])).toStrictEqual(true))
  it('should return false for all negative positions', () => {
    expect(isLowestPos([-1, 0])).toStrictEqual(false)
    expect(isLowestPos([-1, -1])).toStrictEqual(false)
    expect(isLowestPos([-10, 0])).toStrictEqual(false)
    expect(isLowestPos([0, -5])).toStrictEqual(false)
  })
  it('should return false for all positive positions', () => {
    expect(isLowestPos([1, 0])).toStrictEqual(false)
    expect(isLowestPos([1, 1])).toStrictEqual(false)
    expect(isLowestPos([10, 0])).toStrictEqual(false)
    expect(isLowestPos([0, 5])).toStrictEqual(false)
  })
})

describe('isHighestPos', () => {
  const chunks = [createChunk(['hello', 'world']), createChunk([''])]
  it('should return true for the highest position', () => expect(isHighestPos(chunks, [1, 1])).toStrictEqual(true))
  it('should return false for all negative positions', () => {
    expect(isHighestPos(chunks, [-1, 0])).toStrictEqual(false)
    expect(isHighestPos(chunks, [-1, -1])).toStrictEqual(false)
    expect(isHighestPos(chunks, [-10, 0])).toStrictEqual(false)
    expect(isHighestPos(chunks, [0, -5])).toStrictEqual(false)
  })
  it('should return false for all positive positions other than [1,1]', () => {
    expect(isHighestPos(chunks, [1, 2])).toStrictEqual(false)
    expect(isHighestPos(chunks, [10, 0])).toStrictEqual(false)
    expect(isHighestPos(chunks, [0, 5])).toStrictEqual(false)
  })
})

describe('getPrevPos', () => {
  const chunks = [createChunk(['hello', 'world']), createChunk([''])]
  it('should throw if position is already [0,0]', () => expect(() => getPrevPos(chunks, [0, 0])).toThrow(Error))
  it('should throw if position is negative', () => {
    expect(() => getPrevPos(chunks, [-1, 0])).toThrow(Error)
    expect(() => getPrevPos(chunks, [0, -1])).toThrow(Error)
  })
  it('should throw if position is out of bounds', () => {
    expect(() => getPrevPos(chunks, [2, 0])).toThrow(Error)
    expect(() => getPrevPos(chunks, [1, 2])).toThrow(Error)
  })
  it('should cross chunk boundaries', () => expect(getPrevPos(chunks, [1, 0])).toStrictEqual([0, 1]))
  it('should cross change boundaries', () => expect(getPrevPos(chunks, [0, 1])).toStrictEqual([0, 0]))
})

describe('getNextPos', () => {
  const chunks = [createChunk(['hello', 'world']), createChunk([''])]
  it('should throw if position is already [1,1]', () => expect(() => getNextPos(chunks, [1, 1])).toThrow(Error))
  it('should throw if position is negative', () => {
    expect(() => getNextPos(chunks, [-1, 0])).toThrow(Error)
    expect(() => getNextPos(chunks, [0, -1])).toThrow(Error)
  })
  it('should throw if position is out of bounds', () => {
    expect(() => getNextPos(chunks, [2, 0])).toThrow(Error)
    expect(() => getNextPos(chunks, [1, 2])).toThrow(Error)
  })
  it('should cross chunk boundaries', () => expect(getNextPos(chunks, [0, 1])).toStrictEqual([1, 0]))
  it('should cross change boundaries', () => expect(getNextPos(chunks, [0, 0])).toStrictEqual([0, 1]))
  it('should return a maximum of [1,1]', () => expect(getNextPos(chunks, [1, 0])).toStrictEqual([1, 1]))
})

describe('addToPosition', () => {
  const chunks = [createChunk(['hello', 'world']), createChunk([''])]
  it('should throw if position is negative', () => {
    expect(() => addToPosition(chunks, [-1, 0], 0)).toThrow(Error)
    expect(() => addToPosition(chunks, [-1, 0], 1)).toThrow(Error)
    expect(() => addToPosition(chunks, [-1, 0], -1)).toThrow(Error)
    expect(() => addToPosition(chunks, [0, -1], 0)).toThrow(Error)
    expect(() => addToPosition(chunks, [0, -1], 1)).toThrow(Error)
    expect(() => addToPosition(chunks, [0, -1], -1)).toThrow(Error)
  })
  it('should throw if position is out of bounds', () => {
    expect(() => addToPosition(chunks, [2, 0], 0)).toThrow(Error)
    expect(() => addToPosition(chunks, [2, 0], -1)).toThrow(Error)
    expect(() => addToPosition(chunks, [2, 0], 1)).toThrow(Error)
    expect(() => addToPosition(chunks, [1, 2], 0)).toThrow(Error)
    expect(() => addToPosition(chunks, [1, 2], 1)).toThrow(Error)
    expect(() => addToPosition(chunks, [1, 2], -1)).toThrow(Error)
  })
  it('should not return an out of bounds position', () => {
    expect(addToPosition(chunks, [1, 0], 5)).toStrictEqual([1, 1])
    expect(addToPosition(chunks, [1, 1], 5)).toStrictEqual([1, 1])
    expect(addToPosition(chunks, [1, 1], -5)).toStrictEqual([0, 0])
    expect(addToPosition(chunks, [0, 0], -5)).toStrictEqual([0, 0])
    expect(addToPosition(chunks, [0, 0], 5)).toStrictEqual([1, 1])
  })
})

describe('getBeginningOverlap', () => {
  it('should return 0 for empty strings', () => expect(getBeginningOverlap('', '')).toEqual(0))
  it('should return string length for equal strings', () => expect(getBeginningOverlap('asd  ', 'asd  ')).toEqual(5))
  it('should return 0 for reverse overlapping spaces', () => expect(getBeginningOverlap('  asd', 'asd  ')).toEqual(0))
  it('should return 0 for overlapping ending chars', () => expect(getBeginningOverlap('ok  ', 'foo  ')).toEqual(0))
  it('should return 1 for overlapping spaces', () => expect(getBeginningOverlap(' b', ' a')).toEqual(1))
  it('should return 2 for overlapping letters', () =>
    expect(getBeginningOverlap('ok-foo bar', 'ok hello world')).toEqual(2))
})

describe('getEndingOverlap', () => {
  it('should return 0 for empty strings', () => expect(getEndingOverlap('', '')).toEqual(0))
  it('should return string length for equal strings', () => expect(getEndingOverlap('asd  ', 'asd  ')).toEqual(5))
  it('should return 0 for reverse overlapping spaces', () => expect(getEndingOverlap('  asd', 'asd  ')).toEqual(0))
  it('should return 0 for overlapping beginning chars', () => expect(getEndingOverlap('  ok', '  foo')).toEqual(0))
  it('should return 1 for overlapping spaces', () => expect(getEndingOverlap('b ', 'a ')).toEqual(1))
  it('should return 2 for overlapping letters', () =>
    expect(getEndingOverlap('foo bar-ok', 'hello world ok')).toEqual(2))
})

