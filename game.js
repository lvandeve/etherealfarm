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


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var state = undefined;

initUIGlobal();

var savegame_recovery_situation = false; // if true, makes it less likely to autosave, to ensure local storage preserves a valid older save

function saveDailyCycle(e) {
  if(!window_unloading) {
    var day_cycle = (Math.floor(util.getTime() / (24 * 3600)) % 3);
    if(day_cycle == 0) util.setLocalStorage(e, localstorageName_daily1);
    if(day_cycle == 1) util.setLocalStorage(e, localstorageName_daily2);
    if(day_cycle == 2) util.setLocalStorage(e, localstorageName_daily3);
  }
}

// saves to local storage
function saveNow(onsuccess) {
  save(state, function(s) {
    util.setLocalStorage(s, localstorageName);
    saveDailyCycle(s);
    if(onsuccess) onsuccess(s);
  });
}

function loadFromLocalStorage(onsuccess, onfail) {
  var e = util.getLocalStorage(localstorageName);
  if(!e) {
    e = util.getLocalStorage(localstorageName_undo);
  }
  if(!e) {
    if(onfail) onfail(undefined); // there was no save in local storage
    return;
  }
  var prev_version = version;
  if(e.length > 4 && isBase64(e)) {
    prev_version = 4096 * fromBase64[e[2]] + 64 * fromBase64[e[3]] + fromBase64[e[4]];
    // NOTE: if there is a bug, and prev_version is a bad version with bug, then do NOT overwrite if prev_version is that bad one
    if(prev_version < version) {
      var prev2 = util.getLocalStorage(localstorageName_prev_version);
      if(prev2) {
        util.setLocalStorage(prev2, localstorageName_prev_version2);
      }
      util.setLocalStorage(e, localstorageName_prev_version);
    }
  }
  saveDailyCycle(e);
  load(e, function(state) {
    initUI();
    update();
    onsuccess(state);
    // save a "last successful load" save for recovery purposes, if the game has any substantial time duration (at least 3 days)
    var save_last_known_good = true;
    var duration = state.g_numticks;
    var lastsuccess = util.getLocalStorage(localstorageName_success);
    // only overwrite existing last known save if it has at least as much ticks (indicated in character 5 of the save)
    if(!lastsuccess || !lastsuccess.length || fromBase64[e[5]] >= fromBase64[lastsuccess[5]]) {
      util.setLocalStorage(e, localstorageName_success);
    }
  }, function(state) {
    onfail(state);
    if(e.length > 22 && isBase64(e) && e[0] == 'E' && e[1] == 'F') {
      // save a recovery save in case something went wrong, but only if there isn't already one. Only some specific later actions like importing a save and hard reset will clear this
      var has_recovery = !!util.getLocalStorage(localstorageName_recover);
      if(!has_recovery) util.setLocalStorage(e, localstorageName_recover);

      var saves = getRecoverySaves();
      for(var i = 0; i < saves.length; i++) {
        showMessage(saves[i][0] + ' : ' + saves[i][1], C_ERROR, 0, 0);
      }
      if(saves.length == 0) {
        showMessage('current: ' + e, C_ERROR, 0, 0);
      }
      var text = loadlocalstoragefailedmessage;
      if(state && state.error_reason == 4) text += ' ' + loadfailreason_format;
      if(state && state.error_reason == 5) text += ' ' + loadfailreason_decompression;
      if(state && state.error_reason == 6) text += ' ' + loadfailreason_checksum;
      if(state && state.error_reason == 7) text += ' ' + loadfailreason_toonew;
      if(state && state.error_reason == 8) text += ' ' + loadfailreason_tooold;

      showMessage(text, C_ERROR, 0, 0);
      showSavegameRecoveryDialog(true);

      savegame_recovery_situation = true;
    }
  });
}



// Why there are so many recovery saves: because different systems may break in different ways, hopefully at least one still has a valid recent enough save but not too recent to have the breakage
// This mostly protects against loss of progress due to accidental bugs of new game versions that break old saves. This cannot recover anything if local storage was deleted.
function getRecoverySaves() {
  var result = [];
  var prev = util.getLocalStorage(localstorageName_prev_version);
  if(prev) {
    result.push(['last from older game version', prev]);
  }
  var prev2 = util.getLocalStorage(localstorageName_prev_version2);
  if(prev2) {
    result.push(['last from second-older game version', prev2]);
  }
  var manual = util.getLocalStorage(localstorageName_manual);
  if(manual) {
    result.push(['last manual save', manual]);
  }
  var transcend = util.getLocalStorage(localstorageName_transcend);
  if(transcend) {
    result.push(['last transcend', transcend]);
  }
  var day;
  day = util.getLocalStorage(localstorageName_daily1);
  if(day) {
    result.push(['daily cycle A', day]);
  }
  day = util.getLocalStorage(localstorageName_daily2);
  if(day) {
    result.push(['daily cycle B', day]);
  }
  day = util.getLocalStorage(localstorageName_daily3);
  if(day) {
    result.push(['daily cycle C', day]);
  }
  var undo = util.getLocalStorage(localstorageName_undo);
  if(undo) {
    result.push(['last save for undo feature', undo]);
  }
  var lastsuccess = util.getLocalStorage(localstorageName_success);
  if(lastsuccess) {
    result.push(['last known good', lastsuccess]);
  }
  var recovery = util.getLocalStorage(localstorageName_recover);
  if(recovery) {
    result.push(['last known attempted', recovery]);
  }
  var current = util.getLocalStorage(localstorageName);
  if(lastsuccess) {
    result.push(['last', current]);
  }
  return result;
}

// the ones that should be reset when loading a save
function resetGlobalStateVars(opt_state) {
  savegame_recovery_situation = false;
  prefield = [];
  prev_season = undefined;
  large_time_delta = false;
  large_time_delta_time = 0;
  large_time_delta_res = opt_state ? Res(opt_state.res) : Res();
  global_season_changes = 0;
  global_tree_levelups = 0;
  helpNeverAgainLocal = {};
}

function hardReset() {
  showMessage('Hard reset performed, everything reset', C_META, 0, 0);
  util.clearLocalStorage(localstorageName);
  util.clearLocalStorage(localstorageName_recover);
  util.clearLocalStorage(localstorageName_success);
  util.clearLocalStorage(localstorageName_prev_version);
  util.clearLocalStorage(localstorageName_prev_version2);
  util.clearLocalStorage(localstorageName_undo);
  util.clearLocalStorage(localstorageName_manual);
  util.clearLocalStorage(localstorageName_transcend);
  util.clearLocalStorage(localstorageName_daily1);
  util.clearLocalStorage(localstorageName_daily2);
  util.clearLocalStorage(localstorageName_daily3);
  postload(createInitialState());

  removeChallengeChip();
  removeMedalChip();
  removeHelpChip();

  undoSave = '';
  lastUndoSaveTime = 0;

  resetGlobalStateVars();

  initUI();
  update();
}

// use at the start of challenges that only have some specific of their own upgrades, ...
function lockAllUpgrades() {
  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = state.upgrades[registered_upgrades[i]];
    u.unlocked = false;
  }
}

// unlock any templates that are available, or lock them if not
function unlockTemplates() {

  var wither_incomplete = state.challenge == challenge_wither && state.challenges[challenge_wither].completed < 3;
  if(haveAutomaton() && state.challenge != challenge_nodelete && !wither_incomplete && state.challenge != challenge_bees) {
    state.crops[watercress_template].unlocked = true;
    state.crops[berry_template].unlocked = true;
    state.crops[mush_template].unlocked = true;
    state.crops[flower_template].unlocked = true;
    state.crops[nettle_template].unlocked = true;
    if(state.challenges[challenge_bees].completed) state.crops[bee_template].unlocked = true;
    var no_twigs_challenge = !!state.challenge && !challenges[state.challenge].allowstwigs;
    var no_nuts_challenge = !!state.challenge && !challenges[state.challenge].allowsnuts;
    if(state.upgrades2[upgrade2_mistletoe].count && !no_twigs_challenge) state.crops[mistletoe_template].unlocked = true;

    if(state.challenge == challenge_bees) {
      state.crops[bee_template].unlocked = false;
      state.crops[nettle_template].unlocked = false;
    }

    if(!no_nuts_challenge) state.crops[nut_template].unlocked = haveSquirrel();
  } else {
    // templates disabled in bee challenge because: no templates available for some challenge-specific crops, could be confusing. note also that the beehive template is not for the bee challenge's special beehive.
    // templates disabled in nodelete challenge because: not a strong reason actually and the code to allow deleting templates in nodelete challenge is even implemented, but by default templates cause automaton to upgrade them, and that would cause nodelete challenge to fail early since the cropss ey cannot be upgraded to a better type
    // templates disabled in wither challenge in the beginning because: this challenge should be hard like that on purpose, plus all its corps wither and leave behind template-less field cells all the time anyway
    state.crops[watercress_template].unlocked = false;
    state.crops[berry_template].unlocked = false;
    state.crops[mush_template].unlocked = false;
    state.crops[flower_template].unlocked = false;
    state.crops[nettle_template].unlocked = false;
    state.crops[bee_template].unlocked = false;
    state.crops[mistletoe_template].unlocked = false;
    state.crops[nut_template].unlocked = false;
  }

  if(state.crops2[automaton2_0].unlocked) {
    state.crops2[berry2_template].unlocked = true;
    state.crops2[mush2_template].unlocked = true;
    state.crops2[flower2_template].unlocked = true;
    state.crops2[lotus2_template].unlocked = true;
    state.crops2[fern2_template].unlocked = true;
    state.crops2[nettle2_template].unlocked = (state.crops2[nettle2_0].unlocked);
    state.crops2[automaton2_template].unlocked = (state.crops2[automaton2_0].unlocked);
    state.crops2[squirrel2_template].unlocked = (state.crops2[squirrel2_0].unlocked);
    state.crops2[bee2_template].unlocked = (state.crops2[bee2_0].unlocked);
  } else {
    state.crops2[berry2_template].unlocked = false;
    state.crops2[mush2_template].unlocked = false;
    state.crops2[flower2_template].unlocked = false;
    state.crops2[lotus2_template].unlocked = false;
    state.crops2[fern2_template].unlocked = false;
    state.crops2[nettle2_template].unlocked = false;
    state.crops2[automaton2_template].unlocked = false;
    state.crops2[squirrel2_template].unlocked = false;
    state.crops2[bee2_template].unlocked = false;
  }
}

// set up everything for a challenge after softreset
function startChallenge(challenge_id) {
  if(!challenge_id) return; // nothing to do

  if(challenge_id == challenge_bees) {
    lockAllUpgrades();

    state.crops[challengecrop_0].unlocked = true;
    state.crops[challengecrop_1].unlocked = true;
    state.crops[challengecrop_2].unlocked = true;
    state.crops[challengeflower_0].unlocked = true;
    state.crops[mush_0].unlocked = true;
    state.crops[berry_0].unlocked = true;

    state.upgrades[challengecropmul_0].unlocked = true;
    state.upgrades[challengecropmul_1].unlocked = true;
    state.upgrades[challengecropmul_2].unlocked = true;

    // add the watercress upgrade as well so one isn't forced to refresh it every minute during this challenge
    state.upgrades[brassicamul_0].unlocked = true;
  }

  if(challenge_id == challenge_rocks || challenge_id == challenge_thistle) {
    // use a fixed seed for the random, which changes every 3 hours, and is the same for all players (depends only on the time)
    // changing the seed only every 4 hours ensures you can't quickly restart the challenge to find a good pattern
    // making it the same for everyone makes it fair
    var timeseed = Math.floor(util.getTime() / (3600 * 3));
    var seed;
    if(challenge_id == challenge_rocks) {
      seed = xor48(timeseed, 0x726f636b73); // ascii for "rocks"
    } else {
      seed = xor48(timeseed, 0x5555555555);
    }
    var num_rocks = Math.floor(state.numw * state.numh / 3);
    var array = [];
    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f = state.field[y][x];
        if(f.index != 0) continue;
        array.push([x, y]);
      }
    }
    for(var i = 0; i < num_rocks; i++) {
      if(array.length == 0) break;
      var roll = getRandomRoll(seed);
      seed = roll[0];
      var r = Math.floor(roll[1] * array.length);
      var x = array[r][0];
      var y = array[r][1];
      array.splice(r, 1);
      if(challenge_id == challenge_rocks) {
        state.field[y][x].index = FIELD_ROCK;
      } else {
        state.field[y][x].index = (CROPINDEX + nettle_1);
        state.field[y][x].growth = 1;
      }
    }
  }



  if(challenge_id == challenge_rockier) {
    // similar to challenge_rocks, but more rocks
    // here the layouts rotate around each time you complete the challenge
    var layout_index = state.challenges[challenge_rockier].num_completed % rockier_layouts.length;
    var layout = rockier_layouts[layout_index];
    var array = [];
    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f = state.field[y][x];
        if(f.index != 0) continue;
        f.index = FIELD_ROCK;
      }
    }
    var treex0 = Math.floor((state.numw - 1) / 2);
    var treey0 = Math.floor(state.numh / 2);
    var x0 = treex0 - 2;
    var y0 = treey0 - 2;
    for(var y = 0; y < 5; y++) {
      for(var x = 0; x < 5; x++) {
        var c = layout[y * 5 + x];
        if(c != '1') continue;
        var f = state.field[y0 + y][x0 + x];
        if(f.index != FIELD_ROCK) continue;
        f.index = 0;
      }
    }
  }

  if(challenge_id == challenge_blackberry) {
    lockAllUpgrades();

    state.crops[brassica_0].unlocked = true;
    state.crops[mush_0].unlocked = true;
    state.crops[berry_0].unlocked = true;
    state.crops[flower_0].unlocked = true;
    state.crops[mistletoe_0].unlocked = true;
    state.crops[nettle_0].unlocked = true;

    state.upgrades[brassicamul_0].unlocked = true;
    state.upgrades[mushmul_0].unlocked = true;
    state.upgrades[berrymul_0].unlocked = true;
    state.upgrades[flowermul_0].unlocked = true;
    state.upgrades[nettlemul_0].unlocked = true;

    if(state.challenges[challenge_bees].completed) {
      state.crops[bee_0].unlocked = true;
      state.upgrades[beemul_0].unlocked = true;
    }
  }
}

// get the field size to have after a reset
function getNewFieldSize() {
  if(state.upgrades2[upgrade2_field7x7].count) {
    return [7, 7];
  } else if(state.upgrades2[upgrade2_field7x6].count) {
    return [7, 6];
  } else if(state.upgrades2[upgrade2_field6x6].count) {
    return [6, 6];
  }
  return [5, 5];
}

function softReset(opt_challenge) {
  save(util.clone(state), function(s) {
    util.setLocalStorage(s, localstorageName_transcend);
  });
  util.clearLocalStorage(localstorageName_recover); // if there was a recovery save, delete it now assuming that transcending means all about the game is going fine
  savegame_recovery_situation = false;

  if(state.challenge) {
    var c = challenges[state.challenge];
    var c2 = state.challenges[state.challenge];
    c2.maxlevel = Math.max(state.treelevel, c2.maxlevel);
    if(c.cycling) {
      var cycle = c.getCurrentCycle();
      c2.maxlevels[cycle] = Math.max(state.treelevel, c2.maxlevels[cycle]);
    }
    if(state.treelevel >= c.targetlevel[0]) {
      var i = c2.completed;
      // whether a next stage of the challenge completed. Note, you can only complete one stage at the time, even if you immediately reach the target level of the highest stage, you only get 1 stage for now
      if(i < c.targetlevel.length && state.treelevel >= c.targetlevel[i]) {
        if(c.targetlevel.length > 1) {
          showMessage('Completed the next stage of the challenge and got reward: ' + c.rewarddescription[i], C_UNLOCK, 38658833);
        } else {
          showMessage('Completed the challenge and got reward: ' + c.rewarddescription[i], C_UNLOCK, 38658833);
        }
        c.rewardfun[i]();
        c2.completed++;
      }
      c2.num_completed++;
    }
    if(c.targetlevel.length > 1 && c2.completed >= c.targetlevel.length) {
      c2.num_completed2++;
    }
    // even for the "attempt" counter, do not count attempts that don't even level up the tree, those are counted as state.g_numresets_challenge_0 instead
    if(state.treelevel) c2.num++;
  }

  state.amberprod = false;

  var resin_no_ferns = getUpcomingResin();
  var resin = getUpcomingResinIncludingFerns();

  var do_fruit = true; // sacrifice the fruits even if not above transcension level (e.g. when resetting a challenge)

  // if false, still sets the upcoming resin to 0!
  var do_resin = state.treelevel >= min_transcension_level;
  if(resin.eqr(0)) do_resin = false;
  if(state.challenge && !challenges[state.challenge].allowsresin) do_resin = false;


  var twigs = getUpcomingTwigs();
  var do_twigs = state.treelevel >= min_transcension_level;
  if(twigs.eqr(0)) do_twigs = false;
  if(state.challenge && !challenges[state.challenge].allowstwigs) do_twigs = false;

  var essence = Num(0);
  var message = '';

  if(do_fruit) {
    essence = getUpcomingFruitEssence();
  }
  if(state.challenge) {
    message += 'Starting new run';
  } else {
    message += 'Transcended';
  }
  if(do_resin) {
    message += '. Got resin: ' + resin.toString();
  }
  if(do_twigs) {
    message += '. Got twigs: ' + twigs.toString();
  }
  if(do_fruit) {
    if(state.fruit_sacr.length) message += '. Sacrificed ' + state.fruit_sacr.length + ' fruits and got ' + essence.toString();
  }

  showMessage(message, C_ETHEREAL, 669840411);
  if(state.g_numresets == 0) {
    showRegisteredHelpDialog(1);
  }

  // state.c_runtime = util.getTime() - state.c_starttime; // state.c_runtime was computed by incrementing each delta, but this should be numerically more precise

  // first ethereal crops
  state.crops2[berry2_0].unlocked = true;
  state.crops2[mush2_0].unlocked = true;
  state.crops2[flower2_0].unlocked = true;
  state.crops2[fern2_0].unlocked = true;
  state.crops2[lotus2_0].unlocked = true;

  // todo: remove this? softReset is called during the update() function, that one already manages the time
  state.time = util.getTime();
  state.prevtime = state.time;


  state.res.resin.addInPlace(resin);
  state.g_res.resin.addInPlace(resin);
  state.c_res.resin.addInPlace(resin);
  state.g_resin_from_transcends.addInPlace(resin);
  state.resin = Num(0); // future resin from next tree
  state.fernresin = new Res(); // future resin from next ferns


  state.res.twigs.addInPlace(twigs);
  state.g_res.twigs.addInPlace(twigs);
  state.c_res.twigs.addInPlace(twigs);
  state.twigs = Num(0);

  // fruits
  if(do_fruit) {
    state.res.addInPlace(essence);
    state.g_res.addInPlace(essence);
    state.c_res.addInPlace(essence);
    state.fruit_sacr = [];
    state.fruit_seen = true; // any new fruits are likely sacrificed now, no need to indicate fruit tab in red anymore
  }

  // this one should not include the resin from ferns
  var res_no_fernresin = new Res(state.c_res);
  res_no_fernresin.resin = resin_no_ferns;
  state.g_max_res_earned = Res.max(state.g_max_res_earned, res_no_fernresin);


  if(state.treelevel > 0) {
    var addStat = function(array, stat) {
      array.push(stat);
      var maxlen = 50;
      if(array.length > maxlen) array.splice(0, array.length - maxlen);
    };

    addStat(state.reset_stats_level, state.treelevel);
    addStat(state.reset_stats_level2, state.treelevel2);
    // divided through 300: best precision 5 minutes, and even lower when saved for larger times
    addStat(state.reset_stats_time, (state.time - state.c_starttime) / 300);
    addStat(state.reset_stats_total_resin, state.g_res.resin);
    addStat(state.reset_stats_resin, resin);
    addStat(state.reset_stats_twigs, twigs);
    addStat(state.reset_stats_challenge, state.challenge);
  }

  // The previous run stats are to compare regular runs with previous ones, so don't count it in case of a challenge
  if(!state.challenge) {
    state.p_starttime = state.c_starttime;
    state.p_runtime = state.c_runtime;
    state.p_numticks = state.c_numticks;
    state.p_res = state.c_res;
    state.p_max_res = state.c_max_res;
    state.p_max_prod = state.c_max_prod;
    state.p_numferns = state.c_numferns;
    state.p_numplantedbrassica = state.c_numplantedbrassica;
    state.p_numplanted = state.c_numplanted;
    state.p_numfullgrown = state.c_numfullgrown;
    state.p_numunplanted = state.c_numunplanted;
    state.p_numupgrades = state.c_numupgrades;
    state.p_numupgrades_unlocked = state.c_numupgrades_unlocked;
    state.p_numabilities = state.c_numabilities;
    state.p_numfruits = state.c_numfruits;
    state.p_numfruitupgrades = state.c_numfruitupgrades;
    state.p_numautoupgrades = state.c_numautoupgrades;
    state.p_numautoplant = state.c_numautoplant;
    state.p_numautodelete = state.c_numautodelete;
    state.p_numfused = state.c_numfused;
    state.p_res_hr_best = state.c_res_hr_best;
    state.p_res_hr_at = state.c_res_hr_at;
    state.p_res_hr_at_time = state.c_res_hr_at_time;
    state.p_pausetime = state.c_pausetime;

    state.p_treelevel = state.treelevel;
  }

  var runtime2 = state.time - state.c_starttime;

  // this type of statistics, too, is only for regular runs
  if(!state.challenge) {
    if(state.g_slowestrun == 0) {
      state.g_fastestrun = state.c_runtime;
      state.g_slowestrun = state.c_runtime;
      state.g_fastestrun2 = runtime2;
      state.g_slowestrun2 = runtime2;
    } else {
      state.g_fastestrun = Math.min(state.g_fastestrun, state.c_runtime);
      state.g_slowestrun = Math.max(state.g_slowestrun, state.c_runtime);
      state.g_fastestrun2 = Math.min(state.g_fastestrun2, runtime2);
      state.g_slowestrun2 = Math.max(state.g_slowestrun2, runtime2);
    }
  }

  state.c_starttime = state.time;
  state.c_runtime = 0;
  state.c_numticks = 0;
  state.c_res = Res();
  state.c_max_res = Res();
  state.c_max_prod = Res();
  state.c_numferns = 0;
  state.c_numplantedbrassica = 0;
  state.c_numplanted = 0;
  state.c_numfullgrown = 0;
  state.c_numunplanted = 0;
  state.c_numupgrades = 0;
  state.c_numupgrades_unlocked = 0;
  state.c_numabilities = 0;
  state.c_numfruits = 0;
  state.c_numfruitupgrades = 0;
  state.c_numautoupgrades = 0;
  state.c_numautoplant = 0;
  state.c_numautodelete = 0;
  state.c_numfused = 0;
  state.c_res_hr_best = Res();
  state.c_res_hr_at = Res();
  state.c_res_hr_at_time = Res();
  state.c_pausetime = 0;

  // this too only for non-challenges, highest tree level of challenge is already stored in the challenes themselves
  if(!state.challenge) {
    state.g_treelevel = Math.max(state.treelevel, state.g_treelevel);
    state.g_p_treelevel = Math.max(state.treelevel, state.g_p_treelevel);
  }

  if(state.challenge) {
    if(state.treelevel) {
      state.g_numresets_challenge++;
      if(state.treelevel >= 10) state.g_numresets_challenge_10++;
    } else {
      state.g_numresets_challenge_0++;
    }
  } else {
    state.g_numresets++;
  }

  state.res.seeds = Num(0);
  state.res.spores = Num(0);


  var starterResources = getStarterResources();
  state.res.addInPlace(starterResources);
  state.g_res.addInPlace(starterResources);
  state.c_res.addInPlace(starterResources);

  var fieldsize = getNewFieldSize();
  if(fieldsize[0] != state.numw || fieldsize[1] != state.numh) {
    state.numw = fieldsize[0];
    state.numh = fieldsize[1];
    initFieldUI();
  }

  clearField(state);

  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      state.field2[y][x].justplanted = false;
    }
  }

  state.treelevel = 0;

  state.fernres = new Res();
  state.fern = false;
  state.lastFernTime = state.time;

  gain = new Res();

  state.misttime = 0;
  state.suntime = 0;
  state.rainbowtime = 0;
  //state.lasttreeleveluptime = state.time; // commented out: this is preserved across runs now for amber computation

  state.crops = [];
  for(var i = 0; i < registered_crops.length; i++) {
    state.crops[registered_crops[i]] = new CropState();
  }
  state.crops[brassica_0].unlocked = true;

  for(var i = 0; i < registered_upgrades.length; i++) {
    if(!state.upgrades[registered_upgrades[i]]) state.upgrades[registered_upgrades[i]] = new UpgradeState();
    var u2 = state.upgrades[registered_upgrades[i]];
    u2.seen = false;
    u2.unlocked = false;
    u2.count = 0;
  }

  if(state.upgrades2[upgrade2_blackberrysecret].count) {
    applyBlackberrySecret();
  }

  state.challenge = opt_challenge || 0;
  if(opt_challenge) {
    startChallenge(opt_challenge);
  }

  state.lastPlanted = -1;
  //state.lastPlanted2 = -1;
  if(state.crops[berry_0].unlocked) {
    state.lastPlanted = berry_0;
  } else if(state.crops[brassica_0].unlocked) {
    state.lastPlanted = brassica_0;
  }

  state.resinfruittime = 0;
  state.twigsfruittime = 0;

  // after a transcend, it's acceptable to undo the penalty of negative time, but keep some of it. This avoid extremely long time penalties due to a clock mishap.
  if(state.negative_time > 3600) state.negative_time = 3600;

  setTab(0);

  removeChallengeChip();

  removeAllDropdownElements();

  initInfoUI();
}

