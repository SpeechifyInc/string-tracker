import { StringTracker, StringTrackerSymbol } from '.'

// TODO: split implementation
// TODO: substr implementation
// TODO: substring implementation
// TODO: toLowerCase
// TODO: toUpperCase

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
        const index = +curr.slice(1) - 1
        let value = args.slice(0, -2)[index]

        // If we don't find anything, we try a smaller match if possible (1-9)
        if (!value && index > 9) {
          const index = +curr[1] - 1
          // Add the extra digit if it's there
          value = args.slice(0, -2)[index] + (curr[2] ?? '')
        }

        // Return with the match or curr if no match was found
        return str + value ?? curr
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
  if (typeof tracker !== 'object' || !(StringTrackerSymbol in tracker)) {
    throw new TypeError('replace must be called on an instance of StringTracker')
  }

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
  // Build equivalent regexp for string searchValue
  // Snippet taken from escape-string-regexp
  if (!(searchValue instanceof RegExp)) {
    searchValue = new RegExp(String(searchValue).replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'), 'g')
  }

  if (!searchValue.flags.includes('g')) throw new TypeError('replaceAll must be called with a global RegExp')

  // Work around for typescript complaining about overload signatures
  if (typeof replacer === 'string') return tracker.replace(searchValue, replacer)
  return tracker.replace(searchValue, replacer)
}

/** Removes the leading and trailing white space and line terminator characters from a string. */
export function trim(this: StringTracker) {
  return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
}

/** Returns a copy with leading whitespace removed. */
export function trimStart(this: StringTracker) {
  return this.replace(/^[\s\uFEFF\xA0]+/g, '')
}

/** Returns a copy with trailing whitespace removed. */
export function trimEnd(this: StringTracker) {
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
  const tracker = this
  const trackerLength = tracker.get().length
  if (maxLength <= trackerLength) return tracker
  const sizeDifference = maxLength - trackerLength
  return tracker.add(0, fillString.repeat(Math.ceil(sizeDifference / fillString.length)).slice(0, sizeDifference))
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
  const tracker = this
  const trackerLength = tracker.get().length
  if (maxLength <= trackerLength) return tracker
  const sizeDifference = maxLength - trackerLength
  return tracker.add(
    trackerLength - 1,
    fillString.repeat(Math.ceil(sizeDifference / fillString.length)).slice(0, sizeDifference)
  )
}
