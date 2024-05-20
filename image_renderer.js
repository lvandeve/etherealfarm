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
  // Empty, to implement by implementing classes
};

// Extends an image object created by generateImage, with extra data needed for the renderer (such as OffscreenCanvas, ImageData, ...)
// generateImage returns a 3-element array, setupImage may add extra elements to it, but keeps the first 3 the same
Renderer.prototype.setupImage = function(image) {
  // Empty, to implement by implementing classes
};

// Render image (as created by setupImage) onto the given canvas. The canvas is completely replaced by this image, there's no alpha blending onto previous content.
Renderer.prototype.renderImage = function(image, canvas) {
  // Empty, to implement by implementing classes
};

// Render multiple images (as created by setupImage) onto the given canvas
Renderer.prototype.renderImages = function(images, canvas) {
  // Empty, to implement by implementing classes
};

// Blend image (as created by setupImage) onto the given canvas. The difference with renderImage is that it alpha-blends it on top of existing content
Renderer.prototype.blendImage = function(image, canvas) {
  // Empty, to implement by implementing classes
};

// Render an individual pixel on the canvas, which must already have some image rendered on it. The pixel size used is the one of that rendered image.
// This is not necessarily fast (except possibly for some implementations that internally use this for everything), so should be used sparingly, but is useful for a small amount of pixels
Renderer.prototype.renderPixel = function(x, y, color, canvas) {
  // Empty, to implement by implementing classes
};

// Static utility function, given a 2D array of images forming a grid, returns array of [w, h, w2, h2] where:
// w = width of individual image (all are assumed to have the same size)
// h = height of individual image (all are assumed to have the same size)
// w2 = width of the entire grid in pixels
// h2 = height of the entire grid in pixels
// Returns undefined instead of the input is empty (nothing to do)
Renderer.computeImagesSizes_ = function(images) {
  var w, h;
  var numw = 0;
  for(var y = 0; y < images.length; y++) {
    numw = Math.max(numw, images[y].length);
    for(var x = 0; x < images[y].length; x++) {
      if(images[y][x]) {
        w = images[y][x][1];
        h = images[y][x][2];
        break;
      }
    }
  }
  if(w == undefined) return undefined; // nothing to do, no images

  var w2 = w * numw;
  var h2 = h * images.length;

  return [w, h, w2, h2];
}

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
  var dim = Renderer.computeImagesSizes_(images);
  if(dim == undefined) return;
  var iw = dim[0];
  var ih = dim[1];
  var iw2 = dim[2];
  var ih2 = dim[3];

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

OffscreenCanvasRenderer.prototype.renderPixel = function(x, y, color, canvas) {
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
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
  var dim = Renderer.computeImagesSizes_(images);
  if(dim == undefined) return;
  var iw = dim[0];
  var ih = dim[1];
  var iw2 = dim[2];
  var ih2 = dim[3];

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

PureCanvasRenderer.prototype.renderPixel = function(x, y, color, canvas) {
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
};

////////////////////////////////////////////////////////////////////////////////


/*
Renders without canvas, but on a div, using a little div for every single pixel
This is very slow, but doesn't suffer from two things (that chrome does mostly on android):
-chrome removing content from canvases of background tabs with no way of knowing (not even firing contentrestored event), resulting in lost textures with no way to know that we should recreate them
-chrome sometimes being very slow with canvases, even though we're only rendering mostly 16x16 pixel images on them (maybe it's adding overhead for hardware rendering that makes things worse instead of better like hardware is supposed to do, due to how we're using multiple small canvases)
But this renderer is still unusably slow, so just exists as a proof of concept unfortunately
@constructor
*/
function DivRenderer() {
}
//DivRenderer.prototype = new Renderer();

DivRenderer.prototype.createCanvas = function(x, y, w, h, opt_parent) {
  var parent = opt_parent || document.body;

  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = x;
  div.style.top = y;
  div.style.width = w;
  div.style.height = h;

  parent.appendChild(div);

  return div;
};

DivRenderer.prototype.setupImage = function(image) {
  return image;
};

DivRenderer.prototype.renderImage = function(image, canvas) {
  canvas.innerHTML = '';
  canvas.imagerenderer_w_ = image[1];
  canvas.imagerenderer_h_ = image[2];

  this.blendImage(image, canvas);
};

DivRenderer.prototype.renderImages = function(images, canvas) {
  var dim = Renderer.computeImagesSizes_(images);
  if(dim == undefined) return;
  var iw = dim[0];
  var ih = dim[1];
  var iw2 = dim[2];
  var ih2 = dim[3];

  canvas.innerHTML = '';
  canvas.imagerenderer_w_ = iw2;
  canvas.imagerenderer_h_ = ih2;

  for(var y = 0; y < images.length; y++) {
    for(var x = 0; x < images[y].length; x++) {
      var image = images[y][x];
      if(image) {
        var data = image[0];
        for(var y2 = 0; y2 < ih; y2++) {
          for(var x2 = 0; x2 < iw; x2++) {
            if(data[y2][x2][3] == 0) continue;
            this.renderPixel(x * iw + x2, y * ih + y2, RGBtoCSS(data[y2][x2]), canvas)
          }
        }
      }
    }
  }
};

DivRenderer.prototype.blendImage = function(image, canvas) {
  var data = image[0];
  var w = image[1];
  var h = image[2];

  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      this.renderPixel(x, y, RGBtoCSS(data[y][x]), canvas)
    }
  }
};

