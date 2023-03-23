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

// opt_transcend: if true, use alternate background color to indicate it'll transcend with it
function renderBlueprint(b, ethereal, flex, opt_index, opt_transcend, opt_challenge, opt_indicate_shortcuts, opt_notitle) {
  flex.clear();
  flex.div.style.backgroundColor = ethereal ? '#aaf' : (opt_transcend ? (opt_challenge ? '#fbb' : '#ff7') : '#edc');

  if(!b) b = new BluePrint();
  var w = b.numw;
  var h = b.numh;

  var ratio = h ? (w / h) : 1;
  var grid = new Flex(flex, [0.5, 0, -0.5, ratio], [0.5, 0, -0.5, 1/ratio], [0.5, 0, 0.5,ratio], [0.5,0, 0.5, 1/ratio]);
  //var grid = new Flex(null, [0.5, 0, -0.5, ratio], [0.5, 0, -0.5, 1/ratio], [0.5, 0, 0.5,ratio], [0.5,0, 0.5, 1/ratio]);

  var images = [];

  var quad_images = [];

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
        if(c.quad) {
          if(w == 1 && h == 1) {
            images[y][x] = image_pumpkin_large_blueprintified;
          } else {
            var index = y * w + x;
            if(quad_images[index]) {
              images[y][x] = c.images_quad[quad_images[index]][4];
            } else {
              images[y][x] = c.images_quad[0][4];
              quad_images[index + 1] = 1;
              quad_images[index + w] = 2;
              quad_images[index + w + 1] = 3;
            }
          }
        }
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

  if(ethereal) {
    var cost0 = computeBlueprint2Cost(b, 0); // current field
    var cost1 = computeBlueprint2Cost(b, 1); // blueprint itself
    var cost2 = computeBlueprint2Cost(b, 2); // planting without override
    var cost3 = computeBlueprint2Cost(b, 3); // planting with override
    registerTooltip(canvas, function() {
      var text = '';
      text += 'Ethereal field resin value: ' + (cost0.empty() ? '0 resin' : cost0.toString());
      text += '<br>';
      text += 'Blueprint resin value: ' + (cost1.empty() ? '0 resin' : cost1.toString());
      text += '<br>';
      text += 'Plant resin cost: ' + (cost2.empty() ? '0 resin' : cost2.toString());
      text += '<br>';
      text += 'Override resin cost: ' + (cost3.empty() ? '0 resin' : cost3.toString());
      text += '<br>';
      text += '<br>';
      text += 'Currently have resin: ' + state.res.resin.toString();
      return text;
    });
  }

  if(!opt_notitle) {
    var nametext = '';
    if(name && opt_index != undefined && opt_indicate_shortcuts) {
      nametext = '[' + (opt_index + 1) + '] ' + name + ':';
    } else if(opt_index != undefined && opt_indicate_shortcuts) {
      nametext = '[' + (opt_index + 1) + ']:';
    } else if(name) {
      nametext = name + ':';
    }
    if(nametext) {
      var nameFlex = new Flex(flex, 0, -0.1, 1, 0);
      nameFlex.div.innerText = nametext;
    }
  }

  var name2 = 'blueprint';
  if(opt_index != undefined) name2 += ' ' + (opt_index + 1);
  if(b.name) name2 += ': ' + b.name;
  var text = createBluePrintText(b);

  //grid.attachTo(flex);
  flex.div.setAttribute('aria-description', name2 + ': ' + text);
}