// the divs and other non-saved-state info of a field cell
function CellDiv() {
  this.div = undefined;
  this.progress = undefined;
}


// every button click adds an action here, rather than do its effect directly
// reason: every single change must be checked and happen in the update
// function, don't want it done directly from UI button presses
// action object is: {type:action type, ... (other paramters depend on action)}
var actions = [];

var action_index = 0;
var ACTION_FERN = action_index++;
var ACTION_PRESENT = action_index++; // e.g. holiday event present
var ACTION_PLANT = action_index++;
var ACTION_DELETE = action_index++; //un-plant
var ACTION_REPLACE = action_index++; //same as delete+plant, in one go (prevents hving situation where plant gets deleted but then not having enough resources to plant the other one)
var ACTION_UPGRADE = action_index++;
var ACTION_PLANT2 = action_index++;
var ACTION_DELETE2 = action_index++;
var ACTION_REPLACE2 = action_index++;
var ACTION_UPGRADE2 = action_index++;
var ACTION_ABILITY = action_index++;
var ACTION_TRANSCEND = action_index++; // also includes starting a challenge
var ACTION_FRUIT_SLOT = action_index++; // move fruit to other slot
var ACTION_FRUIT_ACTIVE = action_index++; // select active fruit
var ACTION_FRUIT_LEVEL = action_index++; // level up a fruit ability
var ACTION_FRUIT_REORDER = action_index++; // reorder an ability
var ACTION_FRUIT_FUSE = action_index++; // fuse two fruits together
var ACTION_PLANT_BLUEPRINT = action_index++;
var ACTION_UPGRADE3 = action_index++; // squirrel upgrade
var ACTION_RESPEC3 = action_index++; // respec squirrel upgrades
var ACTION_AMBER = action_index++; // amber effects
var ACTION_TOGGLE_AUTOMATON = action_index++; // action object is {toggle:what, on:boolean or int, fun:optional function to call after switching}, and what is: 0: entire automaton, 1: auto upgrades, 2: auto planting

var lastSaveTime = util.getTime();

var lastnonpausetime = 0;


var undoSave = '';
var lastUndoSaveTime = 0;
var minUndoTime = 10;
var maxUndoTime = 3600;

function clearUndo() {
  undoSave = '';
  lastUndoSaveTime = 0;
}

function storeUndo(state) {
  lastUndoSaveTime = util.getTime();
  save(state, function(s) {
    //console.log('undo saved');
    undoSave = s;
    util.setLocalStorage(undoSave, localstorageName_undo);
  }, function() {
    undoSave = '';
  });
}

function loadUndo() {
  if(lastUndoSaveTime != 0 && state.time - lastUndoSaveTime > maxUndoTime) {
    // prevent undoing something from super long ago, even though it may seem like a cool feature, it can be confusing and even damaging. Use export save to do long term things.
    clearUndo();
  }
  if(undoSave == '' || !undoSave) {
    showMessage('No undo present. Undo is stored when performing an action.', C_INVALID, 0, 0);
    return;
  }
  save(state, function(redoSave) {
    load(undoSave, function(state) {
      showMessage('Undone', C_UNDO, 217654408);
      initUI();
      update();
      undoSave = redoSave;
      util.setLocalStorage(undoSave, localstorageName_undo);
    }, function(state) {
      showMessage('Not undone, failed to load undo-save', C_ERROR, 0, 0);
    });
  }, function() {
    showMessage('Not undone, failed to save redo save', C_ERROR, 0, 0);
  });

  removeChallengeChip();
  removeMedalChip();
  removeHelpChip();

  lastUndoSaveTime = 0; // now ensure next action saves undo again, pressing undo is a break in the action sequence, let the next action save so that pressing undo again brings us back to thie same undo-result-state
}


// returns by preference a random empty field spot, if too much spots filled, then
// randomly any spot
function getRandomPreferablyEmptyFieldSpot() {
  var num = 0;
  num = state.numemptyfields;
  if(num < 2) {
    var x = Math.floor(Math.random() * state.numw);
    var y = Math.floor(Math.random() * state.numh);
    var f = state.field[y][x];
    var maxruns = 4;
    for(;;) {
      if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) x = (x + 1) % state.numw;
      if(state.fern && x == state.fernx && y == state.ferny) y = (y + 1) % state.numh;
      if(state.present && x == state.presentx && y == state.presenty) y = (y + 1) % state.numh;
      if(maxruns-- < 0) break; // just in case there are e.g. tons of tree tops for some reason
    }
    return [x, y];
  }
  if(state.fern) {
    var f = state.field[state.ferny][state.fernx];
    if(f.index == 0 || f.index == FIELD_REMAINDER) num--;
  }
  if(state.present) {
    var f = state.field[state.presenty][state.presentx];
    if(f.index == 0 || f.index == FIELD_REMAINDER) num--;
  }
  var r = Math.floor(Math.random() * num);
  var i = 0;
  if(state.fern && state.field[state.ferny][state.fernx] && y == state.ferny) y = (y + 1) % state.numh;
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      var already_fern = state.fern && x == state.fernx && y == state.ferny;
      var already_present = state.present && x == state.presentx && y == state.presenty;
      if((f.index == 0 || f.index == FIELD_REMAINDER) && !already_fern && !already_present) {
        if(i == r) return [x, y];
        i++;
      }
    }
  }
  return undefined; // something went wrong
}


function getSeasonTime(time) {
  return  time - state.g_starttime - state.g_pausetime - state.seasonshift;
}

// for state.seasonshifted, not state.seasonshift
function getSeasonShifted() {
  return state.seasonshifted ? (24 * 3600) : 0;
}

function getSeasonAtUnshifted(time) {
  var t = getSeasonTime(time);
  if(isNaN(t) || t == Infinity || t == -Infinity) return 0;
  t /= (24 * 3600);
  var result = Math.floor(t) % 4;
  if(result < 0) result = 4 + result;
  return result;
}

function getSeasonAt(time) {
  return getSeasonAtUnshifted(time + getSeasonShifted());
}

// result: 0=spring, 1=summer, 2=autumn, 3=winter
function getSeason() {
  return getSeasonAt(state.time);
}

// Returns time to next season or to next point where state.seasonshifted must be decremented
function timeTilNextSeasonUnShifted() {
  var daylen = 24 * 3600;
  var t = getSeasonTime(state.time);
  t /= daylen;
  t -= Math.floor(t);
  return daylen - t * daylen;
}

function timeTilNextSeason() {
  return timeTilNextSeasonUnShifted() + getSeasonShifted();
}

// field cell with precomputed info
function PreCell(x, y) {
  this.x = x;
  this.y = y;

  // boost of this plant, taking field position into account. Used during precompute of field: amount of bonus from this cell if it's a flower, nettle, ...
  // 0 means no boost, 1 means +100% boost, etc...
  // if this is a malus-type, e.g. nettle for flower and berry, then this boost is still the positive value (nettle to mushroom boost),
  // and must be used as follows to apply the malus: with a malus value starting at 1 for no neighbors, per bad neighbor, divide malus through (boost + 1). That is multiplicative (division), while the possitive bonus is additive.
  // --> this is already calculated in for flowers. For berries it must be done as above.
  // for other crops, like beehives and challenge crops, this value may have other crop specific meanings.
  this.boost = new Num();

  // boostboost from beehives to flowers. This is precomputed (unlike boost from flowers and nettles to plants, which is not implemented like this yet) to avoid too many recursive computations
  this.beeboostboost_received = Num(0);
  this.num_bee = 0; // num beehive neighbors, if receiving boostboost, used for display purposes in the breakdown


  this.nettlemalus_received = Num(1);
  this.num_nettle = 0; // num nettle neighbors, if receiving malus


  this.weights = null; // used during precompute of field: if filled in, array of 4 elements: weights for N, E, S, W neighbors of their share of recource consumption from this. Used for mushrooms taking seeds of neighboring berries.

  // different stages of the production computation, some useful for certain UI, others not, see the comments

  // before consumption/production computation. not taking any leech into account (multiply prod or cons with 1+leech if that's needed, or see prod0b below)
  // useful for UI that shows the potential production of a mushroom if it hypothetically got as many seeds as needed from neighbors
  this.prod0 = new Res();
  // for UI only, like prod0, but with final leech added. Not to be used in any computation. Represents the potential (hypothetical) rather than actual production/consumption.
  this.prod0b = new Res();
  // during consumption/production computation, not useful for any UI, intermediate stage only
  this.prod1 = new Res();
  this.wanted = new Res();
  this.gotten = new Res();
  // after consumption/production computation, and after leeching, so useable as actual production value, not just temporary
  // useful for UI showing actual production of this plant (however doesn't show consumption as negatives have been zeroed out and subtracted frmo producers instead), and also for the actual computation of resources gained during an update tick
  this.prod2 = new Res();
  // for UI only, here the consumption is not zeroed out but negative, and is not subtracted from producers. This is like prod0, but with leech added
  // The sum of all prod3 on a field should be equal to the sum of all prod2. However, the sum of all prod2 will be more numerically precise than that of prod3.
  this.prod3 = new Res(); // prod3 is used for the "satisfied%" tooltip of mushrooms
  this.prod3b = new Res(); // prod3b is used for the gray "hypothetical" resource display in ui_info. TODO: document this difference better
  // used during wasabi challenge only as replacement for the zeroed out prod3, for UI display only
  this.prod3_wasabi_challenge = undefined;
  // idem for prod0
  this.prod0_wasabi_challenge = undefined;

  this.consumers = []; // if this is a berry: list of mushroom neighbors that consume from this
  this.producers = []; // if this is a mushroom: list of berry neighbors that produce for this

  this.leech = new Num(); // how much leech there is on this plant. e.g. if 4 watercress neighbors leech 100% each, this value is 4 (in reality that high is not possible due to the penalty for multiple watercress)

  // a score heuristic for automaton for choosing best crop upgrade spot, based on neighbors
  this.score = 0;

  // breakdown of the production for UI. Is like prod0, but with leech result added, and also given if still growing.
  // Does not take consumption into account, and shows the negative consumption value of mushroom.
  this.breakdown = undefined;

  // breakdown of the leech %
  this.breakdown_leech = undefined;

  this.getBreakdown = function() {
    if(this.breakdown == undefined) {
      this.breakdown = [];
      var f = state.field[this.y][this.x];
      var c = f.getRealCrop();
      if(c) {
        if(this.hasbreakdown_prod) {
          c.getProd(f, false, this.breakdown)
        } else if(this.hasbreakdown_boost) {
          c.getBoost(f, false, this.breakdown)
        } else if(this.hasbreakdown_boostboost) {
          c.getBoostBoost(f, false, this.breakdown)
        }
        if(this.breakdown_watercress_info) {
          var num = this.breakdown_watercress_info[1];
          var total = this.breakdown_watercress_info[2];
          var prod3 = this.breakdown_watercress_info[3];
          if(this.breakdown_watercress_info[0]) {
            this.breakdown.push(['<span class="efWatercressHighlight">copying neighbors (' + num + ')</span>', false, total, prod3.clone()]);
          } else {
            if(state.upgrades[berryunlock_0].count) this.breakdown.push(['no neighbors, not copying', false, total, prod3.clone()]);
          }
        }
      }
    }

    return this.breakdown;
  };
  this.getBreakdownWatercress = function() {
    if(this.breakdown_leech == undefined) {
      this.breakdown_leech = [];
      var f = state.field[this.y][this.x];
      var c = f.getRealCrop();
      if(this.hasbreakdown_watercress) {
        c.getLeech(f, this.breakdown_leech);
      }
    }
    return this.breakdown_leech;
  };

  this.hasbreakdown_prod = false;
  this.hasbreakdown_boost = false;
  this.hasbreakdown_booostboost = false;
  this.hasbreakdown_watercress = false;
  this.breakdown_watercress_info = undefined;

  this.last_it = -1;

  // how many neighbors this was touching (for watercress. For deciding if there'll be a remainder.)
  this.touchnum = 0;

  // for mistletoe, and winter warmth (for non-mistletoe, not computed in non-winter season)
  this.treeneighbor = false;

  // whether worker bee has flower neighbor, for bee challenge only
  this.flowerneighbor = false;

  // reset without reallocating any objects. Keeps this.x and this.y as-is.
  this.reset = function() {
    this.boost.reset();
    this.beeboostboost_received.reset();
    this.num_bee = 0;
    this.nettlemalus_received = Num(1);
    this.num_nettle = 0;
    this.weights = null;
    this.prod0.reset();
    this.prod0b.reset();
    this.prod1.reset();
    this.wanted.reset();
    this.gotten.reset();
    this.prod2.reset();
    this.prod3.reset();
    this.consumers = [];
    this.producers = [];
    this.leech.reset();
    this.score = 0;
    this.breakdown = undefined;
    this.breakdown_leech = undefined;
    this.hasbreakdown_prod = false;
    this.hasbreakdown_boost = false;
    this.hasbreakdown_booostboost = false;
    this.hasbreakdown_watercress = false;
    this.breakdown_watercress_info = undefined;
    this.last_it = -1;
    this.touchnum = 0;
    this.treeneighbor = false;
    this.flowerneighbor = false;
  };
};

// field with precomputed info, 2D array, separate from state.field because not saved but precomputed at each update()
var prefield = [];

