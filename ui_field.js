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


var fieldDivs;

var lastPlanted = -1; // for shift key

function createTranscendDialog() {
  var dialog = createDialog(false, function(e) {
      showMessage('Transcended');
      softReset();
      closeAllDialogs();
      update();
  }, 'transcend', 'cancel');

  dialog.div.style.backgroundColor = '#ff9';

  var tlevel = Math.floor(state.treelevel / min_transcension_level);
  var roman = tlevel > 1 ? (' ' + util.toRoman(tlevel)) : '';
  var tlevel_mul = Num(tlevel);

  var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [1, -0.01], 0.75, 0.3);
  var text = '<b>Transcension' + roman + '</b><br/>';
  text += '<br/>';
  if(tlevel > 1) {
    text += 'Higher transcensions work like transcension but give extra resin multiplier.<br/>';
  } else {
    text += 'Transcension starts a new basic field. Your first transcension also unlocks an ethereal field. On this field you can plant ethereal crops with resin. These unlock ethereal upgrades that improve your basic field in a more permanent way.<br/>';
  }
  text += '<br/>';
  if(tlevel > 1) {
    text += 'Collected resin: ' + state.resin.toString() + '<br/>';
    text += 'Resin bonus for Transcension ' + roman + ': ' + tlevel_mul.toString() + 'x<br/>';
  }
  var actual_resin = state.resin.mul(tlevel_mul);
  text += 'You will get ' + actual_resin.toString() + ' resin from your tree level ' + state.treelevel + '<br/>';
  text += '<br/>';
  text += 'What will be reset:<br/>';
  text += '• Basic field with all crops<br/>';
  text += '• Basic upgrades<br/>';
  text += '• Basic resources: seeds, spores<br/>';
  text += '• Tree level<br/>';
  text += '<br/>';
  text += 'What will be kept:<br/>';
  text += '• Achievements<br/>';
  text += '• Resin<br/>';
  text += '• Ethereal field and ethereal crops<br/>';
  text += '• Ethereal upgrades<br/>';
  text += '• Current season<br/>';
  text += '<br/><br/>';
  text += 'Please note: the transcension aspect of this game is still under development and is a temporary demo only. Currently the main run of the game is still being balanced, when that is done the content of transcension will be fully developed.<br/>';

  flex.div.innerHTML = text;
}

// works both if it's a breakdown of numbers or of resources
// percent will multiply by 100 and show percentage, this only makes sense for numbers
function formatBreakdown(breakdown, percent, title) {
  var result = '';
  result += '<br/>' + title + ':<br/>';
  for(var i = 0; i < breakdown.length; i++) {
    result += '• ' + breakdown[i][0];
    if(i > 0) result += ': ' + (breakdown[i][1].subr(1).mulr(100)).toString() + '%'; // first is base production
    result += (i == 0) ? ': ' : ' ⇒ ';
    if(percent) {
      result += breakdown[i][2].mulr(100).toString() + '%<br/>';
    } else {
      result += breakdown[i][2].toString() + '<br/>';
    }
  }
  return result;
}

// get crop info in HTML
function getCropInfoHTMLBreakdown(f, c) {
  var result = '';

  if(f.growth >= 1) {
    var prod = c.getProd(f);
    if(!prod.empty()) {
      var breakdown = c.getProd(f, true);
      result += formatBreakdown(breakdown, false, 'Breakdown (production/s)');
    }
    if(c.boost.neqr(0)) {
      var breakdown = c.getBoost(true);
      result += formatBreakdown(breakdown, true, 'Breakdown (neighboor boost +%)');
    }
  }

  return result;
}

// get crop info in HTML
function getCropInfoHTML(f, c) {
  var result = util.upperCaseFirstWord(c.name);
  result += '<br/>';

  if(f.growth < 1) {
    result += 'Growing. Time to grow left: ' + util.formatDuration((1 - f.growth) * c.planttime, true, 4, true);
  } else {
    var prod = c.getProd(f);
    if(!prod.empty()) {
      result += 'Production per second: ' + prod.toString() + '<br/>';
      if(prod.hasNeg()) result += 'Consumes a resource produced by other crops, so the above may be the hypothetical amount if there is overconsumption.<br/>';
    }
    if(c.boost.neqr(0)) {
      if(c.type == CROPTYPE_NETTLE) {
        result += 'Boosting neighbor mushrooms spores ' + (c.getBoost().mulr(100).toString()) + '%, but has negative effect on neighboring berries so don\'t touch berries with this plant!<br/>';
      } else {
        result += 'Boosting neighbors: ' + (c.getBoost().mulr(100).toString()) + '%<br/>';
      }
    }
  }

  result += '<br/>Base planting cost: ' + c.cost.toString();
  result += '<br/>Num planted of this type: ' + state.cropcount[c.index];
  result += '<br/>Current planting cost: ' + c.getCost().toString();
  result += '<br/>Recoup on delete: ' + c.getCost(-1).mulr(cropRecoup).toString();

  return result;
}

