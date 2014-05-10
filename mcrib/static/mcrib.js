var WIDTH = Math.min(window.innerWidth,
  document.documentElement.clientWidth);
var HEIGHT = Math.min(window.innerHeight,
  document.documentElement.clientHeight);

//FOUR CORNERS = left: 282px; top: 380px;
//WIDTH = 1083
//HEIGHT = 713

var MIN_LAT = 54.8614;
var MIN_LON = -124.673;
var MAX_LAT = 24.7496;
var MAX_LON = -66.888;

var LAT_HEIGHT = MIN_LAT - MAX_LAT;
var LON_WIDTH = MAX_LON - MIN_LON;

var PX_PER_LAT = HEIGHT / LAT_HEIGHT;
var PX_PER_LON = WIDTH / LON_WIDTH;

function createMarker(lat, lon) {
  var relativeLon = MIN_LON - lon;
  var relativeLat = lat - MIN_LAT;
  var pixX = -relativeLon * PX_PER_LON;
  var pixY = -relativeLat * PX_PER_LAT;
  
  $("#map-container").append('<div class="circle"></div>');
  $("#map-container").children().last().css("left", pixX + "px");
  $("#map-container").children().last().css("top", pixY + "px");
}

function setupMap() {
  createMarker(39.9990, -109.0452);
  console.log("huerureray");
}
