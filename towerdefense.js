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
  // derived stat, not to be saved
  this.path = undefined;

  // order of cells from closest to tree to farthest. Processing monsters in this order ensures monsters won't block each other.
  // derived stat, not to be saved
  this.order = undefined;

  // derived stat, not to be saved
  this.renderinfo = undefined;
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
  this.code = ""; // for seeing if different, for rendering
  this.images = []; // the single directional image
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
    r.images.push(p2.images[dir]);
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

function attackPest(td, index, damage) {
  var p = td.pests[index];
  p.hp = p.hp.sub(damage);
}

function attackPests() {
  var td = state.towerdef;
  if(td.gameover) return;
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      var c = f.getCrop();
      if(!c) continue;

      if(c.type == CROPTYPE_BRASSICA) {
        for(var dir = 0; dir < 4; dir++) {
          var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
          var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
          if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
          var cell = td.pestspercell[y2][x2];
          for(var j = 0; j < cell.length; j++) {
            attackPest(td, cell[j], new Num(1));
          }
        }
      }
    }
  }

  var pests2 = [];
  for(var i = 0; i < td.pests.length; i++) {
    if(td.pests[i].hp.gtr(0)) pests2.push(td.pests[i]);
  }
  td.pests = pests2;
}

function spawnWave() {
  state.g_td_waves++;
  state.c_td_waves++;

  var wave = state.c_td_waves;
  var spores = treeLevelReqBase(wave).spores; // the tree level spores requirement of normal game guides the HP monsters get now

  var td = state.towerdef;
  for(var i = 0; i < 10; i++) {
    var r = getRandomRoll(state.seed0 ^ state.g_td_spawns)[1];
    var type = r < 0.5 ? pest_ant : pest_tick;
    var pest = new PestState();
    pest.index = type;
    pest.maxhp = spores;
    pest.hp = Num(pest.maxhp);
    td.pests.push(pest);
    state.g_td_spawns++;
    state.c_td_spawns++;
  }
}
