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

function getHue(r, g, b) {
  var minColor = Math.min(Math.min(r, g), b);
  var maxColor = Math.max(Math.max(r, g), b);
  if(minColor == maxColor) return 0; // it's grayscale, there is no hue
  var h;
  if(r == maxColor) h = (g - b) / (maxColor - minColor);
  else if(g == maxColor) h = 2 + (b - r) / (maxColor - minColor);
  else h = 4 + (r - g) / (maxColor - minColor);
  h /= 6;
  if(h < 0) h += 1;
  return h;
}

// given hue, get maximally saturated RGB color representing the hue
function fromHue(h) {
  h = h - Math.floor(h);
  var v = 1;
  var s = 1;
  h *= 6.0; //to bring hue to a number between 0 and 6, better for the calculations
  var i = (Math.floor(h)); //e.g. 2.7 becomes 2 and 3.01 becomes 3 or 4.9999 becomes 4
  var f = h - Math.floor(h); //the fractional part of h
  var p = v * (1.0 - s);
  var q = v * (1.0 - (s * f));
  var t = v * (1.0 - (s * (1.0 - f)));

  var r, g, b;
  switch(i)
  {
    case 0: r=v; g=t; b=p; break;
    case 1: r=q; g=v; b=p; break;
    case 2: r=p; g=v; b=t; break;
    case 3: r=p; g=q; b=v; break;
    case 4: r=t; g=p; b=v; break;
    default: r=v; g=p; b=q; break; //this be case 5, it's mathematically impossible for i to be something else
  }
  return [r, g, b, 255];
}


function RGBtoHSL(rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var minColor = Math.min(Math.min(r, g), b);
  var maxColor = Math.max(Math.max(r, g), b);
  var h, l, s;
  if(minColor == maxColor) {
    h = 0;
    s = 0;
    l = r;
  } else {
    h = getHue(r, g, b);
    l = (maxColor + minColor) / 2;
    if(l < 0.5) s = (maxColor - minColor) / (maxColor + minColor);
    else s = (maxColor - minColor) / (2 - maxColor - minColor);
  }
  return [Math.floor(h * 255), Math.floor(s * 255), Math.floor(l * 255), rgb[3]];
}

function HSLtoRGB(hsl) {
  var h = hsl[0] / 255;
  var s = hsl[1] / 255;
  var l = hsl[2] / 255;
  var r, g, b;
  h = h - Math.floor(h);
  if(s == 0.0) {
    r = g = b = l; // gray
  } else {
    var temp1, temp2, tempr, tempg, tempb;
    if(l < 0.5) temp2 = l * (1 + s);
    else temp2 = (l + s) - (l * s);
    temp1 = 2.0 * l - temp2;
    tempr=h + 1.0 / 3.0;
    if(tempr > 1.0) tempr--;
    tempg=h;
    tempb=h-1.0 / 3.0;
    if(tempb < 0.0) tempb++;

    //red
    if(tempr < 1.0 / 6.0) r = temp1 + (temp2 - temp1) * 6.0 * tempr;
    else if(tempr < 0.5) r = temp2;
    else if(tempr < 2.0 / 3.0) r = temp1 + (temp2 - temp1) * ((2.0 / 3.0) - tempr) * 6.0;
    else r = temp1;

     //green
    if(tempg < 1.0 / 6.0) g = temp1 + (temp2 - temp1) * 6.0 * tempg;
    else if(tempg < 0.5) g=temp2;
    else if(tempg < 2.0 / 3.0) g = temp1 + (temp2 - temp1) * ((2.0 / 3.0) - tempg) * 6.0;
    else g = temp1;

    //blue
    if(tempb < 1.0 / 6.0) b = temp1 + (temp2 - temp1) * 6.0 * tempb;
    else if(tempb < 0.5) b = temp2;
    else if(tempb < 2.0 / 3.0) b = temp1 + (temp2 - temp1) * ((2.0 / 3.0) - tempb) * 6.0;
    else b = temp1;
  }
  return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255), hsl[3]];
}

