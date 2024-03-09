/*
Ethereal Farm
Copyright (C) 2020-2024  Lode Vandevenne

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

// subject: 0=auto upgrade, 1=auto plant, 2=auto unlock
function showConfigureAutoResourcesDialog(subject) {
  var title;
  if(subject == 0) title = 'Configure auto upgrade';
  else if(subject == 1) title = 'Configure auto plant';
  else if(subject == 2) title = 'Configure auto unlock';

  var helpindex = subject == 0 ? 29 : (subject == 1 ? 31 : 33);

  var dialog = createDialog({
    title:title,
    help:bind(showRegisteredHelpDialog, helpindex, true),
    scrollable:true});
  var scrollFlex = dialog.content;

  var advanced = autoFinetuningUnlocked();

  var texth = 0;
  var h = 0.06;
  var y = 0;

  var addButton = function() {
    var h = 0.05;
    var flex  = new Flex(scrollFlex, 0.01, y, 0.4, y + h);
    y += h * 1.2;
    return flex;
  };


  var fractions = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001, 0.0005, 0.0002, 0.0001, 0];

  var subjecttitle = subject == 0 ? 'upgrades' : (subject == 1 ? 'planting' : 'unlock');

  if(advanced) {
    var typenames, order;
    var statefraction;

    if(subject == 0) {
      // auto-upgrade
      typenames = ['berry', 'mushroom', 'flower', 'stinging', 'beehive', 'brassica'];
      order = [3, 4, 5, 6, 7, 2]; // translate from typenames index to index in state.automaton_autoupgrade_fraction
      if(squirrelUnlocked()) {
        typenames.push('nuts');
        order.push(9);
      }
      typenames.push('other');
      order.push(1);
      statefraction = state.automaton_autoupgrade_fraction;
    } else if(subject == 1 || subject == 2) {
      // auto-plant and auto-unlock
      typenames = ['berry', 'mushroom', 'flower', 'stinging', 'beehive', 'mistletoe', 'brassica'];
      order = [3, 4, 5, 6, 7, 8, 2]; // translate from typenames index to index in state.automaton_autoupgrade_fraction
      if(subject == 1) {
        statefraction = state.automaton_autoplant_fraction;
      } else {
        statefraction = state.automaton_autounlock_fraction;
      }
      if(squirrelUnlocked()) {
        typenames.push('nuts');
        order.push(9);
      }
      typenames.push('other');
      order.push(1);
    }


    var current;
    var flex;

    texth = 0.12;
    flex  = new Flex(scrollFlex, 0.01, y, 1, y + 0.07);
    flex.div.innerText = 'Select max resource amount for ' + subjecttitle + ' of each crop type:';
    y += texth;

    var orig_y = y;

    if(subject == 2) {
      if(autoPrestigeUnlocked()) {
        // prestige
        var button = addButton();
        y += h * 0.2;
        button.div.className = 'efButton';
        var updateButton = function() {
          button.div.textEl.innerText = state.automaton_autoprestige ? 'auto-prestige enabled' : 'auto-prestige disabled';
        };
        styleButton0(button.div);
        centerText2(button.div);
        registerTooltip(button.div, 'whether to also apply automation of crop prestige upgrades. This uses the same cost settings as auto-unlock');
        updateButton();
        addButtonAction(button.div, function() {
          state.automaton_autoprestige = (state.automaton_autoprestige ? 0 : 1);
          updateButton();
          closeTopDialog();
          showConfigureAutoResourcesDialog(subject);
        }, 'enable or disable auto-prestige');
      }
      var button = addButton();
      y += h * 0.2;
      button.div.className = 'efButton';
      var updateButton = function() {
        button.div.textEl.innerText = state.automaton_autounlock_copy_plant_fraction ? 'shared with auto-plant' : 'customized below';
      };
      styleButton0(button.div);
      centerText2(button.div);
      updateButton();
      addButtonAction(button.div, function() {
        state.automaton_autounlock_copy_plant_fraction = !state.automaton_autounlock_copy_plant_fraction;
        updateButton();
        closeTopDialog();
        showConfigureAutoResourcesDialog(subject);
      }, 'share auto-unlock resource fraction settings with auto-plant');
    }

    var inactive = subject == 2 && state.automaton_autounlock_copy_plant_fraction;

    if(inactive) return;


    for(var d = 0; d < typenames.length; d++) {
      var d2 = order[d];

      flex = new Flex(scrollFlex, 0.01, y, 0.4, y + h);
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
      registerTooltip(flex.div, 'max fraction of current amount of resources that the automaton is allowed to spend on this type of auto ' + subjecttitle);
    }

    y += h / 4;
    var flex = new Flex(scrollFlex, 0.01, y, 0.4, y + h);
    y += h * 1.2;
    styleButton0(flex.div);
    centerText2(flex.div);
    makeDropdown(flex, 'set all to', current, names, function(i) {
      for(var d = 0; d < typenames.length; d++) {
        var d2 = order[d];
        statefraction[d2] = fractions[i];
      }
      closeTopDialog();
      showConfigureAutoResourcesDialog(subject);
    });

    if(subject == 2) {
      var x = 0.5;
      y = orig_y;

      h = 0.06;
      var textFlex  = new Flex(scrollFlex, x, y, x + 0.4, y + h);
      y += h * 1.2;
      var temp = state.automaton_autounlock_max_cost; // only actually stored in state.automaton_autounlock_max_cost if input field changed, rather than just receiving keypress, to avoid unwanted buys while typing
      var setMaxCostText = function() {
        var text = 'Cost limit: ' + temp.toString();
        if(temp.eqr(0)) text += ' (unlimited)';
        else text += ' seeds';
        textFlex.div.innerText = text;
      };
      setMaxCostText();

      h = 0.06;
      var inputFlex = new Flex(scrollFlex, x, y, x + 0.4, y + h);
      var area = util.makeAbsElement('textarea', '0', '0', '100%', '100%', inputFlex.div);
      var changefun = function() {
        var v = Num.parse(area.value);
        if(!v || Num.isNaN(v) || v.ltr(0)) v = Num(0);
        temp = v;
        setMaxCostText();
      };
      area.onchange = function() {
        changefun();
        state.automaton_autounlock_max_cost = temp;
      };
      area.onkeyup = changefun;
      y += h * 1.2;
      /*area.value = state.automaton_autounlock_max_cost.toString(3, Num.N_SCI);
      area.onclick = function() {
        area.select();
      };*/

      y += 0.03;
      h = 0.06;
      var infoFlex  = new Flex(scrollFlex, x, y, x + 0.4, y + h);
      var info = '';
      info += 'Change cost limit in the text box above. Automaton will not buy unlocks more expensive than this value.';
      info += '<br><br>';
      info += 'Use 0 to indicate unlimited (default). For example, set to 1001 to prevent auto-unlocking anything higher than blackberry.'
      //info += '<br><br>'
      //info += 'Supported input notation examples: 0, 1000000, 1e6, 100e48, 1M, 100QiD, ...'
      //info += 'The output value above the box renders it in your preferred number notation for verification.';
      infoFlex.div.innerHTML = info;
      y += h * 1.2;
    }
  } else { // !advanced
    var array = subject == 0 ? state.automaton_autoupgrade_fraction : (subject == 1 ? state.automaton_autoplant_fraction : state.automaton_autounlock_fraction);

    flex = addButton();
    styleButton0(flex.div);
    centerText2(flex.div);
    var fractions = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001];
    var names = [];
    var current = 0;
    var bestdist = 1;
    for(var i = 0; i < fractions.length; i++) {
      names[i] = Num(fractions[i]).toPercentString(3, Num.N_FULL);
      var dist = Math.abs(fractions[i] - array[0]);
      if(dist < bestdist) {
        current = i;
        bestdist = dist;
      }
    }
    // if the state has some value that's not present in the UI, change it to that one now to avoid misleading display
    array[0] = fractions[current];
    makeDropdown(flex, 'max cost', current, names, function(i) {
      array[0] = fractions[i];
    });
    registerTooltip(flex.div, 'max fraction of current amount of resources that the automaton is allowed to spend on auto ' + subjecttitle);

    y += 0.03;
    h = 0.06;
    var infoFlex  = new Flex(scrollFlex, 0, y, 1, y + h);
    var info = '';
    info += 'Start the no-upgrades challenge again and beat its next stage to unlock more finetuning options in this dialog';
    infoFlex.div.innerHTML = info;
    y += h * 1.2;
  }
}

