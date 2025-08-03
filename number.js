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

// Defines the number type, Num, for this incremental game: floating point with much bigger possible exponent.

/**
 * NOTE: while this supports very large numbers, there's a limit: max exponent is 9007199254740992, min exponent is -9007199254740992. But there is already visible precision loss here, so to be safe only use a factor 100 of that less as exponent.
 * performance notes:
 * -putting "new" in front is slightly faster than without
 * -giving a separate b and e is slower (because it then normalizes), than initializing to 0 or initializing with an existing Num.
 * @param {Num=|number=} b Num object to clone, or real number base. can be any float value, but typically scaled to 1..2 or -1..-2. Special values: 0: value is 0 no matter what exponent. Infinity/-Infinity/NaN: entire number is infinity/-infinity/nan, no matter what exponent
 * @param {number=} e exponent in binary, not decimal! always integer, max 2**53, min -2**53. Should never be set to non-integer, NaN, Infinity, ..., only base (b) may do that
 * @constructor
 */
function Num(b, e) {
  // Allow calling it without new, but act like new
  if(!(this instanceof Num)) {
    return new Num(b, e);
  }

  if(b instanceof(Num)) {
    this.b = b.b;
    this.e = b.e;
    // no scaleInPlace: assume the input Num already was correct, as it should
  } else if(b == undefined || (b == 0 && e == undefined)) {
    // value = b * 2**e
    this.b = 0;
    this.e = 0;
  } else {
    this.b = b;
    this.e = (e == undefined) ? 0 : e;
    Num.scaleInPlace(this);
  }
}

// constructor that takes decimal exponent, rather than binary like function Num does
// this function loses precision for very large exponents, do not give exponetns like 9007199254740992 to this one since double precision float loses too much precision for high values
// e is optional, if not given it's assumed to be 0
// e.g. Num.makeDecimal(3, 5) will return a number representing 3*10^5 = 300000
Num.makeDecimal = function(b, e) {
  if(e == undefined) e = 0;
  var e2 = e * log2_10;
  var ef = Math.floor(e2);
  var f = Math.pow(2, e2 - ef);
  b *= f;
  return new Num(b, ef);
};

Num.prototype.clone = function() {
  return new Num(this);
};

// reset to 0 without allocating new Num object
Num.prototype.reset = function() {
  this.b = 0;
  this.e = 0;
};

// Ensures that the exponent e is an integer within range -9007199254740992..9007199254740992,
// since that's the assumptions some functionalty makes
Num.prototype.ensureIntegerExponent_ = function() {
  if(this.e == 0) return; // optimization for this common case

  if(isNaN(this.e)) {
    this.b = NaN;
    this.e = 0;
    return;
  }

  if(this.e == Infinity) {
    if(this.b == 0) {
      this.b = NaN;
      this.e = 0;
      return;
    } else {
      this.b = this.b < 0 ? -Infinity : Infinity;
      this.e = 0;
      return;
    }
  }

  // at this point, the exponent can no longer distinguish successive integers, so no longer supported.
  if(this.e > 9007199254740992) {
    if(!isNaN(this.b)) this.b = (this.b == 0) ? 0 : (this.b < 0 ? -Infinity : Infinity);
    this.e = 0;
    return;
  }
  if(this.e < -9007199254740992) {
    if(!isNaN(this.b)) this.b = 0;
    this.e = 0;
    return;
  }

  //if(this.e != Math.floor(this.e) && !isNaN(this.e)) {
  if(!Number.isInteger(this.e)) {
    // e should be integer. E.g. the rpow function can cause this situation
    var e2 = Math.floor(this.e);
    this.b *= Math.pow(2, this.e - e2);
    this.e = e2;
  }
}

// scales exponent of this to become e
// NOTE: for best precision, e should be larger than this.e, that is, scale to the larger exponent. The opposite direction may cause infinity.
// NOTE: even more care needed, e.g. Num(5, -2000).add(Num(0, 0)) will fail if scaleToInPlace is used naively. So too eqr(0).
Num.prototype.scaleToInPlace = function(e) {
  if(this.b == 0) {
    this.e = e;
    return this;
  }

  this.ensureIntegerExponent_();

  var d = this.e - e;
  var t = 1 / 256.0;
  var u = 1 / 4294967296.0;

  if(d > 1023) {
    // value cannot be represented scaled to e, it's infinity compared to e
    this.e = e;
    this.b = Infinity;
    return this;
  }

  if(d < -1074) {
    // value cannot be represented scaled to e, it's 0 compared to e
    // NOTE: -1074, not -1023, due to denormalized floats
    this.e = e;
    this.b = 0;
    return this;
  }

  while(d >= 32) {
    d -= 32;
    this.e -= 32;
    this.b *= 4294967296;
  }
  while(d >= 8) {
    d -= 8;
    this.e -= 8;
    this.b *= 256;
  }
  while(d >= 1) {
    d -= 1;
    this.e -= 1;
    this.b *= 2;
  }
  while(d <= -32) {
    d += 32;
    this.e += 32;
    this.b *= u;
  }
  while(d <= -8) {
    d += 8;
    this.e += 8;
    this.b *= t;
  }
  while(d <= -1) {
    d += 1;
    this.e += 1;
    this.b *= 0.5;
  }
  return this;
};
// scales exponent of this to become e
Num.prototype.scaleTo = function(e) {
  var res = new Num(this);
  res.scaleToInPlace(e);
  return res;
};
Num.scaleTo = function(a, e) { return a.scaleTo(e); };

// sales the exponent in a good range for this number's value
Num.scaleInPlace = function(v) {
  // optimization, do this before v.ensureIntegerExponent_, for the common cases of value 0 or 1
  if(v.b == 0 && v.e <= 9007199254740992 && v.e >= -9007199254740992) {
    v.e = 0;
    return v;
  }
  if(v.b == 1 && v.e == 0) {
    return v;
  }

  v.ensureIntegerExponent_();
  if(v.b == 0 || v.b == Infinity || v.b == -Infinity || isNaN(v.b)) {
    v.e = 0;
    return v;
  }
  var neg = v.b < 0;
  if(neg) v.b = -v.b;
  var t = 1 / 256.0;
  var u = 1 / 4294967296.0;
  while(v.b <= u) {
    v.b *= 4294967296;
    v.e -= 32;
  }
  while(v.b <= t) {
    v.b *= 256;
    v.e -= 8;
  }
  while(v.b <= 0.5) {
    v.b *= 2;
    v.e--;
  }
  while(v.b >= 4294967296) {
    v.b *= u;
    v.e += 32;
  }
  while(v.b >= 256) {
    v.b *= t;
    v.e += 8;
  }
  while(v.b >= 2) {
    v.b *= 0.5;
    v.e++;
  }
  if(neg) v.b = -v.b;
  return v;
};
Num.prototype.scaleInPlace = function() {
  return Num.scaleInPlace(this);
};
/*
// commented out: not necessary: normally numbers keep themselves scaled, and only scaleInPlace is needed when manipulating b and e directly
Num.prototype.scale = function() {
  var res = new Num(this);
  res.scaleInPlace();
  return res;
};
Num.scale = function(a) { return a.scale(); };
*/

Num.prototype.addInPlace = function(b) {
  if(b.eqr(0)) return this; // avoid scaling in place to 0
  if(this.e > b.e) b = b.scaleTo(this.e); else this.scaleToInPlace(b.e);
  this.b += b.b;
  this.scaleInPlace();
  return this;
};
Num.prototype.add = function(b) {
  var res = new Num(this);
  res.addInPlace(b);
  return res;
};
Num.add = function(a, b) { return a.add(b); };

