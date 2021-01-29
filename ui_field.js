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

function createTranscendDialog() {
  var dialog = createDialog(DIALOG_MEDIUM, function(e) {
      actions.push({type:ACTION_TRANCSEND});
      closeAllDialogs();
      update();
  }, 'transcend', 'cancel');

  dialog.div.className = 'efDialogEthereal';

  var tlevel = Math.floor(state.treelevel / min_transcension_level);
  var roman = tlevel > 1 ? (' ' + util.toRoman(tlevel)) : '';
  var tlevel_mul = Num(tlevel);

  var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [1, -0.01], 0.75, 0.3);
  var text = '<b>Transcension' + roman + '</b><br/>';
  text += '<br/>';
  if(tlevel > 1) {
    text += 'Higher transcensions work like transcension but give extra resin multiplier.<br/>';
  } else {
    text += 'Transcension starts a new basic field. Your first transcension also unlocks an ethereal field. On this field you can plant ethereal crops with resin. These crops give bonuses to the basic field in various ways. Resin can also be used for other ethereal upgrades. Unused resin also gives a slight boost. <br/>';
  }
  text += '<br/>';
  if(tlevel > 1) {
    text += 'Collected resin: ' + state.resin.toString() + '<br/>';
    text += 'Resin bonus for Transcension ' + roman + ': ' + tlevel_mul.toString() + 'x<br/>';
  }
  var actual_resin = state.resin.mul(tlevel_mul);
  text += 'You will get:<br/>';
  text += '• ' + actual_resin.toString() + ' resin from your tree level ' + state.treelevel + '<br/>';
  if(state.res.resin.eqr(0)) {
    text += '• ' + ' Unused resin boost: ' + getUnusedResinBonusFor(actual_resin).subr(1).mulr(100).toString() + '%<br/>';
  } else {
    text += '• ' + ' Unused resin boost (including existing): ' + getUnusedResinBonusFor(actual_resin.add(state.res.resin)).subr(1).mulr(100).toString() + '%<br/>';
  }
  text += '• ' + getUpcomingFruitEssence().essence + ' fruit essence from ' + state.fruit_sacr.length + ' fruits in the sacrificial pool<br/>';
  if(state.fruit_sacr.length == 0 && state.fruit_stored.length > 0) {
    text += '<font color="#a00">→ You have fruits in storage, if you would like to sacrifice them for essence, take a look at your fruit tab before ascending</font><br/>';
  }


  var highest = 0, highestsacr = 0;
  for(var i = 0; i < state.fruit_active.length; i++) highest = Math.max(highest, state.fruit_active[i].tier);
  for(var i = 0; i < state.fruit_stored.length; i++) highest = Math.max(highest, state.fruit_stored[i].tier);
  for(var i = 0; i < state.fruit_sacr.length; i++) highestsacr = Math.max(highestsacr, state.fruit_sacr[i].tier);
  if(highestsacr > highest) {
    // fruit of highest tier is in sacrificial pool, indicate this to prevent accidently losing it
    text += '<font color="#955">→ Warning: you have a fruit in sacrificial pool of higher tier than any active or stored fruit, check the fruit tab if you want to keep it</font><br/>';
  }

  text += '<br/>';
  text += 'What will be reset:<br/>';
  text += '• Basic field with all crops<br/>';
  text += '• Basic upgrades<br/>';
  text += '• Basic resources: seeds, spores<br/>';
  text += '• Tree level<br/>';
  text += '• Fruits in the sacrificial pool<br/>';
  text += '<br/>';
  text += 'What will be kept:<br/>';
  text += '• Achievements<br/>';
  text += '• Resin, twigs and fruit essence<br/>';
  text += '• Ethereal field and ethereal crops<br/>';
  text += '• Ethereal upgrades<br/>';
  text += '• Fruits in the active and storage slots<br/>';
  text += '• Current season<br/>';
  text += '<br/><br/>';

  flex.div.innerHTML = text;
}

