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


var numhelpdialogs = 0;
var helpDialogQueue = [];

// the "never show again" is stored in savegame, which means if you use undo or import another save, it may come back
// to avoid annoyance in those cases, also store the "never show again" of dialogs temporarily during this session (lost on browser refresh)
var helpNeverAgainLocal = {};

// the "help" chip at the bottom for first-ever seen messages
var helpChipFlex = undefined;

function removeHelpChip() {
  if(!helpChipFlex) return;

  helpChipFlex.removeSelf(gameFlex);
  helpChipFlex = undefined;
}

function showHelpChip(text) {
  removeHelpChip();

  helpChipFlex = new Flex(gameFlex, 0.19, 0.86, 0.81, 0.94);
  helpChipFlex.div.style.backgroundColor = '#cffd';
  helpChipFlex.div.style.zIndex = 15;

  var textFlex = new Flex(helpChipFlex, 0.01, [0.5, 0, -0.35], 0.99, [0.5, 0, 0.35]);
  //textFlex.div.style.color = '#fff';
  textFlex.div.style.color = '#000';
  centerText2(textFlex.div);
  textFlex.div.textEl.innerHTML = text;

  addButtonAction(helpChipFlex.div, removeHelpChip);
}

// if due to a bug in the game, or help dialog added to the game after the fact (and it can never be unlocked again due to e.g. already having done upgrade that had this as one-time effect),
// a help dialog was never seen and thus doesn't end up in the main help list of dialogs, this can fix it
function ensureMissedHelpDialogAvailable(id, opt_state) {
  (opt_state || state).help_seen_text[id] = true;
}

// id = unique id for seen/disable setting of this particular help message. must be > 0. Alternatively, id can be made < 0, then it only prints it as showMessage, this feature simply exists to allow easily changing the source code to use a full on dialog, or just showMessage, for particular help text
// highest used id: 38
// opt_text2 is shown only in the dialog and not in the "showMessage" in console
// opt_recursive is used internally only, when recursively calling showHelpDialog again when there were multiple. It prevents showMessage since showMessage will already have been done.
// text_short = shown in the message log if help already disabled for this particular dialog, or undefined to simply use the main text, or empty string to show nothing for this case
// returns whether an actual dialog was shown (and not just log messages or nothing)
function showHelpDialog(id, text_short, text, image, opt_text2, images, opt_force, opt_recursive) {
  var text_only = id < 0;
  id = Math.abs(id);
  var text_seen = !!state.help_seen_text[id];
  var seen = !!state.help_seen[id];
  state.help_seen_text[id] = id;
  if(!opt_recursive) {
    var use_short = false;
    if(!text_only) {
      if(state.help_disable[id]) use_short = true;
      if(state.disableHelp) {
        use_short = seen;
        state.help_seen[id] = id;
      }
    }

    // opt_force is set if dialog openend from the main help dialog, don't show in message log in that case.
    if(!opt_force && (!text_seen || state.messagelogenabled[3])) {
      if(use_short) {
        if(text_short != '') showMessage(text_short || text, C_HELP, 175786661);
      } else {
        showMessage(text, C_HELP, 175786661);
      }
    }
  }

  if(text_only) return false; // showMessage-only

  var show_full_dialog = true;

  if(!opt_force) {
    if(state.help_disable[id]) show_full_dialog = false;
    if(helpNeverAgainLocal[id]) {
      state.help_disable[id] = id;
      show_full_dialog = false;
    }
    if(state.disableHelp) show_full_dialog = false;;
  }

  if(!show_full_dialog) {
    if(!text_seen && text_short) {
      showHelpChip(text_short);
    }
    return false;
  }

  if(numhelpdialogs < 0) {
    // some bug involving having many help dialogs pop up at once and rapidly closing them using multiple methods at the same time (esc key, click next to dialog, ...) can cause this, and negative dialog_level makes dialogs appear in wrong z-order
    numhelpdialogs = 0;
  }

  if(numhelpdialogs) {
    helpDialogQueue.push(arguments);
    return true;
  }

  if(opt_text2) text += opt_text2;

  state.help_seen[id] = id;

  var okfun, oktext;

  if(!opt_force) {
    var okfun = function() {
      state.help_disable[id] = id;
      helpNeverAgainLocal[id] = id;
    };
    var oktext = 'never show again';
  }

  numhelpdialogs++;
  var dialog = createDialog(images ? DIALOG_LARGE : DIALOG_MEDIUM, okfun, oktext, undefined, 'ok', undefined, undefined, false, function() {
    numhelpdialogs--;
    if(helpDialogQueue.length) {
      var args = Array.prototype.slice.call(helpDialogQueue[0], 0);
      args[7] = true; // opt_recursive
      helpDialogQueue.shift();
      showHelpDialog.apply(this, args);
    }
  });
  dialog.div.className = 'efDialogTranslucent';
  var fx0 = 0.01;
  var fy0 = 0.01;
  var fx1 = 0.99;
  var fy1 = 0.8;

  if(image) {
    var canvasflex = new Flex(dialog.content, [0.01, 0, 0], [0.01, 0, 0], [0.01, 0, 0.1], [0.01, 0, 0.1]);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasflex.div);
    renderImage(image, canvas);
    fx0 = 0.11;
  }

  if(images) {
    var w = images[0].length;
    var h = images.length;
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        if(!images[y][x]) continue; // ok to have gaps
        var x0 = 0.3 * (x / w - 0.5);
        var y0 = 0.3 * (y / h - 0.5);
        var x1 = 0.3 * ((x + 1) / w - 0.5);
        var y1 = 0.3 * ((y + 1) / h - 0.5);
        var canvasflex = new Flex(dialog.content, [0.25, 0, x0], [0.85, 0, y0], [0.25, 0, x1], [0.85, 0, y1]);
        var canvas = createCanvas('0%', '0%', '100%', '100%', canvasflex.div);
        renderImage(images[y][x], canvas);
      }
    }
    fy1 = 0.7;
  }

  var flex = new Flex(dialog.content, fx0, fy0, fx1, fy1);
  makeScrollable(flex);

  flex.div.innerHTML = text;

  return true;
}



