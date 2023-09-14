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
  this.maxhp = Num(0); // starting hp, measured in spores
  this.hp = Num(0); // hp remaining, measured in spores
  // coordinates in the field
  this.x = 0;
  this.y = 0;
}

function TowerDefenseState() {
  this.pests = [];

  this.lastTick = 0;
  this.ticks = 0;
  this.gameover = false;

  // derived stat, not to be saved
  this.path = undefined;
  // derived stat, not to be saved
  this.renderinfo = undefined;
}

function precomputeTD() {
  var td = state.towerdef;
  td.path = computeTDPath();
}

// pest rendering and processing info for pests on one location
function PestRenderInfo() {
  this.code = ""; // for seeing if different, for rendering
  this.images = []; // the single directional image
}

function comptePestsRenderInfo() {
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
  for(var i = 0; i < state.towerdef.pests.length; i++) {
    var p = state.towerdef.pests[i];
    var p2 = pests[p.index];
    var r = result[p.y][p.x];
    r.code += '' + p.index + ';';
    var dir = 0;
    if(path) {
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

function computeTDPath() {
  var stack = [];
  var result = [];
  for(var y = 0; y < state.numh; y++) {
    result[y] = [];
    for(var x = 0; x < state.numw; x++) {
      result[y][x] = new PathInfo();
      var f = state.field[y][x];
      if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
        stack.push([x, y]);
        result[y][x].dist = 0;
      }
    }
  }
  while(stack.length > 0) {
    var s = stack.pop();
    var x = s[0];
    var y = s[1];
    for(var dir = 0; dir < 4; dir++) {
      var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
      var f = state.field[y2][x2];
      if(f.index != 0 && f.index != FIELD_BURROW) continue;
      var dist = result[y][x].dist + 1;
      var dist2 = result[y2][x2].dist;
      if(dist < dist2) {
        result[y2][x2].dist = dist;
        result[y2][x2].dir = (dir + 2) & 3; // opposite dir
        stack.push([x2, y2])
      }
    }
  }
  return result;
}

function movePests() {
  var td = state.towerdef;
  var path = td.path;
  if(!path || path.length != state.numh || path[0].length != state.numw) return;

  for(var i = 0; i < td.pests.length; i++) {
    var p = td.pests[i];
    var dir = path[p.y][p.x].dir;
    if(dir < 0) continue;
    var x2 = p.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
    var y2 = p.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
    if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
    p.x = x2;
    p.y = y2;
    var f2 = state.field[y2][x2];
    if(f2.index == FIELD_TREE_TOP || f2.index == FIELD_TREE_BOTTOM) {
      td.gameover = true;
      if(f2.index == FIELD_TREE_BOTTOM) p.y--; // the one remaining pest: don't overlap the tree level number
      td.pests = [p];
    }
  }
}