// works both if it's a breakdown of numbers or of resources
// percent will multiply by 100 and show percentage, this only makes sense for numbers
function formatBreakdown(breakdown, percent, title) {
  var result = '';
  result += '<br/>' + title + ':<br/>';
  for(var i = 0; i < breakdown.length; i++) {
    result += '• ' + breakdown[i][0];
    if(breakdown[i][1]) {
      // multiplicative
      if(breakdown[i][2] != undefined && i > 0) result += ': ' + (breakdown[i][2].subr(1).mulr(100)).toString() + '%'; // first is base production
    } else {
      // additive
      if(breakdown[i][2] != undefined && i > 0) result += ': ' + (breakdown[i][2]).toString();
    }
    if(breakdown[i][3] != undefined) {
      result += (i == 0) ? ': ' : ' ⇒ ';
      if(percent) {
        result += breakdown[i][3].mulr(100).toString() + '%';
      } else {
        result += breakdown[i][3].toString();
      }
    }
    result += '<br/>';
  }
  return result;
}

// get crop info in HTML
function getCropInfoHTMLBreakdown(f, c) {
  var result = '';

  if(f.isFullGrown()) {
    var p = prefield[f.y][f.x];
    var prod = c.getProd(f);
    if(!prod.empty()) {
      var breakdown = p.breakdown;
      result += formatBreakdown(breakdown, false, 'Breakdown (production/s)');
    }
    if(c.boost.neqr(0)) {
      var breakdown = p.breakdown;
      result += formatBreakdown(breakdown, true, 'Breakdown (neighboor boost +%)');
    }
    if(p.breakdown_leech && p.breakdown_leech.length > 0) {
      var breakdown = p.breakdown_leech;
      result += formatBreakdown(breakdown, true, 'Breakdown (leech)');
    }
  }

  return result;
}

