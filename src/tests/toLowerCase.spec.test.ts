import { createStringTracker } from '..'
import { getModifiedFromChanges } from './helpers'

function createToLowerCaseTest(str: string) {
  return () => runToLowerCaseTest(str)
}

function runToLowerCaseTest(str: string) {
  const tracker = createStringTracker(str)

  const actualSubstring = str.toLowerCase()
  const trackerSubstring = tracker.toLowerCaseTracker()

  expect(trackerSubstring.get()).toStrictEqual(actualSubstring)
  expect(getModifiedFromChanges(trackerSubstring)).toStrictEqual(actualSubstring)
}

it('should throw when not called on a StringTracker', () => {
  const tracker = createStringTracker('this is my word')
  // @ts-ignore
  expect(() => tracker.toLowerCaseTracker.call('this is my word')).toThrow(TypeError)
})

// S15.5.4.16_A1_T3.js
// S15.5.4.18_A1_T5.js
// S15.5.4.18_A1_T10.js
it('should convert strings to their lowercase equivalents', () => {
  runToLowerCaseTest('BJ')
  runToLowerCaseTest('GnulLuNa')
  runToLowerCaseTest('\u0041B')
  runToLowerCaseTest('Hello, WoRlD!')
})

// S15.5.4.16_A1_T4.js
it('should return an empty string when run on an empty string', createToLowerCaseTest(''))

