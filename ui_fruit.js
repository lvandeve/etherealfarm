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

var fruitScrollFlex = undefined;

function getFruitAbilityName(ability, opt_abbreviation) {
  if(opt_abbreviation) {
    switch(ability) {
      case FRUIT_BERRYBOOST: return 'BB';
      case FRUIT_MUSHBOOST: return 'MB';
      case FRUIT_MUSHEFF: return 'ME';
      case FRUIT_FLOWERBOOST: return 'FB';
      case FRUIT_GROWSPEED: return 'G';
      case FRUIT_WEATHER: return 'WB';
      case FRUIT_LEECH: return 'WC';
      case FRUIT_NETTLEBOOST: return 'NB';
      // SB from "season boost", the actual season is known due to the fruit's name which includes the season in it
      case FRUIT_SPRING: return 'SB';
      case FRUIT_SUMMER: return 'SB';
      case FRUIT_AUTUMN: return 'SB';
      case FRUIT_WINTER: return 'SB';
    }
    return '?';
  }
  switch(ability) {
    case FRUIT_BERRYBOOST: return 'berry boost';
    case FRUIT_MUSHBOOST: return 'mushroom boost';
    case FRUIT_MUSHEFF: return 'mushroom economy';
    case FRUIT_FLOWERBOOST: return 'flower boost';
    case FRUIT_GROWSPEED: return 'growing speed';
    case FRUIT_WEATHER: return 'weather boost';
    case FRUIT_LEECH: return 'watercress copying';
    case FRUIT_NETTLEBOOST: return 'nettle boost';
    case FRUIT_SPRING: return 'spring boost';
    case FRUIT_SUMMER: return 'summer boost';
    case FRUIT_AUTUMN: return 'autumn boost';
    case FRUIT_WINTER: return 'winter boost';
  }
  return 'unknown';
}

function getFruitAbilityDescription(ability) {
  switch(ability) {
    case FRUIT_BERRYBOOST: return 'boosts berry production';
    case FRUIT_MUSHBOOST: return 'boosts mushroom production but also consumption';
    case FRUIT_MUSHEFF: return 'reduces mushroom consumption, with diminishing returns';
    case FRUIT_FLOWERBOOST: return 'boosts flowers effect';
    case FRUIT_GROWSPEED: return 'reduces plants growth time';
    case FRUIT_WEATHER: return 'increases the weather effect abilities';
    case FRUIT_LEECH: return 'increases the copy effect of watercress';
    case FRUIT_NETTLEBOOST: return 'boosts the nettle effect';
    case FRUIT_SPRING: return 'boosts the spring flower boost, only during the spring season';
    case FRUIT_SUMMER: return 'boosts the summer berry boost, only during the summer season';
    case FRUIT_AUTUMN: return 'boosts the autumn mushroom boost, only during the autumn season';
    case FRUIT_WINTER: return 'boosts the winter tree warmth effect, only during the winter season';
  }
  return 'unknown';
}

var lastTouchedFruit = null; // for some visual indication only

