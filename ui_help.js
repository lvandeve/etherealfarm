/*
Ethereal Farm
Copyright (C) 2020-2026  Lode Vandevenne

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

  registerAction(helpChipFlex.div, removeHelpChip, 'close message chip', {
    short_only: true
  });
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

  var title = registered_help_dialogs[id].name;
  numhelpdialogs++;
  var dialog = createDialog({
    size:(images ? DIALOG_LARGE : DIALOG_MEDIUM),
    title:title,
    icon:image,
    functions:okfun,
    names:oktext,
    cancelname:'ok',
    invbold:true,
    onclose:function() {
      numhelpdialogs--;
      if(helpDialogQueue.length) {
        var args = Array.prototype.slice.call(helpDialogQueue[0], 0);
        args[7] = true; // opt_recursive
        helpDialogQueue.shift();
        showHelpDialog.apply(this, args);
      }
    },
    bgstyle:'efDialogTranslucent'
  });

  var fx0 = 0;
  var fy0 = 0;
  var fx1 = 1;
  var fy1 = 0.8;


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
        // 101% instead of 100% so that there can't be line gaps between full images that tile together
        var canvas = createCanvas('0%', '0%', '101%', '101%', canvasflex.div);
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
  d.text = text; // this may also be a function that returns text instead, for dynamic texts
  d.image = image;
  d.opt_text2 = opt_text2;
  d.images = images;
}

// returns whether an actual dialog was shown (and not just log messages or nothing)
// set id to a negative value to not show the dialog, but only unlock it for the dynamic help system
function showRegisteredHelpDialog(id, opt_force)  {
  var neg = id < 0;
  id = Math.abs(id);
  var d = registered_help_dialogs[id];
  if(!d) return;
  var text = (typeof d.text == 'function') ? d.text() : d.text;
  return showHelpDialog(d.id * (neg ? -1 : 1), d.text_short, text, d.image, d.opt_text2, d.images, opt_force);
}

// unlock a registered help dialog in the help menu, without actually showing it now
function unlockRegisteredHelpDialog(id) {
  if(state.help_seen_text[id] != id) showMessage('Unlocked dynamic help dialog: ' + registered_help_dialogs[id].text_short, C_HELP);
  state.help_seen_text[id] = id;
}


registerHelpDialog(8, 'Upgrades', 'You unlocked your first upgrade!',
    'You unlocked your first upgrade! Upgrades can unlock new crops, upgrade existing crops, or have various other effects. Upgrades usually cost seeds.<br><br>Upgrades can be performed in the "upgrades" tab. Depending on screen size, it may also be available directly on the right side of the screen.');

registerHelpDialog(3, 'Permanent crop & watercress copying', 'You unlocked your first permanent type of plant.',
    'You unlocked your first permanent type of plant. Plants like this don\'t wither, keep producing forever, and have much more powerful production upgrades too.' +
    '<br><br>'+
    'Watercress also remains useful: if you plant a watercress next to permanent plants, it copies all its orthogonal neighbors\' production, no matter how high level it is. However there\'s a penalty to copying for having many watercress, so max 1 or 2 makes sense.' +
    '<br><br>'+
    'TIP: See shortcuts in the main help menu for various shortcuts that make planting easier ("p" or shift+click to plant last crop, ctrl+click to plant watercress, ...).',
    undefined,
    '<br><br>'+
    'The image below shows an optimal configuration to use for watercress copying: it duplicates the production of 4 blackberries:',
    [[undefined,blackberry[4],undefined],[blackberry[4],images_watercress[4],blackberry[4]],[undefined,blackberry[4],undefined]]);



registerHelpDialog(19, 'Mushrooms', 'You unlocked your first type of mushroom',
               'You unlocked your first type of mushroom. Mushrooms produce spores, but they consume seeds from orthogonally touching berries. If the berry cannot produce enough seeds for the mushroom, the mushroom produces less spores.' +
               '<br><br>' +
               'Spores let the tree level up (but mushrooms don\'t have to touch the tree), unlocking next kinds of bonuses.' +
               '<br><br>' +
               'The mushroom can (and should!) be boosted by flowers. This boosts its production, but also increases its seed consumption.' +
               '<br><br>' +
               'Leave some berries without mushrooms too, otherwise you won\'t get enough seed production for next upgrades and crops.',
               undefined,
               '<br><br>'+
               'The image shows a possible configuration for mushrooms: it extracts seeds from the berry it touches. In addition, both the mushroom and berry are boosted by flowers. In addition, there\'s another berry that doesn\'t touch a mushroom so that there\'s some global seed production too.',
               [[champignon[4],blueberry[4], undefined],
                [images_anemone[4],images_anemone[4], undefined],
                [blueberry[4], images_anemone[4], undefined]]);

registerHelpDialog(20, 'Flowers', 'You unlocked your first type of flower',
               'You unlocked your first type of flower. Flowers boost resource-producing crops such as berries and mushrooms, if planted next to them. It can boost all the 4 orthogonal neighboring crops.',
               undefined,
               '<br><br>'+
               'The image shows a possible good configuration for flower boost: multiple flowers boost multiple berries. The center-most blackberry is receiving the boost 4 times.',
               [
                 [blackberry[4],images_anemone[4],blackberry[4]],
                 [images_anemone[4],blackberry[4],images_anemone[4]],
                 [blackberry[4],images_anemone[4],blackberry[4]],
               ]);

registerHelpDialog(21, 'Nettles', 'Unlocked a new crop: nettle. Nettle boosts mushrooms it touches orthogonally, but hurts flowers and berries.',
  'Unlocked a new crop: nettle. Nettle boosts mushrooms it touches orthogonally, but hurts flowers and berries. The mushroom boost increases spore production without increasing seeds consumption. The boost is an additional multiplier independent from flower boost to mushroom, so having both a nettle and a flower works even better.',
  images_nettle[4],
  '<br><br>'+
  'The image shows a possible configuration where the mushroom receives boost from both nettle (top) and flower (bottom). The top left flower and top right blackberry in this image however are negatively affected by the nettle.',
  [[images_anemone[4],images_nettle[4],blackberry[4]],
   [blueberry[4],champignon[4],blueberry[4]],
   [images_clover[4],images_clover[4],images_clover[4]]]);


registerHelpDialog(6, 'Tree leveled up', 'Tree leveled up', 'Thanks to spores, the tree completely rejuvenated and is now a ' + tree_images[treeLevelIndex(1)][0] + ', level ' + 1 + '. More spores will level up the tree more. The tree can unlock abilities and more at higher levels. Click the tree in the field for more info.',
    undefined, undefined, [[undefined, tree_images[treeLevelIndex(1)][1][0]], [undefined, tree_images[treeLevelIndex(1)][2][0]]]);


registerHelpDialog(12, 'Sun ability', 'Tree reached level 2 and discovered sun ability', 'The tree reached level ' + 2 + ' and discovered the sun ability!<br><br>' + upgrades[upgrade_sununlock].description, image_sun);
registerHelpDialog(14, 'Mist ability', 'Tree reached level 4 and discovered mist ability', 'The tree reached level ' + 4 + ' and discovered the mist ability! You now have multiple abilities, only one ability can be active at the same time.<br><br>' + upgrades[upgrade_mistunlock].description, image_mist);
registerHelpDialog(15, 'Rainbow ability', 'Tree reached level 6 and discovered rainbow ability', 'The tree reached level ' + 6 + ' and discovered the rainbow ability!<br><br>' + upgrades[upgrade_rainbowunlock].description, image_rainbow);
registerHelpDialog(2, 'Tree dropped fruit', 'Tree reached level 5 and dropped a fruit', 'The tree reached level ' + 5 + ' and dropped a fruit! Fruits provide boosts and can be upgraded with fruit essence. Essence is gained by sacrificing fruits, and the full amount of fruit essence can be used for upgrading all other fruits at the same time. See the "fruit" tab, it also has a more extensive help dialog for fruits.<br><br>A possible strategy: keep fruits with good abilities you like. Sacrifice any other surplus fruits, so you can use the essence to upgrade the good fruits.', images_apple[0]);
registerHelpDialog(18, 'Tree dropped better fruit', 'Tree reached level 15 and dropped another fruit', 'The tree reached level ' + 15 + ' and dropped another fruit! It drops one every 5 levels. Fruits from higher tree levels have random probability to be of better, higher tier, types.', images_apple[1]);


registerHelpDialog(7, 'Tree can transcend', 'Tree reached level 10 and it\'s now possible to transcend',
    'The tree reached adulthood at level 10, and is now able to transcend! Click the tree in the field to view the transcension dialog.<br><br>Transcension will restart the basic field from the beginning, but will unlock a new type of field and a new type of upgrades. You can choose to transcend now, or level the tree a bit more first and transcend later.<br><br> The tree also dropped another fruit, check the fruit tab whether you want to keep it since it\'s in the sacrificial pool for now.',
    undefined, undefined, [[undefined, tree_images[treeLevelIndex(10)][1][0]], [undefined, tree_images[treeLevelIndex(10)][2][0]]]);


registerHelpDialog(1, 'Transcension', 'You performed your first transcension! You can use resin in the ethereal field tab.', 'You performed your first transcension! Check the new ethereal field tab, spend resin on ethereal plants for bonuses to your basic field. Get more resin by transcending again.',
  undefined,
  '<br><br>The following image shows an example of an ethereal field setup with several ethereal crops that give boosts to the main field: all types of basic field berries, mushrooms and flowers are boosted by this example, and runs start with starting seeds from the fern. The image also shows a white lotus that boosts the neighboring ethereal crops to make their boosts even bigger.',
  [[image_fern_as_crop[4],images_anemone[4],undefined],
   [blackberry[4],images_whitelotus[4],champignon[4]],
   [undefined,blackberry[4],undefined]]);

// obsolete: the transcension II system is gone
//registerHelpDialog(23, 'Transcension II', 'Tree reached level 20 and Transcension II with more bonus is unlocked', 'The tree reached level ' + 20 + '. Transcension now turned into Transcension II, and doubles the amount of resin you receive upon transcending. This will continue at later tree levels as well: tree level 30 unlocks transcension III which triples resin, and so on',
//    undefined, undefined, [[undefined, tree_images[treeLevelIndex(20)][1][0]], [undefined, tree_images[treeLevelIndex(20)][2][0]]]);

registerHelpDialog(9, 'Ethereal upgrades', 'You unlocked your first ethereal upgrade!', 'You unlocked your first ethereal upgrade, thanks to planting an ethereal crop! Check the new "ethereal upgrades" tab to view this new type of upgrade. Ethereal upgrades cost resin, just like ethereal plants do, but ethereal upgrades are permanent and non-refundable, unlike ethereal crops which can be deleted give 100% refund');

registerHelpDialog(17, 'Mistletoes', 'Unlocked a new crop: mistletoe',
  'Unlocked a new crop: mistletoe. Mistletoe can be placed next to the basic field tree to create twigs, orthogonally, not diagonally. They produce twigs, which, like resin, you only actually get when transcending. Twigs help the ethereal field tree. However having more than one mistletoe increases the spore requirement for leveling the basic tree and slightly decreases resin gain, and more mistletoes give diminishing returns (but still increases it). Mistletoes that are not planted next to the tree do nothing at all.',
  images_mistletoe[4],
  '<br><br>'+
  'The image shows a possible configuration where mistletoes are next to the tree and thus give twigs on tree level up.',
  [[tree_images[treeLevelIndex(2)][1][0], images_mistletoe[4]], [tree_images[treeLevelIndex(2)][2][0], images_mistletoe[4]]]);


registerHelpDialog(22, 'Ethereal tree leveled up', 'The ethereal tree leveled up, unlocking new ethereal upgrades, crops and boosts',
    'Thanks to twigs, the ethereal tree leveled up! This is the tree in the ethereal field, not the one in the basic field. Leveling up the ethereal tree unlocks new ethereal crops and/or upgrades, depending on the level. Each level also provides a resin production boost to the basic tree.',
    undefined, undefined, [[undefined, tree_images[treeLevelIndex(1)][1][4]], [undefined, tree_images[treeLevelIndex(1)][2][4]]]);

registerHelpDialog(24, 'Challenges', 'You unlocked a challenge!',
    'You unlocked a challenge! Challenges can be accessed from the tree, as an alternative to regular transcension. All challenges give a production bonus (to seeds and spores, and a smaller amount to resin and twigs) for highest tree level reached. Challenges may also give one-time rewards for successfully reaching a certain level. Challenges can be ran as many times as desired, redoing them can increase the max level reached.',
    undefined);


registerHelpDialog(25, 'Bee challenge', undefined,
    'You started the bee challenge! Rules are different from the standard game. You can click the tree at any time to view the current challenge rules, reward and stats. Plant some watercress or blackberry to get started.',
    images_queenbee[4],
    '<br><br>'+
    'The image below shows a possible configuration for the bees: all workers touch a flower as required, drones touch workers for extra boost (so bees provide a boost-boost), and queens touch drones to make that boost stronger (a boost-boost-boost). More than 1 flower does not increase boost but multiple drones or queens do. The rightmost worker bee gives most boost because it touches 3 drones, and the topmost drone gives least boost since it touches the least queens. You can fill in gaps in the picture where more drones or queens would increase the boost more. Not shown in the picture is that you also need some mushroom and berry production running somewhere, which can also be boosted by flowers in the standard way.',
    [[undefined, images_workerbee[4], images_dronebee[4], images_queenbee[4]],
     [images_workerbee[4], images_aster[4], images_workerbee[4], images_dronebee[4]],
     [undefined, images_workerbee[4], images_dronebee[4], images_queenbee[4]],
     [undefined, images_dronebee[4], images_queenbee[4], undefined],
    ]);

registerHelpDialog(26, 'Challenge completed', '',
    'The tree reached the challenge\'s target level, you can successfully complete the challenge and can get its main reward! You can complete the challenge from the tree dialog, or continue to reach a higher level for more challenge max-level bonus. You can also replay the challenge at any later time to increase the max level.',
    undefined);

registerHelpDialog(27, 'Bees', 'You unlocked bees!',
  'You unlocked bees! Bees boost orthogonally neighboring flowers (in spring also diagonally), while flowers boost berries and mushrooms (so bees are a boost of a boost). This adds a new independent multiplier that can be upgraded to the game.',
  images_beenest[4],
  '<br><br>'+
  'The image shows a possible configuration for bees, such that the bees boost flowers, which in turn boost berries and mushrooms. It\'s ensured both the mushroom and the berry it consumes from have a bee-boosted flower.',
  [
    [undefined,grape[4],images_daisy[4],grape[4]],
    [grape[4],images_daisy[4],images_beenest[4],images_daisy[4]],
    [undefined,grape[4],images_daisy[4],grape[4]],
    [undefined,images_beenest[4],images_daisy[4],amanita[4]],
  ]);


registerHelpDialog(28, 'Automaton & Blueprints', 'You unlocked the automaton!',
    'You unlocked the automaton! You can place the automaton in the ethereal field. When placed, it gives a boost to neighbors, the automaton tab, and blueprints library in the tree, allowing to automate various parts of the game.<br><br>' +
    'You must place the automaton in the ethereal field before this works, then go to the new automaton tab, and configure its settings before it actually automates anything.<br><br>More and more automation features become available later in the game.<br><br>' +
    'When removing the automaton from the ethereal field, most automation features will be disabled, but they all come back the way they were when placing the automaton again.<br><br>' +
    'The following new UIs are unlocked:<br>' +
    ' • Automaton tab.<br>' +
    ' • Blueprint library, accessible from the tree, both for basic field and ethereal field.<br>' +
    '<br>' +
    'The automaton initially has the following features unlocked:<br>' +
    ' • Blueprints and templates: Templates are translucent blue looking versions of crops that can be placed in the field using the regular planting menu. Blueprints can be created and placed from the blueprint library, accessible from the tree.<br>' +
    ' • Auto-plant: the automaton will automatically plant crops according to a blueprint, and plant higher tiers once you unlock those tiers.<br>' +
    ' • Buttons to delete all crops in the main field or in the ethereal field: these are in the automaton tab and are for convenience.<br>' +
    ' • Neighbor boost in the ethereal field: the automaton in the ethereal field gives an independent boost to neighbors, similar to lotuses.<br>' +
    '',
    images_automaton[4],
    undefined,
  [[undefined,images_flowertemplate[4],undefined],
   [images_flowertemplate[4],images_berrytemplate[4],images_flowertemplate[4]],
   [undefined,images_flowertemplate[4],undefined]]);

registerHelpDialog(29, 'Auto upgrades', 'You unlocked auto upgrades!',
    'You unlocked auto-upgrades for the automaton! See the automaton tab. You can enable or disable auto-upgrades, and choose a max cost the automaton is allowed to spend.<br><br>All basic upgrades that boost crops will be automatically performed by the automaton, at their normal cost, when enabled.<br><br>In addition, you can automate the choice upgrades, but you must configure which choice for which upgrade you prefer in the automaton settings first.',
    images_automaton[4]);

registerHelpDialog(30, 'Auto upgrades more options', 'You unlocked more auto upgrade options!',
    'You unlocked more finetuning options for the auto upgrades. See the automaton tab in the dialogs behind the "gear": you can now configure the max cost per crop type (berry, mushroom, flower, ...).',
    images_automaton[4]);

registerHelpDialog(31, 'Auto plant', 'You unlocked auto plant!',
    'You unlocked auto-planting for the automaton! See the automaton tab. You can enable or disable auto-plant, and choose a max cost the automaton is allowed to spend.<br><br>How this works: the automaton will replace existing crops or blueprint templates with a higher tier, if that higher tier is unlocked. The automaton will not plant new crops from scratch, and will only replace crops or blueprint templates of the same type, e.g. berry to berry, flower to flower, ...<br><br>For example: If you have a blackberry, and now unlock blueberry, the automaton will automatically replace all planted blackberries in the field with blueberries, given enough resources.',
    images_automaton[4]);

registerHelpDialog(32, 'Auto plant more options', 'You unlocked auto plant more options!',
    'You unlocked more finetuning options for auto planting, you can now choose how many resources the automaton can spend on crops of each type. Use the "gear" button next to the auto-plant button to finetune these options',
    images_automaton[4]);

registerHelpDialog(33, 'Auto unlock', 'You unlocked auto-unlock!',
    'You unlocked auto-unlock. This will unlock the next tiers of crops automatically. Combined with auto-plant and blueprint templates, this can almost fully automate a run.<br><br>Once you planted the general shape of your field with cheap crops or blueprint templates, everything will happen automatically from then on. Just place berries, mushrooms, flowers, nettles and bees once to indicate the layout.<br><br>Tip: ensure there are some berries that don\'t touch a mushroom, because if a mushroom consumes all seeds of a berry, income will stop and the automaton won\'t get resources for further upgrades and planting, resulting in a deadlock.',
    images_automaton[4]);

registerHelpDialog(34, 'Multiplicity', 'You unlocked multiplicity! Mushrooms and berries boost each other no matter at what location.',
    'You unlocked multiplicity! Berries now boost other berries just by having multiple anywhere in the field, and similarly, mushrooms boost mushrooms. This works across tiers, but max 1 tier higher or lower (e.g. blackberry affects blueberry, but it won\'t affect the 2-higher tier cranberry). For example, if there are 4 berry plants anywhere in the field, each berry receives a boost from the three others. Crops that are growing already fully count for multiplicity.',
    blackberry[4],
    undefined,
  [[blackberry[4],undefined,blueberry[4]],
   [undefined,undefined,undefined],
   [blueberry[4],undefined,blackberry[4]]]);

registerHelpDialog(35, 'Squirrel & Nuts', 'You unlocked the squirrel and the nuts crops!',
    `You unlocked the squirrel and the nuts crops! The squirrel gives an entirely new tech tree of ugrades. Place a squirrel in the ethereal field (it\'ll also boost neighbors!). Grow nuts in the main field using the new nuts crops. Use nuts to buy squirrel upgrades, in the new squirrel tab.
    <br><br>
    Nuts crops unlock at tree level 45, the first one is Acorn. You can have max 1 nut crop in the main field, but it can be upgraded and replaced with better types. Nuts crops benefit from flowers, but only in a limited form independent of flower upgrades or bees, nuts crops are not affected by the same boosts as berries or mushrooms, they have their own more limited boosts. Watercress can copy from nuts, but only at half effectiveness and without fruit bonus. Nuts are negatively affected by winter if not next to tree, just like most crops.
    <br><br>
    Buy squirrel upgrades in the squirrel tab. Squirrel upgrades are laid out in a tech tree. Each next squirrel upgrade costs exponentially more than the previous one, no matter what order you do them in. Get higher tree levels and nut crops to get enough nuts for the next one.
    <br><br>
    You can respec the squirrel upgrades if you regret a decision, using a respec token. You get a few for free, more can be gotten for amber in the amber tab.
    <br><br>
    After you respec squirrel upgrades at least once, the "buy all to here" option unlocks for upgrades you have seen before: click the upgrade icon of any squirrel upgrade further down in the tree, then use this button to automatically buy this upgrade and all squirrel upgrades required to reach this one (including all of gated stages), if you can afford it. This avoid having to click every individual upgrade again after respec.
    <br><br>
    Planting and upgrading nuts crops cost spores instead of seeds. They work with automaton just like most other crops. If the automaton is spending too much spores on nuts upgrades and you want the tree to level up instead, decrease the allowed % setting for nuts upgrades in the automaton settings.
    `,
    images_squirrel[4],
    undefined,
  [[mulberry[4],images_iris[4],mulberry[4]],
   [images_iris[4],images_acorn[4],images_watercress[4]],
   [mulberry[4],images_iris[4],mulberry[4]]]);

registerHelpDialog(36, 'Amber', 'The tree dropped amber!',
    `The tree dropped a piece of amber! From now on, every now and then, the tree can drop amber when it levels up.
    <br><br>
    Amber can be used in the new amber tab for various effects.
    <br><br>
    Effects:
    <br>
    • Production boost 100%: gives a 100% boost to berries and mushrooms for the entire run, this lasts until next transcension.
    <br>
    • Season hold this run: Keep the current season until transcension, it won\'t change until the run is done. Ending the run will start the next season with 24 hours left. If the run is finished early (current season didn\'t need to be held), it\'ll give a full refund of the amber cost and no seasons are affected.
    <br>
    • Season +1h: Make the current season 1 hour longer (1-time). Can be used once per season.
    <br>
    • Season -1h: Make the current season 1 hour shorter (1-time). If the season has less than 1 hour remaining, then it is only shortened by this remaining time, immediately activating the next season. Can be used once per season.
    <br>
    • Reset choice upgrades: Resets all choice upgrades, this can be used once per run and allows choosing each one again manually.
    <br>
    • More unlock later
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
    Combinations that don\'t cover all 4 seasons, such as mango+plum, won\'t work, it must be one of the combinations listed above.
    <br><br>
    Remember, star fruit fusing is not yet available if you just unlocked the first fruit mixing upgrade now, the star fruit requires the second such squirrel upgrade. Now you already know how to prepare for it though.
    `,
    images_apple[8],
    undefined,
  [[images_apricot[1],images_pineapple[1],images_pear[8]],
   [images_medlar[1],images_mango[4],images_plum[7]],
   [images_quince[4],images_kumquat[1],images_starfruit[9]]]);

registerHelpDialog(38, 'Auto prestige', 'You unlocked auto prestige!',
    'You unlocked auto-prestige for the automaton! This is integrated with auto-unlock: the same cost settings of auto-unlock are used for auto-prestige, and you can use a toggle to enable/disable auto-prestige in the auto-unlock settings.',
    images_automaton[4]);

registerHelpDialog(39, 'Squirrel evolution', 'Squirrel evolution',
    function() { return getSquirrelEvolutionHelp(1); },
    image_squirrel_evolution);

registerHelpDialog(40, 'Auto action', 'You unlocked auto actions by the automaton!',
    'You unlocked auto actions by the automaton! This lets the automaton override the field with another blueprint and/or pick a fruit after a chosen trigger, such as tree level, unlocked crop or time.<br><br>You must enable and configure this feature in the automaton tab before it works, using the auto-action toggle and configuration buttons. You must configure both a trigger, and the action(s), and set buttons and checkboxes to enabled. The first one is special, its trigger cannot be changed but is always "at start of run".<br><br>' + autoBlueprintHelp,
    images_automaton[4]);

registerHelpDialog(41, 'Ethereal mistletoe', 'You got the ethereal mistletoe!',
    `You got the ethereal mistletoe!
    <br><br>
    This crop has more effect the more you upgrade it. Upgrades cost time, and most don't cost other resources except some with other costs that unlock later.
    <br><br>
    The evolve upgrade will unlock new upgrades at certain levels, and also gives a boost to the effects of all other upgrades at the same time. The first such upgrade unlocks after the first evolve, the next only at the third evolve, and more follow after that. Evolve does not reset current upgrades, they keep existing at their level and can still be leveled up as normal.
    <br><br>
    The ethereal mistletoe must be planted orthogonally (not diagonally) next to the ethereal tree, otherwise none of its effects work and its upgrades don't progress.
    <br><br>
    Similar to squirrel and automaton, the ethereal mistletoe can give a boost to neighbors in the ethereal field, but this ability is unlocked only by later upgrades.
    <br><br>
    You can only have one upgrade in progress at the same time. You can always freely stop an upgrade. This pauses the upgrade, it remembers the time spent so far. You can do any other upgrade during this time. Any other resources are also paid back during pause.
    <br><br>
    If the mistletoe is sitting idle and not doing any upgrades, unused idle time is accumulated. Unused idle time will speed up active upgrades by 2x, so unused time is not lost. The mistletoe must still be correctly planted for idle time to accumulate.
    `,
    images_mistletoe[4],
    undefined,
  [[tree_images[treeLevelIndex(15)][1][4],images_mistletoe[4]],
   [tree_images[treeLevelIndex(15)][2][4],undefined]]);

registerHelpDialog(42, 'Infinity field', 'You unlocked the infinity field!',
    `You unlocked the infinity field!
    <br><br>
    The infinity field is a new field in a new tab, in which you can plant infinity crops. Infinity crops produce infinity seeds, which allow planting more and better infinity crops.
    <br><br>
    The crops in the infinity field can give a small production boost to the basic field, which can add up to a better boost if the whole infinity field is filled.
    <br><br>
    Unlike the ethereal field, the infinity field is more focused on growing and improving itself slowly over time with its own resource, rather than merely boosting the basic field.
    <br><br>
    The first crop, a brassica, is not a permanent crop (similar to brassica in basic field, but without the copying ability and longer lifespan), and will need to be planted multiple times to collect enough infinity seeds for better crops. After that, permanent crops will unlock too.
    `,
    image_pond,
    undefined,
  [[field_infinity[0],field_infinity[0],field_infinity[0]],
   [field_infinity[0],image_pond_on_field,field_infinity[0]],
   [field_infinity[0],field_infinity[0],field_infinity[0]]]);

registerHelpDialog(43, 'Infinity pond fishes', 'You unlocked fishes in the infinity pond!',
    `You unlocked fishes in the infinity pond!
    <br><br>
    Fishes cost infinity spores to place. They can be accessed by clicking the pond in the infinity field, then placing fishes on cells of the pond.
    <br><br>
    Fishes upgrade the infinity field in various ways. The location of fishes in the pond does not matter.
    <br><br>
    Some effects from the infinity field that benefit the main field are time-weighted, e.g. the production boost from infinity crops to the basic field. After a few hours, the effect will fully settle.
    `,
    image_goldfish0,
    undefined,
  [[images_pond[0],images_pond[1],images_pond[0]],
   [images_pond[1],images_pond[2],blendImages(images_pond[3], image_goldfish0)],
   [blendImages(images_pond[3], image_koi0),images_pond[1],images_pond[0]]]);

function makeTDHelpDialogImages() {
  var bu = blendImages(images_field[0][0], image_burrow);
  var fi = images_field[0][0];
  var fl = blendImages(images_field[0][0], images_daisy[4]);
  var bb = blendImages(images_field[0][0], grape[4]);
  var mm = blendImages(images_field[0][0], amanita[4]);
  var wc = blendImages(images_field[0][0], images_watercress[4]);
  var zz = blendImages(images_field[0][0], images_beenest[4]);
  var ne = blendImages(images_field[0][0], images_nettle[4]);
  var an = blendImages(images_field[0][0], images_ant[0]);
  var as = blendImages(images_field[0][0], images_ant[2]);
  var ae = blendImages(images_field[0][0], images_ant[1]);
  var sa = blendImages(images_field[0][0], images_statue_splash[4]);
  var tt = blendImages(images_field[0][0], tree_images[treeLevelIndex(20)][1][1]);
  var tb = blendImages(images_field[0][0], tree_images[treeLevelIndex(20)][2][1]);

  return [[bu, fl, zz, fi, fi, ae, fi],
          [fi, wc, fl, fi, mm, bb, fi],
          [as, ne, mm, fi, fi, zz, fi],
          [fi, sa, bb, wc, an, fl, fi],
          [fi, zz, fl, fi, fi, bb, fi],
          [fi, mm, bb, fi, fl, mm, tt],
          [fi, fi, fi, fi, zz, ne, tb]];
}

registerHelpDialog(44, 'Tower defense', 'You started the tower defense challenge!',
    `
    Tower defense plays very different from the regular game, this help summarizes it all.
    <br><br>
    During tower defense, waves of pests will spawn from the burrow at the top left of the field, and want to move to the tree. As soon as any pest reaches the tree, it's game over and the challenge must be ended. Two types crops can attack pests: mushrooms and brassica. All other crops are support crops required to make the mushroom and brassica work.
    <br><br>
    Crop types:<br>
    • mushroom: Requires a neighboring berry, and boosted by flower and nettles as usual. Can attack at range.<br>
    • brassica: Requires neighboring mushroom (diagonal works too) to copy spores from. Can attack directly adjecent pests only, but multiple at the same time.<br>
    • berry: required to make mushrooms work. Produces seeds for the mushroom. Does not produce seeds for the player (seeds are gained from exterminated pests instead)<br>
    • flower: boost neighboring mushrooms and berries as usual<br>
    • bee: boosts neighboring flowers as usual<br>
    • nettle: boosts neighboring mushrooms, but also increases seed consumption, unlike normally<br>
    • statues: different types exist, affects orthogonally or diagonally adjecent mushrooms with improved damage and special effects, see list further in this help for the types and their effects<br>
    <br><br>
    You must exterminate waves of pests to progress to the next level. Pests drop spores and seeds, spores to level up the tree to the next level, seeds to allow building better towers. All crops block the path of pests, so you can build a maze to extend the distance they have to walk to reach the tree. However, it's impossible to close the maze (there must always be some path), and it's impossible to delete crops (but you can change their type).
    <br><br>
    Build a maze first, and press the 'GO' button in the top right when ready to spawn the first wave. If you're much stronger than the first wave, it'll skip ahead to later waves. Before starting the first wave, deleting crops is still possible so you can fix mistakes in the shape of the maze until then.
    <br><br>
    Tips:<br>
    • Ensure a mushroom is surrounced by a flower with bee, a berry with flower with bee, a nettle, and possibly statues and brassica. Missing any of these components makes the mushroom much weaker than is possible.<br>
    • Build a long maze from crops, so that the pests spend a long time to reach it and can be attacked for longer, but also have enough densely packed groups of crops to have mushrooms with all the support crops and multiple statues.<br>
    • Groups of multiple pests are best defeated with splash damage, while a single pest with a lot of health is better dealt with by a sniper tower or towers with many spore statue boosts.<br>
    <br><br>
    Pest types:<br>
    • ant: standard health, standard speed.<br>
    • fire ant: more health, standard speed, resistant to snail statues.<br>
    • beetle: much more health, moves more slowly.<br>
    • tick: comes in a group within a single cell, splash damage is more effective.<br>
    • roach: less health, but moves fast.<br>
    • termite: more health, moves slower, resistant to splash damage and snail statues<br>
    • flea: comes in a group within a single cell (splash damage is more effective), and moves fast<br>
    • aphid: comes in a group within a single cell (splash damage is more effective), and has more health but is slower<br>
    • locust: moves fast<br>
    <br><br>
    Statue effects:<br>
    • spore statue: makes tower stronger. Can be stacked. If two or more statues active, makes the tower focused (extra damage) when there is a small amount of pests on screen.<br>
    • splash statue: makes tower do splash damage (both within single-cell group pests, and to neighboring pests) but do less single-cell damage.<br>
    • range statue: makes tower reach one cell further. Can be stacked.<br>
    • sniper statue: makes tower stronger and reach whole map, but much slower.<br>
    • snail statue: makes tower cause pests to move slower for a fixed amount of steps. Can be stacked.<br>
    • seed statue: makes tower cause pests to drop more resources. Can be stacked.<br>
    <br><br>
    Shortcuts:<br>
    • w: spawn next wave. Same as the 'GO' button. Also required to start the first wave.<br>
    • u: upgrade tower under mouse cursor.<br>
    • d: downgrade tower under mouse cursor (gives refund), if waves not started yet deletes as usual (in regular game, and before waves started, 'd' deletes, 'shift+d' downgrades).<br>
    • shift+p: overplant with picked (with 'p') crop type (same shortcut as in regular game, but useful here to quickly change crop/tower types).<br>
    • ctrl+click a statue: change into next type of statue.<br>
    • ctrl+shift+click a statue: change into previous type of statue.<br>
    • most other shortcuts of the regular game (like p to plant) work too, the above just lists altered or relevant shortcuts.<br>
    <br><br>
    The exact rules of the tower defense challenge:
    <br><br>
    ` + challenges[challenge_towerdefense].getRulesDescription(),
    images_ant[0],
    undefined,
    makeTDHelpDialogImages());

registerHelpDialog(45, 'Auto transcend & Seasons', 'You unlocked auto-transcend!',
    `
    You unlocked auto-transcend and season-based auto-actions!
    <br><br>
    Auto-transcend allows an auto-action to be programmed to transcend, starting a next run.
    <br>
    Ensure that you also have auto-actions programmed to handle the start of a run (such as planting a new blueprint) so that something meaningful will actually happen after the auto-transcend.
    <br>
    Auto-transcend only works max 20 times in a row, but any manual user action (including other actions than transcending) will reset this counter.
    <br>
    When loading a savegame with auto-transcend, loading may be slow (a lot of computation required) to handle all the auto-transcends (it's not the transcending itself that's slow, but the start of a run after that, which has a lot of activity to compute)
    <br><br>
    Season-based auto actions allow to override the effect for chosen seasons.
    <br>
    To use this, press the new "seasonal" button at the bottom of the effects configuration, then enable the "override" checkbox of any season to override, and configure the effect parameters of that season.
    <br>
    In addition, a new action "Hold season (amber)" is now available!
    `,
    image_medaltranscend,
    undefined,
    undefined);


function createKeyboardHelpDialog() {
  var dialog = createDialog({scrollable:true, title:'Shortcuts'});

  var text = '';

  text += '<b>List of keyboard/mobile shortcuts:</b>';
  text += '<br/><br/>';
  if(!haveAutomaton()) {
    text += 'More shortcuts will appear in this list later as you progress through the game.';
    text += '<br/><br/>';
  }
  text += '<b>Mobile shortcuts:</b>';
  text += '<br/><br/>';
  text += ' • long-press icons/buttons to access the shift and ctrl variants of any button (e.g. try the refresh watercress button or the undo button).';
  text += '<br/>';
  text += ' • long-press things to see tooltips, e.g on most buttons in the setting dialogs, or crops on the field.';
  text += '<br/>';
  text += ' • <i>Note</i>: mobile browsers don\'t show scrollbars so you can\'t always see if something is scrollable. The game shows a shadow effect to show scrollable content but this may be subtle. E.g. in the (detailed) stats dialogs of some plants in the field.';
  text += '<br/>';

  text += '<br/><b>Main shortcuts:</b>';
  text += '<br/><br/>';
  text += ' • <i>Note</i>: on mac, ctrl means command instead.';
  text += '<br/>';
  text += ' • <b>esc</b>: close current dialog. If no dialogs are open, shows main menu.';
  text += '<br/>';
  text += ' • <b>"p"</b>: when crop in field under mouse cursor: pick (=remember) this crop for planting. When empty field mouse cursor: plant the remembered crop here (no mouse click required)';
  text += '<br/>';
  text += ' • <b>"shift+p"</b>: similar to p, but always plants, so replaces crop if there is an existing one below the mouse cursor.';
  text += '<br/>';
  text += ' • <b>"d"</b>: delete crop under mouse cursor (no mouse click required)';
  text += '<br/>';
  text += ' • <b>"shift+d"</b>: downgrade tier of crop under mouse cursor, that is keep same type of crop but replace it with the crop that is one tier lower, especially handy in ethereal field (no mouse click required)';
  text += '<br/>';
  text += ' • <b>"u"</b>: upgrade tier: replace crop or template under mouse cursor with highest available tier of the same type that you can afford (no mouse click required)';
  text += '<br/>';
  text += ' • <b>"shift+u"</b>: upgrade tier: similar to "u", but upgrades only one tier higher rather than to the highest available';
  text += '<br/>';
  text += ' • <b>shift + click empty field</b>: plant last planted or unlocked crop type.';
  text += '<br/>';
  text += ' • <b>ctrl + click empty field</b>: plant a watercress (does not affect last planted type for shift key).';
  text += '<br/>';
  text += ' • <b>ctrl + click non-empty field</b>: delete crop.';
  text += '<br/>';
  text += ' • <b>shift + click non-empty field</b>: replace crop.';
  text += '<br/>';
  text += ' • <b>ctrl + shift + click field</b>: upgrade tier: replace crop or template with highest unlocked tier (if enabled in preferences), pick this crop type as last planted, and on empty field, plant highest tier of picked crop type you can afford.';
  text += '<br/>';
  text += ' • <b>"w"</b>: replant watercress on all field tiles that have a watercress remainder, and refresh existing ones. Such a remainder appears for watercress that have been copying from multiple plants, that is, a good copying spot. Copying has diminishing returns if there are multiple watercress anywhere on the map, 1 or 2 is effective (check the seeds/s income to view the effect).';
  text += '<br/>';
  text += ' • <b>"t"</b>: show transcend dialog (if available)';
  text += '<br/>';
  text += ' • <b>"f"</b>: go to the basic field tab';
  text += '<br/>';
  text += ' • <b>"e"</b>: go to the ethereal field tab (if available)';
  text += '<br/>';
  text += ' • <b>"i"</b>: go to the infinity field tab (if available)';
  text += '<br/>';
  text += ' • <b>"ctrl + z"</b>: undo / redo';
  text += '<br/>';
  text += ' • <b>], }, ) or ></b>: select next active fruit. Can be changed in the preferences under "controls" to instead select next game tab.';
  text += '<br/>';
  text += ' • <b>[, {, ( or <</b>: select previous active fruit. Can be changed in the preferences under "controls" to instead select previous game tab.';
  text += '<br/>';
  text += ' • <b>number keys "1-9"</b>: by default, select fruit slot (when available). Can be changed in the preferences under "controls" to instead activate weather, change game tabs or do auto-actions.';
  text += '<br/>';
  text += ' • <b>"shift" + number keys "1-9"</b>: by default, activate weather (1-3). Can be changed in the preferences under "controls" to instead select fruit slots, change game tabs or do auto-actions.';
  text += '<br/>';
  if(state.g_numfruits > 0) {
    text += '<br/><b>Fruits tab:</b>';
    text += '<br/><br/>';
    text += ' • <b>ctrl + click fruit</b>: move fruit between sacrificial and storage slots, if possible.';
    text += '<br/>';
    text += ' • <b>shift + click fruit</b>: same as ctrl + click fruit.';
    text += '<br/>';
    text += ' • <b>shift + click fruit ability upgrade</b>: buy multiple abilities up to 25% of currently available essence.';
    text += '<br/>';
  }
  if(haveAutomaton()) {
    text += '<br/><b>Blueprints:</b>';
    text += '<br/><br/>';
    text += ' • <b>"b"</b>: open the blueprint library, when available.';
    text += '<br/>';
    text += ' • <b>"t" followed by "b"</b>: transcend and open the transcend-with-blueprint dialog.';
    text += '<br/>';
    text += ' • <b>"t" followed by "Enter" or "r"</b>: transcend without blueprint.';
    text += '<br/>';
    text += ' • <b>"t" followed by "c"</b>: transcend and open the start-new-challenge dialog.';
    text += '<br/>';
    text += ' • <b>number keys "1-9" in blueprint selection dialog</b>: open or use this blueprint';
    text += '<br/>';
    text += ' • <b>"shift" + number keys "1-9" in blueprint selection dialog</b>: plant this blueprint (overriding)';
    text += '<br/>';
    text += ' • <b>"p" in blueprint selection dialog</b>: toggle page 1 / page 2';
    text += '<br/>';
    text += ' • <b>shift + click blueprint</b>: immediately plant this blueprint, rather than opening its edit screen.';
    text += '<br/>';
    text += ' • <b>shift + click blueprint "To Field"</b>: plant this blueprint, but let it override non-matching crops. Without shift, it only plants on empty field spots.';
    text += '<br/>';
    text += ' • <b>shift + click squirrel upgrade</b>: when you unlocked this type of upgrades and have respecced at least once: upgrade all upgrades until this one, only available if you can afford it and this upgrade was seen before.';
    text += '<br/>';
    text += ' • <b>"f" in blueprint editing dialog</b>: set blueprint from field.';
    text += '<br/>';
    text += ' • <b>"enter" in blueprint editing dialog</b>: plant blueprint (overriding).';
    text += '<br/>';
  }
  text += '<br/><b>Special button actions:</b>';
  text += '<br/><br/>';
  text += ' • <b>shift + click upgrade</b>: buy as many of this upgrade as you can afford.';
  text += '<br/>';
  text += ' • <b>shift + click undo</b>: save the undo state now, rather than load it. This overwrites your undo so eliminates any chance of undoing now. This will also be overwritten again if you do actions a minute later.';
  text += '<br/>';
  text += ' • <b>shift + click save import dialog</b>: import and old savegame, but force paused state, do not run the time, so you get the resources and season at the time of saving rather than with all production during that time added.';
  text += '<br/>';
  text += ' • <b>ctrl + click save import dialog</b>: import and old savegame, but force non-paused state, even if the savegame was saved while paused, this will cause all time between saving and now to be ran.';
  text += '<br/>';

  text += '<br/><b>Other:</b>';
  text += '<br/><br/>';
  text += ' • <b>ctrl + click dialog close (X) button</b>: close all dialogs (if multiple are open).';

  text += '<br/><br/>';

  dialog.content.div.innerHTML = text;
}

function createMainHelpDialog() {
  var dialog = createDialog({scrollable:true, title:'Help'});

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
  text += 'If something goes wrong with your savegame, there may be a few older recovery savegames. Click <a style="color:#11f;" id="recovery">here</a> to view them.';

  text += '<br/><br/><br/>';
  text += 'Game version: ' + programname + ' v' + formatVersion();
  text += '<br/><br/>';
  text += 'Copyright (c) 2020-2026 by Lode Vandevenne';

  dialog.content.div.innerHTML = text;

  var el = document.getElementById('recovery');
  addButtonAction(el, function() {
    showSavegameRecoveryDialog();
  });
}

var showing_help = false;

function createHelpDialog() {
  showing_help = true; // for achievement
  var dialog = createDialog({
    onclose:function() { showing_help = false; },
    scrollable:true,
    title:'Help'
  });

  checkUnlockedAutomatonHelpDialogs();

  var pos = 0.05;
  var buttondiv;
  var h = 0.06;

  var makeButton = function(text) {
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(dialog.content, 0.08, pos, 0.92, pos + h);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    button.textEl.innerText = text;
    return button;
  };

  var addSpacer = function() {
    pos += h * 0.5;
  };
  //var tempFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h);
  //tempFlex.div.innerText = 'More help topics will appear here as more features unlock';
  //pos += h;

  var button;

  button = makeButton('Main help');
  addButtonAction(button, createMainHelpDialog);

  button = makeButton('Keyboard & mobile shortcuts');
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
      var tempFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h);
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

  var moreFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h);
  moreFlex.div.innerText = 'More help topics may appear here as the game progresses. Any in-game help dialog that pops up will become permanently available here once it\'s unlocked';
}


// shows a subset of the dynamic registered help buttons, for automaton related topics only
function createAutomatonHelpDialog() {
  var dialog = createDialog({
    title:'Automaton help',
    scrollable:true
  });

  checkUnlockedAutomatonHelpDialogs();

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

  var ids = [28, 30, 31, 29, 32, 33, 40, 38, 45];

  for(var i = 0; i < ids.length; i++) {
    var id = ids[i];
    if(!state.help_seen_text[id] && !state.help_seen[id]) continue;
    var d = registered_help_dialogs[id];

    var button = makeButton(d.name);
    addButtonAction(button, bind(function(id) {
      showRegisteredHelpDialog(id, true);},
    id));

    if(i == 0) {
     var button = makeButton('Blueprint help');
      addButtonAction(button, showBluePrintHelp);
    }
  }

  var moreFlex = new Flex(scrollFlex, 0.1, pos, 0.9, pos + h);
  moreFlex.div.innerText = 'More help topics may appear here as the game progresses, when new automaton features get unlocked';
}




var GOAL_index = 0;
var GOAL_NONE = GOAL_index++;
var GOAL_CHALLENGE_INFO = GOAL_index++;
var GOAL_CHALLENGE_FINISH = GOAL_index++;
var GOAL_FERN = GOAL_index++;
var GOAL_WC5 = GOAL_index++;
var GOAL_WC_UPGRADE = GOAL_index++; // skippable
var GOAL_WC10 = GOAL_index++;
var GOAL_BLACKBERRY_UNLOCK = GOAL_index++;
var GOAL_BLACKBERRY_PLANT = GOAL_index++;
var GOAL_FLOWER_UNLOCK = GOAL_index++;
var GOAL_FLOWER_PLANT = GOAL_index++;
var GOAL_BLUEBERRY_UNLOCK = GOAL_index++;
var GOAL_BLUEBERRY_PLANT = GOAL_index++;
var GOAL_CHAMPIGNON_UNLOCK = GOAL_index++;
var GOAL_CHAMPIGNON_PLANT = GOAL_index++;
var GOAL_TREE_LEVELUP = GOAL_index++;
var GOAL_SUN = GOAL_index++;
var GOAL_TREELEVEL_5 = GOAL_index++;
var GOAL_FRUIT_TAB = GOAL_index++;
var GOAL_NETTLE_UNLOCK = GOAL_index++;
var GOAL_NETTLE_PLANT = GOAL_index++;
var GOAL_TREELEVEL_10 = GOAL_index++;
var GOAL_TRANSCEND = GOAL_index++;
var GOAL_ETHEREAL_CROP = GOAL_index++;
var GOAL_ETHEREAL_UPGRADE = GOAL_index++;
var GOAL_COLLECT_RESIN0 = GOAL_index++; // like GOAL_COLLECT_RESIN but with an additional tip in the text
var GOAL_COLLECT_RESIN = GOAL_index++;
var GOAL_COLLECT_RESIN_FOR_MISTLETOE = GOAL_index++;
var GOAL_MISTLETOE_UNLOCK = GOAL_index++;
var GOAL_PRE_MISTLETOE_PLANT = GOAL_index++;
var GOAL_MISTLETOE_PLANT = GOAL_index++;
var GOAL_TREELEVEL2_1 = GOAL_index++;
var GOAL_AUTOMATON_AFFORD = GOAL_index++;
var GOAL_AUTOMATON_UNLOCK = GOAL_index++;
var GOAL_AUTOMATON_PLACE = GOAL_index++;

var prevGoal = GOAL_NONE;
var prevGoalSubCode = 0;

// returns array of 2 values: [goal, subcode]
// goal is the actual goal from the enum values above, or GOAL_NONE if there is no goal (goals are mostly only active as tutorial in the early game)
// subcode is a code that represents unique state within that goal, which changes if e.g. arrow must be pointed at something else. If the value remains the same, no UI updates are needed. Its value does not matter, its changes do
function getGoal_() {
  if(state.crops2[automaton2_0].had) {
    // far enough in the game, there are no more goals
    return [GOAL_NONE, 0];
  }

  // state.c_numplanted is only permanent crops, while numplanted includes temporary brassica and permanent crops
  var numplanted = state.c_numplanted + state.c_numplantedbrassica;

  if(state.g_numresets == 0) {
    if(state.c_numfullgrown == 0) {
      // pre-berry
      if(state.res.seeds.ltr(10) && numplanted == 0) {
        return [GOAL_FERN, 0];
      }
      if(state.c_numplantedbrassica < 5) {
        var subcode = (state.numemptyfields * 25 + state.c_numplantedbrassica) * 2 + (dialog_level > 0 ? 1 : 0);
        return [GOAL_WC5, subcode];
      }
      if(state.upgrades[brassicamul_0].unlocked && state.upgrades[brassicamul_0].count == 0 && !state.upgrades[berryunlock_0].unlocked) {
        var subcode = (state.currentTab == tabindex_upgrades ? 0 : 1) + (showingSidePanel ? 0 : 2) + (state.upgrades_new ? 0 : 4) + (state.res.seeds.ger(100) ? 0 : 8);
        return [GOAL_WC_UPGRADE, subcode];
      }
      if(state.c_numplantedbrassica < 10) {
        var subcode = (state.numemptyfields * 25 + state.c_numplantedbrassica) * 2 + (dialog_level > 0 ? 1 : 0);
        return [GOAL_WC10, subcode];
      }
      if(state.upgrades[berryunlock_0].unlocked && state.upgrades[berryunlock_0].count == 0) {
        var subcode = (state.currentTab == tabindex_upgrades ? 0 : 1) + (showingSidePanel ? 0 : 2) + (state.upgrades_new ? 0 : 4) + (state.res.seeds.ger(1000) ? 0 : 8);
        return [GOAL_BLACKBERRY_UNLOCK, subcode];
      }
      if(state.c_numfullgrown < 1) {
        var subcode = (state.numemptyfields * 25 + state.c_numplanted) * 8 + (dialog_level > 0 ? 4 : 0) + (state.numcropfields_permanent ? 2 : 0) + (state.res.seeds.ger(1000) ? 1 : 0);
        return [GOAL_BLACKBERRY_PLANT, subcode];
      }
    } else if(state.treelevel == 0) {
      // post-berry, pre spores
      if(state.upgrades[flowerunlock_0].unlocked && state.upgrades[flowerunlock_0].count == 0) {
        var subcode = (state.currentTab == tabindex_upgrades ? 0 : 1) + (showingSidePanel ? 0 : 2) + (state.upgrades_new ? 0 : 4) + (state.res.seeds.ger(6330) ? 0 : 8);
        return [GOAL_FLOWER_UNLOCK, subcode];
      }
      if(state.fullgrowncropcount[flower_0] < 1 && !state.upgrades[berryunlock_1].count) {
        return [GOAL_FLOWER_PLANT, 0];
      }
      if(!state.upgrades[berryunlock_1].count) {
        var subcode = (state.currentTab == tabindex_upgrades ? 0 : 1) + (showingSidePanel ? 0 : 2) + (state.upgrades_new ? 0 : 4) + (state.res.seeds.ger(40000) ? 0 : 8);
        return [GOAL_BLUEBERRY_UNLOCK, subcode];
      }
      if(state.fullgrowncropcount[berry_1] < 1 && !state.upgrades[berryunlock_2].count) {
        var subcode = (state.numemptyfields * 25 + state.c_numplanted) * 8 + (dialog_level > 0 ? 4 : 0) + (state.numcropfields_permanent ? 2 : 0) + (state.res.seeds.ger(40000) ? 1 : 0);
        return [GOAL_BLUEBERRY_PLANT, subcode];
      }
      if(state.upgrades[mushunlock_0].count == 0) {
        return [GOAL_CHAMPIGNON_UNLOCK, 0];
      }
      if(state.res.spores.ler(0)) {
        return [GOAL_CHAMPIGNON_PLANT, 0];
      }
      return [GOAL_TREE_LEVELUP, 0];
    } else if(state.treelevel < 10) {
      if(!state.c_numabilities && state.treelevel <= 3) {
        var subcode = state.treelevel;
        return [GOAL_SUN, subcode];
      }
      if(state.treelevel < 5) {
        return [GOAL_TREELEVEL_5, 0];
      }
      if(!state.fruit_seen && state.treelevel >= 5 && state.treelevel < 7) {
        var subcode = ((state.currentTab == tabindex_fruit) ? 1 : 0) + (state.numTabs * 2);
        return [GOAL_FRUIT_TAB, subcode];
      }
      if(!state.upgrades[nettleunlock_0].count) {
        var subcode = (state.currentTab == tabindex_upgrades ? 0 : 1) + (showingSidePanel ? 0 : 2) + ((state.res.seeds.ger(238e12) && state.upgrades[mushunlock_1].count) ? 0 : 4);
        return [GOAL_NETTLE_UNLOCK, subcode];
      }
      if(state.fullgrowncropcount[nettle_0] < 1 && !state.upgrades[berryunlock_5].count) {
        return [GOAL_NETTLE_PLANT, 0];
      }
      if(state.treelevel < 10) {
        return [GOAL_TREELEVEL_10, 0];
      }
    } else {
      // tree ready to transcend first time
      var subcode = (dialog_level > 0) ? 1 : 0;
      return [GOAL_TRANSCEND, subcode];
    }
  } else {
    // post-transcension
    if(!state.g_numplanted2) {
      var subcode = ((state.currentTab == tabindex_field2) ? 1 : 0) + (state.numTabs * 2) + (dialog_level > 0 ? 4 : 0);;
      return [GOAL_ETHEREAL_CROP, subcode];
    }
    if(!state.upgrades2[upgrade2_mistletoe].count && state.treelevel2 == 0 && !state.challenge) {
      if(state.g_res.resin.ltr(50) && state.g_numresets < 4) {
        if(state.res.resin.ltr((state.g_numupgrades2 > 2) ? 25 : ((state.g_numresets >= 2) ? 15 : 10))) {
          var early = state.g_numresets < 2 && state.treelevel < 1 && !state.upgrades[berryunlock_1].count /*&& !state.upgrades[flowerunlock_0].count*/;
          return [early ? GOAL_COLLECT_RESIN0 : GOAL_COLLECT_RESIN, 0];
        } else {
          return [GOAL_ETHEREAL_UPGRADE, 0];
        }
      } else {
        return [state.res.resin.ltr(25) ? GOAL_COLLECT_RESIN_FOR_MISTLETOE : GOAL_MISTLETOE_UNLOCK, 0];
      }
    }
    /*if(state.upgrades2[upgrade2_mistletoe].count && state.res.twigs.ler(0)) {
      return [GOAL_TWIGS, 0];
    }*/
    if(state.upgrades2[upgrade2_mistletoe].count && state.treelevel2 == 0) {
      if(state.cropcount[mistletoe_0]) {
        return [GOAL_TREELEVEL2_1, 0];
      } else if(state.upgrades[mistletoeunlock_0].unlocked) {
        subcode = state.upgrades[mistletoeunlock_0].unlocked ? 1 : 0;
        return [GOAL_MISTLETOE_PLANT, subcode];
      } else {
        return [GOAL_PRE_MISTLETOE_PLANT, 0];
      }
    }

    if(state.treelevel2 >= 1 && !automatonUnlocked()) {
      return [state.res.resin.ger(100) ? GOAL_AUTOMATON_UNLOCK : GOAL_AUTOMATON_AFFORD, 0];
    }

    if(automatonUnlocked() && !state.crops2[automaton2_0].had) {
      return [GOAL_AUTOMATON_PLACE, 0];
    }
  }

  return [GOAL_NONE, 0];
}


