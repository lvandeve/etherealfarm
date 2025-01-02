/*
Ethereal Farm
Copyright (C) 2020-2025  Lode Vandevenne

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
  if(d > duration || state.lastPermaWeather != index) return perma ? 3 : 2;
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
var prev_brassica_basic_tab = -1; // idem, but for being in basic field tab
var prev_brassica_infinity_tab = -1; // idem, but for being in infinity field tab
var prev_brassica_growstage = -1; // idem, but for brassica growstage image when out of basic tab
var prev_td_challenge = -1; // idem, but for 'go' button for tower defense challenge
var prev_td_gameover = -1; // idem, but for 'go' button for tower defense challenge changing into 'game over'

var last_seen_havePerma = -1; // to update tooltips/action names when this changes

// returns the field cell of the lowest health brassica in the basic field, or undefined if none.
// returns a field with f.index == FIELD_REMAINDER if there are remainders
function getLowestBrassica() {
  var result = undefined;
  var g = 1;
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(f.index == FIELD_REMAINDER) {
        return f;
      }
      if(!f.hasCrop()) continue;
      var c = f.getCrop();
      if(c.type != CROPTYPE_BRASSICA) continue;
      if(f.growth < g) {
        g = f.growth;
        result = f;
      }
    }
  }
  return result;
}

function updateAbilitiesUI() {
  //////////////////////////////////////////////////////////////////////////////
  var havePerma = havePermaWeather();
  var havePerma_changed = (havePerma != last_seen_havePerma);
  last_seen_havePerma = havePerma;

  if(sunbutton && (!state.upgrades[upgrade_sununlock].count || havePerma_changed)) {
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

    registerAction(sunbutton.div, function(shift, ctrl) {
      if(shift) {
        state.lastPermaWeather = 0;
      } else {
        addAction({type:ACTION_ABILITY, ability:0, change_perma:!ctrl});
      }
      update();
    }, 'sun ability', {
      label_shift: (havePerma ? 'change perma weather only' : undefined),
      label_ctrl: (havePerma ? 'activate without changing perma' : undefined),
      tooltip: function() { return formatAbilityDurationTooltipText(0, 'sun ability', 'berries get a +' + getSunSeedsBoost().toPercentString() + ' production bonus and aren\'t negatively affected by winter', getSunDuration(), getSunWait())}
    });
    sunbutton.div.id = 'sun_button';
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

    if(havePerma && state.lastPermaWeather == 0 && (state.lastWeather == 0 || !isAnyWeatherActive())) {
      if(sunpermaflex.renderstyle != 3) {
        sunpermaflex.renderstyle = 3;
        sunpermaflex.div.className = 'efWeatherPerma';
        sunpermaflex.div.style.visibility = 'visible';
      }
    } else if(havePerma && state.lastPermaWeather == 0) {
      if(sunpermaflex.renderstyle != 2) {
        sunpermaflex.renderstyle = 2;
        sunpermaflex.div.className = 'efWeatherPermaOff';
        sunpermaflex.div.style.visibility = 'visible';
      }
    } else {
      if(sunpermaflex.renderstyle != 1) {
        sunpermaflex.renderstyle = 1;
        sunpermaflex.div.style.visibility = 'hidden';
      }
    }
  }


  //////////////////////////////////////////////////////////////////////////////

  if(mistbutton && (!state.upgrades[upgrade_mistunlock].count || havePerma_changed)) {
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

    registerAction(mistbutton.div, function(shift, ctrl) {
      if(shift) {
        state.lastPermaWeather = 1;
      } else {
        addAction({type:ACTION_ABILITY, ability:1, change_perma:!ctrl});
      }
      update();
    }, 'mist ability', {
      label_shift: (havePerma ? 'change perma weather only' : undefined),
      label_ctrl: (havePerma ? 'activate without changing perma' : undefined),
      tooltip: function() { return formatAbilityDurationTooltipText(1, 'mist ability', 'mushrooms produce ' + getMistSporesBoost().toPercentString() + ' more spores, consume ' + getMistSeedsBoost().rsub(1).toPercentString() + ' less seeds, and aren\'t negatively affected by winter', getMistDuration(), getMistWait())}
    });
    mistbutton.div.id = 'mist_button';
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

    if(havePerma && state.lastPermaWeather == 1 && (state.lastWeather == 1 || !isAnyWeatherActive())) {
      if(mistpermaflex.renderstyle != 3) {
        mistpermaflex.renderstyle = 3;
        mistpermaflex.div.className = 'efWeatherPerma';
        mistpermaflex.div.style.visibility = 'visible';
      }
    } else if(havePerma && state.lastPermaWeather == 1) {
      if(mistpermaflex.renderstyle != 2) {
        mistpermaflex.renderstyle = 2;
        mistpermaflex.div.className = 'efWeatherPermaOff';
        mistpermaflex.div.style.visibility = 'visible';
      }
    } else {
      if(mistpermaflex.renderstyle != 1) {
        mistpermaflex.renderstyle = 1;
        mistpermaflex.div.style.visibility = 'hidden';
      }
    }
  }


  //////////////////////////////////////////////////////////////////////////////


  if(rainbowbutton && (!state.upgrades[upgrade_rainbowunlock].count || havePerma_changed)) {
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

    registerAction(rainbowbutton.div, function(shift, ctrl) {
      if(shift) {
        state.lastPermaWeather = 2;
      } else {
        addAction({type:ACTION_ABILITY, ability:2, change_perma:!ctrl});
      }
      update();
    }, 'rainbow ability', {
      label_shift: (havePerma ? 'change perma weather only' : undefined),
      label_ctrl: (havePerma ? 'activate without changing perma' : undefined),
      tooltip: function() { return formatAbilityDurationTooltipText(2, 'rainbow ability', 'rainbow ability: flowers get a +' + getRainbowFlowerBoost().toPercentString() + ' boost and aren\'t negatively affected by winter', getRainbowDuration(), getRainbowWait())}
    });
    rainbowbutton.div.id = 'rainbow_button';
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

    if(havePerma && state.lastPermaWeather == 2 && (state.lastWeather == 2 || !isAnyWeatherActive())) {
      if(rainbowpermaflex.renderstyle != 3) {
        rainbowpermaflex.renderstyle = 3;
        rainbowpermaflex.div.className = 'efWeatherPerma';
        rainbowpermaflex.div.style.visibility = 'visible';
      }
    } else if(havePerma && state.lastPermaWeather == 2) {
      if(rainbowpermaflex.renderstyle != 2) {
        rainbowpermaflex.renderstyle = 2;
        rainbowpermaflex.div.className = 'efWeatherPermaOff';
        rainbowpermaflex.div.style.visibility = 'visible';
      }
    } else {
      if(rainbowpermaflex.renderstyle != 1) {
        rainbowpermaflex.renderstyle = 1;
        rainbowpermaflex.div.style.visibility = 'hidden';
      }
    }
  }


  if(state.challenge == challenge_stormy && !lightningicon) {
    lightningicon = addTopBarFlex(4, 5);
    styleButton0(lightningicon.div, true);

    var canvasFlex = new Flex(lightningicon, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_storm, canvas);

    addButtonAction(lightningicon.div, function() {
      var dialog = createDialog({title:'Lightning info', icon:image_storm});
      dialog.content.div.innerHTML = 'Stormy weather is active throughout this challenge and lightning will strike a crop every ' + Math.round(lightningTime / 60) + ' minutes. In addition, berries, mushrooms and flowers are half as effective.<br><br>Struck crops become ghosts. These can\'t be replanted by the automaton, but you can override multiple at once with a blueprint.';
    }, 'lightning info');
    lightningicon.div.id = 'lightning_button';

    registerTooltip(lightningicon.div, 'Stormy weather is active throughout this challenge and lightning will strike a crop every ' + Math.round(lightningTime / 60) + ' minutes. In addition, berries, mushrooms and flowers are half as effective.');
  } else if(state.challenge != challenge_stormy && lightningicon) {
    lightningicon.removeSelf(topFlex);
    lightningicon = undefined;
  }


  //////////////////////////////////////////////////////////////////////////////

  // refresh watercress button. this button becomes available once enough resources had to fully replant all watercress
  if(state.g_res.seeds.gtr(300)) {
    var basic_field_tab = (state.currentTab == tabindex_field);
    var infinity_field_tab = (state.currentTab == tabindex_field3);
    var brassica_index = infinity_field_tab ? getHighestBrassica3Had() : getHighestBrassica();
    var td_challenge = state.challenge == challenge_towerdefense;
    var td_gameover = state.towerdef.gameover;
    var growstage = 4;
    if(!basic_field_tab && !infinity_field_tab) {
      var f = getLowestBrassica();
      growstage = getGrowStageImageIndex(f);
    }
    if(!watercressbutton || prev_brassica_index != brassica_index || prev_brassica_basic_tab != basic_field_tab ||
       prev_brassica_infinity_tab != infinity_field_tab || prev_td_challenge != td_challenge || prev_td_gameover != td_gameover ||
       prev_brassica_growstage != growstage) {
      if(watercressbutton) {
        watercressbutton.clear();
        watercressbutton.removeSelf(topFlex);
      }
      prev_brassica_index = brassica_index;
      prev_brassica_basic_tab = basic_field_tab;
      prev_brassica_infinity_tab = infinity_field_tab;
      prev_td_challenge = td_challenge;
      prev_td_gameover = td_gameover;
      prev_brassica_growstage = growstage;
      var image, name, alltiers_name;
      if(infinity_field_tab) {
        image = crops3[brassica_index].image[4];
        name = crops3[brassica_index].name;
        alltiers_name = 'watercress';
      } else if(state.challenge == challenge_towerdefense) {
        var td = state.towerdef;
        image = td.gameover ? image_gameover : image_go;
      } else {
        var image_post = brassica_index == brassica_1 ? image_wasabi_post : image_watercress_post;
        image = growstage == -1 ? image_post : crops[brassica_index].image[growstage];
        name = crops[brassica_index].name;
        if(state.crops[brassica_1].known) {
          alltiers_name = 'brassica';
        } else {
          alltiers_name = name; // have not seen other brassica yet, so name it 'watercress' to make it easier to understand what is meant in the early game
        }
      }

      watercressbutton = addTopBarFlex(9, 10);
      var tooltip;
      var label = 'refresh ' + alltiers_name;
      var label_shift;
      var label_ctrl;
      if(infinity_field_tab) {
        tooltip = 'Refresh ' + alltiers_name + ': replants ' + alltiers_name + ' remainders, upgrades to next tier if possible, and else refreshes partially used up ones. Hotkey: w. With ctrl, deletes all ' + alltiers_name + '. With shift, plants the highest possible ' + alltiers_name + ' everywhere it can. If it did nothing without shift, will act like shift was pressed. ';
        tooltip += 'Use carefully: while you don\'t lose any infinity seeds from refreshing because ' + alltiers_name + ' give a refund based on their remaining lifespan, it is more efficient for income to have multiple halfway ' + alltiers_name + ' than a single fully refreshed one, unless you\'re away for a while.';
        label_shift = 'plant ' + alltiers_name + ' everywhere';
        label_ctrl = 'delete all ' + alltiers_name;
      } else if(state.challenge == challenge_towerdefense) {
        tooltip = 'Go: spawn the next wave for tower defense. With shift key, shows TD help dialog.';
        label = 'Go (spawn tower defense wave)';
        label_shift = 'Tower defense help';
        label_ctrl = undefined;
      } else {
        tooltip = 'Refresh ' + alltiers_name + ': active ' + alltiers_name + ' and remainders only. Hotkey: w. With ctrl, deletes all ' + alltiers_name + '. With shift, plants ' + name + ' everywhere it can.';
        label_shift = 'plant ' + name + ' everywhere';
        label_ctrl = 'delete all ' + alltiers_name;
      }
      styleButton0(watercressbutton.div, true);
      var canvasFlex = new Flex(watercressbutton, 0, 0, 1, 1);
      var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
      renderImage(image, canvas);

      registerAction(watercressbutton.div, function(shift, ctrl) {
          if(state.currentTab == tabindex_field3) {
            refreshWatercress3(ctrl, shift);
          } else if(state.challenge == challenge_towerdefense) {
            if(shift) {
              showRegisteredHelpDialog(44, true);
            } else {
              addAction({type:ACTION_TD_GO});
            }
          } else {
            refreshWatercress(ctrl, shift);
          }
        }, label, {
          label_shift:label_shift,
          label_ctrl:label_ctrl,
          tooltip:tooltip
        });

      watercressbutton.div.id = 'watercress_button';
    }
  } else if(watercressbutton) {
    watercressbutton.clear();
    watercressbutton.removeSelf(topFlex);
    watercressbutton = undefined;
  }

  //////////////////////////////////////////////////////////////////////////////
}

// opt_clear = delete all existing brasssica, rather than planting or refreshing any
// opt_all = plant brasssica in every single free spot, rather than only were existing brasssica or remainders are
// opt_by_automaton = mark the action as done by automaton, and also don't call update() since automaton actions are already done from within the update function.
function refreshWatercress(opt_clear, opt_all, opt_by_automaton) {
  if(opt_clear && opt_all) return;
  var replanted = false;
  var refreshed = false;
  var remcleared = false;
  var fullyplanted = false;
  var cresscost0 = crops[brassica_0].cost.seeds; // taking only cheapest one for this computation is ok, when unlocking next tiers its cost is extremely low compared to seeds you have
  var cropindex = getHighestBrassica();
  if(cropindex < 0) return;
  var seeds_available = Num(state.res.seeds);
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      var recoup = new Res();
      var cresscost = cresscost0;
      if(c && c.type == CROPTYPE_BRASSICA) {
        recoup = c.getRecoup(f).seeds;
        cresscost = cresscost.sub(recoup);
      }
      var can_afford = seeds_available.ge(cresscost);
      if(f.index == FIELD_REMAINDER) {
        if(opt_clear) {
          addAction({type:ACTION_DELETE, x:x, y:y, silent:true, by_automaton:opt_by_automaton});
          remcleared = true;
        } else if(can_afford) {
          seeds_available.subInPlace(cresscost);
          addAction({type:ACTION_PLANT, x:x, y:y, crop:crops[cropindex], ctrlPlanted:true, silent:true, by_automaton:opt_by_automaton});
          replanted = true;
        }
      } else if(c && c.type == CROPTYPE_BRASSICA && (can_afford || opt_clear)) {
        addAction({type:ACTION_DELETE, x:x, y:y, silent:true, by_automaton:opt_by_automaton});
        var c2 = c.isReal() ? c : crops[cropindex];
        if(!opt_clear) {
          seeds_available.subInPlace(cresscost);
          addAction({type:ACTION_PLANT, x:x, y:y, crop:c2, ctrlPlanted:true, silent:true, by_automaton:opt_by_automaton});
        }
        refreshed = true;
      } else if((f.index == CROPINDEX + watercress_template || f.index == CROPINDEX + watercress_ghost) && can_afford) {
        if(!opt_clear) {
          seeds_available.subInPlace(cresscost);
          addAction({type:ACTION_REPLACE, x:x, y:y, crop:crops[cropindex], ctrlPlanted:true, silent:true, by_automaton:opt_by_automaton});
          refreshed = true;
        }
      } else if(opt_all) {
        if(can_afford && (f.index == 0 || f.index == FIELD_REMAINDER || f.index == CROPINDEX + watercress_template || f.index == CROPINDEX + watercress_ghost)) {
          if(f.index == CROPINDEX + watercress_template || f.index == CROPINDEX + watercress_ghost) {
            addAction({type:ACTION_DELETE, x:x, y:y, silent:true, by_automaton:opt_by_automaton});
          }
          seeds_available.subInPlace(cresscost);
          addAction({type:ACTION_PLANT, x:x, y:y, crop:crops[cropindex], ctrlPlanted:true, silent:true, by_automaton:opt_by_automaton});
          fullyplanted = true;
        }
      }
    }
  }
  if(fullyplanted) showMessage('planting brassica');
  else if(replanted) showMessage('replanting brassica');
  else if(refreshed) showMessage(opt_clear ? 'deleting brassica' : 'refreshing brassica');
  else if(remcleared) showMessage('cleared brassica remainders');
  else if(seeds_available.lt(cresscost0)) showMessage('nothing done: only refreshes existing brassica or remainders of brassica, and requires enough resources available to plant the brassica');
  else showMessage('nothing done: only refreshes existing brassica or remainders of brassica. A second click can fill up the rest of the field with brassica, when having enough resources.');
  if(!opt_by_automaton) update();
}

// NOTE: this function works differently and has different priorities than refreshWatercress: infseeds are more important to preserve, and it's better to spread production over multiple watercress than a few "full" ones, so it doesn't refresh all to the max by default if only partially affordable
// opt_clear = delete all existing brasssica, rather than planting or refreshing any
// opt_all = plant brasssica in every single free spot, rather than only were existing brasssica or remainders are
// opt_by_automaton = mark the action as done by automaton, and also don't call update() since automaton actions are already done from within the update function.
// opt_recursed is only used to not print a message about the shfit key if this function itself called itself with opt_all without any shift key involved
function refreshWatercress3(opt_clear, opt_all, opt_by_automaton, opt_recursed) {
  if(opt_clear && opt_all) return;
  var replanted = false;
  var refreshed = false;
  var remcleared = false;
  var fullyplanted = false;
  var cropindex = getHighestBrassica3();
  if(cropindex < 0) return;
  var cropindex1 = brassica3_0; // lower tier, if relevant
  if(cropindex > brassica3_0) cropindex1 = cropindex - 1;
  var cropindex2 = brassica3_0; // even lower tier, if relevant
  if(cropindex1 > brassica3_0) cropindex2 = cropindex1 - 1;
  var seeds_available = Num(state.res.infseeds);
  var cresscost = crops3[cropindex].getBaseCost().infseeds;
  var cresscost1 = crops3[cropindex1].getBaseCost().infseeds;
  var cresscost2 = crops3[cropindex2].getBaseCost().infseeds;
  var numplanted = 0;
  var numdeleted = 0;

  var plantedhere = [];

  // give priority to remainders first: it's better to have more watercress, than that it is to refresh existing ones but not get more of them
  for(var y = 0; y < state.numh3; y++) {
    plantedhere[y] = [];
    for(var x = 0; x < state.numw3; x++) {
      plantedhere[y][x] = false;
      var can_afford = seeds_available.ge(cresscost);
      var can_afford1 = seeds_available.ge(cresscost1);
      var can_afford2 = seeds_available.ge(cresscost2);
      var f = state.field3[y][x];
      var c = f.getCrop();
      if(f.index == FIELD_REMAINDER) {
        // re-planting one on a remainder spot
        if(opt_clear) {
          addAction({type:ACTION_DELETE3, x:x, y:y, silent:true, by_automaton:opt_by_automaton});
          remcleared = true;
        } else if(can_afford || can_afford1 || can_afford2) {
          var c2 = (can_afford ? crops3[cropindex] : (can_afford1 ? crops3[cropindex1] : crops3[cropindex2]));
          var cost = (can_afford ? cresscost : (can_afford1 ? cresscost1 : cresscost2));
          seeds_available.subInPlace(cost);
          addAction({type:ACTION_PLANT3, x:x, y:y, crop:c2, ctrlPlanted:true, silent:true, by_automaton:opt_by_automaton});
          replanted = true;
          numplanted++;
        }
      } else if(c && c.type == CROPTYPE_BRASSICA && opt_clear) {
        // deleting an existing one when using clear
        addAction({type:ACTION_DELETE3, x:x, y:y, silent:true, by_automaton:opt_by_automaton});
        seeds_available.addInPlace(c.getRecoup(f).infseeds);
        numdeleted++;
      } else if(opt_all && f.index == 0) {
        // planting one on empty cell in case of all
        if((can_afford || can_afford1 || can_afford2) && (f.index == 0 || f.index == FIELD_REMAINDER)) {
          var c2 = (can_afford ? crops3[cropindex] : (can_afford1 ? crops3[cropindex1] : crops3[cropindex2]));
          var cost = (can_afford ? cresscost : (can_afford1 ? cresscost1 : cresscost2));
          seeds_available.subInPlace(cost);
          addAction({type:ACTION_PLANT3, x:x, y:y, crop:c2, ctrlPlanted:true, silent:true, by_automaton:opt_by_automaton});
          numplanted++;
          fullyplanted = true;
        }
      } else if(/*opt_all &&*/ c && c.type == CROPTYPE_BRASSICA && c.tier < crops3[cropindex].tier) {
        // also turn lower tier brassica into higher tier
        var recoup = c.getRecoup(f);
        var can_afford = seeds_available.ge(cresscost.sub(recoup.infseeds));
        var can_afford1 = seeds_available.ge(cresscost1.sub(recoup.infseeds));
        var can_afford2 = seeds_available.ge(cresscost2.sub(recoup.infseeds));
        if(can_afford || can_afford1 || can_afford2) {
          var c2 = (can_afford ? crops3[cropindex] : (can_afford1 ? crops3[cropindex1] : crops3[cropindex2]));
          var cost = (can_afford ? cresscost : (can_afford1 ? cresscost1 : cresscost2));
          if(c2.tier > c.tier) {
            seeds_available.addInPlace(recoup.infseeds);
            addAction({type:ACTION_DELETE3, x:x, y:y, silent:true, by_automaton:opt_by_automaton});
            seeds_available.subInPlace(cost);
            addAction({type:ACTION_PLANT3, x:x, y:y, crop:c2, ctrlPlanted:true, silent:true, by_automaton:opt_by_automaton});
            // the check for 0.999 is here because: numplanted is used to plant watercress in every empty spot if nothing was done. But refreshing brassica is something, and when refreshing existing old brassica, planting more may be undesired. But if they are very new (growth > 0.999), then it was clearly a double click on the refresh watercress button with the goal to plant them on the entire field
            // 0.999 works here because the lifespan of infinity brassica is a day, so 1 - 0.999 still represents several seconds
            if(f.growth < 0.999) numplanted++;
            refreshed = true;
          }
        }
      }
    }
  }
  // now refresh existing ones if seeds remaining. Also, only if no remainder plants were done already. A second buttonpress can be done to do the refresh then: one may want to refresh remainders but not existing watercress.
  // reason for not doing this with opt_all: for infinity watercress, you may really want to only add new ones and not spend infinity seeds into the refreshing of existing ones, if shift is pressed (for all), do only adding
  if(!opt_clear && !opt_all && !numplanted) {
    for(var y = 0; y < state.numh3; y++) {
      for(var x = 0; x < state.numw3; x++) {
        var f = state.field3[y][x];
        var c = f.getCrop();
        if(c && c.type == CROPTYPE_BRASSICA && c.isReal()) {
          var cost = c.getCost();
          var recoup = c.getRecoup(f);
          var can_afford = seeds_available.ge(cost.infseeds);
          if(!replanted) can_afford = seeds_available.ge(cost.infseeds.sub(recoup.infseeds));
          if(can_afford) {
            seeds_available.addInPlace(recoup.infseeds);
            addAction({type:ACTION_DELETE3, x:x, y:y, silent:true, by_automaton:opt_by_automaton});
            seeds_available.subInPlace(cost.infseeds);
            addAction({type:ACTION_PLANT3, x:x, y:y, crop:c, ctrlPlanted:true, silent:true, by_automaton:opt_by_automaton});
            // the check for 0.999 is here because: numplanted is used to plant watercress in every empty spot if nothing was done. But refreshing brassica is something, and when refreshing existing old brassica, planting more may be undesired. But if they are very new (growth > 0.999), then it was clearly a double click on the refresh watercress button with the goal to plant them on the entire field
            // 0.999 works here because the lifespan of infinity brassica is a day, so 1 - 0.999 still represents several seconds
            if(f.growth < 0.999) numplanted++;
            refreshed = true;
          }
        }
      }
    }
  }

  if(numplanted == 0 && !opt_all && !opt_clear && !opt_by_automaton) {
    // if nothing was done (e.g. there were no watercress remainders), and it's a standard (non shift, non ctrl) click, plant watercress in every free spot anyway, to have some easy way to fill up the whole field anyway even if there are no remainders
    refreshWatercress3(false, true, false, true);
    return;
  }

  if(fullyplanted) showMessage('planting infinity brassica');
  else if(replanted) showMessage('replanting infinity brassica');
  else if(numdeleted) showMessage('deleting infinity brassica');
  else if(refreshed) showMessage('refreshing infinity brassica');
  else if(remcleared) showMessage('cleared infinity brassica remainders');
  else if(seeds_available.lt(cresscost)) showMessage('nothing done: only refreshes existing infinity brassica or remainders of infinity brassica, and requires enough resources available to plant the infinity brassica');
  else if(opt_all && !opt_recursed) showMessage('nothing done: with shift, only adds new infinity brassica where possible, doesn\'t refresh existing ones');
  else showMessage('nothing done: no brassica or brassica remainders available to refresh');
  if(!opt_by_automaton) update();
}

