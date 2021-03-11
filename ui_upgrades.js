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



// make a button for planting a crop with picture, price and info. w should be larger than h for good effect.
function renderUpgradeChip(u, x, y, w, flex, completed) {
  var div = flex.div;
  div.className = 'efUpgradeChip';

  var cost = u.getCost(completed ? -1 : 0);
  var titleFlex = new Flex(flex, [0, 0.8], 0.05, 1, 0.3, 0.95);
  var name = completed ? u.getName() : u.getNextName();
  titleFlex.div.innerHTML = upper(name);
  titleFlex.div.style.whiteSpace = 'nowrap';

  var canvasFlex = new Flex(flex, 0.01, [0.5, -0.35], [0, 0.7], [0.5, 0.35]);
  canvasFlex.div.style.backgroundColor = '#ccc';
  canvasFlex.div.style.border = '1px solid black';
  if(u.bgcolor) {
    canvasFlex.div.style.backgroundColor = u.bgcolor;
  }
  if(u.bordercolor) {
    canvasFlex.div.style.border = '1px solid ' + u.bordercolor;
  }
  if(u.image0) {
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(u.image0, canvas);
  }
  if(u.image1) {
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(u.image1, canvas);
  }

  var buyFlex = new Flex(flex, [0, 0.8], 0.4, 0.9, [0.5, 0.35], 0.9);


  var infoText = '';
  var updateInfoText = function() {
    infoText = upper(name);
    infoText += '<br><br>Cost: ' + cost.toString();
    if(!completed) infoText += ' (' + getCostAffordTimer(cost) + ')';
    if(u.cropid != undefined) {
      infoText += '<br><br>' + 'have of this crop: ' + state.cropcount[u.cropid];
    }
    if(u.description) {
      infoText += '<br><br>' + u.description;
    }
    if(u.is_choice && completed) {
      infoText += '<br><br>Chosen: ' + ((state.upgrades[u.index].count == 1) ? u.choicename_a : u.choicename_b);
    }
    if(u.cropid != undefined) {
      var c = crops[u.cropid];
      infoText += '<hr>';
      infoText += 'Crop info (' + c.name + '):<br><br>';

      if(!c.prod.empty()) {
        infoText += 'Base production: ' + c.prod.toString() + '<br>';
        infoText += 'Upgraded production: ' + c.getProd().toString() + '<br>';
      }
      if(c.boost.neqr(0)) {
        infoText += 'Base boost: ' + c.boost.toPercentString() + '<br>';
        infoText += 'Upgraded boost: ' + (c.type == CROPTYPE_BEE ? c.getBoostBoost() : c.getBoost()).toPercentString() + '<br>';
      }


      var cropcost = c.getCost();
      infoText += 'Planting cost: ' + cropcost.toString() + ' (' + getCostAffordTimer(cropcost) + ')<br>';
      if(c.type == CROPTYPE_SHORT) {
        infoText += 'Living time: ' + util.formatDuration(c.getPlantTime());
      } else {
        infoText += 'Growth time: ' + util.formatDuration(c.getPlantTime());
        if(c.getPlantTime() != c.planttime) infoText += ' (base: ' + util.formatDuration(c.planttime) + ')';
      }
      infoText += '<br>';
      infoText += 'Type: ' + getCropTypeName(c.type) +  (c.tier ? (' (tier ' + (c.tier + 1) + ')') : '') + '<br>';
      // standard as in: none of the field-location boosts are taken into account
      //var cropprod = c.getProd(undefined, true);
      //if(!cropprod.empty()) {
      //  infoText += 'Standard production/sec: ' + c.getProd(undefined, true).toString() + '<br>';
      //}
    }
  };
  updateInfoText();

  if(!completed) {
    styleButton(buyFlex.div);
    var buyText = (u.is_choice ? 'Choose' : ('Buy: ' + cost.toString()));

    buyFlex.div.textEl.innerText = buyText;

    if(state.res.lt(cost)) buyFlex.div.className = 'efButtonCantAfford';

    addButtonAction(buyFlex.div, bind(function(i, e) {
      if(u.is_choice) {
        var dialog;
        var funa = function() {
          actions.push({type:ACTION_UPGRADE, u:u.index, shift:false, choice:1});
          dialog.cancelFun();
          update();
        };
        var funb = function() {
          actions.push({type:ACTION_UPGRADE, u:u.index, shift:false, choice:2});
          dialog.cancelFun();
          update();
        };
        dialog = createDialog(undefined, funa, u.choicename_a, undefined, funb, u.choicename_b);
        dialog.content.div.innerHTML = u.description;
      } else {
        actions.push({type:ACTION_UPGRADE, u:u.index, shift:e.shiftKey});
        update();
      }

      // misclicking with shift on often creates unwanted text selection, fix that here
      if(window.getSelection) window.getSelection().removeAllRanges();
      else if(document.selection) document.selection.empty();
    }, i));

    util.setEvent(flex.div, 'onmouseover', 'upgradeseen', function() {
      state.upgrades[u.index].seen = true;
    });

  } else {
    if(u.is_choice && completed) {
      buyFlex.div.innerText = 'Chosen: ' + ((state.upgrades[u.index].count == 1) ? u.choicename_a : u.choicename_b);
    } else {
      buyFlex.div.innerText = 'Cost: ' + cost.toString();
    }
    //buyFlex.setCentered();
  }


  registerTooltip(flex.div, function() {
    updateInfoText();
    return infoText;
  }, true);

  styleButton0(canvasFlex.div);

  addButtonAction(canvasFlex.div, function() {
    var okfun = undefined;
    var okname = undefined;
    if(!u.is_choice) {
      okfun = function() {
        actions.push({type:ACTION_UPGRADE, u:u.index, shift:false});
        closeAllDialogs();
        update();
      };
      okname = u.maxcount == 1 ? 'buy' : 'buy one';
    }
    var extrafun = undefined;
    var extraname = undefined;
    if(!u.is_choice && u.maxcount != 1) {
      extrafun = function() {
        actions.push({type:ACTION_UPGRADE, u:u.index, shift:true});
        closeAllDialogs();
        update();
      };
      extraname = 'buy many';
    }
    updateInfoText();
    var dialog = createDialog(DIALOG_SMALL, okfun, okname, undefined, extrafun, extraname);
    dialog.content.div.innerHTML = infoText;
  }, 'upgrade icon for ' + name);


  return flex;
}