Num.prototype.addrInPlace = function(r) {
  return this.addInPlace(new Num(r));
};
Num.prototype.addr = function(r) {
  var res = new Num(this);
  res.addrInPlace(r);
  return res;
};
Num.add = function(a, r) { return a.add(r); };

//in place!
Num.prototype.inc = function() {
  this.addrInPlace(1);
};
//in place!
Num.prototype.dec = function() {
  this.subrInPlace(1);
};

Num.prototype.subInPlace = function(b) {
  if(b.eqr(0)) return this; // avoid scaling in place to 0
  if(this.e > b.e) b = b.scaleTo(this.e); else this.scaleToInPlace(b.e);
  this.b -= b.b;
  this.scaleInPlace();
  return this;
};
Num.prototype.sub = function(b) {
  var res = new Num(this);
  res.subInPlace(b);
  return res;
};
Num.sub = function(a, b) { return a.sub(b); };

Num.prototype.subrInPlace = function(r) {
  return this.subInPlace(new Num(r));
};
Num.prototype.subr = function(r) {
  var res = new Num(this);
  return res.subrInPlace(r);
};
Num.subr = function(a, r) { return a.subr(r); };

// rsub = inverted order (the first argument, Num, subtracted from the regular Number r)
// sets this to r - this
Num.prototype.rsubInPlace = function(r) {
  this.b = -this.b;
  return this.addrInPlace(r);
};
Num.prototype.rsub = function(r) {
  var res = new Num(this);
  return res.rsubInPlace(r);
};
Num.rsub = function(a, r) { return a.rsub(r); };

Num.prototype.negInPlace = function() {
  this.b = -this.b;
};
Num.prototype.neg = function() {
  var res = new Num(this);
  res.negInPlace();
  return res;
};
Num.neg = function(a) { return a.neg(); };

Num.prototype.mulInPlace = function(b) {
  this.b *= b.b;
  this.e += b.e;
  this.scaleInPlace();
};
Num.prototype.mul = function(b) {
  var res = new Num(this);
  res.mulInPlace(b);
  return res;
};
Num.mul = function(a, b) { return a.mul(b); };

Num.prototype.mulrInPlace = function(r) {
  this.b *= r;
  this.scaleInPlace();
  return this;
};
Num.prototype.mulr = function(r) {
  var res = new Num(this);
  res.mulrInPlace(r);
  return res;
};
Num.mul = function(a, r) { return a.mul(r); };



// posmul exists to have the same set of function names as Res (the resources
// object) has: this multiplies the current value with b only if the current
// value is positive. If the current value is negative, it's left unchanged.
Num.prototype.posmulInPlace = function(b) {
  if(this.ltr(0)) return this;
  this.b *= b.b;
  this.e += b.e;
  this.scaleInPlace();
  return this;
};
Num.prototype.posmul = function(b) {
  var res = new Num(this);
  res.posmulInPlace(b);
  return res;
};
Num.posmul = function(a, b) { return a.posmul(b); };

Num.prototype.posmulrInPlace = function(r) {
  if(this.ltr(0)) return this;
  this.b *= r;
  this.scaleInPlace();
  return this;
};
Num.prototype.posmulr = function(r) {
  var res = new Num(this);
  res.posmulrInPlace(r);
  return res;
};
Num.posmul = function(a, r) { return a.posmul(r); };




Num.prototype.divInPlace = function(b) {
  this.b /= b.b;
  this.e -= b.e;
  this.scaleInPlace();
  return this;
};
Num.prototype.div = function(b) {
  var res = new Num(this);
  res.divInPlace(b);
  return res;
};
Num.div = function(a, b) { return a.div(b); };

Num.prototype.inv = function() {
  var res = new Num(1);
  res.divInPlace(this);
  return res;
};

Num.prototype.divrInPlace = function(r) {
  this.b /= r;
  this.scaleInPlace();
  return this;
};
Num.prototype.divr = function(r) {
  var res = new Num(this);
  res.divrInPlace(r);
  return res;
};
Num.divr = function(a, r) { return a.divr(r); };

// rdiv: returns r / this, where r is a regular JS number
Num.prototype.rdivInPlace = function(r) {
  var res = Num(r);
  res.divInPlace(this);
  this.b = res.b;
  this.e = res.e;
  return this;
};
Num.prototype.rdiv = function(r) {
  var res = new Num(this);
  res.rdivInPlace(r);
  return res;
};
Num.rdiv = function(a, r) { return a.rdiv(r); };


Num.prototype.absInPlace = function() {
  if(this.b < 0) this.b = -this.b;
  return this;
};
Num.prototype.abs = function() {
  var res = new Num(this);
  res.absInPlace();
  return res;
};
Num.abs = function(a) { return a.abs(); };


Num.prototype.sqrtInPlace = function() {
  if(this.b < 0) {
    this.b = this.e = NaN;
    return this;
  }
  var e2 = this.e / 2;
  var e = Math.trunc(e2);
  var f = Math.pow(2, e2 - e);
  var b = Math.sqrt(this.b) * f;

  this.b = b;
  this.e = e;
  this.scaleInPlace();
  return this;
};
Num.prototype.sqrt = function() {
  var res = new Num(this);
  res.sqrtInPlace();
  return res;
};
Num.sqrt = function(a) { return a.sqrt(); };


// power to a regular JS number, r may not be of type Num, but standard JS Number
Num.prototype.powrInPlace = function(r) {
  if(this.b < 0 && r != Math.floor(r)) {
    this.b = this.e = NaN;
    return this;
  }
  return this.powInPlace(new Num(r));
};
Num.prototype.powr = function(r) {
  var res = new Num(this);
  res.powrInPlace(r);
  return res;
};
Num.powr = function(a, r) { return a.powr(r); };
Num.rpowr = function(a, b) { return Num(a).powr(b); };

// r ** this (aka r ^ this); r is regular JS number.
// Negative r is not supported
// NOTE: since r is a regular JS number, r only supports only up to JS float precision
// NOTE: the exponent itself of a Num still only has JS float precision, and using powers like this can easily bring you beyond that, so this function easily reaches the limits of Num.
Num.prototype.rpowInPlace = function(r) {
  if(r == 0) {
    if(this.gtr(0)) return new Num(0);
    if(this.ltr(0)) return new Num(Infinity);
    return new Num(1); // 0**0
  }
  this.scaleToInPlace(0);
  this.e = this.b;
  this.b = 1;
  if(r != 2) {
    var e = this.e * (Math.log(r) / ln_2);
    var e2 = Math.floor(e);
    this.e = e2;
    var f = Math.pow(2, e - e2);
    this.b *= f;
  }
  this.scaleInPlace();
  return this;
};
Num.prototype.rpow = function(r) {
  var res = new Num(this);
  res.rpowInPlace(r);
  return res;
};
Num.rpow = function(r, a) { return a.rpow(r); };

// Negative this not supported
// NOTE: Number can have big values but not unlimited, pow can very easily reach the limit. Use this function carefully.
Num.prototype.powInPlace = function(b) {
  if(this.eqr(0)) {
    if(b.gtr(0)) return new Num(0);
    if(b.ltr(0)) return new Num(Infinity);
    return new Num(1); // 0**0
  }
  var r = Num.rlog(this);
  var e = Num.exp(b.mulr(r));
  this.b = e.b;
  this.e = e.e;
  return this;
};
Num.prototype.pow = function(b) {
  var result = new Num(this);
  result.powInPlace(b);
  return result;
};
Num.pow = function(a, b) {
  return a.pow(b);
};

