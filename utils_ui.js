/*
Ethereal Farm
Copyright (C) 2020-2022  Lode Vandevenne

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

// This text centering method is simple because it involves only one HTML
// element and allows changing the text at any time without updating this,
// but it only supports single-line text. The div must already have its final
// height and shouldn't change.
function centerText(div, opt_clientHeight, opt_vertical_only) {
  var divheight = opt_clientHeight || div.clientHeight;
  // the next 3 properties are to center text horizontally and vertically
  if(!opt_vertical_only) div.style.textAlign = 'center';
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

// for some reason the unicode gear character (⚙) does not properly center when using centerText2, only for some fonts
// the additional rule in this function appears to fix it for now
// TODO: find more reliable solution and merge centerText2 and centerText2_unicode again
function centerText2_unicode(div) {
  centerText2(div);
  div.textEl.style.lineHeight = '100%';
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
// opt_immediate = make the button respond immediately on mousedown, rather than only on mouseup
// opt_noenterkey = do not make it activate on enter key (e.g. for the close button of dialogs, which is selected by default normally but shouldn't make the dialog close on pressing enter)
// TODO: work in progress refactoring: use registerAction for everything
function addButtonAction(div, fun, opt_label, opt_immediate, opt_noenterkey) {
  //var div = makeDiv('0', '0', '100%', '100%', div);
  if(opt_immediate && !isTouchDevice()) {
    // TODO: verify this works on all devices (screen readers, mobile where for some reason isTouchDevice doesn't detect it, etc...)
    div.onmousedown = fun;
  } else {
    div.onclick = fun;
  }
  if(!opt_noenterkey) {
    div.onkeypress = function(e) {
      if(e.key == 'Enter') fun(e);
      e.preventDefault();
    };
  }
  div.tabIndex = 0;
  setAriaRole(div, 'button');
  //div.setAttribute('aria-pressed', 'false'); // TODO: is this needed? maybe it's only for toggle buttons? which addButtonAction is not.
  if(opt_label) setAriaLabel(div, opt_label);
}

/*
registers click action(s), or tooltip, or both.
this replaces (and deprecates) addAction
this can support getting tooltips and shift+click or ctrl+click on mobile UI's too, which is why it has to be all together
div: the div to add the actions and/or tooltip to
fun: function called for actions, receives 2 parameters: shift, and ctrl (does not receive the JS event). Or give undefined to use this e.g. for tooltip only.
label: aria/mobile label for the action (must be short enough to fit a button in long-press context menu), or undefined if fun is undefined
params: optional, object with following named parameters, all optional:
params.label_shift: label for the action when shift is pressed. In addition, this also implies a shift action is available and should be displayed in mobile UI
params.label_ctrl: label for the action when shift is pressed. In addition, this also implies a ctrl action is available and should be displayed in mobile UI
params.label_ctrl_shift: label for the action when shift and ctrl are pressed. In addition, this also implies a ctrl action is available and should be displayed in mobile UI
params.tooltip: function or string for tooltip. If it's text, it's shown as-is. If function, the function should return text (for tooltips with dynamic content)
params.tooltip_poll: if true, will make the tooltip dynamically update by calling fun again
params.immediate: make the button respond immediately on mousedown, rather than only on mouseup. Not compatible with mobile.
params.noenterkey: do not make it activate on enter key (e.g. for the close button of dialogs, which is selected by default normally but shouldn't make the dialog close on pressing enter)
params.isdraggable: indicate there is some dragging action available from the div, that works on PC but not on mobile. Therefore, disable the long touch event on non-touch devices here since it may interfere with the dragging.
*/
function registerAction(div, fun, label, params) {
  if(!params) params = {};
  if(fun) {
    // can also give undefined for e
    var fun2 = function(e) {
      var shift = e && eventHasShiftKey(e);
      var ctrl = e && eventHasCtrlKey(e);
      fun(shift, ctrl);
    };
    if(params.immediate && !isTouchDevice()) {
      // TODO: verify this works on all devices (screen readers, mobile where for some reason isTouchDevice doesn't detect it, etc...)
      div.onmousedown = fun2;
    } else {
      div.onclick = fun2;
    }
    if(!params.noenterkey) {
      div.onkeypress = function(e) {
        if(e.key == 'Enter') fun2(undefined);
        e.preventDefault();
      };
    }
    div.tabIndex = 0;
    setAriaRole(div, 'button');
    //div.setAttribute('aria-pressed', 'false'); // TODO: is this needed? maybe it's only for toggle buttons? which addButtonAction is not.
    if(label) setAriaLabel(div, label);
  }

  if(params.tooltip) {
    registerTooltip_(div, params.tooltip, params.tooltip_poll, !params.fun);
  }

  if(params.tooltip || params.label_shift || params.label_ctrl) {
    // even though it's intended for mobile, enable the long touch also on desktop for testing it or trying it out. But don't do that for draggable things like the fruits since the long touch interferes too much with it
    if(isTouchDevice() || !params.isdraggable) {
      addLongTouchEvent(div, function(e) {
        makeLongTouchContextDialog(div, fun, label, params);
      });
    }
  }
}

// gets the same params as registerAction
function makeLongTouchContextDialog(div, fun, label, params) {
  var dialog = createDialog({
    title:'Long press context menu'
  });
  var content = dialog.content;

  var texth = 0.05;
  var y = 0;

  var addButton = function() {
    var h = 0.1;
    var flex  = new Flex(content, 0.01, y, 0.99, y + h);
    y += h * 1.2;
    flex.div.className = 'efButton';
    styleButton0(flex.div);
    centerText2(flex.div);
    return flex;
  };

  var flex = new Flex(content, 0.01, y, 0.99, y + texth);
  flex.div.innerText = 'Long click allows using shift/ctrl key actions and tooltips on touch interfaces.';
  y += 0.05;

  y += 0.05;
  if(fun) {
    var button = addButton();
    registerAction(button.div, function() {
      closeTopDialog(); // close this context menu
      fun(false, false);
    }, label, {});
    button.div.textEl.innerText = 'main: ' + upper(label);
  }

  if(params.label_shift) {
    var button = addButton();
    registerAction(button.div, function() {
      closeTopDialog(); // close this context menu
      fun(true, false);
    }, label, {});
    button.div.textEl.innerText = 'shift: ' + upper(params.label_shift);
  }

  if(params.label_ctrl) {
    var button = addButton();
    registerAction(button.div, function() {
      closeTopDialog(); // close this context menu
      fun(false, true);
    }, label, {});
    button.div.textEl.innerText = 'ctrl: ' + upper(params.label_ctrl);
  }

  if(params.label_ctrl_shift) {
    var button = addButton();
    registerAction(button.div, function() {
      closeTopDialog(); // close this context menu
      fun(true, true);
    }, label, {});
    button.div.textEl.innerText = 'shift+ctrl: ' + upper(params.label_ctrl_shift);
  }

  y += 0.05;

  if(params.tooltip) {
    flex = new Flex(content, 0.01, y, 0.99, y + texth);
    var text = 'Tooltip:<br><br>';
    text += (typeof params.tooltip == 'string') ? params.tooltip : params.tooltip()
    flex.div.innerHTML = text;
  }
}

