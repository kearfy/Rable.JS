const appendUtils = require('./appendUtils.js');

module.exports = (req, res, master, routes) => {
    res.setHeader('X-Powered-By', 'Rable');
    if (master.config.allowedSources !== false) res.setHeader('Access-Control-Allow-Origin', master.config.allowedSources);
    require('./data.js')(req, res, (req, res) => {
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
                status: 404
            }
        } else {
            var route = master.obtainRoute(matchedRoute.uuid),
                final = {
                    action: route.action,
                    status: 200
                }

            req.data = route.data;
            req.params = matchedRoute.params;
            req.noTemplate = route.noTemplate;
        }

        appendUtils(req, res, master, (req, res) => {
            var handled = handleMiddlewares(req, res, master.middlewares());
            handled = handleMiddlewares(handled.req, handled.res, master.middlewares(url));

            if (!res.finished) {
                if (final.action.constructor.name === 'String') {
                    res.sendFile(final.action, {status:final.status});
                } else {
                    final.action(handled.req, handled.res);
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
