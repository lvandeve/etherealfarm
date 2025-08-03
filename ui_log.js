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


// prevent making too many HTML elements with messages, but still have a good amount
var maxMessages = 100;

var lastMessage = '';
var sameMessageCount = 1;
var lastMessageElement = undefined;

var goalText = undefined;

var spans = [];

var futuremessages = [];

// color types for log message
var C_DEFAULT = 0; // anything that doesn't need to stand out, includes almost any immediate response to user action such as performing an upgrade (as opposed to having an upgrade unlocked due to other events)
var C_ERROR = 1; // program error
var C_INVALID = 2; // usage errors such as not enough resources
var C_UNIMPORTANT = 3;
var C_RANDOM = 4;
var C_META = 5;
var C_HELP = 6;
var C_NATURE = 7; // basic field, ferns, fruits, ...
var C_ETHEREAL = 8;
var C_UNLOCK = 9; // achievements, unlocked upgrades, ...
var C_UNDO = 10;
var C_AUTOMATON = 11;
var C_AMBER = 12;
var C_PRESENT = 13;
var C_EGG = 14;
var C_GOAL = 15;
var C_IMPORTANT = 16;
var C_TD = 17; // tower defense related
var C_INFINITY = 18; // infinity field related


// this system exists to make it possible to have messages to be distinguishable from each other but also have color according to some theme,
// without having to carefully craft exact color values manually for each, hence the pseudorandom
// rarity is in range 0-1 (0=almost no randomness, 0.5=use this by default, 1=rare so stand out). Default if not given: 0.5
// for seed, use randomly typed integer values, don't use low or successive values. E.g. use hardcoded result of: Math.floor(Math.random() * (1 << 30))
function makeLogColor(type, seed, rarity) {
  if(type == undefined) {
    type = C_DEFAULT;
  }
  if(rarity == undefined) rarity = 0.5;
  var fgcolor = '#fff';
  var bgcolor = '#000';

  if(type == 0) {
    // nothing
  } else if(type == C_ERROR) {
    fgcolor = '#f00';
    bgcolor = '#ff0';
  } else if(type == C_INVALID) {
    fgcolor = '#f00';
  } else if(type == C_UNIMPORTANT) {
    fgcolor = '#888';
  } else if(type == C_UNLOCK) {
    // handled separately due to how dark yellow doesn't look nice
    var v0 = Math.min(Math.max(0, rarity + 0.5), 1);
    fgcolor = RGBtoCSS([255 * v0, 255 * v0, 0]);
    var h1, s1, v1;
    v1 = Math.min(Math.max(0, rarity - 0.5), 1);
    h1 = 0.16 - util.pseudoRandom(0, seed) * 0.05 * rarity;
    s1 = 1;
    bgcolor = RGBtoCSS(HSVtoRGB([h1 * 255, s1 * 255, v1 * 255, 255]));
  } else if(type == C_GOAL) {
    fgcolor = '#f00';
    bgcolor = '#000';
  } else if(type == C_IMPORTANT) {
    fgcolor = '#f08';
    bgcolor = '#004';
  } else {
    // hue is 0-1 based: 0=red, 0.33=green, 0.66=blue
    // h0 = foreground hue, h1 = background hue
    var h0 = 0;
    var h1 = 0;
    var s0 = 1;
    var s1 = 1;
    var v0 = 1;
    var v1 = 0;
    var huevar = 0.05;
    var fg_hsl = false;
    if(type == C_INVALID) {
      h0 = h1 = 0;
    } else if(type == C_META) {
      h0 = h1 = 0.16;
      s1 = 0;
      v1 = 0.5;
    } else if(type == C_RANDOM) {
      h0 = h1 = 0;
    } else if(type == C_HELP) {
      h0 = h1 = 0.5;
      huevar = 0;
    } else if(type == C_NATURE) {
      h0 = h1 = 0.3;
    } else if(type == C_ETHEREAL) {
      h0 = 0.16;
      h1 = 0.66;
      huevar = 0;
    } else if(type == C_UNDO) {
      h0 = h1 = 0.9;
      huevar = 0;
    } else if(type == C_AUTOMATON) {
      s0 = s1 = 0;
    } else if(type == C_AMBER) {
      h0 = h1 = 0.1;
    } else if(type == C_PRESENT) {
      h0 = 0.33;
      s0 = 1;
      v0 = 0.9;
      h1 = 0;
      s1 = 1;
      v1 = 0.5;
      rarity = 0;
    } else if(type == C_EGG) {
      h0 = 0.8;
      h1 = 0.2
      v1 = 1;
      rarity = 0;
    } else if(type == C_TD) {
      h0 = h1 = 0.08; // orange
      v1 = 1;
    } else if(type == C_INFINITY) {
      s0 = s1 = 0; // grayscale
      v0 = 0;
      v1 = 1;
    }

    if(rarity > 0 || type == C_RANDOM) {
      h0 += util.pseudoRandom(0, seed) * huevar * rarity; if(h0 < 0) h0 += 1; if(h0 > 1) h0 -= 1;
      h1 += util.pseudoRandom(1, seed) * huevar * rarity; if(h1 < 0) h1 += 1; if(h1 > 1) h1 -= 1;
      if(type == C_RANDOM) {
        h0 = util.pseudoRandom(0, seed);
        h1 = util.pseudoRandom(1, seed);
      }
      s0 += util.pseudoRandom(2, seed) * 0.1 * rarity; if(s0 < 0) s0 = 0; if(s0 > 1) s0 = 1;
      s1 += util.pseudoRandom(3, seed) * 0.1 * rarity; if(s1 < 0) s1 = 0; if(s1 > 1) s1 = 1;
      v1 = Math.min(Math.max(0, rarity * rarity + (util.pseudoRandom(4, seed) - 0.5) * 0.25), 1);
      v0 = util.pseudoRandom(5, seed) * rarity * 0.2;

      var rgb1 = HSVtoRGB([h1 * 255, s1 * 255, v1 * 255, 255]);
      var lightness1 = (0.2126 * rgb1[0] + 0.7152 * rgb1[1] + 0.0722 * rgb1[2]) / 255;
      if(lightness1 < 0.5) v0 = 1 - v0;

      var rgb0 = HSVtoRGB([h0 * 255, s0 * 255, v0 * 255, 255]);
      var lightness0 = (0.2126 * rgb0[0] + 0.7152 * rgb0[1] + 0.0722 * rgb0[2]) / 255;
      // double check contrast
      if(Math.abs(lightness1 - lightness0) < 0.25) {
        v0 = lightness1 > 0.5 ? 0.1 : 0.9;
        fg_hsl = true;
      }
    }

    fgcolor = RGBtoCSS((fg_hsl ? HSLtoRGB : HSVtoRGB)([h0 * 255, s0 * 255, v0 * 255, 255]));
    bgcolor = RGBtoCSS(HSVtoRGB([h1 * 255, s1 * 255, v1 * 255, 255]));
  }

  return [fgcolor, bgcolor];
}

