/*
Ethereal Farm
Copyright (C) 2020-2023  Lode Vandevenne

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


function getSquirrelUpgradeInfoText(u, gated, is_gate, unknown) {
  var infoText = 'Squirrel upgrade: ' + (unknown ? '???' : u.name);
  infoText += '<br><br>';
  infoText += unknown ? 'Buy more upgrades to reveal the description of this one' : upper(u.description);
  infoText += '<br><br>';
  if(gated || is_gate) {
    infoText += 'Gated: you must buy all squirrel upgrades that come before this, including side branches above, before this one unlocks.';
    infoText += '<br><br>';
  }
  var cost = new Res({nuts:getNextSquirrelUpgradeCost()});
  infoText += 'Next costs: ' + cost.toString() + ' (' + getCostAffordTimer(cost) + ')';
  infoText += '<br>';
  infoText += 'Nuts available: ' + state.res.nuts.toString() + '. Grow nut crops in the main field to get more nuts.';
  return infoText;
}

// Buys all squirrel upgrades required to reach this one, and this one itself, if affordable
// Required upgrades are: all upgrades in the current branch before this one, all upgrades in the center branch of all previous stages, and all upgrades in all branches of all previous stages above the last gated stage
function buyAllSquirrelUpgradesUpTo(stage, b, d, opt_final_gated) {
  var new_actions = [];
  var stages = squirrel_stages[state.squirrel_evolution];

  var gate = -1;//stage.index;
  for(var i = stage.index; i > 0; i--) {
    if(stages[i].gated) {
      gate = i;
      break;
    }
  }
  for(var si = 0; si < stage.index; si++) {
    var gated = si < gate;
    for(var i = 0; i < stages[si].upgrades1.length; i++) {
      if(squirrelUpgradeBuyable(si, 1, i) == 0) continue; // already bought
      new_actions.push({type:ACTION_SQUIRREL_UPGRADE, s:si, b:1, d:i});
    }
    if(gated) {
      for(var i = 0; i < stages[si].upgrades0.length; i++) {
        if(squirrelUpgradeBuyable(si, 0, i) == 0) continue; // already bought
        new_actions.push({type:ACTION_SQUIRREL_UPGRADE, s:si, b:0, d:i});
      }
      for(var i = 0; i < stages[si].upgrades2.length; i++) {
        if(squirrelUpgradeBuyable(si, 2, i) == 0) continue; // already bought
        new_actions.push({type:ACTION_SQUIRREL_UPGRADE, s:si, b:2, d:i});
      }
    }
  }

  // now the current stage
  var upgrades = (b == 0) ? stage.upgrades0 : ((b == 1) ? stage.upgrades1 : stage.upgrades2);
  for(var i = 0; i <= d; i++) {
    new_actions.push({type:ACTION_SQUIRREL_UPGRADE, s:si, b:b, d:i});
  }

  var num = new_actions.length;
  var nuts = Num(0);
  for(var i = 0; i < num; i++) {
    nuts.addInPlace(getSquirrelUpgradeCost(i));
  }
  if(nuts.gt(state.res.nuts)) {
    if(opt_final_gated) {
      // If it's gated, don't show the multi-buy message below, instead add its
      // attempt as a regular action, so that it'll then print the error
      // message saying that it's gated.
      addAction({type:ACTION_SQUIRREL_UPGRADE, s:stage.index, b:b, d:d});
      return;
    }
    showMessage('not enough resources to buy these ' + num + ' squirrel upgrades' +
                ': have: ' + state.res.nuts.toString(Math.max(5, Num.precision)) +
                ', need: ' + nuts.toString(Math.max(5, Num.precision)) +
                ' (' + getCostAffordTimer(Res({nuts:nuts})) + ')',
                C_INVALID, 0, 0);
    return;
  }

  for(var i = 0; i < new_actions.length; i++) {
    addAction(new_actions[i]);
  }
}

// s2 = stage state (can be null if view_only), u = the upgrade for this branch and depth in this stage, b = branch in this stage, d = depth of upgrade in this stage
// view_only: if true, then it's rendered only for viewing, and all upgrade names are revealed, no actions to buy them are shown and it can render old squirrel trees (from older evolutions) too
function renderSquirrelUpgradeChip(flex, stage, s2, u, b, d, view_only) {
  var stages = squirrel_stages[state.squirrel_evolution];
  // whether the last chip of the previous stage is in state "can buy"
  var prev_canbuy = false;
  if(stage.index > 0 && !view_only) {
    var p = stages[stage.index - 1];
    var p2 = state.squirrel_stages[stage.index - 1];
    if(p2.num[1] + 1 == p.upgrades1.length && p2.num[1] > 0) prev_canbuy = true;
    if(stage.index > 1 && !prev_canbuy && p.upgrades1.length == 1) {
      var pp = stages[stage.index - 2];
      var pp2 = state.squirrel_stages[stage.index - 2];
      if(pp2.num[1] == pp.upgrades1.length) prev_canbuy = true;
    }
  }

  var buyable = view_only ? 0 : squirrelUpgradeBuyable(stage.index, b, d);

  var bought = buyable == 0;
  var gated = buyable == 2;
  var canbuy = buyable == 1;
  /*var next = buyable == 3;
  var unknown = buyable >= 4 && s2.seen[b] <= d;
  var known = buyable >= 4 && s2.seen[b] > d; // seen before, so name is revealed instead of '???', but otherwise still rendered with the color of an unknown chip.
  */

  //var next_gated = (stage.index + 1 < stages.length && stages[stage.index + 1].gated) || (stage.index + 2 < stages.length && stages[stage.index + 2].gated) ;
  //var next_gated = (stage.index > 0 && stages[stage.index - 1].gated) || (stage.index > 1 && stages[stage.index - 2].gated) ;
  //var next_gated = (stage.index > 0 && stages[stage.index - 1].gated);
  var next_gated = stage.gated_index > state.highest_gated_index;

  var next = buyable == 3;
  var unknown = buyable >= 3;
  var known = unknown && (s2.seen[b] > d || stage.gated_index2 <= state.highest_gated_index2 || (next && !next_gated));
  if(known) unknown = false;

  var is_gate = stage.gated;

  var infoText = getSquirrelUpgradeInfoText(u, gated, is_gate, unknown);

  var textFlex = new Flex(flex, [0, 0, 0.9], 0, 1, 0.97);
  centerText2(textFlex.div);

  var text = unknown ? '???' : upper(u.name);

  var can_afford = getNextSquirrelUpgradeCost().le(state.res.nuts);

  if(bought) flex.div.className = 'efSquirrelBought';
  else if(canbuy && !can_afford) flex.div.className = 'efSquirrelCantAfford';
  else if(canbuy) flex.div.className = 'efSquirrelBuy';
  //else if(next) flex.div.className = 'efSquirrelNext';
  else if(gated) flex.div.className = 'efSquirrelGated';
  else flex.div.className = 'efSquirrelUnknown';

  //if(is_gate) flex.div.style.borderWidth = '2px';

  var canvasFlex = new Flex(flex, [0, 0, 0.05], [0, 0, 0.15], [0, 0, 0.8], [0, 0, 0.9]);
  canvasFlex.clear();
  canvasFlex.div.style.backgroundColor = '#ccc';
  canvasFlex.div.style.border = '1px solid black';
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  var image = unknown ? medalhidden[0] : u.image;
  renderImage(image, canvas);
  styleButton0(canvasFlex.div);

  //if(gated) text += '<br>Locked: buy all above first';
  if(!view_only) {
    if(gated) text += '<br>(Gated)';
    else if(canbuy) text += '<br>Buy';
    else if(bought) text += '<br>Bought';
  }

  var showbuy = (canbuy || gated) && !bought && !view_only;

  var buyfun = undefined;
  if(showbuy || (state.g_num_squirrel_respec > 0 && !unknown && !bought)) {
    buyfun = function(e) {
      if(state.g_num_squirrel_respec > 0 && !canbuy) {
        buyAllSquirrelUpgradesUpTo(stage, b, d, gated);
      } else {
        addAction({type:ACTION_SQUIRREL_UPGRADE, s:stage.index, b:b, d:d});
      }
      if(squirrel_scrollflex) squirrel_scrollpos = squirrel_scrollflex.div.scrollTop;
      update();
      updateSquirrelUI();
    };
  }


  if(showbuy) {
    styleButton0(textFlex.div);
    addButtonAction(textFlex.div, buyfun);
  } else if(state.g_num_squirrel_respec && !unknown && !!buyfun) {
    // buy all function, but a bit hidden because normally it's done through the icon
    textFlex.div.onclick = function(e) {
      // the buy all function will not activate if you only have enough nuts for 1 upgrade:
      // the use case of buy all is, after respec, that you can quickly populate all older upgrades by clicking on a later one
      // however, if you instead didn't respec, are late in the tree, but accidently click a gray looking upgrade, it can be confusing that it then buys the one upgrade before it
      // so incluclusion, only buy all if you have clearly enough nuts to buy multiple upgrades, such as after respec
      // the shiftkey c heck used to be the only check, was then turned into always working without shift, now re-purposing the shift key as an override for the high cost check
      var high_cost_ok = state.res.nuts.gt(getSquirrelUpgradeCost(state.squirrel_upgrades_count + 2));
      if(high_cost_ok || e.shiftKey) buyfun(e);
    };
  }

  addButtonAction(canvasFlex.div, function() {
    var buyfun2 = undefined;
    var buyname = undefined;
    if(showbuy) {
      buyfun2 = function(e) {
        buyfun(e);
      };
      buyname = 'Buy';
    } else if(state.g_num_squirrel_respec > 0 && !unknown && !bought) {
      buyfun2 = function(e) {
        buyAllSquirrelUpgradesUpTo(stage, b, d);
        if(squirrel_scrollflex) squirrel_scrollpos = squirrel_scrollflex.div.scrollTop;
        update();
        updateSquirrelUI();
      };
      buyname = 'Buy all to here';
    }
    var dialog = createDialog({size:DIALOG_SMALL, functions:buyfun2, names:buyname, title:'Squirrel upgrade', icon:u.image});
    dialog.content.div.innerHTML = infoText;
  });

  //if(!bought) text += '<br>' + 'Buy';

  textFlex.div.textEl.innerHTML = text;
  registerTooltip(flex.div, function() {
    return getSquirrelUpgradeInfoText(u, gated, is_gate, unknown);
  }, true);
}

