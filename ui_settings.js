/*
Ethereal Farm
Copyright (C) 2020-2024  Lode Vandevenne

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

function createNumberFormatHelp(notations, precision) {
  var dialog = createDialog({size:DIALOG_LARGE, title:'Number format help', scrollable:true});

  var text = '';

  text += 'Change the displayed number format used for most costs, amounts, percentages, etc...';
  text += '<br><br>';

  text += '<b>Latin suffixes:</b>';
  text += '<br><br>';

  var num = 34 + 2;
  for(var i = 1; i < num; i++) {
    var suffix = '', suffixname = '', numeric = '';
    if(i < num - 2) {
      suffix = getLatinSuffix(i * 3);
      suffixname = getLatinSuffixFullName(i * 3);
      numeric = ', 1e' + (i * 3);
      if(i <= 4) {
        numeric += ' (1';
        for(var j = 0; j < i; j++) numeric += ',000';
        numeric += ')';
      }
    } else if(i == num - 2) {
      suffixname = 'centillion';
      numeric = ', 1e303';
      suffix = 'C';
    } else {
      suffix = 'etc...';
    }

    text += '<b>' + suffix + '</b>' + (suffixname ? ': ' : '') + suffixname + numeric + '<br>';
  }

  text += '<br><br>';

  var have_si = false;
  for(var i = 0; i < notations.length; i++) {
    if(notations[i] == Num.N_SI) {
      have_si = true;
      break;
    }
  }

  if(have_si) {
    text += '<b>SI suffixes:</b>';
    text += '<br><br>';

    num = 9;
    for(var i = 1; i < num; i++) {
      var suffix = '', suffixname = '', numeric = '';
      numeric = ', 1';
      for(var j = 0; j < i; j++) numeric += ',000';
      numeric += ' (1e' + (i * 3) + ')';
      if(i==1){suffix = ' K'; suffixname = ' kilo';}
      else if(i==2){suffix = ' M'; suffixname = ' mega';}
      else if(i==3){suffix = ' G'; suffixname = ' giga';}
      else if(i==4){suffix = ' T'; suffixname = ' tera';}
      else if(i==5){suffix =' P'; suffixname = ' peta';}
      else if(i==6){suffix =' E'; suffixname = ' exa';}
      else if(i==7){suffix =' Z'; suffixname = ' zetta';}
      else if(i==8){suffix =' Y'; suffixname = ' yotta';}

      text += '<b>' + suffix + '</b>' + (suffixname ? ': ' : '') + suffixname + numeric + '<br>';
    }
  }


  text += '<br><br>';
  text += '<b>Symbol meanings:</b>';
  text += '<br><br>';
  text += `
    <b>.</b>: decimal point, e.g. 1.5 is one and a half<br>
    <b>*</b>: multiply, e.g. 5*5 = 25<br>
    <b>^</b>: power, e.g. 5^3 = 5*5*5 = 125<br>
    <b>10^</b>: exponential function for logarithm 10 notation<br>
    <b>e^</b>: exponential function for natural log notation. Here, e = 2.71828...`;

  text += '<br><br>';
  text += '<b>Formats:</b>';
  text += '<br><br>';

  for(var i = 0; i < notations.length; i++) {
    var j = notations[i];
    text += '<b>' + upper(Num.N_Names[j]) + '</b><br>';
    text += Num.N_Help[j] + '<br><br>';
  }

  dialog.content.div.innerHTML = text;
}

////////////////////////////////////////////////////////////////////////////////

// Which of the number notations we support in the UI
var notations = [
  Num.N_LATIN, Num.N_ENG, Num.N_HYBRID_T, Num.N_HYBRID_U, Num.N_SCI, Num.N_HYBRID_T_SCI, Num.N_HYBRID_U_SCI,
  // a few implemented but not added in initial version: Num.N_SI, Num.N_ABC, Num.N_LOG, Num.N_EXP, Num.N_HEX
];
var notations_inv = [];
for(var i = 0; i < notations.length; i++) notations_inv[notations[i]] = i;

function createNumberFormatDialog() {
  var changed = false;

  var dialog = createDialog({
    size:DIALOG_LARGE,
    title:'Choose large number notation',
    help:function() { createNumberFormatHelp(notations, precision); },
    onclose:function() {
      if(changed) {
        updateUI(); // some numbers in the UI need to be re-rendered such as on the medals tab
        if(state.currentTab == tabindex_medals) updateMedalUI(); // this one is slow, only do if actually in that tab
      }
    }
  });

  var y2 = 0;
  var h2;

  h2 = 0.05;
  var titleFlex = new Flex(dialog.content, 0, y2, 1, y2 + h2);
  var titleDiv = titleFlex.div;
  //titleDiv.style.border = '1px solid red';
  centerText2(titleDiv);
  y2 += h2;

  h2 = 0.1;
  var choiceFlex = new Flex(dialog.content, 0, y2, 1, y2 + h2);
  var choiceDiv = choiceFlex.div;
  //choiceFlex.div.style.border = '1px solid green';
  y2 += h2 + 0.02;

  h2 = 0.08;
  var descriptionFlex = new Flex(dialog.content, 0.1, y2, 0.8, y2 + h2);
  var descriptionDiv = descriptionFlex.div;
  //descriptionFlex.div.style.border = '1px solid blue';
  y2 += h2 * 1.2;

  h2 = 0.25;
  var examplesFlex = new Flex(dialog.content, 0.1, y2, 0.8, y2 + h2);
  var examplesDiv = examplesFlex.div;
  //examplesFlex.div.style.border = '1px solid blue';
  y2 += h2;

  var notation = Num.notation;

  var title = 'Select which notation to use for large numbers.\n\n';
  for(var i = 0; i < notations.length; i++) {
    var j = notations[i];
    title += Num.N_Names[j] + ':\n' + Num.N_Help[j] + '\n\n';
  }
  dialog.title.div.textEl.title = title;

  var notationDropdown = util.makeAbsElement('select', '10%', '0%', '80%', '45%', choiceDiv);
  notationDropdown.title = title;
  for(var i = 0; i < notations.length; i++) {
    var j = notations[i];
    var el = util.makeElement('option', notationDropdown);
    el.innerText = 'notation: ' + Num.N_Names[j];
    el.title = title;
  }
  notationDropdown.onchange = function() {
    notation = notations[notationDropdown.selectedIndex];
    Num.notation = notation;
    fill();
    changed = true;
  };
  notationDropdown.selectedIndex = notations_inv[Num.notation];
  notationDropdown.style.fontSize = '100%'; // take that of the parent flex-managed element

  //var precisionDropdown = util.makeAbsElement('select', margin, margin * 2 + Math.floor(h / 20), w - margin * 2, Math.floor(h / 20), choiceDiv);
  var precisionDropdown = util.makeAbsElement('select', '10%', '50%', '80%', '45%', choiceDiv);
  for(var i = 3; i <= 6; i++) {
    var el = util.makeElement('option', precisionDropdown);
    el.innerText = 'precision: ' + i;
  }
  precisionDropdown.onchange = function() {
    precision = precisionDropdown.selectedIndex + 3;
    Num.precision = precision;
    fill();
    changed = true;
  };
  precisionDropdown.selectedIndex = Math.min(Math.max(0, Num.precision - 3), 4);
  precisionDropdown.style.fontSize = '100%'; // take that of the parent flex-managed element

  var div = makeDiv('1%', '0%', '98%', '10%', examplesDiv);
  div.innerHTML = '<b>Examples:</b>';
  var precision = Num.precision;
  var examples = [0, 0.03, 1, 7.123456, 150, 1712.29, 14348907.5, 4294967296, 2048e20, 800e27, 7.10915e50, 2.1065e85, 3e303];

  var fill = function(changed) {
    var tableText = '';
    var paddingstyle = '"padding-left:8px; padding-right:8px; padding-top:3px; padding-bottom:3px;"';
    tableText += '<table border="1" style="border-collapse:collapse">';
    tableText += '<tr><td style=' + paddingstyle + '><b>Example</b></td><td style=' + paddingstyle + '><b>Notation</b></td><td width="10%" style="border:none"></td><td style=' + paddingstyle + '><b>Example</b></td><td style=' + paddingstyle + '><b>Notation</b></td></tr>';
    for(var i = 0; i * 2 < examples.length; i++) {
      tableText += '<tr>';
      tableText += '<td style=' + paddingstyle + '>';
      tableText += examples[i].valueOf();
      tableText += '</td><td style=' + paddingstyle + '>'
      tableText += Num(examples[i]).toString(precision, notation);
      tableText += '</td>';
      var j = i + Math.floor(examples.length / 2);
      tableText += '<td style="border:none"> </td>';
      tableText += '<td style=' + paddingstyle + '>';
      tableText += examples[j].valueOf();
      tableText += '</td><td style=' + paddingstyle + '>'
      tableText += Num(examples[j]).toString(precision, notation);
      tableText += '</td>';
      tableText += '</tr>';
    }
    tableText += '</table>';
    descriptionDiv.innerHTML = '<b>Notation description:</b> ' + Num.N_Help[notation];

    div.innerHTML = tableText;
  };

  //var tryFlex = new Flex(dialog.content, 0, y2, 1, y2 + h2);
  //var inputFlex = new Flex(tryFlex, 0, 0, 1, 1);
  //var area = util.makeAbsElement('textarea', '0', '0', '100%', '100%', inputFlex.div);

  var romanbutton = new Flex(dialog.content, 0.1, 0.75, 0.9, 0.8, FONT_BIG_BUTTON).div;
  styleButton(romanbutton, 1);
  var updatebuttontext = function(romanbutton) {
    romanbutton.textEl.innerText = (state.roman == 1) ? 'roman numbers: enabled' : ((state.roman == 0) ? 'roman numbers: up to 12' : 'roman numbers: disabled');
  };
  updatebuttontext(romanbutton);
  registerTooltip(romanbutton, 'Choose whether to use roman numbers for upgrade levels, fruit levels, etc... If disabled, roman numbers are still used up to 12, but for higher values switch to decimal.');
  addButtonAction(romanbutton, bind(function(romanbutton, updatebuttontext, e) {
    state.roman++;
    if(!(state.roman >= 0 && state.roman <= 1)) state.roman = 0;
    updatebuttontext(romanbutton);
    updateUI();
  }, romanbutton, updatebuttontext));
  romanbutton.id = 'numbers_roman';

  fill();
}

function createShortcutsDialog() {
  var dialog = createDialog({title:'Controls'});

  var pos = 0;
  var buttondiv;
  var h = 0.06;

  var makeSettingsButton = function() {
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h, FONT_BIG_BUTTON);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    return button;
  };

  var addSettingsSpacer = function() {
    pos += h * 0.5;
  };

  var button;
  var updatebuttontext;

  button = makeSettingsButton();
  var updatebuttontext = function(button) {
    var action = 'none';
    if(state.keys_numbers == 1) action = 'weather';
    else if(state.keys_numbers == 2) action = 'tabs';
    else if(state.keys_numbers == 3) action = 'fruit';
    else if(state.keys_numbers == 4) action = 'auto-action';
    button.textEl.innerText = 'number keys: ' + action;
  };
  updatebuttontext(button);
  registerTooltip(button, 'Choose what the keyboard number keys do: nothing, activate weather (1-3), switch game tabs, or switch active fruit slot');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.keys_numbers++;
    if(state.keys_numbers > 4) state.keys_numbers = 0;
    updatebuttontext(button);
    setStyle();
  }, button, updatebuttontext));
  button.id = 'controls_numbers';

  button = makeSettingsButton();
  var updatebuttontext = function(button) {
    var action = 'none';
    if(state.keys_numbers_shift == 1) action = 'weather';
    else if(state.keys_numbers_shift == 2) action = 'tabs';
    else if(state.keys_numbers_shift == 3) action = 'fruit';
    else if(state.keys_numbers_shift == 4) action = 'auto-action';
    button.textEl.innerText = 'shift+number keys: ' + action;
  };
  updatebuttontext(button);
  registerTooltip(button, 'Choose what shift + keyboard number keys does: nothing, activate weather (1-3), switch game tabs, or switch active fruit slot');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.keys_numbers_shift++;
    if(state.keys_numbers_shift > 4) state.keys_numbers_shift = 0;
    updatebuttontext(button);
    setStyle();
  }, button, updatebuttontext));
  button.id = 'controls_numbers_shift';

  button = makeSettingsButton();
  var updatebuttontext = function(button) {
    var action = 'none';
    if(state.keys_brackets == 1) action = 'weather';
    else if(state.keys_brackets == 2) action = 'tabs';
    else if(state.keys_brackets == 3) action = 'fruit';
    else if(state.keys_brackets == 4) action = 'auto-action';
    button.textEl.innerText = 'bracket keys: ' + action;
  };
  updatebuttontext(button);
  registerTooltip(button, 'Choose what the [], (), {} or <> keys for previous/next do: nothing, switch game tabs, or switch active fruit slot. There is no difference between the four key pair variations, the different bracket/parenthesis types are supported to have at least one convenient available set of brackets on most international keyboard layouts.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.keys_brackets++;
    if(state.keys_brackets > 4) state.keys_brackets = 0;
    if(state.keys_brackets == 1) state.keys_brackets = 2; // weather not supported for this
    if(state.keys_brackets == 4) state.keys_brackets = 0; // auto-action not supported for this
    updatebuttontext(button);
    setStyle();
  }, button, updatebuttontext));
  button.id = 'controls_brackets';
}

function createNotificationSettingsDialog() {
  var dialog = createDialog({title:'Messages & Sounds'});

  var pos = 0;
  var buttondiv;
  var h = 0.06;

  var makeSettingsButton = function() {
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h, FONT_BIG_BUTTON);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    return button;
  };

  var addSettingsSpacer = function() {
    pos += h * 0.5;
  };

  var button;
  var updatebuttontext;

  var notificationSoundWarning = 'Whether sound works at all depends on your browser and whether playing media is allowed by the settings. Browsers will only play the sound if the game is in a foreground tab. Browsers also require interaction with the page before they allow playing sounds at all, so sounds may not work after refreshing the page and not clicking anything.';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'fern notification sound: ' + (state.notificationsounds[0] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Notification "ding" sound when a fern pops up. ' + notificationSoundWarning);
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.notificationsounds[0] = !state.notificationsounds[0] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_fernsound';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'fullgrown notification sound: ' + (state.notificationsounds[1] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Notification "ding" sound when crops get fullgrown. ' + notificationSoundWarning);
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.notificationsounds[1] = !state.notificationsounds[1] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_growsound';

  addSettingsSpacer();

  var sliderTitleFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h * 0.5);
  pos += h * 0.5;
  sliderTitleFlex.div.innerText = 'Sound volume:';

  var sliderFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h * 0.5);
  pos += h * 0.6;
  makeSlider(sliderFlex, state.volume, function(value) {
    if(!(value >= 0 && value <= 1)) value = 1;
    state.volume = value;
    playNotificationSound(1000, state.volume);
  });

  addSettingsSpacer();

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'auto save in message log: ' + (state.messagelogenabled[0] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Show auto save message in the message log. This setting does not stop auto-save from working, it just does so silently.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.messagelogenabled[0] = !state.messagelogenabled[0] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_savemessages';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'tree levels in message log: ' + (state.messagelogenabled[1] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Show message log message when tree levels up. If disabled, the message will only appear if tree reached highest level ever.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.messagelogenabled[1] = !state.messagelogenabled[1] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_treelevelmessages';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'upgrades available in message log: ' + (state.messagelogenabled[2] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Show message log message when regular upgrade available. If disabled, the message will still appear for never before seen upgrades.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.messagelogenabled[2] = !state.messagelogenabled[2] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_upgrademessages';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'abbreviated help in message log: ' + (state.messagelogenabled[3] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Show abbreviated versions of help dialog in the message log. If disabled, they still appear if seen the first time ever');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.messagelogenabled[3] = !state.messagelogenabled[3] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_helpmessages';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'pause/resume in message log: ' + (state.messagelogenabled[4] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Show game paused / resume in message log when pausing/unpausing');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.messagelogenabled[4] = !state.messagelogenabled[4] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_pausemessages';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'fruit drops in message log: ' + (state.messagelogenabled[5] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Show message log message when a fruit drops');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.messagelogenabled[5] = !state.messagelogenabled[5] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_fruitdropmessages';
}



function createAdvancedSettingsDialog() {
  var dialog = createDialog({title:'Preferences'});

  var pos = 0;
  var buttondiv;
  var h = 0.06;

  var makeSettingsButton = function() {
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h, FONT_BIG_BUTTON);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    return button;
  };

  var addSettingsSpacer = function() {
    pos += h * 0.5;
  };

  var button;
  var updatebuttontext;


  button = makeSettingsButton();
  var updatebuttontext = function(button) {
    var style = '?';
    if(state.uistyle == 2) style = 'dark';
    else if(state.uistyle == 3) style = 'more dark';
    else style = 'light';
    button.textEl.innerText = 'interface theme: ' + style;
  };
  updatebuttontext(button);
  registerTooltip(button, 'Change the interface style');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.uistyle++;
    if(state.uistyle > 3) state.uistyle = 1;
    updatebuttontext(button);
    setStyle();
  }, button, updatebuttontext));
  button.id = 'preferences_theme';


  button = makeSettingsButton();
  var updatebuttontext = function(button) {
    var style = '?';
    if(state.tooltipstyle == 0) style = 'none (tooltips off)';
    if(state.tooltipstyle == 1) style = 'dark';
    if(state.tooltipstyle == 2) style = 'light';
    if(state.tooltipstyle == 3) style = 'translucent';
    if(state.tooltipstyle == 4) style = 'brown';
    button.textEl.innerText = 'tooltip style: ' + style;
  };
  updatebuttontext(button);
  registerTooltip(button, 'Change the tooltip style or disable them');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.tooltipstyle++;
    if(state.tooltipstyle > 4) state.tooltipstyle = 0;
    updatebuttontext(button);
    removeAllTooltips();
  }, button, updatebuttontext));
  button.id = 'preferences_tooltip';

  button = makeSettingsButton();
  var updatebuttontext = function(button) {
    button.textEl.innerText = state.sidepanel ? 'side panel: auto' : 'side panel: off';
  };
  updatebuttontext(button);
  registerTooltip(button, 'Choose whether the side panel with upgrade shortcuts and stats summary may appear or not. If on, the side panel only appears if the window is wide enough.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.sidepanel = (state.sidepanel ? 0 : 1);
    updatebuttontext(button);
    removeAllTooltips();
    updateRightPane();
  }, button, updatebuttontext));
  button.id = 'preferences_sidepanel';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'dialog back buttons: ' + (state.cancelbuttonright ? 'rightmost' : 'leftmost'); };
  updatebuttontext(button);
  registerTooltip(button, 'For dialogs with multiple buttons at the bottom, whether "back"/"cancel" buttons are the rightmost or leftmost of the group');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.cancelbuttonright = !state.cancelbuttonright;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_cancelright';


  addSettingsSpacer();

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'save on refresh / actions: ' + (state.saveonaction ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Whether to auto-save when refreshing browser tab and after each action. If this is on, actions are saved reliably even when closing the web browser soon after. If this is off, the game will still auto-save every few minutes anyway, but the last minutes of gameplay may get lost when closing browser tab. Remember it\'s also recommended to export saves manually regularly since web browsers can lose all data easily.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.saveonaction = !state.saveonaction;
    updatebuttontext(button);
    saveNow(); // save immediately now: otherwise if you refresh after toggling this setting, it'll reset back exactly due to not saving...
  }, button, updatebuttontext));
  button.id = 'preferences_saveonclose';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'auto store interesting fruit: ' + (state.keepinterestingfruit ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Whether to automatically store a fruit of a higher tier or higher season than ever seen. Normally fruits drop to the sacrificial pool automatically and must be manually moved to storage if you want to keep them. Automatically storing only works if there is space, and only if the fruit is of a newer tier than seen before, you must still manually check fruits anyway when trying to find or fuse ones with particular abilities.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.keepinterestingfruit = !state.keepinterestingfruit;
    updatebuttontext(button);
    saveNow(); // save immediately now: otherwise if you refresh after toggling this setting, it'll reset back exactly due to not saving...
  }, button, updatebuttontext));
  button.id = 'preferences_interestingfruits';

  addSettingsSpacer();

  button = makeSettingsButton();
  button.textEl.innerText = 'reset "never show again" help dialogs';
  registerTooltip(button, 'Resets the "never show again" of all help dialogs, so you\'ll see them again next time until you disable them individually again.');
  addButtonAction(button, function(e) {
    var dialog = createDialog({
      size:DIALOG_SMALL,
      functions:function() {
        state.help_disable = {};
        closeAllDialogs();
        return true;
      },
      names:'reset',
      title:'Reset help'
    });
    dialog.content.div.innerHTML = 'This resets the "never show again" setting of all individual help dialogs. You\'ll get the help dialogs again in the situations that make them appear. You can individually disable them again.';
  });
  button.id = 'preferences_resethelp';


  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'enable help dialogs: ' + (state.disableHelp ? 'no' : 'yes'); };
  updatebuttontext(button);
  registerTooltip(button, 'Whether to enable pop-up help dialogs. Set to no if you consider the dialogs too intrusive. However, if you leave them enabled, you can also always disable individual help dialogs with their "never show again" button, so you can still see new ones, which may be useful to get information about new game mechanics that unlock later.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.disableHelp = !state.disableHelp;
    updatebuttontext(button);
    saveNow(); // save immediately now: otherwise if you refresh after toggling this setting, it'll reset back exactly due to not saving...
  }, button, updatebuttontext));
  button.id = 'preferences_enablehelp';


  addSettingsSpacer();


  button = makeSettingsButton();
  button.textEl.innerText = 'messages & sounds...';
  registerTooltip(button, 'Message log and sound notifications');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    createNotificationSettingsDialog();
  }, button, updatebuttontext));
  button.id = 'preferences_notifications';


  button = makeSettingsButton();
  button.textEl.innerText = 'controls...';
  registerTooltip(button, 'Change various keyboard controls.');
  addButtonAction(button, function(e) {
    createShortcutsDialog();
  });
  button.id = 'preferences_controls';

  button = makeSettingsButton();
  button.textEl.innerText = 'number format...';
  registerTooltip(button, 'Change the precision and display type for large numbers.');
  addButtonAction(button, function(e) {
    createNumberFormatDialog();
  });
  button.id = 'preferences_number';


  addSettingsSpacer();
}


var showing_stats = false;


function createStatsDialog() {
  showing_stats = true;
  var dialog = createDialog({
    title:'Player statistics',
    scrollable:true,
    icon:image_stats,
    onclose:function() {
      showing_stats = false;
    }
  });

  var div = dialog.content.div;

  var text = '';

  var open = '<span class="efStatsValue">';
  var close = '</span>';

  if(state.g_numresets > 0) {
    text += '<b>Current Run</b><br>';
  }
  if(state.g_numresets > 0 || state.treelevel > 0) text += '• tree level: ' + open + state.treelevel + close + '<br>';
  text += '• start time: ' + open + util.formatDate(state.c_starttime) + close + '<br>';
  var duration = util.getTime() - state.c_starttime - state.c_pausetime;
  text += '• duration: ' + open + util.formatDuration(duration) + close + '<br>';
  var c_res = Res(state.c_res);
  c_res.essence.addInPlace(getUpcomingFruitEssence().essence);
  text += '• total earned: ' + open + c_res.toString() + close + '<br>';
  text += '• highest resources: ' + open + state.c_max_res.toString() + close + '<br>';
  text += '• highest production/s: ' + open + state.c_max_prod.toString() + close + '<br>';
  text += '• ferns: ' + open + state.c_numferns + close + '<br>';
  text += '• planted (permanent): ' + open + state.c_numfullgrown + close + '<br>';
  text += '• planted (brassica): ' + open + state.c_numplantedbrassica + close + '<br>';
  text += '• crops deleted: ' + open + state.c_numunplanted + close + '<br>';
  text += '• upgrades: ' + open + state.c_numupgrades + close + '<br>';
  if(state.g_numfruits > 0) {
    text += '• fruits: ' + open + state.c_numfruits + close + '<br>';
    text += '• fruit upgrades: ' + open + state.c_numfruitupgrades + close + '<br>';
  }
  if(state.g_numresets > 0 || state.treelevel > 0) text += '• weather abilities activated: ' + open + state.c_numabilities + close + '<br>';
  if(state.upgrades[upgrade_sununlock].count > 0) text += '• sun ability berry boost, run time, cooldown time, total cycle: ' + open + '+' + getSunSeedsBoost().toPercentString()  + ', ' + util.formatDuration(getSunDuration(), true) + close + ', ' + open + util.formatDuration(getSunWait() - getSunDuration(), true) + close + ', ' + open + util.formatDuration(getSunWait(), true) + close + '<br>';
  if(state.upgrades[upgrade_mistunlock].count > 0) text += '• mist ability mushroom boost, run time, cooldown time, total cycle: ' + open + '+' + getMistSporesBoost().toPercentString() + ' (-' + getMistSeedsBoost().rsub(1).toPercentString() + ' consumption), ' + util.formatDuration(getMistDuration(), true) + close + ', ' + open + util.formatDuration(getMistWait() - getMistDuration(), true) + close + ', ' + open + util.formatDuration(getMistWait(), true) + close + '<br>';
  if(state.upgrades[upgrade_rainbowunlock].count > 0) text += '• rainbow ability flower boost, run time, cooldown time, total cycle: ' + open + '+' + getRainbowFlowerBoost().toPercentString() + ', ' + util.formatDuration(getRainbowDuration(), true) + close + ', ' + open + util.formatDuration(getRainbowWait() - getRainbowDuration(), true) + close + ', ' + open + util.formatDuration(getRainbowWait(), true) + close + '<br>';
  if(state.g_res.resin.neqr(0)) {
    text += '• resin/hour: ' + open + getResinHour().toString() + close + '<br>';
    text += '• best resin/hour: ' + open + state.c_res_hr_best.resin.toString() +
            ', at level ' + state.c_res_hr_at.resin.valueOf() +
            ', at runtime ' + util.formatDuration(state.c_res_hr_at_time.resin.valueOf(), true) +
            close + '<br>';
  }
  if(state.g_res.twigs.neqr(0)) {
    text += '• twigs/hour: ' + open + getTwigsHour().toString() + close + '<br>';
    text += '• best twigs/hour: ' + open + state.c_res_hr_best.twigs.toString() +
            ', at level ' + state.c_res_hr_at.twigs.valueOf() +
            ', at runtime ' + util.formatDuration(state.c_res_hr_at_time.twigs.valueOf(), true) +
            close + '<br>';
  }


  if(state.g_numresets > 0) {
    text += '<br>';
    text += '<b>Total</b><br>';
    text += '• highest tree level: ' + open + state.g_treelevel + ' (before: ' + state.g_p_treelevel + ')' + close + '<br>';
    text += '• achievements: ' + open + state.g_nummedals + close + '<br>';
    text += '• start time: ' + open + util.formatDate(state.g_starttime) + close + '<br>';
    text += '• duration: ' + open + util.formatDuration(util.getTime() - state.g_starttime - state.g_pausetime) + close + '<br>';
    text += '• total earned: ' + open + state.g_res.toString() + close + '<br>';
    text += '• highest resources: ' + open + state.g_max_res.toString() + close + '<br>';
    text += '• highest production/s: ' + open + state.g_max_prod.toString() + close + '<br>';
    text += '• highest earned any run: ' + open + state.g_max_res_earned.toString() + close + '<br>';
    text += '• ferns: ' + open + state.g_numferns + close + '<br>';
    text += '• planted (permanent): ' + open + state.g_numfullgrown + close + '<br>';
    text += '• planted (brassica): ' + open + state.g_numplantedbrassica + close + '<br>';
    text += '• crops deleted: ' + open + state.g_numunplanted + close + '<br>';
    text += '• upgrades: ' + open + state.g_numupgrades + close + '<br>';
    if(state.g_numfruits > 0) {
      text += '• fruits: ' + open + state.g_numfruits + close + '<br>';
      text += '• fruit upgrades: ' + open + state.g_numfruitupgrades + close + '<br>';
    }
    text += '• weather abilities activated: ' + open + state.g_numabilities + close + '<br>';
    text += '• season changes seen: ' + open + state.g_seasons + close + '<br>';
    text += '• fastest run: ' + open + util.formatDuration(state.g_fastestrun) + close + '<br>';
    text += '• longest run: ' + open + util.formatDuration(state.g_slowestrun) + close + '<br>';
  }

  // these stats either are at the end of current run, or total, depending on whether "total" is visible due to having done transcensions
  text += '• achievements: ' + open + state.medals_earned + close + '<br>';
  text += '• achievements production bonus: ' + open + '+' + state.medal_prodmul.subr(1).toPercentString() + close + '<br>';


  var s = getSeason();
  text += '• current season: ' + open + seasonNames[s] + close + '<br>';
  text += '• spring flower bonus: ' + open + '+' + getSpringFlowerBonus().subr(1).toPercentString() + close + '<br>';
  var duration_day = 3600 * 24;
  if(duration >= duration_day) {
    text += '• summer berry bonus: ' + open + '+' + getSummerBerryBonus().subr(1).toPercentString() + close + '<br>';
    text += '• summer mushroom bonus: ' + open + '+' + getSummerMushroomBonus().subr(1).toPercentString() + close + '<br>';
  }
  if(duration >= duration_day * 2) {
    text += '• autumn mushroom bonus: ' + open + '+' + getAutumnMushroomBonus().subr(1).toPercentString() + close + '<br>';
    text += '• autumn berry bonus: ' + open + '+' + getAutumnBerryBonus().subr(1).toPercentString() + close + '<br>';
    text += '• autumn twigs bonus: ' + open + '+' + getAutumnMistletoeBonus().subr(1).toPercentString() + close + '<br>';
  }
  if(duration >= duration_day * 3) {
    text += '• winter harsh conditions malus: ' + open + '-' + Num(1).sub(getWinterMalus()).toPercentString() + close + '<br>';
    text += '• winter tree warmth bonus: ' + open + '+' + getWinterTreeWarmth().subr(1).toPercentString() + close + '<br>';
    text += '• winter resin bonus: ' + open + '+' + getWinterTreeResinBonus().subr(1).toPercentString() + close + '<br>';
  }
  if(haveMultiplicity(CROPTYPE_BERRY)) {
    text += '• berry multiplicity: ' + open + '+' + (getMultiplicityBonusBase(CROPTYPE_BERRY)).toPercentString() + ' per other of same type of max 1 tier difference' + close + '<br>';
    text += '• mushroom multiplicity: ' + open + '+' + (getMultiplicityBonusBase(CROPTYPE_MUSH)).toPercentString() + ' per other of same type of max 1 tier difference' + close + '<br>';
  }
  if(haveMultiplicity(CROPTYPE_FLOWER)) {
    text += '• flower multiplicity: ' + open + '+' + (getMultiplicityBonusBase(CROPTYPE_FLOWER)).toPercentString() + ' per other of same type of max 1 tier difference' + close + '<br>';
  }
  if(haveMultiplicity(CROPTYPE_BEE)) {
    text += '• bee multiplicity: ' + open + '+' + (getMultiplicityBonusBase(CROPTYPE_BEE)).toPercentString() + ' per other of same type of max 1 tier difference' + close + '<br>';
  }
  if(haveMultiplicity(CROPTYPE_STINGING)) {
    text += '• stinging multiplicity: ' + open + '+' + (getMultiplicityBonusBase(CROPTYPE_STINGING)).toPercentString() + ' per other of same type of max 1 tier difference' + close + '<br>';
  }
  if(state.squirrel_evolution > 0) {
    text += '• squirrel evolutions: ' + open + state.squirrel_evolution + close + '<br>';
  }
  if(etherealMistletoeUnlocked()) {
    text += '• ethereal mistletoe upgrades completed: ' + open + state.g_nummistletoeupgradesdone + close + '<br>';
    text += '• ethereal mistletoe upgrades time spent: ' + open + util.formatDuration(state.g_mistletoeupgradetime, true) + close + '<br>';
    text += '• ethereal mistletoe unspent idle time: ' + open + util.formatDuration(state.mistletoeidletime, true) + close + '<br>';
    text += '• ethereal mistletoe total idle time: ' + open + util.formatDuration(state.g_mistletoeidletime, true) + close + '<br>';
  }
  if(state.g_fruits_recovered > 0) {
    text += '• fruits recovered: ' + open + state.g_fruits_recovered + close + '<br>';
  }
  text += '<br>';

  if(state.g_numresets > 0) {
    text += '<b>Transcensions</b><br>';
    text += '• transcensions: ' + open + state.g_numresets + close;
    if(state.g_num_auto_resets >= 1) {
      text += ' (automated: ' + open + state.g_num_auto_resets + close;
      if(state.numLastAutomaticTranscends >= 1) {
        text += ', last streak: ' + open + state.numLastAutomaticTranscends + close;
      }
      text += ')';
    }
    text += '<br>';
    if(state.numLastAutomaticTranscends >= 1) {
      text += '• resources from last auto-transcend streak: ' + open + state.automaticTranscendRes.toString() + close;
      text += '<br>';
    }
    var n = Math.min(Math.min(15, state.reset_stats_time.length), state.reset_stats_level.length);
    if(n > 0) {
      if(n == 1) {
        text += '• last transcension level: ' + open;
      } else {
        text += '• last transcension levels (recent first): ' + open;
      }
      for(var i = 0; i < n; i++) {
        var j = n - 1 - i;
        var minutes = state.reset_stats_time[state.reset_stats_time.length - 1 - i] * 5;
        var timetext = '';
        if(minutes < 60) timetext = Num(minutes).toString(1) + 'm';
        else if(minutes < 60 * 5) timetext = Num(minutes / 60).toString(2) + 'h';
        else if(minutes < 60 * 48) timetext = Num(minutes / 60).toString(1) + 'h';
        else timetext = Num(minutes / (24 * 60)).toString(1) + 'd';
        text += (i == 0 ? ' ' : ', ') +
            state.reset_stats_level[state.reset_stats_level.length - 1 - i] +
            ' (' + timetext +
            (state.reset_stats_challenge[state.reset_stats_challenge.length - 1 - i] ? ', C' : '') +
            ')';
      }
      text += close + '<br>';
    }
    text += '<br>';

    text += '<b>Ethereal</b><br>';
    text += '• ethereal tree level: ' + open + state.treelevel2 + close + '<br>';
    text += '• total resin: ' + open + state.g_res.resin.toString() + close + '<br>';
    text += '• ethereal crops planted: ' + open + state.g_numfullgrown2 + close + '<br>';
    text += '• ethereal crops deleted: ' + open + state.g_numunplanted2 + close + '<br>';
    text += '<br>';
  }

  if(haveInfinityField()) {
    text += '<b>Infinity</b><br>';
    text += '• infinity production boost to basic field: ' + open + state.infinityboost.toPercentString() + close + '<br>';
    text += '• infinity crops planted: ' + open + state.g_numplanted3 + close + '<br>';
    text += '• infinity crops deleted: ' + open + state.g_numunplanted3 + close + '<br>';
    if(haveFishes()) {
      text += '• fishes placed: ' + open + state.g_numplanted_fish + close + '<br>';
      text += '• fishes deleted: ' + open + state.g_numunplanted_fish + close + '<br>';
    }
    text += '<br>';
  }

  if(state.g_numresets > 0 && state.challenges_unlocked) {
    text += '<b>Challenges</b><br>';
    if(state.challenge) {
      text += '• current challenge: ' + open + upper(challenges[state.challenge].name) + close + '<br>';
    } else {
      text += '• current challenge: ' + open + 'None' + close + '<br>';
    }
    text += '• challenges attempted: ' + open + (state.g_numresets_challenge + (state.challenge ? 1 : 0)) + close + '<br>';
    text += '• challenges unlocked: ' + open + state.challenges_unlocked + close + '<br>';
    text += '• challenges completed: ' + open + state.challenges_completed + close + '<br>';
    if(state.challenges_completed != state.challenges_completed2) {
      text += '• challenge stages completed: ' + open + state.challenges_completed3 + close + '<br>';
      text += '• challenge fully completed: ' + open + state.challenges_completed2 + close + '<br>';
    }
    text += '• total challenge production bonus: ' + open + totalChallengeBonus(0).toPercentString() + close + '<br>';
    text += '• total challenge resin + twigs bonus: ' + open + totalChallengeBonus(1).toPercentString() + close + '<br>';

    text += '<br>';
  }

  if(state.g_numresets > 0) {
    if(state.challenge) {
      text += '<b>Previous Run (Non-challenge)</b><br>';
    } else {
      text += '<b>Previous Run</b><br>';
    }
    text += '• tree level: ' + open + state.p_treelevel + close + '<br>';
    text += '• start time: ' + open + util.formatDate(state.p_starttime) + close + '<br>';
    text += '• duration: ' + open + util.formatDuration(state.p_runtime) + close + '<br>';
    text += '• total earned: ' + open + state.p_res.toString() + close + '<br>';
    text += '• highest resources: ' + open + state.p_max_res.toString() + close + '<br>';
    text += '• highest production/s: ' + open + state.p_max_prod.toString() + close + '<br>';
    text += '• ferns: ' + open + state.p_numferns + close + '<br>';
    text += '• planted (permanent): ' + open + state.p_numfullgrown + close + '<br>';
    text += '• planted (brassica): ' + open + state.p_numplantedbrassica + close + '<br>';
    text += '• crops deleted: ' + open + state.p_numunplanted + close + '<br>';
    text += '• upgrades: ' + open + state.p_numupgrades + close + '<br>';
    if(state.g_numfruits > 0) {
      text += '• fruits: ' + open + state.p_numfruits + close + '<br>';
      text += '• fruit upgrades: ' + open + state.p_numfruitupgrades + close + '<br>';
    }
    text += '• weather abilities activated: ' + open + state.p_numabilities + close + '<br>';
    if(state.g_res.resin.neqr(0)) {
      text += '• resin/hour: ' + open + (state.p_res.resin.divr(state.p_runtime / 3600)).toString() + close + '<br>';
      text += '• best resin/hour: ' + open + state.p_res_hr_best.resin.toString() +
              ', at level ' + state.p_res_hr_at.resin.valueOf() +
              ', at runtime ' + util.formatDuration(state.p_res_hr_at_time.resin.valueOf()) +
              close + '<br>';
    }
    if(state.g_res.twigs.neqr(0)) {
      text += '• twigs/hour: ' + open + (state.p_res.twigs.divr(state.p_runtime / 3600)).toString() + close + '<br>';
      text += '• best twigs/hour: ' + open + state.p_res_hr_best.twigs.toString() +
              ', at level ' + state.p_res_hr_at.twigs.valueOf() +
              ', at runtime ' + util.formatDuration(state.p_res_hr_at_time.twigs.valueOf()) +
              close + '<br>';
    }
    text += '<br>';
  }

  div.innerHTML = text;
}

var showing_changelog = false;

var getAboutHeader = function() {
  var text = '';
  text += 'Reddit: <a target="_blank" href="https://www.reddit.com/r/etherealfarm/">https://www.reddit.com/r/etherealfarm/</a>';
  text += '<br/>';
  text += 'Discord: <a target="_blank" href="https://discord.gg/9eaTxXvMT2">https://discord.gg/9eaTxXvMT2</a>';
  text += '<br/>';
  text += 'Fandom wiki: <a target="_blank" href="https://ethereal-farm.fandom.com/wiki/Ethereal_Farm_Wiki">https://ethereal-farm.fandom.com/wiki/Ethereal_Farm_Wiki</a>';
  text += '<br/><br/>';
  return text;
};

function createChangelogDialog() {
  showing_changelog = true;

  var icon = images_fern[1];
  if(holidayEventActive() == 1) {
    icon = present_images[Math.floor(Math.random() * 4)]
  }
  if(holidayEventActive() == 2) {
    icon = bunny_image;
  }
  if(holidayEventActive() == 4) {
    icon = images_pumpkin_small[0];
  }
  if(state.beta) {
    icon = image_beta;
  }

  var dialog = createDialog({title:'About', icon:icon, onclose:function(cancel) {
    showing_changelog = false;
  }, scrollable:true});

  var text = '';

  text += programname + ' v' + formatVersion();
  text += '<br/><br/>';

  if(window['global_is_beta']) {
    text += '<b>This is a beta test version! Saves from a beta version can never be imported into the regular game! But you can import saves from the regular game here for testing.</b>';
    text += '<br/><br/>';
  }

  text += getAboutHeader();

  text += 'Changelog:';
  text += '<br/><br/>';


  text += getChangeLog();

  text += 'Copyright (c) 2020-2024 by Lode Vandevenne';

  dialog.content.div.innerHTML = text;
}


// if opt_failed_save is true, the dialog is shown due to an actual failed save so the message is different.
function showSavegameRecoveryDialog(opt_failed_save) {
  var description;
  if(opt_failed_save) {
    description = '<font color="red"><b>Loading failed</b></font>. Read this carefully to help recover your savegame if you don\'t have backups. Copypaste all the recovery savegame(s) below and save them in a text file. Once they\'re stored safely by you, try some of them in the "import save" dialog under settings. One of them may be recent enough and work. Even if the recovery saves don\'t work now, a future version of the game may fix it. Apologies for this.';
  } else {
    description = 'Recovery saves. These may be older saves, some from previous game versions. Use at your own risk, but if your current save has an issue, save all of these to a text file as soon as possible so that if there\'s one good one it doesn\'t risk being overwritten by more issues. Try importing each of them, hopefully at least one will be good and recent enough.';
  }

  var saves = getRecoverySaves();
  var text = '';
  for(var i = 0; i < saves.length; i++) {
    text += saves[i][0] + '\n' + saves[i][1] + '\n\n';
  }
  if(saves.length == 0) {
    text = 'No recovery saves found. Ethereal farm savegames are stored in local storage of your web browser for the current website. If you expected to see savegames here, there may be several possible reasons:\n\n' +
            ' • Your browser deleted (or doesn\'t save) local storage for this website\n\n' +
            ' • After manually performing a hard reset all data is erased\n\n' +
            ' • Never played the game on this device or in this browser.\n\n' +
            ' • Played the game on a different website (URL). If you played on a different website before and want to continue here, you can export the save there and import it here in the settings.\n\n' +
            ' • Other modifications to the URL: for example, ensure no "www" in front and "https", not "http" in front.\n\n';
  }

  if(!opt_failed_save && saves.length > 0 && !savegame_recovery_situation) {
    // also add current
    save(state, function(s) {
      text += 'current' + '\n' + s + '\n\n';
      showExportTextDialog('Recovery saves', description, text, 'ethereal-farm-recovery-' + util.formatDate(util.getTime(), true) + '.txt', !opt_failed_save);
    });
  } else {
    showExportTextDialog('Recover old save', description, text, 'ethereal-farm-recovery-' + util.formatDate(util.getTime(), true) + '.txt', !opt_failed_save);
  }
}

// show a dialog to export the text, to clipboard, by save as file, ...
function showExportTextDialog(title, description, text, filename, opt_close_on_clipboard) {
  var large = title.length > 400 || text.length > 1000;

  var clipboardSupported = document.queryCommandSupported && document.queryCommandSupported('copy') && document.execCommand;
  var dialog;
  var extrafun = undefined;
  var extraname = undefined;

  if(clipboardSupported) {
    extrafun = function(e) {
      area.select();
      area.focus();
      try {
        document.execCommand('copy');
      } catch(e) {
        showMessage('failed to copy to clipboard', C_ERROR, 0, 0);
        textFlex.div.innerText = 'failed to copy to clipboard, copy it manually with ctrl+c instead';
        textFlex.div.style.color = 'red';
        return true;
      }
      if(opt_close_on_clipboard) closeAllDialogs();
      showMessage('save copied to clipboard');
      return true;
    };
    extraname = 'to clipboard';
  }

  dialog = createDialog({
    title:title,
    size:(large ? DIALOG_MEDIUM : DIALOG_SMALL),
    functions:[function(e) {
      var a = document.createElement('a');
      a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(area.value + '\n'));
      a.setAttribute('download', filename);
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if(opt_close_on_clipboard) closeAllDialogs();
      showMessage('save exported to file');
      return true;
    }, extrafun],
    names:['download', extraname],
    cancelname:'back'
  });


  if(description) {
    var textFlex = new Flex(dialog.content, 0, 0, 1, 0.15);
    textFlex.div.innerHTML = description;
  }

  var areaFlex = new Flex(dialog.content, 0, 0.2, 1, 1);
  var area = util.makeAbsElement('textarea', '0', '0', '100%', '100%', areaFlex.div);

  area.value = text;
  area.select();
}


function importSaveFromDialog(shift, ctrl, enc, messageFlex) {
  enc = enc.trim();
  if(enc == '') return;
  load(enc, function(state) {
    showMessage(loadedFromLocalImportMessage, C_UNIMPORTANT, 0, 0);
    state.g_numimports++;
    state.g_lastimporttime = util.getTime();
    closeAllDialogs();
    removeChallengeChip();
    removeMedalChip();
    removeHelpChip();
    clearUndo();
    initUI();
    if(shift) state.paused = true;
    if(ctrl) state.paused = false;
    updatePausedUI();
    update();
    util.clearLocalStorage(localstorageName_recover); // if there was a recovery save, delete it now assuming that a successful import means some good save exists
    savegame_recovery_situation = false;

    saveNow(); // save immediately now: otherwise if e.g. you close browser on mobile device now, it may still load the old save when reloading the browser later
  }, function(state) {
    var message = importfailedmessage;
    if(state && state.error_reason == 1) message += '\n' + loadfailreason_toosmall;
    if(state && state.error_reason == 2) message += '\n' + loadfailreason_notbase64;
    if(state && state.error_reason == 3) message += '\n' + loadfailreason_signature;
    if(state && state.error_reason == 4) message += '\n' + loadfailreason_format;
    if(state && state.error_reason == 5) message += '\n' + loadfailreason_decompression;
    if(state && state.error_reason == 6) message += '\n' + loadfailreason_checksum;
    if(state && state.error_reason == 7) message += '\n' + loadfailreason_toonew;
    if(state && state.error_reason == 8) message += '\n' + loadfailreason_tooold;
    if(state && state.error_reason == 9) message += '\n' + loadfailreason_beta;
    messageFlex.div.innerText = message;
    messageFlex.div.style.color = '';
    if(state && state.error_reason) messageFlex.div.style.color = '#f00';
  });
}


function createSettingsDialog() {
  var dialog = createDialog({title:'Main Menu'});
  var pos = 0.05;
  var gap = 0.025;

  var makeSettingsButton = function() {
    var h = 0.06;
    var buttonFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h, FONT_BIG_BUTTON);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    return button;
  };


  var button;
  button = makeSettingsButton();
  button.textEl.innerText = 'save now';
  registerTooltip(button, 'Save to local storage now. The game also autosaves every few minutes, but this button is useful before shutting down the computer or browser right after doing some game actions to ensure they are saved. Also force-stores the undo state.');
  addButtonAction(button, function() {
    storeUndo(state); // also store undo state now, similar to shift+click on the undo button
    saveNow(function(s) {
      showMessage(manualSavedStateMessage);
      closeAllDialogs();
    });
  });
  button.id = 'settings_save';


  button = makeSettingsButton();
  button.textEl.innerText = 'export save';
  registerTooltip(button, 'Export an encoded savegame, for backups.');
  addButtonAction(button, function() {
    state.g_numexports++;
    // this gets updated even if user would then close the dialog without actually saving it, we can't know whether they actually properly stored the text or not
    state.g_lastexporttime = util.getTime();
    save(state, function(s) {
      var description = 'Export a savegame backup: copy or download the encoded savegame below, and store it somewhere safe. Do this regularly: even though the game autosaves locally in the web browser, browsers can easily lose this data. This contains all your progress!';
      showExportTextDialog('Export save', description, s, 'ethereal-farm-' + util.formatDate(util.getTime(), true) + '.txt', true);
    });
  });
  button.id = 'settings_export';

  button = makeSettingsButton();
  button.textEl.innerText = 'import save';
  registerTooltip(button, 'Import a save, which you created with "export save". Hold shift while pressing the import button to load the savegame paused (frozen in time like it was back then, season and all, without gaining extra resources)');
  addButtonAction(button, function(e) {
    var w = 500, h = 500;
    var dialog = createDialog({
      size:DIALOG_SMALL,
      functions: function(shift, ctrl) { importSaveFromDialog(shift, ctrl, area.value, textFlex); return true; },
      names:'import',
      names_shift:'import paused',
      names_ctrl:'import unpaused',
      cancelname:'cancel',
      title:'Import savegame'
    });
    var textFlex = new Flex(dialog.content, 0, 0, 1, 0.1);
    textFlex.div.innerHTML = 'Import a savegame backup. You can create a backup with "export save". Paste in here and press "import".<br/><font color="red">Warning: this overwrites your current game!</font>';
    var area = util.makeAbsElement('textarea', '1%', '30%', '98%', '68%', dialog.content.div);
    if(!isTouchDevice()) {
      // the select or the focus call may cause mobile browsers to zoom deep into the save text field, but that's wrong because the import save button then becomes invisible (you have to manually zoom out again to see it)
      // in firefox mobile there's then even a bug where you can't fully zoom out manually after this, unless you double tap
      // unfortunately both the select and focus function do it
      // so disable the focusing for touch devices. At least you don't benefit much from focusing the area there anyway, since you have to click it to paste there anyway
      area.select();
      area.focus();
    }
  });
  button.id = 'settings_import';

  button = makeSettingsButton();
  button.textEl.innerText = 'hard reset';
  registerTooltip(button, hardresetwarning);
  addButtonAction(button, function(e) {
    var w = 500, h = 500;
    var dialog = createDialog({
      size:DIALOG_SMALL,
      functions:function(e) { hardReset(); closeAllDialogs(); return true; },
      names:'reset',
      title:'Hard reset'
    });
    dialog.content.div.innerText = hardresetwarning;
    dialog.content.div.style.color = 'red';
  });
  button.id = 'settings_hardreset';

  pos += gap;

  button = makeSettingsButton();
  button.textEl.innerText = 'preferences';
  registerTooltip(button, 'Various UI, saving, gameplay and other settings.');
  addButtonAction(button, function(e) {
    createAdvancedSettingsDialog();
  });
  button.id = 'settings_preferences';

  button = makeSettingsButton();
  button.textEl.innerText = 'number format';
  registerTooltip(button, 'Change the precision and display type for large numbers.');
  addButtonAction(button, function(e) {
    createNumberFormatDialog();
  });
  button.id = 'settings_number';

  pos += gap;

  button = makeSettingsButton();
  button.textEl.innerText = 'player stats';
  addButtonAction(button, function(e) {
    createStatsDialog();
  });
  button.id = 'settings_player_stats';

  if(state.challenges_unlocked) {
    button = makeSettingsButton();
    button.textEl.innerText = 'challenge stats';
    addButtonAction(button, function(e) {
      createAllChallengeStatsDialog();
    });
    button.id = 'settings_challenge_stats';
  }

  pos += gap;

  button = makeSettingsButton();
  button.textEl.innerText = 'help';
  addButtonAction(button, function(e) {
    createHelpDialog();
  });
  button.id = 'settings_help';

  button = makeSettingsButton();
  button.textEl.innerText = 'about & changelog';
  addButtonAction(button, function(e) {
    createChangelogDialog();
  });
  button.id = 'settings_about';
}

// x0 and x1 are start and end coordinates from 0 to 11
function addTopBarFlex(x0, x1, opt_fontsize) {
  var n = 11;
  var f = 1 / n;
  return new Flex(topFlex, [0.05 + f * x0,0,-0.4*f,n], [0.5,0,-0.4,f], [0.05 + f * (x1 - 1),0,0.4*f,n], [0.5,0,0.4,f], opt_fontsize);
}

var pauseButtonCanvas = undefined;
var aboutButtonCanvas = undefined;
var aboutButtonCanvas_lastHoliday = undefined;

var aboutButtonCanvas_lastHoliday = -1;

function updateSettingsAboutIcon() {
  if(!aboutButtonCanvas) return;
  var holiday = holidayEventActive();
  if(holiday != aboutButtonCanvas_lastHoliday) {
    if(window['global_is_beta']) renderImage(image_beta, aboutButtonCanvas);
    else if(holiday == 1) renderImage(present_images[Math.floor(Math.random() * 4)], aboutButtonCanvas);
    else if(holiday == 2) renderImage(bunny_image, aboutButtonCanvas);
    else if(holiday == 4) renderImage(images_pumpkin_small[0], aboutButtonCanvas);
    else renderImage(images_fern[1], aboutButtonCanvas);
    aboutButtonCanvas_lastHoliday = holiday;
  }
}

function initSettingsUI() {
  var gearbutton = addTopBarFlex(0, 1).div;
  var canvas = createCanvas('0%', '0%', '100%', '100%', gearbutton);
  renderImage(image_gear, canvas);
  styleButton0(gearbutton, true);
  gearbutton.title = 'Settings';

  addButtonAction(gearbutton, function() {
    createSettingsDialog();
    //updateSettingsAboutIcon();
  }, 'settings');
  gearbutton.id = 'settings_button';

  // changelog / about button
  var aboutbutton = addTopBarFlex(10, 11).div;
  aboutButtonCanvas = createCanvas('0%', '0%', '100%', '100%', aboutbutton);
  updateSettingsAboutIcon();
  styleButton0(aboutbutton, true);
  aboutbutton.title = 'About';

  addButtonAction(aboutbutton, function() {
    createChangelogDialog();
    //updateSettingsAboutIcon();
  }, 'about');
  aboutbutton.id = 'about_button';

  // pause button
  var pausebutton = addTopBarFlex(1, 2).div;;
  registerTooltip(pausebutton, 'Pause the game. Pauses seasons, timers, growth, all progress, and everything else.<br>Allows to interact and open dialogs, but actions cannot be performed.');
  canvas = createCanvas('0%', '0%', '100%', '100%', pausebutton);
  pauseButtonCanvas = canvas;
  renderImage(image_pause, canvas);
  styleButton0(pausebutton, true);

  addButtonAction(pausebutton, bind(function(canvas) {
    state.paused = !state.paused;
    state.paused_while_heavy_computing = state.paused && heavy_computing;
    if(state.messagelogenabled[4]) {
      if(state.paused) showMessage(pausedMessage);
      else showMessage(unpausedMessage);
    }
    updatePausedUI();
    setAriaLabel(pausebutton, state.paused ? 'paused' : 'pause');
  }, canvas), 'pause');
  aboutbutton.id = 'pause_button';

  var undobutton = addTopBarFlex(2, 4, FONT_DIALOG_BUTTON);
  styleButton(undobutton.div, undefined, true);
  undobutton.div.textEl.innerText = 'Undo';
  registerAction(undobutton.div, function(shift, ctrl) {
    //if(state.paused) return; // undo is broken with current pause implementation, gives black screen and risk of wrong times
    if(shift) {
      showMessage('held shift key while pressing undo button, so saving undo instead.');
      storeUndo(state);
    } else {
      loadUndo();
      update();
    }
    removeAllTooltips();
  }, 'undo', {
    tooltip:function() {
      return 'Undo your last action(s). There is only a single undo, press again to redo.<br><br>' +
        'Undo restores the state before your last action, in case of multiple actions in quick succesion (max ' + util.formatDuration(minUndoTime) + '), this group of actions is undone.<br><br>' +
        'No resource gain is lost (income during the undone timespan is computed correctly), even if pressing undo after a long time. However, undo save time duration is limited to ' + util.formatDuration(maxUndoTime) + '.' +
        '';
    },
    label_shift:'store undo now'
  });
  undobutton.div.id = 'undo_button';
}
