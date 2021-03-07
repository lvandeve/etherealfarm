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

// The resources object for the game



var resource_names = ['seeds', 'spores', 'resin', 'twigs', 'pericarps', 'mycelia', 'amber', 'essence'];

// Resources.
// o is object with optional fields with the same names as the resource fields of Res (and may have regular JS numbers or Num), or can be a Res itself
function Res(o) {
  // Allow calling it without new, but act like new
  if(!(this instanceof Res)) {
    return new Res(o);
  }

  if(!o) o = {};
  // create a new Num for each, so that addrInPlace can't accently affect source number objects
  this.seeds = Num(o.seeds || 0);
  this.spores = Num(o.spores || 0);
  this.resin = Num(o.resin || 0);
  this.twigs = Num(o.twigs || 0);
  this.seeds2 = Num(o.seeds2 || 0);
  this.spores2 = Num(o.spores2 || 0);
  this.amber = Num(o.amber || 0);
  this.essence = Num(o.essence || 0); // fruit essence
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
  return [this.seeds, this.spores, this.resin, this.twigs, this.seeds2, this.spores2, this.amber, this.essence];
};
Res.toArray = function(v) { return v.toArray(); }

Res.prototype.clone = function() {
  // Res.clone gets called a lot in computations of the game, and using util.clone is slow, so implemented manually here
  return new Res(this);
};

// in-place
Res.prototype.fromArray = function(a) {
  this.seeds = a[0] || Num(0);
  this.spores = a[1] || Num(0);
  this.resin = a[2] || Num(0);
  this.twigs = a[3] || Num(0);
  this.seeds2 = a[4] || Num(0);
  this.spores2 = a[5] || Num(0);
  this.amber = a[6] || Num(0);
  this.essence = a[7] || Num(0);
};
// not in-place
Res.fromArray = function(a) {
  var res = new Res();
  res.fromArray(a);
  return res;
};

//in-place
Res.prototype.reset = function() {
  this.mulrInPlace(0);
};

Res.prototype.addInPlace = function(b) {
  this.seeds.addInPlace(b.seeds);
  this.spores.addInPlace(b.spores);
  this.resin.addInPlace(b.resin);
  this.twigs.addInPlace(b.twigs);
  this.seeds2.addInPlace(b.seeds2);
  this.spores2.addInPlace(b.spores2);
  this.amber.addInPlace(b.amber);
  this.essence.addInPlace(b.essence);
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
  if(!(v instanceof Num)) v = Num(v);
  this.seeds.addInPlace(v);
  this.spores.addInPlace(v);
  this.resin.addInPlace(v);
  this.twigs.addInPlace(v);
  this.seeds2.addInPlace(v);
  this.spores2.addInPlace(v);
  this.amber.addInPlace(v);
  this.essence.addInPlace(v);
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
  this.seeds2.subInPlace(b.seeds2);
  this.spores2.subInPlace(b.spores2);
  this.amber.subInPlace(b.amber);
  this.essence.subInPlace(b.essence);
  return this;
};
Res.prototype.sub = function(b) {
  var res = Res(this);
  res.subInPlace(b);
  return res;
};
Res.sub = function(a, b) { return a.sub(b); };


// multiply with a Num.
Res.prototype.mulInPlace = function(v) {
  this.seeds.mulInPlace(v);
  this.spores.mulInPlace(v);
  this.resin.mulInPlace(v);
  this.twigs.mulInPlace(v);
  this.seeds2.mulInPlace(v);
  this.spores2.mulInPlace(v);
  this.amber.mulInPlace(v);
  this.essence.mulInPlace(v);
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
  return this.mulInPlace(Num(v));
};
Res.prototype.mulr = function(v) {
  return this.mul(Num(v));
};
Res.mulr = function(r, v) { return r.mul(Num(v)); };

// divide through a Num.
Res.prototype.divInPlace = function(v) {
  this.seeds.divInPlace(v);
  this.spores.divInPlace(v);
  this.resin.divInPlace(v);
  this.twigs.divInPlace(v);
  this.seeds2.divInPlace(v);
  this.spores2.divInPlace(v);
  this.amber.divInPlace(v);
  this.essence.divInPlace(v);
  return this;
};
Res.prototype.div = function(v) {
  var res = Res(this);
  res.divInPlace(v);
  return res;
};
Res.div = function(r, v) { return r.div(v); }
// divtiply with a regular JS number
Res.prototype.divrInPlace = function(v) {
  return this.divInPlace(Num(v));
};
Res.prototype.divr = function(v) {
  return this.div(Num(v));
};
Res.divr = function(r, v) { return r.div(Num(v)); };