// for choosing weather for automaton auto-weather
// calls the callback fun with 0 for sun, 1 for mist, 2 for rainbow
function createSelectWeatherDialog(fun, opt_help) {
  var dialog = createDialog({title:'Choose weather', size:DIALOG_SMALL, help:opt_help, cancelname:'cancel'});

  var flex0 = new Flex(dialog.content, 0.05, 0.3, 0.3, [0.3, 0.25]);
  var canvas0 = createCanvas('0%', '0%', '100%', '100%', flex0.div);
  renderImage(image_sun, canvas0);
  styleButton0(flex0.div);
  addButtonAction(flex0.div, function() {
    fun(0);
    closeTopDialog();
  }, 'Sun');
  flex0.div.title = 'Sun';


  var flex1 = new Flex(dialog.content, 0.35, 0.3, 0.6, [0.3, 0.25]);
  var canvas1 = createCanvas('0%', '0%', '100%', '100%', flex1.div);
  renderImage(image_mist, canvas1);
  styleButton0(flex1.div);
  addButtonAction(flex1.div, function() {
    fun(1);
    closeTopDialog();
  }, 'Mist');
  flex1.div.title = 'Mist';

  var flex2 = new Flex(dialog.content, 0.7, 0.3, 0.95, [0.3, 0.25]);
  var canvas2 = createCanvas('0%', '0%', '100%', '100%', flex2.div);
  renderImage(image_rainbow, canvas2);
  styleButton0(flex2.div);
  addButtonAction(flex2.div, function() {
    fun(2);
    closeTopDialog();
  }, 'Rainbow');
  flex2.div.title = 'Rainbow';

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

// while sometimes practical to do this at same time, ferns are too important to pick up at any time and can be in the way of a crop you actually want to delete/upgrade/plant
var keyboard_shortcuts_pick_up_ferns = false;

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

    if(numberfun == 1) {
      if(key == '1') {
        addAction({type:ACTION_ABILITY, ability:0, change_perma:true});
        update();
      }
      if(key == '2') {
        addAction({type:ACTION_ABILITY, ability:1, change_perma:true});
        update();
      }
      if(key == '3') {
        addAction({type:ACTION_ABILITY, ability:2, change_perma:true});
        update();
      }
    } else if(numberfun == 2) {
      if(number == '0') number = 10; // keyboard has the 0 after the 9 instead of before the 1
      setTabNumber(number - 1);
    } else if(numberfun == 3) {
      if(number == '0') number = 10; // keyboard has the 0 after the 9 instead of before the 1
      var index = number - 1;
      // even though it's possible and allowed to select a slot with no fruit in it, allow keyboard shortcuts only to select actual fruits, to avoid accidental keypresses setting the fruit to nothing and silently making a run harder
      if(index < state.fruit_stored.length && index < getNumFruitArrows()) {
        addAction({type:ACTION_FRUIT_ACTIVE, slot:(number - 1), silent:false, allow_empty:true});
        update();
      }
    } else if(numberfun == 4) {
      // unlike for fruits, for this one 0 truly means 0 instead of 10, for the start-only auto-action
      if(!haveBeginOfRunAutoAction()) number--; // when having the start-only auto-action, that one has visual index 0. The regular ones start at 1.
      if(number >= 0 && number < state.automaton_autoactions.length) {
        doAutoActionManually(number);
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

  if(key == 'w' && !ctrl) {
    // NOTE: ctrl for this shortcut (for deleting watercress) doesn't work, since ctrl+w closes browser tab.
    if(state.currentTab == tabindex_field3) {
      refreshWatercress3(false, /*opt_all=*/shift);
    } else if(state.challenge == challenge_towerdefense) {
      if(shift) {
        showRegisteredHelpDialog(44, true);
      } else {
        addAction({type:ACTION_TD_GO});
      }
    } else {
      refreshWatercress(false, /*opt_all=*/shift);
    }
  }

  if(key == 'b' && !shift && !ctrl) {
    if(state.currentTab == tabindex_field3) {
      // no blueprint library for infinity field
    } else if(state.currentTab == tabindex_field2 || state.currentTab == tabindex_upgrades2) {
      // ethereal field
      createBlueprintsDialog(undefined, undefined, true);
    } else {
      createBlueprintsDialog(undefined, undefined, false);
    }
  }

  if(key == 'u' && !ctrl && state.currentTab == tabindex_field) {
    var f = undefined;
    if(state.field[shiftCropFlexY]) f = state.field[shiftCropFlexY][shiftCropFlexX];
    if(f) {
      // upgrade tier
      var did_something = false;
      if(f.index != FIELD_REMAINDER) {
        did_something |= makeUpgradeCropAction(shiftCropFlexX, shiftCropFlexY, shift, false);
      }
      var upgraded = did_something;
      if(keyboard_shortcuts_pick_up_ferns && state.fern && shiftCropFlexX == state.fernx && shiftCropFlexY == state.ferny) {
        addAction({type:ACTION_FERN, x:shiftCropFlexX, y:shiftCropFlexY});
        did_something = true;
      }
      if(!did_something) {
        if(f.index == FIELD_REMAINDER) {
          addAction({type:ACTION_PLANT, x:shiftCropFlexX, y:shiftCropFlexY, crop:crops[brassica_0], ctrlPlanted:true});
          did_something = true;
        }
      }
      if(did_something) {
        update();
      }
    }
  }

  if(key == 'u' && !ctrl && state.currentTab == tabindex_field2) {
    // upgrade crop
    var did_something = false;
    did_something |= makeUpgradeCrop2Action(shiftCrop2FlexX, shiftCrop2FlexY, shift);
    if(did_something) {
      update();
    }
  }

  if(key == 'u' && !ctrl && state.currentTab == tabindex_field3) {
    var f = undefined;
    if(state.field3[shiftCrop3FlexY]) f = state.field3[shiftCrop3FlexY][shiftCrop3FlexX];
    var did_something = false;
    if(!did_something && f && f.index == FIELD_REMAINDER) {
      addAction({type:ACTION_PLANT3, x:shiftCrop3FlexX, y:shiftCrop3FlexY, crop:crops3[getHighestAffordableBrassica3()], ctrlPlanted:true});
      did_something = true;
    }
    if(!did_something && f && f.hasRealCrop() && f.getCrop().type == CROPTYPE_BRASSICA && f.growth < 1) {
      // allow also refreshing watercress this way
      var highest = getHighestAffordableBrassica3(f.getCrop().getRecoup(f));
      var highest2 = getHighestBrassica3();
      if(highest >= f.getCrop().index) {
        addAction({type:ACTION_REPLACE3, x:shiftCrop3FlexX, y:shiftCrop3FlexY, crop:crops3[highest], ctrlPlanted:true, silent:false});
        if(highest2 <= highest || f.growth < 0.9) did_something = true; // in case a higher brassica than the affordable one exists, don't mark did_something, so the message about its price can come from "upgrade tier" below
      }
    }

    // upgrade tier
    if(!did_something && f) {
      did_something |= makeUpgradeCrop3Action(shiftCrop3FlexX, shiftCrop3FlexY, shift);
    }

    if(did_something) {
      update();
    }
  }

  // NOTE: the one to handle fishes 'u', 'd', etc..., is in pondDialogShortcutFun

  if(key == 'p' && !ctrl && state.currentTab == tabindex_field) {
    // pick or plant crop
    var did_something = false;
    if(keyboard_shortcuts_pick_up_ferns && state.fern && shiftCropFlexX == state.fernx && shiftCropFlexY == state.ferny) {
      addAction({type:ACTION_FERN, x:shiftCropFlexX, y:shiftCropFlexY});
      did_something = true;
    }
    if(state.field[shiftCropFlexY]) {
      var f = state.field[shiftCropFlexY][shiftCropFlexX];
      if(f) {
        if(!shift && f.hasCrop()) {
          // pick
          state.lastPlanted = f.getCrop().index;
        } else {
          // plant
          if(state.lastPlanted >= 0 && crops[state.lastPlanted]) {
            var crop = crops[state.lastPlanted];
            if(state.challenge == challenge_towerdefense && crop.getCost().gt(state.res)) {
              crop = getHighestAffordableCropOfType(crop.type, state.res, true);
            }
            if(crop) {
              var actiontype = f.hasCrop() ? ACTION_REPLACE : ACTION_PLANT;
              addAction({type:actiontype, x:shiftCropFlexX, y:shiftCropFlexY, crop:crop, shiftPlanted:true});
              did_something = true;
            }
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

  if(key == 'p' && !ctrl && state.currentTab == tabindex_field2) {
    if(state.field2[shiftCrop2FlexY]) {
      var f = state.field2[shiftCrop2FlexY][shiftCrop2FlexX];
      if(f) {
        if(!shift && f.hasCrop(true)) {
          // pick
          state.lastPlanted2 = f.getCrop(true).index;
        } else {
          // plant
          if(state.lastPlanted2 >= 0 && crops2[state.lastPlanted2]) {
            var actiontype = f.hasCrop() ? ACTION_REPLACE2 : ACTION_PLANT2;
            addAction({type:actiontype, x:shiftCrop2FlexX, y:shiftCrop2FlexY, crop:crops2[state.lastPlanted2], shiftPlanted:true});
            update();
          }
        }
      }
    }
  }

  if(key == 'p' && !ctrl && state.currentTab == tabindex_field3) {
    if(state.field3[shiftCrop3FlexY]) {
      var f = state.field3[shiftCrop3FlexY][shiftCrop3FlexX];
      if(f) {
        if(!shift && f.hasCrop(true)) {
          // pick
          state.lastPlanted3 = f.getCrop(true).index;
        } else {
          // plant
          if(state.lastPlanted3 >= 0 && crops3[state.lastPlanted3]) {
            var actiontype = f.hasCrop() ? ACTION_REPLACE3 : ACTION_PLANT3;
            addAction({type:actiontype, x:shiftCrop3FlexX, y:shiftCrop3FlexY, crop:crops3[state.lastPlanted3], shiftPlanted:true});
            update();
          }
        }
      }
    }
  }

  if(key == 'd' && !shift && !ctrl && state.currentTab == tabindex_field) {
    // delete crop
    var did_something = false;
    if(keyboard_shortcuts_pick_up_ferns && state.fern && shiftCropFlexX == state.fernx && shiftCropFlexY == state.ferny) {
      addAction({type:ACTION_FERN, x:shiftCropFlexX, y:shiftCropFlexY});
      did_something = true;
    }
    if(state.field[shiftCropFlexY]) {
      var f = state.field[shiftCropFlexY][shiftCropFlexX];
      if(f) {
        if(f.hasCrop(true) || f.index == FIELD_REMAINDER) {
          if(state.challenge == challenge_towerdefense && state.towerdef.started) {
            makeDowngradeCropAction(shiftCropFlexX, shiftCropFlexY);
          } else {
            addAction({type:ACTION_DELETE, x:shiftCropFlexX, y:shiftCropFlexY});
          }
          did_something = true;
        }
      }
    }
    if(did_something) {
      update();
    }
  }

  // downgrade in basic field
  // even though this shortcut is only rarely useful in the basic field (plus, automaton will upgrade the crop again unless turned off), supporting the shortcut is consistent with the ethereal and infinity field and prevents thinking the shortcut doesn't exist in those other fields, where it is useful
  if(key == 'd' && shift && !ctrl && state.currentTab == tabindex_field) {
    var did_something = false;
    if(keyboard_shortcuts_pick_up_ferns && state.fern && shiftCropFlexX == state.fernx && shiftCropFlexY == state.ferny) {
      addAction({type:ACTION_FERN, x:shiftCropFlexX, y:shiftCropFlexY});
      did_something = true;
    }
    if(state.field[shiftCropFlexY]) {
      var f = state.field[shiftCropFlexY][shiftCropFlexX];
      if(f) {
        if(f.hasCrop()) {
          makeDowngradeCropAction(shiftCropFlexX, shiftCropFlexY);
          did_something = true;
        }
      }
    }
    if(did_something) {
      update();
    }
  }

  // delete in field2
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

  // downgrade in field2
  if(key == 'd' && shift && !ctrl && state.currentTab == tabindex_field2) {
    if(state.field2[shiftCrop2FlexY]) {
      var f = state.field2[shiftCrop2FlexY][shiftCrop2FlexX];
      if(f) {
        if(f.hasCrop()) {
          makeDowngradeCrop2Action(shiftCrop2FlexX, shiftCrop2FlexY);
          update();
        }
      }
    }
  }

  if(key == 'd' && !shift && !ctrl && state.currentTab == tabindex_field3) {
    if(state.field3[shiftCrop3FlexY]) {
      var f = state.field3[shiftCrop3FlexY][shiftCrop3FlexX];
      if(f) {
        if(f.hasCrop() || f.index == FIELD_REMAINDER) {
          // delete crop
          addAction({type:ACTION_DELETE3, x:shiftCrop3FlexX, y:shiftCrop3FlexY});
          update();
        }
      }
    }
  }

  // downgrade in field3
  if(key == 'd' && shift && !ctrl && state.currentTab == tabindex_field3) {
    if(state.field3[shiftCrop3FlexY]) {
      var f = state.field3[shiftCrop3FlexY][shiftCrop3FlexX];
      if(f) {
        if(f.hasCrop()) {
          makeDowngradeCrop3Action(shiftCrop3FlexX, shiftCrop3FlexY);
          update();
        }
      }
    }
  }

  if(key == 'f' && !shift && !ctrl) {
    setTab(tabindex_field);
  }

  if(key == 'e' && !shift && !ctrl) {
    if(state.g_numresets > 0) setTab(tabindex_field2);
  }

  if(key == 'i' && !shift && !ctrl) {
    if(haveInfinityField() > 0) setTab(tabindex_field3);
  }

  if(key == 'z' && !shift && ctrl) {
    loadUndo();
    update();
  }

  if(code == 'Escape' && !shift && !ctrl) {
    createSettingsDialog();
  }

  // these keys for prev and next fruit are chosen such that hopefully at least one set of them is reachable on any keyboard layout, even if in combination with shift if necessary
  if((key == ']' || key == '}' || key == ')' || key == '>') && !ctrl) {
    if(state.keys_brackets == 2) {
      var newtab = getTabNumber() + 1;
      if(newtab >= numtabs) newtab = 0;
      setTabNumber(newtab);
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
      var newtab = getTabNumber() - 1;
      if(newtab < 0) newtab = numtabs - 1;
      setTabNumber(newtab);
    }
    if(state.keys_brackets == 3) {
      if(state.fruit_active > 0) {
        addAction({type:ACTION_FRUIT_ACTIVE, slot:state.fruit_active - 1});
        update();
      }
    }
  }
});


