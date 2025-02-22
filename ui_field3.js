/*
Ethereal Farm
Copyright (C) 2020-2025  Lode Vandevenne

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
  result += 'Crop type: Infinity ' + getCropTypeName(c.type);
  if(c.tier == -1) {
    result += ' (tier: translucent)';
  } else if(c.tier > 0 || (state.infinity_ascend && c.tier >= 0)) {
    result += ' (tier ' + (c.tier + 1) + ')';
  }

  var help = getCropTypeHelp3(c.type, state);
  if(help) {
    result += '<br/>' + help;
  }
  result += '<br/><br/>';

  if(brassicaNoSelfSutain(f)) {
    result += '<span class="efWarningOnDialogText">Warning: this brassica is not producing enough infinity seeds to sustain its own lifetime cost, place fishes such as shrimp and goldfish in the pond to increase production!</span>';
    result += '<br/><br/>';
  }

  if(f.growth < 1) {
    if(c.type == CROPTYPE_BRASSICA) {
      if(opt_detailed) {
        // the detailed dialog is not dynamically updated, so show the life growth time statically instead.
        result += 'Finite lifetime: ' + util.formatDuration(c.getPlantTime()) + '<br/><br/>';
      } else {
        var text0 = 'Finite lifetime';
        var growthremaining = f.growth;
        result += text0 + '. Time left: ' + util.formatDuration(growthremaining * c.getPlantTime(), true, 4, true) + ' of ' + util.formatDuration(c.getPlantTime(), true, 4, true) + '<br/>';
      }

      result += '<br/>';
    } else {
      result += 'Grow time: ' + util.formatDuration(c.getPlantTime());
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
    var perhour = prod.infspores.eqr(0) ? prod.infseeds.mulr(3600) : prod.infspores.mulr(3600);
    result += ' (' + perhour.toString() + '/h)';
    var baseprod = c.getProd(undefined);
    if(baseprod.infseeds.neq(prod.infseeds)) {
      result += '<br/>';
      result += 'Base production/s: ' + baseprod.toString();
      /*if(baseprod.infseeds.neqr(0) && baseprod.infseeds.ltr(0.1) && baseprod.infseeds.gtr(-0.1))*/ result += ' (' + baseprod.infseeds.mulr(3600).toString() + '/h)';
    }
    result += '<br/><br/>';
  }

  var infboost = c.getInfBoost(f);
  if(infboost.neqr(0)) {
    if(c.type == CROPTYPE_RUNESTONE) {
      result += 'Boost to neighboring crops basic field boost: ' + infboost.toPercentString();
    } else if(c.type == CROPTYPE_BEE) {
      result += 'Boost to neighboring flowers: ' + infboost.toPercentString();
    } else if(c.type == CROPTYPE_FLOWER) {
      result += 'Boost to neighboring berries: ' + infboost.toPercentString();
    } else if(c.type == CROPTYPE_STINGING) {
      result += 'Boost to neighboring mushrooms: ' + infboost.toPercentString();
    } else if(c.type == CROPTYPE_FERN) {
      result += 'Copy: ' + infboost.toPercentString();
    } else {
      result += 'Boost: ' + infboost.toPercentString();
    }
    result += '<br><br>';
  }

  var basicboost = c.getBasicBoost(f);
  if(basicboost.neqr(0)) {
    var base = c.getBaseBasicBoost();
    result += 'Production boost to basic field: ' + basicboost.toPercentString();
    if(base.neq(basicboost)) result += ' (base: ' + base.toPercentString() + ')';
    result += '<br/><br/>';
  }

  var recoup = c.getRecoup(f);
  var upgrade_cost = [undefined];
  var upgrade_crop = getUpgradeCrop3(f.x, f.y, false, upgrade_cost);

  if(opt_detailed) {
    result += 'Have of this crop: ' + state.crop3count[c.index];
    result += '<br/><br/>';
  }

  var cost = c.getCost();
  result += ' • Base cost: ' + c.getBaseCost().toString() + '<br>';
  result += ' • Next planting cost: ' + cost.toString() + ' (' + getCostAffordTimer(cost) + ')<br>';
  result += ' • Recoup on delete: ' + recoup.toString() + ' (100% full refund)';
  if(upgrade_crop && upgrade_cost[0]) {
    var tier_diff = upgrade_crop.tier - c.tier;
    var tier_diff_text = tier_diff > 1 ? (' (+' + tier_diff + ')' ) : '';
    result += '<br/> • Upgrade tier' + tier_diff_text + ' cost: ' + upgrade_cost[0].toString() + ' (' + getCostAffordTimer(upgrade_cost[0]) + ')';
  }

  return result;
}


