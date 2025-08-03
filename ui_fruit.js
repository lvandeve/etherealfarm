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

var fruitScrollFlex = undefined;

var busyChoosingTargetSlot = undefined; // for "move to slot" button
var busyChoosingTargetSlot_shift = false;

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
      case FRUIT_BRASSICA: return 'BC';
      case FRUIT_NETTLEBOOST: return 'NB';
      // S from "season", the actual season is known due to the fruit's name which includes the season in it
      case FRUIT_SPRING: return getSeason() == 0 ? 'S' : 's';
      case FRUIT_SUMMER: return getSeason() == 1 ? 'S' : 's';
      case FRUIT_AUTUMN: return getSeason() == 2 ? 'S' : 's';
      case FRUIT_WINTER: return getSeason() == 3 ? 'S' : 's';
      case FRUIT_SPRING_SUMMER: return ((getSeason() == 0 || getSeason() == 1) && haveFruitMix(1)) ? 'S' : 's';
      case FRUIT_SUMMER_AUTUMN: return ((getSeason() == 1 || getSeason() == 2) && haveFruitMix(1)) ? 'S' : 's';
      case FRUIT_AUTUMN_WINTER: return ((getSeason() == 2 || getSeason() == 3) && haveFruitMix(1)) ? 'S' : 's';
      case FRUIT_WINTER_SPRING: return ((getSeason() == 3 || getSeason() == 0) && haveFruitMix(1)) ? 'S' : 's';
      case FRUIT_ALL_SEASON: return haveFruitMix(2) ? 'S' : 's';
      case FRUIT_ALL_SEASON2: return haveFruitMix(3) ? 'S' : 's';
      case FRUIT_RESINBOOST: return 'RS';
      case FRUIT_TWIGSBOOST: return 'TW';
      case FRUIT_RESIN_TWIGS: return 'RT';
      case FRUIT_NUTBOOST: return 'NU';
      case FRUIT_BEEBOOST: return 'BE';
      case FRUIT_MIX: return 'X';
      case FRUIT_TREELEVEL: return 'T';
      case FRUIT_SEED_OVERLOAD: return 'O';
      case FRUIT_SPORES_OVERLOAD: return 'MO'; // mo = mushroom overload
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
    case FRUIT_BRASSICA: return 'brassica copying';
    case FRUIT_NETTLEBOOST: return 'nettle boost';
    case FRUIT_SPRING: return 'spring boost';
    case FRUIT_SUMMER: return 'summer boost';
    case FRUIT_AUTUMN: return 'autumn boost';
    case FRUIT_WINTER: return 'winter boost';
    case FRUIT_SPRING_SUMMER: return 'spring and summer boost';
    case FRUIT_SUMMER_AUTUMN: return 'summer and autumn boost';
    case FRUIT_AUTUMN_WINTER: return 'autumn and winter boost';
    case FRUIT_WINTER_SPRING: return 'winter and spring boost';
    case FRUIT_ALL_SEASON: return '4-seasons boost';
    case FRUIT_ALL_SEASON2: return 'ultra seasons boost';
    case FRUIT_RESINBOOST: return 'resin boost';
    case FRUIT_TWIGSBOOST: return 'twigs boost';
    case FRUIT_RESIN_TWIGS: return 'resin and twigs boost';
    case FRUIT_NUTBOOST: return 'nuts boost';
    case FRUIT_BEEBOOST: return 'bee boost';
    case FRUIT_MIX: return 'mix nettle/brass/bee';
    case FRUIT_TREELEVEL: return 'treelevel prod boost';
    case FRUIT_SEED_OVERLOAD: return 'seeds overload';
    case FRUIT_SPORES_OVERLOAD: return 'spores overload';
  }
  return 'unknown';
}

function getFruitAbilityDescription(ability) {
  switch(ability) {
    case FRUIT_NONE: return 'none, fuse fruits to fill this slot';
    case FRUIT_BERRYBOOST: return 'boosts berry production';
    case FRUIT_MUSHBOOST: return 'boosts mushroom production but also consumption';
    case FRUIT_MUSHEFF: return 'reduces mushroom consumption (with a soft cap)';
    case FRUIT_FLOWERBOOST: return 'boosts flowers effect';
    case FRUIT_GROWSPEED: return 'reduces crop grow time (Before any other reductions. A soft cap applies.)';
    case FRUIT_WEATHER: return 'increases the weather effect abilities';
    case FRUIT_BRASSICA: return 'increases the copy effect of brassica (such as watercress)';
    case FRUIT_NETTLEBOOST: return 'boosts the nettle effect';
    case FRUIT_SPRING: return 'boosts the spring flower boost, only during the spring season';
    case FRUIT_SUMMER: return 'boosts the summer berry boost, only during the summer season';
    case FRUIT_AUTUMN: return 'boosts the autumn mushroom boost, only during the autumn season';
    case FRUIT_WINTER: return 'boosts the winter tree warmth effect, only during the winter season';
    case FRUIT_SPRING_SUMMER: return 'boosts the spring flower boost and the summer berry boost, only during the respective seasons';
    case FRUIT_SUMMER_AUTUMN: return 'boosts the summer berry boost and the autumn mushroom boost, only during the respective seasons';
    case FRUIT_AUTUMN_WINTER: return 'boosts the autumn mushroom boost and the winter tree warmth effect, only during the respective seasons';
    case FRUIT_WINTER_SPRING: return 'boosts the winter tree warmth effect and the spring flower boost, only during the respective seasons';
    case FRUIT_ALL_SEASON: return 'boosts the special effect of each of the 4 seasons, when the applicable season is active: flower boost in spring, berry boost in summer, mushroom boost in autumn, tree warmth boost in winter';
    case FRUIT_ALL_SEASON2: return 'boosts the special effect of each of the 4 seasons, even more for dragon fruit, when the applicable season is active: flower boost in spring, berry boost in summer, mushroom boost in autumn, tree warmth boost in winter';
    // "taking into account the time this fruit was active" now means: it takes into account how many spores were produced while any fruit with resin boost (respectively twigs boost) was active, vs while other fruits were active. The more spores produced while such fruit active, the more of the boost is given.
    case FRUIT_RESINBOOST: return 'boost resin income (with a soft cap), based on spores produced while this fruit was active. In addition slightly boosts the unspent resin production bonus.';
    case FRUIT_TWIGSBOOST: return 'boost twigs income (with a soft cap), based on spores produced while this this fruit was active. In addition slightly boosts the unspent twigs production bonus.';
    case FRUIT_RESIN_TWIGS: return 'boost resin and twigs income (with a soft cap), based on spores produced while this this fruit was active. In addition slightly boosts the unspent resin and twigs production bonus.';
    case FRUIT_NUTBOOST: return 'boosts nuts production (with a soft cap)';
    case FRUIT_BEEBOOST: return 'boosts the beehive bonus';
    case FRUIT_MIX: return 'divides given boost over nettle, brassica and bee, balanced differently for spores and seeds, but only additively if corresponding non-mix abilities are present';
    case FRUIT_TREELEVEL: return 'boosts the production boost that is given by the tree level, the shown target multiplier is reached when reaching tree level where next fruit tier could drop.'; // that is, targeted to get close at tree levels 20 levels above where this tier of fruit drops
    case FRUIT_SEED_OVERLOAD: return 'boosts seeds, but increases mushroom seed consumption by the same amount';
    case FRUIT_SPORES_OVERLOAD: return 'boosts spores, but the additional spores require much higher seeds consumption';
  }
  return 'unknown';
}

var lastTouchedFruit = null; // for some visual indication only
var lastTouchedFruit2 = null; // similar but only used in fruit fusing dialog