// get crop info in HTML
function getCropInfoHTML(f, c, opt_detailed) {
  var result = upper(c.name);
  result += '<br/>';
  result += 'Crop type: ' + getCropTypeName(c.type);
  var help = getCropTypeHelp(c.type);
  if(help) {
    result += '<br/>' + help;
  }
  result += '<br/><br/>';

  var p = prefield[f.y][f.x];

  if(c.type == CROPTYPE_MISTLETOE) {
    if(!p.treeneighbor) {
      result += '<font color="#f88">This mistletoe is not planted next to the tree and therefore does nothing at all. Plant next to tree to be able to get twigs.</font>';
      result += '<br/><br/>';
    }
  }

  if(f.growth < 1 && c.type != CROPTYPE_SHORT) {
    if(opt_detailed) {
      // the detailed dialog is not dynamically updated, so show the total growth time statically instead.
      result += 'Growing. Total growing time: ' + util.formatDuration(c.getPlantTime());
      if(c.getPlantTime() != c.planttime) result += ' (base: ' + util.formatDuration(c.planttime) + ')';
    } else {
      result += 'Growing. Time to grow left: ' + util.formatDuration((1 - f.growth) * c.getPlantTime(), true, 4, true);
    }
    result += '<br/>';
    var expected_prod = c.getProd(f, true);
    var expected_boost = c.getBoost(f);
    if(!expected_prod.empty()) result += 'Expected production/sec: ' +expected_prod.toString();
    if(expected_boost.neqr(0)) result += 'Expected boost: ' + expected_boost.mulr(100).toString() + '%';
    result += '<br/><br/>';
  } else {
    if(c.type == CROPTYPE_SHORT) {
      if(opt_detailed) {
        // the detailed dialog is not dynamically updated, so show the life growth time statically instead.
        result += 'Short-lived plant. Total lifetime: ' + c.getPlantTime() + 's<br/><br/>';
        result += leechInfo + '<br/>';
      } else {
        result += 'Short-lived plant. Time left: ' + util.formatDuration(f.growth * c.getPlantTime(), true, 4, true) + '<br/>';
        if(state.upgrades[berryunlock_0].count) result += '<br/><span class="efWatercressHighlight">Copies neighbors: to duplicate full production of long-lived berry and mushroom neighbors for free (mushroom copy also consumes more seeds)</span><br/>';
      }

      result += '<br/>';
    } else {
      result += 'Growing time: ' + util.formatDuration(c.getPlantTime());
      if(c.getPlantTime() != c.planttime) result += ' (base: ' + util.formatDuration(c.planttime) + ')';
      result += '<br/><br/>';
    }
    var prod = p.prod3;
    if(!prod.empty() || c.type == CROPTYPE_MUSH) {
      result += 'Production per second: ' + prod.toString() + '<br/>';
      if(prod.hasNeg() || c.type == CROPTYPE_MUSH) {
        if(p.prod0.neq(p.prod3)) {
          if(c.type == CROPTYPE_MUSH) {
            result += 'Needs more seeds, requires berries as neighbors.<br>Potential max production: ' + p.prod0.toString() + '<br/>';
            result += 'Satisfied: ' + prod.seeds.div(p.prod0.seeds).mulr(100).toString() + ' %<br/>';
          } else if(c.type == CROPTYPE_SHORT) {
            // nothing to print.
          } else {
            result += 'Needs more input resources, potential max production: ' + p.prod0.toString() + '<br/>';
          }
        } else {
          // commented out, the crop type description already says this
          //result += 'Consumes a resource produced by neighboring crops.<br/>';
          // NOTE: always shows 100% even if the berry produces more than enough. Making that show more than 100% would require a completely separate production/consumption computation in precomputeField with a hypothetical mushroom requesting way more seeds, and that'd be unecessarily expensive to compute for just this display.
          result += 'Satisfied: >= 100%<br/>';
        }
      } else if(p.prod3.neq(p.prod2)) {
        result += 'After consumption: ' + p.prod2.toString() + '<br/>';
      }
      result += '<br/>';
    }
    if(c.type == CROPTYPE_MUSH) {
      result += 'Efficiency: ' + p.prod0.spores.div(p.prod0.seeds.neg()).toString() + ' spores/seed, ' +
          p.prod0.seeds.div(p.prod0.spores.neg()).toString() + ' seeds/spore<br/>';
    }
    if(c.boost.neqr(0)) {
      if(c.type == CROPTYPE_NETTLE) {
        result += 'Boosting spores: ' + (c.getBoost(f).mulr(100).toString()) + '%. Nerfing neighbor berries and flowers<br/>';
      } else {
        result += 'Boosting neighbors: ' + (c.getBoost(f).mulr(100).toString()) + '%<br/>';
      }
      result += '<br/>';
    }
  }

  var recoup = (c.type == CROPTYPE_SHORT) ? Res() : c.getCost(-1).mulr(cropRecoup);

  if(opt_detailed) {
    result += 'Num planted of this type: ' + state.cropcount[c.index] + '<br>';
    result += '<br/>';
    result += 'Cost: ' + '<br>';
    result += ' • Base planting cost: ' + c.cost.toString() + '<br>';
    result += ' • Last planting cost: ' + c.getCost(-1).toString() + '<br>';
    result += ' • Next planting cost: ' + c.getCost().toString() + '<br>';

    result += ' • Recoup on delete: ' + recoup.toString();
  } else {
    result += 'Next planting cost: ' + c.getCost().toString() + ' (' + getCostAffordTimer(c.getCost()) + ')<br>';
    result += 'Recoup on delete: ' + recoup.toString();
  }

  return result;
}