// because touch events have their x and y position inside touches or targetTouches
function getEventXY(e) {
  var x = e.clientX;
  var y = e.clientY;
  if(!x && e.targetTouches && e.targetTouches[0]) {
    x = e.targetTouches[0].clientX;
    y = e.targetTouches[0].clientY;
  }
  return [x, y];
}

function addLongTouchEvent(div, fun) {
  var longtouchtime = 0.7;
  var timer;
  var x0 = 0;
  var y0 = 0;

  var cancelClick = function(e) {
    div.removeEventListener('click', cancelClick, true);
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  };

  var touch = isTouchDevice();
  var startEvent = touch ? 'touchstart' : 'mousedown';
  var endEvent = touch ? 'touchend' : 'mouseup';
  var moveEvent = touch ? 'touchmove' : 'mousemove';

  div.addEventListener(startEvent, function(e) {
    if(!touch && e.which == 3) return; // don't prevent right click menu in regular browsers
    // don't prevent *next* click (for touch case, where preventing regular click below is in fact possibly not executed, but some other things use onclick)
    div.removeEventListener('click', cancelClick, true);
    var pos = getEventXY(e);
    x0 = pos[0];
    y0 = pos[1];
    if(timer) clearTimeout(timer);
    timer = window.setTimeout(function() {
      timer = undefined;
      fun();
      // prevent the regular click event
      div.addEventListener('click', cancelClick, true);
    }, longtouchtime * 1000);
  }, true);

  div.addEventListener(endEvent, function() {
    if(!timer) return;
    clearTimeout(timer);
    timer = undefined;
  }, true);

  div.addEventListener(moveEvent, function(e) {
    if(!timer) return;
    var pos = getEventXY(e);
    // allow some slack in the movement for touch position
    if(Math.abs(x0 - pos[0]) >= 10 || Math.abs(y0 - pos[1]) >= 10) {
      clearTimeout(timer);
      timer = undefined;
    }
  }, true);

  // this event shouldn't appear on touch devices, but should stop the timer if present since it prevents moveEvents from detecting that the long prss menu shouldn't appear
  div.addEventListener('dragstart', function(e) {
    if(!timer) return;
    clearTimeout(timer);
    timer = undefined;
  }, true);

  // this stops mobile context menu from appearing on long press, since we have our own context menu
  div.oncontextmenu = function(e) {
    if(!touch && e.which == 3) return; // don't prevent right click menu in regular browsers
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  };

  // this stops mobile context callouts from appearing on long press on ios
  div.style.webkitTouchCallout = 'none';
  div.style.webkitUserSelect = 'none';
}



