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

var paused = false;

var savegame_recovery_situation = false; // if true, makes it less likely to autosave, to ensure local storage preserves a valid older save

// saves to local storage
function saveNow(onsuccess) {
  save(state, function(s) {
    util.setLocalStorage(s, localstorageName);
    if(onsuccess) onsuccess(s);
  });
}

function loadFromLocalStorage(onsuccess, onfail) {
  var e = util.getLocalStorage(localstorageName);
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
    if(e.length > 22 && isBase64(e) && e[0] == 'E' && e[1] == 'F') {
      // save a recovery save in case something went wrong, but only if there isn't already one. Only some specific later actions like importing a save and hard reset will clear this
      var has_recovery = !!util.getLocalStorage(localstorageName_recover);
      if(!has_recovery) util.setLocalStorage(e, localstorageName_recover);

      var saves = getRecoverySaves();
      for(var i = 0; i < saves.length; i++) {
        showMessage(saves[i][0] + ' : ' + saves[i][1], '#f00', '#ff0');
      }
      if(saves.length == 0) {
        showMessage('current: ' + e, '#f00', '#ff0');
      }
      var text = loadlocalstoragefailedmessage;
      if(state && state.error_reason == 4) text += ' ' + loadfailreason_format;
      if(state && state.error_reason == 5) text += ' ' + loadfailreason_decompression;
      if(state && state.error_reason == 6) text += ' ' + loadfailreason_checksum;
      if(state && state.error_reason == 7) text += ' ' + loadfailreason_toonew;
      if(state && state.error_reason == 8) text += ' ' + loadfailreason_tooold;

      showMessage(text, '#f00', '#ff0');
      showSavegameRecoveryDialog(true);

      savegame_recovery_situation = true;
    }
    onfail(state);
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

function hardReset() {
  showMessage('Hard reset performed, everything reset');
  util.clearLocalStorage(localstorageName);
  util.clearLocalStorage(localstorageName_recover);
  util.clearLocalStorage(localstorageName_success);
  util.clearLocalStorage(localstorageName_prev_version);
  util.clearLocalStorage(localstorageName_prev_version2);
  util.clearLocalStorage(localstorageName_undo);
  util.clearLocalStorage(localstorageName_manual);
  util.clearLocalStorage(localstorageName_transcend);
  postload(createInitialState());

  undoSave = '';
  lastUndoSaveTime = 0;

  savegame_recovery_situation = false;

  prefield = [];

  initUI();
  update();
}

function softReset() {
  save(util.clone(state), function(s) {
    util.setLocalStorage(s, localstorageName_transcend);
  });
  util.clearLocalStorage(localstorageName_recover); // if there was a recovery save, delete it now assuming that trascending means all about the game is going fine
  savegame_recovery_situation = false;

  var resin = state.resin;
  var tlevel = Math.floor(state.treelevel / min_transcension_level);
  if(tlevel < 1) tlevel = 1;
  resin = resin.mulr(tlevel);

  var essence = getUpcomingFruitEssence();
  var message = 'Transcended! Got resin: ' + resin.toString();
  if(state.fruit_sacr.length) message += '. Sacrificed ' + state.fruit_sacr.length + ' fruits and got ' + essence.toString();

  showMessage(message, '#40f', '#ffd');
  if(state.g_numresets == 0) {
    showRegisteredHelpDialog(1);
  }

  // state.c_runtime = util.getTime() - state.c_starttime; // state.c_runtime was computed by incrementing each delta, but this should be numerically more precise

  // first ethereal crops
  state.crops2[berry2_0].unlocked = true;
  state.crops2[mush2_0].unlocked = true;
  state.crops2[flower2_0].unlocked = true;
  state.crops2[special2_0].unlocked = true;
  state.crops2[lotus2_0].unlocked = true;

  state.time = util.getTime();
  state.prevtime = state.time;

  state.reset_stats.push(state.treelevel);
  if(state.reset_stats.length > 100) state.reset_stats = state.reset_stats.shift();

  state.p_starttime = state.c_starttime;
  state.p_runtime = state.c_runtime;
  state.p_numticks = state.c_numticks;
  state.p_res = state.c_res;
  state.p_max_res = state.c_max_res;
  state.p_max_prod = state.c_max_prod;
  state.p_numferns = state.c_numferns;
  state.p_numplantedshort = state.c_numplantedshort;
  state.p_numplanted = state.c_numplanted;
  state.p_numfullgrown = state.c_numfullgrown;
  state.p_numunplanted = state.c_numunplanted;
  state.p_numupgrades = state.c_numupgrades;
  state.p_numupgrades_unlocked = state.c_numupgrades_unlocked;
  state.p_numabilities = state.c_numabilities;
  state.p_numfruits = state.c_numfruits;
  state.p_numfruitupgrades = state.p_numfruitupgrades;

  if(state.g_slowestrun == 0) {
    state.g_fastestrun = state.c_runtime;
    state.g_slowestrun = state.c_runtime;
  } else {
    state.g_fastestrun = Math.min(state.g_fastestrun, state.c_runtime);
    state.g_slowestrun = Math.max(state.g_slowestrun, state.c_runtime);
  }

  state.c_starttime = state.time;
  state.c_runtime = 0;
  state.c_numticks = 0;
  state.c_res = Res();
  state.c_max_res = Res();
  state.c_max_prod = Res();
  state.c_numferns = 0;
  state.c_numplantedshort = 0;
  state.c_numplanted = 0;
  state.c_numfullgrown = 0;
  state.c_numunplanted = 0;
  state.c_numupgrades = 0;
  state.c_numupgrades_unlocked = 0;
  state.c_numabilities = 0;
  state.c_numfruits = 0;
  state.c_numfruitupgrades = 0;

  state.g_treelevel = Math.max(state.treelevel, state.g_treelevel);
  state.p_treelevel = state.treelevel;

  state.g_numresets++;

  state.lastPlanted = -1;
  state.lastPlanted2 = -1;

  state.res.seeds = Num(0);
  state.res.spores = Num(0);


  var starterResources = getStarterResources();
  state.res.addInPlace(starterResources);
  state.g_res.addInPlace(starterResources);
  state.c_res.addInPlace(starterResources);

  state.res.resin.addInPlace(resin);
  state.g_res.resin.addInPlace(resin);
  state.c_res.resin.addInPlace(resin);
  state.g_resin_from_transcends.addInPlace(resin);
  state.resin = Num(0); // future resin from next tree


  // fruits
  state.res.addInPlace(essence);
  state.g_res.addInPlace(essence);
  state.c_res.addInPlace(essence);
  state.fruit_sacr = [];

  // fix the accidental grow time ethereal upgrade that accidentally gave 7x7 field due to debug code in version 0.1.11
  // TODO: update this code to match next such upgrades this code once a 7x7 upgrade exists!
  if(state.numw == 7 && state.numh == 7) {
    var size = (state.upgrades2[upgrade2_field6x6].count) ? 6 : 5;
    state.numw = size;
    state.numh = size;
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

  gain = new Res();

  state.misttime = 0;
  state.suntime = 0;
  state.rainbowtime = 0;

  state.crops = [];
  for(var i = 0; i < registered_crops.length; i++) {
    state.crops[registered_crops[i]] = new CropState();
  }
  state.crops[short_0].unlocked = true;

  state.upgrades = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    state.upgrades[registered_upgrades[i]] = new UpgradeState();
  }

  if(state.upgrades2[upgrade2_blackberrysecret].count) {
    upgrades[berryunlock_0].fun();
  }

  setTab(0);


  postupdate();

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
var ACTION_PLANT = action_index++;
var ACTION_DELETE = action_index++; //un-plant
var ACTION_UPGRADE = action_index++;
var ACTION_PLANT2 = action_index++;
var ACTION_DELETE2 = action_index++;
var ACTION_UPGRADE2 = action_index++;
var ACTION_ABILITY = action_index++;
var ACTION_TRANCSEND = action_index++;
var ACTION_FRUIT_SLOT = action_index++;
var ACTION_FRUIT_LEVEL = action_index++;

var lastSaveTime = util.getTime();

var preupdate = function(opt_fromTick) {
  return !opt_fromTick || !paused;
};

var postupdate = function() {
  // nothing to do currently
};


var undoSave = '';
var lastUndoSaveTime = 0;
var minUndoTime = 60;

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
  if(undoSave == '' || !undoSave) {
    showMessage('No undo present. Undo is stored when performing an action.', invalidFG, invalidBG);
    return;
  }
  save(state, function(redoSave) {
    load(undoSave, function(state) {
      //showMessage('Last group of actions undone. Press undo again now to redo. Once you do other actions, a new undo is saved instead. "group of actions" means actions such as planting, upgrades, ... that occured roughly within the span of a minute. If the last action was a very long time ago, then an undo from that long ago will be loaded, but all production should be computed correctly. When you reload the page, the undo is gone.');
      showMessage('Undone', '#f8a');
      initUI();
      update();
      undoSave = redoSave;
      util.setLocalStorage(undoSave, localstorageName_undo);
    }, function(state) {
      showMessage('Not undone, failed to load undo-save');
    });
  }, function() {
    showMessage('Not undone, failed to save redo save');
  });

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
    if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) x++;
    return [x, y];
  }
  var r = Math.floor(Math.random() * num);
  var i = 0;
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(f.index == 0 || f.index == FIELD_REMAINDER) {
        if(i == r) return [x, y];
        i++;
      }
    }
  }
  return undefined; // something went wrong
}


