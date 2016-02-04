var canvas;
var context;
var images;
var fps = 30;
var now;
var then = Date.now();
var interval = 1000 / fps;
var delta;
var imagesLoaded = 0;
var currentLevel = 0;
var targetLevel = 0;
var level0 = 0;
var level1 = 0;
var lastHovered = -1;

window.onload = function()
{
  loadJSON(loaded, './frames.json');
}

function loaded(framesString)
{
  images = JSON.parse(framesString);
  canvas = document.getElementById('keyframeBrowser');
  context = canvas.getContext('2d');

  addEventlistener();

  // crate image objects and set initial position
  var xPos = 0;
  var yPos = 300;

  for (var i=0; i < images.length; i++)
  {
    var imageObj = new Image();
    imageObj.onload = imageloaded;
    imageObj.src = "thumbnails/" + images[i].src;

    images[i].image = imageObj;

    // set current and target values
    images[i].currWidth = images[i].width/2;
    images[i].currHeight = images[i].height/2;
    images[i].currX = xPos;
    images[i].currY = yPos - images[i].currHeight;

    images[i].targetWidth = images[i].currWidth;
    images[i].targetHeight = images[i].currHeight;
    images[i].targetX = images[i].currX;
    images[i].targetY = images[i].currY;
    images[i].steps = 1;

    xPos += images[i].currWidth;
  }
}

function addEventlistener()
{
  canvas.onmousemove = canvasMouseMove;
  canvas.onmousewheel = canvasOnMouseWheel;
}

function imageloaded ()
{
  imagesLoaded++;

  if (imagesLoaded == images.length)
  {
    draw();
  }
}

function setTargetValues(hovered)
{
  setTargetValuesCoverFlow(hovered);

  if (currentLevel != targetLevel)
  {
    setTargetValuesZoom();
  }
}

function setTargetValuesCoverFlow(hovered)
{
  var xPos = 0;
  var yPos = 300;

  for(var i=0; i < images.length; i++)
  {
    if (i == hovered)
    {
      images[i].targetWidth = images[i].width;
      images[i].targetHeight = images[i].height;
    }
    else if (i == hovered - 1 || i == hovered + 1)
    {
      images[i].targetWidth = images[i].width/1.5;
      images[i].targetHeight = images[i].height/1.5;
    }
    else
    {
      images[i].targetWidth = images[i].width/2;
      images[i].targetHeight = images[i].height/2;
    }

    images[i].targetX = xPos;
    images[i].targetY = yPos - images[i].targetHeight;
    images[i].steps = 10;

    xPos += images[i].targetWidth;
  }
}

function setTargetValuesZoom()
{
  // TODO
}

function getHovered(event)
{
  // get element which is hovered
  for (var i=0; i < images.length; i++)
  {
    // check bounds
    if (images[i].currX <= event.clientX && images[i].currX + images[i].currWidth >= event.clientX)
    {
      return i;
    }
  }
}

function canvasMouseMove(event)
{
  var hovered = getHovered(event);

  if (lastHovered != hovered)
  {
    lastHovered = hovered;
    setTargetValues(hovered);
  }
}

function canvasOnMouseWheel(event)
{
  var hovered = getHovered(event);

  if (event.deltaY < 0)
  {
    // zoom in
    targetLevel++;
  }
  else
  {
    // zoom out
    targetLevel--;
  }

  // check bounds
  targetLevel = Math.min(2, targetLevel);
  targetLevel = Math.max(0, targetLevel);

  if (targetLevel == 1)
  {
    level0 = hovered;
  }
  else if (targetLevel == 2)
  {
    level1 = hovered;
  }

  setTargetValues(hovered);

  event.preventDefault();
}

function draw()
{
  requestAnimationFrame(draw);
  now = Date.now();
  delta = now - then;

  if (delta > interval)
  {
    then = now - (delta % interval);

    animate();
    render();
  }
}

// renders each display object based on its current size and position;
function render()
{
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (var i=0; i < images.length; i++)
  {
    context.drawImage(images[i].image, images[i].currX, images[i].currY, images[i].currWidth, images[i].currHeight);
  }
}

// sets the desired current position and size of each display object
function animate()
{
  for (var i=0; i < images.length; i++)
  {
    images[i].currHeight += getAnimationStep(images[i].currHeight, images[i].targetHeight, images[i]);
    images[i].currWidth += getAnimationStep(images[i].currWidth, images[i].targetWidth, images[i]);
    images[i].currX += getAnimationStep(images[i].currX, images[i].targetX, images[i]);
    images[i].currY += getAnimationStep(images[i].currY, images[i].targetY, images[i]);
  }
}

function getAnimationStep(curr, target, image)
{
  if (curr == target) return 0;
  if (image.steps <= 0) image.steps = 1;

  var diff = target - curr;
  var step = diff / image.steps;

  // image.steps = Math.max(1, image.steps-1);

  return step;
}

function loadJSON(callback, file)
{
    var xobj = new XMLHttpRequest();

    xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true);

    xobj.onreadystatechange = function ()
    {
      if (xobj.readyState == 4 && xobj.status == "200")
      {
        callback(xobj.responseText);
      }
    };

    xobj.send(null);
 }

function getCurrentCluster()
{
  if (currentLevel == 0) {
    return images;
  }
  else if (currentLevel == 1) {
    return images[level0].childs;
  }
  else if (currentLevel == 2) {
    return images[level0].childs[level1].childs;
  }
}
