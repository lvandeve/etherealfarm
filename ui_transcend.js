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
  var tlevel = Math.floor(state.treelevel / min_transcension_level);
  var roman = tlevel > 1 ? (' ' + util.toRoman(tlevel)) : '';
  var tlevel_mul = Num(tlevel);

  var have_item = false;

  var text = '';
  var actual_resin = state.resin.mul(tlevel_mul);
  if(!opt_from_challenge || actual_resin.neqr(0)) {
    have_item = true;
    text += '• ' + actual_resin.toString() + ' resin from tree level ' + state.treelevel;
    if(tlevel > 1) {
      text += ' (' + state.resin.toString() + ' collected, ' + tlevel_mul.toString() + 'x for Transcension ' + roman + ')';
    }
    text += '<br>';
    if(state.res.resin.eqr(0)) {
      text += '• ' + ' Unused resin boost: ' + getUnusedResinBonusFor(actual_resin).subr(1).toPercentString() + '<br/>';
    } else {
      text += '• ' + ' Unused resin boost (including existing): ' + getUnusedResinBonusFor(actual_resin.add(state.res.resin)).subr(1).toPercentString() + '<br/>';
    }
  }

  var do_fruit = state.treelevel >= min_transcension_level;

  if(do_fruit) {
    have_item = true;
    text += '• ' + getUpcomingFruitEssence().essence + ' fruit essence from ' + state.fruit_sacr.length + ' fruits in the sacrificial pool<br/>';
    if(state.fruit_sacr.length == 0 && state.fruit_stored.length > 0) {
      text += '<font color="#a00">→ You have fruits in storage, if you would like to sacrifice them for essence, take a look at your fruit tab before transcending</font><br/>';
    }
    var highest = 0, highestsacr = 0;
    for(var i = 0; i < state.fruit_active.length; i++) highest = Math.max(highest, state.fruit_active[i].tier);
    for(var i = 0; i < state.fruit_stored.length; i++) highest = Math.max(highest, state.fruit_stored[i].tier);
    for(var i = 0; i < state.fruit_sacr.length; i++) highestsacr = Math.max(highestsacr, state.fruit_sacr[i].tier);
    if(highestsacr > highest) {
      // fruit of highest tier is in sacrificial pool, indicate this to prevent accidently losing it
      text += '<font color="#955">→ Warning: you have a fruit in sacrificial pool of higher tier than any active or stored fruit, check the fruit tab if you want to keep it</font><br/>';
    }
  }

  if(!have_item) {
      text += '• Nothing. Even during a challenge, must reach at least tree level 10 to get something.<br/>';
  }

  return text;
}

function createTranscendDialog(opt_from_challenge) {
  var dialog = createDialog(DIALOG_MEDIUM, function(e) {
      actions.push({type:ACTION_TRANCSEND, challenge:0});
      closeAllDialogs();
      update();
  }, 'transcend', 'cancel');

  dialog.div.className = 'efDialogEthereal';

  var tlevel = Math.floor(state.treelevel / min_transcension_level);
  var roman = tlevel > 1 ? (' ' + util.toRoman(tlevel)) : '';
  var tlevel_mul = Num(tlevel);

  var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [1, -0.01], 0.75, 0.3);
  var text = '';
  if(opt_from_challenge) {
    text += '<b>New regular run' + '</b><br/>';
  } else {
    text += '<b>Transcension' + roman + '</b><br/>';
    text += '<br/>';
    if(tlevel > 1) {
      text += 'Higher transcensions work like transcension but give extra resin multiplier.<br/>';
    } else {
      text += 'Transcension starts a new basic field. Your first transcension also unlocks an ethereal field. On this field you can plant ethereal crops with resin. These crops give bonuses to the basic field in various ways. Resin can also be used for other ethereal upgrades. Unused resin also gives a slight boost. <br/>';
    }
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
  text += '<br/>';
  text += 'What will be kept:<br/>';
  text += '• Achievements<br/>';
  text += '• Resin, twigs and fruit essence<br/>';
  text += '• Ethereal field and ethereal crops<br/>';
  text += '• Ethereal upgrades<br/>';
  text += '• Fruits in the active and storage slots<br/>';
  text += '• Current season<br/>';
  text += '<br/><br/>';

  flex.div.innerHTML = text;
}


