/*
Ethereal Farm
Copyright (C) 2020-2024  Lode Vandevenne

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

// The images for the tower defense challenges and its pests

var image_burrow = generateAndSetupImage(`
................
................
................
................
......xxx.......
....xx0000......
...x0000xxo.....
...x00xxxxxo....
..x00xxxxxxxo...
..x00xxxxxxxo...
..x0xxxxxxxo....
...xxxxxxxo.....
....oooooo......
................
................
................
`);

var image_go = generateAndSetupImage(`
................
................
................
..$$$$$...$$$$..
.$SSSSS%.$SSSS%.
$SS%%sS%$SS%%SS%
$S%..s%%$S%..$S%
$S%.....$S%..$S%
$S%.$$$%$S%..$S%
$S%.$SS%$S%..$S%
$S%..sS%$S%..$S%
$SS%%%S%$SS$$SS%
.sSSSSS%.sSSSS%.
..%%%%%...%%%%..
................
................
`);

var image_gameover = generateAndSetupImage(`
9:#fff8 8:#fff4
8999999999999998
9999999999999999
9RRR9RRR9R9R9RR9
9R999R9r9RRr9R99
9R9r9Rrr9R9r9Rr9
9r9p9r9p9r9p9r99
9rpp9r9p9r9p9rp9
9999999999999999
9999999999999999
99R99R9R9RR9RRR9
9R9r9R9r9R99R9r9
9R9p9R9p9Rr9Rr99
9r9p9r9p9r99r9p9
99p999p99rp9r9p9
9999999999999999
8999999999999998
`);



// generates 4 rotated versions: N, E, S, W
function createPestImages(image) {
  var a = generateAndSetupImage(image);
  image = rot90(image);
  var b = generateAndSetupImage(image);
  image = rot90(image);
  var c = generateAndSetupImage(image);
  image = rot90(image);
  var d = generateAndSetupImage(image);
  return [a, b, c, d];
}

var image_bullet_berry = generateAndSetupImage(`
................
................
.....oOoo.......
....oooooo......
...ooOooOoo.....
..OoooooooOo....
..ooOoooooooo...
..ooooOooOooo...
..oOoooooooOo...
..oooOoOooooo...
..OooooooOoOo...
...oooOooooo....
....oOooOoo.....
................
................
................
`);

var image_bullet_mush = generateAndSetupImage(`
................
................
.....0300.......
....000000......
...00300300.....
..3000000030....
..00300000000...
..00003003000...
..03000000030...
..00030300000...
..30000003030...
...000300000....
....0300300.....
................
................
................
`);

var image_splash_mush = generateAndSetupImage(`
................
................
..0.....030030..
.030....00000...
00000..00.......
00.03..3........
....00....00030.
.........300300.
............00..
....000.0.......
...000..00......
..0000..300.....
..030....03.....
.030.....000....
..00......00....
................
`);

var image_bullet_brassica = generateAndSetupImage(`
................
................
.....hHhh.......
....hhhhhh......
...hhHhhHhh.....
..HhhhhhhhHh....
..hhHhhhhhhhh...
..hhhhHhhHhhh...
..hHhhhhhhhHh...
..hhhHhHhhhhh...
..HhhhhhhHhHh...
...hhhHhhhhh....
....hHhhHhh.....
................
................
................
`);



var images_ant = createPestImages(`
...2........2...
...2........2...
....22.22.22....
..2...2222...2..
..2...0220...2..
...2..2222..2...
....22.22.22....
......2222......
...2220220222...
..2...2002...2..
....22.22.22....
...2..2222..2...
..2..022220..2..
..2..200002..2..
......2222......
.......22.......
`);


var images_fire_ant = createPestImages(`
...s........s...
...s........s...
....ss.ss.ss....
..s...ssss...s..
..s...+ss+...s..
...s..ssss..s...
....ss.ss.ss....
......ssss......
...sss%ss%sss...
..s...s%%s...s..
....ss.ss.ss....
...s..ssss..s...
..s..%ssss%..s..
..s..s%%%%s..s..
......ssss......
.......ss.......
`);


var images_beetle = createPestImages(`
......0..0......
...0.000000.0...
....00022000....
0..0400220020..0
.004yhh22222000.
..0yhh22222000..
...0000000000...
.00444h22222000.
0.044hh2222200.0
0.0hhhh2222200.0
0.0hhhhh222000.0
...0yhhh22200...
..00yhhh222000..
.0.0yhh222000.0.
.0..00h22000..0.
0.....0000.....0
`);


var images_tick = createPestImages(`
................
o.0.o......o.0.o
.000..o.0.o.000.
oxxxo..000.oxxxo
.xxx..oxxxo.xxx.
.o.o...xxx..o.o.
o...o..o.o.o...o
......o...o.....
.o.0.o..........
..000..o.0.o....
.oxxxo..000o.0.o
..xxx..oxxx.000.
..o.o...xxxoxxxo
.o...o..o.ooxxx.
.......o...oo.o.
...........o...o
`);


var images_flea = createPestImages(`
..........P.R.P.
....P.R.P..RRR..
P.R.PRRR..PrrrP.
.RRR.rrrP..rrr..
PrrrPrrr...P.P..
.rrrPP.P..P...P.
.P.PP...P.......
P...P...........
................
P.R.P....P.P.R.P
.RRR.P.R.P..RRR.
PrrrP.RRR..PrrrP
.rrr.PrrrP..rrr.
.P.P..rrr...P.P.
.P..P.P.P..P...P
......P..P......
`);


var images_aphid = createPestImages(`
.h.#.h..........
..###..h.#.h....
.hHHHh..###h.#.h
..HHH..hHHH.###.
..h.h...HHHhHHHh
.h...h..h.hhHHH.
.......h...hh.h.
...........h...h
................
h.#.h.h...h..#.h
.###..h.#.h.###.
hHHHh..###.hHHHh
.HHH..hHHHh.HHH.
.h.h...HHH..h.h.
h...h..h.h.h..h.
......h..h......
`);


var images_roach = createPestImages(`
...x.......x....
....x.....x.....
.....x...x......
.x...xxxxx...x..
..x..x0o0x..x...
..x.xxoooxx.x...
...xxOxxxoxx....
....xOoooox.....
..x.xOoooox.x...
.x.xxOooooxx.x..
x...xOoooox...x.
x.xxxOooooxxx.x.
x.x..xOoox..x.x.
x.x..xOoox..x...
..x..xOoox..x...
.x....xxx....x..
`);


var images_termite = createPestImages(`
...Z........Z...
...Z........Z...
....ZZ.ZZ.ZZ....
..Z...ZZZZ...Z..
..Z...YZZY...Z..
...Z..ZZZZ..Z...
....ZZ.ZZ.ZZ....
......ZZZZ......
...ZZZYZZYZZZ...
..Z...ZYYZ...Z..
....ZZ.ZZ.ZZ....
...Z..ZZZZ..Z...
..Z..YZZZZY..Z..
..Z..ZYYYYZ..Z..
......ZZZZ......
.......ZZ.......
`);


var images_locust = createPestImages(`
.....|....|.....
......|..|......
......||||......
...|.|0Hh|0.|...
...|.00Hh00.|...
.|..|hHHhh||..|.
..|||hHHhh||||..
.....hHHhh|.....
...||hHHhh|||...
..|HHhHHhh|HH|..
.|H||hHHhh|||H|.
.||..hHHhh|..||.
.|....hHh|....|.
..|...hHh|...|..
...|..hHh|..|...
...|...h|...|...
`);


var image_statue_spore = `
................
................
................
................
................
.......22.......
......2220......
.....232210.....
.....232210.....
......2320......
.......00.......
.33332222220000.
..344444333330..
...3322222000...
..344444433330..
.33322222220000.
`;

var images_statue_spore = createPlantImages2(image_statue_spore, image_statue_spore, image_statue_spore, image_statue_spore, image_statue_spore);

var image_statue_spore_template = setupImage(blueprintifyImage(images_statue_spore[4]));
var images_statue_spore_template = [image_statue_spore_template, image_statue_spore_template, image_statue_spore_template, image_statue_spore_template, image_statue_spore_template];


var image_statue_splash = `
................
........22......
.......2552.....
..22...2530.....
.2552..2530.....
255532.2530..22.
252530.250..2532
22.230.230.25300
...230..0..230.0
...20...0..20...
................
.33332222220000.
..344444333330..
...3322222000...
..344444433330..
.33322222220000.
`;

var images_statue_splash = createPlantImages2(image_statue_splash, image_statue_splash, image_statue_splash, image_statue_splash, image_statue_splash);

var image_statue_splash_template = setupImage(blueprintifyImage(images_statue_splash[4]));
var images_statue_splash_template = [image_statue_splash_template, image_statue_splash_template, image_statue_splash_template, image_statue_splash_template, image_statue_splash_template];


var image_statue_range = `
................
..........221...
...44444...11...
....3...2.1.1...
.....3...2......
......3.1.2.....
.......1...1....
......1.3..1....
....21...3.1....
....11....31....
...........3....
.33332222220000.
..344444333330..
...3322222000...
..344444433330..
.33322222220000.
`;

var images_statue_range = createPlantImages2(image_statue_range, image_statue_range, image_statue_range, image_statue_range, image_statue_range);

var image_statue_range_template = setupImage(blueprintifyImage(images_statue_range[4]));
var images_statue_range_template = [image_statue_range_template, image_statue_range_template, image_statue_range_template, image_statue_range_template, image_statue_range_template];


var image_statue_seed = `
................
.......11.......
......2321......
......2321......
.....233211.....
.....232211.....
.....232211.....
.....232210.....
.....233210.....
......2320......
.......20.......
.33332222220000.
..344444333330..
...3322222000...
..344444433330..
.33322222220000.
`;

var images_statue_seed = createPlantImages2(image_statue_seed, image_statue_seed, image_statue_seed, image_statue_seed, image_statue_seed);

var image_statue_seed_template = setupImage(blueprintifyImage(images_statue_seed[4]));
var images_statue_seed_template = [image_statue_seed_template, image_statue_seed_template, image_statue_seed_template, image_statue_seed_template, image_statue_seed_template];


var image_statue_snail = `
................
.............00.
...5555......00.
..533334....0...
.53322330...0...
.53233230...00..
.53233230..5331.
.53323230.53301.
..433323355331..
...0223333331...
....11111111....
.33332222220000.
..344444333330..
...3322222000...
..344444433330..
.33322222220000.
`;

var images_statue_snail = createPlantImages2(image_statue_snail, image_statue_snail, image_statue_snail, image_statue_snail, image_statue_snail);

var image_statue_snail_template = setupImage(blueprintifyImage(images_statue_snail[4]));
var images_statue_snail_template = [image_statue_snail_template, image_statue_snail_template, image_statue_snail_template, image_statue_snail_template, image_statue_snail_template];



var image_statue_sniper = `
........1.......
......11111.....
.....1..1..1....
....1...1...1...
....1.......1...
...1111.1.1111..
....1.......1...
....1...1...1...
.....1..1..1....
......11111.....
........1.......
.33322222220000.
..344444333330..
...3322222000...
..344444433330..
.33322222220000.
`;

var images_statue_sniper = createPlantImages2(image_statue_sniper, image_statue_sniper, image_statue_sniper, image_statue_sniper, image_statue_sniper);

var image_statue_sniper_template = setupImage(blueprintifyImage(images_statue_sniper[4]));
var images_statue_sniper_template = [image_statue_sniper_template, image_statue_sniper_template, image_statue_sniper_template, image_statue_sniper_template, image_statue_sniper_template];

