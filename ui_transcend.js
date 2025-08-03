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

// UI related to transcension

function getTranscendValueInfo(opt_from_challenge) {
  var have_item = false;

  var text = '';
  var actual_resin = getUpcomingResinIncludingFerns();
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
    if(state.g_numresets == 0) {
      text += '• ' + actual_twigs.toString() + ' twigs from mistletoes (not yet available on first transcend)'; // this is shown even if mistletoes are not yet unlocked: as a teaser and hint because getting mistletoes soon is important to progress
    } else {
      text += '• ' + actual_twigs.toString() + ' twigs from mistletoes';
    }
    text += '<br>';
  }

  var do_fruit = state.treelevel >= min_transcension_level;

  if(do_fruit) {
    have_item = true;
    text += '• ' + getUpcomingFruitEssence().essence.toString() + ' fruit essence from ' + state.fruit_sacr.length + ' fruits in the sacrificial pool (see fruit tab)<br/>';
    // commented out: only the first fruit automatically goes to storage now, if sacr is empty it's because the player chose to move fruits to storage
    /*if(state.fruit_sacr.length == 0 && state.fruit_stored.length > 0) {
      text += '→ You have fruits in storage, if you would like to sacrifice them for essence, take a look at your fruit tab before transcending<br/>';
    }*/
    var highest = 0, highestsacr = 0;
    for(var i = 0; i < state.fruit_stored.length; i++) highest = Math.max(highest, state.fruit_stored[i].tier);
    for(var i = 0; i < state.fruit_sacr.length; i++) highestsacr = Math.max(highestsacr, state.fruit_sacr[i].tier);
    if(highestsacr > highest) {
      // fruit of highest tier is in sacrificial pool, indicate this to prevent accidently losing it
      text += '<span class="efWarningOnDialogText">→ Warning: you have a fruit in sacrificial pool of higher tier than any stored fruit, check the fruit tab if you want to keep it</span><br/>';
    }
  }

  if(!have_item) {
    text += '• Nothing. But, see current challenge rules for challenge specific rewards.<br/>';
  }

  return text;
}

function transcendFromDialogNow() {
  addAction({type:ACTION_TRANSCEND, challenge:0});
  closeAllDialogs();
  update();
  return true;
}

function createTranscendDialog(opt_from_challenge) {
  blueprintdialogopen = false;
  challengedialogopen = false;
  var extraname = undefined;
  var extrafun = undefined;

  var challenge_unlocked = false;
  if(state.challenges_unlocked) {
    extraname = 'challenges';
    if(state.untriedchallenges) extraname = 'challenges\n(new!)';
    extrafun = function() {
      createChallengeDialog();
      return true;
    };
    challenge_unlocked = true;
  }
  var extraname2 = undefined;
  var extrafun2 = undefined;
  var shortcutfun = undefined;

  var automaton_unlocked = false;
  if(automatonUnlocked() && state.numnonemptyblueprints) {
    extraname2 = 'with blueprint';
    extrafun2 = function() {
      createBlueprintsDialog(true);
      return true;
    };
    automaton_unlocked = true;
  }

  shortcutfun = function(e) {
    var keys = getEventKeys(e);
    var key = keys.key;
    var code = keys.code;
    var shift = keys.shift;
    var ctrl = keys.ctrl;

    if(automaton_unlocked && key == 'b' && !shift && !ctrl) {
      if(!blueprintdialogopen) createBlueprintsDialog(true);
    }
    if(challenge_unlocked && key == 'c' && !shift && !ctrl) {
      if(!challengedialogopen) createChallengeDialog();
    }
    if((key == 'Enter' || key == 'r') && !shift && !ctrl) {
      transcendFromDialogNow();
    }
  };


  if(extrafun2 && !extrafun) {
    extrafun = extrafun2;
    extraname = extraname2;
    extrafun2 = undefined;
    extraname2 = undefined;
  }

  var transcendbuttonname = challenge_unlocked ? 'regular run' : 'transcend';

  var dialog = createDialog({
    size:DIALOG_MEDIUM,
    functions:[transcendFromDialogNow, extrafun, extrafun2],
    names:[transcendbuttonname, extraname, extraname2],
    cancelname:'cancel',
    shortcutfun:shortcutfun,
    title:'Transcension',
    bgstyle:'efDialogEthereal'
  });

  var flex = dialog.content;
  var text = '';
  if(!opt_from_challenge) {
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
  text += '• Fruits in the sacrificial pool';
  if(state.fruit_sacr.length) text += ' (you have: ' + state.fruit_sacr.length + ' fruits in there)';
  text += '<br/>';
  if(amberUnlocked()) text += '• Some types of activated amber effects<br/>';
  text += '<br/>';
  text += 'What will be kept:<br/>';
  text += '• Achievements<br/>';
  text += '• Resin, twigs and fruit essence<br/>';
  text += '• Ethereal field and ethereal crops<br/>';
  text += '• Ethereal upgrades<br/>';
  text += '• Fruits in the storage slots (have: ' + state.fruit_stored.length + ')<br/>';
  text += '• Current season<br/>';
  if(amberUnlocked()) text += '• Amber resource<br/>';
  if(squirrelUnlocked()) text += '• Nuts and squirrel upgrades<br/>';
  text += '<br/><br/>';

  flex.div.innerHTML = text;
}

