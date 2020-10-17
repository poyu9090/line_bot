'use strict';
const result = require('dotenv').config();
if (result.error) throw result.error

const Express = require('express');
const BodyParser = require('body-parser');
const fetch = require('node-fetch');
const crypto = requsire('crypto');
const axios = require('axios');
const slackToken = 'xoxb-1395688986436-1436510679728-gZDQj6maUQWC2Fg9VslyexrI';
const app = Express();

app.use(BodyParser.urlencoded({ extended: true }));
app.use(BodyParser.json());

async function run(text) {
    const url = 'https://slack.com/api/chat.postMessage';
    const res = await axios.post(url, {
        channel: '#home',
        text: text,
        attachments: [
            {
                "text": "請進行重要性評估",
                "fallback": "fallback",
                "callback_id": "button_test",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "priority00",
                        "text": "重要",
                        "style": "danger",
                        "type": "button",
                        "value": "chess"
                    },
                    {
                        "name": "priority01",
                        "text": "普通",
                        "type": "button",
                        "value": "maze" 
                    },
                    {
                        "name": "priority02",
                        "text": "無用",
                        "type": "button",
                        "value": "maze"
                    }
                ]
            }
        ]

    }, { headers: { authorization: `Bearer ${slackToken}` } });
    console.log('Done', res.data);
}

app.post('/interactive', (req, res, next) => {
    console.log(req.body);
    const body = JSON.stringify(req.body);
    const sub_body = body.substring(0, 100);
    console.log(sub_body);
    if (sub_body.includes('priority00')) {
        console.log('你將它分類到重要');
        return res.json({
            text: '你將它分類到重要'
        })
    }
    else if (sub_body.includes('priority01')) {
        console.log('你將它分類到普通');
        return res.json({
            text: '你將它分類到普通'
        })
    }
    else if (sub_body.includes('priority02')) {
        console.log('你將它分類到不重要');
        return res.json({
            text: '你將它分類到不重要'
        })
    }
})

// 填完問卷後，會打 post 這隻 API，我們會從 req 中拿到 svid 和 hash，再將資料組合成 Webhook Query API ，取得答案，再使用官方的解密方式，解密出 json 格式的資料，再放資料後打 Slack 通知的 API
app.post('/surveywebhook', function (req) {
    console.log(req.body);
    var svid = req.body.svid;
    var hash = req.body.hash;
    var url = `https://www.surveycake.com/webhook/v0/${svid}/${hash}`;

    fetch(url)
        .then((res) => res.text())
        .then((dat) => {
            const decipher = crypto.createDecipheriv(
                'AES-128-CBC',
                '4566c07379b47a54',
                'dd3c1870ff934c2d'
            );
            let json = decipher.update(
                dat,
                'base64',
                'utf8'
            );
            json += decipher.final('utf8');
            var ans = JSON.stringify(JSON.parse(json));
            var obj = JSON.parse(json);

            run(obj.result[4].answer);
            console.log(JSON.stringify(JSON.parse(json)));
        })
        .catch((err) => console.log(err));
})
app.listen(3000);

