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
var medalDiv;
var field2Flex;
var upgrade2Flex;


var upgradesButtonLastText = '';
var upgrades2ButtonLastText = '';
var medalsButtonLastText = '';


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

  if(mainFlex) mainFlex.removeSelf();
  mainFlex = new Flex(null, [0, 0.01, 0.75], 0.01, [0, 0.99, 0.75], 0.99);
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



// UI that persists even through loading of savegame, hard resets, etc...
function initUIGlobal() {
  makeMainDivs();
  initMessageUI();
}


// init the UI after a reset, save load, .... Keeps log messages
function initUI(state) {
  //topDiv.innerHTML = '';
  //tabDiv.innerHTML = '';
  //contentDiv.innerHTML = '';
  //logDiv.innerHTML = '';

  contentFlex.clear();
  tabFlex.clear();

  //setMainDivSizes();

  tabbuttons = [];
  tabs = [];

  tabs[0] = new Flex(contentFlex, 0, 0, 1, 1);
  tabs[1] = new Flex(contentFlex, 0, 0, 1, 1);
  tabs[2] = new Flex(contentFlex, 0, 0, 1, 1);
  tabs[3] = new Flex(contentFlex, 0, 0, 1, 1);
  tabs[4] = new Flex(contentFlex, 0, 0, 1, 1);

  updateTabButtons();

  fieldFlex = tabs[0];
  fieldFlex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
  upgradeFlex = tabs[1];
  medalFlex = tabs[2];
  field2Flex = tabs[3];
  field2Flex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
  upgrade2Flex = tabs[4];

  initSettingsUI();
  initFieldUI();
  initInfoUI();
  initField2UI();

  updateUI();
  setTab(0);
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
