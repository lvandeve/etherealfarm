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


function getChangeLog() {
  var text = '';

  // new feature not yet listed: shift+d in ethereal field as downgrade-tier shortcut

  text += '0.7.6 (2022-12-05):';
  text += '<br/>• Enabled holiday event, it will activate on december 6th (depending on time zone) and last for 1 month. Presents with random effects will drop!';
  text += '<br/>• Bugfixes.'; // undo in combination with auto-action, season change resource comparison display, time at treelevel weighted better for fern computation accidently applied to everything
  text += '<br/><br/>';

  text += '0.7.5 (2022-11-27):';
  text += '<br/>• Added 4 new infinity field crops.';
  text += '<br/>• Added a new ethereal mistletoe upgrade (requires more evolution).';
  text += '<br/>• Removed all time restrictions for deleting crops in ethereal field, and ethereal crops have their effect immediately rather than after growing. This is a test, some form of rate-limiting the changing of ethereal crops may come back in the future if this creates strategies that require too much activity.';
  text += '<br/>• Increased the flower effect of the ethereal spring upgrade from 25% to 33%, and the spring grow speed bonus from 20% to 25%';
  text += '<br/>• Added "upgraded crop" as a possible automaton action trigger';
  text += '<br/>• Auto-actions can now also be done manually, assigned to number shortcut keys, and the side panel got a small auto-action configuration button';
  text += '<br/>• When taking a fern when tree has just been leveling up, it now uses the best time at level from the last few minutes for its computation (when time at level production bonus is unlocked). When e.g. just switching from a seeds to a spores fruit, this was already achievable before by clicking fast enough, but now fern works well for auto actions too.';
  text += '<br/>• UI tweaks and fixes.'; // e.g. ethereal tree tooltip now mentions its neighbor boost, fixed wrong values in before/after season production message and next crop planting cost message, and downgrade tier button for infinity field. Also made auto-actions undoable
  text += '<br/><br/>';

  text += '0.7.4 (2022-11-09):';
  text += '<br/>• Fix timing race condition issue that could cause season jumps during hold season.';
  text += '<br/>• Added back the season +1 hour amber ability';
  text += '<br/>• Added "Total resin allocation" stat in the resin info dialog.';
  text += '<br/><br/>';

  text += '0.7.3 (2022-11-08):';
  text += '<br/>• Added more infinity crops';
  text += '<br/>• Added new amber ability, "hold season", which holds the same season the entire run.';
  text += '<br/>• Slight discount for the season -1h amber ability, and removed the +1h one since "hold season" allows the same but better.';
  text += '<br/>• Time where freely deleting in ethereal field is possible at start of run increased from 10 to 30 minutes.';
  text += '<br/>• In mixed seed+spore layouts, automaton heuristics will prioritize some flowers intended for mushrooms too now.';
  text += '<br/>• More infinity seeds related info shown in dialogs, including detailed breakdowns for infinity crops.';
  text += '<br/>• Added "clear infinity field" button to automaton.';
  text += '<br/><br/>';

  text += '0.7.2 (2022-10-31):';
  text += '<br/>• Added nut prestige for all the nut crops.';
  text += '<br/>• Fixed high tier nut medals giving too much bonus compared to other crop achieves.';
  text += '<br/>• Increased bonus of seeds amount and tree level achieves, which should make up for the decreased nut achievements bonus.';
  text += '<br/>• The automatic border for named or fused fruits is now more subtle.';
  text += '<br/>• Improved fruit background color contrast. Reason for the visible change in 0.7.1 is that since this release fruits have the same background color in both dark and light UI themes, and that change was done because some border colors were hard to see against the light UI backgrounds.';
  text += '<br/>• Various fixes.'; // includes refresh on watercress templates was broken, and tree level 155+ accidently dropping amethist instead of sapphire fruits
  text += '<br/><br/>';

  text += '0.7.1 (2022-10-30):';
  text += '<br/>• Added two new infinity field crops.'; // zinc blackberry and zinc anemone
  text += '<br/>• Added "i" shortcut to go to infinity field tab.';
  text += '<br/>• UI tweaks: viewing pre-evolution squirrel tree, more notations for entering auto-action time, merged two groups of fruit fusing checkboxes, fruit border color tweaks, ...'; // also typo fixes, added the forgotten production info to infinity field crop dialogs, mistletoe upgrade in progress button highlight color, per hour (instead of per second) production display for low inf seeds income, ...
  text += '<br/><br/>';

  text += '0.7.0 (2022-10-24):';
  text += '<br/>• Added the infinity field, a third field tab in the game. This requires ethereal tree 20 to unlock. For this first release, the infinity field has only a single crop, as an initial test of this new feature (which also means it could change). Later more crops will be released.';
  text += '<br/>• Small tweaks and fixes.'; // update nuts value in squirrel tab when nuts change while it's open, and small cosmetic ui/text changes, mistletoe dialog some bonuses not shown fixed and bonuses shown in tooltips
  text += '<br/><br/>';

  text += '0.6.6 (2022-10-10):';
  text += '<br/>• Added a halloween event, which unlocks a pumpkin crop that takes 2x2 field spaces, requiring new layouts to use it well. This event will last 1 month.';
  text += '<br/>• Added a page 2 to the blueprint dialog, doubling the amount of available blueprints. The "p" key is a shortcut to switch pages.';
  text += '<br/>• Bugfixes.'; // mostly infernal challenge season related
  text += '<br/><br/>';

  text += '0.6.5 (2022-09-18):';
  text += '<br/>• In spring, bees can now diagonally reach flowers (but not in the rockier challenge).';
  text += '<br/>• Fixed auto-action taking fern before all blueprint templates planted by automaton: it now waits a few seconds before picking up fern.';
  text += '<br/>• Fixed auto-action select crop dialog not showing already-known crops from previous runs';
  text += '<br/>• Auto-action triggers can now be re-used if edited and given a condition in the future, e.g. if an auto-action recently triggered 1 hour into the run and you now set it to trigger after 2 hours, it will trigger again at that time.';
  text += '<br/>• Editing auto-actions to give them a condition in the past (for the current run) will no longer trigger them while or after editing them.';
  text += '<br/>• Added missing wither challenge stage completion medals (and another new achievement).';
  text += '<br/>• When having the stormy challenge reward, if auto-action activates weather at start of run, when the weather is not yet unlocked, it\'ll still be setup as the permanent weather.';
  text += '<br/>• Auto-action time-based trigger can now be entered in the format hours:minutes or hours, rather than minutes (so you can e.g. type 3 or 3:00, instead of 180, for 3 hours).';
  text += '<br/><br/>';

  text += '0.6.4 (2022-09-12):';
  text += '<br/>• Auto-action can now also activate weather, refresh brassica and take fern. This must be unlocked first with a new stage of the wither challenge.';
  text += '<br/>• Added a third auto-action slot as reward for another new stage of the wither challenge.';
  text += '<br/>• There\'s now an auto-action toggle in the side panel.';
  text += '<br/>• UI tweaks.'; // e.g. added non-potential/hypothetical income to the "expected when fullgrown" resources tooltip, and better naming/info about hypothetical production in the seeds tooltip
  text += '<br/><br/>';

  text += '0.6.3 (2022-09-04):';
  text += '<br/>• Automaton auto-action (formerly named auto-blueprint) can now also automatically choose a fruit to switch to.';
  text += '<br/>• Automaton auto-action can now also use time since start of run as a possible action trigger.';
  text += '<br/>• Expected total income per second (once all crops are fullgrown) is now shown in the top resource tooltips for seeds, spores and nuts.';
  text += '<br/>• Rockier challenge completion levels now also shown on its button when choosing challenges, when all rockier cycles have already been done.';
  text += '<br/>• When importing a blueprint from text, tab characters are now ignored, so importing from a spreadsheet works.'; // also spaces but only with some heuristic, but spreadsheets use tab characters
  text += '<br/><br/>';

  text += '0.6.2 (2022-08-30):';
  text += '<br/>• The ethereal mistletoe evolution no longer boosts the twigs or resin bonuses. The base value of the twigs and resin bonuses was increased to compensate.';
  text += '<br/><br/>';

  text += '0.6.1 (2022-08-28):';
  text += '<br/>• In the evolved squirrel upgrade tree, combined the 3 fruit probability upgrades into 2, and changed one into a new upgrade.';
  text += '<br/>• Added two more ethereal mistletoe upgrades (requiring higher evolution).';
  text += '<br/>• Pressing the enter key on a button focused with tab now also activates it. Let me know if this causes any issues.';
  text += '<br/>• Various other tweaks and bugfixes.'; // e.g. the tooltip of the mistletoe evolution upgrade now says at which level a new upgrade unlocks, and the mistletoe tooltip in ethereal field says remaining time
  text += '<br/><br/>';

  text += '0.6.0 (2022-08-20):';
  text += '<br/>• Added ethereal mistletoe. Only one of this crop can be planted in the ethereal field, and it has upgrades inside that cost time. Unlocks at ethereal tree 15.';
  text += '<br/>• Added another new high level ethereal crop.';
  text += '<br/>• Automaton auto-blueprints can now also use unlocked or planted crop types as a trigger condition.';
  text += '<br/>• Added more truly basic challenge speed achievements';
  text += '<br/>• Added one more rocks challenge reward stage';
  text += '<br/>• Added a few more fruit-marking border colors. As a reminder, fruit border colors can be chosen by clicking the fruit icon in the "configure fruit" dialog (marking as favorite).';
  text += '<br/>• The game now starts with 10 seeds rather than 0 seeds, so a watercress can be planted immediately without collecting ferns in the first playthough.';
  text += '<br/>• Ferns spawn at regular rate at the start of the game now, rather than sped up.';
  text += '<br/>• All ethereal ferns give 10x more seeds, e.g. the first one now gives 1000 seeds.';
  text += '<br/>• Brassica production upgrade now only gives +25% instead of +100% seeds. Only early-game income is briefly affected by this.';
  // requiring 10 watercress is the behavior of the main game's first playthrough, but that's as a tutorial, in the challenges it's confusing instead (requiring a single watercress is ok and often present in blueprint) and it doesn't make the challenge easier anyway since you need to collect seeds for the unlock with watercress anyway
  text += '<br/>• During the basic and truly basic challenge, as well as any other run other than the first playthrough, the blackberry unlock now becomes visible after a single watercress rather than after 10.';
  text += '<br/>• Reordered some of the evolved squirrel upgrades near the end.';
  text += '<br/>• UI tweaks and fixes.'; // typo fix, target levels shown next to rewards gotten in the challenge stats dialog, crop progress bars a bit more min pixels, ...
  text += '<br/><br/>';

  text += '0.5.0 (2022-08-01):';
  text += '<br/>• Automaton features get unlocked earlier and there\'s a new automation feature too:';
  text += '<br/>&nbsp;&nbsp;1. Auto-plant is now unlocked immediately when getting automaton (at ethereal tree level 1, without a required challenge), instead of auto-choice. Before, auto-plant unlocked only at ethereal tree level 3 with the wither challenge';
  text += '<br/>&nbsp;&nbsp;2. Auto-upgrades and auto-choice now both unlock at ethereal tree level 2, with the no-upgrades challenge.';
  text += '<br/>&nbsp;&nbsp;3. Blackberry challenge now appears at ethereal tree level 3 instead of 4. This means automaton auto-unlock is now available already at ethereal tree level 3.';
  text += '<br/>&nbsp;&nbsp;4. Wither challenge now unlocks at ethereal tree level 5 instead of 3, and unlocks a completely new ability: auto-blueprint override (before it unlocked auto-plant).';
  text += '<br/>• The new auto-blueprint override ability allows to program the automaton to override the field with a chosen blueprint once a chosen tree level is reached.';
  text += '<br/>• Challenge target levels tweaked where appropriate, e.g. the second target of the no upgrades challenge got harder, and wither much higher.'; // also, automaton cost-finetuning options are now all unlocked at once with stage 2 of no upgrades challenge, rather than separately for auto-upgrades and auto-plant
  text += '<br/>• Blackberry secret, blueberry secret and cranberry secret all unlock one ethereal tree level earlier now.';
  text += '<br/>• Blueberry secret and cranberry secret now also come with other unlocks (anemone, champignon, ...) already bought rather than just made visible.';
  text += '<br/>• Resin income from transcensions reduced during the first 10 minutes of the run to prevent resin/hr being higher after 1 minute than rest of the run when not having resin extraction yet.';
  text += '<br/>• Various other tweaks and fixes.'; // roman number setting not remembered, small bugfix in challenge reward listed in some cases, automaton will now prioritize planting a blackberry before buying watercress upgrades, automaton auto-plant mushroom prioritization tweak, guarantee first bronze fruit promised by a help dialog, ...
  text += '<br/><br/>';

  text += '0.4.0 (2022-07-11):';
  text += '<br/>• Added squirrel evolution at the end of the squirrel upgrade tree. When purchased, this resets the squirrel tree to a new one with a new mix of new and old upgrades. This makes production initially significantly weaker, but allows getting much stronger than before eventually.';
  text += '<br/>• Added 4 more tiers of nuts crops.';
  text += '<br/>• In squirrel UI, simplified the rule used when it reveals the name of the upgrade or shows "???". There are no more red colored chips, only gray for those that aren\'t in reach to buy.';
  text += '<br/>• Added ctrl+z as shortcut for undo.';
  text += '<br/>• Fixed lightning bolt after game pause during stormy challenge.';
  text += '<br/>• Fixed automaton cost configuration dropdowns, which broke by the modal dialogs update.';
  text += '<br/>• Various other fixes and tweaks.'; // max tree level in top left info box popup, fix fruit ability order sometimes not preserved after fusing, auto upgrades of nuts crops not working after unlocking squirrel first time and defaulting to 100% instead of 50%, bold highlight for fruit fuse that increases charge, ethereal tree percentage to next level shown in tab, icons in the while-planting 'show crop info' dialogs, ...
  text += '<br/><br/>';

  text += '0.3.5 (2022-06-26):';
  text += '<br/>• Improved HTML aria annotations of modal dialogs and fruit fusing dialog. It should no longer be possible to access HTML elements that are not part of the currently active dialog.';
  text += '<br/>• Fixed bug preventing field size change during non-truly basic challenge.';
  text += '<br/><br/>';

  text += '0.3.4 (2022-06-25):';
  text += '<br/>• Improved HTML aria annotations for automaton dropdowns.';
  text += '<br/><br/>';

  text += '0.3.3 (2022-06-23):';
  text += '<br/>• Added 2 new ethereal crops and 2 new ethereal upgrades (field size), requires high level ethereal tree to unlock.';
  text += '<br/>• Ethereal tree now has a dialog to see the things that got unlocked at previous levels.';
  text += '<br/>• Bugfixes, including a minor fruit fusing dialog bug.';
  text += '<br/><br/>';

  text += '0.3.2 (2022-06-12):';
  text += '<br/>• When fusing fruits, you can now choose to keep or discard two-star [**] abilities that get transferred, and also change the priority of which abilities get pushed out by the transferred ones. Scroll down in the fuse dialog to see these new controls, but they are only visible if there\'s a two-star [**] ability in the "from"-fruit.';
  text += '<br/>• Layout and help of the fuse fruit dialog slightly adjusted for clarity.';
  text += '<br/>• Fusing a fruit that\'s worse than the original is no longer prevented: it\'s easier to learn how fusing works when allowed to see all the possible results.';
  text += '<br/>• Minor fixes.'; // includes a few fixes in the challenge display related to cycling bonus and capped bonus level
  text += '<br/><br/>';

  text += '0.3.1 (2022-05-24):';
  text += '<br/>• Fixed sapphire fruit treelevel ability: it scaled up too early and should only start becoming good around tree level 145';
  text += '<br/><br/>';

  text += '0.3.0 (2022-05-22):';
  text += '<br/>• Added the infernal challenge.';
  text += '<br/>• Added sapphire fruits. In these, relative importance of some abilities is changed: nettle and mushroom more important, weather less important';
  text += '<br/>• Seed overload slightly buffed for both amethist and sapphire fruits.';
  text += '<br/>• Added a first truly basic speed achievement (level 10 in 2.5 hours).';
  text += '<br/>• When getting automaton, the watercress upgrade is now visible from the start (as a reminder, when not yet having blackberry secret).';
  text += '<br/>• Tuned automaton plant order heuristics for mushrooms with brassica, and brassica fruit.';
  text += '<br/>• Typo fixes.';
  text += '<br/><br/>';

  text += '0.2.2 (2022-05-15):';
  text += '<br/>• Removed the red tutorial arrows, only the goals serve as the tutorial now.';
  text += '<br/><br/>';

  text += '0.2.1 (2022-05-14):';
  text += '<br/>• Added setting to disable roman numerals (for upgrade and fruit levels). It will still display them up to 12 (XII), but after that it switches to decimal.';
  text += '<br/>• Renamed the "save on close" setting to "save on refresh tab": this setting only works for closing tabs, but not when closing the entire browser or shutting down computer.';
  text += '<br/>• The seeds and spores tooltips now also show max amount had so far this run.';
  text += '<br/>• Tweaks to the early game tutorial.';
  text += '<br/><br/>';

  text += '0.2.0 (2022-05-11):';
  text += '<br/>• New version number scheme: the middle number now is incremented for changes with significant effect on gameplay (e.g. a new challenge, ...), and the rightmost for smaller tweaks or bugfixes.';
  text += '<br/>• New shortcuts added: "f" goes to basic field tab, "e" goes to ethereal field tab, in blueprint edit dialog "f" sets blueprint from field, "enter" overrides field with blueprint.'; // This particular set of tabs/shortcuts was chosen to make ethereal blueprint switching easier. In addition, in fruit/blueprint rename dialogs, enter key now accepts it rather than add newline.';
  text += '<br/>• Removed the "shortcuts may delete crop" setting, it\'s always allowed now.'; // this used to be required for ctrl+click to delete and other similar shortcuts
  text += '<br/>• Added a new tier name and color, amethyst, to get 12 tiers total. There doesn\'t seem to exist a memorable real or fictional gem considered more precious than diamond, so it had to be inserted before sapphire: sapphire fruits now became amethyst.';
  text += '<br/>• Achievement tier value requirements increased. This is purely cosmetic.';
  text += '<br/>• Ethereal blueprints now show the resin cost.';
  text += '<br/>• Ethereal blueprints now get planted with priority around the tree spiraling outwards, to get likely important crops first when there\'s not enough resin.'; // spiral is not yet as good as a heuristic that computes importance of each crop, but it's an improvement over left to right top to bottom order
  text += '<br/>• "Clear ethereal field" action is now available in the automaton tab even if the automaton is absent.'; // but not clear basic field: this is only intended to make it easier to clear the ethereal field and place an automaton there
  text += '<br/>• The time to freely replant ethereal field at start of a run extended to 10 minutes.';
  text += '<br/>• Tweaks and fixes';
  text += '<br/><br/>';

  text += '0.1.104 (2022-05-02):';
  text += '<br/>• Ethereal delete tokens have been removed from the game. Instead, the ethereal field can now be freely replanted at the beginning of any run, any time later in the run, and every 2 hours thereafter. Templates can always be freely deleted. To prevent stuck situations, replacing a crop with a squirrel or automaton is always possible if no other free field spots are available.'; // The time limit is there because the game shouldn't be about constantly changing the ethereal field, but planning a layout at the beginning at the run, and one or two phases later on is possible
  text += '<br/>• Blueberry secret and cranberry secret now also already buy the unlock upgrade for free (rather than merely make it visible), for clarity and consitency with blackberry secret. They also no longer make unlock clover visible, instead blueberry secret makes unlock anemone immediately visible.';
  text += '<br/>• Bugfixes.';
  text += '<br/><br/>';

  text += '0.1.103 - Early game balancing (2022-04-27):';
  text += '<br/>• Added a new bee tier for the basic field.';
  text += '<br/>• Added achievements for amount of nuts, and more for seeds.';
  text += '<br/>• The "time at level" bonus is now weighted with the duration of several previous levels.';
  text += '<br/>• Added goals, an interactive tutorial for the early game, giving direction up to unlocking of automaton. Goal chips appear above the message log.';
  text += '<br/>• Reduced spore production of mushrooms above champignon by 25% but increased nettle/thistle boost by 25% and made them cheaper to compensate exactly. This makes nettles more interesting during the first run of the game.';
  text += '<br/>• Mistletoe now unlocks after blackberry instead of after blueberry (still requires the ethereal upgrade), and is cheaper.';
  text += '<br/>• The first ethereal tree level now costs 72 instead of 144 twigs, and the second 1296 instead of 1728. All others stay the same (powers of 12).';
  text += '<br/>• Tweaked automaton planting heuristics to prefer berries touching brassica a bit more.';
  text += '<br/>• Changed some blueprint letter symbols, due some crops having become whole series, and for possible future crop types. The changes are: stinging: S (was: N), bees: Z ("buzz", was: H), squirrel: Q (was: S), nuts: N (was: U)';
  text += '<br/>• Renamed some in-game names for clarity: old beehive -> "bee nest", new beehive -> "beehive", beehive crop type -> "bee", prickly/nettle crop type -> "stinging", upgrade crop (in field) -> "tier up"';
  text += '<br/>• Twigs resource display, tree spore requirement and automaton tab appear sooner in early game, for clarity.';
  text += '<br/>• Bugfixes and UI improvements.'; // includes: more clear message when trying to plant blueprint in truly basic and bee challenge, showing "disabled" in name of some tabs during truly basic challenge, amount of amber shown on amber tab, dialog consistency, one less popup dialog on first ethereal tree levelup, wrapping tooltip text fix, ...
  text += '<br/><br/>';

  text += '0.1.102 (2022-04-18):';
  text += '<br/>• Added stormy challenge with perma weather reward.';
  text += '<br/>• Added 6 new higher level ethereal crops.';
  text += '<br/>• Added reward level caps to basic and truly basic challenge, and tweaked their bonuses to give more earlier, but diminishing returns later. The caps are very high and not intended to be reached as this takes a long time and rewards are very diminishing at that point.'; // the caps are 30 for basic challenge, 25 for truly basic challenge
  text += '<br/>• Mushroom boost and nettle boost fruit abilities a bit increased.';
  text += '<br/>• Shift + click, and shift + number key in blueprint dialog now plants with overriding rather than without (and the ctrl shortcut got deprecated).'; // the reason is that ctrl+numberkey shortcuts are taken over by browsers to switch browser tabs, and override field is generally the more useful action
  text += '<br/>• Reorganized the challenge info dialog in more sections to more easily find rules, goal and rewards between the text.';
  text += '<br/>• Bugfixes.';
  text += '<br/><br/>';

  text += '0.1.101 (2022-04-16):';
  text += '<br/>• A new first flower tier, anemone, is now available after blackberry instead of cranberry, much sooner, to improve the early game experience.';
  text += '<br/>• Lategame flower prices and effects are the same (including prestiged anemone which is what sunflower used to be).';
  text += '<br/>• In the ethereal field flowers changed names, but the effects are same as before.';
  text += '<br/>• This causes some achievements (for highest flower tier) to have to be re-earned, sorry for the incovenience.'; // the alternative, keeping all id's of flowers and achieves, required a relatively complex change in savegames with sunflowers (which have to become prestiged anemones), noting that we keep 8 tiers of flowers (not 9; so sunflower is gone for now) to keep matching corresponding berries in future prestiges
  text += '<br/>• Mushroom and flower achievements give a slightly higher boost.';
  text += '<br/>• Seeds income now only shows a gray numeric value if more than two thirds of seed production goes to mushrooms (as a warning), and it now shows the potential total production, rather than a negative value.';
  text += '<br/>• The blueprint dialog now supports shortcut keys 1-9 to select a blueprint.';
  text += '<br/><br/>';

  text += '0.1.100 - Fruity update (2022-04-10):';
  text += '<br/>• Added sapphire fruits, and new fruit abilities only available from this tier.'; // The "mix" ability may need some extra explanation that doesn't fit in its UI description: its 3 multipliers are tuned (using sqrt/cbrt-ish powers) such that in overal game production boost it\'s roughly as good as 1 bee ability, or 1 brassica ability, or 1 nettle ability, but is a combination of them. The mix ability is also designed to be quite useless if combined with a bee, brassica or nettle boost ability on the same fruit (by making it additive with those), so for a good fruit either have only mix, or any amount of those others, but not both. Also, the watercress effect of mix fruit is different on mushroom copying vs berry copying, to make its tuning very exact when taking into account its nettle ability doesn't affect seeds. "Mix" is not always better than pure bee boost or pure brassica boost, it's situational, it's a bit more flexible (being "ok" in more situations), but there are only a few specific cases where it's not strictly worse than pure bee (e.g. when most berries are next to a brassica).
  text += '<br/>• New fruit mixing type, unlocked by new squirrel upgrade. The original dragon fruit got renamed to star fruit, but behaves exactly the same.'; // the reason the rename, rather than keeping dragon fruit the 4-season one and adding a new one with a new name on top, is that "dragon fruit" sounds more powerful than "star fruit" and I couldn't find any fruit that sounds even more powerful than "dragon fruit" does. In addition, "star fruit" is quite excellent in that it grows in many seasons of the year, perfectly representing 4 seasons.
  text += '<br/>• Added a few extra fruit storage space upgrades and other ways to get some.'; // The extra way requires fusing various combined seasonal fruit types, and due to how its computation is done, it must be done from scratch for existing savegames, already fused fruits aren't counted
  text += '<br/>• Due to UI space reasons, only the first 10 fruit slots can be selected as active now, the others are purely storage.'; // because the arrow selectors require horizontal space, and having them wrap would be possible, but somewhat ugly
  text += '<br/>• Added a new choice upgrade (resin vs production).'; // In challenges without resin, automaton will automatically pick the non-resin choice anyway if the resin one is selected.
  text += '<br/>• Added new crop count achievements.'; // 50
  text += '<br/>• Various other tweaks.'; // includes making nettle fruit ability a bit stronger, to make it not strictly worse than bee fruit, and, info buttons in the automaton choice-upgrade dialog. And subtle change that was needed for the mix fruit separate watercress multiplier for berry and mushroom: watercress copying breakdown UI will now show the mushroom breakdown if only next to mushroom, and the nuts breakdown if only next to nut, instead of always showing the berry breakdown
  text += '<br/><br/>';

  text += '0.1.99 (2022-04-04):';
  text += '<br/>• New event started! Eggs with random rewards will drop every now and then. It will run throughout April.';
  text += '<br/>• Changed the graphics of the bee challenge: now it has in order: worker bee, drone, queen bee. This to avoid confusion with the differently functioning main game beehive. The queen also got a crown.';
  text += '<br/>• Made undeletable challenge a bit harder.'; // Blueberry secret and cranberry secret don't work, and when prestiging, undeletable ghosts remain. In addition (but this doesn't make it harder), nuts and mistletoe can no longer be used
  text += '<br/>• Made font sizes more consistent.';
  text += '<br/>• Fixed fern resource computation in case of growing flowers.';
  text += '<br/>• Various minor UI tweaks.'; // includes another few improvements to the location of challenge target level / max level / production bonus related information, and, fused fruit prefers to go to storage pool over sacrificial pool now
  text += '<br/><br/>';

  text += '0.1.98c (2022-03-27):';
  text += '<br/>• Increased bonus of some of the resin and other achievements.';
  text += '<br/>• Crops in the final time units of growing will now already show the final fullgrown image (but still with progress bar).';
  text += '<br/>• New easier shortcut to transcend without blueprint: "t", "enter".';
  text += '<br/>• Exporting ethereal blueprint as TXT now inlcudes the tier numbers.';
  text += '<br/>• Bugfixes';
  text += '<br/><br/>';

  text += '0.1.98 - Balancing and QoL (2022-03-20):';
  text += '<br/>• Added a new ethereal upgrade.';
  text += '<br/>• Active weather can now be changed while one is running. This doesn\'t allow multiple at the same time and the use-time of the old one is lost.'; // more precisely, you can switch back and forth between the old and new one, but the use-time of one is always lost
  text += '<br/>• Fern resources are now computed as if all crops are fullgrown, so clicking a fern is no longer bad if new crops just started growing.'; // except brassica, their growth (such as being withered but still semi active) is taken into account
  text += '<br/>• In the passive fern choice, ferns that are not taken for a long time now have a chance to become bushy.';
  text += '<br/>• Added support for ethereal blueprints.';
  text += '<br/>• Using blueprints no longer requires the automaton to be present, but still requires it to be unlocked.'; // since blueprints can now affect the ethereal field, it could be very confusing if a blueprint removes the automaton, and then you can't use blueprints anymore
  text += '<br/>• More tree level based achievements and more appropriate bonus values for them.';
  text += '<br/>• Challenge start button tooltips now mention when challenge was last run (once known).';
  text += '<br/>• Starting a challenge now also allows starting with blueprint more easily (with shortcuts: "t", "c", choose challenge, "b", choose blueprint).';
  text += '<br/>• Other UI improvements and bugfixes.'; // nuts cost timer, winter fern vs template color contrast, downgrade ethereal crop button,  ...
  text += '<br/><br/>';

  text += '0.1.97 (2022-03-06):';
  text += '<br/>• All tiers of flowers, mushrooms and berries can now be prestiged.';
  text += '<br/>• Added two new nut tiers (to keep alphabetic naming order, some tier names have shifted).'; // added / inserted beechnut, ginkgo, pecan nut. pili got shifted out, for now
  text += '<br/>• Added "Plant entire field" option to automaton tab, which plants the same crop on all empty spots.';
  text += '<br/>• Dark scrollbars for dark mode themes (experimental browser dependent feature).';
  text += '<br/>• Various small tweaks and fixes.'; // typo fixes, and the tooltip of crops now says "next tier cost" instead of "upgrade cost" and will also show it if the next crop's unlock upgrade is visibible, rather than only after it was unlocked
  text += '<br/><br/>';

  text += '0.1.96b (2022-02-25):';
  text += '<br/>• Fixed game balance breaking bugs.'; // essense dupe fixed, and fixed wither challenge unplayable without blackberry secret
  text += '<br/><br/>';

  text += '0.1.96 (2022-02-09):';
  text += '<br/>• Added new fruit tier (rhodium)';
  text += '<br/>• Tweaks in earliest game: watercress upgrade from 50% to 100%, blackberry unlock needs 10 instead of 5 watercress, red tutorial arrows added.'; // the 10 watercress requirement makes the watercress upgrade and blackberry unlock appear at different times rather than same time which is easier for the early game tutorial
  text += '<br/>• Performance improvements.'; // one big instead of multiple small canvases for blueprint dialog, render field only once instead of twice after refresh, prevent redrawing of all fruits when upgrading abilities
  text += '<br/>• Bugfixes.';
  text += '<br/><br/>';

  text += '0.1.95 (2022-01-19):';
  text += '<br/>• One more prestigeable berry added.';
  text += '<br/>• New ethereal crops and upgrades for ethereal tree level 9 to 12.';
  text += '<br/>• Holiday event ended.';
  text += '<br/>• Fixed issue with offline computation and the time based squirrel upgrade, and other bugfixes.';
  text += '<br/><br/>';

  text += '0.1.94 (2021-12-28):';
  text += '<br/>• Initial version of "prestige" released, a single berry type can be prestiged in this version.';
  text += '<br/>• Added one more tier of flower.';
  text += '<br/>• Added two new challenges (one is a harder variation of the other).';
  text += '<br/>• Added one more completion target level for the rocks challenge.';
  text += '<br/>• Various small fixes.'; // gear icon in automaton dialog issue with some fonts, "paused" now showing after page refresh, a bit more precision in computation after long time durations
  text += '<br/><br/>';

  text += '0.1.93 (2021-12-17):';
  text += '<br/>• Holiday event started!';
  text += '<br/>&nbsp;&nbsp;- Presents with random rewards will drop.';
  text += '<br/>&nbsp;&nbsp;- The squirrel and automaton got a festive hat.';
  text += '<br/>&nbsp;&nbsp;- This event will be active for 1 month.';
  text += '<br/>• Ethereal crop grow times made faster.'; // includes upgrade dialog staying open when pressing buy in it
  text += '<br/>• Other tweaks and fixes.'; // includes upgrade dialog staying open when pressing buy in it, and, the missing bee template in the ethereal field
  text += '<br/><br/>';

  text += '0.1.92 (2021-12-05):';
  text += '<br/>• Added one more tier of berry and mushroom. To keep the name order of tiers alphabetical, they are inserted in the place of certain existing crops, so some currently planted crops may have changed name and image. Their stats are the same though.';
  text += '<br/>• Added three more tiers of nuts.';
  text += '<br/>• Added eight new squirrel upgrades.';
  text += '<br/>• Fruit nerf: Creating a dragon fruit now requires two two-seasonal fruits with the same abilities, and a dragon fruit can no longer itself be fused with anything. This makes it more challenging to create it, but is done because it was trivial to make a dragon fruit once having one perfect two-seasonal fruit, making it irrelevant.';
  text += '<br/>• Fruit buff: The upgrade cost scaling of linear boost fruit abilities is now cheaper. Check your your fruit tab, since you can likely upgrade their abilities significantly. As a reminder: shift+clicking the fruit ability upgrade button will upgrade it multiple times';
  text += '<br/><br/>';

  text += '0.1.91 (2021-11-21):';
  text += '<br/>• Brassica/watercress winter penalty now removed when next to the tree (but no exception during the wasabi challenge anymore), so useful again during winter';
  text += '<br/>• Bugfixes and UI tweaks: upgrades in message log setting, wasabi during wither challenge, another \'potential\' income display bugfix, ...';
  text += '<br/>• Tweaks: new \'gated\' squirrel upgrade connector style, performance tweak related to infinite lifetime wasabi, added overlay text if game is computing multiple seasons after long inactivity...';
  text += '<br/><br/>';

  text += '0.1.90 "Wasabi update" (2021-11-08):';
  text += '<br/>• Added wasabi, the next tier of watercress, with 25% more copying and lifetime, and a challenge to unlock it.';
  text += '<br/>• Watercress and wasabi are of type \'brassica\', and now this name is used where \'watercress\' was used before.';
  text += '<br/>• Brassica are now negatively affected by winter (except during the wasabi challenge), for more seasonal variety.';
  text += '<br/>• Fruits of high tier dropping in main fruit storage is now a setting (off by default).';
  text += '<br/>• More ethereal tree achievements added and they give more bonus.';
  text += '<br/>• A dialog now pops up when the ethereal tree levels up with the list of things it unlocked. This because it was easy to miss its levelup before.';
  text += '<br/>• UI tweaks and fixes.'; // undo button in editing blueprints dialog, fix a crash when viewing certain crop stats, ...
  text += '<br/><br/>';

  text += '0.1.89 (2021-10-24):';
  text += '<br/>• High-yield watercress choice upgrade now begins at +50% copying bonus but after a while this goes down towards no bonus (it can be refreshed back to 50%), prevously this was a constant +33%. This can get more out of weather+fern combo, but is more active.';
  text += '<br/>• Sturdy watercress choice upgrade now only gives +50% lifetime duration, but now gives a constant +25% copying bonus. About the nerfed lifetime duration: a later update will add another form of longer duration instead.';
  text += '<br/>• Buffed the rainbow weather base bonus from 50% to 75%.';
  text += '<br/>• Added a setting for number key shortcuts: choice of activate weather, change tabs, or change active fruit slot. See main menu -> preferences -> controls.';
  text += '<br/>• A fruit that\'s of higher tier or season type than ever seen before can now drop in the stored fruits rather than sacrificial pool. And custom-named fruits show their name in the fruit tab when active.';
  text += '<br/>• Other minor QoL improvements.'; // esc key opens main menu, fix upgrade cost display in tooltips, named fruits name in tab, less roomy configure buttons in automaton UI, some improved help dialogs, when editing fruit name the original name appears in the edit box rather than have it empty
  text += '<br/><br/>';

  text += '0.1.88 (2021-10-10):';
  text += '<br/>• Ferns at game start now give at minimum the starter resources from ethereal ferns.';
  text += '<br/>• Added new choice upgrade for watercress.';
  text += '<br/>• Increased ethereal neighbor bonus from automaton and squirrel in the ethereal field.';
  text += '<br/>• Ethereal delete tokens revamp to allow more individual crop deletions and more full field replacements per season cycle:';
  text += '<br/>&nbsp;&nbsp;- Gives more ethereal delete tokens per season: 50% of your ethereal field cells, rather than just 2 or 3, and can carry 4x that amount.';
  text += '<br/>&nbsp;&nbsp;- Deleting the entire field now costs as much tokens as all individual deletions, rather than just 4 tokens, and this option is now in the automaton UI.';
  text += '<br/>&nbsp;&nbsp;- The reward for the "undeletable" challenge changed from ethereal token related reward to: more recoup for deleting regular crops';
  text += '<br/>• Certain bee related achievements now have a more fair requirement.'; // the 'unbeelievable', 'buzzy', 'royal buzz' and 'unbeetable' achievements now only need enough bees for a 5x5 field, rather than become exponentially harder to get with larger field size
  text += '<br/>• Watercress copying penalty when having 2 watercress reduced, but increased for more than 3 watercress.';
  text += '<br/>• Various UI tweaks: start-challenge button tooltips, upgrade cost in tooltips, overconsumption display fix if watercress next to mushrooms, ...'; // also choice upgrade info in automaton UI, fix involving amount of season changes display, watercress remainder remains in more cases, display of previous run's final twigs/h and resin/h in info panel tooltips, separate color for the passive play choice upgrade in automaton UI, < > shortcuts for changing fruits to support more international keyboards, ...
  text += '<br/><br/>';

  text += '0.1.87 (2021-09-19):';
  text += '<br/>• New ethereal upgrade.';
  text += '<br/>• New ethereal crops. Includes bees.';
  // there are a few different colors, but the goal of the color is not to distinguish exact categories like "grow", "mushroom", ...,
  // instead the color is intended to be a visible warning that you may have a fruit active that's only for specialized purposes like watercress, weaether, grow speed, ...
  // if you have a special fruit active but don't have a regular pure production fruit of high enough tier in the first place, it won't show the color
  text += '<br/>• Fruit tab color now hints when a non-production fruit is active.';
  text += '<br/>• Cosmetic tweaks.';
  text += '<br/><br/>';

  text += '0.1.86b (2021-08-28):';
  text += '<br/>• Fixed issue with the soft cap of grow times, so that early grow speed upgrades affect all plants at least some visible amount.';
  text += '<br/><br/>';

  text += '0.1.86 (2021-08-25):';
  text += '<br/>• Balanced flower upgrade costs to keep later tiers relevant.';
  // the above balancing makes flower upgrades a bit more expensive towards the end, but the squirrel upgrade boost below more than compensates for that
  text += '<br/>• Increased boost of squirrel upgrades for flower boost, berry boost and mushroom boost.';
  text += '<br/>• Fixed bug where time that resin fruit was active wasn\'t taken into account. Its bonus is supposed to only work depending on how long it was active during the last tree-level.';
  text += '<br/>• Ferns now give resources based on the current income when you click, rather than when they spawned or when they internally refreshed.';
  // reason for this: if ferns give resources of current production, it's very easy to hold on to a bushy fern for a good moment, but this can have such a good effect on the run
  // that the best strategy involves saving up for a bushy fern every run, which can mean on average 20 minutes of waiting for 2-minute ferns. that is very annoying and to be avoided.
  // the old bushy fern multiplier was 5x, now it is around 2x (combined with less random variability than regular fern)
  // the new resin drop of bushy ferns doesn't depend on state in current run but on best resin-run ever, so encourages clicking the bushy fern immediately
  text += '<br/>• Resource multiplier of extra bushy ferns decreased, except for very early game. To compensate, extra bushy ferns now give a small amount of resin (0.5% of highest run for 2-minute ones). This resin itself is not counted for highest run stat, and not included in the /hr stats, but otherwise given as upcoming resin as usual.';
  text += '<br/>• Improved automaton heuristic for choosing which flowers to plant/upgrade first in the field, taking the other boosts of berries into account.';
  text += '<br/>• Bugfixes, performance improvements and other tweaks.';
  text += '<br/><br/>';

  text += '0.1.85 (2021-08-17):';
  text += '<br/>• Added two more tiers of nut crops';
  text += '<br/>• Decreased grow times of mushrooms, flowers and nuts';
  text += '<br/>• Wither challenge now allows using blueprints, after a new third stage of it is completed.';
  text += '<br/>• In the transcend dialog, shortcut key "c" added to open challenge dialog.';
  // The performance improvement is makig showResource a non-nested function.
  text += '<br/>• Other small tweaks, fixes and a performance improvement.';
  text += '<br/><br/>';

  text += '0.1.84 (2021-07-30):';
  text += '<br/>• Added the thistle challenge and thistle crop (next-tier nettle). Requires shiitake and tree level 66';
  text += '<br/>• Increased squirrel upgrade strength for the berry, mushroom, flower, bee and nettle boosts, as well as the essence boost.';
  text += '<br/>• Buffed weather fruit effect on the sun ability.';
  text += '<br/>• Fixed rightmost fruit sometimes clipped off-screen on mobile, and other fixes.';
  text += '<br/><br/>';

  text += '0.1.83 (2021-07-23):';
  text += '<br/>• Next fruit tier, platinum fruit, added, it has a chance to drop starting from tree level 75.';
  text += '<br/>• Fusing multi-season fruits with a matching single-seasonal fruit now keeps the result multi-seasonal.';
  text += '<br/>• Increased the achievement bonus for planting X amount of higher tier crops.';
  text += '<br/>• Grow speed fruit effect difference per tier made larger.';
  text += '<br/>• Improved "Current challenge info" dialog, with clearer old and new challenge production bonus display.';
  text += '<br/>• Fruit drop messages can now be disabled in the preferences.';
  text += '<br/>• Various other tweaks and fixes.'; // e.g. buying multiple squirrel upgrades after respec can now be done without shift
  text += '<br/><br/>';

  text += '0.1.82 (2021-07-11):';
  text += '<br/>• 1% of the challenges production bonus now also applies to resin and twigs income.';
  text += '<br/><br/>';

  text += '0.1.81 (2021-07-09):';
  text += '<br/>• Crops in the process of growing now count as 100% for multiplicity. This allows to change multiplicity layout without waiting for grow times.';
  text += '<br/>• The tree now drops a fruit every 5 levels rather than every 10 levels.';
  text += '<br/>• The description of the fruit grow speed ability now shows that it applies before any other reductions: the percentage value was lowered compared to 0.1.79, but back then it applied only after other reductions (to a smaller value) so this didn\'t actually decrease its power.';
  text += '<br/><br/>';

  text += '0.1.80 (2021-07-07):';
  text += '<br/>• Balancing to ensure getting best resin/hr after not too short runtimes:';
  text += '<br/>&nbsp;&nbsp;- tweaked growtime of early vs late tier crops';
  text += '<br/>&nbsp;&nbsp;- higher tier mushrooms now give more spores per seed rather than less spores per seed, this is a buff';
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

