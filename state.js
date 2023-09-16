/*
Ethereal Farm
Copyright (C) 2020-2023  Lode Vandevenne

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
var FIELD_MULTIPART = 5; // a field tile used by a multi-cell crop (2x2 pumpkin) but which isn't the main cell of the crop
var FIELD_POND = 6; // center of infinity field
var FIELD_BURROW = 7; // burrow, starting point of pests during the tower defense challenge

// field cell
// fieldtype: 1=basic, 2=ethereal, 3=infinity, 10=pond (fishes)
function Cell(x, y, fieldttype) {
  // index of crop, but with different numerical values:
  // 0 = empty
  // 1..(CROPINDEX-1): special: 1=tree top, 2=tree bottom, ...
  // >= CROPINDEX: crop with crop index = this.index - CROPINDEX.
  this.index = 0;
  this.growth = 0; // 0.0-1.0: percentage completed, or 1 if fullgrown
  this.runetime = 0; // used for runestone and crops next to runestone in infinity field. Starts at 23 hours, and then drops down to 0 over time (only used if runestone is involved, always 0 otherwise)

  this.x = x;
  this.y = y;

  // only used for ethereal field. TODO: make a Cell2 class for ethereal field instead
  this.justplanted = false; // planted during this run (this transcension), in the past this meant couldn't be deleted until next run. Currently unused, maybe needed for ethereal ferns.
  this.justreplaced = false; // has been replaced, so if it's growing now it doesn't count as a free ethereal delete

  this.fieldttype = fieldttype;

  this.nexttotree = false; // whether this crop is considered next to tree, with criteria depending on this crop (e.g. whether this is true in case it's diagonal, depends on the crop; and for crops for which this isn't used, this isn't filled in at all; ethereal mistletoe uses it, but basic field mistletoe does not because there that info is stored in prefield instead.)
}

Cell.prototype.isFullGrown = function() {
  if(this.index < CROPINDEX) return false; // not relevant for non-crops
  var c = this.getCrop();
  if(c.type == CROPTYPE_BRASSICA) return this.growth > 0;
  if(this.fieldttype == 1 && state.challenge == challenge_wither) return this.growth > 0;
  return this.growth >= 1;
};

// like fullgrown, but includes end-of-life semi-active wasabi
Cell.prototype.isSemiFullGrown = function() {
  if(this.isFullGrown()) return true;
  var c = this.getCrop();
  if(c && hasBrassicaInfiniteLifetime(c)) {
    return true;
  }
  return false;
};

// opt_multipart: also returns true if it's the non-main part of a multipart crop
Cell.prototype.hasCrop = function(opt_multipart) {
  if(opt_multipart && this.index == FIELD_MULTIPART) return this.getMainMultiPiece().hasCrop(false);
  return this.index >= CROPINDEX;
};

// a crop that actually produces or does something, excluding templates or ghosts
Cell.prototype.hasRealCrop = function(opt_multipart) {
  if(opt_multipart && this.index == FIELD_MULTIPART) return this.getMainMultiPiece().hasRealCrop(false);
  return this.index >= CROPINDEX && !this.getCrop().istemplate && !this.getCrop().isghost;
};

// only valid if hasCrop(), else returns an out of bounds value
Cell.prototype.cropIndex = function(opt_multipart) {
  if(opt_multipart && this.index == FIELD_MULTIPART) return this.getMainMultiPiece().cropIndex(false);
  return this.index - CROPINDEX;
};

// Only valid for the basic field, not for the ethereal field.
// returns crops object if the field has a crop, undefined otherwise
// TODO: make a class Cell2 for ethereal field instead
Cell.prototype.getCrop = function(opt_multipart) {
  if(opt_multipart && this.index == FIELD_MULTIPART) return this.getMainMultiPiece().getCrop(false);
  if(this.index < CROPINDEX) return undefined;
  if(this.fieldttype == 2) return crops2[this.index - CROPINDEX];
  if(this.fieldttype == 3) return crops3[this.index - CROPINDEX];
  if(this.fieldttype == 10) return fishes[this.index - CROPINDEX];
  return crops[this.index - CROPINDEX];
};


// non-template
Cell.prototype.getRealCrop = function(opt_multipart) {
  if(opt_multipart && this.index == FIELD_MULTIPART) return this.getMainMultiPiece().getRealCrop(false);
  var result = this.getCrop();
  if(result && (result.istemplate || result.isghost)) return undefined;
  return result;
};

// if the crop is a 2x2 crop, returns the quadrant this x, y part is in: 0 for top left, 1 for top right, 2 for bottom left, 3 for bottom right
// this assumes the crop is valid, that is, it's part of a 2x2 region
// does not support multiple of this type touching
function getQuadPos(x, y) {
  if(state.field[y][x].index != FIELD_MULTIPART) return 0;

  var n = (y > 0) && state.field[y - 1][x].index == FIELD_MULTIPART;
  var e = (x + 1 < state.numw) && state.field[y][x + 1].index == FIELD_MULTIPART;
  var s = (y + 1 < state.numh) && state.field[y + 1][x].index == FIELD_MULTIPART;
  var w = (x > 0) && state.field[y][x - 1].index == FIELD_MULTIPART;
  //var es = (x + 1 < state.numw && y + 1 < state.numh) && state.field[y][x + 1].index == FIELD_MULTIPART && state.field[y + 1][x].index == FIELD_MULTIPART;

  if(s && !w) return 1;
  if(e && !n) return 2;
  //if(e && s && !es) return 3;
  if(n && w) return 3;
  return 0;
}

// returns the main field cell for this 2x2 crop (or 1x2 for tree), given any piece of it
// returns self if this is already the main cell, or if this is not a multi-part crop at all
Cell.prototype.getMainMultiPiece = function() {
  if(this.index == FIELD_TREE_TOP) return this;
  if(this.index == FIELD_TREE_BOTTOM && this.y > 0) return state.field[this.y - 1][this.x];
  if(this.index == FIELD_MULTIPART) {
    var q = getQuadPos(this.x, this.y);
    if(q == 1) return state.field[this.y][this.x - 1];
    if(q == 2) return state.field[this.y - 1][this.x];
    if(q == 3) return state.field[this.y - 1][this.x - 1];
  }
  return this;
};

// function to check if two neighbors are legitimately diagonlly connected, geometrically speaking. In case of 2x2 crops or tree, something isn't diagonally connected if it's already orthogonally connected to it, to avoid double counting.
// does NOT take into account upgrades (such as the diagonal ethreal tree squirrel upgrade), only the geometry (related to pumpkin, ...), so upgrades must be checked at the call site
// this is for the main field, not the ethereal field
// field parameter: state.field for basic field, state.field2 for ethereal field
function diagConnected(x0, y0, x1, y1, field) {
  var f0 = field[y0][x0];
  var f1 = field[y1][x1];
  var c0 = f0.getCrop();
  var c1 = f1.getCrop();
  var simple0 = f0.index != FIELD_TREE_BOTTOM && f0.index != FIELD_TREE_TOP && f0.index != FIELD_MULTIPART && !(c0 && c0.quad);
  var simple1 = f1.index != FIELD_TREE_BOTTOM && f1.index != FIELD_TREE_TOP && f1.index != FIELD_MULTIPART && !(c1 && c1.quad);
  if(simple0 && simple1) return true;
  // the two orthogonally-connected pieces
  var f2 = field[y0][x1];
  var f3 = field[y1][x0];
  var m0 = f0.getMainMultiPiece();
  var m1 = f1.getMainMultiPiece();
  var m2 = f2.getMainMultiPiece();
  var m3 = f3.getMainMultiPiece();
  // if one of the orthogonally in-between cells is already part of the same crop, then don't connect it diagonally since it's already orthogonally connected
  return !(m2 == m0 || m2 == m1 || m3 == m0 || m3 == m1);
}

var neighbors_1x1 = [[0, -1, false], [1, 0, false], [0, 1, false], [-1, 0, false]];
var neighbors_1x1_diag = [[-1, -1, true], [0, -1, false], [1, -1, true], [-1, 0, false], [1, 0, false], [-1, 1, true], [0, 1, false], [1, 1, true]];
var neighbors_2x2 = [[0, -1, false], [1, -1, false], [-1, 0, false], [2, 0, false], [-1, 1, false], [2, 1, false], [0, 2, false], [1, 2, false]];
var neighbors_2x2_diag = [[-1, -1, true], [0, -1, false], [1, -1, false], [2, -1, true], [-1, 0, false], [2, 0, false], [-1, 1, false], [2, 1, false], [-1, 2, true], [0, 2, false], [1, 2, false], [2, 2, true]];

// returns list of neighbors from this crop, based on its shape (1x1 or 2x2). Does not filter out out-of-bounds cells, returns fixed possible arrays of relative coordinates.
// must still bound-check, and possibly use diagConnected, when iterating through those relative coordinates
// each returned direction has a third value, a boolean indicating whether it represents a diagonal direction. When include_diag is true, some of the values will have this true
Cell.prototype.getNeighborDirsFrom = function(include_diag) {
  var c = this.getCrop(false);
  if(c && c.quad) {
    return include_diag ? neighbors_2x2_diag : neighbors_2x2;
  }
  return include_diag ? neighbors_1x1_diag : neighbors_1x1;
};

// is empty so that you can plant on it (rocks do not count for this)
Cell.prototype.isEmpty = function() {
  return this.index == 0 || this.index == FIELD_REMAINDER;
};

Cell.prototype.isTree = function() {
  return this.index == FIELD_TREE_BOTTOM || this.index == FIELD_TREE_TOP;
};

Cell.prototype.isTemplate = function() {
  return this.hasCrop() && this.getCrop().istemplate;
};

Cell.prototype.isGhost = function() {
  return this.hasCrop() && this.getCrop().isghost;
};


////////////////////////////////////////////////////////////////////////////////

function CropState() {
  this.unlocked = false;
  this.prestige = 0;
  this.known = 0; // ever seen in any run. If it has an unlock upgrade, having seen the upgrade is enough. Value >= 1 means it was ever seen, value >= 2 means ever seen in prestiged form (e.g. the prestige upgrade visible), etc...
  // had a fullgrown version of this crop during this run, is an integer to indicate max prestige level had: the value is prestige + 1 (e.g. once a prestige 1 crop is fullgrown, had is set to 2; without any prestige 0 indicates not had, 1 means unprestiged crop had)
  // this is better to use than state.fullgrowncropcount directly for unlocks caused by the crop (unless a specific amount must be checked) because it stays even if the crop got deleted again (e.g. if automaton overrides blueprint due to trigger based on fullgrown crop)
  // the way to check if having crop of current prestige level is: c.had > c.prestige.
  this.had = 0;
}

function Crop2State() {
  this.unlocked = false;
  this.had = false; // becomes true if you have a fullgrown version of this crop
}

function Crop3State() {
  this.unlocked = false;
  this.had = false; // becomes true if you have a fullgrown version of this crop
}

function FishState() {
  this.unlocked = false;
  this.had = false; // becomes true if you ever had this fish
}

function UpgradeState() {
  this.seen = false; // seen the upgrade in the upgrades tab
  this.seen2 = false; // seen the upgrade ever
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

// squirrel upgrades
function SquirrelUpgradeState() {
  this.count = 0;
}
function SquirrelStageState() {
  this.num = [0, 0, 0]; // how far in each branch
  this.seen = [0, 0, 0]; // how far ever bought in this branch. seen here means bought the upgrade ever before, so won't show as '???' after respec. However, seeing it due to having been the next one after a bought one before, does not count.
}

function MedalState() {
  this.seen = false; // seen the achievement in the achievements tab
  this.earned = false;
}

function ChallengeState() {
  this.unlocked = false;
  this.completed = 0; // whether the challenge was successfully completed, or higher values if higher versions of the challenge with extra rewards were completed. Not useful to determine if cycles of cycling challenges were completed, use num_completed for that
  this.num = 0; // amount of times started, whether successful or not, excluding the current one
  this.num_completed = 0; // how often, the challenge was successfully completed (excluding currently ongoing challenge, if any)
  this.num_completed2 = 0; // how often, the challenge was successfully completed to final stage, or 0 if this challenge only has 1 stage
  this.maxlevel = 0; // max level reached with this challenge (excluding the current ongoing challenge if any)
  this.besttime = 0; // best time for reaching first targetlevel, even when not resetting. If continuing the challenge for higher maxlevel, still only the time to reach targetlevel is counted, so it's the best time for completing the first main reward part of the challenge.
  this.besttime2 = 0; // best time for reaching last targetlevel, or 0 if this challenge only has 1 stage. NOTE: so best time of first and last stage are tracked, if there are more intermediate stages, those are not tracked
  this.maxlevels = undefined; // max level if this is a cycling challenge: the max level per cycle. If enabled, this this is an array.
  this.besttimes = undefined; // for cycling challenges
  this.besttimes2 = undefined; // for cycling challenges

  // last run stats. There is always only one of these, not multiple for cycling challenges. This is for the last run, whether it completed or not
  this.last_completion_level = 0; // challenge level of last completion
  this.last_completion_time = 0; // runtime of last completion
  this.last_completion_resin = Num(0); // resin gained during last run
  this.last_completion_twigs = Num(0); // twigs gained during last run
  this.last_completion_date = 0; // when did you complete this challenge the last time, or 0 if unknown
  this.last_completion_total_resin = Num(0); // approximate amount of resin owned during the last time this challenge was ran
  this.last_completion_level2 = 0; // level of ethereal tree at time of completing the challenge last time
  this.last_completion_g_level = 0; // highest tree level ever (in any non-challenge or challenge run) at the time of last completion
}

function BluePrint() {
  this.numw = 0;
  this.numh = 0;

  /*
  2D array. meaning of codes roughly matches that of fraction arrays of automaton, though it stops matching at squirrel.
  0: empty
  1: N/A, unused
  2: w: watercress
  3: b: berry
  4: m: mushroom
  5: f: flower
  6: n: nettle
  7: z: bee ("buzz")
  8: i: mistletoe
  9: u: nuts
  ethereal:
  32: a: automaton
  33: s: squirrel
  34: l: lotus
  35: e: fern
  special/event:
  60: pumpkin
  */
  this.data = [];

  // for ethereal blueprints, whether higher level crop used in this spot
  this.tier = [];

  this.name = '';
}

