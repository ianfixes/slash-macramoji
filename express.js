var fs = require("fs");
var gm = require("gm");
var macramoji = require('macramoji');
var slackExpress = require("slack-express");
var WebClient = require('@slack/client').WebClient;

var slack = slackExpress.slack;
var slash = slackExpress.slash;
var start = slackExpress.start;

var token = process.env.SLACK_API_TOKEN;
var web = new WebClient(token);

emojiFetchFn = function (callback) {
    return web.emoji.list(function (err, result) {
        if (err) {
            console.log("emoji.list err: " + JSON.stringify(err));
            return callback(err, result.emoji);
        }
        if (result.ok === false) {
            console.log("emoji.list not ok: " + JSON.stringify(result));
            return callback(err, result.emoji);
       }
        return callback(err, result.emoji);
    });
}

emojiStore = new macramoji.EmojiStore(emojiFetchFn, 15 * 60); // refesh emoji list every 15 minutes
processor = new macramoji.EmojiProcessor(emojiStore, macramoji.defaultMacros);

function replyPrivate(message, text) {
    message({
        text: text,
        response_type: "ephemeral"
    });
}

// File upload via file param
function uploadFile(slackResp, channel) {
    var path = slackResp.imgResult.imgPath();
    gm(path).format(function (err, fmt) {
        var format = err ? 'gif' : fmt;
        var fileName = slackResp.fileDesc + "." + format;

        var streamOpts = {
            file: fs.createReadStream(path),
            title: slackResp.fileDesc,
            filetype: format,
            channels: channel,
        };

        web.files.upload(fileName, streamOpts, function handleStreamFileUpload(err, res) {
            console.log(res);
        });
    });
}


slash('/macramoji', function (payload, message) {
    console.log("OK! " + JSON.stringify(payload, null, 2));
    // payload recieved as a POST from Slack command issued
    let cmd = payload.raw.command

    if (payload.raw.text === "" || payload.raw.text === "help") {
        replyPrivate(message,
            "I create emoji on demand based on a set of macros. " +
            "Try typing `/macramoji (:joy:)intensifies` to see.");
        return;
    }


    // sends a response to the Slack user
    processor.process(payload.raw.text.trim(), function (slackResp) {
        if (slackResp.message) {
            replyPrivate(message, slackResp.message);
        } else if (slackResp.imgResult) {
            setImmediate(function () { message({ response_type: "in_channel" }); });// essentially an ack
            uploadFile(slackResp, payload.raw.channel_id);
        }
    });

});

start();
