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

// This text centering method is simply because it involves only one HTML
// element and allows changing the text at any time without updating this,
// but it only supports single-line text. The div must already have its final
// height and shouldn't change.
function centerText(div, opt_clientHeight) {
  var divheight = opt_clientHeight || div.clientHeight;
  // the next 3 properties are to center text horizontally and vertically
  div.style.textAlign = 'center';
  div.style.verticalAlign = 'middle';
  div.style.lineHeight = divheight + 'px';

  div.textEl = div; // for correspondence with centerText2
}

// centers text and supports multiline, using the css table method.
// this involves creating a child element in the div. It will set a new field
// on your dif names textEl, that is the one you must set innerText or
// innerHTML to. Other than that fact, this one is the most versatile.
function centerText2(div) {
  div.innerHTML = '';
  var table = util.makeElement('div', div);
  table.style.display = 'table';
  table.style.width = '100%';
  table.style.height = '100%';
  var cell = util.makeElement('div', table);
  cell.style.display = 'table-cell';
  cell.style.verticalAlign = 'middle';
  cell.style.textAlign = 'center';
  //cell.style.width = '100%';
  //cell.style.height = '100%';
  div.textEl = cell;
}

// This text centering method requires you to have a parent and child element,
// both already existing in that form, and with the child element already
// having content filled in. This call will then center the child.
// This supports multiline text. But it involves multiple elements and requires
// calling again if the text changes.
function centerContent(parent, child) {
  var cw = child.clientWidth;
  var ch = child.clientHeight;
  var pw = parent.clientWidth;
  var ph = parent.clientHeight;
  child.style.left = Math.floor((pw - cw) / 2) + 'px';
  child.style.top = Math.floor((ph - ch) / 2) + 'px';
}

function setAriaLabel(div, label) {
  div.setAttribute('aria-label', label);
}


function setAriaRole(div, role) {
  div.setAttribute('role', role);
}

// use this instead of ".onclick = ..." for more accessible buttons
// opt_label is an optional textual name for image-icon-buttons
function addButtonAction(div, fun, opt_label) {
  div.onclick = fun;
  div.tabIndex = 0;
  setAriaRole(div, 'button');
  //div.setAttribute('aria-pressed', 'false'); // TODO: is this needed? maybe it's only for toggle buttons? which addButtonAction is not.
  if(opt_label) setAriaLabel(div, opt_label);
}

// styles only a few of the essential properties for button
// does not do centering (can be used for other text position), or colors/borders/....
// must be called *after* any styles such as backgroundColor have already been set
// opt_disallow_hover_filter: diallow the mouse hover filter effect. Normally would be nice to always have, but chrome will make pixelated canvases a blurry mess when applying opacity or filter, so disable it for canvases for now.
function styleButton0(div, opt_disallow_hover_filter) {
  div.style.cursor = 'pointer';
  div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
  if(div.textEl) div.textEl.style.userSelect = 'none'; // prevent unwanted selections when double clicking things

  if(!opt_disallow_hover_filter) {
    util.setEvent(div, 'onmouseover', 'buttonstyle', function() { div.style.filter = 'brightness(0.93)';});
    util.setEvent(div, 'onmouseout', 'buttonstyle', function() { div.style.filter = ''; });
  } else {
    // as an alternative to the filter, add an invisible border around the canvas, this slightly changes its size, indicating the hover that way
    util.setEvent(div, 'onmouseover', 'buttonstyle', function() { div.style.border = '1px solid #0000';});
    util.setEvent(div, 'onmouseout', 'buttonstyle', function() { div.style.border = ''; });
  }
}

// somewhat like makeDiv, but gives mouseover/pointer/... styles
// also sets some fields on the div: hightlight/hover colors, textEl, ...
function styleButton(div, opt_color) {
  div.className = 'efButton';

  div.textEl = div; // for consistency with what different centerText varieties do
  centerText2(div);

  styleButton0(div);
}

function highlightButton(div, highlight) {
  if(highlight) div.className = 'efButtonHighlighted';
  else div.className = 'efButton';
}

// div must already have the position and size (the arguments are used to compute stuff inside of it)
function initProgressBar(div, color) {
  div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
  div.style.border = '1px solid black';
  var c = makeDiv('0%', '0%', '100%', '100%', div);
  c.style.backgroundColor = 'red';
  div.style.display = 'none';
  div.style.backgroundColor = '#ddd';
  div.visible = false;
  div.c = c;
}

