import type MediaFileReader from "./MediaFileReader";

export type CallbackType<T = unknown> = {
  onSuccess: (data: T) => void;
  onError?: (error: Record<string, unknown>) => void;
};

export type LoadCallbackType = {
  onSuccess: () => void;
  onError?: (error: Record<string, unknown>) => void;
};

export type CharsetType =
  | "utf-16"
  | "utf-16le"
  | "utf-16be"
  | "utf-8"
  | "iso-8859-1";

export type ByteRange = {
  offset: number;
  length: number;
};

export type DataType = Array<number> | Uint8Array | string;

export type ChunkType = {
  offset: number;
  data: DataType;
};

export type Byte = number;

export type ByteArray = Byte[];

export type FrameReaderSignature = (
  offset: number,
  length: number,
  data: MediaFileReader,
  flags: Record<string, unknown> | null,
  id3header?: TagHeader
) => unknown;

export type TagFrames = { [key: string]: TagFrame | TagFrame[] };

export type TagFrame = {
  id: string;
  size: number;
  description: string;
  data: unknown;
};

export type TagFrameHeader = {
  id: string;
  size: number;
  headerSize: number;
  flags: TagFrameFlags | null | undefined;
};

export type TagFrameFlags = {
  message: {
    tag_alter_preservation: boolean;
    file_alter_preservation: boolean;
    read_only: boolean;
  };
  format: {
    grouping_identity: boolean;
    compression: boolean;
    encryption: boolean;
    unsynchronisation: boolean;
    data_length_indicator: boolean;
  };
};

export type TagHeader = {
  version: string;
  major: number;
  revision: number;
  flags: TagHeaderFlags;
  size: number;
};

export type TagHeaderFlags = {
  unsynchronisation: boolean;
  extended_header: boolean;
  experimental_indicator: boolean;
  footer_present: boolean;
};

export type TagType = {
  type: string;
  tags: { [key: string]: FrameType | ShortcutType };
};

export type FrameType = {
  id: string;
  description: string;
  data: unknown;
};

type ShortcutType = unknown;
