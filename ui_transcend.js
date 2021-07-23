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

// UI related to transcension and challenges

function getTranscendValueInfo(opt_from_challenge) {
  var have_item = false;

  var text = '';
  var actual_resin = getUpcomingResin();
  if(!opt_from_challenge || actual_resin.neqr(0)) {
    have_item = true;
    text += '• ' + actual_resin.toString() + ' resin from tree level ' + state.treelevel;
    text += '<br>';
    if(state.res.resin.eqr(0)) {
      text += '• ' + ' Unused resin boost: ' + getUnusedResinBonusFor(actual_resin).subr(1).toPercentString() + '<br/>';
    } else {
      text += '• ' + ' Unused resin boost (including existing): ' + getUnusedResinBonusFor(actual_resin.add(state.res.resin)).subr(1).toPercentString() + '<br/>';
    }
  }

  var actual_twigs = getUpcomingTwigs();
  if(!opt_from_challenge || actual_twigs.neqr(0)) {
    have_item = true;
    text += '• ' + actual_twigs.toString() + ' twigs from mistletoes';
    text += '<br>';
  }

  var do_fruit = state.treelevel >= min_transcension_level;

  if(do_fruit) {
    have_item = true;
    text += '• ' + getUpcomingFruitEssence().essence + ' fruit essence from ' + state.fruit_sacr.length + ' fruits in the sacrificial pool<br/>';
    if(state.fruit_sacr.length == 0 && state.fruit_stored.length > 0) {
      text += '→ You have fruits in storage, if you would like to sacrifice them for essence, take a look at your fruit tab before transcending<br/>';
    }
    var highest = 0, highestsacr = 0;
    for(var i = 0; i < state.fruit_stored.length; i++) highest = Math.max(highest, state.fruit_stored[i].tier);
    for(var i = 0; i < state.fruit_sacr.length; i++) highestsacr = Math.max(highestsacr, state.fruit_sacr[i].tier);
    if(highestsacr > highest) {
      // fruit of highest tier is in sacrificial pool, indicate this to prevent accidently losing it
      text += '<span class="efWarningOnDialogText">→ Warning: you have a fruit in sacrificial pool of higher tier than any stored fruit, check the fruit tab if you want to keep it</span><br/>';
    }
  }

  if(!have_item) {
    text += '• Nothing. But, see current challenge rules for challenge specific results.<br/>';
  }

  return text;
}

function createTranscendDialog(opt_from_challenge) {
  blueprintdialogopen = false;
  var extraname = undefined;
  var extrafun = undefined;
  if(state.challenges_unlocked) {
    extraname = 'challenges';
    if(state.untriedchallenges) extraname = 'challenges\n(new one!)';
    extrafun = function() {
      createChallengeDialog();
    };
  }
  var extraname2 = undefined;
  var extrafun2 = undefined;
  var shortcutfun = undefined;
  if(haveAutomaton() && state.numnonemptyblueprints) {
    extraname2 = 'with blueprint';
    extrafun2 = function() {
      createBlueprintsDialog(true);
    };
    shortcutfun = function(e) {
      var shift = util.eventHasShiftKey(e);
      var ctrl = util.eventHasCtrlKey(e);
      if(e.key == 'b' && !shift && !ctrl) {
        if(!blueprintdialogopen) createBlueprintsDialog(true);
      }
    };
  }
  if(extrafun2 && !extrafun) {
    extrafun = extrafun2;
    extraname = extraname2;
    extrafun2 = undefined;
    extraname2 = undefined;
  }

  var dialog = createDialog(DIALOG_MEDIUM, function(e) {
      addAction({type:ACTION_TRANSCEND, challenge:0});
      closeAllDialogs();
      update();
  }, 'transcend', 'cancel', extrafun, extraname, /*opt_nobgclose=*/undefined, /*opt_onclose=*/undefined, extrafun2, extraname2, shortcutfun);

  dialog.div.className = 'efDialogEthereal';

  var flex = dialog.content;
  var text = '';
  if(opt_from_challenge) {
    text += '<b>New regular run' + '</b><br/>';
  } else {
    text += '<b>Transcension</b><br/>';
    text += '<br/>';
    text += 'Transcension starts a new basic field. Your first transcension also unlocks an ethereal field. On this field you can plant ethereal crops with resin. These crops give bonuses to the basic field in various ways. Resin can also be used for other ethereal upgrades. Unused resin also gives a slight boost. <br/>';
  }
  text += '<br/>';

  text += 'You will get:<br/>';
  text += getTranscendValueInfo(opt_from_challenge);

  text += '<br/>';
  text += 'What will be reset:<br/>';
  text += '• Basic field with all crops<br/>';
  text += '• Basic upgrades<br/>';
  text += '• Basic resources: seeds, spores<br/>';
  text += '• Tree level<br/>';
  text += '• Fruits in the sacrificial pool<br/>';
  if(amberUnlocked()) text += '• Some types of activated amber effects<br/>';
  text += '<br/>';
  text += 'What will be kept:<br/>';
  text += '• Achievements<br/>';
  text += '• Resin, twigs and fruit essence<br/>';
  text += '• Ethereal field and ethereal crops<br/>';
  text += '• Ethereal upgrades<br/>';
  text += '• Fruits in the storage slots<br/>';
  text += '• Current season<br/>';
  if(amberUnlocked()) text += '• Amber resource<br/>';
  if(squirrelUnlocked()) text += '• Nuts and squirrel upgrades<br/>';
  text += '<br/><br/>';

  flex.div.innerHTML = text;
}


