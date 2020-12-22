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



// resource gain per second, only used for display purposes
var gain = Res();

// similar to gain, but including negative production if present, only displayed if there's a constrained input resource situation
var gain_over = Res();

// gain if all consumption would be empty.
var gain_pos = Res();

// gain if all consumption would be empty and in the hypothetical overconsumption case
var gain_pos_over = Res();

var resourceDivs;

function prodBreakdown(index) {
  var o = {};
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(f.index >= CROPINDEX) {
        if(f.growth >= 1) {
          var c = crops[f.index - CROPINDEX];
          var index2 = c.index;
          if(!o[index2]) o[index2] = Num(0);
          o[index2].addInPlace(c.getProd(f).toArray()[index]);
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

var season_colors = [ '#dbecc8', '#c3e4bc', '#d3be9c', '#eef'];

function updateResourceUI() {
  var infoDiv = infoFlex.div;
  infoDiv.style.backgroundColor = season_colors[getSeason()];
  if(!resourceDivs.length) {
    for(var y = 0; y < 2; y++) {
      for(var x = 0; x < 4; x++) {
        var i = y * 4 + x;
        var div = makeDiv((x * 25) + '%', (y * 50) + '%', '25%', '50%', infoDiv);
        div.style.border = '1px solid black';
        centerText2(div);
        div.style.textOverflow = 'hidden';
        div.style.whiteSpace = 'nowrap';
        resourceDivs[i] = div;
        div.style.lineHeight = '90%';
      }
    }
  }

  var texts = [];
  var seasonName = ['🌱 spring 🌱', '☀️ summer ☀️', '🍂 autumn 🍂', '❄️ winter ❄️'][getSeason()];
  var title = state.treelevel > 0 ? ('level ' + state.treelevel) : ('time');
  var nextlevelprogress = Math.min(1, state.res.spores.div(treeLevelReq(state.treelevel + 1).spores).valueOf());
  if(state.treelevel > 0) {
    title += ' (' + Math.floor(nextlevelprogress * 100) + '%)';
  }
  if(state.treelevel >= min_transcension_level * 2) title += ' [T ' + util.toRoman(Math.floor(state.treelevel / min_transcension_level)) + ']';
  else if(state.treelevel >= min_transcension_level) title += ' [T]';
  resourceDivs[0].textEl.innerHTML = title + '<br>' + util.formatDuration(state.c_runtime, true, 4, true) + '<br>' + seasonName;
  resourceDivs[0].style.cursor = 'pointer';
  resourceDivs[0].onclick = function() {
    var dialog = createDialog(true);
    var flex = new Flex(dialog, 0.01, 0.01, 0.99, 0.8, 0.4);
    var getText = function() {
      var result = '';
      if(state.treelevel > 0) {
        result += '<b>Level:</b> ' + state.treelevel + '<br><br>';
        result += '<b>Progress to next level:</b> ' + Math.floor(nextlevelprogress * 100) + '%' + '<br><br>';
      }
      result += '<b>Time in this field:</b> ' + util.formatDuration(state.c_runtime, true, 4, true) + '<br><br>';
      result += '<b>Time since beginning:</b> ' + util.formatDuration(state.g_runtime, true, 4, true) + '<br><br>';
      result += '<b>Current season:</b> ' + util.upperCaseFirstWord(seasonNames[getSeason()]) + '';
      var s = getSeason();
      if(s == 0) result += '. This boosts flowers.';
      if(s == 1) result += '. Berries love this!';
      if(s == 2) result += '. Mushrooms love this!';
      if(s == 3) result += '. It brings harsh conditions.';
      result += '<br><br>';
      result += '<b>Season change in:</b> ' + util.formatDuration(timeTilNextSeason()) + '.<br>';
      return result;
    };
    flex.div.innerHTML = getText();
    updatedialogfun = function() {
      flex.div.innerHTML = getText();
    };
  };
  registerTooltip(resourceDivs[0], function() {
    if(state.treelevel < 1) return '';
    var time = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores).div(gain.spores);
    return 'Next level requires: ' + treeLevelReq(state.treelevel + 1).toString() + '<br>(' + util.formatDuration(time.valueOf(), true) + ')';
  }, true);

  var i = 1;
  var showResource = function(resin, index, arr_res, arr_gain, arr_over, arr_pos, arr_pos_over) {
    var name = resource_names[index];
    var res = arr_res[index];
    var upcoming;
    if(resin) upcoming = state.resin;

    var text;

    var div = resourceDivs[i];
    i++;


    text = '';
    if(resin) {
      var tlevel = Math.floor(state.treelevel / min_transcension_level);
      if(tlevel < 1) tlevel = 1;
      var roman = tlevel > 1 ? (' ' + util.toRoman(tlevel)) : '';
      var tlevel_mul = Num(tlevel);
      var upcoming2 = upcoming.mul(tlevel_mul);
      text = name + '<br>' + res.toString() + '<br>(→ ' + upcoming2.toString() + ')';
    } else {
      var gain = arr_gain[index]; // actual
      var gain_pos = arr_pos[index]; // actual, without consumption
      var gain_over = arr_over[index]; // potential, in case of overconsumption situation
      var gain_pos_over = arr_pos_over[index]; // potential, without consumption

      var diff = !gain.near(gain_over, 0.02); // different due to constraint production. There is some numerical imprecision possible, so allow near
      var neg = diff ? (' <font color="red">(' + gain_over.toString() + '/s)</font>') : '';
      var sign = gain.gtr(0) ? '+' : '';
      text = name + '<br>' + res.toString() + '<br>' + sign + gain.toString() + '/s' + neg;
    }
    div.textEl.innerHTML = text;

    // tooltip text
    text = '';
    if(resin) {
      var text = '<b>' + util.upperCaseFirstWord(name) + '</b><br/><br/>';
      text += 'Current amount: ' + res.toString() + '<br/><br/>';
      if(tlevel > 1) {
        text += 'Collected resin: ' + upcoming.toString() + '<br/><br/>';
        text += 'Resin bonus for Transcension ' + roman + ': ' + tlevel_mul.toString() + 'x<br/><br/>';
      }
      text += 'Future additional amount: ' + upcoming2.toString() + '<br/><br/>';
    } else {
      var text = '<b>' + util.upperCaseFirstWord(name) + '</b><br/><br/>';
      text += 'Current amount: ' + res.toString() + '<br/><br/>';

      if(index == 1) text += 'Spores aren\'t used for crops but will automatically level up the tree, which increases the tree progress<br><br>';
      if(index == 4) text += 'The pericarps/s (production per second) value is the field power and is used for ethereal upgrades. But the produced pericarps themselves have no purpose yet!<br><br>';

      if(diff) {
        text += 'Production constrained: some resource type consumed by a plant to produce a different resource type, is limited for consumption by the max allowed consumption percentage. The rest goes to your stacks instead of the consumers. To get more output, plant more of the input producer types. E.g. if spores are constrained, get more seed production first to get more spores. You are getting the amount shown in black/white, not the hypothetical amount shown in red.' + '<br/><br/>';

        text += 'Max allowed consumption percentage: ' + ((state.over * 100).toString()) + '%<br/><br/>';

        var actual_prod = gain_pos; // what the plant produces in total
        var actual_stacks = gain; // going to player's stacks
        var actual_cons = gain_pos.sub(gain); // going to other consumers
        /*if(false && actual_prod.eq(actual_stacks)) {
          text += 'Actual ' + name + ': ' + actual_stacks.toString() + '/s<br/><br/>';
        } else*/ {
          text += 'Actual ' + name + ' (= with overconsumption prevented):<br/>';
          text += '• Production: ' + actual_prod.toString() + '/s<br/>';
          text += '• To stacks: ' + actual_stacks.toString() + '/s<br/>';
          text += '• To consumers: ' + actual_cons.toString() + '/s<br/>';
          text += '<br/>';
        }

        // potential = if infinity% overconsumption were allowed
        var potential_prod = gain_pos_over; // what the plant produces in total
        var potential_stacks = gain_over; // going to player's stacks
        var potential_cons = gain_pos_over.sub(gain_over); // going to other consumers

        /*if(false && potential_prod.eq(potential_stacks)) {
          text += '<font color="#f22">Hypothetical ' + name + ': ' + potential_stacks.toString() + '/s</font><br/><br/>';
        } else*/ {
          text += '<font color="#f22">Hypothetical ' + name + ' (= if full overconsumption were allowed):<br/>';
          text += '• Production: ' + potential_prod.toString() + '/s<br/>';
          text += '• To stacks: ' + potential_stacks.toString() + '/s<br/>';
          text += '• To consumers: ' + potential_cons.toString() + '/s<br/>';
          text += '</font><br/>';
        }
      } else {
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
      }
    }
    div.tooltiptext = text;



    if(!div.tooltipadded) {
      div.tooltipadded = true;
      registerTooltip(div, function() {
        return div.tooltiptext;
      }, /*opt_poll=*/true, /*allow_mobile=*/true);
      div.style.cursor = 'pointer';
      div.onclick = function() {
        var dialog = createDialog(resin ? true : false);
        dialog.div.style.backgroundColor = '#cccc'; // slightly translucent to see resources through it
        // computed here rather than inside of updatedialogfun to avoid it being too slow
        var breakdown = prodBreakdown(index);
        var flex = new Flex(dialog, 0.01, 0.01, 0.99, 0.8, 0.3);
        var last = undefined;
        updatedialogfun = bind(function(div, flex) {
          if(div.tooltiptext != last) {
            var html = div.tooltiptext;
            if(!resin) {
              if(diff) {
                html += 'Breakdown per crop type (as potential production/s): <br/>' + breakdown;
              } else {
                html += 'Breakdown per crop type: <br/>' + breakdown;
              }
            }
            flex.div.innerHTML = html;
            last = div.tooltiptext;
          }
        }, div, flex);
        updatedialogfun();
      };
    }
  };


  var arr_res = state.res.toArray();
  var arr_gain = gain.toArray();
  var arr_over = gain_over.toArray();
  var arr_pos = gain_pos.toArray();
  var arr_pos_over = gain_pos_over.toArray();

  if(!state.g_max_res.seeds.eqr(0)) showResource(false, 0, arr_res, arr_gain, arr_over, arr_pos, arr_pos_over);
  if(!state.g_max_res.spores.eqr(0))showResource(false, 1, arr_res, arr_gain, arr_over, arr_pos, arr_pos_over);
  if(state.g_max_res.resin.neqr(0) || state.resin.neqr(0)) showResource(true, 2, arr_res, arr_gain, arr_over, arr_pos, arr_pos_over);
  if(!state.g_max_res.leaves.eqr(0)) showResource(false, 3, arr_res, arr_gain, arr_over, arr_pos, arr_pos_over);
  if(!state.g_max_res.seeds2.eqr(0)) showResource(false, 4, arr_res, arr_gain, arr_over, arr_pos, arr_pos_over);
  if(!state.g_max_res.spores2.eqr(0)) showResource(false, 5, arr_res, arr_gain, arr_over, arr_pos, arr_pos_over);
  if(!state.g_max_res.amber.eqr(0)) showResource(false, 6, arr_res, arr_gain, arr_over, arr_pos, arr_pos_over);

}

function initInfoUI() {
  resourceDivs = [];
  infoFlex.clear();
}
