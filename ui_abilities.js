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

var prev_brassica_index = -1; // for updating the button if the image for brassica changes

function updateAbilitiesUI() {
  //////////////////////////////////////////////////////////////////////////////


  if(sunbutton && !state.upgrades[upgrade_sununlock].count) {
    sunbutton.removeSelf(topFlex);
    suntimerflex.removeSelf(topFlex);
    sunbutton = undefined;
  }

  if(!sunbutton && state.upgrades[upgrade_sununlock].count) {
    sunbutton = addTopBarFlex(4, 5);
    styleButton0(sunbutton.div, true);

    suntimerflex = addTopBarFlex(3.8, 5.2, 2.5);
    centerText2(suntimerflex.div);
    suntimerflex.div.className = 'efWeatherOff';
    suntimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    suntimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(sunbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_sun, canvas);

    addButtonAction(sunbutton.div, function() {
      addAction({type:ACTION_ABILITY, ability:1});
      update();
    }, 'sun ability');
    sunbutton.div.id = 'sun_button';

    registerTooltip(sunbutton.div, function() { return formatAbilityDurationTooltipText('sun ability', 'berries get a +' + getSunSeedsBoost().toPercentString() + ' production bonus and aren\'t negatively affected by winter', getSunDuration(), getSunWait())});
  }

  if(state.upgrades[upgrade_sununlock].count) {
    var d = util.getTime() - state.suntime;
    if(d > getSunWait()) {
      suntimerflex.div.textEl.innerHTML = '';
    } else if(d > getSunDuration()) {
      suntimerflex.div.className = 'efWeatherOff';
      suntimerflex.div.textEl.innerHTML = '<small>ready in:</small><br>' + util.formatDuration(getSunWait() - d, true);
    } else {
      suntimerflex.div.className = 'efWeatherOn';
      suntimerflex.div.textEl.innerHTML = '<small>active:</small><br>' + util.formatDuration(getSunDuration() - d, true);
    }
  }


  //////////////////////////////////////////////////////////////////////////////

  if(mistbutton && !state.upgrades[upgrade_mistunlock].count) {
    mistbutton.removeSelf(topFlex);
    misttimerflex.removeSelf(topFlex);
    mistbutton = undefined;
  }

  if(!mistbutton && state.upgrades[upgrade_mistunlock].count) {
    mistbutton = addTopBarFlex(5, 6);
    styleButton0(mistbutton.div, true);

    misttimerflex = addTopBarFlex(4.8, 6.2, 2.5);
    centerText2(misttimerflex.div);
    misttimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    misttimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(mistbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_mist, canvas);

    var fun = function() {
      addAction({type:ACTION_ABILITY, ability:0});
      update();
    };
    addButtonAction(mistbutton.div, fun, 'mist ability');
    mistbutton.div.id = 'mist_button';

    registerTooltip(mistbutton.div, function() { return formatAbilityDurationTooltipText('mist ability', 'mushrooms produce ' + getMistSporesBoost().toPercentString() + ' more spores, consume ' + getMistSeedsBoost().rsub(1).toPercentString() + ' less seeds, and aren\'t negatively affected by winter', getMistDuration(), getMistWait())});
  }

  if(state.upgrades[upgrade_mistunlock].count) {
    var d = util.getTime() - state.misttime;
    if(d > getMistWait()) {
      misttimerflex.div.textEl.innerHTML = '';
    } else if(d > getMistDuration()) {
      misttimerflex.div.className = 'efWeatherOff';
      misttimerflex.div.textEl.innerHTML = '<small>ready in:</small><br>' + util.formatDuration(getMistWait() - d, true);
    } else {
      misttimerflex.div.className = 'efWeatherOn';
      misttimerflex.div.textEl.innerHTML = '<small>active:</small><br>' + util.formatDuration(getMistDuration() - d, true);
    }
  }


  //////////////////////////////////////////////////////////////////////////////


  if(rainbowbutton && !state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton.removeSelf(topFlex);
    rainbowtimerflex.removeSelf(topFlex);
    rainbowbutton = undefined;
  }

  if(!rainbowbutton && state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton = addTopBarFlex(6, 7);
    styleButton0(rainbowbutton.div, true);

    rainbowtimerflex = addTopBarFlex(5.8, 7.2, 2.5);
    centerText2(rainbowtimerflex.div);
    rainbowtimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    rainbowtimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(rainbowbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_rainbow, canvas);

    addButtonAction(rainbowbutton.div, function() {
      addAction({type:ACTION_ABILITY, ability:2});
      update();
    }, 'rainbow ability');
    rainbowbutton.div.id = 'rainbow_button';

    registerTooltip(rainbowbutton.div, function() { return formatAbilityDurationTooltipText('rainbow ability', 'rainbow ability: flowers get a +' + getRainbowFlowerBoost().toPercentString() + ' boost and aren\'t negatively affected by winter', getRainbowDuration(), getRainbowWait())});
  }

  if(state.upgrades[upgrade_rainbowunlock].count) {
    var d = util.getTime() - state.rainbowtime;
    if(d > getRainbowWait()) {
      rainbowtimerflex.div.textEl.innerHTML = '';
    } else if(d > getRainbowDuration()) {
      rainbowtimerflex.div.className = 'efWeatherOff';
      rainbowtimerflex.div.textEl.innerHTML = '<small>ready in:</small><br>' + util.formatDuration(getRainbowWait() - d, true);
    } else {
      rainbowtimerflex.div.className = 'efWeatherOn';
      rainbowtimerflex.div.textEl.innerHTML = '<small>active:</small><br>' + util.formatDuration(getRainbowDuration() - d, true);
    }
  }


  //////////////////////////////////////////////////////////////////////////////

  // refresh watercress button. this button becomes available once more enough resources to fully replant all watercress
  if(state.g_res.seeds.gtr(1000)) {
    var brassica_index = getHighestBrassica();
    if(!watercressbutton || prev_brassica_index != brassica_index) {
      if(watercressbutton) {
        watercressbutton.clear();
        watercressbutton.removeSelf(topFlex);
      }
      prev_brassica_index = brassica_index;
      var image = images_watercress[4];
      var name = 'watercress';
      if(brassica_index >= 0) {
        image = crops[brassica_index].image[4];
        name = crops[brassica_index].name;
      }

      watercressbutton = addTopBarFlex(9, 10);
      watercressbutton.div.title = 'Refresh ' + name + ': active ' + name + ' and remainders only. Hotkey: w. With ctrl, deletes all ' + name + '. With shift, plants ' + name + ' everywhere it can';
      styleButton0(watercressbutton.div, true);
      var canvasFlex = new Flex(watercressbutton, 0, 0, 1, 1);
      var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
      renderImage(image, canvas);

      addButtonAction(watercressbutton.div, function(e) {
        refreshWatercress(util.eventHasCtrlKey(e), e.shiftKey);
      }, 'refresh ' + name + '. with shift: deletes all ' + name);
      watercressbutton.div.id = 'watercress_button';
    }
  } else if(watercressbutton) {
    watercressbutton.clear();
    watercressbutton.removeSelf(topFlex);
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
  var cresscost = crops[brassica_0].cost.seeds; // taking only cheapest one for this computation is ok, when unlocking next tiers its cost is extremely low compared to seeds you have
  var cropindex = getHighestBrassica();
  if(cropindex < 0) return;
  var seeds_available = Num(state.res.seeds);
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var can_afford = seeds_available.ge(cresscost);
      var f = state.field[y][x];
      var c = f.getCrop();
      if(opt_all) {
        if(can_afford && (f.index == 0 || f.index == FIELD_REMAINDER || f.index == CROPINDEX + watercress_template)) {
          if(f.index == CROPINDEX + watercress_template) {
            addAction({type:ACTION_DELETE, x:x, y:y, silent:true});
          }
          seeds_available.subInPlace(cresscost);
          addAction({type:ACTION_PLANT, x:x, y:y, crop:crops[cropindex], ctrlPlanted:true, silent:true});
          fullyplanted = true;
        }
      } else if(f.index == FIELD_REMAINDER) {
        if(opt_clear) {
          addAction({type:ACTION_DELETE, x:x, y:y, silent:true});
          remcleared = true;
        } else if(can_afford) {
          seeds_available.subInPlace(cresscost);
          addAction({type:ACTION_PLANT, x:x, y:y, crop:crops[cropindex], ctrlPlanted:true, silent:true});
          replanted = true;
        }
      } else if(c && c.type == CROPTYPE_BRASSICA && (can_afford || opt_clear)) {
        addAction({type:ACTION_DELETE, x:x, y:y, silent:true});
        if(!opt_clear) {
          seeds_available.subInPlace(cresscost);
          addAction({type:ACTION_PLANT, x:x, y:y, crop:crops[cropindex], ctrlPlanted:true, silent:true});
        }
        refreshed = true;
      } else if(f.index == CROPINDEX + watercress_template && can_afford) {
        if(!opt_clear) {
          seeds_available.subInPlace(cresscost);
          addAction({type:ACTION_REPLACE, x:x, y:y, crop:crops[cropindex], ctrlPlanted:true, silent:true});
          refreshed = true;
        }
      }
    }
  }
  if(fullyplanted) showMessage('planting brassica');
  else if(replanted) showMessage('replanting brassica');
  else if(refreshed) showMessage(opt_clear ? 'deleting brassica' : 'refreshing brassica');
  else if(remcleared) showMessage('cleared brassica remainders');
  else if(seeds_available.lt(cresscost)) showMessage('nothing done: only refreshes existing brassica or remainders of brassica, and requires enough resources available to plant the brassica');
  else showMessage('nothing done: only refreshes existing brassica or remainders of brassica');
  update();
}


