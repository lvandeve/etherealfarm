/*
Ethereal Farm
Copyright (C) 2020-2023  Lode Vandevenne

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

// Code for the tower defense challenge


function Pest() {
  this.name = 'unnamed';
  this.images = images_ant;
  this.speed = 2; // 0 = very slow, 1 = slow, 2 = regular, 3 = fast
  this.hp = 0; // max base hp, measured in multiple of spores required for tree level matching the wave (wave 1 to get tree to level 1, etc...)
  this.group = 1; // higher than 1 means it represents a group of multiple separate creatures
}

var registered_pests = []; // indexed consecutively, gives the index to pests
var pests = []; // indexed by pest index

// 16-bit ID, auto incremented with registerPest, but you can also set it to a value yourself, to ensure consistent IDs for various pests (between savegames) in case of future upgrades
var pest_register_id = -1;

function registerPest(name, images, hp, speed) {
  if(!images) images = images_ant;
  if(pests[pest_register_id] || pest_register_id < 0 || pest_register_id > 65535) throw 'pest id already exists or is invalid!';
  var pest = new Pest();
  pest.index = pest_register_id++;
  pests[pest.index] = pest;
  registered_pests.push(pest.index);

  pest.name = name;
  pest.images = images;
  pest.speed = speed;
  pest.hp = hp;

  return pest.index;
}

pest_register_id = 0;
var pest_ant = registerPest('ant', images_ant, 0.1, 2);
var pest_tick = registerPest('tick', images_tick, 0.1, 2);



function PestState() {
  this.index = pest_ant;
  this.maxhp = Num(10); // starting hp, measured in spores
  this.hp = Num(100); // hp remaining, measured in spores
  // coordinates in the field
  this.x = 0;
  this.y = 0;

  // not saved, used for rendering: using last move dir looks better than using the computed path dir directly
  this.lookdir = -1;
}

function TowerDefenseState() {
  this.pests = [];

  this.lastTick = 0;
  this.ticks = 0;
  this.gameover = false;
  this.wave = 0; // 0 = no wave started yet, 1 = first wave spawned, ...

  // per cell, array of speeds, whether that speed is present or not
  // derived stat, not to be saved
  this.speeds = undefined;

  // pests arranged per cell, the values are indices in the pests array
  // derived stat, not to be saved
  this.pestspercell = undefined;

  // the shortest path direction to the tree for each cell
  // contains PathInfo object for each [y][x] coordinate
  // derived stat, not to be saved
  this.path = undefined;

  // order of cells from closest to tree to farthest. Processing monsters in this order ensures monsters won't block each other.
  // derived stat, not to be saved
  this.order = undefined;

  // derived stat, not to be saved
  this.renderinfo = undefined;

  // gain the full current wave will give
  this.gain = Res();
  // amount of pests the current wave had in full, used for computing gain per pest
  this.num = 0;

  // becomes true if the wave has been rendered for at least a frame, used to make the wave visible before shooting starts
  this.wave_seen = false;

  // when the most recent wave started
  this.wavestarttime = 0;
  // when the current wave was defeated, if defeated. if not yet defeated, this value has no meaning
  this.waveendtime = 0;
  // how long the previous wave took in total to defeat. This is waveendtime - wavestarttime at the time of defeat, but of the previous wave, not this one
  this.lastwavetime = 0;
}

function tdWaveActive() {
  var td = state.towerdef;
  if(td.gameover) return false;
  if(!(state.towerdef.pests.length > 0)) return false;
  return true;
}

// returns the timestamp when the next wave should start
function tdNextWaveTime() {
  var td = state.towerdef;
  var wait = td.lastwavetime;
  //if(wait > 20) wait = 20;
  if(wait > 2) wait = 2;
  return td.waveendtime + wait;
}

function precomputeTD() {
  var td = state.towerdef;
  computeTDPath(td);

  td.speeds = [];
  td.pestspercell = [];
  for(var y = 0; y < state.numh; y++) {
    td.speeds[y] = [];
    td.pestspercell[y] = [];
    for(var x = 0; x < state.numw; x++) {
      td.speeds[y][x] = [];
      td.pestspercell[y][x] = [];
    }
  }
  for(var i = 0; i < td.pests.length; i++) {
    var p = td.pests[i];
    var p2 = pests[p.index];
    td.speeds[p.y][p.x][p2.speed] = true;
    td.pestspercell[p.y][p.x].push(i);
  }
}

// pest rendering and processing info for pests on one location
function PestRenderInfo() {
  this.code = ''; // for seeing if different, for rendering
  this.images = []; // the single directional image
  this.tooltip = '';
  this.rel_hp = 0; // for progress bar
}

function computePestsRenderInfo() {
  var td = state.towerdef;
  var path = td.path;
  if(path.length != state.numh || path[0].length != state.numw) path = undefined;
  var result = [];
  for(var y = 0; y < state.numh; y++) {
    result[y] = [];
    for(var x = 0; x < state.numw; x++) {
      result[y][x] = new PestRenderInfo();
    }
  }

  td.wave_seen = true;


  for(var i = 0; i < td.pests.length; i++) {
    var p = td.pests[i];
    var p2 = pests[p.index];
    var r = result[p.y][p.x];
    r.code += '' + p.index + ';';
    var dir = p.lookdir;
    if(dir == -1 && path) {
      var p3 = path[p.y][p.x];
      if(p3.dir != -1) dir = p3.dir;
    }
    var imdir = (dir < 0) ? 0 : dir;
    r.images.push(p2.images[imdir]);
    var name = pests[p.index].name;
    r.tooltip = upper(name) + ', hp: ' + p.hp.toString();
    r.rel_hp = p.hp.div(p.maxhp);
  }
  return result;
}

function PathInfo() {
  this.dist = Infinity; // distance from the tree
  this.dir = -1; // direction to walk to get to tree from here. 0=N, 1=E, 2=S, 3=W, -1=unreachable
}

function computeTDPath(td) {
  var queue = [];
  var path = [];
  var order = [];

  for(var y = 0; y < state.numh; y++) {
    path[y] = [];
    for(var x = 0; x < state.numw; x++) {
      path[y][x] = new PathInfo();
      var f = state.field[y][x];
      if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
        queue.push([x, y]);
        path[y][x].dist = 0;
      } else {
        path[y][x].dist = Infinity;
      }
    }
  }
  while(queue.length > 0) {
    var s = queue.shift();
    var x = s[0];
    var y = s[1];
    order.push([x, y]);
    for(var dir = 0; dir < 4; dir++) {
      var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
      var f = state.field[y2][x2];
      if(f.index != 0 && f.index != FIELD_BURROW) continue;
      var dist = path[y][x].dist + 1;
      var dist2 = path[y2][x2].dist;
      if(dist < dist2) {
        path[y2][x2].dist = dist;
        path[y2][x2].dir = (dir + 2) & 3; // opposite dir
        queue.push([x2, y2])
      }
    }
  }
  td.path = path;
  td.order = order;
}

function movePests() {
  var td = state.towerdef;
  var path = td.path;
  if(!path || path.length != state.numh || path[0].length != state.numw) return;

  var pests_order = [];
  for(var i = 0; i < td.order.length; i++) {
    var x = td.order[i][0];
    var y = td.order[i][1];
    var cell = td.pestspercell[y][x];
    for(var j = 0; j < cell.length; j++) {
      pests_order.push(td.pests[cell[j]]);
    }
  }

  for(var i = 0; i < pests_order.length; i++) {
    var p = pests_order[i];
    var p2 = pests[p.index];
    var dir = path[p.y][p.x].dir;
    if(dir < 0) continue;
    var x2 = p.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
    var y2 = p.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
    if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
    var speeds2 = td.speeds[y2][x2];
    if(speeds2[p2.speed]) continue;

    var speeds = td.speeds[p.y][p.x];
    p.x = x2;
    p.y = y2;
    p.lookdir = dir;
    speeds[p2.speed] = false;
    speeds2[p2.speed] = true;

    var f2 = state.field[y2][x2];
    if(f2.index == FIELD_TREE_TOP || f2.index == FIELD_TREE_BOTTOM) {
      td.gameover = true;
      if(f2.index == FIELD_TREE_BOTTOM) p.y--; // the one remaining pest: don't overlap the tree level number
      td.pests = [p];
    }
  }
}


var bulletanimsseen_ = {};

// must be called at the beginning of an attack frame that attacks all pests. Helps avoid too many overlapping bullet animations for performance.
function resetBulletAnimationCache() {
  bulletanimsseen_ = {};
}

/*
type:
0: berry shot
1: mushroom shot
2: mushroom splash damage
3: watercress hit
4: nuts shot
*/
function createBulletAnimation(x0, y0, x1, y1, type) {
  if(x0 < 0 || y0 < 0 || x0 >= state.numw || y0 >= state.numh) return;
  if(x1 < 0 || y1 < 0 || x1 >= state.numw || y1 >= state.numh) return;

  if(state.currentTab != 0) return; // the bullets should only show up in the field tab

  if(type == 2 || type == 3) {
    x0 = x1;
    y0 = y1;
  }

  var code = x0 + y0 * 64 + x1 * 4096 + y1 * 262144 + type * 16777216;
  if(bulletanimsseen_[code]) return;
  bulletanimsseen_[code] = true;

  var div0 = fieldDivs[y0][x0].div;
  var div1 = fieldDivs[y1][x1].div;
  var coords0 = util.getAbsCoords(div0);
  var coords1 = util.getAbsCoords(div1);
  var cx0 = Math.floor((coords0[0] + coords0[2]) * 0.5);
  var cy0 = Math.floor((coords0[1] + coords0[3]) * 0.5);
  var cx1 = Math.floor((coords1[0] + coords1[2]) * 0.5);
  var cy1 = Math.floor((coords1[1] + coords1[3]) * 0.5);
  var pw0 = Math.floor((coords0[2] - coords0[0]) * 0.5);
  var ph0 = Math.floor((coords0[3] - coords0[1]) * 0.5);
  var pw1 = Math.floor((coords1[2] - coords1[0]) * 0.5);
  var ph1 = Math.floor((coords1[3] - coords1[1]) * 0.5);
  var px0 = Math.floor(cx0 - pw0 * 0.5);
  var py0 = Math.floor(cy0 - ph0 * 0.5);
  var px1 = Math.floor(cx1 - pw1 * 0.5);
  var py1 = Math.floor(cy1 - ph1 * 0.5);

  var image = image_bullet_berry;
  if(type == 1) {
    image = image_bullet_mush;
  } else if(type == 2) {
    image = image_splash_mush;
  } else if(type == 3) {
    image = image_bullet_brassica;
  }


  var div = makeDiv(px0, py0, pw0, ph0, document.body);
  div.zIndex = '9999';
  div.style.pointerEvents = 'none'; // make tooltips of what's behind this work through this
  var canvas = createCanvas('0%', '0%', '100%', '100%', div);
  renderImage(image, canvas);

  var anim = 0;

  var animfun = function() {
    var px = Math.floor(px0 * (1 - anim) + px1 * anim);
    var py = Math.floor(py0 * (1 - anim) + py1 * anim);
    div.style.left = px + 'px';
    div.style.top = py + 'px';
    anim += 0.2;
    if(anim > 1) {
      util.removeElement(div);
    } else {
      window.setTimeout(animfun, 50);
    }
  };

  animfun();
}

