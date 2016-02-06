var renderables = [];
var renderEngine;
var canvas;
var context;

var yOffset = 105;
var yOffsetPile = yOffset-80;

var imgCount = 5; // of current level
var paddingPileToCoverflow = 10;
var pileImageDisplacement = 10;
var calculatedImgWidth;
var pileWidth;
var xPosCoverflow;
var lastClicked;
var imgScalingFactor;
var timeline;
var currentApplicationState;

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
  renderables = [];

  buildRenderablesTree(images, renderEngine, renderables);
  addEventlistener(canvas);

  // create initial application state
  currentApplicationState = new ApplicationState(0,0,0,2);

  // init timeline
  var timelineCanvas = document.getElementById("timeline");
  timeline = new Timeline(timelineCanvas, 814, 596); // TODO
  
  // display initial application state
  displayApplicationState(null, currentApplicationState);
}

function buildRenderablesTree(images, renderEngine, targetCollection)
{
  // crate image objects and set initial position
  var xPos = xPosCoverflow;
  var yPos = yOffset;

  for (var i=0; i < images.length; i++)
  {
    var imageObj = new Image();
    imageObj.src = "thumbnails/" + images[i].src;

    if (!imgScalingFactor) {
      imgScalingFactor = calculatedImgWidth / images[i].width;
    }
    var renderable = new Renderable(
      images[i].width * imgScalingFactor,
      images[i].height * imgScalingFactor,
      xPos,
      yPos - images[i].height/2,
      1,
      imageObj,
      images[i].width,
      images[i].height,
      false,
      images[i]);

    targetCollection.push(renderable);
    renderEngine.addRenderable(renderable);

    xPos += images[i].width/2;

    if (images[i].hasOwnProperty("childs") && images[i].childs.length > 0)
    {
      buildRenderablesTree(images[i].childs, renderEngine, renderable.childs)
    }
  }
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

function displayApplicationState (before, after)
{
  if (before != null && before.level != after.level)
  {

    // fade out piles from higher levels
    if (after.level >= 2) {
      var oldCluster = getCluster(after.level - 2, before);
      for (var i=0; i<oldCluster.length; i++)
      {
        oldCluster[i].targetOpacity = 0;
        oldCluster[i].steps = 10;
      }
    }

    displayZoom(before, after);
  }

  if (before != null && before.getParentItem() != after.getParentItem() && before.level == after.level)
  {
    displayShift(before, after);
  }

  displayCoverFlow(before, after);
  displayPiles(before, after);
  displayTimeline(before, after);

  this.currentApplicationState = after;
}

function displayTimeline(before, after)
{
  var cluster = getCluster(after.level, after);

  if (cluster != null && cluster.length > 0 && timeline != null)
  {
    var secondsFrom = cluster[0].item.time;
    var secondsTo = cluster[cluster.length-1].item.time;

    timeline.color(secondsFrom, secondsTo);
  }
}

function displayZoom(before, after)
{
  // zoom in
  if (before.level < after.level)
  {
    // fade out hovered item
    var cluster = getCluster(before.level, before);

    cluster[after.getParentItem()].targetOpacity = 0;
    cluster[after.getParentItem()].steps = 10;

    // center all images of next cluster to get nice zoom in animation
    var nextCluster = getCluster(after.level, after);
    for (var i=0; i < nextCluster.length; i++)
    {
      nextCluster[i].currOpacity = 0;
      nextCluster[i].currWidth = cluster[after.getParentItem()].currWidth;
      nextCluster[i].currHeight = cluster[after.getParentItem()].currHeight;
      nextCluster[i].currX = cluster[after.getParentItem()].currX;
      nextCluster[i].currY = cluster[after.getParentItem()].currY;
    }
  }
  else if (before.level > after.level)
  {
    // fade in selected item from parent cluster
    var cluster = getCluster(after.level, after);

    cluster[after.hovered].currOpacity = 0;
    cluster[after.hovered].steps = 10;

    // fade out last cluster
    var lastCluster = getCluster(before.level, before);
    for (var i=0; i < lastCluster.length; i++)
    {
      lastCluster[i].targetOpacity = 0;
      lastCluster[i].targWidth = cluster[after.hovered].currWidth;
      lastCluster[i].targetHeight = cluster[after.hovered].currHeight;
      lastCluster[i].targetX = cluster[after.hovered].currX;
      lastCluster[i].targetY = cluster[after.hovered].currY;
    }
  }
}

function displayCoverFlow(before, after)
{
  var xPos = xPosCoverflow;
  var yPos = yOffset;

  var cluster = getCluster(after.level, after);

  var imgWidth = cluster[0].defaultWidth * imgScalingFactor;
  var imgHeight = cluster[0].defaultHeight * imgScalingFactor;

  var bigFactor;
  var middleFactor;
  var smallFactor;

  if (after.hovered === cluster.length - 1 || after.hovered === 0)
  {
    //xPos += calculatedImgWidth / 4;
    bigFactor = 1.5;
    middleFactor = 1;
    smallFactor = 2.5 / (cluster.length - 2);
  } else {
    bigFactor = 1.5;
    middleFactor = 1;
    smallFactor = 1.5 / (cluster.length - 3);
  }

  for(var i=0; i < cluster.length; i++)
  {
    if (i == after.hovered)
    {
      cluster[i].targetWidth = imgWidth * bigFactor;
      cluster[i].targetHeight = imgHeight * bigFactor;
    }
    else if (i == after.hovered - 1 || i == after.hovered + 1)
    {
      cluster[i].targetWidth = imgWidth * middleFactor;
      cluster[i].targetHeight = imgHeight * middleFactor;
    }
    else
    {
      cluster[i].targetWidth = imgWidth * smallFactor;
      cluster[i].targetHeight = imgHeight *smallFactor;
    }

    cluster[i].targetX = xPos;
    cluster[i].targetY = yPos - cluster[i].targetHeight;
    cluster[i].steps = 10;
    cluster[i].visible = true;
    cluster[i].targetOpacity = 1;

    xPos += cluster[i].targetWidth;
  }
}

function displayPiles(before, after)
{
  // piles can be only displayed when not level 0
  if (after.level == 0) return;

  // get parent cluster
  var cluster = getCluster(after.level - 1, after);

  // determine selected element
  var selectedParent = after.getParentItem();

  var imgWidth = cluster[0].defaultWidth * imgScalingFactor;
  var imgHeight = cluster[0].defaultHeight * imgScalingFactor;

  var pileLeftPosX = 0;
  var pileRightPosX = canvas.width - imgWidth/2;

  var pileLeftPosY = yOffsetPile;
  var pileRightPosY = yOffsetPile;

  // center clicked image
  cluster[selectedParent].targetX = (canvas.width/2) - (imgWidth/2);
  cluster[selectedParent].targetY = yOffsetPile;
  cluster[selectedParent].steps = 10;
  cluster[selectedParent].targetWidth = imgWidth;
  cluster[selectedParent].targetHeight = imgHeight;
  cluster[selectedParent].targetOpacity = 0;

  // pile renderables left from clicked on left side
  for(var i=0; i < selectedParent; i++)
  {
    cluster[i].targetX = pileLeftPosX;
    cluster[i].targetY = pileLeftPosY;
    cluster[i].targetWidth = imgWidth/2;
    cluster[i].targetHeight = imgHeight/2;
    cluster[i].currZ = 1 + i;
    cluster[i].targetOpacity = 1;

    pileLeftPosX += pileImageDisplacement;
    pileLeftPosY += pileImageDisplacement;

    cluster[i].steps = 10;
  }

  // pile renderables right from selectedParent on right side
  for (var i=cluster.length-1; i > selectedParent; i--)
  {
    cluster[i].targetX = pileRightPosX;
    cluster[i].targetY = pileRightPosY;
    cluster[i].targetWidth = imgWidth/2;
    cluster[i].targetHeight = imgHeight/2;
    cluster[i].currZ = 1000 - i;
    cluster[i].targetOpacity = 1;
    
    pileRightPosX -= pileImageDisplacement;
    pileRightPosY += pileImageDisplacement;

    cluster[i].steps = 10;
  }
}

function displayShift(before, after)
{
  console.log("shift");
  cluster = getCluster(before.level, before);

  // shift cluster to one side
  for (var i=0; i < cluster.length; i++)
  {
    cluster[i].targetWidth = cluster[i].defaultWidth * imgScalingFactor / 2;
    cluster[i].targetHeight = cluster[i].defaultHeight * imgScalingFactor / 2;
    cluster[i].targetOpacity = 0;
    cluster[i].targetY = yOffsetPile;

    if (before.getParentItem() < after.getParentItem())
    {
      cluster[i].targetX = 0;
    }
    else
    {
      cluster[i].targetX = canvas.width;
    }
  }
}

function getCluster(level, appState)
{
  if (level == 0) {
    return renderables;
  }
  else if (level == 1) {
    return renderables[appState.level0Selected].childs;
  }
  else if (level == 2) {
    return renderables[appState.level0Selected].childs[appState.level1Selected].childs;
  }
}

function addEventlistener(canvas)
{
  canvas.onmousemove = canvasMouseMove;
  canvas.onmousewheel = canvasOnMouseWheel;
  canvas.onmouseup = canvasMouseClick;
}

function canvasMouseMove(event)
{
  // check if hovering on a pile
  if (event.clientX <= pileWidth || event.clientX >= canvas.width - pileWidth) return;

  var hovered = getHovered(event);

  if (currentApplicationState.hovered != hovered && hovered != -1)
  {
    var afterState = currentApplicationState.clone();
    afterState.hovered = hovered;

    displayApplicationState(currentApplicationState, afterState);
  }
}

function canvasOnMouseWheel(event)
{
  var hovered = getHovered(event);
  var afterState = currentApplicationState.clone();

  if (event.deltaY < 0)
  {
    afterState.zoomIn(hovered);
  }
  else
  {
    afterState.zoomOut();
  }

  displayApplicationState(currentApplicationState, afterState);

  event.preventDefault();
}

function canvasMouseClick(event)
{
  // check if clicked on a pile
  // left pile
  if (event.clientX <= pileWidth)
  {
    var afterState = currentApplicationState.clone();
    afterState.shiftRight();

    displayApplicationState(currentApplicationState, afterState);
  }
  // right pile
  else if (event.clientX >= canvas.width - pileWidth)
  {
    var afterState = currentApplicationState.clone();
    afterState.shiftLeft();

    displayApplicationState(currentApplicationState, afterState);
  }
}

function getHovered(event)
{
  var cluster = getCluster(currentApplicationState.level, currentApplicationState);

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