function makeFieldDialog(x, y) {
  var f = state.field[y][x];
  var fd = fieldDivs[y][x];


  if(f.index >= CROPINDEX) {
    var c = crops[f.index - CROPINDEX];
    var div;

    var dialog = createDialog();
    dialog.div.style.backgroundColor = '#efec'; // slightly translucent to see resources through it
    var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [0, 0.2], [0, 0.2], 0.3);
    var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(c.image[4], canvas);

    var flex0 = new Flex(dialog, [0.01, 0.2], [0, 0.01], 1, 0.17, 0.3);
    var button0 = new Flex(dialog, [0.01, 0.2], [0.2, 0.01], 0.5, 0.25, 0.8).div;
    var button1 = new Flex(dialog, [0.01, 0.2], [0.27, 0.01], 0.5, 0.32, 0.8).div;
    var flex1 = new Flex(dialog, [0.01, 0.2], [0.33, 0.01], 1, 0.9, 0.3);
    var last0 = undefined;
    var last1 = undefined;

    styleButton(button0);
    button0.textEl.innerText = 'delete';
    registerTooltip(button0, 'Delete crop and get some of its cost back.');
    button0.onclick = function() {
      actions.push({type:ACTION_DELETE, x:x, y:y});
      dialog.cancelFun();
      update(); // do update immediately rather than wait for tick, for faster feeling response time
    };

    styleButton(button1);
    button1.textEl.innerText = 'see crop types';
    registerTooltip(button1, 'Show the crop dialog with unlocked plants.');
    button1.onclick = function() {
      makePlantDialog(undefined, undefined);
    };

    updatedialogfun = bind(function(f, c, flex) {
      var html0 = getCropInfoHTML(f, c);
      var html1 = getCropInfoHTMLBreakdown(f, c);
      if(html0 != last0 || html1 != last1) {
        flex0.div.innerHTML = html0;
        flex1.div.innerHTML = html1;
        last0 = html0;
        last1 = html1;
      }
    }, f, c);

    updatedialogfun(f, c);

  } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
    var c = crops[f.index - CROPINDEX];
    var div;

    var dialog = createDialog();
    dialog.div.style.backgroundColor = '#fedc'; // slightly translucent to see resources through it
    var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [0, 0.2], [0, 0.2], 0.3);
    var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(tree_images[treeLevelIndex(state.treelevel)][1][getSeason()], canvas);
    flex = new Flex(dialog, [0, 0.01], [0, 0.199], [0, 0.2], [0, 0.4], 0.3);
    canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(tree_images[treeLevelIndex(state.treelevel)][2][getSeason()], canvas);

    var ypos = 0;
    var ysize = 0.1;

    var f0 = new Flex(dialog, [0.01, 0.2], [0, 0.01], 1, 0.25, 0.3);
    var f1 = new Flex(dialog, [0.01, 0.2], 0.4, 1, 0.75, 0.3);
    var text;

    text = '<b>' + util.upperCaseFirstWord(tree_images[treeLevelIndex(state.treelevel)][0]) + '</b><br/>';
    text += 'Tree level: ' + state.treelevel + '<br/>';
    if(state.treelevel == 0) {
      text += 'This tree needs to be rejuvenated first.<br/>';
      f0.div.innerHTML = text;
    } else {
      text += '<br/>';
      text += 'Next level requires: ' + treeLevelReq(state.treelevel + 1).toString() + '<br/>';

      var tlevel = Math.floor(state.treelevel / min_transcension_level);
      var roman = tlevel > 1 ? (' ' + util.toRoman(tlevel)) : '';
      var tlevel_mul = Num(tlevel);

      text += '<br/>';
      text += 'Resin ready: ' + state.resin.toString() + '<br/>';
      text += 'Resin added at next tree level: ' + treeLevelResin(state.treelevel + 1).toString() + '<br/>';
      if(tlevel > 1) {
        text += 'Resin bonus for Transcension ' + roman + ': ' + tlevel_mul.toString() + 'x<br/>';
      }

      text += '<br/>';
      text += 'Tree level production boost to crops: ' + (100 * treeboost * state.treelevel) + '%' + '<br>';

      if(state.upgrades[upgrade_fogunlock].unlocked || state.upgrades[upgrade_sununlock].unlocked || state.upgrades[upgrade_rainbowunlock].unlocked) {
        text += '<br/>';
        text += 'Abilities discovered:<br>';
        if(state.upgrades[upgrade_fogunlock].unlocked) text += '• Fog: benefits mushrooms when active<br>';
        if(state.upgrades[upgrade_sununlock].unlocked) text += '• Sun: benefits berries when active<br>';
        if(state.upgrades[upgrade_rainbowunlock].unlocked) text += '• Rainbow: benefits flowers when active<br>';
      }

      f0.div.innerHTML = text;

      if(state.treelevel < min_transcension_level) {
        if(state.treelevel >= min_transcension_level - 1) f1.div.innerText = 'Reach tree level ' + min_transcension_level + ' to unlock transcension';
      } else {
        var button = new Flex(f1, 0, 0, 0.5, 0.2, 0.8).div;
        styleButton(button);
        button.textEl.innerText = 'Transcension ' + roman;
        registerTooltip(button, 'Show the transcension dialog');
        button.onclick = function() {
          createTranscendDialog();
        };
      }
    }

  } else {
    makePlantDialog(x, y);
  }
}

