import { createStringTracker } from '..'
import { getModifiedFromChanges } from './helpers'

function createToUpperCaseTest(str: string) {
  return () => runToUpperCaseTest(str)
}

function runToUpperCaseTest(str: string) {
  const tracker = createStringTracker(str)

  const actualSubstring = str.toUpperCase()
  const trackerSubstring = tracker.toUpperCaseTracker()

  expect(trackerSubstring.get()).toStrictEqual(actualSubstring)
  expect(getModifiedFromChanges(trackerSubstring)).toStrictEqual(actualSubstring)
}

it('should throw when not called on a StringTracker', () => {
  const tracker = createStringTracker('this is my word')
  // @ts-ignore
  expect(() => tracker.toUpperCaseTracker.call('this is my word')).toThrow(TypeError)
})

// S15.5.4.16_A1_T3.js
// S15.5.4.18_A1_T5.js
// S15.5.4.18_A1_T10.js
// S15.5.4.18_A2_T1.js
it('should convert strings to their lowercase equivalents', () => {
  runToUpperCaseTest('bj')
  runToUpperCaseTest('GnulLuNa')
  runToUpperCaseTest('\u0041b')
  runToUpperCaseTest('Hello, WoRlD!')
})

// S15.5.4.16_A1_T4.js
it('should return an empty string when run on an empty string', createToUpperCaseTest(''))