function createFruitHelp(opt_fusing_only) {
  var dialog = createDialog({title:'Fruit help', scrollable:true});

  var text = '';

  if(!opt_fusing_only) {
    text += 'Fruits drop when the tree reaches certain levels. Fruits have one or more abilities from a random set. At higher tree levels, higher tier fruits with more and stronger abilities can drop.';
    text += '<br/><br/>';
    text += 'You can move fruits between the stored and sacrificial slots with the buttons in the fruit dialog. You can choose the active fruit with the arrows. You can only have one active fruit and only the abilities of the active fruit have an effect. You can switch the active fruit at any time. You can also select no fruit at all by toggling the arrow above an active one.';
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
    text += 'You can rename fruits with the rename button. Named fruits will also have their name show up in the fruit tab when active. You can also mark fruits as favorite: click the fruit logo in the fruit dialog to alter border color (visual effect only).';
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
    text += '<br/><br/>';
  }
  text += '<b>Fusing Fruits</b>';
  text += '<br/><br/>';
  text += 'Fruits of the same tier (bronze and up) can be fused together to allow transferring abilities to create the fruit with the combination you want, when the random drops aren\'t giving it. Fusing does not increase strength of stats, it\'s only about allowing control of the combination.';
  text += '<br/><br/>';
  text += 'Fusing fruits destroys the two original fruits and creates a new one with a new set of abilities. The rules are as follows:';
  text += '<br/>';
  text += ' • The two input fruits, called the "from" and the "into" fruits, create one new fruit the "result" fruit';
  text += '<br/>';
  text += ' • The result fruit will initially have the same abilities as the "into" fruit, but some may be pushed out if transferring occurs';
  text += '<br/>';
  text += ' • Any abilities in the "from" fruit that match the "into" fruit, will charge up the matching ability: it becomes charged (marked [*]), or transferable (marked [**]) if already charged';
  text += '<br/>';
  text += ' • Any abilities in the "from" fruit that are transferable [**] will be transferred to the result fruit and push out the last ability of the result fruit. The fuse dialog also gives the option to disable some of them from being transferred, if they are undesired.';
  text += '<br/>';
  text += ' • Any other abilities of the "from" fruit disappear and don\'t matter, the only abilities of the "from" fruit that matter are: abilities that match the "into" fruit (to charge them up), and transferable abilities (to replace abilities).';
  text += '<br/>';
  text += ' • The order of abilities of the input fruits matters (to determine which get pushed out), but you can freely reorder abilities: either in the regular fruit dialog (where abilities can be moved up or down), or using the priority checkboxes in the fuse dialog.';
  text += '<br/>';
  text += ' • The seasonal abilities of some fruit types (pineapple, ...) do not participate in fusing. The resulting fruit will be an apple if the two original fruits are of a different type, or will be seasonal if both original fruits are the same seasonal type (e.g. both pineapple). Some later upgrades in the game change this.';
  text += '<br/>';
  text += ' • After fusing, abilities will be auto-leveled up (using the usual amount of fruit essence), based on what levels they had before, and leaving some essence unused if a new unupgraded ability is added. You may need to do a few more upgrades manually again anyway. No essence is lost in this process.';
  text += '<br/><br/>';
  text += 'Summary of the rules: getting 3 fruits with the same ability allows, with at least two fuse actions, to create a transferable ability that you can transfer to any fruit of choice with a third fuse action, replacing an unwanted ability of choice.';
  text += '<br/>';
  text += 'Example: if you desire a silver fruit with flower boost and berry boost, one way you could reach it is:'
  text += '<br/>';
  text += ' • collect 3 silver fruits that have flower boost in any slot, fruits A, B and C';
  text += '<br/>';
  text += ' • fuse A with B, resulting in a fruit AB with charged flower boost, marked [*]';
  text += '<br/>';
  text += ' • fuse AB with C, resulting in a fruit ABC with transferable flower boost, marked [**]';
  text += '<br/>';
  text += ' • collect a fruit D that has berry boost, and if necessary, move berry boost to the first slot';
  text += '<br/>';
  text += ' • fuse ABC into D, resulting in the desired fruit with flower boost and berry boost. Don\'t forget to level up its abilities, since they\'ll all be set to level 1.';
  if(haveFruitMix(1)) {
    text += '<br/><br/>';
    text += '<b>Seasonal fruit mixing</b>';
    text += '<br/><br/>';
    text += 'You unlocked the squirrel upgrade for seasonal fruit mixing! This works when fuxing certain combinations of two different seasonal fruits together.';
    text += '<br/><br/>';
    text += 'The combinations are:';
    text += '<br><br>';
    text += '• Apricot + Pineapple = Mango (spring + summer)';
    text += '<br>';
    text += '• Pineapple + Pear = Plum (summer + autumn)';
    text += '<br>';
    text += '• Pear + Medlar = Quince (autumn + winter)';
    text += '<br>';
    text += '• Medlar + Apricot = Kumquat (winter + spring)';
    text += '<br/><br/>';
    text += 'If you also have the second fruit mixing upgrade purchased, then in addition you can create the all-season star fruit. This one is harder to fuse, since the fruits must also have the same set of abilities:';
    text += '<br><br>';
    text += '• Mango + Quince = Star Fruit (4 seasons)';
    text += '<br>';
    text += '• Plum + Kumquat = Star Fruit (4 seasons)';
    text += '<br/><br/>';
    text += 'If you also have the third fruit mixing upgrade purchased, then in addition you can create the dragon fruit. It\'s like the star fruit, but gives more season bonus. It\'s created by fusing star fruit and apple, and they must have the same set of abilities again.';
    text += '<br><br>';
    text += '• Star Fruit + Apple = Dragon Fruit (stronger 4 seasons boost)';
    text += '<br><br>';
    text += '<br/>';
  }
  dialog.content.div.innerHTML = text;
}

