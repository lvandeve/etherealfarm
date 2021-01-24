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


var fieldFlex;
var upgradeFlex;
var fruitFlex;
var medalDiv;
var field2Flex;
var upgrade2Flex;


var mainw;
var mainh;

var topFlex;
var infoFlex;
var tabFlex;
var contentFlex;
var logFlex;

var medalFlex;

var mainFlex = null;

window.onresize = function() {
  if(mainFlex) mainFlex.update();
}

function makeMainDivs() {
  var showdebugborders = false;

  var has_top_notice = !!document.getElementById('topnotice');

  if(mainFlex) mainFlex.removeSelf();
  mainFlex = new Flex(null, [0, 0.01, 0.75], has_top_notice ? 0.03 : 0.01, [0, 0.99, 0.75], 0.99);
  if(showdebugborders) mainFlex.div.style.border = '2px solid green';

  topFlex = new Flex(mainFlex, 0, 0, 1, 0.05);
  if(showdebugborders) topFlex.div.style.border = '2px solid red';

  infoFlex = new Flex(mainFlex, 0, 0.05, 1, 0.18, 0.25);
  if(showdebugborders) infoFlex.div.style.border = '2px solid blue';

  tabFlex = new Flex(mainFlex, 0, 0.18, 1, 0.28, 0.25);
  if(showdebugborders) tabFlex.div.style.border = '2px solid green';

  //contentDiv = makeDiv(0, 0, 0, 0, document.body);
  contentFlex = new Flex(mainFlex, 0, 0.285, 1, 0.79);
  if(showdebugborders) contentFlex.div.style.border = '2px solid orange';

  logFlex = new Flex(mainFlex, 0, 0.8, 1, 1, 0.25);
  if(showdebugborders) logFlex.div.style.border = '2px solid gray';

  mainFlex.update();
}


var numhelpdialogs = 0;
var helpDialogQueue = [];

// the "never show again" is stored in savegame, which means if you use undo or import another save, it may come back
// to avoid annoyance in those cases, also store the "never show again" of dialogs temporarily during this session (lost on browser refresh)
var helpNeverAgainLocal = {};

// id = unique id for seen/disable setting of this particular help message. must be > 0. Alternatively, id can be made < 0, then it only prints it as showMessage, this feature simply exists to allow easily changing the source code to use a full on dialog, or just showMessage, for particular help text
// highest used id: 22
// opt_text2 is shown only in the dialog and not in the "showMessage" in console
// opt_recursive is used internally only, when recursively calling showHelpDialog again when there were multiple. It prevents showMessage since showMessage will already have been done.
function showHelpDialog(id, text, image, opt_text2, images, opt_recursive) {
  if(!opt_recursive) showMessage(text, helpFG, helpBG);
  state.help_seen_text[Math.abs(id)] = true;

  if(id < 0) return; // showMessage-only



  if(state.help_disable[id]) return;
  if(helpNeverAgainLocal[id]) {
    state.help_disable[id] = id;
    return;
  }
  if(state.disableHelp) return;

  if(numhelpdialogs) {
    helpDialogQueue.push(arguments);
    return;
  }

  if(opt_text2) text += opt_text2;

  var seen = state.help_seen[id];
  state.help_seen[id] = id;

  var okfun = function() {
    state.help_disable[id] = id;
    helpNeverAgainLocal[id] = id;
    dialog.cancelFun();
  };
  var oktext = 'never show again';

  numhelpdialogs++;
  var dialog = createDialog(images ? DIALOG_LARGE : DIALOG_MEDIUM, okfun, oktext, 'ok', undefined, undefined, false, function() {
    numhelpdialogs--;
    if(helpDialogQueue.length) {
      var args = Array.prototype.slice.call(helpDialogQueue[0], 0);
      args[5] = true;
      helpDialogQueue.shift();
      showHelpDialog.apply(this, args);
    }
  });
  dialog.div.style.backgroundColor = '#bbbe';
  var fx0 = 0.01;
  var fy0 = 0.01;
  var fx1 = 0.99;
  var fy1 = 0.8;

  if(image) {
    var canvasflex = new Flex(dialog, 0.01, 0.01, 0.1, 0.1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasflex.div);
    renderImage(image, canvas);
    fx0 = 0.11;
  }

  if(images) {
    var w = images[0].length;
    var h = images.length;
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        if(!images[y][x]) continue; // ok to have gaps
        var x0 = -0.2 + 0.4 * x / w;
        var y0 = -0.2 + 0.4 * y / h;
        var x1 = -0.2 + 0.4 * (x + 1) / w;
        var y1 = -0.2 + 0.4 * (y + 1) / h;
        var canvasflex = new Flex(dialog, [0.25, x0], [0.7, y0], [0.25, x1], [0.7, y1]);
        var canvas = createCanvas('0%', '0%', '100%', '100%', canvasflex.div);
        renderImage(images[y][x], canvas);
      }
    }
    fy1 = 0.65;
  }

  var flex = new Flex(dialog, fx0, fy0, fx1, fy1, 0.32);

  flex.div.innerHTML = text;
}




// UI that persists even through loading of savegame, hard resets, etc...
function initUIGlobal() {
  makeMainDivs();
  initMessageUI();
  initSettingsUI();
}



var tabindex_field;
var tabindex_upgrades;
var tabindex_fruit;
var tabindex_medals;
var tabindex_field2;
var tabindex_upgrades2;
var tabindex_tree;

// init the UI after a reset, save load, .... Keeps log messages
// assume state is already correctly initialized
function initUI() {
  //topDiv.innerHTML = '';
  //tabDiv.innerHTML = '';
  //contentDiv.innerHTML = '';
  //logDiv.innerHTML = '';

  contentFlex.clear();
  tabFlex.clear();

  //setMainDivSizes();

  tabbuttons = [];
  tabs = [];

  // this determines the unique id of each tab but not the display order
  var tabnum = 0;
  tabindex_field = tabnum++;
  tabindex_upgrades = tabnum++;
  tabindex_fruit = tabnum++;
  tabindex_field2 = tabnum++;
  tabindex_upgrades2 = tabnum++;
  tabindex_medals = tabnum++;

  for(var i = 0; i < tabnum; i++) tabs[i] = new Flex(contentFlex, 0, 0, 1, 1);

  fieldFlex = tabs[tabindex_field];
  fieldFlex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
  upgradeFlex = tabs[tabindex_upgrades];
  fruitFlex = tabs[tabindex_fruit];
  medalFlex = tabs[tabindex_medals];
  field2Flex = tabs[tabindex_field2];
  field2Flex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
  upgrade2Flex = tabs[tabindex_upgrades2];

  updateTabButtons();

  initFieldUI();
  initInfoUI();
  initField2UI();

  updateUI();
  if(state) setTab(state.currentTab);
  else setTab(0, true);
}



// some parts of the UI are updated more often than just in initUI, their functions, even for initial creation, are called 'update' instead of 'init'
function updateUI() {
  updateUpgradeUI();
  //updateMedalUI();
  //updateResourceUI();
  updateTabButtons();
  updateUpgrade2UI();
}

//document.body.style.fontFamily = 'Verdana, Arial, Helvetica, sans-serif';

var oldfont = false;

if(oldfont) {
  document.body.style.fontFamily = 'Verdana, sans-serif';
  //document.body.style.fontSize = '0.9em';
} else {
  document.body.style.fontFamily = 'Arial, sans-serif';
  //document.body.style.fontSize = '1em';
}

document.body.style.backgroundColor = '#def';
