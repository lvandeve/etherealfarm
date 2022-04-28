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

var rightPanelPrevAutomationState = -1;
var rightPanelPrevNumberFormatState = -1;

// cache the existing upgrade-chips to reuse them. This avoids following problem:
// if chips are rerendered whenever anything related to upgrades updates, then if you click on the buy button with mouse and before you release mouse it updated, the onclick does not work. This causes clicking upgrades to ignore your click when automaton did updates in between
var bottomrightSidePanelFlexCache = [];
var bottomrightSidePanelFlexCacheParent = undefined;

var showingSidePanel = false;

function updateRightPane() {
  if(!rightFlex) return;

  var enableSidePanel = state.sidepanel && (state.g_numnresets > 0 || state.upgrades_unlocked > 0);

  var w = window.innerWidth;
  var h = window.innerHeight;
  if(w / h < 0.95 || !enableSidePanel) {
    //rightFlex.div.style.display = 'none';
    rightFlex.div.style.visibility = 'hidden';
    showingSidePanel = false;
  } else {
    //rightFlex.div.style.display = 'block';
    rightFlex.div.style.visibility = 'visible';
    showingSidePanel = true;
  }

  topRightFlex.clear();

  var automatonState = (automatonEnabled() ? 1 : 0) | (autoUpgradesEnabled() ? 2 : 0) | (autoPlantEnabled() ? 4 : 0) | (state.automaton_unlocked[1] ? 8 : 0) | (state.automaton_unlocked[2] ? 16 : 0) | (autoUnlockEnabled() ? 32 : 0) | (autoPrestigeEnabled() ? 64 : 0);
  var automatonStateChanged = (automatonState != rightPanelPrevAutomationState);
  rightPanelPrevAutomationState = automatonState;

  var numberformatStateChanged = rightPanelPrevNumberFormatState != getNumberFormatCode();
  rightPanelPrevNumberFormatState = getNumberFormatCode();

  if(upgradeUIUpdated || automatonStateChanged || numberformatStateChanged) {
    upgradeUIUpdated = false;

    if(bottomrightSidePanelFlexCacheParent != bottomRightFlex) {
      bottomRightFlex.clear();
      bottomrightSidePanelFlexCache = [];
      bottomrightSidePanelFlexCacheParent = bottomRightFlex;
      var heading = util.makeElement('span', bottomRightFlex.div);
      setAriaRole(heading, 'heading');
      setAriaLabel(heading, 'sidepanel upgrades (only a subset of upgrades tab)');
    }


    var unlocked = [];
    for(var i = 0; i < upgrades_order.length; i++) {
      var j = upgrades_order[i];
      if(upgrades[j].canUpgrade()) unlocked.push(j);
    }

    var maxnum = 12;

    var i = 0;
    for(i = 0; i <= unlocked.length; i++) {
      if(i >= maxnum) break;

      var chip = bottomrightSidePanelFlexCache[i] || new Flex(bottomRightFlex, 0.03, (0.03 + i) / maxnum, 1, (i + 1) / maxnum);
      bottomrightSidePanelFlexCache[i] = chip;

      if(i == 0) {
        if(automatonStateChanged) {
          chip.clear();
          var text = 'Upgrades';
          if(automatonEnabled() && state.automaton_unlocked[1] && state.automaton_unlocked[2]) {
            var chip0 = new Flex(chip, 0, 0, 1, 0.5);
            var chip1 = new Flex(chip, 0, 0.5, 1, 1);
            addButtonAction(chip0.div, function() {
              if(!automatonEnabled()) return;
              if(state.paused) {
                state.automaton_autoplant = (1 - state.automaton_autoplant);
                updateAutomatonUI();
                updateRightPane();
              } else {
                addAction({type:ACTION_TOGGLE_AUTOMATON, what:2, on:(1 - state.automaton_autoplant), fun:function() {
                  updateAutomatonUI();
                  updateRightPane();
                }});
                update();
              }
            });
            addButtonAction(chip1.div, function() {
              if(!automatonEnabled()) return;
              if(state.paused) {
                state.automaton_autoupgrade = (1 - state.automaton_autoupgrade);
                updateAutomatonUI();
                updateRightPane();
              } else {
                addAction({type:ACTION_TOGGLE_AUTOMATON, what:1, on:(1 - state.automaton_autoupgrade), fun:function() {
                  updateAutomatonUI();
                  updateRightPane();
                }});
                update();
              }
            });
            var autoUnlockUnlockedButDisabled = state.automaton_unlocked[3] && !autoUnlockEnabled();
            var autoPrestigeUnlockedButDisabled = state.automaton_unlocked[4] && !autoPrestigeEnabled();
            var text0 = 'Plant: ' + (autoPlantEnabled() ? ((autoUnlockUnlockedButDisabled || autoPrestigeUnlockedButDisabled) ? '<font color="#bb0">auto</font>' : '<font color="#0b0">auto</font>') : '<font color="#b00">manual</font>');
            var text1 = 'Upgrades: ' + (autoUpgradesEnabled() ? '<font color="#0b0">auto</font>' : '<font color="#b00">manual</font>');
            styleButton0(chip0.div);
            styleButton0(chip1.div);
            centerText2(chip0.div);
            centerText2(chip1.div);
            if(autoUnlockUnlockedButDisabled) {
              chip0.div.title = 'quick toggle auto-plant (auto unlock is currently disabled and not toggled by this button, use automaton tab to enable)';
            } else if(autoPrestigeUnlockedButDisabled) {
              chip0.div.title = 'quick toggle auto-plant (auto prestige is currently disabled and not toggled by this button, use automaton tab under the auto unlock settings to enable)';
            } else {
              chip0.div.title = 'quick toggle auto-plant';
            }
            chip1.div.title = 'quick toggle auto-upgrades';
            chip0.div.textEl.innerHTML = text0;
            chip1.div.textEl.innerHTML = text1;
            setAriaLabel(chip.div, 'side panel abbreviated upgrades list');
          } else if(automatonEnabled() && state.automaton_unlocked[1]) {
            var chip0 = new Flex(chip, 0, 0, 1, 1);
            addButtonAction(chip0.div, function() {
              if(!automatonEnabled()) return;
              if(state.paused) {
                state.automaton_autoupgrade = (1 - state.automaton_autoupgrade);
                updateAutomatonUI();
                updateRightPane();
              } else {
                addAction({type:ACTION_TOGGLE_AUTOMATON, what:1, on:(1 - state.automaton_autoupgrade), fun:function() {
                  updateAutomatonUI();
                  updateRightPane();
                }});
                update();
              }
            });
            text = 'Upgrades ' + (autoUpgradesEnabled() ? '<font color="#0b0">(auto)</font>' : '<font color="#b00">(manual)</font>');
            styleButton0(chip0.div);
            centerText2(chip0.div);
            chip0.div.title = 'quick toggle auto-upgrades';
            chip0.div.textEl.innerHTML = text;
            setAriaLabel(chip.div, 'side panel abbreviated upgrades list');
          } else if(unlocked.length) {
            centerText2(chip.div);
            chip.div.textEl.innerHTML = text;
            setAriaLabel(chip.div, 'side panel abbreviated upgrades list');
          } else {
            // do nothing
          }
        }
      } else if(i + 1 == maxnum && unlocked.length + 1 >= maxnum) {
        chip.clear();
        chip.div.style.border = '';
        centerText2(chip.div);
        chip.div.textEl.innerText = 'more in upgrades tab...';
      } else {
        var u = upgrades[unlocked[i - 1]];
        renderUpgradeChip(u, i & 1, i >> 1, 0.45, chip, false, 2);
      }
    }
    for(; i < bottomrightSidePanelFlexCache.length; i++) {
      if(!bottomrightSidePanelFlexCache[i]) continue;
      bottomrightSidePanelFlexCache[i].removeSelf(bottomRightFlex);
      bottomrightSidePanelFlexCache[i] = undefined;
    }
  }

  if(state.g_numresets > 0 || state.upgrades_unlocked > 0) {
    var text = '';
    //var text = '<center>Summary</center>';
    //text += '<br>';
    if(state.g_res.resin.gtr(0)) {
      text += '• Total resin earned ever: ' + state.g_res.resin.toString();
      text += '<br>';
    }
    if(state.g_numresets > 0) {
      if(state.challenge) {
        var c = challenges[state.challenge];
        var c2 = state.challenges[state.challenge];
        var maxlevel = c2.maxlevel;
        if(c.cycling > 1) {
          // for challenge with cycles, show the one belonging to the current cycle
          var cycle = c2.num_completed % c.cycling;
          maxlevel = c2.maxlevels[cycle];
        }
        var newmaxlevel = Math.max(state.treelevel, maxlevel);
        if(c.fullyCompleted()) {
          if(newmaxlevel > maxlevel) {
            //text += '• Max challenge level: ' + newmaxlevel + ' (before: ' + maxlevel + ')';
            text += '• Previous max challenge level: ' + maxlevel + ' (now: ' + newmaxlevel + ')';
          } else {
            text += '• Max challenge level: ' + maxlevel;
          }
        } else {
          var goal = c.nextTargetLevel();
          if(maxlevel == 0) {
            text += '• Challenge level goal: ' + goal;
          } else if(newmaxlevel > maxlevel) {
            text += '• Previous max challenge level: ' + maxlevel + ' (goal: ' + goal + ')';
          } else {
            text += '• Max challenge level: ' + maxlevel + ' (goal: ' + goal + ')';
          }
        }
      } else {
        //text += '• #Transcensions: ' + state.g_numresets;
        //text += '<br>';
        if(state.g_p_treelevel && (state.treelevel > state.g_p_treelevel)) {
          text += '• Previous max tree level ever: ' + state.g_p_treelevel + ' (now: ' + state.g_treelevel + ')';
        } else {
          text += '• Max tree level ever: ' + state.g_treelevel;
        }
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
    var f_active = getActiveFruit();
    if(f_active) {
      text += '• Fruit: ' + f_active.toString() + ': ' + f_active.abilitiesToString(true, true);
      text += '<br>';
    }
    topRightFlex.div.innerHTML = text;
  }

  //rightFlex.update();
}

