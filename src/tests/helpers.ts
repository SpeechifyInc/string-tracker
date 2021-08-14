import { StringTracker } from '..'
import { getChangeText, isRemove } from '../helpers'

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
