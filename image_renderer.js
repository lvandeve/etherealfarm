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


////////////////////////////////////////////////////////////////////////////////

/*
Abstract class for methods to render the images (with canvas, ...)
(This class isn't really necessary but shows the interfac that must be implemented)
@constructor
*/
function Renderer() {
}

// Creates a new canvas to visibly render image(s) on. Doesn't delete any. WARNING: If re-using this function on existing div, ensure to clear it first!
// This is different from any internal (offscreen, ...) canvas that might be created in setupImage, since that one is not visible and a way to store textures for rendering/blending only
// Depending on the renderer, what it returns doesn't have to be a 'canvas' html element, but it always must be some html element (if not a canvas, then a div, ...)
// x, y, w and h must have HTML units
Renderer.prototype.createCanvas = function(x, y, w, h, opt_parent) {
  // Empty, to impelemnt by implementing classes
};

// Extends an image object created by generateImage, with extra data needed for the renderer (such as OffscreenCanvas, ImageData, ...)
// generateImage returns a 3-element array, setupImage may add extra elements to it, but keeps the first 3 the same
Renderer.prototype.setupImage = function(image) {
  // Empty, to impelemnt by implementing classes
};

// Render image (as created by setupImage) onto the given canvas. The canvas is completely replaced by this image, there's no alpha blending onto previous content.
Renderer.prototype.renderImage = function(image, canvas) {
  // Empty, to impelemnt by implementing classes
};

// Render multiple images (as created by setupImage) onto the given canvas
Renderer.prototype.renderImages = function(images, canvas) {
  // Empty, to impelemnt by implementing classes
};

// Blend image (as created by setupImage) onto the given canvas. The difference with renderImage is that it alpha-blends it on top of existing content
Renderer.prototype.blendImage = function(image, canvas) {
  // Empty, to impelemnt by implementing classes
};

////////////////////////////////////////////////////////////////////////////////

/*
Renders all textures on an offscreen canvas (or a non-offscreen one if OffscreenCanvas not supported by browser - we still call it 'off screen' then), then puts them from the offscreen canvases to the actual visible canvases when rendering them
@constructor
*/
function OffscreenCanvasRenderer() {
}
//OffscreenCanvasRenderer.prototype = new Renderer();


// pool of canvas elements for reuse:
// the first call to getContext (if followed by doing any action on it) on a new canvas is much slower than later calls (at least on chrome as of september 2023).
// so whenever a canvas element will be destroyed, rather than destroying it, detach it from its parent element and put it in the pool here for later reuse
// it seems to work well despite having changed parent and possibly size... though almost all images in ethereal farm are 16x16 so the latter isn't verified yet
// probably whether this slowness exists or not depends on whether hardware acceleration is enabled or not (with hw acceleration making it slower due to longer setup-time), in any case, this definitely improves things in chrome on desktop and android as of 2023
var canvaspool_ = [];

function getCanvasFromPool_() {
  if(canvaspool_.length > 0) {
    var result = canvaspool_[canvaspool_.length - 1];
    canvaspool_.length--;
    return result;
  }
  return document.createElement('canvas');
}

function addCanvasToPool_(canvas) {
  if(canvaspool_.length > 2000) return; // avoid caching TOO much canvases

  // reset event listeners, style, attributes, ... set to this HTML element, that could be completely unneeded or different when the canvas is reused elsewhere
  util.cleanSlateElement(canvas);

  canvaspool_[canvaspool_.length] = canvas;
}

var currentOffscreenCanvas = undefined;
var currentOffscreenCanvasNum = 0;

function createOffscreenCanvas(w, h) {
  if(window.OffscreenCanvas) {
    return new OffscreenCanvas(w, h);
  } else {
    // fallback for browsers without OffscreenCanvas support
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }
}

// Copies pixels from the given regular JS data array into the ImageData object.
function arrayFillImageData(id, data, w, h, offsetx, offsety) {
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      var x2 = x + offsetx;
      var y2 = y + offsety;
      id.data[(y2 * w + x2) * 4 + 0] = data[y][x][0];
      id.data[(y2 * w + x2) * 4 + 1] = data[y][x][1];
      id.data[(y2 * w + x2) * 4 + 2] = data[y][x][2];
      id.data[(y2 * w + x2) * 4 + 3] = data[y][x][3];
    }
  }
}

OffscreenCanvasRenderer.prototype.createCanvas = function(x, y, w, h, opt_parent) {
  var parent = opt_parent || document.body;

  var canvas = getCanvasFromPool_();//document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.left = x;
  canvas.style.top = y;
  canvas.style.width = w;
  canvas.style.height = h;
  canvas.classList.add('pixelated');
  parent.appendChild(canvas);

  return canvas;
};