// converts blueprint type code to a blueprint crop index, or -1 if empty
BluePrint.toCrop = function(i) {
  if(i == 0) return -1;
  if(i == 2) return watercress_template;
  if(i == 3) return berry_template;
  if(i == 4) return mush_template;
  if(i == 5) return flower_template;
  if(i == 6) return nettle_template;
  if(i == 7) return bee_template;
  if(i == 8) return mistletoe_template;
  if(i == 9) return nut_template;
  if(i == 60) return pumpkin_template;
  return -1;
}

function toCrop2Base(i) {
  if(i == 0) return -1;
  if(i == 2) return brassica2_template;
  if(i == 3) return berry2_template;
  if(i == 4) return mush2_template;
  if(i == 5) return flower2_template;
  if(i == 6) return nettle2_template;
  if(i == 7) return bee2_template;
  if(i == 8) return mistletoe2_template;
  //if(i == 9) return nut2_template;
  if(i == 32) return automaton2_template;
  if(i == 33) return squirrel2_template;
  if(i == 34) return lotus2_template;
  if(i == 35) return fern2_template;
  return -1;
}

BluePrint.toCrop2 = function(i, tier) {
  var index = toCrop2Base(i);
  if(index == -1) return index;
  var c = crops2[index];
  if(!c) return index;
  if(tier != undefined) {
    var c2 = croptype2_tiers[c.type][tier];
    if(c2) return c2.index;
  }
  return index;
}

BluePrint.fromCrop = function(c) {
  if(!c) return 0;
  if(c.type == CROPTYPE_BRASSICA) return 2;
  if(c.type == CROPTYPE_BERRY) return 3;
  if(c.type == CROPTYPE_MUSH) return 4;
  if(c.type == CROPTYPE_FLOWER) return 5;
  if(c.type == CROPTYPE_STINGING) return 6;
  if(c.type == CROPTYPE_BEE) return 7;
  if(c.type == CROPTYPE_MISTLETOE) return 8;
  if(c.type == CROPTYPE_NUT) return 9;
  if(c.type == CROPTYPE_AUTOMATON) return 32;
  if(c.type == CROPTYPE_SQUIRREL) return 33;
  if(c.type == CROPTYPE_LOTUS) return 34;
  if(c.type == CROPTYPE_FERN) return 35;
  if(c.type == CROPTYPE_PUMPKIN) return 60;
  return 0;
}

BluePrint.toChar = function(i) {
  if(i == 0) return '.';
  if(i == 2) return 'W'; // watercress (brassica)
  if(i == 3) return 'B'; // berry
  if(i == 4) return 'M'; // mushroom
  if(i == 5) return 'F'; // flower
  if(i == 6) return 'S'; // stinging (nettle, ...)
  if(i == 7) return 'Z'; // bee ("buzz")
  if(i == 8) return 'I'; // mistletoe
  if(i == 9) return 'N'; // nuts
  if(i == 32) return 'A'; // automaton
  if(i == 33) return 'Q'; // squirrel
  if(i == 34) return 'L'; // lotus
  if(i == 35) return 'E'; // fern
  if(i == 60) return 'U'; // pumpkin
  return -1;
}

BluePrint.fromChar = function(c) {
  if(!c) return 0;
  c = c.toUpperCase();
  if(c == 'W') return 2;
  if(c == 'B') return 3;
  if(c == 'M') return 4;
  if(c == 'F') return 5;
  if(c == 'S') return 6;
  if(c == 'Z') return 7;
  if(c == 'I') return 8;
  if(c == 'N') return 9;
  if(c == 'A') return 32;
  if(c == 'Q') return 33;
  if(c == 'L') return 34;
  if(c == 'E') return 35;
  if(c == 'U') return 60;
  return 0;
}

BluePrint.copyTo = function(from, to) {
  if(!to) return;
  if(!from) {
    to.numw = 0;
    to.numh = 0;
    to.data = [];
    to.tier = [];
  }
  to.numw = from.numw;
  to.numh = from.numh;
  to.data = util.clone(from.data);
  to.tier = util.clone(from.tier);
  to.name = from.name;
}

BluePrint.copy = function(b) {
  var result = new BluePrint();
  BluePrint.copyTo(b, result);
  return result;
}

// actual auto-action now (can also do other actions than blueprint)
// TODO: rename to AutoActionState
function AutoActionState() {
  this.enabled = false; // if false, this one is individually disabled

  this.done = false; // already done this action this round
  this.done2 = false; // done second part of this action: auto-fern (and a few other actions with it) happen only a few seconds later to give automaton time to plant the blueprint
  this.time2 = 0; // the time at which second part must be done. Only used while done is true and done2 is false

  this.type = 0; // what triggers this action: 0 = tree level, 1/2/3 = unlocked/growing/fullgrown crop type, 4 = run time, 5 = upgraded crop type

  this.level = 10; // tree level, for type 0

  this.crop = 0; // unlocked crop id + 1, or 0 to indicate none, for type 1, 2, 3 and 5
  this.prestige = 0; // prestige level required from the crop

  this.time = 0; // runtime for the trigger based on runtime, for type 4

  this.enable_blueprint = false;
  this.blueprint = 0; // index of blueprint to use + 1, or 0 if not yet configured

  this.enable_blueprint2 = false; // if true, replaces ethereal blueprint instead
  this.blueprint2 = 0; // index of ethereal blueprint to use + 1, or 0 if not yet configured

  this.enable_fruit = false;
  this.fruit = 0; // fruit slot for enable_fruit

  this.enable_weather = false;
  this.weather = 0; // 0=sun, 1=mist, 2=rainbow

  this.enable_brassica = false; // brassica refresh

  this.enable_fern = false; // fern pickup
}


function MistletoeUpgradeState() {
  this.time = 0; // current time spent upgrading it
  this.num = 0; // current level
}

var state_ctor_count = 0;