Num.prototype.expInPlace = function() {
  this.rpowInPlace(Math.E);
  return this;
};
Num.prototype.exp = function() {
  var res = new Num(this);
  res.expInPlace();
  return res;
};
Num.exp = function(a) { return a.exp(); }

// returned as regular JS number
Num.prototype.rlog2 = function() {
  var r = this.e;
  r += Math.log2(this.b);
  return r;
};
Num.rlog2 = function(a) { return a.rlog2(); }

Num.prototype.log2 = function() { return new Num(this.rlog2()); }
Num.log2 = function(a) { return new Num(a.rlog2()); }

// returned as regular JS number
Num.prototype.rlog10 = function() {
  var r = this.e * log10_2;
  r += Math.log10(this.b);
  return r;
};
Num.rlog10 = function(a) { return a.rlog10(); }

Num.prototype.log10 = function() { return new Num(this.rlog10()); }
Num.log10 = function(a) { return new Num(a.rlog10()); }

// natural logarithm (ln), returned as regular JS number
Num.prototype.rlog = function() {
  var r = this.e * ln_2;
  r += Math.log(this.b);
  return r;
};
Num.rlog = function(a) { return a.rlog(); }

Num.prototype.log = function() { return new Num(this.rlog()); }
Num.log = function(a) { return new Num(a.rlog()); }

// log with base r, returned as regular JS number and with r regular JS number
Num.prototype.rlogr = function(r) {
  var lr = 1 / Math.log(r);
  var res = this.e * ln_2 * lr;
  res += Math.log(this.b) * lr;
  return res;
};
Num.rlogr = function(a, r) { return a.rlogr(r); }

Num.prototype.gt = function(b) {
  if(b.eqr(0)) return this.b > 0 && !isNaN(this.e); // avoid scaling in place to 0
  if(this.eqr(0)) return b.b <= 0 && !isNaN(b.e); // avoid scaling in place to 0
  return this.b > b.scaleTo(this.e).b;
};
Num.gt = function(a, b) { return a.gt(b); };

Num.prototype.ge = function(b) {
  if(b.eqr(0)) return this.b >= 0 && !isNaN(this.e); // avoid scaling in place to 0
  if(this.eqr(0)) return b.b < 0 && !isNaN(b.e); // avoid scaling in place to 0
  return this.b >= b.scaleTo(this.e).b;
};
Num.ge = function(a, b) { return a.ge(b); };

Num.prototype.eq = function(b) {
  if(b.eqr(0)) return this.eqr(0); // avoid scaling in place to 0
  return this.b == b.scaleTo(this.e).b;
};
Num.eq = function(a, b) { return a.eq(b); };

Num.prototype.lt = function(b) {
  if(b.eqr(0)) return this.b < 0 && !isNaN(this.e); // avoid scaling in place to 0
  if(this.eqr(0)) return b.b >= 0 && !isNaN(b.e); // avoid scaling in place to 0
  return this.b < b.scaleTo(this.e).b;
}
Num.lt = function(a, b) { return a.lt(b); };

Num.prototype.le = function(b) {
  if(b.eqr(0)) return this.b <= 0 && !isNaN(this.e); // avoid scaling in place to 0
  if(this.eqr(0)) return b.b > 0 && !isNaN(b.e); // avoid scaling in place to 0
  return this.b <= b.scaleTo(this.e).b;
};
Num.le = function(a, b) { return a.le(b); };

Num.prototype.neq = function(b) { return !this.eq(b); };
Num.neq = function(a, b) { return a.neq(b); };

// equals regular JS number
Num.prototype.eqr = function(r) {
  if(r == 0) return this.b == 0; // avoid expensive scaling in place to 0 in this case
  return r == this.scaleTo(0).b;
};
Num.eqr = function(a, r) { return a.eqr(r); };
Num.prototype.neqr = function(r) {
  if(r == 0) return this.b != 0; // avoid expensive scaling in place to 0 in this case
  return r != this.scaleTo(0).b;
};
Num.neqr = function(a, r) { return a.neqr(r); };
Num.prototype.gtr = function(r) {
  if(r == 0) return this.b > 0; // avoid expensive scaling in place to 0 in this case
  return this.gt(new Num(r));
};
Num.gtr = function(a, r) { return a.gtr(r); };
Num.prototype.ger = function(r) {
  if(r == 0) return this.b >= 0; // avoid expensive scaling in place to 0 in this case
  return this.ge(new Num(r));
};
Num.ger = function(a, r) { return a.ger(r); };
Num.prototype.ltr = function(r) {
  if(r == 0) return this.b < 0; // avoid expensive scaling in place to 0 in this case
  return this.lt(new Num(r));
};
Num.ltr = function(a, r) { return a.ltr(r); };
Num.prototype.ler = function(r) {
  if(r == 0) return this.b <= 0; // avoid expensive scaling in place to 0 in this case
  return this.le(new Num(r));
};
Num.ler = function(a, r) { return a.ler(r); };

// synonyms
Num.prototype.lte = Num.prototype.le;
Num.lte = Num.le;
Num.prototype.lter = Num.prototype.ler;
Num.lter = Num.ler;
Num.prototype.gte = Num.prototype.ge;
Num.gte = Num.ge;
Num.prototype.gter = Num.prototype.ger;
Num.gter = Num.ger;

// Returns a copy of the min/max value, not the original object, so can use "in place" operations on original without affecting min/max result
Num.max = function(a, b) { return new Num(a.gt(b) ? a : b); }
Num.min = function(a, b) { return new Num(a.lt(b) ? a : b); }

// rel_eps is a regular JS number and represents how much a and b may differ, e.g. if rel_eps is 0.1 they may differ up to 10%
Num.prototype.near = function(b, rel_eps) {
  if(this.eqr(0) != b.eqr(0)) return false;
  if(this.gtr(0) != b.gtr(0)) return false;
  var d = this.mulr(rel_eps);
  if(b.lt(this.sub(d))) return false;
  if(b.gt(this.add(d))) return false;
  return true;
};
Num.near = function(a, b, rel_eps) {
  return a.near(b, rel_eps);
};

// Only b indicates NaN or Infinity, but for safety, e is also checked
Num.prototype.isNaN = function() { return isNaN(this.b) || isNaN(this.e); };
Num.isNaN = function(a) { return isNaN(a.b) || isNaN(a.e); };

Num.prototype.isInfinity = function() { return this.b == Infinity; };
Num.isInfinity = function(a) { return a.b == Infinity; };

Num.prototype.isNegInfinity = function() { return this.b == -Infinity; };
Num.isNegInfinity = function(a) { return a.b == -Infinity; };

// mostly for the result of invalid computations, so also exponent is checked in similar way
Num.prototype.isNaNOrInfinity = function() { return isNaN(this.b) || isNaN(this.e) || this.b == Infinity || this.e == Infinity || this.b == -Infinity || this.e == -Infinity; };
Num.isNaNOrInfinity = function(a) { return isNaN(a.b) || isNaN(a.e) || a.b == Infinity || a.e == Infinity || a.b == -Infinity || a.e == -Infinity; };

// return 1-2-5 sequence number with index i (i is regular JS number, 0 corresponds to return value 1)
// the sequence is 1, 2, 5, 10, 20, 50, 100, 200, 500, etc... [search key: 1,2,5,10,20,50]
Num.get125 = function(i) {
  var m = i % 3;
  var d = Math.floor(i / 3);
  var b = m == 0 ? 1 : (m == 1 ? 2 : 5);
  var mul = Num.rpow(10, new Num(d));
  return mul.mulr(b);
};