// special_casing.js
it('should convert latin small letter sharp s', createToLowerCaseTest('\u00df'))
it('should convert latin capital letter i with dot above', createToLowerCaseTest('\u0130'))
it('should convert latin small ligature ff', createToLowerCaseTest('\ufb00'))
it('should convert latin small ligature fi', createToLowerCaseTest('\ufb01'))
it('should convert latin small ligature fl', createToLowerCaseTest('\ufb02'))
it('should convert latin small ligature ffi', createToLowerCaseTest('\ufb03'))
it('should convert latin small ligature ffl', createToLowerCaseTest('\ufb04'))
it('should convert latin small ligature long s t', createToLowerCaseTest('\ufb05'))
it('should convert latin small ligature st', createToLowerCaseTest('\ufb06'))
it('should convert armenian small ligature ech yiwn', createToLowerCaseTest('\u0587'))
it('should convert armenian small ligature men now', createToLowerCaseTest('\ufb13'))
it('should convert armenian small ligature men ech', createToLowerCaseTest('\ufb14'))
it('should convert armenian small ligature men ini', createToLowerCaseTest('\ufb15'))
it('should convert armenian small ligature vew now', createToLowerCaseTest('\ufb16'))
it('should convert armenian small ligature men xeh', createToLowerCaseTest('\ufb17'))
it('should convert latin small letter n preceded by apostrophe', createToLowerCaseTest('\u0149'))
it('should convert greek small letter iota with dialytika and tonos', createToLowerCaseTest('\u0390'))
it('should convert greek small letter upsilon with dialytika and tonos', createToLowerCaseTest('\u03b0'))
it('should convert latin small letter j with caron', createToLowerCaseTest('\u01f0'))
it('should convert latin small letter h with line below', createToLowerCaseTest('\u1e96'))
it('should convert latin small letter t with diaeresis', createToLowerCaseTest('\u1e97'))
it('should convert latin small letter w with ring above', createToLowerCaseTest('\u1e98'))
it('should convert latin small letter y with ring above', createToLowerCaseTest('\u1e99'))
it('should convert latin small letter a with right half ring', createToLowerCaseTest('\u1e9a'))
it('should convert greek small letter upsilon with psili', createToLowerCaseTest('\u1f50'))
it('should convert greek small letter upsilon with psili and varia', createToLowerCaseTest('\u1f52'))
it('should convert greek small letter upsilon with psili and oxia', createToLowerCaseTest('\u1f54'))
it('should convert greek small letter upsilon with psili and perispomeni', createToLowerCaseTest('\u1f56'))
it('should convert greek small letter alpha with perispomeni', createToLowerCaseTest('\u1fb6'))
it('should convert greek small letter eta with perispomeni', createToLowerCaseTest('\u1fc6'))
it('should convert greek small letter iota with dialytika and varia', createToLowerCaseTest('\u1fd2'))
it('should convert greek small letter iota with dialytika and oxia', createToLowerCaseTest('\u1fd3'))
it('should convert greek small letter iota with perispomeni', createToLowerCaseTest('\u1fd6'))
it('should convert greek small letter iota with dialytika and perispomeni', createToLowerCaseTest('\u1fd7'))
it('should convert greek small letter upsilon with dialytika and varia', createToLowerCaseTest('\u1fe2'))
it('should convert greek small letter upsilon with dialytika and oxia', createToLowerCaseTest('\u1fe3'))
it('should convert greek small letter rho with psili', createToLowerCaseTest('\u1fe4'))
it('should convert greek small letter upsilon with perispomeni', createToLowerCaseTest('\u1fe6'))
it('should convert greek small letter upsilon with dialytika and perispomeni', createToLowerCaseTest('\u1fe7'))
it('should convert greek small letter omega with perispomeni', createToLowerCaseTest('\u1ff6'))
it('should convert greek small letter alpha with psili and ypogegrammeni', createToLowerCaseTest('\u1f80'))
it('should convert greek small letter alpha with dasia and ypogegrammeni', createToLowerCaseTest('\u1f81'))
it('should convert greek small letter alpha with psili and varia and ypogegrammeni', createToLowerCaseTest('\u1f82'))
it('should convert greek small letter alpha with dasia and varia and ypogegrammeni', createToLowerCaseTest('\u1f83'))
it('should convert greek small letter alpha with psili and oxia and ypogegrammeni', createToLowerCaseTest('\u1f84'))
it('should convert greek small letter alpha with dasia and oxia and ypogegrammeni', createToLowerCaseTest('\u1f85'))
it(
  'should convert greek small letter alpha with psili and perispomeni and ypogegrammeni',
  createToLowerCaseTest('\u1f86')
)
it(
  'should convert greek small letter alpha with dasia and perispomeni and ypogegrammeni',
  createToLowerCaseTest('\u1f87')
)
it('should convert greek capital letter alpha with psili and prosgegrammeni', createToLowerCaseTest('\u1f88'))
it('should convert greek capital letter alpha with dasia and prosgegrammeni', createToLowerCaseTest('\u1f89'))
it('should convert greek capital letter alpha with psili and varia and prosgegrammeni', createToLowerCaseTest('\u1f8a'))
it('should convert greek capital letter alpha with dasia and varia and prosgegrammeni', createToLowerCaseTest('\u1f8b'))
it('should convert greek capital letter alpha with psili and oxia and prosgegrammeni', createToLowerCaseTest('\u1f8c'))
it('should convert greek capital letter alpha with dasia and oxia and prosgegrammeni', createToLowerCaseTest('\u1f8d'))
it(
  'should convert greek capital letter alpha with psili and perispomeni and prosgegrammeni',
  createToLowerCaseTest('\u1f8e')
)
it(
  'should convert greek capital letter alpha with dasia and perispomeni and prosgegrammeni',
  createToLowerCaseTest('\u1f8f')
)
it('should convert greek small letter eta with psili and ypogegrammeni', createToLowerCaseTest('\u1f90'))
it('should convert greek small letter eta with dasia and ypogegrammeni', createToLowerCaseTest('\u1f91'))
it('should convert greek small letter eta with psili and varia and ypogegrammeni', createToLowerCaseTest('\u1f92'))
it('should convert greek small letter eta with dasia and varia and ypogegrammeni', createToLowerCaseTest('\u1f93'))
it('should convert greek small letter eta with psili and oxia and ypogegrammeni', createToLowerCaseTest('\u1f94'))
it('should convert greek small letter eta with dasia and oxia and ypogegrammeni', createToLowerCaseTest('\u1f95'))
it(
  'should convert greek small letter eta with psili and perispomeni and ypogegrammeni',
  createToLowerCaseTest('\u1f96')
)
it(
  'should convert greek small letter eta with dasia and perispomeni and ypogegrammeni',
  createToLowerCaseTest('\u1f97')
)
it('should convert greek capital letter eta with psili and prosgegrammeni', createToLowerCaseTest('\u1f98'))
it('should convert greek capital letter eta with dasia and prosgegrammeni', createToLowerCaseTest('\u1f99'))
it('should convert greek capital letter eta with psili and varia and prosgegrammeni', createToLowerCaseTest('\u1f9a'))
it('should convert greek capital letter eta with dasia and varia and prosgegrammeni', createToLowerCaseTest('\u1f9b'))
it('should convert greek capital letter eta with psili and oxia and prosgegrammeni', createToLowerCaseTest('\u1f9c'))
it('should convert greek capital letter eta with dasia and oxia and prosgegrammeni', createToLowerCaseTest('\u1f9d'))
it(
  'should convert greek capital letter eta with psili and perispomeni and prosgegrammeni',
  createToLowerCaseTest('\u1f9e')
)
it(
  'should convert greek capital letter eta with dasia and perispomeni and prosgegrammeni',
  createToLowerCaseTest('\u1f9f')
)
it('should convert greek small letter omega with psili and ypogegrammeni', createToLowerCaseTest('\u1fa0'))
it('should convert greek small letter omega with dasia and ypogegrammeni', createToLowerCaseTest('\u1fa1'))
it('should convert greek small letter omega with psili and varia and ypogegrammeni', createToLowerCaseTest('\u1fa2'))
it('should convert greek small letter omega with dasia and varia and ypogegrammeni', createToLowerCaseTest('\u1fa3'))
it('should convert greek small letter omega with psili and oxia and ypogegrammeni', createToLowerCaseTest('\u1fa4'))
it('should convert greek small letter omega with dasia and oxia and ypogegrammeni', createToLowerCaseTest('\u1fa5'))
it(
  'should convert greek small letter omega with psili and perispomeni and ypogegrammeni',
  createToLowerCaseTest('\u1fa6')
)
it(
  'should convert greek small letter omega with dasia and perispomeni and ypogegrammeni',
  createToLowerCaseTest('\u1fa7')
)
it('should convert greek capital letter omega with psili and prosgegrammeni', createToLowerCaseTest('\u1fa8'))
it('should convert greek capital letter omega with dasia and prosgegrammeni', createToLowerCaseTest('\u1fa9'))
it('should convert greek capital letter omega with psili and varia and prosgegrammeni', createToLowerCaseTest('\u1faa'))
it('should convert greek capital letter omega with dasia and varia and prosgegrammeni', createToLowerCaseTest('\u1fab'))
it('should convert greek capital letter omega with psili and oxia and prosgegrammeni', createToLowerCaseTest('\u1fac'))
it('should convert greek capital letter omega with dasia and oxia and prosgegrammeni', createToLowerCaseTest('\u1fad'))
it(
  'should convert greek capital letter omega with psili and perispomeni and prosgegrammeni',
  createToLowerCaseTest('\u1fae')
)
it(
  'should convert greek capital letter omega with dasia and perispomeni and prosgegrammeni',
  createToLowerCaseTest('\u1faf')
)
it('should convert greek small letter alpha with ypogegrammeni', createToLowerCaseTest('\u1fb3'))
it('should convert greek capital letter alpha with prosgegrammeni', createToLowerCaseTest('\u1fbc'))
it('should convert greek small letter eta with ypogegrammeni', createToLowerCaseTest('\u1fc3'))
it('should convert greek capital letter eta with prosgegrammeni', createToLowerCaseTest('\u1fcc'))
it('should convert greek small letter omega with ypogegrammeni', createToLowerCaseTest('\u1ff3'))
it('should convert greek capital letter omega with prosgegrammeni', createToLowerCaseTest('\u1ffc'))
it('should convert greek small letter alpha with varia and ypogegrammeni', createToLowerCaseTest('\u1fb2'))
it('should convert greek small letter alpha with oxia and ypogegrammeni', createToLowerCaseTest('\u1fb4'))
it('should convert greek small letter eta with varia and ypogegrammeni', createToLowerCaseTest('\u1fc2'))
it('should convert greek small letter eta with oxia and ypogegrammeni', createToLowerCaseTest('\u1fc4'))
it('should convert greek small letter omega with varia and ypogegrammeni', createToLowerCaseTest('\u1ff2'))
it('should convert greek small letter omega with oxia and ypogegrammeni', createToLowerCaseTest('\u1ff4'))
it('should convert greek small letter alpha with perispomeni and ypogegrammeni', createToLowerCaseTest('\u1fb7'))
it('should convert greek small letter eta with perispomeni and ypogegrammeni', createToLowerCaseTest('\u1fc7'))
it('should convert greek small letter omega with perispomeni and ypogegrammeni', createToLowerCaseTest('\u1ff7'))

