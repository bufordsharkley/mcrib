import tweepy

from config import twitter_auth


class TwitterRESTFetcher(object):

    def __init__(self, auth_tweep=None):
        if auth_tweep is None:
            auth_tweep = tweepy.OAuthHandler(twitter_auth['consumer_key'],
                                             twitter_auth['consumer_secret'])
            auth_tweep.set_access_token(twitter_auth['access_token_key'],
                                        twitter_auth['access_token_secret'])
        self._api = tweepy.API(auth_tweep)

    # TODO: for all these--
    # if count > size of default Twitter API return,
    # do more clever stuff than it does now (which is nothing)
    def get_user_tweets(self, user, count):
        print 'REST CALL MADE'
        r = self._api.user_timeline(user)
        return [_parse_tweet(tweet) for tweet in r][:count]

    def get_mentions_of_self(self, count):
        print 'REST CALL MADE'
        # Using the authenticated account (kzsudj)'s mentions
        # timeline gets better results than simply searching for it,
        # as get_user_mentions does below
        r = self._api.mentions_timeline()
        # TODO (maybe) remove mentions BY self...
        return [_parse_tweet(tweet) for tweet in r][:count]

    def get_user_mentions(self, user, count):
        # If it's not yourself (in which case you do get_mentions_of_self),
        print 'REST CALL MADE'
        # you can only effect this via a search:
        r = self._api.search(q=user)
        # TODO (maybe) remove mentions BY self...
        return [_parse_tweet(tweet) for tweet in r][:count]

    def get_rate_limit(self):
        ratelimit = self._api.rate_limit_status()
        return {'self_mentions': ratelimit['resources']['statuses']['/statuses/mentions_timeline'],  # 15 
                'searches': ratelimit['resources']['search']['/search/tweets'],  # 180
                'user_statuses': ratelimit['resources']['statuses']['/statuses/user_timeline'], # 180
                'rate_limit_query': ratelimit['resources']['application']['/application/rate_limit_status']  # 180
               }

def _parse_tweet(tweet):
    return {
        'username': tweet.user.screen_name,
        'text': tweet.text,
        'datetime': tweet.created_at,
        'tweet_id': tweet.id,
    }


if __name__ == "__main__":
    twitterrest = TwitterRESTFetcher()
    
    print 'MENTIONS:'
    for tweet in twitterrest.get_mentions_of_self(count=4):
        pass        
        #print tweet
    print 'ANOTHER USER:'
    for tweet in twitterrest.get_user_tweets(user='kzsu', count=3):
        print tweet
    print 'ANOTHER USER MENTIONS:'
    for tweet in twitterrest.get_user_mentions(user='kzsu', count=3):
        print tweet
    ratelimit = twitterrest.rate_limit()
    print type(ratelimit)
    for resource in ratelimit['resources']:
        print resource
        print ratelimit['resources'][resource]
    print ratelimit['resources']['statuses']['/statuses/mentions_timeline'] # 15 
    print ratelimit['resources']['search']['/search/tweets'] # 180
    print ratelimit['resources']['statuses']['/statuses/user_timeline'] # 180
    print ratelimit['resources']['application'] # 180