// precompute boosts of things that depend on each other on the field
// the dependency graph (of crops on neighbor crops) is as follows:
// - flower, berry, mushroom (todo: bee?) depend on tree for winter warmth
// - bee, flower, berry depend on nettle for the negative effect
// - flower depend on bee for the boostboost
// - berry and mushroom depends on flower for the boost
// - mushroom depends on nettle for the boost
// - mushroom depends on berry for the spores income
// - watercress depends on mushroom and berry for the leech, but you could see this the opposite direction, muchroom depends on watercress to precompute how much extra seeds are being consumed for the part copied by the watercress
// --> watercress leech output is computed after all producing/consuming/bonuses have been done. watercress does not itself give seeds to mushrooms. watercress gets 0 seeds from a berry that has all seeds going to neighboring mushrooms.
// - watercress depends on overall watercress amount on field for the large-amount penalty.
function precomputeField() {
  var w = state.numw;
  var h = state.numh;

  if(!prefield || !prefield[0] || prefield.length != h || prefield[0].length != w) prefield = [];
  for(var y = 0; y < h; y++) {
    if(!prefield[y]) prefield[y] = [];
    for(var x = 0; x < w; x++) {
      if(prefield[y][x]) {
        prefield[y][x].reset();
      } else {
        prefield[y][x] = new PreCell(x, y);
      }
    }
  }

  state.mistletoes = 0;
  state.workerbeeboost = Num(0);

  // pass 0: precompute several types of boost to avoid too many recursive calls when computing regular boosts: bee challenge, nettle and beehive

  if(state.challenge == challenge_bees) {
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        var f = state.field[y][x];
        var c = f.getRealCrop();
        if(c && c.index == challengecrop_1 && f.isFullGrown()) {
          var p = prefield[y][x];
          var boost = c.getBoostBoost(f);
          p.boost = Num(boost);
          for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
            var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
            var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            var f2 = state.field[y2][x2];
            var c2 = f2.getRealCrop();
            if(c2 && c2.index == challengecrop_2 && f2.isFullGrown()) {
              p.boost.addInPlace(boost.mul(c2.getBoostBoost(f2)));
            }
          }
        }
      }
    }
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        var f = state.field[y][x];
        var c = f.getRealCrop();
        if(c && c.index == challengecrop_0) {
          var p = prefield[y][x];
          var boost = c.getBoostBoost(f);
          if(f.isFullGrown()) p.boost = Num(boost);
          for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
            var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
            var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            var f2 = state.field[y2][x2];
            var c2 = f2.getRealCrop();
            var p2 = prefield[y2][x2];
            if(c2 && c2.index == challengecrop_1 && f2.isFullGrown() && f.isFullGrown()) {
              p.boost.addInPlace(boost.mul(p2.boost));
            }
            if(c2 && c2.index == challengeflower_0 && f2.isFullGrown()) {
              p.flowerneighbor = true;
            }
          }
          if(p.flowerneighbor && f.isFullGrown()) {
            state.workerbeeboost.addInPlace(p.boost);
          }
        }
      }
    }
  } // end of bee challenge

  var winter = (getSeason() == 3);

  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
        for(var dir = 0; dir < 8; dir++) { // get the neighbors N,E,S,W,NE,SE,SW,NW
          var x2 = f.x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
          var y2 = f.y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
          if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
          var f2 = state.field[y2][x2];
          var c = f2.getCrop();
          if(!c) continue;
          var diagonal = (c.type == CROPTYPE_MISTLETOE) ? !!state.upgrades2[upgrade2_diagonal_mistletoes].count : !!state.upgrades2[upgrade2_diagonal].count;
          if(!diagonal && dir >= 4) continue;
          var p2 = prefield[y2][x2];
          p2.treeneighbor = true;
        }
      }
    }
  }

  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getRealCrop();
      if(c) {
        var p = prefield[y][x];
        if(c.type == CROPTYPE_NETTLE) {
          p.boost = c.getBoost(f);
          p.hasbreakdown_boost = true;
        }
        if(c.type == CROPTYPE_BEE) {
          p.boost = c.getBoostBoost(f);
          p.hasbreakdown_boostboost = true;
        }
      }
    }
  }
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getRealCrop();
      if(c) {
        var p = prefield[y][x];
        if(c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_BERRY) {
          for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
            var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
            var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            var f2 = state.field[y2][x2];
            var c2 = f2.getRealCrop();
            if(c2 && c2.type == CROPTYPE_NETTLE) {
              var p2 = prefield[y2][x2];
              var boost = p2.boost;
              p.nettlemalus_received.divInPlace(boost.addr(1));
              p.num_nettle++;
            }
          }
        }
      }
    }
  }
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getRealCrop();
      if(c) {
        var p = prefield[y][x];
        if(c.type == CROPTYPE_FLOWER) {
          for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
            var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
            var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            var f2 = state.field[y2][x2];
            var c2 = f2.getRealCrop();
            if(c2 && c2.type == CROPTYPE_BEE) {
              var p2 = prefield[y2][x2];
              var boostboost = p2.boost;
              p.beeboostboost_received.addInPlace(boostboost);
              p.num_bee++;
            }
          }
        }
      }
    }
  }

  // pass 1: compute boosts of flowers now that nettle and beehive effect is known, and other misc position related features
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getRealCrop();
      if(c) {
        var p = prefield[y][x];
        if(c.type == CROPTYPE_FLOWER) {
          p.boost = c.getBoost(f);
          p.hasbreakdown_boost = true;
        }
        if(c.type == CROPTYPE_BEE) {
          p.boost = c.getBoostBoost(f);
          p.hasbreakdown_boostboost = true;
        }
        if(c.type == CROPTYPE_MISTLETOE && p.treeneighbor) {
          state.mistletoes++;
        }
      }
    }
  }

  // pass 2: compute amount of leech each cell gets
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getRealCrop();
      if(c) {
        if(c.type == CROPTYPE_BRASSICA) {
          // this computation is only used for mushroom seed consumption, so it's ok to not compute the leech value for nuts here.
          var leech = c.getLeech(f);
          var numdir = state.upgrades3[upgrade3_diagonal_brassica].count ? 8 : 4;
          for(var dir = 0; dir < numdir; dir++) { // get the neighbors N,E,S,W,NE,SE,SW,NW
            var x2 = x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
            var y2 = y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            var p2 = prefield[y2][x2];
            p2.leech.addInPlace(leech);
          }
        }
      }
    }
  }

  var soup = state.upgrades3[upgrade3_watercress_mush].count; // watercress and mushroom soup upgrade, which makes leech from mushroom snot cost seeds

  // pass 3: compute basic production/consumption of each cell, without taking input/output connections (berries to mushrooms) into account, just the full value
  // production without leech, consumption with leech (if watercress leeches from mushroom, adds that to its consumption, but not the leeched spores production, that's added in a later step)
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getRealCrop();
      if(c) {
        if(c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_NETTLE || c.type == CROPTYPE_BEE) continue; // don't overwrite their boost breakdown with production breakdown
        var p = prefield[y][x];
        var prod = c.getProd(f);
        if(prod.seeds.ltr(0)) {
          if(!soup) {
            // if there is leech on the mushroom, it wants more seeds (except if this squirrel upgrade is enabled)
            prod.seeds.mulInPlace(p.leech.addr(1));
          }
          // how much input mushrooms want
          p.wanted.seeds = prod.seeds.neg();
        }
        p.hasbreakdown_prod = true;
        p.prod0 = prod;
        p.prod0b = Res(prod); // a separate copy
        // used by pass 4, production that berry has available for mushrooms, which is then subtracted from
        p.prod1 = Res(prod);
      }
    }
  }

  // pass 4a: compute list/graph of neighboring producers/consumers
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getRealCrop();
      if(c) {
        if(c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH) {
          var p = prefield[y][x];
          for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
            var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
            var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            var f2 = state.field[y2][x2];
            var c2 = f2.getRealCrop();
            if(c2) {
              var p2 = prefield[y2][x2];
              if(c.type == CROPTYPE_BERRY && c2.type == CROPTYPE_MUSH) {
                p.consumers.push(p2);
              }
              if(c.type == CROPTYPE_MUSH && c2.type == CROPTYPE_BERRY) {
                p.producers.push(p2);
              }
            }
          }
        }
      }
    }
  }

  // pass 4b: approximation of distributing the resources
  var num_it = 4;
  for(var it = 0; it < num_it; it++) {
    var last = (it + 1 == num_it);
    var did_something = false;
    for(var y0 = 0; y0 < h; y0++) {
      for(var x0 = 0; x0 < w; x0++) {
        var y = y0;
        var x = x0;
        if(it & 1) {
          // probably unnecessary method to make it more fair by alternating direction
          y = h - y0 - 1;
          x = w - x0 - 1;
        }
        var f = state.field[y][x];
        var c = f.getRealCrop();
        if(c) {
          if(c.type == CROPTYPE_MUSH) {
            var p = prefield[y][x];

            // during the first iteration, greedily take everything from producers private to us only, and then remove them from the list
            // this ensures mushrooms with both a shared and a private flower, take everyhing possible from the private one, leaving more of the shared one for the other mushroom and avoiding situation where the private one has leftover production that is then unused but needed by the other mushroom
            // NOTE: this does not solve everything, this is just a heuristic. We won't do full linear programming here for optimal solution.
            // e.g. this breaks down if we have a berry that is almost private except a much lower level mushroom shares it with us so that it no longer counts as private even though optimal result is almost the same
            // NOTE: no matter what other heuristics get added here, ensure that they are not field rotation/mirror dependent: do not favor certain directions or corners.
            if(it == 0) {
              var producers2 = [];
              for(var i = 0; i < p.producers.length; i++) {
                var p2 = p.producers[i];
                if(p2.consumers.length > 1) {
                  producers2.push(p2);
                  continue;
                }
                var want = p.wanted.seeds.sub(p.gotten.seeds);
                var have = p2.prod1.seeds;
                var amount = Num.min(want, have);
                if(amount.gter(0)) {
                  did_something = true;
                  p.gotten.seeds.addInPlace(amount);
                  p2.prod1.seeds.subInPlace(amount);
                }
              }
              p.producers = producers2;
            }

            if(p.producers.length == 0) continue; // no producers at all (anymore) for this mushroom
            // want is how much seeds we want, but only for the slice allocated to this producer
            // computed outside of the producers loop to ensure it's calculated the same for all producers
            var want = p.wanted.seeds.sub(p.gotten.seeds).divr(p.producers.length);
            for(var i = 0; i < p.producers.length; i++) {
              var p2 = p.producers[i];
              if(p2.last_it != it) {
                // temporarily use prod2 for an earlier purpose than that of next passes
                // divide the remaining resources of this berry fairly amongst different mushrooms through this iteration
                // so ensure the same is seen by next mushrooms too
                p2.prod2 = Res(p2.prod1);
                p2.last_it = it;
              }
              var have = p2.prod2.seeds.divr(p2.consumers.length); // the divisor is guaranteed at least 1 since the current mushroom is a neighbor
              if(last) {
                // in last iteration, just greedily take everything. This means that there is some unintended positional advantage to some
                // locations, but it should be small with enough iterations.
                // TODO: use better algo that prevents this
                want = p.wanted.seeds.sub(p.gotten.seeds);
                have = p2.prod1.seeds;
              }
              var amount = Num.min(want, have);
              if(amount.gter(0)) {
                did_something = true;
                p.gotten.seeds.addInPlace(amount);
                p2.prod1.seeds.subInPlace(amount);
              }
            }
          }
        }
      }
    }
    if(!did_something) break;
  }

  // pass 4c: now compute the spores based on the satisfied amount of seeds
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getRealCrop();
      if(c) {
        var p = prefield[y][x];
        p.prod2 = new Res(p.prod1);
        p.prod3 = new Res(p.prod0);
        p.prod3b = new Res(p.prod0); // this is preparation for pass 5
        if(c.type == CROPTYPE_MUSH) {
          if(p.wanted.seeds.eqr(0)) continue; // zero input required, so nothing to do (no current mushroom has this case though, but avoid NaNs if it'd happen)
          var ratio = p.gotten.seeds.div(p.wanted.seeds);
          // the actual amount of spores produced based on satisfied input amount
          // if there was watercress leeching from this mushroom, then the amount may be less if the multiplied-by-leech input was not satisfied, but the output of the watercress makes up for that in a next pass
          p.prod2.spores.mulInPlace(ratio);
          p.prod2.seeds = Num(0); // they have been consumed, and already subtracted from the production of the berry so don't have the negative value here anymore
          p.prod3.spores.mulInPlace(ratio);
          p.prod3.seeds.mulInPlace(ratio);
        }
      }
    }
  }

  var total = new Res(); // temporary object for below

  // pass 5: watercress copying
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var p = prefield[y][x];
      var c = f.getRealCrop();
      if(c) {
        if(c.type == CROPTYPE_BRASSICA) {
          var leech_main = c.getLeech(f);
          var leech_nuts = c.getLeech(f, undefined, true);
          var p = prefield[y][x];
          total.reset();
          var num = 0;
          var numdir = state.upgrades3[upgrade3_diagonal_brassica].count ? 8 : 4;
          for(var dir = 0; dir < numdir; dir++) { // get the neighbors N,E,S,W,NE,SE,SW,NW
            var x2 = x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
            var y2 = y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            var f2 = state.field[y2][x2];
            var c2 = f2.getRealCrop();
            if(c2) {
              if(c2.type != CROPTYPE_BRASSICA) p.touchnum++;
              var p2 = prefield[y2][x2];
              if(c2.type == CROPTYPE_BERRY || c2.type == CROPTYPE_MUSH || c2.type == CROPTYPE_NUT) {
                // leech ratio that applies here
                var leech = (c2.type == CROPTYPE_NUT) ? leech_nuts : leech_main;
                // leeched resources
                var leech2 = p2.prod2.mul(leech);
                // leeched resources for UI only with possibly negative consumption (see description of prod3, is used for the hypothetical display)
                // why spores and seeds are computed differently: because this is for the gray hypothetical income if mushrooms are overconsuming seeds display in the info UI, and then specifically for watercress
                // -for spores: this displays the max spores you could get (from this watercress if it's next to a mushroom), if mushrooms were free to consume as much as they wanted, in other words if mushrooms would simply produce spores without even needing consumption. prod3 (similar to prod0 at this point) contains that theoretical max spores production
                // -for seeds: this displays the amount of seeds this watercress extracts from the berry after the max possible consumption from neighboring mushrooms applied, but never lower than 0. So this should not get the value from prod3, which shows the max theoretical seeds production. Unlike spores, the gray display for seeds is not a theoretical max, but instead it's a theoretical minimum, if mushrooms could consume all seeds making this one negative. prod2 has the correct value here: the berry's seeds after consumption applied, but capped to not be lower than 0 (watercress won't duplicate negative production)
                // -for other resource types: these follow the seeds principle. e.g. for nuts. But consumption is not a factor here.
                // NOTE: the seeds uses the scenario "mushrooms can consume everything, even negative". A different possible hypothetical display could be to display what happens if mushrooms have 0 consumption, and then leech3 could fully use p2.prod3.mul(leech) even for seeds. However, then there would always be gray display next to seeds income (since there'll always be a difference then), while now there's only gray display at seeds&spores in an overconsumption scenario, so not a good options to change the display into this.
                var leech3 = p2.prod3.mul(leech);
                var leech3b = p2.prod3b.mul(leech);
                leech3b.seeds = p2.prod2.seeds.mul(leech);
                // the full multiplied consumption amount caused by leech was already added in previous passes, so that shouldn't be included here anymore. prod2's negative seeds were already set to 0 in pass 4, but that checks croptype mush only, which is theoretically correct but to be sure it's set to 0 here again for good measure
                if(leech2.seeds.ltr(0)) leech2.seeds = new Num(0);
                if(soup && leech3.seeds.ltr(0)) leech3.seeds = new Num(0);
                if(leech3b.seeds.ltr(0)) leech3b.seeds = new Num(0);
                p.prod2.addInPlace(leech2);
                p.prod3.addInPlace(leech3);
                p.prod3b.addInPlace(leech3b);
                // we could in theory add "leech0=p2.prod0.mul(leech)" instead of leech2 to the hypothetical production given by prod0b for UI reasons.
                // however, then the hypothetical seed production may differ from the main seed production even when mushrooms have enough seeds to produce all spores
                // and that is not the goal of the hypothetical production display. So instad add the actual leech. when adding leech0, then if you have champignon+blueberry+watercress (in that order, and with champignon satisfied), it'd display some hypothetical seds in gray parenthesis which is undesired
                p.prod0b.addInPlace(leech3b);
                total.addInPlace(leech3b); // for the breakdown
                num++;
              }
            }
          }
          // also add this to the breakdown
          if(!total.empty()) {
            c.getLeech(f);
            p.hasbreakdown_watercress = true;
            p.breakdown_watercress_info = [true, num, total, p.prod3];
          } else {
            p.breakdown_watercress_info = [false, num, total, p.prod3];
          }
        }
      }
    }
  }

  // pass 6: score heuristics for automaton auto-plant. The score of flower-beehive and nettle-malus pairs is assumed to already have been computed at this point
  var winter = getSeason() == 3;
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      if(!c) continue;
      var p = prefield[y][x];

      var score_flower = 0;
      var score_num = 0;
      var score_mul = 1;
      var score_malus = 1;

      for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
        var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
        var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
        if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
        var f2 = state.field[y2][x2];
        var c2 = f2.getCrop();
        if(!c2) continue;
        var p2 = prefield[y2][x2];

        if(c.type == CROPTYPE_BERRY) {
          if(c2.type == CROPTYPE_FLOWER) score_flower += (1 + p.num_bee - p.num_nettle);
          if(c2.type == CROPTYPE_BRASSICA) score_mul *= ((state.cropcount[brassica_0] > 2) ? 1 : 2); // TODO: take diagonal brassica into account here if unlocked
          if(c2.type == CROPTYPE_NETTLE) score_malus *= 0.5;
        }
        if(c.type == CROPTYPE_MUSH) {
          if(c2.type == CROPTYPE_FLOWER) score_flower += (1 + p.num_bee - p.num_nettle);
          if(c2.type == CROPTYPE_NETTLE) score_mul++;
          if(c2.type == CROPTYPE_BERRY) score_num++;
        }
      }

      if(c.type == CROPTYPE_BERRY) {
        if(winter && !p.treeneighbor) score_malus *= 0.5;
        p.score = (1 + score_flower) * score_mul * score_malus;
      }
      if(c.type == CROPTYPE_MUSH) {
        if(winter && !p.treeneighbor) score_malus *= 0.5;
        p.score = (1 + score_flower) * score_mul * (score_num ? 1 : 0) * score_malus;
      }
    }
  }
  // a next pass to add add berry bonus to flowers
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      if(!c) continue;
      var p = prefield[y][x];

      var score_flower = 0;
      var score_num = 0;
      var score_mul = 1;
      var score_malus = 1;

      for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
        var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
        var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
        if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
        var f2 = state.field[y2][x2];
        var c2 = f2.getCrop();
        if(!c2) continue;
        var p2 = prefield[y2][x2];

        if(c.type == CROPTYPE_FLOWER) {
          if(c2.type == CROPTYPE_BEE) score_mul++;
          if(c2.type == CROPTYPE_NETTLE) score_malus *= 0.5;
          // these 3 values and their multipliers are tweaked to make sensible choices for relative value of berries, mushrooms and nuts and likely intended preference
          if(c2.type == CROPTYPE_BERRY) score_num += p2.score;
          if(c2.type == CROPTYPE_MUSH) score_num += p2.score * 0.5;
          if(c2.type == CROPTYPE_NUT) score_num += 0.65;
        }
        if(c.type == CROPTYPE_NETTLE) {
          if(c2.type == CROPTYPE_MUSH) score_num++;
          if(c2.type == CROPTYPE_BERRY) score_num--;
          if(c2.type == CROPTYPE_NUT) score_num--;
          if(c2.type == CROPTYPE_FLOWER) score_num--;
        }
        if(c.type == CROPTYPE_BEE) {
          if(c2.type == CROPTYPE_FLOWER) score_num++;
          if(c2.type == CROPTYPE_NETTLE) score_malus *= 0.5;
        }
      }

      if(c.type == CROPTYPE_FLOWER) {
        if(winter && !p.treeneighbor) score_malus *= 0.5;
        p.score = score_mul * score_malus * score_num;
      }
      if(c.type == CROPTYPE_NETTLE) {
        if(winter && !p.treeneighbor) score_malus *= 0.5;
        p.score = score_num;
      }
      if(c.type == CROPTYPE_BEE) {
        if(winter && !p.treeneighbor) score_malus *= 0.5;
        p.score = score_malus * score_num;
      }
    }
  }

  // for the wasabi challenge, remove regular production now
  if(state.challenge == challenge_wasabi) {
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        var p = prefield[y][x];
        var f = state.field[y][x];
        var c = f.getCrop();
        if(!c) continue;
        if(c.type == CROPTYPE_BRASSICA) continue;
        p.prod3_wasabi_challenge = p.prod3;
        p.prod0_wasabi_challenge = p.prod0;
        var empty = new Res();
        p.prod0 = empty;
        p.prod0b = empty;
        p.prod1 = empty;
        p.prod2 = empty;
        p.prod3 = empty;
        p.prod3b = empty;
      }
    }
  }

  // memory cleanup pass, and avoidance of lasting circular dependencies
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var p = prefield[y][x];
      p.producers = [];
      p.consumers = [];
    }
  }
};

// xor two 48-bit numbers, given that javascript can only up to 31-bit numbers (plus sign) normally
function xor48(x, y) {
  var lowx = x % 16777216;
  var lowy = y % 16777216;
  var highx = Math.floor(x / 16777216);
  var highy = Math.floor(y / 16777216);
  var lowz = lowx ^ lowy;
  var highz = highx ^ highy;
  return lowz + (highz * 16777216);
}

// returns array of updated seed and the random roll in range [0, 1)
function getRandomRoll(seed) {
  var mul48 = function(a, b) {
    var a0 = a & 16777215;
    var b0 = b & 16777215;
    var a1 = Math.floor(a / 16777216);
    var b1 = Math.floor(b / 16777216);
    var c0 = a0 * b0;
    var c1 = ((a1 * b0) + (a0 * b1)) & 16777215;
    return c1 * 16777216 + c0;
  };

  // drand48, because 48 bits fit in JS's 52-bit integers
  seed = (mul48(25214903917, seed) + 11) % 281474976710656;
  return [seed, seed / 281474976710656];
}


// Use this rather than Math.random() to avoid using refresh to get better random ferns
function getRandomFernRoll() {
  if(state.fern_seed < 0) {
    // console.log('fern seed not initialized');
    // this means the seed is uninitialized and must be randominzed now. Normally this shouldn't happen since initing a new state sets it, and loading an old savegame without the seed also sets it
    state.fern_seed = Math.floor(Math.random() * 281474976710656);
  }

  var roll = getRandomRoll(state.fern_seed);
  state.fern_seed = roll[0];
  return roll[1];
}

// Use this rather than Math.random() to avoid using refresh to get better random presents
function getRandomPresentRoll() {
  if(state.present_seed < 0) {
    // console.log('present seed not initialized');
    // this means the seed is uninitialized and must be randominzed now. Normally this shouldn't happen since initing a new state sets it, and loading an old savegame without the seed also sets it
    state.present_seed = Math.floor(Math.random() * 281474976710656);
  }

  var roll = getRandomRoll(state.present_seed);
  state.present_seed = roll[0];
  return roll[1];
}


// Use this rather than Math.random() to avoid using refresh to get better random fruits
function getRandomFruitRoll() {
  if(state.fruit_seed < 0) {
    // console.log('fruit seed not initialized');
    // this means the seed is uninitialized and must be randominzed now. Normally this shouldn't happen since initing a new state sets it, and loading an old savegame without the seed also sets it
    state.fruit_seed = Math.floor(Math.random() * 281474976710656);
  }

  var roll = getRandomRoll(state.fruit_seed);
  state.fruit_seed = roll[0];
  return roll[1];
}


function addRandomFruitForLevel(treelevel) {
  var fruits = [];
  for(;;) {
    // do same amount of rolls per fruit, even if some are unneeded, so that it's harder to affect the fruit seed by choosing when to do squirrel upgrades, transcends, ...
    var roll_double = getRandomFruitRoll();
    var roll_tier = getRandomFruitRoll();
    var roll_season = getRandomFruitRoll();
    var roll_abilities = [getRandomFruitRoll(), getRandomFruitRoll(), getRandomFruitRoll(), getRandomFruitRoll(), getRandomFruitRoll()];
    var roll_abilities_level = [getRandomFruitRoll(), getRandomFruitRoll(), getRandomFruitRoll(), getRandomFruitRoll(), getRandomFruitRoll()];

    var tier = getNewFruitTier(roll_tier, treelevel, !!state.upgrades3[upgrade3_fruittierprob].count);

    var fruit = new Fruit();
    fruit.tier = tier;

    var num_abilities = getNumFruitAbilities(tier);

    var abilities = [FRUIT_BERRYBOOST, FRUIT_MUSHBOOST, FRUIT_MUSHEFF, FRUIT_FLOWERBOOST, FRUIT_BRASSICA, FRUIT_GROWSPEED, FRUIT_WEATHER, FRUIT_NETTLEBOOST];
    if(tier >= 5) {
      abilities.push(FRUIT_RESINBOOST);
      abilities.push(FRUIT_TWIGSBOOST);
      abilities.push(FRUIT_NUTBOOST);
      abilities.push(FRUIT_BEEBOOST);
    }

    for(var i = 0; i < num_abilities; i++) {
      var roll = Math.floor(roll_abilities[i] * abilities.length);
      var ability = abilities[roll];
      abilities.splice(roll, 1);
      var level = 1 + Math.floor(roll_abilities_level[i] * 4);

      fruit.abilities.push(ability);
      fruit.levels.push(level);
      fruit.charge.push(0);
    }

    if(state.g_numfruits >= 4) {
      var prob = 0.75;
      if(state.upgrades3[upgrade3_seasonfruitprob].count) prob = 0.666; // from 1/4th to 1/3th probability
      if(roll_season > prob) {
        var season = getSeason();
        if(season >= 0 && season <= 3) {
          fruit.type = 1 + season;
        }
      }
    }

    if(fruit.type == 1) {
      fruit.abilities.push(FRUIT_SPRING);
      fruit.levels.push(1);
    }
    if(fruit.type == 2) {
      fruit.abilities.push(FRUIT_SUMMER);
      fruit.levels.push(1);
    }
    if(fruit.type == 3) {
      fruit.abilities.push(FRUIT_AUTUMN);
      fruit.levels.push(1);
    }
    if(fruit.type == 4) {
      fruit.abilities.push(FRUIT_WINTER);
      fruit.levels.push(1);
    }

    for(var i = 0; i < fruit.levels.length; i++) {
      fruit.starting_levels[i] = fruit.levels[i];
    }


    var season_before = state.seen_seasonal_fruit;
    if(fruit.type >= 1 && fruit.type <= 4) state.seen_seasonal_fruit |= (1 << (fruit.type - 1));
    var season_after = state.seen_seasonal_fruit;
    if(!season_before && season_after) {
      showMessage('You got a seasonal fruit for the first time! One extra fruit storage slot added to cope with the variety.', C_NATURE, 208302236);
      state.fruit_slots++;
    }
    if(season_before != 15 && season_after == 15) {
      showMessage('You\'ve seen all 4 possible seasonal fruits! One extra fruit storage slot added to cope with the variety.', C_NATURE, 208302236);
      state.fruit_slots++;
    }

    var interesting = isFruitInteresting(fruit);

    // indicate if higher level fruit than you are using
    if(interesting) state.fruit_seen = false;

    var no_fruit_intended = !getActiveFruit(); // if there is no active fruit selected in purpose, assume that is intended and keep it that way, don't let a random fruit drop that due to heuristics ends up in stored slots rather than sacrificial pool override that choice

    if(state.fruit_stored.length == 0) {
      setFruit(state.fruit_stored.length, fruit);
    } else if(state.keepinterestingfruit && interesting && state.fruit_stored.length < state.fruit_slots && !(no_fruit_intended && state.fruit_stored.length + 1 == state.fruit_slots)) {
      // if it's an interesting fruit, such as highest tier ever, add it to the stored fruits if possible
      setFruit(state.fruit_stored.length, fruit);
      if(no_fruit_intended) state.fruit_active++;
    } else {
      // add fruit to sacrificial pool, player is responsible for choosing to move fruits to storage or active lots
      setFruit(100 + state.fruit_sacr.length, fruit);
    }

    state.c_numfruits++;
    state.g_numfruits++;

    fruits.push(fruit);

    if(fruits.length == 1 && state.upgrades3[upgrade3_doublefruitprob].count && roll_double < upgrade3_doublefruitprob_prob) {
      // probability of a second fruit
      continue;
    }
    break;
  }

  //updateFruitUI();
  return fruits;
}

