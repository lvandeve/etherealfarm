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
      case FRUIT_NONE: return '/';
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
    case FRUIT_NONE: return 'none';
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
    case FRUIT_NONE: return 'none, fuse fruits to fill this slot';
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
  text += 'You can move fruits between the stored and sacrificial slots with the buttons in the fruit dialog. You can choose the active fruit with the arrows. You can only have one active fruit and only the abilities of the active fruit have an effect. You can switch the active fruit at any time.';
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
  text += '<b>Fusing Fruits</b>';
  text += '<br/><br/>';
  text += 'Fruits of the same tier (tier bronze and up) can be fused together to allow transfering abilities to create the fruit with the combination you want, when the random drops aren\'t giving it. Fusing does not increase strength of stats, it\'s only about allowing control of the combination.';
  text += '<br/><br/>';
  text += 'Fusing fruits destroys the two original fruits and creates a new one of same type as first fused fruit and a new set of abilities that depends on the two original ones, but mostly like the first. The rules are as follows:';
  text += '<br/>';
  text += ' • The new fruit will initially have the same abilities as the first original fruit (but all reset to level 1), but some may be pushed out in a next step';
  text += '<br/>';
  text += ' • Any abilities in the second fruit that match the first fruit, will charge up the matching ability: it becomes charged (marked [*]), or fusible (marked [**]) if already charged';
  text += '<br/>';
  text += ' • Any abilities in the second fruit that are fusible [**] will be transfered to the result fruit and push out the last ability of the result fruit';
  text += '<br/>';
  text += ' • Any other abilities of the second fruit disappear and don\'t matter, the only abilities of the second fruit that matter are: abilities that match the first fruit, to charge them up, and fusible abilities, to replace abilities of the first fruit.';
  text += '<br/>';
  text += ' • The order of abilities of first and second fruit matters, and you can freely reorder abilities in the regular fruit dialog (where you level up abilities), so you can control which abilities of the first fruit stay and which get pushed out.';
  text += '<br/>';
  text += ' • The seasonal abilities of some fruit types (pineapple, ...) do not participiate in fusing. The first fruit determines the type of the resulting fruit, if the second fruit has a seasonal ability, it will be lost.';
  text += '<br/><br/>';
  text += 'Summary of the rules: get 3 fruits with ability you want, fuse them together, and fuse the result into a fruit to get that ability in there and push out an unwanted ability. Example: if you desire a silver fruit with flower boost and berry boost, one way you could reach it is:';
  text += '<br/>';
  text += ' • collect 3 silver fruits that have flower boost in any slot, fruits A, B and C';
  text += '<br/>';
  text += ' • fuse A with B, resulting in a fruit AB with charged flower boost, marked [*]';
  text += '<br/>';
  text += ' • fuse AB with C, resulting in a fruit ABC with fusible flower boost, marked [**]';
  text += '<br/>';
  text += ' • collect a fruit D that has berry boost, and if necessary, move berry boost to the first slot ';
  text += '<br/>';
  text += ' • fuse ABC into D, resulting in the desired fruit with flower boost and berry boost. Don\'t forget to level up its abilities, since they\'ll all be set to level 1.';
  text += '<br/><br/>';
  text += '<b>Fruit related hotkeys</b>';
  text += '<br/><br/>';
  text += 'Note: on mac, ctrl means command instead.';
  text += '<br/>';
  text += ' • <b>ctrl + click fruit</b>: move fruit between sacrificial and storage slots, if possible.';
  text += '<br/>';
  text += ' • <b>shift + click fruit</b>: same as ctrl + click fruit.';
  text += '<br/>';
  text += ' • <b>drag & drop</b>: drag fruits between slots, re-order slots.';
  text += '<br/>';
  text += ' • <b>shift + click fruit ability upgrade</b>: buy multiple abilities up to 25% of currently available essence';
  text += '<br/>';
  text += ' • <b>], } or )</b>: select next active fruit';
  text += '<br/>';
  text += ' • <b>[, { or (</b>: select previous active fruit';

  div.innerHTML = text;
}

