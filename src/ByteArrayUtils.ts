"use strict";

import type { ByteArray } from "./FlowTypes";

/**
 * Converts a string to a binary array
 */
const bin = function (string: string): ByteArray {
  const binaryArray = new Array<number>(string.length);
  for (let i = 0; i < string.length; i++) {
    binaryArray[i] = string.charCodeAt(i);
  }
  return binaryArray;
};

/**
 * Pads an array with \0 until it is size length.
 */
const pad = function (array: Array<number>, size: number): Array<number> {
  for (let i = array.length; i < size; i++) {
    array.push(0);
  }
  return array;
};

const getSynchsafeInteger32 = function (number: number): ByteArray {
  return [
    (number >> 21) & 0x7f,
    (number >> 14) & 0x7f,
    (number >> 7) & 0x7f,
    number & 0x7f,
  ];
};

const getInteger32 = function (number: number): ByteArray {
  return [
    (number >> 24) & 0xff,
    (number >> 16) & 0xff,
    (number >> 8) & 0xff,
    number & 0xff,
  ];
};

const getInteger24 = function (number: number): ByteArray {
  return [(number >> 16) & 0xff, (number >> 8) & 0xff, number & 0xff];
};

export = {
  bin: bin,
  pad: pad,
  getSynchsafeInteger32: getSynchsafeInteger32,
  getInteger32: getInteger32,
  getInteger24: getInteger24,
};
