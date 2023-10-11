/*
Ethereal Farm
Copyright (C) 2020-2023  Lode Vandevenne

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
    result += 'Effect: ' + c.effect_description_long;
  } else if(c.effect_description_short) {
    result += 'Effect: ' + c.effect_description_short;
  }

  if(c.index == mistletoe2_0) {
    if(haveEtherealMistletoeUpgrade(mistle_upgrade_second_mistletoe)) {
      result += ' Can have only max two. Their neighbor bonus does not stack to the same neighbor.';
    } else {
      result += ' Can have only max one.';
    }

    result += '<br/>';
    var m = mistletoeupgrades[state.mistletoeupgrade];
    var m2 = state.mistletoeupgrades[state.mistletoeupgrade];
    if(m) {
      var t = m.getTime() - m2.time;
      result += '<br/>Upgrade time left: ' + util.formatDuration(t, true, 4) + '<br/>';
    } else {
      result += '<br/>Not upgrading<br/>';
    }
  }
  result += '<br/>';

  var boostFromNeighbors = undefined;

  if(c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH || c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_STINGING || c.type == CROPTYPE_BEE || c.type == CROPTYPE_BRASSICA) {
    var basicBoost = c.getBasicBoost(f);
    result += '<br/>';
    result += 'Boost to basic field: ' + basicBoost.toPercentString();
    result += '<br/>';

    var temp = c.getBasicBoost(); // boost without passing field f, so what you'd get without taking the neighbors into account
    boostFromNeighbors = basicBoost.div(temp).subr(1);
  }

  var automaton = c.index == automaton2_0;
  var squirrel = c.index == squirrel2_0;
  var mistletoe = c.index == mistletoe2_0;

  if(f.growth >= 1) {
    if(c.boost.neqr(0)) {
      var etherealBoost = c.getEtherealBoost(f);
      result += '<br/>Boosting neighbors: ' + etherealBoost.toPercentString() + '<br/>';
      var temp = c.getEtherealBoost(); // boost without passing field f, so what you'd get without taking the neighbors into account
      boostFromNeighbors = etherealBoost.div(temp).subr(1); // this one can be from upgraded ethereal mistletoe boosting lotuses
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
    if(mistletoe && haveEtherealMistletoeUpgrade(mistle_upgrade_lotus_neighbor)) {
      result += 'Boosting lotus neighbors orthogonally and diagonally: ' + (getEtherealMistletoeBonus(mistle_upgrade_lotus_neighbor).toPercentString()) + '<br/>';
    }
    /*if(!boostFromNeighbors) {
      var fakecrop = crops2[berry2_0];
      var fakebasicBoost = fakecrop.getBasicBoost(f);
      var temp = fakecrop.getBasicBoost(); // boost without passing field f, so what you'd get without taking the neighbors into account
      boostFromNeighbors = fakebasicBoost.div(temp).subr(1);
    }*/
  }

  if(boostFromNeighbors && boostFromNeighbors.gtr(0)) {
    // boost from location-based field neighbors such as lotus, ethereal tree, automaton, squirrel and mistletoe. This shows how valuable this field spot location is.
    result += 'Neighbor boost to here: ' + boostFromNeighbors.toPercentString();
    result += '<br/>';
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
      var tier_diff = upgrade_crop.tier - c.tier;
      var tier_diff_text = tier_diff > 1 ? (' (+' + tier_diff + ')' ) : '';
      var temp = '<br/>• Upgrade tier' + tier_diff_text + ' cost (u): ' + upgrade_cost[0].toString() + ' (' + getCostAffordTimer(upgrade_cost[0]) + ')';
      if(!upgrade_cost[1]) temp = '<b>' + temp + '</b>';
      result += temp;
    } else {
      result += '<br/>• Upgrade tier cost (u): ?';
    }
  } else {
    result += '<br/>Cost: ';
    if(opt_detailed) result += '<br/>• Base planting cost: ' + c.cost.toString();
    result += '<br/>• Next planting cost: ' + c.getCost().toString() + ' (' + getCostAffordTimer(c.getCost()) + ')';
    result += '<br/>• Last planting cost: ' + c.getCost(-1).toString();
    result += '<br/>• Recoup on delete: ' + c.getCost(-1).mulr(cropRecoup2).toString() + ' (' + refund_text + ')';
    if(upgrade_crop && upgrade_cost[0]) {
      var tier_diff = upgrade_crop.tier - c.tier;
      var tier_diff_text = tier_diff > 1 ? (' (+' + tier_diff + ')' ) : '';
      result += '<br/>• Upgrade tier' + tier_diff_text + ' cost:' + upgrade_cost[0].toString() + ' (' + getCostAffordTimer(upgrade_cost[0]) + ')';
    } else {
      result += '<br/>• Upgrade tier cost: ?';
    }
  }

  result += '<br><br>Ethereal tree level that unlocked this crop: ' + c.treelevel2;

  return result;
}


