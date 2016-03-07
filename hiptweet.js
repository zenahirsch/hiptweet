const request = require('request');
const url = require('url');
const https = require('https');
const moment = require('moment');
const config = require(__dirname + '/config.json');

const BEARER_TOKEN = config.bearer_token;
const HIPCHAT_TOKEN = config.hipchat_token;
const HIPCHAT_PROTOCOL = config.hipchat_protocol;
const HIPCHAT_DOMAIN = config.hipchat_domain;
const HIPCHAT_ROOM = config.hipchat_room;

const accounts = config.twitter_accounts;

function getTweetsForAccount (account, callback) {
    request.get({
        url: 'https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=' + account + '&exclude_replies=true',
        headers: {
            'User-Agent': 'HipTweet App',
            Authorization: 'Bearer ' + BEARER_TOKEN
        }
    }, (error, httpResponse, data) => {
        if (error) {
            throw error;
        }

        callback(data);
    });
};

function postTweet (message, account) {
    let msg = escape(message);
    let url_parts = url.parse(`${HIPCHAT_PROTOCOL}://${HIPCHAT_DOMAIN}/v1/rooms/message?format=json&message_format=text&room_id=${HIPCHAT_ROOM}&from=${account}&color=yellow&message=${msg}&auth_token=${HIPCHAT_TOKEN}`);
    url_parts.method = 'POST';

    let req = https.request(url_parts, (res) => console.log(res));

    req.on('error', (err) => {
        throw err;
    });

    req.end();
};

function isNew (tweet) {
    const created_at = moment(tweet.created_at);
    const five_min_ago = moment().subtract(5, 'minutes');

    if (created_at.isAfter(five_min_ago)) {
        return true;
    }

    return false;
};

function getTweets () {
    accounts.forEach((account) => {
        getTweets(account, (data) => {
            const tweets = JSON.parse(data);

            tweets.forEach((tweet) => {
                const msg = tweet.text;

                if (isNew(tweet)) {
                    postTweet(msg, account);
                } else {
                    console.log('Old tweet found for ' + account);
                }
            });
        });
    });
}

module.exports = getTweets;
