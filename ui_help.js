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


var numhelpdialogs = 0;
var helpDialogQueue = [];

// the "never show again" is stored in savegame, which means if you use undo or import another save, it may come back
// to avoid annoyance in those cases, also store the "never show again" of dialogs temporarily during this session (lost on browser refresh)
var helpNeverAgainLocal = {};

// id = unique id for seen/disable setting of this particular help message. must be > 0. Alternatively, id can be made < 0, then it only prints it as showMessage, this feature simply exists to allow easily changing the source code to use a full on dialog, or just showMessage, for particular help text
// highest used id: 28
// opt_text2 is shown only in the dialog and not in the "showMessage" in console
// opt_recursive is used internally only, when recursively calling showHelpDialog again when there were multiple. It prevents showMessage since showMessage will already have been done.
// text_short = shown in the message log if help already disabled for this particular dialog, or undefined to simply use the main text, or empty string to show nothing for this case
function showHelpDialog(id, text_short, text, image, opt_text2, images, opt_force, opt_recursive) {
  state.help_seen_text[Math.abs(id)] = Math.abs(id);
  if(!opt_recursive) {
    var use_short = false;
    if(id >= 0) {
      if(state.help_disable[id]) use_short = true;
      if(state.disableHelp) {
        use_short = !!state.help_seen[id];
        state.help_seen[id] = id;
      }
    }

    if(use_short) {
      if(text_short != '') showMessage(text_short || text, C_HELP, 175786661);
    } else {
      showMessage(text, C_HELP, 175786661);
    }
  }

  if(id < 0) return; // showMessage-only


  if(!opt_force) {
    if(state.help_disable[id]) return;
    if(helpNeverAgainLocal[id]) {
      state.help_disable[id] = id;
      return;
    }
    if(state.disableHelp) return;
  }

  if(numhelpdialogs) {
    helpDialogQueue.push(arguments);
    return;
  }

  if(opt_text2) text += opt_text2;

  var seen = state.help_seen[id];
  state.help_seen[id] = id;

  var okfun, oktext;

  if(!opt_force) {
    var okfun = function() {
      state.help_disable[id] = id;
      helpNeverAgainLocal[id] = id;
      dialog.cancelFun();
    };
    var oktext = 'never show again';
  }

  numhelpdialogs++;
  var dialog = createDialog(images ? DIALOG_LARGE : DIALOG_MEDIUM, okfun, oktext, 'ok', undefined, undefined, false, function() {
    numhelpdialogs--;
    if(helpDialogQueue.length) {
      var args = Array.prototype.slice.call(helpDialogQueue[0], 0);
      args[6] = true;
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
    var canvasflex = new Flex(dialog.content, 0.01, 0.01, 0.1, 0.1);
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
        var x0 = -0.2 + 0.4 * x / w;
        var y0 = -0.2 + 0.4 * y / h;
        var x1 = -0.2 + 0.4 * (x + 1) / w;
        var y1 = -0.2 + 0.4 * (y + 1) / h;
        var canvasflex = new Flex(dialog.content, [0.25, x0], [0.7, y0], [0.25, x1], [0.7, y1]);
        var canvas = createCanvas('0%', '0%', '100%', '100%', canvasflex.div);
        renderImage(images[y][x], canvas);
      }
    }
    fy1 = 0.65;
  }

  var flex = new Flex(dialog.content, fx0, fy0, fx1, fy1, 0.32);

  flex.div.innerHTML = text;
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

function showRegisteredHelpDialog(id, opt_force)  {
  var d = registered_help_dialogs[id];
  if(!d) return;
  showHelpDialog(d.id, d.text_short, d.text, d.image, d.opt_text2, d.images, opt_force);
}


registerHelpDialog(8, 'Upgrades', 'You unlocked your first upgrade!', 'You unlocked your first upgrade! Check the "upgrades" tab to view it. Upgrades can unlock new crops, upgrade existing crops, or various other effects. Upgrades usually cost seeds.<br><br>The upgrades also unlock permanent crops that produce seeds forever, unlike the short-lived watercress.');

registerHelpDialog(3, 'Permanent crop & watercress copying', 'You unlocked your first permanent type of plant.',
    'You unlocked your first permanent type of plant. Plants like this stay on the field forever, keep producing forever, and have much more powerful production upgrades too.' +
    '<br><br>'+
    'If you plant watercress next to permanent plants, the watercress copy all its neighbors (orthogonal, not diagonal) production for free. If there is more than 1 watercress in the entire field this gives diminishing returns, so having 1 or perhaps 2 max makes sense (by design: no need to replant many watercress all the time. Check the seeds/s income to experiment). The watercress is its own independent multiplier so it works well and is relevant no matter how high level other boosts the permanent plant has later in the game.' +
    '<br><br>'+
    'TIP: hold SHIFT to plant last crop type, CTRL to plant watercress',
    undefined,
    '<br><br>'+
    'The image below shows an optimal configuration to use for watercress copying: the single watercress duplicates the production of 4 blackberries:',
    [[undefined,blackberry[4],undefined],[blackberry[4],watercress[4],blackberry[4]],[undefined,blackberry[4],undefined]]);



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
  nettle[4],
  '<br><br>'+
  'The image shows a possible configuration where the mushroom receives boost from both nettle (top) and flower (bottom). The top left flower and top right blackberry in this image however are negatively affected by the nettle.',
  [[clover[4],nettle[4],blackberry[4]],
   [blueberry[4],champignon[4],blueberry[4]],
   [undefined,clover[4],undefined]]);


