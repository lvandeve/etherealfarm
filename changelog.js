/*
Ethereal Farm
Copyright (C) 2020-2021  Lode Vandevenne

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


function getChangeLog() {
  var text = '';

  text += '0.1.46 (2021-03-14):';
  // This is also in preparation for auto-plant, which is half-implemented but not yet its own update timing computations as that revealed the bugs with auto upgrade
  text += '<br/>• Bugfixes related to update timing and automaton computation.';
  text += '<br/>• Internal changes in preparation for future auto-plant feature (not yet finished).';
  text += '<br/>• Buttons to start challenges now show max reached level.';
  text += '<br/><br/>';

  text += '0.1.45 (2021-03-11):';
  // another option was to let ctrl do the replacing. But, actually, allowing holding shift to both plant and replace everything may be more convenient, shift always makes the selected plant appear on field, ctrl always deletes (except for planting watercress). And in addition, ctrl for delete also matches the fruits panel where ctrl moves it towards the sacrificial pool
  text += '<br/>• It\'s now possible to replace crops with shift+click. Deleting is now done with ctrl+click on a crop instead.';
  text += '<br/>• Last unlocked crop is now also set for shift+plant.';
  text += '<br/>• Automatic upgrades are now only done for best type of a crop in the field. This prevents spending resources on obsolete upgrades.';
  text += '<br/><br/>';

  text += '0.1.44 (2021-03-08):';
  text += '<br/>• Added more ethereal crops';
  text += '<br/>• Added next tiers of basic crops';
  text += '<br/>• Re-ordered some crop names. This has no effect on stats of current games, only visual/naming. This to keep the alphabetical tier ordering after inserting new ones, noting that amanita is sorted as "muscaria"';
  text += '<br/>• Some crop graphics redrawn, e.g. daisy for visible contrast in winter';
  text += '<br/>• Auto-upgrades no longer store undo';
  text += '<br/>• Various fixes';
  text += '<br/><br/>';

  text += '0.1.43 (2021-03-07):';
  text += '<br/>• Added a second stage to the no-upgrades challenge';
  text += '<br/>• Added more finetuning settings for auto-upgrades, unlocked by the new stage';
  // watercress remainder also when non-leeched neighbor types,changed some top bar icons, fixed/tweaked challenge completion counters, click upgrades on right pane to toggle auto-upgrades, add cost to ethereal "see unlocked crops", esc key closes top instead of all dialogs, ...
  text += '<br/>• Many other small tweaks';
  text += '<br/><br/>';

  text += '0.1.42 (2021-03-06):';
  text += '<br/>• Added auto-upgrade to the automaton, requires high enough ethereal tree level and a challenge to become available';
  text += '<br/>• Added the no-upgrades challenge';
  text += '<br/>• New fruits now appear in sacrificial slots rather than storage or active slots, except the first one ever';
  text += '<br/>• Fix tree level-up computation during long time intervals';
  text += '<br/>• Other tweaks and fixes';
  text += '<br/><br/>';

  text += '0.1.41 (2021-03-01):';
  text += '<br/>• Added the undeletable challenge';
  text += '<br/>• Increased rocks challenge reward target level from 12 to 15 (nothing changes if you already got it)';
  text += '<br/>• Crops that depend on planting a specific crop (nettle, mistletoe and beehive) now also unlock when next higher berry is unlocked';
  text += '<br/>• Clicking the text "stored fruits" in fruit tab now shows where you got each slot from';
  text += '<br/><br/>';

  text += '0.1.40 (2021-02-27):';
  text += '<br/>• Added automaton. Can automate the choice upgrades. More features planned for later game versions';
  text += '<br/>• Fixed high level flower boost accidently set too low';
  text += '<br/>• Various tweaks and fixes';
  text += '<br/><br/>';

  text += '0.1.39 (2021-02-25):';
  text += '<br/>• Added two more obtainable fruit storage slots, when seeing 1 or all seasonal fruits dropped for the first time (for existing saves, this starts from 0)';
  text += '<br/>• Various tweaks and fixes';
  text += '<br/><br/>';

  text += '0.1.38 (2021-02-22):';
  // Increased base of exponentiation both before and after Twigs Extraction upgrade. Twigs start lower to compensate, but starting at around level 15-20 they become more than before
  text += '<br/>• Increased twigs tree level multiplier, decreased starting value to compensate: higher tree levels now give more twigs.';
  // The goal for the balance changes is: spring gives mix of seeds/spores thanks to flowers, summer really gives some good berries, autumn really gives some good spores (and twigs), winter is special with the tree warmth (and gives extra resin)
  text += '<br/>• Season effect balancing: spring and summer should be competitive now.';
  // Now the boost is applied to entire season multiplier, so boost*mul rather than ((boost-1)*mul)+1. The old formula had unintended effect of making the different ethereal seasonal upgrades different in relative effect to each other
  text += '<br/>• Ethereal season upgrades improved and should now have same relative strength for each season.';
  text += '<br/>• Other minor tweaks & fixes.';
  text += '<br/><br/>';


  text += '0.1.37 (2021-02-20):';
  // resin increase, twig increase, 7x6 field, diagonal mistletoes. Cannot add higher upgrades yet because no idea what kind of resin amounts are appropriate for ethereal tree level 4
  text += '<br/>• Added new high level ethereal upgrades.';
  // it's a mushroom. can't add higher ones for higher level yet for same reason. a new berry or flower is more powerful, but the mushroom is the next one in line so it has to be this one
  text += '<br/>• Added a new high level ethereal crop.';
  // these include: winter hardening no longer reduces winter malus, resin accidently level + 1 fix, increased effect from the mist ability, now require 5 watercress before first upgrades unlock in new game, faster spawing ferns at game start, ...
  text += '<br/>• Other balance changes.';
  text += '<br/>• Added icons indicating what shift/ctrl click on field will do.';
  text += '<br/>• Changed spring leaves color into blossom color.';
  // more tooltip for ethereal tree, dialog size bugfix, don't mention nettles in bee challenge, remove ugly border from upgrades/fruit tabs, duration formatting tweaks, ethereal upgrades sorting order, auto update tree dialog on levelup, ...
  text += '<br/>• Other UI tweaks';
  text += '<br/><br/>';

  text += '0.1.36 (2021-02-16):';
  text += '<br/>• Twigs now receive the 2x, 3x, ... higher transcenscion bonus like resin does.';
  text += '<br/>• Twigs gain reduced for lower tree levels, but when reaching tree level 20+ this update is a net win.';
  text += '<br/>• Twigs are now given at transcension rather than immediately.';
  text += '<br/>• Rocks challenge now also gives twigs.';
  text += '<br/><br/>';

  text += '0.1.35 (2021-02-14):';
  text += '<br/>• Added electrum and gold tier fruits. Electrum starts having a chance to drop at level 35.';
  text += '<br/>• Added seasonal fruits with extra inherent seasonal ability, can drop with lower probability then regular fruits.';
  text += '<br/><br/>';

  text += '0.1.34 (2021-02-13):';
  text += '<br/>• Added next higher level crop types for berry, mushroom and flower.';
  text += '<br/>• Autumn mushroom boost increased, and now also boosts mistletoe twigs.';
  text += '<br/>• Buffed the ethereal grow speed upgrade.';
  text += '<br/>• Made more clearly defined colors for the metal tiers (used in medals, fruits, ...).';
  text += '<br/>• HTML ARIA annotation improvements.';
  text += '<br/><br/>';

  text += '0.1.33 (2021-02-08):';
  text += '<br/>• Some challenges can have tree resin, fruit and/or twigs drop now.';
  text += '<br/>• Side panel upgrade tooltips now also show cost and growtime of the related plant itself.';
  text += '<br/>• Other UI tweaks.';
  text += '<br/><br/>';

  text += '0.1.32 (2021-02-07):';
  text += '<br/>• Added the "rocks" challenge, available at tree level 15.';
  text += '<br/>• Added ethereal upgrades for fruit slots.';
  text += '<br/>• Other balancing.';
  text += '<br/><br/>';

  text += '0.1.31 (2021-02-07):';
  // The fern boost idea had a problem: the bigger the boost, the more important ferns become, especially for future fruits, but ferns are an active play thing, and this would make the difference between active and passive too large
  // The nettle boost should be a very powerful replacement of this.
  text += '<br/>• Changed fern boost fruit ability into nettle boost.';
  text += '<br/>• Brought back the "refund for still growing plant" and made achievements based on fullgrown plants again: it turns out the QoL of this feature was more important.';
  text += '<br/>• Added a side panel with extra info and shortcut upgrade buttons. This only appears if the screen is wide enough.';
  // refresh watercress button, estimated time in the "need more resources" messages of plants and researches, grayed fruit ability buttons if can't afford, ...
  text += '<br/>• Other UI tweaks.';
  text += '<br/><br/>';

  text += '0.1.30 (2021-02-06):';
  // achievements for #plants got changed from "when fullgrown" to "when planted" to give faster feedback to your action. But that allows abuse with the refund of growing plant feature.
  text += '<br/>• Removed the "refund still growing plant" feature since it allowed some achievement related abuse. Use the undo button instead.';
  text += '<br/>• Tweaked the undo button: min time between saving undo now 10 seconds instead of 1 minute (lose less work when using undo, use export save for longer term things).';
  // better num-transcension achievement bonuses, better mushroom economy fruit bonus, blackberry secret unlocks blueberry upgrade from start
  text += '<br/>• Balancing changes (mostly slight buffs).';
  // not a 100% fix since the game can't get more info than local clock vs what is in savegame, but avoids situations like not having ferns for hours
  text += '<br/>• Fix issues related to playing on multiple computers with different UTC time set.';
  text += '<br/>• Various bee challenge bugfixes and tweaks.';
  text += '<br/>• Mushrooms now try to consume all resources of private berry before berries shared with other mushrooms.';
  text += '<br/><br/>';

  text += '0.1.29 "Bee update" (2021-02-06):';
  text += '<br/>• Added the bee challenge, which unlocks when planting a daisy (third tier flower, so it requires significant progress in the game to reach).';
  text += '<br/>• Added beehives, only available after successfully completing the bee challenge.';
  text += '<br/>• Since the necessary logic for challenges in general is added to the game for this, more will be added later.';
  text += '<br/><br/>';

  text += '0.1.28 (2021-02-03):';
  text += '<br/>• Fixed a bug with the previous runs level/time statistics.';
  text += '<br/>• Various other UI tweaks and fixes.';
  text += '<br/>• A larger update (bees) is coming soon, still work in progress.';
  text += '<br/><br/>';

  text += '0.1.27 (2021-01-29):';
  // The cooldown ability caused weird interaction with the timings of the weather and may require too much manual work with swapping in/out the fruit
  text += '<br/>• Changed fruit weather cooldown ability into weather boost.';
  text += '<br/>• Fixed issue with ethreal grow speed upgrade soft capping, now it should no longer accidently increase some times.';
  text += '<br/>• Various UI fixes.';
  text += '<br/><br/>';

  text += '0.1.26 (2021-01-28):';
  text += '<br/>• Minor numerical and UI fixes.';
  text += '<br/><br/>';

  text += '0.1.25 (2021-01-27):';
  text += '<br/>• Fixed a minor exploit with ferns.';
  text += '<br/>• Removed support for savegames before 0.1.7, a very old version that normally isn\'t in use anywhere anymore but added complexity to the codebase to support.';
  text += '<br/><br/>';

  text += '0.1.24 (2021-01-26):';
  text += '<br/>• Renamed watercress "leech" to "copy". It\'s still the exact same effect, but the name copy is more clear, since it is a strictly positive effect.';
  text += '<br/>• Increased weather cooldown, growth speed and mushroom economy effects of fruits.';
  text += '<br/>• "w" keyboard shortcut now also replants existing watercress.';
  text += '<br/>• More UI tweaks and fixes.';
  text += '<br/><br/>';

  text += '0.1.23 (2021-01-24):';
  text += '<br/>• UI tweaks and fixes.';
  text += '<br/><br/>';

  text += '0.1.22 (2021-01-24):';
  text += '<br/>• Added dark mode UI. Option available under preferences.';
  text += '<br/>• Added support for CSS stylesheets for this.';
  text += '<br/>• Made all unlocked dynamic in-game help dialogs available in the main help from the settings. More appear as more get unlocked during the game progression.';
  text += '<br/><br/>';

  text += '0.1.21 (2021-01-24):';
  text += '<br/>• Added achievements chips when new achievement unlocked.';
  text += '<br/>• Other related UI tweaks: latin number tweaks, tooltip infos';
  text += '<br/><br/>';

  text += '0.1.20 (2021-01-23):';
  text += '<br/>• New mechanic: mistletoes, twigs resource and ethereal tree leveling.';
  text += '<br/>• Added new ethereal upgrades and crops, both first-tier and higher ethereal-tree-level-tier ones.';
  text += '<br/>• Made ethereal season upgrades cheaper (2x instead of 10x cost scaling).';
  text += '<br/>• Increased ethereal blackberry and champignon boosts from 20% to 25%.';
  text += '<br/>• Other balance tweaks: more medal bonuses, higher level plants tweaked, ...';
  // the name "mist" fits the ethereal theme better than the name "fog"
  text += '<br/>• Renamed "fog ability" to "mist ability".';
  text += '<br/>• Added help dialog system plus preferences for this';
  text += '<br/><br/>';

  text += '0.1.19 (2021-01-17):';
  text += '<br/>• Improved winter: still has the harsh effect, but also has positive effect for crops next to tree ("winter tree warmth"), and makes the tree produce more resin when it levels up.';
  // The issue here was: there are ethereal upgrades for each season. Since spring/summer/autumn had positive effects, they become better and better. Winter has negative effect, only so much can be removed from that, making winter relatively worse and worse compared to other seasons. By having the positive tree effect and infinite additive upgrade for it, winter stays reasonable compared to the other seasons.
  text += '<br/>• Ethereal winter upgrade now more useful: also upgrades those positive winter effects.';
  text += '<br/>• Added more info about season effects to the dialog gotten from clicking the time/season indicator.';
  text += '<br/><br/>';

  text += '0.1.18 (2021-01-17):';
  // The previous formula of starting resources didn't help much after a while, the new formula makes it so that you can unlock and plant a berry almost immediately at the third fern, and get blueberry from the beginning if you have many of them, so now the ferns make an actual useful difference.
  text += '<br/>• Increased starter resources of ethereal fern.';
  text += '<br/>• Fixed bugs related to leeching and transcension II.';
  text += '<br/><br/>';

  text += '0.1.17 "Fruit update" (2021-01-16):';
  text += '<br/>• Added fruits.';
  // Because possibly future updates will allow making weather more passive than active, but then there should be a choice between which you have available, all three permanently on is uninteresting.
  text += '<br/>• Only one weather ability can be active at the same time now.';
  text += '<br/><br/>';

  text += '0.1.16 (2021-01-09):';
  text += '<br/>• Added ethereal lotus. Lotus now boosts ethereal neighbors, while clover boosts basic flowers.';
  text += '<br/>• Added more ethereal upgrades';
  text += '<br/>• Added more achievements';
  text += '<br/>• Ethereal mushroom bonus improved: no longer increases consumption.';
  text += '<br/>• Leeching watercress now leaves a "ghost" remainder when it disappears. No effect, visual reminder of leech spot only.';
  text += '<br/>• Spore costs and production inflated times 6.66666, no actual consequence other than display, to avoid values with very small exponent with first mushroom.';
  text += '<br/><br/>';

  text += '0.1.15 (2021-01-08):';
  text += '<br/>• Swapped fog and sun ability (sun is now unlocked first).';
  text += '<br/>• Improve UI of "choice" upgrades to be single upgrade with a choice dialog';
  text += '<br/>• Increased unused resin bonus 10x';
  text += '<br/>• Increased amount of starter resources from ethereal fern and made it scale quadratically';
  text += '<br/>• Can now only delete new ethereal crops after next transcension';
  text += '<br/>• Bugfixes';
  text += '<br/><br/>';


  text += '0.1.14 (2020-12-30):';
  text += '<br/>• Ethereal crops now give 100% resin back on delete, but require ethereal deletion tokens.';
  text += '<br/>• Buffed watercress to have a more meaningful upgrade for the early game experience.';
  text += '<br/>• Added a few more achievements.';
  text += '<br/><br/>';


  text += '0.1.13 (2020-12-30):';
  text += '<br/>• Mushrooms now only get seeds from neighbors, so they can\'t produce spores if they don\'t have berries as neighbors in the field.';
  text += '<br/>• The global overconsumption system has been removed since this now takes place locally amongst groups of mushroom/berry neighbors.';
  text += '<br/>• Nettles now also negatively affect neighboring flowers, instead of only berries.';
  text += '<br/>• Leech effect takes the extra seeds consumption through the mushrooms neighboring producers.';
  text += '<br/>• Internal field production algorithm updated to support the neighbor-based consumption/production effects.';
  text += '<br/>• Trees still consume spores globally, mushrooms are not required to be next to the tree. Maybe this makes sense in a future update but it may cause an issue of discoverability when one doesn\'t yet know you want to upgrade the tree.';
  text += '<br/>• The goal of this is to add more crop interaction and positional elements to the game';
  text += '<br/><br/>';


  text += '0.1.12 (2020-12-28):';
  text += '<br/>• Fix accidental 7x7 field bug, 6x6 is currently the maximum if the relevant upgrade is purchased.';
  text += '<br/><br/>';

  text += '0.1.11 (2020-12-27):';
  text += '<br/>• Added back ethereal upgrades (2 for now), now costing resin. The 6x6 field size upgrade is now actually reachable.';
  text += '<br/><br/>';


  text += '0.1.10 (2020-12-26):';
  text += '<br/>• Internal fixes.';
  text += '<br/><br/>';

  text += '0.1.9 (2020-12-26):';
  text += '<br/>• The resin and transcension system has been redesigned. There are now multiple ethereal field plant types and they give direct boosts to the basic field. All resin has been refunded and can be re-used with the new system.';
  text += '<br/>• The pericarps resource has been removed from the game. Nothing is lost from this since only its production per second ("ethereal field power") was used and this was determined by resin which has been refunded.';
  text += '<br/>• Unused resin also gives a small boost now.';
  text += '<br/>• The ethereal upgrades (which used to cost ethereal field power) are currently removed (and replaced by ethereal plant effects instead), but new ones, probably costing resin, may be added back in a future game update.';
  text += '<br/>• A few other minor tweaks, e.g. the savegame now remembers which tab you had open and the assigned shift key plant.';
  text += '<br/><br/>';

  text += '0.1.8 (2020-12-24):';
  text += '<br/>• Changed the savegame format internally to be more compatible with future updates.';
  text += '<br/>• Minor tweaks and fixes.';
  text += '<br/><br/>';

  text += '0.1.7 (2020-12-23):';
  text += '<br/>• Added new plant type: watercress, and made it the starter plant. Also remains important as non-idle (active) plant throughout the game.';
  text += '<br/>• Nerfed costs and production of other plants to compensate the watercress power.';
  text += '<br/>• Added "a" keyboard shortcut for abilities.';
  text += '<br/><br/>';

  text += '0.1.6 (2020-12-22):';
  text += '<br/>• Added undo button.';
  text += '<br/>• Removed the free replant of same plant type at same spot since undo can be used instead now.';
  text += '<br/>• Weather abilities unlock immediately rather than through extra upgrade step, and merged their choice upgrades.';
  text += '<br/><br/>';

  text += '0.1.5 (2020-12-21):';
  text += '<br/>• Added new plant type: nettle';
  text += '<br/>• Added estimated time counters to several cost tooltips';
  text += '<br/>• Balancing tweaks';
  text += '<br/>• Increased ethereal upgrades but still very conservative for now as first run can still get balanced more';
  text += '<br/><br/>';

  text += '0.1.4 (2020-12-20):';
  text += '<br/>• Added "choice" upgrades';
  text += '<br/>• Added a third weather ability';
  text += '<br/>• Made higher level mushrooms produce more spores';
  text += '<br/><br/>';

  text += '0.1.3 (2020-12-19):';
  text += '<br/>• Added weather abilities';
  text += '<br/>• Balancing: slightly cheaper 3rth and higher tier plants';
  text += '<br/><br/>';

  text += '0.1.2 (2020-12-19):';
  text += '<br/>• Slightly boosted fern and it can now also give spores';
  text += '<br/>• Tweaked the upgrade-button UI';
  text += '<br/><br/>';

  text += '0.1.1 (2020-12-18):';
  text += '<br/>• Balance changes: fixed too slow beginning of game, but also the too powerful long term upgrade scaling';
  text += '<br/><br/>';

  text += '0.1.0 (2020-12-18):';
  text += '<br/>• Initial test release, no patches applied yet';
  text += '<br/>• Since this is a first alpha release, balancing and mechanics can still change quite bit!';
  text += '<br/><br/>';

  return text;
}

