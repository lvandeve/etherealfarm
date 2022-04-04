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

// opt_transcend: if true, use alternate background color to indicate it'll transcend with it
function renderBlueprint(b, ethereal, flex, opt_index, opt_transcend, opt_challenge) {
  flex.clear();
  flex.div.style.backgroundColor = ethereal ? '#aaf' : (opt_transcend ? (opt_challenge ? '#fbb' : '#ff7') : '#edc');

  if(!b) b = new BluePrint();
  var w = b.numw;
  var h = b.numh;

  var ratio = h ? (w / h) : 1;
  var grid = new Flex(flex, [0.5, 0, -0.5, ratio], [0.5, 0, -0.5, 1/ratio], [0.5, 0, 0.5,ratio], [0.5,0, 0.5, 1/ratio]);
  //var grid = new Flex(null, [0.5, 0, -0.5, ratio], [0.5, 0, -0.5, 1/ratio], [0.5, 0, 0.5,ratio], [0.5,0, 0.5, 1/ratio]);

  var images = [];

  for(var y = 0; y < h; y++) {
    images[y] = [];
    for(var x = 0; x < w; x++) {
      //var cell = new Flex(grid, x / w, y / h, (x + 1) / w, (y + 1) / h);
      var d = b.data[y][x];
      var c;
      if(ethereal) {
        var t = b.tier[y][x];
        c = crops2[BluePrint.toCrop2(d, t)];
      } else {
        c = crops[BluePrint.toCrop(d)];
      }
      if(c) {
        //var canvas = createCanvas('0%', '0%', '100%', '100%', cell.div);
        //renderImage(c.image[4], canvas);
        images[y][x] = c.image[4];
      } else {
        images[y][x] = undefined; // still fill in the array, to give it the correct width for renderImages
      }
    }
  }

  var canvas = createCanvas('0%', '0%', '100%', '100%', grid.div);
  renderImages(images, canvas);

  if(!b.numw || !b.numh) {
    centerText2(grid.div);
    grid.div.textEl.innerText = '[empty]';
    grid.div.textEl.style.color = '#000';
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

  //grid.attachTo(flex);
  flex.div.setAttribute('aria-description', name2 + ': ' + text);
}

// if allow_override is true, overrides all non-matching crops, but keeps matching ones there
// if allow_override is false, will not replace any existing crop on the field
function plantBluePrint(b, allow_override) {
  if(!b || b.numw == 0 || b.numh == 0) return;

  if(!canUseBluePrintsDuringChallenge(state.challenge, true)) return false;

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
  var did_something = false;
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f, d, fx, fy;
      if(single) {
        f = state.field[y][x];
        d = b.data[0][0];
        fx = x;
        fy = y;
      } else {
        fx = x - sx;
        fy = y - sy;
        if(fx < 0 || fy < 0 || fx >= state.numw || fy >= state.numh) continue;
        f = state.field[fy][fx];
        d = b.data[y][x];
      }
      var c = crops[BluePrint.toCrop(d)];
      var c2 = undefined;
      if(!c) continue;
      if(allow_override) {
        if(f.index != 0 && f.index != FIELD_REMAINDER) {
          c2 = f.getCrop();
          if(!c2) continue; // field has something, but not crop (e.g. tree), so continue
          if(c2.type == c.type) continue; // keep same types
        }
      } else {
        // don't overwrite anything that already exists on the field
        // that includes existing blueprint spots: if you want to combine blueprints, start from the smallest one, then bigger one to fill in the remaining gaps, not the opposite
        // reason: automaton may already start building up blueprint, so combining the opposite way (overwrite blueprint tiles) may not work due to already becoming real plants
        if(f.index != 0 && f.index != FIELD_REMAINDER) continue;
      }
      if(!state.crops[c.index].unlocked) continue;
      var action_type = !!c2 ? ACTION_REPLACE : ACTION_PLANT;
      addAction({type:action_type, x:fx, y:fy, crop:c, shiftPlanted:false, silent:true});
      did_something = true;
    }
  }
  if(did_something) showMessage('Planted blueprint');
  else showMessage('This blueprint had no effect on the current field');
}

