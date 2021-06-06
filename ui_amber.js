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


// amber effect action indices
var AMBER_RESPEC3 = 0;
var AMBER_PROD = 1;
var AMBER_LENGTHEN = 2; // lengthen current season
var AMBER_SHORTEN = 3; // shorten current season



function updateAmberUI() {
  amberFlex.clear();
  var titleFlex = new Flex(amberFlex, 0, 0, 1, 0.1, 0.4);

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
    var buttonFlex = new Flex(amberFlex, 0.1, pos, 0.75, pos + h, 0.5);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.35;
    button.textEl.innerText = text;

    if(effect_index != undefined) addButtonAction(button, function() {
      addAction({type:ACTION_AMBER, effect:effect_index});
      update();
      updateAmberUI();
    });
    return button;
  };

  var button;

  button = makeAmberButton('Production boost 100% (20 amber)', AMBER_PROD);
  registerTooltip(button, 'Get a 100% production boost (seeds and spores) during this run. Resets on transcend.');
  button.id = 'amber_prod';
  if(state.amberprod) button.className = 'efButtonAlreadyActive';
  else if(state.res.amber.lt(ambercost_prod)) button.className = 'efButtonCantAfford';

  button = makeAmberButton('Season +1h (25 amber)', AMBER_LENGTHEN);
  registerTooltip(button, 'Make the current season 1 hour longer (1-time). Can be used once per season.');
  button.id = 'amber_lengthen';
  if(state.amberseason) button.className = 'efButtonAlreadyActive';
  else if(state.res.amber.lt(ambercost_prod)) button.className = 'efButtonCantAfford';

  button = makeAmberButton('Season -1h (25 amber)', AMBER_SHORTEN);
  registerTooltip(button, 'Make the current season 1 hour shorter (1-time). If the season has less than 1 hour remaining, then it is only shortened by this remaining time, immediately activating the next season. Can be used once per season.');
  button.id = 'amber_shorten';
  if(state.amberseason) button.className = 'efButtonAlreadyActive';
  else if(state.res.amber.lt(ambercost_prod)) button.className = 'efButtonCantAfford';

  if(squirrelUnlocked()) {
    button = makeAmberButton('Squirrel respec token (15 amber)', AMBER_RESPEC3);
    registerTooltip(button, 'Get an additional respec token for resetting squirrel upgrades. Note that you already got some for free, no need to buy this if you still have some left.');
    button.id = 'amber_respec';
  }
  if(state.res.amber.lt(ambercost_respec3)) button.className = 'efButtonCantAfford';

  pos += h * 0.5;

  button = makeAmberButton('Help');
  addButtonAction(button, function() {
    showRegisteredHelpDialog(36, true);
  });
}
