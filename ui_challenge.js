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

// UI related to challenges



// include_current_run: whether to also count the current run as potentially having completed one more stage of this challenge
function createChallengeDescriptionDialog(challenge_id, info_only, include_current_run) {
  var c = challenges[challenge_id];
  var c2 = state.challenges[challenge_id];

  var automaton_unlocked = false;

  var okfun = undefined;
  var okname = undefined;
  var extrafun = undefined;
  var extraname = undefined;
  var shortcutfun = undefined;

  if(!info_only) {
    okfun = function() {
      addAction({type:ACTION_TRANSCEND, challenge:c.index});
      closeAllDialogs();
      update();
      return true;
    };
    okname = 'start';

    if(haveAutomaton() && state.numnonemptyblueprints && canUseBluePrintsDuringChallenge(challenge_id)) {
      extraname = 'with blueprint';
      extrafun = function() {
        createBlueprintsDialog(true, challenge_id);
        return true;
      };
      automaton_unlocked = true;

      shortcutfun = function(e) {
        var shift = util.eventHasShiftKey(e);
        var ctrl = util.eventHasCtrlKey(e);
        if(automaton_unlocked && (e.key == 'b' || e.key == 'B') && !ctrl) {
          if(!blueprintdialogopen) createBlueprintsDialog(true, challenge_id);
        }
        if(e.key == 'Enter' && !shift && !ctrl) {
          okfun();
        }
      };
    }
  }

  var dialog = createDialog({
    functions:[okfun, extrafun],
    names:[okname, extraname],
    shortcutfun:shortcutfun,
    title:upper(c.name),
    scrollable:true
  });

  var text = '';

  text += c.description;
  text += '<br><br>';

  text += '<b>Challenge rules:</b>';
  text += '<br>';
  text += c.rulesdescription;
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

  var targetlevel = c.nextTargetLevel(include_current_run);

  text += '<br>';
  text += '<b>Goal:</b>';
  text += '<br>';
  if(c.targetlevel.length > 1) {
    text += '• Reach <b>tree level ' + targetlevel + '</b> to successfully complete the next stage of the challenge, or reach any other max level to increase challenge production bonus.';
    text += '<br>';
    text += '• This challenge has ' + c.targetlevel.length + ' stages in total, each gives 1 reward, you can complete only 1 stage at the time';
  } else {
    text += '• Reach <b>tree level ' + c.targetlevel[0] + '</b> to successfully complete the challenge, or reach any other max level to increase challenge production bonus.';
  }
  text += '<br>';

  text += '<br>';
  text += '<b>Rewards:</b>';
  text += '<br>';



  if(!c.fullyCompleted(include_current_run)) {
    if(c.targetlevel.length > 1 && c2.completed > 0) {
      text += '• Next completion reward (at level ' + targetlevel + '): ' + c.rewarddescription[c.numCompleted(include_current_run)];
    } else {
      text += '• Reward (at level ' + targetlevel + '): ' + c.rewarddescription[0];
    }
    text += '<br>';
  }
  text += '• Max level reached with this challenge gives <b>(' + getChallengeFormulaString(c, c.cycling ? undefined : c.bonus.toPercentString()) + ') production bonus</b> per level to the game, whether successfully completed or not. The bonus applies to seeds and spores, and 1/100th of it to resin and twigs.';
  if(c.cycling) {
    text += '<br>';
    text += '• <b>bonus</b> value itself depends on cycle, respectively: ';
    for(var j = 0; j < c.cycling; j++) text +=  (j ? ', ' : '') + c.cycling_bonus[j].toPercentString();
  }
  text += '<br>';
  if(c.alt_bonus) {
    text += '• ' + altChallengeBonusInfo;
    text += '<br>';
  }
  if(c.bonus_max_level) {
    text += '• This challenge is capped to level ' + c.bonus_max_level + ' and gives no further bonus after that.';
    text += '<br>';
  }
  if(c.targetlevel.length > 1) {
    text += '• All reward target level stages (can only complete one per run): ';
    for(var i = 0; i < c.targetlevel.length; i++) text += (i ? ', ' : '') + c.targetlevel[i];
    text += '<br>';
  }
  for(var j = 0; j < c2.completed; j++) {
    text += '• Reward gotten: ' + c.rewarddescription[j];
    text += '<br>';
  }

  text += '<br>';

  var currentlyrunning = (state.challenge == c.index);

  text += '<b>Current stats:</b><br>';
  text += getChallengeStatsString(challenge_id, include_current_run);

  text += '<br>';
  text += '<b>This challenge was unlocked by:</b> ' + c.unlockdescription;

  dialog.content.div.innerHTML = text;
}


