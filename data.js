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

// The game data: definition of upgrades, crops, ...

var seasonNames = ['spring', 'summer', 'autumn', 'winter'];

var croptype_index = 0;
var CROPTYPE_BERRY = croptype_index++;
var CROPTYPE_MUSH = croptype_index++;
var CROPTYPE_FLOWER = croptype_index++;
var CROPTYPE_NETTLE = croptype_index++;
var CROPTYPE_SHORT = croptype_index++;
var CROPTYPE_SPECIAL = croptype_index++; // used for some ethereal crops
var NUM_CROPTYPES = croptype_index;

function getCropTypeName(type) {
  if(type == CROPTYPE_BERRY) return "berry";
  if(type == CROPTYPE_MUSH) return "mushroom";
  if(type == CROPTYPE_FLOWER) return "flower";
  if(type == CROPTYPE_NETTLE) return "nettle";
  if(type == CROPTYPE_SHORT) return "short-lived";
  return "unknown";
}

function getCropTypeHelp(type) {
  switch(type) {
    case CROPTYPE_MUSH: return 'Requires berries as neighbors to consume seeds to produce spores. Neighboring watercress can leech its production (but also consumption), producing more spores overall given enough seeds.';
    case CROPTYPE_NETTLE: return 'Boosts neighboring mushrooms spores production, but negatively affects neighboring berries and flowers, so avoid touching those with this plant';
    case CROPTYPE_FLOWER: return 'Boosts neighboring berries and mushrooms, their production but also their consumption. Negatively affected by neighboring nettles.';
    case CROPTYPE_SHORT: return 'Produces a small amount of seeds on its own, but can produce much more resources by leeching from berry and mushroom neighbors';
    case CROPTYPE_BERRY: return 'Produces seeds. Boosted by flowers. Negatively affected by nettles. Neighboring mushrooms can consume its seeds to produce spores. Neighboring watercress can leech its production, producing more seeds overall.';
  }
  return undefined;
}

var fern_wait_minutes = 2; // default fern wait minutes (in very game they go faster)


var bonus_season_flower_spring = 1.25;
var bonus_season_berry_summer = 1.5;
var bonus_season_mushroom_autumn = 2;
var malus_season_winter = 0.75;


var fog_duration = 2 * 60;
var fog_wait = 10 * 60 + fog_duration;

function getFogDuration() {
  var result = fog_duration;
  if(state.upgrades[active_choice0_a].count) result *= 2;
  return result;
}

function getFogWait() {
  var result = fog_wait;
  if(state.upgrades[active_choice0_a].count) result *= 2;
  return result;
}

var sun_duration = 3 * 60;
var sun_wait = 15 * 60 + sun_duration;

function getSunDuration() {
  var result = sun_duration;
  if(state.upgrades[active_choice0_a].count) result *= 2;
  return result;
}

function getSunWait() {
  var result = sun_wait;
  if(state.upgrades[active_choice0_a].count) result *= 2;
  return result;
}

var rainbow_duration = 4 * 60;
var rainbow_wait = 20 * 60 + rainbow_duration;

function getRainbowDuration() {
  var result = rainbow_duration;
  if(state.upgrades[active_choice0_a].count) result *= 2;
  return result;
}