document.addEventListener('keydown', function(e) {
  //if(e.target.matches('textarea')) return; // typing in a textarea, don't do global game shortcuts then
  if(dialog_level > 0) {
    if(e.keyCode == 27 || e.code == 'Escape') {
      if(dropdownEl) {
        removeAllDropdownElements();
      } else {
        closeTopDialog(true);
      }
    }
    return; // in a dialog, don't do global game shortcuts
  }

  var shift = util.eventHasShiftKey(e);
  var ctrl = util.eventHasCtrlKey(e);

  var numberfun = state.keys_numbers;
  if(shift) numberfun = state.keys_numbers_shift;

  var key = e.key;
  var code = e.code;
  // for letters and numbers, avoid shift having an effect
  if(code.length == 4 && code.substr(0, 3) == 'Key') {
    if(code[3] >= 'A' && code[3] <= 'Z') key = code[3].toLowerCase();
  }
  if(code.length == 6 && code.substr(0, 5) == 'Digit') {
    // for numbers, only do this if there's a setting using numbers enabled. The reason: ( and ) could be under numbers, and in that case you may genuinely want to use them
    // and for weather, which only goes from 1-3, still allow other keys behind other numbers
    if(numberfun != 0 && numberfun != 1) {
      if(code[5] >= '0' && code[5] <= '9') key = code[5];
    }
    if(numberfun == 1) {
      if(code[5] >= '1' && code[5] <= '3') key = code[5];
    }
  }

  if(key >= '0' && key <= '9') {
    if(numberfun == 0) return;

    var number = key - '0';
    if(number == '0') number = 10; // keyboard has the 0 after the 9 instead of before the 1

    if(numberfun == 1) {
      if(key == '1') {
        addAction({type:ACTION_ABILITY, ability:1});
        update();
      }
      if(key == '2') {
        addAction({type:ACTION_ABILITY, ability:0});
        update();
      }
      if(key == '3') {
        addAction({type:ACTION_ABILITY, ability:2});
        update();
      }
    } else if(numberfun == 2) {
      setTabNumber(number - 1);
    } else if(numberfun == 3) {
      var index = number - 1;
      // even though it's possible and allowed to select a slot with no fruit in it, allow keyboard shortcuts only to select actual fruits, to avoid accidental keypresses setting the fruit to nothing and silently making a run harder
      if(index < state.fruit_stored.length) {
        addAction({type:ACTION_FRUIT_ACTIVE, slot:(number - 1), silent:true, allow_empty:true});
        update();
      }
    }
    if(shift) {
      // these chips appear due to the shift+plant feature, but could be in the way of console messages when using shift+keys for other reasons, so remove them
      removeShiftCropChip();
      removeShiftCrop2Chip();
    }
  }


  if(key == 't' && !shift && !ctrl) {
    if(state.challenge) {
      createFinishChallengeDialog();
    } else {
      if(state.treelevel >= min_transcension_level) createTranscendDialog();
    }
  }

  if(key == 'w' && !shift && !ctrl) {
    // NOTE: ctrl for this shortcut doesn't work, since ctrl+w closes browser window. For consistency, shift is also not supported.
    refreshWatercress();
  }

  if(key == 'b' && !shift && !ctrl) {
    createBlueprintsDialog();
  }

  if(key == 'u' && !shift && !ctrl && state.currentTab == tabindex_field) {
    // upgrade crop
    var did_something = false;
    did_something |= makeUpgradeCropAction(shiftCropFlexX, shiftCropFlexY);
    if(state.fern && shiftCropFlexX == state.fernx && shiftCropFlexY == state.ferny) {
      addAction({type:ACTION_FERN, x:shiftCropFlexX, y:shiftCropFlexY});
      did_something = true;
    }
    if(state.field[shiftCropFlexY]) {
      var f = state.field[shiftCropFlexY][shiftCropFlexX];
      if(f && f.index == FIELD_REMAINDER) {
        addAction({type:ACTION_PLANT, x:shiftCropFlexX, y:shiftCropFlexY, crop:crops[brassica_0], ctrlPlanted:true});
      }
      did_something = true;
    }
    if(did_something) {
      update();
    }
  }

  if(key == 'u' && !shift && !ctrl && state.currentTab == tabindex_field2) {
    // upgrade crop
    var did_something = false;
    did_something |= makeUpgradeCrop2Action(shiftCrop2FlexX, shiftCrop2FlexY);
    if(did_something) {
      update();
    }
  }

  if(key == 'p' && !shift && !ctrl && state.currentTab == tabindex_field) {
    if(state.field[shiftCropFlexY]) {
      var f = state.field[shiftCropFlexY][shiftCropFlexX];
      if(f) {
        if(f.hasCrop()) {
          // pick
          state.lastPlanted = f.getCrop().index;
        } else {
          // plant
          if(state.lastPlanted >= 0 && crops[state.lastPlanted]) {
            addAction({type:ACTION_PLANT, x:shiftCropFlexX, y:shiftCropFlexY, crop:crops[state.lastPlanted], shiftPlanted:true});
            update();
          }
        }
      }
    } else if(mouseOverUpgradeCrop != null) {
      if(state.crops[mouseOverUpgradeCrop] && state.crops[mouseOverUpgradeCrop].unlocked) state.lastPlanted = mouseOverUpgradeCrop;
    }
  }

  if(key == 'p' && !shift && !ctrl && state.currentTab == tabindex_field2) {
    if(state.field2[shiftCrop2FlexY]) {
      var f = state.field2[shiftCrop2FlexY][shiftCrop2FlexX];
      if(f) {
        if(f.hasCrop()) {
          // pick
          state.lastPlanted2 = f.getCrop().index;
        } else {
          // plant
          if(state.lastPlanted2 >= 0 && crops2[state.lastPlanted2]) {
            addAction({type:ACTION_PLANT2, x:shiftCrop2FlexX, y:shiftCrop2FlexY, crop:crops2[state.lastPlanted2], shiftPlanted:true});
            update();
          }
        }
      }
    }
  }

  if(key == 'd' && !shift && !ctrl && state.currentTab == tabindex_field) {
    if(state.allowshiftdelete) {
      if(state.field[shiftCropFlexY]) {
        var f = state.field[shiftCropFlexY][shiftCropFlexX];
        if(f) {
          if(f.hasCrop()) {
            // delete crop
            addAction({type:ACTION_DELETE, x:shiftCropFlexX, y:shiftCropFlexY});
            update();
          }
        }
      }
    } else {
      showMessage('"shortcuts may delete crop" must be enabled in preferences->controls before deleting crops with "d" is allowed', C_INVALID, 0, 0);
    }
  }

  if(key == 'd' && !shift && !ctrl && state.currentTab == tabindex_field2) {
    if(state.allowshiftdelete) {
      if(state.field2[shiftCrop2FlexY]) {
        var f = state.field2[shiftCrop2FlexY][shiftCrop2FlexX];
        if(f) {
          if(f.hasCrop()) {
            // delete crop
            addAction({type:ACTION_DELETE2, x:shiftCrop2FlexX, y:shiftCrop2FlexY});
            update();
          }
        }
      }
    } else {
      showMessage('"shortcuts may delete crop" must be enabled in preferences->controls before deleting crops with "d" is allowed', C_INVALID, 0, 0);
    }
  }

  if(code == 'Escape' && !shift && !ctrl) {
    var dialog = createDialog();
    initSettingsUI_in(dialog);
  }

  // these keys for prev and next fruit are chosen such that hopefully at least one set of them is reachable on any keyboard layout, even if in combination with shift if necessary
  if((key == ']' || key == '}' || key == ')' || key == '>') && !ctrl) {
    if(state.keys_brackets == 2) {
      setTabNumber(getTabNumber() + 1);
    }
    if(state.keys_brackets == 3) {
      if(state.fruit_active + 1 < state.fruit_stored.length) {
        addAction({type:ACTION_FRUIT_ACTIVE, slot:state.fruit_active + 1});
        update();
      }
    }
  }
  if((key == '[' || key == '{' || key == '(' || key == '<') && !ctrl) {
    if(state.keys_brackets == 2) {
      setTabNumber(getTabNumber() - 1);
    }
    if(state.keys_brackets == 3) {
      if(state.fruit_active > 0) {
        addAction({type:ACTION_FRUIT_ACTIVE, slot:state.fruit_active - 1});
        update();
      }
    }
  }
});


