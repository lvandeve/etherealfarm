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

// all parsing and serializing is directly to base64, that is, not bytes but base64 units

// reader is object with inside of it:
// a string "s" with base64 values
// a position "pos", the pos can be incremented whenever using a base64 character
// an error indicator error, if truthy indicates something went wrong
// e.g.: {s:'', pos:0, error:false}

// opt_raw_only is for testing only
function encState(state, opt_raw_only) {
  state.g_numsaves++;

  var result = '';
  result += encFloat(state.prevtime);
  result += encRes(state.res);
  result += encNum(state.resin);
  result += encUint(state.treelevel);
  result += encUint(state.treelevel2);
  result += encUint(state.fern);
  if(state.fern) {
    result += encUint(state.fernx);
    result += encUint(state.ferny);
    result += encRes(state.fernres);
  }

  var w = state.numw;
  var h = state.numh;
  result += encUint(w);
  result += encUint(h);
  var w2 = state.numw2;
  var h2 = state.numh2;
  result += encUint(w2);
  result += encUint(h2);
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      result += encInt(f.index);
      if(f.index >= CROPINDEX) {
        result += encFloat2(f.growth);
      }
    }
  }

  for(var y = 0; y < h2; y++) {
    for(var x = 0; x < w2; x++) {
      var f = state.field2[y][x];
      result += encInt(f.index);
    }
  }

  var unlocked;
  var prev;

  unlocked = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    if(state.upgrades[registered_upgrades[i]].unlocked) unlocked.push(registered_upgrades[i]);
  }
  result += encUint(unlocked.length);
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'upgrades must be registered in increasing order';
    result += encUint16(unlocked[i] - prev);
    prev = unlocked[i];
  }
  for(var i = 0; i < unlocked.length; i++) {
    result += encBool(state.upgrades[unlocked[i]].seen);
    result += encUint(state.upgrades[unlocked[i]].count);
  }

  unlocked = [];
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) unlocked.push(registered_crops[i]);
  }
  result += encUint(unlocked.length);
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'crops must be registered in increasing order';
    result += encUint16(unlocked[i] - prev);
    prev = unlocked[i];
  }

  unlocked = [];
  for(var i = 0; i < registered_upgrades2.length; i++) {
    if(state.upgrades2[registered_upgrades2[i]].unlocked) unlocked.push(registered_upgrades2[i]);
  }
  result += encUint(unlocked.length);
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'upgrades must be registered in increasing order';
    result += encUint16(unlocked[i] - prev);
    prev = unlocked[i];
  }
  for(var i = 0; i < unlocked.length; i++) {
    result += encBool(state.upgrades2[unlocked[i]].seen);
    result += encUint(state.upgrades2[unlocked[i]].count);
  }


  unlocked = [];
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops2[registered_crops[i]].unlocked) unlocked.push(registered_crops[i]);
  }
  result += encUint(unlocked.length);
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'crops must be registered in increasing order';
    result += encUint16(unlocked[i] - prev);
    prev = unlocked[i];
  }


  unlocked = [];
  for(var i = 0; i < registered_medals.length; i++) {
    if(state.medals[registered_medals[i]].earned) unlocked.push(registered_medals[i]);
  }
  result += encUint(unlocked.length);
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'medals must be registered in increasing order';
    result += encUint16(unlocked[i] - prev);
    prev = unlocked[i];
  }
  for(var i = 0; i < unlocked.length; i++) {
    result += encBool(state.medals[unlocked[i]].seen);
  }

  result += encRes(state.ethereal_upgrade_spent);

  result += encFloat(state.fogtime);
  result += encFloat(state.suntime);
  result += encFloat(state.rain);
  result += encFloat(state.rainbowtime);
  result += encFloat(state.hailtime);
  result += encFloat(state.snowtime);
  result += encFloat(state.windtime);

  result += encFloat(state.lastFernTime);
  result += encFloat(state.lastBackupWarningTime);

  result += encUint16(state.notation);
  result += encUint16(state.precision);
  result += encBool(state.saveonexit);
  result += encBool(state.allowshiftdelete);
  result += encUint16(state.tooltipstyle);

  result += encUint(state.g_numresets);
  result += encUint(state.g_numsaves);
  result += encUint(state.g_numautosaves);
  result += encUint(state.g_numloads);
  result += encUint(state.g_numimports);
  result += encUint(state.g_numexports);
  result += encFloat(state.g_lastexporttime);
  result += encFloat(state.g_lastimporttime);
  result += encUint(state.g_nummedals);
  result += encUint(state.g_treelevel);
  result += encUint(state.g_numplanted2);
  result += encUint(state.g_numunplanted2);
  result += encUint(state.g_numupgrades2);
  result += encUint(state.g_numupgrades2_unlocked);

  result += encFloat(state.g_starttime);
  result += encFloat(state.g_runtime);
  result += encUint(state.g_numticks);
  result += encRes(state.g_res);
  result += encRes(state.g_max_res);
  result += encRes(state.g_max_prod);
  result += encUint(state.g_numferns);
  result += encUint(state.g_numplantedshort);
  result += encUint(state.g_numplanted);
  result += encUint(state.g_numfullgrown);
  result += encUint(state.g_numunplanted);
  result += encUint(state.g_numupgrades);
  result += encUint(state.g_numupgrades_unlocked);

  result += encFloat(state.c_starttime);
  result += encFloat(state.c_runtime);
  result += encUint(state.c_numticks);
  result += encRes(state.c_res);
  result += encRes(state.c_max_res);
  result += encRes(state.c_max_prod);
  result += encUint(state.c_numferns);
  result += encUint(state.c_numplantedshort);
  result += encUint(state.c_numplanted);
  result += encUint(state.c_numfullgrown);
  result += encUint(state.c_numunplanted);
  result += encUint(state.c_numupgrades);
  result += encUint(state.c_numupgrades_unlocked);

  if(state.g_numresets > 0) {
    result += encFloat(state.p_starttime);
    result += encFloat(state.p_runtime);
    result += encUint(state.p_numticks);
    result += encRes(state.p_res);
    result += encRes(state.p_max_res);
    result += encRes(state.p_max_prod);
    result += encUint(state.p_numferns);
    result += encUint(state.p_numplantedshort);
    result += encUint(state.p_numplanted);
    result += encUint(state.p_numfullgrown);
    result += encUint(state.p_numunplanted);
    result += encUint(state.p_numupgrades);
    result += encUint(state.p_numupgrades_unlocked);

    result += encUint(state.p_treelevel);
  }

  result += encUint(state.reset_stats.length);
  var prev = 0;
  for(var i = 0; i < state.reset_stats.length; i++) {
    result += encInt(state.reset_stats[i] - prev);
    prev = state.reset_stats[i];
  }

  if(opt_raw_only) return result;

  var checksum = computeChecksum(result);
  // ticks code: some indication of how much gameplay has been spent in this save, for recovery purpose (distinguish old saves from new ones after game reset)
  var ticks_code = toBase64[Math.min(63, Math.floor(Math.log2((state.g_numticks / 100) + 1)))];
  var save_version = toBase64[(version >> 12) & 63] + toBase64[(version >> 6) & 63] + toBase64[version & 63];
  result = 'EF' + save_version + ticks_code + compress(result) + checksum;
  return result;
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


