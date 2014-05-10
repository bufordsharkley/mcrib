import datetime
import time
from operator import itemgetter

from flask import Blueprint, jsonify
import humanize
import pytz

from twitter import twitterrest, twitterstream
from jsonstatus import json_response_with_status

twitter_blueprint = Blueprint('twitter_blueprint', __name__)

twitterrestfetcher = twitterrest.TwitterRESTFetcher()


class TwitterAPIHandler(object):

    def __init__(self):
        self._REST_WAIT = 90  # seconds
        self._STREAM_STANDOFF_TIME = 300  # 5 minutes
        self.last_rest_timestamp = None
        self.restratelimit = None
        self.streamobject = None
        self.stream_status = {'operation': 'unconnected',
                              'timestamp': None}  
        self._tweets = []
        self._tweetids = []

    def extend(self, b):
        for tweet in b:
            if tweet['tweet_id'] not in self._tweetids:
                self.append(tweet)

    def append(self, tweet):
        self._tweets.append(tweet)
        self._tweetids.append(tweet['tweet_id'])

    def sorted_and_humanized(self, count=None):
        sorted_tweets = self.get_sorted(count=count)
        # append/update human time field key/value for each tweet:
        for tweet in sorted_tweets:
            #  7 is a magic number because there's a conflict between naive
            #  datetime and pytz's methods. TODO make it work-- I didn't quite
            #  get there.
            if not 'timestamp' in tweet:
                tweet['timestamp'] = time.mktime(
                    (tweet['datetime']- datetime.timedelta(hours=8)).utctimetuple())
            tweet['humantime'] = humanize.naturaltime(
                datetime.datetime.fromtimestamp(tweet['timestamp']))
        return sorted_tweets

    def get_sorted(self, count=None):
        return sorted(self._tweets,
                      key=itemgetter('tweet_id'),
                      reverse=True)[:count]

    def rest_time_elapsed(self):
        # if a REST call was never made, it's okay to call now:
        if not twitter_handler.last_rest_timestamp:
            return True
        timesince = int(time.time()) - self.last_rest_timestamp
        return timesince > self._REST_WAIT

    def safe_to_stream_connect(self):
        # it's safe to connect if you've never connected before:
        if not self.stream_status['timestamp']:
            return True
        standofftime = int(time.time()) - self.stream_status['timestamp']
        return standofftime > self._STREAM_STANDOFF_TIME

    def __iter__(self):
        return self._tweets.__iter__()

twitter_handler = TwitterAPIHandler()


# TODO: give exceptions if we can't pull enough tweets. As is,
# will fail if twitterREST doesn't return enough, which is determined
# by default Twitter API (and also how many total tweets there are).
@twitter_blueprint.route('/api/mcribtweets/last/<int:count>/')
@json_response_with_status
def recent_tweets(count):
    # REST calls are committed when enough time has passed...
    if twitter_handler.rest_time_elapsed(): 
        print 'REST CALL'
        twitter_handler.restratelimit = twitterrestfetcher.get_rate_limit()
        for user in ['mcrib']:
            twitter_handler.extend(
                twitterrestfetcher.get_user_mentions(user, count))
        twitter_handler.last_rest_timestamp = int(time.time())
        ####twitter_handler.get_rid_of_dupes()
    # stream API will run by itself after it's connected
    if twitter_handler.stream_status['operation'] != 'running':
        # check that it's safe to connect to avoid 420 errors
        if twitter_handler.safe_to_stream_connect():
            twitterstream.streamobject = twitterstream.StreamListener(terms=['mcrib'],
                                         # twitter ids for @mcrib (unrelated)
                                         followids=["211296193"],
                                         objecttouse=twitter_handler)
            twitter_handler.stream_status['operation'] = 'running'
            twitter_handler.stream_status['timestamp'] = None
    # check if we're experiencing 420 error for the streaming API:
    if twitterstream.streamobject and twitterstream.streamobject.rate_limited:
        if not twitter_handler.stream_status['timestamp']:
            twitter_handler.stream_status['operation'] = 'rate limited'
            twitter_handler.stream_status['timestamp'] = int(time.time())    
    return {'api_info':
                       {'last_rest_call': twitter_handler.last_rest_timestamp,
                        'rest_ratelimit': twitter_handler.restratelimit,
                        'stream_status': twitter_handler.stream_status},
            'tweets': twitter_handler.sorted_and_humanized(count=count)}