function createFruitFuseDialog(f, parentdialogrecreatefun) {
  var oldLastTouchedFruit = lastTouchedFruit;
  lastTouchedFruit = null;
  lastTouchedFruit2 = null;
  busyChoosingTargetSlot = undefined; // just in case this was somehow still active

  var selected = undefined;

  var swapped = false;

  var transfer_choices = [];
  var keep_choices = [];

  var dialog = createDialog({undefined,
    functions:function() {
      if(selected) {
        if(swapped) {
          addAction({type:ACTION_FRUIT_FUSE, a:selected, b:f, transfer_choices:transfer_choices, keep_choices:keep_choices});
        } else {
          addAction({type:ACTION_FRUIT_FUSE, a:f, b:selected, transfer_choices:transfer_choices, keep_choices:keep_choices});
        }
      }
      update();
      if(parentdialogrecreatefun) parentdialogrecreatefun(lastTouchedFruit);
    },
    names:'fuse',
    scrollable_canchange:true,
    title:'Fuse fruits',
    help:bind(createFruitHelp, true),
    onclose:function() {
      lastTouchedFruit = oldLastTouchedFruit;
      lastTouchedFruit2 = null;
    }
  });

  var n = getNumFruitAbilities(f.tier); // abilities excluding the fixed seasonal one


  var resetChoices = function() {
    for(var i = 0; i < n; i++) {
      transfer_choices[i] = true;
      keep_choices[i] = false;
    }
  };
  resetChoices();


  var make = function() {
    var scrollFlex = dialog.content;
    var scrollPos = scrollFlex.div.scrollTop;
    scrollFlex.clear();

    var fruits = [];
    var fruits_index_sacr = -1; // index in fruits array where the fruits come from sacrificial pool rather than storage pool, or -1 if there's no switch (either all or stored or all are sacr)
    for(var i = 0; i < state.fruit_stored.length + state.fruit_sacr.length; i++) {
      var f2 = (i < state.fruit_stored.length) ? state.fruit_stored[i] : (state.fruit_sacr[i - state.fruit_stored.length]);
      if(f2 == f) continue;
      if(f2.tier != f.tier) continue;
      //if(f2.type != f.type) continue;
      if(fruits_index_sacr == -1 && f2.slot >= 100) fruits_index_sacr = fruits.length;
      fruits.push(f2);
    }
    if(fruits_index_sacr == 0) fruits_index_sacr = -1;

    var s = 0.1; // relative width and height of a chip
    var x = 0;
    var y = 0.03;

    var addTitle = function(text, opt_x, opt_y) {
      var y2 = opt_y || y;
      var x2 = opt_x || 0;
      var flex = new Flex(scrollFlex, [0.01, 0, x2], [0, 0, y2], 1, [0, 0, y2 + s]);
      flex.div.innerText = text;
      if(opt_y == undefined) y += s * 0.5;
    };

    addTitle('Fusing exists to gradually choose a set of abilities from the random drops, it doesn\'t make fruits stronger. Only abilities marked [**] can be transferred to other fruits. The [*] then [**] marks can be created by fusing the same abilities. No fruit essence is lost from fusing.');
    y += s;

    y += s * 0.5;
    addTitle('Choose other fruit to fuse:');

    for(var i = 0; i < fruits.length; i++) {
      //if(i == fruits_index_sacr) x += s; // a horizontal gap to indicate we switch to the sacrificial fruits
      if(i != 0 && i == fruits_index_sacr) {
        x = 0;
        y += s;
        y += s * 0.1;
        addTitle('Sacrificial:');
        y -= s * 0.1;
      }
      if(x > s * 9.5) {
        x = 0;
        y += s;
        //if(i == fruits_index_sacr) y += s * 0.1; // a vertical gap to indicate we switch to the sacrificial fruits
      }
      var flex = new Flex(scrollFlex, [0.01, 0, x], [0, 0, y], [0.01, 0, x + s], [0, 0, y + s]);
      x += s;
      var f2 = fruits[i]
      makeFruitChip(flex, f2, 0, undefined, true, undefined, true);

      styleButton0(flex.div);
      addButtonAction(flex.div, bind(function(f) {
        selected = f;
        lastTouchedFruit2 = f;
        resetChoices();
        make();
      }, f2), 'select ' + getFruitAriaLabel(f2));
    }
    if(fruits.length == 0) {
      var flex = new Flex(scrollFlex, 0.01, [0, 0, y], 0.9, [0, 0, y + s]);
      flex.div.innerText = '[ No fruit to fuse, must have at least 1 other fruit of the same tier ]';
    }
    y += s;


    y += s * 0.5;
    var y0t = y; // temporary y position for result title
    addTitle('From:');
    addTitle('Into:', 0.2, y0t);

    var fruits2 = [f, selected];

    var y0c = y; // temporary y position for result chip
    x = 0;
    for(var i = 0; i < 3; i++) {
      var flex = new Flex(scrollFlex, [0.01, 0, x], [0, 0, y], [0.01, 0, x + s], [0, 0, y + s]);
      x += s;
      var f2 = f;
      if(swapped != (i == 0)) f2 = selected;
      if(i == 1) {
        var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
        renderImage(image_swap, canvas);
        styleButton0(flex.div, true);
        addButtonAction(flex.div, bind(function(f, e) {
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
        }, f), 'swap fuse order');
        registerTooltip(flex.div, 'Swap the fuse order of the two input fruits');
      } else {
        if(f2) {
          var text = (i == 0) ? 'First selected fuse fruit: the "from" fruit' : 'Second selected fuse fruit: the "into" fruit';
          makeFruitChip(flex, f2, 0, undefined, true, text, true);
        } else {
          flex.div.style.backgroundColor = '#ccc';
          flex.div.style.border = '1px solid black';
          registerTooltip(flex.div, 'Empty fuse fruit slot, select a fruit above to fuse');
        }
        styleButton0(flex.div);
        var fruitname = (i == 0) ? 'From fruit' : 'Into fruit';
        addButtonAction(flex.div, bind(function(f, i) {
          if(f) {
            createFruitInfoDialog(f, fruitname + ' stats');
          } else {
            showMessage(fruitname + ' empty, select one from the list above first', C_INVALID);
          }
        }, f2, i), fruitname + ': see stats' + (f2 ? ('. ' + getFruitAriaLabel(f2)) : '. Empty.'));
      }
    }
    y += s;

    var result_x = 0.4;

    addTitle('Fused result:', result_x, y0t);
    y += s * 0.5;
    addTitle('Result stats:');

    var fruitmix = 0;
    // due to gated squirrel upgrades, it's always ensured if you have a next one, you also have the previous one
    if(haveFruitMix(1)) fruitmix = 2;
    if(haveFruitMix(2)) fruitmix = 4;
    if(haveFruitMix(3)) fruitmix = 5;

    var message = [undefined];
    var intofruit = swapped ? selected : f;
    var fromfruit = swapped ? f : selected;
    var fuse = fuseFruit(intofruit, fromfruit, fruitmix, transfer_choices, keep_choices, message);

    x = 0;
    var flex = new Flex(scrollFlex, [0.01, 0, x + result_x], [0, 0, y0c], [0.01, 0, x + s + result_x], [0, 0, y0c + s]);
    x += s;
    if(fuse) {
      makeFruitChip(flex, fuse, 0, undefined, true, 'fused fruit result', true);
      styleButton0(flex.div);
      addButtonAction(flex.div, bind(function(f) {
        createFruitInfoDialog(f, 'Fuse result fruit stats');
      }, fuse), 'Fused result: see stats' + (f2 ? ('. ' + getFruitAriaLabel(f2)) : ''));
    } else {
      flex.div.style.backgroundColor = '#ccc';
      flex.div.style.border = '1px solid black';
      registerTooltip(flex.div, 'Fused fruit appears here when successful');
      addButtonAction(flex.div, bind(function(f) {
        showMessage(fruitname + ' empty, select one from the list above first', C_INVALID);
      }, fuse), 'Fused result: see stats. Empty');
    }
    //y += s;

    if(message[0]) {
      y += s * 0.25;
      x = 0;
      var flex = new Flex(scrollFlex, [0.01, 0, 0], [0, 0, y], [0.99, 0, 0], [0, 0, y + s]);
      x += s;
      flex.div.innerHTML = message[0] + '<br><br><br><br>&nbsp;'; // the br are to maintain scroll position if you were scrolled down in a fuse with more text
      flex.div.style.color = message[1] ? '#f00' : '#0a0' ;
      y += s * 1.1;
    }

    if(fuse) {
      var h = s * 0.35;
      var fuseFlex = new Flex(scrollFlex, [0.01, 0, 0], [0, 0, y], 1, [0, 0, y + 1]);
      for(var i = -1; i < fuse.abilities.length; i++) {
        var flex = new Flex(fuseFlex, 0, 'a', 1, 'a');
        flex.div.style.marginBottom = '1.4em';
        if(i == -1) {
          flex.div.innerText = upper(fuse.toString()) + ', fused ' + fuse.fuses + ' times';
        } else {
          var text = '';
          var other = swapped ? selected : f;
          var highlight = false;
          if(i < other.abilities.length && other.abilities[i] == fuse.abilities[i] && fuse.charge[i] > other.charge[i]) highlight = true;
          text += 'ability: ' + fuse.abilityToString(i, false, false, highlight);
          if(i < other.abilities.length) {
            text += '  (was: ' + other.abilityToString(i) + ')';
          } else {
            text += '  (was: none)';
          }
          flex.div.innerHTML = text;
        }
      }

      var num_transfer = 0;
      for(var i = 0; i < fromfruit.abilities.length; i++) {
        if(fromfruit.charge[i] == 2) {
          num_transfer++;
        }
      }

      if(num_transfer == 0) {
        y += h;
        //addTitle('When the "from" fruit has two-star [**] abilities, you can transfer them to the "to" fruit. To get [**] abilities, fuse two fruits with the same ability to get [*], then one more fuse to get [**].');
        new Flex(flex, 0, 'a', 1, 'a').div.innerText = '\nWhen the "from" fruit has two-star [**] abilities, you can transfer them to the "to" fruit. To get [**] abilities, fuse two fruits with the same ability to get [*], then one more fuse to get [**].\n\n';
      } else {
        y += h;
        //addTitle('Two-star [**] abilities below are transferred from the "from" fruit into the "to" fruit. Optionally you can use the checkboxes below to prevent some abilities from transferring, or to prioritize which original abilities get kept and pushed out:');
        new Flex(flex, 0, 'a', 1, 'a').div.innerText = '\nTwo-star [**] abilities below are transferred from the "from" fruit into the "to" fruit. Optionally you can use the checkboxes below to prevent some abilities from transferring, or to prioritize which original abilities get kept and pushed out:\n\n';
        y += h * 5;

        var ability_type_seen = [];

        for(var i = 0; i < fromfruit.abilities.length; i++) {
          if(fromfruit.charge[i] == 2) {
            //var flex = new Flex(scrollFlex, [0.01, 0, 0], [0, 0, y], 1, [0, 0, y + h]);
            var flex = new Flex(fuseFlex, 0, 'a', 1, [0, 0, h]);
            flex.div.style.marginBottom = '0.1em';
            var text = '';
            var flex0 = new Flex(flex, 0, 0, [0, 1], 1);
            var flex1 = new Flex(flex, [0, 1.2], 0, 1, 1);
            var canvas = createCanvas('0%', '0%', '100%', '100%', flex0.div);
            renderImage(transfer_choices[i] ? image_checkbox_on : image_checkbox_off, canvas);

            ability_type_seen[fromfruit.abilities[i]] = true;

            styleButton0(flex0.div);
            addButtonAction(flex0.div, bind(function(i) {
              transfer_choices[i] = !transfer_choices[i];
              make();
            }, i), 'Checkbox to transfer ' + fromfruit.abilityToString(i) + ': ' + (transfer_choices[i] ? 'checked' : 'unchecked'));

            text += fromfruit.abilityToString(i);
            text += '\n';
            flex1.div.innerText = text;
            y += h * 1.2;
          }
        }


        // Commented out: internally this works as 2 groups of checkboxes (transfer_choices and keep_choices), but there's no reason to show it as two separate lists in the UI, it can be seen as just a single list of abilities to choose prioritized ones from
        //y += h;
        //addTitle('Original abilities from the "into" fruit. Optionally, using the checkboxes, you can prioritize some abilities, to affect which ones get kept or get pushed out by the transferred abilities:');
        //y += h * 2;

        for(var i = 0; i < n; i++) {
          if(ability_type_seen[intofruit.abilities[i]]) continue;
          //var flex = new Flex(scrollFlex, [0.01, 0, 0], [0, 0, y], 1, [0, 0, y + h]);
          var flex = new Flex(fuseFlex, 0, 'a', 1, [0, 0, h]);
            flex.div.style.marginBottom = '0.1em';
          //flex.div.style.border = '1px solid red';
          var text = '';
          var flex0 = new Flex(flex, 0, 0, [0, 1], 1);
          var flex1 = new Flex(flex, [0, 1.2], 0, 1, 1);
          var canvas = createCanvas('0%', '0%', '100%', '100%', flex0.div);
          renderImage(keep_choices[i] ? image_checkbox_on : image_checkbox_off, canvas);

          styleButton0(flex0.div);
          addButtonAction(flex0.div, bind(function(i) {
            keep_choices[i] = !keep_choices[i];
            make();
          }, i), 'Checkbox to prioritize ' + intofruit.abilityToString(i) + ': ' + (keep_choices[i] ? 'checked' : 'unchecked'));

          text += intofruit.abilityToString(i);
          text += '\n';
          flex1.div.innerText = text;
          y += h * 1.2;
        }
      }
    }

    scrollFlex.div.scrollTop = scrollPos;
  };

  make();
}

