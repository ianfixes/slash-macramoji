'use strict'
var fs = require("fs");
var gm = require("gm");
var macramoji = require('macramoji');
var WebClient = require('@slack/client').WebClient;

module.exports = function MacraTeam(teamInfo) {

  var self = {};

  var web = new WebClient(teamInfo.slack_access_token);
  var bot = new WebClient(teamInfo.slack_bot_access_token);

  var emojiFetchFn = function (callback) {
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

  var emojiStore = new macramoji.EmojiStore(emojiFetchFn, 0); // 0 for no automatic refresh. TODO: daily?
  var processor = new macramoji.EmojiProcessor(emojiStore, macramoji.defaultMacros);

  // tell the user something went wrong
  var replyPrivate = function (respondFn, text) {
    respondFn({
      text: text,
      response_type: "ephemeral"
    }, function (err, data) { });
  }

  // File upload via file param
  var uploadFile = function(slackResp, channelId, respondFn) {
    var path = slackResp.imgResult.imgPath();
    gm(path).format(function (err, fmt) {
      console.log("this is upload to channel " + channelId);
      var format = err ? 'gif' : fmt;
      var fileName = slackResp.fileDesc + "." + format;

      var streamOpts = {
        file: fs.createReadStream(path),
        title: slackResp.fileDesc,
        filetype: format,
        channels: channelId,
      };

      bot.files.upload(fileName, streamOpts, function handleStreamFileUpload(err, res) {
        // if (err) console.log("handleStreamFileUpload err: " + JSON.stringify(err, null, 2));
        console.log("handleStreamFileUpload res: " + JSON.stringify(res, null, 2));

        if (res.error === "invalid_channel") {
          replyPrivate(respondFn, "I can't upload here.  Try this in a public channel or, DM me.");
        }
      });
    });
  }

  self.info = teamInfo;

  // this is pretty overloaded but whatever
  self.onEmojiChange = function (event, names, url) {
    switch (event) {
      case "add":
        // we only expect one entry
        return names.forEach(function (name) { emojiStore.addEmoji(name, url); });
      case "remove":
        return names.forEach(function (name) { emojiStore.deleteEmoji(name); });
      default:
        emojiStore.fetchEmoji();
    }
  }

  self.processMessage = function (inputText, respondFn, channelId) {
    // sends a response to the Slack user
    processor.process(inputText.trim(), function (slackResp) {
      if (slackResp.message) {
        replyPrivate(respondFn, slackResp.message);
      } else if (slackResp.imgResult) {
        // WE APPARENTLY DO NOT NEED ACK { reponse_type: in_channel } IN THIS FRAMEWORK
        uploadFile(slackResp, channelId, respondFn);
      }
    });
  }

  return self;
};


