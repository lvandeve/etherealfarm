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


var field2Divs;
var field2Rows;



// get crop info in HTML
function getCropInfoHTML2(f, c, opt_detailed) {
  var result = 'Ethereal ' + c.name;
  result += '<br/>';
  result += 'Crop type: ' + getCropTypeName(c.type) + ((c.tier && c.isReal()) ? (' (tier ' + (c.tier + 1) + ')') : '');
  result += '<br/>';

  if(c.istemplate) {
    result += '<br/><br/>This template represents all crops of type ' + getCropTypeName(c.type);
    result += '<br/><br/>It is a placeholder for planning the field layout and does nothing.';
    result += '<br><br>Templates are a feature provided by the automaton.';
    result += '<br><br>Tip: ctrl+shift+click, or press "u", on a template to turn it into a crop of highest available tier of this type';

    return result;
  }

  if(f.growth < 1) {
    result += 'Growing. Time to grow left: ' + util.formatDuration((1 - f.growth) * c.getPlantTime(), true, 4, true);
    result += '<br/><br/>';
  }

  if(c.effect_description_long) {
    result += 'Effect: ' + c.effect_description_long + '<br/>';
  } else if(c.effect_description_short) {
    result += 'Effect: ' + c.effect_description_short + '<br/>';
  }

  if(c.index == mistletoe2_0) {
    var m = mistletoeupgrades[state.mistletoeupgrade];
    var m2 = state.mistletoeupgrades[state.mistletoeupgrade];
    if(m) {
      var t = m.getTime() - m2.time;
      result += '<br/>Upgrade time left: ' + util.formatDuration(t, true, 4) + '<br/>';
    } else {
      result += '<br/>Not upgrading<br/>';
    }
  }

  if(c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH || c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_STINGING || c.type == CROPTYPE_BEE) {
    var total = c.getBasicBoost(f);
    result += '<br/>';
    result += 'Boost amount: ' + total.toPercentString();
    result += '<br/>';
  }

  var automaton = c.index == automaton2_0;
  var squirrel = c.index == squirrel2_0;
  var mistletoe = c.index == mistletoe2_0;

  if(f.growth >= 1) {
    if(c.boost.neqr(0)) {
      result += '<br/>Boosting neighbors: ' + (c.getEtherealBoost(f).toPercentString()) + '<br/>';
    }
    if(automaton) {
      result += '<br/>Boosting non-lotus neighbors orthogonally and diagonally: ' + (getEtherealAutomatonNeighborBoost().toPercentString()) + '<br/>';
    }
    if(squirrel) {
      result += '<br/>Boosting non-lotus neighbors orthogonally and diagonally: ' + (getEtherealSquirrelNeighborBoost().toPercentString()) + '<br/>';
    }
    if(mistletoe && haveEtherealMistletoeUpgrade(mistle_upgrade_neighbor)) {
      result += '<br/>Boosting non-lotus neighbors orthogonally and diagonally: ' + (getEtherealMistletoeBonus(mistle_upgrade_neighbor).toPercentString()) + '<br/>';
    }
  }


  if(opt_detailed) {
    result += '<br/>';
    result += 'Num planted of this type: ' + state.crop2count[c.index];
    result += '<br/>';
  }

  var refund_text = cropRecoup2 == 1 ? 'full refund' : ((cropRecoup2 * 100) + '%');
  var upgrade_cost = [undefined];
  var upgrade_crop = getUpgradeCrop2(f.x, f.y, upgrade_cost);

  if(automaton || squirrel || mistletoe) {
    result += '<br/>• Cost: ' + c.cost.toString();
    result += '<br/>• Recoup on delete (d): ' + c.getCost(-1).mulr(cropRecoup2).toString() + ' (' + refund_text + ')';
  } else if(!opt_detailed) {
    result += '<br/>• Next planting cost (p): ' + c.getCost().toString() + ' (' + getCostAffordTimer(c.getCost()) + ')';
    result += '<br/>• Recoup on delete (d): ' + c.getCost(-1).mulr(cropRecoup2).toString() + ' (' + refund_text + ')';
    if(upgrade_crop && upgrade_cost[0]) {
      var temp = '<br/>• Next tier cost (u): ' + upgrade_cost[0].toString() + ' (' + getCostAffordTimer(upgrade_cost[0]) + ')';
      if(!upgrade_cost[1]) temp = '<b>' + temp + '</b>';
      result += temp;
    } else {
      result += '<br/>• Next tier cost (u): ?';
    }
  } else {
    result += '<br/>Cost: ';
    if(opt_detailed) result += '<br/>• Base planting cost: ' + c.cost.toString();
    result += '<br/>• Next planting cost: ' + c.getCost().toString() + ' (' + getCostAffordTimer(c.getCost()) + ')';
    result += '<br/>• Last planting cost: ' + c.getCost(-1).toString();
    result += '<br/>• Recoup on delete: ' + c.getCost(-1).mulr(cropRecoup2).toString() + ' (' + refund_text + ')';
    if(upgrade_crop && upgrade_cost[0]) {
      result += '<br/>• Next tier cost:' + upgrade_cost[0].toString() + ' (' + getCostAffordTimer(upgrade_cost[0]) + ')';
    } else {
      result += '<br/>• Next tier cost: ?';
    }
  }


  result += '<br><br>Ethereal tree level that unlocked this crop: ' + c.treelevel2;

  return result;
}