function showFruitMarkColorDialog(f, opt_onclose) {
  //var fruitmarkcolors = ['#000', '#f00', '#dc0', '#4c4', '#66f', '#fff', '#f80', '#840', '#b0f'];
  //var fruitmarkcolornames = ['none', 'red', 'yellow', 'green', 'blue', 'white', 'orange', 'brown', 'purple'];
  var dialog = createDialog({
    onclose:opt_onclose,
    title:'Mark fruit border color',
    bgstyle:'efDialogTranslucent',
    icon:image_palette
  });

  var num = fruitmarkcolors.length;

  for(var i = 0; i < num; i++) {
    var button = new Flex(dialog.content, 0.25, (i + 0.05) / num , 0.8, (i + 0.75) / num).div;
    styleButton(button);
    button.textEl.innerText = fruitmarkcolornames[i];
    button.style.color = util.farthestColor(fruitmarkcolors[i]);
    button.style.backgroundColor = fruitmarkcolors[i];
    addButtonAction(button, bind(function(i) {
      f.mark = i;
      closeTopDialog();
    }, i));
  }
}

function fillFruitDialog(dialog, f, opt_selected) {
  dialog.content.clear();
  dialog.icon.clear();
  if(lastTouchedFruit != f) {
    lastTouchedFruit = f;
    //updateFruitUI(); // to update lastTouchedFruit style --> commented out: this is slow on mobile browsers, and the dialog's onclose also already redraws fruits (which is of course as slow but at least only twice as often)
  }
  var recreate = function(opt_f) {
    if(opt_f) f = opt_f;
    fillFruitDialog(dialog, f, selected);
  };

  var canvasFlex = new Flex(dialog.icon, 0.05, 0.05, 0.95, 0.95);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(images_fruittypes[f.type][f.tier], canvas);
  styleFruitChip(canvasFlex, f);

  var margin = 0.1;

  var topFlex = new Flex(dialog.content, margin, 0.01, 1 - margin, 0.15);
  var text = upper(f.toString());
  var essence_available = state.res.essence.sub(f.essence);
  text += '<br>';
  text += 'Tier ' + toRomanUpTo(f.tier) + ': ' + tierNames[f.tier] + ', type: ' + f.typeName();
  text += '<br><br>';
  text += 'Fruit essence available: ' + essence_available.toString() + ' of ' + state.res.essence.toString() + ', ' + f.essence.toString() + ' used.';
  text += '<br>';
  if(essence_available.ltr(0)) {
    text += 'Note: negative essence: re-earn it to upgrade abilities further.';
    text += '<br>';
  }
  text += 'Get on sacrifice: ' + getFruitSacrifice(f).toString();
  if(f.fuses) {
    text += '<br>';
    text += 'Fuses done: ' + f.fuses;
  }
  text += '<br><br>';
  text += 'Click ability to view or level up: ';
  topFlex.div.innerHTML = text;

  var selected = (opt_selected == undefined) ? -1  : opt_selected; // the selected ability for details and upgrade button
  var flexes = [];

  var y = 0.26;
  var h = 0.05;
  for(var i = 0; i < f.abilities.length; i++) {
    var flex = new Flex(dialog.content, margin, y, 1 - margin, y + h);
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
  var y0 = y;

  h = 0.05;
  var margin2 = margin * 1.05;
  if(f.slot < 100) {
    var moveButton2 = new Flex(dialog.content, margin2, y, 1 - margin2, y + h).div;
    y += h * 1.1;
    styleButton(moveButton2);
    moveButton2.textEl.innerText = 'to sacrificial pool';
    addButtonAction(moveButton2, function() {
      addAction({type:ACTION_FRUIT_SLOT, f:f, slottype:1});
      update();
      //recreate();
      closeAllDialogs();
    });
  } else {
    var moveButton1 = new Flex(dialog.content, margin2, y, 1 - margin2, y + h).div;
    y += h * 1.1;
    styleButton(moveButton1);
    moveButton1.textEl.innerText = 'to storage slot';
    if(state.fruit_stored.length >= state.fruit_slots) moveButton1.className = 'efButtonCantAfford';
    addButtonAction(moveButton1, function() {
      addAction({type:ACTION_FRUIT_SLOT, f:f, slottype:0});
      update();
      //recreate();
      closeAllDialogs();
    });
  }

  var moveToButton = new Flex(dialog.content, margin2, y, 1 - margin2, y + h).div;
  y += h * 1.1;
  styleButton(moveToButton);
  moveToButton.textEl.innerText = 'move to slot (click target...)';
  registerAction(moveToButton, function(shift, ctrl) {
      showMessage('Click target slot to move this fruit into');
      busyChoosingTargetSlot = f;
      busyChoosingTargetSlot_shift = shift;
      closeAllDialogs();
    }, 'move fruit to slot (click target...)', {
    label_shift:'swap fruit with slot (click target...)',
    tooltip:'after clicking this button, click any fruit slot in the fruit tab to move this fruit to',
  });

  if(f.slot < 100) {
    var moveButton3 = new Flex(dialog.content, margin2, y, 1 - margin2, y + h).div;
    y += h * 1.1;
    styleButton(moveButton3);
    moveButton3.textEl.innerText = 'make active';
    if(f.slot == state.fruit_active) moveButton3.className = 'efButtonCantAfford';
    addButtonAction(moveButton3, function() {
      if(f.slot >= MAXFRUITARROWS) {
        // The UI only allows to make the top 10 (MAXFRUITARROWS) active. So the "make active" button of further ones
        // must move this one to the top row.
        // We could instead not have this button at all, but then the issue is that the only way to make this fruit active is to
        // drag it to a top slot, so if dragging isn't available on the device it couldn't be made active at all.
        // So swap it with the active one, that even allows choosing its destination spot
        swapFruit(f.slot, state.fruit_active);
      }
      state.fruit_active = f.slot;
      updateFruitUI();
      update();
      //recreate();
      closeAllDialogs();
    });
  }

  // can't do fusing on fruits that only have 1 ability
  if(f.tier > 0) {
    var fuseButton = new Flex(dialog.content, margin2, y, 1 - margin2, y + h).div;
    y += h * 1.1;
    styleButton(fuseButton);
    fuseButton.textEl.innerText = 'fuse';
    //if(fruitReachedFuseMax(f)) fuseButton.className = 'efButtonCantAfford';
    addButtonAction(fuseButton, function() {
      createFruitFuseDialog(f, recreate);
    });
  }

  var renameButton = new Flex(dialog.content, margin2, y, 1 - margin2, y + h).div;
  y += h * 1.1;
  styleButton(renameButton);
  renameButton.textEl.innerText = 'rename';
  addButtonAction(renameButton, function() {
    makeTextInput('Rename fruit', 'Enter new fruit name, or empty for default', function(name) {
      f.name = sanitizeName(name);
      updateFruitUI();
      if(dialog_level) recreate();
    }, f.name);
  });

  var markColorButton = new Flex(dialog.content, margin2, y, 1 - margin2, y + h).div;
  y += h * 1.1;
  styleButton(markColorButton);
  markColorButton.textEl.innerText = 'mark border color';
  addButtonAction(markColorButton, function() {
    showFruitMarkColorDialog(f, function() {
      updateFruitUI();
      recreate();
    });
  });

  /*styleButton0(canvas, true);
  addButtonAction(canvas, function() {
    f.mark = ((f.mark || 0) + 1) % 9;
    updateFruitUI();
    recreate();
  }, 'fruit icon: ' + getFruitAriaLabel(f) + '. Click to mark favorite');
  registerTooltip(canvas, 'click to mark as favorite and toggle color style. This is a visual effect only.');*/



  y = y0;
  h = 0.35;
  var bottomflex = new Flex(dialog.content, margin, y, 1 - margin, y + h);
  bottomflex.div.className = 'efFruitAbilityBox';
  bottomflex.div.style.visibility = 'hidden';
  y += h;
  var textFlex = new Flex(bottomflex, 0.01, 0.0, 0.9, 0.5);

  var downButton = new Flex(bottomflex, 0.01, 0.7, 0.15, 0.95).div;
  styleButton(downButton);

  var upButton = new Flex(bottomflex, 0.16, 0.7, 0.3, 0.95).div;
  styleButton(upButton);

  var levelManyButton = new Flex(bottomflex, 0.31, 0.7, 0.645, 0.95).div;
  styleButton(levelManyButton);

  var levelButton = new Flex(bottomflex, 0.655, 0.7, 0.99, 0.95).div;
  styleButton(levelButton);

  var closeButton = new Flex(bottomflex, 0.92, [0, 0.01], 0.99, [0, 0.08]).div;
  renderImage(image_close, createCanvas('0%', '0%', '100%', '100%', closeButton));
  styleButton0(closeButton);

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
      bottomflex.div.style.visibility = 'hidden';
      if(selected < 0) return;
    } else {
      bottomflex.div.style.visibility = '';
    }

    y += h;

    text = upper(getFruitAbilityName(a));
    if(!isInherentAbility(a)) text += ' ' + toRomanUpTo(level);
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
      var cost = getFruitAbilityCost(a, level, f.tier);
      text += 'Current level: ' + getFruitBoost(a, level, f.tier).toPercentString();
      if(a == FRUIT_TREELEVEL) text += ' (target: ' + getFruitBoost(a, level, f.tier, undefined, 1).toPercentString() + ')';
      text += '<br>';
      text += 'Next level: ' + getFruitBoost(a, level + 1, f.tier).toPercentString()
      if(a == FRUIT_TREELEVEL) text += ' (target: ' + getFruitBoost(a, level + 1, f.tier, undefined, 1).toPercentString() + ')';
      text += ', cost: ' + cost.toString();

      levelButton.textEl.innerText = 'Buy 1';
      var available = state.res.essence.sub(f.essence);
      if(available.lt(cost.essence)) {
        levelButton.className = 'efButtonCantAfford';
      } else {
        levelButton.className = 'efButton';
      }
      registerAction(levelButton, function(e) {
        addAction({type:ACTION_FRUIT_LEVEL, f:f, index:selected, shift:false});
        update();
        recreate();
      }, 'Buy 1', {tooltip:('Levels up this ability. Does not permanently use up essence, only for this fruit: all essence can be used in all fruits.')});

      levelManyButton.textEl.innerText = 'Buy many';
      var available = state.res.essence.sub(f.essence);
      if(available.mulr(0.25).lt(cost.essence)) {
        levelManyButton.className = 'efButtonCantAfford';
      } else {
        levelManyButton.className = 'efButton';
      }
      registerAction(levelManyButton, function(e) {
        addAction({type:ACTION_FRUIT_LEVEL, f:f, index:selected, shift:true});
        update();
        recreate();
      }, 'Buy many', {tooltip:('Levels up this ability multiple times, using up to 25% of the available essence. Does not permanently use up essence, only for this fruit: all essence can be used in all fruits.')});


      upButton.textEl.innerText = '^';
      if(selected <= 0) {
        upButton.className = 'efButtonCantAfford';
      } else {
        upButton.className = 'efButton';
      }
      registerAction(upButton, function(e) {
        if(selected <= 0) return;
        addAction({type:ACTION_FRUIT_REORDER, f:f, index:selected, up:true});
        selected--;
        update();
        recreate();
      }, 'Move ability up', {tooltip:('Moves up this ability in the order. This has no effect on ability strength, but can affect fusing of fruits')});


      downButton.textEl.innerText = 'v';
      if(selected + 1 >= getNumFruitAbilities(f.tier)) {
        downButton.className = 'efButtonCantAfford';
      } else {
        downButton.className = 'efButton';
      }
      registerAction(downButton, function(e) {
        if(selected + 1 >= getNumFruitAbilities(f.tier)) return;
        addAction({type:ACTION_FRUIT_REORDER, f:f, index:selected, up:false});
        selected++;
        update();
        recreate();
      }, 'Move ability down', {tooltip:('Moves down this ability in the order. This has no effect on ability strength, but can affect fusing of fruits')});

      registerAction(closeButton, function(e) {
        selected = -1;
        recreate();
      }, 'Close fruit ability popup', {tooltip:('Close fruit ability popup')});

    }
    textFlex.div.innerHTML = text;
  };

  updateSelected();
}

