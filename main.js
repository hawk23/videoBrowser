var renderables = [];
var renderEngine;
var imagesLoaded = 0;
var currentLevel = 0;
var targetLevel = 0;
var level0 = 0;
var level1 = 0;
var lastHovered = -1;
var canvas;
var context;

var imgCount = 5; // of current level
var paddingPileToCoverflow = 10;
var pileImageDisplacement = 10;
var calculatedImgWidth;
var pileWidth;
var xPosCoverflow;
var lastClicked;

window.onload = function()
{
  loadJSON(loaded, './frames.json');
}

function loaded(framesString)
{
  var images = JSON.parse(framesString);
  canvas = document.getElementById('keyframeBrowser');
  context = canvas.getContext('2d');

  // calculate coverflow and pile areas depending on canvas width
  calculatedImgWidth = (canvas.width - 2 * (imgCount - 1) * paddingPileToCoverflow -  2 * pileImageDisplacement) / (imgCount + 1);
  pileWidth = (imgCount - 1) * pileImageDisplacement + calculatedImgWidth/2;
  xPosCoverflow = pileWidth + paddingPileToCoverflow;

  renderEngine = new RenderingEngine(canvas);
  renderables = [];

  buildRenderablesTree(images, renderEngine, renderables);
  addEventlistener(canvas);

  // display top level cluster
  setTargetValues(2);
}

function buildRenderablesTree(images, renderEngine, targetCollection)
{
  // crate image objects and set initial position
  var xPos = xPosCoverflow;
  var yPos = 300;

  for (var i=0; i < images.length; i++)
  {
    var imageObj = new Image();
    imageObj.src = "thumbnails/" + images[i].src;

    var renderable = new Renderable(
      images[i].width/2,
      images[i].height/2,
      xPos,
      yPos - images[i].height/2,
      1,
      imageObj,
      images[i].width,
      images[i].height,
      false);

    targetCollection.push(renderable);
    renderEngine.addRenderable(renderable);

    xPos += images[i].width/2;

    if (images[i].hasOwnProperty("childs") && images[i].childs.length > 0)
    {
      buildRenderablesTree(images[i].childs, renderEngine, renderable.childs)
    }
  }
}

function addEventlistener(canvas)
{
  canvas.onmousemove = canvasMouseMove;
  canvas.onmousewheel = canvasOnMouseWheel;
  canvas.onmouseup = canvasMouseClick;
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
  var xPos = xPosCoverflow;
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
    renderables[i].visible = true;

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

  return -1;
}

function canvasMouseMove(event)
{
  if (event.clientX <= pileWidth || event.clientX >= canvas.width - pileWidth) {
    // check if hovering on a pile
    console.log("hovering on pile");
    return;
  }

  var hovered = getHovered(event);

  if (lastHovered != hovered && hovered != -1)
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

function canvasMouseClick(event)
{
  // check if clicked on a pile
  if (event.clientX <= pileWidth)
  {
    // left pile
    if (lastClicked != undefined) {
      setTargetValuesOnClick(lastClicked - 1);
      lastClicked--;
    }
  }
  else if (event.clientX >= canvas.width - pileWidth)
  {
    // right pile
    if (lastClicked != undefined) {
      setTargetValuesOnClick(lastClicked + 1);
      lastClicked++;
    }
  } else {
    // get element which is clicked

    var childCluster;
    for (var i=0; i < renderables.length; i++)
    {
      // check bounds
      if (renderables[i].currX <= event.clientX && renderables[i].currX + renderables[i].currWidth >= event.clientX)
      {
        lastClicked = i;
        setTargetValuesOnClick(i);
        break;
      }
    }
  }
}

function setTargetValuesOnClick(clicked)
{
  var scalingFactor = calculatedImgWidth / renderables[0].defaultWidth;

  var imgWidth = renderables[0].defaultWidth * scalingFactor;
  var imgHeight = renderables[0].defaultHeight * scalingFactor;

  var pileLeftPosX = 0;
  var pileRightPosX = canvas.width - imgWidth/2;

  var pileLeftPosY = 200;
  var pileRightPosY = 200;

  // center clicked image
  renderables[clicked].targetX = (canvas.width/2) - (imgWidth/2);
  renderables[clicked].targetY = 200;
  renderables[clicked].steps = 10;
  renderables[clicked].targetWidth = imgWidth;
  renderables[clicked].targetHeight = imgHeight;

  // pile renderables left from clicked on left side
  for(var i=0; i < clicked; i++)
  {
    renderables[i].targetX = pileLeftPosX;
    renderables[i].targetY = pileLeftPosY;
    renderables[i].targetWidth = imgWidth/2;
    renderables[i].targetHeight = imgHeight/2;
    renderables[i].currZ = 1 + i;

    pileLeftPosX += pileImageDisplacement;
    pileLeftPosY += pileImageDisplacement;

    renderables[i].steps = 10;
  }

  // pile renderables right from clicked on right side
  for (var i=renderables.length-1; i > clicked; i--)
  {
    renderables[i].targetX = pileRightPosX;
    renderables[i].targetY = pileRightPosY;
    renderables[i].targetWidth = imgWidth/2;
    renderables[i].targetHeight = imgHeight/2;
    renderables[i].currZ = 1000 - i;

    pileRightPosX -= pileImageDisplacement;
    pileRightPosY += pileImageDisplacement;

    renderables[i].steps = 10;
  }
}