function createFruitHelp() {
  var dialog = createDialog();

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Fruit help';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1, 0.3);
  var div = flex.div;
  makeScrollable(flex);

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
  text += ' • <b>ctrl + click fruit</b>: move downwards: to storage if available, otherwise to sacrificial pool.';
  text += '<br/>';
  text += ' • <b>shift + click fruit</b>: move upwards: to storage if available, otherwise swap to active slot.';
  text += '<br/>';
  text += ' • <b>shift + click fruit ability upgrade</b>: buy multiple abilities up to 25% of currently available essence';

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

  var canvasFlex = new Flex(dialog.content, [0, 0.01], [0, 0.01], [0, 0.15], [0, 0.15], 0.3);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(images_fruittypes[f.type][f.tier], canvas);
  styleFruitChip(canvasFlex, f);

  var topFlex = new Flex(dialog.content, [0.01, 0.15], 0.01, 0.99, 0.15, 0.3);
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

  var button = new Flex(dialog.content, [0.01, 0.15], 0.25, 0.3, 0.3, 1.5).div;
  styleButton(button);
  button.textEl.innerText = 'help';
  addButtonAction(button.textEl, createFruitHelp);

  var selected = (opt_selected == undefined) ? (f.abilities.length > 1 ? -1 : 0) : opt_selected; // the selected ability for details and upgrade button
  var flexes = [];

  var y = 0.32;
  var h = 0.04;
  for(var i = 0; i < f.abilities.length; i++) {
    var flex = new Flex(dialog.content, [0.01, 0.15], y, 0.7, y + h, 0.5);
    y += h * 1.1;
    var a = f.abilities[i];
    var level = f.levels[i];

    text = upper(getFruitAbilityName(a));
    if(!isInherentAbility(a)) text += ' ' + util.toRoman(level);
    text += ' (' + getFruitBoost(a, level, f.tier).toPercentString() + ')';

    flex.div.innerHTML = text;

    centerText(flex.div);

    flexes[i] = flex;

    flex.div.style.backgroundColor = '#fff'; // temporary, to make styleButton0 use the filter instead of backgroundColor

    styleButton0(flex.div);

    addButtonAction(flex.div, bind(function(i) {
      selected = (i == selected) ? -1 : i;
      updateSelected();
    }, i));
  }

  y += 0.02;
  h = 0.2;
  var bottomflex = new Flex(dialog.content, [0.01, 0.15], y, 0.7, y + h);
  bottomflex.div.style.backgroundColor = '#0f02';
  bottomflex.div.style.border = '1px solid black';
  y += h;
  var textFlex = new Flex(bottomflex, 0.01, 0.0, 0.99, 0.5, 0.4);
  var button = new Flex(bottomflex, 0.01, 0.7, 0.5, 0.95, 0.7).div;
  //var button = new Flex(dialog.content, [0.01, 0.15], y, 0.45, y + h / 2, 0.8).div;
  //y += h;
  styleButton(button);

  //bottomflex.div.style.border = '1px solid black';

  var updateSelected = function() {
    for(var i = 0; i < flexes.length; i++) {
      // TODO: integrate ALL THIS with dark/light theming system and the CSS stylesheet
      if(i == selected) {
        flexes[i].div.style.boxShadow = '0px 0px 5px #000';
        flexes[i].div.style.border = '';
        flexes[i].div.style.backgroundColor = '#8f8';
      } else {
        flexes[i].div.style.boxShadow = '';
        flexes[i].div.style.border = '1px solid #000';
        flexes[i].div.style.backgroundColor = '#6d6';
      }
      var cost = getFruitAbilityCost(f.abilities[i], f.levels[i], f.tier);
      var afford = cost.essence.lte(state.res.essence.sub(f.essence));
      var inherent = isInherentAbility(f.abilities[i]);
      if(inherent) {
        flexes[i].div.style.color = '#0008';
        flexes[i].div.style.textShadow = '2px 0 #fff8, 0 2px #fff8';
      } else {
        flexes[i].div.style.color = afford ? '#000' : '#797';
        flexes[i].div.style.textShadow = '';
      }
    }

    var a = f.abilities[selected];
    var level = f.levels[selected];

    if(selected < 0 || isInherentAbility(a)) {
      textFlex.div.innerHTML = 'click ability to view or level up';
      button.style.visibility = 'hidden';
      if(selected < 0) return;
    } else {
      button.style.visibility = '';
    }

    y += h;

    text = upper(getFruitAbilityName(a));
    if(!isInherentAbility(a)) text += ' ' + util.toRoman(level);
    text += '<br>';
    //text += 'Cost to level: ????';
    text += upper(getFruitAbilityDescription(a));
    text += '<br>';


    if(isInherentAbility(a)) {
      text += 'Boost: ' + getFruitBoost(a, level, f.tier).toPercentString();
      text += '<br>';
      text += '<br>';
      text += 'This is an inherent fruit ability. It doesn\'t take up a regular ability slot for this fruit tier. It cannot be upgraded.';
    } else {
      text += 'Current level: ' + getFruitBoost(a, level, f.tier).toPercentString();
      text += '<br>';
      text += 'Next level: ' + getFruitBoost(a, level + 1, f.tier).toPercentString();

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
    }
    textFlex.div.innerHTML = text;
  };

  y += 0.05;
  var h = 0.05;

  if(!(f.slot < 10)) {
    var moveButton1 = new Flex(dialog.content, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
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

  if(!(f.slot >= 10 && f.slot < 100)) {
    var moveButton2 = new Flex(dialog.content, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
    y += h * 1.1;
    styleButton(moveButton2);
    moveButton2.textEl.innerText = 'to storage slot';
    if(f.slot >= 10 && f.slot < 100) moveButton2.textEl.style.color = '#666';
    if(state.fruit_stored.length >= state.fruit_slots) moveButton2.textEl.style.color = '#666';
    addButtonAction(moveButton2, function() {
      actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:1});
      update();
      //recreate();
      closeAllDialogs();
    });
  }

  if(!(f.slot >= 100)) {
    var moveButton3 = new Flex(dialog.content, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
    y += h * 1.1;
    styleButton(moveButton3);
    moveButton3.textEl.innerText = 'to sacrificial pool';
    if(f.slot >= 100) moveButton3.textEl.style.color = '#666';
    addButtonAction(moveButton3, function() {
      actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:2});
      update();
      //recreate();
      closeAllDialogs();
    });
  }

  styleButton0(canvas, true);
  addButtonAction(canvas, function() {
    f.mark = ((f.mark || 0) + 1) % 5;
    updateFruitUI();
    recreate();
  }, 'mark favorite');
  registerTooltip(canvas, 'click to mark as favorite and toggle color style. This is a visual effect only.');

  updateSelected();
}

