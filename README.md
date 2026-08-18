# JS MediaTags

Read ID3, MP4, and FLAC metadata from audio files in Node.js, browsers, and React Native. Successor to [JavaScript-ID3-Reader](https://github.com/aadsm/JavaScript-ID3-Reader).

This repository is a **fork and modernization** of [aadsm/jsmediatags](https://github.com/aadsm/jsmediatags), the original library and its maintenance home. Development here targets **4.0.0** (TypeScript, updated tooling, and packaging). It is not guaranteed to be merged upstream; treat [aadsm/jsmediatags](https://github.com/aadsm/jsmediatags) as the canonical project history and this fork as an upgraded continuation.

**npm:** [`@probityrules/jsmediatags`](https://www.npmjs.com/package/@probityrules/jsmediatags) (published from this fork; includes compiled `build/` and browser bundle only, not `src/`).

**Requirements:** Node.js **18+**. See [CHANGELOG.md](CHANGELOG.md) for **4.0.0** breaking changes if upgrading from 3.x.

## Donations

A few people have asked me about donations (or even crowdfunding). I would prefer you to consider making a donation to the ["Girls Who Code" NPO](https://www.classy.org/checkout/donation?eid=77372). If you do please send me a message so I can add you as a contributor.

## [Contributors](CONTRIBUTORS.md)

## [Contributing](CONTRIBUTING.md)

## Current Support

* File Readers
  * NodeJS
  * XMLHttpRequest
  * Blob
  * File
  * Buffers/Arrays
  * React Native
* Tag Readers
  * ID3v1
  * ID3v2 (with unsynchronisation support!)
  * MP4
  * FLAC

## How to use

### Node.js

```bash
npm install @probityrules/jsmediatags
```

The published package includes compiled JavaScript and TypeScript declarations (`build/jsmediatags.d.ts`). Source (`src/`) is not shipped on npm.

#### Callback API

```javascript
// Simple API - will fetch all tags
var jsmediatags = require("@probityrules/jsmediatags");

jsmediatags.read("./music-file.mp3", {
  onSuccess: function(tag) {
    console.log(tag);
  },
  onError: function(error) {
    console.log(':(', error.type, error.info);
  }
});
```

```javascript
// Advanced API
var jsmediatags = require("@probityrules/jsmediatags");

new jsmediatags.Reader("http://www.example.com/music-file.mp3")
  .setTagsToRead(["title", "artist"])
  .read({
    onSuccess: function(tag) {
      console.log(tag);
    },
    onError: function(error) {
      console.log(':(', error.type, error.info);
    }
  });
```

#### Promise API

Omit callbacks to get a `Promise`, or call `readAsync` explicitly. Rejections use the same `{ type, info, ... }` objects as `onError`.

```javascript
const jsmediatags = require("@probityrules/jsmediatags");

// read(location) without callbacks
const tag = await jsmediatags.read("./music-file.mp3");

// readAsync(location)
const tag2 = await jsmediatags.readAsync("./music-file.mp3");

// Reader instance
const tag3 = await new jsmediatags.Reader("./music-file.mp3")
  .setTagsToRead(["title", "artist"])
  .read();
```

```javascript
try {
  const tag = await jsmediatags.readAsync("./music-file.mp3");
  console.log(tag.tags.title);
} catch (error) {
  console.log(error.type, error.info);
}
```

### Browser

Copy [`dist/jsmediatags.min.js`](https://github.com/aadsm/jsmediatags/blob/master/dist/jsmediatags.min.js) into your app and load it with a script tag. The bundle is also on [cdnjs](https://cdnjs.com/libraries/jsmediatags).

The browser build is an **IIFE** that assigns a global `jsmediatags` object:

```html
<script src="jsmediatags.min.js"></script>
<script>
  jsmediatags.read(fileInput.files[0]).then(function(tag) {
    console.log(tag);
  });
</script>
```

When installed via npm, bundlers can `require("@probityrules/jsmediatags")` or `import jsmediatags from "@probityrules/jsmediatags"`. Node resolves the compiled `build/` entry; browser bundlers resolve `dist/jsmediatags.browser.mjs` / `.cjs` (proper module exports). For a script tag, use `@probityrules/jsmediatags/browser` or copy `dist/jsmediatags.min.js` (IIFE global).

It supports loading files from remote hosts, Blob and File objects:

```javascript
// Callback API
jsmediatags.read("http://www.example.com/music-file.mp3", {
  onSuccess: function(tag) {
    console.log(tag);
  },
  onError: function(error) {
    console.log(error);
  }
});

// Promise API
const tag = await jsmediatags.read("https://www.example.com/music-file.mp3");
```

Note that the URI has to include the scheme (e.g.: https://), as relative URIs are not supported.

```javascript
// From Blob
jsmediatags.read(blob, ...);
```

```javascript
// From File
inputTypeFile.addEventListener("change", function(event) {
  var file = event.target.files[0];
  jsmediatags.read(file, ...);
}, false);
```

### React Native

Install the library, then the optional peer dependencies used by the React Native file reader:

```bash
npm install @probityrules/jsmediatags
npm install buffer react-native-fs
```

(`buffer` `^6.0.3` and `react-native-fs` are declared as optional `peerDependencies` in `package.json`.)

Usage is the same as in Node.js:

```js
const jsmediatags = require('@probityrules/jsmediatags');

// Callback API
new jsmediatags.Reader('/path/to/song.mp3')
  .read({
    onSuccess: (tag) => {
      console.log(tag);
    },
    onError: (error) => {
      console.log(error.type, error.info);
    }
  });

// Promise API
const tag = await jsmediatags.readAsync('/path/to/song.mp3');
// or
const tag2 = await new jsmediatags.Reader('/path/to/song.mp3').read();
```

### Articles

* [Cordova : lire les metadatas des mp3s avec jsmediatags](http://blog.luce.pro/2016/02/28/Phonegap-lire-les-metadatas-des-mp3s-avec-jsmediatags/)

## Documentation

### The Output

This is an example of the object passed to the `jsmediatags.read`'s `onSuccess` callback.

#### ID3v2

```javascript
{
  type: "ID3",
  version: "2.4.0",
  major: 4,
  revision: 0,
  tags: {
    artist: "Sam, The Kid",
    album: "Pratica(mente)",
    track: "12",
    TPE1: {
      id: "TPE1",
      size: 14,
      description: "Lead performer(s)/Soloist(s)",
      data: "Sam, The Kid"
    },
    TALB: {
      id: "TALB",
      size: 16,
      description: "Album/Movie/Show title",
      data: "Pratica(mente)"
    },
    TRCK: {
      id: "TRCK",
      size: 3,
      description: "Track number/Position in set",
      data: "12",
    }
  },
  size: 34423,
  flags: {
    unsynchronisation: false,
    extended_header: false,
    experimental_indicator: false,
    footer_present: false
  }
}
```

#### MP4

```javascript
{
  type: "MP4",
  ftyp: "M4A",
  version: 0,
  tags: {
    "©too": {
      id: "©too",
      size: 35,
      description: 'Encoding Tool',
      data: 'Lavf53.24.2'
    }
  }
}
```

#### FLAC

```javascript
{
  type: "FLAC",
  version: "1",
  tags: {
    title: "16/12/95",
    artist: "Sam, The Kid",
    album: "Pratica(mente)",
    track: "12",
    picture: ...
  }
}
```

The `tags` property includes all tags that were found or specified to be read.
Since each tag type (e.g.: ID3, MP4) uses different tag names for the same type of data (e.g.: the artist name) the most common tags are also available under human readable names (aka shortcuts). In this example, `artist` will point to `TPE1.data`, `album` to `TALB.data` and so forth.

The expected tag object depends on the type of tag read (ID3, MP4, etc.) but they all share a common structure:

```javascript
{
  type: <the tag type: ID3, MP4, etc.>
  tags: {
    <shortcut name>: <points to a tags data>
    <tag name>: {
      id: <tag name>,
      data: <the actual tag data>
    }
  }
}
```

### Shortcuts

These are the supported shortcuts.

* `title`
* `artist`
* `album`
* `year`
* `comment`
* `track`
* `genre`
* `picture`
* `lyrics`

### Picture data

The `picture` tag contains an array buffer of all the bytes of the album artwork image as well as the content type of the image. The data can be converted and displayed as an image using:

```javascript
const picture = result.tags.picture;
let base64String = "";
for (let i = 0; i < picture.data.length; i++) {
  base64String += String.fromCharCode(picture.data[i]);
}
img.src = `data:${picture.format};base64,${window.btoa(base64String)}`;
```

### HTTP Access Control (CORS)

When using HTTP [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) requests you need to make sure that the server is configured to receive `If-Modified-Since` and `Range` headers with the request.
This can be configured by returning the `Access-Control-Allow-Headers` HTTP header with the OPTIONS request response.

Similarly, you should also allow for the browser to read the `Content-Length` and `Content-Range` headers. This can be configured by returning the  `Access-Control-Expose-Headers` HTTP header.

In short, the following headers are expected:

```http
Access-Control-Allow-Headers: If-Modified-Since, Range
Access-Control-Expose-Headers: Content-Length, Content-Range
```

This library still works without these options configured on the server. However it will download the entire file instead of only the necessary bytes for reading the tags.

### File and Tag Readers

This library uses file readers (MediaFileReader API) to read the file itself and media tag readers (MediaTagReader API) to parse the tags in the file.

By default the library will automatically pick the most appropriate file reader depending on the file location. In the common case this will be the URL or local path where the file is located.

A similar approach is taken for the tag reader. The most appropriate tag reader will be selected depending on the tag signature found in the file.

However, you can specify exactly which file reader or tag reader to use using the advanced API.

New file and tag readers can be implemented by extending the MediaFileReader and MediaTagReader classes. Check the **Development** section below for more information.

### TypeScript

Types are published with the package. Import the default export and optionally use tag types from the compiled declarations:

```typescript
import jsmediatags from "@probityrules/jsmediatags";
import type { TagType } from "@probityrules/jsmediatags/types";

const tag: TagType = await jsmediatags.readAsync("./music-file.mp3");
```

When developing this repo locally, shared source types live in [`src/types.ts`](src/types.ts).

### Reference

* `jsmediatags.read(location, callbacks?)` — Read tags from a file path, URL, Blob, or Buffer. Returns `void` with callbacks, or `Promise<Tag>` when callbacks are omitted.
* `jsmediatags.readAsync(location)` — Same as `read(location)` without callbacks.

* `jsmediatags.Reader`
  * `setTagsToRead(tags: Array<string>)` — Specify which tags to read
  * `setFileReader(fileReader: typeof MediaFileReader)` — Use this particular file reader
  * `setTagReader(tagReader: typeof MediaTagReader)` — Use this particular tag reader
  * `read(callbacks?)` — Read the tags. With callbacks returns `void`; without callbacks returns `Promise<Tag>`.
  * `readAsync()` — Same as `read()` without callbacks.

* `jsmediatags.Config`
  * `addFileReader(fileReader: typeof MediaFileReader)` - Add a new file reader to the automatic detection system.
  * `addTagReader(tagReader: typeof MediaTagReader)` - Add a new tag reader to the automatic detection system.
  * `setDisallowedXhrHeaders(disallowedXhrHeaders: Array<string>)` - Prevent the library from using specific http headers. This can be useful when dealing with CORS enabled servers you don't control.
  * `setXhrTimeoutInSec(timeoutInSec: number)` - Sets the timeout time for http requests. Set it to 0 for no timeout at all. It defaults to 30s.

## Development

Source code is written in TypeScript. Run `npm run build` to compile the Node/CommonJS output into the `build` directory.

### NodeJS Development

Run `npm run build` to generate proper JavaScript code into the `build` directory.

```javascript
var NodeFileReader = require('./build/NodeFileReader');
var ID3v2TagReader = require('./build/ID3v2TagReader');
...
```

Run `npm run watch` to automatically recompile the source code whenever a file is changed.

### Browser Development

Run `npm run dist` to generate browser bundles with esbuild: `dist/jsmediatags.js` / `dist/jsmediatags.min.js` (IIFE globals for script tags), plus `dist/jsmediatags.browser.mjs` / `.cjs` (module builds used by bundlers).

Run `npm run dist-watch` to rebuild the browser bundle whenever a source file changes.

### New File Readers

Extend the `MediaFileReader` class to implement a new file reader. Methods to implement are:

* init
* loadRange
* getBytesLoaded
* getByteAt

Current Implementations:

* [NodeFileReader](https://github.com/aadsm/jsmediatags/blob/master/src/NodeFileReader.ts) (NodeJS)
* [XhrFileReader](https://github.com/aadsm/jsmediatags/blob/master/src/XhrFileReader.ts) (Browser and NodeJS)
* [BlobFileReader](https://github.com/aadsm/jsmediatags/blob/master/src/BlobFileReader.ts) (Blob and File)

### New Tag Readers

Extend the `MediaTagReader` class to implement a new tag reader. Methods to implement are:

* getTagIdentifierByteRange
* canReadTagFormat
* \_loadData
* \_parseData

Current Implementations:

* [ID3v1TagReader](https://github.com/aadsm/jsmediatags/blob/master/src/ID3v1TagReader.ts)
* [ID3v2TagReader](https://github.com/aadsm/jsmediatags/blob/master/src/ID3v2TagReader.ts)
* [MP4TagReader](https://github.com/aadsm/jsmediatags/blob/master/src/MP4TagReader.ts)
* [FLACTagReader](https://github.com/aadsm/jsmediatags/blob/master/src/FLACTagReader.ts)

### Publishing

The package is published to npm as **`@probityrules/jsmediatags`**. Only distributable artifacts are included (`build/`, `dist/jsmediatags.min.js`, docs); `src/` and `test/` stay in the repository only.

```bash
npm run build && npm run dist   # prepublishOnly runs this automatically
npm publish --access public
```

### Unit Testing

Tests live in the [`test/`](test/) directory. Run `npm test` to execute the suite, or `npm run test:watch` during development. CI runs `npm run build`, `npm run dist`, and `npm test` on every push and pull request.

## Upgrading from 3.x to 4.0

4.0 is a modernization release. The tag-reading API is backward compatible if you keep using callbacks, but packaging and runtime expectations changed:

| Topic | 3.x | 4.0 |
| --- | --- | --- |
| Node.js | Older versions often worked | **Node 18+** required |
| npm `main` | Previous layout | `build/jsmediatags.js` (prebuilt on publish) |
| Browser bundle | Browserify / UMD-style | **esbuild IIFE** (`dist/jsmediatags.min.js`) |
| Source | Flow / JavaScript | **TypeScript** |
| Promise API | Not built in | `read()` / `readAsync()` without callbacks |
| React Native extras | `optionalPeerDependencies` | Standard **optional** `peerDependencies` |

See [CHANGELOG.md](CHANGELOG.md) for the full list.

## JavaScript-ID3-Reader

If you want to migrate your project from [JavaScript-ID3-Reader](https://github.com/aadsm/JavaScript-ID3-Reader) to `jsmediatags` use the following guiding examples:

### All tags

**JavaScript-ID3-Reader:**

```javascript
ID3.loadTags("filename.mp3", function() {
  var tags = ID3.getAllTags("filename.mp3");
  alert(tags.artist + " - " + tags.title + ", " + tags.album);
});
```

**jsmediatags:**

```javascript
jsmediatags.read("filename.mp3", {
  onSuccess: function(tag) {
    var tags = tag.tags;
    alert(tags.artist + " - " + tags.title + ", " + tags.album);
  }
});
```

### Specific tags

**JavaScript-ID3-Reader:**

```javascript
ID3.loadTags("filename.mp3", function() {
  var tags = ID3.getAllTags("filename.mp3");
  alert(tags.COMM.data + " - " + tags.TCON.data + ", " + tags.WXXX.data);
},
{tags: ["COMM", "TCON", "WXXX"]});
```

**jsmediatags:**

```javascript
new jsmediatags.Reader("filename.mp3")
  .setTagsToRead(["COMM", "TCON", "WXXX"])
  .read({
    onSuccess: function(tag) {
      var tags = tag.tags;
      alert(tags.COMM.data + " - " + tags.TCON.data + ", " + tags.WXXX.data);
    }
  });
```

### Error handling

**JavaScript-ID3-Reader:**

```javascript
ID3.loadTags("http://localhost/filename.mp3", function() {
  var tags = ID3.getAllTags("http://localhost/filename.mp3");
  alert(tags.comment + " - " + tags.track + ", " + tags.lyrics);
},
{
  tags: ["comment", "track", "lyrics"],
  onError: function(reason) {
    if (reason.error === "xhr") {
      console.log("There was a network error: ", reason.xhr);
    }
  }
});
```

**jsmediatags:**

```javascript
new jsmediatags.Reader("filename.mp3")
  .setTagsToRead(["comment", "track", "lyrics"])
  .read({
    onSuccess: function(tag) {
      var tags = tag.tags;
      alert(tags.comment + " - " + tags.track + ", " + tags.lyrics);
    },
    onError: function(error) {
      if (error.type === "xhr") {
        console.log("There was a network error: ", error.xhr);
      }
    }
  });
```

## Goals

* Improve the API of JavaScript-ID3-Reader
* Readable TypeScript source with published types and tests
* Support Node.js, browsers, and React Native