// value is in range 0-1. Make negative to hide the progress bar.
function setProgressBar(div, value, color) {
  if(value < 0) {
    if(div.visible) {
      div.style.display = 'none';
      div.visible = false;
    }
    return;
  }
  if(value > 1) value = 1;
  var c = div.c;
  if(!div.visible) {
    div.style.display = '';
    div.visible = true;
  }
  c.style.width = (100 * value) + '%';
  if(color && div.colorCache_ != color) {
    div.c.style.backgroundColor = color;
    div.colorCache_ = color; // reading div.style.backgroundColor is slow, so set in higher field.
  }
}


// if you wish text of a dialog to be updated dynamically, set this function to something
// there's only this one available, and it will get cleared whenever dialogs are cleared
// will be called by update()
// NOTE: it is a good idea to create your updatedialogfun such that it does nothing if nothing
// changes, and does something if the content does change, to avoid unnecessary DOM updates for
// same content.
var updatedialogfun = undefined;

var dialog_level = 0;
var created_dialogs = [];
var created_overlays = [];

var DIALOG_SMALL = 0;
var DIALOG_MEDIUM = 1;
var DIALOG_LARGE = 2;

// create a dialog for the settings menu
// opt_size: see DIALOG_SMALL etc... values above
// opt_okfun must call dialog.cancelFun when the dialog is to be closed
// opt_extrafun and opt_extraname allow a third button in addition to cancel and ok. The order will be: cancel, extra, ok.
// opt_nobgclose: don't close by clicking background or pressing esc, for e.g. savegame recovery dialog
// opt_onclose, if given, is called no matter what way the dialog closes
// any content should be put in the resulting dialog.content flex, not in the dialog flex itself
function createDialog(opt_size, opt_okfun, opt_okname, opt_cancelname, opt_extrafun, opt_extraname, opt_nobgclose, opt_onclose) {
  dialog_level++;

  removeAllTooltips(); // this is because often clicking some button with a tooltip that opens a dialog, then causes that tooltip to stick around which is annoying

  var dialogFlex;
  if(opt_size == DIALOG_SMALL) {
    dialogFlex = new Flex(gameFlex, 0.05, 0.25, 0.95, 0.75);
  } else if(opt_size == DIALOG_LARGE) {
    dialogFlex = new Flex(gameFlex, 0.05, 0.05, 0.95, 0.9);
  } else {
    // default, medium. Designed to be as big as possible without covering up the resource display
    dialogFlex = new Flex(gameFlex, 0.05, 0.12, 0.95, 0.9);
  }

  created_dialogs.push(dialogFlex);
  var dialog = dialogFlex.div;

  dialog.className = 'efDialog';
  setAriaRole(dialog, 'dialog');

  dialog.style.zIndex = '' + (dialog_level * 10 + 5);

  var button;
  var buttonshift = 0;
  if(opt_okfun) {
    button = (new Flex(dialogFlex, [1.0, -0.3 * (buttonshift + 1)], [1.0, -0.12], [1.0, -0.01 - 0.3 * buttonshift], [1.0, -0.01], 1)).div;
    button.style.fontWeight = 'bold';
    buttonshift++;
    styleButton(button);
    button.textEl.innerText = opt_okname || 'ok';
    addButtonAction(button, function(e) {
      opt_okfun(e);
    });
  }
  if(opt_extrafun) {
    button = (new Flex(dialogFlex, [1.0, -0.3 * (buttonshift + 1)], [1.0, -0.12], [1.0, -0.01 - 0.3 * buttonshift], [1.0, -0.01], 1)).div;
    button.style.fontWeight = 'bold';
    buttonshift++;
    styleButton(button);
    button.textEl.innerText = opt_extraname || 'extra';
    addButtonAction(button, function(e) {
      opt_extrafun(e);
    });
  }
  dialog.cancelFun = function() {
    updatedialogfun = undefined;
    util.removeElement(overlay);
    for(var i = 0; i < created_dialogs.length; i++) {
      if(created_dialogs[i] == dialogFlex) {
        created_dialogs.splice(i, 1);
        break;
      }
    }
    for(var i = 0; i < created_overlays.length; i++) {
      if(created_overlays[i] == overlay) {
        created_overlays.splice(i, 1);
        break;
      }
    }
    dialog_level--;
    // a tooltip created by an element from a dialog could remain, make sure those are removed too
    removeAllTooltips();
    dialog.removeSelfFun();
  };
  dialog.removeSelfFun = function() {
    dialogFlex.removeSelf();
    if(opt_onclose) opt_onclose(); // this must be called no matter with what method this dialog is closed/forcibly removed/...
  };
  dialogFlex.cancelFun = dialog.cancelFun;
  button = (new Flex(dialogFlex, [1.0, -0.3 * (buttonshift + 1)], [1.0, -0.12], [1.0, -0.01 - 0.3 * buttonshift], [1.0, -0.01], 1)).div;
  buttonshift++;
  styleButton(button);
  button.textEl.innerText = opt_cancelname || (opt_okfun ? 'cancel' : 'back');
  addButtonAction(button, dialog.cancelFun);
  var overlay = makeDiv(0, 0, window.innerWidth, window.innerHeight);
  created_overlays.push(overlay);
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '' + (dialog_level * 10);
  if(!opt_nobgclose) overlay.onclick = dialog.cancelFun;


  var xbutton = new Flex(dialogFlex, [1, -0.05], [0, 0.01], [1, -0.01], [0, 0.05], 8);
  styleButton(xbutton.div);
  xbutton.div.textEl.innerText = 'x';
  addButtonAction(xbutton.div, dialog.cancelFun, 'dialog close button');

  dialogFlex.content = new Flex(dialogFlex, 0.01, 0.01, [1, -0.05], 0.88, 0.3);

  return dialogFlex;
}