function addRandomFruit() {
  return addRandomFruitForLevel(state.treelevel);
}

// unlocks and shows message, if not already unlocked
function unlockEtherealCrop(id) {
  var c2 = state.crops2[id];
  if(c2.unlocked) return;

  var c = crops2[id];
  showMessage('Ethereal crop available: "' + c.name + '"', C_ETHEREAL, 494369596);
  c2.unlocked = true;
}




function doNextAutoChoice() {
  var did_something = false;
  for(var i = 0; i < registered_upgrades.length; i++) {
    var j = registered_upgrades[i];
    var u = upgrades[j];
    var u2 = state.upgrades[j];
    if(!u.is_choice) continue;
    if(!u2.unlocked) continue;
    if(u.maxcount != 0 && u2.count >= u.maxcount) continue;
    var choice = 0;
    if(j == fern_choice0 && state.automaton_choices[0] == 2) choice = 1;
    if(j == fern_choice0 && state.automaton_choices[0] == 3) choice = 2;
    if(j == active_choice0 && state.automaton_choices[1] == 2) choice = 1;
    if(j == active_choice0 && state.automaton_choices[1] == 3) choice = 2;
    if(j == watercress_choice0 && state.automaton_choices[2] == 2) choice = 1;
    if(j == watercress_choice0 && state.automaton_choices[2] == 3) choice = 2;
    if(choice > 0) {
      showMessage('Automaton auto chose: ' + upper(u.name) + ': ' + upper(choice == 1 ? u.choicename_a : u.choicename_b), C_AUTOMATON, 101550953);
      addAction({type:ACTION_UPGRADE, u:u.index, shift:false, by_automaton:true, choice:choice});
      did_something = true;
    }
  }
  return did_something;
}



// next chosen auto upgrade, if applicable.
// type: either undefined, or object {index:upgrade id, time:time until reached given current resource gain}
var next_auto_upgrade = undefined;


function getAutoFraction(advanced, fractions, croptype) {
  var fraction = fractions[0];
  if(advanced && croptype != undefined) {
    if(croptype == CROPTYPE_BERRY) fraction = fractions[3];
    else if(croptype == CROPTYPE_MUSH) fraction = fractions[4];
    else if(croptype == CROPTYPE_FLOWER) fraction = fractions[5];
    else if(croptype == CROPTYPE_NETTLE) fraction = fractions[6];
    else if(croptype == CROPTYPE_BEE) fraction = fractions[7];
    else if(croptype == CROPTYPE_BRASSICA) fraction = fractions[2];
    else if(croptype == CROPTYPE_MISTLETOE) fraction = fractions[8];
    else if(croptype == CROPTYPE_NUT) fraction = fractions[9];
    else fraction = fractions[1]; // challenge crops, squirrel, ...
  }
  return fraction;
}

function computeFractionTime(cost, fraction) {
  // e.g. if fraction is 50%, then state needs to have at least 2x as much resources before this upgrade will be auto-bought
  var res_needed = cost.divr(fraction);

  var time = 0;
  if(res_needed.gt(state.res)) {
    var rem = res_needed.sub(state.res);
    var time = -Infinity;
    if(rem.seeds.gtr(0)) time = Math.max(time, rem.seeds.div(gain.seeds).valueOf());
    if(rem.spores.gtr(0)) time = Math.max(time, rem.spores.div(gain.spores).valueOf());
    if(time == -Infinity) time = Infinity; // this upgrade may cost some new resource, TODO: implement here too
  }
  return time;
}

// compute next_auto_upgrade
// this is the next upgrade that auto upgrade will do.
// this must be chosen to be the first one done given the resource fraction choices, since the nextEventTime computation also uses this
function computeNextAutoUpgrade() {
  next_auto_upgrade = undefined;

  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = upgrades[registered_upgrades[i]];
    var u2 = state.upgrades[registered_upgrades[i]];
    if(!u.iscropupgrade) continue;
    if(!u2.unlocked) continue;
    if(u.maxcount != 0 && u2.count >= u.maxcount) continue;
    if(u.cropid == undefined) continue
    //if(!state.fullgrowncropcount[u.cropid]) continue; // only do fullgrown crops, don't already start spending money on upgrades that have no effect on non-fullgrown crops
    if(!state.cropcount[u.cropid]) continue; // do any crop, even not fullgrown, because since version 0.1.61, crops already produce a fractional amount while growing
    // TODO: highestoftypeplanted or highestoftypeunlocked? Maybe should be an option, both have pros and cons. a con of using highestoftypeunlocked is that then no progress is made on the field if the game is left to run alone for a long time but the highest plant is not planted yet
    if(crops[u.cropid].tier < state.highestoftypeplanted[crops[u.cropid].type]) continue; // don't upgrade lower types anymore once a higher type of berry/mushroom/... is on the field

    // how much resources willing to spend
    var advanced = state.automaton_unlocked[1] >= 2;
    var fraction = getAutoFraction(advanced, state.automaton_autoupgrade_fraction, crops[u.cropid].type);

    var cost = u.getCost();

    var time = computeFractionTime(cost, fraction);
    if(time == Infinity) continue;

    if(next_auto_upgrade == undefined || time < next_auto_upgrade.time) next_auto_upgrade = {index:u.index, time:time};
  }
}

// res must be a copy of the available resources for all auto-actions, and will be modified in place
function autoUpgrade(res) {
  if(!next_auto_upgrade) return false;

  var did_something = false;

  var u = upgrades[next_auto_upgrade.index];

  // how much resources willing to spend
  var advanced = state.automaton_unlocked[1] >= 2;
  var fraction = getAutoFraction(advanced, state.automaton_autoupgrade_fraction, crops[u.cropid].type);

  var count = 0;
  for(;;) {
    var maxcost = Res.min(res, state.res.mulr(fraction));
    var cost = u.getCost(count);
    if(cost.gt(maxcost)) break;
    if(cost.hasNaNOrInfinity()) {
      count--;
      break;
    }
    if(count > 100) break;
    count++;
    res.subInPlace(cost);
  }
  if(count > 0) {
    addAction({type:ACTION_UPGRADE, u:u.index, shift:false, by_automaton:true, num:count});
    did_something = true;
  }
  return did_something;
}


function getHighestAffordableCropOfType(type, res) {
  var tier = state.highestoftypeunlocked[type];
  for(;;) {
    if(tier < 0) return null;
    var crop = croptype_tiers[type][tier];
    if(!crop) return null;
    if(crop.getCost().le(res)) return crop;
    tier--;
  }
}

// get cheapest unlocked crop you can plant
function getCheapestNextOfCropType(type, opt_tier) {
  var tier = (opt_tier == undefined) ? (state.lowestoftypeplanted[type] + 1) : (opt_tier + 1);
  if(tier < 0 || tier == Infinity) return null;
  var crop = croptype_tiers[type][tier];
  if(!crop) return null;
  if(!state.crops[crop.index].unlocked) return null;
  return crop;
}

// next chosen auto plant, if applicable.
// type: either undefined, or object {index:plant id, x:xpos, y:ypos, time:time until reached given current resource gain}
var next_auto_plant = undefined;

function computeNextAutoPlant() {
  next_auto_plant = undefined;

  if(state.challenge == challenge_nodelete) return; // cannot replace crops during the nodelete challenge

  // mistletoe is before mushroom on purpose, to ensure it gets chosen before mushroom, to ensure it grows before mushrooms grew and make tree level up
  var types = [CROPTYPE_SQUIRREL, CROPTYPE_BRASSICA, CROPTYPE_MISTLETOE, CROPTYPE_BERRY, CROPTYPE_MUSH, CROPTYPE_FLOWER, CROPTYPE_BEE, CROPTYPE_NETTLE, CROPTYPE_NUT];

  for(var i = 0; i < types.length; i++) {
    var type = types[i];

    //if(type == CROPTYPE_SQUIRREL && state.cropcount[squirrel_0]) continue; // can have max 1 squirrel (even though multiple blueprints are possible), so do not attempt to plant it all the time once there's one
    //if(type == CROPTYPE_NUT && tooManyNutsPlants()) continue; // can have max 1 squirrel (even though multiple blueprints are possible), so do not attempt to plant it all the time once there's one

    var crop = getCheapestNextOfCropType(type);
    if(!crop) continue;

    // special case: if have multiple nuts templates and 1 non-template nut crop, then getCheapestNextOfCropType should be returning what's above the 1 non-template crop.
    if(type == CROPTYPE_NUT && crop.tier == 0 && tooManyNutsPlants()) {
      var crop = getCheapestNextOfCropType(type, state.highestoftypeplanted[type]);
      if(!crop) continue;
    }


    // how much resources willing to spend
    var advanced = state.automaton_unlocked[2] >= 2;
    var fraction = getAutoFraction(advanced, state.automaton_autoplant_fraction, crop.type);
    if(fraction == 0) continue; // even if the crop itself costs 0 (e.g. squirrel), fraction 0 means that this type is configured to be skipped entirely
    var cost = crop.getCost();

    // NOTE: must match simimar checks in autoPlant()
    if(state.c_numfullgrown == 0 && fraction > 0 && (type == CROPTYPE_BRASSICA || type == CROPTYPE_BERRY)) {
      fraction = 1; // first watercress/berries allowed to be 100% (unless fully disabled) to get the game kickstarted when having 1000 seeds, using blueprints and having automaton berry% to something less than 100%
    }

    var time = computeFractionTime(cost, fraction);
    if(time == Infinity) continue;

    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f = state.field[y][x];
        if(!f.hasCrop()) continue;
        var c = f.getCrop();
        if(c.type != type) continue;
        if(c.tier >= crop.tier) continue;
        if(type == CROPTYPE_NUT && tooManyNutsPlants(!c.istemplate)) continue; // can only have 1 at the same time
        if(next_auto_plant == undefined || time < next_auto_plant.time) next_auto_plant = {index:crop.index, x:x, y:y, time:time};
        x = state.numw;
        y = state.numh;
        break;
      }
    }
  }
}

function autoPlant(res) {
  if(!next_auto_plant) return false;

  var crop = crops[next_auto_plant.index];
  var x = next_auto_plant.x;
  var y = next_auto_plant.y;

  // how much resources willing to spend
  var advanced = state.automaton_unlocked[2] >= 2;
  var fraction = getAutoFraction(advanced, state.automaton_autoplant_fraction, crop.type);

  var type = crop.type;
  // NOTE: must match simimar checks in computeNextAutoPlant()
  if(state.c_numfullgrown == 0 && fraction > 0 && (type == CROPTYPE_BRASSICA || type == CROPTYPE_BERRY)) {
    fraction = 1; // first watercress/berries allowed to be 100% (unless fully disabled) to get the game kickstarted when having 1000 seeds, using blueprints and having automaton berry% to something less than 100%
  }

  var maxcost = Res.min(res, state.res.mulr(fraction));
  var cost = crop.getCost();
  if(cost.gt(maxcost)) return false;

  // check if we can't do a better crop
  var crop2 = getHighestAffordableCropOfType(type, maxcost);
  if(crop2 && crop2.getCost().le(maxcost)) {
    crop = crop2;
    cost = crop.getCost();
  }


  res.subInPlace(cost);

  // find potentially better x,y location
  var old = state.field[y][x].cropIndex();
  if(!old < 0) return; // somethng must have changed since computeNextAutoPlant()
  var best = prefield[y][x].score;
  // simple method of determining best spot: find the one where the original crop has the most income
  for(var y2 = 0; y2 < state.numh; y2++) {
    for(var x2 = 0; x2 < state.numw; x2++) {
      var f = state.field[y2][x2];
      if(f.cropIndex() != old) continue;
      var p2 = prefield[y2][x2];
      if(p2.score > best) {
        best = p2.score;
        x = x2;
        y = y2;
      }
    }
  }

  addAction({type:ACTION_REPLACE, x:x, y:y, crop:crop, by_automaton:true, silent:true});
  return true;
}

// next chosen auto unlock, if applicable.
// type: either undefined, or object {index:upgrade id, time:time until reached given current resource gain}
var next_auto_unlock = undefined;

// compute next_auto_unlock
// this is the next unlock-upgrade that auto unlock will do.
// this must be chosen to be the first one done given the resource fraction choices, since the nextEventTime computation also uses this
function computeNextAutoUnlock() {
  next_auto_unlock = undefined;

  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = upgrades[registered_upgrades[i]];
    var u2 = state.upgrades[registered_upgrades[i]];
    if(!u.iscropunlock) continue;
    if(!u2.unlocked) continue;
    if(u2.count) continue;
    if(u.cropid == undefined) continue

    var cost = u.getCost();
    if(state.automaton_autounlock_max_cost.gtr(0) && cost.seeds.gtr(state.automaton_autounlock_max_cost)) continue;

    // how much resources willing to spend. This uses the same fractions as autoplant does.
    var advanced = state.automaton_unlocked[2] >= 2;
    var fraction_array = state.automaton_autounlock_copy_plant_fraction ? state.automaton_autoplant_fraction : state.automaton_autounlock_fraction;
    var fraction = getAutoFraction(advanced, fraction_array, crops[u.cropid].type);

    var time = computeFractionTime(cost, fraction);
    if(time == Infinity) continue;

    if(next_auto_unlock == undefined || time < next_auto_unlock.time) next_auto_unlock = {index:u.index, time:time};
    // prioritize mistletoe if close enough, so that mistletoes grow before mushrooms when player wants them in the blueprint
    if(u.index == mistletoeunlock_0 && time < 2) {
      next_auto_unlock = {index:u.index, time:time};
      break;
    }
  }
}

// res must be a copy of the available resources for all auto-actions, and will be modified in place
function autoUnlock(res) {
  if(!next_auto_unlock) return false;

  var u = upgrades[next_auto_unlock.index];

  // how much resources willing to spend
  var advanced = state.automaton_unlocked[2] >= 2;
  var fraction_array = state.automaton_autounlock_copy_plant_fraction ? state.automaton_autoplant_fraction : state.automaton_autounlock_fraction;
  var fraction = getAutoFraction(advanced, fraction_array, crops[u.cropid].type);

  var maxcost = Res.min(res, state.res.mulr(fraction));
  var cost = u.getCost();
  if(cost.gt(maxcost)) return false;
  res.subInPlace(cost);
  addAction({type:ACTION_UPGRADE, u:u.index, shift:false, by_automaton:true});

  return true;
}

// when is the next time that something happens that requires a separate update()
// run. E.g. if the time difference is 1 hour (due to closing the tab for 1 hour),
// and 10 minutes of the mist ability were remaining, then update must be broken
// in 2 parts: the first 10 minutes, and the remaining 50 minutes. This function
// will return that 10. Idem for season changes, ... The function returns the
// first one.
// the returned value is amount of seconds before the first next event
// the value used to determine current time is state.time
// TODO: tree level-ups must be added here, both ethereal and basic tree, as these affect production boost and resin income
// TODO: ethereal crops and their plant time must be added here
function nextEventTime() {
  // next season
  var time = timeTilNextSeasonUnShifted();
  var name = 'season';

  var addtime = function(time2, opt_name) {
    if(time2 < time) name = opt_name || 'other';
    time = Math.min(time, time2);
  };

  // ability times
  if((state.time - state.misttime) < getMistDuration()) addtime(getMistDuration() - state.time + state.misttime);
  if((state.time - state.suntime) < getSunDuration()) addtime(getSunDuration() - state.time + state.suntime);
  if((state.time - state.rainbowtime) < getRainbowDuration()) addtime(getRainbowDuration() - state.time + state.rainbowtime);

  // plants growing / disappearing
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      if(c) {
        if(c.type == CROPTYPE_BRASSICA) {
          // watercress needs regular updates, but don't do that when it's a end-of-life wasabi, since once it has that state it doesn't change any further, and stays forever, that'd make long game updates very slow
          var infinitelifetime = c.index == brassica_1 && state.upgrades[watercress_choice0].count != 0;
          if(!(infinitelifetime && f.growth == 0)) addtime(c.getPlantTime() * (f.growth));
        } else if(state.challenge == challenge_wither) {
          //addtime(witherDuration() * (f.growth));
          // since the income value of the crop changes over time as it withers, return a short time interval so the computation happens correctly during the few minutes the withering happens.
          // also return, no need to calculate the rest, short time intervals like this are precise enough for anything
          addtime(2);
          return time;
        } else if(f.growth < 1) {
          //addtime(c.getPlantTime() * (1 - f.growth)); // time remaining for this plant to become full grown
          addtime(2); // since v0.1.61, crops already produce while growing, non-constant, so need more updates during any crop growth now
        }
      }
    }
  }

  // ethereal plants growing
  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      var c = f.getCrop();
      if(c) {
        if(f.growth < 1) {
          addtime(c.getPlantTime() * (1 - f.growth)); // time remaining for this plant to become full grown
        }
      }
    }
  }

  // tree level up
  var treereq = treeLevelReq(state.treelevel + 1).spores.sub(state.res.spores);
  var treetime = treereq.div(gain.spores).valueOf();
  addtime(treetime, 'tree');

  // auto-upgrades
  if(autoUpgradesEnabled() && !!next_auto_upgrade) {
    addtime(next_auto_upgrade.time);
  }

  // auto-plant
  if(autoPlantEnabled() && !!next_auto_plant) {
    addtime(next_auto_plant.time);
  }

  // auto-unlock
  if(autoUnlockEnabled() && !!next_auto_unlock) {
    addtime(next_auto_unlock.time);
  }

  // take into account the changing bonus over time, until the max time is reached (but not too aften to not let this use too much CPU ticks)
  if(state.upgrades3[upgrade3_leveltime].count) {
    var time = timeAtTreeLevel(state);
    if(time < upgrade3_leveltime_maxtime) addtime(300);
  }

  return time;
}

function addAction(action) {
  if(state.paused) return;
  actions.push(action);
  // BEWARE: this should not call update(), but user must call update() after this. Reason for not doing it here is that some things add many actions in a row.
}

// This drops roughly 1 to 2 amber an hour, dropping more if tree leveling takes longer, but dropping less if tree isn't leveling for over 3 hours (not active anymore)
function maybeDropAmber() {
  var amber = Num(0);
  var do_amber = state.g_numresets > 1 && (state.treelevel >= 9 || state.treelevel == 0);
  if(do_amber) {
    var leveltime = state.time - state.lasttreeleveluptime;
    // always give amber if an hour ago, but when having slow leveling tree (indicating being at a high level, relative for current game), this can go up to twice as fast
    var reqtime = 3600;
    // TODO: make this gradual (but capped) rather than in bumps
    if(leveltime >= 300) reqtime = 1800;
    else if(leveltime >= 240) reqtime = 2000;
    else if(leveltime >= 180) reqtime = 2200;
    else if(leveltime >= 120) reqtime = 2400;
    else if(leveltime >= 60) reqtime = 2600;
    else if(leveltime >= 30) reqtime = 3000;
    var ambertime = state.time - state.lastambertime;
    if(ambertime >= reqtime) {
      // for really long tree levels, more can drop
      var amount = 1;
      // TODO: make this gradual (but capped) rather than in bumps
      if(leveltime >= 7200) amount = 3;
      else if(leveltime >= 5400) amount = 2.5;
      else if(leveltime >= 3600) amount = 2;
      else if(leveltime >= 1800) amount = 1.5;
      state.lastambertime = state.time;
      state.g_amberdrops++;
      amber = Num(amount);
    }
    if(amber.neqr(0)) showMessage('the tree dropped ' + amber.toString() + ' amber', C_AMBER, 1046741287);
  }

  if(amber.neqr(0) && state.g_res.amber.eqr(0)) {
    showRegisteredHelpDialog(36);
  }

  return amber;
}

// for misc things in UI that update themselves
// updatefun must return true if the listener must stay, false if the listener must be removed
var update_listeners = [];
function registerUpdateListener(updatefun) {
  if(update_listeners.length > 50) return;
  update_listeners.push(updatefun);
}

var prev_season = undefined;
var prev_season_gain = undefined;

var last_fullgrown_sound_time0 = 0;
var last_fullgrown_sound_time1 = 0;
var last_fullgrown_sound_time2 = 0;

var large_time_delta = false;
var large_time_delta_time = 0;
var large_time_delta_res = Res();
// for messages in case of long delta, this is remembered through multiple long-tick update calls
var global_season_changes = 0;
var global_tree_levelups = 0;

var update_prev_paused = false;
var update_prev_state_ctor_count = -1;

var inner_loop_count = 0;