function getSeasonAt(time) {
  var t = time - state.g_starttime;
  t /= (24 * 3600);
  return Math.floor(t) % 4;
}

// result: 0=spring, 1=summer, 2=autumn, 3=winter
function getSeason() {
  return getSeasonAt(state.time);
}

function timeTilNextSeason() {
  var daylen = 24 * 3600;
  var t = state.time - state.g_starttime;
  t /= daylen;
  t -= Math.floor(t);
  return daylen - t * daylen;
}

// field cell with precomputed info
function PreCell(f) {
  this.f = f; // the associated field cell from the state
  this.x = f.x;
  this.y = f.y;

  // boost of this plant, taking field position into account. Used during precompute of field: amount of bonus from this cell if it's a flower, nettle, ...
  // 0 means no boost, 1 means +100% boost, etc...
  // if this is a malus-type, e.g. nettle for flower and berry, then this boost is still the positive value (nettle to mushroom boost),
  // and must be used as follows to apply the malus: with a malus value starting at 1 for no neighbors, per bad neighbor, divide malus through (boost + 1). That is multiplicative (division), while the possitive bonus is additive.
  // --> this is already calculated in for flowers. For berries it must be done as above.
  this.boost = Num(0);


  this.weights = null; // used during precompute of field: if filled in, array of 4 elements: weights for N, E, S, W neighbors of their share of recource consumption from this. Used for mushrooms taking seeds of neighboring berries.

  // different stages of the production computation, some useful for certain UI, others not, see the comments

  // before consumption/production computation. not taking any leech into account (multiply prod or cons with 1+leech if that's needed, or see prod0b below)
  // useful for UI that shows the potential production of a mushroom if it hypothetically got as many seeds as needed from neighbors
  this.prod0 = Res();
  // for UI only, like prod0, but with final leech added. Not to be used in any computation. Represents the potential rather than actual production/consumption.
  this.prod0b = Res();
  // during consumption/production computation, not useful for any UI, intermediate stage only
  this.prod1 = Res();
  // after consumption/production computation, and after leeching, so useable as actual production value, not just temporary
  // useful for UI showing actual production of this plant (however doesn't show consumption as negatives have been zeroed out and subtracted frmo producers instead), and also for the actual computation of resources gained during an update tick
  this.prod2 = Res();
  // for UI only, here the consumption is not zeroed out but negative, and is not subtracted from producers. The sum of all prod3 on a field should be equal to the sum of all prod2. Also contains leech like prod2 does. However, the sum of all prod2 will be more numerically precise than that of prod3.
  this.prod3 = Res();

  this.consumers = []; // if this is a berry: list of mushroom neighbors that consume from this
  this.producers = []; // if this is a mushroom: list of berry neighbors that produce for this

  this.leech = Num(0); // how much leech there is on this plant. e.g. if 4 watercress neighbors leech 100% each, this value is 4 (in reality that high is not possible due to the penalty for multiple watercress)

  // breakdown of the production for UI. Is like prod0, but with leech result added. Does not take consumption into account, and shows the negative consumption value of mushroom.
  this.breakdown = [];

  // breakdown of the leech %
  this.breakdown_leech = [];

  this.last_it = -1;

  // how many neighbors this was leeching (for watercress. For visual effects.)
  this.leechnum = 0;

  // for mistletoe
  // could also be used for winter warmth but isn't yet currently, it's only computed for mistletoe now
  this.treeneighbor = false;
};

// field with precomputed info, 2D array, separate from state.field because not saved but precomputed at each update()
var prefield = [];

