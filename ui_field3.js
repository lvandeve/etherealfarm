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


var field3Divs;
var field3Rows;



// get crop info in HTML
function getCropInfoHTML3(f, c, opt_detailed) {
  var result = upper(c.name);
  result += '<br/>';
  result += 'Crop type: Infinity ' + getCropTypeName(c.type) + ((c.tier && c.isReal()) ? (' (tier ' + (c.tier + 1) + ')') : '');
  result += '<br/><br/>';

  if(f.growth < 1) {
    if(c.type == CROPTYPE_BRASSICA) {
      if(opt_detailed) {
        // the detailed dialog is not dynamically updated, so show the life growth time statically instead.
        result += 'Short-lived plant. Total lifetime: ' + util.formatTime(c.getPlantTime()) + '<br/><br/>';
      } else {
        var text0 = 'Short-lived plant';
        var growthremaining = f.growth;
        result += text0 + '. Time left: ' + util.formatDuration(growthremaining * c.getPlantTime(), true, 4, true) + ' of ' + util.formatDuration(c.getPlantTime(), true, 4, true) + '<br/>';
      }

      result += '<br/>';
    } else {
      result += 'Grow time: ' + util.formatDuration(c.getPlantTime());
      if(c.getPlantTime() != c.planttime) result += ' (base: ' + util.formatDuration(c.planttime) + ')';
      result += '<br/><br/>';
    }
  }

  var prod = c.getProd(f);
  if(!prod.empty()) {
    if(c.type == CROPTYPE_BRASSICA) {
      var totalprod = prod.mulr(c.getPlantTime());
      result += 'Total production over full lifetime: ' + totalprod.toString() + '<br>';
    }

    result += 'Production per second: ' + prod.toString();
    if(prod.infseeds.neqr(0) && prod.infseeds.ltr(0.1) && prod.infseeds.gtr(-0.1)) result += ' (' + prod.infseeds.mulr(3600).toString() + '/h)';
    result += '<br/><br/>';
  }

  var infboost = c.getInfBoost();
  if(infboost.neqr(0)) {
    result += 'Boost to neighbors: ' + infboost.toPercentString() + '<br><br>';
  }

  var basicboost = c.getBasicBoost();
  if(basicboost.neqr(0)) {
    result += 'Production boost to basic field: ' + basicboost.toPercentString();
    result += '<br/><br/>';
  }

  result += ' • Next planting cost: ' + c.getCost().toString() + '<br>';
  var recoup = c.getRecoup(f);
  if(c.type == CROPTYPE_BRASSICA) {
    result += ' • Recoup on delete: ' + recoup.toString() + ' (linearly scaled by remaining lifetime)';
  } else {
    result += ' • Recoup on delete: ' + recoup.toString();
  }

  return result;
}


function getCropInfoHTML3Breakdown(f, c) {
  var result = '';

  return result;
}



function makePond3Dialog() {
  var div;

  var dialog = createDialog({
    scrollable:true,
    title:'Infinity pond',
    bgstyle:'efDialogTranslucent',
    icon:image_pond
  });
  var contentFlex = dialog.content;

  var text = '';

  text += 'Nothing in this pond yet';
  text += '<br><br>';
  text += 'Total boost from infinity crops to basic field: ' + state.infinityboost.toPercentString();

  contentFlex.div.innerHTML = text;


}