function getChallengeStatsString(challenge_id, include_current_run) {
  var c = challenges[challenge_id];
  var c2 = state.challenges[challenge_id];

  var currentlyrunning = (state.challenge == c.index);

  var text = '';

  if(c.cycling > 1) {
    var cycle = c2.num_completed % c.cycling;
    var maxlevel = Math.max(c2.maxlevels[cycle], currentlyrunning ? state.treelevel : 0);
    if(currentlyrunning) {
      text += '• Current cycle: ' + (cycle + 1) + ' of ' + c.cycling;
      text += '<br>';
      text += '• Next cycle: ' + (((c2.num_completed + 1) % c.cycling) + 1) + ' of ' + c.cycling;
    } else {
      text += '• Next cycle: ' + (cycle + 1) + ' of ' + c.cycling;
    }
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
      //text += '• Production bonus applies fully to seeds and spores, and 1/100th to resin and twigs' + '<br>';
    } else {
      text += '• Max levels reached: ';
      for(var j = 0; j < c.cycling; j++) text += (j ? ', ' : '') + c2.maxlevels[j];
      text += '<br>';
      text += '• Production bonuses: ';
      for(var j = 0; j < c.cycling; j++) text +=  (j ? ', ' : '') + getChallengeBonus(c.index, c2.maxlevels[j], j).toPercentString();
      text += '<br>';
      //text += '• Production bonus applies fully to seeds and spores, and 1/100th to resin and twigs' + '<br>';
    }
  } else {
    var maxlevel = Math.max(c2.maxlevel, currentlyrunning ? state.treelevel : 0);
    if(currentlyrunning) {
      text += '• Max level reached before: ' + c2.maxlevel + ', <b>after: ' + maxlevel + '</b><br>';
      var challenge2 = totalChallengeBonusWith(challenge_id, maxlevel);
      text += '• Production bonus before: ' + getChallengeBonus(c.index, c2.maxlevel).toPercentString() + ', <b>after: ' + getChallengeBonus(c.index, maxlevel).toPercentString() +
              '</b>' + (c.alt_bonus ? ' (alternate multiplier)' : '') +
              '. Total (all challenges) before: ' + state.challenge_bonus.toPercentString() + ', <b>after: ' + challenge2.toPercentString() + '</b><br>';

    } else {
      text += '• Max level reached: ' + c2.maxlevel + '<br>';
      text += '• Production bonus: ' + getChallengeBonus(c.index, c2.maxlevel).toPercentString() + '<br>';
    }
    /*if(c.alt_bonus) {
      text += '• ' + altChallengeBonusInfo;
      text += '<br>';
    }*/
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

  if(c2.num) {
    if(c.index == state.challenge) {
      text += '• last time ran: now<br>';
    } else if(c2.last_completion_date) {
      //text += '• Last time ran: ' + util.formatDate(c2.last_completion_date) + '<br>';
      text += '• Last time ran: ' + util.formatDuration(util.getTime() - c2.last_completion_date, undefined, 1) + ' ago<br>';
    } else {
      text += '• Last time ran: unknown<br>'; // this stat was not saved in older saves, so it's unknown
    }
  }

  return text;
}

