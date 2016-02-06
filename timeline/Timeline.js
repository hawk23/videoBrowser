var Timeline = function(canvas, widthTimeline, videoLength)
{
  this.canvas = canvas;
  this.context = this.canvas.getContext('2d');

  // constants
  this.widthTimeline = widthTimeline;
  this.widthPadding = 20;
  this.widthCanvas = this.widthTimeline + 2*this.widthPadding;
  this.height = 30;
  this.heightTimeline = Math.round(this.height / 4);
  this.videoLength = videoLength;
  this.heightTimestampsLine = 15;

  // global variables
  this.timeRanges;
  this.timestampsOffset;

  this.draw();
}

Timeline.prototype.draw = function() {
	this.context.canvas.width  = this.widthCanvas;
	this.context.canvas.height = this.height;

	// Fill the horizontal line
	this.context.fillStyle = "#9ea7b8";
	this.context.fillRect(this.widthPadding,0,this.widthTimeline,this.heightTimeline);
	this.context.fillStyle = "white";
  this.context.font = "11px Arial";
  this.canvas.style.opacity = 1;

	if (this.videoLength >= 500) {
		this.timeRanges = 30;
	} else {
		this.timeRanges = 20;
	}

	var x = 0;
	var y = 0;

	// create the timestamp every 20 oder 30 seconds
	var numTimestamps = this.videoLength / this.timeRanges;
	this.timestampsOffset = this.widthTimeline / numTimestamps;
	var offset = this.widthPadding;
	for (var timestamp=0; timestamp <= this.videoLength; timestamp += this.timeRanges) {

		// write timestamp on timeline
		this.context.fillText(timestamp.toMMSS(), offset - 10, this.height/3 + 15);

		// draw line to corresponding timestamp
		this.context.beginPath();
    this.context.strokeStyle = 'white';
		this.context.moveTo(offset,0);
		this.context.lineTo(offset,this.heightTimestampsLine);
		this.context.stroke();

		// draw midline in between two timestamps
		if (offset + this.timestampsOffset/2 < this.widthTimeline + this.widthPadding) {
			this.context.beginPath();
			this.context.moveTo(offset + this.timestampsOffset/2,0);
			this.context.lineTo(offset + this.timestampsOffset/2,this.heightTimeline);
			this.context.stroke();
		}
		offset = offset + this.timestampsOffset;
	}

  // lastTimestamp
	this.context.fillText(this.videoLength.toMMSS(), (this.widthTimeline + this.widthPadding) - 10, this.height/3 + 15);

  // last line to corresponding timestamp
  this.context.beginPath();
  this.context.moveTo((this.widthTimeline + this.widthPadding),0);
  this.context.lineTo((this.widthTimeline + this.widthPadding),this.heightTimestampsLine);
  this.context.stroke();
}

Timeline.prototype.color = function(fromSeconds, toSeconds) {
  // reset the timeline to original
  this.context.clearRect(0, 0, this.widthCanvas, this.height);
  this.draw();

  // get the positions in the timeline
  var fromX = this.widthPadding + (fromSeconds/this.timeRanges * this.timestampsOffset);
  var toX = this.widthPadding + (toSeconds/this.timeRanges * this.timestampsOffset);

  // highlight the area in between fromSeconds and toSeconds
  this.context.fillStyle = "#004CB3";
  this.context.globalAlpha = 0.9;
  this.context.fillRect(parseInt(fromX),0,parseInt(toX - fromX),this.heightTimeline);
  this.context.globalAlpha = 1.0;
}

Number.prototype.toMMSS = function () {
    var sec_num = parseInt(this, 10);
    var minutes = Math.floor(sec_num / 60);
    var seconds = sec_num - (minutes * 60);

    if (seconds < 10) {seconds = "0"+seconds;}
    var time = minutes+':'+seconds;
    return time;
}

Timeline.prototype.show = function(show)
{
  this.canvas.style.opacity = show ? 1 : 0;
}
