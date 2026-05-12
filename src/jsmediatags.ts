"use strict";

const MediaFileReader = require("./MediaFileReader");
const XhrFileReader = require("./XhrFileReader");
const BlobFileReader = require("./BlobFileReader");
const ArrayFileReader = require("./ArrayFileReader");
const MediaTagReader = require("./MediaTagReader");
const ID3v1TagReader = require("./ID3v1TagReader");
const ID3v2TagReader = require("./ID3v2TagReader");
const MP4TagReader = require("./MP4TagReader");
const FLACTagReader = require("./FLACTagReader");

import type {
  CallbackType,
  LoadCallbackType,
  ByteRange,
  TagType,
} from "./FlowTypes";

type MediaFileReaderClass = typeof MediaFileReader;

type MediaTagReaderClass = typeof MediaTagReader;

type TagReaderResolutionCallbacks = {
  onSuccess: (reader?: MediaTagReaderClass) => void;
  onError?: (error: Record<string, unknown>) => void;
};

const mediaFileReaders: MediaFileReaderClass[] = [];
const mediaTagReaders: MediaTagReaderClass[] = [];

function read(location: unknown, callbacks: CallbackType<TagType>): void;
function read(location: unknown): Promise<TagType>;
function read(
  location: unknown,
  callbacks?: CallbackType<TagType>
): void | Promise<TagType> {
  if (callbacks === undefined) {
    return new Reader(location).read();
  }
  new Reader(location).read(callbacks);
}

function readAsync(location: unknown): Promise<TagType> {
  return new Reader(location).read();
}

function isRangeValid(range: ByteRange, fileSize: number): boolean {
  const invalidPositiveRange =
    range.offset >= 0 && range.offset + range.length >= fileSize;

  const invalidNegativeRange =
    range.offset < 0 &&
    (-range.offset > fileSize || range.offset + range.length > 0);

  return !(invalidPositiveRange || invalidNegativeRange);
}

class Reader {
  private _file: unknown;
  private _tagsToRead?: string[];
  private _fileReader?: MediaFileReaderClass;
  private _tagReader?: MediaTagReaderClass;

  constructor(file: unknown) {
    this._file = file;
  }

  setTagsToRead(tagsToRead: string[]): this {
    this._tagsToRead = tagsToRead;
    return this;
  }

  setFileReader(fileReader: MediaFileReaderClass): this {
    this._fileReader = fileReader;
    return this;
  }

  setTagReader(tagReader: MediaTagReaderClass): this {
    this._tagReader = tagReader;
    return this;
  }

  read(callbacks: CallbackType<TagType>): void;
  read(): Promise<TagType>;
  read(callbacks?: CallbackType<TagType>): void | Promise<TagType> {
    if (callbacks === undefined) {
      return new Promise<TagType>((resolve, reject) => {
        this.read({ onSuccess: resolve, onError: reject });
      });
    }

    const FileReader = this._getFileReader();
    const fileReader = new FileReader(this._file);
    const self = this;

    fileReader.init({
      onSuccess: function () {
        self._getTagReader(fileReader, {
          onSuccess: function (TagReader: MediaTagReaderClass) {
            new TagReader(fileReader)
              .setTagsToRead(self._tagsToRead ?? null)
              .read(callbacks);
          },
          onError: callbacks.onError,
        });
      },
      onError: callbacks.onError,
    });
  }

  readAsync(): Promise<TagType> {
    return this.read();
  }

  _getFileReader(): MediaFileReaderClass {
    if (this._fileReader !== undefined) {
      return this._fileReader;
    }
    return this._findFileReader();
  }

  _findFileReader(): MediaFileReaderClass {
    for (let i = 0; i < mediaFileReaders.length; i++) {
      if (mediaFileReaders[i].canReadFile(this._file)) {
        return mediaFileReaders[i];
      }
    }

    throw new Error("No suitable file reader found for " + String(this._file));
  }

  _getTagReader(
    fileReader: InstanceType<typeof MediaFileReader>,
    callbacks: TagReaderResolutionCallbacks
  ): void {
    if (this._tagReader !== undefined) {
      const tagReader = this._tagReader;
      setTimeout(function () {
        callbacks.onSuccess(tagReader);
      }, 1);
    } else {
      this._findTagReader(fileReader, callbacks);
    }
  }

