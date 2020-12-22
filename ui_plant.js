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

// ui for planting a new plant

// make a button for planting a crop with picture, price and info. w should be larger than h for good effect.
function makePlantChip(crop, x, y, w, parent, fieldx, fieldy) {
  var f = undefined;
  if(fieldx != undefined && fieldy != undefined) {
    f = state.field[fieldy][fieldx];
  }
  var flex = new Flex(parent, x * w + 0.01, [0, y * w + 0.01, 0.5], [(x + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.5], 0.75);
  var div = flex.div;
  div.style.border = '1px solid black';

  var canvasFlex = new Flex(flex, 0, [0.5, -0.35], [0, 0.7], [0.5, 0.35]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(crop.image[4], canvas);

  var infoFlex = new Flex(flex, [0, 0.7], 0, 1, [0, 1]);
  var text = '';
  text +=  '<b>' + crop.name + '</b><br>';
  text += '<b>cost:</b>' + crop.getCost().toString() + '<br>';
  var prod = crop.getProd(f);
  if(!prod.empty()) text += '<b>prod:</b>' + prod.toString();
  var boost = crop.getBoost();
  if(boost.neqr(0))  text += '<b>boost:</b>' + boost.mulr(100).toString() + '%';
  infoFlex.div.innerHTML = text;

  return flex;
}


function makePlantDialog(x, y, show_only) {

  var numplants = 0;
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) numplants++;
  }

  var num_unlocked = 0;
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) num_unlocked++;
  }

  var dialog = createDialog((num_unlocked > 12) ? false : true);
  dialog.div.style.backgroundColor = '#efec'; // slightly translucent to see resources through it
  var tx = 0;
  var ty = 0;

  var flex = new Flex(dialog, 0, 0, 1, 0.05, 0.4);
  centerText2(flex.div);
  if(show_only) {
    flex.div.textEl.innerText = 'Unlocked crops...';
  } else {
    flex.div.textEl.innerText = 'Choose a crop to plant';
  }

  flex = new Flex(dialog, 0, 0.05, 1, 0.85);

  for(var i = 0; i < registered_crops.length; i++) {
    if(!state.crops[registered_crops[i]].unlocked) continue;
    var index = registered_crops[i];
    var c = crops[index];
    var chip = makePlantChip(c, tx, ty, 0.33, flex, x, y);
    tx++;
    if(tx >= 3) {
      tx = 0;
      ty++;
    }

    var tooltipfun = bind(function(index) {
      var result = '';
      var c = crops[index];
      if(show_only) {
        result = util.upperCaseFirstWord(c.name);
      } else {
        result = 'Plant ' + c.name;
      }
      result += '.<br><br>Base cost: ' + c.cost.toString();
      result += '.<br><br>Num planted of this type: ' + state.cropcount[c.index];
      result += '.<br><br>Current cost: ' + c.getCost().toString();
      result += '.<br><br>Plant time: ' + util.formatDuration(c.planttime);
      result += '.<br><br>Base production/sec: ' + c.prod.toString();
      result += '.<br><br>Production/sec here: ' + c.getProd(state.field[y][x]).toString();
      result += '.<br><br>Production/sec w/o neighbors: ' + c.getProd(undefined).toString();
      if(c.type == CROPTYPE_NETTLE) result += '.<br><br>Boost neighboring mushrooms spores production, but negatively affects neighboring berries, so avoid touching berries with this plant';
      if(c.type == CROPTYPE_FLOWER) result += '.<br><br>Boost neighboring crops, their production, but if they have consumption, also increases their consumption equally';
      result += '.';
      return result;
    }, index);

    registerTooltip(chip.div, tooltipfun);

    if(show_only) {
      chip.div.onclick = bind(function(tooltipfun) {
        var text = tooltipfun();
        var dialog = createDialog(text.length < 350);
        var flex = new Flex(dialog, 0.01, 0.01, 0.99, 0.8, 0.4);
        flex.div.innerHTML = text;
      }, tooltipfun);
    } else {
      chip.div.onclick = bind(function(index) {
        var c = crops[index];
        actions.push({type:ACTION_PLANT, x:x, y:y, crop:c});
        lastPlanted = index; // for shift key
        dialog.cancelFun();
        update(); // do update immediately rather than wait for tick, for faster feeling response time
      }, index);
      styleButton0(chip.div);
    }
  }
}