// for turning formula-based medal bonuses into more human looking ones: based on 10, 15, 20, 25, 35, 50, 75, 100.
// similar to 1-2-5 above but a bit more options like 35
Num.roundToNearestHumanNumber = function(v) {
  var l = Num.log10(v).valueOf();
  var f = Math.floor(l);
  var r = l - f;
  var result = Num.rpowr(10, f);
  // log10(8.75) is 0.942, border between 75% and 100%. Etc...
  if(r > 0.942) result.mulrInPlace(10);
  else if(r > 0.796) result.mulrInPlace(7.5);
  else if(r > 0.629) result.mulrInPlace(5);
  else if(r > 0.477) result.mulrInPlace(3.5);
  else if(r > 0.352) result.mulrInPlace(2.5);
  else if(r > 0.243) result.mulrInPlace(2);
  else if(r > 0.097) result.mulrInPlace(1.5);
  return result;
}

/*
rounds the base value to 6 bits of precision or to integer
the goal of this is the following:
Num.rpow(10, Num(1))
outputs:
Num {b: 1.2500000000000002, e: 3}
that the cost of a blackberry slightly higher than 10.
so if you then collect 10 resources, and try to plant one, it fails
so instead let the berry cost start at
Num.roundNicely(Num.rpow(10, Num(1)))
and it'll work perfectly.
*/
Num.roundNicely = function(num) {
  var res = new Num(num);
  // This should at least support values like 1000, 1.25, 1000000000, ..., but to remove the .0000...00002 of 1.2500000000000002 can't support very large integer either
  res.b = Math.round(num.b * 2147483648) / 2147483648;
  res.scaleInPlace();
  return res;
}

var log10_2 = 0.30102999566398114; // ln(2) / ln(10) = log10(2)
var log2_10 = 1 / log10_2; // ln(10) / ln(2) - log2(10)
var ln_2 = 0.6931471805599453; // ln(2)

Num.N_Names = []; // names of the notations
Num.N_Help = []; // help of the notations

var n_i = 0;
Num.N_LATIN = n_i; Num.N_Names[n_i] = 'latin suffixes'; Num.N_Help[n_i] = 'Latin suffixes for large numbers, such as T for trillion, Qa for quadrillion, V for vigintillion, ...'; n_i++; // abbreviation if available, else engineering, also full if fits in #digits precision: most human-like notation
Num.N_HYBRID_T = n_i; Num.N_Names[n_i] = 'suffixes up to T, then eng'; Num.N_Help[n_i] = 'Latin suffixes, but only up to T (trillion, 1e12), then switches to engineering notation'; n_i++;
Num.N_HYBRID_U = n_i; Num.N_Names[n_i] = 'suffixes up to U, then eng'; Num.N_Help[n_i] = 'Latin suffixes, but only up to U (undecillion, 1e36), then switches to engineering notation'; n_i++; // a later version of hybrid
Num.N_SI = n_i; Num.N_Names[n_i] = 'suffixes SI'; Num.N_Help[n_i] = 'SI suffixes, such as K for kilo (1000), G for giga (1e9), up to Y for yotta (1e24). For larger numbers switches to engineering notation'; n_i++; // using the SI prefixes K,M,G,T,P,E,Z,Y, then engineering
Num.N_ABC = n_i; Num.N_Names[n_i] = 'suffixes abc'; Num.N_Help[n_i] = 'abc suffixes, 1a for 1000, 1b for 1000000, 1aa for 1e81, etc...'; n_i++; // using the SI prefixes K,M,G,T,P,E,Z,Y, then engineering
Num.N_ENG = n_i; Num.N_Names[n_i] = 'engineering'; Num.N_Help[n_i] = 'Use exponent notation, and the exponents are always multiples of 3. E.g. 10e6 for 10 million'; n_i++; // strict engineering notation
Num.N_SCI = n_i; Num.N_Names[n_i] = 'scientific'; Num.N_Help[n_i] = 'Always uses exponents, such as 2e4 for 20000 (4 zeroes)'; n_i++; // strictly scientific notation, with base in range 1..10 (not 0..1)
Num.N_LOG = n_i; Num.N_Names[n_i] = 'logarithm'; Num.N_Help[n_i] = 'Uses the base-10 logarithm'; n_i++; // exponential notation (not to be confused with scientific): 10^log10(number)
Num.N_EXP = n_i; Num.N_Names[n_i] = 'natural'; Num.N_Help[n_i] = 'Uses the natural logarithm with e = 2.71828...'; n_i++; // exponential notation (not to be confused with scientific): e^ln(number)
Num.N_HEX = n_i; Num.N_Names[n_i] = 'hexadecimal'; Num.N_Help[n_i] = 'Uses base 16'; n_i++; // hex notation with hex exponent (but otherwise behaves like scientific or engineering)
Num.N_FULL = n_i; Num.N_Names[n_i] = 'full'; Num.N_Help[n_i] = 'Prints value with all digits, switches to scientific once unreasonably big'; n_i++;
Num.N_HYBRID_T_SCI = n_i; Num.N_Names[n_i] = 'suffixes up to T, then sci'; Num.N_Help[n_i] = 'Latin suffixes, but only up to T (trillion, 1e12), then switches to scientific notation'; n_i++;
Num.N_HYBRID_U_SCI = n_i; Num.N_Names[n_i] = 'suffixes up to U, then sci'; Num.N_Help[n_i] = 'Latin suffixes, but only up to U (undecillion, 1e36), then switches to scientific notation'; n_i++; // a later version of hybrid
Num.N_SI_SCI = n_i; Num.N_Names[n_i] = 'suffixes SI'; Num.N_Help[n_i] = 'SI suffixes, such as K for kilo (1000), G for giga (1e9), up to Y for yotta (1e24). For larger numbers switches to scientific notation'; n_i++; // using the SI prefixes K,M,G,T,P,E,Z,Y, then engineering
Num.N_Amount = n_i; // amount of notations

// The settings for toString if none given to the parameters, changeable as user option
Num.notation = Num.N_LATIN;
Num.precision = 3;



// units when standalone
var suffix_units0 = [
  'K', // thousand, e3, latin 0
  'M', // million, e6, latin 1
  'B', // billion, e9, latin 2
  'T', // trillion, e12, latin 3
  'Qa', // quadrillion, e15, latin 4
  'Qi', // quintillion, e18, latin 5
  'Sx', // sextillion, e21, latin 6
  'Sp', // septillion, e24, latin 7
  'Oc', // octillion, e27, latin 8 --> has the c since O is confusable with digit 0
  'N', // nonillion, e30, latin 9
];

// units when not standalone, but after a C, an Mi, ...
var suffix_units1 = [
  '',
  'U', // un, latin 1
  'Du', // duo, latin 2 --> disambiguated with De (deca, 10)
  'T', // trillion, e12, latin 3
  'Qa', // quadrillion, e15, latin 4
  'Qi', // quintillion, e18, latin 5
  'Sx', // sextillion, e21, latin 6
  'Sp', // septillion, e24, latin 7
  'Oc', // octillion, e27, latin 8 --> has the c since O is confusable with digit 0
  'N', // nonillion, e30, latin 9
];

