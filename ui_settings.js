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


// Full names of the first few latin number suffixes
var suffixnames = [
  '',
  'thousand',
  'million',
  'billion',
  'trillion',
  'quadrillion',
  'quintillion',
  'sextillion',
  'septillion',
  'octillion',
  'nonillion',
  'decillion',
  'undecillion',
  'duodecillion',
  'tredecillion',
  'quattuordecillion',
  'quindecillion',
  'sexdecillion',
  'septendecillion',
  'octodecillion',
  'novemdecillion',
  'vigintillion',
  'unvigintillion',
  'duovigintillion',
  'trevigintillion',
  'quattuorvigintillion',
  'quinvigintillion',
  'sexvigintillion',
  'septenvigintillion',
  'octovigintillion',
  'novemvigintillion',
  'trigintillion',
  'untrigintillion',
  'duotrigintillion',
  //'tretrigintillion',
  //'quattuortrigintillion',
];

function createNumberFormatExplanation(notation, precision, parent) {
  parent.innerHTML = '';

  var lineHeight = 0.045;
  var margin = 0.01;
  var ypos = 0.05;
  var div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 100) + '%', parent);
  ypos += lineHeight;

  if(notation == Num.N_SI) {
    div.innerHTML = '<b>SI Symbols:</b>';
    var num = 9;
    for(var i = 1; i < num; i++) {
      var x = margin;
      var y = ypos + (i - 1) * lineHeight;
      var w2 = 1 - margin * 2;
      var h2 = lineHeight;
      div = makeDiv((x * 100) + '%', (y * 100) + '%', (w2 * 100) + '%', (h2 * 100) + '%', parent);
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

      div.innerHTML = '<b>' + suffix + '</b>' + (suffixname ? ': ' : '') + suffixname + numeric;
    }

    ypos += num * lineHeight + lineHeight;
    div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 100) + '%', parent);
    div.innerHTML = '<b>Symbol Meanings:</b>';
    ypos += lineHeight;
    div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 4 * 100) + '%', parent);
    div.innerHTML = `
      <b>.</b>: decimal point, e.g. 1.5 is one and a half<br>
      <b>*</b>: multiply, e.g. 5*5 = 25<br>
      <b>^</b>: power, e.g. 5^3 = 5*5*5 = 125<br>
      <b>e</b>: scientific exponent, e.g. 5e4 = 5*10^4 = 50000 (4 zeroes)<br>`;
  } else if(notation == Num.N_LATIN || notation == Num.N_HYBRID_T || notation == Num.N_HYBRID_U) {
    div.innerHTML = '<b>Latin Suffixes:</b>';
    var num = suffixnames.length + 3;
    if(notation == Num.N_HYBRID_T) num = 5;
    if(notation == Num.N_HYBRID_U) num = 13;
    for(var i = 1; i < num; i++) {
      var x = margin + (i < num / 2 ? 0 : 0.5);
      var y = ypos + (i - 1) * lineHeight - (i < num / 2 ? 0 : (0.5 * (num - 1) * lineHeight));
      if(num < 8) {
        x = margin;
        y = ypos + (i - 1) * lineHeight;
      }
      var w2 = 1 - margin * 2;
      var h2 = lineHeight;
      div = makeDiv((x * 100) + '%', (y * 100) + '%', (w2 * 100) + '%', (h2 * 100) + '%', parent);
      var suffix = '', suffixname = '', numeric = '';
      if(i < suffixnames.length) {
        suffix = getLatinSuffix(i * 3);
        suffixname = suffixnames[i];
        if(i <= 4) {
          numeric = ', 1';
          for(var j = 0; j < i; j++) numeric += ',000';
          numeric += ' (1e' + (i * 3) + ')';
        } else {
          numeric = ', 1e' + (i * 3);
        }
      } else if(i == suffixnames.length) {
        suffix = '⋮';
      } else if(i == suffixnames.length + 2) {
        suffix = 'etc...';
      } else if(i == suffixnames.length + 1) {
        suffix = 'C';
        suffixname = 'centillion';
        numeric = ', 1e303';
      }

      div.innerHTML = '<b>' + suffix + '</b>' + (suffixname ? ': ' : '') + suffixname + numeric;
    }
  } else if(notation == Num.N_ABC) {
    div.innerHTML = '<b>abc suffixes:</b>';
    var num = suffixnames.length + 1;
    for(var i = 1; i < num; i++) {
      var x = margin + (i < num / 2 ? 0 : 0.5);
      var y = ypos + i * lineHeight - (i < num / 2 ? 0 : (0.5 * num * lineHeight));
      var w2 = 1 - margin * 2;
      var h2 = lineHeight;
      div = makeDiv((x * 100) + '%', (y * 100) + '%', (w2 * 100) + '%', (h2 * 100) + '%', parent);
      var suffix = '', numeric = '';
      if(i < suffixnames.length) {
        suffix = getSuffixAbc(i * 3);
        if(i <= 6) {
          numeric = '1';
          for(var j = 0; j < i; j++) numeric += ',000';
          numeric += ' (1e' + (i * 3) + ')';
        } else {
          numeric = '1e' + (i * 3);
        }
      } else if(i == suffixnames.length) {
        suffix = 'etc...';
      }

      div.innerHTML = '<b>' + suffix + '</b>' + (numeric ? ': ' : '') + numeric;
    }
  } else if(notation == Num.N_SCI || notation == Num.N_ENG) {
    div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 100) + '%', parent);
    div.innerHTML = '<b>Symbol Meanings:</b>';
    ypos += lineHeight;
    div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 4 * 100) + '%', parent);
    div.innerHTML = `
      <b>.</b>: decimal point, e.g. 1.5 is one and a half<br>
      <b>*</b>: multiply, e.g. 5*5 = 25<br>
      <b>^</b>: power, e.g. 5^3 = 5*5*5 = 125<br>
      <b>e</b>: scientific exponent, e.g. 5e4 = 5*10^4 = 50000 (4 zeroes)<br>`;
  } else if(notation == Num.N_EXP || notation == Num.N_LOG) {
    div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 100) + '%', parent);
    div.innerHTML = '<b>Symbol Meanings:</b>';
    ypos += lineHeight;
    div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 5 * 100) + '%', parent);
    div.innerHTML = `
      <b>.</b>: decimal point, e.g. 1.5 is one and a half<br>
      <b>*</b>: multiply, e.g. 5*5 = 25<br>
      <b>^</b>: power, e.g. 5^3 = 5*5*5 = 125<br>
      <b>10^</b>: exponential function for logarithm 10 notation<br>
      <b>e^</b>: exponential function for natural log notation. Here, e = 2.71828...`;
  } else if(notation == Num.N_HEX) {
    div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 100) + '%', parent);
    div.innerHTML = '<b>Symbol Meanings:</b>';
    ypos += lineHeight;
    div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 6 * 100) + '%', parent);
    div.innerHTML = `
      <b>.</b>: hexadecimal point, e.g. 1.5 is one and 5 sixteenths in base 16<br>
      <b>*</b>: multiply, e.g. 5*5 = 25<br>
      <b>^</b>: power, e.g. 5^3 = 5*5*5 = 125<br>
      <b>A-F</b>: hex digits<br>
      <b>p</b>: scientific exponent for hexadecimal (base 16), e.g. #Ap4 = #A*16^4 = #A0000 (4 hexadecimal zeroes)<br>
      <b>#</b>: indicates value is in hexadecimal`;
  } else {
    div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 100) + '%', parent);
    div.innerHTML = '<b>Symbol Meanings:</b>';
    ypos += lineHeight;
    div = makeDiv((margin * 100) + '%', (ypos * 100) + '%', (100 - margin * 2 * 100) + '%', (lineHeight * 8 * 100) + '%', parent);
    div.innerHTML = `
      <b>.</b>: decimal point, e.g. 1.5 is one and a half<br>
      <b>*</b>: multiply, e.g. 5*5 = 25<br>
      <b>^</b>: power, e.g. 5^3 = 5*5*5 = 125<br>
      <b>e</b>: scientific exponent, e.g. 5e4 = 5*10^4 = 50000 (4 zeroes)<br>
      <b>p</b>: scientific exponent for hexadecimal (base 16), e.g. Ae4 = A*16<sub>dec</sub>^4 = A0000 (4 hexadecimal zeroes)<br>
      <b>#</b>: indicates value is in hexadecimal<br>
      <b>10^</b>: exponential function for logarithm 10 notation<br>
      <b>e^</b>: exponential function for natural log notation. Here, e = 2.71828...`;
  }

}