var registered_help_dialogs_order = [];
var registered_help_dialogs = {};

function registerHelpDialog(id, name, text_short, text, image, opt_text2, images) {
  registered_help_dialogs_order.push(id);
  registered_help_dialogs[id] = {};
  var d = registered_help_dialogs[id];
  d.id = id;
  d.text_short = text_short; // text shown in message log when the help message was already seen and disabled, or undefined to use same as text, or empty string '' to show nothing in this case
  d.name = name;
  d.text = text;
  d.image = image;
  d.opt_text2 = opt_text2;
  d.images = images;
}

// returns whether an actual dialog was shown (and not just log messages or nothing)
function showRegisteredHelpDialog(id, opt_force)  {
  var d = registered_help_dialogs[id];
  if(!d) return;
  return showHelpDialog(d.id, d.text_short, d.text, d.image, d.opt_text2, d.images, opt_force);
}


registerHelpDialog(8, 'Upgrades', 'You unlocked your first upgrade!',
    'You unlocked your first upgrade! Upgrades can unlock new crops, upgrade existing crops, or have various other effects. Upgrades usually cost seeds.<br><br>Upgrades can be performed in the "upgrades" tab. Depending on screen size, it may also be available directly on the right side of the screen.');

registerHelpDialog(3, 'Permanent crop & watercress copying', 'You unlocked your first permanent type of plant.',
    'You unlocked your first permanent type of plant. Plants like this stay on the field forever, keep producing forever, and have much more powerful production upgrades too.' +
    '<br><br>'+
    'Watercress also remains useful: if you plant watercress next to permanent plants, the watercress copy all its neighbors (orthogonally, not diagonally) production. If there is more than 1 watercress in the entire field they copy less, so having 1 or perhaps 2 max makes sense (by design: no need to replant many watercress all the time. Check the seeds/s income to experiment). The watercress is its own independent multiplier so it works well and is relevant no matter how high level other boosts the permanent plants have later in the game.' +
    '<br><br>'+
    'TIP: press "p" to plant last used crop type at mouse cursor, or shift+click for the same effect, or ctrl (or command) + click to plant watercress. More shortcuts are listed in the main game help menu.',
    undefined,
    '<br><br>'+
    'The image below shows an optimal configuration to use for watercress copying: the single watercress duplicates the production of 4 blackberries:',
    [[undefined,blackberry[4],undefined],[blackberry[4],images_watercress[4],blackberry[4]],[undefined,blackberry[4],undefined]]);



registerHelpDialog(19, 'Mushrooms', 'You unlocked your first type of mushroom',
               'You unlocked your first type of mushroom. Mushrooms produce spores, but they consume seeds. Mushrooms must touch berries to get their seeds. If the berry cannot produce enough seeds for the mushroom, the mushroom produces less spores. If the berry produces more seeds than needed, the remaining seeds go to the regular seeds stack<br><br>Spores let the tree level up, unlocking next kinds of bonuses.<br><br>Spores are used by the tree, but the mushroom is not required to touch the tree.',
               undefined,
               '<br><br>'+
               'The image shows a possible configuration for mushrooms: it extracts some seeds from the berries it touches.',
               [[champignon[4],blueberry[4]],[blueberry[4],undefined]]);
registerHelpDialog(20, 'Flowers', 'You unlocked your first type of flower',
               'You unlocked your first type of flower. Flowers boost berries and mushrooms. In case of mushrooms, it boosts their spore production, but also increases their seed consumption equally',
               undefined,
               '<br><br>'+
               'The image shows a possible good configuration for flower boost: multiple flowers boost multiple berries or mushrooms. It\'s also ensured that both the mushroom and the berry it consumes from both have a flower.',
               [
                 [blackberry[4],clover[4],blackberry[4],undefined],
                 [clover[4],blackberry[4],clover[4],clover[4]],
                 [blackberry[4],clover[4],blackberry[4],champignon[4]],
                 [    undefined,undefined,undefined,undefined]
               ]);

registerHelpDialog(21, 'Nettles', 'Unlocked a new crop: nettle. Nettle boosts mushrooms, but hurts flowers and berries it touches.',
  'Unlocked a new crop: nettle. Nettle boosts mushrooms, but hurts flowers and berries it touches. The mushroom boost increases spore production without increasing seeds consumption. The boost is an additional multiplier independent from flower boost to mushroom, so having both a nettle and a flower next to a mushroom works even greater.',
  images_nettle[4],
  '<br><br>'+
  'The image shows a possible configuration where the mushroom receives boost from both nettle (top) and flower (bottom). The top left flower and top right blackberry in this image however are negatively affected by the nettle.',
  [[clover[4],images_nettle[4],blackberry[4]],
   [blueberry[4],champignon[4],blueberry[4]],
   [undefined,clover[4],undefined]]);


registerHelpDialog(6, 'Tree leveled up', 'Tree leveled up', 'Thanks to spores, the tree completely rejuvenated and is now a ' + tree_images[treeLevelIndex(1)][0] + ', level ' + 1 + '. More spores will level up the tree more. The tree can unlock abilities and more at higher levels. Click the tree in the field for more info.',
    undefined, undefined, [[undefined, tree_images[treeLevelIndex(1)][1][0]], [undefined, tree_images[treeLevelIndex(1)][2][0]]]);


