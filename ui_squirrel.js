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




/*var squirrel_dialog = undefined;
function rerenderSquirrelDialog() {
  if(squirrel_dialog) {
    var scrollPos = 0;
    scrollPos = squirrel_dialog.content.elements[1].div.scrollTop;
    //squirrel_dialog.content.clear();
    //renderSquirrelDialog(squirrel_dialog);
    squirrel_dialog.cancelFun();
    makeSquirrelDialog();
    squirrel_dialog.content.elements[1].div.scrollTop = scrollPos;
  }
}*/

function getUpgrade2InfoText(u) {
  var infoText = 'Squirrel upgrade: ' + u.name;
  infoText += '<br><br>';
  var cost = new Res({nuts:getNextUpgrade3Cost()});
  infoText += 'Next costs: ' + cost.toString() + ' (' + getCostAffordTimer(cost) + ')';
  infoText += '<br>';
  infoText += 'Nuts available: ' + state.res.nuts.toString();
  infoText += '<br>';
  infoText += 'Grow nut crops in the main field to get more nuts.';
  infoText += '<br><br>';
  infoText += u.description;
  return infoText;
}

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


  var infoText = getUpgrade2InfoText(u);

  var textFlex = new Flex(flex, [0, 0, 0.9], 0, 1, 0.97, 1);
  centerText2(textFlex.div);

  var bought = (avail && i < s2.num[b]);
  var canbuy = (avail && i == s2.num[b]);
  var next = (avail && i == s2.num[b] + 1) || (prev_canbuy && i == 0); // one that's 1 spot after canbuy
  var unknown = !bought && !canbuy && !next;

  var text = unknown ? '???' : upper(u.name);

  var buyfun = undefined;
  if(canbuy) {
    buyfun = function() {
      addAction({type:ACTION_UPGRADE3, s:stage.index, b:b, d:i});
      update();
      updateSquirrelUI();
    };
  }

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

  if(canbuy) text += '<br>Buy';
  else if(bought) text += '<br>Bought';

  if(canbuy) {
    styleButton0(textFlex.div);
    addButtonAction(textFlex.div, buyfun);
  }

  addButtonAction(canvasFlex.div, bind(function(i, b) {
    var dialog = createDialog(DIALOG_SMALL, canbuy ? function() {
      buyfun();
      dialog.cancelFun();
    } : undefined, canbuy ? 'Buy' : undefined);
    dialog.content.div.innerHTML = infoText;
  }, i, b));

  //if(!bought) text += '<br>' + 'Buy';

  textFlex.div.textEl.innerHTML = text;
  registerTooltip(flex.div, function() {
    return getUpgrade2InfoText(u);
  }, true);
}

function renderStage(scrollflex, stage, y) {
  var s2 = state.stages3[stage.index];
  var u3 = [stage.upgrades0, stage.upgrades1, stage.upgrades2];

  var connectorwidth = 0.005;

  var y0 = y;

  for(var b = 0; b < u3.length; b++) {
    var us = u3[b];
    var y2 = y0;
    var h = 0.13;
    var h2 = h + 0.05;

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

function updateSquirrelUI() {
  squirrelFlex.clear();
  if(!squirrelUnlocked()) return;

  if(!haveSquirrel()) {
    var titleFlex = new Flex(squirrelFlex, 0, 0, 1, 0.1, 0.4);
    titleFlex.div.innerText = 'You must have squirrel in ethereal field to use the squirrel upgrades tab, place squirrel there first.';
    return;
  }

  var respecname = 'Respec\n(Available: ' + state.respec3tokens + ')';
  var respecfun = function(e) {
    var respecfun2 = function() {
      addAction({type:ACTION_RESPEC3});
      update();
      updateSquirrelUI();
    };
    if(eventHasShiftKey(e)) {
      respecfun2();
    } else {
      var dialog = createDialog(DIALOG_SMALL, function() {
        respecfun2();
        dialog.cancelFun();
      }, 'Respec now');
      dialog.content.div.innerHTML = 'Really respec? This resets and refunds all squirrel upgrades, and consumes 1 respec token';
    }
  };

  var titleFlex = new Flex(squirrelFlex, 0, 0, 1, 0.1, 0.4);
  centerText2(titleFlex.div);
  titleFlex.div.textEl.innerText = 'Squirrel Upgrades. Next costs: ' + getNextUpgrade3Cost().toString() + ' nuts. Have: ' + state.res.nuts.toString() + ' nuts';

  var buttonFlex = new Flex(squirrelFlex, 0, 0.1, 1, 0.2, 0.5);

  var helpButton = new Flex(buttonFlex, 0, 0, 0.25, 1, 0.8);
  addButtonAction(helpButton.div, function() {
    showRegisteredHelpDialog(35, true);
  });
  styleButton(helpButton.div, 1);
  helpButton.div.textEl.innerText = 'Help';

  var respecButton = new Flex(buttonFlex, 0.3, 0, 0.55, 1, 0.8);
  addButtonAction(respecButton.div, respecfun);
  styleButton(respecButton.div, 1);
  respecButton.div.textEl.innerText = 'Respec\n(Available: ' + state.respec3tokens + ')';
  registerTooltip(respecButton.div, 'Resets and refunds all squirrel upgrades, consumes 1 respec token');

  var scrollFlex = new Flex(squirrelFlex, 0, 0.2, 1, 1);

  makeScrollable(scrollFlex);

  var y = 0.15;

  for(var i = 0; i < stages3.length; i++) {
    y = renderStage(scrollFlex, stages3[i], y);
  }
}
