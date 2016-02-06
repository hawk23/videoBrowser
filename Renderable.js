var Renderable = function(currWidth, currHeight, currX, currY, currOpacity, image, defaultWidth, defaultHeight)
{
  this.currWidth = currWidth;
  this.currHeight = currHeight;
  this.currX = currX;
  this.currY = currY;
  this.currOpacity = currOpacity;
  this.steps = 1;
  this.image = image;

  this.targetWidth = this.currWidth;
  this.targetHeight = this.currHeight;
  this.targetX = this.currX;
  this.targetY = this.currY;
  this.targetOpacity = this.currOpacity;

  this.defaultWidth = defaultWidth;
  this.defaultHeight = defaultHeight;
}
