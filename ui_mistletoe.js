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

// UI for the ethereal mistletoe

function getMistleInfoText(index, opt_multiline) {
  var separator = opt_multiline ? '<br><br>' : '. ';
  var m = mistletoeupgrades[index];
  var m2 = state.mistletoeupgrades[index];
  var done = m.onetime && m2.num;
  var tooltiptext = 'Upgrade: ' + m.name;
  if(done) {
    tooltiptext += separator + 'Upgrade completed (no further levels available)';
  } else {
    if(m2.time == 0) tooltiptext += separator + 'Time: ' + util.formatDuration(m.getTime());
    else tooltiptext += separator + 'Total time: ' + util.formatDuration(m.getTime(), true) + separator + 'Time left: ' + util.formatDuration(m.getTime() - m2.time, true, 4);
    var res = m.getResourceCost();
    if(res) {
      tooltiptext += separator + 'Resource cost: ' + res.toString();
      tooltiptext += ' (' /* + have: ' + Res.getMatchingResourcesOnly(res, state.res).toString() + ', '*/ + getCostAffordPercentage(res) + ')';
    }
    tooltiptext += separator + 'Current level: ' + toRomanUpTo(m2.num);
  }
  tooltiptext += separator + upper(m.description);
  if(m.index != mistle_upgrade_evolve) tooltiptext += separator + 'Unlocked at evolution level ' + m.evo;
  if(m.index == mistle_upgrade_evolve) {
    var next = etherealMistletoeNextEvolutionUnlockLevel();
    //if(next >= 0) tooltiptext += separator + 'Next new upgrade unlocks at evolution level: ' + toRomanUpTo(next) + ' (current level: ' + toRomanUpTo(haveEtherealMistletoeUpgrade(mistle_upgrade_evolve)) + ')';
    if(next >= 0) tooltiptext += separator + 'Next new upgrade unlocks at evolution level: ' + next + ' (current level: ' + haveEtherealMistletoeUpgrade(mistle_upgrade_evolve) + ')';
    else tooltiptext += separator + 'Next new upgrade unlocks at evolution level: N/A';
    tooltiptext += separator + 'Current evolution bonus: ' + getEtherealMistleToeBonusWithEvoString(m.index);
  } else if(m.bonus != undefined) {
    tooltiptext += separator + 'Current bonus: ' + getEtherealMistleToeBonusWithEvoString(m.index);
  }

  // the evolution upgrade
  if(index == 0 && opt_multiline) {
    var curr = getEtherealMistletoeEvolutionLevel();
    tooltiptext += '<br><br>';
    tooltiptext += 'List of upgrades unlocked by evolution level:<br>';
    var arr = [];
    for(var i = 0; i < registered_mistles.length; i++) {
      var m = mistletoeupgrades[registered_mistles[i]];
      if(m.evo > curr) continue;
      arr.push([m.evo, m.name]);
    }
    arr = arr.sort(function(a, b) {
      return a[0] - b[0];
    });
    for(var i = 0; i < arr.length; i++) {
      tooltiptext += arr[i][0] + ': ' + arr[i][1] + '<br>';
    }
  }

  return tooltiptext;
}

