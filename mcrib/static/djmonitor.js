var WIDTH = .98*Math.min(window.innerWidth, document.documentElement.clientWidth);
var HEIGHT = .9*Math.min(window.innerHeight, document.documentElement.clientHeight);
var BUBBLEWIDTHPERCENT = 0.85;
var ALERTWIDTHPERCENT = 0.2;
var MAXBUBBLECOUNT = 8;
var CLOCKTICK = 300;  //ms
var WRAPWIDTH = .7*BUBBLEWIDTHPERCENT*WIDTH; // the text in the middle...
var MESSAGEYOFFSET = -20; // how far up the message goes in the message box

var dataset = [];

//Define key function, to be used when binding data (if unfamiliar, key functions
// in d3 allow for object constancy.)
var key = function(d) {
    return d.id;
};

// global variables -- keeping track of max ids:
var max_id = -1;
var max_twitter_id = -1;
var max_sms_id = -1;
// TODO add minimum utc time...

var yScale = d3.scale.ordinal()
               .domain(d3.range(0,MAXBUBBLECOUNT))
               .rangeRoundBands([HEIGHT, 0], 0.07);

var svg; // global svg to reference

function initializeDJMonitor() {
    reloadPage(); // schedules a reload, does not execute...

    svg = d3.select("#monitorstream")
        .append("svg")
        .attr("width", WIDTH)
        .attr("height", HEIGHT);

    loadTweets();

    // load callbacks for "buttons" (in debug mode... see commented-out lines
    // in template...
    d3.selectAll("p")
        .on("click", function() {
            //See which p was clicked, and branch callbacks:
            var paragraphID = d3.select(this).attr("id");
            if (paragraphID == "add") {
                var newobject = {
                    id: max_id + 1,
                    type: 'alert',
                    message: 'ALERT',
                    timestamp: Math.floor((new Date()).getTime() / 1000)
                }
                max_id += 1;
                dataset.push(newobject);
            } else {
                dataset.shift();  //Remove one value from dataset
            }
            updateDJMonitor();
        });
    mainTimer();
};

function mainTimer() {
    if (!mainTimer.count) {
        mainTimer.count = 0;
    }
    mainTimer.count++;
    var modular = mainTimer.count % 16;
    // the following code uses fall-through behavior:
    switch (modular)
    {
        
        case 0:
            every16Ticks();
        case 4:
        case 12:
        case 8: 
            every4Ticks();
        default:
            every1Tick();
            break;
    }
    setTimeout(mainTimer, CLOCKTICK);
}

// Tweets is an extremely cheap API call-- it can be called forever without 
// limiting, due to excellent streaming API.
// Texts and streams are more standard RESTful calls, and are called less
// frequently as to not cause limiting/timeout issues.
function every1Tick() {
    loadTweets();
}

function every4Ticks() {
}

function every16Ticks() {
}

function bubbleWidth(type){
    if (type === 'alert') {
        return ALERTWIDTHPERCENT;
    } else {
        return BUBBLEWIDTHPERCENT;
    }
}

function bubbleXOffset(d){
    var mainoffset = WIDTH*(.5-bubbleWidth(d.type)/2);
    var delta = 0;
    if (d.direction === 'outgoing'){
        delta = 50;
    } else if (d.type !== 'alert'){
        delta = -50;
    }
    return mainoffset + delta;
}

function logo_file(d){    
    if (d.type === 'tweet'){
        return $SCRIPT_ROOT + "/static/twitter_logo.svg";
    } else if (d. type === 'text') {
        return $SCRIPT_ROOT + "/static/text_logo.svg";
    }
}

function updateDJMonitor() {
    // (sorting not necessary (for now)-- the ids are maintained in strict order)
    dataset.sort(function(a, b) { 
        return a.timestamp - b.timestamp;
    }); //TODO sort by utc.

    // first, prune the dataset for only the most recent
    while (dataset.length > MAXBUBBLECOUNT) {
        dataset.shift();
    }

    //Select...
    var bubbles = svg.selectAll("g.bubble")
        .data(dataset, key);

    //Enter...
    var bubble = bubbles.enter()
        .append("g")
        .attr("class", "bubble")
        .attr("transform", function(d, i) {
            return "translate(" + bubbleXOffset(d) + ", -"  + yScale.rangeBand() + ")";
        });

    // Update... 
    bubble.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("rx", 20)
        .attr("ry", 20)
        .attr("width", function(d){
            return WIDTH*bubbleWidth(d.type);
        })
        .attr("height", yScale.rangeBand())
        .attr("class", function(d){
            if (d.type === 'tweet' || d.type === 'text'){
                return 'tweet';
            } else if (d.type === 'alert'){
                return 'alert';
            }
        })
        .classed('outgoing', function(d){
            if (d.direction == 'outgoing') {
                return true;
            }
            return false;
        });
    
    // adding message with text breaks...
    bubble.call(wrap_mod, WRAPWIDTH);
        
    bubble.append("text")
        .text(function(d) {
            return d.source;
        })
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "alphabetic")
        .attr("x", function(d) {
            return bubbleWidth(d.type)*WIDTH - 15;
        })
        .attr("y", yScale.rangeBand() -10)
        .attr("class", "sourcetext");

    bubble.append("text")
        .text(function(d) {
            return d.datetime;
        })
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "alphabetic")
        .attr("x", 15)
        .attr("y", yScale.rangeBand() -10)
        .attr("class", "datetimetext");

    bubble.append("image")
        .attr("xlink:href", function(d){
            return logo_file(d);
        })
        .attr("x", function(d) {
            return bubbleWidth(d.type)*WIDTH - 60;
        })
        .attr("y", yScale.rangeBand() - 68)
        .attr("width", 48)
        .attr("height", 40)
        .attr("class", "source_logo");

    // the transitions: move groups down, and update time:
    bubbles.transition()
        .duration(500)
        .attr("transform", function(d, i) {
            return "translate(" + bubbleXOffset(d) + "," + yScale(i) + ")";
        });

    d3.selectAll("text.datetimetext")
        .transition()
        .duration(500)
        .text(function(d) {
            return d.datetime;
        });

    // And exit...
    bubbles.exit()
        .transition()
        .duration(500)
        .attr("transform", function(d, i) {
            return "translate(" + bubbleXOffset(d) + "," + (HEIGHT + 10) + ")"
        })
        .remove();
}