function getRainbowWait() {
  var result = rainbow_wait;
  if(state.upgrades[active_choice0_a].count) result *= 2;
  return result;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// @constructor
function Crop() {
  this.name = 'a';
  this.cost = Res(); // one-time cost (do not use directly, use getCost() to get all multipliers taken into account)
  this.prod = Res(); // production per second (do not use directly, use getProd() to get all multipliers taken into account)
  this.index = 0; // index in the crops array
  this.planttime = 0; // in seconds
  this.boost = Num(0); // how much this boosts neighboring crops, 0 means no boost, 1 means +100%, etc... (do not use directly, use getBoost() to get all multipliers taken into account)
  this.tagline = '';
  // multipliers for particular seasons
  this.bonus_season = [Num(1), Num(1), Num(1), Num(malus_season_winter)];

  this.basic_upgrade = null; // id of registered upgrade that does basic upgrades of this plant

  this.image = undefined;

  this.type = undefined;
  this.tier = 0;
};

var sameTypeCostMultiplier = 1.5;
var sameTypeCostMultiplier_Flower = 2;
var sameTypeCostMultiplier_Short = 1;
var cropRecoup = 0.33;  // recoup for deleting a plant. It is only partial, the goal of the game is not to replace plants often

// ethereal version
var sameTypeCostMultiplier2 = 1.5;
var sameTypeCostMultiplier_Flower2 = 2;
var sameTypeCostMultiplier_Special2 = 1.5;
var cropRecoup2 = 1.0; // 100% resin recoup. But deletions are limited through max amount of deletions per season instead

//for state.delete2tokes
var delete2perSeason = 2; // how many deletions on the ethereal field may be done per season
var delete2maxBuildup = delete2perSeason * 4; // how many deletions can be saved up for future use when seasons change
var delete2initial = delete2perSeason * 2; // how many deletions received at game start (NOTE: delete2perSeason only gotten at next season change, not at game start)



function reduceGrowTime(time, reduce) {
  if(time > reduce * 2) {
    time -= reduce;
  } else {
    time /= 2;
  }

  return time;
}


Crop.prototype.getPlantTime = function() {
  var result = this.planttime;

  // This is the opposite for croptype_short, it's not planttime but live time. TODO: make two separate functions for this
  if(this.type == CROPTYPE_SHORT) {
    if(this.basic_upgrade != null) {
      var u = state.upgrades[this.basic_upgrade];
      var u2 = upgrades[this.basic_upgrade];
      if(u.count > 0) {
        result += (this.planttime * u2.bonus) * u.count;
      }
    }

    return result;
  }

  if(state.upgrades2[upgrade2_time_reduce_0].count) {
    result = reduceGrowTime(result, upgrade2_time_reduce_0_amount);
  }

  return result;
};

Crop.prototype.getCost = function(opt_adjust_count) {
  var mul = sameTypeCostMultiplier;
  if(this.type == CROPTYPE_FLOWER) mul = sameTypeCostMultiplier_Flower;
  if(this.type == CROPTYPE_SHORT) mul = sameTypeCostMultiplier_Short;
  var countfactor = Math.pow(mul, state.cropcount[this.index] + (opt_adjust_count || 0));
  return this.cost.mulr(countfactor);
};

// used for multiple possible aspects, such as production, boost if this is a flower, etc...
Crop.prototype.getSeasonBonus = function(season) {
  var bonus_season = this.bonus_season[season];

  return bonus_season;
}

// f = Cell from field, or undefined to not take location-based production bonuses into account
// pretend: compute income if this plant would be planted here, while it doesn't exist here in reality. For the planting dialog UI
Crop.prototype.getProd = function(f, pretend, breakdown) {
  var result = Res(this.prod);
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  if(!pretend && f && f.growth < 1 && this.type != CROPTYPE_SHORT) {
    return Res();
  }

  // medal
  result.mulInPlace(state.medal_prodmul);
  if(breakdown) breakdown.push(['achievements', true, state.medal_prodmul, result.clone()]);

  // upgrades
  if(this.basic_upgrade != null && this.type != CROPTYPE_SHORT) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {
      var mul_upgrade = u2.bonus.powr(u.count);
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push([' upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  // ethereal crops bonus to basic crops
  var ethereal_prodmul = Res.resOne();
  if(this.type == CROPTYPE_BERRY) {
    ethereal_prodmul.seeds = state.ethereal_berry_bonus.addr(1);
  }
  if(this.type == CROPTYPE_MUSH) {
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

  if(state.res.resin.gter(1)) {
    var resin_bonus = Num(Num.log10(state.res.resin.addr(1))).mulr(0.01).addr(1);
    result.mulInPlace(resin_bonus);
    if(breakdown) breakdown.push(['unused resin', true, resin_bonus, result.clone()]);
  }


  var season = getSeason();

  // flower boost
  if(f && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH)) {
    var mul_boost = Num(1);
    var num = 0;

    var getboost = function(self, n) {
      if(n.hasCrop() && n.growth >= 1 && n.getCrop().type != CROPTYPE_NETTLE) {
        var boost = n.getCrop().getBoost(n);
        if(boost.neqr(0)) {
          //if(season == 2 || season == 3) {
          //  mul_boost = Num.max(mul_boost, boost.addr(1));
          //} else {
            mul_boost.addInPlace(boost);
          //}
          return true;
        }
      }
      return false;
    };

    if(f.x > 0 && getboost(this, state.field[f.y][f.x - 1])) num++;
    if(f.y > 0 && getboost(this, state.field[f.y - 1][f.x])) num++;
    if(f.x + 1 < state.numw && getboost(this, state.field[f.y][f.x + 1])) num++;
    if(f.y + 1 < state.numh && getboost(this, state.field[f.y + 1][f.x])) num++;
    result.mulInPlace(mul_boost);
    if(breakdown && num > 0) breakdown.push(['flowers (' + num + ')', true, mul_boost, result.clone()]);
  }

  // nettle boost
  if(f && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH)) {
    var seed_malus = Num(1);
    var spore_boost = Num(1);
    var num = 0;

    var getboost = function(self, n) {
      if(n.hasCrop() && n.growth >= 1 && n.getCrop().type == CROPTYPE_NETTLE) {
        var boost = n.getCrop().getBoost(n);
        if(boost.neqr(0)) {
          if(self.type == CROPTYPE_MUSH) {
            spore_boost.addInPlace(boost);
          } else {
            seed_malus.divInPlace(boost.addr(1));
          }
          return true;
        }
      }
      return false;
    };

    if(f.x > 0 && getboost(this, state.field[f.y][f.x - 1])) num++;
    if(f.y > 0 && getboost(this, state.field[f.y - 1][f.x])) num++;
    if(f.x + 1 < state.numw && getboost(this, state.field[f.y][f.x + 1])) num++;
    if(f.y + 1 < state.numh && getboost(this, state.field[f.y + 1][f.x])) num++;
    result.seeds.mulInPlace(seed_malus);
    result.spores.mulInPlace(spore_boost);
    if(breakdown && num > 0) breakdown.push(['nettles (' + num + ')', true, (this.type == CROPTYPE_MUSH) ? spore_boost : seed_malus, result.clone()]);
  }

  // teelevel boost
  // CROPTYPE_SHORT is excluded simply to remove noise in the breakdown display: it's only a bonus on its 1 seed production. At the point where the tree is leveled, its real income comes from the neighbor leeching.
  if(state.treelevel > 0 && this.type != CROPTYPE_SHORT) {
    var tree_boost = Num(1).addr(treeboost * state.treelevel);
    result.mulInPlace(tree_boost);
    if(breakdown && tree_boost.neqr(1)) breakdown.push(['tree level (' + state.treelevel + ')', true, tree_boost, result.clone()]);
  }

  // posmul is used when the bonus only affects its production but not its consumption.
  // most do not use posmul, since the game would become trivial if production has multipliers of billions while consumption remains something similar to the early game values.
  // especially a global bonus like medal, that affects everything at once and hence can't cause increased consumption to be worse, should use full mul, not posmul

  var fog_active = state.upgrades[upgrade_fogunlock].count && this.type == CROPTYPE_MUSH && (state.time - state.fogtime) < getFogDuration();
  var sun_active = state.upgrades[upgrade_sununlock].count && this.type == CROPTYPE_BERRY && (state.time - state.suntime) < getSunDuration();

  //season. Unlike other multipliers, this one does not affect negative production. This is a good thing in the crop's good season, but extra harsh in a bad season (e.g. winter)
  if(!((fog_active || sun_active) && season == 3)) {
    var bonus_season = this.getSeasonBonus(season);
    if(bonus_season.neqr(1)) {
      result.posmulInPlace(bonus_season);
      if(breakdown) breakdown.push([seasonNames[season], true, bonus_season, result.clone()]);
    }
  }

  // fog
  if(fog_active && this.type == CROPTYPE_MUSH) {
    var bonus_fog0 = Num(0.75);
    if(state.upgrades[fog_choice0_b].count) bonus_fog0.divrInPlace(1 + active_choice0_b_bonus);
    result.seeds.mulInPlace(bonus_fog0);
    if(breakdown) breakdown.push(['fog (less seeds)', true, bonus_fog0, result.clone()]);
    var bonus_fog1 = Num(0.25);
    if(state.upgrades[fog_choice0_b].count) bonus_fog1.mulrInPlace(1 + active_choice0_b_bonus);
    bonus_fog1.addrInPlace(1);
    result.spores.mulInPlace(bonus_fog1);
    if(breakdown) breakdown.push(['fog (more spores)', true, bonus_fog1, result.clone()]);
  }

  // sun
  if(sun_active && this.type == CROPTYPE_BERRY) {
    var bonus_sun = Num(0.5);
    if(state.upgrades[sun_choice0_b].count) bonus_sun.mulrInPlace(1 + active_choice0_b_bonus);
    bonus_sun.addrInPlace(1);
    result.seeds.mulrInPlace(bonus_sun);
    if(breakdown) breakdown.push(['sun', true, bonus_sun, result.clone()]);
  }

  // leech, only computed here in case of "pretend", without pretent leech is computed in more correct way in precomputeField()
  if(pretend && this.type == CROPTYPE_SHORT) {
    var leech = this.getLeech(f);
    var p = prefield[f.y][f.x];
    var total = Res();
    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
      var f2 = state.field[y2][x2];
      var c2 = f2.getCrop();
      if(c2) {
        var p2 = prefield[y2][x2];
        if(c2.type == CROPTYPE_BERRY || c2.type == CROPTYPE_MUSH) {
          total.addInPlace(p2.prod0);
        }
      }
    }
    result.addInPlace(total);
    if(breakdown && !total.empty()) breakdown.push(['<b><i><font color="#040">leeching neighbors</font></i></b>', false, total, result.clone()]);
  }

  return result;
};


// The result is the added value, e.g. a result of 0.5 means a multiplier of 1.5, or a bonus of +50%
Crop.prototype.getBoost = function(f, breakdown) {
  var result = this.boost.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);


  var rainbow_active = state.upgrades[upgrade_rainbowunlock].count && (state.time - state.rainbowtime) < getRainbowDuration();

  // TODO: have some achievements that give a boostmul instead of a prodmul

  // upgrades
  if(this.basic_upgrade != null) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {
      var mul_upgrade = u2.bonus.mulr(u.count).addr(1); // the flower upgrades are additive, unlike the crop upgrades which are multiplicative. This because the flower bonus itself is already multiplicative to the plants.
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push([' upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
      // example: if without upgrades boost was +50%, and now 16 upgrades of 10% each together add 160%, then result will be 130%: 0.5*(1+16*0.1)=1.3
    }
  }

  var season = getSeason();
  if(this.type == CROPTYPE_FLOWER) {
    if(!(rainbow_active && season == 3)) {
      var bonus_season = this.getSeasonBonus(season);
      if(bonus_season.neqr(1)) {
        result.mulInPlace(bonus_season);
        if(breakdown) breakdown.push([seasonNames[season], true, bonus_season, result.clone()]);
      }
    }
  }

  // ethereal crops bonus to basic crops
  if(this.type == CROPTYPE_FLOWER) {
    var ethereal_boost = Num(1 + state.fullgrowncrop2count[flower2_0] * 0.2);
    if(ethereal_boost.neqr(1)) {
      result.mulInPlace(ethereal_boost);
      if(breakdown) breakdown.push(['ethereal crops', true, ethereal_boost, result.clone()]);
    }
  }


  // rainbow
  if(this.type == CROPTYPE_FLOWER) {
    if(rainbow_active) {
      var bonus_rainbow = Num(0.5);
      if(state.upgrades[rainbow_choice0_b].count) bonus_rainbow.mulrInPlace(1 + active_choice0_b_bonus);
      bonus_rainbow.addrInPlace(1);
      result.mulrInPlace(bonus_rainbow);
      if(breakdown) breakdown.push(['rainbow', true, bonus_rainbow, result.clone()]);
    }
  }

  // nettle negatively affecting flowers
  if(f && (this.type == CROPTYPE_FLOWER)) {
    var malus = Num(1);
    var num = 0;

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
      var f2 = state.field[y2][x2];
      var c2 = f2.getCrop();
      if(c2 && f2.growth >= 1 && c2.type == CROPTYPE_NETTLE) {
        var boost = c2.getBoost(f2);
        malus.divInPlace(boost.addr(1));
        num++;
      }
    }
    if(num > 0) {
      result.mulInPlace(malus);
      if(breakdown) breakdown.push(['nettles malus (' + num + ')', true, malus, result.clone()]);
    }
  }

  return result;
};

// This returns the leech ratio of this plant, not the actual resource amount leeched
// Only correct for already planted leeching plants (for the penalty of multiple planted ones computation)
Crop.prototype.getLeech = function(f, breakdown) {
  if(this.type != CROPTYPE_SHORT) {
    var result = Num(0);
    if(breakdown) breakdown.push(['none', true, Num(0), result.clone()]);
    return Res();
  }

  var result = Num(1);
  if(breakdown) breakdown.push(['base', true, Num(1), result.clone()]);

  // add a penalty for the neighbor production copy-ing if there are multiple watercress in the field. The reason for this is:
  // the watercress neighbor production copying is really powerful, and if every single watercress does this at full power, this would require way too active play, replanting watercresses in the whole field all the time.
  // encouraging to plant one or maybe two (but diminishing returns that make more almost useless) strikes a good balance between doing something useful during active play, but still getting reasonable income from passive play
  var numsame = state.cropcount[this.index];
  if(numsame > 1) {
    var penalty = 1 / (1 + (numsame - 1) * 0.75);
    result.mulrInPlace(penalty);

    if(breakdown) breakdown.push(['reduction for multiple', true, Num(penalty), result.clone()]);
  }

  return result;
};

var registered_crops = []; // indexed consecutively, gives the index to crops
var crops = []; // indexed by crop index
var cropsByName = {};

// 16-bit ID, auto incremented with registerCrop, but you can also set it to a value yourself, to ensure consistent IDs for various crops (between savegames) in case of future upgrades
var crop_register_id = -1;

function registerCrop(name, cost, prod, boost, planttime, image, opt_tagline) {
  if(!image) image = missingplant;
  if(crops[crop_register_id] || crop_register_id < 0 || crop_register_id > 65535) throw 'crop id already exists or is invalid!';
  var crop = new Crop();
  crop.index = crop_register_id++;
  crops[crop.index] = crop;
  cropsByName[name] = crop;
  registered_crops.push(crop.index);

  crop.name = name;
  crop.cost = cost;
  crop.prod = prod;
  crop.planttime = planttime || 0;
  crop.image = image;
  crop.tagline = opt_tagline || '';
  crop.boost = boost;

  return crop.index;
}

function registerBerry(name, tier, planttime, image, opt_tagline) {
  var cost = getBerryCost(tier);
  var prod = getBerryProd(tier);
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline);
  var crop = crops[index];
  crop.bonus_season[1] = Num(bonus_season_berry_summer);
  crop.type = CROPTYPE_BERRY;
  return index;
}

