"use strict";
const http = require('http'),
      HttpHashRouter = require('http-hash-router'),
      catNames = require('cat-names'),
      concat = require('concat-stream'),
      pumpify = require('pumpify'),
      corsify = require('corsify'),
      debug = require('debug')('cat-lobby'),
      limitStream = require('./limit-stream.js');

module.exports = function create (lobbyOpts) {
    if (!lobbyOpts) {lobbyOpts = {};}
    let state = {pings: {},pongs: {},timeouts: []};
    let utils = {makeName: makeName,rnd: rnd,uploadStream: uploadStream};
    const router = HttpHashRouter();

    function rnd () {
        return catNames.random().toLowerCase().replace(/\s/g, '-');
    }

    function createServer (router) {
        const cors = corsify({
            'Access-Control-Allow-Methods': 'POST, GET'
        });
        const server = http.createServer(handler);

        function handler (req, res) {
            debug(req.url, 'request/response start');
            // https重定向
            if (req.headers['x-forwarded-proto'] === 'http') {
                const httpsURL = 'https://' + req.headers.host + req.url;
                debug('https redirect', httpsURL);
                res.writeHead(302, {'Location': httpsURL });
                res.end();
                return;
            }

            req.on('end', function logReqEnd () {
                debug(req.url, 'request end');
            });

            res.on('end', function logResEnd () {
                debug(req.url, 'response end');
            });

            cors(route)(req, res);

            function route (req, res) {
                router(req, res, {}, onError);
            }

            function onError (err) {
                if (err) {
                    debug('error', {path: req.url, message: err.message});
                    res.statusCode = err.statusCode || 500;
                    res.end(JSON.stringify({name: err.message}));
                }
            }
        }

        server.on('close', function closed () {
            // 防止进程挂掉
            state.timeouts.forEach(function each (t) {
                clearTimeout(t);
            });
        });
        return server;
    }
    const v1API = require('./v1.js')(state, utils);
        function uploadStream (cb) {
        const limiter = limitStream(1024 * 5); // 5kb max
        const concatter = concat(function concatted (buff) {
            cb(buff);
        });
        return pumpify(limiter, concatter);
    }
    function makeName () {
        var n = [utils.rnd(), utils.rnd(), utils.rnd()].join('-');
        if (state.pings[n]) {return utils.makeName();}
        return n;
    }
    router.set('/v1', v1API.create);
    router.set('/v1/:name/ping', v1API.ping);
    router.set('/v1/:name/pong', v1API.pong);
    router.set('/v1/:name/pings', v1API.pings);
    router.set('/v1/:name/pongs', v1API.pongs);
    return createServer(router);
};
