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



var fogbutton = undefined;
var fogtimerflex = undefined;

var sunbutton = undefined;
var suntimerflex = undefined;

var rainbowbutton = undefined;
var rainbowtimerflex = undefined;




function updateAbilitiesUI() {
  if(fogbutton && !state.upgrades[upgrade_fogunlock].count) {
    fogbutton.removeSelf();
    fogtimerflex.removeSelf();
    fogbutton = undefined;
  }

  if(!fogbutton && state.upgrades[upgrade_fogunlock].count) {
    fogbutton = new Flex(topFlex, [0.1,0.1], [0,0.1], [0.15,0.1], [0,0.9]);
    styleButton0(fogbutton.div);

    fogtimerflex = new Flex(topFlex, [0.15,0.1], [0,0.2], [0.25,0.1], [0,0.9], 1.9);
    fogtimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things


    var canvasFlex = new Flex(fogbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_fog, canvas);

    fogbutton.div.onclick = function() {
      actions.push({type:ACTION_ABILITY, ability:0});
    };

    registerTooltip(fogbutton.div, 'fog ability: mushrooms produce more spores, consume less seeds, and aren\'t affected by winter');
  }

  if(state.upgrades[upgrade_fogunlock].count) {
    var d = util.getTime() - state.fogtime;
    if(d > getFogWait()) {
      fogtimerflex.div.innerHTML = 'ready';

    } else if(d > getFogDuration()) {
      fogtimerflex.div.innerHTML = 'ready in:<br> ' + util.formatDuration(getFogWait() - d, true);
    } else {
      fogtimerflex.div.innerHTML = '<font color="red">active:<br> ' + util.formatDuration(getFogDuration() - d, true) + '</font>';
    }
  }



  if(sunbutton && !state.upgrades[upgrade_sununlock].count) {
    sunbutton.removeSelf();
    suntimerflex.removeSelf();
    sunbutton = undefined;
  }

  if(!sunbutton && state.upgrades[upgrade_sununlock].count) {
    sunbutton = new Flex(topFlex, [0.3,0.1], [0,0.1], [0.35,0.1], [0,0.9]);
    styleButton0(sunbutton.div);

    suntimerflex = new Flex(topFlex, [0.35,0.1], [0,0.2], [0.45,0.1], [0,0.9], 1.9);
    suntimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things


    var canvasFlex = new Flex(sunbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_sun, canvas);

    sunbutton.div.onclick = function() {
      actions.push({type:ACTION_ABILITY, ability:1});
    };

    registerTooltip(sunbutton.div, 'sun ability: berries get a production bonus and aren\'t affected by winter');
  }

  if(state.upgrades[upgrade_sununlock].count) {
    var d = util.getTime() - state.suntime;
    if(d > getSunWait()) {
      suntimerflex.div.innerHTML = 'ready';

    } else if(d > getSunDuration()) {
      suntimerflex.div.innerHTML = 'ready in:<br> ' + util.formatDuration(getSunWait() - d, true);
    } else {
      suntimerflex.div.innerHTML = '<font color="red">active:<br> ' + util.formatDuration(getSunDuration() - d, true) + '</font>';
    }
  }




  if(rainbowbutton && !state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton.removeSelf();
    rainbowtimerflex.removeSelf();
    rainbowbutton = undefined;
  }

  if(!rainbowbutton && state.upgrades[upgrade_rainbowunlock].count) {
    rainbowbutton = new Flex(topFlex, [0.5,0.1], [0,0.1], [0.55,0.1], [0,0.9]);
    styleButton0(rainbowbutton.div);

    rainbowtimerflex = new Flex(topFlex, [0.55,0.1], [0,0.2], [0.65,0.1], [0,0.9], 1.9);
    rainbowtimerflex.div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things


    var canvasFlex = new Flex(rainbowbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_rainbow, canvas);

    rainbowbutton.div.onclick = function() {
      actions.push({type:ACTION_ABILITY, ability:2});
    };

    registerTooltip(rainbowbutton.div, 'rainbow ability: flowers get a boost and aren\'t affected by winter');
  }

  if(state.upgrades[upgrade_rainbowunlock].count) {
    var d = util.getTime() - state.rainbowtime;
    if(d > getRainbowWait()) {
      rainbowtimerflex.div.innerHTML = 'ready';

    } else if(d > getRainbowDuration()) {
      rainbowtimerflex.div.innerHTML = 'ready in:<br> ' + util.formatDuration(getRainbowWait() - d, true);
    } else {
      rainbowtimerflex.div.innerHTML = '<font color="red">active:<br> ' + util.formatDuration(getRainbowDuration() - d, true) + '</font>';
    }
  }
}
