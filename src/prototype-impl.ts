import { createStringTracker, StringTracker } from '.'
import {
  getChangeLength,
  getChangeText,
  isRemove,
  sliceChange,
  stringToRegex,
  throwIfNotStringTracker,
  toIntegerOrInfinity,
  toLength,
  toUint32,
} from './helpers'

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter
 * Does not support named capture groups
 */
function createReplacer(replaceStr: string, isRegex: boolean): (substring: string, ...args: any[]) => string {
  const replaceStrSplit = replaceStr.split(/(\$\$)|(\$\d{1,2})|(\$')|(\$`)|(\$&)/).filter(Boolean)

  return (substring, ...args) =>
    replaceStrSplit.reduce((str, curr) => {
      if (!curr.startsWith('$')) return str + curr

      const index = args.slice(-2)[0] as number
      const fullStr = args.slice(-1)[0] as string
      if (curr === '$$') return str + '$'
      if (curr === '$&') return str + substring
      if (curr === '$`') return str + fullStr.slice(0, index)
      if (curr === "$'") return str + fullStr.slice(index + substring.length)
      if (isRegex && !isNaN(+curr.slice(1))) {
        // -1 is used on indexes because it is 1-indexed
        // First we try the largest match we can 1-99
        const index = Number(curr.slice(1)) - 1
        let value = args.slice(0, -2)[index]

        // If we don't find anything, we try a smaller match if possible (1-9)
        if (value === undefined && index > 9) {
          const index = +curr[1] - 1

          if (args.slice(0, -2)[index] !== undefined) {
            // Add the extra digit if it's there
            value = args.slice(0, -2)[index] + curr[2]
          }
        }

        // Return with the match or curr if no match was found
        return str + (value ?? curr)
      }
      return str + curr
    }, '')
}

/**
 * ES5 equivalent replace function. Does not support ES2015 extensions.
 * Named capture groups are not passed to the replacer function
 */
export function replace(
  this: StringTracker,
  searchValue: string | RegExp,
  replacer: (substring: string, ...args: any[]) => string
): StringTracker
/**
 * ES5 equivalent replace function. Does not support ES2015 extensions.
 * Named capture groups are not handled with $ syntax
 */
export function replace(this: StringTracker, searchValue: string | RegExp, replaceValue: string): StringTracker
export function replace(
  this: StringTracker,
  searchValue: string | RegExp,
  replacer: string | ((substring: string, ...args: any[]) => string)
): StringTracker {
  let tracker = this

  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(tracker, 'replace')

  // Sanitize inputs
  // Order matters according to the spec and should be tested in replace.test.ts
  if (typeof searchValue !== 'string' && !(searchValue instanceof RegExp)) {
    searchValue = String(searchValue)
  }
  if (typeof replacer !== 'string' && typeof replacer !== 'function') {
    replacer = String(replacer)
  }

  const str = tracker.get()
  const replacerFunc =
    typeof replacer === 'function' ? replacer : createReplacer(replacer, searchValue instanceof RegExp)

  const isGlobal = searchValue instanceof RegExp && searchValue.flags.includes('g')
  const matches =
    isGlobal && searchValue instanceof RegExp
      ? [...str.matchAll(searchValue)]
      : ([str.match(searchValue)].filter(Boolean) as RegExpMatchArray[])

  matches.reduce((indexOffset, match) => {
    // Match index can never be undefined because the only case where it would be
    // is if we used the g flag. We handle this case with matchAll
    const startIndex = match.index! + indexOffset
    // It is necessary to convert to string here since the following code is expecting a string and
    // the replacer function can return a non-string according to the spec and should be casted
    const strToAdd = String(replacerFunc(match[0], ...match.slice(1), match.index!, str))
    tracker = tracker.remove(startIndex, startIndex + match[0].length).add(startIndex, strToAdd)
    return indexOffset - match[0].length + strToAdd.length
  }, 0)

  return tracker
}

/**
 * ES2021 equivalent replaceAll function
 * Named capture groups are not handled with $ syntax
 * If a string is provided for the search value, a regular expression will be used internally
 */
export function replaceAll(
  this: StringTracker,
  searchValue: string | RegExp,
  replacer: (substring: string, ...args: any[]) => string
): StringTracker
/**
 * ES2021 equivalent replaceAll function
 * Named capture groups are not passed to the replacer function
 * If a string is provided for the search value, a regular expression will be used internally
 */
export function replaceAll(this: StringTracker, searchValue: string | RegExp, replaceValue: string): StringTracker
export function replaceAll(
  this: StringTracker,
  searchValue: string | RegExp,
  replacer: string | ((substring: string, ...args: any[]) => string)
): StringTracker {
  let tracker = this

  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'replaceAll')

  // Build equivalent regexp for string searchValue
  if (!(searchValue instanceof RegExp)) {
    searchValue = stringToRegex(searchValue, 'g')
  }

  if (!searchValue.flags.includes('g')) throw new TypeError('replaceAll must be called with a global RegExp')

  // @ts-ignore
  // Complaining due to overload signatures
  return tracker.replace(searchValue, replacer)
}

/**
 * Returns a section of a StringTracker.
 * @param start The index to the beginning of the specified portion of StringTracker.
 * @param end The index to the end of the specified portion of StringTracker. The substring includes the characters up to, but not including, the character indicated by end.
 * If this value is not specified, the substring continues to the end of StringTracker.
 */
export function slice(this: StringTracker, startIndex: number = 0, endIndex?: number): StringTracker {
  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'slice')

  // Sanitize our inputs to match the behavior of the spec
  const trackerLength = this.length

  startIndex = toIntegerOrInfinity(startIndex)
  if (startIndex < 0) startIndex = trackerLength + startIndex
  startIndex = Math.round(Math.max(Math.min(startIndex, trackerLength), 0))

  let sanitizedEndIndex = toIntegerOrInfinity(endIndex ?? this.length)
  if (sanitizedEndIndex < 0) sanitizedEndIndex = trackerLength + sanitizedEndIndex
  sanitizedEndIndex = Math.round(Math.max(Math.min(sanitizedEndIndex, trackerLength), 0))

  const sliceLength = sanitizedEndIndex - startIndex

  if (sanitizedEndIndex <= startIndex) return createStringTracker('')
  const { index, offset, change } = this.getIndexOfChange(startIndex)

  const slicedOriginalStr = this.getOriginal().slice(
    this.getIndexOnOriginal(startIndex),
    this.getIndexOnOriginal(sanitizedEndIndex)
  )

  const slicedChanges = [sliceChange(change, offset, offset + sliceLength)]

  if (getChangeLength(slicedChanges[0]) === sliceLength)
    // Early return when the single change contains all the required content
    return createStringTracker(slicedOriginalStr, {
      initialModified: slicedChanges.map(getChangeText).join(''),
      initialChanges: slicedChanges,
    })

  for (const change of this.getChanges().slice(index + 1)) {
    if (isRemove(change)) {
      slicedChanges.push(change)
      continue
    }
    const slicedChangesLength = slicedChanges.map(getChangeLength).reduce((a, b) => a + b, 0)
    const charsToAdd = sliceLength - slicedChangesLength

    slicedChanges.push(sliceChange(change, 0, charsToAdd))
    if (charsToAdd <= getChangeLength(change)) break
  }

  return createStringTracker(slicedOriginalStr, {
    initialModified: slicedChanges
      .filter((change) => !isRemove(change))
      .map(getChangeText)
      .join(''),
    initialChanges: slicedChanges,
  })
}

