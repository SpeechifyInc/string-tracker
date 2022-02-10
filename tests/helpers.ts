import { StringTracker, Change } from '../src'
import { getChangeText, getChangeLength, CHUNK_SIZE, isAdd, isRemove } from '../src/helpers'
import { ok, strictEqual } from 'assert'

/** Checks if changes are correct based on the modified and original string */
export function validateChanges(
  tracker: StringTracker,
  originalString = tracker.getOriginal(),
  modifiedString = tracker.get()
) {
  strictEqual(tracker.getOriginal(), originalString, 'Tracker original string must be equal to original string')
  strictEqual(tracker.get(), modifiedString, 'Tracker modified string must be equal to mimicked modified string')
  strictEqual(
    getModifiedFromChanges(tracker),
    modifiedString,
    `Tracker's string and add changes must equal the modified string`
  )
  strictEqual(
    getOriginalFromChanges(tracker),
    originalString,
    `Tracker's string and remove changes must equal the original string`
  )
  ok(
    validateChangeCleanliness(tracker),
    'Tracker must not contain any empty changes or adjacent changes of the same type'
  )
  ok(
    validateChunksCharCount(tracker),
    `The chunk's char count must equal the length of all string and add changes in the chunk`
  )
  ok(validateChunkSizes(tracker), `Tracker must not contain any chunks larger than the chunk size * 2`)
  return true
}

const getChangeType = (change: Change) => (isAdd(change) ? 'add' : isRemove(change) ? 'remove' : 'string')

/**
 * Useful for verifying that the Remove and regular string changes are correct.
 * Not useful for verifying Add changes.
 */
export const getOriginalFromChanges = (tracker: StringTracker) =>
  tracker
    .getChanges()
    .filter((change) => !isAdd(change))
    .map(getChangeText)
    .join('')

/**
 * Useful for verifying that the Add and regular string changes are correct.
 * Not useful for verifying Remove changes.
 */
export const getModifiedFromChanges = (tracker: StringTracker) =>
  tracker
    .getChanges()
    .filter((change) => !isRemove(change))
    .map(getChangeText)
    .join('')

/** Checks if the modified matches the modified parsed from the string/add changes */
/*
export function validateAdditiveChanges(tracker: StringTracker) {
  return tracker.get() === getModifiedFromChanges(tracker)
}*/

/** Checks if the original matches the original parsed from the string/remove changes */ /*
export function validateRemoveChanges(tracker: StringTracker) {
  return tracker.getOriginal() === getOriginalFromChanges(tracker)
}*/

/** Validates that changes of identical types are never adjacent to each other */
export function validateChangeCleanliness(tracker: StringTracker) {
  return tracker
    .getChanges()
    .every(
      (change, i, changes) =>
        i === 0 || (getChangeLength(change) > 0 && getChangeType(changes[i - 1]) !== getChangeType(change))
    )
}

/** Validate that the character counts for chunks match the changes */
export function validateChunksCharCount(tracker: StringTracker) {
  return tracker.getChangeChunks().every(
    (chunk) =>
      chunk[2]
        .filter((change) => !isRemove(change))
        .map(getChangeLength)
        .reduce((a, b) => a + b, 0) === chunk[0] &&
      chunk[2]
        .filter((change) => !isAdd(change))
        .map(getChangeLength)
        .reduce((a, b) => a + b, 0) === chunk[1]
  )
}

/** Validate that the chunks are a maximum of 2x the CHUNK_SIZE */
export function validateChunkSizes(tracker: StringTracker) {
  return tracker.getChangeChunks().every((chunk) => chunk[2].length < CHUNK_SIZE * 2 + 1)
}
