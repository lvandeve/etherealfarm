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

function makePond3Dialog2() {
  var dialog = createDialog({
    scrollable:true,
    title:'Infinity pond',
    bgstyle:'efDialogTranslucent',
    icon:image_pond
  });

  var textFlex = new Flex(dialog.content, 0, 0, 1, 0.2);

  var text = '';

  text += 'Total boost from infinity crops to basic field: ' + state.infinityboost.toPercentString();
  text += ' (max ever had: ' + state.g_max_infinityboost.toPercentString() + ')';

  textFlex.div.innerHTML = text;

  var fieldFlex = new Flex(dialog.content, 0, 0.25, 1, 1);

  fieldFlex.div.style.border = '1px solid red';


  var pondw = 3;
  var pondh = 3;
  var ratio = pondw / pondh;
  var fieldGrid = new Flex(fieldFlex, [0.5,0,-0.5,ratio], [0.5,0,-0.5,1/ratio], [0.5,0,0.5,ratio], [0.5,0,0.5,1/ratio]);
  fieldGrid.div.style.border = '1px solid green';
}