// shows message in the message log
// opt_forcenew: force a new line for this message, do not combine with previous line if same text
// opt_showlate: show the message as late as possible, that is, at the end of the next update() function call rather than right now, so it'll appear after anything else update() may show first.
// opt_showlate0: similar to showlate, but with delay of 0, so will still appear after other messages in the same streak of code, but have no visible delay
// opt_colorrarity: 0-1
function showMessage(text, colortype, colorseed, opt_colorrarity, opt_forcenew, opt_showlate, opt_showlate0) {
  if(opt_showlate || opt_showlate0) {
    window.setTimeout(function() {
      //futuremessages.push([text, colortype, colorseed, opt_colorrarity, opt_forcenew]);
      showMessage(text, colortype, colorseed, opt_colorrarity, opt_forcenew, false);
    }, opt_showlate ? 700 : 0);
    return;
  }

  var colors = makeLogColor(colortype, colorseed, opt_colorrarity);
  var opt_color = colors[0];
  var opt_bgcolor = colors[1];


  var time = (state && state.prevtime) ? state.prevtime : util.getTime();
  var title = 'date: ' + util.formatDate(time);
  if(state && state.time) {
    title += ', game time: ' + util.formatDuration(state.c_runtime);
    title += ', tree level: ' + state.treelevel;
  }
  var prefix = '';

  // disabled, it looks a bit too distracting. Maybe a setting for this could be added.
  /*if(state && state.time) {
    prefix = util.formatDuration(time2, true) + ' lvl ' + state.treelevel + ': ';
  }*/

  var logDiv = logFlex.div;
  // automatically capitalize the message. Reason: consistency.
  text = upper(text);
  if(!opt_forcenew && text == lastMessage && lastMessageElement) {
    sameMessageCount++;
    text = prefix + lastMessage + ' (' + sameMessageCount + 'x)';
    lastMessageElement.innerHTML = text;
    lastMessageElement.title = title;
    return;
  }

  lastMessage = text;
  text = prefix + text;
  sameMessageCount = 1;

  var span = util.makeElement('span', logDiv);
  spans.push(span);
  span.style.display = 'block';
  span.innerHTML = text;
  span.style.color = opt_color || 'white';
  if(opt_bgcolor) span.style.backgroundColor = opt_bgcolor;
  //span.style.border = '1px solid white';
  span.style.margin = '4px';
  lastMessageElement = span;
  lastMessageElement.title = title;

  if(logDiv.childNodes.length > 100) util.removeElement(logDiv.childNodes[0]);
  // scroll to bottom so last message visible
  // TODO: only do this if not scrolled up manually by user
  logDiv.scrollTop = logDiv.scrollHeight;

  if(spans.length > maxMessages) {
    util.removeElement(spans[0]);
    spans.shift(0);
  }
}