/**
 * Concatenates StringTracker arguments to the calling StringTracker and returns a new StringTracker
 * @param trackers One or more StringTracker to concatenate to calling StringTracker
 */
export function concat(this: StringTracker, ...trackers: StringTracker[]): StringTracker {
  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'concat')

  const concatTrackers = [this, ...trackers]

  const newChanges = concatTrackers.flatMap((tracker) => tracker.getChanges())
  const newModifiedStr = concatTrackers.map((tracker) => tracker.get()).join('')
  const newStr = concatTrackers.map((tracker) => tracker.getOriginal()).join('')
  return createStringTracker(newStr, { initialModified: newModifiedStr, initialChanges: newChanges })
}

/** Removes the leading and trailing white space and line terminator characters from a string. */
export function trim(this: StringTracker) {
  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'trim')

  return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
}

/** Returns a copy with leading whitespace removed. */
export function trimStart(this: StringTracker) {
  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'trimStart')

  return this.replace(/^[\s\uFEFF\xA0]+/g, '')
}

/** Returns a copy with trailing whitespace removed. */
export function trimEnd(this: StringTracker) {
  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'trimEnd')

  return this.replace(/[\s\uFEFF\xA0]+$/g, '')
}

/**
 * Pads the current StringTracker with a given string (possibly repeated) so that the resulting StringTracker reaches a given length.
 * The padding is applied from the start (left) of the current StringTracker.
 *
 * @param maxLength The length of the resulting StringTracker once the current StringTracker has been padded.
 *        If this parameter is smaller than the current StringTracker's length, the current StringTracker will be returned as it is.
 *
 * @param fillString The string to pad the current StringTracker with.
 *        If this string is too long, it will be truncated and the left-most part will be applied.
 *        The default value for this parameter is " " (U+0020).
 */
