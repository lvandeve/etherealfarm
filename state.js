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

var CROPINDEX = 16;
var FIELD_TREE_TOP = 1;
var FIELD_TREE_BOTTOM = 2;

// field cell
function Cell(x, y) {
  // index of crop, but with different numerical values:
  // 0 = empty
  // 1-(CROPINDEX-1): special: 1=tree, 2=fern, ...
  // >= CROPINDEX: crop with crop index = this.index - CROPINDEX.
  this.index = 0;
  this.growth = 0; // 0.0-1.0: percentage completed, or 1 if fullgrown
  this.res = null; // this is used by fern to remember what random resources this one got
  this.x = x;
  this.y = y;
}

function CropState() {
  this.unlocked = false;
}

function UpgradeState() {
  this.seen = false; // seen the upgrade in the upgrades tab
  this.unlocked = false;
  // how many times this upgrade was done
  this.count = 0;
}

function Upgrade2State() {
  this.unlocked = false;
  // how many times this upgrade was done
  this.count = 0;
}

function MedalState() {
  this.seen = false; // seen the achievement in the achievements tab
  this.earned = false;
}

// all the state that should be able to get saved
function State() {
  this.savegame_recovery_situation = false; // if true, makes it less likely to autosave, to ensure local storage preserves a valid older save

  this.timemul = 1; // global total time speed multiplier. TODO: this should NOT be in the state, probably. Try to get this to exist in the debug interface only.

  // prevtime is used to know how much time elapsed at next tick, including after loading a savegame
  // everything in the game such work such that no matter if there was 1 tick of 100 seconds, or 100 ticks of 1 second, the result is the same (other than numerical precision possibly), and this too even if many days of duration in between
  // so that saving, and browsers pausing tabs, both have no effect on game
  this.prevtime = 0; // time of previous update frame, in fractional seconds since unix epoch

  // resources
  this.res = undefined;
  // resin that will be gained at the next soft reset, not added to res until the soft reset
  this.resin = Num(0);

  this.treelevel = 0;

  this.fern = 0; // 0 = no fern, 1 = standard fern, 2 = lucky fern
  this.fernx = 0;
  this.ferny = 0;
  this.fernres = Res(0);

  this.refundx = 0;
  this.refundy = 0;
  this.refundtype = 0;
  this.refundrecoup = 0;

  /*
  factor for overconsumption:
  say there is a berry producing seeds, and a mushroom consuming seeds but producing spores:
  then if there is not enough production from the berry, the mushroom will produce less spores.
  the "over" value defines how much of the production of the berry, the mushroom is allowed to use.
  If this value is 1, then the mushroom can consume max 100% of the seeds production, but not more (no negative total seeds production)
  If this value is infinity, then the mushroom always consumes any amount of seeds and has 100% of its spores production, but there can be a total negative seeds produciton then. This game does not allow this.
  If this value is 0.5, then the mushroom can consume max 50% of the seeds production. The remaining seeds production always goes to the player's resources.
  If this value would be 0, no consumption at all is allowed and the mushroom can never produce spores.
  Good values are:
  *) 0.5 for a safe early game experience (where you can't get blocked by no seeds production due to expensive mushrooms you'd find too painful to delete)
  *) 0.6, 0.65, 0.7, 0.75, 0.8, ... as options that can unlock later in the game for the more experienced player, and the player can then choose between e.g. with a slider
  *) 1 as a possible more dangerous lategame option
  */
  this.over = 0.5;

  // field size in amount of cells
  this.numw = 5;
  this.numh = 5;
  //what's planted and their state of the main field
  this.field = [];

  this.crops = [];
  for(var i = 0; i < registered_crops.length; i++) {
    this.crops[registered_crops[i]] = new CropState();
  }

  this.upgrades = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    this.upgrades[registered_upgrades[i]] = new UpgradeState();
  }

  this.medals = [];
  for(var i = 0; i < registered_medals.length; i++) {
    this.medals[registered_medals[i]] = new MedalState();
  }

  // ethereal field and crops
  this.numw2 = 5;
  this.numh2 = 5;
  this.field2 = [];
  this.crops2 = [];
  for(var i = 0; i < registered_crops.length; i++) {
    this.crops2[registered_crops[i]] = new CropState();
  }
  this.treelevel2 = 0;

  this.upgrades2 = [];
  for(var i = 0; i < registered_upgrades2.length; i++) {
    this.upgrades2[registered_upgrades2[i]] = new Upgrade2State();
  }

  // ethereal upgrade effects
  // TODO: this should not be saved like this in the savegame, instead the upgrade level must be saved and these values derived from it, otherwise tuning them is impossible
  this.ethereal_upgrade_spent = Res(); // how much spent on ethereal upgrades. This is in res/s, since ethereal upgrades cost res/s, not res.
  this.ethereal_prodmul = Res(); // production multiplier from ethereal, per resource (additive, as in, this is a multiplier, but the ethereal upgrade adds to this multiplier, not multiplies it)
  this.ethereal_prodmul.addrInPlace(1);
  this.ethereal_season_bonus = [Num(1), Num(1), Num(1), Num(1)];
  this.ethereal_starting_resources = Res(); // basic starting resources after a soft reset, given by ethereal upgrade

  this.fogtime = 0; // fog is unlocked if state.upgrades[upgrade_fogunlock].count
  this.suntime = 0; // similar
  this.raintime = 0;
  this.rainbowtime = 0;
  this.hailtime = 0;
  this.snowtime = 0;
  this.windtime = 0;


  // how much the price of basic crop multiplier upgrades increases with each level
  this.upgrade_cost_increase = Num(2.5);

  // settings
  this.notation = Num.N_LATIN; // number notation
  this.precision = 3; // precision of the numeric notation
  this.mobilemode = false;
  this.saveonexit = true; // save with the window unload event (this is different than the interval based autosave)
  this.allowshiftdelete = false; // allow deleting a crop without dialog or confirmation by shift+clicking it

  // saved stats, global across all runs
  this.g_numresets = 0; // amount of soft resets done
  this.g_numsaves = 0;
  this.g_numautosaves = 0;
  this.g_numloads = 0;
  this.g_numimports = 0;
  this.g_numexports = 0;
  this.g_lastexporttime = 0; // last save export time, to give warnings
  this.g_lastimporttime = 0; // last save import time, for those same warnings
  this.g_nummedals = 0; // TODO: nothing actually increments this yet! increment whenever new medal achieved.
  this.g_treelevel = 0; // max tree level of any run
  this.g_numplanted2 = 0;
  this.g_numunplanted2 = 0;
  this.g_numupgrades2 = 0;
  this.g_numupgrades2_unlocked = 0;

  this.g_starttime = 0; // starttime of the game (when first run started)
  this.g_runtime = 0; // this would be equal to getTime() - g_starttime if game-time always ran at 1x (it does, except if pause or boosts would exist)
  this.g_numticks = 0;
  this.g_res = Res(); // total resources gained, all income ever without subtracting costs, including both production and one-time income
  this.g_max_res = Res(); // max resources ever had
  this.g_max_prod = Res(); // max displayed resource/second gain ever had (production, this excludes immediate resources such as from ferns)
  this.g_numferns = 0;
  this.g_numplanted = 0; // amount of plants planted on a field
  this.g_numfullgrown = 0; // very similar to numplanted, but for full grown plants
  this.g_numunplanted = 0; // amount of plants deleted from a field
  this.g_numupgrades = 0; // upgrades performed
  this.g_numupgrades_unlocked = 0; // upgrades unlocked but not yet necessarily performed
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  // saved stats, for previous reset (to compare with current one)
  this.p_treelevel = 0;

  this.p_starttime = 0; // starttime of previous run
  this.p_runtime = 0;
  this.p_numticks = 0;
  this.p_res = Res();
  this.p_max_res = Res();
  this.p_max_prod = Res();
  this.p_numferns = 0;
  this.p_numplanted = 0;
  this.p_numfullgrown = 0;
  this.p_numunplanted = 0;
  this.p_numupgrades = 0;
  this.p_numupgrades_unlocked = 0;
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  // saved stats, for current reset only
  this.c_starttime = 0; // starttime of current run
  this.c_runtime = 0;
  this.c_numticks = 0;
  this.c_res = Res();
  this.c_max_res = Res();
  this.c_max_prod = Res();
  this.c_numferns = 0;
  this.c_numplanted = 0;
  this.c_numfullgrown = 0;
  this.c_numunplanted = 0;
  this.c_numupgrades = 0;
  this.c_numupgrades_unlocked = 0;
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  this.reset_stats = []; // reset at what tree level for each reset


  // amount of fields with nothing on them (index 0)
  // derived stat, not to be saved
  this.numemptyfields = 0;

  // amount of fields with a crop on them (index >= CROPINDEX, special types 1<=index<CROPINDEX are not counted)
  // includes growing ones
  // derived stat, not to be saved
  this.numcropfields = 0;

  // fullgrown only, not growing, any type >= CROPINDEX
  // derived stat, not to be saved
  this.numfullgrowncropfields = 0;

  // amount of plants of this type planted in fields, including newly still growing ones
  // derived stat, not to be saved
  this.cropcount = [];

  // amount of fully grown plants of this type planted in fields
  // does not include partially growing ones
  // derived stat, not to be saved
  this.fullgrowncropcount = [];

  // count of non-crop fields, such as fern
  this.specialfieldcount = [];

  // amount of upgrades ever had available (whether upgraded/exhausted or not doesn't matter, it's about being visible, available for research, at all)
  // derived stat, not to be saved
  this.upgrades_unlocked = 0;
  this.upgrades2_unlocked = 0;

  // amount of upgrades available now, for upgrade, so unlocked, but not yet already upgraded or exhausted (but doesn't matter whether can afford)
  this.upgrades_upgradable = 0;
  this.upgrades2_upgradable = 0;

  // like upgrades_upgradable, but only those you can afford
  this.upgrades_affordable = 0;
  this.upgrades2_affordable = 0;

  // amount of new upgrades of which you haven't yet seen the name in the upgrades tab
  // derived stat, not to be saved
  this.upgrades_new = 0;
  this.upgrades2_new = 0;

  // derived stat, not to be saved
  this.medals_earned = 0;

  // amount of achievements earned but not yet seen in the achievements tab
  // derived stat, not to be saved
  this.medals_new = 0;

  // Global production multiplier from all metals
  // derived stat, not to be saved.
  this.medal_prodmul = Num(1);
}

