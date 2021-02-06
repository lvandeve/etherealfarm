/*
Ethereal Farm
Copyright (C) 2020  Lode Vandevenne

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



function getFruitAbilityName(ability) {
  switch(ability) {
    case FRUIT_BERRYBOOST: return 'berry boost';
    case FRUIT_MUSHBOOST: return 'mushroom boost';
    case FRUIT_MUSHEFF: return 'mushroom economy';
    case FRUIT_FLOWERBOOST: return 'flower boost';
    case FRUIT_GROWSPEED: return 'growing speed';
    case FRUIT_WEATHER: return 'weather boost';
    case FRUIT_LEECH: return 'watercress copying';
    case FRUIT_FERN: return 'fern';
  }
  return 'unknown';
}

function getFruitAbilityDescription(ability) {
  switch(ability) {
    case FRUIT_BERRYBOOST: return 'boosts berry production';
    case FRUIT_MUSHBOOST: return 'boosts mushroom production but also consumption';
    case FRUIT_MUSHEFF: return 'reduces mushroom consumption';
    case FRUIT_FLOWERBOOST: return 'boosts flowers effect';
    case FRUIT_GROWSPEED: return 'reduces plants growth time';
    case FRUIT_WEATHER: return 'increases the weather effect abilities';
    case FRUIT_LEECH: return 'increases the copy effect of watercress';
    case FRUIT_FERN: return 'increases the contents of ferns';
  }
  return 'unknown';
}

var lastTouchedFruit = null; // for some visual indication only

function createFruitHelp() {
  var dialog = createDialog();

  var titleDiv = new Flex(dialog, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Fruit help';

  var div = new Flex(dialog, 0.01, 0.11, 0.99, 0.85, 0.3).div;
  div.style.overflowY = 'scroll';
  div.className = 'efScrollBg';

  var text = '';

  text += 'Fruits have one or more abilities from a random set.';
  text += '<br/><br/>';
  text += 'You can move fruits between the active, stored and sacrificial slots with the buttons in the fruit dialog. You can only have one active fruit and only the abilities of the active fruit have an effect. You can switch the active fruit at any time.';
  text += '<br/><br/>';
  text += 'Fruit essence can be used to level up abilities, increasing their effect. If the fruit has mutliple abilities, click the ability you want to upgrade first.';
  text += '<br/><br/>';
  text += 'All fruit essence is available for all fruits, leveling up an ability in one fruit does not consume any fruit essence for other fruits. Example: if you have 50 fruit essence and 3 fruits, then you can use 50 essence in fruit 1, you can also use 50 essence in fruit 2, and you can also use 50 essence in fruit 3, and in any future fruits as well. If you now sacrifice a fruit that gives 10 essence, you have 10 more essence available for all the others.';
  text += '<br/><br/>';
  text += 'Leveling up abilities permanently affects this fruit, you cannot undo it. This only matters if this fruit has more than one ability so that you have to choose which ones to level up. And if unhappy with this fruit, you can always wait for a next one and sacrifice this one.';
  text += '<br/><br/>';
  text += 'To get more fruit essence, sacrifice fruits by putting them in the sacrificial pool and transcending (available at high enough tree level). The amount of fruit essence of sacrificed fruits depends on their tier (zinc, bronze, ...), the ability levels or how much essence you\'ve used to level them up don\'t matter for this.';
  text += '<br/><br/>';
  text += 'The active and stored fruits do not get sacrificed and stay after transcension.';
  text += '<br/><br/>';
  text += 'Higher tier fruits may have more abilities, and abilities provide more boost.';
  text += '<br/><br/>';
  text += 'Click the fruit logo in the fruit dialog to mark as favorite and alter color effects (visual effect only).';
  text += '<br/><br/>';
  text += 'Fruit related hotkeys:';
  text += '<br/>';
  text += ' • <b>shift + click fruit</b>: move to sacrificial pool or from sacrificial pool to storage.';
  text += '<br/>';
  text += ' • <b>ctrl + click fruit</b>: swap to active slot.';
  text += '<br/>';
  text += ' • <b>shift + click fruit ability upgrade</b>: buy multiple abilities up to 25% of current available essence';

  div.innerHTML = text;
}

function createFruitDialog(f, opt_selected) {
  lastTouchedFruit = f;
  updateFruitUI(); // to update lastTouchedFruit style
  var dialog = createDialog();
  var recreate = function() {
    closeAllDialogs();
    createFruitDialog(f, selected);
  };
  dialog.div.className = 'efDialogTranslucent';

  var canvasFlex = new Flex(dialog, [0, 0.01], [0, 0.01], [0, 0.15], [0, 0.15], 0.3);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(images_apple[f.tier], canvas);
  styleFruitChip(canvasFlex, f);

  var topFlex = new Flex(dialog, [0.01, 0.15], 0.01, 0.99, 0.15, 0.3);
  var text = upper(f.toString());
  text += '<br>';
  text += 'Tier ' + util.toRoman(f.tier) + ': ' + tierNames[f.tier];
  text += '<br><br>';
  text += 'Fruit essence available: ' + state.res.essence.sub(f.essence).toString() + ' of ' + state.res.essence.toString();
  text += '<br>';
  text += 'Fruit essence used: ' + f.essence.toString();
  text += '<br>';
  text += 'Get on sacrifice: ' + getFruitSacrifice(f).toString();
  topFlex.div.innerHTML = text;

  var button = new Flex(dialog, [0.01, 0.15], 0.16, 0.3, 0.19, 1.5).div;
  styleButton(button);
  button.textEl.innerText = 'help';
  addButtonAction(button.textEl, createFruitHelp);

  var selected = (opt_selected == undefined) ? (f.abilities.length > 1 ? -1 : 0) : opt_selected; // the selected ability for details and upgrade button
  var flexes = [];

  var y = 0.22;
  var h = 0.04;
  for(var i = 0; i < f.abilities.length; i++) {
    var flex = new Flex(dialog, [0.01, 0.15], y, 0.7, y + h, 0.5);
    y += h * 1.1;
    var a = f.abilities[i];
    var level = f.levels[i];

    text = upper(getFruitAbilityName(a)) + ' ' + util.toRoman(level) + ' (' + getFruitBoost(a, level, f.tier).toPercentString() + ')';

    flex.div.innerHTML = text;

    centerText(flex.div);

    flexes[i] = flex;

    flex.div.style.backgroundColor = '#fff'; // temporary, to make styleButton0 use the filter instead of backgroundColor
    styleButton0(flex.div);
    addButtonAction(flex.div, bind(function(i) {
      selected = i;
      updateSelected();
    }, i));
  }

  y += 0.02;
  h = 0.15;
  var bottomflex = new Flex(dialog, [0.01, 0.15], y, 0.7, y + h);
  bottomflex.div.style.backgroundColor = '#0f02';
  bottomflex.div.style.border = '1px solid black';
  y += h;
  var textFlex = new Flex(bottomflex, 0.01, 0.0, 0.99, 0.5, 0.4);
  var button = new Flex(bottomflex, 0.01, 0.7, 0.5, 0.95, 0.7).div;
  //var button = new Flex(dialog, [0.01, 0.15], y, 0.45, y + h / 2, 0.8).div;
  //y += h;
  styleButton(button);

  //bottomflex.div.style.border = '1px solid black';

  var updateSelected = function() {
    for(var i = 0; i < flexes.length; i++) {
      if(i == selected) {
        flexes[i].div.style.boxShadow = '0px 0px 5px #000';
        flexes[i].div.style.border = '';
        flexes[i].div.style.backgroundColor = '#afa';
      } else {
        flexes[i].div.style.boxShadow = '';
        flexes[i].div.style.border = '1px solid #000';
        flexes[i].div.style.backgroundColor = '#8d8';
      }
      flexes[i].div.style.color = '#000';
    }

    if(selected < 0) {
      textFlex.div.innerHTML = 'click ability to view or level up';
      button.style.visibility = 'hidden';
      return;
    }
    button.style.visibility = '';
    var a = f.abilities[selected];
    var level = f.levels[selected];

    y += h;

    text = upper(getFruitAbilityName(a)) + ' ' + util.toRoman(level);
    text += '<br>';
    //text += 'Cost to level: ????';
    text += upper(getFruitAbilityDescription(a));
    text += '<br>';
    text += 'Current level: ' + getFruitBoost(a, level, f.tier).toPercentString();
    text += '<br>';
    text += 'Next level: ' + getFruitBoost(a, level + 1, f.tier).toPercentString();
    textFlex.div.innerHTML = text;


    var cost = getFruitAbilityCost(a, level, f.tier);
    button.textEl.innerText = 'Level up: ' + cost.toString();
    var available = state.res.essence.sub(f.essence);
    if(available.lt(cost.essence)) {
      button.className = 'efButtonCantAfford';
    } else {
      button.className = 'efButton';
    }
    registerTooltip(button, 'Levels up this ability. Does not permanently use up essence, only for this fruit: all essence can be used in all fruits. Hold shift to level up multiple times but with only up to 25% of available essence');
    addButtonAction(button, function(e) {
      actions.push({type:ACTION_FRUIT_LEVEL, f:f, index:selected, shift:e.shiftKey});
      update();
      recreate();
    });
  };

  y += 0.05;
  var h = 0.05;

  if(!(f.slot < 10)) {
    var moveButton1 = new Flex(dialog, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
    y += h * 1.1;
    styleButton(moveButton1);
    moveButton1.textEl.innerText = 'to active slot';
    if(f.slot < 10) moveButton1.textEl.style.color = '#666';
    addButtonAction(moveButton1, function() {
      actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:0});
      update();
      //recreate();
      closeAllDialogs();
    });
  }

  if(!(f.slot >= 10 && f.slot < 20)) {
    var moveButton2 = new Flex(dialog, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
    y += h * 1.1;
    styleButton(moveButton2);
    moveButton2.textEl.innerText = 'to storage slot';
    if(f.slot >= 10 && f.slot < 20) moveButton2.textEl.style.color = '#666';
    if(state.fruit_stored.length >= state.fruit_slots) moveButton2.textEl.style.color = '#666';
    addButtonAction(moveButton2, function() {
      actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:1});
      update();
      //recreate();
      closeAllDialogs();
    });
  }

  if(!(f.slot >= 20)) {
    var moveButton3 = new Flex(dialog, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
    y += h * 1.1;
    styleButton(moveButton3);
    moveButton3.textEl.innerText = 'to sacrificial pool';
    if(f.slot >= 20) moveButton3.textEl.style.color = '#666';
    addButtonAction(moveButton3, function() {
      actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:2});
      update();
      //recreate();
      closeAllDialogs();
    });
  }

  styleButton0(canvas);
  addButtonAction(canvas, function() {
    f.mark = ((f.mark || 0) + 1) % 5;
    updateFruitUI();
    recreate();
  }, 'mark favorite');
  registerTooltip(canvas, 'click to mark as favorite and toggle color style. This is a visual effect only.');

  updateSelected();
}

function styleFruitChip(flex, f) {
  var ratio = state.res.essence
  var power = 0;
  for(var i = 0; i < f.levels.length; i++) power = Math.max(power, f.levels[i]);
  power = towards1(power, 20);
  var hsl = [power * 192, 255, 32, 112];
  // give fruits with higher level upgrades a slightly different background color, just as a way to distinguish them a bit
  var color = RGBtoCSS(HSLtoRGB(hsl));
  flex.div.style.backgroundColor = color;
  if(f.mark) {
    var color = f.mark == 1 ? '#f008' : (f.mark == 2 ? '#fe08' : (f.mark == 3 ? '#4c48' : '#06c8'));
    flex.div.style.border = '3px solid ' + color;
  } else {
    flex.div.style.border = '1px solid black';
  }
  if(lastTouchedFruit == f) {
    flex.div.style.boxShadow = '0px 0px 16px #000';
  } else {
    flex.div.style.boxShadow = '';
  }
}

function makeFruitChip(flex, f) {
  var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(images_apple[f.tier], canvas);

  var text = upper(f.toString());
  text += ', fruit tier ' + util.toRoman(f.tier);
  for(var i = 0; i < f.abilities.length; i++) {
    var a = f.abilities[i];
    var level = f.levels[i];
    text += '<br>';
    text += 'Ability: ' + upper(getFruitAbilityName(a)) + ' ' + util.toRoman(level) + ' (' + getFruitBoost(a, level, f.tier).toPercentString() + ')';
  }

  styleFruitChip(flex, f);

  registerTooltip(flex.div, text);
  flex.div.style.userSelect = 'none';

  addButtonAction(flex.div, function(e) {
    if(e.shiftKey) {
      var slot = 2;
      if(f.slot >= 20) slot = 1;
      actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:slot});
      update();
    } else if(eventHasCtrlKey(e)) {
      actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:0});
      update();
    } else {
      createFruitDialog(f);
    }
  }, 'fruit: ' + f.toString());
}

function updateFruitUI() {
  fruitFlex.clear();

  var scrollFlex = new Flex(fruitFlex, 0, 0.01, 1, 1);
  scrollFlex.div.style.overflowY = 'scroll';
  scrollFlex.div.style.overflowX = 'visible';
  scrollFlex.div.style.border = '5px solid #ccc';

  var titleFlex = new Flex(scrollFlex, 0.01, 0.02, 0.95, 0.15, 0.3);

  titleFlex.div.innerText = 'Fruit collection';

  var s = 0.1; // relative width and height of a chip
  var y = 0.1;
  var help;

  ////////

  titleFlex = new Flex(scrollFlex, 0.01, [0, y + s/3], 0.33, [0, y + s], 0.66);
  y += s;
  titleFlex.div.innerText = 'active fruit';
  help = 'Only the fruit in the active slot will grant the abilities. The fruit in the active slot is kept after transcensions, just like those in storage. To get a fruit in here, click a fruit elsewhere and use its dialog to move it to the active slot.';
  registerTooltip(titleFlex.div, help);

  var canvasFlex = new Flex(scrollFlex, [0.01, 0], [0, y], [0.01, s], [0, y + s]);
  y += s;
  canvasFlex.div.style.border = '1px solid black';
  if(state.fruit_active.length) {
    makeFruitChip(canvasFlex, state.fruit_active[0]);
  } else {
    canvasFlex.div.style.backgroundColor = '#ccc';
    registerTooltip(canvasFlex.div, 'No active fruit present in this slot. ' + help);

    addButtonAction(canvasFlex.div, bind(function(help) {
      lastTouchedFruit = null;
      updateFruitUI();
      showMessage('No active fruit present in this slot. ' + help);
    }, help));
  }

  ////////

  titleFlex = new Flex(scrollFlex, 0.01, [0, y + s/3], 0.33, [0, y + s], 0.66);
  y += s;
  titleFlex.div.innerText = 'stored fruits';
  help = 'Fruits in storage slots are kept after transcension, unlike those in the sacrificial pool. To get a fruit in here, click a fruit elsewhere and use its dialog to move it to storage.';
  registerTooltip(titleFlex.div, help);

  var num = state.fruit_slots;
  var x = 0;
  for(var i = 0; i < num; i++) {
    var canvasFlex = new Flex(scrollFlex, [0.01, x], [0, y], [0.01, x + s], [0, y + s]);
    x += s;
    canvasFlex.div.style.border = '1px solid black';
    var f = i < state.fruit_stored.length ? state.fruit_stored[i] : undefined;
    if(f) {
      makeFruitChip(canvasFlex, f);
    } else {
      canvasFlex.div.style.backgroundColor = '#ccc';
      registerTooltip(canvasFlex.div, 'No stored fruit present in this slot. ' + help);

      addButtonAction(canvasFlex.div, bind(function(help) {
        lastTouchedFruit = null;
        updateFruitUI();
        showMessage('No stored fruit present in this slot. ' + help);
      }, help));
    }
  }
  y += s;

  ////////

  titleFlex = new Flex(scrollFlex, 0.01, [0, y + s/3], 0.33, [0, y + s], 0.66);
  y += s;
  titleFlex.div.innerText = 'sacrificial fruit pool';
  help = 'Fruits in here will be turned into fruit essence on the next transcension. To get a fruit in here, click a fruit elsewhere and use its dialog to move it to the sacrificial pool.';
  registerTooltip(titleFlex.div, help);

  var num = Math.max(4, state.fruit_sacr.length);
  var x = 0;
  for(var i = 0; i < num; i++) {
    var canvasFlex = new Flex(scrollFlex, [0.01, x], [0, y], [0.01, x + s], [0, y + s]);
    x += s;
    if(x > s * 10) {
      x = 0;
      y += s;
    }
    canvasFlex.div.style.border = '1px solid black';
    var f = i < state.fruit_sacr.length ? state.fruit_sacr[i] : undefined;
    if(f) {
      makeFruitChip(canvasFlex, f);
    } else {
      if(i == 0) {
        canvasFlex.div.style.border = '1px solid #000';
        canvasFlex.div.style.backgroundColor = '#ccc';
      } else if(i == 1) {
        canvasFlex.div.style.border = '1px solid #0008';
        canvasFlex.div.style.backgroundColor = '#ccc8';
      } else if(i == 2) {
        canvasFlex.div.style.border = '1px solid #0004';
        canvasFlex.div.style.backgroundColor = '#ccc4';
      } else if(i == 3) {
        canvasFlex.div.style.border = '1px solid #0002';
        canvasFlex.div.style.backgroundColor = '#ccc2';
      }

      registerTooltip(canvasFlex.div, 'No fruit present in this sacrificial pool slot. ' + help);

      addButtonAction(canvasFlex.div, bind(function(help) {
        lastTouchedFruit = null;
        updateFruitUI();
        showMessage('No fruit present in this sacrificial pool slot. ' + help);
      }, help));
    }
  }
  y += s;

  ////////

}

