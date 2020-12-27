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

  var tokens = [];
  var section;
  var id;

  var process = function(value, type) { tokens.push(Token(value, type, section * 64 + (id++))); };
  var processBool = function(value) { process(value, TYPE_BOOL); };
  var processUint6 = function(value) { process(value, TYPE_UINT6); };
  var processInt = function(value) { process(value, TYPE_INT); };
  var processUint = function(value) { process(value, TYPE_UINT); };
  var processUint16 = function(value) { process(value, TYPE_UINT16); };
  var processFloat = function(value) { process(value, TYPE_FLOAT); };
  var processFloat2 = function(value) { process(value, TYPE_FLOAT2); };
  var processNum = function(value) { process(value, TYPE_NUM); };
  var processString = function(value) { process(value, TYPE_STRING); };
  var processRes = function(value) { process(value, TYPE_RES); };
  var processBoolArray = function(value) { process(value, TYPE_ARRAY_BOOL); };
  var processUint6Array = function(value) { process(value, TYPE_ARRAY_UINT6); };
  var processIntArray = function(value) { process(value, TYPE_ARRAY_INT); };
  var processUintArray = function(value) { process(value, TYPE_ARRAY_UINT); };
  var processUint16Array = function(value) { process(value, TYPE_ARRAY_UINT16); };
  var processFloatArray = function(value) { process(value, TYPE_ARRAY_FLOAT); };
  var processFloat2Array = function(value) { process(value, TYPE_ARRAY_FLOAT2); };
  var processNumArray = function(value) { process(value, TYPE_ARRAY_NUM); };
  var processStringArray = function(value) { process(value, TYPE_ARRAY_STRING); };
  var processResArray = function(value) { process(value, TYPE_ARRAY_RES); };

  var array, array0, array1, array2;

  section = 0; id = 0; // main/misc
  processFloat(state.prevtime);
  processRes(state.res);
  processUint(state.treelevel);
  // id=3 now unused, it used to be "ethereal_upgrade_spent" pre 0.1.9
  id = 4;
  processUint(state.treelevel2);
  processNum(state.resin);
  processUint(state.fern);
  if(state.fern) {
    processUint(state.fernx);
    processUint(state.ferny);
    processRes(state.fernres);
  }
  id = 10; // id for every named value must be fixed (and the process function increments it)
  processFloat(state.lastFernTime);
  processFloat(state.lastBackupWarningTime);
  processInt(state.currentTab);
  processInt(state.lastPlanted);
  processInt(state.lastPlanted2);
  id = 15; // the inner copy of version is saved in section 0, id 15
  processUint(version); // redundancy inner (as opposed to the outer one at front) game version value. important to ensure save-version checks are correct.

  section = 1; id = 0; // field
  processUint(state.numw);
  processUint(state.numh);
  var w = state.numw;
  var h = state.numh;
  array0 = [];
  array1 = [];
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var f = state.field[y][x];
      array0.push(f.index);
      if(f.index >= CROPINDEX) {
        array1.push(f.growth);
      }
    }
  }
  processIntArray(array0);
  processFloat2Array(array1);


  section = 2; id = 0; // field2
  processUint(state.numw2);
  processUint(state.numh2);
  var w2 = state.numw2;
  var h2 = state.numh2;
  array0 = [];
  for(var y = 0; y < h2; y++) {
    for(var x = 0; x < w2; x++) {
      var f = state.field2[y][x];
      array0.push(f.index);
      if(f.index >= CROPINDEX) {
        array1.push(f.growth);
      }
    }
  }
  processIntArray(array0);
  processFloat2Array(array1);

  var unlocked;
  var prev;


  section = 3; id = 0; // upgrades
  unlocked = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    if(state.upgrades[registered_upgrades[i]].unlocked) unlocked.push(registered_upgrades[i]);
  }
  array0 = [];
  array1 = [];
  array2 = [];
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'upgrades must be registered in increasing order';
    array0.push(unlocked[i] - prev);
    prev = unlocked[i];
    array1.push(state.upgrades[unlocked[i]].seen);
    array2.push(state.upgrades[unlocked[i]].count);
  }
  processUintArray(array0);
  processBoolArray(array1);
  processUintArray(array2);


  section = 4; id = 0; // crops
  unlocked = [];
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) unlocked.push(registered_crops[i]);
  }
  array0 = [];
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'crops must be registered in increasing order';
    array0.push(unlocked[i] - prev);
    prev = unlocked[i];
  }
  processUintArray(array0);


  section = 5; id = 0; // upgrades2
  unlocked = [];
  for(var i = 0; i < registered_upgrades2.length; i++) {
    if(state.upgrades2[registered_upgrades2[i]].unlocked) unlocked.push(registered_upgrades2[i]);
  }
  array0 = [];
  array1 = [];
  array2 = [];
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'upgrades2 must be registered in increasing order';
    array0.push(unlocked[i] - prev);
    prev = unlocked[i];
    array1.push(state.upgrades2[unlocked[i]].seen);
    array2.push(state.upgrades2[unlocked[i]].count);
  }
  processUintArray(array0);
  processBoolArray(array1);
  processUintArray(array2);


  section = 6; id = 0; // crops2
  unlocked = [];
  for(var i = 0; i < registered_crops2.length; i++) {
    if(state.crops2[registered_crops2[i]].unlocked) unlocked.push(registered_crops2[i]);
  }
  array0 = [];
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'crops2 must be registered in increasing order';
    array0.push(unlocked[i] - prev);
    prev = unlocked[i];
  }
  processUintArray(array0);


  section = 7; id = 0; // medals
  unlocked = [];
  for(var i = 0; i < registered_medals.length; i++) {
    if(state.medals[registered_medals[i]].earned) unlocked.push(registered_medals[i]);
  }
  array0 = [];
  array1 = [];
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'medals must be registered in increasing order';
    array0.push(unlocked[i] - prev);
    prev = unlocked[i];
    array1.push(state.medals[unlocked[i]].seen);
  }
  processUintArray(array0);
  processBoolArray(array1);


  section = 8; id = 0; // cooldown times
  processFloat(state.fogtime);
  processFloat(state.suntime);
  processFloat(state.rainbowtime);


  section = 9; id = 0; // settings
  processUint16(state.notation);
  processUint16(state.precision);
  processBool(state.saveonexit);
  processBool(state.allowshiftdelete);
  processUint16(state.tooltipstyle);


  section = 10; id = 0; // misc global/previous/current stats that don't match the three identical series below
  processUint(state.g_numresets);
  processUint(state.g_numsaves);
  processUint(state.g_numautosaves);
  processUint(state.g_numloads);
  processUint(state.g_numimports);
  processUint(state.g_numexports);
  processFloat(state.g_lastexporttime);
  processFloat(state.g_lastimporttime);
  processUint(state.g_nummedals);
  processUint(state.g_treelevel);
  processUint(state.g_numplanted2);
  processUint(state.g_numunplanted2);
  processUint(state.g_numupgrades2);
  processUint(state.g_numupgrades2_unlocked);
  processUint(state.p_treelevel);
  processUint(state.g_numfullgrown2);
  processUint(state.g_seasons);
  processUint(state.g_resin_from_transcends);


  section = 11; id = 0; // global run stats
  processFloat(state.g_starttime);
  processFloat(state.g_runtime);
  processUint(state.g_numticks);
  processRes(state.g_res);
  processRes(state.g_max_res);
  processRes(state.g_max_prod);
  processUint(state.g_numferns);
  processUint(state.g_numplantedshort);
  processUint(state.g_numplanted);
  processUint(state.g_numfullgrown);
  processUint(state.g_numunplanted);
  processUint(state.g_numupgrades);
  processUint(state.g_numupgrades_unlocked);
  processUint(state.g_numabilities);


  section = 12; id = 0; // current run stats
  processFloat(state.c_starttime);
  processFloat(state.c_runtime);
  processUint(state.c_numticks);
  processRes(state.c_res);
  processRes(state.c_max_res);
  processRes(state.c_max_prod);
  processUint(state.c_numferns);
  processUint(state.c_numplantedshort);
  processUint(state.c_numplanted);
  processUint(state.c_numfullgrown);
  processUint(state.c_numunplanted);
  processUint(state.c_numupgrades);
  processUint(state.c_numupgrades_unlocked);
  processUint(state.c_numabilities);


  section = 13; id = 0; // previous run stats
  if(state.g_numresets > 0) {
    processFloat(state.p_starttime);
    processFloat(state.p_runtime);
    processUint(state.p_numticks);
    processRes(state.p_res);
    processRes(state.p_max_res);
    processRes(state.p_max_prod);
    processUint(state.p_numferns);
    processUint(state.p_numplantedshort);
    processUint(state.p_numplanted);
    processUint(state.p_numfullgrown);
    processUint(state.p_numunplanted);
    processUint(state.p_numupgrades);
    processUint(state.p_numupgrades_unlocked);
    processUint(state.p_numabilities);
  }


  section = 14; id = 0; // reset stats
  array0 = [];
  var prev = 0;
  for(var i = 0; i < state.reset_stats.length; i++) {
    array0.push(state.reset_stats[i] - prev);
    prev = state.reset_stats[i];
  }
  processIntArray(array0);

  var e = encTokens(tokens);

  if(opt_raw_only) return e;

  var checksum = computeChecksum(e);
  // ticks code: some indication of how much gameplay has been spent in this save, for recovery purpose (distinguish old saves from new ones after game reset)
  var ticks_code = toBase64[Math.min(63, Math.floor(Math.log2((state.g_numticks / 100) + 1)))];
  var save_version = toBase64[(version >> 12) & 63] + toBase64[(version >> 6) & 63] + toBase64[version & 63];
  var result = 'EF' + save_version + ticks_code + compress(e) + checksum;
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
  if(checksum != computeChecksum(s)) return err(6);
  var state = new State();

  var reader = {s:s, pos:0};

  if(save_version <= 4096*1 + 7) {
    var e = decStateOLD(reader, state, save_version);
    if(e != undefined) return e; // error
  } else {
    var tokens = decTokens(reader);
    if(reader.error) return err(4);

    var found, error;

    var section;
    var id;

    // def = default value, or undefined to make it required to be there and indicate error if not there
    var process = function(def, type) {
      var token = tokens[section * 64 + id];
      id++;
      if(token == undefined || token.type != type) {
        found = false;
        if(def == undefined) error = true;
        return def;
      }
      found = true;
      return token.value;
    };
    var processBool = function(def) { return process(def, TYPE_BOOL); };
    var processUint6 = function(def) { return process(def, TYPE_UINT6); };
    var processInt = function(def) { return process(def, TYPE_INT); };
    var processUint = function(def) { return process(def, TYPE_UINT); };
    var processUint16 = function(def) { return process(def, TYPE_UINT16); };
    var processFloat = function(def) { return process(def, TYPE_FLOAT); };
    var processFloat2 = function(def) { return process(def, TYPE_FLOAT2); };
    var processNum = function(def) { return process(def, TYPE_NUM); };
    var processString = function(def) { return process(def, TYPE_STRING); };
    var processRes = function(def) { return process(def, TYPE_RES); };
    var processBoolArray = function(def) { return process(def, TYPE_ARRAY_BOOL); };
    var processUint6Array = function(def) { return process(def, TYPE_ARRAY_UINT6); };
    var processIntArray = function(def) { return process(def, TYPE_ARRAY_INT); };
    var processUintArray = function(def) { return process(def, TYPE_ARRAY_UINT); };
    var processUint16Array = function(def) { return process(def, TYPE_ARRAY_UINT16); };
    var processFloatArray = function(def) { return process(def, TYPE_ARRAY_FLOAT); };
    var processFloat2Array = function(def) { return process(def, TYPE_ARRAY_FLOAT2); };
    var processNumArray = function(def) { return process(def, TYPE_ARRAY_NUM); };
    var processStringArray = function(def) { return process(def, TYPE_ARRAY_STRING); };
    var processResArray = function(def) { return process(def, TYPE_ARRAY_RES); };

    var array, array0, array1, array2;
    var index, index0, index1, index2;


    section = 0; id = 0; // main/misc
    state.prevtime = processFloat();
    state.res = processRes();
    state.treelevel = processUint();
    // id=3 now unused, it used to be "ethereal_upgrade_spent" pre 0.1.9
    id = 4;
    state.treelevel2 = processUint();
    state.resin = processNum();
    state.fern = processUint();
    if(state.fern) {
      state.fernx = processUint();
      state.ferny = processUint();
      state.fernres = processRes();
    }
    id = 10;
    if(save_version <= 4096*1+9 && !state.fern) id -= 3; // fix mistake in pre-0.1.10 savegame version, values lastFernTime, lastBackupWarningTime, currentTab, lastPlanted, lastPlanted2 all got an id of 3 too low if state.fern was false. id should not depend on ifs.
    state.lastFernTime = processFloat();
    state.lastBackupWarningTime = processFloat();
    if(save_version >= 4096*1+9) state.currentTab = processInt();
    if(save_version >= 4096*1+9) state.lastPlanted = processInt();
    if(save_version >= 4096*1+9) state.lastPlanted2 = processInt();
    id = 15;
    if(save_version >= 4096*1+10) {
      var save_version2 = processUint();
      if(save_version2 != save_version) return err(4); // non-matching outer and inner version: error, save_version checks invalid.
    }
    if(error) return err(4);


    section = 1; id = 0; // field
    state.numw = processUint();
    state.numh = processUint();
    if(error) return err(4);
    if(state.numw > 15 || state.numh > 15) return err(4); // that large size is not supported
    if(state.numw < 3 || state.numh < 3) return err(4); // that small size is not supported
    var w = state.numw;
    var h = state.numh;
    array0 = processIntArray();
    array1 = processFloat2Array();
    if(error) return err(4);
    index0 = 0;
    index1 = 0;
    for(var y = 0; y < h; y++) {
      state.field[y] = [];
      for(var x = 0; x < w; x++) {
        state.field[y][x] = new Cell(x, y);
        var f = state.field[y][x];
        f.index = array0[index0++];
        if(f.index >= CROPINDEX) {
          f.growth = array1[index1++];
        }
      }
    }
    if(index0 > array0.length) return err(4);
    if(index1 > array1.length) return err(4);

    section = 2; id = 0; // field2
    state.numw2 = processUint();
    state.numh2 = processUint();
    if(error) return err(4);
    if(state.numw2 > 15 || state.numh2 > 15) return err(4); // that large size is not supported
    if(state.numw2 < 3 || state.numh2 < 3) return err(4); // that small size is not supported
    var w2 = state.numw2;
    var h2 = state.numh2;
    array0 = processIntArray();
    array1 = (save_version >= 4096*1+9) ? processFloat2Array() : null;
    index0 = 0;
    index1 = 0;
    if(error) return err(4);
    for(var y = 0; y < h2; y++) {
      state.field2[y] = [];
      for(var x = 0; x < w2; x++) {
        state.field2[y][x] = new Cell(x, y);
        var f = state.field2[y][x];
        f.index = array0[index0++];
        if(f.index >= CROPINDEX) {
          if(save_version >= 4096*1+9) f.growth = array1[index1++];
        }
      }
    }
    if(index0 > array0.length) return err(4);
    if((save_version >= 4096*1+9) && index1 > array1.length) return err(4);


    var unlocked;
    var prev;


    section = 3; id = 0; // upgrades
    array0 = processUintArray();
    array1 = processBoolArray();
    array2 = processUintArray();
    if(error) return err(4);
    if(array0.length != array1.length || array0.length != array2.length) return err(4);
    prev = 0;
    for(var i = 0; i < array0.length; i++) {
      var index = array0[i] + prev;
      prev = index;
      if(!upgrades[index]) return err(4);
      state.upgrades[index].unlocked = true;
      state.upgrades[index].seen = array1[i];
      state.upgrades[index].count = array2[i];
      if(upgrades[index].deprecated) state.upgrades[index].unlocked = false;
    }


    section = 4; id = 0; // crops
    array0 = processUintArray();
    if(error) return err(4);
    prev = 0;
    for(var i = 0; i < array0.length; i++) {
      var index = array0[i] + prev;
      prev = index;
      if(!crops[index]) return err(4);
      state.crops[index].unlocked = true;
    }


    section = 5; id = 0; // upgrades2
    array0 = processUintArray();
    array1 = processBoolArray();
    array2 = processUintArray();
    if(error) return err(4);
    if(array0.length != array1.length || array0.length != array2.length) return err(4);
    prev = 0;
    for(var i = 0; i < array0.length; i++) {
      var index = array0[i] + prev;
      prev = index;
      if(!upgrades2[index]) return err(4);
      state.upgrades2[index].unlocked = true;
      state.upgrades2[index].seen = array1[i];
      state.upgrades2[index].count = array2[i];
      if(upgrades2[index].deprecated) state.upgrades2[index].unlocked = false;
    }


    section = 6; id = 0; // crops2
    array0 = processUintArray();
    if(error) return err(4);
    prev = 0;
    for(var i = 0; i < array0.length; i++) {
      var index = array0[i] + prev;
      prev = index;
      if(!crops2[index]) return err(4);
      state.crops2[index].unlocked = true;
    }


    section = 7; id = 0; // medals
    array0 = processUintArray();
    array1 = processBoolArray();
    if(error) return err(4);
    if(array0.length != array1.length) return err(4);
    prev = 0;
    for(var i = 0; i < array0.length; i++) {
      var index = array0[i] + prev;
      prev = index;
      if(!medals[index]) return err(4);
      state.medals[index].earned = true;
      state.medals[index].seen = array1[i];
    }


    section = 8; id = 0; // cooldown times
    state.fogtime = processFloat();
    state.suntime = processFloat();
    state.rainbowtime = processFloat();
    if(error) return err(4);


    section = 9; id = 0; // settings
    state.notation = processUint16();
    state.precision = processUint16();
    state.saveonexit = processBool();
    state.allowshiftdelete = processBool();
    state.tooltipstyle = processUint16();
    if(error) return err(4);


    section = 10; id = 0; // misc global/previous/current stats that don't match the three identical series below
    state.g_numresets = processUint();
    state.g_numsaves = processUint();
    state.g_numautosaves = processUint();
    state.g_numloads = processUint();
    state.g_numimports = processUint();
    state.g_numexports = processUint();
    state.g_lastexporttime = processFloat();
    state.g_lastimporttime = processFloat();
    state.g_nummedals = processUint();
    state.g_treelevel = processUint();
    state.g_numplanted2 = processUint();
    state.g_numunplanted2 = processUint();
    state.g_numupgrades2 = processUint();
    state.g_numupgrades2_unlocked = processUint();
    state.p_treelevel = processUint();
    if(save_version >= 4096*1+9) state.g_numfullgrown2 = processUint();
    if(save_version >= 4096*1+9) state.g_seasons = processUint();
    if(save_version >= 4096*1+10) processUint(state.g_resin_from_transcends);

    if(error) return err(4);


    section = 11; id = 0; // global run stats
    state.g_starttime = processFloat();
    state.g_runtime = processFloat();
    state.g_numticks = processUint();
    state.g_res = processRes();
    state.g_max_res = processRes();
    state.g_max_prod = processRes();
    state.g_numferns = processUint();
    state.g_numplantedshort = processUint();
    state.g_numplanted = processUint();
    state.g_numfullgrown = processUint();
    state.g_numunplanted = processUint();
    state.g_numupgrades = processUint();
    state.g_numupgrades_unlocked = processUint();
    if(save_version >= 4096*1+9) state.g_numabilities = processUint();
    if(error) return err(4);


    section = 12; id = 0; // current run stats
    state.c_starttime = processFloat();
    state.c_runtime = processFloat();
    state.c_numticks = processUint();
    state.c_res = processRes();
    state.c_max_res = processRes();
    state.c_max_prod = processRes();
    state.c_numferns = processUint();
    state.c_numplantedshort = processUint();
    state.c_numplanted = processUint();
    state.c_numfullgrown = processUint();
    state.c_numunplanted = processUint();
    state.c_numupgrades = processUint();
    state.c_numupgrades_unlocked = processUint();
    if(save_version >= 4096*1+9) state.c_numabilities = processUint();
    if(error) return err(4);


    section = 13; id = 0; // previous run stats
    if(state.g_numresets > 0) {
      state.p_starttime = processFloat();
      state.p_runtime = processFloat();
      state.p_numticks = processUint();
      state.p_res = processRes();
      state.p_max_res = processRes();
      state.p_max_prod = processRes();
      state.p_numferns = processUint();
      state.p_numplantedshort = processUint();
      state.p_numplanted = processUint();
      state.p_numfullgrown = processUint();
      state.p_numunplanted = processUint();
      state.p_numupgrades = processUint();
      state.p_numupgrades_unlocked = processUint();
      if(save_version >= 4096*1+9) state.p_numabilities = processUint(0);
      if(error) return err(4);
    }


    section = 14; id = 0; // reset stats
    var array0 = processIntArray();
    if(error) return err(4);
    var prev = 0;
    state.reset_stats = [];
    for(var i = 0; i < array0.length; i++) {
      prev += array0[i];
      if(prev < 0) return err(4);
      state.reset_stats[i] = prev;
    }
  }

  if(save_version <= 4096*1+8) {
    // ethereal upgrades have been refactored, refund all old stuff
    for(var y = 0; y < state.numh2; y++) {
      for(var x = 0; x < state.numw2; x++) {
        var f = state.field2[y][x];
        if(f.index >= CROPINDEX) {
          state.res.resin.addrInPlace(10); // the old ethereal plant cost
        }
      }
    }
    clearField2(state);
    if(state.g_numresets > 0) {
      showMessage('Due to an update, the resin and transcension system has been reset. All your resin has been refunded so you can re-use it with the new system. The pericarps resource has been removed from the game.' +
          ' There are now multiple ethereal field plant types and they give direct boosts to the basic field. Unused resin also gives a small boost now.' +
          ' The ethereal upgrades are currently removed, but new ones, probably costing resin, may be added back in a future game update.',
          '#d56', '#5e8', false, true);
    }
    state.res.seeds2 = Num(0);
    state.g_res.seeds2 = Num(0);
    state.g_max_res.seeds2 = Num(0);
    state.g_max_prod.seeds2 = Num(0);
    state.c_res.seeds2 = Num(0);
    state.c_max_res.seeds2 = Num(0);
    state.c_max_prod.seeds2 = Num(0);
    state.p_res.seeds2 = Num(0);
    state.p_max_res.seeds2 = Num(0);
    state.p_max_prod.seeds2 = Num(0);

    state.crops2[berry2_0].unlocked = true;
    state.crops2[mush2_0].unlocked = true;
    state.crops2[flower2_0].unlocked = true;
    state.crops2[special2_0].unlocked = true;

    state.g_numplanted2 = 0;
    state.g_numunplanted2 = 0;
    state.g_numupgrades2 = 0;
    state.g_numupgrades2_unlocked = 0;

    state.g_res.resin = Num(state.res.resin);
    state.g_resin_from_transcends = Num(state.g_res.resin);
  } else if(save_version == 4096*1+9) {
    // fix forgetting to do "state.g_res.resin = Num(state.res.resin);" when converting pre 0.1.8 savegame to 0.1.9
    // fortunately, the "state.g_max_res.resin" should have that exact value in it thanks to seeing it from the refund.
    // note: g_res is total earned resources ever, and g_max_res is max ever had of the corresponding resource
    // g_res.resin may be needed to recover lost resin in future transcension breaking upgrades so it should be ensured to fill it in correctly
    state.g_res.resin = Num(state.g_max_res.resin);
    state.g_resin_from_transcends = Num(state.g_res.resin);
  }


  state.g_numloads++;
  return state;
}


// old save format of 0.1.7 and older, kept for backwards compatiblity for now (but probably not forever, at some point late enough in the future this can be removed when there shouldn't be anyone left with this old alpha-version format)
function decStateOLD(reader, state, save_version) {
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
    if(upgrades[unlocked[i]].deprecated) state.upgrades[unlocked[i]].unlocked = false;
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

  decRes(reader); // was ethereal_upgrade_spent, no longer used
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
    decFloat(reader);
    state.rainbowtime = decFloat(reader);
    decFloat(reader);
    decFloat(reader);
    decFloat(reader);
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

  return undefined; // no error
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
  computeDerived(state);

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
  return encResArray(res.toArray());
}

function decRes(reader) {
  var arr = new decResArray(reader);
  if(arr == null || arr == undefined) return null;
  if(arr.length > 7) { reader.error = true; return null; } // maybe it's a future version that has more resource types
  var res = new Res();
  res.fromArray(arr);
  return res;
}