// if allow_override is true, overrides all non-matching crops, but keeps matching ones there
// if allow_override is false, will not replace any existing crop on the field
// opt_get_tokens_cost_only: if true, returns the cost in ethereal delete tokens but doesn't do anything
function plantBluePrint2(b, allow_override, opt_get_tokens_cost_only) {
  if(!allow_override && opt_get_tokens_cost_only) return 0;
  if(!b || b.numw == 0 || b.numh == 0) return 0;

  // match up corners such that standard tree position overlap, in case field sizes are different
  // treex and treey are coordinates of the stem
  var treex0 = Math.floor((state.numw2 - 1) / 2);
  var treey0 = Math.floor(state.numh2 / 2);
  var treex1 = Math.floor((b.numw - 1) / 2);
  var treey1 = Math.floor(b.numh / 2);
  var sx = treex1 - treex0;
  var sy = treey1 - treey0;
  var w = b.numw;
  var h = b.numh;
  var single = false;
  if(w == 1 && h == 1) {
    w = state.numw2;
    h = state.numh2;
    single = true; // special case: 1x1 blueprint fills entire field
  }
  var did_something = false;
  var newactions = [];
  var tokens_cost = 0;
  var numjustplanted = 0;
  var squirrel_automaton_blocked = false;
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f, d, t, fx, fy;
      if(single) {
        f = state.field2[y][x];
        d = b.data[0][0];
        t = b.tier[0][0];
        fx = x;
        fy = y;
      } else {
        fx = x - sx;
        fy = y - sy;
        if(fx < 0 || fy < 0 || fx >= state.numw2 || fy >= state.numh2) continue;
        f = state.field2[fy][fx];
        d = b.data[y][x];
        t = b.tier[y][x];
      }
      var c = crops2[BluePrint.toCrop2(d, t)];
      var c2 = undefined;
      if(!c) continue;
      var squirrel_automaton = c.type == CROPTYPE_AUTOMATON || c.type == CROPTYPE_SQUIRREL;
      if(allow_override) {
        if(f.index != 0) {
          c2 = f.getCrop();
          if(!c2) continue; // field has something, but not crop (e.g. tree), so continue
          if(c2.index == c.index) continue;
          // can't override crop that was just planted this run
          if(c2 && f.justplanted && c2.isReal() && c2.type != CROPTYPE_AUTOMATON && c2.type != CROPTYPE_SQUIRREL && c2.type != c.type) {
            numjustplanted++;
            if(squirrel_automaton) squirrel_automaton_blocked = true;
            continue;
          }
        }
      } else {
        // don't overwrite anything that already exists on the field
        // that includes existing blueprint spots: if you want to combine blueprints, start from the smallest one, then bigger one to fill in the remaining gaps, not the opposite
        // reason: automaton may already start building up blueprint, so combining the opposite way (overwrite blueprint tiles) may not work due to already becoming real plants
        if(f.index != 0) continue;
      }
      if(!state.crops2[c.index].unlocked) continue;
      var action_type;
      if(!!c2) {
        action_type = ACTION_REPLACE2;
        if(!freeReplace2(x, y, c.index)) tokens_cost++;
      } else {
        action_type = ACTION_PLANT2;
      }
      var action_type = !!c2 ? ACTION_REPLACE2 : ACTION_PLANT2;
      if(!opt_get_tokens_cost_only) newactions.push({type:action_type, x:fx, y:fy, crop:c, shiftPlanted:false, silent:true, lowerifcantafford:true});
      did_something = true;
    }
  }
  if(opt_get_tokens_cost_only) return tokens_cost;
  if(tokens_cost > state.delete2tokens) {
    showMessage('not enough ethereal deletion tokens to use this blueprint, need ' + tokens_cost + ', have: ' + state.delete2tokens, C_INVALID, 0, 0);
    return tokens_cost;
  }
  if(squirrel_automaton_blocked) {
    // reason for not planting the blueprint if there are justplanted that blocked automaton or squirrel from the blueprint:
    // if most of the field is justplanted, the blueprint will have almost no effect, but it will have an effect on the existing squirrel and automaton (since those can always be deleted and overwritten), so it will change almost nothing except the squirrel and automaton, which will then be overplanted with a crop that now also can't be deleted
    // so then you have to continue the run without squirrel and automaton, which is not a good situation (all there bonuses are then disabled)
    // that's a trap, and most likely not wanted. So therefore, don't do it.
    showMessage('blueprint not planted, ethereal field has several just-planted crops, a transcension is needed before crops can be over-planted', C_INVALID, 0, 0);
    return tokens_cost;
  }
  if(did_something) {
    // sort the actions such that those that give back resin are first, to prevent situation where the new ethereal field can't be planted due to replacing crops while not enough resin
    // TODO: this sorting is very heuristic, do more exact
    var heuristiccost = function(c) {
      if(!c) return 0;
      if(!c.isReal()) return 0;
      if(c.type == CROPTYPE_AUTOMATON || c.type == CROPTYPE_SQUIRREL) return 1;
      if(c.type == CROPTYPE_LOTUS) return (1 + c.tier) * 1000;
      if(c.type == CROPTYPE_BEE) return 5 + c.tier;
      if(c.type == CROPTYPE_FLOWER) return 2 + c.tier;
      if(c.type == CROPTYPE_NETTLE) return 3 + c.tier * 2;
      return 1 + c.tier;
    };
    newactions.sort(function(a, b) {
      var fa = state.field2[a.y][a.x];
      var fb = state.field2[b.y][b.x];
      var ca0 = fa.getCrop();
      var cb0 = fb.getCrop();
      var ca1 = a.crop;
      var cb1 = b.crop;
      var costa = heuristiccost(ca1) - heuristiccost(ca0);
      var costb = heuristiccost(cb1) - heuristiccost(cb0);
      return costa - costb;
    });
    // separate out automaton/squirrel: otherwise there's risk the error "already have squirrel/automaton" appears
    for(var i = 0; i < newactions.length; i++) {
      var a = newactions[i];
      if(a.type != ACTION_REPLACE2) continue;
      var f = state.field2[a.y][a.x];
      var c = f.getCrop();
      if(!c) continue;
      if(c.type == CROPTYPE_AUTOMATON || c.type == CROPTYPE_SQUIRREL) {
        var delaction = {type:ACTION_DELETE2, x:a.x, y:a.y, shiftPlanted:false, silent:true};
        a.type = ACTION_PLANT2;
        addAction(delaction);
      }
    }
    for(var i = 0; i < newactions.length; i++) {
      addAction(newactions[i]);
    }
    showMessage('Planted ethereal blueprint');
  }
  else showMessage('This ethereal blueprint had no effect on the current field');
  return tokens_cost;
}