// x0, y0 = attack origin
// x1, y1 = attack target
function attackPest(td, index, damage, x0, y0, x1, y1) {
  if(x0 < 0 || y0 < 0 || x0 >= state.numw || y0 >= state.numh) return;
  if(x1 < 0 || y1 < 0 || x1 >= state.numw || y1 >= state.numh) return;

  // pests on the burrow spot are partially protected by the burrow itself. The reason for this: they are all on top of each other here, which would give splash damage towers a huge benefit compared to pests on the other tiles.
  // but we do want SOME of that benefit to make early waves go very fast (so all pests can be defeated in a single splash damage or brassica shot there). So allow partial damage, just not all of it.
  if(state.field[y0][x0].index == FIELD_BURROW) damage = damage.mulr(1 / 16);
  var p = td.pests[index];
  p.hp = p.hp.sub(damage);
}


//  2
// 212
//21012
// 212
//  2
var td_pattern_2 = [
  [0, -2],
  [-1, -1], [0, -1], [1, -1],
  [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0],
  [-1, 1], [0, 1], [1, 1],
  [0, 2],
];


//   3
//  323
// 32123
//3210123
// 32123
//  323
//   3
var td_pattern_3 = [
  [0, -3],
  [-1, -2], [0, -2], [1, -2],
  [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1],
  [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0],
  [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1],
  [-1, 2], [0, 2], [1, 2],
  [0, 3]
];