export function padStart(this: StringTracker, maxLength: number, fillString: string = ' '): StringTracker {
  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'padStart')

  // .concat() is used to make sure we return a new tracker
  return trackerPad(this.concat(), maxLength, fillString, 'start')
}

/**
 * Pads the current StringTracker with a given string (possibly repeated) so that the resulting StringTracker reaches a given length.
 * The padding is applied from the end (right) of the current StringTracker.
 *
 * @param maxLength The length of the resulting StringTracker once the current StringTracker has been padded.
 *        If this parameter is smaller than the current StringTracker's length, the current StringTracker will be returned as it is.
 *
 * @param fillString The string to pad the current StringTracker with.
 *        If this string is too long, it will be truncated and the left-most part will be applied.
 *        The default value for this parameter is " " (U+0020).
 */
export function padEnd(this: StringTracker, maxLength: number, fillString: string = ' '): StringTracker {
  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'padEnd')

  // .concat() is used to make sure we return a new tracker
  return trackerPad(this.concat(), maxLength, fillString, 'end')
}

function trackerPad(tracker: StringTracker, maxLength: number, fillString: string, placement: 'start' | 'end') {
  // Sanitize maxLength
  maxLength = toLength(maxLength)
  const trackerLength = tracker.get().length
  if (maxLength <= trackerLength) return tracker

  fillString = String(fillString)
  if (fillString.length === 0) return tracker

  const fillLen = maxLength - trackerLength
  return tracker.add(
    placement === 'start' ? 0 : trackerLength,
    fillString.repeat(Math.ceil(fillLen / fillString.length)).slice(0, fillLen)
  )
}

/**
 * Returns a String value that is made from count copies appended together. If count is 0,
 * the empty string is returned.
 * @param count number of copies to append
 */
export function repeat(this: StringTracker, count: number): StringTracker {
  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'repeat')

  count = toIntegerOrInfinity(count)
  if (count < 0) throw new RangeError('repeat count must be non-negative')
  // 2^28 - 1 is used as all browsers and node appear to be capable of handling it
  if (count === Infinity || count * this.length > 2 ** 28 - 1) {
    throw new RangeError('repeat count must be less than infinity and not overflow maximum string size')
  }
  if (count === 0) return createStringTracker('')

  // Fast trivial case
  if (this.get() === '' && this.getOriginal() === '') return createStringTracker('')
  return this.concat(...new Array(count - 1).fill(this))
}

/**
 * Split a StringTracker into substrings using the specified separator and return them as an array.
 * @param separator A string that identifies character or characters to use in separating the string. If omitted, a single-element array containing the entire string is returned.
 * @param limit A value used to limit the number of elements returned in the array.
 */
