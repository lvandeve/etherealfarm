/*
Ethereal Farm
Copyright (C) 2020  Lode Vandevenne

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// all parsing and serializing is directly to base64, that is, not bytes but base64 units

// reader is object with inside of it:
// a string "s" with base64 values
// a position "pos", the pos can be incremented whenever using a base64 character
// an error indicator error, if truthy indicates something went wrong
// e.g.: {s:'', pos:0, error:false}

// for standard base64, last to characters are +/ (we don't use the ='s though)
// for URL-compatible base64, last two characters are  -_
// choose the standard one: this is more recognizable for users, so less probability they accidently forget to copypaste a '-' along with their savegame
var toBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var fromBase64 = {};

function initBase64() {
  for(var i = 0; i < 64; i++) fromBase64[toBase64[i]] = i;
}
initBase64();

function isBase64(s) {
  for(var i = 0; i < s.length; i++) {
    if(fromBase64[s[i]] == undefined) {
      return false;
    }
  }
  return true;
}

function encLZ77(s) {
  var lz77MatchLen = function(s, i0, i1) {
    var l = 0;
    while(i1 + l < s.length && s[i1 + l] == s[i0 + l]) l++;
    return l;
  };

  var result = '';
  var map = {};
  var lit = '';

  for(var i = 0; i < s.length; i++) {
    var len = 0;
    var dist = 0;
    var sub = map[s.substr(i, 4)];
    if(sub) {
      for(var j = sub.length - 1; j >= 0; j--) {
        var i2 = sub[j];
        var d = i - i2;
        if(d > 4096) break;
        var l = lz77MatchLen(s, i2, i);
        if(l > len) {
          len = l;
          dist = d;
          if(l > 63) break; // good enough
        }
      }
    }

    if(!(len > 5 || (len > 4 && dist < 4096) || (len > 3 && dist < 32))) {
      len = 1;
    }

    for(var j = 0; j < len; j++) {
      var sub = s.substr(i + j, 4);
      if(!map[sub]) map[sub] = [];
      if(map[sub].length > 1000) map[sub] = []; // prune
      map[sub].push(i + j);
    }
    i += len - 1;

    if(len >= 3) {
      result += encUint(lit.length);
      result += encUint(len);
      result += encUint(dist);
      result += lit;
      lit = '';
    } else {
      lit += s[i];
    }
  }
  if(lit.length) {
    result += encUint(lit.length);
    result += encUint(0);
    result += encUint(0);
    result += lit;
  }
  return result;
}

function decLZ77(s) {
  var reader = {s:s, pos:0};
  var result = '';
  while(reader.pos < s.length) {
    var num = decUint(reader);
    var len = decUint(reader);
    if(result.length + num + len > 100000) return null; // too suspiciously long
    var dist = decUint(reader);
    if(reader.error) return null;
    for(var i = 0; i < num; i++) {
      if(reader.pos >= s.length) return null;
      result += s[reader.pos++];
    }
    if(dist > result.length) return null;
    for(var i = 0; i < len; i++) {
      result += result[result.length - dist];
    }
  }
  return result;
}




function compress(s) {
  //return s;
  return encLZ77(s);
}

function decompress(s) {
  //return s;
  return decLZ77(s);
};

function encInt(i) {
  //i = Math.floor(i);
  if(i < -9007199254740992 || i > 9007199254740992 || isNaN(i)) i = 0; // avoid infinite loops
  var s = 0;
  if(i < 0) {
    s = 1;
    i = -i;
  }
  var b = i & 15;
  i = Math.floor(i / 16); // too bad doing ">> 4" doesn't work for more than 32 bits with JS
  var result = toBase64[b | (s << 4) | (i ? 32 : 0)];
  while(i) {
    b = i & 31;
    i = Math.floor(i / 32);
    result += toBase64[b | (i ? 32 : 0)];
  }
  return result;
}

function readBase64(reader) {
  if(reader.pos >= reader.s.length) reader.error = true;
  var v = fromBase64[reader.s[reader.pos++]];
  if(v == undefined) reader.error = true;
  return v;
}

function decInt(reader) {
  var olderror = reader.error;
  var v = readBase64(reader);
  var result = v & 15;
  var s = (v & 16) ? 1 : 0; // if 1, sign is negative
  var mul = 16; // cannot use shift because JS only support << for up to 32-bit integers
  for(;;) {
    if(!(v & 32)) break;
    if(mul > 9007199254740992) { reader.error = true; break; }
    v = readBase64(reader);
    result += (v & 31) * mul;
    mul *= 32;
  }
  if(s) result = -result;
  if(reader.error && !olderror) return NaN;
  return result;
}

function encBool(b) {
  return b ? 'B' : 'A';
}

function decBool(reader) {
  var v = readBase64(reader);
  if(v > 1) reader.error = true; // unknown bool value
  return (v == 1);
}

function encUint(i) {
  //i = Math.floor(i);
  if(i < 0 || i > 9007199254740992 || isNaN(i)) i = 0; // avoid infinite loops
  var b = i & 31;
  i = Math.floor(i / 32); // too bad doing ">> 5" doesn't work for more than 32 bits with JS
  var result = toBase64[b | (i ? 32 : 0)];
  while(i) {
    b = i & 31;
    i = Math.floor(i / 32);
    result += toBase64[b | (i ? 32 : 0)];
  }
  return result;
}

function decUint(reader) {
  var olderror = reader.error;
  var v = readBase64(reader);
  var result = v & 31;
  var mul = 32; // cannot use shift because JS only support << for up to 32-bit integers
  for(;;) {
    if(!(v & 32)) break;
    if(mul > 9007199254740992) { reader.error = true; break; }
    v = readBase64(reader);
    result += (v & 31) * mul;
    mul *= 32;
  }
  if(reader.error && !olderror) return NaN;
  return result;
}

// encodes an integer with max value 2**53 (inclusive) into max 9 chars
// NOTE: while encUint(i) also supports max value 2**53 due JS limitations, its encoding can in rare cases be slightly more efficient for lower values, which is why both encodings exist. encUint53 is good for mantissas of floating point values.
function encUint53(i) {
  if(i < 0 || i > 9007199254740992 || isNaN(i)) i = 0; // avoid infinite loops

  if(i > 2199023255552) {
    // starting at 2199023255552, the varint method outputs 9 chars, so then we
    // can use 9 chars directly, which provide 53 bits of precision (excluding
    // the one bit to indicate this case), exactly enough for 53-bit int
    i--; // support the value 2**53 itself too
    var result = toBase64[1 | ((i & 31) << 1)];
    i = Math.floor(i / 32);
    for(var j = 0; j < 8; j++) {
      result += toBase64[i & 63];
      i = Math.floor(i / 64);
    }
    return result;
  }

  i *= 2; // indicate with LSB 0 that it's not the direct case above.

  var b = i & 31;
  i = Math.floor(i / 32); // too bad doing ">> 5" doesn't work for more than 32 bits with JS
  var result = toBase64[b | (i ? 32 : 0)];
  while(i) {
    b = i & 31;
    i = Math.floor(i / 32);
    result += toBase64[b | (i ? 32 : 0)];
  }
  return result;
}

function decUint53(reader) {
  var olderror = reader.error;
  var v = readBase64(reader);
  var result;

  if(v & 1) {
    result = (v & 62) >> 1;
    var mul = 32;
    for(var j = 0; j < 8; j++) {
      v = readBase64(reader);
      result += v * mul;
      mul *= 64;
    }
    result++;
  } else {
    result = (v & 30) >> 1;
    var mul = 16; // cannot use shift because JS only support << for up to 32-bit integers
    for(;;) {
      if(!(v & 32)) break;
      if(mul > 9007199254740992) { reader.error = true; break; }
      v = readBase64(reader);
      result += (v & 31) * mul;
      mul *= 32;
    }
  }
  if(reader.error && !olderror) return NaN;
  return result;
}

// Why encUint16 exists compared to just using encUint: uint16 has 16 bits so is guaranteed to fit in 3 characters, while the standard encUint varint may use 4 characters for uint16.
// encUint16 still also acts like varint, just the third character is guaranteed to use all 6 base64-bits and have no flag bit.
// So this is slightly more efficient than encUint for values expected to be low, and significantly more efficient (towards 25%) than encUint for uniform random uint16 values.
// Note that this can actually encode values from 0-66591, not just 0-65535.
function encUint16(i) {
  if(i < 0 || i > 66591 || isNaN(i)) i = 0; // avoid infinite loops
  // 1 char: 5 bits: 0-31
  // 2 chars: 10 bits: 32-1055
  // 3 chars: 16 bits: 1056-66591
  if(i < 32) {
    return toBase64[i];
  }
  if(i < 1056) {
    i -= 32;
    return toBase64[32 | (i & 31)] + toBase64[((i >> 5) & 31)];
  }
  i -= 1056;
  return toBase64[32 | (i & 31)] + toBase64[32 | ((i >> 5) & 31)] + toBase64[((i >> 10) & 63)];
}

// returns value in range 0-66591 reading up to 3 chars
function decUint16(reader) {
  var olderror = reader.error;
  var v = readBase64(reader);
  var result = v & 31;
  if(v & 32) {
    result += 32;
    v = readBase64(reader);
    result += ((v & 31) << 5);
  }
  if(v & 32) {
    result += 1024;
    v = readBase64(reader);
    result += ((v & 63) << 10);
  }
  if(reader.error && !olderror) return NaN;
  return result;
}


// Encodes any value 0-63 in one symbol (unlike the varint encUint which may take 2 symbols for some)
function encUint6(i) {
  return toBase64[i & 63];
}

// returns value in range 0-63 reading 1 chars
function decUint6(reader) {
  var olderror = reader.error;
  var v = readBase64(reader);
  if(reader.error && !olderror) return NaN;
  return v;
}

// For unicode codepoint values
function encUint21(i) {
  if(i < 0 || i > 2130975 || isNaN(i)) i = 0; // avoid infinite loops
  // 1 char: 5 bits: 0-31
  // 2 chars: 10 bits: 32-1055
  // 3 chars: 15 bits: 1056-33823
  // 4 chars: 21 bits: 33824-2130975
  if(i < 32) {
    return toBase64[i];
  }
  if(i < 1056) {
    i -= 32;
    return toBase64[32 | (i & 31)] + toBase64[((i >> 5) & 31)];
  }
  if(i < 33824) {
    i -= 1056;
    return toBase64[32 | (i & 31)] + toBase64[32 | ((i >> 5) & 31)] + toBase64[((i >> 10) & 31)];
  }
  i -= 33824;
  return toBase64[32 | (i & 31)] + toBase64[32 | ((i >> 5) & 31)] + toBase64[32 | ((i >> 10) & 31)] + toBase64[((i >> 15) & 63)];
}

// returns value in range 0-2130975 reading up to 4 chars
function decUint21(reader) {
  var olderror = reader.error;
  var v = readBase64(reader);
  var result = v & 31;
  if(v & 32) {
    result += 32;
    v = readBase64(reader);
    result += ((v & 31) << 5);
  }
  if(v & 32) {
    result += 1024;
    v = readBase64(reader);
    result += ((v & 31) << 10);
  }
  if(v & 32) {
    result += 32768;
    v = readBase64(reader);
    result += ((v & 63) << 15);
  }
  if(reader.error && !olderror) return NaN;
  return result;
}

function mirrorBits(i, num) {
  var res = 0;
  // not using shifts because JS only supports those up to 32-bit integers
  var mul = 1;
  for(var j = 0; j < num; j++) {
    res += (i & 1);
    res *= 2;
    i = Math.floor(i / 2);
  }
  return res;
}

// encodes a 52-bit mantissa in max 9 chars
function encMantissa(mantissa) {
  // try inverting bits of mantissa, because floating point values of integers usually have their set mantissa bits only in the MSB's of the mantissa. Encoding as varint is smaller if the value is smaller, so invert the bits to bring the MSBs to the LSBs.
  // but also consider not inverting mantissa, that encodes a value like 1.0000001 better
  // of course for arbitrary floats like 1.5646545 it doesn't matter either way, but both integers, and values close to 1, can be common. This also avoids long streaks of 0, showing up as ggggg in the varint.
  var m2 = mirrorBits(mantissa, 52);
  var invert = false;
  if(m2 < mantissa) {
    mantissa = m2;
    invert = true;
  }
  mantissa *= 2;
  mantissa += invert ? 1 : 0;
  return encUint53(mantissa);
}

function decMantissa(reader) {
  var mantissa = decUint53(reader);
  var invert = mantissa & 1;
  mantissa = Math.floor(mantissa / 2);
  if(invert) mantissa = mirrorBits(mantissa, 52);
  return mantissa;
}

function encFloat(f) {
  // single-char result for these common values
  var d = util.dissectfloat(f, 11, 52); // [sign, mantissa, exponent]
  if(f == 0 && !d[0]) return encUint(0);
  if(f == 1) return encUint(1);
  var sign = d[0];
  var exp = d[1];
  var mantissa = d[2];
  var result = '';
  // Make the varint encoding of low exponents more efficient, the exponent for value 1 is 1023, also include a few exponents for smaller-than-one in this (hence 1020 is used)
  // Note: that's a modulo division, not mask, on purpose
  if(exp != 0) exp = 1 + ((2047 + (exp - 1) - 1020) % 2047);
  exp = (exp << 1) | sign; // store the mantissa sign information in the exponent
  result += encUint(exp + 2); // + 2 due to the two shortcuts for 0 and 1 above
  result += encMantissa(mantissa);
  return result;
}

function decFloat(reader) {
  var olderror = reader.error;
  var exp = decUint(reader);
  if(exp == 0) return 0;
  if(exp == 1) return 1;
  exp -= 2;
  var mantissa = decMantissa(reader);
  var sign = (exp & 1) ? 1 : 0;
  exp >>= 1;
  if(exp != 0) exp = 1 + ((2047 + (exp - 1) + 1020) % 2047);
  var result = util.createfloat(sign, exp, mantissa, 11, 52);
  if(reader.error && !olderror) return NaN;
  return result;
}


// alternative float encoding that is a bit better for range ~0..2 but a bit worse for other ranges. Has following properties:
// -a value in range [0.25..2) will be encoded in max 9 characters, 1 less than encFloat on average
// -a value in range (-2..-0.5] and [~0.01..0.25] will be encoded in max 10 characters, similar to encFloat on average
// -values 0 and 1 are encoded in 1 character, just like encFloat does
// -other values are on average no more than 1 char bigger than encFloat (but +2 is possible for very specific values)
// -the max output size is 12 chars, same as encFloat's
// This function is good for encoding the mantissa of encNum (which is usually
// in range 1..2), and for encoding growth, percentages (scaled), and other such
// progress value that are usually in range 0..1. It'll typically save at least
// 1 character compared to encFloat for those.
// For generic floats, that is values with arbitrary exponents, negative values,
// 'round' values like exact 0.25 or 1.5, and values are not typically in
// roughly range 0..2, the standard encFloat is better since encFloat2 will
// often cost one character more for those.
function encFloat2(f) {
  // single-char result for these common values
  var d = util.dissectfloat(f, 11, 52); // [sign, mantissa, exponent]
  var sign = d[0];
  var exp = d[1];
  var mantissa = d[2];
  var e = exp - 1023;
  var c;

  var result = '';

  if(f == 0 && !sign) {
    result = toBase64[0];
  } else if(f == 1) {
    result = toBase64[1];
  } else {
    // 6 specific shorter exp values: 1 to represent also values 2.0..4.0 somewhat shorter, and -3..-7 for values roughly ~0.01..0.125
    if(!sign && (e >= -7 && e <= 1)) {
      // values of c=0 and c=1 already taken by direct values 0 and 1.
      // exponents 0, -1 and -2 already have other shortcut further below, but can still be useful in combination with the possibly shorter mantissa encoding here
      if(e == 1) c = 2;
      else if(e == 0) c = 3;
      else if(e == -1) c = 4;
      else if(e == -2) c = 5;
      else if(e == -3) c = 6;
      else if(e == -4) c = 7;
      else if(e == -5) c = 13;
      else if(e == -6) c = 14;
      else if(e == -7) c = 15;
      result += toBase64[c];
    } else if(sign && (e >= -1 && e <= 1)) {
      if(e == 1) c = 10;
      else if(e == 0) c = 11;
      else if(e == -1) c = 12;
      result += toBase64[c];
    } else if(e >= -15 && e <= 16) {
      result += toBase64[8]; // indicates 1-char exponent+sign
      result += toBase64[(e + 15) | (sign ? 32 : 0)];
    } else {
      result += toBase64[9]; // indicates 2-char exponent+sign
      result += toBase64[(exp & 31) | (sign ? 32 : 0)];
      result += toBase64[exp >> 5];
    }
    result += encMantissa(mantissa);
  }

  exp = d[1];
  if(!sign && (e >= -2 && e <= -0) && result.length > 9) {
    // exponent -2 for 0.25..0.5, -1 for 0.5..1 and 0 for 1..2
    result = '';
    c = (e == 0) ? 16 : ((e == -1) ? 32 : 48);
    c |= (mantissa & 15);
    result += toBase64[c];
    mantissa = Math.floor(mantissa / 16);
    for(var i = 0; i < 8; i++) {
      result += toBase64[mantissa & 63];
      mantissa = Math.floor(mantissa / 64);
    }
  }

  return result;
}

function decFloat2(reader) {
  var olderror = reader.error;
  var v = readBase64(reader);
  var result;
  if(v == 0) {
    result = 0;
  } else if(v == 1) {
    result = 1;
  } else if((v & 48) == 0) {
    var exp, sign;
    if(v == 8) {
      var w = readBase64(reader);
      sign = (w & 32) ? 1 : 0;
      exp = (w & 31) - 15 + 1023;
    } else if(v == 9) {
      var w = readBase64(reader);
      sign = (w & 32) ? 1 : 0;
      exp = (w & 31);
      exp += readBase64(reader) << 5;
    } else if(v == 10 || v == 11 || v == 12) {
      sign = 1;
      var e;
      if(v == 10) e = 1;
      else if(v == 11) e = 0;
      else if(v == 12) e = -1;
      exp = e + 1023;
    } else {
      sign = 0;
      var e;
      if(v == 2) e = 1;
      else if(v == 3) e = 0;
      else if(v == 4) e = -1;
      else if(v == 5) e = -2;
      else if(v == 6) e = -3;
      else if(v == 7) e = -4;
      else if(v == 13) e = -5;
      else if(v == 14) e = -6;
      else if(v == 15) e = -7;
      exp = e + 1023;
    }
    var mantissa = decMantissa(reader);
    result = util.createfloat(sign, exp, mantissa, 11, 52);
  } else {
    var c = (v & 48);
    var sign = 0;
    var exp = (c == 16) ? 0 : ((c == 32) ? -1 : -2);
    exp += 1023;
    var mantissa = (v & 15);
    var mul = 16;
    for(var i = 0; i < 8; i++) {
      mantissa += readBase64(reader) * mul;
      mul *= 64;
    }
    result = util.createfloat(sign, exp, mantissa, 11, 52);
  }
  if(reader.error && !olderror) return NaN;
  return result;
}


function encNum(num) {
  // 1-char for the common values of 0 and 1.
  // Other integers do not have shortcuts, use encInt/encUint rather than Num for integer values (counting stats, ...) if efficient size is desired, Num cannot represents them with more accuracy anyway (has same 53-bit mantissa as JS number has)
  if(num.eqr(0)) return encInt(0);
  if(num.eqr(1)) return encInt(1);
  var e = num.e > 1 ? num.e : (num.e - 2);
  if(isNaN(e)) e = -2;
  return encInt(e) + encFloat2(num.b);
}

function decNum(reader) {
  var e = decInt(reader);
  if(e == 0) return new Num(0, 0);
  if(e == 1) return new Num(1, 0);
  var result = new Num(0, 0);
  result.e = e;
  result.b = decFloat2(reader);
  if(result.e <= 1) result.e += 2;
  return result;
}

// converts array of unicode codepoints to JS string
function arrayToString(a) {
  var s = '';
  for(var i = 0; i < a.length; i++) {
    var c = a[i];
    if (c < 0x10000) {
       s += String.fromCharCode(c);
    } else if (c <= 0x10FFFF) {
      s += String.fromCharCode((c >> 10) + 0xD7C0);
      s += String.fromCharCode((c & 0x3FF) + 0xDC00);
    } else {
      s += ' ';
    }
  }
  return s;
}

// converts JS string to array of unicode codepoints
function stringToArray(s) {
  var a = [];
  for(var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
      var c2 = s.charCodeAt(i + 1);
      if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
        c = (c << 10) + c2 - 0x35FDC00;
        i++;
      }
    }
    a.push(c);
  }
  return a;
}

function swapFrequent(a) {
  // give likely more frequent characters the 32 1-character values
  for(var i = 0; i < a.length; i++) {
    // 'a'-'z'
    if(a[i] >= 97 && a[i] <= 122) a[i] -= 97;
    else if(a[i] >= 0 && a[i] <= 25) a[i] += 97;
    // ' '
    else if(a[i] == 32) a[i] = 26;
    else if(a[i] == 26) a[i] = 32;
    // '.'
    else if(a[i] == 46) a[i] = 27;
    else if(a[i] == 27) a[i] = 46;
    // ','
    else if(a[i] == 44) a[i] = 28;
    else if(a[i] == 28) a[i] = 44;
    // 'A'
    else if(a[i] == 65) a[i] = 29;
    else if(a[i] == 29) a[i] = 65;
    // 'S'
    else if(a[i] == 83) a[i] = 30;
    else if(a[i] == 30) a[i] = 83;
    // 'T'
    else if(a[i] == 84) a[i] = 31;
    else if(a[i] == 31) a[i] = 84;
  }
}

function encString(s) {
  var a = stringToArray(s);
  swapFrequent(a);
  var result = encUint(a.length);
  for(var i = 0; i < a.length; i++) {
    result += encUint21(a[i]);
  }
  return result;
}

function decString(reader) {
  var len = decUint(reader);
  if(reader.error) return '';
  var a = [];
  for(var i = 0; i < len; i++) {
    a[i] = decUint21(reader);
    if(reader.error) return '';
  }
  swapFrequent(a);
  return arrayToString(a);
}



// encode resources
function encResArray(arr) {
  var result = '';
  var first = 0, last = -1;
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].neqr(0)) {
      if(last == -1) first = i;
      last = i;
    }
  }

  // encode with a single number what range of resources is being encoded (first to last index), so that if there's e.g. only 1 type of non-zero resource, it doesn't encode a zero character for all the others
  // but also future proof this so that if new resource types are added it can still be represented
  var code = 0;
  if(last >= 0) {
    var t = last * (last + 1) / 2; // triangular number
    code = 1 + t + first; // + 1 since code 0 means no resources at all are encoded
  }
  if(code < 56) {
    // up to 10 distinct resources can have this combination encoded in 1 character
    result += encUint6(code);
  } else {
    result += encUint6(56 + (code & 7));
    result += encUint(code >> 3);
  }

  for(var i = first; i <= last; i++) {
    result += encNum(arr[i]);
  }
  return result;
}

function decResArray(reader) {
  var arr = [];
  var code = decUint6(reader);
  if(code >= 56) {
    code = (code & 7) | (decUint(reader) << 3);
  }
  if(reader.error) return undefined;
  var first = 0, last = -1;
  if(code > 0) {
    code--;
    var n = Math.floor(Math.sqrt(0.25 + 2 * code) - 0.5); // inverse of triangular number
    if((n + 1) * (n + 2) / 2 - 1 < code) {
      n++; // fix potential numerical imprecision
    }
    var t = n * (n + 1) / 2;
    last = n;
    first = code - t;
  }
  for(var i = first; i <= last; i++) {
    arr[i] = decNum(reader);
  }
  return arr;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var type_index = 0;
var TYPE_BOOL = type_index++; // boolean true/false value
var TYPE_UINT6 = type_index++; // single base64 character
var TYPE_INT = type_index++; // signed integer, variable length encoded
var TYPE_UINT = type_index++; // unsigned integer, variable length encoded
var TYPE_UINT16 = type_index++; // 16-bit integer, variable length encoded
var TYPE_FLOAT = type_index++; // floating point value, variable length encoded
var TYPE_FLOAT2 = type_index++; // floating point value, alternative variable length encoding that is shorter for values in range 0.25..2
var TYPE_NUM = type_index++; // large number with large exponent
var TYPE_STRING = type_index++; // unicode text
var TYPE_RES = type_index++; // resources (array of resources from the game, such as seeds, ...)

// arrays for all the same types
type_index = 12;
var TYPE_ARRAY_BOOL = type_index++; // bits packed
var TYPE_ARRAY_UINT6 = type_index++; // array of base64 characters, useable as blob
var TYPE_ARRAY_INT = type_index++;
var TYPE_ARRAY_UINT = type_index++;
var TYPE_ARRAY_UINT16 = type_index++;
var TYPE_ARRAY_FLOAT = type_index++;
var TYPE_ARRAY_FLOAT2 = type_index++;
var TYPE_ARRAY_NUM = type_index++;
var TYPE_ARRAY_STRING = type_index++;
var TYPE_ARRAY_RES = type_index++;


var compactBool = true;


function Token(value, type, id) {
  // Allow calling it without new, but act like new
  if(!(this instanceof Token)) {
    return new Token(value, type, id);
  }

  this.id = id; // section*64 + subid, where subid is id within section, so there can be max 64 unique tokens within 1 section (but a token can be an array of data)

  this.value = value; // once filled in, must be relevant for the type

  this.type = type;
};

function encTokenValue(value, type) {
  switch(type) {
    case TYPE_BOOL: return encBool(value);
    case TYPE_UINT6: return encUint6(value);
    case TYPE_INT: return encInt(value);
    case TYPE_UINT: return encUint(value);
    case TYPE_UINT16: return encUint16(value);
    case TYPE_FLOAT: return encFloat(value);
    case TYPE_FLOAT2: return encFloat2(value);
    case TYPE_NUM: return encNum(value);
    case TYPE_STRING: return encString(value);
    case TYPE_RES: return encRes(value);
  }
  return undefined;
}

function encToken(token, prev_id) {
  var type = token.type;
  var value = token.value;

  var result = '';

  if(type < 12) {
    if((type != TYPE_STRING && value === 0) || (type == TYPE_STRING && value == '') || (type == TYPE_RES && value.empty()) || (type == TYPE_NUM && value.eqr(0))) {
      result += encUint6(type + 0);
      result += encUint6(token.id & 63);
    } else if(token.id == prev_id + 1) {
      result += encUint6(type + 12);
      result += encTokenValue(token.value, type);
    } else {
      result += encUint6(type + 24);
      result += encUint6(token.id & 63);
      result += encTokenValue(token.value, type);
    }
  } else {
    if(token.id == prev_id + 1) {
      result += encUint6(type - 12 + 36);
      result += encUint(token.value.length);
    } else {
      result += encUint6(type - 12 + 48);
      result += encUint6(token.id & 63);
      result += encUint(token.value.length);
    }
    if(type == TYPE_ARRAY_BOOL && compactBool) {
      for(var i = 0; i < token.value.length; i += 6) {
        var v = 0;
        for(var j = 0; j < 6 && i + j < token.value.length; j++) {
          if(token.value[i + j]) v |= (1 << j);
        }
        result += encUint6(v);
      }
    } else {
      for(var i = 0; i < token.value.length; i++) {
        result += encTokenValue(token.value[i], type - 12);
      }
    }
  }
  return result;
}

function decToken(reader, prev_id, section) {
  var token = new Token(0, 0, 0);
  var code = decUint6(reader);
  if((code >= 12 && code <= 23) || (code >= 36 && code <= 47)) {
    token.id = prev_id + 1;
  } else {
    token.id = decUint6(reader);
    token.id += (section << 6);
  }

  if(code < 36) {
    var type = code % 12;
    token.type = type;
    if(code < 12) {
      switch(type) {
        case TYPE_BOOL: token.value = false; break;
        case TYPE_UINT6: token.value = 0; break;
        case TYPE_INT: token.value = 0; break;
        case TYPE_UINT: token.value = 0; break;
        case TYPE_UINT16: token.value = 0; break;
        case TYPE_FLOAT: token.value = 0; break;
        case TYPE_FLOAT2: token.value = 0; break;
        case TYPE_NUM: token.value = Num(0); break;
        case TYPE_STRING: token.value = ''; break;
        case TYPE_RES: token.value = Res(0); break;
        default: {
          reader.error = true;
          return token;
        }
      }
    } else {
      switch(type) {
        case TYPE_BOOL: token.value = decBool(reader); break;
        case TYPE_UINT6: token.value = decUint6(reader); break;
        case TYPE_INT: token.value = decInt(reader); break;
        case TYPE_UINT: token.value = decUint(reader); break;
        case TYPE_UINT16: token.value = decUint16(reader); break;
        case TYPE_FLOAT: token.value = decFloat(reader); break;
        case TYPE_FLOAT2: token.value = decFloat2(reader); break;
        case TYPE_NUM: token.value = decNum(reader); break;
        case TYPE_STRING: token.value = decString(reader); break;
        case TYPE_RES: token.value = decRes(reader); break;
        default: {
          reader.error = true;
          return token;
        }
      }
    }
  } else {
    var type = 12 + (code % 12);
    token.type = type;
    var n = decUint(reader);
    token.value = [];
    if(type == TYPE_ARRAY_BOOL && compactBool) {
      for(var i = 0; i < n; i += 6) {
        var v = decUint6(reader);
        if(reader.error) {
          return token;
        }
        for(var j = 0; j < 6 && i + j < n; j++) {
          token.value[i + j] = (v & (1 << j)) ? true : false;
        }
      }
    } else {
      for(var i = 0; i < n; i++) {
        switch(type) {
          case TYPE_ARRAY_BOOL: token.value[i] = decBool(reader); break;
          case TYPE_ARRAY_UINT6: token.value[i] = decUint6(reader); break;
          case TYPE_ARRAY_INT: token.value[i] = decInt(reader); break;
          case TYPE_ARRAY_UINT: token.value[i] = decUint(reader); break;
          case TYPE_ARRAY_UINT16: token.value[i] = decUint16(reader); break;
          case TYPE_ARRAY_FLOAT: token.value[i] = decFloat(reader); break;
          case TYPE_ARRAY_FLOAT2: token.value[i] = decFloat2(reader); break;
          case TYPE_ARRAY_NUM: token.value[i] = decNum(reader); break;
          case TYPE_ARRAY_STRING: token.value[i] = decString(reader); break;
          case TYPE_ARRAY_RES: token.value[i] = decRes(reader); break;
          default: {
            reader.error = true;
            return token;
          }
        }
        if(reader.error) {
          return token;
        }
      }
    }
  }
  return token;
}

function encTokens(tokens) {

  var sections = {};
  for(var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    var section = token.id >> 6;
    if(!sections[section]) sections[section] = [];
    sections[section].push(token);
  }
  var result = '';
  for(section in sections) {
    if(!sections.hasOwnProperty(section)) continue;

    var prev_id = (section << 6) - 1;
    var t = sections[section];
    t.sort(function(a, b) {
      return a.id - b.id;
    });
    var r = '';
    for(var i = 0; i < t.length; i++) {
      var token = t[i];
      r += encToken(t[i], prev_id);
      prev_id = token.id;
    }
    result += encUint(section);
    result += encUint(t.length);
    result += r;
  }

  return result;
}

function decTokens(reader) {
var testdone = false;
  var result = {};
  for(;;) {
    if(reader.pos == reader.s.length) break;
    var section = decUint(reader);
    var num = decUint(reader);
    //console.log('begin section ' + section + ', num: ' + num + ', pos: ' + reader.pos);
    if(reader.error) {
      return result;
    }

    var section_begin = reader.pos;
    var prev_id = (section << 6) - 1;
    for(var i = 0; i < num; i++) {
      var token = decToken(reader, prev_id, section);
      //console.log('id: ' + (token.id&63) + ', type: ' + token.type + ', value: ' + token.value + ', pos: ' + reader.pos);
      if(reader.error) {
        return result;
      }
      prev_id = token.id;
      result[token.id] = token;
    }
    var section_length = reader.pos - section_begin;
    //console.log('*** end section ' + section + ', num: ' + num + ', length: ' + section_length + ' ***');
  }
  return result;
}

var inctestamount = false;
var testamount = 0;

////////////////////////////////////////////////////////////////////////////////



/*
reasons: 0: unknown
1:string too short
2: not base64
3:signature EF missing
4:format
5:compression
6:checksum mismatch
7:save version newer than game version
8:save of too old version of the game*/
var err = function(reason) {
  if(!reason) reason = 0;
  return {save_error:true, error_reason:reason};
};

