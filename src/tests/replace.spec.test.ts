// Notes on skipped tests
// 15.5.4.11_A1_T1 because casting `this` to a string isn't appropriate in our context
// 15.5.4.11_A1_T2 because casting `this` to a string isn't appropriate in our context
// 15.5.4.11_A1_T6 because there is no difference to our code between generated functions vs standard
// 15.5.4.11_A1_T7 because built-ins handle the conversion before the replace is ever called
// making this no different than other tests that check for type conversion
// 15.5.4.11_A1_T8 same reasoning as A1_T7
// 15.5.4.11_A1_T9 same reasoning as A1_T7
// 15.5.4.11_A1_T17 skipped because we do not have a primitive vs class based string

import { createStringTracker } from '..'

const global = this

// 15.5.4.11_A12
it('should not leak global this', () => {
  const stringTracker = createStringTracker('ABABABABBAB')
  stringTracker.replace('o', function (this: undefined) {
    expect(this).not.toEqual(global)
    return 'y'
  })
})
it('should be called with this === undefined', () => {
  const stringTracker = createStringTracker('ABABABABBAB')
  stringTracker.replace('AB', function (this: undefined) {
    expect(this).toEqual(undefined)
    return 'y'
  })
})

// 15.5.4.11_A1_T4
it('should convert searchValue to string and respect replacer function', () => {
  const tracker = createStringTracker('gnulluna')
  // @ts-ignore
  expect(tracker.replace(null, (_, a2, __) => a2 + '').get()).toEqual('g1una')
})

// 15.5.4.11_A1_T5
it('should convert searchValue and replaceValue to string and respect empty replacer function', () => {
  // @ts-ignore
  expect(createStringTracker('gnulluna').replace(null, Function()).get()).toEqual('gundefineduna')
})

// 15.5.4.11_A1_T10
it('should convert searchValue to string', () => {
  const obj = {
    toString: () => '\u0041B',
  }
  const stringTracker = createStringTracker('ABB\u0041BABAB')
  // @ts-ignore
  const result = stringTracker.replace(obj, () => undefined).get()
  expect(result).toEqual('undefinedBABABAB')
})

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
it('replaces regex matches created with RegExp constructor', () => {
  const stringTracker = createStringTracker('ABB\u0041BABAB\u0037\u0037BBAA')

  // @ts-ignore
  expect(stringTracker.replace(new RegExp('77'), 1).get()).toEqual('ABBABABAB\u0031BBAA')
})

// 15.5.4.11_A1_T15
// This test isn't quite correct since we don't use an actual prototype
it('throws TypeError when called with bind to string', () => {
  const stringTracker = createStringTracker('ABBABABABA')

  // @ts-ignore
  expect(() => stringTracker.replace.call('ABBBABABA', 'BA', 'AB')).toThrow(TypeError)
})

// 15.5.4.11_A1_T16
// This test isn't quite correct since we don't use an actual prototype
it('throws TypeError when called with bind to number', () => {
  const obj = {
    toString: function () {
      // @ts-ignore
      return function (_, a2, __) {
        return a2 + 'z'
      }
    },
  }

  const stringTracker = createStringTracker('ABBABABABA')
  // @ts-ignore
  expect(() => stringTracker.replace.call(1100.00777001, /77/, obj)).toThrow(TypeError)
})

// 15.5.4.11_A2_T1
it('should correctly replace multiple matches', () => {
  const stringTracker = createStringTracker('She sells seashells by the seashore.')
  expect(stringTracker.replace(/sh/g, 'sch').get()).toEqual('She sells seaschells by the seaschore.')
})

// 15.5.4.11_A2_T2
it('should place a single $ in replacement of $$ in replaceValue', () => {
  const stringTracker = createStringTracker('She sells seashells by the seashore.')
  expect(stringTracker.replace(/sh/g, '$$sch').get()).toEqual('She sells sea$schells by the sea$schore.')
})

// 15.5.4.11_A2_T3
it('should replace $& with the matched substring', () => {
  const stringTracker = createStringTracker('She sells seashells by the seashore.')
  expect(stringTracker.replace(/sh/g, '$&sch').get()).toEqual('She sells seashschells by the seashschore.')
})

