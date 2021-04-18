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



var mistbutton = undefined;
var misttimerflex = undefined;

var sunbutton = undefined;
var suntimerflex = undefined;

var rainbowbutton = undefined;
var rainbowtimerflex = undefined;

// not really an ability, but part of the same toolbar so handled here for now
var watercressbutton = undefined;

// just like how the numbers are defined in data: duration is the running time, wait is the cooldown time plus the running time (total cycle time)
function formatAbilityDurationTooltipText(name, description, duration, wait) {
  var cooldown = wait - duration;
  return name + ': ' + description + '<br>' + 'Run time: ' + util.formatDuration(duration) + '. Cooldown time: ' + util.formatDuration(cooldown);
}


function updateAbilitiesUI() {


  //////////////////////////////////////////////////////////////////////////////


  if(sunbutton && !state.upgrades[upgrade_sununlock].count) {
    sunbutton.removeSelf();
    suntimerflex.removeSelf();
    sunbutton = undefined;
  }

  if(!sunbutton && state.upgrades[upgrade_sununlock].count) {
    //sunbutton = new Flex(topFlex, [0,5], [0,0.1], [0,5.8], [0,0.9]);
    //sunbutton = new Flex(topFlex, [0,4], [0,0.1], [0,4.8], [0,0.9], 2);
    sunbutton = new Flex(topFlex, [0,4], [0,0.1], [0,4.8], [0,0.9]);
    styleButton0(sunbutton.div, true);

    suntimerflex = new Flex(topFlex, [0,4], [0,0.1], [0,5.5], [0,0.9], 2);
    suntimerflex.div.className = 'efWeatherOff';
    suntimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    suntimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(sunbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_sun, canvas);

    addButtonAction(sunbutton.div, function() {
      actions.push({type:ACTION_ABILITY, ability:1});
      update();
    }, 'sun ability');
    sunbutton.div.id = 'sun_button';

    registerTooltip(sunbutton.div, function() { return formatAbilityDurationTooltipText('sun ability', 'berries get a production bonus and aren\'t negatively affected by winter', getSunDuration(), getSunWait())});
  }

  if(state.upgrades[upgrade_sununlock].count) {
    var d = util.getTime() - state.suntime;
    if(d > getSunWait()) {
      suntimerflex.div.innerHTML = '';
    } else if(d > getSunDuration()) {
      suntimerflex.div.className = 'efWeatherOff';
      suntimerflex.div.innerHTML = 'ready in:<br>' + util.formatDuration(getSunWait() - d, true);
    } else {
      suntimerflex.div.className = 'efWeatherOn';
      suntimerflex.div.innerHTML = 'active:<br>' + util.formatDuration(getSunDuration() - d, true);
    }
  }


  //////////////////////////////////////////////////////////////////////////////

  if(mistbutton && !state.upgrades[upgrade_mistunlock].count) {
    mistbutton.removeSelf();
    misttimerflex.removeSelf();
    mistbutton = undefined;
  }

  if(!mistbutton && state.upgrades[upgrade_mistunlock].count) {
    mistbutton = new Flex(topFlex, [0,5.5], [0,0.1], [0,6.3], [0,0.9]);
    styleButton0(mistbutton.div, true);

    misttimerflex = new Flex(topFlex, [0,5.5], [0,0.1], [0,7], [0,0.9], 2);
    misttimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    misttimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(mistbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_mist, canvas);

    var fun = function() {
      actions.push({type:ACTION_ABILITY, ability:0});
      update();
    };
    addButtonAction(mistbutton.div, fun, 'mist ability');
    mistbutton.div.id = 'mist_button';

    registerTooltip(mistbutton.div, function() { return formatAbilityDurationTooltipText('mist ability', 'mushrooms produce more spores, consume less seeds, and aren\'t negatively affected by winter', getMistDuration(), getMistWait())});
  }

  if(state.upgrades[upgrade_mistunlock].count) {
    var d = util.getTime() - state.misttime;
    if(d > getMistWait()) {
      misttimerflex.div.innerHTML = '';
    } else if(d > getMistDuration()) {
      misttimerflex.div.className = 'efWeatherOff';
      misttimerflex.div.innerHTML = 'ready in:<br>' + util.formatDuration(getMistWait() - d, true);
    } else {
      misttimerflex.div.className = 'efWeatherOn';
      misttimerflex.div.innerHTML = 'active:<br>' + util.formatDuration(getMistDuration() - d, true);
    }
  }


  //////////////////////////////////////////////////////////////////////////////


  if(rainbowbutton && !state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton.removeSelf();
    rainbowtimerflex.removeSelf();
    rainbowbutton = undefined;
  }

  if(!rainbowbutton && state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton = new Flex(topFlex, [0,7], [0,0.1], [0,7.8], [0,0.9]);
    styleButton0(rainbowbutton.div, true);

    rainbowtimerflex = new Flex(topFlex, [0,7], [0,0.1], [0,8.5], [0,0.9], 2);
    rainbowtimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    rainbowtimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(rainbowbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_rainbow, canvas);

    addButtonAction(rainbowbutton.div, function() {
      actions.push({type:ACTION_ABILITY, ability:2});
      update();
    }, 'rainbow ability');
    rainbowbutton.div.id = 'rainbow_button';

    registerTooltip(rainbowbutton.div, function() { return formatAbilityDurationTooltipText('rainbow ability', 'rainbow ability: flowers get a boost and aren\'t negatively affected by winter', getRainbowDuration(), getRainbowWait())});
  }

  if(state.upgrades[upgrade_rainbowunlock].count) {
    var d = util.getTime() - state.rainbowtime;
    if(d > getRainbowWait()) {
      rainbowtimerflex.div.innerHTML = '';
    } else if(d > getRainbowDuration()) {
      rainbowtimerflex.div.className = 'efWeatherOff';
      rainbowtimerflex.div.innerHTML = 'ready in:<br>' + util.formatDuration(getRainbowWait() - d, true);
    } else {
      rainbowtimerflex.div.className = 'efWeatherOn';
      rainbowtimerflex.div.innerHTML = 'active:<br>' + util.formatDuration(getRainbowDuration() - d, true);
    }
  }


  //////////////////////////////////////////////////////////////////////////////

  // this button becomes available once more enough resources to fully replant all watercress
  if(state.g_res.seeds.gtr(1000)) {
    if(!watercressbutton) {
      watercressbutton = new Flex(topFlex, [1,-2.1], [0,0.1], [1,-1.3], [0,0.9]);
      watercressbutton.div.title = 'Refresh watercress: active watercress and remainders only. Hotkey: w. With ctrl, deletes all watercress. With shift, plants watercress everywhere it can';
      styleButton0(watercressbutton.div, true);
      var canvasFlex = new Flex(watercressbutton, 0, 0, 1, 1);
      var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
      renderImage(watercress[4], canvas);

      addButtonAction(watercressbutton.div, function(e) {
        refreshWatercress(util.eventHasCtrlKey(e), e.shiftKey);
      }, 'refresh watercress. with shift: deletes all watercress');
      watercressbutton.div.id = 'watercress_button';
    }
  } else if(watercressbutton) {
    watercressbutton.clear();
    watercressbutton.removeSelf();
    watercressbutton = undefined;
  }

  //////////////////////////////////////////////////////////////////////////////
}