function blueprintFromField(b) {
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
}

function blueprintFromField2(b) {
  var w = state.numw2;
  var h = state.numh2;
  b.numw = w;
  b.numh = h;
  b.data = [];
  b.tier = [];
  for(var y = 0; y < h; y++) {
    b.data[y] = [];
    b.tier[y] = [];
    for(var x = 0; x < w; x++) {
      var f = state.field2[y][x];
      var c = f.getCrop();
      b.data[y][x] = BluePrint.fromCrop(f.getCrop());
      b.tier[y][x] = c ? c.tier : 0;
    }
  }
  sanitizeBluePrint(b);
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
  b.tier = [];
}

// include tiers is for ethereal blueprints to preserve the tiers rather than turn into templates
function createBluePrintText(b, opt_include_tiers) {
  var text = '';
  if(b) {
    var w = b.numw;
    var h = b.numh;
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        var c = BluePrint.toChar(b.data[y][x]);
        text += c;
        if(c != '.' && c != ' ' && opt_include_tiers && b.tier && b.tier[y]) {
          var t = b.tier[y][x];
          // -1 is template and does not get a numeric value
          if(t >= 0) {
            text += b.tier[y][x];
          }
        }
      }
      text += '\n';
    }
  }
  return text;
}

function exportBluePrint(b, ethereal, opt_include_tiers) {
  var text = createBluePrintText(b, ethereal && opt_include_tiers);
  showExportTextDialog('export blueprint', text, 'blueprint-' + util.formatDate(util.getTime(), true) + '.txt', false);
}