DivRenderer.prototype.renderPixel = function(x, y, color, canvas) {
  var w = canvas.imagerenderer_w_;
  var h = canvas.imagerenderer_h_;

  var div = document.createElement('div', canvas);
  div.style.position = 'absolute';

  div.style.left = (100 * x / w) + '%';
  div.style.top = (100 * y / h) + '%';

  // extra is needed due to HTML with relative sizes not properly putting divs exactly next to each other, it can either put some 1-pixel gaps between them, or make them overlap (which looks bad for semi-translucent pixels)
  // even if it looks ok on desktop, e.g. on android it may look bad anyway
  var extra = 0.1;
  if(CSStoRGB(color)[3] > 200) extra = 0.6; // this is to avoid ugly empty stripes when things just don't match up

  div.style.width = ((100 * (x + 1) / w) - (100 * x / w) + extra) + '%';
  div.style.height = ((100 * (y + 1) / h) - (100 * y / h) + extra) + '%';

  div.style.backgroundColor = color;
  canvas.appendChild(div);
};

////////////////////////////////////////////////////////////////////////////////


/*
Uses a technique with CSS box-shadow to put arbitrarily many pixels on a single div
Faster than DivRenderer, and has its advantages of not using canvas, but may have some issues with pixel sizes, edges of tiles not exactly touching or overlapping, ...
It's also still clearly slower than the canvas based renderers anyway
This renderer also has a bug currently that makes it not yet releasable: if you start a new game, all the field tiles will be too small compared to the grid, and this has something to do with resizing of the flexes to accomdate for not yet having the tab-UI take up space
Resizing flexes by changing the browser window size works though, for the most part... sometimes some grid artefacts there too
@constructor
*/
function CSSRenderer() {
}
//CSSRenderer.prototype = new Renderer();

CSSRenderer.prototype.createCanvas = function(x, y, w, h, opt_parent) {
  var parent = opt_parent || document.body;

  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = x;
  div.style.top = y;
  div.style.width = w;
  div.style.height = h;

  parent.appendChild(div);

  return div;
};

CSSRenderer.prototype.setupImage = function(image) {
  return image;
};

CSSRenderer.twiddle_ = 1.2;

CSSRenderer.prototype.renderImage = function(image, canvas) {
  canvas.innerHTML = '';

  canvas.imagerenderer_w_ = image[1];
  canvas.imagerenderer_h_ = image[2];

  this.blendImage(image, canvas);
};

