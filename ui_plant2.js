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

// ui for planting a new ethereal plant

function makePlantChip2(crop, x, y, w, parent) {
  var flex = new Flex(parent, x * w + 0.01, [0, y * w + 0.01, 0.5], [(x + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.5], 0.75);
  var div = flex.div;
  div.style.border = '1px solid black';
  div.style.backgroundColor = '#9df';

  var canvasFlex = new Flex(flex, 0, [0.5, -0.35], [0, 0.7], [0.5, 0.35]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(crop.image[4], canvas);

  var infoFlex = new Flex(flex, [0, 0.7], 0, 1, [0, 1]);
  infoFlex.div.innerHTML = '<b>' + crop.name + '</b><br><b>cost:</b>' + crop.getCost().toString() + '<br><b>prod:</b>' + crop.getProd(undefined).toString();

  return flex;
}

// Ethereal version
// TODO: share code with makePlantDialog
function makePlantDialog2(x, y) {
  var numplants = 0;
  for(var i = 0; i < registered_crops2.length; i++) {
    if(state.crops2[registered_crops2[i]].unlocked) numplants++;
  }

  var dialog = createDialog();
  var tx = 0;
  var ty = 0;

  var flex = new Flex(dialog, 0, 0, 1, 0.05, 0.4);
  dialog.div.style.backgroundColor = '#eefc'; // slightly translucent to see resources through it
  centerText2(flex.div);
  flex.div.textEl.innerText = 'Choose an ethereal crop to plant';

  flex = new Flex(dialog, 0, 0.05, 1, 0.85);

  for(var i = 0; i < registered_crops2.length; i++) {
    if(!state.crops2[registered_crops2[i]].unlocked) continue;
    var index = registered_crops2[i];
    var c = crops2[index];
    var chip = makePlantChip2(c, tx, ty, 0.33, flex);
    tx++;
    if(tx >= 3) {
      tx = 0;
      ty++;
    }

    registerTooltip(chip.div, bind(function(index) {
      var result = '';
      var c = crops2[index];
      result = 'Plant ' + c.name;
      result += '.<br> Cost: ' + c.getCost().toString();
      result += '.<br> Plant time: ' + util.formatDuration(c.planttime);
      result += '.<br> Production/sec: ' + c.getProd(undefined).toString();
      result += '.';
      return result;
    }, index));
    chip.div.onclick = bind(function(index) {
      var c = crops2[index];
      actions.push({type:ACTION_PLANT2, x:x, y:y, crop:c});
      lastPlanted = index; // for shift key
      dialog.cancelFun();
      update(); // do update immediately rather than wait for tick, for faster feeling response time
    }, index);
    styleButton0(chip.div);
  }
}
