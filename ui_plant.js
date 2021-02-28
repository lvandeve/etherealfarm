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
function makePlantChip(crop, x, y, w, parent, fieldx, fieldy, opt_plantfun, opt_showfun, opt_tooltipfun, opt_replace) {
  var f = undefined;
  if(fieldx != undefined && fieldy != undefined) {
    f = state.field[fieldy][fieldx];
  }
  var flex = new Flex(parent, x * w + 0.01, [0, y * w * 0.9 + 0.01, 0.5], [(x + 1) * w - 0.01], [0, (y + 1) * w * 0.9 - 0.01, 0.5], 0.75);
  var div = flex.div;
  div.className = 'efPlantChip';

  var canvasFlex = new Flex(flex, 0, [0.5, -0.33], [0, 0.66], [0.5, 0.33]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(crop.image[4], canvas);
  //canvasFlex.div.style.border = '1px solid white';

  var infoFlex = new Flex(flex, [0, 0.7], 0, 1, [0, 0.5]);
  var text = '';
  //text +=  '<b>' + (opt_plantfun ? 'plant ' : '') + crop.name + '</b><br>';
  text +=  '<b>' + crop.name + '</b><br>';
  var cost = crop.getCost();
  if(!opt_plantfun) text += '<b>cost:</b>' + cost.toString() + '<br>';

  text += 'type: ' + getCropTypeName(crop.type);

  infoFlex.div.innerHTML = text;

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
  }

  if(opt_tooltipfun) {
    if(opt_showfun) {
      registerTooltip(canvasFlex.div, function() {
        return 'Show ' + crop.name + ' info<br><br>' + opt_tooltipfun();
      }, true);
    }
    if(opt_plantfun) {
      registerTooltip(buyFlex.div, function() {
        return (opt_replace ? 'Replace with ' : 'Plant ') + crop.name + '<br><br>' + opt_tooltipfun();
      }, true);
    }
    registerTooltip(infoFlex.div, function() {
      return upper(crop.name) + '<br><br>' + opt_tooltipfun();
    }, true);
  } else {
    if(opt_showfun) registerTooltip(canvasFlex.div, 'Show ' + crop.name + ' info');
    if(opt_plantfun) registerTooltip(canvasFlex.div, (opt_replace ? 'Replace with ' : 'Plant ') + crop.name);
  }

  if(opt_plantfun && state.res.lt(crop.getCost())) {
    buyFlex.div.className = 'efButtonCantAfford';
    registerUpdateListener(function() {
      if(!flex || !document.body.contains(buyFlex.div)) return false;
      if(state.res.gte(crop.getCost())) {
        buyFlex.div.className = 'efButton';
        return false;
      }
      return true;
    });
  }

  return flex;
}


// get the array of unlocked crops in the plant dialog, in order they should be displayed:
// most expensive ones first, with nettle, watercress, mistletoe in a good location not at the bottom either
function getCropOrder() {
  var unlocked = [];
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) unlocked.push(registered_crops[i]);
  }

  var result = [];

  var added = {};

  // challenge specific crops
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    var c = crops[unlocked[i]];
    if(c.type == CROPTYPE_CHALLENGE) {
      result.push(c.index);
      added[c.index] = true;
    }
  }

  var highest;

  // most expensive berry
  highest = undefined;
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    var c = crops[unlocked[i]];
    if(c.type == CROPTYPE_BERRY && (!highest || c.cost.gt(highest.cost))) highest = c;
  }
  if(highest) {
    result.push(highest.index);
    added[highest.index] = true;
  }

  // most expensive mushroom
  highest = undefined;
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    var c = crops[unlocked[i]];
    if(c.type == CROPTYPE_MUSH && (!highest || c.cost.gt(highest.cost))) highest = c;
  }
  if(highest) {
    result.push(highest.index);
    added[highest.index] = true;
  }

  // most expensive flower
  highest = undefined;
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    var c = crops[unlocked[i]];
    if(c.type == CROPTYPE_FLOWER && (!highest || c.cost.gt(highest.cost))) highest = c;
  }
  if(highest) {
    result.push(highest.index);
    added[highest.index] = true;
  }

  // most expensive beehive
  highest = undefined;
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    var c = crops[unlocked[i]];
    if(c.type == CROPTYPE_BEE && (!highest || c.cost.gt(highest.cost))) highest = c;
  }
  if(highest) {
    result.push(highest.index);
    added[highest.index] = true;
  }

  // most expensive nettle
  highest = undefined;
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    var c = crops[unlocked[i]];
    if(c.type == CROPTYPE_NETTLE && (!highest || c.cost.gt(highest.cost))) highest = c;
  }
  if(highest) {
    result.push(highest.index);
    added[highest.index] = true;
  }

  // most expensive watercress
  highest = undefined;
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    var c = crops[unlocked[i]];
    if(c.type == CROPTYPE_SHORT && (!highest || c.cost.gt(highest.cost))) highest = c;
  }
  if(highest) {
    result.push(highest.index);
    added[highest.index] = true;
  }

  // most expensive mistletoe
  highest = undefined;
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    var c = crops[unlocked[i]];
    if(c.type == CROPTYPE_MISTLETOE && (!highest || c.cost.gt(highest.cost))) highest = c;
  }
  if(highest) {
    result.push(highest.index);
    added[highest.index] = true;
  }

  // everything else
  var array = [];
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    array.push(unlocked[i]);
  }
  array.sort(function(a, b) {
    return crops[a].cost.seeds.lt(crops[b].cost.seeds) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    result.push(array[i]);
    added[array[i]] = true;
  }

  return result;
}


