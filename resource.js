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

// The resources object for the game



var resource_names = ['seeds', 'spores', 'resin', 'twigs', 'nuts', 'infinity seeds', 'amber', 'essence', 'infinity spores'];

// Resources.
// o is object with optional fields with the same names as the resource fields of Res (and may have regular JS numbers or Num), or can be a Res itself
function Res(o) {
  // Allow calling it without new, but act like new
  if(!(this instanceof Res)) {
    return new Res(o);
  }
  if(o) {
    // create a new Num for each, so that addrInPlace can't accidently affect source number objects
    this.seeds = new Num(o.seeds || 0);
    this.spores = new Num(o.spores || 0);
    this.resin = new Num(o.resin || 0);
    this.twigs = new Num(o.twigs || 0);
    this.nuts = new Num(o.nuts || 0);
    this.infseeds = new Num(o.infseeds || 0); // infinity seeds
    this.amber = new Num(o.amber || 0);
    this.essence = new Num(o.essence || 0); // fruit essence
    this.infspores = new Num(o.infspores || 0); // infinity spores
  } else {
    this.seeds = new Num();
    this.spores = new Num();
    this.resin = new Num();
    this.twigs = new Num();
    this.nuts = new Num();
    this.infseeds = new Num();
    this.amber = new Num();
    this.essence = new Num();
    this.infspores = new Num();
  }
};

// returns a new resource object with all values set to 1, e.g. for a bonus multiplier
Res.resOne = function() {
  var res = new Res();
  res.addrInPlace(1);
  return res;
};

// returns the resources as an array. The order is consistent, but do not rely on which index is which named resource. Only converting back to Resource with fromArray brings back the names.
// does not make copies of the Num values, so do not change them in place if the original resources should not be modified
Res.prototype.toArray = function() {
  return [this.seeds, this.spores, this.resin, this.twigs, this.nuts, this.infseeds, this.amber, this.essence, this.infspores];
};
Res.toArray = function(v) { return v.toArray(); }

Res.prototype.clone = function() {
  // Res.clone gets called a lot in computations of the game, and using util.clone is slow, so implemented manually here
  return new Res(this);
};

// in-place
Res.prototype.fromArray = function(a) {
  this.seeds = a[0] || new Num(0);
  this.spores = a[1] || new Num(0);
  this.resin = a[2] || new Num(0);
  this.twigs = a[3] || new Num(0);
  this.nuts = a[4] || new Num(0);
  this.infseeds = a[5] || new Num(0);
  this.amber = a[6] || new Num(0);
  this.essence = a[7] || new Num(0);
  this.infspores = a[8] || new Num(0);
};
// not in-place
Res.fromArray = function(a) {
  var res = new Res();
  res.fromArray(a);
  return res;
};

//reset in-place without allocating any new objects
Res.prototype.reset = function() {
  this.seeds.reset();
  this.spores.reset();
  this.resin.reset();
  this.twigs.reset();
  this.nuts.reset();
  this.infseeds.reset();
  this.amber.reset();
  this.essence.reset();
  this.infspores.reset();
};

Res.prototype.atIndex = function(index) {
  if(index == 0) return this.seeds;
  if(index == 1) return this.spores;
  if(index == 2) return this.resin;
  if(index == 3) return this.twigs;
  if(index == 4) return this.nuts;
  if(index == 5) return this.infseeds;
  if(index == 6) return this.amber;
  if(index == 7) return this.essence;
  if(index == 8) return this.infspores;
  return Num(0);
};

Res.prototype.addInPlace = function(b) {
  this.seeds.addInPlace(b.seeds);
  this.spores.addInPlace(b.spores);
  this.resin.addInPlace(b.resin);
  this.twigs.addInPlace(b.twigs);
  this.nuts.addInPlace(b.nuts);
  this.infseeds.addInPlace(b.infseeds);
  this.amber.addInPlace(b.amber);
  this.essence.addInPlace(b.essence);
  this.infspores.addInPlace(b.infspores);
  return this;
};
Res.prototype.add = function(b) {
  var res = Res(this);
  res.addInPlace(b);
  return res;
};
Res.add = function(a, b) { return a.add(b); };


// v is regular JS number or Num instead of Res, hence the r from regular in the name
Res.prototype.addrInPlace = function(v) {
  if(!(v instanceof Num)) v = new Num(v);
  this.seeds.addInPlace(v);
  this.spores.addInPlace(v);
  this.resin.addInPlace(v);
  this.twigs.addInPlace(v);
  this.nuts.addInPlace(v);
  this.infseeds.addInPlace(v);
  this.amber.addInPlace(v);
  this.essence.addInPlace(v);
  this.infspores.addInPlace(v);
  return this;
};
Res.prototype.addr = function(v) {
  var res = Res(this);
  res.addrInPlace(v);
  return res;
};
Res.addr = function(r, v) { return r.addr(v); }