// if allow_override is true, overrides all non-matching crops, but keeps matching ones there
// if allow_override is false, will not replace any existing crop on the field
// opt_by_automaton: indicate the plant actions as by_automaton, to circumvent fast_forwarding in game.js
function plantBluePrint(b, allow_override, opt_by_automaton) {
  if(!b || b.numw == 0 || b.numh == 0) return;
  if(!canUseBluePrintsDuringChallenge(state.challenge, true)) return false;

  var has_unplantable_pumpkin = false;

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
  var quad_skip = [];
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
      var index = fy * state.numw + fx;
      if(quad_skip[index]) continue;
      var c = crops[BluePrint.toCrop(d)];
      if(!c) continue;
      if(c.quad) {
        // The blueprint will contain 4 'U' symbols for the 2x2 pumpkin (or may have other symbols there, which will not work), but only the top left one must be planted
        quad_skip[index + 1] = quad_skip[index + state.numw] = quad_skip[index + state.numw + 1] = true;
        if(allow_override) {
          var f01 = state.field[fy][fx + 1];
          var f10 = state.field[fy + 1][fx];
          var f11 = state.field[fy + 1][fx + 1];
          if(f01.hasCrop(true) && f01.getMainMultiPiece() != f) addAction({type:ACTION_DELETE, x:(fx + 1), y:fy, silent:true, by_automaton:!!opt_by_automaton});
          if(f10.hasCrop(true) && f10.getMainMultiPiece() != f) addAction({type:ACTION_DELETE, x:fx, y:(fy + 1), silent:true, by_automaton:!!opt_by_automaton});
          if(f11.hasCrop(true) && f11.getMainMultiPiece() != f) addAction({type:ACTION_DELETE, x:(fx + 1), y:(fy + 1), silent:true, by_automaton:!!opt_by_automaton});
        }
      }
      if(c.type == CROPTYPE_PUMPKIN && !state.crops[pumpkin_template].unlocked) has_unplantable_pumpkin = true;
      var c2 = f.getCrop();
      if(c2 && c2.type == CROPTYPE_BRASSICA && c.type == CROPTYPE_BRASSICA) {
        // refresh brassica
        if(state.res.seeds.gtr(10000)) c = c2; // refresh existing brassica
        else if(f.growth > 0.25) continue; // extremely rare case where can't really afford brassica, and it's still young, then don't replace it with blueprint
      } else if(allow_override) {
        if(f.index != 0 && f.index != FIELD_REMAINDER) {
          c2 = f.getCrop(true);
          if(f.index != FIELD_MULTIPART) {
            if(!c2) continue; // field has something, but not crop (e.g. tree), so continue
            if(c2.index == c.index) continue;
            if(c2.type == c.type && !c2.isghost) continue; // keep same types
          }
        }
      } else {
        // don't overwrite anything that already exists on the field
        // that includes existing blueprint spots: if you want to combine blueprints, start from the smallest one, then bigger one to fill in the remaining gaps, not the opposite
        // reason: automaton may already start building up blueprint, so combining the opposite way (overwrite blueprint tiles) may not work due to already becoming real plants
        if(f.index != 0 && f.index != FIELD_REMAINDER && !(c2 && c2.isghost && c2.type == c.type)) continue;
      }
      if(!state.crops[c.index].unlocked) continue;
      if(!!c2 && f.index == FIELD_MULTIPART) {
        addAction({type:ACTION_DELETE, x:fx, y:fy, silent:true, by_automaton:!!opt_by_automaton});
        c2 = undefined; // cannot use ACTION_REPLACE if f was MULTIPART: the replacement crop would go to its top left main part instead of this intended location, so using delete followed by plant instead.
      }
      var action_type = !!c2 ? ACTION_REPLACE : ACTION_PLANT;
      addAction({type:action_type, x:fx, y:fy, crop:c, shiftPlanted:false, silent:true, by_automaton:!!opt_by_automaton});
      did_something = true;
    }
  }

  if(did_something) {
    showMessage('Planted blueprint' + (b.name ? (' "' + b.name + '"') : ''));
  } else {
    showMessage('This blueprint had no effect on the current field');
  }

  if(has_unplantable_pumpkin && holidayEventActive() != 4) {
    showMessage('Pumpkins can no longer be planted, the event finished', C_INVALID);
  }
}

// turns index into x,y coordinates of a rectangular spiral, counterclockwise around origin.
// Index 0 corresponds to the origin, and so on.
// If w and h are given, the origin must be at floor(w/2), floor(h/2)
// If w and h are not given, an unconstrained spiral is assumed
// Example pattern:
// 20 12 11 10  9 19
// 21 13  2  1  8 18
// 22 14  3  0  7 17
// 23 15  4  5  6 16
function getSpiralFromIndex(i, w, h) {
  if(i == 0) return [0, 0]; // center not supported by the code below
  if(i < 0) return [0, 0]; // error, but return something valid

  if(w != undefined && h != undefined) {
    if(i < 0 || i >= w * h) return [0, 0]; // error, but return something valid
    var dim = Math.min(w, h);
    var ox = Math.floor((dim - 1) / 2);
    var oy = Math.floor(dim / 2);
    var maxnum = dim * dim;
    if(i >= maxnum) {
      // beyond the true spiral square shaped area. Now everything alternates between two sides left/right, or top/bottom
      var j = i - maxnum;
      var jx = j % dim;
      var jy = Math.floor(j / dim);
      if(w > h) {
        var left = (dim & 1) == (jy & 1);
        if(left) {
          return [-(-ox - 1 - Math.floor(jy / 2)), oy - jx - ((dim & 1) ? 0 : 1)];
        } else {
          return [-(dim - ox + Math.floor(jy / 2)), jx - oy];
        }
      } else {
        var top = (dim & 1) != (jy & 1);
        if(top) {
          return [ox - jx, -oy - 1 - Math.floor(jy / 2)];
        } else {
          return [jx - ox - ((dim & 1) ? 0 : 1), dim - oy + Math.floor(jy / 2)];
        }
      }
    }
  }

  var r = Math.floor((Math.sqrt(i) - 1) / 2) + 1;
  var p = 4 * r * (r - 1);
  var a = (i - p) % (8 * r);
  var ax = a % (2 * r);
  var ay = Math.floor(a / (2 * r));
  switch(ay) {
    case 0: return [r - a, -r];
    case 1: return [-r, ax - r];
    case 2: return [ax - r, r];
    case 3: return [r, r - ax];
  }
}

