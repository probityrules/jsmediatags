"use strict";

const MediaFileReader = require("./MediaFileReader");

import type { Byte, LoadCallbackType } from "./types";

class ArrayFileReader extends MediaFileReader {
  private _array: Byte[];

  constructor(array: Byte[]) {
    super();
    this._array = array;
    this._size = array.length;
    this._isInitialized = true;
  }

  static canReadFile(file: unknown): boolean {
    return (
      Array.isArray(file) ||
      (typeof Buffer === "function" &&
        typeof Buffer.isBuffer === "function" &&
        Buffer.isBuffer(file))
    );
  }

  init(callbacks: LoadCallbackType): void {
    setTimeout(callbacks.onSuccess, 0);
  }

  loadRange(range: [number, number], callbacks: LoadCallbackType): void {
    void range;
    setTimeout(callbacks.onSuccess, 0);
  }

  getByteAt(offset: number): Byte {
    if (offset >= this._array.length) {
      throw new Error("Offset " + offset + " hasn't been loaded yet.");
    }
    return this._array[offset];
  }
}

export = ArrayFileReader;
