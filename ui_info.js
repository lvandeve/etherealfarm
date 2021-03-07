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
        var c = f.getCrop();;
        if(f.isFullGrown()) {
          var index2 = c.index;
          if(!o[index2]) o[index2] = Num(0);
          //o[index2].addInPlace(c.getProd(f).toArray()[index]);
          o[index2].addInPlace(p.prod0b.toArray()[index]);
        }
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
  /*if(state.treelevel >= min_transcension_level * 2) title += ' [T ' + util.toRoman(Math.floor(state.treelevel / min_transcension_level)) + ']';
  else if(state.treelevel >= min_transcension_level) title += ' [T]';*/
  if(state.treelevel >= min_transcension_level) {
    //resourceDivs[0].textEl.style.textShadow = '0px 0px 5px #ff0';
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
          var roman = '';
          if(state.treelevel >= min_transcension_level * 2) roman = ' ' + util.toRoman(Math.floor(state.treelevel / min_transcension_level));
          result += '. Transcension' + roman + ' available, click the tree.';
        }

        result += '<br><br>';

        result += '<b>Progress to next level:</b> ' + Math.floor(nextlevelprogress * 100).toString() + '%' + '<br><br>';
      }
      result += '<b>Time in this field:</b> ' + util.formatDuration(state.c_runtime, true, 4, true) + '<br><br>';
      result += '<b>Time since beginning:</b> ' + util.formatDuration(state.g_runtime, true, 4, true) + '<br><br>';
      result += '<b>Current season:</b> ' + upper(seasonNames[getSeason()]) + '<br><br>';
      result += '<b>' + upper(seasonNames[getSeason()]) + ' Effects:</b><br>';
      var s = getSeason();
      if(s == 0) {
        result += '• +' + getSpringFlowerBonus().subr(1).toPercentString() + ' bonus to flower boost<br>';
      }
      if(s == 1) {
        result += '• +' + getSummerBerryBonus().subr(1).toPercentString() + ' bonus to berry seed production<br>';
      }
      if(s == 2) {
        result += '• +' + getAutumnMushroomBonus().subr(1).toPercentString() + ' bonus to mushroom spores production, without increasing consumption<br>';
        if(state.upgrades2[upgrade2_mistletoe].count) {
          result += '• Twigs bonus: ' + getAutumnMistletoeBonus().subr(1).toPercentString() + ' more twigs added when tree levels with mistletoes<br>';
        }
      }
      if(s == 3) {
        result += '• Harsh conditions: -' + Num(1).sub(getWinterMalus()).toPercentString() + ' berry / mushroom / flower stats when not next to the tree<br>';
        var winterwarmth_location_text = state.upgrades2[upgrade2_diagonal].count ? ' (orthogonal or diagonal: 10 spots)' : ' (current reach: orthogonal, 6 spots)';
        result += '• Winter tree warmth: +' + getWinterTreeWarmth().subr(1).toPercentString() + ' berry / mushroom / flower stats when next to the tree ' + winterwarmth_location_text + '<br>';
        result += '• Resin bonus: ' + getWinterTreeResinBonus().subr(1).toPercentString() + ' more resin added when tree levels up during the winter<br>';
      }
      result += '<br><br>';
      result += '<b>Season change in:</b> ' + util.formatDuration(timeTilNextSeason(), true) + '.<br>';
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

  var i = 1;
  var showResource = function(special, index, arr_res, arr_gain, arr_pos, arr_hyp, arr_hyp_pos) {
    var name = resource_names[index];
    var res = arr_res[index];
    var upcoming;
    if(special) {
      if(index == 2) {
        // resin
        upcoming = state.resin;
      }
      if(index == 3) {
        // twigs
        upcoming = state.twigs;
      }
      if(index == 7) {
        // essence
        upcoming = getUpcomingFruitEssence().essence;
      }
    }

    var text;

    var div = resourceDivs[i];
    i++;

    var gain;
    var gain_pos;
    var gain_hyp;
    var gain_hyp_pos;
    var hyp_neq = false; // gain_hyp.neq(gain) but allowing some numerical tolerance


    text = '';
    if(special) {
      if(index == 2 || index == 3) {
        // 2=resin, 3=twigs
        var tlevel = Math.floor(state.treelevel / min_transcension_level);
        if(tlevel < 1) tlevel = 1;
        var roman = tlevel > 1 ? (' ' + util.toRoman(tlevel)) : '';
        var tlevel_mul = Num(tlevel);
        var upcoming2 = upcoming.mul(tlevel_mul);
        text = name + '<br>' + res.toString() + '<br>(→ +' + upcoming2.toString() + ')';
      } else {
        text = name + '<br>' + res.toString();
        if(upcoming) text += '<br>(→ +' + upcoming.toString() + ')';
      }
    } else {
      gain = arr_gain[index]; // actual
      gain_pos = arr_pos[index]; // actual, without consumption
      gain_hyp = arr_hyp[index]; // hypothetical aka potential (if mushrooms were allowed to consume all seeds, making total or neighbor seed production negative)
      gain_hyp_pos = arr_hyp_pos[index]; // hypothetical aka potential, without consumption

      // using near: the computations of gain and gain_hyp may numerically differ, even when they are theoretically the same
      // this could cause the seeds to display a hypothetical number in brackets even though it's the same
      // if this problem persists even with larger tolerance, a different measure  must be taken, such as only displaying hyp if at least one of the resources (like spores) has a significant difference
      var hyp_neq = !gain.near(gain_hyp, 0.01);

      text = name + '<br>' + res.toString() + '<br>' + gain.toString() + '/s';
      if(hyp_neq) text += ' <font color="#888">(' + gain_hyp.toString() + '/s)</font>';
    }
    div.textEl.innerHTML = text;

    // tooltip text
    text = '';
    if(special) {
      if(index == 2) {
        // resin
        var text = '<b>' + upper(name) + '</b><br/><br/>';
        text += 'Total resin earned entire game: ' + state.g_res.resin.toString();
        text += '<br/><br/>';
        text += 'Unspent resin: ' + res.toString() + '<br/>';
        text += '→ Production boost for unspent resin: ' + getUnusedResinBonus().subr(1).toPercentString();
        text += '<br><br>';
        text += 'Collected upcoming resin: ' + upcoming.toString() + '<br>';
        if(tlevel > 1) {
          text += '→ Bonus for Transcension ' + roman + ': ' + tlevel_mul.toString() + 'x, so total: ' + upcoming2.toString();
          text += '<br>';
        }
        if(upcoming2.neqr(0)) text += '→ Upcoming boost for unspent resin: ' + getUnusedResinBonusFor(upcoming2.add(state.res.resin)).subr(1).toPercentString();
      }
      if(index == 3) {
        // twigs
        var text = '<b>Twigs</b><br/><br/>';
        text += 'Current amount: ' + res.toString() + '<br/><br/>';
        text += 'Amount from next tree level up with the current mistletoes: ' + nextTwigs().toString() + '<br/><br/>';
        text += 'Amount earned during this transcension so far: ' + state.c_res.twigs.toString() + '<br/><br/>';
        text += 'Twigs can be gotten by planting mistletoes next to the basic field tree, and appear when the tree levels up. This does increase the spore requirement for tree level up. More mistletoes gives diminishing returns while still increasing spores as much, so max 1 or 2 mistletoes makes sense.<br/><br/>';


        // resin
        var text = '<b>' + upper(name) + '</b><br/><br/>';
        text += 'Total twigs earned entire game: ' + state.g_res.twigs.toString();
        text += '<br><br>';
        text += 'Collected upcoming twigs: ' + upcoming.toString() + '<br>';
        if(tlevel > 1) {
          text += '→ Bonus for Transcension ' + roman + ': ' + tlevel_mul.toString() + 'x, so total: ' + upcoming2.toString();
          text += '<br>';
        }

      }
      if(index == 7) {
        // fruit essence
        var text = '<b>Fruit essence</b><br/><br/>';
        text += 'Current amount: ' + res.toString() + '<br/><br/>';
        text += 'Amount from next sacrificed fruits: ' + upcoming.toString() + '<br/><br/>';
        text += 'Using this to level up fruit abilities does not consume the global essence. Every fruit can use all the essence.<br/><br/>';
      }
    } else {
      var text = '<b>' + upper(name) + '</b><br/><br/>';
      text += 'Current amount: ' + res.toString() + '<br/><br/>';

      if(index == 1) text += 'Spores aren\'t used for crops but will automatically level up the tree, which increases the tree progress<br><br>';

      if(gain.neq(gain_pos)) {
        // Total production is production - consumption.
        text += 'Production (' + name + '/s):<br/>';
        text += '• Total: ' + gain_pos.toString() + '/s<br/>';
        text += '• To stacks: ' + gain.toString() + '/s<br/>';
        text += '• To consumers: ' + (gain_pos.sub(gain)).toString() + '/s<br/>';
        text += '<br/>';
      } else {
        text += '• Production: ' + gain.toString() + '/s<br/>';
        text += '• Consumption: 0/s<br/>'; // This serves as a teaser that consumption can exist
        text += '<br/>';
      }

      if(hyp_neq) {
        // Total production is production - consumption.
        text += 'Potential production (' + name + '/s):<br/>';
        text += '• Total: ' + gain_hyp_pos.toString() + '/s<br/>';
        text += '• To stacks: ' + gain_hyp.toString() + '/s<br/>';
        text += '• To consumers: ' + (gain_hyp_pos.sub(gain_hyp)).toString() + '/s<br/>';
        text += '<br/>';
        text += 'Potential production means: if mushrooms could consume as many seed as it needs, even if this is more than neighbor berries can produce';
        text += '<br/><br/>';
      }
    }
    div.tooltiptext = text;



    if(!div.tooltipadded) {
      div.tooltipadded = true;
      registerTooltip(div, function() {
        return div.tooltiptext;
      }, /*opt_poll=*/true, /*allow_mobile=*/true);
      div.style.cursor = 'pointer';
      addButtonAction(div, function() {
        var dialog = createDialog(special ? DIALOG_SMALL : DIALOG_MEDIUM);
        dialog.div.className = 'efDialogTranslucent';
        // computed here rather than inside of updatedialogfun to avoid it being too slow
        var breakdown = prodBreakdown(index);
        var flex = dialog.content;
        var last = undefined;
        updatedialogfun = bind(function(div, flex) {
          if(div.tooltiptext != last) {
            var html = div.tooltiptext;
            if(!special) {
              html += 'Breakdown per crop type (as potential production/s): <br/>' + breakdown;
            }
            flex.div.innerHTML = html;
            last = div.tooltiptext;
          }
        }, div, flex);
        updatedialogfun();
      }, 'info box: ' + name + ' resource');
    }
  };

  prodBreakdown2();


  var arr_res = state.res.toArray();
  var arr_gain = gain.toArray();
  var arr_pos = gain_pos.toArray();
  var arr_hyp = gain_hyp.toArray();
  var arr_hyp_pos = gain_hyp_pos.toArray();

  if(!state.g_max_res.seeds.eqr(0)) showResource(false, 0, arr_res, arr_gain, arr_pos, arr_hyp, arr_hyp_pos);
  if(!state.g_max_res.spores.eqr(0))showResource(false, 1, arr_res, arr_gain, arr_pos, arr_hyp, arr_hyp_pos);
  if(state.g_max_res.resin.neqr(0) || state.resin.neqr(0)) showResource(true, 2, arr_res, arr_gain, arr_pos, arr_hyp, arr_hyp_pos);
  if(!state.g_max_res.twigs.eqr(0)) showResource(true, 3, arr_res, arr_gain, arr_pos, arr_hyp, arr_hyp_pos);
  //if(!state.g_max_res.seeds2.eqr(0)) showResource(false, 4, arr_res, arr_gain, arr_pos, arr_hyp, arr_hyp_pos);
  //if(!state.g_max_res.spores2.eqr(0)) showResource(false, 5, arr_res, arr_gain, arr_pos, arr_hyp, arr_hyp_pos);
  //if(!state.g_max_res.amber.eqr(0)) showResource(false, 6, arr_res, arr_gain, arr_pos, arr_hyp, arr_hyp_pos);
  if(!state.g_max_res.essence.eqr(0)) showResource(true, 7, arr_res, arr_gain, arr_pos, arr_hyp, arr_hyp_pos);

}

function initInfoUI() {
  resourceDivs = [];
  infoFlex.clear();
}