function getEndChallengeButtonName(already_completed, success) {
  if(already_completed && success) {
    // Successfully finish, but it already was completed beforehand, so it's called just "finish", not "complete"
    return 'Finish challenge';
  } else if(already_completed && !success) {
    // End the challenge early, but it already was completed beforehand, so it's called "end", not "abort"
    return 'End challenge';
  } else if(success) {
    return 'Complete challenge';
  } else {
    // Abort the attempt to complete this challenge, it remainds unfinished. But it can still give the challenge highest level production bonus.
    return 'Abort challenge';
  }
}


var challengedialogopen = false;
// opt_from_challenge = whether you open this dialog after just having completed a challenge as well
function createChallengeDialog(opt_from_challenge) {
  challengedialogopen = true;
  var dialog = createDialog({
    onclose:function() { challengedialogopen = false; },
    title:'Challenge',
    bgstyle:'efDialogEthereal'
  });

  var contentFlex = dialog.content;

  var flex = new Flex(contentFlex, [0, 0, 0.01], [0, 0, 0.01], [1, 0, -0.01], 0.33);

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

  var buttonFlex = new Flex(contentFlex, 0, 0.32, 1, 1);

  var pos = 0;
  var h = 0.075;

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
      if(!c.allCyclesCompleted(true)) {
        text += ' (New cycle!)';
      } else {
        var currentcycle = c.getCurrentCycle();
        text += ' (';
        for(var j = 0; j < c.cycling; j++) {
          var maxlevel = c2.maxlevels[j];
          if(currentlyrunning && j == currentcycle) maxlevel = Math.max(maxlevel, state.treelevel);
          text += (j > 0 ? ', ' : '') + maxlevel;
        }
        text += ')';
      }
    }
    else text += ' (' + Math.max(c2.maxlevel, currentlyrunning ? state.treelevel : 0) + ')';
    button.div.textEl.innerText = text;
    button.div.onclick = bind(function(c) {
      createChallengeDescriptionDialog(c.index, false, true);
    }, c);

    var tooltiptext = getChallengeStatsString(challenges_order[i], true);
    registerTooltip(button.div, tooltiptext);
  }
}