// converts scanline x/y coordinates to spiral
function getSpiralXY(x, y, w, h) {
  var ox = w >> 1;
  var oy = h >> 1;

  var result = getSpiralFromIndex(y * w + x, w, h);

  result[0] += ox;
  result[1] += oy;

  return result;
}

// for ethereal field
// if allow_override is true, overrides all non-matching crops, but keeps matching ones there
// if allow_override is false, will not replace any existing crop on the field
// opt_by_automaton: indicate the plant actions as by_automaton, to circumvent fast_forwarding in game.js
function plantBluePrint2(b, allow_override, opt_by_automaton) {
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
  // 1x1 "single" case for basic field blueprint feature disabled for ethereal blueprints: otherwise can get stuck without automaton
  var newactions = [];

  // if the ethereal field freely allows deleting, then don't use the replace action, instead first delete everything that must be replaced, then plant everything from scratch
  // that is the most cost effective order to do things, it guarantees you get all resin back, before attempting to plant again
  // if candelete is false, then we can't do that and must use replace operations to do as much as possible that's still allowed (up-tiering, and gauranteeing to get squirrel and automaton)
  var candelete = true; // NOTE: ethereal field delete limitations are currently removed, so always can delete now. The other code path still exists for reference, or for in case it comes back.

  if(candelete) {
    var newactions_delete = [];
    var newactions_plant = [];
    for(var yo = 0; yo < h; yo++) {
      for(var xo = 0; xo < w; xo++) {
        var spiral = getSpiralXY(xo, yo, w, h);
        var x = spiral[0];
        var y = spiral[1];
        var fx = x - sx;
        var fy = y - sy;
        if(fx < 0 || fy < 0 || fx >= state.numw2 || fy >= state.numh2) continue;
        var f = state.field2[fy][fx];
        var d = b.data[y][x];
        var t = b.tier[y][x];
        var c2 = crops2[BluePrint.toCrop2(d, t)];
        if(!c2) continue;
        var c = f.getCrop();
        if(c) {
          if(c.index == c2.index) continue;
          if(!allow_override) {
            //if(c.type != c2.type) continue;
            //if(c.tier >= c2.tier) continue;
            continue; // if the above code to support increasing tier is used, computeBlueprint2Cost must be updated to take this into account. However, the above is disabled, override can already do this and when not using override one may intend to not tier-up crops either since the resin can only be spent on so many higher tier crops
          }
          // use delete and plant separately, not the replace action, to ensure all resources gotten back first.
          // even within same crop type when going tier down, you can't be sure the tier down isn't more expensive rather than less expensive than the original crop
          newactions_delete.push({type:ACTION_DELETE2, x:fx, y:fy, shiftPlanted:false, silent:true, by_automaton:!!opt_by_automaton});
          newactions_plant.push({type:ACTION_PLANT2, x:fx, y:fy, crop:c2, shiftPlanted:false, silent:true, lowerifcantafford:true, by_automaton:!!opt_by_automaton});
        } else {
          newactions_plant.push({type:ACTION_PLANT2, x:fx, y:fy, crop:c2, shiftPlanted:false, silent:true, lowerifcantafford:true, by_automaton:!!opt_by_automaton});
        }
      }
    }
    for(var i = 0; i < newactions_delete.length; i++) newactions.push(newactions_delete[i]);
    for(var i = 0; i < newactions_plant.length; i++) newactions.push(newactions_plant[i]);
  } else {
    var newactions_plant_replace = [];
    var newactions_automaton_squirrel = [];
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        var fx = x - sx;
        var fy = y - sy;
        if(fx < 0 || fy < 0 || fx >= state.numw2 || fy >= state.numh2) continue;
        var f = state.field2[fy][fx];
        var d = b.data[y][x];
        var t = b.tier[y][x];
        var c2 = crops2[BluePrint.toCrop2(d, t)];
        var c = undefined;
        if(!c2) continue;
        var squirrel_automaton = c2.type == CROPTYPE_AUTOMATON || c2.type == CROPTYPE_SQUIRREL || c2.type == CROPTYPE_MISTLETOE;
        if(allow_override) {
          if(f.index != 0) {
            c = f.getCrop();
            if(!c) continue; // field has something, but not crop (e.g. tree), so continue
            if(c.index == c2.index) continue;
          }
        } else {
          // don't overwrite anything that already exists on the field
          // that includes existing blueprint spots: if you want to combine blueprints, start from the smallest one, then bigger one to fill in the remaining gaps, not the opposite
          // reason: automaton may already start building up blueprint, so combining the opposite way (overwrite blueprint tiles) may not work due to already becoming real plants
          if(f.index != 0) continue;
        }
        if(!state.crops2[c2.index].unlocked) continue;
        var action_type;
        if(c) {
          action_type = ACTION_REPLACE2;
        } else {
          action_type = ACTION_PLANT2;
        }
        var action_type = c ? ACTION_REPLACE2 : ACTION_PLANT2;
        var array = squirrel_automaton ? newactions_automaton_squirrel : newactions_plant_replace;
        array.push({type:action_type, x:fx, y:fy, crop:c2, shiftPlanted:false, silent:true, lowerifcantafford:true, by_automaton:!!opt_by_automaton});
      }
      for(var i = 0; i < newactions_plant_replace.length; i++) newactions.push(newactions_plant_replace[i]);
      for(var i = 0; i < newactions_automaton_squirrel.length; i++) newactions.push(newactions_automaton_squirrel[i]);
    }
  }

  if(newactions.length) {
    for(var i = 0; i < newactions.length; i++) {
      addAction(newactions[i]);
    }
    showMessage('Planted ethereal blueprint' + (b.name ? (' "' + b.name + '"') : ''));
  }
  else showMessage('This ethereal blueprint had no effect on the current field');
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
      b.data[y][x] = BluePrint.fromCrop(f.getCrop(true));
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
  showExportTextDialog('Export blueprint', undefined, text, 'blueprint-' + util.formatDate(util.getTime(), true) + '.txt', false);
}