function createFruitDialog(f, opt_selected) {
  var dialog = createDialog({
    onclose:function() {
      // onclose function: updates the relevant fruit chip with new upgrade levels. TODO: it's inefficient to redraw all fruit chips for this
      updateFruitUI();
    },
    help:bind(createFruitHelp, false),
    title:'Configure fruit',
    bgstyle:'efDialogTranslucent',
    /*functions:[''],
    names:['edit'],*/
  });

  fillFruitDialog(dialog, f, opt_selected);
}

function createFruitInfoDialog(f, opt_label) {
  var dialog = createDialog({
    title:(opt_label || 'Fruit info')
  });

  var scrollFlex = dialog.content;

  var y = 0;
  var s = 0.1;

  for(var i = -1; i < f.abilities.length; i++) {
    var flex = new Flex(scrollFlex, [0.01, 0, 0], [0, 0, y], 1, [0, 0, y + s]);
    flex.div.innerText = (i == -1) ? (f.toString() + ', fused ' + f.fuses + ' times') : ('ability: ' + f.abilityToString(i));
    y += s * 0.5;
  }
}

var showing_fruit_dialog = false;

function showStorageFruitSourceDialog() {
  showing_fruit_dialog = true; // for achievement
  var dialog = createDialog({
    title:'Fruit storage slot sources',
    scrollable:true,
    icon:images_apple[3],
    onclose:function() {
      showing_fruit_dialog = false;
    }
  });

  var text = '';

  text += 'You have ' + state.fruit_slots + ' fruit storage slots available. Here\'s where they came from:';
  text += '<br/><br/>';
  text += ' • 3: initial amount';
  text += '<br/>';

  if(state.seen_seasonal_fruit != 0) {
    text += ' • 1: for having seen at least 1 seasonal fruit';
    text += '<br/>';
  }
  if((state.seen_seasonal_fruit & 15) == 15) {
    text += ' • 1: for having seen all 4 types of seasonal fruit';
    text += '<br/>';
  }
  if((state.seen_seasonal_fruit & 240) == 240) {
    text += ' • 1: for having seen all 4 types of 2-seasonal fruit';
    text += '<br/>';
  }
  if((state.seen_seasonal_fruit & 256) == 256) {
    text += ' • 1: for having seen a star fruit';
    text += '<br/>';
  }
  if((state.seen_seasonal_fruit & 512) == 512) {
    text += ' • 1: for having seen a dragon fruit';
    text += '<br/>';
  }

  var num_ethereal_upgrades = 0;
  if(state.upgrades2[upgrade2_extra_fruit_slot].count) num_ethereal_upgrades++;
  if(state.upgrades2[upgrade2_extra_fruit_slot2].count) num_ethereal_upgrades++;
  if(state.upgrades2[upgrade2_extra_fruit_slot3].count) num_ethereal_upgrades++;
  if(state.upgrades2[upgrade2_extra_fruit_slot4].count) num_ethereal_upgrades++;
  if(state.upgrades2[upgrade2_extra_fruit_slot5].count) num_ethereal_upgrades++;
  if(state.upgrades2[upgrade2_extra_fruit_slot6].count) num_ethereal_upgrades++;
  if(state.upgrades2[upgrade2_extra_fruit_slot7].count) num_ethereal_upgrades++;
  if(num_ethereal_upgrades > 0) {
    text += ' • ' + num_ethereal_upgrades + ': ethereal upgrades';
    text += '<br/>';
  }

  if(state.challenges[challenge_rocks].completed) {
    text += ' • ' + (state.challenges[challenge_rocks].completed) + ': for completing the rocks challenge';
    text += '<br/>';
  }

  dialog.content.div.innerHTML = text;
}

