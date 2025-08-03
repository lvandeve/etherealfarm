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

var medal_flexes = [];
var medal_canvases = [];
var medal_canvases2 = [];
var medal_cache = [];
var medal_side_cache = []; // for row indicator on the side for rows that contain an exclamation mark
var medal_lastparent = undefined;
var medalGrid;
var medalText;
var medalTierKeys;

function updateMedalUI() {
  if(medal_lastparent != medalFlex) {
    medal_lastparent = medalFlex;
    medal_flexes = [];
    medal_canvases = [];
    medal_canvases2 = [];
    medal_cache = [];
    medal_side_cache = [];

    medalText = new Flex(medalFlex, 0.02, 0.02, 1, 0.05);
    medalGrid = new Flex(medalFlex, 0.02, 0.15, 0.9, 2.0);
    // TODO: use 'grid' aria role (and also add the correct annotations to the children then), like field already has
    //medalFlex.div.style.overflowY = 'scroll';
    //medalFlex.div.style.overflowX = 'hidden';
    makeScrollable(medalFlex);

    var heading = util.makeElement('span', medalGrid.div);
    setAriaRole(heading, 'heading');
    setAriaLabel(heading, 'achievements list');
  }

  var infoText = ''
  infoText += 'Achievement production bonus: +' + (state.medal_prodmul.subr(1)).toPercentString();
  infoText += '<br>';
  infoText += 'Achievements earned: ' + state.medals_earned;

  medalText.div.innerHTML = infoText;

  var unlocked = [];
  var locked = [];

  var w = 64;
  var h = 64;
  var num = medals_order.length;
  var numx = 10;
  //medalFlex.div.removeChild(medalGrid.div);

  var changed = false;

  var row_has_exclamation_mark = false;

  var xpos = -1;
  var ypos = -1;

  var i = -1;
  for(var j = 0; j < num; j++) {
    var m = medals[medals_order[j]];
    var m2 = state.medals[medals_order[j]];

    if((xpos + 1 == numx || j + 1 == num)) {
      if(row_has_exclamation_mark && state.medals_earned > 40) {
        if(medal_side_cache[ypos]) {
          if(!medal_side_cache[ypos].visibility_visible) {
            medal_side_cache[ypos].div.style.visibility = ''; // use '' here, not 'visible': if should inherit from parent, otherwise it can pop through to other tabs
            medal_side_cache[ypos].visibility_visible = true;
          }
        } else {
          var flex = new Flex(medalGrid, [0, 0, numx / 10], [0, 0, ypos / 10], (numx + 1) / 10 - 0.005, [0, 0, (ypos + 1) / 10 - 0.005]);
          var canvas = createCanvas('0%', '20%', '60%', '60%', flex.div);
          renderImage(image_exclamation_side_arrow, canvas);
          medal_side_cache[ypos] = flex;
          medal_side_cache[ypos].visibility_visible = true;
        }
      } else {
        if(medal_side_cache[ypos] && medal_side_cache[ypos].visibility_visible) {
          medal_side_cache[ypos].div.style.visibility = 'hidden';
          medal_side_cache[ypos].visibility_visible = false;
        }
      }
    }

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

    changed = true;

    xpos = i % numx;
    ypos = Math.floor(i / numx);
    if(xpos == 0 && row_has_exclamation_mark) {
      row_has_exclamation_mark = false;
    }

    var flex;
    var div;
    var canvas;
    if(!medal_flexes[i]) {
      flex = new Flex(medalGrid, [0, 0, xpos / 10], [0, 0, ypos / 10], (xpos + 1) / 10 - 0.005, [0, 0, (ypos + 1) / 10 - 0.005]);
      medal_flexes[i] = flex;
      div = flex.div;
      canvas = createCanvas('0%', '0%', '100%', '100%', div);
      medal_canvases[i] = canvas;
    } else {
      flex = medal_flexes[i];
      canvas = medal_canvases[i];
      div = flex.div;
      util.removeAllEvents(div);
    }

    renderImage(icon, canvas);
    if(m2.earned) {
      setAriaLabel(div, 'achievement: ' + m.name);
    } else {
      setAriaLabel(div, 'not-yet-earned achievement: ' + m.name);
    }

    div.style.border = m2.earned ? ('3px solid ' + tierColors[m.getTier()]) : '';
    div.style.backgroundColor = m2.earned ? tierColors_BG[m.getTier()] : '#8888';

    var canvas2 = medal_canvases2[i];
    if(m2.earned && !m2.seen) {
      if(!medal_canvases2[i]) {
        canvas2 = createCanvas('0', '0', '25%', '25%', div);
        medal_canvases[i] = canvas;
        medal_canvases2[i] = canvas2;
        renderImage(image_exclamation, canvas2);
      }
      row_has_exclamation_mark = true;
    }

    if((m2.seen || !m2.earned) && medal_canvases2[i]) {
      util.removeElement(canvas2);
      medal_canvases2[i] = undefined;
    }

    var seenfun = bind(function(m, m2, div, canvas2, i, ypos) {
      if(m2.earned && !m2.seen) {
        m2.seen = true;
        util.removeElement(canvas2);
        medal_canvases2[i] = undefined;
        if(medal_side_cache[ypos] && medal_side_cache[ypos].visibility_visible) {
          medal_side_cache[ypos].div.style.visibility = 'hidden';
          medal_side_cache[ypos].visibility_visible = false;
        }
      }
    }, m, m2, div, canvas2, i, ypos);

    var getMedalText = bind(function(m, m2, div, canvas2, i) {
      var tier = m.getTier();
      if(!m2.earned) {
        return upper(m.name) + '<br><br>Not yet earned. Unearned achievements are normally hidden, except hinted ones like this shown as "?"<br><br>' + 'Production bonus: +' + m.prodmul.toPercentString() + '<br>Tier ' + toRomanUpTo(tier) + ': ' + tierNames[tier];
      }
      return upper(m.name) + ': ' + lower(m.description) + '<br><br>' + 'Production bonus: +' + m.prodmul.toPercentString() + '<br><br>Tier ' + toRomanUpTo(tier) + ': ' + tierNames[tier];
    }, m, m2, div, canvas2, i);

    registerTooltip(div, getMedalText);
    util.setEvent(div, 'mouseover', seenfun, 'medalseen');

    styleButton0(div);
    addButtonAction(div, bind(function(getMedalText, seenfun, m) {
      var dialog = createDialog({
        size:DIALOG_SMALL,
        title:'Achievement',
        icon:m.icon
      });
      dialog.content.div.innerHTML = getMedalText();
      seenfun();
    }, getMedalText, seenfun, m));
  }
  var numshown = i;

  if(changed) {
    // repeat the infoText below the medals once more as well, so you can conveniently see it when scrolled to the bottom too
    var repeatInfoText = state.medals_earned > 100;
    if(medalTierKeys) {
      for(var i = 0; i < medalTierKeys.length; i++) medalTierKeys[i].removeSelf(medalGrid);
    }
    medalTierKeys = [];
    var xpos = 0;
    var ypos = Math.floor(numshown / numx) + (repeatInfoText ? 1.5 : 2);

    var flex = new Flex(medalGrid, [0, 0, xpos / 10], [0, 0, ypos / 10], (xpos + numx - 1) / 10 - 0.005, [0, 0, (ypos + 1) / 10 - 0.005]);
    medalTierKeys.push(flex);
    if(repeatInfoText) {
      flex.div.innerHTML = infoText + '<br><br>Key: tiers from lowest to highest:';
    } else {
      flex.div.innerText = 'Key: tiers from lowest to highest:';
    }

    var numx2 = numx; // 6

    for(var j = 0; j < tierColors.length; j++) {
      var xpos = j % numx2;
      var ypos = Math.floor(numshown / numx) + Math.floor(j / numx2) + 3;
      var flex = new Flex(medalGrid, [0, 0, xpos / 10], [0, 0, ypos / 10], (xpos + 1) / 10 - 0.005, [0, 0, (ypos + 1) / 10 - 0.005]);
      medalTierKeys.push(flex);
      flex.div.style.backgroundColor = tierColors_BG[j];
      flex.div.style.color = util.farthestColorHue(tierColors_BG[j]);
      flex.div.style.border = '4px solid ' + tierColors[j];
      centerText2(flex.div);
      flex.div.textEl.innerText = tierNames[j];
    }
  }
}

// the "achievement unlocked" chip at the bottom
var medalChipFlex = undefined;

function removeMedalChip() {
  if(!medalChipFlex) return;

  medalChipFlex.removeSelf(gameFlex);
  medalChipFlex = undefined;
}

function showMedalChip(medal_id) {
  removeMedalChip();
  var m = medals[medal_id];

  medalChipFlex = new Flex(gameFlex, 0.2, 0.85, 0.8, 0.95);
  medalChipFlex.div.style.backgroundColor = '#ddde';

  var canvasFlex = new Flex(medalChipFlex, 0.01, [0.5, 0, -0.35], [0, 0, 0.7], [0.5, 0, 0.35]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(m.icon, canvas);

  var textFlex = new Flex(medalChipFlex, [0, 0, 0.7], [0.5, 0, -0.35], 0.99, [0.5, 0, 0.35]);
  //textFlex.div.style.color = '#fff';
  textFlex.div.style.color = '#000';
  textFlex.div.innerHTML = 'Achievement Unlocked' + '<br><br>' + upper(m.name) + ' (+' + m.prodmul.toPercentString() + ')';

  addButtonAction(medalChipFlex.div, removeMedalChip);
}

