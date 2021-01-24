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
  var titleFlex = new Flex(flex, [0, 0.8], 0.05, 1, 0.3, 1);
  var name = completed ? u.getName() : u.getNextName();
  titleFlex.div.innerHTML = name;
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
    infoText = name;
    infoText += '<br><br>Cost: ' + cost.toString();
    if(!completed) infoText += ' (' + getCostAffordTimer(cost) + ')';
    if(u.cropid != undefined) {
      infoText += '<br><br>' + 'have of this crop: ' + state.cropcount[u.cropid];
    }
    if(u.description) {
      infoText += '<br><br>' + u.description;
    }
    if(u.is_choice && completed) {
      infoText += '<br><br>chosen: ' + ((state.upgrades[u.index].count == 1) ? u.choicename_a : u.choicename_b);
    }
  };
  updateInfoText();

  if(!completed) {
    styleButton(buyFlex.div);
    var buyText = (u.is_choice ? 'Choice: ' : 'Buy: ') + cost.toString();

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
        var flex = new Flex(dialog, 0.01, 0.01, 0.99, 0.8, 0.3);
        flex.div.innerHTML = u.description;
      } else {
        actions.push({type:ACTION_UPGRADE, u:u.index, shift:e.shiftKey});
        update();
      }

      // misclicking with shift on often creates unwanted text selection, fix that here
      if(window.getSelection) window.getSelection().removeAllRanges();
      else if(document.selection) document.selection.empty();
    }, i));
  } else {
    buyFlex.div.innerText = 'Cost: ' + cost.toString();
    //buyFlex.setCentered();
  }


  registerTooltip(flex.div, function() {
    updateInfoText();
    return infoText;
  }, true);

  styleButton0(canvasFlex.div);

  addButtonAction(canvasFlex.div, function() {
    updateInfoText();
    var dialog = createDialog(DIALOG_SMALL);
    var flex = new Flex(dialog, [0, 0.01], [0, 0.01], 0.99, 0.9, 0.3);
    flex.div.innerHTML = infoText;
  }, 'upgrade icon for ' + name);


  return flex;
}

var upgradeScrollFlex = null;



// if true, moves upgrades related to unplanted crops to the bottom. However,
// this may cause players to not see that upgrade and hence not remember that
// they had this higher level crop unlocked in the first place.
// So disabled now, better to have a reminder of your best crop visibile
// at the top of the upgrades panel, than to have it at the bottom because
// it's not planted yet. Without this the sort order places more expensive
// crops higher up.
var moveunplantedtobottom = false;



var upgrades_order = [];
function computeUpgradeUIOrder() {
  var array;
  upgrades_order = [];

  // one-time upgrades (unlocks, ...) that cost spores (= special tree related ones)
  array = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
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
  }

  // one-time upgrades (unlocks, ...) that cost seeds
  array = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
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
  }

  // finite amount of time upgrades (those don't yet exist actually)
  array = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
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
  }

  // infinite amount of times upgrades, sorted by costs, that are relevant (has plants they apply to in the field, or for the limited-time watercress)
  array = [];
  var highest = Num(0);
  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = upgrades[registered_upgrades[i]];
    if(u.maxcount != 0) continue;
    var relevant = !moveunplantedtobottom || (u.cropid == undefined) || (!!state.cropcount[u.cropid] || crops[u.cropid].type == CROPTYPE_SHORT);
    if(!relevant) continue;
    array.push(registered_upgrades[i]);
    if(u.cost && state.upgrades[registered_upgrades[i]].unlocked) highest = Num.max(u.cost.seeds, highest);
  }
  // a bit of a hack to move watercress higher up since it's always relevant. Make it take second place.
  var fakewatercresscost = highest.divr(2);
  array = array.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    var costa = a.cost.seeds;
    var costb = b.cost.seeds;
    if(a.cropid != undefined && crops[a.cropid].type == CROPTYPE_SHORT) {
      costa = fakewatercresscost;
    }
    if(b.cropid != undefined && crops[b.cropid].type == CROPTYPE_SHORT) costb = fakewatercresscost;
    return costa.lt(costb) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    upgrades_order.push(array[i]);
  }

  if(moveunplantedtobottom) {
    // infinite amount of times upgrades, sorted by costs, that are currently not relevant (has no plants they apply to in the field)
    array = [];
    for(var i = 0; i < registered_upgrades.length; i++) {
      var u = upgrades[registered_upgrades[i]];
      if(u.maxcount != 0) continue;
      var relevant = !u.cropid || (!!state.cropcount[u.cropid] || crops[u.cropid].type == CROPTYPE_SHORT);
      if(relevant) continue;
      array.push(registered_upgrades[i]);
    }
    array = array.sort(function(a, b) {
      a = upgrades[a];
      b = upgrades[b];
      return a.cost.seeds.lt(b.cost.seeds) ? 1 : -1;
    });
    for(var i = 0; i < array.length; i++) {
      upgrades_order.push(array[i]);
    }
  }
}