function createFinishChallengeDialog() {
  blueprintdialogopen = false;
  challengedialogopen = false;
  var extraname = undefined;
  var extrafun = undefined;
  var shortcutfun = undefined;

  var automaton_unlocked = false;
  if(haveAutomaton() && state.numnonemptyblueprints) {
    extraname = 'with blueprint';
    extrafun = function() {
      createBlueprintsDialog(true);
      return true;
    };
    automaton_unlocked = true;
  }

  shortcutfun = function(e) {
    var shift = util.eventHasShiftKey(e);
    var ctrl = util.eventHasCtrlKey(e);
    if(automaton_unlocked && e.key == 'b' && !shift && !ctrl) {
      if(!blueprintdialogopen) createBlueprintsDialog(true);
    }
    if(e.key == 'c' && !shift && !ctrl) {
      if(!challengedialogopen) createChallengeDialog();
    }
  };

  var c = challenges[state.challenge];
  var c2 = state.challenges[state.challenge];

  var already_completed = c.fullyCompleted();
  var targetlevel = c.nextTargetLevel();
  var success = state.treelevel >= targetlevel;

  var dialog = createDialog({
    functions:extrafun,
    names:extraname,
    shortcutfun:shortcutfun,
    title:getEndChallengeButtonName(already_completed, success),
    bgstyle:'efDialogEthereal'
  });

  var text = '';

  var text = upper(c.name) + '<br>';

  if(already_completed) {
    // nothing to display here
  } else {
    if(c.targetlevel.length > 1 && c2.completed > 0) {
      if(success) {
        text += 'You successfully completed the next stage of the challenge for the first time!<br><br>Reward: ';
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
  text += '<br><br>';
  text += 'Production bonus from challenge max reached level' + ((c.cycling > 1) ? ' for this cycle' : '') + ':<br>';
  text += '• Before (level ' + maxlevel + '): ' + getChallengeBonus(state.challenge, maxlevel, cycle).toPercentString() + ' (' + state.challenge_bonus.toPercentString() + ' total for all challenges)<br>';
  if(state.treelevel > maxlevel) {
    var new_total = totalChallengeBonusWith(c.index, newmax);
    //var new_total = state.challenge_bonus.sub(getChallengeBonus(state.challenge, maxlevel, cycle)).add(getChallengeBonus(state.challenge, newmax, cycle));
    text += '• After (level ' + newmax + '): ' + getChallengeBonus(state.challenge, newmax, cycle).toPercentString() + ' (' + new_total.toPercentString() + ' total for all challenges)<br>';
    // TODO: if challenge not completed but max level beaten, add text here "you didn't complete the challenge, but at least you gained production bonus", but this taking cycling challenges and multi-level-target challenges into account
    if(c.alt_bonus) {
      text += '• ' + altChallengeBonusInfo;
      text += '<br>';
    }
  } else {
    text += '• After stays the same, max level not beaten';
  }

  text += '<br><br>';
  text += 'You can now choose to start a new regular run, or any challenge of your choice, from the beginning.';

  dialog.content.div.innerHTML = text;

  var buttonflex = new Flex(dialog.content, 0.25, 0.6, 0.75, 0.8);

  var button = new Flex(buttonflex, 0, 0, 1, 0.3, FONT_BIG_BUTTON).div;
  styleButton(button);
  button.textEl.innerText = 'Start regular run';
  //button.textEl.style.boxShadow = '0px 0px 5px #ff0';
  button.textEl.style.textShadow = '0px 0px 5px #ff0';
  registerTooltip(button, 'Show the transcension dialog');
  addButtonAction(button, function() {
    createTranscendDialog(true);
  });

  button = new Flex(buttonflex, 0, 0.32, 1, 0.6, FONT_BIG_BUTTON).div;
  styleButton(button);
  button.textEl.innerText = 'Start a new challenge';
  //button.textEl.style.boxShadow = '0px 0px 5px #f60';
  button.textEl.style.textShadow = '0px 0px 5px #f60';
  registerTooltip(button, 'Transcend and start a challenge');
  addButtonAction(button, function() {
    createChallengeDialog(true);
  });
}

function getChallengeFormulaString(c, opt_bonus_string) {
  var bonus_string = opt_bonus_string || 'bonus';

  if(c.bonus_min_level) {
    return bonus_string + ' * max(0, level - ' + (c.bonus_min_level - 1) + ') ^ ' + c.bonus_exponent;
  } else {
    return bonus_string + ' * level ^ ' + c.bonus_exponent;
  }

}

function createAllChallengeStatsDialog() {
  var dialog = createDialog({
    size:DIALOG_LARGE,
    icon:image_stats,
    title:'Challenge stats',
    scrollable:true
  });

  var text = '';

  var pos = 0;
  var h = 0.1;

  text += 'Total challenge production bonus: +' + state.challenge_bonus.toPercentString() + '<br>';
  if(state.challenge_bonus1.neqr(0)) {
    text += 'regular bonus: +' + state.challenge_bonus0.toPercentString() + '<br>';
    text += 'alternate bonus: +' + state.challenge_bonus1.toPercentString() + '<br>';
  }
  text += '<br>';


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
    text += 'runs: ' + c2.num;
    if(state.challenge == c.index) text += ' (excluding current run)';
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
      text += 'bonuses per max level (formula: ' + getChallengeFormulaString(c) + '): ';
      for(var j = 0; j < c.cycling; j++) text +=  (j ? ', ' : '') + c.cycling_bonus[j].toPercentString();
      text += '<br>';
      text += 'production bonuses: ';
      for(var j = 0; j < c.cycling; j++) text +=  (j ? ', ' : '') + getChallengeBonus(c.index, c2.maxlevels[j], j).toPercentString();
      text += '<br>';
      var cycle = c2.num_completed % c.cycling;
      var nextString = state.challenge == c.index ? 'current' : 'next';
      text += nextString + ' cycle: ' + (cycle + 1) + ' of ' + (c.cycling);
      text += '<br>';
    } else {
      text += 'bonus per max level (formula: ' + getChallengeFormulaString(c) + '): ' + c.bonus.toPercentString();
      text += '<br>';
      text += 'production bonus: ' + getChallengeBonus(c.index, c2.maxlevel).toPercentString();
      text += '<br>';
    }
    if(c.alt_bonus) {
      text += altChallengeBonusInfo;
      text += '<br>';
    }
    if(c.targetlevel.length > 1) {
      for(var j = 0; j < c2.completed; j++) {
        text += 'reward gotten (at level ' + c.targetlevel[j] + '): ' + c.rewarddescription[j];
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
    if(c2.num) {
      if(c.index == state.challenge) {
        text += 'last time ran: now';
      } else if(c2.last_completion_date) {
        text += 'last time ran: ' + util.formatDate(c2.last_completion_date);
        //text += 'last time ran: ' + util.formatDuration(util.getTime() - c2.last_completion_date) + ' ago';
        text += '<br>';
        text += 'last runtime: ' + util.formatDuration(c2.last_completion_time) + ', to level ' + c2.last_completion_level;
      } else {
        text += 'last time ran: unknown'; // this stat was not saved in older saves, so it's unknown
      }
      text += '<br>';
    }
    text += '<br>';
  }

  dialog.content.div.innerHTML = text;
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

  var reward = c.rewarddescription[c2.completed];

  challengeChipFlex = new Flex(gameFlex, 0.2, 0.85, 0.8, reward ? 0.98 : 0.95);
  challengeChipFlex.div.style.backgroundColor = '#fcce';
  challengeChipFlex.div.style.zIndex = 15;

  var textFlex = new Flex(challengeChipFlex, 0.01, [0.5, 0, -0.35], 0.99, [0.5, 0, 0.35]);
  //textFlex.div.style.color = '#fff';
  textFlex.div.style.color = '#000';
  centerText2(textFlex.div);
  var text = 'Challenge \"' + upper(c.name) + '\" Completed!';
  if(c.targetlevel.length > 1) {
    if(c2.completed > 0 && c2.completed + 1 < c.targetlevel.length) text = 'Next challenge stage completed!';
    else if(c2.completed + 1 >= c.targetlevel.length) text = 'Final challenge stage completed!';
  }

  if(reward) {
    text += '<br><br>Reward: ' + upper(reward) + '';
  }

  textFlex.div.textEl.innerHTML = text;

  addButtonAction(challengeChipFlex.div, removeChallengeChip);
}

// the "challenge unlocked" chip at the bottom
var challengeUnlockedChipFlex = undefined;

function removechallengeUnlockedChip() {
  if(!challengeUnlockedChipFlex) return;

  challengeUnlockedChipFlex.removeSelf(gameFlex);
  challengeUnlockedChipFlex = undefined;
}

function showchallengeUnlockedChip(challenge) {
  removechallengeUnlockedChip();
  var c = challenges[challenge];
  var c2 = state.challenges[challenge];

  challengeUnlockedChipFlex = new Flex(gameFlex, 0.2, 0.85, 0.8, 0.95);
  challengeUnlockedChipFlex.div.style.backgroundColor = '#fcce';
  challengeUnlockedChipFlex.div.style.zIndex = 15;

  var textFlex = new Flex(challengeUnlockedChipFlex, 0.01, [0.5, 0, -0.35], 0.99, [0.5, 0, 0.35]);
  //textFlex.div.style.color = '#fff';
  textFlex.div.style.color = '#000';
  centerText2(textFlex.div);
  var text = 'Challenge Unlocked!';
  textFlex.div.textEl.innerHTML = text + '<br><br>\"' + upper(c.name) + '\"';

  addButtonAction(challengeUnlockedChipFlex.div, removechallengeUnlockedChip);
}