// view_only: if true, then it's rendered only for viewing, and all upgrade names are revealed, no actions to buy them are shown and it can render old squirrel trees (from older evolutions) too
function renderStage(scrollflex, stage, y, view_only) {
  var s2 = view_only ? null : state.squirrel_stages[stage.index];
  var u3 = [stage.upgrades0, stage.upgrades1, stage.upgrades2];


  var y0 = y;
  var h = view_only ? 0.1 : 0.145;
  var h2 = h + 0.035;
  // some extra height for beginning of stage if there are connectors from center to left/right
  var ht = 0.03;
  var connectorwidth = 0.005;

  var max = Math.max(Math.max(stage.upgrades0.length, stage.upgrades1.length), stage.upgrades2.length);

  if(u3[0].length) {
    var b = 1;
    var connector = new Flex(scrollflex, (b - 1 + 0.5) * 0.33, [y0 + (h - h2) * 0.5 + ht, -connectorwidth], (b + 0.5) * 0.33, [y0 + (h - h2) * 0.5 + ht, connectorwidth]);
    connector.div.className = 'efConnector';
    connector = new Flex(scrollflex, (b - 1 + 0.5) * 0.33 - connectorwidth, [y0 - (h2 - h) * 0.5 + ht, -connectorwidth], (b - 1 + 0.5) * 0.33 + connectorwidth, y0 + ht);
    connector.div.className = 'efConnector';
  }
  if(u3[2].length) {
    var b = 1;
    var connector = new Flex(scrollflex, (b + 0.5) * 0.33, [y0 + (h - h2) * 0.5 + ht, -connectorwidth], (b + 1 + 0.5) * 0.33, [y0 + (h - h2) * 0.5 + ht, connectorwidth]);
    connector.div.className = 'efConnector';
    connector = new Flex(scrollflex, (b + 1 + 0.5) * 0.33 - connectorwidth, [y0 - (h2 - h) * 0.5 + ht, -connectorwidth], (b + 1 + 0.5) * 0.33 + connectorwidth, y0 + ht);
    connector.div.className = 'efConnector';
  }

  for(var b = 0; b < u3.length; b++) {
    var us = u3[b]; // one of the three squirrel upgrades of this row
    var y2 = y0;

    var is_gate = stage.gated;

    for(var i = 0; i < us.length; i++) {
      var u = squirrel_upgrades[us[i]];
      var y2o = y2;
      if(i == 0 && (u3[0].length || u3[2].length)) y2 += ht;

      var flex = new Flex(scrollflex, (b + 0.05) * 0.33, y2, (b + 0.95) * 0.33, y2 + h);
      renderSquirrelUpgradeChip(flex, stage, s2, u, b, i, view_only);

      if(i > 0 || b == 1) {
        //var connector = new Flex(scrollflex, [0.1 + (b + 0.5) * 0.25, -0.05], y2 + h, [0.05 + (b + 0.5) * 0.25, 0.05], y2 + h2);
        var connector = new Flex(scrollflex, (b + 0.5) * 0.33 - connectorwidth, y2o + h - h2, (b + 0.5) * 0.33 + connectorwidth, y2 - (is_gate ? 0.014 : 0));
        connector.div.className = 'efConnector';
        if(is_gate) {
          // down pointing triangle
          var connector = new Flex(scrollflex, (b + 0.5) * 0.33 - connectorwidth, y2 - 0.015, (b + 0.5) * 0.33 + connectorwidth, y2);
          connector.div.className = 'efConnectorTriangle';
        }
      }
      y2 += h2;
    }

    if(b == 1 && stage.upgrades1.length < max) {
      var diff = max - stage.upgrades1.length;
      var connector = new Flex(scrollflex, (b + 0.5) * 0.33 - connectorwidth, y2 + h - h2, (b + 0.5) * 0.33 + connectorwidth, y2 + diff * h2);
      connector.div.className = 'efConnector';
    }

    y = Math.max(y, y2);
  }

  return y;
}