// all the state that should be able to get saved
function State() {
  state_ctor_count++;

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
  when moving from A to B, then when loading savegame, you see that more than 2 hours have passed. But, before applying the 2 hour production bonus, first any negative_time is subtracted from that (only partially if negative_time is even greater than this 2h)

  Side note: other things that must be done when going from B to A (going to the past, negative time delta):
  -adjust last fern time, such that it won't take hours before a fern appears
  -similar adjustments for last ability time, etc...
  */
  this.negative_time = 0;
  // total and max negative time ever seen, for debugging in case something goes wrong with this
  this.total_negative_time = 0;
  this.max_negative_time = 0;
  this.last_negative_time = 0;
  // amount of times a negative time issue happened
  this.num_negative_time = 0;

  // current time, this is usually the same as util.getTime(), but if an update() is broken into multiple pieces, then it is
  // the end of the current piece.
  // not saved. set by update(). recommended to use instead of util.getTime() for game time duration related computations such as special abilities
  this.time = 0;

  this.seed0 = -1; // if there's ever a new feature added to the game requiring a new random seed, this can be used to initialize that new seed to ensure the new seed can't be cheesed by refreshing with a savegame that didn't have the new seed yet

  this.beta = 0; // if higher value, it's an alpha/beta/test version of the game

  this.currentTab = 0; // currently selected tab
  this.numTabs = 0; // amount of visible tabs
  this.lastPlanted = -1; // for shift+plant
  this.lastPlanted2 = -1; // for shift+plant on field2
  this.lastPlanted3 = -1; // for shift+plant on field3
  this.lastPlantedFish = -1; // for shift+plant on pond

  // resources
  this.res = undefined;
  // resin that will be gained at the next soft reset, not added to res until the soft reset
  this.resin = Num(0);
  // twigs that will be gained at the next soft reset, not added to res until the soft reset
  this.twigs = Num(0);

  this.treelevel = 0;
  this.lasttreeleveluptime = 0; // time of previous time tree leveled, after transcend this is time tree leveled before that transcend (for amber)! if that's undesired, then use the function lastTreeLevelUpTime(state) or timeAtTreeLevel(state)
  this.lasttree2leveluptime = 0;
  this.lastambertime = 0;
  // for the fruit abilities that increase twigs and resin
  /*this.resinfruittime = 0;
  this.twigsfruittime = 0;
  this.prevresinfruitratio = 0;
  this.prevtwigsfruitratio = 0;
  this.overlevel = false; // when this tree level was reached with spores from the previous level*/
  this.resinfruitspores = Num(0); // spores gained while any resin-ability fruit was active
  this.twigsfruitspores = Num(0); // spores gained while any twigs-ability fruit was active
  this.fruitspores_total = Num(0); // not saved, computed during update() as a more-frequently-updated version of c_res.spores due to intermediate computations involving resinfruitspores and twigsfruitspores before the final c_res update

  this.infinitystarttime = 0; // when the infinity field was started

  this.prevleveltime = [0, 0, 0]; // previous tree level time durations. E.g. if tree level is now 10, this is the duration 9-10, 8-9 and 7-8 took respectively
  this.recentweighedleveltime = [0, 0]; // the weighed level time 2 and 4 minutes ago, this is a snapshot of recent weighted level time for use when taking fern: this allows you to change from seed fruit to spore fruit, which immediately levels up the tree a lot, but still pick up a fern with the production bonus from the previous weighted level time, since you can normally do that anyway by picking up the fern very fast after switching fruit. This is especially helpful for auto-actions that change fruit and take fern
  this.recentweighedleveltime_time = 0; // when the last snapshot of recentweighedleveltime was taken

  this.fern = 0; // 0 = no fern, 1 = standard fern, 2 = lucky fern
  this.fernx = 0;
  this.ferny = 0;
  this.fernwait = 0; // how much time the currently active fern took to appear
  this.fern_seed = -1; // random seed for the fern drops
  this.fernresin = new Res(); // amount of resin gotten from ferns. counted separately from state.resin, to not count towards the max ever itself
  this.fernres = new Res(); // resources player had (totally produced this run) at the moment the fern appeared. only stores spores and seeds. used for idle fern computation

  // presents were holiday gifts in january 2022, eggs in spring 2022
  this.present_effect = 0; // 0 = no present, 1+ = various effects
  this.present_image = 0;
  this.presentx = 0;
  this.presenty = 0;
  this.presentwait = 0;
  this.present_seed = -1; // random seed for the present drops
  this.lastPresentTime = 0;
  this.present_grow_speed_time = 0;
  this.present_production_boost_time = 0;

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

  this.challenges = []; // array of ChallengeState
  for(var i = 0; i < registered_challenges.length; i++) {
    this.challenges[registered_challenges[i]] = new ChallengeState();
    var c = challenges[registered_challenges[i]];
    var c2 = this.challenges[registered_challenges[i]];
    if(c.cycling > 1) {
      c2.maxlevels = [];
      c2.besttimes = [];
      c2.besttimes2 = [];
      for(var j = 0; j < c.cycling; j++) {
        c2.maxlevels[j] = 0;
        c2.besttimes[j] = 0;
        c2.besttimes2[j] = 0;
      }
    }
  }
  // also have run stats for no-challenge (index 0)
  this.challenges[0] = new ChallengeState();
  // whether the challenge was completed (or multiple objective completed for higher values) during this run
  // this as opposed to challenge.completed which is global across runs
  // only used for challenge with non-targetlevel based objective, for the targetlevel ones the tree level already indicates this
  this.challenge_completed = 0;

  this.towerdef = new TowerDefenseState();

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

  // infinity field and crops
  this.numw3 = 5;
  this.numh3 = 5;
  this.field3 = [];
  this.crops3 = [];
  for(var i = 0; i < registered_crops3.length; i++) {
    this.crops3[registered_crops3[i]] = new Crop3State();
  }

  // pond grid
  this.pondw = 5;
  this.pondh = 5;
  this.pond = []; // equivalent to field
  this.fishes = []; // equivalent to crops
  for(var i = 0; i < registered_fishes.length; i++) {
    this.fishes[registered_fishes[i]] = new FishState();
  }

  // minimum multiplyer to resin/twigs from fishes seen during this run, which is kept track of and used as actual multiplier to prevent fish-swapping strategies during the game
  this.min_fish_resinmul = Num(-1);
  this.min_fish_twigsmul = Num(-1);


  this.squirrel_evolution = 0;
  this.squirrel_stages = []; // must be inited with initSquirrelStages at appropriate times
  this.squirrel_upgrades_spent = Num(0); // nuts spent on squirrel_upgrades, can be given back on respec
  this.nuts_before = Num(0); // nuts before evolution change
  this.just_evolution = false; // if true, did squirrel evolution during this run so no nuts are produced
  this.seen_evolution = false; // to no longer color tab red if only upgrade is evolution


  // squirrel upgrades
  // NOT saved, squirrel_stages is saved instead. But does give the info of upgrades from stages, including "count" if an upgrade appears multiple times in various stages. This one is kept in sync, not computed by computeDerived.
  this.squirrel_upgrades = [];
  for(var i = 0; i < registered_squirrel_upgrades.length; i++) {
    this.squirrel_upgrades[registered_squirrel_upgrades[i]] = new SquirrelUpgradeState();
  }


  this.misttime = 0; // mist is unlocked if state.upgrades[upgrade_mistunlock].count
  this.suntime = 0; // similar
  this.rainbowtime = 0;
  this.lastWeather = 0; // last clicked weather ability, if multiple are active according to the timer, only the one matching this counts as active
  this.lastPermaWeather = 0; // Indicates which perma weathe ris active. Similar to lastWeather and usually set to the same as it, but can be set to something else to change which perma weather will get activated when the true weather ended.
  this.lastLightningTime = 0; // for the stormy challenge

  this.lastFernTime = 0; // if there is a fern: time since it spawned. If there is no fern: time that there was no fern
  this.lastBackupWarningTime = 0;

  // misc
  this.delete2tokens = 4; // obsolete but for now still present in case the tokens need to come back
  this.squirrel_respec_tokens = squirrel_respec_initial; // a resource, though not part of the Res() resources object since it's more its own special purpose thing
  this.paused = false;
  this.lastEtherealDeleteTime = 0; // This was used for the ethereal delete limitations, which were removed in november 2022. Not yet removed for now incase the system needs to come back in some form, but may be obsolete
  this.lastEtherealPlantTime = 0; // idem

  // fruit
  this.fruit_seed = -1; // random seed for creating random fruits
  this.fruit_seen = false; // whether seen latest fruit drop (for red color)
  this.fruit_active = 0; // index in fruit_stored of currently active fruit, or -1 to explicitely disable fruit
  this.fruit_stored = []; // fruits in storage that stay after transcension
  this.fruit_slots = 3; // amount of slots for fruit_stored
  this.fruit_sacr = []; // fruits outside of storage that will be sacrificed on transcension
  this.seen_seasonal_fruit = 0; // bit flags: 1=spring fruit, 2=summer fruit, 4=autumn fruit, 8=winter fruit, and so on for higher fruit types. For each flag, if false means never seen a seasonal fruit of that type yet. Some events here give an extra fruit slot.
  this.fruit_recover = []; // fruits from previous run that can be recovered

  // settings / preferences
  this.notation = Num.N_LATIN; // number notation
  this.precision = 3; // precision of the numeric notation
  this.roman = 1; // use roman numbers in various places (upgrade levels, ...). 1: all roman, 0: roman up to 12, 2: no roman
  this.mobilemode = false;
  this.saveonaction = true; // save when doing player actions, and with the window unload event (this is different than the interval based autosave)
  this.tooltipstyle = 1;
  this.disableHelp = false; // disable all popup help dialogs
  this.uistyle = 1; // 0=default (1), 1=light, 2=dark, 3=darkest
  this.sidepanel = 1; // 0=disabled, 1=automatic
  this.notificationsounds = [0, 0]; // index0: fern sound, index1: fullgrown sound
  this.volume = 1; // for notification sounds
  this.messagelogenabled = [1, 1, 1, 1, 1, 1]; // 0: "game saved" message log messages, 1: tree leveling, 2: upgrades available, 3: abbreviated help, 4: pause/resumed messages, 5: fruit drops
  this.cancelbuttonright = true; // whether cancel buttons in dialogs appear on the leftmost or the rightmost side of a group of buttons (the group of button always starts from the right either way). If on the right side, all cancel or back buttons are in the same right corner of the screen. If false, then the right corner of the screen gets the "do the action" button, and cancel/back buttons are to the left.
  // each of the following keys has the following meanings: 0=nothing, 1=weather (1-3, does not work for brackets), 2=tabs, 3=active fruit
  this.keys_numbers = 3;
  this.keys_numbers_shift = 1; // there is none for ctrl, ctrl+numbers makes browsers change their tab, can't use this as a shortcut key in the game
  this.keys_brackets = 2;
  this.keepinterestingfruit = false;

  // help dialog related
  this.help_seen = {}; // ever seen this help message at all as dialog
  this.help_seen_text = {}; // ever seen this help message at all as text
  this.help_disable = {}; // disabled this help message (available once seeing it the second time)

  // automaton
  this.automaton_enabled = true; // default is true, but is not active until you actually placed the automaton

  this.automaton_autochoice = 0;

  /*
  for each choice upgrade:
  0 (or array too short): not yet unlocked for this choice upgrade, so nothing to set
  1: manual mode, player chooses to do the choice upgrades manually and not let automaton do it
  2: auto choose first choice
  3: auto choose second choice
  */
  this.automaton_choices = [];

  /*
  0: auto upgrades disabled
  1: auto upgrades enabled
  */
  this.automaton_autoupgrade = 1;

  /*
  fraction of resources the automaton is allowed to use for auto-upgrades, e.g. 0.1 to allow to use up to 10% of resources for auto upgrades
  meaning of each index:
  0: global, when there is no distinction made between plant types
  1: other / challenge-specific crops
  2: watercress
  3: berry
  4: mushroom
  5: flower
  6: nettle
  7: beehive
  8: mistletoe (not used for upgrade, but used for auto unlock for example in other fraction arrays below)
  9: nuts
  */
  this.automaton_autoupgrade_fraction = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

  /*
  0: auto plant disabled
  1: auto plant enabled
  */
  this.automaton_autoplant = 1;

  /*
  fraction of resources automation is allowed to use for auto-plant
  the indices are the same as for automaton_autoupgrade_fraction, even though some are unused (e.g. watercress)
  */
  this.automaton_autoplant_fraction = [1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

  /*
  0: autounlock disabled
  1: autounlock enabled, but only if also autoplant is enabled
  */
  this.automaton_autounlock = 1;
  this.automaton_autounlock_copy_plant_fraction = false;
  this.automaton_autounlock_fraction = [1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  this.automaton_autounlock_max_cost = Num(0);

  /*
  0: autoprestige disabled
  1: autoprestige enabled, but only if also autoplant is enabled
  */
  this.automaton_autoprestige = 1;

  /*
  auto action = automatically do auto-actions, such as plant a blueprint, at certain programmable points
  0: auto action globally disabled
  1: auto action enabled
  2: auto action disabled for now, but enable again next run
  */
  this.automaton_autoaction = 0;

  this.automaton_autoactions = []; // array of AutoActionState. The first one (index 0) is special: that one is always activated at start of a run (time 0), so has no configurable trigger condition

  // challenges
  this.challenge = 0;
  this.challenge_autoaction_warning = false; // has autoaction_warning already been applied during this challenge run

  // saved stats, global across all runs
  this.g_numresets = 0; // amount of soft resets done, non-challenge
  this.g_numsaves = 0;
  this.g_numautosaves = 0;
  this.g_numloads = 0;
  this.g_numimports = 0;
  this.g_numexports = 0;
  this.g_lastexporttime = 0; // last save export time, to give warnings
  this.g_lastimporttime = 0; // last save import time, for those same warnings
  this.g_nummedals = 0;
  this.g_treelevel = 0; // max tree level of any run
  this.g_numplanted2 = 0;
  this.g_numunplanted2 = 0;
  this.g_numupgrades2 = 0;
  this.g_numupgrades2_unlocked = 0;
  this.g_numfullgrown2 = 0;
  this.g_seasons = 0; // season changes actually seen (a savegame from multiple days ago counts as only 1)
  this.g_resin_from_transcends = Num(0); // this is likely the same value as g_res.resin, but is a separate counter for amount of resin ever earned from transcends in case it's needed for recovery in transcension-changing game updates
  this.g_delete2tokens = 0; //  obsolete but for now still present in case the tokens need to come back
  this.g_fastestrun = 0; // runtime of fastest transcension
  this.g_slowestrun = 0; // runtime of slowest transcension
  this.g_fastestrun2 = 0; // as measured on wall clock instead of the runtime that gets deltas added each time
  this.g_slowestrun2 = 0;
  this.g_numresets_challenge = 0; // amount of soft resets done after a challenge, excluding g_numresets_challenge_0
  this.g_numresets_challenge_0 = 0; // amount of challenges quit immediately, before tree leveled even to level 1, so these do not count for stats, not even num runs of a challenge
  this.g_numresets_challenge_10 = 0; // amount of soft resets done after a challenge where at least level 10 was reached, so that it can be counted as at least as good as a regular g_numresets value
  this.g_p_treelevel = 0; // max tree level of any run, but not including the current run
  this.g_num_squirrel_upgrades = 0;
  this.g_num_squirrel_respec = 0;
  this.g_amberdrops = 0;
  this.g_amberbuy = [0, 0, 0, 0]; // amount bought of amber upgrades
  this.g_max_res_earned = Res(); // max total resources earned during a run (excluding current one), includes best amount of total resin and twigs earned during a single run, but excludes resin/(twigs if implemented) earned from extra bushy ferns
  this.g_fernres = Res(); // total resources gotten from ferns
  this.g_numpresents = [0, 0]; // order: presents '21-'22, eggs '22
  this.g_nummistletoeupgradesdone = 0;
  this.g_nummistletoeupgrades = 0; // started or continued
  this.g_nummistletoecancels = 0;
  this.g_mistletoeidletime = 0;
  this.g_mistletoeupgradetime = 0; // this is the effective upgrade time, that is, idle time that was used for upgrades is also counted (e.g. if a single 1 day worth upgrade is done in total, the value of this will be exactly 1d)
  this.g_numplanted3 = 0;
  this.g_numunplanted3 = 0;
  this.g_numfullgrown3 = 0;
  this.g_numwither3 = 0;
  this.g_numamberkeeprefunds = 0;
  this.g_max_infinityboost = Num(0); // max boost to basic field ever seen from infinity field
  this.g_fruits_recovered = 0;
  this.g_numplanted_fish = 0;
  this.g_numunplanted_fish = 0;

  this.g_starttime = 0; // starttime of the game (when first run started)
  this.g_runtime = 0; // this would be equal to getTime() - g_starttime if game-time always ran at 1x (it does, except if pause or boosts would exist)
  this.g_numticks = 0;
  this.g_res = Res(); // total resources gained, all income ever without subtracting costs, including both production and one-time income
  this.g_max_res = Res(); // max resources ever had
  this.g_max_prod = Res(); // max displayed resource/second gain ever had (production, this excludes immediate resources such as from ferns)
  this.g_numferns = 0;
  this.g_numplantedbrassica = 0; // amount of short-lived plants planted
  this.g_numplanted = 0; // amount of plants planted on a field
  this.g_numfullgrown = 0; // very similar to numplanted, but for full grown plants
  this.g_numunplanted = 0; // amount of plants deleted from a field
  this.g_numupgrades = 0; // upgrades performed
  this.g_numupgrades_unlocked = 0; // upgrades unlocked but not yet necessarily performed
  this.g_numabilities = 0; // weather abilities ran
  this.g_numfruits = 0; // fruits received
  this.g_numfruitupgrades = 0;
  this.g_numautoupgrades = 0; // upgrades done with automaton. These are also counted in the standard g_numupgrades as well.
  this.g_numautoplant = 0;
  this.g_numautodelete = 0;
  this.g_numfused = 0;
  this.g_res_hr_best = Res(); // best resource/hr ever had
  this.g_res_hr_at = Res(); // at what tree level that was
  this.g_res_hr_at_time = Res(); // at how long into the run that was
  this.g_pausetime = 0;
  this.g_numprestiges = 0; // prestiges performed
  this.g_numautoprestiges = 0; // prestiges performed by automaton
  this.g_lightnings = 0; // lightnings during the stormy challenge
  this.g_td_waves = 0;
  this.g_td_spawns = 0;
  this.g_td_kills = 0;
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  // saved stats, for previous reset (to compare with current one)
  this.p_treelevel = 0;
  this.p_res_no_ferns = Res(); // resources excluding those from ferns (currently only resin is filled in). However for seeds/spores this is not counted (those aren't seperately remembered), but it is for resin. If twigs ever get given by fern, those should be included too. This is to give accurate previous resin/hr stat, since the resin/hr stats don't include bushy ferns.

  this.p_starttime = 0; // starttime of previous run
  this.p_runtime = 0;
  this.p_numticks = 0;
  this.p_res = Res();
  this.p_max_res = Res();
  this.p_max_prod = Res();
  this.p_numferns = 0;
  this.p_numplantedbrassica = 0;
  this.p_numplanted = 0;
  this.p_numfullgrown = 0;
  this.p_numunplanted = 0;
  this.p_numupgrades = 0;
  this.p_numupgrades_unlocked = 0;
  this.p_numabilities = 0;
  this.p_numfruits = 0;
  this.p_numfruitupgrades = 0;
  this.p_numautoupgrades = 0;
  this.p_numautoplant = 0;
  this.p_numautodelete = 0;
  this.p_numfused = 0;
  this.p_res_hr_best = Res();
  this.p_res_hr_at = Res();
  this.p_res_hr_at_time = Res();
  this.p_pausetime = 0;
  this.p_numprestiges = 0;
  this.p_numautoprestiges = 0;
  this.p_lightnings = 0; // lightnings during the stormy challenge
  this.p_td_waves = 0; // from previous TD run
  this.p_td_spawns = 0; // from previous TD run
  this.p_td_kills = 0; // from previous TD run
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  // saved stats, for current reset only
  this.c_starttime = 0; // starttime of current run
  this.c_runtime = 0;
  this.c_numticks = 0;
  this.c_res = Res(); // resources gained this run, all income this run without subtracting costs, including both production and one-time income
  this.c_max_res = Res();
  this.c_max_prod = Res();
  this.c_numferns = 0;
  this.c_numplantedbrassica = 0;
  this.c_numplanted = 0;
  this.c_numfullgrown = 0;
  this.c_numunplanted = 0;
  this.c_numupgrades = 0;
  this.c_numupgrades_unlocked = 0;
  this.c_numabilities = 0;
  this.c_numfruits = 0;
  this.c_numfruitupgrades = 0;
  this.c_numautoupgrades = 0;
  this.c_numautoplant = 0;
  this.c_numautodelete = 0;
  this.c_numfused = 0;
  this.c_res_hr_best = Res();
  this.c_res_hr_at = Res();
  this.c_res_hr_at_time = Res();
  this.c_pausetime = 0;
  this.c_numprestiges = 0;
  this.c_numpautorestiges = 0;
  this.c_lightnings = 0; // lightnings during the stormy challenge
  this.c_td_waves = 0;
  this.c_td_spawns = 0;
  this.c_td_kills = 0;
  //this.c_res_prod = Res(); // similar to c_res, but only production from crops, not one-time income like ferns, holiday events, ... resin/twigs also not included since they're also not continuous crop production
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  // progress stats, most recent stat at the end
  this.reset_stats_level = []; // reset at what tree level for each reset
  this.reset_stats_level2 = []; // tree level 2 at end of this run
  this.reset_stats_time = []; // approximate time of this run
  this.reset_stats_total_resin = []; // approximate total resin earned in total before start of this run
  this.reset_stats_resin = []; // approximate resin earned during this run
  this.reset_stats_twigs = []; // approximate twigs earned during this run
  this.reset_stats_challenge = []; // what type of challenge, if any, for this run

  // stats at ethereal tree levelup. The index is the ethereal tree level before, not after, e.g. index 0 corresponds to leveling up to level 1.
  this.eth_stats_time = []; // since game start
  this.eth_stats_res = []; // total resources, except for resources that reset (seeds and spores) for which it is max had instead
  this.eth_stats_level = []; // highest tree level
  this.eth_stats_numresets = [];
  this.eth_stats_challenge = []; // challenge bonus
  this.eth_stats_medal_bonus = [];


  // array of BluePrint objects
  this.blueprints = [];
  this.blueprints2 = [];
  // TODO: persist remembering the blueprint dialog page
  //this.blueprint_page = 0;
  //this.blueprint_page2 = 0;

  // effects for this run
  this.amberprod = false;
  this.amberseason = false; // a season duration amber effect was activated during this season
  this.amberkeepseason = false;
  this.amberkeepseasonused = false;
  this.amberkeepseason_season = 0; // which season is the one being held, set when enabling hold season, read when amberkeepseasonused is true
  this.seasonshift = 0; // in seconds, for the amber season move effects
  // if 1, then getSeasonAt should return 1 season higher than the current one, and timeTilNextSeason should return 24 hours more.
  // This should be decremented to 0 when a regular season-change boundary is crossed.
  // The purpose of this is for when you extend the duration of the current season by 1 hour, but we're only in the first few minutes of this season:
  // then it is more than 24h til the next season, but without this variable, that's not supported, as the season is computed to cycle every 24h.
  this.seasoncorrection = 0;
  // whether auto choices have been reset with amber this run
  this.amber_reset_choices = false;


  // ethereal mistletoe stats
  this.mistletoeupgrades = []; // contains MistletoeUpgradeState's for registered MistletoeUpgrade
  for(var i = 0; i < registered_mistles.length; i++) {
    this.mistletoeupgrades[registered_mistles[i]] = new MistletoeUpgradeState();
  }
  this.mistletoeupgrade = -1; // if >= 0, index of mistletoeupgrade currently being done
  this.mistletoeidletime = 0; // time when idle, not upgrading anything.


  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // temp variables for visual effect, not to be saved
  this.automatonx = 0; // for the visual planting effect
  this.automatony = 0;
  this.automatonfieldtime = 0; // for the visual planting effect

  // amount of fields with nothing on them (index 0, or FIELD_REMAINDER)
  // derived stat, not to be saved
  this.numemptyfields = 0;
  this.numemptyfields2 = 0;
  this.numemptyfields3 = 0;

  // amount of fields with a crop on them (hasRealCrop(), special types 1<=index<CROPINDEX are not counted)
  // includes growing ones, excludes templates
  // derived stat, not to be saved
  this.numcropfields = 0;
  this.numcropfields2 = 0;
  this.numcropfields3 = 0;
  // same as numcropfields but only counts crops that can be struck by lightning during the stormy challenge
  this.numcropfields_lightning = 0;
  // same as numcropfields but excludes brassica
  this.numcropfields_permanent = 0;
  this.numfishes = 0; // total number of all fishes of any type in the pond

  // fullgrown only, not growing, any type >= CROPINDEX. Includes shoft-lived plants.
  // derived stat, not to be saved
  this.numfullgrowncropfields = 0;
  this.numfullgrowncropfields2 = 0;
  this.numfullgrowncropfields3 = 0;

  // like numfullgrowncropfields but excluding short lived crops
  // derived stat, not to be saved
  this.numfullpermanentcropfields = 0;

  // amount of plants of this type planted in fields, including newly still growing ones, and excluding templates for croptypecount
  // derived stat, not to be saved
  this.cropcount = [];
  this.crop2count = [];
  this.crop3count = [];
  this.fishcount = [];

  this.croptypecount = []; // excludes templates

  // num crops growing (not fullgrown) in main field of any type (excludes brassica, and is 0 during the wither challenge)
  this.numgrowing = 0;

  // derived stat, not to be saved
  this.templatecount = 0;
  this.ghostcount = 0;
  this.ghostcount2 = 0; // includes other things that could be considered ghost: brassica remainders and brassica at 0 growth (for the field full of ghosts medal)

  // amount of fully grown plants of this type planted in fields
  // does not include partially growing ones, nor templates
  // derived stat, not to be saved
  this.fullgrowncropcount = [];
  this.growingcropcount = []; // fractional count: fullgrown crops count as 1, half-grown ones as 0.5, etc...
  this.fullgrowncrop2count = [];
  this.fullgrowncrop3count = [];
  this.fullgrowncroptypecount = [];
  this.growingcroptypecount = [];
  // any crops of that type, including growing, templates, fullgrown, ...
  this.anycroptypecount = [];

  // count of non-crop fields, such as fern
  this.specialfieldcount = [];
  this.specialfield2count = [];
  this.specialfield3count = [];

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
  this.upgrades_new_b = 0; // a version more fine-tuned for when upgrades tab should be red and when not
  this.upgrades2_new = 0; // ethereal upgrades

  // derived stat, not to be saved
  this.squirrel_upgrades_count = 0;

  // derived stat, not to be saved
  this.highest_gated_index = 0; // e.g. 0 if in no squirrel upgrade gated upgrades bought yet, 1 if in the stages after the first such gate, etc...
  this.highest_gated_index2 = 0; // similar but for gated_index2

  // whether all squirrel upgrades (all stages) bought
  // derived stat, not to be saved
  this.allsquirrelupgradebought = false;
  // similar, but ignores squirrel evolution once seen
  this.allsquirrelupgradebought2 = false;

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
  this.ethereal_bee_bonus = Num(0);
  this.ethereal_brassica_bonus = Num(0);

  // derived stat, not to be saved.
  this.challenges_unlocked = 0;
  this.challenges_completed = 0; // completed at least 1 stage
  this.challenges_completed2 = 0; // completed all stages
  this.challenges_completed3 = 0; // stages completed

  // how many mistletoes are correctly touching the tree
  // computed by precomputeField
  // derived stat, not to be saved.
  this.mistletoes = 0;

  // for bee challenge only, how many worker bees bonus is being applied to the world
  // derived stat, not to be saved.
  this.workerbeeboost = Num(0);

  // total production bonus from all challenges (multiplicative), as multpilier
  // derived stat, not to be saved.
  this.challenge_multiplier = Num(1);

  // how many challenges are unlocked but never attempted
  // derived stat, not to be saved.
  this.untriedchallenges = 0;

  // highest/lowest tier crop of this croptype on the basic field, including growing ones
  // NOTE: may be -1 (template) or -Infinity (no crop at all), in that case does not refer to a valid crop
  // derived stat, not to be saved.
  this.highestoftypeplanted = [];
  this.highestoftype2planted = [];
  // same but only fullgrown
  this.highestoftypefullgrown = [];
  this.highestoftypehad = []; // very similar to highestoftypefullgrown, and also requires fullgrown crops, but uses the 'had' field of crops so remains set even if the crop was fullgrown once but then deleted from the field
  this.lowestoftypeplanted = []; // excludes ghosts (NOTE: if for some reason this must be changed to include ghosts, then getCheapestNextOfCropType must be fixed to take lowest tier of -2 into account, or automaton won't do crop upgrades at all if a ghost of the same type is present)
  this.lowestcropoftypeunlocked = []; // this is for in case plants are prestiged: the lowest tier of this plant that exists, e.g. normally this is 0, but if blackberry and blueberry have been prestiged, this is 2. Does not include the templates (tier -1)

  // same as highestoftypeplanted but has crop index instead of tier values. undefined if none is planted of this type
  // NOTE: uses index of the crop rather than the crop directly, because there are some occurences of util.clone(state), and those should not clone the images of crops
  // derived stat, not to be saved
  this.highestcropoftypeplanted = [];

  // higest tier unlocked by research for this croptype
  // NOTE: may be -1 (template) or -Infinity (no crop at all), in that case does not refer to a valid crop
  // derived stat, not to be saved.
  this.highestoftypeunlocked = [];
  this.highestoftype2unlocked = [];
  this.highestoftype3unlocked = [];
  this.highestoftype3had = [];
  this.highestoftypefishunlocked = [];
  this.highestoftypefishhad = [];

  // same as highestoftype2unlocked but has crop index instead of tier values. undefined if none is unlocked of this type
  this.highestcropoftype2unlocked = [];

  // like highestoftypeunlocked, but also includes known next types, because their unlock research is visible (but not yet researched)
  this.highestoftypeknown = [];

  // derived stat, not to be saved.
  this.numnonemptyblueprints = 0;

  // derived stat, not to be saved.
  this.etherealmistletoenexttotree = false;

  // derived stat, not to be saved. Computed in precomputeField. Only used for halloween pumpkin.
  this.bestberryforpumpkin = undefined;
  // same but assuming all berries fullgrown
  this.bestberryforpumpkin_expected = undefined;
  // amount of prestige levels of the best pumpkin berry
  this.bestberryforpumpkin_prestige = false;

  // Boost to basic field from infinity field crops
  // derived stat, not to be saved.
  this.infinityboost = Num(0);
}

// this.squirrel_evolution must already be set to the intended evolution
// must be called for new state, after loading save, or after squirrel_evolution changes
State.prototype.initSquirrelStages = function() {
  this.squirrel_stages = [];
  var stages = squirrel_stages[this.squirrel_evolution];
  for(var i = 0; i < stages.length; i++) {
    this.squirrel_stages[i] = new SquirrelStageState();
  }
};

// chooses the correct squirrel evolution image
// in addition, set the holiday hat images for squirrel and automaton if applicable
State.prototype.initEvolutionAndHatImages = function() {
  var image_squirrel_evolution;
  var image_automaton;
  if(holidayEventActive() == 1) {
    image_squirrel_evolution = (this.squirrel_evolution == 0) ? image_squirrel_hat : image_squirrel2_hat;
    image_automaton = image_automaton_hat;
  } else {
    image_squirrel_evolution = (this.squirrel_evolution == 0) ? image_squirrel_base : image_squirrel2_base;
    image_automaton = image_automaton_base;
  }
  for(var i = 0; i < images_squirrel.length; i++) regenerateImageCanvas(image_squirrel_evolution, images_squirrel[i]);
  for(var i = 0; i < images_automaton.length; i++) regenerateImageCanvas(image_automaton, images_automaton[i]);
};

// opt_insert_at_front: set to true to insert new ones at the front. This should be used for when the start-only auto-action is unlocked, since that one is from then on always at index 0.
State.prototype.updateAutoActionAmount = function(amount, opt_insert_at_front) {
  if(amount == this.automaton_autoactions.length) return;

  if(amount < this.automaton_autoactions.length) {
    this.automaton_autoactions.length = amount;
    return;
  }

  if(opt_insert_at_front) {
    while(this.automaton_autoactions.length < amount) this.automaton_autoactions.unshift(new AutoActionState());
  } else {
    while(this.automaton_autoactions.length < amount) this.automaton_autoactions.push(new AutoActionState());
  }
}

function lastTreeLevelUpTime(state) {
  // state.lasttreeleveluptime is time of previous time tree leveled, after transcend this is time tree leveled before that transcend! but for this function's return value, the starttime is used for that instead to fix that
  return state.treelevel > 0 ? state.lasttreeleveluptime : state.c_starttime;
}

function timeAtTreeLevel(state) {
  return state.time - lastTreeLevelUpTime(state);
}

function clearField(state) {
  state.field = [];
  for(var y = 0; y < state.numh; y++) {
    state.field[y] = [];
    for(var x = 0; x < state.numw; x++) {
      state.field[y][x] = new Cell(x, y, 1);
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
      state.field2[y][x] = new Cell(x, y, 2);
    }
  }
  var treex2 = Math.floor((state.numw2 - 1) / 2); // for even field size, tree will be shifted to the left, not the right.
  var treey2 = Math.floor(state.numh2 / 2);
  state.field2[treey2][treex2].index = FIELD_TREE_BOTTOM;
  state.field2[treey2 - 1][treex2].index = FIELD_TREE_TOP;
}

function clearField3(state) {
  state.field3 = [];
  for(var y = 0; y < state.numh3; y++) {
    state.field3[y] = [];
    for(var x = 0; x < state.numw3; x++) {
      state.field3[y][x] = new Cell(x, y, 3);
    }
  }
  var pondx3 = Math.floor((state.numw3 - 1) / 2); // for even field size, pond will be shifted to the left, not the right.
  var pondy3 = Math.floor(state.numh3 / 2);
  state.field3[pondx3][pondy3].index = FIELD_POND;
}

function clearPond(state) {
  state.pond = [];
  for(var y = 0; y < state.pondh; y++) {
    state.pond[y] = [];
    for(var x = 0; x < state.pondw; x++) {
      state.pond[y][x] = new Cell(x, y, 10);
    }
  }
}

function changeFieldSize(state, w, h) {
  var content = 0; // what to fill the new field cells with, depending on challenge
  if(state.challenge == challenge_rocks) content = FIELD_ROCK;
  if(state.challenge == challenge_rockier) content = FIELD_ROCK;
  if(state.challenge == challenge_thistle) content = CROPINDEX + nettle_1;
  if(state.challenge == challenge_poisonivy) content = CROPINDEX + nettle_2;

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
      if(x2 >= 0 && x2 < state.numw && y2 >= 0 && y2 < state.numh) {
        field[y][x] = state.field[y2][x2];
        field[y][x].x = x;
        field[y][x].y = y;
      } else {
        field[y][x] = new Cell(x, y, 1);
        field[y][x].index = content;
      }
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
      field[y][x] = (x2 >= 0 && x2 < state.numw2 && y2 >= 0 && y2 < state.numh2) ? state.field2[y2][x2] : new Cell(x, y, 2);
      field[y][x].x = x;
      field[y][x].y = y;
    }
  }
  state.field2 = field;
  state.numw2 = w;
  state.numh2 = h;
}