function decState(s) {
  if(!isBase64(s)) return err(2);
  if(s.length < 22) return err(1);  // too small for save version, ticks code and checksum
  if(s[0] != 'E' || s[1] != 'F') return err(3); // invalid signature "Ethereal Farm"

  // game version at the time of saving
  var save_version = fromBase64[s[2]] * 4096 + fromBase64[s[3]] * 64 + fromBase64[s[4]];
  if(save_version > version) return err(7); // cannot load games from future versions
  var ticks_code = fromBase64[s[5]]; // ignored here
  var checksum = s.substr(s.length - 16);

  s = s.substr(6, s.length - 22);

  s = decompress(s);
  if(!s) return err(5);
  var state = new State();

  var reader = {s:s, pos:0};
  // time of last tick. BEWARE: do not treat a prevtime that's in the future as an error, since timezone changes, daylight saving, ... can legitimately cause this
  state.prevtime = decFloat(reader);
  state.res = decRes(reader);
  state.resin = decNum(reader);
  state.treelevel = decUint(reader);
  if(state.treelevel > 65536) return err(4); // this is way more than tree level can normally be
  state.treelevel2 = decUint(reader);
  if(state.treelevel2 > 65536) return err(4); // this is way more than tree level can normally be
  state.fern = decUint(reader);
  if(state.fern) {
    state.fernx = decUint(reader);
    state.ferny = decUint(reader);
    state.fernres = decRes(reader);
    if(reader.error) return err(4);
  }
  state.numw = decUint(reader);
  state.numh = decUint(reader);
  if(reader.error) return err(4);
  if(state.numw > 15 || state.numh > 15) return err(4); // that large size is not supported
  if(state.numw < 3 || state.numh < 3) return err(4); // that small size is not supported
  if(state.fernx >= state.numw || state.ferny >= state.numh) return err(4);
  state.numw2 = decUint(reader);
  state.numh2 = decUint(reader);
  if(state.numw2 > 15 || state.numh2 > 15) return err(4); // that large size is not supported
  if(state.numw2 < 3 || state.numh2 < 3) return err(4); // that small size is not supported

  if(checksum != computeChecksum(s)) return err(6);

  var w = state.numw;
  var h = state.numh;
  for(var y = 0; y < h; y++) {
    state.field[y] = [];
    for(var x = 0; x < w; x++) {
      state.field[y][x] = new Cell(x, y);
      var f = state.field[y][x];
      f.index = decInt(reader);
      if(save_version < 4096*1 + 7 && f.index == 79 + CROPINDEX) f.index = 100 + CROPINDEX; // fix mistake where nettle was accidentially registered in the flower series
      if(f.index >= CROPINDEX) {
        f.growth = decFloat2(reader);
      }
    }
  }
  if(reader.error) return err(4);

  var w2 = state.numw2;
  var h2 = state.numh2;
  for(var y = 0; y < h2; y++) {
    state.field2[y] = [];
    for(var x = 0; x < w2; x++) {
      state.field2[y][x] = new Cell(x, y);
      var f = state.field2[y][x];
      f.index = decInt(reader);
    }
  }
  if(reader.error) return err(4);

  var unlocked;
  var prev;

  unlocked = [];
  unlocked.length = decUint(reader);
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(reader.error) return err(4);
    var index = decUint16(reader) + prev;
    prev = index;
    if(!upgrades[index]) return err(4);
    unlocked[i] = index;
    state.upgrades[unlocked[i]].unlocked = true;
    if(upgrades[unlocked[i]].old_inactive) state.upgrades[unlocked[i]].unlocked = false;
  }
  for(var i = 0; i < unlocked.length; i++) {
    state.upgrades[unlocked[i]].seen = decBool(reader);
    state.upgrades[unlocked[i]].count = decUint(reader);
  }
  if(reader.error) return err(4);

  unlocked = [];
  unlocked.length = decUint(reader);
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(reader.error) return err(4);
    var index = decUint16(reader) + prev;
    prev = index;
    if(save_version < 4096*1 + 7 && index == 79) index = 100; // fix mistake where nettle was accidentially registered in the flower series
    if(!crops[index]) return err(4);
    unlocked[i] = index;
    state.crops[unlocked[i]].unlocked = true;
  }

  if(save_version <= 4096*1+7) {
    state.crops[short_0].unlocked = true; // this newly introduced crop should be unlocked for everyone
  }

  unlocked = [];
  unlocked.length = decUint(reader);
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(reader.error) return err(4);
    var index = decUint16(reader) + prev;
    prev = index;
    if(!upgrades2[index]) return err(4);
    unlocked[i] = index;
    state.upgrades2[unlocked[i]].unlocked = true;
  }
  for(var i = 0; i < unlocked.length; i++) {
    state.upgrades2[unlocked[i]].seen = decBool(reader);
    state.upgrades2[unlocked[i]].count = decUint(reader);
  }
  if(reader.error) return err(4);

  unlocked = [];
  unlocked.length = decUint(reader);
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(reader.error) return err(4);
    var index = decUint16(reader) + prev;
    prev = index;
    if(!crops[index]) return err(4);
    unlocked[i] = index;
    state.crops2[unlocked[i]].unlocked = true;
  }

  unlocked = [];
  unlocked.length = decUint(reader);
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(reader.error) return err(4);
    var index = decUint16(reader) + prev;
    prev = index;
    if(!medals[index]) return err(4);
    unlocked[i] = index;
    state.medals[unlocked[i]].earned = true;
  }
  for(var i = 0; i < unlocked.length; i++) {
    state.medals[unlocked[i]].seen = decBool(reader);
  }

  state.ethereal_upgrade_spent = decRes(reader);
  if(save_version <= 4096*1 + 2) {
    // old version ethereal bonuses
    decRes(reader);
    decNum(reader);
    decNum(reader);
    decNum(reader);
    decNum(reader);
    decRes(reader);
  } else {
    state.fogtime = decFloat(reader);
    state.suntime = decFloat(reader);
    state.raintime = decFloat(reader);
    state.rainbowtime = decFloat(reader);
    state.hailtime = decFloat(reader);
    state.snowtime = decFloat(reader);
    state.windtime = decFloat(reader);
  }
  if(save_version >= 4096*1 + 6) {
    state.lastFernTime = decFloat(reader);
    state.lastBackupWarningTime = decFloat(reader);
  }
  if(reader.error) return err(4);

  state.notation = decUint16(reader);
  state.precision = decUint16(reader);
  state.saveonexit = decBool(reader);
  state.allowshiftdelete = decBool(reader);
  if(save_version >= 4096*1 + 6) {
    state.tooltipstyle = decUint16(reader);
  }
  if(reader.error) return err(4);

  state.g_numresets = decUint(reader);
  state.g_numsaves = decUint(reader);
  state.g_numautosaves = decUint(reader);
  state.g_numloads = decUint(reader);
  state.g_numimports = decUint(reader);
  state.g_numexports = decUint(reader);
  state.g_lastexporttime = decFloat(reader);
  state.g_lastimporttime = decFloat(reader);
  state.g_nummedals = decUint(reader);
  state.g_treelevel = decUint(reader);
  state.g_numplanted2 = decUint(reader);
  state.g_numunplanted2 = decUint(reader);
  state.g_numupgrades2 = decUint(reader);
  state.g_numupgrades2_unlocked = decUint(reader);

  state.g_starttime = decFloat(reader);
  state.g_runtime = decFloat(reader);
  state.g_numticks = decUint(reader);
  state.g_res = decRes(reader);
  state.g_max_res = decRes(reader);
  state.g_max_prod = decRes(reader);
  state.g_numferns = decUint(reader);
  if(save_version >= 4096*1 + 7) state.g_numplantedshort = decUint(reader);
  state.g_numplanted = decUint(reader);
  state.g_numfullgrown = decUint(reader);
  state.g_numunplanted = decUint(reader);
  state.g_numupgrades = decUint(reader);
  state.g_numupgrades_unlocked = decUint(reader);

  if(reader.error) return err(4);

  state.c_starttime = decFloat(reader);
  state.c_runtime = decFloat(reader);
  state.c_numticks = decUint(reader);
  state.c_res = decRes(reader);
  state.c_max_res = decRes(reader);
  state.c_max_prod = decRes(reader);
  state.c_numferns = decUint(reader);
  if(save_version >= 4096*1 + 7) state.c_numplantedshort = decUint(reader);
  state.c_numplanted = decUint(reader);
  state.c_numfullgrown = decUint(reader);
  state.c_numunplanted = decUint(reader);
  state.c_numupgrades = decUint(reader);
  state.c_numupgrades_unlocked = decUint(reader);
  if(reader.error) return err(4);

  if(state.g_numresets > 0) {
    state.p_starttime = decFloat(reader);
    state.p_runtime = decFloat(reader);
    state.p_numticks = decUint(reader);
    state.p_res = decRes(reader);
    state.p_max_res = decRes(reader);
    state.p_max_prod = decRes(reader);
    state.p_numferns = decUint(reader);
    if(save_version >= 4096*1 + 7) state.p_numplantedshort = decUint(reader);
    state.p_numplanted = decUint(reader);
    state.p_numfullgrown = decUint(reader);
    state.p_numunplanted = decUint(reader);
    state.p_numupgrades = decUint(reader);
    state.p_numupgrades_unlocked = decUint(reader);

    state.p_treelevel = decUint(reader);
    if(reader.error) return err(4);
  }

  var num_stats = decUint(reader);
  state.reset_stats = [];
  if(num_stats > 1000) return err(4);
  var prev = 0;
  for(var i = 0; i < num_stats; i++) {
    var d = decInt(reader);
    prev += d;
    if(prev < 0) return err(4);
    state.reset_stats[i] = prev;
  }
  if(reader.error) return err(4);

  state.g_numloads++;
  computeDerived(state);
  return state;
}