function registerMushroom(name, tier, planttime, image, opt_tagline) {
  var cost = getMushroomCost(tier);
  var prod = getMushroomProd(tier);
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline);
  var crop = crops[index];
  crop.bonus_season[2] = Num(bonus_season_mushroom_autumn);
  crop.type = CROPTYPE_MUSH;
  return index;
}

function registerFlower(name, tier, boost, planttime, image, opt_tagline) {
  var cost = getFlowerCost(tier);
  var index = registerCrop(name, cost, Res({}), boost, planttime, image, opt_tagline);
  var crop = crops[index];
  crop.bonus_season[0] = Num(bonus_season_flower_spring);
  crop.type = CROPTYPE_FLOWER;
  return index;
}

function registerNettle(name, tier, boost, planttime, image, opt_tagline) {
  var cost = getNettleCost(tier);
  var index = registerCrop(name, cost, Res({}), boost, planttime, image, opt_tagline);
  var crop = crops[index];
  crop.type = CROPTYPE_NETTLE;
  return index;
}

function registerShortLived(name, tier, prod, planttime, image, opt_tagline) {
  var cost = Res({seeds:10});
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline);
  var crop = crops[index];
  crop.type = CROPTYPE_SHORT;
  return index;
}

// should return 1 for i=0
function getBerryBase(i) {
  return Num.rpow(2000, Num(i));
}

function getBerryCost(i) {
  var seeds = getBerryBase(i);
  seeds.mulrInPlace(20);
  if(i == 0) seeds.mulrInPlace(50);
  if(i > 1) seeds.mulInPlace(Num.rpow(1.5, Num((i - 1) * (i - 1))));
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

  var spores = seeds.div(seeds0).mulr(0.15);
  spores.mulrInPlace(Math.pow(0.25, i)); // make higher mushrooms less efficient in seeds->spores conversion ratio: they are better because they can manage much more seeds, but must also have a disadvantage


  if(i >= 2) seeds = seeds.mulr(100); // at this point berries have such high flower boosts that a higher seeds consumption is needed to have it such that when you unlock this mushroom, you begin with overconsumption
  if(i >= 3) seeds = seeds.mulr(100); // this one is not yet tested, so this is a guess for now

  return Res({seeds:seeds, spores:spores});
}

function getFlowerCost(i) {
  // Flowers start after berry 2, and then appear after every 2 berries.
  return getBerryCost(2.5 + i * 2);
}

function getNettleCost(i) {
  return getMushroomCost(1.1 + i * 2);
}

var berryplanttime0 = 60;
var mushplanttime0 = 120;
var flowerplanttime0 = 180;

