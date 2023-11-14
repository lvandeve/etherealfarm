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


// opt_crop is cropid for specific crop in case it has a slightly different description
function getTDCropTypeHelp(type) {
  switch(type) {
    case CROPTYPE_BERRY: return 'Required for mushrooms to get seeds for their spores production for damage.';
    case CROPTYPE_MUSH: return 'Hits pests with spores. Requires a berry next to it to get seeds production from.';
    case CROPTYPE_FLOWER: return 'Boosts neighboring berries and mushrooms';
    case CROPTYPE_STINGING: return 'Boosts neighboring mushrooms, but also increases their seeds consumption';
    case CROPTYPE_BRASSICA: return 'Hits all pests that are right next to the brassica, but cannot target at a distance. Its damage depends on neighboring mushrooms, but it can also do a small amount of damage on its own.';
    case CROPTYPE_MISTLETOE: return '';
    case CROPTYPE_BEE: return 'Boosts orthogonally neighboring flowers (in spring also diagonally). Since this is a boost of a boost, indirectly boosts berries and mushrooms by an entirely new factor.';
    case CROPTYPE_CHALLENGE: return 'Statues affect mushrooms in various way. They must orthogonally or diagonally touch the mushroom.';
    case CROPTYPE_FERN: return '';
    case CROPTYPE_NUT: return '';
    case CROPTYPE_PUMPKIN: return '';
    case CROPTYPE_RUNESTONE: return '';
  }
  return undefined;
}

function Pest() {
  this.name = 'unnamed';
  this.images = images_ant;
  this.speed = 2; // amount of ticks for 1 movement. 1 = fast, 2 = normal, 3 = slow, 4 = very slow
  this.hp = 0; // max base hp, measured in multiple of spores required for tree level matching the wave (wave 1 to get tree to level 1, etc...)
  this.group = 1; // higher than 1 means it represents a group of multiple separate creatures. In that case, hp gives the hp of the full group, not that of one individual member. The group size determines the max damage that can be done by a non-splash damage tower at once
  this.splahsresistant = false; // if true, resistant against splash damage mushrooms (but not against brassica)
  this.slowresistant = false; // if true, resistant against the slow effect of mushrooms (but still receives damage from it)
}

function getPestInfoHTML(f) {
  var result = '';
  if(state.challenge == challenge_towerdefense && !!pest_render_info && pest_render_info[f.y]) {
    var td = state.towerdef;
    var pest_info = pest_render_info[f.y][f.x];
    if(pest_info && pest_info.tooltip) {
      result += 'TD: ' + pest_info.tooltip + '<br/>';
    }
  }
  return result;
}

var registered_pests = []; // indexed consecutively, gives the index to pests
var pests = []; // indexed by pest index

// 16-bit ID, auto incremented with registerPest, but you can also set it to a value yourself, to ensure consistent IDs for various pests (between savegames) in case of future upgrades
var pest_register_id = -1;

function registerPest(name, images, hp, speed, groupsize) {
  if(!images) images = images_ant;
  if(pests[pest_register_id] || pest_register_id < 0 || pest_register_id > 65535) throw 'pest id already exists or is invalid!';
  var pest = new Pest();
  pest.index = pest_register_id++;
  pests[pest.index] = pest;
  registered_pests.push(pest.index);

  pest.name = name;
  pest.images = images;
  pest.speed = speed;
  pest.hp = hp; // this is a multiplier of standard hp for this wave, not total hp
  pest.group = groupsize;

  return pest.index;
}

pest_register_id = 0;
var pest_ant = registerPest('ant', images_ant, 1, 2, 1);
var pest_fire_ant = registerPest('fire ant', images_fire_ant, 2, 2, 1);
pests[pest_fire_ant].slowresistant = true;
var pest_beetle = registerPest('beetle', images_beetle, 10, 4, 1);
var pest_tick = registerPest('tick', images_tick, 1, 2, 8);
var pest_roach = registerPest('roach', images_roach, 0.5, 1, 1);
var pest_termite = registerPest('termite', images_termite, 1.5, 3, 1);
pests[pest_termite].splahsresistant = true;
pests[pest_termite].slowresistant = true;
var pest_flea = registerPest('flea', images_flea, 0.75, 1, 6);
var pest_aphid = registerPest('aphid', images_aphid, 2, 3, 6);
var pest_locust = registerPest('locust', images_locust, 1, 1, 1);


