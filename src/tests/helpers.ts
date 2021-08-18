import { StringTracker } from '..'
import { getChangeText, isAdd, isRemove } from '../helpers'

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

/** Checks if changes are correct based on the modified and original string */
export function validateChanges(tracker: StringTracker) {
  const removesAreCorrect =
    tracker.getOriginal() ===
    tracker
      .getChanges()
      .filter((change) => !isAdd(change))
      .map(getChangeText)
      .join('')

  if (!removesAreCorrect) {
    console.log(tracker.getOriginal(), tracker.getChanges())
    throw new Error('Invalid remove changes')
  }

  const addsAreCorrect =
    tracker.get() ===
    tracker
      .getChanges()
      .filter((change) => !isRemove(change))
      .map(getChangeText)
      .join('')

   if (!addsAreCorrect) {
     console.log(tracker.get(), tracker.getChanges())
     throw new Error('Invalid add changes')
   }

  return removesAreCorrect && addsAreCorrect
}
