/*
Ethereal Farm
Copyright (C) 2020-2024  Lode Vandevenne

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


// release version. format is as follows: number is made as: 262144*(MAJOR+2) + 64*MINOR + PATCH
// meaning:
// -major: 0..61, only incremented for really game changing updates. Encoded starting at -2 instead of 0 (so major version 0 is encoded as 2) for compatibility with an older version number format in saves.
// -minor: 0..4095: increment for any significant new feature, such as a new challenge, new ethereal crops, ...
// -patch: 0..63: increment for small bugfixes, ...
// -sub: 0..any: does not change the numeric version code. if non-0, adds 'b', 'c'. ... to the version name. Should not affect savegame format. Cosmetic changes only. Version name including this part is appended to CSS URL query part to ensure no stale cached CSS file is used.
var version_major = 0; // 0..61
var version_minor = 12; // 0..4095
var version_patch = 1; // 0..63
var version_sub = 0; // 0=no suffix, 1=b, 2=c, ...

var version = 262144 * (version_major + 2) + 64 * version_minor + version_patch;

function formatVersion() {
  var result = '' + version_major + '.' + version_minor + '.' + version_patch;
  if(version_sub > 0) result += String.fromCharCode(97 + version_sub);
  if(window['global_is_beta']) result += ' BETA';
  return result;
}

function getProgramName() {
  if(window['global_is_beta']) return 'Beta ' + programname; // prepend this so it's also visible in mobile browser history/tab selectors which often strip away all but the first few characters from the title
  return programname;
}

document.title = getProgramName() + ' v' + formatVersion();

showMessage('Welcome to ' + programname + ' v' + formatVersion(), C_META, 0, 0);

var update_ms = 333;

function begin() {
  util.setIntervalSafe(function() {
    update();
  }, update_ms);
}

loadFromLocalStorage(function() {
  showMessage(loadedFromLocalStorageMessage, C_UNIMPORTANT, 0, 0);
  begin();
}, function() {
  // failed to load from local storage, e.g. it's a fresh new game
  postload(createInitialState()); // same as hard reset
  initUI();
  begin();
});

undoSave = util.getLocalStorage(localstorageName_undo, '');

// do not auto save if no action was ever taken
function autoSaveOk() {
  if(savegame_recovery_situation) {
    // in the recovery situation, only autosave if the user has decided to advance rather far in the newly-created game: not only planted something but even did an upgrade.
    return state.g_numupgrades > 0;
  }

  if(state.g_numresets > 0 || state.g_numferns > 0 || state.g_nummedals > 0 || state.g_numplanted > 0 || state.g_numplantedbrassica > 0) {
    return true;
  }

  return false;
}

var window_unloading = false;

// this only works reliably for closing tabs, not for closing browser or shutting down computer
window.onbeforeunload = function() {
  window_unloading = true;
  if(!state.saveonaction) return;
  // ensure to call the onclose function of some dialogs, for example configure automaton autochoice temporarily changes the state and only its onclose function restores it, ensure that's done before saving
  for(var i = 0; i < created_dialogs.length; i++) {
    if(created_dialogs[i].onclose) created_dialogs[i].onclose();
  }
  if(autoSaveOk()) {
    saveNow();
  }
};
