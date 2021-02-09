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
var FIELD_REMAINDER = 3; // remainder debris of temporary plant. Counts as empty field (same as index == 0) for all purposes. Purely a visual effect, to remember that this is the spot you're using for watercress (and not accidently put a flower there or so)
var FIELD_ROCK = 4; // for challenges with rocks

// field cell
function Cell(x, y) {
  // index of crop, but with different numerical values:
  // 0 = empty
  // 1..(CROPINDEX-1): special: 1=tree top, 2=tree bottom, ...
  // >= CROPINDEX: crop with crop index = this.index - CROPINDEX.
  this.index = 0;
  this.growth = 0; // 0.0-1.0: percentage completed, or 1 if fullgrown

  this.x = x;
  this.y = y;

  // only used for ethereal field. TODO: make a Cell2 class for ethereal field instead
  this.justplanted = false; // planted during this run (this transcension), so can't be deleted until next one.
}

Cell.prototype.isFullGrown = function() {
  if(this.index < CROPINDEX) return false; // not relevant for non-crops
  var c = this.getCrop();
  if(c.type == CROPTYPE_SHORT) return this.growth > 0;
  return this.growth >= 1;
};

Cell.prototype.hasCrop = function() {
  return this.index >= CROPINDEX;
};

// only valid if hasCrop()
Cell.prototype.cropIndex = function() {
  return this.index - CROPINDEX;
};

// Only valid for the basic field, not for the ethereal field.
// returns crops object if the field has a crop, undefined otherwise
// TODO: make a class Cell2 for ethereal field instead
Cell.prototype.getCrop = function() {
  if(this.index < CROPINDEX) return undefined;
  return crops[this.index - CROPINDEX];
};



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
  // if is_choice, then this is the choice instead of a count. 0 means no choice made yet, 1 means first choice, 2 means second choice.
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

function ChallengeState() {
  this.unlocked = false;
  this.completed = 0; // whether, and how often, the challenge was successfully completed (excluding currently ongoing challenge, if any)
  this.num = 0; // amount of times started, whether successful or not, including the current one
  this.maxlevel = 0; // max level reached with this challenge (excluding the current ongoing challenge if any)
  this.besttime = 0; // best time for reaching targetlevel, even when not resetting. If continuing the challenge for higher maxlevel, still only the time to reach targetlevel is counted, so it's the best time for completing the main reward part of the challenge.
}



