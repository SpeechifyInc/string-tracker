# String Tracker
A library for operating on strings while maintaining changes and index maps transparently. This is done by keeping a list of add, remove and regular string changes. The array starts as the following

## This Project is WIP

- [ ] 100% coverage using Test262 alongside manual tests
- [ ] Fuzzing
- [ ] Performance testing and associated optimization

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
// Changes array becomes ["he", [StringOp.Add, "fo"], [StringOp.Remove, "llo "] "world"]
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