function makePlantDialog(x, y, opt_replace) {

  var numplants = 0;
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) numplants++;
  }

  var num_unlocked = 0;
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) num_unlocked++;
  }

  var dialogsize = DIALOG_SMALL;
  if(num_unlocked > 9) dialogsize = DIALOG_MEDIUM;
  if(num_unlocked > 12) dialogsize = DIALOG_LARGE;

  var dialog = createDialog(dialogsize);
  dialog.div.className = 'efDialogTranslucent';
  var tx = 0;
  var ty = 0;

  var flex = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.05, 0.7);
  if(opt_replace) {
    centerText2(flex.div);
    flex.div.textEl.innerHTML = 'Replace crop with...';
  } else {
    flex.div.innerHTML = 'Choose a crop to plant, or click its icon for info.<br>Tip: use SHIFT key on the field to plant last plant type, or CTRL for watercress.';
  }

  flex = new Flex(dialog.content, 0, 0.12, 1, 1);
  makeScrollable(flex);

  var crops_order = getCropOrder();

  for(var i = 0; i < crops_order.length; i++) {


    var index = crops_order[i];
    var c = crops[index];

    var tooltipfun = bind(function(index) {
      var result = '';
      var c = crops[index];

      result += 'Crop type: ' + getCropTypeName(c.type);
      var help = getCropTypeHelp(c.type, state.challenge == challenge_bees);
      if(help) {
        result += '.<br>' + help;
      }
      if(c.tagline) result += '<br/>' + upper(c.tagline);


      if(c.type == CROPTYPE_SHORT) result += '.<br><br>' + leechInfo;
      var cost = c.getCost();
      result += '<br><br>Planting cost: ' + cost.toString() + ' (' + getCostAffordTimer(cost) + ')';


      if(c.type == CROPTYPE_SHORT) {
        result += '.<br><br>Living time: ' + util.formatDuration(c.getPlantTime());
      } else {
        result += '.<br><br>Growth time: ' + util.formatDuration(c.getPlantTime());
        if(c.getPlantTime() != c.planttime) result += ' (base: ' + util.formatDuration(c.planttime) + ')';
      }
      if(c.type == CROPTYPE_FLOWER) {
        result += '.<br><br>Neighbor boost: ' + c.getBoost(state.field[y][x]).toPercentString();
      } else if(c.type == CROPTYPE_BEE) {
        result += '.<br><br>Flower boost: ' + c.getBoostBoost(state.field[y][x]).toPercentString();
      } else {
        result += '.<br><br>Production/sec: ' + c.getProd(state.field[y][x], true).toString();
      }
      result += '.';
      return result;
    }, index);


    var plantfun = bind(function(index) {
      state.lastPlanted = index; // for shift key
      if(opt_replace && state.field[y][x].index == CROPINDEX + index) {
        showMessage('Already have this crop here', C_INVALID, 0, 0);
        dialog.cancelFun();
        return;
      }
      var c = crops[index];
      if(opt_replace) actions.push({type:ACTION_DELETE, x:x, y:y, crop:c});
      actions.push({type:ACTION_PLANT, x:x, y:y, crop:c});
      dialog.cancelFun();
      closeAllDialogs();
      update(); // do update immediately rather than wait for tick, for faster feeling response time
    }, index);

    var showfun = bind(function(tooltipfun) {
      var text = tooltipfun();
      var dialog = createDialog(text.length < 350 ? DIALOG_SMALL : DIALOG_MEDIUM);
      dialog.content.div.innerHTML = text;
    }, tooltipfun);



    var chip = makePlantChip(c, tx, ty, 0.33, flex, x, y, plantfun, showfun, tooltipfun, opt_replace);
    tx++;
    if(tx >= 3) {
      tx = 0;
      ty++;
    }
  }

  flex.update(); // something about the makeScrollable above misplaces some of the flex-managed sub positions, this update fixes it
}