function getCropInfoHTML2Breakdown(f, c) {
  var result = '';

  if(c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH || c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_STINGING || c.type == CROPTYPE_BEE) {
    var breakdown = [];
    var total = c.getBasicBoost(f, breakdown);
    result += formatBreakdown(breakdown, true, 'Breakdown (boost to basic field)');
  }

  return result;
}

// opt_cost is output variable that contains the cost and a boolean that tells if it's too expensive
function getUpgradeCrop2(x, y, opt_cost) {
  if(!state.field2[y]) return null;
  var f = state.field2[y][x];
  if(!f) return null;
  var c = f.getCrop();
  if(!c) return null;

  if(c.type == CROPTYPE_CHALLENGE) return null;
  var tier = state.highestoftype2unlocked[c.type];

  var recoup = c.getRecoup();

  var c2 = null;

  for(;;) {
    if(tier <= c.tier) break; // not an upgrade
    if(tier < 0) break;

    var c3 = croptype2_tiers[c.type][tier];
    if(!c3 || !state.crops2[c3.index].unlocked) break; // normally cannot happen that a lower tier crop is not unlocked

    var cost = c3.getCost().sub(recoup);
    if(opt_cost != undefined) {
      opt_cost[0] = cost;
      c2 = c3;
    }

    if(cost.le(state.res)) {
      // found a successful upgrade
      if(opt_cost != undefined) opt_cost[1] = false;
      break;
    } else {
      if(opt_cost != undefined) opt_cost[1] = true;
    }

    tier--;
  }

  return c2;
}

function getDowngradeCrop2(x, y, opt_cost) {
  if(!state.field2[y]) return null;
  var f = state.field2[y][x];
  if(!f) return null;
  var c = f.getCrop();
  if(!c) return null;

  if(c.type == CROPTYPE_CHALLENGE) return null;
  var tier = c.tier - 1;

  var recoup = c.getRecoup();

  var c2 = null;

  if(tier < -1) return null;

  var c3 = croptype2_tiers[c.type][tier];
  if(!c3 || !state.crops2[c3.index].unlocked) return null;

  var cost = c3.getCost().sub(recoup);
  if(opt_cost != undefined) {
    opt_cost[0] = cost;
    c2 = c3;
  }

  // since it's a downgrade it should always be affordable, but this is done for condistency with getUpgradeCrop2
  if(cost.le(state.res)) {
    if(opt_cost != undefined) opt_cost[1] = false;
  } else {
    if(opt_cost != undefined) opt_cost[1] = true;
  }

  return c2;
}

function makeUpgradeCrop2Action(x, y, opt_silent) {
  var too_expensive = [undefined];
  var c2 = getUpgradeCrop2(x, y, too_expensive);

  if(c2 && !too_expensive[1]) {
    addAction({type:ACTION_REPLACE2, x:x, y:y, crop:c2, shiftPlanted:true});
    return true;
  } else {
    if(!opt_silent) {
      if(too_expensive[1]) {
        showMessage('not enough resources for next crop tier: have ' + Res.getMatchingResourcesOnly(too_expensive[0], state.res).toString() +
            ', need ' + too_expensive[0].toString(), C_INVALID, 0, 0);
      } else if(!(x >= 0 && x < state.numw2 && y >= 0 && y < state.numh2) || state.field2[y][x].index < CROPINDEX) {
        showMessage('No crop to tier up here. Move mouse cursor over a crop and press u to upgrade it to the next tier', C_INVALID);
      } else {
        showMessage('Crop not replaced, no higher tier unlocked or available', C_INVALID);
      }
    }
  }
  return true;
}

function makeDowngradeCrop2Action(x, y, opt_silent) {
  var too_expensive = [undefined];
  var c2 = getDowngradeCrop2(x, y, too_expensive);

  if(c2 && !too_expensive[1]) {
    addAction({type:ACTION_REPLACE2, x:x, y:y, crop:c2, shiftPlanted:true});
  } else if(c2 && too_expensive[1]) {
    // TODO: instead go to an even lower tier?
    showMessage('not enough resources for lower crop tier: have ' + Res.getMatchingResourcesOnly(too_expensive[0], state.res).toString() + ', need ' + too_expensive[0].toString() + '. This can happen if you have a lot of the lower tier crop planted.', C_INVALID, 0, 0);
  } else if(!c2) {
    showMessage('Crop not replaced, no lower tier available', C_INVALID);
  }
  return true;
}