registerHelpDialog(6, 'Tree leveled up', 'Tree leveled up', 'Thanks to spores, the tree completely rejuvenated and is now a ' + tree_images[treeLevelIndex(1)][0] + ', level ' + 1 + '. More spores will level up the tree more. The tree can unlock abilities and more at higher levels. Click the tree in the field for more info.',
    undefined, undefined, [[undefined, tree_images[treeLevelIndex(1)][1][0]], [undefined, tree_images[treeLevelIndex(1)][2][0]]]);


registerHelpDialog(12, 'Sun ability', '', 'The tree reached level ' + 2 + ' and discovered the sun ability!<br><br>' + upgrades[upgrade_sununlock].description, image_sun);
registerHelpDialog(14, 'Mist ability', '', 'The tree reached level ' + 4 + ' and discovered the mist ability! You now have multiple abilities, only one ability can be active at the same time.<br><br>' + upgrades[upgrade_mistunlock].description, image_mist);
registerHelpDialog(15, 'Rainbow ability', '', 'The tree reached level ' + 6 + ' and discovered the rainbow ability!<br><br>' + upgrades[upgrade_rainbowunlock].description, image_rainbow);
registerHelpDialog(2, 'Tree dropped fruit', '', 'The tree reached level ' + 5 + ' and dropped a fruit! Fruits provide boosts and can be upgraded with fruit essence. Essence is gained by sacrificing fruits, and all full amount of fruit essence can be used for upgrading all other fruits at the same time. See the "fruit" tab, it also has a more extensive help dialog for fruits.<br><br>A possible strategy: keep fruits with good abilities you like. Sacrifice any other surplus fruits, so you can use the essence to upgrade the good fruits.', images_apple[0]);
registerHelpDialog(18, 'Tree dropped better fruit', '', 'The tree reached level ' + 15 + ' and dropped another fruit! Fruits from higher tree levels have random probability to be of better, higher tier, types.', images_apple[2]);


registerHelpDialog(7, 'Tree can transcend', undefined, 'The tree reached adulthood, and is now able to transcend! Click the tree in the field to view the transcension dialog.',
    undefined, undefined, [[undefined, tree_images[treeLevelIndex(10)][1][0]], [undefined, tree_images[treeLevelIndex(10)][2][0]]]);


