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
function renderUpgradeChip(u, x, y, w, flex, next) {
  var div = flex.div;
  div.style.border = '1px solid black';

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

  var cost = u.getCost(next ? 0 : -1);
  var text = '<b>' + (next ? u.getNextName() : u.getName()) + '</b><br><b>cost:</b> ' + cost.toString();
  var percent = cost.seeds.div(state.res.seeds).mulr(100); // TODO: take other resources into account if used
  if(percent.ltr(0.001)) percent = Num(0); // avoid display like '1.321e-9%'
  if(percent.gtr(100)) {
    text += ' <b>(' + percent.toString(0, Num.N_FULL) + '%)</b>';
  } else {
    text += ' (' + percent.toString() + '%)';
  }


  if(u.description) {
    text += '<br>' + u.description;
  }

  infoFlex.div.innerHTML = text;

  return flex;
}

var upgradeScrollFlex = null;

function updateUpgradeUI() {
  var scrollPos = 0;
  if(upgradeScrollFlex) scrollPos = upgradeScrollFlex.div.scrollTop;

  upgradeFlex.clear();

  var titleFlex = new Flex(upgradeFlex, 0.01, 0.02, 0.95, 0.1, 0.35);

  titleFlex.div.innerText = 'Hold shift to buy as many as possible';

  var scrollFlex = new Flex(upgradeFlex, 0, 0.1, 1, 1);
  upgradeScrollFlex = scrollFlex;
  upgradeFlex.div.removeChild(scrollFlex.div);

  scrollFlex.div.innerText = '';
  scrollFlex.div.style.overflowY = 'scroll';
  var pos = [0, 0];

  var unlocked = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    var j = registered_upgrades[i];
    if(upgrades[j].canUpgrade()) unlocked.push(j);
  }

  for(var i = 0; i < unlocked.length; i++) {
    var u = upgrades[unlocked[i]];

    var x = (i & 1);
    var y = (i >> 1);
    var w = 0.45;
    var chip = new Flex(scrollFlex, x * w + 0.01, [0, y * w + 0.01, 0.27], [(x + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.27], 0.75);
    renderUpgradeChip(u, i & 1, i >> 1, 0.45, chip, true);
    styleButton0(chip.div);

    chip.div.onclick = bind(function(i, e) {
      actions.push({type:ACTION_UPGRADE, u:unlocked[i], shift:e.shiftKey});
    }, i);

    // TODO: enable this. But it should then dynamically change if enough resources appear, and the current rendering of upgrades is slow so this requires a better approach
    /*if(state.res.lt(u.getCost())) {
      chip.div.style.color = '#0008';
      chip.div.style.borderColor = '#0008';
    }*/
  }

  var researched = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    var j = registered_upgrades[i];
    //if(upgrades[j].isExhausted()) researched.push(j);
    if(state.upgrades[j].count) researched.push(j);
  }

  if(researched.length > 0) {
    var x = 0;
    var y = ((unlocked.length + 1) >> 1) + 0.33;
    var w = 0.45;

    var flex = new Flex(scrollFlex, x * w + 0.01, [0, y * w + 0.01, 0.27], 1, [0, (y + 1) * w - 0.01, 0.27], 0.4);
    flex.div.innerText = 'Completed Upgrades';
  }

  for(var i = 0; i < researched.length; i++) {
    var u = upgrades[researched[i]];
    var div = makeDiv(pos[0], pos[1], 200, 20, scrollFlex.div);


    var x = (i & 1);
    var y = ((unlocked.length + 1) >> 1) + 1 + (i >> 1);
    var w = 0.45;
    var chip = new Flex(scrollFlex, x * w + 0.01, [0, y * w + 0.01, 0.27], [(x + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.27], 0.75);
    renderUpgradeChip(u, i & 1, i >> 1, 0.45, chip, false);
    chip.div.style.color = '#2a2';
    chip.div.style.borderColor = '#2a2';
  }

  upgradeFlex.div.appendChild(scrollFlex.div);
  upgradeFlex.update();

  upgradeScrollFlex.div.scrollTop = scrollPos;
}
