/*
Ethereal Farm
Copyright (C) 2020-2023  Lode Vandevenne

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



function makeTreeDialog() {
  var div;

  var have_buttons = state.challenge || automatonUnlocked() || state.challenges_unlocked || state.treelevel >= min_transcension_level;

  var shortcutfun = function(e) {
    var shift = util.eventHasShiftKey(e);
    var ctrl = util.eventHasCtrlKey(e);
    if(automatonUnlocked() && (e.key == 'b' || e.key == 'B') && !ctrl) {
      if(!blueprintdialogopen) createBlueprintsDialog(false);
    }
    if(state.challenges_unlocked && (e.key == 'c' || e.key == 'C') && !ctrl) {
      if(!challengedialogopen) createChallengeDialog();
    }
    if(state.treelevel >= min_transcension_level && (e.key == 't' || e.key == 'T') && !ctrl) {
      createTranscendDialog();
    }
  };

  var treedialogvisible = true;

  var dialog = createDialog({
    nocancel:have_buttons,
    shortcutfun:shortcutfun,
    scrollable:false,
    onclose:function(){treedialogvisible = false;},
    narrow:true,
    title:'Tree',
    bgstyle:'efDialogTranslucent'
  });

  var contentFlex = dialog.content;

  var flex = new Flex(dialog.icon, 0, 0, 1, 1);
  var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(tree_images[treeLevelIndex(state.treelevel)][1][getSeason()], canvas);
  flex = new Flex(dialog.icon, 0, 1, 1, 2);
  canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(tree_images[treeLevelIndex(state.treelevel)][2][getSeason()], canvas);

  var ypos = 0;
  var ysize = 0.1;

  var f0 = new Flex(contentFlex, 0, 0, 1, 0.65);
  makeScrollable(f0);
  var f1 = new Flex(contentFlex, 0, 0.67, 1, 1);

  var createText = function() {
    var text;

    var show_resin = !state.challenge || challenges[state.challenge].allowsresin;
    var show_twigs = !state.challenge || challenges[state.challenge].allowstwigs;
    var resin_breakdown = [];
    var twigs_breakdown = [];

    text = '<b>' + upper(tree_images[treeLevelIndex(state.treelevel)][0]) + '</b><br/>';
    text += 'Tree level: ' + state.treelevel + '<br/>';
    if(state.treelevel == 0 && state.res.spores.eqr(0)) {
      text += 'This tree needs to be rejuvenated first. Requires spores.<br/>';
    }

    if(state.challenge) {
      var c = challenges[state.challenge];
      var c2 = state.challenges[state.challenge];
      var maxlevel = c2.maxlevel;
      if(c.cycling > 1) maxlevel = c2.maxlevels[c2.num_completed % c.cycling];
      text += '<br>';

      var basic = basicChallenge();
      var basicmaxlevel = (basic == 1) ? 30 : 25; // basic challenge capped at level 30, truly basic at 25
      var basicfarlevel = 10 + 7; // level considered far enough above the goal of 10, to start showing the note that it's capped
      var basiccapped = basic && (maxlevel >= basicmaxlevel || state.treelevel >= basicmaxlevel);
      var basicfar = basic && (maxlevel >= basicfarlevel || state.treelevel >= basicfarlevel);
      var addbasicmessage = false;

      if(maxlevel > 0) {
        if(state.treelevel > maxlevel) {
          text += '<b>Challenge active</b>: ' + upper(c.name) + '. You beat your previous best of lvl ' + maxlevel + ' with lvl ' + state.treelevel + '.';
          text += ' This will bring your total challenge production bonus from ' + totalChallengeBonus().toPercentString() + ' to ' + totalChallengeBonusIncludingCurrentRun().toPercentString();
          if(basicfar) addbasicmessage = true;
        } else if(!basiccapped) {
          text += '<b>Challenge active</b>: ' + upper(c.name) + '. You did not yet reach your previous best of lvl ' + maxlevel + '.';
          if(basicfar) addbasicmessage = true;
        } else {
          text += '<b>Challenge active</b>: ' + upper(c.name) + '. You have capped this challenge, you reached ' + maxlevel + ' and it does not give any more bonus or achievements above ' + basicmaxlevel + '.';
        }
      } else {
        text += '<b>Challenge active</b>: ' + upper(c.name);
        var bonus_before = oneChallengeBonus(state.challenge)
        var bonus_after = oneChallengeBonusIncludingCurrentRun(state.challenge);
        var total_bonus_before = totalChallengeBonus();
        var total_bonus_after = totalChallengeBonusIncludingCurrentRun();
        if(bonus_before.neq(bonus_after)) {
          text += '. So far, it will bring your bonus for this challenge from ' + bonus_before.toPercentString() + ' to ' + bonus_after.toPercentString();
          text += ', and your total challenge production bonus from ' + total_bonus_before.toPercentString() + ' to ' + total_bonus_after.toPercentString();
          if(basicfar) addbasicmessage = true;
        }
      }
      if(addbasicmessage) text += '<br><b>Note:</b> this challenge is capped at level ' + basicmaxlevel + ' and will not give any further bonus or achievements beyond that level';
      if(c.targetlevel == undefined) {
        if(!c2.completed) {
          text += '<br>Challenge goal: <b>' + c.targetdescription + '</b>';
        }
      } else if(c.targetlevel.length > 1) {
        if(!c.fullyCompleted()) {
          text += '<br>Current challenge target level: <b>' + c.targetlevel[c2.completed] + '</b>';
        }
      } else {
        if(!c2.completed) {
          text += '<br>Challenge target level: <b>' + c.targetlevel[0] + '</b>';
        }
      }
      text += '<br>';
    }

    if(state.treelevel > 0 || state.res.spores.gtr(0)) {
      text += '<br/>';
      var req = treeLevelReq(state.treelevel + 1);
      var nextlevelprogress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
      text += 'Next level requires: ' + req.toString() + ' (' + (getCostAffordTimer(req)) + ', ' + nextlevelprogress.toPercentString() + ') ' + '<br/>';
      if(state.mistletoes > 0) {
        text += 'This requirement was increased ' + (getMistletoeLeech().subr(1)).toPercentString() + ' by ' + state.mistletoes + ' mistletoes' + '<br/>';
      }
      text += 'Time at this level: ' + util.formatDuration(timeAtTreeLevel(state)) + '<br/>';

      text += '<br>';

      if(show_resin) {
        if(state.challenge && state.treelevel > state.g_treelevel && !state.challenge.allowbeyondhighestlevel) {
          text += 'No further resin gained during this challenge, higher level than max regular level reached';
        } else {
          var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
          text += 'Resin added at next tree level: ' + nextTreeLevelResin(resin_breakdown).toString() + ' (getting ' + progress.toPercentString() + ' of this so far)';
        }

        text += '<br/>';
        text += 'Total resin ready: ' + getUpcomingResinIncludingFerns().toString();
        text += '<br/>';
      } else {
        text += 'The tree doesn\'t produce resin during this challenge.<br/>';
      }
      text += '<br/>';


      if(state.mistletoes > 0) {
        if(show_twigs) {
          if(state.challenge && state.treelevel > state.g_treelevel && !state.challenge.allowbeyondhighestlevel) {
            text += 'No further twigs gained during this challenge, higher level than max regular level reached';
          } else {
            var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
            text += 'Twigs added at next tree level: ' + nextTwigs(twigs_breakdown).twigs.toString() + ' (getting ' + progress.toPercentString() + ' of this so far)';
          }

          text += '<br>';
          text += 'Total twigs ready: ' + getUpcomingTwigs().toString();
          text += '<br/>';
        } else {
          text += 'The tree doesn\'t produce twigs during this challenge.<br/>';
        }
        text += '<br/>';
      }

      text += 'Tree level production boost to crops: ' + (getTreeBoost()).toPercentString();
      if(getFruitAbility(FRUIT_TREELEVEL, true) > 0) {
        var mul = treeLevelFruitBoost(getFruitTier(true), getFruitAbility(FRUIT_TREELEVEL, true), state.treelevel).addr(1);
        text += ' (of which ' + mul.toPercentString() + ' multiplicative from the fruit)';
      }
      text += '<br>';

      if(getSeason() == 3) {
        text += '<br/>';
        text += 'During winter, the tree provides winter warmth: +' + getWinterTreeWarmth().subr(1).toPercentString() + ' berry / mushroom stats and no negative winter effect for any crop next to the tree<br>';
      }

      if(state.untriedchallenges) {
        text += '<br/>';
        text += '<span class="efWarningOnDialogText">New challenge available!</span><br>';
      }

      if(state.upgrades[upgrade_mistunlock].unlocked || state.upgrades[upgrade_sununlock].unlocked || state.upgrades[upgrade_rainbowunlock].unlocked) {
        text += '<br/>';
        text += 'Abilities discovered:<br>';
        if(state.upgrades[upgrade_sununlock].unlocked) text += '• Sun: benefits berries when active<br>';
        if(state.upgrades[upgrade_mistunlock].unlocked) text += '• Mist: benefits mushrooms when active<br>';
        if(state.upgrades[upgrade_rainbowunlock].unlocked) text += '• Rainbow: benefits flowers when active<br>';
      }

      if(resin_breakdown && resin_breakdown.length >= 1) {
        text += formatBreakdown(resin_breakdown, false, 'Resin gain breakdown');
      }

      if(twigs_breakdown && twigs_breakdown.length >= 1) {
        text += formatBreakdown(twigs_breakdown, false, 'Twigs gain breakdown');
      }

      if(haveMultiplicity(CROPTYPE_BERRY)) text += '<br>Multiplicities:<br>';

      if(haveMultiplicity(CROPTYPE_BERRY)) {
        text += '• Berry: +' + (getMultiplicityBonusBase(CROPTYPE_BERRY)).toPercentString() + ' per other of same type of max 1 tier difference<br>';
      }
      if(haveMultiplicity(CROPTYPE_MUSH)) {
        text += '• Mushroom: +' + (getMultiplicityBonusBase(CROPTYPE_MUSH)).toPercentString() + ' per other of same type of max 1 tier difference<br>';
      }
      if(haveMultiplicity(CROPTYPE_FLOWER)) {
        text += '• Flower: +' + (getMultiplicityBonusBase(CROPTYPE_FLOWER)).toPercentString() + ' per other of same type of max 1 tier difference<br>';
      }
      if(haveMultiplicity(CROPTYPE_BEE)) {
        text += '• Bee: +' + (getMultiplicityBonusBase(CROPTYPE_BEE)).toPercentString() + ' per other of same type of max 1 tier difference<br>';
      }
      if(haveMultiplicity(CROPTYPE_STINGING)) {
        text += '• Stinging: +' + (getMultiplicityBonusBase(CROPTYPE_STINGING)).toPercentString() + ' per other of same type of max 1 tier difference<br>';
      }
    }

    return text;
  };

  var text = createText();
  f0.div.innerHTML = text;

  var lastseentreelevel = state.treelevel;
  registerUpdateListener(function() {
    if(!treedialogvisible) return false;
    if(lastseentreelevel != state.treelevel) {
      lastseentreelevel = state.treelevel;
      var text = createText();
      f0.div.innerHTML = text;
    }
    return true;
  });

  var y = 0.05;
  var h = 0.15;
  // finetune the width of the buttons in flex f1
  var button0 = 0.15;
  var button1 = 0.85;
  var buttonshift = h * 1.15;

  if(state.challenge) {
    var c = challenges[state.challenge];
    var c2 = state.challenges[state.challenge];

    var already_completed = c.fullyCompleted();
    var targetlevel = c.nextTargetLevel();
    var success = state.treelevel >= targetlevel;

    var button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = getEndChallengeButtonName(already_completed, success);
    if(already_completed && success) {
      // Successfully finish, but it already was completed beforehand, so it's called just "finish", not "complete"
      registerTooltip(button, 'Finish the challenge. If you broke the max level record, your challenge production bonus will increase.');
    } else if(already_completed && !success) {
      // End the challenge early, but it already was completed beforehand, so it's called "end", not "abort"
      registerTooltip(button, 'End the challenge.');
    } else if(success) {
      if(c2.completed) {
        // This is a completion of a higher stage of the challenge
        registerTooltip(button, 'Successfully finish the next stage of this challenge.');
      } else {
        registerTooltip(button, 'Successfully finish the challenge for the first time.');
      }
    } else {
      // Abort the attempt to complete this challenge, it remainds unfinished. But it can still give the challenge highest level production bonus.
      if(c.targetlevel.length > 1) {
        registerTooltip(button, 'Open the dialog to abort the challenge, you don\'t get its next reward, but if you broke the max level record, your challenge production bonus will still increase. The dialog will show the amounts.');
      } else {
        registerTooltip(button, 'Open the dialog to abort the challenge, you don\'t get its one-time reward, but if you broke the max level record, your challenge production bonus will still increase. The dialog will show the amounts.');
      }
    }

    //button.textEl.style.boxShadow = '0px 0px 5px #f40';
    button.textEl.style.textShadow = '0px 0px 5px #f40';
    addButtonAction(button, function() {
      createFinishChallengeDialog();
    });


    button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Current challenge info';
    registerTooltip(button, 'Description and statistics for the current challenge');
    addButtonAction(button, function() {
      createChallengeDescriptionDialog(state.challenge, true, false);
    });
  } else if(state.treelevel < min_transcension_level) {
    //if(state.treelevel >= 1) f1.div.innerText = 'Reach tree level ' + min_transcension_level + ' to unlock transcension';
    if(state.treelevel >= 1) {
      var temp = new Flex(f1, button0, y, button1, y + h);
      temp.div.innerText = 'Reach tree level ' + min_transcension_level + ' to unlock transcension';
      y += buttonshift;
    }
  } else {
    var button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Transcension';
    //button.textEl.style.boxShadow = '0px 0px 5px #ff0';
    button.textEl.style.textShadow = '0px 0px 5px #ff0';
    registerTooltip(button, 'Show the transcension dialog');
    addButtonAction(button, function() {
      createTranscendDialog();
    });

    if(state.challenges_unlocked) {
      button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
      y += buttonshift;
      styleButton(button);
      button.textEl.innerText = 'Challenges';
      //button.textEl.style.boxShadow = '0px 0px 5px #f60';
      button.textEl.style.textShadow = '0px 0px 5px #f60';
      registerTooltip(button, 'Transcend and start a challenge');
      addButtonAction(button, function() {
        createChallengeDialog();
      });
    }
  }

  if(automatonUnlocked()) {
    button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Blueprints';
    //button.textEl.style.boxShadow = '0px 0px 5px #44f';
    button.textEl.style.textShadow = '0px 0px 5px #008';
    addButtonAction(button, function() {
      //closeAllDialogs();
      createBlueprintsDialog();
    });
  }

  if(have_buttons) {
    button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Back';
    addButtonAction(button, function() {
      dialog.cancelFun();
    });
  }
}