function styleFruitChip(flex, f) {
  var ratio = state.res.essence
  flex.div.style.backgroundColor = tierColors_BG[f.tier] + '6';
  // see also array fruitmarkcolornames
  if(f.mark) {
    var color = fruitmarkcolors[f.mark] || '#fff';
    flex.div.style.border = '3px solid ' + color;
  } else if(f.name || (f.fuses && f.type <= 4)) {
    //var color = f.name ? '#999' : '#777';
    var color = '#999';
    flex.div.style.border = '2px solid ' + color;
  } else {
    //flex.div.style.border = '1px solid black';
  }
  if(lastTouchedFruit == f) {
    flex.div.style.boxShadow = '0px 0px 16px #000';
  } else if(lastTouchedFruit2 == f) {
    flex.div.style.boxShadow = '0px 0px 16px #800';
  } else {
    flex.div.style.boxShadow = '';
  }
  flex.div.style.outline = '1px solid black';
}

var fruitmarkcolors = ['#000', '#f00', '#dc0', '#4c4', '#66f', '#fff', '#f80', '#840', '#b0f'];
var fruitmarkcolornames = ['none', 'red', 'yellow', 'green', 'blue', 'white', 'orange', 'brown', 'purple'];

function getFruitAriaLabel(f, opt_fallback_if_empty) {
  if(!f) return opt_fallback_if_empty || 'none';
  //var result = f.toString();
  var result = '';
  if(f.name) result += '"' + f.name + '". ';
  result += f.origName();
  if(f.mark) result += '. Mark: ' + fruitmarkcolornames[f.mark];
  return result;
}

function getFruitTooltipText(f, opt_label) {
  var text = '';
  if(opt_label) text += opt_label + '<br>';

  text += upper(f.toString());

  text += '<br>';
  //text += 'type: ' + f.origName();
  //text += ', tier ' + toRomanUpTo(f.tier);

  text += 'Tier ' + toRomanUpTo(f.tier) + ': ' + tierNames[f.tier] + ', type: ' + f.typeName();

  text += '<br>';
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
  text += '<br>';
  text += 'Fruit essence available: ' + state.res.essence.sub(f.essence).toString() + ' of ' + state.res.essence.toString();
  text += '<br>';
  text += 'Get on sacrifice: ' + getFruitSacrifice(f).toString();

  return text;
}


// opt_slot_index: if given: < 100 for stored fruits, >= for sacrificial fruits
function clickFruitChipFun(f, opt_slot_index, shift, ctrl) {
  if(shift || ctrl) {
    if(f.slot >= 100) {
      // move the fruit upwards
      var full = state.fruit_stored.length >= state.fruit_slots;
      if(!full) {
        addAction({type:ACTION_FRUIT_SLOT, f:f, slottype:0});
        update();
      }
    } else { // move the fruit downwards
      addAction({type:ACTION_FRUIT_SLOT, f:f, slottype:1});
      update();
    }
  } else {
    if(busyChoosingTargetSlot && opt_slot_index != undefined) {
      addAction({type:ACTION_FRUIT_SLOT, f:busyChoosingTargetSlot, precise_slot:opt_slot_index, force_swap:busyChoosingTargetSlot_shift});
      busyChoosingTargetSlot = undefined;
      update();
    } else {
      createFruitDialog(f);
    }
  }
};

// f = the fruit
// slot_type: 0=storage, 1=sacrificial
// opt_slot_index: if given: < 100 for stored fruits, >= for sacrificial fruits
// opt_not_draggable: if true, the fruit chip is not enabled for being draggable and thus can have the long click tooltip
function makeFruitChip(flex, f, slot_type, opt_slot_index, opt_nobuttonaction, opt_label, opt_not_draggable) {
  // these multiple layers are there to support multiple borders, because the colored "mark" border should have itself a small black outline to make it visible against all background colors both of the inner part (fruit bg) and outper part (dark or light UI theme bg)
  // so the colored border has an outer outline, provided by flex (no css border, but flex being 1 pixel larger), and inner outline provided by the css border on canvas (possibly commented out below if not truly needed)
  // note that CSS outline is not used here and would have the wrong size if used since it goes outside the box
  var bg = new Flex(flex, [0,0,0,0,1],[0,0,0,0,1],[1,0,0,0,-1],[1,0,0,0,-1]);
  var fg = new Flex(bg, 0, 0, 1, 1);
  flex.div.style.backgroundColor = '#000';
  bg.div.style.backgroundColor = '#aaa';
  var canvas = createCanvas('0%', '0%', '100%', '100%', fg.div);
  //if(f.mark || f.name || f.fuses) canvas.style.border = '1px solid black';
  renderImage(images_fruittypes[f.type][f.tier], canvas);
  var tooltipfun = bind(getFruitTooltipText, f, opt_label);

  styleFruitChip(fg, f);

  flex.div.style.userSelect = 'none';

  var fun = undefined;
  var label = undefined;
  var label_shift = undefined;

  if(!opt_nobuttonaction) {
    var typename = slot_type == 0 ? 'storage' : 'sacrificial';
    if(opt_slot_index == undefined) {
      label = typename + ' slot: ' + getFruitAriaLabel(f);
    } else {
      var label_index = slot_type == 0 ? opt_slot_index : (opt_slot_index - 100);
      label = typename + ' slot ' + label_index + ': ' + getFruitAriaLabel(f);
    }
    //label_shift = (f.slot >= 100) ? 'move fruit up' : 'move fruit down';
    styleButton0(flex.div);
    fun = bind(clickFruitChipFun, f, opt_slot_index);
  }

  registerAction(flex.div, fun, label, {tooltip:tooltipfun, isdraggable:!opt_not_draggable});
}

var dragslot = -1; // used instead of e.dataTransfer.setData since v0.1.64 because e.dataTransfer.setData still caused firefox to sometimes open things as URL despite e.preventDefault()

function setupFruitDrag(flex, slot, f) {
  if(f) {
    flex.div.draggable = true;
    util.addEvent(flex.div, 'dragstart', function(e) {
      //e.dataTransfer.setData('text/plain', '' + f.slot);
      dragslot = f.slot;
      removeAllTooltips(); // they can get in the way over the drop target
    });
  }
  util.addEvent(flex.div, 'drop', function(e) {
    e.preventDefault(); // prevent firefox from actually trying to do a network request to http://0.0.0.<fruitindex> when trying to access e.dataTransfer
    // TODO: sometimes firefox ends up in a buggy state where dragging breaks (freezes after half a second), and when that happens it STILL does that network request thing. NOTE: possibly using the dragslot variable, and no longer usint dataTransfer, fixes this
    /*if(!e.dataTransfer) return;
    var data = e.dataTransfer.getData('text/plain');
    if(!data) return;
    var origslot = parseInt(data);*/
    var origslot = dragslot;
    dragslot = -1;
    if(!(origslot >= 0 && origslot <= 100 + state.fruit_sacr.length)) return;
    var f = getFruit(origslot);
    if(!f) return;
    addAction({type:ACTION_FRUIT_SLOT, f:f, precise_slot:slot});
    update();
  });
  util.addEvent(flex.div, 'dragenter', function(e) {
    e.preventDefault();
    return false;
  });
  util.addEvent(flex.div, 'dragover', function(e) {
    e.preventDefault();
    return false;
  });
  util.addEvent(flex.div, 'dragend', function(e) {
    e.preventDefault();
    // this assumes ondragend happens before ondrop, which it should. This is also not really necessary to do, but in case there would be other drag and droppable things, this prevents keeping the state from the fruit one around
    dragslot = -1;
    return false;
  });
}

// this is also the max width of the fruit UI itself. Max 10 or 11 fits reasonably, 12 may be a bit too much
var MAXFRUITARROWS = 10;

function getNumFruitArrows() {
  return Math.min(MAXFRUITARROWS, state.fruit_slots);
}

// how many columns of fruits are shown
function getNumFruitsWidth() {
  // this 10 is not using MAXFRUITARROWS because if the MAXFRUITARROWS constant is higher than 10 (which it probably isn't), it's still reasonable to have the fruits be a bit bigger in early game when not yet having over 10 slots.
  return Math.max(10, getNumFruitArrows());
}

// a few extras for the fade-out effect that indicates there's infinite space in the sacrificial pool
function numRenderedSacrFruitSlots() {
  return Math.max(6, state.fruit_sacr.length + 2);
}