function makeEtherealMistletoeDialog(x, y) {
  var f = state.field2[y][x];
  var fd = field2Divs[y][x];

  var tree_ok = isNextToTree2(x, y, etherealMistletoeSupportsTreeDiagonal()) || etherealMistletoeCanGoAnywhere();

  // uses variables from below, defined here to allow using it at updatedialogfun of the dialog
  var updatecontent = function() {
    if(!tree_ok) return; // buttons etc... not created, so the below code will crash
    if(getEtherealMistletoeEvolutionLevel() != prev_evo) {
      // amount of visible updates changed, more update of all the HTML dialog needed, recreate it completely
      closeTopDialog();
      makeEtherealMistletoeDialog(x, y);
    }
    for(var i = 0; i < buttons.length; i++) {
      buttons[i].updatefun();
    }

    var text = '';
    if(state.mistletoeupgrade >= 0) {
      var m = mistletoeupgrades[state.mistletoeupgrade];
      var m2 = state.mistletoeupgrades[state.mistletoeupgrade];
      text += 'Upgrading: ' + upper(m.name);
      text += '<br>';
      var timeleft = m.getTime() - m2.time;
      text += 'Time left: ' + util.formatDuration(timeleft, true, 4);
    } else {
      text += 'Not upgrading';
    }
    if(state.mistletoeidletime) {
      text += '<br>Unused time: '  + util.formatDuration(state.mistletoeidletime, true);// + '. Collected when not upgrading. Makes upgrades go twice as fast.';
    } else {
      //text += '<br>Unused time: none.';
    }
    if(haveEtherealMistletoeUpgrade(mistle_upgrade_second_mistletoe) && state.crop2count[mistletoe2_0] < 2) {
      text += '<br><b>Note</b>: you can plant a second eth. mistletoe now!';
    }
    if(text != prevtext) textel.div.innerHTML = text;
    prevtext = text;
  };

  var c = crops2[f.cropIndex()];
  var dialog = createDialog({
    icon:c.image[4],
    title:'Ethereal mistletoe',
    bgstyle:'efDialogTranslucent',
    functions:[function() {makeField2Dialog(x, y, true); return true;}],
    names:['crop info'],
    scrollable:true,
    help:function(){showRegisteredHelpDialog(41, true);},
    cancelname:'close',
    updatedialogfun:updatecontent
  });


  var buttonpos = 0;
  var buttonh = 0.07;
  var buttonextraseparater = 0.015;

  var buttons = [];

  if(!tree_ok) {
    var replacebutton = new Flex(dialog.content, [0, 0, 0.2], [buttonpos, 0, 0.01], [1, 0, -0.2], buttonpos + buttonh).div;
    buttonpos += buttonh;
    styleButton(replacebutton);
    replacebutton.textEl.innerText = 'Replace crop';
    registerTooltip(replacebutton, 'Replace the crop with a new one you choose, same as delete then plant. Shows the list of unlocked ethereal crops.');
    addButtonAction(replacebutton, function() {
      makePlantDialog2(x, y, true, c.getRecoup());
    });
  }

  // of all the standard plant buttons, the delete button is also shown in the mistletoe dialog. Others can be accessed through the 'crop info' button at the bottom
  var deletebutton = new Flex(dialog.content, [0, 0, 0.2], [buttonpos, 0, 0.01], [1, 0, -0.2], buttonpos + buttonh).div;
  buttonpos += buttonh;
  styleButton(deletebutton);
  deletebutton.textEl.innerText = 'Delete crop';
  deletebutton.textEl.style.color = '#c00';
  registerTooltip(deletebutton, 'Delete crop, get ' + (cropRecoup2 * 100) + '% of the original resin cost back. Only works if deleting in ethereal field is currently possible. While deleted or not planted next to the tree, the mistletoe upgrades are paused.');
  addButtonAction(deletebutton, function() {
    addAction({type:ACTION_DELETE2, x:x, y:y});
    closeAllDialogs();
    update(); // do update immediately rather than wait for tick, for faster feeling response time
  });

  buttonpos += buttonextraseparater;

  if(!tree_ok) {
    var textel = new Flex(dialog.content, [0, 0, 0.2], [buttonpos, 0, 0.01], [1, 0, -0.2], 0.8);
    if(state.etherealmistletoetreepositionok) {
      textel.div.innerText = 'The ethereal mistletoe must be planted orthogonally (not diagonally) next to the tree, otherwise it does nothing and does not boost neighbors.'; // you still have another one next to the tree so upgrades not paused, but at least clearly indicate it still doesn't boost neighbors
    } else {
      textel.div.innerText = 'The ethereal mistletoe must be planted orthogonally (not diagonally) next to the tree, otherwise it does nothing. Its upgrades are currently paused.';
    }
    return;
  }

  // of all the standard plant buttons, the delete button is also shown in the mistletoe dialog. Others can be accessed through the 'crop info' button at the bottom
  var cancelbutton = new Flex(dialog.content, [0, 0, 0.2], [buttonpos, 0, 0.01], [1, 0, -0.2], buttonpos + buttonh).div;
  buttonpos += buttonh;
  styleButton(cancelbutton);
  cancelbutton.textEl.innerText = 'Stop current upgrade';
  registerTooltip(cancelbutton, 'Stops current ongoing upgrade, if there is one. The current time duration of the ongoing upgrade will be remembered, so if you start it again later it will continue where it left off. This also works if doing other upgrades in-between.');
  addButtonAction(cancelbutton, function() {
    addAction({type:ACTION_CANCEL_MISTLE_UPGRADE});
    update(); // do update immediately rather than wait for tick, for faster feeling response time
    updatecontent();
  });
  buttons.push(cancelbutton);
  cancelbutton.updatefun = function() {
    if(state.mistletoeupgrade < 0) {
      cancelbutton.textEl.style.color = '#888';
    } else {
      cancelbutton.textEl.style.color = '';
    }
  };

  var textel = new Flex(dialog.content, [0, 0, 0.2], [buttonpos, 0, 0.01], [1, 0, -0.2], 0.8);

  buttonpos += 0.12;

  var buttonh2 = 0.08;

  for(var i = 0; i < mistle_sort_order.length; i++) {
    var index = mistle_sort_order[i];
    //if(index == mistle_upgrade_resin) buttonpos += buttonextraseparater;
    if(!knowEtherealMistletoeUpgrade(index)) continue;
    var m = mistletoeupgrades[index];
    var m2 = state.mistletoeupgrades[index];

    var infobutton = new Flex(dialog.content, [1, 0, -0.19], [buttonpos + buttonh2 / 2, 0, -buttonh2 / 2], [1, 0, -0.19 + buttonh2], [buttonpos + buttonh2 / 2, 0, buttonh2 / 2]).div;
    styleButton0(infobutton, true);
    var infocanvas = createCanvas('0%', '0%', '100%', '100%', infobutton);
    renderImage(image_info, infocanvas);
    addButtonAction(infobutton, bind(function(index) {
      var m = mistletoeupgrades[index];
      var m2 = state.mistletoeupgrades[index];
      var dialog = createDialog({title:('Mistletoe upgrade "' + m.name + '" info')});
      dialog.content.div.innerHTML = getMistleInfoText(index, true);
    }, index));

    var button = new Flex(dialog.content, [0, 0, 0.2], [buttonpos, 0, 0.01], [1, 0, -0.2], buttonpos + buttonh2).div;
    buttonpos += buttonh2;
    //if(index == mistle_upgrade_evolve) buttonpos += buttonextraseparater;
    styleButton(button);
    addButtonAction(button, bind(function(index) {
      if(state.mistletoeupgrade == index) {
        addAction({type:ACTION_CANCEL_MISTLE_UPGRADE});
      } else {
        addAction({type:ACTION_MISTLE_UPGRADE, index});
      }
      update(); // do update immediately rather than wait for tick, for faster feeling response time
      updatecontent();
    }, m.index));
    var tooltipfun = bind(function(i, opt_multiline) {
      var index = mistle_sort_order[i];
      return getMistleInfoText(index, false);
    }, i);
    registerTooltip(button, tooltipfun);
    buttons.push(button);
    button.updatefun = bind(function(i, button_index) {
      var index = mistle_sort_order[i];
      var m = mistletoeupgrades[index];
      var m2 = state.mistletoeupgrades[index];
      var button = buttons[button_index];
      var res = m.getResourceCost();
      var buttontext = '<b>' + upper(m.name);
      if(!m.onetime) buttontext += ' ' + toRomanUpTo(m2.num + 1);
      buttontext += '</b>';

      if(!(m.onetime && m2.num)) {
        var timetext = (m2.time == 0) ? ('Time: ' + util.formatDuration(m.getTime(), true)) : ('Time left: ' + util.formatDuration(m.getTime() - m2.time, true, 4));
        if(res) buttontext += '. Cost: ' + res.toString() + ', ' + util.formatDuration(m.getTime() - m2.time, true);
        else buttontext += '. ' + timetext;
      } else if(m.onetime) {
        buttontext += ' (done)';
      }

      if(m.bonus != undefined) {
        var bonusname = 'bonus';
        if(m.effectname) bonusname = m.effectname;
        buttontext += '<br>';
        buttontext += upper(bonusname) + ': ' + getEtherealMistleToeBonusWithEvoString(index);
      }
      button.textEl.innerHTML = buttontext;
      if(state.mistletoeupgrade == index) {
        // the currently ongoing upgrade
        button.textEl.className = 'efButtonMistletoeOngoing';
      } else if(state.mistletoeupgrade >= 0) {
        button.textEl.className = 'efButtonMistletoeBusy';
      } else if(m.onetime && m2.num) {
        button.textEl.className = 'efButtonMistletoeBusy';
      } else {
        button.textEl.className = '';
      }
    }, i, buttons.length - 1);
    //button.updatefun();
  }

  buttonpos += buttonextraseparater;



  var textel2 = new Flex(dialog.content, [0, 0, 0.2], [buttonpos, 0, 0.01], [1, 0, -0.2], 0.8);
  var text2 = '';
  if(haveEtherealMistletoeUpgrade(mistle_upgrade_mistle_neighbor)) {
    text2 += '<br/>Boosting non-lotus neighbors orthogonally and diagonally: ' + (getEtherealMistletoeNeighborBoost().toPercentString()) + '<br/>';
  }
  if(haveEtherealMistletoeUpgrade(mistle_upgrade_lotus_neighbor)) {
    text2 += 'Boosting lotus neighbors orthogonally and diagonally: ' + (getEtherealMistletoeLotusNeighborBoost().toPercentString()) + '<br/>';
  }
  if(getEtherealMistletoeEvolutionLevel() > 0) {
    text2 += 'Evolution level: ' + (getEtherealMistletoeEvolutionLevel()) + '<br/>';
  }

  textel2.div.innerHTML = text2;

  // variables used in updatecontent()
  var prevtext = '';
  var prev_evo = getEtherealMistletoeEvolutionLevel();

  updatecontent();
}
