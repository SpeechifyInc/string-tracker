import { createStringTracker } from '../src'
import { validateChanges, getModifiedFromChanges } from './helpers'

function createSliceTest(str: string, start?: any, end?: any) {
  return () => runSliceTest(str, start, end)
}

function runSliceTest(str: string, start?: any, end?: any) {
  const tracker = createStringTracker(str)

  const actualSlice = str.slice(start, end)
  const trackerSlice = tracker.slice(start, end)

  expect(trackerSlice.get()).toEqual(actualSlice)
  expect(getModifiedFromChanges(trackerSlice)).toEqual(actualSlice)
  expect(validateChanges(tracker)).toEqual(true)
}

it('should include the beginning changes when slicing from 0', () => {
  const tracker = createStringTracker('aaa this is my word').remove(0, 4)
  expect(tracker.slice(0).getOriginal()).toEqual('aaa this is my word')
  expect(tracker.slice(0).get()).toEqual('this is my word')
})

it('should include the ending changes when slicing from end', () => {
  const tracker = createStringTracker('this is my word aaa').remove(15)
  expect(tracker.slice(0).getOriginal()).toEqual('this is my word aaa')
  expect(tracker.slice(0, 16).get()).toEqual('this is my word')
})

it('should throw when not called on a StringTracker', () => {
  const tracker = createStringTracker('this is my word')
  // @ts-ignore
  expect(() => tracker.slice.call('this is my word', 0)).toThrow(TypeError)
})

// 15.5.4.13_A1_T1
it('should convert arguments to numbers', createSliceTest('true', false, true))

// 15.5.4.13_A1_T4 & 15.5.4.13_A1_T6 & 15.5.4.13_A1_T7 & 15.5.4.13_A1_T8 & 15.5.4.13_A1_T9
it('should convert arguments to numbers', () => {
  runSliceTest('gnulluna', null, -3)
  runSliceTest('undefined', undefined, 3)
  runSliceTest('undefined', 'e', undefined)
  runSliceTest('undefined', -4, undefined)

  const __obj = {
    valueOf: function () {},
    toString: void 0,
  }

  runSliceTest('undefined', undefined, __obj)
})

// 15.5.4.13_A2_T1
it('should return a copy when called with no arguments', createSliceTest('this is a string object'))

// 15.5.4.13_A2_T2
it('should convert infinity to last index and NaN to 0', createSliceTest('this is a string object', NaN, Infinity))

// 15.5.4.13_A2_T3
it('should convert out of bounds indices to within bounds', createSliceTest('', 1, 0))

// 15.5.4.13_A2_T4
it('should convert lopsided indices to within bounds', createSliceTest('this is a string object', Infinity, NaN))

// 15.5.4.13_A2_T5
it('should convert infinity to last index', createSliceTest('this is a string object', Infinity, Infinity))

// 15.5.4.13_A2_T6
it('should round decimal indices', createSliceTest('this is a string object', -0.01, 0))

// 15.5.4.13_A2_T9
it('should convert negative infinity to first index', createSliceTest('this is a string object', -Infinity, -Infinity))