Res.prototype.subInPlace = function(b) {
  this.seeds.subInPlace(b.seeds);
  this.spores.subInPlace(b.spores);
  this.resin.subInPlace(b.resin);
  this.twigs.subInPlace(b.twigs);
  this.nuts.subInPlace(b.nuts);
  this.infseeds.subInPlace(b.infseeds);
  this.amber.subInPlace(b.amber);
  this.essence.subInPlace(b.essence);
  this.infspores.subInPlace(b.infspores);
  return this;
};
Res.prototype.sub = function(b) {
  var res = Res(this);
  res.subInPlace(b);
  return res;
};
Res.sub = function(a, b) { return a.sub(b); };

Res.prototype.negInPlace = function() {
  this.seeds.negInPlace();
  this.spores.negInPlace();
  this.resin.negInPlace();
  this.twigs.negInPlace();
  this.nuts.negInPlace();
  this.infseeds.negInPlace();
  this.amber.negInPlace();
  this.essence.negInPlace();
  this.infspores.negInPlace();
  return this;
};
Res.prototype.neg = function() {
  var res = Res(this);
  res.negInPlace();
  return res;
};
Res.neg = function(a) { return a.neg(); };


// multiply with a Num.
Res.prototype.mulInPlace = function(v) {
  this.seeds.mulInPlace(v);
  this.spores.mulInPlace(v);
  this.resin.mulInPlace(v);
  this.twigs.mulInPlace(v);
  this.nuts.mulInPlace(v);
  this.infseeds.mulInPlace(v);
  this.amber.mulInPlace(v);
  this.essence.mulInPlace(v);
  this.infspores.mulInPlace(v);
  return this;
};
Res.prototype.mul = function(v) {
  var res = Res(this);
  res.mulInPlace(v);
  return res;
};
Res.mul = function(r, v) { return r.mul(v); }

// multiply with a regular JS number
Res.prototype.mulrInPlace = function(v) {
  return this.mulInPlace(new Num(v));
};
Res.prototype.mulr = function(v) {
  return this.mul(new Num(v));
};
Res.mulr = function(r, v) { return r.mul(new Num(v)); };

// divide through a Num.
Res.prototype.divInPlace = function(v) {
  this.seeds.divInPlace(v);
  this.spores.divInPlace(v);
  this.resin.divInPlace(v);
  this.twigs.divInPlace(v);
  this.nuts.divInPlace(v);
  this.infseeds.divInPlace(v);
  this.amber.divInPlace(v);
  this.essence.divInPlace(v);
  this.infspores.divInPlace(v);
  return this;
};
Res.prototype.div = function(v) {
  var res = Res(this);
  res.divInPlace(v);
  return res;
};
Res.div = function(r, v) { return r.div(v); }
// divide through a regular JS number
Res.prototype.divrInPlace = function(v) {
  return this.divInPlace(new Num(v));
};
Res.prototype.divr = function(v) {
  return this.div(new Num(v));
};
Res.divr = function(r, v) { return r.div(new Num(v)); };

// finds divisor between a and b, ignoring 0/0 which would give nan
// returns result as a single Num
// that is, if b is of the form a*x, this will return x. Given that a and b are vectors of multiple values,
// the result is not guaranteed to exist.
// returns nan if all value of a and b are 0. otherwise, ignores any resources that are 0 in both a and b, and returns the max value for a.resource / b.resource (which can be infinite).
// this is useful for in UI to give some indicatino of how much bigger one resource is than another, and is also useful for any resources of which only one value is used (e.g. seeds, while all the other values are 0)
Res.findDiv = function(a, b) {
  var arra = a.toArray();
  var arrb = b.toArray();
  var r = Num(NaN);
  for(var i = 0; i < arra.length; i++) {
    var va = arra[i];
    var vb = arrb[i];
    if(va.eqr(0) && vb.eqr(0)) continue;
    var d = va.div(vb);
    if(r.isNaN() || d.gt(r)) r = d;
  }
  return r;
};

// Similar to Res.findDiv, but does not consider negative values. E.g. to find the mushroom production, not its seed concumption
Res.findPosDiv = function(a, b) {
  var arra = a.toArray();
  var arrb = b.toArray();
  var r = Num(NaN);
  for(var i = 0; i < arra.length; i++) {
    var va = arra[i];
    var vb = arrb[i];
    if(va.eqr(0) && vb.eqr(0)) continue;
    if(va.ltr(0) || vb.ltr(0)) continue; // negative values ignored
    var d = va.div(vb);
    if(r.isNaN() || d.gt(r)) r = d;
  }
  return r;
};



