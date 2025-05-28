const BASE64_CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LAST_CHAR_SET = 'AQgw';
const BASE_LENGTH_V2 = 22; // length for v2, adjust if needed

/**
 * Generates correlation vector V2.
 */
export const CorrelationVectorV2 = (): string => {
  let baseVector = '';
  for (let i = 0; i < BASE_LENGTH_V2 - 1; i++) {
    baseVector += BASE64_CHAR_SET.charAt(Math.floor(Math.random() * BASE64_CHAR_SET.length));
  }
  baseVector += BASE64_LAST_CHAR_SET.charAt(Math.floor(Math.random() * BASE64_LAST_CHAR_SET.length));
  const extension = 0;
  return `${baseVector}.${extension}`;
};