function changeField3Size(state, w, h) {
  // this shift is designed such that the center tile of the old field will stay in the center, and in case of
  // even sizes will be at floor((w-1) / 2) horizontally, floor(h/2) vertically.
  // w and h should be larger than state.numw and state.numh respectively
  // the center tile is the tile with the tree bottom half
  var xs = (((state.numw3 + 1) >> 1) - ((w + 1) >> 1));
  var ys = ((state.numh3 >> 1) - (h >> 1));
  var field = [];
  for(var y = 0; y < h; y++) {
    field[y] = [];
    for(var x = 0; x < w; x++) {
      var x2 = x + xs;
      var y2 = y + ys;
      field[y][x] = (x2 >= 0 && x2 < state.numw3 && y2 >= 0 && y2 < state.numh3) ? state.field3[y2][x2] : new Cell(x, y, 3);
      field[y][x].x = x;
      field[y][x].y = y;
    }
  }
  state.field3 = field;
  state.numw3 = w;
  state.numh3 = h;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function createInitialState() {
  var state = new State();

  state.res = Res({seeds:initial_starter_seeds});

  clearField(state);
  clearField2(state);
  clearField3(state);
  clearPond(state);

  state.crops[brassica_0].unlocked = true;

  state.g_starttime = util.getTime();
  state.c_starttime = state.g_starttime;
  state.g_lastexporttime = state.g_starttime;
  state.g_lastimporttime = state.g_starttime;
  state.lastFernTime = state.g_starttime;

  computeDerived(state);
  state.seed0 = Math.floor(Math.random() * 281474976710656);
  state.fruit_seed = Math.floor(Math.random() * 281474976710656);
  state.fern_seed = Math.floor(Math.random() * 281474976710656);
  state.present_seed = Math.floor(Math.random() * 281474976710656);

  state.initSquirrelStages();
  state.initEvolutionAndHatImages();

  return state;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function isNextToTree2(x, y, diagonal_ok) {
  var end = diagonal_ok ? 8 : 4;
  for(var dir = 0; dir < end; dir++) { // get the neighbors N,E,S,W,NE,SE,SW,NW
    var x2 = x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
    var y2 = y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
    if(x2 < 0 || x2 >= state.numw2 || y2 < 0 || y2 >= state.numh2) continue;
    var f2 = state.field2[y2][x2];
    if(f2.index == FIELD_TREE_TOP || f2.index == FIELD_TREE_BOTTOM) return true;
  }
  return false;
}

// stats derived from the state. These should not be saved in a savegame. They can be recomputed from the
// state every now and then (e.g. every upgrade)
// this allows getting some stats, such as unlock conditions for upgrades, in a slightly cheaper way than computing it on the fly for every upgrade check
function computeDerived(state) {

  // field
  state.numemptyfields = 0;
  state.numcropfields = 0;
  state.numcropfields_lightning = 0;
  state.numcropfields_permanent = 0;
  state.numfullgrowncropfields = 0;
  state.numfullpermanentcropfields = 0;
  for(var i = 0; i < NUM_CROPTYPES; i++) {
    state.fullgrowncroptypecount[i] = 0;
    state.growingcroptypecount[i] = 0;
    state.croptypecount[i] = 0;
    state.anycroptypecount[i] = 0;
    state.highestoftypeplanted[i] = -Infinity;
    state.highestoftype2planted[i] = -Infinity;
    state.highestcropoftypeplanted[i] = undefined;
    state.highestoftypefullgrown[i] = -Infinity;
    state.highestoftypehad[i] = -Infinity;
    state.lowestoftypeplanted[i] = Infinity;
    state.lowestcropoftypeunlocked[i] = Infinity;
    state.highestoftypeunlocked[i] = -Infinity;
    state.highestoftype2unlocked[i] = -Infinity;
    state.highestcropoftype2unlocked[i] = -Infinity;
    state.highestoftype3unlocked[i] = -Infinity;
    state.highestoftype3had[i] = -Infinity;
    state.highestoftypeknown[i] = -Infinity;
  }
  for(var i = 0; i < NUM_FISHTYPES; i++) {
    state.highestoftypefishunlocked[i] = -Infinity;
    state.highestoftypefishhad[i] = -Infinity;
  }
  state.templatecount = 0;
  state.ghostcount = 0;
  state.ghostcount2 = 0;
  state.numgrowing = 0;
  for(var i = 0; i < registered_crops.length; i++) {
    state.cropcount[registered_crops[i]] = 0;
    state.fullgrowncropcount[registered_crops[i]] = 0;
    state.growingcropcount[registered_crops[i]] = 0;
    var c = crops[registered_crops[i]];
    var c2 = state.crops[registered_crops[i]];
    if(c2.unlocked && c.tier >= 0 && c.tier < state.lowestcropoftypeunlocked[c.type]) state.lowestcropoftypeunlocked[c.type] = c.tier;
  }
  for(var i = 0; i < CROPINDEX; i++) {
    state.specialfieldcount[i] = 0;
  }
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(f.hasCrop()) {
        var c = f.getCrop();
        state.cropcount[c.index]++;
        if(c) {
          state.anycroptypecount[c.type]++;
        }
        if(f.isFullGrown()) {
          state.fullgrowncropcount[c.index]++;
        } else {
          if(c.type != CROPTYPE_BRASSICA && state.challenge != challenge_wither) state.numgrowing++;
        }
        state.growingcropcount[c.index] += Math.min(Math.max(0, f.growth), 1);
        if(f.hasRealCrop()) {
          state.numcropfields++;
          if(cropCanBeHitByLightning(f)) state.numcropfields_lightning++;
          if(c.type != CROPTYPE_BRASSICA) state.numcropfields_permanent++;
          state.croptypecount[c.type]++;
          if(f.isFullGrown()) {
            state.fullgrowncroptypecount[c.type]++;
            state.numfullgrowncropfields++;
            if(c.type != CROPTYPE_BRASSICA) state.numfullpermanentcropfields++;
          }
          state.growingcroptypecount[c.type] += Math.min(Math.max(0, f.growth), 1);
        }
        if((c.tier || 0) > state.highestoftypeplanted[c.type]) state.highestcropoftypeplanted[c.type] = c.index;
        state.highestoftypeplanted[c.type] = Math.max(c.tier || 0, state.highestoftypeplanted[c.type]);
        if(f.growth >= 1) state.highestoftypefullgrown[c.type] = Math.max(c.tier || 0, state.highestoftypefullgrown[c.type]);
        if(!c.isghost) state.lowestoftypeplanted[c.type] = Math.min(c.tier || 0, state.lowestoftypeplanted[c.type]);
        if(c.istemplate) state.templatecount++;
        if(c.isghost) state.ghostcount++;
        if(c.isghost || (c.type == CROPTYPE_BRASSICA && f.growth <= 0)) state.ghostcount2++;
      } else if(f.index == 0 || f.index == FIELD_REMAINDER) {
        state.specialfieldcount[f.index]++;
        state.numemptyfields++;
        if(f.index == FIELD_REMAINDER) state.ghostcount2++;
      } else if(f.index == FIELD_MULTIPART) {
        state.specialfieldcount[f.index]++;
        state.numcropfields++;
      } else {
        state.specialfieldcount[f.index]++;
      }
    }
  }

  // field2
  state.numemptyfields2 = 0;
  state.numcropfields2 = 0;
  state.numfullgrowncropfields2 = 0;
  state.etherealmistletoenexttotree = false;
  for(var i = 0; i < registered_crops2.length; i++) {
    state.crop2count[registered_crops2[i]] = 0;
    state.fullgrowncrop2count[registered_crops2[i]] = 0;
  }
  for(var i = 0; i < CROPINDEX; i++) {
    state.specialfield2count[i] = 0;
  }
  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      f.nexttotree = false;
      if(f.hasCrop()) {
        var c = crops2[f.cropIndex()];
        state.crop2count[c.index]++;
        if(f.hasRealCrop()) {
          state.numcropfields2++;
          if(f.growth >= 1) {
            state.fullgrowncrop2count[c.index]++;
            state.numfullgrowncropfields2++;
          }
        }
        if(c.index == mistletoe2_0) {
          if(isNextToTree2(x, y, etherealMistletoeSupportsTreeDiagonal())) {
            state.etherealmistletoenexttotree = true;
            f.nexttotree = true;
          }
        }
        state.highestoftype2planted[c.type] = Math.max(c.tier || 0, state.highestoftype2planted[c.type]);
      } else if(f.index == 0) {
        state.numemptyfields2++;
      } else {
        state.specialfield2count[f.index]++;
      }
    }
  }

  state.upgrades_unlocked = 0;
  state.upgrades_new = 0;
  state.upgrades_new_b = 0;
  state.upgrades_upgradable = 0;
  state.upgrades_affordable = 0;
  state.upgrades2_unlocked = 0;
  state.upgrades2_new = 0;
  state.upgrades2_upgradable = 0;
  state.upgrades2_affordable = 0;

  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = upgrades[registered_upgrades[i]];
    var u2 = state.upgrades[registered_upgrades[i]];
    if(u2.unlocked) {
      state.upgrades_unlocked++;
      if(!u2.seen && !u2.count) {
        state.upgrades_new++;
        var update_b = true;
        if(u.iscropupgrade && autoUpgradesEnabled()) update_b = false;
        if(u.iscropunlock && autoUnlockEnabled()) update_b = false;
        if(u.isprestige && autoPrestigeEnabled()) update_b = false;
        if(update_b) state.upgrades_new_b++;
      }
      if(!u.isExhausted()) {
        state.upgrades_upgradable++; // same as u.canUpgrade()
        if(u.getCost().le(state.res)) state.upgrades_affordable++;
      }
      if(u.iscropunlock) {
        var c = crops[u.cropid];
        state.highestoftypeknown[c.type] = Math.max(c.tier || 0, state.highestoftypeknown[c.type]);
      }
    }
  }

  for(var i = 0; i < registered_crops.length; i++) {
    var c = crops[registered_crops[i]];
    var c2 = state.crops[registered_crops[i]];
    if(c2.unlocked) {
      state.highestoftypeunlocked[c.type] = Math.max(c.tier || 0, state.highestoftypeunlocked[c.type]);
      state.highestoftypeknown[c.type] = Math.max(c.tier || 0, state.highestoftypeknown[c.type]); // also updated in the registered_upgrades loop above
    }
    if(c2.had > c2.prestige) {
      // c.tier is determined by c2.prestige
      state.highestoftypehad[c.type] = Math.max(c.tier || 0, state.highestoftypehad[c.type]);
    }
  }

  for(var i = 0; i < registered_crops2.length; i++) {
    var c = crops2[registered_crops2[i]];
    var c2 = state.crops2[registered_crops2[i]];
    if(c2.unlocked) {
      if((c.tier || 0) > state.highestoftype2unlocked[c.type]) state.highestcropoftype2unlocked[c.type] = c.index;
      state.highestoftype2unlocked[c.type] = Math.max(c.tier || 0, state.highestoftype2unlocked[c.type]);
    }
  }

  for(var i = 0; i < registered_upgrades2.length; i++) {
    var u = upgrades2[registered_upgrades2[i]];
    var u2 = state.upgrades2[registered_upgrades2[i]];
    if(u2.unlocked) {
      state.upgrades2_unlocked++;
      if(!u2.seen) state.upgrades2_new++;
      if(!u.isExhausted()) {
        state.upgrades2_upgradable++; // same as u2.canUpgrade()
        if(u.getCost().le(state.res)) state.upgrades2_affordable++;
      }
    }
  }

  // field3
  state.numemptyfields3 = 0;
  state.numcropfields3 = 0;
  state.numfullgrowncropfields3 = 0;
  state.infinityboost = Num(0);
  for(var i = 0; i < registered_crops3.length; i++) {
    state.crop3count[registered_crops3[i]] = 0;
    state.fullgrowncrop3count[registered_crops3[i]] = 0;
  }
  for(var i = 0; i < CROPINDEX; i++) {
    state.specialfield3count[i] = 0;
  }
  for(var y = 0; y < state.numh3; y++) {
    for(var x = 0; x < state.numw3; x++) {
      var f = state.field3[y][x];
      if(f.hasCrop()) {
        var c = crops3[f.cropIndex()];
        state.crop3count[c.index]++;
        if(f.hasRealCrop()) {
          state.numcropfields3++;
          if(f.growth >= 1) {
            state.fullgrowncrop3count[c.index]++;
            state.numfullgrowncropfields3++;
          }
        }
        state.infinityboost.addInPlace(c.getBasicBoost(f));
      } else if(f.index == 0 || f.index == FIELD_REMAINDER) {
        state.specialfield3count[f.index]++;
        state.numemptyfields3++;
      } else {
        state.specialfield3count[f.index]++;
      }
    }
  }

  for(var i = 0; i < registered_crops3.length; i++) {
    var c = crops3[registered_crops3[i]];
    var c2 = state.crops3[registered_crops3[i]];
    if(c2.unlocked) {
      state.highestoftype3unlocked[c.type] = Math.max(c.tier || 0, state.highestoftype3unlocked[c.type]);
    }
    if(c2.had) {
      state.highestoftype3had[c.type] = Math.max(c.tier || 0, state.highestoftype3had[c.type]);
    }
  }

  // pond
  state.numfishes = 0;
  for(var i = 0; i < registered_fishes.length; i++) {
    state.fishcount[registered_fishes[i]] = 0;
  }
  for(var y = 0; y < state.pondh; y++) {
    for(var x = 0; x < state.pondw; x++) {
      var f = state.pond[y][x];
      if(f.hasCrop()) {
        var c = fishes[f.cropIndex()];
        state.fishcount[c.index]++;
        state.numfishes++;
      }
    }
  }

  for(var i = 0; i < registered_fishes.length; i++) {
    var c = fishes[registered_fishes[i]];
    var c2 = state.fishes[registered_fishes[i]];
    if(c2.unlocked) {
      state.highestoftypefishunlocked[c.type] = Math.max(c.tier || 0, state.highestoftypefishunlocked[c.type]);
    }
    if(c2.had) {
      state.highestoftypefishhad[c.type] = Math.max(c.tier || 0, state.highestoftypefishhad[c.type]);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  state.medals_earned = 0;
  state.medals_new = 0;

  state.medal_prodmul = Num(1); // global medal production multiplier

  for(var i = 0; i < registered_medals.length; i++) {
    var m = medals[registered_medals[i]];
    var m2 = state.medals[registered_medals[i]];
    if(m2.earned) {
      state.medals_earned++;
      if(!m2.seen) state.medals_new++;
      state.medal_prodmul.addrInPlace(m.prodmul);
    }
  }

  state.squirrel_upgrades_count = 0;
  for(var i = 0; i < registered_squirrel_upgrades.length; i++) {
    // var u = squirrel_upgrades[registered_squirrel_upgrades[i]];
    var u2 = state.squirrel_upgrades[registered_squirrel_upgrades[i]];
    state.squirrel_upgrades_count += u2.count;
  }

  var stages = squirrel_stages[state.squirrel_evolution];

  state.highest_gated_index = 0;
  state.highest_gated_index2 = 0;
  for(var i = 0; i < stages.length; i++) {
    if(i >= state.squirrel_stages.length) break;
    var bought = false;
    if(state.squirrel_stages[i].num[0] > 0 && state.squirrel_stages[i].num[0] >= stages[i].upgrades0.length) bought = true;
    if(state.squirrel_stages[i].num[1] > 0 && state.squirrel_stages[i].num[1] >= stages[i].upgrades1.length) bought = true;
    if(state.squirrel_stages[i].num[2] > 0 && state.squirrel_stages[i].num[2] >= stages[i].upgrades2.length) bought = true;
    if(bought) {
      state.highest_gated_index = Math.max(state.highest_gated_index, stages[i].gated_index);
      state.highest_gated_index2 = Math.max(state.highest_gated_index2, stages[i].gated_index2);
    }
  }

  state.allsquirrelupgradebought = true;
  for(var i = 0; i < stages.length; i++) {
    if(i >= state.squirrel_stages.length) {
      state.allsquirrelupgradebought = false;
      break;
    }
    if(state.squirrel_stages[i].num[0] < stages[i].upgrades0.length) state.allsquirrelupgradebought = false;
    if(state.squirrel_stages[i].num[1] < stages[i].upgrades1.length) state.allsquirrelupgradebought = false;
    if(state.squirrel_stages[i].num[2] < stages[i].upgrades2.length) state.allsquirrelupgradebought = false;
    if(!state.allsquirrelupgradebought) break;
  }
  state.allsquirrelupgradebought2 = state.allsquirrelupgradebought;
  if(state.squirrel_evolution == 0 && state.squirrel_upgrades_count == 33) state.allsquirrelupgradebought2 = true;

  //////////////////////////////////////////////////////////////////////////////

  state.ethereal_berry_bonus = Num(0);
  state.ethereal_mush_bonus = Num(0);
  state.ethereal_flower_bonus = Num(0);
  state.ethereal_nettle_bonus = Num(0);
  state.ethereal_bee_bonus = Num(0);
  state.ethereal_brassica_bonus = Num(0);

  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      var c = f.getCrop();
      if(!!c /*&& f.isFullGrown()*/) {
        var type = c.type;
        if(type == CROPTYPE_BERRY) {
          state.ethereal_berry_bonus.addInPlace(c.getBasicBoost(f));
        }
        if(type == CROPTYPE_MUSH) {
          state.ethereal_mush_bonus.addInPlace(c.getBasicBoost(f));
        }
        if(type == CROPTYPE_FLOWER) {
          state.ethereal_flower_bonus.addInPlace(c.getBasicBoost(f));
        }
        if(type == CROPTYPE_STINGING) {
          state.ethereal_nettle_bonus.addInPlace(c.getBasicBoost(f));
        }
        if(type == CROPTYPE_BEE) {
          state.ethereal_bee_bonus.addInPlace(c.getBasicBoost(f));
        }
        if(type == CROPTYPE_BRASSICA) {
          state.ethereal_brassica_bonus.addInPlace(c.getBasicBoost(f));
        }
      }
    }
  }
  //////////////////////////////////////////////////////////////////////////////

  for(var i = 0; i < state.fruit_stored.length; i++) state.fruit_stored[i].slot = i;
  for(var i = 0; i < state.fruit_sacr.length; i++) state.fruit_sacr[i].slot = i + 100;

  //////////////////////////////////////////////////////////////////////////////

  state.challenges_unlocked = 0;
  state.challenges_completed = 0;
  state.challenges_completed2 = 0;
  state.challenges_completed3 = 0;
  state.challenge_multiplier = Num(1);
  state.untriedchallenges = 0;
  for(var i = 0; i < registered_challenges.length; i++) {
    var index = registered_challenges[i];
    var c = challenges[index];
    var c2 = state.challenges[index];
    if(c2.unlocked) state.challenges_unlocked++;
    if(c2.completed) {
      state.challenges_completed++;
      if(c.fullyCompleted()) state.challenges_completed2++;
      state.challenges_completed3 += c2.completed;
    }
    if(c2.unlocked && c2.num == 0 && state.challenge != c.index) {
      state.untriedchallenges++;
    }
    if(c2.maxlevel > 0) {
      // when updating the code of this challenge bonus computation, also update totalChallengeBonusIncludingCurrentRun to match!
      if(c.cycling) {
        // within a cycling challenge, the bonuses are additive
        var multiplier = Num(1);
        for(var j = 0; j < c.cycling; j++) {
          multiplier.addInPlace(getChallengeBonus(index, c2.maxlevels[j], c.cycleCompleted(j, false), j));
        }
        state.challenge_multiplier.mulInPlace(multiplier);
      } else {
        state.challenge_multiplier.mulInPlace(getChallengeMultiplier(index, c2.maxlevel, c2.completed));
      }
    }
  }

  // blueprints
  state.numnonemptyblueprints = 0;
  for(var i = 0; i < state.blueprints.length; i++) {
    var b = state.blueprints[i];
    if(b.numw && b.numh) state.numnonemptyblueprints++;
  }

  // fish effects
  if(state.min_fish_resinmul.eqr(-1)) {
    state.min_fish_resinmul = fishResin(state, true);
  } else {
    state.min_fish_resinmul = Num.min(state.min_fish_resinmul, fishResin(state, true));
  }
  if(state.min_fish_twigsmul.eqr(-1)) {
    state.min_fish_twigsmul = fishTwigs(state, true);
  } else {
    state.min_fish_twigsmul = Num.min(state.min_fish_twigsmul, fishTwigs(state, true));
  }
}