function closeAllDialogs() {
  updatedialogfun = undefined;

  for(var i = 0; i < created_dialogs.length; i++) {
    created_dialogs[i].div.removeSelfFun();
  }
  for(var i = 0; i < created_overlays.length; i++) {
    util.removeElement(created_overlays[i]);
  }
  created_dialogs = [];
  created_overlays = [];
  dialog_level = 0;

  // a tooltip created by an element from a dialog could remain, make sure those are removed too
  removeAllTooltips();
}

document.addEventListener('keyup', function(e) {
  if(e.keyCode == 27) {
    closeAllDialogs();
  }
});

// It matters whether there is a mouse pointer that can hover over things to
// show tooltips, or it's a touch device where you only get taps on a location
// without seeing a mouse pointer move there first.
// Note: it's not possible to use something like check whether or not onmouseover
// was called, because mobile browsers call onmouseover anyway
function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
}

var globaltooltip;

// MOBILEMODE forces the mobile mode for tooltips by disabling tooltip hover (mouseover and mouseout) functions
var MOBILEMODE = false;

var updatetooltipfun = undefined; // must be called by the game update fun if set

/*
tooltip for the desktop version. For mobile, may be able to show it through an indirect info button
el is HTML element to give tooltip
fun is function that gets the tooltip text, or text directly, or undefined to remove the tooltip (to unregister it)
opt_poll, if true, will make the tooltip dynamically update by calling fun again
opt_allowmobile, if true, then the tooltip will show when clicking the item. It will likely be too tiny though. Do not use if clicking the item already has some other action.
*/
function registerTooltip(el, fun, opt_poll, opt_allowmobile) {
  if((typeof fun == 'string') || !fun) fun = bind(function(text) { return text; }, fun);
  // can't set this if opt_poll, fun() then most likely returns something incorrect now (e.g. on the field tiles)
  if(!opt_poll) el.setAttribute('aria-description', fun());
  var div = undefined;

  var MOBILEMODE = isTouchDevice();

  if(MOBILEMODE) {
    removeAllTooltips();
    return;
  }

  var init = function() {
    el.tooltipfun = fun;
    if(el.tooltipregistered) return; // prevent keeping adding event listeners, and make sure re-calling registerTooltip is fast (can be done every frame), just update the minimum needed to change the text
    el.tooltipregistered = true;
    util.setEvent(el, 'onmouseover', 'tooltip', function(e) {
      if(MOBILEMODE && !opt_allowmobile) return;
      maketip(el.tooltipfun(), e, false);
    });

    // NOTE: mouseout unwantedly also triggers when over child elements of el (solved inside) or when over the tooltip itself (solved by making tooltip never overlap el)
    util.setEvent(el, 'onmouseout', 'tooltip', function(e) {
      if(MOBILEMODE && !opt_allowmobile) return;
      // avoid the tooltip triggering many times while hovering over child nodes, which does cause mouseout events
      var e_el = e.toElement || e.relatedTarget;
      if(e_el == el) return;
      if(!!e_el && e_el.parentNode == el) return;
      if(!!e_el && !!e_el.parentNode && e_el.parentNode.parentNode == el) return;
      if(!!e_el && !!e_el.parentNode && !!e_el.parentNode.parentNode && e_el.parentNode.parentNode.parentNode == el) return;
      if(!!e_el && !!e_el.parentNode && !!e_el.parentNode.parentNode && !!e_el.parentNode.parentNode.parentNode && e_el.parentNode.parentNode.parentNode.parentNode == el) return;
      if(e_el == div) return;
      remtip();
    });
  };

  var maketip = function(text, e, mobilemode) {
    if(!state) return; // game not yet loaded
    if(state.tooltipstyle == 0) {
      removeAllTooltips();
      return;
    }
    // already displaying
    if(div && div == globaltooltip) return;
    // if a tooltip somehow remained from elsewhere, remove it. Even if fun returned undefined (so we make no new tip), because any remaining one may be stray
    if(globaltooltip) {
      util.removeElement(globaltooltip);
      globaltooltip = undefined;
      updatetooltipfun = undefined;
    }
    if(text) {
      var rect = el.getBoundingClientRect();
      var tipx0 = rect.x;
      var tipy0 = rect.y;
      var tipx1 = rect.x + rect.width;
      var tipy1 = rect.y + rect.height;

      var x = e.clientX + 20;
      // TODO: adjust y position such that tooltip does not appear over the element itself, only below or above (do not cover it)
      var y = Math.max(e.clientY + 20, tipy1);
      // NOTE: the div has document.body as parent, not el, otherwise it gets affected by styles of el (such as darkening on mouseover, ...)
      ///div = util.makeElementAt('div', x, y, document.body); // give some shift. Note that if tooltip appears under mousebutton, it will trigger mouseout and cause flicker... so TODO: make sure it never goes under mouse cursor
      div =  document.createElement('div');
      div.style.position = 'fixed'; // make the x,y coordinats relative to whole window so that the coordinates match the mouse position
      globaltooltip = div;
      // no width or hight set on the div: make it automatically match the size of the text. But the maxWidth ensures it won't get too wide in case of long text without newlines.
      ///div.style.maxWidth = mainFlex.div.clientWidth + 'px';
      if(state.tooltipstyle == 1) {
        div.style.backgroundColor = '#840e';
        div.style.color = '#fff';
        div.style.border = '2px solid #fff';
      } else if(state.tooltipstyle == 2) {
        div.style.backgroundColor = '#ccce';
        div.style.color = '#000';
        div.style.border = '1px solid #000';
      } else {
        div.style.backgroundColor = '#0008';
        div.style.color = '#fff';
        div.style.border = '';
      }

      div.style.padding = '4px';
      div.style.zIndex = '999';
      div.style.lineHeight = 'normal';
      div.style.textAlign = 'left';
      div.style.verticalAlign = 'top';
      //div.style.fontSize = '150%';
      div.style.fontSize = '';
      var textel = util.makeElementAt('span', 0, 0, div);
      textel.style.position = ''; // not absolute, so that the parent div will grow its size to fit this one.
      textel.innerHTML = text;

      document.body.appendChild(div);
      var tw = div.clientWidth;
      var maxw = Math.max(300, Math.floor(mainFlex.div.clientWidth * 0.3));
      if(text.length > 100) maxw = Math.max(400, Math.floor(mainFlex.div.clientWidth * 0.4));
      var maxr = mainFlex.div.clientWidth;
      if(tw > maxw) tw = maxw;
      if(x + maxw > maxr) x = maxr - maxw;
      div.style.left = x + 'px';
      div.style.top = y + 'px';
      div.style.width = tw + 'px';

      div.onmouseover = function() {
        // if one manages to mouse over the tip itself, remove it as it likely means it's in the way (plus it's not supposed to be possible in theory)
        remtip();
      };

      // Adjust the tooltip if it goes through the bottom, place it above instead then
      rect = div.getBoundingClientRect();
      var tipbottom = rect.y + rect.height;
      var tiph = rect.height;
      var doch = window.innerHeight;
      if(tipbottom > doch) {
        var bottom_loss = tipbottom - doch;
        var top_loss = tiph - tipy0;
        if(bottom_loss > top_loss) div.style.top = (tipy0 - tiph) + 'px';
      }

      if(opt_poll) {
        updatetooltipfun = function() {
          var text2 = el.tooltipfun();
          if(text2 && text2 != text) {
            text = text2;
            textel.innerHTML = text;
          }
        };
      }
    }
  };

  var remtip = function() {
    updatetooltipfun = undefined;
    if(globaltooltip) {
      util.removeElement(globaltooltip);
    }
    if(div && div != globaltooltip) {
      // normally always the same, but if somehow there would be a separate tip, delete that one too
      util.removeElement(div);
    }
    div = undefined;
    globaltooltip = undefined;
  };


  init();
}

