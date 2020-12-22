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

var state = createInitialState();

initUIGlobal();

var paused = false;

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
    prev_version = fromBase64[e[0]] + fromBase64[e[1]] * 64 + fromBase64[e[2]] * 4096;
    // NOTE: if there is a bug, and prev_version is a bad version with bug, then do NOT overwrite if prev_version is that bad one
    if(prev_version < version) {
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
      // save a recovery save in case something went wrong.
      util.setLocalStorage(e, localstorageName_recover);
      var prev = util.getLocalStorage(localstorageName_prev_version);
      if(prev) {
        showMessage('last from older game version: ' + prev, '#f00', '#ff0');
      }
      var manual = util.getLocalStorage(localstorageName_manual);
      if(manual) {
        showMessage('last manual save: ' + manual, '#f00', '#ff0');
      }
      var undo = util.getLocalStorage(localstorageName_undo);
      if(undo) {
        showMessage('last save for undo feature: ' + undo, '#f00', '#ff0');
      }
      var lastsuccess = util.getLocalStorage(localstorageName_success);
      if(lastsuccess) {
        showMessage('last known good: ' + lastsuccess, '#f00', '#ff0');
      }
      showMessage('current: ' + e, '#f00', '#ff0');
      var text = loadlocalstoragefailedmessage;
      if(state && state.error_reason == 4) text += ' ' + loadfailreason_format;
      if(state && state.error_reason == 5) text += ' ' + loadfailreason_decompression;
      if(state && state.error_reason == 6) text += ' ' + loadfailreason_checksum;
      if(state && state.error_reason == 7) text += ' ' + loadfailreason_toonew;

      showMessage(text, '#f00', '#ff0');
      //var dialog = createDialog();
    }
    state.savegame_recovery_situation = true;
    onfail(state);
  });
}

function hardReset() {
  showMessage('Hard reset performed, everything reset');
  util.clearLocalStorage(localstorageName);
  util.clearLocalStorage(localstorageName_recover);
  util.clearLocalStorage(localstorageName_success);
  util.clearLocalStorage(localstorageName_prev_version);
  util.clearLocalStorage(localstorageName_undo);
  util.clearLocalStorage(localstorageName_manual);
  postload(createInitialState());

  lastPlanted = -1;
  prev_season = -1;
  undoSave = '';
  lastUndoSaveTime = 0;
}

function softReset() {
  showMessage('Transcended! Got resin: ' + state.resin.toString(), '#40f', '#ffd');

  state.time = util.getTime();

  state.reset_stats.push(state.treelevel);
  if(state.reset_stats.length > 100) state.reset_stats = state.reset_stats.shift();

  state.p_starttime = state.c_starttime;
  state.p_max_res = state.c_max_res;
  state.p_max_prod = state.c_max_prod;
  state.p_numferns = state.c_numferns;
  state.p_numplanted = state.c_numplanted;
  state.p_numfullgrown = state.c_numfullgrown;
  state.p_numunplanted = state.c_numplanted;
  state.p_numupgrades = state.c_numupgrades;
  state.p_numupgrades_unlocked = state.c_numupgrades_unlocked;

  state.c_starttime = state.time;
  state.c_runtime = 0;
  state.c_numticks = 0;
  state.c_max_res = Res();
  state.c_max_prod = Res();
  state.c_numferns = 0;
  state.c_numplanted = 0;
  state.c_numfullgrown = 0;
  state.c_numunplanted = 0;
  state.c_numupgrades = 0;
  state.c_numupgrades_unlocked = 0;

  state.g_numresets++;

  lastPlanted = -1;

  state.res.seeds = Num(0);
  state.res.spores = Num(0);
  // reset these too: there's no purpose for them yet, they shouldn't stick around yet
  state.res.seeds2 = Num(0);
  state.res.spores2 = Num(0);

  var ethereal_starting_resources = new Res();
  if(state.upgrades2[upgrade2_starting0].count) ethereal_starting_resources.seeds.addrInPlace(10);
  if(state.upgrades2[upgrade2_starting1].count) ethereal_starting_resources.seeds.addrInPlace(100);
  state.res.resin.addInPlace(state.resin);
  state.resin = Num(0); // future resin from next tree

  clearField(state);

  state.treelevel = 0;

  state.fernres = new Res();
  state.fern = false;

  state.fogtime = 0;
  state.suntime = 0;
  state.rainbowtime = 0;

  state.crops = [];
  for(var i = 0; i < registered_crops.length; i++) {
    state.crops[registered_crops[i]] = new CropState();
  }
  state.crops[berry_0].unlocked = true;

  state.upgrades = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    state.upgrades[registered_upgrades[i]] = new UpgradeState();
  }

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

