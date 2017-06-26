var teamsClient = require("beepboop-teams")();
var macraTeam = require("./macrateam");

var Slapp = require('slapp')
var BeepBoopContext = require('slapp-context-beepboop')
if (!process.env.PORT) throw Error('PORT missing but required')

var slapp = Slapp({ context: BeepBoopContext() })


var teams = {};

var addTeam = function (teamInfo) {
  teams[teamInfo.slack_team_id] = macraTeam(teamInfo);
};

var removeTeam = function (teamId) {
  delete teams[teamId];
};

// TODO: pagination
teamsClient.list(0, 1000, function (err, result) {
  if (err) {
    console.log("Err: " + JSON.stringify(err, null, 2));
    process.exit(1);
  }

  if (result.results === undefined) {
    console.log("no results: " + JSON.stringify(result, null, 2));
    process.exit(1);
  }

  result.results.forEach(function (teamInfo) {
    console.log("Found team " + teamInfo.slack_team_id + " - " + teamInfo.slack_team_name);
    addTeam(teamInfo);
  });

  // slapp stuff

  slapp.command('/macramoji', (msg, cmd) => {
    // console.log("OK macramoji! `" + cmd + "` " + JSON.stringify(Object.keys(msg), null, 2));

    if (cmd === "" || cmd === "help") {
      msg.respond({
        response_type: "ephemeral",
        text: "I create emoji on demand based on a set of macros. " +
        "Try typing `/macramoji (:joy:)intensifies` to see."
      });
      return;
    }

    var responseFn = function (a, b, c) {
      msg.respond(a, b, c);
    };
    teams[msg.meta.team_id].processMessage(cmd, responseFn, msg.meta.channel_id);
  });

  // handle the events we care about
  slapp.use(function (msg, next) {
    if (msg.body.event) {
      let eventType = msg.body.event && msg.body.event.type;
      let subType = msg.body.event.subtype;
      let name = msg.body.event.name;
      let names = msg.body.event.names;
      let value = msg.body.event.value;
      let teamId = msg.meta.team_id;

      switch (eventType) {
        case 'emoji_changed':
          console.log("Firing emoji_changed event with " + JSON.stringify(msg.body.event, null, 2));
          teams[teamId].onEmojiChange(subType, names || [name], value);
          break;

        case 'bb.team_added':
          teamsClient.get(msg.meta.team_id, function (err, teamInfo) {
            addTeam(teamInfo);
          });
          break;

        case 'bb.team_removed':
          removeTeam(msg.meta.team_id);
          break;
      }
    }
    next();
  })

  // attach handlers to an Express app
  slapp.attachToExpress(require('express')()).listen(process.env.PORT)

});