// Which of the number notations we support in the UI
var notations = [
  Num.N_LATIN, Num.N_ENG, Num.N_HYBRID_T, Num.N_HYBRID_U, Num.N_SCI,
  // a few implemented but not added in initial version: Num.N_SI, Num.N_ABC, Num.N_LOG, Num.N_EXP, Num.N_HEX
];
var notations_inv = [];
for(var i = 0; i < notations.length; i++) notations_inv[notations[i]] = i;

function createNumberFormatDialog() {
  var dialogFlex = createDialog(DIALOG_LARGE);
  var dialog = dialogFlex.div;

  var y2 = 0;
  var h2;

  h2 = 0.05;
  var titleFlex = new Flex(dialogFlex, 0, y2, 1, y2 + h2, 0.4);
  var titleDiv = titleFlex.div;
  //titleDiv.style.border = '1px solid red';
  centerText2(titleDiv);
  y2 += h2;

  h2 = 0.1;
  var choiceFlex = new Flex(dialogFlex, 0, y2, 1, y2 + h2, 0.3);
  var choiceDiv = choiceFlex.div;
  //choiceFlex.div.style.border = '1px solid green';
  y2 += h2 + 0.02;

  h2 = 0.08;
  var descriptionFlex = new Flex(dialogFlex, 0.01, y2, 0.99, y2 + h2, 0.3);
  var descriptionDiv = descriptionFlex.div;
  //descriptionFlex.div.style.border = '1px solid blue';
  y2 += h2;

  h2 = 0.15;
  var examplesFlex = new Flex(dialogFlex, 0, y2, 1, y2 + h2, 0.3);
  var examplesDiv = examplesFlex.div;
  //examplesFlex.div.style.border = '1px solid blue';
  y2 += h2;

  h2 = 1 - y2 - 0.15;
  var infoFlex = new Flex(dialogFlex, 0, y2, 1, y2 + h2, 0.3);
  var infoDiv = infoFlex.div;
  //infoFlex.div.style.border = '1px solid blue';
  y2 += h2;

  var notation = Num.notation;

  titleDiv.textEl.innerText = 'Choose large number notation';
  var title = 'Select which notation to use for large numbers.\n\n';
  for(var i = 0; i < notations.length; i++) {
    var j = notations[i];
    title += Num.N_Names[j] + ':\n' + Num.N_Help[j] + '\n\n';
  }
  titleDiv.textEl.innerText = 'Choose large number notation';
  titleDiv.textEl.title = title;

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
  };
  precisionDropdown.selectedIndex = Math.min(Math.max(0, Num.precision - 3), 4);
  precisionDropdown.style.fontSize = '100%'; // take that of the parent flex-managed element

  var div = makeDiv('1%', '0%', '98%', '10%', examplesDiv);
  //div.innerHTML = 'examples, with formatted display in <b>bold</b>:';
  div.innerHTML = '<b>Examples:</b>';
  var div2 = makeDiv('1%', '15%', '98%', '85%', examplesDiv);
  var precision = Num.precision;
  var examples = [0, 0.3, 1, 7.123456, 12, 150, 1712.29, 14348907.5, 4294967296, 5559060566555523, 2048e20, 7.10915e50, 2.1065e85, 5.650987e300];
  var exampleDivs = [];
  var half = Math.ceil(examples.length / 2);
  for(var i = 0; i < examples.length; i++) {
    var x = (i < half) ? 0 : 0.5;
    var y = (i - (i < half ? 0 : half)) / half;
    exampleDivs[i] = makeDiv((100 * x) + '%', (100 * y) + '%', '50%', (100 / half) + '%', div2);
  }
  var fill = function() {
    for(var i = 0; i < examples.length; i++) {
      var text = examples[i].valueOf();
      text += ': <b>' + Num(examples[i]).toString(precision, notation) + '</b>';
      exampleDivs[i].innerHTML = text;
    }
    descriptionDiv.innerHTML = '<b>Notation description:</b> ' + Num.N_Help[notation];
    createNumberFormatExplanation(notation, precision, infoDiv);
  };

  fill();
}