function makeTree2Dialog() {
  var div;

  var have_buttons = automatonUnlocked();

  var dialog = createDialog({
    nocancel:have_buttons,
    scrollable:false,
    narrow:true,
    title:'Tree',
    bgstyle:'efDialogTranslucent'
  });
  var contentFlex = dialog.content;

  var flex = new Flex(dialog.icon, 0, 0, 1, 1);
  var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(tree_images[treeLevelIndex(state.treelevel2)][1][4], canvas);
  flex = new Flex(dialog.icon, 0, 1, 1, 2);
  canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(tree_images[treeLevelIndex(state.treelevel2)][2][4], canvas);

  var ypos = 0;
  var ysize = 0.1;

  var f0 = new Flex(contentFlex, 0, 0, 1, 0.65);
  makeScrollable(f0);
  var f1 = new Flex(contentFlex, 0, 0.67, 1, 1);

  var text = '';

  if(state.treelevel2 > 0) {
    text += '<b>Ethereal tree level ' + state.treelevel2 + '</b>';
  } else {
    text += '<b>Ethereal tree</b>';
  }
  text += '<br><br>';

  var twigs_req = treeLevel2Req(state.treelevel2 + 1);
  text += '<b>Twigs required for next level: </b>' + (twigs_req.twigs.sub(state.res.twigs)).toString() + ' (total: ' + twigs_req.toString() + ')';
  if(state.treelevel2 > 0 && state.treelevel2 <= 5 && state.cropcount[mistletoe_0] == 0 && state.challenge == 0) {
    text += '<br><font color="red">You must plant mistletoe(s) in the basic field to get twigs to level up the ethereal tree and progress the game</font>';
  }
  text += '<br><br>';

  if(state.treelevel2 > 0) {
    text += '<b>Resin production bonus to basic tree: </b>' + treelevel2_resin_bonus.mulr(state.treelevel2).toPercentString();
    text += '<br><br>';
  }

  text += '<b>Total resin earned entire game: </b>' + state.g_res.resin.toString();
  text += '<br/><br/>';

  text += '<b>Ethereal boosts from crops on this field to basic field:</b><br>';
  text += '• starter resources: ' + getStarterResources().toString() + '<br>';
  text += '• berry boost: ' + state.ethereal_berry_bonus.toPercentString() + '<br>';
  text += '• mushroom boost: ' + state.ethereal_mush_bonus.toPercentString() + '<br>';
  text += '• flower boost: ' + state.ethereal_flower_bonus.toPercentString() + '<br>';
  if(state.ethereal_nettle_bonus.neqr(0)) text += '• stinging boost: ' + state.ethereal_nettle_bonus.toPercentString() + '<br>';
  if(state.ethereal_bee_bonus.neqr(0)) text += '• bee boost: ' + state.ethereal_bee_bonus.toPercentString() + '<br>';
  text += '<br><br>';

  f0.div.innerHTML = text;

  var y = 0.05;
  var h = 0.15;
  // finetune the width of the buttons in flex f1
  var button0 = 0.15;
  var button1 = 0.85;
  var buttonshift = h * 1.15;

  if(automatonUnlocked()) {
    var button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Ethereal blueprints';
    //button.textEl.style.boxShadow = '0px 0px 5px #44f';
    button.textEl.style.textShadow = '0px 0px 5px #008';
    addButtonAction(button, function() {
      closeAllDialogs();
      createBlueprintsDialog(undefined, undefined, true);
    });
  }

  if(state.treelevel2 > 0) {
    var button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'See previous unlocks';
    addButtonAction(button, function() {
      showEtherealTreeLevelDialogs();
    });
    registerTooltip(button, 'Show the things that got unlocked by reaching previous ethereal tree levels');
  }

  if(have_buttons) {
    button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Back';
    addButtonAction(button, function() {
      dialog.cancelFun();
    });
  }
}

