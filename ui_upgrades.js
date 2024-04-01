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

function renderUpgraceIcon(canvasFlex, u) {
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
}

function rerenderUpgradeChip(u, chip, completed, opt_ui_location) {
  var div = chip.div;
  div.className = 'efUpgradeChip';

  var cost = u.getCost(completed ? -1 : 0);
  var cant_afford = state.res.lt(cost);
  var format = getNumberFormatCode();

  var u2 = state.upgrades[u.index];
  if(chip.u != undefined) {
    var same = true;
    if(chip.u != u.index) same = false;
    if(chip.u_count != u2.count) same = false;
    if(chip.u_completed != completed) same = false;
    if(chip.u_cant_afford != cant_afford) same = false;
    if(chip.u_format != format) same = false;
    if(same) return;
  }

  if(opt_ui_location) {
    if(u.index == brassicamul_0) chip.div.id = (opt_ui_location == 1) ? 'help_arrow_upgrade_watercress' : 'help_arrow_upgrade_watercress_side';
    if(u.index == berryunlock_0) chip.div.id = (opt_ui_location == 1) ? 'help_arrow_unlock_blackberry' : 'help_arrow_unlock_blackberry_side';
    if(u.index == berryunlock_1) chip.div.id = (opt_ui_location == 1) ? 'help_arrow_unlock_blueberry' : 'help_arrow_unlock_blueberry_side';
    if(u.index == flowerunlock_0) chip.div.id = (opt_ui_location == 1) ? 'help_arrow_unlock_anemone' : 'help_arrow_unlock_anemone_side';
    if(u.index == nettleunlock_0) chip.div.id = (opt_ui_location == 1) ? 'help_arrow_unlock_nettle' : 'help_arrow_unlock_nettle_side';
  }

  chip.u = u.index; // the upgrade this chip now represents
  chip.u_count = u2.count;
  chip.u_completed = completed;
  chip.u_cant_afford = cant_afford;
  chip.u_format = format;

  var titleFlex = chip.titleFlex
  var name = completed ? u.getName() : u.getNextName();
  //var verb = u.is_choice ? 'Choice' : 'Buy'
  //titleFlex.div.style.whiteSpace = 'nowrap';

  //var text = verb + ': ' + name;
  var text = name;

  var canvasFlex = chip.canvasFlex;
  chip.canvasFlex.clear();
  renderUpgraceIcon(chip.canvasFlex, u);
  setAriaLabel(chip.canvasFlex.div, 'info: ' + name);

  var buyFlex = chip.buyFlex;
  setAriaLabel(buyFlex.div, 'buy: ' + name + ', cost: ' + cost.toString());

  if(!completed) {
    text += '<br>';
    text += (u.is_choice ? 'Choose' : ('Cost: ' + cost.toString()));

    //buyFlex.div.textEl.innerText = buyText;

    //if(cant_afford) buyFlex.div.className = 'efButtonCantAfford';
    //else buyFlex.div.className = 'efButton';
    if(cant_afford) titleFlex.div.className = 'efTextCantAfford';
    else titleFlex.div.className = '';

    util.setEvent(chip.div, 'mouseover', function() {
      state.upgrades[u.index].seen = true;
    }, 'upgradeseen');

  } else {
    text += '<br>';
    if(u.is_choice && completed) {
      text += 'Chosen: ' + ((state.upgrades[u.index].count == 1) ? u.choicename_a : u.choicename_b);
    } else {
      text += 'Cost: ' + cost.toString();
    }
  }


  titleFlex.div.innerHTML = text;

  return chip;
}