////////////////////////////////////////////////////////////////////////////////

function Fruit() {
  // type 0: apple, no seasonality
  // type 1: apricot, spring
  // type 2: pineapple, summer
  // type 3: pear, autumn
  // type 4: medlar, winter
  // type 5: mango, spring+summer
  // type 6: plum, summer+autumn
  // type 7: quince, autumn+winter
  // type 8: kumquat, winter+spring
  // type 9: starfruit, all-season
  // type 10: dragonfruit, all-season improved
  this.type = 0;
  this.tier = 0;
  this.abilities = []; // array of the FRUIT_... abilities

  // how much the abilities have been leveled
  // must be at least 1 for any ability, 0 is equivalent to not having the ability at all.
  this.levels = [];

  // free starting level of each ability
  this.starting_levels = [];

  // for fused fruits: charge of each ability. 0: normal, 1: charged, 2: transferable
  this.charge = [];

  // how many fuse-fruit actions were involved in this fruit
  this.fuses = 0;

  this.essence = Num(0); // how much essence was already spent on upgrading this fruit

  this.mark = 0; // mark as favorite etc...

  // the slot in which this fruit is: 0 for the active slot, 10+ storage slots, and 100+ for sacrificial slots
  // not saved, this must be updated to match the slot the fruit is placed in, this is cache for fast reverse lookup only
  this.slot = 0;

  // override standard name like 'electrum apple' with custom name
  this.name = '';

  this.justdropped = true; // if true, the fruit was just dropped this run. Set to false for all existing fruits when transcending

  this.typeName = function() {
    return ['apple', 'apricot (spring)', 'pineapple (summer)', 'pear (autumn)', 'medlar (winter)',
            'mango (spring+summer)', 'plum (summer+autumn)', 'quince (autumn+winter)', 'kumquat (winter+spring)',
            'star fruit (4 seasons)', 'dragon fruit (4 seasons)'][this.type];
  };

  this.origName = function() {
    return tierNames[this.tier] + ' ' + this.typeName();
  };

  this.toString = function() {
    if(this.name) return this.name;
    return this.origName();
  };

  this.abilityToString = function(i, opt_abbreviated, opt_nolevels, opt_highlightcharge) {
    var result = '';
    result += getFruitAbilityName(this.abilities[i], opt_abbreviated);
    if(this.abilities[i] != FRUIT_NONE) {
      if(!opt_nolevels && !isInherentAbility(this.abilities[i])) result += ' ' + toRomanUpTo(this.levels[i]);
      if(!opt_nolevels && this.charge[i]) {
        if(opt_highlightcharge) result += '<b>';
        if(this.charge[i] == 1) result += ' [*]';
        if(this.charge[i] == 2) result += ' [**]';
        if(opt_highlightcharge) result += '</b>';
      }
    }
    return result;
  };

  this.abilitiesToString = function(opt_abbreviated, opt_nolevels) {
    var result = '';
    for(var i = 0; i < this.abilities.length; i++) {
      if(i > 0) result += ', ';
      result += this.abilityToString(i, opt_abbreviated, opt_nolevels);
    }
    return result;
  };
}

