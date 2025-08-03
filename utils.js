/*
Ethereal Farm
Copyright (C) 2020-2025  Lode Vandevenne

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
    var el = document.createElement(tag);
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

  // Make the element completely reusable again, as if it was created from scratch, but instead it was an existing element, to which various events/styles/... could have been added, which are removed by this function
  // What this does NOT do is remove child elements.
  // aka cleanupElement aka recycleElement
  // does NOT support removing of events that used standard 'addEventListener' JS code, but supports those with util.addEvent or util.setEvent
  var cleanSlateElement = function(el) {
    // reset event listeners, style, attributes, ... set to this HTML element, that could be completely unneeded or different when the canvas is reused elsewhere
    util.removeAllEvents(el);
    while(el.attributes.length) {
      // these attributes include style, tabindex, aria roles, ...
      el.removeAttribute(el.attributes[el.attributes.length - 1].name);
    }
    el.className = '';
  };
  result.cleanSlateElement = cleanSlateElement;

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

  // Deep copy
  var clone = function(obj) {
    // Handle the 3 simple types, and null or undefined
    if(null == obj || 'object' != typeof obj) return obj;

    // Handle Array
    if(obj instanceof Array) {
      var copy = [];
      /*for(var i = 0, len = obj.length; i < len; i++) {
        copy[i] = clone(obj[i]);
      }*/
      // this is faster than the above one for sparse arrays
      for(var attr in obj) {
        if(obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
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
    window.localStorage.removeItem(name);
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
    var time0 = (new Date()).getTime(); // milliseconds since unix epoch
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
    var r = Math.floor(rgb[0]).toString(16);
    var g = Math.floor(rgb[1]).toString(16);
    var b = Math.floor(rgb[2]).toString(16);
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

  // returns the farthest away color from the given css color. the result is either black or white. This is the color with highest contrast.
  var farthestColor = function(css) {
    var rgb = parseCSSColor(css);
    var lightness = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    return lightness > 128 ? '#000' : '#fff';
  };
  result.farthestColor = farthestColor;

  // similar to farthestColor, but somewhat preserves the hue
  var farthestColorHue = function(css) {
    var rgb = parseCSSColor(css);
    var lightness = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    if(lightness > 128) {
      return formatCSSColor([rgb[0] * 0.25, rgb[1] * 0.25, rgb[2] * 0.25]);
    } else {
      return formatCSSColor([255 - (255 - rgb[0]) * 0.25, 255 - (255 - rgb[1]) * 0.25, 255 - (255 - rgb[2]) * 0.25]);
    }
  };
  result.farthestColorHue = farthestColorHue;


  // formats time given in second as years, months, days, hours, minutes, seconds
  // opt_maxSections is how many different sections to print, or leave out smaller ones. Default is 3, max is 9.
  // the sections are: millenium, year, month, day, hour, minute, second.
  // NOTE: if the duration is longer than a month, in some cases it returns only a single section no matter what, e.g. "5 millenia"
  // opt_short: if false or 0, default long notation. if 1 or true, uses e.g. "h" instead of " hours", etc..., and no longer uses sections for anything above a day. if 2, uses a sprecise but less human readable short notation
  // opt_inv: inverses direction of max sections. If false, starts from largest and leaves out smaller. If true, leaves out larger ones instead (and makes the largest shows section larger, like 31h insead of 1d 7h)
  // opt_fractional: print fractional seconds like 0.5. Default is false, then prints the ceil (not floor), e.g. 0.2s will print as 1s, good for countdowns.
  var formatDuration = function(s, opt_short, opt_maxSections, opt_inv, opt_fractional) {
    var maxSections = opt_maxSections || (opt_short == 2 ? 4 : 3);
    if(isNaN(s)) return 'NaN';
    if(s < 0) return '-' + formatDuration(-s);
    if(s == Infinity) return 'Infinity ' + (opt_short ? 's' : ' seconds');

    if(!opt_fractional) s = Math.ceil(s);

    if(opt_short == 1) {
      // For durations longer than 'days', everything involving abbreviations such as 'M' for month is pretty unclear
      // (e.g. M can be confused with million or millenium), so return those instead as formatted number with the full word 'years' or 'days'
      // NOTE: this can return fractional values, like "1.23 years"
      if(s >= 31557600000) { // 31557600000 = seconds in 1000 365.25-day years
        var formatted = Num(s / 31557600000).toString();
        return formatted + ((formatted == '1') ? ' millenium' : ' millenia');
      }
      if(s >= 31557600) { // 31557600 = seconds in a 365.25 day year
        var formatted = Num(s / 31557600).toString();
        return formatted + ((formatted == '1') ? ' year' : ' years');
      }
      if(s >= 27 * 86400) { // 86400 = seconds in a day
        var formatted = Num(s / 86400).toString();
        return formatted + ((formatted == '1') ? ' day' : ' days');
      }
    }

    if(opt_maxSections == 1 && !opt_inv) {
      // avoid returning "1 month" for e.g. 35 days, when e.g. 29 days gets full precision with "29 days". Show with a bit more precision.
      /*if(s >= 4 * 31557600000) { // 31557600000 = seconds in 1000 365.25-day years
        var formatted = Math.floor(s / 31557600000).toString();
        return formatted + ((formatted == '1') ? ' millenium' : ' millenia');
      }
      if(s >= 4 * 31557600) { // 31557600 = seconds in a 365.25 day year
        var formatted = Math.floor(s / 31557600).toString();
        return formatted + ((formatted == '1') ? ' year' : ' years');
      }
      if(s >= 4 * 2635200) { // 2635200 = seconds in a 30.5 day month
        var formatted = Math.floor(s / 2635200).toString();
        return formatted + ((formatted == '1') ? ' month' : ' months');
      }
      if(s >= 4.5 * 604800) { // 604800 = seconds in a week
        var formatted = Math.floor(s / 604800).toString();
        return formatted + ((formatted == '1') ? ' week' : ' weeks');
      }
      if(s >= 27 * 86400) { // 86400 = seconds in a day
        var formatted = Math.floor(s / 86400).toString();
        return formatted + ((formatted == '1') ? ' day' : ' days');
      }*/
      if(s >= 31557600000) { // 31557600000 = seconds in 1000 365.25-day years
        var formatted = Num(s / 31557600000).toString();
        return formatted + ((formatted == '1') ? ' millenium' : ' millenia');
      }
      if(s >= 31557600) { // 31557600 = seconds in a 365.25 day year
        var formatted = Num(s / 31557600).toString();
        return formatted + ((formatted == '1') ? ' year' : ' years');
      }
      if(s >= 2635200) { // 2635200 = seconds in a 30.5 day month
        var formatted = Num(s / 2635200).toString();
        return formatted + ((formatted == '1') ? ' month' : ' months');
      }
    }

    var orig = s;
    s = Math.floor(s);

    var mm = 0, Y = 0, M = 0, D = 0, h = 0, m = 0;
    if(!(opt_inv && maxSections < 6) && s >= 31557600) {  // seconds in 1000 365.25-day years
      mm = Math.floor(s / 31557600000);
      s -= mm * 31557600000;
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

    var names_single = opt_short ? ['mm', 'Y', 'M', 'd', 'h', 'm', 's'] : [' millenium', ' year', ' month', ' day', ' hour', ' minute', ' second'];
    var names_plural = opt_short ? ['mm', 'Y', 'M', 'd', 'h', 'm', 's'] : [' millenia', ' years', ' months', ' days', ' hours', ' minutes', ' seconds'];

    // 'd' on its own can be too confusing
    if(opt_short == 1 && h == 0 && m == 0 && s == 0 && D != 0 && mm == 0 && Y == 0 && M == 0) {
      return Num(D).toString() + (D == 1 ? ' day' : ' days');
    }

    var result = '';

    var sp = function() {
      return result == '' ? '' : ' ';
    }

    // TODO: avoid displaying something like "5h 3s", use "5h 0m 3s" instead
    // however, it's not that trivial to fix it, e.g. if s are not displayed m should also not, and maxSections can affect whether it is

    if(opt_inv) {
      // TODO: use names_plural when relevant
      if(mm > 0) { result += sp() + Num(mm).toString() + names_single[0]; }
      if(Y > 0) { result += sp() + Y + names_single[1]; }
      if(M > 0) { result += sp() + M + names_single[2]; }
      if(D > 0) { result += sp() + D + names_single[3]; }
      if(h > 0) { result += sp() + h + names_single[4]; }
      if(m > 0) { result += sp() + m + names_single[5]; }
      if(s > 0) { result += sp() + s + names_single[6]; }
    } else {
      var sections = 0;
      if(mm > 0) { result += sp() + Num(mm).toString() + (mm == 1 ? names_single[0] : names_plural[0]); if((++sections) >= maxSections) return result; }
      if(Y > 0) { result += sp() + Y + (Y == 1 ? names_single[1] : names_plural[1]); if((++sections) >= maxSections) return result; }
      if(M > 0) { result += sp() + M + (M == 1 ? names_single[2] : names_plural[2]); if((++sections) >= maxSections) return result; }
      if(D > 0) { result += sp() + D + (D == 1 ? names_single[3] : names_plural[3]); if((++sections) >= maxSections) return result; }
      if(h > 0) { result += sp() + h + (h == 1 ? names_single[4] : names_plural[4]); if((++sections) >= maxSections) return result; }
      if(m > 0) { result += sp() + m + (m == 1 ? names_single[5] : names_plural[5]); if((++sections) >= maxSections) return result; }
      if(s > 0) { result += sp() + s + (s == 1 ? names_single[6] : names_plural[6]); if((++sections) >= maxSections) return result; }
    }

    if(result == '') result = orig.toFixed(3) + names_plural[6];

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

  var lowerCaseFirstWord = function(text) {
    if(text && text.length > 0) text = text[0].toLowerCase() + text.substr(1);
    return text;
  };
  result.lowerCaseFirstWord = lowerCaseFirstWord;

  // This is like addEventListener, but also stores the event, and allows removing them all at once (e.g. for canvases reused in the canvas pool, due to chrome being much faster re-using a canvas than creating a context on a new one...)
  // JS itself does not allow removing event listeners without knowing the exact function that you use as listener, so storing it like this is needed
  var addEvent = function(el, event, fun, opt_useCapture) {
    if(!el.util_event_listeners_) el.util_event_listeners_ = [];
    if(el.util_event_listeners_.length > 20) return; // too big, protect against accidently often re-added listener
    el.util_event_listeners_.push([event, fun, opt_useCapture]);
    el.addEventListener(event, fun, opt_useCapture);
  };
  result.addEvent = addEvent;

  // Similar to addEvent, but allows giving a unique name (idname) to replace events.
  // Also can be removed all at once with util.removeAllElements
  var setEvent = function(el, event, fun, idname) {
    if(idname == undefined) idname = '';
    if(!el.util_set_events_) el.util_set_events_ = {};
    if(!el.util_set_events_[event]) el.util_set_events_[event] = {};
    if(el.util_set_events_[event][idname]) {
      el.removeEventListener(event, el.util_set_events_[event][idname]);
    }
    el.util_set_events_[event][idname] = fun;
    el.addEventListener(event, fun, false);
  };
  result.setEvent = setEvent;

  // whether it has any events that were set by addEvent or setEvent (does not check for events set through other means)
  var hasEvents = function(el) {
    if(el.util_event_listeners_) {
      return !!el.util_event_listeners_.length;
    }
    if(el.util_set_events_) {
      var l = el.util_set_events_;
      for(var k in l) return true;
    }
    return false;
  };
  result.hasEvents = hasEvents;

  // removes all events that were added with addEvent or setEvent
  // does NOT support removing of events that used standard 'addEventListener' JS code
  var removeAllEvents = function(el) {
    if(el.util_event_listeners_) {
      var l = el.util_event_listeners_;
      for(var i = 0; i < l.length; i++) el.removeEventListener(l[i][0], l[i][1], l[i][2]);
      delete el.util_event_listeners_;
    }
    if(el.util_set_events_) {
      var l = el.util_set_events_;
      for(var k in l) {
        if(!l.hasOwnProperty(k)) continue;
        var l2 = l[k];
        for(var k2 in l2) {
          if(!l2.hasOwnProperty(k2)) continue;
          var fun = l2[k2];
          el.removeEventListener(k, fun, false);
        }
      }
      delete el.util_set_events_;
    }
  };
  result.removeAllEvents = removeAllEvents;

  var eventHasShiftKey = function(e) {
    return e.shiftKey;
  };
  result.eventHasShiftKey = eventHasShiftKey;

  // returns if the event has the ctrl key, or on macs instead this is the cmd key since ctrl does something else on those
  var eventHasCtrlKey = function(e) {
    return e.ctrlKey || e.metaKey; // metakey is for macs where ctrl doesn't work and meta represents cmd key instead which is basically what one normally uses as ctrl there
  };
  result.eventHasCtrlKey = eventHasCtrlKey;

  // result has the form [x0, y0, x1, y1]
  var getAbsCoords = function(el) {
    var rect = el.getBoundingClientRect();
    var result = [];
    result[0] = rect.left;
    result[1] = rect.top;
    result[2] = rect.right;
    result[3] = rect.bottom;
    return result;
  };
  result.getAbsCoords = getAbsCoords;

  return result;
}());

var util = Utils;

// allow to use very often used utility functions directly
var bind = util.bind;
var makeDiv = util.makeDiv;
var upper = util.upperCaseFirstWord;
var lower = util.lowerCaseFirstWord;
var eventHasCtrlKey = util.eventHasCtrlKey;
var eventHasShiftKey = util.eventHasShiftKey
