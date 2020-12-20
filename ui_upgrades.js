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
  div.style.border = '1px solid black';
  div.style.backgroundColor = '#ffe';

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
    if(!completed && cost.seeds.neqr(0)) {
      var percent = cost.seeds.div(state.res.seeds).mulr(100); // TODO: take other resources into account if used
      if(percent.ltr(0.001)) percent = Num(0); // avoid display like '1.321e-9%'
      if(percent.gtr(100)) {
        infoText += ' (' + percent.toString(0, Num.N_FULL) + '% of stacks)';
      } else {
        infoText += ' (' + percent.toString() + '% of stacks)';
      }
    }
    if(u.description) {
      infoText += '<br><br>' + u.description;
    }
  };
  updateInfoText();

  if(!completed) {
    var buyText = 'Buy: ' + cost.toString();

    buyFlex.div.innerText = buyText;
    buyFlex.setCentered();

    buyFlex.div.style.border = '1px solid black';
    buyFlex.div.style.backgroundColor = '#ccc';
    styleButton0(buyFlex.div);

    if(state.res.lt(cost)) buyFlex.div.style.color = '#aaa';

    buyFlex.div.onclick = bind(function(i, e) {
      actions.push({type:ACTION_UPGRADE, u:u.index, shift:e.shiftKey});
      update();
    }, i);
  } else {
    buyFlex.div.innerText = 'Cost: ' + cost.toString();
    //buyFlex.setCentered();
  }


  registerTooltip(flex.div, function() {
    updateInfoText();
    return infoText;
  }, true);

  styleButton0(canvasFlex.div);

  canvasFlex.div.onclick = function() {
    updateInfoText();
    var dialog = createDialog(true);
    var flex = new Flex(dialog, [0, 0.01], [0, 0.01], 0.99, 0.9, 0.3);
    flex.div.innerHTML = infoText;
  };


  return flex;
}

var upgradeScrollFlex = null;

var upgrades_order = [];
function computeUpgradeUIOrder() {
  var rev;

  rev = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = upgrades[registered_upgrades[i]];
    if(u.maxcount == 1 && u.cost.spores.neqr(0)) rev.push(registered_upgrades[i]);
  }
  rev = rev.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    return a.cost.spores.lt(b.cost.spores) ? 1 : -1;
  });
  for(var i = 0; i < rev.length; i++) {
    upgrades_order.push(rev[i]);
  }

  rev = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = upgrades[registered_upgrades[i]];
    if(u.maxcount == 1 && u.cost.spores.eqr(0)) rev.push(registered_upgrades[i]);
  }
  rev = rev.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    return a.cost.seeds.lt(b.cost.seeds) ? 1 : -1;
  });
  for(var i = 0; i < rev.length; i++) {
    upgrades_order.push(rev[i]);
  }

  rev = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = upgrades[registered_upgrades[i]];
    if(u.maxcount > 1) rev.push(registered_upgrades[i]);
  }
  rev = rev.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    return a.cost.seeds.lt(b.cost.seeds) ? 1 : -1;
  });
  for(var i = 0; i < rev.length; i++) {
    upgrades_order.push(rev[i]);
  }

  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = upgrades[registered_upgrades[i]];
    if(u.maxcount == 0) rev.push(registered_upgrades[i]);
  }
  rev = rev.sort(function(a, b) {
    a = upgrades[a];
    b = upgrades[b];
    return a.cost.seeds.lt(b.cost.seeds) ? 1 : -1;
  });
  for(var i = 0; i < rev.length; i++) {
    upgrades_order.push(rev[i]);
  }
}



function updateUpgradeUI() {
  if(upgrades_order.length == 0) computeUpgradeUIOrder();

  upgrade_ui_cache = [];
  var scrollPos = 0;
  if(upgradeScrollFlex) scrollPos = upgradeScrollFlex.div.scrollTop;

  upgradeFlex.clear();

  var titleFlex = new Flex(upgradeFlex, 0.01, 0.02, 0.95, 0.15, 0.3);

  var titleText = '';
  titleText = 'Hold shift to buy as many as possible';
  titleText += '<br>';
  titleText += 'Click icon or see tooltip for more info';
  titleFlex.div.innerHTML = titleText;

  var scrollFlex = new Flex(upgradeFlex, 0, 0.15, 1, 1);
  upgradeScrollFlex = scrollFlex;
  upgradeFlex.div.removeChild(scrollFlex.div);

  scrollFlex.div.innerText = '';
  scrollFlex.div.style.overflowY = 'scroll';
  scrollFlex.div.style.border = '5px solid #ccc';
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
    var chip = new Flex(scrollFlex, x * w + 0.01, [0, y * w + 0.01, 0.27], [(x + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.27], 0.75);
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

    var flex = new Flex(scrollFlex, 0 * w + 0.01, [0, y * w + 0.01, 0.27], [(0 + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.27], 0.6);
    styleButton(flex.div);
    flex.div.innerText = 'See Completed Upgrades';
    flex.setCentered();

    flex.div.onclick = function() {
      var dialog = createDialog();
      var flex = new Flex(dialog, [0, 0.01], [0, 0.01], 0.99, 0.9, 0.3);

      var scrollFlex = new Flex(dialog, 0, 0.1, 1, 0.9);

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

    };
  }

  upgradeFlex.div.appendChild(scrollFlex.div);
  upgradeFlex.update();

  upgradeScrollFlex.div.scrollTop = scrollPos;
}

var upgrade_ui_cache = [];

function updateUpgradeUIIfNeeded() {
  if(upgrades_order.length == 0) computeUpgradeUIOrder();

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