// include_current_run: whether to also count the current run as potentially having completed one more stage of this challenge
function createChallengeDescriptionDialog(challenge_id, info_only, include_current_run) {
  var c = challenges[challenge_id];
  var c2 = state.challenges[challenge_id];

  var dialog;
  if(info_only) {
    dialog = createDialog();
  } else {
    var okfun = function() {
      addAction({type:ACTION_TRANSCEND, challenge:c.index});
      closeAllDialogs();
      update();
    };
    dialog = createDialog(undefined, okfun, 'start');
  }

  var contentFlex = dialog.content;

  var titleFlex = new Flex(contentFlex, 0.01, 0.01, 0.99, 0.1, 0.5);
  centerText2(titleFlex.div);
  titleFlex.div.textEl.innerText = upper(c.name);

  var scrollFlex = new Flex(contentFlex, 0.01, 0.11, 0.99, 1, 0.3);
  makeScrollable(scrollFlex);

  var text = '';

  text += c.description;
  text += '<br><br>';

  text += '<b>Challenge rules:</b>';
  text += '<br>';
  text += c.rulesdescription;
  if(c.targetlevel.length > 1) {
    var targetlevel = c.nextTargetLevel(include_current_run);
    text += '• Reach <b>tree level ' + targetlevel + '</b> to successfully complete the next stage of the challenge, or reach any other max level to increase challenge production bonus.';
    text += '<br>';
    text += '• This challenge has ' + c.targetlevel.length + ' stages in total, each gives 1 reward, you can complete only 1 stage at the time';
  } else {
    text += '• Reach <b>tree level ' + c.targetlevel[0] + '</b> to successfully complete the challenge, or reach any other max level to increase challenge production bonus.';
  }
  text += '<br>';
  text += '• Max level reached with this challenge gives ' + c.bonus.toPercentString() + ' production bonus per level to the game, whether successfully completed or not (formula: bonus * level ^ ' + challenge_bonus_exponent + '). The production bonus applies to seeds and spores, and 1/100th of it applies to resin and twigs.';
  text += '<br>';
  if(c.allowsresin && c.allowsfruits && c.allowstwigs && c.allowsnuts && c.allowbeyondhighestlevel) {
    if(squirrelUnlocked()) {
      text += '• You can gain resin, twigs, nuts and fruits as usual (but they only become available at at least tree level 10)';
    } else {
      text += '• You can gain resin, twigs and fruits as usual (but they only become available at tree level 10)';
    }
    text += '<br>';
  } else if(c.allowsresin && c.allowsfruits && c.allowstwigs && !c.allowsnuts && c.allowbeyondhighestlevel) {
    text += '• You can gain resin, twigs and fruits as usual (but they only become available at tree level 10)';
    if(squirrelUnlocked()) {
      text += '<br>';
      text += '• No nuts can be grown during this challenge';
    }
    text += '<br>';
  } else if(!c.allowsresin && !c.allowsfruits && !c.allowstwigs && !c.allowsnuts) {
    if(squirrelUnlocked()) {
      text += '• You cannot gain any resin, twigs, nuts or fruits during this challenge';
    } else {
      text += '• You cannot gain any resin, twigs or fruits during this challenge';
    }
    text += '<br>';
  } else {
    if(c.allowsresin) {
      if(c.allowbeyondhighestlevel) {
        text += '• Tree gains resin as usual, but it\'s only available when reaching at least level 10';
      } else {
        text += '• Tree gains resin as usual, but it\'s only available when reaching at least level 10 and not when reaching higher level than highest regular run';
      }
    } else {
      text += '• Tree does not gain any resin';
    }
    text += '<br>';
    if(c.allowsfruits) {
      if(c.allowbeyondhighestlevel) {
        text += '• Tree drops fruits as usual, but the level 5 fruit is dropped at level 10 instead';
      } else {
        text += '• Tree drops fruits as usual, but the level 5 fruit is dropped at level 10 instead, and no fruits are dropped above highest level ever reached with a regular run';
      }
    } else {
      text += '• Tree does not drop any fruits';
    }
    text += '<br>';
    if(c.allowstwigs) {
      if(c.allowbeyondhighestlevel) {
        text += '• Twigs can be gained from mistletoes as usual, but they\'re only available when reaching at least level 10';
      } else {
        text += '• Twigs can be gained from mistletoes as usual, but they\'re only available when reaching at least level 10 and not when reaching higher level than highest regular run';
      }
    } else {
      text += '• No twigs can be gained from mistletoes';
    }
    text += '<br>';
    if(squirrelUnlocked()) {
      if(c.allowsnuts) {
        text += '• Nuts crops can be grown as usual (once high enough tree level reached to unlock them)';
      } else {
        text += '• No nuts can be grown during this challenge';
      }
      text += '<br>';
    }
  }
  text += '<br><br>';

  if(c.fullyCompleted(include_current_run)) {
    text += 'You already got all rewards for this challenge';
  } else {
    if(c.targetlevel.length > 1) {
      text += '<b>Next target level:</b> ' + c.nextTargetLevel(include_current_run) + '<br>';
      text += '<b>Next completion reward:</b> ' + c.rewarddescription[c.numCompleted(include_current_run)];
    } else {
      text += '<b>Target level:</b> ' + c.nextTargetLevel(include_current_run) + '<br>';
      text += '<b>Reward:</b> ' + c.rewarddescription[0];
    }
  }

  if(c.targetlevel.length > 1) {
    text += '<br><br>';
    text += 'All reward target level stages (can only complete one per run): ';
    for(var i = 0; i < c.targetlevel.length; i++) text += (i ? ', ' : '') + c.targetlevel[i];
  }

  text += '<br><br>';
  text += '<b>This challenge was unlocked by:</b> ' + c.unlockdescription;

  text += '<br><br>';

  var currentlyrunning = (state.challenge == c.index);

  text += '<b>Current stats:</b><br>';
  if(c.cycling > 1) {
    var maxlevel = Math.max(c2.maxlevels[c2.num % c.cycling], currentlyrunning ? state.treelevel : 0);
    var cycle = c2.num_completed % c.cycling;
    if(currentlyrunning) {
      text += '• Current cycle: ' + ((cycle) + 1) + ' of ' + c.cycling;
      text += '<br>';
      text += '• Next cycle: ' + (((c2.num_completed + 1) % c.cycling) + 1) + ' of ' + c.cycling;
    } else {
      text += '• Next cycle: ' + ((cycle) + 1) + ' of ' + c.cycling;
    }
    text += '<br>';
    text += '• Production bonuses per max level reached (formula: bonus * level ^ ' + challenge_bonus_exponent + '): ';
    for(var j = 0; j < c.cycling; j++) text += (j ? ', ' : '') + c.cycling_bonus[j].toPercentString();
    text += '<br>';
    if(currentlyrunning) {
      text += '• Max levels reached: ';
      for(var j = 0; j < c.cycling; j++) {
        text += (j ? ', ' : '') + c2.maxlevels[j];
        if(j == cycle) text += ' <b>(after: ' + maxlevel + ')</b>';
      }
      text += '<br>';
      text += '• Production bonuses: ';
      for(var j = 0; j < c.cycling; j++) {
        text +=  (j ? ', ' : '') + getChallengeBonus(c.index, c2.maxlevels[j], j).toPercentString();
        if(j == cycle) text += ' <b>(after: ' + getChallengeBonus(c.index, maxlevel, cycle).toPercentString() + ')</b>';
      }
      text += '<br>';
      text += '• Production bonus applies fully to seeds and spores, and 1/100th to resin and twigs' + '<br>';
    } else {
      text += '• Max levels reached: ';
      for(var j = 0; j < c.cycling; j++) text += (j ? ', ' : '') + c2.maxlevels[j];
      text += '<br>';
      text += '• Production bonuses: ';
      for(var j = 0; j < c.cycling; j++) text +=  (j ? ', ' : '') + getChallengeBonus(c.index, c2.maxlevels[j], j).toPercentString();
      text += '<br>';
      text += '• Production bonus applies fully to seeds and spores, and 1/100th to resin and twigs' + '<br>';
    }
  } else {
    var maxlevel = Math.max(c2.maxlevel, currentlyrunning ? state.treelevel : 0);
    text += '• Production bonus per max level reached (formula: bonus * level ^ ' + challenge_bonus_exponent + '): ' + c.bonus.toPercentString() + '<br>';
    if(currentlyrunning) {
      text += '• Max level reached before: ' + c2.maxlevel + ', <b>after: ' + maxlevel + '</b><br>';
      text += '• Production bonus before: ' + getChallengeBonus(c.index, c2.maxlevel).toPercentString() + ', <b>after: ' + getChallengeBonus(c.index, maxlevel).toPercentString() + '</b><br>';
      text += '• Production bonus applies fully to seeds and spores, and 1/100th to resin and twigs' + '<br>';
    } else {
      text += '• Max level reached: ' + c2.maxlevel + '<br>';
      text += '• Production bonus: ' + getChallengeBonus(c.index, c2.maxlevel).toPercentString() + '<br>';
      text += '• Production bonus applies fully to seeds and spores, and 1/100th to resin and twigs' + '<br>';
    }
  }
  if(currentlyrunning) {
    text += '• Times ran (excluding the current run): ' + c2.num + ', times successful: ' + c2.num_completed + '<br>';
  } else {
    text += '• Times ran: ' + c2.num + ', times successful: ' + c2.num_completed + '<br>';
  }
  if(c.targetlevel.length > 1 && c.fullyCompleted(include_current_run)) {
    text += '• Fastest first stage target level time: ' + (c2.besttime ? util.formatDuration(c2.besttime) : '--') + '<br>';
    text += '• Fastest final stage target level time: ' + (c2.besttime2 ? util.formatDuration(c2.besttime2) : '--') + '<br>';
  } else {
    text += '• Fastest target level time: ' + (c2.besttime ? util.formatDuration(c2.besttime) : '--') + '<br>';
  }

  var completedtext;
  if(c.targetlevel.length == 1 || !c.numCompleted(include_current_run)) {
    completedtext = (c.numCompleted(include_current_run) ? 'yes' : 'no');
  } else {
    completedtext = '' + c.numCompleted(include_current_run) + ' of ' + c.targetlevel.length;
  }

  text += '• Completed: ' + completedtext + '<br>';

  for(var j = 0; j < c2.completed; j++) {
    text += '• Reward gotten: ' + c.rewarddescription[j];
    text += '<br>';
  }

  scrollFlex.div.innerHTML = text;
}


