"use strict";

const MediaFileReader = require("./MediaFileReader");

import type {
  CallbackType,
  LoadCallbackType,
  ByteRange,
  TagType,
} from "./FlowTypes";

class MediaTagReader {
  private _mediaFileReader: InstanceType<typeof MediaFileReader>;
  private _tags: string[] | null;

  constructor(mediaFileReader: InstanceType<typeof MediaFileReader>) {
    this._mediaFileReader = mediaFileReader;
    this._tags = null;
  }

  static getTagIdentifierByteRange(): ByteRange {
    throw new Error("Must implement");
  }

  static canReadTagFormat(_tagIdentifier: Array<number>): boolean {
    throw new Error("Must implement");
  }

  setTagsToRead(tags: string[] | null): this {
    this._tags = tags;
    return this;
  }

  read(callbacks: CallbackType<TagType>): void {
    const self = this;

    this._mediaFileReader.init({
      onSuccess: function () {
        self._loadData(self._mediaFileReader, {
          onSuccess: function () {
            let tags: TagType;
            try {
              tags = self._parseData(self._mediaFileReader, self._tags);
            } catch (ex) {
              const err = ex as Error;
              if (callbacks.onError) {
                callbacks.onError({
                  type: "parseData",
                  info: err.message,
                });
              }
              return;
            }

            callbacks.onSuccess(tags);
          },
          onError: callbacks.onError,
        });
      },
      onError: callbacks.onError,
    });
  }

  getShortcuts(): Record<string, string | string[]> {
    return {};
  }

  _loadData(
    _mediaFileReader: InstanceType<typeof MediaFileReader>,
    _callbacks: LoadCallbackType
  ): void {
    throw new Error("Must implement _loadData function");
  }

  _parseData(
    _mediaFileReader: InstanceType<typeof MediaFileReader>,
    _tags: string[] | null
  ): TagType {
    throw new Error("Must implement _parseData function");
  }

  _expandShortcutTags(tagsWithShortcuts: string[] | null): string[] | null {
    if (!tagsWithShortcuts) {
      return null;
    }

    let tags: string[] = [];
    const shortcuts = this.getShortcuts();
    for (let i = 0, tagOrShortcut; (tagOrShortcut = tagsWithShortcuts[i]); i++) {
      tags = tags.concat(
        (shortcuts[tagOrShortcut] as string[] | string | undefined) ||
          [tagOrShortcut]
      );
    }

    return tags;
  }
}

export = MediaTagReader;
