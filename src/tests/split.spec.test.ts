import { createStringTracker } from '..'
import { getModifiedFromChanges } from './helpers'

function createSplitTest(str: string, separator?: any, limit?: any) {
  return () => runSplitTest(str, separator, limit)
}

function runSplitTest(str: string, separator?: any, limit?: any) {
  const tracker = createStringTracker(str)

  const actualSplit = str.split(separator, limit)
  const splitTrackers = tracker.split(separator, limit)

  expect(splitTrackers.map((tracker) => tracker.get())).toStrictEqual(actualSplit)
  expect(splitTrackers.map(getModifiedFromChanges)).toStrictEqual(actualSplit)
}

it('should throw when not called on a StringTracker', () => {
  const tracker = createStringTracker('this is my word')
  // @ts-ignore
  expect(() => tracker.split.call('this is my word', ' ')).toThrow(TypeError)
})
// @ts-ignore
it('should include a single string with no separator', createSplitTest('this is my word', undefined))
it('should split by each unicode char with an empty string separator', createSplitTest('𝟘𝟙𝟚𝟛', ''))
// @ts-ignore
it('should split by each unicode char with an empty RegExp separator', createSplitTest('𝟘𝟙𝟚𝟛', new RegExp()))
it('should split by string separator', createSplitTest('this is my word', ' '))
it('should split by RegExp separator', createSplitTest('this is my word', /\w\s/))
it('should split by RegExp separator and include capture groups', createSplitTest('this is my word', /(\w)\s/))
it('should split by RegExp separator and include capture groups 2', createSplitTest('this is my word', /(\w+\s)/))
it('should split by RegExp separator and include two capture groups', createSplitTest('this is my word', /(\w+)(\s)/))

// Test 262

// call-split-without-arguments-and-instance-is-empty-string.js
// call-split-x-instance-is-empty-string.js
it('should return empty string when called on one', () => {
  runSplitTest('')
  runSplitTest('', 'x')
})

// separator-string-instance-is-empty-string-object.js
it(
  'should return an empty array when called on an empty string with an empty string separator',
  createSplitTest('', '')
)

// call-split-x-instance-is-string-hello.js
it('should return the original string when no matches are found', createSplitTest('hello', 'x'))

// call-split-undefined-instance-is-string-hello.js
it('should ignore an undefined separator', createSplitTest('hello', undefined))

// argument-is-null-and-instance-is-function-call-that-returned-string.js
// call-split-true-instance-is-thistrueistrueatruestringtrueobject.js
// cstm-split-is-null.js
// separator-override-tostring-limit-override-valueof-throws.js
// separator-override-tostring-limit-override-valueof-tostring-throws.js
// separator-override-tostring-limit-override-valueof-tostring.js
it('should convert separator to string and limit to number', () => {
  runSplitTest('gnulluna', null)
  runSplitTest('thistrueistrueatruestringtrueobject', true)

  const separator = {
    [Symbol.split]: null,
    toString() {
      return '2'
    },
    valueOf() {
      throw new Error('Poisoned split')
    },
  }
  runSplitTest('a2b2c', separator)
  runSplitTest('a2b2c', separator, 1)

  expect(() =>
    createStringTracker('ABB\u0041BABAB').split(
      {
        // @ts-ignore
        toString: () => '\u0041B',
      },
      {
        valueOf: () => {
          throw new Error('intointeger')
        },
      }
    )
  ).toThrow(new Error('intointeger'))

  expect(() =>
    createStringTracker('ABB\u0041BABAB').split(
      {
        // @ts-ignore
        toString: () => '\u0041B',
      },
      {
        valueOf() {
          return {}
        },
        toString: () => {
          throw new Error('intointeger')
        },
      }
    )
  ).toThrow(new Error('intointeger'))

  runSplitTest(
    'ABB\u0041BABAB\u0042cc^^\u0042Bvv%%B\u0042xxx',
    {
      // @ts-ignore
      toString: () => '\u0042\u0042',
    },
    {
      valueOf: () => ({}),
      toString: () => '2',
    }
  )
})

// separator-undef-limit-custom.js
// separator-undef-limit-zero.js
it('should convert limit to Uint32', () => {
  const str = 'undefined is not a function'
  runSplitTest(str, undefined, 0)
  runSplitTest(str, undefined, false)
  runSplitTest(str, undefined, null)
  runSplitTest(str, undefined, {
    valueOf() {
      return undefined
    },
  })
  runSplitTest(str, undefined, {
    valueOf() {
      return 0
    },
  })
  runSplitTest(str, undefined, NaN)
  runSplitTest(str, undefined, 2 ** 32)
  runSplitTest(str, undefined, 2 ** 33)
  runSplitTest(str, undefined, 1)
  runSplitTest(str, undefined, 2)
  runSplitTest(str, undefined, undefined)
  runSplitTest(str, undefined, true)
  runSplitTest(str, undefined, 2 ** 32 + 1)
  runSplitTest(str, undefined, 2 ** 31)
  runSplitTest(str, undefined, 2 ** 16)
  runSplitTest(str, undefined, {
    valueOf() {
      return 1
    },
  })
})

