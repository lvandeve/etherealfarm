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


var pondDivs;
var pondRows;
var pondDialogFlex = undefined;
var abovePondTextFlex = undefined;



var shiftFishFlexY = -1;
var shiftFishFlexX = -1;

function updatePondMouseOver(x, y) {
  shiftFishFlexX = x;
  shiftFishFlexY = y;
  //if(shiftFishFlexShowing) showshiftFishChip(shiftFishFlexId);
}

function updatePondMouseOut(x, y) {
  if(x == shiftFishFlexX && y == shiftFishFlexY) updatePondMouseOver(-1, -1);
}

function updatePondMouseClick(x, y) {
  updatePondMouseOver(x, y);
}

var pondDialogShortcutFun = function(e) {
  var keys = getEventKeys(e);

  var key = keys.key;
  var code = keys.code;
  var shift = keys.shift;
  var ctrl = keys.ctrl;

  if(key == 'u' && !shift && !ctrl) {
    // upgrade fish
    var did_something = false;
    did_something |= makeUpgradeFishAction(shiftFishFlexX, shiftFishFlexY);
    if(did_something) {
      update();
    }
  }

  if(key == 'd' && !shift && !ctrl) {
    if(state.pond[shiftFishFlexY]) {
      var f = state.pond[shiftFishFlexY][shiftFishFlexX];
      if(f) {
        if(f.hasCrop()) {
          // delete fish
          addAction({type:ACTION_DELETE_FISH, x:shiftFishFlexX, y:shiftFishFlexY});
          update();
        }
      }
    }
  }

  if(key == 'd' && shift && !ctrl) {
    // downgrade fish
    var did_something = false;
    did_something |= makeDowngradeFishAction(shiftFishFlexX, shiftFishFlexY);
    if(did_something) {
      update();
    }
  }

  if(key == 'p' && !ctrl) {
    // pick or plant fish
    var did_something = false;
    if(state.pond[shiftFishFlexY]) {
      var f = state.pond[shiftFishFlexY][shiftFishFlexX];
      if(f) {
        if(!shift && f.hasCrop()) {
          // pick
          state.lastPlantedFish = f.getCrop().index;
        } else {
          // plant
          if(state.lastPlantedFish >= 0 && fishes[state.lastPlantedFish]) {
            var actiontype = f.hasCrop() ? ACTION_REPLACE_FISH : ACTION_PLANT_FISH;
            addAction({type:actiontype, x:shiftFishFlexX, y:shiftFishFlexY, fish:fishes[state.lastPlantedFish], shiftPlanted:true});
            did_something = true;
          }
        }
      }
    }
    if(did_something) {
      update();
    }
  }
};

function updatePondDialogText() {
  if(!abovePondTextFlex) return;

  var text = '';

  text += 'Total boost from infinity crops to basic field: ' + state.expected_infinityboost.toPercentString();
  if(state.expected_infinityboost.neq(state.infinityboost)) text += ' (time-weighted: ' + state.infinityboost.toPercentString() + ')';
  text += '. Max ever had: ' + state.g_max_infinityboost.toPercentString();

  if(!haveFishes()) {
    text += '<br><br>';
    text += 'Nothing in this pond yet';
    abovePondTextFlex.div.innerHTML = text;
    return;
  } else {
    var missing_types = getAvailableNonPlantedFishTypes();
    var print_missing_types = state.numfishes > 4 && missing_types.length > 0;
    if(!print_missing_types && state.numemptypond > 0) {
      text += '<br><br>';
      text += 'Click the pond below to place fishes, at the cost of infinity spores.';
    }
    text += '<br><br>';
    text += 'Infinity spores: ' + state.res.infspores.toString();
    var inpond = computePondInfinitySpores();
    text += '. In pond: ' + inpond.toString();
    text += '. Total: ' + inpond.add(state.res.infspores).toString();

    if(print_missing_types) {
      text += '<br><br>';
      text += 'Types avaible but not placed: <b>';
      for(var i = 0; i < missing_types.length; i++) {
        if(i > 0) text += ', ';
        text += getFishTypeName(missing_types[i]);
      }
      text += '</b>';
    }
  }

  abovePondTextFlex.div.innerHTML = text;
}