////////////////////////////////////////////////////////////////////////////////

var showingConfigureAutoChoiceDialog = false;

// Function to get the list of choice upgrades, for automaton and amber UI/gameplay. Must be kept manually up to date when adding new choice upgrades
function getChoiceUpgrades() {
  return [fern_choice0, active_choice0, watercress_choice0, resin_choice0];
}
// must match the levels of the upgrades returned by getChoiceUpgrades()
function getChoiceUpgradeLevels() {
  return [3, 8, 14, 22];
}

function getChoiceUpgradeInfoText(u, u2) {
  var text = '';
  text += '<b>' + u.choicename_a + ':</b><br>' + u.description_a;
  text += '<br><br>';
  text += '<b>' + u.choicename_b + ':</b><br>' + u.description_b;
  text += '<br><br>';
  text += '<b>Manual:</b><br>Handle this upgrade manually instead of through the automaton.';
  text += '<br><br>';
  text += '<b>Current status: </b>';
  if(u2.count == 0) text += ' Not bought';
  else if(u2.count == 1) text += ' Bought: ' + u.choicename_a;
  else if(u2.count == 2) text += ' Bought: ' + u.choicename_b;
  else text += ' Unknown?'; // should normally not happen

  // TODO: have this available in the u object instead of hardcoding the levels duplicated here
  var treelevel = -1;
  if(u.index == fern_choice0) treelevel = 3;
  if(u.index == active_choice0) treelevel = 8;
  if(u.index == watercress_choice0) treelevel = 14;
  if(u.index == resin_choice0) treelevel = 22;

  if(treelevel != -1) {
    text += '<br><br>';
    text += '<b>Unlocked at tree level: </b>' + treelevel;
  }
  return text;
}

function showConfigureAutoChoiceDialog(subject) {
  showingConfigureAutoChoiceDialog = true;
  var dialog = createDialog({
    onclose:function() {
      showingConfigureAutoChoiceDialog = false;
    },
    scrollable:true,
    title:'Configure auto choices'
  });
  var scrollFlex = dialog.content;

  var texth = 0;
  var h = 0.06;
  var y = 0;

  var flex;


  texth = 0.15;
  flex  = new Flex(scrollFlex, 0.01, y, 1, y + 0.07);
  flex.div.innerText = 'Choose the action for each choice upgrade dropped by the tree';
  y += texth;

  var addButton = function() {
    var h = 0.08;
    var flex  = new Flex(scrollFlex, 0.01, y, 0.55, y + h);
    y += h * 1.2;
    return flex;
  };

  var addInfoButton = function() {
    var h = 0.08;
    var h2 = h * 1.2;
    var half = h / 2;
    var half2 = h2 / 2;
    y -= h * 1.2; // undo height increase from main button left of this one
    var flex  = new Flex(scrollFlex, 0.6, [y + half -half2], [0.6, h2], [y + half + half2]);
    y += h * 1.2;
    return flex;
  };


  var choiceupgrades = [fern_choice0, active_choice0, watercress_choice0, resin_choice0];
  var choiceupgrade_levels = [3, 8, 14, 22];

  var updateChoicesButton = function(flex, i) {
    var div = flex.div.textEl;
    var u = upgrades[choiceupgrades[i]];
    var s = state.automaton_choices[i];
    var text = upper(u.name) + ': ';
    if(s == 2) {
      flex.enabledStyle = 1;
      text += upper(u.choicename_a);
    } else if(s == 3) {
      flex.enabledStyle = 2;
      text += upper(u.choicename_b);
    } else {
      text += 'Manual';
      flex.enabledStyle = 0;
    }
    div.innerText = text;
    setButtonIndicationStyle(flex);
  };

  var setButtonIndicationStyle = function(flex) {
    if(flex.enabledStyle != undefined) {
      flex.div.className = flex.enabledStyle == 0 ? 'efAutomatonManual' : (flex.enabledStyle == 1 ? 'efAutomatonAuto2' : 'efAutomatonAuto');
    }
  };

  for(var i = 0; i < choiceupgrades.length; i++) {
    if(state.g_treelevel < choiceupgrade_levels[i]) continue;
    var u = upgrades[choiceupgrades[i]];
    var u2 = state.upgrades[choiceupgrades[i]];
    flex = addButton();
    styleButton0(flex.div);
    centerText2(flex.div);
    //flex.div.innerText = u.name;
    updateChoicesButton(flex, i);
    addButtonAction(flex.div, bind(function(flex, i) {
      if(!state.automaton_choices[i]) state.automaton_choices[i] = 1;
      state.automaton_choices[i]++;
      if(state.automaton_choices[i] > 3) state.automaton_choices[i] = 1;
      updateChoicesButton(flex, i);
    }, flex, i));

    var tooltiptext = 'Configure automaton for this specific choice upgrade:<br><br>'
    tooltiptext += getChoiceUpgradeInfoText(u, u2);

    registerTooltip(flex.div, tooltiptext);

    flex = addInfoButton();
    styleButton0(flex.div, true);
    var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(image_info, canvas);
    addButtonAction(flex.div, bind(function(i) {
      var u = upgrades[choiceupgrades[i]];
      var u2 = state.upgrades[choiceupgrades[i]];
      var dialog = createDialog({title:(u.name + ' info')});
      dialog.content.div.innerHTML = getChoiceUpgradeInfoText(u, u2);
    }, i));
  }
}