export function split(this: StringTracker, separator: string | RegExp, limit: number = 2 ** 32 - 1): StringTracker[] {
  // Step 2 of https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.split
  // Technically, the spec says we should check for [[Call]] but we don't have access as that's internal
  // https://tc39.es/ecma262/multipage/abstract-operations.html#sec-iscallable
  // Also, we ignore it for RegExp because we handle those differently
  if (
    !(separator instanceof RegExp) &&
    separator !== null &&
    separator !== undefined &&
    // @ts-ignore
    typeof separator[Symbol.split] === 'function'
  ) {
    // @ts-ignore
    return separator[Symbol.split](this, limit)
  }

  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'split')

  // Sanitize limit
  limit = toUint32(limit)

  // Sanitize separator
  if (typeof separator !== 'string' && !(separator instanceof RegExp) && separator !== undefined) {
    separator = String(separator)
  }

  // Early returns for trivial cases
  if (limit === 0) return []
  if (separator === undefined) return [this.slice()]
  if (separator === '' || (separator instanceof RegExp && separator.source === '(?:)')) {
    return new Array(Math.min(this.length, limit)).fill(0).map((_, i) => this.slice(i, i + 1))
  }

  if (typeof separator === 'string') {
    separator = stringToRegex(separator, 'gd')
  }
  // Make RegExp global for matchAll
  if (!separator.flags.includes('g')) {
    separator = new RegExp(separator, separator.flags + 'g')
  }
  if (!separator.flags.includes('d')) {
    separator = new RegExp(separator, separator.flags + 'd')
  }

  // Since exec() is stateful, we make sure we created a new RegExp
  separator = new RegExp(separator, separator.flags)

  // Build split trackers array
  const trackers = []
  let lastIndex = 0
  let remainingIterations = limit
  let match: RegExpExecArray | null
  while ((match = separator.exec(this.get()))) {
    // Ignore zero width matches and prevent infinite loop by incrementing lastIndex
    if (match[0] === '') {
      separator.lastIndex++
      continue
    }

    // Check if we've reached the limit
    if (remainingIterations <= 0) break
    remainingIterations--

    // Add trackers based on match
    trackers.push(this.slice(lastIndex, match.index))
    // @ts-ignore
    trackers.push(...match.indices.slice(1).map((indices) => this.slice(...indices)))

    lastIndex = match.index! + match[0].length
  }

  // Add last tracker if we didn't hit the limit
  if (remainingIterations !== 0) trackers.push(this.slice(lastIndex))
  return trackers
}

/**
 * Returns the substring at the specified location within a StringTracker.
 * @param start The zero-based index number indicating the beginning of the substring.
 * @param end Zero-based index number indicating the end of the substring. The substring includes the characters up to, but not including, the character indicated by end.
 * If end is omitted, the characters from start through the end of the original StringTracker are returned.
 */
export function substring(this: StringTracker, start: number = 0, end: number = this.length): StringTracker {
  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'substring')

  start = Math.max(0, toIntegerOrInfinity(start))
  end = Math.max(0, toIntegerOrInfinity(end))

  // Swap the order if startIndex is greater than endIndex
  if (start > end) {
    let temp = start
    start = end
    end = temp
  }

  return this.slice(start, end)
}

/**
 * Gets a substring beginning at the specified location and having the specified length.
 * @param from The starting position of the desired substring. The index of the first character in the StringTracker is zero.
 * @param length The number of characters to include in the returned substring.
 */
export function substr(this: StringTracker, from: number = 0, length?: number): StringTracker {
  // Throw TypeError when attempting to call this function on an object that does not contain
  // the StringTrackerSymbol identifier
  throwIfNotStringTracker(this, 'substr')

  // Sanitize from
  let startIndex = Math.trunc(+from)
  if (isNaN(startIndex)) startIndex = 0
  if (startIndex < 0) startIndex = Math.max(this.length + from, 0)

  // Sanitize length
  if (length !== undefined && (isNaN(+length) || length < 0)) length = 0

  const endIndex = length === undefined ? this.length : +length + startIndex

  return this.slice(startIndex, endIndex)
}
