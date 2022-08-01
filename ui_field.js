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


var fieldRows;
var fieldDivs;

// works both if it's a breakdown of numbers or of resources
// percent will multiply by 100 and show percentage, this only makes sense for numbers
function formatBreakdown(breakdown, percent, title) {
  var result = '';
  result += '<br/>' + title + ':<br/>';
  for(var i = 0; i < breakdown.length; i++) {
    result += '• ' + breakdown[i][0];
    var bonus = breakdown[i][2];
    if(breakdown[i][1]) {
      // multiplicative
      if(bonus.gtr(0) && bonus.ltr(0.05)) {
        // a very low multiplier malus, like * 0.00001, would show up simply as -100% which doesn't give any information.
        // show as a division with obelus sign
        // TODO: this symbol when rendered in small font looks a bit like a +, find some other clear notation
        result += ': ÷ ' + bonus.inv().toString();
        //result += ': ' + bonus.toString() + 'x';
      } else {
        var p = (bonus.subr(1)).toPercentString();
        if(p && p[0] != '-' && p[0] != '+') p = '+' + p;
        if(bonus != undefined && i > 0) result += ': ' + p; // first is base production
      }
    } else {
      // additive
      if(bonus != undefined && i > 0) result += ': ' + (bonus).toString();
    }
    var after = breakdown[i][3];
    if(after != undefined) {
      result += (i == 0) ? ': ' : ' ⇒ ';
      if(percent) {
        result += after.toPercentString();
      } else {
        result += after.toString();
      }
    }
    result += '<br/>';
  }
  return result;
}

// get crop info in HTML
function getCropInfoHTMLBreakdown(f, c) {
  var result = '';

  var bdname = f.isSemiFullGrown() ? 'Breakdown' : 'Preliminary breakdown';

  var p = prefield[f.y][f.x];
  var breakdown_watercress = p.getBreakdownWatercress();
  if(breakdown_watercress && breakdown_watercress.length > 0) {
    result += formatBreakdown(breakdown_watercress, true, bdname + ' (copy)');
  }
  var prod = c.getProd(f);
  if(!prod.empty() || c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH || c.type == CROPTYPE_NUT) {
    var breakdown = p.getBreakdown();
    result += formatBreakdown(breakdown, false, bdname + ' (production/s)');
  }
  if(c.boost.neqr(0) && (c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_STINGING)) {
    var breakdown = p.getBreakdown();
    result += formatBreakdown(breakdown, true, bdname + ' (neighbor boost +%)');
  }
  if(c.boost.neqr(0) && (c.type == CROPTYPE_BEE)) {
    var breakdown = p.getBreakdown();
    result += formatBreakdown(breakdown, true, bdname + ' (flower boost +%)');
  }

  return result;
}