CSSRenderer.computeBoxShadowAt_ = function(em, image, sx, sy) {
  var data = image[0];
  var w = image[1];
  var h = image[2];

  var boxShadow = '';
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      if(!data[y][x][3]) continue;
      if(boxShadow.length > 0) boxShadow += ', ';
      // boxShadow does not support using % as unit, which is very unfortunate. But it does support using 'em', which is also relative, but requires ensuring 'em' is set up correctly
      // em should be setup correctly by multiple getComputedStyle calls, but this is still an unfortunate brittle system and it would have been much better if % would work for box-shadow
      // the reason we want relative is so that window resizes will automatically make this be correct
      boxShadow += ((sx + x) * em) + 'em ';
      boxShadow += ((sy + y) * em) + 'em ';
      boxShadow += '0 ';
      boxShadow += RGBtoCSS(data[y][x]);
    }
  }

  return boxShadow;
};

CSSRenderer.computeBoxShadow_ = function(em, image) {
  return CSSRenderer.computeBoxShadowAt_(em, image, 0, 0);
};

CSSRenderer.prototype.renderImages = function(images, canvas) {
  var dim = Renderer.computeImagesSizes_(images);
  if(dim == undefined) return;
  var iw = dim[0];
  var ih = dim[1];
  var iw2 = dim[2];
  var ih2 = dim[3];

  canvas.innerHTML = '';
  canvas.imagerenderer_w_ = iw2;
  canvas.imagerenderer_h_ = ih2;

  var fontSize = parseFloat(getComputedStyle(canvas).fontSize);
  var elWidth = parseFloat(getComputedStyle(canvas).width);
  var em = elWidth / fontSize / iw2;

  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = 0;
  div.style.top = 0;
  div.style.width = (100 / iw2 * CSSRenderer.twiddle_) + '%';
  div.style.height = (100 / ih2 * CSSRenderer.twiddle_) + '%';

  var boxShadow = '';

  for(var y = 0; y < images.length; y++) {
    for(var x = 0; x < images[y].length; x++) {
      var image = images[y][x];
      if(!image) continue;

      if(boxShadow.length > 0) boxShadow += ', ';
      boxShadow += CSSRenderer.computeBoxShadowAt_(em, image, x * iw, y * ih);
    }
  }

  //div.style.marginBottom = (100 / h * CSSRenderer.twiddle_) + '%';
  //div.style.marginBottom = '8px';
  div.style.boxShadow = boxShadow;
  //div.style.boxShadow = '8px 8px 0 #0ff';
  canvas.appendChild(div);


  if(images[0][0] && images[0][0][0][0][3] > 0) {
    div.style.backgroundColor = RGBtoCSS(images[0][0][0][0]); // the first one doesn't work for some reason (because it's where the div itself is maybe?)
  }
};

CSSRenderer.prototype.blendImage = function(image, canvas) {
  var data = image[0];
  var w = image[1];
  var h = image[2];

  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = 0;
  div.style.top = 0;
  div.style.width = (100 / w * CSSRenderer.twiddle_) + '%';
  div.style.height = (100 / h * CSSRenderer.twiddle_) + '%';

  var fontSize = parseFloat(getComputedStyle(canvas).fontSize);
  var elWidth = parseFloat(getComputedStyle(canvas).width);
  var em = elWidth / fontSize / w;

  var boxShadow = CSSRenderer.computeBoxShadow_(em, image);
  if(data[0][0][3] > 0) {
    div.style.backgroundColor = RGBtoCSS(data[0][0]); // the first one doesn't work for some reason (because it's where the div itself is maybe?)
  }


  //div.style.marginBottom = (100 / h * CSSRenderer.twiddle_) + '%';
  //div.style.marginBottom = '8px';
  div.style.boxShadow = boxShadow;
  //div.style.boxShadow = '8px 8px 0 #0ff';
  canvas.appendChild(div);

};

CSSRenderer.prototype.renderPixel = function(x, y, color, canvas) {
  // For now, reuse the implementation of the DivRenderer instead...
  // TODO: instead add more styles to the boxShadow (or to a new boxShadow div specifically for those extra pixels), and have an 'endPixelRender' function to group them together to avoid reassigning a huge CSS style string each time
  new DivRenderer().renderPixel(x, y, color, canvas);
};

////////////////////////////////////////////////////////////////////////////////


