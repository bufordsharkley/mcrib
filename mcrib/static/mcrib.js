var WIDTH = Math.min(window.innerWidth,
  document.documentElement.clientWidth);
var HEIGHT = Math.min(window.innerHeight,
  document.documentElement.clientHeight);

//FOUR CORNERS = left: 282px; top: 380px;
//WIDTH = 1083
//HEIGHT = 713

var MIN_LAT = 51.9614;
var MIN_LON = -124.673;
var MAX_LAT = 22.1496;
var MAX_LON = -66.388;

var LAT_HEIGHT = MIN_LAT - MAX_LAT;
var LON_WIDTH = MAX_LON - MIN_LON;

var PX_PER_LAT = HEIGHT / LAT_HEIGHT;
var PX_PER_LON = WIDTH / LON_WIDTH;

function createMarker(lat, lon, label) {
  if (!label) {
    label = " ";
  }
  
  var relativeLon = MIN_LON - lon;
  var relativeLat = lat - MIN_LAT;
  var pixX = -relativeLon * PX_PER_LON;
  var pixY = -relativeLat * PX_PER_LAT;
  
  $("#map-container").append('<div class="circle" id="' + lat + '">' + label + '</div>')
  $("#map-container").children().last().css("left", pixX + "px").css("top", pixY + "px");
}

function setupMap() {
  //Four Corners National Monument -- GREAT for debugging
  //createMarker(36.9990, -109.0452, "4C");
  console.log("huerureray");
  
  $.getJSON("/locations", function(data) {
    for(var i = 0; i < data.locations.length; i++) {
      setTimeout(
        (function(point){
          return function() {
            createMarker(point.latitude, point.longitude, "");
          }
        })(data.locations[i]), i);
    }
    /*
    $.each(data.locations, function() {
      setTimeout(createMarker(this.latitude, this.longitude, ""), time);
      time = time + 10;
    });
    */
    console.log("DONEONEONEONE");
  });
}
