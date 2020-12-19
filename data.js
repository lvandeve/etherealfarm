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

var CROPTYPE_BERRY = 0;
var CROPTYPE_MUSH = 1;
var CROPTYPE_FLOWER = 2;

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
  this.bonus_season = [Num(1), Num(1), Num(1), Num(0.75)];

  this.basic_upgrade = null; // id of registered upgrade that does basic upgrades of this plant

  this.image = undefined;

  this.type = undefined;
  this.tier = 0;
};

var sameTypeCostMultiplier = 1.5;
var sameTypeCostMultiplier_Flower = 2.5;
var cropRecoup = 0.33;  // recoup for deleting a plant. It is only partial, the goal of the game is not to replace plants often

Crop.prototype.getCost = function(opt_adjust_count) {
  var mul = (this.type == CROPTYPE_FLOWER) ? sameTypeCostMultiplier_Flower : sameTypeCostMultiplier;
  var countfactor = Math.pow(mul, state.cropcount[this.index] + (opt_adjust_count || 0));
  return this.cost.mulr(countfactor);
};

// used for multiple possible aspects, such as production, boost if this is a flower, etc...
Crop.prototype.getSeasonBonus = function(season) {
  var bonus_season = this.bonus_season[season];
  if(season == 3) {
    // winter, since it's a malus, the bonus applies in reverse direction
    bonus_season = Num(1).sub(Num(1).sub(bonus_season).div(state.ethereal_season_bonus[season]));
  } else {
    bonus_season = bonus_season.subr(1).mul(state.ethereal_season_bonus[season]).addr(1);
  }
  return bonus_season;
}

// f = Cell from field, or undefined to not take location-based production bonuses into account
Crop.prototype.getProd = function(f, give_breakdown) {
  var result = Res(this.prod);
  var breakdown = [];
  if(give_breakdown) breakdown.push(['base', Num(0), result.clone()]);

  // medal
  result.mulInPlace(state.medal_prodmul);
  if(give_breakdown) breakdown.push(['achievements', state.medal_prodmul, result.clone()]);

  // upgrades
  if(this.basic_upgrade != null) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {
      var mul_upgrade = u2.bonus.powr(u.count);
      result.mulInPlace(mul_upgrade);
      if(give_breakdown) breakdown.push([' upgrades (' + u.count + ')', mul_upgrade, result.clone()]);
    }
  }

  // ethereal upgrades
  var e = result.elmul(state.ethereal_prodmul);
  if(result.neq(e)) {
    if(give_breakdown) {
      var mul = Num(1);
      var a0 = result.toArray();
      var a1 = e.toArray();
      for(var i = 0; i < a0.length; i++) {
        if(a0[i].neq(a1[i])) {
          mul = a1[i].div(a0[i]);
          break;
        }
      }
      breakdown.push(['ethereal upgrades', mul, e.clone()]);
    }
    result = e;
  }

  // flower boost
  if(f) {
    var mul_boost = Num(1);
    var num = 0;
    if(f.x > 0) { var n = state.field[f.y][f.x - 1]; if(n.index >= CROPINDEX && n.growth >= 1) {var boost = crops[n.index - CROPINDEX].getBoost(); if(boost.neqr(0)) {mul_boost.addInPlace(boost); num++; }}}
    if(f.y > 0) { var n = state.field[f.y - 1][f.x]; if(n.index >= CROPINDEX && n.growth >= 1) {var boost = crops[n.index - CROPINDEX].getBoost(); if(boost.neqr(0)) {mul_boost.addInPlace(boost); num++; }}}
    if(f.x + 1 < state.numw) { var n = state.field[f.y][f.x + 1]; if(n.index >= CROPINDEX && n.growth >= 1) {var boost = crops[n.index - CROPINDEX].getBoost(); if(boost.neqr(0)) {mul_boost.addInPlace(boost); num++; }}}
    if(f.y + 1 < state.numh) { var n = state.field[f.y + 1][f.x]; if(n.index >= CROPINDEX && n.growth >= 1) {var boost = crops[n.index - CROPINDEX].getBoost(); if(boost.neqr(0)) {mul_boost.addInPlace(boost); num++; }}}
    result.mulInPlace(mul_boost);
    if(give_breakdown && num > 0) breakdown.push(['flowers (' + num + ')', mul_boost, result.clone()]);
  }

  // teelevel boost
  if(state.treelevel > 0) {
    var tree_boost = Num(1).addr(treeboost * state.treelevel);
    result.mulInPlace(tree_boost);
    if(give_breakdown && tree_boost.neqr(1)) breakdown.push(['tree level (' + state.treelevel + ')', tree_boost, result.clone()]);
  }

  // posmul is used when the bonus only affects its production but not its consumption.
  // most do not use posmul, since the game would become trivial if production has multipliers of billions while consumption remains something similar to the early game values.
  // especially a global bonus like medal, that affects everything at once and hence can't cause increased consumption to be worse, should use full mul, not posmul

  //season. Unlike other multipliers, this one does not affect negative production. This is a good thing in the crop's good season, but extra harsh in a bad season (e.g. winter)
  var season = getSeason();
  var bonus_season = this.getSeasonBonus(season);
  if(bonus_season.neqr(1)) {
    result.posmulInPlace(bonus_season);
    if(give_breakdown) breakdown.push([seasonNames[season], bonus_season, result.clone()]);
  }

  if(give_breakdown) return breakdown;
  return result;
};