// removes any stray remaining tooltip (it can't be plural in theory)
function removeAllTooltips() {
  if(globaltooltip) {
    util.removeElement(globaltooltip);
  }
  updatetooltipfun = undefined;
  globaltooltip = undefined;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/*
Does something very similar as what setting all element sizes to '%' units
does, but also makes the font sizes relative, something that is in theory
also possible with 'vw' and 'vh', but those are always relative to viewport
rather than parent, so we need to do it all in JS after all.
NOTE: not all children must be flexes, e.g. if you have a simple regular grid inside of
a Flex unit, you can use relative sizes with HTML's % unit in that one. Even if it has text,
setting a Flexible fontsize on the parent Flex is sufficient.

set parent to null or undefined to create root flex (will then use document.body as parent div)

coordinates are all in range 0..1, representing relative size factor of parent
the x/y coordinates may also be an array of 1, 2 or 3 items, then:
-the first is relative size compared to corresponding size (w or h)
-the second is relative size compared to minimum dimension (w or h)
-the third is a factor used for the opposing dimension in the min formula above
e.g. the formula for "left" is (with w and h the width and height of parent): x0[0] * w + x0[1] * min(w, x0[2] * h)
example: to have an element take full width if smaller than twice the height, stay at twice height otherwise, use x1 = [0, 1, 0.5]
example: to have something always be square inside of rectangular parent (which can dynamically be either horizontally or vertically longer), and always centered in there, use: [0.5,-0.5], [0.5,-0.5], [0.5,0.5], [0.5,0.5]
example: same as previous example but not square but rectangle that must keep constant ratio w/h = r: [0.5,-0.5,r], [0.5,-0.5,1/r], [0.5,0.5,r], [0.5,0.5,1/r]
example: button in bottom right corner with always a width/height ratio (of butotn itself) of 2/1 (here 0.3/0.15): [1.0, -0.3], [1.0, -0.15], [1.0, -0.01], [1.0, -0.01]
The fontSize lets the Flex also manage font size. This value does not support the 3-element array, just single number, and will be based on min(w*10, h) of the current element's computed size.
*/
function Flex(parent, x0, y0, x1, y1, opt_fontSize) {
  this.parent = parent || null;
  this.fontSize = opt_fontSize;
  if(x0.length) {
    this.x0 = x0[0];
    this.x0b = x0[1] || 0;
    this.x0f = x0[2] || 1;
  } else {
    this.x0 = x0;
    this.x0b = 0;
    this.x0f = 1;
  }
  if(y0.length) {
    this.y0 = y0[0];
    this.y0b = y0[1] || 0;
    this.y0f = y0[2] || 1;
  } else {
    this.y0 = y0;
    this.y0b = 0;
    this.y0f = 1;
  }
  if(x1.length) {
    this.x1 = x1[0];
    this.x1b = x1[1] || 0;
    this.x1f = x1[2] || 1;
  } else {
    this.x1 = x1;
    this.x1b = 0;
    this.x1f = 1;
  }
  if(y1.length) {
    this.y1 = y1[0];
    this.y1b = y1[1] || 0;
    this.y1f = y1[2] || 1;
  } else {
    this.y1 = y1;
    this.y1b = 0;
    this.y1f = 1;
  }
  if(parent) {
    parent.elements.push(this);
  }

  this.parentdiv = parent ? parent.div : document.body;
  this.div = makeDiv(0, 0, 0, 0, this.parentdiv);
  this.div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
  this.elements = [];

  this.updateSelf();
}

// The clientWidth/clientHeight call in updateFlex is very slow, especially for e.g. the medal UI with many items, avoid or reduce it, cache the parent, or so...
var Flex_prevParent = undefined;
var Flex_prevParent_clientWidth = undefined;
var Flex_prevParent_clientHeight = undefined;

Flex.prototype.updateSelf = function() {
  if(this.div == Flex_prevParent) Flex_prevParent = undefined;
  var w, h;
  if(this.parentdiv == document.body || !this.parentdiv) {
    w = window.innerWidth;
    h = window.innerHeight;
    Flex_prevParent = undefined;
  } else {
    if(this.parentdiv == Flex_prevParent) {
      w = Flex_prevParent_clientWidth;
      h = Flex_prevParent_clientHeight;
    } else {
      w = this.parentdiv.clientWidth;
      h = this.parentdiv.clientHeight;
      Flex_prevParent = this.parentdiv;
      Flex_prevParent_clientWidth = w;
      Flex_prevParent_clientHeight = h;
    }
  }
  var x0 = w * this.x0 + Math.min(w, this.x0f * h) * this.x0b;
  var y0 = h * this.y0 + Math.min(this.y0f * w, h) * this.y0b;
  var x1 = w * this.x1 + Math.min(w, this.x1f * h) * this.x1b;
  var y1 = h * this.y1 + Math.min(this.y1f * w, h) * this.y1b;
  this.div.style.left = Math.floor(x0) + 'px';
  this.div.style.top = Math.floor(y0) + 'px';
  this.div.style.width = Math.floor(x1 - x0) + 'px';
  this.div.style.height = Math.floor(y1 - y0) + 'px';
  if(this.fontSize) {
    //this.div.style.fontSize = Math.floor(Math.min(x1 - x0, y1 - y0) * this.fontSize) + 'px';
    this.div.style.fontSize = Math.floor(Math.min((x1 - x0) / 10, y1 - y0) * this.fontSize) + 'px';
  }


  if(this.center) {
    var divheight = this.div.clientHeight;
    // the next 3 properties are to center text horizontally and vertically
    this.div.style.textAlign = 'center';
    this.div.style.verticalAlign = 'middle';
    this.div.style.lineHeight = divheight + 'px';
  }
};

Flex.prototype.setCentered = function() {
  this.center = true;
  this.updateSelf();
};

// updates self and all chilren recursively
Flex.prototype.update = function() {
  this.updateSelf();
  for(var i = 0; i < this.elements.length; i++) {
    this.elements[i].update();
  }
}

// remove self from parent, from both Flex and DOM
Flex.prototype.removeSelf = function() {
  if(this.div == Flex_prevParent) Flex_prevParent = undefined;
  util.removeElement(this.div);
  if(this.parent) {
    var e = this.parent.elements;
    for(var i = 0; i < e.length; i++) {
      if(e[i] == this) {
        e.splice(i, 1);
        break;
      }
    }
  }
}

// removes all children and inner HTML of own div as well, but keeps self existing
Flex.prototype.clear = function() {
  if(this.div == Flex_prevParent) Flex_prevParent = undefined;
  for(var i = 0; i < this.elements.length; i++) {
    if(this.elements[i].div == Flex_prevParent) Flex_prevParent = undefined;
    util.removeElement(this.elements[i].div);
  }
  this.elements = [];
  this.div.innerHTML = '';
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// returns as a string the time to be able to avoid this cost, or percentage more of resources you have
// uses the global state.res and gain variables
// intended for dynamically updating tooltips
function getCostAffordTimer(cost) {
  var time = Num(0);
  var percent = Num(Infinity);


  if(cost.seeds.gtr(0)) {
    var p = cost.seeds.div(state.res.seeds).mulr(100);
    var t = cost.seeds.sub(state.res.seeds).div(gain.seeds);
    time = Num.max(time, t);
    percent = Num.min(percent, p);
  }

  if(cost.spores.gtr(0)) {
    var p = cost.spores.div(state.res.spores).mulr(100);
    var t = cost.spores.sub(state.res.spores).div(gain.spores);
    time = Num.max(time, t);
    percent = Num.min(percent, p);
  }

  /*if(cost.resin.gtr(0)) {
    var p = cost.resin.div(state.res.resin).mulr(100);
    var t = cost.resin.sub(state.res.resin).div(gain.resin);
    time = Num.max(time, t);
    percent = Num.min(percent, p);
  }*/

  var result = '';
  if(percent.gtr(100) && !time.eqr(Infinity)) {
    result += util.formatDuration(time.valueOf(), true);
  } else {
    if(percent.ltr(0.001)) percent = Num(0); // avoid display like '1.321e-9%'
    result += percent.toString() + '% of stacks';
  }

  return result;
}


// adds scrollbar and shadow effect if needed, otherwise not.
function makeScrollable(flex) {
  flex.div.style.overflowY = 'auto';
  flex.div.style.overflowX = 'hidden';

  // TODO: let this dynamically update if the flex changes size
  // timeout: ensure the computation happens after text was assigned to the div, ...
  window.setTimeout(function() {
    if(flex.div.scrollHeight > flex.div.clientHeight) {
      flex.div.className = 'efScrollGradient';
    } else {
      flex.div.className = '';
    }
  });
}