// units when in front of a ten
var suffix_units10 = [
  '',
  'U', // un, latin 1 --> NOTE: when this is prefix of D, so we form UD (for latin 11), we turn it into just U because it's still unique at that poitn
  'D', // duo, latin 2 --> not Du since not confusable with deca when in front of a ten
  'T', // tre, latin 3
  'Qa', // quattr/quadr, latin 4
  'Qi', // quin, latin 5
  'Sx', // sex, latin 6
  'Sp', // sept, latin 7
  'Oc', // oct, latin 8 --> has the c since O is confusable with digit 0
  'N', // non, latin 9
];


// the tens, when standalone
var suffix_tens0 = [
  '',
  'D', // decillion, e33, latin 10, unique letter so far so doesn't need g or e behind it, and not confusable with Duo when standalone
  'V', // vigintillion, e63, latin 20, unique letter so far so doesn't need the g behind it
  'Tg', // trigintillion, e93, latin 30
  'Qr', // quadragintillion, e123, latin 40 --> not Qag to avoid *three* letterw which is a bit much
  'Qq', // quinquagintillion, e153, latin 50
  'Sa', // sexagintillion, e183, latin 60
  'Su', // septuagintillion, e213, latin 70
  'Oa', // octagintillion, e243, latin 80 --> not Og, to avoid collision with OG for units_cent when case is ignored
  'Na', // nonagintillion, e273, latin 90 --> not Ng, to avoid collision with NG for units_cent when case is ignored
];


// the tens, when after C, Mi, ...
var suffix_tens1 = [
  '',
  'De', // decillion, e33, latin 10, --> the e is to disambiguate from Du (duo, 2)
  'V', // vigintillion, e63, latin 20, unique letter so far so doesn't need the g behind it
  'Tg', // trigintillion, e93, latin 30
  'Qr', // quadragintillion, e123, latin 40 --> not Qag to avoid *three* letters which is a bit much, not Qa to avoid collision with suffix_units
  'Qq', // quinquagintillion, e153, latin 50
  'Sa', // sexagintillion, e183, latin 60
  'Su', // septuagintillion, e213, latin 70
  'Oa', // octagintillion, e243, latin 80 --> not Og, to avoid collision with OG for units_cent when case is ignored
  'Na', // nonagintillion, e273, latin 90 --> not Ng, to avoid collision with NG for units_cent when case is ignored
];



// Note how some have 'C', others 'G' due to how the names are (C from cen, G from gen)
var units_cents = [
  '',
  'C', // centillion, e303, latin 100
  'DC', // duocentillion, e603, latin 200
  'TC', // trecentillion, e903, latin 300
  'QC', // quadringentillion, e1203, latin 400 --> here I let the C/G disambiguate between Qa qnd Qi. Trying to keep this 2 instead of 3 characters...
  'QG', // quingentillion, e1503, latin 500
  'SC', // sescentillion, e1803, latin 600 --> here at least the C makes more sense, given the name...
  'SG', // septingentillion, e2103, latin 700
  'OG', // octingentillion, e2403, latin 800
  'NG', // nongentillion, e2703, latin 900
];

// the suffixes for 0-999 (as latin number, exponent is 3+3*that), up to right before millillion that is
var suffixes = [];
// the suffixes for what comes after the Mi for 1000-1999, as well as all higher values for anything after the last Mi or sandwiched between two Mi's
// same size as suffixes (that is, 1000 elements), but for appending to Mi, some of the first entries differ (e.g. K and B become Du and T instead)
var millsuffixes = [];
// the prefixes before the first Mi for values larger than 1999
// exactly the same except the single 'U' is replaced by '' because 1-thousand is to be shown as Mi, not as UMi. But thousand-and-one is MiU (with the U from millsuffixes).
var millprefixes = [];

function preparePrefixes() {
  for(var c = 0; c < 10; c++) {
    for(var d = 0; d < 10; d++) {
      for(var u = 0; u < 10; u++) {
        // the order is: hundreds, units, ten!
        var s = units_cents[c];
        s += (c == 0 && d == 0) ? suffix_units0[u] : (c == 0 ? suffix_units10[u] : suffix_units1[u]);
        if(!(c == 0 && u == 1 && d == 1)) s += (c == 0 ? suffix_tens0[d] : suffix_tens1[d]); // UD becomes just U because unique
        suffixes.push(s);
      }
    }
  }

  for(var c = 0; c < 10; c++) {
    for(var d = 0; d < 10; d++) {
      for(var u = 0; u < 10; u++) {
        // the order is: hundreds, units, ten!
        var s = units_cents[c];
        s += (d == 0) ? suffix_units1[u] : suffix_units10[u];
        // disambiguation with De is needed in all cases except if there's some unit value in front of the D
        s += (u == 0) ? suffix_tens1[d] : suffix_tens0[d];
        millsuffixes.push(s);
        millprefixes.push(s == 'U' ? '' : s);
      }
    }
  }
}

preparePrefixes();

// here e is the actual latin number represented, e.g. 100 for Centum
function getLatinSuffixV(e) {
  if(e < 0) return undefined;
  if(e == Infinity) return undefined;


  if(e < 1000) return suffixes[e];

  var result = millsuffixes[e % 1000];
  while(e) {
    e = Math.floor(e / 1000);
    if(!e) break;
    result = (e < 1000 ? millprefixes : millsuffixes)[e % 1000] + 'Mi' + result;
  }
  return result;
}

// exponent e must be multiple of 3
// returns undefined if out of range
function getLatinSuffix(e) {
  if(e < 3) return undefined;
  return getLatinSuffixV(Math.floor(e / 3) - 1);
}

var suffixes_inv = undefined;
var suffixes_inv2 = undefined;

// parses latin suffixes such as 'M', 'Qi' and 'DuMiMiC'. Case-insensitive. Returns the latin value itself, e.g. 100 for 'C'
function parseLatinSuffixV(s) {
  if(!s) return -1; // since 'K' represents 0, no suffix is below that, so -1
  s = s.toLowerCase();
  if(!suffixes_inv) {
    suffixes_inv = {};
    for(var i = 0; i < suffixes.length; i++) {
      suffixes_inv[suffixes[i].toLowerCase()] = i;
      //if(suffixes[i].length == 1) suffixes_inv[suffixes[i].toLowerCase()] = i;
    }
  }

  var r = suffixes_inv[s];
  if(r != undefined) return r;

  if(!suffixes_inv2) {
    suffixes_inv2 = [];
    suffixes_inv2[1] = {};
    suffixes_inv2[2] = {};
    suffixes_inv2[3] = {};
    suffixes_inv2[4] = {};
    suffixes_inv2[5] = {};
    suffixes_inv2[6] = {};
    for(var i = 1; i < millsuffixes.length; i++) {
      suffixes_inv2[millsuffixes[i].length][millsuffixes[i].toLowerCase()] = i;
    }
    suffixes_inv2[2]['mi'] = 0;
  }

  var mul = 1;
  var result = 0;
  var mi = false;
  var first = true;

  for(;;) {
    var found = false;
    for(var j = 6; j >= 1; j--) {
      if(s.length < j) continue;
      var suffix = s.substr(s.length - j);
      var exp = suffixes_inv2[j][suffix];
      if(exp != undefined) {
        found = true;
        if(j == 2 && suffix == 'mi') {
          mul *= 1000;
          mi = true;
        } else {
          result += exp * mul;
          if(!first && !mi) return -1; // invalid, all must be separated by Mi
          mi = false;
        }
        s = s.substr(0, s.length - j);
        first = false;
        break;
      }
    }

    if(!found) return -1;
    if(s.length == 0) break;
  }

  if(mi) result += mul;


  return result;
}


