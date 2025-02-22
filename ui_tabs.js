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



var tabbuttons;
var tabs;
var numtabs = 0;


var upgradesButtonLastText = '';
var fruitButtonLastText = '';
var upgrades2ButtonLastText = '';
var medalsButtonLastText = '';
var fieldButtonLastText = '';
var field2ButtonLastText = '';
var field3ButtonLastText = '';
var automatonButtonLastText = '';
var squirrelButtonLastText = '';
var amberButtonLastText = '';

var tabNumbers = [];
var tabNumbersInv = [];

var squirrel_red = false;

// set tab according to its visible numeric order, rather than the internal code
function setTabNumber(i) {
  if(tabNumbers[i] == undefined) return;
  setTab(tabNumbers[i]);
}

// opposite of setTabNumber
function getTabNumber() {
  if(tabNumbersInv[state.currentTab] == undefined) return 0;
  return tabNumbersInv[state.currentTab];
}

function setTab(i, opt_temp) {
  //if(!tabbuttons[i]) return; // trying to set a tab that is not supposed to be visible

  var oldtab = state.currentTab;

  var markmedalsseen = state.currentTab == tabindex_medals && state.currentTab != i && state.medals_new;

  if(!opt_temp) state.currentTab = i;

  busyChoosingTargetSlot = undefined; // changing any tab stops this if this was active

  for(var j = 0; j < tabs.length; j++) {
    tabs[j].div.style.visibility = (i == j) ? 'visible' : 'hidden';
  }
  for(var j = 0; j < tabbuttons.length; j++) {
    if(!tabbuttons[j]) continue;
    highlightButton(tabbuttons[j], i == j);
  }

  if(i == tabindex_upgrades) {
    updateUpgradeUI();
  }
  if(i == tabindex_fruit) {
    state.fruit_seen = true;
    lastTouchedFruit = null;
    updateFruitUI();
  }
  if(i == tabindex_automaton) {
    updateAutomatonUI();
  }
  if(i == tabindex_medals) {
    updateMedalUI();
    removeMedalChip();
  }
  if(i == tabindex_upgrades2) {
    updateUpgrade2UI();
  }
  if(i == tabindex_amber) {
    updateAmberUI();
  }
  if(i == tabindex_squirrel) {
    updateSquirrelUI();
  }
  if(oldtab == tabindex_squirrel) {
    if(state.allsquirrelupgradebought2) state.seen_evolution = true;
    if(squirrel_scrollflex) squirrel_scrollpos = squirrel_scrollflex.div.scrollTop;
  }

  removeAllDropdownElements();

  updateTabButtons();
  showGoalChips(); // some goal chips or help arrows depend on tab
  updateAbilitiesUI(); // when switching between infinity field and basic field, brassica icon at the top should update, make sure it goes immediately and not after 0.3 seconds with next game update: 0.3 seconds makes it feel sluggish

  if(markmedalsseen) {
    // when leaving the achievements tab and there are unseen medals, mark them all as seen now, to not let the player hunt for which
    // medals to mouseover to remove the red indication
    for(var j = 0; j < registered_medals.length; j++) {
      var m2 = state.medals[registered_medals[j]];
      if(m2.earned) m2.seen = true;
    }
  }
}


