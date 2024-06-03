/*
Ethereal Farm
Copyright (C) 2020-2024  Lode Vandevenne

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

// ui_info: the box that contains resources, running time, ...



// resource gain per second, mainly used for display purposes, also used as temporary variable inside update() but shouldn't be relied on for any non-display purpose outside of that
// also used for displaying estimated time remaining of upgrade, ...
// can also get updated, through updateResourceUI, while the game is paused
var gain = Res();

var gain_pos = Res();
var gain_neg = Res();

// hypothetical gain: if mushrooms were not limited by seed consumption
var gain_hyp = Res();
var gain_hyp_pos = Res();
var gain_hyp_neg = Res();

var gain_expected = Res(); // only used for UI display, not for gameplay computation
var gain_expected_hyp = Res();

var resourceDivs;
var lastRenderedInfoSeasonBackground = -1;

// breakdown of which crops produce/consume how much of a particular resource type
function prodBreakdown(index) {
  var o = {};
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      var p = prefield[y][x];
      if(f.hasCrop()) {
        var c = f.getCrop();
        var index2 = c.index;
        if(!o[index2]) o[index2] = Num(0);
        o[index2].addInPlace(p.prod0b.toArray()[index]);
      }
    }
  }
  var list = [];
  for(var k in o) {
    list.push(k);
  }
  list.sort(function(a, b) {
    return a < b;
  });
  var result = '';
  for(var i = 0; i < list.length; i++) {
    var k = list[i];
    if(o[k].eqr(0)) continue;
    result += '• ' + crops[k].name + ': ' + o[k].toString() + '/s<br/>';
  }
  return result;
}

// breakdown of which crops produce/consume how much of a particular resource type in infinity field
function prodBreakdown3(index) {
  if(!haveInfinityField()) return undefined;
  var o = {};
  for(var y = 0; y < state.numh3; y++) {
    for(var x = 0; x < state.numw3; x++) {
      var f = state.field3[y][x];
      if(f.hasCrop()) {
        var c = f.getCrop();
        var index2 = c.index;
        if(!o[index2]) o[index2] = Num(0);
        var p = c.getProd(f);
        o[index2].addInPlace(p.toArray()[index]);
      }
    }
  }
  var list = [];
  for(var k in o) {
    list.push(k);
  }
  list.sort(function(a, b) {
    return a < b;
  });
  var result = '';
  for(var i = 0; i < list.length; i++) {
    var k = list[i];
    if(o[k].eqr(0)) continue;
    result += '• ' + crops3[k].name + ': ' + o[k].toString() + '/s<br/>';
  }
  return result;
}

// computes how many infinity seeds currently spent in the infinity field, what you'd get back from all recoups
// returns array of 2 values: total amount in the field, and amount in finite-lifespan crops (watercress)
function computeField3InfinitySeeds() {
  var total = Num(0);
  var watercress = Num(0);
  var o = {};
  for(var y = 0; y < state.numh3; y++) {
    for(var x = 0; x < state.numw3; x++) {
      var f = state.field3[y][x];
      if(f.hasCrop()) {
        var c = f.getCrop();
        var index = c.index;
        if(!o[index]) o[index] = 0;
        o[index]++;
        var recoup = c.getRecoup(f, -o[index] + 1);
        total.addInPlace(recoup.infseeds);
        if(c.type == CROPTYPE_BRASSICA) watercress.addInPlace(recoup.infseeds);
      }
    }
  }
  return [total, watercress];
}

// computes how many infinity spores currently spent in the infinity pond, what you'd get back from all recoups
function computePondInfinitySpores() {
  // for now the below computation is not needed: spores are always fully refunded when deleting fishes so far so g_res works to keep track
  return state.g_res.infspores.sub(state.res.infspores);

  /*var total = Num(0);
  var o = {};
  for(var y = 0; y < state.pondh; y++) {
    for(var x = 0; x < state.pondw; x++) {
      var f = state.pond[y][x];
      if(f.hasCrop()) {
        var c = f.getCrop();
        var index = c.index;
        if(!o[index]) o[index] = 0;
        o[index]++;
        var recoup = c.getRecoup(f, -o[index] + 1);
        total.addInPlace(recoup.infspores);
      }
    }
  }
  return total;*/
}


// do this update less regularly because it's a relatively expensive computation
var lastExpectedGainUpdateTime = -1;
var lastExpectedGainNumGrowing = -1;

// a global breakdown into hypothetical, actual, positive and negative production/consumption
function prodBreakdownHypo() {
  // even though update() computes gain, re-compute seeds, spores and nuts from it it here now (for resources from basic field at least), because it may be slightly different if watercress just disappeared
  // that matters, because if it's out of sync with gain_hyp, it may be displaying the gray parenthesis different one while it's unneeded

  var newgain = Res(); // copy to ensure we don't remove any unrelated resources (like infseeds and infspores) from the gain
  gain_pos = Res();
  gain_neg = Res();
  gain_hyp = Res();
  gain_hyp_pos = Res();
  gain_hyp_neg = Res();

  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      var p = prefield[y][x];
      if(f.hasCrop()) {
        newgain.addInPlace(p.prod2);
        gain_pos.addInPlace(p.prod3b.getPositive());
        gain_neg.addInPlace(p.prod3b.getNegative());
        gain_hyp.addInPlace(p.prod0b);
        gain_hyp_pos.addInPlace(p.prod0b.getPositive());
        gain_hyp_neg.addInPlace(p.prod0b.getNegative());
      }
    }
  }

  gain.seeds = newgain.seeds;
  gain.spores = newgain.spores;
  gain.nuts = newgain.nuts;

  if((util.getTime() - lastExpectedGainUpdateTime > 5 && state.numgrowing > 0) || state.numgrowing != lastExpectedGainNumGrowing) {
    // Computed for UI display only: the expected gain if all crops would be fullgrown
    gain_expected_hyp = new Res();
    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f = state.field[y][x];
        var c = f.getCrop();
        if(!c) continue;
        gain_expected_hyp.addInPlace(c.getProd(f, 2));
      }
    }
    gain_expected = computePretendFullgrownGain();
    lastExpectedGainUpdateTime = util.getTime();
    lastExpectedGainNumGrowing = state.numgrowing;
  }
}

