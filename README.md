<p>
  <img src="https://img.shields.io/static/v1?label=npm&message=0.0.1-rc3&color=success&style=flat-square">
  <img src="https://img.shields.io/static/v1?label=coverage&message=90.89%25&color=green&style=flat-square">
</p>

# String Tracker
A library for operating on strings while maintaining changes and index maps transparently. This is done by keeping a list of add, remove and regular string changes.

## This Project is WIP

- [ ] Full coverage using Test262 + custom tests
- [ ] Fuzzing
- [ ] Benchmarking and optimization

## How it works

```js
const text = "hello world"
// Internal changes array is ["hello world"]
let stringTracker = createStringTracker(text)
```

As add and remove operations are done, we keep track by adding new entries to the changes array.

```js
// Changes array becomes ["he", [StringOp.Add, "foo"], "llo world"]
stringTracker = stringTracker.add(2, "foo")
stringTracker.get() // hefoollo world
```

The library spends extra ops during add/remove to remove add/remove conflicts. For example

```js
// Changes array becomes ["he", [StringOp.Add, "fo"], [StringOp.Remove, "llo "], "world"]
// We remove the first char of the add permanently since it's now irrelevant
stringTracker = stringTracker.remove(4, 9)
stringTracker.get() // hefoworld
```

#### `createStringTracker(originalText: string, { initialModified?: string, initialChanges?: Change[] }): StringTracker`

Used to create a new instance of the string tracker. The second argument is used internally for creating new trackers on add and remove operations.

#### `add(index: number, text: string): StringTracker`

Pushes all characters at and after the index forward and places a new Add change at the index. Does not modify the existing StringTracker. Returns a new StringTracker

```js
let stringTracker = createStringTracker("foo bar")
// Changes array becomes ["foo", [StringOp.Add, " hello"], " bar"]
stringTracker = stringTracker.add(3, " hello")
stringTracker.get() // foo hello bar
```

#### `remove(startIndex: number, endIndex?: number): StringTracker`

Removes all characters from the startIndex to the endIndex (non-inclusive).

```js
let stringTracker = createStringTracker("foo bar")
// Changes array becomes ["foo", [StringOp.Remove, " b"], "ar"]
stringTracker = stringTracker.remove(3, 5)
stringTracker.get() // fooar
```

#### `get(): string`

Returns the modified string

```js
let stringTracker = createStringTracker("foo bar")
// Changes array becomes ["foo", [StringOp.Remove, " b"], "ar"]
stringTracker = stringTracker.remove(3, 5)
stringTracker.get() // fooar
```

#### `getOriginal(): string`

Returns the original string

```js
let stringTracker = createStringTracker("foo bar")
// Changes array becomes ["foo", [StringOp.Remove, " b"], "ar"]
stringTracker = stringTracker.remove(3, 5)
stringTracker.getOriginal() // foo bar
```

#### `getChanges(): Change[]`

Returns the an array of the internal changes. Examples of what this looks for specific strings can be found at the beginning of the README.

`["he", [StringOp.Add, "fo"], [StringOp.Remove, "llo "], "world"]`

#### `getIndexOnOriginal(index: number): number`

Returns the index of the character on the original string for mapping Modified -> Original.

```js
let stringTracker = createStringTracker("foo bar")
// Changes array becomes ["foo", [StringOp.Remove, " b"], "ar"]
stringTracker = stringTracker.remove(3, 5)
stringTracker.get() // fooar
stringTracker.getIndexOnOriginal(4) // Refers to the 'a' in 'fooar'. 4 + 2 (because of remove) = 6
```

#### `getIndexOnModified(index: number): number`

Returns the index of the character on the original string for mapping Modified -> Original.

```js
let stringTracker = createStringTracker("foo bar")
// Changes array becomes ["foo", [StringOp.Remove, " b"], "ar"]
stringTracker = stringTracker.remove(3, 5)
stringTracker.get() // fooar
stringTracker.getIndexOnOriginal(6) // Refers to the 'a' in 'fooar'. 6 - 2 (because of remove) = 4
```

## String Prototype functions

The StringTracker includes implementations for every prototype function that would return a new string other than a few exceptions as detailed in the next section. Test262 tests are used for development to maintain spec compliance and anything deviates from the spec should be considered a bug. Any string prototype functions that do not return a new string are passed through to the original String prototype function via a Proxy. Any missing functions not detailed in the next section will be added before 1.0 release.

### Important Note

`toLowerCase`, `toUpperCase` and `normalize` cannot be implemented correctly due to the required access to a Unicode mapping for characters cases. Thus, these functions should be run before creating the string tracker where possible. It's an unfortunate limitation due to the size of the Unicode mapping so an alternative version of this library may be provided that includes these functions and the mapping where size does not matter.

### Differences from String prototype

All the implementations are meant to be run on a StringTracker and will throw a TypeError if they are not. This is unlike the String functions which will coerce the caller if it is not a string and is coercible. https://262.ecma-international.org/12.0/#sec-requireobjectcoercible