Crop.prototype.getBoost = function(give_breakdown) {
  var result = this.boost.clone();
  var breakdown = [];
  if(give_breakdown) breakdown.push(['base', Num(0), result.clone()]);

  // TODO: have some achievements that give a boostmul instead of a prodmul

  // upgrades
  if(this.basic_upgrade != null) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {
      var mul_upgrade = u2.bonus.mulr(u.count).addr(1); // the flower upgrades are additive, unlike the crop upgrades which are multiplicative. This because the flower bonus itself is already multiplicative to the plants.
      result.mulInPlace(mul_upgrade);
      if(give_breakdown) breakdown.push([' upgrades (' + u.count + ')', mul_upgrade, result.clone()]);
      // example: if without upgrades boost was +50%, and now 16 upgrades of 10% each together add 160%, then result will be 130%: 0.5*(1+16*0.1)=1.3
    }
  }

  var season = getSeason();
  var bonus_season = this.getSeasonBonus(season);
  if(bonus_season.neqr(1)) {
    result.mulInPlace(bonus_season);
    if(give_breakdown) breakdown.push([seasonNames[season], bonus_season, result.clone()]);
  }

  if(give_breakdown) return breakdown;
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
  crop.bonus_season[1] = Num(1.2);
  crop.type = CROPTYPE_BERRY;
  return index;
}

function registerMushroom(name, tier, planttime, image, opt_tagline) {
  var cost = getMushroomCost(tier);
  var prod = getMushroomProd(tier);
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline);
  var crop = crops[index];
  crop.bonus_season[2] = Num(1.5);
  crop.type = CROPTYPE_MUSH;
  return index;
}

function registerFlower(name, tier, boost, planttime, image, opt_tagline) {
  var cost = getFlowerCost(tier);
  var index = registerCrop(name, cost, Res({}), boost, planttime, image, opt_tagline);
  var crop = crops[index];
  crop.bonus_season[0] = Num(1.1);
  crop.type = CROPTYPE_FLOWER;
  return index;
}

// should return 1 for i=0
function getBerryBase(i) {
  return Num.rpow(2000, Num(i));
}

// first one should cost 10
function getBerryCost(i) {
  var seeds = getBerryBase(i);
  seeds.mulrInPlace(10);
  if(i > 1) seeds.mulInPlace(Num.rpow(2, Num((i - 1) * (i - 1))));
  seeds = Num.roundNicely(seeds);
  return Res({seeds:seeds});
}

// first one should give 1.0
function getBerryProd(i) {
  var seeds = getBerryBase(i);
  seeds.mulrInPlace(1.0);
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
  spores.mulrInPlace(Math.pow(0.1, i)); // make higher mushrooms less efficient in seeds->spores conversion ratio

  return Res({seeds:seeds, spores:spores});
}

function getFlowerCost(i) {
  // Flowers start after berry 2, and then appear after every 2 berries.
  return getBerryCost(2.5 + i * 2);
}

