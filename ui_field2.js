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


var field2Divs;



function makeField2Dialog(x, y) {
  var f = state.field2[y][x];
  var fd = field2Divs[y][x];

  if(f.index >= CROPINDEX) {
    var c = crops2[f.index - CROPINDEX];
    var div;

    var dialog = createDialog();
    dialog.div.style.backgroundColor = '#eefc'; // slightly translucent to see resources through it
    var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [0, 0.2], [0, 0.2], 0.3);
    var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(c.image[4], canvas);

    var flex = new Flex(dialog, [0.01, 0.2], [0, 0.01], 1, 0.15, 0.3);
    flex.div.innerHTML = 'ethereal crop';
  } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
    var c = crops2[f.index - CROPINDEX];
    var div;

    var dialog = createDialog();
    dialog.div.style.backgroundColor = '#eefc'; // slightly translucent to see resources through it
    var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [0, 0.2], [0, 0.2], 1);
    flex.div.innerHTML = 'ethereal tree';

  } else {
    makePlantDialog2(x, y);
  }
}

// get crop info in HTML
function getCropInfoHTML2(f, c) {
  var result = util.upperCaseFirstWord(c.name);
  result += '<br/>';


  var prod = c.getProd(f);
  if(!prod.empty()) {
    result += 'Production per second: ' + prod.toString() + '<br/>';
    if(prod.hasNeg()) result += 'Consumes a resource produced by other crops<br/>';
  }
  if(c.boost.neqr(0)) {
    result += 'Boosting neighbors: ' + (c.getBoost().mulr(100).toString()) + '%<br/>';
  }

  result += '<br/>Cost: ' + c.getCost().toString();
  // ethereal crop recoup is 100%
  result += '<br/>Recoup on delete: ' + c.getCost().toString();

  return result;
}

function initField2UI() {
  field2Divs = [];
  for(var y = 0; y < state.numh2; y++) {
    field2Divs[y] = [];
    for(var x = 0; x < state.numw2; x++) {
      field2Divs[y][x] = new CellDiv();
    }
  }

  //This is set up such that the field tiles are square on screen, field is rectangle (or square if numw == numh), and always takes max size in the rectangular div in which the field is placed
  var ratio = state.numw / state.numh;
  var field2Grid = new Flex(field2Flex, [0.5,-0.5,ratio], [0.5,-0.5,1/ratio], [0.5,0.5,ratio], [0.5,0.5,1/ratio]);

  var field2Div = field2Flex.div;
  var w = field2Div.clientWidth;
  var h = field2Div.clientHeight;

  var tw = Math.floor(w / state.numw2) - 1;
  var th = Math.floor(h / state.numh2) - 1;
  tw = th = Math.min(tw, th);
  var x0 = 2 + Math.floor((field2Div.clientWidth - tw * state.numw2) / 2);
  var y0 = 2;

  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      var bgdiv = makeDiv((x / state.numw2 * 100) + '%', (y / state.numh2 * 100) + '%', (100 / state.numw2) + '%', (100 / state.numh2) + '%', field2Grid.div);
      var fgdiv = makeDiv((x / state.numw2 * 100) + '%', (y / state.numh2 * 100) + '%', (100 / state.numw2) + '%', (100 / state.numh2) + '%', field2Grid.div);
      var div = makeDiv((x / state.numw2 * 100) + '%', (y / state.numh2 * 100) + '%', (100 / state.numw2) + '%', (100 / state.numh2) + '%', field2Grid.div);
      div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
      centerText(div);
      var bgcanvas = createCanvas('0%', '0%', '100%', '100%', bgdiv); // canvas with the field background image
      var canvas = createCanvas('0%', '0%', '100%', '100%', fgdiv); // canvas for the plant itself

      field2Divs[y][x].div = div;
      field2Divs[y][x].canvas = canvas;
      field2Divs[y][x].bgcanvas = bgcanvas;

      registerTooltip(div, bind(function(x, y, div) {
        var f = state.field2[y][x];
        var fd = field2Divs[y][x];

        var result = undefined;
        if(f.index == 0) {
          return undefined; // no tooltip for empty fields, it's a bit too spammy when you move the mouse there
        } else if(f.index >= CROPINDEX) {
          var c = crops2[f.index - CROPINDEX];
          result = getCropInfoHTML2(f, c);
        } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
          return 'ethereal tree';
        }
        return result;
      }, x, y, div), true);

      div.onclick = bind(function(x, y, div, e) {
        var f = state.field2[y][x];
        if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
          makeField2Dialog(x, y);
        } else if(f.index == 0) {
          makeField2Dialog(x, y);
        } else if(f.index >= CROPINDEX) {
          makeField2Dialog(x, y);
        }
      }, x, y, div);


    }
  }
}

function updateField2CellUI(x, y) {
  var f = state.field2[y][x];
  var fd = field2Divs[y][x];
  var growstage = 4;
  var season = 4; // the ethereal season

  var ferncode = 0;

  if(fd.index != f.index || fd.growstage != growstage || season != fd.season || state.treelevel2 != fd.treelevel2 || ferncode != fd.ferncode) {
    var r = util.pseudoRandom2D(x, y, 55555);
    var fieldim = images_field[season];
    var field_image = r < 0.25 ? fieldim[0] : (r < 0.5 ? fieldim[1] : (r < 0.75 ? fieldim[2] : fieldim[3]));
    if(f.index == FIELD_TREE_BOTTOM || f.index == FIELD_TREE_TOP) field_image = fieldim[4];
    renderImage(field_image, fd.bgcanvas);
    fd.season = season;
    fd.treelevel2 = state.treelevel2;
    fd.ferncode = ferncode;

    fd.index = f.index;
    fd.growstage = growstage;
    if(f.index >= CROPINDEX) {
      var c = crops2[f.index - CROPINDEX];
      renderImage(c.image[growstage], fd.canvas);
    } else if(f.index == FIELD_TREE_TOP) {
      renderImage(tree_images[treeLevelIndex(state.treelevel2)][1][season], fd.canvas);
    } else if(f.index == FIELD_TREE_BOTTOM) {
      renderImage(tree_images[treeLevelIndex(state.treelevel2)][2][season], fd.canvas);
      if(state.treelevel2 > 0) renderLevel(fd.canvas, state.treelevel2, 0, 11);
    } else {
      fd.div.innerText = '';
      unrenderImage(fd.canvas);
    }
  }
}
