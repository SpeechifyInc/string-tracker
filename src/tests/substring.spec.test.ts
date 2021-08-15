import { createStringTracker } from '..'
import { getModifiedFromChanges } from './helpers'

function runSubstringTest(str: string, start?: any, end?: any) {
  const tracker = createStringTracker(str)

  const actualSubstring = str.substring(start, end)
  const trackerSubstring = tracker.substring(start, end)

  expect(trackerSubstring.get()).toStrictEqual(actualSubstring)
  expect(getModifiedFromChanges(trackerSubstring)).toStrictEqual(actualSubstring)
}

it('should throw when not called on a StringTracker', () => {
  const tracker = createStringTracker('this is my word')
  // @ts-ignore
  expect(() => tracker.substring.call('this is my word', 0, 5)).toThrow(TypeError)
})

// Test262

// S15.5.4.15_A2_T10.js
it('should return the substring between the two indices, non-inclusive of the end', () => {
  const str = 'this_is_a_string object'
  runSubstringTest(str, 0, 8)
  runSubstringTest(str, 8, 0)
  runSubstringTest(str, 0, 0)
  runSubstringTest(str, 0, str.length)
  runSubstringTest(str, str.length, str.length)
  runSubstringTest(str, str.length - 1, str.length)
})

// S15.5.4.15_A1_T6.js
// S15.5.4.15_A1_T7.js
// S15.5.4.15_A1_T8.js
// S15.5.4.15_A1_T10.js
// S15.5.4.15_A1_T11.js
// S15.5.4.15_A1_T12.js
// S15.5.4.15_A1_T13.js
// S15.5.4.15_A1_T14.js
// S15.5.4.15_A2_T2.js
// S15.5.4.15_A2_T3.js
// S15.5.4.15_A2_T4.js
// S15.5.4.15_A2_T5.js
// S15.5.4.15_A2_T6.js
// S15.5.4.15_A2_T7.js
it('should convert start and end to number in that order clamped between 0 and len', () => {
  const str = 'undefined'
  runSubstringTest(str, undefined, 3)
  runSubstringTest(str, 'e', undefined)
  runSubstringTest(str, -4, undefined)
  runSubstringTest(str, undefined, undefined)
  runSubstringTest(
    str,
    {
      valueOf() {
        return 2
      },
    },
    '\u0035'
  )
  runSubstringTest(str, undefined)

  const str2 = 'this is a string object'
  runSubstringTest(str2, NaN, Infinity)
  runSubstringTest('', 1, 0)
  runSubstringTest(str2, Infinity, NaN)
  runSubstringTest(str2, Infinity, Infinity)
  runSubstringTest(str2, -0.01, 0)
  runSubstringTest(str2, str2.length, str2.length)
  runSubstringTest(str2, str2.length + 1, 0)
  runSubstringTest(str2, -Infinity, -Infinity)

  expect(() =>
    createStringTracker('ABB\u0041BABAB').substring(
      // @ts-ignore
      {
        valueOf() {
          throw new Error('instart')
        },
      },
      // @ts-ignore
      {
        valueOf() {
          throw new Error('inend')
        },
      }
    )
  ).toThrow(new Error('instart'))

  expect(() =>
    createStringTracker('ABB\u0041BABAB').substring(
      // @ts-ignore
      {
        // @ts-ignore
        valueOf: () => ({}),
        toString() {
          throw new Error('instart')
        },
      },
      // @ts-ignore
      {
        valueOf() {
          throw new Error('inend')
        },
      }
    )
  ).toThrow(new Error('instart'))

  expect(() =>
    createStringTracker('ABB\u0041BABAB').substring(
      // @ts-ignore
      {
        // @ts-ignore
        valueOf: () => ({}),
        // @ts-ignore
        toString: () => 1,
      },
      // @ts-ignore
      {
        valueOf() {
          throw new Error('inend')
        },
      }
    )
  ).toThrow(new Error('inend'))
})