function RGBtoHSV(rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var minColor = Math.min(Math.min(r, g), b);
  var maxColor = Math.max(Math.max(r, g), b);
  var v = maxColor;

  var s;
  if(maxColor == 0) {
    s = 0;
  } else {
    s = (maxColor - minColor) / maxColor;
  }

  var h;
  if(s == 0) {
    h = 0;
  } else {
    h = getHue(r, g, b);
  }

  return [Math.floor(h * 255), Math.floor(s * 255), Math.floor(v * 255), rgb[3]];
}

function HSVtoRGB(hsv) {
  var h = hsv[0] / 255;
  var s = hsv[1] / 255;
  var v = hsv[2] / 255;
  var r, g, b;
  if(s == 0.0) {
    r = g = b = v; // gray
  } else {
    var f, p, q, t;
    var i;
    h = h - Math.floor(h);
    h *= 6.0; //to bring hue to a number between 0 and 6, better for the calculations
    i = (Math.floor(h)); //e.g. 2.7 becomes 2 and 3.01 becomes 3 or 4.9999 becomes 4
    f = h - Math.floor(h); //the fractional part of h
    p = v * (1.0 - s);
    q = v * (1.0 - (s * f));
    t = v * (1.0 - (s * (1.0 - f)));

    switch(i)
    {
      case 0: r=v; g=t; b=p; break;
      case 1: r=q; g=v; b=p; break;
      case 2: r=p; g=v; b=t; break;
      case 3: r=p; g=q; b=v; break;
      case 4: r=t; g=p; b=v; break;
      default: r=v; g=p; b=q; break; //this be case 5, it's mathematically impossible for i to be something else
    }
  }
  return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255), hsv[3]];
}

function CSStoRGB(css) {
    if(css[0] == '#') {
    var r, g, b, a = 255;
    css = css.substr(1); // remove the #
    if(css.length == 6) {
      r = parseInt(css.substr(0, 2), 16);
      g = parseInt(css.substr(2, 2), 16);
      b = parseInt(css.substr(4, 2), 16);
    } else if(css.length == 3) {
      r = parseInt(css.substr(0, 1), 16) * 17;
      g = parseInt(css.substr(1, 1), 16) * 17;
      b = parseInt(css.substr(2, 1), 16) * 17;
    } else if(css.length == 8) {
      r = parseInt(css.substr(0, 2), 16);
      g = parseInt(css.substr(2, 2), 16);
      b = parseInt(css.substr(4, 2), 16);
      a = parseInt(css.substr(6, 2), 16);
    } else if(css.length == 4) {
      r = parseInt(css.substr(0, 1), 16) * 17;
      g = parseInt(css.substr(1, 1), 16) * 17;
      b = parseInt(css.substr(2, 1), 16) * 17;
      a = parseInt(css.substr(3, 1), 16) * 17;
    } else {
      return undefined;
    }
    return [r, g, b, a];
  }
  var l = css.toLowerCase();
  // CSS level 1 colors plus CSS level 2 'orange' plus 'transparent' plus a few of the synonyms from CSS level 3, but no other later revisions to keep it short here as this is not really the goal to support that.
  if(l == 'black') return [0, 0, 0, 255];
  if(l == 'silver') return [192, 192, 192, 255];
  if(l == 'gray' || l == 'grey') return [128, 128, 128, 255];
  if(l == 'white') return [255, 255, 255, 255];
  if(l == 'maroon') return [128, 0, 0, 255];
  if(l == 'red') return [255, 0, 0, 255];
  if(l == 'purple') return [128, 0, 128, 255];
  if(l == 'fuchsia' || l == 'magenta') return [255, 0, 255, 255];
  if(l == 'green') return [0, 128, 0, 255];
  if(l == 'lime') return [0, 255, 0, 255];
  if(l == 'olive') return [128, 128, 0, 255];
  if(l == 'yellow') return [255, 255, 0, 255];
  if(l == 'navy') return [0, 0, 128, 255];
  if(l == 'blue') return [0, 0, 255, 255];
  if(l == 'teal') return [0, 128, 128, 255];
  if(l == 'aqua' || l == 'cyan') return [0, 255, 255, 255];
  if(l == 'orange') return [255, 165, 0, 255];
  if(l == 'transparent') return [0, 0, 0, 0];
}

