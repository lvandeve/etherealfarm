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

// subject: 0=auto upgrade, 1=auto plant, 2=auto unlock
function showConfigureAutoResourcesDialog(subject) {
  var title;
  if(subject == 0) title = 'Configure auto upgrade';
  else if(subject == 1) title = 'Configure auto plant';
  else if(subject == 2) title = 'Configure auto unlock';

  var helpindex = subject == 0 ? 29 : (subject == 1 ? 31 : 33);

  var dialog = createDialog({
    title:title,
    help:bind(showRegisteredHelpDialog, helpindex, false),
    scrollable:true});
  var scrollFlex = dialog.content;

  var advanced = autoFinetuningUnlocked();

  var texth = 0;
  var h = 0.06;
  var y = 0;

  var addButton = function() {
    var h = 0.06;
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
      typenames = ['berry', 'mushroom', 'flower', 'nettle', 'beehive', 'brassica'];
      order = [3, 4, 5, 6, 7, 2]; // translate from typenames index to index in state.automaton_autoupgrade_fraction
      if(squirrelUnlocked()) {
        typenames.push('nuts');
        order.push(9);
      }
      typenames.push('other');
      order.push(1);
      statefraction = state.automaton_autoupgrade_fraction;
    } else if(subject == 1 || subject == 2) {
      typenames = ['berry', 'mushroom', 'flower', 'nettle', 'beehive', 'mistletoe'];
      order = [3, 4, 5, 6, 7, 8]; // translate from typenames index to index in state.automaton_autoupgrade_fraction
      if(subject == 1) {
        typenames.push('brassica');
        order.push(2);
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
        y += h * 0.4;
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
      y += h * 0.5;
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

    y += h / 2;
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

function showConfigureAutoChoiceDialog(subject) {
  // temporary disable automaton_autochoice so it doesn't trigger while cycling through the button values
  var temp = state.automaton_autochoice;
  state.automaton_autochoice = 0;
  var dialog = createDialog({
    onclose:function() {
      state.automaton_autochoice = temp;
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
    var flex  = new Flex(scrollFlex, 0.01, y, 0.4, y + h);
    y += h * 1.2;
    return flex;
  };

  var addSideButton = function() {
    var h = 0.08;
    y -= h * 1.2; // undo height increase from previous button
    var flex  = new Flex(scrollFlex, 0.45, y, 0.45 + h, y + h);
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
    registerTooltip(flex.div, 'Configure automaton for this specific choice upgrade:<br><br><b>' + u.choicename_a + ':</b><br>' + u.description_a + '<br><br><b>' + u.choicename_b + ':</b><br>' + u.description_b + '<br><br><b>Manual:</b><br>Handle this upgrade manually instead of through the automaton.');

    flex = addSideButton();
    styleButton0(flex.div, true);
    var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(image_info, canvas);
    addButtonAction(flex.div, bind(function(i) {
      var u = upgrades[choiceupgrades[i]];
      var u2 = state.upgrades[choiceupgrades[i]];
      var dialog = createDialog({title:(u.name + ' info')});
      dialog.content.div.innerHTML = '<b>' + u.choicename_a + ':</b><br>' + u.description_a + '<br><br><b>' + u.choicename_b + ':</b><br>' + u.description_b + '<br><br><b>Manual:</b><br>Handle this upgrade manually instead of through the automaton.';
    }, i));
  }
}

function showAutomatonFeatureSourceDialog() {
  var dialog = createDialog({
    help:createAutomatonHelpDialog,
    title:'Automation features unlock sources',
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
  if(autoBlueprintsUnlocked()) {
    text += ' • Auto-blueprint override: wither challenge (ethereal tree level 5)';
    text += '<br/>';
  }
  if(autoPrestigeUnlocked()) {
    text += ' • Auto-prestige: truly basic challenge';
    text += '<br/>';
  }


  dialog.content.div.innerHTML = text;
}



function showConfigureAutoBlueprintDialog(subject) {
  // temporary disable automaton_autoblueprint so it doesn't trigger while cycling through the button values
  var temp = state.automaton_autoblueprint;
  state.automaton_autoblueprint = 0;
  var dialog = createDialog({
    onclose:function() {
      state.automaton_autoblueprint = temp;
    },
    scrollable:true,
    title:'Configure auto blueprint override',
    help:('Auto-blueprint lets the automaton override the field with another blueprint at a chosen tree level. ' + autoBlueprintHelp)
  });
  var scrollFlex = dialog.content;

  var texth = 0;
  var h = 0.06;
  var y = 0;

  var flex;


  texth = 0.15;
  flex  = new Flex(scrollFlex, 0.01, y, 1, y + 0.07);
  flex.div.innerText = 'Choose at which tree level to override with which blueprint';
  y += texth;

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

  var num = autoBlueprintsUnlocked();

  for(var j = 0; j < num; j++) {
    // toggle button disabled if num is 1, since there's only one auto-override action for now, the global enable/disable already does this
    if(num > 1) {
      flex = addControl();
      flex.div.innerHTML = '<br>Auto-blueprint ' + (j + 1) + ':';
      flex.div.style.vAlign = 'bottom';

      flex = addControl();
      styleButton0(flex.div);
      centerText2(flex.div);
      flex.div.textEl.innerText = 'toggle';
      addButtonAction(flex.div, bind(function(flex, j) {
        state.automaton_autoblueprints[j].enabled = !state.automaton_autoblueprints[j].enabled;
        updateToggleButton(flex, state.automaton_autoblueprints[j].enabled);
      }, flex, j));
      updateToggleButton(flex, state.automaton_autoblueprints[j].enabled);
    }

    flex = addControl();
    styleButton0(flex.div);
    centerText2(flex.div);
    var updateLevelButton = bind(function(flex, j) {
      updateToggleButton(flex, true);
      flex.div.textEl.innerText = 'At tree level: ' + state.automaton_autoblueprints[j].level;
    }, flex, j);
    addButtonAction(flex.div, bind(function(flex, j, updateLevelButton) {
      makeTextInput('Tree level', 'Enter tree level at which to perform blueprint override', function(text) {
        var i = parseInt(text);
        if(!(i >= 0 && i < 1000000)) i = 0;
        state.automaton_autoblueprints[j].level = i;
        updateLevelButton();
      }, '' + state.automaton_autoblueprints[j].level);
    }, flex, j, updateLevelButton));
    updateLevelButton();


    flex = addControl();
    styleButton0(flex.div);
    centerText2(flex.div);
    var updateBlueprintButton = bind(function(flex, j) {
      updateToggleButton(flex, true);
      var i = state.automaton_autoblueprints[j].blueprint;
      if(i == 0) {
        flex.div.textEl.innerText = 'Chosen blueprint: none';
      } else {
        var b = state.blueprints[i - 1];
        var empty = !b || (b.data.length == 0);
        flex.div.textEl.innerText = 'Chosen blueprint: [' + i + '] ' + (empty ? '[empty]' : b.name);
      }
    }, flex, j);
    addButtonAction(flex.div, bind(function(flex, j, updateBlueprintButton) {
      createBlueprintsDialog(undefined, undefined, undefined, function(index) {
        state.automaton_autoblueprints[j].blueprint = index + 1;
        updateBlueprintButton();
      });
    }, flex, j, updateBlueprintButton));
    updateBlueprintButton();
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
        if(f.hasCrop()) {
          addAction({type:ACTION_DELETE, x:x, y:y, silent:true});
        }
      }
    }
    update();
  }, 333);
}

function deleteEtherealField() {
  var candelete = canEtherealDelete();
  var num_tried_delete = 0;
  var num_could_delete = 0;
  setTab(tabindex_field2);
  window.setTimeout(function() {
    for(var y = 0; y < state.numh2; y++) {
      for(var x = 0; x < state.numw2; x++) {
        var f = state.field2[y][x];
        if(f.hasCrop()) {
          num_tried_delete++;
          if(!candelete && !freeDelete2(x, y)) continue;
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
      if(num_could_delete == 0) {
        showMessage('Couldn\'t yet clear ethereal field: must wait ' + util.formatDuration(getEtherealDeleteWaitTime()) + '. ' + etherealDeleteExtraInfo, C_INVALID, 0, 0);
      } else {
        showMessage('Deleted entire ethereal field, where possible');
      }
    } else {
      showMessage('Deleted entire ethereal field.' + ' All resin refunded: ' + (resin_after.sub(resin_before).toString()));
    }
  }, 333);
}

////////////////////////////////////////////////////////////////////////////////

function updateAutomatonUI() {
  automatonFlex.clear();

  makeScrollable(automatonFlex);

  var h = 0.15;
  var y = 0;

  var buttons = [];

  var addButton = function(opt_dont_manage) {
    var h = 0.08;
    var flex  = new Flex(automatonFlex, 0.01, y, 0.4, y + h);
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

    /*flex = addButton();
    styleButton(flex.div);
    centerText2(flex.div);
    flex.div.textEl.innerText = 'Clear entire field';
    addButtonAction(flex.div, deleteEntireField);
    registerTooltip(flex.div, 'Immediately delete all crops from the entire field');*/

    /*flex = addButton();
    styleButton(flex.div);
    centerText2(flex.div);
    flex.div.textEl.innerText = 'Clear ethereal field';
    flex.div.style.textShadow = '0px 0px 5px #ff8';
    addButtonAction(flex.div, deleteEtherealField);
    registerTooltip(flex.div, 'Delete all crops from the ethereal field. Only succeeds if deleting is possible at this time. As usual, all resin is refunded. Note that this will also delete the automaton itself, so this will disable the automaton tab until you place the automaton back.');*/

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

  flex = addButton();
  styleButton(flex.div);
  centerText2(flex.div);
  flex.div.textEl.innerText = 'Clear ethereal field';
  flex.div.style.textShadow = '0px 0px 5px #ff8';
  addButtonAction(flex.div, deleteEtherealField);
  registerTooltip(flex.div, 'Delete all crops from the ethereal field. Only succeeds if deleting is possible at this time. As usual, all resin is refunded. Note that this will also delete the automaton itself, so this will disable the automaton tab until you place the automaton back.');

  var text = undefined;
  if(!autoUpgradesUnlocked()) {
    text = 'Reach ethereal tree level 2 and beat the no upgrades challenge to unlock auto-upgrades';
  } else if(!autoUnlockUnlocked()) {
    text = 'Reach ethereal tree level 3 and beat the blackberry challenge to unlock auto-unlock of next-tier plants';
  } else if(!autoBlueprintUnlocked()) {
    text = 'Reach ethereal tree level 5 and beat the wither challenge to unlock auto-blueprint override';
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

  if(autoBlueprintUnlocked()) {

    texth = 0.07;
    flex  = new Flex(automatonFlex, 0.01, y, 1, y + 0.07);
    flex.div.innerText = 'Auto-blueprint override at condition:';
    registerTooltip(flex.div, 'Allows to override blueprint (overplant the field with a different chosen blueprint) at a configurable condition (tree level reached).');
    y += texth;


    var updateOverrideButton = function(flex) {
      var div = flex.div.textEl;
      if(state.automaton_autoblueprint) {
        div.innerText = 'Auto blueprint override on';
        flex.enabledStyle = 1;
      } else {
        div.innerText = 'Auto blueprint override off';
        flex.enabledStyle = 0;
      }
      setButtonIndicationStyle(flex);
    };

    flex = addButton();
    styleButton0(flex.div);
    centerText2(flex.div);
    updateOverrideButton(flex);
    addButtonAction(flex.div, bind(function(flex) {
      var automaton_autoblueprint_before = state.automaton_autoblueprint;
      if(state.paused) {
        state.automaton_autoblueprint = state.automaton_autoblueprint ? 0 : 1;
        if(state.automaton_autoblueprint && !state.automaton_autoblueprints[0].enabled) {
          // if you have only 1, the nested 'enabled' setting of it is not visible, ensure it's not accidently false due to some bug
          if(autoBlueprintsUnlocked() == 1) state.automaton_autoblueprints[0].enabled = true;
        }
        updateOverrideButton(flex);
        updateRightPane();
      } else {
        addAction({type:ACTION_TOGGLE_AUTOMATON, what:5, on:(state.automaton_autoblueprint ? 0 : 1), fun:function() {
          updateOverrideButton(flex);
        }});
        update();
      }
      if(!automaton_autoblueprint_before) {
        var ok = false;
        for(var i = 0; i < state.automaton_autoblueprints.length; i++) {
          var v = state.automaton_autoblueprints[i];
          if(v.blueprint > 0) {
            ok = true;
            break;
          }
        }
        if(!ok) {
          // if you turn on auto-override, but every auto override is configured to do nothing, show the dialog that is normally only shown by the smaller gear button
          showConfigureAutoBlueprintDialog();
        }
      }
    }, flex));


    flex = addConfigButton();
    addButtonAction(flex.div, function() {
      showConfigureAutoBlueprintDialog();
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
  if(!state.help_seen_text[40] && autoBlueprintUnlocked()) state.help_seen_text[40] = 40;
}