// elementwise multiply with another resource.
Res.prototype.elmulInPlace = function(r) {
  this.seeds.mulInPlace(r.seeds);
  this.spores.mulInPlace(r.spores);
  this.resin.mulInPlace(r.resin);
  this.twigs.mulInPlace(r.twigs);
  this.nuts.mulInPlace(r.nuts);
  this.infseeds.mulInPlace(r.infseeds);
  this.amber.mulInPlace(r.amber);
  this.essence.mulInPlace(r.essence);
  this.infspores.mulInPlace(r.infspores);
  return this;
};
Res.prototype.elmul = function(r) {
  var res = Res(this);
  res.elmulInPlace(r);
  return res;
};
Res.elmul = function(a, b) { return a.elmul(b); }


// posmul: multiply only positive resources, not negative ones. Intended for certain common types of bonus.
Res.prototype.posmulInPlace = function(v) {
  if(this.seeds.ger(0)) this.seeds.mulInPlace(v);
  if(this.spores.ger(0)) this.spores.mulInPlace(v);
  if(this.resin.ger(0)) this.resin.mulInPlace(v);
  if(this.twigs.ger(0)) this.twigs.mulInPlace(v);
  if(this.nuts.ger(0)) this.nuts.mulInPlace(v);
  if(this.infseeds.ger(0)) this.infseeds.mulInPlace(v);
  if(this.amber.ger(0)) this.amber.mulInPlace(v);
  if(this.essence.ger(0)) this.essence.mulInPlace(v);
  if(this.infspores.ger(0)) this.infspores.mulInPlace(v);
};
Res.prototype.posmul = function(v) {
  var res = Res(this);
  res.posmulInPlace(v);
  return res;
};
Res.posmul = function(r, v) { return r.posmul(v); }
Res.prototype.posmulrInPlace = function(v) {
  return this.posmulInPlace(new Num(v));
};
Res.prototype.posmulr = function(v) {
  return this.posmul(new Num(v));
};
Res.posmulr = function(r, v) { return r.posmul(new Num(v)); };

// negmul: counterpart of posmul.
Res.prototype.negmulInPlace = function(v) {
  if(this.seeds.ler(0)) this.seeds.mulInPlace(v);
  if(this.spores.ler(0)) this.spores.mulInPlace(v);
  if(this.resin.ler(0)) this.resin.mulInPlace(v);
  if(this.twigs.ler(0)) this.twigs.mulInPlace(v);
  if(this.nuts.ler(0)) this.nuts.mulInPlace(v);
  if(this.infseeds.ler(0)) this.infseeds.mulInPlace(v);
  if(this.amber.ler(0)) this.amber.mulInPlace(v);
  if(this.essence.ler(0)) this.essence.mulInPlace(v);
  if(this.infspores.ler(0)) this.infspores.mulInPlace(v);
};
Res.prototype.negmul = function(v) {
  var res = Res(this);
  res.negmulInPlace(v);
  return res;
};
Res.negmul = function(r, v) { return r.negmul(v); }
Res.prototype.negmulrInPlace = function(v) {
  return this.negmulInPlace(Num(new v));
};
Res.prototype.negmulr = function(v) {
  return this.negmul(new Num(v));
};
Res.negmulr = function(r, v) { return r.negmul(new Num(v)); };

Res.prototype.eq = function(b) {
  if(!this.seeds.eq(b.seeds)) return false;
  if(!this.spores.eq(b.spores)) return false;
  if(!this.resin.eq(b.resin)) return false;
  if(!this.twigs.eq(b.twigs)) return false;
  if(!this.nuts.eq(b.nuts)) return false;
  if(!this.infseeds.eq(b.infseeds)) return false;
  if(!this.amber.eq(b.amber)) return false;
  if(!this.essence.eq(b.essence)) return false;
  if(!this.infspores.eq(b.infspores)) return false;
  return true;
};
Res.eq = function(a, b) { return a.eq(b); };

