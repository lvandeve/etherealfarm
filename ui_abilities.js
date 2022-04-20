/*
Ethereal Farm
Copyright (C) 2020-2022  Lode Vandevenne

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
var mistpermaflex = undefined;

var sunbutton = undefined;
var suntimerflex = undefined;
var sunpermaflex = undefined;

var rainbowbutton = undefined;
var rainbowtimerflex = undefined;
var rainbowpermaflex = undefined;

var lightningicon = undefined;

// not really an ability, but part of the same toolbar so handled here for now
var watercressbutton = undefined;

/*
index = 0 for sun, 1 for mist, 2 for rainbow
perma is the reward from the stormy challenge
return values:
0: not active, not recharging, not selected for perma
1: not active, not recharging, selected for perma
2: recharging, not selected for perma
3: recharging, selected for perma
4: active
*/
function getAbilityStatus(index) {
  var unlocked = false;
  if(index == 0) unlocked = !!state.upgrades[upgrade_sununlock].count;
  if(index == 1) unlocked = !!state.upgrades[upgrade_mistunlock].count;
  if(index == 2) unlocked = !!state.upgrades[upgrade_rainbowunlock].count;
  if(!unlocked) return null;

  var wait;
  if(index == 0) wait = getSunWait();
  if(index == 1) wait = getMistWait();
  if(index == 2) wait = getRainbowWait();

  var duration;
  if(index == 0) duration = getSunDuration();
  if(index == 1) duration = getMistDuration();
  if(index == 2) duration = getRainbowDuration();

  var time;
  if(index == 0) time = state.suntime;
  if(index == 1) time = state.misttime;
  if(index == 2) time = state.rainbowtime;

  var perma = havePermaWeatherFor(index);

  var d = state.time - time;

  if(d > wait) return perma ? 1 : 0;
  if(d > duration || state.lastWeather != index) return perma ? 3 : 2;
  return 4;
}

function getAbilityStatusWord(index) {
  var status = getAbilityStatus(index);
  if(status == 0) return 'ready';
  if(status == 1) return 'ready, perma';
  if(status == 2) return 'recharging';
  if(status == 3) return 'recharging, perma';
  if(status == 4) return 'active';
  return null;
}

// just like how the numbers are defined in data: duration is the running time, wait is the cooldown time plus the running time (total cycle time)
function formatAbilityDurationTooltipText(index, name, description, duration, wait) {
  var statusWord = getAbilityStatusWord(index);
  var cooldown = wait - duration;
  var text = name + ': ' + description + '<br>' + 'Run time: ' + util.formatDuration(duration) + '. Cooldown time: ' + util.formatDuration(cooldown);
  if(statusWord) text += '<br><br>Status: ' + upper(statusWord);
  return text;
}

var prev_brassica_index = -1; // for updating the button if the image for brassica changes

