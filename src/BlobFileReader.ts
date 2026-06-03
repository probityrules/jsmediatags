"use strict";

const ChunkedFileData = require("./ChunkedFileData");
const MediaFileReader = require("./MediaFileReader");

import type { LoadCallbackType } from "./types";

type BlobCompat = Blob & {
  mozSlice?: (start?: number, end?: number, contentType?: string) => Blob;
  webkitSlice?: (start?: number, end?: number, contentType?: string) => Blob;
};

class BlobFileReader extends MediaFileReader {
  private _blob: BlobCompat;
  private _fileData: InstanceType<typeof ChunkedFileData>;

  constructor(blob: Blob) {
    super();
    this._blob = blob as BlobCompat;
    this._fileData = new ChunkedFileData();
  }

  static canReadFile(file: unknown): boolean {
    return (
      (typeof Blob !== "undefined" && file instanceof Blob) ||
      (typeof File !== "undefined" && file instanceof File)
    );
  }

  _init(callbacks: LoadCallbackType): void {
    this._size = this._blob.size;
    setTimeout(callbacks.onSuccess, 1);
  }

  loadRange(range: [number, number], callbacks: LoadCallbackType): void {
    const self = this;
    const blobSlice =
      this._blob.slice ||
      this._blob.mozSlice ||
      this._blob.webkitSlice;
    const blob = blobSlice.call(this._blob, range[0], range[1] + 1);
    const browserFileReader = new FileReader();

    browserFileReader.onloadend = function () {
      const result = browserFileReader.result as ArrayBuffer;
      const intArray = new Uint8Array(result);
      self._fileData.addData(range[0], intArray);
      callbacks.onSuccess();
    };
    browserFileReader.onerror =
      browserFileReader.onabort =
        function () {
          if (callbacks.onError) {
            callbacks.onError({
              type: "blob",
              info: browserFileReader.error,
            });
          }
        };

    browserFileReader.readAsArrayBuffer(blob);
  }

  getByteAt(offset: number): number {
    return this._fileData.getByteAt(offset);
  }
}

export = BlobFileReader;
