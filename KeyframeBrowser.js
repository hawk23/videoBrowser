var KeyframeBrowser = function(startPlaybackCallback, displayRangeCallback)
{
  this.startPlaybackCallback = startPlaybackCallback;
  this.displayRangeCallback = displayRangeCallback;

  this.renderables = [];
  this.renderEngine;
  this.canvas = document.getElementById('keyframeBrowser');
  this.context = this.canvas.getContext('2d');
  this.yOffset = 105;
  this.yOffsetPile = this.yOffset-80;
  this.imgCount = 5; // of current level
  this.paddingPileToCoverflow = 10;
  this.pileImageDisplacement = 10;
  this.calculatedImgWidth;
  this.pileWidth;
  this.xPosCoverflow;
  this.imgScalingFactor;
  this.currentApplicationState;
  this.defaultSteps = 10;

  this.loadJSON(this.loaded.bind(this), './frames.json');
}

KeyframeBrowser.prototype.loaded =  function(framesString)
{
  var images = JSON.parse(framesString);

  // calculate coverflow and pile areas depending on canvas width
  this.calculatedImgWidth = (this.canvas.width - 2 * (this.imgCount - 1) * this.paddingPileToCoverflow -  2 * this.pileImageDisplacement) / (this.imgCount+1);
  this.pileWidth = (this.imgCount - 1) * this.pileImageDisplacement + this.calculatedImgWidth/2;
  this.xPosCoverflow = this.pileWidth + this.paddingPileToCoverflow;

  this.renderEngine = new RenderingEngine(this.canvas);
  this.renderables = [];

  this.buildRenderablesTree(images, this.renderEngine, this.renderables);
  this.addListener(this.canvas);

  // create initial application state
  this.currentApplicationState = new ApplicationState(0,0,0,2);

  // display initial application state
  this.displayApplicationState(null, this.currentApplicationState);
}

KeyframeBrowser.prototype.buildRenderablesTree = function(images, renderEngine, targetCollection)
{
  // crate image objects and set initial position
  var xPos = this.xPosCoverflow;
  var yPos = this.yOffset;

  for (var i=0; i < images.length; i++)
  {
    var imageObj = new Image();
    imageObj.src = "thumbnails/" + images[i].src;

    if (!this.imgScalingFactor) {
      this.imgScalingFactor = this.calculatedImgWidth / images[i].width;
    }
    var renderable = new Renderable(
      images[i].width * this.imgScalingFactor,
      images[i].height * this.imgScalingFactor,
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
      this.buildRenderablesTree(images[i].childs, renderEngine, renderable.childs)
    }
  }
}

KeyframeBrowser.prototype.loadJSON = function(callback, file)
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

KeyframeBrowser.prototype.displayApplicationState = function(before, after)
{
  if (before != null && before.level != after.level)
  {
    // fade out piles from higher levels
    if (after.level >= 2) {
      var oldCluster = this.getCluster(after.level - 2, before);
      for (var i=0; i<oldCluster.length; i++)
      {
        oldCluster[i].targetOpacity = 0;
        oldCluster[i].steps = this.defaultSteps;
      }
    }

    this.displayZoom(before, after);
  }

  if (before != null && before.getParentItem() != after.getParentItem() && before.level == after.level)
  {
    this.displayShift(before, after);
  }

  this.displayCoverFlow(before, after);
  this.displayPiles(before, after);
  this.displayTimeline(before, after);

  this.currentApplicationState = after;
}

KeyframeBrowser.prototype.displayTimeline = function(before, after)
{
  var cluster = this.getCluster(after.level, after);

  if (cluster != null && cluster.length > 0)
  {
    var secondsFrom = cluster[0].item.time;
    var secondsTo = cluster[cluster.length-1].item.time;

    this.displayRangeCallback(secondsFrom, secondsTo);
  }
}

