"use strict";

type ConfigStatic = {
  addFileReader: (fileReader: unknown) => unknown;
};

function registerNodeFileReaders(Config: ConfigStatic): void {
  const nodeProcess =
    typeof process !== "undefined"
      ? (process as NodeJS.Process & { browser?: boolean })
      : undefined;

  if (!nodeProcess || nodeProcess.browser) {
    return;
  }

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

export = registerNodeFileReaders;
