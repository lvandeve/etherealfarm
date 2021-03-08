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


//upgradeDiv.style.overflow = 'scroll';



// make a button for planting a crop with picture, price and info. w should be larger than h for good effect.
function renderUpgrade2Chip(u, x, y, w, flex, completed) {
  var div = flex.div;
  div.className = 'efEtherealUpgradeChip';

  var cost = u.getCost(completed ? -1 : 0);
  var titleFlex = new Flex(flex, [0, 0.8], 0.05, 1, 0.3, 1);
  var name = upper(completed ? u.getName() : u.getNextName());
  titleFlex.div.innerHTML = name;
  titleFlex.div.style.whiteSpace = 'nowrap';

  var canvasFlex = new Flex(flex, 0.01, [0.5, -0.35], [0, 0.7], [0.5, 0.35]);
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

  var buyFlex = new Flex(flex, [0, 0.8], 0.4, 0.9, [0.5, 0.35], 0.8);

  var infoText = upper(name);
  infoText += '<br><br>Cost: ' + cost.toString();
  if(u.description) {
    infoText += '<br><br>' + u.description;
  }
  infoText += '<br><br>' + 'This ethereal upgrade is non-refundable and permanent. Lasts through transcensions.';
  if(u.treelevel2 > 0 || state.treelevel2 > 0) {
    infoText += '<br><br>' + 'Ethereal tree level: ' + u.treelevel2;
  }

  if(!completed) {
    styleButton(buyFlex.div);
    var buyText = 'Cost: ' + cost.toString();

    buyFlex.div.textEl.innerText = buyText;

    if(state.res.lt(cost)) buyFlex.div.className = 'efButtonCantAfford';

    addButtonAction(buyFlex.div, bind(function(i, e) {
      actions.push({type:ACTION_UPGRADE2, u:u.index});
      update();
    }, i));
  } else {
    buyFlex.div.innerText = 'Cost: ' + cost.toString();
    //buyFlex.setCentered();
  }


  registerTooltip(flex.div, infoText);

  styleButton0(canvasFlex.div);

  addButtonAction(canvasFlex.div, function() {
    var dialog = createDialog(DIALOG_SMALL);
    dialog.content.div.innerHTML = infoText;
  }, 'ethereal upgrade icon for ' + name);


  return flex;
}

var upgrade2ScrollFlex = null;