var computeChecksum = function(b) {
  var h = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  for(var i = 0; i < b.length; i++) {
    var v = fromBase64[b[i]] + 1;
    var j = 0;
    while(j < 16) {
      h[j] = h[j] * 65537 + v;
      if(h[j] > 63) {
        v = h[j] >> 6;
        h[j] &= 63;
      } else {
        break;
      }
      j++;
    }
  }
  var result = '';
  for(var i = 0; i < h.length; i++) result += toBase64[h[i] & 63];
  return result;
};

// Called by save before saving
// Prepare state for exporting: put a few variables external to the state into it
var presave = function(state) {
  state.notation = Num.notation;
  state.precision = Num.precision;
};

// called by load after loading, but should also be called manually after starting the game with a different state, such as after hard reset
// (re-)initializes everything (UI, ...) with the new state object
var postload = function(new_state) {
  state = new_state;

  // a few variables that are external to state
  Num.notation = state.notation;
  Num.precision = state.precision;
};

// normally you must almost always call presave before save
var save = function(state, onsuccess, onfail) {
  presave(state);
  var s = encState(state);
  if(s) {
    if(onsuccess) onsuccess(s);
  } else {
    if(onfail) onfail();
  }
};

// normally you must almost always call postload after successful load
var load = function(s, onsuccess, onfail) {
  var state = decState(s);
  if(state && !state.save_error) {
    postload(state);
    if(onsuccess) onsuccess(state);
  } else {
    if(onfail) onfail(state);
  }
};