function makeEtherealMistletoeDialog(x, y) {
  var f = state.field2[y][x];
  var fd = field2Divs[y][x];

  var c = crops2[f.cropIndex()];
  var dialog = createDialog({
    icon:c.image[4],
    title:'Ethereal mistletoe',
    bgstyle:'efDialogTranslucent',
    functions:[function() {makeField2Dialog(x, y, true); return true;}],
    names:['crop info'],
    scrollable:true,
    help:function(){showRegisteredHelpDialog(41, true);},
    cancelname:'close'
  });

  if(!state.etherealmistletoenexttotree) {
    dialog.content.div.innerText = 'The ethereal mistletoe must be planted orthogonally (not diagonally) next to the tree, otherwise it does nothing. Its upgrades are currently paused.';
    return;
  }


  var buttonpos = 0;
  var buttonh = 0.07;
  var buttonextraseparater = 0.01;

  var buttons = [];

  // of all the standard plant buttons, the delete button is also shown in the mistletoe dialog. Others can be accessed through the 'crop info' button at the bottom
  var deletebutton = new Flex(dialog.content, [0, 0, 0.2], [buttonpos, 0, 0.01], [1, 0, -0.2], buttonpos + buttonh).div;
  buttonpos += buttonh;
  styleButton(deletebutton);
  deletebutton.textEl.innerText = 'Delete crop';
  deletebutton.textEl.style.color = '#c00';
  if(!canEtherealDelete() && !freeDelete2(x, y)) deletebutton.textEl.style.color = '#888';
  registerTooltip(deletebutton, 'Delete crop, get ' + (cropRecoup2 * 100) + '% of the original resin cost back. Only works if deleting in ethereal field is currently possible. While deleted or not planted next to the tree, the mistletoe upgrades are paused.');
  addButtonAction(deletebutton, function() {
    addAction({type:ACTION_DELETE2, x:x, y:y});
    closeAllDialogs();
    update(); // do update immediately rather than wait for tick, for faster feeling response time
  });

  buttonpos += buttonextraseparater;

  for(var i = 0; i < registered_mistles.length; i++) {
    var index = registered_mistles[i];
    if(index == mistle_upgrade_resin) buttonpos += buttonextraseparater;
    if(!knowEtherealMistletoeUpgrade(index)) continue;
    var m = mistletoeupgrades[index];
    var m2 = state.mistletoeupgrades[index];
    var button = new Flex(dialog.content, [0, 0, 0.2], [buttonpos, 0, 0.01], [1, 0, -0.2], buttonpos + buttonh).div;
    buttonpos += buttonh;
    if(index == mistle_upgrade_evolve) buttonpos += buttonextraseparater;
    styleButton(button);
    addButtonAction(button, bind(function(index) {
      addAction({type:ACTION_MISTLE_UPGRADE, index});
      update(); // do update immediately rather than wait for tick, for faster feeling response time
      updatecontent();
    }, m.index));
    var tooltipfun = bind(function(i) {
      var index = registered_mistles[i];
      var m = mistletoeupgrades[index];
      var m2 = state.mistletoeupgrades[index];
      var tooltiptext = 'Upgrade: ' + m.name;
      if(m2.time == 0) tooltiptext += '. Time: ' + util.formatDuration(m.getTime());
      else tooltiptext += '. Total time: ' + util.formatDuration(m.getTime(), true) + '. Time left: ' + util.formatDuration(m.getTime() - m2.time, true, 4);
      var res = m.getResourceCost();
      if(res) {
        tooltiptext += '. Resource cost: ' + res.toString();
        tooltiptext += ' (' /* + have: ' + Res.getMatchingResourcesOnly(res, state.res).toString() + ', '*/ + getCostAffordPercentage(res) + ')';
      }
      tooltiptext += '. Current level: ' + toRomanUpTo(m2.num) + '. ' + upper(m.description);
      if(m.index != mistle_upgrade_evolve) tooltiptext += '. Unlocked at evolution level ' + toRomanUpTo(m.evo);
      if(m.index == mistle_upgrade_evolve) {
        var next = etherealMistletoeNextEvolutionUnlockLevel();
        //if(next >= 0) tooltiptext += '. Next new upgrade unlocks at evolution level: ' + toRomanUpTo(next) + ' (current level: ' + toRomanUpTo(haveEtherealMistletoeUpgrade(mistle_upgrade_evolve)) + ')';
        if(next >= 0) tooltiptext += '. Next new upgrade unlocks at evolution level: ' + next + ' (current level: ' + haveEtherealMistletoeUpgrade(mistle_upgrade_evolve) + ')';
        else tooltiptext += '. Next new upgrade unlocks at evolution level: N/A';
      }
      return tooltiptext;
    }, i);
    var tooltiptext = tooltipfun();
    // if there's a resource cost, the tooltip could change after doing the upgrade and keeping the window open long enough, so make it dynamic function based tooltip text in that case
    if(m.getResourceCost()) tooltiptext = tooltipfun;
    registerTooltip(button, tooltiptext);
    buttons.push(button);
    button.updatefun = bind(function(i, button_index) {
      var index = registered_mistles[i];
      var m = mistletoeupgrades[index];
      var m2 = state.mistletoeupgrades[index];
      var button = buttons[button_index];
      var res = m.getResourceCost();
      var buttontext = '<b>' + upper(m.name) + ' ' + toRomanUpTo(m2.num + 1) + '</b>';
      var timetext = (m2.time == 0) ? ('Time: ' + util.formatDuration(m.getTime(), true)) : ('Time left: ' + util.formatDuration(m.getTime() - m2.time, true, 4));
      if(res) buttontext += '. Cost: ' + res.toString() + ', ' + util.formatDuration(m.getTime() - m2.time, true);
      else buttontext += '. ' + timetext;
      button.textEl.innerHTML = buttontext;
      if(state.mistletoeupgrade >= 0) {
        button.textEl.style.color = '#888';
      } else {
        button.textEl.style.color = '';
      }
    }, i, buttons.length - 1);
    //button.updatefun();
  }

  buttonpos += buttonextraseparater;

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


  var prevtext = '';

  var prev_evo = state.mistletoeupgrades[mistle_upgrade_evolve].num;

  var updatecontent = function() {
    if(state.mistletoeupgrades[mistle_upgrade_evolve].num != prev_evo) {
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
      text += 'Upgrading: ' + m.name + '. ' + upper(m.description);
      text += '<br><br>';
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
    //text += '<br>Total time: '  + util.formatDuration(state.g_mistletoeupgradetime, true);
    text += '<br><br>';
    text += '<b>Current bonuses:</b>';
    if(knowEtherealMistletoeUpgrade(mistle_upgrade_prod)) text += '<br>Production: ' + getEtherealMistletoeBonus(mistle_upgrade_prod).toPercentString();
    if(knowEtherealMistletoeUpgrade(mistle_upgrade_neighbor)) text += '<br>Neighbor: ' + getEtherealMistletoeBonus(mistle_upgrade_neighbor).toPercentString();
    if(knowEtherealMistletoeUpgrade(mistle_upgrade_stingy)) text += '<br>Stingy: ' + getEtherealMistletoeBonus(mistle_upgrade_stingy).toPercentString();
    if(knowEtherealMistletoeUpgrade(mistle_upgrade_resin)) text += '<br>Resin: ' + getEtherealMistletoeBonus(mistle_upgrade_resin).toPercentString();
    text += '<br>Twigs: ' + getEtherealMistletoeBonus(mistle_upgrade_twigs).toPercentString();
    text += '<br><br>';
    text += 'Evolution bonus (already included in above bonuses): ' + getEtherealMistletoeEvolutionBonus().toPercentString();
    if(text != prevtext) textel.div.innerHTML = text;
    prevtext = text;
  };

  updatecontent();
  updatedialogfun = updatecontent;
}

function makeField2Dialog(x, y, opt_override_mistletoe) {
  var f = state.field2[y][x];
  var fd = field2Divs[y][x];

  if(f.hasCrop() && f.getCrop().index == mistletoe2_0 && !opt_override_mistletoe) {
    makeEtherealMistletoeDialog(x, y);
  } else if(f.hasCrop()) {
    var c = crops2[f.cropIndex()];
    var div;

    var dialog = createDialog({
      icon:c.image[4],
      title:'Ethereal crop info',
      bgstyle:'efDialogTranslucent'
    });

    var buttonshift = 0;

    var flex0 = new Flex(dialog.content, 0, [0, 0, 0.01], 1, 0.17);
    var button0 = new Flex(dialog.content, [0, 0, 0.2], [0.63 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.695 + buttonshift).div;
    var button1 = new Flex(dialog.content, [0, 0, 0.2], [0.7 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.765 + buttonshift).div;
    var button2 = new Flex(dialog.content, [0, 0, 0.2], [0.77 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.835 + buttonshift).div;
    var button3 = new Flex(dialog.content, [0, 0, 0.2], [0.84 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.905 + buttonshift).div;
    var button4 = new Flex(dialog.content, [0, 0, 0.2], [0.91 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.975 + buttonshift).div;
    var last0 = undefined;

    styleButton(button0);
    button0.textEl.innerText = 'Tier up';
    registerTooltip(button0, 'Replace crop with the highest tier of this type you can afford, or turn template into real crop. This deletes the original crop, (with cost recoup if applicable), and then plants the new higher tier crop.');
    addButtonAction(button0, function() {
      if(makeUpgradeCrop2Action(x, y)) {
        closeAllDialogs();
        update();
      }
    });

    styleButton(button1);
    button1.textEl.innerText = 'Tier down';
    if(!canEtherealDelete() && !freeDelete2(x, y)) button1.textEl.style.color = '#888';
    registerTooltip(button1, 'Downgrade crop to 1 tier lower (refunding the resin cost difference), if it already is at the lowest tier it will be turned into a blueprint template. Only works if deleitng in ethereal field is currently possible. ' + etherealDeleteExtraInfo);
    addButtonAction(button1, function() {
      if(makeDowngradeCrop2Action(x, y)) {
        closeAllDialogs();
        update();
      }
    });

    styleButton(button2);
    button2.textEl.innerText = 'Replace crop';
    registerTooltip(button2, 'Replace the crop with a new one you choose, same as delete then plant. Shows the list of unlocked ethereal crops. If this changes the type of the crop or lowers the tier, then this only works if deleting is currently possible in the ethereal field. ' + etherealDeleteExtraInfo);
    addButtonAction(button2, function() {
      makePlantDialog2(x, y, true, c.getRecoup());
    });

    styleButton(button3);
    button3.textEl.innerText = 'Delete crop';
    button3.textEl.style.color = '#c00';
    if(!canEtherealDelete() && !freeDelete2(x, y)) button3.textEl.style.color = '#888';
    registerTooltip(button3, 'Delete crop, get ' + (cropRecoup2 * 100) + '% of the original resin cost back. Only works if deleting in ethereal field is currently possible. ' + etherealDeleteExtraInfo);
    addButtonAction(button3, function() {
      addAction({type:ACTION_DELETE2, x:x, y:y});
      closeAllDialogs();
      update(); // do update immediately rather than wait for tick, for faster feeling response time
    });

    styleButton(button4);
    button4.textEl.innerText = 'Detailed stats / bonuses';
    registerTooltip(button4, 'Show breakdown of multipliers and bonuses and other detailed stats.');
    addButtonAction(button4, function() {
      var dialog = createDialog({
        size:DIALOG_LARGE,
        title:'Detailed crop stats',
        scrollable:true,
        icon:c.image[4],
        bgstyle:'efDialogTranslucent'
      });
      var flex = dialog.content;
      var text = '';

      text += getCropInfoHTML2(f, c, true);
      text += '<br/>';
      text += getCropInfoHTML2Breakdown(f, c);
      dialog.content.div.innerHTML = text;
    });

    updatedialogfun = bind(function(f, c, flex) {
      var html0 = getCropInfoHTML2(f, c, false);
      if(html0 != last0) {
        flex0.div.innerHTML = html0;
        last0 = html0;
      }
    }, f, c);

    updatedialogfun(f, c);
  } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
    makeTree2Dialog();
  } else {
    makePlantDialog2(x, y);
  }
}

function initField2UI() {
  field2Flex.clear();
  field2Rows = [];
  field2Divs = [];
  for(var y = 0; y < state.numh2; y++) {
    field2Divs[y] = [];
    for(var x = 0; x < state.numw2; x++) {
      field2Divs[y][x] = new CellDiv();
    }
  }

  //This is set up such that the field tiles are square on screen, field is rectangle (or square if numw2 == numh2), and always takes max size in the rectangular div in which the field is placed
  var ratio = state.numw2 / state.numh2;
  var field2Grid = new Flex(field2Flex, [0.5,0,-0.5,ratio], [0.5,0,-0.5,1/ratio], [0.5,0,0.5,ratio], [0.5,0,0.5,1/ratio]);

  var field2Div = field2Flex.div;
  var w = field2Div.clientWidth;
  var h = field2Div.clientHeight;

  setAriaRole(field2Grid.div, 'grid'); // intended for 2D navigation, combined with the row and cell roles given to the elements below
  setAriaLabel(field2Grid.div, 'ethereal field');

  var tw = Math.floor(w / state.numw2) - 1;
  var th = Math.floor(h / state.numh2) - 1;
  tw = th = Math.min(tw, th);
  var x0 = 2 + Math.floor((field2Div.clientWidth - tw * state.numw2) / 2);
  var y0 = 2;

  for(var y = 0; y < state.numh2; y++) {
    var row = makeDiv('0', (y / state.numh2 * 100) + '%', '100%', (101 / state.numh2) + '%', field2Grid.div);
    setAriaRole(row, 'row');
    field2Rows[y] = row;
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      var celldiv = makeDiv((x / state.numw2 * 100) + '%', '0', (101 / state.numw2) + '%', '100%', row);
      var bgcanvas = createCanvas('0%', '0%', '100%', '100%', celldiv); // canvas with the field background image
      var canvas = createCanvas('0%', '0%', '100%', '100%', celldiv); // canvas for the plant itself
      var div = makeDiv('0', '0', '100%', '100%', celldiv);
      setAriaRole(celldiv, 'cell');
      div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
      centerText(div);

      field2Divs[y][x].div = div;
      field2Divs[y][x].canvas = canvas;
      field2Divs[y][x].bgcanvas = bgcanvas;

      util.setEvent(div, 'mouseover', 'fieldover', bind(function(x, y) {
        updateField2MouseOver(x, y);
      }, x, y));
      util.setEvent(div, 'mouseout', 'fieldout', bind(function(x, y) {
        updateField2MouseOut(x, y);
      }, x, y));
      // on mouse up and with timeout so that the state is fully updated after the action that the click caused
      util.setEvent(div, 'mouseup', 'fieldclick', bind(function(x, y) {
        window.setTimeout(function(){updateField2MouseClick(x, y)});
      }, x, y));

      registerTooltip(div, bind(function(x, y, div) {
        var f = state.field2[y][x];
        var fd = field2Divs[y][x];

        var result = undefined;
        if(f.index == 0) {
          return undefined; // no tooltip for empty fields, it's a bit too spammy when you move the mouse there
        } else if(f.hasCrop()) {
          var c = crops2[f.cropIndex()];
          result = getCropInfoHTML2(f, c, false);
        } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
          if(state.treelevel2 > 0) {
            result = 'Ethereal tree level ' + state.treelevel2;
          } else {
            result = 'Ethereal tree';
          }
          var twigs_req = treeLevel2Req(state.treelevel2 + 1);
          var nextlevelprogress = state.res.twigs.div(twigs_req.twigs);
          result += '<br><br>Twigs required for next level: </b>' + (twigs_req.twigs.sub(state.res.twigs)).toString() + ' of ' + twigs_req.toString() + ' (have ' + state.res.twigs.toString() + ', ' + nextlevelprogress.toPercentString() + ')';
        }
        return result;
      }, x, y, div), true);

      addButtonAction(div, bind(function(x, y, div, e) {
        var f = state.field2[y][x];
        if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
          makeField2Dialog(x, y);
        } else if(f.index == 0) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(shift && ctrl) {
            // experimental feature for now, most convenient behavior needs to be found
            // current behavior: plant crop of same type as lastPlanted, but of highest tier that's unlocked and you can afford. Useful in combination with ctrl+shift picking when highest unlocked one is still to expensive and you wait for automaton to upgrade the plant
            if(state.lastPlanted2 >= 0 && crops2[state.lastPlanted2]) {
              var c = crops2[state.lastPlanted2];
              var tier = state.highestoftype2unlocked[c.type];
              var c3 = croptype2_tiers[c.type][tier];
              if(c.type == CROPTYPE_CHALLENGE) c3 = c;
              if(!c3 || !state.crops2[c3.index].unlocked) c3 = c;
              if(c3.getCost().gt(state.res) && tier > 0) {
                tier--;
                var c4 = croptype2_tiers[c.type][tier];
                if(c4 && state.crops2[c4.index].unlocked) c3 = c4;
              }
              if(c3.getCost().gt(state.res) && tier > 0) {
                tier--;
                var c4 = croptype2_tiers[c.type][tier];
                if(c4 && state.crops2[c4.index].unlocked) c3 = c4;
              }
              if(c3.getCost().gt(state.res)) {
                tier = -1; // template
                var c4 = croptype2_tiers[c.type][tier];
                if(c4 && state.crops2[c4.index].unlocked) c3 = c4;
              }
              addAction({type:ACTION_PLANT2, x:x, y:y, crop:c3, shiftPlanted:true});
              update();
            }
          } else if(shift && !ctrl) {
            if(state.lastPlanted2 >= 0 && crops2[state.lastPlanted2]) {
              var c = crops2[state.lastPlanted2];
              addAction({type:ACTION_PLANT2, x:x, y:y, crop:c, shiftPlanted:true});
              update();
            } else {
              showMessage(shiftClickPlantUnset, C_INVALID, 0, 0);
            }
          } else {
            makeField2Dialog(x, y);
          }
        } else if(f.hasCrop()) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(shift && ctrl) {
            // experimental feature for now, most convenient behavior needs to be found
            // behavior implemented here: if safe, "pick" clicked crop type, but then the best unlocked one of its tier. If unsafe permitted, immediately upgrade to highest type, and still pick highest tier too whether or not it changed
            // other possible behaviors: pick crop type (as is), open the crop replace dialog, ...
            var c2 = f.getCrop();
            var c3 = croptype2_tiers[c2.type][state.highestoftype2unlocked[c2.type]];
            if(!c3 || !state.crops2[c3.index].unlocked) c3 = c2;
            if(c2.type == CROPTYPE_CHALLENGE) c3 = c2;
            state.lastPlanted2 = c3.index;
            if(c3.getCost().gt(state.res)) state.lastPlanted2 = c2.index;
            if(c3.tier > c2.tier) {
              addAction({type:ACTION_REPLACE2, x:x, y:y, crop:c3, shiftPlanted:true});
              update();
            }
          } else if(shift && !ctrl) {
            var c = crops2[state.lastPlanted2];
            var c2 = f.getCrop();
            if(c2.index == state.lastPlanted2 && !f.isFullGrown()) {
              // one exception for the shift+click to replace: if crop is growing and equals your currently selected crop,
              // it means you may have just accidently planted it in wrong spot. deleting it is free (other than lost growtime,
              // but player intended to have it gone anyway by shift+clicking it even when replace was intended)
              addAction({type:ACTION_DELETE2, x:x, y:y});
            } else {
              addAction({type:ACTION_REPLACE2, x:x, y:y, crop:c, shiftPlanted:true});
            }
            update();
          } else if(ctrl && !shift) {
            var c = crops[state.lastPlanted];
            addAction({type:ACTION_DELETE2, x:x, y:y});
            update();
          } else {
            makeField2Dialog(x, y);
          }
        }
      }, x, y, div));

      var pw = tw >> 1;
      var ph = Math.round(th / 16);
      if(ph < 4) ph = 4;
      var px = x0 + x * tw + ((tw - pw) >> 1);
      var py = y0 + (y + 1) * th - ph * 2;
      var progress = makeDiv((((x + 0.2) / state.numw2) * 100) + '%', (((y + 0.85) / state.numh2) * 100) + '%', (100 / state.numw2 * 0.6) + '%', (100 / state.numh2 * 0.05) + '%', field2Grid.div);
      progress.style.minHeight = '5px';
      initProgressBar(progress);
      field2Divs[y][x].progress = progress;
    }
  }
}