function RGBtoCSS(rgba) {
  var r = Math.floor(rgba[0]).toString(16);
  var g = Math.floor(rgba[1]).toString(16);
  var b = Math.floor(rgba[2]).toString(16);
  var a = rgba.length >= 4 ? Math.floor(rgba[3]).toString(16) : 'ff';
  if(r.length == 1) r = '0' + r;
  if(g.length == 1) g = '0' + g;
  if(b.length == 1) b = '0' + b;
  if(a.length == 1) a = '0' + a;
  return '#' + r + g + b + a;
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// order of each group: darkest, dark low saturation, bright low saturation, full saturation
// each line is a 30 degree hue rotation (the names are not 100% official names, but chosen to have 12 unique first letters)
// the letter choice tries to have memorable and as common as possible color names.
// The second letter is almost always before or after it in the alphabet, except for b->j and a->i because it was not possible there.
// Names were chosen for unique starting letters, so a few don't exactly match their 30 degree hue bucket (e.g. lime should actually be chartreuse)
var letters = [
  ['p', 'r', 'R', 'P'], // red
  ['%', 's', 'S', '$'], // scarlet (actually vermillion, but v is already for violet)
  ['x', 'o', 'O', 'X'], // orange
  ['[', 'e', 'E', ']'], // ambEr (NOTE: with E, since a is taken by azure)
  ['z', 'y', 'Y', 'Z'], // yellow
  ['k', 'l', 'L', 'K'], // lime (actually chartreuse, but c is already for cyan)
  ['|', 'h', 'H', '#'], // harlequin
  ['q', 'g', 'G', 'Q'], // green
  ['u', 't', 'T', 'U'], // turquoise
  ['(', 'c', 'C', ')'], // cyan
  ['&', 'a', 'A', '@'], // azure
  ['d', 'b', 'B', 'D'], // blue
  ['j', 'i', 'I', 'J'], // indigo
  ['w', 'v', 'V', 'W'], // violet (also purple)
  ['n', 'm', 'M', 'N'], // magenta
  ['{', 'f', 'F', '}'], // fuchsia (actually crimson, but c is already for cyan)
];

function generatePalette(header) {
  // in the header, and the hues and lisat in this function: they're always given as an RGB CSS color, but sometimes only the hue, or only the lightness and saturation parts, of it are used
  // so e.g. to indicate a lightness+saturation, give any color (like, some shade of red) with the desired lightness and saturation encoded in it
  // they can also optionally indicate alpha

  if(header && header[0] == '#') header = header.substr(1);

  // These hues are 12 30-degree equispaced RGB hues, plus in addition 4 hues inserted between: red-orange, orange-yellow, lime-green, blue-violet.
  // This allows to use any desired subset or all of them, including any desired 12-color color circle: RGB (opposing pairs RC, GM and BY), RYB (opposing pairs RG, YV and BO) or RYGB (opposing pairs RG and YB).
  var hues = [
    '#f00', // red
    '#f40', // scarlet
    '#f80', // orange
    '#fc0', // amber
    '#ff0', // yellow
    '#8f0', // lime
    '#5f0', // harlequin
    '#0f0', // green
    '#0f8', // turquoise
    '#0ff', // cyan
    '#08f', // azure
    '#00f', // blue
    '#40f', // indigo
    '#80f', // violet
    '#f0f', // magenta
    '#f08', // fuchsia
  ];

  // the 4 default lightness/saturation combos for the 4 letters belonging to the same group
  var lisat = [
    '#400',
    '#822',
    '#a55',
    '#faa',
  ];

  var gradient = [
    '#000',
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    '#fff'
  ];

  var all = undefined;


  var hueshift0 = 0;
  var hueshift = 0;
  // temperature shift
  var tempshift0 = 0;
  var tempshift = 0;

  if(header) {
    var sections = header.split(' ');
    for(var i = 0; i < sections.length; i++) {
      var section = sections[i];
      var kv = section.split(':');
      var k = kv[0];
      var v = kv[1];
      if(k == 'l0') lisat[0] = v; // custom lightness/saturation 0
      else if(k == 'l1') lisat[1] = v; // custom lightness/saturation 1
      else if(k == 'l2') lisat[2] = v; // custom lightness/saturation 2
      else if(k == 'l3') lisat[3] = v; // custom lightness/saturation 3
      else if(k == 'hs0') hueshift0 = parseFloat(v); // optional hue shift for each row (0.0-1.0)
      else if(k == 'hs1') hueshift = parseFloat(v); // optional hue shift for each row (0.0-1.0)
      else if(k == 'ts0') tempshift0 = parseFloat(v);
      else if(k == 'ts1') tempshift = parseFloat(v);
      else if(k[0] == 'h') {
        for(var j = 0; j < letters.length; j++) {
          if(k[1] == letters[j][1]) {
            hues[j] = v;
            break;
          }
        }
      }
      else if(k == 'g0') gradient[0] = v;
      else if(k == 'g1') gradient[1] = v;
      else if(k == 'g2') gradient[2] = v;
      else if(k == 'g3') gradient[3] = v;
      else if(k == 'g4') gradient[4] = v;
      else if(k == 'g5') gradient[5] = v;
      else if(k == 'g6') gradient[6] = v;
      else if(k == 'g7') gradient[7] = v;
      else if(k == 'g8') gradient[8] = v;
      else if(k == 'g9') gradient[9] = v;
      else if(k == 'aa') all = RGBtoHSV(CSStoRGB(v));
    }
  }

  var palette = {};

  for(var i = 0; i <= 9; i++) {
    // '0'-'9'
    var j = i + 1;
    while(j < 9 && gradient[j] == undefined) j++;
    if(j == i + 1) {
      var c = String.fromCharCode('0'.charCodeAt(0) + i);
      palette[c] = CSStoRGB(gradient[i]);
    } else {
      var ci = CSStoRGB(gradient[i]);
      var cj = CSStoRGB(gradient[j]);
      var n = j - i;
      for(var k = 0; k < n; k++) {
        var c = String.fromCharCode('0'.charCodeAt(0) + i + k);
        var vj = k / n;
        var vi = 1 - vj;
        palette[c] = [Math.floor(ci[0] * vi + cj[0] * vj), Math.floor(ci[1] * vi + cj[1] * vj), Math.floor(ci[2] * vi + cj[2] * vj), Math.floor(ci[3] * vi + cj[3] * vj)];
      }
      i = j - 1;
    }
  }

  for(var i = 0; i < letters.length; i++) {
    for(var j = 0; j < 4; j++) {
      var c = letters[i][j];
      var h_rgb = CSStoRGB(hues[i]);
      var l_rgb = CSStoRGB(lisat[j]);
      var h_hsv = RGBtoHSV(h_rgb);
      var h = h_hsv[0];
      h += ((3 - j) * hueshift0 + j * hueshift) / 3 * 255;
      while(h > 255) h -= 255;
      while(h < 0) h += 255;
      var l = RGBtoHSL(l_rgb);
      var rgb = HSLtoRGB([h, l[1] * h_hsv[1] / 255, l[2] * h_hsv[2] / 255]);
      if(tempshift0 || tempshift) {
        var v = ((3 - j) * tempshift0 + j * tempshift) / 3;
        var max = 255;//Math.max(Math.max(rgb[0], rgb[1]), rgb[2]);
        var min = 0;//Math.min(Math.min(rgb[0], rgb[1]), rgb[2]);
        if(v < 0) {
          v = -v;
          rgb[0] = Math.floor(rgb[0] * (1 - v) + v * min);
          rgb[2] = Math.floor(rgb[2] * (1 - v) + v * max);
        } else {
          rgb[0] = Math.floor(rgb[0] * (1 - v) + v * max);
          rgb[2] = Math.floor(rgb[2] * (1 - v) + v * min);
        }

      }
      palette[c] = rgb;
      palette[c][3] = Math.min(l_rgb[3], h_rgb[3]); // alpha
    }
  }

  palette['+'] = [255, 0, 0, 255];
  palette['-'] = [255, 255, 0, 255];
  palette['*'] = [0, 255, 0, 255];
  palette['/'] = [0, 0, 255, 255];

  palette[' '] = palette['.'] = [0, 0, 0, 0]; // transparent

  // also allow to override any known symbol (except space or period) after all the above rules were applied:
  if(header) {
    var sections = header.split(' ');
    for(var i = 0; i < sections.length; i++) {
      var section = sections[i];
      var kv = section.split(':');
      var k = kv[0];
      var v = kv[1];
      if(k.length == 1 && palette[k] != undefined && k != ' ' && k != '.') palette[k] = CSStoRGB(v);
    }
  }

  // the "affect all", if present
  if(all) {
    for(k in palette) {
      if(!palette.hasOwnProperty(k)) continue;

      var hsv = RGBtoHSV(palette[k]);
      hsv[1] *= all[1] / 255;
      hsv[2] *= all[2] / 255;
      hsv[3] *= all[3] / 255;
      palette[k] = HSVtoRGB(hsv);
    }
  }

  return palette;
}

var defaultpal = generatePalette();


/*
Generates an image from ASCII text as follows:
-if first line starts with a # character, it's a header
-newline of first non-header line: indicates width of image
-amount of lines after first non-header line, excluding a possible final empty line which is ignored: indicates height of image
-characters making up the image:
 - space, or period ".", or too short line: fully transparent
 - 0,1,2,3,4,5,6,7,8,9: 10 shades of gradient, by default black through gray to white
 - character/letter series representing a hue (named by second letter), with 4 lightness/saturation combinations for each:
  -- prRP: red
  -- %sS$: scarlet (actually vermillion)
  -- xoOX: orange
  -- [eE]: amber (with E from ambEr, since a is taken by azure)
  -- zyYZ: yellow
  -- klLK: lime (actually chartreuse)
  -- |hH#: harlequin
  -- qgGQ: green
  -- utTU: turquoise
  -- (cC): cyan
  -- &aA@: azure
  -- dbBD: blue
  -- jiIJ: indigo
  -- wvVW: violet (aka purple)
  -- nmMN: magenta
  -- {fF}: fuchsia (actually crimson)
 - +,-,*,/: these 4 characters can be overridden to any color. The defaults are #f00, #ff0, #0f0, #00f (red, yellow, green, blue)
-header after the # has following fields, all of the form key:value and space separated, and where CSS color values use hex CSS notation of the form #hhh, #hhhh, #hhhhhh or #hhhhhhhh
  -- l0: change lightness, saturation, transparency 0 (first column of hue letters) to that of given CSS color (its hue is ignored)
  -- l1: change lightness, saturation, transparency 1 (second column of hue letters) to that of given CSS color (its hue is ignored)
  -- l2: change lightness, saturation, transparency 2 (third column of hue letters) to that of given CSS color (its hue is ignored)
  -- l3: change lightness, saturation, transparency 3 (fourth column of hue letters) to that of given CSS color (its hue is ignored)
  -- hs0: set a hue shift in range -1.0..1.0 to the start (first column). The total hue shift of a column is then interpolated from hs0 at the start to hs1 at the end. 1 is a 360 degree rotation. Should be subtle (such as 0.05 or -0.05) for most useful effect.
  -- hs1: end for hs0
  -- ts0: similar to hs0, but for temperature shift (ts). E.g. use ts0=-0.25, ts1s=0.25 for subtle cold shadow to warm glow effect.
  -- ts1: end for ts0
  -- hX: affect hue series X, where X is the second letter of one of the hue series, e.g. r for red: change the hue of that entire series to the hue/saturation/lightness/alpha of the given color (lightness computed using the HSV method), e.g. hf:#802 to change the fuchsia to be more red-ish and also darker
  -- g0, g1, ..., g9: set gradient value 0 to 9 to the given CSS color. Initially, g0 is #000 and g9 is #fff and all values in between are undefined, causing a grayscale gradient. Changing any entry sets that entry to that exact value, and will fill in undefined entries with a gradient between the two nearest defined neighbors.
  -- 0-9,a-z,A-Z,... (any known single character): set value directly to the given CSS color (can also have alpha channel), overriding and after any of the above rules
  -- aa: affect all: reduce lightness, saturation and alpha of all based on the lightness, saturation and alpha of the given color value here, this is done after all the above rules, including single characters
  -- example of a header: #l0:#c22 l1:#d44 l2:#e66 l3:#f88
*/
function generateImage(text) {
  text = text.trim();
  var pal = defaultpal;
  var lines = text.split('\n');

  // if has header (header start is always indicated with #)
  if(lines[0][0] == '#') {
    var header = lines[0].substr(1);
    lines.shift();
    pal = generatePalette(header);
  }

  if(!lines.length) return undefined;
  var w = lines[0].length;
  var h = lines.length;

  var data  = [];
  for(var y = 0; y < h; y++) {
    data[y] = [];
    for(var x = 0; x < w; x++) {
      var c = lines[y][x];
      if(!c || c == '\'') c = ' ';
      var color = pal[c];
      if(!color) color = [0, 0, 0, 0];

      data[y][x] = color;
    }
  }

  return [data, w, h];
};

// internal canvas (in memory texture)
function createCanvasImageFor(image) {
  if(!image) return undefined;
  var data = image[0];
  var w = image[1];
  var h = image[2];

  var canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  var ctx = canvas.getContext("2d");
  var id = ctx.createImageData(w, h);

  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      id.data[(y * w + x) * 4 + 0] = data[y][x][0];
      id.data[(y * w + x) * 4 + 1] = data[y][x][1];
      id.data[(y * w + x) * 4 + 2] = data[y][x][2];
      id.data[(y * w + x) * 4 + 3] = data[y][x][3];
    }
  }

  ctx.putImageData(id, 0, 0);
  return [id, w, h, canvas];
}


