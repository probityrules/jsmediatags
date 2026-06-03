"use strict";

const MediaTagReader = require("./MediaTagReader");
const MediaFileReader = require("./MediaFileReader");

import type { LoadCallbackType, ByteRange, TagType } from "./types";

class ID3v1TagReader extends MediaTagReader {
  static getTagIdentifierByteRange(): ByteRange {
    return {
      offset: -128,
      length: 128,
    };
  }

  static canReadTagFormat(tagIdentifier: Array<number>): boolean {
    const id = String.fromCharCode.apply(String, tagIdentifier.slice(0, 3));
    return id === "TAG";
  }

  _loadData(
    mediaFileReader: InstanceType<typeof MediaFileReader>,
    callbacks: LoadCallbackType
  ): void {
    const fileSize = mediaFileReader.getSize();
    mediaFileReader.loadRange([fileSize - 128, fileSize - 1], callbacks);
  }

  _parseData(data: InstanceType<typeof MediaFileReader>, tags: string[] | null): TagType {
    const offset = data.getSize() - 128;

    const title = data.getStringWithCharsetAt(offset + 3, 30).toString();
    const artist = data.getStringWithCharsetAt(offset + 33, 30).toString();
    const album = data.getStringWithCharsetAt(offset + 63, 30).toString();
    const year = data.getStringWithCharsetAt(offset + 93, 4).toString();

    const trackFlag = data.getByteAt(offset + 97 + 28);
    let track = data.getByteAt(offset + 97 + 29);
    let version: string;
    let comment: string;
    if (trackFlag == 0 && track != 0) {
      version = "1.1";
      comment = data.getStringWithCharsetAt(offset + 97, 28).toString();
    } else {
      version = "1.0";
      comment = data.getStringWithCharsetAt(offset + 97, 30).toString();
      track = 0;
    }

    const genreIdx = data.getByteAt(offset + 97 + 30);
    const genre = genreIdx < 255 ? GENRES[genreIdx] : "";

    const tag = {
      type: "ID3",
      version: version,
      tags: {
        title: title,
        artist: artist,
        album: album,
        year: year,
        comment: comment,
        genre: genre,
        ...(track ? { track: track } : {}),
      },
    };

    return tag as TagType;
  }
}

const GENRES = [
  "Blues",
  "Classic Rock",
  "Country",
  "Dance",
  "Disco",
  "Funk",
  "Grunge",
  "Hip-Hop",
  "Jazz",
  "Metal",
  "New Age",
  "Oldies",
  "Other",
  "Pop",
  "R&B",
  "Rap",
  "Reggae",
  "Rock",
  "Techno",
  "Industrial",
  "Alternative",
  "Ska",
  "Death Metal",
  "Pranks",
  "Soundtrack",
  "Euro-Techno",
  "Ambient",
  "Trip-Hop",
  "Vocal",
  "Jazz+Funk",
  "Fusion",
  "Trance",
  "Classical",
  "Instrumental",
  "Acid",
  "House",
  "Game",
  "Sound Clip",
  "Gospel",
  "Noise",
  "AlternRock",
  "Bass",
  "Soul",
  "Punk",
  "Space",
  "Meditative",
  "Instrumental Pop",
  "Instrumental Rock",
  "Ethnic",
  "Gothic",
  "Darkwave",
  "Techno-Industrial",
  "Electronic",
  "Pop-Folk",
  "Eurodance",
  "Dream",
  "Southern Rock",
  "Comedy",
  "Cult",
  "Gangsta",
  "Top 40",
  "Christian Rap",
  "Pop/Funk",
  "Jungle",
  "Native American",
  "Cabaret",
  "New Wave",
  "Psychadelic",
  "Rave",
  "Showtunes",
  "Trailer",
  "Lo-Fi",
  "Tribal",
  "Acid Punk",
  "Acid Jazz",
  "Polka",
  "Retro",
  "Musical",
  "Rock & Roll",
  "Hard Rock",
  "Folk",
  "Folk-Rock",
  "National Folk",
  "Swing",
  "Fast Fusion",
  "Bebob",
  "Latin",
  "Revival",
  "Celtic",
  "Bluegrass",
  "Avantgarde",
  "Gothic Rock",
  "Progressive Rock",
  "Psychedelic Rock",
  "Symphonic Rock",
  "Slow Rock",
  "Big Band",
  "Chorus",
  "Easy Listening",
  "Acoustic",
  "Humour",
  "Speech",
  "Chanson",
  "Opera",
  "Chamber Music",
  "Sonata",
  "Symphony",
  "Booty Bass",
  "Primus",
  "Porn Groove",
  "Satire",
  "Slow Jam",
  "Club",
  "Tango",
  "Samba",
  "Folklore",
  "Ballad",
  "Power Ballad",
  "Rhythmic Soul",
  "Freestyle",
  "Duet",
  "Punk Rock",
  "Drum Solo",
  "Acapella",
  "Euro-House",
  "Dance Hall",
];

export = ID3v1TagReader;