function getCropInfoHTML2Breakdown(f, c) {
  var result = '';

  if(c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH || c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_STINGING || c.type == CROPTYPE_BEE || c.type == CROPTYPE_BRASSICA) {
    var breakdown = [];
    var total = c.getBasicBoost(f, breakdown);
    result += formatBreakdown(breakdown, true, 'Breakdown (boost to basic field)');
  }

  if(c.type == CROPTYPE_LOTUS) {
    var breakdown = [];
    var total = c.getEtherealBoost(f, breakdown);
    result += formatBreakdown(breakdown, true, 'Breakdown (boost to ethereal neighbors)');
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

  // a downgrade may be more expensive if you have way more of that crop so it scaled up a lot, e.g. for lotuses
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
        showMessage('No crop to upgrade tier here. Move mouse cursor over a crop and press u to upgrade it to the next tier', C_INVALID);
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

function makeField2Dialog(x, y, opt_override_mistletoe) {
  var f = state.field2[y][x];
  var fd = field2Divs[y][x];

  if(f.hasCrop() && f.getCrop().index == mistletoe2_0 && !opt_override_mistletoe) {
    makeEtherealMistletoeDialog(x, y);
  } else if(f.hasCrop()) {
    var c = crops2[f.cropIndex()];
    var div;

    var updatedialogfun = bind(function(f, c, flex) {
      var html0 = getCropInfoHTML2(f, c, false);
      if(html0 != last0) {
        flex0.div.innerHTML = html0;
        last0 = html0;
      }
    }, f, c);

    var dialog = createDialog({
      icon:c.image[4],
      title:'Ethereal crop info',
      bgstyle:'efDialogTranslucent',
      updatedialogfun:updatedialogfun
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
    button0.textEl.innerText = 'Upgrade tier';
    registerTooltip(button0, 'Replace crop with the highest tier of this type you can afford, or turn template into real crop. This deletes the original crop, (with cost recoup if applicable), and then plants the new higher tier crop.');
    addButtonAction(button0, function() {
      if(makeUpgradeCrop2Action(x, y)) {
        closeAllDialogs();
        update();
      }
    });

    styleButton(button1);
    button1.textEl.innerText = 'Downgrade tier';
    registerTooltip(button1, 'Downgrade crop to 1 tier lower (refunding the resin cost difference), if it already is at the lowest tier it will be turned into a blueprint template.');
    addButtonAction(button1, function() {
      if(makeDowngradeCrop2Action(x, y)) {
        closeAllDialogs();
        update();
      }
    });

    styleButton(button2);
    button2.textEl.innerText = 'Replace crop';
    registerTooltip(button2, 'Replace the crop with a new one you choose, same as delete then plant. Shows the list of unlocked ethereal crops.');
    addButtonAction(button2, function() {
      makePlantDialog2(x, y, true, c.getRecoup());
    });

    styleButton(button3);
    button3.textEl.innerText = 'Delete crop';
    button3.textEl.style.color = '#c00';
    registerTooltip(button3, 'Delete crop, get ' + (cropRecoup2 * 100) + '% of the original resin cost back.');
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

    updatedialogfun();
  } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
    makeTree2Dialog();
  } else {
    makePlantDialog2(x, y);
  }
}

function field2CellTooltipFun(x, y, div) {
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
    var boost = getEtherealTreeNeighborBoost();
    if(boost.neqr(0)) {
      if(state.squirrel_upgrades[upgradesq_ethtree_diag].count) result += '<br><br>Boosting non-lotus neighbors orthogonally and diagonally: ' + boost.toPercentString();
      else result += '<br><br>Boosting non-lotus neighbors orthogonally but not diagonally: ' + boost.toPercentString();
    }
  }
  return result;
}

function field2CellClickFun(x, y, div, shift, ctrl) {
  var f = state.field2[y][x];
  if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
    makeField2Dialog(x, y);
  } else if(f.index == 0) {
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
      addAction({type:ACTION_DELETE2, x:x, y:y});
      update();
    } else {
      makeField2Dialog(x, y);
    }
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
      var canvas = createCanvas('0%', '0%', '100%', '100%', celldiv);
      var div = makeDiv('0', '0', '100%', '100%', celldiv);
      setAriaRole(celldiv, 'cell');
      div.className = 'efNoOutline';
      div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
      centerText(div);

      field2Divs[y][x].div = div;
      field2Divs[y][x].canvas = canvas;

      util.setEvent(div, 'mouseover', bind(function(x, y) {
        updateField2MouseOver(x, y);
      }, x, y), 'fieldover');
      util.setEvent(div, 'mouseout', bind(function(x, y) {
        updateField2MouseOut(x, y);
      }, x, y), 'fieldout');
      // on mouse up and with timeout so that the state is fully updated after the action that the click caused
      util.setEvent(div, 'mouseup', bind(function(x, y) {
        window.setTimeout(function(){updateField2MouseClick(x, y)});
      }, x, y), 'fieldclick');


      div.style.cursor = 'pointer';
      registerAction(div, bind(field2CellClickFun, x, y, div), 'click field cell', {
        label_shift:'(over)plant selected crop',
        label_ctrl:'delete crop',
        label_ctrl_shift:'select crop or plant highest tier',
        tooltip:bind(field2CellTooltipFun, x, y, div),
        tooltip_poll:true
      });


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
  var c = f.getCrop();
  if(c && c.index == mistletoe2_0 && !f.nexttotree) {
    // indicate that it is not placed next to tree (so has no effect) by rendering a lower growstage
    growstage = Math.max(0, growstage - 2);
  }

  var progresspixel = -1;
  if(f.index == FIELD_TREE_BOTTOM && (state.treelevel2 > 0 || state.res.twigs.gtr(0))) {
    var nextlevelprogress = Math.min(0.99, state.res.twigs.div(treeLevel2Req(state.treelevel2 + 1).twigs).valueOf());
    progresspixel = Math.round(nextlevelprogress * 5);
  }

  var largeravailable = c && c.tier >= 0 && state.highestoftype2unlocked[c.type] > state.highestoftype2planted[c.type] && state.res.resin.gt(crops2[state.highestcropoftype2unlocked[c.type]].cost.resin);

  if(fd.index != f.index || fd.growstage != growstage || season != fd.season || state.treelevel2 != fd.treelevel2 || progresspixel != fd.progresspixel || fd.holiday_hats_active != holiday_hats_active || fd.largeravailable != largeravailable) {
    fd.index = f.index;
    fd.growstage = growstage;
    fd.season = season;
    fd.treelevel2 = state.treelevel2;
    fd.progresspixel = progresspixel;
    fd.holiday_hats_active = holiday_hats_active;
    fd.largeravailable = largeravailable;

    var r = util.pseudoRandom2D(x, y, 55555);
    var fieldim = images_field[season];
    var field_image = r < 0.25 ? fieldim[0] : (r < 0.5 ? fieldim[1] : (r < 0.75 ? fieldim[2] : fieldim[3]));
    if(f.index == FIELD_TREE_BOTTOM || f.index == FIELD_TREE_TOP) field_image = fieldim[4];
    renderImage(field_image, fd.canvas);

    var label = 'ethereal field tile ' + x + ', ' + y;

    if(f.hasCrop()) {
      var c = crops2[f.cropIndex()];
      blendImage(c.image[growstage], fd.canvas);
      if(largeravailable) blendImage(upgrade_arrow_small, fd.canvas);
      if(f.growth >= 1) {
        // fullgrown, so hide progress bar
        setProgressBar(fd.progress, -1, undefined);
      }
      label = c.name + '. ' + label;
    } else if(f.index == FIELD_TREE_TOP) {
      blendImage(tree_images[treeLevelIndex(state.treelevel2)][1][season], fd.canvas);
      label = 'ethereal tree level ' + state.treelevel2 + '. ' + label;
    } else if(f.index == FIELD_TREE_BOTTOM) {
      blendImage(tree_images[treeLevelIndex(state.treelevel2)][2][season], fd.canvas);
      if(state.treelevel2 > 0 || state.res.twigs.gtr(0)) renderLevel(fd.canvas, state.treelevel2, 0, 11, progresspixel);
      label = 'ethereal tree level ' + state.treelevel2 + '. ' + label;
    } else {
      setProgressBar(fd.progress, -1, undefined);
      fd.div.innerText = '';
      //unrenderImage(fd.canvas);
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
  //if(state.currentTab != tabindex_field2) return;
  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      updateField2CellUI(x, y);
    }
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
