/** @jest-environment jsdom */

import { useFakeAsyncTimers } from "./helpers/useFakeAsyncTimers";
import { throwOnError } from "./helpers/callbackHelpers";

jest
  .dontMock('../src/BlobFileReader')
  .dontMock('../src/MediaFileReader')
  .dontMock('../src/ChunkedFileData');

var BlobFileReader = require('../src/BlobFileReader');

describe("BlobFileReader", function () {
  useFakeAsyncTimers();
  var fileReader;

  beforeEach(function() {
    fileReader = new BlobFileReader(new Blob(["This is a simple file"]));
  });

  it("should be able to read the right type of files", function() {
    expect(BlobFileReader.canReadFile("fakefile")).toBe(false);
    expect(BlobFileReader.canReadFile("http://localhost")).toBe(false);
    expect(BlobFileReader.canReadFile(new Blob())).toBe(true);
  });

  it("should have the right size information", function() {
    return new Promise(function(resolve, reject) {
      fileReader.init(throwOnError(resolve));
      jest.runAllTimers();
    }).then(function() {
      expect(fileReader.getSize()).toBe(21);
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

  it("should read a byte after loading the same range twice", function() {
    return new Promise(function(resolve, reject) {
      fileReader.loadRange([0, 4], throwOnError(function() {
        fileReader.loadRange([0, 4], throwOnError(resolve));
      }));
    }).then(function(tags) {
      expect(fileReader.getByteAt(0)).toBe("T".charCodeAt(0));
    });
  });

  it("should not read a byte that hasn't been loaded yet", function() {
    return new Promise(function(resolve, reject) {
      fileReader.init(throwOnError(resolve));
      jest.runAllTimers();
    }).then(function(tags) {
      expect(function() {
        var byte0 = fileReader.getByteAt(0);
      }).toThrow();
    });
  });
});