// makes it indicate new upgrades/achievements/..., if there are
function updateTabButtons2() {
  if(state.currentTab == tabindex_upgrades && state.upgrades_new) {
    for(var i = 0; i < registered_upgrades.length; i++) {
      var u = state.upgrades[registered_upgrades[i]];
      if(u.unlocked && !u.seen) u.seen = true;
    }
    computeDerived(state);
  }

  if(state.currentTab == tabindex_medals && state.medals_new) {
    for(var i = 0; i < registered_medals.length; i++) {
      // commented out: medal tooltip does this now.
      //var m = state.medals[registered_medals[i]];
      //if(m.earned && !m.seen) m.seen = true;
    }
    computeDerived(state);
  }

  if(state.currentTab == tabindex_upgrades2 && state.upgrades2_new) {
    for(var i = 0; i < registered_upgrades2.length; i++) {
      var u = state.upgrades2[registered_upgrades2[i]];
      if(u.unlocked && !u.seen) u.seen = true;
    }
    computeDerived(state);
  }

  var tabnum;

  tabnum = tabindex_field;
  if(tabbuttons[tabnum]) {
    var text = 'field';

    if(state.treelevel > 0) {
      text += '<br/>(' + state.treelevel + ')';
    }
    if(state.fern /*&& state.currentTab != tabindex_field*/) {
      text = '<b><font color="#2d0">' + text + '</font></b>';
    }

    if(text != fieldButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      fieldButtonLastText = text;
    }
  }

  tabnum = tabindex_upgrades;
  if(tabbuttons[tabnum]) {
    var text = 'upgrades<br/>(' + state.upgrades_affordable + '/' + state.upgrades_upgradable + ')';
    if(state.upgrades_new_b) {
      text = '<b><font color="red">' + text + '</font></b>';
    }
    if(state.neverhadupgradeunlocked && autoUnlockUnlocked()) {
      // there's a crop unlock, but never had it before so automaton won't do the upgrade, you must do it manually, give upgrades tab a special color to remind of this
      text = '<b><font color="#f60">' + text + '</font></b>';
    }

    if(text != upgradesButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      upgradesButtonLastText = text;
    }
  }

  tabnum = tabindex_fruit;
  if(tabbuttons[tabnum]) {
    var a = getActiveFruit();
    var num = '' + (state.fruit_stored.length + state.fruit_sacr.length);
    var special = getFruitCategory(a);
    if(a) {
      if(a.name) {
        num = a.name;
        // more than 12 characters is too big to render
        if(num.length > 12) {
          // to increase probability of splitting in a good way, try to find a space within the last few characters
          var space = num.lastIndexOf(' ', 12);
          if(!(space >= 9 && space <= 12)) space = 12;
          num = num.substr(0, space) + '…';
        }
      }
    }
    if(!a && state.fruit_stored.length) {
      num = 'none';
    }
    var text;

    if(basicChallenge() == 2) {
      text = 'fruit<br/>(disabled)';
    } else {
      text = 'fruit<br/>(' + num + ')';

      if(special) {
        var lowest = 7; // lowest category of other fruit you have
        var tier = a ? a.tier : 0;
        for(var i = 0; i < state.fruit_stored.length; i++) {
          var f = state.fruit_stored[i];
          if(!f) continue;
          if(f == a) continue;
          if(f.tier < tier - 1) continue;
          var special2 = getFruitCategory(f);
          if(special2 < lowest) lowest = special2;
        }
        if(special < 7 && special < lowest) special = 0; // don't indicate you don't have a production fruit active, when you don't have a production fruit in the first place
        if(special == 7 && (state.fruit_stored.length + state.fruit_sacr.length == 0)) special = 0;
      }

      var color = undefined;
      var bold = false;
      var darkstyle = state.uistyle == 2 || state.uistyle == 3;
      if(!state.fruit_seen || special == 7) {
        color = 'red';
        bold = true;
      } else if(special >= 5) {
        // grow or weather: green
        color = darkstyle ? '#cec' : '#050';
      } else if(special >= 4) {
        // mushroom eff: blue
        color = darkstyle ? '#ccf' : '#00b';
      } else if(special >= 2) {
        // resin/twigs/nuts: brown/orange
        color = darkstyle ? '#ecb' : '#630';
      } else if(special >= 1) {
        if(special == 1 && state.croptypecount[CROPTYPE_BRASSICA] == 0) {
          // watercress fruit but no watercress planted: red-ish
          color = darkstyle ? '#fbb' : '#700';
        }
      }
      if(color) {
        text = '<font color="' + color + '">' + text + '</font>';
      }
      if(bold) {
        text = '<b>' + text + '</b>';
      }
    }

    if(text != fruitButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      fruitButtonLastText = text;
    }
  }

  tabnum = tabindex_field2;
  if(tabbuttons[tabnum]) {
    var text = 'ethereal field';

    var color = undefined;

    if(state.treelevel2 > 0) {
      var twigs_req = treeLevel2Req(state.treelevel2 + 1);
      var nextlevelprogress = state.res.twigs.div(twigs_req.twigs);
      text += '<br/>' + state.treelevel2 + ' (' + nextlevelprogress.toPercentString(2) + ')';
    } else if(state.treelevel2 > 0) {
      text += '<br/>(' + state.treelevel2 + ')';
    }

    if(haveEtherealMistletoe() && state.mistletoeupgrade < 0) {
      // ethereal mistletoe upgrade available
      color = '#0f0';
    }
    if(haveEtherealMistletoeAnywhere() && !state.etherealmistletoetreepositionok) {
      // ethereal mistletoe not placed next to tree
      color = '#fa0';
    }
    if(color) {
      text = '<font color="' + color + '">' + text + '</font>';
    }

    if(text != field2ButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      field2ButtonLastText = text;
    }
  }

  tabnum = tabindex_upgrades2;
  if(tabbuttons[tabnum]) {
    var text = (numtabs > 9) ? 'eth. upgrades' : 'ethereal upgrades';
    text += '<br/>(' + state.upgrades2_affordable + '/' + state.upgrades2_upgradable + ')';
    if(state.upgrades2_new) {
      text = '<b><font color="red">' + text + '</font></b>';
    }

    if(text != upgrades2ButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      upgrades2ButtonLastText = text;
    }
  }

  tabnum = tabindex_field3;
  if(tabbuttons[tabnum]) {
    var text = 'infinity field';
    if(state.numcropfields3 == 0) {
      text = '<b><font color="red">' + text + '</font></b>';
    } else if(state.infspawn) {
      text = '<b><font color="#2d0">' + text + '</font></b>';
    }

    if(text != field3ButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      field3ButtonLastText = text;
    }
  }

  tabnum = tabindex_automaton;
  if(tabbuttons[tabnum]) {
    var text = 'automaton';
    if(!haveAutomaton()) {
      text += '<br>(absent)';
      text = '<font color="#c00">' + text + '</font>';
    } else if(!automatonEnabled()) {
      if(basicChallenge() == 2) {
        text += '<br>(disabled)';
      } else {
        text += '<br>(off)';
      }
    }

    if(text != automatonButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      automatonButtonLastText = text;
    }
  }

  tabnum = tabindex_squirrel;
  if(tabbuttons[tabnum]) {
    var text = 'squirrel';
    if(!haveSquirrel()) {
      text += '<br>(absent)';
      text = '<font color="#c00">' + text + '</font>';
    } else if(!state.allsquirrelupgradebought && !(state.allsquirrelupgradebought2 && state.seen_evolution) && getNextSquirrelUpgradeCost().lte(state.res.nuts)) {
      text = '<b><font color="red">' + text + '</font></b>';
      if(!squirrel_red) updateSquirrelUI(); // some gray colored prices become black now, if the tab is currently open
      squirrel_red = true;
    } else {
      squirrel_red = false;
    }

    if(text != squirrelButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      squirrelButtonLastText = text;
    }
  }

  tabnum = tabindex_amber;
  if(tabbuttons[tabnum]) {
    var text = 'amber<br/>(' + state.res.amber.toString() + ')';

    if(text != amberButtonLastText) {
      tabbuttons[tabnum].textEl.innerHTML = text;
      amberButtonLastText = text;
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
    }
  }

  tabnum = tabindex_medals;
  if(tabbuttons[tabnum]) {
    var text = 'achievements<br/>(' + state.medals_earned + ')';

    if(state.medals_new && state.currentTab != tabindex_medals) {
      text = '<b><font color="red">' + text + '</font></b>';
    }

    if(text != medalsButtonLastText) {
      tabbuttons[tabnum].textEl.innerHTML = text;
      medalsButtonLastText = text;
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
    }
  }
}