registerHelpDialog(12, 'Sun ability', 'Tree reached level 2 and discovered sun ability', 'The tree reached level ' + 2 + ' and discovered the sun ability!<br><br>' + upgrades[upgrade_sununlock].description, image_sun);
registerHelpDialog(14, 'Mist ability', 'Tree reached level 4 and discovered mist ability', 'The tree reached level ' + 4 + ' and discovered the mist ability! You now have multiple abilities, only one ability can be active at the same time.<br><br>' + upgrades[upgrade_mistunlock].description, image_mist);
registerHelpDialog(15, 'Rainbow ability', 'Tree reached level 6 and discovered rainbow ability', 'The tree reached level ' + 6 + ' and discovered the rainbow ability!<br><br>' + upgrades[upgrade_rainbowunlock].description, image_rainbow);
registerHelpDialog(2, 'Tree dropped fruit', 'Tree reached level 5 and dropped a fruit', 'The tree reached level ' + 5 + ' and dropped a fruit! Fruits provide boosts and can be upgraded with fruit essence. Essence is gained by sacrificing fruits, and all full amount of fruit essence can be used for upgrading all other fruits at the same time. See the "fruit" tab, it also has a more extensive help dialog for fruits.<br><br>A possible strategy: keep fruits with good abilities you like. Sacrifice any other surplus fruits, so you can use the essence to upgrade the good fruits.', images_apple[0]);
registerHelpDialog(18, 'Tree dropped better fruit', 'Tree reached level 15 and dropped another fruit', 'The tree reached level ' + 15 + ' and dropped another fruit! It drops one every 5 levels. Fruits from higher tree levels have random probability to be of better, higher tier, types.', images_apple[2]);


registerHelpDialog(7, 'Tree can transcend', 'Tree reached level 10 and it\'s now possible to transcend', 'The tree reached adulthood, and is now able to transcend! Click the tree in the field to view the transcension dialog. The tree also dropped another fruit.',
    undefined, undefined, [[undefined, tree_images[treeLevelIndex(10)][1][0]], [undefined, tree_images[treeLevelIndex(10)][2][0]]]);


registerHelpDialog(1, 'Transcension', 'You performed your first transcension! You can use resin in the ethereal field tab.', 'You performed your first transcension! Check the new ethereal field tab, spend resin on ethereal plants for bonuses to your basic field. Get more resin by transcending again.',
  undefined,
  '<br><br>The following image shows an example of an ethereal field setup with several ethereal crops that give boosts to the main field: all type of basic field berries, mushrooms and flowers are boosted by this example. The image also shows a white lotus that boosts the neighboring ethereal crops to make their boosts even bigger.',
  [[undefined,clover[4],undefined],
   [blackberry[4],images_whitelotus[4],champignon[4]],
   [undefined,blackberry[4],undefined]]);

// obsolete: the transcension II system is gone
//registerHelpDialog(23, 'Transcension II', 'Tree reached level 20 and Transcension II with more bonus is unlocked', 'The tree reached level ' + 20 + '. Transcension now turned into Transcension II, and doubles the amount of resin you receive upon transcending. This will continue at later tree levels as well: tree level 30 unlocks transcension III which triples resin, and so on',
//    undefined, undefined, [[undefined, tree_images[treeLevelIndex(20)][1][0]], [undefined, tree_images[treeLevelIndex(20)][2][0]]]);

registerHelpDialog(9, 'Ethereal upgrades', 'You unlocked your first ethereal upgrade!', 'You unlocked your first ethereal upgrade, thanks to planting an ethereal crop! Check the new "ethereal upgrades" tab to view this new type of upgrade. Ethereal upgrades cost resin, just like ethereal plants do, but ethereal upgrades are permanent and non-refundable, unlike ethereal crops which can be deleted give 100% refund');

registerHelpDialog(17, 'Mistletoes', 'Unlocked a new crop: mistletoe',
  'Unlocked a new crop: mistletoe. Mistletoe can be placed next to the basic field tree to create twigs, orthogonally, not diagonally. They produce twigs, which, like resin, you only actually get when transcending. Twigs help the ethereal field tree. However having more than one mistletoe increases the spore requirement for leveling the basic tree and slightly decreases resin gain, and more mistletoes give diminishing returns (but still increases it). Mistletoes that are not planted next to the tree do nothing at all.',
  mistletoe[4],
  '<br><br>'+
  'The image shows a possible configuration where mistletoes are next to the tree and thus give twigs on tree level up.',
  [[tree_images[treeLevelIndex(2)][1][0], mistletoe[4]], [tree_images[treeLevelIndex(2)][2][0], mistletoe[4]]]);


registerHelpDialog(22, 'Ethereal tree leveled up', 'The ethereal tree leveled up, unlocking new ethereal upgrades, crops and boosts',
    'Thanks to twigs, the ethereal tree leveled up! This is the tree in the ethereal field, not the one in the basic field. Leveling up the ethereal tree unlocks new ethereal crops and/or upgrades, depending on the level. Each level also provides a resin production boost to the basic tree.',
    undefined, undefined, [[undefined, tree_images[treeLevelIndex(1)][1][4]], [undefined, tree_images[treeLevelIndex(1)][2][4]]]);

registerHelpDialog(24, 'Challenges', 'You unlocked a challenge!',
    'You unlocked a challenge! Challenges can be accessed from the tree, as an alternative to regular transcension. All challenges give a production bonus (to seeds and spores, and a smaller amount to resin and twigs) for highest tree level reached. Challenges may also give one-time rewards for successfully reaching a certain level. Challenges can be ran as many times as desired, redoing them can increase the max level reached.',
    undefined);


registerHelpDialog(25, 'Bee challenge', undefined,
    'You started the bee challenge! Rules are different from the standard game. You can click the tree at any time to view the current challenge rules, reward and stats.',
    images_queenbee[4],
    '<br><br>'+
    'The image below shows a possible configuration for the bees: all workers touch a flower as required, queens optionally touch workers for extra boost (so beehives provide a boost-boost), and hives touch queens to make that boost stronger (a boost-boost-boost). More than 1 flower does not increase boost but multiple queens or hives do. The rightmost worker bee gives most boost because it touches 3 queens, and the topmost queen gives least boost since it touches the least hives. You can fill in gaps in the picture where more queens or hives would increase the boost more. Not shown in the picture is that you also need some mushroom and berry production running somewhere, which can also be boosted by flowers in the standard way.',
    [[undefined, images_workerbee[4], images_queenbee[4], images_beehive[4]],
     [images_workerbee[4], images_aster[4], images_workerbee[4], images_queenbee[4]],
     [undefined, images_workerbee[4], images_queenbee[4], images_beehive[4]],
     [undefined, images_queenbee[4], images_beehive[4], undefined],
    ]);

