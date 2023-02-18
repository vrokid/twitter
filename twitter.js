var Twitter = require('twitter');
const OAuth = require('oauth');
const { promisify } = require('util');

const vrokid = {
    consumer_key: "5HdS9G02TltVCCJR3b7ZNt7Pz", // REPLACE TO YOUR VALUES
    consumer_secret: "TgGad2SA1rmI18hytZ3hcff3MmfhHe6rxubSQHuAAsztvGO4Zi", // REPLACE TO YOUR VALUES
    access_token_key: "1400094743111606471-DDk211sJFW04lryxPvXpcs9nOQhjAB", // REPLACE TO YOUR VALUES
    access_token_secret: "6u9ayXxNMY0Xsl31cqDNOdWIzWfh1hh2kf2c8GWV2POyE" // REPLACE TO YOUR VALUES
}

var client = new Twitter({
    consumer_key: vrokid.consumer_key,
    consumer_secret: vrokid.consumer_secret,
    access_token_key: vrokid.access_token_key,
    access_token_secret: vrokid.access_token_secret
});

const appleMusicSearch = "music.apple.com/us/album";
const spotifySearch = "open.spotify.com/track";

var id_str = "";
var replied_id_str = "";
var successReplyCount = 1;
var successLikeCount = 1;
var currentLink = spotifySearch; // REPLACE IF YOU NEED APPLE MUSIC

const randomNumberInRange = (min, max) => Math.random() * (max - min) + min;

function getRandomMilisec(min, max) {
    return Math.round(randomNumberInRange(min, max));
}

async function getTweetStats (tweetid) {
    var oauth = new OAuth.OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      vrokid.consumer_key,
      vrokid.consumer_secret,
      '1.0A', null, 'HMAC-SHA1'
    )
  
    const get = promisify(oauth.get.bind(oauth))
  
    const body = await get(
      `https://api.twitter.com/2/tweets/${tweetid}?tweet.fields=non_public_metrics,organic_metrics&media.fields=non_public_metrics,organic_metrics&expansions=attachments.media_keys`,
      vrokid.access_token_key,
      vrokid.access_token_secret
    )
  
    const response = JSON.parse(body);
    const nonPublicMetrics = response["data"]["non_public_metrics"];
  
    return nonPublicMetrics;
  }

function generateSpotifyComment() {
    let randomNumber = Math.floor(Math.random() * 10000);

    const spotifylinks = [
        "https://open.spotify.com/playlist/7bumQO9rjeO0gLWOAZarcr?g=" + randomNumber, // playlist
        "https://open.spotify.com/track/1gCm5ZRaZqDdLmAfrPvDQG?g=" + randomNumber, //shinobu
        "https://open.spotify.com/track/5GCULySGTxDz3BGjM5H7i6?g=" + randomNumber, // omg
    ];

    // u can add some emojis 
    const text = ["love it ", "luv it ", "", "", "", "", ""];

    const randomLink = Math.floor(Math.random() * spotifylinks.length);
    const randomText = Math.floor(Math.random() * text.length);
    return text[randomText] + spotifylinks[randomLink];
}

function sendReply() {

    var comment = generateSpotifyComment();

    client.post('statuses/update', {
        status: comment,
        in_reply_to_status_id: id_str,
        auto_populate_reply_metadata: true
      }, function (err, data, response) {
        if (err) {
          console.log(err);
        } else {
            successReplyCount += 1;
            replied_id_str = data["id_str"];
            console.log("replied_id_str =", data["id_str"]);
            console.log(data.text + ' tweeted!');
        }
      })
}

function likeAndReply() {
    client.post('favorites/create', { id: id_str })
        .then(result => {
            successLikeCount += 1;
            console.log('Liked tweet successfully!');
            sendReply();
        }).catch((error) => {
            console.log("error in Liking");
            console.log(error);
        });
}

function searchForTweets(link) {

    console.log("current link =", link);
    client.get('search/tweets', {q: link, result_type: 'recent'}, function(error, tweets, response) {
        // returns 15 results
        for (let i = 0; i < tweets["statuses"].length; i++) {
            // making sure it's not a reply
            if (tweets["statuses"][i]["in_reply_to_status_id"] == null) {
                // making sure it's not a popular user
                if (tweets["statuses"][i]["user"]["followers_count"] < 1000) {
                    console.log("followers_count =", tweets["statuses"][i]["user"]["followers_count"]);
                    // making sure it's not a popular user as well
                    if (tweets["statuses"][i]["user"]["friends_count"] < 1000) {
                        console.log("friends_count =", tweets["statuses"][i]["user"]["friends_count"]);
                        const idStr = tweets["statuses"][i]["id_str"];
                        id_str = idStr;
                        const username = tweets["statuses"][i]["user"]["screen_name"];
                        console.log("idStr = ", idStr);
                        console.log("username = ", username);
                        console.log("wait 50-60 seconds to reply");
                        console.log("wait 30-50 seconds to like");
                        console.log("successReplyCount =", successReplyCount);
                        console.log("successLikeCount =", successLikeCount);
                        setTimeout(likeAndReply, getRandomMilisec(30000, 50000));
                        break;
                    }
                    else {
                        console.log("skipped this tweet cuz user has many friends");
                        continue;
                    }
                } else {
                    console.log("skipped this tweet cuz user has many followers");
                    continue;
                }
            } else {
                console.log("skipped this tweet cuz it is a reply");
                continue;
            }
          }
     });
};

function timeoutFunc() {
    console.log("\n \n \n");
    console.log("successReplyCount =", successReplyCount);
    console.log("successLikeCount =", successLikeCount);

    if (replied_id_str == "") {

        searchForTweets(currentLink);

        if (successReplyCount % 10 == 0) {
            console.log("Big pause for 15-20 minutes, cuz ReplyNumber =", successReplyCount);
            setTimeout(timeoutFunc, getRandomMilisec(900000, 1200000));
        } else {
            console.log("wait around 80-100 second to do it again");
            setTimeout(timeoutFunc, getRandomMilisec(80000, 120000));
        }
    } else {
        console.log("replied_id_str =", replied_id_str);

        // TRICKY PART
        getTweetStats(replied_id_str).then(stats => {
            const url_link_clicks = stats["url_link_clicks"];
            const user_profile_clicks = stats["user_profile_clicks"];
            const impressions_count = stats["impression_count"];

            console.log("url_link_clicks =", url_link_clicks);
            console.log("user_profile_clicks =", user_profile_clicks);
            console.log("impressions_count =", impressions_count);

            if (impressions_count > 0) {
                searchForTweets(currentLink);

                replied_id_str = "";
                console.log("wait around 80-100 second to do it again");
                setTimeout(timeoutFunc, getRandomMilisec(80000, 120000));
            } else {
                console.log("wait around 80-100 second to do it again");
                setTimeout(timeoutFunc, getRandomMilisec(80000, 120000));
            }
        }).catch(err => {
            console.log("caught err while getTweetStats(), wait 80-120 sec to do all of it again");
            setTimeout(timeoutFunc, getRandomMilisec(80000, 120000));
        })
    }
  }

timeoutFunc();
