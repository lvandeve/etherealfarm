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

var squirrel_dialog = undefined;

// s2 = stage state, i = depth of upgrade in this stage
function renderUpgrade3Chip(flex, stage, s2, u, b, i) {
  var avail = stage.index == 0 || state.stages3[stage.index - 1].num[1] == stages3[stage.index - 1].upgrades1.length;

  var avail2 = stage.index > 0 && state.stages3[stage.index - 1].num[1] >= stages3[stage.index - 1].upgrades1.length - 1;
  // whether the last chip of the previous stage is in state "can buy"
  var prev_canbuy = false;
  if(stage.index > 0) {
    var p = stages3[stage.index - 1];
    var p2 = state.stages3[stage.index - 1];
    if(p2.num[1] + 1 == p.upgrades1.length && p2.num[1] > 0) prev_canbuy = true;
    if(stage.index > 1 && !prev_canbuy && p.upgrades1.length == 1) {
      var pp = stages3[stage.index - 2];
      var pp2 = state.stages3[stage.index - 2];
      if(pp2.num[1] == pp.upgrades1.length) prev_canbuy = true;
    }
  }


  //flex.div.style.border = '1px solid #f00';
  //flex.div.className = 'efUpgradeChip';

  var infoText = 'Squirrel upgrade: ' + u.name;
  infoText += '<br><br>';
  infoText += 'Next costs: ' + getNextUpgrade3Cost().toString() + ' nuts';
  infoText += '<br>';
  infoText += 'Nuts available: ' + state.res.nuts.toString();
  infoText += '<br>';
  infoText += 'Grow nut crops in the main field to get more nuts.';
  infoText += '<br><br>';
  infoText += u.description;

  var textFlex = new Flex(flex, [0, 0, 0.9], 0, 1, 0.97, 1);
  centerText2(textFlex.div);
  //textFlex.div.style.border = '1px solid red';

  var text = u.name;

  var bought = (avail && i < s2.num[b]);
  var canbuy = (avail && i == s2.num[b]);
  var next = (avail && i == s2.num[b] + 1) || (prev_canbuy && i == 0); // one that's 1 spot after canbuy
  var unknown = !bought && !canbuy && !next;

  var text = unknown ? '???' : u.name;

  if(bought) flex.div.className = 'efSquirrelBought';
  else if(canbuy) flex.div.className = 'efSquirrelBuy';
  else if(next) flex.div.className = 'efSquirrelNext';
  else flex.div.className = 'efSquirrelUnknown';

  var canvasFlex = new Flex(flex, [0, 0, 0.05], [0, 0, 0.15], [0, 0, 0.8], [0, 0, 0.9]);
  canvasFlex.clear();
  canvasFlex.div.style.backgroundColor = '#ccc';
  canvasFlex.div.style.border = '1px solid black';
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(u.image, canvas);
  styleButton0(canvasFlex.div);

  if(canbuy) {
    //var buyFlex = new Flex(flex, [0, 0, 0.9], 0.5, 0.95, 0.97);
    styleButton0(textFlex.div);
    //buyFlex.div.textEl.innerText = 'buy';
    text += '<div class="efButton" style="width:20%; left:40%; position:absolute;">buy</div>';

    addButtonAction(textFlex.div, bind(function(i, b) {
      addAction({type:ACTION_UPGRADE3, s:stage.index, b:b, d:i});
      update();

      //flex.clear();
      //renderUpgrade3Chip(flex, stage, s2, u, b, i);

      if(squirrel_dialog) {
        var scrollPos = 0;
        scrollPos = squirrel_dialog.content.elements[1].div.scrollTop;
        squirrel_dialog.content.clear();
        renderSquirrelDialog(squirrel_dialog);
        squirrel_dialog.content.elements[1].div.scrollTop = scrollPos;
      }
    }, i, b));

  }


  addButtonAction(canvasFlex.div, bind(function(i, b) {
    var dialog = createDialog(DIALOG_SMALL);
    dialog.content.div.innerHTML = infoText;
  }, i, b));

  //if(!bought) text += '<br>' + 'Buy';

  textFlex.div.textEl.innerHTML = text;
  registerTooltip(flex.div, infoText);
}

