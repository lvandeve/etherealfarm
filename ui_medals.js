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

    medalText = new Flex(medalFlex, 0.02, 0.02, 1, 0.05, 1.2);
    medalGrid = new Flex(medalFlex, 0.02, 0.15, 0.9, 2.0);
    medalFlex.div.style.overflowY = 'scroll';
    medalFlex.div.style.overflowX = 'hidden';
  }

  var infoText = ''
  infoText += 'Achievement production bonus: +' + (state.medal_prodmul.subr(1)).toPercentString();

  medalText.div.innerHTML = infoText;

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

    var show = false;
    if(m2.earned) show = true;
    if(m.hint != undefined && state.medals[m.hint].earned) show = true;

    if(!show) continue;
    i++;

    var icon = m.icon;
    if(!m2.earned) {
      icon = medalhidden[m.getTier()];
    }

    if(medal_cache[i]) {
      var o = medal_cache[i];
      if(o.icon == icon && o.seen == m2.seen && o.index == j && o.earned == m2.v) continue;
    }
    medal_cache[i] = {icon:icon, seen:m2.seen, index:j, earned:m2.earned};

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
    if(m2.earned) {
      setAriaLabel(div, 'achievement: ' + m.name);
    } else {
      setAriaLabel(div, 'not-yet-earned achievement: ' + m.name);
    }

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

    if((m2.seen || !m2.earned) && medal_canvases2[i]) {
      util.removeElement(canvas2);
      medal_canvases2[i] = undefined;
    }

    var seenfun = bind(function(m, m2, div, canvas2, i) {
      if(m2.earned && !m2.seen) {
        m2.seen = true;
        util.removeElement(canvas2);
        medal_canvases2[i] = undefined;
      }
    }, m, m2, div, canvas2, i);

    var getMedalText = bind(function(m, m2, div, canvas2, i) {
      var tier = m.getTier();
      if(!m2.earned) {
        return upper(m.name) + '<br><br>Not yet earned. Unearned achievements are normally hidden, except hinted ones like this shown as "?"<br><br>' + 'Production bonus: +' + m.prodmul.toPercentString() + '<br>Tier ' + util.toRoman(tier) + ': ' + upper(tierNames[tier]);
      }
      return upper(m.name) + '<br><br>' + upper(m.description) + '<br><br>' + 'Production bonus: +' + m.prodmul.toPercentString() + '<br>Tier ' + util.toRoman(tier) + ': ' + upper(tierNames[tier]);
    }, m, m2, div, canvas2, i);

    registerTooltip(div, getMedalText);
    util.setEvent(div, 'onmouseover', 'medalseen', seenfun);

    addButtonAction(div, bind(function(getMedalText, seenfun) {
      var dialog = createDialog(DIALOG_SMALL);
      var flex = new Flex(dialog, 0.05, 0.05, 0.95, 0.9, 0.5);
      flex.div.innerHTML = getMedalText();
      seenfun();
    }, getMedalText, seenfun));
  }
}

// the "achievement unlocked" chip at the bottom
var medalChipFlex = undefined;

function removeMedalChip() {
  if(!medalChipFlex) return;

  medalChipFlex.removeSelf();
  medalChipFlex = undefined;
}

function showMedalChip(medal_id) {
  removeMedalChip();
  var m = medals[medal_id];

  medalChipFlex = new Flex(gameFlex, 0.2, 0.85, 0.8, 0.95, 0.35);
  medalChipFlex.div.style.backgroundColor = '#ddde';

  var canvasFlex = new Flex(medalChipFlex, 0.01, [0.5, -0.35], [0, 0.7], [0.5, 0.35]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(m.icon, canvas);

  var textFlex = new Flex(medalChipFlex, [0, 0.7], [0.5, -0.35], 0.99, [0.5, 0.35]);
  //textFlex.div.style.color = '#fff';
  textFlex.div.style.color = '#000';
  textFlex.div.innerHTML = 'Achievement Unlocked' + '<br><br>' + upper(m.name);

  addButtonAction(medalChipFlex.div, removeMedalChip);
}