function getBluePrintTypeHelpText(ethereal) {
  var result = 'B=berry, M=mushroom, F=flower, N=nettle, H=beehive, I=mistletoe, W=watercress/brassica, ';
  if(state.crops[nut_0].unlocked) result += 'U=nuts, '; // nuts not available in ethereal (currently), but shown anyway for completeness
  if(ethereal) {
    result += 'F=fern, L=lotus, ';
    if(ethereal && state.crops2[automaton2_0].unlocked) result += 'A=automaton, ';
    if(state.crops2[squirrel2_0].unlocked) result += 'S=squirrel, ';
  }
  result += '.=empty/tree';
  return result;
}

function importBluePrintDialog(fun, b, ethereal) {
  var w = 500, h = 500;
  var dialog = createDialog(false, function(e) {
    var shift = e.shiftKey;
    var text = area.value;
    fun(text);
  }, 'import', undefined, 'cancel');
  var textFlex = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1);
  // TODO: this text is too long to get reasonable font size, move to a help dialog
  var text = 'Import blueprint. Case insensitive. ' + getBluePrintTypeHelpText(ethereal);
  textFlex.div.innerHTML = text;
  text += '.';
  var area = util.makeAbsElement('textarea', '1%', '15%', '98%', '70%', dialog.content.div);
  if(b) area.value = createBluePrintText(b, ethereal);
  area.select();
  area.focus();
}

function blueprintFromText(text, b, ethereal) {
  if(text == '') return;
  text = text.trim();
  var s = text.split('\n');
  var h = s.length;
  if(h < 1 || h > 11) return;
  var w = 0;
  var data = [];
  var tier = [];
  for(var y = 0; y < h; y++) {
    data[y] = [];
    tier[y] = [];
    var x = 0;
    var line = s[y];
    var pos = 0;
    while(pos < line.length) {
      data[y][x] = BluePrint.fromChar(line[pos++]);
      // parse potential tier number. This is only used for ethereaal case, but also parsed (and ignored) in non-ethereal case
      var num = '';
      while(pos < line.length && line.charCodeAt(pos) >= 48 && line.charCodeAt(pos) <= 57) {
        num += line[pos++];
      }
      if(ethereal) {
        var t = num == '' ? -1 : parseInt(num);
        tier[y][x] = t;
      }
      x++;
    }
    if(x > w) w = x;
  }
  if(w < 1) return;
  if(w > 11) return;
  for(var y = 0; y < h; y++) {
    for(var x = data[y].length; x < w; x++) {
      data[y][x] = 0;
      if(ethereal) tier[y][x] = 0;
    }
  }
  b.numw = w;
  b.numh = h;
  b.data = data;
  b.tier = tier;

/*  var w = 0;
  for(var i = 0; i < h; i++) w = Math.max(w, s[i].length);
  if(w < 1) return;
  if(w > 11) w = 11;
  b.numw = w;
  b.numh = h;
  b.data = [];
  if(ethereal) b.tier = [];
  for(var y = 0; y < h; y++) {
    b.data[y] = [];
    if(ethereal) b.tier[y] = [];
    for(var x = 0; x < w; x++) {
      b.data[y][x] = BluePrint.fromChar(s[y][x]);
      if(ethereal) b.tier[y][x] = (s[y][x] == 'S' || s[y][x] == 's' || s[y][x] == 'A' || s[y][x] == 'a') ? 0 : -1;
    }
  }*/
  sanitizeBluePrint(b);
}

