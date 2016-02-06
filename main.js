var renderables = [];
var renderEngine;
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
  var images = JSON.parse(framesString);
  var canvas = document.getElementById('keyframeBrowser');
  var context = canvas.getContext('2d');

  renderEngine = new RenderingEngine(canvas);

  addEventlistener(canvas);

  // crate image objects and set initial position
  var xPos = 0;
  var yPos = 300;

  for (var i=0; i < images.length; i++)
  {
    var imageObj = new Image();
    imageObj.onload = imageloaded;
    imageObj.src = "thumbnails/" + images[i].src;

    var renderable = new Renderable(images[i].width/2, images[i].height/2, xPos, yPos - images[i].height/2, 1, imageObj, images[i].width, images[i].height);
    renderables.push(renderable);
    renderEngine.addRenderable(renderable);

    xPos += images[i].width/2;
  }
}

function addEventlistener(canvas)
{
  canvas.onmousemove = canvasMouseMove;
  canvas.onmousewheel = canvasOnMouseWheel;
}

function imageloaded ()
{
  imagesLoaded++;

  if (imagesLoaded == renderables.length)
  {
    // nothing to do here for now
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

  for(var i=0; i < renderables.length; i++)
  {
    if (i == hovered)
    {
      renderables[i].targetWidth = renderables[i].defaultWidth;
      renderables[i].targetHeight = renderables[i].defaultHeight;
    }
    else if (i == hovered - 1 || i == hovered + 1)
    {
      renderables[i].targetWidth = renderables[i].defaultWidth/1.5;
      renderables[i].targetHeight = renderables[i].defaultHeight/1.5;
    }
    else
    {
      renderables[i].targetWidth = renderables[i].defaultWidth/2;
      renderables[i].targetHeight = renderables[i].defaultHeight/2;
    }

    renderables[i].targetX = xPos;
    renderables[i].targetY = yPos - renderables[i].targetHeight;
    renderables[i].steps = 10;

    xPos += renderables[i].targetWidth;
  }
}

function setTargetValuesZoom()
{
  // TODO
}

function getHovered(event)
{
  // get element which is hovered
  for (var i=0; i < renderables.length; i++)
  {
    // check bounds
    if (renderables[i].currX <= event.clientX && renderables[i].currX + renderables[i].currWidth >= event.clientX)
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
    return renderables;
  }
  else if (currentLevel == 1) {
    return renderables[level0].childs;
  }
  else if (currentLevel == 2) {
    return renderables[level0].childs[level1].childs;
  }
}