function showAutomatonFeatureSourceDialog() {
  var dialog = createDialog({
    help:createAutomatonHelpDialog,
    title:'Automaton features unlock sources',
    scrollable:true
  });

  var text = '';

  text += 'This is what unlocked the automaton features you got so far:';
  text += '<br/><br/>';
  text += ' • Automaton itself: unlock automaton upgrade (ethereal tree level 1)';
  text += '<br/>';
  text += ' • Blueprints and templates: initial';
  text += '<br/>';
  text += ' • Clear / Plant entire field buttons: initial';
  text += '<br/>';
  text += ' • Neighbor bonus in ethereal field: initial';
  //text += '<br/>';
  //text += ' • Watercress upgrade visible from the start: initial'; // even without blackberry secret, it serves more as a reminder to plant watercress before blackberry unlocks
  text += '<br/>';
  text += ' • Auto-plant (blueprints, and increase crop tier when unlocked): initial';
  text += '<br/>';
  if(autoUpgradesUnlocked()) {
    text += ' • Auto-upgrades: no-upgrades challenge (ethereal tree level 2)';
    text += '<br/>';
  }
  if(autoFinetuningUnlocked()) {
    text += ' • Finetuning options for auto-plant and auto-upgrades costs: no-upgrades challenge stage 2';
    text += '<br/>';
  }
  if(autoChoiceUnlocked()) {
    text += ' • Automation of choice upgrades: no-upgrades challenge (ethereal tree level 2)';
    text += '<br/>';
  }
  if(autoUnlockUnlocked()) {
    text += ' • Auto-unlock: blackberry challenge (ethereal tree level 3)';
    text += '<br/>';
  }
  if(autoActionUnlocked()) {
    text += ' • Auto-action: wither challenge (ethereal tree level 5)';
    text += '<br/>';
  }
  if(numAutoActionsUnlocked() >= 2) {
    text += ' • Extra auto-action slots: further wither challenge stages';
    text += '<br/>';
  }
  if(autoActionExtraUnlocked()) {
    text += ' • Auto-action weather, brassica refresh and fern: wither challenge stage 4';
    text += '<br/>';
  }
  if(autoPrestigeUnlocked()) {
    text += ' • Auto-prestige: truly basic challenge';
    text += '<br/>';
  }


  dialog.content.div.innerHTML = text;
}


function getBluePrintActionDescription(index, o) {
  var visual_index = haveBeginOfRunAutoAction() ? index : (index + 1);
  var text = '';

  text += 'Trigger ' + visual_index + ': ';
  if(index == 0 && haveBeginOfRunAutoAction()) {
    text += 'This special limited auto-action can only be used to set up start-of-run.';
  } else {
    if(o.type == 0) {
      text += 'tree level: ' + o.level;
    } else if(o.type == 1 || o.type == 2 || o.type == 3 || o.type == 5) {
      var c = crops[o.crop - 1];
      var p = o.prestige;
      var cropname = c ? c.name : 'none';
      if(c && p) cropname += ' (prestiged)';
      if(o.type == 1) text += 'unlocked crop: ' + cropname;
      if(o.type == 2) text += 'planted crop: ' + cropname;
      if(o.type == 3) text += 'fullgrown crop: ' + cropname;
      if(o.type == 5) text += 'upgraded crop: ' + cropname;
    } else if(o.type == 4) {
      text += 'run time: ' + util.formatDuration(o.time, true);
    }
  }

  text += '<br>';
  text += 'Action ' + visual_index + ': ';
  var actiontext = '';
  if(o.enable_blueprint) {
    var b = state.blueprints[o.blueprint];
    var empty = !b || (b.data.length == 0);
    actiontext += 'Override blueprint ' + (o.blueprint + 1) + ' ' + (empty ? '[empty]' : ('"' + b.name + '"'));;
  }
  if(o.enable_blueprint2) {
    if(actiontext != '') actiontext += '. ';
    var b = state.blueprints2[o.blueprint2];
    var empty = !b || (b.data.length == 0);
    actiontext += 'Ethereal blueprint ' + (o.blueprint2 + 1) + ' ' + (empty ? '[empty]' : ('"' + b.name + '"'));;
  }
  if(o.enable_fruit) {
    if(actiontext != '') actiontext += '. ';
    var f = state.fruit_stored[o.fruit];
    actiontext += 'Select fruit slot ' + (o.fruit + 1); // fruit slots start at 1 (not 0) due to the keyboard key 1 being leftmost
    if(f) {
      actiontext += ' "' + f.toString() + '"';
    }
  }
  if(autoActionExtraUnlocked()) {
    if(o.enable_brassica) {
      if(actiontext != '') actiontext += '. ';
      actiontext += 'Refresh brassica';
    }
    if(o.enable_weather) {
      if(actiontext != '') actiontext += '. ';
      if(o.weather == 0) actiontext += 'Activate sun';
      if(o.weather == 1) actiontext += 'Activate mist';
      if(o.weather == 2) actiontext += 'Activate rainbow';
    }
    if(o.enable_fern) {
      if(actiontext != '') actiontext += '. ';
      actiontext += 'Pick up fern';
    }
  }

  if(actiontext == '') actiontext = 'None';
  text += actiontext;
  return text;
}


function markTriggeredAutoActionsAsDone() {
  var num = numAutoActionsUnlocked();
  for(var j = 0; j < num; j++) {
    var b = state.automaton_autoactions[j];
    b.done = autoActionTriggerConditionReached(j, b);
  }
}


