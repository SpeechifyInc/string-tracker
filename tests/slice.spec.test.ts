import { createStringTracker, StringOp, StringTracker } from '../src'
import { assertValidTracker, getModifiedFromChanges } from './helpers'

function createSliceTest(str: string, start?: any, end?: any) {
  return () => runSliceTest(str, start, end)
}

function runSliceTest(str: string | StringTracker, start?: any, end?: any) {
  const tracker = typeof str === 'string' ? createStringTracker(str) : str

  const actualSlice = tracker.getOriginal().slice(start, end)
  const trackerSlice = tracker.slice(start, end)

  expect(trackerSlice.get()).toEqual(actualSlice)
  expect(getModifiedFromChanges(trackerSlice)).toEqual(actualSlice)
  assertValidTracker(tracker)
}

it('should include the beginning changes when slicing from 0', () => {
  const tracker = createStringTracker('aaa this is my word').remove(0, 4).slice(0)
  assertValidTracker(tracker)
  expect(tracker.getOriginal()).toEqual('aaa this is my word')
  expect(tracker.get()).toEqual('this is my word')
})

it('should include the ending remove change when slicing to the end', () => {
  const tracker = createStringTracker('this is my word aaa').remove(15)
  expect(tracker.slice().getOriginal()).toEqual('this is my word aaa')
  expect(tracker.slice().get()).toEqual('this is my word')
  expect(tracker.slice(0, 15).getOriginal()).toEqual('this is my word aaa')
  expect(tracker.slice(0, 15).get()).toEqual('this is my word')
})

it('should not include the ending remove change when slicing to the last character', () => {
  const tracker = createStringTracker('this is my word aaa').remove(15)
  expect(tracker.slice(0, 14).getOriginal()).toEqual('this is my wor')
  expect(tracker.slice(0, 14).get()).toEqual('this is my wor')
})

it('should not include remove further than end of string', () => {
  const tracker = createStringTracker('   hello world   test sentence').remove(0, 3).remove(11, 14)
  expect(tracker.slice(0, 10).getChanges()).toEqual([[StringOp.Remove, '   '], 'hello worl'])
  expect(tracker.slice(0, 11).getChanges()).toEqual([[StringOp.Remove, '   '], 'hello world'])
  expect(tracker.slice(0, 12).getChanges()).toEqual([[StringOp.Remove, '   '], 'hello world', [StringOp.Remove, '   '], 't'])
  expect(tracker.slice(10).getChanges()).toEqual(['d', [StringOp.Remove, '   '], 'test sentence'])
  expect(tracker.slice(11).getChanges()).toEqual([[StringOp.Remove, '   '], 'test sentence'])
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