var lastGoalText = undefined;
var lastGoalTextSmall = false;

// set to undefined to clear goal
// opt_small: make the box smaller and less noticeable
function setGoalText(text, opt_small) {
  if(text == lastGoalText) return;
  lastGoalText = text;
  lastGoalTextSmall = !!opt_small;
  //goalFlex.div.style.border = '1px solid red';
  if(!text) {
    logFlex.y0 = logFlexBegin;
    logFlex.updateSelf(gameFlex.div);
    goalFlex.div.style.visibility = 'hidden';
  } else {
    // see makeMainDivs for the basis of these values
    var goaly1 = logFlexBegin + (opt_small ? 0.035 : 0.065);
    var logy0 = goaly1 + 0.004;
    if(logFlex.y0 != logy0 || goalFlex.y1 != goaly1) {
      logFlex.y0 = logy0;
      logFlex.updateSelf(gameFlex.div);
      goalFlex.y1 = goaly1;
      goalFlex.updateSelf(gameFlex.div);
      goalFlex.div.className = opt_small ? 'efGoalSmall' : 'efGoal';
      goalFlex.div.style.visibility = 'visible';
    }
    goalFlex.div.innerText = 'Goal: ' + text;
  }
}

var animatingGoalText_ = false;

function animateGoalText() {
  if(animatingGoalText_) return;
  if(!lastGoalText) return;
  if(lastGoalTextSmall) return;
  animatingGoalText_ = true;

  /*// background fade in animation: JS based
  goalFlex.div.style.opacity = '0';
  var opacity = 0;
  var interval = 50; // in ms
  var fun = function() {
    opacity += 0.05;
    if(opacity >= 1) {
      goalFlex.div.style.opacity = '';
      animatingGoalText_ = false;
      return;
    } else {
      goalFlex.div.style.opacity = opacity;
    }
    util.setTimeoutSafe(fun, interval);
  };
  util.setTimeoutSafe(fun, interval);*/


  // text animation: CSS based. Setting it to none and then back to '' re-triggers the CSS animation.
  goalFlex.div.style.animation = 'none';
  window.setTimeout(function() {
    goalFlex.div.style.animation = 'efGoalAnimFrame 0.5s';
  });
  window.setTimeout(function() {
    animatingGoalText_ = false;
  }, 1000);
}

function initMessageUI() {
  var logDiv = logFlex.div;
  logDiv.innerText = '';
  logDiv.style.overflowY = 'scroll';
  setAriaRole(logDiv, 'log'); // aria role. Goal: indicate that this is a log to which messages are appended, possibly have it announce them without special action needed. TODO: should aria-live="assertive" be set?
  lastMessageElement = undefined;
  lastMessage = '';
  sameMessageCount = 1;

  logDiv.style.backgroundColor = '#000';
  logDiv.onclick = removeMedalChip;
}

// Show a debug error, these should normally never happen in the released version, if they do they are a bug
function showError(text) {
  showMessage('ERROR: ' + text, C_ERROR, 0, 0);
}