function showConfigureAutoActionTriggerDialog(index, closefun) {
  var visual_index = haveBeginOfRunAutoAction() ? index : (index + 1);
  var o = state.automaton_autoactions[index];

  o.done = o.done2 = true; // don't trigger while editing, it can be unexpected

  var dialog = createDialog({
    onclose:function() {
      // possibly re-enable the auto-action, if it's set in the future, or disable it if it's set in the past (so it won't trigger right now that you configured it while it applied to the past, intended for a next run)
      // e.g. if re-configuring an auto-action to be after 3 hours of run, then re-enable if current runtime is 2 hours, but don't if current runtime is 4 hours
      var done = autoActionTriggerConditionReached(index, o);
      o.done = o.done2 = done;
      o.time2 = 0;
      closefun();
    },
    scrollable:true,
    title:('Configure automaton trigger ' + visual_index),
    help:'Here you can configure the conditions at which this automaton action will trigger, e.g. after some tree level is reached, some crops are unlocked or after a certain time'
  });
  var scrollFlex = dialog.content;

  var texth = 0;
  var h = 0.06;
  var y = 0;

  var flex;

  var addControl = function() {
    var h = 0.08;
    var flex  = new Flex(scrollFlex, 0.01, y, 0.6, y + h);
    y += h * 1.2;
    return flex;
  };

  var setButtonIndicationStyle = function(flex) {
    if(flex.enabledStyle != undefined) {
      flex.div.className = flex.enabledStyle == 0 ? 'efAutomatonManual' : (flex.enabledStyle == 1 ? 'efAutomatonAuto2' : 'efAutomatonAuto');
    }
  };

  var flex;

  var updateToggleButton = function(flex, state) {
    var div = flex.div.textEl;
    var text = '';
    if(state) {
      flex.enabledStyle = 2;
      text += 'on';
    } else {
      flex.enabledStyle = 0;
      text += 'off';
    }
    div.innerText = text;
    setButtonIndicationStyle(flex);
  };

  flex = addControl();
  styleButton(flex.div);
  centerText2(flex.div);
  var typenames = ['tree level', 'unlocked crop', 'planted crop', 'fullgrown crop', 'upgraded crop', 'run time'];
  // the order in the dropdown is different than the save state order
  var typevalues = [0, 1, 2, 3, 5, 4];
  var invtypevalues = [0, 1, 2, 3, 5, 4];
  makeDropdown(flex, 'Trigger by', invtypevalues[o.type], typenames, function(i) {
    o.type = typevalues[i];
    updateLevelButton(index);
  }, true);
  //flex.div.className = 'efAutomatonAuto';


  var levelflex = addControl();
  styleButton(levelflex.div);
  centerText2(levelflex.div);
  var updateLevelButton = function() {
      var text = '';
      if(o.type == 0) {
        text += 'tree level: ' + o.level;
      } else if(o.type == 1 || o.type == 2 || o.type == 3 || o.type == 5) {
        var c = crops[o.crop - 1];
        var p = o.prestige;
        var cropname = c ? c.name : 'none';
        if(c && p) cropname += ' (prestiged)';
        if(o.type == 1) text += 'unlocked crop: ' + cropname;
        if(o.type == 2) text += 'planted crop: ' + cropname;
        if(o.type == 3) text += 'fullgrown crop: ' + cropname;
        if(o.type == 5) text += 'upgraded crop: ' + cropname;
      } else if(o.type == 4) {
        text += 'run time: ' + util.formatDuration(o.time, true);
      }
      levelflex.div.textEl.innerText = text;
  };
  addButtonAction(levelflex.div, function() {
    if(o.type == 0) {
      makeTextInput('Tree level', 'Enter tree level at which to perform action', function(text) {
        var i = parseInt(text);
        if(!(i >= 0 && i < 1000000)) i = 0;
        o.level = i;
        updateLevelButton(index);
      }, '' + o.level);
    } else if(o.type == 1 || o.type == 2 || o.type == 3 || o.type == 5) {
      makePlantSelectDialog(o.crop, o.prestige, function(cropid, prestiged) {
        o.crop = cropid + 1;
        o.prestige = prestiged;
        updateLevelButton();
      });
    } else if(o.type == 4) {
      var current_hours = '' + Math.floor(o.time / 3600);
      var current_minutes = '' + Math.floor((o.time % 3600) / 60);
      var current_seconds = '' + (o.time % 60);
      var current;
      if(current_seconds == '0') {
        if(current_minutes.length == 1) current_minutes = '0' + current_minutes;
        current = current_hours + ':' + current_minutes;
      } else {
        current = '';
        if(current_hours != 0) current += current_hours + 'h ';
        if(current_minutes != 0) current += current_minutes + 'm ';
        if(current_seconds != 0) current += current_seconds + 's';
        current = current.trim();
      }
      makeTextInput('Run time', 'Enter time since start of run. Supported formats, e.g. for one and a half hours: 1:30, 1h30m, 1.5h or 1.5', function(text) {
        var parts = text.split(':');
        var lastchar = parts.length == 1 ? lower(parts[0].charAt(parts[0].length - 1)) : '';
        if(lastchar == 'd' || lastchar == 'h' || lastchar == 'm' || lastchar == 's') {
          // support an alternative notation such as: 5h for 5 hours, 3d for 3 days, 2m for 2 minutes, etc..., and combinations of those. Month and year are not supported, and it's case-insensitive
          var parts2 = parts[0].split(/([a-zA-Z])/); // split by letter separators such that you get both the numeric values and the separator letters. E.g. 3d 1h becomes "3","d"," 1","h",""
          o.time = 0;
          for(var i = 0; i + 1 < parts2.length; i += 2) {
            var value = parseFloat(parts2[i].trim());
            var unit = parts2[i + 1];
            if(unit == 'd') o.time += value * 24 * 3600;
            else if(unit == 'h') o.time += value * 3600;
            else if(unit == 'm') o.time += value * 60;
            else if(unit == 's') o.time += value;
          }
        } else {
          var hours = parseFloat(parts[0]);
          var minutes = parts.length > 1 ? parseFloat(parts[1]) : 0;
          var seconds = parts.length > 2 ? parseFloat(parts[2]) : 0; // seconds are not mentioned in the documentation to not make it too crowded, but possible
          if(!(hours >= 0)) hours = 0;
          if(!(minutes >= 0)) minutes = 0;
          if(!(seconds >= 0)) seconds = 0;
          o.time = hours * 3600 + minutes * 60 + seconds;
        }
        if(isNaN(o.time)) o.time = 0;

        updateLevelButton(index);
      }, '' + current);
    }
  });
  updateLevelButton();
}