// opt_ignorePause should be used for debugging only, as it can make time intervals nonsensical
var update = function(opt_ignorePause) {
  var paused_ = state.paused && !opt_ignorePause;
  var update_ui_paused = state_ctor_count != update_prev_state_ctor_count || paused_ != update_prev_paused;
  update_prev_paused = paused_;
  update_prev_state_ctor_count = state_ctor_count;

  var update_fruit_ui = false;

  if(!prefield || !prefield.length) {
    if(!paused_ || update_ui_paused) precomputeField(); // do this even before the paused check, because some UI elements use prefield
  }

  if(paused_) {
    var d = util.getTime() - state.prevtime;
    state.c_pausetime += d;
    state.g_pausetime += d;
    state.prevtime = state.time = util.getTime();

    // more things must get adjusted during pause
    // NOTE: due to pause, there are two distinct flows of time going on: the real-time clock, and the in-game clock
    // however, we only save one of them. For things that have in-game effect, that's the in-game clock
    // for some events that what is being adjusted here are things that are stored as game-time rather than real-time
    // there are also in fact two different types of game-time: time from this run, and time since start of game
    // something ethereal like ethereal tree level up uses the since-start gametime, things like misttime use the this-run gametime instead.
    // some other things are stored as real time, e.g. state.c_starttime. To get the in-game time of that one, subtract state.c_pausetime from it.
    state.misttime += d;
    state.suntime += d;
    state.rainbowtime += d;
    state.lastFernTime += d;
    state.automatontime += d;
    state.lasttreeleveluptime += d;
    state.lasttree2leveluptime += d;
    state.lastambertime += d;

    // this is for e.g. after importing a save while paused
    // TODO: try to do this only when needed rather than every tick while paused
    if(update_ui_paused) {
      updateUI2();
    }
    return;
  }

  update_prev_paused = paused_;

  var prev_large_time_delta = large_time_delta;
  var autoplanted = false;

  var undostate = undefined;
  if(actions.length > 0 && (util.getTime() - lastUndoSaveTime > minUndoTime)) {
    undostate = util.clone(state);
  }
  var store_undo = false;

  if(state.prevtime == 0) {
    state.prevtime = util.getTime();
  } else {
    // compensate for computer clock mismatch issues
    if(state.lastFernTime > state.prevtime) state.lastFernTime = state.prevtime;
    if(state.misttime > state.prevtime) state.misttime = 0;
    if(state.suntime > state.prevtime) state.suntime = 0;
    if(state.rainbowtime > state.prevtime) state.rainbowtime = 0;
    if(state.lasttreeleveluptime > state.prevtime) state.lasttreeleveluptime = state.prevtime;
    if(state.lastambertime > state.prevtime) state.lastambertime = state.prevtime;
  }

  var prevseasongain = undefined;

  var negative_time_used = false;

  var num_season_changes = 0; // num season changes during this loop of update(), as oppoosed to global_season_changes which can span multiple long-tick updates

  var oldres = Res(state.res);
  var oldtime = state.prevtime; // time before even multiple updates from the loop below happened

  var do_transcend = undefined;

  var done = false;
  var numloops = 0;
  for(;;) { ////////////////////////////////////////////////////////////////////
    if(done) break;
    if(numloops++ > 500) break;
    inner_loop_count++;

    /*
    During an update, there's a time interval in which we operate.
    The time interval represents a period of time where properties (season, tree level,...) are constant.
    The time given by nextEventTime() indicates when a next event happens and properties change.
    So if t0 is the beginning of the interval, then t1 = t0 + nextEventTime() is the end, and d = t1 - t0 the time of that interval, deciding how much resources you get based on gain/s during this interval

    state.prevtime represents t0. state.time is set to state.prevtime. so state.time and state.prevtime are equal during the update, but time will be used and prevtime may already be set to the next one for state keeping. state.prevtime is the one getting saved and remembered, state.time is the one used for computations such as getSeason(), but during the update loop, they're the same, they're different variables outside of update for bookkeeping.
    */

    var autores = Res(state.res);

    var did_autoplant = false;
    var did_autounlock = false;

    if(autoUnlockEnabled()) {
      computeNextAutoUnlock();
      did_autounlock = autoUnlock(autores);
    }

    if(autoPlantEnabled()) {
      computeNextAutoPlant();
      did_autoplant = autoPlant(autores);
    }

    if(autoChoiceEnabled()) {
      doNextAutoChoice();
    }

    if(autoUpgradesEnabled()) {
      // computeNextAutoUpgrade is used both for autoUpgrade, and for nextEventTime. The autoUpgrade function may do nothing now, but nextEventTime can compute when autoUpgrade will happen given the current income
      computeNextAutoUpgrade();
      // don't do this if an autoplant or unlock was done: when just autoplanting, it's more useful if it finishes planting all those crops, before spending seeds trying to upgrade it
      if(!did_autoplant && !did_autounlock) autoUpgrade(autores);
    }

    // this function is simple and light enough that it can just be called every time. It can depend on changes mid-game hence needs to be updated regularly.
    unlockTemplates();

    var nexttime = util.getTime(); // in seconds. This is nexttime compared to the current state.time/state.prevtime

    var d; // time delta
    if(state.prevtime == 0) {
      d = 0;
    } else if(state.prevtime > nexttime) {
      // time was in the future. See description of negative_time in state.js for more info.
      var future = state.prevtime - nexttime;
      state.negative_time += future;
      state.total_negative_time += future;
      state.max_negative_time = Math.max(state.max_negative_time, future);
      state.last_negative_time = future;
      state.num_negative_time++;
      d = 0;
    } else {
      d = nexttime - state.prevtime;

      // when negative time is registered, then you don't get large time deltas anymore.
      // choosing 3000 seconds (something close enough to, but less than, an hour) for this: the most common scenario where negative time happens is switching between two computers
      // with different UTC time set. That difference will be at least an hour. Optimally the compensation wuold only happen when
      // loading the savegame on the future computer, where there'll then at leats be an hour of difference. The compensation
      // should not happen when keeping the game in a background tab for 5 minutes.
      if(d > 3000 && state.negative_time > 0) {
        var neg = Math.min(state.negative_time, d);
        d -= neg;
        state.negative_time -= neg;
        negative_time_used = true;
      }
    }

    var is_long = d > 2;

    var next = 0;

    var d0 = d;
    state.time = state.prevtime; // the computations happen with the state (getSeason() etc...) at start of interval. the end of interval is when things (season, ...) may change, but that is not during this but during next update computation

    if(is_long) {
      next = nextEventTime() + 1; // for numerical reasons, ensure it's not exactly at the border of the event
      if(next < 2) next = 2; // ensure there is at least some progress.
      if(numloops > 10 && next < 5) next = 5; // speed up computation if a lot is happening, at the cost of some precision
      if(numloops > 50 && next < 10) next = 10; // speed up computation if a lot is happening, at the cost of some precision
    }

    if(d > next && is_long) {
      // reduce the time delta to only be up to the next event
      d = next;
      nexttime = state.prevtime + d;
      done = false;
    } else {
      // next event is after the current util.getTime(), so the update loop is done after this one
      done = true;
    }
    // the current time for computations below is at the beginning of the current interval
    state.time = state.prevtime;
    // set prevtime ready for the next update tick
    state.prevtime = nexttime;

    /*
    season_will_change computes that season will change next tick. This is one tick too early, but reliable, even across multiple sessions where game was closed and reopened in between. this is the one to use for deletion token get and num season stat computations
    num_season_changes (integer) computes that the season changed during this tick. This may miss some events if game was closed/reopened at some very particular time. But this one will have the correct prev_season_gain and current gain, so is the one to use for the message that shows resources before and after season change
    */
    var current_season = getSeasonAt(state.time);
    var season_will_change = current_season != getSeasonAt(nexttime);
    if(current_season != prev_season && prev_season != undefined) num_season_changes++; // TODO: check if this can't be combined with the "global_season_changes++" case below and if this really needs a different condition than that one
    prev_season = current_season;

    if(season_will_change) {
      global_season_changes++;
    }

    if(state.seasonshifted && (getSeasonAtUnshifted(state.time) != getSeasonAtUnshifted(state.prevtime) || season_will_change)) state.seasonshifted = 0;


    state.g_runtime += d;
    state.c_runtime += d;

    ////////////////////////////////////////////////////////////////////////////


    // gain added to the player's actual resources during this tick (virtualgain is per second, actualgain is per this tick)
    // includes also one-time events like fern
    // excludes costs
    // so best description is: "all resources added this tick"
    var actualgain = new Res();

    var clickedfern = false; // if fern just clicked, don't do the next fern computation yet, since #resources is not yet taken into account
    var clickedpresent = false;

    var upgrades_done = false;
    var upgrades2_done = false;

    // whether the game is fast forwarding a long AFK, and thus doesn't do active actions like weather, picking fern or refreshing watercress
    var fast_forwarding = (nexttime - state.time > 1);

    // action
    while(actions.length) {
      var action = actions[0];
      actions.shift();
      var type = action.type;
      if(type == ACTION_UPGRADE) {
        if(fast_forwarding && !action.by_automaton) continue;

        if(state.upgrades_new) {
          // applied upgrade, must have been from side panel, do not show upgrade tab in red anymore
          for(var j = 0; j < registered_upgrades.length; j++) {
            var u = state.upgrades[registered_upgrades[j]];
            if(u.unlocked && !u.seen) u.seen = true;
          }
        }
        var u = upgrades[action.u];
        var shift = action.shift && (u.maxcount != 1);
        var amount_wanted = action.num ? action.num : 1; // if shift, amount_wanted is effectively infinite
        var num = 0;
        var res_before = Res(state.res);
        for(;;) {
          var cost = u.getCost();
          if(state.challenge == challenge_noupgrades && isNoUpgrade(u)) {
            break; // not allowed to do such upgrade during the no upgrades challenge
          } else if(state.res.lt(cost)) {
            if(!(shift && num > 0)) {
              showMessage('not enough resources for upgrade: have ' + Res.getMatchingResourcesOnly(cost, state.res).toString() +
                  ', need ' + cost.toString() + ' (' + getCostAffordTimer(cost) + ')', C_INVALID, 0, 0);
            }
            break;
          } else if(!u.canUpgrade()) {
            if(!(shift && num > 0)) {
              showMessage('this upgrade is not currently available', C_INVALID, 0, 0);
            }
            break;
          } else {
            state.res.subInPlace(cost);
            u.fun(action.choice);
            num++;
            var message = 'upgraded: ' + u.getName() + ', consumed: ' + cost.toString();
            if(u.is_choice) {
              message += '. Chosen: ' + ((state.upgrades[u.index].count == 1) ? u.choicename_a : u.choicename_b);
            }
            if(u.iscropunlock) {
              var cost = crops[u.cropid].getCost();
              message += '. Planting cost: ' + cost.toString() + ' (' + getCostAffordTimer(cost) + ')';
            }
            if(!shift && !action.by_automaton) showMessage(message);
            if(!action.by_automaton) store_undo = true;
            if(u.iscropunlock && !action.by_automaton) {
              state.lastPlanted = u.cropid;
            }
            state.c_numupgrades++;
            state.g_numupgrades++;
            if(action.by_automaton) {
              state.c_numautoupgrades++;
              state.g_numautoupgrades++;
            }
          }
          if(!shift && num >= amount_wanted) break;
          if(u.isExhausted()) break;
          if(num > 1000) break; // this is a bit long, infinite loop?
        }
        if(shift && num && !action.by_automaton) {
          var total_cost = res_before.sub(state.res);
          if(num == 1) {
            showMessage('upgraded: ' + u.getName() + ', consumed: ' + total_cost.toString());
          } else {
            showMessage('upgraded ' + u.name + ' ' + num + ' times to ' + u.getName() + ', consumed: ' + total_cost.toString());
          }
        }
        if(num) {
          upgrades_done = true;
          if(action.u == berryunlock_0) {
            showRegisteredHelpDialog(3);
          }
          if(action.u == mushunlock_0) {
            showRegisteredHelpDialog(19);
          }
          if(action.u == flowerunlock_0) {
            showRegisteredHelpDialog(20);
          }
          if(action.u == beeunlock_0) {
            showRegisteredHelpDialog(27);
          }
          if(action.u == nettle_0) {
            showRegisteredHelpDialog(21);
          }
          if(action.u == mistletoeunlock_0) {
            if(state.g_numresets > 0) {
              showRegisteredHelpDialog(17);
            }
          }
        }
      } else if(type == ACTION_UPGRADE2) {
        if(fast_forwarding) continue;

        var u = upgrades2[action.u];
        var cost = u.getCost();
        if(state.res.lt(cost)) {
          showMessage('not enough resources for ethereal upgrade: have ' + Res.getMatchingResourcesOnly(cost, state.res).toString() +
              ', need ' + cost.toString(), C_INVALID, 0, 0);
        } else if(!u.canUpgrade()) {
          showMessage('this ethereal upgrade is not currently available', C_INVALID, 0, 0);
        } else  {
          state.res.subInPlace(cost);
          u.fun();
          showMessage('Ethereal upgrade applied: ' + u.getName() + ', consumed: ' + cost.toString());
          store_undo = true;
          state.g_numupgrades2++;
        }
        upgrades2_done = true;
      } else if(type == ACTION_UPGRADE3) {
        if(fast_forwarding) continue;

        var s = stages3[action.s];
        var s2 = state.stages3[action.s];
        var b = action.b; // which branch (left: 0, middle: 1, right: 2)
        var d = action.d; // depth in the branch
        var ok = true;
        var us = (b == 0) ? s.upgrades0  : ((b == 1) ? s.upgrades1 : s.upgrades2);
        var buyable = squirrelUpgradeBuyable(s, s2, b, d);

        var bought = buyable == 0;
        var gated = buyable == 2;
        var canbuy = buyable == 1;
        var next = buyable == 3;
        var unknown = buyable >= 4;

        if(!haveSquirrel()) {
          showMessage('Don\'t have squirrel', C_INVALID);
          ok = false;
        } else if(b < 0 || b > 2) {
          showMessage('Invalid branch', C_ERROR);
          ok = false;
        } else if(!canbuy) {
          if(gated) {
            showMessage('Cannot buy this upgrade yet, it is gated: you must buy all squirrel upgrades that come before this, including side branches above, before this one unlocks.', C_INVALID);
          } else {
            showMessage('Not available for buy', C_INVALID);
          }
          // the depth must be exactly equal to the amount of upgrades done so far in this branch
          ok = false;
        } else if(d >= us.length) {
          showMessage('Index out of range', C_ERROR);
          // nonexisting upgrade for this stage
          ok = false;
        }

        var nuts = getNextUpgrade3Cost();
        if(ok) {
          if(state.res.nuts.lt(nuts)) {
            ok = false;
            showMessage('not enough resources for the next squirrel upgrade' +
                        ': have: ' + state.res.nuts.toString(Math.max(5, Num.precision)) +
                        ', need: ' + nuts.toString(Math.max(5, Num.precision)) +
                        ' (' + getCostAffordTimer(Res({nuts:nuts})) + ')',
                        C_INVALID, 0, 0);
          }
        }

        if(ok) {
          var u = upgrades3[us[d]];
          var u2 = state.upgrades3[us[d]];
          u2.count++;
          s2.num[b]++;
          s2.seen[b] = Math.max(s2.seen[b], s2.num[b]);
          state.res.nuts.subInPlace(nuts);
          state.upgrades3_spent.addInPlace(nuts);
          state.g_numupgrades3++;
          showMessage('Purchased squirrel upgrade: ' + u.name);

          state.upgrades3_count++; // this is a derived state computed in computeDerived, but update it now here as well so that if there are multiple upgrade3 action in a row, the gated checks work correctly

          if(u.index == upgrade3_fruitmix || u.index == upgrade3_fruitmix2) showRegisteredHelpDialog(37);

          if(u.fun) u.fun();

          store_undo = true;
        }
      } else if(type == ACTION_RESPEC3) {
        if(fast_forwarding) continue;

        var ok = true;
        if(!haveSquirrel()) {
          ok = false;
        } else if(state.respec3tokens < 1) {
          showMessage('Cannot respec, no respec token available. It\'s possible to get one in the amber tab.',
                      C_INVALID, 0, 0);
          ok = false;
        }

        if(ok) {
          state.upgrades3 = [];
          for(var i = 0; i < registered_upgrades3.length; i++) {
            state.upgrades3[registered_upgrades3[i]] = new Upgrade3State();
          }
          var new_stages3 = [];
          for(var i = 0; i < stages3.length; i++) {
            new_stages3[i] = new Stage3State();
            if(state.stages3[i]) {
              for(var j = 0; j < new_stages3[i].seen.length; j++) new_stages3[i].seen[j] = state.stages3[i].seen[j];
            }
          }
          state.stages3 = new_stages3;

          state.g_numrespec3++;
          state.res.nuts.addInPlace(state.upgrades3_spent);
          state.upgrades3_spent = Num(0);
          state.respec3tokens--;

          for(var i = 0; i < state.upgrades3.length; i++) {
            state.upgrades3[i] = new Upgrade3State();
          }
          showMessage('Reset all squirrel upgrades and gave all nuts back. Consumed 1 squirrel respec token.');

          store_undo = true;
        }
      } else if(type == ACTION_AMBER) {
        if(fast_forwarding) continue;

        var ok = true;

        var cost = Num(0);
        if(action.effect == AMBER_RESPEC3) {
          cost = ambercost_respec3;
        }
        if(action.effect == AMBER_PROD) {
          if(state.amberprod) {
            showMessage('Already active.', C_INVALID, 0, 0);
            ok = false;
          }
          cost = ambercost_prod;
        }
        if(action.effect == AMBER_LENGTHEN) {
          if(state.amberseason) {
            showMessage('Already used this season.', C_INVALID, 0, 0);
            ok = false;
          }
          if(timeTilNextSeason() / 3600 + 1 >= 24) {
            // TODO: support this. This requires remembering more state in the savegame, to distinguish that the season should already be the next one despite being before this 24h interval
            showMessage('Extending season did not work, please wait around an hour and try again, when the next season is less than 23 hours away: the game currently doesn\'t support the next season being more than 24 hours away, and this action adds 1 hour to the current season duration.', C_INVALID, 0, 0);
            ok = false;
          }
          cost = ambercost_lengthen;
        }
        if(action.effect == AMBER_SHORTEN) {
          if(state.amberseason) {
            showMessage('Already used this season.', C_INVALID, 0, 0);
            ok = false;
          }
          cost = ambercost_shorten;
        }
        cost = new Res({amber:cost});

        if(ok && state.res.lt(cost)) {
          ok = false;
          showMessage('not enough resources: have: ' + Res.getMatchingResourcesOnly(cost, state.res).toString(Math.max(5, Num.precision)) +
                      ', need: ' + cost.toString(Math.max(5, Num.precision)), C_INVALID, 0, 0);
        }

        if (ok) {
          if(action.effect == AMBER_RESPEC3) {
            state.respec3tokens++;
            showMessage('One squirrel respec token added, now have: ' + state.respec3tokens, C_AMBER, 2215651, 1);
          }
          if(action.effect == AMBER_PROD) {
            state.amberprod = true;
            showMessage('Amber production bonus activated for the remainder of this run', C_AMBER, 2215651, 1);
          }
          if(action.effect == AMBER_LENGTHEN) {
            if(timeTilNextSeason() / 3600 + 1 >= 24) {
              state.seasonshifted = 1;
            }
            state.amberseason = true;
            state.seasonshift += 3600;
          }
          if(action.effect == AMBER_SHORTEN) {
            // subtract less than an hour if this will already bring us into the next season sooner
            var sub = Math.min(3600, timeTilNextSeason());
            state.amberseason = true;
            state.seasonshift -= sub;
          }
          state.res.subInPlace(cost);

          if(!state.g_amberbuy[action.effect]) state.g_amberbuy[action.effect] = 0;
          state.g_amberbuy[action.effect]++;
          store_undo = true;
        }
      } else if(type == ACTION_PLANT_BLUEPRINT) {
        if(fast_forwarding) continue;

        plantBluePrint(action.blueprint, false);
      } else if(type == ACTION_PLANT || type == ACTION_DELETE || type == ACTION_REPLACE) {
        if(fast_forwarding && !action.by_automaton) continue;

        // These 3 actions are handled together here, to be able to implement replace:
        // this to be able, for replace, to do all the checks for both delete and plant first, and then perform the actions, in an atomic way
        var f = state.field[action.y][action.x];

        var orig_growth = f.growth;
        var orig_brassica = f.hasCrop() && f.getCrop().type == CROPTYPE_BRASSICA;

        if(action.by_automaton) {
          state.automatonx = action.x;
          state.automatony = action.y;
          state.automatontime = state.time;
          autoplanted = true;
        }

        var recoup = undefined;

        if(type == ACTION_DELETE || type == ACTION_REPLACE) {
          if(f.hasCrop()) {
            var c = f.getCrop();
            recoup = c.getRecoup();
            if(f.growth < 1 && c.type != CROPTYPE_BRASSICA && state.challenge != challenge_wither) recoup = c.getCost(-1);
          } else {
            recoup = Res();
          }
        }

        var ok = true;

        if(ok && state.challenge == challenge_thistle && f.hasCrop() && f.getCrop().index == nettle_1) {
          showMessage('Cannot remove thistles during the thistle challenge', C_INVALID, 0, 0);
          ok = false;
        }
        if(ok && state.challenge == challenge_thistle && type == ACTION_PLANT && action.crop.type == nettle_1) {
          showMessage('Cannot plant thistles during the thistle challenge', C_INVALID, 0, 0);
          ok = false;
        }

        if(ok && type == ACTION_REPLACE) {
          if(action.crop && f.index == CROPINDEX + action.crop.index) {
            showMessage('Already have this crop here', C_INVALID, 0, 0);
            ok = false;
          }
        }

        if(ok && (type == ACTION_DELETE || type == ACTION_REPLACE)) {
          var is_brassica = f.hasCrop() && f.getCrop().type == CROPTYPE_BRASSICA;
          // the f.growth >= 1 is because growing crops used to produce nothing. now they do, so don't allow that anymore.
          if(state.challenge == challenge_nodelete && !is_brassica /*&& f.growth >= 1*/ && !f.isTemplate()) {
            showMessage('Cannot delete or upgrade crops during the nodelete challenge. Ensure to leave open field spots for higher level plants.', C_INVALID, 0, 0);
            ok = false;
          } else if(state.challenge == challenge_wither && !is_brassica && !f.isTemplate()) {
            var more_expensive_same_type = type == ACTION_REPLACE && f.hasCrop() && action.crop.cost.gt(f.getCrop().cost) && action.crop.type == f.getCrop().type;
            if(!more_expensive_same_type) {
              showMessage('Cannot delete or downgrade crops during the wither challenge, but they\'ll naturally disappear over time. However, you can replace crops with more expensive crops (see the replace dialog).', C_INVALID, 0, 0);
              ok = false;
            }
          }
        }

        if(ok && (type == ACTION_PLANT || type == ACTION_REPLACE)) {
          var c = action.crop;
          var cost = c.getCost();
          if(type == ACTION_REPLACE && f.hasCrop()) cost = cost.sub(recoup);
          if(type != ACTION_REPLACE && f.hasCrop()) {
            showMessage('field already has crop', C_INVALID, 0, 0);
            ok = false;
          } else if(f.index != 0 && f.index != FIELD_REMAINDER && !f.hasCrop()) {
            showMessage('field already has something', C_INVALID, 0, 0);
            ok = false;
          } else if(!state.crops[c.index].unlocked) {
            if(action.shiftPlanted) {
              state.lastPlanted = -1;
              showMessage(shiftClickPlantUnset, C_INVALID, 0, 0);
            }
            ok = false;
          } else if(state.res.lt(cost)) {
            showMessage('not enough resources to plant ' + c.name +
                        ': have: ' + Res.getMatchingResourcesOnly(cost, state.res).toString(Math.max(5, Num.precision)) +
                        ', need: ' + cost.toString(Math.max(5, Num.precision)) +
                        ' (' + getCostAffordTimer(cost) + ')',
                        C_INVALID, 0, 0);
            ok = false;
          } else if(c.index == squirrel_0 && state.cropcount[squirrel_0]) {
            showMessage('already have squirrel, cannot place more', C_INVALID, 0, 0);
            ok = false;
          } else if(c.type == CROPTYPE_NUT && !c.istemplate && tooManyNutsPlants(type == ACTION_REPLACE && f.hasRealCrop() && f.getCrop().type == CROPTYPE_NUT)) {
            showMessage('you can only plant max 1 nut plant in the field', C_INVALID, 0, 0);
            ok = false;
          }
        }

        if(ok && (type == ACTION_DELETE || type == ACTION_REPLACE)) {
          if(f.hasCrop()) {
            var c = f.getCrop();
            if(state.challenge != challenge_wither && !c.istemplate) {
              if(f.growth < 1 && c.type != CROPTYPE_BRASSICA) {
                if(!action.silent) showMessage('plant was still growing, full refund given', C_UNDO, 1197352652);
                state.g_numplanted--;
                state.c_numplanted--;
              } else {
                state.g_numunplanted++;
                state.c_numunplanted++;
                if(action.by_automaton) {
                  state.c_numautodelete++;
                  state.g_numautodelete++;
                }
              }
            }
            f.index = 0;
            f.growth = 0;
            computeDerived(state); // need to recompute this now to get the correct "recoup" cost of a plant which depends on the derived stat
            if(c.type == CROPTYPE_BRASSICA) {
              if(!action.silent) showMessage('deleted ' + c.name + '. Since this is a short-lived plant, nothing is refunded');
            } else {
              state.res.addInPlace(recoup);
              if(!action.silent) showMessage('deleted ' + c.name + ', got back: ' + recoup.toString());
            }
            if(!action.by_automaton) store_undo = true;
          } else if(f.index == FIELD_REMAINDER) {
            f.index = 0;
            f.growth = 0;
            if(!action.silent) showMessage('cleared watercress remainder');
          }
        }

        if(ok && (type == ACTION_PLANT || type == ACTION_REPLACE)) {
          var c = action.crop;
          var cost = c.getCost();
          if(state.challenge != challenge_wither && !c.istemplate) {
            if(c.type == CROPTYPE_BRASSICA) {
              state.g_numplantedbrassica++;
              state.c_numplantedbrassica++;
            } else {
              state.g_numplanted++;
              state.c_numplanted++;
              if(action.by_automaton) {
                state.c_numautoplant++;
                state.g_numautoplant++;
              }
            }
          }
          state.res.subInPlace(cost);
          f.index = c.index + CROPINDEX;
          f.growth = 0;
          if(c.type == CROPTYPE_BRASSICA) {
            var automated = (type == ACTION_REPLACE && action.by_automaton && orig_brassica);
            if(automated) f.growth = orig_growth;
            else f.growth = 1;
          }
          if(state.challenge == challenge_wither) f.growth = 1;
          computeDerived(state); // correctly update derived stats based on changed field state
          if(!action.by_automaton) store_undo = true;
          var nextcost = c.getCost(0);
          if(!action.silent) showMessage('planted ' + c.name + '. Consumed: ' + cost.toString() + '. Next costs: ' + nextcost + ' (' + getCostAffordTimer(nextcost) + ')');
          if(state.c_numplanted + state.c_numplantedbrassica <= 1 && !c.istemplate && state.g_numresets < 5) {
            showMessage('Keep planting more crops on other field cells to get more income', C_HELP, 28466751);
          }
        }
      } else if(type == ACTION_PLANT2 || type == ACTION_DELETE2 || type == ACTION_REPLACE2) {
        if(fast_forwarding) continue;

        // These 3 actions are handled together here, to be able to implement replace:
        // this to be able, for replace, to do all the checks for both delete and plant first, and then perform the actions, in an atomic way
        var f = state.field2[action.y][action.x];

        var recoup = undefined;

        var freedelete = freeDelete2(action.x, action.y);
        var freetoken = (type == ACTION_REPLACE2 && f.hasCrop() && f.getCrop().type == action.crop.type);
        var sametypeupgrade = (type == ACTION_REPLACE2 && f.hasCrop() && f.getCrop().type == action.crop.type && action.crop.tier > f.getCrop().tier);
        if(f.hasCrop() && f.getCrop().istemplate) freedelete = true;

        if(type == ACTION_DELETE2 || type == ACTION_REPLACE2) {
          if(f.hasCrop()) {
            var c = f.getCrop();
            recoup = c.getRecoup();
            if(freedelete || f.growth < 1) recoup = c.getCost(-1);
          } else {
            recoup = Res();
          }
        }

        var ok = true;

        if(ok && type == ACTION_REPLACE2) {
          if(action.crop && f.index == CROPINDEX + action.crop.index) {
            showMessage('Already have this crop here', C_INVALID, 0, 0);
            ok = false;
          }
        }

        if(ok && (type == ACTION_DELETE2 || type == ACTION_REPLACE2)) {
          var remstarter = null; // remove starter resources that were gotten from this fern when deleting it
          if(f.cropIndex() == fern2_0) remstarter = getStarterResources().sub(getStarterResources(undefined, fern2_0));
          if(f.cropIndex() == fern2_1) remstarter = getStarterResources().sub(getStarterResources(undefined, fern2_1));
          if(!freedelete && !freetoken && state.delete2tokens <= 0 && f.hasCrop()) {
            showMessage('cannot delete ' + f.getCrop().name + ': must have ethereal deletion tokens to delete ethereal crops. You get ' + getDelete2PerSeason() + ' new such tokens per season (a season lasts 1 real-life day)' , C_INVALID, 0, 0);
            ok = false;
          } else if(!freedelete && f.justplanted && !sametypeupgrade) {
            // the growth >= 1 check does allow deleting if it wasn't fullgrown yet, as a quick undo, but not for the crops with very fast plant time such as those that give starting cash
            showMessage('cannot delete ' + f.getCrop().name + ': this ethereal crop was planted during this transcension. Must transcend at least once.', C_INVALID, 0, 0);
            ok = false;
          } else if(f.cropIndex() == fern2_0 && state.res.lt(remstarter)) {
            showMessage('cannot delete: must have at least the starter seeds which this crop gave to delete it, they will be forfeited.', C_INVALID, 0, 0);
            ok = false;
          }
        }

        if(ok && (type == ACTION_PLANT2 || type == ACTION_REPLACE2)) {
          var c = action.crop;
          var cost = c.getCost();
          if(type == ACTION_REPLACE2 && f.hasCrop()) cost = cost.sub(recoup);
          if(type != ACTION_REPLACE2 && f.hasCrop()) {
            showMessage('field already has crop', C_INVALID, 0, 0);
            ok = false;
          } else if(f.index != 0 && !f.hasCrop()) {
            showMessage('field already has something', C_INVALID, 0, 0);
            ok = false;
          } else if(!state.crops2[c.index].unlocked) {
            if(action.shiftPlanted) {
              state.lastPlanted2 = -1;
              showMessage(shiftClickPlantUnset, C_INVALID, 0, 0);
            }
            ok = false;
          } else if(state.res.lt(cost)) {
            showMessage('not enough resources to plant ' + c.name + ': have: ' + Res.getMatchingResourcesOnly(cost, state.res).toString(Math.max(5, Num.precision)) +
                        ', need: ' + cost.toString(Math.max(5, Num.precision)), C_INVALID, 0, 0);
            ok = false;
          } else if(c.index == automaton2_0 && state.crop2count[automaton2_0]) {
            showMessage('already have automaton, cannot place more', C_INVALID, 0, 0);
            ok = false;
          } else if(c.index == squirrel2_0 && state.crop2count[squirrel2_0]) {
            showMessage('already have squirrel, cannot place more', C_INVALID, 0, 0);
            ok = false;
          }
        }

        if(ok && (type == ACTION_DELETE2 || type == ACTION_REPLACE2)) {
          var c = crops2[f.cropIndex()];
          if(f.cropIndex() == fern2_0) {
            state.res.subInPlace(remstarter);
            state.g_res.subInPlace(remstarter);
            state.c_res.subInPlace(remstarter);
          }
          if(f.growth < 1) {
            state.g_numplanted2--;
          }
          if(freedelete) {
            if(f.growth < 1) {
              if(!action.silent) showMessage('plant was still growing, ' + recoup.toString() + ' refunded and no delete token used', C_UNDO, 1624770609);
            } else {
              if(!action.silent) showMessage('this crop is free to delete, ' + recoup.toString() + ' refunded and no delete token used', C_UNDO, 1624770609);
            }
          } else if(freetoken) {
            if(!action.silent) showMessage('replaced crop with same type, so no ethereal delete token used');
          } else {
            state.g_numunplanted2++;
            if(state.delete2tokens > 0) {
              state.delete2tokens--;
            }
            if(!action.silent) showMessage('deleted ethereal ' + c.name + ', got back ' + recoup.toString() + ', used 1 ethereal deletion token, ' + state.delete2tokens + ' tokens left');
          }
          f.index = 0;
          f.growth = 0;
          computeDerived(state); // need to recompute this now to get the correct "recoup" cost of a plant which depends on the derived stat
          state.res.addInPlace(recoup);

          store_undo = true;
        }

        if(ok && (type == ACTION_PLANT2 || type == ACTION_REPLACE2)) {
          var c = action.crop;
          var cost = c.getCost();
          var finalcost = cost;
          if(type == ACTION_REPLACE2 && !!recoup) finalcost = cost.sub(recoup);
          showMessage('planted ethereal ' + c.name + '. Consumed: ' + finalcost + '. Next costs: ' + c.getCost(1));
          state.g_numplanted2++;
          state.res.subInPlace(cost);
          f.index = c.index + CROPINDEX;
          f.growth = 0;
          f.justplanted = true;
          if(f.cropIndex() == fern2_0) {
            var extrastarter = getStarterResources(fern2_0).sub(getStarterResources());
            state.res.addInPlace(extrastarter);
            state.g_res.addInPlace(extrastarter);
            state.c_res.addInPlace(extrastarter);
          }
          if(f.cropIndex() == fern2_1) {
            var extrastarter = getStarterResources(fern2_1).sub(getStarterResources());
            state.res.addInPlace(extrastarter);
            state.g_res.addInPlace(extrastarter);
            state.c_res.addInPlace(extrastarter);
          }
          if(f.cropIndex() == fern2_2) {
            var extrastarter = getStarterResources(fern2_2).sub(getStarterResources());
            state.res.addInPlace(extrastarter);
            state.g_res.addInPlace(extrastarter);
            state.c_res.addInPlace(extrastarter);
          }
          if(f.cropIndex() == fern2_3) {
            var extrastarter = getStarterResources(fern2_3).sub(getStarterResources());
            state.res.addInPlace(extrastarter);
            state.g_res.addInPlace(extrastarter);
            state.c_res.addInPlace(extrastarter);
          }
          if(c.index == automaton2_0) {
            if(!state.automaton_unlocked[0]) {
              state.automaton_unlocked[0] = 1;
              showMessage('Automation of choice upgrades unlocked!', C_AUTOMATON, 1067714398);
            }
          }
          computeDerived(state); // correctly update derived stats based on changed field state
          store_undo = true;
        }
      } else if(type == ACTION_FERN) {
        if(fast_forwarding) continue;

        if(state.fern && state.fernx == action.x && state.ferny == action.y) {
          clickedfern = true;
          // actual giving of resources done further below when clickedfern == true
          state.g_numferns++;
          state.c_numferns++;
          // store undo for fern too, because resources from fern can trigger auto-upgrades
          store_undo = true;
        }
      } else if(type == ACTION_PRESENT) {
        if(fast_forwarding) continue;

        if(state.present && state.presentx == action.x && state.presenty == action.y) {
          clickedpresent = true;
          state.g_numpresents++;
          store_undo = true;
        }
      } else if(type == ACTION_ABILITY) {
        if(fast_forwarding) continue;

        var a = action.ability;
        var mistd = state.time - state.misttime;
        var sund = state.time - state.suntime;
        var rainbowd = state.time - state.rainbowtime;
        var already_ability = false;
        if(mistd < getMistDuration() || sund < getSunDuration() || rainbowd < getRainbowDuration()) already_ability = true;
        if(a == 0) {
          if(!state.upgrades[upgrade_mistunlock].count) {
            // not possible, ignore
          } else if(mistd < getMistWait()) {
            showMessage(mistd < getMistDuration() ? 'mist is already active' : 'mist is not ready yet', C_INVALID, 0, 0);
          } else if(already_ability) {
            showMessage('there already is an active weather ability', C_INVALID, 0, 0);
          } else {
            state.misttime = state.time;
            showMessage('mist activated, mushrooms produce +' + getMistSporesBoost().toPercentString() + ' more spores, consume ' + getMistSeedsBoost().rsub(1).toPercentString() + ' less seeds, and aren\'t negatively affected by winter');
            store_undo = true;
            state.c_numabilities++;
            state.g_numabilities++;
          }
        } else if(a == 1) {
          if(!state.upgrades[upgrade_sununlock].count) {
            // not possible, ignore
          } else if(sund < getSunWait()) {
            showMessage(sund < getSunDuration() ? 'sun is already active' : 'sun is not ready yet', C_INVALID, 0, 0);
          } else if(already_ability) {
            showMessage('there already is an active weather ability', C_INVALID, 0, 0);
          } else {
            state.suntime = state.time;
            showMessage('sun activated, berries get a +' + getSunSeedsBoost().toPercentString()  + ' boost and aren\'t negatively affected by winter');
            store_undo = true;
            state.c_numabilities++;
            state.g_numabilities++;
          }
        } else if(a == 2) {
          if(!state.upgrades[upgrade_rainbowunlock].count) {
            // not possible, ignore
          } else if(rainbowd < getRainbowWait()) {
            showMessage(rainbowd < getRainbowDuration() ? 'rainbow is already active' : 'rainbow is not ready yet', C_INVALID, 0, 0);
          } else if(already_ability) {
            showMessage('there already is an active weather ability', C_INVALID, 0, 0);
          } else {
            state.rainbowtime = state.time;
            showMessage('rainbow activated, flowers get a +' + getRainbowFlowerBoost().toPercentString() + ' boost and aren\'t negatively affected by winter');
            store_undo = true;
            state.c_numabilities++;
            state.g_numabilities++;
          }
        }
      } else if(type == ACTION_FRUIT_SLOT) {
        if(fast_forwarding) continue;

        var f = action.f;
        if(action.precise_slot != undefined) {
          var to = action.precise_slot;
          var from = f.slot;

          var ok = true;
          if(to < 100 && from >= 100 && state.fruit_stored.length >= state.fruit_slots) {
            ok = false;
            showMessage('stored fruits already full, move one out of there to sacrificial pool first to make room', C_INVALID, 0, 0);
          } else if(to < 100 && to >= state.fruit_slots) {
            ok = false;
          }

          if(ok) {
            if(from < 100) {
              for(var i = from; i + 1 < state.fruit_stored.length; i++) {
                state.fruit_stored[i] = state.fruit_stored[i + 1];
                if(state.fruit_stored[i]) state.fruit_stored[i].slot = i;
              }
              state.fruit_stored.length--;
            } else {
              for(var i = from - 100; i + 1 < state.fruit_sacr.length; i++) {
                state.fruit_sacr[i] = state.fruit_sacr[i + 1];
                if(state.fruit_sacr[i]) state.fruit_sacr[i].slot = i;
              }
              state.fruit_sacr.length--;
            }
            if(to < 100) {
              while(to > state.fruit_stored.length) to--;
              for(var i = state.fruit_stored.length; i > to; i--) {
                state.fruit_stored[i] = state.fruit_stored[i - 1];
                if(state.fruit_stored[i]) state.fruit_stored[i].slot = i;
              }
              state.fruit_stored[to] = f;
              f.slot = to;
            } else {
              var to2 = to - 100;
              while(to2 > state.fruit_sacr.length) to2--;
              for(var i = state.fruit_sacr.length; i > to2; i--) {
                state.fruit_sacr[i] = state.fruit_sacr[i - 1];
                if(state.fruit_sacr[i]) state.fruit_sacr[i].slot = i;
              }
              state.fruit_sacr[to2] = f;
              f.slot = to;
            }
            store_undo = true; // for same reason as in ACTION_FRUIT_ACTIVE
          }
        } else {
          var slottype = action.slot; // 0:stored, 1:sacrificial
          var currenttype = (f.slot < 100) ? 0 : 1;
          if(slottype == currenttype) {
            // nothing to do
          } else if(slottype == 0) {
            if(state.fruit_stored.length >= state.fruit_slots) {
              showMessage('stored slots already full', C_INVALID, 0, 0);
            } else {
              var slot = state.fruit_stored.length;
              setFruit(f.slot, undefined);
              setFruit(slot, f);
            }
          } else if(slottype == 1) {
            var slot = 100 + state.fruit_sacr.length;
            setFruit(f.slot, undefined);
            setFruit(slot, f);
          }
          store_undo = true; // for same reason as in ACTION_FRUIT_ACTIVE
        }
        updateFruitUI();
      } else if(type == ACTION_FRUIT_ACTIVE) {
        var slot = action.slot;
        var ok = true;
        if(slot < 0) ok = false;
        if(!action.allow_empty && slot >= state.fruit_stored.length) ok = false;
        if(slot >= state.fruit_slots) ok = false;
        if(ok) {
          state.fruit_active = slot;
          updateFruitUI();
          updateRightPane();
          if(!action.silent) {
            var f_active = getActiveFruit();
            var name = f_active ? (f_active.toString() + ': ' + f_active.abilitiesToString(true, true)) : 'none';
            showMessage('Set active fruit: ' + name);
          }
          store_undo = true; // non-destructive action, but store undo anyway for consistency and to avoid confusion when pressing undo after e.g. first swapping fruit for sun, then activating sun
        }
      } else if(type == ACTION_FRUIT_LEVEL) {
        var f = action.f;
        var index = action.index;
        var a = f.abilities[index];
        var level = f.levels[index];
        var cost = getFruitAbilityCost(a, level, f.tier).essence;
        var available = state.res.essence.sub(f.essence);
        if(isInherentAbility(a)) {
          // silently do nothing, is invalid and no UI allows this
        } else if(action.shift) {
          available.mulrInPlace(0.25); // do not use up ALL essence here, up to 25% only
          var num = 0;
          while(available.gte(cost)) {
            f.essence.addInPlace(cost);
            f.levels[index]++;
            store_undo = true;
            state.c_numfruitupgrades++;
            state.g_numfruitupgrades++;
            available.subInPlace(cost);
            cost = getFruitAbilityCost(a, f.levels[index], f.tier).essence;
            num++;
            if(num > 1000) break; // too much, avoid infinite loop
          }
          if(num > 0) {
            showMessage('Fruit ability ' + getFruitAbilityName(a) + ' leveled up ' + num + ' times to level ' + f.levels[index]);
          }
        } else {
          if(available.lt(cost)) {
            showMessage('not enough essence for fruit upgrade: need ' + cost.toString() +
                ', available for this fruit: ' + available.toString(), C_INVALID, 0, 0);
          } else {
            f.essence.addInPlace(cost);
            f.levels[index]++;
            showMessage('Fruit ability ' + getFruitAbilityName(a) + ' leveled up to level ' + f.levels[index]);
            store_undo = true;
            state.c_numfruitupgrades++;
            state.g_numfruitupgrades++;
          }
        }
        updateFruitUI();
      } else if(type == ACTION_FRUIT_REORDER) {
        if(fast_forwarding) continue;

        var f = action.f;
        var a = action.index;
        var up = action.up;
        // seasonal ability is not counted and not allowed to reorder
        var n = getNumFruitAbilities(f.tier);
        var ok = true;
        if(up && a <= 0) ok = false;
        if(!up && a + 1 >= n) ok = false;
        if(ok) {
          var b = a + (up ? -1 : 1);
          var temp = f.abilities[a];
          f.abilities[a] = f.abilities[b];
          f.abilities[b] = temp;
          var temp = f.levels[a];
          f.levels[a] = f.levels[b];
          f.levels[b] = temp;
          var temp = f.charge[a];
          f.charge[a] = f.charge[b];
          f.charge[b] = temp;
          updateFruitUI();
          store_undo = true;
        }
      } else if(type == ACTION_FRUIT_FUSE) {
        var a = action.a;
        var b = action.b;

        var fruitmix = 0;
        if(state.upgrades3[upgrade3_fruitmix].count) fruitmix += 2;
        if(state.upgrades3[upgrade3_fruitmix2].count) fruitmix += 2;

        var f = fuseFruit(a, b, fruitmix);
        if(f) {
          f.slot = a.slot;
          if(f.slot < 100) {
            state.fruit_stored[f.slot] = f;
          } else {
            state.fruit_sacr[f.slot - 100] = f;
          }
          setFruit(b.slot, null);
          state.c_numfused++;
          state.g_numfused++;
          store_undo = true;
          lastTouchedFruit = f;
          updateFruitUI();
        }
      } else if(type == ACTION_TOGGLE_AUTOMATON) {
        if(fast_forwarding) continue;

        // action object is {toggle:what, on:boolean or int, fun:optional function to call after switching}, and what is: 0: entire automaton, 1: auto upgrades, 2: auto planting
        if(action.what == 0) {
          state.automaton_enabled = action.on;
        }
        if(action.what == 4) {
          state.automaton_autochoice = action.on;
        }
        if(action.what == 1) {
          state.automaton_autoupgrade = action.on;
        }
        if(action.what == 2) {
          state.automaton_autoplant = action.on;
        }
        if(action.what == 3) {
          state.automaton_autounlock = action.on;
        }
        if(action.fun) action.fun();
        store_undo = true;
      } else if(type == ACTION_TRANSCEND) {
        if(action.challenge && !state.challenges[action.challenge].unlocked) {
          // do nothing, invalid reset attempt
        } else if(state.treelevel >= min_transcension_level || state.challenge) {
          do_transcend = action;
          store_undo = true;
          // when transcending, break and execute the code below to actually transcend: if there are more actions queued, these should occur after the transcension happened.
          break;
        }
      }
    }

    if(store_undo && undostate) {
      storeUndo(undostate);
    }


    //if(upgrades_done || upgrades2_done) updateUI();

    ////////////////////////////////////////////////////////////////////////////

    var resin_fruit_level = getFruitAbility(FRUIT_RESINBOOST);
    var twigs_fruit_level = getFruitAbility(FRUIT_TWIGSBOOST);
    if(resin_fruit_level) state.resinfruittime += d;
    if(twigs_fruit_level) state.twigsfruittime += d;

    ////////////////////////////////////////////////////////////////////////////

    precomputeField();

    gain = Res();

    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f = state.field[y][x];
        if(f.hasRealCrop()) {
          var p = prefield[y][x];
          var c = f.getCrop();
          var prod = Res();
          if(c.type == CROPTYPE_BRASSICA || state.challenge == challenge_wither) {
            var short = c.type == CROPTYPE_BRASSICA;
            var croptime = short ? c.getPlantTime() : witherDuration();
            var g = d / croptime;
            var growth0 = f.growth;
            f.growth -= g;
            if(f.growth <= 0) {
              if(c.index == brassica_1 && state.upgrades[watercress_choice0].count != 0 && state.challenge != challenge_wither) {
                f.growth = 0; // its growth is 0, but it'll have infinite "post-wither" lifetime
              } else {
                f.growth = 0;
                // add the remainder image, but only if this one was leeching at least 2 neighbors: it serves as a reminder of watercress you used for leeching, not *all* watercresses
                var create_remainder = false;
                if(short) {
                  if(p.touchnum >= 2) create_remainder = true;
                  if(p.touchnum == 1 && state.cropcount[brassica_0] <= 1 && state.specialfieldcount[FIELD_REMAINDER] == 0) create_remainder = true;
                  if(create_remainder) f.index = FIELD_REMAINDER;
                }
                if(!create_remainder) f.index = 0;
              }
            }
            // it's ok to have the production when growth became 0: the nextEvent function ensures that we'll be roughly at the exact correct time where the transition happens (and the current time delta represents time where it was alive)
            prod = p.prod2;
          } else { // long lived plant
            if(c.getPlantTime() == 0) f.growth = 1;
            if(f.growth < 1) {
              var g = d / c.getPlantTime();
              var growth0 = f.growth;
              f.growth += g;
              if(f.growth >= 1) {
                // just fullgrown now
                f.growth = 1;
                if(state.challenge != challenge_wither) {
                  state.g_numfullgrown++;
                  state.c_numfullgrown++;
                }
                if(state.notificationsounds[1]) {
                  if(c.type == CROPTYPE_BERRY) {
                    if(util.getTime() > last_fullgrown_sound_time0 + 5) {
                      playNotificationSound(2000);
                      last_fullgrown_sound_time0 = util.getTime();
                    }
                  } else if(c.type == CROPTYPE_MUSH) {
                    if(util.getTime() > last_fullgrown_sound_time1 + 5) {
                      playNotificationSound(1800);
                      last_fullgrown_sound_time1 = util.getTime();
                    }
                  } else {
                    if(util.getTime() > last_fullgrown_sound_time2 + 5) {
                      playNotificationSound(2200);
                      last_fullgrown_sound_time2 = util.getTime();
                    }
                  }
                }
                // it's ok to ignore the production: the nextEvent function ensures that we'll be roughly at the exact correct time where the transition happens (and the time delta represents the time when it was not yet fullgrown, so no production added)
              }
              prod = p.prod2;
            } else {
              // fullgrown
              prod = p.prod2;
            }
          }
          gain.addInPlace(prod);
          actualgain.addInPlace(prod.mulr(d));
        } else if(f.isTemplate()) {
          f.growth = 1;
        }
      }
    }

    for(var y = 0; y < state.numh2; y++) {
      for(var x = 0; x < state.numw2; x++) {
        var f = state.field2[y][x];
        if(f.hasCrop()) {
          var c = crops2[f.cropIndex()];
          if(f.growth < 1) {
            if(c.getPlantTime() == 0) {
              f.growth = 1;
            } else {
              var g = d / c.getPlantTime();
              f.growth += g;
              if(f.growth >= 1) {
                f.growth = 1;
                state.g_numfullgrown2++;
                if(state.g_numfullgrown2 == 1) {
                  showMessage('your first ethereal plant in the ethereal field has fullgrown! It provides a bonus to your basic field.', C_HELP, 126850492);
                }
              }
            }
          } else {
            // nothing to do, ethereal plants currently don't produce resources
          }
        }
      }
    }


    ////////////////////////////////////////////////////////////////////////////

    if(clickedfern) {
      var waittime = state.fernwait;
      if(waittime == 0) waittime = getFernWaitTime(); // in case of old save where fernwait wasn't stored
      // how much production time the fern is worth. This is how much extra production boost active players can get over passive players
      // e.g. 0.25 means clicking all ferns makes you get 25% more income (on average, since there is a uniforn random 0.5..1.5 factor, plus due to the "extra bushy" ferns the real active production is actually a bit higher than this value)
      var fernTimeWorth = waittime * 0.25;
      var roll = getRandomFernRoll();
      roll = (state.fern == 2) ? (roll * 0.5 + 1) : (roll + 0.5);
      var r = fernTimeWorth * roll;
      if(state.upgrades[fern_choice0].count == 2) r *= (1 + fern_choice0_b_bonus);
      var g = gain.mulr(r);
      if(g.seeds.ltr(2)) g.seeds = Num.max(g.seeds, Num(getRandomFernRoll() * 2 + 1));
      var starter = getStarterResources();
      if(g.seeds.lt(starter.seeds)) g.seeds = Num.max(g.seeds, starter.seeds.mulr(roll));
      var fernres = new Res({seeds:g.seeds, spores:g.spores});

      if(state.fern == 1) {
        showMessage('That fern gave: ' + fernres.toString(), C_NATURE, 989456955, 0.5, true);
      } else {
        fernres = fernres.mulr(1.75);
        fernres.seeds.addrInPlace(5); // bushy ferns are better for early game
        //fernres.nuts.addrInPlace(g.nuts);
        var fernTimeRatio = waittime / 120; //this type of resource should also depend on the duration of the fern
        //if(state.g_res.amber.gtr(1)) fernres.amber.addrInPlace(0.5);
        if(waittime + 1 >= fern_wait_minutes * 60 && state.g_numresets > 1 && (!state.challenge || challenges[state.challenge].allowsresin)) fernres.resin.addInPlace(state.g_max_res_earned.resin.divr(200).mulr(fernTimeRatio));
        //fernres.resin.addInPlace(state.p_res.resin.divr(100).mulr(fernTimeRatio));
        showMessage('This fern is extra bushy! It gave ' + fernres.toString(), C_NATURE, 989456955, 1, true);
      }
      state.g_fernres.addInPlace(fernres);
      if(fernres.resin.neqr(0)) {
        state.fernresin.resin.addInPlace(fernres.resin)
        fernres.resin = Num(0);
      }
      actualgain.addInPlace(fernres);
      state.lastFernTime = state.time; // in seconds
      state.fern = 0;
      if(state.numcropfields == 0 && state.res.add(fernres).seeds.ger(10)) {
        showMessage('You have enough resources to plant. Click an empty field to plant', C_HELP, 64721);
      }
    }

    var grow_fern = false;
    var fernTimeWorth = 0;
    if(!state.fern && !clickedfern) {
      var mintime = getFernWaitTime();
      if(state.time > state.lastFernTime + mintime) {
        grow_fern = true;
        state.fernwait = mintime;

        var s = getRandomPreferablyEmptyFieldSpot();
        if(s) {
          state.fern = 1;
          state.fernx = s[0];
          state.ferny = s[1];
          if(state.g_numferns == 3 || (state.g_numferns > 7 && getRandomFernRoll() < 0.1)) state.fern = 2; // extra bushy fern
          if(state.notificationsounds[0]) playNotificationSound(1000);
          // the coordinates are invisible but are for screenreaders
          showMessage('A fern spawned<span style="color:#0000"> at ' + state.fernx + ', ' + state.ferny + '</span>', C_NATURE, 2352600596, 0.5);
        }

        state.lastFernTime = state.time; // in seconds
      }
    }

    // fix a potential bug where fern went out of bounds of the map. The bug is fixed, but savegames with the issue could still exist.
    if(state.fern) {
      if(state.fernx < 0) state.fernx = 0;
      if(state.ferny < 0) state.ferny = 0;
      if(state.fernx >= state.numw) state.fernx = state.numw - 1;
      if(state.ferny >= state.numh) state.ferny = state.numh - 1;
    }

    ////////////////////////////////////////////////////////////////////////////

    if(clickedpresent) {
      state.presentwait = (15 * 60) * (1 +  getRandomPresentRoll());

      // alternatives for things that aren't unlocked yet
      var alternative = false;
      if(state.present == 1 && state.g_res.spores.ler(0)) {
        alternative = true;
      }
      if(state.present == 2 && state.g_res.nuts.ler(0)) {
        alternative = true;
      }
      if(state.present == 4 && state.g_numfruits <= 0) {
        alternative = true;
      }
      if(state.present == 5 && state.g_res.amber.ler(0)) {
        alternative = true;
      }

      if(state.present == 1 || alternative) {
        var g = gain.mulr(60 * 7.5);
        var starter = getStarterResources();
        if(g.seeds.lt(starter.seeds)) g.seeds = Num.max(g.seeds, starter.seeds);
        if(g.seeds.ltr(10)) g.seeds = Num.max(g.seeds, Num(10));
        var presentres = new Res({seeds:g.seeds, spores:g.spores});
        if(alternative && state.g_res.amber.ltr(0)) {
          g.amber = Num(1);
        }
        showMessage('That present contained: ' + presentres.toString(), C_PRESENT, 38753631, 0.8, true);
        actualgain.addInPlace(presentres);
      } else if(state.present == 2) {
        var min_nuts = getNextUpgrade3Cost().mulr(0.0005).mulr(1 + getRandomPresentRoll());
        var g = gain.mulr(60 * 7.5);
        var starter = getStarterResources();
        if(g.nuts.lt(min_nuts)) g.nuts = min_nuts;
        var presentres = new Res({nuts:g.nuts});
        showMessage('That present contained a nutcracker! It gave ' + presentres.toString(), C_PRESENT, 38753631, 0.8, true);
        actualgain.addInPlace(presentres);
      } else if(state.present == 3) {
        state.present_grow_speed_time = state.time;
        showMessage('This present doubles crop grow speed for 15 minutes!', C_PRESENT, 38753631, 0.8, true);
      } else if(state.present == 4) {
        showMessage('This present contained fruit!', C_PRESENT, 38753631, 0.8, true);
        var fruits = addRandomFruitForLevel(state.g_treelevel);
        if(fruits) {
          for(var i = 0; i < fruits.length; i++) {
            if(state.messagelogenabled[5]) showMessage('fruit dropped: ' + fruits[i].toString() + '. ' + fruits[i].abilitiesToString(), C_PRESENT, 38753631, 0.8);
          }
        }
      } else if(state.present == 5) {
        var amber = Num(Math.floor(getRandomPresentRoll() * 5) + 3);
        actualgain.amber.addInPlace(amber);
        showMessage('That present contained ' + amber.toString() + ' amber!', C_PRESENT, 38753631, 0.8, true);
      } else {
      }
      state.lastPresentTime = state.time; // in seconds
      state.present = 0;
    }

    var drop_present = false;
    var presentTimeWorth = 0;
    // the state.g_numpresents < 3000 check is a safety guard in case bugs related to present spawning appear. 3000 is the max amount that could spawn in a month (it is at least 15 minutes per present)
    if(!state.present && !clickedpresent && state.g_numplanted >= 2 && state.g_numpresents < 3000) {
      if(state.time > state.lastPresentTime + state.presentwait) {
        drop_present = true;
        var s = getRandomPreferablyEmptyFieldSpot();
        if(s) {
          state.present = 1 + Math.floor(getRandomPresentRoll() * 5) % 5;
          state.present_image = Math.floor(getRandomPresentRoll() * 4) & 3;
          state.presentx = s[0];
          state.presenty = s[1];
          // the coordinates are invisible but are for screenreaders
          showMessage('A present appeared<span style="color:#0000"> at ' + state.presentx + ', ' + state.presenty + '</span>', C_PRESENT, 5, 0.8);
        }

        state.lastPresentTime = 0;
      }
    }

    ////////////////////////////////////////////////////////////////////////////

    var req = treeLevelReq(state.treelevel + 1);
    if(state.time > state.lasttreeleveluptime + 1 && state.res.ge(req)) {
      var resin = Num(0);
      var twigs = Num(0);

      var do_twigs = true;
      if(state.challenge && !challenges[state.challenge].allowstwigs) do_twigs = false;
      if(state.challenge && !challenges[state.challenge].allowbeyondhighestlevel && state.treelevel > state.g_treelevel) do_twigs = false;

      if(do_twigs) {
        twigs = nextTwigs().twigs;
        state.twigs.addInPlace(twigs);
      }

      actualgain.amber.addInPlace(maybeDropAmber());

      state.treelevel++;
      global_tree_levelups++;

      var do_resin = true;
      if(state.challenge && !challenges[state.challenge].allowsresin) do_resin = false;
      if(state.challenge && !challenges[state.challenge].allowbeyondhighestlevel && state.treelevel > state.g_treelevel) do_resin = false;

      if(do_resin) {
        resin = currentTreeLevelResin(); // treelevel already ++'d above
        state.resin.addInPlace(resin);
      }
      state.res.subInPlace(req);
      state.g_treelevel = Math.max(state.treelevel, state.g_treelevel);

      // this must happen after do_resin above, so that the state.lasttreeleveluptime is still used in the currentTreeLevelResin computation
      state.lasttreeleveluptime = state.time;
      state.resinfruittime = 0;
      state.twigsfruittime = 0;

      var showtreemessages = state.messagelogenabled[1] || state.treelevel >= state.g_treelevel;

      if(showtreemessages) {
        var message = 'Tree leveled up to: ' + tree_images[treeLevelIndex(state.treelevel)][0] + ', level ' + state.treelevel +
            '. Consumed: ' + req.toString() +
            '. Tree boost: ' + getTreeBoost().toPercentString();
        if(resin.neqr(0)) message += '. Resin added: ' + resin.toString() + '. Total resin ready: ' + getUpcomingResinIncludingFerns().toString();
        if(getSeason() == 3) message += '. Winter resin bonus: ' + (getWinterTreeResinBonus().subr(1)).toPercentString();
        if(twigs.neqr(0)) message += '. Twigs from mistletoe added: ' + twigs.toString();
        if(getSeason() == 2) message += '. Autumn twigs bonus: ' + (getAutumnMistletoeBonus().subr(1)).toPercentString();
        if(state.treelevel == 9) {
          message += '. The tree is almost an adult tree now.';
        }
        showMessage(message, C_NATURE, 109168563);
      }

      if(state.treelevel == 2) {
        showRegisteredHelpDialog(12);
      } else if(state.treelevel == 3) {
        showHelpDialog(-13, undefined, 'The tree reached level ' + state.treelevel + ' and is providing a choice, see the new upgrade that provides two choices under "upgrades".');
      } else if(state.treelevel == 4) {
        showRegisteredHelpDialog(14);
      } else if(state.treelevel == 6) {
        showRegisteredHelpDialog(15);
      } else if(state.treelevel == 8) {
        showHelpDialog(-16, undefined, 'The tree reached level ' + state.treelevel + ' and is providing another choice, see the new upgrade that provides two choices under "upgrades".');
      }

      // fruits at any multiple of 5 tree level
      var fruits = undefined;
      if(state.treelevel > 0 && state.treelevel % 5 == 0) {
        if(!state.challenge || (challenges[state.challenge].allowsfruits && state.treelevel >= 10 && (challenges[state.challenge].allowbeyondhighestlevel || state.treelevel <= state.g_treelevel))) {
          if(showtreemessages && state.treelevel == 5) showRegisteredHelpDialog(2);
          if(showtreemessages && state.treelevel == 15) showRegisteredHelpDialog(18);
          fruits = addRandomFruit();
          update_fruit_ui = true;
        }
      }
      // drop the level 5 fruit during challenges at level 10
      if(state.treelevel == 10 && state.challenge && challenges[state.challenge].allowsfruits) {
        fruits = addRandomFruit();
        update_fruit_ui = true;
        if(state.messagelogenabled[5]) showMessage('The tree dropped the level 5 fruit at level 10 during this challenge', C_NATURE, 1340887270);
      }

      if(state.treelevel == 1) {
        showRegisteredHelpDialog(6);
      } else if(state.treelevel == min_transcension_level) {
        showRegisteredHelpDialog(7);
      }
      if(state.challenge && state.treelevel == challenges[state.challenge].targetlevel[0]) {
        var c = challenges[state.challenge];
        var c2 = state.challenges[state.challenge];
        if(c2.besttime == 0 || state.c_runtime < c2.besttime) {
          c2.besttime = Math.max(0.01, state.c_runtime);
        }
        if(c.cycling > 1) {
          var cycle = c.getCurrentCycle();
          if(c2.besttimes[cycle] == 0 || state.c_runtime < c2.besttimes[cycle]) {
            c2.besttimes[cycle] = Math.max(0.01, state.c_runtime);
          }
        }
      }
      if(state.challenge && state.treelevel == challenges[state.challenge].nextTargetLevel()) {
        var c = challenges[state.challenge];
        var c2 = state.challenges[state.challenge];
        if(!c.allCyclesCompleted()) {
          showChallengeChip(state.challenge);
          showRegisteredHelpDialog(26);
        } else {
          showMessage('challenge target level reached');
        }
        if(c.targetlevel.length > 1 && state.treelevel >= c.finalTargetLevel()) {
          if(c2.besttime2 == 0 || state.c_runtime < c2.besttime2) c2.besttime2 = Math.max(0.01, state.c_runtime);
        }
        if(c.cycling > 1) {
          var cycle = c.getCurrentCycle();
          if(c2.besttimes2[cycle] == 0 || state.c_runtime < c2.besttimes2[cycle]) {
            c2.besttimes2[cycle] = Math.max(0.01, state.c_runtime);
          }
        }
      }

      if(fruits) {
        for(var i = 0; i < fruits.length; i++) {
          if(state.messagelogenabled[5]) showMessage('fruit dropped: ' + fruits[i].toString() + '. ' + fruits[i].abilitiesToString(), C_NATURE, 1284767498);
        }
      }
    }

    if(state.g_numresets > 0) {
      var req2 = treeLevel2Req(state.treelevel2 + 1);
      if(state.res.ge(req2)) {
        state.treelevel2++;
        state.lasttree2leveluptime = state.time;
        var message = 'Ethereal tree leveled up to: ' + tree_images[treeLevelIndex(state.treelevel2)][0] + ', level ' + state.treelevel2 +
            '. Consumed: ' + req2.toString();
        message += '. Higher ethereal tree levels can unlock more ethereal upgrades and ethereal crops';
        state.res.subInPlace(req2);
        showMessage(message, C_ETHEREAL, 48352772);

        showEtherealTreeLevelDialog(state.treelevel2);
        if(state.treelevel2 == 1) {
          showRegisteredHelpDialog(22);
        }

        for(var i = 0; i < state.treelevel2 - 1; i++) {
          if(state.eth_stats_time[i] == undefined) state.eth_stats_time[i] = 0;
          if(state.eth_stats_res[i] == undefined) state.eth_stats_res[i] = Res();
          if(state.eth_stats_level[i] == undefined) state.eth_stats_level[i] = 0;
          if(state.eth_stats_numresets[i] == undefined) state.eth_stats_numresets[i] = 0;
          if(state.eth_stats_challenge[i] == undefined) state.eth_stats_challenge[i] = Num(0);
          if(state.eth_stats_medal_bonus[i] == undefined) state.eth_stats_medal_bonus[i] = Num(0);
        }
        state.eth_stats_time[state.treelevel2 - 1] = state.g_runtime;
        state.eth_stats_res[state.treelevel2 - 1] = Res(state.g_res);
        state.eth_stats_res[state.treelevel2 - 1].seeds = Num(state.g_max_res.seeds);
        state.eth_stats_res[state.treelevel2 - 1].spores = Num(state.g_max_res.spores);
        state.eth_stats_level[state.treelevel2 - 1] = state.g_treelevel;
        state.eth_stats_numresets[state.treelevel2 - 1] = state.g_numresets;
        state.eth_stats_challenge[state.treelevel2 - 1] = Num(state.challenge_bonus);
        state.eth_stats_medal_bonus[state.treelevel2 - 1] = Num(state.medal_prodmul);
      }
      if(state.treelevel2 >= 1) {
        unlockEtherealCrop(berry2_1);
      }
      if(state.treelevel2 >= 2) {
        unlockEtherealCrop(nettle2_0);
        unlockEtherealCrop(fern2_1);
      }
      if(state.treelevel2 >= 3) {
        unlockEtherealCrop(mush2_1);
        unlockEtherealCrop(flower2_1);
      }
      if(state.treelevel2 >= 4) {
        unlockEtherealCrop(berry2_2);
        unlockEtherealCrop(lotus2_1);
        unlockEtherealCrop(fern2_2);
      }
      if(state.treelevel2 >= 5) {
        unlockEtherealCrop(mush2_2);
      }
      if(state.treelevel2 >= 6) {
        unlockEtherealCrop(fern2_3);
        unlockEtherealCrop(flower2_2);
      }
      if(state.treelevel2 >= 7) {
        unlockEtherealCrop(berry2_3);
        unlockEtherealCrop(mush2_3);
      }
      if(state.treelevel2 >= 8) {
        unlockEtherealCrop(lotus2_2);
        unlockEtherealCrop(bee2_0);
      }
      if(state.treelevel2 >= 9) {
        unlockEtherealCrop(flower2_3);
      }
      if(state.treelevel2 >= 10) {
        unlockEtherealCrop(nettle2_1);
      }
    }

    // For safety, in case something goes wrong, because NaNs spread once they appear
    gain.removeNaN();
    actualgain.removeNaN();

    state.res.addInPlace(actualgain);

    // check unlocked upgrades
    for(var i = 0; i < registered_upgrades.length; i++) {
      var j = registered_upgrades[i];
      var u = upgrades[j];
      var u2 = state.upgrades[j];
      if(u2.unlocked && state.challenge == challenge_noupgrades && isNoUpgrade(u)) u2.unlocked = false; // fix up other things that may unlock certain upgrades during this challenge
      if(u2.unlocked) continue;
      if(state.challenge == challenge_bees && !u.istreebasedupgrade) continue;
      if(state.challenge == challenge_blackberry && u.iscropunlock) continue;
      if(state.challenge == challenge_noupgrades && isNoUpgrade(u)) continue;
      if(j == mistletoeunlock_0 && state.challenge && !challenges[state.challenge].allowstwigs) continue; // mistletoe doesn't work during this challenge
      if(u.pre()) {
        if(u2.unlocked) {
          // the pre function itself already unlocked it, so perhaps it auto applied the upgrade. Nothing to do anymore here other than show a different message.
          if(state.messagelogenabled[2] || !u2.seen2) showMessage('Received: "' + u.getName() + '"', C_UNLOCK, 2043573365);
        } else {
          u2.unlocked = true;
          state.c_numupgrades_unlocked++;
          state.g_numupgrades_unlocked++;
          if(state.c_numupgrades_unlocked == 1) {
            showRegisteredHelpDialog(8);
          }
          if(state.messagelogenabled[2] || !u2.seen2) showMessage('Upgrade available: "' + u.getName() + '"', C_UNLOCK, 193917138);
        }
        u2.seen2 = true;
      }
    }

    if(state.g_numresets > 0 && state.g_numplanted2 > 0) {
      var is_first = (state.g_numupgrades2_unlocked == 0);
      var num_unlocked = 0;
      for(var i = 0; i < registered_upgrades2.length; i++) {
        var j = registered_upgrades2[i];
        if(state.upgrades2[j].unlocked) continue;
        if(upgrades2[j].pre()) {
          state.upgrades2[j].unlocked = true;
          state.g_numupgrades2_unlocked++;
          num_unlocked++;
          showMessage('Ethereal upgrade available: "' + upgrades2[j].getName() + '"', C_ETHEREAL, 833862648);
        }
      }
      if(num_unlocked && is_first) {
        showRegisteredHelpDialog(9);
      }
    }
    // check medals
    for(var i = 0; i < registered_medals.length; i++) {
      var j = registered_medals[i];
      if(state.medals[j].earned) continue;
      if(medals[j].conditionfun()) {
        state.g_nummedals++;
        state.medals[j].earned = true;
        //medals_new = true;
        showMessage('Achievement unlocked: ' + upper(medals[j].name), C_UNLOCK, 34776048, 0.75);
        updateMedalUI();
        showMedalChip(j);

        if(j == medal_crowded_id && state.g_numresets == 0) {
          //showHelpDialog(10, undefined, 'The field is full. If more room is needed, old crops can be deleted, click a crop to see its delete button. Ferns will still appear safely on top of crops, no need to make room for them.');
        }
        if(state.g_nummedals == 1) {
          showHelpDialog(-11, undefined, 'You got your first achievement! Achievements give a slight production boost. See the "achievements" tab.');
        }
      }
    }

    // check unlocked challenges
    if(state.g_numresets > 0) { // all challenges require having done at least 1 regular transcension first
      for(var i = 0; i < registered_challenges.length; i++) {
        var c = challenges[registered_challenges[i]];
        var c2 = state.challenges[registered_challenges[i]];
        if(c2.unlocked) continue;
        if(c.prefun()) {
          c2.unlocked = true;
          showRegisteredHelpDialog(24);
          showMessage('Unlocked challenge: ' + upper(c.name), C_UNLOCK, 66240736, 0.75);
        }
      }
    }

    if(season_will_change && global_season_changes == 1) {
      prev_season_gain = Res(gain);
    }

    state.g_res.addInPlace(actualgain);
    state.c_res.addInPlace(actualgain);
    state.g_max_res = Res.max(state.g_max_res, state.res);
    state.c_max_res = Res.max(state.c_max_res, state.res);
    state.g_max_prod = Res.max(state.g_max_prod, gain);
    state.c_max_prod = Res.max(state.c_max_prod, gain);

    var resinhr = getResinHour();
    var twigshr = getTwigsHour();
    if(resinhr.gt(state.c_res_hr_best.resin)) {
      state.c_res_hr_best.resin = resinhr;
      state.c_res_hr_at.resin = Num(state.treelevel);
      state.c_res_hr_at_time.resin = Num(state.c_runtime);
      if(resinhr.gt(state.g_res_hr_best.resin)) {
        state.g_res_hr_best.resin = resinhr;
        state.g_res_hr_at.resin = Num(state.treelevel);
        state.g_res_hr_at_time.resin = Num(state.c_runtime);
      }
    }
    if(twigshr.gt(state.c_res_hr_best.twigs)) {
      state.c_res_hr_best.twigs = twigshr;
      state.c_res_hr_at.twigs = Num(state.treelevel);
      state.c_res_hr_at_time.twigs = Num(state.c_runtime);
      if(twigshr.gt(state.g_res_hr_best.twigs)) {
        state.g_res_hr_best.twigs = twigshr;
        state.g_res_hr_at.twigs = Num(state.treelevel);
        state.g_res_hr_at_time.twigs = Num(state.c_runtime);
      }
    }

    computeDerived(state);
  } // end of loop for long ticks //////////////////////////////////////////////


  if(state.g_numticks == 0) {
    showMessage('You need to gather some resources. Click a fern to get some.', C_HELP, 5646478);
  }

  if(state.c_numticks == 0 && state.challenge == challenge_bees) {
    showRegisteredHelpDialog(25);
  }

  state.g_numticks++;
  state.c_numticks++;

  var time = util.getTime();
  if(time > lastSaveTime + 180) {
    if(autoSaveOk()) {
      state.g_numautosaves++;
      saveNow(function() {
        // Remind to make backups if not done any save importing or exporting for 2 or more days
        if(time > Math.max(state.lastBackupWarningTime, Math.max(state.g_lastexporttime, state.g_lastimporttime)) + 2 * 24 * 3600) {
          showMessage(autoSavedStateMessageWithReminder, C_META, 0, 0);
          state.lastBackupWarningTime = util.getTime();
        } else {
          if(state.messagelogenabled[0]) showMessage(autoSavedStateMessage, C_UNIMPORTANT, 0, 0);
        }
      });
      lastSaveTime = time;
    }
  }

  var d_total = state.prevtime - oldtime;
  // if negative time was used, this message won't make sense, it may say 'none', which is indeed what you got when compensating for negative time. But the message might then be misleading.
  if(d_total > 300 && !negative_time_used) {
    large_time_delta = true;
  } else {
    large_time_delta = false;
  }
  large_time_delta_time += d_total;

  // for the case after one or more large-delta ticks are finished
  if(prev_large_time_delta && !large_time_delta) {
    var totalgain = state.res.sub(oldres);
    var season_message = '';
    if(global_season_changes > 0) {
      season_message = '. The season changed ' + global_season_changes + ' times';
    }
    var tree_message = '';
    if(global_tree_levelups > 0) {
      tree_message = '. The tree leveled up ' + global_tree_levelups + ' times';
    }

    var t_total = large_time_delta_time;
    var totalgain = state.res.sub(large_time_delta_res);


    showMessage('Large time delta: ' + util.formatDuration(t_total, true, 4, true) + ', gained at once: ' + totalgain.toString() + season_message + tree_message, C_UNIMPORTANT, 0, 0);
  }

  // Print the season change outside of the above loop, otherwise if you load a savegame from multiple days ago it'll show too many season change messages.
  // if global_season_changes > 1, it's already printed in the large time delta message above instead.
  if(num_season_changes == 1 && global_season_changes <= 1) {
    var gainchangemessage = '';
    if(prev_season_gain) {
      gainchangemessage = '. Income before: ' + prev_season_gain.toString() + '. Income now: ' + gain.toString();
      prev_season_gain = undefined;
    }
    showMessage('The season changed to ' + seasonNames[getSeason()] + gainchangemessage, C_NATURE, 17843969, 0.75);
  }


  if(num_season_changes > 0) {
    var num_get = getDelete2PerSeason();
    var max_num = getDelete2maxBuildup();

    var num_tokens = num_season_changes * num_get;
    if(state.delete2tokens + num_tokens > max_num) num_tokens = max_num - state.delete2tokens;
    state.delete2tokens += num_tokens;
    state.g_delete2tokens += num_tokens;
    if(num_tokens > 0 && state.g_numresets > 0) showMessage('Received ' + num_tokens + ' ethereal deletion tokens', C_ETHEREAL, 510324665);

    state.amberseason = false;
  }

  if(do_transcend) {
    var action = do_transcend;
    softReset(action.challenge);
    computeDerived(state);
  }

  if(!large_time_delta) {
    if(global_season_changes) state.g_seasons++; // g_seasons only counts season changes actively seen
    global_season_changes = 0;
    global_tree_levelups = 0;
    large_time_delta_res = Res(state.res);
    large_time_delta_time = 0;
  }

  updateUI2();
  if(update_fruit_ui) updateFruitUI();

  for(var i = 0; i < update_listeners.length; i++) {
    if(!update_listeners[i]()) {
      update_listeners.splice(i, 1);
      i--;
    }
  }

  // go faster when the automaton is autoplanting one-by-one
  if(autoplanted) {
    window.setTimeout(update, update_ms * 0.4);
  }
}