// get crop info in HTML
function getCropInfoHTML(f, c, opt_detailed) {
  var c2 = state.crops[c.index];
  var result = upper(c.name);
  if(c.basic_upgrade != null) {
    result += ' level ' + state.upgrades[c.basic_upgrade].count;
  }

  var p = prefield[f.y][f.x];

  if(c.istemplate) {
    result += '<br/><br/>This template represents all crops of type ' + getCropTypeName(c.type);
    result += '<br/><br/>It is a placeholder for planning the field layout and does nothing.';
    result += '<br><br>Templates are a feature provided by the automaton.';
    result += '<br><br>Tip: ctrl+shift+click, or press "u", on a template to turn it into a crop of highest available tier of this type';

    // TODO: p.treeneighbor isn't computed for templates, so this message doesn't work, implement a way to make it work.
    /*if(c.type == CROPTYPE_MISTLETOE) {
      if(!p.treeneighbor) {
        result += '<br/><br/>';
        result += '<font color="#f88">This mistletoe is not planted next to the tree and therefore won\'t do anything at all. Plant next to tree to be able to get twigs.</font>';
      }
    }*/

    return result;
  }

  if(c.isghost) {
    result += '<br/><br/>ghostly remainder of a ' + getCropTypeName(c.type) + ', does nothing. Automaton won\'t touch this either.';
    return result;
  }


  result += '<br/>';
  if(c2.prestige) {
    result += 'Crop type: ' + getCropTypeName(c.type) + (c.tier ? (' (tier ' + (c.tier + 1) + ', prestige: ' + c2.prestige + 'x)') : '');
  } else {
    result += 'Crop type: ' + getCropTypeName(c.type) + (c.tier ? (' (tier ' + (c.tier + 1) + ')') : '');
  }
  var help = getCropTypeHelp(c.type, state.challenge == challenge_bees);
  if(help) {
    result += '<br/>' + help;
  }
  if(c.tagline) result += '<br/><br/>' + upper(c.tagline);
  result += '<br/><br/>';

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

  var growing = f.growth < 1 && c.type != CROPTYPE_BRASSICA && state.challenge != challenge_wither;

  if(growing) {
    if(state.challenge == challenge_wither) {
      result += 'Withering. Time left: ' + util.formatDuration(witherDuration() * f.growth);
    } else {
      if(opt_detailed) {
        // the detailed dialog is not dynamically updated, so show the total growth time statically instead.
        result += 'Growing. Total growing time: ' + util.formatDuration(c.getPlantTime());
        if(c.getPlantTime() != c.planttime) result += ' (base: ' + util.formatDuration(c.planttime) + ')';
      } else {
        result += 'Growing. Time to grow left: ' + util.formatDuration((1 - f.growth) * c.getPlantTime(), true, 4, true) + ' (of: ' + util.formatDuration(c.getPlantTime(), true, 4, true)  + ')';
      }
    }
    result += '<br/><br/>';
    var expected_prod = c.getProd(f, 2);
    var expected_boost = c.getBoost(f, 2);
    var expected_boostboost = c.getBoostBoost(f, 2);
    if(!expected_prod.empty()) {
      result += 'Current production/sec: ' + c.getProd(f, 0).toString() + '<br>';
      result += 'Expected production/sec: ' + expected_prod.toString();
      if(state.challenge == challenge_wasabi) result += '<br>NOTE: this production is only accessible through copying with watercress etc... during the wasabi challenge!';
    }
    if(expected_boost.neqr(0)) {
      var current_boost = c.getBoost(f, 0);
      if(current_boost.neqr(0)) result += 'Current boost: ' + current_boost.toPercentString() + '<br>';
      result += 'Expected boost: ' + expected_boost.toPercentString();
    }
    if(expected_boostboost.neqr(0)) {
      var current_boost = c.getBoostBoost(f, 0);
      if(current_boost.neqr(0)) result += 'Current boost: ' + current_boost.toPercentString() + '<br>';
      result += 'Expected boost: ' + expected_boostboost.toPercentString();
    }
    result += '<br/>';
  } else {
    if(c.type == CROPTYPE_BRASSICA) {
      if(opt_detailed) {
        // the detailed dialog is not dynamically updated, so show the life growth time statically instead.
        result += 'Short-lived plant. Total lifetime: ' + c.getPlantTime() + 's<br/><br/>';
        result += leechInfo + '<br/>';
      } else {
        var end_of_life = c.isPostLife(f);;
        var text0 = 'Short-lived plant';
        var growthremaining = f.growth;
        if(end_of_life) {
          text0 = 'Short-lived, end of life but weakly active';
          growthremaining = 0;
        }
        result += text0 + '. Time left: ' + util.formatDuration(growthremaining * c.getPlantTime(), true, 4, true) + ' of ' + util.formatDuration(c.getPlantTime(), true, 4, true) + '<br/>';
        if(state.upgrades[berryunlock_0].count) {
          result += '<br/><span class="efWatercressHighlight">Copies neighbors: Duplicates full production of long-lived berry and mushroom neighbors for free';
          if(basicChallenge() || !state.upgrades3[upgrade3_watercress_mush].count) result += ' (mushroom copy also consumes more seeds)';
          result += '</span><br/>';
        }
      }

      result += '<br/>';
    } else if(state.challenge == challenge_wither) {
      result += 'Withering. Time left: ' + util.formatDuration(f.growth * witherDuration(), true, 4, true) + '<br/><br/>';
    } else {
      result += 'Grow time: ' + util.formatDuration(c.getPlantTime());
      if(c.getPlantTime() != c.planttime) result += ' (base: ' + util.formatDuration(c.planttime) + ')';
      result += '<br/><br/>';
    }
  }

  var prod3 = p.prod3;
  var prod0 = p.prod0;
  if(state.challenge == challenge_wasabi && c.type != CROPTYPE_BRASSICA && p.prod3_wasabi_challenge) {
    prod3 = p.prod3_wasabi_challenge;
    prod0 = p.prod0_wasabi_challenge;
  }
  if(!prod3.empty() || c.type == CROPTYPE_MUSH || c.type == CROPTYPE_BERRY) {
    if(state.challenge == challenge_wasabi && c.type != CROPTYPE_BRASSICA) {
      result += 'Copyable production per second: ' + prod3.toString() + '<br/>';
    } else if(!growing) {
      result += 'Production per second: ' + prod3.toString() + '<br/>';
    }
    if(c.type == CROPTYPE_BRASSICA) {
      var breakdown_copy = p.getBreakdownWatercress();
      if(breakdown_copy && breakdown_copy.length) {
        var copy = breakdown_copy[breakdown_copy.length - 1][3];
        if(copy && copy.neqr && copy.neqr(0)) {
          result += 'Copying: ' + copy.toPercentString() + '<br/>';
        }
      }
    }
    if(prod3.hasNeg() || c.type == CROPTYPE_MUSH) {
      if(prod0.neq(prod3)) {
        if(c.type == CROPTYPE_MUSH) {
          result += 'Needs more seeds, requires berries as neighbors.<br>Potential max production: ' + prod0.toString() + '<br/>';
          result += 'Satisfied: no (' + prod3.seeds.div(prod0.seeds).toPercentString() + ')<br/>';
        } else if(c.type == CROPTYPE_BRASSICA) {
          // nothing to print.
        } else {
          result += 'Needs more input resources, potential max production: ' + prod0.toString() + '<br/>';
        }
      } else {
        result += 'Satisfied: fully (' + p.gotten2.seeds.div(p.wanted.seeds).toPercentString() + ')<br/>';
      }
    } else if(p.prod3.neq(p.prod2)) {
      if(!(p.prod2.seeds.ltr(0) && p.prod2.seeds.gtr(-1e-6))) { // avoid a possible numerical display issue
        result += 'After consumption: ';
        if(p.prod2.empty() && tooHighSeedConsumption() /*&& !growing*/) {
          result += 'none: a mushroom is consuming all seeds. Plant high tier berries away from a mushroom to get some income for upgrades.';
        } else {
          result += p.prod2.toString();
        }
        result += '<br/>';
      }
    }
    result += '<br/>';
  }
  if(c.type == CROPTYPE_MUSH) {
    result += 'Efficiency: ' + prod0.spores.div(prod0.seeds.neg()).toString() + ' spores/seed, ' +
        prod0.seeds.div(prod0.spores.neg()).toString() + ' seeds/spore<br/>';
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
    result += 'Boost to neighbor drones: ' + c.getBoostBoost(f).toPercentString() + ' (base: ' + c.boost.toPercentString() + ')' + '<br/>';
    result += '<br/>';
  }
  if(c.boost.neqr(0) && (c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_STINGING)) {
    if(c.type == CROPTYPE_STINGING) {
      result += 'Boosting spores: ' + (c.getBoost(f).toPercentString()) + '. Nerfing orthogonally neighboring berries and flowers<br/>';
    } else {
      result += 'Boosting neighbors: ' + (c.getBoost(f).toPercentString()) + '<br/>';
    }
    result += '<br/>';
  }
  if(c.boost.neqr(0) && (c.type == CROPTYPE_BEE)) {
    result += 'Boosting flowers: ' + (c.getBoostBoost(f).toPercentString()) + '<br/>';
    result += '<br/>';
  }

  var recoup = c.getRecoup();
  var upgrade_cost = [undefined];
  var upgrade_crop = getUpgradeCrop(f.x, f.y, upgrade_cost, true);

  if(opt_detailed) {
    result += 'Num planted of this type: ' + state.cropcount[c.index] + '<br>';
    result += '<br/>';
    result += 'Cost: ' + '<br>';
    result += ' • Base planting cost: ' + c.cost.toString() + '<br>';
    result += ' • Last planting cost: ' + c.getCost(-1).toString() + '<br>';
    if(c.type != CROPTYPE_NUT) result += ' • Next planting cost: ' + c.getCost().toString() + '<br>';
    result += ' • Recoup on delete: ' + recoup.toString();
    if(upgrade_crop && upgrade_cost[0]) {
      result += '<br/> • Next tier cost: ' + upgrade_cost[0].toString() + ' (' + getCostAffordTimer(upgrade_cost[0]) + ')';
    }
  } else {
    if(c.type != CROPTYPE_NUT) result += ' • Next planting cost (p): ' + c.getCost().toString() + ' (' + getCostAffordTimer(c.getCost()) + ')<br>';
    result += ' • Recoup on delete (d): ' + recoup.toString();
    if(upgrade_crop && upgrade_cost[0]) {
      result += '<br/> • Next tier cost (u): ' + upgrade_cost[0].toString() + ' (' + getCostAffordTimer(upgrade_cost[0]) + ')';
    }
  }

  return result;
}


