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

var localstorageName = window['localstorageNameHTML'] ? window['localstorageNameHTML'] : 'local';
var localstorageName_recover = localstorageName + '_recover'; // backup of a corrupt save that failed to load
var localstorageName_success = localstorageName + '_success'; // backup of a last known good loaded save (from local storage; if import save is used, it's assumed the user has that save in a text file)
var localstorageName_prev_version = localstorageName + '_prev_version'; // backup of last save saved by a previous game version
var localstorageName_prev_version2 = localstorageName + '_prev_version2'; // backup of last save saved by two versions ago: imagine some game version introduces a savegame-breaking bug, and then a next version attempts to fix it but it still goes wrong, then hopefully a save from 2 versions ago can still cause recovery
var localstorageName_manual = localstorageName + '_manual'; // backup of last manual save (with the "save now" button)
var localstorageName_undo = localstorageName + '_undo'; // backup of last "undo" save
var localstorageName_transcend = localstorageName + '_transcend'; // backup before last transcend
var importfailedmessage = 'invalid savegame';
var importedmessage = 'imported save';
var loadlocalstoragefailedmessage = 'Loading failed. Copy the saves in the dialog for recovery, or else you may lose it forever. If the dialog got closed, refresh to see it again, or copypaste the saves printed above instead, they are the same recovery saves, make sure to copy all (it is scrolled up and to the right).';
var loadfailreason_toosmall = 'Loading fail reason: the string is too short to be a savegame';
var loadfailreason_notbase64 = 'Loading fail reason: not base64';
var loadfailreason_signature = 'Loading fail reason: invalid signature';
var loadfailreason_checksum = 'Loading fail reason: checksum mismatch';
var loadfailreason_toonew = 'Loading fail reason: savegame is from later version than current game version';
var loadfailreason_tooold = 'Loading fail reason: savegame is from an early preview version of the game and no longer supported';
var loadfailreason_format = 'Loading fail reason: parsing format';
var loadfailreason_decompression = 'Loading fail reason: decompression';
var programname = 'Ethereal Farm';
var autoSavedStateMessage = 'Auto-saved state locally';
var autoSavedStateMessageWithReminder = 'Auto-saved state locally. Reminder: make a manual savegame backup or risk losing everything. Use "export save" under settings.';
var manualSavedStateMessage = 'Manually saved state locally';
var loadedFromLocalStorageMessage = 'Loaded local save';
var hardresetwarning = 'Perform a hard reset. This removes all savegame data, deletes your entire game and starts a new game from the beginning.\n\nWARNING: This is not a soft reset: nothing is kept, everything will be deleted, including achievements, settings and recovery saves. This starts over with a new, blank, savegame, and cannot be reverted. Are you sure you want to do this?';
var shiftClickPlantUnset = 'shift+click repeats last planted plant, but no last plant is set, plant the regular way first';
var leechInfo = 'Copy ability: if this plant has resource-producing long-lived neighbors (orthogonal, not diagonal) of type berry or mushroom, the watercress will duplicate all their production (but also consumption), no matter how high their tier! This has diminishing returns if there are multiple watercress plants in the entire field, max 1 or 2 watercress makes sense. A badly placed watercress can even negatively affect the copying of all others. If you have no other crop types this is not yet relevant, plant as many watercress as you want then!';



// for any message about help/progression/tutorial
var helpFG = '#0ff';
var helpBG = '#044';
// variant 2 exists to make a new help message distinguishable compared to an old one, so the eye can catch the change in the log
var helpFG2 = '#4ff';
var helpBG2 = '#088';

// for any message regarding invalid actions (such as not enough resources for something)
var invalidFG = '#fee';
var invalidBG = '#400';