////////////////////////////////////////////////////////////////////////////////


// the "shift+plant" chip at the bottom
var shiftCropFlex = undefined;
var shiftCropFlexId;
var shiftCropFlexX = -1;
var shiftCropFlexY = -1;
var shiftCropFlexShowing;

function removeShiftCropChip() {
  shiftCropFlexShowing = false;

  if(!shiftCropFlex) return;

  shiftCropFlex.removeSelf(gameFlex);
  shiftCropFlex = undefined;
}

function showShiftCropChip(crop_id) {
  removeShiftCropChip();
  var shift = cropChipShiftDown;
  var ctrl = cropChipCtrlDown;
  if(!shift && !ctrl) return;

  var c = crop_id >= 0 ? crops[crop_id] : undefined;

  shiftCropFlexShowing = true; // even when invisible due to not mouse over relevant field tile

  shiftCropFlexId = crop_id;

  var x = shiftCropFlexX;
  var y = shiftCropFlexY;

  var f;
  if(x < 0 || y < 0 || x == undefined || y == undefined) f = new Cell(undefined, undefined, false); // fake empty field cell to make it indicate "planting"
  else f = state.field[y][x];

  var planting = !f.hasCrop(); // using !f.hasCrop(), rather than f.isEmpty(), to also show the planting chip when mouse is over the tree, rather than showing nothing then, to give the information in more places no matter where the mouse is
  var deleting = f.hasCrop() && ctrl && !shift && state.allowshiftdelete;
  var replacing = f.hasCrop() && shift && !ctrl && state.allowshiftdelete;
  //if(replacing && f.getCrop().index == state.lastPlanted) replacing = false; // replacing does not work if same crop. It could be deleting, or nothing, depending on plant growth, but display as nothing
  var upgrading = f.hasCrop() && shift && ctrl && state.allowshiftdelete && f.getCrop().tier < state.highestoftypeunlocked[f.getCrop().type];
  if(upgrading) c = croptype_tiers[f.getCrop().type][state.highestoftypeunlocked[f.getCrop().type]];
  var selecting = f.hasCrop() && shift && ctrl && (!state.allowshiftdelete || f.getCrop().tier >= state.highestoftypeunlocked[f.getCrop().type]);
  if(selecting) c = f.getCrop();

  if(!planting && !deleting && !replacing && !upgrading && !selecting) return;

  var keyname = (shift ? (ctrl ? 'Shift+ctrl' : 'Shift') : 'Ctrl');
  var verb = planting ? 'planting' : (deleting ? 'deleting' : (replacing ? 'replacing' : (selecting ? 'selecting' : 'upgrading')));


  shiftCropFlex = new Flex(gameFlex, 0.2, 0.85, 0.8, 0.95, 0.5);
  shiftCropFlex.div.style.backgroundColor = planting ? '#dfd' : (deleting ? '#fdd' : '#ffd');
  shiftCropFlex.div.style.zIndex = 100; // above medal chip

  var textFlex = new Flex(shiftCropFlex, [0, 0, 0.0], [0.5, 0, -0.35], 0.99, [0.5, 0, 0.35], 0.4);
  //textFlex.div.style.color = '#fff';
  textFlex.div.style.color = '#000';
  centerText2(textFlex.div);

  if(deleting) {
    var recoup = f.getCrop().getRecoup();
    textFlex.div.textEl.innerHTML = keyname + '+' + verb + '<br><br>recoup: ' + recoup.toString();
  } else {
    if(c) {
      var canvasFlex = new Flex(shiftCropFlex, 0.01, [0.5, 0, -0.35], [0, 0, 0.7], [0.5, 0, 0.35]);
      var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
      renderImage(c.image[4], canvas);
      var updatefun = function() {
        var recoup = Res(0);
        if(f.hasCrop()) recoup = f.getCrop().getRecoup();
        var cost = c.getCost().sub(recoup);
        var afford = cost.le(state.res);
        var text = keyname + '+' + verb + '<br>' + upper(c.name);
        if(!selecting) text += '<br>' + (afford ? '' : '<font color="#888">') + 'Cost: ' + cost + ' (' + getCostAffordTimer(cost) + ')' + (afford ? '' : '</font>');
        textFlex.div.textEl.innerHTML = text;
      };
      updatefun();
      registerUpdateListener(function() {
        if((!cropChipShiftDown && !cropChipCtrlDown) || !shiftCropFlexShowing) return false;
        updatefun();
        return true;
      });
    } else {
      textFlex.div.textEl.innerHTML = keyname + '+' + verb + '<br><br>' + 'none set';
    }
  }

  addButtonAction(shiftCropFlex.div, removeShiftCropChip);
}

