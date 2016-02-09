var MainApplication = function()
{
  this.timelineCanvas = document.getElementById("timeline");
  this.timeline = new Timeline(this.timelineCanvas, 814, 596);
  this.browser = new KeyframeBrowser(this.startPlayback.bind(this), this.displayRange.bind(this));
  this.video = document.getElementsByTagName("video")[0];
  this.isPlaying = false;
  this.isShown = true;
  this.btnPlay = document.getElementById("play-pause");
  this.btnPlay.onmousedown = this.playPauseToggle.bind(this);
  this.volumeBar = document.getElementById("volume-bar");
  this.volumeBar.addEventListener("change", this.volumeChange.bind(this));

  // init autohide
  this.autohideInterval = 4000;

  this.video.onmousemove = this.videoMouseMove.bind(this);
  this.browser.onmousemove = this.videoMouseMove.bind(this);
  this.timeline.canvas.onmousemove = this.videoMouseMove.bind(this);

  this.lastMove = Date.now();
  setTimeout(this.mainTimer.bind(this), 500)
}

MainApplication.prototype.mainTimer = function()
{
  var hovered = $("#container").find("#keyframeBrowser:hover").length > 0 || $("#container").find("#timeline:hover").length > 0;

  if (Date.now() - this.lastMove > this.autohideInterval && this.isShown && !hovered)
  {
    this.isShown = false;
    this.showOverlay(this.isShown);
  }

  setTimeout(this.mainTimer.bind(this), 500);
}

MainApplication.prototype.showOverlay = function(show)
{
  this.browser.show(show);
  this.timeline.show(show);
}

MainApplication.prototype.videoMouseMove = function()
{
  if (!this.isShown)
  {
    this.isShown = true;
    this.showOverlay(this.isShown);
  }

  this.lastMove = Date.now();
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
  this.btnPlay.className = "pause";
  this.video.play();
  this.isPlaying = true;
}

MainApplication.prototype.pause = function()
{
  this.btnPlay.className = "play";
  this.video.pause();
  this.isPlaying = false;
}

MainApplication.prototype.volumeChange = function(event)
{
  this.video.volume = this.volumeBar.value;
}

window.onload = function()
{
  var mainApp = new MainApplication();
};