function getBluePrintTypeHelpText(ethereal) {
  var result = 'B=berry, M=mushroom, F=flower, S=stinging, Z=bee, I=mistletoe, W=brassica (watercress, ...), ';
  if(state.crops[nut_0].unlocked) result += 'N=nuts, '; // nuts not available in ethereal (currently), but shown anyway for completeness
  if(ethereal) {
    result += 'E=fern, L=lotus, ';
    if(ethereal && state.crops2[automaton2_0].unlocked) result += 'A=automaton, ';
    if(state.crops2[squirrel2_0].unlocked) result += 'Q=squirrel, ';
  }
  result += '.=empty/tree';
  return result;
}

function importBluePrintDialog(fun, b, ethereal) {
  var w = 500, h = 500;

  var dialog = createDialog({
    functions:function(e) {
      var shift = e.shiftKey;
      var text = area.value;
      fun(text);
    },
    names:'import',
    title:'Import blueprint'
  });

  var textFlex = dialog.content;
  // TODO: this text is too long to get reasonable font size, move to a help dialog
  var text = 'Letter meanings: ' + getBluePrintTypeHelpText(ethereal);
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
  // heuristic: if the first line contains whitespace, then remove the whitespace from all lines
  // there are cases where someone may import a blueprint that has whitespace in each line from a spreadsheet. In this case, it should all be stripped
  // in other cases, one may not have whitespace like that, but some whitespace in the center where the tree is due to not using the '.' character there. For this, it's assumed that this never happens on the first line
  // tabs are always removed, it's not likely those would get used instead of the '.'
  var strip_spaces = false;

  for(var y = 0; y < h; y++) {
    data[y] = [];
    tier[y] = [];
    var x = 0;
    var line = s[y];
    var pos = 0;
    while(pos < line.length) {
      var c = line[pos++];
      if(c == '\t') continue;
      if(c == ' ') {
        if(y == 0) strip_spaces = true; // see the heuristic described above
        if(strip_spaces) continue;
      }
      data[y][x] = BluePrint.fromChar(c);
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
      update();
      did_edit = false;
    } else if(!!lastpreundoblueprint && lastpreundoblueprintindex == opt_index) {
      b = BluePrint.copy(lastpreundoblueprint);
      update();
      did_edit = true;
    }
    return true;
  };


  var shortcutfun = function(e) {
    var keys = getEventKeys(e);

    var key = keys.key;

    if(key == 'f' && !keys.shift && !keys.ctrl) {
      if(ethereal) blueprintFromField2(b);
      else blueprintFromField(b);
      update();
      did_edit = true;
      //closeAllDialogs();
    }

    if(e.key == 'Enter' && !keys.shift && !keys.ctrl) {
      if(ethereal) plantBluePrint2(b, true);
      else plantBluePrint(b, true);
      BluePrint.copyTo(b, orig); // since this closes the dialog, remember it like the ok button does
      closeAllDialogs();
      update();
    }
  };

  var dialog = createDialog({
    functions:undofun,
    names:'undo',
    oncancel:okfun,
    cancelname:'ok',
    title:'Blueprint', // will be updated with update()
    onclose:opt_onclose,
    help:showBluePrintHelp,
    shortcutfun:shortcutfun
  });

  var renderFlex = new Flex(dialog.content, [0, 0, 0.25], 0, [0, 0, 0.75], [0, 0, 0.5]);
  renderBlueprint(b, ethereal, renderFlex, opt_index, undefined, undefined, undefined, true);

  var plant_button;
  var override_button;
  var value_indicator;

  var update = function() {
    renderBlueprint(b, ethereal, renderFlex, opt_index, undefined, undefined, undefined, true);
    var title = b.name;
    if(!title) title = ethereal ? 'Ethereal blueprint' : 'Blueprint';
    dialog.titleEl.innerText = title;

    if(ethereal) {
      var coststring;

      var tofieldtext = 'To field';
      var cost = computeBlueprint2Cost(b, 2);
      coststring = cost.empty() ? '0 resin' : cost.toString();
      tofieldtext += ' (' + coststring + ')';

      var overridetext = 'Override field';
      var overridecost = computeBlueprint2Cost(b, 3);
      coststring = overridecost.empty() ? '0 resin' : overridecost.toString();
      overridetext += ' (' + coststring + ')';

      plant_button.textEl.innerText = tofieldtext;
      override_button.textEl.innerText = overridetext;

      var maincost = computeBlueprint2Cost(b, 1);
      value_indicator.div.innerText = 'Total value: ' + maincost.toString();
    }
  };

  var y = 0.51;

  if(ethereal) {
    var h = 0.055;
    value_indicator = new Flex(dialog.content, [0, 0, 0.25], [0, 0, y], [0, 0, 0.75], [0, 0, y + h]);
    y += h;
  }

  var addButton = function(text, fun, tooltip) {
    var h = 0.055;
    var button = new Flex(dialog.content, [0, 0, 0.25], [0, 0, y], [0, 0, 0.75], [0, 0, y + h]).div;
    y += h * 1.1;
    styleButton(button);
    button.textEl.innerText = text;
    addButtonAction(button, fun);
    if(tooltip) registerTooltip(button, tooltip);
    return button;
  };

  plant_button = addButton('To field', function(e) {
    if(ethereal) plantBluePrint2(b, false);
    else plantBluePrint(b, false);
    BluePrint.copyTo(b, orig); // since this closes the dialog, remember it like the ok button does
    closeAllDialogs();
    update();
  }, 'Plant this blueprint on the field. Only empty spots of the field are overridden, existing crops will stay, even if their type differs.');

  override_button = addButton('Override field', function(e) {
    if(ethereal) plantBluePrint2(b, true);
    else plantBluePrint(b, true);
    BluePrint.copyTo(b, orig); // since this closes the dialog, remember it like the ok button does
    closeAllDialogs();
    update();
  }, 'Plant this blueprint on the field. Existing crops from the field are also deleted and overridden, if their type differs and the blueprint is non-empty at that spot.');

  addButton('From field', function() {
    if(ethereal) blueprintFromField2(b);
    else blueprintFromField(b);
    update();
    did_edit = true;
  }, 'Save the current field state into this blueprint. You can use the cancel button below to undo this.');

  addButton('To TXT', function(e) {
    // for now as a hidden feature (until better UI for this is implemented), holding shift exports the ethereal blueprint without the tier numbers
    exportBluePrint(b, ethereal, ethereal && !e.shiftKey);
  }, 'Export the blueprint to text format, for external storage and sharing');

  addButton('From TXT', function() {
    importBluePrintDialog(function(text) {
      blueprintFromText(text, b, ethereal);
      update();
      did_edit = true;
    }, b, ethereal);
  }, 'Import the blueprint from text format, as generated with To TXT. You can use the cancel button below to undo this.');

  addButton('Rename', function() {
    makeTextInput('Rename blueprint', 'Enter new blueprint name, or empty for default', function(name) {
      b.name = sanitizeName(name);
      update();
      did_edit = true;
    }, b.name);
  }, 'Rename this blueprint. This name shows up in the main blueprint overview. You can use the cancel button below to undo this.');

  addButton('Delete blueprint', function() {
    b.numw = 0;
    b.numh = 0;
    b.data = [];
    b.name = '';
    update();
    did_edit = true;
  }, 'Delete this blueprint. You can use the cancel button below to undo this.');

  update();

  return dialog;
}

