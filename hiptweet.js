var request = require('request'),
    url = require('url'),
    https = require('https'),
    moment = require('moment'),
    config = require(__dirname + '/config.json');

var BEARER_TOKEN = config.bearer_token;
var HIPCHAT_TOKEN = config.hipchat_token;
var DESK_TWITTER_NAME = 'Desk_ops';
var POLICE_CHASE_TWITTER_NAME = 'pcalive';

var accounts = config.twitter_accounts;

var getTweets = function (account, callback) {
    request.get({
        url: 'https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=' + account + '&exclude_replies=true',
        headers: {
            'User-Agent': 'HipTweet App',
            Authorization: 'Bearer ' + BEARER_TOKEN
        }
    }, function (error, httpResponse, data) {
        if (error) {
            throw error;
        }

        callback(data);
    });
};

var postTweet = function (message, account) {
    var msg = escape(message);
    var url_parts = url.parse('https://hipchat.vimeows.com/v1/rooms/message?format=json&message_format=text&room_id=ComDirs&from=' + account + '&color=yellow&message=' + msg + '&auth_token=' + HIPCHAT_TOKEN);
    url_parts.method = 'POST';

    var req = https.request(url_parts, function (res) {
        console.log(res);
    });

    req.on('error', function (err) {
        throw err;
    });

    req.end();
};

var concernsPoliceChase = function (tweet) {
    if (tweet.text.indexOf('WE HAVE A POLICE CHASE') > -1) {
        return true;
    }

    return false;
};

var isNew = function (tweet) {
    var created_at = moment(tweet.created_at),
        five_min_ago = moment().subtract(5, 'minutes');

    if (created_at.isAfter(five_min_ago)) {
        return true;
    }

    return false;
};

accounts.forEach(function (key, i) {
    var account = accounts[i];

    getTweets(accounts[i], function (data) {
        var tweets = JSON.parse(data);

        tweets.forEach(function (key, i) {
            var tweet = tweets[i],
                msg = tweet.text;

            if (isNew(tweet)) {
                if (tweet.user.screen_name === POLICE_CHASE_TWITTER_NAME) { // if it's pcalive, make sure it's a police chase
                    if (concernsPoliceChase(msg)) {
                        console.log('posting police chase tweet');
                        postTweet(msg, account);
                    }
                } else { // if it's not pcalive, post whatever we get
                    console.log('posting new tweet for ' + account);
                    postTweet(msg, account);
                }
            } else {
                console.log('Old tweet found for ' + account);
            }
        });
    });
});