function getCropInfoHTML3Breakdown(f, c) {
  var result = '';

  if(c.type == CROPTYPE_BERRY || c.type == CROPTYPE_NUT || c.type == CROPTYPE_MUSH || c.type == CROPTYPE_BRASSICA) {
    var breakdown = [];
    var total = c.getProd(f, breakdown);
    result += formatBreakdown(breakdown, false, 'Breakdown (production/s)');
  }

  if(c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_BEE || c.type == CROPTYPE_STINGING) {
    var breakdown = [];
    var total = c.getInfBoost(f, breakdown);
    result += formatBreakdown(breakdown, true, 'Breakdown (neighbor boost +%)');
  }

  if(c.type == CROPTYPE_RUNESTONE) {
    var breakdown = [];
    var total = c.getInfBoost(f, breakdown);
    result += formatBreakdown(breakdown, true, 'Breakdown (neighbor basic boost +%)');
  }

  if(c.type == CROPTYPE_FERN) {
    var breakdown = [];
    var total = c.getInfBoost(f, breakdown);
    result += formatBreakdown(breakdown, true, 'Breakdown (same tier field copy %)');
  }

  var breakdown = [];
  var total = c.getBasicBoost(f, breakdown);
  if(total.neqr(0) || breakdown.length > 1) {
    result += formatBreakdown(breakdown, true, 'Breakdown (boost to basic field)');
  }

  return result;
}

// opt_cost is output variable that contains the cost and a boolean that tells if it's too expensive
// single: go just one tier up, rather than to the max affordable
function getUpgradeCrop3(x, y, single, opt_cost) {
  if(!state.field3[y]) return null;
  var f = state.field3[y][x];
  if(!f) return null;
  var c = f.getCrop();
  if(!c) return null;

  if(c.type == CROPTYPE_CHALLENGE) return null;
  var tier = state.highestoftype3unlocked[c.type];
  if(single && tier > c.tier + 1) tier = c.tier + 1;
  // hardcode translucent mushroom, it has tier -1 while first main mushroom type has tier 4
  if(single && state.infinity_ascend && c.type == CROPTYPE_MUSH && c.tier == -1) tier = 4;

  var recoup = c.getRecoup(f);

  var c2 = null;

  for(;;) {
    if(tier <= c.tier) break; // not an upgrade
    if(tier < 0) break;

    var c3 = croptype3_tiers[c.type][tier];
    if(!c3 || !state.crops3[c3.index].unlocked) break; // normally cannot happen that a lower tier crop is not unlocked

    var cost = c3.getCost().sub(recoup);
    if(opt_cost != undefined) {
      opt_cost[0] = cost;
      c2 = c3;
    }

    if(cost.le(state.res)) {
      // found a successful upgrade
      if(opt_cost != undefined) opt_cost[1] = false;
      break;
    } else {
      if(opt_cost != undefined) opt_cost[1] = true;
    }

    tier--;
  }

  return c2;
}

function getDowngradeCrop3(x, y, opt_cost) {
  if(!state.field3[y]) return null;
  var f = state.field3[y][x];
  if(!f) return null;
  var c = f.getCrop();
  if(!c) return null;

  if(c.type == CROPTYPE_CHALLENGE) return null;
  var tier = c.tier - 1;
  // hardcode translucent mushroom, it has tier -1 while first main mushroom type has tier 4
  if(state.infinity_ascend && c.type == CROPTYPE_MUSH && c.tier == 4) tier = -1;
  if(tier < -1) return null;

  var recoup = c.getRecoup();

  var c2 = null;

  var c3 = croptype3_tiers[c.type][tier];
  if(!c3 || !state.crops3[c3.index].unlocked) return null;

  var cost = c3.getCost().sub(recoup);
  if(opt_cost != undefined) {
    opt_cost[0] = cost;
    c2 = c3;
  }

  // a downgrade may be more expensive if you have way more of that crop so it scaled up a lot
  if(cost.le(state.res)) {
    if(opt_cost != undefined) opt_cost[1] = false;
  } else {
    if(opt_cost != undefined) opt_cost[1] = true;
  }

  return c2;
}