function renderStage(dialog, scrollflex, stage, y) {
  var s2 = state.stages3[stage.index];
  var u3 = [stage.upgrades0, stage.upgrades1, stage.upgrades2];

  var connectorwidth = 0.01;

  var y0 = y;

  for(var b = 0; b < u3.length; b++) {
    var us = u3[b];
    var y2 = y0;
    var h = 0.12;
    var h2 = 0.17;

    for(var i = 0; i < us.length; i++) {
      var u = upgrades3[us[i]];

      var flex = new Flex(scrollflex, (b + 0.05) * 0.33, y2, (b + 0.95) * 0.33, y2 + h);
      renderUpgrade3Chip(flex, stage, s2, u, b, i);

      if(i > 0 || b == 1) {
        //var connector = new Flex(scrollflex, [0.1 + (b + 0.5) * 0.25, -0.05], y2 + h, [0.05 + (b + 0.5) * 0.25, 0.05], y2 + h2);
        var connector = new Flex(scrollflex, (b + 0.5) * 0.33 - connectorwidth, y2 + h - h2, (b + 0.5) * 0.33 + connectorwidth, y2);
        connector.div.className = 'efConnector';
      }
      if(b == 1 && i == 0 && u3[0].length) {
        var connector = new Flex(scrollflex, (b - 1 + 0.5) * 0.33, [y2 + (h - h2) * 0.5, -connectorwidth], (b + 0.5) * 0.33, [y2 + (h - h2) * 0.5, connectorwidth]);
        connector.div.className = 'efConnector';
        connector = connector = new Flex(scrollflex, (b - 1 + 0.5) * 0.33 - connectorwidth, [y2 - (h2 - h) * 0.5, -connectorwidth], (b - 1 + 0.5) * 0.33 + connectorwidth, y2);
        connector.div.className = 'efConnector';
      }
      if(b == 1 && i == 0 && u3[2].length) {
        var connector = new Flex(scrollflex, (b + 0.5) * 0.33, [y2 + (h - h2) * 0.5, -connectorwidth], (b + 1 + 0.5) * 0.33, [y2 + (h - h2) * 0.5, connectorwidth]);
        connector.div.className = 'efConnector';
        connector = connector = new Flex(scrollflex, (b + 1 + 0.5) * 0.33 - connectorwidth, [y2 - (h2 - h) * 0.5, -connectorwidth], (b + 1 + 0.5) * 0.33 + connectorwidth, y2);
        connector.div.className = 'efConnector';
      }

      y2 += h2;
    }

    y = Math.max(y, y2);
  }

  return y;
}

function renderSquirrelDialog(dialog) {
  var titleFlex = new Flex(dialog.content, 0, 0, 1, 0.1);
  centerText2(titleFlex.div);

  titleFlex.div.textEl.innerText = 'Squirrel Upgrades. Next costs: ' + getNextUpgrade3Cost().toString() + ' nuts. Have: ' + state.res.nuts.toString() + ' nuts';

  var scrollFlex = new Flex(dialog.content, 0, 0.1, 1, 1);

  makeScrollable(scrollFlex);

  var y = 0.1;

  for(var i = 0; i < stages3.length; i++) {
    y = renderStage(dialog, scrollFlex, stages3[i], y);
  }
}

function makeSquirrelDialog() {
  if(!haveSquirrel()) return;

  var dialog = createDialog();
  dialog.onclose = function() { squirrel_dialog = undefined; };

  squirrel_dialog = dialog;

  renderSquirrelDialog(dialog);
}

// for testing
//window.setTimeout(function() { makeSquirrelDialog(); }, 100);
