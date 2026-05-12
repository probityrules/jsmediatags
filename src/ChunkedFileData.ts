/**
 * This class represents a file that might not have all its data loaded yet.
 * It is used when loading the entire file is not an option because it's too
 * expensive. Instead, parts of the file are loaded and added only when needed.
 * From a reading point of view is as if the entire file is loaded. The
 * exception is when the data is not available yet, an error will be thrown.
 * This class does not load the data, it just manages it. It provides operations
 * to add and read data from the file.
 */
"use strict";

const NOT_FOUND = -1;

import type { ChunkType, DataType } from "./FlowTypes";

function dataLength(data: DataType): number {
  return data.length;
}

function isUint8(data: DataType): data is Uint8Array {
  return data instanceof Uint8Array;
}

class ChunkedFileData {
  static get NOT_FOUND(): number {
    return NOT_FOUND;
  }
  private _fileData: Array<ChunkType>;

  constructor() {
    this._fileData = [];
  }

  /**
   * Adds data to the file storage at a specific offset.
   */
  addData(offset: number, data: DataType): void {
    const offsetEnd = offset + dataLength(data) - 1;
    const chunkRange = this._getChunkRange(offset, offsetEnd);

    if (chunkRange.startIx === NOT_FOUND) {
      this._fileData.splice(chunkRange.insertIx || 0, 0, {
        offset: offset,
        data: data,
      });
    } else {
      const firstChunk = this._fileData[chunkRange.startIx];
      const lastChunk = this._fileData[chunkRange.endIx];
      const needsPrepend = offset > firstChunk.offset;
      const needsAppend =
        offsetEnd < lastChunk.offset + dataLength(lastChunk.data) - 1;

      let chunk: ChunkType = {
        offset: Math.min(offset, firstChunk.offset),
        data: data,
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

  _concatData(dataA: DataType, dataB: DataType): DataType {
    if (isUint8(dataA) && isUint8(dataB)) {
      const Ctor = dataA.constructor as new (n: number) => Uint8Array;
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

  _sliceData(data: DataType, begin: number, end: number): DataType {
    if (typeof data === "string") {
      return data.slice(begin, end);
    }
    if (Array.isArray(data)) {
      return data.slice(begin, end);
    }
    const view = data as Uint8Array;
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
  _getChunkRange(
    offsetStart: number,
    offsetEnd: number
  ): { startIx: number; endIx: number; insertIx?: number } {
    let startChunkIx = NOT_FOUND;
    let endChunkIx = NOT_FOUND;
    let insertIx = 0;

    for (let i = 0; i < this._fileData.length; i++, insertIx = i) {
      const chunkOffsetStart = this._fileData[i].offset;
      const chunkOffsetEnd =
        chunkOffsetStart + dataLength(this._fileData[i].data);

      if (offsetEnd < chunkOffsetStart - 1) {
        break;
      }
      if (
        offsetStart <= chunkOffsetEnd + 1 &&
        offsetEnd >= chunkOffsetStart - 1
      ) {
        startChunkIx = i;
        break;
      }
    }

    if (startChunkIx === NOT_FOUND) {
      return {
        startIx: NOT_FOUND,
        endIx: NOT_FOUND,
        insertIx: insertIx,
      };
    }

    for (let i = startChunkIx; i < this._fileData.length; i++) {
      const chunkOffsetStart = this._fileData[i].offset;
      const chunkOffsetEnd =
        chunkOffsetStart + dataLength(this._fileData[i].data);

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
      endIx: endChunkIx,
    };
  }

  hasDataRange(offsetStart: number, offsetEnd: number): boolean {
    for (let i = 0; i < this._fileData.length; i++) {
      const chunk = this._fileData[i];
      if (offsetEnd < chunk.offset) {
        return false;
      }

      if (
        offsetStart >= chunk.offset &&
        offsetEnd < chunk.offset + dataLength(chunk.data)
      ) {
        return true;
      }
    }

    return false;
  }

  getByteAt(offset: number): number {
    let dataChunk: ChunkType | undefined;

    for (let i = 0; i < this._fileData.length; i++) {
      const dataChunkStart = this._fileData[i].offset;
      const dataChunkEnd =
        dataChunkStart + dataLength(this._fileData[i].data) - 1;

      if (offset >= dataChunkStart && offset <= dataChunkEnd) {
        dataChunk = this._fileData[i];
        break;
      }
    }

    if (dataChunk) {
      const idx = offset - dataChunk.offset;
      const d = dataChunk.data;
      if (typeof d === "string") {
        return d.charCodeAt(idx) & 0xff;
      }
      if (Array.isArray(d)) {
        return d[idx] as number;
      }
      return (d as Uint8Array)[idx];
    }

    throw new Error("Offset " + offset + " hasn't been loaded yet.");
  }
}

export = ChunkedFileData;