// opt_from_challenge = whether you open this dialog after just having completed a challenge as well
function createChallengeDialog(opt_from_challenge) {
  var dialog = createDialog();

  dialog.div.className = 'efDialogEthereal';

  var contentFlex = dialog.content;

  var flex = new Flex(contentFlex, [0, 0, 0.01], [0, 0, 0.01], [1, 0, -0.01], 0.3, 0.3);

  var text = '';

  if(opt_from_challenge) {
    text += 'You end a challenge as usual, but start another new challenge rather than a regular run. Choose a challenge below to view its description.<br/>';
    text += '<br/>';
    text += 'Regular transcension resources gotten...:<br/>';
  } else {
    text += 'You transcend as usual, but start a challenge rather than a regular run. Choose a challenge below to view its description.<br/>';
    text += '<br/>';
    text += 'You get the usual transcension resources:<br/>';
  }

  text += getTranscendValueInfo(opt_from_challenge);

  flex.div.innerHTML = text;


  var buttonFlex = new Flex(contentFlex, 0, 0.4, 1, 0.9, 0.3);

  var pos = 0;
  var h = 0.1;

  // TODO: the display order should be different than the registered order, by difficulty level
  for(var i = 0; i < challenges_order.length; i++) {
    var c = challenges[challenges_order[i]];
    var c2 = state.challenges[challenges_order[i]];
    if(!c2.unlocked) continue;
    var isnew = !c.numCompleted(true);
    var isnotfull = !c.fullyCompleted(true)
    var button = new Flex(buttonFlex, 0.2, pos, 0.8, pos + h);
    pos += h * 1.05;
    styleButton(button.div);
    var currentlyrunning = (state.challenge == c.index);
    var text = upper(c.name);
    if(isnew) text += ' (New!)';
    // The '/' means: "new stage available with target level: " but that's too long for the button
    else if(isnotfull) text += ' (' + Math.max(c2.maxlevel, currentlyrunning ? state.treelevel : 0) + ' / ' + c.nextTargetLevel(true) + ')';
    else if(c.cycling > 1) {
      if(!c.allCyclesCompleted(true)) text += ' (New cycle!)';
    }
    else text += ' (' + Math.max(c2.maxlevel, currentlyrunning ? state.treelevel : 0) + ')';
    button.div.textEl.innerText = text;
    button.div.onclick = bind(function(c) {
      createChallengeDescriptionDialog(c.index, false, true);
    }, c);
  }
}

