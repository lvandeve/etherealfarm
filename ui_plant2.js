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

// ui for planting a new ethereal plant

function makePlantChip2(crop, x, y, w, parent, opt_plantfun, opt_showfun, opt_tooltipfun, opt_replace, opt_recoup, opt_field) {
  var flex = new Flex(parent, x * w + 0.01, [0, 0, y * w + 0.010, 0.5], (x + 1) * w - 0.01, [0, 0, (y + 1) * w - 0.01, 0.5]);
  var div = flex.div;
  div.className = 'efEtherealPlantChip';

  var canvasFlex = new Flex(flex, 0, [0.5, 0, -0.35], [0, 0, 0.7], [0.5, 0, 0.35]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(crop.image[4], canvas);

  var infoFlex = new Flex(flex, [0, 0, 0.7], 0, 1, [0, 0, 1]);
  var text = '';
  if(opt_replace) {
    text +=  '<b>' + upper(crop.name) + '</b><br>';
  } else {
    text +=  '<b>Plant ' + crop.name + '</b><br>';
  }
  var cost = crop.getCost();
  if(opt_recoup) cost = cost.sub(opt_recoup);
  if(opt_replace && opt_field && opt_field.cropIndex() == crop.index) cost = Res(); // recoup - crop.getCost() gives wrong value since when planting same, crop amount used in cost computation is one less
  text += 'type: ' + getCropTypeName(crop.type) + '<br>';
  text += 'cost: ' + cost.toString();

  var buyFlex = undefined;

  if(opt_showfun) {
    styleButton0(canvasFlex.div, true);
    addButtonAction(canvasFlex.div, opt_showfun, upper(crop.name) + ' info');
  }
  if(opt_plantfun) {
    buyFlex = new Flex(flex, [0, 0, 0.7], [0, 0, 0.0], [1, 0, -0.02], [0, 0, 0.98]);
    addButtonAction(buyFlex.div, opt_plantfun, (opt_replace ? 'Replace with ' : 'Plant ') + crop.name);
    styleButton0(buyFlex.div);
  }

  if(opt_tooltipfun) {
    if(opt_showfun) {
      registerTooltip(canvasFlex.div, function() {
        return 'Show ethereal ' + crop.name + ' info';
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

  if(opt_plantfun && state.res.lt(cost)) {
    flex.div.className = 'efButtonCantAfford';
  }

  infoFlex.div.innerHTML = text;

  return flex;
}

function crop2sortfun(a, b) {
  var ac = crops2[a].cost.resin;
  var bc = crops2[b].cost.resin;
  if(ac.eqr(0) || bc.eqr(0)) {
    // for crops that don't use resin as cost
    ac = Num(crops2[a].tier);
    bc = Num(crops2[b].tier);
  }
  return ac.lt(bc) ? 1 : -1;
}

// get the array of unlocked crops in the plant dialog, in order they should be displayed:
function getCrop2Order() {
  var unlocked = [];
  for(var i = 0; i < registered_crops2.length; i++) {
    if(state.crops2[registered_crops2[i]].unlocked) unlocked.push(registered_crops2[i]);
  }
  var result = [];
  var added = {};

  var types = [CROPTYPE_LOTUS, CROPTYPE_BERRY, CROPTYPE_MUSH, CROPTYPE_FLOWER, CROPTYPE_BEE, CROPTYPE_STINGING, CROPTYPE_FERN, CROPTYPE_MISTLETOE, CROPTYPE_AUTOMATON, CROPTYPE_SQUIRREL, CROPTYPE_BRASSICA];

  for(var j = 0; j < types.length; j++) {
    var highest = undefined;
    for(var i = 0; i < unlocked.length; i++) {
      if(added[unlocked[i]]) continue;
      var c = crops2[unlocked[i]];
      if(c.type == types[j] && (!highest || c.cost.gt(highest.cost))) highest = c;
    }
    if(highest) {
      result.push(highest.index);
      added[highest.index] = true;
    }
  }
  result.sort(crop2sortfun);

  // everything else
  var array = [];
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    array.push(unlocked[i]);
  }
  array.sort(crop2sortfun);
  for(var i = 0; i < array.length; i++) {
    result.push(array[i]);
    added[array[i]] = true;
  }

  return result;
}

// Ethereal version
// TODO: share code with makePlantDialog
function makePlantDialog2(x, y, opt_replace, opt_recoup) {
  var numplants = 0;
  for(var i = 0; i < registered_crops2.length; i++) {
    if(state.crops2[registered_crops2[i]].unlocked) numplants++;
  }

  var dialog = createDialog({
    title:(opt_replace ? 'Replace ethereal crop' : 'Plant ethereal crop'),
    bgstyle:'efDialogEthereal'
  });
  var tx = 0;
  var ty = 0;
  var contentFlex = dialog.content;

  var flex = new Flex(contentFlex, 0, 0, 1, 0.05);
  centerText2(flex.div);

  if(opt_replace) {
    centerText2(flex.div);
    flex.div.textEl.innerHTML = 'Replace crop with...';
  } else {
    flex.div.textEl.innerHTML = 'Choose an ethereal crop to plant. Click the icon for more info, or the text to plant it now.<br>They cost resin, so choose wisely.<br>Ethereal crops give various bonuses to the basic field.';
  }

  flex = new Flex(contentFlex, 0, 0.1, 1, 1);
  makeScrollable(flex);

  var crops_order = getCrop2Order();

  for(var i = 0; i < crops_order.length; i++) {
    var index = crops_order[i];
    var c = crops2[index];

    var tooltipfun = bind(function(index) {
      var result = '';
      var c = crops2[index];

      result += 'Cost: ' + c.getCost().toString();
      result += '<br><br>Grow time: ' + util.formatDuration(c.planttime);

      if(c.effect_description_long) {
        var effect = c.effect_description_long;
        if(typeof effect == 'function') effect = c.effect_description_long();
        result += '<br><br>Effect: ' + effect;
      } else if(c.effect_description_short) {
        var effect = c.effect_description_short;
        if(typeof effect == 'function') effect = c.effect_description_short();
        result += '<br><br>Effect: ' + effect;
      }

      result += '<br><br>Ethereal tree level that unlocked this crop: ' + c.treelevel2;

      var f = state.field2[y][x];

      // effect to base field
      if(c.effect.neqr(0)) {
        var base = c.effect; // the base boost to the basic field, if it would have no neighbors (lotuses, ...) here
        var actual = c.getBasicBoost(f); // the boost to basic, when planted at this specific spot (depending on lotuses and other neighbors)
        if(base.eq(actual)) {
          result += '.<br><br>Boost: ' + base.toPercentString();
        } else {
          result += '.<br><br>Boost (base): ' + base.toPercentString();
          result += '.<br>Boost (here): ' + actual.toPercentString();
        }
      }
      // effect of lotus here
      if(c.boost.neqr(0)) {
        result += '.<br><br>Boost here: ' + c.getEtherealBoost(f).toPercentString();
      }

      return result;
    }, index);


    var plantfun = bind(function(index) {
        var c = crops2[index];

        if(opt_replace) addAction({type:ACTION_REPLACE2, x:x, y:y, crop:c});
        else addAction({type:ACTION_PLANT2, x:x, y:y, crop:c});
        state.lastPlanted2 = index; // for shift key
        closeAllDialogs();
        update(); // do update immediately rather than wait for tick, for faster feeling response time
        return true;
    }, index);

    var showfun = bind(function(tooltipfun, plantfun, c) {
        var text = 'Ethereal ' + upper(c.name) + '<br><br>' + tooltipfun();
        var dialog = createDialog({
          size:(text.length < 350 ? DIALOG_SMALL : DIALOG_MEDIUM),
          title:'Ethereal crop info',
          names:'plant',
          functions:plantfun,
          icon:c.image[4]
        });
        dialog.content.div.innerHTML = text;
    }, tooltipfun, plantfun, c);


    var chip = makePlantChip2(c, tx, ty, 0.33, flex, plantfun, showfun, tooltipfun, opt_replace, opt_recoup, state.field2[y][x]);
    tx++;
    if(tx >= 3) {
      tx = 0;
      ty++;
    }
  }

  flex.update(); // something about the makeScrollable above misplaces some of the flex-managed sub positions, this update fixes it
}