// encode resources
function encRes(res) {
  var result = '';
  var arr = res.toArray();
  var first = 0, last = -1;
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].neqr(0)) {
      if(last == -1) first = i;
      last = i;
    }
  }

  // encode with a single number what range of resources is being encoded (first to last index), so that if there's e.g. only 1 type of non-zero resource, it doesn't encode a zero character for all the others
  // but also future proof this so that if new resource types are added it can still be represented
  var code = 0;
  if(last >= 0) {
    var t = last * (last + 1) / 2; // triangular number
    code = 1 + t + first; // + 1 since code 0 means no resources at all are encoded
  }
  if(result > 56) throw 'more than 10 resources types not supported'; // this supports up to 10 types of resources (code 55+1), for higher, this encoding scheme must be extended.
  result += encUint6(code);

  for(var i = first; i <= last; i++) {
    result += encNum(arr[i]);
  }
  return result;
}

function decRes(reader) {
  var res = new Res();
  var arr = res.toArray();
  var code = decUint6(reader);
  var first = 0, last = -1;
  if(code > 0) {
    code--;
    var n = Math.floor(Math.sqrt(0.25 + 2 * code) - 0.5); // inverse of triangular number
    if((n + 1) * (n + 2) / 2 - 1 < code) {
      n++; // fix potential numerical imprecision
    }
    var t = n * (n + 1) / 2;
    last = n;
    first = code - t;
  }

  if(first > 7 || last > 7) { reader.error = true; return null; } // maybe it's a future version that has more resource types
  for(var i = first; i <= last; i++) {
    arr[i] = decNum(reader);
  }
  res.fromArray(arr);
  return res;
}