// single: go just one tier up, rather than to the max affordable
function makeUpgradeCrop3Action(x, y, single, opt_silent) {
  var too_expensive = [undefined];
  var c3 = getUpgradeCrop3(x, y, single, too_expensive);

  if(c3 && !too_expensive[1]) {
    addAction({type:ACTION_REPLACE3, x:x, y:y, crop:c3, shiftPlanted:true});
    return true;
  }

  var f = state.field3[y][x];
  var is_brassica = false;
  if(f && f.hasRealCrop() && f.getCrop().type == CROPTYPE_BRASSICA && f.growth < 1) {
    is_brassica = true;
    // allow also refreshing watercress this way
    var highest = getHighestAffordableBrassica3(f.getCrop().getRecoup(f));
    var highest2 = getHighestBrassica3();
    if(highest >= f.getCrop().index && (highest2 <= highest || f.growth < 0.9)) {
      addAction({type:ACTION_REPLACE3, x:x, y:y, crop:crops3[highest], ctrlPlanted:true, silent:opt_silent});
      return true;
    }
  }

  if(!opt_silent) {
    if(too_expensive[1]) {
      showMessage('not enough resources for next infinity crop tier: have ' + Res.getMatchingResourcesOnly(too_expensive[0], state.res).toString() +
          ', need ' + too_expensive[0].toString() + ' (' + getCostAffordTimer(too_expensive[0]) + ')', C_INVALID, 0, 0);
    } else if(!(x >= 0 && x < state.numw3 && y >= 0 && y < state.numh3) || state.field3[y][x].index < CROPINDEX) {
      showMessage('No crop to upgrade tier here. Move mouse cursor over a crop and press u to upgrade it to the next tier', C_INVALID);
    } else if(is_brassica) {
      showMessage('Not enough resources to refresh brassica', C_INVALID);
    } else {
      showMessage('Crop not replaced, no higher tier unlocked or available', C_INVALID);
    }
  }

  return false;
}

function makeDowngradeCrop3Action(x, y, opt_silent) {
  var too_expensive = [undefined];
  var c2 = getDowngradeCrop3(x, y, too_expensive);

  if(c2 && !too_expensive[1]) {
    addAction({type:ACTION_REPLACE3, x:x, y:y, crop:c2, shiftPlanted:true});
  } else if(c2 && too_expensive[1]) {
    // TODO: instead go to an even lower tier?
    showMessage('not enough resources for lower crop tier: have ' + Res.getMatchingResourcesOnly(too_expensive[0], state.res).toString() + ', need ' + too_expensive[0].toString() + '. This can happen if you have a lot of the lower tier crop planted.', C_INVALID, 0, 0);
  } else if(!c2) {
    showMessage('Crop not replaced, no lower tier available', C_INVALID);
  }
  return true;
}