function getActiveFruit() {
  if(state.fruit_active < 0 || state.fruit_active >= state.fruit_stored.length) return undefined;
  return state.fruit_stored[state.fruit_active];
}

// returns the level of a specific fruit ability, or 0 if you don't have that ability
// opt_basic: if true, takes state of basic challenge into account
function getFruitAbilityFor(f, ability, opt_basic) {
  if(!f) return 0;
  if(opt_basic && basicChallenge() == 2) return 0;
  for(var i = 0; i < f.abilities.length; i++) {
    if(f.abilities[i] == ability) {
      var result = f.levels[i];
      if(opt_basic && basicChallenge()) {
        if(result > 3) result = 3;
      }
      return result;
    }
  }

  return 0;
}

// returns the level of a specific fruit ability, or 0 if you don't have that ability
// opt_basic: if true, takes state of basic challenge into account
function getFruitAbility(ability, opt_basic) {
  return getFruitAbilityFor(getActiveFruit(), ability, opt_basic);
}

// similar to getFruitAbility but conveniently takes multi-season fruits into account
// will check FRUIT_SUMMER_AUTUMN etc... if given just FRUIT_SUMMER or FRUIT_AUTUMN etc..., if the necessary squirrel upgrades are purchased
// returns array of level and actual ability. Actual ability is usually same as the input ability, but can be e.g. FRUIT_SPRING_SUMMER if input was FRUIT_SPRING but fruit has FRUIT_SPRING_SUMMER
// opt_basic: if true, takes state of basic challenge into account
function getFruitAbility_MultiSeasonal(ability, opt_basic) {
  if(opt_basic && basicChallenge() == 2) return 0;

  var result = getFruitAbility(ability, opt_basic);
  if(result > 0) return [result, ability];

  var f = getActiveFruit();
  if(!f) return [0, ability];

  // this assumes the seasonal ability is listed last, as it indeed is
  var last = f.abilities[f.abilities.length - 1];

  if(last < FRUIT_SPRING_SUMMER || last > FRUIT_ALL_SEASON2) return [0, ability]; // fruit is not a multi-season fruit.
  if(!haveFruitMix(1)) return [0, ability]; // squirrel upgrade not active
  if(last >= FRUIT_ALL_SEASON2 && !haveFruitMix(3)) last = FRUIT_ALL_SEASON; // squirrel upgrade not active for dragon fruit, but try if it still works as star fruit instead
  if(last >= FRUIT_ALL_SEASON && !haveFruitMix(2)) return [0, ability]; // squirrel upgrade not active

  if(ability >= FRUIT_SPRING && ability <= FRUIT_WINTER) {
    if(last == FRUIT_ALL_SEASON2) return [1, last];
    if(last == FRUIT_ALL_SEASON) return [1, last];
    if(last == FRUIT_SPRING_SUMMER) return [(ability == FRUIT_SPRING || ability == FRUIT_SUMMER) ? 1 : 0, last];
    if(last == FRUIT_SUMMER_AUTUMN) return [(ability == FRUIT_SUMMER || ability == FRUIT_AUTUMN) ? 1 : 0, last];
    if(last == FRUIT_AUTUMN_WINTER) return [(ability == FRUIT_AUTUMN || ability == FRUIT_WINTER) ? 1 : 0, last];
    if(last == FRUIT_WINTER_SPRING) return [(ability == FRUIT_WINTER || ability == FRUIT_SPRING) ? 1 : 0, last];
  }

  if(opt_basic && !!basicChallenge() && ability > 2) ability = 2;

  return [0, ability];
}