registerHelpDialog(26, 'Challenge completed', '',
    'The tree reached the challenge\'s target level, you can successfully complete the challenge and can get its main reward! You can complete the challenge from the tree dialog, or continue to reach a higher level for more challenge max-level bonus. You can also replay the challenge at any later time to increase the max level.',
    undefined);

registerHelpDialog(27, 'Beehives', 'You unlocked beehives!',
  'You unlocked beehives! Beehives boost orthogonally neighboring flowers, while flowers boost berries and mushrooms (beehives boost-boost). This adds a new independent multiplier that can be upgraded to the game.',
  images_beehive[4],
  '<br><br>'+
  'The image shows a possible configuration for beehives, such that the beehives boost flowers, which in turn boost berries and mushrooms. It\'s ensured both the mushroom and the berry it consumes from have a hive-boosted flower.',
  [
    [undefined,grape[4],daisy[4],grape[4]],
    [grape[4],daisy[4],images_beehive[4],daisy[4]],
    [undefined,grape[4],daisy[4],grape[4]],
    [undefined,images_beehive[4],daisy[4],amanita[4]],
  ]);


registerHelpDialog(28, 'Automaton & Blueprints', 'You unlocked the automaton!',
    'You unlocked the automaton! You can place the automaton in the ethereal field. When placed, it gives a boost to neighbors, and the automaton tab and blueprints unlock, allowing to automate various parts of the game.<br><br>' +
    'You must place the automaton in the ethereal field before this works, go to its tab, and configure its settings before it actually automates anything.<br><br>More and more automation features become available later in the game.<br><br>' +
    'When removing the automaton from the ethereal field, all automation features will be disabled, but they all come back the way they were when placing the automaton again.<br><br>' +
    'The automaton initially has the following features unlocked:<br><br>' +
    ' • Blueprints and templates: Templates are translucent blue looking versions of crops that can be placed in the field using the regular planting menu. Blueprints can be created and placed from the blueprint button in the tree.<br>' +
    ' • Buttons to delete all crops in the main field or in the ethereal field: these are in the automaton tab and are for convenience. Deleting the ethereal field still uses tokens as usual.<br>' +
    ' • Automation of choice upgrades: Use the button in the automaton tab to enable/disable this. Use the "gear" button to set up which choice to make for which upgrade. You have to use the gear for the initial setup of this.<br>' +
    ' • Neighbor boost in the ethereal field: the automaton in the ethereal field gives an independent boost to neighbors, similar to lotuses.<br>' +
    '',
    images_automaton[4],
    undefined,
  [[undefined,images_flowertemplate[4],undefined],
   [images_flowertemplate[4],images_berrytemplate[4],images_flowertemplate[4]],
   [undefined,images_flowertemplate[4],undefined]]);

registerHelpDialog(29, 'Auto upgrades', 'You unlocked auto upgrades!',
    'You unlocked auto-upgrades for the automaton! See the automaton tab. You can enable or disable auto-upgrades, and choose a max cost the automaton is allowed to spend. All basic upgrades that boost crops, will be automatically performed by the automaton, at their normal cost, when enabled.',
    images_automaton[4]);

registerHelpDialog(30, 'Auto upgrades more options', 'You unlocked more auto upgrade options!',
    'You unlocked more finetuning options for the auto upgrades. See the automaton tab. There is now a "gear" button next to the auto upgrade button: you can now configure the max cost per crop type (berry, mushroom, flower, ...).',
    images_automaton[4]);

registerHelpDialog(31, 'Auto plant', 'You unlocked auto plant!',
    'You unlocked auto-planting for the automaton! See the automaton tab. You can enable or disable auto-plant, and choose a max cost the automaton is allowed to spend.<br><br>How this works: the automaton will upgrade existing crops or blueprint templates to a higher tier, if that higher tier is unlocked. The automaton will not plant new crops from scratch, and will only upgrade crops or blueprint templates to the same type, e.g. berry to berry, flower to flower, ...<br><br>For example: If you have a blackberry, and now unlock blueberry, the automaton will automatically upgrade all planted blackberries in the field to blueberries, given enough resources.',
    images_automaton[4]);

registerHelpDialog(32, 'Auto plant more options', 'You unlocked auto plant more options!',
    'You unlocked more finetuning options for auto planting, you can now choose how many resources the automaton can spend on crops of each type. Use the "gear" button next to the auto-plant button to finetune these options',
    images_automaton[4]);

registerHelpDialog(33, 'Auto unlock', 'You unlocked auto-unlock!',
    'You unlocked auto-unlock. This will unlock the next tiers of crops automatically. Combined with auto-plant and blueprint templates, this can almost fully automate a run.<br><br>Once you planted the general shape of your field with cheap crops or blueprint templates, everything will happen automatically from then on. Just place berries, mushrooms, flowers, nettles and beehives once to indicate the layout.<br><br>Tip: ensure there are some berries that don\'t touch a mushroom, because if a mushroom consumes all seeds of a berry, income will stop and the automaton won\'t get resources for further upgrades and planting, resulting in a deadlock.',
    images_automaton[4]);