function makeInfinityAscensionDialog() {
  var functions = [];
  var names = [];

  var numreqs = 0;

  var reqtext = '';
  if(!state.medals[medal_runestone8].earned) {
    reqtext += '• Place 8 runestones at the same time on the infinity field.';
    reqtext += '<br>';
    numreqs++;
  }
  for(var i = 0; i < registered_crops3.length; i++) {
    var c = crops3[registered_crops3[i]];
    var c2 = state.crops3[registered_crops3[i]];
    if(c.index == mush3_t) continue; // the translucent mushroom is post-ascend only
    if(!c2.had) {
      reqtext += '• Plant a ' + c.name + ' on the infinity field.';
      reqtext += '<br>';
      numreqs++;
    }
  }
  for(var i = 0; i < registered_fishes.length; i++) {
    var c = fishes[registered_fishes[i]];
    var c2 = state.fishes[registered_fishes[i]];
    if(c.index == eel_t) continue; // the translucent eel is post-ascend only
    if(c.index == tang_t) continue; // the translucent tang is post-ascend only
    if(c.index == jellyfish_t) continue; // the iridescent jellyfish is post-ascend only
    if(!c2.had) {
      reqtext += '• Place a ' + c.name + ' in the pond.';
      reqtext += '<br>';
      numreqs++;
    }
  }

  var text = '';

  text += '<b>Requirements</b>';
  text += '<br><br>';

  if(numreqs) {
    text += 'Not all the requirements for infinity ascenscion are met yet. Place the following plants or fishes to earn all the associated achievements first (it\'s not necessarily to meet all these requirements at the same time, each can be done at any time to check it off):'
         + '<br><br>' + reqtext;
  } else {
    text += 'All the requirements for infinity ascenscion are met! All possible infinity crops and fishes placed.';
    functions.push(function() {
      closeAllDialogs();
      addAction({type:ACTION_INFINITY_ASCEND});
      update();
    });
    names.push('Ascend now');
  }
  text += '<br><br>';
  text += '<b>Infinity Ascension</b>';
  text += '<br><br>';
  text += 'Infinity ascenscion will reset the entire infinity field progress back to the beginning. All unlocked infinity crops, pond, fishes, infinity seeds and infinity spores will be reset. The basic and ethereal fields are not affected, other than the temporary loss of the current infinity bonuses. A permanent infinity ascension bonus will be given to the basic field production, resin and twigs, and regular infinity bonuses can be gained again over time from the next infinity field. The new infinity field, and pond (once unlocked), will be larger than the current iterations.';
  text += '<br><br>';
  text += 'WARNING: Since infinity ascenscion might give a temporary decrease of basic field production, choose a convenient time to do it. Initially, the total bonus to the basic field will be lower than what you get from the infinity field now (depending on the current layout), so there will be a temporary setback of a few weeks. However, the new infinity field will surpass the current bonus eventually, so this is worth doing in the end.';

  var dialog = createDialog({
    icon:image_infinity_ascend,
    title:'Infinity ascension requirements',
    bgstyle:'efDialogTranslucent',
    scrollable:true,
    cancelname:'back',
    functions:functions,
    names:names
  });
  var content = dialog.content.div;

  content.innerHTML = text;
}


