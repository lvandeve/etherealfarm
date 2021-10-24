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

// ui_info: the box that contains resources, running time, ...



// resource gain per second, mainly used for display purposes, also used as temporary variable inside update()
// also used for displaying estimated time remaining of upgrade, ...
var gain = Res();

var gain_pos = Res();
var gain_neg = Res();

var gain_hyp = Res();
var gain_hyp_pos = Res();
var gain_hyp_neg = Res();


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
        //o[index2].addInPlace(c.getProd(f).toArray()[index]);
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

// a global breakdown into hypothetical, actual, positive and negative production/consumption
function prodBreakdown2() {
  // even though update() computes gain, re-compute it here now, because it may be slightly different if watercress just disappeared
  // that matters, because if it's out of sync with gain_hyp, it may be displaying the gray parenthesis different one while it's unneeded
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
        gain_pos.addInPlace(p.prod3.getPositive());
        gain_neg.addInPlace(p.prod3.getNegative());
        gain_hyp.addInPlace(p.prod0b);
        gain_hyp_pos.addInPlace(p.prod0b.getPositive());
        gain_hyp_neg.addInPlace(p.prod0b.getNegative());
      }
    }
  }
}

var season_styles = [ 'efSeasonBgSpring', 'efSeasonBgSummer', 'efSeasonBgAutumn', 'efSeasonBgWinter' ];