function makeField3Dialog(x, y) {
  var f = state.field3[y][x];
  var fd = field3Divs[y][x];

  if(f.hasCrop()) {
    var c = crops3[f.cropIndex()];
    var div;

    var dialog = createDialog({
      icon:c.image[4],
      title:'Infinity crop info',
      bgstyle:'efDialogTranslucent'
    });

    var buttonshift = 0;

    var flex0 = new Flex(dialog.content, 0, [0, 0, 0.01], 1, 0.17);
    var button0 = new Flex(dialog.content, [0, 0, 0.2], [0.63 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.695 + buttonshift).div;
    var button1 = new Flex(dialog.content, [0, 0, 0.2], [0.7 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.765 + buttonshift).div;
    var last0 = undefined;

    styleButton(button0);
    button0.textEl.innerText = 'Replace crop';
    registerTooltip(button0, 'Replace the crop with a new one you choose, same as delete then plant. Shows the list of unlocked ethereal crops. If this changes the type of the crop or lowers the tier, then this only works if deleting is currently possible in the ethereal field. ' + etherealDeleteExtraInfo);
    addButtonAction(button0, function() {
      makePlantDialog3(x, y, true, c.getRecoup(f));
    });

    styleButton(button1);
    button1.textEl.innerText = 'Delete crop';
    button1.textEl.style.color = '#c00';
    if(c.type == CROPTYPE_BRASSICA) registerTooltip(button1, 'Delete crop, get ' + (cropRecoup3 * 100) + '% of the original cost back, scaled down by the remaining lifetime.');
    else registerTooltip(button1, 'Delete crop, get ' + (cropRecoup3 * 100) + '% of the original cost back.');
    addButtonAction(button1, function() {
      addAction({type:ACTION_DELETE3, x:x, y:y});
      closeAllDialogs();
      update(); // do update immediately rather than wait for tick, for faster feeling response time
    });

    updatedialogfun = bind(function(f, c, flex) {
      var html0 = getCropInfoHTML3(f, c, false);
      if(html0 != last0) {
        flex0.div.innerHTML = html0;
        last0 = html0;
      }
    }, f, c);

    updatedialogfun(f, c);
  } else if(f.index == FIELD_POND) {
    makePond3Dialog();
  } else {
    makePlantDialog3(x, y);
  }
}

function initField3UI() {
  field3Flex.clear();
  field3Rows = [];
  field3Divs = [];
  for(var y = 0; y < state.numh3; y++) {
    field3Divs[y] = [];
    for(var x = 0; x < state.numw3; x++) {
      field3Divs[y][x] = new CellDiv();
    }
  }

  //This is set up such that the field tiles are square on screen, field is rectangle (or square if numw3 == numh3), and always takes max size in the rectangular div in which the field is placed
  var ratio = state.numw3 / state.numh3;
  var field3Grid = new Flex(field3Flex, [0.5,0,-0.5,ratio], [0.5,0,-0.5,1/ratio], [0.5,0,0.5,ratio], [0.5,0,0.5,1/ratio]);

  var field3Div = field3Flex.div;
  var w = field3Div.clientWidth;
  var h = field3Div.clientHeight;

  setAriaRole(field3Grid.div, 'grid'); // intended for 2D navigation, combined with the row and cell roles given to the elements below
  setAriaLabel(field3Grid.div, 'infinity field');

  var tw = Math.floor(w / state.numw3) - 1;
  var th = Math.floor(h / state.numh3) - 1;
  tw = th = Math.min(tw, th);
  var x0 = 2 + Math.floor((field3Div.clientWidth - tw * state.numw3) / 2);
  var y0 = 2;

  for(var y = 0; y < state.numh3; y++) {
    var row = makeDiv('0', (y / state.numh3 * 100) + '%', '100%', (101 / state.numh3) + '%', field3Grid.div);
    setAriaRole(row, 'row');
    field3Rows[y] = row;
    for(var x = 0; x < state.numw3; x++) {
      var f = state.field3[y][x];
      var celldiv = makeDiv((x / state.numw3 * 100) + '%', '0', (101 / state.numw3) + '%', '100%', row);
      var bgcanvas = createCanvas('0%', '0%', '100%', '100%', celldiv); // canvas with the field background image
      var canvas = createCanvas('0%', '0%', '100%', '100%', celldiv); // canvas for the plant itself
      var div = makeDiv('0', '0', '100%', '100%', celldiv);
      setAriaRole(celldiv, 'cell');
      div.className = 'efNoOutline';
      div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
      centerText(div);

      field3Divs[y][x].div = div;
      field3Divs[y][x].canvas = canvas;
      field3Divs[y][x].bgcanvas = bgcanvas;

      util.setEvent(div, 'mouseover', 'fieldover', bind(function(x, y) {
        updateField3MouseOver(x, y);
      }, x, y));
      util.setEvent(div, 'mouseout', 'fieldout', bind(function(x, y) {
        updateField3MouseOut(x, y);
      }, x, y));
      // on mouse up and with timeout so that the state is fully updated after the action that the click caused
      util.setEvent(div, 'mouseup', 'fieldclick', bind(function(x, y) {
        window.setTimeout(function(){updateField3MouseClick(x, y)});
      }, x, y));

      registerTooltip(div, bind(function(x, y, div) {
        var f = state.field3[y][x];
        var fd = field3Divs[y][x];

        var result = undefined;
        if(f.index == 0) {
          return undefined; // no tooltip for empty fields, it's a bit too spammy when you move the mouse there
        } else if(f.index == FIELD_POND) {
          return 'Infinity pond';
        } else if(f.hasCrop()) {
          var c = crops3[f.cropIndex()];
          result = getCropInfoHTML3(f, c, false);
        }
        return result;
      }, x, y, div), true);

      addButtonAction(div, bind(function(x, y, div, e) {
        var f = state.field3[y][x];
        if(f.index == FIELD_POND) {
          makeField3Dialog(x, y);
        } else if(f.index == 0 || f.index == FIELD_REMAINDER) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(shift && !ctrl) {
            if(state.lastPlanted3 >= 0 && crops3[state.lastPlanted3]) {
              var c = crops3[state.lastPlanted3];
              addAction({type:ACTION_PLANT3, x:x, y:y, crop:c, shiftPlanted:true});
              update();
            } else {
              showMessage(shiftClickPlantUnset, C_INVALID, 0, 0);
            }
          } else if(ctrl && !shift) {
            // TODO: choose highest affordable brassica instead of hardcoded brassica3_0 here, once more brassica exist on field3
            addAction({type:ACTION_PLANT3, x:x, y:y, crop:crops3[brassica3_0], shiftPlanted:true});
            update();
          } else {
            makeField3Dialog(x, y);
          }
        } else if(f.hasCrop()) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(ctrl && !shift) {
            addAction({type:ACTION_DELETE3, x:x, y:y});
            update();
          } else {
            makeField3Dialog(x, y);
          }
        } else {
          makeField3Dialog(x, y);
        }
      }, x, y, div));

      var pw = tw >> 1;
      var ph = Math.round(th / 16);
      if(ph < 4) ph = 4;
      var px = x0 + x * tw + ((tw - pw) >> 1);
      var py = y0 + (y + 1) * th - ph * 2;
      var progress = makeDiv((((x + 0.2) / state.numw3) * 100) + '%', (((y + 0.85) / state.numh3) * 100) + '%', (100 / state.numw3 * 0.6) + '%', (100 / state.numh3 * 0.05) + '%', field3Grid.div);
      progress.style.minHeight = '5px';
      initProgressBar(progress);
      field3Divs[y][x].progress = progress;
    }
  }
}