function initFieldUI() {
  fieldFlex.clear();

  fieldDivs = [];
  for(var y = 0; y < state.numh; y++) {
    fieldDivs[y] = [];
    for(var x = 0; x < state.numw; x++) {
      fieldDivs[y][x] = new CellDiv();
    }
  }

  //This is set up such that the field tiles are square on screen, field is rectangle (or square if numw == numh), and always takes max size in the rectangular div in which the field is placed
  var ratio = state.numw / state.numh;
  var fieldGrid = new Flex(fieldFlex, [0.5,-0.5,ratio], [0.5,-0.5,1/ratio], [0.5,0.5,ratio], [0.5,0.5,1/ratio]);

  var fieldDiv = fieldFlex.div;
  var w = fieldDiv.clientWidth;
  var h = fieldDiv.clientHeight;

  var tw = Math.floor(w / state.numw) - 1;
  var th = Math.floor(h / state.numh) - 1;
  tw = th = Math.min(tw, th);
  var x0 = 2 + Math.floor((fieldDiv.clientWidth - tw * state.numw) / 2);
  var y0 = 2;

  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      var bgdiv = makeDiv((x / state.numw * 100) + '%', (y / state.numh * 100) + '%', (100 / state.numw) + '%', (100 / state.numh) + '%', fieldGrid.div);
      var fgdiv = makeDiv((x / state.numw * 100) + '%', (y / state.numh * 100) + '%', (100 / state.numw) + '%', (100 / state.numh) + '%', fieldGrid.div);
      var div = makeDiv((x / state.numw * 100) + '%', (y / state.numh * 100) + '%', (100 / state.numw) + '%', (100 / state.numh) + '%', fieldGrid.div);
      div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
      centerText(div);
      var bgcanvas = createCanvas('0%', '0%', '100%', '100%', bgdiv); // canvas with the field background image
      var canvas = createCanvas('0%', '0%', '100%', '100%', fgdiv); // canvas for the plant itself

      fieldDivs[y][x].div = div;
      fieldDivs[y][x].canvas = canvas;
      fieldDivs[y][x].bgcanvas = bgcanvas;

      registerTooltip(div, bind(function(x, y, div) {
        var f = state.field[y][x];
        var fd = fieldDivs[y][x];

        var result = undefined;
        if(state.fern && x == state.fernx && y == state.ferny) {
          return 'fern: provides some resource when activated.<br><br> The amount is based on production at time when the fern appears, or starter resources when there is no production yet. Once a fern appeared, letting it sit longer does not change the amount gives.';
        } else if(f.index == 0) {
          //return 'Empty field, click to plant';
          return undefined; // no tooltip for empty fields, it's a bit too spammy when you move the mouse there
        } else if(f.index >= CROPINDEX) {
          var c = crops[f.index - CROPINDEX];
          result = getCropInfoHTML(f, c);
        } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
          if(state.treelevel <= 0) {
            return 'a weathered tree';
          } else {
            var time = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores).div(gain.spores);
            return util.upperCaseFirstWord(tree_images[treeLevelIndex(state.treelevel)][0]) + ' level ' + state.treelevel + '.<br>Next level requires: ' + treeLevelReq(state.treelevel + 1).toString() + '<br>(' + util.formatDuration(time.valueOf(), true) + ')';
          }
        }
        return result;
      }, x, y, div), true);

      div.style.cursor = 'pointer';
      div.onclick = bind(function(x, y, div, e) {
        var f = state.field[y][x];
        if(state.fern && x == state.fernx && y == state.ferny) {
          actions.push({type:ACTION_FERN, x:x, y:y});
          update();
        } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
            makeFieldDialog(x, y);
        } else if(f.index == 0) {
          if(e.shiftKey) {
            if(lastPlanted >= 0) {
              var c = crops[lastPlanted];
              actions.push({type:ACTION_PLANT, x:x, y:y, crop:c, shiftPlanted:true});
              update();
            } else {
              showMessage(shiftClickPlantUnset, invalidFG, invalidBG);
            }
          } else {
            makeFieldDialog(x, y);
          }
        } else if(f.index >= CROPINDEX) {
          if(e.shiftKey) {
            if(state.allowshiftdelete) {
              var c = crops[lastPlanted];
              actions.push({type:ACTION_DELETE, x:x, y:y});
              update();
            } else {
              showMessage('shift+click to delete must be enabled in the settings before it is allowed', invalidFG, invalidBG);
            }
          } else {
            makeFieldDialog(x, y);
          }
        }
      }, x, y, div);

      var pw = tw >> 1;
      var ph = Math.round(th / 16);
      if(ph < 4) ph = 4;
      var px = x0 + x * tw + ((tw - pw) >> 1);
      var py = y0 + (y + 1) * th - ph * 2;
      //var progress = makeDiv('10%', '80%', '80%', '10%', fieldDiv);
      var progress = makeDiv((((x + 0.2) / state.numw) * 100) + '%', (((y + 0.9) / state.numh) * 100) + '%', (100 / state.numw * 0.6) + '%', (100 / state.numh * 0.05) + '%', fieldGrid.div);
      initProgressBar(progress);
      fieldDivs[y][x].progress = progress;
    }
  }
}