// Renders image on an internal canvas (in memory texture)
// Returns same format as generateImage, but with additional fields behind it:
// [data, w, h, canvas, imagedata, offsetx, offsety]
// data = the array of numeric pixel values
// w, h = dimensions
// canvas = HTML canvas on which this image is placed
// imagedata = ImageData object used on this canvas
// offsetx, offsety = an offset on the canvas in which this image is, in case a single canvas was used to contain multiple textures (where the offset points to our texture)
OffscreenCanvasRenderer.prototype.setupImage = function(image) {
  if(!image) return undefined;
  var data = image[0];
  var w = image[1];
  var h = image[2];

  var canvas;
  var offsetx = 0;
  var offsety = 0;
  if(w == 16 && h == 16) {
    // combine multiple textures onto a single canvas, because having many small canvases for each individual texture seems to be slow in some browsers (too much overhead if hardware accel enabled if they're all very small?)
    var n = (currentOffscreenCanvasNum & 63);
    if(!n) {
      currentOffscreenCanvas = createOffscreenCanvas(w * 8, h * 8);
    }
    canvas = currentOffscreenCanvas;
    offsetx = w * (n >> 3);
    offsety = h * (n & 7);
    currentOffscreenCanvasNum++;
  } else {
    canvas = createOffscreenCanvas(w, h);
  }

  var ctx = canvas.getContext('2d');
  var imagedata = ctx.createImageData(w, h);

  arrayFillImageData(imagedata, data, w, h, 0, 0);

  ctx.putImageData(imagedata, offsetx, offsety);

  util.setEvent(canvas, 'contextlost', function(e) {
    console.log('lost2');
    e.preventDefault();
  });
  util.setEvent(canvas, 'contextrestored', function() {
    console.log('restored2');
    if(canvas.restoreFun) canvas.restoreFun();
  });

  return [data, w, h, canvas, imagedata, offsetx, offsety];
};

OffscreenCanvasRenderer.prototype.renderImage = function(image, canvas) {
  var iw = image[1];
  var ih = image[2];
  var offsetx = image[5];
  var offsety = image[6];

  if(canvas.width != iw) canvas.width = iw;
  if(canvas.height != ih) canvas.height = ih;

  //var ctx = canvas.getContext("bitmaprenderer");
  var ctx = canvas.getContext('2d');
  //ctx.imageSmoothingEnabled = false; // this has no effect to replace the 'pixelated' CSS property when I try it.

  // There are two options to draw it: using putImageData, or using drawImageData (which requires clearRect first, since it overdraws when there is alpha channel)
  // It looks like the drawImage solution is faster, though as of aug 2023 putImageData instead seems faster in chrome. The other solution is available commented out in case JS performance changes
  // Probably drawImage really should be the faster one anyway though, since it uses an existing canvas as input so can do whatever is most efficient, rather than be forced to start from the bytes data in image[0]

  //ctx.putImageData(image[4], 0, 0);

  //ctx.transferFromImageBitmap(image[3].transferToImageBitmap());

  // image[3] is the offscreen canvas where a copy of the image is stored at an offset. This is copied to the canvas argument of the function, which has no offset
  ctx.clearRect(0, 0, iw, ih); // this has to be done no matter what, because the canvas could be a reused one from the pool.
  ctx.drawImage(image[3], offsetx, offsety, iw, ih, 0, 0, iw, ih);
};

OffscreenCanvasRenderer.prototype.renderImages = function(images, canvas) {
  var iw, ih;
  var numw = 0;
  for(var y = 0; y < images.length; y++) {
    numw = Math.max(numw, images[y].length);
    for(var x = 0; x < images[y].length; x++) {
      if(images[y][x]) {
        iw = images[y][x][1];
        ih = images[y][x][2];
        break;
      }
    }
  }
  if(iw == undefined) return; // nothing to do, no images

  var iw2 = iw * numw;
  var ih2 = ih * images.length;

  if(canvas.width != iw2) canvas.width = iw2;
  if(canvas.height != ih2) canvas.height = ih2;
  var ctx = canvas.getContext('2d');

  for(var y = 0; y < images.length; y++) {
    for(var x = 0; x < images[y].length; x++) {
      var image = images[y][x];
      if(image) {
        ctx.putImageData(image[4], x * iw, y * ih);
      }
    }
  }

  //ctx.putImageData(image[4], 0, 0);

  /*ctx.clearRect(0, 0, iw, ih);
  ctx.drawImage(image[3], 0, 0);*/
};

OffscreenCanvasRenderer.prototype.blendImage = function(image, canvas) {
  var iw = image[1];
  var ih = image[2];
  var offsetx = image[5];
  var offsety = image[6];

  if(canvas.width != iw) canvas.width = iw;
  if(canvas.height != ih) canvas.height = ih;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(image[3], offsetx, offsety, iw, ih, 0, 0, iw, ih);
};


////////////////////////////////////////////////////////////////////////////////