function showBluePrintHelp() {
  var dialog = createDialog({title:'Blueprint help', scrollable:true});

  var div = dialog.content.div;

  var text = '';

  text += 'Blueprints allow planting a whole field layout at once, and storing layouts';
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
  text += ' • From text (TXT): Write a field layout on multiple lines of text using letter symbols (B for berry, ...). Export TXT does the opposite.';
  text += '<br/><br/>';
  text += 'Keyboard shotcuts for blueprints:';
  text += '<br/>';
  text += 'Note: on mac, ctrl means command instead.';
  text += '<br/>';
  text += ' • "b": open the blueprint dialog (from field, or from ethereal field)';
  text += '<br/>';
  text += ' • shift + click blueprint in main blueprint dialog: plant it immediately, and overriding existing field crops, rather than opening its editing dialog (if not empty)';
  text += '<br/>';
  text += ' • "t", "b": open transcend dialog, and then open transcend-with-blueprint dialog';
  text += '<br/>';
  text += ' • "1-9" in blueprint selection dialog: shortcuts to open or use this blueprint';
  text += '<br/>';
  text += ' • "shift 1-9" in blueprint selection dialog: override field with this blueprint (shift key not necessary in transcend-with-blueprint dialog)';
  text += '<br/>';
  text += ' • "f" in blueprint editing dialog: set blueprint from fuild';
  text += '<br/>';
  text += ' • "Enter" in blueprint editing dialog: override field with blueprint';
  text += '<br/>';
  text += ' • "u": when mouse hovering over blueprint template: upgrade template to highest crop tier you can afford of that type';
  text += '<br/><br/>';
  text += 'Once automaton is advanced enough, it can also use blueprints.';

  div.innerHTML = text;
}


