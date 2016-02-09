var ApplicationState = function(hovered, path)
{
  // the currently hoverd element in the cover flow.
  this.hovered = hovered;

  if (path)
  {
    this.path = JSON.parse(JSON.stringify(path)); // deep copy
  }
  else
  {
    this.path = [];
  }

  this.getLevel = function()
  {
    return this.path.length;
  }

}

ApplicationState.prototype.getParentItem = function()
{
  var parent = -1;

  if (this.path.length > 0)
  {
    parent = this.path[this.path.length-1];
  }

  return parent;
}

ApplicationState.prototype.zoomIn = function(hovered)
{
  this.path.push(hovered);
}

ApplicationState.prototype.zoomOut = function()
{
  this.path.pop();
}

ApplicationState.prototype.shiftRight = function()
{
  this.path[this.path.length-1] = Math.max(0, this.path[this.path.length-1] - 1);
}

ApplicationState.prototype.shiftLeft = function(maxIndex)
{
  //TODO check max shift!
  this.path[this.path.length-1] = Math.min(maxIndex, this.path[this.path.length-1] + 1);
}

ApplicationState.prototype.clone = function()
{
  return new ApplicationState(this.hovered, this.path);
}