function numRenderedSacrFruitRows() {
  return Math.ceil(numRenderedSacrFruitSlots() / getNumFruitsWidth());
}

function updateFruitUI() {
  var scrollPos = 0;
  if(fruitScrollFlex) scrollPos = fruitScrollFlex.div.scrollTop;

  fruitFlex.clear();

  var scrollFlex = new Flex(fruitFlex, 0, 0.01, 0.98, 1);
  makeScrollable(scrollFlex);

  //scrollFlex.div.style.display = 'none';

  //var titleFlex = new Flex(scrollFlex, 0.01, 0.02, 0.95, 0.15);

  //titleFlex.div.innerText = 'Fruit collection';

  var num_fruits_width = getNumFruitsWidth();
  var s = 1 / num_fruits_width; // relative width and height of a chip
  var t = 0.1; // similar to s but for text
  var y = 0;
  var help;

  var num = state.fruit_slots;
  var x;

  ////////

  var titleFlex = new Flex(scrollFlex, 0.01, [0, 0, y + t/3], 0.85, [0, 0, y + t]);
  y += t * 0.8;
  var active_fruit_name = '<font color="red">none</font>';
  if(state.fruit_active == -1) active_fruit_name = '<font color="red">none, click arrow above a fruit to select one</font>';
  var f_active = getActiveFruit();
  if(f_active) active_fruit_name = f_active.toString() + ': ' + f_active.abilitiesToString(true, true);
  //titleFlex.div.innerHTML = 'Fruit collection. Active fruit: ' + active_fruit_name + '. Fruit essence: ' + state.res.essence.toString();
  titleFlex.div.innerHTML = 'Fruit essence: ' + state.res.essence.toString() + '. Active fruit: ' + active_fruit_name;
  help = 'The chosen active fruit. Active fruit requires a fruit in storage, and the arrow above it lit. You can choose it using the arrow buttons below.';
  styleButton0(titleFlex.div);
  registerTooltip(titleFlex.div, help);
  addButtonAction(titleFlex.div, function() {
    showResourceDialog(7);
  });

  titleFlex = new Flex(scrollFlex, 0.01, [0, 0, y + t/3], 0.33, [0, 0, y + t]);
  y += s;
  titleFlex.div.innerText = 'Stored fruits (' + state.fruit_stored.length + ' / ' + state.fruit_slots + ')';
  help = 'Fruits in storage slots are kept after transcension, unlike those in the sacrificial pool. To get a fruit in here, click a fruit elsewhere and use its dialog to move it to storage, or drag and drop it here.';
  registerTooltip(titleFlex.div, help);

  var numarrows = getNumFruitArrows();

  // This fixes cases where the selected fruit is above 10. It's not super great to adjust state automatically from the UI like this, but the 10 arrow limit is pretty much for a UI reason
  if(state.fruit_active > 0 && state.fruit_active >= numarrows) state.fruit_active = numarrows - 1;

  // the ones that are used in auto-actions, so they get an indicator symbol
  var for_automaton = [];
  if(autoActionUnlocked()) {
    for(var i = 0; i < state.automaton_autoactions.length; i++) {
      var o = state.automaton_autoactions[i];
      var effect = o.getEffect();
      if(effect.enable_fruit) for_automaton[effect.fruit] = true;
      if(o.effect.enable_fruit) for_automaton[o.effect.fruit] = true; // show the icon for the current season override effect, and for the main one. TODO: perhaps show fainter color symbol for fruits not currently in effect due to season overrides
    }
  }

  x = 0;
  for(var i = 0; i < numarrows; i++) {
    var canvasFlex = new Flex(scrollFlex, [0.01, 0, x], [0, 0, y], [0.01, 0, x + s], [0, 0, y + s]);
    x += s;
    //canvasFlex.div.style.border = '1px solid black';
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    var image = (i == state.fruit_active) ? image_fruitsel_active : image_fruitsel_inactive;
    if(for_automaton[i]) image = (i == state.fruit_active) ? image_fruitsel_active_automaton : image_fruitsel_inactive_automaton;
    renderImage(image, canvas);

    var f = i < state.fruit_stored.length ? state.fruit_stored[i] : undefined;

    styleButton0(canvasFlex.div, true);
    var tooltiptext = 'Make this fruit active';

    if(f) tooltiptext += '<br><br>' + getFruitTooltipText(f);
    registerTooltip(canvasFlex.div, tooltiptext);
    addButtonAction(canvasFlex.div, bind(function(i) {
      var slotnum = i;
      if(i == state.fruit_active) slotnum = -1; // allow having no fruit at all active, by clicking the arrow of the active fruit
      addAction({type:ACTION_FRUIT_ACTIVE, slot:slotnum, silent:true, allow_empty:true});
      update();
    }, i), 'activate fruit ' + i + ': ' + getFruitAriaLabel(state.fruit_stored[i], 'none'));
  }
  y += s;

  ////////

  styleButton0(titleFlex.div);
  addButtonAction(titleFlex.div, showStorageFruitSourceDialog);

  x = 0;
  for(var i = 0; i < num; i++) {
    if(x + 0.5 * s > s * num_fruits_width) {
      x = 0;
      y += s * 1.2;
    }

    var canvasFlex = new Flex(scrollFlex, [0.01, 0, x], [0, 0, y], [0.01, 0, x + s * 0.98], [0, 0, y + s]);
    x += s;
    canvasFlex.div.style.border = '1px solid black';
    var f = i < state.fruit_stored.length ? state.fruit_stored[i] : undefined;
    if(f) {
      makeFruitChip(canvasFlex, f, 0, i);
    } else {
      canvasFlex.div.style.backgroundColor = '#ccc';
      registerAction(canvasFlex.div, bind(function(help, i) {
        if(busyChoosingTargetSlot) {
          // clicking empty spot in the storage slots
          addAction({type:ACTION_FRUIT_SLOT, f:busyChoosingTargetSlot, precise_slot:i, force_swap:busyChoosingTargetSlot_shift});
          busyChoosingTargetSlot = undefined;
          update();
        } else {
          lastTouchedFruit = null;
          updateFruitUI();
          showMessage('No stored fruit present in this slot. ' + help, C_INVALID, 0, 0);
        }
      }, help, i), 'empty storage fruit slot', {tooltip:('No stored fruit present in this slot. ' + help)});
    }
    setupFruitDrag(canvasFlex, i, f);
  }
  y += s;

  ////////

  titleFlex = new Flex(scrollFlex, 0.01, [0, 0, y + t/3], 0.99, [0, 0, y + t]);
  y += s;
  titleFlex.div.innerText = 'Sacrificial fruit pool (' + state.fruit_sacr.length + ' / ∞)';
  help = 'Fruits in here will be turned into fruit essence on the next transcension. To get a fruit in here, click a fruit elsewhere and use its dialog to move it to the sacrificial pool, or drag and drop it here. Note that if the sacrificial pool has multiple rows, the most recent row will be at the top instead of the bottom so the best fruits are shown higher up.';
  registerTooltip(titleFlex.div, help);

  var num = numRenderedSacrFruitSlots();
  var numrows = numRenderedSacrFruitRows();
  var x = 0;
  var y0 = y;
  for(var i = 0; i < num; i++) {
    // swap the rows, but not the colums: the goal here is to have the newest fruits be at the top if you have multiple rows, but still go from left to right so that it's not confusing where new fruits appear (the rows swap is still a bit confusing, but at least not if you only have 1 row)
    var y2 = y0 + numrows * s - (y - y0 + s);
    var canvasFlex = new Flex(scrollFlex, [0.01, 0, x], [0, 0, y2], [0.01, 0, x + s * 0.98], [0, 0, y2 + s]);
    x += s;
    if(x + 0.5 * s > s * num_fruits_width && i + 1 < num) {
      x = 0;
      y += s;
    }
    canvasFlex.div.style.border = '1px solid black';
    var f = i < state.fruit_sacr.length ? state.fruit_sacr[i] : undefined;
    if(f) {
      makeFruitChip(canvasFlex, f, 1, i + 100);
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

      addButtonAction(canvasFlex.div, bind(function(help, i) {
        if(busyChoosingTargetSlot) {
          // clicking empty spot in the sacrificial pool
          addAction({type:ACTION_FRUIT_SLOT, f:busyChoosingTargetSlot, precise_slot:(i + 100), force_swap:busyChoosingTargetSlot_shift});
          busyChoosingTargetSlot = undefined;
          update();
        } else {
          lastTouchedFruit = null;
          updateFruitUI();
          showMessage('No fruit present in this sacrificial pool slot. ' + help, C_INVALID, 0, 0);
        }
      }, help, i), 'empty sacrificial fruit slot');
    }
    setupFruitDrag(canvasFlex, i + 100, f);
  }
  y += s;


  if(state.fruit_recover.length > 0) {
    y += s / 4;
    //var flex = new Flex(scrollFlex, 0.01, y, 0.3, y + 0.08);
    var flex = new Flex(scrollFlex, 0.01, [0, 0, y], 0.35, [0, 0, y + s * 0.8]);
    styleButton(flex.div);
    centerText2(flex.div);
    flex.div.textEl.innerText = 'Recover sacrificed fruit';
    addButtonAction(flex.div, function() {
      createRecoverFruitDialog();
    }, 'Recover sacrificed fruit');
    y += s * 0.6;
  }

  var upcoming = getUpcomingFruitEssence();
  if(!upcoming.empty()) {
    titleFlex = new Flex(scrollFlex, 0.01, [0, 0, y + t/3], 0.99, [0, 0, y + t]);
    y += s;
    titleFlex.div.innerText = 'Sacrifice value on transcend: ' + getUpcomingFruitEssence();
  }

  ////////

  //scrollFlex.div.style.display = 'block';

  scrollFlex.div.scrollTop = scrollPos;

}


