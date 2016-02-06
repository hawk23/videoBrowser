var MainApplication = function()
{
  this.timelineCanvas = document.getElementById("timeline");
  this.timeline = new Timeline(this.timelineCanvas, 814, 596);
  this.browser = new KeyframeBrowser(this.startPlayback.bind(this), this.displayRange.bind(this));
  this.video = document.getElementsByTagName("video")[0];
}

MainApplication.prototype.startPlayback = function(time)
{
	this.video.currentTime = time;
  this.video.play();
}

MainApplication.prototype.displayRange = function(from, to)
{
  this.timeline.color(from, to);
}

window.onload = function()
{
  var mainApp = new MainApplication();
};
