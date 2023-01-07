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


// amber effect action indices
var AMBER_SQUIRREL_RESPEC = 0;
var AMBER_PROD = 1;
var AMBER_LENGTHEN = 2; // lengthen current season
var AMBER_SHORTEN = 3; // shorten current season
var AMBER_KEEP_SEASON = 4; // keep the current season for the entire current run. At end of run, if the current season took longer than 24h, next season will then start and last 24h as usual. Should refund the amber if season was not extended
var AMBER_END_KEEP_SEASON = 5; // cancel AMBER_KEEP_SEASON
var AMBER_RESET_CHOICE = 6; // reset choice upgrades

// returns the cost in amber as Num
function getAmberCost(effect) {
  if(effect == AMBER_SQUIRREL_RESPEC) return ambercost_squirrel_respec;
  if(effect == AMBER_PROD) return ambercost_prod;
  if(effect == AMBER_LENGTHEN) return ambercost_lengthen;
  if(effect == AMBER_SHORTEN) return ambercost_shorten;
  if(effect == AMBER_KEEP_SEASON) return ambercost_keep_season;
  if(effect == AMBER_END_KEEP_SEASON) return ambercost_end_keep_season;
  if(effect == AMBER_RESET_CHOICE) return ambercost_reset_choices;
  return Num(999999999);
}

function updateAmberUI() {
  amberFlex.clear();
  var titleFlex = new Flex(amberFlex, 0, 0, 1, 0.1);

  titleFlex.div.innerHTML = `
      Amber Processor. Use amber for various effects.
      <br><br>
      Amber is gained gradually while the tree levels up, it may drop some every now and then.
      <br><br>
      ` +
      'Have amber: ' + state.res.amber.toString();

  var pos = 0.3;
  var buttondiv;
  var h = 0.065;

  var makeAmberButton = function(text, effect_index) {
    var buttonFlex = new Flex(amberFlex, 0.1, pos, 0.75, pos + h);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.35;
    if(effect_index != undefined) {
      text += ' (' + getAmberCost(effect_index).toString() + ' amber)';
    }
    button.textEl.innerText = text;

    if(effect_index != undefined) addButtonAction(button, function() {
      addAction({type:ACTION_AMBER, effect:effect_index});
      update();
      updateAmberUI();
    });
    return button;
  };

  var button;

  button = makeAmberButton('Production boost 100%', AMBER_PROD);
  registerTooltip(button, 'Get a 100% production boost (seeds and spores) during this run. Resets on transcend.');
  button.id = 'amber_prod';
  if(state.amberprod) button.className = 'efButtonAmberActive';
  else if(state.res.amber.lt(ambercost_prod)) button.className = 'efButtonCantAfford';

  if(!state.amberkeepseason) {
    button = makeAmberButton('Season hold this run', AMBER_KEEP_SEASON);
    registerTooltip(button, 'Keep the current season until transcension, it won\'t change until the run is done. Ending the run will start the next season with 24 hours left. If the run is finished early (current season didn\'t need to be held), it\'ll give a full refund of the amber cost and no seasons are affected.');
    button.id = 'amber_keep_season';
    if(state.amberkeepseason) button.className = 'efButtonAmberActive';
    else if(state.res.amber.lt(ambercost_keep_season)) button.className = 'efButtonCantAfford';
  } else {
    button = makeAmberButton('Stop hold season', AMBER_END_KEEP_SEASON);
    registerTooltip(button, 'Stops the keep season effect. Refunds amber if keep season didn\'t have to extend the season. Otherwise starts the next season, which will last 24 hours.');
    button.id = 'amber_end_keep_season';
    if(state.amberkeepseason) button.className = 'efButtonAmberActive';
    else if(state.res.amber.lt(ambercost_end_keep_season)) button.className = 'efButtonCantAfford';
  }

  // This one is not shown for now, because hold season already does the same as this but better
  button = makeAmberButton('Season +1h', AMBER_LENGTHEN);
  registerTooltip(button, 'Make the current season 1 hour longer (1-time). Can be used once per season.');
  button.id = 'amber_lengthen';
  if(state.amberseason) button.className = 'efButtonAmberActive';
  else if(state.res.amber.lt(ambercost_lengthen) || state.amberkeepseason) button.className = 'efButtonCantAfford';

  button = makeAmberButton('Season -1h', AMBER_SHORTEN);
  registerTooltip(button, 'Make the current season 1 hour shorter (1-time). If the season has less than 1 hour remaining, then it is only shortened by this remaining time, immediately activating the next season. Can be used once per season.');
  button.id = 'amber_shorten';
  if(state.amberseason) button.className = 'efButtonAmberActive';
  else if(state.res.amber.lt(ambercost_shorten) || state.amberkeepseason) button.className = 'efButtonCantAfford';

  button = makeAmberButton('Reset choice upgrades', AMBER_RESET_CHOICE);
  registerTooltip(button, 'Resets all choice upgrades, and prevents the automaton from doing them for the rest of this run.');
  button.id = 'amber_reset_choice';
  if(state.amber_reset_choices) button.className = 'efButtonAmberActive';
  else if(state.res.amber.lt(ambercost_reset_choices) || state.amberkeepseason) button.className = 'efButtonCantAfford';

  if(squirrelUnlocked()) {
    button = makeAmberButton('Squirrel respec token', AMBER_SQUIRREL_RESPEC);
    registerTooltip(button, 'Get an additional respec token for resetting squirrel upgrades. Note that you already got some for free, no need to buy this if you still have some left.');
    button.id = 'amber_respec';
  }
  if(state.res.amber.lt(ambercost_squirrel_respec)) button.className = 'efButtonCantAfford';

  pos += h * 0.5;

  button = makeAmberButton('Help');
  addButtonAction(button, function() {
    showRegisteredHelpDialog(36, true);
  });
}