// 15.5.4.11_A2_T4
it('should replace $` with the substring before the match', () => {
  const stringTracker = createStringTracker('She sells seashells by the seashore.')
  expect(stringTracker.replace(/sh/g, '$`sch').get()).toEqual(
    'She sells seaShe sells seaschells by the seaShe sells seashells by the seaschore.'
  )
})

// 15.5.4.11_A2_T5
it("should replace $' with the substring after the match", () => {
  const stringTracker = createStringTracker('She sells seashells by the seashore.')
  expect(stringTracker.replace(/sh/g, "$'sch").get()).toEqual(
    'She sells seaells by the seashore.schells by the seaore.schore.'
  )
})

// 15.5.4.11_A2_T6
it('should replace the first instance of sh with sch', () => {
  const stringTracker = createStringTracker('She sells seashells by the seashore.')
  expect(stringTracker.replace(/sh/, 'sch').get()).toEqual('She sells seaschells by the seashore.')
})

// 15.5.4.11_A2_T7
it('should replace $$ with a single $', () => {
  const stringTracker = createStringTracker('She sells seashells by the seashore.')
  expect(stringTracker.replace(/sh/, '$$sch').get()).toEqual('She sells sea$schells by the seashore.')
})

it('should treat $* as any other set of characters', () => {
  const stringTracker = createStringTracker('She sells seashells by the seashore.')
  expect(stringTracker.replace(/sh/, '$*sch').get()).toEqual('She sells sea$*schells by the seashore.')
})

// 15.5.4.11_A2_T8
it('should replace void 0 with undefined string', () => {
  const stringTracker = createStringTracker('undefined')
  // @ts-ignore
  expect(stringTracker.replace(/e/g, void 0).get()).toEqual('undundefinedfinundefinedd')
})

// 15.5.4.11_A2_T9
it('should replace $` with the substring before the match once', () => {
  const stringTracker = createStringTracker('She sells seashells by the seashore.')
  // @ts-ignore
  expect(stringTracker.replace(/sh/, '$`sch').get()).toEqual('She sells seaShe sells seaschells by the seashore.')
})

// 15.5.4.11_A3_T1
it('should replace $1 with the first captured group', () => {
  const stringTracker = createStringTracker('uid=31')
  // @ts-ignore
  expect(stringTracker.replace(/(uid=)(\d+)/, '$1115').get()).toEqual('uid=115')
})

// 15.5.4.11_A4_T1
it('should provide capture groups to replacer function', () => {
  const stringTracker = createStringTracker('abc12 def34')
  expect(
    stringTracker
      // @ts-ignore
      .replace(/([a-z]+)([0-9]+)/, function replacer() {
        return arguments[2] + arguments[1]
      })
      .get()
  ).toEqual('12abc def34')
})

// 15.5.4.11_A4_T2
it('should provide capture groups to replacer function and run for all instances', () => {
  const stringTracker = createStringTracker('abc12 def34')
  expect(
    stringTracker
      // @ts-ignore
      .replace(/([a-z]+)([0-9]+)/g, function replacer() {
        return arguments[2] + arguments[1]
      })
      .get()
  ).toEqual('12abc 34def')
})

// 15.5.4.11_A4_T3
it('should provide capture groups to replacer function and run and respect case insensitive on all instances', () => {
  const stringTracker = createStringTracker('aBc12 def34')
  expect(
    stringTracker
      // @ts-ignore
      .replace(/([a-z]+)([0-9]+)/gi, function replacer() {
        return arguments[2] + arguments[1]
      })
      .get()
  ).toEqual('12aBc 34def')
})

// 15.5.4.11_A5_T1
it('should respect matching results of capture group in searchValue regexp', () => {
  const stringTracker = createStringTracker('aaaaaaaaaa,aaaaaaaaaaaaaaa')
  expect(stringTracker.replace(/^(a+)\1*,\1+$/, '$1').get()).toEqual('aaaaa')
})