function createFinishChallengeDialog() {
  blueprintdialogopen = false;
  var extraname = undefined;
  var extrafun = undefined;
  var shortcutfun = undefined;
  if(haveAutomaton() && state.numnonemptyblueprints) {
    extraname = 'with blueprint';
    extrafun = function() {
      createBlueprintsDialog(true);
    };
    shortcutfun = function(e) {
      var shift = util.eventHasShiftKey(e);
      var ctrl = util.eventHasCtrlKey(e);
      if(e.key == 'b' && !shift && !ctrl) {
        if(!blueprintdialogopen) createBlueprintsDialog(true);
      }
    };
  }

  var dialog = createDialog(undefined, undefined, undefined, undefined, extrafun, extraname, /*opt_nobgclose=*/undefined, /*opt_onclose=*/undefined, undefined, undefined, shortcutfun);
  dialog.div.className = 'efDialogEthereal';

  var contentFlex = dialog.content;

  var flex = new Flex(contentFlex, [0, 0, 0.01], [0, 0, 0.01], [1, 0, -0.01], 0.3, 0.3);

  var c = challenges[state.challenge];
  var c2 = state.challenges[state.challenge];

  var already_completed = c.fullyCompleted();
  var targetlevel = c.nextTargetLevel();
  var success = state.treelevel >= targetlevel;

  var text = '';

  if(already_completed) {
    // nothing to display here
  } else {
    if(c.targetlevel.length > 1) {
      if(success) {
        text += 'You successfully completed the next stage of challenge for the first time!<br><br>Reward: ';
        text += c.rewarddescription[c2.completed];
      } else {
        text += 'You didn\'t successfully complete the next stage of the challenge, but can still get the challenge bonus for highest tree level reached.';
      }
    } else {
      if(success) {
        text += 'You successfully completed the challenge for the first time!<br><br>Reward: ';
        text += c.rewarddescription[0];
      } else {
        text += 'You didn\'t successfully complete the challenge, but can still get the challenge bonus for highest tree level reached.';
      }
    }
  }

  var maxlevel = c2.maxlevel;
  var cycle = undefined;
  if(c.cycling > 1) {
    cycle = c.getCurrentCycle();
    maxlevel = c2.maxlevels[cycle];
  }

  if(c2.num > 0) {
    text += '<br><br>';
    text += 'Previous highest level: ' + c2.maxlevel;
    if(c.cycling) text += ' (previous matching cycle: ' + maxlevel + ')';
    text += '<br>';
    text += 'Current level: ' + state.treelevel;
  }

  var newmax = Math.max(state.treelevel, maxlevel);
  var new_total = state.challenge_bonus.sub(getChallengeBonus(state.challenge, maxlevel, cycle)).add(getChallengeBonus(state.challenge, newmax, cycle));
  text += '<br><br>';
  text += 'Production bonus from max reached level' + ((c.cycling > 1) ? ' for this cycle' : '') + ':<br>';
  text += '• Before (level ' + maxlevel + '): ' + getChallengeBonus(state.challenge, maxlevel, cycle).toPercentString() + ' (' + state.challenge_bonus.toPercentString() + ' total for all challenges)<br>';
  if(state.treelevel > maxlevel) {
    text += '• After (level ' + newmax + '): ' + getChallengeBonus(state.challenge, newmax, cycle).toPercentString() + ' (' + new_total.toPercentString() + ' total for all challenges)<br>';
    // TODO: if challenge not completed but max level beaten, add text here "you didn't complete the challenge, but at least you gained production bonus", but this taking cycling challenges and multi-level-target challenges into account
  } else {
    text += '• After stays the same, max level not beaten';
  }

  text += '<br><br>';
  text += 'You can now choose to start a new regular run, or any challenge of your choice, from the beginning.';

  flex.div.innerHTML = text;


  var buttonflex = new Flex(contentFlex, 0.25, 0.6, 0.75, 0.8, 0.3);

  var button = new Flex(buttonflex, 0, 0, 1, 0.3, 0.7).div;
  styleButton(button);
  button.textEl.innerText = 'Start regular run';
  //button.textEl.style.boxShadow = '0px 0px 5px #ff0';
  button.textEl.style.textShadow = '0px 0px 5px #ff0';
  registerTooltip(button, 'Show the transcension dialog');
  addButtonAction(button, function() {
    createTranscendDialog(true);
  });

  button = new Flex(buttonflex, 0, 0.32, 1, 0.6, 0.7).div;
  styleButton(button);
  button.textEl.innerText = 'Start a new challenge';
  //button.textEl.style.boxShadow = '0px 0px 5px #f60';
  button.textEl.style.textShadow = '0px 0px 5px #f60';
  registerTooltip(button, 'Transcend and start a challenge');
  addButtonAction(button, function() {
    createChallengeDialog(true);
  });
}



