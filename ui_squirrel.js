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

function renderStage(scrollflex, stage, y) {
  var u3 = [stage.upgrades0, stage.upgrades1, stage.upgrades2];

  var connectorwidth = 0.01;

  var y0 = y;

  for(var j = 0; j < u3.length; j++) {
    var us = u3[j];
    var y2 = y0;
    var h = 0.1;
    var h2 = 0.15;

    for(var i = 0; i < us.length; i++) {
      var u = upgrades3[us[i]];

      var flex = new Flex(scrollflex, (j + 0.05) * 0.33, y2, (j + 0.95) * 0.33, y2 + h);
      centerText2(flex.div);
      //flex.div.style.border = '1px solid #f00';
      flex.div.className = 'efUpgradeChip';
      flex.div.textEl.innerText = u.name;


      if(i > 0 || j == 1) {
        //var connector = new Flex(scrollflex, [0.1 + (j + 0.5) * 0.25, -0.05], y2 + h, [0.05 + (j + 0.5) * 0.25, 0.05], y2 + h2);
        var connector = new Flex(scrollflex, (j + 0.5) * 0.33 - connectorwidth, y2 + h - h2, (j + 0.5) * 0.33 + connectorwidth, y2);
        connector.div.className = 'efConnector';
      }
      if(j == 1 && i == 0 && u3[0].length) {
        var connector = new Flex(scrollflex, (j - 1 + 0.5) * 0.33, [y2 + (h - h2) * 0.5, -connectorwidth], (j + 0.5) * 0.33, [y2 + (h - h2) * 0.5, connectorwidth]);
        connector.div.className = 'efConnector';
        connector = connector = new Flex(scrollflex, (j - 1 + 0.5) * 0.33 - connectorwidth, [y2 - (h2 - h) * 0.5, -connectorwidth], (j - 1 + 0.5) * 0.33 + connectorwidth, y2);
        connector.div.className = 'efConnector';
      }
      if(j == 1 && i == 0 && u3[2].length) {
        var connector = new Flex(scrollflex, (j + 0.5) * 0.33, [y2 + (h - h2) * 0.5, -connectorwidth], (j + 1 + 0.5) * 0.33, [y2 + (h - h2) * 0.5, connectorwidth]);
        connector.div.className = 'efConnector';
        connector = connector = new Flex(scrollflex, (j + 1 + 0.5) * 0.33 - connectorwidth, [y2 - (h2 - h) * 0.5, -connectorwidth], (j + 1 + 0.5) * 0.33 + connectorwidth, y2);
        connector.div.className = 'efConnector';
      }

      y2 += h2;
    }

    y = Math.max(y, y2);
  }

  return y;
}

function makeSquirrelDialog() {
  var dialog = createDialog();
  makeScrollable(dialog.content);

  var y = 0.1;

  for(var i = 0; i < stages3.length; i++) {
    y = renderStage(dialog.content, stages3[i], y);
  }

}

// for testing
//window.setTimeout(function() { makeSquirrelDialog(); }, 50);
