/*
Ethereal Farm
Copyright (C) 2020-2021  Lode Vandevenne

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

var rightPanelPrevAutomationEnabled = -1;
var rightPanelPrevUpgradeAutomationEnabled = -1;

function updateRightPane() {
  if(!rightFlex) return;

  var w = window.innerWidth;
  var h = window.innerHeight;
  if(w / h < 0.9 || !state.sidepanel) {
    rightFlex.div.style.display = 'none';
  } else {
    rightFlex.div.style.display = 'block';
  }

  topRightFlex.clear();

  if(upgradeUIUpdated || rightPanelPrevAutomationEnabled != automatonEnabled() || rightPanelPrevUpgradeAutomationEnabled != autoUpgradesEnabled()) {
    upgradeUIUpdated = false;
    bottomRightFlex.clear();

    rightPanelPrevAutomationEnabled = automatonEnabled();
    rightPanelPrevUpgradeAutomationEnabled = autoUpgradesEnabled();

    var unlocked = [];
    for(var i = 0; i < upgrades_order.length; i++) {
      var j = upgrades_order[i];
      if(upgrades[j].canUpgrade()) unlocked.push(j);
    }

    var maxnum = 11;

    for(var i = 0; i <= unlocked.length; i++) {
      if(i >= maxnum) break;
      if(!unlocked.length) return;

      var chip = new Flex(bottomRightFlex, 0, 0 + i / maxnum, 1, (i + 1) / maxnum, 0.65);
      if(i == 0) {
        centerText2(chip.div);
        var text = 'upgrades';
        if(automatonEnabled() && state.automaton_unlocked[1]) {
          addButtonAction(chip.div, function() {
            if(!automatonEnabled()) return;
            state.automaton_autoupgrade = 1 - state.automaton_autoupgrade;
            //updateUpgradeUI();
            updateAutomatonUI();
            updateRightPane();
            //update();
          });
          text = 'upgrades ' + (autoUpgradesEnabled() ? '<font color="#0b0">(auto)</font>' : '<font color="#b00">(manual)</font>');
          styleButton0(chip.div);
          chip.div.title = 'quick toggle auto-upgrades';
        }
        chip.div.textEl.innerHTML = text;
        setAriaLabel(chip.div, 'side panel abbreviated upgrades list');
      } else if(i + 1 == maxnum && unlocked.length > maxnum) {
        centerText2(chip.div);
        chip.div.textEl.innerText = 'more in upgrades tab...';
      } else {
        var u = upgrades[unlocked[i - 1]];
        renderUpgradeChip(u, i & 1, i >> 1, 0.45, chip, false);
      }
    }
  }

  if(state.g_numresets > 0 || state.upgrades_unlocked > 0) {
    var text = '<center>summary</center>';
    text += '<br>';
    if(state.g_res.resin.gtr(0)) {
      text += '• Total resin earned ever: ' + state.g_res.resin.toString();
      text += '<br>';
    }
    if(state.g_numresets > 0) {
      //text += '• #Transcensions: ' + state.g_numresets;
      //text += '<br>';
      if(state.g_p_treelevel && (state.treelevel >= state.g_p_treelevel)) {
        text += '• Max tree level before: ' + state.g_p_treelevel;
      } else {
        text += '• Max tree level ever: ' + state.g_treelevel;
      }
      text += '<br>';
    }
    if(state.treelevel >= 1) {
      var time = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores).div(gain.spores);
      text += '• Next tree level requires: ' + treeLevelReq(state.treelevel + 1).toString() + ' (' + util.formatDuration(time.valueOf(), true) + ')';
      text += '<br>';
    }
    if(state.g_numresets > 0) {
      text += '• Ethereal delete tokens: ' + state.delete2tokens + ' / ' + getDelete2maxBuildup();
      text += '<br>';
    }
    text += '• Season change in: ' + util.formatDuration(timeTilNextSeason(), true);
    text += '<br>';
    if(state.fruit_active.length) {
      text += '• Fruit: ' + state.fruit_active[0].toString() + ': ' + state.fruit_active[0].abilitiesToString(true, true);
      text += '<br>';
    }
    topRightFlex.div.innerHTML = text;
  }
}

