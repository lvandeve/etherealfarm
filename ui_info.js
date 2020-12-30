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

// gain if all consumption would be empty.
var gain_pos = Res();

var resourceDivs;

function prodBreakdown(index) {
  var o = {};
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(f.hasCrop()) {
        var c = f.getCrop();;
        if(f.isFullGrown()) {
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
    var dialog = createDialog(DIALOG_SMALL);
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
      result += '<b>Season change in:</b> ' + util.formatDuration(timeTilNextSeason(), true) + '.<br>';
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
  var showResource = function(resin, index, arr_res, arr_gain, arr_pos) {
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

      text = name + '<br>' + res.toString() + '<br>' + gain.toString() + '/s';
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
    div.tooltiptext = text;



    if(!div.tooltipadded) {
      div.tooltipadded = true;
      registerTooltip(div, function() {
        return div.tooltiptext;
      }, /*opt_poll=*/true, /*allow_mobile=*/true);
      div.style.cursor = 'pointer';
      div.onclick = function() {
        var dialog = createDialog(resin ? DIALOG_MEDIUM : DIALOG_SMALL);
        dialog.div.style.backgroundColor = '#cccd'; // slightly translucent to see resources through it
        // computed here rather than inside of updatedialogfun to avoid it being too slow
        var breakdown = prodBreakdown(index);
        var flex = new Flex(dialog, 0.01, 0.01, 0.99, 0.8, 0.3);
        var last = undefined;
        updatedialogfun = bind(function(div, flex) {
          if(div.tooltiptext != last) {
            var html = div.tooltiptext;
            if(!resin) {
              html += 'Breakdown per crop type (as potential production/s): <br/>' + breakdown;
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
  var arr_pos = gain_pos.toArray();

  if(!state.g_max_res.seeds.eqr(0)) showResource(false, 0, arr_res, arr_gain, arr_pos);
  if(!state.g_max_res.spores.eqr(0))showResource(false, 1, arr_res, arr_gain, arr_pos);
  if(state.g_max_res.resin.neqr(0) || state.resin.neqr(0)) showResource(true, 2, arr_res, arr_gain, arr_pos);
  if(!state.g_max_res.leaves.eqr(0)) showResource(false, 3, arr_res, arr_gain, arr_pos);
  if(!state.g_max_res.seeds2.eqr(0)) showResource(false, 4, arr_res, arr_gain, arr_pos);
  if(!state.g_max_res.spores2.eqr(0)) showResource(false, 5, arr_res, arr_gain, arr_pos);
  if(!state.g_max_res.amber.eqr(0)) showResource(false, 6, arr_res, arr_gain, arr_pos);

}

function initInfoUI() {
  resourceDivs = [];
  infoFlex.clear();
}
