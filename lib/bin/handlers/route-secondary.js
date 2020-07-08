const appendUtils = require('./appendUtils.js');
const fs = require('fs');

module.exports = (req, res, master, routes) => {
    res.setHeader('X-Powered-By', 'Rable');
    if (master.config.allowedSources !== false) res.setHeader('Access-Control-Allow-Origin', master.config.allowedSources);
    req.secondary = master.config.secondary = true;
    req.url = req.initialUrl;
    if (typeof master.config.root == 'number' && master.config.root > 0) req.url = '/' + req.url.split('/').slice(master.config.root + 1).join('/');
    req.proxy = master.config.proxy;
    if (master.config.proxy !== false) {
        req.proxyUrl = req.url;
        req.proxyHost = (req.headers.host.split(':').length > 1 ? req.headers.host.split(':')[0] : req.headers.host);
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
        req.secure = (req.connection.encrypted || req.headers['x-forwarded-proto'] === 'https');
        req.protocol = (req.secure === true ? 'https' : 'http');
        req.fullUrl = req.protocol + '://' + req.host + ':' + req.port + req.url;
    }

    req.params = req.data = {};
    req.noTemplate = false;
    req.info = {};
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
        req.info = route.info;
        if (route.method == 'static') final.static = true;
    }

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
