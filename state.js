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

function Crop2State() {
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

  // current time, this is usually the same as util.getTime(), but if an update() is broken into multiple pieces, then it is
  // the end of the current piece.
  // not saved. set by update(). recommended to use instead of util.getTime() for game time duration related computations such as special abilities
  this.time = 0;

  this.currentTab = 0; // currently selected tab
  this.lastPlanted = 0; // for shift+plant
  this.lastPlanted2 = 0; // for shift+plant on field2

  // resources
  this.res = undefined;
  // resin that will be gained at the next soft reset, not added to res until the soft reset
  this.resin = Num(0);

  this.treelevel = 0;

  this.fern = 0; // 0 = no fern, 1 = standard fern, 2 = lucky fern
  this.fernx = 0;
  this.ferny = 0;
  this.fernres = Res(0);

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
  for(var i = 0; i < registered_crops2.length; i++) {
    this.crops2[registered_crops2[i]] = new Crop2State();
  }
  this.treelevel2 = 0;

  this.upgrades2 = [];
  for(var i = 0; i < registered_upgrades2.length; i++) {
    this.upgrades2[registered_upgrades2[i]] = new Upgrade2State();
  }


  this.fogtime = 0; // fog is unlocked if state.upgrades[upgrade_fogunlock].count
  this.suntime = 0; // similar
  this.rainbowtime = 0;

  this.lastFernTime = 0;
  this.lastBackupWarningTime = 0;


  // how much the price of basic crop multiplier upgrades increases with each level
  this.upgrade_cost_increase = Num(2.5);

  // settings
  this.notation = Num.N_LATIN; // number notation
  this.precision = 3; // precision of the numeric notation
  this.mobilemode = false;
  this.saveonexit = true; // save with the window unload event (this is different than the interval based autosave)
  this.allowshiftdelete = false; // allow deleting a crop without dialog or confirmation by shift+clicking it
  this.tooltipstyle = 1;

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
  this.g_numfullgrown2 = 0;
  this.g_seasons = 0; // season changes actually seen
  this.g_resin_from_transcends = Num(0); // this is likely the same value as g_res.resin, but is a separate counter for amount of resin ever earned from transcends in case it's needed for recovery in transcension-changing game updates

  this.g_starttime = 0; // starttime of the game (when first run started)
  this.g_runtime = 0; // this would be equal to getTime() - g_starttime if game-time always ran at 1x (it does, except if pause or boosts would exist)
  this.g_numticks = 0;
  this.g_res = Res(); // total resources gained, all income ever without subtracting costs, including both production and one-time income
  this.g_max_res = Res(); // max resources ever had
  this.g_max_prod = Res(); // max displayed resource/second gain ever had (production, this excludes immediate resources such as from ferns)
  this.g_numferns = 0;
  this.g_numplantedshort = 0; // amount of short-lived plants planted
  this.g_numplanted = 0; // amount of plants planted on a field
  this.g_numfullgrown = 0; // very similar to numplanted, but for full grown plants
  this.g_numunplanted = 0; // amount of plants deleted from a field
  this.g_numupgrades = 0; // upgrades performed
  this.g_numupgrades_unlocked = 0; // upgrades unlocked but not yet necessarily performed
  this.g_numabilities = 0; // weather abilities ran
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
  this.p_numplantedshort = 0;
  this.p_numplanted = 0;
  this.p_numfullgrown = 0;
  this.p_numunplanted = 0;
  this.p_numupgrades = 0;
  this.p_numupgrades_unlocked = 0;
  this.p_numabilities = 0;
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  // saved stats, for current reset only
  this.c_starttime = 0; // starttime of current run
  this.c_runtime = 0;
  this.c_numticks = 0;
  this.c_res = Res();
  this.c_max_res = Res();
  this.c_max_prod = Res();
  this.c_numferns = 0;
  this.c_numplantedshort = 0;
  this.c_numplanted = 0;
  this.c_numfullgrown = 0;
  this.c_numunplanted = 0;
  this.c_numupgrades = 0;
  this.c_numupgrades_unlocked = 0;
  this.c_numabilities = 0;
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  this.reset_stats = []; // reset at what tree level for each reset


  // amount of fields with nothing on them (index 0)
  // derived stat, not to be saved
  this.numemptyfields = 0;
  this.numemptyfields2 = 0;

  // amount of fields with a crop on them (index >= CROPINDEX, special types 1<=index<CROPINDEX are not counted)
  // includes growing ones
  // derived stat, not to be saved
  this.numcropfields = 0;
  this.numcropfields2 = 0;

  // fullgrown only, not growing, any type >= CROPINDEX. Includes shoft-lived plants.
  // derived stat, not to be saved
  this.numfullgrowncropfields = 0;
  this.numfullgrowncropfields2 = 0;

  // like numfullgrowncropfields but excluding short lived crops
  // derived stat, not to be saved
  this.numfullpermanentcropfields = 0;

  // amount of plants of this type planted in fields, including newly still growing ones
  // derived stat, not to be saved
  this.cropcount = [];
  this.crop2count = [];

  // amount of fully grown plants of this type planted in fields
  // does not include partially growing ones
  // derived stat, not to be saved
  this.fullgrowncropcount = [];
  this.fullgrowncrop2count = [];

  // count of non-crop fields, such as fern
  this.specialfieldcount = [];
  this.specialfield2count = [];

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

  // bonuses from ethereal crops
  // derived stat, not to be saved.
  this.ethereal_berry_bonus = Num(0);
  this.ethereal_mush_bonus = Num(0);
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
  // this shift is designed such that the center tile of the old field will stay in the center, and in case of
  // even sizes will be at the floor(dimension / 2). w and h should be larger than state.numw and state.numh respectively
  var xs = (((state.numw + 1) >> 1) - ((w + 1) >> 1));
  var ys = (((state.numh + 1) >> 1) - ((h + 1) >> 1));
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

  state.fernx -= xs;
  state.ferny -= ys;
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


  state.crops[short_0].unlocked = true;


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

  // field
  state.numemptyfields = 0;
  state.numcropfields = 0;
  state.numfullgrowncropfields = 0;
  state.numfullpermanentcropfields = 0;
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
        var c = crops[f.index - CROPINDEX];
        state.cropcount[f.index - CROPINDEX]++;
        state.numcropfields++;
        if(f.growth >= 1 || c.type == CROPTYPE_SHORT) {
          state.fullgrowncropcount[f.index - CROPINDEX]++;
          state.numfullgrowncropfields++;
          if(c.type != CROPTYPE_SHORT) state.numfullpermanentcropfields++
        }
      } else if(f.index == 0) {
        state.numemptyfields++;
      } else {
        state.specialfieldcount[f.index]++;
      }
    }
  }

  // field2
  state.numemptyfields2 = 0;
  state.numcropfields2 = 0;
  state.numfullgrowncropfields2 = 0;
  state.fullgrowncrop2count = [];
  state.crop2count = [];
  for(var i = 0; i < registered_crops2.length; i++) {
    state.crop2count[registered_crops2[i]] = 0;
    state.fullgrowncrop2count[registered_crops2[i]] = 0;
  }
  for(var i = 1; i < CROPINDEX; i++) {
    state.specialfield2count[i] = 0;
  }
  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      if(f.index >= CROPINDEX) {
        var c = crops2[f.index - CROPINDEX];
        state.crop2count[f.index - CROPINDEX]++;
        state.numcropfields2++;
        if(f.growth >= 1) {
          state.fullgrowncrop2count[f.index - CROPINDEX]++;
          state.numfullgrowncropfields2++;
        }
      } else if(f.index == 0) {
        state.numemptyfields2++;
      } else {
        state.specialfield2count[f.index]++;
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

  for(var i = 0; i < registered_upgrades2.length; i++) {
    var u = state.upgrades2[registered_upgrades2[i]];
    var u2 = upgrades2[registered_upgrades2[i]];
    if(u.unlocked) {
      state.upgrades2_unlocked++;
      if(!u.seen) state.upgrades2_new++;
      if(!u2.isExhausted()) {
        state.upgrades2_upgradable++; // same as u2.canUpgrade()
        if(u2.getCost().le(state.res)) state.upgrades2_affordable++;
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

  //////////////////////////////////////////////////////////////////////////////

  state.ethereal_berry_bonus = Num(0);
  state.ethereal_mush_bonus = Num(0);

  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      if(f.index >= CROPINDEX && f.growth >= 1) {
        var index = f.index - CROPINDEX;
        if(index == berry2_0) {
          var boost = Crop2.getNeighborBoost(f);
          state.ethereal_berry_bonus.addInPlace(boost.addr(1).mulr(0.2));
        }
        if(index == mush2_0) {
          var boost = Crop2.getNeighborBoost(f);
          state.ethereal_mush_bonus.addInPlace(boost.addr(1).mulr(0.2));
        }
      }
    }
  }
}