function makeTreeDialog() {
  var div;

  var have_buttons = state.challenge || automatonUnlocked() || state.challenges_unlocked || state.treelevel >= min_transcension_level;

  var shortcutfun = function(e) {
    var shift = util.eventHasShiftKey(e);
    var ctrl = util.eventHasCtrlKey(e);
    if(automatonUnlocked() && (e.key == 'b' || e.key == 'B') && !ctrl) {
      if(!blueprintdialogopen) createBlueprintsDialog(false);
    }
    if(state.challenges_unlocked && (e.key == 'c' || e.key == 'C') && !ctrl) {
      if(!challengedialogopen) createChallengeDialog();
    }
    if(state.treelevel >= min_transcension_level && (e.key == 't' || e.key == 'T') && !ctrl) {
      createTranscendDialog();
    }
  };

  var treedialogvisible = true;

  var dialog = createDialog({
    nocancel:have_buttons,
    shortcutfun:shortcutfun,
    scrollable:false,
    onclose:function(){treedialogvisible = false;},
    narrow:true,
    title:'Tree',
    bgstyle:'efDialogTranslucent'
  });

  var contentFlex = dialog.content;

  var flex = new Flex(dialog.icon, 0, 0, 1, 1);
  var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(tree_images[treeLevelIndex(state.treelevel)][1][getSeason()], canvas);
  flex = new Flex(dialog.icon, 0, 1, 1, 2);
  canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(tree_images[treeLevelIndex(state.treelevel)][2][getSeason()], canvas);

  var ypos = 0;
  var ysize = 0.1;

  var f0 = new Flex(contentFlex, 0, 0, 1, 0.65);
  makeScrollable(f0);
  var f1 = new Flex(contentFlex, 0, 0.67, 1, 1);

  var createText = function() {
    var text;

    var show_resin = !state.challenge || challenges[state.challenge].allowsresin;
    var show_twigs = !state.challenge || challenges[state.challenge].allowstwigs;
    var resin_breakdown = [];
    var twigs_breakdown = [];

    text = '<b>' + upper(tree_images[treeLevelIndex(state.treelevel)][0]) + '</b><br/>';
    text += 'Tree level: ' + state.treelevel + '<br/>';
    if(state.treelevel == 0 && state.res.spores.eqr(0)) {
      text += 'This tree needs to be rejuvenated first. Requires spores.<br/>';
    }

    if(state.challenge) {
      var c = challenges[state.challenge];
      var c2 = state.challenges[state.challenge];
      var maxlevel = c2.maxlevel;
      if(c.cycling > 1) maxlevel = c2.maxlevels[c2.num_completed % c.cycling];
      text += '<br>';
      if(maxlevel > 0) {
        if(state.treelevel > maxlevel) {
          text += '<b>Challenge active</b>: ' + upper(c.name) + '. You beat your previous best of lvl ' + maxlevel + ' with lvl ' + state.treelevel + '.';
          text += ' This will bring your total challenge production bonus from ' + state.challenge_bonus.toPercentString() + ' to ' + totalChallengeBonusWith(state.challenge, state.treelevel).toPercentString();
        } else {
          text += '<b>Challenge active</b>: ' + upper(c.name) + '. You did not yet reach your previous best of lvl ' + maxlevel + '.';
        }
      } else {
        text += '<b>Challenge active</b>: ' + upper(c.name);
        //text += state.challenge_bonus.toPercentString();
        var bonus_before = state.challenge_bonus;
        var bonus_after = totalChallengeBonusWith(state.challenge, state.treelevel);
        if(bonus_before.neq(bonus_after)) {
          text += '. So far, it will bring your total challenge production bonus from ' + bonus_before.toPercentString() + ' to ' + bonus_after.toPercentString();
        }
      }
      if(c.targetlevel.length > 1) {
        if(!c.fullyCompleted()) {
          text += '<br>Current challenge target level: <b>' + c.targetlevel[c2.completed] + '</b>';
        }
      } else {
        if(!c2.completed) {
          text += '<br>Challenge target level: <b>' + c.targetlevel[0] + '</b>';
        }
      }
      text += '<br>';
    }

    if(state.treelevel > 0 || state.res.spores.gtr(0)) {
      text += '<br/>';
      var req = treeLevelReq(state.treelevel + 1);
      var nextlevelprogress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
      text += 'Next level requires: ' + req.toString() + ' (' + (getCostAffordTimer(req)) + ', ' + nextlevelprogress.toPercentString() + ') ' + '<br/>';
      if(state.mistletoes > 0) {
        text += 'This requirement was increased ' + (getMistletoeLeech().subr(1)).toPercentString() + ' by ' + state.mistletoes + ' mistletoes' + '<br/>';
      }
      text += 'Time at this level: ' + util.formatDuration(timeAtTreeLevel(state)) + '<br/>';

      text += '<br>';

      if(show_resin) {
        if(state.challenge && state.treelevel > state.g_treelevel && !state.challenge.allowbeyondhighestlevel) {
          text += 'No further resin gained during this challenge, higher level than max regular level reached';
        } else {
          var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
          text += 'Resin added at next tree level: ' + nextTreeLevelResin(resin_breakdown).toString() + ' (getting ' + progress.toPercentString() + ' of this so far)';
        }

        text += '<br/>';
        text += 'Total resin ready: ' + getUpcomingResinIncludingFerns().toString();
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
            var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
            text += 'Twigs added at next tree level: ' + nextTwigs(twigs_breakdown).twigs.toString() + ' (getting ' + progress.toPercentString() + ' of this so far)';
          }

          text += '<br>';
          text += 'Total twigs ready: ' + getUpcomingTwigs().toString();
          text += '<br/>';
        } else {
          text += 'The tree doesn\'t produce twigs during this challenge.<br/>';
        }
        text += '<br/>';
      }

      text += 'Tree level production boost to crops: ' + (getTreeBoost()).toPercentString();
      if(getFruitAbility(FRUIT_TREELEVEL, true) > 0) {
        var mul = treeLevelFruitBoost(getFruitTier(true), getFruitAbility(FRUIT_TREELEVEL, true), state.treelevel).addr(1);
        text += ' (of which ' + mul.toPercentString() + ' multiplicative from the fruit)';
      }
      text += '<br>';

      if(haveMultiplicity(CROPTYPE_BERRY)) {
        text += '<br/>';
        text += 'Multiplicity (berry and mushroom): +' + (getMultiplicityBonusBase(CROPTYPE_BERRY)).toPercentString() + ' per other of same type of max 1 tier difference<br>';
      }
      if(haveMultiplicity(CROPTYPE_FLOWER)) {
        text += '<br/>';
        text += 'Multiplicity (flower): +' + (getMultiplicityBonusBase(CROPTYPE_FLOWER)).toPercentString() + ' per other of same type of max 1 tier difference<br>';
      }

      if(getSeason() == 3) {
        text += '<br/>';
        text += 'During winter, the tree provides winter warmth: +' + getWinterTreeWarmth().subr(1).toPercentString() + ' berry / mushroom stats and no negative winter effect for any crop next to the tree<br>';
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
    if(!treedialogvisible) return false;
    if(lastseentreelevel != state.treelevel) {
      lastseentreelevel = state.treelevel;
      var text = createText();
      f0.div.innerHTML = text;
    }
    return true;
  });

  var y = 0.05;
  var h = 0.15;
  // finetune the width of the buttons in flex f1
  var button0 = 0.15;
  var button1 = 0.85;
  var buttonshift = h * 1.15;

  if(state.challenge) {
    var c = challenges[state.challenge];
    var c2 = state.challenges[state.challenge];

    var already_completed = c.fullyCompleted();
    var targetlevel = c.nextTargetLevel();
    var success = state.treelevel >= targetlevel;

    var button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = getEndChallengeButtonName(already_completed, success);
    if(already_completed && success) {
      // Successfully finish, but it already was completed beforehand, so it's called just "finish", not "complete"
      registerTooltip(button, 'Finish the challenge. If you broke the max level record, your challenge production bonus will increase.');
    } else if(already_completed && !success) {
      // End the challenge early, but it already was completed beforehand, so it's called "end", not "abort"
      registerTooltip(button, 'End the challenge.');
    } else if(success) {
      if(c2.completed) {
        // This is a completion of a higher stage of the challenge
        registerTooltip(button, 'Successfully finish the next stage of this challenge.');
      } else {
        registerTooltip(button, 'Successfully finish the challenge for the first time.');
      }
    } else {
      // Abort the attempt to complete this challenge, it remainds unfinished. But it can still give the challenge highest level production bonus.
      if(c.targetlevel.length > 1) {
        registerTooltip(button, 'Open the dialog to abort the challenge, you don\'t get its next reward, but if you broke the max level record, your challenge production bonus will still increase. The dialog will show the amounts.');
      } else {
        registerTooltip(button, 'Open the dialog to abort the challenge, you don\'t get its one-time reward, but if you broke the max level record, your challenge production bonus will still increase. The dialog will show the amounts.');
      }
    }

    //button.textEl.style.boxShadow = '0px 0px 5px #f40';
    button.textEl.style.textShadow = '0px 0px 5px #f40';
    addButtonAction(button, function() {
      createFinishChallengeDialog();
    });


    button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Current challenge info';
    registerTooltip(button, 'Description and statistics for the current challenge');
    addButtonAction(button, function() {
      createChallengeDescriptionDialog(state.challenge, true, false);
    });
  } else if(state.treelevel < min_transcension_level) {
    //if(state.treelevel >= 1) f1.div.innerText = 'Reach tree level ' + min_transcension_level + ' to unlock transcension';
    if(state.treelevel >= 1) {
      var temp = new Flex(f1, button0, y, button1, y + h);
      temp.div.innerText = 'Reach tree level ' + min_transcension_level + ' to unlock transcension';
      y += buttonshift;
    }
  } else {
    var button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Transcension';
    //button.textEl.style.boxShadow = '0px 0px 5px #ff0';
    button.textEl.style.textShadow = '0px 0px 5px #ff0';
    registerTooltip(button, 'Show the transcension dialog');
    addButtonAction(button, function() {
      createTranscendDialog();
    });

    if(state.challenges_unlocked) {
      button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
      y += buttonshift;
      styleButton(button);
      button.textEl.innerText = 'Challenges';
      //button.textEl.style.boxShadow = '0px 0px 5px #f60';
      button.textEl.style.textShadow = '0px 0px 5px #f60';
      registerTooltip(button, 'Transcend and start a challenge');
      addButtonAction(button, function() {
        createChallengeDialog();
      });
    }
  }

  if(automatonUnlocked()) {
    button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Blueprints';
    //button.textEl.style.boxShadow = '0px 0px 5px #44f';
    button.textEl.style.textShadow = '0px 0px 5px #008';
    addButtonAction(button, function() {
      //closeAllDialogs();
      createBlueprintsDialog();
    });
  }

  if(have_buttons) {
    button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Back';
    addButtonAction(button, function() {
      dialog.cancelFun();
    });
  }
}