// opt_basic: if 1 or 2, returns the reduced/disabled value for basic challenge
function getFruitTier(opt_basic) {
  if(opt_basic && basicChallenge() == 2) return 0; // return lowest tier, in fact fruits are completely disabled during the truly basic challenge
  var f = getActiveFruit();
  if(!f) return 0;
  if(opt_basic && basicChallenge()) {
    // max the fruit that could drop at the current tree level, during the basic challenge
    var max = getNewFruitTier(1.0, state.treelevel, false);
    var result = f.tier;
    if(result > max) result = max;
    return result;
  }


  return f.tier;
}

// slot is 0..99 for stored, 100+ for sacrificial pool
// returns undefined if no fruit in that slot
function getFruit(slot) {
  if(slot < 100) {
    return state.fruit_stored[slot];
  }
  return state.fruit_sacr[slot - 100];
}

// set f to something falsy to unset the fruit
// will shift/resize arrays to fit the updated collection
// does not support inserting a fruit in the middle, use insertFruit for that
// TODO: use insertFruit for everything that currently uses this
function setOrAppendFruit(slot, f) {
  if(slot < 100) {
    var j = slot;
    if(f) {
      if(j > state.fruit_stored.length) j = state.fruit_stored.length;
      state.fruit_stored[j] = f;
      f.slot = j;
    } else {
      for(var i = j; i + 1 < state.fruit_stored.length; i++) {
        state.fruit_stored[i] = state.fruit_stored[i + 1];
        state.fruit_stored[i].slot = i;
      }
      state.fruit_stored.length = state.fruit_stored.length - 1;
    }
  } else {
    var j = slot - 100;
    if(f) {
      if(j > state.fruit_sacr.length) j = state.fruit_sacr.length;
      state.fruit_sacr[j] = f;
      f.slot = j + 100;
    } else {
      for(var i = j; i + 1 < state.fruit_sacr.length; i++) {
        state.fruit_sacr[i] = state.fruit_sacr[i + 1];
        state.fruit_sacr[i].slot = i + 100;
      }
      state.fruit_sacr.length = state.fruit_sacr.length - 1;
    }
  }
}

// slot < 100 means in storage pool, >= means sacrificial
// use insertFruit(100, fruit) to insert it at beginning of sacrificial pool, insertFruit(100 + state.fruit_sacr.length, fruit) to insert it at end
function insertFruit(slot, f) {
  if(slot < 100) {
    var j = slot;
    if(f) {
      if(j > state.fruit_stored.length) j = state.fruit_stored.length;
      if(j < state.fruit_stored.length) {
        for(var i = state.fruit_stored.length; i > j; i--) {
          state.fruit_stored[i] = state.fruit_stored[i - 1];
          state.fruit_stored[i].slot = i;
        }
      }
      state.fruit_stored[j] = f;
      f.slot = j;
    } else {
      for(var i = j; i + 1 < state.fruit_stored.length; i++) {
        state.fruit_stored[i] = state.fruit_stored[i + 1];
        state.fruit_stored[i].slot = i;
      }
      state.fruit_stored.length = state.fruit_stored.length - 1;
    }
  } else {
    var j = slot - 100;
    if(f) {
      if(j > state.fruit_sacr.length) j = state.fruit_sacr.length;
      if(j < state.fruit_sacr.length) {
        for(var i = state.fruit_sacr.length; i > j; i--) {
          state.fruit_sacr[i] = state.fruit_sacr[i - 1];
          state.fruit_sacr[i].slot = i + 100;
        }
      }
      state.fruit_sacr[j] = f;
      f.slot = j + 100;
    } else {
      for(var i = j; i + 1 < state.fruit_sacr.length; i++) {
        state.fruit_sacr[i] = state.fruit_sacr[i + 1];
        state.fruit_sacr[i].slot = i + 100;
      }
      state.fruit_sacr.length = state.fruit_sacr.length - 1;
    }
  }
}

// sets fruit directly to this slot, without any checks for empty gaps or shfiting. f must be valid object, not null
function setFruit(slot, f) {
  if(slot < 100) state.fruit_stored[slot] = f;
  else state.fruit_sacr[slot - 100] = f;
  f.slot = slot;
}

function swapFruit(slot0, slot1) {
  var f0 = getFruit(slot0);
  var f1 = getFruit(slot1);
  setFruit(slot0, f1);
  setFruit(slot1, f0);
}

// implementation must be kept in sync with getUpcomingFruitEssence w.r.t bonuses (like squirrel) as these functions do not call each other
// this one is for a single fruit, used for when recovering a fruit to subtract the resin again
function getUpcomingFruitEssenceFor(f) {
  var res = getFruitSacrifice(f);

  if(state.squirrel_upgrades[upgradesq_essence].count) {
    var bonus = upgradesq_essence_bonus.addr(1);
    res.mulInPlace(bonus);
  }

  return res;
}

