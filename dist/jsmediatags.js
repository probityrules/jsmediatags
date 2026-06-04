"use strict";
var jsmediatags = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/StringUtils.ts
  var require_StringUtils = __commonJS({
    "src/StringUtils.ts"(exports, module) {
      "use strict";
      var InternalDecodedString = class {
        constructor(value, bytesReadCount) {
          this._value = value;
          this.bytesReadCount = bytesReadCount;
          this.length = value.length;
        }
        toString() {
          return this._value;
        }
      };
      var StringUtils = {
        readUTF16String: function(bytes, bigEndian, maxBytes) {
          let ix = 0;
          let offset1 = 1, offset2 = 0;
          maxBytes = Math.min(maxBytes || bytes.length, bytes.length);
          if (bytes[0] == 254 && bytes[1] == 255) {
            bigEndian = true;
            ix = 2;
          } else if (bytes[0] == 255 && bytes[1] == 254) {
            bigEndian = false;
            ix = 2;
          }
          if (bigEndian) {
            offset1 = 0;
            offset2 = 1;
          }
          const arr = [];
          for (let j = 0; ix < maxBytes; j++) {
            const byte1 = bytes[ix + offset1];
            const byte2 = bytes[ix + offset2];
            const word1 = (byte1 << 8) + byte2;
            ix += 2;
            if (word1 == 0) {
              break;
            } else if (byte1 < 216 || byte1 >= 224) {
              arr[j] = String.fromCharCode(word1);
            } else {
              const byte3 = bytes[ix + offset1];
              const byte4 = bytes[ix + offset2];
              const word2 = (byte3 << 8) + byte4;
              ix += 2;
              arr[j] = String.fromCharCode(word1, word2);
            }
          }
          return new InternalDecodedString(arr.join(""), ix);
        },
        readUTF8String: function(bytes, maxBytes) {
          let ix = 0;
          maxBytes = Math.min(maxBytes || bytes.length, bytes.length);
          if (bytes[0] == 239 && bytes[1] == 187 && bytes[2] == 191) {
            ix = 3;
          }
          const arr = [];
          for (let j = 0; ix < maxBytes; j++) {
            const byte1 = bytes[ix++];
            if (byte1 == 0) {
              break;
            } else if (byte1 < 128) {
              arr[j] = String.fromCharCode(byte1);
            } else if (byte1 >= 194 && byte1 < 224) {
              const byte2 = bytes[ix++];
              arr[j] = String.fromCharCode(((byte1 & 31) << 6) + (byte2 & 63));
            } else if (byte1 >= 224 && byte1 < 240) {
              const byte2 = bytes[ix++];
              const byte3 = bytes[ix++];
              arr[j] = String.fromCharCode(
                ((byte1 & 255) << 12) + ((byte2 & 63) << 6) + (byte3 & 63)
              );
            } else if (byte1 >= 240 && byte1 < 245) {
              const byte2 = bytes[ix++];
              const byte3 = bytes[ix++];
              const byte4 = bytes[ix++];
              const codepoint = ((byte1 & 7) << 18) + ((byte2 & 63) << 12) + ((byte3 & 63) << 6) + (byte4 & 63) - 65536;
              arr[j] = String.fromCharCode(
                (codepoint >> 10) + 55296,
                (codepoint & 1023) + 56320
              );
            }
          }
          return new InternalDecodedString(arr.join(""), ix);
        },
        readNullTerminatedString: function(bytes, maxBytes) {
          const arr = [];
          maxBytes = maxBytes || bytes.length;
          for (var i = 0; i < maxBytes; ) {
            var byte1 = bytes[i++];
            if (byte1 == 0) {
              break;
            }
            arr[i - 1] = String.fromCharCode(byte1);
          }
          return new InternalDecodedString(arr.join(""), i);
        }
      };
      module.exports = StringUtils;
    }
  });

  // src/MediaFileReader.ts
  var require_MediaFileReader = __commonJS({
    "src/MediaFileReader.ts"(exports, module) {
      "use strict";
      var StringUtils = require_StringUtils();
      var MediaFileReader = class {
        constructor(_path) {
          this._isInitialized = false;
          this._size = 0;
        }
        /**
         * Decides if this media file reader is able to read the given file.
         */
        static canReadFile(_file) {
          throw new Error("Must implement canReadFile function");
        }
        /**
         * This function needs to be called before any other function.
         * Loads the necessary initial information from the file.
         */
        init(callbacks) {
          const self2 = this;
          if (this._isInitialized) {
            setTimeout(callbacks.onSuccess, 1);
          } else {
            this._init({
              onSuccess: function() {
                self2._isInitialized = true;
                callbacks.onSuccess();
              },
              onError: callbacks.onError
            });
          }
        }
        _init(callbacks) {
          throw new Error("Must implement init function");
        }
        /**
         * @param range The start and end indexes of the range to load.
         *        Ex: [0, 7] load bytes 0 to 7 inclusive.
         */
        loadRange(range, callbacks) {
          throw new Error("Must implement loadRange function");
        }
        /**
         * @return The size of the file in bytes.
         */
        getSize() {
          if (!this._isInitialized) {
            throw new Error("init() must be called first.");
          }
          return this._size;
        }
        getByteAt(offset) {
          throw new Error("Must implement getByteAt function");
        }
        getBytesAt(offset, length) {
          const bytes = new Array(length);
          for (let i = 0; i < length; i++) {
            bytes[i] = this.getByteAt(offset + i);
          }
          return bytes;
        }
        isBitSetAt(offset, bit) {
          const iByte = this.getByteAt(offset);
          return (iByte & 1 << bit) != 0;
        }
        getSByteAt(offset) {
          const iByte = this.getByteAt(offset);
          if (iByte > 127) {
            return iByte - 256;
          } else {
            return iByte;
          }
        }
        getShortAt(offset, isBigEndian) {
          let iShort = isBigEndian ? (this.getByteAt(offset) << 8) + this.getByteAt(offset + 1) : (this.getByteAt(offset + 1) << 8) + this.getByteAt(offset);
          if (iShort < 0) {
            iShort += 65536;
          }
          return iShort;
        }
        getSShortAt(offset, isBigEndian) {
          const iUShort = this.getShortAt(offset, isBigEndian);
          if (iUShort > 32767) {
            return iUShort - 65536;
          } else {
            return iUShort;
          }
        }
        getLongAt(offset, isBigEndian) {
          const iByte1 = this.getByteAt(offset), iByte2 = this.getByteAt(offset + 1), iByte3 = this.getByteAt(offset + 2), iByte4 = this.getByteAt(offset + 3);
          let iLong = isBigEndian ? (((iByte1 << 8) + iByte2 << 8) + iByte3 << 8) + iByte4 : (((iByte4 << 8) + iByte3 << 8) + iByte2 << 8) + iByte1;
          if (iLong < 0) {
            iLong += 4294967296;
          }
          return iLong;
        }
        getSLongAt(offset, isBigEndian) {
          const iULong = this.getLongAt(offset, isBigEndian);
          if (iULong > 2147483647) {
            return iULong - 4294967296;
          } else {
            return iULong;
          }
        }
        getInteger24At(offset, isBigEndian) {
          const iByte1 = this.getByteAt(offset), iByte2 = this.getByteAt(offset + 1), iByte3 = this.getByteAt(offset + 2);
          let iInteger = isBigEndian ? ((iByte1 << 8) + iByte2 << 8) + iByte3 : ((iByte3 << 8) + iByte2 << 8) + iByte1;
          if (iInteger < 0) {
            iInteger += 16777216;
          }
          return iInteger;
        }
        getStringAt(offset, length) {
          const string = [];
          for (let i = offset, j = 0; i < offset + length; i++, j++) {
            string[j] = String.fromCharCode(this.getByteAt(i));
          }
          return string.join("");
        }
        getStringWithCharsetAt(offset, length, charset) {
          const bytes = this.getBytesAt(offset, length);
          let string;
          switch ((charset || "").toLowerCase()) {
            case "utf-16":
            case "utf-16le":
            case "utf-16be":
              string = StringUtils.readUTF16String(bytes, charset === "utf-16be");
              break;
            case "utf-8":
              string = StringUtils.readUTF8String(bytes);
              break;
            default:
              string = StringUtils.readNullTerminatedString(bytes);
              break;
          }
          return string;
        }
        getCharAt(offset) {
          return String.fromCharCode(this.getByteAt(offset));
        }
        /**
         * The ID3v2 tag/frame size is encoded with four bytes where the most
         * significant bit (bit 7) is set to zero in every byte, making a total of 28
         * bits. The zeroed bits are ignored, so a 257 bytes long tag is represented
         * as $00 00 02 01.
         */
        getSynchsafeInteger32At(offset) {
          const size1 = this.getByteAt(offset);
          const size2 = this.getByteAt(offset + 1);
          const size3 = this.getByteAt(offset + 2);
          const size4 = this.getByteAt(offset + 3);
          const size = size4 & 127 | (size3 & 127) << 7 | (size2 & 127) << 14 | (size1 & 127) << 21;
          return size;
        }
      };
      module.exports = MediaFileReader;
    }
  });

  // src/ChunkedFileData.ts
  var require_ChunkedFileData = __commonJS({
    "src/ChunkedFileData.ts"(exports, module) {
      "use strict";
      var NOT_FOUND = -1;
      function dataLength(data) {
        return data.length;
      }
      function isUint8(data) {
        return data instanceof Uint8Array;
      }
      var ChunkedFileData = class {
        static get NOT_FOUND() {
          return NOT_FOUND;
        }
        constructor() {
          this._fileData = [];
        }
        /**
         * Adds data to the file storage at a specific offset.
         */
        addData(offset, data) {
          const offsetEnd = offset + dataLength(data) - 1;
          const chunkRange = this._getChunkRange(offset, offsetEnd);
          if (chunkRange.startIx === NOT_FOUND) {
            this._fileData.splice(chunkRange.insertIx || 0, 0, {
              offset,
              data
            });
          } else {
            const firstChunk = this._fileData[chunkRange.startIx];
            const lastChunk = this._fileData[chunkRange.endIx];
            const needsPrepend = offset > firstChunk.offset;
            const needsAppend = offsetEnd < lastChunk.offset + dataLength(lastChunk.data) - 1;
            let chunk = {
              offset: Math.min(offset, firstChunk.offset),
              data
            };
            if (needsPrepend) {
              const slicedData = this._sliceData(
                firstChunk.data,
                0,
                offset - firstChunk.offset
              );
              chunk.data = this._concatData(slicedData, data);
            }
            if (needsAppend) {
              const slicedData = this._sliceData(
                chunk.data,
                0,
                lastChunk.offset - chunk.offset
              );
              chunk.data = this._concatData(slicedData, lastChunk.data);
            }
            this._fileData.splice(
              chunkRange.startIx,
              chunkRange.endIx - chunkRange.startIx + 1,
              chunk
            );
          }
        }
        _concatData(dataA, dataB) {
          if (isUint8(dataA) && isUint8(dataB)) {
            const Ctor = dataA.constructor;
            const dataAandB = new Ctor(dataA.length + dataB.length);
            dataAandB.set(dataA, 0);
            dataAandB.set(dataB, dataA.length);
            return dataAandB;
          }
          if (Array.isArray(dataA) && Array.isArray(dataB)) {
            return dataA.concat(dataB);
          }
          const sA = typeof dataA === "string" ? dataA : "";
          const sB = typeof dataB === "string" ? dataB : "";
          return sA + sB;
        }
        _sliceData(data, begin, end) {
          if (typeof data === "string") {
            return data.slice(begin, end);
          }
          if (Array.isArray(data)) {
            return data.slice(begin, end);
          }
          const view = data;
          if (typeof view.subarray === "function") {
            return view.subarray(begin, end);
          }
          return view.slice(begin, end);
        }
        /**
         * Finds the chunk range that overlaps the [offsetStart-1,offsetEnd+1] range.
         * When a chunk is adjacent to the offset we still consider it part of the
         * range (this is the situation of offsetStart-1 or offsetEnd+1).
         * When no chunks are found `insertIx` denotes the index where the data
         * should be inserted in the data list (startIx == NOT_FOUND and endIX ==
         * NOT_FOUND).
         */
        _getChunkRange(offsetStart, offsetEnd) {
          let startChunkIx = NOT_FOUND;
          let endChunkIx = NOT_FOUND;
          let insertIx = 0;
          for (let i = 0; i < this._fileData.length; i++, insertIx = i) {
            const chunkOffsetStart = this._fileData[i].offset;
            const chunkOffsetEnd = chunkOffsetStart + dataLength(this._fileData[i].data);
            if (offsetEnd < chunkOffsetStart - 1) {
              break;
            }
            if (offsetStart <= chunkOffsetEnd + 1 && offsetEnd >= chunkOffsetStart - 1) {
              startChunkIx = i;
              break;
            }
          }
          if (startChunkIx === NOT_FOUND) {
            return {
              startIx: NOT_FOUND,
              endIx: NOT_FOUND,
              insertIx
            };
          }
          for (let i = startChunkIx; i < this._fileData.length; i++) {
            const chunkOffsetStart = this._fileData[i].offset;
            const chunkOffsetEnd = chunkOffsetStart + dataLength(this._fileData[i].data);
            if (offsetEnd >= chunkOffsetStart - 1) {
              endChunkIx = i;
            }
            if (offsetEnd <= chunkOffsetEnd + 1) {
              break;
            }
          }
          if (endChunkIx === NOT_FOUND) {
            endChunkIx = startChunkIx;
          }
          return {
            startIx: startChunkIx,
            endIx: endChunkIx
          };
        }
        hasDataRange(offsetStart, offsetEnd) {
          for (let i = 0; i < this._fileData.length; i++) {
            const chunk = this._fileData[i];
            if (offsetEnd < chunk.offset) {
              return false;
            }
            if (offsetStart >= chunk.offset && offsetEnd < chunk.offset + dataLength(chunk.data)) {
              return true;
            }
          }
          return false;
        }
        getByteAt(offset) {
          let dataChunk;
          for (let i = 0; i < this._fileData.length; i++) {
            const dataChunkStart = this._fileData[i].offset;
            const dataChunkEnd = dataChunkStart + dataLength(this._fileData[i].data) - 1;
            if (offset >= dataChunkStart && offset <= dataChunkEnd) {
              dataChunk = this._fileData[i];
              break;
            }
          }
          if (dataChunk) {
            const idx = offset - dataChunk.offset;
            const d = dataChunk.data;
            if (typeof d === "string") {
              return d.charCodeAt(idx) & 255;
            }
            if (Array.isArray(d)) {
              return d[idx];
            }
            return d[idx];
          }
          throw new Error("Offset " + offset + " hasn't been loaded yet.");
        }
      };
      module.exports = ChunkedFileData;
    }
  });

  // xhr2-browser-stub:xhr2-browser-stub
  var require_xhr2_browser_stub = __commonJS({
    "xhr2-browser-stub:xhr2-browser-stub"(exports, module) {
      module.exports = { XMLHttpRequest: globalThis.XMLHttpRequest };
    }
  });

  // src/XhrFileReader.ts
  var require_XhrFileReader = __commonJS({
    "src/XhrFileReader.ts"(exports, module) {
      "use strict";
      var ChunkedFileData = require_ChunkedFileData();
      var MediaFileReader = require_MediaFileReader();
      var CHUNK_SIZE = 1024;
      var _XhrFileReader = class _XhrFileReader extends MediaFileReader {
        constructor(url) {
          super();
          this._url = url;
          this._fileData = new ChunkedFileData();
        }
        static canReadFile(file) {
          return typeof file === "string" && /^[a-z]+:\/\//i.test(file);
        }
        static setConfig(config) {
          for (const key in config) {
            if (Object.prototype.hasOwnProperty.call(config, key)) {
              _XhrFileReader._config[key] = config[key];
            }
          }
          const disallowedXhrHeaders = _XhrFileReader._config.disallowedXhrHeaders;
          for (let i = 0; i < disallowedXhrHeaders.length; i++) {
            disallowedXhrHeaders[i] = disallowedXhrHeaders[i].toLowerCase();
          }
        }
        _init(callbacks) {
          if (_XhrFileReader._config.avoidHeadRequests) {
            this._fetchSizeWithGetRequest(callbacks);
          } else {
            this._fetchSizeWithHeadRequest(callbacks);
          }
        }
        _fetchSizeWithHeadRequest(callbacks) {
          const self2 = this;
          this._makeXHRRequest("HEAD", null, {
            onSuccess: function(xhr) {
              const contentLength = self2._parseContentLength(xhr);
              if (contentLength) {
                self2._size = contentLength;
                callbacks.onSuccess();
              } else {
                self2._fetchSizeWithGetRequest(callbacks);
              }
            },
            onError: callbacks.onError
          });
        }
        _fetchSizeWithGetRequest(callbacks) {
          const self2 = this;
          const range = this._roundRangeToChunkMultiple([0, 0]);
          this._makeXHRRequest("GET", range, {
            onSuccess: function(xhr) {
              const contentRange = self2._parseContentRange(xhr);
              const data = self2._getXhrResponseContent(xhr);
              if (contentRange) {
                if (contentRange.instanceLength == null) {
                  self2._fetchEntireFile(callbacks);
                  return;
                }
                self2._size = contentRange.instanceLength;
              } else {
                self2._size = data.length;
              }
              self2._fileData.addData(0, data);
              callbacks.onSuccess();
            },
            onError: callbacks.onError
          });
        }
        _fetchEntireFile(callbacks) {
          const self2 = this;
          this._makeXHRRequest("GET", null, {
            onSuccess: function(xhr) {
              const data = self2._getXhrResponseContent(xhr);
              self2._size = data.length;
              self2._fileData.addData(0, data);
              callbacks.onSuccess();
            },
            onError: callbacks.onError
          });
        }
        _getXhrResponseContent(xhr) {
          const legacy = xhr;
          return legacy.responseBody || xhr.responseText || "";
        }
        _parseContentLength(xhr) {
          const contentLength = this._getResponseHeader(xhr, "Content-Length");
          if (contentLength == null) {
            return null;
          }
          return parseInt(contentLength, 10);
        }
        _parseContentRange(xhr) {
          const contentRange = this._getResponseHeader(xhr, "Content-Range");
          if (contentRange) {
            const parsedContentRange = contentRange.match(
              /bytes (\d+)-(\d+)\/(?:(\d+)|\*)/i
            );
            if (!parsedContentRange) {
              throw new Error(
                "FIXME: Unknown Content-Range syntax: " + contentRange
              );
            }
            return {
              firstBytePosition: parseInt(parsedContentRange[1], 10),
              lastBytePosition: parseInt(parsedContentRange[2], 10),
              instanceLength: parsedContentRange[3] ? parseInt(parsedContentRange[3], 10) : null
            };
          } else {
            return null;
          }
        }
        loadRange(range, callbacks) {
          const self2 = this;
          if (self2._fileData.hasDataRange(
            range[0],
            Math.min(self2._size, range[1])
          )) {
            setTimeout(callbacks.onSuccess, 1);
            return;
          }
          range = this._roundRangeToChunkMultiple(range);
          range[1] = Math.min(self2._size, range[1]);
          this._makeXHRRequest("GET", range, {
            onSuccess: function(xhr) {
              const data = self2._getXhrResponseContent(xhr);
              self2._fileData.addData(range[0], data);
              callbacks.onSuccess();
            },
            onError: callbacks.onError
          });
        }
        _roundRangeToChunkMultiple(range) {
          const length = range[1] - range[0] + 1;
          const newLength = Math.ceil(length / CHUNK_SIZE) * CHUNK_SIZE;
          return [range[0], range[0] + newLength - 1];
        }
        _makeXHRRequest(method, range, callbacks) {
          const xhr = this._createXHRObject();
          xhr.open(method, this._url);
          const onXHRLoad = function() {
            if (xhr.status === 200 || xhr.status === 206) {
              callbacks.onSuccess(xhr);
            } else if (callbacks.onError) {
              callbacks.onError({
                type: "xhr",
                info: "Unexpected HTTP status " + xhr.status + ".",
                xhr
              });
            }
          };
          if (typeof xhr.onload !== "undefined") {
            xhr.onload = onXHRLoad;
            xhr.onerror = function() {
              if (callbacks.onError) {
                callbacks.onError({
                  type: "xhr",
                  info: "Generic XHR error, check xhr object.",
                  xhr
                });
              }
            };
          } else {
            xhr.onreadystatechange = function() {
              if (xhr.readyState === 4) {
                onXHRLoad();
              }
            };
          }
          if (_XhrFileReader._config.timeoutInSec) {
            xhr.timeout = _XhrFileReader._config.timeoutInSec * 1e3;
            xhr.ontimeout = function() {
              if (callbacks.onError) {
                callbacks.onError({
                  type: "xhr",
                  info: "Timeout after " + xhr.timeout / 1e3 + "s. Use jsmediatags.Config.setXhrTimeout to override.",
                  xhr
                });
              }
            };
          }
          xhr.overrideMimeType("text/plain; charset=x-user-defined");
          if (range) {
            this._setRequestHeader(
              xhr,
              "Range",
              "bytes=" + range[0] + "-" + range[1]
            );
          }
          this._setRequestHeader(
            xhr,
            "If-Modified-Since",
            "Sat, 01 Jan 1970 00:00:00 GMT"
          );
          xhr.send(null);
        }
        _setRequestHeader(xhr, headerName, headerValue) {
          if (_XhrFileReader._config.disallowedXhrHeaders.indexOf(
            headerName.toLowerCase()
          ) < 0) {
            xhr.setRequestHeader(headerName, headerValue);
          }
        }
        _hasResponseHeader(xhr, headerName) {
          const allResponseHeaders = xhr.getAllResponseHeaders();
          if (!allResponseHeaders) {
            return false;
          }
          const headers = allResponseHeaders.split("\r\n");
          const headerNames = [];
          for (let i = 0; i < headers.length; i++) {
            headerNames[i] = headers[i].split(":")[0].toLowerCase();
          }
          return headerNames.indexOf(headerName.toLowerCase()) >= 0;
        }
        _getResponseHeader(xhr, headerName) {
          if (!this._hasResponseHeader(xhr, headerName)) {
            return null;
          }
          return xhr.getResponseHeader(headerName);
        }
        getByteAt(offset) {
          return this._fileData.getByteAt(offset) & 255;
        }
        _isWebWorker() {
          return typeof WorkerGlobalScope !== "undefined" && typeof self !== "undefined" && self instanceof WorkerGlobalScope;
        }
        _createXHRObject() {
          if (typeof window === "undefined" && !this._isWebWorker()) {
            const xhr2 = require_xhr2_browser_stub();
            return new xhr2.XMLHttpRequest();
          }
          if (typeof XMLHttpRequest !== "undefined") {
            return new XMLHttpRequest();
          }
          throw new Error("XMLHttpRequest is not supported");
        }
      };
      _XhrFileReader._config = {
        avoidHeadRequests: false,
        disallowedXhrHeaders: [],
        timeoutInSec: 30
      };
      var XhrFileReader = _XhrFileReader;
      module.exports = XhrFileReader;
    }
  });

  // src/BlobFileReader.ts
  var require_BlobFileReader = __commonJS({
    "src/BlobFileReader.ts"(exports, module) {
      "use strict";
      var ChunkedFileData = require_ChunkedFileData();
      var MediaFileReader = require_MediaFileReader();
      var BlobFileReader = class extends MediaFileReader {
        constructor(blob) {
          super();
          this._blob = blob;
          this._fileData = new ChunkedFileData();
        }
        static canReadFile(file) {
          return typeof Blob !== "undefined" && file instanceof Blob || typeof File !== "undefined" && file instanceof File;
        }
        _init(callbacks) {
          this._size = this._blob.size;
          setTimeout(callbacks.onSuccess, 1);
        }
        loadRange(range, callbacks) {
          const self2 = this;
          const blobSlice = this._blob.slice || this._blob.mozSlice || this._blob.webkitSlice;
          const blob = blobSlice.call(this._blob, range[0], range[1] + 1);
          const browserFileReader = new FileReader();
          browserFileReader.onloadend = function() {
            const result = browserFileReader.result;
            const intArray = new Uint8Array(result);
            self2._fileData.addData(range[0], intArray);
            callbacks.onSuccess();
          };
          browserFileReader.onerror = browserFileReader.onabort = function() {
            if (callbacks.onError) {
              callbacks.onError({
                type: "blob",
                info: browserFileReader.error
              });
            }
          };
          browserFileReader.readAsArrayBuffer(blob);
        }
        getByteAt(offset) {
          return this._fileData.getByteAt(offset);
        }
      };
      module.exports = BlobFileReader;
    }
  });

  // src/ArrayFileReader.ts
  var require_ArrayFileReader = __commonJS({
    "src/ArrayFileReader.ts"(exports, module) {
      "use strict";
      var MediaFileReader = require_MediaFileReader();
      var ArrayFileReader = class extends MediaFileReader {
        constructor(array) {
          super();
          this._array = array;
          this._size = array.length;
          this._isInitialized = true;
        }
        static canReadFile(file) {
          return Array.isArray(file) || typeof Buffer === "function" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(file);
        }
        init(callbacks) {
          setTimeout(callbacks.onSuccess, 0);
        }
        loadRange(range, callbacks) {
          void range;
          setTimeout(callbacks.onSuccess, 0);
        }
        getByteAt(offset) {
          if (offset >= this._array.length) {
            throw new Error("Offset " + offset + " hasn't been loaded yet.");
          }
          return this._array[offset];
        }
      };
      module.exports = ArrayFileReader;
    }
  });

  // src/MediaTagReader.ts
  var require_MediaTagReader = __commonJS({
    "src/MediaTagReader.ts"(exports, module) {
      "use strict";
      var MediaFileReader = require_MediaFileReader();
      var MediaTagReader = class {
        constructor(mediaFileReader) {
          this._mediaFileReader = mediaFileReader;
          this._tags = null;
        }
        static getTagIdentifierByteRange() {
          throw new Error("Must implement");
        }
        static canReadTagFormat(_tagIdentifier) {
          throw new Error("Must implement");
        }
        setTagsToRead(tags) {
          this._tags = tags;
          return this;
        }
        read(callbacks) {
          if (callbacks === void 0) {
            return new Promise((resolve, reject) => {
              this.read({ onSuccess: resolve, onError: reject });
            });
          }
          const self2 = this;
          this._mediaFileReader.init({
            onSuccess: function() {
              self2._loadData(self2._mediaFileReader, {
                onSuccess: function() {
                  let tags;
                  try {
                    tags = self2._parseData(self2._mediaFileReader, self2._tags);
                  } catch (ex) {
                    const err = ex;
                    if (callbacks.onError) {
                      callbacks.onError({
                        type: "parseData",
                        info: err.message
                      });
                    }
                    return;
                  }
                  callbacks.onSuccess(tags);
                },
                onError: callbacks.onError
              });
            },
            onError: callbacks.onError
          });
        }
        readAsync() {
          return this.read();
        }
        getShortcuts() {
          return {};
        }
        _loadData(_mediaFileReader, _callbacks) {
          throw new Error("Must implement _loadData function");
        }
        _parseData(_mediaFileReader, _tags) {
          throw new Error("Must implement _parseData function");
        }
        _expandShortcutTags(tagsWithShortcuts) {
          if (!tagsWithShortcuts) {
            return null;
          }
          let tags = [];
          const shortcuts = this.getShortcuts();
          for (let i = 0, tagOrShortcut; tagOrShortcut = tagsWithShortcuts[i]; i++) {
            tags = tags.concat(
              shortcuts[tagOrShortcut] || [tagOrShortcut]
            );
          }
          return tags;
        }
      };
      module.exports = MediaTagReader;
    }
  });

  // src/ID3v1TagReader.ts
  var require_ID3v1TagReader = __commonJS({
    "src/ID3v1TagReader.ts"(exports, module) {
      "use strict";
      var MediaTagReader = require_MediaTagReader();
      var MediaFileReader = require_MediaFileReader();
      var ID3v1TagReader = class extends MediaTagReader {
        static getTagIdentifierByteRange() {
          return {
            offset: -128,
            length: 128
          };
        }
        static canReadTagFormat(tagIdentifier) {
          const id = String.fromCharCode.apply(String, tagIdentifier.slice(0, 3));
          return id === "TAG";
        }
        _loadData(mediaFileReader, callbacks) {
          const fileSize = mediaFileReader.getSize();
          mediaFileReader.loadRange([fileSize - 128, fileSize - 1], callbacks);
        }
        _parseData(data, tags) {
          const offset = data.getSize() - 128;
          const title = data.getStringWithCharsetAt(offset + 3, 30).toString();
          const artist = data.getStringWithCharsetAt(offset + 33, 30).toString();
          const album = data.getStringWithCharsetAt(offset + 63, 30).toString();
          const year = data.getStringWithCharsetAt(offset + 93, 4).toString();
          const trackFlag = data.getByteAt(offset + 97 + 28);
          let track = data.getByteAt(offset + 97 + 29);
          let version;
          let comment;
          if (trackFlag == 0 && track != 0) {
            version = "1.1";
            comment = data.getStringWithCharsetAt(offset + 97, 28).toString();
          } else {
            version = "1.0";
            comment = data.getStringWithCharsetAt(offset + 97, 30).toString();
            track = 0;
          }
          const genreIdx = data.getByteAt(offset + 97 + 30);
          const genre = genreIdx < 255 ? GENRES[genreIdx] : "";
          const tag = {
            type: "ID3",
            version,
            tags: __spreadValues({
              title,
              artist,
              album,
              year,
              comment,
              genre
            }, track ? { track } : {})
          };
          return tag;
        }
      };
      var GENRES = [
        "Blues",
        "Classic Rock",
        "Country",
        "Dance",
        "Disco",
        "Funk",
        "Grunge",
        "Hip-Hop",
        "Jazz",
        "Metal",
        "New Age",
        "Oldies",
        "Other",
        "Pop",
        "R&B",
        "Rap",
        "Reggae",
        "Rock",
        "Techno",
        "Industrial",
        "Alternative",
        "Ska",
        "Death Metal",
        "Pranks",
        "Soundtrack",
        "Euro-Techno",
        "Ambient",
        "Trip-Hop",
        "Vocal",
        "Jazz+Funk",
        "Fusion",
        "Trance",
        "Classical",
        "Instrumental",
        "Acid",
        "House",
        "Game",
        "Sound Clip",
        "Gospel",
        "Noise",
        "AlternRock",
        "Bass",
        "Soul",
        "Punk",
        "Space",
        "Meditative",
        "Instrumental Pop",
        "Instrumental Rock",
        "Ethnic",
        "Gothic",
        "Darkwave",
        "Techno-Industrial",
        "Electronic",
        "Pop-Folk",
        "Eurodance",
        "Dream",
        "Southern Rock",
        "Comedy",
        "Cult",
        "Gangsta",
        "Top 40",
        "Christian Rap",
        "Pop/Funk",
        "Jungle",
        "Native American",
        "Cabaret",
        "New Wave",
        "Psychadelic",
        "Rave",
        "Showtunes",
        "Trailer",
        "Lo-Fi",
        "Tribal",
        "Acid Punk",
        "Acid Jazz",
        "Polka",
        "Retro",
        "Musical",
        "Rock & Roll",
        "Hard Rock",
        "Folk",
        "Folk-Rock",
        "National Folk",
        "Swing",
        "Fast Fusion",
        "Bebob",
        "Latin",
        "Revival",
        "Celtic",
        "Bluegrass",
        "Avantgarde",
        "Gothic Rock",
        "Progressive Rock",
        "Psychedelic Rock",
        "Symphonic Rock",
        "Slow Rock",
        "Big Band",
        "Chorus",
        "Easy Listening",
        "Acoustic",
        "Humour",
        "Speech",
        "Chanson",
        "Opera",
        "Chamber Music",
        "Sonata",
        "Symphony",
        "Booty Bass",
        "Primus",
        "Porn Groove",
        "Satire",
        "Slow Jam",
        "Club",
        "Tango",
        "Samba",
        "Folklore",
        "Ballad",
        "Power Ballad",
        "Rhythmic Soul",
        "Freestyle",
        "Duet",
        "Punk Rock",
        "Drum Solo",
        "Acapella",
        "Euro-House",
        "Dance Hall"
      ];
      module.exports = ID3v1TagReader;
    }
  });

  // src/ID3v2FrameReader.ts
  var require_ID3v2FrameReader = __commonJS({
    "src/ID3v2FrameReader.ts"(exports, module) {
      "use strict";
      var MediaFileReader = require_MediaFileReader();
      var StringUtils = require_StringUtils();
      var ArrayFileReader = require_ArrayFileReader();
      var FRAME_DESCRIPTIONS = {
        // v2.2
        "BUF": "Recommended buffer size",
        "CNT": "Play counter",
        "COM": "Comments",
        "CRA": "Audio encryption",
        "CRM": "Encrypted meta frame",
        "ETC": "Event timing codes",
        "EQU": "Equalization",
        "GEO": "General encapsulated object",
        "IPL": "Involved people list",
        "LNK": "Linked information",
        "MCI": "Music CD Identifier",
        "MLL": "MPEG location lookup table",
        "PIC": "Attached picture",
        "POP": "Popularimeter",
        "REV": "Reverb",
        "RVA": "Relative volume adjustment",
        "SLT": "Synchronized lyric/text",
        "STC": "Synced tempo codes",
        "TAL": "Album/Movie/Show title",
        "TBP": "BPM (Beats Per Minute)",
        "TCM": "Composer",
        "TCO": "Content type",
        "TCR": "Copyright message",
        "TDA": "Date",
        "TDY": "Playlist delay",
        "TEN": "Encoded by",
        "TFT": "File type",
        "TIM": "Time",
        "TKE": "Initial key",
        "TLA": "Language(s)",
        "TLE": "Length",
        "TMT": "Media type",
        "TOA": "Original artist(s)/performer(s)",
        "TOF": "Original filename",
        "TOL": "Original Lyricist(s)/text writer(s)",
        "TOR": "Original release year",
        "TOT": "Original album/Movie/Show title",
        "TP1": "Lead artist(s)/Lead performer(s)/Soloist(s)/Performing group",
        "TP2": "Band/Orchestra/Accompaniment",
        "TP3": "Conductor/Performer refinement",
        "TP4": "Interpreted, remixed, or otherwise modified by",
        "TPA": "Part of a set",
        "TPB": "Publisher",
        "TRC": "ISRC (International Standard Recording Code)",
        "TRD": "Recording dates",
        "TRK": "Track number/Position in set",
        "TSI": "Size",
        "TSS": "Software/hardware and settings used for encoding",
        "TT1": "Content group description",
        "TT2": "Title/Songname/Content description",
        "TT3": "Subtitle/Description refinement",
        "TXT": "Lyricist/text writer",
        "TXX": "User defined text information frame",
        "TYE": "Year",
        "UFI": "Unique file identifier",
        "ULT": "Unsychronized lyric/text transcription",
        "WAF": "Official audio file webpage",
        "WAR": "Official artist/performer webpage",
        "WAS": "Official audio source webpage",
        "WCM": "Commercial information",
        "WCP": "Copyright/Legal information",
        "WPB": "Publishers official webpage",
        "WXX": "User defined URL link frame",
        // v2.3
        "AENC": "Audio encryption",
        "APIC": "Attached picture",
        "ASPI": "Audio seek point index",
        "CHAP": "Chapter",
        "CTOC": "Table of contents",
        "COMM": "Comments",
        "COMR": "Commercial frame",
        "ENCR": "Encryption method registration",
        "EQU2": "Equalisation (2)",
        "EQUA": "Equalization",
        "ETCO": "Event timing codes",
        "GEOB": "General encapsulated object",
        "GRID": "Group identification registration",
        "IPLS": "Involved people list",
        "LINK": "Linked information",
        "MCDI": "Music CD identifier",
        "MLLT": "MPEG location lookup table",
        "OWNE": "Ownership frame",
        "PRIV": "Private frame",
        "PCNT": "Play counter",
        "POPM": "Popularimeter",
        "POSS": "Position synchronisation frame",
        "RBUF": "Recommended buffer size",
        "RVA2": "Relative volume adjustment (2)",
        "RVAD": "Relative volume adjustment",
        "RVRB": "Reverb",
        "SEEK": "Seek frame",
        "SYLT": "Synchronized lyric/text",
        "SYTC": "Synchronized tempo codes",
        "TALB": "Album/Movie/Show title",
        "TBPM": "BPM (beats per minute)",
        "TCOM": "Composer",
        "TCON": "Content type",
        "TCOP": "Copyright message",
        "TDAT": "Date",
        "TDLY": "Playlist delay",
        "TDRC": "Recording time",
        "TDRL": "Release time",
        "TDTG": "Tagging time",
        "TENC": "Encoded by",
        "TEXT": "Lyricist/Text writer",
        "TFLT": "File type",
        "TIME": "Time",
        "TIPL": "Involved people list",
        "TIT1": "Content group description",
        "TIT2": "Title/songname/content description",
        "TIT3": "Subtitle/Description refinement",
        "TKEY": "Initial key",
        "TLAN": "Language(s)",
        "TLEN": "Length",
        "TMCL": "Musician credits list",
        "TMED": "Media type",
        "TMOO": "Mood",
        "TOAL": "Original album/movie/show title",
        "TOFN": "Original filename",
        "TOLY": "Original lyricist(s)/text writer(s)",
        "TOPE": "Original artist(s)/performer(s)",
        "TORY": "Original release year",
        "TOWN": "File owner/licensee",
        "TPE1": "Lead performer(s)/Soloist(s)",
        "TPE2": "Band/orchestra/accompaniment",
        "TPE3": "Conductor/performer refinement",
        "TPE4": "Interpreted, remixed, or otherwise modified by",
        "TPOS": "Part of a set",
        "TPRO": "Produced notice",
        "TPUB": "Publisher",
        "TRCK": "Track number/Position in set",
        "TRDA": "Recording dates",
        "TRSN": "Internet radio station name",
        "TRSO": "Internet radio station owner",
        "TSOA": "Album sort order",
        "TSOP": "Performer sort order",
        "TSOT": "Title sort order",
        "TSIZ": "Size",
        "TSRC": "ISRC (international standard recording code)",
        "TSSE": "Software/Hardware and settings used for encoding",
        "TSST": "Set subtitle",
        "TYER": "Year",
        "TXXX": "User defined text information frame",
        "UFID": "Unique file identifier",
        "USER": "Terms of use",
        "USLT": "Unsychronized lyric/text transcription",
        "WCOM": "Commercial information",
        "WCOP": "Copyright/Legal information",
        "WOAF": "Official audio file webpage",
        "WOAR": "Official artist/performer webpage",
        "WOAS": "Official audio source webpage",
        "WORS": "Official internet radio station homepage",
        "WPAY": "Payment",
        "WPUB": "Publishers official webpage",
        "WXXX": "User defined URL link frame"
      };
      var ID3v2FrameReader = class _ID3v2FrameReader {
        static getFrameReaderFunction(frameId) {
          var _a, _b, _c;
          if (frameId in frameReaderFunctions) {
            return (_a = frameReaderFunctions[frameId]) != null ? _a : null;
          } else if (frameId[0] === "T") {
            return (_b = frameReaderFunctions["T*"]) != null ? _b : null;
          } else if (frameId[0] === "W") {
            return (_c = frameReaderFunctions["W*"]) != null ? _c : null;
          } else {
            return null;
          }
        }
        /**
         * All the frames consists of a frame header followed by one or more fields
         * containing the actual information.
         * The frame ID made out of the characters capital A-Z and 0-9. Identifiers
         * beginning with "X", "Y" and "Z" are for experimental use and free for
         * everyone to use, without the need to set the experimental bit in the tag
         * header. Have in mind that someone else might have used the same identifier
         * as you. All other identifiers are either used or reserved for future use.
         * The frame ID is followed by a size descriptor, making a total header size
         * of ten bytes in every frame. The size is calculated as frame size excluding
         * frame header (frame size - 10).
         */
        static readFrames(offset, end, data, id3header, tags) {
          const frames = {};
          var frameHeaderSize = this._getFrameHeaderSize(id3header);
          while (
            // we should be able to read at least the frame header
            offset < end - frameHeaderSize
          ) {
            var header = this._readFrameHeader(data, offset, id3header);
            var frameId = header.id;
            if (!frameId) {
              break;
            }
            var flags = header.flags;
            var frameSize = header.size;
            var frameDataOffset = offset + header.headerSize;
            var frameData = data;
            offset += header.headerSize + header.size;
            if (tags && tags.indexOf(frameId) === -1) {
              continue;
            }
            if (frameId === "MP3e" || frameId === "\0MP3" || frameId === "\0\0MP" || frameId === " MP3") {
              break;
            }
            if (flags && flags.format.unsynchronisation && !id3header.flags.unsynchronisation) {
              frameData = this.getUnsyncFileReader(frameData, frameDataOffset, frameSize);
              frameDataOffset = 0;
              frameSize = frameData.getSize();
            }
            if (flags && flags.format.data_length_indicator) {
              frameDataOffset += 4;
              frameSize -= 4;
            }
            var readFrameFunc = _ID3v2FrameReader.getFrameReaderFunction(frameId);
            var parsedData = readFrameFunc ? readFrameFunc.apply(this, [
              frameDataOffset,
              frameSize,
              frameData,
              flags != null ? flags : null,
              id3header
            ]) : null;
            var desc = this._getFrameDescription(frameId);
            var frame = {
              id: frameId,
              size: frameSize,
              description: desc,
              data: parsedData
            };
            if (frameId in frames) {
              const existing = frames[frameId];
              if (existing && !Array.isArray(existing) && existing.id) {
                frames[frameId] = [existing];
              }
              frames[frameId].push(frame);
            } else {
              frames[frameId] = frame;
            }
          }
          return frames;
        }
        static _getFrameHeaderSize(id3header) {
          var major = id3header.major;
          if (major == 2) {
            return 6;
          } else if (major == 3 || major == 4) {
            return 10;
          } else {
            return 0;
          }
        }
        static _readFrameHeader(data, offset, id3header) {
          var major = id3header.major;
          var flags = null;
          var frameHeaderSize = this._getFrameHeaderSize(id3header);
          let frameId = "";
          let frameSize = 0;
          switch (major) {
            case 2:
              frameId = data.getStringAt(offset, 3);
              frameSize = data.getInteger24At(offset + 3, true);
              break;
            case 3:
              frameId = data.getStringAt(offset, 4);
              frameSize = data.getLongAt(offset + 4, true);
              break;
            case 4:
              frameId = data.getStringAt(offset, 4);
              frameSize = data.getSynchsafeInteger32At(offset + 4);
              break;
          }
          if (frameId == String.fromCharCode(0, 0, 0) || frameId == String.fromCharCode(0, 0, 0, 0)) {
            frameId = "";
          }
          if (frameId) {
            if (major > 2) {
              flags = this._readFrameFlags(data, offset + 8);
            }
          }
          return {
            "id": frameId || "",
            "size": frameSize || 0,
            "headerSize": frameHeaderSize || 0,
            "flags": flags
          };
        }
        static _readFrameFlags(data, offset) {
          return {
            message: {
              tag_alter_preservation: data.isBitSetAt(offset, 6),
              file_alter_preservation: data.isBitSetAt(offset, 5),
              read_only: data.isBitSetAt(offset, 4)
            },
            format: {
              grouping_identity: data.isBitSetAt(offset + 1, 7),
              compression: data.isBitSetAt(offset + 1, 3),
              encryption: data.isBitSetAt(offset + 1, 2),
              unsynchronisation: data.isBitSetAt(offset + 1, 1),
              data_length_indicator: data.isBitSetAt(offset + 1, 0)
            }
          };
        }
        static _getFrameDescription(frameId) {
          if (frameId in FRAME_DESCRIPTIONS) {
            return FRAME_DESCRIPTIONS[frameId];
          } else {
            return "Unknown";
          }
        }
        static getUnsyncFileReader(data, offset, size) {
          var frameData = data.getBytesAt(offset, size);
          for (var i = 0; i < frameData.length - 1; i++) {
            if (frameData[i] === 255 && frameData[i + 1] === 0) {
              frameData.splice(i + 1, 1);
            }
          }
          return new ArrayFileReader(frameData);
        }
      };
      var frameReaderFunctions = {};
      frameReaderFunctions["APIC"] = function readPictureFrame(offset, length, data, flags, id3header) {
        var start = offset;
        var charset = getTextEncoding(data.getByteAt(offset));
        let format;
        switch (id3header && id3header.major) {
          case 2:
            format = data.getStringAt(offset + 1, 3);
            offset += 4;
            break;
          case 3:
          case 4: {
            const fmt = data.getStringWithCharsetAt(offset + 1, length - 1);
            format = fmt.toString();
            offset += 1 + fmt.bytesReadCount;
            break;
          }
          default:
            throw new Error("Couldn't read ID3v2 major version.");
        }
        var bite = data.getByteAt(offset);
        var type = PICTURE_TYPE[bite];
        var desc = data.getStringWithCharsetAt(offset + 1, length - (offset - start) - 1, charset);
        offset += 1 + desc.bytesReadCount;
        return {
          "format": format,
          "type": type,
          "description": desc.toString(),
          "data": data.getBytesAt(offset, start + length - offset)
        };
      };
      frameReaderFunctions["CHAP"] = function readChapterFrame(offset, length, data, flags, id3header) {
        var originalOffset = offset;
        var result = {};
        var id = StringUtils.readNullTerminatedString(data.getBytesAt(offset, length));
        result.id = id.toString();
        offset += id.bytesReadCount;
        result.startTime = data.getLongAt(offset, true);
        offset += 4;
        result.endTime = data.getLongAt(offset, true);
        offset += 4;
        result.startOffset = data.getLongAt(offset, true);
        offset += 4;
        result.endOffset = data.getLongAt(offset, true);
        offset += 4;
        var remainingLength = length - (offset - originalOffset);
        result.subFrames = ID3v2FrameReader.readFrames(
          offset,
          offset + remainingLength,
          data,
          id3header,
          void 0
        );
        return result;
      };
      frameReaderFunctions["CTOC"] = function readTableOfContentsFrame(offset, length, data, flags, id3header) {
        var originalOffset = offset;
        var result = {
          childElementIds: []
        };
        var id = StringUtils.readNullTerminatedString(data.getBytesAt(offset, length));
        result.id = id.toString();
        offset += id.bytesReadCount;
        result.topLevel = data.isBitSetAt(offset, 1);
        result.ordered = data.isBitSetAt(offset, 0);
        offset++;
        result.entryCount = data.getByteAt(offset);
        offset++;
        const entryCount = result.entryCount;
        for (var i = 0; i < entryCount; i++) {
          var childId = StringUtils.readNullTerminatedString(data.getBytesAt(offset, length - (offset - originalOffset)));
          result.childElementIds.push(childId.toString());
          offset += childId.bytesReadCount;
        }
        var remainingLength = length - (offset - originalOffset);
        result.subFrames = ID3v2FrameReader.readFrames(
          offset,
          offset + remainingLength,
          data,
          id3header,
          void 0
        );
        return result;
      };
      frameReaderFunctions["COMM"] = function readCommentsFrame(offset, length, data, flags, id3header) {
        var start = offset;
        var charset = getTextEncoding(data.getByteAt(offset));
        var language = data.getStringAt(offset + 1, 3);
        var shortdesc = data.getStringWithCharsetAt(offset + 4, length - 4, charset);
        offset += 4 + shortdesc.bytesReadCount;
        var text = data.getStringWithCharsetAt(offset, start + length - offset, charset);
        return {
          language,
          short_description: shortdesc.toString(),
          text: text.toString()
        };
      };
      frameReaderFunctions["COM"] = frameReaderFunctions["COMM"];
      frameReaderFunctions["PIC"] = function(offset, length, data, flags, id3header) {
        return frameReaderFunctions["APIC"](offset, length, data, flags, id3header);
      };
      frameReaderFunctions["PCNT"] = function readCounterFrame(offset, length, data, flags, id3header) {
        return data.getLongAt(offset, false);
      };
      frameReaderFunctions["CNT"] = frameReaderFunctions["PCNT"];
      frameReaderFunctions["SYLT"] = function readSynchronizedLyricsFrame(offset, length, data, flags, id3header) {
        var start = offset;
        var contentTypes = ["other", "lyrics", "transcription", "movement", "events", "chord", "trivia"];
        var timeStampFormats = ["unset", "frames", "milliseconds"];
        var charset = getTextEncoding(data.getByteAt(offset));
        offset += 1;
        var language = data.getStringAt(offset, 3);
        offset += 3;
        var timeStampFormat = timeStampFormats[data.getByteAt(offset)];
        offset += 1;
        var contentType = contentTypes[data.getByteAt(offset)];
        offset += 1;
        var descriptor = data.getStringWithCharsetAt(offset, length + start - offset, charset);
        offset += descriptor.bytesReadCount;
        var synchronisedText = [];
        while (offset < length + start) {
          const line = data.getStringWithCharsetAt(offset, length + start - offset, charset);
          offset += line.bytesReadCount;
          synchronisedText.push({
            text: line.toString(),
            timeStamp: data.getLongAt(offset, true)
          });
          offset += 4;
        }
        return {
          language,
          timeStampFormat,
          contentType,
          descriptor: descriptor.toString(),
          synchronisedText
        };
      };
      frameReaderFunctions["T*"] = function readTextFrame(offset, length, data, flags, id3header) {
        var charset = getTextEncoding(data.getByteAt(offset));
        return data.getStringWithCharsetAt(offset + 1, length - 1, charset).toString();
      };
      frameReaderFunctions["TXXX"] = function readTextFrame(offset, length, data, flags, id3header) {
        var charset = getTextEncoding(data.getByteAt(offset));
        return getUserDefinedFields(offset, length, data, charset);
      };
      frameReaderFunctions["WXXX"] = function readUrlFrame(offset, length, data, flags, id3header) {
        if (length === 0) {
          return null;
        }
        var charset = getTextEncoding(data.getByteAt(offset));
        return getUserDefinedFields(offset, length, data, charset);
      };
      frameReaderFunctions["W*"] = function readUrlFrame(offset, length, data, flags, id3header) {
        if (length === 0) {
          return null;
        }
        return data.getStringWithCharsetAt(offset, length, "iso-8859-1").toString();
      };
      frameReaderFunctions["TCON"] = function readGenreFrame(offset, length, data, flags) {
        const fn = frameReaderFunctions["T*"];
        var text = fn.apply(this, arguments);
        return text.replace(/^\(\d+\)/, "");
      };
      frameReaderFunctions["TCO"] = frameReaderFunctions["TCON"];
      frameReaderFunctions["USLT"] = function readLyricsFrame(offset, length, data, flags, id3header) {
        var start = offset;
        var charset = getTextEncoding(data.getByteAt(offset));
        var language = data.getStringAt(offset + 1, 3);
        var descriptor = data.getStringWithCharsetAt(offset + 4, length - 4, charset);
        offset += 4 + descriptor.bytesReadCount;
        var lyrics = data.getStringWithCharsetAt(offset, start + length - offset, charset);
        return {
          language,
          descriptor: descriptor.toString(),
          lyrics: lyrics.toString()
        };
      };
      frameReaderFunctions["ULT"] = frameReaderFunctions["USLT"];
      frameReaderFunctions["UFID"] = function readLyricsFrame(offset, length, data, flags, id3header) {
        var ownerIdentifier = StringUtils.readNullTerminatedString(data.getBytesAt(offset, length));
        offset += ownerIdentifier.bytesReadCount;
        var identifier = data.getBytesAt(
          offset,
          length - ownerIdentifier.bytesReadCount
        );
        return {
          ownerIdentifier: ownerIdentifier.toString(),
          identifier
        };
      };
      function getTextEncoding(bite) {
        var charset;
        switch (bite) {
          case 0:
            charset = "iso-8859-1";
            break;
          case 1:
            charset = "utf-16";
            break;
          case 2:
            charset = "utf-16be";
            break;
          case 3:
            charset = "utf-8";
            break;
          default:
            charset = "iso-8859-1";
        }
        return charset;
      }
      function getUserDefinedFields(offset, length, data, charset) {
        var userDesc = data.getStringWithCharsetAt(offset + 1, length - 1, charset);
        var userDefinedData = data.getStringWithCharsetAt(offset + 1 + userDesc.bytesReadCount, length - 1 - userDesc.bytesReadCount, charset);
        return {
          user_description: userDesc.toString(),
          data: userDefinedData.toString()
        };
      }
      var PICTURE_TYPE = [
        "Other",
        "32x32 pixels 'file icon' (PNG only)",
        "Other file icon",
        "Cover (front)",
        "Cover (back)",
        "Leaflet page",
        "Media (e.g. label side of CD)",
        "Lead artist/lead performer/soloist",
        "Artist/performer",
        "Conductor",
        "Band/Orchestra",
        "Composer",
        "Lyricist/text writer",
        "Recording Location",
        "During recording",
        "During performance",
        "Movie/video screen capture",
        "A bright coloured fish",
        "Illustration",
        "Band/artist logotype",
        "Publisher/Studio logotype"
      ];
      module.exports = ID3v2FrameReader;
    }
  });

  // src/ID3v2TagReader.ts
  var require_ID3v2TagReader = __commonJS({
    "src/ID3v2TagReader.ts"(exports, module) {
      "use strict";
      var MediaTagReader = require_MediaTagReader();
      var MediaFileReader = require_MediaFileReader();
      var ID3v2FrameReader = require_ID3v2FrameReader();
      var ID3_HEADER_SIZE = 10;
      var ID3v2TagReader = class extends MediaTagReader {
        static getTagIdentifierByteRange() {
          return {
            offset: 0,
            length: ID3_HEADER_SIZE
          };
        }
        static canReadTagFormat(tagIdentifier) {
          const id = String.fromCharCode.apply(String, tagIdentifier.slice(0, 3));
          return id === "ID3";
        }
        _loadData(mediaFileReader, callbacks) {
          mediaFileReader.loadRange([6, 9], {
            onSuccess: function() {
              mediaFileReader.loadRange(
                [
                  0,
                  ID3_HEADER_SIZE + mediaFileReader.getSynchsafeInteger32At(6) - 1
                ],
                callbacks
              );
            },
            onError: callbacks.onError
          });
        }
        _parseData(data, tags) {
          let offset = 0;
          const major = data.getByteAt(offset + 3);
          if (major > 4) {
            return { type: "ID3", tags: { version: ">2.4" } };
          }
          const revision = data.getByteAt(offset + 4);
          const unsynch = data.isBitSetAt(offset + 5, 7);
          const xheader = data.isBitSetAt(offset + 5, 6);
          const xindicator = data.isBitSetAt(offset + 5, 5);
          const size = data.getSynchsafeInteger32At(offset + 6);
          offset += 10;
          if (xheader) {
            if (major === 4) {
              const xheadersize = data.getSynchsafeInteger32At(offset);
              offset += xheadersize;
            } else {
              const xheadersize = data.getLongAt(offset, true);
              offset += xheadersize + 4;
            }
          }
          const id3 = {
            type: "ID3",
            version: "2." + major + "." + revision,
            major,
            revision,
            flags: {
              unsynchronisation: unsynch,
              extended_header: xheader,
              experimental_indicator: xindicator,
              footer_present: false
            },
            size,
            tags: {}
          };
          let expandedTags;
          if (tags) {
            expandedTags = this._expandShortcutTags(tags);
          }
          let offsetEnd = size + 10;
          let reader = data;
          if (id3.flags.unsynchronisation) {
            reader = ID3v2FrameReader.getUnsyncFileReader(reader, offset, size);
            offset = 0;
            offsetEnd = reader.getSize();
          }
          const frames = ID3v2FrameReader.readFrames(
            offset,
            offsetEnd,
            reader,
            id3,
            expandedTags != null ? expandedTags : void 0
          );
          for (const name in SHORTCUTS) {
            if (SHORTCUTS.hasOwnProperty(name)) {
              const frameData = this._getFrameData(frames, SHORTCUTS[name]);
              if (frameData) {
                id3.tags[name] = frameData;
              }
            }
          }
          for (const frame in frames) {
            if (frames.hasOwnProperty(frame)) {
              id3.tags[frame] = frames[frame];
            }
          }
          return id3;
        }
        _getFrameData(frames, ids) {
          let frame;
          for (let i = 0, id; id = ids[i]; i++) {
            if (id in frames) {
              frame = frames[id];
              if (Array.isArray(frame)) {
                frame = frame[0];
              }
              return frame.data;
            }
          }
        }
        getShortcuts() {
          return SHORTCUTS;
        }
      };
      var SHORTCUTS = {
        title: ["TIT2", "TT2"],
        artist: ["TPE1", "TP1"],
        album: ["TALB", "TAL"],
        year: ["TYER", "TYE"],
        comment: ["COMM", "COM"],
        track: ["TRCK", "TRK"],
        genre: ["TCON", "TCO"],
        picture: ["APIC", "PIC"],
        lyrics: ["USLT", "ULT"]
      };
      module.exports = ID3v2TagReader;
    }
  });

  // src/MP4TagReader.ts
  var require_MP4TagReader = __commonJS({
    "src/MP4TagReader.ts"(exports, module) {
      "use strict";
      var MediaTagReader = require_MediaTagReader();
      var MediaFileReader = require_MediaFileReader();
      var MP4TagReader = class extends MediaTagReader {
        static getTagIdentifierByteRange() {
          return {
            offset: 0,
            length: 16
          };
        }
        static canReadTagFormat(tagIdentifier) {
          var id = String.fromCharCode.apply(String, tagIdentifier.slice(4, 8));
          return id === "ftyp";
        }
        _loadData(mediaFileReader, callbacks) {
          var self2 = this;
          mediaFileReader.loadRange([0, 16], {
            onSuccess: function() {
              self2._loadAtom(mediaFileReader, 0, "", callbacks);
            },
            onError: callbacks.onError
          });
        }
        _loadAtom(mediaFileReader, offset, parentAtomFullName, callbacks) {
          if (offset >= mediaFileReader.getSize()) {
            callbacks.onSuccess();
            return;
          }
          var self2 = this;
          var atomSize = mediaFileReader.getLongAt(offset, true);
          if (atomSize == 0 || isNaN(atomSize)) {
            callbacks.onSuccess();
            return;
          }
          var atomName = mediaFileReader.getStringAt(offset + 4, 4);
          if (this._isContainerAtom(atomName)) {
            if (atomName == "meta") {
              offset += 4;
            }
            var atomFullName = (parentAtomFullName ? parentAtomFullName + "." : "") + atomName;
            if (atomFullName === "moov.udta.meta.ilst") {
              mediaFileReader.loadRange([offset, offset + atomSize], callbacks);
            } else {
              mediaFileReader.loadRange([offset + 8, offset + 8 + 8], {
                onSuccess: function() {
                  self2._loadAtom(mediaFileReader, offset + 8, atomFullName, callbacks);
                },
                onError: callbacks.onError
              });
            }
          } else {
            mediaFileReader.loadRange([offset + atomSize, offset + atomSize + 8], {
              onSuccess: function() {
                self2._loadAtom(mediaFileReader, offset + atomSize, parentAtomFullName, callbacks);
              },
              onError: callbacks.onError
            });
          }
        }
        _isContainerAtom(atomName) {
          return ["moov", "udta", "meta", "ilst"].indexOf(atomName) >= 0;
        }
        _canReadAtom(atomName) {
          return atomName !== "----";
        }
        _parseData(data, tagsToRead) {
          const tags = {};
          tagsToRead = this._expandShortcutTags(tagsToRead);
          this._readAtom(tags, data, 0, data.getSize(), tagsToRead);
          for (const name in SHORTCUTS) {
            if (SHORTCUTS.hasOwnProperty(name)) {
              const raw = tags[SHORTCUTS[name]];
              const tag = raw;
              if (tag) {
                if (name === "track") {
                  const td = tag.data;
                  tags[name] = td.track;
                } else {
                  tags[name] = tag.data;
                }
              }
            }
          }
          return {
            type: "MP4",
            ftyp: data.getStringAt(8, 4),
            version: data.getLongAt(12, true),
            tags
          };
        }
        _readAtom(tags, data, offset, length, tagsToRead, parentAtomFullName, indent) {
          indent = indent === void 0 ? "" : indent + "  ";
          var seek = offset;
          while (seek < offset + length) {
            var atomSize = data.getLongAt(seek, true);
            if (atomSize == 0) {
              return;
            }
            var atomName = data.getStringAt(seek + 4, 4);
            if (this._isContainerAtom(atomName)) {
              if (atomName == "meta") {
                seek += 4;
              }
              var atomFullName = (parentAtomFullName ? parentAtomFullName + "." : "") + atomName;
              this._readAtom(tags, data, seek + 8, atomSize - 8, tagsToRead, atomFullName, indent);
              return;
            }
            if ((!tagsToRead || tagsToRead.indexOf(atomName) >= 0) && parentAtomFullName === "moov.udta.meta.ilst" && this._canReadAtom(atomName)) {
              tags[atomName] = this._readMetadataAtom(data, seek);
            }
            seek += atomSize;
          }
        }
        _readMetadataAtom(data, offset) {
          const METADATA_HEADER = 16;
          var atomSize = data.getLongAt(offset, true);
          var atomName = data.getStringAt(offset + 4, 4);
          var klass = data.getInteger24At(offset + METADATA_HEADER + 1, true);
          let type = TYPES[String(klass)];
          let atomData;
          var bigEndian = true;
          if (atomName == "trkn") {
            atomData = {
              track: data.getShortAt(offset + METADATA_HEADER + 10, bigEndian),
              total: data.getShortAt(offset + METADATA_HEADER + 14, bigEndian)
            };
          } else if (atomName == "disk") {
            atomData = {
              disk: data.getShortAt(offset + METADATA_HEADER + 10, bigEndian),
              total: data.getShortAt(offset + METADATA_HEADER + 14, bigEndian)
            };
          } else {
            var atomHeader = METADATA_HEADER + 4 + 4;
            var dataStart = offset + atomHeader;
            var dataLength = atomSize - atomHeader;
            if (atomName === "covr" && type === "uint8") {
              type = "jpeg";
            }
            switch (type) {
              case "text":
                atomData = data.getStringWithCharsetAt(dataStart, dataLength, "utf-8").toString();
                break;
              case "uint8":
                atomData = data.getShortAt(dataStart, false);
                break;
              case "int":
              case "uint": {
                const intReader = type == "int" ? dataLength == 1 ? data.getSByteAt : dataLength == 2 ? data.getSShortAt : dataLength == 4 ? data.getSLongAt : data.getLongAt : dataLength == 1 ? data.getByteAt : dataLength == 2 ? data.getShortAt : data.getLongAt;
                atomData = intReader.call(
                  data,
                  dataStart + (dataLength == 8 ? 4 : 0),
                  true
                );
                break;
              }
              case "jpeg":
              case "png":
                atomData = {
                  format: "image/" + type,
                  data: data.getBytesAt(dataStart, dataLength)
                };
                break;
            }
          }
          return {
            id: atomName,
            size: atomSize,
            description: ATOM_DESCRIPTIONS[atomName] || "Unknown",
            data: atomData
          };
        }
        getShortcuts() {
          return SHORTCUTS;
        }
      };
      var TYPES = {
        "0": "uint8",
        "1": "text",
        "13": "jpeg",
        "14": "png",
        "21": "int",
        "22": "uint"
      };
      var ATOM_DESCRIPTIONS = {
        "\xA9alb": "Album",
        "\xA9ART": "Artist",
        "aART": "Album Artist",
        "\xA9day": "Release Date",
        "\xA9nam": "Title",
        "\xA9gen": "Genre",
        "gnre": "Genre",
        "trkn": "Track Number",
        "\xA9wrt": "Composer",
        "\xA9too": "Encoding Tool",
        "\xA9enc": "Encoded By",
        "cprt": "Copyright",
        "covr": "Cover Art",
        "\xA9grp": "Grouping",
        "keyw": "Keywords",
        "\xA9lyr": "Lyrics",
        "\xA9cmt": "Comment",
        "tmpo": "Tempo",
        "cpil": "Compilation",
        "disk": "Disc Number",
        "tvsh": "TV Show Name",
        "tven": "TV Episode ID",
        "tvsn": "TV Season",
        "tves": "TV Episode",
        "tvnn": "TV Network",
        "desc": "Description",
        "ldes": "Long Description",
        "sonm": "Sort Name",
        "soar": "Sort Artist",
        "soaa": "Sort Album",
        "soco": "Sort Composer",
        "sosn": "Sort Show",
        "purd": "Purchase Date",
        "pcst": "Podcast",
        "purl": "Podcast URL",
        "catg": "Category",
        "hdvd": "HD Video",
        "stik": "Media Type",
        "rtng": "Content Rating",
        "pgap": "Gapless Playback",
        "apID": "Purchase Account",
        "sfID": "Country Code",
        "atID": "Artist ID",
        "cnID": "Catalog ID",
        "plID": "Collection ID",
        "geID": "Genre ID",
        "xid ": "Vendor Information",
        "flvr": "Codec Flavor"
      };
      var SHORTCUTS = {
        "title": "\xA9nam",
        "artist": "\xA9ART",
        "album": "\xA9alb",
        "year": "\xA9day",
        "comment": "\xA9cmt",
        "track": "trkn",
        "genre": "\xA9gen",
        "picture": "covr",
        "lyrics": "\xA9lyr"
      };
      module.exports = MP4TagReader;
    }
  });

  // src/FLACTagReader.ts
  var require_FLACTagReader = __commonJS({
    "src/FLACTagReader.ts"(exports, module) {
      "use strict";
      var MediaTagReader = require_MediaTagReader();
      var MediaFileReader = require_MediaFileReader();
      var FLAC_HEADER_SIZE = 4;
      var COMMENT_HEADERS = [4, 132];
      var PICTURE_HEADERS = [6, 134];
      var IMAGE_TYPES = [
        "Other",
        "32x32 pixels 'file icon' (PNG only)",
        "Other file icon",
        "Cover (front)",
        "Cover (back)",
        "Leaflet page",
        "Media (e.g. label side of CD)",
        "Lead artist/lead performer/soloist",
        "Artist/performer",
        "Conductor",
        "Band/Orchestra",
        "Composer",
        "Lyricist/text writer",
        "Recording Location",
        "During recording",
        "During performance",
        "Movie/video screen capture",
        "A bright coloured fish",
        "Illustration",
        "Band/artist logotype",
        "Publisher/Studio logotype"
      ];
      var FLACTagReader = class extends MediaTagReader {
        /**
         * Gets the byte range for the tag identifier.
         *
         * Because the Vorbis comment block is not guaranteed to be in a specified
         * location, we can only load the first 4 bytes of the file to confirm it
         * is a FLAC first.
         *
         * @return {ByteRange} The byte range that identifies the tag for a FLAC.
         */
        static getTagIdentifierByteRange() {
          return {
            offset: 0,
            length: FLAC_HEADER_SIZE
          };
        }
        /**
         * Determines whether or not this reader can read a certain tag format.
         *
         * This checks that the first 4 characters in the file are fLaC, which
         * according to the FLAC file specification should be the characters that
         * indicate a FLAC file.
         *
         * @return {boolean} True if the header is fLaC, false otherwise.
         */
        static canReadTagFormat(tagIdentifier) {
          var id = String.fromCharCode.apply(String, tagIdentifier.slice(0, 4));
          return id === "fLaC";
        }
        /**
         * Function called to load the data from the file.
         *
         * To begin processing the blocks, the next 4 bytes after the initial 4 bytes
         * (bytes 4 through 7) are loaded. From there, the rest of the loading process
         * is passed on to the _loadBlock function, which will handle the rest of the
         * parsing for the metadata blocks.
         *
         * @param {MediaFileReader} mediaFileReader - The MediaFileReader used to parse the file.
         * @param {LoadCallbackType} callbacks - The callback to call once _loadData is completed.
         */
        _loadData(mediaFileReader, callbacks) {
          var self2 = this;
          mediaFileReader.loadRange([4, 7], {
            onSuccess: function() {
              self2._loadBlock(mediaFileReader, 4, callbacks);
            }
          });
        }
        /**
         * Special internal function used to parse the different FLAC blocks.
         *
         * The FLAC specification doesn't specify a specific location for metadata to resign, but
         * dictates that it may be in one of various blocks located throughout the file. To load the
         * metadata, we must locate the header first. This can be done by reading the first byte of
         * each block to determine the block type. After the block type comes a 24 bit integer that stores
         * the length of the block as big endian. Using this, we locate the block and store the offset for
         * parsing later.
         *
         * After each block has been parsed, the _nextBlock function is called in order
         * to parse the information of the next block. All blocks need to be parsed in order to find
         * all of the picture and comment blocks.
         *
         * More info on the FLAC specification may be found here:
         * https://xiph.org/flac/format.html
         * @param {MediaFileReader} mediaFileReader - The MediaFileReader used to parse the file.
         * @param {number} offset - The offset to start checking the header from.
         * @param {LoadCallbackType} callbacks - The callback to call once the header has been found.
         */
        _loadBlock(mediaFileReader, offset, callbacks) {
          var self2 = this;
          var blockHeader = mediaFileReader.getByteAt(offset);
          var blockSize = mediaFileReader.getInteger24At(offset + 1, true);
          if (COMMENT_HEADERS.indexOf(blockHeader) !== -1) {
            var offsetMetadata = offset + 4;
            mediaFileReader.loadRange([offsetMetadata, offsetMetadata + blockSize], {
              onSuccess: function() {
                self2._commentOffset = offsetMetadata;
                self2._nextBlock(mediaFileReader, offset, blockHeader, blockSize, callbacks);
              }
            });
          } else if (PICTURE_HEADERS.indexOf(blockHeader) !== -1) {
            var offsetMetadata = offset + 4;
            mediaFileReader.loadRange([offsetMetadata, offsetMetadata + blockSize], {
              onSuccess: function() {
                self2._pictureOffset = offsetMetadata;
                self2._nextBlock(mediaFileReader, offset, blockHeader, blockSize, callbacks);
              }
            });
          } else {
            self2._nextBlock(mediaFileReader, offset, blockHeader, blockSize, callbacks);
          }
        }
        /**
         * Internal function used to load the next range and respective block.
         *
         * If the metadata block that was identified is not the last block before the
         * audio blocks, the function will continue loading the next blocks. If it is
         * the last block (identified by any values greater than 127, see FLAC spec.),
         * the function will determine whether a comment block had been identified.
         *
         * If the block does not exist, the error callback is called. Otherwise, the function
         * will call the success callback, allowing data parsing to begin.
         * @param {MediaFileReader} mediaFileReader - The MediaFileReader used to parse the file.
         * @param {number} offset - The offset that the existing header was located at.
         * @param {number} blockHeader - An integer reflecting the header type of the block.
         * @param {number} blockSize - The size of the previously processed header.
         * @param {LoadCallbackType} callbacks - The callback functions to be called.
         */
        _nextBlock(mediaFileReader, offset, blockHeader, blockSize, callbacks) {
          var self2 = this;
          if (blockHeader > 127) {
            if (!self2._commentOffset) {
              if (callbacks.onError) {
                callbacks.onError({
                  type: "loadData",
                  info: "Comment block could not be found."
                });
              }
            } else {
              callbacks.onSuccess();
            }
          } else {
            mediaFileReader.loadRange([offset + 4 + blockSize, offset + 4 + 4 + blockSize], {
              onSuccess: function() {
                self2._loadBlock(mediaFileReader, offset + 4 + blockSize, callbacks);
              }
            });
          }
        }
        /**
         * Parses the data and returns the tags.
         *
         * This is an overview of the VorbisComment format and what this function attempts to
         * retrieve:
         * - First 4 bytes: a long that contains the length of the vendor string.
         * - Next n bytes: the vendor string encoded in UTF-8.
         * - Next 4 bytes: a long representing how many comments are in this block
         * For each comment that exists:
         * - First 4 bytes: a long representing the length of the comment
         * - Next n bytes: the comment encoded in UTF-8.
         * The comment string will usually appear in a format similar to:
         * ARTIST=me
         *
         * Note that the longs and integers in this block are encoded in little endian
         * as opposed to big endian for the rest of the FLAC spec.
         * @param {MediaFileReader} data - The MediaFileReader to parse the file with.
         * @param {Array<string>} [tags] - Optional tags to also be retrieved from the file.
         * @return {TagType} - An object containing the tag information for the file.
         */
        _parseData(data, _tags) {
          const commentOffset = this._commentOffset;
          var vendorLength = data.getLongAt(commentOffset, false);
          var offsetVendor = commentOffset + 4;
          var offsetList = vendorLength + offsetVendor;
          var numComments = data.getLongAt(offsetList, false);
          var dataOffset = offsetList + 4;
          var title, artist, album, track, genre, picture;
          for (let i = 0; i < numComments; i++) {
            let dataLength2 = data.getLongAt(dataOffset, false);
            let s = data.getStringWithCharsetAt(dataOffset + 4, dataLength2, "utf-8").toString();
            let d = s.indexOf("=");
            let split = [s.slice(0, d), s.slice(d + 1)];
            switch (split[0].toUpperCase()) {
              case "TITLE":
                title = split[1];
                break;
              case "ARTIST":
                artist = split[1];
                break;
              case "ALBUM":
                album = split[1];
                break;
              case "TRACKNUMBER":
                track = split[1];
                break;
              case "GENRE":
                genre = split[1];
                break;
            }
            dataOffset += 4 + dataLength2;
          }
          if (this._pictureOffset) {
            var imageType = data.getLongAt(this._pictureOffset, true);
            var offsetMimeLength = this._pictureOffset + 4;
            var mimeLength = data.getLongAt(offsetMimeLength, true);
            var offsetMime = offsetMimeLength + 4;
            var mime = data.getStringAt(offsetMime, mimeLength);
            var offsetDescriptionLength = offsetMime + mimeLength;
            var descriptionLength = data.getLongAt(offsetDescriptionLength, true);
            var offsetDescription = offsetDescriptionLength + 4;
            var description = data.getStringWithCharsetAt(offsetDescription, descriptionLength, "utf-8").toString();
            var offsetDataLength = offsetDescription + descriptionLength + 16;
            var dataLength = data.getLongAt(offsetDataLength, true);
            var offsetData = offsetDataLength + 4;
            var imageData = data.getBytesAt(offsetData, dataLength);
            picture = {
              format: mime,
              type: IMAGE_TYPES[imageType],
              description,
              data: imageData
            };
          }
          var tag = {
            type: "FLAC",
            version: "1",
            tags: {
              title,
              artist,
              album,
              track,
              genre,
              picture
            }
          };
          return tag;
        }
      };
      module.exports = FLACTagReader;
    }
  });

  // src/registerNodeFileReaders.noop.ts
  var require_registerNodeFileReaders_noop = __commonJS({
    "src/registerNodeFileReaders.noop.ts"(exports, module) {
      "use strict";
      function registerNodeFileReaders() {
      }
      module.exports = registerNodeFileReaders;
    }
  });

  // src/jsmediatags.ts
  var require_jsmediatags = __commonJS({
    "src/jsmediatags.ts"(exports, module) {
      var MediaFileReader = require_MediaFileReader();
      var XhrFileReader = require_XhrFileReader();
      var BlobFileReader = require_BlobFileReader();
      var ArrayFileReader = require_ArrayFileReader();
      var MediaTagReader = require_MediaTagReader();
      var ID3v1TagReader = require_ID3v1TagReader();
      var ID3v2TagReader = require_ID3v2TagReader();
      var MP4TagReader = require_MP4TagReader();
      var FLACTagReader = require_FLACTagReader();
      var mediaFileReaders = [];
      var mediaTagReaders = [];
      function read(location, callbacks) {
        if (callbacks === void 0) {
          return new Reader(location).read();
        }
        new Reader(location).read(callbacks);
      }
      function readAsync(location) {
        return new Reader(location).read();
      }
      function isRangeValid(range, fileSize) {
        const invalidPositiveRange = range.offset >= 0 && range.offset + range.length >= fileSize;
        const invalidNegativeRange = range.offset < 0 && (-range.offset > fileSize || range.offset + range.length > 0);
        return !(invalidPositiveRange || invalidNegativeRange);
      }
      var Reader = class {
        constructor(file) {
          this._file = file;
        }
        setTagsToRead(tagsToRead) {
          this._tagsToRead = tagsToRead;
          return this;
        }
        setFileReader(fileReader) {
          this._fileReader = fileReader;
          return this;
        }
        setTagReader(tagReader) {
          this._tagReader = tagReader;
          return this;
        }
        read(callbacks) {
          if (callbacks === void 0) {
            return new Promise((resolve, reject) => {
              this.read({ onSuccess: resolve, onError: reject });
            });
          }
          const FileReader2 = this._getFileReader();
          const fileReader = new FileReader2(this._file);
          const self2 = this;
          fileReader.init({
            onSuccess: function() {
              self2._getTagReader(fileReader, {
                onSuccess: function(TagReader) {
                  var _a;
                  new TagReader(fileReader).setTagsToRead((_a = self2._tagsToRead) != null ? _a : null).read(callbacks);
                },
                onError: callbacks.onError
              });
            },
            onError: callbacks.onError
          });
        }
        readAsync() {
          return this.read();
        }
        _getFileReader() {
          if (this._fileReader !== void 0) {
            return this._fileReader;
          }
          return this._findFileReader();
        }
        _findFileReader() {
          for (let i = 0; i < mediaFileReaders.length; i++) {
            if (mediaFileReaders[i].canReadFile(this._file)) {
              return mediaFileReaders[i];
            }
          }
          throw new Error("No suitable file reader found for " + String(this._file));
        }
        _getTagReader(fileReader, callbacks) {
          if (this._tagReader !== void 0) {
            const tagReader = this._tagReader;
            setTimeout(function() {
              callbacks.onSuccess(tagReader);
            }, 1);
          } else {
            this._findTagReader(fileReader, callbacks);
          }
        }
        _findTagReader(fileReader, callbacks) {
          const tagReadersAtFileStart = [];
          const tagReadersAtFileEnd = [];
          const fileSize = fileReader.getSize();
          for (let i = 0; i < mediaTagReaders.length; i++) {
            const range = mediaTagReaders[i].getTagIdentifierByteRange();
            if (!isRangeValid(range, fileSize)) {
              continue;
            }
            if (range.offset >= 0 && range.offset < fileSize / 2 || range.offset < 0 && range.offset < -fileSize / 2) {
              tagReadersAtFileStart.push(mediaTagReaders[i]);
            } else {
              tagReadersAtFileEnd.push(mediaTagReaders[i]);
            }
          }
          let tagsLoaded = false;
          const loadTagIdentifiersCallbacks = {
            onSuccess: function() {
              if (!tagsLoaded) {
                tagsLoaded = true;
                return;
              }
              for (let i = 0; i < mediaTagReaders.length; i++) {
                const range = mediaTagReaders[i].getTagIdentifierByteRange();
                if (!isRangeValid(range, fileSize)) {
                  continue;
                }
                let tagIndentifier;
                try {
                  tagIndentifier = fileReader.getBytesAt(
                    range.offset >= 0 ? range.offset : range.offset + fileSize,
                    range.length
                  );
                } catch (ex) {
                  const message = ex instanceof Error ? ex.message : String(ex);
                  if (callbacks.onError) {
                    callbacks.onError({
                      type: "fileReader",
                      info: message
                    });
                  }
                  return;
                }
                if (mediaTagReaders[i].canReadTagFormat(tagIndentifier)) {
                  callbacks.onSuccess(mediaTagReaders[i]);
                  return;
                }
              }
              if (callbacks.onError) {
                callbacks.onError({
                  type: "tagFormat",
                  info: "No suitable tag reader found"
                });
              }
            },
            onError: callbacks.onError
          };
          this._loadTagIdentifierRanges(
            fileReader,
            tagReadersAtFileStart,
            loadTagIdentifiersCallbacks
          );
          this._loadTagIdentifierRanges(
            fileReader,
            tagReadersAtFileEnd,
            loadTagIdentifiersCallbacks
          );
        }
        _loadTagIdentifierRanges(fileReader, tagReaders, callbacks) {
          if (tagReaders.length === 0) {
            setTimeout(callbacks.onSuccess, 1);
            return;
          }
          const tagIdentifierRange = [Number.MAX_VALUE, 0];
          const fileSize = fileReader.getSize();
          for (let i = 0; i < tagReaders.length; i++) {
            const range = tagReaders[i].getTagIdentifierByteRange();
            const start = range.offset >= 0 ? range.offset : range.offset + fileSize;
            const end = start + range.length - 1;
            tagIdentifierRange[0] = Math.min(start, tagIdentifierRange[0]);
            tagIdentifierRange[1] = Math.max(end, tagIdentifierRange[1]);
          }
          fileReader.loadRange(tagIdentifierRange, callbacks);
        }
      };
      var Config = class _Config {
        static addFileReader(fileReader) {
          mediaFileReaders.push(fileReader);
          return _Config;
        }
        static addTagReader(tagReader) {
          mediaTagReaders.push(tagReader);
          return _Config;
        }
        static removeTagReader(tagReader) {
          const tagReaderIx = mediaTagReaders.indexOf(tagReader);
          if (tagReaderIx >= 0) {
            mediaTagReaders.splice(tagReaderIx, 1);
          }
          return _Config;
        }
        static EXPERIMENTAL_avoidHeadRequests() {
          XhrFileReader.setConfig({
            avoidHeadRequests: true
          });
        }
        static setDisallowedXhrHeaders(disallowedXhrHeaders) {
          XhrFileReader.setConfig({
            disallowedXhrHeaders
          });
        }
        static setXhrTimeoutInSec(timeoutInSec) {
          XhrFileReader.setConfig({
            timeoutInSec
          });
        }
      };
      Config.addFileReader(XhrFileReader).addFileReader(BlobFileReader).addFileReader(ArrayFileReader).addTagReader(ID3v2TagReader).addTagReader(ID3v1TagReader).addTagReader(MP4TagReader).addTagReader(FLACTagReader);
      var registerNodeFileReaders = require_registerNodeFileReaders_noop();
      registerNodeFileReaders(Config);
      module.exports = {
        read,
        readAsync,
        Reader,
        Config
      };
    }
  });
  return require_jsmediatags();
})();