var upgrades_order_cache = [];
// this is just to avoid all the sorting of computeUpgradeUIOrder when not necessary
function computeUpgradeUIOrderIfNeeded() {
  var cropcount = [];
  for(var i = 0; i < registered_crops.length; i++) {
    var count = state.cropcount[registered_crops[i]];
    cropcount[i] = !!count;
  }
  var same = true;
  for(var i = 0; i < cropcount.length; i++) {
    if(i >= upgrades_order_cache || upgrades_order_cache[i] != cropcount[i]) {
      same = false;
      break;
    }
  }
  if(same) return;
  upgrades_order_cache = cropcount;
  computeUpgradeUIOrder();
}



function updateUpgradeUI() {
  if(upgrades_order.length == 0) computeUpgradeUIOrder();

  upgrade_ui_cache = [];
  var scrollPos = 0;
  if(upgradeScrollFlex) scrollPos = upgradeScrollFlex.div.scrollTop;

  upgradeFlex.clear();


  var scrollFlex = new Flex(upgradeFlex, 0, 0.01, 1, 1);
  upgradeScrollFlex = scrollFlex;
  scrollFlex.div.style.overflowY = 'scroll';
  scrollFlex.div.style.overflowX = 'visible';
  scrollFlex.div.style.border = '5px solid #ccc';


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

  for(var i = 0; i < unlocked.length; i++) {
    var u = upgrades[unlocked[i]];

    var x = (i & 1);
    var y = (i >> 1);
    var w = 0.45;
    var chip = new Flex(scrollFlex, x * w + 0.01, [0.15, y * w + 0.01, 0.27], [(x + 1) * w - 0.01], [0.15, (y + 1) * w - 0.01, 0.27], 0.75);
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
    var w = 0.45;

    var flex = new Flex(scrollFlex, 0 * w + 0.01, [0.15, y * w + 0.01, 0.27], [(0 + 1) * w - 0.01], [0.15, (y + 1) * w - 0.01, 0.27], 0.6);
    styleButton(flex.div);
    flex.div.innerText = 'See Completed Upgrades';
    flex.setCentered();

    addButtonAction(flex.div, function() {
      var dialog = createDialog();
      var flex = new Flex(dialog, [0, 0.01], [0, 0.01], 0.99, 0.9, 0.3);

      var scrollFlex = new Flex(dialog, 0, 0.1, 1, 0.85);

      scrollFlex.div.innerText = '';
      scrollFlex.div.style.overflowY = 'scroll';

      for(var i = 0; i < researched.length; i++) {
        var u = upgrades[researched[i]];
        var div = makeDiv(pos[0], pos[1], 200, 20, scrollFlex.div);

        var x = (i & 1);
        var y = i >> 1;
        var w = 0.45;
        var chip = new Flex(scrollFlex, x * w + 0.01, [0, y * w + 0.01, 0.27], [(x + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.27], 0.75);
        renderUpgradeChip(u, i & 1, i >> 1, 0.45, chip, true);
        chip.div.style.color = '#2a2';
        chip.div.style.borderColor = '#2a2';
      }
    });
  }

  //upgradeFlex.div.appendChild(scrollFlex.div);
  //upgradeFlex.update();

  upgradeScrollFlex.div.scrollTop = scrollPos;
}

var upgrade_ui_cache = [];

function updateUpgradeUIIfNeeded() {
  computeUpgradeUIOrderIfNeeded();

  var unlocked = [];
  for(var i = 0; i < upgrades_order.length; i++) {
    var j = upgrades_order[i];
    if(upgrades[j].canUpgrade()) unlocked.push(j);
  }

  var cache = [];
  for(var i = 0; i < unlocked.length; i++) {
    var u = upgrades[unlocked[i]];
    var cost = u.getCost(0);
    if(state.res.lt(cost)) cache[i] = true;
    else cache[i] = false;
  }

  var eq = false;
  if(upgrade_ui_cache.length == cache.length) {
    eq = true;
    for(var i = 0; i < cache.length; i++) {
      if(cache[i] != upgrade_ui_cache[i]) {
        eq = false;
        break;
      }
    }
  }

  if(!eq) {
    updateUpgradeUI();
    upgrade_ui_cache = cache;
  }
}
