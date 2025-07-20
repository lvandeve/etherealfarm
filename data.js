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

// The game data: definition of upgrades, crops, ...

var seasonNames = ['spring', 'summer', 'autumn', 'winter',
                   'ethereal', 'infernal', 'infinity'];

var croptype_index = 0;
var CROPTYPE_BERRY = croptype_index++;
var CROPTYPE_MUSH = croptype_index++;
var CROPTYPE_FLOWER = croptype_index++;
var CROPTYPE_STINGING = croptype_index++; // stinging plants such as nettle and thistle
var CROPTYPE_BRASSICA = croptype_index++; // watercress, wasabi, etc...
var CROPTYPE_AUTOMATON = croptype_index++;
var CROPTYPE_LOTUS = croptype_index++; // ethereal field only, this is an ethereal crop that boost their ethereal neighbors, so a flower type, but regular flowers in ethereal field boost the basic field flowers instead
var CROPTYPE_MISTLETOE = croptype_index++;
var CROPTYPE_BEE = croptype_index++; // boosts flowers
var CROPTYPE_CHALLENGE = croptype_index++; // only exists for challenges
var CROPTYPE_FERN = croptype_index++; // ethereal fern, giving starter money. in infinity field, copies everything
var CROPTYPE_SQUIRREL = croptype_index++;
var CROPTYPE_NUT = croptype_index++;
var CROPTYPE_PUMPKIN = croptype_index++; // halloween pumpkin
var CROPTYPE_RUNESTONE = croptype_index++;
var NUM_CROPTYPES = croptype_index;

// for prestige
var num_tiers_per_crop_type = [];
num_tiers_per_crop_type[CROPTYPE_BERRY] = 16;
num_tiers_per_crop_type[CROPTYPE_MUSH] = 8;
num_tiers_per_crop_type[CROPTYPE_FLOWER] = 8;
num_tiers_per_crop_type[CROPTYPE_NUT] = 16;

//var etherealDeleteSessionTime = 60; // how long time to delete/replace more ethereal crops after deleting one for this session
//var etherealDeleteStartTime = 1800; // how long it's free to delete/replant without being considered a "session" at the start of a run
//var etherealDeleteWaitTime = 7200; // how long to wait til next ethereal deletion session once this one is over

function getCropTypeName(type) {
  if(type == CROPTYPE_BERRY) return 'berry';
  if(type == CROPTYPE_MUSH) return 'mushroom';
  if(type == CROPTYPE_FLOWER) return 'flower';
  if(type == CROPTYPE_STINGING) return 'stinging';
  if(type == CROPTYPE_BRASSICA) return 'brassica';
  if(type == CROPTYPE_AUTOMATON) return 'automaton';
  if(type == CROPTYPE_LOTUS) return 'lotus';
  if(type == CROPTYPE_MISTLETOE) return 'mistletoe';
  if(type == CROPTYPE_BEE) return 'bee';
  if(type == CROPTYPE_CHALLENGE) return 'challenge';
  if(type == CROPTYPE_FERN) return 'fern';
  if(type == CROPTYPE_SQUIRREL) return 'squirrel';
  if(type == CROPTYPE_NUT) return 'nuts';
  if(type == CROPTYPE_PUMPKIN) return 'pumpkin';
  if(type == CROPTYPE_RUNESTONE) return 'runestone';
  return 'unknown';
}

// opt_crop is cropid for specific crop in case it has a slightly different description
function getCropTypeHelp(type, opt_state) {
  var no_nettles = !!opt_state && (opt_state.challenge == challenge_bees);
  var diagonal_mistletoe = !!opt_state && !!opt_state.upgrades2[upgrade2_diagonal_mistletoes].count;
  switch(type) {
    case CROPTYPE_BERRY: return 'Produces seeds. Boosted by flowers. ' + (no_nettles ? '' : 'Negatively affected by nettles. ') + 'Neighboring mushrooms can consume its seeds to produce spores. Neighboring watercress can copy its production.';
    case CROPTYPE_MUSH: return 'Requires berries as neighbors to consume seeds to produce spores. Boosted by flowers' + (no_nettles ? '' : ' and nettles') + '. Neighboring watercress can copy its production (but also consumption).';
    case CROPTYPE_FLOWER: return 'Boosts neighboring berries and mushrooms, their production but also their consumption.' + (no_nettles ? '' : ' Negatively affected by neighboring nettles.');
    case CROPTYPE_STINGING: return 'Boosts neighboring mushrooms spores production (without increasing seeds consumption), but negatively affects orthogonally neighboring berries and flowers, so avoid touching those with this plant';
    case CROPTYPE_BRASSICA: return 'Produces a small amount of seeds on its own, but can produce much more resources by copying from berry and mushroom neighbors once you have those. Unlike other crops, has limited lifetime.';
    case CROPTYPE_MISTLETOE: return 'Produces twigs (which you receive on transcend) when tree levels up, ' + (diagonal_mistletoe ? 'when orthogonally or diagonally next to the tree' : 'when orthogonally next to the tree only') + '. Having more than one increases level up spores requirement and slightly decreases resin gain.';
    case CROPTYPE_BEE: return 'Boosts orthogonally neighboring flowers (in spring also diagonally). Since this is a boost of a boost, indirectly boosts berries and mushrooms by an entirely new factor.';
    case CROPTYPE_CHALLENGE: return 'A type of crop specific to a challenge, not available in regular runs.';
    case CROPTYPE_FERN: return 'Ethereal fern, giving starter resources';
    case CROPTYPE_NUT: return 'Produces nuts. Can have only max 1 nut plant in the field. Neighboring watercress can copy its production, but less effectively than it copies berries. Receives a limited fixed boost from flowers of high enough tier. Not boosted by other standard berry and mushroom production boosts.';
    case CROPTYPE_PUMPKIN: return 'A crop for the halloween holiday event. It will be no longer available when the event is over.';
    case CROPTYPE_RUNESTONE: return '';
  }
  return undefined;
}

// similar to getCropTypeHelp, but for field3 (infinity field)
function getCropTypeHelp3(type, opt_state) {
  var have_fishes = !!opt_state && haveFishes(opt_state);
  switch(type) {
    case CROPTYPE_BERRY: return 'Produces infinity seeds. Boosted by flowers.';
    case CROPTYPE_MUSH: return 'Produces infinity spores. Unlocks the pond. Does not require berry neighbors. Boosted by flower tiers, but not as much as berries are and depends on relative tier difference.';
    case CROPTYPE_FLOWER: return have_fishes ? 'Boosts neighboring berries. Also boosts mushrooms but with a smaller boost depending on relative tier.' : 'Boosts neighboring berries.';
    case CROPTYPE_STINGING: return 'Boosts neighboring mushrooms. The boost depends on the tier of the stinging crop relative to the mushroom, and too low tier gives no boost.';
    case CROPTYPE_BRASSICA: return 'Produces seeds, but has a limited lifespan. Produces more seeds than its initial cost over its lifespan.';
    case CROPTYPE_MISTLETOE: return 'Allows ascending to the next level of infinity';
    case CROPTYPE_BEE: return have_fishes ? 'Boosts neighboring flowers. For the flower boost to mushrooms, also has a small effect based on tier.' : 'Boosts neighboring flowers.';
    case CROPTYPE_CHALLENGE: return '';
    case CROPTYPE_FERN: return 'Copies all infinity seed and spores resources of the entire field, for crops of the same tier';
    case CROPTYPE_NUT: return 'Produces infinity seeds. Works exactly the same as berries and is boosted by the same flowers and fishes.';
    case CROPTYPE_PUMPKIN: return '';
    case CROPTYPE_RUNESTONE: return 'Boosts the basic field production boost of any neighboring crops in the infinity field.';
    case CROPTYPE_LOTUS: return 'Boosts berries and mushrooms, similar to flower but this is a separate boost multiplicative with the flower boost, and only works within the same crop tier. Not affected by bees.';
  }
  return undefined;
}

var fern_wait_minutes = 2; // default fern wait minutes (in very early game they go faster)


// apply bonuses that apply to all weather ability durations
function adjustWeatherDuration(result) {
  if(state.upgrades[active_choice0].count == 1) result *= 2;
  if(!basicChallenge() && state.squirrel_upgrades[upgradesq_weather_duration].count) result *= (1 + upgradesq_weather_duration_bonus);

  return result;
}

// apply bonuses that apply to all weather ability waits
function adjustWeatherWait(result) {
  if(state.upgrades[active_choice0].count == 1) result *= 2;

  return result;
}

function getWeatherBoost() {
  var result = Num(1);

  var level = getFruitAbility(FRUIT_WEATHER, true);
  if(level > 0) {
    var mul = Num(1).add(getFruitBoost(FRUIT_WEATHER, level, getFruitTier(true)));
    result.mulInPlace(mul);
  }
  return result;
}

////////////////////////////////////////////////////////////////////////////////

var sun_duration = 2 * 60;
var sun_wait = 10 * 60 + sun_duration;

// how long the sun effect is active
function getSunDuration() {
  var result = sun_duration;
  result = adjustWeatherDuration(result);
  return result;
}

// how long the entire sun cycle (including the time when it is active) is
function getSunWait() {
  var result = sun_wait;
  result = adjustWeatherWait(result);
  return result;
}

function sunActive() {
  if(state.lastWeather != 0) return false;
  return state.upgrades[upgrade_sununlock].count && (state.time - state.suntime) < getSunDuration();
}

////////////////////////////////////////////////////////////////////////////////

var mist_duration = 3 * 60;
var mist_wait = 15 * 60 + mist_duration;

// how long the mist effect is active
function getMistDuration() {
  var result = mist_duration;
  result = adjustWeatherDuration(result);
  return result;
}

// how long the entire mist cycle (including the time when it is active) is
function getMistWait() {
  var result = mist_wait;
  result = adjustWeatherWait(result);
  return result;
}

function mistActive() {
  if(state.lastWeather != 1) return false;
  return state.upgrades[upgrade_mistunlock].count && (state.time - state.misttime) < getMistDuration();
}

////////////////////////////////////////////////////////////////////////////////

var rainbow_duration = 4 * 60;
var rainbow_wait = 20 * 60 + rainbow_duration;

// how long the rainbow effect is active
function getRainbowDuration() {
  var result = rainbow_duration;
  result = adjustWeatherDuration(result);
  return result;
}

// how long the entire rainbow cycle (including the time when it is active) is
function getRainbowWait() {
  var result = rainbow_wait;
  result = adjustWeatherWait(result);
  return result;
}

function rainbowActive() {
  if(state.lastWeather != 2) return false;
  return state.upgrades[upgrade_rainbowunlock].count && (state.time - state.rainbowtime) < getRainbowDuration();
}

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// @constructor
function Crop() {
  this.name = 'a';
  this.cost = Res(); // one-time cost (do not use directly, use .getCost() to get all multipliers taken into account) and .getBaseCost() to get prestige taken into account
  this.prod = Res(); // production per second (do not use directly, use getProd() to get all multipliers taken into account)
  this.prod0 = Res(); // production if not prestiged
  this.leech = undefined; // e.g. set to Num(1) for 100% base copying for watercress
  this.index = 0; // index in the crops array
  this.planttime = 0; // in seconds
  this.planttime0 = 0; // planttime if not prestiged
  // how much this boosts neighboring crops, 0 means no boost, 1 means +100%, etc... (do not use directly, use getBoost() to get all multipliers taken into account)
  // meaning depends on crop type, e.g. for bees this is boostboost instead, challenge specific crops may use this value, ...
  this.boost = Num(0);
  this.tagline = '';

  this.basic_upgrade = null; // id of registered upgrade that does basic upgrades of this plant

  this.image = undefined;
  this.image_remainder = undefined; // used for brassica
  this.image_post = undefined; // used for brassica

  this.type = undefined;
  this.tier = 0;
  this.tier_non_prestiged = 0;

  this.istemplate = false; // if true, is a placeholder template
  this.isghost = false; // if true, is a ghost. This is a remainder of a plant, currently only used for the undeletable challenge when a crop is prestiged: the ghost of the unprestiged versions remains, to ensure it still cannot be deleted

  this.cached_prestige_ = 0; // for recomputing crop stats data if prestige changed: the cost, prod, ... fields of this crop are overwritten for prestige

  this.quad = false; // if true, takes up 2x2 field spaces
  this.images_quad = undefined; // if quad is true, must be array of 4 images
};

var sameTypeCostMultiplier = 1.5;
var sameTypeCostMultiplier_Flower = 2;
var sameTypeCostMultiplier_Short = 1;
// returns recoup for deleting a plant. It is only partial, the goal of the game is not to replace plants often
function getCropRecoup() {
  if(state.challenges[challenge_nodelete].completed) return 0.66;
  return 0.33;
}


var squirrel_respec_initial = 2; // how many squirrel upgrade respecs received at game start

Crop.prototype.isReal = function() {
  return !this.istemplate && !this.isghost;
};

// Returns a value based on x but smoothly capped to be no lower than lowest. The input x is also assumed to never be higher than highest, and no value higher than highest will be returned.
// The softness determines how strongly the value gets capped: at 0, x goes down linearly, until reaching lowest, then stays at lowest.
// For higher values of softness, the cap is softer, such that when x = lowest, the output will be lowest + softness,
// for lower and higher x the deviation from the sharply capped curve gets less and less.
// highest should be larger than lowest + softness (else the direction inverts)
// To summarize:
// For x == lowest, the output is lowest + softness = x + softness
// For x == highest, the output is highest
// For x < lowest, the output goes towards lowest (reaching it at -infinity)
// For x between lowest and highest, x smoothly curves from lowest + softness towards highest
// For x above highest, the result still gets larger, but normally it's assumed that input x < highest
function towardsFloorValue(x, lowest, highest, softness) {
  var s = 4 * softness * softness;
  x -= lowest;
  // scale x such that x=highest results in output highest
  var h = 4 * (highest - lowest) * (highest - lowest);
  x *= (h - s) / (h);
  var v = 0.5 * (x + Math.sqrt(x * x + s));
  return lowest + v;
}

// aka getgrowspeed, getgrowtime, getlifetime
Crop.prototype.getPlantTime = function() {
  if(state.challenge == challenge_towerdefense) {
    var td = state.towerdef;
    if(this.type == CROPTYPE_BRASSICA || !td.started || !tdWaveActive()) {
      return 0.01;
    } else {
      return 5;
    }
  }
  var result = this.planttime;
  if(result == 0) return result;

  var basic = basicChallenge();

  // NOTE: challenge_towerdefense's sped up grow time is not handled here but in game.js

  // This is the opposite for CROPTYPE_BRASSICA, it's not planttime but live time. TODO: make two separate functions for this
  if(this.type == CROPTYPE_BRASSICA) {
    if(this.basic_upgrade != null) {
      var u = state.upgrades[this.basic_upgrade];
      var u2 = upgrades[this.basic_upgrade];
      if(u.count > 0) {
        result += (this.planttime * u2.bonus) * u.count;
      }
    }

    if(!basic) {
      if(state.squirrel_upgrades[upgradesq_watercresstime].count || state.squirrel_upgrades[upgradesq_watercresstime2].count) {
        result *= 1.5;
      }
    }

    if(state.upgrades[watercress_choice0].count == 1) {
      result *= (1 + watercress_choice_lifetime_increase);
    }

    return result;
  }

  var planttime = this.planttime;

  var min = 60 + Math.log(planttime) + 10 * this.tier;
  if(min > planttime * 0.5) min = planttime * 0.5;


  var level = getFruitAbility(FRUIT_GROWSPEED, true);
  if(level > 0) {
    var mul = Num(1).sub(getFruitBoost(FRUIT_GROWSPEED, level, getFruitTier(true))).valueOf();
    result *= mul;
  }

  if(!basic) {
    var count = state.upgrades2[upgrade2_time_reduce_0].count;
    if(count) {
      result -= upgrade2_time_reduce_0_amount * count;
    }
  }

  var softness = planttime * 0.33;
  var highest = planttime;
  if(min + softness > highest) highest = min + softness;
  result = towardsFloorValue(result, min, highest, softness);

  // for prestiged crops, which has its own different softness curve
  var planttime2 = result;
  if(!basic) {
    var c2 = state.crops[this.index];
    if(c2.prestige) {
      var count = state.upgrades2[upgrade2_prestiged_growspeed].count;
      if(count) {
        result -= upgrade2_prestiged_growspeed_amount * count;
      }
    }
  }

  var min2 = 60 + Math.log(planttime2) + 10 * this.tier;
  if(min2 > planttime2 * 0.5) min2 = planttime2 * 0.5;
  var softness2 = planttime2 * 0.33;
  var highest2 = planttime2;
  if(min2 + softness2 > highest2) highest2 = min2 + softness2;

  result = towardsFloorValue(result, min2, highest2, softness2);

  if(result > planttime) result = planttime;

  if(!basic) {
    if(state.squirrel_upgrades[upgradesq_growspeed].count) {
      result *= (1 - upgradesq_growspeed_bonus);
    }
    if(state.upgrades2[upgrade2_season2[0]].count && getSeason() == 0) {
      result *= (1 - upgrade2_spring_growspeed_bonus);
    }
  }

  if(presentGrowSpeedActive()) {
    result *= 0.5;
  }

  return result;
};

Crop.prototype.getCost = function(opt_adjust_count) {
  var mul = sameTypeCostMultiplier;
  if(this.type == CROPTYPE_FLOWER) mul = sameTypeCostMultiplier_Flower;
  if(this.type == CROPTYPE_BRASSICA) mul = sameTypeCostMultiplier_Short;
  if(this.type == CROPTYPE_CHALLENGE) {
    if(this.challengecroppricemul) mul = this.challengecroppricemul;
  }
  if(state.challenge == challenge_towerdefense && this.type != CROPTYPE_BRASSICA && this.type != CROPTYPE_CHALLENGE) {
    mul = Math.max(4, mul);
  }
  var countfactor = Math.pow(mul, state.cropcount[this.index] + (opt_adjust_count || 0));
  return this.cost.mulr(countfactor);
};

Crop.prototype.getRecoup = function(f, opt_adjust_count) {
  var adjust = opt_adjust_count || 0;
  var result = this.getCost(adjust - 1);
  // no recoup reduction but full refund during the TD challenge
  if(state.challenge == challenge_towerdefense) return result;
  if(f && this.type == CROPTYPE_BRASSICA) {
    // brassica give amount scaled by their lifetime, and full rather than multiplied with getCropRecoup() percentage
    // this used to be different (before jan 2024 brassica gave 0 recoup) but is now made to be more like infinity field brassica, and also to make the watercress refresh button more useful and reliable for the first few minutes of the game and prevent having too few resources for first watercress by planting one and immediately deleting it again
    return result.mulr(Math.min(Math.max(0, f.growth), 1));
  }
  // the withering crops during the wither challenge give no recoup
  if(state.challenge == challenge_wither) return new Res();
  if(f && f.growth < 1 && this.type != CROPTYPE_BRASSICA && state.challenge != challenge_wither) {
    // growing crops give a full refund
    return result;
  }
  return result.mulr(getCropRecoup());
};

var infernal_tier_base = 0.5;
var infernal_berry_tier_mul = 700; // same as getBerryProd(n + 1).spores.div(getBerryProd(n).spores) for any high enough n
var infernal_berry_upgrade_count = 29; // matches value in setCropMultiplierCosts. TODO: make single variable
var infernal_mush_tier_mul = 612500; // same as getMushroomProd(n + 1).spores.div(getMushroomProd(n).spores) for any high enough n
var infernal_mush_upgrade_count = 52; // matches value in setCropMultiplierCosts. TODO: make single variable

var infernal_berry_upgrade_base = Num.pow(Num(infernal_berry_tier_mul), Num(1.0 / infernal_berry_upgrade_count)).div(Num.pow(Num(infernal_berry_tier_mul * infernal_tier_base), Num(1.0 / infernal_berry_upgrade_count)));
var infernal_mush_upgrade_base = Num.pow(Num(infernal_mush_tier_mul), Num(1.0 / infernal_mush_upgrade_count)).div(Num.pow(Num(infernal_mush_tier_mul * infernal_tier_base), Num(1.0 / infernal_mush_upgrade_count)));


// used for multiple possible aspects, such as production, boost if this is a flower, etc...
// f is field, similar to in Crop.prototype.getProd
// result is changed in-place and may be either Num or Res. Nothing is returned.
Crop.prototype.addSeasonBonus_ = function(result, season, f, breakdown) {
  // posmul is used:
  // Unlike other multipliers, this one does not affect negative production. This is a good thing in the crop's good season, but extra harsh in a bad season (e.g. winter)

  var basic = basicChallenge();

  if(season == 0 && this.type == CROPTYPE_FLOWER) {
    var bonus = getSpringFlowerBonus();
    result.mulInPlace(bonus);
    if(breakdown) breakdown.push([seasonNames[season], true, bonus, result.clone()]);
  }

  if(season == 1 && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN)) {
    var bonus = getSummerBerryBonus();
    result.mulInPlace(bonus);
    if(breakdown) breakdown.push([seasonNames[season], true, bonus, result.clone()]);
  }

  // with ethereal upgrades, spring also benefits mushrooms a bit, to catch up with other seasons ethereal upgrades
  if(season == 1 && this.type == CROPTYPE_MUSH) {
    var bonus = getSummerMushroomBonus();
    // unlike in autumn, not using posmul here. This can give a huge discrepancy when not having the watercress and mushroom soup upgrade, but one is expected to have that upgrade eventually anyway and otherwise summer is too close to autumn while spring/winter still have much lower spores
    result.mulInPlace(bonus);
    if(breakdown && bonus.neqr(1)) breakdown.push([seasonNames[season], true, bonus, result.clone()]);
  }

  if(season == 2 && this.type == CROPTYPE_MUSH) {
    var bonus = getAutumnMushroomBonus();
    result.mulInPlace(bonus);
    var reduction = (new Num(1)).sub(getAutumnMushroomConsumptionReduction());
    result.negmulInPlace(reduction);
    if(breakdown) breakdown.push([seasonNames[season], true, bonus, result.clone()]);
  }

  // with ethereal upgrades, autumn also benefits berries a bit, to catch up with other seasons ethereal upgrades
  if(season == 2 && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN)) {
    var bonus = getAutumnBerryBonus();
    result.posmulInPlace(bonus);
    if(breakdown && bonus.neqr(1)) breakdown.push([seasonNames[season], true, bonus, result.clone()]);
  }

  if(season == 3 && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_FLOWER || this.type == CROPTYPE_BEE || this.type == CROPTYPE_NUT) && f) {
    var weather_ignore = false;
    if((this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN) && sunActive()) weather_ignore = true;
    if(this.type == CROPTYPE_MUSH && mistActive()) weather_ignore = true;
    if(this.type == CROPTYPE_FLOWER && rainbowActive()) weather_ignore = true;

    var p = prefield[f.y][f.x];
    if(!p.treeneighbor && !weather_ignore) {
      var malus = getWinterMalus();
      if(malus.neqr(1)) {
        result.posmulInPlace(malus);
        if(breakdown) breakdown.push([seasonNames[season], true, malus, result.clone()]);
      }
    }

    // winter tree warmth
    if(p.treeneighbor && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN || this.type == CROPTYPE_MUSH)) {
      var bonus = getWinterTreeWarmth();
      if(this.quad) {
        // quad crop is overpowered in winter if it gets the full winter warmth, instead take into account it only partially touches the tree since it's so big
        // NOTE: even better would be to do it percentage wise for amount of pieces touching the tree. However, that will always either be 25% or 50%, and 50% if well placed, so simplifying it to always 50% is ok
        bonus = bonus.subr(1).mulr(0.5).addr(1);
      }
      result.mulInPlace(bonus);
      if(breakdown) breakdown.push(['winter tree warmth', true, bonus, result.clone()]);
    }
    if(!basic) {
      if(p.treeneighbor && state.upgrades2[upgrade2_season2[3]].count && this.type == CROPTYPE_FLOWER) {
        var bonus = upgrade2_winter_flower_bonus;
        result.mulInPlace(bonus);
        if(breakdown) breakdown.push(['winter tree warmth (flowers)', true, bonus, result.clone()]);
      }
    }
  }

  if(state.challenge == challenge_infernal && season == 5 && this.tier >= 0) {
    var tier_effective = -1;
    var upgrade_base = undefined;
    if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN) {
      tier_effective = this.tier;
      upgrade_base = infernal_berry_upgrade_base;
    }
    if(this.type == CROPTYPE_MUSH) {
      tier_effective = this.tier * 2 + 2;
      upgrade_base = infernal_mush_upgrade_base;
    }
    var malus = Num(1e-9); // this applies to berries, flowers, mushrooms, bees, nettles, watercress production (but not copying)
    if(tier_effective >= 0) {
      malus.mulInPlace(Num.powr(Num(infernal_tier_base), tier_effective + 1));
      var u = state.upgrades[this.basic_upgrade];
      malus.mulInPlace(Num.powr(Num(upgrade_base), -u.count));
    }
    if(this.type == CROPTYPE_BRASSICA && result.seeds) {
      // for brassica, keep the production at least as much as initial game brassica: so that it's possible to play infermal without having fern in ethereal field in theory
      var minseeds = Num.min(this.prod.seeds, result.seeds);
      if(result.seeds.mul(malus).lt(minseeds) && result.seeds.neqr(0)) {
        // the result.seeds.neqr(0) check above is to avoid NaN, production can be 0 if the watercress is end of life (it still copies then, but doesn't produce)
        malus = minseeds.div(result.seeds);
      }
    }
    result.mulInPlace(malus);
    if(breakdown) breakdown.push(['infernal', true, malus, result.clone()]);
  }
}

// derive the nettle malus from its boost to mushrooms
function deriveNettleMalus(boost) {
  if(state.challenge == challenge_poisonivy) {
    // this challenge is REALLY hard if this less extreme malus is not there
    return boost.powr(0.25).addr(2).inv();
  }
  return boost.powr(0.5).addr(2).inv();
}

Crop.prototype.computeNettleMalusReceived_ = function(f, pretend) {
  // this computation must match what precomputeField does for nettlemalus_received
  var malus = new Num(1);
  if(!f) return malus;
  for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
    var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
    var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
    if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
    var n = state.field[y2][x2];
    if(n.hasRealCrop() && n.getCrop().type == CROPTYPE_STINGING) {
      var boost = n.getCrop().getBoost(n, pretend);
      malus.mulInPlace(deriveNettleMalus(boost));
    }
  }
  return malus;
};

// in spring, bees can work diagonally too. Except during the rockier challenge
function haveDiagonalBees() {
  if(state.challenge == challenge_rockier) return false;
  return getSeason() == 0;
}

Crop.prototype.computeBeehiveBoostReceived_ = function(f, pretend) {
  var numbeedirs = haveDiagonalBees() ? 8 : 4;
  // this computation must match what precomputeField does for beeboostboost_received
  var bonus = new Num(0);
  if(!f) return bonus;
  for(var dir = 0; dir < numbeedirs; dir++) { // get the neighbors N,E,S,W,NE,SE,SW,NW
    var x2 = f.x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
    var y2 = f.y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
    if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
    if(dir >= 4 && !diagConnected(f.x, f.y, x2, y2, state.field)) continue;
    var n = state.field[y2][x2];
    if(n.hasRealCrop() && n.getCrop().type == CROPTYPE_BEE) {
      var boostboost = n.getCrop().getBoostBoost(n, pretend);
      bonus.addInPlace(boostboost);
    }
  }
  return bonus;
};

var flower_nut_boost = Num(0.25);
var spores_overload_penalty = Num(4);

//var seed_consumption_mul = 1.0; // for testing only

// f = Cell from field, or undefined to not take location-based production bonuses into account
// prefield must already have been computed for flowers, bees and nettles (but not yet for berries/mushrooms, which is what is being computed now) before this may get called, unless pretent is non-0
// pretend: if anything else than 0, pretents crops are fullgrown, and cannot use the prefield computations so is slower to compute
//  0: normal
//  1: compute income if this plant would be planted here, while it doesn't exist here in reality. For the planting dialog UI, ...
//  2: same as 1, but for tooltips/dialogs/expected hypothetical gain display/..., so will also include brassica copying, but normally precomputefield handles this instead
//  3: compute the value for best berry for the pumpkin income. Must include all berry specific bonuses and its growth, but not the pumpkin bonuses. The max of all berries from this must be stored in state.bestberryforpumpkin, and then if the crop type is CROPTYPE_PUMPKIN it uses this value as base
//  4: same as 3, but assuming the crop is fullgrown
//  5: compute for fern. This assumes everything is fullgrown, like 1, and in addition uses modified weighted time at level
Crop.prototype.getProd = function(f, pretend, breakdown) {
  var basic = basicChallenge();

  var baseprod = this.prod;
  var baseprod0 = this.prod0; // production without prestige, only used for display purposes

  if(state.challenge == challenge_towerdefense) {
    if(this.type == CROPTYPE_BRASSICA) {
      baseprod = getTDBerryBaseDamage(0).divr(16);
      baseprod0 = baseprod;
    }
  }

  var result = new Res(baseprod);
  if(this.type == CROPTYPE_PUMPKIN) {
    var best = state.bestberryforpumpkin;
    if(pretend == 1 || pretend == 2 || pretend == 4 || pretend == 5) best = state.bestberryforpumpkin_expected;
    result = new Res(best);
  }
  if(breakdown) {
    if(state.crops[this.index].prestige > 0) {
      breakdown.push(['base', true, Num(0), baseprod0.clone()]);
      var div = Res.findDiv(baseprod, baseprod0);
      breakdown.push(['prestige', true, div, result.clone()]);
    } else {
      breakdown.push(['base', true, Num(0), result.clone()]);
    }
  }
  if(this.type == CROPTYPE_PUMPKIN) {
    result.mulInPlace(pumpkin_multiplier);
    if(breakdown) breakdown.push(['pumpkin', true, pumpkin_multiplier, result.clone()]);
  }

  if(state.challenge == challenge_towerdefense && f && f.growth < 1 && this.type == CROPTYPE_MUSH) {
    result.mulrInPlace(0);
    if(breakdown) breakdown.push(['tower growing', true, Num(0), result.clone()]);
    return result;
  }

  if(this.type == CROPTYPE_NUT && state.just_evolution) {
    result.mulrInPlace(0);
    if(breakdown) breakdown.push(['squirrel evolution in progress', true, Num(0), result.clone()]);
    return result;
  }
  if(this.quad && f && getQuadPos(f.x, f.y) != 0) {
    result.mulrInPlace(0);
    if(breakdown) breakdown.push(['not the main 2x2 crop piece', true, Num(0), result.clone()]);
    return result;
  }
  if(this.type == CROPTYPE_NUT && state.squirrel_upgrades[upgradesq_nuts].count) {
    var mul = (new Num(upgradesq_nuts_value)).powr(state.squirrel_upgrades[upgradesq_nuts].count);
    result.mulInPlace(mul);
    if(breakdown) breakdown.push(['squirrel nuts upgrade', true, mul, result.clone()]);
  }

  // The f.isFullGrown check considers all brassica fullgrown (so brassica aren't affected by this), except those that are end of life from infinite lifetime (so those get 0 production, but still copy). This behavior is not by design (EOL brassica was only implemented later) but is ok and sensible.
  if((!pretend || pretend == 3) && f && (!f.isFullGrown() || state.challenge == challenge_wither)) {
    if(state.challenge == challenge_wither) {
      // wither challenge
      var t = Num(witherCurve(f.growth) * f.growth);
      result.mulInPlace(t);
      if(breakdown) breakdown.push(['withering', true, t, result.clone()]);
    } else {
      // still growing
      var t = f.growth * f.growth; // unlike flowers etc..., the actual producers ramp up quadratically (= a slower start, but not applied to flowers/bees/... to count this effect in only once)

      if(this.type == CROPTYPE_MUSH) {
        // mushrooms spores ramp up much later: when progressing through low tier mushrooms, grow speed should be a limiting factor, to avoid the game having the highest resin/hr after too short time (should be at 1-2 hours, not at 20 minutes), to avoid the game being too active
        result.seeds.mulrInPlace(t);
        t = Math.pow(t, 4);
        result.spores.mulrInPlace(t);
      } else {
        result.mulrInPlace(t);
      }
      if(breakdown) breakdown.push(['growing', true, Num(t), result.clone()]);
    }
  }

  // upgrades
  if(this.basic_upgrade != null) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {
      var mul_upgrade;
      if(this.type == CROPTYPE_BRASSICA) {
        mul_upgrade = Num(brassica_prod_upgrade_boost * u.count + 1); // brassica upgrade is additive instead of multiplicative
      } else {
        mul_upgrade = u2.bonus.powr(u.count);
      }
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  if(pretend == 3 || pretend == 4) {
    // don't apply any other mode for this bonus: this is highest base berry production for pumpkin, from itself and its upgrades, all other effects apply to the pumpkin itself
    return result;
  }


  if(!basic) {
    // squirrel evolution
    if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN) {
      if(state.squirrel_evolution >= 1) {
        var mul = squirrel_epoch_prod_bonus.addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['squirrel evolution', true, mul, result.clone()]);
      }
      if(state.squirrel_evolution >= 2) {
        var mul = squirrel_epoch_prod_bonus2.addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['squirrel evolution II', true, mul, result.clone()]);
      }
    }
  }

  if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN) {
    if(state.upgrades[resin_choice0].count == 2) {
      var mul = Num(resin_choice0_production_bonus + 1);
      result.mulInPlace(mul);
      if(breakdown) breakdown.push(['resin choice: production', true, mul, result.clone()]);
    }
  }


  if(!basic) {
    // medal
    if(this.type != CROPTYPE_NUT) {
      result.mulInPlace(state.medal_prodmul);
      if(breakdown) breakdown.push(['achievements', true, state.medal_prodmul, result.clone()]);
    }

    // amber
    if((this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN)) {
      if(state.amberprod) {
        var bonus = Num(2);
        result.mulInPlace(bonus);
        if(breakdown) breakdown.push(['amber production bonus active', true, bonus, result.clone()]);

      }
    }
  }


  // fruit
  if(basic != 2) {
    if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN) {
      var level = getFruitAbility(FRUIT_BERRYBOOST, true);
      if(level > 0) {
        var mul = getFruitBoost(FRUIT_BERRYBOOST, level, getFruitTier(true)).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_BERRYBOOST), true, mul, result.clone()]);
      }
    }
    if(this.type == CROPTYPE_MUSH) {
      var level = getFruitAbility(FRUIT_MUSHBOOST, true);
      if(level > 0) {
        var mul = getFruitBoost(FRUIT_MUSHBOOST, level, getFruitTier(true)).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_MUSHBOOST), true, mul, result.clone()]);
      }
      var level = getFruitAbility(FRUIT_MUSHEFF, true);
      if(level > 0) {
        var mul = Num(1).sub(getFruitBoost(FRUIT_MUSHEFF, level, getFruitTier(true)));
        result.seeds.mulInPlace(mul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_MUSHEFF), true, mul, result.clone()]);
      }
    }
    if(this.type == CROPTYPE_NUT) {
      var level = getFruitAbility(FRUIT_NUTBOOST, true);
      if(level > 0) {
        var mul = getFruitBoost(FRUIT_NUTBOOST, level, getFruitTier(true)).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_NUTBOOST), true, mul, result.clone()]);
      }
    }
    if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN) {
      // also applied to mushroom because overload increases mushroom's seed consumption equally
      var level = getFruitAbility(FRUIT_SEED_OVERLOAD, true);
      if(level > 0) {
        var mul = getFruitBoost(FRUIT_SEED_OVERLOAD, level, getFruitTier(true)).addr(1);
        result.seeds.mulInPlace(mul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_SEED_OVERLOAD), true, mul, result.clone()]);
      }
    }
    if(this.type == CROPTYPE_MUSH) {
      var level = getFruitAbility(FRUIT_SPORES_OVERLOAD, true);
      if(level > 0) {
        var mul = getFruitBoost(FRUIT_SPORES_OVERLOAD, level, getFruitTier(true)).addr(1);
        var seedmul = spores_overload_penalty;
        if(mul.ltr(1000)) {
          /*
          seedmul is the seed penalty due to spores overload
          without spores overload, the penalty is 1 (multiply with 1 = no penalty)
          with only spores overload, the penalty is 4 (= value of spores_overload_penalty, if this value was tuned to something else, this example still uses 4)
          but the original non-overloaded spores production should not be penalized, so overall the penalty will be slightly smaller
          e.g. if mul is 10, then 10% (0.1) is produced with 1x penalty, 90% (0.9) is produced with 4x penalty, so overall penalty is:
          1 * 0.1 + 4 * 0.9 = 3.7
          This is only done for small mul, for the typical muls over 1000 normally gotten at emerald fruits this is a rounding error and not computed, but it can matter during basic challenge
          */
          var a = mul.rdiv(1); // 1 / mul, e.g. the 0.1 in the example above
          var b = a.rsub(1); // e.g the 0.9 in the example above
          var seedmul = Num(1).mul(a).add(spores_overload_penalty.mul(b));
        }
        result.mulInPlace(mul);
        result.seeds.mulInPlace(seedmul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_SPORES_OVERLOAD), true, mul, result.clone()]);
      }
    }
  }

  if(!basic) {
    // ethereal crops bonus to basic crops
    var ethereal_prodmul = Res.resOne();
    if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN) {
      ethereal_prodmul.seeds = state.ethereal_berry_bonus.addr(1);
    }
    if(this.type == CROPTYPE_MUSH) {
      // seeds commented out in v0.1.16 but enabled again in v0.1.47 because otherwise the seed prod/consumption balance will get lost with higher level etherela field.
      ethereal_prodmul.seeds = state.ethereal_mush_bonus.addr(1);
      ethereal_prodmul.spores = state.ethereal_mush_bonus.addr(1);
    }
    var e = result.elmul(ethereal_prodmul);
    if(result.neq(e)) {
      if(breakdown) {
        var mul = Num(1);
        var a0 = result.toArray();
        var a1 = e.toArray();
        for(var i = 0; i < a0.length; i++) {
          if(a0[i].neq(a1[i])) {
            mul = a1[i].div(a0[i]);
            break;
          }
        }
        breakdown.push(['ethereal crops', true, mul, e.clone()]);
      }
      result = e;
    }

    if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN) {
      // tree's gesture ethereal upgrade
      var gesture = treeGestureBonus();
      if(gesture.neqr(1)) {
        result.mulInPlace(gesture);
        if(breakdown) breakdown.push(['tree\'s gesture', true, gesture, result.clone()]);
      }

      // ethereal tree level above 25 ethereal upgrade
      var num = state.upgrades2[upgrade2_ethereal_tree_level].count;
      if(num) {
        var mul = upgrade2_ethereal_tree_level_bonus.mulr(num).mulr(state.treelevel2 - 25).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['ethereal tree level > 25', true, mul, result.clone()]);
      }
    }

    if(haveSquirrel()) {
      if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN) {
        if(state.squirrel_upgrades[upgradesq_berry].count) {
          var bonus = upgradesq_berry_bonus.mulr(state.squirrel_upgrades[upgradesq_berry].count).addr(1);
          result.mulInPlace(bonus);
          if(breakdown) breakdown.push(['squirrel upgrades', true, bonus, result.clone()]);
        }
        var this_prestige = state.crops[this.index].prestige;
        if(this.type == CROPTYPE_PUMPKIN) {
          this_prestige = state.bestberryforpumpkin_prestige;
        }
        if(this_prestige && state.squirrel_upgrades[upgradesq_prestiged_berry].count) {
          var bonus = upgradesq_prestiged_berry_bonus.mulr(state.squirrel_upgrades[upgradesq_prestiged_berry].count).addr(1);
          bonus = bonus.powr(this_prestige); // applies multiple times for multiple prestiges
          result.mulInPlace(bonus);
          if(breakdown) breakdown.push(['squirrel prestiged', true, bonus, result.clone()]);
        }
      }
      if(this.type == CROPTYPE_MUSH) {
        if(state.squirrel_upgrades[upgradesq_mushroom].count) {
          var bonus = upgradesq_mushroom_bonus.mulr(state.squirrel_upgrades[upgradesq_mushroom].count).addr(1);
          result.mulInPlace(bonus);
          if(breakdown) breakdown.push(['squirrel upgrades', true, bonus, result.clone()]);
        }
        if(state.crops[this.index].prestige && state.squirrel_upgrades[upgradesq_prestiged_mushroom].count) {
          var bonus = upgradesq_prestiged_mushroom_bonus.mulr(state.squirrel_upgrades[upgradesq_prestiged_mushroom].count).addr(1);
          bonus = bonus.powr(state.crops[this.index].prestige); // applies multiple times for multiple prestiges
          result.mulInPlace(bonus);
          if(breakdown) breakdown.push(['squirrel prestiged', true, bonus, result.clone()]);
        }
        if(state.squirrel_upgrades[upgradesq_mushroom_efficiency].count) {
          var mul = (new Num(1)).subr(upgradesq_mushroom_efficiency_value);
          result.negmulInPlace(mul);
          if(breakdown) breakdown.push(['squirrel efficiency', true, mul, result.clone()]);
        }
      }
    }

    if(haveUnusedNutsBonus() && state.res.nuts.gter(1) && this.type != CROPTYPE_NUT) {
      var nuts_bonus = getUnusedNutsBonus();
      result.mulInPlace(nuts_bonus);
      if(breakdown) breakdown.push(['unused nuts', true, nuts_bonus, result.clone()]);
    }

    if(state.res.resin.gter(1) && this.type != CROPTYPE_NUT) {
      var resin_bonus = getUnusedResinBonus();
      result.mulInPlace(resin_bonus);
      if(breakdown) breakdown.push(['unused resin', true, resin_bonus, result.clone()]);
    }

    if(this.type != CROPTYPE_NUT) {
      var twigs_bonus = getUnusedTwigsBonus();
      if(twigs_bonus.neqr(1)) {
        result.mulInPlace(twigs_bonus);
        if(breakdown) breakdown.push(['unused twigs', true, twigs_bonus, result.clone()]);
      }
    }

    if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN) {
      if(haveEtherealMistletoeUpgrade(mistle_upgrade_prod)) {
        var mul = getEtherealMistletoeBonus(mistle_upgrade_prod).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['ethereal mistletoe leafiness', true, mul, result.clone()]);
      }
    }

    if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN) {
      if(haveEtherealMistletoeUpgrade(mistle_upgrade_berry)) {
        var mul = getEtherealMistletoeBonus(mistle_upgrade_berry).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['ethereal mistletoe berry-ness', true, mul, result.clone()]);
      }
    }

    if(this.type == CROPTYPE_NUT) {
      if(haveEtherealMistletoeUpgrade(mistle_upgrade_nuts)) {
        var mul = getEtherealMistletoeBonus(mistle_upgrade_nuts).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['ethereal mistletoe nuttiness', true, mul, result.clone()]);
      }
    }

    if(this.type == CROPTYPE_MUSH) {
      if(haveEtherealMistletoeUpgrade(mistle_upgrade_mush)) {
        var mul = getEtherealMistletoeBonus(mistle_upgrade_mush).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['ethereal mistletoe funginess', true, mul, result.clone()]);
      }
    }
  }


  var season = getSeason();

  // flower boost
  if(f && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN)) {
    var mul_boost = Num(1);
    var num = 0;
    var x = f.x, y = f.y, w = state.numw, h = state.numh;

    var dirs = f.getNeighborDirsFrom(false);

    for(var dir = 0; dir < dirs.length; dir++) {
      var x2 = x + dirs[dir][0];
      var y2 = y + dirs[dir][1];
      if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
      var n = state.field[y2][x2];
      if(n.hasRealCrop() && n.getCrop().type == CROPTYPE_FLOWER) {
        var boost;
        if(pretend) boost = n.getCrop().getBoost(n, pretend);
        else boost = prefield[n.y][n.x].boost;
        if(boost.neqr(0)) {
          mul_boost.addInPlace(boost);
          num++;
        }
      }
    }

    result.mulInPlace(mul_boost);
    if(breakdown && num > 0) breakdown.push(['flowers (' + num + ')', true, mul_boost, result.clone()]);
  }

  // flower boost for nuts
  if(f && (this.type == CROPTYPE_NUT)) {
    var mul_boost = Num(1);
    var num = 0;
    var x = f.x, y = f.y, w = state.numw, h = state.numh;

    // require good tier flowers for the nut, don't benefit from low unupgraded flowers next to nuts
    var min_tier = state.highestoftypeplanted[CROPTYPE_FLOWER] - 1;

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
      var n = state.field[y2][x2];
      if(n.hasRealCrop() && n.getCrop().type == CROPTYPE_FLOWER && n.getCrop().tier >= min_tier) {
        mul_boost.addInPlace(flower_nut_boost.mulr(n.growth));
        num++;
      }
    }

    result.mulInPlace(mul_boost);
    if(breakdown && num > 0) breakdown.push(['flowers (' + num + ', ' + flower_nut_boost.toPercentString() +  ' each)', true, mul_boost, result.clone()]);
  }

  // nettle malus
  if(f && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_NUT || this.type == CROPTYPE_PUMPKIN)) {
    var p = prefield[f.y][f.x];
    var num = p.num_nettle;
    var malus;
    if(pretend) {
      // this malus computation must match what precomputeField does for nettlemalus_received
      malus = this.computeNettleMalusReceived_(f, pretend);
    } else {
      malus = p.nettlemalus_received;
    }

    if(num > 0) {
      result.mulInPlace(malus);
      if(breakdown) breakdown.push(['stingy crops malus (' + num + ')', true, malus, result.clone()]);
    }
  }

  // nettle boost
  if(f && (this.type == CROPTYPE_MUSH)) {
    var spore_boost = Num(1); // boost to spores from the nettle
    var seed_cost = Num(1); // extra seed consumption due to the nettle, normally this is a multiplier of 1 (nettle does not cause extra seed consumption), but during the tower defense challenge it does
    var num = 0;
    var x = f.x, y = f.y, w = state.numw, h = state.numh;

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
      var n = state.field[y2][x2];
      var c = n.getCrop();
      if(n.hasCrop() && c.type == CROPTYPE_STINGING) {
        var boost;
        if(pretend) boost = c.getBoost(n, pretend);
        else boost = prefield[n.y][n.x].boost;
        if(boost.neqr(0)) {
          spore_boost.addInPlace(boost);
          num++;
          if(state.challenge == challenge_towerdefense) {
            if(c.basic_upgrade != null) {
              var eff = c.tier;
              var u = state.upgrades[c.basic_upgrade];
              eff += towards1(u.count, 50) * 0.5; // give something towards the next tier for nettle upgrades, but not 100% so next tier gives a bump up
              eff = 1 + eff * 4; // 1 = the base multiplier. multipy eff to give more visible effect of this, the effect on damage of mushroom is much smaller
              boost = boost.divr(eff);
            }
            seed_cost.addInPlace(boost);
          }
        }
      }
    }

    result.spores.mulInPlace(spore_boost);
    if(state.challenge == challenge_towerdefense) {
      // For tower defense, the nettle als increases consumption. This is because the current balancing of the game makes mushrooms almost never do over-consumption anymore, but for the tower defense, to have increased berry tiers still worth it, there must be some limit on what mushrooms can consume from them.
      result.seeds.mulInPlace(seed_cost);
    }
    if(breakdown && num > 0) breakdown.push(['stingy crops (' + num + ')', true, spore_boost, result.clone()]);
  }

  if(!basic) {
    // multiplicity
    if((this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN) && haveMultiplicity(this.type)) {
      var num = getMultiplicityNum(this);
      if(num > 0) {
        var boost = getMultiplicityBonusBase(this.type).mulr(num).addr(1);
        if(state.challenge == challenge_towerdefense && this.type == CROPTYPE_MUSH) {
          result.spores.mulInPlace(boost); // during tower defense, multiplicity for mushroom doesn't make it consume more seeds
        } else {
          result.mulInPlace(boost);
        }
        if(breakdown) breakdown.push(['multiplicity (' + ((num == Math.floor(num)) ? num.toString() : num.toPrecision(3)) + ')', true, boost, result.clone()]);
      }
    }
  }

  // treelevel boost
  // CROPTYPE_BRASSICA is excluded simply to remove noise in the breakdown display: it's only a bonus on its 1 seed production. At the point where the tree is leveled, its real income comes from the neighbor copying.
  if(state.treelevel > 0 && this.type != CROPTYPE_BRASSICA && this.type != CROPTYPE_NUT) {
    var tree_boost = Num(1).add(getTreeBoost());
    result.mulInPlace(tree_boost);
    if(breakdown && tree_boost.neqr(1)) breakdown.push(['tree level (' + state.treelevel + ')', true, tree_boost, result.clone()]);
  }

  // posmul is used when the bonus only affects its production but not its consumption.
  // most do not use posmul, since the game would become trivial if production has multipliers of billions while consumption remains something similar to the early game values.
  // especially a global bonus like medal, that affects everything at once and hence can't cause increased consumption to be worse, should use full mul, not posmul

  // weather

  this.addSeasonBonus_(result, season, f, breakdown);

  if(state.challenge == challenge_stormy && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN)) {
    var malus = Num(0.5);
    result.mulInPlace(malus);
    if(breakdown) breakdown.push(['stormy', true, malus, result.clone()]);
  }

  // sun
  if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_PUMPKIN) {
    if(sunActive()) {
      var mul_sun = getSunSeedsBoost().addr(1);
      result.seeds.mulrInPlace(mul_sun);
      if(breakdown) breakdown.push(['sun', true, mul_sun, result.clone()]);
    } else if(havePermaWeatherFor(0)) {
      var mul_sun = getSunSeedsBoost(true).addr(1);
      result.seeds.mulrInPlace(mul_sun);
      if(breakdown) breakdown.push(['sun (inactive)', true, mul_sun, result.clone()]);
    }
  }

  // mist
  if(this.type == CROPTYPE_MUSH) {
    if(mistActive()) {
      var mul_mist0 = getMistSeedsBoost();
      result.seeds.mulInPlace(mul_mist0);
      if(breakdown) breakdown.push(['mist (less seeds)', true, mul_mist0, result.clone()]);

      var mul_mist1 = getMistSporesBoost().addr(1);
      result.spores.mulInPlace(mul_mist1);
      if(breakdown) breakdown.push(['mist (more spores)', true, mul_mist1, result.clone()]);
    } else if(havePermaWeatherFor(1)) {
      var mul_mist1 = getMistSporesBoost(true).addr(1);
      result.spores.mulInPlace(mul_mist1);
      if(breakdown) breakdown.push(['mist (inactive)', true, mul_mist1, result.clone()]);
    }
  }

  if(!basic) {
    // challenges
    if((this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN) && state.challenge_multiplier_prod.neqr(1)) {
      result.mulInPlace(state.challenge_multiplier_prod);
      if(breakdown) breakdown.push(['challenge highest levels', true, state.challenge_multiplier_prod, result.clone()]);
    }

    if((this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN) && state.squirrel_upgrades[upgradesq_highest_level].count && state.g_treelevel > upgradesq_highest_level_min) {
      var mul = GetSquirrelUpgradeHighestTreeLevelMultiplier();
      result.mulInPlace(mul);
      if(breakdown) breakdown.push(['highest tree level ever ' + state.g_treelevel + ' (squirrel upgrade)', true, mul, result.clone()]);
    }

    if((this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN) && state.squirrel_upgrades[upgradesq_leveltime].count) {
      var origtime = weightedTimeAtLevel(pretend == 5);
      var time = Math.floor(origtime / 60) * 60; // rounded at certain intervals, going stepwise so that e.g. production time prediction timers aren't continuously changing
      if(time > upgradesq_leveltime_maxtime) time = upgradesq_leveltime_maxtime;
      if(origtime > upgradesq_leveltime_maxtime) origtime = upgradesq_leveltime_maxtime;
      if(time > 0) {
        var mul = Num(1 + time * upgradesq_leveltime_maxbonus / upgradesq_leveltime_maxtime);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['weighted time at level: ' + util.formatDuration(origtime), true, mul, result.clone()]);
      } else {
        if(breakdown) breakdown.push(['time at level (begins after 1 minute)', true, Num(1), result.clone()]);
      }
    }

    // bee challenge
    if((this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN) && state.challenge == challenge_bees) {
      var mul_bees = getWorkerBeeBonus().addr(1);
      result.posmulInPlace(mul_bees);
      if(breakdown) breakdown.push(['worker bees (challenge)', true, mul_bees, result.clone()]);
    }

    // Infinity ascension
    if(state.infinity_ascend && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN)) {
      var mul = infinity_ascension_production_bonus.addr(1);
      result.mulInPlace(mul);
      if(breakdown) breakdown.push(['infinity ascension', true, mul, result.clone()]);
    }

    // Infinity field
    if(state.infinityboost.neqr(0) && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN)) {
      var mul = state.infinityboost.addr(1);
      result.mulInPlace(mul);
      //if(breakdown) breakdown.push(['present effect', true, mul, result.clone()]);
      if(breakdown) breakdown.push(['infinity field', true, mul, result.clone()]);
    }
  }

  // present/egg
  if(presentProductionBoostActive() && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_PUMPKIN)) {
    var mul = new Num(1.25);
    result.mulInPlace(mul);
    if(state.holiday & 1) {
      if(breakdown) breakdown.push(['present effect', true, mul, result.clone()]);
    } else {
      if(breakdown) breakdown.push(['egg effect', true, mul, result.clone()]);
    }
  }

  // leech (brassica-copying), only computed for the pretend cases, non-pretend leech: brassica copying's actual gameplay computation is done in precomputeField() intead
  // this computation is only used for UI/tooltips/dialogs. It is not guaranteed to be correct, but tries to be as much as possible since it's for UI that tells what the production will look like after all crops are fullgrown (for gain_expected and gain_expected_hyp)
  if(pretend == 2 && this.type == CROPTYPE_BRASSICA && f) {
    var p = prefield[f.y][f.x];
    var leech = this.getLeech(f, pretend, null, p.getBrassicaBreakdownCroptype());
    var leech_seeds = this.getLeech(f, pretend, null, CROPTYPE_BERRY);
    if(state.challenge == challenge_towerdefense) leech_seeds = new Num(0);
    var leech_spores = this.getLeech(f, pretend, null, CROPTYPE_MUSH);
    var leech_nuts = this.getLeech(f, pretend, null, CROPTYPE_NUT);
    var soup = !basic && state.squirrel_upgrades[upgradesq_watercress_mush].count; // watercress and mushroom soup upgrade, which makes leech from mushroom snot cost seeds
    var total = Res();
    var num = 0;


    var dirs = f.getNeighborDirsFrom(haveDiagonalBrassica());
    var neighbors = getNeighbors(state.field, f.x, f.y, haveDiagonalBrassica());
    for(var n = 0; n < neighbors.length; n++) {
      var f2 = state.field[neighbors[n][1]][neighbors[n][0]];
      var c2 = f2.getCrop();
      if(c2) {
        var p2 = prefield[f2.y][f2.x];
        if(c2.type == CROPTYPE_BERRY || c2.type == CROPTYPE_MUSH || c2.type == CROPTYPE_NUT || c2.type == CROPTYPE_PUMPKIN) {
          //total.addInPlace(p2.prod0); // TODO: this is not correct if crops are growing, since precompute is done taking growing into account while pretend does not. To be correct, instead recursively getProd of those neighbors should be called here. However this additional complexity is not super important to implement because pretend == 2 is for display purposes only
          total.addInPlace(c2.getProd(f2, pretend));
          num++;
        }
      }
    }
    //total.mulInPlace(leech);
    total.seeds.mulInPlace(leech_seeds);
    total.spores.mulInPlace(leech_spores);
    total.nuts.mulInPlace(leech_nuts);
    if(soup && total.seeds.ltr(0)) total.seeds = new Num(0);
    result.addInPlace(total);
    if(breakdown) {
      if(!total.empty()) {
        if(leech.ltr(1)) {
          breakdown.push(['copy reduction due to multiple watercress globally', true, leech, undefined]);
        }
        breakdown.push(['<span class="efWatercressHighlight">copying neighbors (' + num + ')</span>', false, total, result.clone()]);
      } else {
        breakdown.push(['no neighbors, not copying', false, total, result.clone()]);
      }
    }
  }

  /*if(this.type == CROPTYPE_MUSH && seed_consumption_mul != 1.0) {
    result.seeds.mulrInPlace(seed_consumption_mul); // for testing only
  }*/

  return result;
};


// The result is the added value, e.g. a result of 0.5 means a multiplier of 1.5, or a bonus of +50%
// this function requires that bee boost and stinging malus were already computed by precomputeField, unless pretend is non-0
// pretend: see comment at the definition of getProd
Crop.prototype.getBoost = function(f, pretend, breakdown) {
  if(this.type != CROPTYPE_FLOWER && this.type != CROPTYPE_STINGING) return Num(0);

  var result = this.boost.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  var basic = basicChallenge();

  // this adjustment is for the thistle, when you unlock it and due to having so many regular nettle upgrades, thistle would be worse
  // since nettle tiers are so rare, it's worth applying such fix for this case
  // normally thistle's base boost is high enough that this should rarely happen, only if nettle was already upgraded very highly, and thistle upgrade is not yet available while it's already growing
  if(this.index == nettle_1 && !pretend && state.challenge != challenge_thistle) {
    var nettle_upgraded = crops[nettle_0].getBoost(null, 1);
    var thistle_upgraded = crops[nettle_1].getBoost(null, 1);
    if(nettle_upgraded.gt(thistle_upgraded)) {
      var adjust = nettle_upgraded.div(thistle_upgraded);
      result.mulInPlace(adjust);
      if(breakdown) breakdown.push(['adjust', true, adjust, result.clone()]);
    }
  }
  // idem for poison ivy
  if(this.index == nettle_2 && !pretend && state.challenge != challenge_poisonivy) {
    var thistle_upgraded = crops[nettle_1].getBoost(null, 1);
    var poisonivy_upgraded = crops[nettle_2].getBoost(null, 1);
    if(thistle_upgraded.gt(poisonivy_upgraded)) {
      var adjust = thistle_upgraded.div(poisonivy_upgraded);
      result.mulInPlace(adjust);
      if(breakdown) breakdown.push(['adjust', true, adjust, result.clone()]);
    }
  }

  if(!pretend && f && (!f.isFullGrown() || state.challenge == challenge_wither)) {
    // wither challenge
    if(state.challenge == challenge_wither) {
      var t = Num(witherCurve(f.growth));
      result.mulInPlace(t);
      if(breakdown) breakdown.push(['withering', true, t, result.clone()]);
    } else {
      var t = Num(f.growth);
      result.mulInPlace(t);
      if(breakdown) breakdown.push(['growing', true, t, result.clone()]);
    }
  }

  // upgrades
  if(this.basic_upgrade != null) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {
      var n = u.count;
      if(this.type == CROPTYPE_STINGING) {
        n = Math.pow(n, nettle_upgrade_power_exponent);
      }
      var mul_upgrade = u2.bonus.mulr(n).addr(1); // the flower upgrades are additive, unlike the crop upgrades which are multiplicative. This because the flower bonus itself is already multiplicative to the plants.
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push([' upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
      // example: if without upgrades boost was +50%, and now 16 upgrades of 10% each together add 160%, then result will be 130%: 0.5*(1+16*0.1)=1.3
    }
  }

  var season = getSeason();
  this.addSeasonBonus_(result, season, f, breakdown);

  // fruit
  if(basic != 2) {
    if(this.type == CROPTYPE_FLOWER) {
      var level = getFruitAbility(FRUIT_FLOWERBOOST, true);
      if(level > 0) {
        var mul = getFruitBoost(FRUIT_FLOWERBOOST, level, getFruitTier(true)).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_FLOWERBOOST), true, mul, result.clone()]);
      }
    }

    if(this.type == CROPTYPE_STINGING) {
      var level = getFruitAbility(FRUIT_NETTLEBOOST, true);
      var mul0;
      if(level > 0) {
        var mul = getFruitBoost(FRUIT_NETTLEBOOST, level, getFruitTier(true)).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_NETTLEBOOST), true, mul, result.clone()]);
        mul0 = mul;
      }
      var level2 = getFruitAbility(FRUIT_MIX, true);
      if(level2 > 0) {
        var mul;
        if(level > 0) {
          mul = getFruitBoost(FRUIT_MIX, level2, getFruitTier(true)).mulr(mix_mul_nettle).addr(1);
          // combined with pure nettle ability. Don't take the cube root now, that'd cripple it too much in this case,
          // instead make it additive. Which still cripples it a lot (it's worth only in the order of 2x, while the pure nettle ability is like 10000x or so, but at least it's not 1.02x which it'd be if we also did cuberoot thing now)
          var sum = mul.add(mul0).subr(1); // effective combined multiplier
          mul = sum.div(mul0);
        } else {
          // adjust with that cuberoot-ish power
          mul = getFruitBoost(FRUIT_MIX, level2, getFruitTier(true)).mulr(mix_mul_nettle).addr(1).powr(mix_pow_nettle);
        }
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_MIX), true, mul, result.clone()]);
      }
    }
  }

  if(!basic) {
    // ethereal crops bonus to basic crops
    if(this.type == CROPTYPE_FLOWER) {
      var ethereal_boost = state.ethereal_flower_bonus.addr(1);
      if(ethereal_boost.neqr(1)) {
        result.mulInPlace(ethereal_boost);
        if(breakdown) breakdown.push(['ethereal crops', true, ethereal_boost, result.clone()]);
      }
    }
    if(this.type == CROPTYPE_STINGING) {
      var ethereal_boost = state.ethereal_nettle_bonus.addr(1);
      if(ethereal_boost.neqr(1)) {
        result.mulInPlace(ethereal_boost);
        if(breakdown) breakdown.push(['ethereal crops', true, ethereal_boost, result.clone()]);
      }
    }

    if(haveSquirrel()) {
      if(this.type == CROPTYPE_STINGING) {
        if(state.squirrel_upgrades[upgradesq_nettle].count) {
          var bonus = upgradesq_nettle_bonus.mulr(state.squirrel_upgrades[upgradesq_nettle].count).addr(1);
          result.mulInPlace(bonus);
          if(breakdown) breakdown.push(['squirrel upgrades', true, bonus, result.clone()]);
        }
      }
      if(this.type == CROPTYPE_FLOWER) {
        if(state.squirrel_upgrades[upgradesq_flower].count) {
          var bonus = upgradesq_flower_bonus.mulr(state.squirrel_upgrades[upgradesq_flower].count).addr(1);
          result.mulInPlace(bonus);
          if(breakdown) breakdown.push(['squirrel upgrades', true, bonus, result.clone()]);
        }
        if(state.crops[this.index].prestige && state.squirrel_upgrades[upgradesq_prestiged_flower].count) {
          var bonus = upgradesq_prestiged_flower_bonus.mulr(state.squirrel_upgrades[upgradesq_prestiged_flower].count).addr(1);
          bonus = bonus.powr(state.crops[this.index].prestige); // applies multiple times for multiple prestiges
          result.mulInPlace(bonus);
          if(breakdown) breakdown.push(['squirrel prestiged', true, bonus, result.clone()]);
        }
      }
    }

    if(this.type == CROPTYPE_STINGING) {
      if(haveEtherealMistletoeUpgrade(mistle_upgrade_stingy)) {
        var mul = getEtherealMistletoeBonus(mistle_upgrade_stingy).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['ethereal mistletoe', true, mul, result.clone()]);
      }
    }
  }

  if(state.challenge == challenge_stormy && this.type == CROPTYPE_FLOWER) {
    var malus = Num(0.5);
    result.mulInPlace(malus);
    if(breakdown) breakdown.push(['stormy', true, malus, result.clone()]);
  }

  // rainbow
  if(this.type == CROPTYPE_FLOWER) {
    if(rainbowActive()) {
      var bonus_rainbow = getRainbowFlowerBoost();
      bonus_rainbow.addrInPlace(1);
      result.mulrInPlace(bonus_rainbow);
      if(breakdown) breakdown.push(['rainbow', true, bonus_rainbow, result.clone()]);
    } else if(havePermaWeatherFor(2)) {
      var bonus_rainbow = getRainbowFlowerBoost(true);
      bonus_rainbow.addrInPlace(1);
      result.mulrInPlace(bonus_rainbow);
      if(breakdown) breakdown.push(['rainbow (inactive)', true, bonus_rainbow, result.clone()]);
    }
  }

  if(!basic) {
    // multiplicity
    if((this.type == CROPTYPE_FLOWER || this.type == CROPTYPE_STINGING) && haveMultiplicity(this.type)) {
      // multiplicity only works by fully grown crops, not for intermediate growing ones
      var num = getMultiplicityNum(this);
      if(num > 0) {
        var boost = getMultiplicityBonusBase(this.type).mulr(num).addr(1);
        result.mulInPlace(boost);
        if(breakdown) breakdown.push(['multiplicity (' + ((num == Math.floor(num)) ? num.toString() : num.toPrecision(3)) + ')', true, boost, result.clone()]);
      }
    }

    // bee challenge
    if(state.challenge == challenge_bees) {
      var bonus_bees = getWorkerBeeBonus().addr(1);
      result.posmulInPlace(bonus_bees);
      if(breakdown) breakdown.push(['worker bees (challenge)', true, bonus_bees, result.clone()]);
    }
  }


  if(basic != 2) {
    // bees boostboost
    if(f && (this.type == CROPTYPE_FLOWER)) {
      var p = prefield[f.y][f.x];
      var num = p.num_bee;
      var bonus;
      if(pretend) {
        bonus = this.computeBeehiveBoostReceived_(f, pretend).addr(1);
      } else {
        bonus = p.beeboostboost_received.addr(1);
      }

      if(num > 0) {
        result.mulInPlace(bonus);
        if(breakdown) breakdown.push(['bees (' + num + ')', true, bonus, result.clone()]);
      }
    }
  }

  // nettle negatively affecting flowers
  if(f && (this.type == CROPTYPE_FLOWER)) {
    var p = prefield[f.y][f.x];
    var num = p.num_nettle;
    var malus;
    if(pretend) malus = this.computeNettleMalusReceived_(f, pretend);
    else malus = p.nettlemalus_received;

    if(num > 0) {
      result.mulInPlace(malus);
      if(breakdown) breakdown.push(['stingy crops malus (' + num + ')', true, malus, result.clone()]);
    }
  }

  return result;
};


// bee boosting the boost of flowers
Crop.prototype.getBoostBoost = function(f, pretend, breakdown) {
  var result = Num(0);

  var basic = basicChallenge();

  var hasboostboost = false;
  if(this.type == CROPTYPE_BEE) hasboostboost = true;
  // bee challenge crops. There's also special handling for these in precomputeField_(), but getBoostBoost is also used for them
  if(this.index == challengecrop_0) hasboostboost = true;
  if(this.index == challengecrop_1) hasboostboost = true;
  if(this.index == challengecrop_2) hasboostboost = true;

  if(!hasboostboost) {
    if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);
    return result;
  }

  result = this.boost.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  if(!pretend && f && (!f.isFullGrown() || state.challenge == challenge_wither)) {
    if(this.type == CROPTYPE_CHALLENGE) {
      // do nothing: the bee challenge bees give their boost immediately, even while growing
    } else {
      // wither challenge
      if(state.challenge == challenge_wither) {
        var t = Num(witherCurve(f.growth));
        result.mulInPlace(t);
        if(breakdown) breakdown.push(['withering', true, t, result.clone()]);
      } else {
        var t = Num(f.growth);
        result.mulInPlace(t);
        if(breakdown) breakdown.push(['growing', true, t, result.clone()]);
      }
    }
  }

  // upgrades
  if(this.basic_upgrade != null) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {

      var n = Num(u.count);
      n.powrInPlace(beehive_upgrade_power_exponent);
      var mul_upgrade = u2.bonus.mulr(n).addr(1);
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push([' upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
      // example: if without upgrades boost was +50%, and now 16 upgrades of 10% each together add 160%, then result will be 130%: 0.5*(1+16*0.1)=1.3
    }
  }

  // fruit
  if(basic != 2) {
    if(this.type == CROPTYPE_BEE) {
      var level = getFruitAbility(FRUIT_BEEBOOST, true);
      var mul0;
      if(level > 0) {
        var mul = getFruitBoost(FRUIT_BEEBOOST, level, getFruitTier(true)).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_BEEBOOST), true, mul, result.clone()]);
        mul0 = mul;
      }
      var level2 = getFruitAbility(FRUIT_MIX, true);
      if(level2 > 0) {
        var mul;
        if(level > 0) {
          mul = getFruitBoost(FRUIT_MIX, level2, getFruitTier(true)).mulr(mix_mul_bee).addr(1);
          // combined with pure bee ability. Don't take the cube root now, that'd cripple it too much in this case,
          // instead make it additive. Which still cripples it a lot (it's worth only in the order of 2x, while the pure bee ability is like 10000x or so, but at least it's not 1.02x which it'd be if we also did cuberoot thing now)
          var sum = mul.add(mul0).subr(1); // effective combined multiplier
          mul = sum.div(mul0);
        } else {
          // adjust with that cuberoot-ish power
          mul = getFruitBoost(FRUIT_MIX, level2, getFruitTier(true)).mulr(mix_mul_bee).addr(1).powr(mix_pow_bee);
        }
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_MIX), true, mul, result.clone()]);
      }
    }
  }

  if(!basic) {
    if(haveSquirrel()) {
      if(this.type == CROPTYPE_BEE) {
        if(state.squirrel_upgrades[upgradesq_bee].count) {
          var bonus = upgradesq_bee_bonus.mulr(state.squirrel_upgrades[upgradesq_bee].count).addr(1);
          result.mulInPlace(bonus);
          if(breakdown) breakdown.push(['squirrel upgrades', true, bonus, result.clone()]);
        }
      }
    }

    // multiplicity
    if((this.type == CROPTYPE_BEE) && haveMultiplicity(this.type)) {
      // multiplicity only works by fully grown crops, not for intermediate growing ones
      var num = getMultiplicityNum(this);
      if(num > 0) {
        var boost = getMultiplicityBonusBase(this.type).mulr(num).addr(1);
        result.mulInPlace(boost);
        if(breakdown) breakdown.push(['multiplicity (' + ((num == Math.floor(num)) ? num.toString() : num.toPrecision(3)) + ')', true, boost, result.clone()]);
      }
    }

    // ethereal crops bonus to basic crops
    if(this.type == CROPTYPE_BEE) {
      var ethereal_boost = state.ethereal_bee_bonus.addr(1);
      if(ethereal_boost.neqr(1)) {
        result.mulInPlace(ethereal_boost);
        if(breakdown) breakdown.push(['ethereal crops', true, ethereal_boost, result.clone()]);
      }
    }

    if(this.type == CROPTYPE_BEE) {
      if(haveEtherealMistletoeUpgrade(mistle_upgrade_bee)) {
        var mul = getEtherealMistletoeBonus(mistle_upgrade_bee).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['ethereal mistletoe', true, mul, result.clone()]);
      }
    }
  }

  this.addSeasonBonus_(result, getSeason(), f, breakdown);

  return result;
};

function hasBrassicaInfiniteLifetime(c) {
  if(c.type != CROPTYPE_BRASSICA) return false;
  if(state.upgrades[watercress_choice0].count == 0) return false;
  return true;
}

// whether it's a brassica that is post the stage where it normally withers, for the sturdy brassica choice upgrade
Crop.prototype.isPostLife = function(f) {
  if(!f) return false; // can't determine
  if(f.growth > 0.001) return false; // still full life
  return hasBrassicaInfiniteLifetime(this);
};

// This returns the leech ratio of this plant, not the actual resource amount leeched
// Only correct for already planted leeching plants (for the penalty of multiple planted ones computation)
// pretend: see explanation of getProd for the meaning and values of this parameter
// croptype: which croptype we're leeching from (CROPTYPE_BERRY, CROPTYPE_MUSH or CROPTYPE_NUTS)
// aka Crop.prototype.getCopy
Crop.prototype.getLeech = function(f, pretend, breakdown, croptype) {
  if(croptype == CROPTYPE_PUMPKIN) croptype = CROPTYPE_BERRY; // pumpkin acts as berry for this
  if(this.type != CROPTYPE_BRASSICA) {
    var result = Num(0);
    if(breakdown) breakdown.push(['none', true, Num(0), result.clone()]);
    return Res();
  }

  var basic = basicChallenge();

  var result = Num(this.leech || 1);
  if(breakdown) breakdown.push(['base', true, Num(1), result.clone()]);

  if(state.challenge == challenge_towerdefense) {
    var mul = Num(0.25);
    result.mulInPlace(mul);
    if(breakdown) breakdown.push(['tower defense', true, mul, result.clone()]);
    return result;
  }

  var result_infernal = undefined; // result with only the negative effects applied, for infernal. Not used for the current infernal challenge, but maybe the next one in this series?
  //if(state.challenge == challenge_infernal) {
  //  result_infernal = Num(result);
  //}

  var sturdy = state.upgrades[watercress_choice0].count == 1;
  var highyield = state.upgrades[watercress_choice0].count == 2;
  var end_of_life = this.isPostLife(f);

  if(state.upgrades[watercress_choice0].count == 2) {
    // high-yield brassica: starts with high bonus but gradually drops down (given the long brassica lifetimes late in game, very slowly)
    var v = Math.min(Math.max(0, f.growth), 1);
    if(v > 0.01) {
      if(v < 0.75) {
        var w = v / 0.75;
        v = w * w * w * (w * (w * 6 - 15) + 10); // smootherstep: s curve shaped downwards production trend from the +50% bonus down to regular production
      } else {
        v = 1;
      }
      var mul = Num(1 + v * 0.5);
      result.mulInPlace(mul);
      if(breakdown) breakdown.push(['high-yield brassica choice upgrade', true, mul, result.clone()]);
    }
  }

  if(state.upgrades[watercress_choice0].count == 1) {
    var mul = Num(1.25);
    result.mulInPlace(mul);
    if(breakdown) breakdown.push(['sturdy brassica choice upgrade', true, mul, result.clone()]);
  }

  if(end_of_life) {
    mul = new Num(sturdy ? 0.45 : 0.15);
    result.mulInPlace(mul);
    if(breakdown) breakdown.push(['end-of-life', true, mul, result.clone()]);
    if(result_infernal) result_infernal.mulInPlace(mul);
  }

  var season = getSeason();

  var winter_weakness = season == 3;
  if(f) {
    var p = prefield[f.y][f.x];
    if(p.treeneighbor) winter_weakness = false;
  }

  if(winter_weakness) {
    var mul = winter_malus_brassica;
    result.mulInPlace(mul);
    if(breakdown) breakdown.push(['winter malus', true, mul, result.clone()]);
    if(result_infernal) result_infernal.mulInPlace(mul);
  }

  if(croptype != CROPTYPE_NUT && pretend != 6) {
    var level = getFruitAbility(FRUIT_BRASSICA, true);
    var level2 = getFruitAbility(FRUIT_MIX, true);
    if((level > 0 || level2 > 0) && state.challenge != challenge_wasabi) {
      var mul = level > 0 ? getFruitBoost(FRUIT_BRASSICA, level, getFruitTier(true)).addr(1) : (new Num(1));
      var mix_pow = (croptype == CROPTYPE_BERRY) ? mix_pow_brassica_berry : mix_pow_brassica_mush;

      var mul_b = mul; // multiplier of pure brassica ability part only
      var mul_m = null; // multiplier of fruit mix ability, combined with mul_b to form the final mul

      if(level2 > 0) {
        if(level > 0) {
          // pure brassica ability also present, merely additively add this one, and without the cuberoot-ish reduction
          var mul2 = getFruitBoost(FRUIT_MIX, level2, getFruitTier(true)).mulr(mix_mul_brassica).addr(1);
          var sum = mul.add(mul2).subr(1); // effective combined multiplier
          mul_m = sum.div(mul_b);
          mul = sum;
        } else {
          var b = getFruitBoost(FRUIT_MIX, level2, getFruitTier(true)).mulr(mix_mul_brassica);

          // normally, like for bee and nettle for FRUIT_MIX, the formula for mul_m would now be: mul_m = b.addr(1).powr(mix_pow), where 1 is added to turn bonus into multiplier, then the power applied
          // however, brassica copying is not itself the actual bonus / multiplier you get from crops: if brassica copying is 100% it multiplies production by 2x. If there's a bonus of 50% (1.5x) added here, then it doesn't multiply production by 1.5x, but instead it brings it from 2x to 2.5x, effectively a bonus of only 25%
          // to compensate for FRUIT_MIX's multiple abilities, a power is applied (that has roughtly the effect of: "FRUIT_MIX has 3 abilities, so take cuberoot of each multiplier")
          // but we want to apply that cuberoot to the effect on production, not on the effect on the bonus on the brassica
          // that's what the code below tries to achieve. This makes the mix fruit in between the brassica fruit and bee fruit on berries (if its base multiplier used in getFruitBoost is 1 at least), but only if all berries (at least those with highest production) touch brassica. If there are more berries than that, then pure bee fruit, or pure brassica fruit, do better than the mix.
          var m = b.addr(1); // turn bonus into multiplier
          var r0 = result.addr(1); // the result on global production (global here only referring to berries copied by this brassica, but global as opposed to looking at bonus on brassica copying itself only), without this bonus at all
          var r1 = result.mul(m).addr(1); // the result on global production, with full b (non cuberoot corrected) applied
          //var m2 = r1.div(r0).powr(mix_pow); // take the cube root (roughly, mix_pow is not 1/3) of the result that going from r0 to r1 has on global production
          var m2 = r1.div(r0).addr(1).powr(mix_pow).subr(1); // take the cube root (roughly, mix_pow is not 1/3) of the result that going from r0 to r1 has on global production. The extra addr(1) and subr(1) are to make it also work in case of very low multipliers (like during basic challenge). TODO: verify if that is correct
          var r2 = result.addr(1).mul(m2); // apply the cube rooted bonus to global production (the addr(1) is before the mul now, since we're computing the effect m2 has on r0)
          var c = r2.div(result); // the multiplier that we actually need now, to get to the effect of r2, but in terms of brassica copying itself instead of on global production

          mul_m = c;
          mul = mul_b.mul(mul_m);
        }
      }
      var winter_malus = Num(1);

      if(winter_weakness) {
        // the winter malus affects the fruit multipleir, but not the base 100% that it's added to, so it's slightly differnt (very different if fruit is less than +100% bonus)
        var mul2 = mul.subr(1).mul(winter_malus_brassica).addr(1);
        winter_malus = mul2.div(mul);
      }

      if(level > 0) {
        result.mulInPlace(mul_b);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_BRASSICA), true, mul_b, result.clone()]);
      }
      if(level2 > 0) {
        result.mulInPlace(mul_m);
        if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_MIX), true, mul_m, result.clone()]);
      }

      if(winter_weakness) {
        result.mulInPlace(winter_malus);
        if(breakdown) breakdown.push(['winterfruit effect weakness', true, winter_malus, result.clone()]);
      }
    }
    if(!basic) {
      var ethereal_boost = state.ethereal_brassica_bonus.addr(1);
      if(ethereal_boost.neqr(1)) {
        result.mulInPlace(ethereal_boost);
        if(breakdown) breakdown.push(['ethereal crops', true, ethereal_boost, result.clone()]);
      }

      if(state.squirrel_upgrades[upgradesq_watercresstime2].count) {
        var mul = Num(1.5);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['squirrel: brassica space-time', true, mul, result.clone()]);
      }

      if(haveEtherealMistletoeUpgrade(mistle_upgrade_brassica)) {
        var mul = getEtherealMistletoeBonus(mistle_upgrade_brassica).addr(1);
        result.mulInPlace(mul);
        if(breakdown) breakdown.push(['ethereal mistletoe: brassica', true, mul, result.clone()]);
      }
    }
  }

  if(croptype == CROPTYPE_NUT && pretend != 6) {
    var mul = Num(0.5);
    result.mulInPlace(mul);
    if(breakdown) breakdown.push(['copying from nuts', true, mul, result.clone()]);
    if(result_infernal) result_infernal.mulInPlace(mul);
  }

  // add a penalty for the neighbor production copy-ing if there are multiple watercress in the field. The reason for this is:
  // the watercress neighbor production copying is really powerful, and if every single watercress does this at full power, this would require way too active play, replanting watercresses in the whole field all the time.
  // encouraging to plant one or maybe two (but diminishing returns that make more almost useless) strikes a good balance between doing something useful during active play, but still getting reasonable income from passive play
  var numsame = state.croptypecount[this.type];
  if(numsame > 1 && state.challenge != challenge_towerdefense) {
    // before v0.1.88, this formula was: 1 / (1 + (numsame - 1) * 0.75). But not it got tweaked to make 2 watercress less punishing, but more than 3 watercress more punishing.
    var penalty = Math.pow(0.66, numsame - 1.5);
    result.mulrInPlace(penalty);

    if(breakdown) breakdown.push(['reduction for multiple', true, Num(penalty), result.clone()]);
    if(result_infernal) result_infernal.mulrInPlace(penalty);
  }

  /*if(state.challenge == challenge_infernal && season == 5 && this.tier >= 0) {
    var malus = Num(1e-9);
    if(this.type == CROPTYPE_BRASSICA && result.mul(malus).lt(result_infernal) && result.neqr(0)) {
      // for brassica, keep the leech at least as much as initial game brassica: so that it's possible to play infermal without having fern in ethereal field in theory
      malus = result_infernal.div(result);
    }
    result.mulInPlace(malus);
    if(breakdown) breakdown.push(['infernal', true, malus, result.clone()]);
  }*/

  return result;
};

var registered_crops = []; // indexed consecutively, gives the index to crops
var crops = []; // indexed by crop index

// 2D: array of arrays, first index is croptype, second index is tier, value is crop of that tier for that cropindex
var croptype_tiers = [];

// 16-bit ID, auto incremented with registerCrop, but you can also set it to a value yourself, to ensure consistent IDs for various crops (between savegames) in case of future upgrades
var crop_register_id = -1;

function registerCrop(name, cost, prod, boost, planttime, image, opt_tagline, opt_croptype, opt_tier) {
  if(!image) image = missingplant;
  if(crops[crop_register_id] || crop_register_id < 0 || crop_register_id > 65535) throw 'crop id already exists or is invalid!';
  var crop = new Crop();
  crop.index = crop_register_id++;
  crops[crop.index] = crop;
  registered_crops.push(crop.index);

  crop.name = name;
  crop.cost = cost;
  crop.prod = prod;
  crop.planttime = planttime || 0;
  crop.image = image;
  crop.tagline = opt_tagline || '';
  crop.boost = boost;

  crop.type = opt_croptype;
  crop.tier = opt_tier;
  crop.tier_non_prestiged = opt_tier;

  if(opt_croptype != undefined && opt_tier != undefined) {
    if(!croptype_tiers[opt_croptype]) croptype_tiers[opt_croptype] = [];
    // the undefined check makes the first registered crop of this tier win, and this makes templates win from ghosts (which both use tier -1, but for the downgrade crop functionality you want to downgrade to templates)
    if(croptype_tiers[opt_croptype][opt_tier] == undefined) {
      croptype_tiers[opt_croptype][opt_tier] = crop;
    }
  }

  crop.prod0 = Res(crop.prod);
  crop.planttime0 = crop.planttime;

  return crop.index;
}

function registerBerry(name, tier, planttime, image, opt_tagline) {
  var cost = getBerryCost(tier);
  var prod = getBerryProd(tier);
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline, CROPTYPE_BERRY, tier);
  //var crop = crops[index];
  return index;
}

function registerMushroom(name, tier, planttime, image, opt_tagline) {
  var cost = getMushroomCost(tier);
  var prod = getMushroomProd(tier);
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline, CROPTYPE_MUSH, tier);
  //var crop = crops[index];
  return index;
}

function registerNut(name, tier, planttime, image, opt_tagline) {
  var cost = getNutCost(tier);
  var prod = getNutProd(tier);
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline, CROPTYPE_NUT, tier);
  //var crop = crops[index];
  return index;
}

function registerFlower(name, tier, boost, planttime, image, opt_tagline) {
  var cost = getFlowerCost(tier);
  var index = registerCrop(name, cost, Res({}), boost, planttime, image, opt_tagline, CROPTYPE_FLOWER, tier);
  //var crop = crops[index];
  return index;
}

function registerNettle(name, tier, boost, planttime, image, opt_tagline) {
  var cost = getNettleCost(tier);
  var index = registerCrop(name, cost, Res({}), boost, planttime, image, opt_tagline, CROPTYPE_STINGING, tier);
  //var crop = crops[index];
  return index;
}

function registerBrassica(name, tier, prod, leech, planttime, image, opt_tagline) {
  var cost = Res({seeds:Math.pow(10, (tier + 1))});
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline, CROPTYPE_BRASSICA, tier);
  var crop = crops[index];
  crop.leech = leech;
  return index;
}

function registerMistletoe(name, tier, planttime, image, opt_tagline) {
  var cost = getFlowerCost(0).mulr(2);
  var prod = Res({});
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline, CROPTYPE_MISTLETOE, tier);
  //var crop = crops[index];
  return index;
}

function registerBeehive(name, tier, boost, planttime, image, opt_tagline) {
  var cost = getBeeCost(tier);
  var index = registerCrop(name, cost, Res({}), Num(0), planttime, image, opt_tagline, CROPTYPE_BEE, tier);
  var crop = crops[index];
  crop.boost = boost;
  return index;
}

function registerSquirrel(name, tier, cost, planttime, image, opt_tagline) {
  var index = registerCrop(name, cost, Res({}), Num(0), planttime, image, opt_tagline, CROPTYPE_SQUIRREL, tier);
  //var crop = crops[index];
  return index;
}

function registerChallengeCrop(name, tier, cost, planttime, image, opt_tagline) {
  var index = registerCrop(name, cost, Res({}), Num(0), planttime, image, opt_tagline, CROPTYPE_CHALLENGE, tier);
  //var crop = crops[index];
  return index;
}

function registerPumpkinCrop(name, tier, cost, planttime, image, opt_tagline) {
  var index = registerCrop(name, cost, Res({}), Num(0), planttime, image, opt_tagline, CROPTYPE_PUMPKIN, tier);
  //var crop = crops[index];
  return index;
}


// should return 1 for i=0
function getBerryBase(i) {
  return Num.rpow(2000, Num(i));
}


function getBerryCost(i) {
  var seeds;
  if(i < 1) {
    // the first tiers are manually tuned
    // the first values are: 0:1K, 1:40K, 2:120M
    if(i == 0) {
      seeds = Num(1000);
    } else {
      seeds = Num.rpow(40, Num(i)).mulr(1000);
    }
  } else {
    seeds = getBerryBase(i);
    seeds.mulrInPlace(20);
    // for higher tier berries, the cost is increased more than the production.
    // the reason is the ratio between production and consumption as the player progresses: upgrades, fruits, ... significantly increase the berry production over the base production from getBerryProd
    // that means that for higher level players, a berry that is planted would produce much more than its own plant cost in fractions of a second
    // so the difficulty must be upped for higher tier berries.
    var i2 = i;
    // for prestiging, which for berries starts at tier 16, make the penalty slightly less for the first few to give a bit of a moment of faster progress there
    if(i >= 16) i2 -= 0.7251225; // this value is chosen such that the cost of the prestige will be almost exactly 1e90 berries, a nice round number which is close enough to what would have been chosen here anyway, it's a bit on the cheaper side because it's only 3x as expensive as the truffle.
    if(i >= 17) i2 -= (1 - 0.7251225);
    seeds.mulInPlace(Num.rpow(1.5, Num((i2 - 1) * (i2 - 1))));
  }
  seeds = Num.roundNicely(seeds);
  return Res({seeds:seeds});
}

function getBerryProd(i) {
  var seeds = getBerryBase(i);
  seeds.mulrInPlace(2);
  if(i == 0) seeds.mulrInPlace(2);
  seeds.mulInPlace(Num.rpow(0.35, Num(i)));
  return Res({seeds:seeds});
}


function getMushroomCost(i) {
  // Mushrooms start after berry 1, and then appear after every 2 berries.
  return getBerryCost(1.5 + i * 2);
}

function getMushroomProd(i) {
  var seeds = getBerryProd(2 + i * 2).seeds.neg();
  var seeds0 = getBerryProd(2 + 0 * 2).seeds.neg();

  var spores = seeds.div(seeds0).mulr(1);

  // higher tier mushrooms get a slightly more efficient spores/seed ratio, this also helps make longer runtimes (1-2 hours instead of 20 minutes) more worth it
  if(i > 1) spores.mulrInPlace(Math.pow(1.25, i - 1));

  return Res({seeds:seeds, spores:spores});
}

// at what tree level do nuts plants get unlocked (and their cost adjusted to spore amounts relevant for that tree level)
var nut_tree_level = 45;
// how the unlock/plant/upgrade costs of next nut crop tiers scale: how many more tree levels of spore-worth more expensive the next tier is
// e.g. if this is 3, then if your tree level is 3 levels higher, you can afford the next nut tier
var nut_tree_step = 6;

// how many upgrades of a nut before it reaches the level of the next tier nut
var nut_upgrade_steps = 20;

function getNutCost(i) {
  return treeLevelReqBase(nut_tree_level + i * nut_tree_step).mulr(1.5);
}

function getNutProd(i) {
  var nuts = Num.pow(Num(1000), Num(i)).mulr(0.05);
  return Res({nuts:nuts});
}

function getFlowerCost(tier) {
  // Flowers start after berry 2, and then appear after every 2 berries.
  return getBerryCost(0.5 + tier * 2);
}

function getFlowerBoost(tier) {
  if(tier == 0) return Num(0.5);
  if(tier == 1) return Num(2);
  return Num(0.5).mul(Num(16).powr(tier - 1));
}

function getNettleCost(tier) {
  var mushtier = tier * 4 + 1;
  if(tier == 2) mushtier = 10; // TODO: add formula for tier 3+
  return getMushroomCost(0.05 + mushtier);
}

function getBeeCost(tier) {
  // Beehives start at flower_3, next one is at flower_7
  return getFlowerCost(3 + tier * 4 + 0.15);
}

var berryplanttime0 = 60;
var mushplanttime0 = 60;
var nutplanttime0 = 60;
var flowerplanttime0 = 90;
var nettleplanttime0 = 15;

// berries: give seeds
crop_register_id = 25;
var berry_0 = registerBerry('blackberry', 0, berryplanttime0 * 1, blackberry);
var berry_1 = registerBerry('blueberry', 1, berryplanttime0 * 2, blueberry);
var berry_2 = registerBerry('cranberry', 2, berryplanttime0 * 4, cranberry);
var berry_3 = registerBerry('currant', 3, berryplanttime0 * 8, currant);
var berry_4 = registerBerry('goji', 4, berryplanttime0 * 12, goji);
var berry_5 = registerBerry('gooseberry', 5, berryplanttime0 * 16, gooseberry);
var berry_6 = registerBerry('grape', 6, berryplanttime0 * 20, grape);
var berry_7 = registerBerry('honeyberry', 7, berryplanttime0 * 25, honeyberry);
var berry_8 = registerBerry('juniper', 8, berryplanttime0 * 30, juniper);
var berry_9 = registerBerry('lingonberry', 9, berryplanttime0 * 35, lingonberry);
var berry_10 = registerBerry('mulberry', 10, berryplanttime0 * 40, mulberry);
var berry_11 = registerBerry('physalis', 11, berryplanttime0 * 45, physalis);
var berry_12 = registerBerry('raspberry', 12, berryplanttime0 * 50, raspberry);
var berry_13 = registerBerry('strawberry', 13, berryplanttime0 * 55, strawberry, 'Botanically speaking, not actually a berry!');
var berry_14 = registerBerry('wampee', 14, berryplanttime0 * 60, images_wampee);
var berry_15 = registerBerry('whitecurrant', 15, berryplanttime0 * 65, whitecurrant);

// mushrooms: give spores
crop_register_id = 50;
var mush_0 = registerMushroom('champignon', 0, mushplanttime0 * 1, champignon);
var mush_1 = registerMushroom('matsutake', 1, mushplanttime0 * 3, matsutake);
var mush_2 = registerMushroom('morel', 2, mushplanttime0 * 6, morel);
var mush_3 = registerMushroom('muscaria', 3, mushplanttime0 * 10, amanita, 'amanita muscaria'); // names are alphabetical, but amanita counts as "muscaria" because it's not well suited to be the lowest tier mushroom with letter a
var mush_4 = registerMushroom('oyster mushroom', 4, mushplanttime0 * 15, images_oyster);
var mush_5 = registerMushroom('portobello', 5, mushplanttime0 * 20, portobello);
var mush_6 = registerMushroom('shiitake', 6, mushplanttime0 * 25, shiitake);
var mush_7 = registerMushroom('truffle', 7, mushplanttime0 * 30, truffle);

// flowers: give boost to neighbors
crop_register_id = 75;
var flower_0 = registerFlower('anemone', 0, getFlowerBoost(0), flowerplanttime0, images_anemone);
var flower_1 = registerFlower('clover', 1, getFlowerBoost(1), flowerplanttime0 * 3, images_clover);
var flower_2 = registerFlower('cornflower', 2, getFlowerBoost(2), flowerplanttime0 * 6, images_cornflower);
var flower_3 = registerFlower('daisy', 3, getFlowerBoost(3), flowerplanttime0 * 9, images_daisy);
var flower_4 = registerFlower('dandelion', 4, getFlowerBoost(4), flowerplanttime0 * 12, images_dandelion);
var flower_5 = registerFlower('iris', 5, getFlowerBoost(5), flowerplanttime0 * 15, images_iris);
var flower_6 = registerFlower('lavender', 6, getFlowerBoost(6), flowerplanttime0 * 18, images_lavender);
var flower_7 = registerFlower('orchid', 7, getFlowerBoost(7), flowerplanttime0 * 21, images_orchid);


crop_register_id = 100;
var nettle_0 = registerNettle('nettle', 0, Num(5), nettleplanttime0, images_nettle);
// This has so much more boost, because it has to compete against the 1.05^n scaling of the nettle upgrades that you have by the time you get this crop
var nettle_1 = registerNettle('thistle', 1, Num(375), nettleplanttime0, images_thistle);
var nettle_2 = registerNettle('poison ivy', 2, Num(100000), nettleplanttime0, images_poisonivy);

crop_register_id = 105;
var brassica_0 = registerBrassica('watercress', 0, Res({seeds:1}), Num(1), 60, images_watercress);
crops[brassica_0].image_remainder = image_watercress_remainder;
crops[brassica_0].image_post = image_watercress_post;
var brassica_1 = registerBrassica('wasabi', 1, Res({seeds:10}), Num(1.25), 75, images_wasabi);
crops[brassica_1].image_remainder = image_wasabi_remainder;
crops[brassica_1].image_post = image_wasabi_post;

crop_register_id = 110;
var mistletoe_0 = registerMistletoe('mistletoe', 0, 50, images_mistletoe);

crop_register_id = 120;
// In theory, a bee giving a 50% boost is already worth it: touching 4 flowers means getting 2 flowers worth of production bonus from 1 bee,
// spread to multiple berries touching those 4 flowers, making the bee then slightly better than putting a berry in this spot instead.
// However, to make the complexity of the bee mechanic truly worth it, and taking into account that there's likely only room for 1 or 2 on a 6x6 field,
// the bonus should be much more generous: set to 300% (3.0) now, and upgrades kan make it much higher, just like flowers reach the 10-thousands
var bee_0 = registerBeehive('bee nest', 0, Num(3.0), /*growtime=*/60, images_beenest);
var bee_1 = registerBeehive('beehive', 1, Num(243.0), /*growtime=*/120, images_beehive);

crop_register_id = 130;
// NOTE: this is squirrel in basic field instead of ethereal field. This exists for now but is unused. Code kept for in case it finds a use.
var squirrel_0 = registerSquirrel('squirrel', 0, Res(), /*growtime=*/0.5, images_squirrel);

// nuts
crop_register_id = 150;
var nut_0  = registerNut('acorn', 0, nutplanttime0 * 1, images_acorn, 'it\'s a little oak tree');
var nut_1  = registerNut('almond', 1, nutplanttime0 * 2, images_almond);
var nut_2  = registerNut('beechnut', 2, nutplanttime0 * 3, images_beech);
var nut_3  = registerNut('brazil nut', 3, nutplanttime0 * 4, images_brazilnut);
var nut_4  = registerNut('cashew', 4, nutplanttime0 * 5, images_cashew);
var nut_5  = registerNut('chestnut', 5, nutplanttime0 * 6, images_chestnut);
var nut_6  = registerNut('coconut', 6, nutplanttime0 * 7, images_coconut);
var nut_7  = registerNut('ginkgo nut', 7, nutplanttime0 * 8, images_ginkgo);
var nut_8  = registerNut('hazelnut', 8, nutplanttime0 * 9, images_hazelnut);
var nut_9  = registerNut('macadamia nut', 9, nutplanttime0 * 10, images_macademia);
var nut_10  = registerNut('peanut', 10, nutplanttime0 * 11, images_peanut);
var nut_11  = registerNut('pecan nut', 11, nutplanttime0 * 12, images_pecan);
var nut_12  = registerNut('pili nut', 12, nutplanttime0 * 13, images_pili);
var nut_13  = registerNut('pine nut', 13, nutplanttime0 * 14, images_pinenut);
var nut_14 = registerNut('pistachio', 14, nutplanttime0 * 15, images_pistachio);
var nut_15 = registerNut('walnut', 15, nutplanttime0 * 16, images_walnut);

crop_register_id = 200;

var challengecrop_0 = registerChallengeCrop('worker bee', 0, Res({seeds:20000}), 60, images_workerbee,
    'provides bonus to all crops, but only if the worker is next to a flower. This bonus is boosted if the worker is also next to a drone. Since it boosts berries, flowers, mushrooms and mushroom economy, it scales cubically rather than just linearly.');
crops[challengecrop_0].challengecroppricemul = Num(25);
crops[challengecrop_0].boost = Num(0.2);

var challengecrop_1 = registerChallengeCrop('drone', 0, Res({seeds:200000}), 90, images_dronebee, 'A male bee. Boosts orthogonally neighboring worker bees. Can be boosted by queen bee');
crops[challengecrop_1].challengecroppricemul = Num(25);
crops[challengecrop_1].boost = Num(1);

var challengecrop_2 = registerChallengeCrop('queen bee', 0, Res({seeds:2000000}), 120, images_queenbee, 'Boosts orthogonally neighboring drones');
crops[challengecrop_2].challengecroppricemul = Num(25);
crops[challengecrop_2].boost = Num(1);

var challengeflower_0 = registerCrop('aster', Res({seeds:20000}), Res({}), Num(0.1), 60, images_aster, 'Special flower only available in the bee challenge. Place worker bees orthogonally next to this flower for a global boost.');
crops[challengeflower_0].type = CROPTYPE_FLOWER;
crops[challengeflower_0].tier = 0; // this is needed to make the "ctrl+shift+selecting" display work. Since the anemone and aster (both tier 0) are never available at the same time, no confusion is possible.

crop_register_id = 210;
var challengestatue_0 = registerChallengeCrop('spore statue', 0, Res({seeds:10}), 5, images_statue_spore, 'Spore statue. Makes orthogonally or diagonally connected mushroom stronger, but reduces range. This effect stacks with multiple statues. If at least two spore statues touch a mushroom, adds the "focused" effect: does more damage to waves with small amount of pests.');
var challengestatue_1 = registerChallengeCrop('splash statue', 0, Res({seeds:10}), 5, images_statue_splash, 'Splash statue. Makes orthogonally or diagonally connected mushroom weaker, but do splash damage, which is good against groups (but not against splash resistent pests). Does not stack (one splash statue is enough)');
var challengestatue_2 = registerChallengeCrop('range statue', 0, Res({seeds:10}), 5, images_statue_range, 'Range statue. Increases range of orthogonally or diagonally connected mushroom. This effect stacks with multiple statues.');
var challengestatue_3 = registerChallengeCrop('sniper statue', 0, Res({seeds:10}), 5, images_statue_sniper, 'Sniper statue. Makes orthogonally or diagonally connected mushrooms snipers: their range covers the full map, and they hit harder, but they are much slower. Splash damage statues have less effect, the splash only works within 1-cell groups (like ticks, ...). Does not stack (one sniper statue is enough).');
var challengestatue_4 = registerChallengeCrop('snail statue', 0, Res({seeds:10}), 5, images_statue_snail, 'Snail statue. Makes orthogonally or diagonally connected mushroom weaker, but slow down pests for a while (unless slow resistent). This effect stacks for multiple statues at a single mushroom, but not from multiple mushrooms.');
var challengestatue_5 = registerChallengeCrop('seed statue', 0, Res({seeds:10}), 5, images_statue_seed, 'Seed statue. Makes orthogonally or diagonally connected mushroom weaker, but let pests drop more resources when exterminated for a while. This effect stacks for multiple statues at a single mushroom, but not from multiple mushrooms.');


// templates

var templates_for_type = [];

function makeTemplate(crop_id) {
  crops[crop_id].istemplate = true;
  crops[crop_id].cost = Res(0);
  templates_for_type[crops[crop_id].type] = crop_id;
  return crop_id;
}

crop_register_id = 300;
var watercress_template = makeTemplate(registerBrassica('brassica template', -1, Res(0), Num(1), 0, images_watercresstemplate));
var berry_template = makeTemplate(registerBerry('berry template', -1, 0, images_berrytemplate));
var mush_template = makeTemplate(registerMushroom('mushroom template', -1, 0, images_mushtemplate));
var flower_template = makeTemplate(registerFlower('flower template', -1, Num(0), 0, images_flowertemplate));
var nettle_template = makeTemplate(registerNettle('stinging template', -1, Num(0), 0, images_nettletemplate));
var bee_template = makeTemplate(registerBeehive('bee template', -1, Num(0), 0, images_beetemplate));
var mistletoe_template = makeTemplate(registerMistletoe('mistletoe template', -1, 0, images_mistletoetemplate));
var nut_template = makeTemplate(registerNut('nuts template', -1, 0, images_nutstemplate));
var pumpkin_template = makeTemplate(registerPumpkinCrop('pumpkin template (2x2)', -1, Num(0), 0, images_pumpkintemplate_small));
crops[pumpkin_template].quad = true;
crops[pumpkin_template].images_quad = [images_pumpkintemplate00, images_pumpkintemplate01, images_pumpkintemplate10, images_pumpkintemplate11];

crop_register_id = 350;
var challengestatue_0_template = makeTemplate(registerChallengeCrop('spore statue template', -1, Res({seeds:0}), 0, images_statue_spore_template));
var challengestatue_1_template = makeTemplate(registerChallengeCrop('splash statue template', -1, Res({seeds:0}), 0, images_statue_splash_template));
var challengestatue_2_template = makeTemplate(registerChallengeCrop('range statue template', -1, Res({seeds:0}), 0, images_statue_range_template));
var challengestatue_3_template = makeTemplate(registerChallengeCrop('sniper statue template', -1, Res({seeds:0}), 0, images_statue_sniper_template));
var challengestatue_4_template = makeTemplate(registerChallengeCrop('slow statue template', -1, Res({seeds:0}), 0, images_statue_snail_template));
var challengestatue_5_template = makeTemplate(registerChallengeCrop('seed statue template', -1, Res({seeds:0}), 0, images_statue_seed_template));

// templates that don't represent a croptype, but an individual crop
var direct_templates = []; // crop to template
direct_templates[challengestatue_0] = challengestatue_0_template;
direct_templates[challengestatue_1] = challengestatue_1_template;
direct_templates[challengestatue_2] = challengestatue_2_template;
direct_templates[challengestatue_3] = challengestatue_3_template;
direct_templates[challengestatue_4] = challengestatue_4_template;
direct_templates[challengestatue_5] = challengestatue_5_template;

var direct_templates_inv = []; // template to crop
for(var k in direct_templates) {
  if(!direct_templates.hasOwnProperty(k)) continue;
  direct_templates_inv[direct_templates[k]] = k;
}


var ghosts_for_type = [];

function makeGhost(crop_id) {
  crops[crop_id].isghost = true;
  crops[crop_id].cost = Res(0);
  ghosts_for_type[crops[crop_id].type] = crop_id;
  return crop_id;
}

crop_register_id = 400;
var watercress_ghost = makeGhost(registerBrassica('brassica ghost', -1, Res(0), Num(1), 0, images_watercressghost));
var berry_ghost = makeGhost(registerBerry('berry ghost', -1, 0, images_berryghost));
var mush_ghost = makeGhost(registerMushroom('mushroom ghost', -1, 0, images_mushghost));
var flower_ghost = makeGhost(registerFlower('flower ghost', -1, Num(0), 0, images_flowerghost));
var nettle_ghost = makeGhost(registerNettle('stinging ghost', -1, Num(0), 0, images_nettleghost));
var bee_ghost = makeGhost(registerBeehive('bee ghost', -1, Num(0), 0, images_beeghost));
var mistletoe_ghost = makeGhost(registerMistletoe('mistletoe ghost', -1, 0, images_mistletoeghost));
var nut_ghost = makeGhost(registerNut('nuts ghost', -1, 0, images_nutsghost));
var pumpkin_ghost = makeGhost(registerPumpkinCrop('pumpkin ghost', -1, Num(0), 0, images_pumpkinghost_small));
crops[pumpkin_ghost].quad = true;
crops[pumpkin_ghost].images_quad = [images_pumpkinghost00, images_pumpkinghost01, images_pumpkinghost10, images_pumpkinghost11];



crop_register_id = 2000;
var halloween_pumpkin_price = Res({seeds:666000000});
// multiplier of the best berry amount for pumpkin
// if set to 1, the pumpkin crop that takes 4x as much space as berry, produces only as much as a 1x1 berry
// if set to 4, the pumpkin produces 4x as much as the best berry, so each individual cell of it is worth a full berry
// however, since the pumpkin has advantages from its size (more neighbors), it already produces more than a similar layout that can be made with berries if this value is set to 1
// conservatively, 1 would be a good value, but for early gameplay with 5x5 field that would put the pumpkin at a disadvantage, so use a bit more.
var pumpkin_multiplier = Num(2)
/*
The rules of the pumpkin are as folows:
-its base income is the same as that of the best planted berry's base income
-base income here means the income before most bonuses (flower neighbors, squirrel, ...) are applied
-but what *is* included in base income of the berry is: regular upgrades, growth in the field, and prestige
-all other berry bonuses apply to pumpkin too, so those things that are not included in base income, apply to the pumpkin anyway and show up in its detailed breakdown.
-the pumpkin acts as berry: it produces seeds, gets boosted by flowers, the fruit/squirrel/ethereal/... berry upgrades apply to the pumpkin, etc...
-the pumpkin can have more neighbors because it's bigger, so more flowers can apply to a single crop. This is emost advanteous when using watercress copy on the pumpkin.
-the winter tree warmth only applies 50% to the pumpkin. This is because otherwise it was too overpowered in winter. Only max 2 of the 4 tiles of the pumpkin can be next to the tree in the first place, so this also makes sense
-the pumpkin requires 2x2 open spaces to plant it in the field, and is planted using its top left corner. If there are crops in the way, it displays an error message (it doesn't auto delete the other crops)
-the pumpkin is not available in the very first new game playthrough, but is starting from the second transencion. This to not introduce this crop when still learning the regular game for the first time.
-you can have max 1 pumpkin planted. You can have more blueprint templates of it though, but that doesn't help anything
-the pumpkin's unlock upgrade becomes visible once any berry was unlocked
-the automaton can auto-unlock and plant the pumpkin just like other crops, but will only do so if there's a pumpkin template on the field. The reason is that the pumpkin has no upgrade, only an unlock, so it's not visible in the right side normally. This ensures the event is visible.
-it's not available during challenges. In a next release it will be made available in some (but not all) challenges, but first it must be tested to ensure it's not broken without affecting challenges
-the pumpkin also counts as berry for multiplicity, and counts as 4 of them
-pumpkin produces as much as 2x a berry. Not 4x. See the pumpkin_multiplier
-all this means, if you have 1 berry and 1 pumpkin in the field, and nothing else, pumpkin will produce eactly same as twice that berry does. If you give both of them the same flower, pumpkin again produces exaactly twice as much, and so on. If you plant a flower to only the berry but not the pumpkin, the berry will now produce more than the pumpkin since only it benefits from that flower.
*/
var pumpkin_0 = registerPumpkinCrop('pumpkin (2x2)', 0, halloween_pumpkin_price, 10, images_pumpkin_small, 'Happy halloween! This crop takes up 2x2 field spaces. Its base seed production is ' + pumpkin_multiplier.toPercentString() + ' of the best planted berry anywhere in the field, so some regular berry must be planted somewhere. The pumpkin is bigger so can have more flower and other neighbors, which gives a significant layout advantage. It gets the full bonus from most neighbors, but only half the bonus for winter tree warmth. For the rest it acts as a berry and gets the same bonuses and neighbor interactions. You can only have max 1 pumpkin.');
crops[pumpkin_0].quad = true;
crops[pumpkin_0].images_quad = [images_pumpkin00, images_pumpkin01, images_pumpkin10, images_pumpkin11];




crop_register_id = 3000;
// these are only used to compute relative incomes, without ever being prestiged, nor able to be unlocked or planted
var berry_td_dummy = registerBerry('berry_placeholder', 0, berryplanttime0 * 1, undefined);
var mush_td_dummy = registerMushroom('mushroom_placeholder', 0, mushplanttime0 * 1, undefined);


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var registered_upgrades = []; // indexed consecutively, gives the index to upgrades
var upgrades = []; // indexed by upgrade index


// same comment as crop_register_id
var upgrade_register_id = -1;

// @constructor
function Upgrade() {
  this.name = 'a';
  this.description = undefined; // longer description than the name, with details, shown if not undefined
  this.shortdescription = undefined; // similar to description, but shorter text, for e.g. in message log

  // for choice upgrades only
  this.choicename_a = 'A';
  this.choicename_b = 'B';
  this.description_a = '';
  this.description_b = '';

  // function that applies the upgrade
  this.fun = undefined;

  // function that returns true if prerequisites to unlock this research are met
  this.pre = undefined;

  this.index = 0; // index in the upgrades array

  this.maxcount = 1; // how many times can this upgrade be done in total (typical 1, some upgrades have many series, 0 for infinity)

  this.is_choice = false; // if true, it's an upgrade that allows you to choose between effects with a dialog
  this.iscropupgrade = false; // is a berry/flower/... multiplier or additive upgrade (not an unlock, choice upgrade, ...), matching with the cropid
  this.iscropunlock = false; // matches with cropid
  this.isprestige = false; // the prestiged crop matches with cropid
  this.istreebasedupgrade = false; // is one of the upgrades that comes from the tree, such as weather and choice upgrades.

  this.cost = Res();

  // how much the cost of this upgrade increases when doing next one
  this.cost_increase = Num(1);

  // how this field is used, if at all, depends on the upgrade type
  this.bonus = undefined;

  // style related, for the upgrade chip in upgrade UI
  this.bgcolor = '#ff0';
  this.bordercolor = '000';
  this.image0 = undefined; // bg image, e.g. a plant
  this.image1 = undefined; // fg image, e.g. a level-up arrow in front of the plant

  this.deprecated = false; // no longer existing upgrade from earlier game version

  this.cropid = undefined; // if not undefined, it means the upgrade is related to this crop


  // gets the name, taking stage into account if it has stages
  this.getName = function() {
    var name = this.name;
    if(state.upgrades[this.index].count > 0 && this.maxcount != 1) name += ' ' + toRomanUpTo((state.upgrades[this.index].count));
    return name;
  };

  // name of next instance of this upgrade, if multi-staged
  this.getNextName = function() {
    var name = this.name;
    if(this.maxcount != 1) name += ' ' + toRomanUpTo((state.upgrades[this.index].count + 1));
    return name;
  };

  // max amount of upgrades done, fully researched
  this.isExhausted = function() {
    if(this.maxcount == 0) return false; // can be done infinite times
    return state.upgrades[this.index].count >= this.maxcount;
  };

  // can upgrade (ignoring resources needed), that is, it should be shown in the UI as a pressable button for upgrade that can be done noe
  this.canUpgrade = function() {
    return state.upgrades[this.index].unlocked && !this.isExhausted();
  };

  this.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(this.cost_increase, state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };
}

// maxcount should be 1 for an upgrade that can only be done once (e.g. an unlock), or 0 for infinity
function registerUpgrade(name, cost, fun, pre, maxcount, description, shortdescription, bgcolor, bordercolor, image0, image1) {
  if(upgrades[upgrade_register_id] || upgrade_register_id < 0 || upgrade_register_id > 65535) throw 'upgrades id already exists or is invalid!';
  var upgrade = new Upgrade();
  upgrade.index = upgrade_register_id++;
  upgrades[upgrade.index] = upgrade;
  registered_upgrades.push(upgrade.index);


  upgrade.name = name;
  upgrade.cost = cost;
  upgrade.maxcount = maxcount;

  if(bgcolor) upgrade.bgcolor = bgcolor;
  if(bordercolor) upgrade.bordercolor = bordercolor;
  if(image0) upgrade.image0 = image0;
  if(image1) upgrade.image1 = image1;

  // opt_choice is only used for choice upgrades
  upgrade.fun = function(opt_choice) {
    if(this.is_choice) {
      state.upgrades[this.index].count = opt_choice;
    } else {
      state.upgrades[this.index].count++;
    }
    // ensure it's also marked as unlocked. Most upgrades are unlocked before you can apply them, but in some cases like
    // auto-unlocked ones for challenges, blackberry secret, ... that may not be so.
    // and: upgrades are only saved in the savegame when unlocked, so must be set now or its count won't be saved
    state.upgrades[this.index].unlocked = true;
    fun();
  };

  if(!pre) pre = function(){return true;};
  upgrade.pre = pre;

  upgrade.description = description;
  upgrade.shortdescription = shortdescription;

  return upgrade.index;
}

// prev_unlock_crop: the previous berry (or other) tier that's required to exist for this crop.
// for berries themselves, this must be the previous berry
// for other crop types, the following applies: a requirement for this upgrade to unlock, is that either there is a fullgrown instance of that berry on the field, or the next higher berry type is unlocked.
// So having the next berry tier unlocked counts as if previous tier was planted. Example: you research 10 berry types but never unlock any mushroom. Now you unlock the first mushroom type. If next berry tier unlocked didn't count, then next mushroom would require you to plant some old berries on the field.
// If undefined, then this system is not used and only opt_pre_fun is used. If defined, then opt_pre_fun is an optional additional requirement (stricter, not less strict).
function registerCropUnlock(cropid, cost, prev_unlock_crop, opt_pre_fun_and, opt_pre_fun_or) {
  var crop = crops[cropid];
  var name = 'Unlock ' + crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  var fun = function() {
    if(cropid == flower_0 && (state.messagelogenabled[3] || state.g_numresets == 0)) showMessage('You unlocked the first type of flower! Flowers don\'t produce resources directly, but boost neighboring plants.', C_HELP, 456645);
    if(cropid == mushunlock_0 && (state.messagelogenabled[3] || state.g_numresets == 0)) showMessage('You unlocked the first type of mushroom! Mushrooms produce spores rather than seeds, and spores will be used by the tree.', C_HELP, 8932);
    state.crops[crop.index].unlocked = true;
    //if(!state.crops[crop.index].known) state.crops[crop.index].known = 1; // for prestiged crops, is and remains larger than 1. This is also already set by game.js when this upgrade becomes visible, however not for all crops such upgrade appears (e.g. blackberry with blackberry secret)
  };

  var pre = function() {
    if(opt_pre_fun_and && !opt_pre_fun_and()) return false;
    if(opt_pre_fun_or && opt_pre_fun_or()) return true;
    if(prev_unlock_crop == undefined) return true;
    var prev_unlock_tier = crops[prev_unlock_crop].tier;
    var prev_unlock_type = crops[prev_unlock_crop].type;
    if(state.highestoftypeunlocked[prev_unlock_type] > prev_unlock_tier) return true; // next berry tier unlocked: counts as better than having some planted of prev berry tier
    if(state.challenge == challenge_towerdefense && state.cropcount[prev_unlock_crop]) return true; // in TD, unlock higher towers faster, so that it's not always the few second wait time while they grow
    return !!state.crops[prev_unlock_crop].had; // some fullgrown of prev berry tier
  };

  var description = 'Unlocks new crop: ' + crop.name + '.';
  if(crop.prod.seeds.gtr(0)) description += ' Produces seeds.';
  if(crop.prod.spores.gtr(0)) description += ' Produces spores.';
  if(!crop.boost.eqr(0)) {
    if(crop.type == CROPTYPE_STINGING) {
      description += ' Boosts neighbor mushroom spores production without increasing seed consumption, but negatively orthogonally affects neighboring berries and flowers, so avoid touching those with this plant.';
    } else if(crop.type == CROPTYPE_BEE) {
      description += ' Boosts neighboring flower\'s boost.';
    } else {
      description += ' Boosts neighbors such as berries and mushrooms. Does not boost watercress, but watercress can copy everything from berries that are boosted by flowers.';
    }
  }


  description += ' Crop type: ' + getCropTypeName(crop.type);

  var shortdescription = 'Unlocks new crop of type ' + getCropTypeName(crop.type);

  var result = registerUpgrade(name, cost, fun, pre, 1, description, shortdescription, '#dfc', '#0a0', crop.image[4], undefined);
  var u = upgrades[result];
  u.cropid = cropid;
  u.iscropunlock = true;

  u.getCost = function(opt_adjust_count) {
    return cost;
  };

  return result;
}

function setCropMultiplierCosts(u, crop) {
  var tier = crop.tier;
  var cost0, cost1;
  var upgrade_steps = 1;
  var softcap_base = Num(1);
  if(crop.type == CROPTYPE_BERRY) {
    cost0 = getBerryCost(tier).mulr(basic_upgrade_initial_cost);
    cost1 = getBerryCost(tier + 1).mulr(basic_upgrade_initial_cost / 40);
    // berry production goes x700 per tier (to verify: crops[berry_5].prod.seeds.div(crops[berry_4].prod.seeds).toString() etc...)
    // each upgrade adds 25% (multiplicative), and 1.25^29 is the last value below 700
    upgrade_steps = 29;
    softcap_base = Num(1.005);
  } else if(crop.type == CROPTYPE_MUSH) {
    cost0 = getMushroomCost(tier).mulr(basic_upgrade_initial_cost);
    cost1 = getMushroomCost(tier + 1).mulr(basic_upgrade_initial_cost / 400);
    // mushroom production goes x123K per tier (to verify: crops[mush_5].prod.spores.div(crops[mush_4].prod.spores).toString() etc...)
    // each upgrade adds 25% (multiplicative), and 1.25^52 is the last value below 123K
    upgrade_steps = 52;
    softcap_base = Num(1.0025);
    //softcap_base = Num(1);
  } else if(crop.type == CROPTYPE_NUT) {
    cost0 = getNutCost(tier);
    cost1 = getNutCost(tier + 1);
    upgrade_steps = nut_upgrade_steps;
    softcap_base = Num(1.0025);
  }
  var cost0b = crop.type == CROPTYPE_NUT ? cost0.spores : cost0.seeds;
  var cost1b = crop.type == CROPTYPE_NUT ? cost1.spores : cost1.seeds;
  var costmul = cost1b.div(cost0b).powr(1 / upgrade_steps);

  u.cost = cost0;

  u.getCost = function(opt_adjust_count) {
    var i = state.upgrades[this.index].count + (opt_adjust_count || 0);

    if(crop.type == CROPTYPE_NUT) {
      var softcap = Num.pow(softcap_base, Num(i * i));
      // using index + 1, becausefirst upgrade should be more expensive than the nut plant itself
      var spores = cost0.spores.mul(costmul.powr(i + 1)).mul(softcap);
      return new Res({spores:spores});
    } else {
      /*var countfactor = Num.powr(Num(basic_upgrade_cost_increase), i);
      var result = this.cost.mul(countfactor);
      // soft cap by a slight more than exponential increase of the cost: without soft cap, there'll be some tier of crops that is the best tier, and higher tiers will give less production compared to lower berry with as-expensive upgrades
      var base = 1.002;
      //if(crop.type == CROPTYPE_MUSH) base = 1.002; // same for now.
      if(i > 1) result = result.mul(Num.powr(Num(base), (i - 1) * (i - 1)));
      return result;*/
      var softcap = Num.pow(softcap_base, Num(i * i));
      // using index + 1, becausefirst upgrade should be more expensive than the nut plant itself
      var seeds = cost0.seeds.mul(costmul.powr(i)).mul(softcap);
      return new Res({seeds:seeds});
    }
  };
}

// an upgrade that increases the multiplier of a crop
function registerCropMultiplier(cropid, multiplier, prev_crop_num, crop_unlock_id, opt_pre_fun) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    if(opt_pre_fun && !opt_pre_fun()) return false;
    if(crop_unlock_id == undefined) {
      if((prev_crop_num || 1) == 1) return state.crops[cropid].had > state.crops[cropid].prestige;
      return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1); // can't use 'had' if multiple must be checked
    } else {
      // for most crops, already unlock this upgrade as soon as it's reaserached, rather than planted, because otherwise it's too easy to forget you already have this crop and should plant it while you're looking at the upgrade panel
      return state.upgrades[crop_unlock_id].count;
    }
  };

  var aspect = 'production';
  if(crop.type == CROPTYPE_MUSH) aspect = 'production but also consumption';

  var description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor(((multiplier - 1) * 100)) + '% (multiplicative)';
  var shortdescription = description;

  if(crop.type == CROPTYPE_MUSH) description += '<br><br>Warning: if your mushrooms don\'t have enough seeds from neighbors, this upgrade will not help since it also increases the consumption. Get your seeds production up first.';

  var result = registerUpgrade('Upgrade ' + name, /*cost0=*/undefined, fun, pre, 0, description, shortdescription, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(multiplier);
  u.cropid = cropid;
  u.iscropupgrade = true;

  setCropMultiplierCosts(u, crop);

  return result;
}

// prev_unlock_crop_tier must be as-prestiged. E.g. if the prev_unlock_crop is a prestiged blackberry, then use tier 16 (instead of 0) and type CROPTYPE_BERRY
function registerCropPrestige(cropid, cost, prev_unlock_crop_type, prev_unlock_crop_tier) {
  var crop = crops[cropid];
  var name = 'Prestige ' + crop.name;
  var newtier = crop.tier + num_tiers_per_crop_type[crop.type];

  // the index this new upgrade will get
  var index = upgrade_register_id;

  var fun = function() {
    applyPrestige(cropid, 1); // TODO: in the future, support gonig to 2 etc...
  };

  var pre = function() {
    if(state.highestoftypeunlocked[crop.type] < newtier - 1) return false; // for mushroom and flower: also hard requirement to have unlocked the previous tier (such as previous prestiged tier)
    if(state.highestoftypeunlocked[prev_unlock_crop_type] > prev_unlock_crop_tier) return true; // next berry tier unlocked: counts as better than having some planted of prev berry tier
    if(state.highestoftypehad[prev_unlock_crop_type] >= prev_unlock_crop_tier) return true;
    if(state.challenge == challenge_towerdefense && state.highestoftypeunlocked[prev_unlock_crop_type] >= prev_unlock_crop_tier) return true; // in TD, unlock higher towers faster, so that it's not always the few second wait time while they grow
    return false;
  };

  var description = 'Prestiges the crop: ' + crop.name + '. This resets all its upgrades from this run to zero, removes any planted instances, and increases the production rate and cost of this crop, turning it into the next tier.';

  var shortdescription = 'Prestiges the crop: ' + crop.name;

  var result = registerUpgrade(name, cost, fun, pre, 1, description, shortdescription, '#ff6', '#a80', crop.image[4], undefined);
  var u = upgrades[result];
  u.cropid = cropid;
  u.isprestige = true;

  u.getCost = function(opt_adjust_count) {
    return cost;
  };

  return result;
}

function setBoostMultiplierCosts(u, crop) {
  // for flowers, each next tier boosts 16x more. So 31 of the additive +50% upgrades makes previous tier as strong
  // so ensure the price of the 30th upgrade is more expensive than the next flower tier, else the next flower tier is not worth it
  // between tier 0 and tier 1, and between tier 1 and tier 2, the multiplier is only 4x so steps is adjusted to 7
  var costmul = u.cost_increase;
  // During the bee challenge, challengeflower_0 is used, but it doesn't actually have upgrades so in practice this check doesn't matter. But the check is here since challengeflower_0 doesn't participate in the regular flower tier system that the other flower upgrades are bsaed on.
  if(crop.type == CROPTYPE_FLOWER && crop.index != challengeflower_0) {
    var upgrade_steps = 30;
    if(crop.tier == 0 || crop.tier == 1) upgrade_steps = 7;
    u.cost = new Res({seeds:getFlowerCost(crop.tier).seeds.mulr(flower_upgrade_initial_cost)});
    var cost0 = u.cost.seeds;
    var cost1 = getFlowerCost(crop.tier + 1).seeds.mulr(flower_upgrade_initial_cost);
    costmul = cost1.div(cost0).powr(1 / upgrade_steps);
  } else if(crop.type == CROPTYPE_BEE) {
    var upgrade_steps = 80;
    u.cost = new Res({seeds:getBeeCost(crop.tier).seeds.mulr(beehive_upgrade_initial_cost)});
    var cost0 = u.cost.seeds;
    var cost1 = getBeeCost(crop.tier + 1).seeds.mulr(beehive_upgrade_initial_cost);
    costmul = cost1.div(cost0).powr(1 / upgrade_steps);
  }

  u.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(costmul, state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };
}


function registerBoostMultiplier(cropid, cost, adder, prev_crop_num, crop_unlock_id, cost_increase) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    if(state.challenge == challenge_thistle && cropid == nettle_1) return true;
    if(state.challenge == challenge_poisonivy && cropid == nettle_2) return true;
    if(crop_unlock_id == undefined) {
      if((prev_crop_num || 1) == 1) return state.crops[cropid].had > state.crops[cropid].prestige;
      return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1);
    } else {
      // for most crops, already unlock this upgrade as soon as it's reaserached, rather than planted, because otherwise it's too easy to forget you already have this crop and should plant it while you're looking at the upgrade panel
      return state.upgrades[crop_unlock_id].count;
    }
  };

  var aspect = 'boost';
  var description;
  if(crop.type == CROPTYPE_STINGING) {
    description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor((adder * 100)) + '% (scales by n^' + nettle_upgrade_power_exponent + ' )';
  } else if(crop.type == CROPTYPE_BEE) {
    description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor((adder * 100)) + '% (scales by n^' + beehive_upgrade_power_exponent + ' )';
  } else {
    description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor((adder * 100)) + '% (additive)';
  }

  var result = registerUpgrade('Upgrade ' + name, cost, fun, pre, 0, description, description, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(adder);
  u.cropid = cropid;
  u.iscropupgrade = true;
  u.cost_increase = Num(cost_increase);

  setBoostMultiplierCosts(u, crop);

  return result;
}

var brassica_prod_upgrade_boost = 0.25;

// increases lifetime but also the initial production of watercress
function registerBrassicaTimeIncrease(cropid, cost, time_increase, prev_crop_num, crop_unlock_id, opt_pre_fun) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    if(opt_pre_fun && opt_pre_fun()) return true; // opt_pre_fun works in a positive rather than negative way here, to let the unlocked watercress upgrade by blackberrysecret work
    if(crop_unlock_id == undefined) {
      if((prev_crop_num || 1) == 1) return state.crops[cropid].had > state.crops[cropid].prestige;
      return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1);
    } else {
      // for most crops, already unlock this upgrade as soon as it's reaserached, rather than planted, because otherwise it's too easy to forget you already have this crop and should plant it while you're looking at the upgrade panel
      return state.upgrades[crop_unlock_id].count;
    }
  };

  var description = '+' + Num(brassica_prod_upgrade_boost).toPercentString() + ' ' + crop.name + ' base production (additive), +' + (time_increase * 100) + '%  lifespan duration';

  var result = registerUpgrade('Upgrade ' + name, cost, fun, pre, 0, description, description, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(time_increase);
  u.cropid = cropid;
  u.iscropupgrade = true;

  u.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(Num(basic_upgrade_cost_increase), state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };

  return result;
}

var choice_upgrades = [];

// an upgrade that increases the multiplier of a crop
function registerChoiceUpgrade(name, pre, fun, name_a, name_b, description_a, description_b, bgcolor, bordercolor, image0, image1) {
  // the index this new upgrade will get
  var index = upgrade_register_id;

  var maxcount = 1;

  var description = 'Choice upgrade, pick one of the two proposed effects. Choose wisely. <br><br><b>' + name_a + '</b>:<br>' + description_a + '<br><br><b>' + name_b + '</b>:<br>' + description_b;
  var shortdescription = 'Choice upgrade, pick one of the two proposed effects';

  var result = registerUpgrade(name, Res(), fun, pre, maxcount, description, shortdescription, bgcolor, bordercolor, image0, image1);
  var u = upgrades[result];
  u.is_choice = true;
  u.choicename_a = name_a;
  u.choicename_b = name_b;
  u.description_a = description_a;
  u.description_b = description_b;

  choice_upgrades.push(u);

  return result;
}

// register an upgrade that was removed from the game so it's marked as invalid to not display it and remove from new saves
function registerDeprecatedUpgrade() {
  var result = registerUpgrade('<none>', Res(), function(){}, function(){return false;}, 1, '<none>', '<none>');
  var u = upgrades[result];
  u.deprecated = true;
  return result;
}


upgrade_register_id = 25;
var berryunlock_0 = registerCropUnlock(berry_0, getBerryCost(0), brassica_0, function(){
  if(state.g_numresets > 0) return true; // having it hidden is only during first playthrough now. With this, only a single watercress rather than 10 as in the check below is required to make this upgrade visible. This makes (truly) basic challenge start less confusing. For regular game this has no effect once having blackberry secret.
  return (state.c_numplanted + state.c_numplantedbrassica) >= 10;
});
var berryunlock_1 = registerCropUnlock(berry_1, getBerryCost(1), berry_0); // see applyBlueberrySecret for its extra unlock
var berryunlock_2 = registerCropUnlock(berry_2, getBerryCost(2), berry_1); // see applyCranberrySecret for its extra unlock
var berryunlock_3 = registerCropUnlock(berry_3, getBerryCost(3), berry_2);
var berryunlock_4 = registerCropUnlock(berry_4, getBerryCost(4), berry_3);
var berryunlock_5 = registerCropUnlock(berry_5, getBerryCost(5), berry_4);
var berryunlock_6 = registerCropUnlock(berry_6, getBerryCost(6), berry_5);
var berryunlock_7 = registerCropUnlock(berry_7, getBerryCost(7), berry_6);
var berryunlock_8 = registerCropUnlock(berry_8, getBerryCost(8), berry_7);
var berryunlock_9 = registerCropUnlock(berry_9, getBerryCost(9), berry_8);
var berryunlock_10 = registerCropUnlock(berry_10, getBerryCost(10), berry_9);
var berryunlock_11 = registerCropUnlock(berry_11, getBerryCost(11), berry_10);
var berryunlock_12 = registerCropUnlock(berry_12, getBerryCost(12), berry_11);
var berryunlock_13 = registerCropUnlock(berry_13, getBerryCost(13), berry_12);
var berryunlock_14 = registerCropUnlock(berry_14, getBerryCost(14), berry_13);
var berryunlock_15 = registerCropUnlock(berry_15, getBerryCost(15), berry_14);

upgrade_register_id = 50;
var mushunlock_0 = registerCropUnlock(mush_0, getMushroomCost(0), berry_1);
var mushunlock_1 = registerCropUnlock(mush_1, getMushroomCost(1), berry_3, function(){return !!state.upgrades[mushunlock_0].count;});
var mushunlock_2 = registerCropUnlock(mush_2, getMushroomCost(2), berry_5, function(){return !!state.upgrades[mushunlock_1].count;});
var mushunlock_3 = registerCropUnlock(mush_3, getMushroomCost(3), berry_7, function(){return !!state.upgrades[mushunlock_2].count;});
var mushunlock_4 = registerCropUnlock(mush_4, getMushroomCost(4), berry_9, function(){return !!state.upgrades[mushunlock_3].count;});
var mushunlock_5 = registerCropUnlock(mush_5, getMushroomCost(5), berry_11, function(){return !!state.upgrades[mushunlock_4].count;});
var mushunlock_6 = registerCropUnlock(mush_6, getMushroomCost(6), berry_13, function(){return !!state.upgrades[mushunlock_5].count;});
var mushunlock_7 = registerCropUnlock(mush_7, getMushroomCost(7), berry_15, function(){return !!state.upgrades[mushunlock_6].count;});

upgrade_register_id = 75;
var flowerunlock_0 = registerCropUnlock(flower_0, getFlowerCost(0), berry_0);
var flowerunlock_1 = registerCropUnlock(flower_1, getFlowerCost(1), berry_2, function(){return !!state.upgrades[flowerunlock_0].count;});
var flowerunlock_2 = registerCropUnlock(flower_2, getFlowerCost(2), berry_4, function(){return !!state.upgrades[flowerunlock_1].count;});
var flowerunlock_3 = registerCropUnlock(flower_3, getFlowerCost(3), berry_6, function(){return !!state.upgrades[flowerunlock_2].count;});
var flowerunlock_4 = registerCropUnlock(flower_4, getFlowerCost(4), berry_8, function(){return !!state.upgrades[flowerunlock_3].count;});
var flowerunlock_5 = registerCropUnlock(flower_5, getFlowerCost(5), berry_10, function(){return !!state.upgrades[flowerunlock_4].count;});
var flowerunlock_6 = registerCropUnlock(flower_6, getFlowerCost(6), berry_12, function(){return !!state.upgrades[flowerunlock_5].count;});
var flowerunlock_7 = registerCropUnlock(flower_7, getFlowerCost(7), berry_14, function(){return !!state.upgrades[flowerunlock_6].count;});

upgrade_register_id = 100;
var nettleunlock_0 = registerCropUnlock(nettle_0, getNettleCost(0), undefined, function() {
  // prev_crop is mush_1, but also unlock once higher level berries available, in case player skips placing this mushroom
  if(state.crops[mush_1].had) return true;
  if(state.crops[berry_4].had) return true; // the berry after mush_1
  //if(state.upgrades[berryunlock_4].count) return true; // the berry after mush_1
  if(state.challenge == challenge_towerdefense && (state.crops[mush_1].unlocked || state.crops[berry_4].unlocked)) return true; // otherwise it may miss this one due to the super fast upgrade unlocks
  return false;
});
var nettleunlock_1 = registerCropUnlock(nettle_1, getNettleCost(1), undefined, function() {
  if(basicChallenge() == 2) return false; // not available during truly basic challenge
  if(!state.challenges[challenge_thistle].completed) return false;
  if(state.challenge == challenge_thistle) return false; // doesn't unlock during the thistle challenge itself, but there are already tons of them around

  if(state.crops[mush_5].had) return true;
  if(state.crops[berry_12].had) return true; // the berry after mush_5
  if(state.challenge == challenge_towerdefense && (state.crops[mush_5].unlocked || state.crops[berry_12].unlocked || state.crops[berry_0].prestige)) return true; // otherwise it may miss this one due to the super fast upgrade unlocks
  return false;
});
var nettleunlock_2 = registerCropUnlock(nettle_2, getNettleCost(2), undefined, function() {
  if(basicChallenge() == 2) return false; // not available during truly basic challenge
  if(!state.challenges[challenge_poisonivy].completed) return false;
  if(state.challenge == challenge_thistle || state.challenge == challenge_poisonivy) return false; // doesn't unlock during the poison ivy challenge itself, but there are already tons of them around. And also not during thistle challenge.

  if(state.crops[mush_2].had > 1) return true; // had > 1 means had a prestiged one
  if(state.crops[berry_6].had > 1) return true; // the berry after mush_2 (prestiged)
  if(state.challenge == challenge_towerdefense && (state.crops[mush_2].prestige || state.crops[berry_6].prestige)) return true; // otherwise it may miss this one due to the super fast upgrade unlocks
  return false;
});

upgrade_register_id = 110;
var mistletoeunlock_0 = registerCropUnlock(mistletoe_0, getFlowerCost(0).mulr(2), undefined, function() {
  if(basicChallenge()) return false; // not available during basic challenge

  if(state.challenge && !challenges[state.challenge].allowstwigs) return false;

  if(!(state.g_numresets > 0 && state.upgrades2[upgrade2_mistletoe].count)) return false;

  if(state.crops[berry_0].had) return true;
  if(state.upgrades[berryunlock_1].count) return true;

  if(!basicChallenge() && state.upgrades2[upgrade2_blueberrysecret].count) return true; // blueberrysecret also makes mistletoe unlock visible, as if having a fullgrown blackberry

  return false;
});

upgrade_register_id = 120;
var beeunlock_0 = registerCropUnlock(bee_0, getBeeCost(0), undefined, function() {
  if(basicChallenge() == 2) return false; // not available during truly basic challenge
  if(!state.challenges[challenge_bees].completed) return false;

  // prev_crop is flower_3, but also unlock once higher level berries available, in case player skips placing this flower
  if(state.crops[flower_3].had) return true;
  if(state.fullgrowncropcount[berry_7]) return true; // the berry after flower_3
  if(state.challenge == challenge_towerdefense && (state.crops[flower_3].unlocked || state.crops[berry_7].unlocked)) return true; // otherwise it may miss this one due to the super fast upgrade unlocks

  return false;
});
var beeunlock_1 = registerCropUnlock(bee_1, getBeeCost(1), undefined, function() {
  if(basicChallenge() == 2) return false; // not available during truly basic challenge
  if(!state.challenges[challenge_bees].completed) return false;
  if(!state.upgrades[beeunlock_0].count) return false;

  // prev_crop is flower_7, but also unlock once higher level berries available, in case player skips placing this flower
  if(state.crops[flower_7].had) return true;
  if(state.crops[berry_15].had) return true; // the berry after flower_7
  if(state.challenge == challenge_towerdefense && (state.crops[flower_7].unlocked || state.crops[berry_15].unlocked)) return true; // otherwise it may miss this one due to the super fast upgrade unlocks

  return false;
});


upgrade_register_id = 200;
var nutunlock_0 = registerCropUnlock(nut_0, getNutCost(0), undefined, function() {
  if(!haveSquirrel()) return false;
  if(!!state.challenge && !challenges[state.challenge].allowsnuts) return false;
  return state.treelevel >= nut_tree_level;
});
var nutunlock_1 = registerCropUnlock(nut_1, getNutCost(1), nut_0, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_2 = registerCropUnlock(nut_2, getNutCost(2), nut_1, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_3 = registerCropUnlock(nut_3, getNutCost(3), nut_2, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_4 = registerCropUnlock(nut_4, getNutCost(4), nut_3, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_5 = registerCropUnlock(nut_5, getNutCost(5), nut_4, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_6 = registerCropUnlock(nut_6, getNutCost(6), nut_5, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_7 = registerCropUnlock(nut_7, getNutCost(7), nut_6, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_8 = registerCropUnlock(nut_8, getNutCost(8), nut_7, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_9 = registerCropUnlock(nut_9, getNutCost(9), nut_8, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_10 = registerCropUnlock(nut_10, getNutCost(10), nut_9, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_11 = registerCropUnlock(nut_11, getNutCost(11), nut_10, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_12 = registerCropUnlock(nut_12, getNutCost(12), nut_11, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_13 = registerCropUnlock(nut_13, getNutCost(13), nut_12, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_14 = registerCropUnlock(nut_14, getNutCost(14), nut_13, function(){
  if(!haveSquirrel()) return false;
  return true;
});
var nutunlock_15 = registerCropUnlock(nut_15, getNutCost(15), nut_14, function(){
  if(!haveSquirrel()) return false;
  return true;
});



//brassicaunlock_0 does not exist, you start with that crop type already unlocked
upgrade_register_id = 250;
var brassicaunlock_1 = registerCropUnlock(brassica_1, Res({seeds:100}), undefined, function() {
  if(basicChallenge() == 2) return false; // not available during truly basic challenge
  if(!state.challenges[challenge_wasabi].completed) return false;
  if(state.crops[berry_8].had) return true;
  if(state.challenge == challenge_towerdefense && state.crops[berry_8].unlocked) return true; // otherwise it may miss this one due to the super fast upgrade unlocks
  return false;
});


upgrade_register_id = 325;
var berryprestige_0 = registerCropPrestige(berry_0, getBerryCost(16), CROPTYPE_BERRY, 15);
var berryprestige_1 = registerCropPrestige(berry_1, getBerryCost(17), CROPTYPE_BERRY, 16);
var berryprestige_2 = registerCropPrestige(berry_2, getBerryCost(18), CROPTYPE_BERRY, 17);
var berryprestige_3 = registerCropPrestige(berry_3, getBerryCost(19), CROPTYPE_BERRY, 18);
var berryprestige_4 = registerCropPrestige(berry_4, getBerryCost(20), CROPTYPE_BERRY, 19);
var berryprestige_5 = registerCropPrestige(berry_5, getBerryCost(21), CROPTYPE_BERRY, 20);
var berryprestige_6 = registerCropPrestige(berry_6, getBerryCost(22), CROPTYPE_BERRY, 21);
var berryprestige_7 = registerCropPrestige(berry_7, getBerryCost(23), CROPTYPE_BERRY, 22);
var berryprestige_8 = registerCropPrestige(berry_8, getBerryCost(24), CROPTYPE_BERRY, 23);
var berryprestige_9 = registerCropPrestige(berry_9, getBerryCost(25), CROPTYPE_BERRY, 24);
var berryprestige_10 = registerCropPrestige(berry_10, getBerryCost(26), CROPTYPE_BERRY, 25);
var berryprestige_11 = registerCropPrestige(berry_11, getBerryCost(27), CROPTYPE_BERRY, 26);
var berryprestige_12 = registerCropPrestige(berry_12, getBerryCost(28), CROPTYPE_BERRY, 27);
var berryprestige_13 = registerCropPrestige(berry_13, getBerryCost(29), CROPTYPE_BERRY, 28);
var berryprestige_14 = registerCropPrestige(berry_14, getBerryCost(30), CROPTYPE_BERRY, 29);
var berryprestige_15 = registerCropPrestige(berry_15, getBerryCost(31), CROPTYPE_BERRY, 30);

upgrade_register_id = 350;
var mushprestige_0 = registerCropPrestige(mush_0, getMushroomCost(8), CROPTYPE_BERRY, 17);
var mushprestige_1 = registerCropPrestige(mush_1, getMushroomCost(9), CROPTYPE_BERRY, 19);
var mushprestige_2 = registerCropPrestige(mush_2, getMushroomCost(10), CROPTYPE_BERRY, 21);
var mushprestige_3 = registerCropPrestige(mush_3, getMushroomCost(11), CROPTYPE_BERRY, 23);
var mushprestige_4 = registerCropPrestige(mush_4, getMushroomCost(12), CROPTYPE_BERRY, 25);
var mushprestige_5 = registerCropPrestige(mush_5, getMushroomCost(13), CROPTYPE_BERRY, 27);
var mushprestige_6 = registerCropPrestige(mush_6, getMushroomCost(14), CROPTYPE_BERRY, 29);
var mushprestige_7 = registerCropPrestige(mush_7, getMushroomCost(15), CROPTYPE_BERRY, 31);


upgrade_register_id = 375;
var flowerprestige_0 = registerCropPrestige(flower_0, getFlowerCost(8), CROPTYPE_BERRY, 16);
var flowerprestige_1 = registerCropPrestige(flower_1, getFlowerCost(9), CROPTYPE_BERRY, 18);
var flowerprestige_2 = registerCropPrestige(flower_2, getFlowerCost(10), CROPTYPE_BERRY, 20);
var flowerprestige_3 = registerCropPrestige(flower_3, getFlowerCost(11), CROPTYPE_BERRY, 22);
var flowerprestige_4 = registerCropPrestige(flower_4, getFlowerCost(12), CROPTYPE_BERRY, 24);
var flowerprestige_5 = registerCropPrestige(flower_5, getFlowerCost(13), CROPTYPE_BERRY, 26);
var flowerprestige_6 = registerCropPrestige(flower_6, getFlowerCost(14), CROPTYPE_BERRY, 28);
var flowerprestige_7 = registerCropPrestige(flower_7, getFlowerCost(15), CROPTYPE_BERRY, 30);

// more prestiges are further below due to not fitting in the upgrade_register_id here


////////////////////////////////////////////////////////////////////////////////

// power increase for crop production (not flower boost) by basic upgrades
var berry_upgrade_power_increase = 1.25; // multiplicative
var mushroom_upgrade_power_increase = 1.25; // multiplicative
var nut_upgrade_power_increase = getNutProd(1).nuts.div(getNutProd(0).nuts).powr(1 / nut_upgrade_steps); // multiplicative
// cost increase for crop production (not flower boost) by basic upgrades
var basic_upgrade_cost_increase = 1.65;

// how much more expensive than the base cost of the crop is the upgrade cost
var basic_upgrade_initial_cost = 10;

var flower_upgrade_power_increase = 0.5;
var flower_upgrade_cost_increase = 2.5; // NOTE: this is now unused since it is adjusted per tier to get 30th level to cost same as next flower
var flower_upgrade_initial_cost = 15;

var nettle_upgrade_power_exponent = 1.05;

var beehive_upgrade_power_increase = 0.5; // additive
var beehive_upgrade_cost_increase = 5;
var beehive_upgrade_power_exponent = 1.05;
var beehive_upgrade_initial_cost = 10;

upgrade_register_id = 400;

var challengeflowermul_0 = registerBoostMultiplier(challengeflower_0, Res({seeds:1000}).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, undefined, flower_upgrade_cost_increase); // aster flower for bee challenge

var challengecropmul_0 = registerBoostMultiplier(challengecrop_0, crops[challengecrop_0].cost.mulr(10), Num(0.5), 1, undefined, 10); // worker bee
upgrades[challengecropmul_0].description = 'boosts the worker bee boost ' + upgrades[challengecropmul_0].bonus.toPercentString() +  ' (additive)';

var challengecropmul_1 = registerBoostMultiplier(challengecrop_1, crops[challengecrop_1].cost.mulr(10), Num(0.5), 1, undefined, 10); // worker bee
upgrades[challengecropmul_1].description = 'boosts the drone boost ' + upgrades[challengecropmul_1].bonus.toPercentString() +  ' (additive)';

var challengecropmul_2 = registerBoostMultiplier(challengecrop_2, crops[challengecrop_2].cost.mulr(10), Num(0.5), 1, undefined, 10); // worker bee
upgrades[challengecropmul_2].description = 'boosts the queen bee boost ' + upgrades[challengecropmul_2].bonus.toPercentString() +  ' (additive)';

upgrade_register_id = 500;
var berrymul_0 = registerCropMultiplier(berry_0, berry_upgrade_power_increase, 1, berryunlock_0);
var berrymul_1 = registerCropMultiplier(berry_1, berry_upgrade_power_increase, 1, berryunlock_1);
var berrymul_2 = registerCropMultiplier(berry_2, berry_upgrade_power_increase, 1, berryunlock_2);
var berrymul_3 = registerCropMultiplier(berry_3, berry_upgrade_power_increase, 1, berryunlock_3);
var berrymul_4 = registerCropMultiplier(berry_4, berry_upgrade_power_increase, 1, berryunlock_4);
var berrymul_5 = registerCropMultiplier(berry_5, berry_upgrade_power_increase, 1, berryunlock_5);
var berrymul_6 = registerCropMultiplier(berry_6, berry_upgrade_power_increase, 1, berryunlock_6);
var berrymul_7 = registerCropMultiplier(berry_7, berry_upgrade_power_increase, 1, berryunlock_7);
var berrymul_8 = registerCropMultiplier(berry_8, berry_upgrade_power_increase, 1, berryunlock_8);
var berrymul_9 = registerCropMultiplier(berry_9, berry_upgrade_power_increase, 1, berryunlock_9);
var berrymul_10 = registerCropMultiplier(berry_10, berry_upgrade_power_increase, 1, berryunlock_10);
var berrymul_11 = registerCropMultiplier(berry_11, berry_upgrade_power_increase, 1, berryunlock_11);
var berrymul_12 = registerCropMultiplier(berry_12, berry_upgrade_power_increase, 1, berryunlock_12);
var berrymul_13 = registerCropMultiplier(berry_13, berry_upgrade_power_increase, 1, berryunlock_13);
var berrymul_14 = registerCropMultiplier(berry_14, berry_upgrade_power_increase, 1, berryunlock_14);
var berrymul_15 = registerCropMultiplier(berry_15, berry_upgrade_power_increase, 1, berryunlock_15);

upgrade_register_id = 525;
var mushmul_0 = registerCropMultiplier(mush_0, mushroom_upgrade_power_increase, 1, mushunlock_0);
var mushmul_1 = registerCropMultiplier(mush_1, mushroom_upgrade_power_increase, 1, mushunlock_1);
var mushmul_2 = registerCropMultiplier(mush_2, mushroom_upgrade_power_increase, 1, mushunlock_2);
var mushmul_3 = registerCropMultiplier(mush_3, mushroom_upgrade_power_increase, 1, mushunlock_3);
var mushmul_4 = registerCropMultiplier(mush_4, mushroom_upgrade_power_increase, 1, mushunlock_4);
var mushmul_5 = registerCropMultiplier(mush_5, mushroom_upgrade_power_increase, 1, mushunlock_5);
var mushmul_6 = registerCropMultiplier(mush_6, mushroom_upgrade_power_increase, 1, mushunlock_6);
var mushmul_7 = registerCropMultiplier(mush_7, mushroom_upgrade_power_increase, 1, mushunlock_7);

upgrade_register_id = 550;
var flowermul_0 = registerBoostMultiplier(flower_0, getFlowerCost(0).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_0, flower_upgrade_cost_increase);
var flowermul_1 = registerBoostMultiplier(flower_1, getFlowerCost(1).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_1, flower_upgrade_cost_increase);
var flowermul_2 = registerBoostMultiplier(flower_2, getFlowerCost(2).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_2, flower_upgrade_cost_increase);
var flowermul_3 = registerBoostMultiplier(flower_3, getFlowerCost(3).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_3, flower_upgrade_cost_increase);
var flowermul_4 = registerBoostMultiplier(flower_4, getFlowerCost(4).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_4, flower_upgrade_cost_increase);
var flowermul_5 = registerBoostMultiplier(flower_5, getFlowerCost(5).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_5, flower_upgrade_cost_increase);
var flowermul_6 = registerBoostMultiplier(flower_6, getFlowerCost(6).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_6, flower_upgrade_cost_increase);
var flowermul_7 = registerBoostMultiplier(flower_7, getFlowerCost(7).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_7, flower_upgrade_cost_increase);

upgrade_register_id = 575;
var nettlemul_0 = registerBoostMultiplier(nettle_0, getNettleCost(0).mulr(10), flower_upgrade_power_increase, 1, nettleunlock_0, flower_upgrade_cost_increase);
var nettlemul_1 = registerBoostMultiplier(nettle_1, getNettleCost(1).mulr(10), flower_upgrade_power_increase, 1, nettleunlock_1, flower_upgrade_cost_increase);
var nettlemul_2 = registerBoostMultiplier(nettle_2, getNettleCost(2).mulr(10), flower_upgrade_power_increase, 1, nettleunlock_2, flower_upgrade_cost_increase);

upgrade_register_id = 580;
var brassicamul_0 = registerBrassicaTimeIncrease(brassica_0, Res({seeds:100}), 0.35, 5, undefined, function(){
  if(!basicChallenge() && state.upgrades2[upgrade2_blackberrysecret].count) return true; // blackberry secret makes the watercress upgrade visible from the start rather than after 5 brassica
  if(basicChallenge() != 2 && automatonUnlocked()) return true; // when having templates and automaton, unlock this upgrade from the beginning because with a field full of templates it starts getting unclear why no upgrades are available and that you must plant watercress (if watercress secret not yet available)
  return (state.c_numplanted >= 1 || state.c_numplantedbrassica >= 5) && (state.c_numplantedbrassica >= 1);
});

var brassicamul_1 = registerBrassicaTimeIncrease(brassica_1, Res({seeds:1000}), 0.35, 1, brassicaunlock_1);

upgrade_register_id = 590;
var beemul_0 = registerBoostMultiplier(bee_0, getBeeCost(0).mulr(beehive_upgrade_initial_cost), beehive_upgrade_power_increase, 1, beeunlock_0, beehive_upgrade_cost_increase);
var beemul_1 = registerBoostMultiplier(bee_1, getBeeCost(1).mulr(beehive_upgrade_initial_cost), beehive_upgrade_power_increase, 1, beeunlock_1, beehive_upgrade_cost_increase);

upgrade_register_id = 600;
var nutmul_0 = registerCropMultiplier(nut_0, nut_upgrade_power_increase, 1, nutunlock_0);
var nutmul_1 = registerCropMultiplier(nut_1, nut_upgrade_power_increase, 1, nutunlock_1);
var nutmul_2 = registerCropMultiplier(nut_2, nut_upgrade_power_increase, 1, nutunlock_2);
var nutmul_3 = registerCropMultiplier(nut_3, nut_upgrade_power_increase, 1, nutunlock_3);
var nutmul_4 = registerCropMultiplier(nut_4, nut_upgrade_power_increase, 1, nutunlock_4);
var nutmul_5 = registerCropMultiplier(nut_5, nut_upgrade_power_increase, 1, nutunlock_5);
var nutmul_6 = registerCropMultiplier(nut_6, nut_upgrade_power_increase, 1, nutunlock_6);
var nutmul_7 = registerCropMultiplier(nut_7, nut_upgrade_power_increase, 1, nutunlock_7);
var nutmul_8 = registerCropMultiplier(nut_8, nut_upgrade_power_increase, 1, nutunlock_8);
var nutmul_9 = registerCropMultiplier(nut_9, nut_upgrade_power_increase, 1, nutunlock_9);
var nutmul_10 = registerCropMultiplier(nut_10, nut_upgrade_power_increase, 1, nutunlock_10);
var nutmul_11 = registerCropMultiplier(nut_11, nut_upgrade_power_increase, 1, nutunlock_11);
var nutmul_12 = registerCropMultiplier(nut_12, nut_upgrade_power_increase, 1, nutunlock_12);
var nutmul_13 = registerCropMultiplier(nut_13, nut_upgrade_power_increase, 1, nutunlock_13);
var nutmul_14 = registerCropMultiplier(nut_14, nut_upgrade_power_increase, 1, nutunlock_14);
var nutmul_15 = registerCropMultiplier(nut_15, nut_upgrade_power_increase, 1, nutunlock_15);



upgrade_register_id = 1000;
var upgrade_mistunlock = registerUpgrade('mist ability', treeLevelReqBase(4).mulr(0.05 * 0), function() {
  // nothing to do here, the fact that this upgrade's count is changed to 1 already enables it
}, function() {
  if(state.challenge == challenge_stormy) return false;
  if(state.treelevel >= 4) {
    // auto apply this upgrade already for convenience. Cost ignored. It was too annoying to have to indirectly have this extra step of applying the upgrade.
    state.upgrades[upgrade_mistunlock].unlocked = true;
    state.upgrades[upgrade_mistunlock].count = 1;
    return true;
  }
  return false;
}, 1,
   'While enabled, mist temporarily increases mushroom spore production while decreasing seed consumption. In addition, mushrooms are then not affected by winter. This active ability is enabled using its icon button at the top or (by default) the shortcut "shift+2".',
   'Unlocks active weather ability',
   '#fff', '#88f', image_mist, undefined);
upgrades[upgrade_mistunlock].istreebasedupgrade = true;

var upgrade_sununlock = registerUpgrade('sun ability', treeLevelReqBase(2).mulr(0.05 * 0), function() {
  // nothing to do here, the fact that this upgrade's count is changed to 1 already enables it
}, function() {
  if(state.challenge == challenge_stormy) return false;
  if(state.treelevel >= 2) {
    // auto apply this upgrade already for convenience. Cost ignored. It was too annoying to have to indirectly have this extra step of applying the upgrade.
    state.upgrades[upgrade_sununlock].unlocked = true;
    state.upgrades[upgrade_sununlock].count = 1;
    return true;
  }
  return false;
}, 1,
  'While enabled, the sun temporarily increases berry seed production. In addition, berries are then not affected by winter. This active ability is enabled using its icon button at the top or (by default) the shortcut "shift+1".',
  'Unlocks active weather ability',
  '#ccf', '#88f', image_sun, undefined);
upgrades[upgrade_sununlock].istreebasedupgrade = true;

var upgrade_rainbowunlock = registerUpgrade('rainbow ability', treeLevelReqBase(6).mulr(0.05 * 0), function() {
  // nothing to do here, the fact that this upgrade's count is changed to 1 already enables it
}, function() {
  if(state.challenge == challenge_stormy) return false;
  if(state.treelevel >= 6) {
    // auto apply this upgrade already for convenience. Cost ignored. It was too annoying to have to indirectly have this extra step of applying the upgrade.
    state.upgrades[upgrade_rainbowunlock].unlocked = true;
    state.upgrades[upgrade_rainbowunlock].count = 1;
    return true;
  }
  return false;
}, 1,
   'While enabled, flowers get a boost, and are not affected by winter. This active ability is enabled using its icon button at the top or (by default) the shortcut "shift+3".',
   'Unlocks active weather ability',
   '#ccf', '#00f', image_rainbow, undefined);
upgrades[upgrade_rainbowunlock].istreebasedupgrade = true;


var choice_text = 'CHOICE upgrade. Disables the other matching choice, choose wisely. ';

upgrade_register_id = 1025;

var fern_choice0_a_minutes = 7;
var fern_choice0_b_bonus = 0.25;

var fern_choice0 = registerChoiceUpgrade('fern choice',
  function() {
    return state.treelevel >= 3;
  }, function() {
  },
 'Slower ferns', 'Richer ferns',
 'Ferns take ' + (fern_wait_minutes + fern_choice0_a_minutes) + ' instead of ' + fern_wait_minutes + ' minutes to appear, but contain enough resources to make up the difference exactly. Ferns left for a very long time will give additional resources, up to several hours worth. This allows to collect more fern resources during idle play, but has no effect on the overall fern income during active play.',
 'Ferns contain on average ' + (fern_choice0_b_bonus * 100) + '% more resources, but they\'ll appear as often as before so this benefits active play more than idle play, and is a disadvantage for e.g. combining ferns with weather effects.',
 '#000', '#fff', images_fern[0], undefined);
upgrades[fern_choice0].istreebasedupgrade = true;

// pre version 0.1.15
var fern_choice0_b = registerDeprecatedUpgrade();



// pre version 0.1.6
var mist_choice0_a = registerDeprecatedUpgrade();
var mist_choice0_b = registerDeprecatedUpgrade();
var sun_choice0_a = registerDeprecatedUpgrade();
var sun_choice0_b = registerDeprecatedUpgrade();
var rainbow_choice0_a = registerDeprecatedUpgrade();
var rainbow_choice0_b = registerDeprecatedUpgrade();

var active_choice0_b_bonus = 0.25;

var active_choice0 = registerChoiceUpgrade('weather choice',
  function() {
    return state.treelevel >= 8;
  }, function() {
    if(state.upgrades[active_choice0].count == 1) {
      // compensate for the doubling of their duration, avoid that doing this upgrade causes suddenly having weather abilities that looked available, be non-available
      if(state.time - state.suntime > sun_duration) state.suntime -= sun_wait;
      if(state.time - state.misttime > mist_duration) state.misttime -= mist_wait;
      if(state.time - state.rainbowtime > rainbow_duration) state.rainbowtime -= rainbow_wait;
    }
  },
 'Long weather', 'Strong weather',
 'Makes the active weather abilities run twice as long, but also twice as long to recharge. This benefits idle play, but gives on average no benefit for active play.',
 'Increases all active ability weather effects by ' + (active_choice0_b_bonus * 100) + '%. The active abilities recharge time remains the same so this benefits active play more than idle play.',
 '#000', '#fff', image_sun, undefined);
upgrades[active_choice0].istreebasedupgrade = true;

// pre version 0.1.15
var active_choice0_b = registerDeprecatedUpgrade();


var watercress_choice_lifetime_increase = 0.5;

var watercress_choice0 = registerChoiceUpgrade('brassica choice',
  function() {
    return state.treelevel >= 14;
  }, function() {
    // in early game, the watercress has short lifetime, and so loses a lot of growth percentage
    // for this one (likely automatic) choice upgrade, automatically refresh watercress to 100%, by now watercress upgrades made its lifetime already longer so the time loss matters less
    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f = state.field[y][x];
        if(f.index == CROPINDEX + brassica_0) f.growth = 1;
      }
    }
  },
 'Sturdy brassica', 'High-yield brassica',
 'Increases brassica (such as watercress) copying effect constantly by 25% and its lifetime by ' + Num(watercress_choice_lifetime_increase).toPercentString() + '. In addition, the brassica will never fully wither, it will remain with limited production after the end of its lifetime. This benefits idle play more than active play, compared to the other choice.',
 'Increases brassica (such as watercress) copying effect by 50% initially, but after a while this bonus gradually reduces to the default production. It will also never wither, but with much less production than the sturdy brassica choice at end of life. This benefits active play more than idle play, compared to the other choice.',
 '#000', '#fff', images_watercress[4], undefined);
upgrades[watercress_choice0].istreebasedupgrade = true;


var resin_choice0_resin_bonus = 0.25;
var resin_choice0_production_bonus = 0.25;

var resin_choice0 = registerChoiceUpgrade('resin choice',
  function() {
    return state.treelevel >= 22;
  }, function() {
    // nothing to do, fact that upgrade is done is handled elsewhere
  },
 'Resin bonus', 'Production bonus',
 'Gives a ' + (resin_choice0_resin_bonus * 100) + '% bonus to resin production, but not to seed and spores production',
 'Gives a ' + (resin_choice0_production_bonus * 100) + '% bonus to seed and spores production, but not to resin production',
 '#000', '#fff', image_resin, undefined);
upgrades[resin_choice0].istreebasedupgrade = true;




// they must be in increasing order for the savegame handling
registered_upgrades = registered_upgrades.sort(function(a, b) {
  return a - b;
});


function pumpkinUnlocked() {
  if(state.challenge) return false; // disable challenges at all in first release, in case it turns out much too strong

  if(!(state.holiday & 4)) return false;
  if(basicChallenge()) return false;
  if(!state.g_numresets) return false; // don't introduce the pumpkin on first playtrough yet
  if(!state.upgrades[berryunlock_0].count) return false; // must have unlocked at least the first berry

  var challenge_ok = false;
  if(state.challenge == 0) challenge_ok = true;
  if(state.challenge == challenge_rocks || state.challenge == challenge_thistle) challenge_ok = true; // unlikely the pumpkin fits but it might
  if(state.challenge == challenge_infernal) challenge_ok = true;
  if(state.challenge == challenge_stormy) challenge_ok = true;
  if(state.challenge == challenge_noupgrades) challenge_ok = true;
  if(state.challenge == challenge_wither) challenge_ok = true;
  if(state.challenge == challenge_wasabi) challenge_ok = true;
  // rockier not: the pumpkin doesn't fit there anyway
  // bees and blackberry not: only has specific crops
  // nodelete not: is about planting crops only once which gradually fills up whole field, no place for pumpkin there
  // basic challenges not: no benefits for them
  // poison ivy challenge not: there's never room for a 2x2 pumpkin in the space available during this challenge
  if(!challenge_ok) return false;
  return true;
}

upgrade_register_id = 2000;
var eventcropunlock_0 = registerCropUnlock(pumpkin_0, halloween_pumpkin_price, undefined, function(){
  return pumpkinUnlocked();
});



// more prestiges
upgrade_register_id = 3000;
var nutprestige_0 = registerCropPrestige(nut_0, getNutCost(16), CROPTYPE_NUT, 15);
var nutprestige_1 = registerCropPrestige(nut_1, getNutCost(17), CROPTYPE_NUT, 16);
var nutprestige_2 = registerCropPrestige(nut_2, getNutCost(18), CROPTYPE_NUT, 17);
var nutprestige_3 = registerCropPrestige(nut_3, getNutCost(19), CROPTYPE_NUT, 18);
var nutprestige_4 = registerCropPrestige(nut_4, getNutCost(20), CROPTYPE_NUT, 19);
var nutprestige_5 = registerCropPrestige(nut_5, getNutCost(21), CROPTYPE_NUT, 20);
var nutprestige_6 = registerCropPrestige(nut_6, getNutCost(22), CROPTYPE_NUT, 21);
var nutprestige_7 = registerCropPrestige(nut_7, getNutCost(23), CROPTYPE_NUT, 22);
var nutprestige_8 = registerCropPrestige(nut_8, getNutCost(24), CROPTYPE_NUT, 23);
var nutprestige_9 = registerCropPrestige(nut_9, getNutCost(25), CROPTYPE_NUT, 24);
var nutprestige_10 = registerCropPrestige(nut_10, getNutCost(26), CROPTYPE_NUT, 25);
var nutprestige_11 = registerCropPrestige(nut_11, getNutCost(27), CROPTYPE_NUT, 26);
var nutprestige_12 = registerCropPrestige(nut_12, getNutCost(28), CROPTYPE_NUT, 27);
var nutprestige_13 = registerCropPrestige(nut_13, getNutCost(29), CROPTYPE_NUT, 28);
var nutprestige_14 = registerCropPrestige(nut_14, getNutCost(30), CROPTYPE_NUT, 29);
var nutprestige_15 = registerCropPrestige(nut_15, getNutCost(31), CROPTYPE_NUT, 30);


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// @constructor
function Challenge() {
  this.name = 'a';
  this.description = 'a';
  this.rewarddescription = ['a'];
  this.unlockdescription = 'a';
  this.index = 0;

  // whether during this challenge, resin/twigs/fruit is given out or not
  // should be "false" for challenges that can have a benefit (even if it doesn't appear they do, like the bees challenge: it is much harder than main game, but has its own special bee crops that could theoretically give an advantage, so do not let such challenge farm resin)
  // can be true for challenges that are strictly harder than main game, e.g. "rocks" challenge where everything is the same except rocks that give no advantage, only guaranteed disadvantage
  // NOTE:
  // only can gain the resin if at least level 10 reached, to be similar to regular game (since challenges can be quit early which would allow quick farming)
  // also cannot gain resin if you reach higher level than highest level in main game: this in case a challenge is accidently broken, super easy, and allows gaining resin too easy that way
  this.allowsresin = false;
  // NOTE:
  // don't give out the lvl 5 fruit (or give it only at 10), to be similar to regular game (since challenges can be quit early which would allow quick farming)
  // also don't give out fruit if reaching higher level than with a regular run
  this.allowsfruits = false;
  // NOTE:
  // doesn't give out twigs before level 10, to be similar to regular game (since challenges can be quit early which would allow quick farming)
  // also don't give out fruit if reaching higher level than with a regular run
  this.allowstwigs = false;
  // whether nuts crops are allowed
  this.allowsnuts = false;
  // for any of the above things: whether they're also allowed above the highest level of tree ever reached in regular game
  // this serves as a protection in case a challenge turns out to be too easy and makes farming easier than the main game
  // but for something like the rock challenge, this can be enabled
  // To be clear: you can still go beyond the highest level with this challenge if this is false. It just won't drop the above things.
  this.allowbeyondhighestlevel = false;

  // either targetlevel is an array and the others undefined, or targetfun and targetdescription are given (and are not arrays but a function and a string) and targetlevel is undefined
  // if targetlevel is empty array, there's no target level at all and the challenge's only reward is production bonus from reaching higher levels in it (NOTE: tree level 1 must still be reached at least to count the challenge as a 'run' and thus 'completed' at all)
  this.targetlevel = [0];
  this.targetfun = undefined;
  this.targetdescription = undefined;

  /* which formula is used to compute the bonus overall
  value 0:
  system from mid 2023 and some time before that (but this is already a different system than initial game release, which is completely gone here)

  value 1:
  new system introduced for tower defense end 2023 (and planned to extend to other challenges)
  at every level of the form A + B * level, an exponential increase is given (e.g. B=100 for every 100 levels such increase)
  in-between a smaller non-exponential bonus is given, which is more significant again after each of the exponential bumps
  levels of the form A + B * level are the "key" levels, and in addition level 0 is a key level if A > 0
  between two key levels K0 and K1, bonus linearly ramps up from K0 to K0 * + (K1 - K0) * p, where p is e.g. 0.5 to go to midway

  value 2:
  works like value 1 for seeds/spores production bonus
  works like value 0 for resin/twigs bonus
  this is a temporary measure while gradually moving everything to value 1, to allow already moving the production bonus to it but the resin/twigs is a bit more tricky to change for everyone
  */
  this.bonus_formula = 0;


  // for formula=0. main bonus multiplier
  this.bonus = Num(0);
  // for formula=0. if higher than 0, bonus only starts working from that level
  this.bonus_min_level = 0;
  // for formula=0. if higher than 0, bonus stops above this level, it's a hard cap
  this.bonus_max_level = 0;
  // for formula=0: exponent for the bonus formula. Total formula is: bonus * level^exponent, with level = max(0, level_reached - min_level)
  this.bonus_exponent = Num(1);
  // for formula=0. an additional completion bonus
  this.completion_bonus = Num(0);


  // for formula=1: base of exponent for each key level, e.g. 1.5 to make it a 50% boost for each key milestone reached
  this.bonus_exponent_base_a = Num(1);
  this.bonus_exponent_base_b = Num(1);
  // for formula=1: defines key levels
  this.bonus_level_a = 0; // first level with exponential increase
  this.bonus_level_b = 0; // num levels between each next level with exponential increase
  // for formula=1: defines progression between key levels
  this.bonus_p = 0.5;

  this.cycling = 0; // if 2 or higher, this challenge cycles between different states, with each their own max level. The current cycle is (state.challenges[id].num_completed % challenges[id].cycling).

  this.cycling_bonus = undefined; // is array if this challenge is cycling, and then replaces this.bonus.

  // if true, will offer to turn off auto-actions when staring the challenge, for challenges where planting a regular blueprint would make no sense and hamper the challenge. The very first auto-action (if there's one at 0 minutes) will still happen (the player at least sees this one happening so can correct, plus it may do things like select the right fruit)
  // this is left false for challenges that have more standard rules (including e.g. blackberry challenge) since there the same auto-actions as in a regular run may be appliccable (though they may also not be, e.g. timings are different, but it'll be less damaging to the run)
  this.autoaction_warning = false;

  // if set, then will have link to open the help dialog from the challenge info dialog
  this.helpdialogindex = undefined;

  this.prefun = function() {
    return false;
  };
  this.rewardfun = [function() {
  }];

  // whether a stage is completed in the current run (whether for the first time, or any later time in re-runs)
  this.stageCompleted = function(stage) {
    if(this.targetlevel == undefined) {
      return this.targetfun();
    } else if(this.targetlevel.length == 0) {
      return false; // there are no stages in this challenge so there's none to complete
    } else {
      return state.treelevel >= this.targetlevel[stage];
    }
  };

  this.numStages = function() {
    if(this.targetlevel == undefined) {
      return 1; // targetfun represents the one stage
    } else {
      return this.targetlevel.length; // this can be 0 if there's no target level at all
    }
  };

  // this is different than state state.challenges[this.index].num_completed: that one is about amount of times target level reached, while here it's about amount of different target levels reached, if there are multiple stages
  // for challenges that have no stages, will return 1 if the challenge was ever run at all
  this.numStagesCompleted = function(opt_include_current_run) {
    if(this.numStages() == 0) {
      // the challenge has no stages or target level at all, but still only consider it completed if at least one run was done
      return (state.challenges[this.index].num > 0 || (opt_include_current_run ? (state.challenge == this.index) : false)) ? 1 : 0;
    }
    var completed = state.challenges[this.index].completed;
    if(opt_include_current_run && state.challenge == this.index && completed < this.numStages() && this.stageCompleted(completed)) completed++;
    return completed;
  };

  // use numStagesCompleted to check if any stage at all was completed, or fullyCompleted to check all stages are completed
  // does not take cycles into account (from this.cycling), use allCyclesCompleted for that
  // for challenges that have no stages, returns true if at least 1 run was done
  // aka allStagesCompleted
  this.fullyCompleted = function(opt_include_current_run) {
    if(this.numStages() == 0) {
      // the challenge has no stages or target level at all, but still only consider it completed if at least one run was done
      return state.challenges[this.index].num > 0 || (opt_include_current_run ? (state.challenge == this.index) : false);
    }
    return this.numStagesCompleted(opt_include_current_run) >= this.numStages();
  };

  // Whether you've completed the next stage of the challenge, during the current run.
  // Will also return true if you've completed the final stage this run while you already had completed the final stage before in an earlier run.
  // For challenges that have multiple target levels, this returns whether the next stage that was not yet beaten during previous runs, is beaten now.
  // For challenged with just a single target level, or a single non-level based target, this returns if that target was reached during this run.
  // Does not have an 'opt_include_current_run' parameter (it's always implied true), since "having reached the next target level" only applies to the current run, during the next run the target level would be different again
  this.nextStageCompleted = function() {
    if(this.targetlevel == undefined) {
      // it's a challenge based on some other goal than a target level
      return this.targetfun();
    } else if(this.targetlevel.length == 0) {
      // the challenge doesn't have any target at all
      // however, we consider reaching any tree level as reaching the goal during this challenge
      return state.treelevel > 0;
    } else {
      return state.treelevel >= this.nextTargetLevel(false); // next target level as it was right at the moment of starting this challenge
    }
  };

  // Returns the same as nextStageCompleted if the challenge is not already fully completed before this run, otherwise instead returns whether the highest level record is broken during this run
  this.nextStageCompletedOrRecordBroken = function() {
    if(this.fullyCompleted(false)) {
      return state.treelevel > state.challenges[this.index].maxlevel;
    } else {
      return this.nextStageCompleted();
    }
  };

  // whether a given cycle was ever completed
  // if the challenge is not cycling, then it returns if the one main cycle is completed (and the cycle parameter is ignored so may be undefined if desired)
  // does not look at stages, considers it complete after first stage is reached
  this.cycleCompleted = function(cycle, opt_include_current_run) {
    var c2 = state.challenges[this.index];
    if(this.cycling <= 1) {
      if(c2.completed) return true;
      return opt_include_current_run ? this.stageCompleted(0) : false;
    }
    var num_completed = c2.num_completed;
    if(opt_include_current_run && state.challenge == this.index && this.stageCompleted(0)) num_completed++;
    return num_completed > cycle;
  };

  this.allCyclesCompleted = function(opt_include_current_run) {
    if(this.cycling <= 1) return this.fullyCompleted(opt_include_current_run);
    var num_completed = state.challenges[this.index].num_completed;
    if(opt_include_current_run && state.challenge == this.index && this.stageCompleted(0)) num_completed++;
    return num_completed > 0 && num_completed >= this.cycling;
  };

  this.getCurrentCycle = function(opt_include_current_run) {
    if(this.cycling < 2) return 0;
    var num_completed = state.challenges[this.index].num_completed;
    if(opt_include_current_run && state.challenge == this.index && this.stageCompleted(0)) num_completed++;
    return num_completed % this.cycling;
  };

  // returns either the reward level of the next stage, or if fully completed, that of the last stage
  this.nextTargetLevel = function(opt_include_current_run) {
    if(this.targetlevel == undefined) return 0; // not level based
    if(this.targetlevel.length == 0) return 0; // not level based
    if(this.fullyCompleted(opt_include_current_run)) return this.targetlevel[this.targetlevel.length - 1];
    return this.targetlevel[this.numStagesCompleted(opt_include_current_run)];
  };

  this.finalTargetLevel = function() {
    if(this.targetlevel == undefined) return 0; // not level based
    if(this.targetlevel.length == 0) return 0; // not level based
    return this.targetlevel[this.targetlevel.length - 1];
  };

  this.getRulesDescription = function() {
    if(typeof this.rulesdescription_ == 'string') return this.rulesdescription_;
    return this.rulesdescription_();
  };

  // actual implementation of the challenge is not here, but depends on currently active state.challenge
};

var registered_challenges = []; // indexed consecutively, gives the index to medal
var challenges = []; // indexed by medal index (not necessarily consectuive

// 0 means no challenge
var challenge_register_id = 1;

// targetlevel = can be one of three things:
// - a single numeric value: the tree level needed to finish this challenge
// - an empty array, to indicate the challenge is not target based at all
// - an array of numeric values: multiple target levels, in case this is a multi-target-challenge
// - undefined, to use function instead, see next point
// alternatively to targetlevel, you can give targetfun and targetdescription (not arrays): a function that is a finish condition for the challenge
// --> either targetlevel must be undefined and targetfun+targetdescription given, or targetlevel must be given and targetfun+targetdescription both undefined
// prefun = precondition to unlock the challenge
// rewardfun = for completing the challenge the first time. This function may be ran only once, and should be called after all other challenge-related completions stats (such as num_completion variables in the state) are already updated
// allowflags: 1=resin, 2=fruits, 4=twigs, 8=beyond highest level, 16=nuts
// rulesdescription must be a list of bullet points; it may be either a string, or a function that returns a string
function registerChallenge(name, targetlevel, targetfun, targetdescription, description, rulesdescription, rewarddescription, unlockdescription, prefun, rewardfun, allowflags) {
  if(challenges[challenge_register_id] || challenge_register_id < 0 || challenge_register_id > 65535) throw 'challenge id already exists or is invalid!';

  if(targetlevel != undefined && !Array.isArray(targetlevel)) targetlevel = [targetlevel];
  //if(targetfun != undefined && !Array.isArray(targetfun)) targetfun = [targetfun];
  //if(targetdescription != undefined && !Array.isArray(targetdescription)) targetdescription = [targetdescription];

  if(!Array.isArray(rewarddescription)) rewarddescription = [rewarddescription];
  if(!Array.isArray(rewardfun)) rewardfun = [rewardfun];

  var challenge = new Challenge();
  challenge.index = challenge_register_id++;
  challenges[challenge.index] = challenge;
  registered_challenges.push(challenge.index);

  challenge.name = name;
  challenge.description = description;
  challenge.rulesdescription_ = rulesdescription;
  challenge.rewarddescription = rewarddescription;
  challenge.unlockdescription = unlockdescription;
  challenge.targetlevel = targetlevel;
  challenge.targetfun = targetfun;
  challenge.targetdescription = targetdescription;
  challenge.prefun = prefun;
  challenge.rewardfun = rewardfun;

  challenge.allowsresin = !!(allowflags & 1);
  challenge.allowsfruits = !!(allowflags & 2);
  challenge.allowstwigs = !!(allowflags & 4);
  challenge.allowsnuts = !!(allowflags & 16);
  challenge.allowbeyondhighestlevel = !!(allowflags & 8);

  return challenge.index;
}


// 1
var challenge_bees = registerChallenge('bee challenge', 10, undefined, undefined,
'Grow bees during this challenge! This has different gameplay than the regular game.',
`
• You get only limited regular crops, and must instead boost global production using specially placed bees:<br>
&nbsp;&nbsp;- Worker bees must be next to a flower, to add to a global boost.<br>
&nbsp;&nbsp;- Drones must be next to a worker bee, to boost that worker.<br>
&nbsp;&nbsp;- Queens must be next to a drone, to boost that drone.<br>
&nbsp;&nbsp;- You still also have to use berries, mushrooms, flowers and watercress to get the necessary spores and seeds.<br>
• The only types of crop available are 1 berry type, 1 mushroom type, 1 flower type and 3 types of bee. They\'re all available from the beginning, and no others unlock.<br>
• The bee boost applies to the global ecosystem: all berries, mushrooms and flowers (so effectively cubic scaling).<br>
• "Neighbor" and "next to" mean the 4-neighborhood, so orthogonally touching but not diagonally.<br>
`,
'Bee nests available in the regular game from now on after planting daisies. In the main game, bee nests boost flowers next to the bee nests. The bee types of this challenge don\'t exist in the main game and the bee nest works very differently in the main game (no global boost) than the bees in this challenge.',
'having grown a daisy.',
function() {
  return state.fullgrowncropcount[flower_3] >= 1;
}, function() {
  // nothing here: the reward is unlocked indirectly by having this challenge marked complete
}, 0);
challenges[challenge_bees].bonus = Num(0.5);
challenges[challenge_bees].bonus_min_level = 0;
challenges[challenge_bees].completion_bonus = Num(0.5);
challenges[challenge_bees].bonus_exponent = Num(0.25); // such low exponent because before v0.10.0, challenge bonuses were additive with each other, when changing them to multiplicative, earlier challenges needed low exponents but high bases to keep the bonuses similar for contemporary low level vs high level players (the other mechanism that also aids with this is completion_bonus)
challenges[challenge_bees].autoaction_warning = true;

// 2
var challenge_rocks = registerChallenge('rocks challenge', [15, 45, 75, 105, 135, 165, 195, 225], undefined, undefined,
`The field has rocks on which you can't plant. The rock pattern is randomly generated at the start of the challenge, but will always be the same within the same when starting in the same 3-hour time interval (based on global UTC time)`,
function() {
  return '• All regular crops, upgrades, ... are available and work as usual<br>' +
         '• There are randomized unremovable rocks on the field, blocking the planting of crops<br>' +
         '• Next pattern reset in: ' + util.formatDuration(getRocksChallengeTimeTilNextSeed()) + '<br>';
},
['one extra storage slot for fruits','another extra storage slot for fruits','another extra storage slot for fruits','another extra storage slot for fruits','another extra storage slot for fruits','another extra storage slot for fruits','another extra storage slot for fruits','another extra storage slot for fruits'],
'reaching tree level 15',
function() { return state.treelevel >= 15; },
[
function() { state.fruit_slots++; },
function() { state.fruit_slots++; },
function() { state.fruit_slots++; },
function() { state.fruit_slots++; },
function() { state.fruit_slots++; },
function() { state.fruit_slots++; },
function() { state.fruit_slots++; },
function() { state.fruit_slots++; }
]
, 31);
challenges[challenge_rocks].bonus_formula = 2;
challenges[challenge_rocks].bonus_level_a = 15;
challenges[challenge_rocks].bonus_level_b = 100;
challenges[challenge_rocks].bonus_p = 0.75;
challenges[challenge_rocks].bonus_exponent_base_a = Num(1.6);
challenges[challenge_rocks].bonus_exponent_base_b = Num(1.4);
// old values, for resin/twigs
challenges[challenge_rocks].bonus = Num(0.2);
challenges[challenge_rocks].bonus_min_level = 0;
challenges[challenge_rocks].completion_bonus = Num(0.5);
challenges[challenge_rocks].bonus_exponent = Num(0.2);
challenges[challenge_rocks].autoaction_warning = true;


// 3
var challenge_nodelete = registerChallenge('undeletable challenge', 25, undefined, undefined,
`
During this challenge, no crops can be removed, only added. Ensure to leave spots open for future crops, and plan ahead before planting!
`,
`
• Blueberry secret and cranberry secret don't work<br>
• All regular crops, upgrades, ... are available and work as usual<br>
• No crops can be deleted, except watercress<br>
`,
'deleting a crop gives 66% instead of 33% recoup of resources',
'reaching tree level 27',
function() {
  return state.treelevel >= 27;
}, function() {
  // nothing here: the reward is unlocked indirectly by having this challenge marked complete
}, 11);
challenges[challenge_nodelete].bonus = Num(0.1);
challenges[challenge_nodelete].bonus_min_level = 10;
challenges[challenge_nodelete].completion_bonus = Num(0.5);
challenges[challenge_nodelete].bonus_exponent = Num(0.5);
// idea: a harder version of this challenge that takes place on a fixed size field (5x5)
challenges[challenge_nodelete].autoaction_warning = true;


// 4
// reason why watercress upgrade is still present: otherwise it disappears after a minute, requiring too much manual work when one wants to upkeep the watercress
var challenge_noupgrades = registerChallenge('no upgrades challenge', [20, 30], undefined, undefined,
`
During this challenge, crops cannot be upgraded.
`,
`
• Crops cannot be upgraded, except watercress<br>
• Ethereal upgrades, achievement boost, etc..., still apply as normal<br>
`,
['unlock the auto-upgrade and auto-choice abilities of the automaton' ,'add more options to the cost configuration dialogs of the automaton'],
'reaching ethereal tree level 2 and having automaton',
function() {
  return state.treelevel2 >= 2 && haveAutomaton();
},
[
function() {
  showRegisteredHelpDialog(29);
  showMessage('Auto-upgrade unlocked!', C_AUTOMATON, 1067714398);
},
function() {
  for(var i = 1; i < state.automaton_autoupgrade_fraction.length; i++) {
    state.automaton_autoupgrade_fraction[i] = state.automaton_autoupgrade_fraction[0];
  }
  for(var i = 1; i < state.automaton_autoplant_fraction.length; i++) {
    state.automaton_autoplant_fraction[i] = state.automaton_autoplant_fraction[0];
  }
  showRegisteredHelpDialog(30);
  showMessage('Auto-upgrade extra options unlocked!', C_AUTOMATON, 1067714398);
}
], 31);
challenges[challenge_noupgrades].bonus = Num(0.003);
challenges[challenge_noupgrades].bonus_min_level = 10;
challenges[challenge_noupgrades].completion_bonus = Num(0.5);

// is an upgrade not available during challenge_noupgrades
// that is all crop upgrades, except watercress
function isNoUpgrade(u) {
  return u.iscropupgrade && u.index != brassicamul_0 && u.index != brassicamul_1;
}


// 5
// This challenge does not give resin, twigs or fruits. This challenge plants crops immediately, so it's easier to reach higher level faster while manually present
// If this challenge would hand out resin, it'd be possible to farm resin very fast at the cost of a lot of manual action, and this game tries to avoid that
// The reason for the no deletion rule is: crops produce less and less over time, so one could continuously replant crops to have the full production bar, but this too
// would be too much manual work, the no delete rule requires waiting for them to run out. But allowing to upgrade crops to better versions allows to enjoy a fast unlock->next crop cycle
var challenge_wither = registerChallenge('wither challenge', [50, 70, 90, 110, 130, 150, 170, 200], undefined, undefined,
`
During this challenge, crops wither and must be replanted.
`,
`
• Planted crops are fullgrown immediately<br>
• Planted crops wither and disappear after 2 minutes<br>
• Crops gradually produce less and less as they wither<br>
• Cannot delete crops, they'll disappear over time instead, but you can replace crops immediately by more expensive crops of the same type.<br>
• Cannot use blueprints. However, one of the later target levels of this challenge unlocks the ability to use them in this challenge too.<br>
`,
['unlock the auto-action ability of the automaton',
 'allow using blueprints during future wither challenge runs',
 'unlock one more automaton auto-action',
 'auto-action can now also automate weather, fern and brassica refresh',
 'unlock one more automaton auto-action',
 'unlock auto-transcend, season overrides and auto-hold-season',
 'unlock one more automaton auto-action',
 'unlock one more automaton auto-action'],
'reaching ethereal tree level 5 and having automaton with auto-unlock plants',
function() {
  return state.treelevel2 >= 5 && haveAutomaton() && autoUnlockUnlocked();
},
[
function() {
  state.updateAutoActionAmount(numAutoActionsUnlocked());
  //state.automaton_autoactions[0].enabled = true;
  showMessage('Automaton auto-action unlocked!', C_AUTOMATON, 1067714398, undefined, undefined, true);
  showRegisteredHelpDialog(40);
},
function() {
  showMessage('From now on, you can use blueprints during the wither challenge!', C_AUTOMATON, 1067714398, undefined, undefined, true);
},
function() {
  state.updateAutoActionAmount(numAutoActionsUnlocked());
  showMessage('An additional automaton auto-action unlocked!', C_AUTOMATON, 1067714398, undefined, undefined, true);
},
function() {
  showMessage('From now on, auto-actions can also be configured to activate weather, refresh brassica or pick up a fern!', C_AUTOMATON, 1067714398, undefined, undefined, true);
},
function() {
  state.updateAutoActionAmount(numAutoActionsUnlocked());
  showMessage('An additional automaton auto-action unlocked!', C_AUTOMATON, 1067714398, undefined, undefined, true);
},
function() {
  showMessage('Auto-transcend unlocked!', C_AUTOMATON, 1067714398, undefined, undefined, true);
  showRegisteredHelpDialog(45);
},
function() {
  state.updateAutoActionAmount(numAutoActionsUnlocked());
  showMessage('An additional automaton auto-action unlocked!', C_AUTOMATON, 1067714398, undefined, undefined, true);
},
function() {
  state.updateAutoActionAmount(numAutoActionsUnlocked());
  showMessage('An additional automaton auto-action unlocked!', C_AUTOMATON, 1067714398, undefined, undefined, true);
}
], 0);
challenges[challenge_wither].bonus = Num(0.003);
challenges[challenge_wither].bonus_min_level = 30;
challenges[challenge_wither].completion_bonus = Num(0.5);
challenges[challenge_wither].autoaction_warning = true;

function witherDuration() {
  return 120;
  //return crops[brassica_0].getPlantTime();
}

// t must be in range 0-1 (1 representing full grown)
function witherCurve(t) {
  if(t < 0) return 0;
  if(t > 1) return 1;
  // make it not linear, but such that the wither gives a bit higher production in the beginning than linear dropoff would give
  // sqrt feels a bit to easy, so using a slightly higher power than 0.5
  return Math.pow(t, 0.66);
}

// 6
var challenge_blackberry = registerChallenge('blackberry challenge', [19], undefined, undefined,
`
During this challenge, only the first tier of each crop type is available.
`,
`
• Only blackberries, champignons, anemones, nettle, bee nests, watercress and mistletoe are available, from the beginning<br>
`,
['unlock the auto-unlock ability of the automaton'],
'reaching ethereal tree level 3 and having automaton with auto-upgrade',
function() {
  return state.treelevel2 >= 3 && haveAutomaton() && autoUpgradesUnlocked();
},
[
function() {
  showMessage('Auto-unlock unlocked!', C_AUTOMATON, 1067714398);
  showRegisteredHelpDialog(33);
},
], 15);
challenges[challenge_blackberry].bonus = Num(0.003);
challenges[challenge_blackberry].bonus_min_level = 0;
challenges[challenge_blackberry].completion_bonus = Num(0.25);

var rockier_text = 'A harder version of the rocks challenge. The field has a difficult predetermined rock pattern. Beating the challenge the first time gives a new type of passive bonus (multiplicity). The rock patterns are very restrictive and don\'t benefit from field size above 5x5. This challenge is not a cakewalk, especially later patterns.';
var rockier_text_long = `
• All regular crops, upgrades, ... are available and work as usual<br>
• There are unremovable rocks on the field, blocking the planting of crops<br>
• Bees can't diagonally reach flowers even in spring, due to the heavy amount of rocks<br>
• The rock pattern is predetermined, every time you beat the challenge it cycles to a next, harder, pattern<br>
• There are 5 patterns in total, each gives an achievement<br>
`;
var rockier_text_unlock_reason = 'reaching tree level 45';

var rockier_layouts = [
  '0001000010100001001100011',
  '1001010000010011110101000',
  '0000010001000110100101000',
  '0100100001000011000011000',
  '0000000001000011100100000'
  // the following one is too difficult and omitted: 1101000000100001001000010
];

// 7
var challenge_rockier = registerChallenge('rockier challenge', [40], undefined, undefined,
rockier_text, rockier_text_long, 'multiplicity for berries and mushrooms', rockier_text_unlock_reason,
function() {
  return state.treelevel >= 45;
}, function() {
  showRegisteredHelpDialog(34);
}, 31);
challenges[challenge_rockier].bonus = Num(0);
challenges[challenge_rockier].bonus_min_level = 20;
challenges[challenge_rockier].completion_bonus = Num(0.2);
challenges[challenge_rockier].cycling = 5;
challenges[challenge_rockier].cycling_bonus = [Num(0.02), Num(0.025), Num(0.03), Num(0.035), Num(0.04)];
challenges[challenge_rockier].bonus_exponent = Num(0.5);
challenges[challenge_rockier].autoaction_warning = true;



// 8
var challenge_thistle = registerChallenge('thistle challenge', [66], undefined, undefined,
`The field is full of thistles which you cannot remove. The thistle pattern is randomly determined at the start of the challenge, and is generated with a 3-hour UTC time interval as pseudorandom seed, so you can get a new pattern every 3 hours. The thistles hurt most crops, but benefit mushrooms, they are next-tier nettles.`,
function() {
  return '• All regular crops, upgrades, ... are available and work as usual<br>' +
         '• There are randomized unremovable thistles on the field, which hurt crops that touch them, but benefit mushrooms, more than nettles<br>' +
         '• Next pattern reset in: ' + util.formatDuration(getRocksChallengeTimeTilNextSeed()) + '<br>';
},
['Unlocks the thistle crop, which is the next tier of nettles. Once unlocked, it\'s available in the base game once you have grown a portobello.'],
//'reaching tree level 70',
'having grown a portobello',
function() {
  //return state.treelevel >= 70;
  return state.fullgrowncropcount[mush_5] >= 1;
}, function() {
  showMessage('Thistle unlocked! Thistle is the next tier of the nettle crop.');
}, 31);
challenges[challenge_thistle].bonus_formula = 2;
challenges[challenge_thistle].bonus_level_a = 70;
challenges[challenge_thistle].bonus_level_b = 100;
challenges[challenge_thistle].bonus_p = 0.75;
challenges[challenge_thistle].bonus_exponent_base_a = Num(1.25);
challenges[challenge_thistle].bonus_exponent_base_b = Num(1.75);
// old values, for resin/twigs
challenges[challenge_thistle].bonus = Num(0.002);
challenges[challenge_thistle].bonus_min_level = 33;
//
challenges[challenge_thistle].autoaction_warning = true;


// 9
var challenge_wasabi = registerChallenge('wasabi challenge', [65], undefined, undefined,
`You only get income from brassica, such as watercress.`,
`
• You can only get income from brassica, such as watercress, and their copying effect.<br>
• Mushrooms, berries, flowers and so on all still work as normal, but you need to ensure there's a brassica next to some berry, and a brassica next to some mushroom, to get income.<br>
• The brassica copying fruit ability does not work during this challenge.<br>
• As usual, having multiple brassica reduces the global brassica copying effect, max 2 or so works well.<br>
`,
['Unlocks the wasabi crop, which is the next tier of brassica after watercress. Once unlocked, it\'s available in the base game once you have grown a juniper (berry tier 9), and can be used in re-runs of this challenge as well.'],
'reaching ethereal tree level 7',

function() {
  return state.treelevel2 >= 7; // NOTE: Keep in sync with showEtherealTreeLevelDialog
}, function() {
  showMessage('Wasabi unlocked! Wasabi is the next tier of brassica, after watercress crop.');
}, 31);
challenges[challenge_wasabi].bonus_formula = 2;
challenges[challenge_wasabi].bonus_level_a = 65;
challenges[challenge_wasabi].bonus_level_b = 100;
challenges[challenge_wasabi].bonus_p = 0.66;
challenges[challenge_wasabi].bonus_exponent_base_a = Num(1.25);
challenges[challenge_wasabi].bonus_exponent_base_b = Num(1.75);
// old values, for resin/twigs
challenges[challenge_wasabi].bonus = Num(0.0025);
challenges[challenge_wasabi].bonus_min_level = 40;



// 10
var challenge_basic = registerChallenge('basic challenge', /*targetlevel=*/[10], /*targetfun=*/undefined, /*targetdescription=*/undefined,
`Upgrades and effects that last through transcensions don't work, everything is back to basics`,
`
• Everything, except the effects listed below, is back to basics like at the first run of the game: Upgrades and effects that last through transcensions (e.g. ethereal crops and upgrades, achievement bonus, squirrel, challenge bonus, multiplicity, ...) or unlock later (amber, ...) don't work.<br>
• Basic upgrades, weather, seasons, etc... work, since these are part of a single run, not an effect that lasts through transcensions<br>
• Automation with the automaton works<br>
• Crops that were unlocked by a challenge, like bee nests, are available if unlocked, but they may not be feasibly reachable<br>
• Fruits only partially work, as follows:<br>
&nbsp;&nbsp;- The fruit abilities strength is virtually reduced to that of a fruit with tier as low as current tree level could drop (e.g. zinc or bronze) with all abilities at maximum level 3.<br>
&nbsp;&nbsp;- This will be visible in the detailed crop stats in the field, the fruit tab itself will show the fruits with their original levels as if the challenge isn't active.<br>
&nbsp;&nbsp;- You get the benefit of having multiple abilities of higher tier fruits, even though the fruit otherwise acts like a lower tier one.<br>
• Field size remains at your current size, it is not lowered to the original 5x5.<br>
• Reminder: you have to plant enough watercress before blackberry unlocks<br>
`,
['No special reward other than the challenge production bonus itself!'],
'reaching tree level 50',
function() {
  return state.treelevel >= 50;
}, function() {
}, 0);
challenges[challenge_basic].bonus = Num(0.075);
challenges[challenge_basic].bonus_min_level = 10;
challenges[challenge_basic].completion_bonus = Num(0.35);
challenges[challenge_basic].bonus_exponent = Num(0.5);
challenges[challenge_basic].bonus_max_level = 30; // Important: this must be kept even after switching to the new challenge formula, basic challenge must remain capped
//challenges[challenge_basic].autoaction_warning = true;

// 11
var challenge_truly_basic = registerChallenge('truly basic challenge', [10], undefined, undefined,
`Like the basic challenge, but even less effects work, truly everything is back to basics.`,
`
• Truly everything is back to basics like at the first run of the game and even a bit more difficult. Running this challenge now is as good as it can get since no future game advancement can make it easier.<br>
• Examples of effects that don't work: ethereal crops and upgrades, achievement bonus, squirrel, challenge bonus, multiplicity, resin bonus, amber, fruits, automaton, field size (it will be 5x5), bees don't exist, ...<br>
• Basic upgrades, weather, seasons, etc... work, since these are part of a single run, not an effect that lasts through transcensions<br>
• The tabs such as fruit, automaton, squirrel and ethereal field are visible and usable, but won't affect the basic field during this challenge.<br>
• Reminder: you have to plant enough watercress before blackberry unlocks<br>
`,
['Automaton can do auto-prestige. This is available as part of auto-unlock and enabled by default.'],
'Prestiging any crop',
function() {
  return state.g_numprestiges >= 1;
}, function() {
  state.automaton_autoprestige = 1; // enable it by default, as part of auto planting
  showRegisteredHelpDialog(38);
  showMessage('Auto-prestige unlocked!', C_AUTOMATON, 2067714398);
}, 0);
challenges[challenge_truly_basic].bonus = Num(0.1);
challenges[challenge_truly_basic].bonus_min_level = 10;
challenges[challenge_truly_basic].completion_bonus = Num(0.35);
challenges[challenge_truly_basic].bonus_exponent = Num(0.5);
challenges[challenge_truly_basic].bonus_max_level = 25; // Important: this must be kept even after switching to the new challenge formula, basic challenge must remain capped
challenges[challenge_truly_basic].autoaction_warning = true;


var lightningTime = 120;
var challenge_stormy_mul = 0.25; // multiplier to weather effects of the reward


function isWeatherActive(weather) {
  if(weather == 0) return sunActive();
  if(weather == 1) return mistActive();
  if(weather == 2) return rainbowActive();
  return false;
}

// weather any weather is active (not the perma weather but full active weather)
function isAnyWeatherActive() {
  return sunActive() || mistActive() || rainbowActive();
}

// have the weaker but permanent after-weather effect reward from the stormy challenge
function havePermaWeather() {
  return state.challenges[challenge_stormy].completed && !basicChallenge() && state.challenge != challenge_stormy;
}

function havePermaWeatherFor(ability) {
  if(!havePermaWeather()) return false;

  if(isWeatherActive(state.lastWeather)) return false; // don't have perma weather active if true weather is currently active

  var unlocked = false;
  if(ability == 0) unlocked = !!state.upgrades[upgrade_sununlock].count;
  if(ability == 1) unlocked = !!state.upgrades[upgrade_mistunlock].count;
  if(ability == 2) unlocked = !!state.upgrades[upgrade_rainbowunlock].count;
  if(!unlocked) return false;

  //return state.challenges[challenge_stormy].completed && !basicChallenge() && state.challenge != challenge_stormy;
  return state.lastPermaWeather == ability;
}

// 12
var challenge_stormy = registerChallenge('stormy challenge', [65], undefined, undefined,
`The weather is stormy, other weather doesn't work`,
`
• The weather is stormy throughout the challenge, and other weather abilities don't work.<br>
• Every ` + Math.round(lightningTime / 60) + ` minutes, a crop gets hit by lightning and turns into a ghost. By an amazing coincidence, the lightning always hits the most expensive crop.<br>
• Berries, mushrooms and flowers are half as efficient as normal.<br>
`,
['Weather effects permanently last in a weaker form after they were activated.'],
'reaching tree level 65',
function() {
  return state.treelevel >= 65;
}, function() {
}, 31);
challenges[challenge_stormy].bonus = Num(0.0025);
challenges[challenge_stormy].bonus_min_level = 50;


function cropCanBeHitByLightning(f) {
  if(!f.hasRealCrop()) return false;
  if(f.growth < 0.1) return false;
  var c = f.getCrop();
  //return (c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH || c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_BEE || c.type == CROPTYPE_STINGING || c.type == CROPTYPE_MISTLETOE);
  return c.type != CROPTYPE_BRASSICA; // brassica are immune, this is because otherwise lighting will always strike those first when a blueprint was just planted, and it should hit a real crop first
}


// 13
var challenge_infernal = registerChallenge('infernal challenge', /*targetlevel=*/[], /*targetfun=*/undefined, /*targetdescription=*/undefined,
`A challenge where the season is infernal and everything is difficult.`,
`
• There is only one season: infernal. This doesn't affect the timing of seasons of regular runs.<br>
• Production or boost of most crops divided through 1 billion.<br>
• In addition, the stats of berries and mushrooms are reduced even more for higher tiers.<br>
• Seasonal boosts don't work.<br>
`,
['No special reward other than the challenge production bonus itself!'],
'reaching tree level 85',
function() {
  // would have been neat to unlock this challenge at 66, but stormy already unlocks at 65 which is too close
  return state.treelevel >= 85;
}, function() {
}, 0);
challenges[challenge_infernal].bonus_formula = 2;
challenges[challenge_infernal].bonus_level_a = 20;
challenges[challenge_infernal].bonus_level_b = 100;
challenges[challenge_infernal].bonus_p = 0.5;
challenges[challenge_infernal].bonus_exponent_base_a = Num(1.1);
challenges[challenge_infernal].bonus_exponent_base_b = Num(2);
// old values, for resin/twigs
challenges[challenge_infernal].bonus = Num(0.005);
challenges[challenge_infernal].bonus_min_level = 20;
challenges[challenge_infernal].bonus_exponent = Num(1.1);


// 14
var challenge_poisonivy = registerChallenge('poison ivy challenge', undefined, function() {
  if(state.crops[mush_2].prestige > 0) return true;
  if(state.crops[berry_6].prestige > 0) return true; // the berry after mush_2 (prestiged), just in case no mushrooms were grown
  return false;
}, 'prestige the morel',
`The field is full of poison ivy in a regular pattern which you cannot remove. The poison ivy hurts most crops, but benefits mushrooms, they are next-tier thistles.
`,
`
• All regular crops, upgrades, ... are available and work as usual<br>
• There are unremovable poison ivy on the field, which hurt crops that touch them, but benefit mushrooms, more than thistles<br>
• It's significantly harder to reach prestiged morel with this challenge than without.<br>
• Automaton will not buy poison ivy upgrades automatically during this challenge. Note that upgrading it makes the challenge even harder, so beware!<br>
`,
['Unlocks the poison ivy crop, which is the next tier of thistles. Once unlocked, it\'s available in the base game after growing a prestiged morel.'],
'having prestiged the morel',
function() {
  if(state.crops[mush_2].prestige > 0) return true;
  if(state.crops[berry_6].prestige > 0) return true; // the berry after mush_2 (prestiged), just in case no mushrooms were grown
  return false;
}, function() {
  showMessage('Poison ivy unlocked! Poison ivy is the next tier of the stingy crop, after the thistle.');
}, 31);
challenges[challenge_poisonivy].bonus_formula = 2;
challenges[challenge_poisonivy].bonus_level_a = 150;
challenges[challenge_poisonivy].bonus_level_b = 100;
challenges[challenge_poisonivy].bonus_p = 0.75;
challenges[challenge_poisonivy].bonus_exponent_base_a = Num(1.3);
challenges[challenge_poisonivy].bonus_exponent_base_b = Num(1.5);
// old values, for resin/twigs
challenges[challenge_poisonivy].bonus = Num(0.0075);
challenges[challenge_poisonivy].bonus_min_level = 130;
//challenges[challenge_poisonivy].bonus_exponent = Num(1.1);
challenges[challenge_poisonivy].autoaction_warning = true;



// 15
var challenge_towerdefense = registerChallenge('tower defense challenge', /*targetlevel=*/[], /*targetfun=*/undefined, /*targetdescription=*/undefined,
`Tower defense
`,
`
• Pests spawn from the top left of the field and will move towards the tree. Pests spawn in increasingly stronger waves, and defeating a wave will increase the tree level by 1.<br>
• You should build a maze, with crops, to make the path the pests have to take to the tree longer.<br>
• Crops cannot be deleted (once the waves started), but can upgraded and replaced (so the maze shape cannot be altered, but crop types can be changed)<br>
• It's not possible to block the maze, there must always be an open path to the tree.<br>
• The field size is 2 cells larger than usual in each direction.<br>
• When any pest reaches the tree, it's game over, the tree cannot level any further and the only remaining thing to do is to end the challenge<br>
• Mushrooms and brassica serve as the towers in "tower defence": they shoot spores at the pests to defeat them before they reach the tree.<br>
• Various types of statues can be placed next to mushrooms to affect their tower damage type.<br>
• Seeds are gained by eliminating pests.<br>
• The shooting damage of mushrooms and brassica depends on their spore production, which is determined by flowers, stingy crops and berries as usual (mostly).<br>
• Stingy crops boost mushrooms, but unlike normally also increase their seed consumption (higher tiers give a small seed efficiency bonus only).<br>
• Mushroom multiplicity does not make them consume more seeds.<br>
• Brassica can always copy diagonally from mushrooms (no squirrel ability required).<br>
• There's no penalty to brassica for having multiple brassica, but most brassica copying bonuses (like fruits and ethereal field) don't work.<br>
• Ferns don't appear during this challenge.<br>
• Crops grow faster than usual (and even faster before starting the waves), but towers cannot attack during the few seconds of growing time.<br>
• Crops give 100% of resources back when replaced, rather than only a partial recoup. It's possible to change the location of an expensive tower for free by downgrading one and upgrading another this way.<br>
• Automaton auto-plant will only work for a small fraction of resources (it will work normally before the first wave).<br>
• Any production/s shown for crops is not added to stacks, but instead used for damage calculations. The only income gotten is from exterminating pests. Production/s is shown to be able to see mushroom seed requirement for spores damage. Actual damage is a number that's derived from mushroom spore production and shown in mushroom info.<br>
• Crop costs for multiple of the same crop type scale higher than in the regular game.<br>
• If any tower hits with extremely high damage compared to the wave's health, it will fast forward to a later wave to speed up the early waves.<br>
• See the tower defense help dialog, which can be found under the main menu -> help -> tower defense (down in the list of dynamic help dialogs), or appears when starting tower defense for the first time, for more information on the individual tower and pest types, and tips.<br>
`,
['No special reward other than the challenge production bonus itself!'],
'reaching tree level 75',
function() {
  return state.treelevel >= 75;
}, function() {
  // no reward fun, only the production bonus
}, 0);
challenges[challenge_towerdefense].bonus = Num(1);
challenges[challenge_towerdefense].autoaction_warning = true;
challenges[challenge_towerdefense].bonus_formula = 1;
challenges[challenge_towerdefense].bonus_level_a = 75;
challenges[challenge_towerdefense].bonus_level_b = 100;
challenges[challenge_towerdefense].bonus_p = 0.66;
challenges[challenge_towerdefense].bonus_exponent_base_a = Num(2);
challenges[challenge_towerdefense].bonus_exponent_base_b = Num(2);
challenges[challenge_towerdefense].helpdialogindex = 44;



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// the register order is not suitable for display order, so use different array
// this should be roughly the order challenges are unlocked in the game
var challenges_order = [
  challenge_rocks, challenge_rockier, challenge_bees, challenge_nodelete,
  challenge_noupgrades, challenge_blackberry, challenge_wither,
  challenge_thistle, challenge_stormy, challenge_wasabi,
  challenge_basic, challenge_towerdefense, challenge_infernal, challenge_truly_basic,
  challenge_poisonivy
];


if(challenges_order.length != registered_challenges.length) {
  throw 'challenges order not same length as challenges!';
}


// returns 0 if no basic challenge is active, 1 if the basic challenge is active, 2 if the truly basic challenge is active
function basicChallenge() {
  if(state.challenge == challenge_truly_basic) return 2;
  if(state.challenge == challenge_basic) return 1;
  return 0;
}

// returns that we're not in a challenge where field size is fixed. If returns true, then don't change field size now but only after transcend
function changingFieldSizeNowOk() {
  // during the truly basic challenge, field must remain 5x5. During the regular basic challenge, changing field size is ok
  return basicChallenge() != 2;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// @constructor
function Crop2() {
  this.name = 'a';
  this.cost = Res();
  this.prod = Res(); // unused for ethereal crops...
  this.effect = Num(0); // amount of boost to basic field this crop gives, if any, for the relevant crop type
  this.index = 0;
  this.planttime = 0;
  this.boost = Num(0);

  this.type = undefined;
  this.tier = 0;

  this.tagline = '';
  this.image = undefined;
  this.treelevel2 = 0; // minimum treelevel2 to unlock this crop, this is for display purposes

  this.istemplate = false; // if true, is a placeholder template
  this.isghost = false; // if true, is a ghost (currently unused for Crop2, but here for consistency with Crop
};



var sameTypeCostMultiplier2 = 1.5;
var sameTypeCostMultiplier_Lotus2 = 2;
var sameTypeCostMultiplier_Fern2 = 1.5;
var cropRecoup2 = 1.0; // 100% resin recoup. But deletions are limited through max amount of deletions per season instead

Crop2.prototype.isReal = function() {
  return !this.istemplate && !this.isghost;
};

// opt_force_count, if not undefined, overrides anything, including opt_adjust_count
Crop2.prototype.getCost = function(opt_adjust_count, opt_force_count) {
  var mul = sameTypeCostMultiplier2;
  if(this.type == CROPTYPE_LOTUS) mul = sameTypeCostMultiplier_Lotus2;
  if(this.type == CROPTYPE_FERN) mul = sameTypeCostMultiplier_Fern2;
  var count = state.crop2count[this.index] + (opt_adjust_count || 0);
  if(opt_force_count != undefined) count = opt_force_count;
  var countfactor = Math.pow(mul, count);
  return this.cost.mulr(countfactor);
};


Crop2.prototype.getRecoup = function() {
  return this.getCost(-1).mulr(cropRecoup2);
};


Crop2.prototype.getPlantTime = function() {
  return this.planttime;
};


// for lotuses
Crop2.prototype.getEtherealBoost = function(f, breakdown) {
  var result = this.boost.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  // special neighboor boosts (automaton, squirrel, mistoetoe, tree)
  if(f && this.type == CROPTYPE_LOTUS) {
    var num_mistle = 0;
    var num_automaton = 0;

    for(var dir = 0; dir < 8; dir++) { // get the neighbors N,E,S,W,NE,SE,SW,NW
      var x2 = f.x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
      var y2 = f.y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
      if(x2 < 0 || x2 >= state.numw2 || y2 < 0 || y2 >= state.numh2) continue;
      if(dir >= 4 && !diagConnected(f.x, f.y, x2, y2, state.field2)) continue;
      var n = state.field2[y2][x2];
      if(n.hasCrop()) {
        if(n.cropIndex() == mistletoe2_0 && (n.nexttotree || etherealMistletoeCanGoAnywhere())) {
          num_mistle++;
        }
        if(n.cropIndex() == automaton2_0) {
          num_automaton++;
        }
      }
    }

    if((num_mistle && haveEtherealMistletoeUpgrade(mistle_upgrade_lotus_neighbor) || (num_automaton && haveEtherealMistletoeUpgrade(mistle_upgrade_automaton_florality)))) {
      // num_mistle itself is not taken into account: mistletoe bonus does not stack with each other, neither additively, nor multiplicatively.
      var mistleboost = num_mistle ? getEtherealMistletoeLotusNeighborBoost() : new Num(0);
      var automatonboost = num_automaton ? getEtherealAutomatonLotusNeighborBoost() : new Num(0);
      var totalmul = mistleboost.add(automatonboost).addr(1);
      result.mulInPlace(totalmul);
      if(breakdown) {
        if(!num_automaton) {
          breakdown.push(['mistletoe neighbor', true, totalmul, result.clone()]);
        } else if(!num_mistle) {
          breakdown.push(['automaton neighbor', true, totalmul, result.clone()]);
        } else {
          breakdown.push(['mistletoe and automaton neighbors', true, totalmul, result.clone()]);
        }
      }
    }
  }

  if(this.type == CROPTYPE_LOTUS) {
    var u = state.upgrades2[upgrade2_lotus];
    var u2 = upgrades2[upgrade2_lotus];
    if(u.count > 0) {
      //var mul_upgrade = upgrade2_lotus_bonus.mulr(u.count).addr(1);
      var mul_upgrade = upgrade2_lotus_bonus.mulr(Num(u.count).pow(upgrade2_lotus_bonus_exponent)).addr(1);
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  return result;
};


// boost to neighbors in ethereal field
var automatonboost = Num(0.5);
var squirrelboost = Num(0.5);

function getEtherealTreeNeighborBoost() {
  var boost = new Num(0);
  if(state.squirrel_evolution > 0) boost.addInPlace(squirrel_evolution_ethtree_boost);
  if(state.squirrel_upgrades[upgradesq_ethtree].count) boost.addInPlace(upgradesq_ethtree_boost.mulr(state.squirrel_upgrades[upgradesq_ethtree].count));
  if(state.squirrel_upgrades[upgradesq_ethtree2].count) boost.addInPlace(upgradesq_ethtree_boost2.mulr(state.squirrel_upgrades[upgradesq_ethtree2].count));
  return boost;
}

// any ethereal field or ethereal upgrade change increments (and, actually, many other changes like changing fruit even if not needed just to be sure) this, invalidating any ethereal_basic_boost_cache_
// this cache speeds up heavy computing quite a bit, because getBasicBoost is called a lot for computing the effect of regular crops, and if the ethereal field isn't changing, there's no need to recompute this
var ethereal_basic_boost_cache_counter = 0;

// boost from ethereal crops to basic field
Crop2.prototype.getBasicBoost = function(f, breakdown) {
  var use_cache = f && f.cropIndex() == this.index; // don't use the cache when showing e.g. 'what-if' scenario for the 'boost (here)' tooltip when planting a new crop here
  if(f && !breakdown && use_cache && f.ethereal_basic_boost_cache_ && f.ethereal_basic_boost_cache_counter_ == ethereal_basic_boost_cache_counter) return f.ethereal_basic_boost_cache_;

  var result = this.effect.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  // lotuses
  if(f) {
    var lotusmul = new Num(1);
    var num = 0;

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw2 || y2 < 0 || y2 >= state.numh2) continue;
      var n = state.field2[y2][x2];
      if(n.hasCrop() /*&& n.isFullGrown()*/ && crops2[n.cropIndex()].type == CROPTYPE_LOTUS) {
        // TODO: precompute this (similar to precompute of field for basic field), getEtherealBoost itself is expensive, and it's called several times for the same lotus
        var boost = crops2[n.cropIndex()].getEtherealBoost(n);
        if(boost.neqr(0)) {
          lotusmul.addInPlace(boost);
          num++;
        }
      }
    }
    if(num) {
      result.mulInPlace(lotusmul);
      if(breakdown) breakdown.push(['lotuses (' + num + ')', true, lotusmul, result.clone()]);
    }
  }

  // special neighboor boosts (automaton, squirrel, mistoetoe, tree)
  if(f) {
    var num_automaton = 0;
    var num_squirrel = 0;
    var num_mistle = 0;
    var num_tree = 0;

    for(var dir = 0; dir < 8; dir++) { // get the neighbors N,E,S,W,NE,SE,SW,NW
      var x2 = f.x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
      var y2 = f.y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
      if(x2 < 0 || x2 >= state.numw2 || y2 < 0 || y2 >= state.numh2) continue;
      if(dir >= 4 && !diagConnected(f.x, f.y, x2, y2, state.field2)) continue;
      var n = state.field2[y2][x2];
      if(n.hasCrop() /*&& n.isFullGrown()*/) {
        if(n.cropIndex() == automaton2_0) {
          num_automaton++;
        }
        if(n.cropIndex() == squirrel2_0) {
          num_squirrel++;
        }
        if(n.cropIndex() == mistletoe2_0 && (n.nexttotree || etherealMistletoeCanGoAnywhere())) {
          num_mistle++;
        }
      }
      if((dir < 4 || state.squirrel_upgrades[upgradesq_ethtree_diag].count) && (n.index == FIELD_TREE_TOP || n.index == FIELD_TREE_BOTTOM)) {
        num_tree++;
      }
    }

    // num_... itself is not taken into account in computations below: bonus of same type does not stack with each other, neither additively, nor multiplicatively.
    var do_automaton = !!num_automaton;
    var do_squirrel = !!num_squirrel;
    var do_mistle = !!num_mistle && haveEtherealMistletoeUpgrade(mistle_upgrade_mistle_neighbor);
    var do_tree = !!num_tree && getEtherealTreeNeighborBoost().neqr(0);

    // actually the values as boosts, not multipliers. mul1 is the actual multiplier.
    var automatonmul0 = do_automaton ? getEtherealAutomatonNeighborBoost() : new Num(0);
    var squirrelmul0 = do_squirrel ? getEtherealSquirrelNeighborBoost() : new Num(0);
    var mistlemul0 = do_mistle ? getEtherealMistletoeNeighborBoost() : new Num(0);
    var treemul0 = do_tree ? getEtherealTreeNeighborBoost() : new Num(0);

    var automatonmul1 = automatonmul0.addr(1);
    var squirrelmul1 = squirrelmul0.addr(1);
    var mistlemul1 = mistlemul0.addr(1);
    var treemul1 = treemul0.addr(1);

    var num_types = 0;
    if(do_automaton) num_types++;
    if(do_squirrel) num_types++;
    if(do_mistle) num_types++;
    if(do_tree) num_types++;

    var automatonmul2 = automatonmul1;
    var squirrelmul2 = squirrelmul1;
    var mistlemul2 = mistlemul1;
    var treemul2 = treemul1;

    if(num_types > 1) {
      // the one actually used
      var total_additive = automatonmul0.add(squirrelmul0).add(mistlemul0).add(treemul0).addr(1);
      // what is displayed due to display limitations, if you look at them one by one
      var total_multiplicative = automatonmul1.mul(squirrelmul1).mul(mistlemul1).mul(treemul1);
      /*
      Now we want to compute new multipliers, to use as the multiple different multipliers shown in the breakdown stats, however
      we don't want then to be actually multiplicative, but instead all together multiply to total_additive.
      This is all for display purposes in the breakdown, in reality what we want to achieve is a single multiplication by total_additive,
      however for the breakdown we want to show this as multiple individual components.
      We need some way to spread the loss over the different components. Below is one way with a correction factor, however that does not
      work, since it may end up some of the multipliers become smaller than one and thus show as a loss:
      var correction = Num.powr(total_additive.div(total_multiplicative), 1 / num_types);
      // spread the difference equally over all active ones
      var automatonmul2 = do_automaton ? automatonmul1.mul(correction) : new Num(1);
      var squirrelmul2 = do_squirrel ? squirrelmul1.mul(correction) : new Num(1);
      var mistlemul2 = do_mistle ? mistlemul1.mul(correction) : new Num(1);
      var treemul2 = do_tree ? treemul1.mul(correction) : new Num(1);

      So we instead spread the multiple with a correction value used as an exponent, not as a multiplier like above. All involved multipliers are >= 1, and the correction exponent will be < 1.
      This uses the equations solved for x as below, where the following equations are used (where a, b, c, ... are components originally multiplying to total_multiplicative, and y is the target total_additive, and x is the to be found correction value to use as exponent):
      a^x * b^x = y --> x = log(y) / log(a * b)
      a^x * b^x ^ c^x = y --> x = log(y) / log(a * b * c)
      etc... for more components
      */
      var den = new Num(1);
      if(do_automaton) den.mulInPlace(automatonmul1);
      if(do_squirrel) den.mulInPlace(squirrelmul1);
      if(do_mistle) den.mulInPlace(mistlemul1);
      if(do_tree) den.mulInPlace(treemul1);
      den = Num.log(den);
      var correction = Num.log(total_additive).div(den);
      // spread the difference equally over all active ones
      var automatonmul2 = do_automaton ? automatonmul1.powr(correction) : new Num(1);
      var squirrelmul2 = do_squirrel ? squirrelmul1.powr(correction) : new Num(1);
      var mistlemul2 = do_mistle ? mistlemul1.powr(correction) : new Num(1);
      var treemul2 = do_tree ? treemul1.powr(correction) : new Num(1);
    }

    if(do_automaton) {
      result.mulInPlace(automatonmul2);
      if(breakdown) {
        var name = 'automaton neighbor';
        if(num_types > 1) name += ' [' + automatonmul0.toPercentString() + ']';
        breakdown.push([name, true, automatonmul2, result.clone()]);
      }
    }
    if(do_squirrel) {
      result.mulInPlace(squirrelmul2);
      if(breakdown) {
        var name = 'squirrel neighbor';
        if(num_types > 1) name += ' [' + squirrelmul0.toPercentString() + ']';
        breakdown.push([name, true, squirrelmul2, result.clone()]);
      }
    }
    if(do_mistle) {
      result.mulInPlace(mistlemul2);
      if(breakdown) {
        var name = 'mistletoe neighbor';
        if(num_types > 1) name += ' [' + mistlemul0.toPercentString() + ']';
        breakdown.push([name, true, mistlemul2, result.clone()]);
      }
    }
    if(do_tree) {
      if(treemul2.neqr(1)) {
        result.mulInPlace(treemul2);
        if(breakdown) {
          var name = 'tree neighbor';
          if(num_types > 1) name += ' [' + treemul0.toPercentString() + ']';
          breakdown.push([name, true, treemul2, result.clone()]);
        }
      }
    }
    /*if(num_types > 2) {
      var typemul = Num(1.75);
      result.mulInPlace(typemul);
      if(breakdown) breakdown.push(['have at least three special neighbor types', true, typemul, result.clone()]);
    } else*/ if(num_types > 1) {
      var typemul = Num(1.5);
      result.mulInPlace(typemul);
      if(breakdown) breakdown.push(['have at least two special neighbor types', true, typemul, result.clone()]);
    }
  }

  if(state.squirrel_upgrades[upgradesq_eth_all].count) {
    var mul = upgradesq_eth_all_boost.addr(1);
    result.mulInPlace(mul);
    if(breakdown) breakdown.push(['squirrel all ethereal crops boost', true, mul, result.clone()]);
  }

  if(this.type == CROPTYPE_BERRY) {
    var u = state.upgrades2[upgrade2_berry];
    var u2 = upgrades2[upgrade2_berry];
    if(u.count > 0) {
      var mul_upgrade = upgrade2_berry_bonus.mulr(u.count).addr(1);
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  if(this.type == CROPTYPE_MUSH) {
    var u = state.upgrades2[upgrade2_mush];
    var u2 = upgrades2[upgrade2_mush];
    if(u.count > 0) {
      var mul_upgrade = upgrade2_mush_bonus.mulr(u.count).addr(1);
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  if(this.type == CROPTYPE_FLOWER) {
    var u = state.upgrades2[upgrade2_flower];
    var u2 = upgrades2[upgrade2_flower];
    if(u.count > 0) {
      var mul_upgrade = upgrade2_flower_bonus.mulr(u.count).addr(1);
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  if(this.type == CROPTYPE_STINGING) {
    var u = state.upgrades2[upgrade2_nettle];
    var u2 = upgrades2[upgrade2_nettle];
    if(u.count > 0) {
      var mul_upgrade = upgrade2_nettle_bonus.mulr(u.count).addr(1);
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  if(this.type == CROPTYPE_BEE) {
    var u = state.upgrades2[upgrade2_bee];
    var u2 = upgrades2[upgrade2_bee];
    if(u.count > 0) {
      var mul_upgrade = upgrade2_bee_bonus.mulr(u.count).addr(1);
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  if(f && !breakdown && use_cache) {
    f.ethereal_basic_boost_cache_counter_ = ethereal_basic_boost_cache_counter;
    f.ethereal_basic_boost_cache_ = result;
  }

  return result;
};

var registered_crops2 = []; // indexed consecutively, gives the index to crops2
var crops2 = []; // indexed by crop index

var croptype2_tiers = [];

// 16-bit ID, auto incremented with registerCrop2, but you can also set it to a value yourself, to ensure consistent IDs for various crops2 (between savegames) in case of future upgrades
var crop2_register_id = -1;

function registerCrop2(name, treelevel2, cost, prod, boost, planttime, effect_description_short, effect_description_long, image, opt_tagline, opt_croptype, opt_tier) {
  if(!image) image = missingplant;
  if(crops2[crop2_register_id] || crop2_register_id < 0 || crop2_register_id > 65535) throw 'crop2 id already exists or is invalid!';
  var crop = new Crop2();
  crop.index = crop2_register_id++;
  crops2[crop.index] = crop;
  registered_crops2.push(crop.index);

  crop.name = name;
  crop.cost = cost;
  crop.prod = prod;
  crop.effect_description_short = effect_description_short;
  crop.effect_description_long = effect_description_long;
  crop.planttime = planttime;
  crop.image = image;
  crop.tagline = opt_tagline || '';

  // this boost is for lotuses only, that is, for crops that boost neighboring ethereal crops, not for crops that boost basic fields crops
  crop.boost = boost;

  crop.treelevel2 = treelevel2;


  crop.tier = opt_tier;
  crop.type = opt_croptype;

  if(opt_croptype != undefined && opt_tier != undefined) {
    if(!croptype2_tiers[opt_croptype]) croptype2_tiers[opt_croptype] = [];
    croptype2_tiers[opt_croptype][opt_tier] = crop;
  }

  return crop.index;
}

function combineSentences(a, b) {
  var result = a;
  if(result && result[result.length - 1] != '.') result += '.';
  result += ' ';
  result += b;
  return result;
}

function registerBerry2(name, treelevel2, tier, cost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  if(effect_description_long) effect_description_long = combineSentences(effect_description_long, boostableCrop2Hint);
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_BERRY, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}

function registerMushroom2(name, treelevel2, tier, cost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  if(effect_description_long) effect_description_long = combineSentences(effect_description_long, boostableCrop2Hint);
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_MUSH, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}

function registerFlower2(name, treelevel2, tier, cost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  if(effect_description_long) effect_description_long = combineSentences(effect_description_long, boostableCrop2Hint);
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_FLOWER, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}

function registerNettle2(name, treelevel2, tier, cost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  if(effect_description_long) effect_description_long = combineSentences(effect_description_long, boostableCrop2Hint);
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_STINGING, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}

function registerBrassica2(name, treelevel2, tier, cost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  if(effect_description_long) effect_description_long = combineSentences(effect_description_long, boostableCrop2Hint);
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_BRASSICA, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}

function registerLotus2(name, treelevel2, tier, cost, boost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(boost), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_LOTUS, tier);
  var crop = crops2[index];
  return index;
}

function registerAutomaton2(name, treelevel2,  tier, cost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_AUTOMATON, tier);
  var crop = crops2[index];
  return index;
}

function registerSquirrel2(name, treelevel2,  tier, cost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_SQUIRREL, tier);
  var crop = crops2[index];
  return index;
}

function registerFern2(name, treelevel2, tier, cost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_FERN, tier);
  var crop = crops2[index];
  return index;
}

function registerBeehive2(name, treelevel2, tier, cost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  if(effect_description_long) effect_description_long = combineSentences(effect_description_long, boostableCrop2Hint);
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_BEE, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}

function registerMistletoe2(name, treelevel2, tier, cost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_MISTLETOE, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}


var default_ethereal_growtime = 10;

crop2_register_id = 0;
var fern2_0 = registerFern2('fern', 0, 0, Res({resin:10}), default_ethereal_growtime, 'gives 1000 * n^3 starter seeds', 'Gives 1000 starter seeds after every transcension and also immediately now. If you have multiple, gives 1000 * n^3 starter seeds, with n the amount of ethereal ferns: first one gives 1000, with two you get 8000, three gives 27000, four gives 64000, and so on.', image_fern_as_crop);
var fern2_1 = registerFern2('fern II', 2, 1, Res({resin:200}), default_ethereal_growtime, 'gives 100K * n^3 starter seeds', 'Gives 100K starter seeds after every transcension and also immediately now. If you have multiple, gives 100K * n^3 starter, with n the amount of ethereal ferns: first one gives 100K, with two you get 800K, three gives 2700K, four gives 6400K, and so on.', image_fern_as_crop2);
var fern2_2 = registerFern2('fern III', 4, 2, Res({resin:50000}), default_ethereal_growtime, 'gives 10M * n^3 starter seeds', 'Gives 10M starter seeds after every transcension and also immediately now. If you have multiple, gives 10M * n^3 starter, with n the amount of ethereal ferns: first one gives 10M, with two you get 80M, three gives 270M, four gives 640M, and so on.', image_fern_as_crop3);
var fern2_3 = registerFern2('fern IV', 6, 3, Res({resin:1e6}), default_ethereal_growtime, 'gives 1B * n^3 starter seeds', 'Gives 1B starter seeds after every transcension and also immediately now. If you have multiple, gives 1B * n^3 starter, with n the amount of ethereal ferns: first one gives 1B, with two you get 8B, three gives 27B, four gives 64B, and so on.', image_fern_as_crop4);
var fern2_4 = registerFern2('fern V', 8, 4, Res({resin:200e6}), default_ethereal_growtime, 'gives 100B * n^3 starter seeds', 'Gives 100B starter seeds after every transcension and also immediately now. If you have multiple, gives 100B * n^3 starter, with n the amount of ethereal ferns: first one gives 100B, with two you get 800B, three gives 2700B, four gives 6400B, and so on.', image_fern_as_crop5);

crop2_register_id = 10;
var automaton2_0 = registerAutomaton2('automaton', 1, 0, Res({resin:10}), 1.5, 'Automates things', function() {
  return 'Automates things and unlocks crop templates. Boosts 8 ethereal neighbors. Can have max ' + getMaxNumEtherealAutomatons() + '. The higher your ethereal tree level, the more it can automate and the more challenges it unlocks. See automaton tab.';
} ,images_automaton);
var squirrel2_0 = registerSquirrel2('squirrel', 5, 0, Res({resin:10}), 1.5, 'Boosts neighbors', function() {
  return 'Unlocks nuts and squirrel upgrades. Boosts 8 ethereal neighbors. Can have max ' + getMaxNumEtherealSquirrels() + '.';
}, images_squirrel);

// berries2
crop2_register_id = 25;
var berry2_0 = registerBerry2('blackberry', 0, 0, Res({resin:10}), default_ethereal_growtime, Num(0.25), undefined, 'boosts berries in the basic field (additive)', blackberry);
var berry2_1 = registerBerry2('blueberry', 1, 1, Res({resin:100}), default_ethereal_growtime, Num(1), undefined, 'boosts berries in the basic field (additive)', blueberry);
var berry2_2 = registerBerry2('cranberry', 4, 2, Res({resin:100000}), default_ethereal_growtime, Num(4), undefined, 'boosts berries in the basic field (additive)', cranberry);
var berry2_3 = registerBerry2('currant', 7, 3, Res({resin:75e6}), default_ethereal_growtime, Num(16), undefined, 'boosts berries in the basic field (additive)', currant);
var berry2_4 = registerBerry2('goji', 11, 4, Res({resin:2e12}), default_ethereal_growtime, Num(64), undefined, 'boosts berries in the basic field (additive)', goji);
var berry2_5 = registerBerry2('gooseberry', 14, 5, Res({resin:2e15}), default_ethereal_growtime, Num(256), undefined, 'boosts berries in the basic field (additive)', gooseberry);
var berry2_6 = registerBerry2('grape', 18, 6, Res({resin:3e19}), default_ethereal_growtime, Num(1024), undefined, 'boosts berries in the basic field (additive)', grape);
var berry2_7 = registerBerry2('honeyberry', 22, 7, Res({resin:1e24}), default_ethereal_growtime, Num(4096), undefined, 'boosts berries in the basic field (additive)', honeyberry);
var berry2_8 = registerBerry2('juniper', 28, 8, Res({resin:500e30}), default_ethereal_growtime, Num(16384), undefined, 'boosts berries in the basic field (additive)', juniper);

// mushrooms2
crop2_register_id = 50;
var mush2_0 = registerMushroom2('champignon', 0, 0, Res({resin:20}), default_ethereal_growtime, Num(0.25), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', champignon);
var mush2_1 = registerMushroom2('matsutake', 3, 1, Res({resin:20000}), default_ethereal_growtime, Num(1), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', matsutake);
var mush2_2 = registerMushroom2('morel', 5, 2, Res({resin:500e3}), default_ethereal_growtime, Num(4), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', morel);
var mush2_3 = registerMushroom2('muscaria', 7, 3, Res({resin:50e6}), default_ethereal_growtime, Num(16), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', amanita);
var mush2_4 = registerMushroom2('oyster mushroom', 10, 4, Res({resin:500e9}), default_ethereal_growtime, Num(64), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', images_oyster);
var mush2_5 = registerMushroom2('portobello', 13, 5, Res({resin:500e12}), default_ethereal_growtime, Num(256), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', portobello);
var mush2_6 = registerMushroom2('shiitake', 17, 6, Res({resin:3e18}), default_ethereal_growtime, Num(1024), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', shiitake);
var mush2_7 = registerMushroom2('truffle', 22, 7, Res({resin:1e24}), default_ethereal_growtime, Num(4096), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', truffle);
var mush2_8 = registerMushroom2('greater champignon', 25, 8, Res({resin:10e27}), default_ethereal_growtime, Num(16384), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', champignon);
var mush2_9 = registerMushroom2('greater matsutake', 29, 9, Res({resin:5e33}), default_ethereal_growtime, Num(65536), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', matsutake);


// flowers2
crop2_register_id = 75;
var flower2_0 = registerFlower2('anemone', 0, 0, Res({resin:50}), default_ethereal_growtime, Num(0.25), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', images_anemone);
var flower2_1 = registerFlower2('clover', 3, 1, Res({resin:25000}), default_ethereal_growtime, Num(1), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', images_clover);
var flower2_2 = registerFlower2('cornflower', 6, 2, Res({resin:5e6}), default_ethereal_growtime, Num(4), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', images_cornflower);
var flower2_3 = registerFlower2('daisy', 9, 3, Res({resin:10e9}), default_ethereal_growtime, Num(16), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', images_daisy);
var flower2_4 = registerFlower2('dandelion', 12, 4, Res({resin:50e12}), default_ethereal_growtime, Num(64), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', images_dandelion);
var flower2_5 = registerFlower2('iris', 15, 5, Res({resin:50e15}), default_ethereal_growtime, Num(256), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', images_iris);
var flower2_6 = registerFlower2('lavender', 19, 6, Res({resin:500e18}), default_ethereal_growtime, Num(1024), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', images_lavender);
var flower2_7 = registerFlower2('orchid', 23, 7, Res({resin:25e24}), default_ethereal_growtime, Num(4096), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', images_orchid);
// TODO: this one seems way too cheap compared to the level it's at, compare to nettle2_2 from one eth tree lower
var flower2_8 = registerFlower2('greater anemone', 27, 8, Res({resin:1e30}), default_ethereal_growtime, Num(16384), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', images_anemone);

crop2_register_id = 100;
var nettle2_0 = registerNettle2('nettle', 2, 0, Res({resin:200}), default_ethereal_growtime, Num(0.35), undefined, 'boosts stinging plants in the basic field (additive).', images_nettle);
var nettle2_1 = registerNettle2('thistle', 10, 1, Res({resin:100e9}), default_ethereal_growtime, Num(1.4), undefined, 'boosts stinging plants in the basic field (additive).', images_thistle);
var nettle2_2 = registerNettle2('poison ivy', 26, 2, Res({resin:500e27}), default_ethereal_growtime, Num(6), undefined, 'boosts stinging plants in the basic field (additive).', images_poisonivy);

crop2_register_id = 125;
//function registerBrassica2(name, treelevel2, tier, cost, boost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline)
// similar to bee2_0: very low boost value here, but given that you can immediately increase the boost tremendously with gold lotuses means it's a lot in practice
var brassica2_0 = registerBrassica2('watercress', 21, 0, Res({resin:100e21}), default_ethereal_growtime, Num(0.0001), undefined, 'boosts brassica in the basic field (additive).', images_watercress);
var brassica2_1 = registerBrassica2('wasabi', 30, 1, Res({resin:50e33}), default_ethereal_growtime, Num(0.0004), undefined, 'boosts brassica in the basic field (additive).', images_wasabi);

crop2_register_id = 150;
var lotus2_0 = registerLotus2('white lotus', 0, 0, Res({resin:50}), 0.5, default_ethereal_growtime, undefined, 'boosts the bonus effect of ethereal neighbors of types that boost basic field (such as berry, mushroom, but not fern). No effect if no appropriate neighbors. This crop boosts neighboring plants in the ethereal field, rather than boosting the basic field directly.', images_whitelotus);
var lotus2_1 = registerLotus2('pink lotus', 4, 1, Res({resin:250000}), 4, default_ethereal_growtime, undefined, 'boosts the bonus effect of ethereal neighbors of types that boost basic field (such as berry, mushroom, but not fern). No effect if no appropriate neighbors. This crop boosts neighboring plants in the ethereal field, rather than boosting the basic field directly.', images_pinklotus);
var lotus2_2 = registerLotus2('blue lotus', 8, 2, Res({resin:1e9}), 32, default_ethereal_growtime, undefined, 'boosts the bonus effect of ethereal neighbors of types that boost basic field (such as berry, mushroom, but not fern). No effect if no appropriate neighbors. This crop boosts neighboring plants in the ethereal field, rather than boosting the basic field directly.', images_bluelotus);
var lotus2_3 = registerLotus2('black lotus', 12, 3, Res({resin:200e12}), 256, default_ethereal_growtime, undefined, 'boosts the bonus effect of ethereal neighbors of types that boost basic field (such as berry, mushroom, but not fern). No effect if no appropriate neighbors. This crop boosts neighboring plants in the ethereal field, rather than boosting the basic field directly.', images_blacklotus);
var lotus2_4 = registerLotus2('gold lotus', 16, 4, Res({resin:500e15}), 2048, default_ethereal_growtime, undefined, 'boosts the bonus effect of ethereal neighbors of types that boost basic field (such as berry, mushroom, but not fern). No effect if no appropriate neighbors. This crop boosts neighboring plants in the ethereal field, rather than boosting the basic field directly.', images_goldlotus);
// following the above pattern, next boost here should be 4x higher, however given that watercress boost will also be added between this and previous lotus, having a factor of 8x is too strong, so reduced to 4x from now on (remember that lotus boost boosts multiple multipliers at once, at least 6 types with a chain of 5 types for spores, so this is n^5 scaling, not just linear)
var lotus2_5 = registerLotus2('green lotus', 20, 5, Res({resin:10e21}), 8192, default_ethereal_growtime, undefined, 'boosts the bonus effect of ethereal neighbors of types that boost basic field (such as berry, mushroom, but not fern). No effect if no appropriate neighbors. This crop boosts neighboring plants in the ethereal field, rather than boosting the basic field directly.', images_greenlotus);
var lotus2_6 = registerLotus2('red lotus', 24, 6, Res({resin:250e24}), 32768, default_ethereal_growtime, undefined, 'boosts the bonus effect of ethereal neighbors of types that boost basic field (such as berry, mushroom, but not fern). No effect if no appropriate neighbors. This crop boosts neighboring plants in the ethereal field, rather than boosting the basic field directly.', images_redlotus);

crop2_register_id = 200;
// the first beehive has only 1% boost, however by the time you unlock this beehive you can get a massive boost from blue lotuses next to a beehive, one blue lotus next to a beehive turns this boost into 33%, and you can have more than 1 blue lotus next to it. For that reason it starts so low, because if this has a base boost of e.g. 25% this would be a way too huge jump in gameplay boost by just unlocking this new ethereal crop type at a time when you already have many lotuses
// also this makes the ethereal beest require some care, you can't just plant it in a corner with no lotuses.
var bee2_0 = registerBeehive2('worker bee', 8, 0, Res({resin:2e9}), default_ethereal_growtime, Num(0.01), undefined, 'boosts bees in the basic field. Does not boost ethereal flowers. Gets a boost from neighboring lotuses.', images_workerbee);
var bee2_1 = registerBeehive2('drone', 13, 1, Res({resin:1e15}), default_ethereal_growtime, Num(0.04), undefined, 'boosts bees in the basic field. Does not boost ethereal flowers. Gets a boost from neighboring lotuses.', images_dronebee);
var bee2_2 = registerBeehive2('queen bee', 19, 2, Res({resin:1e21}), default_ethereal_growtime, Num(0.12), undefined, 'boosts bees in the basic field. Does not boost ethereal flowers. Gets a boost from neighboring lotuses.', images_queenbee);

crop2_register_id = 250;
var mistletoe2_0 = registerMistletoe2('mistletoe', 15, 0, Res({resin:10}), 1.5, Num(0.01), undefined, 'Must be planted next to ethereal tree to work. Gives multiple bonuses, which can be unlocked and upgraded over time.', images_mistletoe);

// templates

function makeTemplate2(crop_id) {
  crops2[crop_id].istemplate = true;
  crops2[crop_id].cost = Res(0);
  return crop_id;
}

crop2_register_id = 300;
var berry2_template = makeTemplate2(registerBerry2('berry template', 1, -1, Res(), 0, Num(0), undefined, '', images_berrytemplate));
var mush2_template = makeTemplate2(registerMushroom2('mushroom template', 1, -1, Res(), 0, Num(0), undefined, '', images_mushtemplate));
var flower2_template = makeTemplate2(registerFlower2('flower template', 1, -1, Res(), 0, Num(0), undefined, '', images_flowertemplate));
var nettle2_template = makeTemplate2(registerNettle2('nettle template', 2, -1, Res(), 0, Num(0), undefined, '', images_nettletemplate));
var lotus2_template = makeTemplate2(registerLotus2('lotus template', 1, -1, Res(), 0, 0, undefined, '', images_lotustemplate));
var fern2_template = makeTemplate2(registerFern2('fern template', 1, -1, Res(), 0, undefined, '', images_ferntemplate));
var automaton2_template = makeTemplate2(registerAutomaton2('automaton template', 1, -1, Res(), 0, undefined, '', images_automatontemplate));
var squirrel2_template = makeTemplate2(registerSquirrel2('squirrel template', 5, -1, Res(), 0, undefined, '', images_squirreltemplate));
var bee2_template = makeTemplate2(registerBeehive2('bee template', 8, -1, Res(), 0, Num(0), undefined, '', images_beetemplate));
var mistletoe2_template = makeTemplate2(registerMistletoe2('mistletoe template', 15, -1, Res(), 0, Num(0), undefined, '', images_mistletoetemplate));
var brassica2_template = makeTemplate2(registerBrassica2('brassica template', 21, -1, Res(), 0, Num(0), undefined, '', images_watercresstemplate));

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var registered_upgrades2 = []; // indexed consecutively, gives the index to upgrades
var upgrades2 = []; // indexed by upgrade index


// same comment as crop_register_id
var upgrade2_register_id = -1;

// @constructor
function Upgrade2() {
  this.name = 'a';
  this.description = undefined; // longer description than the name, with details, shown if not undefined. Is also allowed to be a function instead, for dynamic description

  // function that applies the upgrade
  this.fun = undefined;

  this.index = 0; // index in the upgrades array

  this.maxcount = 1; // how many times can this upgrade be done in total (typical 1, some upgrades have many series, 0 for infinity)

  this.cost = Res();

  // style related, for the upgrade chip in upgrade UI
  this.bgcolor = '#8cf';
  this.bordercolor = '#ff0';
  this.image0 = undefined; // bg image, e.g. a plant
  this.image1 = undefined; // fg image, e.g. a level-up arrow in front of the plant

  // how much the cost of this upgrade increases when doing next one
  this.cost_increase = Num(1);

  this.deprecated = false; // no longer existing upgrade from earlier game version

  this.treelevel2 = 0; // minimum treelevel2 to unlock this upgrade, also can be considered the tier of the set the upgrade is in

  // gets the name, taking stage into account if it has stages
  this.getName = function() {
    var name = this.name;
    if(state.upgrades2[this.index].count > 1) name += ' ' + toRomanUpTo((state.upgrades2[this.index].count));
    return name;
  };

  // name of next instance of this upgrade, if multi-staged
  this.getNextName = function() {
    var name = this.name;
    if(state.upgrades2[this.index].count > 0) name += ' ' + toRomanUpTo((state.upgrades2[this.index].count + 1));
    return name;
  };

  // max amount of upgrades done, fully researched
  this.isExhausted = function() {
    if(this.maxcount == 0) return false; // can be done infinite times
    return state.upgrades2[this.index].count >= this.maxcount;
  };

  // can upgrade (ignoring resources needed), that is, it should be shown in the UI as a pressable button for upgrade that can be done noe
  this.canUpgrade = function() {
    return state.upgrades2[this.index].unlocked && !this.isExhausted();
  };
}

Upgrade2.prototype.getCost = function(opt_adjust_count) {
  var countfactor = Num.powr(this.cost_increase, state.upgrades2[this.index].count + (opt_adjust_count || 0));
  return this.cost.mul(countfactor);
};

Upgrade2.prototype.getDescription = function() {
  if(typeof(this.description) == 'function') return this.description();
  return this.description;
};

// maxcount should be 1 for an upgrade that can only be done once (e.g. an unlock), or 0 for infinity
function registerUpgrade2(name, treelevel2, cost, cost_increase, fun, pre, maxcount, description, bgcolor, bordercolor, image0, image1) {
  if(upgrades2[upgrade2_register_id] || upgrade2_register_id < 0 || upgrade2_register_id > 65535) throw 'upgrades2 id already exists or is invalid!';
  var upgrade = new Upgrade2();
  upgrade.index = upgrade2_register_id++;
  upgrades2[upgrade.index] = upgrade;
  registered_upgrades2.push(upgrade.index);


  upgrade.name = name;
  upgrade.cost = cost;
  upgrade.maxcount = maxcount;
  upgrade.cost_increase = Num(cost_increase);

  if(bgcolor) upgrade.bgcolor = bgcolor;
  if(bordercolor) upgrade.bordercolor = bordercolor;
  if(image0) upgrade.image0 = image0;
  if(image1) upgrade.image1 = image1;

  upgrade.fun = function() {
    state.upgrades2[this.index].count++;
    fun();
  };

  upgrade.pre = function() {
    if(!state.g_numresets) return false
    if(state.treelevel2 < treelevel2) return false;
    if(pre && !pre()) return false;
    return true;
  };

  upgrade.treelevel2 = treelevel2;

  upgrade.description = description;

  return upgrade.index;
}


// register an upgrade that was removed from the game so it's marked as invalid to not display it and remove from new saves
function registerDeprecatedUpgrade2() {
  var result = registerUpgrade2('<deprecated>', 99, Res(), 0, function(){}, function(){return false;}, 1, '<deprecated>');
  var u = upgrades2[result];
  u.deprecated = true;
  return result;
}


upgrade2_register_id = 10;
// deprecated for v0.1.9, but some may come back in a later version
registerDeprecatedUpgrade2(); // old upgrade2_seeds
registerDeprecatedUpgrade2(); // old upgrade2_spores
registerDeprecatedUpgrade2(); // old upgrade2_starting0
registerDeprecatedUpgrade2(); // old upgrade2_starting1
registerDeprecatedUpgrade2(); // old upgrade2_season[0]
registerDeprecatedUpgrade2(); // old upgrade2_season[1]
registerDeprecatedUpgrade2(); // old upgrade2_season[2]
registerDeprecatedUpgrade2(); // old upgrade2_season[3]
registerDeprecatedUpgrade2(); // old upgrade2_field6x6

upgrade2_register_id = 20;

var upgrade2_season_bonus = [0.33, 0.25, 0.25, 0.25];

var upgrade2_season = [];

// TODO: now limited to 2 times, allow more when the balancing shows it works out



///////////////////////////
var LEVEL2 = 0; // variable used for the required treelevel2 for groups of upgrades below

upgrade2_season[0] = registerUpgrade2('improve spring', LEVEL2, Res({resin:10}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'improve spring effect ' + (upgrade2_season_bonus[0] * 100) + '% (scales by n^1.25). Spring boosts flowers.', undefined, undefined, tree_images[3][1][0]);

upgrade2_season[1] = registerUpgrade2('improve summer', LEVEL2, Res({resin:10}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'improve summer effect ' + (upgrade2_season_bonus[1] * 100) + '% (scales by n^1.25). Summer boosts berry production, this ethereal upgrade additionally slightly boosts mushrooms.', undefined, undefined, tree_images[3][1][1]);

upgrade2_season[2] = registerUpgrade2('improve autumn', LEVEL2, Res({resin:10}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'improve autumn effect ' + (upgrade2_season_bonus[2] * 100) + '% (scales by n^1.25). Autumn boosts mushroom production, this ethereal upgrade additionally slightly boosts berries.', undefined, undefined, tree_images[3][1][2]);

upgrade2_season[3] = registerUpgrade2('winter hardening', LEVEL2, Res({resin:10}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase winter tree warmth effect ' + (upgrade2_season_bonus[3] * 100) + '% (scales by n^1.25).', undefined, undefined, tree_images[3][1][3]);

// bases of exponentiation for treeLevelResin, depending on ethereal upgrade
var resin_base = 1.2;
var resin_base_resin_extraction = 1.25;
var resin_base_resin_siphoning = 1.3;
var resin_siphoning_level = 85;
var resin_global_mul = 0.25;
var resin_global_add = 0.5; // this exists to tweak the resin income such that when reaching level 10 the first time, you get 10 resin, to be able to buy the first ethereal crop at first transcend
var resin_global_quad = 2; // this is tuned to make new resin_base a not too big nerve for levels around 20, 30, ... in the v0.1.64 change

// bases of exponentiation for treeLevelTwigs, depending on ethereal upgrade
var twigs_base = 1.25;
var twigs_base_twigs_extraction = 1.3;
var twigs_base_twigs_siphoning = 1.35;
var twigs_siphoning_level = resin_siphoning_level;
var twigs_global_mul = 0.02;
var twigs_global_add = 0.55;
var twigs_global_quad = 1; // this is tuned to make new twigs_base a not too big nerve for levels around 20, 30, ... in the v0.1.64 change


var upgrade2_time_reduce_0_amount = 90;

upgrade2_register_id = 25;
var upgrade2_time_reduce_0 = registerUpgrade2('grow speed', LEVEL2, Res({resin:25}), 2, function() {
}, function(){return true}, 0, 'basic crops grow up to ' + upgrade2_time_reduce_0_amount + ' seconds per upgrade level faster. This is soft-capped for already fast crops, a crop that already only takes ' + upgrade2_time_reduce_0_amount + ' seconds, will not get much faster. So this upgrade mainly improves the higher tier, slower, crops to become faster and thus within reach.', undefined, undefined, blackberry[0]);

var upgrade2_basic_tree_bonus = Num(0.02);
var treeboost_exponent_1 = 1.05; // basic
var treeboost_exponent_2 = 1.2; // from ethereal upgrade

var upgrade2_basic_tree = registerUpgrade2('basic tree boost bonus', LEVEL2, Res({resin:10}), 1.5, function() {
  }, function(){return true}, 0,
  function() {
    var result = 'add ' + upgrade2_basic_tree_bonus.toPercentString() + ' to the basic tree production bonus per level (scales by n^' + treeboost_exponent_2 +  ').';
    var level_current = state.treelevel || 1;
    var level_max = state.g_treelevel;
    var current = getTreeBoostFor(level_current, state.upgrades2[upgrade2_basic_tree].count, true);
    var current_up = getTreeBoostFor(level_current, state.upgrades2[upgrade2_basic_tree].count + 1, true);
    var max = getTreeBoostFor(level_max, state.upgrades2[upgrade2_basic_tree].count, true);
    var max_up = getTreeBoostFor(level_max, state.upgrades2[upgrade2_basic_tree].count + 1, true);
    result += '<br><br>';
    result += '<b>Current bonus at tree level ' + level_current + '</b>: ' + current.toPercentString();
    result += '<br>';
    result += '<b>Next upgrade bonus at tree level ' + level_current + '</b>: ' + current_up.toPercentString();
    if(level_current != level_max) {
      result += '<br>';
      result += '<b>Current bonus at tree level ' + level_max + '</b>: ' + max.toPercentString();
      result += '<br>';
      result += '<b>Next upgrade bonus at tree level ' + level_max + '</b>: ' + max_up.toPercentString();
    }
    return result;
  }, undefined, undefined, tree_images[10][1][1]);



var upgrade2_extra_fruit_slot = registerUpgrade2('extra fruit slot', 0, Res({resin:50,essence:25}), 2, function() {
  state.fruit_slots++;
  // NOTE: also update 'showStorageFruitSourceDialog' when adding new fruit slot upgrades
}, function(){return true;}, 1, 'gain an extra storage slot for fruits', undefined, undefined, images_apple[1]);


function applyBlackberrySecret() {
  if(basicChallenge()) return;
  if(!state.upgrades[berryunlock_0].count) upgrades[berryunlock_0].fun();
}

upgrade2_register_id = 101; // this upgraded used to be LEVEL2=1 and must keep its old id
var upgrade2_blackberrysecret = registerUpgrade2('blackberry secret', LEVEL2, Res({resin:50}), 2, function() {
  applyBlackberrySecret();
}, function(){return true;}, 1,
'blackberry is unlocked immediately after a transcension, the upgrade to unlock it is no longer needed and given for free. In addition, the upgrade-watercress upgrade is available from the start rather than after 5 watercress. This makes the start of a run more convenient. TIP: get a fern in the ethereal field to get 1000+ starting seeds to be able to plant a blackberry immediately too.',
undefined, undefined, blackberry[4]);
upgrade2_register_id = 28;

upgrade2_register_id = 50;
var upgrade2_field6x6 = registerUpgrade2('larger field 6x6', LEVEL2, Res({resin:100}), 1, function() {
  var numw = Math.max(6, state.numw);
  var numh = Math.max(6, state.numh);
  if(changingFieldSizeNowOk()) changeFieldSize(state, numw, numh);
}, function(){return state.numw >= 5 && state.numh >= 5}, 1, 'increase basic field size to 6x6 tiles', undefined, undefined, field_summer[0]);


upgrade2_register_id = 99;
var upgrade2_mistletoe = registerUpgrade2('unlock mistletoe', LEVEL2, Res({resin:25}), 1, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true}, 1, 'Unlock mistletoe crop in the basic field. This crop will allow leveling up the ethereal tree through a basic field mechanic giving twigs, and the ethereal tree levels then allow to get next sets of ethereal upgrades and crops. The mistletoe will become available in the basic field when anemones become available and then needs to then be unlocked with a regular upgrade first as usual. Then it can be planted next to the basic tree to start getting twigs (which you actually get on transcend, like resin). This ethereal upgrade is the first step in that process, and this is ultimately required to progress to next stages of the game.', undefined, undefined, images_mistletoe[3]);

///////////////////////////
LEVEL2 = 1;

upgrade2_register_id = 100;

var upgrade2_resin_bonus = Num(0.25);
var upgrade2_resin = registerUpgrade2('resin gain', LEVEL2, Res({resin:50}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase resin gain from tree by ' + (upgrade2_resin_bonus * 100) + '% (additive).', undefined, undefined, image_resin);

upgrade2_register_id++; // upgrade2_blackberrysecret used to be here but it moved one ethereal tree level earlier

var upgrade2_diagonal = registerUpgrade2('diagonal winter warmth', LEVEL2, Res({resin:150}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 1, 'the winter warmth effect of the tree works also diagonally, adding 4 more possible neighbor spots for this effect.', undefined, undefined, tree_images[5][1][3]);

function haveDiagonalTreeWarmth() {
  return !basicChallenge() && !!state.upgrades2[upgrade2_diagonal].count;
}

var upgrade2_automaton = registerUpgrade2('unlock automaton', LEVEL2, Res({resin:100}), 2, function() {
  unlockEtherealCrop(automaton2_0);
  showRegisteredHelpDialog(28);
  showMessage('Auto-plant unlocked!', C_AUTOMATON, 1067714398, undefined, undefined, true);
  // also enable auto-plant so that it works immediately without needing to use the UI
  state.automaton_autoplant = 1;
}, function(){return true;}, 1, 'the automaton can be placed in the ethereal field, and when placed, boosts 8 neighboring ethereal plants, unlocks the automaton tab, allows to automate things, and allows to place crop templates', undefined, undefined, images_automaton[4]);


var upgrade2_twigs_bonus = Num(0.25);
var upgrade2_twigs = registerUpgrade2('twigs gain', LEVEL2, Res({resin:100}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase twigs gain from tree by ' + (upgrade2_twigs_bonus * 100) + '% (additive).',
undefined, undefined, images_mistletoe[2]);

function applyBlueberrySecret() {
  if(basicChallenge()) return;
  if(state.challenge == challenge_nodelete) return;
  if(state.challenge == challenge_bees) return;
  if(state.challenge == challenge_blackberry) return;
  if(!state.upgrades[berryunlock_1].count) upgrades[berryunlock_1].fun();
  if(!state.upgrades[flowerunlock_0].count) upgrades[flowerunlock_0].fun();
  if(!state.upgrades[mistletoeunlock_0].count) {
    var allow_mistletoe = !state.challenge || challenges[state.challenge].allowstwigs;
    if(allow_mistletoe) upgrades[mistletoeunlock_0].fun();
  }
}

upgrade2_register_id = 122; // this upgraded used to be LEVEL2=2 and must keep its old id
var upgrade2_blueberrysecret = registerUpgrade2('blueberry secret', LEVEL2, Res({resin:200}), 2, function() {
  applyBlueberrySecret();
}, function(){
  return state.upgrades2[upgrade2_blackberrysecret].count;
}, 1,
'blueberry, as well as anemone and mistletoe, are unlocked immediately after a transcension, the upgrades to unlock them are no longer needed and given for free, and there is no more waiting required for a fullgrown blackberry.',
undefined, undefined, blueberry[4]);
upgrade2_register_id = 105;


///////////////////////////
LEVEL2 = 2;

upgrade2_register_id = 120;

var upgrade2_field2_6x6 = registerUpgrade2('ethereal field 6x6', LEVEL2, Res({resin:2000, twigs:2000}), 1, function() {
  var numw2 = Math.max(6, state.numw2);
  var numh2 = Math.max(6, state.numh2);
  changeField2Size(state, numw2, numh2);
  initField2UI();
}, function(){return state.numw2 >= 5 && state.numh2 >= 5}, 1, 'increase ethereal field size to 6x6 tiles', undefined, undefined, field_ethereal[0]);

var upgrade2_twigs_extraction = registerUpgrade2('twigs extraction', LEVEL2, Res({resin:10000}), 1, function() {
}, function(){return true;}, 1, 'increase the multiplier per level for twigs, giving exponentially more twigs at higher tree levels: base of exponentiation before: ' + twigs_base + ', after: ' + twigs_base_twigs_extraction,
undefined, undefined, images_mistletoe[1]);

upgrade2_register_id++; // blueberrysecret used to be here but moved to one ethereal tree level lower

function applyCranberrySecret() {
  if(basicChallenge()) return;
  if(state.challenge == challenge_nodelete) return;
  if(state.challenge == challenge_bees) return;
  if(state.challenge == challenge_blackberry) return;
  if(!state.upgrades[berryunlock_2].count) upgrades[berryunlock_2].fun();
  if(!state.upgrades[mushunlock_0].count) upgrades[mushunlock_0].fun();
}

upgrade2_register_id = 146; // this upgraded used to be LEVEL2=3 and must keep its old id
// NOTE: further "secret" upgrades beyond this one are not needed, because at ethereal tree level 4, auto-unlock from the automaton becomes available, removing the need to manually wait for crops to unluck. The "secret" upgrades are a feature to slightly improve quality of the time before auto-unlock exists, but are not intended to speed up runs once auto-unlock exists, runs must have a certain long enough useful duration to avoid too manual gameplay
var upgrade2_cranberrysecret = registerUpgrade2('cranberry secret', LEVEL2, Res({resin:1000}), 2, function() {
  applyCranberrySecret();
}, function(){
  return state.upgrades2[upgrade2_blueberrysecret].count;
}, 1,
'cranberry, as well as champignon, are unlocked immediately after a transcension, the upgrades to unlock them are no longer needed and given for free, and there is no more waiting required for a fullgrown blueberry.', // This is the last of the "secret" upgrades! Soon, automaton will be able to unlock crops instead.
undefined, undefined, cranberry[4]);
upgrade2_register_id = 123;

///////////////////////////
LEVEL2 = 3;

upgrade2_register_id = 140;

// NOTE: this upgrade is way too cheap for being at ethereal tree level 2 (and already upped it from 1000 to 5000 in v0.1.65). But too late to fix it since it's already been bought. It could be seen as a nice bonus for reaching ethereal tree level 3.
var upgrade2_extra_fruit_slot2 = registerUpgrade2('extra fruit slot', LEVEL2, Res({resin:5000,essence:250}), 2, function() {
  state.fruit_slots++;
  // NOTE: also update 'showStorageFruitSourceDialog' when adding new fruit slot upgrades
}, function(){return true;}, 1, 'gain an extra storage slot for fruits', undefined, undefined, images_apple[2]);


var upgrade2_resin_extraction = registerUpgrade2('resin extraction', LEVEL2, Res({resin:50e3}), 1, function() {
}, function(){return true;}, 1, 'increase the multiplier per level for resin, giving exponentially more resin at higher tree levels: base of exponentiation before: ' + resin_base + ', after: ' + resin_base_resin_extraction, undefined, undefined, image_resin);

var upgrade2_diagonal_mistletoes = registerUpgrade2('diagonal mistletoes', LEVEL2, Res({resin:75e3}), 1, function() {
}, function(){return true;}, 1, 'mistletoes also work diagonally to the tree (10 instead of 6 possible spots)', undefined, undefined, images_mistletoe[4]);


upgrade2_register_id = 145;
// also update getNewFieldSize for this type of upgrade!!
var upgrade2_field7x6 = registerUpgrade2('larger field 7x6', LEVEL2, Res({resin:100e3}), 1, function() {
  var numw = Math.max(7, state.numw);
  var numh = Math.max(6, state.numh);
  if(changingFieldSizeNowOk()) changeFieldSize(state, numw, numh);
}, function(){return state.numw >= 6 && state.numh >= 6}, 1, 'increase basic field size to 7x6 tiles', undefined, undefined, field_summer[0]);

upgrade2_register_id++; // cranberrysecret used to be here but moved to one ethereal tree level lower


///////////////////////////
LEVEL2 = 4;
upgrade2_register_id = 160;

var upgrade2_berry_bonus = Num(0.25);
var upgrade2_berry = registerUpgrade2('ethereal berries', LEVEL2, Res({resin:500e3}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase bonus of all ethereal berries by ' + upgrade2_berry_bonus.toPercentString() + ' (additive).', undefined, undefined, image_berrytemplate, upgrade_arrow);

var upgrade2_mush_bonus = Num(0.25);
var upgrade2_mush = registerUpgrade2('ethereal mushrooms', LEVEL2, Res({resin:500e3}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase bonus of all ethereal mushrooms by ' + upgrade2_mush_bonus.toPercentString() + ' (additive).', undefined, undefined, image_mushtemplate, upgrade_arrow);



///////////////////////////
LEVEL2 = 5;
upgrade2_register_id = 180;

var upgrade2_field2_7x6 = registerUpgrade2('ethereal field 7x6', LEVEL2, Res({resin:5e6, twigs:5e6}), 1, function() {
  var numw2 = Math.max(7, state.numw2);
  var numh2 = Math.max(6, state.numh2);
  changeField2Size(state, numw2, numh2);
  initField2UI();
}, function(){return state.numw2 >= 6 && state.numh2 >= 6}, 1, 'increase ethereal field size to 7x6 tiles', undefined, undefined, field_ethereal[0]);



var upgrade2_extra_fruit_slot3 = registerUpgrade2('extra fruit slot', LEVEL2, Res({resin:2e6,essence:10000}), 2, function() {
  state.fruit_slots++;
  // NOTE: also update 'showStorageFruitSourceDialog' when adding new fruit slot upgrades
}, function(){return true;}, 1, 'gain an extra storage slot for fruits', undefined, undefined, images_apple[3]);



var upgrade2_squirrel = registerUpgrade2('unlock squirrel', LEVEL2, Res({resin:1e6}), 2, function() {
  unlockEtherealCrop(squirrel2_0);
  state.res.nuts = Num(0); // reset nuts to 0 when squirrel unlocks first time, to avoid accidental nuts available from one of the older version of the game (in one old version, these were an actual resource, in another nut plants were accidently released with too high nuts production)
  showRegisteredHelpDialog(35);
}, function(){return true;}, 1, 'unlocks the squirrel, nut crops, and a new squirrel tab with a new kind of upgrade. The squirrel must be placed in the ethereal field and then also boosts 8 neighboring ethereal plants. Nuts crops unlock starting from tree level 45.', undefined, undefined, images_squirrel[4]);


var upgrade2_highest_level_bonus = Num(0.005);
var upgrade2_highest_level_bonus2 = Num(0.001);
var upgrade2_highest_level = registerUpgrade2('tree\'s gesture', LEVEL2, Res({resin:2e6}), 5, function() {
      // nothing to do, upgrade count causes the effect elsewhere
    }, function(){return true;}, 95, function() {
      return 'Highest tree level ever bonus: gain ' + upgrade2_highest_level_bonus.toPercentString() +
             ' bonus to seeds, spores, resin and twigs income per highest tree level ever reached (multiplicative). For each next upgrade, gain an additional ' +
             upgrade2_highest_level_bonus2.toPercentString() + ' per upgrade level (additive). Full formula: bonus multiplier = (' +
             upgrade2_highest_level_bonus.addr(1).toString(5) + ' + ' + upgrade2_highest_level_bonus2.toString(5) + ' * (upgrade_levels - 1)) ^ max_tree_level_ever'
             + '<br><br>'
             + '<b>Current bonus</b>: ' + treeGestureBonus(0).subr(1).toPercentString()
             + '<br>'
             + '<b>Next upgrade bonus</b>: ' + treeGestureBonus(1).subr(1).toPercentString()
             + '<br>'
             + '<b>Next tree level bonus</b>: ' + treeGestureBonus(0, 1).subr(1).toPercentString()
             ;
    }, undefined, undefined, tree_images[20][1][1]);



///////////////////////////
LEVEL2 = 6;
upgrade2_register_id = 200;



var upgrade2_spring_growspeed_bonus = 0.25; // how much % faster it grows
var upgrade2_winter_flower_bonus = Num(1.5); // multiplier


var upgrade2_season2 = [];

upgrade2_season2[0] = registerUpgrade2('spring grow speed', LEVEL2, Res({resin:20e6}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 1, 'crops grow ' + Num(upgrade2_spring_growspeed_bonus).toPercentString() + ' faster in spring', undefined, undefined, tree_images[10][1][0]);

upgrade2_season2[1] = registerUpgrade2('summer resin', LEVEL2, Res({resin:20e6}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 1, 'adds a resin bonus to summer, about half as strong as that of winter', undefined, undefined, tree_images[10][1][1]);

upgrade2_season2[2] = registerUpgrade2('autumn resin', LEVEL2, Res({resin:20e6}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 1, 'adds a resin bonus to autumn, about half as strong as that of winter', undefined, undefined, tree_images[10][1][2]);

upgrade2_season2[3] = registerUpgrade2('winter warmth flowers', LEVEL2, Res({resin:20e6}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 1, 'winter tree warmth now also gives a flat ' + upgrade2_winter_flower_bonus.subr(1).toPercentString() + ' bonus to flowers', undefined, undefined, tree_images[10][1][3]);

var upgrade2_flower_bonus = Num(0.25);
var upgrade2_flower = registerUpgrade2('ethereal flowers', LEVEL2, Res({resin:10e6}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase bonus of all ethereal flowers by ' + upgrade2_flower_bonus.toPercentString() + ' (additive).', undefined, undefined, image_flowertemplate, upgrade_arrow);


///////////////////////////
LEVEL2 = 7;
upgrade2_register_id = 220;

// also update getNewFieldSize for this type of upgrade!!
var upgrade2_field7x7 = registerUpgrade2('larger field 7x7', LEVEL2, Res({resin:500e6}), 1, function() {
  var numw = Math.max(7, state.numw);
  var numh = Math.max(7, state.numh);
  if(changingFieldSizeNowOk()) changeFieldSize(state, numw, numh);
}, function(){return state.numw >= 7 && state.numh >= 6}, 1, 'increase basic field size to 7x7 tiles', undefined, undefined, field_summer[0]);


var upgrade2_extra_fruit_slot4 = registerUpgrade2('extra fruit slot', LEVEL2, Res({resin:200e6,essence:100000}), 2, function() {
  state.fruit_slots++;
  // NOTE: also update 'showStorageFruitSourceDialog' when adding new fruit slot upgrades
}, function(){return true;}, 1, 'gain an extra storage slot for fruits', undefined, undefined, images_apple[4]);

///////////////////////////
LEVEL2 = 8;
upgrade2_register_id = 300;

var upgrade2_field2_7x7 = registerUpgrade2('ethereal field 7x7', LEVEL2, Res({resin:10e9}), 1, function() {
  var numw2 = Math.max(7, state.numw2);
  var numh2 = Math.max(7, state.numh2);
  changeField2Size(state, numw2, numh2);
  initField2UI();
}, function(){return state.numw2 >= 7 && state.numh2 >= 6}, 1, 'increase ethereal field size to 7x7 tiles', undefined, undefined, field_ethereal[0]);


///////////////////////////
LEVEL2 = 9;
upgrade2_register_id = 400;

var upgrade2_nettle_bonus = Num(0.25);
var upgrade2_nettle = registerUpgrade2('ethereal stinging', LEVEL2, Res({resin:50e9}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase bonus of all ethereal stinging plants (such as nettles) by ' + upgrade2_nettle_bonus.toPercentString() + ' (additive).', undefined, undefined, image_nettletemplate, upgrade_arrow);


///////////////////////////
LEVEL2 = 10;
upgrade2_register_id = 500;

// also update getNewFieldSize for this type of upgrade!!
var upgrade2_field7x8 = registerUpgrade2('larger field 7x8', LEVEL2, Res({resin:1.5e12}), 1, function() {
  var numw = Math.max(7, state.numw);
  var numh = Math.max(8, state.numh);
  if(changingFieldSizeNowOk()) changeFieldSize(state, numw, numh);
}, function(){return state.numw >= 7 && state.numh >= 7}, 1, 'increase basic field size to 7x8 tiles', undefined, undefined, field_summer[0]);


var upgrade2_twigs_siphoning = registerUpgrade2('twigs siphoning', LEVEL2, Res({resin:500e9}), 1, function() {
}, function(){
  return !!state.upgrades2[upgrade2_twigs_extraction].count;
}, 1, 'gain more twigs at tree levels above ' + twigs_siphoning_level + ': base of exponentiation switches from ' + twigs_base_twigs_extraction + ' to ' + twigs_base_twigs_siphoning + ' starting from this level',
undefined, undefined, images_mistletoe[1]);


var upgrade2_extra_fruit_slot5 = registerUpgrade2('extra fruit slot', LEVEL2, Res({resin:200e9,essence:1000000}), 2, function() {
  state.fruit_slots++;
  // NOTE: also update 'showStorageFruitSourceDialog' when adding new fruit slot upgrades
}, function(){return true;}, 1, 'gain an extra storage slot for fruits', undefined, undefined, images_apple[5]);

//function registerUpgrade2(name, treelevel2, cost, cost_increase, fun, pre, maxcount, description, bgcolor, bordercolor, image0, image1) {

///////////////////////////
LEVEL2 = 11;
upgrade2_register_id = 600;

var upgrade2_field2_7x8 = registerUpgrade2('ethereal field 7x8', LEVEL2, Res({resin:20e12}), 1, function() {
  var numw = Math.max(7, state.numw2);
  var numh = Math.max(8, state.numh2);
  changeField2Size(state, numw, numh);
  initField2UI();
}, function(){return state.numw2 >= 7 && state.numh2 >= 7}, 1, 'increase ethereal field size to 7x8 tiles', undefined, undefined, field_ethereal[0]);

var upgrade2_resin_siphoning = registerUpgrade2('resin siphoning', LEVEL2, Res({resin:10e12}), 1, function() {
}, function(){
  return !!state.upgrades2[upgrade2_resin_extraction].count;
}, 1, 'gain more resin at tree levels above ' + resin_siphoning_level + ': base of exponentiation switches from ' + resin_base_resin_extraction + ' to ' + resin_base_resin_siphoning + ' starting from this level',
undefined, undefined, image_resin);


///////////////////////////
LEVEL2 = 12;
upgrade2_register_id = 700;

var upgrade2_bee_bonus = Num(0.25);
var upgrade2_bee = registerUpgrade2('ethereal bees', LEVEL2, Res({resin:100e12}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase bonus of all ethereal bees by ' + upgrade2_bee_bonus.toPercentString() + ' (additive).', undefined, undefined, image_workerbeetemplate, upgrade_arrow);

var upgrade2_nuts_bonus = registerUpgrade2('unused nuts bonus', LEVEL2, Res({resin:25e12}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return squirrelUnlocked();}, 1, 'get a production bonus for unused nuts (logarithmic).', undefined, undefined, image_nuts);

///////////////////////////
LEVEL2 = 13;
upgrade2_register_id = 800;

// no upgrades here yet, but has crops though

///////////////////////////
LEVEL2 = 14;
upgrade2_register_id = 900;

var upgrade2_extra_fruit_slot6 = registerUpgrade2('extra fruit slot', LEVEL2, Res({resin:1e15,essence:2e6}), 2, function() {
  state.fruit_slots++;
  // NOTE: also update 'showStorageFruitSourceDialog' when adding new fruit slot upgrades
}, function(){return true;}, 1, 'gain an extra storage slot for fruits', undefined, undefined, images_apple[6]);

///////////////////////////
LEVEL2 = 15;
upgrade2_register_id = 1000;

var upgrade2_ethereal_mistletoe = registerUpgrade2('unlock ethereal mistletoe', LEVEL2, Res({resin:1e15}), 2, function() {
  unlockEtherealCrop(mistletoe2_0);
  showRegisteredHelpDialog(41);
}, function(){return true;}, 1, 'unlocks the ethereal mistletoe. This crop must be placed in the ethereal field next to the tree. You can have only one of this crop at the same time. It has multiple effects that can get unlocked and upgraded over time. Upgrades cost time.', undefined, undefined, images_mistletoe[4]);


///////////////////////////
LEVEL2 = 16;
upgrade2_register_id = 1100;

// no upgrades here yet, but has crops though

///////////////////////////
LEVEL2 = 17;
upgrade2_register_id = 1200;

// also update getNewFieldSize for this type of upgrade!!
var upgrade2_field8x8 = registerUpgrade2('larger field 8x8', LEVEL2, Res({resin:20e18}), 1, function() {
  var numw = Math.max(8, state.numw);
  var numh = Math.max(8, state.numh);
  if(changingFieldSizeNowOk()) changeFieldSize(state, numw, numh);
}, function(){return state.numw >= 7 && state.numh >= 8}, 1, 'increase basic field size to 8x8 tiles', undefined, undefined, field_summer[0]);

///////////////////////////
LEVEL2 = 18;
upgrade2_register_id = 1300;

var upgrade2_field2_8x8 = registerUpgrade2('ethereal field 8x8', LEVEL2, Res({resin:20e19}), 1, function() {
  var numw = Math.max(8, state.numw2);
  var numh = Math.max(8, state.numh2);
  changeField2Size(state, numw, numh);
  initField2UI();
}, function(){return state.numw2 >= 7 && state.numh2 >= 8}, 1, 'increase ethereal field size to 8x8 tiles', undefined, undefined, field_ethereal[0]);

///////////////////////////
LEVEL2 = 19;
upgrade2_register_id = 1400;

var upgrade2_extra_fruit_slot7 = registerUpgrade2('extra fruit slot', LEVEL2, Res({resin:20e19,essence:10e6}), 2, function() {
  state.fruit_slots++;
  // NOTE: also update 'showStorageFruitSourceDialog' when adding new fruit slot upgrades
}, function(){return true;}, 1, 'gain an extra storage slot for fruits', undefined, undefined, images_apple[7]);

///////////////////////////
LEVEL2 = 20;
upgrade2_register_id = 1500;

// cheap cost because having it as an upgrade is more there to get its help dialog than to be a cost barrier. The cost is 8 to look like infinity.
var upgrade2_infinity_field = registerUpgrade2('unlock infinity field', LEVEL2, Res({resin:8}), 2, function() {
  state.infinitystarttime = state.time;
  showRegisteredHelpDialog(42);
}, function(){return true;}, 1, 'unlocks the infinity field. This is a new field with its own crops producing its own resources. The crops give a small bonus to the basic field, but unlike the ethereal field the infinity field is more focused on growing itself than boosting the basic field.', undefined, undefined, image_pond);

///////////////////////////
LEVEL2 = 21;
upgrade2_register_id = 1600;

// also update getNewFieldSize for this type of upgrade!!
var upgrade2_field9x8 = registerUpgrade2('larger field 9x8', LEVEL2, Res({resin:200e21}), 1, function() {
  var numw = Math.max(9, state.numw);
  var numh = Math.max(8, state.numh);
  if(changingFieldSizeNowOk()) changeFieldSize(state, numw, numh);
}, function(){return state.numw >= 8 && state.numh >= 8}, 1, 'increase basic field size to 9x8 tiles', undefined, undefined, field_summer[0]);

///////////////////////////
LEVEL2 = 22;
upgrade2_register_id = 1700;

var upgrade2_field2_9x8 = registerUpgrade2('ethereal field 9x8', LEVEL2, Res({resin:10e24}), 1, function() {
  var numw = Math.max(9, state.numw2);
  var numh = Math.max(8, state.numh2);
  changeField2Size(state, numw, numh);
  initField2UI();
}, function(){return state.numw2 >= 8 && state.numh2 >= 8}, 1, 'increase ethereal field size to 9x8 tiles', undefined, undefined, field_ethereal[0]);

///////////////////////////
LEVEL2 = 23;
upgrade2_register_id = 1800;

// no upgrades here yet, but has crops though

///////////////////////////
LEVEL2 = 24;
upgrade2_register_id = 1900;

// no upgrades here yet, but has crops though

///////////////////////////
LEVEL2 = 25;
upgrade2_register_id = 2000;

var upgrade2_lotus_bonus = Num(0.15);
var upgrade2_lotus_bonus_exponent = Num(1.025);
var upgrade2_lotus = registerUpgrade2('ethereal lotuses', LEVEL2, Res({resin:100e27}), 7.5, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0,
function() {
  var result =  'increase bonus of all ethereal lotuses by ' + upgrade2_lotus_bonus.toPercentString() + ' * level ^ ' + upgrade2_lotus_bonus_exponent.toString(4) + '. Since lotuses boost multiple different crops, the actual effect is larger than this.';
  var u = state.upgrades2[upgrade2_lotus];
  var before = upgrade2_lotus_bonus.mulr(Num(u.count).pow(upgrade2_lotus_bonus_exponent));
  var after = upgrade2_lotus_bonus.mulr(Num(u.count + 1).pow(upgrade2_lotus_bonus_exponent));
  result += '<br><br>';
  result += '<b>Current bonus</b>: +' + before.toPercentString();
  result += '<br>';
  result += '<b>Next upgrade bonus</b>: +' + after.toPercentString();
  //result += '<br>';
  //result += '<b>Gain</b>: +' + (after.addr(1).div(before.addr(1))).subr(1).toPercentString();
  return result;
},
undefined, undefined, image_lotustemplate, upgrade_arrow);

///////////////////////////
LEVEL2 = 26;
upgrade2_register_id = 2100;

var upgrade2_ethereal_tree_level_bonus = Num(0.5);
var upgrade2_ethereal_tree_level = registerUpgrade2('spectral arboretum', LEVEL2, Res({resin:1e30}), 6, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0,
function() {
  var result =  'production bonus of ' + upgrade2_ethereal_tree_level_bonus.toPercentString() + ' for ethereal tree levels above 25.'
  result += '<br>';
  result += 'Formula: 50% * upgrade_levels * (ethereal_tree_level - 25).'
  var u = state.upgrades2[upgrade2_ethereal_tree_level].count;
  var l = state.treelevel2 - 25;
  var before = upgrade2_ethereal_tree_level_bonus.mulr(u).mulr(l);
  var after = upgrade2_ethereal_tree_level_bonus.mulr(u + 1).mulr(l);
  var after2 = upgrade2_ethereal_tree_level_bonus.mulr(u).mulr(l + 1);
  result += '<br>';
  result += '<br><b>Current bonus</b>: +' + before.toPercentString();
  result += '<br><b>Next upgrade bonus</b>: +' + after.toPercentString();
  result += '<br><b>Next ethereal tree level bonus</b>: +' + after2.toPercentString();
  return result;
},
'',
undefined, undefined, tree_images[20][1][4]);

///////////////////////////
LEVEL2 = 27;
upgrade2_register_id = 2200;

var upgrade2_prestiged_growspeed_amount = 180;

var upgrade2_prestiged_growspeed = registerUpgrade2('prestiged grow speed', LEVEL2, Res({resin:10e30}), 2, function() {
}, function(){return true}, 0, 'prestiged crops grow up to ' + upgrade2_prestiged_growspeed_amount + ' seconds per upgrade level faster. This is soft-capped for already fast crops, a crop that already only takes ' + upgrade2_prestiged_growspeed_amount + ' seconds, will not get much faster. So this upgrade mainly improves the higher tier, slower, crops to become faster and thus within reach.', undefined, undefined, blueberry[0]);


///////////////////////////
LEVEL2 = 28;
upgrade2_register_id = 2300;

// also update getNewFieldSize for this type of upgrade!!
var upgrade2_field9x9 = registerUpgrade2('larger field 9x9', LEVEL2, Res({resin:2e33}), 1, function() {
  var numw = Math.max(9, state.numw);
  var numh = Math.max(9, state.numh);
  if(changingFieldSizeNowOk()) changeFieldSize(state, numw, numh);
}, function(){return state.numw >= 9 && state.numh >= 8}, 1, 'increase basic field size to 9x9 tiles', undefined, undefined, field_summer[0]);

var upgrade2_second_automaton = registerUpgrade2('second automaton', LEVEL2, Res({resin:1e33}), 1, function() {
}, function(){return true}, 1, 'Can have a second automaton in the ethereal field, to get more neighbor boost', undefined, undefined, images_automaton[4]);

///////////////////////////
LEVEL2 = 29;
upgrade2_register_id = 2400;

var upgrade2_field2_9x9 = registerUpgrade2('ethereal field 9x9', LEVEL2, Res({resin:20e33}), 1, function() {
  var numw = Math.max(9, state.numw2);
  var numh = Math.max(9, state.numh2);
  changeField2Size(state, numw, numh);
  initField2UI();
}, function(){return state.numw2 >= 9 && state.numh2 >= 8}, 1, 'increase ethereal field size to 9x9 tiles', undefined, undefined, field_ethereal[0]);


////////////////////////////////////////////////////////////////////////////////

registered_upgrades2.sort(function(a, b) {
  return upgrades2[a].index - upgrades2[b].index;
});

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// a function that starts at 0 for x = 0, and for x going towards infinity, outputs values towards 1 (horizontal asymptote at 1)
// this for e.g. effects of upgrades with diminishing returns
// h = when (for which x) should 50% (0.5) be reached
// the function is also antisymmetric for negative x, it's an s curve
function towards1(x, h) {
  // some options for this:
  // *) atan(x) / (pi/2)
  // *) tanh(x)
  // *) erf(x): goes too fast to 1 and too horizontal once 1 reached
  // *) x / sqrt(x * x + 1)
  if(h == 0) return (x == 0) ? 0 : (x < 0 ? -1 : 1);
  x *= 0.57735 / h; // 0.57735 is the value such that towards1(h, h) returns 0.5
  return x / Math.sqrt(x * x + 1);
}


// fruit abilities
var fruit_index = 0;
var FRUIT_NONE = fruit_index++; // 0 means no ability
var FRUIT_BERRYBOOST = fruit_index++; // boosts seed production of berries
var FRUIT_MUSHBOOST = fruit_index++; // boosts muchrooms spore production but also seed consumption
var FRUIT_MUSHEFF = fruit_index++; // decreases seed consumption of mushroom (but same spore production output) (mushroom ecomony)
var FRUIT_FLOWERBOOST = fruit_index++;
var FRUIT_BRASSICA = fruit_index++; // watercress copying
var FRUIT_GROWSPEED = fruit_index++; // this one can be swapped when planting something. It's ok to have a few fruit types that require situational swapping
var FRUIT_WEATHER = fruit_index++; // idem
var FRUIT_NETTLEBOOST = fruit_index++;
// platinum and higher abilities
var FRUIT_RESINBOOST = fruit_index++;
var FRUIT_TWIGSBOOST = fruit_index++;
var FRUIT_NUTBOOST = fruit_index++;
var FRUIT_BEEBOOST = fruit_index++;
// sapphire and higher abilities
var FRUIT_MIX = fruit_index++; // nettle/brassica/bee mix
var FRUIT_TREELEVEL = fruit_index++; // treelevel production bonus
var FRUIT_SEED_OVERLOAD = fruit_index++; // increase seed production but also mushrooms's seed consumption
var FRUIT_SPORES_OVERLOAD = fruit_index++; // increase spore production but at the cost of even more seed consumption. This ability is introduced for emerald fruits, the first fruit with 6 slots. This ability is only useable if seeds boost is also slotted in the fruit, without it the mushroom for sure won't get enough seeds. It's also not useable to have this ability and the regular FRUIT_MUSHBOOST at the same time, there won't be enough seed production to support both multiplier at the same time. Instead, it's like this: if there are enough seeds, FRUIT_SPORES_OVERLOAD is best. If there are not enough seeds, then instead FRUIT_MUSHBOOST is better because the seeds are cheaper now, even though FRUIT_MUSHBOOST can't reach an as high spores amount as FRUIT_SPORES_OVERLOAD.
var FRUIT_RESIN_TWIGS = fruit_index++; // works like FRUIT_RESINBOOST and FRUIT_TWIGSBOOST at the same time

// These seasonal abilities only exist for the appropriate seasonal fruit and do not take up a regular slot
fruit_index = 20; // leave a few available spots for non-seasonal abilities above
var FRUIT_SPRING = fruit_index++;
var FRUIT_SUMMER = fruit_index++;
var FRUIT_AUTUMN = fruit_index++;
var FRUIT_WINTER = fruit_index++;
var FRUIT_SPRING_SUMMER = fruit_index++;
var FRUIT_SUMMER_AUTUMN = fruit_index++;
var FRUIT_AUTUMN_WINTER = fruit_index++;
var FRUIT_WINTER_SPRING = fruit_index++;
var FRUIT_ALL_SEASON = fruit_index++; // star fruit
var FRUIT_ALL_SEASON2 = fruit_index++; // dragon fruit
// BEWARE: only add new ones at the end or before the seasonal ones, since the numeric index values are saved in savegames!

// NOT TODO: one that extends lifetime of watercress --> do not do this: too much manual work required with swapping fruits when active playing with watercress then
// NOT TODO: one affecting ferns: same issue: causes too much manual work during active playing and counting on fern spawn times
// NOT TODO: one decreasing cost: would cause an annoying technique where you have to swap fruits all the time before planting anything

// returns the amount of boost (add 1 to get multiplier) of the ability, when relevant, for a given ability level in the fruit and the fruit tier
// opt_basic: if true, adjusts some abilities if basic challenge active. Doesn't adjust ability or level, as the getFruitTier and getFruitAbility already take an opt_basic parameter for that
// opt_sub_part: optional sub-part, for some abilities that have multiple independent effects, e.g. FRUIT_RESINBOOST and FRUIT_TWIGSBOOST. Can also be used for FRUIT_TREELEVEL to get the target level instead of depending on current treelevel
function getFruitBoost(ability, level, tier, opt_basic, opt_sub_part) {
  var base = Math.pow(getFruitTierStrength(tier), 0.75) * 0.05;

  if(ability == FRUIT_BERRYBOOST) {
    if(tier >= 9) {
      return Num(base * 1.5 * level).powr(1.1);
    } else {
      return Num(base * 1.0 * level);
    }
  }
  if(ability == FRUIT_MUSHBOOST) {
    if(tier >= 9) {
      return Num(base * 2.5 * level).powr(1.1);
    } else if(tier >= 8) {
      return Num(base * 2.0 * level);
    } else {
      // FRUIT_MUSHBOOST is in theory mostly only useful in combination with FRUIT_BERRYBOOST (due to needing more seeds too), and since the combination of both then takes up 2 slots (while flower takes up only 1 slot), this one can get a bit higher multiplier to compensate
      // note that this doesn't help that much, given that for high level fruits, multipliers per slot are in the thousands
      return Num(base * 1.5 * level);
    }
  }
  if(ability == FRUIT_MUSHEFF) {
    // this is a worse version of FRUIT_NETTLE, but not all fruits should have an awesome ability plus for later fruits with many slots this one still combines well together with FRUIT_NETTLE.
    var amount = towards1(level, 5);
    var max = 0.4 * (1 + 0.6 * tier / 11);
    return Num(max * amount);
  }
  if(ability == FRUIT_FLOWERBOOST) {
    return Num(base * 1.0 * level);
  }
  if(ability == FRUIT_BRASSICA) {
    /*var amount = towards1(level, 10);
    var max = 1 + tier * 0.2;
    return Num(max * amount);*/
    return Num(base * 1.25 * level);
  }
  if(ability == FRUIT_GROWSPEED) {
    var amount = towards1(level, 5);
    var max = 0.2 * (1 + 3 * tier / 12);
    return Num(max * amount);
  }
  if(ability == FRUIT_WEATHER) {
    if(tier >= 8) {
      // test making weather less important for fruits starting from sapphire
      return Num(base * 1.0 * level);
    } else {
      return Num(base * 1.5 * level);
    }
  }
  if(ability == FRUIT_NETTLEBOOST) {
    if(tier >= 8) {
      // test making nettle more important for fruits starting from sapphire
      return Num(base * 1.5 * level);
    } else {
      // this is a better version of FRUIT_MUSHBOOST, so make its multiplier less strong than that one
      // but on the other hand, make it higher than the multiplier for bee boost, otherwise bee is strictly better than this one
      // note that flower boost is strictly better than all of those but having 1 much stronger ability is ok
      return Num(base * 1.0 * level);
    }
  }
  if(ability >= FRUIT_SPRING && ability <= FRUIT_WINTER) {
    return Num(0.25); // not upgradeable
  }
  if(ability >= FRUIT_SPRING_SUMMER && ability <= FRUIT_WINTER_SPRING) {
    if(!haveFruitMix(1)) return Num(0)
    return Num(0.3); // not upgradeable
  }
  if(ability == FRUIT_ALL_SEASON) {
    if(!haveFruitMix(2)) return Num(0)
    return Num(0.35); // not upgradeable
  }
  if(ability == FRUIT_ALL_SEASON2) {
    if(!haveFruitMix(3)) {
      if(!haveFruitMix(2)) return Num(0)
      return Num(0.35); // act like star fruit in that case
    }
    if(opt_basic && basicChallenge()) return Num(0.4); // in case of basic challenge, only be slightly better than starfruit rather than a big jump up
    return Num(1.0); // not upgradeable
  }
  if(ability == FRUIT_RESINBOOST) {
    if(opt_sub_part == 1) {
      // boost to the unused resin production bonus, but only partially in a similar way to the partial abilities of the mix ability
      return Num(base * 1.0 * level).powr(0.25);
    } else {
      var amount = towards1(level, 5);
      var t = tier - 4; // only starts at tier 5
      if(t < 0) t = 0;
      var max = 0.2 + 0.5 * t / 6;
      var tweak = 2.5;
      return Num(tweak * max * amount);
    }
  }
  if(ability == FRUIT_TWIGSBOOST) {
    if(opt_sub_part == 1) {
      // boost to the unused twigs production bonus, but only partially in a similar way to the partial abilities of the mix ability
      return Num(base * 1.0 * level).powr(0.25);
    } else {
      var amount = towards1(level, 5);
      var t = tier - 4; // only starts at tier 5
      if(t < 0) t = 0;
      var max = 0.2 + 0.5 * t / 6;
      var tweak = 2.5;
      return Num(tweak * max * amount);
    }
  }
  if(ability == FRUIT_RESIN_TWIGS) {
    if(opt_sub_part == 1) {
      // boost to the unused resin and twigs production bonus, but only partially in a similar way to the partial abilities of the mix ability
      // since it applies to both at same time multiplicatively, exponent is smaller then for FRUIT_RESINBOOST and FRUIT_TWIGSBOOST
      return Num(base * 1.0 * level).powr(0.15);
    } else {
      var amount = towards1(level, 5);
      var t = tier - 4; // only starts at tier 5
      if(t < 0) t = 0;
      var max = 0.2 + 0.5 * t / 6;
      var tweak = 2.5;
      return Num(tweak * max * amount);
    }
  }
  if(ability == FRUIT_NUTBOOST) {
    var amount = towards1(level, 5);
    var t = tier - 4; // only starts at tier 5
    if(t < 0) t = 0;
    var max = 0.2 + 0.5 * t / 6;
    return Num(max * amount);
  }
  if(ability == FRUIT_BEEBOOST) {
    // bee boost is very similar to flower boost, but smaller, to have some variation: flowerboost is better, but you can still combine both to get way more boost
    return Num(base * level * 0.5);
  }
  if(ability == FRUIT_MIX) {
    if(tier >= 8) {
      return Num(base * level * 1.25);
    } else {
      /*
      mixes bee, nettle and brassica in an additive way with their corresponding fruits
      nettle, brassica and bee's multipliers for the deticated abilities are weighted by respectively 0.75, 1.25 and 0.5
      so it's used for different effects, but it should be ensured that it's still about as powerful as 1 effect for balance
      each effect is an independent multiplier making the production higher, so in theory achieving a perfect equality is done by taking the cube root of the multiplier for each of the effect
      however, bee/brassica/nettle all improve mushroom, but only bee/brassica improve seeds. For seeds using sqrt of the effects should be enough.
      to strike a balance, do the following at the place where the multipliers from this fruit ability are computed:
      apply for each effect the multiplier, then add 1 as is always done to make these boosts into multipliers, then apply the given power, with the numbers such as mix_mul_nettle and mix_pow_nettle defined further below
      the multipliers are made to roughly match (but not 100%) those of the corresponding single abilities, and the powers are roughly like cube root, but adjusted to give less focus to nettle and a bit more to those abilities that can also benefit seeds

      by design, combining this ability with another ability that is nettle, brassica or bee, severely harms this one: the fact that it's then additive (and so on the order of only 2x or so boost then), and the fact that fruit abilities are supposed to give boosts of thousands of percents at this point, makes this ability then much less useful.

      A base multiplier of slightly higher than 1 is applied here, because even if perfectly balanced, without increasing its power a little bit its stats often fall short of a pure bee or brassica fruit

      NOTE: this result is not used directly, a cube-root-ish power is used with mix_pow_bee at the locations where used
      */
      return Num(base * level * 1.2);
    }
  }
  if(ability == FRUIT_TREELEVEL) {
    // this one depends on current tree level, and uses the treeLevelFruitBoost implementation, which itself is based on the bee boost but with a tree-level dependent multiplier
    return treeLevelFruitBoost(tier, level, state.treelevel, opt_sub_part == 1);
  }
  if(ability == FRUIT_SEED_OVERLOAD) {
    return Num(base * 1.1 * level);
  }
  if(ability == FRUIT_SPORES_OVERLOAD) {
    return Num(base * 2.5 * level).powr(1.1).mulr(2.5); // same as FRUIT_MUSHBOOST but a much higher multiplier, but this is only reachable if more than enough seeds are available
  }

  return Num(0.1);
}

var mix_mul_nettle = 1.0;
var mix_pow_nettle = 0.3;
var mix_mul_brassica = 1.25;
var mix_pow_brassica_berry = 0.6;
var mix_pow_brassica_mush = 0.3;
var mix_mul_bee = 0.5;
var mix_pow_bee = 0.4;


// Is an ability that doesn't take up a regular fruit ability slot, but comes in addition
// Such ability cannot be upgraded
function isInherentAbility(ability) {
  if(ability == FRUIT_SPRING) return true;
  if(ability == FRUIT_SUMMER) return true;
  if(ability == FRUIT_AUTUMN) return true;
  if(ability == FRUIT_WINTER) return true;
  if(ability == FRUIT_SPRING_SUMMER) return true;
  if(ability == FRUIT_SUMMER_AUTUMN) return true;
  if(ability == FRUIT_AUTUMN_WINTER) return true;
  if(ability == FRUIT_WINTER_SPRING) return true;
  if(ability == FRUIT_ALL_SEASON) return true;
  if(ability == FRUIT_ALL_SEASON2) return true;
  return false;
}

// cost for next level if ability is at this level
function getFruitAbilityCost(ability, level, tier) {
  var result;

  var nonlinearability = false;
  if(ability == FRUIT_MUSHEFF) nonlinearability = true;
  if(ability == FRUIT_GROWSPEED) nonlinearability = true;
  if(ability == FRUIT_RESINBOOST) nonlinearability = true;
  if(ability == FRUIT_TWIGSBOOST) nonlinearability = true;
  if(ability == FRUIT_RESIN_TWIGS) nonlinearability = true;
  if(ability == FRUIT_NUTBOOST) nonlinearability = true;

  if(nonlinearability) {
    result = Num(1.5).powr(level);
  } else {
    result = Num(1.25).powr(level);
  }
  result = result.mulr(getFruitTierCost(tier));

  return Res({essence:result});
}

// how much essence this fruit gives on sacrifice
function getFruitSacrifice(f) {
  var result = getFruitTierCost(f.tier) * 10;

  if(f.type > 0) result *= 1.25;

  return Res({essence:result});
}

// This function determines the cost of fruit tier abilities, but also the amount of essence the fruit gives when sacrificed
function getFruitTierCost(tier) {
  // a manually chosen exponential-ish progression
  switch(tier) {
    case 0: return 1;
    case 1: return 4;
    case 2: return 12;
    case 3: return 30;
    case 4: return 50; // this is a bit of a dip in the progression, for backwards compatibility when only up to gold was available and the formula progressed too slowly. (later, sep 2024, incrased from 45 to 50 but this could still use more balancing in combination with next tier)
    case 5: return 100;
    case 6: return 500;
    case 7: return 1500;
    case 8: return 4000;
    case 9: return 25000;
    case 10: return 100000;
    // TODO: these numbers must be tuned once those fruits are introduced
    case 11: return 400000;
  }
  return tier < 0 ? 0 : 400000;
}

// This determines how strong standard fruit abilities such as flower boost and berry boost are at this tier
// It's only a base value, and tuned together with the getFruitTierCost value, its usage at getFruitBoost applies additional formulas to this
function getFruitTierStrength(tier) {
  // a manually chosen exponential-ish progression
  switch(tier) {
    case 0: return 1;
    case 1: return 4;
    case 2: return 12;
    case 3: return 30;
    case 4: return 50; // idem, see getFruitTierCost
    case 5: return 100;
    case 6: return 500;
    case 7: return 1500;
    case 8: return 4000;
    case 9: return 10000; // a smaller growth than in getFruitTierCost, because this fruit already adds an extra slot which is already a very strong thing on its own
    case 10: return 40000;
    // TODO: these numbers must be tuned once those fruits are introduced
    case 11: return 100000;
  }
  return tier < 0 ? 0 : 100000;
}

// if due to a game update the costs of certain abilities of fruits changes, this recomputes the correct amount of essence spent
function correctifyFruitCost(f) {
  //if(f.essence.eqr(0)) return; // a fruit in which no upgrades have been done, no need to spend time checking this one

  var ess = new Num(0);
  for(var i = 0; i < f.abilities.length; i++) {
    var ability = f.abilities[i];
    if(isInherentAbility(ability) || ability == FRUIT_NONE) continue;
    var level = f.levels[i];
    for(var j = f.starting_levels[i]; j < level; j++) {
      var cost = getFruitAbilityCost(ability, j, f.tier);
      ess.addInPlace(cost.essence);
    }
  }
  //console.log('ess: ' + ess.toString() + ', ' + f.essence.toString());
  if(ess.gt(f.essence.mulr(1.01))) {
    var i = -1;
    var last = -1;
    while(ess.gt(f.essence)) {
      // TOOD: get the most expensive ability, instead of just rotating around like this
      i++;
      if(i >= f.abilities.length) i = 0;
      if(i == last) break; // avoid infinite loop
      var ability = f.abilities[i];
      if(isInherentAbility(ability) || ability == FRUIT_NONE) continue;
      if(f.levels[i] <= f.starting_levels[i]) continue;
      f.levels[i]--;
      var cost = getFruitAbilityCost(ability, f.levels[i], f.tier);
      ess.subInPlace(cost.essence);
      last = i; // last one where an action was taken
    }
  }
  f.essence = ess;

}

// get fruit tier given random roll and tree level
// improved_probability: whether you get improved probability of the higher tier drop
// roll is random value in range 0-1. Higher roll gives higher tier, so setting roll to 1 makes it return the highest tier possible for the given tree level.
function getNewFruitTier(roll, treelevel, improved_probability) {
  var tier = 0;

  // roll: higher is better
  // these prob requirements: lower is better
  var prob10 = 0.1;
  var prob20 = 0.2;
  var prob25 = 0.25;
  var prob50 = 0.5;
  var prob75 = 0.75;

  if(improved_probability) {
    prob10 = 0.05;
    prob20 = 0.1;
    prob25 = 0.15;
    prob50 = 0.35;
    prob75 = 0.66;
  }

  // normally doesn't happen
  if(treelevel < 5) {
    return 0;
  }

  // level 5: zinc introduced
  if(treelevel >= 5 && treelevel <= 9) {
    return 0;
  }

  // level 10: bronze introduced
  if(treelevel >= 10 && treelevel <= 14) {
    return (roll > prob75) ? 1 : 0;
  }

  // level 15
  if(treelevel >= 15 && treelevel <= 19) {
    if(state.g_p_treelevel < 15) return 1; // guarantee a bronze fruit if reaching this level the first time, to match what a help dialog that then pops up says
    return (roll > prob50) ? 1 : 0;
  }

  // level 20
  if(treelevel >= 20 && treelevel <= 24) {
    return (roll > prob25) ? 1 : 0;
  }

  // level 25: silver introduced
  if(treelevel >= 25 && treelevel <= 29) {
    return (roll > prob50) ? 2 : 1;
  }

  // level 30
  if(treelevel >= 30 && treelevel <= 34) {
    return (roll > prob25) ? 2 : 1;
  }

  // level 35: electrum introduced
  if(treelevel >= 35 && treelevel <= 39) {
    return (roll > prob75) ? 3 : 2;
  }

  // level 40
  if(treelevel >= 40 && treelevel <= 44) {
    return (roll > prob50) ? 3 : 2;
  }

  // level 45
  if(treelevel >= 45 && treelevel <= 49) {
    return (roll > prob25) ? 3 : 2;
  }

  // level 50
  if(treelevel >= 50 && treelevel <= 54) {
    return (roll > prob20) ? 3 : 2;
  }

  // level 55: gold introduced
  if(treelevel >= 55 && treelevel <= 59) {
    return (roll > prob75) ? 4 : 3;
  }

  // level 60
  if(treelevel >= 60 && treelevel <= 64) {
    return (roll > prob50) ? 4 : 3;
  }

  // level 65
  if(treelevel >= 65 && treelevel <= 69) {
    return (roll > prob25) ? 4 : 3;
  }

  // level 70
  if(treelevel >= 70 && treelevel <= 74) {
    return (roll > prob20) ? 4 : 3;
  }

  // level 75: platinum introduced
  if(treelevel >= 75 && treelevel <= 79) {
    return (roll > prob75) ? 5 : 4;
  }

  // level 80
  if(treelevel >= 80 && treelevel <= 84) {
    return (roll > prob50) ? 5 : 4;
  }

  // level 85
  if(treelevel >= 85 && treelevel <= 89) {
    return (roll > prob25) ? 5 : 4;
  }

  // level 90
  if(treelevel >= 90 && treelevel <= 94) {
    return (roll > prob20) ? 5 : 4;
  }

  // level 95: rhodium introduced
  if(treelevel >= 95 && treelevel <= 99) {
    return (roll > prob75) ? 6 : 5;
  }

  // level 100
  if(treelevel >= 100 && treelevel <= 104) {
    return (roll > prob50) ? 6 : 5;
  }

  // level 105
  if(treelevel >= 105 && treelevel <= 109) {
    return (roll > prob25) ? 6 : 5;
  }

  // level 110
  if(treelevel >= 110 && treelevel <= 114) {
    return (roll > prob20) ? 6 : 5;
  }

  // level 115: amethyst introduced
  if(treelevel >= 115 && treelevel <= 119) {
    return (roll > prob75) ? 7 : 6;
  }

  // level 120
  if(treelevel >= 120 && treelevel <= 124) {
    return (roll > prob50) ? 7 : 6;
  }

  // level 125
  if(treelevel >= 125 && treelevel <= 129) {
    return (roll > prob25) ? 7 : 6;
  }

  // level 130
  if(treelevel >= 130 && treelevel <= 134) {
    return (roll > prob20) ? 7 : 6;
  }

  // level 135: sapphire introduced
  if(treelevel >= 135 && treelevel <= 139) {
    return (roll > prob75) ? 8 : 7;
  }

  // level 140
  if(treelevel >= 140 && treelevel <= 144) {
    return (roll > prob50) ? 8 : 7;
  }

  // level 145
  if(treelevel >= 145 && treelevel <= 149) {
    return (roll > prob25) ? 8 : 7;
  }

  // level 150
  if(treelevel >= 150 && treelevel <= 154) {
    return (roll > prob20) ? 8 : 7;
  }

  // level 155
  if(treelevel >= 155 && treelevel <= 159) {
    return (roll > prob10) ? 8 : 7;
  }

  // level 160: emerald introduced - NOTE: this is 25 levels after the previous fruit, instead of per 20 levels as it was before
  if(treelevel >= 160 && treelevel < 165) {
    return (roll > prob75) ? 9 : 8;
  }

  // level 165
  if(treelevel >= 165 && treelevel < 170) {
    return (roll > prob50) ? 9 : 8;
  }

  // level 170
  if(treelevel >= 170 && treelevel < 175) {
    return (roll > prob25) ? 9 : 8;
  }

  // level 175
  if(treelevel >= 175 && treelevel < 180) {
    return (roll > prob20) ? 9 : 8;
  }

  // level 180
  if(treelevel >= 180 && treelevel < 185) {
    return (roll > prob10) ? 9 : 8;
  }

  // level 185
  if(treelevel >= 185 && treelevel < 190) {
    return 9;
  }

  // level 190: ruby introduced - NOTE: this is 30 levels after the previous fruit, instead of per 20/25 levels as it was before
  if(treelevel >= 190 && treelevel < 195) {
    return (roll > prob75) ? 10 : 9;
  }

  // level 195
  if(treelevel >= 195 && treelevel < 200) {
    return (roll > prob50) ? 10 : 9;
  }

  // level 200
  if(treelevel >= 200 && treelevel < 205) {
    return (roll > prob25) ? 10 : 9;
  }

  // level 205
  if(treelevel >= 205 && treelevel < 210) {
    return (roll > prob20) ? 10 : 9;
  }

  // level 210
  if(treelevel >= 210 && treelevel < 215) {
    return (roll > prob10) ? 10 : 9;
  }

  // level 215
  if(treelevel >= 215 && treelevel < 220) {
    return 10;
  }

  // Higher tree levels are not yet implemented for the fruits
  return 10;
}

// how many abilities should a fruit of this tier have (excluding any seasonal ability)
function getNumFruitAbilities(tier) {
  var num_abilities = 1;
  if(tier >= 1) num_abilities = 2;
  if(tier >= 3) num_abilities = 3;
  if(tier >= 5) num_abilities = 4;
  if(tier >= 7) num_abilities = 5;
  if(tier >= 9) num_abilities = 6;
  return num_abilities;
}

// whether a fruit reached max charge of all skills, and is seasonal, and cannot be used anymore for fusing
// the reason is: otherwise you could keep using the fruit to fuse forever, transfering its abilities to seasonal fruit of choice permanently
function fruitReachedFuseMax(f) {
  if(f.type == 0) return false; // only seasonal fruits can have reached max
  // last charge is the seasonal ability, that one is not checked as it never increases
  for(var i = 0; i + 1 < f.charge.length; i++) {
    if(f.charge[i] < 2) return false;
  }
  return true;
}

/*
Chooses the start_level of a fruit ability, based on the two start_levels of two matching abilities of the two input fruits
*/
function fuseFruitStartLevel(a, b) {
  var min = Math.min(a, b);
  var max = Math.max(a, b);
  return Math.ceil(min * 0.75 + max * 0.25);
}

// TODO: this is the same as isInherentAbility and FRUIT_NONE, use that instead
var fuse_skip = {};
fuse_skip[FRUIT_NONE] = true;
fuse_skip[FRUIT_SPRING] = true;
fuse_skip[FRUIT_SUMMER] = true;
fuse_skip[FRUIT_AUTUMN] = true;
fuse_skip[FRUIT_WINTER] = true;
fuse_skip[FRUIT_SPRING_SUMMER] = true;
fuse_skip[FRUIT_SUMMER_AUTUMN] = true;
fuse_skip[FRUIT_AUTUMN_WINTER] = true;
fuse_skip[FRUIT_WINTER_SPRING] = true;
fuse_skip[FRUIT_ALL_SEASON] = true;
fuse_skip[FRUIT_ALL_SEASON2] = true;


// automatically purchases ability levels in fruit c, given what the levels were in fruit a and b
function fuseFruitAutoLevel(a, b, c) {
  var map = {};
  for(var i = 0; i < a.abilities.length; i++) {
    if(fuse_skip[a.abilities[i]]) continue;
    map[a.abilities[i]] = a.levels[i];
  }
  for(var i = 0; i < b.abilities.length; i++) {
    if(fuse_skip[b.abilities[i]]) continue;
    if(map[b.abilities[i]]) map[b.abilities[i]] = Math.max(map[b.abilities[i]], b.levels[i]);
    else map[b.abilities[i]] = b.levels[i];
  }

  // how much max to spend
  var ess = Num.max(a.essence, b.essence);

  var n = getNumFruitAbilities(c.tier);

  // how much max to spend per slot, to allow to use some essence on slots with a new ability
  var avail = [];
  for(var i = 0; i < n; i++) avail[i] = ess.divr(n);

  // avail is allowed to overshoot, but avail_total not.
  var avail_total = Num(ess);

  var maxlevels = [];
  for(var i = 0; i < n; i++) maxlevels[i] = map[c.abilities[i]];

  for(;;) {
    var done_something = false;
    for(var i = 0; i < n; i++) {
      var level = c.levels[i];
      if(avail[i].lter(0) || level >= maxlevels[i]) continue;
      var cost = getFruitAbilityCost(c.abilities[i], level, c.tier).essence;
      if(cost.gt(avail_total)) continue;

      c.levels[i]++;
      c.essence.addInPlace(cost);
      avail_total.subInPlace(cost);
      avail[i].subInPlace(cost); // this one can become negative, but overshooting for this is allowed, to avoid case where levels very gradually drop
      done_something = true;
    }
    if(!done_something) break;
  }
}

// whether this fruit's seasonal type fully contains the given type
function fruitContainsSeasonalType(fruit, type) {
  if(fruit.type == type) return true;
  if(fruit.type == 9 || fruit.type == 10) return true;
  if(fruit.type == 5) return (type == 1 || type == 2);
  if(fruit.type == 6) return (type == 2 || type == 3);
  if(fruit.type == 7) return (type == 3 || type == 4);
  if(fruit.type == 8) return (type == 4 || type == 1);
  return false;
}

// a and b are season types of 2 fruits (0=apple, etc...)
// fruitmix: state of the season-mix squirrel upgrades: 2: allow forming the 2-season fruits, 4: allow forming the 4-season fruits, 5: allow forming the dragon fruit
function fruitSeasonMix(a, b, fruitmix) {
  if(a == b) return a;

  /*
  Mixing rules, assuming fruitmix = 5 (for lower fruit mix, depending on how low, dragon fruit, star fruit (4-season), or 2-season fruits can't be formed and become apple or other lower fruit instead. The other rules stay the same)
  same types stay the same (apple+apple gives apple, summer+summer gives summer, dragon+dragon gives dragon, etc...)
  1-season fruit with 1-season fruit can give 2-season fruit if from neighboring season, apple otherwise (summer+winter or autumn+spring give apple due to not being neighboring seasons)
  2-season fruit with 1-season fruit will keep 2-season fruit if the 1-season fruit is part of it, or drop down to apple if they are disjoint
  2-season fruit with 2-season fruit gives star fruit (4-seaon fruit) if all 4 seasons are included in the two 2-season fruits, the one common 1-season fruit otherwise. NOTE: requires all abilities the same to get the star fruit, that restriction is enforced elsewhere
  star fruit with apple gives dragon fruit. NOTE: requires all abilities the same to get the dragon fruit, that restriction is enforced elsewhere
  mixing star fruit with other fruits results in the lowest fruit type of the two
  mixing dragon fruit with other fruits results in the lowest fruit type of the two
  */

  if(fruitmix >= 2) {
    if((a == 1 && b == 2) || (a == 2 && b == 1)) return 5; // mango
    if((a == 2 && b == 3) || (a == 3 && b == 2)) return 6; // plum
    if((a == 3 && b == 4) || (a == 4 && b == 3)) return 7; // quince
    if((a == 4 && b == 1) || (a == 1 && b == 4)) return 8; // kumquat
  }
  if(fruitmix >= 4) {
    if((a == 5 && b == 7) || (a == 7 && b == 5)) return 9; // star fruit
    if((a == 6 && b == 8) || (a == 8 && b == 6)) return 9; // star fruit
  }
  if(fruitmix >= 5) {
    if((a == 0 && b == 9) || (a == 9 && b == 0)) return 10; // dragon fruit
  }

  var highest = Math.max(a, b); // could become up to 9 (star fruit) or 10 (dragon fruit)

  if(highest == 9 || highest == 10) {
    // dragon fruit or star fruit
    return Math.min(a, b);
  }

  var a2 = 0; // flags: 1=spring, 2=summer, 4=autumn, 8=winter
  if(a >= 1 && a <= 4) a2 = (1 << (a - 1));
  else if(a >= 5 && a <= 7) a2 = (3 << (a - 5));
  else if(a == 8) a2 = 9;
  else if(a == 9 || a == 10) a2 = 15;

  var b2 = 0; // flags: 1=spring, 2=summer, 4=autumn, 8=winter
  if(b >= 1 && b <= 4) b2 = (1 << (b - 1));
  else if(b >= 5 && b <= 7) b2 = (3 << (b - 5));
  else if(b == 8) b2 = 9;
  else if(b == 9 || b == 10) b2 = 15;

  // allow to keep 2-season fruits when fused with a contained 1-season fruit
  if((a2 == 3 || b2 == 3) && ((a2 | b2) == 3) && ((a2 & b2) != 0)) return 5; // mango
  if((a2 == 6 || b2 == 6) && ((a2 | b2) == 6) && ((a2 & b2) != 0)) return 6; // plum
  if((a2 == 12 || b2 == 12) && ((a2 | b2) == 12) && ((a2 & b2) != 0)) return 7; // quince
  if((a2 == 9 || b2 == 9) && ((a2 | b2) == 9) && ((a2 & b2) != 0)) return 8; // kumquat

  // the type when going down: still keeps for example winter if both a and b support winter (e.g. star fruit + quince, or quince + medlar)
  var c2 = a2 & b2;

  // some of these are only allowed if fruitmix large enough, but those checks are elsewhere
  if(c2 == 15) return highest; // star fruit or dragon fruit
  else if((c2 & 3) == 3) return 5; // mango
  else if((c2 & 6) == 6) return 6; // plum
  else if((c2 & 12) == 12) return 7; // quince
  else if((c2 & 9) == 9) return 8; // kumquat
  else if(c2 == 1) return 1;
  else if(c2 == 2) return 2;
  else if(c2 == 4) return 3;
  else if(c2 == 8) return 4;

  return 0;
}

function fruitsHaveSameAbilities(a, b) {
  var na = a.abilities.length;
  var nb = b.abilities.length;
  var sameabilities = true;
  var ma = {};
  var mb = {};
  for(var i = 0; i < na; i++) {
    if(fuse_skip[a.abilities[i]]) continue;
    ma[a.abilities[i]] = true;
  }
  for(var i = 0; i < nb; i++) {
    if(fuse_skip[b.abilities[i]]) continue;
    if(!ma[b.abilities[i]]) {
      sameabilities = false;
      break;
    }
    mb[b.abilities[i]] = true;
  }
  for(var i = 0; i < na; i++) {
    if(fuse_skip[a.abilities[i]]) continue;
    if(!mb[a.abilities[i]]) {
      sameabilities = false;
      break;
    }
  }
  return sameabilities;
}

// In fuseFruit, sometimes abilities don't line up, e.g. both original and fused fruit result have "bee boost", but they won't be on the same line.
// It is easier to see what the effect of the fuse is if matching abilities match, so this reorders them if needed.
// orig is the "into" fruit
// NOTE: only affects the charge and abilities arrays, not levels or starting levels! Must be used before setting those but after already setting charge and abilities.
// TODO: instead make the code in fuseFruit not cause the badly-ordered abilities if possible, to avoid the need for this
function fuseFruitMatchOrder(f, orig) {
  var ma = {};
  var mb = {};
  for(var i = 0; i < orig.abilities.length; i++) {
    ma[orig.abilities[i]] = i;
  }
  var known = [];
  var unk = [];
  var ok = true;
  for(var i = 0; i < f.abilities.length; i++) {
    mb[f.abilities[i]] = i;
    if(ma[f.abilities[i]] != undefined) {
      if(orig.abilities[i] != f.abilities[i]) ok = false;
    } else {
      unk.push(i);
    }
  }
  if(ok) return; // nothing to do, skip the rest

  for(var i = 0; i < orig.abilities.length; i++) {
    if(mb[orig.abilities[i]] != undefined) {
      known.push(mb[orig.abilities[i]]);
    }
  }

  var known_index = 0;
  var unk_index = 0;
  var arr = [];
  for(var i = 0; i < f.abilities.length; i++) {
    var a = f.abilities[i];
    if(ma[a] != undefined) {
      arr[i] = known[known_index++];
    } else {
      arr[i] = unk[unk_index++];
    }
  }
  for(var i = 0; i < arr.length; i++) {
    var j = arr[i];
    arr[i] = [f.abilities[j], f.charge[j]];
  }
  for(var i = 0; i < arr.length; i++) {
    f.abilities[i] = arr[i][0];
    f.charge[i] = arr[i][1];
  }
}

// fuses from fruit b into a
// a: the "into" fruit
// b: the "from" fruit
// fruitmix: state of the season-mix squirrel upgrades: 2: allow forming the 2-season fruits, 4: allow forming the 4-season fruit, 5: allow forming the dragon fruit
// transfer_choices: array of bools which, if false, indicate you do NOT want to transfer this **-ability from fruit b into fruit a
// keep_choices: array of bools which, if true, indicate you don't want this ability pushed out by transferred abilities. This only enforces priority, it doesn't change the amount of abilities being pushed out. If all booleans are true or all booleans are false, fruit a's ability order is used (last ones pushed out first). If there is a mix of true and false, those that are false will be pushed out first.
// opt_message: an output array with in it [messate string, severity]. The message string may be set to a message if there's a reason why fusing can't work or a warning, and severity is 0 for warning, 1 for error (fusing can't work), this determines the color it's rendered with
function fuseFruit(a, b, fruitmix, transfer_choices, keep_choices, opt_message) {
  if(!a || !b) return null;
  if(a == b) return null;
  if(a.tier != b.tier) return null;

  var n = getNumFruitAbilities(a.tier);
  var na = a.abilities.length;
  var nb = b.abilities.length;

  var seasonmix_result = fruitSeasonMix(a.type, b.type, fruitmix);

  if((a.type == 9) != (b.type == 9)) { // exactly one is a star fruit
    var with_apple = a.type == 0 || b.type == 0;
    if(with_apple && fruitmix < 5) {
      if(opt_message) {
        opt_message[0] = 'You need another squirrel upgrade before you can fuse star fruit with apple, and the apple must have the same set of abilities.';
        opt_message[1] = 1;
      }
      return null;
    }
  }
  if(seasonmix_result == 10 && a.type < 10 && b.type < 10) { // made dragon fruit from lower fruit types (star fruit + apple)
    var sameabilities = fruitsHaveSameAbilities(a, b);
    if(!sameabilities) {
      seasonmix_result = 0;
      if(opt_message) {
        opt_message[0] = 'You could get a legendary dragon fruit out of these fruit types, but only if they have the same abilities. Fuse a star fruit with an apple with the same set of abilities to get a dragon fruit.';
        opt_message[1] = 1;
      }
      return null;
    } else {
      if(opt_message) {
        opt_message[0] = 'You fused a legendary dragon fruit! Beware, dragon fruits can only be fused with other dragon fruits, not with any other fruit types.';
        opt_message[1] = 0;
      }
    }
  }
  if(seasonmix_result == 9 && a.type < 9 && b.type < 9) { // made star fruit from lower fruit types (two 2-seasonals)
    var sameabilities = fruitsHaveSameAbilities(a, b);
    if(!sameabilities) {
      seasonmix_result = 0;
      if(opt_message) {
        opt_message[0] = 'You could get a 4-season star fruit out of these fruit types, but only if they have the same abilities. Fuse two complementing two-seasonal fruits with the same set of abilities to get a star fruit.';
        opt_message[1] = 1;
      }
      return null;
    } else {
      if(opt_message) {
        opt_message[0] = 'You fused a 4-season star fruit! Beware, star fruits can only be fused with other star fruits, or, after you have a certain squirrel ability, with apples.';
        opt_message[1] = 0;
      }
    }
  }

  var f = new Fruit();
  f.tier = a.tier;

  // the result becomes an apple (or, if having squirrel upgrade, more advanced types) if input types are mixed, or the exact type if they're the same
  f.type = (a.type == b.type) ? a.type : seasonmix_result;

  // the seasonal ability
  if(f.type >= 1) {
    f.abilities[n] = FRUIT_SPRING + f.type - 1; // we can do this because the fruit ability ordering is the same as the fruit type ordering, and f.type==1 matches FRUIT_SPRING
    if(f.type >= 1 && f.type <= 4) {
      f.levels[n] = a.levels[n];
      f.starting_levels[n] = a.starting_levels[n];
      f.charge[n] = a.charge[n];
    } else if(f.type > 4) {
      f.levels[n] = a.levels[n];
      f.starting_levels[n] = a.starting_levels[n];
      f.charge[n] = a.charge[n];
    }
  }

  f.fuses = a.fuses + b.fuses + 1;

  f.name = a.name || b.name;
  f.mark = a.mark || b.mark;

  var arr;

  var m = {}; // starting levels of all possible resulting fruit abilities

  var ma = {};
  for(var i = 0; i < na; i++) {
    if(fuse_skip[a.abilities[i]]) continue;
    ma[a.abilities[i]] = [i, a.charge[i]];
    m[a.abilities[i]] = a.starting_levels[i];
  }

  var mb = {};
  for(var i = 0; i < nb; i++) {
    if(fuse_skip[b.abilities[i]]) continue;
    mb[b.abilities[i]] = [i, b.charge[i]];
    m[b.abilities[i]] = (m[b.abilities[i]] == undefined) ? b.starting_levels[i] : (fuseFruitStartLevel(m[b.abilities[i]], b.starting_levels[i]));
  }

  for(var i = 0; i < n; i++) {
    f.abilities[i] = a.abilities[i];
    f.charge[i] = a.charge[i];
  }


  // charge up duplicate abilities

  for(var i = 0; i < n; i++) {
    var ability = f.abilities[i];
    if(fuse_skip[ability]) continue;
    if(mb[ability] == undefined) continue; // not duplicate

    var charge = ma[ability][1] + mb[ability][1] + 1;
    if(charge > 2) charge = 2;
    f.charge[i] = charge;
  }


  // transfer transferable abilities

  var cloned = false; // to prevent modifying input object.

  var num_transfer = 0;
  for(var i = 0; i < nb; i++) {
    if(b.charge[i] != 2) continue;
    if(!transfer_choices[i]) continue;
    if(ma[b.abilities[i]] != undefined) {
      if(!cloned) keep_choices = util.clone(keep_choices);
      keep_choices[ma[b.abilities[i]][0]] = true; // ability is in both a and b, to enforce keeping it, use "keep_choices" instead
      continue; // already present in a, so not a newly transferred ability; do not increase num_transfer in this case, or ability duplication is possible
    }
    num_transfer++;
  }

  arr = [];
  // add the kept original abilities of a to the array (but from f, where the new charge is now stored), ensuring to prioritize the chosen ones to keep
  var num_priority = 0;
  for(var i = 0; i < n; i++) {
    if(keep_choices[i]) num_priority++;
  }
  var num_fixed = Math.max(0, n - num_priority - num_transfer); // the ones that, despite not having priority, can still go to the front anyway, to keep original order more closely
  for(var i = 0; i < num_fixed; i++) {
    if(arr.length >= n - num_transfer) break;
    arr.push([f.abilities[i], f.charge[i]]);
  }
  for(var i = num_fixed; i < n; i++) {
    if(arr.length >= n - num_transfer) break;
    if(keep_choices[i]) arr.push([f.abilities[i], f.charge[i]]);
  }
  for(var i = num_fixed; i < n - num_transfer; i++) {
    if(arr.length >= n - num_transfer) break;
    if(!keep_choices[i]) arr.push([f.abilities[i], f.charge[i]]);
  }
  // add transferred abilities of b to the array
  for(var i = 0; i < nb; i++) {
    if(b.charge[i] != 2) continue;
    if(!transfer_choices[i]) continue;
    if(ma[b.abilities[i]] != undefined) continue; // already present in a, so not a newly transferred ability
    arr.push([b.abilities[i], 2]);
  }
  for(var i = 0; i < arr.length; i++) {
    if(i >= n) break;
    f.abilities[i] = arr[i][0];
    f.charge[i] = arr[i][1];
  }
  fuseFruitMatchOrder(f, a);


  // set up starting levels
  for(var i = 0; i < n; i++) {
    var level = m[f.abilities[i]];
    f.levels[i] = level;
    f.starting_levels[i] = level;
  }


  fuseFruitAutoLevel(a, b, f);

  return f;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


var min_transcension_level = 10;

var treeboost = Num(0.05); // additive production boost per tree level

function getTreeBoostFor(treelevel, upgrade2level, only_for_ethereal_upgrade_display) {
  var result = Num(treeboost);

  var basic = basicChallenge();

  if(!basic || only_for_ethereal_upgrade_display) {
    var n = upgrade2level;
    n = Math.pow(n, treeboost_exponent_2);
    result.addInPlace(upgrade2_basic_tree_bonus.mulr(n));
  }

  var l = treelevel;
  l = Math.pow(l, treeboost_exponent_1);
  result.mulrInPlace(l);

  if(basic != 2 && !only_for_ethereal_upgrade_display) {
    // fruit ability
    var level = getFruitAbility(FRUIT_TREELEVEL, true);
    if(level > 0) {
      var mul = getFruitBoost(FRUIT_TREELEVEL, level, getFruitTier(true)).addr(1);
      result.mulInPlace(mul);
    }
  }

  return result;
}

function getTreeBoost() {
  return getTreeBoostFor(state.treelevel, state.upgrades2[upgrade2_basic_tree].count, false);
}

// this is tuned so that from fruit_drop_level to fruit_drop_level + 20 (115 to 135 for sapphire fruit), a scaling where it's worse than FRUIT_BEEBOOST to getting significantly better than FRUIT_BEEBOOST occurs, with it being equal somewhere before the mid point
function treeLevelFruitBoostCurve(tree_level, fruit_drop_level, next_fruit_drop_level) {
  var level0 = fruit_drop_level;
  var level_diff = next_fruit_drop_level - fruit_drop_level;
  var level1 = level0 + Math.floor(level_diff * 0.37); // level at which it's made to match bee
  var level2 = next_fruit_drop_level; // soft-capped end of the range
  var t = (tree_level - level1) / (level2 - level0);
  var s = towards1(t, 0.5) + 1;
  return s;
}

// returns the boost given by the FRUIT_TREELEVEL fruit
// opt_target: if true, gives the final target level, as if tree_level is infinity
function treeLevelFruitBoost(fruit_tier, ability_level, tree_level, opt_target) {
  // for amethyst fruit (which drops as highest tier from 115 to 135) fruit_drop_level should be 115, for sapphire it should be 135, etc...
  var fruit_drop_level;
  var next_fruit_drop_level;
  // this must match tree levels where this fruit tier gets introduced in getNewFruitTier, starting from tier 7 (amethyst)
  if(fruit_tier <= 7) {
    fruit_drop_level = 115;
    next_fruit_drop_level = 135;
  } else if(fruit_tier == 8) {
    fruit_drop_level = 135;
    next_fruit_drop_level = 160;
  } else if(fruit_tier == 9)  {
    fruit_drop_level = 160;
    next_fruit_drop_level = 190;
  } else {
    // TODO: update as the fruits get actually designed and their levels chosen
    // it's correct for ruby (tier 10)
    fruit_drop_level = 160 + (fruit_tier - 9) * 30;
    next_fruit_drop_level = fruit_drop_level + 30;
  }
  // the tree level boost uses the bee boost's value as basis
  var boost = getFruitBoost(FRUIT_BEEBOOST, ability_level, fruit_tier);
  // For amethyst fruits: relevant tree levels where multiplier applies are from 115-135 and that's where the boost value is computed
  // to be in similar range as that for fruit berry boost etc... at input level 135, but it is soft capped after that
  // TODO: also support lower fruit tier, for e.g. basic challenge
  var s = treeLevelFruitBoostCurve(opt_target ? next_fruit_drop_level : tree_level, fruit_drop_level, next_fruit_drop_level);
  return boost.mulr(s);
}

// in case of more spores than tree level requires, wait at least this time at that level anyway
var tree_min_leveltime = 0.5;

// outputs the minimum spores required (sporesreq) for the tree to go to the given level
function treeLevelReqBase(level) {
  var res = new Res();
  if(level < 150) {
    res.spores = Num.rpow(9, Num(level - 1)).mulr(6.666666);
  } else {
    var pre = Num.rpow(9, Num(149 - 1)).mulr(6.666666);
    var post = Num.rpow(18, Num(level - 149));
    res.spores = pre.mul(post);
  }
  return res;
}

// for tree spores requirement
function getMistletoeLeech() {
  if(state.mistletoes <= 1) return Num(1); // the first mistletoe doesn't affect leveling spores requirement
  return Num((state.mistletoes - 1) * 0.5 + 1);
}

// including effects like mistletoe
function treeLevelReq(level) {
  var res = treeLevelReqBase(level);
  res.mulInPlace(getMistletoeLeech());
  return res;
}

// returns an index in the tree_images array for the given tree level
// several levels reuse the same image (and string name in there), so the result will
// be an index that is <= level, and also always < tree_images.length
// NOTE: must be such that at 10, the first time the name "adult tree" is used to fit the storyline
function treeLevelIndex(level) {
  var result = 0;
  if(!level || level < 0) return 0;
  // 0-9: one image for each level
  if(level < 10) result = level;
  // 10-45: one image per 5 levels
  else if(level < 50) result = 10 + Math.floor((level - 10) / 5);
  //50-...: 1 image per 10 levels
  else result = 18 + Math.floor((level - 50) / 10);
  if(result >= tree_images.length) result = tree_images.length - 1;
  return result;
}


var mistletoe_resin_malus = Num(0.15);

var treelevel2_resin_bonus = Num(0.05);

// amount with bonuses etc..., that you get to go to this level
// see also the function: getUpcomingResin
function treeLevelResin(level, breakdown) {
  if(level <= 0) return Num(0);

  var base = resin_base;
  if(state.upgrades2[upgrade2_resin_extraction].count) base = resin_base_resin_extraction;
  var resin;
  if(state.upgrades2[upgrade2_resin_siphoning].count && level >= resin_siphoning_level) {
    resin = Num.rpow(base, Num(resin_siphoning_level - 2))
    base = resin_base_resin_siphoning;
    resin.mulInPlace(Num(base).powr(level - resin_siphoning_level + 1));
    resin = resin.mulr(resin_global_mul).addr(resin_global_add);
  } else {
    resin = Num.rpow(base, Num(level - 1)).mulr(resin_global_mul).addr(resin_global_add);
  }
  if(level > 16) resin.addrInPlace(resin_global_quad * (level - 16));

  if(breakdown) breakdown.push(['base (per tree level roughly x' + base + ')', true, Num(0), resin.clone()]);

  var season = getSeason();
  if(season == 3) {
    var bonus = getWinterTreeResinBonus();
    resin.mulInPlace(bonus);
    if(breakdown) breakdown.push(['winter bonus', true, bonus, resin.clone()]);
  } else if(season != 0) {
    var bonus = getAlternateResinBonus(season);
    if(bonus.gtr(1)) {
      resin.mulInPlace(bonus);
      if(breakdown) breakdown.push([seasonNames[season] + ' bonus (ethereal upgrade)', true, bonus, resin.clone()]);
    }
  }

  var count = state.upgrades2[upgrade2_resin].count;
  if(count) {
    var bonus = upgrade2_resin_bonus.mulr(count).addr(1);
    resin.mulInPlace(bonus);
    if(breakdown) breakdown.push(['ethereal upgrades', true, bonus, resin.clone()]);
  }

  var count = state.squirrel_upgrades[upgradesq_resin].count;
  if(count) {
    var bonus = upgradesq_resin_bonus.mulr(count).addr(1);
    resin.mulInPlace(bonus);
    if(breakdown) breakdown.push(['squirrel upgrades', true, bonus, resin.clone()]);
  }

  if(state.treelevel2) {
    var bonus = treelevel2_resin_bonus.mulr(state.treelevel2).addr(1);
    resin.mulInPlace(bonus);
    if(breakdown) breakdown.push(['ethereal tree level', true, bonus, resin.clone()]);
  }

  // resin choice upgrade
  if(state.upgrades[resin_choice0].count == 1) {
    var mul = Num(resin_choice0_resin_bonus + 1);
    resin.mulInPlace(mul);
    if(breakdown) breakdown.push(['resin choice: resin', true, mul, resin.clone()]);
  }

  // tree's gesture ethereal upgrade
  var gesture = treeGestureBonus();
  if(gesture.neqr(1)) {
    resin.mulInPlace(gesture);
    if(breakdown) breakdown.push(['tree\'s gesture', true, gesture, resin.clone()]);
  }

  // ethereal mistletoe
  if(haveEtherealMistletoeUpgrade(mistle_upgrade_resin)) {
    var mul = getEtherealMistletoeBonus(mistle_upgrade_resin).addr(1);
    resin.mulInPlace(mul);
    if(breakdown) breakdown.push(['ethereal mistletoe', true, mul, resin.clone()]);
  }

  // infinity ascension
  if(state.infinity_ascend) {
    var mul = infinity_ascension_resin_bonus.addr(1);
    resin.mulInPlace(mul);
    if(breakdown) breakdown.push(['infinity ascension', true, mul, resin.clone()]);
  }

  // fishes
  if(state.fishtypecount[FISHTYPE_TANG] || state.fish_resinmul_weighted.neqr(1)) {
    var mul = getFishMultiplier(FISHTYPE_TANG, state, 3);
    if(mul.neqr(1)) { // even if weighted has a value, mul may be 1 (= 0 bonus) due to having none of this fish after long time window this run
      var umul = getFishMultiplier(FISHTYPE_TANG, state, 0);
      resin.mulInPlace(mul);
      // if it says "time weighted", it means the amount of tang in the pond was not always the same during this run, so a time-weighted average is taken (to prevent fish-swapping techniques like getting the fish only briefly during resin gain)
      if(breakdown) breakdown.push([umul.eq(mul) ? 'tang (fish)' : 'tang fish (time-weighted)', true, mul, resin.clone()]);
    }
  }

  // challenges
  if(state.challenge_multiplier_resin_twigs.neqr(1)) {
    var mul = state.challenge_multiplier_resin_twigs;
    resin.mulInPlace(mul);
    if(breakdown) breakdown.push(['challenge highest levels', true, mul, resin.clone()]);
  }

  count = state.mistletoes;
  if(count > 1) {
    var malus = Num(1).sub(mistletoe_resin_malus).powr(count - 1); // the first mistletoe doesn't affect resin income
    resin.mulInPlace(malus);
    if(breakdown) breakdown.push(['mistletoe malus (' + count + ')', true, malus, resin.clone()]);
  }

  if(state.resinfruitspores.gtr(0)) {
    var ratio = state.resinfruitspores.div(state.fruitspores_total);
    if(!ratio.isNaNOrInfinity() && ratio.gter(0)) {
      var mul = ratio.addr(1);
      resin.mulInPlace(mul);
      if(breakdown) breakdown.push(['fruit resin boost', true, mul, resin.clone()]);
    }
  }

  return resin;
}

function currentTreeLevelResin(breakdown) {
  return treeLevelResin(state.treelevel, breakdown);
}

function nextTreeLevelResin(breakdown) {
  return treeLevelResin(state.treelevel + 1, breakdown);
}

// max time window for the weighed fish/runestone calculations for bonuses from pond and infinity field to basic field
// that is, once the run is longer than this, the weighed time is no longer computed over the whole run, but over this past time window
var MAXINFTOBASICDELAY = 3600 * 3;

var timeweightedinfo = '(the bonus is decreased if the fish is only present for part of the time during a run, time-weighted in a max ' + util.formatDuration(MAXINFTOBASICDELAY) + ' time window)';


// Gets the total multiplier of fish effect for all placed fishes of the type (all tiers).
// If you have none of this fish, it returns a multiplier of 1.
// timeweighted: only used for a few time-weighted fishes:
// if 0, computes the formula according to the fish currently there. Use this to compute what the actual underlying value is, which is the basis for the time-weighted computations
// if 1, takes into account time length during which the fishes were there. Use this when computing time-weighted value (weighted average in last MAXINFTOBASICDELAY time) to update state (but not for the actual gameplay)
// if 2, similar to 1 but also takes reduced penalty with time shift into account, so it's like the weighed average but sometimes improved
// if 3, returns the minimum of the computation for timeweighted==0 and timeweighted==1, for actual current gameplay computation
function getFishMultiplier(fishtype, state, timeweighted) { // aka getFishBonus
  if(timeweighted == 3) {
    return Num.min(getFishMultiplier(fishtype, state, 0), getFishMultiplier(fishtype, state, 2));
  }
  if(fishtype == FISHTYPE_GOLDFISH) {
    // infinity seeds bonus
    var num0 = state.fishcount[goldfish_0];
    var num1 = state.fishcount[goldfish_1];
    var num2 = state.fishcount[goldfish_2];
    var num3 = state.fishcount[goldfish_3];
    return new Num(1 + goldfish_0_bonus * num0 + goldfish_1_bonus * num1 + goldfish_2_bonus * num2 + goldfish_3_bonus * num3);
  } else if(fishtype == FISHTYPE_KOI) {
    // runestone multiplier
    var num0 = state.fishcount[koi_0];
    var num1 = state.fishcount[koi_1];
    return new Num(1 + koi_0_bonus * num0 + koi_1_bonus * num1);
  } else if(fishtype == FISHTYPE_OCTOPUS) {
    // infinity spores bonus
    var num0 = state.fishcount[octopus_0];
    var num1 = state.fishcount[octopus_1];
    var num2 = state.fishcount[octopus_2];
    return new Num(1 + octopus_0_bonus * num0 + octopus_1_bonus * num1 + octopus_2_bonus * num2);
  } else if(fishtype == FISHTYPE_SHRIMP) {
    var num0 = state.fishcount[shrimp_0];
    var num1 = state.fishcount[shrimp_1];
    return new Num(1 + shrimp_0_bonus * num0 + shrimp_1_bonus * num1);
  } else if(fishtype == FISHTYPE_ANEMONE) {
    // infinity flower bonus
    var num0 = state.fishcount[anemone_0];
    var num1 = state.fishcount[anemone_1];
    var num2 = state.fishcount[anemone_2];
    return new Num(1 + anemone_0_bonus * num0 + anemone_1_bonus * num1 + anemone_2_bonus * num2);
  } else if(fishtype == FISHTYPE_PUFFER) {
    // infinity berry bonus
    var num0 = state.fishcount[puffer_0];
    var num1 = state.fishcount[puffer_1];
    var num2 = state.fishcount[puffer_2];
    return new Num(1 + puffer_0_bonus * num0 + puffer_1_bonus * num1 + puffer_2_bonus * num2);
  } else if(fishtype == FISHTYPE_EEL) {
    if(timeweighted == 0) {
      var num0 = state.fishcount[eel_0];
      var num1 = state.fishcount[eel_1];
      var num2 = state.fishcount[eel_2];
      var numt = state.fishcount[eel_t];
      return new Num(1 + eel_0_bonus * num0 + eel_1_bonus * num1 + eel_2_bonus * num2 + eel_t_bonus * numt);
    } else {
      if(state.fish_twigsmul_weighted.ltr(1)) return new Num(1); // not yet properly inited
      var shift = (timeweighted == 2) ? state.fish_twigsmul_time_shift : 0;
      var deltatime = Math.min(MAXINFTOBASICDELAY, state.c_runtime - state.fish_twigsmul_time + shift); // most recent timespan, during which 'last' is active
      var deltatime2 = MAXINFTOBASICDELAY - deltatime; // timespan before that, during which 'timeweighted' was active
      return state.fish_twigsmul_weighted.mulr(deltatime2).add(state.fish_twigsmul_last.mulr(deltatime)).divr(deltatime + deltatime2);
    }
  } else if(fishtype == FISHTYPE_TANG) {
    if(timeweighted == 0) {
      var num0 = state.fishcount[tang_0];
      var num1 = state.fishcount[tang_1];
      var num2 = state.fishcount[tang_2];
      var numt = state.fishcount[tang_t];
      return new Num(1 + tang_0_bonus * num0 + tang_1_bonus * num1 + tang_2_bonus * num2 + tang_t_bonus * numt);
    } else {
      if(state.fish_resinmul_weighted.ltr(1)) return new Num(1); // not yet properly inited
      var shift = (timeweighted == 2) ? state.fish_resinmul_time_shift : 0;
      var deltatime = Math.min(MAXINFTOBASICDELAY, state.c_runtime - state.fish_resinmul_time + shift); // most recent timespan, during which 'last' is active
      var deltatime2 = MAXINFTOBASICDELAY - deltatime; // timespan before that, during which 'timeweighted' was active
      return state.fish_resinmul_weighted.mulr(deltatime2).add(state.fish_resinmul_last.mulr(deltatime)).divr(deltatime + deltatime2);
    }
  } else if(fishtype == FISHTYPE_LEPORINUS) {
    // infinity bee bonus
    var num0 = state.fishcount[leporinus_0];
    var num1 = state.fishcount[leporinus_1];
    return new Num(1 + leporinus_0_bonus * num0 + leporinus_1_bonus * num1);
  } else if(fishtype == FISHTYPE_ORANDA) {
    // non-runestone multiplier
    var num0 = state.fishcount[oranda_0];
    var num1 = state.fishcount[oranda_1];
    var num2 = state.fishcount[oranda_2];
    if(num0 == 0 && num1 == 0 && num2 == 0) return new Num(1);

    // v--- temporary hack: Since v0.15.0 (20250102), there's a limit of max 4 oranda (and max 1 black oranda, num2). Old saves can still have more. Instead of adding refund/removal logic, just limit the max amount here so that having more fishes in the pond is pointless and can be removed.
    if(num2 > 1) num2 = 1;
    if(num1 > 4 - num2) num1 = 4 - num2;
    if(num0 > 4 - (num1 + num2)) num0 = 4 - (num1 + num2);
    // ^--- end of temporary hack

    return new Num(1 + oranda_0_bonus * num0 + oranda_1_bonus * num1 + oranda_2_bonus * num2);
  } else if(fishtype == FISHTYPE_JELLYFISH) {
    // jellyfish pond neighbor bonus (not very large on purpose, just a nice to have during early post-ascend infinity field)
    var num0 = state.fishcount[jellyfish_t];
    if(num0 == 0) return new Num(1);
    return new Num(1 + jellyfish_t_bonus * num0);
  }

  return new Num(1);
}

// timeweighted: only used for time-weighted boost effect:
// if 0, computes the formula according to the infinity crops/fishes currently there. Use this to compute what the actual underlying value is, which is the basis for the time-weighted computations
// if 1, takes into account time length during which the infinity crops/fishes were there. Use this when computing time-weighted value (weighted average in last MAXINFTOBASICDELAY time) to update state (but not for the actual gameplay)
// if 2, similar to 1 but also takes reduced penalty with time shift into account, so it's like the weighed average but sometimes improved
// if 3, returns the minimum of the computation for timeweighted==0 and timeweighted==2, for actual current gameplay computation
// opt_precomputed: if given, is the value of computeInfinityToBasicBoost(0) to avoid computing it twice
// returns the value as boost, not as multiplier
function computeInfinityToBasicBoost(state, timeweighted, opt_precomputed) {
  if(timeweighted == 3) {
    return Num.min(computeInfinityToBasicBoost(state, 0), computeInfinityToBasicBoost(state, 2));
  }
  if(timeweighted == 0) {
    if(opt_precomputed != undefined) return opt_precomputed;
    var result = Num(0);
    for(var y = 0; y < state.numh3; y++) {
      for(var x = 0; x < state.numw3; x++) {
        var f = state.field3[y][x];
        if(f.hasCrop()) {
          var c = crops3[f.cropIndex()];
          result.addInPlace(c.getBasicBoost(f, undefined, true));
        }
      }
    }
    return result;
  } else {
    if(state.infinity_prodboost_weighted.ltr(0)) return new Num(0); // not yet properly inited
    var shift = (timeweighted == 2) ? state.infinity_prodboost_time_shift : 0;
    var deltatime = Math.min(MAXINFTOBASICDELAY, state.c_runtime - state.infinity_prodboost_time + shift); // most recent timespan, during which 'last' is active
    var deltatime2 = MAXINFTOBASICDELAY - deltatime; // timespan before that, during which 'timeweighted' was active
    return state.infinity_prodboost_weighted.mulr(deltatime2).add(state.infinity_prodboost_last.mulr(deltatime)).divr(deltatime + deltatime2);
  }
}

// Similar to computeInfinityToBasicBoost etc... above, but for infinity production itself
// This one is not actually used to delay infinity's production in any way, but is used to compute a weighed average of past infinity production that is used to maybe prevent the delay of computeInfinityToBasicBoost etc... in some cases
// The same convention of timeweighted as the above functions is implemented for consistency, however only values 0 and 1 are expected to be used.
function computeWeightedInfProd(state, timeweighted) {
  if(timeweighted == 3) {
    // This is not actually used, but left for consistency with the other functions like computeInfinityToBasicBoost.
    return Res.min(computeWeightedInfProd(state, 0), computeWeightedInfProd(state, 2));
  }
  if(timeweighted == 0) {
    return state.infprod;
  } else {
    if(state.infinity_infprod_weighted == undefined) return new Num(0); // not yet properly inited
    var deltatime = Math.min(MAXINFTOBASICDELAY, state.c_runtime - state.infinity_infprod_time); // most recent timespan, during which 'last' is active
    var deltatime2 = MAXINFTOBASICDELAY - deltatime; // timespan before that, during which 'timeweighted' was active
    return state.infinity_infprod_weighted.mulr(deltatime2).add(state.infinity_infprod_last.mulr(deltatime)).divr(deltatime + deltatime2);
  }
}

// get twig drop at tree going to this level from mistletoes
function treeLevelTwigs(level, breakdown) {
  if(level <= 0) return Res({twigs:0});

  var res = new Res();
  res.twigs = Num(twigs_global_mul);
  var base = twigs_base;
  if(state.upgrades2[upgrade2_twigs_extraction].count) base = twigs_base_twigs_extraction;
  if(state.upgrades2[upgrade2_twigs_siphoning].count && level >= twigs_siphoning_level) {
    res.twigs.mulInPlace(Num(base).powr(twigs_siphoning_level - 2));
    base = twigs_base_twigs_siphoning;
    res.twigs.mulInPlace(Num(base).powr(level - twigs_siphoning_level + 1));
  } else {
    res.twigs.mulInPlace(Num(base).powr(level - 1));
  }
  res.twigs.addrInPlace(twigs_global_add);
  if(level > 11) res.twigs.addrInPlace(twigs_global_quad * (level - 11));

  if(breakdown) breakdown.push(['base (per tree level roughly x' + base + ')', true, Num(0), res.clone()]);

  var multi = Num(Math.log2(state.mistletoes + 1));
  res.twigs.mulInPlace(multi);
  if(breakdown) {
    if(state.mistletoes == 1) {
      breakdown.push(['1 mistletoe (the minimum)', true, multi, res.clone()]);
    } else {
      breakdown.push(['#mistletoes (' + state.mistletoes + ')', true, multi, res.clone()]);
    }
  }

  if(getSeason() == 2) {
    var bonus = getAutumnMistletoeBonus();
    res.twigs.mulInPlace(bonus);
    if(breakdown) breakdown.push(['autumn bonus', true, bonus, res.clone()]);
  }

  var count = state.upgrades2[upgrade2_twigs].count;
  if(count) {
    var bonus = upgrade2_twigs_bonus.mulr(count).addr(1);
    res.twigs.mulInPlace(bonus);
    if(breakdown) breakdown.push(['ethereal upgrades', true, bonus, res.clone()]);
  }

  var count = state.squirrel_upgrades[upgradesq_twigs].count;
  if(count) {
    var bonus = upgradesq_twigs_bonus.mulr(count).addr(1);
    res.twigs.mulInPlace(bonus);
    if(breakdown) breakdown.push(['squirrel upgrades', true, bonus, res.clone()]);
  }

  // tree's gesture ethereal upgrade
  var gesture = treeGestureBonus();
  if(gesture.neqr(1)) {
    res.twigs.mulInPlace(gesture);
    if(breakdown) breakdown.push(['tree\'s gesture', true, gesture, res.clone()]);
  }

  // ethereal mistletoe
  if(haveEtherealMistletoeEffect(mistle_upgrade_twigs)) {
    var mul = getEtherealMistletoeBonus(mistle_upgrade_twigs).addr(1);
    res.twigs.mulInPlace(mul);
    if(breakdown) breakdown.push(['ethereal mistletoe', true, mul, res.clone()]);
  }

  // infinity ascension
  if(state.infinity_ascend) {
    var mul = infinity_ascension_twigs_bonus.addr(1);
    res.twigs.mulInPlace(mul);
    if(breakdown) breakdown.push(['infinity ascension', true, mul, res.clone()]);
  }

  // fishes
  if(state.fishtypecount[FISHTYPE_EEL] || state.fish_twigsmul_weighted.neqr(1)) {
    var mul = getFishMultiplier(FISHTYPE_EEL, state, 3);
    if(mul.neqr(1)) { // even if weighted has a value, mul may be 1 (= 0 bonus) due to having none of this fish after long time window this run
      var umul = getFishMultiplier(FISHTYPE_EEL, state, 0);
      res.twigs.mulInPlace(mul);
      // if it says "time weighted", it means the amount of eel in the pond was not always the same during this run, so a time-weighted average is taken (to prevent fish-swapping techniques like getting the fish only briefly during twigs gain)
      if(breakdown) breakdown.push([umul.eq(mul) ? 'eel' : 'eel (time-weighted)', true, mul, res.clone()]);
    }
  }

  // challenges
  if(state.challenge_multiplier_resin_twigs.neqr(1)) {
    var challenge_multiplier = state.challenge_multiplier_resin_twigs;
    res.twigs.mulInPlace(challenge_multiplier);
    if(breakdown) breakdown.push(['challenge highest levels', true, challenge_multiplier, res.clone()]);
  }

  if(state.twigsfruitspores.gtr(0)) {
    var ratio = state.twigsfruitspores.div(state.fruitspores_total);
    if(!ratio.isNaNOrInfinity() && ratio.gter(0)) {
      var mul = ratio.addr(1);
      res.twigs.mulInPlace(mul);
      if(breakdown) breakdown.push(['fruit twigs boost', true, mul, res.twigs.clone()]);
    }
  }

  return res;
}

// see also the function: getUpcomingTwigs
function nextTwigs(breakdown) {
  return treeLevelTwigs(state.treelevel + 1, breakdown);
}

function treeLevel2ReqBase(level) {
  var res = new Res();
  if(level < 20) {
    // all are powers of 12, in theory starting at 144, but to make the first ethereal tree levelup faster to reach, the first 2 are reduced (no powers, but still multiples, of 12). Reducing to 12 would be too little though.
    if(level == 1) res.twigs = Num(72);
    else if(level == 2) res.twigs = Num(1296);
    else res.twigs = Num.rpow(12, Num(level - 1)).mulr(144);
  } else {
    var req19 = 3.833759992447472640000e21;
    res.twigs = Num.rpow(24, Num(level - 19)).mulr(req19);
  }
  return res;
}

// including effects, if any
function treeLevel2Req(level) {
  var res = treeLevel2ReqBase(level);
  return res;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// NOTE: ensure to start with a bit more than needed for first plant, numerical precision in plant cost computation could make it cost 10.000001 instead of 10
var initial_starter_seeds = 10.00001;

// opt_add_type and opt_sub_type: when adding or removing one of that type
function getStarterResources(opt_add_type, opt_sub_type) {
  var res = new Res();

  var count;
  res.seeds = Num(initial_starter_seeds);

  if(state.challenge == challenge_towerdefense) res.seeds = Num(Math.max(initial_starter_seeds, 10000000)); // enough to plant some mushrooms to bootstrap in case no ethereal fern

  if(basicChallenge()) return res; // ethereal ferns don't count during a basic challenge

  count = state.crop2count[fern2_0];
  if(opt_add_type == fern2_0) count++;
  if(opt_sub_type == fern2_0) count--;
  res.seeds.addrInPlace(count * count * count * 1000);

  count = state.crop2count[fern2_1];
  if(opt_add_type == fern2_1) count++;
  if(opt_sub_type == fern2_1) count--;
  res.seeds.addrInPlace(count * count * count * 100000);

  count = state.crop2count[fern2_2];
  if(opt_add_type == fern2_2) count++;
  if(opt_sub_type == fern2_2) count--;
  res.seeds.addrInPlace(count * count * count * 10000000);

  count = state.crop2count[fern2_3];
  if(opt_add_type == fern2_3) count++;
  if(opt_sub_type == fern2_3) count--;
  res.seeds.addrInPlace(count * count * count * 1000000000);

  count = state.crop2count[fern2_4];
  if(opt_add_type == fern2_4) count++;
  if(opt_sub_type == fern2_4) count--;
  res.seeds.addrInPlace(count * count * count * 100000000000);

  return res;
}

////////////////////////////////////////////////////////////////////////////////

// returned as multiplier
function getUnusedResinBonusFor(resin) {
  var result = Num.log10(resin.addr(1)).mulr(0.1).addr(1);

  var level;
  level = getFruitAbility(FRUIT_RESINBOOST, true);
  if(level > 0) {
    var mul = getFruitBoost(FRUIT_RESINBOOST, level, getFruitTier(true), false, 1).addr(1);
    result = result.mul(mul);
  }
  level = getFruitAbility(FRUIT_RESIN_TWIGS, true);
  if(level > 0) {
    var mul = getFruitBoost(FRUIT_RESIN_TWIGS, level, getFruitTier(true), false, 1).addr(1);
    result = result.mul(mul);
  }

  return result;
}

// returned as multiplier
function getUnusedResinBonus() {
  return getUnusedResinBonusFor(state.res.resin);
}


////////////////////////////////////////////////////////////////////////////////

// returned as multiplier
function getUnusedTwigsBonusFor(twigs) {
  //var result = Num(1); // twigs bonus doesn't actually exist without the fruit that gives it
  var result = Num.log10(twigs.addr(1)).mulr(0.01).addr(1);

  var level;
  level = getFruitAbility(FRUIT_TWIGSBOOST, true);
  if(level > 0) {
    var mul = getFruitBoost(FRUIT_TWIGSBOOST, level, getFruitTier(true), false, 1).addr(1);
    result = result.mul(mul);
  }
  level = getFruitAbility(FRUIT_RESIN_TWIGS, true);
  if(level > 0) {
    var mul = getFruitBoost(FRUIT_RESIN_TWIGS, level, getFruitTier(true), false, 1).addr(1);
    result = result.mul(mul);
  }

  return result;
}

// returned as multiplier
function getUnusedTwigsBonus() {
  return getUnusedTwigsBonusFor(state.res.twigs);
}

////////////////////////////////////////////////////////////////////////////////

function haveUnusedNutsBonus() {
  return !!state.upgrades2[upgrade2_nuts_bonus].count;
}

function getUnusedNutsBonusFor(nuts) {
  if(!haveUnusedNutsBonus()) return Num(1);
  return Num.log10(nuts.addr(1)).mulr(0.025).addr(1);
}

function getUnusedNutsBonus() {
  return getUnusedNutsBonusFor(state.res.nuts);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/*
The plants benefitting most of each season are roughly:
spring: flowers
summer: berries
autumn: mushrooms
winter: tree
*/

// multipliers, e.g. 2 means +100%. TODO: rename 'bonus' to 'multplier' to reflect that
var bonus_season_flower_spring = 1.5;
var bonus_season_summer_berry = 2.5;
var bonus_season_autumn_mushroom = 2.5;
var bonus_season_autumn_mistletoe = 1.5;
var malus_season_winter = 0.75;
var bonus_season_winter_tree = 2.5;
var bonus_season_winter_resin = 1.5;
var season_ethereal_upgrade_exponent = 1.25;

// multiplier of the corresponding berry / mushroom bonus of the season
var bonus_season_summer_mushroom = 0.5; // with ethereal upgrades only
var bonus_season_autumn_berry = 0.5; // with ethereal upgrades only

// returns multiplier instead of bonus (TODO: rename function to reflect that)
function getSpringFlowerBonus() {
  var bonus = Num(bonus_season_flower_spring);

  var ethereal_season = state.upgrades2[upgrade2_season[0]].count;
  if(!basicChallenge() && ethereal_season) {
    //var ethereal_season_bonus = Num(ethereal_season).mulr(upgrade2_season_bonus[0]).addr(1);
    var p = Num(ethereal_season).powr(season_ethereal_upgrade_exponent);
    var ethereal_season_bonus = p.mulr(upgrade2_season_bonus[0]).addr(1);
    bonus = bonus.mul(ethereal_season_bonus);
  }

  var a = getFruitAbility_MultiSeasonal(FRUIT_SPRING, true);
  var level = a[0];
  var ability = a[1];
  if(level > 0) {
    var mul = Num(1).add(getFruitBoost(ability, level, getFruitTier(true), true));
    bonus.mulInPlace(mul);
  }

  return bonus;
}

// returns multiplier instead of bonus (TODO: rename function to reflect that)
function getSummerBerryBonus() {
  var bonus = Num(bonus_season_summer_berry);

  var ethereal_season = state.upgrades2[upgrade2_season[1]].count;
  if(!basicChallenge() && ethereal_season > 0) {
    //var ethereal_season_bonus = Num(ethereal_season).mulr(upgrade2_season_bonus[1]).addr(1);
    var p = (new Num(ethereal_season)).powr(season_ethereal_upgrade_exponent);
    var ethereal_season_bonus = p.mulr(upgrade2_season_bonus[1]).addr(1);
    bonus = bonus.mul(ethereal_season_bonus);
  }

  var a = getFruitAbility_MultiSeasonal(FRUIT_SUMMER, true);
  var level = a[0];
  var ability = a[1];
  if(level > 0) {
    var mul = getFruitBoost(ability, level, getFruitTier(true), true).addr(1);
    bonus.mulInPlace(mul);
  }

  return bonus;
}

// returns multiplier instead of bonus (TODO: rename function to reflect that)
function getSummerMushroomBonus() {
  return getSummerBerryBonus().subr(bonus_season_summer_berry).mulr(bonus_season_summer_mushroom).addr(1);
}

// returns multiplier instead of bonus (TODO: rename function to reflect that)
function getAutumnMushroomBonus() {
  var bonus = new Num(bonus_season_autumn_mushroom);

  var ethereal_season = state.upgrades2[upgrade2_season[2]].count;
  if(!basicChallenge() && ethereal_season > 0) {
    //var ethereal_season_bonus = Num(ethereal_season).mulr(upgrade2_season_bonus[2]).addr(1);
    var p = (new Num(ethereal_season)).powr(season_ethereal_upgrade_exponent);
    var ethereal_season_bonus = p.mulr(upgrade2_season_bonus[2]).addr(1);
    bonus = bonus.mul(ethereal_season_bonus);
  }

  var a = getFruitAbility_MultiSeasonal(FRUIT_AUTUMN, true);
  var level = a[0];
  var ability = a[1];
  if(level > 0) {
    var mul = getFruitBoost(ability, level, getFruitTier(true), true).addr(1);
    bonus.mulInPlace(mul);
  }

  return bonus;
}

// returns percentage to subtract, e.g. if this returns 0.3, then the consumption is 70% of the original consumption
function getAutumnMushroomConsumptionReduction() {
  //return new Num(0.5);
  //return new Num(0.75);
  return new Num(0.875);
}

// returns multiplier instead of bonus (TODO: rename function to reflect that)
function getAutumnBerryBonus() {
  return getAutumnMushroomBonus().subr(bonus_season_autumn_mushroom).mulr(bonus_season_autumn_berry).addr(1);
}

// returns multiplier instead of bonus (TODO: rename function to reflect that)
function getAutumnMistletoeBonus() {
  var bonus = Num(bonus_season_autumn_mistletoe);

  var ethereal_season = state.upgrades2[upgrade2_season[2]].count;
  if(!basicChallenge() && ethereal_season) {
    var t = towards1(ethereal_season, 10) * 0.5;
    bonus.addrInPlace(t);
  }
  return bonus;
}

var winter_malus_brassica = Num(0.33);

function getWinterMalus() {
  var malus = Num(malus_season_winter);
  return malus;
}

function getWinterTreeWarmth() {
  var bonus = Num(bonus_season_winter_tree);

  var ethereal_season = state.upgrades2[upgrade2_season[3]].count;
  if(!basicChallenge() && ethereal_season) {
    //var ethereal_season_bonus = Num(ethereal_season).mulr(upgrade2_season_bonus[3]).addr(1);
    var p = Num(ethereal_season).powr(season_ethereal_upgrade_exponent);
    var ethereal_season_bonus = p.mulr(upgrade2_season_bonus[3]).addr(1);
    bonus = bonus.mul(ethereal_season_bonus);
  }

  var a = getFruitAbility_MultiSeasonal(FRUIT_WINTER, true);
  var level = a[0];
  var ability = a[1];
  if(level > 0) {
    var mul = Num(1).add(getFruitBoost(ability, level, getFruitTier(true), true));
    bonus.mulInPlace(mul);
  }


  return bonus;
}

// returns multiplier instead of bonus (TODO: rename function to reflect that)
function getWinterTreeResinBonus() {
  var result = Num(bonus_season_winter_resin);
  var ethereal_season = state.upgrades2[upgrade2_season[3]].count;
  if(!basicChallenge() && ethereal_season) {
    var t = towards1(ethereal_season, 10) * 0.5;
    result.addrInPlace(t);
  }
  return result;
}

// returns multiplier instead of bonus (TODO: rename function to reflect that)
// resin bonus for other seasons, if they have their respective ethereal upgrade bonus unlocked
// this is intended for summer and autumn, spring has the grow speed increase instead
function getAlternateResinBonus(season) {
  if(!(season >= 0 && season <= 3)) return Num(1); // e.g. infernal challenge has its own special season
  if(!state.upgrades2[upgrade2_season2[season]].count) return Num(1);

  var result = Num(1.25);
  var ethereal_season = state.upgrades2[upgrade2_season[season]].count;
  if(!basicChallenge() && ethereal_season) {
    var t = towards1(ethereal_season, 10) * 0.25;
    result.addrInPlace(t);
  }
  return result;
}



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// returned as bonus (so must add 1 to get it as multiplier)
function getSunSeedsBoost(opt_perma) {
  var bonus_sun = new Num(1.5); // +150%
  bonus_sun.mulInPlace(getWeatherBoost());
  if(state.upgrades[active_choice0].count == 2 && !opt_perma) bonus_sun.mulrInPlace(1 + active_choice0_b_bonus);
  if(opt_perma) bonus_sun.mulrInPlace(challenge_stormy_mul);
  return bonus_sun;
}

// a seed consumption reduction, so a boost
// returned as multiplier
function getMistSeedsBoost() {
  var mul_mist0 = new Num(0.75); // -25%
  // weather boost not applied to the less seeds effect, it's a multiplier intended for things that increase something plus would make it doubly-powerful
  if(state.upgrades[active_choice0].count == 2) mul_mist0.divrInPlace(1 + active_choice0_b_bonus);
  return mul_mist0;
}

// returned as bonus (so must add 1 to get it as multiplier)
function getMistSporesBoost(opt_perma) {
  var bonus_mist1 = new Num(1); // +100%
  bonus_mist1.mulInPlace(getWeatherBoost());
  if(state.upgrades[active_choice0].count == 2 && !opt_perma) bonus_mist1.mulrInPlace(1 + active_choice0_b_bonus);
  if(opt_perma) bonus_mist1.mulrInPlace(challenge_stormy_mul);
  return bonus_mist1;
}

// returned as bonus (so must add 1 to get it as multiplier)
function getRainbowFlowerBoost(opt_perma) {
  var bonus_rainbow = new Num(0.75); // +75%
  bonus_rainbow.mulInPlace(getWeatherBoost());
  if(state.upgrades[active_choice0].count == 2 && !opt_perma) bonus_rainbow.mulrInPlace(1 + active_choice0_b_bonus);
  if(opt_perma) bonus_rainbow.mulrInPlace(challenge_stormy_mul);
  return bonus_rainbow;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Modify resin/twigs bonus according to the old (pre-2024) system. Since the bonus of all challenges is multiplicative with each other, this has no effect on the new system, it's a multiplier that virtually affects one of the challenges using the old system, exactly as it worked then.
// TODO: remove need for this
function modifyResinTwigsChallengeBonus(bonus) {
  return bonus.divr(100);
}

// which = 0 for prod bonus, 1 for resin/twigs bonus
// level = highest tree level reached with this challenge, or hypothetical other level
// returned as bonus value, not as multiplier (see function below for that)
function getChallengeBonus(which, challenge_id, level, completed, opt_cycle) {
  var c = challenges[challenge_id];

  if(c.bonus_formula == 0 || (c.bonus_formula == 2 && which == 1)) {
    var bonus = c.bonus;
    if(c.cycling && opt_cycle != undefined) bonus = c.cycling_bonus[opt_cycle];

    var level2 = level;
    if(c.bonus_max_level) level2 = Math.min(c.bonus_max_level, level2);
    if(c.bonus_min_level) level2 = Math.max(0, level - c.bonus_min_level + 1);

    var score = Num(level2).powr(c.bonus_exponent);
    var result = bonus.mulr(score);
    if(completed) result.addInPlace(c.completion_bonus);

    //if(which == 1) result = result.addr(1).divr(100).subr(1); // TODO: make resin bonus fully computable in here. See todo at modifyResinTwigsChallengeBonus

    return result;
  }

  if(c.bonus_formula == 1 || (c.bonus_formula == 2 && which == 0)) {
    // TODO: handle cycling challenges for this formula, how the weights between different cycles work... e.g. multipliers with cycling_bonus. Or just add then all.

    if(level == 0) return Num(0);
    var k0; // key level 0, beginning of current range (key level = one of the levels where exponent changes)
    var k1; // key level 1, end of current range
    var e; // index of current range (which key-level range reached), for the exponent (0 if in first range)
    if(level < c.bonus_level_a) {
      e = 0;
      k0 = 0;
      k1 = c.bonus_level_a;
    } else {
      e = Math.floor((level - c.bonus_level_a) / c.bonus_level_b) + 1;
      k0 = c.bonus_level_a + (e - 1) * c.bonus_level_b;
      k1 = k0 + c.bonus_level_b;
    }
    var mul0, mul1;
    if(e == 0) {
      mul0 = Num(1);
      mul1 = c.bonus_exponent_base_a;
    } else if(e == 1) {
      mul0 = c.bonus_exponent_base_a;
      mul1 = mul0.mul(c.bonus_exponent_base_b);
    } else {
      mul0 = c.bonus_exponent_base_a.mul(Num.pow(c.bonus_exponent_base_b, Num(e - 1)));
      mul1 = mul0.mul(c.bonus_exponent_base_b);
    }
    var progress = (level - k0) / (k1 - k0);
    var mul = mul0.add(mul1.sub(mul0).mulr(c.bonus_p * progress));

    var result = mul.subr(1);

    if(which == 1) {
      var l = Num.log(result.addr(1));
      result = l.mul(l).mulr(0.25);
    }

    return result;
  }

  return Num(0); // unknown formula
}

// which = 0 for prod bonus, 1 for resin/twigs bonus
function getChallengeMultiplier(which, challenge_id, level, completed, opt_cycle) {
  return getChallengeBonus(which, challenge_id, level, completed, opt_cycle).addr(1);
}

// get the bonus of 1 challenge based on current state without taking current run into account, for UI
// if it's a cycling challenge, shows it for all cycles combined
// which = 0 for prod bonus, 1 for resin/twigs bonus
function oneChallengeBonus(which, challenge_id) {
  if(challenge_id == 0) return Num(0);
  var c = challenges[challenge_id];
  var c2 = state.challenges[challenge_id];
  if(c.cycling) {
    var result = new Num(0);
    // the cycling is additive
    for(var j = 0; j < c.cycling; j++) {
      var maxlevel = c2.maxlevels[j];
      var completed = c.cycleCompleted(j, false);
      result.addInPlace(getChallengeBonus(which, c.index, maxlevel, completed, j));
    }
    return result;
  } else {
    var maxlevel = c2.maxlevel;
    var completed = c.cycleCompleted(undefined, false);
    return getChallengeMultiplier(which, c.index, maxlevel, completed, undefined).subr(1);
  }
}

// get the bonus of 1 challenge based on current state with taking current run into account, for UI
// if it's a cycling challenge, shows it for all cycles combined
// which = 0 for prod bonus, 1 for resin/twigs bonus
function oneChallengeBonusIncludingCurrentRun(which, challenge_id) {
  if(challenge_id == 0) return Num(0);
  if(state.challenge != challenge_id) return oneChallengeBonus(which, challenge_id);
  var c = challenges[challenge_id];
  var c2 = state.challenges[challenge_id];
  if(c.cycling) {
    var result = new Num(0);
    var cycle = c2.num_completed % c.cycling;
    // the cycling is additive
    for(var j = 0; j < c.cycling; j++) {
      var maxlevel = c2.maxlevels[j];
      var completed = c.cycleCompleted(j, false);
      if(j == cycle) {
        var maxlevel = Math.max(maxlevel, state.treelevel);
        var completed = c.cycleCompleted(j, true);
      }
      result.addInPlace(getChallengeBonus(which, c.index, maxlevel, completed, j));
    }
    return result;
  } else {
    var maxlevel = Math.max(c2.maxlevel, state.treelevel);
    var completed = c.cycleCompleted(undefined, true);
    return getChallengeMultiplier(which, c.index, maxlevel, completed, undefined).subr(1);
  }
}

// which = 0 for prod bonus, 1 for resin/twigs bonus
function totalChallengeBonus(which) {
  if(which) return state.challenge_multiplier_resin_twigs.subr(1);
  return state.challenge_multiplier_prod.subr(1);
}

function totalChallengeProdBonus() {
  return totalChallengeBonus(0);
}

// total challenge bonus, but taking into account running challenge (with challenge_id) having the new given maxlevel
// for cycling challenge, uses the current cycle (= of the current run, or upcoming run if the challenge is not active now).
// which = 0 for prod bonus, 1 for resin/twigs bonus
function totalChallengeBonusIncludingCurrentRun(which) {
  var result = totalChallengeBonus(which);
  if(!state.challenge) return result;

  // the full challenge bonus is computed in state.challenge_multiplier_prod by computeDerived.
  // so don't redo whole computation here, just compute the modification by the current challenge

  var c = challenges[state.challenge];
  var c2 = state.challenges[state.challenge];

  var before;
  var after;

  if(c.cycling) {
    var cycle = c2.num_completed % c.cycling;
    before = Num(1);
    after = Num(1);
    // the cycling one is additive
    for(var j = 0; j < c.cycling; j++) {
      var maxlevel0 = c2.maxlevels[j];
      var completed0 = c.cycleCompleted(j, false);
      var mul0 = getChallengeBonus(which, c.index, maxlevel0, completed0, j);
      var mul1 = mul0;
      if(j == cycle) {
        var maxlevel1 = Math.max(maxlevel0, state.treelevel);
        var completed1 = c.cycleCompleted(j, true);
        mul1 = getChallengeBonus(which, c.index, maxlevel1, completed1, j);
      }
      before.addInPlace(mul0);
      after.addInPlace(mul1);
    }
  } else {
    var maxlevel0 = c2.maxlevel;
    var maxlevel1 = Math.max(c2.maxlevel, state.treelevel);
    var completed0 = c.cycleCompleted(undefined, false);
    var completed1 = c.cycleCompleted(undefined, true);
    before = getChallengeMultiplier(which, c.index, maxlevel0, completed0, undefined);
    after = getChallengeMultiplier(which, c.index, maxlevel1, completed1, undefined);
  }

  var ratio = after.div(before);
  // subr(1) to convert from multiplier to bonus for UI
  var bonus = which ? state.challenge_multiplier_resin_twigs : state.challenge_multiplier_prod;
  return bonus.mul(ratio).subr(1);
}


// only during bee challenge
function getWorkerBeeBonus() {
  return state.workerbeeboost;
}

function challengeMaxLevel(challenge) {
  var c = challenges[challenge];
  var c2 = state.challenges[challenge];

  var result = c2.maxlevel;

  if(state.challenge == challenge && state.treelevel > result) result = state.treelevel;

  return result;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var fernIdleTimeBegin = 30 * 60; // amount of time after which the fern charges up for extra idle resources
// resources from idle fern representing past gains. not the full charged up time you get, but the time it takes to charge up. the multiplier fernIdlePastMul then determines the actual effective charged up time.
var fernIdleTimeMaxPast = 9 * 3600;
// resources from idle fern representing future gains (based on current production, so actually current gains, but if e.g. weather activated it is those from hypothetical future with this weather all the time active). E.d. the same income as the regular fern behavior, but this one here is only if having the "slower ferns" choice upgrade
var fernIdleTimeMaxFuture = fernIdleTimeMaxPast;
var fernIdlePastMul = 0.5; // multiplier of the above time for the past gains of fern
var fernIdleFutureMul = 1 / 24; // multiplier of the above time for the future gains of fern. Much smaller than the past gain one, the past gains themselves are usually smaller though


function getFernWaitTime() {
  var progress = state.res.seeds;
  var mintime = fern_wait_minutes * 60;
  if(state.upgrades[fern_choice0].count == 1) mintime += fern_choice0_a_minutes * 60;

  // no seeds and no income, speed up appearance of ferns
  if(state.res.seeds.ltr(10) && gain.seeds.ltr(0.5)) mintime = 5;

  return mintime;
}


// amount of past fern time charged up (as time duration). Amount of resources gotten from this should be:
// (state.c_res - state.fernres) * getFernIdlePastCharge() / (state.time - state.lastFernTime), but only for spores and seeds
function getFernIdlePastCharge() {
  var timediff = state.time - state.lastFernTime;
  var idletime = timediff - fernIdleTimeBegin;
  if(idletime <= 0) return 0;
  if(idletime > fernIdleTimeMaxPast) idletime = fernIdleTimeMaxPast;
  return idletime * fernIdlePastMul;
}

// amount of future (= from current moment on) fern time charged up (as time duration).
// amount of resources gotten from this should be this time value multiplied by the production as normally computed for ferns
function getFernIdleFutureCharge() {
  var timediff = state.time - state.lastFernTime;
  var idletime = timediff - fernIdleTimeBegin;
  if(idletime <= 0) return 0;
  if(idletime > fernIdleTimeMaxFuture) idletime = fernIdleTimeMaxFuture;
  return idletime * fernIdleFutureMul;
}


////////////////////////////////////////////////////////////////////////////////

// opt_croptype undefined: for checking if multiplicity is ever unlocked in any form at all by the player, for e.g. revealing the help messages about it
function haveMultiplicity(opt_croptype) {
  if(basicChallenge()) return false;

  if(opt_croptype == undefined || opt_croptype == CROPTYPE_BERRY || opt_croptype == CROPTYPE_PUMPKIN || opt_croptype == CROPTYPE_MUSH) return state.challenges[challenge_rockier].completed;

  if(opt_croptype == CROPTYPE_FLOWER) return state.challenges[challenge_rockier].completed && state.squirrel_upgrades[upgradesq_flower_multiplicity].count;

  if(opt_croptype == CROPTYPE_BEE) return state.challenges[challenge_rockier].completed && state.squirrel_upgrades[upgradesq_bee_multiplicity].count;

  if(opt_croptype == CROPTYPE_STINGING) return state.challenges[challenge_rockier].completed && state.squirrel_upgrades[upgradesq_stinging_multiplicity].count;

  return false;
}

// the result must be multiplied by getMultiplicityNum, to get the actual intended resulting bonus
function getMultiplicityBonusBase(croptype) {
  if(croptype == CROPTYPE_BERRY || croptype == CROPTYPE_PUMPKIN) {
    var result = Num(0.25);
    if(state.squirrel_upgrades[upgradesq_berry_multiplicity_boost].count) {
      result.addInPlace(upgradesq_berry_multiplicity_boost_bonus.mulr(state.squirrel_upgrades[upgradesq_berry_multiplicity_boost].count));
    }
    return result;
  }
  if(croptype == CROPTYPE_MUSH) {
    var result = Num(0.25);
    if(state.squirrel_upgrades[upgradesq_mushroom_multiplicity_boost].count) {
      result.addInPlace(upgradesq_mushroom_multiplicity_boost_bonus.mulr(state.squirrel_upgrades[upgradesq_mushroom_multiplicity_boost].count));
    }
    return result;
  }
  if(croptype == CROPTYPE_FLOWER) {
    return upgradesq_flower_multiplicity_bonus;
  }
  if(croptype == CROPTYPE_BEE) {
    return upgradesq_bee_multiplicity_bonus;
  }
  if(croptype == CROPTYPE_STINGING) {
    return upgradesq_stinging_multiplicity_bonus;
  }
  return Num(0.1);
}

function getMultiplicityNum(crop) {
  // the multiplicity bonus is given by crops of same tier, or 1 tier lower, or 1 tier higher, but not any farther away than that
  // reason: multiplicity is intended to give a benefit from more crops in the field, since due to linear scaling more crops otherwise diminishes. But it's not intended to be a mechanic to allow quick manual hotswapping of bonus types.
  // if crops from all tiers give the bonus, then you can leave a tier 0 crop around to give the bonus, without needing to ever spend growtime on it after that, and also allows quick swapping between mushrooms and berries. But maintaining that requires manual work, which is annoying, so we don't want that mechanic
  // if only crops from exact same tier (so exact same crop) affect it, then growing a higher tier crop will be bad instead of good, and growing higher tier crops should be encouraged
  // benefitting from +1/-1 tier is just right: normally you have one tier active, and are growing 1 new next tier, so they can benefit each other.


  var croptype = crop.type;
  if(croptype == CROPTYPE_PUMPKIN) {
    var b = state.highestcropoftypeplanted[CROPTYPE_BERRY];
    if(b == undefined || crops[b].istemplate) return state.cropcount[pumpkin_0] * 4 - 1; // still return the multiplicity for pumpkin itself, for clarity: so multiplicity will show up in it detailed breakdown. But, with no berries pumpkin produces 0 so it doesn't affect production.
    return getMultiplicityNum(crops[b]);
  }
  var tier = crop.tier;

  var below = undefined;
  if(tier > 0 && croptype_tiers[croptype]) below = croptype_tiers[croptype][tier - 1];
  if(below && !below.isReal()) below = undefined;

  var above = undefined;
  if(tier != undefined && croptype_tiers[croptype]) above = croptype_tiers[croptype][tier + 1];
  if(above && !above.isReal()) above = undefined;

  // This used to use state.growingcropcount instead of state.cropcount, however it's better for gameplay to let multiplicity work immediately,
  // for strategies that involve switching layouts. However, if this turns out to be too much, another option is to make it work with a very fast ramp-up time
  var num = state.cropcount[crop.index];
  if(below) num += state.cropcount[below.index];
  if(above) num += state.cropcount[above.index];

  if(croptype == CROPTYPE_BERRY) num += state.cropcount[pumpkin_0] * 4; // this assumes pumpkin_0 is the only existing CROPTYPE_PUMPKIN crop, as it is for halloween 2022


  num -= 1; // the current plant self is not counted (even if partial, growing, still counts as full 1)
  if(num < 0) num = 0;

  return num;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// @constructor
function SquirrelUpgrade() {
  this.name = 'a';
  this.description = undefined; // longer description than the name, with details, shown if not undefined

  // function that applies the upgrade. If non-empty, gets called after the count of this upgrade was incremented in the state. If it returns true, that also means: 'cancel', e.g. if it has a delayed effect like a dialog with ok button that handles everything (like squirrel evolution)
  this.fun = undefined;

  // optional extra precondition for this upgrade to unlock
  this.prefun = undefined;

  this.index = 0; // index in the squirrel_upgrades array

  this.image = undefined; // bg image, e.g. a plant
}

SquirrelUpgrade.prototype.getDescription = function() {
  if(typeof(this.description) == 'function') {
    return this.description();
  }
  return this.description;
};

// @constructor
// Stage for the tree structure of squirrel upgrades
// A node can have max 3 leaves, and there is one main path, so max 2 branches possible from 1 node, to keep the UI simple to render
function SquirrelStage() {
  var upgrades0 = []; // left branch
  var upgrades1 = []; // center branch (main branch that connects to previous and next stage)
  var upgrades2 = []; // right branch

  // if true, must have done all upgrades before this stage, before this stage can be unlocked
  this.gated = false;

  this.index = 0;
  this.gated_index = 0; // index of gated section this stage is in
  this.gated_index2 = 0; // similar to gated, but considers any stage with upgrade in the center as gated. Used for revealing of unknown upgrades in the squirrel UI

  this.num_above = 0; // how many upgrades are in the stages above. This is for counting whether you had all upgrades when gated

  // for rendering in UI
  this.height = function() {
    return Math.max(upgrades.length, Math.max(upgrades0.length, upgrades1.length));
  }
}

var registered_squirrel_upgrades = []; // indexed consecutively, gives the index to upgrades
var squirrel_upgrades = []; // indexed by upgrade index


// same comment as crop_register_id
var squirrel_upgrades_register_id = -1;

// maxcount should be 1 for an upgrade that can only be done once (e.g. an unlock), or 0 for infinity
function registerSquirrelUpgrade(name, fun, description, image) {
  if(squirrel_upgrades[squirrel_upgrades_register_id] || squirrel_upgrades_register_id < 0 || squirrel_upgrades_register_id > 65535) throw 'squirrel_upgrades id already exists or is invalid!';
  var upgrade = new SquirrelUpgrade();
  upgrade.index = squirrel_upgrades_register_id++;
  squirrel_upgrades[upgrade.index] = upgrade;
  registered_squirrel_upgrades.push(upgrade.index);

  upgrade.name = name;

  upgrade.image = image || medalhidden[0];

  upgrade.fun = fun || null;

  upgrade.description = description;

  return upgrade.index;
}


var squirrel_stages = [];
var squirrel_stages_gated_index = [];
var squirrel_stages_gated_index2 = [];

// These are only ever registered in the exact order they appear, and are not intended to ever change order in future game updates, only append at the end.
function registerSquirrelStage(evolution, upgrades0, upgrades1, upgrades2, opt_gated) {
  if(!squirrel_stages[evolution]) squirrel_stages[evolution] = [];
  var stages = squirrel_stages[evolution];
  if(!squirrel_stages_gated_index[evolution]) squirrel_stages_gated_index[evolution] = 0;
  if(!squirrel_stages_gated_index2[evolution]) squirrel_stages_gated_index2[evolution] = 0;

  var stage = new SquirrelStage();
  stage.upgrades0 = upgrades0 || [];
  stage.upgrades1 = upgrades1 || [];
  stage.upgrades2 = upgrades2 || [];
  stage.gated = !!opt_gated;

  stage.index = stages.length;
  if(opt_gated) squirrel_stages_gated_index[evolution]++;
  if(opt_gated || !!upgrades1) squirrel_stages_gated_index2[evolution]++;
  stage.gated_index = squirrel_stages_gated_index[evolution];
  stage.gated_index2 = squirrel_stages_gated_index2[evolution];

  if(stage.index > 0) {
    var prev = stages[stage.index - 1];
    stage.num_above = prev.num_above + prev.upgrades0.length + prev.upgrades1.length + prev.upgrades2.length;
  }

  stages.push(stage);
}

squirrel_upgrades_register_id = 10;

var upgradesq_berry_bonus = Num(0.65);
var upgradesq_mushroom_bonus = Num(0.65);
var upgradesq_flower_bonus = Num(0.5);
var upgradesq_nettle_bonus = Num(0.5);
var upgradesq_bee_bonus = Num(0.5);
var upgradesq_growspeed_bonus = 0.2; // how much % faster it grows

var upgradesq_berry = registerSquirrelUpgrade('berry boost', undefined, 'boosts berries +' + upgradesq_berry_bonus.toPercentString(), blackberry[4]);
var upgradesq_mushroom = registerSquirrelUpgrade('mushroom boost', undefined, 'boosts mushroom production but also consumption by +' + upgradesq_mushroom_bonus.toPercentString(), champignon[4]);
var upgradesq_flower = registerSquirrelUpgrade('flower boost', undefined, 'boosts the flower boost by +' + upgradesq_flower_bonus.toPercentString(), images_anemone[4]);
var upgradesq_nettle = registerSquirrelUpgrade('nettle boost', undefined, 'boosts the nettle boost by +' + upgradesq_nettle_bonus.toPercentString(), images_nettle[4]);
var upgradesq_bee = registerSquirrelUpgrade('bee boost', undefined, 'boosts the bee boost by +' + upgradesq_bee_bonus.toPercentString(), images_beenest[4]);

var upgradesq_fruittierprob = registerSquirrelUpgrade('fruit tier probability', undefined, 'increases probability of getting a better fruit tier drop: moves the probability tipping point for higher tier drop by around 10%, give or take because the probability table is different for different tree levels', images_apple[4]);
var upgradesq_seasonfruitprob = registerSquirrelUpgrade('seasonal fruit probability', undefined, 'increases probability of getting a better seasonal fruit drop from 1/4th to 1/3rd', images_apricot[3]);

var upgradesq_doublefruitprob_prob = 0.25;
var upgradesq_doublefruitprob = registerSquirrelUpgrade('double fruit drop chance', undefined, 'when the tree drops a fruit, it has ' + Num(upgradesq_doublefruitprob_prob).toPercentString() + ' chance to drop 2 fruits at once', images_apple[3]);

var upgradesq_growspeed = registerSquirrelUpgrade('grow speed', undefined, 'crops grow ' + Num(upgradesq_growspeed_bonus).toPercentString() + ' faster', blackberry[0]);
var upgradesq_watercress_mush = registerSquirrelUpgrade('watercress and mushroom soup', undefined, 'when watercress copies from mushroom, it no longer increases seed consumption, it copies the spores entirely for free. Also works for other brassica.', images_watercress[4]);
var upgradesq_watercresstime = registerSquirrelUpgrade('brassica time', undefined, 'adds 50% to the lifetime of brassica, such as watercress', images_watercress[1]);
var upgradesq_watercresstime2 = registerSquirrelUpgrade('brassica space-time', undefined, 'adds 50% to the lifetime and copying ability of brassica, such as watercress', images_watercress[1]);

var upgradesq_squirrel_boost = Num(0.25);
var upgradesq_squirrel = registerSquirrelUpgrade('ethereal squirrel boost', undefined, 'adds an additional ' + upgradesq_squirrel_boost.toPercentString() + ' to the neighbor boost (which is originally 50%) of the ethereal squirrel', images_squirrel[4]);

var upgradesq_automaton_boost = Num(0.25);
var upgradesq_automaton = registerSquirrelUpgrade('ethereal automaton boost', undefined, 'adds an additional ' + upgradesq_automaton_boost.toPercentString() + ' to the neighbor boost (which is originally 50%) of the ethereal automaton', images_automaton[4]);

var upgradesq_ethtree_boost = Num(0.2);
var upgradesq_ethtree = registerSquirrelUpgrade('ethereal tree neighbor boost', undefined, 'ethereal tree boosts non-lotus neighbors (non-diagonal) by ' + upgradesq_ethtree_boost.toPercentString(), tree_images[6][1][4]);

var upgradesq_fruitmix = registerSquirrelUpgrade('seasonal fruit mixing', undefined, 'Allows fusing mixed seasonal fruits, to get new multi-season fruit types that give the season bonus in 2 seasons:<br> • apricot + pineapple = mango (spring + summer),<br> • pineapple + pear = plum (summer + autumn),<br> • pear + medlar = quince (autumn + winter),<br> • medlar + apricot = kumquat (winter + spring).<br>Other fruit fusing rules work as usual. If this upgrade is removed due to respec, the multi-season fruits temporarily lose their season boost until getting this upgrade again. A later squirrel upgrade will extend the ability of this upgrade.', images_mango[4]);
var upgradesq_fruitmix2 = registerSquirrelUpgrade('seasonal fruit mixing II', undefined, 'A next level of fruit mixing: allows creating the 4-season star fruit! Fuse mango+quince, or alternatively plum+kumquat, but only if they have the same abilities, to get the star fruit. If this squirrel upgrade or its predecessor is removed due to respec, star fruits temporarily lose their season boost until getting this upgrade again.', images_starfruit[4]);
var upgradesq_fruitmix3 = registerSquirrelUpgrade('seasonal fruit mixing III', undefined, 'The next level of fruit mixing: allows creating the legendary dragon fruit! Fuse star fruit + apple, but only if they have the same abilities, to get the dragon fruit, which is a version of the star fruit with more season bonus. If this squirrel upgrade is removed due to respec, dragon fruits temporarily act like star fruit, or lose the season boost entirely if the star fruit squirrel upgrade is also not active, until getting this upgrade again.', images_dragonfruit[4]);

var upgradesq_resin_bonus = Num(0.25);
var upgradesq_resin = registerSquirrelUpgrade('resin bonus', undefined, 'increases resin gain by ' + Num(upgradesq_resin_bonus).toPercentString(), image_resin);

var upgradesq_twigs_bonus = Num(0.25);
var upgradesq_twigs = registerSquirrelUpgrade('twigs bonus', undefined, 'increases twigs gain by ' + Num(upgradesq_twigs_bonus).toPercentString(), images_mistletoe[2]);

var upgradesq_essence_bonus = Num(0.5);
var upgradesq_essence = registerSquirrelUpgrade('essence bonus', undefined, 'increases essence from sacrificed fruits by ' + Num(upgradesq_essence_bonus).toPercentString(), images_apple[3]);

var upgradesq_flower_multiplicity_bonus = Num(0.1);
var upgradesq_flower_multiplicity = registerSquirrelUpgrade('flower multiplicity', undefined,
    'Unlocks multiplicity of flowers. Requires that regular multiplicity for berries and mushrooms has been unlocked. Given that, then this allows also the presence of multiple flowers anywhere in the field to give a global flower bonus, for all flowers with max 1 tier difference. The bonus per flower is ' + upgradesq_flower_multiplicity_bonus.toPercentString(),
    images_daisy[3]);

var upgradesq_diagonal_brassica = registerSquirrelUpgrade('diagonal brassica', undefined, 'brassica (such as watercress) can also copy diagonally, they can get up to 8 instead of 4 neighbors to copy from', images_watercress[4]);

function haveDiagonalBrassica() {
  if(state.challenge == challenge_towerdefense) return true;
  return !basicChallenge() && !!state.squirrel_upgrades[upgradesq_diagonal_brassica].count;
}

var upgradesq_highest_level_param1 = 0.1;
var upgradesq_highest_level_param2 = 1.1;
var upgradesq_highest_level_min =  75; // min tree level where upgradesq_highest_level begins to work
var upgradesq_highest_level_formula_text = '((highest level - ' + upgradesq_highest_level_min + ') * ' + upgradesq_highest_level_param1 + ' + 1) ^ ' + upgradesq_highest_level_param2;
var upgradesq_highest_level = registerSquirrelUpgrade('highest tree level ever bonus', undefined,
  function() {
    return 'unlocks a production bonus that depends on highest tree level ever reached, starting from level ' +
            upgradesq_highest_level_min + '. Bonus multiplier formula: ' + upgradesq_highest_level_formula_text +
            '<br>Current bonus: +' + GetSquirrelUpgradeHighestTreeLevelMultiplier().subr(1).toPercentString() +
            '<br>At next highest tree level (' + (state.g_treelevel + 1) + '): +' + GetSquirrelUpgradeHighestTreeLevelMultiplier(1).subr(1).toPercentString();
  },
  tree_images[6][1][1]);

// returned as multiplier, subtract 1 and multiply with 100% to show it in the bonus form
function GetSquirrelUpgradeHighestTreeLevelMultiplier(opt_adjust) {
  var diff = state.g_treelevel - upgradesq_highest_level_min;
  if(opt_adjust) diff += opt_adjust;
  if(diff <= 0) return Num(0);
  return Num(diff * upgradesq_highest_level_param1 + 1).powr(upgradesq_highest_level_param2);
}

var upgradesq_leveltime_maxbonus = 4;
var upgradesq_leveltime_maxtime = 7200; // in seconds
var upgradesq_leveltime = registerSquirrelUpgrade('time at level bonus', undefined, 'unlocks a production bonus that depends how much time the tree has spent at the current level, with a weighed average including 2 previous level durations. The maximum bonus is +' + Num(upgradesq_leveltime_maxbonus).toPercentString() + ' after ' + (upgradesq_leveltime_maxtime / 3600) + ' hours.', image_hourglass);

var upgradesq_bee_multiplicity_bonus = Num(0.1);
var upgradesq_bee_multiplicity = registerSquirrelUpgrade('bee multiplicity', undefined,
    'Unlocks multiplicity of bees. Requires that regular multiplicity for berries and mushrooms has been unlocked. Presence of multiple bees anywhere in the field will give a global bee bonus. The bonus per bee is ' + upgradesq_bee_multiplicity_bonus.toPercentString(),
    images_beenest[4]);

// by default wait time is 5x the runtime, so runtime can easily be lenghtened
var upgradesq_weather_duration_bonus = 0.5;
var upgradesq_weather_duration = registerSquirrelUpgrade('weather duration', undefined, 'increases active duration of weather effects by ' + Num(upgradesq_weather_duration_bonus).toPercentString() + ' without increasing total active+cooldown cycle time', image_sun);
squirrel_upgrades[upgradesq_weather_duration].fun = function() {
  // buying this can make 2 weather abilities active at once. Since that is powerful and may cause one to want to do squirrel respecs on purpose just for this, avoid this strategy to save respec tokens for more useful purposes
  var time = util.getTime();
  var sund = getSunDuration();
  var mistd = getMistDuration();
  var rainbowd = getRainbowDuration();
  var sunw = getSunWait();
  var mistw = getMistWait();
  var rainboww = getRainbowWait();
  var sunt = time - state.suntime;
  var mistt = time - state.misttime;
  var rainbowt = time - state.rainbowtime;
  var sun = sund - sunt;
  var mist = mistd - mistt;
  var rainbow = rainbowd - rainbowt;
  if(sunt > sunw || sunt > sund) sun = 0;
  if(mistt > mistw || mistt > mistd) mist = 0;
  if(rainbowt > rainboww || rainbowt > rainbowd) rainbow = 0;
  if(mist > 0 && sun > 0) {
    state.misttime -= mist;
  }
  if((sun > 0 || mist > 0) && rainbow > 0) {
    state.rainbowtime -= rainbow;
  }
};

var upgradesq_evolution = registerSquirrelUpgrade('Evolve squirrel', function() {
      showSquirrelEvolutionDialog();
      return true; // indicate that this upgrade is not bought and applied immediately, it shows a dialog first
    },
    'Resets and removes all squirrel upgrades. Gives a flat permanent production bonus. Replaces the squirrel upgrade tree with a new, more expensive, tree. You will be weaker after this, but eventually get stronger than ever before thanks to the new upgrades.',
    image_squirrel_evolution);

var upgradesq_stinging_multiplicity_bonus = Num(1);
var upgradesq_stinging_multiplicity = registerSquirrelUpgrade('stinging multiplicity', undefined,
    'Unlocks multiplicity of stingy crops. Requires that regular multiplicity for berries and mushrooms has been unlocked. Presence of multiple nettles anywhere in the field will give a global nettle bonus. The bonus per nettle is ' + upgradesq_stinging_multiplicity_bonus.toPercentString(),
    images_nettle[4]);

var upgradesq_fruitmix123 = registerSquirrelUpgrade('seasonal fruit mixing', undefined, 'Unlocks all fruit mixing including dragon fruit. This upgrade combines seasonal fruit mixing I, II and III.', images_dragonfruit[4]);

// 1 = fruit mixing I, 2 = fruit mixing II, 3 = fruit mixing III
function haveFruitMix(num) {
  if(num == 1) return state.squirrel_upgrades[upgradesq_fruitmix].count || state.squirrel_upgrades[upgradesq_fruitmix123].count;
  if(num == 2) return state.squirrel_upgrades[upgradesq_fruitmix2].count || state.squirrel_upgrades[upgradesq_fruitmix123].count;
  if(num == 3) return state.squirrel_upgrades[upgradesq_fruitmix3].count || state.squirrel_upgrades[upgradesq_fruitmix123].count;
  return false;
}

var upgradesq_prestiged_flower_bonus = Num(1.5);
var upgradesq_prestiged_flower = registerSquirrelUpgrade('prestiged flower boost', undefined,
    'Prestiged flowers get a ' + upgradesq_prestiged_flower_bonus.toPercentString() + ' boost',
    images_anemone[4]);


var upgradesq_prestiged_berry_bonus = Num(2);
var upgradesq_prestiged_berry = registerSquirrelUpgrade('prestiged berry boost', undefined,
    'Prestiged berries get a ' + upgradesq_prestiged_berry_bonus.toPercentString() + ' boost',
    blackberry[4]);


var upgradesq_prestiged_mushroom_bonus = Num(2);
var upgradesq_prestiged_mushroom = registerSquirrelUpgrade('prestiged mushroom boost', undefined,
    'Prestiged mushrooms get a ' + upgradesq_prestiged_mushroom_bonus.toPercentString() + ' boost',
    champignon[4]);

var upgradesq_berry_multiplicity_boost_bonus = Num(0.1);
var upgradesq_berry_multiplicity_boost = registerSquirrelUpgrade('berry multiplicity boost', undefined,
    'Boosts the berry multiplicity by an additional ' + upgradesq_berry_multiplicity_boost_bonus.toPercentString() + '. Requires berry multiplicity has been unlocked.',
    blackberry[4]);

var upgradesq_mushroom_multiplicity_boost_bonus = Num(0.2);
var upgradesq_mushroom_multiplicity_boost = registerSquirrelUpgrade('mushroom multiplicity boost', undefined,
    'Boosts the mushroom multiplicity by an additional ' + upgradesq_mushroom_multiplicity_boost_bonus.toPercentString() + '. Requires mushroom multiplicity has been unlocked.',
    champignon[4]);


var upgradesq_squirrel_boost2 = Num(0.5);
var upgradesq_squirrel2 = registerSquirrelUpgrade('ethereal squirrel boost II', undefined, 'adds an additional ' + upgradesq_squirrel_boost2.toPercentString() + ' to the neighbor boost (which is originally 50%) of the ethereal squirrel', images_squirrel[4]);

var upgradesq_automaton_boost2 = Num(0.5);
var upgradesq_automaton2 = registerSquirrelUpgrade('ethereal automaton boost II', undefined, 'adds an additional ' + upgradesq_automaton_boost2.toPercentString() + ' to the neighbor boost (which is originally 50%) of the ethereal automaton', images_automaton[4]);

var upgradesq_ethtree_boost2 = Num(0.5);
var upgradesq_ethtree2 = registerSquirrelUpgrade('ethereal tree neighbor boost II', undefined, 'ethereal tree boosts non-lotus neighbors (non-diagonal) by ' + upgradesq_ethtree_boost2.toPercentString(), tree_images[6][1][4]);

var squirrel_evolution_ethtree_boost = Num(0.2);
var squirrel_evolution_ethtree_boost2 = Num(0); // not increased for the second squirrel evolution, don't encourage putting everything in the center anymore

var upgradesq_ethtree_diag = registerSquirrelUpgrade('diagonal ethereal tree', undefined, 'ethereal tree boost also works diagonally', tree_images[6][1][4]);

// these also each add half of the upgradesq_doublefruitprob upgrade's double fruit chance, so doing these 2 is same as doing the 3 original fruit chance related upgrades
var upgradesq_doublefruitprob_prob_half = 0.125;
var upgradesq_fruittierprob2 = registerSquirrelUpgrade('fruit tier and double fruit chance', undefined, 'increases probability of getting a better fruit tier drop: moves the probability tipping point for higher tier drop by around 10%, give or take because the probability table is different for different tree levels. In addition, adds ' + Num(upgradesq_doublefruitprob_prob_half).toPercentString() + ' chance to drop 2 fruits at once', images_apple[4]);
var upgradesq_seasonfruitprob2 = registerSquirrelUpgrade('seasonal fruit and double fruit chance', undefined, 'increases probability of getting a better seasonal fruit drop from 1/4th to 1/3rd. In addition, adds ' + Num(upgradesq_doublefruitprob_prob_half).toPercentString() + ' chance to drop 2 fruits at once', images_apricot[3]);


var upgradesq_evolution2 = registerSquirrelUpgrade('Evolve squirrel II', function() {
      showSquirrelEvolutionDialog();
      return true; // indicate that this upgrade is not bought and applied immediately, it shows a dialog first
    },
    'Resets and removes all squirrel upgrades. Gives a flat permanent production bonus. Replaces the squirrel upgrade tree with a new, more expensive, tree. You will be weaker after this, but eventually get stronger than ever before thanks to the new upgrades.',
    image_squirrel_evolution2);

var upgradesq_fruittierprob3 = registerSquirrelUpgrade('fruit tier, seasonal and double fruit chance', undefined, 'increases probability of getting a better fruit tier drop: moves the probability tipping point for higher tier drop by around 10%, give or take because the probability table is different for different tree levels. In addition, increases probability of getting a better seasonal fruit drop from 1/4th to 1/3rd. In addition, adds ' + Num(upgradesq_doublefruitprob_prob).toPercentString() + ' chance to drop 2 fruits at once', images_apple[4]);

var upgradesq_infinity_boost_value = 0.1;
var upgradesq_infinity_boost = registerSquirrelUpgrade('infinity boost', undefined, 'Adds +' + Num(upgradesq_infinity_boost_value).toPercentString() + ' boost to infinity seeds income', image_infinity);

var upgradesq_mushroom_efficiency_value = 0.5;
var upgradesq_mushroom_efficiency = registerSquirrelUpgrade('mushroom efficiency', undefined, 'Reduces mushroom seed consumption by ' + Num(upgradesq_mushroom_efficiency_value).toPercentString(), image_seed);

var upgradesq_nuts_value = 5;
var upgradesq_nuts = registerSquirrelUpgrade('nuts boost', undefined, '' + upgradesq_nuts_value + 'x boost to nuts production (multiplicatively)', image_nuts);

var upgradesq_eth_all_boost = Num(0.25);
var upgradesq_eth_all = registerSquirrelUpgrade('all ethereal crops boost', undefined, '+ ' + upgradesq_eth_all_boost.toPercentString() + ' boost to all ethereal crops that boost the basic field', image_medaltranscend);

var upgradesq_squirrel_boost3 = Num(0.75);
var upgradesq_squirrel3 = registerSquirrelUpgrade('ethereal squirrel boost III', undefined, 'adds a +' + upgradesq_squirrel_boost3.toPercentString() + ' boost to the ethereal squirrel neighbor boost', images_squirrel[4]);

var upgradesq_automaton_boost3 = Num(0.75);
var upgradesq_automaton3 = registerSquirrelUpgrade('ethereal automaton boost III', undefined, 'adds a +' + upgradesq_automaton_boost3.toPercentString() + ' boost to the ethereal automaton neighbor boost and lotus neighbor boost', images_automaton[4]);



////////////////////////////////////////////////////////////////////////////////
var STAGE_REGISTER_EVOLUTION;
////////////////////////////////////////////////////////////////////////////////

STAGE_REGISTER_EVOLUTION = 0;

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_berry], [upgradesq_squirrel], [upgradesq_mushroom]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_nettle], [upgradesq_automaton], [upgradesq_flower]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_fruitmix], undefined, [upgradesq_seasonfruitprob]);

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_ethtree], undefined, true);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_fruittierprob, upgradesq_growspeed], undefined, [upgradesq_essence, upgradesq_watercress_mush]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_weather_duration, upgradesq_mushroom], undefined, [upgradesq_fruitmix2, upgradesq_flower_multiplicity]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_watercresstime, upgradesq_bee], undefined, [upgradesq_doublefruitprob, upgradesq_berry]);

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_squirrel], undefined, true);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_resin], undefined, [upgradesq_twigs]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_diagonal_brassica], undefined, [upgradesq_highest_level]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_leveltime], undefined, [upgradesq_bee_multiplicity]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_berry], undefined, [upgradesq_mushroom]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_fruitmix3], undefined, [upgradesq_flower]);

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_automaton], undefined, true);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_evolution], undefined, true);


////////////////////////////////////////////////////////////////////////////////

STAGE_REGISTER_EVOLUTION = 1;

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_prestiged_berry], undefined, [upgradesq_prestiged_mushroom]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_stinging_multiplicity], undefined, [upgradesq_prestiged_flower]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_fruitmix123], undefined, [upgradesq_watercress_mush]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_squirrel2], undefined, true);

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_fruittierprob2, upgradesq_essence, upgradesq_leveltime], undefined, [upgradesq_seasonfruitprob2, upgradesq_growspeed, upgradesq_bee_multiplicity]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_ethtree, upgradesq_ethtree_diag, upgradesq_highest_level], undefined, [upgradesq_mushroom, upgradesq_berry, upgradesq_flower]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_resin], undefined, [upgradesq_twigs]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_automaton2], undefined, true);

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_diagonal_brassica], [upgradesq_mushroom_multiplicity_boost], [upgradesq_watercresstime2]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_flower], [upgradesq_ethtree2], [upgradesq_flower_multiplicity]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_mushroom], [upgradesq_squirrel], [upgradesq_berry]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_bee], [upgradesq_weather_duration], [upgradesq_nettle]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_automaton], undefined, true);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_evolution2], undefined, true);

////////////////////////////////////////////////////////////////////////////////

STAGE_REGISTER_EVOLUTION = 2;

// NOTE: no upgradesq_ethtree or upgradesq_ethtree2 in this stage, no longer limit positionality in the eth field so much near the center

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_flower, upgradesq_prestiged_flower, upgradesq_flower_multiplicity], undefined, true);

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_nuts], undefined, [upgradesq_infinity_boost]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_watercress_mush], undefined, [upgradesq_watercresstime2]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_fruitmix123], undefined, [upgradesq_fruittierprob3]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_growspeed], undefined, [upgradesq_bee_multiplicity]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_automaton3], undefined, [upgradesq_squirrel3]);

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_eth_all], undefined, true);

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_nuts, upgradesq_mushroom_multiplicity_boost], undefined, [upgradesq_diagonal_brassica, upgradesq_berry_multiplicity_boost]);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_prestiged_mushroom, upgradesq_prestiged_berry], undefined, [upgradesq_mushroom, upgradesq_berry], undefined, true);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_automaton3, upgradesq_resin], undefined, [upgradesq_squirrel3, upgradesq_twigs], undefined, false);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_nettle, upgradesq_stinging_multiplicity], undefined, [upgradesq_weather_duration, upgradesq_bee], undefined, false);
registerSquirrelStage(STAGE_REGISTER_EVOLUTION, [upgradesq_essence, upgradesq_highest_level], undefined, [upgradesq_mushroom_efficiency, upgradesq_leveltime], undefined, false);

registerSquirrelStage(STAGE_REGISTER_EVOLUTION, undefined, [upgradesq_ethtree_diag], undefined, true);


////////////////////////////////////////////////////////////////////////////////


// these values are as bonus, so this means the multiplier is this value + 1 (e.g. bonus 1.5 means +150%, or x2.5)
var squirrel_epoch_prod_bonus = Num(100); // for first squirrel evolution
var squirrel_epoch_prod_bonus2 = Num(200); // for second squirrel evolution
// aka infinity_ascend_bonus
// designed such that once you're at end of the first tier (zinc) after ascend (with half the map full of berries, and 4 flowers), your infinity bonus should be similar to what you had before ascenscion again.
// a reasonable basic field bonus at end of infinity pre-ascend (when having max oranda: 1 black, 3 red, and having maxed basic-field-giving crops given enough resources to afford mistletoe with 10e81 as it was during beta version) is:
//   +1.5B% (multiplier: x15mil)
// a typical post-ascend end-of-zinc-tier infinity to basic field bonus is:
//   +800% (multiplier: x9)
// so we want infinity_ascension_production_bonus * 9 = 15 mil, so that means to set it to roughly 1.5 mil.
// however to make the difference more noticeable, and since production bonus doesn't affect resin/twigs gain as much as you'd think, make it 1 mil
var infinity_ascension_production_bonus = Num(1e6);
var infinity_ascension_resin_bonus = Num(2); // as much as highest tang
var infinity_ascension_twigs_bonus = Num(2); // as much as highest eel

// as Num, in nuts.
// i = current amount of squirrel upgrades gotten
function getSquirrelUpgradeCost(i) {
  if(state.squirrel_evolution == 0) {
    // this uses a large exponential base on purpose: higher tree levels will also give exponentialy more nuts income, so this
    // encourages pushing for high tree levels. The high factor also makes even planting multiple nuts plants not significant compared to getting higher tree levels
    var result = Num(10).powr(i).mulr(1000);
    // squirrel evolution is made only significantly later here, so that there is a certain timespan where all upgrades are active
    if(i >= 33) result.mulrInPlace(1000000);
    return result;
  }
  if(state.squirrel_evolution == 1) {
    // the first one is free at this evolution
    if(i == 0) return Num(0);
    // the last one of evolution 0 costs 1e42, but given the set-back after squirrel reset that's very hard to reach now, 1e39 is quite a bit more reachable
    var result = Num(20).powr(i - 1).mulr(1e39);
    // squirrel evolution is made only significantly later here, so that there is a certain timespan where all upgrades are active
    if(i >= 35) result.mulrInPlace(400);
    return result;
  }
  if(state.squirrel_evolution == 2) {
    // at this evolution, the first one is NOT free since there's only a single choice
    // the last one of evolution 0 costs 172e81, but given the set-back after squirrel reset that's very hard to reach now, make it more reachable
    var result = Num(20).powr(i).mulr(1e78);
    return result;
  }
  return Num(Infinity);
}

function getNextSquirrelUpgradeCost() {
  return getSquirrelUpgradeCost(state.squirrel_upgrades_count);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var ambercost_squirrel_respec = Num(15);
var ambercost_prod = Num(20);
var ambercost_lengthen = Num(20);
var ambercost_shorten = Num(20);
var ambercost_keep_season = Num(30);
var ambercost_end_keep_season = Num(0);
var ambercost_reset_choices = Num(15);

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function applyPrestige(crop_id, prestige) {
  var c = crops[crop_id];
  var c2 = state.crops[crop_id];


  c2.prestige = prestige;
  //c2.known = Math.max(c2.prestige + 1, c2.known);
  updatePrestigeData(crop_id);

  var replacements = templates_for_type;
  if(state.challenge == challenge_nodelete) replacements = ghosts_for_type;

  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(!f.hasCrop()) continue;
      if(f.cropIndex() == crop_id) {
        f.index = 0;
        if(replacements[c.type]) f.index = CROPINDEX + replacements[c.type];
        f.growth = 0;
      }
    }
  }

  if(c.basic_upgrade != null) {
    var u = upgrades[c.basic_upgrade];
    var u2 = state.upgrades[c.basic_upgrade];
    u2.count = 0;
  }
}

function updatePrestigeData(crop_id) {
  var c = crops[crop_id];
  var c2 = state.crops[crop_id];
  if(c.cached_prestige_ == c2.prestige) return; // already up to date

  c.cached_prestige_ = c2.prestige;

  var oldtier = c.tier;
  if(c.type == CROPTYPE_BERRY) {
    if(c.tier < 0) return; // doesn't work for templates
    var tier = (c.tier & 15);
    var tier2 = tier + c2.prestige * num_tiers_per_crop_type[c.type];
    c.cost = getBerryCost(tier2);
    c.prod = getBerryProd(tier2);
    c.tier = tier2;

    if(c.basic_upgrade != null) {
      var u = upgrades[c.basic_upgrade];
      var u2 = state.upgrades[c.basic_upgrade];
      setCropMultiplierCosts(u, c);
    }
    c.planttime = c.planttime0 * (1 + 3 * c2.prestige);
  }
  if(c.type == CROPTYPE_FLOWER) {
    if(c.tier < 0) return; // doesn't work for templates
    var tier = (c.tier & 7);
    var tier2 = tier + c2.prestige * num_tiers_per_crop_type[c.type];
    c.cost = getFlowerCost(tier2);
    c.boost = getFlowerBoost(tier2);
    c.tier = tier2;

    if(c.basic_upgrade != null) {
      var u = upgrades[c.basic_upgrade];
      var u2 = state.upgrades[c.basic_upgrade];
      setBoostMultiplierCosts(u, c);
    }
    c.planttime = c.planttime0 * (1 + c2.prestige);
  }
  if(c.type == CROPTYPE_MUSH) {
    if(c.tier < 0) return; // doesn't work for templates
    var tier = (c.tier & 7);
    var tier2 = tier + c2.prestige * num_tiers_per_crop_type[c.type];
    c.cost = getMushroomCost(tier2);
    c.prod = getMushroomProd(tier2);
    c.tier = tier2;

    if(c.basic_upgrade != null) {
      var u = upgrades[c.basic_upgrade];
      var u2 = state.upgrades[c.basic_upgrade];
      setCropMultiplierCosts(u, c);
    }
    c.planttime = c.planttime0 * (1 + c2.prestige);
  }
  if(c.type == CROPTYPE_NUT) {
    if(c.tier < 0) return; // doesn't work for templates
    var tier = (c.tier & 15);
    var tier2 = tier + c2.prestige * num_tiers_per_crop_type[c.type];
    c.cost = getNutCost(tier2);
    c.prod = getNutProd(tier2);
    c.tier = tier2;

    if(c.basic_upgrade != null) {
      var u = upgrades[c.basic_upgrade];
      var u2 = state.upgrades[c.basic_upgrade];
      setCropMultiplierCosts(u, c);
    }
    c.planttime = c.planttime0 * (1 + c2.prestige);
  }
  var newtier = c.tier;
  croptype_tiers[c.type][oldtier] = undefined;
  croptype_tiers[c.type][newtier] = crops[crop_id];
}

function updateAllPrestigeData() {
  for(var i = 0; i < num_tiers_per_crop_type[CROPTYPE_BERRY]; i++) {
    updatePrestigeData(berry_0 + i);
  }
  for(var i = 0; i < num_tiers_per_crop_type[CROPTYPE_MUSH]; i++) {
    updatePrestigeData(mush_0 + i);
  }
  for(var i = 0; i < num_tiers_per_crop_type[CROPTYPE_FLOWER]; i++) {
    updatePrestigeData(flower_0 + i);
  }
  for(var i = 0; i < num_tiers_per_crop_type[CROPTYPE_NUT]; i++) {
    updatePrestigeData(nut_0 + i);
  }
}

////////////////////////////////////////////////////////////////////////////////

function canUseBluePrintsDuringChallenge(challenge, opt_print_message) {
  var wither_incomplete = challenge == challenge_wither && state.challenges[challenge_wither].completed < 2;
  if(wither_incomplete) {
    if(opt_print_message) showMessage('blueprints are disabled during the wither challenge, for now...', C_INVALID);
    return false;
  }

  if(challenge == challenge_nodelete) {
    if(opt_print_message) showMessage('blueprints are disabled during the undeletable challenge, instead carefully plant crops 1 by 1 since you can never delete them', C_INVALID);
    return false;
  }

  if(challenge == challenge_bees) {
    if(opt_print_message) showMessage('blueprints are disabled during the bee challenge', C_INVALID);
    return false;
  }

  if(challenge == challenge_truly_basic) {
    if(opt_print_message) showMessage('blueprints are disabled during the truly basic challenge', C_INVALID);
    return false;
  }

  /*if(challenge == challenge_towerdefense) {
    if(opt_print_message) showMessage('blueprints are disabled during the tower defense challenge', C_INVALID);
    return false;
  }*/

  return true;
}

////////////////////////////////////////////////////////////////////////////////

var maxrecentweighedleveltime = 120;
var maxrecentweighedleveltime_between = 10;

// for the "time at level" bonus: is weighted with previous level durations to make a single tree level-up event not wipe the entire bonus
// opt_fern: if true, may use state.recentweighedleveltime if better, to allow a recent value before tree just started leveling a lot to still be useful for fern for a few minutes (see state.recentweighedleveltime description)
function weightedTimeAtLevel(opt_fern) {
  var a = timeAtTreeLevel(state);
  var b = state.prevleveltime[0];
  var c = 0.66 * state.prevleveltime[1];
  var d = 0.33 * state.prevleveltime[2];
  var result = Math.max(Math.max(a, b), Math.max(c, d));

  if(opt_fern) {
    if(state.time < state.recentweighedleveltime_time + maxrecentweighedleveltime) {
      // the weighed level time as it coasted through tree levelups that happened in fast succession
      result = Math.max(result, state.recentweighedleveltime[0]);
    }
    if(state.time < state.lasttreeleveluptime + maxrecentweighedleveltime) {
      // the weighted time from the previous level, still used now if the tree leveled recently (as it may coast through to next tree level if next level follows fast)
      result = Math.max(result, state.recentweighedleveltime[1]);
    }
  }

  return result;
}

////////////////////////////////////////////////////////////////////////////////

function showSquirrelEvolutionDialog() {
  var icon = state.squirrel_evolution ? image_squirrel_evolution2 : image_squirrel_evolution;
  var dialog = createDialog({
    icon:icon,
    size:DIALOG_MEDIUM,
    functions:function() {
      addAction({type:ACTION_SQUIRREL_EVOLUTION});
    },
    names:'evolution',
    cancelname:'cancel',
    title:'Squirrel evolution'
  });
  dialog.content.div.innerHTML = getSquirrelEvolutionHelp(state.squirrel_evolution + 1);
  unlockRegisteredHelpDialog(39);
}

function performSquirrelEvolution() {
  if(state.squirrel_evolution + 1 >= squirrel_stages.length) return; // doesn't exist

  state.squirrel_evolution++;

  state.nuts_before = state.squirrel_upgrades_spent.add(state.res.nuts);
  state.res.nuts = Num(0);
  state.squirrel_upgrades_spent = Num(0);

  state.initSquirrelStages();
  state.initEvolutionAndHatImages();

  for(var i = 0; i < registered_squirrel_upgrades.length; i++) {
    state.squirrel_upgrades[registered_squirrel_upgrades[i]] = new SquirrelUpgradeState();
  }

  state.just_evolution = true;
  state.seen_evolution = false;

  computeDerived(state);

  squirrel_scrollpos = undefined;
  updateSquirrelUI();
}

////////////////////////////////////////////////////////////////////////////////



function MistletoeUpgrade() {
  this.index = 0;

  this.evo = 0; // which mistletoe evolution level is required to see this upgrade

  this.name = 'a';
  this.description = '';
  this.effectname = '';

  this.basetime = 3600; // hos much time the first upgrade of this costs. Next upgrades cost a multiple of this.

  this.bonus = Num(0.1); // bonus per level

  this.onetime = false; // if true, is a one-time upgrade rather than repeatable

  this.getTime = function() {
    var m2 = state.mistletoeupgrades[this.index];
    return this.basetime * (m2.num + 1);
  };

  // returns undefined if there is no resrouce cost.
  // otherwise, may be overridden to give resource cost based on level to upgrade to
  this.getResourceCostForLevel_ = function(level) {
    return undefined;
  };

  this.getResourceCost = function() {
    var m2 = state.mistletoeupgrades[this.index];
    return this.getResourceCostForLevel_(m2.num + 1);
  };

  // return the sum of all resource cost up to and including given level, only defined for those where getResourceCost doesn't return undefined
  // used for display purposes only
  this.getResourceCostToReachLevel = function(level) {
    return undefined;
  };
};

var registered_mistles = [];
var mistletoeupgrades = [];

// 16-bit ID, auto incremented with registerMistle, but you can also set it to a value yourself, to ensure consistent IDs for various crops (between savegames) in case of future upgrades
var mistle_register_id = 0;

function registerMistletoeUpgrade(name, effectname, bonus, evo, basetime, description) {
  var mistle = new MistletoeUpgrade();
  mistle.index = mistle_register_id++;

  mistletoeupgrades[mistle.index] = mistle;
  registered_mistles.push(mistle.index);

  if(bonus != undefined) {
    description = description.replace('%BONUS%', bonus.toPercentString());
  }

  mistle.name = name;
  mistle.effectname = effectname;
  mistle.bonus = bonus;
  mistle.evo = evo;
  mistle.basetime = basetime;
  mistle.description = description;

  return mistle.index;
}

function registerOneTimeMistletoeUpgrade(name, evo, time, description) {
  var index = registerMistletoeUpgrade(name, undefined, undefined, evo, time, description);

  var mistle = mistletoeupgrades[index];
  mistle.onetime = true;
  return index;
}

// a twigs bonus that's given for having the ethereal mistletoe in the first place, even without any upgrades
var mistle_main_twigs_bonus = Num(0.15);

var mistle_upgrade_evolve = registerMistletoeUpgrade('evolve', '', Num(0.1), 0, 3600 * 24, 'Evolves the ethereal mistletoe. Does not reset anything (existing upgrades stay). At some levels unlocks new types of bonuses. Gives an extra %BONUS% bonus to the other bonuses except those that give resin or twigs (additive with evolution levels)');

var mistle_upgrade_prod = registerMistletoeUpgrade('leafiness', 'production', Num(0.07), 0, 3600, 'Gives a %BONUS% production bonus per level to the main field');

var mistle_upgrade_mistle_neighbor = registerMistletoeUpgrade('friendliness', 'neighbors', Num(0.07), 1, 3600, 'Gives a %BONUS% bonus to orthogonally or diagonally neighboring ethereal crops to the ethereal mistletoe, to any type that can receive bonus from lotuses (but not to lotuses themselves)');

var mistle_upgrade_stingy = registerMistletoeUpgrade('stinginess', 'stingy', Num(0.07), 5, 3600, 'Gives a %BONUS% bonus to stingy crops (for spore production) per level');

var mistle_upgrade_mush = registerMistletoeUpgrade('funginess', 'mushrooms', Num(0.07), 9, 3600, 'Gives a %BONUS% bonus to mushrooms (both production and consumption) per level');

var mistle_upgrade_berry = registerMistletoeUpgrade('berry-ness', 'berries', Num(0.07), 11, 3600, 'Gives a %BONUS% bonus to berry seed production per level');

var mistle_upgrade_lotus_neighbor = registerMistletoeUpgrade('lotus neighbors', 'lotuses', Num(0.03), 12, 3600, 'Gives a %BONUS% bonus to lotuses that are orthogonally or diagonally neighboring an etherael mistletoe ');

var mistle_upgrade_nuts = registerMistletoeUpgrade('nuttiness', 'nuts', Num(0.05), 10, 3600, 'Gives a %BONUS% bonus to nuts per level');

var mistle_upgrade_brassica = registerMistletoeUpgrade('brassiness', 'brassica', Num(0.05), 14, 3600, 'Gives a %BONUS% bonus to brassica copying per level');

var mistle_upgrade_bee = registerMistletoeUpgrade('buzziness', 'bee', Num(0.05), 15, 3600, 'Gives a %BONUS% bonus to bee bonus per level');

// mistletoe upgrades that also cost other resources. Give higher id so they show up more to the bottom in the UI
// NOTE: this id distionction became pointless since mistle_upgrade_squirrel_neighbor was accidently added after this list, but the UI shows it in an id-independent order already anyway
mistle_register_id = 50;

var mistle_upgrade_resin = registerMistletoeUpgrade('sappiness', 'resin', Num(0.1), 3, 3600, 'Gives a %BONUS% bonus to resin production per level'); // sappiness as in tree sap
mistletoeupgrades[mistle_upgrade_resin].getResourceCostForLevel_ = function(level) {
  return Res({twigs:100e15}).mul(Num.pow(new Num(2), new Num(level - 1)));
};
mistletoeupgrades[mistle_upgrade_resin].getResourceCostToReachLevel = function(level) {
  var result = this.getResourceCostForLevel_(level + 1);
  result.twigs.subrInPlace(100e15);
  return result;
};

var mistle_upgrade_twigs = registerMistletoeUpgrade('twigginess', 'twigs', Num(0.1), 7, 3600, 'Gives a %BONUS% bonus to twigs production per level');
mistletoeupgrades[mistle_upgrade_twigs].getResourceCostForLevel_ = function(level) {
  return Res({resin:1e18}).mul(Num.pow(new Num(2), new Num(level - 1)));
};
mistletoeupgrades[mistle_upgrade_twigs].getResourceCostToReachLevel = function(level) {
  var result = this.getResourceCostForLevel_(level + 1);
  result.resin.subrInPlace(1e18);
  return result;
};

var mistle_upgrade_squirrel_neighbor = registerMistletoeUpgrade('squirrel friendliness', 'neighbors', Num(0.07), 13, 3600, 'Gives a %BONUS% bonus to ethereal crops that orthogonally or diagonally neighbor the ethereal squirrel, for crops of any type that can receive bonus from lotuses (but not to lotuses themselves)');
var mistle_upgrade_automaton_florality = registerMistletoeUpgrade('automaton florality', 'lotuses', Num(0.05), 16, 3600, 'Gives a %BONUS% bonus to ethereal lotuses that orthogonally or diagonally neighbor the ethereal automaton');


//one-time mistletoe upgrades
mistle_register_id = 100;

var mistle_upgrade_second_mistletoe = registerOneTimeMistletoeUpgrade('second mistletoe', 13, 3 * 24 * 3600, 'You can plant a second mistletoe in the ethereal field. This does not allow doing more upgrades, but allows more ethereal plants (including lotuses) to receive mistletoe neighbor boost. Multiple mistletoe bonuses do not stack to the same neighbor (not even additively), so the mistletoes should be spread out (but still next to tree to work) for best effect');
//function registerMistletoeUpgrade(name, effectname, bonus, evo, basetime, description) {

var mistle_upgrade_wayfaring_mistle = registerOneTimeMistletoeUpgrade('wayfaring mistletoe', 15, 2 * 24 * 3600, 'Ethereal mistletoe no longer has to be placed next to the tree, it can go anywhere');


////////////////////////////////////////////////////////////////////////////////

// sort order for showing in UI
var mistle_sort_order = util.clone(registered_mistles); // sort works in-place so must make copy. toSorted can do this in one go but is not supported in firefox 112.
mistle_sort_order.sort(function(ia, ib) {
  var a = mistletoeupgrades[ia];
  var b = mistletoeupgrades[ib];
  var a_res = (ia == mistle_upgrade_resin || ia == mistle_upgrade_twigs);
  var b_res = (ib == mistle_upgrade_resin || ib == mistle_upgrade_twigs);
  if(a.onetime != b.onetime) {
    // the one-time upgrades should show up the very last
    return a.onetime - b.onetime;
  }
  if(a_res != b_res) {
    // the ones that cost extra resources (twigs, resin, ...) are shown at the end of the list, despite their evolution unlock order
    return a_res - b_res;
  }
  if(a.evo != b.evo) {
    return a.evo - b.evo;
  }
  return a.index - b.index;
});

////////////////////////////////////////////////////////////////////////////////

function getEtherealMistletoeEvolutionLevel() {
  return state.mistletoeupgrades[mistle_upgrade_evolve].num;
}

function getEtherealMistletoeEvolutionBonus() {
  return mistletoeupgrades[mistle_upgrade_evolve].bonus.mulr(getEtherealMistletoeEvolutionLevel());
}

function getEtherealMistletoeEvolutionBonusFor(index) {
  if(index == mistle_upgrade_twigs || index == mistle_upgrade_resin) return Num(0);
  return getEtherealMistletoeEvolutionBonus();
}

function getEtherealMistletoeTwigsBonus() {
  var result = mistle_main_twigs_bonus.add(mistletoeupgrades[mistle_upgrade_twigs].bonus.mulr(state.mistletoeupgrades[mistle_upgrade_twigs].num));
  result.mulInPlace(getEtherealMistletoeEvolutionBonusFor(mistle_upgrade_twigs).addr(1));
  return result;
}

// includes what evolution adds to it
function getEtherealMistletoeBonus(index) {
  if(index == mistle_upgrade_evolve) return getEtherealMistletoeEvolutionBonus();
  if(index == mistle_upgrade_twigs) return getEtherealMistletoeTwigsBonus();
  var result = mistletoeupgrades[index].bonus.mulr(state.mistletoeupgrades[index].num);
  result.mulInPlace(getEtherealMistletoeEvolutionBonusFor(index).addr(1));
  return result;
}

function getEtherealMistleToeBonusWithEvoString(index) {
  if(index == mistle_upgrade_evolve) return getEtherealMistletoeEvolutionBonus().toPercentString();
  var base = mistletoeupgrades[index].bonus.mulr(state.mistletoeupgrades[index].num);
  if(index == mistle_upgrade_twigs) base.addInPlace(mistle_main_twigs_bonus);
  var result = '';
  result += base.toPercentString();
  var evo = getEtherealMistletoeEvolutionBonusFor(index);
  if(evo.neqr(0)) {
    //result += ' with ' + evo.toPercentString() + ' evo = ' + getEtherealMistletoeBonus(index).toPercentString();
    result += ', with evo: ' + getEtherealMistletoeBonus(index).toPercentString();
  }
  return result;
}


function knowEtherealMistletoeUpgrade(index) {
  if(index == mistle_upgrade_evolve) return true;
  return getEtherealMistletoeEvolutionLevel() >= mistletoeupgrades[index].evo;
}

// returns how many you have, only if you also have the mistletoe in the ethereal field (with some exceptions)
// does NOT prevent basic challenge, you must have other checks for that (these bonuses should not work during basic challenge)
function haveEtherealMistletoeUpgrade(index) {
  if(!knowEtherealMistletoeUpgrade(index)) return 0;
  if(index != mistle_upgrade_second_mistletoe && index != mistle_upgrade_wayfaring_mistle && !haveEtherealMistletoe()) return 0; // this also returns 0 if having it but it's not next to tree
  return state.mistletoeupgrades[index].num;
}

// similar to haveEtherealMistletoeUpgrade, but also returns effect if you don't het have the upgrade but the mistletoe gives it from the beginning. That is, the twigs bonus.
function haveEtherealMistletoeEffect(index) {
  if(!haveEtherealMistletoe()) return false; // this also returns 0 if having it but it's not next to tree
  if(index == mistle_upgrade_twigs) return true;
  return !!haveEtherealMistletoeUpgrade(index);
}

// returns at which next evolution level a new upgrade unlocks, or -1 if none
function etherealMistletoeNextEvolutionUnlockLevel() {
  var result = -1;
  var curr = getEtherealMistletoeEvolutionLevel();
  for(var i = 0; i < registered_mistles.length; i++) {
    var u = mistletoeupgrades[registered_mistles[i]];
    if(u.evo <= curr) continue;
    if(result >= 0 && u.evo > result) continue;
    result = u.evo;
  }
  return result;
}

// whether the ethereal mistletoe supports being diagonally next to the tree
function etherealMistletoeSupportsTreeDiagonal() {
  // currently always false, no upgrade enables this yet. Note that it would be not super powerful to have this ability, but it could be convenient.
  return false;
}

// whether the ethereal mistletoe has no more placement restrictions related to the tree
function etherealMistletoeCanGoAnywhere() {
  return haveEtherealMistletoeUpgrade(mistle_upgrade_wayfaring_mistle);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function Crop3() {
  this.name = 'a';
  this.cost = Res();
  this.prod = Res(); // production to infinity field
  this.index = 0;
  this.planttime = 0;
  this.basicboost = Num(0); // to basic field
  this.infboost = Num(0); // to infinity field

  this.type = undefined;
  this.tier = 0;

  this.tagline = '';
  this.image = undefined;
};



// the _b versions start at the gold tier and are a more significant cost increase, amongst other reasons, because you only need 4 or so berries for a good layout with flowers/bees so having a small cost scaling is too insignificant
var sameTypeCostMultiplier3 = 1.1;
var sameTypeCostMultiplier3_b = 4;
var sameTypeCostMultiplier3_flower = 1.25;
var sameTypeCostMultiplier3_flower_b = 2;
var sameTypeCostMultiplier3_bee = 2;
var sameTypeCostMultiplier3_bee_b = 4;
var sameTypeCostMultiplier3_runestone = 1000;
var sameTypeCostMultiplier3_mushroom = 10;
var sameTypeCostMultiplier3_mushroom_b = 100; // for the translucent mushroom, which has to remain relevant through 4 tiers
var sameTypeCostMultiplier3_fern = 2;
var sameTypeCostMultiplier3_lotus = 7;
var cropRecoup3 = 1.0; // 100% resin recoup. But deletions are limited through max amount of deletions per season instead

Crop3.prototype.isReal = function() {
  return !this.istemplate && !this.isghost;
};

Crop3.prototype.getBaseCost = function() {
  if(state.infinity_ascend) {
    if(this.tier == 0) return this.cost.mulr(1000); // only the first tier goes at original speed
    if(this.tier == 1) return this.cost.mulr(1125); // ramp up to the slower speed of the next tiers
    return this.cost.mulr(1250);
  }
  return this.cost;
};

// opt_force_count, if not undefined, overrides anything, including opt_adjust_count
Crop3.prototype.getCost = function(opt_adjust_count, opt_force_count) {
  var basecost = this.getBaseCost();

  if(this.type == CROPTYPE_BRASSICA) return basecost;

  var count = state.crop3count[this.index] + (opt_adjust_count || 0);
  if(opt_force_count != undefined) count = opt_force_count;

  if(this.type == CROPTYPE_RUNESTONE) {
    // the cost progression here is:
    // 1: base
    // 2: base * 1e3
    // 3: base * 1e9
    // 4: base * 1e18
    // 5: base * 1e30
    // etc... (so first it goes x1000, then x1 million, then x1 billion, etc...)
    var t = (count * (count + 1)) >> 1;
    //if(count == 7) return new Res({infseeds:Num(500e80)});
    if(count == 7) t = 23; // there are 8 runestone achievements. to make the 8th one plantable before infinity field ascend, adjust this price to a cheaper one, otherwise it's never affordable and the achievement could never be gotten
    return basecost.mul(Num.rpowr(sameTypeCostMultiplier3_runestone, t));
  }

  var mul = (this.tier < 4) ? sameTypeCostMultiplier3 : sameTypeCostMultiplier3_b;
  if(this.type == CROPTYPE_FLOWER) mul = (this.tier < 4) ? sameTypeCostMultiplier3_flower : sameTypeCostMultiplier3_flower_b;
  if(this.type == CROPTYPE_BEE) mul = (this.tier < 7) ? sameTypeCostMultiplier3_bee : sameTypeCostMultiplier3_bee_b;
  if(this.type == CROPTYPE_MUSH) mul = (this.tier == -1) ? sameTypeCostMultiplier3_mushroom_b : sameTypeCostMultiplier3_mushroom;
  if(this.type == CROPTYPE_FERN) mul = sameTypeCostMultiplier3_fern;
  if(this.type == CROPTYPE_LOTUS) mul = sameTypeCostMultiplier3_lotus;
  var countfactor = Math.pow(mul, count);
  return basecost.mulr(countfactor);
};


// f: optional field cell, if given takes growth into account in case of short-lived crop
// opt_adjust_count: added to current crop count to compute recoup in case another amount of crops is present
Crop3.prototype.getRecoup = function(f, opt_adjust_count) {
  var adjust = opt_adjust_count || 0;
  var result = this.getCost(adjust - 1).mulr(cropRecoup3);
  if(f && this.type == CROPTYPE_BRASSICA) {
    result.mulrInPlace(Math.min(Math.max(0, f.growth), 1));
  }
  return result;
};


Crop3.prototype.getPlantTime = function() {
  if(state.infinity_ascend && this.type == CROPTYPE_BRASSICA) {
    return this.planttime * 1.5; // the lifetime, in this case. Increased 1.5x even though the costs are relatively only up to 1.25x, a small bonus to make this part about post-ascend infinity a bit more convenient
  }
  return this.planttime;
};

Crop3.prototype.getBaseProd = function() {
  if(state.infinity_ascend) {
    return this.prod.mulr(1000);
  }
  return this.prod;
};


Crop3.prototype.getProd = function(f, breakdown) {
  var result = this.getBaseProd().clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  // flower boost for berry/nut
  if(f && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_NUT)) {
    var flowermul = new Num(1);
    var num = 0;

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw3 || y2 < 0 || y2 >= state.numh3) continue;
      var n = state.field3[y2][x2];
      if(n.hasCrop() /*&& n.isFullGrown()*/ && crops3[n.cropIndex()].type == CROPTYPE_FLOWER) {
        var boost = crops3[n.cropIndex()].getInfBoost(n);
        if(boost.neqr(0)) {
          flowermul.addInPlace(boost);
          num++;
        }
      }
    }
    if(num) {
      result.mulInPlace(flowermul);
      if(breakdown) breakdown.push(['flowers (' + num + ')', true, flowermul, result.clone()]);
    }
  }

  // lotus boost for berry/nut
  if(f && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_NUT)) {
    var lotusmul = new Num(1);
    var num = 0;

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw3 || y2 < 0 || y2 >= state.numh3) continue;
      var n = state.field3[y2][x2];
      if(n.hasCrop() /*&& n.isFullGrown()*/ && crops3[n.cropIndex()].type == CROPTYPE_LOTUS && crops3[n.cropIndex()].tier == this.tier) {
        var boost = crops3[n.cropIndex()].getInfBoost(n);
        if(boost.neqr(0)) {
          lotusmul.addInPlace(boost);
          num++;
        }
      }
    }
    if(num) {
      result.mulInPlace(lotusmul);
      if(breakdown) breakdown.push(['lotuses (' + num + ')', true, lotusmul, result.clone()]);
    }
  }

  // goldfish
  if(result.infseeds.neqr(0) && (state.fishes[goldfish_0].unlocked)) {
    var mul = getFishMultiplier(FISHTYPE_GOLDFISH, state, 3);
    var have_fish = mul.neqr(1);
    if(have_fish) result.infseeds.mulInPlace(mul);
    var give_warning = !have_fish && state.g_res.infspores.gt(fishes[goldfish_0].cost.infspores.mulr(2));
    if(breakdown) breakdown.push(['goldfish' + (give_warning ? ' (have 0, put some in the pond!)' : ''), true, mul, result.clone()]);
  }

  // octopus
  if(result.infspores.neqr(0) && state.fishes[octopus_0].unlocked) {
    var mul = getFishMultiplier(FISHTYPE_OCTOPUS, state, 3);
    var have_fish = mul.neqr(1);
    if(have_fish) result.infspores.mulInPlace(mul);
    var give_warning = !have_fish && state.g_res.infspores.gt(fishes[octopus_0].cost.infspores.mulr(2));
    if(breakdown) breakdown.push(['octopus' + (give_warning ? ' (have 0, put some in the pond!)' : ''), true, mul, result.clone()]);
  }

  // puffer fish
  // for berries, but also for nuts, nuts behave just like berries in infinity field
  if((this.type == CROPTYPE_BERRY || this.type == CROPTYPE_NUT) && state.fishes[puffer_0].unlocked) {
    var mul = getFishMultiplier(FISHTYPE_PUFFER, state, 3);
    var have_fish = mul.neqr(1);
    if(have_fish) result.infseeds.mulInPlace(mul);
    var give_warning = !have_fish && state.g_res.infspores.gt(fishes[puffer_0].cost.infspores.mulr(2));
    if(breakdown) breakdown.push(['puffer fish' + (give_warning ? ' (have 0, put some in the pond!)' : ''), true, mul, result.clone()]);
  }

  // jellyfish: pond neighbor bonus
  if(f && state.fishes[jellyfish_t].had) {
    // any type that produces infseeds or infspores
    if(this.type == CROPTYPE_BERRY || this.type == CROPTYPE_NUT || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_BRASSICA) {
      var mul = getFishMultiplier(FISHTYPE_JELLYFISH, state, 3);
      var have_fish = mul.neqr(1);
      if(have_fish) {
        // limit the multiplier for brassica, because there's a finely tuned balance between brassica lifetime and production, that is already made harder by shrimp
        // this limit only affects late post-ascend infinity field, since one couldn't get that many jellyfish before having the non-translucent mushrooms
        if(this.type == CROPTYPE_BRASSICA && mul.gtr(1.25)) mul = new Num(1.25);
        var have_pond = false;
        // check if next to pond, orthogonally and diagonally
        for(var dir = 0; dir < 8; dir++) { // get the neighbors N,E,S,W,NE,SE,SW,NW
          var x2 = f.x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
          var y2 = f.y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
          if(x2 < 0 || x2 >= state.numw3 || y2 < 0 || y2 >= state.numh3) continue;
          var n = state.field3[y2][x2];
          if(n.index == FIELD_POND) {
            have_pond = true;
            break;
          }
        }
        if(have_pond) {
          result.mulInPlace(mul); // both infspores and infseeds
          if(breakdown) breakdown.push(['jellyfish: next to pond', true, mul, result.clone()]);
        }
      }
    }
  }

  // flower boost for mushroom: does not use getInfBoost, but depends on relative tier
  if(f && this.type == CROPTYPE_MUSH) {
    var floweronlymul = new Num(1);
    var flowerbeemul = new Num(1);
    var numflowers = 0; // flowers
    var numbees = 0; // bees through flowers

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw3 || y2 < 0 || y2 >= state.numh3) continue;
      var n = state.field3[y2][x2];
      if(n.hasCrop() /*&& n.isFullGrown()*/ && crops3[n.cropIndex()].type == CROPTYPE_FLOWER) {
        var c2 = crops3[n.cropIndex()];
        if(c2.tier >= this.tier - 1) {
          var boost = new Num(1);
          if(this.tier == -1) {
            if(c2.tier > this.tier) boost = new Num(c2.tier - this.tier); // translucent mushroom goes through more flower tiers
          } else if(c2.tier <= this.tier - 1) {
            boost = new Num(0.5);
          } else if(c2.tier >= this.tier + 1) {
            boost = new Num(1.5);
          }
          if(boost.neqr(0)) {
            floweronlymul.addInPlace(boost);
            numflowers++;

            var beeboost = new Num(1);
            // bees neighboring the flower add another, albeit small, boost
            for(var dir2 = 0; dir2 < 4; dir2++) { // get the neighbors N,E,S,W
              var x3 = x2 + (dir2 == 1 ? 1 : (dir2 == 3 ? -1 : 0));
              var y3 = y2 + (dir2 == 2 ? 1 : (dir2 == 0 ? -1 : 0));
              if(x3 < 0 || x3 >= state.numw3 || y3 < 0 || y3 >= state.numh3) continue;
              var n2 = state.field3[y3][x3];
              if(n2.hasCrop() /*&& n.isFullGrown()*/ && crops3[n2.cropIndex()].type == CROPTYPE_BEE) {
                var c3 = crops3[n2.cropIndex()];
                if(c3.tier >= this.tier - 1) {
                  var boost2 = new Num(0.5);
                  if(c3.tier <= this.tier - 1) boost2 = new Num(0.25);
                  // the +3 and +4 cases are for silver and electrum beehive to translucent mushroom, to still see some difference there. That's the only case where such extreme tier differences can naturally occur. The +2 case does not occur naturally and so its difference is made very small to have some more spread in the +3/+4 case.
                  else if(c3.tier >= this.tier + 4) boost2 = new Num(1.0);
                  else if(c3.tier >= this.tier + 3) boost2 = new Num(0.77);
                  else if(c3.tier >= this.tier + 2) boost2 = new Num(0.76);
                  else if(c3.tier >= this.tier + 1) boost2 = new Num(0.75);
                  if(boost2.neqr(0)) {
                    beeboost.addInPlace(boost2);
                    numbees++;
                  }
                }
              }
            }
            boost.mulInPlace(beeboost);
            flowerbeemul.addInPlace(boost);
          } // end of 'boost.neqr(0)' for flower
        }
      }
    }
    if(numflowers) {
      // the below is same as doing just flowerbeemul, but, separately show flowers and bees in the breakdown, hence this mechanism
      // NOTE: to understand the numbers: say there's one flower givin 100% boost (so doing x2), and one beehive giving 50% boost (so doing x1.5),
      // then the breakdown will show +100% for flowers, +25% for bees (instead of +50%). Reason: bee gives 50% to flower's boost, so flower now gives 150% boost total (doing x2.5).
      // therefore, you now get x2.5 instead of x2, which is 25% more. That's because all is expressed as bonus percentages to the mushroom, not to the flower.
      // in case of multiple flowers/bees, this is all aggregated together.
      var beeonlymul = flowerbeemul.div(floweronlymul);
      result.mulInPlace(floweronlymul);
      if(breakdown) breakdown.push(['flower tiers (' + numflowers + ')', true, floweronlymul, result.clone()]);

      // sea anemone through flower to mushrooms
      // NOTE: unlike for seeds, where these multipliers are indicated in the flower or bee, for spores it's indicated in the mushroom itself, the flower multiplier is not the same as what it is for seeds (it's less, and relative tier dependent)
      if(state.fishes[anemone_0].unlocked) {
        var mul = getFishMultiplier(FISHTYPE_ANEMONE, state, 3);
        var have_fish = mul.neqr(1);
        if(have_fish) result.mulInPlace(mul);
        var give_warning = !have_fish && state.g_res.infspores.gt(fishes[anemone_0].cost.infspores.mulr(2));
        if(breakdown) breakdown.push(['sea anemones' + (give_warning ? ' (have 0, put some in the pond!)' : ' (through flowers)'), true, mul, result.clone()]);
      }

      result.mulInPlace(beeonlymul);
      if(breakdown) breakdown.push(['bee tiers (' + numbees + ')', true, beeonlymul, result.clone()]);

      // leporinus through bees to mushrooms
      // NOTE: unlike for seeds, where these multipliers are indicated in the flower or bee, for spores it's indicated in the mushroom itself, the multiplier is not the same as what it is for seeds (it's less, and relative tier dependent)
      if(numbees && state.fishes[leporinus_0].unlocked) {
        var mul = getFishMultiplier(FISHTYPE_LEPORINUS, state, 3);
        var have_fish = mul.neqr(1);
        var beemul_before = beeonlymul;
        var beemul_after = (beeonlymul.subr(1)).mul(mul).addr(1);
        mul = beemul_after.div(beemul_before);
        if(have_fish) result.mulInPlace(mul);
        var give_warning = !have_fish && state.g_res.infspores.gt(fishes[leporinus_0].cost.infspores.mulr(2));
        if(breakdown) breakdown.push(['leporinus' + (give_warning ? ' (have 0, put some in the pond!)' : ' (fish, through bees)'), true, mul, result.clone()]);
      }
    }
  }

  // lotus boost for mushroom: only for same tier
  if(f && this.type == CROPTYPE_MUSH) {
    var lotusmul = new Num(1);
    var numlotuses = 0; // flowers

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw3 || y2 < 0 || y2 >= state.numh3) continue;
      var n = state.field3[y2][x2];
      if(n.hasCrop() /*&& n.isFullGrown()*/ && crops3[n.cropIndex()].type == CROPTYPE_LOTUS) {
        var c2 = crops3[n.cropIndex()];
        if(c2.tier == this.tier) {
          var boost = new Num(1);
          lotusmul.addInPlace(boost);
          numlotuses++;
        }
      }
    }
    if(numlotuses) {
      result.mulInPlace(lotusmul);
      if(breakdown) breakdown.push(['lotus (' + numlotuses + ')', true, lotusmul, result.clone()]);
    }
  }

  // stinging boost to mushroom: similar to flowers, the boost is affected by the tier
  if(f && this.type == CROPTYPE_MUSH) {
    var stingingmul = new Num(1);
    var num = 0; // stinging

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw3 || y2 < 0 || y2 >= state.numh3) continue;
      var n = state.field3[y2][x2];
      if(n.hasCrop() /*&& n.isFullGrown()*/ && crops3[n.cropIndex()].type == CROPTYPE_STINGING) {
        var c2 = crops3[n.cropIndex()];
        if(c2.tier >= this.tier - 1) {
          var boost = c2.infboost;
          if(c2.tier <= this.tier - 1) boost = boost.mulr(0.2);
          if(c2.tier >= this.tier + 1) boost = boost.mulr(2);
          if(boost.neqr(0)) {
            stingingmul.addInPlace(boost);
            num++;
          }
        }
      }
    }
    if(num) {
      result.mulInPlace(stingingmul);
      if(breakdown) breakdown.push(['stinging crops tiers (' + num + ')', true, stingingmul, result.clone()]);
    }
  }

  // fern of same tier
  var ferncrop = fern3_7 + this.tier - 7;
  if(!!crops3[ferncrop] && state.crop3count[ferncrop]) {
    var num = state.crop3count[ferncrop];
    var mul = crops3[ferncrop].infboost.mulr(num).addr(1);
    result.infseeds.mulInPlace(mul);
    result.infspores.mulInPlace(mul);
    if(breakdown) breakdown.push(['fern', true, mul, result.clone()]);
  }

  if(this.type == CROPTYPE_BRASSICA && state.fishes[shrimp_0].unlocked) {
    var mul = getFishMultiplier(FISHTYPE_SHRIMP, state, 3);
    var have_fish = mul.neqr(1);
    if(have_fish) result.mulInPlace(mul);
    var give_warning = !have_fish && state.g_res.infspores.gt(fishes[shrimp_0].cost.infspores.mulr(2));
    if(breakdown) breakdown.push(['shrimp' + (give_warning ? ' (have 0, put some in the pond!)' : ''), true, mul, result.clone()]);
  }

  // minimum for brassica to at least pay their own cost back
  // this can happen if brassica is expected to be boosted by fishes, but the fishes aren't there, and then the brassica would cause a loss of infinity seeds over its lifetime which could be a large unintended setback
  if(this.type == CROPTYPE_BRASSICA && result.infseeds.gtr(0)) {
    var minimum = this.minForBrassicaSelfSustain();
    if(result.infseeds.lt(minimum)) {
      var mul = minimum.div(result.infseeds);
      result.mulInPlace(mul);
      if(breakdown) breakdown.push(['adjustment for self-sustainability', true, mul, result.clone()]);
    }
  }

  if(this.type == CROPTYPE_BERRY && state.squirrel_upgrades[upgradesq_infinity_boost].count) {
    var mul = (new Num(upgradesq_infinity_boost_value + 1));
    result.mulrInPlace(mul);
    if(breakdown) breakdown.push(['squirrel infinity boost', true, mul, result.clone()]);
  }


  return result;
}

Crop3.prototype.minForBrassicaSelfSustain = function() {
  return this.getCost().infseeds.divr(this.getPlantTime()).mulr(1.01);
}

// boost from inf field to inf field (flowers to berries, and flowers themselves compute their boost from infinity bees here)
// opt_expected: if true, computes the boost you get if time-weighted fishes are done (currently implemented for runestone)
Crop3.prototype.getInfBoost = function(f, breakdown, opt_expected) {
  var result = this.infboost.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  // bees boostboost
  if(f && (this.type == CROPTYPE_FLOWER)) {
    var num = 0;

    var numbeedirs = 4;
    var beemul = new Num(1);
    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw3 || y2 < 0 || y2 >= state.numh3) continue;
      var n = state.field3[y2][x2];
      if(n.hasRealCrop() && n.getCrop().type == CROPTYPE_BEE) {
        num++;
        var boostboost = n.getCrop().getInfBoost(n);
        beemul.addInPlace(boostboost);
      }
    }

    if(num > 0) {
      result.mulInPlace(beemul);
      if(breakdown) breakdown.push(['bees (' + num + ')', true, beemul, result.clone()]);
    }
  }

  // sea anemone to flower
  if(this.type == CROPTYPE_FLOWER && state.fishes[anemone_0].unlocked) {
    var mul = getFishMultiplier(FISHTYPE_ANEMONE, state, 3);
    var have_fish = mul.neqr(1);
    if(have_fish) result.mulInPlace(mul);
    var give_warning = !have_fish && state.g_res.infspores.gt(fishes[anemone_0].cost.infspores.mulr(2));
    if(breakdown) breakdown.push(['sea anemones' + (give_warning ? ' (have 0, put some in the pond!)' : ''), true, mul, result.clone()]);
  }

  // leporinus to bee
  if(this.type == CROPTYPE_BEE && state.fishes[leporinus_0].unlocked) {
    var mul = getFishMultiplier(FISHTYPE_LEPORINUS, state, 3);
    var have_fish = mul.neqr(1);
    if(have_fish) result.mulInPlace(mul);
    var give_warning = !have_fish && state.g_res.infspores.gt(fishes[leporinus_0].cost.infspores.mulr(2));
    if(breakdown) breakdown.push(['leporinus (fish)' + (give_warning ? ' (have 0, put some in the pond!)' : ''), true, mul, result.clone()]);
  }

  // koi to runestone
  if(this.type == CROPTYPE_RUNESTONE && state.fishtypecount[FISHTYPE_KOI]) {
    var mul = getFishMultiplier(FISHTYPE_KOI, state, 3);
    if(mul.neqr(1)) {
      result.mulInPlace(mul);
      if(breakdown) {
        breakdown.push(['koi (fish)', true, mul, result.clone()]);
      }
    }
  }

  return result;
};

// Returns the 'base' value of the boost to basic field, which depends on whether infinity ascenscion happened
Crop3.prototype.getBaseBasicBoost = function() {
  if(state.infinity_ascend) {
    if(this.type == CROPTYPE_BRASSICA) return this.basicboost.mulr(2);
    return this.basicboost.mulr(4);
  }
  return this.basicboost.clone();
};

// boost from infinity field to basic field
// opt_expected: if true, computes the boost you get if time-weighted fishes are done
Crop3.prototype.getBasicBoost = function(f, breakdown, opt_expected) {
  var result = this.getBaseBasicBoost();

  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  var runestone_mul = new Num(1);

  if(f) {
    var num = 0;

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw3 || y2 < 0 || y2 >= state.numh3) continue;
      var n = state.field3[y2][x2];
      if(n.hasCrop() && crops3[n.cropIndex()].type == CROPTYPE_RUNESTONE) {
        var boost = crops3[n.cropIndex()].getInfBoost(n, undefined, opt_expected);
        if(boost.neqr(0)) {
          runestone_mul.addInPlace(boost);
          num++;
        }
      }
    }
    if(num) {
      result.mulInPlace(runestone_mul);
      if(breakdown) breakdown.push(['runestones (' + num + ')', true, runestone_mul, result.clone()]);
    }
  }

  // oranda fish: multiplier to basic field bonus for the non-runestone part of the bonus
  if(this.type != CROPTYPE_RUNESTONE && state.fishtypecount[FISHTYPE_ORANDA]) {
    var oranda_mul = getFishMultiplier(FISHTYPE_ORANDA, state, 3);
    if(oranda_mul.neqr(1)) {
      var mul = oranda_mul.add(runestone_mul).subr(1).div(runestone_mul); // the oranda is additive to runestones, NOT multiplicative with it. So do as if a bonus that's the sum of runestone and oranda is given, and then divide through the original runestone bonus from above to only have the oranda effect here
      result.mulInPlace(mul);
      if(breakdown) {
        if(runestone_mul.eqr(1)) {
          breakdown.push(['oranda (fish)', true, oranda_mul, result.clone()]);
        } else {
          breakdown.push(['oranda (additive w. runestone)', true, oranda_mul, result.clone()]);
        }
      }
    }
  }

  return result;
};





var registered_crops3 = []; // indexed consecutively, gives the index to crops3
var crops3 = []; // indexed by crop index

var croptype3_tiers = [];

// 16-bit ID, auto incremented with registerCrop3, but you can also set it to a value yourself, to ensure consistent IDs for various crops3 (between savegames) in case of future upgrades
var crop3_register_id = -1;

// prod = for infinity field
// basicboost = to basic field
function registerCrop3(name, croptype, tier, cost, basicboost, planttime, image, opt_tagline) {
  if(!image) image = missingplant;
  if(crops3[crop3_register_id] || crop3_register_id < 0 || crop3_register_id > 65535) throw 'crop3 id already exists or is invalid!';
  var crop = new Crop3();
  crop.index = crop3_register_id++;
  crops3[crop.index] = crop;
  registered_crops3.push(crop.index);

  crop.name = name;
  crop.type = croptype;
  crop.tier = tier;
  crop.cost = cost;
  crop.basicboost = basicboost;
  crop.planttime = planttime;
  crop.image = image;
  crop.tagline = opt_tagline || '';


  if(croptype != undefined && tier != undefined) {
    if(!croptype3_tiers[croptype]) croptype3_tiers[croptype] = [];
    croptype3_tiers[croptype][tier] = crop;
  }

  return crop.index;
}

function registerBrassica3(name, tier, cost, prod, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_BRASSICA, tier, cost, basicboost, planttime, image, opt_tagline);
  var crop = crops3[index];
  crop.prod = prod;
  return index;
}

function registerBerry3(name, tier, cost, prod, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_BERRY, tier, cost, basicboost, planttime, image, opt_tagline);
  var crop = crops3[index];
  crop.prod = prod;
  return index;
}

function registerMushroom3(name, tier, cost, prod, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_MUSH, tier, cost, basicboost, planttime, image, opt_tagline);
  var crop = crops3[index];
  crop.prod = prod;
  return index;
}

function registerFlower3(name, tier, cost, infboost, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_FLOWER, tier, cost, basicboost, planttime, image, opt_tagline);
  var crop = crops3[index];
  crop.infboost = infboost;
  return index;
}

function registerBee3(name, tier, cost, infboost, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_BEE, tier, cost, basicboost, planttime, image, opt_tagline);
  var crop = crops3[index];
  crop.infboost = infboost;
  return index;
}

function registerRunestone3(name, tier, cost, infboost, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_RUNESTONE, tier, cost, basicboost, planttime, image, opt_tagline);
  var crop = crops3[index];
  crop.infboost = infboost;
  return index;
}

function registerStinging3(name, tier, cost, infboost, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_STINGING, tier, cost, basicboost, planttime, image, opt_tagline);
  var crop = crops3[index];
  crop.infboost = infboost;
  return index;
}

function registerFern3(name, tier, cost, infboost, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_FERN, tier, cost, basicboost, planttime, image, opt_tagline);
  var crop = crops3[index];
  crop.infboost = infboost;
  return index;
}

function registerNut3(name, tier, cost, prod, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_NUT, tier, cost, basicboost, planttime, image, opt_tagline);
  var crop = crops3[index];
  crop.prod = prod;
  return index;
}

function registerLotus3(name, tier, cost, infboost, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_LOTUS, tier, cost, basicboost, planttime, image, opt_tagline);
  var crop = crops3[index];
  crop.infboost = infboost;
  return index;
}

function registerMistletoe3(name, tier, cost, basicboost, planttime, image, opt_tagline) {
  var index = registerCrop3(name, CROPTYPE_MISTLETOE, tier, cost, basicboost, new Num(0), image, opt_tagline);
  var crop = crops3[index];
  return index;
}

var default_crop3_growtime = 5; // in seconds


crop3_register_id = 0;
var brassica3_0 = registerBrassica3('zinc watercress', 0, Res({infseeds:10}), Res({infseeds:20.01 / (24 * 3600)}), Num(0.05), 24 * 3600, metalifyPlantImages(images_watercress, metalheader0));
var brassica3_1 = registerBrassica3('bronze watercress', 1, Res({infseeds:25000}), Res({infseeds:50000 / (2 * 24 * 3600)}), Num(0.05), 2 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader1));
var brassica3_2 = registerBrassica3('silver watercress', 2, Res({infseeds:5e7}), Res({infseeds:5e7 * 4 / (3 * 24 * 3600)}), Num(0.05), 3 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader2));
var brassica3_3 = registerBrassica3('electrum watercress', 3, Res({infseeds:2e12}), Res({infseeds:2e12 * 2 / (24 * 3600)}), Num(0.05), 1 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader3, [4]));
var brassica3_4 = registerBrassica3('gold watercress', 4, Res({infseeds:100e15}), Res({infseeds:500e9}), Num(0.05), 5 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader4));
var brassica3_5 = registerBrassica3('platinum watercress', 5, Res({infseeds:25e21}), Res({infseeds:100e15}), Num(0.05), 7 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader5, [2, 6, 7], [0.15]));
var brassica3_6 = registerBrassica3('rhodium watercress', 6, Res({infseeds:5e27}), Res({infseeds:20e21}), Num(0.05), 3 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader6, [3, 6], [0.9]));
var brassica3_7 = registerBrassica3('amethyst watercress', 7, Res({infseeds:10e33}), Res({infseeds:16e27}), Num(0.05), 4 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader7));
var brassica3_8 = registerBrassica3('sapphire watercress', 8, Res({infseeds:200e39}), Res({infseeds:100e33}), Num(0.05), 5 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader8, [4, 2], [0.8, -0.1]));
var brassica3_9 = registerBrassica3('emerald watercress', 9, Res({infseeds:100e48}), Res({infseeds:15e42}), Num(0.05), 6 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader9));
var brassica3_10 = registerBrassica3('ruby watercress', 10, Res({infseeds:3e60}), Res({infseeds:50e51}), Num(0.05), 7 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader10, [4, 10], [0.9, 1.02]));
var brassica3_11 = registerBrassica3('diamond watercress', 11, Res({infseeds:1e72}), Res({infseeds:5e63}), Num(0.05), 8 * 24 * 3600, metalifyPlantImages(images_watercress, metalheader11, [2, 6, 7, 12, 8], [0.15, 1, 1, 0.1, 160]));

crop3_register_id = 300;
var berry3_0 = registerBerry3('zinc blackberry', 0, Res({infseeds:400}), Res({infseeds:200 / (24 * 3600)}), Num(0.075), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader0));
var berry3_1 = registerBerry3('bronze blackberry', 1, Res({infseeds:500000}), Res({infseeds:500000 / (24 * 3600)}), Num(0.125), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader1, [2]));
// some division done in the production, since we take into account they're now well boosted by flowers and eventually beehives
var berry3_2 = registerBerry3('silver blackberry', 2, Res({infseeds:2e9}), Res({infseeds:(2e9 / 2 / (24 * 3600))}), Num(0.15), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader2, [2]));
// more division since better flowers and beehives now
var berry3_3 = registerBerry3('electrum blackberry', 3, Res({infseeds:100e12}), Res({infseeds:(100e12 / 32 / (24 * 3600))}), Num(0.2), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader3, [2, 4]));
var berry3_4 = registerBerry3('gold blackberry', 4, Res({infseeds:5e18}), Res({infseeds:50e9}), Num(0.4), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader4, [2]));
var berry3_5 = registerBerry3('platinum blackberry', 5, Res({infseeds:500e21}), Res({infseeds:50e12}), Num(0.75), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader5, [2, 6], [0.3]));
// this time it's more expensive relative to the watercress, so multiple rounds of having all watercress are needed before this becomes affordable
var berry3_6 = registerBerry3('rhodium blackberry', 6, Res({infseeds:400e27}), Res({infseeds:100e15}), Num(1.25), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader6, [2, 3, 6], [0.15, 1]));
var berry3_7 = registerBerry3('amethyst blackberry', 7, Res({infseeds:300e33}), Res({infseeds:100e18}), Num(3), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader7));
var berry3_8 = registerBerry3('sapphire blackberry', 8, Res({infseeds:10e42}), Res({infseeds:500e21}), Num(8), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader8, [2], [1.5]));
var berry3_9 = registerBerry3('emerald blackberry', 9, Res({infseeds:3e51}), Res({infseeds:25e27}), Num(15), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader9));
var berry3_10 = registerBerry3('ruby blackberry', 10, Res({infseeds:100e60}), Res({infseeds:40e33}), Num(200), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader10, [4, 10], [0.9, 1.02]));
var berry3_11 = registerBerry3('diamond blackberry', 11, Res({infseeds:35e72}), Res({infseeds:4e40}), Num(1000), default_crop3_growtime, metalifyPlantImages(blackberry, metalheader11, [2, 6, 7, 12, 8], [0.3, 1, 1, 0.1, 160]));

crop3_register_id = 600;
var mush3_4 = registerMushroom3('gold champignon', 4, Res({infseeds:500e18}), Res({infspores:1}), Num(0.5), default_crop3_growtime, metalifyPlantImages(champignon, metalheader4, [2]));
var mush3_5 = registerMushroom3('platinum champignon', 5, Res({infseeds:20e24}), Res({infspores:25}), Num(1), default_crop3_growtime, metalifyPlantImages(champignon, metalheader5, [7]));
var mush3_6 = registerMushroom3('rhodium champignon', 6, Res({infseeds:5e30}), Res({infspores:500}), Num(2.5), default_crop3_growtime, metalifyPlantImages(champignon, metalheader6, [6]));
var mush3_7 = registerMushroom3('amethyst champignon', 7, Res({infseeds:5e36}), Res({infspores:40000}), Num(10), default_crop3_growtime, metalifyPlantImages(champignon, metalheader7));
var mush3_8 = registerMushroom3('sapphire champignon', 8, Res({infseeds:50e42}), Res({infspores:30e6}), Num(40), default_crop3_growtime, metalifyPlantImages(champignon, metalheader8, [2], [1.5]));
var mush3_9 = registerMushroom3('emerald champignon', 9, Res({infseeds:20e51}), Res({infspores:25e9}), Num(160), default_crop3_growtime, metalifyPlantImages(champignon, metalheader9));
// NOTE: the bonus to basic field of this one and the previous one is actually too high and that of the flower in comparison too low. Let's not change this yet for now, but for next tiers make the flower higher than the mushroom again, and the lotus even higher.
var mush3_10 = registerMushroom3('ruby champignon', 10, Res({infseeds:500e60}), Res({infspores:50e12}), Num(1000), default_crop3_growtime, metalifyPlantImages(champignon, metalheader10, [4, 10], [0.9, 1.02]));
var mush3_11 = registerMushroom3('diamond champignon', 11, Res({infseeds:1e75}), Res({infspores:1.2e18}), Num(3000), default_crop3_growtime, metalifyPlantImages(champignon, metalheader11, [2, 6, 7, 12, 8, 10], [0.1, 1, 1, 0.1, 160, 1.02]));
// this one only exists after infinity ascension, to have some fishes in the pond earlier on
var mush3_t = registerMushroom3('translucent champignon', -1, Res({infseeds:1000}), Res({infspores:0.001}), Num(0.125), default_crop3_growtime, metalifyPlantImages(champignon, metalheader11, [1, 13], [0.5, 0.5]));

crop3_register_id = 900;
var flower3_0 = registerFlower3('zinc anemone', 0, Res({infseeds:2500}), Num(0.5), Num(0.1), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader0, [1]));
var flower3_1 = registerFlower3('bronze anemone', 1, Res({infseeds:2.5e6}), Num(1), Num(0.15), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader1));
var flower3_2 = registerFlower3('silver anemone', 2, Res({infseeds:20e9}), Num(3), Num(0.2), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader2, [1], [0.1]));
var flower3_3 = registerFlower3('electrum anemone', 3, Res({infseeds:1e15}), Num(12), Num(0.3), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader3, [4]));
var flower3_4 = registerFlower3('gold anemone', 4, Res({infseeds:200e18}), Num(200), Num(0.6), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader4));
var flower3_5 = registerFlower3('platinum anemone', 5, Res({infseeds:20e24}), Num(2500), Num(1), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader5, [6]));
var flower3_6 = registerFlower3('rhodium anemone', 6, Res({infseeds:15e30}), Num(50000), Num(2.5), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader6, [6], [0.7]));
var flower3_7 = registerFlower3('amethyst anemone', 7, Res({infseeds:10e36}), Num(1e6), Num(5), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader7));
var flower3_8 = registerFlower3('sapphire anemone', 8, Res({infseeds:150e42}), Num(20e6), Num(16), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader8, [4, 2], [0.8, -0.1]));
var flower3_9 = registerFlower3('emerald anemone', 9, Res({infseeds:50e51}), Num(1e9), Num(90), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader9));
var flower3_10 = registerFlower3('ruby anemone', 10, Res({infseeds:10e63}), Num(20e9), Num(300), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader10, [4, 10], [0.9, 1.02]));
var flower3_11 = registerFlower3('diamond anemone', 11, Res({infseeds:1e75}), Num(555e9), Num(2500), default_crop3_growtime, metalifyPlantImages(images_anemone, metalheader11, [2, 6, 7, 12, 8, 10], [0.1, 1, 1, 0.1, 160, 1.02]));


crop3_register_id = 1200;
var bee3_2 = registerBee3('silver bee nest', 2, Res({infseeds:200e9}), Num(4), Num(0.5), default_crop3_growtime, metalifyPlantImages(images_beenest, metalheader2));
var bee3_3 = registerBee3('electrum bee nest', 3, Res({infseeds:10e15}), Num(32), Num(0.75), default_crop3_growtime, metalifyPlantImages(images_beenest, metalheader3, [4]));
var bee3_4 = registerBee3('gold bee nest', 4, Res({infseeds:5e21}), Num(256), Num(1.5), default_crop3_growtime, metalifyPlantImages(images_beenest, metalheader4));
var bee3_5 = registerBee3('platinum bee nest', 5, Res({infseeds:500e24}), Num(2048), Num(4), default_crop3_growtime, metalifyPlantImages(images_beenest, metalheader5, [2, 6, 7], [0.15]));
var bee3_6 = registerBee3('rhodium bee nest', 6, Res({infseeds:500e30}), Num(16384), Num(10), default_crop3_growtime, metalifyPlantImages(images_beenest, metalheader6, [6]));
var bee3_7 = registerBee3('amethyst bee nest', 7, Res({infseeds:2e38}), Num(300e3), Num(30), default_crop3_growtime, metalifyPlantImages(images_beenest, metalheader7));
var bee3_8 = registerBee3('sapphire bee nest', 8, Res({infseeds:3e45}), Num(10e6), Num(100), default_crop3_growtime, metalifyPlantImages(images_beenest, metalheader8));
var bee3_9 = registerBee3('emerald bee nest', 9, Res({infseeds:5e54}), Num(200e6), Num(300), default_crop3_growtime, metalifyPlantImages(images_beenest, metalheader9));
var bee3_10 = registerBee3('ruby bee nest', 10, Res({infseeds:500e63}), Num(4e9), Num(1000), default_crop3_growtime, metalifyPlantImages(images_beenest, metalheader10, [4, 10], [0.9, 1.02]));
var bee3_11 = registerBee3('diamond bee nest', 11, Res({infseeds:30e75}), Num(100e9), Num(10000), default_crop3_growtime, metalifyPlantImages(images_beenest, metalheader11, [2, 6, 7, 12, 8, 10], [0.1, 1, 1, 0.1, 160, 1.02]));

crop3_register_id = 1500;
var runestone3_0 = registerRunestone3('runestone', 0, Res({infseeds:500e9}), Num(2), Num(0), 3, images_runestone);

crop3_register_id = 1800;
var stinging3_6 = registerStinging3('rhodium nettle', 6, Res({infseeds:1e33}), Num(1.5), Num(6), default_crop3_growtime, metalifyPlantImages(images_nettle, metalheader6, [6, 9]));
var stinging3_7 = registerStinging3('amethyst nettle', 7, Res({infseeds:1e39}), Num(4), Num(20), default_crop3_growtime, metalifyPlantImages(images_nettle, metalheader7, [9]));
var stinging3_8 = registerStinging3('sapphire nettle', 8, Res({infseeds:10e45}), Num(5), Num(75), default_crop3_growtime, metalifyPlantImages(images_nettle, metalheader8, [9]));
var stinging3_9 = registerStinging3('emerald nettle', 9, Res({infseeds:5e54}), Num(6), Num(250), default_crop3_growtime, metalifyPlantImages(images_nettle, metalheader9));
var stinging3_10 = registerStinging3('ruby nettle', 10, Res({infseeds:200e63}), Num(10), Num(750), default_crop3_growtime, metalifyPlantImages(images_nettle, metalheader10, [4, 10], [0.9, 1.02]));
var stinging3_11 = registerStinging3('diamond nettle', 11, Res({infseeds:100e75}), Num(20), Num(6000), default_crop3_growtime, metalifyPlantImages(images_nettle, metalheader11, [2, 6, 7, 12, 8, 10], [0.1, 1, 1, 0.1, 160, 1.02]));

crop3_register_id = 2100;
var fern3_7 = registerFern3('amethyst fern', 7, Res({infseeds:5e39}), Num(3), Num(50), default_crop3_growtime, metalifyPlantImages(image_fern_as_crop_inf, metalheader7));
var fern3_8 = registerFern3('sapphire fern', 8, Res({infseeds:200e45}), Num(3), Num(150), default_crop3_growtime, metalifyPlantImages(image_fern_as_crop_inf, metalheader8));
var fern3_9 = registerFern3('emerald fern', 9, Res({infseeds:200e54}), Num(3), Num(500), default_crop3_growtime, metalifyPlantImages(image_fern_as_crop_inf, metalheader9));
var fern3_10 = registerFern3('ruby fern', 10, Res({infseeds:30e66}), Num(2), Num(1500), default_crop3_growtime, metalifyPlantImages(image_fern_as_crop_inf, metalheader10, [4, 10], [0.9, 1.02]));
var fern3_11 = registerFern3('diamond fern', 11, Res({infseeds:4e78}), Num(4), Num(7500), default_crop3_growtime, metalifyPlantImages(image_fern_as_crop_inf, metalheader11, [2, 6, 7, 12, 8, 10], [0.1, 1, 1, 0.1, 160, 1.02]));

crop3_register_id = 2400;
var nut3_8 = registerNut3('sapphire acorn', 8, Res({infseeds:2e48}), Res({infseeds:5e24}), Num(75), default_crop3_growtime, metalifyPlantImages(images_acorn, metalheader8));
var nut3_9 = registerNut3('emerald acorn', 9, Res({infseeds:2e57}), Res({infseeds:250e27}), Num(250), default_crop3_growtime, metalifyPlantImages(images_acorn, metalheader9));
var nut3_10 = registerNut3('ruby acorn', 10, Res({infseeds:500e66}), Res({infseeds:500e33}), Num(750), default_crop3_growtime, metalifyPlantImages(images_acorn, metalheader10, [4, 10], [0.9, 1.02]));
var nut3_11 = registerNut3('diamond acorn', 11, Res({infseeds:50e78}), Res({infseeds:1e42}), Num(5000), default_crop3_growtime, metalifyPlantImages(images_acorn, metalheader11, [2, 6, 7, 12, 8, 10], [0.1, 1, 1, 0.1, 160, 1.02]));

crop3_register_id = 2700;
var lotus3_9 = registerLotus3('emerald lotus', 9, Res({infseeds:77e57}), Num(7.77777), Num(277.7777), default_crop3_growtime, metalifyPlantImages(images_greenlotus, metalheader9));
var lotus3_10 = registerLotus3('ruby lotus', 10, Res({infseeds:20e69}), Num(7.77777), Num(1000), default_crop3_growtime, metalifyPlantImages(images_greenlotus, metalheader10, [4, 10], [0.9, 1.02]));
var lotus3_11 = registerLotus3('diamond lotus', 11, Res({infseeds:2.5e81}), Num(7.77777), Num(7777), default_crop3_growtime, metalifyPlantImages(images_greenlotus, metalheader11, [2, 6, 7, 12, 8, 10], [0.1, 1, 1, 0.1, 160, 1.02]));

crop3_register_id = 2800;
var mistletoe3_11 = registerMistletoe3('diamond mistletoe', 11, Res({infseeds:20e81}), Num(0.05), default_crop3_growtime, metalifyPlantImages(images_mistletoe, metalheader11, [2, 6, 7, 12, 8, 10], [0.1, 1, 1, 0.1, 160, 1.02]));

function haveInfinityField(opt_state) {
  var s = opt_state || state;
  return s.upgrades2[upgrade2_infinity_field].count;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var fishtype_index = 0;
var FISHTYPE_GOLDFISH = fishtype_index++; // infinity seeds production bonus
var FISHTYPE_KOI = fishtype_index++; // runestone basic field boost bonus
var FISHTYPE_OCTOPUS = fishtype_index++; // infinity spores production bonus
var FISHTYPE_SHRIMP = fishtype_index++; // shrimp: boosts infinity watercress
var FISHTYPE_ANEMONE = fishtype_index++; // sea anemone: boost infinity flowers
var FISHTYPE_PUFFER = fishtype_index++; // puffer fish: boosts berries
var FISHTYPE_EEL = fishtype_index++; // eel: boosts twigs
var FISHTYPE_TANG = fishtype_index++; // yellow tang: boosts resin
var FISHTYPE_LEPORINUS = fishtype_index++; // fish with yellow and black stripes, boosts infinity bees
var FISHTYPE_ORANDA = fishtype_index++; // a goldfish/koi like fish. boost of the boost to basic boost, without requiring runestone (additive to runestone)
var FISHTYPE_JELLYFISH = fishtype_index++; // gives pond a small inf seeds/spores production boost to neighbors of the pond
var NUM_FISHTYPES = fishtype_index;

function getFishTypeName(type) {
  if(type == FISHTYPE_GOLDFISH) return 'goldfish';
  if(type == FISHTYPE_KOI) return 'koi';
  if(type == FISHTYPE_OCTOPUS) return 'octopus';
  if(type == FISHTYPE_SHRIMP) return 'shrimp';
  if(type == FISHTYPE_ANEMONE) return 'sea anemone';
  if(type == FISHTYPE_PUFFER) return 'puffer fish';
  if(type == FISHTYPE_EEL) return 'eel';
  if(type == FISHTYPE_TANG) return 'tang';
  if(type == FISHTYPE_LEPORINUS) return 'leporinus';
  if(type == FISHTYPE_ORANDA) return 'oranda';
  if(type == FISHTYPE_JELLYFISH) return 'jellyfish';
  return 'unknown';
}

function Fish() {
  this.name = 'a';
  this.cost = Res();
  this.index = 0;

  this.type = undefined;
  this.tier = 0;

  this.effect_description = '';
  this.tagline = '';
  this.image = undefined;
};

Fish.prototype.isReal = function() {
  return !this.istemplate && !this.isghost;
};

Fish.prototype.getBaseCost = function(opt_adjust_count, opt_force_count) {
  if(state.infinity_ascend) {
    return this.cost.mulr(1000);
  }
  return this.cost;
};

Fish.prototype.getCost = function(opt_adjust_count, opt_force_count) {
  var basecost = this.getBaseCost();

  var count = state.fishcount[this.index] + (opt_adjust_count || 0);
  if(opt_force_count != undefined) count = opt_force_count;

  var mul = 20;
  // vary the multiplier for some types to have some variation in the spread of fish costs
  if(this.type == FISHTYPE_PUFFER) mul = 17;
  if(this.type == FISHTYPE_EEL || this.type == FISHTYPE_TANG) mul = 21;
  if(this.type == FISHTYPE_LEPORINUS) mul = 25;
  if(this.type == FISHTYPE_ORANDA) mul = 19;
  if(this.type == FISHTYPE_JELLYFISH) mul = 3;
  var countfactor = Math.pow(mul, count);
  return basecost.mulr(countfactor);
};

var FISHRECOUP = 1.0;

Fish.prototype.getRecoup = function(f, opt_adjust_count) {
  var adjust = opt_adjust_count || 0;
  var result = this.getCost(adjust - 1).mulr(FISHRECOUP);
  return result;
};

var registered_fishes = []; // indexed consecutively, gives the index to crops3
var fishes = []; // indexed by fish index

var fish_tiers = [];

// 16-bit ID, auto incremented with registerFish, but you can also set it to a value yourself, to ensure consistent IDs for various fishes (between savegames) in case of future upgrades
var fish_register_id = -1;

// prod = for infinity field
// basicboost = to basic field
function registerFish(name, fishtype, tier, cost, effect_description, image, opt_tagline) {
  if(!image) image = image_missingfish;
  if(fishes[fish_register_id] || fish_register_id < 0 || fish_register_id > 65535) throw 'fish id already exists or is invalid!';
  var fish = new Fish();
  fish.index = fish_register_id++;
  fishes[fish.index] = fish;
  registered_fishes.push(fish.index);

  fish.name = name;
  fish.type = fishtype;
  fish.tier = tier;
  fish.cost = cost;
  fish.effect_description = effect_description;
  fish.image = image;
  fish.tagline = opt_tagline || '';

  if(fishtype != undefined && tier != undefined) {
    if(!fish_tiers[fishtype]) fish_tiers[fishtype] = [];
    fish_tiers[fishtype][tier] = fish;
  }

  return fish.index;
}

function registerGoldfish(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_GOLDFISH, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

function registerKoi(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_KOI, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

function registerOctopus(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_OCTOPUS, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

function registerShrimp(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_SHRIMP, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

function registerAnemone(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_ANEMONE, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

function registerPuffer(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_PUFFER, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

function registerEel(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_EEL, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

function registerTang(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_TANG, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

function registerLeporinus(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_LEPORINUS, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

function registerOranda(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_ORANDA, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

function registerJellyfish(name, tier, cost, effect_description, image, opt_tagline) {
  var index = registerFish(name, FISHTYPE_JELLYFISH, tier, cost, effect_description, image, opt_tagline);
  //var fish = fishes[index];
  return index;
}

fish_register_id = 100;
var goldfish_0_bonus = 0.1;
var goldfish_0 = registerGoldfish('goldfish', 0, Res({infspores:5000}), 'Improves infinity seeds production by ' + Num(goldfish_0_bonus).toPercentString(), image_goldfish0);
var goldfish_1_bonus = 1.5;
var goldfish_1 = registerGoldfish('red goldfish', 1, Res({infspores:50e9}), 'Improves infinity seeds production by ' + Num(goldfish_1_bonus).toPercentString(), image_goldfish1);
var goldfish_2_bonus = 25;
var goldfish_2 = registerGoldfish('black goldfish', 2, Res({infspores:5e18}), 'Improves infinity seeds production by ' + Num(goldfish_2_bonus).toPercentString(), image_goldfish2);
var goldfish_3_bonus = 200;
var goldfish_3 = registerGoldfish('white goldfish', 3, Res({infspores:20e30}), 'Improves infinity seeds production by ' + Num(goldfish_3_bonus).toPercentString(), image_goldfish3);

fish_register_id = 200;
var koi_0_bonus = 0.2;
var koi_0 = registerKoi('koi', 0, Res({infspores:20000}), 'Improves runestone bonus by ' + Num(koi_0_bonus).toPercentString() + ' ' + timeweightedinfo, image_koi0);
var koi_1_bonus = 1.5;
var koi_1 = registerKoi('red koi', 1, Res({infspores:250e9}), 'Improves runestone bonus by ' + Num(koi_1_bonus).toPercentString() + ' ' + timeweightedinfo, image_koi1);

fish_register_id = 300;
var octopus_0_bonus = 0.25;
var octopus_0 = registerOctopus('octopus', 0, Res({infspores:100000}), 'Improves infinity spores production by ' + Num(octopus_0_bonus).toPercentString(), image_octopus0);
var octopus_1_bonus = 4;
var octopus_1 = registerOctopus('red octopus', 1, Res({infspores:1e18}), 'Improves infinity spores production by ' + Num(octopus_1_bonus).toPercentString(), image_octopus1);
var octopus_2_bonus = 64;
var octopus_2 = registerOctopus('black octopus', 2, Res({infspores:20e27}), 'Improves infinity spores production by ' + Num(octopus_2_bonus).toPercentString(), image_octopus2);

fish_register_id = 400;
var shrimp_0_bonus = 0.2;
var shrimp_0 = registerShrimp('shrimp', 0, Res({infspores:2500000}), 'Improves infinity watercress by ' + Num(shrimp_0_bonus).toPercentString(), image_shrimp0);
var shrimp_1_bonus = 2;
var shrimp_1 = registerShrimp('red shrimp', 1, Res({infspores:250e15}), 'Improves infinity watercress by ' + Num(shrimp_1_bonus).toPercentString(), image_shrimp1);

fish_register_id = 500;
var anemone_0_bonus = 0.15;
var anemone_0 = registerAnemone('anemone', 0, Res({infspores:7500000}), 'Improves infinity flowers by ' + Num(anemone_0_bonus).toPercentString(), image_anemone0);
var anemone_1_bonus = 1.5;
var anemone_1 = registerAnemone('red anemone', 1, Res({infspores:200e9}), 'Improves infinity flowers by ' + Num(anemone_1_bonus).toPercentString(), image_anemone1);
var anemone_2_bonus = 20;
var anemone_2 = registerAnemone('black anemone', 2, Res({infspores:5e21}), 'Improves infinity flowers by ' + Num(anemone_2_bonus).toPercentString(), image_anemone2);

fish_register_id = 600;
var puffer_0_bonus = 0.2;
var puffer_0 = registerPuffer('pufferfish', 0, Res({infspores:1e8}), 'Improves infinity berries/nuts by ' + Num(puffer_0_bonus).toPercentString(), image_puffer0);
var puffer_1_bonus = 1.5;
var puffer_1 = registerPuffer('red pufferfish', 1, Res({infspores:500e12}), 'Improves infinity berries/nuts by ' + Num(puffer_1_bonus).toPercentString(), image_puffer1);
var puffer_2_bonus = 20;
var puffer_2 = registerPuffer('black pufferfish', 2, Res({infspores:100e21}), 'Improves infinity berries/nuts by ' + Num(puffer_2_bonus).toPercentString(), image_puffer2);

fish_register_id = 700;
var eel_0_bonus = 0.25;
var eel_0 = registerEel('eel', 0, Res({infspores:1e9}), 'Improves twigs gain by ' + Num(eel_0_bonus).toPercentString() + ' ' + timeweightedinfo, image_eel0);
var eel_1_bonus = 0.5;
var eel_1 = registerEel('red eel', 1, Res({infspores:1e15}), 'Improves twigs gain by ' + Num(eel_1_bonus).toPercentString() + ' ' + timeweightedinfo, image_eel1);
// why not black eel: it would look too similar to the regular eel which is dark blue
var eel_2_bonus = 2.0;
var eel_2 = registerEel('white eel', 2, Res({infspores:15e30}), 'Improves twigs gain by ' + Num(eel_2_bonus).toPercentString() + ' ' + timeweightedinfo, image_eel2);
var eel_t_bonus = 0.05;
var eel_t = registerEel('translucent eel', -1, Res({infspores:20}), 'Improves twigs gain by ' + Num(eel_t_bonus).toPercentString() + ' ' + timeweightedinfo, metalifyPlantImage(image_eel0, metalheader11, [1, 13], [0.5, 0.5]));



fish_register_id = 800;
var tang_0_bonus = 0.25;
var tang_0 = registerTang('yellow tang', 0, Res({infspores:10e9}), 'Improves resin gain by ' + Num(tang_0_bonus).toPercentString() + ' ' + timeweightedinfo, image_tang0);
var tang_1_bonus = 0.5;
var tang_1 = registerTang('red tang', 1, Res({infspores:5e15}), 'Improves resin gain by ' + Num(tang_1_bonus).toPercentString() + ' ' + timeweightedinfo, image_tang1);
var tang_2_bonus = 2.0;
var tang_2 = registerTang('black tang', 2, Res({infspores:300e27}), 'Improves resin gain by ' + Num(tang_2_bonus).toPercentString() + ' ' + timeweightedinfo, image_tang2);
var tang_t_bonus = 0.05;
var tang_t = registerTang('translucent tang', -1, Res({infspores:250}), 'Improves resin gain by ' + Num(tang_t_bonus).toPercentString() + ' ' + timeweightedinfo, metalifyPlantImage(image_tang0, metalheader11, [1, 13], [0.5, 0.5]));


fish_register_id = 900;
var leporinus_0_bonus = 0.35;
var leporinus_0 = registerLeporinus('leporinus', 0, Res({infspores:2e15}), 'Improves infinity bees by ' + Num(leporinus_0_bonus).toPercentString() + ' for berries/nuts (for mushrooms, has a lesser effect)', image_leporinus0); // the mushroom effect is complicated to describe, depends on the relative-tier-of-bees-through-flowers effect, it's much lower, around 5-10%
var leporinus_1_bonus = 4;
var leporinus_1 = registerLeporinus('red banded leporinus', 1, Res({infspores:700e21}), 'Improves infinity bees by ' + Num(leporinus_1_bonus).toPercentString() + ' for berries/nuts (for mushrooms, has a lesser effect)', image_leporinus1); // the mushroom effect is complicated to describe, depends on the relative-tier-of-bees-through-flowers effect, it's much lower

fish_register_id = 1000;
var oranda_0_bonus = 2;
var oranda_0 = registerOranda('oranda', 0, Res({infspores:10e15}), 'Boosts the basic field boost by ' + Num(oranda_0_bonus).toPercentString() + ', without requiring runestone (additive to runestone)' + ' ' + timeweightedinfo, image_oranda0);
var oranda_1_bonus = 10;
var oranda_1 = registerOranda('red oranda', 1, Res({infspores:200e18}), 'Boosts the basic field boost by ' + Num(oranda_1_bonus).toPercentString() + ', without requiring runestone (additive to runestone)' + ' ' + timeweightedinfo, image_oranda1);
var oranda_2_bonus = 50;
var oranda_2 = registerOranda('black oranda', 2, Res({infspores:50e30}), 'Boosts the basic field boost by ' + Num(oranda_2_bonus).toPercentString() + ', without requiring runestone (additive to runestone)' + ' ' + timeweightedinfo, image_oranda2);

fish_register_id = 1100;
var jellyfish_t_bonus = 0.05;
var jellyfish_t = registerJellyfish('iridescent jellyfish', -1, Res({infspores:3000}), 'Boosts infinity production of seed or spore producing neighbors of the pond by ' + Num(jellyfish_t_bonus).toPercentString(), image_jellyfish_t);

// some fishes have limits depending on count across tiers. This function checks all those conditions
// returns false if not.
// Can also output a textual reason in opt_short_reason and/or opt_long_reason, if given as array. It will output two string in [0]
// opt_short_reason is intended for short explanation in small dialog/tooltip
// opt_long_reason is intended for error log message when attempting the action
function canPlaceThisFishGivenCounts(c, opt_f, opt_short_reason, opt_long_reason) {
  if((c.type == FISHTYPE_EEL || c.type == FISHTYPE_TANG || c.type == FISHTYPE_SHRIMP) && c.tier > 0 && state.fishcount[c.index]) {
    // TODO: consider also reducing this to max 1 for tier 0
    if(opt_short_reason) opt_short_reason[0] = 'Max 1';
    if(opt_long_reason) opt_long_reason[0] = 'Can have only max 1 of this fish';
    return false;
  } else if(c.index == oranda_2 && state.fishcount[c.index]) {
    if(opt_short_reason) opt_short_reason[0] = 'Max 1';
    if(opt_long_reason) opt_long_reason[0] = 'Can have only max 1 black oranda. This is the final infinity fish.';
    return false;
  } else if((c.type == FISHTYPE_EEL || c.type == FISHTYPE_TANG || c.type == FISHTYPE_ORANDA) && state.fishtypecount[c.type] >= 4 && !(opt_f && opt_f.hasCrop() && opt_f.getCrop().type == c.type)) {
    if(opt_short_reason) opt_short_reason[0] = 'Max 4 ' + getFishTypeName(c.type);
    if(opt_long_reason) opt_long_reason[0] = 'Can have only max 4 of this fish type';
    return false;
  } else if(c.type == FISHTYPE_JELLYFISH && state.fishtypecount[c.type] >= 5) {
    if(opt_short_reason) opt_short_reason[0] = 'Max 5 ' + getFishTypeName(c.type);
    if(opt_long_reason) opt_long_reason[0] = 'Can have only max 5 of this fish type';
    return false;
  } else if(c.type == FISHTYPE_SHRIMP && c.tier == 0 && state.fishtypecount[c.type] >= 9 && !(opt_f && opt_f.hasCrop() && opt_f.getCrop().type == c.type)) {
    if(opt_short_reason) opt_short_reason[0] = 'Max 9';
    if(opt_long_reason) opt_long_reason[0] = 'Can have only max 9 of this fish type';
    return false;
  } else if(c.type == FISHTYPE_SHRIMP && state.fishtypecount[c.type] > 0 && state.fishcount[c.index] == 0 &&
            !(opt_f && opt_f.hasCrop() && opt_f.getCrop().type == c.type && state.fishtypecount[c.type] == 1)) {
    // this is checking that you don't have a fish of this same type, but of a different tier (by checking fishtype count is non-zero but fish count of the current one is zero), but do allow this when you have exactly one fish of this tier and are replacing it with the same type (even if of a different tier)
    if(opt_short_reason) opt_short_reason[0] = 'Max 1 shrimp tier'; // of any shrimp type across all tiers, IF higher tier than 0 is present
    if(opt_long_reason) opt_long_reason[0] = 'Cannot have multiple tiers of shrimp at the same time. Remove all other shrimp, then try to place this shrimp tier again (alternatively, delete all but one shrimp, and upgrade the remaining one to the higher tier)';
    return false;
  }
  return true;
}

// This is for UI, specifically for reddening the fish buttons
function canPlaceThisFishGivenCountsIgnoringLowerTiers(c) {
  if((c.type == FISHTYPE_EEL || c.type == FISHTYPE_TANG || c.type == FISHTYPE_SHRIMP) && c.tier > 0 && state.fishcount[c.index]) {
    return false;
  } else if(c.index == oranda_2 && state.fishcount[c.index]) {
    return false;
  } else if((c.type == FISHTYPE_EEL || c.type == FISHTYPE_TANG || c.type == FISHTYPE_ORANDA) && state.fishcount[c.index] >= 4) {
    return false;
  } else if(c.type == FISHTYPE_JELLYFISH && state.fishcount[c.index] >= 5) {
    return false;
  } else if(c.type == FISHTYPE_SHRIMP && c.tier == 0 && state.fishcount[c.index] >= 9) {
    return false;
  } else if(c.type == FISHTYPE_SHRIMP && state.fishcount[c.index] > 0 && state.fishcount[c.index] == 0) {
    return false;
  }
  return true;
}

// similar to the messages output by canPlaceThisFishGivenCounts, but for general description without knowing / having a fish count
function getFishPlacementRestrictionDescription(c) {
  if((c.type == FISHTYPE_EEL || c.type == FISHTYPE_TANG || c.type == FISHTYPE_SHRIMP) && c.tier > 0) {
    return 'Can have only max 1 of this fish';
  } else if(c.index == oranda_2) {
    return 'Can have only max 1 black oranda. This is the final infinity fish.';
  } else if(c.type == FISHTYPE_EEL || c.type == FISHTYPE_TANG || c.type == FISHTYPE_ORANDA) {
    return 'Can have only max 4 of this fish type';
  } else if(c.type == FISHTYPE_JELLYFISH) {
    return 'Can have only max 5 of this fish type';
  } else if(c.type == FISHTYPE_SHRIMP && c.tier == 0) {
    return 'Can have only max 9 of this fish type, and cannot mix tiers';
  }
  return undefined;
}




////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// @constructor
// aka achievement
function Medal() {
  this.name = 'a';
  this.conditionfun = undefined;

  // production multiplier given by this medal, additively added to the global medal-multiplier, e.g. 0.01 for 1%
  this.prodmul = Num(0);

  this.hint = undefined; // if the medal with id hint is unlocked, then reveals the existance of this medal in the UI (but does not unlock it)

  this.icon = undefined;

  this.index = 0; // its index in registered_medals
  this.order = 0; // its index in medals_order

  this.deprecated = false; // no longer existing medal from earlier game version
};

// Tier for achievement images if no specific one given, maps to zinc, copper, silver, electrum, gold, etc..., see images_medals.js
Medal.prototype.getTier = function() {
  var percent = this.prodmul.mulr(100);
  // The .99 are to not have numerical precision flapping at near exact values like 1M
  if(percent.ltr(0.99)) return 0;
  if(percent.ltr(4.99)) return 1;
  if(percent.ltr(19.99)) return 2;
  if(percent.ltr(99.99)) return 3;
  if(percent.ltr(499.99)) return 4;
  if(percent.ltr(1999.99)) return 5;
  if(percent.ltr(9999.99)) return 6;
  if(percent.ltr(49999.99)) return 7;
  if(percent.ltr(199999.99)) return 8;
  if(percent.ltr(999999.99)) return 9;
  if(percent.ltr(4999999.99)) return 10;
  return 11;
};

var registered_medals = []; // indexed consecutively, gives the index to medal
var medals = []; // indexed by medal index (not necessarily consectuive)
var medals_order = []; // display order of the medals, contains the indexes in medals array

var medal_register_id = -1;

// dest = index of medal to put this one behind in display order
// medal "index" will be displayed right after medal "dest"
function changeMedalDisplayOrder(index, dest) {
  if(dest > index) throw 'can only move order backward for now';
  var a = medals[dest];
  var b = medals[index];

  var from = a.order + 1;
  var to = b.order;
  for(var i = to; i > from; i--) {
    medals_order[i] = medals_order[i - 1];
    medals[medals_order[i]].order = i;
  }
  medals_order[from] = index;
  b.order = from;
}

// change the display order of a whole range of medals. index0 is inclusive, index1 is exclusive, in the range
function changeMedalsDisplayOrder(index0, index1, dest) {
  if(dest > index0 || dest > index1) throw 'can only move order backward for now';

  var shiftright0 = medals[dest].order + 1;
  var shiftright1 = medals[index0].order;
  var numshiftright = shiftright1 - shiftright0;

  var shiftleft0 = medals[index0].order;
  var shiftleft1 = medals[index1 - 1].order + 1;
  var numshiftleft = shiftleft1 - shiftleft0;

  var order2 = [];
  for(var i = 0; i < medals_order.length; i++) {
    var j = i;
    if(i >= shiftright0 && i < shiftright1) {
      j = i + numshiftleft;
    }
    if(i >= shiftleft0 && i < shiftleft1) {
      j = i - numshiftright;
    }
    order2[j] = medals_order[i];
    if(i != j) medals[order2[j]].order = j;
  }

  medals_order = order2;
}

function registerMedal(name, description, icon, conditionfun, prodmul) {
  if(medals[medal_register_id] || medal_register_id < 0 || medal_register_id > 65535) throw 'medal id already exists or is invalid!';

  var medal = new Medal();
  medal.index = medal_register_id++;
  medals[medal.index] = medal;
  registered_medals.push(medal.index);

  medal.name = name;
  medal.description = description;
  medal.icon = icon;
  medal.conditionfun = conditionfun;
  medal.prodmul = prodmul;

  medal.order = medals_order.length;
  medals_order[medal.order] = medal.index;

  if(!icon) medal.icon = medalgeneric[medal.getTier()];

  return medal.index;
}

function registerDeprecatedMedal() {
  var id = registerMedal('deprecated', 'deprecated', genericicon, function() { return false; }, Num(0));
  medals[id].deprecated = true;
}

var genericicon = undefined; // use default generic medal icon. value is undefined, just given a name here.

medal_register_id = 0;
var medal_crowded_id = registerMedal('crowded', 'planted something on every single field cell. Time to delete crops when more room is needed!', genericicon, function() {
  if(state.numemptyfields != 0) return false;
  // why - 4: 2 are for the tree. And the other 3: allow having two temporary crops and yet still be valid for getting this achievement. The "numemptyfields" check above ensures there's at least something present on those two remaining non-full-permanent-plant spots.
  // why allowing 3 short-lived crops: this achievement is supposed to come somewhat early and has a tutorial function (explain delete), so ensure it doesn't accidently come way too late when someone is using short-lived crops for their boost continuously.
  return state.numfullpermanentcropfields >= state.numw * state.numh - 5;
}, Num(0.02));
registerMedal('fern 100', 'clicked 100 ferns', images_fern[0], function() { return state.g_numferns >= 100; }, Num(0.01));
registerMedal('fern 1000', 'clicked 1000 ferns', images_fern[0], function() { return state.g_numferns >= 1000; }, Num(0.1));
registerMedal('fern 10000', 'clicked 10000 ferns', images_fern[0], function() { return state.g_numferns >= 10000; }, Num(1));

var prevmedal; // used during the registration of several sets of achieves for hints revealing the next one

// 4-38 used to be seeds achievements, but those moved to id 6000


medal_register_id = 39;
var planted_achievement_values =  [   5,   50,  100,  200,  500,  1000,  1500, 2000, 5000];
var planted_achievement_bonuses = [0.01, 0.01, 0.02, 0.02, 0.05,  0.05,   0.1,  0.1,  0.2];
for(var i = 0; i < planted_achievement_values.length; i++) {
  var a = planted_achievement_values[i];
  var b = planted_achievement_bonuses[i];
  var name = 'planted ' + a;
  //if(i > 0) medals[prevmedal].description += '. Next achievement in this series, ' + name + ', unlocks at ' + a + ' planted.';
  var id = registerMedal(name, 'Planted ' + a + ' or more permanent plants over the course of the game', blackberry[0],
      bind(function(a) { return state.g_numfullgrown >= a; }, a),
      Num(b));
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}
medal_register_id += 20; // a few spares for this one

// TODO: have more tree level medals here. But decide this when the game is such that those levels are actually reachable to know what are good bonus values
var level_achievement_values = [[5, 0.025], [10, 0.05], [15, 0.075], [20, 0.1], [25, 0.2],
                                [30, 0.3],  [35, 0.4],  [40, 0.5],  [45, 0.75],  [50, 1.0],
                                [60, 1.5],  [70, 2.5],  [80, 5],  [90, 10],  [100, 15],
                                [110, 25],  [120, 50],  [130, 75],  [140, 150],  [150, 200],
                                [160, 300],  [170, 400],  [180, 500],  [190, 600],  [200, 700]];
for(var i = 0; i < level_achievement_values.length; i++) {
  var level = level_achievement_values[i][0];
  var bonus = Num(level_achievement_values[i][1]);
  var s = Num(level).toString(5, Num.N_FULL);
  var name = 'tree level ' + s;
  //if(i > 0) medals[prevmedal].description += '. Next achievement in this series unlocks at level ' + s + '.';
  var id = registerMedal(name, 'Reached tree level ' + s, tree_images[treeLevelIndex(level)][1][1],
      bind(function(level) { return level <= state.g_treelevel; }, level),
      bonus);
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}

// TODO: from now on, clearly define the value of a new medal series right before it, rather than the "+= 20" system from above, to prevent no accidental changing of all achievement IDs
medal_register_id = 104;
var season_medal = registerMedal('four seasons', 'reached winter and seen all four seasons', image_field_4seasons, function() { return getSeason() == 3; }, Num(0.05));

medal_register_id = 110;
registerMedal('watercress', 'plant the entire field full of watercress', images_watercress[4], function() {
  return state.croptypecount[CROPTYPE_BRASSICA] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('berries', 'plant the entire field full of berries', blackberry[4], function() {
  return state.fullgrowncroptypecount[CROPTYPE_BERRY] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('flowers', 'plant the entire field full of flowers. Pretty, at least that\'s something', images_clover[4], function() {
  return state.fullgrowncroptypecount[CROPTYPE_FLOWER] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('mushrooms', 'plant the entire field full of mushrooms. I, for one, respect our new fungus overlords.', champignon[4], function() {
  return state.fullgrowncroptypecount[CROPTYPE_MUSH] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('stingy situation', 'plant the entire field full of stingy crops', images_nettle[4], function() {
  return state.fullgrowncroptypecount[CROPTYPE_STINGING] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('mistletoes', 'plant the entire field full of mistletoes. You know they only work next to the tree, right?', images_mistletoe[4], function() {
  return state.fullgrowncroptypecount[CROPTYPE_MISTLETOE] == state.numw * state.numh - 2;
}, Num(0.05));
registerMedal('not the bees', 'build the entire field full of bees.', images_beenest[0], function() {
  return state.fullgrowncroptypecount[CROPTYPE_BEE] == state.numw * state.numh - 2;
}, Num(0.1));
registerMedal('unbeelievable', 'fill the entire field (5x5) with bees during the bee challenge.', images_workerbee[4], function() {
  var num = state.fullgrowncropcount[challengecrop_0] + state.fullgrowncropcount[challengecrop_1] + state.fullgrowncropcount[challengecrop_2];
  return num >= 5 * 5 - 2;
}, Num(0.2));
registerMedal('buzzy', 'fill the entire field (5x5) with worker bees during the bees challenge.', images_workerbee[4], function() {
  return state.fullgrowncropcount[challengecrop_0] >= 5 * 5 - 2;
}, Num(0.3));
registerMedal('unbeetable', 'fill the entire field (5x5) with drones during the bees challenge.', images_dronebee[4], function() {
  return state.fullgrowncropcount[challengecrop_1] >= 5 * 5 - 2;
}, Num(0.4));
registerMedal('royal buzz', 'fill the entire field (5x5) with queen bees during the bees challenge.', images_queenbee[4], function() {
  return state.fullgrowncropcount[challengecrop_2] >= 5 * 5 - 2;
}, Num(0.5));


medal_register_id = 125;
var numreset_achievement_values =   [   1,    5,   10,   20,   50,  100,  200,  500, 1000];
var numreset_achievement_bonuses =  [ 0.1,  0.2,  0.25,  0.3,  0.5,   1,    2,    3,    4];
for(var i = 0; i < numreset_achievement_values.length; i++) {
  var level = numreset_achievement_values[i];
  var bonus = Num(numreset_achievement_bonuses[i]);
  var name = 'transcend ' + level;
  //if(i > 0) medals[prevmedal].description += '. Next achievement in this series unlocks at level ' + level + '.';
  var id = registerMedal(name, 'Transcended ' + level + ' times', image_medaltranscend,
      bind(function(level) { return state.g_numresets >= level; }, level),
      bonus);
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}

function getPlantTypeMedalBonus(croptype, tier, num) {
  if(croptype == CROPTYPE_NUT) {
    // nuts don't follow the same tier system as all the other crops that are based around the berry progression, but are based on tree level (through their spores cost) instead, so needs separate formula
    //return Math.pow(1.25, tier);
    return Math.pow(2, (45 + (tier - 1) * 6 - 5) / 10) * 4 / 100;
  }
  if(croptype == CROPTYPE_MUSH) tier = tier * 2 + 1.5;
  if(croptype == CROPTYPE_FLOWER) tier = tier * 2 + 0.5;
  if(croptype == CROPTYPE_STINGING) tier = tier * 8 + 3;
  if(croptype == CROPTYPE_MISTLETOE) tier = 4;
  if(croptype == CROPTYPE_BEE) tier = tier * 8 + 6.75;
  //if(croptype == CROPTYPE_NUT) tier = tier + 9;
  var num2 = (Math.floor(num / 10) + 1);
  //var t = Math.ceil((tier + 1) * Math.log(tier + 1.5));
  var t = Math.pow(1.7, tier);
  var mul = t * num2 / 100 * 0.25;
  return mul;
}

function registerPlantTypeMedal(cropid, num) {
  var c = crops[cropid];
  var mul = getPlantTypeMedalBonus(c.type, c.tier, num);
  return registerMedal(c.name + ' ' + num, 'have ' + num + ' fullgrown ' + c.name, c.image[4], function() {
    if(state.challenge == challenge_towerdefense) return false; // field is bigger during tower defense challenge, so don't give the crop count medals there
    if(state.challenge == challenge_thistle && cropid == nettle_1) return false;
    if(state.challenge == challenge_poisonivy && cropid == nettle_2) return false;
    return state.fullgrowncropcount[cropid] >= num;
  }, Num(mul));
};

// crop count achievements
function registerPlantTypeMedals(cropid, opt_start_at_30) {
  var id0 = opt_start_at_30 ? medal_register_id++ : registerPlantTypeMedal(cropid, 1);
  var id1 = opt_start_at_30 ? medal_register_id++ : registerPlantTypeMedal(cropid, 10); // easy to get for most crops, harder for flowers due to multiplier
  var id2 = opt_start_at_30 ? medal_register_id++ : registerPlantTypeMedal(cropid, 20);
  var id3 = registerPlantTypeMedal(cropid, 30); // requires bigger field
  var id4 = registerPlantTypeMedal(cropid, 40);
  var id5 = registerPlantTypeMedal(cropid, 50);
  // room for 60 and 70 or 75. An 80 is most likely never needed, it's unlikely field size above 9x9 is supported (cells would get too small), which with 81 cells of which 2 taken by tree is not enough for an 80 medal.
  medal_register_id++;
  medal_register_id++;

  // can only plant 1 nut, so could never get those next ones currently, so don't hint for them, even though they're registered they effectively do not exist
  if(crops[cropid].type != CROPTYPE_NUT) {
    if(medals[id0] && medals[id1]) medals[id1].hint = id0;
    if(medals[id1] && medals[id2]) medals[id2].hint = id1;
    if(medals[id2] && medals[id3]) medals[id3].hint = id2;
    if(medals[id3] && medals[id4]) medals[id4].hint = id3;
    if(medals[id4] && medals[id5]) medals[id5].hint = id4;
  }

  return id0;
};

// cropmedals
medal_register_id = 160;
registerPlantTypeMedals(berry_0);
registerPlantTypeMedals(berry_1);
registerPlantTypeMedals(berry_2);
registerPlantTypeMedals(berry_3);
registerPlantTypeMedals(berry_4);
registerPlantTypeMedals(berry_5);
registerPlantTypeMedals(berry_6);
registerPlantTypeMedals(berry_7);
registerPlantTypeMedals(berry_8);
registerPlantTypeMedals(berry_9);
registerPlantTypeMedals(berry_10);
registerPlantTypeMedals(berry_11);
registerPlantTypeMedals(berry_12);
registerPlantTypeMedals(berry_13);
registerPlantTypeMedals(berry_14);
registerPlantTypeMedals(berry_15);
medal_register_id = 320;
registerPlantTypeMedals(mush_0);
registerPlantTypeMedals(mush_1);
registerPlantTypeMedals(mush_2);
registerPlantTypeMedals(mush_3);
registerPlantTypeMedals(mush_4);
registerPlantTypeMedals(mush_5);
registerPlantTypeMedals(mush_6);
registerPlantTypeMedals(mush_7);
medal_register_id = 400;
registerPlantTypeMedals(flower_0);
registerPlantTypeMedals(flower_1);
registerPlantTypeMedals(flower_2);
registerPlantTypeMedals(flower_3);
registerPlantTypeMedals(flower_4);
registerPlantTypeMedals(flower_5);
registerPlantTypeMedals(flower_6);
registerPlantTypeMedals(flower_7);
medal_register_id = 480;
registerPlantTypeMedals(nettle_0);
registerPlantTypeMedals(nettle_1);
registerPlantTypeMedals(nettle_2);
medal_register_id = 560;
var planttypemedals_bee0 = registerPlantTypeMedals(bee_0);
var planttypemedals_bee1 = registerPlantTypeMedals(bee_1);
medal_register_id = 640;
// for the watercress, only start this at 30: the ones for 1, 10, 20 are not added because a medal for 1 watercress is too soon, and for 20 there's already the full field full of watercress medal
// idem for the wasabi since planting a few is trivial
registerPlantTypeMedals(brassica_0, true);
registerPlantTypeMedals(brassica_1, true);
medal_register_id = 720;
registerPlantTypeMedals(mistletoe_0);
medal_register_id = 960;
registerPlantTypeMedal(nut_0, 1);
registerPlantTypeMedal(nut_1, 1);
registerPlantTypeMedal(nut_2, 1);
registerPlantTypeMedal(nut_3, 1);
registerPlantTypeMedal(nut_4, 1);
registerPlantTypeMedal(nut_5, 1);
registerPlantTypeMedal(nut_6, 1);
registerPlantTypeMedal(nut_7, 1);
registerPlantTypeMedal(nut_8, 1);
registerPlantTypeMedal(nut_9, 1);
registerPlantTypeMedal(nut_10, 1);
registerPlantTypeMedal(nut_11, 1);
registerPlantTypeMedal(nut_12, 1);
registerPlantTypeMedal(nut_13, 1);
registerPlantTypeMedal(nut_14, 1);
registerPlantTypeMedal(nut_15, 1);

// was: 600
medal_register_id = 1000;
registerMedal('5 ethereal crops', 'Have 5 ethereal crops', undefined, function() {
  return state.numfullgrowncropfields2 >= 5;
}, Num(0.02));
registerMedal('10 ethereal crops', 'Have 10 ethereal crops', undefined, function() {
  return state.numfullgrowncropfields2 >= 10;
}, Num(0.05));
registerMedal('20 ethereal crops', 'Have 20 ethereal crops', undefined, function() {
  return state.numfullgrowncropfields2 >= 20;
}, Num(0.1));

medal_register_id = 1100;
var fruit_achievement_values =   [   5,   10,   20,   50,  100,  200,  500, 1000, 2000, 5000, 10000];
var fruit_achievement_bonuses =  [0.02, 0.05, 0.05, 0.05,  0.1,  0.1,  0.2,  0.5,  0.5,    1,     2];
var fruit_achievement_images =   [   0,    1,    2,    3,    4,    5,    6,    7,    8,    9,    10];
for(var i = 0; i < fruit_achievement_values.length; i++) {
  var num = fruit_achievement_values[i];
  var bonus = Num(fruit_achievement_bonuses[i]);
  var name = 'fruits ' + num;
  var id = registerMedal(name, 'Found ' + num + ' fruits', images_apple[fruit_achievement_images[i]],
      bind(function(num) { return state.g_numfruits >= num; }, num),
      bonus);
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}

medal_register_id = 1200;

// those higher values like 500 are probably never reachable unless something fundamental is changed to the game design in the future, but that's ok,
// not all medals that are in the code must be reachable.
var level2_achievement_values =  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
for(var i = 0; i < level2_achievement_values.length; i++) {
  var level = level2_achievement_values[i];
  var bonus = Num((level * level) / 20);
  var s = level;
  var name = 'ethereal tree level ' + s;
  var id = registerMedal(name, 'Reached ethereal tree level ' + s, tree_images[treeLevelIndex(level)][1][4],
      bind(function(level) { return level <= state.treelevel2; }, level), bonus);
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}

medal_register_id = 1300;

var resin_achievement_values =           [10,1e2,1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e12,1e15,1e18,1e21,1e24,1e27];
var resin_achievement_bonuses_percent =  [ 1,  2,  5, 10, 15, 20, 35, 50,100, 250, 500,1000,2000,3000,4000];
for(var i = 0; i < resin_achievement_values.length; i++) {
  // have a good spread of this medal, more than exponential growth for its requirement
  var num = Num(resin_achievement_values[i]);
  var full = getLatinSuffixFullNameForNumber(num.mulr(1.1)); // the mulr is to avoid numerical imprecision causing the exponent to be 1 lower and hence the wrong name
  var s0 = num.toString(3, Num.N_LATIN);
  var s1 = num.toString(3, Num.N_SCI);
  var name = full + ' resin ';
  var name2 = (num.ltr(900)) ? (s0) : (s0 + ' (' + s1 + ')');
  var id = registerMedal(name, 'earned over ' + name2 + ' resin in total', image_resin,
      bind(function(num) { return state.g_res.resin.gt(num); }, num),
      Num(resin_achievement_bonuses_percent[i]).mulr(0.01));
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}

// was: 1000
medal_register_id = 2000;

registerMedal('help', 'viewed the main help dialog', image_help, function() {
  return showing_help == true;
}, Num(0.01));

registerMedal('changelog', 'viewed the changelog', images_fern[0], function() {
  return showing_changelog == true;
}, Num(0.01));

registerMedal('stats', 'viewed the player stats', image_stats, function() {
  return showing_stats == true;
}, Num(0.01));

registerMedal('challenge stats', 'viewed the challenge stats', image_stats, function() {
  return showing_challenge_stats == true;
}, Num(0.01));

registerMedal('transcension stats', 'viewed the transcension stats', image_stats, function() {
  return showing_transcension_stats == true;
}, Num(0.01));

registerMedal('automaton dialog', 'viewed the automaton unlock sources dialog by clicking the automaton in the automaton tab', image_automaton, function() {
  return showing_automaton_dialog == true;
}, Num(0.01));

registerMedal('fruit dialog', 'viewed the fruit storage slot sources dialog by clicking on the "stored fruits" text title in the fruit tab', images_apple[3], function() {
  return showing_fruit_dialog == true;
}, Num(0.01));

registerMedal('old squirrel tree', 'viewed the pre-evolution squirrel tree dialog from the squirrel tab', image_squirrel, function() {
  return showing_old_squirrel_dialog == true;
}, Num(0.01));

registerMedal('previous unlocks', 'viewed the "previous unlocks" dialog from the ethereal tree', tree_images[10][1][4], function() {
  return showing_previous_unlocks_dialog == true;
}, Num(0.01));

medal_register_id = 2010;

var gametime_achievement_values =           [1, 7, 30];
var gametime_achievement_bonuses_percent =  [1, 5, 10];
for(var i = 0; i < gametime_achievement_values.length; i++) {
  // have a good spread of this medal, more than exponential growth for its requirement
  var days = gametime_achievement_values[i];
  var name = days + ' ' + (days == 1 ? 'day' : 'days');
  var id = registerMedal(name, 'played for ' + days + ' days', undefined,
      bind(function(days) {
        var play = (state.time - state.g_starttime) / (24 * 3600);
        return play >= days;
      }, days),
      Num(gametime_achievement_bonuses_percent[i]).mulr(0.01));
}

medal_register_id = 2020;

registerMedal('higher transcension', 'performed transcension at exactly twice the initial transcenscion level', undefined, function() {
  // This is a bit of a hacky way to check this, but the goal is that you get the medal when
  // you transcended (so tree level is definitely smaller than 20) and have had at least the
  // tree level 20 to do so. Since this medal was only added to the game at a later point in time,
  // this method of checking also allows players who did transcenscion II in the past but not
  // during the current run to receive it
  return state.g_treelevel >= 20 && state.treelevel < 20;
}, Num(0.1));

medal_register_id = 2100;

registerMedal('the bees knees', 'completed the bees challenge', images_queenbee[4], function() {
  return !!state.challenges[challenge_bees].completed;
}, Num(0.1));

var medal_rock0 = registerMedal('on the rocks', 'completed the rocks challenge', images_rock[1], function() {
  return !!state.challenges[challenge_rocks].completed;
}, Num(0.05));

registerMedal('undeleted', 'completed the undeletable challenge', undefined, function() {
  return !!state.challenges[challenge_nodelete].completed;
}, Num(0.25));

registerMedal('upgraded', 'completed the no upgrades challenge', upgrade_arrow, function() {
  return state.challenges[challenge_noupgrades].completed >= 1;
}, Num(0.25));

registerMedal('upgradeder', 'completed the no upgrades challenge stage 2', upgrade_arrow, function() {
  return state.challenges[challenge_noupgrades].completed >= 2;
}, Num(0.5));

registerMedal('withering', 'completed the wither challenge', undefined, function() {
  return state.challenges[challenge_wither].completed >= 1;
}, Num(0.35));

var medal_wither2 = registerMedal('withered', 'completed the wither challenge stage 2', undefined, function() {
  return state.challenges[challenge_wither].completed >= 2;
}, Num(0.7));

registerMedal('berried', 'completed the blackberry challenge', blackberry[4], function() {
  return state.challenges[challenge_blackberry].completed >= 1;
}, Num(1.0));

registerMedal('B', 'place a bee nest during the blackberry challenge', images_beenest[4], function() {
  return state.challenge == challenge_blackberry && state.fullgrowncropcount[bee_0] > 0;
}, Num(1.5));

var medal_rock1 = registerMedal('rock lobster', 'completed the rocks challenge stage 2', images_rock[2], function() {
  return state.challenges[challenge_rocks].completed >= 2;
}, Num(0.15));
changeMedalDisplayOrder(medal_rock1, medal_rock0);

var medal_rock2 = registerMedal('this rocks!', 'completed the rocks challenge stage 3', images_rock[3], function() {
  return state.challenges[challenge_rocks].completed >= 3;
}, Num(0.45));
changeMedalDisplayOrder(medal_rock2, medal_rock1);

var medal_rock3 = registerMedal('rock star', 'completed the rocks challenge stage 4', images_rock[0], function() {
  return state.challenges[challenge_rocks].completed >= 4;
}, Num(2));
changeMedalDisplayOrder(medal_rock3, medal_rock2);

var medal_rock4 = registerMedal('rocking on', 'completed the rocks challenge stage 5', images_rock[1], function() {
  return state.challenges[challenge_rocks].completed >= 5;
}, Num(5));
changeMedalDisplayOrder(medal_rock4, medal_rock3);

var medal_rock5 = registerMedal('rock pun VI', 'completed the rocks challenge stage 6', images_rock[2], function() {
  return state.challenges[challenge_rocks].completed >= 6;
}, Num(10));
changeMedalDisplayOrder(medal_rock5, medal_rock4);

var medal_rock6 = registerMedal('rock pun VII', 'completed the rocks challenge stage 7', images_rock[3], function() {
  return state.challenges[challenge_rocks].completed >= 7;
}, Num(20));
changeMedalDisplayOrder(medal_rock6, medal_rock5);

var medal_rock7 = registerMedal('rock pun VIII', 'completed the rocks challenge stage 8', images_rock[4], function() {
  return state.challenges[challenge_rocks].completed >= 8;
}, Num(50));
changeMedalDisplayOrder(medal_rock7, medal_rock6);

medal_register_id = 2120;

registerMedal('rock solid', 'completed the rockier challenge', images_rock[0], function() {
  return state.challenges[challenge_rockier].completed;
}, Num(2));

registerMedal('rock solid II', 'completed the rockier challenge map 2', images_rock[0], function() {
  return state.challenges[challenge_rockier].num_completed >= 2;
}, Num(2.5));
medals[medal_register_id - 1].hint = medal_register_id - 2;

registerMedal('rock solid III', 'completed the rockier challenge map 3', images_rock[0], function() {
  return state.challenges[challenge_rockier].num_completed >= 3;
}, Num(3));
medals[medal_register_id - 1].hint = medal_register_id - 2;

registerMedal('rock solid IV', 'completed the rockier challenge map 4', images_rock[0], function() {
  return state.challenges[challenge_rockier].num_completed >= 4;
}, Num(3.5));
medals[medal_register_id - 1].hint = medal_register_id - 2;

registerMedal('rock solid V', 'completed the rockier challenge map 5 (final)', images_rock[0], function() {
  return state.challenges[challenge_rockier].num_completed >= 5;
}, Num(4));
medals[medal_register_id - 1].hint = medal_register_id - 2;

medal_register_id = 2130;

var medal_challenge_thistle = registerMedal('prickly predicament', 'completed the thistle challenge', images_thistle[4], function() {
  return state.challenges[challenge_thistle].completed;
}, Num(3));

var medal_challenge_wasabi = registerMedal('wasaaaa, B', 'completed the wasabi challenge', images_wasabi[4], function() {
  return state.challenges[challenge_wasabi].completed;
}, Num(4));

var medal_challenge_basic = registerMedal('the basics', 'ran the basic challenge', genericicon, function() {
  return state.challenges[challenge_basic].completed;
}, Num(1));

// NOTE: this achievement is quasy-unobtainable, since in testing it took over 60 days to get it with 7x7 field and platinum fruit
registerMedal('beesic', 'get a bee nest during the basic challenge', images_beenest[4], function() {
  return state.challenge == challenge_basic && state.fullgrowncropcount[bee_0] > 0;
}, Num(2));

medal_register_id = 2135;

registerMedal('basic 15', 'reach level 15 in the basic challenge', genericicon, function() {
  return state.challenge == challenge_basic && state.treelevel >= 15;
}, Num(2));

registerMedal('basic 20', 'reach level 20 in the basic challenge', genericicon, function() {
  return state.challenge == challenge_basic && state.treelevel >= 20;
}, Num(2));

registerMedal('basic 25', 'reach level 25 in the basic challenge', genericicon, function() {
  return state.challenge == challenge_basic && state.treelevel >= 25;
}, Num(2.5));

// this takes almost a month to reach
registerMedal('basic 30', 'this is the final achievement for the basic challenge. Higher levels are capped and won\'t give additional challenge bonus.', genericicon, function() {
  return state.challenge == challenge_basic && state.treelevel >= 30;
}, Num(3));

registerDeprecatedMedal(); // was reserved for basic 35, but doing this takes too long and the game now caps it at 30 to avoid incentivizing this
registerDeprecatedMedal(); // was reserved for basic 40, but doing this takes too long and the game now caps it at 30 to avoid incentivizing this

medal_register_id = 2150;

var medal_challenge_truly_basic = registerMedal('master of basic', 'completed the truly basic challenge', genericicon, function() {
  return state.challenges[challenge_truly_basic].completed;
}, Num(5));

medal_register_id = 2155;

registerMedal('truly basic 15', 'reach level 15 in the truly basic challenge', genericicon, function() {
  return state.challenge == challenge_truly_basic && state.treelevel >= 15;
}, Num(2));

registerMedal('truly basic 20', 'reach level 20 in the truly basic challenge', genericicon, function() {
  return state.challenge == challenge_truly_basic && state.treelevel >= 20;
}, Num(2.5));

// this medal may require more than a month of truly basic to reach
registerMedal('truly basic 25', 'this is the final achievement for the truly basic challenge. Higher levels are capped and won\'t give additional challenge bonus.', genericicon, function() {
  return state.challenge == challenge_truly_basic && state.treelevel >= 25;
}, Num(3));

registerDeprecatedMedal(); // was reserved for truly basic 30, but doing this takes too long and the game now caps it at 25 to avoid incentivizing this

medal_register_id = 2170;

var medal_challenge_stormy = registerMedal('stormy', 'completed the stormy challenge', image_storm, function() {
  return state.challenges[challenge_stormy].completed;
}, Num(1));

var medal_challenge_infernal = registerMedal('infernal', 'completed the infernal challenge', field_infernal[2], function() {
  return state.challenges[challenge_infernal].completed;
}, Num(1.5));

registerMedal('infernal bees', 'have bees during the infernal challenge', images_beenest[4], function() {
  return state.challenge == challenge_infernal && state.fullgrowncropcount[bee_0] > 0;
}, Num(2));

registerMedal('infernal prestige', 'prestige a crop during infernal challenge', field_infernal[3], function() {
  return state.challenge == challenge_infernal && state.crops[berry_0].prestige >= 1;
}, Num(3));

medal_register_id = 2180;

var medal_challenge_poison_ivy = registerMedal('poisonous perils', 'completed the poison ivy challenge', images_poisonivy[4], function() {
  return state.challenges[challenge_poisonivy].completed;
}, Num(10));

medal_register_id = 2500;

function registerPrestigeMedal(cropid) {
  var crop = crops[cropid];
  var name = crop.name + ' prestige';
  var desc = 'prestiged the ' + crop.name;
  registerMedal(name, desc, crop.image[4], function() {
    return state.crops[cropid].prestige >= 1;
  }, Num(2 * getPlantTypeMedalBonus(crop.type, crop.tier + num_tiers_per_crop_type[crop.type], 1)));
}
for(var i = 0; i < 16; i++) {
  registerPrestigeMedal(berry_0 + i);
}

medal_register_id = 2600;
for(var i = 0; i < 8; i++) {
  registerPrestigeMedal(mush_0 + i);
}

medal_register_id = 2700;
for(var i = 0; i < 8; i++) {
  registerPrestigeMedal(flower_0 + i);
}

medal_register_id = 2800;
for(var i = 0; i < 16; i++) {
  registerPrestigeMedal(nut_0 + i);
}

medal_register_id = 2900;
var nuts_achievement_values =            [1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24, 1e27, 1e30, 1e33, 1e36, 1e39, 1e42, 1e45, 1e48, 1e51, 1e54, 1e57, 1e60, 1e63, 1e66, 1e69, 1e72, 1e75, 1e78, 1e81, 1e84, 1e87, 1e90, 1e93, 1e96, 1e99];
var nuts_achievement_bonuses_percent =   [  1,   3,   5,   10,   20,   30,   40,   50,   60,   70,   80,  100,  150,  200,  300,  400,  500,  600,  700,  800,  900, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 15000];
for(var i = 0; i < nuts_achievement_values.length; i++) {
  // have a good spread of this medal, more than exponential growth for its requirement
  var num = Num(nuts_achievement_values[i]);
  var full = getLatinSuffixFullNameForNumber(num.mulr(1.1)); // the mulr is to avoid numerical imprecision causing the exponent to be 1 lower and hence the wrong name
  var s0 = num.toString(3, Num.N_LATIN);
  var s1 = num.toString(3, Num.N_SCI);
  var name = full + ' nuts';
  var id = registerMedal(name, 'have over ' + s0 + ' (' + s1 + ') nuts', image_nuts,
      bind(function(num) { return state.res.nuts.gt(num); }, num),
      Num(nuts_achievement_bonuses_percent[i]).mulr(0.01));
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}


medal_register_id = 3000;
// various misc medals here

// ghost crops can happen when prestiging during the undeletable challenge, or during the stormy challenge
registerMedal('ghost in the field', 'have a ghost-crop', image_berryghost, function() {
  return state.ghostcount > 0;
}, Num(1));

registerMedal('ghost town', 'have 10 ghost crops in the field', image_mushghost, function() {
  return state.ghostcount >= 10;
}, Num(1.5));

registerMedal('who you gonna call?', 'have the whole field full of ghost crops', image_flowerghost, function() {
  if(state.ghostcount == 0) return false;
  var numfield = state.numw * state.numh - 2; // subtract tree
  if(state.ghostcount >= numfield) return true;
  if(state.ghostcount2 >= numfield) {
    var dead_brassica = state.ghostcount2 - state.ghostcount;
    if(dead_brassica <= 4) return true; // allow up to 4 dead brassica instead of true ghosts: so that someone with a layout with brassica who leaves it overnight during the stormy challenge, still has a chance to get this achieve
  }
  return false;
}, Num(2));

// this is equivalent to prestiging during the undeletable challenge
registerMedal('undeletable ghost', 'get a ghost-crop during the undeletable challenge', image_berryghost, function() {
  return state.ghostcount > 0 && state.challenge == challenge_nodelete;
}, Num(1));

var medal_tb_speed_0 = registerMedal('truly basic speed 2.5h', 'reach level 10 in the truly basic challenge in 2.5 hours or less', image_hourglass, function() {
  var runtime = 9000;
  if(state.challenge == challenge_truly_basic && state.treelevel >= 10 && state.c_runtime <= runtime) return true;
  var besttime = state.challenges[challenge_truly_basic].besttime;
  if(state.challenges[challenge_truly_basic].completed && !!besttime && besttime <= runtime) return true; // also apply retroactively
  return false;
}, Num(1));


var medal_tb_speed_1 = registerMedal('truly basic speed 2h', 'reach level 10 in the truly basic challenge in 2 hours or less', image_hourglass, function() {
  var runtime = 7200;
  if(state.challenge == challenge_truly_basic && state.treelevel >= 10 && state.c_runtime <= runtime) return true;
  var besttime = state.challenges[challenge_truly_basic].besttime;
  if(state.challenges[challenge_truly_basic].completed && !!besttime && besttime <= runtime) return true; // also apply retroactively
  return false;
}, Num(2));
medals[medal_tb_speed_1].hint = medal_tb_speed_0;

var medal_tb_speed_2 = registerMedal('truly basic speed 1.5h', 'reach level 10 in the truly basic challenge in 1.5 hours or less', image_hourglass, function() {
  var runtime = 5400;
  if(state.challenge == challenge_truly_basic && state.treelevel >= 10 && state.c_runtime <= runtime) return true;
  var besttime = state.challenges[challenge_truly_basic].besttime;
  if(state.challenges[challenge_truly_basic].completed && !!besttime && besttime <= runtime) return true; // also apply retroactively
  return false;
}, Num(3));
medals[medal_tb_speed_2].hint = medal_tb_speed_1;

var medal_tb_speed_3 = registerMedal('truly basic speed 1h', 'reach level 10 in the truly basic challenge in 1 hour or less', image_hourglass, function() {
  var runtime = 3600;
  if(state.challenge == challenge_truly_basic && state.treelevel >= 10 && state.c_runtime <= runtime) return true;
  var besttime = state.challenges[challenge_truly_basic].besttime;
  if(state.challenges[challenge_truly_basic].completed && !!besttime && besttime <= runtime) return true; // also apply retroactively
  return false;
}, Num(4));
medals[medal_tb_speed_3].hint = medal_tb_speed_2;


medal_register_id = 3020;

registerMedal('squirrel evolution', 'evolve the squirrel', image_squirrel_evolution, function() {
  return state.squirrel_evolution >= 1;
}, Num(100));

var medal_challenge_thistle_stingy = registerMedal('rather stingy', 'plant the entire field full of stinging crops during the thistle challenge', images_thistle[4], function() {
  return state.challenge == challenge_thistle && state.fullgrowncroptypecount[CROPTYPE_STINGING] >= (state.numw * state.numh - 2);
}, Num(4));
changeMedalDisplayOrder(medal_challenge_thistle_stingy, medal_challenge_thistle);

registerMedal('squirrel evolution II', 'evolve the squirrel a second time', image_squirrel_evolution2, function() {
  return state.squirrel_evolution >= 2;
}, Num(200));

medal_register_id = 3040;

var medal_wither3 = registerMedal('withered III', 'completed the wither challenge stage 3', undefined, function() {
  return state.challenges[challenge_wither].completed >= 3;
}, Num(2));
changeMedalDisplayOrder(medal_wither3, medal_wither2);

var medal_wither4 = registerMedal('withered IV', 'completed the wither challenge stage 4', undefined, function() {
  return state.challenges[challenge_wither].completed >= 4;
}, Num(4));
changeMedalDisplayOrder(medal_wither4, medal_wither3);

var medal_wither5 = registerMedal('withered V', 'completed the wither challenge stage 5', undefined, function() {
  return state.challenges[challenge_wither].completed >= 5;
}, Num(5));
changeMedalDisplayOrder(medal_wither5, medal_wither4);

var medal_wither6 = registerMedal('withered VI', 'completed the wither challenge stage 6', undefined, function() {
  return state.challenges[challenge_wither].completed >= 6;
}, Num(10));
changeMedalDisplayOrder(medal_wither6, medal_wither5);

var medal_wither7 = registerMedal('withered VII', 'completed the wither challenge stage 7', undefined, function() {
  return state.challenges[challenge_wither].completed >= 7;
}, Num(100));
changeMedalDisplayOrder(medal_wither7, medal_wither6);



// infinity field related medals
medal_register_id = 4000;

// The doubling of these achievements is because each next time you plant the first brassica tier, you can plant twice as much as before

registerMedal('One infinity', 'Have one crop on the infinity field', image_infinity, function() {
  return state.numcropfields3 >= 1;
}, Num(10));

registerMedal('Two infinities', 'Have two crops on the infinity field', image_infinity, function() {
  return state.numcropfields3 >= 2;
}, Num(20));

registerMedal('Four infinities', 'Have four crops on the infinity field', image_infinity, function() {
  return state.numcropfields3 >= 4;
}, Num(40));

registerMedal('Eight infinities', 'Have eight crops on the infinity field', image_infinity, function() {
  return state.numcropfields3 >= 8;
}, Num(80));

registerMedal('Sixtien infinities', 'Have sixteen crops on the infinity field', image_infinity, function() {
  return state.numcropfields3 >= 16;
}, Num(160));

registerMedal('Infinite infinities', 'Filled the entire infinity field with crops', image_infinity, function() {
  return state.numemptyfields3 == 0;
}, Num(250));

// Specific achievements for infinity runestones, because of how much their cost scales

var medal_runestone1 = registerMedal('One runestone', 'Have one runestone on the infinity field', images_runestone[4], function() {
  return state.crop3count[runestone3_0] >= 1;
}, Num(100));

var medal_runestone2 = registerMedal('Two runestones', 'Have two runestones on the infinity field', images_runestone[4], function() {
  return state.crop3count[runestone3_0] >= 2;
}, Num(200));

var medal_runestone3 = registerMedal('Three runestones', 'Have three runestones on the infinity field', images_runestone[4], function() {
  return state.crop3count[runestone3_0] >= 3;
}, Num(400));

var medal_runestone4 = registerMedal('Four runestones', 'Have four runestones on the infinity field', images_runestone[4], function() {
  return state.crop3count[runestone3_0] >= 4;
}, Num(800));

var medal_runestone5 = registerMedal('Five runestones', 'Have five runestones on the infinity field', images_runestone[4], function() {
  return state.crop3count[runestone3_0] >= 5;
}, Num(1600));

var medal_runestone6 = registerMedal('Six runestones', 'Have six runestones on the infinity field', images_runestone[4], function() {
  return state.crop3count[runestone3_0] >= 6;
}, Num(3200));

var medal_runestone7 = registerMedal('Seven runestones', 'Have seven runestones on the infinity field', images_runestone[4], function() {
  return state.crop3count[runestone3_0] >= 7;
}, Num(6400));

var medal_runestone8 = registerMedal('Eight runestones', 'Have eight runestones on the infinity field', images_runestone[4], function() {
  return state.crop3count[runestone3_0] >= 8;
}, Num(12800));

// more infinity related achievements
medal_register_id = 4100;

registerMedal('Infinity ascenscion', 'Ascended the infinity field', image_infinity_ascend, function() {
  return state.infinity_ascend >= 1;
}, Num(10000));

// individual infinity crop achievements
medal_register_id = 4200;

function getPlantTypeMedalBonus3(cropid) {
  var c = crops3[cropid];
  var l = Num.rlog(c.cost.infseeds);
  return Math.pow(l * 2, 1.15);
}

function registerPlantTypeMedal3(cropid) {
  var c = crops3[cropid];
  var mul = getPlantTypeMedalBonus3(cropid);
  return registerMedal('Infinity ' + lower(c.name), 'Have a ' + c.name + ' on the infinity field', c.image[4], function() {
    if(c.type == CROPTYPE_BRASSICA) return state.crop3count[cropid] >= 1;
    if(c.index == mistletoe3_11 && state.infinity_ascend >= 1) return true; // infinity mistletoe medal was forgotten, and won't be reachable by already ascended players without this tweak
    return state.fullgrowncrop3count[cropid] >= 1; // alternatives: fullgrowncrop3count to require it to grow fully, crop3count to get it immediately when planting. Make sure this matches how .had is set, to avoid that you can get medal early, but next crop unlocks only later, which is confusing
  }, Num(mul));
};

// cropmedals3
registerPlantTypeMedal3(brassica3_0);
registerPlantTypeMedal3(berry3_0);
registerPlantTypeMedal3(flower3_0);
registerPlantTypeMedal3(brassica3_1);
registerPlantTypeMedal3(berry3_1);
registerPlantTypeMedal3(flower3_1);
registerPlantTypeMedal3(brassica3_2);
registerPlantTypeMedal3(berry3_2);
registerPlantTypeMedal3(flower3_2);
registerPlantTypeMedal3(bee3_2);
registerPlantTypeMedal3(brassica3_3);
registerPlantTypeMedal3(berry3_3);
registerPlantTypeMedal3(flower3_3);
registerPlantTypeMedal3(bee3_3);
registerPlantTypeMedal3(brassica3_4);
registerPlantTypeMedal3(berry3_4);
registerPlantTypeMedal3(flower3_4);
registerPlantTypeMedal3(bee3_4);
registerPlantTypeMedal3(mush3_4);
registerPlantTypeMedal3(brassica3_5);
registerPlantTypeMedal3(berry3_5);
registerPlantTypeMedal3(flower3_5);
registerPlantTypeMedal3(bee3_5);
registerPlantTypeMedal3(mush3_5);
registerPlantTypeMedal3(brassica3_6);
registerPlantTypeMedal3(berry3_6);
registerPlantTypeMedal3(flower3_6);
registerPlantTypeMedal3(bee3_6);
registerPlantTypeMedal3(mush3_6);
registerPlantTypeMedal3(stinging3_6);
registerPlantTypeMedal3(brassica3_7);
registerPlantTypeMedal3(berry3_7);
registerPlantTypeMedal3(flower3_7);
registerPlantTypeMedal3(bee3_7);
registerPlantTypeMedal3(mush3_7);
registerPlantTypeMedal3(stinging3_7);
registerPlantTypeMedal3(fern3_7);
registerPlantTypeMedal3(brassica3_8);
registerPlantTypeMedal3(berry3_8);
registerPlantTypeMedal3(flower3_8);
registerPlantTypeMedal3(bee3_8);
registerPlantTypeMedal3(mush3_8);
registerPlantTypeMedal3(stinging3_8);
registerPlantTypeMedal3(fern3_8);
registerPlantTypeMedal3(nut3_8);
registerPlantTypeMedal3(brassica3_9);
registerPlantTypeMedal3(berry3_9);
registerPlantTypeMedal3(mush3_9);
registerPlantTypeMedal3(flower3_9);
registerPlantTypeMedal3(stinging3_9);
registerPlantTypeMedal3(bee3_9);
registerPlantTypeMedal3(fern3_9);
registerPlantTypeMedal3(nut3_9);
registerPlantTypeMedal3(lotus3_9);
registerPlantTypeMedal3(brassica3_10);
registerPlantTypeMedal3(berry3_10);
registerPlantTypeMedal3(mush3_10);
registerPlantTypeMedal3(flower3_10);
registerPlantTypeMedal3(stinging3_10);
registerPlantTypeMedal3(bee3_10);
registerPlantTypeMedal3(fern3_10);
registerPlantTypeMedal3(nut3_10);
registerPlantTypeMedal3(lotus3_10);
registerPlantTypeMedal3(brassica3_11);
registerPlantTypeMedal3(berry3_11);
registerPlantTypeMedal3(mush3_11);
registerPlantTypeMedal3(flower3_11);
registerPlantTypeMedal3(bee3_11);
registerPlantTypeMedal3(stinging3_11);
registerPlantTypeMedal3(fern3_11);
registerPlantTypeMedal3(nut3_11);
var medal_lotus3_11 = registerPlantTypeMedal3(lotus3_11);
registerPlantTypeMedal3(mush3_t);
var medal_mistletoe3_11 = registerPlantTypeMedal3(mistletoe3_11);
changeMedalDisplayOrder(medal_mistletoe3_11, medal_lotus3_11);


// fish crop achievements
medal_register_id = 4700;

function getFishTypeMedalBonus(fishid) {
  var c = fishes[fishid];
  var l = Num.rlog(c.cost.infspores);
  return Math.pow(l * 20, 1.15);
}

function registerFishTypeMedal(fishid) {
  var c = fishes[fishid];
  var mul = getFishTypeMedalBonus(fishid);
  return registerMedal(upper(c.name), 'Have a ' + c.name + ' in the infinity pond', c.image, function() {
    return state.fishcount[fishid] >= 1;
  }, Num(mul));
};

registerFishTypeMedal(goldfish_0);
registerFishTypeMedal(koi_0);
registerFishTypeMedal(octopus_0);
registerFishTypeMedal(shrimp_0);
registerFishTypeMedal(anemone_0);
registerFishTypeMedal(puffer_0);
registerFishTypeMedal(eel_0);
registerFishTypeMedal(tang_0);
registerFishTypeMedal(goldfish_1);
registerFishTypeMedal(anemone_1);
registerFishTypeMedal(koi_1);
registerFishTypeMedal(puffer_1);
registerFishTypeMedal(eel_1);
registerFishTypeMedal(tang_1);
registerFishTypeMedal(leporinus_0);
registerFishTypeMedal(oranda_0);
registerFishTypeMedal(shrimp_1);
registerFishTypeMedal(octopus_1);
registerFishTypeMedal(goldfish_2);
registerFishTypeMedal(oranda_1);
registerFishTypeMedal(anemone_2);
registerFishTypeMedal(puffer_2);
registerFishTypeMedal(leporinus_1);
registerFishTypeMedal(octopus_2);
registerFishTypeMedal(tang_2);
registerFishTypeMedal(eel_2);
registerFishTypeMedal(goldfish_3);
registerFishTypeMedal(oranda_2);
registerFishTypeMedal(eel_t);
registerFishTypeMedal(tang_t);
registerFishTypeMedal(jellyfish_t);



// tower defense achievements
medal_register_id = 5000;
registerMedal('Tower defender', 'Reach level 50 during tower defense', images_statue_spore[0], function() {
  return challengeMaxLevel(challenge_towerdefense) >= 50;
}, Num(1));
registerMedal('Tower defender II', 'Reach level 100 during tower defense', images_statue_spore[0], function() {
  return challengeMaxLevel(challenge_towerdefense) >= 100;
}, Num(2));
registerMedal('Tower defender III', 'Reach level 150 during tower defense', images_statue_spore[0], function() {
  return challengeMaxLevel(challenge_towerdefense) >= 150;
}, Num(5));
registerMedal('Tower defender IV', 'Reach level 150 during tower defense', images_statue_spore[0], function() {
  return challengeMaxLevel(challenge_towerdefense) >= 200;
}, Num(10));

medal_register_id = 5025;
registerMedal('Exterminate!', 'Exterminate a pest during tower defense', images_ant[0], function() {
  return state.g_td_kills >= 1;
}, Num(0.1));

registerMedal('Exterminator', 'Exterminate 100 pests during tower defense', images_ant[0], function() {
  return state.g_td_kills >= 100;
}, Num(1));

registerMedal('Extermination', 'Exterminate 10000 pests during tower defense', images_ant[0], function() {
  return state.g_td_kills >= 10000;
}, Num(2));

medal_register_id = 5050;
registerMedal('Icy tower', 'Reach level 70 during tower defense in winter', image_medal_icy_tower, function() {
  return state.challenge == challenge_towerdefense && state.treelevel >= 70 && getSeason() == 3;
}, Num(1));

function seedsToMedalBonus(seeds) {
  var l = Num.log2(seeds);
  // tuned to be a bit like before the seeds achievements had a formula but were manual,
  // but as of nov 2024 they now use this formula since much more medals were added
  return l.mulr(0.0005).powr(1.25).add(l.mulr(0.005).powr(3)).add(l.mulr(0.007).powr(5.3));
}

// was: 4; the seed achievements were moved to 6000 to give room for much more of them
medal_register_id = 6000;
var seeds_achievement_values = [
  1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24, 1e27, 1e30, 1e36, 1e42, 1e48, 1e54, 1e60, 1e66, 1e72, 1e78, 1e84, 1e90,
  1e96, 1e102, 1e108, 1e114, 1e120, 1e126, 1e132, 1e138, 1e144, 1e150, 1e156, 1e162, 1e168, 1e174, 1e180, 1e186, 1e192, 1e198,
  1e204, 1e210, 1e216, 1e222, 1e228, 1e234, 1e240, 1e246, 1e252, 1e258, 1e266, 1e272, 1e278, 1e284, 1e290, 1e296, 1e302, 1e308,
  Num.parse('1e314')
];
var seedmedal_index0 = medal_register_id;
for(var i = 0; i < seeds_achievement_values.length; i++) {
  // have a good spread of this medal, more than exponential growth for its requirement
  var num = Num(seeds_achievement_values[i]);
  var full = getLatinSuffixFullNameForNumber(num.mulr(1.1)); // the mulr is to avoid numerical imprecision causing the exponent to be 1 lower and hence the wrong name
  var s0 = num.toString(3, Num.N_LATIN);
  var s1 = num.toString(3, Num.N_SCI);
  var name = full + ' seeds';
  var bonus = Num.roundToNearestHumanNumber(seedsToMedalBonus(num));
  var id = registerMedal(name, 'have over ' + s0 + ' (' + s1 + ') seeds', image_seed,
      bind(function(num) {
        return state.res.seeds.gt(num);
      }, num), bonus);
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}
var seedmedal_index1 = medal_register_id;
changeMedalsDisplayOrder(seedmedal_index0, seedmedal_index1, 3);





////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// only returns useful result if there is currenlty no infspawn
function getNextInfspawnTime() {
  var d = state.time - state.lastInfTakeTime;

  var minHours = 24;
  var graceHours = state.infspawnGraceTime / 3600;
  // the more time lost in picking up the infspawn, the faster a new one can appear
  if(graceHours > 0) minHours = 12;
  if(graceHours > 12) minHours = 10;
  if(graceHours > 24) minHours = 8;
  if(graceHours > 36) minHours = 6;
  if(graceHours > 48) minHours = 4;
  if(graceHours > 72) minHours = 2;

  var minTime = state.lastInfTakeTime + minHours * 3600;
  var maxTime = state.lastInfTakeTime + 28 * 3600; // normally it should actually never happen that it's more than 24, but just in case due to some reason player got a negative graceTime (which means having picked up too much), delay next ones by 4 hours
  var result = state.lastInfTakeTime + 24 * 3600 - state.infspawnGraceTime;
  result = Math.min(Math.max(minTime, result), maxTime);
  return result;
}

function infinityAscensionOk() {
  if(!state.medals[medal_runestone8].earned) return false;
  for(var i = 0; i < registered_crops3.length; i++) {
    if(!state.crops3[registered_crops3[i]].had) {
      return false;
    }
  }
  for(var i = 0; i < registered_fishes.length; i++) {
    if(!state.fishes[registered_fishes[i]].had) {
      return false;
    }
  }
  return true;
}

function ascendInfinity() {
  if(state.infinity_ascend) return; // already ascended

  state.infinity_ascend = 1;
  state.infinityascendtime = state.time;
  state.infinity_res = new Res();

  state.numw3++;
  state.numh3++;
  state.pondw++;
  state.pondh++;

  clearField3(state);
  initField3UI();

  clearPond(state);
  // no need to initPondUI here: that one is in a dialog and requires to know the dialog flex

  for(var i = 0; i < registered_crops3.length; i++) {
    var c = state.crops3[registered_crops3[i]];
    c.had = false;
    c.unlocked = false;
  }
  for(var i = 0; i < registered_fishes.length; i++) {
    var c = state.fishes[registered_fishes[i]];
    c.had = false;
    c.unlocked = false;
  }

  state.g_max_infinityboost = new Num(0);

  state.res.infseeds = new Num(0);
  state.res.infspores = new Num(0);

  return true;
}

////////////////////////////////////////////////////////////////////////////////

var maxAutomaticTranscendsSinceHumanAction = 20;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// returns the index to use for state.g_numpresents
function holidayPresentIndex() {
  var date = new Date();
  var year = date.getYear() + 1900;
  var month = date.getMonth() + 1;
  if(month >= 12) {
    year++;
    month = 1;
  }

  var index = (year - 2024) * 2 + 2; // winter
  if(month >= 3) index++; // spring

  if(index < 0) index = 0;
  if(index > 20) index = 20; // avoid huge array due to wrong date

  return index;
}

// holiday events: 0=none, 1=presents, 2=eggs, 4=pumpkins
// it's in theory possible to use bit masks to filter the return value, e.g. (holidayEventActive() & 3) for presents or eggs, but the return value will always contain exactly 1 holiday (1 bit set)
// NOTE: slow function due to usage of 'new Date', use 'state.holiday' to access this value whenever possible
function holidayEventActive() {
  var date = new Date();
  //date = new Date(date.getSeconds() * 2000000000); // debug season transitions by having time go really fast
  var month = date.getMonth() + 1;
  var day = date.getDate();

  // Presents: 7 december til 7 january
  if((month == 12 && day >= 7) || (month == 1 && day <= 7)) return 1;

  // eggs: 25 march til 25 april
  if((month == 3 && day >= 25) || (month == 4 && day <= 25)) return 2;

  // pumpkins: 6 october til 6 november
  if((month == 10 && day >= 6) || (month == 11 && day <= 6)) return 4;

  return 0;
}


