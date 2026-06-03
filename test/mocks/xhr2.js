const xhr2Mock = jest.genMockFromModule("xhr2");

let _mockUrls = {};

function __setMockUrls(newMockUrls) {
  _mockUrls = {};

  for (const url in newMockUrls) {
    _mockUrls[url] = newMockUrls[url];
  }
}

function isRangeDisabled(url) {
  return !!(_mockUrls[url] || {}).disableRange;
}

function getUrlContents(url, range) {
  const urlData = _mockUrls[url];

  if (urlData == null) {
    return null;
  }

  if (urlData.disableRange) {
    range = null;
  }

  let contents;
  if (typeof urlData === "string") {
    contents = urlData;
  } else {
    contents = urlData.contents;
  }

  return range ? contents.slice(range[0], range[1] + 1) : contents;
}

function getUrlFileLength(url) {
  const urlData = _mockUrls[url];

  if (urlData == null || urlData.unknownLength) {
    return null;
  }

  return getUrlContents(url).length;
}

function isHeaderDisallowed(url, header) {
  const urlData = _mockUrls[url];
  return (
    urlData != null &&
    (urlData.disallowedHeaders || []).indexOf(header) >= 0
  );
}

function getUrlContentLength(url, range) {
  if (isHeaderDisallowed(url, "content-length")) {
    return null;
  }

  return getUrlContents(url, range).length;
}

function getUrlStatusCode(url) {
  const urlData = _mockUrls[url];

  if (urlData == null) {
    return 404;
  } else {
    return urlData.statusCode || 200;
  }
}

function getTimeout(url) {
  const urlData = _mockUrls[url];
  return urlData ? urlData.timeout : 0;
}

function XMLHttpRequestMock() {
  let _url;
  let _range;

  this.onload = function () {};
  this.open = jest.fn().mockImplementation(function (method, url) {
    _url = url;
    _range = null;
  });
  this.overrideMimeType = jest.fn();
  this.setRequestHeader = jest.fn().mockImplementation(
    function (headerName, headerValue) {
      if (headerName.toLowerCase() === "range") {
        const matches = headerValue.match(/bytes=(\d+)-(\d+)/);
        _range = [Number(matches[1]), Number(matches[2])];
      }
    }
  );
  this.getResponseHeader = jest.fn().mockImplementation(
    function (headerName) {
      if (headerName.toLowerCase() === "content-length") {
        return getUrlContentLength(_url, _range);
      } else if (headerName.toLowerCase() === "content-range") {
        return this._getContentRange();
      }
    }
  );
  this._getContentRange = function () {
    if (_range && !isRangeDisabled(_url) && !isHeaderDisallowed("content-range")) {
      const endByte = Math.min(_range[1], getUrlContents(_url).length - 1);
      return "bytes " + _range[0] + "-" + endByte + "/" + (getUrlFileLength(_url) || "*");
    }
  };
  this.getAllResponseHeaders = jest.fn().mockImplementation(
    function () {
      const headers = [];

      headers.push("content-length: " + getUrlContentLength(_url, _range));
      if (this._getContentRange()) {
        headers.push("content-range: " + this._getContentRange());
      }

      return headers.join("\r\n");
    }
  );
  this.send = jest.fn().mockImplementation(function () {
    const requestTimeout = getTimeout(_url);

    setTimeout(
      function () {
        this.status = getUrlStatusCode(_url);
        this.responseText = getUrlContents(_url, _range);
        this.onload();
      }.bind(this),
      requestTimeout
    );

    if (requestTimeout && this.timeout && requestTimeout > this.timeout && this.ontimeout) {
      setTimeout(
        function () {
          this.ontimeout({});
        }.bind(this),
        this.timeout
      );
    }
  });
}

const XMLHttpRequest = new XMLHttpRequestMock();
xhr2Mock.__setMockUrls = __setMockUrls;
xhr2Mock.XMLHttpRequest = XMLHttpRequest;
window.XMLHttpRequest = function () {
  return XMLHttpRequest;
};

module.exports = xhr2Mock;
