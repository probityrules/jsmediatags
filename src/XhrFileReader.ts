"use strict";

const ChunkedFileData = require("./ChunkedFileData");
const MediaFileReader = require("./MediaFileReader");

const CHUNK_SIZE = 1024;

import type { LoadCallbackType } from "./types";

type XhrCallbacks = {
  onSuccess: (xhr: XMLHttpRequest) => void;
  onError?: (error: Record<string, unknown>) => void;
};

type ContentRangeType = {
  firstBytePosition: number | null | undefined;
  lastBytePosition: number | null | undefined;
  instanceLength: number | null | undefined;
};

type XhrConfig = {
  avoidHeadRequests: boolean;
  disallowedXhrHeaders: string[];
  timeoutInSec: number;
};

class XhrFileReader extends MediaFileReader {
  static _config: XhrConfig = {
    avoidHeadRequests: false,
    disallowedXhrHeaders: [],
    timeoutInSec: 30,
  };

  private _url: string;
  private _fileData: InstanceType<typeof ChunkedFileData>;

  constructor(url: string) {
    super();
    this._url = url;
    this._fileData = new ChunkedFileData();
  }

  static canReadFile(file: unknown): boolean {
    return typeof file === "string" && /^[a-z]+:\/\//i.test(file);
  }

  static setConfig(config: Partial<XhrConfig> & Record<string, unknown>): void {
    for (const key in config) {
      if (Object.prototype.hasOwnProperty.call(config, key)) {
        (XhrFileReader._config as Record<string, unknown>)[key] = config[key];
      }
    }

    const disallowedXhrHeaders = XhrFileReader._config.disallowedXhrHeaders;
    for (let i = 0; i < disallowedXhrHeaders.length; i++) {
      disallowedXhrHeaders[i] = disallowedXhrHeaders[i].toLowerCase();
    }
  }

  _init(callbacks: LoadCallbackType): void {
    if (XhrFileReader._config.avoidHeadRequests) {
      this._fetchSizeWithGetRequest(callbacks);
    } else {
      this._fetchSizeWithHeadRequest(callbacks);
    }
  }

  _fetchSizeWithHeadRequest(callbacks: LoadCallbackType): void {
    const self = this;

    this._makeXHRRequest("HEAD", null, {
      onSuccess: function (xhr: XMLHttpRequest) {
        const contentLength = self._parseContentLength(xhr);
        if (contentLength) {
          self._size = contentLength;
          callbacks.onSuccess();
        } else {
          self._fetchSizeWithGetRequest(callbacks);
        }
      },
      onError: callbacks.onError,
    });
  }

  _fetchSizeWithGetRequest(callbacks: LoadCallbackType): void {
    const self = this;
    const range = this._roundRangeToChunkMultiple([0, 0]);

    this._makeXHRRequest("GET", range, {
      onSuccess: function (xhr: XMLHttpRequest) {
        const contentRange = self._parseContentRange(xhr);
        const data = self._getXhrResponseContent(xhr);

        if (contentRange) {
          if (contentRange.instanceLength == null) {
            self._fetchEntireFile(callbacks);
            return;
          }
          self._size = contentRange.instanceLength!;
        } else {
          self._size = data.length;
        }

        self._fileData.addData(0, data);
        callbacks.onSuccess();
      },
      onError: callbacks.onError,
    });
  }

  _fetchEntireFile(callbacks: LoadCallbackType): void {
    const self = this;
    this._makeXHRRequest("GET", null, {
      onSuccess: function (xhr: XMLHttpRequest) {
        const data = self._getXhrResponseContent(xhr);
        self._size = data.length;
        self._fileData.addData(0, data);
        callbacks.onSuccess();
      },
      onError: callbacks.onError,
    });
  }

  _getXhrResponseContent(xhr: XMLHttpRequest): string {
    const legacy = xhr as XMLHttpRequest & { responseBody?: string };
    return legacy.responseBody || xhr.responseText || "";
  }

  _parseContentLength(xhr: XMLHttpRequest): number | null | undefined {
    const contentLength = this._getResponseHeader(xhr, "Content-Length");

    if (contentLength == null) {
      return null;
    }

    return parseInt(contentLength, 10);
  }

  _parseContentRange(xhr: XMLHttpRequest): ContentRangeType | null {
    const contentRange = this._getResponseHeader(xhr, "Content-Range");

    if (contentRange) {
      const parsedContentRange = contentRange.match(
        /bytes (\d+)-(\d+)\/(?:(\d+)|\*)/i
      );
      if (!parsedContentRange) {
        throw new Error(
          "FIXME: Unknown Content-Range syntax: " + contentRange
        );
      }

      return {
        firstBytePosition: parseInt(parsedContentRange[1], 10),
        lastBytePosition: parseInt(parsedContentRange[2], 10),
        instanceLength: parsedContentRange[3]
          ? parseInt(parsedContentRange[3], 10)
          : null,
      };
    } else {
      return null;
    }
  }