// this is an extra layer of undo for the undo button on the blueprint editing dialog. Normally that button only does what you are currently doing while that dialog is open
// but this extra function here allows to also use it when re-opening the dialog, at least if no other edits were done yet
var lastpreundoblueprint = undefined;
var lastpreundoblueprintindex = -1;


function createBlueprintDialog(b, ethereal, opt_index, opt_onclose) {
  if(!automatonUnlocked()) return;

  var did_edit = false;

  var orig = b;
  b = BluePrint.copy(b);

  var okfun = function() {
    // this actually commits the change of the blueprint. This is the cancel function of the dialog: the only thing that does not commit it, is using undo.
    if(did_edit) {
      lastpreundoblueprint = BluePrint.copy(orig);
      lastpreundoblueprintindex = opt_index;
      BluePrint.copyTo(b, orig);
    }
  };

  var undofun = function() {
    if(did_edit) {
      b = BluePrint.copy(orig);
      renderBlueprint(b, ethereal, renderFlex, opt_index);
      did_edit = false;
    } else if(!!lastpreundoblueprint && lastpreundoblueprintindex == opt_index) {
      b = BluePrint.copy(lastpreundoblueprint);
      renderBlueprint(b, ethereal, renderFlex, opt_index);
      did_edit = true;
    }
    return true;
  };

  var dialog = createDialog(undefined, undofun, 'undo', okfun, 'ok', undefined, undefined, undefined, opt_onclose, undefined, undefined, undefined);

  var renderFlex = new Flex(dialog.content, [0, 0, 0.05], [0, 0, 0.05], [0, 0, 0.5], [0, 0, 0.5]);
  renderBlueprint(b, ethereal, renderFlex, opt_index);


  var y = 0.5;
  var addButton = function(text, fun, tooltip) {
    var h = 0.055;
    var button = new Flex(dialog.content, [0, 0, 0.05], y, [0.5, 0, 0.05], y + h).div;
    y += h * 1.1;
    styleButton(button);
    button.textEl.innerText = text;
    addButtonAction(button, fun);
    if(tooltip) registerTooltip(button, tooltip);
  };

  addButton('To field', function(e) {
    if(ethereal) plantBluePrint2(b, false);
    else plantBluePrint(b, false);
    BluePrint.copyTo(b, orig); // since this closes the dialog, remember it like the ok button does
    closeAllDialogs();
    update();
  }, 'Plant this blueprint on the field. Only empty spots of the field are overridden, existing crops will stay, even if their type differs.');

  var override_name = 'Override field';
  if(ethereal) {
    var num_tokens = plantBluePrint2(b, true, true);
    override_name = 'Override (' + num_tokens + ' tokens)';
  }

  addButton(override_name, function(e) {
    if(ethereal) plantBluePrint2(b, true);
    else plantBluePrint(b, true);
    BluePrint.copyTo(b, orig); // since this closes the dialog, remember it like the ok button does
    closeAllDialogs();
    update();
  }, 'Plant this blueprint on the field. Existing crops from the field are also deleted and overridden, if their type differs and the blueprint is non-empty at that spot.');

  addButton('From field', function() {
    if(ethereal) blueprintFromField2(b);
    else blueprintFromField(b);
    renderBlueprint(b, ethereal, renderFlex, opt_index);
    did_edit = true;
  }, 'Save the current field state into this blueprint. You can use the cancel button below to undo this.');

  addButton('To TXT', function(e) {
    // for now as a hidden feature (until better UI for this is implemented), holding shift exports the ethereal blueprint without the tier numbers
    exportBluePrint(b, ethereal, ethereal && !e.shiftKey);
  }, 'Export the blueprint to text format, for external storage and sharing');

  addButton('From TXT', function() {
    importBluePrintDialog(function(text) {
      blueprintFromText(text, b, ethereal);
      renderBlueprint(b, ethereal, renderFlex, opt_index);
      did_edit = true;
    }, b, ethereal);
  }, 'Import the blueprint from text format, as generated with To TXT. You can use the cancel button below to undo this.');

  addButton('Rename', function() {
    makeTextInput('Enter new blueprint name, or empty for default', function(name) {
      b.name = sanitizeName(name);
      renderBlueprint(b, ethereal, renderFlex, opt_index);
      did_edit = true;
    });
  }, 'Rename this blueprint. This name shows up in the main blueprint overview. You can use the cancel button below to undo this.');

  addButton('Delete blueprint', function() {
    b.numw = 0;
    b.numh = 0;
    b.data = [];
    b.name = '';
    renderBlueprint(b, ethereal, renderFlex, opt_index);
    did_edit = true;
  }, 'Delete this blueprint. You can use the cancel button below to undo this.');

  addButton('Help', function() {
    showBluePrintHelp();
  });

  return dialog;
}