////////////////////////////////////////////////////////////////////////////////

// like generateImage, but creates a canvas data for it (not a visible canvas, but one that servers as texture in memory that can be put on visible canvases)
function generateImageCanvas(text) {
  return createCanvasImageFor(generateImage(text));
};

// creates a new canvas, doesn't delete any. WARNING: If re-using this function on existing div, ensure to clear it first!
// difference from generateImageCanvas: the canvas from createCanvas is a visible canvas, that of generateImageCanvas is the texture in memory
// x, y, w and h must have HTML units
function createCanvas(x, y, w, h, opt_parent) {
  var parent = opt_parent || document.body;

  var canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.left = x;
  canvas.style.top = y;
  canvas.style.width = w;
  canvas.style.height = h;
  canvas.classList.add('pixelated');
  parent.appendChild(canvas);

  return canvas;
}


function renderImage(image, canvas) {
  var iw = image[1];
  var ih = image[2];

  if(canvas.width != iw) canvas.width = iw;
  if(canvas.height != ih) canvas.height = ih;
  var ctx = canvas.getContext("2d");

  // TODO: Which one of these two options is the fastest?
  ctx.putImageData(image[0], 0, 0);
  //ctx.drawImage(image[3], 0, 0); // does not work correctly, requires clearing canvas first, or fern may stay after clicking fern
}