var lastSaveTime = util.getTime();

var preupdate = function(opt_fromTick) {
  return !paused;
};

var postupdate = function() {
  computeDerived(state);
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
      if(f.index == 0) {
        if(i == r) return [x, y];
        i++;
      }
    }
  }
  return undefined; // something went wrong
}

// result: 0=spring, 1=summer, 2=autumn, 3=winter
function getSeason() {
  var t = state.time - state.g_starttime;
  t /= (24 * 3600);
  return Math.floor(t) % 4;
}

function timeTilNextSeason() {
  var daylen = 24 * 3600;
  var t = state.time - state.g_starttime;
  t /= daylen;
  t -= Math.floor(t);
  return daylen - t * daylen;
}

/*
Computes resource income as follows, given that some crops can have negative income:
-if nothing has negative income, then it's simple: you gain SUM_crops(prod_crop/s * time_delta)
-if there's negative income but for each resource, total is still positive, then the same simple formula above applies
-if there's too much negative income, then things get different. If there's a resource that totals to negative:
--we compute a factor f: pos / neg, where pos is pos production of that resource by crops that produce it, neg is the consumption of those that consume it
--for each crop that has the relevant resource as consumption, its production will be multiplied by f, hence it produces less
--this is done in order of resources as they appear in a Resource struct, which is roughly in the order as they get unlocked in the game
-if the
-this makes the following assumptions (to simplify the algorithm, if more complexity is needed then this needs to be solved with linear programming instead (simplex algorithm))
--there are no circular dependencies, such as with resources A, B, C, three crops doing this: (+A,-B), (+B,-C), (+C,-A)
--no crop has more than 1 type of resource it consumes, so crops can be of form (-A,+B,+C) but not (-A,-B,+C)
--the resource a crop consumes is of an earlier type (in the Resource struct order) than any resource it produces, e.g. if A is a more basic earlier resource than B, then (-A,+B) is ok but (+A,-B) is not
--a not algorithm related assumption: crops that consume something also produce something: if they produce nothing, then they'll get no disadvantage whatsoever from having not enough input, since their already zero output just stays zero. They do take away input resources from other consumers though.
-if there are multiple different start and end times in the resources (which can happen if a crop finished growing during the update tick's timespan), then it does the computation individually and independently per timespan, and sums everything to the result

NOTE: The behavior, as intended, is as follows: if you have a crop consuming more A than is produced, then crop A will not consume from resources the player already has from before.
Crops can only consume directly from what is currently produced during the current tick. This is by design: production/s itself is a kind of resource and leftovers from old production can't create extra production/s.
The game should also make it such that you can only build something if you have enough total prod/s to handle its consumption/s. But, since you can delete crops after that, the negative income case handled here can indeed happen.

a is array of elements, where each element is array of:
-Resources: income for this crop per second, where some resources can be negative if it consumes instead
-starttime in seconds
-endtime in seconds
*/
function computeIncome(factor, a, opt_pos_only) {
  // breaking up per time slot is very likely overkill, but it does ensure that the computation is the
  // same whether it happens in many small ticks, or one very long tick.
  // breaking up time slots happens when a plant that was growing, is ready during the tick and starts producing then

  var times0 = [];
  var times1 = [];
  for(var i = 0; i < a.length; i++) {
    if(i == 0 || a[i][1] != times0[times0.length - 1]) times0.push(a[i][1]);
    if(i == 0 || a[i][2] != times1[times1.length - 1]) times1.push(a[i][2]);
  }
  times0.sort(function(a, b) { return a - b; });
  times1.sort(function(a, b) { return a - b; });
  var times = [];
  var i0 = 0, i1 = 0;
  for(;;) {
    if(i0 >= times0.length && i1 >= times1.length) break;

    if(i1 >= times1.length || times0[i0] <= times1[i1]) {
      if(times.length == 0 || times[times.length - 1] != times0[i0]) times.push(times0[i0]);
      i0++;
    } else {
      if(times.length == 0 || times[times.length - 1] != times1[i1]) times.push(times1[i1]);
      i1++;
    }
  }

  var buckets = [];
  for(var i = 0; i + 1 < times.length; i++) {
    var start = times[i];
    var end = times[i + 1];
    buckets[i] = [];
    for(var j = 0; j < a.length; j++) {
      if(a[j][1] <= start && a[j][2] >= end) {
        buckets[i].push(j);
      }
    }
  }

  var res = new Res(); // total result
  var ifactor = 1 / factor;

  // now do the full computation per bucket
  for(var b = 0; b < buckets.length; b++) {
    var bucket = buckets[b];
    var d = times[b + 1] - times[b]; // time delta in seconds
    var pos = (new Res()).toArray(); // all the positive produced resources
    var neg = (new Res()).toArray(); // all the negative produced resources, so consumption
    var mul = [];
    for(var i = 0; i < bucket.length; i++) {
      var prod = a[bucket[i]][0].mulr(d).toArray();
      for(var j = 0; j < prod.length; j++) {
        if(prod[j].gtr(0)) pos[j].addInPlace(prod[j]);
        if(prod[j].ltr(0)) neg[j].subInPlace(prod[j]);
      }
    }
    var ok = true;
    for(var j = 0; j < pos.length; j++) {
      var neg2 = neg[j];
      if(!neg2.eqr(0)) neg2 = neg2.mulr(ifactor);
      // there is overcomsumption of some resource in total, need to restrict some of the negative producers
      // NOTE: if factor is 1, then this prevents negative production (using more than 100% of original production). If factor < 1, it prevents production below some percentage of the original production. If factor is 0, this would prevent any and all consumption.
      if(neg2.gt(pos[j])) {
        ok = false;
        break;
      }
    }
    if(!ok) {
      // has some negative result, so reduce production of involved crops
      var prods = [];
      for(var i = 0; i < bucket.length; i++) {
        prods[i] = a[bucket[i]][0].mulr(d).toArray();
      }
      for(var j = 0; j < pos.length; j++) {
        var neg2 = neg[j];
        if(!neg2.eqr(0)) neg2 = neg2.mulr(ifactor);
        // there is negative production of some resource in total, need to restrict some of the negative producers
        if(neg2.gt(pos[j])) {
          ok = false;
          var ratio = pos[j].div(neg2); // always in range [0, 1) since neg2 > pos
          var iratio = Num(1).sub(ratio); // the part that's not produced
          for(var i = 0; i < bucket.length; i++) {
            var prod = prods[i];
            if(prod[j].ltr(0)) { // this crop consumes the involved resource
              for(var k = 0; k < prod.length; k++) {
                if(prod[k].gtr(0)) { // an output resource of this crop, so reduce it
                  // this assumes that k > j (so past already checked neg[j]>pos[j] are not affected), see the assumptions at the function's main comment
                  pos[k].subInPlace(prod[k].mul(iratio)); // subtract what was not produced due to the penalty
                  if(pos[k].ltr(0)) pos[k] = Num(0); // fix potential numerical errors with the subtraction
                }
              }
            }
          }
          neg[j] = pos[j].mulr(factor);
        }
      }
    }

    if(!opt_pos_only) {
      for(var j = 0; j < pos.length; j++) {
        pos[j].subInPlace(neg[j]);
        if(factor >= 1 && pos[j].ltr(0)) pos[j] = Num(0); // fix potential numerical errors with the subtraction
      }
    }
    var gain = Res.fromArray(pos);
    res.addInPlace(gain);
  }

  return res;
}

