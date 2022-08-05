import { createStringTracker } from '../src'
import { assertValidTracker, getModifiedFromChanges } from './helpers'

function runTrimTest(str: string) {
  const tracker = createStringTracker(str)

  const actualTrim = str.trim()
  const trackerTrim = tracker.trim()

  const actualTrimStart = str.trimStart()
  const trackerTrimStart = tracker.trimStart()

  const actualTrimEnd = str.trimEnd()
  const trackerTrimEnd = tracker.trimEnd()

  expect(trackerTrim.get()).toStrictEqual(actualTrim)
  expect(getModifiedFromChanges(trackerTrim)).toStrictEqual(actualTrim)
  assertValidTracker(trackerTrim)

  expect(trackerTrimStart.get()).toStrictEqual(actualTrimStart)
  expect(getModifiedFromChanges(trackerTrimStart)).toStrictEqual(actualTrimStart)
  assertValidTracker(trackerTrimStart)

  expect(trackerTrimEnd.get()).toStrictEqual(actualTrimEnd)
  expect(getModifiedFromChanges(trackerTrimEnd)).toStrictEqual(actualTrimEnd)
  assertValidTracker(trackerTrimEnd)
}

it('should throw when not called on a StringTracker', () => {
  const tracker = createStringTracker('this is my word')
  // @ts-ignore
  expect(() => tracker.trim.call('this is my word')).toThrow(TypeError)
  // @ts-ignore
  expect(() => tracker.trimStart.call('this is my word')).toThrow(TypeError)
  // @ts-ignore
  expect(() => tracker.trimEnd.call('this is my word')).toThrow(TypeError)
})

// So many Test262 tests were used that I didn't bother tracking all of them
// Anything that wasn't related to converting caller to String was included
it('should remove whitespace at the beginning and end', () => {
  runTrimTest('    abc')
  runTrimTest('SD咕噜')
  runTrimTest('    abc   123   [object Object]    \u0000    ')
  runTrimTest('\u000A\u000D\u2028\u2029')
  runTrimTest('\u0000')
  runTrimTest('\0\u0000abc')
  runTrimTest('abc\0\u0000')
  runTrimTest('\0\u0000abc\0\u0000')
  runTrimTest('a\0\u0000bc')
  runTrimTest(
    '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF'
  )

  const lineTerminatorsStr = '\u000A\u000D\u2028\u2029'
  const whiteSpacesStr =
    '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF'
  runTrimTest(whiteSpacesStr + lineTerminatorsStr)
  runTrimTest(whiteSpacesStr + lineTerminatorsStr + 'abc')
  runTrimTest('abc' + whiteSpacesStr + lineTerminatorsStr)
  runTrimTest(whiteSpacesStr + lineTerminatorsStr + 'abc' + whiteSpacesStr + lineTerminatorsStr)
  runTrimTest('ab' + whiteSpacesStr + lineTerminatorsStr + 'cd')

  runTrimTest('\0\u0000')
  runTrimTest('\0')
  runTrimTest('\uFEFFabc')
  runTrimTest('abc\u0009')
  runTrimTest('abc\u000B')
  runTrimTest('abc\u000C')
  runTrimTest('abc\u0020')
  runTrimTest('abc\u00A0')
  runTrimTest('abc\uFEFF')
  runTrimTest('\u0009abc\u0009')
  runTrimTest(' \u0009abc \u0009')
  runTrimTest('\u000Babc\u000B')
  runTrimTest('\u000Cabc\u000C')
  runTrimTest('\u0020abc\u0020')
  runTrimTest('\u00A0abc\u00A0')
  runTrimTest('\u0009\u0009')
  runTrimTest('\u000B\u000B')
  runTrimTest('\u000C\u000C')
  runTrimTest('\u0009abc')
  runTrimTest('\u0020\u0020')
  runTrimTest('\u00A0\u00A0')
  runTrimTest('\uFEFF\uFEFF')
  runTrimTest('ab\u0009c')
  runTrimTest('ab\u000Bc')
  runTrimTest('ab\u000Cc')
  runTrimTest('ab\u0020c')
  runTrimTest('ab\u0085c')
  runTrimTest('\u000Babc')
  runTrimTest('ab\u00A0c')
  runTrimTest('ab\u200Bc')
  runTrimTest('ab\uFEFFc')
  runTrimTest('\u000Aabc')
  runTrimTest('\u000Dabc')
  runTrimTest('\u2028abc')
  runTrimTest('\u2029abc')
  runTrimTest('abc\u000A')
  runTrimTest('abc\u000D')
  runTrimTest('abc\u2028')
  runTrimTest('\u000Cabc')
  runTrimTest('abc\u2029')
  runTrimTest('\u000Aabc\u000A')
  runTrimTest('\u000Dabc\u000D')
  runTrimTest('\u2028abc\u2028')
  runTrimTest('\u2029abc\u2029')
  runTrimTest('\u000A\u000A')
  runTrimTest('\u000D\u000D')
  runTrimTest('\u2028\u2028')
  runTrimTest('\u2029\u2029')
  runTrimTest('\u2029\
           abc')
  runTrimTest('\u0020abc')
  runTrimTest('    ')
  runTrimTest('\u00A0abc')
  runTrimTest('_\u180E')
  runTrimTest('\u180E')
  runTrimTest('\u180E_')
  runTrimTest('\u0009a b\
c \u0009')
})
