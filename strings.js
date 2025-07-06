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

var localstorageName = window['localstorageNameHTML'] ? window['localstorageNameHTML'] : 'local';
var localstorageName_recover = localstorageName + '_recover'; // backup of a corrupt save that failed to load
var localstorageName_success = localstorageName + '_success'; // backup of a last known good loaded save (from local storage; if import save is used, it's assumed the user has that save in a text file)
var localstorageName_prev_version = localstorageName + '_prev_version'; // backup of last save saved by a previous game version
var localstorageName_undo = localstorageName + '_undo'; // the "undo" save, which persists through refreshes. also used as "mirror" when loading when the main savegame is missing while this one exists
var localstorageName_daily1 = localstorageName + '_daily1';
var localstorageName_daily2 = localstorageName + '_daily2';
var importfailedmessage = 'Invalid savegame';
var importedmessage = 'imported save';
var loadlocalstoragefailedmessage = 'Loading failed. Copy the saves in the dialog for recovery, or else you may lose it forever. If the dialog got closed, refresh to see it again, or copypaste the saves printed above instead, they are the same recovery saves, make sure to copy all (it is scrolled up and to the right).';
var loadfailreason_toosmall = 'Loading fail reason: the string is too short to be a savegame';
var loadfailreason_toolarge = 'Loading fail reason: the string is too large to be a savegame';
var loadfailreason_notbase64 = 'Loading fail reason: not base64';
var loadfailreason_signature = 'Loading fail reason: invalid signature';
var loadfailreason_checksum = 'Loading fail reason: checksum mismatch';
var loadfailreason_toonew = 'Loading fail reason: savegame is from later version than current game version';
var loadfailreason_tooold = 'Loading fail reason: savegame is from an early preview version of the game and no longer supported';
var loadfailreason_format = 'Loading fail reason: format structure';
var loadfailreason_decompression = 'Loading fail reason: decompression';
var loadfailreason_beta = 'Loading fail reason: savegame is from a beta version';
var loadfailreason_unknown = 'Loading fail reason: unknown';
var programname = 'Ethereal Farm';
var autoSavedStateMessage = 'Auto-saved state locally';
var autoSavedStateMessageWithReminder = 'Auto-saved state locally. Reminder: make a manual savegame backup or risk losing everything. Use "export save" under settings.';
var manualSavedStateMessage = 'Manually saved state locally';
var loadedFromLocalStorageMessage = 'Loaded local save';
var loadedFromLocalImportMessage = 'Imported save';
var hardresetwarning = 'Performs a hard reset. This removes all savegame data, deletes your entire game and starts a new game from the beginning.\n\nWARNING: This is not a soft reset: nothing is kept, everything will be deleted, including achievements, settings and recovery saves. This starts over with a new, blank, savegame, and cannot be reverted. Are you sure you want to do this?';
var shiftClickPlantUnset = 'shift+click, or p, repeats last planted plant, but no last plant is set, plant the regular way first';
var leechInfo = 'Copy ability: if this plant has orthogonal (non-diagonal) berry or mushroom neighbors, the watercress will duplicate all their production (but also consumption), no matter what tier. This has diminishing returns if there are multiple watercress in the field, max 2 watercress makes sense. A badly placed watercress can negatively affect the copying of others. At early game, having many watercress is useful though due to their regular (non-copy) production.';
var pausedMessage = 'game paused';
var unpausedMessage = 'game resumed from pause';
var autoBlueprintHelp = `
The automatic blueprint is useful to get a different layout later in the run than at the start of the run. You choose your starting blueprint as usual at the start of the run, the automaton will override with the chosen one. You can also choose a fruit to match.
<br><br>
During some challenges you may want this disabled, toggle it off in the automaton tab in this case.
`;
var boostableCrop2Hint = 'Boosted by lotuses and other special ethereal neighbors';

