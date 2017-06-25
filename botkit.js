// boilerplate suggested at https://api.slack.com/tutorials/easy-peasy-slash-commands
var Botkit = require('botkit');
var macramoji = require('macramoji');


if (!process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET || !process.env.PORT || !process.env.SLACK_VERIFICATION_TOKEN || !process.env.SLACK_API_TOKEN) {
    console.log('Error: Specify SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_VERIFICATION_TOKEN, SLACK_API_TOKEN, and PORT in environment');
    process.exit(1);
}

var config = {
    debug: true,
    json_file_store: './bot_runtime_storage/'
};

var appConfig = {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scopes: ['commands', 'files:write:user', 'emoji:read'],
};

var botConfig = {
    token: process.env.SLACK_API_TOKEN
};

var controller = Botkit.slackbot(config).configureSlackApp(appConfig);
var bot = controller.spawn(botConfig).startRTM();

controller.setupWebserver(process.env.PORT, function (err, webserver) {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    webserver.use(function (req, res, next) {
        console.log("Incoming web request: " + JSON.stringify(req.body, null, 2));
        next();
    });

    // Setup our slash command webhook endpoints
    controller.createWebhookEndpoints(webserver, process.env.SLACK_VERIFICATION_TOKEN);
    controller.createOauthEndpoints(webserver, function (err, req, res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
});

emojiFetchFn = function (callback) {
    return bot.api.emoji.list({}, function (err, result) {
        if (err) return callback(err);
        return callback(err, result.emoji);
    });
}
emojiStore = new macramoji.EmojiStore(emojiFetchFn, 15 * 60); // refesh emoji list every 15 minutes
processor = new macramoji.EmojiProcessor(emojiStore, macramoji.defaultMacros);

controller.on('slash_command', function (bot, message) {
    console.log("ok");
    console.log("Got slash command " + message.command + " :: " + message.text);
    bot.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");

    switch (message.command) {
        case "/macramoji":
            // if no text was supplied, treat it as a help command
            if (message.text === "" || message.text === "help") {
                bot.replyPrivate(message,
                    "I create emoji on demand based on a set of macros. " +
                    "Try typing `/macramoji (:joy:)intensifies` to see.");
                return;
            }

            bot.replyPrivate(message, "hey hey");
            processor.process(message.text.trim(), function (slackResp) {
                return slackResp.respondBotkit(payload, bot);
            });

            break;
        default:
            bot.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");

    }

});