var squirrel_scrollpos = undefined;
var squirrel_scrollflex = undefined;

var squirrel_tab_titleflex = undefined;
var squirrel_tab_els = [];

function updateSquirrelUI(opt_partial) {
  if(!squirrel_tab_titleflex || !squirrel_scrollflex) opt_partial = false;
  if(!opt_partial) {
    squirrel_tab_els = [];
  }

  var stages = squirrel_stages[state.squirrel_evolution];
  if(squirrel_scrollflex) squirrel_scrollpos = squirrel_scrollflex.div.scrollTop;
  if(!opt_partial) {
    squirrelFlex.clear();
    squirrel_scrollflex = undefined;
  }
  if(!squirrelUnlocked()) {
    return;
  }

  var titleFlex = opt_partial ? squirrel_tab_titleflex : new Flex(squirrelFlex, 0, 0, 1, 0.1);
  squirrel_tab_titleflex = titleFlex;

  if(!haveSquirrel()) {
    titleFlex.div.innerText = 'You must have squirrel in ethereal field to use the squirrel upgrades tab, place squirrel there first or replace an existing ethereal crop by a squirrel.';
    return;
  }

  var respecname = 'Respec\n(Available: ' + state.squirrel_respec_tokens + ')';
  var respecfun = function(e) {
    var respecfun2 = function() {
      addAction({type:ACTION_SQUIRREL_RESPEC});
      if(squirrel_scrollflex) squirrel_scrollpos = squirrel_scrollflex.div.scrollTop;
      update();
      updateSquirrelUI();
    };
    if(eventHasShiftKey(e)) {
      respecfun2();
    } else {
      var dialog = createDialog({
        size:DIALOG_SMALL,
        functions:respecfun2,
        names:'Respec now',
        title:'Squirrel respec'
      });
      dialog.content.div.innerHTML = 'Really respec? This resets and refunds all squirrel upgrades, and consumes 1 respec token<br><br>Tip: after respec, you can click on upgrades further below the tree (as long as their name is revealed) to buy all upgrades up to that one at once, so you don\'t have to click all the individual ones.';
    }
  };

  centerText2(titleFlex.div);
  var cost = new Res({nuts:getNextSquirrelUpgradeCost()});
  var text =
     'Upgrades done: ' + state.squirrel_upgrades_count + '. ' +
     'Next costs: ' + cost.toString() + ' (' + getCostAffordTimer(cost) + ')' +
     '<br>' +
     'Have: ' + state.res.nuts.toString() + ' nuts. ';
  if(haveUnusedNutsBonus()) {
    text += 'Unspent nuts production boost: ' + getUnusedNutsBonus().subr(1).toPercentString();
  }
  titleFlex.div.textEl.innerHTML = text;

  if(!opt_partial) {
    var buttonFlex = new Flex(squirrelFlex, 0, 0.1, 1, 0.2);
    var helpButton = new Flex(buttonFlex, 0, 0, 0.24, 0.9);
    addButtonAction(helpButton.div, function() {
      showRegisteredHelpDialog(35, true);
    });
    styleButton(helpButton.div, 1);
    helpButton.div.textEl.innerText = 'Help';

    var respecButton = new Flex(buttonFlex, 0.26, 0, 0.5, 0.9);
    addButtonAction(respecButton.div, respecfun);
    styleButton(respecButton.div, 1);
    respecButton.div.textEl.innerText = 'Respec\n(Available: ' + state.squirrel_respec_tokens + ')';
    registerTooltip(respecButton.div, 'Resets and refunds all squirrel upgrades, consumes 1 respec token');

    if(state.squirrel_evolution) {
      var seePrevButton = new Flex(buttonFlex, 0.52, 0, 0.76, 0.9);
      addButtonAction(seePrevButton.div, showOldSquirrelTreeDialog);
      styleButton(seePrevButton.div, 1);
      seePrevButton.div.textEl.innerText = 'See old tree';
      registerTooltip(seePrevButton.div, 'Shows the old tree from before the squirrel evolution ');
    }
  }

  var scrollFlex = opt_partial ? squirrel_scrollflex : new Flex(squirrelFlex, 0, 0.2, 1, 1);
  squirrel_scrollflex = scrollFlex;

  // TODO: also implement some way to update the statuses/colors of the upgrade chips when the ability to buy an upgrade changes
  if(!opt_partial) {
    makeScrollable(scrollFlex);
    // add the scrollbar from the beginning already, it's gauranteed that it'll be there, and when not
    // adding it from the beginning, it'll appear mid-way while adding all the flexes of the stages,
    // which causes the width to change due to the scrollbar mid-way, causing a vislble shift at that point
    scrollFlex.div.style.overflowY = 'scroll';

    var y = 0.15;

    for(var i = 0; i < stages.length; i++) {
      y = renderStage(scrollFlex, stages[i], y, false);
    }

    // only upgrade is squirrel evolution, scroll to it by default
    if(state.allsquirrelupgradebought2 && !state.allsquirrelupgradebought && (squirrel_scrollpos == undefined || squirrel_scrollpos == 0)) squirrel_scrollpos = scrollFlex.div.scrollHeight;

    if(squirrel_scrollpos) {
      scrollFlex.div.scrollTop = squirrel_scrollpos;
    }
  }
}