function createFruitFuseDialog(f, parentdialogrecreatefun) {
  lastTouchedFruit = null;

  var selected = undefined;

  var swapped = false;

  var dialog = createDialog(undefined, function() {
    if(selected) {
      if(swapped) {
        actions.push({type:ACTION_FRUIT_FUSE, a:selected, b:f});
      } else {
        actions.push({type:ACTION_FRUIT_FUSE, a:f, b:selected});
      }
    }
    dialog.cancelFun();
    update();
    if(parentdialogrecreatefun) parentdialogrecreatefun(lastTouchedFruit);
  }, 'fuse');
  makeScrollable(dialog.content);

  var make = function() {
    var scrollFlex = dialog.content;
    scrollFlex.clear();

    var fruits = [];
    for(var i = 0; i < state.fruit_stored.length + state.fruit_sacr.length; i++) {
      var f2 = (i < state.fruit_stored.length) ? state.fruit_stored[i] : (state.fruit_sacr[i - state.fruit_stored.length]);
      if(f2 == f) continue;
      if(f2.tier != f.tier) continue;
      fruits.push(f2);
    }

    var s = 0.1; // relative width and height of a chip
    var x = 0;
    var y = 0.03;

    var addTitle = function(text) {
      y += s * 0.5;
      var flex = new Flex(scrollFlex, [0.01, 0], [0, y], 1, [0, y + s]);
      flex.div.innerText = text;
      y += s * 0.5;
    };

    addTitle('choose other fruit to fuse:');

    for(var i = 0; i < fruits.length; i++) {
      if(x > s * 8.5) {
        x = 0;
        y += s;
      }
      var flex = new Flex(scrollFlex, [0.01, x], [0, y], [0.01, x + s], [0, y + s]);
      x += s;
      var f2 = fruits[i]
      makeFruitChip(flex, f2, 0, true);

      styleButton0(flex.div);
      addButtonAction(flex.div, bind(function(f) {
        selected = f;
        lastTouchedFruit = f;
        make();
      }, f2));
    }
    y += s;

    if(fruits.length == 0) {
      var flex = new Flex(scrollFlex, 0.01, [0, y], 0.9, [0, y + s]);
      flex.div.innerText = 'No fruit to fuse, must have at least 1 other fruit of the same tier';
    }

    addTitle('fruits to fuse:');

    var fruits2 = [f, selected];

    x = 0;
    for(var i = 0; i <= fruits2.length; i++) {
      if(i == fruits2.length) x += s * 0.5;
      var flex = new Flex(scrollFlex, [0.01, x], [0, y], [0.01, x + s], [0, y + s]);
      x += s;
      var f2 = fruits2[(swapped && i < fruits2.length) ? (fruits2.length - 1 - i) : i]
      if(f2) {
        makeFruitChip(flex, f2, 0, true, (i == 0 ? 'first' : 'second') + ' selected fuse fruit');
        styleButton0(flex.div);
        addButtonAction(flex.div, bind(function(f2) {
          createFruitInfoDialog(f);
        }, f));
      } else if(i == fruits2.length) {
        var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
        renderImage(image_swap, canvas);
        styleButton0(flex.div, true);
        addButtonAction(flex.div, bind(function(f2, e) {
          if(e.shiftKey) {
            if(!selected) return;
            var temp = f;
            f = selected;
            selected = temp;
            make();
          } else {
            swapped = !swapped;
            make();
          }
        }, f));
        registerTooltip(flex.div, 'Swap the fuse order of the two fruits');
      } else {
        flex.div.style.backgroundColor = '#ccc';
        flex.div.style.border = '1px solid black';
        registerTooltip(flex.div, 'Empty fuse fruit slot, select a fruit above to fuse');
      }
    }
    y += s;


    addTitle('fused fruit result:');

    var message = [undefined];
    var fuse = swapped ? fuseFruit(selected, f, message) : fuseFruit(f, selected, message);

    x = 0;
    var flex = new Flex(scrollFlex, [0.01, x], [0, y], [0.01, x + s], [0, y + s]);
    x += s;
    if(fuse) {
      makeFruitChip(flex, fuse, 0, true, 'fused fruit result');
      styleButton0(flex.div);
      addButtonAction(flex.div, bind(function(f) {
        createFruitInfoDialog(f);
      }, fuse));
    } else {
      flex.div.style.backgroundColor = '#ccc';
      flex.div.style.border = '1px solid black';
      registerTooltip(flex.div, 'Fused fruit appears here when successful');
    }
    y += s;

    if(fuse) {
      for(var i = -1; i < fuse.abilities.length; i++) {
        var flex = new Flex(scrollFlex, [0.01, 0], [0, y], 1, [0, y + s]);
        if(i == -1) {
          flex.div.innerText = fuse.toString() + ', fused ' + fuse.fuses + ' times';
        } else {
          var other = swapped ? selected : f;
          flex.div.innerText = 'ability: ' + fuse.abilityToString(i) + '  (was: ' + other.abilityToString(i) + ')';
        }
        y += s * 0.5;
      }
    } else if(message[0]) {
      y += s * 0.25;
      x = 0;
      var flex = new Flex(scrollFlex, [0.01, 0], [0, y], [0.99, 0], [0, y + s]);
      x += s;
      flex.div.innerText = message[0];
    }
  };

  make();
}