var season_styles = [ 'efSeasonBgSpring', 'efSeasonBgSummer', 'efSeasonBgAutumn', 'efSeasonBgWinter' ];



function tooHighSeedConsumption() {
  return gain_pos.seeds.gtr(0) && gain.seeds.lt(gain_pos.seeds.mulr(0.3));
}

function tooLowMushroomSeeds() {
  return gain_pos.spores.gtr(0) && gain.spores.lt(gain_pos.spores.mulr(0.9));
}


// for tooltip and dialog, only compute if needed for those
function getResourceDetails(index) {
  var name = resource_names[index];
  var res = state.res.atIndex(index);
  var upcoming;
  var upcoming_breakdown;
  var special = (index == 2 || index == 3 || index == 6 || index == 7); // if true, is resource that doesn't have income/s stat
  if(index == 2) {
    // resin
    upcoming = getUpcomingResinIncludingFerns();
  }
  if(index == 3) {
    // twigs
    upcoming = getUpcomingTwigs();
  }
  if(index == 7) {
    // essence
    upcoming_breakdown = [];
    upcoming = getUpcomingFruitEssence(upcoming_breakdown).essence;
  }

  var res_gain;
  var res_gain_pos;
  var res_gain_hyp;
  var res_gain_hyp_pos;
  var hyp_neq = false; // res_gain_hyp.neq(res_gain) but allowing some numerical tolerance

  if(!special) {
    res_gain = gain.atIndex(index); // actual
    res_gain_pos = gain_pos.atIndex(index); // actual, without consumption
    res_gain_hyp = gain_hyp.atIndex(index); // hypothetical aka potential (if mushrooms were allowed to consume all seeds, making total or neighbor seed production negative)
    res_gain_hyp_pos = gain_hyp_pos.atIndex(index); // hypothetical aka potential, without consumption
    // see comment in showResource
    var hyp_neq = !res_gain.near(res_gain_hyp, 0.002);
  }

  var text = '';
  if(special) {
    if(index == 2) {
      // resin
      text += '<b>' + upper(name) + '</b><br/><br/>';
      text += 'Total resin earned ever: ' + state.g_res.resin.toString();
      text += '<br/><br/>';
      text += 'Unspent resin: ' + res.toString() + '<br/>';
      text += '→ Production boost for unspent resin: ' + getUnusedResinBonus().subr(1).toPercentString();
      if(basicChallenge()) text += ' (not active during basic challenge)';
      text += '<br><br>';
      if(state.challenge && !challenges[state.challenge].allowsresin) {
        text += 'No resin is gained during the current challenge<br>';
      } else {
        text += 'Transcend to gain the upcoming resin.';
        text += '<br><br>';
        text += 'Collected upcoming resin: ' + upcoming.toString()
        if(state.g_numresets >= 1) text += ' (previous run: ' + state.p_res.resin.toString() + ' at level ' + state.p_treelevel + ', ' + util.formatDuration(state.p_runtime, true) + ')';
        text += '<br>';
        if(upcoming.neqr(0)) text += '→ Upcoming boost with unspent resin: ' + getUnusedResinBonusFor(upcoming.add(state.res.resin)).subr(1).toPercentString() + '<br>';

        var early_penalty = getEarlyResinPenalty();
        if(early_penalty < 1 && upcoming.gtr(0)) {
          text += '<br>';
          text += 'Reduction if trancending this early in run now already: -' + Num(1 - early_penalty).toPercentString();
          text += '<br>';
        }

        text += '<br>';
        text += 'Resin/hour: ' + getResinHour().toString();
        if(state.g_numresets > 0) text +=  ' (previous run: ' + getPrevResinHour().toString() + ')';
        text += '<br>';
        text += 'Best/hour: ' + state.c_res_hr_best.resin.toString() + ' at level ' + state.c_res_hr_at.resin.valueOf() + ', ' + util.formatDuration(state.c_res_hr_at_time.resin.valueOf(), true);
        if(state.g_numresets > 0) text += ' (previous run: ' + state.p_res_hr_best.resin.toString() + ', lvl ' + state.p_res_hr_at.resin.valueOf() + ', ' + util.formatDuration(state.p_res_hr_at_time.resin.valueOf(), true) + ')';
        text += '<br>';

        var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
        text += 'Resin added next tree level: ' + nextTreeLevelResin().toString() + ' (getting ' + progress.toPercentString() + ' of this so far)' + '<br>';
      }
    }
    if(index == 3) {
      // twigs
      text += '<b>' + upper(name) + '</b><br/><br/>';
      text += 'Total twigs earned entire game: ' + state.g_res.twigs.toString();
      text += '<br><br>';
      text += 'Production boost for unspent twigs: ' + getUnusedTwigsBonus().subr(1).toPercentString();
      if(basicChallenge()) text += ' (not active during basic challenge)';
      text += '<br><br>';
      if(state.challenge && !challenges[state.challenge].allowstwigs) {
        text += 'No twigs are gained during the current challenge<br>';
      } else {
        text += 'Plant a mistletoe next to the tree in the basic field to gain twigs on transcension.';
        text += '<br><br>';

        text += 'Collected upcoming twigs: ' + upcoming.toString()
        if(state.g_numresets >= 1) text += ' (previous run: ' + state.p_res.twigs.toString() + ' at level ' + state.p_treelevel + ')';
        text += '<br>';

        var early_penalty = getEarlyResinPenalty();
        if(early_penalty < 1 && upcoming.gtr(0)) {
          text += '<br>';
          text += 'Reduction if trancending this early in run now already: -' + Num(1 - early_penalty).toPercentString();
          text += '<br>';
        }

        text += 'Twigs/hour: ' + getTwigsHour().toString();
        if(state.g_numresets > 0) text += ' (previous run: ' + getPrevTwigsHour().toString() + ', ' + util.formatDuration(state.p_runtime, true) + ')';
        text += '<br>';
        text += 'Best/hour: ' + state.c_res_hr_best.twigs.toString() + ' at level ' + state.c_res_hr_at.twigs.valueOf() + ', ' + util.formatDuration(state.c_res_hr_at_time.twigs.valueOf(), true);
        if(state.g_numresets > 0) text += ' (previous run: ' + state.p_res_hr_best.twigs.toString() + ', lvl ' + state.p_res_hr_at.twigs.valueOf() + ', ' + util.formatDuration(state.p_res_hr_at_time.twigs.valueOf(), true) + ')';
        text += '<br>';
        text += '<br>';


        var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
        text += 'Twigs added next tree level: ' + nextTwigs().toString() + ' (getting ' + progress.toPercentString() + ' of this so far)' + '<br>';
      }
    }
    if(index == 7) {
      // fruit essence
      text += '<b>Fruit essence</b><br/><br/>';
      text += 'Current amount: ' + res.toString() + '<br/><br/>';
      text += 'Amount from next sacrificed fruits: ' + upcoming.toString() + '<br/><br/>';
      text += 'You can use this to level up the abilities of all fruits: leveling up fruit abilities does not consume global essence, every fruit can use all of it.<br/><br/>';
      if(upcoming_breakdown.length > 1) {
        text += formatBreakdown(upcoming_breakdown, false, 'Upcoming essence breakdown');
      }
    }
    if(index == 6) {
      // amber
      text += '<b>Amber</b><br/><br/>';
      text += 'Current amount: ' + res.toString() + '<br/><br/>';
      text += 'Amber drops every now and then when the tree levels up. You can use it in the \'amber\' tab.<br/><br/>';
    }
  } else {
    var text = '<b>' + upper(name) + '</b><br/><br/>';
    text += 'Current amount: ' + res.toString() + '<br/>';
    if(index == 5) {
      // infinity seeds
      var infield = computeField3InfinitySeeds();
      var total = infield[0].add(state.res.infseeds);
      text += 'In field: ' + infield[0].toString() + ' (brassica: ' + infield[1].toString() + ')<br>';
      text += 'Total (field + current): ' + total.toString();
      if(infield[1].neqr(0)) text += ' (w/o brassica: ' + total.sub(infield[1]).toString() + ')';
      text += '<br>';
      text += 'Total earned ever: ' + state.g_res.infseeds.toString() + '<br>'; // this can be more than total because some seeds are spent on brassicas that wither
    }
    if(index == 8) {
      // infinity spores
      var inpond = computePondInfinitySpores();
      text += 'In pond: ' + inpond.toString() + '<br>';
      text += 'Total (pond + current): ' + inpond.add(state.res.infspores).toString() + '<br>';
      //text += 'Total earned ever: ' + state.g_res.infspores.toString() + '<br>';
    }
    text += '<br/>';

    if(index == 0 && tooHighSeedConsumption() && state.challenge != challenge_towerdefense) {
      text += '<b>Mushrooms are consuming almost all seeds! Plant some high level berries away from mushrooms to get more seeds for upgrades and better crops, or remove some mushrooms if stuck without income</b><br/><br/>';
    }

    if(index == 0 || index == 1) {
      text += 'Highest had this run: ' + state.c_max_res.atIndex(index).toString();
      text += '<br>';
      text += 'Highest ever had: ' + state.g_max_res.atIndex(index).toString();
      text += '<br><br>';
    }

    if(index == 1 && tooLowMushroomSeeds() && state.challenge != challenge_towerdefense) {
      if(tooHighSeedConsumption()) {
        text += '<b>Mushrooms are consuming almost all seeds! Plant some high level berries away from mushrooms to get more seeds for upgrades and better crops, or remove some mushrooms if stuck without income</b><br/><br/>';
      } else {
        text += '<b>Mushrooms are getting less seeds than they can potentially consume! Better upgrade berries first now, upgrading mushrooms doesn\'t help now because they\'ll then want to consume even more seeds</b><br/><br/>';
      }
    }

    if(index == 1) text += 'Spores aren\'t used for crops but will automatically level up the tree, which increases the tree progress<br><br>';

    if(index == 4) {
      // nuts
      text += 'Highest ever had: ' + state.g_max_res.atIndex(index).toString();
      text += '<br><br>';
      text += 'Nuts are used for squirrel upgrades, which you can access in the \'squirrel\' tab';
      text += '<br><br>';
      if(haveUnusedNutsBonus()) {
        text += 'Production boost for unspent nuts: ' + getUnusedNutsBonus().subr(1).toPercentString();
        text += '<br><br>';
      }
    }

    if(index == 0) { // seeds
      if(state.challenge == challenge_towerdefense) {
        var td = state.towerdef;
        text += 'Tower Defense Income:';
        text += '<br/>';
        text += '• This wave total income: ' + td.wave_gain.seeds.toString();
        text += '<br/><br/>';
        text += 'Production stats below represent the original seeds production of crops, which is consumed by mushroom towers. Those production numbers are not the seed income and don\'t actually go to your stacks however, since seed income is gained by exterminating pests.';
        text += '<br/><br/>';
      }
      if(res_gain.neq(res_gain_pos)) {
        text += 'Production (' + name + '/s):<br/>';
        text += '• To stacks: ' + res_gain.toString() + '/s (= going to your resources)<br/>';
        text += '• To consumers: ' + (res_gain_pos.sub(res_gain)).toString() + '/s (= going to neighboring mushrooms)<br/>';
        text += '• Total: ' + res_gain_pos.toString() + '/s (= what goes to stacks plus what goes to mushroom)<br/>';
        text += '<br/>';
      } else {
        text += '• Production: ' + res_gain.toString() + '/s<br/>';
        text += '• Consumption: 0/s<br/>'; // This serves as a teaser that consumption can exist
        text += '<br/>';
      }

      if(hyp_neq) {
        text += 'Hypothetical production if mushrooms could over-consume and give their full potential spores production:<br/>';
        text += '• To stacks: ' + res_gain_hyp.toString() + '/s (= what would be leftover for stacks if mushrooms could consume all they want, could be negative if mushrooms over-consume)<br/>';
        text += '• To consumers: ' + (res_gain_hyp_pos.sub(res_gain_hyp)).toString() + '/s (= what mushrooms want to consume if enough seed production available)<br/>';
        text += '<br/><br/>';
      }
    } else if(index == 1) {
      // spores
      if(state.challenge == challenge_towerdefense) {
        var td = state.towerdef;
        text += 'Tower Defense Income:';
        text += '<br/>';
        text += '• This wave total income: ' + td.wave_gain.spores.toString();
        text += '<br/>';
        text += '• Damage: ' + td.total_damage.toString();
        text += '<br/><br/>';
        text += 'Production stats below represent the original spore production of mushrooms, which is converted to damage using a formula. Those production numbers are not the actual spores income since that is gained by exterminating pests instead, each wave will drop enough spores to gain one tree level.';
        text += '<br/><br/>';
      }
      if(res_gain.neq(res_gain_pos)) {
        text += 'Production (' + name + '/s):<br/>';
        text += '• Actual: ' + res_gain.toString() + '/s (= going to your resources)<br/>';
        text += '• Potential: ' + res_gain_pos.toString() + '/s (= what mushrooms can produce if given enough seed income from neighboring berries or they could over-consume)<br/>';
      } else {
        text += 'Production (' + name + '/s): ' + res_gain.toString() + '/s <br/>';
      }
      text += '<br/>';
    } else {
      // other non-special (= with continuous preoduction/s) resource
      text += 'Production (' + name + '/s): ' + res_gain.toString() + '/s';
      if(index == 5 || index == 8 || (res_gain.neqr(0) && res_gain.ltr(0.1) && res_gain.gtr(-0.1))) text += ' (' + res_gain.mulr(3600).toString() + '/h)';
      text += '<br/><br/>';
    }
    if(state.numgrowing > 0 && gain_expected_hyp.atIndex(index).neqr(0)) {
      var res_expected = gain_expected.atIndex(index);
      var res_expected_hyp = gain_expected_hyp.atIndex(index);
      text += 'Expected when all fullgrown: ';
      if(res_expected.neq(res_expected_hyp)) {
        if(index == 0) text += res_expected.toString() + '/s (hypothetical if mushrooms could over-consume: ' + res_expected_hyp.toString() + '/s)';
        else text += res_expected.toString() + '/s (potential: ' + res_expected_hyp.toString() + '/s)';
      } else {
        text += res_expected.toString() + '/s';
      }
      text += '<br/>';
    }
  }

  return text;
}