// berries: give seeds
crop_register_id = 25;
var berry_0 = registerBerry('blackberry', 0, berryplanttime0 * 1, blackberry);
var berry_1 = registerBerry('blueberry', 1, berryplanttime0 * 2, blueberry);
var berry_2 = registerBerry('cranberry', 2, berryplanttime0 * 4, cranberry);
var berry_3 = registerBerry('currant', 3, berryplanttime0 * 8, currant);
var berry_4 = registerBerry('goji', 4, berryplanttime0 * 16, goji);
var berry_5 = registerBerry('gooseberry', 5, berryplanttime0 * 32, gooseberry);
var berry_6 = registerBerry('grape', 6, berryplanttime0 * 64, grape);
var berry_7 = registerBerry('honeyberry', 7, berryplanttime0 * 128, honeyberry);
var berry_8 = registerBerry('juniper', 8, berryplanttime0 * 256, juniper);

// mushrooms: give spores
crop_register_id = 50;
var mush_0 = registerMushroom('champignon', 0, mushplanttime0 * 1, champignon);
var mush_1 = registerMushroom('morel', 1, mushplanttime0 * 3, morel);
var mush_2 = registerMushroom('amanita', 2, mushplanttime0 * 9, amanita);
var mush_3 = registerMushroom('portobello', 3, mushplanttime0 * 27, portobello);

// flowers: give boost to neighbors
crop_register_id = 75;
var flower_0 = registerFlower('clover', 0, Num(0.5), flowerplanttime0, clover);
var flower_1 = registerFlower('cornflower', 1, Num(8.0), flowerplanttime0 * 4, cornflower);
var flower_2 = registerFlower('daisy', 2, Num(128.0), flowerplanttime0 * 16, daisy);
var flower_3 = registerFlower('dandelion', 3, Num(1024.0), flowerplanttime0 * 64, dandelion);

crop_register_id = 100;
var nettle_0 = registerNettle('nettle', 0, Num(4), berryplanttime0, nettle);
// a next one could be "thistle"

crop_register_id = 105;
var short_0 = registerShortLived('watercress', 0, Res({seeds:1}), 60, watercress);

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var registered_upgrades = []; // indexed consecutively, gives the index to upgrades
var upgrades = []; // indexed by upgrade index
var upgradesByName = {};


// same comment as crop_register_id
var upgrade_register_id = -1;

// @constructor
function Upgrade() {
  this.name = 'a';
  this.description = undefined; // longer description than the name, with details, shown if not undefined

  // function that applies the upgrade. takes argument n, integer, if > 1,
  // must have same effect as calling n times with 1.
  this.fun = undefined;

  // function that returns true if prerequisites to unlock this research are met
  this.pre = undefined;

  this.index = 0; // index in the upgrades array

  this.maxcount = 1; // how many times can this upgrade be done in total (typical 1, some upgrades have many series, 0 for infinity)

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
    if(state.upgrades[this.index].count > 0 && this.maxcount != 1) name += ' ' + util.toRoman((state.upgrades[this.index].count));
    return name;
  };

  // name of next instance of this upgrade, if multi-staged
  this.getNextName = function() {
    var name = this.name;
    if(this.maxcount != 1) name += ' ' + util.toRoman((state.upgrades[this.index].count + 1));
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
function registerUpgrade(name, cost, fun, pre, maxcount, description, bgcolor, bordercolor, image0, image1) {
  if(upgrades[upgrade_register_id] || upgrade_register_id < 0 || upgrade_register_id > 65535) throw 'upgrades id already exists or is invalid!';
  var upgrade = new Upgrade();
  upgrade.index = upgrade_register_id++;
  upgrades[upgrade.index] = upgrade;
  upgradesByName[name] = upgrade;
  registered_upgrades.push(upgrade.index);


  upgrade.name = name;
  upgrade.cost = cost;
  upgrade.maxcount = maxcount;

  if(bgcolor) upgrade.bgcolor = bgcolor;
  if(bordercolor) upgrade.bordercolor = bordercolor;
  if(image0) upgrade.image0 = image0;
  if(image1) upgrade.image1 = image1;

  upgrade.fun = function() {
    state.upgrades[this.index].count++;
    fun();
  };

  if(!pre) pre = function(){return true;};
  upgrade.pre = pre;

  upgrade.description = description;

  return upgrade.index;
}

// prev_crop_num, prev_crop: how many previous crops of that type must be planted before this next upgrade will become unlocked
function registerCropUnlock(cropid, cost, prev_crop_num, prev_crop) {
  var crop = crops[cropid];
  var name = 'Unlock ' + crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  var fun = function() {
    if(cropid == flower_0) showMessage('You unlocked the first type of flower! Flowers don\'t produce resources directly, but boost neighboring plants.', helpFG, helpBG);
    if(cropid == mushunlock_0) showMessage('You unlocked the first type of mushroom! Mushrooms produce spores rather than seeds, and spores will be used by the tree.', helpFG, helpBG);
    state.crops[crop.index].unlocked = true;
  };

  var pre = function() {
    if(prev_crop == undefined) return true;
    return state.fullgrowncropcount[prev_crop] >= prev_crop_num;
  };

  var description = 'Unlocks new crop: ' + crop.name + '.';
  //if(!crop.prod.empty()) description += ' Base planting cost: ' + crop.cost.toString() + '.'; // not necessary to show since it's same as the unlock-research cost.
  if(!crop.prod.empty()) description += ' Base production: ' + crop.prod.toString() + '/s.';
  if(!crop.boost.eqr(0)) {
    if(crop.type == CROPTYPE_NETTLE) {
      description += ' Boosts neighbor mushroom spores production ' + (crop.boost.mulr(100).toString(3, Num.N_FULL)) + '% without increasing seed consumption. However, negatively affects neighboring berries, so avoid touching berries with this plant.';
    } else {
      description += ' Boosts neighbors: ' + (crop.boost.mulr(100).toString(3, Num.N_FULL)) + '%. Does not boost watercress directly, but watercress gets same boosts as its neighbor resource-producing crops.';
    }
  }
  description += ' Crop type: ' + getCropTypeName(crop.type);

  var result = registerUpgrade(name, cost, fun, pre, 1, description, '#dfc', '#0a0', crop.image[4], undefined);
  var u = upgrades[result];
  u.cropid = cropid;

  u.getCost = function(opt_adjust_count) {
    return cost;
  };

  return result;
}

// an upgrade that increases the multiplier of a crop
function registerCropMultiplier(cropid, cost, multiplier, prev_crop_num, crop_unlock_id) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    if(crop_unlock_id == undefined) {
      return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1);
    } else {
      // for most crops, already unlock this upgrade as soon as it's reaserached, rather than planted, because otherwise it's too easy to forget you already have this crop and should plant it while you're looking at the upgrade panel
      return state.upgrades[crop_unlock_id].count;
    }
  };

  var aspect = 'production';
  if(crop.type == CROPTYPE_MUSH) aspect = 'production but also consumption';

  var description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor(((multiplier - 1) * 100)) + '% (multiplicative)';

  if(crop.type == CROPTYPE_MUSH) description += '<br><br>WARNING! if your mushrooms don\'t have enough seeds from neighbors, this upgrade will not help you for now since it also increases the consumption! Get your seeds production up first!';


  var result = registerUpgrade('Improve ' + name, cost, fun, pre, 0, description, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(multiplier);
  u.cropid = cropid;

  u.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(Num(basic_upgrade_cost_increase), state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };

  return result;
}


