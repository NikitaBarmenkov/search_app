const utf8 = require('utf8');
const axios = require("axios");
const VKWebSocket = require('vkflow').VKWebSocket;
const { authWithToken, flushRules, postRule } = require('vkflow').VKStreamingAPI;
require('dotenv').config();

const access_token = process.env.VK_SERVICE_KEY;
const version = 5.112;
const count = 100;
const api = 'https://api.vk.com/method/newsfeed.search?';

const endpoint = 'streaming.vk.com';
const key = process.env.VK_STREAM_KEY;
let rules = [];

module.exports.GetData = async function(ws, keyword, excluded_words) {
    try {
        url = api + 'q=' + keyword;
        excluded_words.forEach(element => {
            url = url + '%20-' + encodeURIComponent(element);
        });
        url = url + '&count=' + count
            + '&access_token=' + access_token
            + '&v=' + version;
        const response = await axios.get(utf8.encode(url));

        const items = [];
        let val = {};
        for (let i = 0; i < response.data.response.items.length; i++) {
            items.push({
                text: response.data.response.items[i].text,
                ref: "https://vk.com/wall"
                    + response.data.response.items[i].owner_id + '_'
                    + response.data.response.items[i].id
            });
        }
        const item = {
            option: 'static',
            data: items
        }
        ws.emit('message', JSON.stringify(item));
    }
    catch (error) {
        console.log(error);
    }
}

module.exports.GetRealTime = function(ws, keyword, excluded_words) {
    try {
        (async () => {
            await flushRules(endpoint, key);

            rules = [];
            rules.push({
                'tag': keyword,
                'value': keyword 
            });
            excluded_words.forEach(element => {
                rules[0].value += ' -' + element;
            }); 

            for (let rule of rules)
                await postRule(endpoint, key, { rule });

            const socket = new VKWebSocket(
                `wss://${endpoint}/stream?key=${key}`,
                { socket: { omitServiceMessages: false } }
            )

            socket.on('message', function incoming(data) {
                if (data.code == 100) {
                    const item = {
                        option: 'realtime',
                        data: {
                            text: data.event.text,
                            ref: data.event.event_url
                        }
                    };
                    ws.emit('message', JSON.stringify(item));
                }
              });
            socket.on('error', (error)=> {
                console.log(error);
            });
            socket.on('pong', () => {
                socket.ping(true);
            });
        })();
    }
    catch(error) {
        console.log(error);
    }
}