var berryplanttime0 = 60;
var mushplanttime0 = 120;
var flowerplanttime0 = 300;

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
var mush_1 = registerMushroom('morel', 1, mushplanttime0 * 4, morel);
var mush_2 = registerMushroom('amanita', 2, mushplanttime0 * 16, amanita);
var mush_3 = registerMushroom('portobello', 3, mushplanttime0 * 64, portobello);

// flowers: give boost to neighbors
crop_register_id = 75;
var flower_0 = registerFlower('clover', 0, Num(0.5), flowerplanttime0, clover);
var flower_1 = registerFlower('cornflower', 1, Num(2.0), flowerplanttime0 * 4, cornflower);
var flower_2 = registerFlower('daisy', 2, Num(8.0), flowerplanttime0 * 16, daisy);
var flower_3 = registerFlower('dandelion', 3, Num(32.0), flowerplanttime0 * 64, dandelion);


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
    if(cropid == mushunlock_0) showMessage('You unlocked the first type of mushroom! Mushrooms produce spores rather than seeds.', helpFG, helpBG);
    state.crops[crop.index].unlocked = true;
  };

  var pre = function() {
    if(prev_crop == undefined) return true;
    return state.fullgrowncropcount[prev_crop] >= prev_crop_num;
  };

  var description = 'Unlocks new crop: ' + crop.name + '.';
  if(!crop.prod.empty()) description += ' Base production: ' + crop.prod.toString();
  if(!crop.boost.eqr(0)) description += ' Boosts neighbors: ' + (crop.boost.mulr(100).toString(3, Num.N_FULL)) + '%';

  var result = registerUpgrade(name, cost, fun, pre, 1, description, '#dfc', '#0a0', crop.image[4], undefined);
  var u = upgrades[result];

  u.getCost = function(opt_adjust_count) {
    return cost;
  };

  return result;
}

// an upgrade that increases the multiplier of a crop
function registerCropMultiplier(cropid, cost, multiplier, prev_crop_num) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1);
  };

  var aspect = 'production';
  if(crop.prod.spores.neqr(0)) aspect = 'production but also consumption';

  var description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor(((multiplier - 1) * 100)) + '% (multiplicative)';

  var result = registerUpgrade('Improve ' + name, cost, fun, pre, 0, description, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(multiplier);

  u.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(Num(basic_upgrade_cost_increase), state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };

  return result;
}


function registerBoostMultiplier(cropid, cost, adder, prev_crop_num) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1);
  };

  var aspect = 'boost';

  var description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor((adder * 100)) + '% (additive)';

  var result = registerUpgrade('Improve ' + name, cost, fun, pre, 0, description, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(adder);

  u.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(Num(flower_upgrade_cost_increase), state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };

  return result;
}

upgrade_register_id = 25;
//berryunlock_0 does not exist, you start with that berry type already unlocked
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

////////////////////////////////////////////////////////////////////////////////

// power increase for crop production (not flower boost) by basic upgrades
var basic_upgrade_power_increase = 1.5; // multiplicative
// cost increase for crop production (not flower boost) by basic upgrades
var basic_upgrade_cost_increase = 2.5;

// how much more expensive than the base cost of the crop is the upgrade cost
var basic_upgrade_initial_cost = 15;

var flower_upgrade_power_increase = 0.2; // additive
var flower_upgrade_cost_increase = 5;
var flower_upgrade_initial_cost = basic_upgrade_initial_cost;

