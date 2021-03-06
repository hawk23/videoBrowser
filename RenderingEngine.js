var RenderingEngine = function(canvas)
{
  this.canvas = canvas;
  this.context = this.canvas.getContext('2d');

  this.renderables = [];

  this.fps = 30;
  this.now = Date.now();
  this.then = Date.now();
  this.interval = 1000 / this.fps;
  this.delta = 0;

  this.draw();
}

RenderingEngine.prototype.addRenderable = function(renderable)
{
  this.renderables.push(renderable);
}

RenderingEngine.prototype.draw = function ()
{
  requestAnimationFrame(this.draw.bind(this));

  this.now = Date.now();
  this.delta = this.now - this.then;

  if (this.delta > this.interval)
  {
    this.then = this.now - (this.delta % this.interval);

    this.animate();
    this.render();
  }
}

// sets the desired current position and size of each display object
RenderingEngine.prototype.animate = function()
{
  for (var i=0; i < this.renderables.length; i++)
  {
    this.renderables[i].currHeight += this.getAnimationStep(this.renderables[i].currHeight, this.renderables[i].targetHeight, this.renderables[i]);
    this.renderables[i].currWidth += this.getAnimationStep(this.renderables[i].currWidth, this.renderables[i].targetWidth, this.renderables[i]);
    this.renderables[i].currX += this.getAnimationStep(this.renderables[i].currX, this.renderables[i].targetX, this.renderables[i]);
    this.renderables[i].currY += this.getAnimationStep(this.renderables[i].currY, this.renderables[i].targetY, this.renderables[i]);
    this.renderables[i].currOpacity += this.getAnimationStep(this.renderables[i].currOpacity, this.renderables[i].targetOpacity, this.renderables[i]);
  }
}

// renders each display object based on its current size and position;
RenderingEngine.prototype.render = function()
{
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  var renderingOrder = [];
  for (var i=0; i < this.renderables.length; i++)
  {
    renderingOrder.push({index: i, z: this.renderables[i].currZ})
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

    if (this.renderables[nextIdx].visible)
    {
      this.context.globalAlpha = this.renderables[nextIdx].currOpacity;

      this.context.drawImage(
        this.renderables[nextIdx].image,
        this.renderables[nextIdx].currX,
        this.renderables[nextIdx].currY,
        this.renderables[nextIdx].currWidth,
        this.renderables[nextIdx].currHeight);

      this.context.globalAlpha = 1;
    }
  }
}

RenderingEngine.prototype.getAnimationStep = function(curr, target, renderable)
{
  if (curr == target) return 0;
  if (renderable.steps <= 0) renderable.steps = 1;

  var diff = target - curr;
  var step = diff / renderable.steps;

  // renderable.steps = Math.max(1, renderable.steps-1);

  return step;
}
