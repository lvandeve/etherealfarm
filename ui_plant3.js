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
  if(opt_replace && opt_field && opt_field.cropIndex() == crop.index) cost = Res(); // recoup - crop.getCost() gives wrong value since when planting same, amount used in cost computation is one less
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
        flex.div.className = 'efPlantChip';
        return false;
      }
      return true;
    });
  }

  return flex;
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

  for(var i = 0; i < registered_crops3.length; i++) {
    if(!state.crops3[registered_crops3[i]].unlocked) continue;
    var index = registered_crops3[i];
    var c = crops3[index];

    var tooltipfun = bind(function(index) {
      var result = '';
      var c = crops3[index];

      result += 'Cost: ' + c.getCost().toString();
      if(c.type == CROPTYPE_BRASSICA) {
        result += '<br><br>Living time: ' + util.formatDuration(c.planttime);
      } else {
        result += '<br><br>Grow time: ' + util.formatDuration(c.planttime);
      }

      var f = state.field3[y][x];

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
        var text = upper(c.name) + '<br><br>' + tooltipfun();
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
