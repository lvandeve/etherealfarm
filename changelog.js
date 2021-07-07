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

  text += '0.1.80 (2021-07-07):';
  text += '<br/>• Balancing to ensure getting best resin/hr after not too short runtimes:';
  text += '<br/> - tweaked growtime of early vs late tier crops';
  text += '<br/> - higher tier mushrooms now give more spores per seed rather than less spores per seed, this is a buff';
  // automaton can be toggles on/off while paused, adding 1hr to season duration with amber now also works when it makes season longer than 24h, "time of full time" info for crop grow times, and other UI and spelling fixes
  text += '<br/>• Various other tweaks and fixes';
  text += '<br/><br/>';

  text += '0.1.79 (2021-06-20):';
  text += '<br/>• Added new ethereal upgrades, at levels 5 and 6.';
  text += '<br/>• Tweaked upgrade prices of berries and mushrooms so that they can\'t be cheaper than the next tier crop for the same production. This formula change makes them cheaper for lower tier crops but more expensive for higher. The new ethereal upgrades more than make up for this.';
  text += '<br/>• UI tweaks and fixes';
  text += '<br/><br/>';

  text += '0.1.78 (2021-06-11):';
  text += '<br/>• Reworked second part of the squirrel upgrade tree, replaced seasonal upgrades with new, different, ones. This solves unintended need for squirrel respeccing per season.';
  text += '<br/>• Free squirrel respec token for those who reached that part of the squirrel upgrades, due to those changes';
  text += '<br/>• It\'s now possible to do many squirrel upgrades in 1 click after respec (shift+click or new button after clicking the icon)';
  text += '<br/>• Turned the removed seasonal squirrel upgrades into 4 new ethereal upgrades.';
  text += '<br/>• Made the ethereal crops and upgrades from the previous update cheaper, and refunded the difference.';
  text += '<br/>• Added fifth nuts crop tier.';
  text += '<br/>• Added achievements for 40 crops (these do not work retroactively).';
  text += '<br/>• Added runtime to the best resin/hr and twigs/hr stats.';
  text += '<br/>• Bugfixes and UI style tweaks.';
  text += '<br/><br/>';

  text += '0.1.77 (2021-06-06):';
  text += '<br/>• Added new ethereal crops and upgrade (a new field size).';
  text += '<br/>• Added season shorten/lengthen amber abilities.';
  text += '<br/>• Tweaks and fixes.';
  text += '<br/><br/>';

  text += '0.1.76 (2021-06-03):';
  text += '<br/>• Added new ethereal crops.';
  text += '<br/>• Multi-season fruits now also give a slightly higher boost than the standard counterparts.';
  text += '<br/>• Added fourth nut crop tier.';
  text += '<br/>• UI style tweaks.';
  text += '<br/><br/>';

  text += '0.1.75 "Squirrel update part 2" (2021-05-29):';
  text += '<br/>• Added 20 new squirrel upgrades. Free respec token given so you can respec if desired';
  text += '<br/>• Added a third nut tier, and renamed tiers, the tiers are now: acorn, almond, brazil nut.';
  // The nuts are now such that a single nut tier lasts around 6 tree levels instead of 3, but a tier multiplies production by 1000x (3 squirrel upgrades worth) instead of 10x, hence the big buff: 3 squirrel upgrades per 6 tree levels, instead of 1 per 3 tree levels
  text += '<br/>• Tweaked the nuts cost and production to allow more squirrel upgrades: higher tiers are more expensive, but produce even more, and upgrades do more, so there is a better nuts/spores ratio. Due to the new higher cost and power of higher tiers, in older saves nuts crops are replaced by acorn.';
  text += '<br/>• Fruit fusing now auto-levels abilities after fusing and spends essence on this, but it never levels them higher than before fusing and leaves some essence available if a new unupgraded ability was added';
  text += '<br/>• Added ability to override field with blueprint (rather than not touch existing crops), using shift+click on the "To Field" button. Matching crops will be kept, but non matching ones replaced.';
  text += '<br/><br/>';

  text += '0.1.74 "Squirrel update" (2021-05-24):';
  text += '<br/>• Added squirrel, nuts resource and nuts crops (unlocks at ethereal tree level 5).';
  text += '<br/>• Added amber resource and amber processor.';
  text += '<br/>• Added a prelimenary small set of squirrel upgrades and amber effects to test-run the feature for now, next releases will add more content: more nut crops tiers, squirrel tech tree with interesting choices reaching beyond the nuts production limits.';
  text += '<br/>• Made the colors of spring and summer more easily distinguishable from each other.';
  text += '<br/><br/>';

  text += '0.1.73 (2021-05-20):';
  // pause related bug, number format setting not updating right pane, wrong challenge bonus display in tree challenge dialog
  text += '<br/>• Bugfixes.';
  text += '<br/>• More internal changes for next update.';
  text += '<br/><br/>';

  text += '0.1.72 (2021-05-15):';
  text += '<br/>• Paused state is now saved in savegames.';
  text += '<br/>• Many internal changes for the next update, not visible or usable at this time.';
  text += '<br/><br/>';

  text += '0.1.71 (2021-05-09):';
  text += '<br/>• Added a pause button. Pause halts all progress, including seasons.';
  text += '<br/>• Various fixes, including beehive in winter accidently too low.';
  text += '<br/>• Development on next major feature is under way.';
  text += '<br/><br/>';

  text += '0.1.70 (2021-05-07):';
  text += '<br/>• The default location of back/cancel buttons in dialogs is now rightmost instead of leftmost if there are multiple bottom buttons. You can get back the original behavior in the preferences. Reason: with rightmost enabled, back buttons align, preventing accidental transcend or other action clicks when closing multiple dialogs in a row.';
  text += '<br/>• Various fixes';
  text += '<br/><br/>';

  text += '0.1.69 (2021-05-06):';
  text += '<br/>• Rockier challenge now keeps max level of each of the 5 maps separately, and gives separate bonus for each';
  text += '<br/>• Challenge highest level bonus now scales better for higher levels: instead of fixed bonus per level, it gives bonus per level^1.1';
  // reason for changing the transcend with blueprint shortcut: ctrl+shift click in blueprint dialog doesn't show the challenges. Showing the real transcension dialog with t first, shows the challenge button and its indication if there's a new challenge. Also, the new shortcut is in fact shorter (sum of #keys and #mouseclicks is 3 instead of 4)
  text += '<br/>• Replaced blueprint ctrl+shift shortcut by a new transcend-with-blueprint dialog. The fastest shortcut to transcend with blueprint is now: "t", then "b", then click chosen blueprint.';
  text += '<br/>• Bronze fruits are now only introduced at tree level 15, and silver at 25. Later level fruit drop rates are not affected by this change.';
  text += '<br/><br/>';

  text += '0.1.68 (2021-05-01):';
  text += '<br/>• Added rockier challenge (unlocks at high enough tree level)';
  text += '<br/>• Added the multiplicity mechanism, a bonus based on amount of crops, as reward of rockier challenge';
  text += '<br/>• Automaton now chooses good spots first for next auto-plant, rather than go from top to bottom';
  text += '<br/>• Added season effect stats to player stats dialog, and other UI tweaks';
  text += '<br/><br/>';

  text += '0.1.67 (2021-04-29):';
  text += '<br/>• Fruits of different types can be fused again (e.g. pineapple with pear), but the result will always be an apple. So fusing a perfect seasonal fruit is still rare, but you can use them for fusing regular fruits if desired.';
  text += '<br/>• Fruits now remember the random free starting levels of abilities. Fusing can now also preserve these, if two abilities are fused the result is between the two values.';
  text += '<br/>• The first mistletoe no longer reduces resin income or tree leveling speed. Second and higher mistletoes still do.';
  text += '<br/>• Bugfixes and tweaks.';
  text += '<br/><br/>';

  text += '0.1.66 (2021-04-26):';
  text += '<br/>• Automaton in ethereal field now gives a boost to 8 neighbors, similar to the lotus 4-neighbor boost but as its own separate multiplier.';
  text += '<br/>• You can now delete the entire ethereal field for 4 ethereal delete tokens.';
  text += '<br/>• Added some missing challenge achievements.';
  text += '<br/><br/>';

  text += '0.1.65 (2021-04-25):';
  text += '<br/>• New ethereal upgrades at levels 4 and 5 (ethereal berry and mushroom upgrade, ethereal field 7x6, fruit slot)';
  text += '<br/>• New ethereal crop (morel)';
  // This makes fern worth something if the game was left in the background for a long time: it'll have a relevant resource amount
  text += '<br/>• If fern left for a long time, will update its internal resources if higher. This does not benefit active play, time interval is at least as long as waiting for a new fern.';
  text += '<br/>• Added more stages to the rocks challenge handing out more fruit slots.';
  // Reason for this change: the fusing is there to circumvent the RNG when it takes too long to get the combination you want
  // However, the rare fruit types now became too trivial to create, they should still be significantly harder to perfectionize, so now you need all fruits of that type as ingredients
  text += '<br/>• Fruits can now only be fused with others of the same type (pineapple with pineapple, ...). It\'s still easier than before fusing was introduced, when it was 100% RNG based.';
  text += '<br/>• Having more mistletoes affects reduces resin income more, making the choice between resin and twigs focus sharper.';
  text += '<br/>• Show the % bonuses given by weather abilities in various messages and windows.';
  text += '<br/>• Log message tooltips now also show in-game time and tree level.';
  text += '<br/>• More settings to disable certain log messages are added (nested under "preferences").';
  text += '<br/><br/>';

  text += '0.1.64 (2021-04-18):';
  // Goal of this removal and increased base: to make longer runs worth it, and not have optimal resin/hr hang at multiple of 10 tree levels. The lower level twigs nerf is not too bad, because the twigs gain ethereal upgrade from a recent update made it overpowered there.
  text += '<br/>• Removed the Transcension II, Transcension III, etc... system (which multiplied resin and twigs by floor(tree level / 10)).';
  text += '<br/>• Instead, increased the base of exponentiation of resin and twigs per tree level to compensate the above. The curves have been kept as similar as possible, for levels above 45 this starts being an exponentially increasing buff';
  text += '<br/>• Added an alternative dark theme';
  text += '<br/><br/>';

  text += '0.1.63 (2021-04-17):';
  text += '<br/>• Templates now also supported in ethereal field, but not blueprints';
  text += '<br/>• Upgrade-crop actions and shortcuts now also work in the ethereal field';
  text += '<br/>• Fixed autumn increasing mushroom seed consumption while its description says it shouldn\'t';
  text += '<br/>• You can now ctrl+shift+click a blueprint to transcend and plant that blueprint in one go';
  text += '<br/>• Other small tweaks and fixes';
  text += '<br/><br/>';

  text += '0.1.62 (2021-04-13):';
  text += '<br/>• Mistletoe now already works while it\'s growing. This prevents issues where tree levels up before mistletoes ready when automaton plants mushrooms';
  text += '<br/>• The wither challenge was made of comparable difficulty as before 0.1.61 again: the production curve of withering crops tweaked to lose a bit less production initially';
  text += '<br/>• Resin and twigs per hour, and best per hour, stats in the top info panel.';
  text += '<br/>• Pressing ctrl or shift now hides tooltips.';
  text += '<br/>• New shortcuts: "p" picks (selects) crop under mouse cursor, or plants it on empty tile, "u" upgrades crop or blueprint template under mouse cursor, "d" deletes crop under mouse cursor. None of these requires clicking mouse button itself, and key can be held down to keep repeating the action while mouse is moved.';
  text += '<br/>• Added setting to disable "auto-saved" message in the log.';
  text += '<br/>• Now, shift+click on top-bar watercress button plants entire field full of watercress, and ctrl+click on it deletes all watercress.';
  text += '<br/><br/>';

  text += '0.1.61 (2021-04-11):';
  text += '<br/>• Added new ethereal upgrades for ethereal tree levels 1-3: twigs gain, blueberry secret, cranberry secret.';
  text += '<br/>• Berries, flowers, mushrooms, etc... now already give partial production or boost while growing.';
  text += '<br/>• The wither challenge got more challenging: withering now also reduces boost of flowers, nettles and beehives.';
  // fix watercress refresh not working below 1000 seeds, more clear target level shown in challenge info dialog, fix -1s time remaining for tree level up issue, ...
  text += '<br/>• Small UI fixes and tweaks.';
  text += '<br/><br/>';

  text += '0.1.60 (2021-04-10):';
  text += '<br/>• Added the ability to fuse fruits, this allows adding an ability of choice to a fruit if you can collect 3 fruits with that ability. Full explanation is in fruit help.';
  text += '<br/>• Added ability to name blueprints';
  text += '<br/><br/>';

  text += '0.1.59 (2021-04-05):';
  text += '<br/>• Made blueprint watercress work and added placeable template for watercress';
  text += '<br/>• Added "upgrade crop" button to crop dialog, which does roughly the same as ctrl+shift+clicking it';
  text += '<br/>• Fruits can now be drag and dropped between slots';
  text += '<br/>• When no crops fullgrown yet, automaton will now upgrade blueprint to berry if can afford it even if cost limit % option is enabled (except if at 0%), to allow fast startup, as those cost limiting settings are normally used for later in a run only';
  text += '<br/><br/>';

  text += '0.1.58 (2021-04-04):';
  text += '<br/>• Added blueprint library, available as soon as automaton and templates are available.';
  text += '<br/>• Blueprint screen is accessed by clicking the tree, or pressing the "b" shortcut.';
  text += '<br/>• Decreased probability of two-tier lower fruits at higher tree levels.';
  text += '<br/>• Added shortcut keys for selecting next/previous active fruit using [ and ] (and a few alternatives).';
  text += '<br/>• Added shortcut key for transcend (t).';
  text += '<br/>• Added a "delete entire field" button to automaton that deletes all crops.';
  text += '<br/>• No longer uses up ethereal token when using "replace crop" in ethereal field to replace a crop with the same type.';
  text += '<br/><br/>';

  text += '0.1.57 (2021-04-03):';
  text += '<br/>• Added cost limit to the advanced automaton auto-unlock settings. Allows stopping auto-unlock when a crop of choice is reached.';
  text += '<br/>• Added 0.01%, 0.02% and 0.05% options to all percentage automaton settings.';
  text += '<br/>• Fruits can now be given a custom name.';
  text += '<br/>• Active fruit selection now works with arrows rather than a separate slot.';
  text += '<br/>• Added optional notification sounds in the preferences. This feature is experimental and may be removed again, because web browsers are restrictive about sound: it doesn\'t work in background tabs due to background tab pausing, doesn\'t work unless interaction with page happened, and may not work depending on other permissions.';
  text += '<br/><br/>';

  text += '0.1.56 (2021-04-02):';
  text += '<br/>• Added templates, which are placeholders for crop types. They do nothing but allow planning the field layout.';
  text += '<br/>• Templates are a new early automaton feature, unlocked immediately along with the existing automation of choice upgrades';
  text += '<br/>• Templates can be turned into an actual crop using ctrl+shift+click once a crop of that type is unlocked';
  text += '<br/>• Templates can be auto-planted by the automaton once auto-plant is available, this allows full run automation from the start';
  text += '<br/>• Templates are placed individually. Full-field blueprint collections are a planned feature for later';
  text += '<br/>• Templates are disabled during certain challenges';
  text += '<br/>• Lowered target level for the blackberry challenge';
  text += '<br/><br/>';

  text += '0.1.55 (2021-04-01):';
  text += '<br/>• Made the balancing changes of 0.1.54 milder. Depending on which state in the game, this means less extreme nerfs or less extreme buffs';
  text += '<br/>• Increases the effect of the resin extraction and trigs extraction upgrades, giving more resin and twigs at earlier tree level when at high enough stage of the game, to compensate for nerfs from the balance change';
  text += '<br/><br/>';

  text += '0.1.54 (2021-04-01):';
  text += '<br/>• Balancing of berries and mushrooms to fix issue where higher tier ones became less worth the resources';
  text += '<br/>• Berry and mushroom upgrades prices get a very gradual additional more-than-exponential cost increase, a soft cap to solve the above problem';
  text += '<br/>• To compensate, a few other stats were buffed: beehive upgrades, nettle upgrades, treelevel production bonus, and ethereal upgrade for treelevel production bonus all became slightly better than linear';
  text += '<br/>• Added new large number display options: hybrid with scientific instead of engineering notation';
  text += '<br/><br/>';

  text += '0.1.53 (2021-03-28):';
  text += '<br/>• Ethereal season upgrades now also give some mushroom benefit to summer and some berry benefit to autumn';
  // the winter warmth increase compensates the beehives affected by cold loss, this is more a logical story change than a stat change since bees genuinely are affected by cold. The mushroom consumption increase is for stat reasons though.
  text += '<br/>• Winter tweaks: more winter warmth base, winter warmth increases mushroom consumption, beehives affected by cold';
  text += '<br/>• Transcenscion now gives an additional percentage of resin and twigs, based on how many spores towards next level collected';
  text += '<br/>• Time countdowns now show ceil of time rather than floor and fractional seconds, and other UI tweaks';
  text += '<br/><br/>';

  // 0.1.52 was accidently skipped

  text += '0.1.51 (2021-03-27):';
  text += '<br/>• Allow separate configuration for auto-unlock prices and auto-plant prices';
  text += '<br/>• Various tweaks';
  text += '<br/><br/>';

  text += '0.1.50 (2021-03-26):';
  text += '<br/>• Added auto-unlock for automaton, requires high enough ethereal tree and another new challenge';
  text += '<br/>• Added the blackberry challenge';
  text += '<br/>• Added ctrl+shift+click plant actions, see shortcut help dialog for info';
  text += '<br/>• UI tweaks';
  text += '<br/><br/>';

  text += '0.1.49 (2021-03-20):';
  text += '<br/>• Bugfixes';
  text += '<br/><br/>';

  text += '0.1.48 (2021-03-20):';
  text += '<br/>• Added auto-plant for automaton, which auto-replaces crops with better versions. Requires high enough ethereal tree and completing a new challenge to unlock';
  text += '<br/>• Added wither challenge';
  text += '<br/>• There is no auto-unlock yet (which is needed to fully automate a run), that is planned for a future version but it\'s useful to already release auto-plant now even without auto-unlock.';
  text += '<br/>• Fixed issue that made upgrade buttons sometimes unresponsive while automaton is doing upgrades even when having more than enough resources';
  text += '<br/><br/>';

  text += '0.1.47 (2021-03-16):';
  text += '<br/>• Challenge production bonus now also applies to mushrooms, significantly boosting spores output';
  // this is because otherwise the mushroom/berry produciton/consumption balance will get lost with higher level ethereal fields
  text += '<br/>• Ethereal mushroom boost also boosts consumption now, ethereal nettles buffed a bit to compensate';
  text += '<br/>• Season effect rebalancing to fix the winter imbalance: before, winter scaled quadratically while other seasons only linearly with ethereal upgrades. After, all scale by n^1.25 instead.';
  text += '<br/>• Winter warmth now only boosts berries and mushrooms (since boosting flowers too is what made it quadratic)';
  text += '<br/>• Clarified in tooltip that lotus also boosts ethereal nettles';
  // display cost in shift+plant chips, ethereal crop bonus breakdown, unlock crop research message shows cost of first planting, toggling automaton undo-able, ...
  text += '<br/>• Various small UI improvements';
  text += '<br/><br/>';

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