// for tooltip and dialog, only compute if needed for thos
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
      text += 'Total resin earned ever: ' + state.g_res.resin.toString();
      text += '<br/><br/>';
      text += 'Unspent resin: ' + res.toString() + '<br/>';
      text += '→ Production boost for unspent resin: ' + getUnusedResinBonus().subr(1).toPercentString();
      text += '<br><br>';
      text += 'Collected upcoming resin: ' + upcoming.toString()
      if(state.g_numresets >= 1) text += ' (previous run: ' + state.p_res.resin.toString() + ')';
      text += '<br>';
      if(upcoming.neqr(0)) text += '→ Upcoming boost with unspent resin: ' + getUnusedResinBonusFor(upcoming.add(state.res.resin)).subr(1).toPercentString() + '<br>';

      text += '<br>';
      text += 'Resin/hour: ' + getResinHour().toString();
      if(state.g_numresets > 0) text +=  ' (previous run: ' + getPrevResinHour().toString() + ')';
      text += '<br>';
      text += 'Best/hour: ' + state.c_res_hr_best.resin.toString() + ' at level ' + state.c_res_hr_at.resin.valueOf() + ', ' + util.formatDuration(state.c_res_hr_at_time.resin.valueOf(), true);
      if(state.g_numresets > 0) text += ' (previous run: ' + state.p_res_hr_best.resin.toString() + ', lvl ' + state.p_res_hr_at.resin.valueOf() + ', ' + util.formatDuration(state.p_res_hr_at_time.resin.valueOf(), true) + ')';
      text += '<br>';

      text += '<br>';
      var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
      text += 'Resin added next tree level: ' + nextTreeLevelResin().toString() + ' (getting ' + progress.toPercentString() + ' of this so far)' + '<br>';
    }
    if(index == 3) {
      // twigs
      var text = '<b>' + upper(name) + '</b><br/><br/>';
      text += 'Total twigs earned entire game: ' + state.g_res.twigs.toString();
      text += '<br><br>';
      text += 'Collected upcoming twigs: ' + upcoming.toString();
      if(state.g_numresets >= 1) text += ' (previous run: ' + state.p_res.twigs.toString() + ')';
      text += '<br>';

      text += 'Twigs/hour: ' + getTwigsHour().toString();
      if(state.g_numresets > 0) text += ' (previous run: ' + getPrevTwigsHour().toString() + ')';
      text += '<br>';
      text += 'Best/hour: ' + state.c_res_hr_best.twigs.toString() + ' at level ' + state.c_res_hr_at.twigs.valueOf() + ', ' + util.formatDuration(state.c_res_hr_at_time.twigs.valueOf(), true);
      if(state.g_numresets > 0) text += ' (previous run: ' + state.p_res_hr_best.twigs.toString() + ', lvl ' + state.p_res_hr_at.twigs.valueOf() + ', ' + util.formatDuration(state.p_res_hr_at_time.twigs.valueOf(), true) + ')';
      text += '<br>';

      text += '<br>';
      var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
      text += 'Twigs added next tree level: ' + nextTwigs().toString() + ' (getting ' + progress.toPercentString() + ' of this so far)' + '<br>';
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

    if(index == 1) text += 'Spores aren\'t used for crops but will automatically level up the tree, which increases the tree progress<br><br>';

    if(index == 4) text += 'Nuts are used for squirrel upgrades, which you can access in the \'squirrel\' tab<br><br>';

    if(res_gain.neq(res_gain_pos)) {
      // Total production is production - consumption.
      text += 'Production (' + name + '/s):<br/>';
      text += '• Total: ' + res_gain_pos.toString() + '/s<br/>';
      text += '• To stacks: ' + res_gain.toString() + '/s<br/>';
      text += '• To consumers: ' + (res_gain_pos.sub(res_gain)).toString() + '/s<br/>';
      text += '<br/>';
    } else {
      text += '• Production: ' + res_gain.toString() + '/s<br/>';
      text += '• Consumption: 0/s<br/>'; // This serves as a teaser that consumption can exist
      text += '<br/>';
    }

    if(hyp_neq) {
      // Total production is production - consumption.
      text += 'Potential production (' + name + '/s):<br/>';
      text += '• Total: ' + res_gain_hyp_pos.toString() + '/s<br/>';
      text += '• To stacks: ' + res_gain_hyp.toString() + '/s<br/>';
      text += '• To consumers: ' + (res_gain_hyp_pos.sub(res_gain_hyp)).toString() + '/s<br/>';
      text += '<br/>';
      text += 'Potential production means: if mushrooms could consume as many seed as it needs, even if this is more than neighbor berries can produce';
      text += '<br/><br/>';
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
  if(special) {
    if(index == 2 || index == 3) {
      // 2=resin, 3=twigs
      var hr = (index == 2) ? getResinHour() : getTwigsHour();
      text = name + '<br>' + res.toString() + '<br>(+' + upcoming.toString() + ', ' + hr.toString() + '/hr)';
    } else {
      text = name + '<br>' + res.toString();
      if(upcoming) text += '<br>(→ +' + upcoming.toString() + ')';
    }
  } else {
    res_gain = gain.atIndex(index); // actual
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

    text = name + '<br>' + res.toString() + '<br>' + fontopen + res_gain.toString() + '/s' + fontclose;
    if(hyp_neq) text += ' <font color="#888">(' + res_gain_hyp.toString() + '/s)</font>';
  }
  div.textEl.innerHTML = text;

  if(!div.tooltipadded) {
    div.tooltipadded = true;
    registerTooltip(div, function() {
      return getResourceDetails(i, special, index);
    }, /*opt_poll=*/true, /*allow_mobile=*/true);
    div.style.cursor = 'pointer';
    addButtonAction(div, function() {
      var dialog = createDialog(DIALOG_MEDIUM);
      dialog.div.className = 'efDialogTranslucent';
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
          if(!special) {
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
  var seasonName = ['🌱 spring 🌱', '☀️ summer ☀️', '🍂 autumn 🍂', '❄️ winter ❄️'][getSeason()];
  var title = state.treelevel > 0 ? ('level ' + state.treelevel) : ('time');
  var nextlevelprogress = Math.min(1, state.res.spores.div(treeLevelReq(state.treelevel + 1).spores).valueOf());
  if(state.treelevel > 0) {
    title += ' (' + Math.floor(nextlevelprogress * 100) + '%)';
  }
  if(state.treelevel >= min_transcension_level && state.g_numresets < 5) {
    // special effect to show ability to transcend, but after about 5 resets this is not special anymore
    title = '<span style="text-shadow:0px 0px 5px #ff0">' + title + '</span>';
  }
  resourceDivs[0].textEl.innerHTML = title + '<br>' + util.formatDuration(state.c_runtime, true, 4, true) + '<br>' + seasonName;
  resourceDivs[0].style.cursor = 'pointer';
  addButtonAction(resourceDivs[0], function() {
    var dialog = createDialog(DIALOG_MEDIUM);
    var flex = dialog.content;
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
      }
      result += '<b>Time in this field:</b> ' + util.formatDuration(state.c_runtime, true, 4, true) + '<br><br>';
      result += '<b>Current season:</b> ' + upper(seasonNames[getSeason()]) + '<br><br>';
      result += '<b>' + upper(seasonNames[getSeason()]) + ' Effects:</b><br>';
      var s = getSeason();
      if(s == 0) {
        result += '• +' + getSpringFlowerBonus().subr(1).toPercentString() + ' bonus to flower boost<br>';
        if(state.upgrades2[upgrade2_season2[s]].count) {
          result += '• Crops grow ' + Num(upgrade2_spring_growspeed_bonus).toPercentString() + ' faster (ethereal upgrade)<br>';
          //result += '• Resin bonus: ' + getAlternateResinBonus(s).subr(1).toPercentString() + ' (squirrel upgrade)<br>';
        }
      }
      if(s == 1) {
        result += '• +' + getSummerBerryBonus().subr(1).toPercentString() + ' bonus to berry seed production<br>';
        if(getSummerMushroomBonus().neqr(1)) {
          result += '• +' + getSummerMushroomBonus().subr(1).toPercentString() + ' bonus to mushroom spore production (but also consumption)<br>';
        }
        if(state.upgrades2[upgrade2_season2[s]].count) {
          result += '• Resin bonus: ' + getAlternateResinBonus(s).subr(1).toPercentString() + ' (ethereal upgrade)<br>';
        }
      }
      if(s == 2) {
        result += '• +' + getAutumnMushroomBonus().subr(1).toPercentString() + ' bonus to mushroom spores production, without increasing consumption<br>';
        if(getAutumnBerryBonus().neqr(1)) {
          result += '• +' + getAutumnBerryBonus().subr(1).toPercentString() + ' bonus to berry seed production<br>';
        }
        if(state.upgrades2[upgrade2_mistletoe].count) {
          result += '• Twigs bonus: ' + getAutumnMistletoeBonus().subr(1).toPercentString() + ' more twigs added when tree levels with mistletoes<br>';
        }
        if(state.upgrades2[upgrade2_season2[s]].count) {
          result += '• Resin bonus: ' + getAlternateResinBonus(s).subr(1).toPercentString() + ' (ethereal upgrade)<br>';
        }
      }
      if(s == 3) {
        result += '• Harsh conditions: -' + Num(1).sub(getWinterMalus()).toPercentString() + ' berry / mushroom / flower stats when not next to the tree<br>';
        var winterwarmth_location_text = state.upgrades2[upgrade2_diagonal].count ? ' (orthogonal or diagonal: 10 spots)' : ' (current reach: orthogonal, 6 spots)';
        result += '• Winter tree warmth: +' + getWinterTreeWarmth().subr(1).toPercentString() + ' berry / mushroom stats (also consumption) and no harsh conditions for any crop when next to the tree ' + winterwarmth_location_text + '<br>';
        if(state.upgrades2[upgrade2_season2[s]].count) {
          result += '• Winter tree warmth for flowers: ' + upgrade2_winter_flower_bonus.subr(1).toPercentString() + ' (ethereal upgrade)<br>';
        }
        result += '• Resin bonus: ' + getWinterTreeResinBonus().subr(1).toPercentString() + ' more resin added when tree levels up during the winter<br>';
      }
      result += '<br>';
      result += '<b>Season change in:</b> ' + util.formatDuration(timeTilNextSeason(), true) + '.<br>';
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
      return result;
    };
    flex.div.innerHTML = getText();
    updatedialogfun = function() {
      flex.div.innerHTML = getText();
    };
  }, 'info box: time and level');
  registerTooltip(resourceDivs[0], function() {
    var text = '';
    text += 'Season change in: ' + util.formatDuration(timeTilNextSeason(), true) + '.<br>';
    if(state.treelevel >= 1) {
      var time = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores).div(gain.spores);
      text += '<br>Next tree level requires: ' + treeLevelReq(state.treelevel + 1).toString() + '<br>(' + util.formatDuration(time.valueOf(), true) + ')';
    }
    return text;
  }, true);


  prodBreakdown2();


  var i = 1; // index in resourceDivs
  if(state.g_max_res.seeds.neqr(0)) showResource(i++, false, 0);
  if(state.g_max_res.spores.neqr(0))showResource(i++, false, 1);
  if(state.g_max_res.resin.neqr(0) || state.resin.neqr(0)) showResource(i++, true, 2);
  if(state.g_max_res.twigs.neqr(0)) showResource(i++, true, 3);
  if(state.g_max_res.essence.neqr(0)) showResource(i++, true, 7);
  if(state.g_max_res.nuts.neqr(0)) showResource(i++, false, 4);
  if(state.g_max_res.amber.neqr(0)) showResource(i++, true, 6);
}

function initInfoUI() {
  resourceDivs = [];
  infoFlex.clear();
}
