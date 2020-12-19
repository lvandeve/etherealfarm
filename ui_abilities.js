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


    var canvasFlex = new Flex(fogbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_fog, canvas);

    fogbutton.div.onclick = function() {
      actions.push({type:ACTION_ABILITY, ability:0});
    };

    registerTooltip(fogbutton.div, 'fog ability: mushrooms produce more spores and consume less seeds');
  }

  if(state.upgrades[upgrade_fogunlock].count) {
    var d = util.getTime() - state.fogtime;
    if(d > fog_wait) {
      fogtimerflex.div.innerHTML = 'ready';

    } else if(d > fog_duration) {
      fogtimerflex.div.innerHTML = 'ready in:<br> ' + util.formatDuration(fog_wait - d, true);
    } else {
      fogtimerflex.div.innerHTML = '<font color="red">active:<br> ' + util.formatDuration(fog_duration - d, true) + '</font>';
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


    var canvasFlex = new Flex(sunbutton, 0, 0, 1, 1);
    var canvas = createCanvas('0%', '0%', '100%', '100%', canvasFlex.div);
    renderImage(image_sun, canvas);

    sunbutton.div.onclick = function() {
      actions.push({type:ACTION_ABILITY, ability:1});
    };

    registerTooltip(sunbutton.div, 'sun ability: berries get a production bonus');
  }

  if(state.upgrades[upgrade_sununlock].count) {
    var d = util.getTime() - state.suntime;
    if(d > sun_wait) {
      suntimerflex.div.innerHTML = 'ready';

    } else if(d > sun_duration) {
      suntimerflex.div.innerHTML = 'ready in:<br> ' + util.formatDuration(sun_wait - d, true);
    } else {
      suntimerflex.div.innerHTML = '<font color="red">active:<br> ' + util.formatDuration(sun_duration - d, true) + '</font>';
    }
  }
}