function blueprintClickFun(opt_transcend, opt_challenge, opt_ethereal, opt_custom_fun, index, flex, shift, ctrl) {
  if(opt_custom_fun) {
    opt_custom_fun(index);
    closeTopDialog(); // the blueprint dialog
    return;
  }

  var blueprints = opt_ethereal ? state.blueprints2 : state.blueprints;

  for(var i = 0; i <= index; i++) {
    if(!blueprints[i]) blueprints[i] = new BluePrint();
  }
  var filled = blueprints[index] && blueprints[index].numw && blueprints[index].numh;
  if(opt_transcend) {
    if(state.treelevel < min_transcension_level && state.treelevel != 0 && !state.challenge) {
      showMessage('not high enough tree level to transcend (transcend with blueprint tries to transcend first, then plant the blueprint)', C_INVALID);
    } else {
      var new_challenge = opt_challenge || 0;
      if(state.challenge) {
        addAction({type:ACTION_TRANSCEND, challenge:new_challenge});
      } else {
        if(state.treelevel >= min_transcension_level) addAction({type:ACTION_TRANSCEND, challenge:new_challenge});
      }
      addAction({type:ACTION_PLANT_BLUEPRINT_AFTER_TRANSCEND, blueprint:blueprints[index]});
      closeAllDialogs();
      update();
    }
  } else {
    // ctrl click is deprecated, replaced with shift click now, ctrl only available for old saves to keep the muscle memory
    if(((shift && !ctrl) || (!shift && ctrl && state.g_starttime < 1650240000)) && filled) {
      if(opt_ethereal) plantBluePrint2(blueprints[index], true);
      else plantBluePrint(blueprints[index], true);
      closeAllDialogs();
      update();
    } else if(shift && ctrl && filled) {
      if(state.g_starttime > 1640995200) {
        // do nothing: this is a deprecated shortcut, only visible with exact correct usage and old enough saves
        //showMessage('enable "shortcuts may delete crop" in the preferences before the shortcut to transcend and plant blueprint is allowed', C_INVALID);
      } else if(state.treelevel < min_transcension_level && state.treelevel != 0 && !state.challenge) {
        // do nothing: this is a deprecated shortcut, only visible with exact correct usage
        //showMessage('not high enough tree level to transcend (use shift+blueprint to just plant this blueprint)', C_INVALID);
      } else if(opt_ethereal) {
        // do nothing: this only works in basic field
      } else {
        // deprecated feature, but still supported for those who like its convenience of "b" + "ctrl+shift+click" (the alternative is: "t", "b", "click")
        if(state.treelevel >= min_transcension_level) {
          showMessage('Transcended and planted blueprint');
          addAction({type:ACTION_TRANSCEND, challenge:0});
        }
        addAction({type:ACTION_PLANT_BLUEPRINT_AFTER_TRANSCEND, blueprint:blueprints[index]});
        closeAllDialogs();
        update();
      }
    } else {
      var closefun = bind(function(i, flex) {
        renderBlueprint(blueprints[i], opt_ethereal, flex, index, opt_transcend, opt_challenge, true);
      }, index, flex);
      var subdialog = createBlueprintDialog(blueprints[index], opt_ethereal, index, closefun);
    }
  }
}