function fillFruitDialog(dialog, f, opt_selected) {
  dialog.content.clear();
  lastTouchedFruit = f;
  updateFruitUI(); // to update lastTouchedFruit style
  var recreate = function(opt_f) {
    if(opt_f) f = opt_f;
    fillFruitDialog(dialog, f, selected);
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
  if(f.fuses) {
    text += '<br>';
    text += 'Fuses done: ' + f.fuses;
  }
  topFlex.div.innerHTML = text;

  var selected = (opt_selected == undefined) ? (f.abilities.length > 1 ? -1 : 0) : opt_selected; // the selected ability for details and upgrade button
  var flexes = [];

  var y = 0.22;
  var h = 0.04;
  for(var i = 0; i < f.abilities.length; i++) {
    var flex = new Flex(dialog.content, [0.01, 0.15], y, 0.7, y + h, 0.5);
    y += h * 1.1;
    var a = f.abilities[i];
    var level = f.levels[i];

    text = upper(f.abilityToString(i));
    text += ' (' + getFruitBoost(a, level, f.tier).toPercentString() + ')';

    centerText2(flex.div);

    flex.div.textEl.innerHTML = text;

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
  var levelButton = new Flex(bottomflex, 0.01, 0.7, 0.5, 0.95, 0.7).div;
  styleButton(levelButton);

  var upButton = new Flex(bottomflex, 0.55, 0.7, 0.7, 0.95).div;
  styleButton(upButton);

  var downButton = new Flex(bottomflex, 0.75, 0.7, 0.9, 0.95).div;
  styleButton(downButton);

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
      levelButton.style.visibility = 'hidden';
      upButton.style.visibility = 'hidden';
      downButton.style.visibility = 'hidden';
      if(selected < 0) return;
    } else {
      levelButton.style.visibility = '';
      upButton.style.visibility = '';
      downButton.style.visibility = '';
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
      text += 'This is an inherent fruit ability. It doesn\'t take up a regular ability slot for this fruit tier. It cannot be upgraded nor moved.';
    } else {
      text += 'Current level: ' + getFruitBoost(a, level, f.tier).toPercentString();
      text += '<br>';
      text += 'Next level: ' + getFruitBoost(a, level + 1, f.tier).toPercentString();

      var cost = getFruitAbilityCost(a, level, f.tier);
      levelButton.textEl.innerText = 'Level up: ' + cost.toString();
      var available = state.res.essence.sub(f.essence);
      if(available.lt(cost.essence)) {
        levelButton.className = 'efButtonCantAfford';
      } else {
        levelButton.className = 'efButton';
      }
      registerTooltip(levelButton, 'Levels up this ability. Does not permanently use up essence, only for this fruit: all essence can be used in all fruits. Hold shift to level up multiple times but with only up to 25% of available essence');
      addButtonAction(levelButton, function(e) {
        actions.push({type:ACTION_FRUIT_LEVEL, f:f, index:selected, shift:e.shiftKey});
        update();
        recreate();
      });


      upButton.textEl.innerText = '^';
      if(selected <= 0) {
        upButton.className = 'efButtonCantAfford';
      } else {
        upButton.className = 'efButton';
      }
      registerTooltip(upButton, 'Moves up this ability in the order. This has no effect on ability strength, but can affect fusing of fruits');
      addButtonAction(upButton, function(e) {
        if(selected <= 0) return;
        actions.push({type:ACTION_FRUIT_REORDER, f:f, index:selected, up:true});
        selected--;
        update();
        recreate();
      });


      downButton.textEl.innerText = 'v';
      if(selected + 1 >= getNumFruitAbilities(f.tier)) {
        downButton.className = 'efButtonCantAfford';
      } else {
        downButton.className = 'efButton';
      }
      registerTooltip(downButton, 'Moves down this ability in the order. This has no effect on ability strength, but can affect fusing of fruits');
      addButtonAction(downButton, function(e) {
        if(selected + 1 >= getNumFruitAbilities(f.tier)) return;
        actions.push({type:ACTION_FRUIT_REORDER, f:f, index:selected, up:false});
        selected++;
        update();
        recreate();
      });

    }
    textFlex.div.innerHTML = text;
  };

  y += 0.05;
  var h = 0.05;

  if(f.slot >= 100) {
    var moveButton1 = new Flex(dialog.content, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
    y += h * 1.1;
    styleButton(moveButton1);
    moveButton1.textEl.innerText = 'to storage slot';
    if(state.fruit_stored.length >= state.fruit_slots) moveButton1.textEl.style.color = '#666';
    addButtonAction(moveButton1, function() {
      actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:0});
      update();
      //recreate();
      closeAllDialogs();
    });
  }

  if(f.slot < 100) {
    var moveButton2 = new Flex(dialog.content, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
    y += h * 1.1;
    styleButton(moveButton2);
    moveButton2.textEl.innerText = 'to sacrificial pool';
    addButtonAction(moveButton2, function() {
      actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:1});
      update();
      //recreate();
      closeAllDialogs();
    });

    var moveButton3 = new Flex(dialog.content, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
    y += h * 1.1;
    styleButton(moveButton3);
    moveButton3.textEl.innerText = 'make active';
    addButtonAction(moveButton3, function() {
      state.fruit_active = f.slot;
      updateFruitUI();
      update();
      //recreate();
      closeAllDialogs();
    });
  }

  // can't do fusing on fruits that only have 1 ability
  if(f.tier > 0) {
    var fuseButton = new Flex(dialog.content, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
    y += h * 1.1;
    styleButton(fuseButton);
    fuseButton.textEl.innerText = 'fuse';
    if(fruitReachedFuseMax(f)) fuseButton.textEl.style.color = '#666';
    addButtonAction(fuseButton, function() {
      createFruitFuseDialog(f, recreate);
    });
  }

  var renameButton = new Flex(dialog.content, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
  y += h * 1.1;
  styleButton(renameButton);
  renameButton.textEl.innerText = 'rename';
  addButtonAction(renameButton, function() {
    makeTextInput('Enter new fruit name, or empty for default', function(name) {
      f.name = sanitizeName(name);
      updateFruitUI();
      if(dialog_level) recreate();
    });
  });

  var helpButton = new Flex(dialog.content, [0.01, 0.15], y, 0.45, y + h, 0.8).div;
  y += h * 1.1;
  styleButton(helpButton);
  helpButton.textEl.innerText = 'help';
  addButtonAction(helpButton, createFruitHelp);


  styleButton0(canvas, true);
  addButtonAction(canvas, function() {
    f.mark = ((f.mark || 0) + 1) % 5;
    updateFruitUI();
    recreate();
  }, 'mark favorite');
  registerTooltip(canvas, 'click to mark as favorite and toggle color style. This is a visual effect only.');




  updateSelected();
}

function createFruitDialog(f, opt_selected) {
  var dialog = createDialog();
  fillFruitDialog(dialog, f, opt_selected);
}

function createFruitInfoDialog(f) {
  var dialog = createDialog();

  var scrollFlex = dialog.content;

  var y = 0;
  var s = 0.1;

  for(var i = -1; i < f.abilities.length; i++) {
    var flex = new Flex(scrollFlex, [0.01, 0], [0, y], 1, [0, y + s]);
    flex.div.innerText = (i == -1) ? (f.toString() + ', fused ' + f.fuses + ' times') : ('ability: ' + f.abilityToString(i));
    y += s * 0.5;
  }
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
  text += ' • 3: initial amount';
  text += '<br/>';

  if(state.seen_seasonal_fruit != 0) {
    text += ' • 1: for having seen at least 1 seasonal fruit';
    text += '<br/>';
  }
  if(state.seen_seasonal_fruit == 15) {
    text += ' • 1: for having seen all 4 types of seasonal fruit';
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
  } else if(f.name) {
    var color = '#0008';
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

// type: 0=storage, 1=sacrificial
function makeFruitChip(flex, f, type, opt_nobuttonaction, opt_label) {
  var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(images_fruittypes[f.type][f.tier], canvas);



  var text = '';
  if(opt_label) text += opt_label + '<br>';

  text += upper(f.toString());
  text += ', fruit tier ' + util.toRoman(f.tier);
  for(var i = 0; i < f.abilities.length; i++) {
    var a = f.abilities[i];
    var level = f.levels[i];
    text += '<br>';
    if(isInherentAbility(a)) {
      text += 'Extra ability: ' + upper(f.abilityToString(i)) + ' (' + getFruitBoost(a, level, f.tier).toPercentString() + ')';
    } else if(a == FRUIT_NONE) {
      text += 'Ability: ' + upper(f.abilityToString(i));
    } else {
      text += 'Ability: ' + upper(f.abilityToString(i)) + ' (' + getFruitBoost(a, level, f.tier).toPercentString() + ')';
    }

  }
  text += '<br>';
  text += 'Get on sacrifice: ' + getFruitSacrifice(f).toString();

  styleFruitChip(flex, f);

  registerTooltip(flex.div, text);
  flex.div.style.userSelect = 'none';

  var typename = type == 0 ? 'storage' : 'sacrificial';

  if(!opt_nobuttonaction) {
    styleButton0(flex.div);
    addButtonAction(flex.div, function(e) {
      if(e.shiftKey || eventHasCtrlKey(e)) {
        if(f.slot >= 100) {
          // move the fruit upwards
          var full = state.fruit_stored.length >= state.fruit_slots;
          if(!full) {
            actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:0});
            update();
          }
        } else { // move the fruit downwards
          actions.push({type:ACTION_FRUIT_SLOT, f:f, slot:1});
          update();
        }
      } else {
        createFruitDialog(f);
      }
    }, typename + ' fruit slot: ' + f.toString());
  }
}

function setupFruitDrag(flex, slot, f) {
  if(f) {
    flex.div.draggable = true;
    util.addEvent(flex.div, 'ondragstart', function(e) {
      e.dataTransfer.setData('text/plain', '' + f.slot);
    });
  }
  util.addEvent(flex.div, 'ondrop', function(e) {
    e.preventDefault(); // prevent firefox from actually trying to do a network request to http://0.0.0.<fruitindex> when trying to access e.dataTransfer
    if(!e.dataTransfer) return;
    var data = e.dataTransfer.getData('text/plain');
    if(!data) return;
    var origslot = parseInt(data);
    if(!(origslot >= 0 && origslot <= 100 + state.fruit_sacr.length)) return;
    var f = getFruit(origslot);
    if(!f) return;
    actions.push({type:ACTION_FRUIT_SLOT, f:f, precise_slot:slot});
    update();
  });
  util.addEvent(flex.div, 'ondragenter', function(e) {
    e.preventDefault();
    return false;
  });
  util.addEvent(flex.div, 'ondragover', function(e) {
    e.preventDefault();
    return false;
  });
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

  var num = state.fruit_slots;
  var x;

  ////////

  titleFlex = new Flex(scrollFlex, 0.01, [0, y + s/3], 0.85, [0, y + s], 0.5);
  y += s;
  var active_fruit_name = '<font color="red">none</font>';
  var f_active = getActiveFruit();
  if(f_active) active_fruit_name = f_active.toString() + ': ' + f_active.abilitiesToString(true, true);
  titleFlex.div.innerHTML = 'active fruit: ' + active_fruit_name;
  help = 'The chosen active fruit. Active fruit requires a fruit in storage, and the arrow above it lit. You can choose it using the arrow buttons below.';
  registerTooltip(titleFlex.div, help);


  titleFlex = new Flex(scrollFlex, 0.01, [0, y + s/3], 0.33, [0, y + s], 0.66);
  y += s;
  titleFlex.div.innerText = 'stored fruits (' + state.fruit_stored.length + ' / ' + state.fruit_slots + ')';
  help = 'Fruits in storage slots are kept after transcension, unlike those in the sacrificial pool. To get a fruit in here, click a fruit elsewhere and use its dialog to move it to storage.';
  registerTooltip(titleFlex.div, help);


  x = 0;
  for(var i = 0; i < num; i++) {
    var canvasFlex = new Flex(scrollFlex, [0.01, x], [0, y], [0.01, x + s], [0, y + s]);
    x += s;
    //canvasFlex.div.style.border = '1px solid black';
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    var image = i == state.fruit_active ? image_fruitsel_active : image_fruitsel_inactive;
    renderImage(image, canvas);

    styleButton0(canvasFlex.div, true);
    var fruit_name = 'none';
    if(state.fruit_stored[i]) fruit_name = state.fruit_stored[i].toString();
    addButtonAction(canvasFlex.div, bind(function(i) {
      state.fruit_active = i;
      updateFruitUI();
    }, i), 'activate stored fruit ' + i + ': ' + fruit_name);
  }
  y += s * 1.1;

  ////////

  styleButton0(titleFlex.div);
  addButtonAction(titleFlex.div, showStorageFruitSourceDialog);

  x = 0;
  for(var i = 0; i < num; i++) {
    var canvasFlex = new Flex(scrollFlex, [0.01, x], [0, y], [0.01, x + s], [0, y + s]);
    x += s;
    canvasFlex.div.style.border = '1px solid black';
    var f = i < state.fruit_stored.length ? state.fruit_stored[i] : undefined;
    if(f) {
      makeFruitChip(canvasFlex, f, 0);
    } else {
      canvasFlex.div.style.backgroundColor = '#ccc';
      registerTooltip(canvasFlex.div, 'No stored fruit present in this slot. ' + help);

      addButtonAction(canvasFlex.div, bind(function(help) {
        lastTouchedFruit = null;
        updateFruitUI();
        showMessage('No stored fruit present in this slot. ' + help, C_INVALID, 0, 0);
      }, help), 'empty storage fruit slot');
    }
    setupFruitDrag(canvasFlex, i, f);
  }
  y += s;

  ////////

  titleFlex = new Flex(scrollFlex, 0.01, [0, y + s/3], 0.33, [0, y + s], 0.66);
  y += s;
  titleFlex.div.innerText = 'sacrificial fruit pool (' + state.fruit_sacr.length + ' / ∞)';
  help = 'Fruits in here will be turned into fruit essence on the next transcension. To get a fruit in here, click a fruit elsewhere and use its dialog to move it to the sacrificial pool.';
  registerTooltip(titleFlex.div, help);

  var num = Math.max(6, state.fruit_sacr.length + 2);
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
      makeFruitChip(canvasFlex, f, 1);
    } else {
      var j = Math.min(i, i - state.fruit_sacr.length + 4);
      if(j == 0) {
        canvasFlex.div.style.border = '1px solid #000';
        canvasFlex.div.style.backgroundColor = '#ccc';
      } else if(j == 1) {
        canvasFlex.div.style.border = '1px solid #0008';
        canvasFlex.div.style.backgroundColor = '#ccc8';
      } else if(j == 2) {
        canvasFlex.div.style.border = '1px solid #0004';
        canvasFlex.div.style.backgroundColor = '#ccc6';
      } else if(j == 3) {
        canvasFlex.div.style.border = '1px solid #0002';
        canvasFlex.div.style.backgroundColor = '#ccc4';
      } else if(j == 4) {
        canvasFlex.div.style.border = '1px solid #0002';
        canvasFlex.div.style.backgroundColor = '#ccc2';
      } else if(j == 5) {
        canvasFlex.div.style.border = '1px solid #0002';
        canvasFlex.div.style.backgroundColor = '#ccc1';
      }

      registerTooltip(canvasFlex.div, 'No fruit present in this sacrificial pool slot. ' + help);

      addButtonAction(canvasFlex.div, bind(function(help) {
        lastTouchedFruit = null;
        updateFruitUI();
        showMessage('No fruit present in this sacrificial pool slot. ' + help, C_INVALID, 0, 0);
      }, help), 'empty sacrificial fruit slot');
    }
    setupFruitDrag(canvasFlex, i + 100, f);
  }
  y += s;

  ////////

  fruitScrollFlex.div.scrollTop = scrollPos;

}