var upgradeScrollFlex = null;




// communicate to the right-panel upgrade panel that an update was needed
var upgradeUIUpdated = false;


var upgrades_order = [];
function computeUpgradeUIOrder() {
  var array;
  upgrades_order = [];

  var added = {};

  // one-time upgrades (unlocks, ...) that cost spores (= special tree related ones)
  array = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    if(added[registered_upgrades[i]]) continue;
    var u = upgrades[registered_upgrades[i]];
    if(u.maxcount == 1 && u.cost.spores.neqr(0)) array.push(registered_upgrades[i]);
  }
  array = array.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    return a.cost.spores.lt(b.cost.spores) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    upgrades_order.push(array[i]);
    added[array[i]] = true;
  }

  // one-time upgrades (unlocks, ...) that cost seeds
  array = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    if(added[registered_upgrades[i]]) continue;
    var u = upgrades[registered_upgrades[i]];
    if(u.maxcount == 1 && u.cost.spores.eqr(0)) array.push(registered_upgrades[i]);
  }
  array = array.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    return a.cost.seeds.lt(b.cost.seeds) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    upgrades_order.push(array[i]);
    added[array[i]] = true;
  }

  // finite amount of time upgrades (those don't yet exist actually)
  array = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    if(added[registered_upgrades[i]]) continue;
    var u = upgrades[registered_upgrades[i]];
    if(u.maxcount > 1) array.push(registered_upgrades[i]);
  }
  array = array.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    return a.cost.seeds.lt(b.cost.seeds) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    upgrades_order.push(array[i]);
    added[array[i]] = true;
  }

  // first the most expensive of each type of crop and put those at the top
  // this ensures their upgrade is at the top of the upgrades even if you didn't plant this crop in the field yet (if it's just unlocked)
  var findtop = function(type, array) {
    var highest = undefined;
    for(var i = 0; i < registered_upgrades.length; i++) {
      if(added[registered_upgrades[i]]) continue;
      var u = upgrades[registered_upgrades[i]];
      var u2 = state.upgrades[registered_upgrades[i]];
      if(!u2.unlocked) continue;
      if(u.maxcount != 0) continue;
      if(u.cropid == undefined) continue;
      if(crops[u.cropid].type != type) continue;
      if(highest == undefined || u.cost.gt(highest.cost)) highest = u;
    }
    if(highest) array.push(highest.index);
  };
  array = [];
  findtop(CROPTYPE_BERRY, array);
  findtop(CROPTYPE_MUSH, array);
  findtop(CROPTYPE_FLOWER, array);
  findtop(CROPTYPE_BEE, array);
  findtop(CROPTYPE_NETTLE, array);
  findtop(CROPTYPE_SHORT, array);
  array = array.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    return a.cost.seeds.lt(b.cost.seeds) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    upgrades_order.push(array[i]);
    added[array[i]] = true;
  }

  // then "relevant" infinite time upgrades: such as crops you have in the field
  array = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    if(added[registered_upgrades[i]]) continue;
    var u = upgrades[registered_upgrades[i]];
    if(u.maxcount != 0) continue;
    var relevant = (u.cropid == undefined) || (!!state.cropcount[u.cropid] || crops[u.cropid].type == CROPTYPE_SHORT);
    if(!relevant) continue;
    array.push(registered_upgrades[i]);
  }
  array = array.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    return a.cost.seeds.lt(b.cost.seeds) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    upgrades_order.push(array[i]);
    added[array[i]] = true;
  }

  // then all remaining infinite time upgrades
  array = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    if(added[registered_upgrades[i]]) continue;
    var u = upgrades[registered_upgrades[i]];
    if(u.maxcount != 0) continue;
    array.push(registered_upgrades[i]);
  }
  array = array.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    return a.cost.seeds.lt(b.cost.seeds) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    upgrades_order.push(array[i]);
    added[array[i]] = true;
  }
}