// supplementary_plane.js
it('should convert deseret capital letter long i', createToLowerCaseTest('\ud801\udc00'))
it('should convert deseret capital letter long e', createToLowerCaseTest('\ud801\udc01'))
it('should convert deseret capital letter long a', createToLowerCaseTest('\ud801\udc02'))
it('should convert deseret capital letter long ah', createToLowerCaseTest('\ud801\udc03'))
it('should convert deseret capital letter long o', createToLowerCaseTest('\ud801\udc04'))
it('should convert deseret capital letter long oo', createToLowerCaseTest('\ud801\udc05'))
it('should convert deseret capital letter short i', createToLowerCaseTest('\ud801\udc06'))
it('should convert deseret capital letter short e', createToLowerCaseTest('\ud801\udc07'))
it('should convert deseret capital letter short a', createToLowerCaseTest('\ud801\udc08'))
it('should convert deseret capital letter short ah', createToLowerCaseTest('\ud801\udc09'))
it('should convert deseret capital letter short o', createToLowerCaseTest('\ud801\udc0a'))
it('should convert deseret capital letter short oo', createToLowerCaseTest('\ud801\udc0b'))
it('should convert deseret capital letter ay', createToLowerCaseTest('\ud801\udc0c'))
it('should convert deseret capital letter ow', createToLowerCaseTest('\ud801\udc0d'))
it('should convert deseret capital letter wu', createToLowerCaseTest('\ud801\udc0e'))
it('should convert deseret capital letter yee', createToLowerCaseTest('\ud801\udc0f'))
it('should convert deseret capital letter h', createToLowerCaseTest('\ud801\udc10'))
it('should convert deseret capital letter pee', createToLowerCaseTest('\ud801\udc11'))
it('should convert deseret capital letter bee', createToLowerCaseTest('\ud801\udc12'))
it('should convert deseret capital letter tee', createToLowerCaseTest('\ud801\udc13'))
it('should convert deseret capital letter dee', createToLowerCaseTest('\ud801\udc14'))
it('should convert deseret capital letter chee', createToLowerCaseTest('\ud801\udc15'))
it('should convert deseret capital letter jee', createToLowerCaseTest('\ud801\udc16'))
it('should convert deseret capital letter kay', createToLowerCaseTest('\ud801\udc17'))
it('should convert deseret capital letter gay', createToLowerCaseTest('\ud801\udc18'))
it('should convert deseret capital letter ef', createToLowerCaseTest('\ud801\udc19'))
it('should convert deseret capital letter vee', createToLowerCaseTest('\ud801\udc1a'))
it('should convert deseret capital letter eth', createToLowerCaseTest('\ud801\udc1b'))
it('should convert deseret capital letter thee', createToLowerCaseTest('\ud801\udc1c'))
it('should convert deseret capital letter es', createToLowerCaseTest('\ud801\udc1d'))
it('should convert deseret capital letter zee', createToLowerCaseTest('\ud801\udc1e'))
it('should convert deseret capital letter esh', createToLowerCaseTest('\ud801\udc1f'))
it('should convert deseret capital letter zhee', createToLowerCaseTest('\ud801\udc20'))
it('should convert deseret capital letter er', createToLowerCaseTest('\ud801\udc21'))
it('should convert deseret capital letter el', createToLowerCaseTest('\ud801\udc22'))
it('should convert deseret capital letter em', createToLowerCaseTest('\ud801\udc23'))
it('should convert deseret capital letter en', createToLowerCaseTest('\ud801\udc24'))
it('should convert deseret capital letter eng', createToLowerCaseTest('\ud801\udc25'))
it('should convert deseret capital letter oi', createToLowerCaseTest('\ud801\udc26'))
it('should convert deseret capital letter ew', createToLowerCaseTest('\ud801\udc27'))

// Final_Sigma_U180E.js
it(
  'should convert sigma preceded by latin capital letter a, mongolian vowel separator',
  createToLowerCaseTest('A\u180E\u03A3')
)
it(
  'should convert sigma preceded by latin capital letter a, mongolian vowel separator, followed by latin capital letter b',
  createToLowerCaseTest('A\u180E\u03A3B')
)
it(
  'should convert sigma preceded by latin capital letter a, followed by mongolian vowel separator',
  createToLowerCaseTest('A\u03A3\u180E')
)
it(
  'should convert sigma preceded by latin capital letter a, followed by mongolian vowel separator, latin capital letter b',
  createToLowerCaseTest('A\u03A3\u180EB')
)
it(
  'should convert sigma preceded by latin capital letter a, mongolian vowel separator, followed by mongolian vowel separator',
  createToLowerCaseTest('A\u180E\u03A3\u180E')
)
it(
  'should convert sigma preceded by latin capital letter a, mongolian vowel separator, followed by mongolian vowel separator, latin capital letter b',
  createToLowerCaseTest('A\u180E\u03A3\u180EB')
)
