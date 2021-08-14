import { createStringTracker } from '..'
import { getModifiedFromChanges } from './helpers'

function createRepeatTest(str: string, count?: any) {
  return () => runRepeatTest(str, count)
}

function runRepeatTest(str: string, count?: any) {
  const tracker = createStringTracker(str)

  const actualSubstring = str.repeat(count)
  const trackerSubstring = tracker.repeat(count)

  expect(trackerSubstring.get()).toStrictEqual(actualSubstring)
  expect(getModifiedFromChanges(trackerSubstring)).toStrictEqual(actualSubstring)
}

it('should throw when not called on a StringTracker', () => {
  const tracker = createStringTracker('this is my word')
  // @ts-ignore
  expect(() => tracker.repeat.call('this is my word', 5)).toThrow(TypeError)
})

// count-is-zero-returns-empty-string.js
it('should return empty string when count is zero', createRepeatTest('foo', 0))

// count-coerced-to-zero-returns-empty-string.js
it('should return an empty string when count is coerced to zero', () => {
  const str = 'ES2015'
  runRepeatTest(str, NaN)
  runRepeatTest(str, null)
  runRepeatTest(str, undefined)
  runRepeatTest(str, false)
  runRepeatTest(str, '0')
  runRepeatTest(str, 0.9)
})

it('should throw a TypeError when count is a symbol', () => {
  // @ts-ignore
  expect(() => createStringTracker('').repeat(Symbol('')))
})

// count-is-infinity-throws.js
it('should throw a RangeError when count is Infinity', () => {
  expect(() => createStringTracker('').repeat(Infinity)).toThrow(RangeError)
})

// count-less-than-zero-throws.js
it('should throw a RangeError when count is negative', () => {
  expect(() => createStringTracker('').repeat(-1)).toThrow(RangeError)
  expect(() => createStringTracker('').repeat(-Infinity)).toThrow(RangeError)
})

// empty-string-returns-empty.js
it('should return an empty string when repeating an empty string', () => {
  runRepeatTest('', 1)
  runRepeatTest('', 3)
  runRepeatTest('', 2 ** 31 - 1) // Max safe 32 bit int
})