function showResourceDialog(index) {
  var name = resource_names[index];
  var updatedialogfun = function() {
    var text = getResourceDetails(index);
    if(text != last) {
      var html = text;
      if(!special) {
        html += 'Breakdown per crop type (as potential production/s): <br/>' + breakdown;
      }
      // for resin and twigs
      var breakdowntext = undefined;

      if(index == 2 && !(state.challenge && !challenges[state.challenge].allowsresin)) {
        // resin
        var resin_breakdown = [];
        nextTreeLevelResin(resin_breakdown);
        breakdowntext = formatBreakdown(resin_breakdown, false, 'Resin gain breakdown');

        breakdowntext += '<br>Upcoming resin source breakdown:<br>';
        if(state.resin.gtr(0)) breakdowntext += ' • Tree: ' + state.resin.toString() + '<br>';
        if(state.fernresin.resin.gtr(0)) breakdowntext += ' • Ferns (not included in the /hr stat): ' + state.fernresin.resin.toString() + '<br>';
        if(state.resin.eqr(0) && state.fernresin.resin.eqr(0)) breakdowntext += ' • None yet<br>';
      }
      if(index == 3 && !(state.challenge && !challenges[state.challenge].allowstwigs)) {
        // twigs
        var twigs_breakdown = [];
        nextTwigs(twigs_breakdown)
        breakdowntext = formatBreakdown(twigs_breakdown, false, 'Twigs gain breakdown');
      }

      if(breakdowntext) {
        html += breakdowntext;
      }

      if(index == 2) {
        html += '<br>Total resin allocation:<br>';
        var resin_stacks = state.res.resin;
        var resin_field = computeField2Cost().resin; // still usable for other purposes by selling ethereal crops
        var resin_mistletoe = mistletoeupgrades[mistle_upgrade_twigs].getResourceCostToReachLevel(state.mistletoeupgrades[mistle_upgrade_twigs].num).resin;
        var resin_total = state.g_res.resin; // total earned ever
        var resin_upgrades = resin_total.sub(resin_stacks).sub(resin_field).sub(resin_mistletoe); // this is resin that you can never reuse for anything else
        html += '• Stacks: ' + state.res.resin.toString() + '<br>';
        html += '• Ethereal field: ' + computeField2Cost().toString() + '<br>';
        html += '• Ethereal upgrades: ' + resin_upgrades.toString() + '<br>';
        if(state.mistletoeupgrades[mistle_upgrade_twigs].num) {
          html += '• Ethereal mistletoe: ' + resin_mistletoe.toString() + '<br>';
        }
      }

      flex.div.innerHTML = html;
      last = text;
    }
  };

  var dialog = createDialog({
    size:DIALOG_MEDIUM,
    title:upper(name + ' income'),
    bgstyle:'efDialogTranslucent',
    scrollable:true,
    updatedialogfun:updatedialogfun
  });
  var special = (index == 2 || index == 3 || index == 7); // if true, is resource that doesn't have income/s stat
  // computed here rather than inside of updatedialogfun to avoid it being too slow
  // NOTE: this means it doesn't get auto-updated though.
  var breakdown = (index == 5 || index == 8) ? prodBreakdown3(index) : prodBreakdown(index);
  if(breakdown == '') breakdown = ' • None yet';
  var flex = dialog.content;
  var last = undefined;
  updatedialogfun();
}