function updateFieldMouseOver(x, y) {
  shiftCropFlexX = x;
  shiftCropFlexY = y;
  if(shiftCropFlexShowing) showShiftCropChip(shiftCropFlexId);
}

function updateFieldMouseOut(x, y) {
  if(x == shiftCropFlexX && y == shiftCropFlexY) updateFieldMouseOver(-1, -1);
}

function updateFieldMouseClick(x, y) {
  updateFieldMouseOver(x, y);
}


////////////////////////////////////////////////////////////////////////////////


// the "shift+plant" chip at the bottom
var shiftCrop2Flex = undefined;
var shiftCrop2FlexId;
var shiftCrop2FlexX = -1;
var shiftCrop2FlexY = -1;
var shiftCrop2FlexShowing;

function removeShiftCrop2Chip() {
  shiftCrop2FlexShowing = false;

  if(!shiftCrop2Flex) return;

  shiftCrop2Flex.removeSelf(gameFlex);
  shiftCrop2Flex = undefined;
}

function showShiftCrop2Chip(crop_id) {
  removeShiftCrop2Chip();
  var shift = cropChipShiftDown;
  var ctrl = cropChipCtrlDown;
  if(!shift && !ctrl) return;

  var c = crop_id >= 0 ? crops2[crop_id] : undefined;

  shiftCrop2FlexShowing = true; // even when invisible due to not mouse over relevant field tile

  shiftCrop2FlexId = crop_id;

  var x = shiftCrop2FlexX;
  var y = shiftCrop2FlexY;

  var f;
  if(x < 0 || y < 0 || x == undefined || y == undefined) f = new Cell(undefined, undefined, true); // fake empty field cell to make it indicate "planting"
  else f = state.field2[y][x];

  var planting = !f.hasCrop(); // using !f.hasCrop(), rather than f.isEmpty(), to also show the planting chip when mouse is over the tree, rather than showing nothing then, to give the information in more places no matter where the mouse is
  var deleting = f.hasCrop() && ctrl && !shift && state.allowshiftdelete;
  var replacing = f.hasCrop() && shift && !ctrl && state.allowshiftdelete;
  //if(replacing && f.getCrop().index == state.lastPlanted) replacing = false; // replacing does not work if same crop. It could be deleting, or nothing, depending on plant growth, but display as nothing
  var upgrading = f.hasCrop() && shift && ctrl && state.allowshiftdelete && f.getCrop().tier < state.highestoftype2unlocked[f.getCrop().type];
  if(upgrading) c = croptype2_tiers[f.getCrop().type][state.highestoftype2unlocked[f.getCrop().type]];
  var selecting = f.hasCrop() && shift && ctrl && (!state.allowshiftdelete || f.getCrop().tier >= state.highestoftype2unlocked[f.getCrop().type]);
  if(selecting) c = f.getCrop();

  if(!planting && !deleting && !replacing && !upgrading && !selecting) return;

  var keyname = (shift ? (ctrl ? 'Shift+ctrl' : 'Shift') : 'Ctrl');
  var verb = planting ? 'planting' : (deleting ? 'deleting' : (replacing ? 'replacing' : (selecting ? 'selecting' : 'upgrading')));


  shiftCrop2Flex = new Flex(gameFlex, 0.2, 0.85, 0.8, 0.95, 0.5);
  shiftCrop2Flex.div.style.backgroundColor = planting ? '#dfd' : (deleting ? '#fdd' : '#ffd');
  shiftCrop2Flex.div.style.zIndex = 100; // above medal chip

  var textFlex = new Flex(shiftCrop2Flex, [0, 0, 0.0], [0.5, 0, -0.35], 0.99, [0.5, 0, 0.35], 0.4);
  //textFlex.div.style.color = '#fff';
  textFlex.div.style.color = '#000';
  centerText2(textFlex.div);

  if(deleting) {
    var recoup = f.getCrop().getCost(-1).mulr(cropRecoup2);
    textFlex.div.textEl.innerHTML = keyname + '+' + verb + '<br><br>recoup: ' + recoup.toString();
  } else {
    if(c) {
      var canvasFlex = new Flex(shiftCrop2Flex, 0.01, [0.5, 0, -0.35], [0, 0, 0.7], [0.5, 0, 0.35]);
      var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
      renderImage(c.image[4], canvas);
      var updatefun = function() {
        var recoup = Res(0);
        if(f.hasCrop()) recoup = f.getCrop().getCost(-1).mulr(cropRecoup2);
        var cost = c.getCost().sub(recoup);
        var afford = cost.le(state.res);
        var text = keyname + '+' + verb + '<br>' + upper(c.name);
        if(!selecting) text += '<br>' + (afford ? '' : '<font color="#888">') + 'Cost: ' + cost + ' (' + getCostAffordTimer(cost) + ')' + (afford ? '' : '</font>');
        textFlex.div.textEl.innerHTML = text;
      };
      updatefun();
      registerUpdateListener(function() {
        if((!cropChipShiftDown && !cropChipCtrlDown) || !shiftCrop2FlexShowing) return false;
        updatefun();
        return true;
      });
    } else {
      textFlex.div.textEl.innerHTML = keyname + '+' + verb + '<br><br>' + 'none set';
    }
  }

  addButtonAction(shiftCrop2Flex.div, removeShiftCrop2Chip);
}

