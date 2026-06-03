import { useFakeAsyncTimers } from "./helpers/useFakeAsyncTimers";
import { throwOnError } from "./helpers/callbackHelpers";

jest
    .dontMock('../src/ArrayBufferFileReader')
    .dontMock('../src/MediaFileReader')
    .dontMock('../src/ChunkedFileData');

var ArrayBufferFileReader = require('../src/ArrayBufferFileReader');

function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

describe("ArrayBufferFileReader", function () {
  useFakeAsyncTimers();
    var fileReader;
    const arrBuffer = str2ab('TEST');

    beforeEach(function() {
        fileReader = new ArrayBufferFileReader(arrBuffer);
    });

    it("should be able to read the right type of files", function() {
        expect(ArrayBufferFileReader.canReadFile(arrBuffer)).toBe(true);
    });

    it("should have the right size information", function() {
        return new Promise(function(resolve, reject) {
            fileReader.init(throwOnError(resolve));
            jest.runAllTimers();
        }).then(function() {
            expect(fileReader.getSize()).toBe(8);
        });
    });

    it("should read a byte", function() {
        return new Promise(function(resolve, reject) {
            fileReader.loadRange([0, 4], throwOnError(resolve));
            jest.runAllTimers();
        }).then(function(tags) {
            expect(fileReader.getByteAt(0)).toBe("T".charCodeAt(0));
        });
    });

});
