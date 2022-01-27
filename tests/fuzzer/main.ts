import { createStringTracker, StringOp, StringTracker } from '../../src'
import { objects, predicates } from 'friendly-words'
import {
  getModifiedFromChanges,
  getOriginalFromChanges,
  validateChangeCleanliness,
  validateChunksCharCount,
  validateChunkSizes,
} from '../helpers'
import { strictEqual, ok } from 'assert'
import chalk from 'chalk'

const logWithHeader = (header: string, ...body: any[]) => {
  for (const line of [chalk.bold(header), ...body]) console.log(line)
}

export function logTracker(tracker: StringTracker) {
  logWithHeader('Original', tracker.getOriginal())
  logWithHeader('Modified', tracker.get())
  logWithHeader('Changes', tracker.getChanges())
  const chunks = tracker.getChangeChunks()
  for (const index in chunks) {
    logWithHeader(`Chunk ${index}`, `Char Count: ${chunks[index][0]}`, `Changes`, chunks[index][1])
  }
}

// TODO: Use validateChanges function from helpers?

const randBool = () => Math.random() > 0.5
const randRange = (end: number, start: number = 0) => Math.floor(Math.random() * (end - start)) + start

const getRandomWord = () => {
  const arr = randBool() ? objects : predicates
  return arr[Math.floor(arr.length * Math.random())]
}
const generateString = (numOfWords: number) => new Array(numOfWords).fill(0).map(getRandomWord).join(' ')

type Operation =
  | {
      name: StringOp.Add
      start: number
      text: string
    }
  | {
      name: StringOp.Remove
      start: number
      end: number
    }

function applyOperation(tracker: StringTracker, op: Operation) {
  if (op.name === StringOp.Add) return tracker.add(op.start, op.text)
  return tracker.remove(op.start, op.end)
}

function mimicOperation(string: string, op: Operation) {
  if (op.name === StringOp.Add) return string.slice(0, op.start) + op.text + string.slice(op.start)
  return string.slice(0, op.start) + string.slice(op.end)
}

function createRunner(numOfWords: number, numOfIterations: number) {
  console.log(
    `\n${chalk.green.bold('Running iteration!')} numOfWords - ${numOfWords} ; numOfIterations - ${numOfIterations}`
  )
  const originalString = generateString(numOfWords)
  let modifiedString = originalString
  console.log(`Original String: ${originalString}`)

  /**
   * tracker[i] + operation[i] = tracker[i + 1]
   *
   * tracker[0] + operation[0] = tracker[1]
   * tracker[1] + operation[1] = tracker[2]
   * ...
   */
  const trackers: StringTracker[] = [createStringTracker(originalString)]
  const operations: Operation[] = []

  for (let i = 0; i < numOfIterations; i++) {
    const startingTracker = trackers.at(-1)!
    const startingTrackerLength = startingTracker.get().length

    // Generate random operation
    const opName = randBool() ? StringOp.Add : StringOp.Remove
    const start = randRange(startingTrackerLength + 1)
    if (opName === StringOp.Add) {
      operations.push({ name: opName, start, text: generateString(randRange(4)) })
    } else {
      operations.push({ name: opName, start, end: randRange(startingTrackerLength, start) })
    }

    // Apply operation to tracker and add to array
    const operation = operations.at(-1)!
    trackers.push(applyOperation(startingTracker, operation))
    const tracker = trackers.at(-1)!
    // Apply operation to modifiedString so we can verify it was applied correctly
    modifiedString = mimicOperation(modifiedString, operation)

    // Assert the correctness of the tracker
    try {
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
    } catch (err) {
      console.log(chalk.bold.red(`Failed on iteration #${i}\n`))
      console.log(chalk.bold('-------- Before --------'))
      logTracker(startingTracker)
      console.log(chalk.bold('\n--------- After --------'))
      logTracker(tracker)
      console.log(chalk.bold('\n---------- Op ----------'))
      console.log(`Type: ${operation.name === StringOp.Add ? 'Add' : 'Remove'}`)
      console.log(`Start: ${operation.start}`)
      if (operation.name === StringOp.Add) console.log(`Text: ${operation.text}`)
      else console.log(`End: ${operation.end}`)
      console.log()

      throw err
    }
  }
}

const NUM_OF_ITERATIONS = 5000
let i = 0
while (i < NUM_OF_ITERATIONS) {
  createRunner(randRange(64, 1), randRange(512))
  i++
}

console.log(`\n${chalk.green.bold(`Fuzzer completed ${NUM_OF_ITERATIONS} iterations successfully!`)}`)