registerHelpDialog(34, 'Multiplicity', 'You unlocked multiplicity! Mushrooms and berries boost each other no matter at what location.',
    'You unlocked multiplicity! Berries now boost other berries just by having multiple anywhere field, and similarly, mushrooms boost mushrooms. This works across tiers, but max 1 tier higher or lower (e.g. blackberry affects blueberry, but it won\'t affect the 2-higher tier cranberry). For example, if there are 4 berry plants anywhere in the field, each berry receives a boost from the three others. Crops that are growing already fully count for multiplicity.',
    blackberry[4],
    undefined,
  [[blackberry[4],undefined,blueberry[4]],
   [undefined,undefined,undefined],
   [blueberry[4],undefined,blackberry[4]]]);

registerHelpDialog(35, 'Squirrel & Nuts', 'You unlocked the squirrel and the nuts crops!',
    `You unlocked the squirrel and the nuts crops! The squirrel gives an entirely new tech tree of ugrades. Place a squirrel in the ethereal field (it\'ll also boost neighbors!). Grow nuts in the main field using the new nuts crops. Use nuts to buy squirrel upgrades, in the new squirrel tab.
    <br><br>
    Nuts crops unlock at tree level 45, the first one is Almond. You can have max 1 nut crop in the main field, but it can be upgraded and replaced with better types. Nuts crops benefit from flowers, but only in a limited form independent of flower upgrades or bees, nuts crops are not affected by the same boosts as berries or mushrooms, they have their own more limited boosts. Watercress can copy from nuts, but only at half effectiveness and without fruit bonus.
    <br><br>
    Buy squirrel upgrades in the squirrel tab. Squirrel upgrades are laid out in a tech tree. Each next squirrel upgrade costs ` + upgrade3_mul.toString() + `x more than the previous one, no matter what order you do them in. Get higher tree levels and nut crops to get enough nuts for the next one.
    <br><br>
    You can respec the squirrel upgrades if you regret a decision, using a respec token. You get a few for free, more can be gotten for amber in the amber tab.
    <br><br>
    Once you ever respecced squirrel upgrades, the "buy all to here" option unlocks for upgrades you have seen before: click the upgrade icon of any squirrel upgrade further down in the tree, then use this button to automatically buy this upgrade and all squirrel upgrades required to reach this one (including all of gated stages), if you can afford it. This avoid having to click every individual upgrade again after respec.
    <br><br>
    Planting and upgrading nuts crops cost spores instead of seeds. They work with automaton just like most other crops. If the automaton is spending too much spores on nuts upgrades and you want the tree to level up instead, decrease the allowed % setting for nuts upgrades in the automaton settings.
    `,
    images_squirrel[4],
    undefined,
  [[mulberry[4],iris[4],mulberry[4]],
   [iris[4],images_almond[4],images_watercress[4]],
   [mulberry[4],iris[4],mulberry[4]]]);

registerHelpDialog(36, 'Amber', 'The tree dropped amber!',
    `The tree dropped a piece of amber! From now on, every now and then, the tree can drop amber when it levels up.
    <br><br>
    Amber can be used in the new amber tab for various effects.
    <br><br>
    Effects:
    <br>
    • Production boost: gives a boost to berries and mushrooms for the entire run, this lasts until next transcension.
    <br>
    • Other effects may unlock later.
    `,
    undefined,
    undefined,
    undefined);

registerHelpDialog(37, 'Combined Seasonal Fruits', 'You unlocked combined seasonal fruits fusing!',
    `You unlocked fusing of multi-season fruits! Now when you fuse fruits of different seasons, they may form a new fruit that gives the bonus for both seasons. The following combinations work:
    <br><br>
    • Apricot + Pineapple = Mango (spring + summer)
    <br>
    • Pineapple + Pear = Plum (summer + autumn)
    <br>
    • Pear + Medlar = Quince (autumn + winter)
    <br>
    • Medlar + Apricot = Kumquat (winter + spring)
    <br><br>
    Other combinations (e.g. Apricot + Pear, or Quince + Plum) don\'t work and just give a regular apple, or a lowest common denominator seasonal fruit.
    <br><br>
    To get these multi-season fruits, fuse fruits as you usually do. All other fusing rules, such as the combining of abilities (and inability to fuse in case of full ability mismatches), work as usual, the change is now some mixed combinations give a new improved multi-season fruit rather than an apple.
    <br><br>
    Later, if (and only if) you get the second fruit-mixing squirrel upgrade, you additionally get the following combinations to make the 4-seasons star fruit:
    <br><br>
    • Mango + Quince = Star Fruit (4 seasons)
    <br>
    • Plum + Kumquat = Star Fruit (4 seasons)
    <br><br>
    Combinations that don\'t cover all 4 seasons, such as mango+plum, won\'t work, it must be one of the combionations listed above.
    <br><br>
    Remember, star fruit fusing is not yet available if you just unlocked the first fruit mixing upgrade now, the star fruit requires the second such squirrel upgrade. Now you already know how to prepare for it though.
    `,
    images_apple[8],
    undefined,
  [[images_apricot[1],images_pineapple[1],images_pear[8]],
   [images_medlar[1],images_mango[4],images_plum[7]],
   [images_quince[4],images_kumquat[1],images_starfruit[9]]]);

registerHelpDialog(38, 'Auto prestige', 'You unlocked auto prestige!',
    'You unlocked auto-prestige for the automaton! This is integrated with auto-unlock: the same cost settings of auto-unlock are used for auto-prestige, and you can use a toggle to enable/disable auto-prestige.',
    images_automaton[4]);


