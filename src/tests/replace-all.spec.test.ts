import { createStringTracker } from '..'

// replaceValue-call-abrupt
it('should throw inside of the replacer function', () => {
  const stringTracker = createStringTracker('a')
  expect(() =>
    stringTracker.replaceAll('a', () => {
      throw new Error()
    })
  ).toThrow(Error)
})

// replaceValue-call-each-match-position
it('should call replace function for each match and not leak scope', () => {
  var t = (function (this: void) {
    return this
  })()

  const calls: [typeof t, string, number, string][] = []
  const replaceValue = function (this: void, ...args: [string, number, string]) {
    calls.push([this, ...args])
    return 'z'
  }

  const stringTracker = createStringTracker('ab c ab cdab cab c')

  expect(stringTracker.replaceAll('ab c', replaceValue).get()).toEqual('z zdzz')
  expect(calls.length).toEqual(4)

  const str = stringTracker.get()

  expect(calls).toEqual([
    [t, 'ab c', 0, str],
    [t, 'ab c', 5, str],
    [t, 'ab c', 10, str],
    [t, 'ab c', 14, str],
  ])
})

// replaceValue-call-matching-empty
it('should call replace function for each match and not leak scope', () => {
  var t = (function (this: void) {
    return this
  })()

  const calls: [typeof t, string, number, string][] = []
  const replaceValue = function (this: void, ...args: [string, number, string]) {
    calls.push([this, ...args])
    return 'abc'
  }

  const stringTracker = createStringTracker('')

  expect(stringTracker.replaceAll('', replaceValue).get()).toEqual('abc')
  expect(calls.length).toEqual(1)

  const str = stringTracker.get()

  expect(calls).toEqual([[t, '', 0, str]])
})

// replaceValue-call-skip-no-match
it('should not run replace function when no match is found', () => {
  const replaceFunction = () => {
    throw new Error()
  }

  const stringTracker = createStringTracker('a')
  expect(stringTracker.replaceAll('b', replaceFunction).get()).toEqual('a')
  expect(stringTracker.replaceAll('aa', replaceFunction).get()).toEqual('a')
})
