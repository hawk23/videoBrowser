var ApplicationState = function(level, level0Selected, level1Selected, hovered)
{
  // the zoom level of the Application
  this.level = level;

  // the selected item on top level
  this.level0Selected = level0Selected;

  // the selected item in second level
  this.level1Selected = level1Selected;

  // the currently hoverd element in the cover flow.
  this.hovered = hovered;
}

ApplicationState.prototype.getParentItem = function()
{
  switch (this.level)
  {
    case 1:
      return this.level0Selected;
    case 2:
      return this.level1Selected;
    default:
      return -1;
  }
}

ApplicationState.prototype.zoomIn = function(hovered)
{
  this.level++;

  // check bounds
  this.level = Math.min(2, this.level);

  if (this.level == 1)
  {
    this.level0Selected = hovered;
  }
  else if (this.level == 2)
  {
    this.level1Selected = hovered;
  }
}

ApplicationState.prototype.zoomOut = function()
{
  this.level--;

  // check bounds
  this.level = Math.max(0, this.level);
}

ApplicationState.prototype.shiftRight = function()
{
  switch (this.level)
  {
    case 1:
      this.level0Selected--;
      this.level0Selected = Math.max(0, this.level0Selected);
      this.level0Selected = Math.min(4, this.level0Selected);
      break;
    case 2:
      this.level1Selected--;
      this.level1Selected = Math.max(0, this.level1Selected);
      this.level1Selected = Math.min(4, this.level1Selected);
      break;
  }
}

ApplicationState.prototype.shiftLeft = function()
{
  switch (this.level)
  {
    case 1:
      this.level0Selected++;
      this.level0Selected = Math.max(0, this.level0Selected);
      this.level0Selected = Math.min(4, this.level0Selected);
      break;
    case 2:
      this.level1Selected++;
      this.level1Selected = Math.max(0, this.level1Selected);
      this.level1Selected = Math.min(4, this.level1Selected);
      break;
  }
}

ApplicationState.prototype.clone = function()
{
  return new ApplicationState(this.level, this.level0Selected, this.level1Selected, this.hovered);
}