function createAllChallengeStatsDialog() {
  var dialog = createDialog(DIALOG_LARGE);

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Challenge Stats';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1, 0.3);
  var div = flex.div;
  makeScrollable(flex);

  var text = '';

  var pos = 0;
  var h = 0.1;

  text += 'total challenge production bonus: +' + state.challenge_bonus.toPercentString() + '<br><br>';

  // TODO: the display order should be different than the registered order, by difficulty level
  for(var i = 0; i < challenges_order.length; i++) {
    var c = challenges[challenges_order[i]];
    var c2 = state.challenges[challenges_order[i]];
    if(!c2.unlocked) continue;
    text += '<b>' + upper(c.name) + '</b>';
    text += '<br>';
    if(c.targetlevel.length == 1 || !c2.completed) {
      text += 'completed: ' + (c2.completed ? 'yes' : 'no');
    } else {
      text += 'completed: stage ' + c2.completed + ' of ' + c.targetlevel.length;
    }
    text += '<br>';
    if(c.targetlevel.length > 1) {
      text += 'multiple target level stages: ';
      for(var j = 0; j < c.targetlevel.length; j++) text += (j ? ', ' : '') + c.targetlevel[j];
    } else {
      text += 'target level: ' + c.targetlevel[0];
    }


    text += '<br>';
    text += 'runs: ' + (c2.num + 1);
    text += '<br>';
    if(c.cycling > 1) {
      text += 'highest levels: ';
      for(var j = 0; j < c.cycling; j++) text += (j ? ', ' : '') + c2.maxlevels[j];
    } else {
      text += 'highest level: ' + c2.maxlevel;
    }
    text += '<br>';
    if(c.targetlevel.length > 1 && c.fullyCompleted()) {
      text += 'fastest first stage target level time: ' + (c2.besttime ? util.formatDuration(c2.besttime) : '--') + '<br>';
      text += 'fastest final stage target level time: ' + (c2.besttime2 ? util.formatDuration(c2.besttime2) : '--') + '<br>';
    } else {
      text += 'fastest target level time: ' + (c2.besttime ? util.formatDuration(c2.besttime) : '--') + '<br>';
    }
    if(c.cycling > 1) {
      text += 'bonuses per level (formula: bonus * level ^ ' + challenge_bonus_exponent + '): ';
      for(var j = 0; j < c.cycling; j++) text +=  (j ? ', ' : '') + c.cycling_bonus[j].toPercentString();
      text += '<br>';
      text += 'production bonuses: ';
      for(var j = 0; j < c.cycling; j++) text +=  (j ? ', ' : '') + getChallengeBonus(c.index, c2.maxlevels[j], j).toPercentString();
      text += '<br>';
    } else {
      text += 'bonus per level (formula: bonus * level ^ ' + challenge_bonus_exponent + '): ' + c.bonus.toPercentString();
      text += '<br>';
      text += 'production bonus: ' + getChallengeBonus(c.index, c2.maxlevel).toPercentString();
      text += '<br>';
    }
    if(c.targetlevel.length > 1) {
      for(var j = 0; j < c2.completed; j++) {
        text += 'reward gotten: ' + c.rewarddescription[j];
        text += '<br>';
      }
      if(!c.fullyCompleted) {
        text += '(next unclaimed reward: ' + c.rewarddescription[c2.completed] + ')';
        text += '<br>';
      }
    } else {
      if(c2.completed) {
        text += 'reward gotten: ' + c.rewarddescription[0];
        text += '<br>';
      } else {
        text += '(unclaimed reward: ' + c.rewarddescription[0] + ')';
        text += '<br>';
      }
    }
    text += '<br>';
  }

  div.innerHTML = text;
}



