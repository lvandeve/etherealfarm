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

// opt_later: when viewing the dialog later, so it shouldn't show messages that indicate the ethereal tree leveled up just now
function showEtherealTreeLevelDialog(level, opt_later) {
  var dialog = createDialog({
    cancelname:'ok',
    scrollable:true,
    title:((opt_later ? 'Ethereal tree level ' : 'Reached ethereal tree level ') + level),
    nobgclose:!opt_later,
    bgstyle:'efDialogEthereal'
  });

  var text = '';

  if(!opt_later) {
    if(level == 1) {
     text += 'Thanks to twigs, the ethereal tree leveled up! This is the tree in the ethereal field, not the one in the basic field. Leveling up the ethereal tree unlocks new ethereal crops and/or upgrades, depending on the level. Each level also provides a resin production boost to the basic tree.'
    } else {
     text += 'The ethereal tree leveled up to level ' + level + '!';
    }
    text += '<br><br>';

    var twigs_now = treeLevel2Req(level);
    var twigs_next = treeLevel2Req(level + 1);

    text += 'It consumed ' + twigs_now.toString() + '. The next level will require ' + twigs_next.toString() + '.<br><br>';
  }

  var text2 = '';

  var anything = false;

  for(var i = 0; i < registered_upgrades2.length; i++) {
    var u = upgrades2[registered_upgrades2[i]];
    if(u.treelevel2 == level) {
      text2 += '<b>• Upgrade</b>: ' + upper(u.name) + '<br>';
      anything = true;
    }
  }

  for(var i = 0; i < registered_crops2.length; i++) {
    var u = crops2[registered_crops2[i]];
    if(!u.isReal()) continue;
    if(u.treelevel2 == level) {
      text2 += '<b>• Crop</b>: Ethereal ' + u.name + '<br>';
      anything = true;
    }
  }

  for(var i = 0; i < registered_crops2.length; i++) {
    var u = crops2[registered_crops2[i]];
    if(!u.istemplate) continue;
    if(u.treelevel2 == level) {
      text2 += '<b>• Template</b>: Ethereal ' + u.name + '<br>';
      anything = true;
    }
  }

  if(level == 2) {
    text2 += '<b>• Challenge</b>: No upgrades challenge (requires having automaton to unlock)<br>';
    anything = true;
  }
  if(level == 3) {
    text2 += '<b>• Challenge</b>: Blackberry challenge (requires automaton with auto-upgrades to unlock)<br>';
    anything = true;
  }
  if(level == 5) {
    text2 += '<b>• Challenge</b>: Wither challenge (requires automaton with auto-unlock crops to unlock)<br>';
    anything = true;
  }
  if(level == 7) {
    text2 += '<b>• Challenge</b>: Wasabi challenge<br>';
    anything = true;
  }

  if(!opt_later) {
    if(anything) {
      text += 'New ethereal things unlocked! These are available in the ethereal field and/or ethereal upgrades tab:';
    } else {
      text += 'No new ethereal upgrades, crops or challenges unlocked. New content for this ethereal tree level may be added in future game updates. You can always see this dialog again later by clicking the ethereal tree using "See previous unlocks".';
    }
  } else {
    if(anything) {
      text += 'The following new ethereal things got, or will get, unlocked at this level:<br><br>';
    } else {
      text += 'No new ethereal upgrades, crops or challenges were unlocked at this level. New content for this ethereal tree level may be added in future game updates.';
    }
  }

  text += '<br><br>';
  text += text2;

  dialog.content.div.innerHTML = text;
}

var showing_previous_unlocks_dialog = false;

function showEtherealTreeLevelDialogs() {
  showing_previous_unlocks_dialog = true; // for achievement
  var dialog = createDialog({
    scrollable:true,
    title:'Previous ethereal tree level unlocks',
    onclose:function() {
      showing_previous_unlocks_dialog = false;
    }
  });

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

  for(var i = 0; i <= state.treelevel2; i++) {
    var level = state.treelevel2 - i;
    var button = makeButton('level ' + level);
    addButtonAction(button, bind(showEtherealTreeLevelDialog, level, true));
  }
}