/*
goal of this function: indicate non-production fruits in a way that makes you remember you've got a special one selected

return value is in order of increasingly less production focused and more specialized
lower value means it's likely a fruit you want to use throughout entire runs
higher value means it's likely a more specialized fruit that you want to use only under certain circumstances
the higher value ability overrides the lower ones, e.g. a fruit with weather and grow is considered a weather one
0 = production focused: only has boosts such as flower, berry, mushroom, bee, ...
1 = watercress focused
2 = nuts focused
3 = twigs or resin focused
4 = mushroom efficiency (nettle or musheff)
5 = grow
6 = weather
7 = no fruit equipped at all
*/
function getFruitCategory(f) {
  if(!f) return 7;
  if(getFruitAbilityFor(f, FRUIT_WEATHER) > 0) return 6;
  if(getFruitAbilityFor(f, FRUIT_GROWSPEED) > 0) return 5;
  if(getFruitAbilityFor(f, FRUIT_MUSHEFF) > 0 || getFruitAbilityFor(f, FRUIT_NETTLEBOOST) > 0) return 4;
  if(getFruitAbilityFor(f, FRUIT_TWIGSBOOST) > 0 || getFruitAbilityFor(f, FRUIT_RESINBOOST) > 0 || getFruitAbilityFor(f, FRUIT_RESIN_TWIGS) > 0) return 3;
  if(getFruitAbilityFor(f, FRUIT_NUTBOOST) > 0) return 2;
  if(getFruitAbilityFor(f, FRUIT_BRASSICA) > 0) return 1;
  return 0; // only production skills
}

// returns whether the fruit is probably interesting enough for the player to be dropped into the stored fruits rather than the cacrificial pool
// return value meanings:
// 0: not interesting
// 1: somewhat interesting
// 2: very interesting
// these heuristics are not flawless and a player should take a look at the fruit tab before transcending anyway, when looking for a particular fruit to fuse, ...
// NOTE: this function comes with some risk of player expecting high tier fruits to always be dropped in main stored slot or always highlight tab for new high tier fruits, so should not overdo it, only make tab red if the high tier fruits clearly are novel
function isFruitInteresting(fruit) {
  var best = -1;
  for(var i = 0; i < state.fruit_stored.length; i++) {
    var f = state.fruit_stored[i];
    if(!f) continue;
    best = Math.max(best, f.tier);
  }

  if(fruit.tier > best) return 2; // if the new fruit has a higher tier than any fruit you have, it's definitely interesting
  if(fruit.tier < best) return 0; // if lower than best tier you have, it's definitely not interesting


  var numbest = 0;
  var numbest2 = 0;
  var newseason = (fruit.type > 0);
  for(var i = 0; i < state.fruit_stored.length; i++) {
    var f = state.fruit_stored[i];
    if(!f) continue;
    if(f.tier == best) numbest++;
    else if(f.tier + 1 == best) numbest2++;
    if(newseason && f.tier == best && fruitContainsSeasonalType(f, fruit.type)) newseason = false;
  }
  if(newseason) return 2; // a new season is very interesting

  if(numbest < numbest2) return 1;
  //if(getActiveFruit() && getActiveFruit().tier + 1 == fruit.tier) return 1; // if the player is using a fruit with tier - 1, then likely that one still has better abilities and the player is trying to collect next tier fruits, so consider it interesting. This is interesting, but not interesting enough to warrant returning 2, because this heuristic depends on carried fruit

  return 0;
}


// the "achievement unlocked" chip at the bottom
var fruitChipFlex = undefined;

function removeFruitChip() {
  if(!fruitChipFlex) return;

  fruitChipFlex.removeSelf(gameFlex);
  fruitChipFlex = undefined;
}

function showFruitChip(message) {
  showMessage(message, C_NATURE, 208302236);

  removeFruitChip();

  fruitChipFlex = new Flex(gameFlex, 0.2, 0.85, 0.8, 0.95);
  fruitChipFlex.div.style.backgroundColor = '#cfcd';

  var canvasFlex = new Flex(fruitChipFlex, 0.01, [0.5, 0, -0.35], [0, 0, 0.7], [0.5, 0, 0.35]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(images_apple[3], canvas);

  var textFlex = new Flex(fruitChipFlex, [0, 0, 0.7], [0.5, 0, -0.35], 0.99, [0.5, 0, 0.35]);
  //textFlex.div.style.color = '#fff';
  textFlex.div.style.color = '#000';
  textFlex.div.innerHTML = message;

  addButtonAction(fruitChipFlex.div, removeFruitChip);
}


function createSelectFruitSlotDialog(fun, opt_maxnum, opt_help) {
  var dialog = createDialog({undefined,
    scrollable:true,
    title:'Select fruit slot',
    help:opt_help
  });

  var scrollFlex = dialog.content;

  var s = 0.1; // relative width and height of a chip
  var x = 0;
  var y = 0.03;

  for(var i = 0; i < state.fruit_slots; i++) {
    if(i >= opt_maxnum) break;
    if(x > s * 9.5) {
      x = 0;
      y += s;
    }

    var f = state.fruit_stored[i];
    var flex = new Flex(scrollFlex, [0.01, 0, x], [0, 0, y], [0.01, 0, x + s], [0, 0, y + s]);
    x += s * 1.01;
    if(f) {
      makeFruitChip(flex, f, 0, undefined, true);
    } else {
      flex.div.style.backgroundColor = '#ccc';
      flex.div.style.border = '1px solid black';
      registerTooltip(flex.div, 'Slot ' + i + ', no stored fruit present in this slot.');
    }
    styleButton0(flex.div);
    var arialabel = 'select fruit slot ' + i;
    if(f) arialabel += '. "' + getFruitAriaLabel(f) + '"';
    addButtonAction(flex.div, bind(function(i) {
      fun(i);
      closeTopDialog();
    }, i), arialabel);
  }
}
function createRecoverFruitDialog() {
  var dialog = createDialog({undefined,
    scrollable:true,
    title:'Select sacrificed fruit to recover',
    help:'This allows to recover fruits that were sacrificed the previous run. This allows recovering fruit if it was forgotten before transcend, but this cannot be used as additional storage: only fruits that were dropped by the tree the previous run are available in here, and on a next transcend they will be gone.<br><br>Any essence gained from sacrificing the fruit, will be taken back.'
  });

  var scrollFlex = dialog.content;

  var s = 0.1; // relative width and height of a chip
  var x = 0;
  var y = 0.03;
  var maxy = y + Math.ceil(state.fruit_recover.length / 10) * s;

  for(var i = 0; i < state.fruit_recover.length; i++) {
    if(x > s * 9.5) {
      x = 0;
      y += s;
    }
    var y2 = maxy - y;

    var f = state.fruit_recover[i];
    var flex = new Flex(scrollFlex, [0.01, 0, x], [0, 0, y2], [0.01, 0, x + s], [0, 0, y2 + s]);
    x += s * 1.01;
    makeFruitChip(flex, f, 0, undefined, true, undefined, true);
    styleButton0(flex.div);
    var arialabel = 'select fruit slot ' + i;
    if(f) arialabel += '. "' + getFruitAriaLabel(f) + '"';
    addButtonAction(flex.div, bind(function(i) {
      addAction({type:ACTION_FRUIT_RECOVER, r_index:i});
      closeTopDialog();
      update();
      lastTouchedFruit = state.fruit_sacr[0]; // it's inserted at this position, indicate it
      updateFruitUI();
    }, i), arialabel);
  }
}
