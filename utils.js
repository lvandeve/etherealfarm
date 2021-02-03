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

// Generic JavaScript utilities
var Utils = (function() {
  // exported functions are assigned to result which will be returned by this self invoking anonymous function expression
  var result = {};

  var doNotAddToParent = 'doNotAddToParent';
  result.doNotAddToParent = doNotAddToParent;

  var makeElement = function(tag, opt_parent) {
    var parent = opt_parent || document.body;
    var el =  document.createElement(tag);
    if(parent != doNotAddToParent) parent.appendChild(el);
    return el;
  };
  result.makeElement = makeElement;

  var makeElementAt = function(tag, x, y, opt_parent) {
    var el = makeElement(tag, opt_parent);
    el.style.position = 'absolute';
    el.style.left = '' + Math.floor(x) + 'px';
    el.style.top = '' + Math.floor(y) + 'px';
    return el;
  };
  result.makeElementAt = makeElementAt;

  var makeAbsElement = function(tag, x, y, w, h, opt_parent) {
    var el = makeElement(tag, opt_parent);
    el.style.position = 'absolute';
    el.style.left = (x && x.length && x[x.length - 1] == '%') ? x : (Math.floor(x) + 'px');
    el.style.top = (y && y.length && y[y.length - 1] == '%') ? y : (Math.floor(y) + 'px');
    el.style.width = (w && w.length && w[w.length - 1] == '%') ? w : (Math.floor(w) + 'px');
    el.style.height = (h && h.length && h[h.length - 1] == '%') ? h : (Math.floor(h) + 'px');
    return el;
  };
  result.makeAbsElement = makeAbsElement;

  var removeElement = function(el) {
    if(!el) return;
    var p = el.parentNode;
    if(p && p.contains(el)) {
      p.removeChild(el);
    }
  };
  result.removeElement = removeElement;

  var makeDiv = function(x, y, w, h, opt_parent) {
    var el =  makeAbsElement('div', x, y, w, h, opt_parent);
    return el;
  };
  result.makeDiv = makeDiv;

  //bind a single argument to a function
  var bind = function(f, arg) {
    var args = Array.prototype.slice.call(arguments, 1);
    var result = function() {
      return f.apply(this, args.concat(Array.prototype.slice.call(arguments)));
    };
    result.bound_f = f; // to be able to "extract" the original function out of it for debugging and by code
    result.bound_arg = arg; // to be able to "extract" the original function out of it for debugging and by code
    return result;
  };
  result.bind = bind;

  var clone = function(obj) {
    // Handle the 3 simple types, and null or undefined
    if(null == obj || 'object' != typeof obj) return obj;

    // Handle Array
    if(obj instanceof Array) {
      var copy = [];
      for(var i = 0, len = obj.length; i < len; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
      var copy = new obj.constructor(); //This makes it also have the correct prototype
      for(var attr in obj) {
        if(obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
      }
      return copy;
    }

    throw new Error('Cloning this object not supported.');
  };
  result.clone = clone;

  var textHasAt = function(text, pos, sub) {
    return text.substr(pos, sub.length) == sub;
  };
  result.textHasAt = textHasAt;

  var mergeMaps = function(a, b) {
    var c = clone(a);
    for(var k in b) {
      if(b.hasOwnProperty(k)) c[k] = b[k];
    }
    return c;
  };
  result.mergeMaps = mergeMaps;

  var getCGIParameterByName = function(name, opt_url) {
    var url = opt_url || window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  };
  result.getCGIParameterByName = getCGIParameterByName;

  // like getCGIParameterByName, but with # instead of ?
  var getFragmentParameterByName = function(name, opt_url) {
    var url = opt_url || window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[#&]" + name + "(=([^&#]*)|&|#|$)");
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  };
  result.getFragmentParameterByName = getFragmentParameterByName;

  // sets fragment with this value. Supports only max 1 fragment in total.
  var setFragment = function(name, value) {
    if(history && history.replaceState) {
      // using history to NOT have history!
      // with history.replaceState, this avoids it creating a new back-button entry each time you update the URL fragment
      // reason for not storing this as history: it doesn't actually work because there's nothing here that handles pressing the back button,
      // and, it's quite annoying if this app creates a long back button history so you can't go back to the real previous website you came from.
      // if I do implement history button at some point, maybe it should only go back to index, but not through all circuits visited to avoid that annoyance
      if(!value) {
        if(window.location.hash) history.replaceState(undefined, undefined, '#');
      } else {
        history.replaceState(undefined, undefined, '#' + name + '=' + value);
      }
    } else {
      // fallback for browsers that don't support history.replaceState
      if(!value) {
        if(window.location.hash) window.location.hash = '';
      } else {
        window.location.hash = '#' + name + '=' + value;
      }
    }
  };
  result.setFragment = setFragment;

  var clearFragment = function() {
    setFragment('', null);
  };
  result.clearFragment = clearFragment;

  // removes queries and fragments
  var getUrlWithoutQueries = function() {
    var url = window.location.href;
    var q = url.indexOf('?');
    if(q >= 0) url = url.substr(0, q);
    q = url.indexOf('#');
    if(q >= 0) url = url.substr(0, q);
    return url;
  };
  result.getUrlWithoutQueries = getUrlWithoutQueries;

  var clearSelection = function() {
    if(document.selection) {
      document.selection.empty();
    } else if(window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  };
  result.clearSelection = clearSelection;


  var localStorageSupported = function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch(e) {
      return false;
    }
  };
  result.localStorageSupported = localStorageSupported;

  //remember user settings locally (note that this is all fully local, nothing gets sent to any server)
  var setLocalStorage = function(data, name) {
    if(!localStorageSupported()) return;
    window.localStorage[name] = data ? data : '';
  };
  result.setLocalStorage = setLocalStorage;

  //note: returns values as strings, e.g. booleans will get string 'true' or 'false'
  var getLocalStorage = function(name, opt_default) {
    if(!localStorageSupported()) return opt_default;
    if(window.localStorage[name] == undefined) return opt_default;
    return window.localStorage[name];
  };
  result.getLocalStorage = getLocalStorage;

  var clearLocalStorage = function(name) {
    if(!localStorageSupported()) return;
    setLocalStorage(undefined, name);
  };
  result.clearLocalStorage = clearLocalStorage;


  // Replacement for setInterval that hopefully works a bit better in modern background-tab-throttling browsers
  // This is not attempting to circumvent background throttling, but instead trying to prevent the tab hanging
  // when coming back to it and browsers may make it do all the missed intervals at once...
  // This tries to combine timeouts with the desired timing, with requestAnimationFrame which has better guarantees that
  // the browser will not do any more frames when the tab is in the background (rather than collect more and more "debt" of expensive updates it will try to call all at once)
  // TODO: this may require updating every now and then as browsers change their behavior of background tabs
  var setIntervalSafe = function(fun, msec) {
    var clear = false;
    var fun2 = function() {
      if(clear) return;
      fun();
      // requestAnimationFrame is used because this one will not run in background tab, which is better than being throttled in background tab but then do all updates at once when the tab becomes foreground, causing slow computation
      // NOTE: this may add an extra delay to the desired msec, of 1/60th of a second probably
      requestAnimationFrame(function() {
        // setTimeout is used becuase this one uses the desired milliseconds unlike requestAnimationFrame.
        window.setTimeout(fun2, msec);
      });
    };
    window.setTimeout(fun2, msec);
    var clearfun = function() {
      clear = true;
    };
    return clearfun;
  };
  result.setIntervalSafe = setIntervalSafe;

  var clearIntervalSafe = function(id) {
    id(); // id is actually a function.
  };
  result.clearIntervalSafe = clearIntervalSafe;

  // See explanation at setIntervalSafe
  var setTimeoutSafe = function(fun, msec) {
    // NOTE: this is very unreliable in modern browsers, especially when tabs come back from background
    var time0 = (new Date()).getTime(); // milliseconds since epich
    var canceled = false;

    // test: disable the requestAnimationFrame step: makes it faster for small msec amounts, but however
    // causes risk of causing browser to hang when this tab was in background and gets enabled again only later
    // TODO: find way that allows fast updates yet works correctly (= doesnt' consume resources just like the browser wants) in background tabs. Unfortunately requestAnimationFrame is the only thing that guarantees nice behavior but is limited to 60fps... so using requestAnimationFrame only every so many ticks (of the update() function) could work
    //var requestAnimationFrame = function(fun){fun();};

    requestAnimationFrame(function() {
      if(canceled) return;
      var time1 = (new Date()).getTime();
      var d = time1 - time0;
      msec -= d;
      if(msec > 0) {
        window.setTimeout(function() {
          if(canceled) return;
          fun();
        }, msec);
      } else {
        fun();
      }
    });
    return function() {
      canceled = true;
    };
  };
  result.setTimeoutSafe = setTimeoutSafe;

  var clearTimeoutSafe = function(id) {
    id(); // id is actually a function.
  };
  result.clearTimeoutSafe = clearTimeoutSafe;


  // warning: does not validate input
  var normalizeCSSColor = function(css) {
    // only has named colors used somewhere in here.
    if(css == 'black') css = '#000000';
    if(css == 'white') css = '#ffffff';
    if(css == 'red') css = '#ff0000';
    if(css == 'green') css = '#00ff00';
    if(css == 'blue') css = '#0000ff';
    if(css == 'yellow') css = '#00ffff';
    if(css.length == 4) {
      css = '#' + css[1] + css[1] + css[2] + css[2] + css[3] + css[3];
    }
    return css;
  };

  var parseCSSColor = function(css) {
    css = normalizeCSSColor(css);
    var r = parseInt(css.substr(1, 2), 16);
    var g = parseInt(css.substr(3, 2), 16);
    var b = parseInt(css.substr(5, 2), 16);
    return [r, g, b];
  };


  var formatCSSColor = function(rgb) {
    var r = rgb[0].toString(16);
    var g = rgb[1].toString(16);
    var b = rgb[2].toString(16);
    if(r.length == 1) r = '0' + r;
    if(g.length == 1) g = '0' + g;
    if(b.length == 1) b = '0' + b;
    return '#' + r + g + b;
  };

  var formatCSSColorAlpha = function(rgba) {
    return 'rgba(' + rgba[0].toString(10) + ', ' + rgba[1].toString(10) + ', ' +
           rgba[2].toString(10) + ', ' + (rgba[3] / 255.0) + ')';
  };

  var darkenColor = function(css, factor) {
    factor = factor || 0.5;
    var rgb = parseCSSColor(css);
    rgb[0] = Math.floor(rgb[0] * factor);
    rgb[1] = Math.floor(rgb[1] * factor);
    rgb[2] = Math.floor(rgb[2] * factor);
    return formatCSSColor(rgb);
  };
  result.darkenColor = darkenColor;



  var negateLightness = function(css) {
    var rgb = parseCSSColor(css);
    var r = rgb[0];
    var g = rgb[1];
    var b = rgb[2];
    var mm = Math.min(Math.min(r, g), b) + Math.max(Math.max(r, g), b);
    r = 255 - mm + r;
    g = 255 - mm + g;
    b = 255 - mm + b;
    return formatCSSColor([r, g, b]);
  };
  result.negateLightness = negateLightness;


  // formats time given in second as years, months, days, hours, minutes, seconds
  // opt_maxSections is how many different sections to print, or leave out smaller ones. Default is 3, max is 9.
  // the sections are: giga-annum, mega-annum, millenium, year, month, day, hour, minute, second.
  // opt_short: if true, uses e.g. "D" instead of " days", "h" instead of " hours", etc...
  // opt_inv: inverses direction of max sections. If false, starts from largest and leaves out smaller. If true, leaves out larger ones instead
  var formatDuration = function(s, opt_short, opt_maxSections, opt_inv) {
    var maxSections = opt_maxSections || 3;
    if(isNaN(s)) return 'NaN';
    if(s < 0) return '-' + formatDuration(-s);

    if(s == Infinity) return 'Infinity ' + (opt_short ? 's' : ' seconds');

    var orig = s;
    s = Math.floor(s);

    var GG = 0, MM = 0, mm = 0, Y = 0, M = 0, D = 0, h = 0, m = 0;
    if(!(opt_inv && maxSections < 9) && s >= 31556952000000000) { // seconds in a billion years. NOTE: it cannot actually distinguish seconds anymore at this timescale with 53-bit ints, they go to 9007199254740992, about 0.28 Ga
      GG = Math.floor(s / 31556952000000000);
      s -= GG * 31556952000000000;
    }
    if(!(opt_inv && maxSections < 8) && s >= 31556952000000) { // seconds in a million years
      MM = Math.floor(s / 31556952000000);
      s -= MM * 31556952000000;
    }
    if(!(opt_inv && maxSections < 7) && s >= 31556952000) { // seconds in a millenium with 242.5 leap years
      mm = Math.floor(s / 31556952000);
      s -= mm * 31556952000;
    }
    if(!(opt_inv && maxSections < 6) && s >= 31557600) {  // seconds in a 365.25 day year
      Y = Math.floor(s / 31557600);
      s -= Y * 31557600;
    }
    if(!(opt_inv && maxSections < 5) && s >= 2635200) {  // seconds in a 30.5 day month
      M = Math.floor(s / 2635200);
      s -= M * 2635200;
    }
    if(!(opt_inv && maxSections < 4) && s >= 86400) {  // seconds in a day
      D = Math.floor(s / 86400);
      s -= D * 86400;
    }
    if(!(opt_inv && maxSections < 3) && s >= 3600) {
      h = Math.floor(s / 3600);
      s -= h * 3600;
    }
    if(!(opt_inv && maxSections < 2) && s >= 60) {
      m = Math.floor(s / 60);
      s -= m * 60;
    }

    var names_single = opt_short ? ['Ga', 'Ma', 'mm', 'Y', 'M', 'd', 'h', 'm', 's'] : [' Ga', ' Ma', ' millenium', ' year', ' month', ' day', ' hour', ' minute', ' second'];
    var names_plural = opt_short ? ['Ga', 'Ma', 'mm', 'Y', 'M', 'd', 'h', 'm', 's'] : [' Ga', ' Ma', ' millenia', ' years', ' months', ' days', ' hours', ' minutes', ' seconds'];

    var result = '';

    var sp = function() {
      return result == '' ? '' : ' ';
    }

    if(opt_inv) {
      if(GG > 0) { result += sp() + GG + names_single[0]; }
      if(MM > 0) { result += sp() + MM + names_single[1]; }
      if(mm > 0) { result += sp() + mm + names_single[2]; }
      if(Y > 0 ) { result += sp() + Y + names_single[3]; }
      if(M > 0 ) { result += sp() + M + names_single[4]; }
      if(D > 0 ) { result += sp() + D + names_single[5]; }
      if(h > 0 ) { result += sp() + h + names_single[6]; }
      if(m > 0 ) { result += sp() + m + names_single[7]; }
      if(s > 0 ) { result += sp() + s + names_single[8]; }
    } else {
      var sections = 0;
      // giga-annum
      if(GG > 100) ++sections;
      if(GG > 10) ++sections;
      if(GG > 0) { result += GG + names_single[0]; if((++sections) >= maxSections) return result; }
      // mega-annum
      if(MM > 0) { result += sp() + MM + names_single[1]; if((++sections) >= maxSections) return result; }
      if(mm > 0) { result += sp() + mm + (mm == 1 ? names_single[2] : names_plural[2]); if((++sections) >= maxSections) return result; }
      if(Y > 0) { result += sp() + Y + (Y == 1 ? names_single[3] : names_plural[3]); if((++sections) >= maxSections) return result; }
      if(M > 0) { result += sp() + M + (M == 1 ? names_single[4] : names_plural[4]); if((++sections) >= maxSections) return result; }
      if(D > 0) { result += sp() + D + (D == 1 ? names_single[5] : names_plural[5]); if((++sections) >= maxSections) return result; }
      if(h > 0) { result += sp() + h + (h == 1 ? names_single[6] : names_plural[6]); if((++sections) >= maxSections) return result; }
      if(m > 0) { result += sp() + m + (m == 1 ? names_single[7] : names_plural[7]); if((++sections) >= maxSections) return result; }
      if(s > 0) { result += sp() + s + (s == 1 ? names_single[8] : names_plural[8]); if((++sections) >= maxSections) return result; }
    }

    if(result == '') result = orig.toFixed(3) + names_plural[8];

    return result;
  };
  result.formatDuration = formatDuration;

  var zeroPad = function(s, n) {
    var num = n - ('' + s).length;
    if(num <= 0) return s;
    var result = '';
    for(var i = 0; i < num; i++) result += '0';
    return result + s;
  };

  // date is given as seconds since unix epoch in UTC and returned in format YYYY-MM-DD hh:mm:ss in current timezone
  // if iso, uses the form YYYYMMDDThhmmss, without any special symbols to be filename compatible
  var formatDate = function(time, iso) {
    var date = new Date(time * 1000);
    var result = '';
    result += zeroPad(date.getFullYear(), 4);
    if(!iso) result += '-';
    result += zeroPad(date.getMonth() + 1, 2);
    if(!iso) result += '-';
    result += zeroPad(date.getDate(), 2);
    result += iso ? 'T' : ' ';
    result += zeroPad(date.getHours(), 2);
    if(!iso) result += ':';
    result += zeroPad(date.getMinutes(), 2);
    if(!iso) result += ':';
    result += zeroPad(date.getSeconds(), 2);
    return result;
  };
  result.formatDate = formatDate;


  var roman_thousands = ['', 'M', 'MM', 'MMM'];
  var roman_hundreds = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM'];
  var roman_tens = ['', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC'];
  var roman_units = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  // v must be integer >= 1 and <= 3999
  var toRoman = function(v) {
    if(v < 1 || v > 3999) return v.toString();
    return roman_thousands[Math.floor(v / 1000)] + roman_hundreds[Math.floor(v / 100) % 10]
       + roman_tens[Math.floor(v / 10) % 10] + roman_units[v % 10];
  };
  result.toRoman = toRoman;

  // uses IEEE rules
  var createfloat = function(sign, exp, mantissa, expbits, mantissabits) {
    if(expbits == 0 && mantissabits == 0) {
      return sign ? -0 : 0;
    }
    var subnormal = (exp == 0);
    var special = (exp == (1 << expbits) - 1);
    if(special) {
      if(sign) return mantissa ? -NaN : -Infinity;
      return mantissa ? NaN : Infinity;
    }
    var bias = (1 << (expbits - 1)) - 1;
    exp -= bias;
    if(subnormal) exp++;
    mantissa /= Math.pow(2, mantissabits);
    if(!subnormal) mantissa += 1;

    var result = mantissa;
    result *= Math.pow(2, exp);
    if(sign) result = -result;
    return result;
  };
  result.createfloat = createfloat;

  // returns [sign, mantissa, exponent] all as unsigned binary integers. mantissabits is physical amount of bits, e.g. 52 for float64 (and not 53)
  var dissectfloat = function(f, expbits, mantissabits) {
    // NOTE: in the pathalogical case of 3, 2 or 1 bits, we have respectively: SEM, SE, S (where S=sign bit, E=exponent bits, M=mantissa bits). So e.g. the 2-bit case only supports 0, -0, Inf and -Inf.
    if(expbits == 0 && mantissabits == 0) return [(f < 0) ? 1 : 0, 0, 0];
    var sign = 0;
    if(f < 0) {
      f = -f;
      sign = 1;
    }
    var maxexp = (1 << expbits) - 1;
    if(f == Infinity) {
      return [sign, maxexp, 0];
    }
    if(isNaN(f)) {
      return [sign, maxexp, 1];
    }
    if(f == 0) {
      if(1 / f < 0) sign = 1; // for the case of negative zero (-0)
      return [sign, 0, 0];
    }

    var exp = 0;
    while(f >= 2) {
      f /= 2;
      exp++;
    }
    while(f < 1) {
      f *= 2;
      exp--;
    }
    var bias = (1 << (expbits - 1)) - 1;
    exp += bias;
    if(exp < 1) {
      // subnormal number
      var mantissa = Math.floor(f * Math.pow(2, mantissabits + exp - 1));
      return [sign, 0, mantissa];
    }
    if(exp >= maxexp) {
      // overflow, return infinity
      return [sign, maxexp, 0];
    }
    var mantissa = Math.floor((f - 1) * Math.pow(2, mantissabits));
    return [sign, exp, mantissa];
  };
  result.dissectfloat = dissectfloat;

  // returns time since epoch in seconds in UTC (as floating point)
  var getTime = function() {
    //return (new Date()).getTime() / 1000.0;
    return Date.now() / 1000.0;
  };
  result.getTime = getTime;



  /*Integer to integer hash for pseudorandom procedural world creation:
  A function which, given a 31-bit input integer, outputs another 31-bit integer with the following properties:
  -it's deterministic: a given input x+seed will always output the same value
  -calling randomPerm in order for all x from 0 to 4 billion, gives a pseudorandom sequence with good random properties
  -every output integer is unique, so it's a permutation
  seed: a seed for the random generator, must be an integer. NOTE: low seeds give bad results.*/
  var randomPerm = function(x, seed) {
    x ^= seed;
    x = (x * 287867) & 2147483647;
    x = x ^ 1111111111;
    x = (x * 287867) & 2147483647;
    return x;
  };

  // n max 31 bits, returns in range 0.0-1.0
  var pseudoRandom = function(n, seed) {
    return randomPerm(n % 2147483648, 1147483648 ^ seed) / 2147483648;
  };
  result.pseudoRandom = pseudoRandom;

  // x and y each max 15 bits, returns in range 0.0-1.0
  var pseudoRandom2D = function(x, y, seed) {
    return pseudoRandom((((y + 128) & 32767) << 15) + ((x + 128) & 32767), seed);
  };
  result.pseudoRandom2D = pseudoRandom2D;

  // x, y, z each max 10 bits, returns in range 0.0-1.0
  var pseudoRandom3D = function(x, y, z, seed) {
    return pseudoRandom((((z + 128) & 1023) << 20) + (((y + 128) & 1023) << 10) + ((x + 128) & 1023), seed);
  };
  result.pseudoRandom3D = pseudoRandom3D;


  var upperCaseFirstWord = function(text) {
    if(text && text.length > 0) text = text[0].toUpperCase() + text.substr(1);
    return text;
  };
  result.upperCaseFirstWord = upperCaseFirstWord;

  // adds event listener
  // event is string of existing JS event function: 'onclick', 'onmouseover', 'onmouseout', ...
  var addEvent = function(el, event, fun) {
    if(!el.util_added_events_) el.util_added_events_ = {};
    if(!el.util_added_events_[event]) el.util_added_events_[event] = [];
    if(el.util_added_events_[event].length > 8) {
      throw 'excessive amount of events added, there may be a bug where something keeps adding the same one';
    }
    el.util_added_events_[event].push(fun);
    el[event] = bind(function(a, e) {
      for(var i = 0; i < a.length; i++) {
        a[i](e);
      };
    }, el.util_added_events_[event]);
  };
  result.addEvent = addEvent;

  var setEvent = function(el, event, idname, fun) {
    if(!el.util_set_events_) el.util_set_events_ = {};
    if(!el.util_set_events_[event]) el.util_set_events_[event] = {};
    el.util_set_events_[event][idname] = fun;
    el[event] = bind(function(o, e) {
      for(var id in o) {
        if(o.hasOwnProperty(id)) o[id](e);
      }
    }, el.util_set_events_[event]);
  };
  result.setEvent = setEvent;

  var eventHasShiftKey = function(e) {
    return e.shiftKey;
  };
  result.eventHasShiftKey = eventHasShiftKey;

  var eventHasCtrlKey = function(e) {
    return e.ctrlKey || e.metaKey; // metakey is for macs where ctrl doesn't work and meta represents cmd key instead which is basically what one normally uses as ctrl there
  };
  result.eventHasCtrlKey = eventHasCtrlKey;


  return result;
}());

var util = Utils;

// allow to use very often used utility functions directly
var bind = util.bind;
var makeDiv = util.makeDiv;
var upper = util.upperCaseFirstWord;
var eventHasCtrlKey = util.eventHasCtrlKey;

