var WIDTH = Math.min(window.innerWidth,
  document.documentElement.clientWidth);
var HEIGHT = Math.min(window.innerHeight,
  document.documentElement.clientHeight);

var MCD_LOCATIONS;

var latestTweets;
var lastTweetID;

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

function lonToPx(lon) {
  var relativeLon = MIN_LON - lon;
  return -relativeLon * PX_PER_LON;
}

function latToPx(lat) {
  var relativeLat = lat - MIN_LAT;
  return -relativeLat * PX_PER_LAT;
}

function createMarker(lat, lon, label) {
  if (!label) {
    label = " ";
  }
  
  var pixX = lonToPx(lon);
  var pixY = latToPx(lat);
  
  $("#map-container").append('<div class="circle">' + label + '</div>')
  $("#map-container").children().last().css("left", pixX + "px").css("top", pixY + "px");
}

//This doesn't work currently, but it's gonna be great
function glisten() {
  var circles = $(".circle");
  for(var i = 0; i < 20 && i < circles.length; i++) {
    var random = Math.floor(Math.random()*circles.length);
    circles.eq(random).fadeTo("slow", 0.0);
    setTimeout(
      (function(thisCircle) {
        return function() {
          thisCircle.fadeTo("slow", 0.2);
        }
      })(circles.eq(i)), 600);
  }
}

function checkTweets() {
  $.getJSON("/api/mcribtweets/last/40/", function(data) {
    //Fill in latestTweets if we don't have it
    if(!latestTweets) {
      latestTweets = data.tweets;
      lastTweetID = data.tweets[0].tweet_id;
    }
    
    //Find the oldest tweet we don't know about
    for(var i = 0; i < data.tweets.length; i++) {
      if(data.tweets[i].tweet_id == lastTweetID) {
        break;
      }
      
      //Add this item to the tweet cache unless it's an RT
      if(data.tweets[i].text.substr(0,2) != "RT") {
        latestTweets.unshift(data.tweets[i]);
      }
    }
    
    //Prune the tweet cache to 50 items
    if(latestTweets.length > 50) {
      latestTweets.splice(50, latestTweets.length - 50);
    }
    
    console.log("latest tweets at " + latestTweets.length + " items.");
    lastTweetID = data.tweets[0].tweet_id;
  });
}

function displayTweet() {
  if(!latestTweets) return;
  if(!MCD_LOCATIONS) return;
  
  var random = Math.floor(Math.random()*latestTweets.length);
  var tweet = latestTweets[random];
  
  //Pick a random McD location
  //Use the tweet ID as a seed to get a reliable corresponding
  //location for the same tweet every time.
  Math.seedrandom(tweet.tweet_id);
  random = Math.floor(Math.random()*MCD_LOCATIONS.length);
  Math.seedrandom();
  
  var mcdLoc = MCD_LOCATIONS[random];
  var pixX = lonToPx(mcdLoc.longitude);
  var pixY = latToPx(mcdLoc.latitude);
  
  //Remove existing tweet
  $(".tweet").remove();
  
  //Find text box-friendly location
  var pixXBox = pixX;
  if(WIDTH - pixX < 500) {
    pixXBox = pixX - 400;
    pixX += 27
  }
  
  //Add new tweet
  $("#map-container").append('<div class="tweet">' + tweet.text + '</div>');
  var tweetDiv = $(".tweet").last();
  tweetDiv.css("left", pixXBox + "px").css("top", pixY + "px");
  
  //Add the red dot
  tweetDiv.append('<div class="pin"></div>');
  tweetDiv.children().last().css("left", (pixX-7) + "px").css("top", (pixY-7) + "px");
  
  //Add the username
  tweetDiv.append('<div class="username">' + tweet.username + '</div>');
}

function refreshPage() {
  location.reload();
}

function setupMap() {
  //Four Corners National Monument -- GREAT for debugging
  //createMarker(36.9990, -109.0452, "4C");
  console.log("huerureray");
  
  /*
  $.getJSON("/locations", function(data) {
    MCD_LOCATIONS = data.locations;
    for(var i = 0; i < data.locations.length; i++) {
      setTimeout(
        (function(point) {
          return function() {
            createMarker(point.latitude, point.longitude, "");
          }
        })(data.locations[i]), i);
    }
    console.log("DONEONEONEONE");
  });
  */
  
  //Grab the JSON blob from the bottom of index.html
  MCD_LOCATIONS = jsonblob.locations;
  for(var i = 0; i < jsonblob.locations.length; i++) {
    setTimeout(
      (function(point) {
        return function() {
          createMarker(point.latitude, point.longitude, "");
        }
      })(jsonblob.locations[i]), i);
  }
  
  //setInterval(function(){glisten()}, 100);
  
  checkTweets();
  setInterval(function(){checkTweets()}, 20000);
  
  setInterval(function(){displayTweet()}, 5000);
  
  //Refresh the page every 6 hours
  setTimeout(function(){refreshPage()}, 21600000);
}