function showStorageFruitSourceDialog() {
  var dialog = createDialog();

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Fruit storage slot sources';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1, 0.3);
  var div = flex.div;
  makeScrollable(flex);

  var text = '';

  text += 'You have ' + state.fruit_slots + ' fruit storage slots available. Here\'s where they came from:';
  text += '<br/><br/>';
  text += ' • 2: initial amount';
  text += '<br/>';

  if(state.seen_seasonal_fruit != 0) {
    text += ' • 1: for having seen at least 1 seasonal fruit';
    text += '<br/>';
  }
  if(state.seen_seasonal_fruit == 15) {
    text += ' • 1: for having seen all types of seasonal fruit';
    text += '<br/>';
  }

  var num_ethereal_upgrades = 0;
  if(state.upgrades2[upgrade2_extra_fruit_slot].count) num_ethereal_upgrades++;
  if(state.upgrades2[upgrade2_extra_fruit_slot2].count) num_ethereal_upgrades++;
  if(num_ethereal_upgrades > 0) {
    text += ' • ' + num_ethereal_upgrades + ': ethereal upgrades';
    text += '<br/>';
  }

  if(state.challenges[challenge_rocks].completed) {
    text += ' • 1: for completing the rocks challenge';
    text += '<br/>';
  }

  div.innerHTML = text;
}

function styleFruitChip(flex, f) {
  var ratio = state.res.essence
  flex.div.style.backgroundColor = tierColors_BG[f.tier] + '8';
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

// type: 0=active, 1=storage, 2=sacrificial
function makeFruitChip(flex, f, type) {
  var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(images_fruittypes[f.type][f.tier], canvas);

  var text = upper(f.toString());
  text += ', fruit tier ' + util.toRoman(f.tier);
  for(var i = 0; i < f.abilities.length; i++) {
    var a = f.abilities[i];
    var level = f.levels[i];
    text += '<br>';
    if(isInherentAbility(a)) {
      text += 'Extra ability: ' + upper(getFruitAbilityName(a)) + ' (' + getFruitBoost(a, level, f.tier).toPercentString() + ')';
    } else {
      text += 'Ability: ' + upper(getFruitAbilityName(a)) + ' ' + util.toRoman(level) + ' (' + getFruitBoost(a, level, f.tier).toPercentString() + ')';
    }

  }
  text += '<br>';
  text += 'Get on sacrifice: ' + getFruitSacrifice(f).toString();

  styleFruitChip(flex, f);

  registerTooltip(flex.div, text);
  flex.div.style.userSelect = 'none';

  var typename = (type == 0) ? 'active' : (type == 1 ? 'storage' : 'sacrificial');

  styleButton0(flex.div);
  addButtonAction(flex.div, function(e) {
    if(e.shiftKey) {
      if(f.slot != 0) {
        // move the fruit upwards
        var full = state.fruit_stored.length >= state.fruit_slots;
        var slot = 1;
        if((f.slot > 0 && f.slot < 100) || full) slot = 0;
        actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:slot});
        update();
      }
    } else if(eventHasCtrlKey(e)) {
      if(f.slot < 100) {
        // move the fruit downwards
        var full = state.fruit_stored.length >= state.fruit_slots;
        var slot = 1;
        if(f.slot > 0 || full) slot = 2;
        actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:slot});
        update();
      }
    } else {
      createFruitDialog(f);
    }
  }, typename + ' fruit slot: ' + f.toString());
}