  loadRange(range: [number, number], callbacks: LoadCallbackType): void {
    const self = this;

    if (
      self._fileData.hasDataRange(
        range[0],
        Math.min(self._size, range[1])
      )
    ) {
      setTimeout(callbacks.onSuccess, 1);
      return;
    }

    range = this._roundRangeToChunkMultiple(range);
    range[1] = Math.min(self._size, range[1]);

    this._makeXHRRequest("GET", range, {
      onSuccess: function (xhr: XMLHttpRequest) {
        const data = self._getXhrResponseContent(xhr);
        self._fileData.addData(range[0], data);
        callbacks.onSuccess();
      },
      onError: callbacks.onError,
    });
  }

  _roundRangeToChunkMultiple(range: [number, number]): [number, number] {
    const length = range[1] - range[0] + 1;
    const newLength = Math.ceil(length / CHUNK_SIZE) * CHUNK_SIZE;
    return [range[0], range[0] + newLength - 1];
  }

  _makeXHRRequest(
    method: string,
    range: [number, number] | null,
    callbacks: XhrCallbacks
  ): void {
    const xhr = this._createXHRObject();
    xhr.open(method, this._url);

    const onXHRLoad = function () {
      if (xhr.status === 200 || xhr.status === 206) {
        callbacks.onSuccess(xhr);
      } else if (callbacks.onError) {
        callbacks.onError({
          type: "xhr",
          info: "Unexpected HTTP status " + xhr.status + ".",
          xhr: xhr,
        });
      }
    };

    if (typeof xhr.onload !== "undefined") {
      xhr.onload = onXHRLoad;
      xhr.onerror = function () {
        if (callbacks.onError) {
          callbacks.onError({
            type: "xhr",
            info: "Generic XHR error, check xhr object.",
            xhr: xhr,
          });
        }
      };
    } else {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          onXHRLoad();
        }
      };
    }

    if (XhrFileReader._config.timeoutInSec) {
      xhr.timeout = XhrFileReader._config.timeoutInSec * 1000;
      xhr.ontimeout = function () {
        if (callbacks.onError) {
          callbacks.onError({
            type: "xhr",
            info:
              "Timeout after " +
              xhr.timeout / 1000 +
              "s. Use jsmediatags.Config.setXhrTimeout to override.",
            xhr: xhr,
          });
        }
      };
    }

    xhr.overrideMimeType("text/plain; charset=x-user-defined");
    if (range) {
      this._setRequestHeader(
        xhr,
        "Range",
        "bytes=" + range[0] + "-" + range[1]
      );
    }
    this._setRequestHeader(
      xhr,
      "If-Modified-Since",
      "Sat, 01 Jan 1970 00:00:00 GMT"
    );
    xhr.send(null);
  }

  _setRequestHeader(
    xhr: XMLHttpRequest,
    headerName: string,
    headerValue: string
  ): void {
    if (
      XhrFileReader._config.disallowedXhrHeaders.indexOf(
        headerName.toLowerCase()
      ) < 0
    ) {
      xhr.setRequestHeader(headerName, headerValue);
    }
  }

  _hasResponseHeader(xhr: XMLHttpRequest, headerName: string): boolean {
    const allResponseHeaders = xhr.getAllResponseHeaders();

    if (!allResponseHeaders) {
      return false;
    }

    const headers = allResponseHeaders.split("\r\n");
    const headerNames = [];
    for (let i = 0; i < headers.length; i++) {
      headerNames[i] = headers[i].split(":")[0].toLowerCase();
    }

    return headerNames.indexOf(headerName.toLowerCase()) >= 0;
  }

  _getResponseHeader(xhr: XMLHttpRequest, headerName: string): string | null {
    if (!this._hasResponseHeader(xhr, headerName)) {
      return null;
    }

    return xhr.getResponseHeader(headerName);
  }

  getByteAt(offset: number): number {
    return this._fileData.getByteAt(offset) & 0xff;
  }

  _isWebWorker(): boolean {
    return (
      typeof WorkerGlobalScope !== "undefined" &&
      typeof self !== "undefined" &&
      self instanceof WorkerGlobalScope
    );
  }

  _createXHRObject(): XMLHttpRequest {
    if (typeof window === "undefined" && !this._isWebWorker()) {
      const xhr2 = require("xhr2") as typeof import("xhr2");
      return new xhr2.XMLHttpRequest();
    }

    if (typeof XMLHttpRequest !== "undefined") {
      return new XMLHttpRequest();
    }

    throw new Error("XMLHttpRequest is not supported");
  }
}

export = XhrFileReader;