function createKeyboardHelpDialog() {
  var dialog = createDialog();

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Help';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1);
  var div = flex.div;
  makeScrollable(flex);

  var text = '';

  text += '<b>List of keyboard shortcuts:</b>';
  text += '<br/><br/>';
  text += 'Note: on mac, ctrl means command instead.';
  text += '<br/><br/>';
  text += ' • <b>number keys "1-9"</b>: by default, select fruit slot (when available). Can be changed in the preferences under "controls" to instead activate weather or change game tabs.';
  text += '<br/>';
  text += ' • <b>"shift" + number keys "1-9"</b>: by default, activate weather (1-3). Can be changed in the preferences under "controls" to instead select fruit slots or change game tabs.';
  text += '<br/>';
  text += ' • <b>"w"</b>: replant watercress on all field tiles that have a watercress remainder, and refresh existing ones. Such a remainder appears for watercress that have been copying from multiple plants, that is, a good copying spot. Copying has diminishing returns if there are multiple watercress anywhere on the map, 1 or 2 is effective (check the seeds/s income to view the effect).';
  text += '<br/>';
  text += ' • <b>"t"</b>: show transcend dialog (if available)';
  text += '<br/>';
  text += ' • <b>"p"</b>: pick (select) or plant (if empty field) crop under mouse cursor (no mouse click required)';
  text += '<br/>';
  text += ' • <b>"d"</b>: delete crop under mouse cursor (no mouse click required, only if this is enabled in preferences)';
  text += '<br/>';
  text += ' • <b>"u"</b>: upgrade crop or template under mouse cursor (no mouse click required)';
  text += '<br/>';
  text += ' • <b>shift + click empty field</b>: plant last planted or unlocked crop type.';
  text += '<br/>';
  text += ' • <b>ctrl + click empty field</b>: plant a watercress (does not affect last planted type for shift key).';
  text += '<br/>';
  text += ' • <b>ctrl + click non-empty field</b>: delete crop, only if this is enabled in preferences.';
  text += '<br/>';
  text += ' • <b>shift + click non-empty field</b>: replace crop, only if this is enabled in preferences.';
  text += '<br/>';
  text += ' • <b>ctrl + shift + click field</b>: upgrade crop or template to highest unlocked level (if enabled in preferences), pick this crop type as last planted, and on empty field, plant highest of picked crop type you can afford.';
  text += '<br/>';
  text += ' • <b>shift + click upgrade</b>: buy as many of this upgrade as you can afford.';
  text += '<br/>';
  text += ' • <b>shift + click undo</b>: save the undo state now, rather than load it. This overwrites your undo so eliminates any chance of undoing now. This will also be overwritten again if you do actions a minute later.';
  text += '<br/>';
  text += ' • <b>shift + click save import dialog</b>: import and old savegame, but force paused state, do not run the time, so you get the resources and season at the time of saving rather than with all production during that time added.';
  text += '<br/>';
  text += ' • <b>ctrl + click save import dialog</b>: import and old savegame, but force non-paused state, even if the savegame was saved while paused, this will cause all time between saving and now to be ran.';
  text += '<br/>';
  text += ' • <b>ctrl + click fruit</b>: move fruit between sacrificial and storage slots, if possible.';
  text += '<br/>';
  text += ' • <b>shift + click fruit</b>: same as ctrl + click fruit.';
  text += '<br/>';
  text += ' • <b>shift + click fruit ability upgrade</b>: buy multiple abilities up to 25% of currently available essence.';
  text += '<br/>';
  text += ' • <b>], }, ) or ></b>: select next active fruit. Can be changed in the preferences under "controls" to instead select next game tab.';
  text += '<br/>';
  text += ' • <b>[, {, ( or <</b>: select previous active fruit. Can be changed in the preferences under "controls" to instead select previous game tab.';
  text += '<br/>';
  text += ' • <b>esc</b>: close current dialog. If no dialogs are open, shows main menu.';
  text += '<br/>';
  if (haveAutomaton()) {
    text += '<br/><b>Blueprints:</b>';
    text += '<br/>';
    text += '<br/>';
    text += ' • <b>"b"</b>: open the blueprint library, when available.';
    text += '<br/>';
    text += ' • <b>"t"</b>: open the transcension dialog, when available.';
    text += '<br/>';
    text += ' • <b>"t" followed by "Enter"</b>: transcend without blueprint.';
    text += '<br/>';
    text += ' • <b>"t" followed by "b"</b>: transcend and open the transcend-with-blueprint dialog.';
    text += '<br/>';
    text += ' • <b>"t" followed by "c"</b>: transcend and open the start-new-challenge dialog.';
    text += '<br/>';
    text += ' • <b>"1" - "9" in blueprint selection dialog</b>: open or use this blueprint';
    text += '<br/>';
    text += ' • <b>shift + click blueprint</b>: immediately plant this blueprint, rather than opening its edit screen.';
    text += '<br/>';
    text += ' • <b>shift + click blueprint "To Field"</b>: plant this blueprint, but let it override non-matching crops. Without shift, it only plants on empty field spots.';
    text += '<br/>';
    text += ' • <b>shift + click squirrel upgrade</b>: when you unlocked this type of upgrades and have respecced at least once: upgrade all upgrades until this one, only available if you can afford it and this upgrade was seen before.';
    text += '<br/>';
  }
  text += '<br/><br/>';

  div.innerHTML = text;
}

function createMainHelpDialog() {
  var dialog = createDialog();

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Help';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1);
  var div = flex.div;
  makeScrollable(flex);

  var text = '';

  text += 'Ethereal farm is an incremental game taking place on a field with a mysterious tree in the center. Most crops are permanent and there\'s no harvesting/selling/withering as in many farm games, instead it\'s about growing better and better plant types, with various neighbor-interaction rules with other plants in the field.';
  text += '<br/><br/>';
  text += 'The text in the message log at the bottom will guide you through how to play. A short summary of the first steps: initially you have no resources but can get some from clicking ferns. Then you can click on field tiles to plant crops and soon resources are gained automatically and soon after that permanently. The rest will be revealed when the time is ready.';
  text += '<br/><br/>';
  text += 'You can click resources in the resource panel to see more detailed breakdown. You can click fullgrown crops to see detailed stats. As the game progresses, more types of information may appear in there.';
  text += '<br/><br/>';

  text += '<b>Savegame recovery:</b>';
  text += '<br/><br/>';
  text += 'This game auto-saves every few minutes in local storage in the web browser, but please use <i>settings -> export save</i> regularly for backups, because a local storage savegame can easily get lost.';
  text += '<br/><br/>';
  text += 'If something goes wrong with your savegame, there may be a few older recovery savegames. Click <a style="color:#44f;" id="recovery">here</a> to view them.';

  text += '<br/><br/><br/>';
  text += 'Game version: ' + programname + ' v' + formatVersion();
  text += '<br/><br/>';
  text += 'Copyright (c) 2020-2022 by Lode Vandevenne';

  div.innerHTML = text;

  var el = document.getElementById('recovery');
  addButtonAction(el, function() {
    showSavegameRecoveryDialog();
  });
}