function attackPests() {
  var td = state.towerdef;
  resetBulletAnimationCache();

  if(!td.wave_seen) return; // ensure it's rendered for at least one frame, before attacking
  if(td.gameover) return;
  if(td.pests.length == 0) return; // this wave is already defeated

  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      if(!c) continue;

      var damage = getTDCropDamage(c, f);

      if(c.type == CROPTYPE_BRASSICA) {
        for(var dir = 0; dir < 8; dir++) {
          var x2 = x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
          var y2 = y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
          if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
          var cell = td.pestspercell[y2][x2];
          for(var j = 0; j < cell.length; j++) {
            attackPest(td, cell[j], damage, x, y, x2, y2);
            createBulletAnimation(x, y, x2, y2, 3);
          }
        }
      }
      if(c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH) {
        var target = undefined;
        var targetx = undefined;
        var targety = undefined;
        //var targethp = Num(0);
        var targetdist = 99999;
        var pattern = (c.type == CROPTYPE_MUSH) ? td_pattern_2 : td_pattern_3;
        for(var dir = 0; dir < pattern.length; dir++) {
          var x2 = x + pattern[dir][0];
          var y2 = y + pattern[dir][1];
          if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
          var cell = td.pestspercell[y2][x2];
          for(var j = 0; j < cell.length; j++) {
            var p = td.pests[cell[j]];
            var dist = td.path[y2][x2].dist;
            // The hp check is to ensure it doesn't attack one that's already defeated by another tower during this round
            if((dist >= 0 && dist < targetdist && p.hp.gtr(0)) || target == undefined) {
              target = cell[j];
              targetx = x2;
              targety = y2;
              targetdist = dist;
            }
          }
        }
        if(target != undefined) {
          attackPest(td, target, damage, x, y, targetx, targety);
          createBulletAnimation(x, y, targetx, targety, c.type == CROPTYPE_BERRY ? 0 : 1);
          if(c.type == CROPTYPE_MUSH) {
            // splash damage
            var splashDamage = damage.mulr(0.5);
            for(var dir = 0; dir < td_pattern_2.length; dir++) {
              var x3 = targetx + td_pattern_2[dir][0];
              var y3 = targety + td_pattern_2[dir][1];
              if(x3 < 0 || x3 >= state.numw || y3 < 0 || y3 >= state.numh) continue;
              var cell = td.pestspercell[y3][x3];
              for(var j = 0; j < cell.length; j++) {
                var cell = td.pestspercell[y3][x3];
                for(var j = 0; j < cell.length; j++) {
                  attackPest(td, cell[j], splashDamage, targetx, targety, x3, y3);
                }
              }
              createBulletAnimation(targetx, targety, x3, y3, 2);
            }
          }
        }
      }
    }
  }

  var pests2 = [];
  for(var i = 0; i < td.pests.length; i++) {
    if(td.pests[i].hp.ler(0)) {
      var res = td.gain.divr(td.num);
      state.res.addInPlace(res);
    } else {
      pests2.push(td.pests[i]);
    }
  }
  if(pests2.length == 0 && td.pests.length != 0) {
    // wave defeated
    td.waveendtime = state.time;
    showMessage('Wave ' + td.wave + ' done', C_TD, 34005951);
    window.setTimeout(update);
  }
  td.pests = pests2;
}

