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


// release version. format is as follows: number is made as: 4096*MAJOR + MINOR
// meaning:
// -major: 0..63 represents decimal 0.0..6.3, e.g. 1 to set to version 0.1, 10 to set to version 1.0.
// -minor: 0..4095: increment for any minor features and fixes, e.g. if major has value 1 and this has value 1234, then the version is shown as 0.1.1234
var version = 4096*1+38;

// sub-version: if non-0, adds 'b', 'c'. ... to the version name.
// Should not affect savegame format. No changelog entry needed.
// Cosmetic changes only. Version name including this part is appended to CSS URL query part to ensure no stale cached CSS file is used.
var version_sub = 0;

function formatVersion() {
  var a = '' + ((version >> 12) / 10.0);
  if(a.length == 1) a += '.0';
  var b = '' + (version & 4095);
  if(version_sub == 1) b += 'b';
  if(version_sub == 2) b += 'c';
  if(version_sub == 3) b += 'd';
  if(version_sub == 4) b += 'e';
  return a + '.' + b;
}

document.title = programname + ' v' + formatVersion();

showMessage('Welcome to ' + programname + ' v' + formatVersion(), 'yellow', 'gray');

function begin() {
  initUI();
  update();
  util.setIntervalSafe(function() {
    update(true);
  }, 333);
}

loadFromLocalStorage(function() {
  showMessage(loadedFromLocalStorageMessage, '#888');
  begin();
}, function() {
  // failed to load from local storage
  postload(createInitialState()); // same as hard reset
  begin();
});

undoSave = util.getLocalStorage(localstorageName_undo, '');

// do not auto save if no action was ever taken
function autoSaveOk() {
  if(savegame_recovery_situation) {
    // in the recovery situation, only autosave if the user has decided to advance rather far in the newly-created game: not only planted something but even did an upgrade.
    return state.g_numupgrades > 0;
  }

  if(state.g_numresets > 0 || state.g_numferns > 0 || state.g_nummedals > 0 || state.g_numplanted > 0 || state.g_numplantedshort > 0) {
    return true;
  }

  return false;
}

var window_unloading = false;

window.onbeforeunload = function() {
  window_unloading = true;
  if(!state.saveonexit) return;
  if(autoSaveOk()) {
    saveNow();
  }
};
