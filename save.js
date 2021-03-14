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
  var processFractionChoice = function(value) { process(encFractionChoice(value), TYPE_UINT6); };
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
  var processFractionChoiceArray = function(value) {
    var arr = [];
    for(var i = 0; i < value.length; i++) arr[i] = encFractionChoice(value[i]);
    process(arr, TYPE_ARRAY_UINT6);
  };

  var array, array0, array1, array2, array3, array4, array5, array6, array7;

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
  processInt(state.seed0);
  id = 17;
  processInt(state.fern_seed);
  id = 18;
  processFloat(state.negative_time);
  processFloat(state.total_negative_time);
  processFloat(state.max_negative_time);
  processFloat(state.last_negative_time);
  id = 22;
  processNum(state.twigs);

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
      if(f.hasCrop()) {
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
  array1 = [];
  array2 = [];
  for(var y = 0; y < h2; y++) {
    for(var x = 0; x < w2; x++) {
      var f = state.field2[y][x];
      array0.push(f.index);
      if(f.hasCrop()) {
        array1.push(f.growth);
        array2.push(f.justplanted);
      }
    }
  }
  processIntArray(array0);
  processFloat2Array(array1);
  processBoolArray(array2);

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
  processFloat(state.misttime);
  processFloat(state.suntime);
  processFloat(state.rainbowtime);


  section = 9; id = 0; // settings
  processUint16(state.notation);
  processUint16(state.precision);
  processBool(state.saveonexit);
  processBool(state.allowshiftdelete);
  processUint16(state.tooltipstyle);
  processBool(state.disableHelp);
  processUint16(state.uistyle);
  processUint16(state.sidepanel);


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
  processNum(state.g_resin_from_transcends);
  processUint(state.g_delete2tokens);
  processFloat(state.g_fastestrun);
  processFloat(state.g_slowestrun);
  processFloat(state.g_fastestrun2);
  processFloat(state.g_slowestrun2);
  processUint(state.g_numresets_challenge);
  processUint(state.g_p_treelevel);
  processUint(state.g_numresets_challenge_0);
  processUint(state.g_numresets_challenge_10);


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
  processUint(state.g_numfruits);
  processUint(state.g_numfruitupgrades);
  processUint(state.g_numautoupgrades);


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
  processUint(state.c_numfruits);
  processUint(state.c_numfruitupgrades);
  processUint(state.c_numautoupgrades);


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
    processUint(state.p_numfruits);
    processUint(state.p_numfruitupgrades);
    processUint(state.p_numautoupgrades);
  }


  section = 14; id = 0; // reset stats
  var deltaEnc = function(array) {
    var prev = 0;
    var result = [];
    for(var i = 0; i < array.length; i++) {
      result.push(array[i] - prev);
      prev = array[i];
    }
    processIntArray(result);
  }
  deltaEnc(state.reset_stats_level);
  deltaEnc(state.reset_stats_level2);
  deltaEnc(state.reset_stats_time);
  deltaEnc(state.reset_stats_total_resin);
  deltaEnc(state.reset_stats_challenge);
  deltaEnc(state.reset_stats_resin);


  section = 15; id = 0; // first run stats
  // this section was used until v 0.1.15, with id 0..13
  // do not reuse to not break backwards compatibility.


  section = 16; id = 0; // misc
  processUint(state.delete2tokens);
  processFloat(state.lasttreeleveluptime);


  section = 17; id = 0; // fruits
  processInt(state.fruit_seed);
  processBool(state.fruit_seen);
  processUint(state.fruit_slots);
  processUint(state.fruit_active.length);
  processUint(state.fruit_stored.length);
  processUint(state.fruit_sacr.length);

  id = 8;
  array0 = [];
  array1 = []; // fruit num ability slots (is normally known from tier, but is there as precaution in case it changes with an update)
  array2 = [];
  array3 = [];
  array4 = [];
  array5 = [];
  array6 = [];
  var appendfruit = function(f) {
    array0.push(f.type);
    array1.push(f.tier);
    array2.push(f.abilities.length);
    for(var i = 0; i < f.abilities.length; i++) {
      array3.push(f.abilities[i]);
      array4.push(f.levels[i]);
    }
    array5.push(f.essence);
    array6.push(f.mark);
  };
  for(var i = 0; i < state.fruit_active.length; i++) {
    appendfruit(state.fruit_active[i]);
  }
  for(var i = 0; i < state.fruit_stored.length; i++) {
    appendfruit(state.fruit_stored[i]);
  }
  for(var i = 0; i < state.fruit_sacr.length; i++) {
    appendfruit(state.fruit_sacr[i]);
  }
  processUintArray(array0);
  processUintArray(array1);
  processUintArray(array2);
  processUintArray(array3);
  processUintArray(array4);
  processNumArray(array5);
  processUintArray(array6);

  id = 20; // a few spares for the above
  processUint(state.seen_seasonal_fruit);




  section = 18; id = 0; // help dialogs
  array0 = [];
  array1 = [];
  array2 = [];
  for(var a in state.help_seen) {
    if(!state.help_seen.hasOwnProperty(a)) continue;
    if(!state.help_seen[a]) continue;
    array0.push(state.help_seen[a]);
  }
  array0.sort(function(a, b) { return a - b; });
  for(var i = array0.length - 1; i > 0; i--) array0[i] -= array0[i - 1];
  processUintArray(array0);

  for(var a in state.help_seen_text) {
    if(!state.help_seen_text.hasOwnProperty(a)) continue;
    if(!state.help_seen_text[a]) continue;
    array1.push(state.help_seen_text[a]);
  }
  array1.sort(function(a, b) { return a - b; });
  for(var i = array1.length - 1; i > 0; i--) array1[i] -= array1[i - 1];
  processUintArray(array1);

  for(var a in state.help_disable) {
    if(!state.help_disable.hasOwnProperty(a)) continue;
    if(!state.help_disable[a]) continue;
    array2.push(state.help_disable[a]);
  }
  array2.sort(function(a, b) { return a - b; });
  for(var i = array2.length - 1; i > 0; i--) array2[i] -= array2[i - 1];
  processUintArray(array2);





  section = 19; id = 0; // challenges

  unlocked = [];
  for(var i = 0; i < registered_challenges.length; i++) {
    if(state.challenges[registered_challenges[i]].unlocked) unlocked.push(registered_challenges[i]);
  }
  array0 = [];
  array1 = [];
  array2 = [];
  array3 = [];
  array4 = [];
  array5 = [];
  array6 = [];
  array7 = [];
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'challenges must be registered in increasing order';
    array0.push(unlocked[i] - prev);
    prev = unlocked[i];
    array1.push(state.challenges[unlocked[i]].completed);
    array2.push(state.challenges[unlocked[i]].num);
    array3.push(state.challenges[unlocked[i]].maxlevel);
    array4.push(state.challenges[unlocked[i]].besttime);
    array5.push(state.challenges[unlocked[i]].besttime2);
    array6.push(state.challenges[unlocked[i]].num_completed);
    array7.push(state.challenges[unlocked[i]].num_completed2);
  }
  processUintArray(array0);
  processUintArray(array1);
  processUintArray(array2);
  processUintArray(array3);
  processFloatArray(array4);
  processUint(state.challenge);
  processFloatArray(array5);
  processUintArray(array6);
  processUintArray(array7);




  section = 20; id = 0; // automaton
  processBool(state.automaton_enabled);
  processUintArray(state.automaton_unlocked);
  processUintArray(state.automaton_choice);
  processUint(state.automaton_autoupgrade);
  processFractionChoiceArray(state.automaton_autoupgrade_fraction);
  processUint(state.automaton_autoplant);
  processFractionChoiceArray(state.automaton_autoplant_fraction);


  //////////////////////////////////////////////////////////////////////////////

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
    return err(8);
  }

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
  var processFractionChoice = function(def) { return decFractionChoice(process(def, TYPE_UINT6)); };
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
  var processFractionChoiceArray = function(def) {
    var arr = process(def, TYPE_ARRAY_UINT6);
    if(!arr) return arr;
    for(var i = 0; i < arr.length; i++) arr[i] = decFractionChoice(arr[i]);
    return arr;
  };

  var array, array0, array1, array2, array3, array4, array5, array6, array7;
  var index, index0, index1, index2, index3, index4, index5, index6, index7;


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
  if(save_version >= 4096*1+20) {
    state.seed0 = processInt();
  } else {
    state.seed0 = Math.floor(Math.random() * 281474976710656);
  }
  id = 17;
  if(save_version >= 4096*1+25) {
    state.fern_seed = processInt();
  } else {
    // doesn't need seed0 since the "exploitation" potential is not that big,
    // one can refresh the tab with old savegame to get a bushy fern once, not
    // too big deal.
    state.fern_seed = Math.floor(Math.random() * 281474976710656);
  }
  if(error) return err(4);
  id = 18;
  if(save_version >= 4096*1+30) {
    state.negative_time = processFloat();
    state.total_negative_time = processFloat();
    state.max_negative_time = processFloat();
    state.last_negative_time = processFloat();
  }
  id = 22;
  if(save_version >= 4096*1+36) state.twigs = processNum();


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
      state.field[y][x] = new Cell(x, y, false);
      var f = state.field[y][x];
      f.index = array0[index0++];
      if(f.hasCrop()) {
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
  array2 = (save_version >= 4096*1+15) ? processBoolArray() : null;
  index0 = 0;
  index1 = 0;
  index2 = 0;
  if(error) return err(4);
  for(var y = 0; y < h2; y++) {
    state.field2[y] = [];
    for(var x = 0; x < w2; x++) {
      state.field2[y][x] = new Cell(x, y, true);
      var f = state.field2[y][x];
      f.index = array0[index0++];
      if(f.hasCrop()) {
        if(save_version >= 4096*1+9) f.growth = array1[index1++];
        if(save_version >= 4096*1+15) f.justplanted = array2[index2++];
      }
    }
  }
  if(index0 > array0.length) return err(4);
  if((save_version >= 4096*1+9) && index1 > array1.length) return err(4);
  if((save_version >= 4096*1+15) && index2 > array2.length) return err(4);


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
    if(upgrades[index].deprecated) {
      state.upgrades[index].unlocked = false;
      state.upgrades[index].count = 0;
      // this version, the choice upgrades changed from 2 separate ones, to a single one that uses "count" as the choice
      if(save_version <= 4096*1+14) {
        if(index == fern_choice0_b && array2[i]) {state.upgrades[fern_choice0].unlocked = true; state.upgrades[fern_choice0].count = 2;}
        if(index == active_choice0_b && array2[i]) {state.upgrades[active_choice0].unlocked = true; state.upgrades[active_choice0].count = 2;}
      }
    }
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
  state.misttime = processFloat();
  state.suntime = processFloat();
  state.rainbowtime = processFloat();
  if(error) return err(4);


  section = 9; id = 0; // settings
  state.notation = processUint16();
  state.precision = processUint16();
  state.saveonexit = processBool();
  state.allowshiftdelete = processBool();
  state.tooltipstyle = processUint16();
  if(save_version >= 4096*1+20) state.disableHelp = processBool();
  if(save_version >= 4096*1+22) state.uistyle = processUint16();
  if(save_version >= 4096*1+32) state.sidepanel = processUint16();
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
  if(save_version >= 4096*1+10) {
    if(save_version >= 4096*1+14) {
      state.g_resin_from_transcends = processNum();
    } else {
      state.g_resin_from_transcends = Num(processUint()); // was accidentally encoded as Uint
    }
  }
  if(save_version >= 4096*1+14) {
    state.g_delete2tokens = processUint();
    state.g_fastestrun = processFloat();
    state.g_slowestrun = processFloat();
  }
  if(save_version >= 4096*1+27) {
    state.g_fastestrun2 = processFloat();
    state.g_slowestrun2 = processFloat();
  }
  if(save_version >= 4096*1+28) {
    state.g_numresets_challenge = processUint();
  }
  if(save_version >= 4096*1+42) {
    state.g_p_treelevel = processUint();
  }
  if(save_version >= 4096*1+43) {
    state.g_numresets_challenge_0 = processUint();
    state.g_numresets_challenge_10 = processUint();
  }

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
  if(save_version >= 4096*1+17) state.g_numfruits = processUint();
  if(save_version >= 4096*1+17) state.g_numfruitupgrades = processUint();
  if(save_version >= 4096*1+42) state.g_numautoupgrades = processUint();
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
  if(save_version >= 4096*1+17) state.c_numfruits = processUint();
  if(save_version >= 4096*1+17) state.c_numfruitupgrades = processUint();
  if(save_version >= 4096*1+42) state.c_numautoupgrades = processUint();
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
    if(save_version >= 4096*1+17) state.p_numfruits = processUint();
    if(save_version >= 4096*1+17) state.p_numfruitupgrades = processUint();
    if(save_version >= 4096*1+42) state.p_numautoupgrades = processUint();
    if(error) return err(4);
  }


  section = 14; id = 0; // reset stats
  var deltaDec = function(array) {
    var result = [];
    var prev = 0;
    for(var i = 0; i < array.length; i++) {
      prev += array[i];
      result[i] = prev;
    }
    return result;
  };
  state.reset_stats_level = deltaDec(processIntArray());
  if(save_version >= 4096+1*26) {
    state.reset_stats_level2 = deltaDec(processIntArray());
    state.reset_stats_time = deltaDec(processIntArray());
    state.reset_stats_total_resin = deltaDec(processIntArray());
    state.reset_stats_challenge = deltaDec(processIntArray());
    if(save_version >= 4096+1*44) state.reset_stats_resin = deltaDec(processIntArray());
  }
  if(error) return err(4);


  section = 15; id = 0;
  // this section was used until v 0.1.15, with id 0..13
  // do not reuse to not break backwards compatibility.

  section = 16; id = 0; // misc
  if(save_version >= 4096*1+14) state.delete2tokens = processUint();
  if(save_version >= 4096*1+19) state.lasttreeleveluptime = processFloat();

  section = 17; id = 0; // fruits
  if(save_version >= 4096*1+17) {
    state.fruit_seed = processInt();
    state.fruit_seen = processBool();
    state.fruit_slots = processUint();
    state.fruit_active.length = processUint(0);
    state.fruit_stored.length = processUint(0);
    state.fruit_sacr.length = processUint(0);
    if(state.fruit_active.length > 1) return err(4);
    if(state.fruit_stored.length > state.fruit_slots) return err(4);

    id = 8;
    array0 = processUintArray();
    array1 = processUintArray();
    array2 = processUintArray();
    array3 = processUintArray();
    array4 = processUintArray();
    array5 = processNumArray();
    array6 = processUintArray();
    if(error) return err(4);
    index0 = 0;
    index1 = 0;
    index2 = 0;
    index3 = 0;
    index4 = 0;
    index5 = 0;
    index6 = 0;
    var decfruit = function() {
      var f = new Fruit();
      f.type = array0[index0++];
      f.tier = array1[index1++];
      f.abilities.length = array2[index2++];
      for(var i = 0; i < f.abilities.length; i++) {
        f.abilities[i] = array3[index3++];
        f.levels[i] = array4[index4++];
      }
      f.essence = array5[index5++];
      f.mark = array6[index6++];
      return f;
    };
    for(var i = 0; i < state.fruit_active.length; i++) {
      state.fruit_active[i] = decfruit();
    }
    for(var i = 0; i < state.fruit_stored.length; i++) {
      state.fruit_stored[i] = decfruit();
    }
    for(var i = 0; i < state.fruit_sacr.length; i++) {
      state.fruit_sacr[i] = decfruit();
    }
    if(index0 != array0.length) return err(4);
    if(index1 != array1.length) return err(4);
    if(index2 != array2.length) return err(4);
    if(index3 != array3.length) return err(4);
    if(index4 != array4.length) return err(4);
    if(index5 != array5.length) return err(4);
    if(index6 != array6.length) return err(4);
  }

  if(save_version >= 4096*1+39) {
    id = 20; // a few spares for the above
    state.seen_seasonal_fruit = processUint();
  }

  if(state.fruit_seed < 0) {
    // before version 0.1.17, fruit seed did not exist yet, and seed0 neither,
    // so initialize it based on start time. Do not use Math.random() here to
    // avoid cheesing the free fruit drop by reloading the same save
    // 0x6672756974 is ASCII for fruit
    state.fruit_seed = (Math.floor(state.g_starttime) & 0xffffffff) ^ 0x6672756974;
  }


  section = 18; id = 0; // help dialogs
  if(save_version >= 4096*1+20) {
    array0 = processUintArray();
    array1 = processUintArray();
    array2 = processUintArray();
    if(error) return err(4);
    index0 = 0;
    index1 = 0;
    index2 = 0;

    for(var i = 1; i < array0.length; i++) array0[i] += array0[i - 1];
    for(var i = 1; i < array1.length; i++) array1[i] += array1[i - 1];
    for(var i = 1; i < array2.length; i++) array2[i] += array2[i - 1];

    for(var i = 0; i < array0.length; i++) state.help_seen[array0[i]] = array0[i];
    for(var i = 0; i < array1.length; i++) state.help_seen_text[array1[i]] = array1[i];
    for(var i = 0; i < array2.length; i++) state.help_disable[array2[i]] = array2[i];
  }

  section = 19; id = 0; // challenges
  if(save_version >= 4096*1+29) {
    array0 = processUintArray();
    if(save_version >= 4096*1+32) {
      array1 = processUintArray();
    } else {
      // old format when completed was a boolean
      array1 = processBoolArray();
      for(var i = 0; i < array1.length; i++) array1[i] = (array1[i] ? 1 : 0);
    }
    array2 = processUintArray();
    array3 = processUintArray();
    array4 = processFloatArray();
    state.challenge = processUint();
    if(save_version >= 4096*1+43) {
      array5 = processFloatArray();
      array6 = processUintArray();
      array7 = processUintArray();
    } else {
      array5 = [];
      array6 = [];
      array7 = [];
      for(var i = 0; i < array1.length; i++) {
        array5[i] = 0; // challenge with only 1 stage does not set besttime2
        array6[i] = array1[i]; // moved num completions from .completed to .num_completed in v0.1.43
        array1[i] = array1[i] ? 1 : 0; // this now represents the stage reached rather than single completion
        array7[i] = 0;
      }
    }
    if(error) return err(4);
    if(array0.length != array1.length || array0.length != array2.length || array0.length != array3.length || array0.length != array4.length) {
      return err(4);
    }
    prev = 0;
    for(var i = 0; i < array0.length; i++) {
      var index = array0[i] + prev;
      prev = index;
      if(!challenges[index]) return err(4);
      state.challenges[index].unlocked = true;
      state.challenges[index].completed = array1[i];
      state.challenges[index].num = array2[i];
      state.challenges[index].maxlevel = array3[i];
      state.challenges[index].besttime = array4[i];
      state.challenges[index].besttime2 = array5[i];
      state.challenges[index].num_completed = array6[i];
      state.challenges[index].num_completed2 = array7[i];
    }

  }
  // fix up the fact that the more fair g_numresets_challenge_10 stat didn't exist yet before v 0.1.43, and a few other stat changes
  if(save_version < 4096*1+43) {
    state.g_numresets_challenge_10 = 0;
    for(var i = 0; i < registered_challenges.length; i++) {
      var j = registered_challenges[i];
      state.g_numresets_challenge_10 += state.challenges[j].num_completed;
      if(state.challenge == j) state.challenges[j].num--; // no longer counts current challenge
    }
  }
  // if a new update adds a new challenge stage, invalidate besttime2 and num_completed2, since those only count for the final stage
  for(var i = 0; i < registered_challenges.length; i++) {
    var c = challenges[registered_challenges[i]];
    var c2 = state.challenges[registered_challenges[i]];
    if(c2.besttime2 != 0 && c2.completed < c.targetlevel.length) c2.besttime2 = 0;
    if(c2.num_completed2 != 0 && c2.completed < c.targetlevel.length) c2.num_completed2 = 0;
  }



  section = 20; id = 0; // automaton
  if(save_version >= 4096*1+40) {
    state.automaton_enabled = processBool();
    if(save_version >= 4096*1+43) {
      state.automaton_unlocked = processUintArray();
    } else {
      state.automaton_unlocked = processBoolArray();
      for(var i = 0; i < state.automaton_unlocked.length; i++) state.automaton_unlocked[i] = (state.automaton_unlocked[i] ? 1 : 0);
    }
    state.automaton_choice = processUintArray();
  }
  if(save_version >= 4096*1+42) {
    state.automaton_autoupgrade = processUint();
    var fraction = [];
    if(save_version >= 4096*1+43) {
      fraction = processFractionChoiceArray();
    } else {
      fraction = [processFractionChoice()];
    }
    if(error) return err(4);
    for(var i = 0; i < fraction.length; i++) {
      state.automaton_autoupgrade_fraction[i] = fraction[i];
    }
    for(var i = fraction.length; i < state.automaton_autoupgrade_fraction.length; i++) {
      state.automaton_autoupgrade_fraction[i] = fraction[1];
    }
  }
  if(save_version >= 4096*1+46) {
    state.automaton_autoplant = processUint();
    state.automaton_autoplant_fraction = processFractionChoiceArray();
    if(error) return err(4);
  }

  //////////////////////////////////////////////////////////////////////////////

  if(save_version <= 4096*1+8) {
    // ethereal upgrades have been refactored, refund all old stuff
    for(var y = 0; y < state.numh2; y++) {
      for(var x = 0; x < state.numw2; x++) {
        var f = state.field2[y][x];
        if(f.hasCrop()) {
          state.res.resin.addrInPlace(10); // the old ethereal plant cost
        }
      }
    }
    clearField2(state);
    if(state.g_numresets > 0) {
      showMessage('Due to an update, the resin and transcension system has been reset. All your resin has been refunded so you can re-use it with the new system. The pericarps resource has been removed from the game.' +
          ' There are now multiple ethereal field plant types and they give direct boosts to the basic field. Unused resin also gives a small boost now.' +
          ' The ethereal upgrades are currently removed, but new ones, probably costing resin, may be added back in a future game update.',
          C_META, 0, 0, false, true);
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
  } else if(save_version < 4096*1+14) {
    // yet another bug caused g_resin_from_transcends to be incorrect. Fix it as much as possible.
    var r = state.g_resin_from_transcends;
    var r2;
    r2 = state.g_res.resin;
    if(r2.gt(r)) r = Num(r2);
    r2 = state.g_max_res.resin;
    if(r2.gt(r)) r = Num(r2);
    r2 = Num(state.g_numresets * 11);
    if(r2.gt(r)) r = Num(r2);
    state.g_resin_from_transcends = r;
  }

  if(save_version < 4096*1+16) {
    state.crops2[lotus2_0].unlocked = true;
    state.crops2[flower2_0].unlocked = true;

    state.res.spores.mulrInPlace(6.666666); // spores value got adjusted in v0.1.16
  }


  if(save_version < 4096*1+20) {
    var resin = Num(0);
    for(var i = 0; i < 4; i++) {
      var num = state.upgrades2[upgrade2_season[i]].count;
      for(var j = 1; j < num; j++) {
        resin.addInPlace(Num(10).powr(j).mulr(10));
        resin.subInPlace(Num(2).powr(j).mulr(10));
      }
    }
    if(resin.gtr(0)) {
      showMessage('ethereal season upgrades became cheaper in version v0.1.20, compensated ' + resin.toString() + ' resin to your stacks', C_META, 0, 0);
      state.res.resin.addInPlace(resin);
    }
  }

  if(save_version < 4096*1+23) {
    // a few help dialogs are only unlocked once when doing something, in older save where the dialogs didn't exist yet they'll never happen anymore,
    // indicate them so that they at learst appear under the main help
    if(state.g_numresets) {
      state.help_seen_text[1] = 1;
      state.help_seen_text[9] = 9;
    } else {
      state.help_seen_text[1] = state.help_seen[1] = undefined; // accidently wrote all help_text_seen as 1 due to saving bool true instead of integer
    }
  }

  if(save_version < 4096*1+30) {
    // add this extra research that wasn't unlocked during this challenge to it now, just like game.js does since version 0.1.30
    if(state.challenge == challenge_bees && !state.upgrades[shortmul_0].unlocked) {
      state.upgrades[shortmul_0].unlocked = true;
    }
  }

  // it was accidently storing these resources gotten at start of run from previous run, rather than end of current run.
  // displaying the ones you actually got from the run itself is more logical
  if(save_version < 4096*1+45) {
    state.c_res.resin = Num(0);
    state.c_res.twigs = Num(0);
    state.c_res.essence = Num(0);
  }

  state.g_numloads++;
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
  computeDerived(state);
  precomputeField();

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
  if(arr.length > 8) { reader.error = true; return null; } // maybe it's a future version that has more resource types
  var res = new Res();
  res.fromArray(arr);
  return res;
}