// opt_detailed: for dialog. Also adds text about crop itself, if it's an unlock upgrade.
var getUpgradeInfoText = function(u, completed, opt_detailed) {
  var cost = u.getCost(completed ? -1 : 0);
  var infoText = '';


  //infoText += upper(u.name);


  if(u.description) {
    infoText += u.description;
  }

  infoText += '<br><br>Cost: ' + cost.toString();
  if(!completed) infoText += ' (' + getCostAffordTimer(cost) + ')';
  if(u.is_choice && state.upgrades[u.index].count != 0) {
    infoText += '<br><br>Chosen: ' + ((state.upgrades[u.index].count == 1) ? u.choicename_a : u.choicename_b);
  } else {
    infoText += '<br><br>' + 'Have of this upgrade: ' + state.upgrades[u.index].count;
  }
  if(u.cropid != undefined && !u.iscropunlock) {
    infoText += '<br>' + 'Have of this crop: ' + state.cropcount[u.cropid];
  }
  if(u.cropid != undefined && !u.isprestige) {
    var c = crops[u.cropid];
    var c2 = state.crops[u.cropid];
    infoText += '<hr>';
    infoText += 'Crop info (' + c.name + '):<br><br>';

    if(!c.prod.empty()) {
      infoText += 'Base production: ' + c.prod.toString() + '<br>';
      infoText += 'Upgraded production: ' + c.getProd().toString() + '<br>';
    }
    if(c.boost.neqr(0)) {
      infoText += 'Base boost: ' + c.boost.toPercentString() + '<br>';
      var hasboostboost = c.type == CROPTYPE_BEE; // TODO: consolidate getBoostBoost and getBoost into single function to avoid need for this check
      if(c.type == CROPTYPE_CHALLENGE) hasboostboost = c.index == challengecrop_0 || c.index == challengecrop_1 || c.index == challengecrop_2;
      infoText += 'Upgraded boost: ' + (hasboostboost ? c.getBoostBoost() : c.getBoost()).toPercentString() + '<br>';
    }


    var cropcost = c.getCost();
    infoText += 'Planting cost: ' + cropcost.toString() + ' (' + getCostAffordTimer(cropcost) + ')<br>';
    if(c.type == CROPTYPE_BRASSICA) {
      infoText += 'Living time: ' + util.formatDuration(c.getPlantTime());
    } else {
      infoText += 'Grow time: ' + util.formatDuration(c.getPlantTime());
      if(c.getPlantTime() != c.planttime) infoText += ' (base: ' + util.formatDuration(c.planttime) + ')';
    }
    infoText += '<br>';
    infoText += 'Type: ' + getCropTypeName(c.type) +  (c.tier ? (' (tier ' + (c.tier + 1) + ')') : '') + '<br>';
    if(c2.prestige) infoText += 'Prestiged: ' + c2.prestige + 'x<br>';

    if(opt_detailed) {
      var c = crops[u.cropid];
      if(c) infoText += '<br>' + c.tagline;
    }
  }
  return infoText;
};

function renderUpgradeDialog(chip, completed) {
  var u = upgrades[chip.u];
  var okfun = undefined;
  var okname = undefined;
  if(!u.is_choice) {
    okfun = function() {
      addAction({type:ACTION_UPGRADE, u:u.index, shift:false});
      if(u.maxcount == 1) closeAllDialogs();
      update();
      dialog.content.div.innerHTML = getUpgradeInfoText(u, completed, true);
      return true;
    };
    okname = u.maxcount == 1 ? 'buy' : 'buy one';
  }
  var extrafun = undefined;
  var extraname = undefined;
  if(!u.is_choice && u.maxcount != 1) {
    extrafun = function() {
      addAction({type:ACTION_UPGRADE, u:u.index, shift:true});
      //closeAllDialogs();
      update();
      dialog.content.div.innerHTML = getUpgradeInfoText(u, completed, true);
      return true;
    };
    extraname = 'buy many';
  }
  chip.updateInfoText();
  var dialog = createDialog({
    size:DIALOG_SMALL,
    functions:[okfun, extrafun],
    names:[okname, extraname],
    cancelname:'close',
    title:upper(u.name),
    iconmargin:0.1
  });
  dialog.content.div.innerHTML = getUpgradeInfoText(u, completed, true);
  renderUpgraceIcon(dialog.icon, u);

}