// supports plain, scientific, engineering and latin notations.
Num.parse = function(text) {
  var isDigit = function(c) {
    c = c.charCodeAt(0);
    return c >= 48 && c <= 57;
  };
  var isDigitOrSign = function(c) {
    return c == '-' || c == '+' || isDigit(c);
  };
  var isDigitOrSymbol = function(c) {
    return c == '.' || isDigitOrSign(c);
  };
  var l = text.toLowerCase();
  if(l == 'inf' || l == 'infinity') return new Num(Infinity, 0);
  if(l == '-inf' || l == '-infinity') return new Num(-Infinity, 0);
  if(l == 'nan') return new Num(NaN, 0);
  var e = text.indexOf('e');
  if(e < 0) e = text.indexOf('E');
  if(e > 0 && e + 1 < text.length && isDigitOrSign(text[e + 1])) {
    var base = parseFloat(text.substr(0, e));
    var exp = parseFloat(text.substr(e + 1));
    if(exp != exp || exp == -Infinity) exp = 0;
    return Num.makeDecimal(base, exp);
  } else {
    var end = 0;
    while(end < text.length && isDigitOrSymbol(text[end])) end++;
    if(end == text.length) {
      var f = parseFloat(text);
      return new Num(f);
    } else {
      var base = parseFloat(text.substr(0, end));
      var suffix = text.substr(end);
      var p = parseLatinSuffixV(suffix);
      if(p < 0) return new Num(NaN);
      var exp = (p + 1) * 3;
      return Num.makeDecimal(base, exp);
    }
  }
}



// get Abc notation for numeric value that the exponent represents (so exponent / 3); this uses the same notation as excel rows, with v the row index, starting from 1
// this is almost like base-26 with a-z, but there is an important difference:
// unlike normal numeric bases where 0 is the same as 00 and so on, here a is different than aa, and to reprecent decimal 0, use empty string
// a-z mean [1..26], so to turn into decimal, multiply positinally with 26^position, but a is 1 isntead of 0, etc...
function getSuffixAbcV(v) {
  if(v < 0) return undefined;
  var result = '';
  while(v) {
    result = String.fromCharCode('a'.charCodeAt(0) + ((v - 1) % 26)) + result;
    v = Math.floor((v - 1) / 26);
  }
  return result;
}

function getSuffixAbc(e) {
  return getSuffixAbcV(Math.floor(e / 3));
}

/**
 * scientific notation (exponent for any power of 10).
 * eng instead forces exponent to be multiple of 3 and will, unlike scientific, not show exponent if it's 0
 * eng can be boolean (false, true) or a value like 3, 4. for pure scientific, set to 0 or false.
 * @param {number=} opt_base optional base other than 10
 */
Num.notationSci = function(v, precision, eng, opt_base) {
  var orig_precision = precision;
  precision--; // this is because there's also one digit in front of the point

  if(v.b < 0) return '-' + Num.notationSci(v.neg(), precision, eng, opt_base);
  if(isNaN(v.b)) return 'NaN';
  if(v.b == Infinity) return 'Inf';
  if(v.b == 0) return '0';

  if(v.gtr(1e-6)) { // smallValueNotation doesn't support smaller than that either
    if(v.ltr(1)) {
      return Num.smallValueNotation(v, orig_precision);
    }
    if(v.ltr(10000) && orig_precision >= 3) {
      return Num.smallValueNotation(v, orig_precision);
    }
  }

  if(eng) eng = (eng < 3 ? 3 : (eng > 8 ? 8 : eng));
  var base = opt_base || 10;
  var l = (base == 10) ? log10_2 : (ln_2 / Math.log(base));

  var e_orig = v.e * l;

  var e = Math.floor(v.abs().rlogr(base));

  var b = v.b * Math.pow(base, e_orig - e);

  // the goal (for e.g. base 10) is to bring b in the range [1..10). But actually, range [0.9999..9.999) because 0.999 will round to 1, and 9.999 would round to 10 which we don't want displayed
  // this checks not just b >= base, but also that when rounded to the fixed precision, it'll not display as base
  if(b + Math.pow(base, -precision) >= base) {
    b /= base;
    e++;
  } else if(b + Math.pow(base, -precision - 1) < 1) {
    b *= base;
    e--;
  }

  // For values in range 0.1-0.999..., show them as-is without scientific notation.
  if(e == -1) {
    e++;
    precision++;
    b /= base;
  }

  if(eng) {
    while(e % eng != 0) {
      b *= base;
      e--;
      precision--; // since this adds one more digit before the point
    }
    // For values in range 0.001-0.999..., show them as-is without scientific notation
    while(e >= -eng && e < 0) {
      e++;
      precision++;
      b /= base;
    }
  }

  // even for sci notation, show the cases that would be e1 or e2 directly anyway, 10 looks better than 1e1
  while(e >= 1 && e <= 2) {
    e--;
    precision--;
    b *= base;
  }

  var fixed = precision;
  if(fixed < 0) fixed = 0; // e.g. if precision was 3 but eng was 4 in hex, this can happen
  var s;
  if(base == 10) {
    s = b.toFixed(fixed);
  } else {
    s = b.toString(base).toUpperCase();
    var i = s.indexOf('.');
    if(i >= 0) s = s.substr(0, i + fixed + 1);
  }
  if(s.indexOf('.') != -1) {
    while(s[s.length - 1] == '0') s = s.substr(0, s.length - 1);
    if(s[s.length - 1] == '.') s = s.substr(0, s.length - 1);
  }
  if(e != 0) s += (base == 10 ? 'e' : 'p') + e;
  var result = s;


  return result;
};

// intended for positive values in range 1e-6 to 1, to avoid showing something like 200e-6, instead show 0.0002
// can also be used for values below 10000, e.g. to display 3500 instead of 3.5e3, but still take precision into account in a more limited way than scientific notation does
// some examples of expected results:
// Num.smallValueNotation(Num(0.1), 3): 0.1
// Num.smallValueNotation(Num(0.009777), 3): 0.00978
Num.smallValueNotation = function(v, precision) {
  // the 1.0000000001 is so that e.g. 0.00999999999 will show up as 0.01 instead. TODO: use better method for this
  //v = v.valueOf() * 1.0000000001;

  v = v.valueOf();

  // The correction added ensures that e.g. 201.6 with precision 3 will show up as 202, not 201 (correct rounding of the digits)
  var l = Math.floor(Math.log10(v));
  if(l < precision) {
    v += (Math.pow(0.1, precision - l)) * 4.999; // 4.999 instead of 5, otherwise 0.1 gets rendered as 0.101
  } else {
    // this one is e.g. to make 1000.6 at precision 3 become 1001. This is ignoring the precision since that's 4 digits (one of the things smallValueNotation specifically does), hence the different formula
    v += 0.4999;
  }


  var result;
  if(v < 1 && precision > 0 && precision < 100) { // the 1-100 range is to prevent JS throwing range error for toPrecision
    result = v.toPrecision(precision);
  } else {
    result = v.toString();
  }

  // limit it to the desired precision
  // remove trailing zeroes, otherwise e.g. Num(0.001).toString(5, Num.N_SCI) shows up as 0.00100, which we do NOT want, the precision flag is not about showing that many trailing zeroes
  var dotpos = result.indexOf('.');
  if(dotpos >= 0) {
    var epos = result.indexOf('e');
    if(epos >= 0) return result; // the toPrecision used scientific notation, don't trim that now. Note that this function isn't intended for values below 1e-6 anyway
    var keep = Math.max(dotpos, precision + 1); // keep up to requested precision
    if(v < 1) keep = result.length; // for number below 1, the JS toPrecision function above already did what we want more correctly (e.g. Num.smallValueNotation(Num(0.009777), 3) should output 0.00978, not be trimmed to 0.009)
    while(keep > dotpos && result[keep - 1] == '0') keep--; // don't keep trailing zeros
    if(keep == dotpos + 1) keep--; // remove dot itself if nothing after dot kept
    result = result.substr(0, keep);
  }
  return result;
}