function showBluePrintHelp() {
  var dialog = createDialog();

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Blueprint help';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1);
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
  text += ' • From text (TXT): Write a field layout on multiple lines of text using the following letters: ' + getBluePrintTypeHelpText() + '. Export TXT does the opposite.';
  text += '<br/><br/>';
  text += 'Keyboard shotcuts for blueprints:';
  text += '<br/>';
  text += 'Note: on mac, ctrl means command instead.';
  text += '<br/>';
  text += ' • "b": open the blueprint dialog';
  text += '<br/>';
  text += ' • "u": when mouse hovering over blueprint template: upgrade template to highest crop tier you can afford of that type';
  text += '<br/>';
  text += ' • shift + click blueprint in main blueprint dialog: plant it immediately rather than opening its editing dialog (if not empty)';
  text += '<br/>';
  text += ' • ctrl + click blueprint in main blueprint dialog: plant it immediately and override differing plants on the field';
  text += '<br/>';
  text += ' • shift + click "To Field" button of a blueprint: plant it immediately and override differing crops on the field';
  text += '<br/>';
  text += ' • "t", "b": open transcend dialog, and then open transcend-with-blueprint dialog';
  text += '<br/><br/>';
  text += 'Once automaton is advanced enough, it can also use blueprints.';

  div.innerHTML = text;
}

var blueprintdialogopen = false;