  _findTagReader(
    fileReader: InstanceType<typeof MediaFileReader>,
    callbacks: TagReaderResolutionCallbacks
  ): void {
    const tagReadersAtFileStart: MediaTagReaderClass[] = [];
    const tagReadersAtFileEnd: MediaTagReaderClass[] = [];
    const fileSize = fileReader.getSize();

    for (let i = 0; i < mediaTagReaders.length; i++) {
      const range = mediaTagReaders[i].getTagIdentifierByteRange();
      if (!isRangeValid(range, fileSize)) {
        continue;
      }

      if (
        (range.offset >= 0 && range.offset < fileSize / 2) ||
        (range.offset < 0 && range.offset < -fileSize / 2)
      ) {
        tagReadersAtFileStart.push(mediaTagReaders[i]);
      } else {
        tagReadersAtFileEnd.push(mediaTagReaders[i]);
      }
    }

    let tagsLoaded = false;
    const loadTagIdentifiersCallbacks: LoadCallbackType = {
      onSuccess: function () {
        if (!tagsLoaded) {
          tagsLoaded = true;
          return;
        }

        for (let i = 0; i < mediaTagReaders.length; i++) {
          const range = mediaTagReaders[i].getTagIdentifierByteRange();
          if (!isRangeValid(range, fileSize)) {
            continue;
          }

          let tagIndentifier: number[];
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
                info: message,
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
            info: "No suitable tag reader found",
          });
        }
      },
      onError: callbacks.onError,
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

  _loadTagIdentifierRanges(
    fileReader: InstanceType<typeof MediaFileReader>,
    tagReaders: MediaTagReaderClass[],
    callbacks: LoadCallbackType
  ): void {
    if (tagReaders.length === 0) {
      setTimeout(callbacks.onSuccess, 1);
      return;
    }

    const tagIdentifierRange: [number, number] = [Number.MAX_VALUE, 0];
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
}

class Config {
  static addFileReader(fileReader: MediaFileReaderClass): typeof Config {
    mediaFileReaders.push(fileReader);
    return Config;
  }

  static addTagReader(tagReader: MediaTagReaderClass): typeof Config {
    mediaTagReaders.push(tagReader);
    return Config;
  }

  static removeTagReader(tagReader: MediaTagReaderClass): typeof Config {
    const tagReaderIx = mediaTagReaders.indexOf(tagReader);

    if (tagReaderIx >= 0) {
      mediaTagReaders.splice(tagReaderIx, 1);
    }

    return Config;
  }

  static EXPERIMENTAL_avoidHeadRequests(): void {
    XhrFileReader.setConfig({
      avoidHeadRequests: true,
    });
  }

  static setDisallowedXhrHeaders(disallowedXhrHeaders: string[]): void {
    XhrFileReader.setConfig({
      disallowedXhrHeaders: disallowedXhrHeaders,
    });
  }

  static setXhrTimeoutInSec(timeoutInSec: number): void {
    XhrFileReader.setConfig({
      timeoutInSec: timeoutInSec,
    });
  }
}

Config.addFileReader(XhrFileReader)
  .addFileReader(BlobFileReader)
  .addFileReader(ArrayFileReader)
  .addTagReader(ID3v2TagReader)
  .addTagReader(ID3v1TagReader)
  .addTagReader(MP4TagReader)
  .addTagReader(FLACTagReader);

const nodeProcess =
  typeof process !== "undefined"
    ? (process as NodeJS.Process & { browser?: boolean })
    : undefined;

if (nodeProcess && !nodeProcess.browser) {
  if (
    typeof navigator !== "undefined" &&
    (navigator as { product?: string }).product === "ReactNative"
  ) {
    const ReactNativeFileReader = require("./ReactNativeFileReader");
    Config.addFileReader(ReactNativeFileReader);
  } else {
    const NodeFileReader = require("./NodeFileReader");
    Config.addFileReader(NodeFileReader);
  }
}

export = {
  read: read,
  readAsync: readAsync,
  Reader: Reader,
  Config: Config,
};