function updateAbilitiesUI() {
  //////////////////////////////////////////////////////////////////////////////


  var havePerma = havePermaWeather();

  if(sunbutton && !state.upgrades[upgrade_sununlock].count) {
    sunbutton.removeSelf(topFlex);
    suntimerflex.removeSelf(topFlex);
    sunbutton = undefined;
  }

  if(state.challenge != challenge_stormy && !sunbutton && state.upgrades[upgrade_sununlock].count) {
    sunbutton = addTopBarFlex(4, 5);
    styleButton0(sunbutton.div, true);

    suntimerflex = addTopBarFlex(3.8, 5.2, 2.5);
    centerText2(suntimerflex.div);
    suntimerflex.div.className = 'efWeatherOff';
    suntimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    suntimerflex.div.style.pointerEvents = 'none';

    sunpermaflex = new Flex(sunbutton, 0, -0.1, 1, 0);
    sunpermaflex.div.className = 'efWeatherPerma';

    var canvasFlex = new Flex(sunbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_sun, canvas);

    addButtonAction(sunbutton.div, function() {
      addAction({type:ACTION_ABILITY, ability:0});
      update();
    }, 'sun ability');
    sunbutton.div.id = 'sun_button';

    registerTooltip(sunbutton.div, function() { return formatAbilityDurationTooltipText(0, 'sun ability', 'berries get a +' + getSunSeedsBoost().toPercentString() + ' production bonus and aren\'t negatively affected by winter', getSunDuration(), getSunWait())});
  }

  if(state.upgrades[upgrade_sununlock].count && sunbutton) {
    var d = util.getTime() - state.suntime;
    if(d > getSunWait()) {
      suntimerflex.div.textEl.innerHTML = '';
    } else if(d > getSunDuration() || state.lastWeather != 0) {
      suntimerflex.div.className = 'efWeatherOff';
      suntimerflex.div.textEl.innerHTML = '<small>ready in:</small><br>' + util.formatDuration(getSunWait() - d, true);
    } else {
      suntimerflex.div.className = 'efWeatherOn';
      suntimerflex.div.textEl.innerHTML = '<small>active:</small><br>' + util.formatDuration(getSunDuration() - d, true);
    }

    if(havePerma && state.lastWeather == 0) sunpermaflex.div.style.visibility = 'visible';
    else sunpermaflex.div.style.visibility = 'hidden';
  }


  //////////////////////////////////////////////////////////////////////////////

  if(mistbutton && !state.upgrades[upgrade_mistunlock].count) {
    mistbutton.removeSelf(topFlex);
    misttimerflex.removeSelf(topFlex);
    mistbutton = undefined;
  }

  if(state.challenge != challenge_stormy && !mistbutton && state.upgrades[upgrade_mistunlock].count) {
    mistbutton = addTopBarFlex(5, 6);
    styleButton0(mistbutton.div, true);

    misttimerflex = addTopBarFlex(4.8, 6.2, 2.5);
    centerText2(misttimerflex.div);
    misttimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    misttimerflex.div.style.pointerEvents = 'none';

    mistpermaflex = new Flex(mistbutton, 0, -0.1, 1, 0);
    mistpermaflex.div.className = 'efWeatherPerma';

    var canvasFlex = new Flex(mistbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_mist, canvas);

    var fun = function() {
      addAction({type:ACTION_ABILITY, ability:1});
      update();
    };
    addButtonAction(mistbutton.div, fun, 'mist ability');
    mistbutton.div.id = 'mist_button';

    registerTooltip(mistbutton.div, function() { return formatAbilityDurationTooltipText(1, 'mist ability', 'mushrooms produce ' + getMistSporesBoost().toPercentString() + ' more spores, consume ' + getMistSeedsBoost().rsub(1).toPercentString() + ' less seeds, and aren\'t negatively affected by winter', getMistDuration(), getMistWait())});
  }

  if(state.upgrades[upgrade_mistunlock].count && mistbutton) {
    var d = util.getTime() - state.misttime;
    if(d > getMistWait()) {
      misttimerflex.div.textEl.innerHTML = '';
    } else if(d > getMistDuration() || state.lastWeather != 1) {
      misttimerflex.div.className = 'efWeatherOff';
      misttimerflex.div.textEl.innerHTML = '<small>ready in:</small><br>' + util.formatDuration(getMistWait() - d, true);
    } else {
      misttimerflex.div.className = 'efWeatherOn';
      misttimerflex.div.textEl.innerHTML = '<small>active:</small><br>' + util.formatDuration(getMistDuration() - d, true);
    }

    if(havePerma && state.lastWeather == 1) mistpermaflex.div.style.visibility = 'visible';
    else mistpermaflex.div.style.visibility = 'hidden';
  }


  //////////////////////////////////////////////////////////////////////////////


  if(rainbowbutton && !state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton.removeSelf(topFlex);
    rainbowtimerflex.removeSelf(topFlex);
    rainbowbutton = undefined;
  }

  if(state.challenge != challenge_stormy && !rainbowbutton && state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton = addTopBarFlex(6, 7);
    styleButton0(rainbowbutton.div, true);

    rainbowtimerflex = addTopBarFlex(5.8, 7.2, 2.5);
    centerText2(rainbowtimerflex.div);
    rainbowtimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    rainbowtimerflex.div.style.pointerEvents = 'none';

    rainbowpermaflex = new Flex(rainbowbutton, 0, -0.1, 1, 0);
    rainbowpermaflex.div.className = 'efWeatherPerma';

    var canvasFlex = new Flex(rainbowbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_rainbow, canvas);

    addButtonAction(rainbowbutton.div, function() {
      addAction({type:ACTION_ABILITY, ability:2});
      update();
    }, 'rainbow ability');
    rainbowbutton.div.id = 'rainbow_button';

    registerTooltip(rainbowbutton.div, function() { return formatAbilityDurationTooltipText(2, 'rainbow ability', 'rainbow ability: flowers get a +' + getRainbowFlowerBoost().toPercentString() + ' boost and aren\'t negatively affected by winter', getRainbowDuration(), getRainbowWait())});
  }

  if(state.upgrades[upgrade_rainbowunlock].count && rainbowbutton) {
    var d = util.getTime() - state.rainbowtime;
    if(d > getRainbowWait()) {
      rainbowtimerflex.div.textEl.innerHTML = '';
    } else if(d > getRainbowDuration() || state.lastWeather != 2) {
      rainbowtimerflex.div.className = 'efWeatherOff';
      rainbowtimerflex.div.textEl.innerHTML = '<small>ready in:</small><br>' + util.formatDuration(getRainbowWait() - d, true);
    } else {
      rainbowtimerflex.div.className = 'efWeatherOn';
      rainbowtimerflex.div.textEl.innerHTML = '<small>active:</small><br>' + util.formatDuration(getRainbowDuration() - d, true);
    }

    if(havePerma && state.lastWeather == 2) rainbowpermaflex.div.style.visibility = 'visible';
    else rainbowpermaflex.div.style.visibility = 'hidden';
  }


  if(state.challenge == challenge_stormy && !lightningicon) {
    lightningicon = addTopBarFlex(4, 5);
    styleButton0(lightningicon.div, true);

    var canvasFlex = new Flex(lightningicon, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_storm, canvas);

    addButtonAction(lightningicon.div, function() {
      createDialog2({title:'Lightning info'}).content.div.innerText = 'Stormy weather is active throughout this challenge and lightning will strike a crop every ' + Math.round(lightningTime / 60) + ' minutes. In addition, berries, mushrooms and flowers are half as effective.';
    }, 'lightning info');
    lightningicon.div.id = 'lightning_button';

    registerTooltip(lightningicon.div, 'Stormy weather is active throughout this challenge and lightning will strike a crop every ' + Math.round(lightningTime / 60) + ' minutes. In addition, berries, mushrooms and flowers are half as effective.');
  } else if(state.challenge != challenge_stormy && lightningicon) {
    lightningicon.removeSelf(topFlex);
    lightningicon = undefined;
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
        if(can_afford && (f.index == 0 || f.index == FIELD_REMAINDER || f.index == CROPINDEX + watercress_template || f.index == CROPINDEX + watercress_ghost)) {
          if(f.index == CROPINDEX + watercress_template || f.index == CROPINDEX + watercress_ghost) {
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
      } else if((f.index == CROPINDEX + watercress_template || f.index == CROPINDEX + watercress_ghost) && can_afford) {
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


// get keyboard keys in slightly different format: as object containing key, code, shift and ctrl
// key and code are modified to represent some keys (numbers and letters) without shift being pressed, e.g. shift+a becomes 'a', not 'A'
// opt_end_number: if given (as character in a string, such as '6'), numbers higher than this one will not be corrected to undo shift. if set to '0', none will be affected, if set to '9' all except 9 will be affected, if set to undefined all will be affected
function getEventKeys(e, opt_end_number) {
  var shift = util.eventHasShiftKey(e);
  var ctrl = util.eventHasCtrlKey(e);
  var key = e.key;
  var code = e.code;

  // for letters and numbers, avoid shift having an effect
  if(code.length == 4 && code.substr(0, 3) == 'Key') {
    if(code[3] >= 'A' && code[3] <= 'Z') key = code[3].toLowerCase();
  }
  if(code.length == 6 && code.substr(0, 5) == 'Digit') {
    if(opt_end_number == undefined || code[5] < opt_end_number) {
      key = code[5];
    }
  }
  return {key:key, code:code, shift:shift, ctrl:ctrl};
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

  var numberfun = state.keys_numbers;
  if(util.eventHasShiftKey(e)) numberfun = state.keys_numbers_shift;

  // for numbers, only let them ignore shift if there's a setting using numbers enabled. The reason: ( and ) could be under numbers, and in that case you may genuinely want to use them
  // and for weather, which only goes from 1-3, still allow other keys behind other numbers
  var keys = getEventKeys(e, (numberfun == 1) ? '4' : ((numberfun == 0) ? '0' : undefined));

  var key = keys.key;
  var code = keys.code;
  var shift = keys.shift;
  var ctrl = keys.ctrl;

  if(key >= '0' && key <= '9') {
    if(numberfun == 0) return;

    var number = key - '0';
    if(number == '0') number = 10; // keyboard has the 0 after the 9 instead of before the 1

    if(numberfun == 1) {
      if(key == '1') {
        addAction({type:ACTION_ABILITY, ability:0});
        update();
      }
      if(key == '2') {
        addAction({type:ACTION_ABILITY, ability:1});
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
      if(index < state.fruit_stored.length && index < getNumFruitArrows()) {
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
    // NOTE: ctrl for this shortcut doesn't work, since ctrl+w closes browser tab. For consistency, shift is also not supported.
    refreshWatercress();
  }

  if(key == 'b' && !shift && !ctrl) {
    var ethereal = state.currentTab == tabindex_field2 || state.currentTab == tabindex_upgrades2;
    createBlueprintsDialog(undefined, undefined, ethereal);
  }

  if(key == 'u' && !shift && !ctrl && state.currentTab == tabindex_field) {
    // upgrade crop
    var did_something = false;
    did_something |= makeUpgradeCropAction(shiftCropFlexX, shiftCropFlexY);
    var upgraded = did_something;
    if(state.fern && shiftCropFlexX == state.fernx && shiftCropFlexY == state.ferny) {
      addAction({type:ACTION_FERN, x:shiftCropFlexX, y:shiftCropFlexY});
      did_something = true;
    }
    if(state.field[shiftCropFlexY]) {
      var f = state.field[shiftCropFlexY][shiftCropFlexX];
      if(f && f.index == FIELD_REMAINDER) {
        addAction({type:ACTION_PLANT, x:shiftCropFlexX, y:shiftCropFlexY, crop:crops[brassica_0], ctrlPlanted:true});
        did_something = true;
      }
      // special case: allow also refreshing watercress this way
      if(!upgraded && f && f.hasRealCrop() && f.getCrop().type == CROPTYPE_BRASSICA && f.growth < 1) {
        addAction({type:ACTION_REPLACE, x:shiftCropFlexX, y:shiftCropFlexY, crop:f.getCrop(), ctrlPlanted:true, silent:true});
        did_something = true;
      }
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
    // pick or plant crop
    var did_something = false;
    if(state.fern && shiftCropFlexX == state.fernx && shiftCropFlexY == state.ferny) {
      addAction({type:ACTION_FERN, x:shiftCropFlexX, y:shiftCropFlexY});
      did_something = true;
    }
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
            did_something = true;
          }
        }
      }
    } else if(mouseOverUpgradeCrop != null) {
      if(state.crops[mouseOverUpgradeCrop] && state.crops[mouseOverUpgradeCrop].unlocked) state.lastPlanted = mouseOverUpgradeCrop;
    }
    if(did_something) {
      update();
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
    // delete crop
    var did_something = false;
    if(state.fern && shiftCropFlexX == state.fernx && shiftCropFlexY == state.ferny) {
      addAction({type:ACTION_FERN, x:shiftCropFlexX, y:shiftCropFlexY});
      did_something = true;
    }
    if(state.field[shiftCropFlexY]) {
      var f = state.field[shiftCropFlexY][shiftCropFlexX];
      if(f) {
        if(f.hasCrop()) {
          // delete crop
          addAction({type:ACTION_DELETE, x:shiftCropFlexX, y:shiftCropFlexY});
          did_something = true;
        }
      }
    }
    if(did_something) {
      update();
    }
  }

  if(key == 'd' && !shift && !ctrl && state.currentTab == tabindex_field2) {
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
  }

  if(code == 'Escape' && !shift && !ctrl) {
    createSettingsDialog();
  }

  // these keys for prev and next fruit are chosen such that hopefully at least one set of them is reachable on any keyboard layout, even if in combination with shift if necessary
  if((key == ']' || key == '}' || key == ')' || key == '>') && !ctrl) {
    if(state.keys_brackets == 2) {
      setTabNumber(getTabNumber() + 1);
    }
    if(state.keys_brackets == 3) {
      if(state.fruit_active + 1 < state.fruit_stored.length && state.fruit_active + 1 < getNumFruitArrows()) {
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