function makeField3Dialog(x, y) {
  var f = state.field3[y][x];
  var fd = field3Divs[y][x];

  if(f.hasCrop()) {
    var c = crops3[f.cropIndex()];
    var div;

    var updatedialogfun = bind(function(f, c, flex) {
      var html0 = getCropInfoHTML3(f, c, false);
      if(html0 != last0) {
        flex0.div.innerHTML = html0;
        last0 = html0;
      }
    }, f, c);

    var dialog = createDialog({
      icon:c.image[4],
      title:'Infinity crop info',
      bgstyle:'efDialogTranslucent',
      updatedialogfun:updatedialogfun
    });

    var buttonshift = -0.08;

    var flex0 = new Flex(dialog.content, 0, [0, 0, 0.01], 1, 0.17);
    var last0 = undefined;


    if(f.getCrop().index == mistletoe3_11) {
      var button0 = new Flex(dialog.content, [0, 0, 0.2], [0.63 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.695 + buttonshift).div;
      var button1 = new Flex(dialog.content, [0, 0, 0.2], [0.7 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.765 + buttonshift).div;
      var button2 = new Flex(dialog.content, [0, 0, 0.2], [0.77 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.835 + buttonshift).div;
      var button3 = new Flex(dialog.content, [0, 0, 0.2], [0.84 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.905 + buttonshift).div;

      styleButton(button0);
      button0.textEl.innerText = 'Infinity ascension';
      button0.textEl.classList.add('efButtonInfinityAscend');
      registerTooltip(button0, 'Infinity ascension');
      addButtonAction(button0, function() {
        makeInfinityAscensionDialog();
      });

      styleButton(button2);
      button2.textEl.innerText = 'Replace crop';
      registerTooltip(button2, 'Replace the crop with a new one you choose, same as delete then plant. Shows the list of unlocked infinity crops.');
      addButtonAction(button2, function() {
        makePlantDialog3(x, y, true, c.getRecoup(f));
      });

      styleButton(button3);
      button3.textEl.innerText = 'Delete crop';
      button3.textEl.style.color = '#c00';
      if(c.type == CROPTYPE_BRASSICA) registerTooltip(button3, 'Delete crop, get ' + (cropRecoup3 * 100) + '% of the original cost back, scaled down by the remaining lifetime.');
      else registerTooltip(button3, 'Delete crop, get ' + (cropRecoup3 * 100) + '% of the original cost back.');
      addButtonAction(button3, function() {
        addAction({type:ACTION_DELETE3, x:x, y:y});
        closeAllDialogs();
        update(); // do update immediately rather than wait for tick, for faster feeling response time
      });
    } else {
      var button0 = new Flex(dialog.content, [0, 0, 0.2], [0.63 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.695 + buttonshift).div;
      var button1 = new Flex(dialog.content, [0, 0, 0.2], [0.7 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.765 + buttonshift).div;
      var button2 = new Flex(dialog.content, [0, 0, 0.2], [0.77 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.835 + buttonshift).div;
      var button3 = new Flex(dialog.content, [0, 0, 0.2], [0.84 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.905 + buttonshift).div;
      var button4 = new Flex(dialog.content, [0, 0, 0.2], [0.91 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.975 + buttonshift).div;
      styleButton(button0);
      button0.textEl.innerText = 'Upgrade tier';
      registerTooltip(button0, 'Replace crop with the highest tier of this type you can afford. This deletes the original crop (which gives refund), and then plants the new higher tier crop.');
      addButtonAction(button0, function() {
        makeUpgradeCrop3Action(x, y, false);
        closeAllDialogs();
        update();
      });

      styleButton(button1);
      button1.textEl.innerText = 'Downgrade tier';
      registerTooltip(button1, 'Replace crop with the tier one below, refunding the cost of the current one, then planting the lower tier crop with the lower resource cost.');
      addButtonAction(button1, function() {
        if(makeDowngradeCrop3Action(x, y)) {
          closeAllDialogs();
          update();
        }
      });

      styleButton(button2);
      button2.textEl.innerText = 'Replace crop';
      registerTooltip(button2, 'Replace the crop with a new one you choose, same as delete then plant. Shows the list of unlocked infinity crops.');
      addButtonAction(button2, function() {
        makePlantDialog3(x, y, true, c.getRecoup(f));
      });

      styleButton(button3);
      button3.textEl.innerText = 'Delete crop';
      button3.textEl.style.color = '#c00';
      if(c.type == CROPTYPE_BRASSICA) registerTooltip(button3, 'Delete crop, get ' + (cropRecoup3 * 100) + '% of the original cost back, scaled down by the remaining lifetime.');
      else registerTooltip(button3, 'Delete crop, get ' + (cropRecoup3 * 100) + '% of the original cost back.');
      addButtonAction(button3, function() {
        addAction({type:ACTION_DELETE3, x:x, y:y});
        closeAllDialogs();
        update(); // do update immediately rather than wait for tick, for faster feeling response time
      });

      styleButton(button4);
      button4.textEl.innerText = 'Detailed stats / bonuses';
      registerTooltip(button4, 'Show breakdown of multipliers and bonuses and other detailed stats.');
      addButtonAction(button4, function() {
        var dialog = createDialog({
          size:DIALOG_LARGE,
          title:'Detailed crop stats',
          scrollable:true,
          icon:c.image[4],
          bgstyle:'efDialogTranslucent'
        });
        var flex = dialog.content;
        var text = '';

        text += getCropInfoHTML3(f, c, true);
        text += '<br/>';
        text += getCropInfoHTML3Breakdown(f, c);
        dialog.content.div.innerHTML = text;
      });
    }
    updatedialogfun();
  } else if(f.index == FIELD_POND) {
    makePond3Dialog();
  } else {
    makePlantDialog3(x, y);
  }
}

function field3CellTooltipFun(x, y, div) {
  var f = state.field3[y][x];
  var fd = field3Divs[y][x];

  if(state.infspawn && x == state.infspawnx && y == state.infspawny) {
    return 'infinity symbol: spawns roughly daily. Provides some resin.';
  }

  var result = undefined;
  if(f.index == 0) {
    return undefined; // no tooltip for empty fields, it's a bit too spammy when you move the mouse there
  } else if(f.index == FIELD_POND) {
    var text = 'Infinity pond';
    if(state.infinityboost.gtr(0) || state.numfishes) {
      text += '<br><br>';
      text += 'Total boost from infinity crops to basic field: ' + state.infinityboost.toPercentString();
      if(state.fishes[jellyfish_t].unlocked) {
        var bonus = getFishMultiplier(FISHTYPE_JELLYFISH, state, 3).subr(1);
        text += '<br><br>';
        text += 'Boost from jellyfish to resource-producing neighbors of pond: ' + bonus.toPercentString();
      }
      if(!Num.near(state.expected_infinityboost, state.infinityboost, 0.001)) {
        var time_remaining = MAXINFTOBASICDELAY - (state.c_runtime - state.infinity_prodboost_time + state.infinity_prodboost_time_shift);
        text += '. After time-weighting (⏳): ' + state.expected_infinityboost.toPercentString();
        text += ', ' + util.formatDuration(time_remaining, true);
      }

      if(state.numfishes > 0) text += '<br><br> Fishes: ' + state.numfishes;
    }
    if(someInfinityEffectIsTimeWeighted(1)) {
      text += '<br><br> Some fish effects are currently time-weighted (⏳) due to recently changing the fishes.';
    } else if(someInfinityEffectIsTimeWeighted(2)) {
      // Disabled, already said in the 'After time-weighting...' above.
      //text += '<br><br> The production boost to basic field is currently time-weighted (⏳) due to recently increasing it.';
    }
    return text;
  } else if(f.hasCrop()) {
    var c = crops3[f.cropIndex()];
    result = getCropInfoHTML3(f, c, false);
  }
  return result;
}

function field3CellClickFun(x, y, div, shift, ctrl) {
  var f = state.field3[y][x];

  if(state.infspawn && x == state.infspawnx && y == state.infspawny && !ctrl && !shift) {
    addAction({type:ACTION_INFSPAWN, x:x, y:y});
    update();
    return;
  }

  if(f.index == FIELD_POND) {
    makeField3Dialog(x, y);
  } else if(f.index == 0 || f.index == FIELD_REMAINDER) {
    if(shift && ctrl) {
      // experimental feature for now [same as in basic field], most convenient behavior needs to be found
      // current behavior: plant crop of same type as lastPlanted, but of highest tier that's unlocked and you can afford. Useful in combination with ctrl+shift picking when highest unlocked one is still too expensive and you wait for automaton to upgrade the plant
      if(state.lastPlanted3 >= 0 && crops3[state.lastPlanted3]) {
        var c = crops3[state.lastPlanted3];
        var tier = state.highestoftype3unlocked[c.type];
        var c3 = croptype3_tiers[c.type][tier];
        if(c.type == CROPTYPE_CHALLENGE) c3 = c;
        if(!c3 || !state.crops3[c3.index].unlocked) c3 = c;
        if(c3.getCost().gt(state.res) && tier > 0) {
          tier--;
          var c4 = croptype3_tiers[c.type][tier];
          if(c4 && state.crops3[c4.index].unlocked) c3 = c4;
        }
        if(c3.getCost().gt(state.res) && tier > 0) {
          tier--;
          var c4 = croptype3_tiers[c.type][tier];
          if(c4 && state.crops3[c4.index].unlocked) c3 = c4;
        }
        if(c3.getCost().gt(state.res)) {
          tier = -1; // template
          var c4 = croptype3_tiers[c.type][tier];
          if(c4 && state.crops3[c4.index].unlocked) c3 = c4;
        }
        addAction({type:ACTION_PLANT3, x:x, y:y, crop:c3, shiftPlanted:true});
        update();
      }
    } else if(shift && !ctrl) {
      if(state.lastPlanted3 >= 0 && crops3[state.lastPlanted3]) {
        var c = crops3[state.lastPlanted3];
        addAction({type:ACTION_PLANT3, x:x, y:y, crop:c, shiftPlanted:true});
        update();
      } else {
        showMessage(shiftClickPlantUnset, C_INVALID, 0, 0);
      }
    } else if(ctrl && !shift) {
      addAction({type:ACTION_PLANT3, x:x, y:y, crop:crops3[getHighestAffordableBrassica3()], shiftPlanted:true});
      update();
    } else {
      makeField3Dialog(x, y);
    }
  } else if(f.hasCrop()) {
    if(ctrl && shift) {
      // experimental feature [same as in basic field] for now, most convenient behavior needs to be found
      // behavior implemented here: if safe, "pick" clicked crop type, but then the best unlocked one of its tier. If unsafe permitted, immediately upgrade to highest type, and still pick highest tier too whether or not it changed
      // other possible behaviors: pick crop type (as is), open the crop replace dialog, ...
      var c2 = f.getCrop();
      var c3 = croptype3_tiers[c2.type][state.highestoftype3unlocked[c2.type]];
      if(!c3 || !state.crops3[c3.index].unlocked) c3 = c2;
      if(c2.type == CROPTYPE_CHALLENGE) c3 = c2;
      state.lastPlanted3 = c3.index;
      if(c3.getCost().gt(state.res)) state.lastPlanted3 = c2.index;
      if(c3.tier > c2.tier) {
        addAction({type:ACTION_REPLACE3, x:x, y:y, crop:c3, shiftPlanted:true});
        update();
      }
    } else if(ctrl && !shift) {
      addAction({type:ACTION_DELETE3, x:x, y:y});
      update();
    } else if(shift && !ctrl) {
      if(state.lastPlanted3 >= 0 && crops3[state.lastPlanted3]) {
        var c = crops3[state.lastPlanted3];
        var c2 = f.getCrop();
        if(c2.index == state.lastPlanted3 && ((c2.type != CROPTYPE_BRASSICA && !f.isFullGrown()) || f.isTemplate() || f.isGhost())) {
          // one exception for the shift+click to replace: if crop is growing and equals your currently selected crop,
          // it means you may have just accidently planted it in wrong spot. deleting it is free (other than lost growtime,
          // but player intended to have it gone anyway by shift+clicking it even when replace was intended)
          addAction({type:ACTION_DELETE3, x:x, y:y});
        } else {
          addAction({type:ACTION_REPLACE3, x:x, y:y, crop:c, shiftPlanted:true});
        }
        update();
      }
    } else {
      makeField3Dialog(x, y);
    }
  } else {
    makeField3Dialog(x, y);
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
      var canvas = createCanvas('0%', '0%', '100%', '100%', celldiv);
      var div = makeDiv('0', '0', '100%', '100%', celldiv);
      setAriaRole(celldiv, 'cell');
      div.className = 'efNoOutline';
      div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
      centerText(div);

      field3Divs[y][x].div = div;
      field3Divs[y][x].canvas = canvas;

      util.setEvent(div, 'mouseover', bind(function(x, y) {
        updateField3MouseOver(x, y);
      }, x, y), 'fieldover');
      util.setEvent(div, 'mouseout', bind(function(x, y) {
        updateField3MouseOut(x, y);
      }, x, y), 'fieldout');
      // on mouse up and with timeout so that the state is fully updated after the action that the click caused
      util.setEvent(div, 'mouseup', bind(function(x, y) {
        window.setTimeout(function(){updateField3MouseClick(x, y)});
      }, x, y), 'fieldclick');

      div.style.cursor = 'pointer';
      registerAction(div, bind(field3CellClickFun, x, y, div), 'click field cell', {
        label_shift:'(over)plant selected crop',
        label_ctrl:'delete crop or plant brassica',
        label_ctrl_shift:'select crop or plant highest tier',
        tooltip:bind(field3CellTooltipFun, x, y, div),
        tooltip_poll:true
      });

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

function brassicaNoSelfSutain(f) {
  var brassica_no_selfsustain = false;
  if(f.hasCrop()) {
    var c = f.getCrop();
    if(c.type == CROPTYPE_BRASSICA) {
      var prod = c.getProd(f);
      if(prod.infseeds.le(c.minForBrassicaSelfSustain())) {
        brassica_no_selfsustain = true;
      }
      if(c.tier >= 8 && state.fishtypecount[FISHTYPE_SHRIMP] == 0) {
        // also indicate if it can barely self-sustain but you have no shrimp, for high enough tiers where shrimp really matters
        brassica_no_selfsustain = true;
      }
    }
  }
  return brassica_no_selfsustain;
}

// This function is only intended to be used for display purposes, such as icons and tooltips
// opt_fish: if 0, any effect counts. if 1, only fish effects. if 2, only more generic (not individual fish) effects (but a fish may still be part of it)
function someInfinityEffectIsTimeWeighted(opt_fish) {
  // multiplication with this threshold is there to not show the hourglass icon all the time whenever changing infinity crops in the infinity field, only when there's a significant
  // change in boost, it'll start showing the icon
  var show_threshold = 0.875;
  // this one is based on actual current production, so hour glass will also disappear a bit before the actual time runs out, but not as fast as the show_threshold
  var show_threshold2 = 0.95;
  if(opt_fish != 2) {
    if(state.c_runtime - state.fish_resinmul_time < MAXINFTOBASICDELAY &&
       state.fish_resinmul_weighted.lt(state.fish_resinmul_last.mulr(show_threshold)) &&
       getFishMultiplier(FISHTYPE_TANG, state, 3).lt(state.fish_resinmul_last.mulr(show_threshold2))) {
      return true;
    }
    if(state.c_runtime - state.fish_twigsmul_time < MAXINFTOBASICDELAY &&
       state.fish_twigsmul_weighted.lt(state.fish_twigsmul_last.mulr(show_threshold)) &&
       getFishMultiplier(FISHTYPE_EEL, state, 3).lt(state.fish_twigsmul_last.mulr(show_threshold2))) {
      return true;
    }
  }
  if(opt_fish != 1) {
    if(state.c_runtime - state.infinity_prodboost_time < MAXINFTOBASICDELAY &&
       state.infinity_prodboost_weighted.lt(state.infinity_prodboost_last.mulr(show_threshold)) &&
       state.infinityboost.lt(state.infinity_prodboost_last.mulr(show_threshold2))) {
      return true;
    }
  }
  return false;
}

function updateField3CellUI(x, y) {
  var f = state.field3[y][x];
  var fd = field3Divs[y][x];
  var growstage = (f.growth >= 1) ? 4 : Math.min(Math.floor(f.growth * 4), 3);
  var season = 6; // infinity season

  var progresspixel = -1;

  var infspawncode = ((state.infspawnx + state.infspawny * state.numw) << 4) | state.infspawn;

  var brassica_no_selfsustain = brassicaNoSelfSutain(f);

  var timeweighted = (f.index == FIELD_POND && someInfinityEffectIsTimeWeighted());
  var toprightpond = false;

  if(fd.index != f.index || fd.growstage != growstage || season != fd.season || infspawncode != fd.infspawncode || progresspixel != fd.progresspixel || brassica_no_selfsustain != fd.brassica_no_selfsustain || fd.timeweighted != timeweighted) {
    fd.index = f.index;
    fd.growstage = growstage;
    fd.season = season;
    fd.infspawncode = infspawncode;
    fd.progresspixel = progresspixel;
    fd.brassica_no_selfsustain = brassica_no_selfsustain;
    fd.timeweighted = timeweighted;

    var r = util.pseudoRandom2D(x, y, 55555);
    var fieldim = images_field[season];
    var field_image = r < 0.25 ? fieldim[0] : (r < 0.5 ? fieldim[1] : (r < 0.75 ? fieldim[2] : fieldim[3]));
    if(f.index == FIELD_POND) field_image = fieldim[4];
    renderImage(field_image, fd.canvas);

    var label = 'infinity field tile ' + x + ', ' + y;

    if(f.hasCrop()) {
      var c = crops3[f.cropIndex()];
      var image = c.image[growstage];
      blendImage(image, fd.canvas);
      label = c.name + '. ' + label;
    } else if(f.index == FIELD_POND) {
      if(x + 1 < state.numw3 && y + 1 < state.numh3 && state.field3[y + 1][x + 1].index == FIELD_POND) {
        blendImage(image_pond_2x2_00, fd.canvas);
      } else if(x > 0 && y + 1 < state.numh3 && state.field3[y + 1][x - 1].index == FIELD_POND) {
        toprightpond = true;
        blendImage(image_pond_2x2_01, fd.canvas);
      } else if(x + 1 < state.numw3 && y > 0 && state.field3[y - 1][x + 1].index == FIELD_POND) {
        blendImage(image_pond_2x2_10, fd.canvas);
      } else if(x > 0 && y > 0 && state.field3[y - 1][x - 1].index == FIELD_POND) {
        blendImage(image_pond_2x2_11, fd.canvas);
      } else {
        blendImage(image_pond, fd.canvas);
        toprightpond = true;
      }
    } else if(f.index == FIELD_REMAINDER) {
      blendImage(image_watercress_remainder3, fd.canvas);
    } else {
      fd.div.innerText = '';
    }
    if(state.infspawn && x == state.infspawnx && y == state.infspawny) {
      blendImage(image_infspawn, fd.canvas);
      label = 'infinity symbol. ' + label;
    }
    if(brassica_no_selfsustain) {
      blendImage(image_exclamation_small, fd.canvas);
    }
    if(timeweighted && toprightpond) {
      blendImage(image_small_hourglass, fd.canvas);
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