var showing_help = false; // for medal

function createHelpDialog() {
  showing_help = true;
  var dialog = createDialog(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, function() {
    showing_help = false;
  });

  var titleFlex = new Flex(dialog.content, 0, 0.01, 1, 0.11);
  centerText2(titleFlex.div);
  titleFlex.div.textEl.innerText = 'Help';

  var scrollFlex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1);
  makeScrollable(scrollFlex);

  var pos = 0.05;
  var buttondiv;
  var h = 0.06;

  var makeButton = function(text) {
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(scrollFlex, 0.08, pos, 0.92, pos + h);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    button.textEl.innerText = text;
    return button;
  };

  var addSpacer = function() {
    pos += h * 0.5;
  };
  var tempFlex = new Flex(scrollFlex, 0.1, pos, 0.9, pos + h);
  tempFlex.div.innerText = 'More help topics will appear here as more features unlock';
  pos += h;

  var button;

  button = makeButton('Main help');
  addButtonAction(button, createMainHelpDialog);

  button = makeButton('Keyboard shortcuts');
  addButtonAction(button, createKeyboardHelpDialog);

  button = makeButton('Number format help');
  addButtonAction(button, function() {createNumberFormatHelp(notations, Num.precision)});

  if(state.g_numfruits > 0) {
    button = makeButton('Fruit help');
    addButtonAction(button, createFruitHelp);
  }

  if(haveAutomaton()) {
    button = makeButton('Blueprint help');
    addButtonAction(button, showBluePrintHelp);
  }

  button = makeButton('Recovery saves');
  addButtonAction(button, function(e) {
    showSavegameRecoveryDialog()
  });

  addSpacer();

  var added = false;

  for(var i = 0; i < registered_help_dialogs_order.length; i++) {
    var id = registered_help_dialogs_order[i];
    if(!state.help_seen_text[id] && !state.help_seen[id]) continue;
    var d = registered_help_dialogs[id];

    if(!added) {
      var tempFlex = new Flex(scrollFlex, 0.1, pos, 0.9, pos + h);
      tempFlex.div.innerText = 'Dynamic help dialogs';
      pos += h;
      added = true;
    }

    button = makeButton(d.name);
    addButtonAction(button, bind(function(id) {
      showRegisteredHelpDialog(id, true);},
    id));
  }

  addSpacer();

  var moreFlex = new Flex(scrollFlex, 0.1, pos, 0.9, pos + h);
  moreFlex.div.innerText = 'More help topics may appear here as the game progresses. Any in-game help dialog that pops up will become permanently available here once it\'s unlocked';
}


// shows a subset of the dynamic registered help buttons, for automaton related topics only
function createAutomatonHelpDialog() {
  showing_help = true;
  var dialog = createDialog2({
    title:'Automaton help',
    scrollable:true,
    onclose:function() {
      showing_help = false;
    }
  });


  var scrollFlex = dialog.content;
  makeScrollable(scrollFlex);

  var pos = 0.05;
  var buttondiv;
  var h = 0.06;

  var makeButton = function(text) {
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(scrollFlex, 0.08, pos, 0.92, pos + h);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    button.textEl.innerText = text;
    return button;
  };

  var ids = [28, 29, 30, 31, 32, 33];

  for(var i = 0; i < ids.length; i++) {
    var id = ids[i];
    if(!state.help_seen_text[id] && !state.help_seen[id]) continue;
    var d = registered_help_dialogs[id];

    var button = makeButton(d.name);
    addButtonAction(button, bind(function(id) {
      showRegisteredHelpDialog(id, true);},
    id));
  }

  var moreFlex = new Flex(scrollFlex, 0.1, pos, 0.9, pos + h);
  moreFlex.div.innerText = 'More help topics may appear here as the game progresses. Any in-game automaton-related help dialog that pops up will become permanently available here (as well as the main help dialog) once it\'s unlocked';
}


var prevArrowCode = 0;
var prevArrowX = 0;
var prevArrowY = 0;
var prevArrowNumTabs = 0;