function getGoal() {
  var goal = getGoal_();

  if(goal[0] == GOAL_NONE) return goal;

  // don't enable most of the goals during a challenge, it already has its own different kind of goal to reach
  // however, do show some goals related to the ethereal field
  if(state.challenge) {
    if(goal[0] == GOAL_ETHEREAL_CROP || goal[0] == GOAL_ETHEREAL_UPGRADE || goal[0] == GOAL_MISTLETOE_UNLOCK || goal[0] == GOAL_AUTOMATON_UNLOCK) return goal;

    if(state.challenges_completed == 0) {
      var c = challenges[state.challenge];
      if(state.treelevel >= c.nextTargetLevel()) {
        return [GOAL_CHALLENGE_FINISH, 0];
      } else {
        return [GOAL_CHALLENGE_INFO, 0];
      }
    } else {
      return [GOAL_NONE, 0];
    }
  }

  return goal;
}

function getEmptyFieldCellForArrow() {
  var x = 0;
  var y = 0;
  for(;;) {
    if(state.field[y][x].index == 0 || state.field[y][x].index == FIELD_REMAINDER) {
      return [x, y];
    }
    x++;
    if(x >= state.numw) {
      x = 0;
      y++;
    }
    if(y >= state.numh) break;
  }
  return null;
}

