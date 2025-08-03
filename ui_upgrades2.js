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


//upgradeDiv.style.overflow = 'scroll';



// make a button for planting a crop with picture, price and info. w should be larger than h for good effect.
function renderUpgrade2Chip(u, x, y, w, flex, completed) {
  var div = flex.div;
  div.className = 'efEtherealUpgradeChip';

  var cost = u.getCost(completed ? -1 : 0);
  var titleFlex = new Flex(flex, [0, 0, 0.8], 0.05, 1, 0.3);
  var name = completed ? u.getName() : u.getNextName();
  //titleFlex.div.innerHTML = name;
  //titleFlex.div.style.whiteSpace = 'nowrap';
  var text = upper(name);

  var canvasFlex = new Flex(flex, 0.01, [0.5, 0, -0.35], [0, 0, 0.7], [0.5, 0, 0.35]);
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

  var buyFlex = new Flex(flex, [0, 0, 0.8], 0.01, 0.9, [0.5, 0, 0.35]);

  var infoText = upper(name);
  infoText += '<br><br>Cost: ' + cost.toString();

  infoText += '<br><br>' + 'have of this upgrade: ' + state.upgrades2[u.index].count;

  if(u.description) {
    infoText += '<br><br>' + u.getDescription();
  }
  infoText += '<br><br>' + 'This ethereal upgrade is non-refundable and permanent. Lasts through transcensions.';
  if(u.treelevel2 > 0 || state.treelevel2 > 0) {
    infoText += '<br><br>' + 'Unlocked at ethereal tree level: ' + u.treelevel2;
  }

  text += '<br>';
  text += 'Cost: ' + cost.toString();

  if(!completed) {
    styleButton0(buyFlex.div);

    //buyFlex.div.textEl.innerText = buyText;

    if(state.res.lt(cost)) titleFlex.div.className = 'efTextCantAfford';
  }

  registerAction(buyFlex.div, completed ? undefined : bind(function(i, shift, ctrl) {
    addAction({type:ACTION_UPGRADE2, u:u.index});
    update();
  }, i), completed ? undefined : 'buy ' + name, {
    tooltip:infoText
  });

  styleButton0(canvasFlex.div);

  registerAction(canvasFlex.div, bind(function(i, shift, ctrl) {
    var dialog = createDialog({size:DIALOG_SMALL, title:'Ethereal upgrade info'});
    dialog.content.div.innerHTML = infoText;
  }, i), 'Show upgrade info', {
    tooltip:('Show ' + name + ' info' + '<br><hr><br>' + infoText)
  });

  titleFlex.div.innerHTML = text;

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
    if(a.cost.resin.neq(b.cost.resin)) return a.cost.resin.lt(b.cost.resin) ? 1 : -1;
    return a.index < b.index ? -1 : 1;
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

  var titleFlex = new Flex(scrollFlex, 0.01, 0, 0.99, 0.2);


  var unlocked = [];
  for(var i = 0; i < upgrades2_order.length; i++) {
    var j = upgrades2_order[i];
    if(upgrades2[j].canUpgrade()) unlocked.push(j);
  }

  var text = '';
  text += 'Ethereal upgrades are permanent and the resin is not refundable. You can also spend resin on plants in the ethereal field instead.';
  text += '<br><br>'
  text += 'Level up the ethereal tree to get more upgrades.';
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
    var chip = new Flex(scrollFlex, x * w + 0.01, [0.25, 0, y * w + 0.01, 0.25], (x + 1) * w - 0.01, [0.25, 0, (y + 1) * w - 0.01, 0.25]);
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

    var flex = new Flex(scrollFlex, 0 * w + 0.01, [0.25, 0, y * w + 0.01, 0.27], (0 + 1) * w - 0.01, [0.25, 0, (y + 1) * w - 0.01, 0.27], undefined, /*align=*/4);
    styleButton(flex.div);
    flex.div.innerText = 'See Completed Upgrades';

    addButtonAction(flex.div, function() {
      var dialog = createDialog({scrollable:true, title:'Completed ethereal upgrades'});

      for(var i = 0; i < researched.length; i++) {
        var u = upgrades2[researched[i]];
        var div = makeDiv(pos[0], pos[1], 200, 20, dialog.content.div);

        var x = (i & 1);
        var y = i >> 1;
        var w = 0.45;
        var chip = new Flex(dialog.content, x * w + 0.01, [0, 0, y * w + 0.01, 0.27], (x + 1) * w - 0.01, [0, 0, (y + 1) * w - 0.01, 0.27]);
        renderUpgrade2Chip(u, i & 1, i >> 1, 0.45, chip, true);
        chip.div.style.color = '#2a2';
        chip.div.style.borderColor = '#2a2';
      }

      dialog.content.update(); // something goes wrong with alignment some chips (due to the point where scrollbar appears) in the scrollflex when not updating this now.
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