// elementwise multiply with another resource.
Res.prototype.elmulInPlace = function(r) {
  this.seeds.mulInPlace(r.seeds);
  this.spores.mulInPlace(r.spores);
  this.resin.mulInPlace(r.resin);
  this.twigs.mulInPlace(r.twigs);
  this.seeds2.mulInPlace(r.seeds2);
  this.spores2.mulInPlace(r.spores2);
  this.amber.mulInPlace(r.amber);
  this.essence.mulInPlace(r.essence);
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
  var arr = this.toArray();
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].ger(0)) arr[i].mulInPlace(v);
  }
  this.fromArray(arr);
};
Res.prototype.posmul = function(v) {
  var res = Res(this);
  res.posmulInPlace(v);
  return res;
};
Res.posmul = function(r, v) { return r.posmul(v); }
Res.prototype.posmulrInPlace = function(v) {
  return this.posmulInPlace(Num(v));
};
Res.prototype.posmulr = function(v) {
  return this.posmul(Num(v));
};
Res.posmulr = function(r, v) { return r.posmul(Num(v)); };

// negmul: counterpart of posmul.
Res.prototype.negmulInPlace = function(v) {
  var arr = this.toArray();
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].ler(0)) arr[i].mulInPlace(v);
  }
  this.fromArray(arr);
};
Res.prototype.negmul = function(v) {
  var res = Res(this);
  res.negmulInPlace(v);
  return res;
};
Res.negmul = function(r, v) { return r.negmul(v); }
Res.prototype.negmulrInPlace = function(v) {
  return this.negmulInPlace(Num(v));
};
Res.prototype.negmulr = function(v) {
  return this.negmul(Num(v));
};
Res.negmulr = function(r, v) { return r.negmul(Num(v)); };

Res.prototype.eq = function(b) {
  if(!this.seeds.eq(b.seeds)) return false;
  if(!this.spores.eq(b.spores)) return false;
  if(!this.resin.eq(b.resin)) return false;
  if(!this.twigs.eq(b.twigs)) return false;
  if(!this.seeds2.eq(b.seeds2)) return false;
  if(!this.spores2.eq(b.spores2)) return false;
  if(!this.amber.eq(b.amber)) return false;
  if(!this.essence.eq(b.essence)) return false;
  return true;
};
Res.eq = function(a, b) { return a.eq(b); };

// greater than or equal for all resources
Res.prototype.ge = function(b) {
  if(!this.seeds.ge(b.seeds)) return false;
  if(!this.spores.ge(b.spores)) return false;
  if(!this.resin.ge(b.resin)) return false;
  if(!this.twigs.ge(b.twigs)) return false;
  if(!this.seeds2.ge(b.seeds2)) return false;
  if(!this.spores2.ge(b.spores2)) return false;
  if(!this.amber.ge(b.amber)) return false;
  if(!this.essence.ge(b.essence)) return false;
  return true;
};
Res.ge = function(a, b) { return a.ge(b); };

// lesser than or equal for all resources
Res.prototype.le = function(b) {
  if(!this.seeds.le(b.seeds)) return false;
  if(!this.spores.le(b.spores)) return false;
  if(!this.resin.le(b.resin)) return false;
  if(!this.twigs.le(b.twigs)) return false;
  if(!this.seeds2.le(b.seeds2)) return false;
  if(!this.spores2.le(b.spores2)) return false;
  if(!this.amber.le(b.amber)) return false;
  if(!this.essence.le(b.essence)) return false;
  return true;
};
Res.le = function(a, b) { return a.le(b); };

Res.prototype.neq = function(b) { return !this.eq(b); }
Res.neq = function(a, b) { return !Res.eq(a, b); }
Res.prototype.gt = function(b) { return !this.le(b); }
Res.gt = function(a, b) { return !Res.le(a, b); }
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


// returns whether the resources are empty
Res.prototype.empty = function() {
  var arr = this.toArray();
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].neqr(0)) return false;
  }
  return true;
};
Res.empty = function(a) { return a.empty(); };

// returns whether any resource is negative (any one, must not be all)
Res.prototype.hasNeg = function() {
  var arr = this.toArray();
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].ltr(0)) return true;
  }
  return false;
};
Res.hasNeg = function(a) { return a.hasNeg(); };

// Gets the negative resources, and then negated too (so all positive)
Res.prototype.getNegative = function() {
  var arr = this.toArray();
  var arr2 = [];
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].ltr(0)) arr2[i] = arr[i].neg();
    else arr2[i] = Num(0);
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
    if(b[i].neqr(0)) arr[i] = Num(a[i]);
    else arr[i] = Num(0);
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



// Get some measure of progress of the player through value of resources
// Not very accurate, except during earlier stages of the game.
Res.prototype.weighedSum = function() {
  var result = Num(0);
  var arr = this.toArray();
  var weight = Num(1);
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
    if(arr[i].neq(Num(0))) {
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
    if(arr[i].neq(Num(0))) {
      if(s.length > 0) s += ', ';
      s += arr[i].toString() + ' ' + resource_names[i] + '/s';
    }
  }
  if(s == '') s = 'none';
  return s;
};