/*var digits = [
  1,1,1, 0,0,1, 1,1,1, 1,1,1, 1,0,1, 1,1,1, 1,1,1, 1,1,1, 1,1,1, 1,1,1,
  1,0,1, 0,0,1, 0,0,1, 0,0,1, 1,0,1, 1,0,0, 1,0,0, 0,0,1, 1,0,1, 1,0,1,
  1,0,1, 0,0,1, 1,1,1, 1,1,1, 1,1,1, 1,1,1, 1,1,1, 0,0,1, 1,1,1, 1,1,1,
  1,0,1, 0,0,1, 1,0,0, 0,0,1, 0,0,1, 0,0,1, 1,0,1, 0,0,1, 1,0,1, 0,0,1,
  1,1,1, 0,0,1, 1,1,1, 1,1,1, 0,0,1, 1,1,1, 1,1,1, 0,0,1, 1,1,1, 1,1,1,
];*/

var digits = [
  0,1,0, 0,1,0, 1,1,0, 1,1,0, 1,0,1, 1,1,1, 0,1,1, 1,1,1, 0,1,0, 0,1,0,
  1,0,1, 1,1,0, 0,0,1, 0,0,1, 1,0,1, 1,0,0, 1,0,0, 0,0,1, 1,0,1, 1,0,1,
  1,0,1, 0,1,0, 1,1,1, 1,1,0, 1,1,1, 1,1,0, 1,1,0, 0,1,0, 0,1,0, 0,1,9,
  1,0,1, 0,1,0, 1,0,0, 0,0,1, 0,0,1, 0,0,1, 1,0,1, 0,1,0, 1,0,1, 0,0,1,
  0,1,0, 1,1,1, 1,1,1, 1,1,0, 0,0,1, 1,1,0, 0,1,0, 0,1,0, 0,1,0, 1,1,0,
];