KeyframeBrowser.prototype.displayZoom = function(before, after)
{
  // zoom in
  if (before.level < after.level)
  {
    // fade out hovered item
    var cluster = this.getCluster(before.level, before);

    cluster[after.getParentItem()].targetOpacity = 0;
    cluster[after.getParentItem()].steps = this.defaultSteps;

    // center all images of next cluster to get nice zoom in animation
    var nextCluster = this.getCluster(after.level, after);
    for (var i=0; i < nextCluster.length; i++)
    {
      nextCluster[i].currOpacity = 0;
      nextCluster[i].currWidth = cluster[after.getParentItem()].currWidth;
      nextCluster[i].currHeight = cluster[after.getParentItem()].currHeight;
      nextCluster[i].currX = cluster[after.getParentItem()].currX;
      nextCluster[i].currY = cluster[after.getParentItem()].currY;
    }
  }
  // zoom out
  else if (before.level > after.level)
  {
    // fade in selected item from parent cluster
    var cluster = this.getCluster(after.level, after);

    cluster[after.hovered].currOpacity = 0;
    cluster[after.hovered].steps = this.defaultSteps;

    // fade out last cluster
    var lastCluster = this.getCluster(before.level, before);
    for (var i=0; i < lastCluster.length; i++)
    {
      lastCluster[i].targetOpacity = 0;
      lastCluster[i].targWidth = lastCluster[before.hovered].currWidth;
      lastCluster[i].targetHeight = lastCluster[before.hovered].currHeight;
      lastCluster[i].targetX = lastCluster[before.hovered].currX;
      lastCluster[i].targetY = lastCluster[before.hovered].currY;
    }
  }
}

KeyframeBrowser.prototype.displayCoverFlow = function(before, after)
{
  var xPos = this.xPosCoverflow;
  var yPos = this.yOffset;

  var cluster = this.getCluster(after.level, after);

  var imgWidth = cluster[0].defaultWidth * this.imgScalingFactor;
  var imgHeight = cluster[0].defaultHeight * this.imgScalingFactor;

  var bigFactor;
  var middleFactor;
  var smallFactor;

  if (after.hovered === cluster.length - 1 || after.hovered === 0)
  {
    //xPos += this.calculatedImgWidth / 4;
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
    cluster[i].steps = this.defaultSteps;
    cluster[i].visible = true;
    cluster[i].targetOpacity = 1;

    xPos += cluster[i].targetWidth;
  }
}

/**
 * Manages the displaying of the piles on each side of the window.
 */
KeyframeBrowser.prototype.displayPiles = function(before, after)
{
  // piles can be only displayed when not level 0
  if (after.level == 0) return;

  // get parent cluster
  var cluster = this.getCluster(after.level - 1, after);

  // determine selected element
  var selectedParent = after.getParentItem();

  var imgWidth = cluster[0].defaultWidth * this.imgScalingFactor;
  var imgHeight = cluster[0].defaultHeight * this.imgScalingFactor;

  var pileLeftPosX = 0;
  var pileRightPosX = this.canvas.width - imgWidth/2;

  var pileLeftPosY = this.yOffsetPile;
  var pileRightPosY = this.yOffsetPile;

  // hide clicked image
  cluster[selectedParent].steps = 1;
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

    pileLeftPosX += this.pileImageDisplacement;
    pileLeftPosY += this.pileImageDisplacement;

    cluster[i].steps = this.defaultSteps;
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

    pileRightPosX -= this.pileImageDisplacement;
    pileRightPosY += this.pileImageDisplacement;

    cluster[i].steps = this.defaultSteps;
  }
}

/**
 * Shifts the cluster displayed in the middle to one side.
 * Stacks all invisible items which should appear in the middle next on the correct
 * side for smooth animation
 */
