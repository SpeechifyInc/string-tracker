import { createStringTracker } from '../src'
import { validateChanges, getModifiedFromChanges } from './helpers'

function createReplaceTest(str: string, searchValue?: any, replacer?: any) {
  return () => runReplaceTest(str, searchValue, replacer)
}

function runReplaceTest(str: string, searchValue?: any, replacer?: any) {
  const tracker = createStringTracker(str)

  const actualRepeat = str.replace(searchValue, replacer)
  const trackerRepeat = tracker.replace(searchValue, replacer)

  expect(trackerRepeat.get()).toEqual(actualRepeat)
  expect(getModifiedFromChanges(trackerRepeat)).toEqual(actualRepeat)
  expect(validateChanges(tracker)).toEqual(true)
}

it('should throw when not called on a StringTracker', () => {
  const tracker = createStringTracker('this is my word')
  // @ts-ignore
  expect(() => tracker.replace.call('this is my word', 'is', 'foo')).toThrow(TypeError)
})

const global = this

// 15.5.4.11_A12
it(
  'should not leak global this',
  createReplaceTest('x', 'x', function (this: undefined) {
    expect(this).not.toEqual(global)
    return 'y'
  })
)

it(
  'should be called with this === undefined',
  createReplaceTest('x', 'x', function (this: undefined) {
    expect(this).toEqual(undefined)
    return 'y'
  })
)

// 15.5.4.11_A1_T4
it(
  'should convert searchValue to string and respect replacer function',
  // @ts-ignore
  createReplaceTest('gnulluna', null, (_, a2, __) => a2 + '')
)

// 15.5.4.11_A1_T5
it(
  'should convert searchValue and replaceValue to string and respect empty replacer function',
  createReplaceTest('gnulluna', null, Function())
)

// 15.5.4.11_A1_T10
it(
  'should convert searchValue to string',
  createReplaceTest('ABB\u0041BABAB', { toString: () => '\u0041B' }, () => undefined)
)

// 15.5.4.11_A1_T11
it('should throw exception in toString', () => {
  const obj = {
    toString: function () {
      throw 'insearchValue'
    },
  }
  const obj2 = {
    toString: function () {
      throw 'inreplaceValue'
    },
  }
  const stringTracker = createStringTracker('ABB\u0041BABAB')

  // @ts-ignore
  expect(() => stringTracker.replace(obj, obj2)).toThrow('insearchValue')
})

// 15.5.4.11_A1_T12
it('should throw exception in valueOf', () => {
  const obj = {
    toString: function () {
      return {}
    },
    valueOf: function () {
      throw 'insearchValue'
    },
  }
  const obj2 = {
    toString: function () {
      throw 'inreplaceValue'
    },
  }
  const stringTracker = createStringTracker('ABB\u0041BABAB')

  // @ts-ignore
  expect(() => stringTracker.replace(obj, obj2)).toThrow('insearchValue')
})

// 15.5.4.11_A1_T13
it('should throw exception in toString in replaceValue', () => {
  const obj = {
    toString: function () {
      return {}
    },
    valueOf: function () {
      return 1
    },
  }
  const obj2 = {
    toString: function () {
      throw 'inreplaceValue'
    },
  }

  // @ts-ignore
  expect(() => createStringTracker('ABB\u0041BABAB\u0031BBAA').replace(obj, obj2)).toThrow('inreplaceValue')
})

// 15.5.4.11_A1_T14
it(
  'replaces regex matches created with RegExp constructor',
  createReplaceTest('ABB\u0041BABAB\u0037\u0037BBAA', new RegExp('77'), 1)
)

// 15.5.4.11_A2_T1
it('should correctly replace multiple matches', createReplaceTest('She sells seashells by the seashore.', /sh/g, 'sch'))

// 15.5.4.11_A2_T2
it(
  'should place a single $ in replacement of $$ in replaceValue',
  createReplaceTest('She sells seashells by the seashore.', /sh/g, '$$sch')
)

// 15.5.4.11_A2_T3
it(
  'should replace $& with the matched substring',
  createReplaceTest('She sells seashells by the seashore.', /sh/g, '$&sch')
)

// 15.5.4.11_A2_T4
it(
  'should replace $` with the substring before the match',
  createReplaceTest('She sells seashells by the seashore.', /sh/g, '$`sch')
)

// 15.5.4.11_A2_T5
it(
  "should replace $' with the substring after the match",
  createReplaceTest('She sells seashells by the seashore.', /sh/g, "$'sch")
)

// 15.5.4.11_A2_T6
it(
  'should replace the first instance of sh with sch',
  createReplaceTest('She sells seashells by the seashore.', /sh/, 'sch')
)

// 15.5.4.11_A2_T7
it('should replace $$ with a single $', createReplaceTest('She sells seashells by the seashore.', /sh/, '$$sch'))

it(
  'should treat $* as any other set of characters',
  createReplaceTest('She sells seashells by the seashore.', /sh/, '$*sch')
)

// 15.5.4.11_A2_T9
it(
  'should replace $` with the substring before the match once',
  createReplaceTest('She sells seashells by the seashore.', /sh/, '$`sch')
)

// 15.5.4.11_A3_T1
it('should replace $1 with the first captured group', createReplaceTest('uid=31', /(uid=)(\d+)/, '$1115'))

it(
  'should not replace $5 when a captured group with that index does not exist',
  createReplaceTest('uid=31', /(uid=)(\d+)/, '$5115')
)

// 15.5.4.11_A4_T1
it(
  'should provide capture groups to replacer function',
  createReplaceTest('abc12 def32', /([a-z]+)([0-9]+)/, function replacer() {
    return arguments[2] + arguments[1]
  })
)

// 15.5.4.11_A4_T2
it(
  'should provide capture groups to replacer function and run for all instances',
  createReplaceTest('abc12 def32', /([a-z]+)([0-9]+)/g, function replacer() {
    return arguments[2] + arguments[1]
  })
)

// 15.5.4.11_A4_T3
it(
  'should provide capture groups to replacer function and run and respect case insensitive on all instances',
  createReplaceTest('aBc12 def34', /([a-z]+)([0-9]+)/gi, function replacer() {
    return arguments[2] + arguments[1]
  })
)

// 15.5.4.11_A5_T1
it(
  'should respect matching results of capture group in searchValue regexp',
  createReplaceTest('aaaaaaaaaa,aaaaaaaaaaaaaaa', /^(a+)\1*,\1+$/, '$1')
)
