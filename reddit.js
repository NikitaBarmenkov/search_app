const axios = require("axios");
const Rockets = require('rockets');

module.exports.GetData = async function(ws, keyword, excluded_words) {
    try {
        (async () => {
            const res0 = await Search('submission', keyword, excluded_words);
            const res1 = await Search('comment', keyword, excluded_words);
            const res = res0.concat(res1);
            const item = {
                option: 'static',
                data: res
            }
            ws.emit('message', JSON.stringify(item));
        })();
    }
    catch (error) {
        console.log(error);
    }
}

async function Search(search_type, keyword, excluded_words) {
    let api = `http://api.pushshift.io/reddit/${search_type}/search?q=`;
    api = api + encodeURIComponent(keyword);
    excluded_words.forEach(element => {
        api = api + '%20-' + encodeURIComponent(element);
    });
    
    const response = await axios.get(api);
    const items = [];
    let item = {};
    for (let i = 0; i < response.data.data.length; i++) {
        item = {};
        if (search_type == 'submission') {
            item.text = response.data.data[i].selftext;
            item.ref = response.data.data[i].url;
        }
        else {
            item.text = response.data.data[i].body;
            item.ref = 'https://www.reddit.com' + response.data.data[i].permalink;
        }

        items.push(item);
    }
    return items;
}

module.exports.GetRealTime = async function(ws, keyword, excluded_words) {
    try {
        var client = new Rockets();

        client.on('connect', function() {

            var include = {
              contains: [ encodeURIComponent(keyword) ]
            };
          
            var exclude = {
                contains: []
              };

            excluded_words.forEach(element => {
                exclude.contains.push(encodeURIComponent(element));
            });
          
            client.subscribe('comments', include, exclude);
            client.subscribe('posts', include, exclude);
        });
          
        client.on('comment', function(comment) {
            const item = {
                option: 'realtime',
                data: {
                    text: comment.data.body,
                    ref: 'https://www.reddit.com' + comment.data.permalink
                }
            }
            ws.emit('message', JSON.stringify(item));
        });
        client.on('post', function(post) {
            const item = {
                option: 'realtime',
                data: {
                    text: post.data.selftext,
                    ref: post.data.url
                }
            }
            ws.emit('message', JSON.stringify(item));
        });
        client.on('disconnect', () => {
            client.reconnect();
        });
        client.on('error', (error) => {
            console.log(error);
        })
        client.connect();
    }
    catch (error) {
        console.log(error);
    }
}