function showOldSquirrelTreeDialog() {
  if(!(state.squirrel_evolution > 0)) return;

  var dialog = createDialog({title:'View pre-evolution squirrel tree', scrollable:true});
  var scrollFlex = dialog.content;

  var y = 0;

  var stages = squirrel_stages[0];

  for(var i = 0; i < stages.length; i++) {
    y = renderStage(scrollFlex, stages[i], y, true);
  }
  // update the scrollFlex, without doing this the content will be there but will have a "break-line" at the moment when the scrollbar appeared during rendering
  scrollFlex.update();
}

var squirrel_ui_update_last_nuts = undefined;
var squirrel_ui_update_last_nuts_gain = undefined;
var squirrel_ui_update_last_time = undefined;

// whether squirrel UI needs an update while the tab is open
// a full update of the squirrel UI currently is not performant and disruptive to the user (all UI is deleted and recreated), so for now only used to do update with "opt_partial".
function squirrelUINeedsFastUpdate() {
  if(state.currentTab != tabindex_squirrel) return false;

  var result = false;

  var d = util.getTime() - squirrel_ui_update_last_time;
  if(d > 60) result = true; // also get a precise value regularly, since the below only updates per 10% change

  if(!squirrel_ui_update_last_nuts || !squirrel_ui_update_last_nuts_gain) {
    result = true;
    squirrel_ui_update_last_nuts = state.res.nuts.clone();
    squirrel_ui_update_last_nuts_gain = gain.nuts.clone();
  }

  if(state.res.nuts.gtr(0) && state.res.nuts.gt(squirrel_ui_update_last_nuts.mulr(1.1))) {
    result = true;
    squirrel_ui_update_last_nuts = state.res.nuts.clone();
  }
  if(state.res.nuts.gter(0) && state.res.nuts.lt(squirrel_ui_update_last_nuts)) {
    result = true;
    squirrel_ui_update_last_nuts = state.res.nuts.clone();
  }
  if(gain.nuts.gtr(0) && gain.nuts.gt(squirrel_ui_update_last_nuts_gain.mulr(1.1))) {
    result = true;
    squirrel_ui_update_last_nuts_gain = gain.nuts.clone();
  }
  if(gain.nuts.gter(0) && gain.nuts.lt(squirrel_ui_update_last_nuts_gain)) {
    result = true;
    squirrel_ui_update_last_nuts_gain = gain.nuts.clone();
  }



  if(d < 0.5) result = false;

  if(result) {
    squirrel_ui_update_last_nuts = state.res.nuts.clone();
    squirrel_ui_update_last_time = util.getTime();
  }

  return result;
}