// a modified version of mbostock's method of line breaks
// TODO rename, and clean up some.
function wrap_mod(text, width) {
    var textgroup = text.append("text")
        .attr("class", "messagetext")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("x", function(d){
            return bubbleWidth(d.type)*WIDTH*.5;
        })
        .attr("y", yScale.rangeBand()*.5)
        .attr("dy", MESSAGEYOFFSET);
    textgroup.each(function(d) {
        text = d3.select(this);
        var words = d.message.split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 24,
            x = text.attr("x"),
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x",x)
                        .attr("y", y)
                        .attr("dy",dy);
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                lineNumber++;
                tspan = text.append("tspan")
                            .attr("x",x)
                            .attr("y", y)
                            .attr("dy", lineNumber * lineHeight + dy)
                            .text(word);
            }
        }
    });
}

function maxTwitterID(){
    for (var ii = 0; ii < dataset.length; ii++){
        if (dataset[ii].type === 'tweet'){
            if (dataset[ii].meta > max_twitter_id){
                max_twitter_id = dataset[ii].meta;
            }
        }
    };
    return max_twitter_id;
}

function maxSMSID(){
    for (var ii = 0; ii < dataset.length; ii++){
        if (dataset[ii].type === 'text'){
            if (dataset[ii].meta > max_sms_id){
                max_sms_id = dataset[ii].meta;
            }
        }
    };
    return max_sms_id;
}

function datasetIndexFromMeta(meta){
    for (var ii = 0; ii < dataset.length; ii++){
        if (dataset[ii].meta === meta){
            return ii;
        }
    }
    return -1;
}

// the following turns &amp; into &... 
function htmlDecode(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes[0].nodeValue;
}

function loadTweets(){
    d3.json($SCRIPT_ROOT + "/api/twitter/alltweets/last/" + MAXBUBBLECOUNT + "/", function(data){
        if (data.status == "OK") {
            datasize = Math.min(MAXBUBBLECOUNT,data.tweets.length);
            max_twitter_id = maxTwitterID();
            for (var ii = datasize-1; ii >= 0; ii--){
                // if it's actually new (twitter_ids are always incrementing):
                if (data.tweets[ii].tweet_id > max_twitter_id){
                    var direction = 'incoming';
                    if (data.tweets[ii].username == 'kzsudj' || data.tweets[ii].username == 'KZSU'){
                        direction = 'outgoing';
                    }
                    tweetobject = {
                        id : max_id + 1,
                        type : 'tweet',
                        message: htmlDecode(data.tweets[ii].text),
                        source: "@" + data.tweets[ii].username,
                        meta: data.tweets[ii].tweet_id,
                        datetime: data.tweets[ii].humantime,
                        timestamp: data.tweets[ii].timestamp,
                        direction: direction,
                    };
                    max_id += 1;
                    max_twitter_id = data.tweets[ii].tweet_id;
                    dataset.push(tweetobject);
                } else {
                    // replace human-datetime stamp (if it's still active).
                    jj = datasetIndexFromMeta(data.tweets[ii].tweet_id);
                    if (jj !== -1){
                        dataset[jj].datetime = data.tweets[ii].humantime;
                    }
                }
            }
            updateDJMonitor();
        }
    });
}


// safety plan for if it goes offline-- refreshing the page every so often.
// same code as in lobby monitor, and that's been working pretty well...
function reloadPage() {
    setTimeout(reloadPage, 4320000);
    // on first call, DON'T reload...
    if (!reloadPage.flag) {
        reloadPage.flag = true;
        return;
    }
    // on subsequent calls, reload...
    location.reload(true);
}