// make a button for planting a crop with picture, price and info. w should be larger than h for good effect.
// opt_ui_location: 1 = upgrades tab, 2 = side panel (for other locations like the completed upgrades window, leave undefined or 0)
function renderUpgradeChip(u, x, y, w, chip, completed, opt_ui_location) {
  if(chip.titleFlex) {
    rerenderUpgradeChip(u, chip, completed, opt_ui_location);
    chip.updateInfoText();
    return;
  }
  var div = chip.div;
  var titleFlex = new Flex(chip, [0, 0, 0.8], 0.05, 1, 0.3);
  chip.titleFlex = titleFlex;
  var canvasFlex = new Flex(chip, 0.01, [0.5, 0, -0.35], [0, 0, 0.7], [0.5, 0, 0.35]);
  chip.canvasFlex = canvasFlex;
  var buyFlex = new Flex(chip, [0, 0, 0.8], 0.01, 0.9, [0.5, 0, 0.35]);
  chip.buyFlex = buyFlex;
  chip.u = u.index;


  var infoText = '';
  var updateInfoText = function() {
    infoText = getUpgradeInfoText(upgrades[chip.u], completed);
  };

  if(!completed) {
    styleButton0(buyFlex.div);

    util.setEvent(chip.div, 'mouseover', function() {
      var u = upgrades[chip.u];
      state.upgrades[u.index].seen = true;
    }, 'upgradeseen');
  }

  registerAction(buyFlex.div, completed ? undefined : bind(function(i, shift, ctrl) {
    var u = upgrades[chip.u];
    if(u.is_choice) {
      var dialog;
      var funa = function() {
        addAction({type:ACTION_UPGRADE, u:u.index, shift:false, choice:1});
        update();
      };
      var funb = function() {
        addAction({type:ACTION_UPGRADE, u:u.index, shift:false, choice:2});
        update();
      };
      dialog = createDialog({
        size:DIALOG_MEDIUM,
        title:upper(u.name),
        functions:[funa, funb],
        names:[u.choicename_a, u.choicename_b],
        iconmargin:0.1
      });
      dialog.content.div.innerHTML = u.description;
      renderUpgraceIcon(dialog.icon, u);
    } else {
      addAction({type:ACTION_UPGRADE, u:u.index, shift:shift});
      update();
    }

    // misclicking with shift on often creates unwanted text selection, fix that here
    if(window.getSelection) window.getSelection().removeAllRanges();
    else if(document.selection) document.selection.empty();
  }, i), completed ? undefined : 'buy one', {
    label_shift:(completed ? undefined : 'buy many'),
    tooltip:function() {
      updateInfoText();
      return infoText;
    },
    tooltip_poll:true
  });


  styleButton0(canvasFlex.div);

  registerAction(canvasFlex.div, function(shift, ctrl) {
    renderUpgradeDialog(chip);
  }, 'Show upgrade info', {
    tooltip:function() { return 'Show ' + lower(upgrades[chip.u].name) + ' info'; }
  });

  chip.updateInfoText = updateInfoText;
  rerenderUpgradeChip(u, chip, completed, opt_ui_location);
  chip.updateInfoText();

  util.setEvent(chip.div, 'mouseover', bind(function(x, y) {
    mouseOverUpgradeCrop = u.cropid;
  }, x, y), 'fieldover');
  util.setEvent(chip.div, 'mouseout', bind(function(x, y) {
    mouseOverUpgradeCrop = null;
  }, x, y), 'fieldout');

  return chip;
}

var mouseOverUpgradeCrop = null;

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
  findtop(CROPTYPE_NUT, array);
  findtop(CROPTYPE_FLOWER, array);
  findtop(CROPTYPE_BEE, array);
  findtop(CROPTYPE_STINGING, array);
  findtop(CROPTYPE_BRASSICA, array);
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
    var relevant = (u.cropid == undefined) || (!!state.cropcount[u.cropid] /*|| crops[u.cropid].type == CROPTYPE_BRASSICA*/);
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