/*
Unlike OffscreenCanvasRenderer, does not use OffscreenCanvas, and will instead create new ImageData objects and render then to the context of each individual canvas at the time of rendering
This may be slower, but likely causes less issues with chrome removing canvases from memory. A current issue with chrome is that it can delete both the main and offscreen canvases from memory, but sends the 'contextrestored' events to the main canvases first even though they depend on the offscreen ones, and then restoring them is impossible
@constructor
*/
function PureCanvasRenderer() {
}
//PureCanvasRenderer.prototype = new Renderer();

PureCanvasRenderer.prototype.createCanvas = function(x, y, w, h, opt_parent) {
  var parent = opt_parent || document.body;

  var canvas = getCanvasFromPool_();//document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.left = x;
  canvas.style.top = y;
  canvas.style.width = w;
  canvas.style.height = h;
  canvas.classList.add('pixelated');
  parent.appendChild(canvas);

  return canvas;
};

PureCanvasRenderer.prototype.setupImage = function(image) {
  return image;
};

PureCanvasRenderer.prototype.renderImage = function(image, canvas) {
  var iw = image[1];
  var ih = image[2];
  if(canvas.width != iw) canvas.width = iw;
  if(canvas.height != ih) canvas.height = ih;
  var ctx = canvas.getContext('2d');
  var imagedata = ctx.createImageData(iw, ih);
  arrayFillImageData(imagedata, image[0], iw, ih, 0, 0);
  ctx.putImageData(imagedata, 0, 0);

  // TODO: don't re-set this event each time this is recursively called
  util.setEvent(canvas, 'contextrestored', function() {
    showMessage('Canvas context restored');
    renderImage(image, canvas);
  });
};

PureCanvasRenderer.prototype.renderImages = function(images, canvas) {
  var iw, ih;
  var numw = 0;
  for(var y = 0; y < images.length; y++) {
    numw = Math.max(numw, images[y].length);
    for(var x = 0; x < images[y].length; x++) {
      if(images[y][x]) {
        iw = images[y][x][1];
        ih = images[y][x][2];
        break;
      }
    }
  }
  if(iw == undefined) return; // nothing to do, no images

  var iw2 = iw * numw;
  var ih2 = ih * images.length;

  if(canvas.width != iw2) canvas.width = iw2;
  if(canvas.height != ih2) canvas.height = ih2;
  var ctx = canvas.getContext('2d');

  for(var y = 0; y < images.length; y++) {
    for(var x = 0; x < images[y].length; x++) {
      var image = images[y][x];
      if(image) {
        var iw = image[1];
        var ih = image[2];
        var imagedata = ctx.createImageData(iw, ih);
        arrayFillImageData(imagedata, image[0], iw, ih, 0, 0);
        ctx.putImageData(imagedata, x * iw, y * ih);
      }
    }
  }
};

PureCanvasRenderer.prototype.blendImage = function(image, canvas) {
  var iw = image[1];
  var ih = image[2];
  if(canvas.width != iw) canvas.width = iw;
  if(canvas.height != ih) canvas.height = ih;
  var ctx = canvas.getContext('2d');

  // temporary canvas, because alpha blending can only be done that way, it can't ise the imagedata itself directly with alphablend, putImageData does not blend, and drawImage requires a canvas
  var canvas2 = document.createElement('canvas');
  canvas2.width = iw;
  canvas2.height = ih;
  var ctx2 = canvas2.getContext('2d');

  var imagedata2 = ctx2.createImageData(iw, ih);
  arrayFillImageData(imagedata2, image[0], iw, ih, 0, 0);
  ctx2.putImageData(imagedata2, 0, 0);
  ctx.drawImage(canvas2, 0, 0, iw, ih, 0, 0, iw, ih);
};

////////////////////////////////////////////////////////////////////////////////

var renderer = new OffscreenCanvasRenderer();
//var renderer = new PureCanvasRenderer();

////////////////////////////////////////////////////////////////////////////////


// creates a new canvas, doesn't delete any. WARNING: If re-using this function on existing div, ensure to clear it first!
// difference from generateAndSetupImage: the canvas from createCanvas is a visible canvas, that of generateAndSetupImage is the texture in memory
// x, y, w and h must have HTML units
function createCanvas(x, y, w, h, opt_parent) {
  return renderer.createCanvas(x, y, w, h, opt_parent);
}

function setupImage(image) {
  return renderer.setupImage(image);
}


function renderImage(image, canvas) {
  return renderer.renderImage(image, canvas);
}


////////////////////////////////////////////////////////////////////////////////

// like generateImage, but also calls setupImage on it
function generateAndSetupImage(text) {
  return setupImage(generateImage(text));
}


// renders grid of images. All images must have the same size, and the grid must be rectangular.
// some images may be set to null/undefined to not render one there
// Using this is faster than using renderImage with individual canvases
function renderImages(images, canvas) {
  renderer.renderImages(images, canvas);
}


// similar to renderImage, but doesn't clear the canvas first, so if the image has transparent pixels, it's drawn with the original canvas content as background
function blendImage(image, canvas) {
  return renderer.blendImage(image, canvas);
}