function showConfigureAutoActionEffectDialog(index, closefun) {
  var visual_index = haveBeginOfRunAutoAction() ? index : (index + 1);
  var dialog = createDialog({
    onclose:closefun,
    scrollable:true,
    title:('Configure automaton action ' + visual_index),
    help:'Here you can select one or more automaton actions that occur when the condition is triggered'
  });
  var scrollFlex = dialog.content;

  var o = state.automaton_autoactions[index];

  var texth = 0;
  var h = 0.06;
  var y = 0;

  var flex;

  var addControl = function(opt_height) {
    var h = 0.08 * ((opt_height == undefined) ? 1 : opt_height);
    var flex  = new Flex(scrollFlex, 0.01, y, 0.8, y + h);
    y += h * 1.2;
    return flex;
  };

  var setButtonIndicationStyle = function(flex) {
    if(flex.enabledStyle != undefined) {
      flex.div.className = flex.enabledStyle == 0 ? 'efAutomatonManual' : (flex.enabledStyle == 1 ? 'efAutomatonAuto2' : 'efAutomatonAuto');
    }
  };

  var flex;


  flex = addControl(0.7);
  makeCheckbox(flex, o.enable_blueprint, 'Enable auto-blueprint', function(state) {
    o.enable_blueprint = state;
  }, 'Enable auto-blueprint');

  flex = addControl();
  styleButton(flex.div);
  centerText2(flex.div);
  var updateBlueprintButton = bind(function(flex, index) {
    //updateToggleButton(flex, true);
    var i = o.blueprint;
    var b = state.blueprints[i];
    var empty = !b || (b.data.length == 0);
    flex.div.textEl.innerText = 'Chosen blueprint: [' + (i + 1) + '] ' + (empty ? '[empty]' : b.name);
  }, flex, index);
  addButtonAction(flex.div, function() {
    createBlueprintsDialog(undefined, undefined, false, function(i) {
      o.blueprint = i;
      updateBlueprintButton();
    });
  });
  updateBlueprintButton();


  if(autoActionExtra2Unlocked()) {
    flex = addControl(0.7);
    makeCheckbox(flex, o.enable_blueprint2, 'Enable ethereal blueprint', function(state) {
      o.enable_blueprint2 = state;
    }, 'Enable ethereal blueprint');

    flex = addControl();
    styleButton(flex.div);
    centerText2(flex.div);
    var updateBlueprintButton2 = bind(function(flex, index) {
      //updateToggleButton(flex, true);
      var i = o.blueprint2;
      var b = state.blueprints2[i];
      var empty = !b || (b.data.length == 0);
      flex.div.textEl.innerText = 'Ethereal blueprint: [' + (i + 1) + '] ' + (empty ? '[empty]' : b.name);
    }, flex, index);
    addButtonAction(flex.div, function() {
      createBlueprintsDialog(undefined, undefined, true, function(i) {
        o.blueprint2 = i;
        updateBlueprintButton2();
      });
    });
    updateBlueprintButton2();
  }

  flex = addControl(0.7);
  makeCheckbox(flex, o.enable_fruit, 'Enable auto-fruit', function(state) {
    o.enable_fruit = state;
  }, 'Enable auto-fruit');


  flex = addControl();
  styleButton(flex.div);
  centerText2(flex.div);
  var updateFruitButton = bind(function(flex, index) {
    var f = state.fruit_stored[o.fruit];

    var text = 'Chosen fruit slot: ' + (o.fruit + 1);

    if(f) {
      text += '. "' + f.toString() + '"';
    }
    flex.div.textEl.innerText = text;
  }, flex, index);
  addButtonAction(flex.div, function() {
    createSelectFruitSlotDialog(function(i) {
      o.fruit = i;
      updateFruitButton();
    }, MAXFRUITARROWS, 'Select fruit to automatically swap to when triggering this automaton action. This selects the fruit slot, not the fruit: if you move fruits around in the fruit tab, the original slot position, not the moved fruit, is used. In the fruit tab, the selected slot will show a small gear icon as a reminder. Only slots from the topmost row can be selected.');
  });
  updateFruitButton();

  if(autoActionExtraUnlocked()) {
    flex = addControl(0.7);
    makeCheckbox(flex, o.enable_brassica, 'Refresh brassica', function(state) {
      o.enable_brassica = state;
    }, 'Refresh brassica');

    flex = addControl(0.7);
    makeCheckbox(flex, o.enable_weather, 'Activate weather', function(state) {
      o.enable_weather = state;
    }, 'Activate weather');

    flex = addControl();
    styleButton(flex.div);
    centerText2(flex.div);
    var updateWeatherButton = bind(function(flex, index) {
      var text = 'Chosen weather: ' + ['sun', 'mist', 'rainbow'][o.weather];
      flex.div.textEl.innerText = text;
    }, flex, index);
    addButtonAction(flex.div, function() {
      createSelectWeatherDialog(function(i) {
        o.weather = i;
        updateWeatherButton();
      }, 'Select which weather to activate for this auto-action.');
    });
    updateWeatherButton();

    flex = addControl(0.7);
    makeCheckbox(flex, o.enable_fern, 'Pick up fern', function(state) {
      o.enable_fern = state;
    }, 'Pick up fern');
  }
}

var showingConfigureAutoActionDialog = false;