// i = index of div, index = index of resource
function showResource(i, index, highlight) {
  var name = resource_names[index];
  var res = state.res.atIndex(index);
  var upcoming;
  if(index == 2) {
    // resin
    upcoming = getUpcomingResinIncludingFerns();
  }
  if(index == 3) {
    // twigs
    upcoming = getUpcomingTwigs();
  }
  if(index == 7) {
    // essence
    upcoming = getUpcomingFruitEssence().essence;
  }

  var div = resourceDivs[i][0];

  if(highlight && !div.highlightClassAdded) {
    div.classList.add('efHighlightResource');
    div.highlightClassAdded = true;
  } else if(!highlight && div.highlightClassAdded) {
    div.classList.remove('efHighlightResource');
    div.highlightClassAdded = false;
  }

  var res_gain;
  var res_gain_pos;
  var res_gain_hyp;
  var res_gain_hyp_pos;
  var hyp_neq = false; // res_gain_hyp.neq(res_gain) but allowing some numerical tolerance

  var divs = resourceDivs[i];

  var text1 = '', text2 = '', text3 = '', text4 = '';
  var label = '';
  if(index == 2 || index == 3) {
    // 2=resin, 3=twigs
    var hr = (index == 2) ? getResinHour() : getTwigsHour();
    text1 = name;
    text2 = res.toString();
    text3 = '(+' + upcoming.toString() + ')';
    text4 = hr.toString() + '/hr';
    label = text1 + ' ' + text2 + ' (' + text3 + ', ' + text4 + ')';
  } else if(index == 6) {
    // 6=amber
    text1 = name;
    text2 = res.toString();
    label = text1 + ' ' + text2;
  } else if(index == 7) {
    // 7=essence
    text1 = name;
    text2 = res.toString();
    if(upcoming) text3 += '+' + upcoming.toString();
    label = text1 + ' ' + text2;
  } else {
    res_gain = gain.atIndex(index); // actual
    if(res_gain.gtr(-1e-9) && res_gain.ltr(1e-9)) res_gain = Num(0); // avoid numerical display problem when mushrooms consume all seeds, where it may show something like -227e-15 instead of 0
    res_gain_pos = gain_pos.atIndex(index); // actual, without consumption
    res_gain_hyp = gain_hyp.atIndex(index); // hypothetical aka potential (if mushrooms were allowed to consume all seeds, making total or neighbor seed production negative)
    res_gain_hyp_pos = gain_hyp_pos.atIndex(index); // hypothetical aka potential, without consumption

    // using near: the computations of res_gain and res_gain_hyp may numerically differ, even when they are theoretically the same
    // this could cause the seeds to display a hypothetical number in brackets even though it's the same
    // if this problem persists even with larger tolerance, a different measure  must be taken, such as only displaying hyp if at least one of the resources (like spores) has a significant difference
    var hyp_neq = !res_gain.near(res_gain_hyp, 0.002);

    var highlightamber = false;
    if(state.amberprod && (index == 0 || index == 1)) {
      highlightamber = true;
    }

    if(highlightamber && !divs[3].highlightClassAdded) {
      divs[3].classList.add('efInfoAmber');
      divs[3].highlightClassAdded = true;
    } else if(!highlightamber && divs[3].highlightClassAdded) {
      divs[3].classList.remove('efInfoAmber');
      divs[3].highlightClassAdded = false;
    }

    text1 = name;
    text2 = res.toString();
    text3 = res_gain.toString() + '/s';
    if(index == 0 && tooHighSeedConsumption()) text4 = '(' + res_gain_pos.toString() + '/s)';
    if(index == 1 && hyp_neq) text4 = '(' + res_gain_hyp.toString() + '/s)';
    if((index == 0 || index == 1) && state.challenge == challenge_towerdefense) {
      var td = state.towerdef;
      if(index == 0) {
        text3 = 'Next: ' + td.wave_gain.seeds.toString();
        text4 = '';
      }
      if(index == 1) {
        text3 = 'Next: ' + td.wave_gain.spores.toString();
        text4 = 'Damage: ' + td.total_damage.toString();
      }
    }
    label = text1 + ' ' + text2 + ', ' + text3;
  }

  divs[1].innerText = text1;
  divs[2].innerText = text2;
  divs[3].innerText = text3;
  divs[4].innerText = text4;

  // the label is set to e.g. 'info box: seeds', however the info inside it is more important, so set the label that screen readers read to the useful contents instead
  setAriaLabel(div, label);

  // compared with index because it can sometimes change (e.g. from amber to infinity seeds when unlucking infinity field)
  if(div.tooltipadded != index) {
    if(div.tooltipadded != undefined) {
      // this means it was showing a different resource first (e.g. can happen after just unlocking amber for the first time), remove the tooltip and show dialog action of tha tone
      util.removeAllEvents(div);
    }
    div.tooltipadded = index;
    registerTooltip(div, function() {
      return getResourceDetails(index);
    }, /*opt_poll=*/true, /*allow_mobile=*/true);
    div.style.cursor = 'pointer';
    addButtonAction(div, function() {
      showResourceDialog(index);
    }, 'info box: ' + name + ' resource');
  }
};

