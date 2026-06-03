'use strict';

const ByteArrayUtils = require('./ByteArrayUtils');
const bin = ByteArrayUtils.bin;
const pad = ByteArrayUtils.pad;
const getInteger32 = ByteArrayUtils.getInteger32;

import type {
  ByteArray
} from './types';

class MP4TagContents {
  _atoms: Array<Atom>;

  constructor(ftyp: string, atoms?: Array<Atom>) {
    this._atoms = [
      new Atom("ftyp", pad(bin(ftyp), 24))
    ].concat(atoms || []);
  }

  toArray(): ByteArray {
    return this._atoms.reduce(function(array: ByteArray, atom) {
      return array.concat(atom.toArray());
    }, [] as ByteArray);
  }

  static createAtom(atomName: string): Atom {
    return new Atom(atomName);
  }

  static createContainerAtom(atomName: string, atoms: Array<Atom>, data?: ByteArray): Atom {
    return new Atom(atomName, data ?? null, atoms ?? null);
  }

  static createMetadataAtom(atomName: string, type: string, data: ByteArray): Atom {
    const klassMap: Record<string, number> = {
      uint8: 0,
      uint8b: 21,
      text: 1,
      jpeg: 13,
      png: 14,
    };
    var klass = klassMap[type] ?? 0;

    return this.createContainerAtom(atomName, [
      new Atom(
        "data",
        ([] as ByteArray).concat(
          [0x00, 0x00, 0x00, klass as number],
          [0x00, 0x00, 0x00, 0x00],
          data
        )
      ),
    ]);
  }
}

class Atom {
  _name: string;
  _data: Array<number>;
  _atoms: Array<Atom>;

  constructor(
    name: string,
    data?: ByteArray | null,
    atoms?: Array<Atom> | null
  ) {
    this._name = name;
    this._data = data || [];
    this._atoms = atoms || [];
  }

  toArray(): ByteArray {
    var atomsArray = this._atoms.reduce(function (
      array: ByteArray,
      atom: Atom
    ): ByteArray {
      return array.concat(atom.toArray());
    }, [] as ByteArray);
    var length = 4 + this._name.length + this._data.length + atomsArray.length;

    return ([] as ByteArray).concat(
      getInteger32(length),
      bin(this._name),
      this._data,
      atomsArray
    );
  }
}

export = MP4TagContents;