// opt_cost is output variable that contains the cost and a boolean that tells if it's too expensive
function getUpgradeCrop(x, y, opt_cost, opt_include_locked) {
  if(!state.field[y]) return null;
  var f = state.field[y][x];
  if(!f) return;
  var c = f.getCrop();
  if(!c) return;

  if(c.type == CROPTYPE_CHALLENGE) return null;
  var tier = opt_include_locked ? state.highestoftypeknown[c.type] : state.highestoftypeunlocked[c.type];

  var c2 = null;

  for(;;) {
    if(tier <= c.tier) break; // not an upgrade
    if(tier < 0) break;

    var c3 = croptype_tiers[c.type][tier];
    if(!c3 || !state.crops[c3.index].unlocked && !opt_include_locked) break; // normally cannot happen that a lower tier crop is not unlocked

    if(opt_cost != undefined) {
      opt_cost[0] = c3.getCost();
      c2 = c3;
    }

    if(c3.getCost().le(state.res)) {
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

function makeUpgradeCropAction(x, y, opt_silent) {
  var too_expensive = [undefined];
  var c2 = getUpgradeCrop(x, y, too_expensive);

  if(c2 && !too_expensive[1]) {
    addAction({type:ACTION_REPLACE, x:x, y:y, crop:c2, shiftPlanted:true});
    return true;
  } else {
    if(!opt_silent) {
      if(too_expensive[1]) {
        showMessage('not enough resources for crop upgrade: have ' + Res.getMatchingResourcesOnly(too_expensive[0], state.res).toString() +
            ', need ' + too_expensive[0].toString() + ' (' + getCostAffordTimer(too_expensive[0]) + ')', C_INVALID, 0, 0);
      } else if(!(x >= 0 && x < state.numw && y >= 0 && y < state.numh) || state.field[y][x].index < CROPINDEX) {
        showMessage('No crop to tier up here. Move mouse cursor over a crop and press u to upgrade it to the next tier', C_INVALID);
      } else if(state.field[y][x].index != 0) {
        if(state.field[y][x].hasCrop() && state.field[y][x].getCrop().istemplate && !state.upgrades[berryunlock_0].count) {
          showMessage('Crop not replaced, no higher tier unlocked or available. Must plant watercress first to unlock blackberry.', C_INVALID);
        } else {
          showMessage('Crop not replaced, no higher tier unlocked or available', C_INVALID);
        }
      }
    }
  }
  return false;
}

function makeFieldDialog(x, y) {
  var f = state.field[y][x];
  var fd = fieldDivs[y][x];


  if(f.hasCrop()) {
    var c = f.getCrop();
    var div;

    var dialog = createDialog({
      icon:c.image[4],
      title:'Crop info',
      bgstyle:'efDialogTranslucent'
    });

    var buttonshift = 0;
    if(c.type == CROPTYPE_BRASSICA) buttonshift += 0.17; // the watercress has a long explanation that makes the text go behind the buttons... TODO: have some better system where button is placed after whatever the textsize is

    var flex0 = new Flex(dialog.content, 0, [0, 0, 0.01], 1, 0.5 + buttonshift);
    var button0 = new Flex(dialog.content, [0, 0, 0.2], [0.5 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.565 + buttonshift).div;
    var button1 = new Flex(dialog.content, [0, 0, 0.2], [0.57 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.635 + buttonshift).div;
    var button2 = new Flex(dialog.content, [0, 0, 0.2], [0.64 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.705 + buttonshift).div;
    var button3 = new Flex(dialog.content, [0, 0, 0.2], [0.71 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.775 + buttonshift).div;
    var last0 = undefined;

    makeScrollable(flex0);

    styleButton(button0);
    button0.textEl.innerText = 'Tier up';
    registerTooltip(button0, 'Replace crop with the highest tier of this type you can afford, or turn template into real crop. This deletes the original crop, (with cost recoup if applicable), and then plants the new higher tier crop.');
    addButtonAction(button0, function() {
      if(makeUpgradeCropAction(x, y)) {
        closeAllDialogs();
        update();
      }
    });

    styleButton(button1);
    button1.textEl.innerText = 'Replace crop';
    registerTooltip(button1, 'Replace the crop with a new one you choose, same as delete then plant. Shows the list of unlocked crops.');
    addButtonAction(button1, function() {
      makePlantDialog(x, y, true, c.getRecoup());
    });

    styleButton(button2);
    button2.textEl.innerText = 'Delete crop';
    button2.textEl.style.color = '#c00';
    registerTooltip(button2, 'Delete crop and get some of its cost back.');
    addButtonAction(button2, function() {
      addAction({type:ACTION_DELETE, x:x, y:y});
      closeAllDialogs();
      update(); // do update immediately rather than wait for tick, for faster feeling response time
    });

    styleButton(button3);
    button3.textEl.innerText = 'Detailed stats / bonuses';
    registerTooltip(button3, 'Show breakdown of multipliers and bonuses and other detailed stats.');
    addButtonAction(button3, function() {
      var dialog = createDialog({
        size:DIALOG_LARGE,
        title:'Detailed crop stats',
        scrollable:true,
        icon:c.image[4],
        bgstyle:'efDialogTranslucent'
      });
      var text = '';

      text += getCropInfoHTML(f, c, true);
      text += '<br/>';
      text += getCropInfoHTMLBreakdown(f, c);
      dialog.content.div.innerHTML = text;
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
  var fieldGrid = new Flex(fieldFlex, [0.5,0,-0.5,ratio], [0.5,0,-0.5,1/ratio], [0.5,0,0.5,ratio], [0.5,0,0.5,1/ratio]);

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

      util.setEvent(div, 'mouseover', 'fieldover', bind(function(x, y) {
        updateFieldMouseOver(x, y);
      }, x, y));
      util.setEvent(div, 'mouseout', 'fieldout', bind(function(x, y) {
        updateFieldMouseOut(x, y);
      }, x, y));
      // on mouse up and with timeout so that the state is fully updated after the action that the click caused
      util.setEvent(div, 'mouseup', 'fieldclick', bind(function(x, y) {
        window.setTimeout(function(){updateFieldMouseClick(x, y)});
      }, x, y));

      registerTooltip(div, bind(function(x, y, div) {
        var f = state.field[y][x];
        var fd = fieldDivs[y][x];

        var result = undefined;
        if(state.fern && x == state.fernx && y == state.ferny) {
          if(state.g_numresets > 1 && state.fern == 2) {
            return 'Fern: provides some resource when activated.<br><br> The amount is based on production at time the fern is activated,<br>or starter resources when there is no production yet.<br><br>Extra bushy ferns give more resources, and give a small amount of resin, based on highest-earning resin run ever, once far enough in the game. Resin given by ferns is itself not included in the "highest-earning resin run" metric, and is also not included in resin/hr stats, but will be given on transcend as usual';
          } else {
            return 'Fern: provides some resource when activated.<br><br> The amount is based on production at time the fern is activated,<br>or starter resources when there is no production yet.';
          }
        } else if(state.present_effect && x == state.presentx && y == state.presenty) {
          //return 'Present: provides a random bonus when activated. Presents are a temporary festive event!';
          return 'Egg: provides a random bonus when activated. Eggs are a temporary festive event!';
        } else if(f.index == 0) {
          //return 'Empty field, click to plant';
          return undefined; // no tooltip for empty fields, it's a bit too spammy when you move the mouse there
        } else if(f.index == FIELD_REMAINDER) {
          result = 'Remains of a watercress that was copying from multiple plants. Visual reminder of good copying-spot only, this is an empty field spot and does nothing. Allows replanting this watercress with "w" key or the watercress button in the top bar.';
        } else if(f.hasCrop()) {
          var c = f.getCrop();
          result = getCropInfoHTML(f, c);
        } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
          var time = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores).div(gain.spores);
          if(time.ltr(0)) time = Num(0);
          if(state.treelevel <= 0 && state.res.spores.eqr(0)) {
            var result = 'a weathered tree';
            if(state.res.spores.gtr(0)) result += '<br>(' + util.formatDuration(time.valueOf(), true) + ')';
            return result;
          } else {
            var nextlevelprogress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
            var result = upper(tree_images[treeLevelIndex(state.treelevel)][0]) + ' level ' + state.treelevel + '.<br>Next level requires: ' + treeLevelReq(state.treelevel + 1).toString() + '<br>(' + util.formatDuration(time.valueOf(), true) + ', ' + nextlevelprogress.toPercentString() + ')';
            result += '<br>Time at this level: ' + util.formatDuration(timeAtTreeLevel(state), true) + '<br/>';
            return result;
          }
        }
        return result;
      }, x, y, div), true);

      div.style.cursor = 'pointer';
      addButtonAction(div, bind(function(x, y, div, e) {
        var f = state.field[y][x];
        var fern = state.fern && x == state.fernx && y == state.ferny;
        var present = state.present_effect && x == state.presentx && y == state.presenty;

        if(state.fern && x == state.fernx && y == state.ferny) {
          addAction({type:ACTION_FERN, x:x, y:y});
          update();
        }

        if(state.present_effect && x == state.presentx && y == state.presenty) {
          addAction({type:ACTION_PRESENT, x:x, y:y});
          update();
        }

        if(!fern && !present && (f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM)) {
          makeFieldDialog(x, y);
        } else if(f.index == 0 || f.index == FIELD_REMAINDER) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(shift && ctrl) {
            // experimental feature for now, most convenient behavior needs to be found
            // current behavior: plant crop of same type as lastPlanted, but of highest tier that's unlocked and you can afford. Useful in combination with ctrl+shift picking when highest unlocked one is still to expensive and you wait for automaton to upgrade the plant
            if(state.lastPlanted >= 0 && crops[state.lastPlanted]) {
              var c = crops[state.lastPlanted];
              var tier = state.highestoftypeunlocked[c.type];
              var c3 = croptype_tiers[c.type][tier];
              if(c.type == CROPTYPE_CHALLENGE) c3 = c;
              if(!c3 || !state.crops[c3.index].unlocked) c3 = c;
              if(c3.getCost().gt(state.res) && tier > 0) {
                tier--;
                var c4 = croptype_tiers[c.type][tier];
                if(c4 && state.crops[c4.index].unlocked) c3 = c4;
              }
              if(c3.getCost().gt(state.res) && tier > 0) {
                tier--;
                var c4 = croptype_tiers[c.type][tier];
                if(c4 && state.crops[c4.index].unlocked) c3 = c4;
              }
              if(c3.getCost().gt(state.res)) {
                tier = -1; // template
                var c4 = croptype_tiers[c.type][tier];
                if(c4 && state.crops[c4.index].unlocked) c3 = c4;
              }
              addAction({type:ACTION_PLANT, x:x, y:y, crop:c3, shiftPlanted:true});
              update();
            }
          } else if(shift && !ctrl) {
            if(state.lastPlanted >= 0 && crops[state.lastPlanted]) {
              var c = crops[state.lastPlanted];
              addAction({type:ACTION_PLANT, x:x, y:y, crop:c, shiftPlanted:true});
              update();
            } else {
              showMessage(shiftClickPlantUnset, C_INVALID, 0, 0);
            }
          } else if(ctrl && !shift) {
            var brassica = getHighestBrassica();
            if(brassica >= 0) {
              addAction({type:ACTION_PLANT, x:x, y:y, crop:crops[brassica], ctrlPlanted:true});
              update();
            }
          } else if(!fern && !present) {
            makeFieldDialog(x, y);
          }
        } else if(f.hasCrop()) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(shift && ctrl) {
            // experimental feature for now, most convenient behavior needs to be found
            // behavior implemented here: if safe, "pick" clicked crop type, but then the best unlocked one of its tier. If unsafe permitted, immediately upgrade to highest type, and still pick highest tier too whether or not it changed
            // other possible behaviors: pick crop type (as is), open the crop replace dialog, ...
            var c2 = f.getCrop();
            var c3 = croptype_tiers[c2.type][state.highestoftypeunlocked[c2.type]];
            if(!c3 || !state.crops[c3.index].unlocked) c3 = c2;
            if(c2.type == CROPTYPE_CHALLENGE) c3 = c2;
            state.lastPlanted = c3.index;
            if(c3.getCost().gt(state.res)) state.lastPlanted = c2.index;
            if(c3.tier > c2.tier) {
              addAction({type:ACTION_REPLACE, x:x, y:y, crop:c3, shiftPlanted:true});
              update();
            }
          } else if(shift && !ctrl) {
            if(state.lastPlanted >= 0 && crops[state.lastPlanted]) {
              var c = crops[state.lastPlanted];
              var c2 = f.getCrop();
              if(c2.index == state.lastPlanted && ((c2.type != CROPTYPE_BRASSICA && !f.isFullGrown()) || f.isTemplate() || f.isGhost())) {
                // one exception for the shift+click to replace: if crop is growing and equals your currently selected crop,
                // it means you may have just accidently planted it in wrong spot. deleting it is free (other than lost growtime,
                // but player intended to have it gone anyway by shift+clicking it even when replace was intended)
                addAction({type:ACTION_DELETE, x:x, y:y});
              } else {
                addAction({type:ACTION_REPLACE, x:x, y:y, crop:c, shiftPlanted:true});
              }
              update();
            }
          } else if(ctrl && !shift) {
            var brassica = getHighestBrassica();
            if(f.getCrop().index == watercress_template && state.res.seeds.ger(100) && brassica >= 0) {
              addAction({type:ACTION_REPLACE, x:x, y:y, crop:crops[brassica], ctrlPlanted:true});
            } else {
              addAction({type:ACTION_DELETE, x:x, y:y});
              update();
            }
          } else if(!fern && !present) {
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
      progress.style.minHeight = '3px';
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
function renderDigit(ctx, digit, x0, y0, progresspixel, opt_color_off, opt_color_on) {
  ctx.fillStyle = opt_color_off || '#840';
  var ax = digit * 3;
  var aw = 30;
  for(var y = 0; y < 5; y++) {
    if(y >= (5 - progresspixel)) ctx.fillStyle = opt_color_on || '#f80';
    var as = y * aw + ax;
    for(var x = 0; x < 3; x++) {
      if(digits[as + x]) ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
};

function renderLevel(canvas, level, x, y, progresspixel, opt_color_off, opt_color_on) {
  var ctx = canvas.getContext('2d');
  if(level < 10) {
    renderDigit(ctx, level, x + 6, y, progresspixel, opt_color_off, opt_color_on);
  } else if(level < 100) {
    renderDigit(ctx, Math.floor(level / 10), x + 4, y, progresspixel, opt_color_off, opt_color_on);
    renderDigit(ctx, level % 10, x + 8, y, progresspixel, opt_color_off, opt_color_on);
  } else if(level < 1000) {
    renderDigit(ctx, Math.floor(level / 100), x + 2, y, progresspixel, opt_color_off, opt_color_on);
    renderDigit(ctx, Math.floor(level / 10) % 10, x + 6, y, progresspixel, opt_color_off, opt_color_on);
    renderDigit(ctx, level % 10, x + 10, y, progresspixel, opt_color_off, opt_color_on);
  } else if(level < 10000) {
    renderDigit(ctx, Math.floor(level / 1000), x + 0, y, progresspixel, opt_color_off, opt_color_on);
    renderDigit(ctx, Math.floor(level / 100) % 10, x + 4, y, progresspixel, opt_color_off, opt_color_on);
    renderDigit(ctx, Math.floor(level / 10) % 10, x + 8, y, progresspixel, opt_color_off, opt_color_on);
    renderDigit(ctx, level % 10, x + 12, y, progresspixel, opt_color_off, opt_color_on);
  }
}

function updateFieldCellUI(x, y) {
  if(state.numh != fieldDivs.length || state.numw != fieldDivs[0].length) initFieldUI();

  var f = state.field[y][x];
  var fd = fieldDivs[y][x];
  var g = f.growth;
  var c = f.getCrop();
  var growstage;
  if(c && c.type == CROPTYPE_BRASSICA) {
    growstage = (g >= 1) ? 4 : Math.min(Math.floor(g * 5), 4);
    if(!(growstage >= 0 && growstage <= 4)) growstage = 0;
    if(c.isPostLife(f)) growstage = -1;
  } else {
    if(g < 0.1) growstage = 0;
    else if(g < 0.25) growstage = 1;
    else if(g < 0.5) growstage = 2;
    else if(g < 0.9) growstage = 3;
    else growstage = 4; // already use the final fullgrown image for some time at the end of the growing phase too
    if(state.challenge == challenge_wither) growstage = 4;
  }

  var season = getSeason();

  var progresspixel = -1;
  if(f.index == FIELD_TREE_BOTTOM && (state.treelevel > 0 || state.res.spores.gtr(0))) {
    var nextlevelprogress = Math.min(0.99, state.res.spores.div(treeLevelReq(state.treelevel + 1).spores).valueOf());
    progresspixel = Math.round(nextlevelprogress * 5);
  }

  var ferncode = ((state.fernx + state.ferny * state.numw) << 3) | state.fern;
  var presentcode = ((state.presentx + state.presenty * state.numw) << 3) | state.present_effect;

  var automatonplant = (x == state.automatonx && y == state.automatony && (state.time - state.automatontime < 0.5));
  var growing = f.growth < 1;

  if(fd.index != f.index || fd.growing != growing || fd.growstage != growstage || season != fd.season || state.treelevel != fd.treelevel || ferncode != fd.ferncode  || presentcode != fd.presentcode || progresspixel != fd.progresspixel || automatonplant != fd.automatonplant) {
    var r = util.pseudoRandom2D(x, y, 77777777);
    var fieldim = images_field[season];
    var field_image = r < 0.25 ? fieldim[0] : (r < 0.5 ? fieldim[1] : (r < 0.75 ? fieldim[2] : fieldim[3]));
    if(f.index == FIELD_TREE_BOTTOM || f.index == FIELD_TREE_TOP) field_image = fieldim[4];
    renderImage(field_image, fd.bgcanvas);
    fd.index = f.index;
    fd.growing = growing;
    fd.growstage = growstage;
    fd.season = season;
    fd.treelevel = state.treelevel;
    fd.ferncode = ferncode;
    fd.presentcode = presentcode;
    fd.progresspixel = progresspixel;
    fd.automatonplant = automatonplant;

    var label = 'field tile ' + x + ', ' + y;

    if(automatonplant) {
      renderImage(images_automaton[4], fd.canvas);
    } else if(f.hasCrop()) {
      var c = f.getCrop();
      var cropimg;
      if(growstage == -1) {
        cropimg = c.image_post;
      } else {
        cropimg = c.image[growstage];
      }
      renderImage(cropimg, fd.canvas);
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
      if(state.treelevel > 0 || state.res.spores.gtr(0)) {
        if(state.challenge == challenge_infernal) {
          renderLevel(fd.canvas, state.treelevel, 0, 11, progresspixel, '#420', '#fa0');
        } else {
          renderLevel(fd.canvas, state.treelevel, 0, 11, progresspixel);
        }
      }
    } else if(f.index == FIELD_REMAINDER) {
      var highest_brassica = getHighestBrassica();
      if(highest_brassica < 0) highest_brassica = 0;
      var remainder_image = crops[highest_brassica].image_remainder || image_watercress_remainder;
      renderImage(remainder_image, fd.canvas);
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
    } else if(state.present_effect && x == state.presentx && y == state.presenty) {
      blendImage(holiday_images[state.present_image], fd.canvas);
      label = 'egg. ' + label;
    } else if(f.index == 0) {
      label = 'empty ' + label;
    }

    setAriaLabel(fd.div, label);
  }
  if(f.hasCrop() && f.growth < 1) {
    var c = f.getCrop();
    setProgressBar(fd.progress, f.growth, c.type == CROPTYPE_BRASSICA ? '#0c0' : '#f00');
  }
}

function renderField() {
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      updateFieldCellUI(x, y);
    }
  }
}
