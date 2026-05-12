"use strict";

const MediaTagReader = require("./MediaTagReader");
const MediaFileReader = require("./MediaFileReader");
const ID3v2FrameReader = require("./ID3v2FrameReader");

import type {
  TagFrames,
  TagHeader,
  ByteRange,
  TagType,
} from "./FlowTypes";
import type { LoadCallbackType } from "./FlowTypes";

const ID3_HEADER_SIZE = 10;

class ID3v2TagReader extends MediaTagReader {
  static getTagIdentifierByteRange(): ByteRange {
    return {
      offset: 0,
      length: ID3_HEADER_SIZE,
    };
  }

  static canReadTagFormat(tagIdentifier: Array<number>): boolean {
    const id = String.fromCharCode.apply(String, tagIdentifier.slice(0, 3));
    return id === "ID3";
  }

  _loadData(
    mediaFileReader: InstanceType<typeof MediaFileReader>,
    callbacks: LoadCallbackType
  ): void {
    mediaFileReader.loadRange([6, 9], {
      onSuccess: function () {
        mediaFileReader.loadRange(
          [
            0,
            ID3_HEADER_SIZE + mediaFileReader.getSynchsafeInteger32At(6) - 1,
          ],
          callbacks
        );
      },
      onError: callbacks.onError,
    });
  }

  _parseData(
    data: InstanceType<typeof MediaFileReader>,
    tags: string[] | null
  ): TagType {
    let offset = 0;
    const major = data.getByteAt(offset + 3);
    if (major > 4) {
      return { type: "ID3", tags: { version: ">2.4" } } as TagType;
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
      major: major,
      revision: revision,
      flags: {
        unsynchronisation: unsynch,
        extended_header: xheader,
        experimental_indicator: xindicator,
        footer_present: false,
      },
      size: size,
      tags: {} as TagType["tags"],
    };

    let expandedTags: string[] | null | undefined;
    if (tags) {
      expandedTags = this._expandShortcutTags(tags);
    }

    let offsetEnd = size + 10;
    let reader: InstanceType<typeof MediaFileReader> = data;
    if (id3.flags.unsynchronisation) {
      reader = ID3v2FrameReader.getUnsyncFileReader(reader, offset, size);
      offset = 0;
      offsetEnd = reader.getSize();
    }

    const frames = ID3v2FrameReader.readFrames(
      offset,
      offsetEnd,
      reader,
      id3 as TagHeader,
      expandedTags ?? undefined
    );

    for (const name in SHORTCUTS) {
      if (SHORTCUTS.hasOwnProperty(name)) {
        const frameData = this._getFrameData(frames, SHORTCUTS[name]);
        if (frameData) {
          id3.tags[name] = frameData as never;
        }
      }
    }

    for (const frame in frames) {
      if (frames.hasOwnProperty(frame)) {
        id3.tags[frame] = frames[frame] as never;
      }
    }

    return id3 as TagType;
  }

  _getFrameData(frames: TagFrames, ids: string[]): unknown {
    let frame: TagFrames[string];
    for (let i = 0, id; (id = ids[i]); i++) {
      if (id in frames) {
        frame = frames[id];
        if (Array.isArray(frame)) {
          frame = frame[0];
        }
        return (frame as { data: unknown }).data;
      }
    }
  }

  getShortcuts(): Record<string, string | string[]> {
    return SHORTCUTS;
  }
}

const SHORTCUTS: Record<string, string[]> = {
  title: ["TIT2", "TT2"],
  artist: ["TPE1", "TP1"],
  album: ["TALB", "TAL"],
  year: ["TYER", "TYE"],
  comment: ["COMM", "COM"],
  track: ["TRCK", "TRK"],
  genre: ["TCON", "TCO"],
  picture: ["APIC", "PIC"],
  lyrics: ["USLT", "ULT"],
};

export = ID3v2TagReader;
