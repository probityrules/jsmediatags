"use strict";

import * as fs from "fs";

const ChunkedFileData = require("./ChunkedFileData");
const MediaFileReader = require("./MediaFileReader");

import type { LoadCallbackType } from "./FlowTypes";

class NodeFileReader extends MediaFileReader {
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
    fs.stat(this._path, (err, stats) => {
      if (err) {
        if (callbacks.onError) {
          callbacks.onError({ type: "fs", info: err });
        }
      } else {
        this._size = stats.size;
        callbacks.onSuccess();
      }
    });
  }

  loadRange(range: [number, number], callbacks: LoadCallbackType): void {
    let fd = -1;
    const self = this;
    const fileData = this._fileData;

    const length = range[1] - range[0] + 1;
    const onSuccess = callbacks.onSuccess;
    const onError = callbacks.onError || function (_object: unknown) {};

    if (fileData.hasDataRange(range[0], range[1])) {
      process.nextTick(onSuccess);
      return;
    }

    const readData = function (err: NodeJS.ErrnoException | null, _fd: number) {
      if (err) {
        onError({ type: "fs", info: err });
        return;
      }

      fd = _fd;
      const buffer = Buffer.alloc(length);
      fs.read(_fd, buffer, 0, length, range[0], processData);
    };

    const processData = function (
      err: NodeJS.ErrnoException | null,
      _bytesRead: number,
      buffer: Buffer
    ) {
      fs.close(fd, function (err) {
        if (err) {
          console.error(err);
        }
      });

      if (err) {
        onError({ type: "fs", info: err });
        return;
      }

      storeBuffer(buffer);
      onSuccess();
    };

    const storeBuffer = function (buffer: Buffer) {
      const data = Array.prototype.slice.call(buffer, 0, length);
      fileData.addData(range[0], data);
    };

    fs.open(this._path, "r", undefined, readData);
  }
}

export = NodeFileReader;