function updateField2CellUI(x, y) {
  var f = state.field2[y][x];
  var fd = field2Divs[y][x];
  var growstage = (f.growth >= 1) ? 4 : Math.min(Math.floor(f.growth * 4), 3);
  var season = 4; // the ethereal season

  var progresspixel = -1;
  if(f.index == FIELD_TREE_BOTTOM && (state.treelevel2 > 0 || state.res.twigs.gtr(0))) {
    var nextlevelprogress = Math.min(0.99, state.res.twigs.div(treeLevel2Req(state.treelevel2 + 1).twigs).valueOf());
    progresspixel = Math.round(nextlevelprogress * 5);
  }

  var ferncode = 0;

  if(fd.index != f.index || fd.growstage != growstage || season != fd.season || state.treelevel2 != fd.treelevel2 || ferncode != fd.ferncode || progresspixel != fd.progresspixel) {
    var r = util.pseudoRandom2D(x, y, 55555);
    var fieldim = images_field[season];
    var field_image = r < 0.25 ? fieldim[0] : (r < 0.5 ? fieldim[1] : (r < 0.75 ? fieldim[2] : fieldim[3]));
    if(f.index == FIELD_TREE_BOTTOM || f.index == FIELD_TREE_TOP) field_image = fieldim[4];
    renderImage(field_image, fd.bgcanvas);
    fd.season = season;
    fd.treelevel2 = state.treelevel2;
    fd.ferncode = ferncode;
    fd.progresspixel = progresspixel;

    var label = 'ethereal field tile ' + x + ', ' + y;

    fd.index = f.index;
    fd.growstage = growstage;
    if(f.hasCrop()) {
      var c = crops2[f.cropIndex()];
      renderImage(c.image[growstage], fd.canvas);
      if(f.growth >= 1) {
        // fullgrown, so hide progress bar
        setProgressBar(fd.progress, -1, undefined);
      }
      label = c.name + '. ' + label;
    } else if(f.index == FIELD_TREE_TOP) {
      renderImage(tree_images[treeLevelIndex(state.treelevel2)][1][season], fd.canvas);
      label = 'ethereal tree level ' + state.treelevel2 + '. ' + label;
    } else if(f.index == FIELD_TREE_BOTTOM) {
      renderImage(tree_images[treeLevelIndex(state.treelevel2)][2][season], fd.canvas);
      if(state.treelevel2 > 0 || state.res.twigs.gtr(0)) renderLevel(fd.canvas, state.treelevel2, 0, 11, progresspixel);
      label = 'ethereal tree level ' + state.treelevel2 + '. ' + label;
    } else {
      setProgressBar(fd.progress, -1, undefined);
      fd.div.innerText = '';
      unrenderImage(fd.canvas);
    }

    if(f.index == 0) {
      label = 'empty ' + label;
    }

    setAriaLabel(fd.div, label);
  }
  if(f.hasCrop() && f.growth < 1) {
    var c = crops2[f.cropIndex()];
    setProgressBar(fd.progress, f.growth, '#f00');
  }
}