function updateField3CellUI(x, y) {
  var f = state.field3[y][x];
  var fd = field3Divs[y][x];
  var growstage = (f.growth >= 1) ? 4 : Math.min(Math.floor(f.growth * 4), 3);
  var season = 6; // infinity season

  var progresspixel = -1;

  var ferncode = 0;

  if(fd.index != f.index || fd.growstage != growstage || season != fd.season || ferncode != fd.ferncode || progresspixel != fd.progresspixel) {
    var r = util.pseudoRandom2D(x, y, 55555);
    var fieldim = images_field[season];
    var field_image = r < 0.25 ? fieldim[0] : (r < 0.5 ? fieldim[1] : (r < 0.75 ? fieldim[2] : fieldim[3]));
    if(f.index == FIELD_POND) field_image = fieldim[4];
    renderImage(field_image, fd.bgcanvas);
    fd.season = season;
    fd.ferncode = ferncode;
    fd.progresspixel = progresspixel;

    var label = 'infinity field tile ' + x + ', ' + y;

    fd.index = f.index;
    fd.growstage = growstage;
    if(f.hasCrop()) {
      var c = crops3[f.cropIndex()];
      renderImage(c.image[growstage], fd.canvas);
      label = c.name + '. ' + label;
    } else if(f.index == FIELD_POND) {
      renderImage(image_pond, fd.canvas);
    } else if(f.index == FIELD_REMAINDER) {
      renderImage(image_watercress_remainder, fd.canvas);
    } else {
      fd.div.innerText = '';
      unrenderImage(fd.canvas);
    }
    if(f.growth >= 1 || !f.hasCrop()) {
      setProgressBar(fd.progress, -1, undefined);
    }

    if(f.index == 0) {
      label = 'empty ' + label;
    }

    setAriaLabel(fd.div, label);
  }
  if(f.hasCrop() && f.growth < 1) {
    var c = crops3[f.cropIndex()];
    setProgressBar(fd.progress, f.growth, '#f00');
  }
}

function renderField3() {
  for(var y = 0; y < state.numh3; y++) {
    for(var x = 0; x < state.numw3; x++) {
      updateField3CellUI(x, y);
    }
  }
}