// styles only a few of the essential properties for button
// does not do centering (can be used for other text position), or colors/borders/....
// must be called *after* any styles such as backgroundColor have already been set
// opt_disallow_hover_filter: diallow the mouse hover filter effect. Normally would be nice to always have, but chrome will make pixelated canvases a blurry mess when applying opacity or filter, so disable it for canvases for now.
function styleButton0(div, opt_disallow_hover_filter) {
  div.style.cursor = 'pointer';
  div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
  if(div.textEl) div.textEl.style.userSelect = 'none'; // prevent unwanted selections when double clicking things

  if(opt_disallow_hover_filter == 2) {
    util.setEvent(div, 'mouseover', 'buttonstyle', function() { div.style.border = '4px solid red';});
    util.setEvent(div, 'mouseout', 'buttonstyle', function() { div.style.filter = ''; });
  } else if(!opt_disallow_hover_filter) {
    util.setEvent(div, 'mouseover', 'buttonstyle', function() { div.style.filter = 'brightness(0.93)';});
    util.setEvent(div, 'mouseout', 'buttonstyle', function() { div.style.filter = ''; });
  } else {
    // as an alternative to the filter, add an invisible border around the canvas, this slightly changes its size, indicating the hover that way
    util.setEvent(div, 'mouseover', 'buttonstyle', function() { div.style.border = '1px solid #0000';});
    util.setEvent(div, 'mouseout', 'buttonstyle', function() { div.style.border = ''; });
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
var created_dialogs = []; // array of objects created by the createDialog function
var created_overlays = [];

var DIALOG_TINY = 0;
var DIALOG_SMALL = 1;
var DIALOG_MEDIUM = 2;
var DIALOG_LARGE = 3;

// if not undefined, can handle shortcuts for dialog (as opposed to global shortcut)
// NOTE: only supported in one dialog level in the chain
var dialogshortcutfun = undefined;

var NOCANCELBUTTON = 'nocancel';

/*
params is object with following named parameters, all optional:
params.functions: function, or array of functions, for the ok/action buttons
params.names: button names for the functions. This and functions must be either arrays of same size, or function and string (or undefined for default 'ok') if there should be exactly one non-cancel button, or both undefined for none at all
params.names_shift: button names for shift/ctrl variants of functions. Optional. Allows the mobile long-press context menu on dialog buttons.
params.names_ctrl: idem for CTRL key
params.names_ctrl_shift: idem vor SHIFT+CTRL key
params.tooltips: optional tooltips for some buttons
params.onclose: function that is always called when the dialog closes, no matter how (whether through an action, the cancel button, or some other means like global close or escape key). It receives a boolean argument 'cancel' that's true if it was closed by any other means than a non-cancel button (so, true if it was canceled)
params.oncancel: similar to onclose, but only called in case of cancel actions (the cancel button, esc key, ...), not when one of the buttons from params.functions/params.names got pressed
params.cancelname: name for the cancel button, gets a default name if not given
params.nocancel: if set, no cancel button will be rendered at all
params.title: title for top of the dialog. If empty, title can still be set on the flex result.title
params.icon: image, icon for top left of the dialog. If empty, title can still be set on the flex result.icon
params.iconmargin: if present, gives this percentage of margin to the icon, if not present there's 0 margin. Should be used only when filling the dialog.icon space yourself, so when not using params.icon: params.icon already applies its own margin.
params.help: optional function or string for help text. If set, there'll be a help button. If text, a dialog with the help text will be opened. If function, the function will be executed when pressing the help button
params.size: DIALOG_TINY, DIALOG_SMALL, DIALOG_MEDIUM or DIALOG_LARGE
parrams.narrow: content will be more narrow, the width of the top icon / close button will be removed from each side, allows making a taller icon
params.scrollable: whether to make the content flex scrollable with scrollbar if the content is too large
params.scrollable_canchange: like scrollable, but with more event listeners to adapt to changing content
params.shortcutfun: a function handling shortcuts that are active while this dialog is open
params.nobgclose: boolean, don't close by clicking background or pressing esc, for e.g. savegame recovery dialog
params.swapbuttons: swap the order of the buttons. This order can also be swapped by the state.cancelbuttonright setting. This swaps them in addition to what that does
params.bgstyle: className of alternative background CSS style, e.g. 'efDialogEthereal'
params.invbold: make the cancel button instead of ok button bold
params.allbold: make all buttons bold, cancel and action buttons

Return object contains (amongst other fields):
dialog.content: flex where the main content can be put
dialog.div: div of the entire dialog (to change e.g. the background color)
dialog.icon: flex where the icon can go
*/
function createDialog(params) {
  if(!params) params = {};
  var functions = params.functions;
  var names = params.names;
  var tooltips = params.tooltips;
  var names_shift = params.names_shift;
  var names_ctrl = params.names_ctrl;
  var names_ctrl_shift = params.names_ctrl_shift;

  if(!Array.isArray(functions)) functions = (functions ? [functions] : []);
  if(!Array.isArray(names)) names = (functions ? [names || 'ok'] : []);
  if(!Array.isArray(tooltips)) tooltips = (tooltips ? [tooltips] : []);
  if(!Array.isArray(names_shift)) names_shift = (names_shift ? [names_shift] : []);
  if(!Array.isArray(names_ctrl)) names_ctrl = (names_ctrl ? [names_ctrl] : []);
  if(!Array.isArray(names_ctrl_shift)) names_ctrl_shift = (names_ctrl_shift ? [names_ctrl_shift] : []);

  var dialog = {};

  if(dialog_level < 0) {
    // some bug involving having many help dialogs pop up at once and rapidly closing them using multiple methods at the same time (esc key, click next to dialog, ...) can cause this, and negative dialog_level makes dialogs appear in wrong z-order
    closeAllDialogs();
  }
  dialog_level++;
  updateDialogLevel();
  dialogshortcutfun = params.shortcutfun; // may be undefined

  removeAllTooltips(); // this is because often clicking some button with a tooltip that opens a dialog, then causes that tooltip to stick around which is annoying
  removeAllDropdownElements();

  var dialogFlex;
  if(params.size == DIALOG_TINY) {
    dialogFlex = new Flex(topDialogFlex, 0.05, 0.33, 0.95, 0.66);
  } else if(params.size == DIALOG_SMALL) {
    dialogFlex = new Flex(topDialogFlex, 0.05, 0.25, 0.95, 0.75);
  } else if(params.size == DIALOG_LARGE) {
    dialogFlex = new Flex(topDialogFlex, 0.05, 0.05, 0.95, 0.9);
  } else {
    // default, medium. Designed to be as big as possible without covering up the resource display
    dialogFlex = new Flex(topDialogFlex, 0.05, 0.12, 0.95, 0.9);
  }

  dialog.onclose = params.onclose;
  dialog.oncancel = params.oncancel;
  dialog.shortcutfun = params.shortcutfun;

  created_dialogs.push(dialog);


  dialogFlex.div.className = params.bgstyle || 'efDialog';
  setAriaRole(dialogFlex.div, 'dialog');
  dialogFlex.div.setAttribute('aria-modal', 'true');
  dialogFlex.div.style.zIndex = '' + (dialog_level * 10 + 5);

  // function that will be called when the dialog is closed by cancel (including e.g. the esc key), but not ok and extra funs
  dialog.cancelFun = function() {
    dialog.closeFun(true);
  };
  // function that will be called when the dialog is closed by cancel, ok and extra funs
  dialog.closeFun = function(opt_cancel) {
    updatedialogfun = undefined;
    dialogshortcutfun = undefined;
    util.removeElement(overlay);
    for(var i = 0; i < created_dialogs.length; i++) {
      if(created_dialogs[i] == dialog) {
        created_dialogs.splice(i, 1);
        if(i > 0) dialogshortcutfun = created_dialogs[i - 1].shortcutfun;
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
    dialog.removeSelfFun(opt_cancel);
    showGoalChips(); // this ensures a faster response time for the display of red help arrows when dialogs are opening/closing, otherwise it only happens after a tick, which, even if sub-second, feels sluggish
    updateDialogLevel();
  };
  // more primitive close, only intended for external use by closeAllDialogs, since that does all the things that closeFun above does in a global way for all dialogs
  dialog.removeSelfFun = function(opt_cancel) {
    dialogFlex.removeSelf(topDialogFlex);
    if(opt_cancel && dialog.oncancel) dialog.oncancel();
    if(dialog.onclose) dialog.onclose(); // this must be called no matter with what method this dialog is closed/forcibly removed/...
  };

  var topHeight = 0.11;

  var title_x0;
  var title_x1;

  var xbutton = new Flex(dialogFlex, 1 - topHeight, 0, 1, [0, topHeight]);
  var canvas = createCanvas('20%', '20%', '60%', '60%', xbutton.div);
  renderImage(image_close, canvas);
  styleButton0(xbutton.div);
  addButtonAction(xbutton.div, dialog.cancelFun, (params.title ? (' close dialog: "' + params.title + '"') : 'dialog close button'), true);
  xbutton.div.className = 'efNoOutline';
  xbutton.div.title = 'close';

  var helpbutton;
  if(params.help) {
    helpbutton = new Flex(dialogFlex, 1- topHeight * 2, 0, 1 - topHeight, [0, topHeight]);
    var canvas = createCanvas('20%', '20%', '60%', '60%', helpbutton.div);
    renderImage(image_help, canvas);
    styleButton0(helpbutton.div);

    if(typeof params.help == 'string') {
      var helptext = params.help;
      params.help =  function() {
        var helpdialog = createDialog({scrollable:true, title:'Help'});
        helpdialog.content.div.innerHTML = helptext;
      };
    }
    addButtonAction(helpbutton.div, params.help, 'help');
    helpbutton.div.title = 'help';
    title_x0 = topHeight * 2;
    title_x1 = 1 -topHeight * 2;
  } else {
    title_x0 = topHeight;
    title_x1 = 1 - topHeight;
  }

  var nobottombuttons = params.nocancel && functions.length == 0;
  var contentHeight = 0.88;
  if(params.size == DIALOG_TINY) contentHeight = 0.8; // ensure content doesn't go over the buttons
  if(params.size == DIALOG_SMALL) contentHeight = 0.8; // ensure content doesn't go over the buttons
  if(nobottombuttons) contentHeight = 1;


  dialog.flex = dialogFlex;
  dialog.div = dialogFlex.div;
  var iconmargin = params.iconmargin || 0;
  dialog.icon = new Flex(dialogFlex, topHeight * iconmargin, [0, topHeight * iconmargin], topHeight * (1 - iconmargin), [0, topHeight * (1 - iconmargin)]);

  if(params.narrow) {
    dialog.title = new Flex(dialogFlex, title_x0, 0, title_x1, [0, topHeight * 0.75], FONT_TITLE);
    dialog.content = new Flex(dialogFlex, topHeight, [0, topHeight * 0.75], 1 - topHeight, contentHeight);
  } else {
    dialog.title = new Flex(dialogFlex, title_x0, 0, title_x1, [0, topHeight], FONT_TITLE);
    dialog.content = new Flex(dialogFlex, 0.02, [0, topHeight], 0.98, contentHeight);
  }

  if(params.scrollable) makeScrollable(dialog.content, false);
  if(params.scrollable_canchange) makeScrollable(dialog.content, true);

  centerText2(dialog.title.div);
  dialog.titleEl = dialog.title.div.textEl;

  if(params.title) {
    dialog.title.div.textEl.innerText = params.title;
    setAriaLabel(dialog.title.div, 'Dialog: ' + params.title);
  }

  if(params.icon) {
    canvas = createCanvas('5%', '5%', '90%', '90%', dialog.icon.div);
    renderImage(params.icon, canvas);
  }



  // allow giving undefined at input to set an extra function/name to be disabled, remove this from the array here
  for(var i = 0; i < functions.length; i++) {
    if(functions[i] == undefined || names[i] == undefined) {
      functions.splice(i, 1);
      names.splice(i, 1);
      i--;
    }
  }

  var num_buttons = functions.length + 1;

  var buttonsize = 0.27;
  if(num_buttons > 3) buttonsize = 0.247;

  // the is_cancel is for positioning cancel as if it was first, when state.cancelbuttonright, given that this function is called last for the cancel button
  var makeButton = function(is_cancel) {
    var dialog;
    if((!state || state.cancelbuttonright) != !!params.swapbuttons) {
      var s = buttonshift;
      if(is_cancel) {
        s = 0;
      } else {
        s++;
      }
      dialog = (new Flex(dialogFlex, 1.0 - buttonsize * (s + 1), [1.0, -0.4 * buttonsize], 1.0 - 0.01 - buttonsize * s, [1.0, -0.01], FONT_DIALOG_BUTTON)).div;
    } else {
      dialog = (new Flex(dialogFlex, 1.0 - buttonsize * (buttonshift + 1), [1.0, -0.4 * buttonsize], 1.0 - 0.01 - buttonsize * buttonshift, [1.0, -0.01], FONT_DIALOG_BUTTON)).div;
    }
    buttonshift++;
    return dialog;
  };

  var button;
  var buttonshift = 0;
  if(functions) {
    for(var i = 0; i < functions.length; i++) {
      button = makeButton(false);
      if(!params.invbold || params.allbold) button.style.fontWeight = 'bold';
      styleButton(button);
      button.textEl.innerText = names[i];
      var fun = functions[i];
      registerAction(button, bind(function(fun, e) {
        var keep = fun(e);
        if(!keep) dialog.closeFun(false);
      }, fun), names[i] + ' (dialog button)', {
        tooltip:tooltips[i],
        label_shift:(names_shift[i]),
        label_ctrl:(names_ctrl[i]),
        label_ctrl_shift:(names_ctrl_shift[i]),
      });
    }
  }


  if(!params.nocancel) {
    button = makeButton(true);
    if(params.invbold || params.allbold) button.style.fontWeight = 'bold';
    styleButton(button);
    var cancelname = params.cancelname || (functions.length > 0 ? 'cancel' : 'back');
    button.textEl.innerText = cancelname;
    addButtonAction(button, dialog.cancelFun, cancelname + ': dialog button');
  }
  var overlay = createOverlay(dialog_level * 10);
  created_overlays.push(overlay);
  if(!params.nobgclose) overlay.onclick = dialog.cancelFun;

  window.setTimeout(function() {
    showGoalChips(); // this ensures a faster response time for the display of red help arrows when dialogs are opening/closing, otherwise it only happens after a tick, which, even if sub-second, feels sluggish
  });

  xbutton.div.focus(); // focus an element of the dialog for aria

  return dialog;
}

function createOverlay(zIndex) {
  var overlay = makeDiv(0, 0, window.innerWidth, window.innerHeight);
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '' + zIndex;
  return overlay;
}



function closeAllDialogs() {
  updatedialogfun = undefined;

  for(var i = 0; i < created_dialogs.length; i++) {
    created_dialogs[i].removeSelfFun(true);
  }
  for(var i = 0; i < created_overlays.length; i++) {
    util.removeElement(created_overlays[i]);
  }
  created_dialogs = [];
  created_overlays = [];
  dialog_level = 0;

  // a tooltip created by an element from a dialog could remain, make sure those are removed too
  removeAllTooltips();
  updateDialogLevel();
}

// update other effects that are there due to the dialog level
function updateDialogLevel() {
  if(dialog_level == 0) {
    topDialogFlex.div.style.visibility = 'hidden';
    makeAriaHidden(nonDialogFlex.div, false);
  } else {
    topDialogFlex.div.style.visibility = '';
    makeAriaHidden(nonDialogFlex.div, true);

    if(created_dialogs.length >= dialog_level) {
      makeAriaHidden(created_dialogs[dialog_level - 1].flex.div, false);
    }
    if(dialog_level > 1) {
      makeAriaHidden(created_dialogs[dialog_level - 2].flex.div, true);
    }
  }
}

// opt_cancel: boolean, whether this is an intential cancel (from the Escape key), so that the dialog's cancel function will be called as well, or a close for another programmatic reason where only closeFun of the dialog should be called.
function closeTopDialog(opt_cancel) {
  if(created_dialogs && created_dialogs.length > 0) {
    var dialog = created_dialogs[created_dialogs.length - 1];
    if(opt_cancel) dialog.cancelFun();
    else dialog.closeFun(opt_cancel);
  }
}

function makeAriaHidden(div, hidden) {
  // the goal is to make all elements, recursively, of this element hidden, even any focusable elements inside, but have it be still visual (no "display none")
  // this is for the background behind modal dialogs.
  // aria-hidden seems to not really work as focusable elements will still be tabbable too, even when due to
  // modal dialog these elements are not clickable for non screenreader users
  // but the attribute 'inert' seems to work correctly
  // also set aria-hidden anyway to really indicate it
  if(hidden) {
    div.setAttribute('aria-hidden', true);
    div.setAttribute('inert', true);
  } else {
    div.setAttribute('aria-hidden', false);
    div.removeAttribute('inert');
    //div.setAttribute('inert', false);
  }
}

document.addEventListener('keydown', function(e) {
  if(dialog_level > 0) {
  }

  if(dialogshortcutfun) {
    if(dialog_level <= 0) {
      dialogshortcutfun = undefined;
      return;
    }
    dialogshortcutfun(e);
    e.stopImmediatePropagation(); // if this shortcut caused the dialog to close (e.g. planting blueprint), ensure it stops propagating to the main game keyboard handler, which will think there's no dialog open and so could handle the shortcut a second time for a different non-dialog action

    if(e.keyCode == 27 || e.code == 'Escape') {
      if(dropdownEl) {
        removeAllDropdownElements();
      } else {
        closeTopDialog(true);
      }
    }
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
function registerTooltip_(el, fun, opt_poll, opt_allowmobile) {
  var istext = (typeof fun == 'string');
  if((typeof fun == 'string') || !fun) fun = bind(function(text) { return text; }, fun);
  // can't set this if opt_poll, fun() then most likely returns something incorrect now (e.g. on the field tiles)
  if(!opt_poll) {
    el.setAttribute('aria-description', fun());
    if(!istext) el.onfocus = function() { el.setAttribute('aria-description', fun()); }; // dynamic (but without opt_poll), so update every now and then
  }
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
    util.setEvent(el, 'mouseover', 'tooltip', function(e) {
      if(e.shiftKey || eventHasCtrlKey(e)) return;
      if(MOBILEMODE && !opt_allowmobile) return;
      maketip(el.tooltipfun(), e, false);
    });

    // NOTE: mouseout unwantedly also triggers when over child elements of el (solved inside) or when over the tooltip itself (solved by making tooltip never overlap el)
    util.setEvent(el, 'mouseout', 'tooltip', function(e) {
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
        div.style.backgroundColor = '#004';
        div.style.color = '#fff';
        div.style.border = '2px solid #fff';
      } else if(state.tooltipstyle == 2) {
        div.style.backgroundColor = '#ccce';
        div.style.color = '#000';
        div.style.border = '1px solid #000';
      } else if(state.tooltipstyle == 4) {
        div.style.backgroundColor = '#840e';
        div.style.color = '#fff';
        div.style.border = '2px solid #fff';
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
      tw += 16; // make it a bit bigger, sometimes the clientWidth computation is slightly too small and the text will wrap the last word anyway
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

function registerTooltip(el, fun, opt_poll) {
  registerAction(el, undefined, undefined, {tooltip:fun, tooltip_poll:opt_poll});
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

// Get one global font size for use by all flexes, to ensure consistency, as
// compared to an older system where font size was relative to each flex, which
// caused inconsistencies, and chance of having too small font size in some
// cases depending on screen size
function getGlobalFontSize() {
  var w = window.innerWidth;
  var h = window.innerHeight;

  // the ratio of the main game flex is "w, h * 0.75"
  //return Math.min(w, h * 0.75) * 0.02;

  // some ratio is added to w, which kicks in only if h is higher, this helps
  // the font be a bit bigger on vertical mobile devices
  return Math.min(w * 1.3, h * 0.75) * 0.021;
}

// Enum-style values for a small set of possible font size variations, for use by flexes
var FONT_STANDARD = 0; // the font size to use in most cases (and when parameter not given), such as descriptions, help text, ... in dialogs
var FONT_BIG_BUTTON = 1; // font size for buttons such as in the main menu, where the text should be bigger than standard
var FONT_DIALOG_BUTTON = 2; // font size for buttons at the bottom of dialogs such as 'ok' and 'cancel'
var FONT_FULL = 3; // full width such as the full screen "paused" message
var FONT_SMALL = 4; // in case something really needs to fit in a space. Should not be overused, could be too small
var FONT_TITLE = 5; // titles at top of dialogs

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
the x/y coordinates may also be an array of 1, 2, 3 or 4 items, then:
-the first is relative size compared to corresponding size (w or h)
-the second is relative size compared to the opposing dimension (h or w)
-the third is relative size compared to minimum dimension (w or h)
-the fourth is a factor used for the opposing dimension in the min(current, opposing) formula above. Default value is 1. Other values allow to use the "minimum dimension" feature from the third value for non-square parent flexes.
-the fifth is a value directly in pixels
e.g. the formula for "left" is (with w and h the width and height of parent): x0[0] * w + x0[1] * h + x0[2] * min(w, x0[3] * h)
example: to have an element take full width if smaller than twice the height, stay at twice height otherwise, use x1 = [0, 0, 1, 0.5]
example: to have something always be square inside of rectangular parent (which can dynamically be either horizontally or vertically longer), and always centered in there, use: [0.5,0,-0.5], [0.5,0,-0.5], [0.5,0,0.5], [0.5,0,0.5]
example: same as previous example but not square but rectangle that must keep constant ratio w/h = r: [0.5,0,-0.5,r], [0.5,0,-0.5,1/r], [0.5,0,0.5,r], [0.5,0,0.5,1/r]
example: button in bottom right corner with always a width/height ratio (of butotn itself) of 2/1 (here 0.3/0.15): [1.0, 0, -0.3], [1.0, 0, -0.15], [1.0, 0, -0.01], [1.0, 0, -0.01]
The fontSize lets the Flex also manage font size. This value does not support the 3-element array, just single number, and will be based on min(w*10, h) of the current element's computed size.
*/
function Flex(parent, x0, y0, x1, y1, opt_fontSize, opt_centered) {
  this.fontSize = opt_fontSize;

  this.center = !!opt_centered;

  this.isroot = !parent || (parent.div == document.body);

  if(x0.length) {
    this.x0 = x0[0];
    this.x0o = x0[1] || 0;
    this.x0b = x0[2] || 0;
    this.x0f = (x0[3] == undefined) ? 1 : x0[3];
    this.x0p = x0[4] || 0;
  } else {
    this.x0 = x0;
    this.x0o = 0;
    this.x0b = 0;
    this.x0f = 1;
    this.x0p = 0;
  }
  if(y0.length) {
    this.y0 = y0[0];
    this.y0o = y0[1] || 0;
    this.y0b = y0[2] || 0;
    this.y0f = (y0[3] == undefined) ? 1 : y0[3];
    this.y0p = y0[4] || 0;
  } else {
    this.y0 = y0;
    this.y0o = 0;
    this.y0b = 0;
    this.y0f = 1;
    this.y0p = 0;
  }
  if(x1.length) {
    this.x1 = x1[0];
    this.x1o = x1[1] || 0;
    this.x1b = x1[2] || 0;
    this.x1f = (x1[3] == undefined) ? 1 : x1[3];
    this.x1p = x1[4] || 0;
  } else {
    this.x1 = x1;
    this.x1o = 0;
    this.x1b = 0;
    this.x1f = 1;
    this.x1p = 0;
  }
  if(y1.length) {
    this.y1 = y1[0];
    this.y1o = y1[1] || 0;
    this.y1b = y1[2] || 0;
    this.y1f = (y1[3] == undefined) ? 1 : y1[3];
    this.y1p = y1[4] || 0;
  } else {
    this.y1 = y1;
    this.y1o = 0;
    this.y1b = 0;
    this.y1f = 1;
    this.y1p = 0;
  }
  if(parent) {
    parent.elements.push(this);
  }


  //var parentdiv = parent ? parent.div : document.body;
  var parentdiv = parent ? parent.div : Utils.doNotAddToParent;
  this.div = makeDiv(0, 0, 0, 0, parentdiv);
  this.div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
  this.elements = [];

  this.updateSelf(parentdiv);
}

// parent may be a flex, or a div
// this function may only be used if this flex was never attached to a parent before, neither a flex nor a root HTML element.
// this function can be used after a Flex was made with the constructor with null as parent
// also calls update, so only use this for a root div to prevent performance issues
Flex.prototype.attachTo = function(parent) {
  var parentdiv;
  if(parent instanceof Flex) {
    this.isroot = false;
    parentdiv = parent.div;
    parent.elements.push(this);
  } else {
    this.isroot = true;
    parentdiv = parent;
  }
  /*if(this.div.parentElement != parentdiv) {
    util.removeElement(this.div);
    parentdiv.appendChild(this.div)
  }*/
  parentdiv.appendChild(this.div)
  //this.updateSelf(parentdiv);
  this.update(parentdiv);
};

// The clientWidth/clientHeight call in updateFlex is very slow, especially for e.g. the medal UI with many items, avoid or reduce it, cache the parent, or so...
var Flex_prevParent = undefined;
var Flex_prevParent_clientWidth = undefined;
var Flex_prevParent_clientHeight = undefined;

Flex.prototype.getDim_ = function(parentdiv) {
  if(this.div == Flex_prevParent) Flex_prevParent = undefined;
  var w, h;
  if(this.isroot || !parentdiv) {
    w = window.innerWidth;
    h = window.innerHeight;
    Flex_prevParent = undefined;
  } else {
    if(parentdiv == Flex_prevParent) {
      w = Flex_prevParent_clientWidth;
      h = Flex_prevParent_clientHeight;
    } else {
      w = parentdiv.clientWidth;
      h = parentdiv.clientHeight;
      Flex_prevParent = parentdiv;
      Flex_prevParent_clientWidth = w;
      Flex_prevParent_clientHeight = h;
    }
  }
  return [w, h];
}

Flex.prototype.updateSelf = function(parentdiv) {
  //if(!parentdiv) parentdiv = this.div.parentElement;
  var dim = this.getDim_(parentdiv);
  var w = dim[0];
  var h = dim[1];

  var x0 = w * this.x0 + h * this.x0o + Math.min(w, this.x0f * h) * this.x0b + this.x0p;
  var y0 = h * this.y0 + w * this.y0o + Math.min(this.y0f * w, h) * this.y0b + this.y0p;
  var x1 = w * this.x1 + h * this.x1o + Math.min(w, this.x1f * h) * this.x1b + this.x1p;
  var y1 = h * this.y1 + w * this.y1o + Math.min(this.y1f * w, h) * this.y1b + this.y1p;
  this.div.style.left = Math.floor(x0) + 'px';
  this.div.style.top = Math.floor(y0) + 'px';
  this.div.style.width = Math.floor(x1 - x0) + 'px';
  this.div.style.height = Math.floor(y1 - y0) + 'px';
  if(this.fontSize) {
    //this.div.style.fontSize = Math.floor(Math.min(x1 - x0, y1 - y0) * this.fontSize) + 'px';
    //this.div.style.fontSize = Math.floor(Math.min((x1 - x0) / 10, y1 - y0) * this.fontSize) + 'px';
    //this.div.style.fontSize = '26px';
    //this.div.style.fontSize = '100%';
  }

  if(this.fontSize == FONT_FULL) {
    this.div.style.fontSize = Math.floor(Math.min((x1 - x0) / 10, y1 - y0) * 2) + 'px';
  } else {
    var multiplier = 1.0;
    if(this.fontSize == FONT_BIG_BUTTON) multiplier = 1.4;
    else if(this.fontSize == FONT_DIALOG_BUTTON) multiplier = 1.25;
    else if(this.fontSize == FONT_SMALL) multiplier = 0.9;
    else if(this.fontSize == FONT_TITLE) multiplier = 1.5;
    this.div.style.fontSize = Math.floor(getGlobalFontSize() * multiplier) + 'px';
  }



  if(this.center) {
    var divheight = this.div.clientHeight;
    // the next 3 properties are to center text horizontally and vertically
    this.div.style.textAlign = 'center';
    this.div.style.verticalAlign = 'middle';
    this.div.style.lineHeight = divheight + 'px';
  }
};

// updates self and all chilren recursively
Flex.prototype.update = function(opt_parentdiv) {
  if(opt_parentdiv) {
    this.updateSelf(opt_parentdiv);
  } else if(this.isroot) {
    this.updateSelf(undefined);
  }

  for(var i = 0; i < this.elements.length; i++) {
    this.elements[i].update(this.div);
  }
}

// remove self from parent, from both Flex and DOM
// parent must be given, Flex does not keep a reference to its own parent, only children
Flex.prototype.removeSelf = function(parent) {
  if(this.div == Flex_prevParent) Flex_prevParent = undefined;
  util.removeElement(this.div);
  if(parent) {
    var e = parent.elements;
    for(var i = 0; i < e.length; i++) {
      if(e[i] == this) {
        e.splice(i, 1);
        break;
      }
    }
  }
}

// removes all children and inner HTML (but not style) of own div as well, but keeps self existing
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

  if(cost.nuts.gtr(0)) {
    var p = cost.nuts.div(state.res.nuts).mulr(100);
    var t = cost.nuts.sub(state.res.nuts).div(gain.nuts);
    time = Num.max(time, t);
    percent = Num.min(percent, p);
  }

  if(cost.resin.gtr(0)) {
    var p = cost.resin.div(state.res.resin).mulr(100);
    var t = cost.resin.sub(state.res.resin).div(gain.resin);
    time = Num.max(time, t);
    percent = Num.min(percent, p);
  }

  if(cost.twigs.gtr(0)) {
    var p = cost.twigs.div(state.res.twigs).mulr(100);
    var t = cost.twigs.sub(state.res.twigs).div(gain.twigs);
    time = Num.max(time, t);
    percent = Num.min(percent, p);
  }

  if(cost.infseeds.gtr(0)) {
    var p = cost.infseeds.div(state.res.infseeds).mulr(100);
    var t = cost.infseeds.sub(state.res.infseeds).div(gain.infseeds);
    time = Num.max(time, t);
    percent = Num.min(percent, p);
  }

  var result = '';
  if(percent.gtr(100) && !time.eqr(Infinity)) {
    result += util.formatDuration(time.valueOf(), true);
  } else {
    if(percent.ltr(0.001)) percent = Num(0); // avoid display like '1.321e-9%'
    result += percent.toString() + '% of stacks';
  }

  return result;
}


// similar to getCostAffordTimer, but only shows percentage of resources, whether higher or lower
function getCostAffordPercentage(cost) {
  var percent = Num(Infinity);


  if(cost.seeds.gtr(0)) {
    var p = cost.seeds.div(state.res.seeds).mulr(100);
    percent = Num.min(percent, p);
  }

  if(cost.spores.gtr(0)) {
    var p = cost.spores.div(state.res.spores).mulr(100);
    percent = Num.min(percent, p);
  }

  if(cost.nuts.gtr(0)) {
    var p = cost.nuts.div(state.res.nuts).mulr(100);
    percent = Num.min(percent, p);
  }

  if(cost.resin.gtr(0)) {
    var p = cost.resin.div(state.res.resin).mulr(100);
    percent = Num.min(percent, p);
  }

  if(cost.twigs.gtr(0)) {
    var p = cost.twigs.div(state.res.twigs).mulr(100);
    percent = Num.min(percent, p);
  }

  var result = '';
  if(percent.ltr(0.001)) percent = Num(0); // avoid display like '1.321e-9%'
  result += percent.toString() + '% of stacks';

  return result;
}


// adds scrollbar and shadow effect if needed, otherwise not.
// opt_canchange: if true, a mutation observer will listen for changes and update style when needed. Don't use this for elements that constantly change but are unlikely to change whether or not there are scrollbars (such as dialog with plant growtime, for performance reasons), use for something that may significantly change size based on user action like fruit fusing dialog
function makeScrollable(flex, opt_canchange) {
  flex.div.style.overflowY = 'auto';
  flex.div.style.overflowX = 'hidden';


  // timeout: ensure the computation happens after text was assigned to the div, ...
  window.setTimeout(function() {
    if(flex.div.scrollHeight > flex.div.clientHeight) {
      flex.div.className = 'efScrollGradient';
    } else {
      flex.div.className = '';
    }
    if(opt_canchange) {
      // also observe later changes, e.g. when adding new fruits in the fuse dialog causing it to need to get the scroll gradient effect
      // TODO: find a better way than MutationObserver to do this, something that can observe the inner size (ResizeObserver observes outer size)
      new MutationObserver(function(mutations) {
        if(!mutations[0]) return;
        var div = mutations[0].target;
        if(div.scrollHeight > div.clientHeight) {
          div.className = 'efScrollGradient';
        } else {
          div.className = '';
        }
      }).observe(flex.div, {childList:true});
    }
  });
}

////////////////////////////////////////////////////////////////////////////////

var dropdownEl = undefined;
var dropdownOverlayEl = undefined;

function removeAllDropdownElements() {
  if(dropdownEl) dropdownEl.showFun(false);
  if(dropdownOverlayEl) {
    util.removeElement(dropdownOverlayEl);
    dropdownOverlayEl = undefined;
  }
}

// opt_dont_change_style: don't change style of the uppermost button
function makeDropdown(flex, title, current, choices, fun, opt_dont_change_style) {
  var el = flex.div.textEl ? flex.div.textEl : flex.div;
  //flex.div.style.border = '1px solid #fff';
  flex.choice = current;
  el.innerText = title + ': ' + choices[flex.choice];

  var numchips = choices.length + 2; // 2 larger: for the title and the cancel button
  var x0 = 0.25;
  var x1 = 0.75;
  var h = numchips * 0.02;
  var y0 = 0.5 - h;
  var y1 = 0.5 + h;

  if(!opt_dont_change_style) flex.div.className = 'efDropDown';

  // added to root, rather than flex itself, because otherwise any mouse action or styling applied to flex, also occurs on those choices, while that's not desired
  var choiceFlex = new Flex(topDialogFlex, x0, y0, x1, y1);

  choiceFlex.div.style.zIndex = '1000';
  choiceFlex.div.className = 'efDropDown';
  var showing = true;
  choiceFlex.showFun = function(show) {
    if(show == showing) return;
    if(show && dropdownEl == choiceFlex) return;
    if(dropdownEl && dropdownEl != choiceFlex) {
      dropdownEl.showFun(false);
    }
    showing = show;
    choiceFlex.div.style.display = showing ? 'block' : 'none';
    if(show) {
      dropdownEl = choiceFlex;
    } else {
      dropdownEl = undefined;
    }
    if(showing) choiceFlex.update(gameFlex);

    if(show && !dropdownOverlayEl) dropdownOverlayEl = createOverlay((dialog_level + 1) * 10);
    if(!show && dropdownOverlayEl) {
      util.removeElement(dropdownOverlayEl);
      dropdownOverlayEl = undefined;
    }
  };
  choiceFlex.showFun(false);

  var titleEl = new Flex(choiceFlex, 0, 0, 1, 1 / numchips);
  centerText2(titleEl.div);
  titleEl.div.textEl.innerText = title + ':';

  for(var i = 0; i <= choices.length; i++) {
    var iscancel = (i == choices.length);
    var choice = new Flex(choiceFlex, 0.01, (i + 1.01) / numchips, 0.99, (i + 1.99) / numchips);
    styleButton0(choice.div);
    centerText2(choice.div);
    choice.div.textEl.innerText = iscancel ? 'cancel' : choices[i];
    choice.div.className = 'efDropDown';

    if(iscancel) {
      addButtonAction(choice.div, bind(function(i) {
        choiceFlex.showFun(false);
      }, i));
    } else {
      addButtonAction(choice.div, bind(function(i) {
        flex.choice = i;
        flex.div.textEl.innerText = title + ': ' + choices[i];
        setAriaLabel(flex.div, title + ': ' + choices[i] + ' - dropdown')
        if(fun) fun(i);
        choiceFlex.showFun(false);
      }, i));
    }
  }

  addButtonAction(flex.div, function() {
    choiceFlex.showFun(!showing);
  }, title + ': ' + choices[current] + ' - dropdown');
}

////////////////////////////////////////////////////////////////////////////////

// for single line of text
function makeTextInput(title, description, fun, opt_value) {
  var dialog = createDialog({
    size:DIALOG_TINY,
    functions:function() {
      fun(area.value);
    },
    title:title
  });

  if(description) {
    var descriptionFlex = new Flex(dialog.content, 0.1, 0.2, 0.9, 0.3);
    descriptionFlex.div.innerText = description;
  }

  var inputFlex = new Flex(dialog.content, 0.1, 0.4, 0.9, 0.6);
  var area = util.makeAbsElement('textarea', '0', '0', '100%', '100%', inputFlex.div);

  area.onkeydown = function(e) {
    if((e.keyCode == 13 || e.code == 'Enter') && !e.shiftKey) {
      e.preventDefault();
      fun(area.value);
      dialog.closeFun();
    }
  };

  if(opt_value) {
    area.value = opt_value;
    area.select();
  }
  area.style.fontSize = '100%';
  area.focus();
}


// yesfun is called on pressing yes, never called when pressing no (give an opt_nofun to get called on no or closing the dialog)
function makeYesNoQuestion(title, description, yesfun, opt_nofun) {
  var dialog = createDialog({
    size:DIALOG_TINY,
    functions:function() {
      yesfun();
    },
    names:'yes',
    title:title,
    cancelname:'no',
    oncancel:opt_nofun,
    allbold:true
  });

  if(description) {
    var descriptionFlex = new Flex(dialog.content, 0.1, 0.2, 0.9, 0.3);
    descriptionFlex.div.innerText = description;
  }
}

////////////////////////////////////////////////////////////////////////////////



// creates an arrow on top of the div of the given flex. The arrow points from x0, y0 to x1, y1 (in relative coordinates in the flex) and is click-throughable
function makeArrow(div, x0, y0, x1, y1) {
  var cw0 = div.clientWidth;
  var ch0 = div.clientHeight;

  var px0 = x0 * cw0;
  var py0 = y0 * ch0;
  var px1 = x1 * cw0;
  var py1 = y1 * ch0;

  var dx = px1 - px0;
  var dy = py1 - py0;
  var length = Math.sqrt(dx * dx + dy * dy);
  var angle = Math.atan2(dy, dx);

  var thickness = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) * 0.025;
  var headLength = length * 0.3;
  var headAngle = Math.PI * 0.16;


  // arrow shape:
  //           3\
  // 0-----------1
  //           2/

  var px2 = px1 - headLength * Math.cos(angle - headAngle);
  var py2 = py1 - headLength * Math.sin(angle - headAngle);
  var px3 = px1 - headLength * Math.cos(angle + headAngle);
  var py3 = py1 - headLength * Math.sin(angle + headAngle);

  var x2 = px2 / cw0;
  var y2 = py2 / ch0;
  var x3 = px3 / cw0;
  var y3 = py3 / ch0;

  // size of HTML element to create that will contain the arrow, big enough to fit the entire arrow, but not too much bigger to not require higher than necessary canvas pixel resolution
  var cx0 = Math.min(x0, x1, x2, x3) - thickness * 2;
  var cy0 = Math.min(y0, y1, y2, y3) - thickness * 2;
  var cx1 = Math.max(x0, x1, x2, x3) + thickness * 2;
  var cy1 = Math.max(y0, y1, y2, y3) + thickness * 2;

  var cw = cx1 - cx0;
  var ch = cy1 - cy0;

  var res = 256;

  var canvas = createCanvas((cx0 * 100) + '%', (cy0 * 100) + '%', ((cx1 - cx0) * 100) + '%', ((cy1 - cy0) * 100) + '%', div);
  var cw2 = canvas.clientWidth;
  var ch2 = canvas.clientHeight;

  var w, h;
  if(cw2 > ch2) {
    w = res;
    h = Math.floor(w * ch2 / cw2);
  } else {
    h = res;
    w = Math.floor(h * cw2 / ch2);
  }

  canvas.width = w;
  canvas.height = h;
  canvas.style.pointerEvents = 'none'; // make it possible to click through the arrow
  var ctx = canvas.getContext("2d");
  // since the arrows aren't pixel art but use fine pixels, override their pixelated style with the standard smoothened style that browsers use by default
  canvas.className = 'nonpixelated';

  var px0 = (x0 - cx0) / cw * w;
  var py0 = (y0 - cy0) / ch * h;
  var px1 = (x1 - cx0) / cw * w;
  var py1 = (y1 - cy0) / ch * h;
  var px2 = (x2 - cx0) / cw * w;
  var py2 = (y2 - cy0) / ch * h;
  var px3 = (x3 - cx0) / cw * w;
  var py3 = (y3 - cy0) / ch * h;

  var thickness2 = thickness * Math.sqrt(w * w / (cw * cw) + h * h / (ch * ch));

  ctx.lineWidth = thickness2;
  ctx.strokeStyle = '#f00';
  ctx.beginPath();
  ctx.moveTo(px0, py0);
  ctx.lineTo(px1, py1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px2, py2);
  ctx.lineTo(px1, py1);
  ctx.lineTo(px3, py3);
  ctx.stroke();

  //canvas.style.border = '1px solid red';

  return canvas;
}

function getElementCommonAncestor(div0, div1) {
  var parents0 = [];
  var parent0 = div0;
  while(parent0) {
    parents0.push(parent0);
    parent0 = parent0.parentElement;
  }
  var parents1 = [];
  var parent1 = div1;
  while(parent1) {
    parents1.push(parent1);
    parent1 = parent1.parentElement;
  }
  var result = null;
  for(;;) {
    if(parents0.length == 0 || parents1.length == 0) return result;
    var p0 = parents0.pop();
    var p1 = parents1.pop();
    if(p0 != p1) return result;
    result = p0;
  }
}

function getTotalZIndex(el, stop_at_parent) {
  var result = 0;
  while(el) {
    var zIndex = 0;
    if(el.style.zIndex != '') zIndex = parseInt(el.style.zIndex);
    if(!zIndex) zIndex = 0;
    result = Math.max(result, zIndex);
    //if(el == stop_at_parent) break;
    el = el.parentElement;
  }
  return result;
}

function makeArrow2_(div0, x0, y0, div1, x1, y1, opt_other_div_for_zindex) {
  var common = getElementCommonAncestor(div0, div1);
  if(common && opt_other_div_for_zindex) {
    common = getElementCommonAncestor(common, opt_other_div_for_zindex);
  }
  if(!common) return;

  var rect0 = div0.getBoundingClientRect();
  var rect1 = div1.getBoundingClientRect();
  var rectp = common.getBoundingClientRect();

  // convert from relative positions in div0 or div1 to absolute position on the screen
  x0 = rect0.x + x0 * rect0.width;
  y0 = rect0.y + y0 * rect0.height;
  x1 = rect1.x + x1 * rect1.width;
  y1 = rect1.y + y1 * rect1.height;

  // convert to relative position within the common ancestor element
  x0 = (x0 - rectp.x) / rectp.width;
  y0 = (y0 - rectp.y) / rectp.height;
  x1 = (x1 - rectp.x) / rectp.width;
  y1 = (y1 - rectp.y) / rectp.height;

  var result = makeArrow(common, x0, y0, x1, y1);

  var zIndex0 = getTotalZIndex(div0, common);
  var zIndex1 = getTotalZIndex(div1, common);
  var zIndex = Math.max(zIndex0, zIndex1);
  if(opt_other_div_for_zindex) {
    var zIndex2 = getTotalZIndex(opt_other_div_for_zindex, common);
    zIndex = Math.max(zIndex, zIndex2);
  }
  zIndex++;
  result.style.zIndex = zIndex;

  return result;
}

var arrows = [];

// make arrow between two divs (at the relative coordinates in them), and add event listener that rescales it if the window resizes
// to remove the arrow, the "remove" function of the returned object must be used, or call removeAllArrows
// opt_other_div_for_zindex: if given, ensures a common ancestor of this and div0 and div1 is used, to avoid clipping by other elements if e.g. div0 and div1 are the same
function makeArrow2(div0, x0, y0, div1, x1, y1, opt_other_div_for_zindex) {
  var arrow = makeArrow2_(div0, x0, y0, div1, x1, y1, opt_other_div_for_zindex);

  var result = {};

  var updateFun = function() {
    util.removeElement(arrow);
    arrow = makeArrow2_(div0, x0, y0, div1, x1, y1, opt_other_div_for_zindex);
    result.arrow = arrow;
  };

  window.addEventListener('resize', updateFun);

  result.arrow = arrow;
  result.updateFun = updateFun;
  result.remove = function() {
    util.removeElement(arrow);
    window.removeEventListener('resize', updateFun);
    result.arrow = undefined;
    result.remove = function(){};

    for(var i = 0; i < arrows.length; i++) {
      var j = arrows.length - i - 1;
      if(arrows[j] == result) {
        arrows.splice(j, 1);
        break;
      }
    }
  };

  arrows.push(result);
  return result;
}

function removeAllArrows() {
  while(arrows.length > 0) {
    arrows[arrows.length - 1].remove();
  }
}

////////////////////////////////////////////////////////////////////////////////


var audioContext;
var audioContextSource;

function ensureAudioContext() {
  var supportsAudio = !!(window.AudioContext || window.webkitAudioContext);
  if(!supportsAudio) return false;
  if(!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if(!audioContext) return false;
  audioContextSource = audioContext.createBufferSource();
  if(!audioContextSource) return false;
  audioContextSource.connect(audioContext.destination);
  return true;
}

function createNotificationSound(f) {
  if(!ensureAudioContext()) return undefined;

  var s = audioContext.sampleRate;

  var buffer = audioContext.createBuffer(2, s * 0.75, s);

  for(var channel = 0; channel < buffer.numberOfChannels; channel++) {
    var array = buffer.getChannelData(channel);
    for(var i = 0; i < buffer.length; i++) {
      var t = i / s;
      var p = (i + 1) / buffer.length;
      array[i] = Math.sin(t * Math.PI * 2 * f) * (1 - p) * (1 - p) * 0.25;
    }
  }

  return buffer;
}


function playSound(buffer) {
  if(!ensureAudioContext()) return;
  audioContextSource.buffer = buffer;
  audioContextSource.start();
}

var notificationSound = [];

function playNotificationSound(f) {
  if(!notificationSound[f]) notificationSound[f] = createNotificationSound(f);
  if(!notificationSound[f]) return;
  playSound(notificationSound[f]);
}

function sanitizeName(name) {
  if(!name) return '';
  name = name.substr(0, 25);
  name = name.replace(/\s/g, ' ');
  name = name.replace(/</g, '');
  name = name.replace(/>/g, '');
  name = name.replace(/&/g, '');
  return name;
}

// makes a checkbox using the given flex
// fun will be called with true or false depending on the checkbox state
// state is the initial state, true or false
function makeCheckbox(flex, state, title, fun, opt_description) {
  var flex0 = new Flex(flex, 0, 0, [0, 1], 1);
  var flex1 = new Flex(flex, [0, 1.2], 0, 1, 1);
  var canvas = createCanvas('0%', '0%', '100%', '100%', flex0.div);
  var update = function() {
    renderImage(state ? image_checkbox_on : image_checkbox_off, canvas);
    var desc = opt_description || title;
    setAriaLabel(flex0.div, desc + (state ? (' (checked)') : (' (unchecked)')));
  };
  styleButton0(flex0.div);
  centerText(flex1.div, undefined, true);
  flex1.div.textEl.innerText = title;
  var clickfun = function() {
    state = !state;
    update();
    fun(state);
  };
  addButtonAction(flex0.div, clickfun);
  flex1.div.onclick = clickfun;
  update();
}