function openTimeInfoDialog() {
  var updatedialogfun = function() {
    flex.div.innerHTML = getText();
  };

  var dialog = createDialog({size:DIALOG_MEDIUM, title:'Game info', updatedialogfun:updatedialogfun});
  var flex = dialog.content;

  var nextlevelprogress = Math.min(1, state.res.spores.div(treeLevelReq(state.treelevel + 1).spores).valueOf());

  var getText = function() {
    var result = '';
    if(state.treelevel > 0) {
      result += '<b>Level:</b> ' + state.treelevel;
      if(state.treelevel >= min_transcension_level) {
        result += '. Transcension available, click the tree.';
      }

      if(state.g_numresets >= 1) {
        result += '<br>';
        if(state.g_p_treelevel && (state.treelevel >= state.g_p_treelevel)) {
          result += '<b>Max tree level ever:</b> ' + state.g_treelevel + ' (before: ' + state.g_p_treelevel + ')<br>';
        } else {
          result += '<b>Max tree level ever:</b> ' + state.g_treelevel + '<br>';
        }

        if(state.challenge) {
          var c = challenges[state.challenge];
          var c2 = state.challenges[state.challenge];
          if(c2.num >= 1) {
            var maxlevel = c2.maxlevel;
            if(c.cycling > 1) maxlevel = c2.maxlevels[c2.num_completed % c.cycling];
            if(maxlevel && (state.treelevel >= maxlevel)) {
              result += '<b>Max challenge level:</b> ' + state.treelevel + ' (before: ' + maxlevel + ')<br>';
            } else {
              result += '<b>Max challenge level:</b> ' + maxlevel + '<br>';
            }
          }
        }
      }

      result += '<br>';

      var time = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores).div(gain.spores);
      result += '<b>Next tree level requires:</b> ' + treeLevelReq(state.treelevel + 1).toString() + ' (' + util.formatDuration(time.valueOf(), true) + ')' + '<br>';

      result += '<b>Progress to next level:</b> ' + Math.floor(nextlevelprogress * 100).toString() + '%' + '<br>';


    }
    result += '<br>';
    result += '<b>Time in this field:</b> ' + util.formatDuration(state.c_runtime, true, 4, true) + '<br><br>';

    var s = getSeason();
    if(s <= 3) {
      result += '<b>Season change in:</b> ' + getSeasonChangeInValueText() + '.<br>';
    }

    result += '<b>Current season:</b> ' + upper(seasonNames[getSeason()]) + '<br><br>';

    result += '<b>' + upper(seasonNames[getSeason()]) + ' effects:</b><br>';
    if(s == 0) {
      result += '• +' + getSpringFlowerBonus().subr(1).toPercentString() + ' bonus to flower boost<br>';
      if(state.challenges[challenge_bees].completed) {
        result += '• Bees can reach flowers diagonally too, so they can have 8 neighbors<br>';
      }
      if(state.upgrades2[upgrade2_season2[s]].count && !basicChallenge()) {
        result += '• Crops grow ' + Num(upgrade2_spring_growspeed_bonus).toPercentString() + ' faster (ethereal upgrade)<br>';
        //result += '• Resin bonus: ' + getAlternateResinBonus(s).subr(1).toPercentString() + ' (squirrel upgrade)<br>';
      }
    }
    if(s == 1) {
      result += '• +' + getSummerBerryBonus().subr(1).toPercentString() + ' bonus to berry seed production<br>';
      if(getSummerMushroomBonus().neqr(1)) {
        result += '• +' + getSummerMushroomBonus().subr(1).toPercentString() + ' bonus to mushroom spore production (but also consumption)<br>';
      }
      if(state.upgrades2[upgrade2_season2[s]].count && !basicChallenge()) {
        result += '• Resin bonus: ' + getAlternateResinBonus(s).subr(1).toPercentString() + ' (ethereal upgrade)<br>';
      }
    }
    if(s == 2) {
      result += '• +' + getAutumnMushroomBonus().subr(1).toPercentString() + ' bonus to mushroom spores production, ' + getAutumnMushroomConsumptionReduction().toPercentString() + ' less seed consumption<br>';
      if(getAutumnBerryBonus().neqr(1)) {
        result += '• +' + getAutumnBerryBonus().subr(1).toPercentString() + ' bonus to berry seed production<br>';
      }
      if(state.upgrades2[upgrade2_mistletoe].count && !basicChallenge()) {
        result += '• Twigs bonus: ' + getAutumnMistletoeBonus().subr(1).toPercentString() + ' more twigs added when tree levels with mistletoes<br>';
      }
      if(state.upgrades2[upgrade2_season2[s]].count && !basicChallenge()) {
        result += '• Resin bonus: ' + getAlternateResinBonus(s).subr(1).toPercentString() + ' (ethereal upgrade)<br>';
      }
    }
    if(s == 3) {
      var seen_beehives = state.medals[planttypemedals_bee0].earned;
      result += '• Harsh conditions: -' + Num(1).sub(getWinterMalus()).toPercentString() + ' berry / mushroom / flower' + (seen_beehives ? ' / beehive' : '') + ' stats when not next to the tree<br>';
      result += '• Brassica frost: -' + Num(1).sub(winter_malus_brassica).toPercentString() + ' brassica copying and -' + Num(1).sub(winter_malus_brassica).toPercentString() + ' brassica copying fruit ability when not next to the tree<br>';
      var winterwarmth_location_text = haveDiagonalTreeWarmth() ? ' (orthogonal or diagonal: 10 spots)' : ' (current reach: orthogonal, 6 spots)';
      result += '• Winter tree warmth: +' + getWinterTreeWarmth().subr(1).toPercentString() + ' berry / mushroom stats (also consumption) and no harsh conditions for any crop when next to the tree ' + winterwarmth_location_text + '<br>';
      if(state.upgrades2[upgrade2_season2[s]].count && !basicChallenge()) {
        result += '• Winter tree warmth for flowers: ' + upgrade2_winter_flower_bonus.subr(1).toPercentString() + ' (ethereal upgrade)<br>';
      }
      result += '• Resin bonus: ' + getWinterTreeResinBonus().subr(1).toPercentString() + ' more resin added when tree levels up during the winter<br>';
    }
    if(s == 5) {
      // infernal
      result += '• Crops produce less, the higher tier and upgrade level the worse the effect<br>';
    }
    result += '<br>';

    var have_sun = !!state.upgrades[upgrade_sununlock].count;
    var have_mist = !!state.upgrades[upgrade_mistunlock].count;
    var have_rainbow = !!state.upgrades[upgrade_rainbowunlock].count;
    if(have_sun || have_mist || have_rainbow) {
      result += '<b>Weather abilities:</b><br>';
      if(have_sun) result += '<b>Sun:</b> berry production boost: +' + getSunSeedsBoost().toPercentString() + ', and not negatively affected by winter.' + ' Run time: ' + util.formatDuration(getSunDuration()) + '. Cooldown time: ' + util.formatDuration(getSunWait() - getSunDuration()) + '<br>';
      if(have_mist) result += '<b>Mist:</b> mushroom production boost: +' + getMistSporesBoost().toPercentString() + ', consumption reduced by ' + getMistSeedsBoost().rsub(1).toPercentString() + ', and not negatively affected by winter.' + ' Run time: ' + util.formatDuration(getMistDuration()) + '. Cooldown time: ' + util.formatDuration(getMistWait() - getMistDuration()) + '<br>';
      if(have_rainbow) result += '<b>Rainbow:</b> flower boost: +' + getRainbowFlowerBoost().toPercentString() + ', and not negatively affected by winter.' + ' Run time: ' + util.formatDuration(getRainbowDuration()) + '. Cooldown time: ' + util.formatDuration(getRainbowWait() - getRainbowDuration()) + '<br>';
    }

    if(presentGrowSpeedActive()) {
      if(holidayEventActive() == 1) {
        result += 'Grow speed effect from present active: crops grow twice as fast for 15 minutes. Time remaining: ' + util.formatDuration(presentGrowSpeedTimeRemaining(), true, 4, true);
      } else {
        result += 'Grow speed effect from egg active: crops grow twice as fast for 15 minutes. Time remaining: ' + util.formatDuration(presentGrowSpeedTimeRemaining(), true, 4, true);
      }
    }
    if(presentProductionBoostActive()) {
      if(holidayEventActive() == 1) {
        result += 'Production boost effect from present active: +25% boost to seeds and spores production for 15 minutes. Time remaining: ' + util.formatDuration(presentProductionBoostTimeRemaining(), true, 4, true);
      } else {
        result += 'Production boost effect from egg active: +25% boost to seeds and spores production for 15 minutes. Time remaining: ' + util.formatDuration(presentProductionBoostTimeRemaining(), true, 4, true);
      }
    }

    return result;
  };
  flex.div.innerHTML = getText();
}