// implementation must be kept in sync with getUpcomingFruitEssenceFor w.r.t bonuses (like squirrel) as these functions do not call each other
// this one is for all fruits on transcend
function getUpcomingFruitEssence(breakdown) {
  var res = Res();
  for(var j = 0; j < state.fruit_sacr.length; j++) res.addInPlace(getFruitSacrifice(state.fruit_sacr[j]));
  if(breakdown) breakdown.push(['sacrificial fruits', true, Num(0), res.clone()]);

  if(state.squirrel_upgrades[upgradesq_essence].count) {
    var bonus = upgradesq_essence_bonus.addr(1);
    res.mulInPlace(bonus);
    if(breakdown) breakdown.push(['squirrel upgrade', true, bonus, res.clone()]);
  }

  return res;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// also applies to twigs
function getEarlyResinPenalty() {
  var itime = 600;
  if(state.c_runtime < itime) {
    var f = state.c_runtime / itime;
    var result = Math.pow(0.1, 1 - f);
    if(result > 1) result = 1;
    if(result < 0) result = 0;
    return result;
  }
  return 1;
}

// get upcoming resin, excluding that from ferns
// see also the function: treeLevelResin
function getUpcomingResin() {
  var suppress = false; // more resin suppressed by challenge
  if(state.challenge && !challenges[state.challenge].allowsresin) suppress = true;
  if(state.challenge && state.treelevel > state.g_treelevel && !state.challenge.allowbeyondhighestlevel) suppress = true;

  var result = Num(state.resin);
  if(state.treelevel >= min_transcension_level && !suppress) {
    var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
    if(progress.gtr(1)) progress = Num(1);
    if(progress.ltr(0)) progress = Num(0);
    progress = progress.mulr(0.97); // make leveling cause a slight jump anyway, mostly such that the resin/hr stat will be higher after rather than before the leveling
    var next = nextTreeLevelResin();
    result.addInPlace(progress.mul(next));
  }

  result.mulrInPlace(getEarlyResinPenalty());

  return result;
}

function getUpcomingResinIncludingFerns() {
  return getUpcomingResin().add(state.fernresin.resin);
}

// get upcoming twigs
// see also the function: nextTwigs
function getUpcomingTwigs() {
  var suppress = false; // more twigs suppressed by challenge
  if(state.challenge && !challenges[state.challenge].allowstwigs) suppress = true;
  if(state.challenge && state.treelevel > state.g_treelevel && !state.challenge.allowbeyondhighestlevel) suppress = true;

  var result = Num(state.twigs);
  if(state.treelevel >= min_transcension_level && !suppress) {
    var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
    if(progress.gtr(1)) progress = Num(1);
    if(progress.ltr(0)) progress = Num(0);
    progress = progress.mulr(0.97); // make leveling cause a slight jump anyway, mostly such that the twigs/hr stat will be higher after rather than before the leveling
    var next = nextTwigs().twigs;
    result.addInPlace(progress.mul(next));
  }

  result.mulrInPlace(getEarlyResinPenalty());

  return result;
}

// returns resin per hour so far this run
// excludes resin gotten from ferns
function getResinHour() {
  if(state.c_runtime < 2) return Num(0); // don't count the first seconds to avoid possible huge values
  var hours = state.c_runtime / 3600;
  if(!hours) return Num(0);
  return getUpcomingResin().divr(hours);
}

function getPrevResinHour() {
  if(state.p_runtime < 2) return Num(0); // don't count the first seconds to avoid possible huge values
  var hours = state.p_runtime / 3600;
  if(!hours) return Num(0);
  return state.p_res_no_ferns.divr(hours);
}

// returns twigs per hour so far this run
function getTwigsHour() {
  if(state.c_runtime < 2) return Num(0); // don't count the first seconds to avoid possible huge values
  var hours = state.c_runtime / 3600;
  if(!hours) return Num(0);
  return getUpcomingTwigs().divr(hours);
}

function getPrevTwigsHour() {
  if(state.p_runtime < 2) return Num(0); // don't count the first seconds to avoid possible huge values
  var hours = state.p_runtime / 3600;
  if(!hours) return Num(0);
  return state.p_res.twigs.divr(hours);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// for UI invalidation, ...
function getNumberFormatCode() {
  return Num.precision * 300 + Num.notation * 3 + state.roman;
}

// to roman numeral, but only up to 12 if the roman numerals option is disabled in the state.
// Can only be used when the state is already initialized
var toRomanUpTo = function(v) {
  if(state.roman == 2) return v.toString();
  if(state.roman == 0 && v > 12) return v.toString();
  return util.toRoman(v);
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// opt_state: if given, uses this state instead of the global state
function automatonUnlocked(opt_state) {
  var s = opt_state || state;
  return s.crops2[automaton2_0].unlocked;
}

// have the automaton planted in the ethereal field (irrespective of unlocks, ...)
function haveAutomaton() {
  return !!state.crop2count[automaton2_0];
}

function automatonEnabled() {
  return haveAutomaton() && state.automaton_enabled && basicChallenge() != 2;
}

function autoChoiceUnlocked() {
  if(!automatonUnlocked()) return false;
  if(!state.challenges[challenge_noupgrades].completed) return false;
  return true;
}

function autoChoiceEnabled() {
  if(!automatonEnabled()) return false;
  if(!autoChoiceUnlocked()) return false;
  return !!state.automaton_autochoice;
}

function autoUpgradesUnlocked() {
  if(!automatonUnlocked()) return false;
  if(!state.challenges[challenge_noupgrades].completed) return false;
  return true;
}

function autoUpgradesEnabled() {
  if(!automatonEnabled()) return false;
  if(!autoUpgradesUnlocked()) return false;
  return !!state.automaton_autoupgrade;
}

// extra finetuning options for costs in auto-upgrades and auto-plant
function autoFinetuningUnlocked() {
  if(!automatonUnlocked()) return false;
  if(state.challenges[challenge_noupgrades].completed <= 1) return false;
  return true;
}

function autoPlantUnlocked() {
  if(!automatonUnlocked()) return false;
  return true; // auto-plant is enabled as soon as you have automaton, since v0.5.0
}

function autoPlantEnabled() {
  if(!automatonEnabled()) return false;
  if(!autoPlantUnlocked()) return false;
  return !!state.automaton_autoplant;
}

function autoUnlockUnlocked() {
  if(!automatonUnlocked()) return false;
  if(!state.challenges[challenge_blackberry].completed) return false;
  return true;
}

function autoUnlockEnabled() {
  if(!automatonEnabled()) return false;
  if(!autoUnlockUnlocked()) return false;
  if(!autoPlantEnabled()) return false; // auto unlock also gets disabled when auto plant is disabled
  return !!state.automaton_autounlock;
}

// opt_state: if given, uses this state instead of the global state
function autoActionUnlocked(opt_state) {
  var s = opt_state || state;
  if(!automatonUnlocked(opt_state)) return false;
  if(!s.challenges[challenge_wither].completed) return false;
  if(s.treelevel2 < 5) return false; // normally this check is not needed, but wither challenge changed to become the challenge unlocking this and became a higher level challenge, do not yet unlock the new feature if wither was finished earlier at the now too early ethereal tree level
  return true;
}

// returns amount of auto-actions that are unlocked, including the begin-of-run-only one if that one is unlocked
// opt_state: if given, uses this state instead of the global state
function numAutoActionsUnlocked(opt_state) {
  var s = opt_state || state;
  if(!autoActionUnlocked(opt_state)) return 0;
  // stages of the wither challenge that give extra auto-actions
  if(s.challenges[challenge_wither].completed >= 7) return 4; // this is the one that can only be used at start of run, not a full fledged one
  if(s.challenges[challenge_wither].completed >= 5) return 3;
  if(s.challenges[challenge_wither].completed >= 3) return 2;
  return 1;
}

function haveBeginOfRunAutoAction(opt_state) {
  var s = opt_state || state;
  return s.challenges[challenge_wither].completed >= 7;
}

function autoActionEnabled() {
  if(!automatonEnabled()) return false;
  if(!autoActionUnlocked()) return false;
  return state.automaton_autoaction == 1;
}

function autoPrestigeUnlocked() {
  if(!automatonUnlocked()) return false;
  if(!state.challenges[challenge_truly_basic].completed) return false;
  return true;
}

// whether the extra auto-actions, that is weather, refresh brassica and fern, are unlocked
function autoActionExtraUnlocked() {
  return autoActionUnlocked() && state.challenges[challenge_wither].completed >= 4;
}

// whether more extra auto-actions, that is ethereal blueprint, are unlocked
function autoActionExtra2Unlocked() {
  return autoActionUnlocked() && state.challenges[challenge_wither].completed >= 6;
}

function autoPrestigeEnabled() {
  if(!automatonEnabled()) return false;
  if(!autoPrestigeUnlocked()) return false;
  if(!autoPlantEnabled()) return false; // auto prestige also gets disabled when auto plant is disabled
  if(!state.automaton_autounlock) return false; // auto prestige also gets disabled when auto-unlock is disabled
  return !!state.automaton_autoprestige;
}

function getEtherealAutomatonNeighborBoost() {
  var result = Num(automatonboost);
  result.addInPlace(upgradesq_automaton_boost.mulr(state.squirrel_upgrades[upgradesq_automaton].count));
  result.addInPlace(upgradesq_automaton_boost2.mulr(state.squirrel_upgrades[upgradesq_automaton2].count));
  return result;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// have the squirrel planted in the ethereal field (irrespective of unlocks, ...)
function haveSquirrel() {
  return !!state.crop2count[squirrel2_0];
}

// have the ability to place squirrel, the upgrade unlocked
function squirrelUnlocked() {
  return !!state.upgrades2[upgrade2_squirrel].count;
}

// opt_replacing: set to true if this crop replaces an existing non-template (aka real) nuts crop
function tooManyNutsPlants(opt_replacing) {
  // Reason for this limitation: the intention of nut plants is to have an extra resource alongside an otherwise normal resin and twigs generating field, and make it more fun to do a deeper push with such a field by having the highly exponentially growing nuts resource
  // however it's not the intention to encourage planting the entire field full of nuts and nothing else
  return (state.croptypecount[CROPTYPE_NUT] - (opt_replacing ? 1 : 0)) > 0;
}

function getEtherealSquirrelNeighborBoost() {
  var result = Num(squirrelboost);
  result.addInPlace(upgradesq_squirrel_boost.mulr(state.squirrel_upgrades[upgradesq_squirrel].count));
  result.addInPlace(upgradesq_squirrel_boost2.mulr(state.squirrel_upgrades[upgradesq_squirrel2].count));
  return result;
}

/*
return value:
0=bought
1=buyable now (if got the resources)
2=gated (would be buyable if not for that)
3=not buyable but next up
4=not buyable but next-next up (the last type of which the name is revealed)
5=not buyable and after next-next-up

si = stage index
b = branch
d = depth in branch
*/
function squirrelUpgradeBuyable(si, b, d) {
  var stages = squirrel_stages[state.squirrel_evolution];
  var s = stages[si]; // the stage, as SquirrelStage object
  var s2 = state.squirrel_stages[si]; // SquirrelStageState object
  // how many non-bought ones in the center branch of the previous stages, when going up one by one until we reach the bought one or the root (capped at 3)
  var above = 0;
  var u = s.index - 1;
  for(;;) {
    if(u < 0) break;
    var p = stages[u];
    var p2 = state.squirrel_stages[u];
    var numfree = p.upgrades1.length - p2.num[1];
    above += numfree;
    if(above >= 3) {
      above = 3; // more than 3 not needed to be known, and above loop can break early once reached to avoid being too slow
      break;
    }
    u--;
  }


  // whether this stage is one in which you can buy upgrades, that is when all upgrades from the center track of the previous stage are bought
  var avail = (above == 0);

  if(avail && d < s2.num[b]) return 0; // bought
  if(avail && d == s2.num[b]) {
    // buyable, unless gated
    if(s.gated) {
      if(state.squirrel_upgrades_count < s.num_above) return 2; // gated
    }
    return 1; // buyable
  }

  if(avail && d == s2.num[b] && s.gated) return 2; // gated
  if(avail && d == s2.num[b]) return 1; // buyable


  var prev_canbuy = (above == 1); // last one of previous stage is in state "can buy" or "gated"
  if((avail && d == s2.num[b] + 1) || (prev_canbuy && d == 0)) return 3; // one that's 1 spot after canbuy


  var prev_next = (above == 2); // last one of previous stage is in state "next" (i.e. after "canbuy")
  if((avail && d == s2.num[b] + 2) || (prev_canbuy && d == 1) || (prev_next && d == 0)) return 4; // one that's 2 spots after canbuy
  return 5; // one or more further than next, can't buy, and can't see the name either
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function etherealMistletoeUnlocked() {
  return state.crops2[mistletoe2_0].unlocked;
}

// includes in invalid location (not next to tree)
function haveEtherealMistletoeAnywhere() {
  return !!state.crop2count[mistletoe2_0];
}

// have ethereal mistletoe with valid placement
function haveEtherealMistletoe() {
  return state.etherealmistletoenexttotree;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function amberUnlocked() {
  return state.g_res.amber.neqr(0);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// whether the fishes feature is unlocked (once having infinity spores)
function haveFishes(opt_state) {
  if(!opt_state) opt_state = state;
  return opt_state.g_res.infspores.neqr(0);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function presentGrowSpeedTimeRemaining() {
  return state.present_grow_speed_time + 15 * 60 - state.time;
}

function presentGrowSpeedActive() {
  if(!(holidayEventActive() & 3)) return false;
  if(basicChallenge()) return false;
  return presentGrowSpeedTimeRemaining() > 0;
}

function presentProductionBoostTimeRemaining() {
  return state.present_production_boost_time + 15 * 60 - state.time;
}

function presentProductionBoostActive() {
  if(!(holidayEventActive() & 3)) return false;
  if(basicChallenge()) return false;
  return presentProductionBoostTimeRemaining() > 0;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function treeGestureBonus(opt_adjust_upgrade, opt_adjust_tree) {
  var num = state.upgrades2[upgrade2_highest_level].count;

  if(opt_adjust_upgrade) num += opt_adjust_upgrade;

  if(!num) return new Num(1);

  var level = state.g_treelevel;

  if(opt_adjust_tree) level += opt_adjust_tree;

  return upgrade2_highest_level_bonus.add(upgrade2_highest_level_bonus2.mulr(num - 1)).addr(1).powr(level);
}


////////////////////////////////////////////////////////////////////////////////

// returns index of the highest unlocked brassica crop, or -1 if none (which normally doesn't happen, normally at least watercress is unlocked, except possibly during some challenges)
function getHighestBrassica() {
  if(!state) return brassica_0;
  var cropindex = brassica_0 + state.highestoftypeunlocked[CROPTYPE_BRASSICA];
  if(!crops[cropindex]) return -1;
  return cropindex;
}

// returns index of the highest unlocked brassica for infinity field. Always returns a valid, brassica3_0 if nothing else is possible
function getHighestBrassica3() {
  if(!state) return brassica3_0;
  var cropindex = brassica3_0 + state.highestoftype3unlocked[CROPTYPE_BRASSICA];
  if(!crops3[cropindex]) return brassica3_0;
  return cropindex;
}

// highest had, rather than unlocked
function getHighestBrassica3Had() {
  if(!state) return brassica3_0;
  var cropindex = brassica3_0 + state.highestoftype3had[CROPTYPE_BRASSICA];
  if(!crops3[cropindex]) return brassica3_0;
  return cropindex;
}

// returns index of the highest unlocked brassica that you can afford for infinity field. Always returns a valid, brassica3_0 if nothing else is possible, even if this one cannot be afforded
function getHighestAffordableBrassica3() {
  var result = getHighestBrassica3();
  if(result > brassica3_0 && state.res.lt(crops3[result].getCost())) result--;
  if(result > brassica3_0 && state.res.lt(crops3[result].getCost())) result--;
  // no need to do this more times, two tiers down of brassica should be negligable
  return result;
}

