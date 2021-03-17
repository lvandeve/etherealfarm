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

// planting: if false, is for the auto upgrades, if true is for auto planting
function showConfigureAutoResourcesDialog(planting) {
  var dialog = createDialog();
  var scrollFlex = dialog.content;
  makeScrollable(scrollFlex);

  var texth = 0;
  var h = 0.06;
  var y = 0;

  var fractions = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001, 0];

  var typenames, order;
  var statefraction;

  if(planting) {
    typenames = ['berry', 'mushroom', 'flower'];
    order = [3, 4, 5]; // translate from typenames index to index in state.automaton_autoupgrade_fraction
    statefraction = state.automaton_autoplant_fraction;
  } else {
    typenames = ['berry', 'mushroom', 'flower', 'nettle', 'beehive', 'watercress', 'challenge'];
    order = [3, 4, 5, 6, 7, 2, 1]; // translate from typenames index to index in state.automaton_autoupgrade_fraction
    statefraction = state.automaton_autoupgrade_fraction;
  }


  var current;
  var flex;


  texth = 0.15;
  flex  = new Flex(scrollFlex, 0.01, y, 1, y + 0.07, 0.45);
  flex.div.innerText = 'Select max resource amount for ' + (planting ? 'planting' : 'upgrades') + ' of each crop type:';
  y += texth;

  for(var d = 0; d < typenames.length; d++) {
    var d2 = order[d];

    flex = new Flex(scrollFlex, 0.01, y, 0.4, y + h, 0.75);
    y += h * 1.2;
    styleButton0(flex.div);
    centerText2(flex.div);
    var names = [];
    current = 0;
    var bestdist = 1;
    for(var i = 0; i < fractions.length; i++) {
      names[i] = Num(fractions[i]).toPercentString(3, Num.N_FULL);
      var dist = Math.abs(fractions[i] - statefraction[d2]);
      if(dist < bestdist) {
        current = i;
        bestdist = dist;
      }
    }
    // if the state has some value that's not present in the UI, change it to that one now to avoid misleading display
    statefraction[d2] = fractions[current];
    makeDropdown(flex, typenames[d], current, names, bind(function(d2, i) {
      statefraction[d2] = fractions[i];
    }, d2));
    registerTooltip(flex.div, 'max fraction of current amount of resources that the automaton is allowed to spend on this type of ' + (planting ? 'auto-planting' : 'autoupgrades'));
  }

  y += h / 2;
  var flex = new Flex(scrollFlex, 0.01, y, 0.4, y + h, 0.75);
  y += h * 1.2;
  styleButton0(flex.div);
  centerText2(flex.div);
  makeDropdown(flex, 'set all to', current, names, function(i) {
    for(var d = 0; d < typenames.length; d++) {
      var d2 = order[d];
      statefraction[d2] = fractions[i];
    }
    closeTopDialog();
    showConfigureAutoResourcesDialog(planting);
  });
}