// cache the existing upgrade-chips to reuse them. This avoids following problem:
// if chips are rerendered whenever anything related to upgrades updates, then if you click on the buy button with mouse and before you release mouse it updated, the onclick does not work. This causes clicking upgrades to ignore your click when automaton did updates in between
var upgradeFlexCache = [];
var upgradeFlexCacheParent = undefined;

function updateUpgradeUI() {
  if(upgrades_order.length == 0) computeUpgradeUIOrder();

  upgrade_ui_cache = [];
  var scrollPos = 0;
  if(upgradeScrollFlex) scrollPos = upgradeScrollFlex.div.scrollTop;

  var titleFlex;
  var scrollFlex;

  if(upgradeFlexCacheParent != upgradeFlex) {
    upgradeFlex.clear();
    upgradeFlexCache = [];
    upgradeFlexCacheParent = upgradeFlex;

    // TODO: use a cache of chips similar to bottomrightSidePanelFlexCache for the side-panel to avoid hard to click upgrade chips
    scrollFlex = new Flex(upgradeFlex, 0, 0.01, 1, 1);
    upgradeScrollFlex = scrollFlex;
    makeScrollable(scrollFlex);


    titleFlex = new Flex(scrollFlex, 0.01, 0.02, 0.95, 0.15);

    var titleText = '';
    titleText = 'Hold shift to buy as many as possible';
    titleText += '<br>';
    titleText += 'Click icon or see tooltip for more info';
    titleFlex.div.innerHTML = titleText;

    upgradeFlex.scrollFlex = scrollFlex;
    upgradeFlex.titleFlex = titleFlex;
  } else {
    scrollFlex = upgradeFlex.scrollFlex;
    titleFlex = upgradeFlex.titleFlex;
  }

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

    var chip = upgradeFlexCache[i] || new Flex(scrollFlex, x * w + 0.01, [0.15, 0, y * h + 0.01, 0.27], (x + 1) * w - 0.01, [0.15, 0, (y + 1) * h - 0.01, 0.27]);
    upgradeFlexCache[i] = chip;

    renderUpgradeChip(u, i & 1, i >> 1, 0.45, chip, false, 1);
  }
  for(var i = unlocked.length; i < upgradeFlexCache.length; i++) {
    if(!upgradeFlexCache[i]) continue;
    upgradeFlexCache[i].removeSelf(scrollFlex);
    upgradeFlexCache[i] = undefined;
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


    var chip = new Flex(scrollFlex, 0 * w + 0.01, [0.15, 0, y * h + 0.01, 0.27], (0 + 1) * w - 0.01, [0.15, 0, (y + 1) * h - 0.01, 0.27], undefined, /*align=*/4);
    upgradeFlexCache[i] = chip;

    styleButton(chip.div);
    chip.div.innerText = 'See Completed Upgrades';

    addButtonAction(chip.div, function() {
      var dialog = createDialog({scrollable:true, title:'Completed upgrades'});

      for(var i = 0; i < researched.length; i++) {
        var u = upgrades[researched[i]];
        var div = makeDiv(pos[0], pos[1], 200, 20, dialog.content.div);

        var x = (i & 1);
        var y = i >> 1;
        var chip = new Flex(dialog.content, x * w + 0.01, [0, 0, y * h + 0.01, 0.27], (x + 1) * w - 0.01, [0, 0, (y + 1) * h - 0.01, 0.27]);
        renderUpgradeChip(u, i & 1, i >> 1, 0.45, chip, true);
        chip.div.style.color = '#2a2';
        chip.div.style.borderColor = '#2a2';
      }

      dialog.content.update(); // something goes wrong with alignment some chips (due to the point where scrollbar appears) in the scrollflex when not updating this now.
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
