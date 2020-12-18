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



var tabbuttons;
var tabs;

var currentTab = -1;

function setTab(i) {
  //if(!tabbuttons[i]) return; // trying to set a tab that is not supposed to be visible

  currentTab = i;

  for(var j = 0; j < tabs.length; j++) {
    tabs[j].div.style.visibility = (i == j) ? 'visible' : 'hidden';
  }
  for(var j = 0; j < tabbuttons.length; j++) {
    if(!tabbuttons[j]) continue;
    highlightButton(tabbuttons[j], i == j ? 1 : 2);
  }

  if(i == 1) updateUpgradeUI();
  if(i == 2) updateMedalUI();
  if(i == 4) updateUpgrade2UI();

  updateTabButtons();
}


// makes it indicate new upgrades/achievements/..., if there are
function updateTabButtons2() {
  if(currentTab == 1 && state.upgrades_new) {
    for(var i = 0; i < registered_upgrades.length; i++) {
      var u = state.upgrades[registered_upgrades[i]];
      if(u.unlocked && !u.seen) u.seen = true;
    }
    computeDerived(state);
  }

  if(currentTab == 2 && state.medals_new) {
    for(var i = 0; i < registered_medals.length; i++) {
      // commented out: medal tooltip does this now.
      //var m = state.medals[registered_medals[i]];
      //if(m.earned && !m.seen) m.seen = true;
    }
    computeDerived(state);
  }

  if(currentTab == 4 && state.upgrades2_new) {
    for(var i = 0; i < registered_upgrades2.length; i++) {
      var u = state.upgrades2[registered_upgrades2[i]];
      if(u.unlocked && !u.seen) u.seen = true;
    }
    computeDerived(state);
  }

  if(tabbuttons[1]) {
    var text = 'upgrades <br/>(' + state.upgrades_affordable + '/' + state.upgrades_upgradable + ')';
    if(state.upgrades_new) {
      text = '<b><font color="red">' + text + '</font></b>';
    }

    if(text != upgradesButtonLastText) {
      tabbuttons[1].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[1].textEl.innerHTML  = text;
      upgradesButtonLastText = text;
    }
  }

  if(tabbuttons[2]) {
    var text = 'achievements <br/>(' + state.medals_earned + ')';

    if(state.medals_new) {
      text = '<b><font color="red">' + text + '</font></b>';
    }

    if(text != medalsButtonLastText) {
      tabbuttons[2].textEl.innerHTML = text;
      medalsButtonLastText = text;
      tabbuttons[2].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
    }
  }

  if(tabbuttons[4]) {
    var text = 'ethereal upgrades <br/>(' + state.upgrades2_affordable + '/' + state.upgrades2_upgradable + ')';
    if(state.upgrades2_new) {
      text = '<b><font color="red">' + text + '</font></b>';
    }

    if(text != upgrades2ButtonLastText) {
      tabbuttons[4].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[4].textEl.innerHTML  = text;
      upgrades2ButtonLastText = text;
    }
  }
}

// Note: it depends on the state which buttons will be visible
// also creates them if they didn't exist yet, or re-creates if positions change
// TODO: avoid recreating the HTML elements if the ones that will be created are the exact same set as before
function updateTabButtons() {

  var wanted = [];
  wanted[0] = true;
  wanted[1] = state.upgrades_unlocked > 0;
  wanted[2] = state.medals_earned > 0;
  wanted[3] = state.g_numresets > 0;
  wanted[4] = state.g_numresets > 0;

  var num = 0;
  for(var i = 0; i < wanted.length; i++) {
    if(wanted[i]) num++;
  }

  if(num == 1) {
    // if there's only one, then hide the tabs completely
    for(var i = 0; i < wanted.length; i++) {
      if(wanted[i]) wanted[i] = false;
    }
  }

  var ok = true;
  for(var i = 0; i < wanted.length; i++) {
    if(wanted[i] != (!!tabbuttons[i])) {
      ok = false;
      break;
    }
  }

  if(ok) {
    updateTabButtons2();
    return; // buttons already exactly as intended, do not recreate all these HTML elements
  }

  tabbuttons = [];
  tabFlex.div.innerHTML = '';
  var pos;
  pos = [0, 0];

  var index = 0;

  var tabDiv = tabFlex.div;

  if(wanted[0]) {
    tabbuttons[0] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[0]);
    tabbuttons[0].onclick = function() { setTab(0); };
    tabbuttons[0].textEl.innerText = 'field';
    index++;
  }

  if(wanted[1]) {
    tabbuttons[1] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[1]);
    tabbuttons[1].onclick = function() { setTab(1); };
    tabbuttons[1].textEl.innerText = 'upgrades';
    upgradesButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    index++;
  }

  if(wanted[2]) {
    tabbuttons[2] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[2]);
    tabbuttons[2].onclick = function() { setTab(2); };
    tabbuttons[2].textEl.innerText = 'achievements';
    medalsButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    index++;
  }

  if(wanted[3]) {
    tabbuttons[3] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[3]);
    tabbuttons[3].onclick = function() { setTab(3); };
    tabbuttons[3].textEl.innerText = 'ethereal field';
    index++;
  }

  if(wanted[4]) {
    tabbuttons[4] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[4]);
    tabbuttons[4].onclick = function() { setTab(4); };
    tabbuttons[4].textEl.innerText = 'ethereal upgrades';
    upgrades2ButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    index++;
  }

  updateTabButtons2();

  // this is to give the buttons the correct style
  setTab(currentTab);
}