function showConfigureAutoActionDialog() {
  showingConfigureAutoActionDialog = true;

  var dialog = createDialog({
    onclose:function() {
      showingConfigureAutoActionDialog = false;
    },
    scrollable:true,
    title:'Configure auto actions',
    help:('Auto-action lets the automaton perform actions after a certain trigger condition is met, such as overriding the field with another blueprint at a chosen tree level. You must configure both a trigger (when will the action be performed) and an action (what does it perform, it can do multiple things at once)<br><br>' + autoBlueprintHelp + '<br><br>It\'s also possible to activate auto-actions manually with the "Do now" button. You can also configure the number keys to do this in the main settings under Controls.')
  });
  var scrollFlex = dialog.content;

  var texth = 0;
  var h = 0.06;
  var y = 0;

  var flex;

  texth = 0.05;
  flex  = new Flex(scrollFlex, 0.01, y, 1, y + 0.07);
  flex.div.innerText = 'Choose at which tree level to override with which blueprint';
  y += texth * 1.5;

  var addControl = function(opt_width, opt_align) {
    var h = 0.08;
    var w = opt_width || 0.6;
    var flex  = new Flex(scrollFlex, 0.01, y, w, y + h, undefined, opt_align);
    y += h * 1.2;
    return flex;
  };

  var setButtonIndicationStyle = function(flex) {
    if(flex.enabledStyle != undefined) {
      flex.div.className = flex.enabledStyle == 0 ? 'efAutomatonManual' : (flex.enabledStyle == 1 ? 'efAutomatonAuto2' : 'efAutomatonAuto');
    }
  };

  var flex;

  var updateToggleButton = function(flex, state) {
    var div = flex.div.textEl;
    var text = '';
    if(state) {
      flex.enabledStyle = 2;
      text += 'Auto on';
    } else {
      flex.enabledStyle = 0;
      text += 'Auto off';
    }
    div.innerText = text;
    setButtonIndicationStyle(flex);
  };

  var num = numAutoActionsUnlocked();

  var infoflexes = [];

  for(var j = 0; j < num; j++) {
    var b = state.automaton_autoactions[j];

    flex = addControl(1, 6);
    flex.div.innerHTML = getBluePrintActionDescription(j, b);
    infoflexes.push(flex);
    var updateInfoFlex = function(j) {
      var flex = infoflexes[j];
      var b = state.automaton_autoactions[j];
      flex.div.innerHTML = getBluePrintActionDescription(j, b);
    };


    var x = 0.0;
    var w0 = 0.24;
    var w1 = 0.25; // including gap

    if(haveBeginOfRunAutoAction() && j == 0) {
      flex = new Flex(scrollFlex, x, y, x + w0, y + 0.07);
      styleButton(flex.div);
      centerText2(flex.div);
      flex.div.className = 'efButtonCantAfford';
      flex.div.textEl.innerText = '(Start of run only)';
    } else {
      flex = new Flex(scrollFlex, x, y, x + w0, y + 0.07);
      styleButton(flex.div);
      centerText2(flex.div);
      flex.div.textEl.innerText = 'Edit trigger';
      addButtonAction(flex.div, bind(function(j) {
        showConfigureAutoActionTriggerDialog(j, function() {
          updateInfoFlex(j);
        });
      }, j));
    }
    x += w1;


    flex = new Flex(scrollFlex, x, y, x + w0, y + 0.07);
    styleButton(flex.div);
    centerText2(flex.div);
    flex.div.textEl.innerText = 'Edit action';
    addButtonAction(flex.div, bind(function(j) {
      showConfigureAutoActionEffectDialog(j, function() {
        updateInfoFlex(j);
      });
    }, j));
    x += w1;

    // toggle button disabled if num is 1, since there's only one auto-override action for now, the global enable/disable already does this
    if(num > 1) {
      flex = new Flex(scrollFlex, x, y, x + w0, y + 0.07);
      styleButton0(flex.div);
      centerText2(flex.div);
      flex.div.textEl.innerText = 'toggle';
      addButtonAction(flex.div, bind(function(flex, j) {
        state.automaton_autoactions[j].enabled = !state.automaton_autoactions[j].enabled;
        updateToggleButton(flex, state.automaton_autoactions[j].enabled);
      }, flex, j));
      x += w1;
      updateToggleButton(flex, state.automaton_autoactions[j].enabled);
    }


    flex = new Flex(scrollFlex, x, y, x + w0, y + 0.07);
    styleButton(flex.div);
    centerText2(flex.div);
    flex.div.textEl.innerText = 'Do now';
    addButtonAction(flex.div, bind(function(j) {
      doAutoActionManually(j);
      closeAllDialogs();
    }, j));
    registerTooltip(flex.div, 'Do this action manually now. This ignores the action trigger, and does not affect when or whether the automaton will do this action. You can do it manually any time or multiple times indepdendently from the automaton. You can also configure the number keys to do these in the settings.');
    x += w1;

    y += h * 1.8;
  }
}

////////////////////////////////////////////////////////////////////////////////

function deleteEntireField() {
  setTab(tabindex_field);
  window.setTimeout(function() {
    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f;
        f = state.field[y][x];
        if(f.hasCrop() || f.index == FIELD_REMAINDER) {
          addAction({type:ACTION_DELETE, x:x, y:y, silent:true});
        }
      }
    }
    update();
  }, 333);
}

function deleteEtherealField() {
  var num_tried_delete = 0;
  var num_could_delete = 0;
  setTab(tabindex_field2);
  window.setTimeout(function() {
    for(var y = 0; y < state.numh2; y++) {
      for(var x = 0; x < state.numw2; x++) {
        var f = state.field2[y][x];
        if(f.hasCrop()) {
          num_tried_delete++;
          num_could_delete++;
          var c = f.getCrop();
          //if(c.type == CROPTYPE_AUTOMATON) continue;
          //if(c.type == CROPTYPE_SQUIRREL) continue;
          addAction({type:ACTION_DELETE2, x:x, y:y, silent:true});
        }
      }
    }
    var resin_before = Num(state.res.resin);
    update();
    var resin_after = state.res.resin;
    if(!num_tried_delete) {
      showMessage('Nothing to delete in ethereal field');
    } else if(num_tried_delete != num_could_delete) {
      showMessage('Deleted entire ethereal field, where possible');
    } else {
      showMessage('Deleted entire ethereal field.' + ' All resin refunded: ' + (resin_after.sub(resin_before).toString()));
    }
  }, 333);
}

function deleteInfinityField() {
  var num_deleted = 0;
  setTab(tabindex_field3);
  window.setTimeout(function() {
    for(var y = 0; y < state.numh3; y++) {
      for(var x = 0; x < state.numw3; x++) {
        var f = state.field3[y][x];
        if(f.hasCrop() || f.index == FIELD_REMAINDER) {
          num_deleted++;
          var c = f.getCrop();
          addAction({type:ACTION_DELETE3, x:x, y:y, silent:true});
        }
      }
    }
    var infseeds_before = Num(state.res.infseeds);
    update();
    var infseeds_after = state.res.infseeds;
    if(!num_deleted) {
      showMessage('Nothing to delete in infinity field');
    } else {
      showMessage('Deleted entire ethereal field.' + ' All infinity seeds refunded: ' + (infseeds_after.sub(infseeds_before).toString()));
    }
  }, 333);
}

////////////////////////////////////////////////////////////////////////////////