// opt_transcend: if true, then creates a blueprint dialog where if you click the blueprint, it transcends and plants that blueprint immediately, but that doesn't allow editing the blueprints
// opt_challenge: if opt_transcend is true and this has a challenge index, will transcent with blueprint with that challenge
// opt_ethereal: show blueprints for ethereal field instead
function createBlueprintsDialog(opt_transcend, opt_challenge, opt_ethereal) {
  if(!automatonUnlocked()) return;

  var challenge_button_name = undefined;
  var challenge_button_fun = undefined;
  if(opt_transcend && !opt_challenge) {
    challenge_button_name = 'challenges';
    if(state.untriedchallenges) challenge_button_name = 'challenges\n(new!)';
    challenge_button_fun = function(){
      createChallengeDialog();
    };
  }

  blueprintdialogopen = true;
  var dialog = createDialog(undefined, challenge_button_fun, challenge_button_name, undefined, 'back', undefined, undefined, undefined, function() {
    blueprintdialogopen = false;
  });


  var titleFlex = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1);
  centerText2(titleFlex.div);
  if(opt_transcend) {
    if(opt_challenge) {
      titleFlex.div.textEl.innerText = upper(challenges[opt_challenge].name) + ' with blueprint';
    } else {
      titleFlex.div.textEl.innerText = 'Transcend with blueprint';
    }
  } else {
    titleFlex.div.textEl.innerText = opt_ethereal ? 'Ethereal blueprint library' : 'Blueprint library';
  }

  //var bflex = new Flex(dialog.content, [0.01, 0, 0], [0.1, 0, 0], [0.01, 0, 0.98], [0.1, 0, 0.98]);
  var bflex = new Flex(null, [0.01, 0, 0], [0.1, 0, 0], [0.01, 0, 0.98], [0.1, 0, 0.98]);

  var blueprints = opt_ethereal ? state.blueprints2 : state.blueprints;

  for(var i = 0; i < 9; i++) {
    var x = i % 3;
    var y = Math.floor(i / 3);
    var flex = new Flex(bflex, 0.33 * (x + 0.05), 0.33 * (y + 0.05), 0.33 * (x + 0.95), 0.33 * (y + 0.95));
    renderBlueprint(blueprints[i], opt_ethereal, flex, i, opt_transcend, opt_challenge);
    styleButton0(flex.div, true);
    addButtonAction(flex.div, bind(function(index, flex, e) {
      for(var i = 0; i <= index; i++) {
        if(!blueprints[i]) blueprints[i] = new BluePrint();
      }
      var shift = util.eventHasShiftKey(e);
      var ctrl = util.eventHasCtrlKey(e);
      var filled = blueprints[index] && blueprints[index].numw && blueprints[index].numh;
      if(opt_transcend) {
        /*if(!state.allowshiftdelete) {
          showMessage('enable "shortcuts may delete crop" in the preferences before the shortcut to transcend and plant blueprint is allowed', C_INVALID);
        } else*/ if(state.treelevel < min_transcension_level && state.treelevel != 0 && !state.challenge) {
          showMessage('not high enough tree level to transcend (transcend with blueprint tries to transcend first, then plant the blueprint)', C_INVALID);
        } else {
          var new_challenge = opt_challenge || 0;
          if(state.challenge) {
            addAction({type:ACTION_TRANSCEND, challenge:new_challenge});
          } else {
            if(state.treelevel >= min_transcension_level) addAction({type:ACTION_TRANSCEND, challenge:new_challenge});
          }
          addAction({type:ACTION_PLANT_BLUEPRINT, blueprint:blueprints[index]});
          closeAllDialogs();
          update();
        }
      } else {
        if(shift && !ctrl && filled) {
          if(opt_ethereal) plantBluePrint2(blueprints[index], false);
          else plantBluePrint(blueprints[index], false);
          closeAllDialogs();
          update();
        } else if(!shift && ctrl && filled) {
          if(opt_ethereal) plantBluePrint2(blueprints[index], true);
          else plantBluePrint(blueprints[index], true);
          closeAllDialogs();
          update();
        } else if(shift && ctrl && filled) {
          if(!state.allowshiftdelete) {
            // do nothing: this is a deprecated shortcut, only visible with exact correct usage
            //showMessage('enable "shortcuts may delete crop" in the preferences before the shortcut to transcend and plant blueprint is allowed', C_INVALID);
          } else if(state.treelevel < min_transcension_level && state.treelevel != 0 && !state.challenge) {
            // do nothing: this is a deprecated shortcut, only visible with exact correct usage
            //showMessage('not high enough tree level to transcend (use shift+blueprint to just plant this blueprint)', C_INVALID);
          } else {
            // deprecated feature, but still supported for those who like its convenience of "b" + "ctrl+shift+click" (the alternative is: "t", "b", "click")
            if(state.treelevel >= min_transcension_level) {
              showMessage('Transcended and planted blueprint');
              addAction({type:ACTION_TRANSCEND, challenge:0});
            }
            addAction({type:ACTION_PLANT_BLUEPRINT, blueprint:blueprints[index]});
            closeAllDialogs();
            update();
          }
        } else {
          var closefun = bind(function(i, flex) {
            renderBlueprint(blueprints[i], opt_ethereal, flex, index);
          }, index, flex);
          var subdialog = createBlueprintDialog(blueprints[index], opt_ethereal, index, closefun);
        }
      }
    }, i, flex));
  }

  bflex.attachTo(dialog.content);

  return dialog;
}