// all the state that should be able to get saved
function State() {
  this.timemul = 1; // global total time speed multiplier. TODO: this should NOT be in the state, probably. Try to get this to exist in the debug interface only.

  // prevtime is used to know how much time elapsed at next tick, including after loading a savegame
  // everything in the game such work such that no matter if there was 1 tick of 100 seconds, or 100 ticks of 1 second, the result is the same (other than numerical precision possibly), and this too even if many days of duration in between
  // so that saving, and browsers pausing tabs, both have no effect on game
  this.prevtime = 0; // time of previous update frame, in fractional seconds since unix epoch

  /*
  Compensate for switching between different computers with different clocks: This handles the following scenario:
  Sombody plays the game in two locations with different computer clock or timezone: this is common (e.g. home and non-home computer): even though javascript returns UTC time so timezones shouldn't matter, it can happen that computers display the correct local time but have the wrong UTC time.
  This mechanism is not there to prevent computer clock related cheating: that is impossible to prevent in a single player game. But the 2-different-computer-clock situation is legitimate and shouldn't affect the gameplay in a bad (like ferns not spawning for hours) nor in a too good (like big production time delta) way.

  Say location B is 2 hours farther in the future than location A.
  when moving from A to B, this gives 2 hours of not-actually-deserved production bonus.
  when moving from B to A, this should in theory punish by taking away 2 hours of production bonus. However, this should not be punished: there are legit situations where this can occur.
  So the mechanism will work as follows:
  when moving from B to A, then when loading savegame you see a savegame time in the future. This time difference is added to negative_time.
  when moving from A to B, then when loading savegame, you see that more than 2 hours have passed. But, before applying the 2 hour produciton bonus, first any negative_time is subtracted from that (only partially if negative_time is even greater than this 2h)

  Side note: other things that must be done when going from B to A (going to the past, negative time delta):
  -adjust last fern time, such that it won't take hours before a fern appears
  -similar adjustments for last ability time, etc...
  */
  this.negative_time = 0;
  // total and max negative time ever seen, for debugging in case something goes wrong with this
  this.total_negative_time = 0;
  this.max_negative_time = 0;
  this.last_negative_time = 0;

  // current time, this is usually the same as util.getTime(), but if an update() is broken into multiple pieces, then it is
  // the end of the current piece.
  // not saved. set by update(). recommended to use instead of util.getTime() for game time duration related computations such as special abilities
  this.time = 0;

  this.seed0 = -1; // if there's ever a new feature added to the game requiring a new random seed, this can be used to initialize that new seed to ensure the new seed can't be cheesed by refreshing with a savegame that didn't have the new seed yet

  this.currentTab = 0; // currently selected tab
  this.lastPlanted = -1; // for shift+plant
  this.lastPlanted2 = -1; // for shift+plant on field2

  // resources
  this.res = undefined;
  // resin that will be gained at the next soft reset, not added to res until the soft reset
  this.resin = Num(0);

  this.treelevel = 0;
  this.lasttreeleveluptime = 0;

  this.fern = 0; // 0 = no fern, 1 = standard fern, 2 = lucky fern
  this.fernx = 0;
  this.ferny = 0;
  this.fernres = Res(0);
  this.fern_seed = -1; // random seed for the fern drops

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

  this.challenges = [];
  for(var i = 0; i < registered_challenges.length; i++) {
    this.challenges[registered_challenges[i]] = new ChallengeState();
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


  this.misttime = 0; // mist is unlocked if state.upgrades[upgrade_mistunlock].count
  this.suntime = 0; // similar
  this.rainbowtime = 0;

  this.lastFernTime = 0;
  this.lastBackupWarningTime = 0;

  // misc
  this.delete2tokens = delete2initial; // a resource, though not part of the Res() resources object since it's more its own special purpose thing

  // fruit
  this.fruit_seed = -1; // random seed for creating random fruits
  this.fruit_seen = false; // whether seen latest fruit drop (for red color)
  this.fruit_active = []; // current active fruit (array length is 0 or 1 only)
  this.fruit_stored = []; // fruits in storage that stay after transcension
  this.fruit_slots = 2; // amount of slots for fruit_stored
  this.fruit_sacr = []; // fruits outside of storage that will be sacrificed on transcension

  // settings
  this.notation = Num.N_LATIN; // number notation
  this.precision = 3; // precision of the numeric notation
  this.mobilemode = false;
  this.saveonexit = true; // save with the window unload event (this is different than the interval based autosave)
  this.allowshiftdelete = false; // allow deleting a crop without dialog or confirmation by shift+clicking it
  this.tooltipstyle = 1;
  this.disableHelp = false; // disable all popup help dialogs
  this.uistyle = 1; // 0=default (1), 1=light, 2=dark
  this.sidepanel = 1; // 0=disabled, 1=automatic

  // help dialog related
  this.help_seen = {}; // ever seen this help message at all as dialog
  this.help_seen_text = {}; // ever seen this help message at all as text
  this.help_disable = {}; // disabled this help message (available once seeing it the second time)

  // challenges
  this.challenge = 0;

  // saved stats, global across all runs
  this.g_numresets = 0; // amount of soft resets done, non-challenge
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
  this.g_seasons = 0; // season changes actually seen (a savegame from multiple days ago counts as only 1)
  this.g_resin_from_transcends = Num(0); // this is likely the same value as g_res.resin, but is a separate counter for amount of resin ever earned from transcends in case it's needed for recovery in transcension-changing game updates
  this.g_delete2tokens = 0; // global count of ethereal deletion tokens received, this is not the actual recource but a stat
  this.g_fastestrun = 0; // runtime of fastest transcension
  this.g_slowestrun = 0; // runtime of slowest transcension
  this.g_fastestrun2 = 0; // as measured on wall clock instead of the runtime that gets deltas added each time
  this.g_slowestrun2 = 0;
  this.g_numresets_challenge = 0; // amount of soft resets done to start a challenge

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
  this.g_numfruits = 0; // fruits received
  this.g_numfruitupgrades = 0;
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
  this.p_numfruits = 0;
  this.p_numfruitupgrades = 0;
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
  this.c_numfruits = 0;
  this.c_numfruitupgrades = 0;
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  // progress stats, most recent stat at the end
  this.reset_stats_level = []; // reset at what tree level for each reset
  this.reset_stats_level2 = []; // tree level 2 at end of this run
  this.reset_stats_time = []; // time of this run, as integer of 15-minute intervals to keep the stat compact
  this.reset_stats_resin = []; // log2 of 1 + total resin earned in total at start of this run, as integer
  this.reset_stats_challenge = []; // what type of challenge, if any, for this run

  // amount of fields with nothing on them (index 0)
  // derived stat, not to be saved
  this.numemptyfields = 0;
  this.numemptyfields2 = 0;

  // amount of fields with a crop on them (hasCrop(), special types 1<=index<CROPINDEX are not counted)
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
  this.croptypecount = [];

  // amount of fully grown plants of this type planted in fields
  // does not include partially growing ones
  // derived stat, not to be saved
  this.fullgrowncropcount = [];
  this.fullgrowncrop2count = [];
  this.fullgrowncroptypecount = [];

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

  // bonuses from ethereal crops to basic crops
  // derived stat, not to be saved.
  this.ethereal_berry_bonus = Num(0);
  this.ethereal_mush_bonus = Num(0);
  this.ethereal_flower_bonus = Num(0);
  this.ethereal_nettle_bonus = Num(0);

  // derived stat, not to be saved.
  this.challenges_unlocked = 0;
  this.challenges_completed = 0;

  // how many mistletoes are correctly touching the tree
  // computed by precomputeField
  // derived stat, not to be saved.
  this.mistletoes = 0;

  // for bee challenge only, how many worker bees bonus is being applied to the world
  // derived stat, not to be saved.
  this.workerbeeboost = Num(0);

  // total production bonus from all challenges
  // derived stat, not to be saved.
  this.challenge_bonus = Num(0);

  // how many challenges are unlocked but never attempted
  // derived stat, not to be saved.
  this.untriedchallenges = 0;
}

function clearField(state) {
  state.field = [];
  for(var y = 0; y < state.numh; y++) {
    state.field[y] = [];
    for(var x = 0; x < state.numw; x++) {
      state.field[y][x] = new Cell(x, y);
    }
  }
  var treex = Math.floor((state.numw - 1) / 2); // for even field size, tree will be shifted to the left, not the right.
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
  var treex2 = Math.floor((state.numw2 - 1) / 2); // for even field size, tree will be shifted to the left, not the right.
  var treey2 = Math.floor(state.numh2 / 2);
  state.field2[treey2][treex2].index = FIELD_TREE_BOTTOM;
  state.field2[treey2 - 1][treex2].index = FIELD_TREE_TOP;
}

function changeFieldSize(state, w, h) {
  // this shift is designed such that the center tile of the old field will stay in the center, and in case of
  // even sizes will be at floor((w-1) / 2) horizontally, floor(h/2) vertically.
  // w and h should be larger than state.numw and state.numh respectively
  // the center tile is the tile with the tree bottom half
  var xs = (((state.numw + 1) >> 1) - ((w + 1) >> 1));
  var ys = ((state.numh >> 1) - (h >> 1));
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

function changeField2Size(state, w, h) {
  // this shift is designed such that the center tile of the old field will stay in the center, and in case of
  // even sizes will be at floor((w-1) / 2) horizontally, floor(h/2) vertically.
  // w and h should be larger than state.numw and state.numh respectively
  // the center tile is the tile with the tree bottom half
  var xs = (((state.numw2 + 1) >> 1) - ((w + 1) >> 1));
  var ys = ((state.numh2 >> 1) - (h >> 1));
  var field = [];
  for(var y = 0; y < h; y++) {
    field[y] = [];
    for(var x = 0; x < w; x++) {
      var x2 = x + xs;
      var y2 = y + ys;
      field[y][x] = (x2 >= 0 && x2 < state.numw2 && y2 >= 0 && y2 < state.numh2) ? state.field2[y2][x2] : new Cell(x, y);
      field[y][x].x = x;
      field[y][x].y = y;
    }
  }
  state.field2 = field;
  state.numw2 = w;
  state.numh2 = h;

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
  state.seed0 = Math.floor(Math.random() * 281474976710656);
  state.fruit_seed = Math.floor(Math.random() * 281474976710656);
  state.fern_seed = Math.floor(Math.random() * 281474976710656);

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
  state.fullgrowncroptypecount = [];
  state.croptypecount = [];
  for(var i = 0; i < registered_crops.length; i++) {
    state.cropcount[registered_crops[i]] = 0;
    state.fullgrowncropcount[registered_crops[i]] = 0;
  }
  for(var i = 1; i < CROPINDEX; i++) {
    state.specialfieldcount[i] = 0;
  }
  for(var i = 0; i < NUM_CROPTYPES; i++) {
    state.fullgrowncroptypecount[i] = 0;
    state.croptypecount[i] = 0;
  }
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(f.hasCrop()) {
        var c = f.getCrop();
        state.cropcount[c.index]++;
        state.numcropfields++;
        state.croptypecount[c.type]++;
        if(f.isFullGrown()) {
          state.fullgrowncropcount[c.index]++;
          state.fullgrowncroptypecount[c.type]++;
          state.numfullgrowncropfields++;
          if(c.type != CROPTYPE_SHORT) state.numfullpermanentcropfields++
        }
      } else if(f.index == 0 || f.index == FIELD_REMAINDER) {
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
      if(f.hasCrop()) {
        var c = crops2[f.cropIndex()];
        state.crop2count[c.index]++;
        state.numcropfields2++;
        if(f.growth >= 1) {
          state.fullgrowncrop2count[c.index]++;
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
      if(!u.seen && !u.count) state.upgrades_new++;
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
  state.ethereal_flower_bonus = Num(0);
  state.ethereal_nettle_bonus = Num(0);

  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      if(f.hasCrop() && f.growth >= 1) {
        var index = f.cropIndex();
        if(index == berry2_0) {
          var boost = Crop2.getNeighborBoost(f);
          state.ethereal_berry_bonus.addInPlace(boost.addr(1).mulr(0.25));
        }
        if(index == berry2_1) {
          var boost = Crop2.getNeighborBoost(f);
          state.ethereal_berry_bonus.addInPlace(boost.addr(1).mulr(1));
        }
        if(index == mush2_0) {
          var boost = Crop2.getNeighborBoost(f);
          state.ethereal_mush_bonus.addInPlace(boost.addr(1).mulr(0.25));
        }
        /*if(index == mush2_1) {
          var boost = Crop2.getNeighborBoost(f);
          state.ethereal_mush_bonus.addInPlace(boost.addr(1).mulr(1));
        }*/
        if(index == flower2_0) {
          var boost = Crop2.getNeighborBoost(f);
          state.ethereal_flower_bonus.addInPlace(boost.addr(1).mulr(0.25));
        }
        /*if(index == flower2_1) {
          var boost = Crop2.getNeighborBoost(f);
          state.ethereal_flower_bonus.addInPlace(boost.addr(1).mulr(1));
        }*/
        if(index == nettle2_0) {
          var boost = Crop2.getNeighborBoost(f);
          state.ethereal_nettle_bonus.addInPlace(boost.addr(1).mulr(0.25));
        }
      }
    }
  }
  //////////////////////////////////////////////////////////////////////////////

  for(var i = 0; i < state.fruit_active.length; i++) state.fruit_active[i].slot = i;
  for(var i = 0; i < state.fruit_stored.length; i++) state.fruit_stored[i].slot = i + 10;
  for(var i = 0; i < state.fruit_sacr.length; i++) state.fruit_sacr[i].slot = i + 20;

  //////////////////////////////////////////////////////////////////////////////

  state.challenges_unlocked = 0;
  state.challenges_completed = 0;
  state.challenge_bonus = Num(0);
  state.untriedchallenges = 0;
  for(var i = 0; i < registered_challenges.length; i++) {
    var index = registered_challenges[i];
    var c = state.challenges[index];
    if(c.unlocked) state.challenges_unlocked++;
    if(c.completed) state.challenges_completed++;
    if(c.unlocked && c.num == 0) state.untriedchallenges++;
    if(c.maxlevel > 0) {
      state.challenge_bonus.addInPlace(getChallengeBonus(index, c.maxlevel));
    }
  }
}

////////////////////////////////////////////////////////////////////////////////

function Fruit() {
  this.type = 0; // type 0 = apple, no other types implemented yet
  this.tier = 0;
  this.abilities = []; // array of the FRUIT_... abilities

  // how much the abilities have been leveled
  // must be at least 1 for any ability, 0 is equivalent to not having the ability at all.
  this.levels = [];

  this.essence = Num(0); // how much essence was already spent on upgrading this fruit

  this.mark = 0; // mark as favorite etc...

  // the slot in which this fruit is: 0 for the active slot, 10+ storage slots, and 20+ for sacrificial slots
  // not saved, this must be updated to match the slot the fruit is placed in, this is cache for fast reverse lookup only
  this.slot = 0;

  this.toString = function() {
    return tierNames[this.tier] + ' apple';
  };

  this.abilitiesToString = function(opt_abbreviated) {
    var result = '';
    for(var i = 0; i < this.abilities.length; i++) {
      if(i > 0) result += ', ';
      result += getFruitAbilityName(this.abilities[i], opt_abbreviated) + ' ' + util.toRoman(this.levels[i]);
    }
    return result;
  };
}

// returns the level of a specific fruit ability, or 0 if you don't have that ability
function getFruitAbility(ability) {
  if(state.fruit_active.length == 0) return 0;

  var f = state.fruit_active[0];
  for(var i = 0; i < f.abilities.length; i++) {
    if(f.abilities[i] == ability) return f.levels[i];
  }

  return 0;
}

function getFruitTier() {
  if(state.fruit_active.length == 0) return 0;

  return state.fruit_active[0].tier;
}

// slot is 0 for active, 10+ for stored, 20+ for sacrificial pool
// returns undefined if no fruit in that slot
function getFruit(slot) {
  if(slot < 10) {
    return state.fruit_active[slot];
  }
  if(slot < 20) {
    return state.fruit_stored[slot - 10];
  }
  return state.fruit_sacr[slot - 20];
}

// set f to something falsy to unset the fruit
// will shift/resize arrays to fit the updated collection
function setFruit(slot, f) {
  if(slot < 10) {
    var j = slot;
    if(f) {
      if(j > state.fruit_active.length) j = state.fruit_active.length;
      state.fruit_active[j] = f;
      f.slot = j;
    } else {
      for(var i = j; i + 1 < state.fruit_active.length; i++) {
        state.fruit_active[i] = state.fruit_active[i + 1];
        state.fruit_active[i].slot = i;
      }
      state.fruit_active.length = state.fruit_active.length - 1;
    }
  } else if(slot < 20) {
    var j = slot - 10;
    if(f) {
      if(j > state.fruit_stored.length) j = state.fruit_stored.length;
      state.fruit_stored[j] = f;
      f.slot = j + 10;
    } else {
      for(var i = j; i + 1 < state.fruit_stored.length; i++) {
        state.fruit_stored[i] = state.fruit_stored[i + 1];
        state.fruit_stored[i].slot = i + 10;
      }
      state.fruit_stored.length = state.fruit_stored.length - 1;
    }
  } else {
    var j = slot - 20;
    if(f) {
      if(j > state.fruit_sacr.length) j = state.fruit_sacr.length;
      state.fruit_sacr[j] = f;
      f.slot = j + 20;
    } else {
      for(var i = j; i + 1 < state.fruit_sacr.length; i++) {
        state.fruit_sacr[i] = state.fruit_sacr[i + 1];
        state.fruit_sacr[i].slot = i + 20;
      }
      state.fruit_sacr.length = state.fruit_sacr.length - 1;
    }
  }
}

function getUpcomingFruitEssence() {
  var res = Res();
  for(var j = 0; j < state.fruit_sacr.length; j++) res.addInPlace(getFruitSacrifice(state.fruit_sacr[j]));
  return res;
}