function swapBlueprintPages(opt_ethereal) {
  var blueprints = opt_ethereal ? state.blueprints2 : state.blueprints;
  for(var i = 0; i < 9; i++) {
    var b = blueprints[i];
    blueprints[i] = blueprints[i + 9];
    blueprints[i + 9] = b;
  }
}


var blueprintdialogopen = false;

// TODO: persist these in the state
var blueprintpage1 = 0;
var blueprintpage2 = 0;

// opt_transcend: if true, then creates a blueprint dialog where if you click the blueprint, it transcends and plants that blueprint immediately, but that doesn't allow editing the blueprints
// opt_challenge: if opt_transcend is true and this has a challenge index, will transcent with blueprint with that challenge
// opt_ethereal: show blueprints for ethereal field instead
// opt_custom_fun: if defined, then opt_transcend and opt_challenge are ignored, no built-in action will be taken and instead opt_custom_fun will be executed with the blueprint index
function createBlueprintsDialog(opt_transcend, opt_challenge, opt_ethereal, opt_custom_fun) {
  if(!automatonUnlocked()) return;

  var blueprintpage = opt_ethereal ? blueprintpage2 : blueprintpage1;

  var flexes = [];

  var challenge_button_name = undefined;
  var challenge_button_fun = undefined;
  var swap_button_name = undefined;
  var swap_button_fun = undefined;
  var swap_button_tooltip = undefined;
  if(opt_transcend && !opt_challenge) {
    challenge_button_name = 'challenges';
    if(state.untriedchallenges) challenge_button_name = 'challenges\n(new!)';
    challenge_button_fun = function(){
      createChallengeDialog();
    };
  }

  // don't have both challenge and swap pages buttons: there's not enough space below the dialog for that many
  if(!challenge_button_name) {
    swap_button_name = 'swap pages';
    swap_button_fun = function() {
      swapBlueprintPages(opt_ethereal);

      closeTopDialog();
      createBlueprintsDialog(opt_transcend, opt_challenge, opt_ethereal, opt_custom_fun);
      return true; // don't close dialog from this function, it's recreated (to re-render) using the above instead
    };
    swap_button_tooltip = 'Swaps the contents of the two blueprint pages. This affects automaton configuration referring to blueprints, since it refers to blueprints by number.';
  }

  var shortcutfun = function(e) {
    var keys = getEventKeys(e);

    var key = keys.key;
    if(key == 'p' /*|| key == '0'*/) {
      if(opt_ethereal) {
        blueprintpage2 = !blueprintpage2;
        blueprintpage = blueprintpage2;
      } else {
        blueprintpage1 = !blueprintpage1;
        blueprintpage = blueprintpage1;
      }
      closeTopDialog();
      createBlueprintsDialog(opt_transcend, opt_challenge, opt_ethereal, opt_custom_fun);
    }

    var index = -1;
    if(key == '1') index = 1;
    if(key == '2') index = 2;
    if(key == '3') index = 3;
    if(key == '4') index = 4;
    if(key == '5') index = 5;
    if(key == '6') index = 6;
    if(key == '7') index = 7;
    if(key == '8') index = 8;
    if(key == '9') index = 9;
    if(index < 0) return;
    index--; // make 0-index based
    var ui_index = index;
    if(blueprintpage) index += 9;
    var shift = util.eventHasShiftKey(e);
    var ctrl = util.eventHasCtrlKey(e);
    blueprintClickFun(opt_transcend, opt_challenge, opt_ethereal, opt_custom_fun, index, flexes[ui_index], shift, ctrl);
  };

  var title;
  if(opt_transcend) {
    if(opt_challenge) {
      title = upper(challenges[opt_challenge].name) + ' with blueprint';
    } else {
      title = 'Transcend with blueprint';
    }
  } else {
    title = opt_ethereal ? 'Ethereal blueprint library' : 'Blueprint library';
  }

  blueprintdialogopen = true;
  var dialog = createDialog({
    cancelname:(opt_custom_fun ? 'cancel' : 'back'),
    title:title,
    shortcutfun:shortcutfun,
    help:showBluePrintHelp,
    functions:[function() {
      if(opt_ethereal) {
        blueprintpage2 = !blueprintpage2;
        blueprintpage = blueprintpage2;
      } else {
        blueprintpage1 = !blueprintpage1;
        blueprintpage = blueprintpage1;
      }
      closeTopDialog();
      createBlueprintsDialog(opt_transcend, opt_challenge, opt_ethereal, opt_custom_fun);
      return true; // indicate "keep", otherwise it tries to close itself once more as button functions do by default
    }, challenge_button_fun || swap_button_fun],
    names:[(blueprintpage ? 'page 1' : 'page 2'), challenge_button_name || swap_button_name],
    tooltips:[undefined, challenge_button_fun ? undefined : swap_button_tooltip],
    onclose:function() {
      blueprintdialogopen = false;
    }});



  //var bflex = new Flex(dialog.content, [0.01, 0, 0], [0.1, 0, 0], [0.01, 0, 0.98], [0.1, 0, 0.98]);
  var bflex = new Flex(dialog.content, 0, 0, 1, 1);

  var blueprints = opt_ethereal ? state.blueprints2 : state.blueprints;

  for(var i = 0; i < 9; i++) {
    var j = i;
    if(blueprintpage) j += 9;
    var x = i % 3;
    var y = Math.floor(i / 3);
    var flex = new Flex(bflex, 0.33 * (x + 0.05), 0.33 * (y + 0.05), 0.33 * (x + 0.95), 0.33 * (y + 0.95));
    flexes[i] = flex;
    renderBlueprint(blueprints[j], opt_ethereal, flex, j, opt_transcend, opt_challenge, true);
    styleButton0(flex.div, true);
    /*addButtonAction(flex.div, bind(function(index, flex, e) {
      var shift = util.eventHasShiftKey(e);
      var ctrl = util.eventHasCtrlKey(e);
      return blueprintClickFun(opt_transcend, opt_challenge, opt_ethereal, opt_custom_fun, index, flex, shift, ctrl);
    }, j, flex));*/
    registerAction(flex.div, bind(function(index, flex, shift, ctrl) {
      return blueprintClickFun(opt_transcend, opt_challenge, opt_ethereal, opt_custom_fun, index, flex, shift, ctrl);
    }, j, flex), 'edit blueprint ' + (j + 1), {label_shift:'override field now'});
  }

  bflex.attachTo(dialog.content);

  return dialog;
}