registerHelpDialog(1, 'Transcension', undefined, 'You performed your first transcension! Check the new ethereal field tab, spend resin on ethereal plants for bonuses to your basic field. Get more resin by transcending again.',
  undefined,
  '<br><br>The following image shows an example of an ethereal field setup with several ethereal crops that give boosts to the main field: all type of basic field berries, mushrooms and flowers are boosted by this example. The image also shows a white lotus that boosts the neighboring ethereal crops to make their boosts even bigger.',
  [[undefined,clover[4],undefined],
   [blackberry[4],whitelotus[4],champignon[4]],
   [undefined,blackberry[4],undefined]]);

registerHelpDialog(23, 'Transcension II', '', 'The tree reached level ' + 20 + '. Transcension now turned into Transcension II, and doubles the amount of resin you receive upon transcending. This will continue at later tree levels as well: tree level 30 unlocks transcension III which triples resin, and so on',
    undefined, undefined, [[undefined, tree_images[treeLevelIndex(20)][1][0]], [undefined, tree_images[treeLevelIndex(20)][2][0]]]);

registerHelpDialog(9, 'Ethereal upgrades', undefined, 'You unlocked your first ethereal upgrade! Check the "ethereal upgrades" tab to view it. Ethereal upgrades cost resin, just like ethereal plants do, but ethereal upgrades are permanent and non-refundable');

registerHelpDialog(17, 'Mistletoes', 'Unlocked a new crop: mistletoe',
  'Unlocked a new crop: mistletoe. Mistletoe can be placed next to the basic field tree to create twigs, orthogonally, not diagonally. Twigs help the ethereal field tree. However the mistletoe increases the spore requirement for leveling the basic tree and slightly decreases resin gain. More mistletoes give diminishing returns, but still increase the negative effects by as much, so having max 1 or 2 is sensible. Mistletoes that are not planted next to the tree do nothing at all.',
  mistletoe[4],
  '<br><br>'+
  'The image shows a possible configuration where mistletoes are next to the tree and thus give twigs on tree level up.',
  [[tree_images[treeLevelIndex(2)][1][0], mistletoe[4]], [tree_images[treeLevelIndex(2)][2][0], mistletoe[4]]]);


registerHelpDialog(22, 'Ethereal tree leveled up', '',
    'Thanks to twigs, the ethereal tree leveled up! This is the tree in the ethereal field, not the one in the basic field. Leveling up the ethereal tree unlocks new ethereal crops and/or upgrades, depending on the level. Each level also provides a resin production boost to the basic tree.',
    undefined, undefined, [[undefined, tree_images[treeLevelIndex(1)][1][4]], [undefined, tree_images[treeLevelIndex(1)][2][4]]]);