function spawnWave() {
  var td = state.towerdef;

  state.g_td_waves++;
  state.c_td_waves++;
  td.wave++;

  td.wave_seen = false;


  var wave = td.wave;

  var wavehealth = getTDWaveHealth(wave);

  var num = 10;

  td.lastwavetime = (td.waveendtime - td.wavestarttime);
  td.wavestarttime = state.time;
  td.waveendtime = 0;
    showMessage('Spawning wave ' + td.wave + '. Total HP: ' + wavehealth.toString(), C_TD, 2250454032);

  td.pests = [];
  for(var i = 0; i < num; i++) {
    var r = getRandomRoll(state.seed0 ^ state.g_td_spawns)[1];
    var type = r < 0.5 ? pest_ant : pest_tick;
    var pest = new PestState();
    pest.index = type;
    pest.maxhp = wavehealth.divr(num);
    pest.hp = Num(pest.maxhp);
    td.pests.push(pest);
    state.g_td_spawns++;
    state.c_td_spawns++;
  }

  td.num = num;
  td.gain = getTDWaveRes(wave);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Begin of tuned values

/*
Tower damage and monster health is defined in spores.
The amount of spores needed to defeat a wave of number N scales relative to the spores required for tree level N in regular game
The amount of spores that monsters give when defeated also scales the same as above. A wave should give enough spores to level the tree 1 level, plus a bit of extras for nuts crops.
Mushroom tower's damage is directly its spore production as in the regular game (but no nettle boost for now)

So the above things (mushroom tower damage, monster health, monster spores drop, and nuts crop cost) does not require special conversions, it's similar to the regular game and spores.
Also brassica copying is simple: it's defined by towers it copies.

But the following things do need conversions and that's defined by the functions in this tuning section:
-amount of seeds that monsters drop per wave
-berry's production to damage in spores
-nuts production to damage in spores
-watercress base (non-copying) damage

The simple spores-only cases above may also still have functions below because there are still some constant factors.

Waves begin at wave 1, the wave to get to tree level 1 (from tree level 0)
*/

function sporesForTDWave_(wave) {
  var spores = treeLevelReqBase(wave).spores;

  return spores.mulr(1.1);
}

function seedsForTDWave_(wave) {
  //return computePretendFullgrownGain().seeds.mulr(getWaveProdTime(wave));

  // wave used for seed compensation reduced: otherwise TD may gave way too much seeds compared to what the player has in the regular game, and unlock way higher plants / break seed records
  var lower_wave = Math.floor(wave * 0.66);
  var spores = treeLevelReqBase(lower_wave).spores;

  var mush0prod = getMushroomProd(0);
  var eff = mush0prod.seeds.div(mush0prod.spores).neg();
  var seeds = spores.mul(eff);

  // compute pure seed production bonuses, and remove pure mushroom production bonuses
  var berry0prod = crops[berry_td_dummy].getProd(undefined).seeds;
  var berry0base = crops[berry_td_dummy].prod.seeds;
  var eff2 = berry0prod.div(berry0base);

  seeds.mulInPlace(eff2);

  // add best flower.
  // DISABLED: do not do this or it gives way too many seeds, way more than in a regular game: best flower is already implicity factored into the required spores amount used above, since mushrooms are boosted by flowers to output their spores
  // even with the reduced "lower_wave", this gives way too much
  //var eff3 = state.bestflowerfortd;
  //seeds.mulInPlace(eff3);

  // protection against wrongly balanced TD seed income: the goal is that during the TD challenge, you work with less seeds than the regular game, not more. If due to mis-tuning of the above formula TD would get way too many seeds, limit here.
  // the way to fix it if this happens is to balance TD differently so that it doesn't give that much seeds, but still plays in a balanced way (ideally with about the same amount of seeds as you get in a regular game, but that's extremely hard to emulate since it's seed drop per wave now)
  var max_seeds = state.g_max_res.seeds.divr(100);
  if(seeds.gt(max_seeds)) seeds = max_seeds;

  return seeds;
}

// modifies spores for HP for a value with much less exponential increase
// without doing this, waves increase health by 9x (and later 18x) per tree level, but that makes strategy completely unimportant
// so this takes a root of the value to make the HP difference between waves less big, so that good strategy allows getting a few waves further, and there are more waves of actual gameplay (rather than either immediately defeated, or immediately game-over waves)
// this is applied both to wave HP and tower damage, so relatively speaking, similar tree levels as in regular (non-TD) game are still reached, but there is more variability around it
// NOTE: this function is only applied as a last step to the HP and damage calculation. All other functions here should be tuned around spores production of mushrooms and spores requirement of tree, to keep the tuning tangible
function modifyTDSPoresForHp(spores) {
  // A smaller exponent (bigger root) makes waves hp more similar, and makes the effect of e.g. double damage from 2 towers, compared to double damage from double spores production, larger
  return spores.powr(0.075);
}

function getTDWaveRes(wave) {
  var res = new Res();
  res.seeds = seedsForTDWave_(wave);
  res.spores = sporesForTDWave_(wave);
  return res;
}

function getTDWaveHealth(wave) {
  var spores = treeLevelReqBase(wave).spores;

  if(state.towerdef.wave >= state.g_treelevel) return spores; // as a protection mechanism (normally the TD challenge should not let you get this high to your max tree level), do not reduce HP if due to a bug or unforeseen gameplay issue, this level is reached anyway. Beating highest tree level should be done with conventional game or challenge, not with a completely different mechanism that turns out to have a bug making you go higher than expected

  return modifyTDSPoresForHp(spores);
}

// returned as Resource object, the actual damage is in the spores value
// this returns damage as spores related to tree requirement (and directly comparable to mushroom attack)
// a separate conversion to convert it to the value used for getTDWaveHealth is done in getTDCropDamage, not here
function getTDBerryBaseDamage(tier) {
  var mushtier = (tier >> 1);
  var reltier = (tier & 1);
  var baseprod = getMushroomProd(mushtier);
  baseprod.seeds = new Num(0);
  if(reltier) baseprod.mulrInPlace(8);
  return baseprod;
}

function getTDCropDamage(crop, f) {
  return modifyTDSPoresForHp(crop.getProd(f, 6).spores);
}


// End of tuned values
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////