function getSquirrelEvolutionHelp() {
  return `
    This will reset all squirrel upgrades and remove their effects, but unlocks a new squirrel tree with more expensive upgrades, and gives a permanent flat bonus.
    <br><br>
    After doing this, you will initially be weaker than before, but the new upgrade tree will eventually make you much stronger, so doing this is worth it at some point and you can earn your strength back multifold.
    Most upgrades of the old squirrel upgrade tree will come back in the new tree (not necessarily in the same order as before), and some new ones appear too.
    <br><br>
    What you lose:
    <br> • All current squirrel upgrades and their effects (including layout effects such as diagonal brassica)
    <br> • All your nuts will be set to 0
    <br> • Nuts will stay at 0 and cannot be produced until next transcension
    <br><br>
    What you get:
    <br> • Permanent flat production bonus of ` + squirrel_epoch_prod_bonus.toPercentString() + `
    <br> • Permanent ethereal tree neighbor bonus of ` + squirrel_evolution_ethtree_boost.toPercentString() + `
    <br> • New squirrel upgrade tree with more expensive upgrades, a mix of new ones and the old ones returning
    <br> • The first new squirrel upgrade is free and can be chosen immediately
    <br><br>
    WARNING: this is irreversible, you cannot respec to go back. Since you will initially be weaker, if there are any challenges or other runs you want to push soon, you may wish to do those first.
    You can also store a backup of your savegame using export from the main menu first, so that if you feel the reset was not worth it yet, you can still go back to the old savegame.
    <br><br>
    TIP: to get back to original strength over the next days, try to get the first new squirrel upgrades. To get those, push to high level berries and mushrooms, then focus on spore production to afford better nuts crops.
    `;
}