// special_casing.js
it('should convert latin small letter sharp s', createToUpperCaseTest('\u00df'))
it('should convert latin capital letter i with dot above', createToUpperCaseTest('\u0130'))
it('should convert latin small ligature ff', createToUpperCaseTest('\ufb00'))
it('should convert latin small ligature fi', createToUpperCaseTest('\ufb01'))
it('should convert latin small ligature fl', createToUpperCaseTest('\ufb02'))
it('should convert latin small ligature ffi', createToUpperCaseTest('\ufb03'))
it('should convert latin small ligature ffl', createToUpperCaseTest('\ufb04'))
it('should convert latin small ligature long s t', createToUpperCaseTest('\ufb05'))
it('should convert latin small ligature st', createToUpperCaseTest('\ufb06'))
it('should convert armenian small ligature ech yiwn', createToUpperCaseTest('\u0587'))
it('should convert armenian small ligature men now', createToUpperCaseTest('\ufb13'))
it('should convert armenian small ligature men ech', createToUpperCaseTest('\ufb14'))
it('should convert armenian small ligature men ini', createToUpperCaseTest('\ufb15'))
it('should convert armenian small ligature vew now', createToUpperCaseTest('\ufb16'))
it('should convert armenian small ligature men xeh', createToUpperCaseTest('\ufb17'))
it('should convert latin small letter n preceded by apostrophe', createToUpperCaseTest('\u0149'))
it('should convert greek small letter iota with dialytika and tonos', createToUpperCaseTest('\u0390'))
it('should convert greek small letter upsilon with dialytika and tonos', createToUpperCaseTest('\u03b0'))
it('should convert latin small letter j with caron', createToUpperCaseTest('\u01f0'))
it('should convert latin small letter h with line below', createToUpperCaseTest('\u1e96'))
it('should convert latin small letter t with diaeresis', createToUpperCaseTest('\u1e97'))
it('should convert latin small letter w with ring above', createToUpperCaseTest('\u1e98'))
it('should convert latin small letter y with ring above', createToUpperCaseTest('\u1e99'))
it('should convert latin small letter a with right half ring', createToUpperCaseTest('\u1e9a'))
it('should convert greek small letter upsilon with psili', createToUpperCaseTest('\u1f50'))
it('should convert greek small letter upsilon with psili and varia', createToUpperCaseTest('\u1f52'))
it('should convert greek small letter upsilon with psili and oxia', createToUpperCaseTest('\u1f54'))
it('should convert greek small letter upsilon with psili and perispomeni', createToUpperCaseTest('\u1f56'))
it('should convert greek small letter alpha with perispomeni', createToUpperCaseTest('\u1fb6'))
it('should convert greek small letter eta with perispomeni', createToUpperCaseTest('\u1fc6'))
it('should convert greek small letter iota with dialytika and varia', createToUpperCaseTest('\u1fd2'))
it('should convert greek small letter iota with dialytika and oxia', createToUpperCaseTest('\u1fd3'))
it('should convert greek small letter iota with perispomeni', createToUpperCaseTest('\u1fd6'))
it('should convert greek small letter iota with dialytika and perispomeni', createToUpperCaseTest('\u1fd7'))
it('should convert greek small letter upsilon with dialytika and varia', createToUpperCaseTest('\u1fe2'))
it('should convert greek small letter upsilon with dialytika and oxia', createToUpperCaseTest('\u1fe3'))
it('should convert greek small letter rho with psili', createToUpperCaseTest('\u1fe4'))
it('should convert greek small letter upsilon with perispomeni', createToUpperCaseTest('\u1fe6'))
it('should convert greek small letter upsilon with dialytika and perispomeni', createToUpperCaseTest('\u1fe7'))
it('should convert greek small letter omega with perispomeni', createToUpperCaseTest('\u1ff6'))
it('should convert greek small letter alpha with psili and ypogegrammeni', createToUpperCaseTest('\u1f80'))
it('should convert greek small letter alpha with dasia and ypogegrammeni', createToUpperCaseTest('\u1f81'))
it('should convert greek small letter alpha with psili and varia and ypogegrammeni', createToUpperCaseTest('\u1f82'))
it('should convert greek small letter alpha with dasia and varia and ypogegrammeni', createToUpperCaseTest('\u1f83'))
it('should convert greek small letter alpha with psili and oxia and ypogegrammeni', createToUpperCaseTest('\u1f84'))
it('should convert greek small letter alpha with dasia and oxia and ypogegrammeni', createToUpperCaseTest('\u1f85'))
it(
  'should convert greek small letter alpha with psili and perispomeni and ypogegrammeni',
  createToUpperCaseTest('\u1f86')
)
it(
  'should convert greek small letter alpha with dasia and perispomeni and ypogegrammeni',
  createToUpperCaseTest('\u1f87')
)
it('should convert greek capital letter alpha with psili and prosgegrammeni', createToUpperCaseTest('\u1f88'))
it('should convert greek capital letter alpha with dasia and prosgegrammeni', createToUpperCaseTest('\u1f89'))
it(
  'should convert greek capital letter alpha with psili and varia and prosgegrammeni',
  createToUpperCaseTest('\u1f8a')
)
it(
  'should convert greek capital letter alpha with dasia and varia and prosgegrammeni',
  createToUpperCaseTest('\u1f8b')
)
it('should convert greek capital letter alpha with psili and oxia and prosgegrammeni', createToUpperCaseTest('\u1f8c'))
it('should convert greek capital letter alpha with dasia and oxia and prosgegrammeni', createToUpperCaseTest('\u1f8d'))
it(
  'should convert greek capital letter alpha with psili and perispomeni and prosgegrammeni',
  createToUpperCaseTest('\u1f8e')
)
it(
  'should convert greek capital letter alpha with dasia and perispomeni and prosgegrammeni',
  createToUpperCaseTest('\u1f8f')
)
it('should convert greek small letter eta with psili and ypogegrammeni', createToUpperCaseTest('\u1f90'))
it('should convert greek small letter eta with dasia and ypogegrammeni', createToUpperCaseTest('\u1f91'))
it('should convert greek small letter eta with psili and varia and ypogegrammeni', createToUpperCaseTest('\u1f92'))
it('should convert greek small letter eta with dasia and varia and ypogegrammeni', createToUpperCaseTest('\u1f93'))
it('should convert greek small letter eta with psili and oxia and ypogegrammeni', createToUpperCaseTest('\u1f94'))
it('should convert greek small letter eta with dasia and oxia and ypogegrammeni', createToUpperCaseTest('\u1f95'))
it(
  'should convert greek small letter eta with psili and perispomeni and ypogegrammeni',
  createToUpperCaseTest('\u1f96')
)
it(
  'should convert greek small letter eta with dasia and perispomeni and ypogegrammeni',
  createToUpperCaseTest('\u1f97')
)
it('should convert greek capital letter eta with psili and prosgegrammeni', createToUpperCaseTest('\u1f98'))
it('should convert greek capital letter eta with dasia and prosgegrammeni', createToUpperCaseTest('\u1f99'))
it('should convert greek capital letter eta with psili and varia and prosgegrammeni', createToUpperCaseTest('\u1f9a'))
it('should convert greek capital letter eta with dasia and varia and prosgegrammeni', createToUpperCaseTest('\u1f9b'))
it('should convert greek capital letter eta with psili and oxia and prosgegrammeni', createToUpperCaseTest('\u1f9c'))
it('should convert greek capital letter eta with dasia and oxia and prosgegrammeni', createToUpperCaseTest('\u1f9d'))
it(
  'should convert greek capital letter eta with psili and perispomeni and prosgegrammeni',
  createToUpperCaseTest('\u1f9e')
)
it(
  'should convert greek capital letter eta with dasia and perispomeni and prosgegrammeni',
  createToUpperCaseTest('\u1f9f')
)
it('should convert greek small letter omega with psili and ypogegrammeni', createToUpperCaseTest('\u1fa0'))
it('should convert greek small letter omega with dasia and ypogegrammeni', createToUpperCaseTest('\u1fa1'))
it('should convert greek small letter omega with psili and varia and ypogegrammeni', createToUpperCaseTest('\u1fa2'))
it('should convert greek small letter omega with dasia and varia and ypogegrammeni', createToUpperCaseTest('\u1fa3'))
it('should convert greek small letter omega with psili and oxia and ypogegrammeni', createToUpperCaseTest('\u1fa4'))
it('should convert greek small letter omega with dasia and oxia and ypogegrammeni', createToUpperCaseTest('\u1fa5'))
it(
  'should convert greek small letter omega with psili and perispomeni and ypogegrammeni',
  createToUpperCaseTest('\u1fa6')
)
it(
  'should convert greek small letter omega with dasia and perispomeni and ypogegrammeni',
  createToUpperCaseTest('\u1fa7')
)
it('should convert greek capital letter omega with psili and prosgegrammeni', createToUpperCaseTest('\u1fa8'))
it('should convert greek capital letter omega with dasia and prosgegrammeni', createToUpperCaseTest('\u1fa9'))
it(
  'should convert greek capital letter omega with psili and varia and prosgegrammeni',
  createToUpperCaseTest('\u1faa')
)
it(
  'should convert greek capital letter omega with dasia and varia and prosgegrammeni',
  createToUpperCaseTest('\u1fab')
)
it('should convert greek capital letter omega with psili and oxia and prosgegrammeni', createToUpperCaseTest('\u1fac'))
it('should convert greek capital letter omega with dasia and oxia and prosgegrammeni', createToUpperCaseTest('\u1fad'))
it(
  'should convert greek capital letter omega with psili and perispomeni and prosgegrammeni',
  createToUpperCaseTest('\u1fae')
)
it(
  'should convert greek capital letter omega with dasia and perispomeni and prosgegrammeni',
  createToUpperCaseTest('\u1faf')
)
it('should convert greek small letter alpha with ypogegrammeni', createToUpperCaseTest('\u1fb3'))
it('should convert greek capital letter alpha with prosgegrammeni', createToUpperCaseTest('\u1fbc'))
it('should convert greek small letter eta with ypogegrammeni', createToUpperCaseTest('\u1fc3'))
it('should convert greek capital letter eta with prosgegrammeni', createToUpperCaseTest('\u1fcc'))
it('should convert greek small letter omega with ypogegrammeni', createToUpperCaseTest('\u1ff3'))
it('should convert greek capital letter omega with prosgegrammeni', createToUpperCaseTest('\u1ffc'))
it('should convert greek small letter alpha with varia and ypogegrammeni', createToUpperCaseTest('\u1fb2'))
it('should convert greek small letter alpha with oxia and ypogegrammeni', createToUpperCaseTest('\u1fb4'))
it('should convert greek small letter eta with varia and ypogegrammeni', createToUpperCaseTest('\u1fc2'))
it('should convert greek small letter eta with oxia and ypogegrammeni', createToUpperCaseTest('\u1fc4'))
it('should convert greek small letter omega with varia and ypogegrammeni', createToUpperCaseTest('\u1ff2'))
it('should convert greek small letter omega with oxia and ypogegrammeni', createToUpperCaseTest('\u1ff4'))
it('should convert greek small letter alpha with perispomeni and ypogegrammeni', createToUpperCaseTest('\u1fb7'))
it('should convert greek small letter eta with perispomeni and ypogegrammeni', createToUpperCaseTest('\u1fc7'))
it('should convert greek small letter omega with perispomeni and ypogegrammeni', createToUpperCaseTest('\u1ff7'))