// limit-touint32-error.js
it('should convert limit to Uint32 before converting separator to string', () => {
  const nonStringableSeparator = {
    [Symbol.toPrimitive]() {
      throw new Error('separator[Symbol.toPrimitive]')
    },
    toString() {
      throw new Error('separator.toString')
    },
    valueOf() {
      throw new Error('separator.valueOf')
    },
  }
  const nonNumberableLimit = {
    [Symbol.toPrimitive]() {
      throw new Error('expected')
    },
  }

  // @ts-ignore
  expect(() => createStringTracker('foo').split(nonStringableSeparator, nonNumberableLimit)).toThrow(
    new Error('expected')
  )
})

// separator-tostring-error.js
it('should convert separator to string before checking limit is 0', () => {
  expect(() =>
    createStringTracker('foo').split(
      {
        // @ts-ignore
        toString() {
          throw new Error('expected')
        },
      },
      0
    )
  ).toThrow(new Error('expected'))
})

// argument-is-reg-exp-a-z-and-instance-is-string-abc.js
it('should give empty strings when everything is matched', createSplitTest('abc', /[a-z]/))

// argument-is-regexp-l-and-instance-is-string-hello.js
it('should split by single char RegExp separator', createSplitTest('hello', /l/))

// arguments-are-new-reg-exp-and-0-and-instance-is-string-hello.js
// arguments-are-regexp-l-and-0-and-instance-is-string-hello.js
// call-split-l-0-instance-is-string-hello.js
// call-split-l-na-n-instance-is-string-hello.js
it('should return an empty array when limit is 0 or NaN', () => {
  // @ts-ignore
  runSplitTest('hello', new RegExp(), 0)
  // @ts-ignore
  runSplitTest('hello', new RegExp(), NaN)
  runSplitTest('hello', /l/, 0)
  runSplitTest('hello', /l/, NaN)
  runSplitTest('hello', 'l', 0)
  runSplitTest('hello', 'l', NaN)
})

// arguments-are-new-reg-exp-and-1-and-instance-is-string-hello.js
// arguments-are-regexp-l-and-1-and-instance-is-string-hello.js
// call-split-l-1-instance-is-string-hello.js
it('should return a single match when limit is 1', () => {
  // @ts-ignore
  runSplitTest('hello', new RegExp(), 1)
  runSplitTest('hello', /l/, 1)
  runSplitTest('hello', 'l', 1)
})

// arguments-are-new-reg-exp-and-2-and-instance-is-string-hello.js
// arguments-are-regexp-l-and-2-and-instance-is-string-hello.js
// call-split-l-2-instance-is-string-hello.js
it('should return two matches when limit is 2', () => {
  // @ts-ignore
  runSplitTest('hello', new RegExp(), 2)
  runSplitTest('hello', /l/, 2)
  runSplitTest('hello', 'l', 2)
})

// arguments-are-new-reg-exp-and-3-and-instance-is-string-hello.js
// arguments-are-regexp-l-and-3-and-instance-is-string-hello.js
// call-split-l-3-instance-is-string-hello.js
it('should return three matches when limit is 3', () => {
  // @ts-ignore
  runSplitTest('hello', new RegExp(), 3)
  runSplitTest('hello', /l/, 3)
  runSplitTest('hello', 'l', 3)
})

// arguments-are-new-reg-exp-and-4-and-instance-is-string-hello.js
// arguments-are-regexp-l-and-4-and-instance-is-string-hello.js
// call-split-l-4-instance-is-string-hello.js
it('should return four matches when limit is 4', () => {
  // @ts-ignore
  runSplitTest('hello', new RegExp(), 4)
  runSplitTest('hello', /l/, 4)
  runSplitTest('hello', 'l', 4)
})

// separator-number-limit-math-pow-2-32-1-instance-is-number.js
it('should return all matches when limit is 2 ** 32 - 1', () => {
  // @ts-ignore
  runSplitTest('hello', new RegExp(), 2 ** 32 - 1)
  runSplitTest('hello', /l/, 2 ** 32 - 1)
  runSplitTest('hello', 'l', 2 ** 32 - 1)
  runSplitTest('100111122133144155', '1', 2 ** 32 - 1)
})