// opt_cost is output variable that contains the cost and a boolean that tells if it's too expensive
function getUpgradeFish(x, y, opt_cost) {
  if(!state.pond[y]) return null;
  var f = state.pond[y][x];
  if(!f) return null;
  var c = f.getCrop();
  if(!c) return null;

  var tier = state.highestoftypefishunlocked[c.type];

  var recoup = c.getRecoup(f);

  var c2 = null;

  for(;;) {
    if(tier <= c.tier) break; // not an upgrade
    if(tier < 0) break;

    var c3 = fish_tiers[c.type][tier];
    if(!c3 || !state.fishes[c3.index].unlocked) break; // normally cannot happen that a lower tier crop is not unlocked

    var cost = c3.getCost().sub(recoup);
    if(opt_cost != undefined) {
      opt_cost[0] = cost;
      c2 = c3;
    }

    if(cost.le(state.res)) {
      // found a successful upgrade
      if(opt_cost != undefined) opt_cost[1] = false;
      break;
    } else {
      if(opt_cost != undefined) opt_cost[1] = true;
    }

    tier--;
  }

  return c2;
}

function getDowngradeFish(x, y, opt_cost) {
  if(!state.pond[y]) return null;
  var f = state.pond[y][x];
  if(!f) return null;
  var c = f.getCrop();
  if(!c) return null;

  var tier = c.tier - 1;

  var recoup = c.getRecoup();

  var c2 = null;

  if(tier < -1) return null;

  var c3 = fish_tiers[c.type][tier];
  if(!c3 || !state.fishes[c3.index].unlocked) return null;

  var cost = c3.getCost().sub(recoup);
  if(opt_cost != undefined) {
    opt_cost[0] = cost;
    c2 = c3;
  }

  // a downgrade may be more expensive if you have way more of that crop so it scaled up a lot
  if(cost.le(state.res)) {
    if(opt_cost != undefined) opt_cost[1] = false;
  } else {
    if(opt_cost != undefined) opt_cost[1] = true;
  }

  return c2;
}

function makeUpgradeFishAction(x, y, opt_silent) {
  var too_expensive = [undefined];
  var c3 = getUpgradeFish(x, y, too_expensive);

  if(c3 && !too_expensive[1]) {
    addAction({type:ACTION_REPLACE_FISH, x:x, y:y, fish:c3, shiftPlanted:true});
    return true;
  } else {
    if(!opt_silent) {
      if(too_expensive[1]) {
        showMessage('not enough resources for next infinity crop tier: have ' + Res.getMatchingResourcesOnly(too_expensive[0], state.res).toString() +
            ', need ' + too_expensive[0].toString() + ' (' + getCostAffordTimer(too_expensive[0]) + ')', C_INVALID, 0, 0);
      } else if(!(x >= 0 && x < state.pondw && y >= 0 && y < state.pondh) || state.pond[y][x].index < CROPINDEX) {
        showMessage('No fish to upgrade tier here. Move mouse cursor over a crop and press u to upgrade it to the next tier', C_INVALID);
      } else {
        showMessage('Fish not replaced, no higher tier unlocked or available', C_INVALID);
      }
    }
  }
  return true;
}