function PestState() {
  this.index = pest_ant;
  this.maxhp = Num(10); // starting hp, measured in spores
  this.hp = Num(100); // hp remaining, measured in spores
  this.x = 0;
  this.y = 0;

  this.slowtime = 0; // if a positive value, it's an amount of steps for which it is slowed by 1
  this.slownum = 0;
  this.moneytime = 0; // if a positive value, it's an amount of steps for which it gives extra seeds
  this.moneynum = 0;

  // not saved, used for rendering: using last move dir looks better than using the computed path dir directly
  this.lookdir = -1;
}

PestState.prototype.getSpeed = function() {
  var result = pests[this.index].speed;
  if(this.slowtime) result += this.slownum;
  return result;
}

function TowerState() {
  this.kills = 0;
  this.lastattack = 0;
};

function TowerDefenseState() {
  this.pests = [];

  this.lastTick = 0; // time of last tick
  this.ticks = 0; // num ticks done

  this.started = false;
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
  // amount of pests the current wave had in full, used for computing gain per pest.
  this.num = 0;

  // becomes true if the wave has been rendered for at least a frame, used to make the wave visible before shooting starts
  this.wave_seen = false;

  // when the most recent wave started
  this.wavestarttime = 0;
  // when the current wave was defeated, if defeated. if not yet defeated, this value has no meaning
  this.waveendtime = 0;
  // how long the previous wave took in total to defeat. This is waveendtime - wavestarttime at the time of defeat, but of the previous wave, not this one
  this.lastwavetime = 0;

  // tower states for x,y positions on the map
  this.towers = [];
}

function resetTD() {
  state.towerdef = new TowerDefenseState();
}

function tdWaveActive() {
  var td = state.towerdef;
  if(td.gameover || !td.started) return false;
  if(!(state.towerdef.pests.length > 0)) return false;
  return true;
}

// returns the timestamp when the next wave should start
function tdNextWaveTime() {
  var td = state.towerdef;
  var wait = td.lastwavetime;
  if(wait > 10) wait = 10;
  //if(wait > 2) wait = 2;
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
    if(r.images.length > 4 && i + 2 < td.pests.length) imdir = (r.images.length & 3); // on the spawn point a lot of pests can be stacked on top together, so use rotated images to show that there are many there. But ensure the last few are rendered facing the correct direction, so only some below are rotated and the top one looks correct.
    r.images.push(p2.images[imdir]);
    var name = pests[p.index].name;
    r.tooltip += '<br>' + upper(name) + ', hp: ' + p.hp.toString()/* + ' / ' + p.maxhp.toString()*/ + ', speed: ' + Num(2 / p2.speed).toString();
    if(p2.group != 1) r.tooltip += '. Group size: ' + p2.group;
    if(p2.splahsresistant) r.tooltip += '. Splash resist';
    if(p2.slowresistant) r.tooltip += '. Slow resist';
    if(p.slowtime) r.tooltip += '. Slowed';
    if(p.moneytime) r.tooltip += '. Rich';
    r.rel_hp = p.hp.div(p.maxhp);
    r.code += Math.floor(r.rel_hp * 20) + ';';
  }
  return result;
}

function PathInfo() {
  this.dist = Infinity; // distance from the tree
  this.dir = -1; // direction to walk to get to tree from here. 0=N, 1=E, 2=S, 3=W, -1=unreachable
}