// abbreviations like K, M, ..., and also engineering notation after that
// also less strict: for small enough numbers (or large enough if between 0 and 1), uses regular notation, no suffixes at all
// so this notation is more human-like and only becomes engineering notation when necessary
// suffixtype: 0: a few: up to U, 1: all including centillion etc..., 2: SI symbols (M,G,T,P,E,Z,Y), 3: like 0 but even less: up to T, 4: abc notation
// opt_sci: in case of hybrid, use scientific rather than engineering notation for the non-abbreviation
// NOTE: uses short scale, not long scale.
Num.notationAbr = function(v, precision, suffixtype, opt_sci) {
  if(v.b < 0) return '-' + Num.notationAbr(v.neg(), precision, suffixtype, opt_sci);
  if(isNaN(v.b)) return 'NaN';
  if(v.b == Infinity) return 'Inf';
  if(v.b == 0) return '0';

  if(v.gtr(1e-6)) { // smallValueNotation doesn't support smaller than that either
    if(v.ltr(1)) {
      return Num.smallValueNotation(v, precision);
    }
    if(v.ltr(10000) && precision >= 3) {
      return Num.smallValueNotation(v, precision);
    }
  }

  var e = v.e * log10_2;
  var e2 = v.abs().rlog10();
  // we take the floor of e2 to determine amount of digits, but due to numerical imprecision, e.g. Num(1000).rlog10() = 2.9999999999999996. Fix that here.
  if(e2 > 0) e2 += Math.pow(10, -e2 - 1);
  var b = v.b;
  var result = '';

  var ef = (Math.floor(e2 / 3) * 3);

  // if the amount of digits is smaller than the precision, then don't use any exponent notation at all, for the "human-like" notation
  // e.g. if we allow 5 digits, then print 99999 instead of 99.999K
  if(e2 < precision && e2 >= 0) ef = 0;
  // for numbers smaller than 1, do not immediately use scientific notation either
  if(e2 >= -3 && e2 < 0) {
    precision += (-Math.floor(e2)); // the "0." and preceding 0's don't count
    ef = 0;
  }

  var f = Math.pow(10, e - ef);
  b *= f;

  if(e <= 0) {
    var s = '' + (b * 1.0000000001); // the 1.0000000001 is so that e.g. 0.00999999999 will show up as 0.01 instead. TODO: use better method for this
    s = s.substr(0, precision + 1); // +1 due to the decimal point
    if(s.indexOf('.') != -1) {
      while(s[s.length - 1] == '0') s = s.substr(0, s.length - 1);
      if(s[s.length - 1] == '.') s = s.substr(0, s.length - 1);
    }
    if(ef != 0) s += 'e' + ef;
    result = s;
  } else {
    // TODO: very sometimes it can happen that e.g something that should be displayed as e.g. 1mNSg instead becomes 1000mOSg
    // the goal (for e.g. base 10) is to bring b in the range [1..1000). But actually, range [0.9999..999.999) because 0.999 will round to 1, and 999.999 would round to 1000 which we don't want displayed
    // this checks not just b >= base, but also that when rounded to the fixed precision, it'll not display as base
    if(b + Math.pow(10, -precision + 2) >= 1000) {
      b /= 1000;
      ef += 3;
      e += 3;
    } else if(b + Math.pow(10, -precision - 1) < 1) {
      b *= 1000;
      ef -= 3;
      e -= 3;
    }


    var fixed = precision - 1;
    if(b >= 10) fixed--;
    if(b >= 100) fixed--;
    if(b >= 1000) fixed--; // can occur if e2 < precision for notation == Num.N_LATIN
    if(b >= 10000) fixed--; // idem. TODO: more is also possible if that happens with precision > 5, generalize this.
    if(fixed < 0) fixed = 0;
    var s = b.toFixed(fixed);
    if(s.indexOf('.') != -1) {
      // remove superfluous zeroes
      while(s[s.length - 1] == '0') s = s.substr(0, s.length - 1);
      if(s[s.length - 1] == '.') s = s.substr(0, s.length - 1);
    }
    if(s == '1000') {
      // this can happen if the value was e.g. 999.999, and so it rounded up to a value needing the next suffix
      s = '1';
      b /= 1000;
      e += 3;
      ef += 3;
    }

    if(ef != 0) {
      if(suffixtype == 0) {
        // use letter up to U
        if(ef <= 36) {
          s += getLatinSuffix(ef);
        } else {
          return Num.notationSci(v, precision, !opt_sci);
        }
      } else if(suffixtype == 1) {
        var suffix = getLatinSuffix(ef);
        if(suffix != undefined) {
          s += suffix;
        } else {
          s += 'e' + ef;
        }
      } else if(suffixtype == 2) {
        if(ef == 3) s += 'K'; // kilo
        else if(ef == 6) s += 'M'; // mega
        else if(ef == 9) s += 'G'; // giga
        else if(ef == 12) s += 'T'; // tera
        else if(ef == 15) s += 'P'; // peta
        else if(ef == 18) s += 'E'; // exa
        else if(ef == 21) s += 'Z'; // zetta
        else if(ef == 24) s += 'Y'; // yotta
        else return Num.notationSci(v, precision, !opt_sci);
      } else if(suffixtype == 3) {
        // use letter up to T
        if(ef <= 12) {
          s += getLatinSuffix(ef);
        } else {
          return Num.notationSci(v, precision, !opt_sci);
        }
      } else {
        var suffix = getSuffixAbc(ef);
        if(suffix != undefined) {
          s += suffix;
        } else {
          return Num.notationSci(v, precision, !opt_sci);
        }
      }
    }
    result = s;
  }
  return result;
};

// binary
Num.notationBin = function(v, precision) {
  if(v.b < 0) return '-' + Num.notationBin(v.neg(), precision);
  if(isNaN(v.b)) return 'NaN';
  if(v.b == Infinity) return 'Inf';
  if(v.b == 0) return '0';

  var s = v.b.toString(2);
  precision = Math.floor(precision * 3.321928094887362); // translate decimal precision to binary
  precision--; // we already get a 1 for free before the point
  if(v.b < 0) precision++;
  s = s.substr(0, precision + 2);
  return s + 'p' + v.e.toString(2);
};

// base-10 logarithm based
Num.notationLog10 = function(v, precision) {
  if(v.b < 0) return '-' + Num.notationLog10(v.neg(), precision);
  if(isNaN(v.b)) return '10^NaN';
  if(v.b == Infinity) return '10^Inf';
  if(v.b == 0) return '0'; //in theory this is '10^-Inf' but 0 is good enough and more readable

  var l = Num.rlog10(v);
  precision--;
  if(l >= 10) precision--;
  if(l >= 100) precision--;
  if(l >= 1000) precision--;
  if(l >= 10000) precision--;
  if(l >= 100000) precision--;
  if(precision < 0) precision = 0;
  return '10^' + l.toFixed(precision);
};

