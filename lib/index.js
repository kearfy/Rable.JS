const http = require('http'),
      https = require('https'),
      fs = require('fs'),
      generateUuid = require('uuid'),
      SmartTag = require('./bin/modules/smartTag.js'),
      Template = require('./bin/modules/template.js'),
      Theme = require('./bin/modules/theme.js');

var routes = {};
var middlewares = [];
var urlSpecificMiddlewares = [];
var appInfo = {
    name: 'Rable ' + require('./package.json').version,
    description: 'Rable is a library for NodeJS providing an advanced router and templating system.',
    keywords: 'Rable, templating, javascript, nodejs, router',
    lang: 'en',
    developer: 'Rable is a project by <a href="https://michadevries.nl" target="_blank">Micha de Vries</a>.'
}

module.exports = class Rable {
    constructor(input) {
        this.root = __dirname;
        this.version = require('./package.json').version;
        this.config = Object.assign(require('./default.json'), (input === undefined ? {} : input));
        this.config.mimes = require('./bin/mimes.json');
        this.server = http.createServer((req, res) => require('./bin/handlers/route.js')(req, res, this, routes)).listen(this.config.port, () => console.log('Application is listening on port ' + this.config.port + '.'));
        this.info = {
            get: key => appInfo[key],
            set: (key, value) => (key === 'developer' ? false : appInfo[key] = value)
        }

        this.smarttag = new SmartTag(this);
        this.template = new Template(this);
        this.theme = new Theme(this);
    }

    setProxy(input) {
        if (input === null || input === false) {
            this.config.proxy = false;
        } else {
            this.config.proxy = Object.assign({
                root: '/',
                host: 'localhost',
                port: 80,
                secure: false
            }, input);

            this.config.proxy.root = this.config.proxy.root.replace(/\\/g, "/");
            this.config.proxy.root = (this.config.proxy.root.charAt(0) == '/' ? this.config.proxy.root : '/' + this.config.proxy.root);
            this.config.proxy.root = (this.config.proxy.root.charAt(this.config.proxy.root.length - 1) == '/' ? this.config.proxy.root : this.config.proxy.root + '/');

            if (input.secure === undefined && input.port == 443) this.config.proxy.secure = true;
            if (input.secure === true && input.port == undefined) this.config.proxy.port = 443;
        }
    }

    clearProxy() {
        this.config.proxy = false;
    }

    setErrorDocument(code, action) {
        this.config.errorDocument[code] = action;
    }

    getErrorDocument(code) {
        if (this.config.errorDocument[code] !== undefined && this.config.errorDocument[code] !== 'DefaultDocument' && this.config.errorDocument[code] !== false && this.config.errorDocument[code] !== null) {
            return this.config.errorDocument[code];
        } else {
            return __dirname + '/views/ErrorDocument' + code + '.html';
        }
    }

    registerMimeType(extention, type) {
        if (this.config.mimes[extention] === undefined) this.config.mimes[extention] = type;
    }

    getMimeType(extention) {
        return (this.config.mimes[extention] === undefined ? null : this.config.mimes[extention]);
    }

    get(path, action, data = {}) {
        this.registerRoute({
            method: 'GET',
            path: path,
            action: action,
            data: data
        });
    }

    post(path, action, data = {}) {
        this.registerRoute({
            method: 'POST',
            path: path,
            action: action,
            data: data
        });
    }

    registerRoute(input) {
        class Route {
            constructor(input) {
                this.method = input.method;
                this.path = input.path;
                this.action = input.action;
                this.uuid = input.uuid;
                this.data = input.data;

                if (input.noTemplate === undefined) {
                    if (this.data.noTemplate === undefined || this.data.noTemplate === false) {
                        this.noTemplate = false;
                    } else {
                        this.noTemplate = true;
                    }
                } else {
                    this.noTemplate = input.noTemplate;
                }

                if (this.data.noTemplate !== undefined) delete this.data.noTemplate;
            }

            purge() {
                delete routes[uuid];
            }
        }

        var uuid = generateUuid();
        var details = Object.assign({
            method: 'GET',
            path: null,
            action: this.config.defaultIndex,
            data: {}
        }, input);

        routes[uuid] = new Route(Object.assign(details, {uuid:uuid}));
        return routes[uuid];
    }

    use(input1, input2) {
        if (input2 === undefined) {
            middlewares.push(input1);
        } else {
            urlSpecificMiddlewares.push({
                url: input1,
                middleware: input2
            })
        }
    }

    middlewares(url = false) {
        if (url !== false) {
            var list = [];
            urlSpecificMiddlewares.forEach(middleware => {
                if (this.matchUrl(middleware.url, url).match === true) list.push(middleware.middleware);
            });

            return list;
        } else {
            return middlewares;
        }
    }

    obtainRoute(uuid) {
        return routes[uuid];
    }

    matchRoute(url, method = false) {
        var finalRoute = null;
        Object.keys(routes).forEach(route => {
            if (finalRoute === null) {
                route = routes[route];
                if (!method ? true : route.method == method) {
                    var result = this.matchUrl(route.path, url);
                    if (result.match === true) finalRoute = {
                        uuid: route.uuid,
                        params: result.params
                    }
                }
            }
        });

        return finalRoute;
    }

    matchUrl(original, given) {
        const filter = url => {
            url = url.split('?')[0];
            url = url.split('#')[0];
            url = url.replace(/\\/g, "/");
            url = (url.charAt(0) == '/' ? url : '/' + url);
            url = (url.charAt(url.length - 1) == '/' ? url.slice(0, -1) : url);
            return url;
        }

        var filteredOriginal = filter(original),
            filteredGiven = filter(given),
            explodedOriginal = filteredOriginal.split('/'),
            explodedGiven = filteredGiven.split('/'),
            match = true,
            params = {};

        if (explodedGiven.length === explodedOriginal.length) {
            explodedGiven.forEach((part, index) => {
                if (explodedOriginal[index] !== part) {
                    if (explodedOriginal[index].charAt(0) === ':') {
                        var param = explodedOriginal[index].substring(1);
                        params[param] = part;
                    } else {
                        match = false;
                    }
                }
            });
        } else {
            match = false;
        }

        var result = {match:match};
        if (match) result.params = params;
        return result;
    }

    cors(value) {
        this.config.allowedSources = value;
    }
}
