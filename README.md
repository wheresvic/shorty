# shorty

A simple self-hostable private url shortener using Node.js &amp; Nedb (a file-based Mongodb API compatible db).

The idea behind shorty was to have a simple url shortening service that could be hosted on a cheap VPS with less than 1Gb RAM. Therefore, shorty uses only file-based storage to keep dependencies to a minimum.

Currently, shorty comes with only set of credentials and is meant to be a _private_ url shortening service. If you are looking for multiple users and the ability to allow self-registration, check out kutt.it.

Before starting shorty, make sure that you copy `.env.dist` to `.env` and fill in the configuration as desired.

## tech stack

Shorty is fully server-side rendered web application powered by Node.js. The following is a selection of the modules in use:

- express webserver
- session handling via session-file-store, a simple file-based session storage
- passport authentication
- moustache templating

## development

```bash
$ cp .env.dist .env
$ npm install
$ npm run sass:build
$ npm i -g nodemon
$ npm run sass:watch
$ npm run server:stat:dev
```

## production

```bash
$ cp .env.dist .env
$ npm install
$ npm run sass:build
$ npm run server:start
```

## release

```bash
$ npm run release-it
```