function refreshWatercress(opt_clear, opt_all) {
  if(opt_clear && opt_all) return;
  var replanted = false;
  var refreshed = false;
  var remcleared = false;
  var fullyplanted = false;
  var cresscost = crops[short_0].cost.seeds;
  var seeds_available = Num(state.res.seeds);
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var can_afford = seeds_available.ge(cresscost);
      var f = state.field[y][x];
      if(opt_all) {
        if(can_afford && (f.index == 0 || f.index == FIELD_REMAINDER || f.index == CROPINDEX + watercress_template)) {
          if(f.index == CROPINDEX + watercress_template) {
            actions.push({type:ACTION_DELETE, x:x, y:y, silent:true});
          }
          seeds_available.subInPlace(cresscost);
          actions.push({type:ACTION_PLANT, x:x, y:y, crop:crops[short_0], ctrlPlanted:true, silent:true});
          fullyplanted = true;
        }
      } else if(f.index == FIELD_REMAINDER) {
        if(opt_clear) {
          actions.push({type:ACTION_DELETE, x:x, y:y, silent:true});
          remcleared = true;
        } else if(can_afford) {
          seeds_available.subInPlace(cresscost);
          actions.push({type:ACTION_PLANT, x:x, y:y, crop:crops[short_0], ctrlPlanted:true, silent:true});
          replanted = true;
        }
      } else if(f.index == CROPINDEX + short_0 && (can_afford || opt_clear)) {
        actions.push({type:ACTION_DELETE, x:x, y:y, silent:true});
        if(!opt_clear) {
          seeds_available.subInPlace(cresscost);
          actions.push({type:ACTION_PLANT, x:x, y:y, crop:crops[short_0], ctrlPlanted:true, silent:true});
        }
        refreshed = true;
      } else if(f.index == CROPINDEX + watercress_template && can_afford) {
        if(!opt_clear) {
          seeds_available.subInPlace(cresscost);
          actions.push({type:ACTION_REPLACE, x:x, y:y, crop:crops[short_0], ctrlPlanted:true, silent:true});
          refreshed = true;
        }
      }
    }
  }
  if(fullyplanted) showMessage('planting watercress');
  else if(replanted) showMessage('replanting watercress');
  else if(refreshed) showMessage(opt_clear ? 'deleting watercress' : 'refreshing watercress');
  else if(remcleared) showMessage('cleared watercress remainders');
  else if(seeds_available.lt(cresscost)) showMessage('nothing done: only refreshes existing watercress or remainders of watercress, and requires enough resources available to plant the watercress');
  else showMessage('nothing done: only refreshes existing watercress or remainders of watercress');
  update();
}