// supplementary_plane.js
it('should convert deseret small letter long i', createToUpperCaseTest('\ud801\udc28'))
it('should convert deseret small letter long e', createToUpperCaseTest('\ud801\udc29'))
it('should convert deseret small letter long a', createToUpperCaseTest('\ud801\udc2a'))
it('should convert deseret small letter long ah', createToUpperCaseTest('\ud801\udc2b'))
it('should convert deseret small letter long o', createToUpperCaseTest('\ud801\udc2c'))
it('should convert deseret small letter long oo', createToUpperCaseTest('\ud801\udc2d'))
it('should convert deseret small letter short i', createToUpperCaseTest('\ud801\udc2e'))
it('should convert deseret small letter short e', createToUpperCaseTest('\ud801\udc2f'))
it('should convert deseret small letter short a', createToUpperCaseTest('\ud801\udc30'))
it('should convert deseret small letter short ah', createToUpperCaseTest('\ud801\udc31'))
it('should convert deseret small letter short o', createToUpperCaseTest('\ud801\udc32'))
it('should convert deseret small letter short oo', createToUpperCaseTest('\ud801\udc33'))
it('should convert deseret small letter ay', createToUpperCaseTest('\ud801\udc34'))
it('should convert deseret small letter ow', createToUpperCaseTest('\ud801\udc35'))
it('should convert deseret small letter wu', createToUpperCaseTest('\ud801\udc36'))
it('should convert deseret small letter yee', createToUpperCaseTest('\ud801\udc37'))
it('should convert deseret small letter h', createToUpperCaseTest('\ud801\udc38'))
it('should convert deseret small letter pee', createToUpperCaseTest('\ud801\udc39'))
it('should convert deseret small letter bee', createToUpperCaseTest('\ud801\udc3a'))
it('should convert deseret small letter tee', createToUpperCaseTest('\ud801\udc3b'))
it('should convert deseret small letter dee', createToUpperCaseTest('\ud801\udc3c'))
it('should convert deseret small letter chee', createToUpperCaseTest('\ud801\udc3d'))
it('should convert deseret small letter jee', createToUpperCaseTest('\ud801\udc3e'))
it('should convert deseret small letter kay', createToUpperCaseTest('\ud801\udc3f'))
it('should convert deseret small letter gay', createToUpperCaseTest('\ud801\udc40'))
it('should convert deseret small letter ef', createToUpperCaseTest('\ud801\udc41'))
it('should convert deseret small letter vee', createToUpperCaseTest('\ud801\udc42'))
it('should convert deseret small letter eth', createToUpperCaseTest('\ud801\udc43'))
it('should convert deseret small letter thee', createToUpperCaseTest('\ud801\udc44'))
it('should convert deseret small letter es', createToUpperCaseTest('\ud801\udc45'))
it('should convert deseret small letter zee', createToUpperCaseTest('\ud801\udc46'))
it('should convert deseret small letter esh', createToUpperCaseTest('\ud801\udc47'))
it('should convert deseret small letter zhee', createToUpperCaseTest('\ud801\udc48'))
it('should convert deseret small letter er', createToUpperCaseTest('\ud801\udc49'))
it('should convert deseret small letter el', createToUpperCaseTest('\ud801\udc4a'))
it('should convert deseret small letter em', createToUpperCaseTest('\ud801\udc4b'))
it('should convert deseret small letter en', createToUpperCaseTest('\ud801\udc4c'))
it('should convert deseret small letter eng', createToUpperCaseTest('\ud801\udc4d'))
it('should convert deseret small letter oi', createToUpperCaseTest('\ud801\udc4e'))
it('should convert deseret small letter ew', createToUpperCaseTest('\ud801\udc4f'))