// updates state.towerdef with computed tower defense shortest path.
// returns true if a valid path from burrow to tree was found, false otherwise
// opt_check: if given, is array of x/y coordinates of a tile to check, to check if planting there would block the maze. If this is given, then state.towerdef is not updated.
function computeTDPath(td, opt_check) {
  var queue = [];
  var path = [];
  var order = [];

  var found = false;

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
      if(opt_check && x == opt_check[0] && y == opt_check[1]) continue; // new potential crop position to test
      var f = state.field[y2][x2];
      if(f.index != 0 && f.index != FIELD_BURROW) continue;
      if(f.index == FIELD_BURROW) found = true;
      var dist = path[y][x].dist + 1;
      var dist2 = path[y2][x2].dist;
      if(dist < dist2) {
        path[y2][x2].dist = dist;
        path[y2][x2].dir = (dir + 2) & 3; // opposite dir
        queue.push([x2, y2])
      }
    }
  }
  if(!opt_check) {
    td.path = path;
    td.order = order;
  }
  return found;
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
      var p = td.pests[cell[j]];
      var p2 = pests[p.index];
      if((td.ticks % p.getSpeed()) != 0) continue;
      if(p.slowtime > 0) p.slowtime--;
      if(p.moneytime > 0) p.moneytime--;
      pests_order.push(p);
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
    var speed = p.getSpeed();
    var speeds2 = td.speeds[y2][x2];
    if(speeds2[speed]) continue;

    var speeds = td.speeds[p.y][p.x];
    p.x = x2;
    p.y = y2;
    p.lookdir = dir;
    speeds[speed] = false;
    speeds2[speed] = true;

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

function hastenWaves(damage) {
  var td = state.towerdef;
  // Quickly end waves if they're completely obliterated
  while(damage.gt(getTDWaveHealth(td.wave + 1).mulr(0.5))) {
    state.res.addInPlace(getTDWaveRes(td.wave));
    td.wave++;
    //console.log('Quick defeated wave ' + td.wave);
  }
}

function getFocusDamageMul(td) {
  //var num = td.num;
  var num = td.pests.length;
  if(num <= 0) return 1;
  else if(num <= 1) return 4;
  else if(num <= 2) return 2;
  else if(num <= 3) return 1.5;
  else if(num <= 4) return 1.25;
  return 1;
}

// x0, y0 = attack origin, the location of the tower
// x1, y1 = attack target
// splash: if true, it's a splash damage tower, so it can hit all members of a group at once
// returns true if pest exterminated (and not already exterminated from earlier shot beforehand)
function attackPest(td, index, damage, x0, y0, x1, y1, splash, focus, slow, money) {
  if(x0 < 0 || y0 < 0 || x0 >= state.numw || y0 >= state.numh) return false;
  if(x1 < 0 || y1 < 0 || x1 >= state.numw || y1 >= state.numh) return false;

  // pests on the burrow spot are partially protected by the burrow itself. The reason for this: they are all on top of each other here, which would give splash damage towers a huge benefit compared to pests on the other tiles.
  // but we do want SOME of that benefit to make early waves go very fast (so all pests can be defeated in a single splash damage or brassica shot there). So allow partial damage, just not all of it.
  if(state.field[y0][x0].index == FIELD_BURROW) damage = damage.mulr(1 / 16);
  var p = td.pests[index];
  var p2 = pests[p.index];


  if(slow && !p2.slowresistant) {
    p.slowtime = 15;
    p.slownum = slow;
  }
  if(money) {
    p.moneytime = 15;
    p.moneynum = money;
  }
  if(splash && p2.splahsresistant) return false; // resistent to splash damage, but it may still get the slow or money effects above

  if(focus) {
    //console.log('damage before: ' + damage.toString());
    damage = damage.mulr(getFocusDamageMul(td));
    //console.log('damage after: ' + damage.toString());
  }

  if(p2.group > 1) {
    if(splash) {
      // each group member is hit at once with the full damage in case of a splash hit
      damage = damage.mulr(p2.group);
    } else {
      // if not a splash hit, then can maximally kill one group member at the time
      // NOTE: this is a simulation of what would happen with a group and non-splash damage, but this simulation is not correct if both some splash and non-splash hits occur (e.g. a splash hit brings all of the group to 1% hp, then a non-splash hit would kill all at once). That would requiring storing all individual hp's, but we don't do that
      var maxdamage = p.maxhp.divr(p2.group).mulr(1.01); // the 1.01 is to avoid numerical precision issues requiring one more shot
      if(damage.gt(maxdamage)) damage = maxdamage;
    }
  }

  // count if this tower exterminated the pest, but not if its damage was much higher than maxhp: super easy kills are not counted, to make the stats give a somewhat more useful signal than "was the tower closest to start that exterminated all pests"
  if(p.hp.gtr(0) && damage.gt(p.hp) && damage.lt(p.maxhp.mulr(2))) {
    td.towers[y0][x0].kills++;
  }

  var result = false;
  if(p.hp.gtr(0) && damage.gt(p.hp)) result = true;

  p.hp = p.hp.sub(damage);

  // Quickly end waves if they're completely obliterated
  if(damage.gt(p.maxhp.mulr(10))) hastenWaves(damage);

  return result;
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
  [0, 3],
];

