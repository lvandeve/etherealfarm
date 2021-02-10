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
  var flex = new Flex(parent, x * w + 0.01, [0, y * w * 0.9 + 0.01, 0.5], [(x + 1) * w - 0.01], [0, (y + 1) * w * 0.9 - 0.01, 0.5], 0.75);
  var div = flex.div;
  div.className = 'efPlantChip';

  var canvasFlex = new Flex(flex, 0, [0.5, -0.35], [0, 0.7], [0.5, 0.35]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(crop.image[4], canvas);

  var infoFlex = new Flex(flex, [0, 0.7], 0, 1, [0, 1]);
  var text = '';
  text +=  '<b>' + crop.name + '</b><br>';
  var cost = crop.getCost();
  text += '<b>cost:</b>' + cost.toString() + '<br>';

  if(crop.type == CROPTYPE_SHORT && state.upgrades[berryunlock_0].count) {
    text += '<span class="efWatercressHighlight">Copies neighbors</span><br>';
  }
  //if(crop.type == CROPTYPE_SHORT) text += '<b>short-lived</b><br>';
  var prod = crop.getProd(f, true);
  if(!prod.empty()) text += '<b>prod:</b>' + prod.toString();
  var boost = crop.getBoost(f);
  if(boost.neqr(0)) text += '<b>boost:</b>' + boost.toPercentString();
  infoFlex.div.innerHTML = text;

  if(state.res.lt(crop.getCost())) {
    infoFlex.div.style.color = '#666';
    registerUpdateListener(function() {
      if(!flex || !document.body.contains(infoFlex.div)) return false;
      if(state.res.gte(crop.getCost())) {
        infoFlex.div.style.color = '';
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


function makePlantDialog(x, y, show_only) {

  var numplants = 0;
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) numplants++;
  }

  var num_unlocked = 0;
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) num_unlocked++;
  }

  var dialogsize = DIALOG_SMALL;
  if(num_unlocked >= 12) dialogsize = DIALOG_MEDIUM;
  if(num_unlocked >= 15) dialogsize = DIALOG_LARGE;

  var dialog = createDialog(dialogsize);
  dialog.div.className = 'efDialogTranslucent';
  var tx = 0;
  var ty = 0;

  var flex = new Flex(dialog, 0.01, 0.01, 0.99, 0.05, 0.7);
  if(show_only) {
    centerText2(flex.div);
    flex.div.textEl.innerHTML = 'Unlocked crops...';
  } else {
    flex.div.innerHTML = 'Choose a crop to plant<br>Tip: use SHIFT key on the field to plant last plant type, or CTRL for watercress.';
  }

  flex = new Flex(dialog, 0, 0.1, 1, 0.85);
  makeScrollable(flex);

  var crops_order = getCropOrder();

  for(var i = 0; i < crops_order.length; i++) {
    var index = crops_order[i];
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
        result = upper(c.name);
      } else {
        result = 'Plant ' + c.name;
      }

      result += '.<br><br>Crop type: ' + getCropTypeName(c.type);
      var help = getCropTypeHelp(c.type);
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

    registerTooltip(chip.div, tooltipfun, true);

    if(show_only) {
      addButtonAction(chip.div, bind(function(tooltipfun) {
        var text = tooltipfun();
        var dialog = createDialog(text.length < 350 ? DIALOG_SMALL : DIALOG_MEDIUM);
        var flex = new Flex(dialog, 0.01, 0.01, 0.99, 0.8, 0.4);
        flex.div.innerHTML = text;
      }, tooltipfun));
    } else {
      addButtonAction(chip.div, bind(function(index) {
        var c = crops[index];
        actions.push({type:ACTION_PLANT, x:x, y:y, crop:c});
        state.lastPlanted = index; // for shift key
        dialog.cancelFun();
        update(); // do update immediately rather than wait for tick, for faster feeling response time
      }, index));
      styleButton0(chip.div);
    }
  }

  flex.update(); // something about the makeScrollable above misplaces some of the flex-managed sub positions, this update fixes it
}