// type:
//   0: computes the cost of the current field rather than the blueprint cost
//   1: resin cost of the blueprint if it were planted from scratch, with no existint ethereal crops already planted
//   2: when planting the blueprint without override
//   3: when planting the blueprint with override
// does not take into account the case when ethereal deletion is not possible
function computeBlueprint2Cost(b, type) {
  var result = Res();

  if(type == 0) return computeField2Cost();

  if(!b || b.numw == 0 || b.numh == 0) return result;

  var treex0 = Math.floor((state.numw2 - 1) / 2);
  var treey0 = Math.floor(state.numh2 / 2);
  var treex1 = Math.floor((b.numw - 1) / 2);
  var treey1 = Math.floor(b.numh / 2);
  var sx = treex1 - treex0;
  var sy = treey1 - treey0;

  var counts = {};

  if(type == 3) { // override
    var w = state.numw2;
    var h = state.numh2;
    for(var fy = 0; fy < h; fy++) {
      for(var fx = 0; fx < w; fx++) {
        var x = fx + sx;
        var y = fy + sy;
        var inblueprint = x >= 0 && y >= 0 && x < b.numw && y < b.numh;
        var c2 = undefined;
        if(inblueprint) {
          var d = b.data[y][x];
          var t = b.tier[y][x];
          c2 = crops2[BluePrint.toCrop2(d, t)];
        }
        var f = state.field2[fy][fx];
        if(f.index == FIELD_TREE_BOTTOM || f.index == FIELD_TREE_TOP) continue;
        var c = f.getCrop();
        // for override, take into account the existing field crop if it exists and will not be overridden due to empty spot in the blueprint
        if(!c2) c2 = c;
        if(!c2) continue;
        var count = counts[c2.index] || 0;
        counts[c2.index] = count + 1;
        result.addInPlace(c2.getCost(undefined, count));
      }
    }
    var orig = computeField2Cost();
    result.subInPlace(orig);
  } else {
    var w = b.numw;
    var h = b.numh;
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        var fx = x - sx;
        var fy = y - sy;
        if(fx < 0 || fy < 0 || fx >= state.numw2 || fy >= state.numh2) continue;
        var d = b.data[y][x];
        var t = b.tier[y][x];
        var c2 = crops2[BluePrint.toCrop2(d, t)];
        if(!c2) continue;
        var f = state.field2[fy][fx];
        if(f.index == FIELD_TREE_BOTTOM || f.index == FIELD_TREE_TOP) continue;
        if(type == 2 && f.index != 0) continue;
        var count = counts[c2.index] || 0;
        counts[c2.index] = count + 1;
        if(type == 2) count += state.crop2count[c2.index];
        result.addInPlace(c2.getCost(undefined, count));
      }
    }
  }

  return result;
}