function registerBoostMultiplier(cropid, cost, adder, prev_crop_num, crop_unlock_id) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    if(crop_unlock_id == undefined) {
      return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1);
    } else {
      // for most crops, already unlock this upgrade as soon as it's reaserached, rather than planted, because otherwise it's too easy to forget you already have this crop and should plant it while you're looking at the upgrade panel
      return state.upgrades[crop_unlock_id].count;
    }
  };

  var aspect = 'boost';

  var description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor((adder * 100)) + '% (additive)';

  var result = registerUpgrade('Improve ' + name, cost, fun, pre, 0, description, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(adder);
  u.cropid = cropid;

  u.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(Num(flower_upgrade_cost_increase), state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };

  return result;
}

// an upgrade that increases the multiplier of a crop
function registerShortCropTimeIncrease(cropid, cost, time_increase, prev_crop_num, crop_unlock_id) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    if(crop_unlock_id == undefined) {
      return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1);
    } else {
      // for most crops, already unlock this upgrade as soon as it's reaserached, rather than planted, because otherwise it's too easy to forget you already have this crop and should plant it while you're looking at the upgrade panel
      return state.upgrades[crop_unlock_id].count;
    }
  };

  var description = 'Adds ' + (time_increase * 100) + '%  time duration to the lifespan of ' + crop.name + ' (additive)';

  var result = registerUpgrade('Sturdier ' + name, cost, fun, pre, 0, description, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(time_increase);
  u.cropid = cropid;

  u.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(Num(basic_upgrade_cost_increase), state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };

  return result;
}


// register an upgrade that was removed from the game so it's marked as invalid to not display it and remove from new saves
function registerDeprecatedUpgrade() {
  var result = registerUpgrade('<none>', Res(), function(){}, function(){return false;}, 1, '<none>');
  var u = upgrades[result];
  u.deprecated = true;
  return result;
}


upgrade_register_id = 25;
var berryunlock_0 = registerCropUnlock(berry_0, getBerryCost(0), 1, short_0);
var berryunlock_1 = registerCropUnlock(berry_1, getBerryCost(1), 1, berry_0);
var berryunlock_2 = registerCropUnlock(berry_2, getBerryCost(2), 1, berry_1);
var berryunlock_3 = registerCropUnlock(berry_3, getBerryCost(3), 1, berry_2);
var berryunlock_4 = registerCropUnlock(berry_4, getBerryCost(4), 1, berry_3);
var berryunlock_5 = registerCropUnlock(berry_5, getBerryCost(5), 1, berry_4);
var berryunlock_6 = registerCropUnlock(berry_6, getBerryCost(6), 1, berry_5);
var berryunlock_7 = registerCropUnlock(berry_7, getBerryCost(7), 1, berry_6);
var berryunlock_8 = registerCropUnlock(berry_8, getBerryCost(8), 1, berry_7);

upgrade_register_id = 50;
var mushunlock_0 = registerCropUnlock(mush_0, getMushroomCost(0), 1, berry_1);
var mushunlock_1 = registerCropUnlock(mush_1, getMushroomCost(1), 1, berry_3);
var mushunlock_2 = registerCropUnlock(mush_2, getMushroomCost(2), 1, berry_5);
var mushunlock_3 = registerCropUnlock(mush_3, getMushroomCost(3), 1, berry_7);

upgrade_register_id = 75;
var flowerunlock_0 = registerCropUnlock(flower_0, getFlowerCost(0), 1, berry_2);
var flowerunlock_1 = registerCropUnlock(flower_1, getFlowerCost(1), 1, berry_4);
var flowerunlock_2 = registerCropUnlock(flower_2, getFlowerCost(2), 1, berry_6);
var flowerunlock_3 = registerCropUnlock(flower_3, getFlowerCost(3), 1, berry_8);

upgrade_register_id = 100;
var nettleunlock_0 = registerCropUnlock(nettle_0, getNettleCost(0), 1, mush_1);

//shortunlock_0 does not exist, you start with that berry type already unlocked

////////////////////////////////////////////////////////////////////////////////

// power increase for crop production (not flower boost) by basic upgrades
var basic_upgrade_power_increase = 1.25; // multiplicative
// cost increase for crop production (not flower boost) by basic upgrades
var basic_upgrade_cost_increase = 1.65;

// how much more expensive than the base cost of the crop is the upgrade cost
var basic_upgrade_initial_cost = 10;

var flower_upgrade_power_increase = 0.5; // additive
var flower_upgrade_cost_increase = 2.5;
var flower_upgrade_initial_cost = 15;

upgrade_register_id = 125;
var berrymul_0 = registerCropMultiplier(berry_0, getBerryCost(0).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, berryunlock_0);
var berrymul_1 = registerCropMultiplier(berry_1, getBerryCost(1).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, berryunlock_1);
var berrymul_2 = registerCropMultiplier(berry_2, getBerryCost(2).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, berryunlock_2);
var berrymul_3 = registerCropMultiplier(berry_3, getBerryCost(3).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, berryunlock_3);
var berrymul_4 = registerCropMultiplier(berry_4, getBerryCost(4).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, berryunlock_4);
var berrymul_5 = registerCropMultiplier(berry_5, getBerryCost(5).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, berryunlock_5);
var berrymul_6 = registerCropMultiplier(berry_6, getBerryCost(6).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, berryunlock_6);
var berrymul_7 = registerCropMultiplier(berry_7, getBerryCost(7).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, berryunlock_7);
var berrymul_8 = registerCropMultiplier(berry_8, getBerryCost(8).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, berryunlock_8);

upgrade_register_id = 150;
var mushmul_0 = registerCropMultiplier(mush_0, getMushroomCost(0).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, mushunlock_0);
var mushmul_1 = registerCropMultiplier(mush_1, getMushroomCost(1).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, mushunlock_1);
var mushmul_2 = registerCropMultiplier(mush_2, getMushroomCost(2).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, mushunlock_2);
var mushmul_3 = registerCropMultiplier(mush_3, getMushroomCost(3).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1, mushunlock_3);

upgrade_register_id = 175;
var flowermul_0 = registerBoostMultiplier(flower_0, getFlowerCost(0).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_0);
var flowermul_1 = registerBoostMultiplier(flower_1, getFlowerCost(1).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_1);
var flowermul_2 = registerBoostMultiplier(flower_2, getFlowerCost(2).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_2);
var flowermul_3 = registerBoostMultiplier(flower_3, getFlowerCost(3).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_3);

upgrade_register_id = 200;
var nettlemul_0 = registerBoostMultiplier(nettle_0, getNettleCost(0).mulr(10), flower_upgrade_power_increase, 1, nettleunlock_0);

upgrade_register_id = 205;
var shortmul_0 = registerShortCropTimeIncrease(short_0, Res({seeds:100}), 0.15, 1);

