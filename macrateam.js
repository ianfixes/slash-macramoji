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

  var emojiStore = new macramoji.EmojiStore(emojiFetchFn, 86400); // TOS 6.1: you should refresh the cache daily
  var processor = new macramoji.EmojiProcessor(emojiStore, macramoji.defaultMacros);


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
      slackResp.respondBeepBoopSlashCommand(channelId, bot, respondFn);
    });
  }

  return self;
};


