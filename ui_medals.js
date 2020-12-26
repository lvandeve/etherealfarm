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

var medal_flexes = [];
var medal_canvases = [];
var medal_canvases2 = [];
var medal_cache = [];
var medal_lastparent = undefined;
var medalGrid;
var medalText;

function updateMedalUI() {
  if(medal_lastparent != medalFlex) {
    medal_lastparent = medalFlex;
    medal_flexes = [];
    medal_canvases = [];
    medal_canvases2 = [];
    medal_cache = [];

    medalText = new Flex(medalFlex, 0.02, 0.02, 1, 0.05, 1);
    medalGrid = new Flex(medalFlex, 0.02, 0.1, 0.9, 2.0);
    medalFlex.div.style.overflowY = 'scroll';
    medalFlex.div.style.overflowX = 'hidden';
  }

  medalText.div.innerText = 'Achievement production bonus: +' + (state.medal_prodmul.subr(1).mulr(100)).toString() + '%';

  var unlocked = [];
  var locked = [];

  var w = 64;
  var h = 64;
  var num = registered_medals.length;
  var numx = 10;
  //medalFlex.div.removeChild(medalGrid.div);

  var i = -1;
  for(var j = 0; j < num; j++) {
    var m = medals[registered_medals[j]];
    var m2 = state.medals[registered_medals[j]];

    if(!m2.earned) continue;
    i++;

    var icon = m.icon;
    if(!m2.earned) {
      icon = medalhidden[m.getTier()];
    }

    if(medal_cache[i]) {
      var o = medal_cache[i];
      if(o.icon == icon && o.seen == m2.seen && o.index == j) continue;
    }
    medal_cache[i] = {icon:icon, seen:m2.seen, index:j};

    var xpos = i % numx;
    var ypos = Math.floor(i / numx);

    var flex;
    if(!medal_flexes[i]) {
      flex = new Flex(medalGrid, [0, xpos / 10], [0, ypos / 10], [(xpos + 1) / 10 - 0.005], [0, (ypos + 1) / 10 - 0.005]);
      medal_flexes[i] = flex;
    } else {
      flex = medal_flexes[i];
    }

    var div = flex.div;
    var canvas;
    if(!medal_canvases[i]) {
      canvas = createCanvas('0%', '0%', '100%', '100%', div);
      medal_canvases[i] = canvas;
    } else {
      canvas = medal_canvases[i];
    }

    var flex = medal_flexes[i];
    var canvas = medal_canvases[i];

    var div = flex.div;

    renderImage(icon, canvas);

    div.style.border = m2.earned ? ('3px solid ' + tierColors[m.getTier()]) : '';
    div.style.backgroundColor = m2.earned ? util.darkenColor(tierColors[m.getTier()], 0.35) : '#8888';

    var canvas2 = medal_canvases2[i];
    if(m2.earned && !m2.seen) {
      if(!medal_canvases2[i]) {
        canvas2 = createCanvas('0', '0', '25%', '25%', div);
        medal_canvases[i] = canvas;
        medal_canvases2[i] = canvas2;
        renderImage(exclamation, canvas2);
      }
    }

    if(m2.seen && medal_canvases2[i]) {
      util.removeElement(canvas2);
      medal_canvases2[i] = undefined;
    }

    var getMedalText = bind(function(m, m2, div, canvas2, i){
      if(m2.earned && !m2.seen) {
        m2.seen = true;
        div.style.border = '3px solid black';
        util.removeElement(canvas2);
        medal_canvases2[i] = undefined;
      }
      var tier = m.getTier();
      if(!m2.earned) {
        return '???<br>Not yet earned<br>' + 'Production bonus: +' + m.prodmul.mulr(100).toString() + '%' + '<br>Tier ' + util.toRoman(tier) + ': ' + tierNames[tier];
      }
      return util.upperCaseFirstWord(m.name) + '<br>' + util.upperCaseFirstWord(m.description) + '<br>' + 'Production bonus: +' + m.prodmul.mulr(100).toString() + '%' + '<br>Tier ' + tier + ': ' + util.upperCaseFirstWord(tierNames[tier]);
    }, m, m2, div, canvas2, i);

    registerTooltip(div, getMedalText);

    div.onclick = bind(function(getMedalText) {
      var dialog = createDialog(DIALOG_SMALL);
      var flex = new Flex(dialog, 0.05, 0.05, 0.95, 0.9, 0.5);
      flex.div.innerHTML = getMedalText();
    }, getMedalText);
  }
}