/*
Beware: ge, le, gt and lt have gotcha's, since ordering rules of single numbers don't apply to multi-valued objects like the resources
ge is implemented as: all individual resources ge, so means "all resources are greater than or equal"
le is implemented as: all individual resources le, so means "all resources are lesser than or equal"
gt is implemented as !le, so means "any resource is strictly greater than"
lt is implemented as !ge, so means "any resource is strictly lesser than"
Reason why lt and gt are different than ge and le: an lt or gt for all (rather than any) resources would almost always return false since there'll always be some irrelevant resource type that's 0 on both sides.
For cost computations (including treating NaN in have as can't afford), use the following, where the can_afford function treats negatives better (see further)
for can_afford: have.ge(cost), cost.le(have) or have.can_afford(cost)
for cannot_afford: have.lt(cost), cost.gt(have) or !have.can_afford(cost)
*/

// greater than or equal for all resources
Res.prototype.ge = function(b) {
  if(!this.seeds.ge(b.seeds)) return false;
  if(!this.spores.ge(b.spores)) return false;
  if(!this.resin.ge(b.resin)) return false;
  if(!this.twigs.ge(b.twigs)) return false;
  if(!this.nuts.ge(b.nuts)) return false;
  if(!this.infseeds.ge(b.infseeds)) return false;
  if(!this.amber.ge(b.amber)) return false;
  if(!this.essence.ge(b.essence)) return false;
  if(!this.infspores.ge(b.infspores)) return false;
  return true;
};
Res.ge = function(a, b) { return a.ge(b); };

// lesser than or equal for all resources
Res.prototype.le = function(b) {
  if(!this.seeds.le(b.seeds)) return false;
  if(!this.spores.le(b.spores)) return false;
  if(!this.resin.le(b.resin)) return false;
  if(!this.twigs.le(b.twigs)) return false;
  if(!this.nuts.le(b.nuts)) return false;
  if(!this.infseeds.le(b.infseeds)) return false;
  if(!this.amber.le(b.amber)) return false;
  if(!this.essence.le(b.essence)) return false;
  if(!this.infspores.le(b.infspores)) return false;
  return true;
};
Res.le = function(a, b) { return a.le(b); };

Res.prototype.neq = function(b) { return !this.eq(b); }
Res.neq = function(a, b) { return !Res.eq(a, b); }

// strictly greater than for any resource. This is same as !this.le(b)
Res.prototype.gt = function(b) { return !this.le(b); }
Res.gt = function(a, b) { return !Res.le(a, b); }

// strictly lesser than for any resource. This is same as !this.ge(b)
Res.prototype.lt = function(b) { return !this.ge(b); }
Res.lt = function(a, b) { return !Res.ge(a, b); }

// synonyms
Res.prototype.lte = Res.prototype.le;
Res.lte = Res.le;
Res.prototype.lter = Res.prototype.ler;
Res.lter = Res.ler;
Res.prototype.gte = Res.prototype.ge;
Res.gte = Res.ge;
Res.prototype.gter = Res.prototype.ger;
Res.gter = Res.ger;

// similar to this.ge(cost), except resources with value 0 in cost are ignored. This makes a difference if due to a bug a player has a negative value in some resource type
// 'this' represents the current resources you have
Res.prototype.can_afford = function(cost) {
  if(cost.seeds.neqr(0) && !this.seeds.ge(cost.seeds)) return false;
  if(cost.spores.neqr(0) && !this.spores.ge(cost.spores)) return false;
  if(cost.resin.neqr(0) && !this.resin.ge(cost.resin)) return false;
  if(cost.twigs.neqr(0) && !this.twigs.ge(cost.twigs)) return false;
  if(cost.nuts.neqr(0) && !this.nuts.ge(cost.nuts)) return false;
  if(cost.infseeds.neqr(0) && !this.infseeds.ge(cost.infseeds)) return false;
  if(cost.amber.neqr(0) && !this.amber.ge(cost.amber)) return false;
  if(cost.essence.neqr(0) && !this.essence.ge(cost.essence)) return false;
  if(cost.infspores.neqr(0) && !this.infspores.ge(cost.infspores)) return false;
  return true;
};

// similar to have.ge(cost), except resources with value 0 in cost are ignored. This makes a difference if due to a bug a player has a negative value in some resource type
Res.can_afford = function(have, cost) {
  return have.can_afford(cost);
};



// returns whether the resources are empty
Res.prototype.empty = function() {
  if(this.seeds.neqr(0)) return false;
  if(this.spores.neqr(0)) return false;
  if(this.resin.neqr(0)) return false;
  if(this.twigs.neqr(0)) return false;
  if(this.nuts.neqr(0)) return false;
  if(this.infseeds.neqr(0)) return false;
  if(this.amber.neqr(0)) return false;
  if(this.essence.neqr(0)) return false;
  if(this.infspores.neqr(0)) return false;
  return true;
};
Res.empty = function(a) { return a.empty(); };

