# Magor Front End

[![CircleCI](https://circleci.com/gh/ccpandhare/magor-frontend.svg?style=svg&circle-token=00d7b09a2cd9614b653016f29d563e0e41c3327e)](https://circleci.com/gh/ccpandhare/magor-frontend)
[![codecov](https://codecov.io/gh/ccpandhare/magor-frontend/branch/master/graph/badge.svg?token=KKWFLFTZT3)](https://codecov.io/gh/ccpandhare/magor-frontend)
[![ghwh-deploy](http://magor-sge.speechlab.sg/ghwh/ghwh-badge/?name=ccpandhare/magor-frontend)](http://magor-sge.speechlab.sg/ghwh/?name=ccpandhare/magor-frontend)

## Installation

### Requirements

-   Nodejs (Suggested Version: 10+) [Visit This link](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04)
-   NPM (Suggested Version 6.14.5+) - should auto install with nodejs
-   Yarn (Suggested Version: 1.7.0+) `$ npm i -g yarn` (You might have to use sudo)

### Installation

#### Cloning

```
$ git clone https://github.com/ccpandhare/magor-frontend/
$ cd magor-frontend
$ yarn # to install dependancies
```

#### Setting up the environment

Now, you will have to create a .env file in the magor-frontend directory, with these contents:

```
REACT_APP_APIURL=http://localhost:3000
```

The API URL is the URL of magor-backend (note that there is no trailing /)

#### Development

```
$ yarn start # for development
$ yarn test --silent --watchAll=false # to run unit tests; see JEST documentation for more options
$ yarn test --coverage # to get test coverage
```

We are using CircleCI for CI and ccpandhare/ghwh-deploy for CD

#### Production

This command will create a production build in ./build.
./build/index.html will be the entry point for the app.

```
$ yarn build # for production
```

_This project was made with Create-React-App, React-Admin and Jest. Feel free to look at their installation and development instructions for more detailed information_

## File structure

```
.
├── README.md
├── package.json
├── public/: **Contains all public static files (index.html, manifest.json, images, etc)**
│   └── ...
├── src
│   ├── Magor/: **Contains React Elements and Componenets of Magor**
│   │   ├── Components/: **Shared Components**
│   │   │   ├── css/
│   │   │   ├── "SomeComponent.js": **A Component File**
│   │   │   └── "SomeComponent.css": **CSS for SomeComponent.js**
│   │   ├── "MainComponentName"/: **A large React component**
│   │   │   ├── css/
│   │   │   ├── index.js: **Main component**
│   │   │   ├── "someHelperFunction.js"
│   │   │   ├── "SomeComponent.js": **Sub component**
│   │   │   └── "SomeComponent.js": **CSS for SomeComponent.js**
│   │   ├── Utils/
│   │   │   └── "util.js": **A utility function**
│   │   ├── index.js: **Main component for current dir**
│   │   ├── "SomeComponent.css": **CSS for SomeComponent.js**
│   │   ├── "SomeComponent.js": **A React Component**
│   │   └── "someHelperFunction.js"
│   ├── Admin/: **Contains React Elements and Componenets of Admin Panel**
│   │   ├── Recording/: **Contains CRUD views for Recordings**
│   │   │   └── ...
│   │   └── User/: **Contains CRUD views for Users**
│   │       └── ...
│   ├── App.js: **Root React component of entire application, handles Routing**
│   ├── authProvider.js: **Provides Authentication**
│   ├── dataProvider.js: **Provides Data**
│   ├── index.js: **Repo entry point**
│   ├── serviceWorker.js: **Service worker**
│   └── setupTests.js: **Work In Progress- testing**
```

## Providers

### List of Providers

-   src/dataProvider -> Provides an interface for fetching data from the API (see React-Admin docs for more info)
-   src/authProvider -> Handles Authentication functions (see React-Admin docs for more info)
-   src/Magor/transcriptProvider -> Provides a standard interface for loading, parsing transcripts
-   src/Magor/translationProvider -> Provides on-demand translations for the AVPlayer

### Caveats

-   dataProvider and authProvider serve both Magor and React-Admin, but are primarily React-Admin functionality
-   transcriptProvider and translationProvider only server Magor (obviously)