function updateAutomatonUI() {
  automatonFlex.clear();
  var choiceupgrades = [fern_choice0, active_choice0];

  makeScrollable(automatonFlex);

  var h = 0.15;
  var y = 0;

  var buttons = [];

  var addButton = function() {
    var h = 0.08;
    var flex  = new Flex(automatonFlex, 0.01, y, 0.4, y + h, 0.66);
    y += h * 1.2;
    buttons.push(flex);
    return flex;
  };

  var setButtonIndicationStyle = function(flex) {
    if(flex.enabledStyle != undefined) {
      if(state.automaton_enabled || flex.isGlobalButtonItself) {
        flex.div.className = flex.enabledStyle ? 'efAutomatonAuto' : 'efAutomatonManual';
      } else {
        flex.div.className = 'efAutomatonGlobalOff';
      }
    }
  };

  var setButtonIndicationStyles = function() {
    for(var i = 0; i < buttons.length; i++) {
      setButtonIndicationStyle(buttons[i]);
    }
  };

  var addHR = function() {
    y += 0.02;
    var h = 0.01;
    var flex  = new Flex(automatonFlex, 0.01, y, 1, y + h, 0.66);
    flex.div.innerHTML = '<hr>';
    y += 0.02;
    return flex;
  };

  var updateEnableButton = function(flex) {
    var div = flex.div.textEl;
    if(state.automaton_enabled) {
      div.innerText = 'Automation on';
      flex.enabledStyle = 1;
    } else {
      div.innerText = 'All automation off';
      flex.enabledStyle = 0;
    }
    setButtonIndicationStyles();
  };

  var texth;
  var flex;

  //////////////////////////////////////////////////////////////////////////////

  var canvasFlex = new Flex(automatonFlex, [1, -0.25], [0, 0.01], [1, -0.06], [0, 0.2], 0.3);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(images_automaton[4], canvas);

  texth = 0.1;
  flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07, 0.7);
  flex.div.innerText = 'Toggle on or off all automation:';
  y += texth;

  flex = addButton();
  styleButton0(flex.div);
  centerText2(flex.div);
  updateEnableButton(flex);
  addButtonAction(flex.div, bind(function(flex) {
    actions.push({type:ACTION_TOGGLE_AUTOMATON, what:0, on:(!state.automaton_enabled), fun:function() {
      updateEnableButton(flex);
    }});
    update();
  }, flex));
  flex.isGlobalButtonItself = true;
  flex.enabledStyle = true;

  addHR();

  //////////////////////////////////////////////////////////////////////////////

  var updateChoiceButton = function(flex, i) {
    var div = flex.div.textEl;
    var u = upgrades[choiceupgrades[i]];
    var s = state.automaton_choice[i];
    var text = upper(u.name) + ': ';
    flex.enabledStyle = 1;
    if(s == 2) {
      text += upper(u.choicename_a);
    } else if(s == 3) {
      text += upper(u.choicename_b);
    } else {
      text += 'Manual';
      flex.enabledStyle = 0;
    }
    div.innerText = text;
    setButtonIndicationStyle(flex);
  };

  texth = 0.1;
  flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07, 0.7);
  flex.div.innerText = 'Automate choice upgrades:';
  registerTooltip(flex.div, 'Automate the choice upgrades that the tree drops at certain levels.\nThe choice is automatically made at the moment the corresponding upgrade unlocks, but not after the fact.');
  y += texth;

  for(var i = 0; i < choiceupgrades.length; i++) {
    var u = upgrades[choiceupgrades[i]];
    var u2 = state.upgrades[choiceupgrades[i]];
    flex = addButton();
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

  addHR();

  //////////////////////////////////////////////////////////////////////////////

  if(state.automaton_unlocked[1]) {
    texth = 0.1;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07, 0.7);
    flex.div.innerText = 'Automate crop upgrades:';
    registerTooltip(flex.div, 'Automatically upgrade crops. Only performs upgrades that boost crops for crops planted in the field, and up to the max cost that you can choose.');
    y += texth;

    var updateUpgradeButton = function(flex) {
      var div = flex.div.textEl;
      if(state.automaton_autoupgrade) {
        div.innerText = 'Auto-upgrades on';
        flex.enabledStyle = 1;
      } else {
        div.innerText = 'Auto-upgrades off';
        flex.enabledStyle = 0;
      }
      setButtonIndicationStyle(flex);
    };

    flex = addButton();
    styleButton0(flex.div);
    centerText2(flex.div);
    updateUpgradeButton(flex);
    addButtonAction(flex.div, bind(function(flex) {
      actions.push({type:ACTION_TOGGLE_AUTOMATON, what:1, on:(state.automaton_autoupgrade ? 0 : 1), fun:function() {
        updateEnableButton(flex);
      }});
      update();
    }, flex));

    var advanced = state.automaton_unlocked[1] >= 2;
    if(advanced) {
      flex = addButton();
      styleButton(flex.div);
      centerText2(flex.div);
      flex.div.textEl.innerText = 'Configure...';
      addButtonAction(flex.div, function() {
        showConfigureAutoResourcesDialog(false);
      });
    } else {
      flex = addButton();
      styleButton0(flex.div);
      centerText2(flex.div);
      var fractions = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001];
      var names = [];
      var current = 0;
      var bestdist = 1;
      for(var i = 0; i < fractions.length; i++) {
        names[i] = Num(fractions[i]).toPercentString(3, Num.N_FULL);
        var dist = Math.abs(fractions[i] - state.automaton_autoupgrade_fraction[0]);
        if(dist < bestdist) {
          current = i;
          bestdist = dist;
        }
      }
      // if the state has some value that's not present in the UI, change it to that one now to avoid misleading display
      state.automaton_autoupgrade_fraction[0] = fractions[current];
      makeDropdown(flex, 'max cost', current, names, function(i) {
        state.automaton_autoupgrade_fraction[0] = fractions[i];
      });
      registerTooltip(flex.div, 'max fraction of current amount of resources that the automaton is allowed to spend on autoupgrades');
    }

    texth = 0.1;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07, 0.7);
    flex.div.innerText = 'Auto-upgrades done: ' + state.c_numautoupgrades;
    y += texth;
    var numflex = flex;
    var lastseennum = state.c_numautoupgrades;
    registerUpdateListener(function() {
      if(!numflex || !document.body.contains(numflex.div)) return false;
      if(lastseennum != state.c_numautoupgrades) {
        numflex.div.innerText = 'Auto-upgrades done: ' + state.c_numautoupgrades;
        lastseennum = state.c_numautoupgrades;
      }
      return true;
    });

    if(!advanced) {
      texth = 0.1;
      flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07, 0.7);
      flex.div.innerText = 'Start the no-upgrades challenge again and beat its next stage to unlock more finetuning options for auto-upgrade';
      y += texth * 1.2;
    }

  } else {
    texth = 0.15;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07, 0.7);
    flex.div.innerText = 'Reach ethereal tree level 2 and beat the no upgrades challenge to unlock auto-upgrades';
    y += texth;
  }


  addHR();

  //////////////////////////////////////////////////////////////////////////////

  if(state.automaton_unlocked[2]) {
    texth = 0.1;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07, 0.7);
    flex.div.innerText = 'Auto-plant:';
    registerTooltip(flex.div, 'Automatically plants crops. Only replaces existing crops to higher tiers of the same type (e.g. berries stay berries), does not plant anything on empty field cells.');
    y += texth;

    var updatePlantButton = function(flex) {
      var div = flex.div.textEl;
      if(state.automaton_autoplant) {
        div.innerText = 'Auto-plant on';
        flex.enabledStyle = 1;
      } else {
        div.innerText = 'Auto-plant off';
        flex.enabledStyle = 0;
      }
      setButtonIndicationStyle(flex);
    };

    flex = addButton();
    styleButton0(flex.div);
    centerText2(flex.div);
    updatePlantButton(flex);
    addButtonAction(flex.div, bind(function(flex) {
      actions.push({type:ACTION_TOGGLE_AUTOMATON, what:2, on:(state.automaton_autoplant ? 0 : 1), fun:function() {
        updateEnableButton(flex);
      }});
      update();
    }, flex));

    var advanced = state.automaton_unlocked[2] >= 2;
    if(advanced) {
      flex = addButton();
      styleButton(flex.div);
      centerText2(flex.div);
      flex.div.textEl.innerText = 'Configure...';
      addButtonAction(flex.div, function() {
        showConfigureAutoResourcesDialog(true);
      });
    } else {
      flex = addButton();
      styleButton0(flex.div);
      centerText2(flex.div);
      var fractions = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001];
      var names = [];
      var current = 0;
      var bestdist = 1;
      for(var i = 0; i < fractions.length; i++) {
        names[i] = Num(fractions[i]).toPercentString(3, Num.N_FULL);
        var dist = Math.abs(fractions[i] - state.automaton_autoplant_fraction[0]);
        if(dist < bestdist) {
          current = i;
          bestdist = dist;
        }
      }
      // if the state has some value that's not present in the UI, change it to that one now to avoid misleading display
      state.automaton_autoplant_fraction[0] = fractions[current];
      makeDropdown(flex, 'max cost', current, names, function(i) {
        state.automaton_autoplant_fraction[0] = fractions[i];
      });
      registerTooltip(flex.div, 'max fraction of current amount of resources that the automaton is allowed to spend on autoplanting');
    }

  } else if(state.automaton_unlocked[1]) {
    texth = 0.15;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07, 0.7);
    //not yet implemented
    //flex.div.innerText = 'Reach ethereal tree level 3 and beat the withering-challenge to unlock auto-plant';
    y += texth;
  }

  //////////////////////////////////////////////////////////////////////////////

}
