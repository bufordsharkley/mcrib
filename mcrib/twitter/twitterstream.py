import json

import tweepy

from config import twitter_auth


class StreamListener(tweepy.StreamListener):

    def __init__(self, terms, followids, objecttouse=None,
                 auth_tweep=None, async=False):
        super(StreamListener, self).__init__()
        if auth_tweep is None:
            auth_tweep = tweepy.OAuthHandler(twitter_auth['consumer_key'],
                                             twitter_auth['consumer_secret'])
            auth_tweep.set_access_token(twitter_auth['access_token_key'],
                                        twitter_auth['access_token_secret'])
        self.objecttouse = objecttouse
        self.rate_limited = False
        print 'intializing connection to STREAMING api'
        self.streamer = tweepy.Stream(auth=auth_tweep, listener=self)
        # if you're not appending the results to an object, you don't need
        # async (unit tests, etc)
        if self.objecttouse:
            async = True
        self.streamer.filter(follow=followids, track=terms, async=async)

    def on_status(self, tweet):
        try:
            if self.objecttouse:
                response = {}
                # TODO merge this into a function that's shared between
                # stream and rest modules...
                response['username'] = tweet.author.screen_name
                response['text'] = tweet.text
                response['datetime'] = tweet.created_at
                response['tweet_id'] = tweet.id
                self.objecttouse.append(response)
            else:
                # the following prints to stdout when the __name__ = __main__
                # test is run...
                print tweet.id
                print u"{} {} {}".format(tweet.text,
                                         tweet.created_at,
                                         tweet.author.screen_name)
                print
        except Exception, e:
            print 'Encountered Exception:', e
            pass

    def on_error(self, status_code):
        print 'Error: ' + repr(status_code)
        if status_code == 420:
            self.rate_limited = True
            self.streamer.disconnect() 
        return False
    
    # TODO find out if it's important to implement:
    # on_exception, on_limit, on_timeout, on_disconnect

if __name__ == "__main__":
    StreamListener(terms=["pant"],
                   followids=["400400635", "46706038"])
