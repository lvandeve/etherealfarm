/*
Ethereal Farm
Copyright (C) 2020-2022  Lode Vandevenne

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
// opt_recoup is the cost you get back when opt_replace is true
// opt_select_only: makes a simpler plant chip that serves to select it. Will call opt_plantfun as usual but it may do something else than planting. Costs are not shown.
function makePlantChip(crop, x, y, w, parent, fieldx, fieldy, opt_plantfun, opt_showfun, opt_tooltipfun, opt_replace, opt_recoup, opt_select_only) {
  var f = undefined;
  if(fieldx != undefined && fieldy != undefined) {
    f = state.field[fieldy][fieldx];
  }
  var h = opt_select_only ? 0.4 : 0.6;
  var flex = new Flex(parent, x * w + 0.01, [0, 0, y * w * 0.9 + 0.01, h], (x + 1) * w - 0.01, [0, 0, (y + 1) * w * 0.9 - 0.01, h]);
  var div = flex.div;
  div.className = 'efPlantChip';

  var canvasFlex = new Flex(flex, 0, [0.5, 0, -0.25], [0, 0, 0.5], [0.5, 0, 0.25]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(crop.image[4], canvas);

  var ypos = opt_select_only ? 0.1 : 0.05;
  var xpos = opt_select_only ? 0.1 : 0;
  var infoFlex = new Flex(flex, [xpos, 0, 0.5], ypos, 1, 0.95);
  var text = '';
  if(opt_replace || opt_select_only) {
    text +=  '<b>' + upper(crop.name) + '</b><br>';
  } else {
    text +=  '<b>Plant ' + crop.name + '</b><br>';
  }
  var cost = crop.getCost();
  if(opt_recoup) cost = cost.sub(opt_recoup);

  text += 'type: ' + getCropTypeName(crop.type);
  if(!opt_select_only) {
    text += '<br>cost: ' + cost.toString();
  }

  infoFlex.div.innerHTML = text;

  if(crop.index == brassica_0) infoFlex.div.id = 'help_arrow_plant_watercress';
  if(crop.index == berry_0) infoFlex.div.id = 'help_arrow_plant_blackberry';
  if(crop.index == berry_1) infoFlex.div.id = 'help_arrow_plant_blueberry';

  if(opt_showfun) {
    styleButton0(canvasFlex.div, true);
    addButtonAction(canvasFlex.div, opt_showfun, upper(crop.name) + ' info');
  }
  if(opt_plantfun) {
    addButtonAction(infoFlex.div, opt_plantfun, (opt_replace ? 'Replace with ' : 'Plant ') + crop.name);
    styleButton0(infoFlex.div, true);
  }

  if(opt_tooltipfun) {
    if(opt_showfun) {
      registerTooltip(canvasFlex.div, function() {
        return 'Show ' + crop.name + ' info';
      }, true);
    }
    if(opt_plantfun) {
      registerTooltip(infoFlex.div, function() {
        return (opt_replace ? 'Replace with ' : 'Plant ') + crop.name + '<br><br>' + opt_tooltipfun();
      }, true);
    } else {
      registerTooltip(infoFlex.div, function() {
        return upper(crop.name) + '<br><br>' + opt_tooltipfun();
      }, true);
    }
  } else {
    if(opt_showfun) registerTooltip(canvasFlex.div, 'Show ' + crop.name + ' info');
    if(opt_plantfun) registerTooltip(canvasFlex.div, (opt_replace ? 'Replace with ' : 'Plant ') + crop.name);
  }

  if(opt_plantfun && state.res.lt(cost) && !opt_select_only) {
    flex.div.className = 'efButtonTranslucentCantAfford';
    registerUpdateListener(function() {
      if(!flex || !document.body.contains(infoFlex.div)) return false;
      var cost = crop.getCost();
      if(opt_recoup) cost = cost.sub(opt_recoup);
      if(state.res.gte(cost)) {
        flex.div.className = 'efPlantChip';
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

  // most expensive nut
  highest = undefined;
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    var c = crops[unlocked[i]];
    if(c.type == CROPTYPE_NUT && (!highest || c.cost.gt(highest.cost))) highest = c;
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
    if(c.type == CROPTYPE_STINGING && (!highest || c.cost.gt(highest.cost))) highest = c;
  }
  if(highest) {
    result.push(highest.index);
    added[highest.index] = true;
  }

  // most expensive brassica
  highest = undefined;
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    var c = crops[unlocked[i]];
    if(c.type == CROPTYPE_BRASSICA && (!highest || c.cost.gt(highest.cost))) highest = c;
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
    var ac = crops[a].cost.seeds;
    var bc = crops[b].cost.seeds;
    if(ac.eqr(0) || bc.eqr(0)) {
      // for nuts taht cost spores instead of seeds
      ac = Num(crops[a].tier);
      bc = Num(crops[b].tier);
    }
    return ac.lt(bc) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    result.push(array[i]);
    added[array[i]] = true;
  }

  return result;
}

function showPlantingHelp() {
  var dialog = createDialog({scrollable:true, title:'Planting help'});

  var text = '';

  text += 'The planting dialog allows to plant crops on the field. Use the plant button to perform the action now, or click the icon of the crop to view details.';
  text += '<br><br>';
  text += 'The following actions and shortcuts are available:';
  text += '<br><br>';
  text += 'To plant a new crop on an empty field tile:';
  text += '<br>';
  text += '• Click empty field tile, then click desired crop in the planting dialog';
  text += '<br>';
  text += '• OR: Shift+click empty field tile to plant the last-planted or unlocked crop';
  text += '<br>';
  text += '• OR: Ctrl+click empty field to plant watercress';
  text += '<br><br>';
  text += 'To remove a crop from the field:';
  text += '<br>';
  text += '• Click the crop on the field, then the "Delete crop" button';
  text += '<br>';
  text += '• OR: Hover mouse over the crop in the field, then press the "d" key';
  text += '<br>';
  text += '• OR: Ctrl+click the crop in the field (requires a setting under preferences)';
  text += '<br><br>';
  text += 'To replace a crop to the highest unlocked tier of its type that you can afford:';
  text += '<br>';
  text += '• Click the crop on the field, then the "Tier up" button';
  text += '<br>';
  text += '• OR: Hover mouse over the crop in the field, then press the "u" key';
  text += '<br>';
  text += '• OR: Ctrl+shift+click the crop in the field';
  text += '<br><br>';
  text += 'To replace a crop in the field with a different one:';
  text += '<br>';
  text += '• Click the crop on the field, then the "Replace crop" button and choose the new one in the planting dialog';
  text += '<br>';
  text += '• OR: Shift+click the crop in the field to replace it with the last planted or unlocked crop (requires a setting under preferences)';

  dialog.content.div.innerHTML = text;
}


// opt_all is for planting in the entire field with automaton, and makes it ignore various other parameters like x and y
function makePlantDialog(x, y, opt_replace, opt_recoup, opt_all) {
  var num_unlocked = 0;
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) num_unlocked++;
  }

  var dialogsize = DIALOG_SMALL;
  if(num_unlocked > 9) dialogsize = DIALOG_MEDIUM;
  if(num_unlocked > 12) dialogsize = DIALOG_LARGE;

  var dialog = createDialog({
    size:dialogsize,
    help:showPlantingHelp,
    title:(opt_replace ? 'Replace crop' : 'Plant crop'),
    bgstyle:'efDialogTranslucent'
  });
  var tx = 0;
  var ty = 0;

  var flex = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.05);
  if(opt_replace) {
    centerText2(flex.div);
    flex.div.textEl.innerHTML = 'Replace crop with...';
  } else {
    flex.div.innerHTML = 'Choose a crop to plant, or click its icon for info';
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

      if(c.istemplate) {
        result += 'This template represents all crops of type ' + getCropTypeName(c.type);
        result += '<br/><br/>It is a placeholder for planning the field layout and does nothing.';
        result += '<br><br>Templates are a feature provided by the automaton.';
        result += '<br><br>Tip: ctrl+shift+click a template, or hover over it and press \'u\', to turn it into a crop of highest available tier of this type.';
      } else if(c.isghost) {
        result += 'Ghostly remainder of a ' + getCropTypeName(c.type) + ', does nothing. Automaton won\'t touch this either.';
      } else {
        result += 'Crop type: ' + getCropTypeName(c.type) + (c.tier ? (' (tier ' + (c.tier + 1) + ')') : '');

        var help = getCropTypeHelp(c.type, state.challenge == challenge_bees);
        if(help) {
          result += '.<br>' + help;
        }
        if(c.tagline) result += '<br/><br/>' + upper(c.tagline);

        if(c.type == CROPTYPE_BRASSICA) result += '.<br><br>' + leechInfo;
        var cost = c.getCost();
        result += '<br><br>Planting cost: ' + cost.toString() + ' (' + getCostAffordTimer(cost) + ')';


        if(c.type == CROPTYPE_BRASSICA) {
          result += '.<br><br>Living time: ' + util.formatDuration(c.getPlantTime());
        } else {
          result += '.<br><br>Grow time: ' + util.formatDuration(c.getPlantTime());
          if(c.getPlantTime() != c.planttime) result += ' (base: ' + util.formatDuration(c.planttime) + ')';
        }
        if(c.type == CROPTYPE_FLOWER) {
          result += '.<br><br>Neighbor boost: ' + c.getBoost(state.field[y][x]).toPercentString();
        } else if(c.type == CROPTYPE_BEE) {
          result += '.<br><br>Flower boost: ' + c.getBoostBoost(state.field[y][x]).toPercentString();
        } else {
          result += '.<br><br>Production/sec: ' + c.getProd(state.field[y][x], 2).toString();
        }
        result += '.';
      }
      return result;
    }, index);

    var plantfun = bind(function(index) {
      state.lastPlanted = index; // for shift key
      var c = crops[index];
      if(opt_all) {
        var done_something = false;
        for(var y2 = 0; y2 < state.numh; y2++) {
          for(var x2 = 0; x2 < state.numw; x2++) {
            var f;
            f = state.field[y2][x2];
            if(f.isEmpty()) {
              addAction({type:ACTION_PLANT, x:x2, y:y2, crop:c, silent:true});
              done_something = true;
            }
          }
        }
        if(!done_something) showMessage('Entire field is already full, clear field first or have some open gaps to use "plant all"', C_INVALID);
      } else if(opt_replace) {
        addAction({type:ACTION_REPLACE, x:x, y:y, crop:c});
      } else {
        addAction({type:ACTION_PLANT, x:x, y:y, crop:c});
      }
      closeAllDialogs();
      update(); // do update immediately rather than wait for tick, for faster feeling response time
      return true;
    }, index);

    var showfun = bind(function(tooltipfun, plantfun, c) {
      var text = upper(c.name) + '<br><br>' + tooltipfun();
      var dialog = createDialog({
        size:(text.length < 350 ? DIALOG_SMALL : DIALOG_MEDIUM),
        title:'Crop info',
        names:'plant',
        functions:plantfun,
        icon:c.image[4]
      });
      dialog.content.div.innerHTML = text;
    }, tooltipfun, plantfun, c);

    var chip = makePlantChip(c, tx, ty, 0.33, flex, x, y, plantfun, showfun, tooltipfun, opt_replace, opt_recoup);
    tx++;
    if(tx >= 3) {
      tx = 0;
      ty++;
    }
  }

  flex.update(); // something about the makeScrollable above misplaces some of the flex-managed sub positions, this update fixes it
}



// Similar to makePlantDialog, but for selecting a plant for custom purposes (such as automaton auto-action triggers).
// Also allows choosing prestige level.
// Calls the callback with as parameters the index of the selected crop, and the chosen prestige level
// Shows all known plants over all runs ever
function makePlantSelectDialog(cropid, prestiged, callback) {
  var crops_order = []; // = getCropOrder();

  var prestige_known = (state.g_numprestiges >= 1);
  for(var i = 0; i < registered_crops.length; i++) {
    var c = state.crops[registered_crops[i]];
    if(!(c.known || c.unlocked)) continue;
    if(c.known > 1 || c.prestige) prestige_known = true;
    crops_order.push(registered_crops[i]);
  }

  var help = undefined;
  if(prestige_known) help = 'Select crop by clicking it. This will immediately close the dialog, so the "prestige" checkbox must be checked or unchecked before choosing the crop.<br><br>Note that this dialog does not prevent combinations of prestiged with crops that cannot be prestiged, ensure an existing combination is chosen for your use case.';

  var dialog = createDialog({
    help:help,
    title:'Select crop',
    bgstyle:'efDialogTranslucent',
    cancelname:'cancel'
  });
  var tx = 0;
  var ty = 0;

  if(prestige_known) {
    var cbflex = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.05);
    //flex.div.textEl.innerHTML = 'Prestige TODO';
    var update = function() {
      var text = '';
      var flex0 = new Flex(cbflex, 0, 0, [0, 1], 1);
      var flex1 = new Flex(cbflex, [0, 1.2], 0, 1, 1);
      var canvas = createCanvas('0%', '0%', '100%', '100%', flex0.div);
      renderImage(prestiged ? image_checkbox_on : image_checkbox_off, canvas);
      styleButton0(flex0.div);
      addButtonAction(flex0.div, bind(function(i) {
        prestiged = (prestiged ? 0 : 1);
        //callback(cropid, prestiged);
        update();
      }, i), 'checkbox "prestiged" (' + (prestiged ? 'checked' : 'unchecked') + ')');
      text += 'Prestiged';
      text += '\n';
      flex1.div.innerText = text;
    };
    update();
  }

  var flex = new Flex(dialog.content, 0, 0.12, 1, 1);
  makeScrollable(flex);

  for(var i = 0; i < crops_order.length; i++) {
    var index = crops_order[i];
    var c = crops[index];

    var plantfun = bind(function(index) {
      cropid = index;
      callback(cropid, prestiged);
      closeTopDialog();
    }, index);

    var chip = makePlantChip(c, tx, ty, 0.33, flex, undefined, undefined, plantfun, undefined, undefined, false, undefined, true);
    tx++;
    if(tx >= 3) {
      tx = 0;
      ty++;
    }
  }

  flex.update(); // something about the makeScrollable above misplaces some of the flex-managed sub positions, this update fixes it
}