function makeTree2Dialog() {
  var div;

  var have_buttons = automatonUnlocked();

  var dialog = createDialog({
    nocancel:have_buttons,
    scrollable:false,
    narrow:true,
    title:'Tree',
    bgstyle:'efDialogTranslucent'
  });
  var contentFlex = dialog.content;

  var flex = new Flex(dialog.icon, 0, 0, 1, 1);
  var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(tree_images[treeLevelIndex(state.treelevel2)][1][4], canvas);
  flex = new Flex(dialog.icon, 0, 1, 1, 2);
  canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
  renderImage(tree_images[treeLevelIndex(state.treelevel2)][2][4], canvas);

  var ypos = 0;
  var ysize = 0.1;

  var f0 = new Flex(contentFlex, 0, 0, 1, 0.65);
  makeScrollable(f0);
  var f1 = new Flex(contentFlex, 0, 0.67, 1, 1);

  var text = '';

  if(state.treelevel2 > 0) {
    text += '<b>Ethereal tree level ' + state.treelevel2 + '</b>';
  } else {
    text += '<b>Ethereal tree</b>';
  }
  text += '<br><br>';

  var twigs_req = treeLevel2Req(state.treelevel2 + 1);
  text += '<b>Twigs required for next level: </b>' + (twigs_req.twigs.sub(state.res.twigs)).toString() + ' (total: ' + twigs_req.toString() + ')';
  if(state.treelevel2 > 0 && state.treelevel2 <= 5 && state.cropcount[mistletoe_0] == 0 && state.challenge == 0) {
    text += '<br><font color="red">You must plant mistletoe(s) in the basic field to get twigs to level up the ethereal tree and progress the game</font>';
  }
  text += '<br><br>';

  if(state.treelevel2 > 0) {
    text += '<b>Resin production bonus to basic tree: </b>' + treelevel2_resin_bonus.mulr(state.treelevel2).toPercentString();
    text += '<br><br>';
  }

  text += '<b>Total resin earned entire game: </b>' + state.g_res.resin.toString();
  text += '<br/><br/>';

  text += '<b>Ethereal boosts from crops on this field to basic field:</b><br>';
  text += '• starter resources: ' + getStarterResources().toString() + '<br>';
  text += '• berry boost: ' + state.ethereal_berry_bonus.toPercentString() + '<br>';
  text += '• mushroom boost: ' + state.ethereal_mush_bonus.toPercentString() + '<br>';
  text += '• flower boost: ' + state.ethereal_flower_bonus.toPercentString() + '<br>';
  if(state.crops2[nettle2_0].unlocked) text += '• stinging boost: ' + state.ethereal_nettle_bonus.toPercentString() + '<br>';
  if(state.crops2[bee2_0].unlocked) text += '• bee boost: ' + state.ethereal_bee_bonus.toPercentString() + '<br>';
  if(state.crops2[brassica2_0].unlocked) text += '• brassica boost: ' + state.ethereal_brassica_bonus.toPercentString() + '<br>';
  text += '<br>';

  text += '<b>Tree boost to ethereal non-lotus neighbors</b>: ' + getEtherealTreeNeighborBoost().toPercentString();

  f0.div.innerHTML = text;

  var y = 0.05;
  var h = 0.15;
  // finetune the width of the buttons in flex f1
  var button0 = 0.15;
  var button1 = 0.85;
  var buttonshift = h * 1.15;

  if(automatonUnlocked()) {
    var button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Ethereal blueprints';
    //button.textEl.style.boxShadow = '0px 0px 5px #44f';
    button.textEl.style.textShadow = '0px 0px 5px #008';
    addButtonAction(button, function() {
      closeAllDialogs();
      createBlueprintsDialog(undefined, undefined, true);
    });
  }

  if(state.treelevel2 > 0) {
    var button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'See previous unlocks';
    addButtonAction(button, function() {
      showEtherealTreeLevelDialogs();
    });
    registerTooltip(button, 'Show the things that got unlocked by reaching previous ethereal tree levels');
  }

  if(have_buttons) {
    button = new Flex(f1, button0, y, button1, y + h, FONT_BIG_BUTTON).div;
    y += buttonshift;
    styleButton(button);
    button.textEl.innerText = 'Back';
    addButtonAction(button, function() {
      dialog.cancelFun();
    });
  }
}


