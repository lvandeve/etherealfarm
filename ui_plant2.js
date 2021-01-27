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
  var flex = new Flex(parent, x * w + 0.01, [0, y * w + 0.01, 0.5], [(x + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.5], 0.8);
  var div = flex.div;
  div.className = 'efEtherealPlantChip';

  var canvasFlex = new Flex(flex, 0, [0.5, -0.35], [0, 0.7], [0.5, 0.35]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(crop.image[4], canvas);

  var infoFlex = new Flex(flex, [0, 0.7], 0, 1, [0, 1]);
  var text = '';
  text += '<b>' + crop.name + '</b><br>';
  text += '<b>cost:</b>' + crop.getCost().toString() + '<br>';
  if(crop.effect_description_short) {
    text += '<b>effect:</b>' + crop.effect_description_short + '<br>';
  }
  var boost = crop.getBoost();
  if(boost.neqr(0)) text += '<b>boost here:</b>' + boost.mulr(100).toString() + '%';
  infoFlex.div.innerHTML = text;

  if(state.res.lt(crop.getCost())) {
    infoFlex.div.style.color = '#666';
  }

  return flex;
}

// Ethereal version
// TODO: share code with makePlantDialog
function makePlantDialog2(x, y, show_only) {
  var numplants = 0;
  for(var i = 0; i < registered_crops2.length; i++) {
    if(state.crops2[registered_crops2[i]].unlocked) numplants++;
  }

  var dialog = createDialog();
  var tx = 0;
  var ty = 0;

  var flex = new Flex(dialog, 0, 0, 1, 0.05, 0.5);
  dialog.div.className = 'efDialogEthereal';
  centerText2(flex.div);

  if(show_only) {
    flex.div.textEl.innerText = 'Unlocked ethereal crops...';
  } else {
    flex.div.textEl.innerHTML = 'Choose an ethereal crop to plant.<br>They cost resin, so choose wisely.<br>Ethereal crops give various bonuses to the basic field';
  }

  flex = new Flex(dialog, 0, 0.1, 1, 0.85);

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
      if(show_only) {
        result = upper(c.name);
      } else {
        result = 'Plant ethereal ' + c.name;
      }
      result += '<br><br> Cost: ' + c.getCost().toString();
      result += '<br><br> Plant time: ' + util.formatDuration(c.planttime);
      //result += '<br> Production/sec: ' + c.getProd(undefined).toString();

      if(c.effect_description_long) {
        result += '<br><br>Effect: ' + c.effect_description_long;
      } else if(c.effect_description_short) {
        result += '<br><br>Effect: ' + c.effect_description_short;
      }

      return result;
    }, index));

    if(!show_only) {
      chip.div.onclick = bind(function(index) {
        var c = crops2[index];
        actions.push({type:ACTION_PLANT2, x:x, y:y, crop:c});
        state.lastPlanted2 = index; // for shift key
        dialog.cancelFun();
        update(); // do update immediately rather than wait for tick, for faster feeling response time
      }, index);
      styleButton0(chip.div);
    }
  }
}