function makeDowngradeFishAction(x, y, opt_silent) {
  var too_expensive = [undefined];
  var c2 = getDowngradeFish(x, y, too_expensive);

  if(c2 && !too_expensive[1]) {
    addAction({type:ACTION_REPLACE_FISH, x:x, y:y, fish:c2, shiftPlanted:true});
  } else if(c2 && too_expensive[1]) {
    // TODO: instead go to an even lower tier?
    showMessage('not enough resources for lower fish tier: have ' + Res.getMatchingResourcesOnly(too_expensive[0], state.res).toString() + ', need ' + too_expensive[0].toString() + '. This can happen if you have a lot of the lower tier fish planted.', C_INVALID, 0, 0);
  } else if(!c2) {
    showMessage('Fish not replaced, no lower tier available', C_INVALID);
  }
  return true;
}


// makes the main dialog for the pond
function makePond3Dialog() {
  var helpfun = haveFishes() ? function() {
    showRegisteredHelpDialog(43, true);
  } : undefined;

  var dialog = createDialog({
    scrollable:true,
    title:'Infinity pond',
    bgstyle:'efDialogTranslucent',
    icon:image_pond,
    closeFun:function() {
      pondDialogFlex = undefined;
      abovePondTextFlex = undefined;
    },
    shortcutfun:(haveFishes() ? pondDialogShortcutFun : undefined),
    help:helpfun
  });

  var textFlex = new Flex(dialog.content, 0, 0, 1, 0.2);
  abovePondTextFlex = textFlex;

  updatePondDialogText();

  if(!haveFishes()) return;

  var fieldFlex = new Flex(dialog.content, 0, 0.25, 1, 1);

  //fieldFlex.div.style.border = '1px solid red';


  var pondw = 3;
  var pondh = 3;
  var ratio = pondw / pondh;
  var fieldGrid = new Flex(fieldFlex, [0.5,0,-0.5,ratio], [0.5,0,-0.5,1/ratio], [0.5,0,0.5,ratio], [0.5,0,0.5,1/ratio]);
  //fieldGrid.div.style.border = '1px solid green';

  pondDialogFlex = fieldGrid;
  initPondUI(fieldGrid);
  renderPond();
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// get fish info in HTML
function getFishInfoHTML(f, c, opt_detailed) {
  var result = upper(c.name);

  var upgrade_cost = [undefined];
  var upgrade_fish = getUpgradeFish(f.x, f.y, upgrade_cost, true);

  if(c.effect_description) result += '<br>' + c.effect_description;


  var total = getFishMultiplier(c.type, state, 0);
  if(total.neqr(1)) {
    var current = getFishMultiplier(c.type, state, 2);
    var typename = getFishTypeName(c.type);
    result += '<br>';
    result += '<br>Total bonus for all ' + typename + ': ' + total.subr(1).toPercentString();
    if(total.neq(current)) result += '<br>Current (time weighted due to recently placing fishes): ' + current.subr(1).toPercentString();
  }

  result += '<br>';
  result += '<br/>• Base cost: ' + c.cost.toString();
  result += '<br/>• Next placing cost (p): ' + c.getCost().toString() + ' (' + getCostAffordTimer(c.getCost()) + ')';
  result += '<br/>• Recoup on delete (d): ' + c.getRecoup().toString();
  if(upgrade_fish && upgrade_cost[0]) {
    var tier_diff = upgrade_fish.tier - c.tier;
    var tier_diff_text = tier_diff > 1 ? (' (+' + tier_diff + ')' ) : '';
    result += '<br/> • Upgrade tier' + tier_diff_text + ' cost: ' + upgrade_cost[0].toString() + ' (' + getCostAffordTimer(upgrade_cost[0]) + ')';
  }

  return result;
}


function getFishInfoHTMLBreakdown(f, c) {
  var result = '';

  return result;
}

function makePondDialog(x, y, opt_override_mistletoe) {
  var f = state.pond[y][x];
  var fd = pondDivs[y][x];

  if(f.hasCrop()) {
    var c = fishes[f.cropIndex()];
    var div;

    var updatedialogfun = bind(function(f, c, flex) {
      var html0 = getFishInfoHTML(f, c, false);
      if(html0 != last0) {
        flex0.div.innerHTML = html0;
        last0 = html0;
      }
    }, f, c);

    var dialog = createDialog({
      icon:c.image,
      title:'Fish info',
      bgstyle:'efDialogTranslucent',
      updatedialogfun:updatedialogfun
    });

    var buttonshift = 0;

    var flex0 = new Flex(dialog.content, 0, [0, 0, 0.01], 1, 0.17);
    var button0 = new Flex(dialog.content, [0, 0, 0.2], [0.63 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.695 + buttonshift).div;
    var button1 = new Flex(dialog.content, [0, 0, 0.2], [0.7 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.765 + buttonshift).div;
    var button2 = new Flex(dialog.content, [0, 0, 0.2], [0.77 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.835 + buttonshift).div;
    var button3 = new Flex(dialog.content, [0, 0, 0.2], [0.84 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.905 + buttonshift).div;
    //var button4 = new Flex(dialog.content, [0, 0, 0.2], [0.91 + buttonshift, 0, 0.01], [1, 0, -0.2], 0.975 + buttonshift).div;
    var last0 = undefined;
    var button;

    button = button0;
    styleButton(button);
    button.textEl.innerText = 'Upgrade tier';
    registerTooltip(button, 'Replace fish with the highest tier of this type you can afford. This deletes the original fish (which gives refund), and then places the new higher tier fish.');
    addButtonAction(button, function() {
      if(makeUpgradeFishAction(x, y)) {
        closeDialogsUpTo(1); // keep pond dialog itself open
        update();
      }
    });

    button = button1;
    styleButton(button);
    button.textEl.innerText = 'Downgrade tier';
    registerTooltip(button, 'Replace fish with the tier one below, refunding the cost of the current one, then placing the lower tier fish with the lower resource cost.');
    addButtonAction(button, function() {
      if(makeDowngradeFishAction(x, y)) {
        closeDialogsUpTo(1); // keep pond dialog itself open
        update();
      }
    });

    button = button2;
    styleButton(button);
    button.textEl.innerText = 'Replace fish';
    registerTooltip(button, 'Replace the fish with another one you choose, same as delete then place. Shows the list of unlocked fishes.');
    addButtonAction(button, function() {
      makePlantFishDialog(x, y, true, c.getRecoup());
    });

    button = button3;
    styleButton(button);
    button.textEl.innerText = 'Delete fish';
    button.textEl.style.color = '#c00';
    registerTooltip(button, 'Delete fish, get ' + (FISHRECOUP * 100) + '% of the original cost back.');
    addButtonAction(button, function() {
      addAction({type:ACTION_DELETE_FISH, x:x, y:y});
      closeDialogsUpTo(1); // keep pond dialog itself open
      update(); // do update immediately rather than wait for tick, for faster feeling response time
    });

    /*styleButton(button2);
    button2.textEl.innerText = 'Detailed stats / bonuses';
    registerTooltip(button2, 'Show breakdown of multipliers and bonuses and other detailed stats.');
    addButtonAction(button2, function() {
      var dialog = createDialog({
        size:DIALOG_LARGE,
        title:'Detailed fish stats',
        scrollable:true,
        icon:c.image,
        bgstyle:'efDialogTranslucent'
      });
      var flex = dialog.content;
      var text = '';

      text += getFishInfoHTML(f, c, true);
      text += '<br/>';
      text += getFishInfoHTMLBreakdown(f, c);
      dialog.content.div.innerHTML = text;
    });*/

    updatedialogfun();
  } else {
    makePlantFishDialog(x, y);
  }
}

function initPondUI(flex) {
  flex.clear();
  pondRows = [];
  pondDivs = [];
  for(var y = 0; y < state.pondh; y++) {
    pondDivs[y] = [];
    for(var x = 0; x < state.pondw; x++) {
      pondDivs[y][x] = new CellDiv();
    }
  }

  //This is set up such that the field tiles are square on screen, field is rectangle (or square if pondw == pondh), and always takes max size in the rectangular div in which the field is placed
  var ratio = state.pondw / state.pondh;
  var pondGrid = new Flex(flex, [0.5,0,-0.5,ratio], [0.5,0,-0.5,1/ratio], [0.5,0,0.5,ratio], [0.5,0,0.5,1/ratio]);

  var pondDiv = flex.div;
  var w = pondDiv.clientWidth;
  var h = pondDiv.clientHeight;

  setAriaRole(pondGrid.div, 'grid'); // intended for 2D navigation, combined with the row and cell roles given to the elements below
  setAriaLabel(pondGrid.div, 'pond');

  var tw = Math.floor(w / state.pondw) - 1;
  var th = Math.floor(h / state.pondh) - 1;
  tw = th = Math.min(tw, th);
  var x0 = 2 + Math.floor((pondDiv.clientWidth - tw * state.pondw) / 2);
  var y0 = 2;

  for(var y = 0; y < state.pondh; y++) {
    var row = makeDiv('0', (y / state.pondh * 100) + '%', '100%', (101 / state.pondh) + '%', pondGrid.div);
    setAriaRole(row, 'row');
    pondRows[y] = row;
    for(var x = 0; x < state.pondw; x++) {
      var f = state.pond[y][x];
      var celldiv = makeDiv((x / state.pondw * 100) + '%', '0', (101 / state.pondw) + '%', '100%', row);
      var canvas = createCanvas('0%', '0%', '100%', '100%', celldiv); // canvas for the plant itself
      var div = makeDiv('0', '0', '100%', '100%', celldiv);
      setAriaRole(celldiv, 'cell');
      div.className = 'efNoOutline';
      div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
      centerText(div);

      pondDivs[y][x].div = div;
      pondDivs[y][x].canvas = canvas;

      util.setEvent(div, 'mouseover', bind(function(x, y) {
        updatePondMouseOver(x, y);
      }, x, y), 'fieldover');
      util.setEvent(div, 'mouseout', bind(function(x, y) {
        updatePondMouseOut(x, y);
      }, x, y), 'fieldout');
      // on mouse up and with timeout so that the state is fully updated after the action that the click caused
      util.setEvent(div, 'mouseup', bind(function(x, y) {
        window.setTimeout(function(){updatePondMouseClick(x, y)});
      }, x, y), 'fieldclick');

      registerTooltip(div, bind(function(x, y, div) {
        var f = state.pond[y][x];
        var fd = pondDivs[y][x];
        var c = f.getCrop();
        if(!c) return undefined;
        return getFishInfoHTML(f, c, false);
      }, x, y, div), true);

      addButtonAction(div, bind(function(x, y, div, e) {
        var f = state.pond[y][x];
        if(f.index == 0) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);

          if(shift && ctrl) {
            // experimental feature for now [same as in basic field], most convenient behavior needs to be found
            // current behavior: plant crop of same type as lastPlanted, but of highest tier that's unlocked and you can afford. Useful in combination with ctrl+shift picking when highest unlocked one is still too expensive and you wait for automaton to upgrade the plant
            if(state.lastPlantedFish >= 0 && fishes[state.lastPlantedFish]) {
              var c = fishes[state.lastPlantedFish];
              var tier = state.highestoftypefishunlocked[c.type];
              var c3 = fish_tiers[c.type][tier];
              if(!c3 || !state.fishes[c3.index].unlocked) c3 = c;
              if(c3.getCost().gt(state.res) && tier > 0) {
                tier--;
                var c4 = fish_tiers[c.type][tier];
                if(c4 && state.fishes[c4.index].unlocked) c3 = c4;
              }
              if(c3.getCost().gt(state.res) && tier > 0) {
                tier--;
                var c4 = fish_tiers[c.type][tier];
                if(c4 && state.fishes[c4.index].unlocked) c3 = c4;
              }
              addAction({type:ACTION_PLANT_FISH, x:x, y:y, fish:c3, shiftPlanted:true});
              update();
            }
          } else if(shift && !ctrl) {
            if(state.lastPlantedFish >= 0 && fishes[state.lastPlantedFish]) {
              var c = fishes[state.lastPlantedFish];
              addAction({type:ACTION_PLANT_FISH, x:x, y:y, fish:c, shiftPlanted:true});
              update();
            } else {
              showMessage(shiftClickPlantUnset, C_INVALID, 0, 0);
            }
          } else if(ctrl && !shift) {
            addAction({type:ACTION_PLANT_FISH, x:x, y:y, fish:fishes[getHighestAffordableBrassica3()], shiftPlanted:true});
            update();
          } else {
            makePondDialog(x, y);
          }
        } else if(f.hasCrop()) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(ctrl && shift) {
            // experimental feature [same as in basic field] for now, most convenient behavior needs to be found
            // behavior implemented here: if safe, "pick" clicked crop type, but then the best unlocked one of its tier. If unsafe permitted, immediately upgrade to highest type, and still pick highest tier too whether or not it changed
            // other possible behaviors: pick crop type (as is), open the crop replace dialog, ...
            var c2 = f.getCrop();
            var c3 = fish_tiers[c2.type][state.highestoftypefishunlocked[c2.type]];
            if(!c3 || !state.fishes[c3.index].unlocked) c3 = c2;
            state.lastPlantedFish = c3.index;
            if(c3.getCost().gt(state.res)) state.lastPlantedFish = c2.index;
            if(c3.tier > c2.tier) {
              addAction({type:ACTION_REPLACE_FISH, x:x, y:y, fish:c3, shiftPlanted:true});
              update();
            }
          } else if(ctrl && !shift) {
            addAction({type:ACTION_DELETE_FISH, x:x, y:y});
            update();
          } else if(shift && !ctrl) {
            if(state.lastPlantedFish >= 0 && fishes[state.lastPlantedFish]) {
              var c = fishes[state.lastPlantedFish];
              var c2 = f.getCrop();
              if(c2.index == state.lastPlantedFish) {
                addAction({type:ACTION_DELETE_FISH, x:x, y:y});
              } else {
                addAction({type:ACTION_REPLACE_FISH, x:x, y:y, fish:c, shiftPlanted:true});
              }
              update();
            }
          } else {
            makePondDialog(x, y);
          }
        } else {
          makePondDialog(x, y);
        }
      }, x, y, div));
    }
  }
}

function updatePondCellUI(x, y) {
  var f = state.pond[y][x];
  var fd = pondDivs[y][x];
  var c = fishes[f.cropIndex()];

  var largeravailable = c && c.tier >= 0 && state.highestoftypefishunlocked[c.type] > state.highestoftypefishplanted[c.type] && state.res.infspores.gt(fishes[state.highestfishoftypeunlocked[c.type]].cost.infspores);

  if(fd.index != f.index || fd.largeravailable != largeravailable) {
    fd.index = f.index;
    fd.largeravailable = largeravailable;

    var r = util.pseudoRandom2D(x, y, 55555);
    var field_image = r < 0.25 ? images_pond[0] : (r < 0.5 ? images_pond[1] : (r < 0.75 ? images_pond[2] : images_pond[3]));
    if(x == (state.pondw >> 1) && y == (state.pondh >> 1)) field_image = images_pond[4];
    renderImage(field_image, fd.canvas);

    var label = 'pond tile ' + x + ', ' + y;

    if(f.hasCrop()) {
      var c = fishes[f.cropIndex()];
      blendImage(c.image, fd.canvas);
      label = c.name + '. ' + label;
      if(largeravailable) blendImage(image_field_larger_available_arrow, fd.canvas);
    } else {
      fd.div.innerText = '';
      //unrenderImage(fd.canvas);
    }

    if(f.index == 0) {
      label = 'empty ' + label;
    }

    setAriaLabel(fd.div, label);
  }
}

function renderPond() {
  if(!pondDialogFlex) return;
  for(var y = 0; y < state.pondh; y++) {
    for(var x = 0; x < state.pondw; x++) {
      updatePondCellUI(x, y);
    }
  }

  updatePondDialogText();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function makeFishChip(fish, x, y, w, parent, opt_plantfun, opt_showfun, opt_tooltipfun, opt_replace, opt_recoup, opt_field) {
  var flex = new Flex(parent, x * w + 0.01, [0, 0, y * w + 0.010, 0.5], (x + 1) * w - 0.01, [0, 0, (y + 1) * w - 0.01, 0.5]);
  var div = flex.div;
  div.className = 'efEtherealPlantChip';

  var canvasFlex = new Flex(flex, 0, [0.5, 0, -0.35], [0, 0, 0.7], [0.5, 0, 0.35]);
  var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
  renderImage(fish.image, canvas);

  var infoFlex = new Flex(flex, [0, 0, 0.7], 0, 1, [0, 0, 1]);
  var text = '';
  if(opt_replace) {
    text +=  '<b>' + upper(fish.name) + '</b><br>';
  } else {
    text +=  '<b>Place ' + fish.name + '</b><br>';
  }
  var cost = fish.getCost();
  if(opt_recoup) cost = cost.sub(opt_recoup);
  // if it's the same fish, then getRecoup is not computed correctly, the cost is 0 if changing self
  if(opt_replace && opt_field && opt_field.cropIndex() == fish.index) cost = Res();
  text += 'type: ' + getFishTypeName(fish.type) + '<br>';
  text += 'cost: ' + cost.toString();

  var buyFlex = undefined;

  if(opt_showfun) {
    styleButton0(canvasFlex.div, true);
    addButtonAction(canvasFlex.div, opt_showfun, upper(fish.name) + ' info');
  }
  if(opt_plantfun) {
    buyFlex = new Flex(flex, [0, 0, 0.7], [0, 0, 0.0], [1, 0, -0.02], [0, 0, 0.98]);
    addButtonAction(buyFlex.div, opt_plantfun, (opt_replace ? 'Replace with ' : 'Place ') + fish.name);
    styleButton0(buyFlex.div);
  }

  if(opt_tooltipfun) {
    if(opt_showfun) {
      registerTooltip(canvasFlex.div, function() {
        return 'Show ' + fish.name + ' info';
      }, true);
    }
    if(opt_plantfun) {
      registerTooltip(buyFlex.div, function() {
        return (opt_replace ? 'Replace with  ' : 'Place ') + fish.name + '<br><br>' + opt_tooltipfun();
      }, true);
    }
    registerTooltip(infoFlex.div, function() {
      return upper(fish.name) + '<br><br>' + opt_tooltipfun();
    }, true);
  } else {
    if(opt_showfun) registerTooltip(canvasFlex.div, 'Show ' + fish.name + ' info');
    if(opt_plantfun) registerTooltip(canvasFlex.div, (opt_replace ? 'Replace with ' : 'Place ') + fish.name);
  }

  infoFlex.div.innerHTML = text;

  if(opt_plantfun && state.res.lt(cost)) {
    flex.div.className = 'efButtonTranslucentCantAfford';
    registerUpdateListener(function() {
      if(!flex || !document.body.contains(infoFlex.div)) return false;
      var cost = fish.getCost();
      if(opt_recoup) cost = cost.sub(opt_recoup);
      if(state.res.gte(cost)) {
        flex.div.className = 'efPlantChip';
        return false;
      }
      return true;
    });
  }

  return flex;
}


function getFishesOrder() {
  var unlocked = [];
  for(var i = 0; i < registered_fishes.length; i++) {
    if(state.fishes[registered_fishes[i]].unlocked) unlocked.push(registered_fishes[i]);
  }

  var result = [];

  var added = {};

  // everything else
  var array = [];
  for(var i = 0; i < unlocked.length; i++) {
    if(added[unlocked[i]]) continue;
    array.push(unlocked[i]);
  }
  array.sort(function(a, b) {
    var ac = fishes[a].cost.infspores;
    var bc = fishes[b].cost.infspores;
    if(ac.eqr(0) || bc.eqr(0)) {
      // for fishes that don't use infspores as cost
      ac = Num(fishes[a].tier);
      bc = Num(fishes[b].tier);
    }
    return ac.lt(bc) ? 1 : -1;
  });
  for(var i = 0; i < array.length; i++) {
    result.push(array[i]);
    added[array[i]] = true;
  }

  return result;
}

function makePlantFishDialog(x, y, opt_replace, opt_recoup) {
  var num_unlocked = 0;
  for(var i = 0; i < registered_fishes.length; i++) {
    if(state.fishes[registered_fishes[i]].unlocked) num_unlocked++;
  }

  var dialogsize = DIALOG_SMALL;
  if(num_unlocked > 9) dialogsize = DIALOG_MEDIUM;
  if(num_unlocked > 12) dialogsize = DIALOG_LARGE;

  var dialog = createDialog({
    size:dialogsize,
    title:(opt_replace ? 'Replace fish' : 'Place fish'),
    bgstyle:'efDialogTranslucent'
  });
  var tx = 0;
  var ty = 0;

  var flex = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.05);
  if(opt_replace) {
    centerText2(flex.div);
    flex.div.textEl.innerHTML = 'Replace fish with...';
  } else {
    flex.div.innerHTML = 'Choose a fish to place, or click its icon for info';
  }

  flex = new Flex(dialog.content, 0, 0.12, 1, 1);
  makeScrollable(flex);

  var fishes_order = getFishesOrder();

  for(var i = 0; i < fishes_order.length; i++) {
    var index = fishes_order[i];
    var c = fishes[index];

    var tooltipfun = bind(function(index) {
      var result = '';
      var c = fishes[index];

      result += 'Fish type: ' + getFishTypeName(c.type) + (c.tier ? (' (tier ' + (c.tier + 1) + ')') : '');

      if(c.effect_description) {
        result += '.<br>' + c.effect_description;
      }
      if(c.tagline) result += '<br/><br/>' + upper(c.tagline);

      var cost = c.getCost();
      result += '<br><br>Placing cost: ' + cost.toString() + ' (' + getCostAffordTimer(cost) + ')';

      result += '.';
      return result;
    }, index);

    var plantfun = bind(function(index) {
      state.lastPlantedFish = index; // for shift key
      var c = fishes[index];
      if(opt_replace) {
        addAction({type:ACTION_REPLACE_FISH, x:x, y:y, fish:c});
      } else {
        addAction({type:ACTION_PLANT_FISH, x:x, y:y, fish:c});
      }
      closeDialogsUpTo(1); // leave the pond dialog itself
      update(); // do update immediately rather than wait for tick, for faster feeling response time
      return true;
    }, index);

    var showfun = bind(function(tooltipfun, plantfun, c) {
      var text = upper(c.name) + '<br><br>' + tooltipfun();
      var dialog = createDialog({
        size:(text.length < 350 ? DIALOG_SMALL : DIALOG_MEDIUM),
        title:'Fish info',
        names:'place',
        functions:plantfun,
        icon:c.image
      });
      dialog.content.div.innerHTML = text;
    }, tooltipfun, plantfun, c);

    var chip = makeFishChip(c, tx, ty, 0.33, flex, plantfun, showfun, tooltipfun, opt_replace, opt_recoup, state.pond[y][x]);
    tx++;
    if(tx >= 3) {
      tx = 0;
      ty++;
    }
  }

  flex.update(); // something about the makeScrollable above misplaces some of the flex-managed sub positions, this update fixes it
}