document.addEventListener('keydown', function(e) {
  var shift = util.eventHasShiftKey(e);
  var ctrl = util.eventHasCtrlKey(e);

  //if(e.target.matches('textarea')) return; // typing in a textarea, don't do global game shortcuts then
  if(dialog_level > 0) return; // in a dialog, don't do global game shortcuts then

  if(e.key == '1' && !shift && !ctrl) {
    actions.push({type:ACTION_ABILITY, ability:1});
    update();
  }
  if(e.key == '2' && !shift && !ctrl) {
    actions.push({type:ACTION_ABILITY, ability:0});
    update();
  }
  if(e.key == '3' && !shift && !ctrl) {
    actions.push({type:ACTION_ABILITY, ability:2});
    update();
  }

  if(e.key == 't' && !shift && !ctrl) {
    if(state.challenge) {
      createFinishChallengeDialog();
    } else {
      if(state.treelevel >= min_transcension_level) createTranscendDialog();
    }
  }

  if(e.key == 'w' && !shift && !ctrl) {
    // NOTE: ctrl for this shortcut doesn't work, since ctrl+w closes browser window. For consistency, shift is also not supported.
    refreshWatercress();
  }

  if(e.key == 'b' && !shift && !ctrl) {
    createBlueprintsDialog();
  }

  if(e.key == 'u' && state.currentTab == tabindex_field) {
    // upgrade crop
    var did_something = false;
    did_something |= makeUpgradeCropAction(shiftCropFlexX, shiftCropFlexY);
    if(state.fern && shiftCropFlexX == state.fernx && shiftCropFlexY == state.ferny) {
      actions.push({type:ACTION_FERN, x:shiftCropFlexX, y:shiftCropFlexY});
      did_something = true;
    }
    if(state.field[shiftCropFlexY]) {
      var f = state.field[shiftCropFlexY][shiftCropFlexX];
      if(f && f.index == FIELD_REMAINDER) {
        actions.push({type:ACTION_PLANT, x:shiftCropFlexX, y:shiftCropFlexY, crop:crops[short_0], ctrlPlanted:true});
      }
      did_something = true;
    }
    if(did_something) {
      update();
    }
  }

  if(e.key == 'u' && state.currentTab == tabindex_field2) {
    // upgrade crop
    var did_something = false;
    did_something |= makeUpgradeCrop2Action(shiftCrop2FlexX, shiftCrop2FlexY);
    if(did_something) {
      update();
    }
  }

  if(e.key == 'p' && state.currentTab == tabindex_field) {
    if(state.field[shiftCropFlexY]) {
      var f = state.field[shiftCropFlexY][shiftCropFlexX];
      if(f) {
        if(f.hasCrop()) {
          // pick
          state.lastPlanted = f.getCrop().index;
        } else {
          // plant
          if(state.lastPlanted >= 0 && crops[state.lastPlanted]) {
            actions.push({type:ACTION_PLANT, x:shiftCropFlexX, y:shiftCropFlexY, crop:crops[state.lastPlanted], shiftPlanted:true});
            update();
          }
        }
      }
    }
  }

  if(e.key == 'p' && state.currentTab == tabindex_field2) {
    if(state.field2[shiftCrop2FlexY]) {
      var f = state.field2[shiftCrop2FlexY][shiftCrop2FlexX];
      if(f) {
        if(f.hasCrop()) {
          // pick
          state.lastPlanted2 = f.getCrop().index;
        } else {
          // plant
          if(state.lastPlanted2 >= 0 && crops2[state.lastPlanted2]) {
            actions.push({type:ACTION_PLANT2, x:shiftCrop2FlexX, y:shiftCrop2FlexY, crop:crops2[state.lastPlanted2], shiftPlanted:true});
            update();
          }
        }
      }
    }
  }

  if(e.key == 'd' && state.currentTab == tabindex_field) {
    if(state.allowshiftdelete) {
      if(state.field[shiftCropFlexY]) {
        var f = state.field[shiftCropFlexY][shiftCropFlexX];
        if(f) {
          if(f.hasCrop()) {
            // delete crop
            actions.push({type:ACTION_DELETE, x:shiftCropFlexX, y:shiftCropFlexY});
            update();
          }
        }
      }
    } else {
      showMessage('"shortcuts may delete crop" must be enabled in the settings before deleting crops with "d" is allowed', C_INVALID, 0, 0);
    }
  }

  if(e.key == 'd' && state.currentTab == tabindex_field2) {
    if(state.allowshiftdelete) {
      if(state.field2[shiftCrop2FlexY]) {
        var f = state.field2[shiftCrop2FlexY][shiftCrop2FlexX];
        if(f) {
          if(f.hasCrop()) {
            // delete crop
            actions.push({type:ACTION_DELETE2, x:shiftCrop2FlexX, y:shiftCrop2FlexY});
            update();
          }
        }
      }
    } else {
      showMessage('"shortcuts may delete crop" must be enabled in the settings before deleting crops with "d" is allowed', C_INVALID, 0, 0);
    }
  }

  // these keys for prev and next fruit are chosen such that hopefully at least one set of them is reachable on any keyboard layout, even if in combination with shift if necessary
  if((e.key == ']' || e.key == '}' || e.key == ')') && !ctrl) {
    if(state.fruit_active + 1 < state.fruit_stored.length) {
      state.fruit_active++;
      updateFruitUI();
      updateRightPane();
      var f_active = getActiveFruit();
      var name = f_active ? (f_active.toString() + ': ' + f_active.abilitiesToString(true, true)) : 'none';
      showMessage('Set active fruit: ' + name);
    }
  }
  if((e.key == '[' || e.key == '{' || e.key == '(') && !ctrl) {
    if(state.fruit_active > 0) {
      state.fruit_active--;
      updateFruitUI();
      updateRightPane();
      var f_active = getActiveFruit();
      var name = f_active ? (f_active.toString() + ': ' + f_active.abilitiesToString(true, true)) : 'none';
      showMessage('Set active fruit: ' + name);
    }
  }
});


