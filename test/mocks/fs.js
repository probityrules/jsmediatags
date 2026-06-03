/**
 * Manual mock for Node.js fs module used by NodeFileReader tests.
 */
const path = require("path");

const fsMock = jest.genMockFromModule("fs");

let _mockFiles = {};

function __setMockFiles(newMockFiles) {
  _mockFiles = {};

  for (const file in newMockFiles) {
    const dir = path.dirname(file);

    if (!_mockFiles[dir]) {
      _mockFiles[dir] = {};
    }

    _mockFiles[dir][path.basename(file)] = newMockFiles[file];
  }
}

function readdirSync(directoryPath) {
  return _mockFiles[directoryPath] || [];
}

const _fds = [];

function open(filePath, flags, mode, callback) {
  const fd = _fds.push({ path: filePath }) - 1;

  process.nextTick(function () {
    if (callback) {
      callback(null, fd);
    }
  });
}

function read(fd, buffer, offset, length, position, callback) {
  const file = _fds[fd];
  const dir = path.dirname(file.path);
  const name = path.basename(file.path);

  if (_mockFiles[dir] && _mockFiles[dir][name]) {
    const data = _mockFiles[dir][name].substr(position, length);
    buffer.write(data, offset, length);
    process.nextTick(function () {
      callback(null, length, buffer);
    });
  } else {
    process.nextTick(function () {
      callback(new Error("File not found"));
    });
  }
}

function stat(filePath, callback) {
  const dir = path.dirname(filePath);
  const name = path.basename(filePath);

  if (_mockFiles[dir] && _mockFiles[dir][name]) {
    process.nextTick(function () {
      callback(null, {
        size: _mockFiles[dir][name].length,
      });
    });
  } else {
    process.nextTick(function () {
      callback({});
    });
  }
}

fsMock.readdirSync.mockImplementation(readdirSync);
fsMock.open.mockImplementation(open);
fsMock.read.mockImplementation(read);
fsMock.stat.mockImplementation(stat);
fsMock.__setMockFiles = __setMockFiles;

module.exports = fsMock;