upgrade_register_id = 250;
var upgrade_fogunlock = registerUpgrade('fog ability', treeLevelReq(3).mulr(0.05 * 0), function() {
  // nothing to do here, the fact that this upgrade's count is changed to 1 already enables it
}, function() {
  if(state.treelevel >= 3) {
    // auto apply this upgrade already for convenience. Cost ignored. It was too annoying to have to indirectly have this extra step of applying the upgrade.
    state.upgrades[upgrade_fogunlock].unlocked = true;
    state.upgrades[upgrade_fogunlock].count = 1;
    return true;
  }
  return false;
}, 1, 'Unlocks the active ability "fog". While enabled, fog temporarily decreases mushroom seed consumption while increasing spore production of mushrooms. In addition, mushrooms are then not affected by winter', '#fff', '#88f', image_fog, undefined);

var upgrade_sununlock = registerUpgrade('sun ability', treeLevelReq(5).mulr(0.05 * 0), function() {
  // nothing to do here, the fact that this upgrade's count is changed to 1 already enables it
}, function() {
  if(state.treelevel >= 5) {
    // auto apply this upgrade already for convenience. Cost ignored. It was too annoying to have to indirectly have this extra step of applying the upgrade.
    state.upgrades[upgrade_sununlock].unlocked = true;
    state.upgrades[upgrade_sununlock].count = 1;
    return true;
  }
  return false;
}, 1, 'Unlocks the active ability "sun". While enabled, the sun temporarily increases berry seed production. In addition, berries are then not affected by winter', '#ccf', '#88f', image_sun, undefined);

var upgrade_rainbowunlock = registerUpgrade('rainbow ability', treeLevelReq(7).mulr(0.05 * 0), function() {
  // nothing to do here, the fact that this upgrade's count is changed to 1 already enables it
}, function() {
  if(state.treelevel >= 7) {
    // auto apply this upgrade already for convenience. Cost ignored. It was too annoying to have to indirectly have this extra step of applying the upgrade.
    state.upgrades[upgrade_rainbowunlock].unlocked = true;
    state.upgrades[upgrade_rainbowunlock].count = 1;
    return true;
  }
  return false;
}, 1, 'Unlocks the active ability "rainbow". While enabled, flowers get a boost, and in addition are not affected by winter.', '#ccf', '#00f', image_rainbow, undefined);



var choice_text = 'CHOICE upgrade. Disables the other matching choice, choose wisely. '

upgrade_register_id = 275;

var fern_choice0_a_minutes = 7;

var fern_choice0_a = registerUpgrade('slower ferns [CHOICE]', treeLevelReq(2).mulr(0.05), function() {
  state.upgrades[fern_choice0_b].unlocked = false;
}, function() {
  return !state.upgrades[fern_choice0_b].count && state.treelevel >= 2;
}, 1, choice_text + 'Ferns take ' + (fern_wait_minutes + fern_choice0_a_minutes) + ' instead of ' + fern_wait_minutes + ' minutes to appear, but contain enough resources to make up the difference exactly. This allows to collect more fern resources during idle play, but has no effect on the overall fern income during active play. This starts taking effect only for the next fern that appears.', '#fff', '#88f', images_fern[3], undefined);

var fern_choice0_b_bonus = 0.25;

var fern_choice0_b = registerUpgrade('richer ferns [CHOICE]', treeLevelReq(2).mulr(0.05), function() {
  state.upgrades[fern_choice0_a].unlocked = false;
}, function() {
  return !state.upgrades[fern_choice0_a].count && state.treelevel >= 2;
}, 1, choice_text + 'Ferns contain on average ' + (fern_choice0_b_bonus * 100) + '% more resources, but they\'ll appear as often as before so this benefits active play more than idle play. This starts taking effect only for the next fern that appears.', '#fff', '#88f', images_fern[1], undefined);

// pre version 0.1.6
var fog_choice0_a = registerDeprecatedUpgrade();
var fog_choice0_b = registerDeprecatedUpgrade();
var sun_choice0_a = registerDeprecatedUpgrade();
var sun_choice0_b = registerDeprecatedUpgrade();
var rainbow_choice0_a = registerDeprecatedUpgrade();
var rainbow_choice0_b = registerDeprecatedUpgrade();



var active_choice0_a = registerUpgrade('slow weather [CHOICE]', treeLevelReq(8).mulr(0.05), function() {
  state.upgrades[active_choice0_b].unlocked = false;
}, function() {
  return state.treelevel >= 8 && !state.upgrades[active_choice0_b].count;
}, 1, choice_text + 'Makes the active weather abilities run twice as long, but also twice as long to recharge. This benefits idle play, but gives on average no benefit for active play.', '#fff', '#88f', image_fog, undefined);

var active_choice0_b_bonus = 0.25;

var active_choice0_b = registerUpgrade('strong weather [CHOICE]', treeLevelReq(8).mulr(0.05), function() {
  state.upgrades[active_choice0_a].unlocked = false;
}, function() {
  return state.treelevel >= 8 && !state.upgrades[active_choice0_a].count;
}, 1, choice_text + 'Increases all active ability weather effects by ' + (active_choice0_b_bonus * 100) + '%. The active abilities recharge time remains the same so this benefits active play more than idle play.', '#fff', '#88f', image_fog, undefined);



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
};

var tierNames = ['zinc', 'bronze', 'silver', 'electrum', 'gold', 'platinum', 'rhodium', 'sapphire', 'emerald', 'ruby', 'diamond'];
var tierColors = ['#444', '#840', '#888', '#8f8', '#0f0', '#eee', '#fcc', '#88f', '#8f8', '#f00', '#fff'];

// Tier for achievement images if no specific one given, maps to zinc, copper, silver, electrum, gold, etc..., see images_medals.js
Medal.prototype.getTier = function() {
  if(this.prodmul.ler(0.015)) return 0;
  if(this.prodmul.ler(0.03)) return 1;
  if(this.prodmul.ler(0.075)) return 2;
  if(this.prodmul.ler(0.15)) return 3;
  if(this.prodmul.ler(0.3)) return 4;
  if(this.prodmul.ler(0.75)) return 5;
  if(this.prodmul.ler(1.5)) return 6;
  if(this.prodmul.ler(3)) return 7;
  if(this.prodmul.ler(7.5)) return 8;
  if(this.prodmul.ler(15)) return 9;
  return 10;
};

var registered_medals = []; // indexed consecutively, gives the index to medal
var medals = []; // indexed by medal index (not necessarily consectuive

var medal_register_id = -1;

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

  if(!icon) medal.icon = medalgeneric[medal.getTier()];

  return medal.index;
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
registerMedal('fern 1000', 'clicked 1000 ferns', images_fern[0], function() { return state.g_numferns >= 1000; }, Num(0.02));
registerMedal('fern 10000', 'clicked 10000 ferns', images_fern[0], function() { return state.g_numferns >= 10000; }, Num(0.04));