// the "challenge finished" chip at the bottom
var challengeChipFlex = undefined;

function removeChallengeChip() {
  if(!challengeChipFlex) return;

  challengeChipFlex.removeSelf(gameFlex);
  challengeChipFlex = undefined;
}

function showChallengeChip(challenge) {
  removeChallengeChip();
  var c = challenges[challenge];
  var c2 = state.challenges[challenge];

  challengeChipFlex = new Flex(gameFlex, 0.2, 0.85, 0.8, 0.95, 0.35);
  challengeChipFlex.div.style.backgroundColor = '#fcce';
  challengeChipFlex.div.style.zIndex = 15;

  var textFlex = new Flex(challengeChipFlex, 0.01, [0.5, 0, -0.35], 0.99, [0.5, 0, 0.35]);
  //textFlex.div.style.color = '#fff';
  textFlex.div.style.color = '#000';
  centerText2(textFlex.div);
  var text = 'Challenge Completed!';
  if(c.targetlevel.length > 1) {
    if(c2.completed > 0 && c2.completed + 1 < c.targetlevel.length) text = 'Next challenge stage completed!';
    else if(c2.completed + 1 >= c.targetlevel.length) text = 'Final challenge stage completed!';
  }
  textFlex.div.textEl.innerHTML = text + '<br><br>\"' + upper(c.name) + '\"';

  addButtonAction(challengeChipFlex.div, removeChallengeChip);
}