KeyframeBrowser.prototype.displayShift = function(before, after)
{
  var cluster = this.getCluster(before.level, before);
  var clusterNext = this.getCluster(after.level, after);

  var itemsOnLeftSide = before.getParentItem();
  var itemsOnRightSide = this.imgCount - itemsOnLeftSide - 1;

  for (var i=0; i < cluster.length; i++)
  {
    cluster[i].targetWidth = cluster[i].defaultWidth * this.imgScalingFactor / 2;
    cluster[i].targetHeight = cluster[i].defaultHeight * this.imgScalingFactor / 2;
    cluster[i].targetOpacity = 0;

    if (before.getParentItem() < after.getParentItem())
    {
      // shift to the left
      cluster[i].targetX = this.pileImageDisplacement * itemsOnLeftSide;
      cluster[i].targetY = this.yOffsetPile + (this.pileImageDisplacement * itemsOnLeftSide);
    }
    else
    {
      // shift to the right
      cluster[i].targetX = this.canvas.width - (this.pileImageDisplacement * itemsOnRightSide) - cluster[i].targetWidth;
      cluster[i].targetY = this.yOffsetPile + (this.pileImageDisplacement * itemsOnRightSide);
    }
  }

  // stack next cluster to one side
  for (var i = 0; i < clusterNext.length; i++)
  {
    clusterNext[i].currWidth = clusterNext[i].defaultWidth * this.imgScalingFactor / 2;
    clusterNext[i].currHeight = clusterNext[i].defaultHeight * this.imgScalingFactor / 2;
    clusterNext[i].currOpacity = 0;

    if (before.getParentItem() < after.getParentItem())
    {
      // stack on right side
      clusterNext[i].currX = this.canvas.width - (this.pileImageDisplacement * itemsOnRightSide) - clusterNext[i].targetWidth;
      clusterNext[i].currY = this.yOffsetPile + (this.pileImageDisplacement * itemsOnRightSide);
    }
    else
    {
      // stack on left side
      clusterNext[i].currX = this.pileImageDisplacement * itemsOnLeftSide;
      clusterNext[i].currY = this.yOffsetPile + (this.pileImageDisplacement * itemsOnLeftSide);
    }
  }
}

KeyframeBrowser.prototype.getCluster = function(level, appState)
{
  if (level == 0) {
    return this.renderables;
  }
  else if (level == 1) {
    return this.renderables[appState.level0Selected].childs;
  }
  else if (level == 2) {
    return this.renderables[appState.level0Selected].childs[appState.level1Selected].childs;
  }
}

KeyframeBrowser.prototype.addListener = function(canvas)
{
  canvas.onmousemove = this.canvasMouseMove.bind(this);
  canvas.onmousewheel = this.canvasOnMouseWheel.bind(this);
  canvas.onmouseup = this.canvasMouseClick.bind(this);
}

KeyframeBrowser.prototype.canvasMouseMove = function(event)
{
  // check if hovering on a pile
  if (event.clientX <= this.pileWidth || event.clientX >= this.canvas.width - this.pileWidth) return;

  var hovered = this.getHovered(event);

  if (this.currentApplicationState.hovered != hovered && hovered != -1)
  {
    var afterState = this.currentApplicationState.clone();
    afterState.hovered = hovered;

    this.displayApplicationState(this.currentApplicationState, afterState);
  }

  this.onmousemove(event);
}

KeyframeBrowser.prototype.onmousemove = function(event)
{
}

KeyframeBrowser.prototype.canvasOnMouseWheel = function(event)
{
  var hovered = this.getHovered(event);
  var afterState = this.currentApplicationState.clone();

  if (hovered != -1)
  {
    if (event.deltaY < 0 && this.currentApplicationState.level < 2)
    {
      afterState.zoomIn(hovered);
      this.displayApplicationState(this.currentApplicationState, afterState);
    }
    else if (event.deltaY > 0 && this.currentApplicationState.level > 0)
    {
      afterState.zoomOut();
      this.displayApplicationState(this.currentApplicationState, afterState);
    }
  }

  event.preventDefault();
}

KeyframeBrowser.prototype.canvasMouseClick = function(event)
{
  // check if clicked on a pile
  // left pile
  if (event.clientX <= this.pileWidth)
  {
    var afterState = this.currentApplicationState.clone();
    afterState.shiftRight();

    this.displayApplicationState(this.currentApplicationState, afterState);
  }
  // right pile
  else if (event.clientX >= this.canvas.width - this.pileWidth)
  {
    var afterState = this.currentApplicationState.clone();
    afterState.shiftLeft();

    this.displayApplicationState(this.currentApplicationState, afterState);
  }
  else
  {
    // check if item was clicked for playback
    var hovered = this.getHovered(event);

    if (hovered != -1)
    {
      var cluster = this.getCluster(this.currentApplicationState.level, this.currentApplicationState);
      var playbackTime = cluster[hovered].item.time;

      this.startPlaybackCallback(playbackTime)
    }
  }
}

KeyframeBrowser.prototype.getHovered = function(event)
{
  var cluster = this.getCluster(this.currentApplicationState.level, this.currentApplicationState);

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

KeyframeBrowser.prototype.show = function(show)
{
  this.canvas.style.opacity = show ? 1 : 0;
}