// progresspixel = pixel to use different color for progress bar effect, must be an integer in range 0..5
function renderDigit(ctx, digit, x0, y0, progresspixel) {
  ctx.fillStyle = '#840';
  var ax = digit * 3;
  var aw = 30;
  for(var y = 0; y < 5; y++) {
    if(y >= (5 - progresspixel)) ctx.fillStyle = '#f80';
    var as = y * aw + ax;
    for(var x = 0; x < 3; x++) {
      if(digits[as + x]) ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
};

function renderLevel(canvas, level, x, y, progresspixel) {
  var ctx = canvas.getContext('2d');
  if(level < 10) {
    renderDigit(ctx, level, x + 6, y, progresspixel);
  } else if(level < 100) {
    renderDigit(ctx, Math.floor(level / 10), x + 4, y, progresspixel);
    renderDigit(ctx, level % 10, x + 8, y, progresspixel);
  } else if(level < 1000) {
    renderDigit(ctx, Math.floor(level / 100), x + 2, y, progresspixel);
    renderDigit(ctx, Math.floor(level / 10) % 10, x + 6, y, progresspixel);
    renderDigit(ctx, level % 10, x + 10, y, progresspixel);
  } else if(level < 10000) {
    renderDigit(ctx, Math.floor(level / 1000), x + 0, y, progresspixel);
    renderDigit(ctx, Math.floor(level / 100) % 10, x + 4, y, progresspixel);
    renderDigit(ctx, Math.floor(level / 10) % 10, x + 8, y, progresspixel);
    renderDigit(ctx, level % 10, x + 12, y, progresspixel);
  }
}

function updateFieldCellUI(x, y) {
  var f = state.field[y][x];
  var fd = fieldDivs[y][x];
  var growstage = (f.growth >= 1) ? 4 : Math.min(Math.floor(f.growth * 4), 3);
  var season = getSeason();

  var nextlevelprogress = 0;
  if(f.index == FIELD_TREE_BOTTOM && state.treelevel > 0) {
    nextlevelprogress = Math.min(0.99, state.res.spores.div(treeLevelReq(state.treelevel + 1).spores).valueOf());
  }
  var progresspixel = Math.round(nextlevelprogress * 5);

  var ferncode = ((state.fernx + state.ferny * state.numw) << 3) | state.fern;

  if(fd.index != f.index || fd.growstage != growstage || season != fd.season || state.treelevel != fd.treelevel || ferncode != fd.ferncode || progresspixel != fd.progresspixel) {
    var r = util.pseudoRandom2D(x, y, 77777777);
    var fieldim = images_field[season];
    var field_image = r < 0.25 ? fieldim[0] : (r < 0.5 ? fieldim[1] : (r < 0.75 ? fieldim[2] : fieldim[3]));
    if(f.index == FIELD_TREE_BOTTOM || f.index == FIELD_TREE_TOP) field_image = fieldim[4];
    renderImage(field_image, fd.bgcanvas);
    fd.season = season;
    fd.treelevel = state.treelevel;
    fd.ferncode = ferncode;
    fd.progresspixel = progresspixel;

    fd.index = f.index;
    fd.growstage = growstage;
    if(f.index >= CROPINDEX) {
      var c = crops[f.index - CROPINDEX];
      //fd.div.innerText = c.name;
      renderImage(c.image[growstage], fd.canvas);
      if(f.growth >= 1) {
        // fullgrown, so hide progress bar
        setProgressBar(fd.progress, -1);
      } else {
        setProgressBarColor(fd.progress, '#f00');
      }
    } else if(f.index == FIELD_TREE_TOP) {
      renderImage(tree_images[treeLevelIndex(state.treelevel)][1][season], fd.canvas);
    } else if(f.index == FIELD_TREE_BOTTOM) {
      renderImage(tree_images[treeLevelIndex(state.treelevel)][2][season], fd.canvas);
      if(state.treelevel > 0) renderLevel(fd.canvas, state.treelevel, 0, 11, progresspixel);
    } else {
      setProgressBar(fd.progress, -1);
      fd.div.innerText = '';
      unrenderImage(fd.canvas);
    }
    if(state.fern && x == state.fernx && y == state.ferny) {
      blendImage((state.fern == 2 ? images_fern2 : images_fern)[season], fd.canvas);
    }
  }
  if(fd.index >= CROPINDEX && f.growth < 1) {
    setProgressBar(fd.progress, f.growth);
  }
}