var upgrades2_order = [];
function computeUpgrade2UIOrder() {
  var array;
  upgrades2_order = [];

  var added = {};

  // one-time upgrades (unlocks, ...) that cost spores (= special tree related ones)
  array = [];
  for(var i = 0; i < registered_upgrades2.length; i++) {
    if(added[registered_upgrades2[i]]) continue;
    var u = upgrades2[registered_upgrades2[i]];
    array.push(registered_upgrades2[i]);
  }
  array = array.sort(function(a, b) {
    a = upgrades2[a];
    b = upgrades2[b];
    if(a.treelevel2 != b.treelevel2) return a.treelevel2 < b.treelevel2 ? 1 : -1;
    return a.cost.resin.lt(b.cost.resin) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    upgrades2_order.push(array[i]);
    added[array[i]] = true;
  }
}

var upgrades2_order_cache = [];
// this is just to avoid all the sorting of computeUpgrade2UIOrder when not necessary
function computeUpgrade2UIOrderIfNeeded() {
  var counts = [];
  for(var i = 0; i < registered_upgrades2.length; i++) {
    var count = state.upgrades2[registered_upgrades2[i]].count;
  }
  var same = true;
  for(var i = 0; i < counts.length; i++) {
    if(i >= upgrades2_order_cache || upgrades2_order_cache[i] != counts[i]) {
      same = false;
      break;
    }
  }
  if(same) return false;
  upgrades2_order_cache = counts;
  computeUpgrade2UIOrder();
  return true; // actually not guaranteed that it changed, but at least the right pane must be updated sometimes if planting a crop changed the relevance of some
}



function updateUpgrade2UI() {
  if(upgrades2_order.length == 0) computeUpgrade2UIOrder();

  var scrollPos = 0;
  if(upgrade2ScrollFlex) scrollPos = upgrade2ScrollFlex.div.scrollTop;

  upgrade2Flex.clear();

  var scrollFlex = new Flex(upgrade2Flex, 0, 0.01, 1, 1);
  upgrade2ScrollFlex = scrollFlex;
  makeScrollable(scrollFlex);

  var titleFlex = new Flex(scrollFlex, 0.01, 0, 0.99, 0.2, 0.25);


  var unlocked = [];
  for(var i = 0; i < upgrades2_order.length; i++) {
    var j = upgrades2_order[i];
    if(upgrades2[j].canUpgrade()) unlocked.push(j);
  }

  var text = '';
  text += 'Ethereal upgrades are permanent and the resin is not refundable. You can also spend resin on plants in the ethereal field instead.';
  text += '<br><br>'
  if(unlocked.length == 0) {
    text += '<i>No further ethereal upgrades are available for now.</i>';
  } else {
    text += 'Click the icon of an upgrade or see its tooltip for a more detailed description.';
  }

  titleFlex.div.innerHTML = text;

  var pos = [0, 0];

  for(var i = 0; i < unlocked.length; i++) {
    var u = upgrades2[unlocked[i]];

    var x = (i & 1);
    var y = (i >> 1);
    var w = 0.45;
    var chip = new Flex(scrollFlex, x * w + 0.01, [0.25, y * w + 0.01, 0.25], [(x + 1) * w - 0.01], [0.25, (y + 1) * w - 0.01, 0.25], 0.75);
    renderUpgrade2Chip(u, i & 1, i >> 1, 0.45, chip, false);
  }

  var researched = [];
  for(var i = 0; i < upgrades2_order.length; i++) {
    var j = upgrades2_order[i];
    //if(upgrades[j].isExhausted()) researched.push(j);
    if(state.upgrades2[j].count) researched.push(j);
  }

  if(researched.length > 0) {
    var x = 0;
    var y = ((unlocked.length + 1) >> 1) + 0.33;
    var w = 0.45;

    var flex = new Flex(scrollFlex, 0 * w + 0.01, [0.25, y * w + 0.01, 0.27], [(0 + 1) * w - 0.01], [0.25, (y + 1) * w - 0.01, 0.27], 0.6);
    styleButton(flex.div);
    flex.div.innerText = 'See Completed Upgrades';
    flex.setCentered();

    addButtonAction(flex.div, function() {
      var dialog = createDialog();

      var scrollFlex = dialog.content;
      makeScrollable(scrollFlex);

      for(var i = 0; i < researched.length; i++) {
        var u = upgrades2[researched[i]];
        var div = makeDiv(pos[0], pos[1], 200, 20, scrollFlex.div);

        var x = (i & 1);
        var y = i >> 1;
        var w = 0.45;
        var chip = new Flex(scrollFlex, x * w + 0.01, [0, y * w + 0.01, 0.27], [(x + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.27], 0.75);
        renderUpgrade2Chip(u, i & 1, i >> 1, 0.45, chip, true);
        chip.div.style.color = '#2a2';
        chip.div.style.borderColor = '#2a2';
      }

      scrollFlex.update(); // something goes wrong with the last chip in the scrollflex when not updating this now.
    });
  }

  //appearance of scrollbar can shift positions of some flexes, causing some boxes to shift, hence update entire flex again
  scrollFlex.update();

  upgrade2ScrollFlex.div.scrollTop = scrollPos;
}

var upgrade2_ui_cache = [];

function updateUpgrade2UIIfNeeded() {
  var unlocked = [];
  for(var i = 0; i < registered_upgrades2.length; i++) {
    var j = registered_upgrades2[i];
    if(upgrades2[j].canUpgrade()) unlocked.push(j);
  }

  var cache = [];
  for(var i = 0; i < unlocked.length; i++) {
    var u = upgrades2[unlocked[i]];
    var u2 = state.upgrades2[unlocked[i]];
    var cost = u.getCost(0);
    cache[i] = [state.res.lt(cost), u2.count, u.index];
  }

  var eq = false;
  if(upgrade2_ui_cache.length == cache.length) {
    eq = true;
    for(var i = 0; i < cache.length; i++) {
      if(cache[i][0] != upgrade2_ui_cache[i][0] || cache[i][1] != upgrade2_ui_cache[i][1] || cache[i][2] != upgrade2_ui_cache[i][2]) {
        eq = false;
        break;
      }
    }
  }

  if(!eq) {
    updateUpgrade2UI();
    upgrade2_ui_cache = cache;
  }
}