// arguments-are-new-reg-exp-and-undefined-and-instance-is-string-hello.js
// arguments-are-regexp-l-and-undefined-and-instance-is-string-hello.js
it('should ignore an undefined limit', () => {
  // @ts-ignore
  runSplitTest('hello', new RegExp(), undefined)
  runSplitTest('hello', /l/, undefined)
  runSplitTest('hello', 'l', undefined)
})

// arguments-are-regexp-s-and-3-and-instance-is-string-a-b-c-de-f.js
it('should return three matches when limit is 3 with whitespace regexp', createSplitTest('a b c de f', /\s/, 3))

// call-split-123-instance-is-this123is123a123string123object.js
// @ts-ignore
it('should convert number separator string', createSplitTest('this123is123a123string123object', 123))

// call-split-2-instance-is-string-one-two-three-four-five.js
it('should include empty string at end if last match is at end of string', createSplitTest('one-1 two-2 four-4', '-4'))

// call-split-h-instance-is-string-hello.js
it('should include empty string at beginning if first match is at beginning of string', createSplitTest('hello', 'h'))

// call-split-hello-instance-is-string-hello.js
it('should include two empty strings when entire string is matched', createSplitTest('hello', 'hello'))

// call-split-hellothere-instance-is-string-hello.js
// call-split-r-42-instance-is-string-one-1-two-2-four-4.js
it('should include only original string when partial match', () => {
  runSplitTest('hello', 'hellothere')
  runSplitTest('one-1 two-2 four-4', 'r-42')
})

// call-split-instance-is-empty-string-object.js
// @ts-ignore
it('should include only empty string when called on empty string', createSplitTest(new String(), ' '))

// call-split-instance-is-string-one-1-two-2-four-4.js
it('should include each code point when separator is empty string', createSplitTest('one-1 two-2 three-3', ''))

// call-split-instance-is-string.js
it('should include include a single empty string when single char is fully matched', createSplitTest(' ', ' '))

// cstm-split-get-err.js
// cstm-split-invocation.js
it('should call Symbol.split on separators that define it', () => {
  const tracker = createStringTracker('')
  const poisonedSplit = {}
  Object.defineProperty(poisonedSplit, Symbol.split, {
    get() {
      throw new Error('Poisoned split')
    },
  })
  // @ts-ignore
  expect(() => tracker.split(poisonedSplit)).toThrow(new Error('Poisoned split'))

  var separator = {}
  var returnVal = {}
  var callCount = 0
  var thisVal, args

  // @ts-ignore
  separator[Symbol.split] = function () {
    callCount += 1
    thisVal = this
    args = arguments
    return returnVal
  }
  // @ts-ignore
  expect(tracker.split(separator, 'limit')).toEqual(returnVal)
  expect(thisVal).toEqual(separator)
  expect(callCount).toEqual(1)
  expect(args).not.toEqual(undefined)
  // @ts-ignore
  expect(args.length).toEqual(2)
  // @ts-ignore
  expect(args[0]).toEqual(tracker)
  // @ts-ignore
  expect(args[1]).toEqual('limit')
})

// separator-regexp.js
it('should correctly split with regular expression separators', () => {
  runSplitTest('x', /^/)
  runSplitTest('x', /^/)
  runSplitTest('x', /$/)
  runSplitTest('x', /.?/)
  runSplitTest('x', /.*/)
  runSplitTest('x', /.+/)
  runSplitTest('x', /.*?/)
  runSplitTest('x', /.{1}/)
  runSplitTest('x', /.{1,}/)
  runSplitTest('x', /.{1,2}/)
  runSplitTest('x', /()/)
  runSplitTest('x', /./)
  runSplitTest('x', /(?:)/)
  runSplitTest('x', /(...)/)
  runSplitTest('x', /(|)/)
  runSplitTest('x', /[]/)
  runSplitTest('x', /[^]/)
  runSplitTest('x', /[.-.]/)
  runSplitTest('x', /\0/)
  runSplitTest('x', /\b/)
  runSplitTest('x', /\B/)
  runSplitTest('x', /\d/)
  runSplitTest('x', /\D/)
  runSplitTest('x', /\n/)
  runSplitTest('x', /\r/)
  runSplitTest('x', /\s/)
  runSplitTest('x', /\S/)
  runSplitTest('x', /\v/)
  runSplitTest('x', /\w/)
  runSplitTest('x', /\W/)
  runSplitTest('x', /\k<x>/)
  runSplitTest('x', /\xA0/)
  runSplitTest('x', /\XA0/)
  runSplitTest('x', /\ddd/)
  runSplitTest('x', /\cY/)
  runSplitTest('x', /[\b]/)
  runSplitTest('x', /\x/)
  runSplitTest('x', /\X/)
})