function clearField(state) {
  state.field = [];
  for(var y = 0; y < state.numh; y++) {
    state.field[y] = [];
    for(var x = 0; x < state.numw; x++) {
      state.field[y][x] = new Cell(x, y);
    }
  }
  var treex = Math.floor(state.numw / 2);
  var treey = Math.floor(state.numh / 2);
  state.field[treey][treex].index = FIELD_TREE_BOTTOM;
  state.field[treey - 1][treex].index = FIELD_TREE_TOP;
}

function clearField2(state) {
  state.field2 = [];
  for(var y = 0; y < state.numh2; y++) {
    state.field2[y] = [];
    for(var x = 0; x < state.numw2; x++) {
      state.field2[y][x] = new Cell(x, y);
    }
  }
  var treex2 = Math.floor(state.numw2 / 2);
  var treey2 = Math.floor(state.numh2 / 2);
  state.field2[treey2][treex2].index = FIELD_TREE_BOTTOM;
  state.field2[treey2 - 1][treex2].index = FIELD_TREE_TOP;
}

function changeFieldSize(state, w, h) {
  // this shift is designed such that the tree in the center of the field will stay in the center, by alternating between adding new cells on the left or right side
  // this only works if w and h only increase size by 1, but that's how the upgrades work anyway
  var xs = 0;
  if((state.numw & 1) == 1) xs = -1;
  var ys = 0;
  if((state.numh & 1) == 1) ys = -1;
  var field = [];
  for(var y = 0; y < h; y++) {
    field[y] = [];
    for(var x = 0; x < w; x++) {
      var x2 = x + xs;
      var y2 = y + ys;
      field[y][x] = (x2 >= 0 && x2 < state.numw && y2 >= 0 && y2 < state.numh) ? state.field[y2][x2] : new Cell(x, y);
      field[y][x].x = x;
      field[y][x].y = y;
    }
  }
  state.field = field;
  state.numw = w;
  state.numh = h;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function createInitialState() {
  var state = new State();

  //state.res = Res({seeds:15}); // NOTE: ensure to start with a bit more than needed for first plant, numerical precision in plant cost computation could make it cost 10.000001 instead of 10
  state.res = Res({});

  clearField(state);
  clearField2(state);


  state.crops[berry_0].unlocked = true;
  //state.upgrades[berrymul_0].unlocked = true;
  //state.upgrades[berryunlock_1].unlocked = true;
  state.crops2[berry_0].unlocked = true;

  state.g_starttime = util.getTime();
  state.c_starttime = state.g_starttime;
  state.g_lastexporttime = state.g_starttime;
  state.g_lastimporttime = state.g_starttime;

  computeDerived(state);

  return state;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// stats derived from the state. These should not be saved in a savegame. They can be recomputed from the
// state every now and then (e.g. every upgrade)
// this allows getting some stats, such as unlock conditions for upgrades, in a slightly cheaper way than computing it on the fly for every upgrade check
function computeDerived(state) {
  state.numemptyfields = 0;
  state.numcropfields = 0;
  state.numfullgrowncropfields = 0;

  state.fullgrowncropcount = [];
  state.cropcount = [];
  for(var i = 0; i < registered_crops.length; i++) {
    state.cropcount[registered_crops[i]] = 0;
    state.fullgrowncropcount[registered_crops[i]] = 0;
  }
  for(var i = 1; i < CROPINDEX; i++) {
    state.specialfieldcount[i] = 0;
  }
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(f.index >= CROPINDEX) {
        state.cropcount[f.index - CROPINDEX]++;
        state.numcropfields++;
        if(f.growth >= 1) {
          state.fullgrowncropcount[f.index - CROPINDEX]++;
          state.numfullgrowncropfields++;
        }
      } else if(f.index == 0) {
        state.numemptyfields++;
      } else {
        state.specialfieldcount[f.index]++;
      }
    }
  }

  state.upgrades_unlocked = 0;
  state.upgrades_new = 0;
  state.upgrades_upgradable = 0;
  state.upgrades_affordable = 0;
  state.upgrades2_unlocked = 0;
  state.upgrades2_new = 0;
  state.upgrades2_upgradable = 0;
  state.upgrades2_affordable = 0;

  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = state.upgrades[registered_upgrades[i]];
    var u2 = upgrades[registered_upgrades[i]];
    if(u.unlocked) {
      state.upgrades_unlocked++;
      if(!u.seen) state.upgrades_new++;
      if(!u2.isExhausted()) {
        state.upgrades_upgradable++; // same as u2.canUpgrade()
        if(u2.getCost().le(state.res)) state.upgrades_affordable++;
      }
    }
  }

  var power = gain.sub(state.ethereal_upgrade_spent);
  for(var i = 0; i < registered_upgrades2.length; i++) {
    var u = state.upgrades2[registered_upgrades2[i]];
    var u2 = upgrades2[registered_upgrades2[i]];
    if(u.unlocked) {
      state.upgrades2_unlocked++;
      if(!u.seen) state.upgrades2_new++;
      if(!u2.isExhausted()) {
        state.upgrades2_upgradable++; // same as u2.canUpgrade()
        if(u2.getCost().le(power)) state.upgrades2_affordable++;
      }
    }
  }

  state.medals_earned = 0;
  state.medals_new = 0;

  state.medal_prodmul = Num(1); // global medal production multiplier

  for(var i = 0; i < registered_medals.length; i++) {
    var m = medals[registered_medals[i]];
    var m2 = state.medals[registered_medals[i]];
    if(m2.earned) {
      state.medals_earned++;
      if(!m2.seen) state.medals_new++;
      state.medal_prodmul.addInPlace(m.prodmul);
    }
  }
}




