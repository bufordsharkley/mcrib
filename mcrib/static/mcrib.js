var WIDTH = Math.min(window.innerWidth,
  document.documentElement.clientWidth);
var HEIGHT = Math.min(window.innerHeight,
  document.documentElement.clientHeight);

var MIN_LAT = 47.6097;
var MIN_LON = -122.3331;
var MAX_LAT = 28.4158;
var MAX_LON = -81.2989;

var LAT_HEIGHT = MIN_LAT - MAX_LAT;
var LON_WIDTH = MAX_LON - MIN_LON;

var PX_PER_LAT = HEIGHT / LAT_HEIGHT;
var PX_PER_LON = WIDTH / LON_WIDTH;

function createMarker(lat, lon) {
  var pixX = lon * PX_PER_LON;
  var pixY = lat * PX_PER_LAT;
  
  var circleDiv = '<div class="circle" style="left:' + pixX + '; top:' + pixY + ';"></div>';
  $("#map-container").append(circleDiv);
}

function setupMap() {
  createMarker(39.7392, -104.9847);
  console.log("huerureray");
}