medal_register_id = 4;
var prevmedal;
for(var i = 0; i < 15; i++) {
  // have a good spread of this medal, more than exponential growth for its requirement
  var num = Num(1000).powr(Math.floor(Math.pow(i, 1.5))).mulr(1000);
  var s0 = num.toString(3, Num.N_LATIN);
  var s1 = num.toString(3, Num.N_SCI);
  var name = 'seeds ' + s0;
  if(i > 0) medals[prevmedal].description += '. Next achievement in this series, ' + name + ', unlocks at ' + s1 + ' seeds.';
  //console.log(num.toString(3) + ' ' + num.toString(3, Num.N_SCI));
  prevmedal = registerMedal(name, 'have over ' + s1 + ' seeds', image_seed,
      bind(function(num) { return state.g_max_res.seeds.gt(num); }, num),
      Num.get125(Math.floor(i / 2)).mulr(0.01));
}
medal_register_id += 20; // a few spares for this one. TODO: don't do this like this, start a new medal_register_id for next series instead
var planted_achievement_values =  [   5,   50,  100,  200,  500,  1000,  1500, 2000, 5000];
var planted_achievement_bonuses = [0.01, 0.01, 0.02, 0.02, 0.05,  0.05,   0.1,  0.1,  0.2];
for(var i = 0; i < planted_achievement_values.length; i++) {
  var a = planted_achievement_values[i];
  var b = planted_achievement_bonuses[i];
  var name = 'planted ' + a;
  if(i > 0) medals[prevmedal].description += '. Next achievement in this series, ' + name + ', unlocks at ' + a + ' planted.';
  prevmedal = registerMedal(name, 'Planted ' + a + ' or more fullgrown plants over the course of the game', blackberry[0],
      bind(function(a) { return state.g_numfullgrown >= a; }, a),
      Num(b));
}
medal_register_id += 20; // a few spares for this one
var level_achievement_values =  [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 150];
for(var i = 0; i < level_achievement_values.length; i++) {
  var level = Num(level_achievement_values[i]);
  var bonus = level.divr(500);
  var s = level.toString(5, Num.N_FULL);
  var name = 'tree level ' + s;
  if(i > 0) medals[prevmedal].description += '. Next achievement in this series unlocks at level ' + s + '.';
  prevmedal = registerMedal(name, 'Reached tree level ' + s, tree_images[5][1][0],
      bind(function(level) { return level.lter(state.treelevel); }, level),
      bonus);
}
medal_register_id += 20; // a few spares for this one

// TODO: from now on, clearly define the value of a new medal series right before it, rather than the "+= 20" system from above, to prevent no accidental changing of all achievement IDs
medal_register_id = 104;
var season_medal = registerMedal('four seasons', 'reached winter and seen all seasons', field_winter[0], function() { return getSeason() == 3; }, Num(0.05));