upgrade_register_id = 125;
var berrymul_0 = registerCropMultiplier(berry_0, getBerryCost(0).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var berrymul_1 = registerCropMultiplier(berry_1, getBerryCost(1).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var berrymul_2 = registerCropMultiplier(berry_2, getBerryCost(2).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var berrymul_3 = registerCropMultiplier(berry_3, getBerryCost(3).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var berrymul_4 = registerCropMultiplier(berry_4, getBerryCost(4).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var berrymul_5 = registerCropMultiplier(berry_5, getBerryCost(5).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var berrymul_6 = registerCropMultiplier(berry_6, getBerryCost(6).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var berrymul_7 = registerCropMultiplier(berry_7, getBerryCost(7).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var berrymul_8 = registerCropMultiplier(berry_8, getBerryCost(8).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);

upgrade_register_id = 150;
var mushmul_0 = registerCropMultiplier(mush_0, getMushroomCost(0).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var mushmul_1 = registerCropMultiplier(mush_1, getMushroomCost(1).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var mushmul_2 = registerCropMultiplier(mush_2, getMushroomCost(2).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);
var mushmul_3 = registerCropMultiplier(mush_3, getMushroomCost(3).mulr(basic_upgrade_initial_cost), basic_upgrade_power_increase, 1);

upgrade_register_id = 175;
var flowermul_0 = registerBoostMultiplier(flower_0, getFlowerCost(0).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1);
var flowermul_1 = registerBoostMultiplier(flower_1, getFlowerCost(1).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1);
var flowermul_2 = registerBoostMultiplier(flower_2, getFlowerCost(2).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1);
var flowermul_3 = registerBoostMultiplier(flower_3, getFlowerCost(3).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1);

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
var medal_crowded_id = registerMedal('crowded', 'planted something on every single field cell. Time to delete crops when more room is needed!', genericicon, function() { return state.numemptyfields == 0; }, Num(0.02));
registerMedal('fern 100', 'clicked 100 ferns', images_fern[0], function() { return state.g_numferns >= 100; }, Num(0.01));
registerMedal('fern 1000', 'clicked 1000 ferns', images_fern[0], function() { return state.g_numferns >= 1000; }, Num(0.02));
registerMedal('fern 10000', 'clicked 10000 ferns', images_fern[0], function() { return state.g_numferns >= 10000; }, Num(0.04));
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
medal_register_id += 20; // a few spares for this one
var planted_achievement_values =  [   5,   50,  100,  200,  500,  1000,  1500, 2000, 5000];
var planted_achievement_bonuses = [0.01, 0.01, 0.02, 0.02, 0.05,  0.05,   0.1,  0.1,  0.2];
for(var i = 0; i < planted_achievement_values.length; i++) {
  var a = planted_achievement_values[i];
  var b = planted_achievement_bonuses[i];
  var name = 'planted ' + a;
  if(i > 0) medals[prevmedal].description += '. Next achievement in this series, ' + name + ', unlocks at ' + a + ' planted.';
  prevmedal = registerMedal(name, 'Planted ' + a + ' or more plants over the course of the game', genericicon,
      bind(function(a) { return state.g_numplanted >= a; }, a),
      Num(b));
}
medal_register_id += 20; // a few spares for this one
var level_achievement_values =  [10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 9999];
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


registerMedal('four seasons', 'reached winter and seen all seasons', field_winter[0], function() { return getSeason() == 3; }, Num(0.01));

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

Crop2.prototype.getCost = function() {
  return this.cost;
};


// Ethereal production
Crop2.prototype.getProd = function(f, give_breakdown) {
  var result = Res(this.prod);
  var breakdown = [];
  if(give_breakdown) breakdown.push(['base', Num(0), result.clone()]);

  // flower boost
  if(f) {
    var mul_boost = Num(1);
    var num = 0;
    if(f.x > 0) { var n = state.field2[f.y][f.x - 1]; if(n.index >= CROPINDEX && n.growth >= 1) {var boost = crops2[n.index - CROPINDEX].getBoost(); if(boost.neqr(0)) {mul_boost.addInPlace(boost); num++; }}}
    if(f.y > 0) { var n = state.field2[f.y - 1][f.x]; if(n.index >= CROPINDEX && n.growth >= 1) {var boost = crops2[n.index - CROPINDEX].getBoost(); if(boost.neqr(0)) {mul_boost.addInPlace(boost); num++; }}}
    if(f.x + 1 < state.numw) { var n = state.field2[f.y][f.x + 1]; if(n.index >= CROPINDEX && n.growth >= 1) {var boost = crops2[n.index - CROPINDEX].getBoost(); if(boost.neqr(0)) {mul_boost.addInPlace(boost); num++; }}}
    if(f.y + 1 < state.numh) { var n = state.field2[f.y + 1][f.x]; if(n.index >= CROPINDEX && n.growth >= 1) {var boost = crops2[n.index - CROPINDEX].getBoost(); if(boost.neqr(0)) {mul_boost.addInPlace(boost); num++; }}}
    result.mulInPlace(mul_boost);
    if(give_breakdown && num > 0) breakdown.push(['flowers (' + num + ')', mul_boost, result.clone()]);
  }


  if(give_breakdown) return breakdown;
  return result;
}

Crop2.prototype.getBoost = function(give_breakdown) {
  var result = this.boost.clone();
  var breakdown = [];
  if(give_breakdown) breakdown.push(['base', Num(0), result.clone()]);

  if(give_breakdown) return breakdown;
  return result;
};

var registered_crops2 = []; // indexed consecutively, gives the index to crops2
var crops2 = []; // indexed by crop index
var crops2ByName = {};

// 16-bit ID, auto incremented with registerCrop2, but you can also set it to a value yourself, to ensure consistent IDs for various crops2 (between savegames) in case of future upgrades
var crop2_register_id = -1;

function registerCrop2(name, cost, prod, boost, image, opt_tagline) {
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
  crop.image = image;
  crop.tagline = opt_tagline || '';
  crop.boost = boost;

  return crop.index;
}

function registerBerry2(name, cost, prod, image, opt_tagline) {
  var index = registerCrop2(name, cost, prod, Num(0), image, opt_tagline);
  var crop = crops2[index];
  return index;
}

function registerFlower2(name, cost, boost, image, opt_tagline) {
  var index = registerCrop2(name, cost, Res({}), boost, image, opt_tagline);
  var crop = crops2[index];
  return index;
}

function registerMushroom2(name, cost, prod, image, opt_tagline) {
  var index = registerCrop2(name, cost, prod, Num(0), image, opt_tagline);
  var crop = crops2[index];
  return index;
}

function getBerry2Cost(i) {
  var v = Num.rpow(2000, Num(i)).mulr(10);
  v = Num.roundNicely(v);
  return Res({resin:v});
}

function getBerry2Prod(i) {
  var result = getBerry2Cost(i).mulr(0.01);
  result.mulrInPlace(Num(0.75).powr(i));
  result.seeds2 = result.resin;
  result.resin = Num(0);
  return result;
}


function getMushroom2Cost(i) {
  // Mushrooms start after berry 1, and then appear after every 2 berries.
  var berry = getBerry2Cost(1 + i * 2);
  return berry.mulr(50);
}

function getFlower2Cost(i) {
  // Flowers start after berry 2, and then appear after every 2 berries.
  var berry = getBerry2Cost(2 + i * 2);
  return berry.mulr(100);
}

function getMushroom2Prod(i) {
  var seeds = getMushroom2Cost(i).mulr(0.01).seeds2;
  var spores = Num(1000).powr(i).mulr(0.01);
  seeds = seeds.mul(Num(1.05).powr(i)).neg();
  return Res({seeds2:seeds, spores2:spores});
}

// berries: give seeds
crop2_register_id = 25;
var berry2_0 = registerBerry2('blackberry', getBerry2Cost(0), getBerry2Prod(0), blackberry);
/*var berry2_1 = registerBerry2('blueberry', getBerry2Cost(1), getBerry2Prod(1), blueberry);
var berry2_2 = registerBerry2('cranberry', getBerry2Cost(2), getBerry2Prod(2), cranberry);
var berry2_3 = registerBerry2('currant', getBerry2Cost(3), getBerry2Prod(3), currant);
var berry2_4 = registerBerry2('goji', getBerry2Cost(4), getBerry2Prod(4), goji);
var berry2_5 = registerBerry2('gooseberry', getBerry2Cost(5), getBerry2Prod(5), gooseberry);
var berry2_6 = registerBerry2('grape', getBerry2Cost(6), getBerry2Prod(6), grape);
var berry2_7 = registerBerry2('honeyberry', getBerry2Cost(7), getBerry2Prod(7), honeyberry);
var berry2_8 = registerBerry2('juniper', getBerry2Cost(8), getBerry2Prod(8), juniper);

// mushrooms: give spores
crop2_register_id = 50;
var mush2_0 = registerMushroom2('champignon', getMushroom2Cost(0), getMushroom2Prod(0), champignon);
var mush2_1 = registerMushroom2('morel', getMushroom2Cost(1), getMushroom2Prod(1), morel);
var mush2_2 = registerMushroom2('amanita', getMushroom2Cost(2), getMushroom2Prod(2), amanita);
var mush2_3 = registerMushroom2('portobello', getMushroom2Cost(3), getMushroom2Prod(3), portobello);

// flowers: give boost to neighbors
crop2_register_id = 75;
var flower2_0 = registerFlower2('clover', getFlower2Cost(0), Num(0.1), clover);
var flower2_1 = registerFlower2('cornflower', getFlower2Cost(1), Num(0.5), cornflower);
var flower2_2 = registerFlower2('daisy', getFlower2Cost(2), Num(2), daisy);
var flower2_3 = registerFlower2('dandelion', getFlower2Cost(3), Num(1), dandelion);*/


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
  this.bgcolor = '#0ff';
  this.bordercolor = '#ff0';
  this.image0 = undefined; // bg image, e.g. a plant
  this.image1 = undefined; // fg image, e.g. a level-up arrow in front of the plant

  // how much the cost of this upgrade increases when doing next one
  this.cost_increase = Num(1);

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


upgrade2_register_id = 10;



registerUpgrade2('improve seeds production +25%', Res({seeds2:0.1}), 1.5, function() {
  state.ethereal_prodmul.seeds.addrInPlace(0.25);
}, function(){return true;}, 0, 'seed production bonus (additive)', undefined, undefined, image_seed);

registerUpgrade2('improve spores production +25%', Res({seeds2:0.1}), 1.5, function() {
  state.ethereal_prodmul.spores.addrInPlace(0.25);
}, function(){return true;}, 0, 'spores production bonus (additive)', undefined, undefined, image_spore);

registerUpgrade2('starting resources: +10 seeds', Res({seeds2:0.1}), 1.5, function() {
  state.ethereal_starting_resources.seeds.addrInPlace(10);
  state.res.seeds.addrInPlace(10);
}, function(){return true;}, 1, 'start with +10 seeds after reset, also get them immediately now', undefined, undefined, image_starting_seeds);

var upgrade2_starting_0 = registerUpgrade2('starting resources: +100 seeds', Res({seeds2:1}), 1.5, function() {
  state.ethereal_starting_resources.seeds.addrInPlace(100);
  state.res.seeds.addrInPlace(100);
}, function(){return state.upgrades2[upgrade2_starting_0].unlocked;}, 1, 'start with +100 seeds after reset, also get them immediately now', undefined, undefined, image_starting_seeds);

registerUpgrade2('improve spring 25%', Res({seeds2:0.1}), 1.5, function() {
  state.ethereal_season_bonus[0].addrInPlace(0.25);
}, function(){return true;}, 0, 'improve spring effect (additive)', undefined, undefined, tree_images[3][1][0]);

registerUpgrade2('improve summer 25%', Res({seeds2:0.1}), 1.5, function() {
  state.ethereal_season_bonus[1].addrInPlace(0.25);
}, function(){return true;}, 0, 'improve summer effect (additive)', undefined, undefined, tree_images[3][1][1]);

registerUpgrade2('improve autumn 25%', Res({seeds2:0.1}), 1.5, function() {
  state.ethereal_season_bonus[2].addrInPlace(0.25);
}, function(){return true;}, 0, 'improve autumn effect (additive)', undefined, undefined, tree_images[3][1][2]);

registerUpgrade2('improve winter 25%', Res({seeds2:0.1}), 1.5, function() {
  state.ethereal_season_bonus[3].mulrInPlace(1.25);
}, function(){return true;}, 0, 'reduce winter harshness (multiplicative)', undefined, undefined, tree_images[3][1][3]);

// This is not affordable in the beta release, it's a teaser and future idea needing balancing only
registerUpgrade2('increase field size 6x6', Res({seeds2:100}), 1, function() {
  changeFieldSize(state, state.numw + 1, state.numh + 1);
  initFieldUI();
}, function(){return state.numw >= 5 && state.numh >= 5}, 1.5, 'increase basic field size to 6x6', undefined, undefined, field_summer[0]);



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