// Note: it depends on the state which buttons will be visible
// also creates them if they didn't exist yet, or re-creates if positions change
// TODO: avoid recreating the HTML elements if the ones that will be created are the exact same set as before
function updateTabButtons() {
  var wanted = [];
  wanted[tabindex_field] = true;
  wanted[tabindex_upgrades] = state.upgrades_unlocked > 0;
  wanted[tabindex_fruit] = state.g_numfruits > 0;
  wanted[tabindex_field2] = state.g_numresets > 0;
  wanted[tabindex_upgrades2] = state.upgrades2_unlocked > 0;
  wanted[tabindex_field3] = haveInfinityField();
  wanted[tabindex_automaton] = automatonUnlocked();
  wanted[tabindex_medals] = state.medals_earned > 0;
  wanted[tabindex_squirrel] = squirrelUnlocked();
  wanted[tabindex_amber] = amberUnlocked();

  var num = 0;
  for(var i = 0; i < wanted.length; i++) {
    if(wanted[i]) num++;
  }
  numtabs = num;
  state.numTabs = numtabs;

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

  var tabnum;

  var split = false;
  if(num >= 6) split = true;
  var half0 = Math.floor(num / 2);
  if(num >= 7 && num <= 9) half0 = 4; // try to always get 4 buttons (field, upgrades, eth field, eth upgrades) at the top half, for muscle memory reasons
  var half1 = num - half0;

  // the order below determines the display order of the tabs

  tabNumbers = [];

  tabnum = tabindex_field;
  if(wanted[tabnum]) {
    var index2 = split ? ((index < half0) ? index : (index - half0)) : index;
    var num2 = split ? ((index < half0) ? half0 : half1) : num;
    var y0 = split ? ((index < half0) ? '0%' : '50%') : '0%';
    var y1 = split ? '50%' : '100%';
    tabbuttons[tabnum] = makeDiv((100 / num2 * index2) + '%', y0, (100 / num2) + '%', y1, tabFlex.div);
    styleButton(tabbuttons[tabnum], undefined, true);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: field tab', true);
    tabbuttons[tabnum].textEl.innerText = 'field';
    tabbuttons[tabnum].id = 'field_tab';
    fieldButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    tabNumbers[index] = tabnum;
    tabNumbersInv[tabnum] = index;
    index++;
  }

  tabnum = tabindex_upgrades;
  if(wanted[tabnum]) {
    var index2 = split ? ((index < half0) ? index : (index - half0)) : index;
    var num2 = split ? ((index < half0) ? half0 : half1) : num;
    var y0 = split ? ((index < half0) ? '0%' : '50%') : '0%';
    var y1 = split ? '50%' : '100%';
    tabbuttons[tabnum] = makeDiv((100 / num2 * index2) + '%', y0, (100 / num2) + '%', y1, tabFlex.div);
    styleButton(tabbuttons[tabnum], undefined, true);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: upgrades tab', true);
    tabbuttons[tabnum].textEl.innerText = 'upgrades';
    tabbuttons[tabnum].id = 'upgrades_tab';
    upgradesButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    tabNumbers[index] = tabnum;
    tabNumbersInv[tabnum] = index;
    index++;
  }

  tabnum = tabindex_field2;
  if(wanted[tabnum]) {
    var index2 = split ? ((index < half0) ? index : (index - half0)) : index;
    var num2 = split ? ((index < half0) ? half0 : half1) : num;
    var y0 = split ? ((index < half0) ? '0%' : '50%') : '0%';
    var y1 = split ? '50%' : '100%';
    tabbuttons[tabnum] = makeDiv((100 / num2 * index2) + '%', y0, (100 / num2) + '%', y1, tabFlex.div);
    styleButton(tabbuttons[tabnum], undefined, true);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: ethereal field tab', true);
    tabbuttons[tabnum].textEl.innerText = 'ethereal field';
    tabbuttons[tabnum].id = 'ethereal_field_tab';
    tabbuttons[tabnum].textEl.style.textShadow = '0px 0px 5px #ff8';
    field2ButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    tabNumbers[index] = tabnum;
    tabNumbersInv[tabnum] = index;
    index++;
  }

  tabnum = tabindex_upgrades2;
  if(wanted[tabnum]) {
    var index2 = split ? ((index < half0) ? index : (index - half0)) : index;
    var num2 = split ? ((index < half0) ? half0 : half1) : num;
    var y0 = split ? ((index < half0) ? '0%' : '50%') : '0%';
    var y1 = split ? '50%' : '100%';
    tabbuttons[tabnum] = makeDiv((100 / num2 * index2) + '%', y0, (100 / num2) + '%', y1, tabFlex.div);
    styleButton(tabbuttons[tabnum], undefined, true);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: ethereal upgrades tab', true);
    tabbuttons[tabnum].textEl.innerText = 'ethereal upgrades';
    tabbuttons[tabnum].id = 'ethereal_upgrades_tab';
    tabbuttons[tabnum].textEl.style.textShadow = '0px 0px 5px #ff8';
    upgrades2ButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    tabNumbers[index] = tabnum;
    tabNumbersInv[tabnum] = index;
    index++;
  }

  tabnum = tabindex_field3;
  if(wanted[tabnum]) {
    var index2 = split ? ((index < half0) ? index : (index - half0)) : index;
    var num2 = split ? ((index < half0) ? half0 : half1) : num;
    var y0 = split ? ((index < half0) ? '0%' : '50%') : '0%';
    var y1 = split ? '50%' : '100%';
    tabbuttons[tabnum] = makeDiv((100 / num2 * index2) + '%', y0, (100 / num2) + '%', y1, tabFlex.div);
    styleButton(tabbuttons[tabnum], undefined, true);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: infinity field tab', true);
    tabbuttons[tabnum].textEl.innerText = 'infinity field';
    tabbuttons[tabnum].id = 'infinity_field_tab';
    tabbuttons[tabnum].textEl.style.textShadow = '0px 0px 5px #88f';
    field3ButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    tabNumbers[index] = tabnum;
    tabNumbersInv[tabnum] = index;
    index++;
  }

  tabnum = tabindex_fruit;
  if(wanted[tabnum]) {
    var index2 = split ? ((index < half0) ? index : (index - half0)) : index;
    var num2 = split ? ((index < half0) ? half0 : half1) : num;
    var y0 = split ? ((index < half0) ? '0%' : '50%') : '0%';
    var y1 = split ? '50%' : '100%';
    tabbuttons[tabnum] = makeDiv((100 / num2 * index2) + '%', y0, (100 / num2) + '%', y1, tabFlex.div);
    styleButton(tabbuttons[tabnum], undefined, true);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: fruit tab', true);
    tabbuttons[tabnum].textEl.innerText = 'fruit';
    tabbuttons[tabnum].id = 'fruit_tab';
    fruitButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    tabNumbers[index] = tabnum;
    tabNumbersInv[tabnum] = index;
    index++;
  }

  tabnum = tabindex_automaton;
  if(wanted[tabnum]) {
    var index2 = split ? ((index < half0) ? index : (index - half0)) : index;
    var num2 = split ? ((index < half0) ? half0 : half1) : num;
    var y0 = split ? ((index < half0) ? '0%' : '50%') : '0%';
    var y1 = split ? '50%' : '100%';
    tabbuttons[tabnum] = makeDiv((100 / num2 * index2) + '%', y0, (100 / num2) + '%', y1, tabFlex.div);
    styleButton(tabbuttons[tabnum], undefined, true);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: automaton tab', true);
    tabbuttons[tabnum].textEl.innerText = 'automaton';
    tabbuttons[tabnum].id = 'automaton_tab';
    //tabbuttons[tabnum].textEl.style.textShadow = '0px 0px 5px #000';
    automatonButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    tabNumbers[index] = tabnum;
    tabNumbersInv[tabnum] = index;
    index++;
  }

  tabnum = tabindex_squirrel;
  if(wanted[tabnum]) {
    var index2 = split ? ((index < half0) ? index : (index - half0)) : index;
    var num2 = split ? ((index < half0) ? half0 : half1) : num;
    var y0 = split ? ((index < half0) ? '0%' : '50%') : '0%';
    var y1 = split ? '50%' : '100%';
    tabbuttons[tabnum] = makeDiv((100 / num2 * index2) + '%', y0, (100 / num2) + '%', y1, tabFlex.div);
    styleButton(tabbuttons[tabnum], undefined, true);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: squirrel tab', true);
    tabbuttons[tabnum].textEl.innerText = 'squirrel';
    tabbuttons[tabnum].id = 'squirrel_tab';
    //tabbuttons[tabnum].textEl.style.textShadow = '0px 0px 5px #000';
    squirrelButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    tabNumbers[index] = tabnum;
    tabNumbersInv[tabnum] = index;
    index++;
  }

  tabnum = tabindex_amber;
  if(wanted[tabnum]) {
    var index2 = split ? ((index < half0) ? index : (index - half0)) : index;
    var num2 = split ? ((index < half0) ? half0 : half1) : num;
    var y0 = split ? ((index < half0) ? '0%' : '50%') : '0%';
    var y1 = split ? '50%' : '100%';
    tabbuttons[tabnum] = makeDiv((100 / num2 * index2) + '%', y0, (100 / num2) + '%', y1, tabFlex.div);
    styleButton(tabbuttons[tabnum], undefined, true);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: amber tab', true);
    tabbuttons[tabnum].textEl.innerText = 'amber';
    tabbuttons[tabnum].id = 'amber_tab';
    //tabbuttons[tabnum].textEl.style.textShadow = '0px 0px 5px #000';
    amberButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    tabNumbers[index] = tabnum;
    tabNumbersInv[tabnum] = index;
    index++;
  }

  tabnum = tabindex_medals;
  if(wanted[tabnum]) {
    var index2 = split ? ((index < half0) ? index : (index - half0)) : index;
    var num2 = split ? ((index < half0) ? half0 : half1) : num;
    var y0 = split ? ((index < half0) ? '0%' : '50%') : '0%';
    var y1 = split ? '50%' : '100%';
    tabbuttons[tabnum] = makeDiv((100 / num2 * index2) + '%', y0, (100 / num2) + '%', y1, tabFlex.div);
    styleButton(tabbuttons[tabnum], undefined, true);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: achievements tab', true);
    tabbuttons[tabnum].id = 'achievements_tab';
    tabbuttons[tabnum].textEl.innerText = 'achievements';
    medalsButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    tabNumbers[index] = tabnum;
    tabNumbersInv[tabnum] = index;
    index++;
  }

  updateTabButtons2();

  // this is to give the buttons the correct style
  setTab(state.currentTab, true);
}