function getSeasonChangeInValueText() {
  if(state.amberkeepseason && state.amberkeepseasonused) {
    return 'At end of run';
  } else if(state.amberkeepseason && !state.amberkeepseasonused) {
    return 'At end of run (' + util.formatDuration(timeTilNextSeason(), true) + ')';
  } else {
    return util.formatDuration(timeTilNextSeason(), true);
  }
}

function updateResourceUI() {
  var infoDiv = infoFlex.div;
  if(!resourceDivs.length) {
    lastRenderedInfoSeasonBackground = -1;
    for(var y = 0; y < 2; y++) {
      for(var x = 0; x < 4; x++) {
        var i = y * 4 + x;
        resourceDivs[i] = [];
        var flex = new Flex(infoFlex, x * 0.25, y * 0.5, (x + 1) * 0.25, (y + 1) * 0.5);
        var div = flex.div;
        div.className = 'efInfo';
        div.style.textOverflow = 'hidden';
        div.style.whiteSpace = 'nowrap';
        resourceDivs[i][0] = div;
        div.style.lineHeight = '90%';
        for(var k = 0; k < 4; k++) {
          var flex2 = new Flex(flex, 0, k * 0.25, 1, (k + 1) * 0.25);
          resourceDivs[i][k + 1] = flex2.div;
          centerText(flex2.div);
          if((i == 1 || i == 2) && k == 3) flex2.div.className = 'efInfoResouceConstrained'; // gray indicator for seeds and spores when overconsumption
        }
      }
    }
  }
  if(getSeason() != lastRenderedInfoSeasonBackground) {
    lastRenderedInfoSeasonBackground = getSeason();
    for(var i = 0; i < resourceDivs.length; i++) {
      var div = resourceDivs[i][0];
      resourceDivs[i][0].className = 'efInfo ' + season_styles[getSeason()];
      if(div.highlightClassAdded) div.highlightClassAdded = false;
    }
  }

  var texts = [];
  var seasonName = ['🌱 spring 🌱', '☀️ summer ☀️', '🍂 autumn 🍂', '❄️ winter ❄️', 'ethereal', '🔥 infernal 🔥'][getSeason()];
  var title = state.treelevel > 0 ? ('level ' + state.treelevel) : ('time');
  var nextlevelprogress = Math.min(1, state.res.spores.div(treeLevelReq(state.treelevel + 1).spores).valueOf());
  if(state.treelevel > 0) {
    title += ' (' + Math.floor(nextlevelprogress * 100) + '%)';
  }

  var titleStyle = '';
  if(state.treelevel >= min_transcension_level && state.g_numresets < 5) {
    // special effect to show ability to transcend, but after about 5 resets this is not special anymore
    titleStyle = 'efInfoShadow';
  }

  var timedisplay = util.formatDuration(state.c_runtime, true, 4, true);
  var timedisplayStyle = '';
  if(presentGrowSpeedActive()) {
    timedisplayStyle = 'efInfoPresentGrowSpeed';
  } else if(presentProductionBoostActive()) {
    timedisplayStyle = 'efInfoPresentProdBoost';
  }

  var seasonStyle = '';
  if(state.amberkeepseason) {
    seasonStyle = 'efInfoAmber';
  }
  resourceDivs[0][1].textEl.innerText = title;
  resourceDivs[0][1].textEl.className = titleStyle;
  resourceDivs[0][2].textEl.innerText = timedisplay;
  resourceDivs[0][2].textEl.className = timedisplayStyle;
  resourceDivs[0][3].textEl.innerText = seasonName;
  resourceDivs[0][3].textEl.className = seasonStyle;
  resourceDivs[0][0].style.cursor = 'pointer';
  if(!resourceDivs[0][0].tooltipSet) {
    resourceDivs[0][0].tooltipSet = true;
    addButtonAction(resourceDivs[0][0], function() {
      openTimeInfoDialog();
    }, 'info box: time and level');
    registerTooltip(resourceDivs[0][0], function() {
      var text = '';
      if(state.g_numresets >= 1) {
        if(state.g_p_treelevel && (state.treelevel >= state.g_p_treelevel)) {
          text += 'Max tree level ever: ' + state.g_treelevel + ' (before: ' + state.g_p_treelevel + ')';
        } else {
          text += 'Max tree level ever: ' + state.g_treelevel;
        }
        if(state.challenge) {
          text += '<br>';
          var c = challenges[state.challenge];
          var c2 = state.challenges[state.challenge];
          if(c2.num >= 1) {
            var maxlevel = c2.maxlevel;
            if(c.cycling > 1) maxlevel = c2.maxlevels[c2.num_completed % c.cycling];
            if(maxlevel && (state.treelevel >= maxlevel)) {
              text += 'Max challenge level: ' + state.treelevel + ' (before: ' + maxlevel + ')<br>';
            } else {
              text += 'Max challenge level: ' + maxlevel + '<br>';
            }
          }
        }
        text += '<br><br>';
      }

      if(state.treelevel >= 1) {
        var time = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores).div(gain.spores);
        text += 'Next tree level requires: ' + treeLevelReq(state.treelevel + 1).toString() + '<br>(' + util.formatDuration(time.valueOf(), true) + ')';
        text += '<br><br>';
      }

      text += 'Season change in: ' + getSeasonChangeInValueText() + '.';

      if(presentGrowSpeedActive()) {
        text += '<br><br>';
        if(holidayEventActive() == 1) {
          text += 'Grow speed effect from present active: crops grow twice as fast for 15 minutes. Time remaining: ' + util.formatDuration(presentGrowSpeedTimeRemaining(), true, 4, true);
        } else {
          text += 'Grow speed effect from egg active: crops grow twice as fast for 15 minutes. Time remaining: ' + util.formatDuration(presentGrowSpeedTimeRemaining(), true, 4, true);
        }
      }
      if(presentProductionBoostActive()) {
        text += '<br><br>';
        if(holidayEventActive() == 1) {
          text += 'Production boost effect from present active: +25% boost to seeds and spores production for 15 minutes. Time remaining: ' + util.formatDuration(presentProductionBoostTimeRemaining(), true, 4, true);
        } else {
          text += 'Production boost effect from egg active: +25% boost to seeds and spores production for 15 minutes. Time remaining: ' + util.formatDuration(presentProductionBoostTimeRemaining(), true, 4, true);
        }
      }
      return text;
    }, true);
  }
  setAriaLabel(resourceDivs[0][0], title + ', ' + timedisplay + ', ' + seasonName);


  prodBreakdownHypo();
  // these are usually already set to these values, but not when loading the game in paused state while we still want to display the infinity gain
  gain.infseeds = state.infprod.infseeds;
  gain.infspores = state.infprod.infspores;

  var show_infseeds = haveInfinityField();
  var show_infspores = haveInfinityField() && state.res.infspores.gtr(0);

  // when a new resource is added but not at the end of the resource info chips, highlight it so the fact that there's a new resource is more visible. Stop highlighting after a while, measured by having earned an amount worth a couple of hours to a day of gameplay
  var highlight_nuts = !show_infseeds && state.g_res.nuts.gtr(0) && state.g_res.nuts.ltr(5000);
  var highlight_infseeds = !show_infspores && show_infseeds && state.g_res.infseeds.ltr(50);
  var highlight_infspores = show_infspores && state.g_res.infspores.ltr(100000);

  var i = 1; // index in resourceDivs. 0 is the time.
  if(!show_infseeds && !show_infspores) {
    if(state.g_max_res.seeds.neqr(0)) showResource(i++, 0);
    if(state.g_max_res.spores.neqr(0))showResource(i++, 1);
    if(state.g_max_res.resin.neqr(0) || state.resin.neqr(0)) showResource(i++, 2);
    if(state.g_max_res.nuts.neqr(0)) showResource(i++, 4, highlight_nuts);
    if(state.g_max_res.amber.neqr(0)) showResource(i++, 6);
    if(state.g_max_res.essence.neqr(0)) showResource(i++, 7);
    if(state.g_max_res.twigs.neqr(0) || state.twigs.neqr(0) || state.upgrades2[upgrade2_mistletoe].count) showResource(i++, 3);
  } else if(show_infseeds && !show_infspores) {
    if(state.g_max_res.seeds.neqr(0)) showResource(i++, 0);
    if(state.g_max_res.spores.neqr(0))showResource(i++, 1);
    if(state.g_max_res.resin.neqr(0) || state.resin.neqr(0)) showResource(i++, 2);
    if(state.g_max_res.nuts.neqr(0)) showResource(i++, 4, highlight_nuts);
    showResource(i++, 5, highlight_infseeds); // infinity seeds
    if(state.g_max_res.essence.neqr(0)) showResource(i++, 7);
    if(state.g_max_res.twigs.neqr(0) || state.twigs.neqr(0) || state.upgrades2[upgrade2_mistletoe].count) showResource(i++, 3);
  } else { // show infseeds and infspores
    if(state.g_max_res.seeds.neqr(0)) showResource(i++, 0);
    if(state.g_max_res.spores.neqr(0))showResource(i++, 1);
    if(state.g_max_res.resin.neqr(0) || state.resin.neqr(0)) showResource(i++, 2);
    if(state.g_max_res.nuts.neqr(0)) showResource(i++, 4, highlight_nuts);
    showResource(i++, 5, highlight_infseeds); // infinity seeds
    showResource(i++, 8, highlight_infspores); // infinity spores
    if(state.g_max_res.twigs.neqr(0) || state.twigs.neqr(0) || state.upgrades2[upgrade2_mistletoe].count) showResource(i++, 3);
  }
}

function initInfoUI() {
  resourceDivs = [];
  infoFlex.clear();
}
