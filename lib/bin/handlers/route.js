const appendUtils = require('./appendUtils.js');
const fs = require('fs');

/**
  * Parser url, hostname, etc and picks the right route.
  * @module RouteHandler
  *
  * @property {object} Request Contains all the information about the request. See NodeJS documentation.
  * @property {string} Request.url The requested url.
  * @property {string} Request.host The host where to the request was made.
  * @property {number} Request.port The port where to the request was made.
  * @property {boolean} Request.secure states if the request was made over ssl.
  * @property {string} Request.fullUrl The full url of the request.
  * @property {object} Request.data The data provided to Smarttag.
  * @property {object} Request.params Parameters obtained from the url if defined.
  * @property {boolean} Request.noTemplate States if a configured template should be loaded yes or no.
  *
  * @property {object} Request.proxy Only if a proxy was configured
  * @property {string} Request.proxy.root The root of the proxy, example: /rootOfRableApp/
  * @property {string} Request.proxy.host The host of the proxy.
  * @property {number} Request.proxy.port The port of the proxy.
  * @property {boolean} Request.proxy.secure States if proxy is https enabled or not.
  * @property {string} Request.proxyUrl The requested proxy url.
  * @property {string} Request.proxyHost The proxy host where to the request was made.
  * @property {number} Request.proxyPort The proxy port where to the request was made.
  * @property {boolean} Request.proxySecure states if the proxy request was made over ssl.
  * @property {string} Request.fullProxyUrl The full proxy url of the request.
  *
  * @property {object} Response Contains all the information that will be returned to the client as well as some utilities. See NodeJS documentation.
  * @property {object} Response.body Data passed through the body. See RouteHandler\DataParser for more.
  * @property {object} Response.query Data passed through the url. See RouteHandler\DataParser for more.
  * @property {Function} Response.sendFile Send the contents of a file to the client. See RouteHandler\Utils for more.
  * @property {Function} Response.send Send content to the client. See RouteHandler\Utils for more.
  * @property {Function} Response.json Send a json object to the client. See RouteHandler\Utils for more.
  * @property {Function} Response.sendError Send an error page to the client. See RouteHandler\Utils for more.
  * @property {Function} Response.redirect Redirect the client to a different location. See RouteHandler\Utils for more.
  * @property {Function} Response.cors Apply a different cors policy than globally applied. See RouteHandler\Utils for more.
  */

module.exports = (req, res, master, routes) => {
    res.setHeader('X-Powered-By', 'Rable');
    if (master.config.allowedSources !== false) res.setHeader('Access-Control-Allow-Origin', master.config.allowedSources);
    require('./data.js')(req, res, (req, res) => {
        req.initialUrl = req.url;
        req.proxy = master.config.proxy;
        if (master.config.proxy !== false) {
            req.proxyUrl = req.url;
            req.proxyHost = (req.headers.host.split(':').length > 1 ? req.headers.host.split(':')[0] : req.headers.host);
            req.proxyPort = master.server.address().port;
            req.proxySecure = (req.connection.encrypted || req.headers['x-forwarded-proto'] === 'https');
            req.proxyProtocol = (req.proxySecure === true ? 'https' : 'http');
            req.fullProxyUrl = req.proxyProtocol + '://' + req.proxyHost + ':' + req.proxyPort + req.proxyUrl;

            req.url = master.config.proxy.root.slice(0, -1) + req.url;
            req.host = master.config.proxy.host;
            req.port = master.config.proxy.port;
            req.secure = master.config.proxy.secure;
            req.protocol = (master.config.proxy.secure === true ? 'https' : 'http');
            req.fullUrl = req.protocol + '://' + req.host + ':' + req.port + req.url;
        } else {
            req.url = req.url;
            req.host = (req.headers.host.split(':').length > 1 ? req.headers.host.split(':')[0] : req.headers.host);
            req.port = master.server.address().port;
            req.secure = (req.connection.encrypted || req.headers['x-forwarded-proto'] === 'https');
            req.protocol = (req.secure === true ? 'https' : 'http');
            req.fullUrl = req.protocol + '://' + req.host + ':' + req.port + req.url;
        }

        req.params = req.data = {};
        req.noTemplate = false;
        var url = (master.config.proxy !== false && master.config.matchByProxy ? req.proxyUrl : req.url),
            matchedRoute = master.matchRoute(url, req.method);

        if (matchedRoute === null) {
            var final = {
                action: master.getErrorDocument(404),
                status: 404,
                static: false
            }
        } else {
            var route = master.obtainRoute(matchedRoute.uuid),
                final = {
                    action: route.action,
                    status: 200,
                    static: false
                }

            req.data = route.data;
            req.params = matchedRoute.params;
            req.noTemplate = route.noTemplate;
            if (route.method == 'static') final.static = true;
        }

        console.log(req.method.toUpperCase() + ': ' + url + '');
        appendUtils(req, res, master, (req, res) => {
            var handled = handleMiddlewares(req, res, master.middlewares());
            handled = handleMiddlewares(handled.req, handled.res, master.middlewares(url));
            if (final.static) {
                var staticRoot = route.action.replace(/\\/g, "/");
                    staticRoot = (staticRoot.charAt(staticRoot.length - 1) == '/' ? staticRoot : staticRoot + '/');
                var target = (matchedRoute.target === undefined ? '' : matchedRoute.target);
                var finalTarget = staticRoot + target;

                fs.stat(finalTarget, (e, stat) => {
                    if (e) return res.sendError(404);
                    if (stat.isDirectory()) {
                        finalTarget = (finalTarget.charAt(finalTarget.length - 1) == '/' ? finalTarget : finalTarget + '/');
                        var directoryIndex = null;
                        for (var i = 0; i < master.config.directoryIndexes.length; i++) {
                            var item = master.config.directoryIndexes[i];
                            if (directoryIndex == null) {
                                try {
                                    var innerstat = fs.statSync(finalTarget + item);
                                    if (!innerstat.isDirectory()) directoryIndex = item;
                                } catch(e) {}
                            }
                        }

                        if (directoryIndex == null) {
                            res.sendError(403);
                        } else {
                            if (req.initialUrl.slice(-1) !== '/') {
                                res.redirect(req.initialUrl + '/');
                            } else {
                                res.sendFile(finalTarget + directoryIndex);
                            }
                        }
                    } else {
                        res.sendFile(finalTarget);
                    }
                });
            } else {
                if (final.action.constructor.name === 'String') {
                    res.sendFile(final.action, {status:final.status});
                } else {
                    this.req = handled.req;
                    this.res = handled.res;
                    final.action(req, res);
                }
            }
        });
    });
}

function handleMiddlewares(givenReq, givenRes, middlewares) {
    middlewares.forEach(middleware => middleware.call(req = givenReq, res = givenRes, next = () => {
        givenReq = req;
        givenRes = res;
    }));

    return {
        req: givenReq,
        res: givenRes
    };
}
