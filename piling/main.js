var fps = 30;
var now;
var then = Date.now();
var interval = 1000 / fps;
var delta;
var canvas;
var context;
var lastMouseMoveTarget;
var images;
var imagesLoaded = 0;
var currentLevel = 0;
var targetLevel = 0;
var level0 = 0;
var level1 = 0;
var lastHovered = -1;

window.onload = function()
{
  loadJSON(loaded, 'frames.json');
}

var imgCount = 5; // of current level
var paddingPileToCoverflow = 10;
var pileImageDisplacement = 10;
var calculatedImgWidth;
var pileWidth;
var xPosCoverflow;
function loaded(framesString)
{
  images = JSON.parse(framesString);
  canvas = document.getElementById('coverFlow');
  context = canvas.getContext('2d');

  addEventlistener();

  // calculate coverflow and pile areas depending on canvas width
  calculatedImgWidth = (canvas.width - 2 * (imgCount - 1) * paddingPileToCoverflow -  2 * pileImageDisplacement) / (imgCount + 1);
  pileWidth = (imgCount - 1) * pileImageDisplacement + calculatedImgWidth/2;
  xPosCoverflow = pileWidth + paddingPileToCoverflow;

  // crate image objects and set initial position
  var xPos = xPosCoverflow;
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
  //canvas.onmousewheel = canvasOnMouseWheel;
  canvas.onmouseup = canvasMouseClick;
}

function imageloaded ()
{
  imagesLoaded++;

  if (imagesLoaded == images.length)
  {
    draw();
  }
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

    var renderingOrder = [];
    for (var i=0; i < images.length; i++)
    {
      renderingOrder.push({index: i, z: images[i].currZ})
    }

    // sort image indexes ascending by z values
    renderingOrder.sort(
      function (a,b) 
      {
        if (a.z < b.z) return -1;
        else if (a.z > b.z) return 1;
        else return 0;
      }
    );

    var nextIdx;
    for (var i=0; i < renderingOrder.length; i++)
    {
      nextIdx = renderingOrder[i].index;
      context.drawImage(images[nextIdx].image, images[nextIdx].currX, images[nextIdx].currY, images[nextIdx].currWidth, images[nextIdx].currHeight);
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

  function setTargetValues(images, hovered)
  {
    var xPos = xPosCoverflow;
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

  function canvasMouseMove(event)
  {

    if (event.clientX <= pileWidth || event.clientX >= canvas.width - pileWidth) {
      // check if hovering on a pile
      console.log("hovering on pile");
      return;
    }

    // get element which is hovered
    for (var i=0; i < images.length; i++)
    {
      // check bounds
      if (images[i].currX <= event.clientX && images[i].currX + images[i].currWidth >= event.clientX)
      {
        if(i !== lastMouseMoveTarget && i !== lastClicked)
        {
          setTargetValues(images, i);
          lastMouseMoveTarget = i;
        }
        break;
      }
    }
  }

  var lastClicked;
  function setTargetValuesOnClick(clicked)
  {
    var scalingFactor = calculatedImgWidth / images[0].width;

    var imgWidth = images[0].width * scalingFactor;
    var imgHeight = images[0].height * scalingFactor;

    var pileLeftPosX = 0;
    var pileRightPosX = canvas.width - imgWidth/2;

    var pileLeftPosY = 200;
    var pileRightPosY = 200;

    // center clicked image
    images[clicked].targetX = (canvas.width/2) - (imgWidth/2);
    images[clicked].targetY = 200;
    images[clicked].steps = 10;
    images[clicked].targetWidth = imgWidth;
    images[clicked].targetHeight = imgHeight;

    // pile images left from clicked on left side
    for(var i=0; i < clicked; i++)
    {
      images[i].targetX = pileLeftPosX;
      images[i].targetY = pileLeftPosY;
      images[i].targetWidth = imgWidth/2;
      images[i].targetHeight = imgHeight/2;
      images[i].currZ = 1 + i;

      pileLeftPosX += pileImageDisplacement;
      pileLeftPosY += pileImageDisplacement;
      
      images[i].steps = 10;
    }

    // pile images right from clicked on right side
    for (var i=images.length-1; i > clicked; i--) 
    {
      images[i].targetX = pileRightPosX;
      images[i].targetY = pileRightPosY;
      images[i].targetWidth = imgWidth/2;
      images[i].targetHeight = imgHeight/2;
      images[i].currZ = 1000 - i;

      pileRightPosX -= pileImageDisplacement;
      pileRightPosY += pileImageDisplacement;

      images[i].steps = 10;
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
      for (var i=0; i < images.length; i++)
      {
        // check bounds
        if (images[i].currX <= event.clientX && images[i].currX + images[i].currWidth >= event.clientX)
        {
          lastClicked = i;
          setTargetValuesOnClick(i);
          break;
        }
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