registerHelpDialog(24, 'Challenges', '',
    'You unlocked a challenge! Challenges can be accessed from the tree, as an alternative to regular transcension. All challenges give a production bonus for highest tree level reached. Challenges may also give one-time rewards for successfully reaching a certain level. Challenges can be ran as many times as desired, redoing them can increase the max level reached.',
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

registerHelpDialog(26, 'Challenge completed', 'Challenge target level reached, challenge successfully finished!',
    'The tree reached the challenge\'s target level, you can successfully complete the challenge and can get its main reward! You can complete the challenge from the tree dialog, or continue to reach a higher level for more challenge max-level bonus. You can also replay the challenge at any later time to increase the max level.',
    undefined);

registerHelpDialog(27, 'Beehives', undefined,
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


registerHelpDialog(28, 'Automaton', 'You unlocked the automaton!',
    'You unlocked the automaton! You can place the automaton in the ethereal field. When placed, the automaton tab unlocks, allowing to automate various parts of the game.<br><br>You must place the automaton, go to the tab and enable settings before it actually automates anything.<br><br>More and more automation features will become available later in the game.<br><br>When removing the automaton from the ethereal field, the automaton tab and all automation features will be disabled, but they all come back the way they were when placing the automaton again.',
    images_automaton[4]);

function createKeyboardHelpDialog() {
  var dialog = createDialog();

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Help';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1, 0.3);
  var div = flex.div;
  makeScrollable(flex);

  var text = '';

  text += '<b>List of keyboard shortcuts:</b>';
  text += '<br/><br/>';
  text += 'Note: on mac, ctrl means command instead.';
  text += '<br/><br/>';
  text += ' • <b>"1" , "2" , "3"</b>: activate one of the weather abilities';
  text += '<br/>';
  text += ' • <b>"w"</b>: replant watercress on all field tiles that have a watercress remainder, and refresh existing ones. Such a remainder appears for watercress that have been copying from multiple plants, that is, a good copying spot. Copying has diminishing returns if there are multiple watercress anywhere on the map, 1 or 2 is effective (check the seeds/s income to view the effect).';
  text += '<br/>';
  text += ' • <b>shift + click empty field</b>: plant last planted type';
  text += '<br/>';
  text += ' • <b>shift + click non-empty field</b>: delete plant, only if this is enabled in preferences';
  text += '<br/>';
  text += ' • <b>ctrl + click empty field</b>: plant a watercress (does not affect last planted type for shift key)';
  text += '<br/>';
  text += ' • <b>shift + click upgrade</b>: buy as many of this upgrade as you can afford';
  text += '<br/>';
  text += ' • <b>shift + click undo</b>: save the undo state now, rather than load it. This overwrites your undo so eliminates any chance of undoing now. This will also be overwritten again if you do actions a minute later.';
  text += '<br/>';
  text += ' • <b>shift + click save import dialog</b>: import and old savegame, but do not run the time, so you get the resources at the time of saving rather than with all production during that time added.';
  text += '<br/>';
  text += ' • <b>ctrl + click fruit</b>: move downwards: to storage if available, otherwise to sacrificial pool.';
  text += '<br/>';
  text += ' • <b>shift + click fruit</b>: move upwards: to storage if available, otherwise swap to active slot.';
  text += '<br/>';
  text += ' • <b>shift + click fruit ability upgrade</b>: buy multiple abilities up to 25% of currently available essence';
  text += '<br/>';
  text += ' • <b>esc</b>: close dialogs.';
  text += '<br/><br/>';

  div.innerHTML = text;
}

function createMainHelpDialog() {
  var dialog = createDialog();

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Help';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1, 0.3);
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
  text += 'Copyright (c) 2020-2021 by Lode Vandevenne';

  div.innerHTML = text;

  var el = document.getElementById('recovery');
  addButtonAction(el, function() {
    showSavegameRecoveryDialog();
  });
}

var showing_help = false; // for medal

function createHelpDialog() {
  showing_help = true;
  var dialog = createDialog(undefined, undefined, undefined, undefined, undefined, undefined, undefined, function() {
    showing_help = false;
  });

  var titleFlex = new Flex(dialog.content, 0, 0.01, 1, 0.11, 0.5);
  centerText2(titleFlex.div);
  titleFlex.div.textEl.innerText = 'Help';

  var scrollFlex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1, 0.3);
  makeScrollable(scrollFlex);

  var pos = 0.05;
  var buttondiv;
  var h = 0.06;

  var makeButton = function(text) {
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(scrollFlex, 0.08, pos, 0.92, pos + h, 0.55);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    button.textEl.innerText = text;
    return button;
  };

  var addSpacer = function() {
    pos += h * 0.5;
  };

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

  addSpacer();

  var added = false;

  for(var i = 0; i < registered_help_dialogs_order.length; i++) {
    var id = registered_help_dialogs_order[i];
    if(!state.help_seen_text[id] && !state.help_seen[id]) continue;
    var d = registered_help_dialogs[id];

    if(!added) {
      var tempFlex = new Flex(scrollFlex, 0.1, pos, 0.9, pos + h, 0.5);
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

  var moreFlex = new Flex(scrollFlex, 0.1, pos, 0.9, pos + h, 0.5);
  moreFlex.div.innerText = 'More help topics will appear here as the game progresses. Any in-game help dialog that pops up will become permanently available here once it\'s unlocked';
}