// This computes the current production/s of all stable incompe sources (crops)
// Does not include income from interaction things like clicking a fern
// This is different than computeIncome: computeProduction gives the prod/s the plants give, while computeIncome computes what gain you get during some time delta
// theoretical: if false, applies the algorithm of computeIncome for negative income, to give the effective income. If true, gives the theoretic income, which may include a negative total for some resources and too high for some income resources since penalty to fix negative not taken into account
// include_growing: also include crops that are still growing, so compute the production once all crops are fullgrown
// pos_only: if true, ignores all negative consumption. The setting theoretical then has no effect
// factor: parameter for computeIncome, only used if theoretical and pos_only both are false. theoretical false actually also has the same effect as having a factor of infinity.
function computeProduction(factor, theoretical, include_growing, pos_only) {
  var pos_only2 = false;
  if(!theoretical && pos_only) {
    pos_only2 = true;
    pos_only = false;
  }
  var result = theoretical ? new Res() : undefined;
  var a = [];

  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(f.index >= CROPINDEX) {
        var c = crops[f.index - CROPINDEX];
        if(f.growth >= 1 || include_growing) {
          var prod = c.getProd(f);
          if(pos_only) prod = prod.getPositive();
          if(theoretical) {
            result.addInPlace(prod);
          } else {
            a.push([prod, 0, 1]);
          }
        }
      }
    }
  }

  if(theoretical) {
    return result;
  } else {
    return computeIncome(factor, a, pos_only2);
  }
}