function makeFieldDialog(x, y) {
  var f = state.field[y][x];
  var fd = fieldDivs[y][x];


  if(f.hasCrop()) {
    var c = f.getCrop();
    var div;

    var dialog = createDialog();
    dialog.div.className = 'efDialogTranslucent';
    var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [0, 0.2], [0, 0.2], 0.3);
    var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(c.image[4], canvas);

    var buttonshift = 0;
    if(c.type == CROPTYPE_SHORT) buttonshift += 0.2; // the watercress has a long explanation that makes the text go behind the buttons... TODO: have some better system where button is placed after whatever the textsize is

    var flex0 = new Flex(dialog, [0.01, 0.2], [0, 0.01], 1, 0.17, 0.29);
    var button0 = new Flex(dialog, [0.01, 0.2], [0.4 + buttonshift, 0.01], 0.5, 0.45 + buttonshift, 0.8).div;
    var button1 = new Flex(dialog, [0.01, 0.2], [0.45 + buttonshift, 0.01], 0.5, 0.5 + buttonshift, 0.8).div;
    var button2 = new Flex(dialog, [0.01, 0.2], [0.5 + buttonshift, 0.01], 0.5, 0.55 + buttonshift, 0.8).div;
    var last0 = undefined;

    styleButton(button0);
    button0.textEl.innerText = 'delete';
    button0.textEl.style.color = '#800';
    registerTooltip(button0, 'Delete crop and get some of its cost back.');
    addButtonAction(button0, function() {
      actions.push({type:ACTION_DELETE, x:x, y:y});
      dialog.cancelFun();
      update(); // do update immediately rather than wait for tick, for faster feeling response time
    });

    styleButton(button1);
    button1.textEl.innerText = 'detailed stats / bonuses';
    registerTooltip(button1, 'Show breakdown of multipliers and bonuses and other detailed stats.');
    addButtonAction(button1, function() {
      var dialog = createDialog(DIALOG_LARGE);
      dialog.div.className = 'efDialogTranslucent';
      var flex = new Flex(dialog, 0.05, 0.05, 0.95, 0.8, 0.3);
      var text = '';


      text += getCropInfoHTML(f, c, true);
      text += '<br/>';
      text += getCropInfoHTMLBreakdown(f, c);
      flex.div.innerHTML = text;
    });

    styleButton(button2);
    button2.textEl.innerText = 'see unlocked crops';
    registerTooltip(button2, 'Show the crop dialog with unlocked plants.');
    addButtonAction(button2, function() {
      makePlantDialog(x, y, true);
    });

    updatedialogfun = bind(function(f, c, flex) {
      var html0 = getCropInfoHTML(f, c);
      if(html0 != last0) {
        flex0.div.innerHTML = html0;
        last0 = html0;
      }
    }, f, c);

    updatedialogfun(f, c);

  } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
    var c = f.getCrop();
    var div;

    var dialog = createDialog();
    dialog.div.className = 'efDialogTranslucent';
    var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [0, 0.2], [0, 0.2], 0.3);
    var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(tree_images[treeLevelIndex(state.treelevel)][1][getSeason()], canvas);
    flex = new Flex(dialog, [0, 0.01], [0, 0.199], [0, 0.2], [0, 0.4], 0.3);
    canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(tree_images[treeLevelIndex(state.treelevel)][2][getSeason()], canvas);

    var ypos = 0;
    var ysize = 0.1;

    var f0 = new Flex(dialog, [0.01, 0.2], [0, 0.01], 1, 0.25, 0.3);
    var f1 = new Flex(dialog, [0.01, 0.2], 0.7, 1, 0.9, 0.3);
    var text;

    text = '<b>' + upper(tree_images[treeLevelIndex(state.treelevel)][0]) + '</b><br/>';
    text += 'Tree level: ' + state.treelevel + '<br/>';
    if(state.treelevel == 0) {
      text += 'This tree needs to be rejuvenated first. Requires spores.<br/>';
      f0.div.innerHTML = text;
    } else {
      text += '<br/>';
      text += 'Next level requires: ' + treeLevelReq(state.treelevel + 1).toString() + '<br/>';
      if(state.mistletoes > 0) {
        text += 'This requirement was increased ' + (getMistletoeLeech().subr(1).mulr(100)).toString() + '% by ' + state.mistletoes + ' mistletoes' + '<br/>';
      }

      var tlevel = Math.floor(state.treelevel / min_transcension_level);
      var roman = tlevel > 1 ? (' ' + util.toRoman(tlevel)) : '';
      var tlevel_mul = Num(tlevel);

      text += '<br/>';
      text += 'Resin ready: ' + state.resin.toString() + '<br/>';
      var resin_breakdown = [];
      text += 'Resin added at next tree level: ' + nextTreeLevelResin(resin_breakdown).toString();
      if(resin_breakdown.length > 1) {
        text += formatBreakdown(resin_breakdown, false, 'Resin breakdown');
      }
      text += '<br>';
      if(state.mistletoes > 0) {
        text += 'Twigs from mistletoes at next tree level: ' + nextTwigs().toString() + '.<br>'
        text += 'Total gotten so far this transcension: ' + state.c_res.twigs.toString() + ' twigs.<br/>';
      }
      if(tlevel > 1) {
        text += '<br/>';
        text += 'Resin bonus for Transcension ' + roman + ': ' + tlevel_mul.toString() + 'x<br/>';
        text += 'Resulting total resin on transcension:' + state.resin.mulr(tlevel_mul).toString() + '<br/>';
      }

      text += '<br/>';
      text += 'Tree level production boost to crops: ' + (getTreeBoost().mulr(100)).toString() + '%' + '<br>';

      if(getSeason() == 3) {
        text += '<br/>';
        text += 'During winter, the tree provides winter warmth: +' + getWinterTreeWarmth().subr(1).mulr(100).toString() + '% berry / mushroom / flower stats for crops next to the tree<br>';
      }

      if(state.upgrades[upgrade_mistunlock].unlocked || state.upgrades[upgrade_sununlock].unlocked || state.upgrades[upgrade_rainbowunlock].unlocked) {
        text += '<br/>';
        text += 'Abilities discovered:<br>';
        if(state.upgrades[upgrade_sununlock].unlocked) text += '• Sun: benefits berries when active<br>';
        if(state.upgrades[upgrade_mistunlock].unlocked) text += '• Mist: benefits mushrooms when active<br>';
        if(state.upgrades[upgrade_rainbowunlock].unlocked) text += '• Rainbow: benefits flowers when active<br>';
      }

      f0.div.innerHTML = text;

      if(state.treelevel < min_transcension_level) {
        if(state.treelevel >= 1) f1.div.innerText = 'Reach tree level ' + min_transcension_level + ' to unlock transcension';
      } else {
        var button = new Flex(f1, 0, 0, 0.5, 0.3, 0.8).div;
        styleButton(button);
        button.textEl.innerText = 'Transcension ' + roman;
        button.textEl.style.boxShadow = '0px 0px 5px #ff0';
        button.textEl.style.textShadow = '0px 0px 5px #ff0';
        registerTooltip(button, 'Show the transcension dialog');
        addButtonAction(button, function() {
          createTranscendDialog();
        });
      }
    }

  } else {
    makePlantDialog(x, y, false);
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
      // the widths are made a tiny bit bigger, to avoid some gridding (1-pixel gaps between field tiles) that can occur for some field sizes otherwise
      var extra = 0.1;
      var bgdiv = makeDiv((x / state.numw * 100) + '%', (y / state.numh * 100) + '%', (101 / state.numw) + '%', (101 / state.numh) + '%', fieldGrid.div);
      var fgdiv = makeDiv((x / state.numw * 100) + '%', (y / state.numh * 100) + '%', (101 / state.numw) + '%', (101 / state.numh) + '%', fieldGrid.div);
      var div = makeDiv((x / state.numw * 100) + '%', (y / state.numh * 100) + '%', (101 / state.numw) + '%', (101 / state.numh) + '%', fieldGrid.div);
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
          return 'fern: provides some resource when activated.<br><br> The amount is based on production at time when the fern appears,<br>or starter resources when there is no production yet.<br>Once a has fern appeared, letting it sit longer does not change the amount it gives.';
        } else if(f.index == 0) {
          //return 'Empty field, click to plant';
          return undefined; // no tooltip for empty fields, it's a bit too spammy when you move the mouse there
        } else if(f.index == FIELD_REMAINDER) {
          result = 'Remains of a watercress that was copying from multiple plants. Visual reminder of good copying-spot only, this is an empty field spot and does nothing. Allows replanting this watercress with "w" key.';
        } else if(f.hasCrop()) {
          var c = f.getCrop();
          result = getCropInfoHTML(f, c);
        } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
          var time = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores).div(gain.spores);
          if(state.treelevel <= 0) {
            var result = 'a weathered tree';
            if(state.res.spores.gtr(0)) result += '<br>(' + util.formatDuration(time.valueOf(), true) + ')';
            return result;
          } else {
            return upper(tree_images[treeLevelIndex(state.treelevel)][0]) + ' level ' + state.treelevel + '.<br>Next level requires: ' + treeLevelReq(state.treelevel + 1).toString() + '<br>(' + util.formatDuration(time.valueOf(), true) + ')';
          }
        }
        return result;
      }, x, y, div), true);

      div.style.cursor = 'pointer';
      addButtonAction(div, bind(function(x, y, div, e) {
        var f = state.field[y][x];
        var fern = state.fern && x == state.fernx && y == state.ferny;

        if(state.fern && x == state.fernx && y == state.ferny) {
          actions.push({type:ACTION_FERN, x:x, y:y});
          update();
        }

        if(!fern && f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
            makeFieldDialog(x, y);
        } else if(f.index == 0 || f.index == FIELD_REMAINDER) {
          if(e.shiftKey) {
            if(state.lastPlanted >= 0 && crops[state.lastPlanted]) {
              var c = crops[state.lastPlanted];
              actions.push({type:ACTION_PLANT, x:x, y:y, crop:c, shiftPlanted:true});
              update();
            } else {
              showMessage(shiftClickPlantUnset, invalidFG, invalidBG);
            }
          } else if(e.ctrlKey) {
            actions.push({type:ACTION_PLANT, x:x, y:y, crop:crops[short_0], ctrlPlanted:true});
            update();
          } else if(!fern) {
            makeFieldDialog(x, y);
          }
        } else if(!fern && f.hasCrop()) {
          if(e.shiftKey || (e.ctrlKey && f.cropIndex() == short_0)) {
            if(state.allowshiftdelete) {
              var c = crops[state.lastPlanted];
              actions.push({type:ACTION_DELETE, x:x, y:y});
              update();
            } else {
              showMessage('shift+click to delete must be enabled in the settings before it is allowed', invalidFG, invalidBG);
            }
          } else {
            makeFieldDialog(x, y);
          }
        }
      }, x, y, div), 'field tile ' + x + ', ' + y);

      var pw = tw >> 1;
      var ph = Math.round(th / 16);
      if(ph < 4) ph = 4;
      var px = x0 + x * tw + ((tw - pw) >> 1);
      var py = y0 + (y + 1) * th - ph * 2;
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
  if(!(growstage >= 0 && growstage <= 4)) growstage = 0;
  var season = getSeason();

  var progresspixel = -1;
  if(f.index == FIELD_TREE_BOTTOM && (state.treelevel > 0 || state.res.spores.gtr(0))) {
    var nextlevelprogress = Math.min(0.99, state.res.spores.div(treeLevelReq(state.treelevel + 1).spores).valueOf());
    progresspixel = Math.round(nextlevelprogress * 5);
  }

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
    if(f.hasCrop()) {
      var c = f.getCrop();
      //fd.div.innerText = c.name;
      renderImage(c.image[growstage], fd.canvas);
      if(f.growth >= 1) {
        // fullgrown, so hide progress bar
        setProgressBar(fd.progress, -1, undefined);
      }
    } else if(f.index == FIELD_TREE_TOP) {
      renderImage(tree_images[treeLevelIndex(state.treelevel)][1][season], fd.canvas);
    } else if(f.index == FIELD_TREE_BOTTOM) {
      renderImage(tree_images[treeLevelIndex(state.treelevel)][2][season], fd.canvas);
      if(state.treelevel > 0 || state.res.spores.gtr(0)) renderLevel(fd.canvas, state.treelevel, 0, 11, progresspixel);
    } else if(f.index == FIELD_REMAINDER) {
      renderImage(image_watercress_remainder, fd.canvas);
      setProgressBar(fd.progress, -1, undefined);
    } else {
      setProgressBar(fd.progress, -1, undefined);
      fd.div.innerText = '';
      unrenderImage(fd.canvas);
    }
    if(state.fern && x == state.fernx && y == state.ferny) {
      blendImage((state.fern == 2 ? images_fern2 : images_fern)[season], fd.canvas);
    }
  }
  if(f.hasCrop() && f.growth < 1) {
    var c = f.getCrop();
    setProgressBar(fd.progress, f.growth, c.type == CROPTYPE_SHORT ? '#0c0' : '#f00');
  }
}




