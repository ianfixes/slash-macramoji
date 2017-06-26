# Demos

These are some demos of packaging Macramoji in some other frameworks, although they ultimately didn't serve my needs.

## Launching express-based demo
```
$ ngrok http 4390
$ # update slash command enpoint to ngrok endpoint
$ SLACK_CLIENT_ID=111.222 \
  SLACK_CLIENT_SECRET=123abc\
  SLACK_VERIFICATION_TOKEN=blarg
  SLACK_API_TOKEN=xoxp-zzzzzzz
  PORT=4390 \
  NODE_ENV=development \
  APP_NAME=macramoji \
  node express
```

### Known issues:
* Emoji/uploading web API requests only work if you use the `xoxp-` token


## Launching botkit-based demo
```
$ ngrok http 4390
$ # update slash command enpoint to ngrok endpoint + '/slack/receive'
$ SLACK_CLIENT_ID=111.222 \
  SLACK_CLIENT_SECRET=123abc\
  SLACK_VERIFICATION_TOKEN=blarg
  SLACK_API_TOKEN=xoxp-zzzzzzz
  PORT=4390 \
  node index
```

### Known issues:
* Can't seem to connect at all
