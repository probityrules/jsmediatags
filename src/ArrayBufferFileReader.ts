"use strict";

const ChunkedFileData = require("./ChunkedFileData");
const MediaFileReader = require("./MediaFileReader");

import type { LoadCallbackType } from "./FlowTypes";

class ArrayBufferFileReader extends MediaFileReader {
  private _buffer: ArrayBuffer;
  private _fileData: InstanceType<typeof ChunkedFileData>;

  constructor(buffer: ArrayBuffer) {
    super();
    this._buffer = buffer;
    this._fileData = new ChunkedFileData();
  }

  static canReadFile(file: unknown): boolean {
    return typeof ArrayBuffer === "function" && file instanceof ArrayBuffer;
  }

  _init(callbacks: LoadCallbackType): void {
    this._size = this._buffer.byteLength;
    setTimeout(callbacks.onSuccess, 1);
  }

  loadRange(range: [number, number], callbacks: LoadCallbackType): void {
    const arrayBuf = this._buffer.slice(range[0], range[1] + 1);
    const viewData = new Uint8Array(arrayBuf);
    this._fileData.addData(range[0], viewData);
    callbacks.onSuccess();
  }

  getByteAt(offset: number): number {
    return this._fileData.getByteAt(offset);
  }
}

export = ArrayBufferFileReader;
