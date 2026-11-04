export {}; // TS module scope (avoids global const clashes with other tests)

jest.autoMockOff();

const WebMTagReader = require('../src/WebMTagReader');
const ArrayFileReader = require('../src/ArrayFileReader');

describe('WebMTagReader', function () {
  it('detects EBML header', function () {
    expect(WebMTagReader.canReadTagFormat([0x1a, 0x45, 0xdf, 0xa3])).toBe(true);
    expect(WebMTagReader.canReadTagFormat([0x49, 0x44, 0x33, 0x04])).toBe(false);
  });

  it('parses SimpleTags from a minimal Segment', function () {
    // Build a tiny EBML+Segment with Tags / SimpleTag TITLE=Hello
    // Using hand-built bytes for TagName/TagString under SimpleTag under Tags under Segment.
    const
      // Helper to encode EBML element: id bytes + size vint + data
      u8 = (...bytes: number[]) => bytes,
      // 1-byte vint for sizes < 127: 0x80 | size
      size1 = (n: number) => 0x80 | n,
      // TagName "TITLE" = 0x45A3
      tagName = u8(0x45, 0xa3, size1(5), ...'TITLE'.split('').map((c) => c.charCodeAt(0))),
      // TagString "Hi" = 0x4487
      tagString = u8(0x44, 0x87, size1(2), ...'Hi'.split('').map((c) => c.charCodeAt(0))),
      simpleInner = [...tagName, ...tagString],
      // SimpleTag 0x67C8
      simpleTag = u8(0x67, 0xc8, size1(simpleInner.length), ...simpleInner),
      // Tag 0x7373
      tag = u8(0x73, 0x73, size1(simpleTag.length), ...simpleTag),
      // Tags 0x1254C367
      tagsHeader = u8(0x12, 0x54, 0xc3, 0x67, size1(tag.length), ...tag),
      // Segment 0x18538067 — unknown size often used; use known size
      segment = u8(0x18, 0x53, 0x80, 0x67, size1(tagsHeader.length), ...tagsHeader),
      // EBML header stub 0x1A45DFA3 with DocType webm
      docType = u8(0x42, 0x82, size1(4), ...'webm'.split('').map((c) => c.charCodeAt(0))),
      ebml = u8(0x1a, 0x45, 0xdf, 0xa3, size1(docType.length), ...docType),
      fileData = [...ebml, ...segment],
      reader = new ArrayFileReader(fileData),
      tagReader = new WebMTagReader(reader);

    return new Promise<void>((resolve, reject) => {
      tagReader.read({
        onSuccess: (result: any) => {
          try {
            expect(result.type).toBe('WebM');
            expect(result.tags.TITLE.data).toBe('Hi');
            expect(result.tags.title).toBe('Hi');
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        onError: reject
      });
    });
  });
});