function updateFruitUI() {
  var scrollPos = 0;
  if(fruitScrollFlex) scrollPos = fruitScrollFlex.div.scrollTop;

  fruitFlex.clear();

  var scrollFlex = new Flex(fruitFlex, 0, 0.01, 1, 1);
  fruitScrollFlex = scrollFlex;
  makeScrollable(scrollFlex);

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
    makeFruitChip(canvasFlex, state.fruit_active[0], 0);
  } else {
    canvasFlex.div.style.backgroundColor = '#ccc';
    registerTooltip(canvasFlex.div, 'No active fruit present in this slot. ' + help);

    addButtonAction(canvasFlex.div, bind(function(help) {
      lastTouchedFruit = null;
      updateFruitUI();
      showMessage('No active fruit present in this slot. ' + help, C_INVALID, 0, 0);
    }, help), 'empty active fruit slot');
  }

  ////////

  titleFlex = new Flex(scrollFlex, 0.01, [0, y + s/3], 0.33, [0, y + s], 0.66);
  y += s;
  titleFlex.div.innerText = 'stored fruits (' + state.fruit_stored.length + ' / ' + state.fruit_slots + ')';
  help = 'Fruits in storage slots are kept after transcension, unlike those in the sacrificial pool. To get a fruit in here, click a fruit elsewhere and use its dialog to move it to storage.';
  registerTooltip(titleFlex.div, help);

  styleButton0(titleFlex.div);
  addButtonAction(titleFlex.div, showStorageFruitSourceDialog);

  var num = state.fruit_slots;
  var x = 0;
  for(var i = 0; i < num; i++) {
    var canvasFlex = new Flex(scrollFlex, [0.01, x], [0, y], [0.01, x + s], [0, y + s]);
    x += s;
    canvasFlex.div.style.border = '1px solid black';
    var f = i < state.fruit_stored.length ? state.fruit_stored[i] : undefined;
    if(f) {
      makeFruitChip(canvasFlex, f, 1);
    } else {
      canvasFlex.div.style.backgroundColor = '#ccc';
      registerTooltip(canvasFlex.div, 'No stored fruit present in this slot. ' + help);

      addButtonAction(canvasFlex.div, bind(function(help) {
        lastTouchedFruit = null;
        updateFruitUI();
        showMessage('No stored fruit present in this slot. ' + help, C_INVALID, 0, 0);
      }, help), 'empty storage fruit slot');
    }
  }
  y += s;

  ////////

  titleFlex = new Flex(scrollFlex, 0.01, [0, y + s/3], 0.33, [0, y + s], 0.66);
  y += s;
  titleFlex.div.innerText = 'sacrificial fruit pool (' + state.fruit_sacr.length + ' / ∞)';
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
      makeFruitChip(canvasFlex, f, 2);
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
        showMessage('No fruit present in this sacrificial pool slot. ' + help, C_INVALID, 0, 0);
      }, help), 'empty sacrificial fruit slot');
    }
  }
  y += s;

  ////////

  fruitScrollFlex.div.scrollTop = scrollPos;

}

