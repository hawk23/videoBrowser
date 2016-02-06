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
var imgScalingFactor;

window.onload = function()
{
  loadJSON(loaded, './frames.json');
};

function loaded(framesString)
{
  var images = JSON.parse(framesString);
  canvas = document.getElementById('keyframeBrowser');
  context = canvas.getContext('2d');

  // calculate coverflow and pile areas depending on canvas width
  calculatedImgWidth = (canvas.width - 2 * (imgCount - 1) * paddingPileToCoverflow -  2 * pileImageDisplacement) / (imgCount+1);
  pileWidth = (imgCount - 1) * pileImageDisplacement + calculatedImgWidth/2;
  xPosCoverflow = pileWidth + paddingPileToCoverflow;

  renderEngine = new RenderingEngine(canvas);

  addEventlistener(canvas);

  // crate image objects and set initial position
  var xPos = xPosCoverflow;
  var yPos = 300;

  for (var i=0; i < images.length; i++)
  {
    var imageObj = new Image();
    imageObj.onload = imageloaded;
    imageObj.src = "thumbnails/" + images[i].src;

    if (!imgScalingFactor) {
      imgScalingFactor = calculatedImgWidth / images[i].width;
    }

    var renderable = new Renderable(images[i].width * imgScalingFactor, images[i].height * imgScalingFactor, xPos, yPos - images[i].height/2, 1, imageObj, images[i].width, images[i].height);
    renderables.push(renderable);
    renderEngine.addRenderable(renderable);

    xPos += images[i].width/2;
  }

}

function addEventlistener(canvas)
{
  canvas.onmousemove = canvasMouseMove;
  canvas.onmousewheel = canvasOnMouseWheel;
  canvas.onmouseup = canvasMouseClick;
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
  var xPos = xPosCoverflow;
  var yPos = 300;

  var imgWidth = renderables[0].defaultWidth * imgScalingFactor;
  var imgHeight = renderables[0].defaultHeight * imgScalingFactor;

  var bigFactor;
  var middleFactor;
  var smallFactor;

  if (hovered === renderables.length - 1 || hovered === 0)
  {
    //xPos += calculatedImgWidth / 4;
    bigFactor = 1.5;
    middleFactor = 1;
    smallFactor = 2.5 / (renderables.length - 2);
  } else {
    bigFactor = 1.5;
    middleFactor = 1;
    smallFactor = 1.5 / (renderables.length - 3);
  }

  for(var i=0; i < renderables.length; i++)
  {
    if (i == hovered)
    {
      renderables[i].targetWidth = imgWidth * bigFactor;
      renderables[i].targetHeight = imgHeight * bigFactor;
    }
    else if (i == hovered - 1 || i == hovered + 1)
    {
      renderables[i].targetWidth = imgWidth * middleFactor;
      renderables[i].targetHeight = imgHeight * middleFactor;
    }
    else
    {
      renderables[i].targetWidth = imgWidth * smallFactor;
      renderables[i].targetHeight = imgHeight *smallFactor;
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
  var imgWidth = renderables[0].defaultWidth * imgScalingFactor;
  var imgHeight = renderables[0].defaultHeight * imgScalingFactor;

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
