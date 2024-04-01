/*
Ethereal Farm
Copyright (C) 2020-2024  Lode Vandevenne

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

// see comment of renderAutomatonShortcuts: if false, renders with new method horizontally at bottom, if true renders in side panel like before
var renderAutomatonShortcutsInSidePanel = false;

// horizontal = for the new method (as of july 2023) of rendering the automaton shortcuts horizontally at the bottom
// vertical = for the old method of rendering it in a chip in the side panel on the right
function renderAutomatonShortcuts(flex, horizontal) {
  var chip0, chip1, chip2;
  if(horizontal) {
    var w = 0.33;
    chip0 = autoPlantUnlocked() ? new Flex(flex, 0 * w, 0, 1 * w, 1) : undefined;
    chip1 = autoUpgradesUnlocked() ? new Flex(flex, 1 * w, 0, 2 * w, 1) : undefined;
    chip2 = autoActionUnlocked() ? new Flex(flex, 2 * w, 0, 3 * w, 1) : undefined;
  } else {
    var h = autoActionUnlocked() ? 0.33 : 0.5;
    chip0 = autoPlantUnlocked() ? new Flex(flex, 0, 0 * h, 1, 1 * h) : undefined;
    chip1 = autoUpgradesUnlocked() ? new Flex(flex, 0, 1 * h, 1, 2 * h) : undefined;
    chip2 = autoActionUnlocked() ? new Flex(flex, 0, 2 * h, 1, 3 * h) : undefined;
  }
  if(chip0) addButtonAction(chip0.div, function() {
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
  if(chip1) addButtonAction(chip1.div, function() {
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
  if(chip2) addButtonAction(chip2.div, function() {
    if(!automatonEnabled()) return;
    if(state.paused) {
      state.automaton_autoaction = ((state.automaton_autoaction == 1) ? 0 : 1);
      updateAutomatonUI();
      updateRightPane();
    } else {
      addAction({type:ACTION_TOGGLE_AUTOMATON, what:5, on:((state.automaton_autoaction == 1) ? 0 : 1), fun:function() {
        updateAutomatonUI();
        updateRightPane();
      }});
      update();
    }
  });
  var autoUnlockUnlockedButDisabled = autoUnlockUnlocked() && !autoUnlockEnabled();
  var autoPrestigeUnlockedButDisabled = autoPrestigeUnlocked() && !autoPrestigeEnabled();
  var text0 = 'Plant: ' + (autoPlantEnabled() ? ((autoUnlockUnlockedButDisabled || autoPrestigeUnlockedButDisabled) ? '<font color="#bb0">auto</font>' : '<font color="#0b0">auto</font>') : '<font color="#b00">manual</font>');
  var text1 = 'Upgrades: ' + (autoUpgradesEnabled() ? '<font color="#0b0">auto</font>' : '<font color="#b00">manual</font>');
  var text2 = 'Auto-action: ' + (autoActionEnabled() ? '<font color="#0b0">on</font>' : (state.automaton_autoaction == 2 ? '<font color="#c60">off</font>' : '<font color="#b00">off</font>')) + '&nbsp;&nbsp;';
  if(chip0) {
    styleButton0(chip0.div);
    centerText2(chip0.div);
    if(autoUnlockUnlockedButDisabled) {
      chip0.div.title = 'quick toggle auto-plant (auto unlock is currently disabled and not toggled by this button, use automaton tab to enable)';
    } else if(autoPrestigeUnlockedButDisabled) {
      chip0.div.title = 'quick toggle auto-plant (auto prestige is currently disabled and not toggled by this button, use automaton tab under the auto unlock settings to enable)';
    } else {
      chip0.div.title = 'quick toggle auto-plant';
    }
    chip0.div.textEl.innerHTML = text0;
  }
  if(chip1) {
    styleButton0(chip1.div);
    centerText2(chip1.div);
    chip1.div.title = 'quick toggle auto-upgrades';
    chip1.div.textEl.innerHTML = text1;
  }
  if(chip2) {
    styleButton0(chip2.div);
    centerText2(chip2.div);
    chip2.div.title = 'quick toggle auto-action';
    chip2.div.textEl.innerHTML = text2;
    var miniconfigbutton = document.createElement('span');
    chip2.div.textEl.appendChild(miniconfigbutton);
    miniconfigbutton.innerHTML = '&#8201;⚙&#8201;'; // TODO: find a more clean way to make this exactly square
    miniconfigbutton.className = 'efFlatButton';
    miniconfigbutton.title = 'quick edit auto-actions';
    addButtonAction(miniconfigbutton, function(e) {
      showConfigureAutoActionDialog();
      e.stopPropagation();
    });
  }
}

function shouldRenderAutomatonShortcuts() {
  return automatonEnabled() && (autoUpgradesUnlocked() || autoPlantUnlocked() || autoActionUnlocked());
}


// NOTE: for faster access to this info elsewhere, use the showingSidePanel global variable instead
function shouldShowSidePanel() {
  var enableSidePanel = state.sidepanel && (state.g_numnresets > 0 || state.upgrades_unlocked > 0);
  if(!enableSidePanel) return false;
  var w = window.innerWidth;
  var h = window.innerHeight;
  return w / h >= 0.95;
}


function updateRightPane() {
  var automatonState = (automatonEnabled() ? 1 : 0) | (autoUpgradesEnabled() ? 2 : 0) | (autoPlantEnabled() ? 4 : 0) | (autoUpgradesUnlocked() ? 8 : 0) | (autoPlantUnlocked() ? 16 : 0) | (autoUnlockEnabled() ? 32 : 0) | (autoPrestigeEnabled() ? 64 : 0) | (autoActionEnabled() ? 128 : 0);
  var automatonStateChanged = (automatonState != rightPanelPrevAutomationState);
  rightPanelPrevAutomationState = automatonState;

  var numberformatStateChanged = rightPanelPrevNumberFormatState != getNumberFormatCode();
  rightPanelPrevNumberFormatState = getNumberFormatCode();

  // this one is not actually the right pane but here for now since it still shares some code
  if(automatonStateChanged) {
    shortcutFlex.clear();
    if(!renderAutomatonShortcutsInSidePanel && shouldRenderAutomatonShortcuts()) {
      renderAutomatonShortcuts(shortcutFlex, true);
      shortcutFlex.div.style.border = '1px solid gray';
    } else {
      shortcutFlex.div.style.border = '';
    }
  }
  if(!rightFlex) return;

  var w = window.innerWidth;
  var h = window.innerHeight;
  if(shouldShowSidePanel()) {
    //rightFlex.div.style.display = 'block';
    rightFlex.div.style.visibility = 'visible';
    showingSidePanel = true;
  } else {
    //rightFlex.div.style.display = 'none';
    rightFlex.div.style.visibility = 'hidden';
    showingSidePanel = false;
  }

  topRightFlex.clear();

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

      var chip;
      if(i == 0) {
        chip = bottomrightSidePanelFlexCache[i] || new Flex(bottomRightFlex, 0.01, (-0.1 + i) / maxnum, 0.99, (i + 1) / maxnum);
      } else if(i + 1 == maxnum && unlocked.length + 1 >= maxnum) {
        chip = bottomrightSidePanelFlexCache[i] || new Flex(bottomRightFlex, 0.01, (0.03 + i + 0.1) / maxnum, 0.99, (i + 1) / maxnum);
      } else {
        chip = bottomrightSidePanelFlexCache[i] || new Flex(bottomRightFlex, 0.01, (0.03 + i + 0.1) / maxnum, 0.99, (i + 1 + 0.1) / maxnum);
      }
      bottomrightSidePanelFlexCache[i] = chip;

      if(i == 0) {
        if(automatonStateChanged) {
          chip.clear();
          var text = 'Upgrades';
          if(renderAutomatonShortcutsInSidePanel && shouldRenderAutomatonShortcuts()) {
            renderAutomatonShortcuts(chip, false);
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
            text += '• Max challenge level reached: ' + maxlevel;
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
      text += '• Next tree level requires: ' + treeLevelReq(state.treelevel + 1).toString();
      if(time.gtr(0)) text += ' (' + util.formatDuration(time.valueOf(), true) + ')';
      text += '<br>';
    }
    text += '• Season change in: ' + getSeasonChangeInValueText();
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