// opt_from_challenge = whether you open this dialog after just having completed a challenge as well
function createChallengeDialog(opt_from_challenge) {
  var dialog = createDialog();

  dialog.div.className = 'efDialogEthereal';

  var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [1, -0.01], 0.3, 0.3);

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


  var buttonFlex = new Flex(dialog, 0, 0.3, 1, 0.75, 0.3);

  var pos = 0;
  var h = 0.1;

  for(var i = 0; i < registered_challenges.length; i++) {
    var c = challenges[registered_challenges[i]];
    var c2 = state.challenges[registered_challenges[i]];
    var button = new Flex(buttonFlex, 0.25, pos, 0.75, pos + h);
    pos += h;
    styleButton(button.div);
    button.div.textEl.innerText = upper(c.name);
    button.div.onclick = bind(function(c, c2) {
      var okfun = function() {
        actions.push({type:ACTION_TRANCSEND, challenge:c.index});
        closeAllDialogs();
        update();
      };
      var dialog = createDialog(undefined, okfun, 'start');

      var titleFlex = new Flex(dialog, 0.01, 0.01, 0.99, 0.1, 0.5);
      centerText2(titleFlex.div);
      titleFlex.div.textEl.innerText = upper(c.name);

      var scrollFlex = new Flex(dialog, 0.01, 0.11, 0.99, 0.85, 0.3);
      scrollFlex.div.style.overflowY = 'scroll';
      scrollFlex.div.className = 'efScrollBg';

      var text = '';
      text += '<br><br>';
      text += c.description;
      text += '<br>';

      text += '<b>Current stats:</b><br>';
      text += '• Production bonus per max level reached: ' + c.bonus.toPercentString() + '<br>';
      text += '• Max level reached: ' + c2.maxlevel + '<br>';
      text += '• Production bonus: ' + c.bonus.mulr(c2.maxlevel).toPercentString() + '<br>';
      text += '• Times ran: ' + c2.num + '<br>';
      text += '• Completed: ' + (c2.completed ? 'yes' : 'no') + '<br>';


      scrollFlex.div.innerHTML = text;

    }, c, c2);
  }
}

function createFinishChallengeDialog() {
  var dialog = createDialog();

  dialog.div.className = 'efDialogEthereal';

  var flex = new Flex(dialog, [0, 0.01], [0, 0.01], [1, -0.01], 0.3, 0.3);

  var c = challenges[state.challenge];
  var c2 = state.challenges[state.challenge];

  var targetlevel = c.targetlevel;
  var success = state.treelevel >= targetlevel;
  var already_completed = c2.completed;

  var text = '';

  if(already_completed) {
    // nothing to display here
  } if(success) {
    text += 'You successfully completed the challenge for the first time!';

    if(state.challenge == challenge_bees) {
      text += '<br><br>';
      text += 'Challenge reward: beehives unlocked. They are part of the regular game from now on and unlock whenever planting daisies. Beehives boost neighboring flowers in the regular game.';
    }
  } else {
    text += 'You didn\'t successfully complete the challenge, but can still get the challenge bonus for highest tree level reached.';
  }

  if(c2.num > 0) {
    text += '<br><br>';
    text += 'Previous highest level: ' + c2.maxlevel;
  }

  var newmax = Math.max(state.treelevel, c2.maxlevel);
  var new_total = state.challenge_bonus.sub(getChallengeBonus(state.challenge, c2.maxlevel)).add(getChallengeBonus(state.challenge, newmax));
  text += '<br><br>';
  text += 'Production bonus from this challenge\'s max reached level (and total from all challenges):<br>';
  text += '• Before: ' + getChallengeBonus(state.challenge, c2.maxlevel).toPercentString() + ' (' + state.challenge_bonus.toPercentString() + ' total for all challenges)<br>';
  if(state.treelevel > c2.maxlevel ) {
    text += '• New at max level ' + newmax + ': ' + getChallengeBonus(state.challenge, newmax).toPercentString() + ' (' + new_total.toPercentString() + ' total for all challenges)<br>';
  } else {
    text += '• New stays the same, max level not beaten for this challenge';
  }

  text += '<br><br>';
  text += 'You can now choose to start a new regular run, or any challenge of your choice, from the beginning.';

  flex.div.innerHTML = text;


  var buttonflex = new Flex(dialog, 0.25, 0.6, 0.75, 0.8, 0.3);

  var button = new Flex(buttonflex, 0, 0, 1, 0.3, 0.7).div;
  styleButton(button);
  button.textEl.innerText = 'Start regular run';
  button.textEl.style.boxShadow = '0px 0px 5px #ff0';
  button.textEl.style.textShadow = '0px 0px 5px #ff0';
  registerTooltip(button, 'Show the transcension dialog');
  addButtonAction(button, function() {
    createTranscendDialog(true);
  });

  button = new Flex(buttonflex, 0, 0.32, 1, 0.6, 0.7).div;
  styleButton(button);
  button.textEl.innerText = 'Start a new challenge';
  button.textEl.style.boxShadow = '0px 0px 5px #f60';
  button.textEl.style.textShadow = '0px 0px 5px #f60';
  registerTooltip(button, 'Transcend and start a challenge');
  addButtonAction(button, function() {
    createChallengeDialog(true);
  });
}
