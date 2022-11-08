/*
Ethereal Farm
Copyright (C) 2020-2022  Lode Vandevenne

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


var debug_allow_missing_fields = false;

// opt_raw_only is for testing only
function encState(state, opt_raw_only) {
  state.g_numsaves++;

  var tokens = [];
  var tokens_stack = [];
  var section;
  var section_stack = [];
  var id;
  var id_stack = [];

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
  var processTime = function(value) {process(value, TYPE_TIME); };
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
  var processTimeArray = function(value) { process(value, TYPE_ARRAY_TIME); };
  var processFractionChoiceArray = function(value) {
    var arr = [];
    for(var i = 0; i < value.length; i++) arr[i] = encFractionChoice(value[i]);
    process(arr, TYPE_ARRAY_UINT6);
  };

  // processStructArrayBegin must be followed by matching pairs of processStructBegin/processStructEnd, and then processStructArrayEnd
  var processStructArrayBegin = function() {
    process([], TYPE_ARRAY_STRUCT);
  };
  // this will reset the id to 0 recursively
  var processStructBegin = function() { // can only, and must, be used after processStructArrayBegin, for each instance
    var subtokens = [];
    tokens[tokens.length - 1].value.push(subtokens);
    tokens_stack.push(tokens);
    tokens = subtokens;
    section_stack.push(section);
    section = 0;
    id_stack.push(id);
    id = 0;
  };
  // this will reset the id to the one at the previous processStructBegin, so after the processStructArrayBegin call
  var processStructEnd = function() {
    tokens = tokens_stack.pop();
    id = id_stack.pop();
    section = section_stack.pop();
  };
  // you must set the id variable back to e.g. the next one after the processStructArrayBegin call after calling this
  var processStructArrayEnd = function() { };

  var array, array0, array1, array2, array3, array4, array5, array6, array7, array8, array9, array10;

  section = 0; id = 0; // main/misc
  processTime(state.prevtime);
  processRes(state.res);
  processUint(state.treelevel);
  // id=3 now unused, it used to be "ethereal_upgrade_spent" pre 0.1.9
  id = 4;
  processUint(state.treelevel2);
  processNum(state.resin);
  processUint(state.fern);
  if(state.fern) {
    id = 7;
    processUint(state.fernx);
    processUint(state.ferny);
    processFloat(state.fernwait); // this field used to be fernres
  }
  id = 10; // id for every named value must be fixed (and the process function increments it)
  processTime(state.lastFernTime);
  processTime(state.lastBackupWarningTime);
  processInt(state.currentTab);
  processInt(state.lastPlanted);
  processInt(state.lastPlanted2);
  id = 15; // the inner copy of version is saved in section 0, id 15
  processUint(version); // redundancy inner (as opposed to the outer one at front) game version value. important to ensure save-version checks are correct.
  processInt(state.seed0);
  id = 17;
  processInt(state.fern_seed);
  id = 18;
  processTime(state.negative_time);
  processTime(state.total_negative_time);
  processTime(state.max_negative_time);
  processTime(state.last_negative_time);
  id = 22;
  processNum(state.twigs);
  processInt(state.num_negative_time);
  processRes(state.fernresin);
  processTime(state.lastReFernTime);
  processInt(state.lastPlanted3);

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
  array3 = [];
  for(var y = 0; y < h2; y++) {
    for(var x = 0; x < w2; x++) {
      var f = state.field2[y][x];
      array0.push(f.index);
      if(f.hasCrop()) {
        array1.push(f.growth);
        array2.push(f.justplanted);
        array3.push(f.justreplaced);
      }
    }
  }
  processIntArray(array0);
  processFloat2Array(array1);
  processBoolArray(array2);
  processBoolArray(array3);

  var unlocked;
  var prev;


  section = 3; id = 0; // upgrades
  unlocked = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    var add = false;
    if(state.upgrades[registered_upgrades[i]].unlocked) add = true;
    // also add those with seen2: it's possible an upgrade was seen in a previous run but not upgraded yet now
    if(state.upgrades[registered_upgrades[i]].seen2) add = true;
    if(add) unlocked.push(registered_upgrades[i]);
  }
  array0 = [];
  array1 = [];
  array2 = [];
  array3 = [];
  array4 = [];
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'upgrades must be registered in increasing order';
    array0.push(unlocked[i] - prev);
    prev = unlocked[i];
    array1.push(state.upgrades[unlocked[i]].unlocked);
    array2.push(state.upgrades[unlocked[i]].seen2);
    if(state.upgrades[unlocked[i]].unlocked) {
      array3.push(state.upgrades[unlocked[i]].seen);
      array4.push(state.upgrades[unlocked[i]].count);
    }
  }
  processUintArray(array0);
  processBoolArray(array1);
  processBoolArray(array2);
  processBoolArray(array3);
  processUintArray(array4);


  section = 4; id = 0; // crops
  unlocked = [];
  for(var i = 0; i < registered_crops.length; i++) {
    if(state.crops[registered_crops[i]].unlocked) unlocked.push(registered_crops[i]);
  }
  array0 = [];
  array1 = [];
  array2 = [];
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'crops must be registered in increasing order';
    array0.push(unlocked[i] - prev);
    prev = unlocked[i];
    array1.push(state.crops[unlocked[i]].prestige);
    array2.push(state.crops[unlocked[i]].known);
  }
  processUintArray(array0);
  processUintArray(array1);
  processUintArray(array2);


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


  section = 8; id = 0; // weather
  processTime(state.misttime);
  processTime(state.suntime);
  processTime(state.rainbowtime);
  processUint6(state.lastWeather);
  processTime(state.lastLightningTime);


  section = 9; id = 0; // settings
  processUint16(state.notation);
  processUint16(state.precision);
  processBool(state.saveonexit);
  id++; // was 'allowshiftdelete'
  processUint16(state.tooltipstyle);
  processBool(state.disableHelp);
  processUint16(state.uistyle);
  processUint16(state.sidepanel);
  processUint16Array(state.notificationsounds);
  processUint16Array(state.messagelogenabled);
  processBool(state.cancelbuttonright);
  processUint6(state.keys_numbers);
  processUint6(state.keys_numbers_shift);
  processUint6(state.keys_brackets);
  processBool(state.keepinterestingfruit);
  processUint6(state.roman);


  section = 10; id = 0; // misc global/previous/current stats that don't match the three identical series below
  processUint(state.g_numresets);
  processUint(state.g_numsaves);
  processUint(state.g_numautosaves);
  processUint(state.g_numloads);
  processUint(state.g_numimports);
  processUint(state.g_numexports);
  processTime(state.g_lastexporttime);
  processTime(state.g_lastimporttime);
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
  processUint(state.g_delete2tokens); // obsolete but for now still present in case the tokens need to come back
  processFloat(state.g_fastestrun);
  processFloat(state.g_slowestrun);
  processFloat(state.g_fastestrun2);
  processFloat(state.g_slowestrun2);
  processUint(state.g_numresets_challenge);
  processUint(state.g_p_treelevel);
  processUint(state.g_numresets_challenge_0);
  processUint(state.g_numresets_challenge_10);
  processUint(state.g_num_squirrel_upgrades);
  processUint(state.g_num_squirrel_respec);
  processUint(state.g_amberdrops);
  processUintArray(state.g_amberbuy);
  processRes(state.g_max_res_earned);
  processRes(state.g_fernres);
  processUintArray(state.g_numpresents);
  processRes(state.p_res_no_ferns);
  processUint(state.g_nummistletoeupgradesdone);
  processUint(state.g_nummistletoeupgrades);
  processUint(state.g_nummistletoecancels);
  processTime(state.g_mistletoeidletime);
  processTime(state.g_mistletoeupgradetime);
  processUint(state.g_numplanted3);
  processUint(state.g_numunplanted3);
  processUint(state.g_numfullgrown3);
  processUint(state.g_numwither3);
  processUint(state.g_numamberkeeprefunds);
  processNum(state.g_max_infinityboost);


  section = 11; id = 0; // global run stats
  processTime(state.g_starttime);
  processTime(state.g_runtime);
  processUint(state.g_numticks);
  processRes(state.g_res);
  processRes(state.g_max_res);
  processRes(state.g_max_prod);
  processUint(state.g_numferns);
  processUint(state.g_numplantedbrassica);
  processUint(state.g_numplanted);
  processUint(state.g_numfullgrown);
  processUint(state.g_numunplanted);
  processUint(state.g_numupgrades);
  processUint(state.g_numupgrades_unlocked);
  processUint(state.g_numabilities);
  processUint(state.g_numfruits);
  processUint(state.g_numfruitupgrades);
  processUint(state.g_numautoupgrades);
  processUint(state.g_numautoplant);
  processUint(state.g_numautodelete);
  processUint(state.g_numfused);
  processRes(state.g_res_hr_best);
  processRes(state.g_res_hr_at);
  processTime(state.g_pausetime);
  processRes(state.g_res_hr_at_time);
  processUint(state.g_numprestiges);
  processUint(state.g_numautoprestiges);
  processUint(state.g_lightnings);


  section = 12; id = 0; // current run stats
  processTime(state.c_starttime);
  processTime(state.c_runtime);
  processUint(state.c_numticks);
  processRes(state.c_res);
  processRes(state.c_max_res);
  processRes(state.c_max_prod);
  processUint(state.c_numferns);
  processUint(state.c_numplantedbrassica);
  processUint(state.c_numplanted);
  processUint(state.c_numfullgrown);
  processUint(state.c_numunplanted);
  processUint(state.c_numupgrades);
  processUint(state.c_numupgrades_unlocked);
  processUint(state.c_numabilities);
  processUint(state.c_numfruits);
  processUint(state.c_numfruitupgrades);
  processUint(state.c_numautoupgrades);
  processUint(state.c_numautoplant);
  processUint(state.c_numautodelete);
  processUint(state.c_numfused);
  processRes(state.c_res_hr_best);
  processRes(state.c_res_hr_at);
  processTime(state.c_pausetime);
  processRes(state.c_res_hr_at_time);
  processUint(state.c_numprestiges);
  processUint(state.c_numautoprestiges);
  processUint(state.c_lightnings);


  section = 13; id = 0; // previous run stats
  if(state.g_numresets > 0) {
    processTime(state.p_starttime);
    processTime(state.p_runtime);
    processUint(state.p_numticks);
    processRes(state.p_res);
    processRes(state.p_max_res);
    processRes(state.p_max_prod);
    processUint(state.p_numferns);
    processUint(state.p_numplantedbrassica);
    processUint(state.p_numplanted);
    processUint(state.p_numfullgrown);
    processUint(state.p_numunplanted);
    processUint(state.p_numupgrades);
    processUint(state.p_numupgrades_unlocked);
    processUint(state.p_numabilities);
    processUint(state.p_numfruits);
    processUint(state.p_numfruitupgrades);
    processUint(state.p_numautoupgrades);
    processUint(state.p_numautoplant);
    processUint(state.p_numautodelete);
    processUint(state.p_numfused);
    processRes(state.p_res_hr_best);
    processRes(state.p_res_hr_at);
    processTime(state.p_pausetime);
    processRes(state.p_res_hr_at_time);
    processUint(state.p_numprestiges);
    processUint(state.p_numautoprestiges);
    processUint(state.p_lightnings);
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
  };
  var deltaEncApprox = function(array) {
    var array2 = [];
    for(var i = 0; i < array.length; i++)  array2[i] = encApproxNum(Num(array[i]));
    deltaEnc(array2);
  };
  deltaEnc(state.reset_stats_level);
  deltaEnc(state.reset_stats_level2);
  deltaEncApprox(state.reset_stats_time);
  deltaEncApprox(state.reset_stats_total_resin);
  deltaEnc(state.reset_stats_challenge);
  deltaEncApprox(state.reset_stats_resin);
  deltaEncApprox(state.reset_stats_twigs);


  section = 15; id = 0; // first run stats
  // this section was used until v 0.1.15, with id 0..13
  // do not reuse to not break backwards compatibility.


  section = 16; id = 0; // misc
  processUint(state.delete2tokens); // obsolete but for now still present in case the tokens need to come back
  processTime(state.lasttreeleveluptime);
  processTime(state.lasttree2leveluptime);
  processTime(state.lastambertime);
  processBool(state.paused);
  processUint(state.squirrel_respec_tokens);
  processTime(state.resinfruittime);
  processTime(state.twigsfruittime);
  processTimeArray(state.prevleveltime);
  processTime(state.lastEtherealDeleteTime);
  processTime(state.lastEtherealPlantTime);
  processTime(state.infinitystarttime);

  section = 17; id = 0; // fruits
  processInt(state.fruit_seed);
  processBool(state.fruit_seen);
  processUint(state.fruit_slots);
  processInt(state.fruit_active);
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
  array7 = [];
  array8 = [];
  array9 = [];
  array10 = [];
  var appendfruit = function(f) {
    array0.push(f.type);
    array1.push(f.tier);
    array2.push(f.abilities.length);
    for(var i = 0; i < f.abilities.length; i++) {
      array3.push(f.abilities[i]);
      array4.push(f.levels[i]);
      array8.push(f.charge[i]);
      array10.push(f.starting_levels[i]);
    }
    array5.push(f.essence);
    array6.push(f.mark);
    array7.push(f.name);
    array9.push(f.fuses);
  };
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
  processStringArray(array7);
  processUintArray(array8);
  processUintArray(array9);
  processUintArray(array10);

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
  array8 = [];
  array9 = [];
  array10 = [];
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'challenges must be registered in increasing order';
    var c = challenges[unlocked[i]];
    var c2 = state.challenges[unlocked[i]];
    array0.push(unlocked[i] - prev);
    prev = unlocked[i];
    array1.push(c2.completed);
    array2.push(c2.num);
    array3.push(c2.maxlevel);
    array4.push(c2.besttime);
    array5.push(c2.besttime2);
    array6.push(c2.num_completed);
    array7.push(c2.num_completed2);
    if(c.cycling > 1) {
      for(var j = 0; j < c.cycling; j++) array8.push(c2.maxlevels[j]);
      for(var j = 0; j < c.cycling; j++) array9.push(c2.besttimes[j]);
      for(var j = 0; j < c.cycling; j++) array10.push(c2.besttimes2[j]);
    }
  }
  processUintArray(array0);
  processUintArray(array1);
  processUintArray(array2);
  processUintArray(array3);
  processTimeArray(array4);
  processUint(state.challenge);
  processTimeArray(array5);
  processUintArray(array6);
  processUintArray(array7);
  processUintArray(array8);
  processTimeArray(array9);
  processTimeArray(array10);


  section = 20; id = 0; // automaton
  processBool(state.automaton_enabled);
  id++; // this used to be the state.automaton_unlocked array, but it's redundant
  processUintArray(state.automaton_choices);
  processUint(state.automaton_autoupgrade);
  processFractionChoiceArray(state.automaton_autoupgrade_fraction);
  processUint(state.automaton_autoplant);
  processFractionChoiceArray(state.automaton_autoplant_fraction);
  processUint(state.automaton_autounlock);
  processBool(state.automaton_autounlock_copy_plant_fraction);
  processFractionChoiceArray(state.automaton_autounlock_fraction);
  processUint(state.automaton_autochoice);
  processNum(state.automaton_autounlock_max_cost);
  processUint(state.automaton_autoprestige);
  processUint(state.automaton_autoaction);

  processStructArrayBegin();
  for(var i = 0; i < state.automaton_autoactions.length; i++) {
    var o = state.automaton_autoactions[i];
    processStructBegin();
    processBool(o.enabled);
    processBool(o.done);
    processUint6(o.type);
    processUint(o.blueprint);
    processBool(o.ethereal);
    processUint(o.level);
    processUint(o.crop);
    processUint(o.prestige);
    processBool(o.enable_blueprint);
    processTime(o.time);
    processBool(o.enable_fruit);
    processUint(o.fruit);
    processBool(o.enable_weather);
    processUint(o.weather);
    processBool(o.enable_brassica);
    processBool(o.enable_fern);
    processBool(o.done2);
    processTime(o.time2);
    processStructEnd();
  }
  processStructArrayEnd();

  section = 21; id = 0; // blueprints
  array0 = [];
  array1 = [];
  array2 = [];
  array3 = [];

  for(var i = 0; i < state.blueprints.length; i++) {
    var b = state.blueprints[i];
    if(!b) b = new BluePrint();
    var w = b.numw;
    var h = b.numh;
    array0[i] = w;
    array1[i] = h;
    array3[i] = b.name;
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        array2.push(b.data[y][x]);
      }
    }
  }

  processUintArray(array0);
  processUintArray(array1);
  processUintArray(array2);
  processStringArray(array3);

  section = 22; id = 0; // squirrel upgrades
  array0 = [];
  array1 = [];

  processNum(state.squirrel_upgrades_spent);

  for(var i = 0; i < state.squirrel_stages.length; i++) {
    var s = state.squirrel_stages[i];
    array0.push(s.num[0]);
    array0.push(s.num[1]);
    array0.push(s.num[2]);
    array1.push(s.seen[0]);
    array1.push(s.seen[1]);
    array1.push(s.seen[2]);
  }
  processUintArray(array0);
  processUintArray(array1);
  id = 3; // indicating id of below one extra clearly, because it was added later but is read as the first value in decoding
  processUint(state.squirrel_evolution);
  processNum(state.nuts_before);
  processBool(state.just_evolution);
  processBool(state.seen_evolution);

  section = 23; id = 0; // amber effects
  processBool(state.amberprod);
  processBool(state.amberseason);
  processFloat(state.seasonshift);
  processUint6(state.seasoncorrection);
  processBool(state.amberkeepseason);
  processBool(state.amberkeepseasonused);


  section = 24; id = 0; // ethereal tree level stats
  processTimeArray(state.eth_stats_time);
  processResArray(state.eth_stats_res);
  processUintArray(state.eth_stats_level);
  processUintArray(state.eth_stats_numresets);
  processNumArray(state.eth_stats_challenge);
  processNumArray(state.eth_stats_medal_bonus);


  section = 25; id = 0; // holiday drops

  processUint(state.present_effect);
  if(state.present_effect) {
    processUint(state.present_image);
    processUint(state.presentx);
    processUint(state.presenty);
  }
  id = 5;
  processFloat(state.presentwait);
  processInt(state.present_seed);
  processTime(state.lastPresentTime);
  processTime(state.present_grow_speed_time);
  processTime(state.present_production_boost_time);


  section = 26; id = 0; // challenges last run stats
  array0 = [];
  array1 = [];
  array2 = [];
  array3 = [];
  array4 = [];
  array5 = [];
  array6 = [];
  array7 = [];
  for(var i = -1; i < registered_challenges.length; i++) {
    // ci 0 correpsonds to no challenge, which also gets the run stats
    var ci = (i == -1) ? 0 : registered_challenges[i];
    if(i != -1 && !state.challenges[ci].unlocked) continue;
    var c2 = state.challenges[ci];
    array0.push(c2.last_completion_level);
    array1.push(c2.last_completion_time);
    array2.push(encApprox2Num(c2.last_completion_resin));
    array3.push(encApprox2Num(c2.last_completion_twigs));
    array4.push(c2.last_completion_date);
    array5.push(encApprox2Num(c2.last_completion_resin));
    array6.push(c2.last_completion_level2);
    array7.push(c2.last_completion_g_level);
  }
  processUintArray(array0);
  processTimeArray(array1);
  processUintArray(array2);
  processUintArray(array3);
  processTimeArray(array4);
  processUintArray(array5);
  processUintArray(array6);
  processUintArray(array7);

  section = 27; id = 0; // ethereal blueprints
  array0 = [];
  array1 = [];
  array2 = [];
  array3 = [];
  array4 = [];

  for(var i = 0; i < state.blueprints2.length; i++) {
    var b = state.blueprints2[i];
    if(!b) b = new BluePrint();
    var w = b.numw;
    var h = b.numh;
    array0[i] = w;
    array1[i] = h;
    array4[i] = b.name;
    for(var y = 0; y < h; y++) {
      for(var x = 0; x < w; x++) {
        array2.push(b.data[y][x]);
        var tier = b.tier[y][x] + 1; // -1, from blueprint, is stored as 0
        if(!(tier >= 0)) tier = 0;
        array3.push(tier);
      }
    }
  }
  processUintArray(array0);
  processUintArray(array1);
  processUintArray(array2);
  processUintArray(array3);
  processStringArray(array4);


  section = 28; id = 0; // ethereal mistletoe
  prev = 0;
  processStructArrayBegin();
  for(var i = 0; i < registered_mistles.length; i++) {
    var index = registered_mistles[i];
    if(index - prev < 0) throw 'ethereal mistletoe upgrades must be registered in increasing order';
    var m = mistletoeupgrades[index];
    var m2 = state.mistletoeupgrades[index];
    processStructBegin();
    processUint(index - prev);
    processUint(m2.num);
    processTime(m2.time);
    processStructEnd();
    prev = index;
  }
  processStructArrayEnd();
  processInt(state.mistletoeupgrade);
  processTime(state.mistletoeidletime);




  section = 29; id = 0; // field3
  processUint(state.numw3);
  processUint(state.numh3);
  var w3 = state.numw3;
  var h3 = state.numh3;
  array0 = [];
  array1 = [];
  for(var y = 0; y < h3; y++) {
    for(var x = 0; x < w3; x++) {
      var f = state.field3[y][x];
      array0.push(f.index);
      if(f.hasCrop()) {
        array1.push(f.growth);
      }
    }
  }
  processIntArray(array0);
  processFloat2Array(array1);



  section = 30; id = 0; // crops3
  unlocked = [];
  for(var i = 0; i < registered_crops3.length; i++) {
    if(state.crops3[registered_crops3[i]].unlocked) unlocked.push(registered_crops3[i]);
  }
  array0 = [];
  array1 = [];
  prev = 0;
  for(var i = 0; i < unlocked.length; i++) {
    if(unlocked[i] - prev < 0) throw 'crops must be registered in increasing order';
    array0.push(unlocked[i] - prev);
    prev = unlocked[i];
    array1.push(state.crops3[unlocked[i]].had);
  }
  processUintArray(array0);
  processUintArray(array1);


  //////////////////////////////////////////////////////////////////////////////

  var e = encTokens(tokens);

  if(opt_raw_only) return e;

  var checksum = computeChecksum(e);
  // ticks code: some indication of how much gameplay has been spent in this save, for recovery purpose (distinguish old saves from new ones after game reset)
  var ticks_code = toBase64[Math.min(63, Math.floor(Math.log2((state.g_numticks / 100) + 1)))];
  var save_version = toBase64[(version >> 18) & 63] + toBase64[(version >> 12) & 63] + toBase64[(version >> 6) & 63] + toBase64[version & 63];
  var result = 'EF' + save_version + ticks_code + compress(e) + checksum;
  return result;
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function isFiniteGE0(v) {
  if(v < 0) return false;
  if(isNaN(v)) return false;
  if(v == Infinity) return false;
  return true;
}

function decState(s) {
  if(!isBase64(s)) return err(2);
  if(s.length < 22) return err(1);  // too small for save version, ticks code and checksum
  if(s[0] != 'E' || s[1] != 'F') return err(3); // invalid signature "Ethereal Farm"

  // game version at the time of saving
  var save_version;
  // if < 0, it's a save from the older 3-character version format
  var major = fromBase64[s[2]] - 2;
  if(major < 0) save_version = fromBase64[s[2]] * 4096 + fromBase64[s[3]] * 64 + fromBase64[s[4]];
  else save_version = fromBase64[s[2]] * 262144 + fromBase64[s[3]] * 4096 + fromBase64[s[4]] * 64 + fromBase64[s[5]];
  // 1 character, ticks_code, ignored here

  if(save_version > version) return err(7); // cannot load games from future versions
  var checksum = s.substr(s.length - 16);

  var begin = major < 0 ? 6 : 7;
  s = s.substr(begin, s.length - 16 - begin);

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
  var tokens_stack = [];
  var parent_stack = []; // for parent token

  var error = false;

  var section;
  var section_stack = [];
  var id;
  var id_stack = [];

  // def = default value, or undefined to make it required to be there and indicate error if not there
  var process = function(def, type) {
    var token = tokens[section * 64 + id];
    id++;
    if(token == undefined || token.type != type) {
      if(def == undefined && !debug_allow_missing_fields) error = true;
      return def;
    }
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
  var processTime = function(def) {
    if(save_version < 4096*1+98) return process(def, TYPE_FLOAT);
    return process(def, TYPE_TIME);
  };
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
  var processTimeArray = function(def) {
    if(save_version < 4096*1+98) return process(def, TYPE_ARRAY_FLOAT);
    return process(def, TYPE_ARRAY_TIME);
  };
  var processFractionChoiceArray = function(def) {
    var arr = process(def, TYPE_ARRAY_UINT6);
    if(!arr) return arr;
    for(var i = 0; i < arr.length; i++) arr[i] = decFractionChoice(arr[i]);
    return arr;
  };

  var processStructArrayBegin = function() { // must be followed by matching pairs of processStructBegin/processStructEnd, and then processStructArrayEnd
    var value = process([], TYPE_ARRAY_STRUCT);
    parent_stack.push(value);
    return value.length;
  };
  var processStructBegin = function() { // can only, and must, be used after processStructArrayBegin, for each instance
    var value = parent_stack[parent_stack.length - 1];
    if(!value.length) {
      error = true;
      return;
    }
    tokens_stack.push(tokens);
    tokens = value[0];
    section_stack.push(section);
    section = 0;
    id_stack.push(id);
    id = 0;
  };
  var processStructEnd = function() {
    var value = parent_stack[parent_stack.length - 1];
    value.shift(0, 1);
    tokens = tokens_stack.pop();
    id = id_stack.pop();
    section = section_stack.pop();
  };
  var processStructArrayEnd = function() {
    parent_stack.pop();
  };

  var array, array0, array1, array2, array3, array4, array5, array6, array7, array8, array9, array10;
  var index, index0, index1, index2, index3, index4, index5, index6, index7, index8, index9, index10;


  section = 0; id = 0; // main/misc
  state.prevtime = processTime();
  state.res = processRes();
  state.treelevel = processUint();
  // id=3 now unused, it used to be "ethereal_upgrade_spent" pre 0.1.9
  id = 4;
  state.treelevel2 = processUint();
  state.resin = processNum();
  if(save_version < 4096*1+64) { state.resin.mulrInPlace(Math.floor(state.treelevel / min_transcension_level)); } // compensate for removal of tlevel feature
  state.fern = processUint();
  if(state.fern) {
    id = 7;
    state.fernx = processUint();
    state.ferny = processUint();
    if(save_version >= 4096*1+86) {
      state.fernwait = processFloat(); // this field used to be fernres
    } else {
      state.fernwait = 0; // placeholder for old save version, parsed as getFernWaitTime() when used in game.js
      id++;
    }
  }
  id = 10;
  if(save_version <= 4096*1+9 && !state.fern) id -= 3; // fix mistake in pre-0.1.10 savegame version, values lastFernTime, lastBackupWarningTime, currentTab, lastPlanted, lastPlanted2 all got an id of 3 too low if state.fern was false. id should not depend on ifs.
  state.lastFernTime = processTime();
  state.lastBackupWarningTime = processTime();
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
    state.negative_time = processTime();
    state.total_negative_time = processTime();
    state.max_negative_time = processTime();
    state.last_negative_time = processTime();
  }
  id = 22;
  if(save_version >= 4096*1+36) {
    state.twigs = processNum();
    if(save_version < 4096*1+64) { state.twigs.mulrInPlace(Math.floor(state.treelevel / min_transcension_level)); } // compensate for removal of tlevel feature
  }
  if(save_version >= 4096*1+62) state.num_negative_time = processInt();
  if(save_version >= 4096*1+86) state.fernresin = processRes();
  if(save_version >= 4096*1+98) state.lastReFernTime = processTime();
  if(save_version >= 262144*2+64*7+0) state.lastPlanted3 = processInt();


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
      state.field[y][x] = new Cell(x, y, 1);
      var f = state.field[y][x];
      f.index = array0[index0++];
      if(f.index >= 50000 + CROPINDEX && save_version <= 4096*1+58) f.index = f.index - 50000 + 300; //accidently wrong id in that version
      else if(f.index >= 307 + CROPINDEX && save_version <= 4096*1+58) f.index = f.index - 307 + 300; //accidently wrong id in that version
      if(f.hasCrop()) {
        f.growth = array1[index1++];
      }
      if((f.index == 150 || f.index == 151) && save_version < 4096*1+74) f.index = f.growth = 0; //accidental nuts plants in older version
      else if(f.index == 151 + CROPINDEX && save_version < 4096*1+75) f.index = 150 + CROPINDEX; //second nut tier got a lot more powerful and expensive, replace with first tier
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
  array3 = (save_version >= 4096*1+98) ? processBoolArray() : null;
  index0 = 0;
  index1 = 0;
  index2 = 0;
  index3 = 0;
  if(error) return err(4);
  for(var y = 0; y < h2; y++) {
    state.field2[y] = [];
    for(var x = 0; x < w2; x++) {
      state.field2[y][x] = new Cell(x, y, 2);
      var f = state.field2[y][x];
      f.index = array0[index0++];
      if(f.hasCrop()) {
        if(save_version >= 4096*1+9) f.growth = array1[index1++];
        if(save_version >= 4096*1+15) f.justplanted = array2[index2++];
        if(save_version >= 4096*1+98) f.justreplaced = array3[index3++];
      }
    }
  }
  if(index0 > array0.length) return err(4);
  if((save_version >= 4096*1+9) && index1 > array1.length) return err(4);
  if((save_version >= 4096*1+15) && index2 > array2.length) return err(4);


  var unlocked;
  var prev;


  section = 3; id = 0; // upgrades
  if(save_version >= 4096*1+91) {
    array0 = processUintArray();
    array1 = processBoolArray();
    array2 = processBoolArray();
    array3 = processBoolArray();
    array4 = processUintArray();
    if(error) return err(4);
    if(array0.length != array1.length || array0.length != array2.length || array3.length != array4.length || array3.length > array0.length) return err(4);
    prev = 0;
    var i2 = 0;
    for(var i = 0; i < array0.length; i++) {
      var index = array0[i] + prev;
      prev = index;
      if(save_version < 4096*1+97) {
        // prestige upgrades didn't have enough room in between the regular crop unlock upgrades
        if(index == 41 || index == 42) index += (325 - 41);
      }
      if(!upgrades[index]) return err(4);
      state.upgrades[index].unlocked = array1[i];
      state.upgrades[index].seen2 = array2[i];
      if(state.upgrades[index].unlocked) {
        state.upgrades[index].seen = array3[i2];
        state.upgrades[index].count = array4[i2];
        i2++;
      }
      if(upgrades[index].deprecated) {
        state.upgrades[index].unlocked = false;
        state.upgrades[index].count = 0;
      }
    }
  } else {
    // old legacy way of storing upgrades with seen2 field bug
    array0 = processUintArray();
    array1 = processBoolArray();
    array2 = processUintArray();
    if(save_version >= 4096*1+65) array3 = processBoolArray();
    else array3 = array1;
    if(error) return err(4);
    if(array0.length != array1.length || array0.length != array2.length) return err(4);
    prev = 0;
    for(var i = 0; i < array0.length; i++) {
      var index = array0[i] + prev;
      prev = index;
      if(save_version < 4096*1+90) {
        // more room for crop unlocks was made
        if(index < 250 && index >= 125) index += (500 - 125);
        else if(index < 300 && index >= 250) index += (1000 - 250);
        else if(index < 350 && index >= 300) index -= 100;
      }
      if(!upgrades[index]) return err(4);
      state.upgrades[index].unlocked = true;
      state.upgrades[index].seen = array1[i];
      state.upgrades[index].count = array2[i];
      state.upgrades[index].seen2 = array3[i];
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
    if(save_version < 4096*1+75) {
      //second nut tier got a lot more powerful and expensive, undo its upgrades
      state.upgrades[nutunlock_1].count = 0; // nutunlock_1
      state.upgrades[nutmul_1].count = 0; // nutmul_1
    }
  }


  section = 4; id = 0; // crops
  array0 = processUintArray();
  if(save_version >= 4096*1+94) {
    array1 = processUintArray(); // prestige
  } else {
    array1 = [];
    for(var i = 0; i < array0.length; i++) array1[i] = 0;
  }
  if(save_version >= 262144*2+64*6+0) {
    array2 = processUintArray(); // crop.known
  } else {
    array2 = [];
    for(var i = 0; i < array0.length; i++) array2[i] = 0;
  }
  if(error) return err(4);
  if(array0.length != array1.length || array0.length != array2.length) return err(4);
  prev = 0;
  for(var i = 0; i < array0.length; i++) {
    var index = array0[i] + prev;
    prev = index;
    if(index >= 50000 && save_version <= 4096*1+58) index = index - 50000 + 300; //accidently wrong id in that version
    else if(index >= 307 && save_version <= 4096*1+58) index = index - 307 + 300; //accidently wrong id in that version
    if(!crops[index]) {
      return err(4);
    }
    state.crops[index].unlocked = true;
    state.crops[index].prestige = array1[i];
    state.crops[index].known = array2[i];
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
    if(save_version < 4096*1+67 && index == upgrade2_blackberrysecret && state.upgrades2[index].count > 1) state.upgrades2[index].count = 1; // fix bug where it incremented at every transcend
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
    if(save_version < 4096*1+74 && index >= 400) {
      index += 200; // index was shifted to make room for more crop-type medals
    }
    if(save_version < 4096*1+90) {
      // id 600+ moved to 1000+, and 1000+ to 2000+, to make room for more crop amount achievements
      // crop amount achievements now per 8 instead of per 5
      if(index >= 1000) index += 1000;
      else if(index >= 600) index += 400;
      else if(index == 500) index = 643;
      else if(index == 501) index = 644;
      else if(index >= 400) index = 960 + (Math.floor((index - 400) / 5));
      else if(index >= 369) index = 560 + (Math.floor((index - 369) / 5)) * 8 + ((index - 9) % 5);
      else if(index >= 359) index = 720 + (Math.floor((index - 359) / 5)) * 8 + ((index - 9) % 5);
      else if(index >= 349) index = 480 + (Math.floor((index - 349) / 5)) * 8 + ((index - 9) % 5);
      else if(index >= 299) index = 400 + (Math.floor((index - 299) / 5)) * 8 + ((index - 9) % 5);
      else if(index >= 249) index = 320 + (Math.floor((index - 249) / 5)) * 8 + ((index - 9) % 5);
      else if(index >= 149) index = 160 + (Math.floor((index - 149) / 5)) * 8 + ((index - 9) % 5);
    }
    if(!medals[index]) return err(4);
    state.medals[index].earned = true;
    state.medals[index].seen = array1[i];

    if(medals[index].deprecated) {
      state.medals[index].earned = false;
      state.medals[index].seen = false;
    }
  }


  section = 8; id = 0; // weather
  // misttime comes before suntime despite sun being the "earlier" weather ability due to legacy reasons
  state.misttime = processTime();
  state.suntime = processTime();
  state.rainbowtime = processTime();
  if(save_version >= 4096*1+98) {
    state.lastWeather = processUint6();
  } else {
    if(state.misttime > state.suntime && state.misttime > state.rainbowtime) state.lastWeather = 1;
    if(state.rainbowtime > state.suntime && state.rainbowtime > state.misttime) state.lastWeather = 2;
  }
  if(save_version >= 4096*1+102) {
    state.lastLightningTime = processTime();
  }
  if(error) return err(4);


  section = 9; id = 0; // settings
  state.notation = processUint16();
  state.precision = processUint16();
  state.saveonexit = processBool();
  id++; // was 'allowshiftdelete'
  state.tooltipstyle = processUint16();
  if(save_version >= 4096*1+20) state.disableHelp = processBool();
  if(save_version >= 4096*1+22) state.uistyle = processUint16();
  if(save_version >= 4096*1+32) state.sidepanel = processUint16();
  if(save_version >= 4096*1+57) state.notificationsounds = processUint16Array();
  if(save_version >= 4096*1+62) {
    var current = state.messagelogenabled; // default value for newly introduced ones
    state.messagelogenabled = processUint16Array();
    for(var i = state.messagelogenabled.length; i < current.length; i++) state.messagelogenabled[i] = current[i];
  }
  if(error) return err(4);
  if(save_version >= 4096*1+70) state.cancelbuttonright = processBool();
  if(save_version >= 4096*1+89) {
    state.keys_numbers = processUint6();
    state.keys_numbers_shift = processUint6();
    state.keys_brackets = processUint6();
  } else {
    // before version v.0.1.89, number keys activated weather, so set it to the default it was. For new players after this version, the default is fruit slots instead
    state.keys_numbers = 1;
    state.keys_brackets = 3;
  }
  if(save_version >= 4096*1+90) state.keepinterestingfruit = processBool();
  if(save_version >= 262144*2+64*2+1) state.roman = (save_version >= 262144*2+64*4+0) ? processUint6() : processBool();
  if(error) return err(4);


  section = 10; id = 0; // misc global/previous/current stats that don't match the three identical series below
  state.g_numresets = processUint();
  state.g_numsaves = processUint();
  state.g_numautosaves = processUint();
  state.g_numloads = processUint();
  state.g_numimports = processUint();
  state.g_numexports = processUint();
  state.g_lastexporttime = processTime();
  state.g_lastimporttime = processTime();
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
    state.g_delete2tokens = processUint(); // obsolete but for now still present in case the tokens need to come back
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
  if(save_version >= 4096*1+74) {
    state.g_num_squirrel_upgrades = processUint();
    state.g_num_squirrel_respec = processUint();
    state.g_amberdrops = processUint();
    var amberbuy = processUintArray();
    for(var i = 0; i < amberbuy.length; i++) state.g_amberbuy[i] = amberbuy[i];
  }
  if(save_version >= 4096*1+86) {
    state.g_max_res_earned = processRes();
    state.g_fernres = processRes();
  } else {
    // g_max_res_earned handled below to set it to p_res then
  }
  if(save_version >= 4096*1+99) {
    var presents = processUintArray();
    if(error) return err(4);
    if(presents.length > state.g_numpresents.length) return err(4);
    for(var i = 0; i < presents.length; i++) state.g_numpresents[i] = presents[i];
  } else if(save_version >= 4096*1+93) {
    state.g_numpresents[0] = processUint();
  }
  if(save_version >= 4096*1+96) state.p_res_no_ferns = processRes(); // else, for older versions, will be set below
  if(save_version >= 262144*2+64*6+0) {
    state.g_nummistletoeupgradesdone = processUint();
    state.g_nummistletoeupgrades = processUint();
    state.g_nummistletoecancels = processUint();
    state.g_mistletoeidletime = processTime();
    state.g_mistletoeupgradetime = processTime();
  }
  if(save_version >= 262144*2+64*7+0) {
    state.g_numplanted3 = processUint();
    state.g_numunplanted3 = processUint();
    state.g_numfullgrown3 = processUint();
    state.g_numwither3 = processUint();
  }
  if(save_version >= 262144*2+64*7+3) state.g_numamberkeeprefunds = processUint();
  if(save_version >= 262144*2+64*7+3) state.g_max_infinityboost = processNum();


  if(error) return err(4);


  section = 11; id = 0; // global run stats
  state.g_starttime = processTime();
  state.g_runtime = processTime();
  state.g_numticks = processUint();
  state.g_res = processRes();
  state.g_max_res = processRes();
  state.g_max_prod = processRes();
  state.g_numferns = processUint();
  state.g_numplantedbrassica = processUint();
  state.g_numplanted = processUint();
  state.g_numfullgrown = processUint();
  state.g_numunplanted = processUint();
  state.g_numupgrades = processUint();
  state.g_numupgrades_unlocked = processUint();
  if(save_version >= 4096*1+9) state.g_numabilities = processUint();
  if(save_version >= 4096*1+17) state.g_numfruits = processUint();
  if(save_version >= 4096*1+17) state.g_numfruitupgrades = processUint();
  if(save_version >= 4096*1+42) state.g_numautoupgrades = processUint();
  if(save_version >= 4096*1+49) state.g_numautoplant = processUint();
  if(save_version >= 4096*1+49) state.g_numautodelete = processUint();
  if(save_version >= 4096*1+60) state.g_numfused = processUint();
  if(save_version >= 4096*1+62) state.g_res_hr_best = processRes();
  if(save_version >= 4096*1+62) state.g_res_hr_at = processRes();
  if(save_version >= 4096*1+71) state.g_pausetime = processTime();
  if(save_version >= 4096*1+78) state.g_res_hr_at_time = processRes();
  if(save_version >= 4096*1+94) state.g_numprestiges = processUint();
  if(save_version >= 4096*1+94) state.g_numautoprestiges = processUint();
  if(save_version >= 4096*1+102) state.g_lightnings = processUint();
  if(error) return err(4);


  section = 12; id = 0; // current run stats
  state.c_starttime = processTime();
  state.c_runtime = processTime();
  state.c_numticks = processUint();
  state.c_res = processRes();
  state.c_max_res = processRes();
  state.c_max_prod = processRes();
  state.c_numferns = processUint();
  state.c_numplantedbrassica = processUint();
  state.c_numplanted = processUint();
  state.c_numfullgrown = processUint();
  state.c_numunplanted = processUint();
  state.c_numupgrades = processUint();
  state.c_numupgrades_unlocked = processUint();
  if(save_version >= 4096*1+9) state.c_numabilities = processUint();
  if(save_version >= 4096*1+17) state.c_numfruits = processUint();
  if(save_version >= 4096*1+17) state.c_numfruitupgrades = processUint();
  if(save_version >= 4096*1+42) state.c_numautoupgrades = processUint();
  if(save_version >= 4096*1+49) state.c_numautoplant = processUint();
  if(save_version >= 4096*1+49) state.c_numautodelete = processUint();
  if(save_version >= 4096*1+60) state.c_numfused = processUint();
  if(save_version >= 4096*1+62) state.c_res_hr_best = processRes();
  if(save_version >= 4096*1+62) state.c_res_hr_at = processRes();
  if(save_version >= 4096*1+71) state.c_pausetime = processTime();
  if(save_version >= 4096*1+78) state.c_res_hr_at_time = processRes();
  if(save_version >= 4096*1+94) state.c_numprestiges = processUint();
  if(save_version >= 4096*1+94) state.c_numautoprestiges = processUint();
  if(save_version >= 4096*1+102) state.c_lightnings = processUint();
  if(error) return err(4);


  section = 13; id = 0; // previous run stats
  if(state.g_numresets > 0) {
    state.p_starttime = processTime();
    state.p_runtime = processTime();
    state.p_numticks = processUint();
    state.p_res = processRes();
    if(save_version < 4096*1+86) state.g_max_res_earned = Res(state.p_res);
    if(save_version < 4096*1+96) state.p_res_no_ferns.resin = Num(state.p_res.resin);
    state.p_max_res = processRes();
    state.p_max_prod = processRes();
    state.p_numferns = processUint();
    state.p_numplantedbrassica = processUint();
    state.p_numplanted = processUint();
    state.p_numfullgrown = processUint();
    state.p_numunplanted = processUint();
    state.p_numupgrades = processUint();
    state.p_numupgrades_unlocked = processUint();
    if(save_version >= 4096*1+9) state.p_numabilities = processUint(0);
    if(save_version >= 4096*1+17) state.p_numfruits = processUint();
    if(save_version >= 4096*1+17) state.p_numfruitupgrades = processUint();
    if(save_version >= 4096*1+42) state.p_numautoupgrades = processUint();
    if(save_version >= 4096*1+49) state.p_numautoplant = processUint();
    if(save_version >= 4096*1+49) state.p_numautodelete = processUint();
    if(save_version >= 4096*1+60) state.p_numfused = processUint();
    if(save_version >= 4096*1+62) state.p_res_hr_best = processRes();
    if(save_version >= 4096*1+62) state.p_res_hr_at = processRes();
    if(save_version >= 4096*1+71) state.p_pausetime = processTime();
    if(save_version >= 4096*1+78) state.p_res_hr_at_time = processRes();
    if(save_version >= 4096*1+94) state.p_numprestiges = processUint();
    if(save_version >= 4096*1+94) state.p_numautoprestiges = processUint();
    if(save_version >= 4096*1+102) state.p_lightnings = processUint();
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
  var deltaDecApproxNum = function(array) {
    var array2 = deltaDec(array);
    var result = [];
    for(var i = 0; i < array2.length; i++) result[i] = decApproxNum(array2[i]);
    return result;
  };
  var deltaDecApproxFloat = function(array) {
    var array2 = deltaDec(array);
    var result = [];
    for(var i = 0; i < array2.length; i++) result[i] = decApproxNum(array2[i]).valueOf();
    return result;
  };
  state.reset_stats_level = deltaDec(processIntArray());
  if(save_version >= 4096*1+26) {
    state.reset_stats_level2 = deltaDec(processIntArray());
    if(save_version >= 4096*1+63) {
      state.reset_stats_time = deltaDecApproxFloat(processIntArray());
      state.reset_stats_total_resin = deltaDecApproxNum(processIntArray());
      state.reset_stats_challenge = deltaDec(processIntArray());
      state.reset_stats_resin = deltaDecApproxNum(processIntArray());
      state.reset_stats_twigs = deltaDecApproxNum(processIntArray());
    } else {
      state.reset_stats_time = deltaDec(processIntArray());
      for(var i = 0; i < state.reset_stats_time.length; i++) state.reset_stats_time[i] *= 3;
      state.reset_stats_total_resin = deltaDec(processIntArray());
      for(var i = 0; i < state.reset_stats_total_resin.length; i++) state.reset_stats_total_resin[i] = Num.pow(Num(2), Num(state.reset_stats_total_resin[i])).subr(1);
      state.reset_stats_challenge = deltaDec(processIntArray());
      if(save_version >= 4096*1+44) {
        state.reset_stats_resin = deltaDec(processIntArray());
        for(var i = 0; i < state.reset_stats_resin.length; i++) state.reset_stats_resin[i] = Num.pow(Num(2), Num(state.reset_stats_resin[i])).subr(1);
      }
    }
  }
  if(error) return err(4);


  section = 15; id = 0;
  // this section was used until v 0.1.15, with id 0..13
  // do not reuse to not break backwards compatibility.

  section = 16; id = 0; // misc
  if(save_version >= 4096*1+14) state.delete2tokens = processUint(); // obsolete but for now still present in case the tokens need to come back
  if(save_version >= 4096*1+19) state.lasttreeleveluptime = processTime();
  if(save_version >= 4096*1+71) state.lasttree2leveluptime = processTime();
  if(save_version >= 4096*1+71) state.lastambertime = processTime();
  if(save_version >= 4096*1+72) state.paused = processBool();
  if(save_version >= 4096*1+74) state.squirrel_respec_tokens = processUint();
  if(save_version >= 4096*1+83) state.resinfruittime = processTime();
  if(save_version >= 4096*1+83) state.twigsfruittime = processTime();
  if(save_version >= 4096*1+103) {
    state.prevleveltime = processTimeArray();
    if(error || state.prevleveltime.length != 3) return err(4);
  }
  if(save_version >= 4096*1+104) state.lastEtherealDeleteTime = processTime();
  if(save_version >= 4096*1+104) state.lastEtherealPlantTime = processTime();
  if(save_version >= 262144*2+64*7+3) state.infinitystarttime = processTime();
  if(error) return err(4);


  section = 17; id = 0; // fruits
  if(save_version >= 4096*1+17) {
    state.fruit_seed = processInt();
    state.fruit_seen = processBool();
    state.fruit_slots = processUint();
    var old_active_length = 0; // from when fruit_active was still an array
    if(save_version < 4096*1+57) {
      old_active_length = processUint(0);
      if(old_active_length > 1) return err(4);
      state.fruit_slots++; // the active slot became one of the regular fruit slots now
    } else if(save_version < 4096*1+100) {
      state.fruit_active = processUint(0);
    } else {
      state.fruit_active = processInt(0);
    }
    state.fruit_stored.length = processUint(0);
    state.fruit_sacr.length = processUint(0);
    if(state.fruit_stored.length > state.fruit_slots) return err(4);

    id = 8;
    array0 = processUintArray();
    array1 = processUintArray();
    array2 = processUintArray();
    array3 = processUintArray();
    array4 = processUintArray();
    array5 = processNumArray();
    array6 = processUintArray();
    if(save_version >= 4096*1+57) {
      array7 = processStringArray();
    } else {
      array7 = [];
      for(var i = 0; i < array6.length; i++) array7[i] = '';
    }
    if(save_version >= 4096*1+60) {
      array8 = processUintArray();
      array9 = processUintArray();
    } else {
      array8 = [];
      for(var i = 0; i < array3.length; i++) array8[i] = 0;
      array9 = [];
      for(var i = 0; i < array6.length; i++) array9[i] = 0;
    }
    if(save_version >= 4096*1+67) {
      array10 = processUintArray();
    } else {
      array10 = [];
    }
    if(error) return err(4);
    index0 = 0;
    index1 = 0;
    index2 = 0;
    index3 = 0;
    index4 = 0;
    index5 = 0;
    index6 = 0;
    index7 = 0;
    index8 = 0;
    index9 = 0;
    index10 = 0;
    var decfruit = function() {
      var f = new Fruit();
      f.type = array0[index0++];
      f.tier = array1[index1++];
      if(index2 >= array2.length) return undefined;
      f.abilities.length = array2[index2++];
      f.essence = array5[index5++];
      f.mark = array6[index6++];
      f.name = array7[index7++];
      f.fuses = array9[index9++];
      for(var i = 0; i < f.abilities.length; i++) {
        f.abilities[i] = array3[index3++];
        f.levels[i] = array4[index4++];
        f.charge[i] = array8[index8++];
        if(save_version < 4096*1+67) {
          array10[index10] = (f.essence.eqr(0) && f.fuses == 0) ? f.levels[i] : 2; // 2 = typical average starter level of dropped fruits
        }
        f.starting_levels[i] = array10[index10++];
        if(save_version < 4096*1+78 && f.abilities[i] >= 9 && f.abilities[i] <= 17 && f.type >= 1) { // at that time, 9 was FRUIT_SPRING, 17 was FRUIT_ALL_SEASON (until version 4096*1+100)
          f.abilities[i] = 9 + f.type - 1; // fix fusing multiseason+single-season fruit resulted in single-season fruit with too good seasonal ability
        }
        if(save_version < 4096*1+100 && f.abilities[i] >= 9) {
          // a reordering of some ability indices happened here
          if(f.abilities[i] >= 18) f.abilities[i] -= 9;
          else f.abilities[i] += 11;
        }
      }
      return f;
    };
    if(save_version < 4096*1+57) {
      if(old_active_length) {
        state.fruit_stored.length = state.fruit_stored.length + 1;
        var f = decfruit();
        if(!f) return err(4);
        state.fruit_stored[0] = f;
        state.fruit_active = 0;
      } else {
        state.fruit_active = state.fruit_stored.length;
      }
    }
    for(var i = old_active_length; i < state.fruit_stored.length; i++) {
      var f = decfruit();
      if(!f) return err(4);
      state.fruit_stored[i] = f;
    }
    for(var i = 0; i < state.fruit_sacr.length; i++) {
      var f = decfruit();
      if(!f) return err(4);
      state.fruit_sacr[i] = f;
    }
    if(index0 != array0.length) return err(4);
    if(index1 != array1.length) return err(4);
    if(index2 != array2.length) return err(4);
    if(index3 != array3.length) return err(4);
    if(index4 != array4.length) return err(4);
    if(index5 != array5.length) return err(4);
    if(index6 != array6.length) return err(4);
    if(index7 != array7.length) return err(4);
    if(index8 != array8.length) return err(4);
    if(index9 != array9.length) return err(4);
    if(index10 != array10.length) return err(4);
  }

  if(save_version >= 4096*1+39) {
    id = 20; // a few spares for the above
    state.seen_seasonal_fruit = processUint();
  }
  if(save_version < 4096*1+92) {
    //fruits upgrade costs got tweaked
    for(var i = 0; i < state.fruit_stored.length; i++) correctifyFruitCost(state.fruit_stored[i]);
    for(var i = 0; i < state.fruit_sacr.length; i++) correctifyFruitCost(state.fruit_sacr[i]);
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

    if(state.help_seen_text[30]) ensureMissedHelpDialogAvailable(29, state);
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
    array4 = processTimeArray();
    state.challenge = processUint();
    if(save_version >= 4096*1+43) {
      array5 = processTimeArray();
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
    if(save_version >= 4096*1+69) {
      array8 = processUintArray();
      array9 = processTimeArray();
      array10 = processTimeArray();
    } else {
      array8 = [];
      array9 = [];
      array10 = [];
    }
    if(error) return err(4);
    if(array0.length != array1.length || array0.length != array2.length || array0.length != array3.length || array0.length != array4.length) {
      return err(4);
    }
    index8 = 0;
    index9 = 0;
    index10 = 0;
    prev = 0;
    for(var i = 0; i < array0.length; i++) {
      var index = array0[i] + prev;
      prev = index;
      if(!challenges[index]) return err(4);
      var c = challenges[index];
      var c2 = state.challenges[index];
      c2.unlocked = true;
      c2.completed = array1[i];
      c2.num = array2[i];
      c2.maxlevel = array3[i];
      c2.besttime = array4[i];
      c2.besttime2 = array5[i];
      c2.num_completed = array6[i];
      c2.num_completed2 = array7[i];
      if(c.cycling > 1) {
        c2.maxlevels = [];
        c2.besttimes = [];
        c2.besttimes2 = [];
        if(save_version >= 4096*1+69) {
          for(var j = 0; j < c.cycling; j++) c2.maxlevels[j] = array8[index8++];
          for(var j = 0; j < c.cycling; j++) c2.besttimes[j] = array9[index9++];
          for(var j = 0; j < c.cycling; j++) c2.besttimes2[j] = array10[index10++];
        } else {
          for(var j = 0; j < c.cycling; j++) {
            c2.maxlevels[j] = ((j < c2.num_completed) ? Math.max(c.targetlevel[0], c2.maxlevel - j * 2) : 0); // aproximate situation
            c2.besttimes[j] = 0;
            c2.besttimes2[j] = 0;
          }
          c2.besttimes[0] = c2.besttime;
          c2.besttimes2[0] = c2.besttime2;
        }
      }
    }
    if(save_version >= 4096*1+69 && (index8 != array8.length || index9 != array9.length || index10 != array10.length)) return err(4);

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
    id++; // this used to be the state.automaton_unlocked array, but it's redundant
    state.automaton_choices = processUintArray();
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
    var orig_len = state.automaton_autoplant_fraction.length;
    state.automaton_autoplant_fraction = processFractionChoiceArray();
    for(var i = state.automaton_autoplant_fraction.length; i < orig_len; i++) state.automaton_autoplant_fraction[i] = state.automaton_autoplant_fraction[0];
    if(error) return err(4);
  }
  if(save_version >= 4096*1+50) {
    state.automaton_autounlock = processUint();
    if(error) return err(4);
  }
  if(save_version >= 4096*1+51) {
    state.automaton_autounlock_copy_plant_fraction = processBool();
    var orig_len = state.automaton_autoplant_fraction.length;
    state.automaton_autounlock_fraction = processFractionChoiceArray();
    for(var i = state.automaton_autounlock_fraction.length; i < orig_len; i++) state.automaton_autounlock_fraction[i] = state.automaton_autounlock_fraction[0];
    if(error) return err(4);
  }
  if(save_version >= 4096*1+53) {
    state.automaton_autochoice = processUint();
    if(error) return err(4);
  } else {
    state.automaton_autochoice = 1;
  }
  if(save_version >= 4096*1+57) {
    state.automaton_autounlock_max_cost = processNum();
  }
  if(save_version >= 4096*1+94) {
    state.automaton_autoprestige = processUint();
  }
  if(save_version >= 262144*2+64*5+0) {
    state.automaton_autoaction = processUint();
  }
  if(error) return err(4);


  // wither challenge moved from ethereal tree 3 to ethereal tree 5 in v0.5.0, and got significantly higher target levels
  if(save_version < 262144*2+64*5+0 && state.challenges[challenge_wither].unlocked) {
    var c = state.challenges[challenge_wither];
    var c2 = challenges[challenge_wither];
    if(state.treelevel2 < 5) c.unlocked = false;
    if(c.completed) {
      if(c.maxlevel < c2.targetlevel[0]) c.completed = 0;
      else if(c.maxlevel < c2.targetlevel[1]) c.completed = 1;
      else if(c.maxlevel < c2.targetlevel[2]) c.completed = 2;
      if(!c.completed) c.num_completed = 0;
      if(c.completed < 2) c.num_completed2 = 0;
    }
  }

  if(save_version >= 262144*2+64*5+0) {
    var count = processStructArrayBegin();
    state.automaton_autoactions = [];
    state.updateAutoActionAmount(count);
    for(var i = 0; i < count; i++) {
      var o = state.automaton_autoactions[i];
      state.automaton_autoactions[i] = o;
      processStructBegin();
      o.enabled = processBool();
      o.done = processBool();
      o.type = processUint6();
      o.blueprint = processUint();
      o.ethereal = processBool();
      o.level = processUint();
      if(save_version >= 262144*2+64*6+0) o.crop = processUint();
      if(save_version >= 262144*2+64*6+0) o.prestige = processUint();
      if(save_version >= 262144*2+64*6+3) {
        o.enable_blueprint = processBool();
      } else {
        o.enable_blueprint = (o.blueprint > 0);
        if(o.blueprint > 0) o.blueprint--; // 0 used to indicate 'none' before this version
      }
      if(save_version >= 262144*2+64*6+3) o.time = processTime();
      if(save_version >= 262144*2+64*6+3) o.enable_fruit = processBool();
      if(save_version >= 262144*2+64*6+3) o.fruit = processUint();
      if(save_version >= 262144*2+64*6+4) o.enable_weather = processBool();
      if(save_version >= 262144*2+64*6+4) o.weather = processUint();
      if(save_version >= 262144*2+64*6+4) o.enable_brassica = processBool();
      if(save_version >= 262144*2+64*6+4) o.enable_fern = processBool();
      if(save_version >= 262144*2+64*6+5) o.done2 = processBool();
      if(save_version >= 262144*2+64*6+5) o.time2 = processTime();

      processStructEnd();
    }
    processStructArrayEnd();
  }
  if(error) return err(4);

  section = 21; id = 0; // blueprints
  if(save_version >= 4096*1+58) {
    array0 = processUintArray();
    array1 = processUintArray();
    array2 = processUintArray();
    if(error) return err(4);
    if(save_version >= 4096*1+60) {
      array3 = processStringArray();
    } else {
      array3 = [];
      for(var i = 0; i < array0.length; i++) array3[i] = '';
    }
    if(error) return err(4);
    if(array0.length != array1.length) return err(4);
    if(array0.length != array3.length) return err(4);
    index2 = 0;

    state.blueprints = [];
    for(var i = 0; i < array0.length; i++) {
      var w = array0[i];
      var h = array1[i];
      if(w > 20 || h > 20) return err(4);
      var b = new BluePrint();
      state.blueprints[i] = b;
      b.numw = w;
      b.numh = h;
      b.name = array3[i];
      b.data = [];
      for(var y = 0; y < h; y++) {
        b.data[y] = [];
        for(var x = 0; x < w; x++) {
          var code = array2[index2++];
          b.data[y][x] = code;
        }
      }
    }
    if(index2 != array2.length) return err(4);
  }
  if(error) return err(4);

  section = 22; id = 0; // squirrel upgrades

  var squirrel_undo_refunds = 0; // in case some upgrades get refunded due to version changes

  if(save_version >= 262144*2+64*4+0) {
    id = 3; // this one is further in the savegame, but read it first since it's needed for the below
    state.squirrel_evolution = processUint();
    id = 0; // reset it back
  }
  state.initSquirrelStages();

  if(save_version >= 4096*1+74) {
    var stages = squirrel_stages[state.squirrel_evolution];

    state.squirrel_upgrades_spent = processNum();
    array0 = processUintArray();
    array1 = [];
    if(save_version >= 4096*1+78) {
      array1 = processUintArray();
      if(array1.length != array0.length) return err(4);
    } else {
      for(var i = 0; i < array0.length; i++) array1[i] = array0[i];
    }
    id = 4; // skip state.squirrel_evolution which was already read above
    if(save_version >= 262144*2+64*4+0) {
      state.nuts_before = processNum();
      state.just_evolution = processBool();
      state.seen_evolution = processBool();
    }
    if(save_version < 4096*1+100 && array0.length >= 39 && array0[37]) {
      // two new squirrel upgrades inserted, at the last group, move the one gated upgrade one forward, and refund it
      // that gated upgrade moved from index 37 to 40
      array0[37] = array0[39] = array0[40] = array0[41] = 0;
      array1[40] = array1[37];
      array1[37] = array1[39] = array1[41] = false;
      squirrel_undo_refunds++;
    }

    index0 = 0;
    index1 = 0;
    if(array0.length % 3 != 0) return err(4);
    if(array0.length > stages.length * 3) return err(4);

    var num = Math.floor(array0.length / 3);
    for(var i = 0; i < num; i++) {
      var s3 = state.squirrel_stages[i];
      s3.num[0] = array0[index0++];
      s3.num[1] = array0[index0++];
      s3.num[2] = array0[index0++];
      s3.seen[0] = array1[index1++];
      s3.seen[1] = array1[index1++];
      s3.seen[2] = array1[index1++];
      if(i >= 7 && save_version < 4096*1+92 && s3.num[1]) {
        squirrel_undo_refunds++;
        s3.num[1] = 0;
        s3.seen[1] = false;
      }
      if(s3.num[0] > stages[i].upgrades0.length) return err(4);
      if(s3.num[1] > stages[i].upgrades1.length) return err(4);
      if(s3.num[2] > stages[i].upgrades2.length) return err(4);
      for(var j = 0; j < s3.num[0]; j++) state.squirrel_upgrades[stages[i].upgrades0[j]].count++;
      for(var j = 0; j < s3.num[1]; j++) state.squirrel_upgrades[stages[i].upgrades1[j]].count++;
      for(var j = 0; j < s3.num[2]; j++) state.squirrel_upgrades[stages[i].upgrades2[j]].count++;
      if(s3.seen[0] > stages[i].upgrades0.length) return err(4);
      if(s3.seen[1] > stages[i].upgrades1.length) return err(4);
      if(s3.seen[2] > stages[i].upgrades2.length) return err(4);
    }
  }
  if(error) return err(4);

  if(squirrel_undo_refunds > 0) {
    showMessage('Due to an update some squirrel updates changed, and ' + squirrel_undo_refunds + ' of your squirrel upgrade(s) got refunded. Check the squirrel tab to re-buy them.', C_META, 0, 0, false, true);
    getSquirrelUpgradeCost(i);
    var count = 0;
    for(var i = 0; i < registered_squirrel_upgrades.length; i++) {
      var u2 = state.squirrel_upgrades[registered_squirrel_upgrades[i]];
      count += u2.count;
    }
    count += squirrel_undo_refunds;
    var refund = new Num(0);
    while(squirrel_undo_refunds > 0) {
      squirrel_undo_refunds--;
      count--;
      refund.addInPlace(getSquirrelUpgradeCost(count));
    }
    state.res.nuts.addInPlace(refund);
  }
  if(error) return err(4);


  section = 23; id = 0; // amber effects
  if(save_version >= 4096*1+74) state.amberprod = processBool();
  if(save_version >= 4096*1+77) state.amberseason = processBool();
  if(save_version >= 4096*1+77) state.seasonshift = processFloat();
  if(save_version >= 4096*1+80) state.seasoncorrection = processUint6();
  if(save_version >= 262144*2+64*7+3) state.amberkeepseason = processBool();
  if(save_version >= 262144*2+64*7+3) state.amberkeepseasonused = processBool();
  if(error) return err(4);


  section = 24; id = 0; // ethereal tree level stats
  if(save_version >= 4096*1+79) {
    state.eth_stats_time = processTimeArray();
    state.eth_stats_res = processResArray();
    state.eth_stats_level = processUintArray();
    state.eth_stats_numresets = processUintArray();
    state.eth_stats_challenge = processNumArray();
    state.eth_stats_medal_bonus = processNumArray();
  }
  if(error) return err(4);


  section = 25; id = 0; // holiday drops

  if(save_version >= 4096*1+93) {
    state.present_effect = processUint();
    if(state.present_effect) {
      state.present_image = processUint();
      state.presentx = processUint();
      state.presenty = processUint();
    }
    id = 5;
    state.presentwait = processFloat();
    state.present_seed = processInt();
    state.lastPresentTime = processTime();
    state.present_grow_speed_time = processTime();
    if(save_version >= 4096*1+99) state.present_production_boost_time = processTime();
  } else {
    state.present_seed = state.seed0 ^ 0x70726573; // ascii for "pres"
  }
  if(error) return err(4);

  // holiday event finished, remove presents since clicking them does nothing
  /*if(state.present_effect) {
    state.present_effect = 0;
    state.presentx = 0;
    state.presenty = 0;
    state.presentwait = 0;
    state.present_image = 0;
  }*/


  section = 26; id = 0; // challenges last run stats

  if(save_version >= 4096*1+98) {
    array0 = processUintArray();
    array1 = processTimeArray();
    array2 = processUintArray();
    array3 = processUintArray();
    array4 = processTimeArray();
    array5 = processUintArray();
    array6 = processUintArray();
    if(save_version >= 4096*1+99) array7 = processUintArray();
    if(error) return err(4);
    if(array0.length != array1.length || array0.length != array2.length || array0.length != array3.length ||
       array0.length != array4.length || array0.length != array5.length || array0.length != array6.length ||
       (save_version >= 4096*1+99 && array0.length != array7.length)) {
      return err(4);
    }
    var index = 0;
    for(var i = -1; i < registered_challenges.length; i++) {
      // ci 0 correpsonds to no challenge, which also gets the run stats
      var ci = (i == -1) ? 0 : registered_challenges[i];
      if(i != -1 && !state.challenges[ci].unlocked) continue;
      if(index >= array0.length) return err(4);
      var c2 = state.challenges[ci];
      c2.last_completion_level = array0[index];
      c2.last_completion_time = array1[index];
      c2.last_completion_resin = decApprox2Num(array2[index]);
      c2.last_completion_twigs = decApprox2Num(array3[index]);
      c2.last_completion_date = array4[index];
      c2.last_completion_resin = decApprox2Num(array5[index]);
      c2.last_completion_level2 = array6[index];
      if(save_version >= 4096*1+99) c2.last_completion_g_level = array7[index];
      index++;
    }
  }
  if(error) return err(4);


  section = 27; id = 0; // ethereal blueprints

  if(save_version >= 4096*1+98) {
    array0 = processUintArray();
    array1 = processUintArray();
    array2 = processUintArray();
    array3 = processUintArray();
    array4 = processStringArray();
    if(error) return err(4);
    if(array0.length != array1.length) return err(4);
    if(array0.length != array4.length) return err(4);
    if(array2.length != array3.length) return err(4);
    index2 = 0;
    index3 = 0;
    state.blueprints2 = [];
    for(var i = 0; i < array0.length; i++) {
      var w = array0[i];
      var h = array1[i];
      if(w > 20 || h > 20) return err(4);
      var b = new BluePrint();
      state.blueprints2[i] = b;
      b.numw = w;
      b.numh = h;
      b.name = array4[i];
      b.data = [];
      b.tier = [];
      for(var y = 0; y < h; y++) {
        b.data[y] = [];
        b.tier[y] = [];
        for(var x = 0; x < w; x++) {
          var code = array2[index2++];
          b.data[y][x] = code;
          var tier = array3[index3++] - 1;
          b.tier[y][x] = tier;
        }
      }
    }
    if(index2 != array2.length) return err(4);
    if(index3 != array3.length) return err(4);
  }
  if(error) return err(4);


  section = 28; id = 0; // ethereal mistletoe
  if(save_version >= 262144*2+64*6+0) {
    prev = 0;
    var count = processStructArrayBegin();
    for(var i = 0; i < count; i++) {
      processStructBegin();
      var index = processUint();
      index += prev;
      if(!mistletoeupgrades[index]) continue; //obsolete non-existing (TODO: give error instead?)
      var m = mistletoeupgrades[index];
      var m2 = state.mistletoeupgrades[index];
      m2.num = processUint();
      m2.time = processTime();
      processStructEnd();
      prev = index;
    }
    processStructArrayEnd();
    state.mistletoeupgrade = processInt();
    state.mistletoeidletime = processTime();
  }
  if(error) return err(4);




  section = 29; id = 0; // field3
  if(save_version >= 262144*2+64*7+0) {
    state.numw3 = processUint();
    state.numh3 = processUint();
    if(error) return err(4);
    if(state.numw3 > 15 || state.numh3 > 15) return err(4); // that large size is not supported
    if(state.numw3 < 3 || state.numh3 < 3) return err(4); // that small size is not supported
    var w3 = state.numw3;
    var h3 = state.numh3;
    array0 = processIntArray();
    array1 = processFloat2Array();
    index0 = 0;
    index1 = 0;
    if(error) return err(4);
    for(var y = 0; y < h3; y++) {
      state.field3[y] = [];
      for(var x = 0; x < w3; x++) {
        state.field3[y][x] = new Cell(x, y, 3);
        var f = state.field3[y][x];
        f.index = array0[index0++];
        if(f.hasCrop()) {
          if(save_version >= 4096*1+9) f.growth = array1[index1++];
        }
      }
    }
    if(index0 > array0.length) return err(4);
    if(index1 > array1.length) return err(4);
  } else {
    clearField3(state);
  }




  section = 30; id = 0; // crops3
  if(save_version >= 262144*2+64*7+0) {
    array0 = processUintArray();
    array1 = processUintArray(); // had
    if(error) return err(4);
    if(array0.length != array1.length) return err(4);
    prev = 0;
    for(var i = 0; i < array0.length; i++) {
      var index = array0[i] + prev;
      prev = index;
      if(!crops3[index]) return err(4);
      state.crops3[index].unlocked = true;
      state.crops3[index].had = array1[i];
    }
  }


  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  // End of sections, post-processing
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // the amount may have changed, if e.g. a new/changed challenge has a different reward for it, ...
  var autoaction_count = numAutoActionsUnlocked(state);
  state.updateAutoActionAmount(autoaction_count);

  if(save_version <= 4096*1+73) {
    state.res.nuts = Num(0);
    state.g_res.nuts = Num(0);
    state.g_max_res.nuts = Num(0);
    state.g_max_prod.nuts = Num(0);
    state.c_res.nuts = Num(0);
    state.c_max_res.nuts = Num(0);
    state.c_max_prod.nuts = Num(0);
    state.p_res.nuts = Num(0);
    state.p_max_res.nuts = Num(0);
    state.p_max_prod.nuts = Num(0);
    state.crops[nut_0].unlocked = false;
    state.crops[nut_1].unlocked = false;
  }

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

    state.crops2[berry2_0].unlocked = true;
    state.crops2[mush2_0].unlocked = true;
    state.crops2[flower2_0].unlocked = true;
    state.crops2[fern2_0].unlocked = true;

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
    if(state.challenge == challenge_bees && !state.upgrades[brassicamul_0].unlocked) {
      state.upgrades[brassicamul_0].unlocked = true;
    }
  }

  // it was accidently storing these resources gotten at start of run from previous run, rather than end of current run.
  // displaying the ones you actually got from the run itself is more logical
  if(save_version < 4096*1+45) {
    state.c_res.resin = Num(0);
    state.c_res.twigs = Num(0);
    state.c_res.essence = Num(0);
  }

  if(save_version < 4096*1+78 && state.upgrades2[upgrade2_squirrel].count) {
    // the changes are only in the fourth stage
    if(state.squirrel_stages[3].num[1] > 0) {
      showMessage('One free squirrel respec token given due to squirrel upgrade changes');
      state.squirrel_respec_tokens++; // free respec token due to upgrade change
    }
  }

  if(save_version < 4096*1+78) {
    // some ethereal field crops got cheaper, refund if bought
    var num_berry = 0;
    var num_mush = 0;
    var multiplier = 1.5;
    var diff_berry = Num(75e6); // price went from 150e6 to 75e6
    var diff_mush = Num(50e6); // price went from 100e6 to 50e6
    var refund = Num(0);
    for(var y = 0; y < state.numh2; y++) {
      for(var x = 0; x < state.numw2; x++) {
        var f = state.field2[y][x];
        if(f.hasCrop()) {
          if(f.getCrop().index == berry2_3) refund.addInPlace(diff_berry.mulr(Math.pow(multiplier, num_berry++)));
          if(f.getCrop().index == mush2_3) refund.addInPlace(diff_mush.mulr(Math.pow(multiplier, num_mush++)));
        }
      }
    }
    if(state.upgrades2[upgrade2_field7x7].count) refund.addrInPlace(500e6);
    if(refund.neqr(0)) {
      showMessage('Some ethereal crops and upgrades were made cheaper, received refund of: ' + refund.toString() + ' resin');
    }
    state.res.resin.addInPlace(refund);
  }

  // fix medal accidently given out when not completed challenge
  if(save_version <= 4096*1+84 && !state.challenges[challenge_thistle].completed && state.medals[medal_challenge_thistle].earned) {
    state.medals[medal_challenge_thistle].seen = state.medals[medal_challenge_thistle].earned = false;
  }

  // a bug in v0.1.94 could cause NaN times, fix this as best as possible. Too bad this does mean some stats become inaccurate
  if(!isFiniteGE0(state.prevtime) || !isFiniteGE0(state.g_runtime)) {
    if(!isFiniteGE0(state.prevtime)) state.prevtime = util.getTime();
    if(!isFiniteGE0(state.g_pausetime)) state.g_pausetime = 0;
    if(!isFiniteGE0(state.g_runtime)) state.g_runtime = state.prevtime - state.g_starttime - state.g_pausetime;
    if(!isFiniteGE0(state.c_runtime)) state.c_runtime = state.prevtime - state.c_starttime;
    if(!isFiniteGE0(state.p_runtime)) state.p_runtime = state.c_starttime - state.p_starttime;
    for(var y = 0; y < state.numh; y++) {
      for(var x = 0; x < state.numw; x++) {
        var f = state.field[y][x];
        if(!isFiniteGE0(f.growth)) f.growth = 0;
      }
    }
    if(!isFiniteGE0(state.g_fastestrun)) state.g_fastestrun = 0;
    if(!isFiniteGE0(state.g_fastestrun2)) state.g_fastestrun2 = 0;
    if(!isFiniteGE0(state.g_slowestrun)) state.g_slowestrun = 0;
    if(!isFiniteGE0(state.g_slowestrun2)) state.g_slowestrun2 = 0;
    if(state.res.spores.ltr(0)) state.res.spores = Num(0);
    if(state.res.seeds.ltr(0)) state.res.seeds = Num(0);
  }

  // the initial infinity versions didn't save the date it got unlocked, restore it as good as approximately possible
  if(save_version < 262144*2+64*7+3) {
    state.infinitystarttime = 0;
    if(state.upgrades2[upgrade2_infinity_field].count) {
      var releasetime = 1666655999; // end of the day infinity field was released
      if(state.treelevel2 == 20) state.infinitystarttime = Math.max(releasetime, state.lasttree2leveluptime);
      else state.infinitystarttime = releasetime; // end of the day infinity field was released
    }
  }

  if(error) return err(4);
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
  updateAllPrestigeData();

  // do these computations once here, in case update() is not called such as when the save is paused
  computeDerived(state);
  precomputeField();

  // a few variables that are external to state
  Num.notation = state.notation;
  Num.precision = state.precision;

  resetGlobalStateVars(new_state);

  checkUnlockedAutomatonHelpDialogs();

  if(state.paused) showMessage(pausedMessage, undefined, undefined, undefined, undefined, undefined, /*opt_showlate0=*/true);
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

