"use strict";

const RNFS = require("react-native-fs");
const { Buffer } = require("buffer");

const ChunkedFileData = require("./ChunkedFileData");
const MediaFileReader = require("./MediaFileReader");

import type { LoadCallbackType } from "./FlowTypes";

class ReactNativeFileReader extends MediaFileReader {
  private _path: string;
  private _fileData: InstanceType<typeof ChunkedFileData>;

  constructor(path: string) {
    super();
    this._path = path;
    this._fileData = new ChunkedFileData();
  }

  static canReadFile(file: unknown): boolean {
    return typeof file === "string" && !/^[a-z]+:\/\//i.test(file);
  }

  getByteAt(offset: number): number {
    return this._fileData.getByteAt(offset);
  }

  _init(callbacks: LoadCallbackType): void {
    const self = this;

    RNFS.stat(self._path)
      .then((statResult: { size: number }) => {
        self._size = statResult.size;
        callbacks.onSuccess();
      })
      .catch((error: unknown) => {
        if (callbacks.onError) {
          callbacks.onError({ type: "fs", info: error });
        }
      });
  }

  loadRange(range: [number, number], callbacks: LoadCallbackType): void {
    const fileData = this._fileData;

    const length = range[1] - range[0] + 1;
    const onSuccess = callbacks.onSuccess;
    const onError = callbacks.onError || function (_object: unknown) {};

    RNFS.read(this._path, length, range[0], { encoding: "base64" })
      .then((readData: string) => {
        const buffer = Buffer.from(readData, "base64");
        const data = Array.prototype.slice.call(buffer, 0, length);
        fileData.addData(range[0], data);
        onSuccess();
      })
      .catch((err: unknown) => {
        onError({ type: "fs", info: err });
      });
  }
}

export = ReactNativeFileReader;
