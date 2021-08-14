// Since substr is not standardized, the tests written here are written based on online documentation
// and are not from Test262

import { createStringTracker } from ".."
import { getModifiedFromChanges } from "./helpers"

function createSubstrTest(str: string, from?: any, length?: any) {
  return () => runSubstrTest(str, from, length)
}

function runSubstrTest(str: string, from?: any, length?: any) {
  const tracker = createStringTracker(str)

  const actualSubstring = str.substr(from, length)
  const trackerSubstring = tracker.substr(from, length)

  expect(trackerSubstring.get()).toStrictEqual(actualSubstring)
  expect(getModifiedFromChanges(trackerSubstring)).toStrictEqual(actualSubstring)
}

it('should throw when not called on a StringTracker', () => {
  const tracker = createStringTracker('this is my word')
  // @ts-ignore
  expect(() => tracker.substr.call('this is my word', 0, 5)).toThrow(TypeError)
})

it('should start counting start from beginning of string clamped at string length', () => {
  const str = 'this is my word'
  runSubstrTest(str, 0, 4)
  runSubstrTest(str, str.length - 1, 4)
  runSubstrTest(str, str.length, 4)
  runSubstrTest(str, str.length, str.length)

  runSubstrTest('', 0, 2)
  runSubstrTest('', 0, 0)
  runSubstrTest('a', 0, 2)
  runSubstrTest('a', 1, 0)
  runSubstrTest('a', 1, 1)
  runSubstrTest('a', 1, 5)
})

it('should start counting negative start from end of string clamped at string length and 0', () => {
  const str = 'this is my word'
  runSubstrTest(str, -0.01, 4)
  runSubstrTest(str, -1, 4)
  runSubstrTest(str, -str.length, 4)
  runSubstrTest(str, -str.length + 1, str.length)
  runSubstrTest(str, -str.length, -str.length)

  runSubstrTest('', -1, 2)
  runSubstrTest('', -0.01, 0)
  runSubstrTest('a', -0.01, 2)
  runSubstrTest('a', -1, 0)
  runSubstrTest('a', -2, 1)
  runSubstrTest('a', -10, 5)
})

it('should convert undefined and NaN length to string length', () => {
  const str = 'ABBBAAABBBBABABA'
  runSubstrTest(str, -0.01)
  runSubstrTest(str, -1)
  runSubstrTest(str, -str.length + 5)
  runSubstrTest(str, -str.length + 1)
  runSubstrTest(str, -str.length)
  runSubstrTest(str, -0.01, NaN)
  runSubstrTest(str, -1, NaN)
  runSubstrTest(str, -str.length + 5, NaN)
  runSubstrTest(str, -str.length + 1, NaN)
  runSubstrTest(str, -str.length, NaN)
})

it('should convert negative length to 0', () => {
  const str = 'undefined'
  runSubstrTest(str, -0.01, -5)
  runSubstrTest(str, -1, -0.01)
  runSubstrTest(str, -str.length + 5, -0)
  runSubstrTest(str, -str.length + 1, -Infinity)
  runSubstrTest(str, -str.length, -str.length - 5)
})
