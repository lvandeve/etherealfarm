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
  div.style.border = '1px solid yellow';
  div.style.backgroundColor = '#9df';

  var cost = u.getCost(completed ? -1 : 0);
  var titleFlex = new Flex(flex, [0, 0.8], 0.05, 1, 0.3, 1);
  var name = completed ? u.getName() : u.getNextName();
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

  var infoText = name;
  infoText += '<br>Cost: ' + cost.toString() + '/s';
  if(u.description) {
    infoText += '<br>' + u.description;
  }
  infoText += '<br>' + 'Non-refundable and permanent!';

  if(!completed) {
    var buyText = 'Get: ' + cost.toString() + '/s';

    buyFlex.div.innerText = buyText;
    buyFlex.setCentered();

    buyFlex.div.style.border = '1px solid black';
    buyFlex.div.style.backgroundColor = '#ccc';
    styleButton0(buyFlex.div);

    buyFlex.div.onclick = bind(function(i, e) {
      actions.push({type:ACTION_UPGRADE2, u:u.index});
      update();
    }, i);
  } else {
    buyFlex.div.innerText = 'Cost: ' + cost.toString();
    //buyFlex.setCentered();
  }


  registerTooltip(flex.div, infoText);

  styleButton0(canvasFlex.div);

  canvasFlex.div.onclick = function() {
    var dialog = createDialog(DIALOG_SMALL);
    var flex = new Flex(dialog, [0, 0.01], [0, 0.01], 0.99, 0.9, 0.3);
    flex.div.innerHTML = infoText;
  };


  return flex;
}

// make a button for planting a crop with picture, price and info. w should be larger than h for good effect.
function renderUpgrade3Chip(u, x, y, w, flex, completed) {
  var div = flex.div;
  div.style.border = '1px solid yellow';
  div.style.backgroundColor = '#9df';

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

  var infoFlex = new Flex(flex, [0, 0.8], [0.5, -0.5], 1, [0, 1], 0.6);

  var text = '<b>' + (completed ? u.getName() : u.getNextName()) + '</b><br><b>requirement:</b> ' + u.getCost(completed ? -1 : 0).toString() + '/s';

  if(u.description) {
    text += '<br>' + u.description;
  }

  infoFlex.div.innerHTML = text;

  return flex;
}

function updateUpgrade2UI() {
  upgrade2Flex.clear();

  var titleFlex = new Flex(upgrade2Flex, 0.05, 0, 0.95, 0.2, 0.3);

  var text = '';
  var power = Res({seeds2:gain.seeds2, spores2:gain.spores2});
  text += '• Ethereal field power: ' + power.toProdString();
  text += '<br/>';
  text += '• Power allocated: ' + state.ethereal_upgrade_spent.toProdString();
  text += '<br/>';
  text += '• <b>Power available: ' + (power.sub(state.ethereal_upgrade_spent)).toProdString() + '</b>';

  var buttonFlex = new Flex(upgrade2Flex, 0.6, 0, 0.8, 0.1, 1);
  buttonFlex.setCentered();
  buttonFlex.div.style.backgroundColor = '#ccc';
  styleButton(buttonFlex.div);
  buttonFlex.div.innerText = 'More Info';
  buttonFlex.div.onclick = function() {
    var dialog = createDialog();
    var flex = new Flex(dialog, [0, 0.01], [0, 0.01], 0.99, 0.9, 0.3);

    var text = 'Ethereal upgrades do not cost resources directly, but get allocated ethereal field power - that is: production per second from ethereal crops. Ethereal upgrades are non-refundable and permanent, they last through transcensions.';
    text += '<br/><br/>';
    var power = Res({seeds2:gain.seeds2, spores2:gain.spores2});
    text += '• Ethereal field power: ' + power.toProdString();
    text += '<br/>';
    text += '• Power allocated: ' + state.ethereal_upgrade_spent.toProdString();
    text += '<br/>';
    text += '• <b>Power available: ' + (power.sub(state.ethereal_upgrade_spent)).toProdString() + '</b>';
    text += '<br/><br/>';
    text += 'Click an update icon or view its tooltip for more info.';
    text += '<br/><br/>';
    text += 'Please note: this part of the game is still under design, there may appear a very different set of upgrades here instead of these later, when that happens the old upgrades will be refunded. The upgrades now are likely also very weak. But first the main run must be balanced, and that is also not yet completed. Only then, ethereal upgrades can be implemented and nicely balanced. The 6x6 field upgrade is not reachable yet for now.';

    flex.div.innerHTML = text;
  };
  buttonFlex.updateSelf();

  titleFlex.div.innerHTML = text;

  var scrollFlex = new Flex(upgrade2Flex, 0, 0.15, 1, 1);

  scrollFlex.div.innerText = '';
  scrollFlex.div.style.overflowY = 'scroll';
  scrollFlex.div.style.border = '5px solid #ccc';
  var pos = [0, 0];


  var unlocked = [];
  for(var i = 0; i < registered_upgrades2.length; i++) {
    var j = registered_upgrades2[i];
    if(upgrades2[j].canUpgrade()) unlocked.push(j);
  }

  for(var i = 0; i < unlocked.length; i++) {
    var u = upgrades2[unlocked[i]];

    var x = (i & 1);
    var y = (i >> 1);
    var w = 0.45;
    var chip = new Flex(scrollFlex, x * w + 0.01, [0, y * w + 0.01, 0.25], [(x + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.25], 0.75);
    renderUpgrade2Chip(u, i & 1, i >> 1, 0.45, chip, false);
  }

  var researched = [];
  for(var i = 0; i < registered_upgrades2.length; i++) {
    var j = registered_upgrades2[i];
    //if(upgrades2[j].isExhausted()) researched.push(j);
    if(state.upgrades2[j].count) researched.push(j);
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

    };
  }
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
    var cost = u.getCost(0);
    if(state.res.lt(cost)) cache[i] = true;
    else cache[i] = false;
  }

  var eq = false;
  if(upgrade2_ui_cache.length == cache.length) {
    eq = true;
    for(var i = 0; i < cache.length; i++) {
      if(cache[i] != upgrade2_ui_cache[i]) {
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