// include_growing is ignored in this one
function computeProduction2(factor, theoretical, include_growing, pos_only) {
  var pos_only2 = false;
  if(!theoretical && pos_only) {
    pos_only2 = true;
    pos_only = false;
  }
  var result = theoretical ? new Res() : undefined;
  var a = [];

  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      if(f.index >= CROPINDEX) {
        var c = crops2[f.index - CROPINDEX];
        var prod = c.getProd(f);
        if(pos_only) prod = prod.getPositive();
        if(theoretical) {
          result.addInPlace(prod);
        } else {
          a.push([prod, 0, 1]);
        }
      }
    }
  }

  if(theoretical) {
    return result;
  } else {
    return computeIncome(factor, a, pos_only2);
  }
}

// when is the next time that something happens that requires a separate update()
// run. E.g. if the time difference is 1 hour (due to closing the tab for 1 hour),
// and 10 minutes of the fog ability were remaining, then update must be broken
// in 2 parts: the first 10 minutes, and the remaining 50 minutes. This function
// will return that 10. Idem for season changes, ... The function returns the
// first one.
// the returned value is amount of seconds before the first next event
// the value used to determine current time is state.time
function nextEventTime() {
  var times = [];
  times.push(timeTilNextSeason());

  if((state.time - state.fogtime) < getFogDuration()) times.push(getFogDuration() - state.time + state.fogtime);
  if((state.time - state.suntime) < getSunDuration()) times.push(getSunDuration() - state.time + state.suntime);
  if((state.time - state.rainbowtime) < getRainbowDuration()) times.push(getRainbowDuration() - state.time + state.rainbowtime);

  times.sort(function(a, b) {
    return a - b;
  });

  return times[0];
}


var prev_season = -1; // season of previous tick (-1 if uninitialized)

