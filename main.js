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
    setTargetValuesZoom(hovered);
    setTargetValuesPiles(hovered);
  }
}

function setTargetValuesCoverFlow(hovered)
{
  var xPos = xPosCoverflow;
  var yPos = 300;
  var cluster = getCurrentCluster();

  for(var i=0; i < cluster.length; i++)
  {
    if (i == hovered)
    {
      cluster[i].targetWidth = cluster[i].defaultWidth;
      cluster[i].targetHeight = cluster[i].defaultHeight;
    }
    else if (i == hovered - 1 || i == hovered + 1)
    {
      cluster[i].targetWidth = cluster[i].defaultWidth/1.5;
      cluster[i].targetHeight = cluster[i].defaultHeight/1.5;
    }
    else
    {
      cluster[i].targetWidth = cluster[i].defaultWidth/2;
      cluster[i].targetHeight = cluster[i].defaultHeight/2;
    }

    cluster[i].targetX = xPos;
    cluster[i].targetY = yPos - cluster[i].targetHeight;
    cluster[i].steps = 10;
    cluster[i].visible = true;

    xPos += cluster[i].targetWidth;
  }
}

function setTargetValuesZoom(hovered)
{
  // hide hovered element and display next levels clusters
  var cluster = getCurrentCluster();

  cluster[hovered].targetOpacity = 0;
  cluster[hovered].steps = 10;

  // zoom in next cluster
}

function getHovered(event)
{
  var cluster = getCurrentCluster();

  // get element which is hovered
  for (var i=0; i < cluster.length; i++)
  {
    // check bounds
    if (cluster[i].currX <= event.clientX && cluster[i].currX + cluster[i].currWidth >= event.clientX)
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
      setTargetValuesPiles(lastClicked - 1);
      lastClicked--;
    }
  }
  else if (event.clientX >= canvas.width - pileWidth)
  {
    // right pile
    if (lastClicked != undefined) {
      setTargetValuesPiles(lastClicked + 1);
      lastClicked++;
    }
  } else {
    // get element which is clicked

    var cluster = getCurrentCluster();
    for (var i=0; i < cluster.length; i++)
    {
      // check bounds
      if (cluster[i].currX <= event.clientX && cluster[i].currX + cluster[i].currWidth >= event.clientX)
      {
        lastClicked = i;
        setTargetValuesPiles(i);
        break;
      }
    }
  }
}

function setTargetValuesPiles(clicked)
{
  var cluster = getCurrentCluster();
  var scalingFactor = calculatedImgWidth / cluster[0].defaultWidth;

  var imgWidth = cluster[0].defaultWidth * scalingFactor;
  var imgHeight = cluster[0].defaultHeight * scalingFactor;

  var pileLeftPosX = 0;
  var pileRightPosX = canvas.width - imgWidth/2;

  var pileLeftPosY = 200;
  var pileRightPosY = 200;

  // center clicked image
  cluster[clicked].targetX = (canvas.width/2) - (imgWidth/2);
  cluster[clicked].targetY = 200;
  cluster[clicked].steps = 10;
  cluster[clicked].targetWidth = imgWidth;
  cluster[clicked].targetHeight = imgHeight;

  // pile renderables left from clicked on left side
  for(var i=0; i < clicked; i++)
  {
    cluster[i].targetX = pileLeftPosX;
    cluster[i].targetY = pileLeftPosY;
    cluster[i].targetWidth = imgWidth/2;
    cluster[i].targetHeight = imgHeight/2;
    cluster[i].currZ = 1 + i;

    pileLeftPosX += pileImageDisplacement;
    pileLeftPosY += pileImageDisplacement;

    cluster[i].steps = 10;
  }

  // pile renderables right from clicked on right side
  for (var i=cluster.length-1; i > clicked; i--)
  {
    cluster[i].targetX = pileRightPosX;
    cluster[i].targetY = pileRightPosY;
    cluster[i].targetWidth = imgWidth/2;
    cluster[i].targetHeight = imgHeight/2;
    cluster[i].currZ = 1000 - i;

    pileRightPosX -= pileImageDisplacement;
    pileRightPosY += pileImageDisplacement;

    cluster[i].steps = 10;
  }
}
