/*
Ethereal Farm
Copyright (C) 2021  Lode Vandevenne

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



function updateAutomatonUI() {
  automatonFlex.clear();
  var choiceupgrades = [fern_choice0, active_choice0];

  var h = 0.15;
  var y = 0;

  var updateEnableButton = function(flex) {
    var div = flex.div.textEl;
    if(state.automaton_enabled) {
      div.innerText = 'Automation enabled';
      div.className = 'efAutomatonAuto';
    } else {
      div.innerText = 'Automation disabled';
      div.className = 'efAutomatonManual';
    }
  };

  var updateChoiceButton = function(flex, i) {
    var div = flex.div.textEl;
    var u = upgrades[choiceupgrades[i]];
    var s = state.automaton_choice[i];
    var text = upper(u.name) + ': ';
    var style = 'efAutomatonAuto';
    if(s == 2) {
      text += upper(u.choicename_a);
    } else if(s == 3) {
      text += upper(u.choicename_b);
    } else {
      text += 'Manual';
      style = 'efAutomatonManual';
    }
    div.innerText = text;
    div.className = style;
  };

  var h = 0.1;
  var y = 0;
  var flex;

  flex  = new Flex(automatonFlex, 0.01, [0, y + h/3], 1, [0, y + h], 0.5);
  flex.div.innerText = 'Toggle on or off all automation globally. If off, all other buttons below are ignored:';
  y += h * 1.1;


  flex = new Flex(automatonFlex, 0.01, [0, y], 0.33, [0, y + h], 0.66);
  y += h * 1.1;
  styleButton0(flex.div);
  centerText2(flex.div);
  updateEnableButton(flex);
  addButtonAction(flex.div, bind(function(flex) {
    state.automaton_enabled = !state.automaton_enabled;
    updateEnableButton(flex);
    update();
  }, flex));

  flex  = new Flex(automatonFlex, 0.01, [0, y + h/3], 1, [0, y + h], 0.5);
  flex.div.innerText = 'Automate the choice upgrades that the tree drops at certain levels.\nThe choice is automatically made at the moment the corresponding upgrade unlocks, but not after the fact.';
  y += h * 1.7;

  for(var i = 0; i < choiceupgrades.length; i++) {
    var u = upgrades[choiceupgrades[i]];
    var u2 = state.upgrades[choiceupgrades[i]];
    flex = new Flex(automatonFlex, 0.01, [0, y], 0.33, [0, y + h], 0.66);
    y += h * 1.1;
    styleButton0(flex.div);
    centerText2(flex.div);
    //flex.div.innerText = u.name;
    updateChoiceButton(flex, i);
    addButtonAction(flex.div, bind(function(flex, i) {
      if(!state.automaton_choice[i]) state.automaton_choice[i] = 1;
      state.automaton_choice[i]++;
      if(state.automaton_choice[i] > 3) state.automaton_choice[i] = 1;
      updateChoiceButton(flex, i);
    }, flex, i));
  }

  flex  = new Flex(automatonFlex, 0.01, [0, y + h/3], 1, [0, y + h], 0.5);
  flex.div.innerText = '[More unlockable automation is planned for future game versions.]';
  y += h * 1.1;
}
