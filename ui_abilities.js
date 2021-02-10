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

// not really an ability, but part of the same toolbar so handled here for now
var watercressbutton = undefined;

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
    //sunbutton = new Flex(topFlex, [0,5], [0,0.1], [0,5.8], [0,0.9]);
    //sunbutton = new Flex(topFlex, [0,4], [0,0.1], [0,4.8], [0,0.9], 2);
    sunbutton = new Flex(topFlex, [0,4], [0,0.1], [0,4.8], [0,0.9]);
    styleButton0(sunbutton.div);

    suntimerflex = new Flex(topFlex, [0,4], [0,0.1], [0,5.5], [0,0.9], 2);
    suntimerflex.div.className = 'efWeatherOff';
    suntimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    suntimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(sunbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_sun, canvas);

    addButtonAction(sunbutton.div, function() {
      actions.push({type:ACTION_ABILITY, ability:1});
      update();
    }, 'sun ability');

    registerTooltip(sunbutton.div, function() { return formatAbilityDurationTooltipText('sun ability', 'berries get a production bonus and aren\'t negatively affected by winter', getSunDuration(), getSunWait())});
  }

  if(state.upgrades[upgrade_sununlock].count) {
    var d = util.getTime() - state.suntime;
    if(d > getSunWait()) {
      suntimerflex.div.innerHTML = '';
    } else if(d > getSunDuration()) {
      suntimerflex.div.className = 'efWeatherOff';
      suntimerflex.div.innerHTML = 'ready in:<br>' + util.formatDuration(getSunWait() - d, true);
    } else {
      suntimerflex.div.className = 'efWeatherOn';
      suntimerflex.div.innerHTML = 'active:<br>' + util.formatDuration(getSunDuration() - d, true);
    }
  }


  //////////////////////////////////////////////////////////////////////////////

  if(mistbutton && !state.upgrades[upgrade_mistunlock].count) {
    mistbutton.removeSelf();
    misttimerflex.removeSelf();
    mistbutton = undefined;
  }

  if(!mistbutton && state.upgrades[upgrade_mistunlock].count) {
    mistbutton = new Flex(topFlex, [0,5.5], [0,0.1], [0,6.3], [0,0.9]);
    styleButton0(mistbutton.div);

    misttimerflex = new Flex(topFlex, [0,5.5], [0,0.1], [0,7], [0,0.9], 2);
    misttimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    misttimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(mistbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_mist, canvas);

    var fun = function() {
      actions.push({type:ACTION_ABILITY, ability:0});
      update();
    };
    addButtonAction(mistbutton.div, fun, 'mist ability');

    registerTooltip(mistbutton.div, function() { return formatAbilityDurationTooltipText('mist ability', 'mushrooms produce more spores, consume less seeds, and aren\'t negatively affected by winter', getMistDuration(), getMistWait())});
  }

  if(state.upgrades[upgrade_mistunlock].count) {
    var d = util.getTime() - state.misttime;
    if(d > getMistWait()) {
      misttimerflex.div.innerHTML = '';
    } else if(d > getMistDuration()) {
      misttimerflex.div.className = 'efWeatherOff';
      misttimerflex.div.innerHTML = 'ready in:<br>' + util.formatDuration(getMistWait() - d, true);
    } else {
      misttimerflex.div.className = 'efWeatherOn';
      misttimerflex.div.innerHTML = 'active:<br>' + util.formatDuration(getMistDuration() - d, true);
    }
  }


  //////////////////////////////////////////////////////////////////////////////


  if(rainbowbutton && !state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton.removeSelf();
    rainbowtimerflex.removeSelf();
    rainbowbutton = undefined;
  }

  if(!rainbowbutton && state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton = new Flex(topFlex, [0,7], [0,0.1], [0,7.8], [0,0.9]);
    styleButton0(rainbowbutton.div);

    rainbowtimerflex = new Flex(topFlex, [0,7], [0,0.1], [0,8.5], [0,0.9], 2);
    rainbowtimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
    rainbowtimerflex.div.style.pointerEvents = 'none';


    var canvasFlex = new Flex(rainbowbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_rainbow, canvas);

    addButtonAction(rainbowbutton.div, function() {
      actions.push({type:ACTION_ABILITY, ability:2});
      update();
    }, 'rainbow ability');

    registerTooltip(rainbowbutton.div, function() { return formatAbilityDurationTooltipText('rainbow ability', 'rainbow ability: flowers get a boost and aren\'t negatively affected by winter', getRainbowDuration(), getRainbowWait())});
  }

  if(state.upgrades[upgrade_rainbowunlock].count) {
    var d = util.getTime() - state.rainbowtime;
    if(d > getRainbowWait()) {
      rainbowtimerflex.div.innerHTML = '';
    } else if(d > getRainbowDuration()) {
      rainbowtimerflex.div.className = 'efWeatherOff';
      rainbowtimerflex.div.innerHTML = 'ready in:<br>' + util.formatDuration(getRainbowWait() - d, true);
    } else {
      rainbowtimerflex.div.className = 'efWeatherOn';
      rainbowtimerflex.div.innerHTML = 'active:<br>' + util.formatDuration(getRainbowDuration() - d, true);
    }
  }


  //////////////////////////////////////////////////////////////////////////////

  // this button becomes available once more enough resources to fully replant all watercress
  if(state.res.seeds.gtr(1000)) {
    if(!watercressbutton) {
      watercressbutton = new Flex(topFlex, [1,-2.1], [0,0.1], [1,-1.3], [0,0.9]);
      watercressbutton.div.title = 'Refresh watercress: active watercress and remainders only. Hotkey: w';
      styleButton0(watercressbutton.div);
      var canvasFlex = new Flex(watercressbutton, 0, 0, 1, 1);
      var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
      renderImage(watercress[4], canvas);

      addButtonAction(watercressbutton.div, function() {
        refreshWatercress();
      }, 'refresh watercress');
    }
  } else if(watercressbutton) {
    watercressbutton.clear();
    watercressbutton.removeSelf();
    watercressbutton = undefined;
  }

  //////////////////////////////////////////////////////////////////////////////
}


function refreshWatercress() {
  var replanted = false;
  var refreshed = false;
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(f.index == FIELD_REMAINDER) {
        actions.push({type:ACTION_PLANT, x:x, y:y, crop:crops[short_0], ctrlPlanted:true, silent:true});
        replanted = true;
      }
      if(f.index == CROPINDEX + short_0 && state.res.seeds.gtr(1000)) {
        actions.push({type:ACTION_DELETE, x:x, y:y, silent:true});
        actions.push({type:ACTION_PLANT, x:x, y:y, crop:crops[short_0], ctrlPlanted:true, silent:true});
        refreshed = true;
      }
    }
  }
  if(replanted) showMessage('replanting watercress');
  else if(refreshed) showMessage('refreshing watercress');
  else showMessage('nothing done: only refreshes existing watercress or remainders of watercress');
  update();
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

  if(e.key == 'w') {
    refreshWatercress();
  }
});