medal_register_id = 110;
registerMedal('watercress', 'plant the entire field full of watercress', watercress[4], function() {
  return state.croptypecount[CROPTYPE_SHORT] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('berries', 'plant the entire field full of berries', blackberry[4], function() {
  return state.croptypecount[CROPTYPE_BERRY] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('flowers', 'plant the entire field full of flowers. Pretty, at least that\'s something', clover[4], function() {
  return state.croptypecount[CROPTYPE_FLOWER] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('mushrooms', 'plant the entire field full of mushrooms. Why would you do this?', champignon[4], function() {
  return state.croptypecount[CROPTYPE_MUSH] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('nettles', 'plant the entire field full of nettles. This is a stingy situation.', nettle[4], function() {
  return state.croptypecount[CROPTYPE_NETTLE] == state.numw * state.numh - 2;
}, Num(0.01));

medal_register_id = 125;
var numreset_achievement_values =   [   1,    5,   10,   20,   50,  100,  200,  500, 1000];
var numreset_achievement_bonuses =  [0.05, 0.05, 0.05, 0.05, 0.05,  0.1,  0.1,  0.2,  0.5]; // TODO: give a bit more bonus for some of those
for(var i = 0; i < level_achievement_values.length; i++) {
  var level = numreset_achievement_values[i];
  var bonus = Num(numreset_achievement_bonuses[i]);
  var name = 'transenced ' + level;
  if(i > 0) medals[prevmedal].description += '. Next achievement in this series unlocks at level ' + level + '.';
  prevmedal = registerMedal(name, 'Transcended ' + level + ' times', image_medaltranscend,
      bind(function(level) { return state.g_numresets >= level; }, level),
      bonus);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// @constructor
function Crop2() {
  this.name = 'a';
  this.cost = Res();
  this.prod = Res();
  this.index = 0;
  this.planttime = 0;
  this.boost = Num(0);
  this.tagline = '';
  this.image = undefined;
};


Crop2.prototype.getCost = function(opt_adjust_count) {
  var mul = sameTypeCostMultiplier2;
  if(this.type == CROPTYPE_FLOWER) mul = sameTypeCostMultiplier_Flower2;
  if(this.type == CROPTYPE_SPECIAL) mul = sameTypeCostMultiplier_Special2;
  var countfactor = Math.pow(mul, state.crop2count[this.index] + (opt_adjust_count || 0));
  return this.cost.mulr(countfactor);
};


Crop2.prototype.getPlantTime = function() {
  return this.planttime;
};

// Ethereal production
Crop2.prototype.getProd = function(f, assume_fullgrown, breakdown) {
  if(!assume_fullgrown && f && f.growth < 1) {
    return Res();
  }

  var result = Res(this.prod);

  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  return result;
}

// get the boost of boosting neighbors given to this crop, not as resource boost but as the boost percentage, to apply to relevant ethereal properties
Crop2.getNeighborBoost = function(f) {

  // flower boost
  if(f) {
    var result = Num(0);
    var num = 0;

    var getboost = function(n) {
      if(n.hasCrop() && n.growth >= 1 && crops2[n.cropIndex()].type != CROPTYPE_NETTLE) {
        var boost = crops2[n.cropIndex()].getBoost(n);
        if(boost.neqr(0)) {
          result.addInPlace(boost);
          return true;
        }
      }
      return false;
    };

    if(f.x > 0 && getboost(state.field2[f.y][f.x - 1])) num++;
    if(f.y > 0 && getboost(state.field2[f.y - 1][f.x])) num++;
    if(f.x + 1 < state.numw2 && getboost(state.field2[f.y][f.x + 1])) num++;
    if(f.y + 1 < state.numh2 && getboost(state.field2[f.y + 1][f.x])) num++;

    return result;
  }

  return Num(0);
};

Crop2.prototype.getBoost = function(f, breakdown) {
  var result = this.boost.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  return result;
};

var registered_crops2 = []; // indexed consecutively, gives the index to crops2
var crops2 = []; // indexed by crop index
var crops2ByName = {};

// 16-bit ID, auto incremented with registerCrop2, but you can also set it to a value yourself, to ensure consistent IDs for various crops2 (between savegames) in case of future upgrades
var crop2_register_id = -1;

function registerCrop2(name, cost, prod, boost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  if(!image) image = missingplant;
  if(crops2[crop2_register_id] || crop2_register_id < 0 || crop2_register_id > 65535) throw 'crop2 id already exists or is invalid!';
  var crop = new Crop2();
  crop.index = crop2_register_id++;
  crops2[crop.index] = crop;
  crops2ByName[name] = crop;
  registered_crops2.push(crop.index);

  crop.name = name;
  crop.cost = cost;
  crop.prod = prod;
  crop.effect_description_short = effect_description_short;
  crop.effect_description_long = effect_description_long;
  crop.planttime = planttime;
  crop.image = image;
  crop.tagline = opt_tagline || '';
  crop.boost = boost;

  return crop.index;
}

function registerBerry2(name, cost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline);
  var crop = crops2[index];
  crop.type = CROPTYPE_BERRY;
  return index;
}

function registerMushroom2(name, cost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline);
  var crop = crops2[index];
  crop.type = CROPTYPE_MUSH;
  return index;
}

function registerFlower2(name, cost, boost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, cost, Res({}), Num(boost), planttime, effect_description_short, effect_description_long, image, opt_tagline);
  var crop = crops2[index];
  crop.type = CROPTYPE_FLOWER;
  return index;
}

function registerShortLived2(name, cost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline);
  var crop = crops2[index];
  crop.type = CROPTYPE_SHORT;
  return index;
}

function registerSpecial2(name, cost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline);
  var crop = crops2[index];
  crop.type = CROPTYPE_SPECIAL;
  return index;
}


crop2_register_id = 0;
var special2_0 = registerSpecial2('fern', Res({resin:10}), 4, 'adds +10 starter seeds', 'adds +10 starter seeds after every transcension and also immediately now', image_fern_as_crop);

// berries2
crop2_register_id = 25;
var berry2_0 = registerBerry2('blackberry', Res({resin:10}), 60, 'boosts berries 20% (additive)', 'boosts berries in the basic field 20% (additive)', blackberry);
/*var berry2_1 = registerBerry2('blueberry', getBerry2Cost(1), getBerry2Prod(1), blueberry);
var berry2_2 = registerBerry2('cranberry', getBerry2Cost(2), getBerry2Prod(2), cranberry);
var berry2_3 = registerBerry2('currant', getBerry2Cost(3), getBerry2Prod(3), currant);
var berry2_4 = registerBerry2('goji', getBerry2Cost(4), getBerry2Prod(4), goji);
var berry2_5 = registerBerry2('gooseberry', getBerry2Cost(5), getBerry2Prod(5), gooseberry);
var berry2_6 = registerBerry2('grape', getBerry2Cost(6), getBerry2Prod(6), grape);
var berry2_7 = registerBerry2('honeyberry', getBerry2Cost(7), getBerry2Prod(7), honeyberry);
var berry2_8 = registerBerry2('juniper', getBerry2Cost(8), getBerry2Prod(8), juniper);*/

// mushrooms2
crop2_register_id = 50;
var mush2_0 = registerMushroom2('champignon', Res({resin:20}), 120, 'boosts mushrooms 20% (additive)', 'boosts mushrooms in the basic field 20% (additive)', champignon);
/*var mush2_1 = registerMushroom2('morel', getMushroom2Cost(1), getMushroom2Prod(1), morel);
var mush2_2 = registerMushroom2('amanita', getMushroom2Cost(2), getMushroom2Prod(2), amanita);
var mush2_3 = registerMushroom2('portobello', getMushroom2Cost(3), getMushroom2Prod(3), portobello);*/

// flowers2
crop2_register_id = 75;
var flower2_0 = registerFlower2('clover', Res({resin:50}), 0.5, 180, undefined, 'boosts the bonus effect of ethereal neighbors of type berry and mushroom. No effect if no appropriate neighbors. This crop boosts neighboring plants in the ethereal field, rather than boosting the basic field directly.', clover);
/*var flower2_1 = registerFlower2('cornflower', getFlower2Cost(1), Num(0.5), cornflower);
var flower2_2 = registerFlower2('daisy', getFlower2Cost(2), Num(2), daisy);
var flower2_3 = registerFlower2('dandelion', getFlower2Cost(3), Num(1), dandelion);*/




crop2_register_id = 100;
//var nettle2_0 = registerNettle2('nettle', 0, Num(4), berryplanttime0, nettle);

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var registered_upgrades2 = []; // indexed consecutively, gives the index to upgrades
var upgrades2 = []; // indexed by upgrade index
var upgrades2ByName = {};


// same comment as crop_register_id
var upgrade2_register_id = -1;

// @constructor
function Upgrade2() {
  this.name = 'a';
  this.description = undefined; // longer description than the name, with details, shown if not undefined

  // function that applies the upgrade. takes argument n, integer, if > 1,
  // must have same effect as calling n times with 1.
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

  // gets the name, taking stage into account if it has stages
  this.getName = function() {
    var name = this.name;
    if(state.upgrades2[this.index].count > 1) name += ' ' + util.toRoman((state.upgrades2[this.index].count));
    return name;
  };

  // name of next instance of this upgrade, if multi-staged
  this.getNextName = function() {
    var name = this.name;
    if(state.upgrades2[this.index].count > 0) name += ' ' + util.toRoman((state.upgrades2[this.index].count + 1));
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

// maxcount should be 1 for an upgrade that can only be done once (e.g. an unlock), or 0 for infinity
function registerUpgrade2(name, cost, cost_increase, fun, pre, maxcount, description, bgcolor, bordercolor, image0, image1) {
  if(upgrades2[upgrade2_register_id] || upgrade2_register_id < 0 || upgrade2_register_id > 65535) throw 'upgrades2 id already exists or is invalid!';
  var upgrade = new Upgrade2();
  upgrade.index = upgrade2_register_id++;
  upgrades2[upgrade.index] = upgrade;
  upgrades2ByName[name] = upgrade;
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

  if(!pre) pre = function(){return true;};
  upgrade.pre = pre;

  upgrade.description = description;

  return upgrade.index;
}


// register an upgrade that was removed from the game so it's marked as invalid to not display it and remove from new saves
function registerDeprecatedUpgrade2() {
  var result = registerUpgrade2('<deprecated>', Res(), 0, function(){}, function(){return false;}, 1, '<deprecated>');
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






var upgrade2_time_reduce_0_amount = 60;

upgrade2_register_id = 25;
var upgrade2_time_reduce_0 = registerUpgrade2('faster growing', Res({resin:25}), 1, function() {
}, function(){return true}, 1, 'basic plants grow up to ' + upgrade2_time_reduce_0_amount + ' seconds faster. This is capped for already fast plants, and can remove up to 50% of the total time.', undefined, undefined, blackberry[0]);



upgrade2_register_id = 50;
var upgrade2_field6x6 = registerUpgrade2('larger field', Res({resin:100}), 1, function() {
  var numw = Math.max(6, state.numw);
  var numh = Math.max(6, state.numh);
  changeFieldSize(state, numw, numh);
  initFieldUI();
}, function(){return state.numw >= 5 && state.numh >= 5}, 1, 'increase basic field size to 6x6 tiles', undefined, undefined, field_summer[0]);

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


var min_transcension_level = 10;

var treeboost = 0.05; // additive production boost per tree level


// outputs the minimum spores required for the tree to go to the given level
function treeLevelReq(level) {
  var res = new Res();
  res.spores = Num.rpow(9, Num(level - 1)).mulr(1);
  return res;
}

// returns an index in the tree_images array for the given tree level
// several levels reuse the same image (and string name in there), so the result will
// be an index that is <= level, and also always < tree_images.length
// NOTE: must be such that at 10, the first time the name "adult tree" is used to fit the storyline
function treeLevelIndex(level) {
  var result = 0;
  // 0-4: one image for each level
  if(level < 5) result = level;
  // 5-49: one image per 5 levels
  else if(level < 50) result = 4 + Math.floor(level / 5);
  //50-...: 1 image per 10 levels
  else result = 14 + Math.floor((level - 50) / 10);
  if (result >= tree_images.length) result = tree_images.length - 1;
  return result;
}

// The resin given by tree going to this level
function treeLevelResin(level) {
  return Num.rpow(1.14, Num(level)).mulr(0.5);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


function getStarterResources() {
  var ethereal_seeds = Num(state.fullgrowncrop2count[special2_0] * 10);
  return Res({seeds:ethereal_seeds});
}
