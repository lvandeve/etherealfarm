/*
Ethereal Farm
Copyright (C) 2020-2021  Lode Vandevenne

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

function renderBlueprint(b, flex, opt_index) {
  flex.clear();
  flex.div.style.backgroundColor = '#edc';

  if(!b) b = new BluePrint();
  var w = b.numw;
  var h = b.numh;

  var ratio = h ? (w / h) : 1;
  var grid = new Flex(flex, [0.5,-0.5,ratio], [0.5,-0.5,1/ratio], [0.5,0.5,ratio], [0.5,0.5,1/ratio]);

  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var cell = new Flex(grid, x / w, y / h, (x + 1) / w, (y + 1) / h);
      var t = b.data[y][x];
      var c = crops[BluePrint.toCrop(t)];
      if(c) {
        var canvas = createCanvas('0%', '0%', '100%', '100%', cell.div);
        renderImage(c.image[4], canvas);
      }
    }
  }

  if(!b.numw || !b.numh) {
    centerText2(grid.div);
    grid.div.textEl.innerText = '[empty]';
  }

  var name = b.name;
  //if(!name && opt_index != undefined) name = 'blueprint ' + opt_index;

  if(name) {
    var nameFlex = new Flex(flex, 0, -0.1, 1, 0);
    nameFlex.div.innerText = name + ':';
  }

  var name2 = 'blueprint';
  if(opt_index != undefined) name2 += ' ' + opt_index;
  if(b.name) name2 += ': ' + b.name;
  var text = createBluePrintText(b);


  flex.div.setAttribute('aria-description', name2 + ': ' + text);
}

function plantBluePrint(b) {
  if(!b || b.numw == 0 || b.numh == 0) return;
  // match up corners such that standard tree position overlap, in case field sizes are different
  // treex and treey are coordinates of the stem
  var treex0 = Math.floor((state.numw - 1) / 2);
  var treey0 = Math.floor(state.numh / 2);
  var treex1 = Math.floor((b.numw - 1) / 2);
  var treey1 = Math.floor(b.numh / 2);
  var sx = treex1 - treex0;
  var sy = treey1 - treey0;
  var w = b.numw;
  var h = b.numh;
  var single = false;
  if(w == 1 && h == 1) {
    w = state.numw;
    h = state.numh;
    single = true; // special case: 1x1 blueprint fills entire field
  }
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f, t, fx, fy;
      if(single) {
        f = state.field[y][x];
        t = b.data[0][0];
        fx = x;
        fy = y;
      } else {
        fx = x - sx;
        fy = y - sy;
        if(fx < 0 || fy < 0 || fx >= state.numw || fy >= state.numh) continue;
        f = state.field[fy][fx];
        t = b.data[y][x];
      }
      // don't overwrite anything that already exists on the field
      // that includes existing blueprint spots: if you want to combine blueprints, start from the smallest one, then bigger one to fill in the remaining gaps, not the opposite
      // reason: automaton may already start building up blueprint, so combining the opposite way (overwrite blueprint tiles) may not work due to already becoming real plants
      if(f.index != 0 && f.index != FIELD_REMAINDER) continue;
      var c = crops[BluePrint.toCrop(t)];
      if(c) {
        if(!state.crops[c.index].unlocked) continue;
        actions.push({type:ACTION_PLANT, x:fx, y:fy, crop:c, shiftPlanted:false});
      }
    }
  }
}

// set a blueprint to empty if it has only 0-cells
function sanitizeBluePrint(b) {
  if(!b) return;
  var w = b.numw;
  var h = b.numh;

  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      if(b.data[y][x] != 0) return; // has content, nothing to do
    }
  }

  b.numw = 0;
  b.numh = 0;
  b.data = [];
}

function createBluePrintText(b) {
  var text = '';
  if(b) {
    var w = b.numw;
    var h = b.numh;
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        var c = BluePrint.toChar(b.data[y][x]);
        text += c;
      }
      text += '\n';
    }
  }
  return text;
}

function exportBluePrint(b) {
  var text = createBluePrintText(b);
  showExportTextDialog('export blueprint', text, 'blueprint-' + util.formatDate(util.getTime(), true) + '.txt', false);
}

function importBluePrintDialog(fun) {
  var w = 500, h = 500;
  var dialog = createDialog(false, function(e) {
    var shift = e.shiftKey;
    var text = area.value;
    fun(text);
    dialog.cancelFun();
  }, 'import', 'cancel');
  var textFlex = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4);
  textFlex.div.innerHTML = 'Import blueprint. Case insensitive. B=berry, M=mushroom, F=flower, N=nettle, H=beehive, I=mistletoe, .=empty/tree.';
  var area = util.makeAbsElement('textarea', '1%', '15%', '98%', '70%', dialog.content.div);
  area.select();
  area.focus();
}

function createBlueprintDialog(b, opt_index) {
  var orig = b;
  b = BluePrint.copy(b);

  var dialog = createDialog(undefined, function() {
    BluePrint.copyTo(b, orig);
    dialog.cancelFun();
  }, 'ok', 'cancel');

  var renderFlex = new Flex(dialog.content, [0, 0.05], [0, 0.05], [0, 0.5], [0, 0.5]);
  renderBlueprint(b, renderFlex, opt_index);


  var y = 0.5;
  var addButton = function(text, fun) {
    var h = 0.06;
    var button = new Flex(dialog.content, [0, 0.05], y, [0.5, 0.05], y + h, 0.8).div;
    y += h * 1.1;
    styleButton(button);
    button.textEl.innerText = text;
    addButtonAction(button, fun);
  };

  addButton('To field', function() {
    plantBluePrint(b);
    BluePrint.copyTo(b, orig); // since this closes the dialog, remember it like the ok button does
    closeAllDialogs();
    update();
  });

  addButton('From field', function() {
    var w = state.numw;
    var h = state.numh;
    b.numw = w;
    b.numh = h;
    b.data = [];
    for(var y = 0; y < h; y++) {
      b.data[y] = [];
      for(var x = 0; x < w; x++) {
        var f = state.field[y][x];
        b.data[y][x] = BluePrint.fromCrop(f.getCrop());
      }
    }
    sanitizeBluePrint(b);
    renderBlueprint(b, renderFlex, opt_index);
  });

  addButton('To TXT', function() {
    exportBluePrint(b);
  });

  addButton('From TXT', function() {
    importBluePrintDialog(function(text) {
      if(text == '') return;
      text = text.trim();
      var s = text.split('\n');
      var h = s.length;
      if(h < 1 || h > 11) return;
      var w = 0;
      for(var i = 0; i < h; i++) w = Math.max(w, s[i].length);
      if(w < 1) return;
      if(w > 11) w = 11;
      b.numw = w;
      b.numh = h;
      b.data = [];
      for(var y = 0; y < h; y++) {
        b.data[y] = [];
        for(var x = 0; x < w; x++) {
          b.data[y][x] = BluePrint.fromChar(s[y][x]);
        }
      }
      sanitizeBluePrint(b);
      renderBlueprint(b, renderFlex, opt_index);
    });
  });

  addButton('Rename', function() {
    makeTextInput('Enter new blueprint name, or empty for default', function(name) {
      b.name = sanitizeName(name);
      renderBlueprint(b, renderFlex, opt_index);
    });
  });

  addButton('Delete blueprint', function() {
    b.numw = 0;
    b.numh = 0;
    b.data = [];
    b.name = '';
    renderBlueprint(b, renderFlex, opt_index);
  });

  addButton('Help', function() {
    showBluePrintHelp();
  });

  return dialog;
}

function showBluePrintHelp() {
  var dialog = createDialog();

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Blueprint help';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1, 0.3);
  var div = flex.div;
  makeScrollable(flex);

  var text = '';

  text += 'Blueprint allow planting a whole field layout at once, and storing layouts';
  text += '<br/><br/>';
  text += 'A field layout represents a crop type for each tile. Crop types are for example berry, mushroom, flower, nettle, ... A layout never refers to a specific crop, such as blackberry or blueberry, only to the type (here "berry") in general.';
  text += '<br/><br/>';
  text += 'Planting a blueprint places crop templates on the field. You can also plant individual crop templates yourself using the regular plant dialog.';
  text += '<br/><br/>';
  text += 'The blueprint will only plant templates on empty field cells, when a field cell already has something (including another template) it is not overplanted.';
  text += '<br/><br/>';
  text += 'If the blueprint and field have a different size, it still just works and plants anything it can that is not out of bounds, centered around the tree. The tree is not present in the blueprint itself, it assumes where the standard position of a field of that size is.';
  text += '<br/><br/>';
  text += 'To create a blueprint, you can use two methods:';
  text += '<br/>';
  text += ' • From field: the current field layout is copied to the blueprint, e.g. wherever there\'s any berry on the field, produces a berry template in the blueprint.';
  text += '<br/>';
  text += ' • From text (TXT): Write a field layout on multiple lines of text using the following letters: B=berry, M=mushroom, F=flower, N=nettle, H=beehive, I=mistletoe, .=empty/tree. Export TXT does the opposite.';
  text += '<br/><br/>';
  text += 'Keyboard shotcuts for blueprints:';
  text += '<br/>';
  text += 'Note: on mac, ctrl means command instead.';
  text += '<br/>';
  text += ' • "b": open the blueprint dialog';
  text += '<br/>';
  text += ' • shift + click blueprint in main blueprint dialog: plant it immediately rather than opening its editing dialog (if not empty)';
  text += '<br/>';
  text += ' • ctrl + shift + click blueprint template in the field: grow highest crop type you can afford of that type here (just shift replaces it, and ctrl deletes it, as usual)';
  text += '<br/><br/>';
  text += 'Once automaton is advanced enough, it can also use blueprints.';

  div.innerHTML = text;
}

function createBlueprintsDialog() {
  var dialog = createDialog();

  var titleFlex = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4);
  centerText2(titleFlex.div);
  titleFlex.div.textEl.innerText = 'Blueprint library';

  var bflex = new Flex(dialog.content, [0.01, 0], [0.1, 0], [0.01, 0.98], [0.1, 0.98]);

  for(var i = 0; i < 9; i++) {
    var x = i % 3;
    var y = Math.floor(i / 3);
    var flex = new Flex(bflex, 0.33 * (x + 0.05), 0.33 * (y + 0.05), 0.33 * (x + 0.95), 0.33 * (y + 0.95));
    renderBlueprint(state.blueprints[i], flex, i);
    styleButton0(flex.div, true);
    addButtonAction(flex.div, bind(function(index, flex, e) {
      for(var i = 0; i <= index; i++) {
        if(!state.blueprints[i]) state.blueprints[i] = new BluePrint();
      }
      if(e.shiftKey && state.blueprints[index] && state.blueprints[index].numw && state.blueprints[index].numh) {
        plantBluePrint(state.blueprints[index]);
        closeAllDialogs();
        update();
      } else {
        var subdialog = createBlueprintDialog(state.blueprints[index], index);
        subdialog.onclose = bind(function(i, flex) {
          renderBlueprint(state.blueprints[i], flex, index);
        }, index, flex);
      }
    }, i, flex));
  }

  return dialog;
}