// also updates them
function showHelpArrows() {
  if(!fieldDivs) return; // field not rendered yet, some divs for arrows don't yet exist

  if(state.g_numresets > 3 && arrows.length == 0) return; // arrows cannot appear that late, no need to execute the rest of this function.

  if(prevArrowNumTabs != numtabs) {
    // a new tab appeared (e.g. achievements after receiving the first one), some of the below arrows may be pointing at the wrong one now so force update this way
    prevArrowNumTabs = numtabs;
    prevArrowCode = -1;
  }

  var arrowCode = 0;
  var numplanted = state.c_numplanted + state.c_numplantedbrassica;

  // planting first watercress
  if(!arrowCode && state.g_numresets < 1 && state.res.seeds.ger(10) && numplanted == 0) {
    var watercress_chip = dialog_level > 0 ? document.getElementById('help_arrow_plant_watercress') : null;
    if(watercress_chip) {
      arrowCode = 2;
      if(prevArrowCode != arrowCode || arrows.length == 0) {
        removeAllArrows();
        makeArrow2(fieldDivs[1][1].div, 0.9, 0.9, watercress_chip, 0.8, 0.8);
        //if(prevArrowCode != arrowCode) showMessage('plant watercress in any field cell', C_HELP, 0, 0);
      }
    } else {
      arrowCode = 1;
      if(prevArrowCode != arrowCode || arrows.length == 0) {
        removeAllArrows();
        makeArrow2(fieldDivs[1][1].div, 0.9, 0.9, fieldDivs[0][0].div, 0.8, 0.8);
        //if(prevArrowCode != arrowCode) showMessage('plant watercress in any field cell', C_HELP, 0, 0);
      }
    }
  }

  // upgrading watercress
  if(!arrowCode && state.g_numresets < 1 && state.upgrades[brassicamul_0].unlocked && state.upgrades[brassicamul_0].count == 0 && !state.upgrades[berryunlock_0].unlocked) {
    // TODO: get better way to refer to a particular upgrade chip (in this case the watercress one)
    var text = 'upgrade watercress';
    var alreadyRelated = (prevArrowCode >= 3 && prevArrowCode <= 5);
    if(state.currentTab == 1 && upgradeFlexCache[0]) {
      arrowCode = 3;
      if(prevArrowCode != arrowCode || arrows.length == 0) {
        removeAllArrows();
        makeArrow2(contentFlex.div, 0.6, 0.2, upgradeFlexCache[0].div, 0.85, 0.5);
        //if(!alreadyRelated) showMessage(text, C_HELP, 0, 0);
      }
    } else if(showingSidePanel && bottomrightSidePanelFlexCache[1]) {
      arrowCode = 4;
      if(prevArrowCode != arrowCode || arrows.length == 0) {
        removeAllArrows();
        makeArrow2(contentFlex.div, 0.9, 0.2, bottomrightSidePanelFlexCache[1].div, 0.15, 0.5);
        //if(!alreadyRelated) showMessage(text, C_HELP, 0, 0);
      }
    } else if(!showingSidePanel) {
      arrowCode = 5;
      if(prevArrowCode != arrowCode || arrows.length == 0) {
        removeAllArrows();
        makeArrow2(contentFlex.div, 0.6, 0.2, tabbuttons[1], 0.5, 1.0);
        //if(!alreadyRelated) showMessage(text, C_HELP, 0, 0);
      }
    }
  }

  // unlocking blackberry
  if(!arrowCode && state.g_numresets < 1 && state.upgrades[berryunlock_0].unlocked && state.upgrades[berryunlock_0].count == 0 && state.res.seeds.ger(1000)) {
    var text = 'unlock blackberry';
    var alreadyRelated = (prevArrowCode >= 6 && prevArrowCode <= 8);
    if(state.currentTab == 1 && upgradeFlexCache[0]) {
      arrowCode = 6;
      if(prevArrowCode != arrowCode || arrows.length == 0) {
        removeAllArrows();
        makeArrow2(contentFlex.div, 0.6, 0.2, upgradeFlexCache[0].div, 0.85, 0.5);
        //if(!alreadyRelated) showMessage(text, C_HELP, 0, 0);
      }
    } else if(showingSidePanel && bottomrightSidePanelFlexCache[1]) {
      arrowCode = 7;
      if(prevArrowCode != arrowCode || arrows.length == 0) {
        if(bottomrightSidePanelFlexCache[1]) {
          removeAllArrows();
          makeArrow2(contentFlex.div, 0.9, 0.3, bottomrightSidePanelFlexCache[1].div, 0.25, 0.7);
          //if(!alreadyRelated) showMessage(text, C_HELP, 0, 0);
        }
      }
    } else if(!showingSidePanel) {
      arrowCode = 8;
      if(prevArrowCode != arrowCode || arrows.length == 0) {
        removeAllArrows();
        makeArrow2(contentFlex.div, 0.6, 0.2, tabbuttons[1], 0.5, 1.0);
        //if(!alreadyRelated) showMessage(text, C_HELP, 0, 0);
      }
    }
  }

  // planting first blackberry
  if(!arrowCode && state.g_numresets < 1 && state.res.seeds.ger(1000) && !!state.upgrades[berryunlock_0].count && !(state.upgrades[berryunlock_1].unlocked || state.cropcount[berry_0])) {
    var watercress_chip = dialog_level > 0 ? document.getElementById('help_arrow_plant_blackberry') : null;
    if(watercress_chip) {
      arrowCode = 9;
      if(prevArrowCode != arrowCode || arrows.length == 0) {
        removeAllArrows();
        makeArrow2(fieldDivs[1][1].div, 0.9, 0.9, watercress_chip, 0.8, 0.8);
        //if(prevArrowCode != arrowCode) showMessage('plant watercress in any field cell', C_HELP, 0, 0);
      }
    } else {
      arrowCode = 10;
      if(prevArrowCode != arrowCode || arrows.length == 0 || state.field[prevArrowY][prevArrowX].index != 0) {
        removeAllArrows();
        var ax = 0;
        var ay = 0;
        var found = false;
        for(var y = 0; y < state.numh; y++) {
          for(var x = 0; x < state.numw; x++) {
            var f = state.field[y][x];
            if(f.index == 0) {
              found = true;
              ax = x;
              ay = y;
              y = state.numh;
              break;
            }
          }
        }
        if(found) {
          var ax2 = ax + 1;
          var ay2 = ay + 1;
          var ox = 0.9;
          var oy = 0.9;
          var dx = 0.8;
          var dy = 0.8;
          if(ax2 >= state.numw) {
            ax2 = ax - 1;
            ox = 0.1;
            dx = 0.2;
          }
          if(ay2 >= state.numh) {
            ay2 = ay - 1;
            oy = 0.1;
            dy = 0.2;
          }
          makeArrow2(fieldDivs[ay2][ax2].div, ox, oy, fieldDivs[ay][ax].div, dx, dy);
          //if(prevArrowCode != arrowCode) showMessage('plant watercress in any field cell', C_HELP, 0, 0);
          prevArrowX = ax;
          prevArrowY = ay;
        }
      }
    }
  }

  if(arrowCode == 0) removeAllArrows();
  prevArrowCode = arrowCode;
}