function createAdvancedSettingsDialog() {
  var dialogFlex = createDialog();
  var dialog = dialogFlex.div;

  var title = new Flex(dialogFlex, 0, 0, 1, 0.05, 0.4);
  centerText2(title.div);
  title.div.textEl.innerText = 'Preferences';
  title.div.textEl.style.fontWeight = 'bold';

  var pos = 0.05;
  var buttondiv;

  var makeSettingsButton = function() {
    var h = 0.05;
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(dialogFlex, 0.1, pos, 0.9, pos + h, 0.5);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    return button;
  };
  var button;
  var updatebuttontext;

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'save on close: ' + (state.saveonexit ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Whether to auto-save when closing the browser window or tab. If off, then still auto-saves every few minutes, but no longer on unload. Toggling this setting will also immediately cause a save.');
  button.onclick = bind(function(button, updatebuttontext, e) {
    state.saveonexit = !state.saveonexit;
    updatebuttontext(button);
    saveNow(); // save immediately now: otherwise if you refresh after toggling this setting, it'll reset back exactly due to not saving...
  }, button, updatebuttontext);

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'shift+click deletes plant: ' + (state.allowshiftdelete ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Allow directly deleting plant without any dialog or confirmation by shift+clicking it on the field. Note that you can also always shift+click empty fields to repeat last planted type (opposite of deleting), that always works regardless of this setting.');
  button.onclick = bind(function(button, updatebuttontext, e) {
    state.allowshiftdelete = !state.allowshiftdelete;
    updatebuttontext(button);
  }, button, updatebuttontext);

  button = makeSettingsButton();
  updatebuttontext = function(button) {
    var style = '?';
    if(state.tooltipstyle == 0) style = 'none';
    if(state.tooltipstyle == 1) style = 'dark';
    if(state.tooltipstyle == 2) style = 'light';
    if(state.tooltipstyle == 3) style = 'translucent';
    button.textEl.innerText = 'tooltip style: ' + style;
  };
  updatebuttontext(button);
  registerTooltip(button, 'Change the tooltip style or disable them');
  button.onclick = bind(function(button, updatebuttontext, e) {
    state.tooltipstyle++;
    if(state.tooltipstyle >= 4) state.tooltipstyle = 0;
    updatebuttontext(button);
    removeAllTooltips();
  }, button, updatebuttontext);
}

function createStatsDialog() {
  var dialogFlex = createDialog();

  var titleDiv = new Flex(dialogFlex, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Player Statistics';

  var div = new Flex(dialogFlex, 0.01, 0.11, 0.99, 0.85, 0.35).div;
  div.style.overflowY = 'scroll';
  div.style.backgroundColor = '#aac';

  var text = '';

  var open = '<font color="#fff">';
  var close = '</font>';

  if(state.g_numresets > 0) {
    text += '<b>Total</b><br>';
    text += '• highest tree level: ' + open + state.g_treelevel + close + '<br>';
    text += '• achievements: ' + open + state.g_nummedals + close + '<br>';
    text += '• start time: ' + open + util.formatDate(state.g_starttime) + close + '<br>';
    text += '• duration: ' + open + util.formatDuration(util.getTime() - state.g_starttime) + close + '<br>';
    text += '• total earned: ' + open + state.g_res.toString(true) + close + '<br>';
    text += '• highest resources: ' + open + state.g_max_res.toString(true) + close + '<br>';
    text += '• highest production/s: ' + open + state.g_max_prod.toString(true) + close + '<br>';
    text += '• ferns: ' + open + state.g_numferns + close + '<br>';
    text += '• planted (fullgrown): ' + open + state.g_numfullgrown + close + '<br>';
    text += '• planted (watercress): ' + open + state.g_numplantedshort + close + '<br>';
    text += '• unplanted: ' + open + state.g_numunplanted + close + '<br>';
    text += '• weather abilities activated: ' + open + state.g_numabilities + close + '<br>';
    text += '• season changes seen: ' + open + state.g_seasons + close + '<br>';
    text += '<br>';
  }

  if(state.g_numresets > 0) {
    text += '<b>Ethereal</b><br>';
    text += '• transcensions: ' + open + state.g_numresets + close + '<br>';
    if(state.reset_stats.length == 1) {
      text += '• last transcension level: ' + open;
    } else {
      text += '• last transcension levels: ' + open;
    }
    for(var i = 0; i < 10; i++) {
      var j = state.reset_stats.length - 1 - i;
      if(j < 0) break;
      text += ' ' + state.reset_stats[j];
    }
    text += close + '<br>';
    text += '• ethereal planted (fullgrown): ' + open + state.g_numfullgrown2 + close + '<br>';
    text += '<br>';
  }

  text += '<b>Current</b><br>';
  if(state.g_numresets > 0 || state.treelevel > 0) text += '• tree level: ' + open + state.treelevel + close + '<br>';
  text += '• start time: ' + open + util.formatDate(state.c_starttime) + close + '<br>';
  text += '• duration: ' + open + util.formatDuration(util.getTime() - state.c_starttime) + close + '<br>';
  text += '• total earned: ' + open + state.c_res.toString(true) + close + '<br>';
  text += '• highest resources: ' + open + state.c_max_res.toString(true) + close + '<br>';
  text += '• highest production/s: ' + open + state.c_max_prod.toString(true) + close + '<br>';
  text += '• ferns: ' + open + state.c_numferns + close + '<br>';
  text += '• planted (fullgrown): ' + open + state.c_numfullgrown + close + '<br>';
  text += '• planted (watercress): ' + open + state.c_numplantedshort + close + '<br>';
  text += '• unplanted: ' + open + state.c_numunplanted + close + '<br>';
  if(state.g_numresets > 0 || state.treelevel > 0) text += '• weather abilities activated: ' + open + state.c_numabilities + close + '<br>';
  text += '<br>';

  if(state.g_numresets > 0) {
    text += '<b>Previous</b><br>';
    text += '• tree level: ' + open + state.p_treelevel + close + '<br>';
    text += '• start time: ' + open + util.formatDate(state.p_starttime) + close + '<br>';
    text += '• duration: ' + open + util.formatDuration(util.getTime() - state.c_starttime) + close + '<br>';
    text += '• total earned: ' + open + state.p_res.toString(true) + close + '<br>';
    text += '• highest resources: ' + open + state.p_max_res.toString(true) + close + '<br>';
    text += '• highest production/s: ' + open + state.p_max_prod.toString(true) + close + '<br>';
    text += '• ferns: ' + open + state.p_numferns + close + '<br>';
    text += '• planted (fullgrown): ' + open + state.p_numfullgrown + close + '<br>';
    text += '• planted (watercress): ' + open + state.p_numplantedshort + close + '<br>';
    text += '• unplanted: ' + open + state.p_numunplanted + close + '<br>';
    text += '• weather abilities activated: ' + open + state.p_numabilities + close + '<br>';
    text += '<br>';
  }

  div.innerHTML = text;
}


function createChangelogDialog() {
  var dialogFlex = createDialog();

  var titleDiv = new Flex(dialogFlex, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'About';

  var div = new Flex(dialogFlex, 0.01, 0.11, 0.99, 0.85, 0.3).div;
  div.style.overflowY = 'scroll';
  div.style.backgroundColor = '#aac';

  var text = '';

  text += 'Ethereal Farm';
  text += '<br/><br/>';

  text += 'Reddit: <a target="_blank" href="https://www.reddit.com/r/etherealfarm/">https://www.reddit.com/r/etherealfarm/</a>';
  text += '<br/>';
  text += 'Github: <a target="_blank" href="https://github.com/lvandeve/etherealfarm">https://github.com/lvandeve/etherealfarm</a>';
  text += '<br/><br/>';

  text += 'Game version: ' + programname + ' v' + formatVersion();
  text += '<br/><br/>';
  text += 'Changelog:';
  text += '<br/><br/>';


  text += '0.1.13 (2020-12-30):';
  text += '<br/>';
  text += '• Mushrooms now only get seeds from neighbors, so they can\'t produce spores if they don\'t have berries as neighbors in the field.';
  text += '<br/>';
  text += '• The global overconsumption system has been removed since this now takes place locally amongst groups of mushroom/berry neighbors.';
  text += '<br/>';
  text += '• Nettles now also negatively affect neighboring flowers, instead of only berries.';
  text += '<br/>';
  text += '• Leech effect takes the extra seeds consumption through the mushrooms neighboring producers.';
  text += '<br/>';
  text += '• Internal field production algorithm updated to support the neighbor-based consumption/production effects.';
  text += '<br/>';
  text += '• Trees still consume spores globally, mushrooms are not required to be next to the tree. Maybe this makes sense in a future update but it may cause an issue of discoverability when one doesn\'t yet know you want to upgrade the tree.';
  text += '<br/>';
  text += '• The goal of this is to add more crop interaction and positional elements to the game';

  text += '<br/><br/>';


  text += '0.1.12 (2020-12-28):';
  text += '<br/>';
  text += '• Fix accidental 7x7 field bug, 6x6 is currently the maximum if the relevant upgrade is purchased.';
  text += '<br/><br/>';

  text += '0.1.11 (2020-12-27):';
  text += '<br/>';
  text += '• Added back ethereal upgrades (2 for now), now costing resin. The 6x6 field size upgrade is now actually reachable.';
  text += '<br/><br/>';


  text += '0.1.10 (2020-12-26):';
  text += '<br/>';
  text += '• Internal fixes.';
  text += '<br/><br/>';

  text += '0.1.9 (2020-12-26):';
  text += '<br/>';
  text += '• The resin and transcension system has been redesigned. There are now multiple ethereal field plant types and they give direct boosts to the basic field. All resin has been refunded and can be re-used with the new system.';
  text += '<br/>';
  text += '• The pericarps resource has been removed from the game. Nothing is lost from this since only its production per second ("ethereal field power") was used and this was determined by resin which has been refunded.';
  text += '<br/>';
  text += '• Unused resin also gives a small boost now.';
  text += '<br/>';
  text += '• The ethereal upgrades (which used to cost ethereal field power) are currently removed (and replaced by ethereal plant effects instead), but new ones, probably costing resin, may be added back in a future game update.';
  text += '<br/>';
  text += '• A few other minor tweaks, e.g. the savegame now remembers which tab you had open and the assigned shift key plant.';
  text += '<br/><br/>';

  text += '0.1.8 (2020-12-24):';
  text += '<br/>';
  text += '• Changed the savegame format internally to be more compatible with future updates.';
  text += '<br/>';
  text += '• Minor tweaks and fixes.';
  text += '<br/><br/>';

  text += '0.1.7 (2020-12-23):';
  text += '<br/>';
  text += '• Added new plant type: watercress, and made it the starter plant. Also remains important as non-idle (active) plant throughout the game.';
  text += '<br/>';
  text += '• Nerfed costs and production of other plants to compensate the watercress power.';
  text += '<br/>';
  text += '• Added "a" keyboard shortcut for abilities.';
  text += '<br/><br/>';

  text += '0.1.6 (2020-12-22):';
  text += '<br/>';
  text += '• Added undo button.';
  text += '• Removed the free replant of same plant type at same spot since undo can be used instead now.';
  text += '<br/>';
  text += '• Weather abilities unlock immediately rather than through extra upgrade step, and merged their choice upgrades.';
  text += '<br/><br/>';

  text += '0.1.5 (2020-12-21):';
  text += '<br/>';
  text += '• Added new plant type: nettle';
  text += '<br/>';
  text += '• Added estimated time counters to several cost tooltips';
  text += '<br/>';
  text += '• Balancing tweaks';
  text += '<br/>';
  text += '• Increased ethereal upgrades but still very conservative for now as first run can still get balanced more';
  text += '<br/><br/>';

  text += '0.1.4 (2020-12-20):';
  text += '<br/>';
  text += '• Added "choice" upgrades';
  text += '<br/>';
  text += '• Added a third weather ability';
  text += '<br/>';
  text += '• Made higher level mushrooms produce more spores';
  text += '<br/><br/>';

  text += '0.1.3 (2020-12-19):';
  text += '<br/>';
  text += '• Added weather abilities';
  text += '<br/>';
  text += '• Balancing: slightly cheaper 3rth and higher tier plants';
  text += '<br/><br/>';

  text += '0.1.2 (2020-12-19):';
  text += '<br/>';
  text += '• Slightly boosted fern and it can now also give spores';
  text += '<br/>';
  text += '• Tweaked the upgrade-button UI';
  text += '<br/><br/>';

  text += '0.1.1 (2020-12-18):';
  text += '<br/>';
  text += '• Balance changes: fixed too slow beginning of game, but also the too powerful long term upgrade scaling';
  text += '<br/><br/>';

  text += '0.1.0 (2020-12-18):';
  text += '<br/>';
  text += '• Initial test release, no patches applied yet';
  text += '<br/>';
  text += '• Since this is a first alpha release, balancing and mechanics can still change quite bit!';
  text += '<br/><br/>';

  text += 'Copyright (c) 2020 by Lode Vandevenne';

  div.innerHTML = text;
}


function createHelpDialog() {
  var dialogFlex = createDialog();

  var titleDiv = new Flex(dialogFlex, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Help';

  var div = new Flex(dialogFlex, 0.01, 0.11, 0.99, 0.85, 0.3).div;
  div.style.overflowY = 'scroll';
  div.style.backgroundColor = '#aac';

  var text = '';

  text += 'Ethereal farm is an incremental game that begins by growing and upgrading crops in this ethereal world.';
  text += '<br/><br/>';
  text += 'The text in the message log at the bottom will guide you through how to play. A short summary of the first steps: initially you have no resources but can get some from clicking ferns. Then you can click on field tiles to plant crops and soon resources are gained automatically. The rest will be revealed when the time is ready.';
  text += '<br/><br/>';
  text += 'You can click resources in the resource panel to see more detailed breakdown. You can click fullgrown crops to see detailed stats. As the game progresses, more types of information may appear in there.';
  text += '<br/><br/>';
  text += '<b>List of keyboard shortcuts:</b>';
  text += '<br/><br/>';
  text += ' • <b>"a"</b>: activate all unlocked weather abilities';
  text += '<br/>';
  text += ' • <b>shift + click empty field</b>: plant last planted type';
  text += '<br/>';
  text += ' • <b>shift + click non-empty field</b>: delete plant, only if this is enabled in preferences';
  text += '<br/>';
  text += ' • <b>ctrl + click empty field</b>: plant a watercress (does not affect last planted type for shift key)';
  text += '<br/>';
  text += ' • <b>shift + click upgrade</b>: buy as many of this upgrade as you can afford';
  text += '<br/>';
  text += ' • <b>shift + click undo</b>: save the undo state now, rather than load it. This overwrites your undo so eliminates any chance of undoing now. This will also be overwritten again if you actions a minute later.';
  text += '<br/>';
  text += ' • <b>shift + click save import dialog</b>: import and old savegame, but do not run the time, so you get the resources at the time of saving rather than with all production during that time added.';
  text += '<br/>';
  text += ' • <b>esc</b>: close dialogs.';
  text += '<br/><br/>';

  text += '<b>Savegame recovery:</b>';
  text += '<br/><br/>';
  text += 'This game auto-saves every few minutes in local storage in the web browser, but please use <i>settings -> export save</i> regularly for backups, because a local storage savegame can easily get lost.';
  text += '<br/><br/>';
  text += 'If something goes wrong with your savegame, there may be a few older recovery savegames. Click <a style="color:#44f;" id="recovery">here</a> to view them.';

  text += '<br/><br/><br/>';
  text += 'Game version: ' + programname + ' v' + formatVersion();
  text += '<br/><br/>';
  text += 'Copyright (c) 2020 by Lode Vandevenne';

  div.innerHTML = text;

  var el = document.getElementById('recovery');
  el.onclick = function() {
    showSavegameRecoveryDialog();
  };
}

// if opt_failed_save is true, the dialog is shown due to an actual failed save so the message is different.
function showSavegameRecoveryDialog(opt_failed_save) {
  var title;
  if(opt_failed_save) {
    title = '<font color="red"><b>Loading failed</b></font>. Read this carefully to help recover your savegame if you don\'t have backups. Copypaste all the recovery savegame(s) below and save them in a text file. Once they\'re stored safely by you, try some of them in the "import save" dialog under settings. One of them may be recent enough and work. Even if the recovery saves don\'t work now, a future version of the game may fix it. Apologies for this.';
  } else {
    title = 'Recovery saves. These may be older saves, some from previous game versions. Use at your own risk, but if your current save has an issue, save all of these to a text file as soon as possible so that if there\'s one good one it doesn\'t risk being overwritten by more issues.';
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
      showExportTextDialog(title, text, 'ethereal-farm-recovery-' + util.formatDate(util.getTime(), true) + '.txt', !opt_failed_save);
    });
  } else {
    showExportTextDialog(title, text, 'ethereal-farm-recovery-' + util.formatDate(util.getTime(), true) + '.txt', !opt_failed_save);
  }
}

// show a dialog to export the text, to clipboard, by save as file, ...
function showExportTextDialog(title, text, filename, opt_close_on_clipboard) {
  var large = title.length > 500 || text.length > 1000;

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
        showMessage('failed to copy to clipboard', '#f00', '#ff0');
        textFlex.div.innerText = 'failed to copy to clipboard, copy it manually with ctrl+c instead';
        textFlex.div.style.color = 'red';
        return;
      }
      if(opt_close_on_clipboard) closeAllDialogs();
      showMessage('save copied to clipboard', '#aaa');
    };
    extraname = 'to clipboard';
  }

  dialog = createDialog(large ? DIALOG_MEDIUM : DIALOG_SMALL, function(e) {
    var a = document.createElement('a');
    a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(area.value + '\n'));
    a.setAttribute('download', filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if(opt_close_on_clipboard) closeAllDialogs();
    showMessage('save exported to file', '#aaa');
  }, 'download', 'back', extrafun, extraname);


  var textFlex = new Flex(dialog, 0.02, 0.01, 0.98, 0.15, 0.3);
  textFlex.div.innerHTML = title;

  var areaFlex = new Flex(dialog, 0.02, 0.2, 0.98, 0.8, 0.3);
  var area = util.makeAbsElement('textarea', '0', '0', '100%', '100%', areaFlex.div);

  area.value = text;
}