//    4
//   434
//  43234
// 4321234
//432101234
// 4321234
//  43234
//   434
//    4
var td_pattern_4 = [
  [0, -4],
  [-1, -3],[0, -3],[1, -3],
  [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2],
  [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1],
  [-4, 0], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
  [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1],
  [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2],
  [-1, 3],[0, 3],[1, 3],
  [0, 4],
];

//     5
//    545
//   54345
//  5432345
// 543212345
//54321012345
// 543212345
//  5432345
//   54345
//    545
//     5
var td_pattern_5 = [
  [0, -5],
  [-1 -4],[0, -4],[1, -4],
  [-2, -3],[-1, -3],[0, -3],[1, -3],[2, -3],
  [-3, -2], [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2], [3, -2],
  [-4, -1], [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1], [4, -1],
  [-5, 0], [-4, 0], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
  [-4, 1], [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
  [-3, 2], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [3, 2],
  [-2, 3],[-1, 3],[0, 3],[1, 3],[2, 3],
  [-1, 4],[0, 4],[1, 4],
  [0, 5],
];

// assumes that the crop at x, y is a mushroom
// the "sniper" effect overrides dist, sniper makes it effectively infinite
// returns array of [damage mul, dist, splash, sniper, slow, seed, focus]
function getTDStatueMods(x, y) {
  var statue_mul = 1;
  var statue_dist = 3;
  var statue_splash = false;
  var statue_slow = 0;
  var statue_seed = 0;
  var statue_focus = false;
  var statue_sniper = false;
  var num_dmg = 0;
  var num_splash = 0;
  var num_range = 0;
  var num_slow = 0;
  var num_seed = 0;
  for(var dir = 0; dir < 8; dir++) {
    var x2 = x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
    var y2 = y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
    if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
    var f2 = state.field[y2][x2];
    var c2 = f2.getCrop();
    if(c2 && f2.growth >= 1) {
      if(c2.index == challengestatue_0) {
        num_dmg++;
      }
      if(c2.index == challengestatue_1) {
        num_splash++;
      }
      if(c2.index == challengestatue_2) {
        num_range++;
      }
      if(c2.index == challengestatue_3) {
        statue_sniper = true;
      }
      if(c2.index == challengestatue_4) {
        num_slow++;
      }
      if(c2.index == challengestatue_5) {
        num_seed++;
      }
    }
  }
  statue_splash = !!num_splash;
  statue_slow = num_slow;
  statue_seed = num_seed;
  statue_dist += num_range;
  if(num_dmg) statue_dist--; // don't count multiple. Let 1 range statue bring even 2 damage statues have the normal range again.
  statue_mul *= (1 + num_dmg * 0.75);
  //if(num_range) statue_mul *= 0.8;
  if(num_splash) statue_mul *= 0.5;
  else if(num_slow) statue_mul *= 0.75;
  else if(num_seed) statue_mul *= 0.75;
  if(statue_dist < 2) statue_dist = 2;
  if(statue_dist > 5) statue_dist = 5;
  //statue_focus = !statue_splash && num_dmg >= 1;
  statue_focus = num_dmg >= 2;
  if(statue_sniper) statue_mul *= 6;
  return [statue_mul, statue_dist, statue_splash, statue_sniper, statue_slow, statue_seed, statue_focus];
}

function attackPests() {
  var td = state.towerdef;

  resetBulletAnimationCache();

  if(!td.wave_seen) return; // ensure it's rendered for at least one frame, before attacking
  if(td.gameover || !td.started) return;
  if(td.pests.length == 0) return; // this wave is already defeated

  for(var y = 0; y < state.numh; y++) {
    if(!td.towers[y]) td.towers[y] = [];
    for(var x = 0; x < state.numw; x++) {
      if(!td.towers[y][x]) td.towers[y][x] = new TowerState();
      var f = state.field[y][x];
      var c = f.getCrop();
      if(!c) continue;
      if(f.growth < 1) continue;

      var damage = getTDCropDamage(c, f);
      if(damage.ler(0)) continue; // e.g. mushroom without berry, or not an attacking crop at all

      if(td.towers[y][x].lastattack + 1 >= td.ticks) continue; // towers only attack every two frames, but are not limited to even or odd td.ticks to be able to hit fast ones

      if(c.type == CROPTYPE_BRASSICA) {
        for(var dir = 0; dir < 8; dir++) {
          var x2 = x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
          var y2 = y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
          if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
          var cell = td.pestspercell[y2][x2];
          for(var j = 0; j < cell.length; j++) {
            attackPest(td, cell[j], damage, x, y, x2, y2, false, false, false, false);
            createBulletAnimation(x, y, x2, y2, 3);
          }
        }
      }
      if(c.type == CROPTYPE_MUSH) {
        var mods = getTDStatueMods(x, y);
        var statue_mul = mods[0];
        var statue_dist = mods[1];
        var statue_splash = mods[2];
        var statue_sniper = mods[3];
        var statue_slow = mods[4]; // slows down pests
        var statue_seed = mods[5];
        var statue_focus = mods[6];
        var target = undefined;
        var targetx = undefined;
        var targety = undefined;
        if(statue_sniper && td.towers[y][x].lastattack + 8 >= td.ticks) continue; // sniper towers attack much slower
        damage = damage.mulr(statue_mul);
        //var targethp = Num(0);
        var targetdist = 99999;
        var pattern = statue_dist >= 5 ? td_pattern_4 : (statue_dist >= 4 ? td_pattern_4 : ((statue_dist <= 2) ? td_pattern_2 : td_pattern_3));
        var i = 0;
        for(;;) {
          var x2, y2;
          if(statue_sniper) {
            if(i >= state.numw * state.numh) break;
            x2 = i % state.numw;
            y2 = Math.floor(i / state.numw);
          } else {
            if(i >= pattern.length) break;
            x2 = x + pattern[i][0];
            y2 = y + pattern[i][1];
          }
          i++;
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
          if(statue_splash && !statue_sniper) {
            // splash damage
            for(var dir = 0; dir < td_pattern_2.length; dir++) {
              var x3 = targetx + td_pattern_2[dir][0];
              var y3 = targety + td_pattern_2[dir][1];
              if(x3 < 0 || x3 >= state.numw || y3 < 0 || y3 >= state.numh) continue;
              var cell = td.pestspercell[y3][x3];
              for(var j = 0; j < cell.length; j++) {
                attackPest(td, cell[j], damage, x, y, x3, y3, statue_splash, statue_focus, statue_slow, statue_seed);
              }
              createBulletAnimation(targetx, targety, x3, y3, 2);
            }
          } else {
            // splash effect on single-cell group here still possible, for sniper statue
            attackPest(td, target, damage, x, y, targetx, targety, statue_splash, statue_focus, statue_slow, statue_seed);
          }
          createBulletAnimation(x, y, targetx, targety, 1);
        }
      }
      td.towers[y][x].lastattack = td.ticks;
    }
  }

  var pests2 = [];
  for(var i = 0; i < td.pests.length; i++) {
    var p = td.pests[i];
    if(p.hp.ler(0)) {
      var res = td.gain.divr(td.num);
      if(p.moneytime) res.seeds.mulrInPlace(p.moneynum + 1);
      state.res.addInPlace(res);
    } else {
      pests2.push(p);
    }
  }
  if(pests2.length == 0 && td.pests.length != 0) {
    // wave defeated
    td.waveendtime = state.time;
    td.lastwavetime = (td.waveendtime - td.wavestarttime);
    showMessage('Wave ' + td.wave + ' done', C_TD, 34005951);
    window.setTimeout(update);
  }
  td.pests = pests2;
}

function randomTDRoll(wave, what) {
  var seed = 1000 + wave * 100 + what;
  return getRandomRoll(seed)[1];
}

function createRandomWave(td, wave, wavehealth, opt_force_num, opt_force_type) {
  var roll;

  var num_pests;
  roll = randomTDRoll(wave, 0);
  var shape = roll < 0.2 ? 0 : 1;
  roll = randomTDRoll(wave, 0);
  if(shape == 0) {
    num_pests = 1 + Math.floor(roll * 3);
  } else {
    num_pests = 8 + Math.floor(roll * 24);
  }

  if(opt_force_num != undefined) num_pests = opt_force_num;

  roll = randomTDRoll(wave, 1);
  var num_types;
  var all_types = false;
  if(num_pests > 15 && roll > 0.7) {
    num_types = registered_pests.length;
    all_types = true;
  } else {
    roll = randomTDRoll(wave, 2);
    num_types = 2 + Math.floor(roll * 3);
  }

  var types = [];

  for(var i = 0; i < num_types; i++) {
    if(all_types) {
      types[i] = registered_pests[i];
    } else {
      roll = randomTDRoll(wave, 3);
      var num_types = 1 + Math.floor(roll * 2.5);
      types[i] = registered_pests[Math.floor(roll * registered_pests.length)];
    }
  }

  if(opt_force_type != undefined) types = [registered_pests[opt_force_type]];

  var relhp = 0;
  var result = [];
  for(var i = 0; i < num_pests; i++) {
    roll = randomTDRoll(wave, 4);
    var type = types[Math.floor(roll * types.length)];
    var pest = new PestState();
    pest.index = type;
    result[i] = pest;
    var pest2 = pests[registered_pests[pest.index]];

    var count_hp = pest2.hp;
    // make some of the high health and slow ones rougher, relatively speaker
    if(pest2.speed >= 4) count_hp /= 1.5;
    else if(pest2.speed >= 3) count_hp /= 1.25;
    else if(pest2.speed <= 1) count_hp *= 2;

    relhp += count_hp;
  }
  for(var i = 0; i < num_pests; i++) {
    var pest = result[i];
    var pest2 = pests[registered_pests[pest.index]];
    pest.maxhp = wavehealth.divr(relhp).mulr(pest2.hp);
    pest.hp = new Num(pest.maxhp);
  }
  return result;
}

function spawnWave(opt_force_num, opt_force_type) {
  var td = state.towerdef;
  if(td.gameover || !td.started) return;

  state.g_td_waves++;
  state.c_td_waves++;
  td.wave++;

  td.wave_seen = false;


  var wave = td.wave;

  var wavehealth = getTDWaveHealth(wave);

  td.wavestarttime = state.time;
  td.waveendtime = 0;

  td.pests = createRandomWave(td, wave, wavehealth, opt_force_num, opt_force_type);
  td.num = td.pests.length;
  state.g_td_spawns += td.num;
  state.c_td_spawns += td.num;
  td.gain = getTDWaveRes(wave);

  var actual_hp = Num(0);
  for(var i = 0; i < td.pests.length; i++) actual_hp.addInPlace(td.pests[i].hp);
  showMessage('Spawning wave ' + td.wave + '. Total HP: ' + actual_hp.toString() + ' / ' + wavehealth.toString() + ', amount: ' + td.num, C_TD, 2250454032);
}

function runTD() {
  var td = state.towerdef;
  if(state.time < td.lastTick + 0.3) return;
  td.lastTick = state.time;

  td.ticks++;

  precomputeTD();
  movePests();
  attackPests();
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

  // give a bit more to avoid numerical issues preventing a tree level
  return spores.mulr(1.01);
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

// returned as Resource object, the actual damage is in the spores value without modifyTDSPoresForHp applied
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

// does NOT take statues into account
function getTDCropDamage(crop, f) {
  //var result = crop.getProd(f, 6).spores;

  var p = prefield[f.y][f.x];
  var result = p.prod2.spores;
  var result = modifyTDSPoresForHp(result).mulr(0.01);
  if(crop.type == CROPTYPE_BRASSICA) result.mulrInPlace(0.5);
  return result;
}


// End of tuned values
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////