function updateAutomatonUI() {
  automatonFlex.clear();

  makeScrollable(automatonFlex);

  var h = 0.15;
  var y = 0;
  var x = 0;

  var buttons = [];

  var addButton = function(opt_dont_manage) {
    var h = 0.08;
    var flex  = new Flex(automatonFlex, x + 0.01, y, x + 0.4, y + h);
    y += h * 1.2;
    if(!opt_dont_manage) buttons.push(flex);
    return flex;
  };

  var addConfigButton = function(opt_dont_manage) {
    var h = 0.08;
    y -= h * 1.2;
    var flex  = new Flex(automatonFlex, [0.4, 0, 0.2, h], y, [0.4, 0, 1.2, h], y + h, FONT_BIG_BUTTON);
    y += h * 1.2;
    if(!opt_dont_manage) buttons.push(flex);
    styleButton(flex.div);
    centerText2_unicode(flex.div);
    setAriaLabel(flex.div, 'configure');
    flex.div.textEl.innerText = '⚙';
    flex.div.textEl.title = 'Configure';
    return flex;
  };

  var setButtonIndicationStyle = function(flex) {
    if(flex.enabledStyle != undefined) {
      if((state.automaton_enabled || flex.isGlobalButtonItself) && !(flex.extraConditionFun && !flex.extraConditionFun())) {
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
    var flex  = new Flex(automatonFlex, 0.01, y, 1, y + h);
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

  if(!haveAutomaton()) {
    texth = 0.1;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07);
    //flex.div.innerText = 'You must have an automaton in the ethereal field to use the automaton tab. Place automaton in ethereal field, or replace an existing ethereal field crop by automaton. This enables automation options, more special actions and it will also boost to its neighboring ethereal crops. Reach higher ethereal tree levels and beat new challenges to unlock more automation features.';
    flex.div.innerHTML = '<br><br>Place automaton in the ethereal field first to unlock the automation features of this tab. You can plant it there like any other ethereal crop.';
    y += 0.2;

    flex = addButton();
    styleButton(flex.div);
    centerText2(flex.div);
    flex.div.textEl.innerText = 'Go to ethereal field now';
    flex.div.style.textShadow = '0px 0px 5px #ff8';
    addButtonAction(flex.div, function() {
      setTab(tabindex_field2);
    });

    return;
  }

  //////////////////////////////////////////////////////////////////////////////

  var canvasFlex = new Flex(automatonFlex, [1, 0, -0.25], [0, 0, 0.01], [1, 0, -0.06], [0, 0, 0.2]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(images_automaton[4], canvas);
  styleButton0(canvasFlex.div, true);
  addButtonAction(canvasFlex.div, function() {
    showAutomatonFeatureSourceDialog();
  }, 'automaton icon');

  texth = 0.07;
  flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07);
  flex.div.innerText = 'Toggle on or off all automation:';
  y += texth;

  flex = addButton();
  styleButton0(flex.div);
  centerText2(flex.div);
  updateEnableButton(flex);
  addButtonAction(flex.div, bind(function(flex) {
    if(state.paused) {
      state.automaton_enabled = !state.automaton_enabled;
      updateEnableButton(flex);
      updateRightPane();
    } else {
      addAction({type:ACTION_TOGGLE_AUTOMATON, what:0, on:(!state.automaton_enabled), fun:function() {
        updateEnableButton(flex);
      }});
      update();
    }
  }, flex));
  flex.isGlobalButtonItself = true;
  flex.enabledStyle = true;

  //////////////////////////////////////////////////////////////////////////////
  addHR();
  //////////////////////////////////////////////////////////////////////////////


  var y0 = y;
  texth = 0.07;
  flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07);
  flex.div.innerText = 'Special actions:';
  y += texth;

  var y1 = y;

  flex = addButton();
  styleButton(flex.div);
  centerText2(flex.div);
  flex.div.textEl.innerText = 'Clear entire field';
  addButtonAction(flex.div, deleteEntireField);
  registerTooltip(flex.div, 'Immediately delete all crops from the entire field');

  flex = addButton();
  styleButton(flex.div);
  centerText2(flex.div);
  flex.div.textEl.innerText = 'Plant entire field...';
  addButtonAction(flex.div, bind(function() {
    setTab(tabindex_field);
    makePlantDialog(0, 0, false, false, true);
  }));
  registerTooltip(flex.div, 'Plant a chosen crop in all open spots in the field, as resources allow.');

  if(haveInfinityField()) {
    // if the clear infinity field button is also added, align this and ethereal one to the right instead of below the basic field related buttons
    x = 0.41;
    y = y1;
  }

  flex = addButton();
  styleButton(flex.div);
  centerText2(flex.div);
  flex.div.textEl.innerText = 'Clear ethereal field';
  flex.div.style.textShadow = '0px 0px 5px #ff8';
  addButtonAction(flex.div, deleteEtherealField);
  registerTooltip(flex.div, 'Delete all crops from the ethereal field. As usual, all resin is refunded. Note that this will also delete the automaton itself, so this will disable the automaton tab until you place it back.');

  if(haveInfinityField()) {
    flex = addButton();
    styleButton(flex.div);
    centerText2(flex.div);
    flex.div.textEl.innerText = 'Clear infinity field';
    flex.div.style.textShadow = '0px 0px 5px #88f';
    addButtonAction(flex.div, deleteInfinityField);
    registerTooltip(flex.div, 'Immediately delete all crops from the infinity field. All infinity seeds will be refunded as usual.');
    x = 0;
  }

  var text = undefined;
  if(!autoUpgradesUnlocked()) {
    text = 'Reach ethereal tree level 2 and beat the no upgrades challenge to unlock auto-upgrades and auto-choice';
  } else if(!autoUnlockUnlocked()) {
    text = 'Reach ethereal tree level 3 and beat the blackberry challenge to unlock auto-unlock of next-tier plants';
  } else if(!autoActionUnlocked()) {
    text = 'Reach ethereal tree level 5 and beat the wither challenge to unlock auto-action';
  }
  if(text != undefined) {
    flex = new Flex(automatonFlex, 0.5, y0 + texth, 0.9, y0 + texth * 3);
    flex.div.innerText = text;
    flex.div.className = 'efGoal';
  }


  //////////////////////////////////////////////////////////////////////////////
  if(autoUpgradesUnlocked() || autoChoiceUnlocked()) addHR();
  //////////////////////////////////////////////////////////////////////////////
  if(autoChoiceUnlocked()) {
    texth = 0.07;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07);
    flex.div.innerText = 'Automate choice upgrades:';
    registerTooltip(flex.div, 'Automate the choice upgrades that the tree drops at certain levels.\nThe choice is automatically made at the moment the corresponding upgrade unlocks, but not after the fact.');
    y += texth;


    var updateChoiceButton = function(flex) {
      var div = flex.div.textEl;
      if(state.automaton_autochoice) {
        div.innerText = 'Auto-choice on';
        flex.enabledStyle = 1;
      } else {
        div.innerText = 'Auto-choice off';
        flex.enabledStyle = 0;
      }
      setButtonIndicationStyle(flex);
    };

    flex = addButton();
    styleButton0(flex.div);
    centerText2(flex.div);
    updateChoiceButton(flex);
    addButtonAction(flex.div, bind(function(flex) {
      var automaton_autochoice_before = state.automaton_autochoice;
      if(state.paused) {
        state.automaton_autochoice = state.automaton_autochoice ? 0 : 1;
        updateChoiceButton(flex);
        updateRightPane();
      } else {
        addAction({type:ACTION_TOGGLE_AUTOMATON, what:4, on:(state.automaton_autochoice ? 0 : 1), fun:function() {
          updateChoiceButton(flex);
        }});
        update();
      }
      if(!automaton_autochoice_before) {
        var ok = false;
        for(var i = 0; i < state.automaton_choices.length; i++) {
          var v = state.automaton_choices[i];
          if(v > 1) {
            ok = true;
            break;
          }
        }
        if(!ok) {
          // if you turn on auto-choice, but every auto choice is configured to do nothing, show the dialog that is normally only shown by the smaller gear button
          showConfigureAutoChoiceDialog();
        }
      }
    }, flex));


    flex = addConfigButton();
    addButtonAction(flex.div, function() {
      showConfigureAutoChoiceDialog();
    });
  }


  if(autoUpgradesUnlocked()) {
    texth = 0.1;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07);
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
      if(state.paused) {
        state.automaton_autoupgrade = state.automaton_autoupgrade ? 0 : 1;
        updateUpgradeButton(flex);
        updateRightPane();
      } else {
        addAction({type:ACTION_TOGGLE_AUTOMATON, what:1, on:(state.automaton_autoupgrade ? 0 : 1), fun:function() {
          updateUpgradeButton(flex);
        }});
        update();
      }
    }, flex));

    flex = addConfigButton();
    addButtonAction(flex.div, function() {
      showConfigureAutoResourcesDialog(0);
    });

    texth = 0.1;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07);
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
  }

  //////////////////////////////////////////////////////////////////////////////
  addHR();
  //////////////////////////////////////////////////////////////////////////////

  if(autoPlantUnlocked()) {
    texth = 0.1;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07);
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
      if(state.paused) {
        state.automaton_autoplant = state.automaton_autoplant ? 0 : 1;
        updatePlantButton(flex);
        setButtonIndicationStyles();
        updateRightPane();
      } else {
        addAction({type:ACTION_TOGGLE_AUTOMATON, what:2, on:(state.automaton_autoplant ? 0 : 1), fun:function() {
          updatePlantButton(flex);
          setButtonIndicationStyles();
        }});
        update();
      }
    }, flex));

    flex = addConfigButton();
    addButtonAction(flex.div, function() {
      showConfigureAutoResourcesDialog(1);
    });

    texth = 0.1;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07);
    flex.div.innerText = 'Auto-plants done: ' + state.c_numautoplant;
    y += texth;
    var numflex = flex;
    var lastseennum = state.c_numautoplant;
    registerUpdateListener(function() {
      if(!numflex || !document.body.contains(numflex.div)) return false;
      if(lastseennum != state.c_numautoplant) {
        numflex.div.innerText = 'Auto-plants done: ' + state.c_numautoplant;
        lastseennum = state.c_numautoplant;
      }
      return true;
    });

    var updateAutoUnlockButton = function(flex) {
      var div = flex.div.textEl;
      if(state.automaton_autounlock) {
        div.innerText = 'Auto-unlock on';
        flex.enabledStyle = 1;
      } else {
        div.innerText = 'Auto-unlock off';
        flex.enabledStyle = 0;
      }
      setButtonIndicationStyle(flex);
    };

    if(autoUnlockUnlocked()) {
      flex = addButton();
      flex.extraConditionFun = function() {
        return !!state.automaton_autoplant;
      };
      styleButton0(flex.div);
      centerText2(flex.div);
      updateAutoUnlockButton(flex);
      addButtonAction(flex.div, bind(function(flex) {
        if(state.paused) {
          state.automaton_autounlock = state.automaton_autounlock ? 0 : 1;
          updateAutoUnlockButton(flex);
          updateRightPane();
        } else {
          addAction({type:ACTION_TOGGLE_AUTOMATON, what:3, on:(state.automaton_autounlock ? 0 : 1), fun:function() {
            updateAutoUnlockButton(flex);
          }});
          update();
        }
      }, flex));


      flex = addConfigButton();
      addButtonAction(flex.div, function() {
        showConfigureAutoResourcesDialog(2);
      });
    }
  }


  //////////////////////////////////////////////////////////////////////////////
  addHR();
  //////////////////////////////////////////////////////////////////////////////

  if(autoActionUnlocked()) {

    texth = 0.07;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07);
    flex.div.innerText = 'Automaton auto-action:';
    registerTooltip(flex.div, 'Allows to perform an action, such as override blueprint (overplant the field with a different chosen blueprint) at a configurable trigger condition (such as tree level reached).');
    y += texth;


    var updateAutoActionButton = function(flex) {
      var div = flex.div.textEl;
      if(state.automaton_autoaction == 0) {
        div.innerText = 'Auto-action off';
        flex.enabledStyle = 0;
      } else if(state.automaton_autoaction == 1) {
        div.innerText = 'Auto-action on';
        flex.enabledStyle = 1;
      } else {
        div.innerText = 'Auto-action temp off';
        flex.enabledStyle = 0;
      }
      setButtonIndicationStyle(flex);
    };

    flex = addButton();
    styleButton0(flex.div);
    centerText2(flex.div);
    updateAutoActionButton(flex);
    addButtonAction(flex.div, bind(function(flex) {
      var automaton_autoaction_before = state.automaton_autoaction;
      if(state.paused) {
        state.automaton_autoaction = ((state.automaton_autoaction == 1) ? 0 : 1);
        updateAutoActionButton(flex);
        updateRightPane();
      } else {
        addAction({type:ACTION_TOGGLE_AUTOMATON, what:5, on:((state.automaton_autoaction == 1) ? 0 : 1), fun:function() {
          updateAutoActionButton(flex);
        }});
        update();
      }
      if(!automaton_autoaction_before) {
        var ok = false;
        for(var i = 0; i < state.automaton_autoactions.length; i++) {
          var v = state.automaton_autoactions[i];
          // the > 0 checks are essentially a check that player has already enabled this in the past, but 0 are also valid values, so this is a bit of a heuristic to check if this is first time ever
          if(v.enable_blueprint || v.blueprint > 0 || v.enable_fruit || v.fruit > 0 || v.time > 0) {
            ok = true;
            break;
          }
        }
        if(!ok) {
          // if you turn on auto-override, but every auto override is configured to do nothing, show the dialog that is normally only shown by the smaller gear button
          showConfigureAutoActionDialog();
        }
      }
    }, flex));


    flex = addConfigButton();
    addButtonAction(flex.div, function() {
      showConfigureAutoActionDialog();
    });
  }

  //////////////////////////////////////////////////////////////////////////////
}

// Some of these help dialogs get unlocked by finishing a challenge, but challenges changed around in v0.5, and it's possible some dialogs will never get unlocked due to that. This function fixes the state of this.
function checkUnlockedAutomatonHelpDialogs() {
  if(!state.help_seen_text[28] && automatonUnlocked()) state.help_seen_text[28] = 28;
  if(!state.help_seen_text[31] && autoPlantUnlocked()) state.help_seen_text[31] = 31;
  if(!state.help_seen_text[29] && autoUpgradesUnlocked()) state.help_seen_text[29] = 29;
  if(!state.help_seen_text[30] && autoFinetuningUnlocked()) state.help_seen_text[30] = 30;
  if(!state.help_seen_text[33] && autoUnlockUnlocked()) state.help_seen_text[33] = 33;
  if(!state.help_seen_text[38] && autoPrestigeUnlocked()) state.help_seen_text[38] = 38;
  if(!state.help_seen_text[40] && autoActionUnlocked()) state.help_seen_text[40] = 40;
}