/*
Use SVG as the way to render the pixels
Unfortunately it turns out to be too slow, not as bad as DivRenderer but everything feels a bit slugglish, like opening dialogs.
@constructor
*/
function SVGRenderer() {
}
//SVGRenderer.prototype = new Renderer();

SVGRenderer.namespace = 'http://www.w3.org/2000/svg'; // This must be used with createElementNS to make SVG's work

SVGRenderer.prototype.createCanvas = function(x, y, w, h, opt_parent) {
  var parent = opt_parent || document.body;

  var svg = document.createElementNS(SVGRenderer.namespace, 'svg');
  svg.style.position = 'absolute';
  svg.style.left = x;
  svg.style.top = y;
  svg.style.width = w;
  svg.style.height = h;
  svg.setAttribute('shape-rendering', 'crispEdges');

  parent.appendChild(svg);

  return svg;
};

SVGRenderer.prototype.setupImage = function(image) {
  return image;
};

SVGRenderer.prototype.renderImage = function(image, canvas) {
  var w = image[1];
  var h = image[2];
  canvas.innerHTML = '';
  canvas.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  this.blendImage(image, canvas);
};

SVGRenderer.prototype.renderImages = function(images, canvas) {
  var dim = Renderer.computeImagesSizes_(images);
  if(dim == undefined) return;
  var iw = dim[0];
  var ih = dim[1];
  var iw2 = dim[2];
  var ih2 = dim[3];

  canvas.innerHTML = '';
  canvas.setAttribute('viewBox', '0 0 ' + iw2 + ' ' + ih2);

  for(var y = 0; y < images.length; y++) {
    for(var x = 0; x < images[y].length; x++) {
      var image = images[y][x];
      if(image) {
        var data = image[0];
        for(var y2 = 0; y2 < ih; y2++) {
          for(var x2 = 0; x2 < iw; x2++) {
            if(data[y2][x2][3] == 0) continue;
            this.renderPixel(x * iw + x2, y * ih + y2, RGBtoCSS(data[y2][x2]), canvas)
          }
        }
      }
    }
  }
};

SVGRenderer.prototype.blendImage = function(image, canvas) {
  var data = image[0];
  var w = image[1];
  var h = image[2];

  /*for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      if(data[y][x][3] == 0) continue;
      this.renderPixel(x, y, RGBtoCSS(data[y][x]), canvas)
    }
  }*/

  /*var html = '';
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      if(data[y][x][3] == 0) continue;
      html += '<rect width="1" height="1" x=';
      html += x;
      html += ' y=';
      html += y;
      html += ' fill=';
      html += RGBtoCSS(data[y][x]);
      html += '></rect>';
    }
  }
  canvas.innerHTML += html;*/

  var html = '';
  for(var y = 0; y < h; y++) {
    var multi = 1; // combine multiple pixels of same color together to have less elements overall
    for(var x = 0; x < w; x++) {
      if(data[y][x][3] == 0) continue;
      if(x + 1 < w && data[y][x][0] == data[y][x + 1][0]&& data[y][x][1] == data[y][x + 1][1]&& data[y][x][2] == data[y][x + 1][2]&& data[y][x][3] == data[y][x + 1][3]) {
        multi++;
        continue;
      }
      html += '<rect width="';
      html += multi;
      html += '" height="1" x=';
      html += x - multi + 1;
      html += ' y=';
      html += y;
      html += ' fill=';
      html += RGBtoCSS(data[y][x]);
      html += '></rect>';
      multi = 1;
    }
  }
  canvas.innerHTML += html;
};

SVGRenderer.prototype.renderPixel = function(x, y, color, canvas) {
  //var w = canvas.imagerenderer_w_;
  //var h = canvas.imagerenderer_h_;

  var rect = document.createElementNS(SVGRenderer.namespace, 'rect');

  rect.setAttribute('width', '1');
  rect.setAttribute('height', '1');
  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  rect.setAttribute('fill', color);

  canvas.appendChild(rect);
};

////////////////////////////////////////////////////////////////////////////////

var renderer = new OffscreenCanvasRenderer();
//var renderer = new PureCanvasRenderer();
//var renderer = new DivRenderer();
//var renderer = new CSSRenderer();
//var renderer = new SVGRenderer();

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
