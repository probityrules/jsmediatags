'use strict';

const MediaTagReader = require('./MediaTagReader');
const MediaFileReader = require('./MediaFileReader');

import type {
  LoadCallbackType,
  ByteRange,
  TagType
} from './types';

type MediaReader = InstanceType<typeof MediaFileReader>;

// Element IDs (integer form of EBML class IDs)
const ID = {
  EBML: 0x1a45dfa3,
  DocType: 0x4282,
  Segment: 0x18538067,
  SeekHead: 0x114d9b74,
  Info: 0x1549a966,
  TimecodeScale: 0x2ad7b1,
  Tracks: 0x1654ae6b,
  TrackEntry: 0xae,
  TrackNumber: 0xd7,
  TrackType: 0x83,
  Name: 0x536e,
  Language: 0x22b59c,
  CodecID: 0x86,
  Cluster: 0x1f43b675,
  Timestamp: 0xe7,
  SimpleBlock: 0xa3,
  BlockGroup: 0xa0,
  Block: 0xa1,
  BlockDuration: 0x9b,
  Tags: 0x1254c367,
  Tag: 0x7373,
  SimpleTag: 0x67c8,
  TagName: 0x45a3,
  TagString: 0x4487,
  TagLanguage: 0x447a,
};

const SHORTCUTS: Record<string, string> = {
  title: 'TITLE',
  artist: 'ARTIST',
  album: 'ALBUM',
  year: 'DATE_RELEASED',
  comment: 'COMMENT',
  track: 'PART_NUMBER',
  genre: 'GENRE',
  lyrics: 'LYRICS'
};

const KIND_FROM_CODEC: Record<string, string> = {
  'D_WEBVTT/SUBTITLES': 'SUBTITLES',
  'D_WEBVTT/CAPTIONS': 'CAPTIONS',
  'D_WEBVTT/DESCRIPTIONS': 'DESCRIPTIONS',
  'D_WEBVTT/METADATA': 'METADATA',
  'S_TEXT/WEBVTT': 'SUBTITLES'
};

type WebVttTrack = {
  number: number;
  name: string;
  language: string;
  kind: string;
  cues: Array<{text: string; timeStamp: number; end?: number}>;
};

/**
 * Minimal EBML / WebM tag reader for audio VO files with SimpleTags and WebVTT tracks.
 */
class WebMTagReader extends MediaTagReader {
  static getTagIdentifierByteRange(): ByteRange {
    return {offset: 0, length: 4};
  }

  static canReadTagFormat(tagIdentifier: Array<number>): boolean {
    // EBML header ID 0x1A45DFA3
    return (
      tagIdentifier.length >= 4 &&
      tagIdentifier[0] === 0x1a &&
      tagIdentifier[1] === 0x45 &&
      tagIdentifier[2] === 0xdf &&
      tagIdentifier[3] === 0xa3
    );
  }

  _loadData(mediaFileReader: MediaReader, callbacks: LoadCallbackType) {
    // VO WebMs are small; load the whole file like a single range (Platypus already has ArrayBuffer).
    const size = mediaFileReader.getSize();

    mediaFileReader.loadRange([0, Math.max(0, size - 1)], callbacks);
  }

