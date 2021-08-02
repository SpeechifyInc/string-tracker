import { createStringTracker } from '..'

// 15.5.4.13_A1_T1
it('should convert arguments to numbers', () => {
  const stringTracker = createStringTracker('true')
  // @ts-ignore
  expect(stringTracker.slice(false, true).get()).toEqual('t')
})

// 15.5.4.13_A1_T4 & 15.5.4.13_A1_T6 & 15.5.4.13_A1_T7 & 15.5.4.13_A1_T8 & 15.5.4.13_A1_T9
it('should convert arguments to numbers', () => {
  const stringTracker = createStringTracker('gnulluna')
  // @ts-ignore
  expect(stringTracker.slice(null, -3).get()).toEqual('gnull')

  const stringTracker2 = createStringTracker('undefined')
  // @ts-ignore
  expect(stringTracker2.slice(undefined, 3).get()).toEqual('und')

  const stringTracker3 = createStringTracker('undefined')
  // @ts-ignore
  expect(stringTracker3.slice('e', undefined).get()).toEqual('undefined')
  // @ts-ignore
  expect(stringTracker3.slice(-4, undefined).get()).toEqual('ined')

  const __obj = {
    valueOf: function () {},
    toString: void 0,
  }

  // @ts-ignore
  expect(stringTracker3.slice(undefined, __obj).get())
})

// 15.5.4.13_A2_T1
it('should return a copy when called with no arguments', () => {
  const stringTracker = createStringTracker('this is a string object')
  expect(stringTracker.slice().get()).toEqual('this is a string object')
})

// 15.5.4.13_A2_T2
it('should convert infinity to last index and NaN to 0', () => {
  const stringTracker = createStringTracker('this is a string object')
  expect(stringTracker.slice(NaN, Infinity).get()).toEqual('this is a string object')
})

// 15.5.4.13_A2_T3
it('should convert out of bounds indices to within bounds', () => {
  const stringTracker = createStringTracker('')
  expect(stringTracker.slice(1, 0).get()).toEqual('')
})

// 15.5.4.13_A2_T4
it('should convert lopsided indices to within bounds', () => {
  const stringTracker = createStringTracker('this is a string object')
  expect(stringTracker.slice(Infinity, NaN).get()).toEqual('')
})

// 15.5.4.13_A2_T5
it('should convert infinity to last index', () => {
  const stringTracker = createStringTracker('this is a string object')
  expect(stringTracker.slice(Infinity, Infinity).get()).toEqual('')
})

// 15.5.4.13_A2_T6
it('should round decimal indices', () => {
  const stringTracker = createStringTracker('this is a string object')
  expect(stringTracker.slice(-0.01, 0).get()).toEqual('')
})

// 15.5.4.13_A2_T9
it('should convert negative infinity to first index', () => {
  const stringTracker = createStringTracker('this is a string object')
  expect(stringTracker.slice(-Infinity, -Infinity).get()).toEqual('')
})
