# Magor Backend

[![ghwh-deploy](http://magor-sge.speechlab.sg/ghwh/ghwh-badge/?name=ccpandhare/magor-backend)](http://magor-sge.speechlab.sg/ghwh/?name=ccpandhare/magor-backend)

## Installation Instructions

### Prerequisites

- Nodejs (Suggested Version: 10+) [Visit This link](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04)
- NPM (Suggested Version 6.14.5+) - should auto install with nodejs
- Mongodb [Visit this link](https://docs.mongodb.com/manual/installation/)
- Nginx
- PM2 - `$ npm install -g pm2` (You might need to use sudo)

### Cloning

```
$ git clone https://github.com/ccpandhare/magor-backend/
$ cd magor-backend
$ npm install # to install dependancies
```

### Setup

#### DOTENV

You will have to create a .env file in the root directory of this repository, with contents similar to `.env.example` present in this repo. **Please change the JWT SECRET IN THE .env FILE**

#### GAPPS

We are using Google's API for translation:

- Please register for a Google Cloud account.
- And enable the Translations API.
- Then go to Google Cloud Platform > Credentials > Service Account > Create New.
- Inside your new service account, create a new key in JSON format.
- Download this JSON file and place it in the root directory as `gapp.json` (see .env)
- Now you should be able to use the translations API via the magor-frontend media player

#### Configuring nginx

/etc/nginx/nginx.conf:

```
...
http {
    ...
    client_max_body_size 1000M;
    ...
}
...
```

Set max client body size to 1000M for facilitating audio/video file transfers.

/etc/nginx/sites-available/default: (or whatever your config name is)

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    # Root directory should be build folder of magor-frontend
    root /home/...path to.../magor-frontend/build;

    index index.html index.htm index.nginx-debian.html;

    server_name _;

    location /api {
        # Redirect all requests to /api/something to localhost:3000/something
        rewrite /api(.*) $1 break;
        proxy_pass http://localhost:3000;
    }

    location /ghwh {
        # Redirect all requests to /ghwh/something to localhost:5000/something
        rewrite /ghwh(.*) $1 break;
        proxy_pass http://localhost:5000;
    }
    location / {
        try_files $uri $uri /index.html =404;
    }
}
```

Test your Nginx config using `$ sudo nginx -t`
Restart Nginx using `sudo service nginx restart` to restart Nginx and load your changes.

#### Setting up mongodb database

This directory contains an initial database collection of "users" in `./db.init.json`
You can import this by running:

```
$ mongoimport --db=magor --collection=users --file=db.init.json
```

This JSON file contains only one user. After doing this you should be able to log in using the credentials admin@admin.com, 12345

### Development

```
$ npm run dev
```

### Production

```
$ npm run start
```

### Debugging

#### Accessing the logs

The logs can be accessed by running `$ pm2 log`
This command willl list the laft few lines of STDOUT and STDERR, along with the file they are stored in.
You can read these files manually using VIM.

#### Accessing Mongo from the command line

You can access mongodb from the command line with `$ mongo`. This will fire up the mongo shell
Before doing anything, you'll have to switch to our database:

```
mongo> use magor
```

##### Finding recordings:

```
mongo> db.recordings.find({}, {title: 1})
```

This will select all recordings from the database and only fetch the "title" field. This is necessary because some fields (uniqueWords) are too large and once displayed can render the search pointless, taking up all the space. Look up mongodb queries for more info.

You can find the ASR requests of a particular Recording using the Recording ID from the URL bar of the magor recording (https://magor-url.something/recording/$recordingId).
You can then search for thar recording like this:

```
mongo> db.recordings.find({recordingId: $recordingId})
```

##### ASR Requests:

All ASR reqruests are stored in a table with the follwing keys: recordingId[type ObjectId], asrId[type ObjectId], completed[type Bool], date[type ISODate].

```
mongo> db.asrrequests.find({recordingId: $recordingId})
```

If you have an asrId from the ASR backend, you can also find the correnponding entry here similar to finding by recordingId

You can find all ASRRequests created after a particular date, or between two dates like this:

```
mongo> db.asrrequests.find({date: {$gte: ISODate("2020-06-25")}})
mongo> db.asrrequests.find({date: {$gte: ISODate("2020-06-25"), $lte: ISODate("2020-06-30") }})
```

Here $gte stands for 'greater than or equal to' and $lte stands for 'less than or equal to'

Travis CI Enabled.