var blendImageTempCanvas = document.createElement('canvas');


function blendImage(image, canvas) {
  var data = image[0];
  var iw = image[1];
  var ih = image[2];

  if(canvas.width != iw) canvas.width = iw;
  if(canvas.height != iw) canvas.height = ih;
  var ctx = canvas.getContext("2d");


  blendImageTempCanvas.width = iw;
  blendImageTempCanvas.height = ih;
  var ctx2 = blendImageTempCanvas.getContext("2d");

  ctx2.putImageData(data, 0, 0);
  ctx.drawImage(blendImageTempCanvas, 0, 0);
}

function unrenderImage(canvas) {
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}





////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// alpha-blends image b on top of image a, with the images given as RGBA 0-255 colors
function blendImages(a, b) {
  var aw = a[1];
  var ah = a[2];
  a = a[0];
  var bw = b[1];
  var bh = b[2];
  b = b[0];
  var w = Math.max(aw, bw);
  var h = Math.max(ah, bh);
  var r = [];
  for(var y = 0; y < h; y++) {
    r[y] = [];
    for(var x = 0; x < w; x++) {
      var ca = (y < ah && x < aw) ? a[y][x] : [0, 0, 0, 0];
      var cb = (y < bh && x < bw) ? b[y][x] : [0, 0, 0, 0];
      var v = cb[3] / 255;
      var red = ca[0] * (1 - v) + cb[0] * v;
      var green = ca[1] * (1 - v) + cb[1] * v;
      var blue = ca[2] * (1 - v) + cb[2] * v;
      var alpha = Math.max(ca[3], cb[3]); // TODO this needs a slightly different formula
      r[y][x] = [Math.floor(red), Math.floor(green), Math.floor(blue), Math.floor(alpha)];
    }
  }
  return [r, w, h];
}