Res.prototype.hasNaN = function() {
  var arr = this.toArray();
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].isNaN()) return true;
  }
  return false;
};
Res.hasNaN = function(a) { return a.hasNaN(); };

Res.prototype.hasNaNOrInfinity = function() {
  if(this.seeds.isNaNOrInfinity()) return true;
  if(this.spores.isNaNOrInfinity()) return true;
  if(this.resin.isNaNOrInfinity()) return true;
  if(this.twigs.isNaNOrInfinity()) return true;
  if(this.nuts.isNaNOrInfinity()) return true;
  if(this.infseeds.isNaNOrInfinity()) return true;
  if(this.amber.isNaNOrInfinity()) return true;
  if(this.essence.isNaNOrInfinity()) return true;
  if(this.infspores.isNaNOrInfinity()) return true;
  return false;
};
Res.hasNaNOrInfinity = function(a) { return a.hasNaNOrInfinity(); };

// safely remove NaN values from the resources
Res.prototype.removeNaN = function() {
  var arr = this.toArray();
  for(var i = 0; i < arr.length; i++) {
    if(arr[i] == undefined || arr[i].isNaN()) arr[i] = new Num(0);
  }
  this.fromArray(arr);
};

// returns whether any resource is negative (any one, must not be all)
Res.prototype.hasNeg = function() {
  if(this.seeds.ltr(0)) return true;
  if(this.spores.ltr(0)) return true;
  if(this.resin.ltr(0)) return true;
  if(this.twigs.ltr(0)) return true;
  if(this.nuts.ltr(0)) return true;
  if(this.infseeds.ltr(0)) return true;
  if(this.amber.ltr(0)) return true;
  if(this.essence.ltr(0)) return true;
  if(this.infspores.ltr(0)) return true;
  return false;
};
Res.hasNeg = function(a) { return a.hasNeg(); };

// Gets the negative resources, and then negated too (so all positive)
Res.prototype.getNegative = function() {
  var arr = this.toArray();
  var arr2 = [];
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].ltr(0)) arr2[i] = arr[i].neg();
    else arr2[i] = new Num(0);
  }
  return Res.fromArray(arr2);
};

// Get only the positive resources, negative ones are returned as 0 instead
Res.prototype.getPositive = function() {
  return Res.max(this, new Res());
};

// returns a new resource object, where only values that are non-zero in template, are set to the actual value in actual
Res.getMatchingResourcesOnly = function(template, actual) {
  var b = template.toArray();
  var a = actual.toArray();
  var arr = [];
  for(var i = 0; i < a.length; i++) {
    if(b[i].neqr(0)) arr[i] = new Num(a[i]);
    else arr[i] = new Num(0);
  }
  return Res.fromArray(arr);
};

// max of each individual resource
Res.max = function(a, b) {
  var arra = a.toArray();
  var arrb = b.toArray();
  var arr = [];
  for(var i = 0; i < arra.length; i++) {
    arr[i] = Num.max(arra[i], arrb[i]);
  }
  return Res.fromArray(arr);
};

// min of each individual resource
Res.min = function(a, b) {
  var arra = a.toArray();
  var arrb = b.toArray();
  var arr = [];
  for(var i = 0; i < arra.length; i++) {
    arr[i] = Num.min(arra[i], arrb[i]);
  }
  return Res.fromArray(arr);
};



// Sum of the resources
Res.prototype.sum = function() {
  var result = new Num(0);
  var arr = this.toArray();
  for(var i = 0; i < arr.length; i++) {
    result.addInPlace(arr[i]);
  }
  return result;
};

// Get some measure of progress of the player through value of resources
// Not very accurate, except during earlier stages of the game.
Res.prototype.weighedSum = function() {
  var result = new Num(0);
  var arr = this.toArray();
  var weight = new Num(1);
  for(var i = 0; i < arr.length; i++) {
    result.addInPlace(arr[i].mul(weight));
    weight.mulrInPlace(1000);
  }
  return result;
};

Res.prototype.toString = function(opt_precision, opt_notation) {
  var arr = this.toArray();
  var s = '';
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].neq(new Num(0))) {
      if(s.length > 0) s += ', ';
      s += arr[i].toString(opt_precision, opt_notation) + ' ' + resource_names[i];
    }
  }
  if(s == '') s = 'none';
  return s;
};

// like to String, but with /s unit for production per second
Res.prototype.toProdString = function() {
  var arr = this.toArray();
  var s = '';
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].neq(new Num(0))) {
      if(s.length > 0) s += ', ';
      s += arr[i].toString() + ' ' + resource_names[i] + '/s';
    }
  }
  if(s == '') s = 'none';
  return s;
};