  _parseData(data: MediaReader, _tagsToRead: Array<string> | null): TagType {
    const
      size = data.getSize(),
      simpleTags: Record<string, {id: string; description: string; data: string}> = {},
      webvttByNumber: Record<number, WebVttTrack> = {};
    let
      timecodeScale = 1000000, // ns per tick (default 1ms)
      offset = 0;

    // Size VINT: length marker bits are not part of the numeric value.
    const readSizeVint = (at: number): {value: number; length: number} => {
      const
        first = data.getByteAt(at);

      if (first === 0) {
        throw new Error('Invalid EBML VINT');
      }

      let
        length = 1,
        mask = 0x80;

      while (length <= 8 && (first & mask) === 0) {
        length++;
        mask >>= 1;
      }

      let value = first & (mask - 1);

      for (let i = 1; i < length; i++) {
        value = (value << 8) | data.getByteAt(at + i);
      }

      return {value, length};
    };

    // Element IDs keep length-marker bits in the integer value (EBML class IDs).
    const readIdVint = (at: number): {value: number; length: number} => {
      const
        first = data.getByteAt(at);

      if (first === 0) {
        throw new Error('Invalid EBML ID');
      }

      let
        length = 1,
        mask = 0x80;

      while (length <= 4 && (first & mask) === 0) {
        length++;
        mask >>= 1;
      }

      let value = 0;

      for (let i = 0; i < length; i++) {
        value = (value << 8) | data.getByteAt(at + i);
      }

      return {value, length};
    };

    const readElement = (at: number, end: number): {id: number; size: number; headerSize: number; dataStart: number; dataEnd: number} | null => {
      if (at >= end) {
        return null;
      }

      const
        idInfo = readIdVint(at),
        sizeInfo = readSizeVint(at + idInfo.length),
        headerSize = idInfo.length + sizeInfo.length,
        dataStart = at + headerSize,
        // Unknown-size (all 1s after length bit) → consume through end
        isUnknown = sizeInfo.value === (1 << (7 * sizeInfo.length)) - 1,
        dataEnd = isUnknown ? end : Math.min(dataStart + sizeInfo.value, end);

      return {
        id: idInfo.value,
        size: sizeInfo.value,
        headerSize,
        dataStart,
        dataEnd
      };
    };

    // Block track number is a size-style VINT (length bits stripped).
    const readVint = readSizeVint;

    const readUint = (start: number, end: number): number => {
      let value = 0;

      for (let i = start; i < end; i++) {
        value = (value << 8) | data.getByteAt(i);
      }

      return value;
    };

    const readString = (start: number, end: number): string => {
      const
        bytes: number[] = [];

      for (let i = start; i < end; i++) {
        bytes.push(data.getByteAt(i));
      }

      try {
        return String.fromCharCode.apply(String, bytes);
      } catch (e) {
        return bytes.map((b) => String.fromCharCode(b)).join('');
      }
    };

    const walkSimpleTag = (start: number, end: number) => {
      let
        name = '',
        value = '',
        at = start;

      while (at < end) {
        const el = readElement(at, end);

        if (!el) {
          break;
        }

        if (el.id === ID.TagName) {
          name = readString(el.dataStart, el.dataEnd);
        } else if (el.id === ID.TagString) {
          value = readString(el.dataStart, el.dataEnd);
        } else if (el.id === ID.SimpleTag) {
          walkSimpleTag(el.dataStart, el.dataEnd);
        }

        at = el.dataEnd;
      }

      if (name) {
        const
          id = name.toUpperCase();

        simpleTags[id] = {
          id,
          description: name,
          data: value
        };
      }
    };

    const walkTags = (start: number, end: number) => {
      let at = start;

      while (at < end) {
        const el = readElement(at, end);

        if (!el) {
          break;
        }

        if (el.id === ID.Tag || el.id === ID.SimpleTag) {
          // Tag contains Targets + SimpleTag; SimpleTag may nest
          let inner = el.dataStart;

          while (inner < el.dataEnd) {
            const child = readElement(inner, el.dataEnd);

            if (!child) {
              break;
            }

            if (child.id === ID.SimpleTag) {
              walkSimpleTag(child.dataStart, child.dataEnd);
            }

            inner = child.dataEnd;
          }
        }

        at = el.dataEnd;
      }
    };

    const walkTrackEntry = (start: number, end: number) => {
      let
        number = 0,
        name = '',
        language = 'eng',
        codecId = '',
        at = start;

      while (at < end) {
        const el = readElement(at, end);

        if (!el) {
          break;
        }

        if (el.id === ID.TrackNumber) {
          number = readUint(el.dataStart, el.dataEnd);
        } else if (el.id === ID.Name) {
          name = readString(el.dataStart, el.dataEnd);
        } else if (el.id === ID.Language) {
          language = readString(el.dataStart, el.dataEnd);
        } else if (el.id === ID.CodecID) {
          codecId = readString(el.dataStart, el.dataEnd);
        }

        at = el.dataEnd;
      }

      if (codecId.indexOf('WEBVTT') >= 0 || KIND_FROM_CODEC[codecId]) {
        webvttByNumber[number] = {
          number,
          name: name || 'captions',
          language,
          kind: KIND_FROM_CODEC[codecId] || 'SUBTITLES',
          cues: []
        };
      }
    };

    const parseBlock = (start: number, end: number, clusterTs: number, duration?: number) => {
      // Block header: TrackNumber (VINT) + Timecode (int16) + Flags (1) + data
      if (end - start < 4) {
        return;
      }

      const
        trackVint = readVint(start),
        trackNumber = trackVint.value,
        tcAt = start + trackVint.length;

      if (tcAt + 3 > end) {
        return;
      }

      const
        relative = (data.getByteAt(tcAt) << 8) | data.getByteAt(tcAt + 1),
        signed = relative > 0x7fff ? relative - 0x10000 : relative,
        flagsAt = tcAt + 2,
        payloadStart = flagsAt + 1,
        track = webvttByNumber[trackNumber];

      if (!track) {
        return;
      }

      // Skip lace; treat rest as UTF-8 cue text (ffmpeg WebVTT-in-WebM).
      let
        text = readString(payloadStart, end).replace(/\0/g, '').trim();

      // WebM WebVTT block may include cue id / settings lines before payload.
      const
        lines = text.split(/\r?\n/).filter((line) => line.length > 0);

      if (lines.length > 0) {
        text = lines[lines.length - 1];
      }

      const
        absTicks = clusterTs + signed,
        timeStamp = Math.round((absTicks * timecodeScale) / 1e6),
        cue: {text: string; timeStamp: number; end?: number} = {text, timeStamp};

      if (duration != null) {
        cue.end = timeStamp + Math.round((duration * timecodeScale) / 1e6);
      }

      if (text) {
        track.cues.push(cue);
      }
    };

    const walkBlockGroup = (start: number, end: number, clusterTs: number) => {
      let
        blockStart = -1,
        blockEnd = -1,
        duration: number | undefined,
        at = start;

      while (at < end) {
        const el = readElement(at, end);

        if (!el) {
          break;
        }

        if (el.id === ID.Block) {
          blockStart = el.dataStart;
          blockEnd = el.dataEnd;
        } else if (el.id === ID.BlockDuration) {
          duration = readUint(el.dataStart, el.dataEnd);
        }

        at = el.dataEnd;
      }

      if (blockStart >= 0) {
        parseBlock(blockStart, blockEnd, clusterTs, duration);
      }
    };

    const walkCluster = (start: number, end: number) => {
      let
        clusterTs = 0,
        at = start;

      while (at < end) {
        const el = readElement(at, end);

        if (!el) {
          break;
        }

        if (el.id === ID.Timestamp) {
          clusterTs = readUint(el.dataStart, el.dataEnd);
        } else if (el.id === ID.SimpleBlock) {
          parseBlock(el.dataStart, el.dataEnd, clusterTs);
        } else if (el.id === ID.BlockGroup) {
          walkBlockGroup(el.dataStart, el.dataEnd, clusterTs);
        }

        at = el.dataEnd;
      }
    };

    const walkSegment = (start: number, end: number) => {
      let at = start;

      while (at < end) {
        const el = readElement(at, end);

        if (!el) {
          break;
        }

        if (el.id === ID.Info) {
          let infoAt = el.dataStart;

          while (infoAt < el.dataEnd) {
            const child = readElement(infoAt, el.dataEnd);

            if (!child) {
              break;
            }

            if (child.id === ID.TimecodeScale) {
              timecodeScale = readUint(child.dataStart, child.dataEnd) || timecodeScale;
            }

            infoAt = child.dataEnd;
          }
        } else if (el.id === ID.Tracks) {
          let tracksAt = el.dataStart;

          while (tracksAt < el.dataEnd) {
            const child = readElement(tracksAt, el.dataEnd);

            if (!child) {
              break;
            }

            if (child.id === ID.TrackEntry) {
              walkTrackEntry(child.dataStart, child.dataEnd);
            }

            tracksAt = child.dataEnd;
          }
        } else if (el.id === ID.Tags) {
          walkTags(el.dataStart, el.dataEnd);
        } else if (el.id === ID.Cluster) {
          walkCluster(el.dataStart, el.dataEnd);
        }

        at = el.dataEnd;
      }
    };

    // Top-level: EBML then Segment
    while (offset < size) {
      const el = readElement(offset, size);

      if (!el) {
        break;
      }

      if (el.id === ID.Segment) {
        walkSegment(el.dataStart, el.dataEnd);
      }

      offset = el.dataEnd;
    }

    const
      webvttFrames = Object.keys(webvttByNumber)
        .map((key) => webvttByNumber[Number(key)])
        .filter((track) => track.cues.length > 0)
        .map((track) => ({
          id: 'WEBVTT',
          description: track.name,
          data: {
            kind: track.kind,
            language: track.language,
            name: track.name,
            cues: track.cues.slice().sort((a, b) => a.timeStamp - b.timeStamp)
          }
        })),
      tags: TagType['tags'] = {...simpleTags};

    if (webvttFrames.length === 1) {
      tags.WEBVTT = webvttFrames[0];
    } else if (webvttFrames.length > 1) {
      tags.WEBVTT = webvttFrames;
    }

    Object.keys(SHORTCUTS).forEach((shortcut) => {
      const
        native = simpleTags[SHORTCUTS[shortcut]];

      if (native) {
        tags[shortcut] = native.data;
      }
    });

    return {
      type: 'WebM',
      tags
    } as TagType;
  }

  getShortcuts(): {[key: string]: string | Array<string>} {
    return SHORTCUTS;
  }
}

export = WebMTagReader;
