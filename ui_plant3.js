/*
Ethereal Farm
Copyright (C) 2020-2023  Lode Vandevenne

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

// ui for planting a new infinity plant

function makePlantChip3(crop, x, y, w, parent, opt_plantfun, opt_showfun, opt_tooltipfun, opt_replace, opt_recoup, opt_field) {
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
  if(opt_replace && opt_field && opt_field.cropIndex() == crop.index && crop.type != CROPTYPE_BRASSICA) {
    cost = Res(); // recoup - crop.getCost() gives wrong value since when planting same, crop amount used in cost computation is one less. Exception: brassica, where it's the opposite situation, crop amount doesn't affect cost, but has variable lifespan based recoup cost
  }
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
        return 'Show infinity ' + crop.name + ' info';
      }, true);
    }
    if(opt_plantfun) {
      registerTooltip(buyFlex.div, function() {
        return (opt_replace ? 'Replace with infinity ' : 'Plant infinity ') + crop.name + '<br><br>' + opt_tooltipfun();
      }, true);
    }
    registerTooltip(infoFlex.div, function() {
      return 'Infinity ' + crop.name + '<br><br>' + opt_tooltipfun();
    }, true);
  } else {
    if(opt_showfun) registerTooltip(canvasFlex.div, 'Show ' + crop.name + ' info');
    if(opt_plantfun) registerTooltip(canvasFlex.div, (opt_replace ? 'Replace with infinity ' : 'Plant infinity ') + crop.name);
  }

  infoFlex.div.innerHTML = text;

  if(opt_plantfun && state.res.lt(cost)) {
    flex.div.className = 'efButtonTranslucentCantAfford';
    registerUpdateListener(function() {
      if(!flex || !document.body.contains(infoFlex.div)) return false;
      var cost = crop.getCost();
      if(opt_recoup) cost = cost.sub(opt_recoup);
      if(state.res.gte(cost)) {
        flex.div.className = 'efEtherealPlantChip';
        return false;
      }
      return true;
    });
  }

  return flex;
}

function crop3SortFun(a, b) {
  var ac = crops3[a].cost.infseeds;
  var bc = crops3[b].cost.infseeds;
  if(ac.eqr(0) || bc.eqr(0)) {
    // for crops that don't use infseeds as cost
    ac = Num(crops3[a].tier);
    bc = Num(crops3[b].tier);
  }
  return ac.lt(bc) ? 1 : -1;
}

// get the array of unlocked crops in the plant dialog, in order they should be displayed:
// most expensive ones first, but some of each type represented at the top (the latter is not yet implemented due to not yet needed for any supported crop types)
function getCrop3Order() {
  var unlocked = [];
  for(var i = 0; i < registered_crops3.length; i++) {
    if(state.crops3[registered_crops3[i]].unlocked) unlocked.push(registered_crops3[i]);
  }

  var result = [];

  var added = {};

  var array;

  // most expensive one of each unlocked type; this makes it so the runestone won't disappear to the bottom as more crops get unlocked
  array = [];
  for(var type = 0; type < NUM_CROPTYPES; type++) {
    var highest = undefined;
    for(var i = 0; i < unlocked.length; i++) {
      if(added[unlocked[i]]) continue;
      var c = crops3[unlocked[i]];
      if(c.type == type && (!highest || c.cost.gt(highest.cost))) highest = c;
    }
    if(highest) {
      array.push(highest.index);
    }
  }
  array.sort(crop3SortFun);
  for(var i = 0; i < array.length; i++) {
    result.push(array[i]);
    added[array[i]] = true;
  }


  // everything else
  array = [];
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    array.push(unlocked[i]);
  }
  array.sort(crop3SortFun);
  for(var i = 0; i < array.length; i++) {
    result.push(array[i]);
    added[array[i]] = true;
  }

  return result;
}

// infinity version
// TODO: share code with makePlantDialog
function makePlantDialog3(x, y, opt_replace, opt_recoup) {
  var numplants = 0;
  for(var i = 0; i < registered_crops3.length; i++) {
    if(state.crops3[registered_crops3[i]].unlocked) numplants++;
  }

  var dialog = createDialog({
    title:(opt_replace ? 'Replace infinity crop' : 'Plant infinity crop'),
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
    flex.div.textEl.innerHTML = 'Choose an infinity crop to plant. Click the icon for more info, or the text to plant it now.';
  }

  flex = new Flex(contentFlex, 0, 0.1, 1, 1);
  makeScrollable(flex);

  var crops_order = getCrop3Order();

  for(var i = 0; i < crops_order.length; i++) {
    var index = crops_order[i];
    var c = crops3[index];
    var c2 = state.crops3[index];

    if(!c2.unlocked) continue;

    var tooltipfun = bind(function(index, opt_detailed) {
      var result = '';
      var c = crops3[index];
      var f = state.field3[y][x];

      result += 'Crop type: ' + getCropTypeName(c.type) + (c.tier ? (' (tier ' + (c.tier + 1) + ')') : '') + '<br>';
      var help = getCropTypeHelp3(c.type, state);
      if(help) {
        result += help;
        result += '<br><br>';
      }

      var cost = c.getCost();
      var replacementcost = cost;
      if(opt_replace) {
        replacementcost = cost.sub(opt_recoup);
        if(f.cropIndex() == c.index && c.type != CROPTYPE_BRASSICA) {
          replacementcost = Res(); // recoup - crop.getCost() gives wrong value since when planting same, crop amount used in cost computation is one less. Exception: brassica, where it's the opposite situation, crop amount doesn't affect cost, but has variable lifespan based recoup cost
        }
      }

      if(opt_detailed) {
        result += '<br>Base cost: ' + c.cost.toString();
        result += '<br>Next cost: ' + c.getCost().toString();
      } else {
        result += 'Cost: ' + c.getCost().toString();
      }
      if(opt_replace) result += '<br>Replacement cost: ' + replacementcost.toString();
      if(c.type == CROPTYPE_BRASSICA) {
        result += '<br><br>Finite lifetime: ' + util.formatDuration(c.planttime);
      } else {
        result += '<br><br>Grow time: ' + util.formatDuration(c.planttime);
      }

      var prod = c.getProd(f);
      if(!prod.empty()) {
        result += '<br><br>Production: ' + prod.toString() + '/s';
        if(c.type == CROPTYPE_BERRY) result += ' (boostable)'; // added for clarity, since at higher tiers, like electrum, the base production starts getting lower than that of watercress and it may be misleading to see that, whey they can be boosted 10K times as high with flowers/bees
        if(prod.infseeds.neqr(0) && prod.infseeds.ltr(0.1) && prod.infseeds.gtr(-0.1)) result += ' (' + prod.infseeds.mulr(3600).toString() + '/h)';
        if(c.type == CROPTYPE_BRASSICA) {
          var totalprod = prod.mulr(c.getPlantTime());
          result += '<br>Total production over full lifetime: ' + totalprod.toString();
        }
      }

      var infboost = c.getInfBoost();
      if(infboost.neqr(0)) {
        result += '<br><br>';
        if(c.type == CROPTYPE_RUNESTONE) {
          result += 'Boost to neighboring crops basic field boost: ' + infboost.toPercentString();
        } else if(c.type == CROPTYPE_BEE) {
          result += 'Boost to neighboring flowers: ' + infboost.toPercentString();
        } else if(c.type == CROPTYPE_FLOWER) {
          result += 'Boost to neighboring berries: ' + infboost.toPercentString();
        } else if(c.type == CROPTYPE_STINGING) {
          result += 'Boost to neighboring mushrooms: ' + infboost.toPercentString();
        } else if(c.type == CROPTYPE_FERN) {
          result += 'Copy: ' + infboost.toPercentString();
        } else {
          result += 'Boost: ' + infboost.toPercentString();
        }
      }

      var basicboost = c.getBasicBoost();
      if(basicboost.neqr(0)) {
        result += '<br><br>Production boost to basic field: ' + basicboost.toPercentString();
      }

      return result;
    }, index);


    var plantfun = bind(function(index) {
        var c = crops3[index];

        if(opt_replace) addAction({type:ACTION_REPLACE3, x:x, y:y, crop:c});
        else addAction({type:ACTION_PLANT3, x:x, y:y, crop:c});
        state.lastPlanted3 = index; // for shift key
        closeAllDialogs();
        update(); // do update immediately rather than wait for tick, for faster feeling response time
        return true;
    }, index);

    var showfun = bind(function(tooltipfun, plantfun, c) {
        var text = upper(c.name) + '<br><br>' + tooltipfun(true);
        var dialog = createDialog({
          size:(text.length < 350 ? DIALOG_SMALL : DIALOG_MEDIUM),
          title:'Infinity crop info',
          names:'plant',
          functions:plantfun,
          icon:c.image[4]
        });
        dialog.content.div.innerHTML = text;
    }, tooltipfun, plantfun, c);


    var chip = makePlantChip3(c, tx, ty, 0.33, flex, plantfun, showfun, tooltipfun, opt_replace, opt_recoup, state.field3[y][x]);
    tx++;
    if(tx >= 3) {
      tx = 0;
      ty++;
    }
  }

  flex.update(); // something about the makeScrollable above misplaces some of the flex-managed sub positions, this update fixes it
}
