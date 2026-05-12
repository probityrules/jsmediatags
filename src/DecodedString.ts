/** Return type of StringUtils decoded-string readers */
export interface DecodedString {
  bytesReadCount: number;
  length: number;
  toString(): string;
}