function initSettingsUI_in(dialogFlex) {

  var pos = 0.05;
  var gap = 0.02;

  var parent = dialogFlex.div;

  var makeSettingsButton = function() {
    var h = 0.05;
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(dialogFlex, 0.1, pos, 0.9, pos + h, 0.5);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    return button;
  };



  var title = new Flex(dialogFlex, 0, 0, 1, 0.05, 0.4);
  centerText2(title.div);
  title.div.textEl.innerText = 'Settings';
  title.div.textEl.style.fontWeight = 'bold';
  var button;
  button = makeSettingsButton();
  button.textEl.innerText = 'save now';
  registerTooltip(button, 'Save to local storage now. The game also autosaves every few minutes so you don\'t need this button often.');
  button.onclick = function() {
    saveNow(function(s) {
      showMessage(manualSavedStateMessage);
      util.setLocalStorage(s, localstorageName_manual);
      closeAllDialogs();
    });
  };


  button = makeSettingsButton();
  button.textEl.innerText = 'export save';
  registerTooltip(button, 'Export an encoded savegame, for backups.');
  button.onclick = function() {
    state.g_numexports++;
    // this gets updated even if user would then close the dialog without actually saving it, we can't know whether they actually properly stored the text or not
    state.g_lastexporttime = util.getTime();
    save(state, function(s) {
      var title = 'Export a savegame backup: copy or download the encoded savegame below, and store it somewhere safe. Do this regularly: even though the game autosaves in the web browser, browsers can easily lose this data. This contains all your progress!';
      showExportTextDialog(title, s, 'ethereal-farm-' + util.formatDate(util.getTime(), true) + '.txt', true);
    });
  };

  button = makeSettingsButton();
  button.textEl.innerText = 'import save';
  registerTooltip(button, 'Import a save, which you created with "export save"');
  button.onclick = function(e) {
    var w = 500, h = 500;
    var dialog = createDialog(false, function(e) {
      var shift = e.shiftKey;
      var enc = area.value;
      enc = enc.trim();
      if(enc == '') return;
      load(enc, function(state) {
        if(shift) {
          state.prevtime = state.time = util.getTime();
          postload(state);
          showMessage('Held shift key while importing this save, so no resources added for the time between exporting and importing now (loaded as if the time was back then). To get those resources, don\'t hold shift while loading.');
        }
        dialog.cancelFun();
        state.g_numimports++;
        state.g_lastimporttime = util.getTime();
        closeAllDialogs();
        initUI();
        update();
        util.clearLocalStorage(localstorageName_recover); // if there was a recovery save, delete it now assuming that a successful import means some good save exists
        savegame_recovery_situation = false;
      }, function(state) {
        var message = importfailedmessage;
        if(state && state.error_reason == 1) message += '\n' + loadfailreason_toosmall;
        if(state && state.error_reason == 2) message += '\n' + loadfailreason_notbase64;
        if(state && state.error_reason == 3) message += '\n' + loadfailreason_signature;
        if(state && state.error_reason == 4) message += '\n' + loadfailreason_format;
        if(state && state.error_reason == 5) message += '\n' + loadfailreason_decompression;
        if(state && state.error_reason == 6) message += '\n' + loadfailreason_checksum;
        if(state && state.error_reason == 7) message += '\n' + loadfailreason_toonew;
        textFlex.div.innerText = message;
        textFlex.div.style.color = 'black';
      });
    }, 'import', 'cancel');
    var textFlex = new Flex(dialog, 0.01, 0.01, 0.99, 0.1, 0.4);
    textFlex.div.innerHTML = 'Import a savegame backup. You can create a backup with "export save". Paste in here and press "import".<br/><font color="red">Warning: this overwrites your current game!</font>';
    var area = util.makeAbsElement('textarea', '1%', '15%', '98%', '70%', dialog.div);
    area.select();
    area.focus();
  };

  button = makeSettingsButton();
  button.textEl.innerText = 'hard reset';
  registerTooltip(button, hardresetwarning);
  button.onclick = function(e) {
    var w = 500, h = 500;
    var dialog = createDialog(false, function(e) {
      dialog.cancelFun();
      hardReset();
      closeAllDialogs();
    }, 'reset');
    var warningFlex = new Flex(dialog, 0.01, 0.01, 0.99, 0.1, 0.4);
    warningFlex.div.innerText = hardresetwarning;
    warningFlex.div.style.color = 'red';
  };

  pos += gap;

  button = makeSettingsButton();
  button.textEl.innerText = 'preferences';
  registerTooltip(button, 'Various UI, saving, gameplay and other settings.');
  button.onclick = function(e) {
    createAdvancedSettingsDialog();
  };

  button = makeSettingsButton();
  button.textEl.innerText = 'number format';
  registerTooltip(button, 'Change the precision and display type for large numbers.');
  button.onclick = function(e) {
    createNumberFormatDialog();
  };

  pos += gap;

  button = makeSettingsButton();
  button.textEl.innerText = 'player stats';
  button.onclick = function(e) {
    createStatsDialog();
  };

  pos += gap;

  button = makeSettingsButton();
  button.textEl.innerText = 'help';
  button.onclick = function(e) {
    createHelpDialog();
  };

  button = makeSettingsButton();
  button.textEl.innerText = 'about & changelog';
  button.onclick = function(e) {
    createChangelogDialog();
  };
}