var upgrades_order_cache = [];
// this is just to avoid all the sorting of computeUpgradeUIOrder when not necessary
function computeUpgradeUIOrderIfNeeded() {
  var counts = [];
  for(var i = 0; i < registered_crops.length; i++) {
    var count = state.cropcount[registered_crops[i]];
    counts[i] = !!count;
  }
  for(var i = 0; i < registered_upgrades.length; i++) {
    var count = state.upgrades[registered_upgrades[i]].count;
    counts[registered_crops.length + i] = !!count;
  }
  var same = true;
  if(upgrades_order_cache.length != counts.length) {
    same = false;
  } else {
    for(var i = 0; i < counts.length; i++) {
      if(upgrades_order_cache[i] != counts[i]) {
        same = false;
        break;
      }
    }
  }
  if(same) return false;
  upgrades_order_cache = counts;
  computeUpgradeUIOrder();
  return true; // actually not guaranteed that it changed, but at least the right pane must be updated sometimes if planting a crop changed the relevance of some
}



function updateUpgradeUI() {
  if(upgrades_order.length == 0) computeUpgradeUIOrder();

  upgrade_ui_cache = [];
  var scrollPos = 0;
  if(upgradeScrollFlex) scrollPos = upgradeScrollFlex.div.scrollTop;

  upgradeFlex.clear();


  var scrollFlex = new Flex(upgradeFlex, 0, 0.01, 1, 1);
  upgradeScrollFlex = scrollFlex;
  makeScrollable(scrollFlex);


  var titleFlex = new Flex(scrollFlex, 0.01, 0.02, 0.95, 0.15, 0.3);

  var titleText = '';
  titleText = 'Hold shift to buy as many as possible';
  titleText += '<br>';
  titleText += 'Click icon or see tooltip for more info';
  titleFlex.div.innerHTML = titleText;


  var pos = [0, 0];

  var unlocked = [];
  for(var i = 0; i < upgrades_order.length; i++) {
    var j = upgrades_order[i];
    if(upgrades[j].canUpgrade()) unlocked.push(j);
  }

  var w = 0.49;
  var h = 0.45;

  for(var i = 0; i < unlocked.length; i++) {
    var u = upgrades[unlocked[i]];

    var x = (i & 1);
    var y = (i >> 1);
    var chip = new Flex(scrollFlex, x * w + 0.01, [0.15, y * h + 0.01, 0.27], [(x + 1) * w - 0.01], [0.15, (y + 1) * h - 0.01, 0.27], 0.75);
    renderUpgradeChip(u, i & 1, i >> 1, 0.45, chip, false);
  }

  var researched = [];
  for(var i = 0; i < upgrades_order.length; i++) {
    var j = upgrades_order[i];
    //if(upgrades[j].isExhausted()) researched.push(j);
    if(state.upgrades[j].count) researched.push(j);
  }

  if(researched.length > 0) {
    var x = 0;
    var y = ((unlocked.length + 1) >> 1) + 0.33;

    var flex = new Flex(scrollFlex, 0 * w + 0.01, [0.15, y * h + 0.01, 0.27], [(0 + 1) * w - 0.01], [0.15, (y + 1) * h - 0.01, 0.27], 0.6);
    styleButton(flex.div);
    flex.div.innerText = 'See Completed Upgrades';
    flex.setCentered();

    addButtonAction(flex.div, function() {
      var dialog = createDialog();

      var scrollFlex = dialog.content;
      makeScrollable(scrollFlex);

      for(var i = 0; i < researched.length; i++) {
        var u = upgrades[researched[i]];
        var div = makeDiv(pos[0], pos[1], 200, 20, scrollFlex.div);

        var x = (i & 1);
        var y = i >> 1;
        var chip = new Flex(scrollFlex, x * w + 0.01, [0, y * h + 0.01, 0.27], [(x + 1) * w - 0.01], [0, (y + 1) * h - 0.01, 0.27], 0.75);
        renderUpgradeChip(u, i & 1, i >> 1, 0.45, chip, true);
        chip.div.style.color = '#2a2';
        chip.div.style.borderColor = '#2a2';
      }

      scrollFlex.update(); // something goes wrong with the last chip in the scrollflex when not updating this now.
    });
  }

  //appearance of scrollbar can shift positions of some flexes, causing some boxes to shift, hence update entire flex again
  scrollFlex.update();

  upgradeScrollFlex.div.scrollTop = scrollPos;

  upgradeUIUpdated = true;
}

var upgrade_ui_cache = [];

function updateUpgradeUIIfNeeded() {
  var order_changed = computeUpgradeUIOrderIfNeeded();

  var unlocked = [];
  for(var i = 0; i < upgrades_order.length; i++) {
    var j = upgrades_order[i];
    if(upgrades[j].canUpgrade()) unlocked.push(j);
  }

  var cache = [];
  for(var i = 0; i < unlocked.length; i++) {
    var u = upgrades[unlocked[i]];
    var u2 = state.upgrades[unlocked[i]];
    var cost = u.getCost(0);
    cache[i] = [state.res.lt(cost), u2.count, u.index];
  }

  var eq = false;
  if(upgrade_ui_cache.length == cache.length) {
    eq = true;
    for(var i = 0; i < cache.length; i++) {
      if(cache[i][0] != upgrade_ui_cache[i][0] || cache[i][1] != upgrade_ui_cache[i][1] || cache[i][2] != upgrade_ui_cache[i][2]) {
        eq = false;
        break;
      }
    }
  }

  if(!eq || order_changed) {
    updateUpgradeUI();
    upgradeUIUpdated = true;
    upgrade_ui_cache = cache;
  }
}