function renderField2() {
  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      updateField2CellUI(x, y);
    }
  }
}

// opt_later: when viewing the dialog later, so it shouldn't show messages that indicate the ethereal tree leveled up just now
function showEtherealTreeLevelDialog(level, opt_later) {
  var dialog = createDialog({
    cancelname:'ok',
    scrollable:true,
    title:((opt_later ? 'Ethereal tree level ' : 'Reached ethereal tree level ') + level),
    nobgclose:!opt_later,
    bgstyle:'efDialogEthereal'
  });

  var text = '';

  if(!opt_later) {
    if(level == 1) {
     text += 'Thanks to twigs, the ethereal tree leveled up! This is the tree in the ethereal field, not the one in the basic field. Leveling up the ethereal tree unlocks new ethereal crops and/or upgrades, depending on the level. Each level also provides a resin production boost to the basic tree.'
    } else {
     text += 'The ethereal tree leveled up to level ' + level + '!';
    }
    text += '<br><br>';

    var twigs_now = treeLevel2Req(level);
    var twigs_next = treeLevel2Req(level + 1);

    text += 'The ethereal tree consumed ' + twigs_now.toString() + '. The next level will require ' + twigs_next.toString() + '.<br><br>';

    text += 'The following new ethereal things got, or will get, unlocked:<br><br>';
  } else {
    text += 'The following new ethereal things got, or will get, unlocked at this level:<br><br>';
  }


  var anything = false;

  for(var i = 0; i < registered_upgrades2.length; i++) {
    var u = upgrades2[registered_upgrades2[i]];
    if(u.treelevel2 == level) {
      text += '<b>Upgrade</b>: ' + upper(u.name) + '<br>';
      anything = true;
    }
  }

  for(var i = 0; i < registered_crops2.length; i++) {
    var u = crops2[registered_crops2[i]];
    if(!u.isReal()) continue;
    if(u.treelevel2 == level) {
      text += '<b>Crop</b>: Ethereal ' + u.name + '<br>';
      anything = true;
    }
  }

  for(var i = 0; i < registered_crops2.length; i++) {
    var u = crops2[registered_crops2[i]];
    if(!u.istemplate) continue;
    if(u.treelevel2 == level) {
      text += '<b>Template</b>: Ethereal ' + u.name + '<br>';
      anything = true;
    }
  }

  if(level == 2) {
    text += '<b>Challenge</b>: No upgrades challenge (requires having automaton to unlock)<br>';
    anything = true;
  }
  if(level == 3) {
    text += '<b>Challenge</b>: Blackberry challenge (requires automaton with auto-upgrades to unlock)<br>';
    anything = true;
  }
  if(level == 5) {
    text += '<b>Challenge</b>: Wither challenge (requires automaton with auto-unlock crops to unlock)<br>';
    anything = true;
  }
  if(level == 7) {
    text += '<b>Challenge</b>: Wasabi challenge<br>';
    anything = true;
  }

  if(!anything) {
    text += 'Nothing new unlocked. New content for this ethereal tree level may be added in future game updates.';
  } else {
    text += '<br>';
    text += 'These are available in the ethereal field and/or the ethereal upgrades tab.';
    if(!opt_later) {
      text += '<br><br>';
      text += 'You can always see this dialog again through the ethereal tree dialog.';
    }
  }

  dialog.content.div.innerHTML = text;
}

function showEtherealTreeLevelDialogs() {
  var dialog = createDialog({
    onclose:function() { showing_help = false; },
    scrollable:true,
    title:'Previous ethereal tree level unlocks'
  });

  var pos = 0.05;
  var buttondiv;
  var h = 0.06;

  var makeButton = function(text) {
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(dialog.content, 0.08, pos, 0.92, pos + h);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    button.textEl.innerText = text;
    return button;
  };

  for(var i = 0; i <= state.treelevel2; i++) {
    var level = state.treelevel2 - i;
    var button = makeButton('level ' + level);
    addButtonAction(button, bind(showEtherealTreeLevelDialog, level, true));
  }
}

function computeField2Cost() {
  var result = Res();

  var w = state.numw2;
  var h = state.numh2;

  var counts = {};

  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field2[y][x];
      var c2 = f.getCrop();
      if(!c2) continue;
      var count = counts[c2.index] || 0;
      counts[c2.index] = count + 1;
      result.addInPlace(c2.getCost(undefined, count));
    }
  }

  return result;
}
