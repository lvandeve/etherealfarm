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

function makePlantChip2(crop, x, y, w, parent, opt_plantfun, opt_showfun, opt_tooltipfun, opt_replace) {
  var flex = new Flex(parent, x * w + 0.01, [0, y * w + 0.01, 0.5], [(x + 1) * w - 0.01], [0, (y + 1) * w - 0.01, 0.5], 0.8);
  var div = flex.div;
  div.className = 'efEtherealPlantChip';

  var canvasFlex = new Flex(flex, 0, [0.5, -0.35], [0, 0.7], [0.5, 0.35]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(crop.image[4], canvas);

  var infoFlex = new Flex(flex, [0, 0.7], 0, 1, [0, 1]);
  var text = '';
  text += '<b>' + crop.name + '</b><br>';
  var cost = crop.getCost();
  text += 'type: ' + getCropTypeName(crop.type);

  var buyFlex = undefined;

  if(opt_showfun) {
    styleButton0(canvasFlex.div, true);
    addButtonAction(canvasFlex.div, opt_showfun, upper(crop.name) + ' info');
  }
  if(opt_plantfun) {
    buyFlex = new Flex(flex, [0, 0.7], [0, 0.4], [1, -0.02], [0, 0.98]);
    //styleButton0(buyFlex.div);
    //buyFlex.div.className = 'efButton';
    styleButton(buyFlex.div);
    buyFlex.div.textEl.innerHTML = '<b>plant: </b>' + cost.toString();
    addButtonAction(buyFlex.div, opt_plantfun, (opt_replace ? 'Replace with ' : 'Plant ') + crop.name);
  } else {
    if(state.res.lt(crop.getCost())) {
      text += '<br><font color="#666">cost: ' + cost.toString() + '</font>';
    } else {
      text += '<br>cost: ' + cost.toString();
    }
  }

  if(opt_tooltipfun) {
    if(opt_showfun) {
      registerTooltip(canvasFlex.div, function() {
        return 'Show ethereal ' + crop.name + ' info<br><br>' + opt_tooltipfun();
      }, true);
    }
    if(opt_plantfun) {
      registerTooltip(buyFlex.div, function() {
        return (opt_replace ? 'Replace with ethereal ' : 'Plant ethereal ') + crop.name + '<br><br>' + opt_tooltipfun();
      }, true);
    }
    registerTooltip(infoFlex.div, function() {
      return 'Ethereal ' + crop.name + '<br><br>' + opt_tooltipfun();
    }, true);
  } else {
    if(opt_showfun) registerTooltip(canvasFlex.div, 'Show ' + crop.name + ' info');
    if(opt_plantfun) registerTooltip(canvasFlex.div, (opt_replace ? 'Replace with ethereal ' : 'Plant ethereal ') + crop.name);
  }

  if(opt_plantfun && state.res.lt(crop.getCost())) {
    buyFlex.div.className = 'efButtonCantAfford';
  }

  infoFlex.div.innerHTML = text;

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
  dialog.div.className = 'efDialogEthereal';
  var tx = 0;
  var ty = 0;
  var contentFlex = dialog.content;

  var flex = new Flex(contentFlex, 0, 0, 1, 0.05, 0.5);
  centerText2(flex.div);

  if(show_only) {
    flex.div.textEl.innerText = 'Unlocked ethereal crops...';
  } else {
    flex.div.textEl.innerHTML = 'Choose an ethereal crop to plant.<br>They cost resin, so choose wisely.<br>Ethereal crops give various bonuses to the basic field';
  }

  flex = new Flex(contentFlex, 0, 0.1, 1, 0.85);

  for(var i = 0; i < registered_crops2.length; i++) {
    if(!state.crops2[registered_crops2[i]].unlocked) continue;
    var index = registered_crops2[i];
    var c = crops2[index];

    var tooltipfun = bind(function(index) {
      var result = '';
      var c = crops2[index];

      result += 'Cost: ' + c.getCost().toString();
      result += '<br><br> Plant time: ' + util.formatDuration(c.planttime);
      //result += '<br> Production/sec: ' + c.getProd(undefined).toString();

      if(c.effect_description_long) {
        result += '<br><br>Effect: ' + c.effect_description_long;
      } else if(c.effect_description_short) {
        result += '<br><br>Effect: ' + c.effect_description_short;
      }

      result += '<br><br>Ethereal tree level that unlocked this crop: ' + c.treelevel2;

      return result;
    }, index);


    var plantfun = show_only ? undefined : bind(function(index) {
        var c = crops2[index];
        actions.push({type:ACTION_PLANT2, x:x, y:y, crop:c});
        state.lastPlanted2 = index; // for shift key
        dialog.cancelFun();
        update(); // do update immediately rather than wait for tick, for faster feeling response time
    }, index);

    var showfun = bind(function(tooltipfun) {
        var text = tooltipfun();
        var dialog = createDialog(text.length < 350 ? DIALOG_SMALL : DIALOG_MEDIUM);
        dialog.content.div.innerHTML = text;
    }, tooltipfun);


    var chip = makePlantChip2(c, tx, ty, 0.33, flex, plantfun, showfun, tooltipfun);
    tx++;
    if(tx >= 3) {
      tx = 0;
      ty++;
    }
  }
}