var enableHelpArrows = false; // enables red help arrows. However, they may be a bit too intrusive and the goal chips may be enough

// shows goal chip under the log
function showGoalChips() {
  if(!fieldDivs) return; // field not rendered yet, some divs for arrows don't yet exist
  if(!actually_updated) return;

  var goalarray = getGoal();
  var goal = goalarray[0];
  var subcode = goalarray[1];

  if(goal == prevGoal && subcode == prevGoalSubCode) return; // nothing to do, already rendered matching arrow and goal

  removeAllArrows();

  if(goal == GOAL_NONE) {
    setGoalText(undefined);
  } else if(goal == GOAL_CHALLENGE_INFO) {
    setGoalText('Click the challenge info dialog in the tree to see the goal and reward during a challenge.', true);
  } else if(goal == GOAL_CHALLENGE_FINISH) {
    setGoalText('You finished the challenge, transcend to complete challenge and get its reward.');
  } else if(goal == GOAL_FERN) {
    setGoalText('Collect 10 seeds by clicking ferns.');
  } else if(goal == GOAL_WC5) {
    setGoalText('Plant 5 watercress on the field (' + state.c_numplantedbrassica + ' / 5 planted). To plant, click a field cell, then choose the watercress crop. Each costs 10 seeds, but will also produce seeds.');
    var watercress_chip = dialog_level > 0 ? document.getElementById('help_arrow_plant_watercress') : null;
    if(enableHelpArrows) {
      if(watercress_chip) {
        makeArrow2(watercress_chip, 1.5, 1, watercress_chip, 0.8, 0.5);
      } else {
        var coords = getEmptyFieldCellForArrow();
        if(coords) {
          var x = coords[0];
          var y = coords[1];
          makeArrow2(fieldDivs[y][x].div, 1.5, 1.5, fieldDivs[y][x].div, 0.8, 0.8, fieldFlex.div);
        }
      }
    }
  } else if(goal == GOAL_WC_UPGRADE) {
    setGoalText('Upgrade watercress, after getting enough seeds.');
    if(enableHelpArrows) {
      if(state.currentTab == 1 && upgradeFlexCache[0]) {
        var chip = document.getElementById('help_arrow_upgrade_watercress');
        if(chip) makeArrow2(contentFlex.div, 0.6, 0.2, chip, 0.85, 0.5);
      } else if(showingSidePanel && bottomrightSidePanelFlexCache[1]) {
        var chip = document.getElementById('help_arrow_upgrade_watercress_side');
        if(chip) makeArrow2(contentFlex.div, 0.9, 0.2, chip, 0.15, 0.5);
      } else if(!showingSidePanel && (state.upgrades_new || state.res.seeds.ger(100))) {
        makeArrow2(contentFlex.div, 0.6, 0.2, tabbuttons[1], 0.5, 1.0);
      }
    }
  } else if(goal == GOAL_WC10) {
    setGoalText('Plant up to 10 watercress on the field to reveal a next upgrade (' + state.c_numplantedbrassica + ' / 10 planted).');
  } else if(goal == GOAL_BLACKBERRY_UNLOCK) {
    setGoalText('Buy the "Unlock blackberry" upgrade, the first permanent (non-withering) crop.');
    if(enableHelpArrows) {
      if(state.currentTab == 1 && upgradeFlexCache[0]) {
        var chip = document.getElementById('help_arrow_unlock_blackberry');
        if(chip) makeArrow2(contentFlex.div, 0.6, 0.2, chip, 0.85, 0.5);
      } else if(showingSidePanel && bottomrightSidePanelFlexCache[1]) {
        var chip = document.getElementById('help_arrow_unlock_blackberry_side');
        if(chip) makeArrow2(contentFlex.div, 0.9, 0.25, chip, 0.15, 0.5);
      } else if(!showingSidePanel && (state.upgrades_new || state.res.seeds.ger(1000))) {
        makeArrow2(contentFlex.div, 0.6, 0.2, tabbuttons[1], 0.5, 1.0);
      }
    }
  } else if(goal == GOAL_BLACKBERRY_PLANT) {
    setGoalText('Plant a blackberry and wait for it to grow. It produces more seeds. If the field is full of watercress, you can click one and use "replace crop" to delete it and plant blackberry there.');
    if(enableHelpArrows) {
      if(!state.numcropfields_permanent && state.res.seeds.ger(1000)) {
        var chip = dialog_level > 0 ? document.getElementById('help_arrow_plant_blackberry') : null;
        if(chip) {
          makeArrow2(chip, 1.5, 1, chip, 0.8, 0.5);
        } else {
          var coords = getEmptyFieldCellForArrow();
          if(coords) {
            var x = coords[0];
            var y = coords[1];
            makeArrow2(fieldDivs[y][x].div, 1.5, 1.5, fieldDivs[y][x].div, 0.8, 0.8, fieldFlex.div);
          }
        }
      }
    }
  } else if(goal == GOAL_FLOWER_UNLOCK) {
    setGoalText('Unlock the anemone flower. To get more seeds, remember to combine a watercress with berries for the copying effect.');
    if(enableHelpArrows) {
      if(state.currentTab == 1 && upgradeFlexCache[0]) {
        var chip = document.getElementById('help_arrow_unlock_anemone');
        if(chip) makeArrow2(chip, 1.2, 1.2, chip, 0.85, 0.5, contentFlex.div);
      } else if(!showingSidePanel && (state.upgrades_new || state.res.seeds.ger(6330))) {
        makeArrow2(contentFlex.div, 0.6, 0.2, tabbuttons[1], 0.5, 1.0);
      }
    }
  } else if(goal == GOAL_FLOWER_PLANT) {
    setGoalText('Plant an anemone flower. Plant it orthogonally next to a berry to boost the berry (a flower on its own doesn\'t produce anything). Keep planting more watercress, berries and flowers for more income.');
  } else if(goal == GOAL_BLUEBERRY_UNLOCK) {
    setGoalText('Unlock blueberry. Remember to boost berries with flowers, and have a watercress copying from a good berry, to speed up income.');
    if(enableHelpArrows) {
      if(state.currentTab == 1 && upgradeFlexCache[0]) {
        var chip = document.getElementById('help_arrow_unlock_blueberry');
        if(chip) makeArrow2(contentFlex.div, 0.6, 0.2, chip, 0.85, 0.5);
      } else if(showingSidePanel && bottomrightSidePanelFlexCache[1]) {
        //var chip = document.getElementById('help_arrow_unlock_blackberry_side');
        //if(chip) makeArrow2(contentFlex.div, 0.9, 0.25, chip, 0.15, 0.5);
      } else if(!showingSidePanel && (state.upgrades_new || state.res.seeds.ger(1000))) {
        makeArrow2(contentFlex.div, 0.6, 0.2, tabbuttons[1], 0.5, 1.0);
      }
    }
  } else if(goal == GOAL_BLUEBERRY_PLANT) {
    setGoalText('Plant a blueberry, or replace a blackberry by one, and wait for it to grow.');
    if(enableHelpArrows) {
      if(!state.cropcount[berry_1] && state.res.seeds.ger(40000) && state.upgrades[berryunlock_1].count && !state.upgrades[berryunlock_2].unlocked) {
        var chip = dialog_level > 0 ? document.getElementById('help_arrow_plant_blueberry') : null;
        if(chip) {
          makeArrow2(chip, 1.5, 1, chip, 0.8, 0.5);
        } else {
          // disabled: don't show arrow on field, that can be misleading, it could be pointing to a very bad spot compared to where the flowers are planted, or it may be better to upgrade a blackberry into a blueberry
          /*var coords = getEmptyFieldCellForArrow();
          if(coords) {
            var x = coords[0];
            var y = coords[1];
            makeArrow2(fieldDivs[y][x].div, 1.5, 1.5, fieldDivs[y][x].div, 0.8, 0.8, fieldFlex.div);
          }*/
        }
      }
    }
  } else if(goal == GOAL_CHAMPIGNON_UNLOCK) {
    setGoalText('Unlock champignon. To afford this, if needed plant more berries boosted by flowers and watercress copying, or use upgrades. Plant watercress next to your best berry to copy its production, this copy effect works best if there are only a few watercress on the whole field');
  } else if(goal == GOAL_CHAMPIGNON_PLANT) {
    setGoalText('Plant champignon next to a high tier berry to produce spores. It will consume seeds directly from that berry. Also leave some berry without mushroom to keep global seed production.');
  } else if(goal == GOAL_TREE_LEVELUP) {
    setGoalText('Wait for the tree to level up through enough spores. Improve berries next to champignons to speed up spore production. Also keep berries without champignon for global seed production.');
  } else if(goal == GOAL_SUN) {
    setGoalText('Reach tree level 2 and activate the sun ability. It\'s also possible to unlock other crops like cranberry while waiting.');
    if(enableHelpArrows) {
      if(state.treelevel >= 2) {
        var chip = document.getElementById('sun_button');
        if(chip) makeArrow2(chip, 2.5, 1.5, chip, 1, 0.6);
      }
    }
  } else if(goal == GOAL_TREELEVEL_5) {
    setGoalText('Reach tree level 5 to get a fruit drop. Keep upgrading, unlocking new crop tiers (clover, currant, ...) and replacing existing crops with them for more income. Find an effective field layout. Put a flower next to mushrooms for more spores.');
  } else if(goal == GOAL_FRUIT_TAB) {
    setGoalText('Check the fruit tab to see the newly dropped fruit and inspect its abilities.');
    if(enableHelpArrows) {
      if(state.currentTab != tabindex_fruit) {
        makeArrow2(contentFlex.div, 0.5, 0.2, tabbuttons[tabindex_fruit], 0.5, 1.0);
      }
    }
  } else if(goal == GOAL_NETTLE_UNLOCK) {
    setGoalText('Unlock nettle. To reach this, unlock and grow other crops first, up to matsutake mushroom (requires fullgrown currant). Keep upgrading and improving for more income.');
    if(enableHelpArrows) {
      if(state.currentTab == 1 && upgradeFlexCache[0]) {
        var chip = document.getElementById('help_arrow_unlock_nettle');
        if(chip) makeArrow2(chip, 1.2, 1.2, chip, 0.85, 0.5, contentFlex.div);
      } else if(showingSidePanel && bottomrightSidePanelFlexCache[1]) {
        var chip = document.getElementById('help_arrow_unlock_nettle_side');
        if(chip) makeArrow2(contentFlex.div, 0.9, 0.2, chip, 0.15, 0.5);
      } else if(!showingSidePanel && state.res.seeds.ger(238e12) && state.upgrades[mushunlock_1].count) {
        makeArrow2(contentFlex.div, 0.5, 0.3, tabbuttons[1], 0.5, 0.9);
      }
    }
  } else if(goal == GOAL_NETTLE_PLANT) {
    setGoalText('Plant a nettle. Plant it next to a mushroom to boost its spore production by 500% (but keep at least 1 berry and flower). Beware that nettle negatively affects other flowers and berries it orthogonally touches.');
  } else if(goal == GOAL_TREELEVEL_10) {
    setGoalText('Reach tree level 10 to unlock transcension.');
  } else if(goal == GOAL_TRANSCEND) {
    setGoalText('Click the tree and then transcend. Check fruit tab first in case you want to keep a fruit. You can also get a few more tree levels to collect more resin first - but transcending will be worth it!');
  } else if(goal == GOAL_ETHEREAL_CROP) {
    setGoalText('Plant an ethereal crop of your choice in the new ethereal field.');
    if(enableHelpArrows) {
      if(state.currentTab != tabindex_field2 && dialog_level == 0) {
        makeArrow2(contentFlex.div, 0.5, 0.2, tabbuttons[tabindex_field2], 0.6, 0.95);
      }
    }
  } else if(goal == GOAL_COLLECT_RESIN0) {
    setGoalText('Grow the basic field again and reach tree level 10 or higher to transcend again for more resin.\nTIP: shift+click watercress icon in top right corner to fill entire field with watercress (requires enough seeds). Check help -> keyboard shoftcuts for easier ways to plant.', false);
  } else if(goal == GOAL_COLLECT_RESIN) {
    //setGoalText('Grow the basic field again and reach tree level 10 or higher to transcend again for more resin. Get more ethereal crops and upgrades, and achievements, to reach higher levels faster and earn more resin with each transcension.');
    setGoalText('Grow the basic field again and reach tree level 10 or higher to transcend again for more resin.', true);
  } else if(goal == GOAL_COLLECT_RESIN_FOR_MISTLETOE) {
    //setGoalText('Grow the basic field again and reach tree level 10 or higher to transcend again for more resin. Get more ethereal crops and upgrades, and achievements, to reach higher levels faster and earn more resin with each transcension.');
    setGoalText('Collect 25 resin from transcensions to afford the "unlock mistletoe" ethereal upgrade.', true);
  } else if(goal == GOAL_ETHEREAL_UPGRADE) {
    setGoalText('Plant a crop in the ethereal field, or choose an upgrade in the ethereal upgrades tab, with the resin you have.');
  } else if(goal == GOAL_MISTLETOE_UNLOCK) {
    //setGoalText('Unlock mistletoes in the ethereal upgrades tab. This ethereal upgrade is essential to level up the ethereal tree, which unlocks more ethereal upgrades, automation, etc...');
    setGoalText('Unlock mistletoes in the ethereal upgrades tab.');
  //} else if(goal == GOAL_TWIGS) {
  //  setGoalText('Plant one or more mistletoes next to the tree in the basic field, then transcend to get twigs');
  } else if(goal == GOAL_PRE_MISTLETOE_PLANT) {
    setGoalText('Grow the basic field until you can plant mistletoe.');
  } else if(goal == GOAL_MISTLETOE_PLANT) {
    setGoalText('Unlock and plant a mistletoe next to the basic tree to collect twigs.');
  } else if(goal == GOAL_TREELEVEL2_1) {
    setGoalText('Reach enough twigs from mistletoes through transcensions to level up the ethereal tree.', true);
  } else if(goal == GOAL_AUTOMATON_AFFORD) {
    setGoalText('Unlock the automaton in the ethereal upgrades tab once you have enough resin.', true);
  } else if(goal == GOAL_AUTOMATON_UNLOCK) {
    setGoalText('Unlock the automaton in the ethereal upgrades tab');
  } else if(goal == GOAL_AUTOMATON_PLACE) {
    setGoalText('Place the automaton in the ethereal field. After that, the goals here will disappear but the automaton tab will get a few lower paced goals to improve the automaton!');
  } else {
    setGoalText('UNKNOWN GOAL (TODO)');
  }

  if(prevGoal != goal) {
    if(prevGoal != GOAL_NONE && prevGoal >= 0) {
      if(goal == GOAL_NONE) showMessage('Goal completed!', C_GOAL);
      else if(goal > prevGoal) {
        showMessage('Goal completed! A new goal appeared.', C_GOAL);
      }
    }
    if(goal != GOAL_NONE) animateGoalText();
  }

  prevGoal = goal;
  prevGoalSubCode = subcode;
}