var update = function(opt_fromTick) {
  var undostate = undefined;
  if(actions.length > 0 && (util.getTime() - lastUndoSaveTime > minUndoTime)) {
    undostate = util.clone(state);
  }
  var store_undo = false;

  if(!preupdate(opt_fromTick)) return;

  if(state.prevtime == 0) state.prevtime = util.getTime();

  var oldres = Res(state.red);
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
    var rem = nextEventTime(2) + 1; // for numerical reasons, ensure it's not exactly at the border of the event
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

    //if(numloops > 1 || !done) console.log('d: ' + d + ', rem: ' + rem + ', sun: ' + ((state.time - state.suntime) < getSunDuration()) + ', season: ' + getSeason() + ', done: ' + done);

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
            u.fun();
            num++;
            if(!shift) showMessage('upgraded: ' + u.getName() + ', consumed: ' + cost.toString(), '#ff0', '#000');
            store_undo = true;
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
        if(num) updateUI();
      } else if(type == ACTION_UPGRADE2) {
        var u = upgrades2[action.u];
        var power = gain.sub(state.ethereal_upgrade_spent).mulr(1.001); // allow slight numerical precision error, e.g. say you have 0.4 pericarp/s, it may still fail to let you buy 4 upgrades costing 0.1 pericarp/s each otherwise
        var cost = u.getCost();
        var cost_tweaked = cost.mulr(0.999);
        if(power.lt(cost_tweaked)) {
          showMessage('not enough available power for ethereal upgrade: need ' + cost.toProdString() +
              ', have: ' + Res.getMatchingResourcesOnly(cost, power).toProdString() + '. If you have enough resin, you can plant something on the ethereal field, which will immediately give pericarps/s for these upgrades.', invalidFG, invalidBG);
        } else if(!u.canUpgrade()) {
          showMessage('this ethereal upgrade is not currently available', invalidFG, invalidBG);
        } else  {
          state.ethereal_upgrade_spent.addInPlace(cost);
          u.fun();
          showMessage('Ethereal upgrade applied: ' + u.getName() + ', power used: ' + cost.toString(), '#ffc', '#640');
          store_undo = true;
        }
        updateUI();
      } else if(type == ACTION_PLANT) {
        var f = state.field[action.y][action.x];
        var c = action.crop;
        var cost = c.getCost();
        if(f.index >= CROPINDEX) {
          showMessage('field already has crop', invalidFG, invalidBG);
        } else if(f.index != 0) {
          showMessage('field already has something', invalidFG, invalidBG);
        } else if(!state.crops[c.index].unlocked) {
          if(action.shiftPlanted) {
            lastPlanted = -1;
            showMessage(shiftClickPlantUnset, invalidFG, invalidBG);
          }
        } else if(state.res.lt(cost)) {
          showMessage('not enough resources to plant ' + c.name + ': need ' + cost.toString() +
                      ', have: ' + Res.getMatchingResourcesOnly(cost, state.res).toString(), invalidFG, invalidBG);
        } else {
          showMessage('planted ' + c.name + '. Consumed: ' + cost.toString() + '. Next costs: ' + c.getCost(1));
          state.g_numplanted++;
          state.c_numplanted++;
          state.res.subInPlace(cost);
          f.index = c.index + CROPINDEX;
          f.growth = 0;
          store_undo = true;
        }
      } else if(type == ACTION_PLANT2) {
        var f = state.field2[action.y][action.x];
        var c = action.crop;
        var cost = c.getCost();
        if(f.index >= CROPINDEX) {
          showMessage('field already has crop', invalidFG, invalidBG);
        } else if(f.index != 0) {
          showMessage('field already has something', invalidFG, invalidBG);
        } else if(state.res.lt(cost)) {
          showMessage('not enough resources to plant ' + c.name + ': need ' + cost.toString() +
                      ', have: ' + Res.getMatchingResourcesOnly(cost, state.res).toString(), invalidFG, invalidBG);
        } else {
          state.g_numplanted2++;
          state.c_numplanted2++;
          showMessage('planted ' + c.name + '. Consumed: ' + cost.toString());
          state.res.subInPlace(cost);
          f.index = c.index + CROPINDEX;
          store_undo = true;
        }
      } else if(type == ACTION_DELETE) {
        var f = state.field[action.y][action.x];
        if(f.index >= CROPINDEX) {
          var c = crops[f.index - CROPINDEX];
          var recoup = c.getCost(-1).mulr(cropRecoup);
          if(f.growth < 1) {
            recoup = c.getCost(-1);
            showMessage('plant was still growing, full refund given', '#f8a');
            state.g_numplanted--;
            state.c_numplanted--;
          } else {
            state.g_numunplanted++;
            state.c_numunplanted++;
          }
          f.index = 0;
          f.growth = 0;
          computeDerived(state); // need to recompute this now to get the correct "recoup" cost of a plant which depends on the derived stat
          state.res.addInPlace(recoup); // get a bit of cost back
          showMessage('unplanted ' + c.name + ', got back: ' + recoup.toString());
          store_undo = true;
        }
      } else if(type == ACTION_DELETE2) {
        var f = state.field2[action.y][action.x];
        if(f.index >= CROPINDEX) {
          state.g_numunplanted2++;
          state.c_numunplanted2++;
          var c = crops[f.index - CROPINDEX];
          f.index = 0;
          computeDerived(state); // need to recompute this now to get the correct "recoup" cost of a plant which depends on the derived stat
          var recoup = c.getCost(-1);
          state.res.addInPlace(recoup); // get a bit of cost back
          showMessage('unplanted ' + c.name + ', got back: ' + recoup.toString());
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
        if(a == 0) {
          var fogd = state.time - state.fogtime;
          if(!state.upgrades[upgrade_fogunlock].count) {
            // not possible, ignore
          } else if(fogd > getFogWait()) {
            state.fogtime = state.time;
            showMessage('fog activated, mushrooms produce more spores, consume less seeds, and aren\'t affected by winter');
            store_undo = true;
          } else {
            showMessage(fogd < getFogDuration() ? 'fog is already active' : 'fog is not ready yet', invalidFG, invalidBG);
          }
        } else if(a == 1) {
          var sund = state.time - state.suntime;
          if(!state.upgrades[upgrade_sununlock].count) {
            // not possible, ignore
          } else if(sund > getSunWait()) {
            state.suntime = state.time;
            showMessage('sun activated, berries get a boost and aren\'t affected by winter');
            store_undo = true;
          } else {
            showMessage(sund < getSunDuration() ? 'sun is already active' : 'sun is not ready yet', invalidFG, invalidBG);
          }
        } else if(a == 2) {
          var rainbowd = state.time - state.rainbowtime;
          if(!state.upgrades[upgrade_rainbowunlock].count) {
            // not possible, ignore
          } else if(rainbowd > getRainbowWait()) {
            state.rainbowtime = state.time;
            showMessage('rainbow activated, flowers get a boost and aren\'t affected by winter');
            store_undo = true;
          } else {
            showMessage(rainbowd < getRainbowDuration() ? 'rainbow is already active' : 'rainbow is not ready yet', invalidFG, invalidBG);
          }
        }
      } else if(type == ACTION_TRANCSEND) {
        if(state.treelevel >= min_transcension_level) {
          softReset();
          store_undo = true;
        }
      }
    }
    actions = [];

    if(store_undo && undostate) {
      storeUndo(undostate);
    }

    // for display purposes, but also a few computations here
    gain = computeProduction(state.over, false, false, false).add(computeProduction2(state.over, false, false, false));
    gain_pos = computeProduction(state.over, false, false, true).add(computeProduction2(state.over, false, false, true));
    gain_over = computeProduction(state.over, true, false, false).add(computeProduction2(state.over, true, false, false));
    gain_pos_over = computeProduction(state.over, true, false, true).add(computeProduction2(state.over, true, false, true));

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
      if(state.upgrades[fern_choice0_a].count) mintime += fern_choice0_a_minutes * 60;
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
        var r = fernTimeWorth * (Math.random() + 0.5);
        if(state.upgrades[fern_choice0_b].count) r *= (1 + fern_choice0_b_bonus);
        var g = gain.mulr(r);
        if(g.seeds.ltr(2)) g.seeds = Math.max(g.seeds, Num(Math.random() * 2 + 1));
        var fernres = new Res({seeds:g.seeds, spores:g.spores});
        state.fernres = fernres;
        state.fern = 1;
        state.fernx = s[0];
        state.ferny = s[1];
        if(state.g_numferns == 6 || (state.g_numferns > 10 && Math.random() < 0.1)) state.fern = 2; // lucky fern
      }
    }

    ////////////////////////////////////////////////////////////////////////////

    var producers = [];

    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f = state.field[y][x];
        if(f.index >= CROPINDEX) {
          var c = crops[f.index - CROPINDEX];

          if(f.growth < 1) {
            if(c.planttime == 0) {
              f.growth = 0;
              f.growth = 1;
            } else {
              var g = d / c.planttime;
              var growth0 = f.growth;
              f.growth += g;
              if(f.growth >= 1) {
                // just fullgrown now
                f.growth = 1;
                // subtract how much time left we used for the growing
                var g_needed = 1 - growth0;
                var g_left = g - g_needed;
                var time_left = g_left * c.planttime;
                producers.push([c.getProd(f), d - time_left, 1]);
                state.g_numfullgrown++;
                state.c_numfullgrown++;
                if(state.c_numfullgrown == 1) {
                  showMessage('your first plant has fully grown! Click plants for details and extra actions.', helpFG2, helpBG2);
                }
              }
            }
          } else {
            // fullgrown
            producers.push([c.getProd(f), 0, d]);
          }
        }
        updateFieldCellUI(x, y);
      }
    }

    actualgain.addInPlace(computeIncome(state.over, producers));

    var producers2 = [];

    for(var y = 0; y < state.numh2; y++) {
      for(var x = 0; x < state.numw2; x++) {
        var f = state.field2[y][x];
        if(f.index >= CROPINDEX) {
          var c = crops2[f.index - CROPINDEX];
          producers2.push([c.getProd(f), 0, d]);
        }
        updateField2CellUI(x, y);
      }
    }

    var req = treeLevelReq(state.treelevel + 1);
    if(state.res.ge(req)) {
      state.treelevel++;
      var resin = treeLevelResin(state.treelevel);
      state.resin.addInPlace(resin);
      state.res.subInPlace(req);
      state.g_treelevel = Math.max(state.treelevel, state.g_treelevel);
      if(state.treelevel == 1) {
        showMessage('Thanks to spores, the tree completely rejuvenated and is now a ' + tree_images[treeLevelIndex(state.treelevel)][0] + ', level ' + state.treelevel + '. More spores will level up the tree more. The tree can unlock abilities and more at higher levels. Click the tree for more info.', helpFG, helpBG);
      } else if(state.treelevel == 2) {
        showMessage('Thanks to more spores, the tree is now even stronger! The tree is providing a choice, choose one of the two choices under "upgrades".', helpFG, helpBG);
      } else if(state.treelevel == 3) {
        showMessage('The tree discovered a new ability! Fog is now available under "upgrades"', helpFG, helpBG);
      } else if(state.treelevel == 5) {
        showMessage('The spores are growing the tree very nicely now. The tree is not quite adult yet, but it feels like it\'s at least halfway there!', helpFG, helpBG);
      } else if(state.treelevel == 6) {
        showMessage('The tree discovered a new ability! Sunny is now available under "upgrades"', helpFG, helpBG);
      } else if(state.treelevel == 8) {
        showMessage('The spores grew the tree yet more, it looks so close to adulthood now. What powers does such a tree hold?', helpFG, helpBG);
      } else if(state.treelevel == 9) {
        showMessage('The tree discovered a new ability! Rainbow is now available under "upgrades"', helpFG, helpBG);
      } else if(state.treelevel == 11) {
        showMessage('The tree is providing another choice, check the upgrades', helpFG, helpBG);
      }
      showMessage('Tree leveled up to: ' + tree_images[treeLevelIndex(state.treelevel)][0] + ', level ' + state.treelevel +
          '. Consumed: ' + req.toString() +
          '. Tree boost: ' + Num((state.treelevel * treeboost) * 100).toString(2, Num.N_FULL) + '%' +
          '. Resin added: ' + resin.toString() + '. Total resin ready: ' + state.resin.toString(), '#2f2');
      if(state.treelevel == min_transcension_level) {
        showMessage('The tree reached adulthood, and is now able to transcend! Click the tree to view the transcension dialog.', helpFG, helpBG);
      }
    }


    actualgain.addInPlace(computeIncome(state.over, producers2));

    state.res.addInPlace(actualgain);

    // check unlocked upgrades
    for(var i = 0; i < registered_upgrades.length; i++) {
      var j = registered_upgrades[i];
      if(state.upgrades[j].unlocked) continue;
      if(upgrades[j].pre()) {
        state.upgrades[j].unlocked = true;
        state.c_numupgrades_unlocked++;
        state.g_numupgrades_unlocked++;
        if(state.c_numupgrades_unlocked == 1) {
          showMessage('You unlocked your first upgrade! Check the "upgrades" tab to view it.', helpFG, helpBG);
        }
        showMessage('Upgrade available: "' + upgrades[j].getName() + '"', '#ffc', '#008');
      }
    }
    if(state.g_numresets > 0) {
      for(var i = 0; i < registered_upgrades2.length; i++) {
        var j = registered_upgrades2[i];
        if(state.upgrades2[j].unlocked) continue;
        if(upgrades2[j].pre()) {
          state.upgrades2[j].unlocked = true;
          state.g_numupgrades2_unlocked++;
          if(state.g_numupgrades2_unlocked == 1) {
            showMessage('You unlocked your first ethereal upgrade! Check the "ethereal upgrades" tab to view it.', helpFG, helpBG);
          }
          showMessage('Ethereal upgrade available: "' + upgrades2[j].getName() + '"', '#44f', '#ff8');
        }
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
        showMessage('Achievement unlocked: ' + medals[j].name, '#fe0', '#430');
        updateMedalUI();

        if(j == medal_crowded_id) {
          showMessage('The field is full. If more room is needed, old crops can be deleted, click a crop to see its delete button. Ferns will still appear safely on top of crops, no need to make room for them.', helpFG, helpBG);
        }
        if(state.g_nummedals == 1) {
          showMessage('You got your first achievement! Achievements give a slight production boost.', helpFG, helpBG);
        }
      }
    }


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

    if(prev_season != -1 && prev_season != getSeason()) {
      showMessage('The season changed, it is now ' + seasonNames[getSeason()], '#fff', '#260');
    }
    prev_season = getSeason();

    state.g_res.addInPlace(actualgain);
    state.c_res.addInPlace(actualgain);
    state.g_max_res = Res.max(state.g_max_res, state.res);
    state.c_max_res = Res.max(state.c_max_res, state.res);
    state.g_max_prod = Res.max(state.g_max_prod, gain);
    state.c_max_prod = Res.max(state.c_max_prod, gain);
    state.g_numticks++;
    state.c_numticks++;
  }

  var d_total = state.prevtime - oldtime;
  if(d_total > 300) {
    var totalgain = state.res.sub(oldres);
    showMessage('Large time delta: ' + util.formatDuration(d_total, true, 4, true) + ', gained at once: ' + totalgain.toString(), '#999');
  }

  updateResourceUI();
  updateUpgradeUIIfNeeded();
  updateUpgrade2UIIfNeeded();
  updateTabButtons();
  updateAbilitiesUI();
  if(updatetooltipfun) updatetooltipfun();
  if(updatedialogfun) updatedialogfun();

  postupdate();
}


