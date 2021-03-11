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


var fieldRows;
var fieldDivs;

// works both if it's a breakdown of numbers or of resources
// percent will multiply by 100 and show percentage, this only makes sense for numbers
function formatBreakdown(breakdown, percent, title) {
  var result = '';
  result += '<br/>' + title + ':<br/>';
  for(var i = 0; i < breakdown.length; i++) {
    result += '• ' + breakdown[i][0];
    if(breakdown[i][1]) {
      // multiplicative
      if(breakdown[i][2] != undefined && i > 0) result += ': ' + (breakdown[i][2].subr(1)).toPercentString(); // first is base production
    } else {
      // additive
      if(breakdown[i][2] != undefined && i > 0) result += ': ' + (breakdown[i][2]).toString();
    }
    if(breakdown[i][3] != undefined) {
      result += (i == 0) ? ': ' : ' ⇒ ';
      if(percent) {
        result += breakdown[i][3].toPercentString();
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


  var bdname = f.isFullGrown() ? 'Breakdown' : 'Preliminary breakdown';

  var p = prefield[f.y][f.x];
  var prod = c.getProd(f);
  if(!prod.empty() || c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH) {
    var breakdown = p.breakdown;
    result += formatBreakdown(breakdown, false, bdname + ' (production/s)');
  }
  if(c.boost.neqr(0) && (c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_NETTLE)) {
    var breakdown = p.breakdown;
    result += formatBreakdown(breakdown, true, bdname + ' (neighboor boost +%)');
  }
  if(c.boost.neqr(0) && (c.type == CROPTYPE_BEE)) {
    var breakdown = p.breakdown;
    result += formatBreakdown(breakdown, true, bdname + ' (flower boost +%)');
  }
  if(p.breakdown_leech && p.breakdown_leech.length > 0) {
    var breakdown = p.breakdown_leech;
    result += formatBreakdown(breakdown, true, bdname + ' (copy)');
  }

  return result;
}

// get crop info in HTML
function getCropInfoHTML(f, c, opt_detailed) {
  var result = upper(c.name);
  result += '<br/>';
  result += 'Crop type: ' + getCropTypeName(c.type) + (c.tier ? (' (tier ' + (c.tier + 1) + ')') : '');
  var help = getCropTypeHelp(c.type, state.challenge == challenge_bees);
  if(help) {
    result += '<br/>' + help;
  }
  if(c.tagline) result += '<br/><br/>' + upper(c.tagline);
  result += '<br/><br/>';

  var p = prefield[f.y][f.x];

  if(c.type == CROPTYPE_MISTLETOE) {
    if(!p.treeneighbor) {
      result += '<font color="#f88">This mistletoe is not planted next to the tree and therefore does nothing at all. Plant next to tree to be able to get twigs.</font>';
      result += '<br/><br/>';
    }
  }

  if(c.index == challengecrop_0) {
    if(!p.flowerneighbor) {
      result += '<font color="#f88">This worker bee is not next to a flower and therefore does nothing at all. Plant next to a flower to get worker bee boost.</font>';
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
    var expected_boostboost = c.getBoostBoost(f);
    if(!expected_prod.empty()) result += 'Expected production/sec: ' +expected_prod.toString();
    if(expected_boost.neqr(0)) result += 'Expected boost: ' + expected_boost.toPercentString();
    if(expected_boostboost.neqr(0)) result += 'Expected boost: ' + expected_boostboost.toPercentString();
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
      result += 'Growth time: ' + util.formatDuration(c.getPlantTime());
      if(c.getPlantTime() != c.planttime) result += ' (base: ' + util.formatDuration(c.planttime) + ')';
      result += '<br/><br/>';
    }
    var prod = p.prod3;
    if(!prod.empty() || c.type == CROPTYPE_MUSH || c.type == CROPTYPE_BERRY) {
      result += 'Production per second: ' + prod.toString() + '<br/>';
      if(prod.hasNeg() || c.type == CROPTYPE_MUSH) {
        if(p.prod0.neq(p.prod3)) {
          if(c.type == CROPTYPE_MUSH) {
            result += 'Needs more seeds, requires berries as neighbors.<br>Potential max production: ' + p.prod0.toString() + '<br/>';
            result += 'Satisfied: ' + prod.seeds.div(p.prod0.seeds).toPercentString() + '<br/>';
          } else if(c.type == CROPTYPE_SHORT) {
            // nothing to print.
          } else {
            result += 'Needs more input resources, potential max production: ' + p.prod0.toString() + '<br/>';
          }
        } else {
          // commented out, the crop type description already says this
          //result += 'Consumes a resource produced by neighboring crops.<br/>';
          // NOTE: always shows 100% even if the berry produces more than enough. Making that show more than 100% would require a completely separate production/consumption computation in precomputeField with a hypothetical mushroom requesting way more seeds, and that'd be unecessarily expensive to compute for just this display.
          result += 'Satisfied: >= 100%.<br/>Tip: flowers next to mushrooms give them a large boost.<br/>';
        }
      } else if(p.prod3.neq(p.prod2)) {
        if(!(p.prod2.seeds.ltr(0) && p.prod2.seeds.gtr(-1e-6))) { // avoid a possible numerical display issue
          result += 'After consumption: ' + p.prod2.toString() + '<br/>';
        }
      }
      result += '<br/>';
    }
    if(c.type == CROPTYPE_MUSH) {
      result += 'Efficiency: ' + p.prod0.spores.div(p.prod0.seeds.neg()).toString() + ' spores/seed, ' +
          p.prod0.seeds.div(p.prod0.spores.neg()).toString() + ' seeds/spore<br/>';
    }
    if(c.index == challengecrop_0) {
      result += 'Global field-wide boost to berries, flowers and mushrooms: ' + p.boost.toPercentString() + ' (base: ' + c.boost.toPercentString() + ')' + '<br/>';
      result += 'All worker bees together: ' + getWorkerBeeBonus().toPercentString() + '<br/>';
      //result += 'One worker bee: ' + challenge_worker_bees_boost.mulr(state.upgrades[challengecropmul_1].count * challengecropmul_1_boost + 1).toPercentString() + ' (double if next to queen)<br/>';
      result += '<br/>';
    }
    if(c.index == challengecrop_1) {
      result += 'Boost to neighbor worker bees: ' + p.boost.toPercentString() + ' (base: ' + c.boost.toPercentString() + ')' + '<br/>';
      result += '<br/>';
    }
    if(c.index == challengecrop_2) {
      result += 'Boost to neighbor queen bees: ' + c.getBoostBoost(f).toPercentString() + ' (base: ' + c.boost.toPercentString() + ')' + '<br/>';
      result += '<br/>';
    }
    if(c.boost.neqr(0) && (c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_NETTLE)) {
      if(c.type == CROPTYPE_NETTLE) {
        result += 'Boosting spores: ' + (c.getBoost(f).toPercentString()) + '. Nerfing neighbor berries and flowers<br/>';
      } else {
        result += 'Boosting neighbors: ' + (c.getBoost(f).toPercentString()) + '<br/>';
      }
      result += '<br/>';
    }
    if(c.boost.neqr(0) && (c.type == CROPTYPE_BEE)) {
      result += 'Boosting flowers: ' + (c.getBoostBoost(f).toPercentString()) + '<br/>';
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

function makeTreeDialog() {
  var div;

  var dialog = createDialog();
  dialog.div.className = 'efDialogTranslucent';

  var contentFlex = dialog.content;
  var flex = new Flex(contentFlex, [0, 0.01], [0, 0.01], [0, 0.2], [0, 0.2], 0.3);
  var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(tree_images[treeLevelIndex(state.treelevel)][1][getSeason()], canvas);


  flex = new Flex(contentFlex, [0, 0.01], [0, 0.199], [0, 0.2], [0, 0.4], 0.3);
  canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(tree_images[treeLevelIndex(state.treelevel)][2][getSeason()], canvas);

  var ypos = 0;
  var ysize = 0.1;

  var f0 = new Flex(contentFlex, [0.01, 0.2], [0, 0.01], 0.98, 0.65, 0.3);
  makeScrollable(f0);
  var f1 = new Flex(contentFlex, [0.01, 0.2], 0.7, 1, 0.9, 0.3);

  var createText = function() {
    var text;

    var show_resin = !state.challenge || challenges[state.challenge].allowsresin;
    var show_twigs = !state.challenge || challenges[state.challenge].allowstwigs;
    var resin_breakdown = [];
    var twigs_breakdown = [];

    text = '<b>' + upper(tree_images[treeLevelIndex(state.treelevel)][0]) + '</b><br/>';
    text += 'Tree level: ' + state.treelevel + '<br/>';
    if(state.treelevel == 0) {
      text += 'This tree needs to be rejuvenated first. Requires spores.<br/>';
    }

    if(state.challenge) {
      var c = challenges[state.challenge];
      var c2 = state.challenges[state.challenge];
      text += '<br>';
      text += '<b>Challenge active</b>: ' + upper(c.name);
      if(c.targetlevel.length > 1) {
        if(!c.fullyCompleted()) {
          text += '<br>Next challenge target level: ' + c.targetlevel[c2.completed];
        }
      } else {
        if(!c2.completed) {
          text += '<br>Challenge target level: ' + c.targetlevel[0];
        }
      }
      text += '<br>';
    }

    if(state.treelevel > 0) {
      text += '<br/>';
      text += 'Next level requires: ' + treeLevelReq(state.treelevel + 1).toString() + '<br/>';
      if(state.mistletoes > 0) {
        text += 'This requirement was increased ' + (getMistletoeLeech().subr(1)).toPercentString() + ' by ' + state.mistletoes + ' mistletoes' + '<br/>';
      }

      var tlevel = Math.floor(state.treelevel / min_transcension_level);
      var roman = tlevel > 1 ? (' ' + util.toRoman(tlevel)) : '';
      var tlevel_mul = Num(tlevel);
      if(tlevel > 1) {
        text += '<br/>';
        if(show_resin && show_twigs) {
          text += 'Resin + twigs bonus for Transcension ' + roman + ': ' + tlevel_mul.toString() + 'x<br/>';
        } else if(show_resin) {
          text += 'Resin bonus for Transcension ' + roman + ': ' + tlevel_mul.toString() + 'x<br/>';
        } else if(show_twigs) {
          text += 'Twigs bonus for Transcension ' + roman + ': ' + tlevel_mul.toString() + 'x<br/>';
        }
      }
      text += '<br>';

      if(show_resin) {
        if(state.challenge && state.treelevel > state.g_treelevel && !state.challenge.allowbeyondhighestlevel) {
          text += 'No further resin gained during this challenge, higher level than max regular level reached';
        } else {
          text += 'Resin added at next tree level: ' + nextTreeLevelResin(resin_breakdown).toString();
        }

        text += '<br/>';
        if(tlevel > 1) {
          text += 'Total resin ready: ' + state.resin.toString() + ' x ' + tlevel + ' = ' + state.resin.mulr(tlevel_mul).toString();
        } else {
          text += 'Total resin ready: ' + state.resin.toString();
        }
        text += '<br/>';
      } else {
        text += 'The tree doesn\'t produce resin during this challenge.<br/>';
      }
      text += '<br/>';


      if(state.mistletoes > 0) {
        if(show_twigs) {
          if(state.challenge && state.treelevel > state.g_treelevel && !state.challenge.allowbeyondhighestlevel) {
            text += 'No further twigs gained during this challenge, higher level than max regular level reached';
          } else {
            text += 'Twigs added at next tree level: ' + nextTwigs(twigs_breakdown).twigs.toString();
          }

          text += '<br>';
          if(tlevel > 1) {
            text += 'Total twigs ready: ' + state.twigs.toString() + ' x ' + tlevel + ' = ' + state.twigs.mulr(tlevel_mul).toString();
          } else {
            text += 'Total twigs ready: ' + state.twigs.toString();
          }
          text += '<br/>';
        } else {
          text += 'The tree doesn\'t produce twigs during this challenge.<br/>';
        }
        text += '<br/>';
      }

      text += 'Tree level production boost to crops: ' + (getTreeBoost()).toPercentString() + '<br>';

      if(getSeason() == 3) {
        text += '<br/>';
        text += 'During winter, the tree provides winter warmth: +' + getWinterTreeWarmth().subr(1).toPercentString() + ' berry / mushroom / flower stats for crops next to the tree<br>';
      }

      if(state.untriedchallenges) {
        text += '<br/>';
        text += '<span class="efWarningOnDialogText">New challenge available!</span><br>';
      }

      if(state.upgrades[upgrade_mistunlock].unlocked || state.upgrades[upgrade_sununlock].unlocked || state.upgrades[upgrade_rainbowunlock].unlocked) {
        text += '<br/>';
        text += 'Abilities discovered:<br>';
        if(state.upgrades[upgrade_sununlock].unlocked) text += '• Sun: benefits berries when active<br>';
        if(state.upgrades[upgrade_mistunlock].unlocked) text += '• Mist: benefits mushrooms when active<br>';
        if(state.upgrades[upgrade_rainbowunlock].unlocked) text += '• Rainbow: benefits flowers when active<br>';
      }

      if(resin_breakdown && resin_breakdown.length >= 1) {
        text += formatBreakdown(resin_breakdown, false, 'Resin gain breakdown');
      }

      if(twigs_breakdown && twigs_breakdown.length >= 1) {
        text += formatBreakdown(twigs_breakdown, false, 'Twigs gain breakdown');
      }
    }

    return text;
  };

  var text = createText();
  f0.div.innerHTML = text;

  var lastseentreelevel = state.treelevel;
  registerUpdateListener(function() {
    if(!flex || !document.body.contains(flex.div)) return false;
    if(lastseentreelevel != state.treelevel) {
      lastseentreelevel = state.treelevel;
      var text = createText();
      f0.div.innerHTML = text;
    }
    return true;
  });

  if(state.challenge) {
    var c = challenges[state.challenge];
    var c2 = state.challenges[state.challenge];

    var already_completed = c.fullyCompleted();
    var targetlevel = c.nextTargetLevel();
    var success = state.treelevel >= targetlevel;

    var button = new Flex(f1, 0, 0, 0.5, 0.3, 0.8).div;
    styleButton(button);
    if(already_completed && success) {
      button.textEl.innerText = 'Finish challenge';
      registerTooltip(button, 'Finish the challenge. If you broke the max level record, your challenge production bonus will increase.');
    } else if(already_completed && !success) {
      button.textEl.innerText = 'End challenge';
      registerTooltip(button, 'End the challenge.');
    } else if(success) {
      button.textEl.innerText = 'Complete challenge' + (c2.completed ? (' ' + util.toRoman(c2.completed + 1)) : '');
      registerTooltip(button, 'Successfully finish the challenge for the first time.');
    } else {
      button.textEl.innerText = 'Abort challenge';
      if(c.targetlevel.length > 1) {
        registerTooltip(button, 'Open the dialog to abort the challenge, you don\'t get its next reward, but if you broke the max level record, your challenge production bonus will still increase. The dialog will show the amounts.');
      } else {
        registerTooltip(button, 'Open the dialog to abort the challenge, you don\'t get its one-time reward, but if you broke the max level record, your challenge production bonus will still increase. The dialog will show the amounts.');
      }
    }

    button.textEl.style.boxShadow = '0px 0px 5px #f40';
    button.textEl.style.textShadow = '0px 0px 5px #f40';
    addButtonAction(button, function() {
      createFinishChallengeDialog();
    });


    button = new Flex(f1, 0, 0.32, 0.5, 0.6, 0.8).div;
    styleButton(button);
    button.textEl.innerText = 'Current challenge info';
    registerTooltip(button, 'Description and statistics for the current challenge');
    addButtonAction(button, function() {
      createChallengeDescriptionDialog(state.challenge, true);
    });
  } else if(state.treelevel < min_transcension_level) {
    if(state.treelevel >= 1) f1.div.innerText = 'Reach tree level ' + min_transcension_level + ' to unlock transcension';
  } else {
    var button = new Flex(f1, 0, 0, 0.5, 0.3, 0.8).div;
    var tlevel = Math.floor(state.treelevel / min_transcension_level);
    var roman = tlevel > 1 ? (' ' + util.toRoman(tlevel)) : '';
    styleButton(button);
    button.textEl.innerText = 'Transcension ' + roman;
    button.textEl.style.boxShadow = '0px 0px 5px #ff0';
    button.textEl.style.textShadow = '0px 0px 5px #ff0';
    registerTooltip(button, 'Show the transcension dialog');
    addButtonAction(button, function() {
      createTranscendDialog();
    });

    if(state.challenges_unlocked) {
      button = new Flex(f1, 0, 0.32, 0.5, 0.6, 0.8).div;
      styleButton(button);
      button.textEl.innerText = 'Challenges';
      button.textEl.style.boxShadow = '0px 0px 5px #f60';
      button.textEl.style.textShadow = '0px 0px 5px #f60';
      registerTooltip(button, 'Transcend and start a challenge');
      addButtonAction(button, function() {
        createChallengeDialog();
      });
    }
  }
  if(state.challenges_unlocked) {
    button = new Flex(f1, 0, 0.62, 0.5, 0.9, 0.8).div;
    styleButton(button);
    button.textEl.innerText = 'Challenge Stats';
    addButtonAction(button, function() {
      createAllChallengeStatsDialog();
    });
  }
}

function makeFieldDialog(x, y) {
  var f = state.field[y][x];
  var fd = fieldDivs[y][x];


  if(f.hasCrop()) {
    var c = f.getCrop();
    var div;

    var dialog = createDialog();
    dialog.div.className = 'efDialogTranslucent';

    var contentFlex = dialog.content;
    var flex = new Flex(contentFlex, [0, 0.01], [0, 0.01], [0, 0.2], [0, 0.2], 0.3);
    var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(c.image[4], canvas);

    var buttonshift = 0;
    if(c.type == CROPTYPE_SHORT) buttonshift += 0.2; // the watercress has a long explanation that makes the text go behind the buttons... TODO: have some better system where button is placed after whatever the textsize is

    var flex0 = new Flex(contentFlex, [0.01, 0.2], [0, 0.01], 1, 0.5, 0.29);
    var button0 = new Flex(contentFlex, [0.01, 0.2], [0.5 + buttonshift, 0.01], 0.5, 0.55 + buttonshift, 0.8).div;
    var button1 = new Flex(contentFlex, [0.01, 0.2], [0.55 + buttonshift, 0.01], 0.5, 0.6 + buttonshift, 0.8).div;
    var button2 = new Flex(contentFlex, [0.01, 0.2], [0.6 + buttonshift, 0.01], 0.5, 0.65 + buttonshift, 0.8).div;
    var last0 = undefined;

    makeScrollable(flex0);

    styleButton(button0);
    button0.textEl.innerText = 'Delete';
    button0.textEl.style.color = '#800';
    registerTooltip(button0, 'Delete crop and get some of its cost back.');
    addButtonAction(button0, function() {
      actions.push({type:ACTION_DELETE, x:x, y:y});
      dialog.cancelFun();
      update(); // do update immediately rather than wait for tick, for faster feeling response time
    });

    styleButton(button1);
    button1.textEl.innerText = 'Detailed stats / bonuses';
    registerTooltip(button1, 'Show breakdown of multipliers and bonuses and other detailed stats.');
    addButtonAction(button1, function() {
      var dialog = createDialog(DIALOG_LARGE);
      dialog.div.className = 'efDialogTranslucent';
      var flex = dialog.content;
      var text = '';

      makeScrollable(flex);


      text += getCropInfoHTML(f, c, true);
      text += '<br/>';
      text += getCropInfoHTMLBreakdown(f, c);
      flex.div.innerHTML = text;
    });

    styleButton(button2);
    button2.textEl.innerText = 'Replace crop';
    registerTooltip(button2, 'Replace the crop with a new one, same as delete then plant. Shows the list of unlocked crops.');
    addButtonAction(button2, function() {
      makePlantDialog(x, y, true, c.getRecoup());
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
    makeTreeDialog();
  } else {
    makePlantDialog(x, y, false);
  }
}

function initFieldUI() {
  fieldFlex.clear();

  fieldRows = [];
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

  setAriaRole(fieldGrid.div, 'grid'); // intended for 2D navigation, combined with the row and cell roles given to the elements below
  setAriaLabel(fieldGrid.div, 'basic field');

  var tw = Math.floor(w / state.numw) - 1;
  var th = Math.floor(h / state.numh) - 1;
  tw = th = Math.min(tw, th);
  var x0 = 2 + Math.floor((fieldDiv.clientWidth - tw * state.numw) / 2);
  var y0 = 2;

  for(var y = 0; y < state.numh; y++) {
    var row = makeDiv('0', (y / state.numh * 100) + '%', '100%', (101 / state.numh) + '%', fieldGrid.div);
    setAriaRole(row, 'row');
    fieldRows[y] = row;
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      // the widths are made a tiny bit bigger, to avoid some gridding (1-pixel gaps between field tiles) that can occur for some field sizes otherwise
      var extra = 0.1;
      var celldiv = makeDiv((x / state.numw * 100) + '%', '0', (101 / state.numw) + '%', '100%', row);
      var bgcanvas = createCanvas('0%', '0%', '100%', '100%', celldiv); // canvas with the field background image
      var canvas = createCanvas('0%', '0%', '100%', '100%', celldiv); // canvas for the plant itself
      var div = makeDiv('0', '0', '100%', '100%', celldiv);
      setAriaRole(celldiv, 'cell');
      div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
      centerText(div);

      fieldDivs[y][x].div = div;
      fieldDivs[y][x].canvas = canvas;
      fieldDivs[y][x].bgcanvas = bgcanvas;

      util.setEvent(div, 'onmouseover', 'fieldover', bind(function(x, y) {
        updateFieldMouseOver(x, y);
      }, x, y));
      util.setEvent(div, 'onmouseout', 'fieldout', bind(function(x, y) {
        updateFieldMouseOut(x, y);
      }, x, y));
      // on mouse up and with timeout so that the state is fully updated after the action that the click caused
      util.setEvent(div, 'onmouseup', 'fieldclick', bind(function(x, y) {
        window.setTimeout(function(){updateFieldMouseClick(x, y)});
      }, x, y));

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

        if(!fern && (f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM)) {
            makeFieldDialog(x, y);
        } else if(f.index == 0 || f.index == FIELD_REMAINDER) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(shift && !ctrl) {
            if(state.lastPlanted >= 0 && crops[state.lastPlanted]) {
              var c = crops[state.lastPlanted];
              actions.push({type:ACTION_PLANT, x:x, y:y, crop:c, shiftPlanted:true});
              update();
            } else {
              showMessage(shiftClickPlantUnset, C_INVALID, 0, 0);
            }
          } else if(ctrl && !shift) {
            actions.push({type:ACTION_PLANT, x:x, y:y, crop:crops[short_0], ctrlPlanted:true});
            update();
          } else if(!fern) {
            makeFieldDialog(x, y);
          }
        } else if(f.hasCrop()) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(shift && !ctrl && state.allowshiftdelete) {
            var c = crops[state.lastPlanted];
            var c2 = f.getCrop();
            if(c2.index == state.lastPlanted && c2.type != CROPTYPE_SHORT && !f.isFullGrown()) {
              // one exception for the shift+click to replace: if crop is growing and equals your currently selected crop,
              // it means you may have just accidently planted it in wrong spot. deleting it is free (other than lost growtime,
              // but player intended to have it gone anyway by shift+clicking it even when replace was intended)
              actions.push({type:ACTION_DELETE, x:x, y:y});
            } else {
              actions.push({type:ACTION_REPLACE, x:x, y:y, crop:c, shiftPlanted:true});
            }
            update();
          } else if(ctrl && !shift && state.allowshiftdelete) {
            if(state.allowshiftdelete) {
              actions.push({type:ACTION_DELETE, x:x, y:y});
              update();
            } else {
              showMessage('ctrl+click to delete must be enabled in the settings before it is allowed', C_INVALID, 0, 0);
            }
          } else if(!fern) {
            makeFieldDialog(x, y);
          }
        }
      }, x, y, div));

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

    var label = 'field tile ' + x + ', ' + y;

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
      label = c.name + '. ' + label;
    } else if(f.index == FIELD_TREE_TOP) {
      renderImage(tree_images[treeLevelIndex(state.treelevel)][1][season], fd.canvas);
      label = 'tree level ' + state.treelevel + '. ' + label;
    } else if(f.index == FIELD_TREE_BOTTOM) {
      renderImage(tree_images[treeLevelIndex(state.treelevel)][2][season], fd.canvas);
      label = 'tree level ' + state.treelevel + '. ' + label;
      if(state.treelevel > 0 || state.res.spores.gtr(0)) renderLevel(fd.canvas, state.treelevel, 0, 11, progresspixel);
    } else if(f.index == FIELD_REMAINDER) {
      renderImage(image_watercress_remainder, fd.canvas);
      setProgressBar(fd.progress, -1, undefined);
    } else if(f.index == FIELD_ROCK) {
      var image_index = Math.floor(util.pseudoRandom2D(x, y, 245643) * 4);
      renderImage(images_rock[image_index], fd.canvas);
      label = 'rock. ' + label;
      setProgressBar(fd.progress, -1, undefined);
    } else {
      setProgressBar(fd.progress, -1, undefined);
      fd.div.innerText = '';
      unrenderImage(fd.canvas);
    }
    if(state.fern && x == state.fernx && y == state.ferny) {
      blendImage((state.fern == 2 ? images_fern2 : images_fern)[season], fd.canvas);
      label = 'fern. ' + label;
    } else if(f.index == 0) {
      label = 'empty ' + label;
    }

    setAriaLabel(fd.div, label);
  }
  if(f.hasCrop() && f.growth < 1) {
    var c = f.getCrop();
    setProgressBar(fd.progress, f.growth, c.type == CROPTYPE_SHORT ? '#0c0' : '#f00');
  }
}
