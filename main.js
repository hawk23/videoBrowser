var MainApplication = function()
{
  this.timelineCanvas = document.getElementById("timeline");
  this.timeline = new Timeline(this.timelineCanvas, 814, 596);
  this.browser = new KeyframeBrowser(this.startPlayback.bind(this), this.displayRange.bind(this));
  this.video = document.getElementsByTagName("video")[0];
  this.isPlaying = false;

  document.getElementById("play-pause").onmousedown = this.playPauseToggle.bind(this);
}

MainApplication.prototype.startPlayback = function(time)
{
	this.video.currentTime = time;
  this.play();
}

MainApplication.prototype.displayRange = function(from, to)
{
  this.timeline.color(from, to);
}

MainApplication.prototype.playPauseToggle = function()
{
  if (!this.isPlaying)
  {
    this.play();
  }
  else
  {
    this.pause();
  }
}

MainApplication.prototype.play = function()
{
  this.video.play();
  this.isPlaying = true;
}

MainApplication.prototype.pause = function()
{
  this.video.pause();
  this.isPlaying = false;
}

window.onload = function()
{
  var mainApp = new MainApplication();
};