// precompute boosts of things that depend on each other on the field
// the dependency graph (of crops on neighbor crops) is as follows:
// - flower and berry depend on nettle for the negative effect
// - berry and mushroom depends on flower for the boost
// - mushroom depends on nettle for the boost
// - mushroom depends on berry for the spores income
// - watercress depends on mushroom and berry for the leech, but you could see this the opposite direction, muchroom depends on watercress to precompute how much extra seeds are being consumed for the part copied by the watercress
// --> watercress leech output is computed after all producing/consuming/bonuses have been done. watercress does not itself give seeds to mushrooms. watercress gets 0 seeds from a berry that has all seeds going to neighboring mushrooms.
// - watercress depends on overall watercress amount on field for the large-amount penalty.
function precomputeField() {
  var w = state.numw;
  var h = state.numh;

  prefield = [];
  for(var y = 0; y < h; y++) {
    prefield[y] = [];
    for(var x = 0; x < w; x++) {
      prefield[y][x] = new PreCell(state.field[y][x]);
    }
  }

  state.mistletoes = 0;

  // pass 1: compute boosts of flowers and nettles, and other misc position related features
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      if(c) {
        var p = prefield[y][x];
        if(c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_NETTLE) {
          p.boost = c.getBoost(f, p.breakdown);
        }
        if(c.type == CROPTYPE_MISTLETOE && f.growth >= 1) {
          for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
            var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
            var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            var f2 = state.field[y2][x2];
            if(f2.index == FIELD_TREE_TOP || f2.index == FIELD_TREE_BOTTOM) {
              p.treeneighbor = true;
              state.mistletoes++;
              break;
            }
          }
        }
      }
    }
  }

  // pass 2: compute amount of leech each cell gets
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      if(c) {
        if(c.type == CROPTYPE_SHORT) {
          var leech = c.getLeech(f);
          for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
            var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
            var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            prefield[y2][x2].leech.addInPlace(leech);
          }
        }
      }
    }
  }

  // pass 3: compute basic production/consumption of each cell, without taking input/output connections (berries to mushrooms) into account, just the full value
  // production without leech, consumption with leech (if watercress leeches from mushroom, adds that to its consumption, but not the leeched spores production, that's added in a later step)
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      if(c) {
        if(c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_NETTLE) continue; // don't overwrite their boost breakdown with production breakdown
        var p = prefield[y][x];
        var prod = c.getProd(f, false, p.breakdown);
        p.prod0 = prod;
        p.prod0b = Res(prod); // a separate copy
        // prod1 is, for the case of mushrooms and seeds, a negative amount of seeds, and if there is leech, the total amount of seeds needed included for the leeched spores.
        // pass 4 will then add positive seeds from berry neighbors to prod1, and when prod1 reaches 0 (or higher), the full consumption has been satisfied, otherwise it's partial
        p.prod1 = Res(prod);
        if(p.prod1.seeds.ltr(0)) p.prod1.seeds.mulInPlace(p.leech.addr(1));
      }
    }
  }

  // pass 4a: compute list/graph of neighboring producers/consumers
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      if(c) {
        if(c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH) {
          var p = prefield[y][x];
          for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
            var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
            var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            var f2 = state.field[y2][x2];
            var c2 = f2.getCrop();
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
        var c = f.getCrop();
        if(c) {
          if(c.type == CROPTYPE_MUSH) {
            var p = prefield[y][x];
            if(p.producers.length == 0) continue; // no producers at all for this mushroom
            // want is how much seeds we want, but only for the slice allocated to this producer
            // computed outside of the producers loop to ensure it's calculated the same for all producers
            //var want = p.prod1.seeds.neg().divr(p.producers.length).mul(p.leech.addr(1));
            var want = p.prod1.seeds.neg().divr(p.producers.length);
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
                want = p.prod1.seeds.neg().mul(p.leech.addr(1));
                have = p2.prod1.seeds;
              }
              var amount = Num.min(want, have);
              if(amount.gter(0)) {
                did_something = true;
                p.prod1.seeds.addInPlace(amount);
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
      var c = f.getCrop();
      if(c) {
        var p = prefield[y][x];
        p.prod2 = Res(p.prod1);
        p.prod3 = Res(p.prod0);
        if(c.type == CROPTYPE_MUSH) {
          var wanted = p.prod0.seeds.neg().mul(p.leech.addr(1));
          if(wanted.eqr(0)) continue; // zero input required, so nothing to do (no current mushroom has this case though, but avoid NaNs if it'd happen)
          var gotten = wanted.add(p.prod1.seeds); // prod1.seeds is <= 0 so is a subtraction
          var ratio = gotten.div(wanted);
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

  // pass 5: leeching
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      var p = prefield[y][x];
      var c = f.getCrop();
      if(c) {
        if(c.type == CROPTYPE_SHORT) {
          var leech = c.getLeech(f);
          var p = prefield[y][x];
          var total = Res();
          var num = 0;
          for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
            var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
            var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
            if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
            var f2 = state.field[y2][x2];
            var c2 = f2.getCrop();
            if(c2) {
              var p2 = prefield[y2][x2];
              if(c2.type == CROPTYPE_BERRY || c2.type == CROPTYPE_MUSH) {
                var leech0 = p2.prod0.mul(leech);
                var leech2 = p2.prod2.mul(leech);
                var leech3 = p2.prod3.mul(leech);
                p.prod2.addInPlace(leech2);
                p.prod3.addInPlace(leech3);
                p.prod0b.addInPlace(leech0);
                total.addInPlace(leech3); // for the breakdown
                num++;
              }
            }
          }
          p.leechnum = num;
          // also add this to the breakdown
          if(!total.empty()) {
            p.breakdown.push(['<b><i><font color="#060">copying neighbors (' + num + ')</font></i></b>', false, total, p.prod3.clone()]);
            c.getLeech(f, p.breakdown_leech);
          } else {
            if(state.upgrades[berryunlock_0].count) p.breakdown.push(['no neighbors, not copying', false, total, p.prod3.clone()]);
          }
        }
      }
    }
  }
};

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

function addRandomFruit() {
  var level = state.treelevel;

  var tier = getNewFruitTier(getRandomFruitRoll(), state.treelevel);

  var fruit = new Fruit();
  fruit.tier = tier;

  var num_abilities = getNumFruitAbilities(tier);

  var abilities = [FRUIT_BERRYBOOST, FRUIT_MUSHBOOST, FRUIT_MUSHEFF, FRUIT_FLOWERBOOST, FRUIT_LEECH, FRUIT_GROWSPEED, FRUIT_COOLDOWN, FRUIT_FERN];

  for(var i = 0; i < num_abilities; i++) {
    var roll = Math.floor(getRandomFruitRoll() * abilities.length);
    var ability = abilities[roll];
    abilities.splice(roll, 1);
    var level = 1 + Math.floor(getRandomFruitRoll() * 4);

    fruit.abilities.push(ability);
    fruit.levels.push(level);
  }

  if(state.fruit_active.length == 0) {
    setFruit(0, fruit);
  } else if(state.fruit_stored.length < state.fruit_slots) {
    setFruit(10 + state.fruit_stored.length, fruit);
  } else {
    setFruit(20 + state.fruit_sacr.length, fruit);
  }

  state.c_numfruits++;
  state.g_numfruits++;

  updateFruitUI();
  return fruit;
}

// unlocks and shows message, if not already unlocked
function unlockEtherealCrop(id) {
  var c = crops2[id];
  var c2 = state.crops2[id];
  if(c2.unlocked) return;
  showMessage('Ethereal crop available: "' + c.name + '"', '#44f', '#ff8');
  c2.unlocked = true;
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

  var time = timeTilNextSeason();

  var addtime = function(time2) {
    time = Math.min(time, time2);
  };

  if((state.time - state.misttime) < getMistDuration()) addtime(getMistDuration() - state.time + state.misttime);
  if((state.time - state.suntime) < getSunDuration()) addtime(getSunDuration() - state.time + state.suntime);
  if((state.time - state.rainbowtime) < getRainbowDuration()) addtime(getRainbowDuration() - state.time + state.rainbowtime);

  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      if(c) {
        if(c.type == CROPTYPE_SHORT) {
          addtime(c.getPlantTime() * (f.growth));
        } else if(f.growth < 1) {
          addtime(c.getPlantTime() * (1 - f.growth)); // time remaining for this plant to become full grown
        }
      }
    }
  }

  return time;
}