function initSettingsUI() {
  var gearbutton = new Flex(topFlex, [0,0.1], [0,0.1], [0,0.9], [0,0.9]).div;
  gearbutton.style.cursor = 'pointer';
  gearbutton.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
  gearbutton.title = 'Settings';

  // gear image
  gearbutton.style.background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABwUlEQVR4Ac3Xs7tfQRDG8Y2ddLHtPvb/ESdlbLsNythsYtu27VSx8eZbz3P3nLn4ofhs/a7mmQnTp08viik4hft4iNOYiwD4FTXAGci4ls0ATyDjXUkGqIItGI8A6xtk/EU5BGMIdqCGN0BdXIYgLEN5BATUgiKaIiCgLJZAEG6gYVqAKrgMGSfQA+vwDYr4jk3oiYOQcRM1kgJshjJsV1KAgVCGjbYBrMVQhqzyPMKyOAA5/MFvyOEkKni/YWco4jPmoC1KoxRaYQY+QhH93HUAqyELj9ASIaIJ7kAWtnkD1McXyPiCVggpmuADZPxEU5SyAabgAl7iFxSxAMFpGhTxG69wEXMDy1HIoSOCU3PI4WKI3ZnxD+UQnErhO5TieWC57QxQPgMBnuXFFUzDJbzC70w/QvzBa1zBvIKOrkHkG351fsOm+Bj5hs1QGkUuRA8zU4iKXopLZaIUl8V+yOE3fkEOJ1DeE2ARlCEr0wIMgDJsZFKATVCG7UxrSi8lNKVrHU3pxpSmtLoNYNUxnfFy08nUhiKaJ7TlN9EQ7sFkG0aVwGAy3D+Y+D3O6GjmcDrXw+k0nMYDPMIZzEMA/P4DcB3trAqvUhUAAAAASUVORK5CYII=)';
  gearbutton.style.backgroundSize = 'cover';
  gearbutton.classList.add('pixelated');

  addEvent(gearbutton, 'onmouseover', function() { gearbutton.style.filter = 'brightness(0.4)'; });
  addEvent(gearbutton, 'onmouseout', function() { gearbutton.style.filter = ''; });

  gearbutton.onclick = function() {
    var dialogFlex = createDialog();
    initSettingsUI_in(dialogFlex);
  }

  // changelog / about button
  var aboutbutton = new Flex(topFlex, [1,-0.9], [0,0.1], [1,-0.1], [0,0.9]).div;
  aboutbutton.style.cursor = 'pointer';
  aboutbutton.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
  aboutbutton.title = 'About';

  aboutbutton.classList.add('pixelated');
  aboutbutton.classList.add('changelogbutton');

  aboutbutton.onclick = function() {
    createChangelogDialog();
  }

  var undobutton = new Flex(topFlex, [0,1.6], [0,0.15], [0,3.3], [0,0.85], 2);
  styleButton(undobutton.div);
  undobutton.div.textEl.innerText = 'Undo';
  undobutton.div.onclick = function(e) {
    if(e.shiftKey) {
      showMessage('held shift key while pressing undo button, so saving undo instad.');
      storeUndo(state);
    } else {
      loadUndo();
      update();
    }
    removeAllTooltips();
  };
  registerTooltip(undobutton.div,
      'Undo your last action(s). Press again to redo.<br><br>' +
      'Undo is saved when doing an action, but with at least a minute<br>in-between, so multiple actions in quick succession may all be undone.<br><br>' +
      'No matter how long ago the undo was saved, you still get<br>the correct produced resources now for that timespan.' +
      '');
}