// exponential (as in, using e^, not to be confused with scientific or engineering notation)
Num.notationLn = function(v, precision) {
  if(v.b < 0) return '-' + Num.notationLn(v.neg(), precision);
  if(isNaN(v.b)) return 'e^NaN';
  if(v.b == Infinity) return 'e^Inf';
  if(v.b == 0) return '0'; //in theory this is 'e^-Inf' but 0 is good enough and more readable

  var l = Num.rlog(v);
  precision--;
  if(l >= 10) precision--;
  if(l >= 100) precision--;
  if(l >= 1000) precision--;
  if(l >= 10000) precision--;
  if(l >= 100000) precision--;
  if(precision < 0) precision = 0;
  return 'e^' + l.toFixed(precision);
};

// precision here is amount of digits after the decimal point
Num.notationFull = function(v, precision) {
  if(v.ltr(0)) return '-' + Num.notationFull(v.neg(), precision);

  // JavaScript toFixed starts using scientific notation above 1e20, so don't do that, use our own sci notation renderer above this
  var toobig = v.gtr(1e20);

  // TODO: for small numbers, it would be good if it had precision non-zero digits, e.g. 0.0000123 for precision 3
  var toosmall = false;
  if(v.ltr(1)) {
    var d = Math.pow(10, -precision);
    if(v.ltr(d)) toosmall = true;
  }


  if(!toobig && !toosmall) {
    var result = v.valueOf().toFixed(precision);
    if(precision > 0) {
      // remove unneeded .0000
      var len = result.length;
      for(;;) {
        var c = result[len - 1];
        if(c != '0' && c != '.') break;
        len--;
        if(c == '.') break;
      }
      result = result.substr(0, len);
    }
    return result;
  }

  return Num.notationSci(v, precision, false);
};

/**
 * @param {number=} opt_precision amount of digits rendered before the exponent, e.g. precision of 2 could give 1.5. Should be at least 3 to be useable with engineering (and letter abbreviation) notation.
 * @param {number=} opt_notation notation to use
 */
Num.prototype.toString = function(opt_precision, opt_notation) {
  // TODO: for some (or all) notations, 0.29999999 outputs 0.299 (for e.g. 3-digit precision) instead of 0.3 or 0.300, it should correctly round removed digits
  var precision = opt_precision || Num.precision;
  var notation = (opt_notation == undefined) ? Num.notation : opt_notation;
  //if(precision < 3) precision = 3;

  if(notation == Num.N_LATIN) return Num.notationAbr(this, precision, 1);
  if(notation == Num.N_HYBRID_U) return Num.notationAbr(this, precision, 0);
  if(notation == Num.N_HYBRID_T) return Num.notationAbr(this, precision, 3);
  if(notation == Num.N_HYBRID_U_SCI) return Num.notationAbr(this, precision, 0, true);
  if(notation == Num.N_HYBRID_T_SCI) return Num.notationAbr(this, precision, 3, true);
  if(notation == Num.N_SCI) return Num.notationSci(this, precision, false);
  if(notation == Num.N_ENG) return Num.notationSci(this, precision, true);
  if(notation == Num.N_SI) return Num.notationAbr(this, precision, 2);
  if(notation == Num.N_ABC) return Num.notationAbr(this, precision, 4);
  if(notation == Num.N_HEX) return '#' + Num.notationSci(this, precision, 4, 16);
  if(notation == Num.N_LOG) return Num.notationLog10(this, precision);
  if(notation == Num.N_EXP) return Num.notationLn(this, precision);
  if(notation == Num.N_FULL) return Num.notationFull(this, precision);

  // invalid notation, show debug breakdown
  return this.b + 'e' + this.e;
};

Num.prototype.toPercentString = function(opt_precision, opt_notation, opt_show_low_numbers_in_detail_too) {
  if(this.ltr(0.0001) && this.gtr(-0.0001) && !opt_show_low_numbers_in_detail_too) return '0%'; // avoid a very long string such as "0.0000087%"
  return this.mulr(100).toString(opt_precision, opt_notation) + '%';
};

// This only gives an accurate result if it fits in a double precision floating point number
Num.valueOf = function(a) {
  var res = new Num(a);
  res.scaleToInPlace(0);
  return res.b;
};

Num.prototype.valueOf = function() {
  return Num.valueOf(this);
};


// units when standalone
var full_suffix_units = [
  'thousand',
  'million',
  'billion',
  'trillion',
  'quadrillion',
  'quintillion',
  'sextillion',
  'septillion',
  'octillion',
  'nonillion',
];

// tens standalone
var full_suffix_tens = [
  '',
  'decillion',
  'vigintillion',
  'trigintillion',
  'quadragintillion',
  'quinquagintillion',
  'sexagintillion',
  'septuagintillion',
  'octagintillion',
  'nonagintillion',
];

// hundreds standalone
var full_suffix_hundreds = [
  '',
  'centillion',
  'ducentillion',
  'trecentillion',
  'quadringentillion',
  'quingentillion',
  'sescentillion',
  'septingentillion',
  'octingentillion',
  'nongentillion'
];

// units when in front of a ten or cent
var full_suffix_units_pre = [
  '',
  'un',
  'duo',
  'tres',
  'quattuor',
  'quin',
  'sex',
  'septen',
  'octo',
  'novem'
];


// tens when in front of a centillion
var full_suffix_tens_pre = [
  '',
  'deci',
  'viginti',
  'triginta',
  'quadriginta',
  'quinqua',
  'sexaginta',
  'septuaginta',
  'octoginta',
  'nonaginta'
];



// here e is the actual latin number represented, e.g. 100 for Centum
function getLatinSuffixFullNameV(e) {
  if(e == -Infinity) return '[-Inf]';
  if(e == Infinity) return '[Inf]';
  if(e < 0) return '[Neg]';
  if(isNaN(e)) return '[NaN]';

  // larger than millillion not yet supported
  if(e > 1000) return '[TooBigForFullName]';

  if(e == 1000) return 'millillion';

  /*
  NOTE: the order of the full latin words is different (more correct) than what we use for the short suffixes:
  101 is uncentillion, but for the short suffixes we use CU ("centillionun")
  102 is duocentillion while 200 is ducentillion. The short suffixes are respectively CD and DC, rather than both DC.
  400 is quadringentillion so centillion with a g, but the short suffix is QC with a C.
  500 is quingentillion and here the short suffix is QG
  these rules for the short suffixes are to keep them distinguishable given that they are just a few short letters, but for the full latin names we can use the proper ordering and naming rules
  */

  var u = e % 10;
  var d = Math.floor(e / 10) % 10;
  var c = Math.floor(e / 100) % 10;

  if(e < 10) {
    return full_suffix_units[u];
  }

  var unit = full_suffix_units_pre[u];
  var ten = (e >= 100) ? full_suffix_tens_pre[u] : full_suffix_tens[d];
  if(u == 3 && d > 0 && (ten[0] == 'd' || ten[0] == 's')) unit = 'tre'; // exceptions where tres becomes tre
  return unit + ten + full_suffix_hundreds[c];
}

// exponent e must be multiple of 3
// returns undefined if out of range
function getLatinSuffixFullName(e) {
  if(e == 0) return '';
  if(e == 1) return 'ten';
  if(e == 2) return 'hundred';
  var result = '';
  if((e % 3) == 1) result = 'ten ';
  if((e % 3) == 2) result = 'hundred ';
  result += getLatinSuffixFullNameV(Math.floor(e / 3) - 1);
  return result;
}

// returns only the full latin suffix the number would get when its exponent spelled out in full
// does not have lower granularity than multiples of tens
function getLatinSuffixFullNameForNumber(v) {
  var e = Math.floor(v.abs().rlog10());
  return getLatinSuffixFullName(e);
}
