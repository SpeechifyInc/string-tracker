import { createStringTracker } from '..'
import { validateChanges, getModifiedFromChanges } from './helpers'

function runPadTest(str: string, maxLength?: any, fillString?: any) {
  const tracker = createStringTracker(str)

  const actualPadStart = str.padStart(maxLength, fillString)
  const trackerPadStart = tracker.padStart(maxLength, fillString)

  const actualPadEnd = str.padEnd(maxLength, fillString)
  const trackerPadEnd = tracker.padEnd(maxLength, fillString)

  expect(trackerPadStart.get()).toStrictEqual(actualPadStart)
  expect(getModifiedFromChanges(trackerPadStart)).toStrictEqual(actualPadStart)
  expect(validateChanges(trackerPadStart)).toEqual(true)

  expect(trackerPadEnd.get()).toStrictEqual(actualPadEnd)
  expect(getModifiedFromChanges(trackerPadEnd)).toStrictEqual(actualPadEnd)
  expect(validateChanges(trackerPadEnd)).toEqual(true)
}

it('should throw when not called on a StringTracker', () => {
  const tracker = createStringTracker('this is my word')
  // @ts-ignore
  expect(() => tracker.padStart.call('this is my word')).toThrow(TypeError)
  // @ts-ignore
  expect(() => tracker.padEnd.call('this is my word')).toThrow(TypeError)
})

// exception-symbol.js
it('should throw a TypeError when fillString is a Symbol', () => {
  // @ts-ignore
  expect(() => createStringTracker('abc').padStart(10, Symbol()))
  // @ts-ignore
  expect(() => createStringTracker('abc').padEnd(10, Symbol()))
})

// fill-string-empty.js
it('should not add any characters when fillString length is 0', () => runPadTest('abc', 5, ''))

// fill-string-non-strings.js
it('should coerce fillString to a string', () => {
  runPadTest('abc', 10, false)
  runPadTest('abc', 10, true)
  runPadTest('abc', 10, null)
  runPadTest('abc', 10, 0)
  runPadTest('abc', 10, -0)
  runPadTest('abc', 10, NaN)
})

// fill-string-omitted.js
it('should default fillString to a space', () => {
  runPadTest('abc', 5)
  runPadTest('abc', 5, undefined)
})

// max-length-not-greater-than-string.js
it('should return the string unchanged when a coerced maxLength is not greater than the string length', () => {
  runPadTest('abc', undefined, 'def')
  runPadTest('abc', null, 'def')
  runPadTest('abc', -Infinity, 'def')
  runPadTest('abc', 0, 'def')
  runPadTest('abc', -1, 'def')
  runPadTest('abc', 3, 'def')
  runPadTest('abc', 3.9999, 'def')
})

// normal-operation.js
it('should pad in general case', () => {
  runPadTest('abc', 7, 'def')
  runPadTest('abc', 5, '*')
  runPadTest('abc', 6, '\uD83D\uDCA9')
})
