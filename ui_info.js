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

// ui_info: the box that contains resources, running time, ...



// resource gain per second, mainly used for display purposes, also used as temporary variable inside update()
// also used for displaying estimated time remaining of upgrade, ...
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


// do this update less regularly because it's a relatively expensive computation
var lastExpectedGainUpdateTime = -1;
var lastExpectedGainNumGrowing = -1;

// a global breakdown into hypothetical, actual, positive and negative production/consumption
function prodBreakdown2() {
  // even though update() computes gain, re-compute it here now (for resources from basic field at least), because it may be slightly different if watercress just disappeared
  // that matters, because if it's out of sync with gain_hyp, it may be displaying the gray parenthesis different one while it's unneeded
  var origgain = gain.clone();
  gain = Res();
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
        gain.addInPlace(p.prod2);
        gain_pos.addInPlace(p.prod3b.getPositive());
        gain_neg.addInPlace(p.prod3b.getNegative());
        gain_hyp.addInPlace(p.prod0b);
        gain_hyp_pos.addInPlace(p.prod0b.getPositive());
        gain_hyp_neg.addInPlace(p.prod0b.getNegative());
      }
    }
  }

  gain.infseeds = origgain.infseeds;

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
    gain_expected = computeFernGain();
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
function getResourceDetails(i, special, index) {
  var name = resource_names[index];
  var res = state.res.atIndex(index);
  var upcoming;
  var upcoming_breakdown;
  if(special) {
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
  }

  var div = resourceDivs[i];

  var res_gain;
  var res_gain_pos;
  var res_gain_hyp;
  var res_gain_hyp_pos;
  var hyp_neq = false; // res_gain_hyp.neq(res_gain) but allowing some numerical tolerance

  if(special) {
    // nothing to do, matching the code flow structure in showResource.
  } else {
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
      var text = '<b>' + upper(name) + '</b><br/><br/>';
      text += 'Transcend to gain the upcoming resin.';
      text += '<br><br>';
      text += 'Total resin earned ever: ' + state.g_res.resin.toString();
      text += '<br/><br/>';
      text += 'Unspent resin: ' + res.toString() + '<br/>';
      text += '→ Production boost for unspent resin: ' + getUnusedResinBonus().subr(1).toPercentString();
      if(basicChallenge()) text += ' (not active during basic challenge)';
      text += '<br><br>';
      text += 'Collected upcoming resin: ' + upcoming.toString()
      if(state.g_numresets >= 1) text += ' (previous run: ' + state.p_res.resin.toString() + ' at level ' + state.p_treelevel + ', ' + util.formatDuration(state.p_runtime, true) + ')';
      text += '<br>';
      if(upcoming.neqr(0)) text += '→ Upcoming boost with unspent resin: ' + getUnusedResinBonusFor(upcoming.add(state.res.resin)).subr(1).toPercentString() + '<br>';

      var early_penalty = getEarlyResinPenalty();
      if(early_penalty < 1 && upcoming.gtr(0)) {
        text += '<br>';
        text += 'Reduction for being very early in run: -' + Num(1 - early_penalty).toPercentString();
        text += '<br>';
      }

      text += '<br>';
      text += 'Resin/hour: ' + getResinHour().toString();
      if(state.g_numresets > 0) text +=  ' (previous run: ' + getPrevResinHour().toString() + ')';
      text += '<br>';
      text += 'Best/hour: ' + state.c_res_hr_best.resin.toString() + ' at level ' + state.c_res_hr_at.resin.valueOf() + ', ' + util.formatDuration(state.c_res_hr_at_time.resin.valueOf(), true);
      if(state.g_numresets > 0) text += ' (previous run: ' + state.p_res_hr_best.resin.toString() + ', lvl ' + state.p_res_hr_at.resin.valueOf() + ', ' + util.formatDuration(state.p_res_hr_at_time.resin.valueOf(), true) + ')';
      text += '<br>';

      text += '<br>';
      if(state.challenge && !challenges[state.challenge].allowsresin) {
        text += 'No resin is gained during the current challenge<br>';
      } else {
        var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
        text += 'Resin added next tree level: ' + nextTreeLevelResin().toString() + ' (getting ' + progress.toPercentString() + ' of this so far)' + '<br>';
      }
    }
    if(index == 3) {
      // twigs
      var text = '<b>' + upper(name) + '</b><br/><br/>';
      text += 'Plant a mistletoe next to the tree in the basic field to gain twigs on transcension.';
      text += '<br><br>';
      text += 'Total twigs earned entire game: ' + state.g_res.twigs.toString();
      text += '<br><br>';
      text += 'Collected upcoming twigs: ' + upcoming.toString()
      if(state.g_numresets >= 1) text += ' (previous run: ' + state.p_res.twigs.toString() + ' at level ' + state.p_treelevel + ')';
      text += '<br>';

      var early_penalty = getEarlyResinPenalty();
      if(early_penalty < 1 && upcoming.gtr(0)) {
        text += '<br>';
        text += 'Reduction for being very early in run: -' + Num(1 - early_penalty).toPercentString();
        text += '<br>';
      }

      text += 'Twigs/hour: ' + getTwigsHour().toString();
      if(state.g_numresets > 0) text += ' (previous run: ' + getPrevTwigsHour().toString() + ', ' + util.formatDuration(state.p_runtime, true) + ')';
      text += '<br>';
      text += 'Best/hour: ' + state.c_res_hr_best.twigs.toString() + ' at level ' + state.c_res_hr_at.twigs.valueOf() + ', ' + util.formatDuration(state.c_res_hr_at_time.twigs.valueOf(), true);
      if(state.g_numresets > 0) text += ' (previous run: ' + state.p_res_hr_best.twigs.toString() + ', lvl ' + state.p_res_hr_at.twigs.valueOf() + ', ' + util.formatDuration(state.p_res_hr_at_time.twigs.valueOf(), true) + ')';
      text += '<br>';

      text += '<br>';
      if(state.challenge && !challenges[state.challenge].allowstwigs) {
        text += 'No twigs are gained during the current challenge<br>';
      } else {
        var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
        text += 'Twigs added next tree level: ' + nextTwigs().toString() + ' (getting ' + progress.toPercentString() + ' of this so far)' + '<br>';
      }
    }
    if(index == 7) {
      // fruit essence
      var text = '<b>Fruit essence</b><br/><br/>';
      text += 'Current amount: ' + res.toString() + '<br/><br/>';
      text += 'Amount from next sacrificed fruits: ' + upcoming.toString() + '<br/><br/>';
      text += 'You can use this to level up the abilities of all fruits: leveling up fruit abilities does not consume global essence, every fruit can use all of it.<br/><br/>';
      if(upcoming_breakdown.length > 1) {
        text += formatBreakdown(upcoming_breakdown, false, 'Upcoming essence breakdown');
      }
    }
    if(index == 6) {
      // amber
      var text = '<b>Amber</b><br/><br/>';
      text += 'Current amount: ' + res.toString() + '<br/><br/>';
      text += 'Amber drops every now and then when the tree levels. You can use it in the \'amber\' tab.<br/><br/>';
    }
  } else {
    var text = '<b>' + upper(name) + '</b><br/><br/>';
    text += 'Current amount: ' + res.toString() + '<br/><br/>';

    if(index == 0 && tooHighSeedConsumption()) {
      text += '<b>Mushrooms are consuming almost all seeds! Plant some high level berries away from mushrooms to get more seeds for upgrades and better crops, or remove some mushrooms if stuck without income</b><br/><br/>';
    }

    if(index == 0 || index == 1) {
      text += 'Highest had: ' + state.c_max_res.atIndex(index).toString();
      text += '<br><br>';
    }

    if(index == 1 && tooLowMushroomSeeds()) {
      if(tooHighSeedConsumption()) {
        text += '<b>Mushrooms are consuming almost all seeds! Plant some high level berries away from mushrooms to get more seeds for upgrades and better crops, or remove some mushrooms if stuck without income</b><br/><br/>';
      } else {
        text += '<b>Mushrooms are getting less seeds than they can potentially consume! Better upgrade berries first now, upgrading mushrooms doesn\'t help now because they\'ll then want to consume even more seeds</b><br/><br/>';
      }
    }

    if(index == 1) text += 'Spores aren\'t used for crops but will automatically level up the tree, which increases the tree progress<br><br>';

    if(index == 4) {
      text += 'Nuts are used for squirrel upgrades, which you can access in the \'squirrel\' tab';
      text += '<br><br>';
      if(haveUnusedNutsBonus()) {
        text += 'Production boost for unspent nuts: ' + getUnusedNutsBonus().subr(1).toPercentString();
        text += '<br><br>';
      }
    }

    if(index == 0) { // seeds
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
    } else if(index == 1) { // spores
      if(res_gain.neq(res_gain_pos)) {
        text += 'Production (' + name + '/s):<br/>';
        text += '• Actual: ' + res_gain.toString() + '/s (= going to your resources)<br/>';
        text += '• Potential: ' + res_gain_pos.toString() + '/s (= what mushrooms can produce if given enough seed income from neighboring berries or they could over-consume)<br/>';
      } else {
        text += 'Production (' + name + '/s): ' + res_gain.toString() + '/s <br/>';
      }
      text += '<br/>';
    } else { // other non-special (= with continuous preoduction/s) resource
      text += 'Production (' + name + '/s): ' + res_gain.toString() + '/s';
      if(res_gain.neqr(0) && res_gain.ltr(0.1) && res_gain.gtr(-0.1)) text += ' (' + res_gain.mulr(3600).toString() + '/h)';
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

// i = index of div, index = index of resource
function showResource(i, special, index) {
  var name = resource_names[index];
  var res = state.res.atIndex(index);
  var upcoming;
  if(special) {
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
  }

  var div = resourceDivs[i];

  var res_gain;
  var res_gain_pos;
  var res_gain_hyp;
  var res_gain_hyp_pos;
  var hyp_neq = false; // res_gain_hyp.neq(res_gain) but allowing some numerical tolerance

  var text = '';
  var label = '';
  if(special) {
    if(index == 2 || index == 3) {
      // 2=resin, 3=twigs
      var hr = (index == 2) ? getResinHour() : getTwigsHour();
      text = name + '<br>' + res.toString() + '<br>(+' + upcoming.toString() + ', ' + hr.toString() + '/hr)';
      label = name + ' ' + res.toString() + ' (+' + upcoming.toString() + ', ' + hr.toString() + '/hr)';
    } else {
      text = name + '<br>' + res.toString();
      if(upcoming) text += '<br>(+' + upcoming.toString() + ')';
      label = name + ' ' + res.toString();
    }
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

    var fontopen = '';
    var fontclose = '';
    if(state.amberprod && (index == 0 || index == 1)) {
      //fontopen = '<font color="#ff0">';
      //fontclose = '</font>';
      fontopen = '<span class="efAmberInfo">';
      fontclose = '</span>';
    }


    text = name;
    text += '<br>' + res.toString();
    text += '<br>' + fontopen + res_gain.toString() + '/s' + fontclose;
    if(index == 0 && tooHighSeedConsumption()) text += ' <font color="#888">(' + res_gain_pos.toString() + '/s)</font>';
    if(index == 1 && hyp_neq) text += ' <font color="#888">(' + res_gain_hyp.toString() + '/s)</font>';
    label = name + ' ' + res.toString() + ', ' + res_gain.toString() + '/s';
  }
  // TODO: this causes "Parse HTML" and this one for the resource info despite being small shows up highest in profiling with chrome dev tools, find a faster way to do this
  div.textEl.innerHTML = text;

  // the label is set to e.g. 'info box: seeds', however the info inside it is more important, so set the label that screen readers read to the useful contents instead
  setAriaLabel(div, label);

  // compared with index because it can sometimes change (e.g. from amber to infinity seeds when unlucking infinity field)
  if(div.tooltipadded != index) {
    div.tooltipadded = index;
    registerTooltip(div, function() {
      return getResourceDetails(i, special, index);
    }, /*opt_poll=*/true, /*allow_mobile=*/true);
    div.style.cursor = 'pointer';
    addButtonAction(div, function() {
      var dialog = createDialog({
        size:DIALOG_MEDIUM,
        title:upper(name + ' income'),
        bgstyle:'efDialogTranslucent'
      });
      // computed here rather than inside of updatedialogfun to avoid it being too slow
      // NOTE: this means it doesn't get auto-updated though.
      var breakdown = prodBreakdown(index);
      if(breakdown == '') breakdown = ' • None yet';
      var flex = dialog.content;
      var last = undefined;
      updatedialogfun = bind(function(div, flex) {
        var text = getResourceDetails(i, special, index);
        if(text != last) {
          var html = text;
          if(!special && index != 5) {
            // TODO: support this also for index 5 (infinity seeds)
            html += 'Breakdown per crop type (as potential production/s): <br/>' + breakdown;
          }

          var breakdowntext = undefined;

          if(index == 2) {
            // resin
            var resin_breakdown = [];
            nextTreeLevelResin(resin_breakdown);
            breakdowntext = formatBreakdown(resin_breakdown, false, 'Resin gain breakdown');

            breakdowntext += '<br><br>Resin source breakdown:<br>';
            if(state.resin.gtr(0)) breakdowntext += ' • Tree: ' + state.resin.toString() + '<br>';
            if(state.fernresin.resin.gtr(0)) breakdowntext += ' • Ferns (not included in the /hr stat): ' + state.fernresin.resin.toString() + '<br>';
            if(state.resin.eqr(0) && state.fernresin.resin.eqr(0)) breakdowntext += ' • None yet<br>';
          }
          if(index == 3) {
            // twigs
            var twigs_breakdown = [];
            nextTwigs(twigs_breakdown)
            breakdowntext = formatBreakdown(twigs_breakdown, false, 'Twigs gain breakdown');
          }

          if(breakdowntext) {
            html += breakdowntext;
          }

          flex.div.innerHTML = html;
          last = text;
        }
      }, div, flex);
      updatedialogfun();
    }, 'info box: ' + name + ' resource');
  }
};

function openTimeInfoDialog() {
  var dialog = createDialog({size:DIALOG_MEDIUM, title:'Game info'});
  var flex = dialog.content;

  var nextlevelprogress = Math.min(1, state.res.spores.div(treeLevelReq(state.treelevel + 1).spores).valueOf());

  var getText = function() {
    var result = '';
    if(state.treelevel > 0) {
      result += '<b>Level:</b> ' + state.treelevel;

      if(state.treelevel >= min_transcension_level) {
        result += '. Transcension available, click the tree.';
      }

      result += '<br><br>';

      var time = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores).div(gain.spores);
      result += '<b>Next tree level requires:</b> ' + treeLevelReq(state.treelevel + 1).toString() + ' (' + util.formatDuration(time.valueOf(), true) + ')' + '<br><br>';

      result += '<b>Progress to next level:</b> ' + Math.floor(nextlevelprogress * 100).toString() + '%' + '<br><br>';

      if(state.g_numresets >= 1) result += '<b>Max level ever:</b> ' + state.g_treelevel + '<br><br>';
    }
    result += '<b>Time in this field:</b> ' + util.formatDuration(state.c_runtime, true, 4, true) + '<br><br>';
    result += '<b>Current season:</b> ' + upper(seasonNames[getSeason()]) + '<br><br>';
    result += '<b>' + upper(seasonNames[getSeason()]) + ' effects:</b><br>';
    var s = getSeason();
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
      result += '• +' + getAutumnMushroomBonus().subr(1).toPercentString() + ' bonus to mushroom spores production, without increasing consumption<br>';
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
    if(s <= 3) {
      result += '<b>Season change in:</b> ' + util.formatDuration(timeTilNextSeason(), true) + '.<br>';
      result += '<br>';
    }

    var have_sun = !!state.upgrades[upgrade_sununlock].count;
    var have_mist = !!state.upgrades[upgrade_mistunlock].count;
    var have_rainbow = !!state.upgrades[upgrade_rainbowunlock].count;
    if(have_sun || have_mist || have_rainbow) {
      result += '<b>Weather abilities:</b><br>';
      if(have_sun) result += '<b>Sun:</b> berry production boost: +' + getSunSeedsBoost().toPercentString() + ', and not negatively affected by winter.' + ' Run time: ' + util.formatDuration(getSunDuration()) + '. Cooldown time: ' + util.formatDuration(getSunWait() - getSunDuration()) + '<br>';
      if(have_mist) result += '<b>Mist:</b> mushroom production boost: +' + getMistSporesBoost().toPercentString() + ', consumption reduced by ' + getMistSeedsBoost().rsub(1).toPercentString() + ', and not negatively affected by winter.' + ' Run time: ' + util.formatDuration(getMistDuration()) + '. Cooldown time: ' + util.formatDuration(getMistWait() - getMistDuration()) + '<br>';
      if(have_rainbow) result += '<b>Rainbow:</b> flower boost: +' + getRainbowFlowerBoost().toPercentString() + ', and not negatively affected by winter.' + ' Run time: ' + util.formatDuration(getRainbowDuration()) + '. Cooldown time: ' + util.formatDuration(getRainbowWait() - getRainbowDuration()) + '<br>';
    }
    return result;
  };
  flex.div.innerHTML = getText();
  updatedialogfun = function() {
    flex.div.innerHTML = getText();
  };
}


function updateResourceUI() {
  var infoDiv = infoFlex.div;
  if(!resourceDivs.length) {
    lastRenderedInfoSeasonBackground = -1;
    for(var y = 0; y < 2; y++) {
      for(var x = 0; x < 4; x++) {
        var i = y * 4 + x;
        var div = makeDiv((x * 25) + '%', (y * 50) + '%', '25%', '50%', infoDiv);
        div.className = 'efInfo';
        centerText2(div);
        div.style.textOverflow = 'hidden';
        div.style.whiteSpace = 'nowrap';
        resourceDivs[i] = div;
        div.style.lineHeight = '90%';
      }
    }
  }
  if(getSeason() != lastRenderedInfoSeasonBackground) {
    lastRenderedInfoSeasonBackground = getSeason();
    for(var i = 0; i < resourceDivs.length; i++) {
      resourceDivs[i].className = 'efInfo ' + season_styles[getSeason()];;
    }
  }

  var texts = [];
  var seasonName = ['🌱 spring 🌱', '☀️ summer ☀️', '🍂 autumn 🍂', '❄️ winter ❄️', 'ethereal', '🔥 infernal 🔥'][getSeason()];
  var title = state.treelevel > 0 ? ('level ' + state.treelevel) : ('time');
  var nextlevelprogress = Math.min(1, state.res.spores.div(treeLevelReq(state.treelevel + 1).spores).valueOf());
  if(state.treelevel > 0) {
    title += ' (' + Math.floor(nextlevelprogress * 100) + '%)';
  }
  if(state.treelevel >= min_transcension_level && state.g_numresets < 5) {
    // special effect to show ability to transcend, but after about 5 resets this is not special anymore
    title = '<span style="text-shadow:0px 0px 5px #ff0">' + title + '</span>';
  }

  var timedisplay = util.formatDuration(state.c_runtime, true, 4, true);
  if(presentGrowSpeedActive()) {
    //timedisplay = '<font color="red">' + timedisplay + '</font>';
    timedisplay = '<font color="#4f8">' + timedisplay + '</font>';
  } else if(presentProductionBoostActive()) {
    timedisplay = '<font color="#f80">' + timedisplay + '</font>';
  }

  resourceDivs[0].textEl.innerHTML = title + '<br>' + timedisplay + '<br>' + seasonName;
  resourceDivs[0].style.cursor = 'pointer';
  if(!resourceDivs[0].tooltipSet) {
    resourceDivs[0].tooltipSet = true;
    addButtonAction(resourceDivs[0], function() {
      openTimeInfoDialog();
    }, 'info box: time and level');
    registerTooltip(resourceDivs[0], function() {
      var text = '';
      text += 'Season change in: ' + util.formatDuration(timeTilNextSeason(), true) + '.<br>';
      if(state.treelevel >= 1) {
        var time = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores).div(gain.spores);
        text += '<br>Next tree level requires: ' + treeLevelReq(state.treelevel + 1).toString() + '<br>(' + util.formatDuration(time.valueOf(), true) + ')';
      }
      if(state.g_numresets >= 1) text += '<br><br>Max level ever: ' + state.g_treelevel;

      if(presentGrowSpeedActive()) {
        text += '<br><br>';
        //text += 'Grow speed effect from present active: crops grow twice as fast for 15 minutes. Time remaining: ' + util.formatDuration(presentGrowSpeedTimeRemaining(), true, 4, true);
        text += 'Grow speed effect from egg active: crops grow twice as fast for 15 minutes. Time remaining: ' + util.formatDuration(presentGrowSpeedTimeRemaining(), true, 4, true);
      }
      if(presentProductionBoostActive()) {
        text += '<br><br>';
        text += 'Production boost effect from egg active: +25% boost to seeds and spores production for 15 minutes. Time remaining: ' + util.formatDuration(presentProductionBoostTimeRemaining(), true, 4, true);
      }
      return text;
    }, true);
  }
  setAriaLabel(resourceDivs[0], title + ', ' + timedisplay + ', ' + seasonName);


  prodBreakdown2();


  var i = 1; // index in resourceDivs
  if(state.g_max_res.seeds.neqr(0)) showResource(i++, false, 0);
  if(state.g_max_res.spores.neqr(0))showResource(i++, false, 1);
  if(state.g_max_res.resin.neqr(0) || state.resin.neqr(0)) showResource(i++, true, 2);
  if(state.g_max_res.twigs.neqr(0) || state.twigs.neqr(0) || state.upgrades2[upgrade2_mistletoe].count) showResource(i++, true, 3);
  if(state.g_max_res.essence.neqr(0)) showResource(i++, true, 7);
  if(state.g_max_res.nuts.neqr(0)) showResource(i++, false, 4);
  if(haveInfinityField()) showResource(i++, false, 5);
  else if(state.g_max_res.amber.neqr(0)) showResource(i++, true, 6);
}

function initInfoUI() {
  resourceDivs = [];
  infoFlex.clear();
}