function updateField2MouseOver(x, y) {
  shiftCrop2FlexX = x;
  shiftCrop2FlexY = y;
  if(shiftCrop2FlexShowing) showShiftCrop2Chip(shiftCrop2FlexId);
}

function updateField2MouseOut(x, y) {
  if(x == shiftCrop2FlexX && y == shiftCrop2FlexY) updateField2MouseOver(-1, -1);
}

function updateField2MouseClick(x, y) {
  updateField2MouseOver(x, y);
}

var cropChipShiftDown = false;
var cropChipCtrlDown = false;

function showCropChips() {
  // Show plant that will be planted when holding down shift or ctrl or cmd, but
  // only if in the field tab and no dialogs are visible
  if(state.currentTab == tabindex_field && dialog_level == 0) {
    var plant = cropChipShiftDown ? state.lastPlanted : brassica_0;
    showShiftCropChip(plant);
  }
  if(state.currentTab == tabindex_field2 && dialog_level == 0) {
    var plant = state.lastPlanted2;
    showShiftCrop2Chip(plant);
  }
}

// some keys here are not related to abilities, this function handles all global keys for now
document.addEventListener('keydown', function(e) {
  if(e.key == 'Shift' || e.key == 'Control' || e.key == 'Meta') {
    if(e.key == 'Shift') cropChipShiftDown = true;
    if(e.key == 'Control' || e.key == 'Meta') cropChipCtrlDown = true;
    showCropChips();
    removeAllTooltips();
  }
});

document.addEventListener('keyup', function(e) {
  if(e.key == 'Shift' || e.key == 'Control' || e.key == 'Meta') {
    if(e.key == 'Shift') cropChipShiftDown = false;
    if(e.key == 'Control' || e.key == 'Meta') cropChipCtrlDown = false;
    if(!cropChipShiftDown && !cropChipCtrlDown) {
      removeShiftCropChip();
      removeShiftCrop2Chip();
    } else {
      showCropChips();
    }
  }
});

// if keyup happens outside of window, ctrl or shift up are not detected, reset the chips then too to avoid leftover chips while shift or ctrl are not down (e.g. when using some ctrl shortcut that goes to another window in the OS)
window.addEventListener('blur', function(e) {
  cropChipShiftDown = false;
  cropChipCtrlDown = false;

  removeShiftCropChip();
  removeShiftCrop2Chip();
});