var update = function(opt_fromTick) {
  var undostate = undefined;
  if(actions.length > 0 && (util.getTime() - lastUndoSaveTime > minUndoTime)) {
    undostate = util.clone(state);
  }
  var store_undo = false;

  // for messages in case of long delta
  var num_season_changes = 0;
  var num_tree_levelups = 0;

  if(!preupdate(opt_fromTick)) return;

  if(state.prevtime == 0) state.prevtime = util.getTime();

  var preseasongain = undefined;

  var oldres = Res(state.res);
  var oldtime = state.prevtime; // time before even multiple updates from the loop below happened
  var done = false;
  var numloops = 0;
  for(;;) {
    if(done) break;
    if(numloops++ > 365) break;

    var prevtime = state.prevtime;
    var time = util.getTime(); // in seconds

    state.time = state.prevtime; // to let the nextEventTime() computation work as desired now
    var d = (state.prevtime == 0 || state.prevtime > time) ? 0 : (time - state.prevtime); // delta time for this tick. Set to 0 if in future (e.g. timezone change or daylight saving could have happened)
    var rem = 0;
    if(d > 1) rem = nextEventTime() + 0.5; // for numerical reasons, ensure it's not exactly at the border of the event
    if(d > rem && rem > 2) {
      d = rem;
      time = state.prevtime + d;
      done = false;
      state.time = time - 2; // as opposed to the numerical fix above that added 1 second, now subtract 2 seconds from state.time so that it's for sure in the interval of the current intended event (before the ability ran out, before the season changed to the next, ...)
    } else {
      done = true;
      state.time = time;
    }
    state.prevtime = time;

    if(getSeasonAt(prevtime) != getSeasonAt(time)) {
      if(gain) preseasongain = Res(gain);
      num_season_changes++;
    }

    //if(numloops > 1 || !done) console.log('d: ' + d + ', rem: ' + rem + ', prevtime: ' + util.formatDate(prevtime)  + ', time: ' + util.formatDate(state.time) + ', season: ' + getSeason() + ' ' + getSeasonAt(prevtime) + ', done: ' + done);

    var d1 = d; // d without timemul

    d *= state.timemul;
    state.g_runtime += d;
    state.c_runtime += d;

    ////////////////////////////////////////////////////////////////////////////


    // gain added to the player's actual resources during this tick (virtualgain is per second, actualgain is per this tick)
    // includes also one-time events like fern
    // excludes costs
    // so best description is: "all resources added this tick"
    var actualgain = new Res();

    if(state.g_numticks == 0) {
      showMessage('You need to gather some resources. Click a fern to get some.', helpFG, helpBG);
    }

    var clickedfern = false; // if fern just clicked, don't do the next fern computation yet, since #resources is not yet taken into account

    // action
    for(var i = 0; i < actions.length; i++) {
      var action = actions[i];
      var type = action.type;
      if(type == ACTION_UPGRADE) {
        var u = upgrades[action.u];
        var shift = action.shift && (u.maxcount != 1);
        var num = 0;
        var res_before = Res(state.res);
        for(;;) {
          var cost = u.getCost();
          if(state.res.lt(cost)) {
            if(!(shift && num > 0)) {
              showMessage('not enough resources for upgrade: need ' + cost.toString() +
                  ', have: ' + Res.getMatchingResourcesOnly(cost, state.res).toString(), invalidFG, invalidBG);
            }
            break;
          } else if(!u.canUpgrade()) {
            if(!(shift && num > 0)) {
              showMessage('this upgrade is not currently available', invalidFG, invalidBG);
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
            if(!shift) showMessage(message, '#ff0', '#000');
            store_undo = true;
            state.c_numupgrades++;
            state.g_numupgrades++;
          }
          if(!shift) break;
          if(shift && u.isExhausted()) break;
          if(num > 1000) break; // this is a bit long, infinite loop?
        }
        if(shift && num) {
          var total_cost = res_before.sub(state.res);
          if(num == 1) {
            showMessage('upgraded: ' + u.getName() + ', consumed: ' + total_cost.toString(), '#ff0', '#000');
          } else {
            showMessage('upgraded ' + u.name + ' ' + num + ' times to ' + u.getName() + ', consumed: ' + total_cost.toString(), '#ff0', '#000');
          }
        }
        if(num) {
          updateUI();
          if(action.u == berryunlock_0) {
            showRegisteredHelpDialog(3);
          }
          if(action.u == mushunlock_0) {
            showRegisteredHelpDialog(19);
          }
          if(action.u == flowerunlock_0) {
            showRegisteredHelpDialog(20);
          }
          if(action.u == nettle_0) {
            if(state.g_numresets > 0) {
              showRegisteredHelpDialog(21);
            }
          }
          if(action.u == mistletoeunlock_0) {
            if(state.g_numresets > 0) {
              showRegisteredHelpDialog(17);
            }
          }
        }
      } else if(type == ACTION_UPGRADE2) {
        var u = upgrades2[action.u];
        var cost = u.getCost();
        if(state.res.lt(cost)) {
          showMessage('not enough resources for ethereal upgrade: need ' + cost.toString() +
              ', have: ' + Res.getMatchingResourcesOnly(cost, state.res).toString(), invalidFG, invalidBG);
        } else if(!u.canUpgrade()) {
          showMessage('this ethereal upgrade is not currently available', invalidFG, invalidBG);
        } else  {
          state.res.subInPlace(cost);
          u.fun();
          showMessage('Ethereal upgrade applied: ' + u.getName() + ', consumed: ' + cost.toString(), '#ffc', '#640');
          store_undo = true;
          state.g_numupgrades2++;
        }
        updateUI();
      } else if(type == ACTION_PLANT) {
        var f = state.field[action.y][action.x];
        var c = action.crop;
        var cost = c.getCost();
        if(f.hasCrop()) {
          showMessage('field already has crop', invalidFG, invalidBG);
        } else if(f.index != 0 && f.index != FIELD_REMAINDER) {
          showMessage('field already has something', invalidFG, invalidBG);
        } else if(!state.crops[c.index].unlocked) {
          if(action.shiftPlanted) {
            state.lastPlanted = -1;
            showMessage(shiftClickPlantUnset, invalidFG, invalidBG);
          }
        } else if(state.res.lt(cost)) {
          showMessage('not enough resources to plant ' + c.name + ': need ' + cost.toString() +
                      ', have: ' + Res.getMatchingResourcesOnly(cost, state.res).toString(), invalidFG, invalidBG);
        } else {
          if(c.type == CROPTYPE_SHORT) {
            state.g_numplantedshort++;
            state.c_numplantedshort++;
            if(state.c_numplantedshort == 1 && state.c_numplanted == 0) {
              // commented out: this help dialog pops up together with the "first upgrade" one, one of them is enough. The upgrades one contains a note about permanent crops now, and the SHIFT/CTRL tip is moved to first permanent crop dialog
              /*showHelpDialog(4,
                'you planted your first plant! It\'s producing seeds. This one (unlike most later ones) is short-lived so will need to be replanted soon. Watercress will remain useful later on as well since it can leech.' +
                '<br><br>' +
                'TIP: hold SHIFT to plant last crop type, CTRL to plant watercress',
                watercress[4]);*/
            }
          } else {
            state.g_numplanted++;
            state.c_numplanted++;
          }
          state.res.subInPlace(cost);
          f.index = c.index + CROPINDEX;
          f.growth = 0;
          if(c.type == CROPTYPE_SHORT) f.growth = 1;
          computeDerived(state); // correctly update derived stats based on changed field state
          store_undo = true;
          var nextcost = c.getCost(0);
          if(!action.silent) showMessage('planted ' + c.name + '. Consumed: ' + cost.toString() + '. Next costs: ' + nextcost + ' (' + getCostAffordTimer(nextcost) + ')');
        }
      } else if(type == ACTION_PLANT2) {
        var f = state.field2[action.y][action.x];
        var c = action.crop;
        var cost = c.getCost();
        if(f.hasCrop()) {
          showMessage('field already has crop', invalidFG, invalidBG);
        } else if(f.index != 0) {
          showMessage('field already has something', invalidFG, invalidBG);
        } else if(!state.crops2[c.index].unlocked) {
          if(action.shiftPlanted) {
            state.lastPlanted2 = -1;
            showMessage(shiftClickPlantUnset, invalidFG, invalidBG);
          }
        } else if(state.res.lt(cost)) {
          showMessage('not enough resources to plant ' + c.name + ': need ' + cost.toString() +
                      ', have: ' + Res.getMatchingResourcesOnly(cost, state.res).toString(), invalidFG, invalidBG);
        } else {
          showMessage('planted ethereal ' + c.name + '. Consumed: ' + cost.toString() + '. Next costs: ' + c.getCost(1));
          state.g_numplanted2++;
          state.res.subInPlace(cost);
          f.index = c.index + CROPINDEX;
          f.growth = 0;
          f.justplanted = true;
          if(f.cropIndex() == special2_0) {
            var extrastarter = getStarterResources(1).sub(getStarterResources(0));
            state.res.addInPlace(extrastarter);
            state.g_res.addInPlace(extrastarter);
            state.c_res.addInPlace(extrastarter);
          }
          computeDerived(state); // correctly update derived stats based on changed field state
          store_undo = true;
        }
      } else if(type == ACTION_DELETE) {
        var f = state.field[action.y][action.x];
        if(f.hasCrop()) {
          var c = f.getCrop();
          var recoup = c.getCost(-1).mulr(cropRecoup);
          if(f.growth < 1 && c.type != CROPTYPE_SHORT) {
            recoup = c.getCost(-1);
            if(!action.silent) showMessage('plant was still growing, full refund given', '#f8a');
            state.g_numplanted--;
            state.c_numplanted--;
          } else {
            state.g_numunplanted++;
            state.c_numunplanted++;
          }
          f.index = 0;
          f.growth = 0;
          computeDerived(state); // need to recompute this now to get the correct "recoup" cost of a plant which depends on the derived stat
          if(c.type == CROPTYPE_SHORT) {
            if(!action.silent) showMessage('deleted ' + c.name + '. Since this is a short-lived plant, nothing is refunded');
          } else {
            state.res.addInPlace(recoup);
            if(!action.silent) showMessage('deleted ' + c.name + ', got back: ' + recoup.toString());
          }
          store_undo = true;
        }
      } else if(type == ACTION_DELETE2) {
        var f = state.field2[action.y][action.x];

        var remstarter = null; // remove starter resources that were gotten from this fern when deleting it
        if(f.cropIndex() == special2_0) remstarter = getStarterResources(0).sub(getStarterResources(-1));
        if(state.delete2tokens <= 0 && f.hasCrop() && f.growth >= 1) {
          showMessage('cannot delete: must have ethereal deletion tokens to delete ethereal crops. You get ' + delete2perSeason + ' new such tokens per season (a season lasts 1 real-life day)' , invalidFG, invalidBG);
        } else if(f.justplanted && (f.growth >= 1 || crops2[f.cropIndex()].planttime <= 2)) {
          // the growth >= 1 check does allow deleting if it wasn't fullgrown yet, as a quick undo, but not for the crops with very fast plant time such as those that give starting cash
          showMessage('cannot delete: this ethereal crop was planted during this transcension. Must transcend at least once.');
        } else if(f.cropIndex() == special2_0 && state.res.lt(remstarter)) {
          showMessage('cannot delete: must have at least the starter seeds which this crop gave to delete it, they will be forfeited.', invalidFG, invalidBG);
        } else if(f.hasCrop()) {
          var c = crops2[f.cropIndex()];
          var recoup = c.getCost(-1).mulr(cropRecoup2);
          if(f.cropIndex() == special2_0) {
            state.res.subInPlace(remstarter);
            state.g_res.subInPlace(remstarter);
            state.c_res.subInPlace(remstarter);
          }
          if(f.growth < 1) {
            recoup = c.getCost(-1);
            showMessage('plant was still growing, resin refunded and no delete token used', '#f8a');
            state.g_numplanted2--;
          } else {
            state.g_numunplanted2++;
            if(state.delete2tokens > 0) state.delete2tokens--;
            showMessage('deleted ethereal ' + c.name + ', got back ' + recoup.toString() + ', used 1 ethereal deletion token, ' + state.delete2tokens + ' tokens left');
          }
          f.index = 0;
          f.growth = 0;
          computeDerived(state); // need to recompute this now to get the correct "recoup" cost of a plant which depends on the derived stat
          state.res.addInPlace(recoup);

          store_undo = true;
        }
      } else if(type == ACTION_FERN) {
        if(state.fern && state.fernx == action.x && state.ferny == action.y) {
          state.g_numferns++;
          state.c_numferns++;
          var fernres = state.fernres;
          if(state.fern == 1) {
            showMessage('That fern gave: ' + fernres.toString(), '#4a0', '#120', true);
          } else {
            fernres = fernres.mulr(5);
            showMessage('This fern is extra bushy! It gave ' + fernres.toString(), '#4a0', '#120', true);
          }
          actualgain.addInPlace(fernres);
          state.lastFernTime = state.time; // in seconds
          state.fern = 0;
          clickedfern = true;
          if(state.numcropfields == 0 && state.res.add(fernres).seeds.ger(10)) {
            showMessage('You have enough resources to plant. Click an empty field to plant', helpFG2, helpBG2);
          }
          store_undo = true;
        }
      } else if(type == ACTION_ABILITY) {
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
            showMessage(mistd < getMistDuration() ? 'mist is already active' : 'mist is not ready yet', invalidFG, invalidBG);
          } else if(already_ability) {
            showMessage('there already is an active weather ability', invalidFG, invalidBG);
          } else {
            state.misttime = state.time;
            showMessage('mist activated, mushrooms produce more spores, consume less seeds, and aren\'t affected by winter');
            store_undo = true;
            state.c_numabilities++;
            state.g_numabilities++;
          }
        } else if(a == 1) {
          if(!state.upgrades[upgrade_sununlock].count) {
            // not possible, ignore
          } else if(sund < getSunWait()) {
            showMessage(sund < getSunDuration() ? 'sun is already active' : 'sun is not ready yet', invalidFG, invalidBG);
          } else if(already_ability) {
            showMessage('there already is an active weather ability', invalidFG, invalidBG);
          } else {
            state.suntime = state.time;
            showMessage('sun activated, berries get a boost and aren\'t affected by winter');
            store_undo = true;
            state.c_numabilities++;
            state.g_numabilities++;
          }
        } else if(a == 2) {
          if(!state.upgrades[upgrade_rainbowunlock].count) {
            // not possible, ignore
          } else if(rainbowd < getRainbowWait()) {
            showMessage(rainbowd < getRainbowDuration() ? 'rainbow is already active' : 'rainbow is not ready yet', invalidFG, invalidBG);
          } else if(already_ability) {
            showMessage('there already is an active weather ability', invalidFG, invalidBG);
          } else {
            state.rainbowtime = state.time;
            showMessage('rainbow activated, flowers get a boost and aren\'t affected by winter');
            store_undo = true;
            state.c_numabilities++;
            state.g_numabilities++;
          }
        }
      } else if(type == ACTION_FRUIT_SLOT) {
        var f = action.f;
        var slottype = action.slot; // 0:active, 1:stored, 2:sacrificial
        var currenttype = ((f.slot < 10) ? 0 : ((f.slot < 20) ? 1 : 2));
        if(slottype == currenttype) {
          // nothing to do
        } else if(slottype == 0) {
          var f2 = getFruit(action.slot);
          // swaps
          setFruit(f.slot, f2);
          setFruit(action.slot, f);
        } else if(slottype == 1) {
          if(state.fruit_stored.length >= state.fruit_slots) {
            showMessage('stored slots already full', invalidFG, invalidBG);
          } else {
            var slot = 10 + state.fruit_stored.length;
            setFruit(f.slot, undefined);
            setFruit(slot, f);
          }
        } else if(slottype == 2) {
          var slot = 20 + state.fruit_sacr.length;
          setFruit(f.slot, undefined);
          setFruit(slot, f);
        }
        updateFruitUI();
      } else if(type == ACTION_FRUIT_LEVEL) {
        var f = action.f;
        var index = action.index;
        var a = f.abilities[index];
        var level = f.levels[index];
        var cost = getFruitAbilityCost(a, level, f.tier).essence;
        var available = state.res.essence.sub(f.essence);
        if(action.shift) {
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
                ', available for this fruit: ' + available.toString(), invalidFG, invalidBG);
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
      } else if(type == ACTION_TRANCSEND) {
        if(state.treelevel >= min_transcension_level) {
          softReset();
          store_undo = true;
        }
        // TODO: the rest of the update, cost/prod computation shouldn't happen anymore after this action, delta times and such are no longer relevant now.
      }
    }
    actions = [];

    if(store_undo && undostate) {
      storeUndo(undostate);
    }

    precomputeField();


    ////////////////////////////////////////////////////////////////////////////


    gain = Res();

    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f = state.field[y][x];
        if(f.hasCrop()) {
          var p = prefield[y][x];
          var c = f.getCrop();
          var prod = Res();
          if(c.type == CROPTYPE_SHORT) {
            var g = d / c.getPlantTime();
            var growth0 = f.growth;
            f.growth -= g;
            if(f.growth <= 0) {
              f.growth = 0;
              // add the remainder image, but only if this one was leeching at least 2 neighbors: it serves as a reminder of watercress you used for leeching, not *all* watercresses
              if(p.leechnum >= 2) f.index = FIELD_REMAINDER;
              else f.index = 0;
            }
            // it's ok to have the production when growth becoame 0: the nextEvent function ensures that we'll be roughly at the exact correct time where the transition happens (and the current time delta represents time where it was alive)
            prod = p.prod2;
          } else { // long lived plant
            if(f.growth < 1) {
              if(c.getPlantTime() == 0) {
                f.growth = 1;
              } else {
                var g = d / c.getPlantTime();
                var growth0 = f.growth;
                f.growth += g;
                if(f.growth >= 1) {
                  // just fullgrown now
                  f.growth = 1;
                  state.g_numfullgrown++;
                  state.c_numfullgrown++;
                  // it's ok to ignore the production: the nextEvent function ensures that we'll be roughly at the exact correct time where the transition happens (and the time delta represents the time when it was not yet fullgrown, so no production added)
                }
              }
            } else {
              // fullgrown
              prod = p.prod2;
            }
          }
          gain.addInPlace(prod);
          actualgain.addInPlace(prod.mulr(d));
        }
        updateFieldCellUI(x, y);
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
                  showMessage('your first ethereal plant in the ethereal field has fullgrown! It provides a bonus to your basic field.', helpFG, helpBG);
                }
              }
            }
          } else {
            // nothing to do, ethereal plants currently don't produce resources
          }
        }
        updateField2CellUI(x, y);
      }
    }



    var fern = false;
    var fernTimeWorth = 0;
    if(!state.fern && !clickedfern) {
      var progress = state.res.seeds;
      var mintime = 0;
      if(progress.eqr(0) && gain.empty()) mintime = 0;
      else if(progress.ltr(15)) mintime = 3;
      else if(progress.ltr(150)) mintime = 10;
      else if(progress.ltr(1500)) mintime = fern_wait_minutes * 60 / 2;
      else mintime = fern_wait_minutes * 60;
      if(state.upgrades[fern_choice0].count == 1) mintime += fern_choice0_a_minutes * 60;
      if(state.time > state.lastFernTime + mintime) {
        fern = true;
      }
      // how much production time the fern is worth. This is how much extra production boost active players can get over passive players
      // e.g. 0.25 means clicking all ferns makes you get 25% more income (on average, since there is a uniforn random 0.5..1.5 factor, plus due to the "extra bushy" ferns the real active production is actually a bit higher than this value)
      fernTimeWorth = mintime * 0.25;
    }
    if(fern) {
      var s = getRandomPreferablyEmptyFieldSpot();
      if(s) {
        var r = fernTimeWorth * (getRandomFernRoll() + 0.5);
        if(state.upgrades[fern_choice0].count == 2) r *= (1 + fern_choice0_b_bonus);
        var g = gain.mulr(r);
        if(g.seeds.ltr(2)) g.seeds = Math.max(g.seeds, Num(getRandomFernRoll() * 2 + 1));
        var fernres = new Res({seeds:g.seeds, spores:g.spores});

        var level = getFruitAbility(FRUIT_FERN);
        if(level > 0) {
          var mul = Num(1).add(getFruitBoost(FRUIT_FERN, level, getFruitTier()));
          fernres.mulInPlace(mul);
        }

        state.fernres = fernres;
        state.fern = 1;
        state.fernx = s[0];
        state.ferny = s[1];
        if(state.g_numferns == 6 || (state.g_numferns > 10 && getRandomFernRoll() < 0.1)) state.fern = 2; // extra bushy fern
      }
    }

    var req = treeLevelReq(state.treelevel + 1);
    if(state.res.ge(req)) {
      var resin = nextTreeLevelResin();
      var twigs = nextTwigs();
      actualgain.addInPlace(twigs);
      state.treelevel++;
      state.lasttreeleveluptime = state.time;
      num_tree_levelups++;
      if(getSeason() == 3) {
        showMessage('Winter resin bonus: ' + (getWinterTreeResinBonus().subr(1).mulr(100)).toString() + '%');
      }
      state.resin.addInPlace(resin);
      state.res.subInPlace(req);
      state.g_treelevel = Math.max(state.treelevel, state.g_treelevel);
      var message = 'Tree leveled up to: ' + tree_images[treeLevelIndex(state.treelevel)][0] + ', level ' + state.treelevel +
          '. Consumed: ' + req.toString() +
          '. Tree boost: ' + getTreeBoost().mulr(100).toString(2, Num.N_FULL) + '%' +
          '. Resin added: ' + resin.toString() + '. Total resin ready: ' + state.resin.toString();
      if(!twigs.empty()) message += '. Twigs from mistletoe added: ' + twigs.toString();
      if(state.treelevel == 9) {
        message += '. The tree is so close to becoming an adult tree now.';
      }
      showMessage(message, '#2f2');
      var fruit = undefined;
      if(state.treelevel == 2) {
        showRegisteredHelpDialog(12);
      } else if(state.treelevel == 3) {
        showHelpDialog(-13, 'The tree reached level ' + state.treelevel + ' and is providing a choice, see the new upgrade that provides two choices under "upgrades".');
      } else if(state.treelevel == 4) {
        showRegisteredHelpDialog(14);
      } else if(state.treelevel == 5) {
        fruit = addRandomFruit();
        showRegisteredHelpDialog(2);
      } else if(state.treelevel == 6) {
        showRegisteredHelpDialog(15);
      } else if(state.treelevel == 8) {
        showHelpDialog(-16, 'The tree reached level ' + state.treelevel + ' and is providing another choice, see the new upgrade that provides two choices under "upgrades".');
      } else if(state.treelevel == 15) {
        fruit = addRandomFruit();
        showRegisteredHelpDialog(18);
      } else if(state.treelevel == 20) {
        showRegisteredHelpDialog(23);
      } else if(state.treelevel == 25) {
        fruit = addRandomFruit();
      }
      if(state.treelevel == 1) {
        showRegisteredHelpDialog(6);
      } else if(state.treelevel == min_transcension_level) {
        showRegisteredHelpDialog(7);
      }
      if(fruit) {
        showMessage('fruit dropped: ' + fruit.toString() + '. ' + fruit.abilitiesToString());
      }
    }

    if(state.g_numresets > 0) {
      var req2 = treeLevel2Req(state.treelevel2 + 1);
      if(state.res.ge(req2)) {
        state.treelevel2++;
        var message = 'Ethereal tree leveled up to: ' + tree_images[treeLevelIndex(state.treelevel2)][0] + ', level ' + state.treelevel2 +
            '. Consumed: ' + req2.toString();
        message += '. Higher ethereal tree levels can unlock more ethereal upgrades and ethereal crops';
        state.res.subInPlace(req2);
        showMessage(message, '#88f', '#ff0');

        if(state.treelevel2 >= 1) {
          showRegisteredHelpDialog(22);
          unlockEtherealCrop(berry2_1);
        }
        if(state.treelevel2 >= 2) {
          unlockEtherealCrop(nettle2_0);
        }
        if(state.treelevel2 >= 3) {
          //unlockEtherealCrop(mush2_1);
        }
        if(state.treelevel2 >= 4) {
          //unlockEtherealCrop(flower2_1);
        }
      }
    }


    // compensation for savegames below version 0.1.17
    if(state.treelevel >= 5 && state.g_numfruits == 0 && state.fruit_seed == -1) {
      showMessage('Your tree level is higher than 5 but you didn\'t get a random fruit yet! Must have come from a previous version of the game before the "Fruit Update". One random fruit added now to get you started with this new feature.', '#ff0');
      addRandomFruit();
    }


    state.res.addInPlace(actualgain);

    // check unlocked upgrades
    for(var i = 0; i < registered_upgrades.length; i++) {
      var j = registered_upgrades[i];
      if(state.upgrades[j].unlocked) continue;
      if(upgrades[j].pre()) {
        if(state.upgrades[j].unlocked) {
          // the pre function itself already unlocked it, so perhaps it auto applied the upgrade. Nothing to do anymore here other than show a different message.
          showMessage('Received: "' + upgrades[j].getName() + '"', '#ffc', '#008');
        } else {
          state.upgrades[j].unlocked = true;
          state.c_numupgrades_unlocked++;
          state.g_numupgrades_unlocked++;
          if(state.c_numupgrades_unlocked == 1) {
            showRegisteredHelpDialog(8);
          }
          showMessage('Upgrade available: "' + upgrades[j].getName() + '"', '#ffc', '#008');
        }
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
          showMessage('Ethereal upgrade available: "' + upgrades2[j].getName() + '"', '#44f', '#ff8');
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
        showMessage('Achievement unlocked: ' + upper(medals[j].name), '#fe0', '#430');
        updateMedalUI();
        showMedalChip(j);

        if(j == medal_crowded_id && state.g_numresets == 0) {
          //showHelpDialog(10, 'The field is full. If more room is needed, old crops can be deleted, click a crop to see its delete button. Ferns will still appear safely on top of crops, no need to make room for them.');
        }
        if(state.g_nummedals == 1) {
          // TODO: have non intrusive achievement badges instead
          showHelpDialog(-11, 'You got your first achievement! Achievements give a slight production boost. See the "achievements" tab.');
        }
      }
    }

    state.g_res.addInPlace(actualgain);
    state.c_res.addInPlace(actualgain);
    state.g_max_res = Res.max(state.g_max_res, state.res);
    state.c_max_res = Res.max(state.c_max_res, state.res);
    state.g_max_prod = Res.max(state.g_max_prod, gain);
    state.c_max_prod = Res.max(state.c_max_prod, gain);
    state.g_numticks++;
    state.c_numticks++;

    computeDerived(state);
  } // end of loop for long ticks


  time = util.getTime();
  if(time > lastSaveTime + 180) {
    if(autoSaveOk()) {
      state.g_numautosaves++;
      saveNow(function() {
        // Remind to make backups if not done any save importing or exporting for 2 or more days
        if(time > Math.max(state.lastBackupWarningTime, Math.max(state.g_lastexporttime, state.g_lastimporttime)) + 2 * 24 * 3600) {
          showMessage(autoSavedStateMessageWithReminder, '#000', '#ff0');
          state.lastBackupWarningTime = util.getTime();
        } else {
          showMessage(autoSavedStateMessage, '#888');
        }
      });
      lastSaveTime = time;
    }
  }

  var d_total = state.prevtime - oldtime;
  if(d_total > 300) {
    var totalgain = state.res.sub(oldres);
    var season_message = '';
    if(num_season_changes > 1) {
      season_message = '. The season changed ' + num_season_changes + ' times';
    }
    var tree_message = '';
    if(num_tree_levelups > 0) {
      tree_message = '. The tree leveled up ' + num_tree_levelups + ' times';
    }
    showMessage('Large time delta: ' + util.formatDuration(d_total, true, 4, true) + ', gained at once: ' + totalgain.toString() + season_message + tree_message, '#999');
  }

  // Print the season change outside of the above loop, otherwise if you load a savegame from multiple days ago it'll show too many season change messages.
  // if num_season_changes > 1, it's already printed in the large time delta message above instead.
  if(num_season_changes == 1) {
    var gainchangemessage = '';
    if(preseasongain) gainchangemessage = '. Income before: ' + preseasongain.toString() + '. Income now: ' + gain.toString();
    showMessage('The season changed, it is now ' + seasonNames[getSeason()] + gainchangemessage, '#fff', '#260');
  }


  if(num_season_changes > 0) {
    state.g_seasons++;
    var num_tokens = num_season_changes * delete2perSeason;
    if(state.delete2tokens + num_tokens > delete2maxBuildup) num_tokens = delete2maxBuildup - state.delete2tokens;
    state.delete2tokens += num_tokens;
    state.g_delete2tokens += num_tokens;
    if(num_tokens > 0 && state.g_numresets > 0) showMessage('Received ' + num_tokens + ' ethereal deletion tokens', '#45d', '#9de');
  }

  updateResourceUI();
  updateUpgradeUIIfNeeded();
  updateUpgrade2UIIfNeeded();
  updateTabButtons();
  updateAbilitiesUI();
  if(updatetooltipfun) updatetooltipfun();
  if(updatedialogfun) updatedialogfun();

  showLateMessages();

  postupdate();
}



document.addEventListener('keydown', function(e) {
  if(e.key == 'w') {
    var replanted = false;
    var refreshed = false;
    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f = state.field[y][x];
        if(f.index == FIELD_REMAINDER) {
          actions.push({type:ACTION_PLANT, x:x, y:y, crop:crops[short_0], ctrlPlanted:true, silent:true});
          replanted = true;
        }
        if(f.index == CROPINDEX + short_0 && state.res.seeds.gtr(1000)) {
          actions.push({type:ACTION_DELETE, x:x, y:y, silent:true});
          actions.push({type:ACTION_PLANT, x:x, y:y, crop:crops[short_0], ctrlPlanted:true, silent:true});
          refreshed = true;
        }
      }
    }
    if(replanted) showMessage('replanting watercress');
    else if(refreshed) showMessage('refreshing watercress');
    update();
  }
});
