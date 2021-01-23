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



var mistbutton = undefined;
var misttimerflex = undefined;

var sunbutton = undefined;
var suntimerflex = undefined;

var rainbowbutton = undefined;
var rainbowtimerflex = undefined;


var shadow = '0 0 0.3em #fff';
var ability_text_shadow = shadow + ', ' + shadow + ', ' + shadow + ', ' + shadow + ', ' + shadow + ', ' + shadow; // for legibility
var ability_charging_open = 'ready in:<br> ';
var ability_charging_close = '';
var ability_active_open = '<font color="red">active:<br> ';
var ability_active_close = '</font>';

// just like how the numbers are defined in data: duration is the running time, wait is the cooldown time plus the running time (total cycle time)
function formatAbilityDurationTooltipText(name, description, duration, wait) {
  var cooldown = wait - duration;
  return name + ': ' + description + '<br><br>' + 'Running time: ' + util.formatDuration(duration) + '<br>Cooldown time: ' + util.formatDuration(cooldown) + '<br>Total cycle: ' + util.formatDuration(wait);
}


function updateAbilitiesUI() {


  //////////////////////////////////////////////////////////////////////////////


  if(sunbutton && !state.upgrades[upgrade_sununlock].count) {
    sunbutton.removeSelf();
    suntimerflex.removeSelf();
    sunbutton = undefined;
  }

  if(!sunbutton && state.upgrades[upgrade_sununlock].count) {
    sunbutton = new Flex(topFlex, [0,5], [0,0.1], [0,5.8], [0,0.9]);
    styleButton0(sunbutton.div);

    suntimerflex = new Flex(topFlex, [0,5], [0,0.1], [0,6.5], [0,0.9], 2);
    suntimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    suntimerflex.div.style.textShadow = ability_text_shadow;
    suntimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(sunbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_sun, canvas);

    sunbutton.div.onclick = function() {
      actions.push({type:ACTION_ABILITY, ability:1});
      update();
    };

    registerTooltip(sunbutton.div, function() { return formatAbilityDurationTooltipText('sun ability', 'berries get a production bonus and aren\'t negatively affected by winter', getSunDuration(), getSunWait())});
  }

  if(state.upgrades[upgrade_sununlock].count) {
    var d = util.getTime() - state.suntime;
    if(d > getSunWait()) {
      suntimerflex.div.innerHTML = '';
    } else if(d > getSunDuration()) {
      suntimerflex.div.innerHTML = ability_charging_open + util.formatDuration(getSunWait() - d, true) + ability_charging_close;
    } else {
      suntimerflex.div.innerHTML = ability_active_open + util.formatDuration(getSunDuration() - d, true) + ability_active_close;
    }
  }


  //////////////////////////////////////////////////////////////////////////////

  if(mistbutton && !state.upgrades[upgrade_mistunlock].count) {
    mistbutton.removeSelf();
    misttimerflex.removeSelf();
    mistbutton = undefined;
  }

  if(!mistbutton && state.upgrades[upgrade_mistunlock].count) {
    mistbutton = new Flex(topFlex, [0,7], [0,0.1], [0,7.8], [0,0.9]);
    styleButton0(mistbutton.div);

    misttimerflex = new Flex(topFlex, [0,7], [0,0.1], [0,8.5], [0,0.9], 2);
    misttimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    misttimerflex.div.style.textShadow = ability_text_shadow;
    misttimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(mistbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_mist, canvas);

    mistbutton.div.onclick = function() {
      actions.push({type:ACTION_ABILITY, ability:0});
      update();
    };
    misttimerflex.div.onclick = mistbutton.div.onclick;

    registerTooltip(mistbutton.div, function() { return formatAbilityDurationTooltipText('mist ability', 'mushrooms produce more spores, consume less seeds, and aren\'t negatively affected by winter', getMistDuration(), getMistWait())});
  }

  if(state.upgrades[upgrade_mistunlock].count) {
    var d = util.getTime() - state.misttime;
    if(d > getMistWait()) {
      misttimerflex.div.innerHTML = '';
    } else if(d > getMistDuration()) {
      misttimerflex.div.innerHTML = ability_charging_open + util.formatDuration(getMistWait() - d, true) + ability_charging_close;
    } else {
      misttimerflex.div.innerHTML = ability_active_open + util.formatDuration(getMistDuration() - d, true) + ability_active_close;
    }
  }


  //////////////////////////////////////////////////////////////////////////////


  if(rainbowbutton && !state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton.removeSelf();
    rainbowtimerflex.removeSelf();
    rainbowbutton = undefined;
  }

  if(!rainbowbutton && state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton = new Flex(topFlex, [0,9], [0,0.1], [0,9.8], [0,0.9]);
    styleButton0(rainbowbutton.div);

    rainbowtimerflex = new Flex(topFlex, [0,9], [0,0.1], [0,10.5], [0,0.9], 2);
    rainbowtimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    rainbowtimerflex.div.style.textShadow = ability_text_shadow;
    rainbowtimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(rainbowbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_rainbow, canvas);

    rainbowbutton.div.onclick = function() {
      actions.push({type:ACTION_ABILITY, ability:2});
      update();
    };

    registerTooltip(rainbowbutton.div, function() { return formatAbilityDurationTooltipText('rainbow ability', 'rainbow ability: flowers get a boost and aren\'t negatively affected by winter', getRainbowDuration(), getRainbowWait())});
  }

  if(state.upgrades[upgrade_rainbowunlock].count) {
    var d = util.getTime() - state.rainbowtime;
    if(d > getRainbowWait()) {
      rainbowtimerflex.div.innerHTML = '';
    } else if(d > getRainbowDuration()) {
      rainbowtimerflex.div.innerHTML = 'ready in:<br> ' + util.formatDuration(getRainbowWait() - d, true);
    } else {
      rainbowtimerflex.div.innerHTML = '<font color="red">active:<br> ' + util.formatDuration(getRainbowDuration() - d, true) + '</font>';
    }
  }


  //////////////////////////////////////////////////////////////////////////////
}




document.addEventListener('keydown', function(e) {
  /*if(e.key == 'a') {
    if(state.upgrades[upgrade_sununlock].count && util.getTime() - state.suntime > getSunWait()) actions.push({type:ACTION_ABILITY, ability:1});
    if(state.upgrades[upgrade_mistunlock].count && util.getTime() - state.misttime > getMistWait()) actions.push({type:ACTION_ABILITY, ability:0});
    if(state.upgrades[upgrade_rainbowunlock].count && util.getTime() - state.rainbowtime > getRainbowWait()) actions.push({type:ACTION_ABILITY, ability:2});
    update();
  }*/
  if(e.key == 'a') {
    showMessage('a key no longer works since only 1 weather ability can be active at once now, use 1, 2 or 3 to enable an ability instead.');
  }
  if(e.key == '1') {
    actions.push({type:ACTION_ABILITY, ability:1});
    update();
  }
  if(e.key == '2') {
    actions.push({type:ACTION_ABILITY, ability:0});
    update();
  }
  if(e.key == '3') {
    actions.push({type:ACTION_ABILITY, ability:2});
    update();
  }
});


