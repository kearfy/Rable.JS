process.env.PWD = process.cwd();
const generateUuid = require('uuid'),
      SmartTag = require('./bin/modules/smartTag.js'),
      Template = require('./bin/modules/template.js'),
      Theme = require('./bin/modules/theme.js');

var routes = {};
var middlewares = [];
var urlSpecificMiddlewares = [];
var appInfo = {
    name: 'Rable ' + require('./package.json').version,
    description: 'rable.js is a library for NodeJS providing an advanced router and templating system.',
    keywords: 'Rable, rable.js, templating, javascript, nodejs, router',
    lang: 'en',
    developer: 'rable.js is a project by <a href="https://michadevries.nl" target="_blank">Micha de Vries</a>.'
}

/**
 * Initial Library.
 *
 * @property {string} root The root location of Rable.
 * @property {string} version The current version of Rable.
 * @property {object} config The configuration of Rable.
 * @property {HTTP} server The http server. See NodeJS documentation.
 * @property {object} info Information about the application.
 * @property {Function} info.get Get the value of a property of the application info. (can be overwritten per route)
 * @property {Function} info.set Set the value of a property of the application info. (can be overwritten per route)
 * @property {SmartTag} smarttag An extention module that handles global variables for SmartTag. See SmartTag for more.
 * @property {Template} template The templating engine for rable.js. See Template for more.
 * @property {Theme} theme The theme engine for rable.js. See Theme for more.
 */
class Rable {
    /**
     * Function that is called upon initialization.
     *
     * @param  {object} config configuration applied by user.
     * @param  {number} config.port The port that the application is running on.
     * @param  {object} config.ssl provide ssl certificate here if a secure webserver should be created (by documentation of nodejs.org). if no port was defined it will automatically be updated to 443.
     * @param  {boolean} config.matchByProxy In case of rable running behind a proxy and if set to true, rable will match by url's given to the proxy, not the full url.
     * @param  {string|boolean} config.template The uuid of a template or set to false if no template should be loaded.
     * @param  {string|boolean} config.theme The uuid of a theme of set to false if no theme should be loaded.
     * @param  {string|boolean} config.allowedSources an array with allowed sources or set to false if no header should be passed. can also be updated with Rable.cors().
     * @param  {boolean} config.skipThemeCompatibility Skip the theme compatibility check if set to true.
     * @param  {array} config.directoryIndexes A list of directory indexes contained in an array. Default: index.rbl and index.html
     * @param  {string} config.templatesDatabase The location where you store your templates.
     * @param  {string} config.themesDatabase The location where you store your themes.
     */
    constructor(input) {
        this.root = __dirname;
        this.version = require('./package.json').version;
        this.config = Object.assign(require('./default.json'), (input === undefined ? {} : input));
        this.config.mimes = require('./bin/mimes.json');

        if (input.ssl !== undefined && input.ssl.constructor.name == 'Object') {
            if (input.port == null) this.config.port = 443;
            this.server = require('https').createServer(this.config.ssl, (req, res) => require('./bin/handlers/route.js')(req, res, this, routes)).listen(this.config.port, () => console.log('Application is listening on port ' + this.config.port + '.'));
        } else {
            this.server = require('http').createServer((req, res) => require('./bin/handlers/route.js')(req, res, this, routes)).listen(this.config.port, () => console.log('Application is listening on port ' + this.config.port + '.'));
        }

        this.info = {
            get: key => appInfo[key],
            set: (key, value) => (key === 'developer' ? false : appInfo[key] = value)
        }

        this.smarttag = new SmartTag(this);
        this.template = new Template(this);
        this.theme = new Theme(this);
    }


    /**
     * Provide information about a potential proxy.
     *
     * @param  {object} info Info about the proxy, if empty, the proxy will be cleared.
     * @param  {string} info.root The root of the proxy, example: /rootOfRableApp/
     * @param  {string} info.host The host of the proxy.
     * @param  {number} info.port The port of the proxy. If no value was given but secure is defined, this will automatically be filled in with the defualt ports 80 and 443.
     * @param  {boolean} info.secure States if proxy is https enabled or not. If no value was given but port was defined, this will automatically be filled in based on the port.
     */
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


    /** clear the configured proxy. */
    clearProxy() {
        this.config.proxy = false;
    }


    /**
     * update or set the action of an errorDocument.
     *
     * @param  {number} code            The code of the errorDocument.
     * @param  {function|string} action   Must be a function or a path to a file.
     */
    setErrorDocument(code, action) {
        this.config.errorDocument[code] = action;
    }


    /**
     * Get information about an errorDocument
     *
     * @param  {number} code        The code of the errorDocument.
     * @returns {function|string}     Returns a function or the path to a file.
     */
    getErrorDocument(code) {
        if (this.config.errorDocument[code] !== undefined && this.config.errorDocument[code] !== 'DefaultDocument' && this.config.errorDocument[code] !== false && this.config.errorDocument[code] !== null) {
            return this.config.errorDocument[code];
        } else {
            return __dirname + '/views/ErrorDocument' + code + '.rbl';
        }
    }


    /**
     * register or update mime types.
     *
     * @param  {string} extention   The file extention.
     * @param  {string} type        The actual mime type.
     */
    registerMimeType(extention, type) {
        if (this.config.mimes[extention] === undefined) this.config.mimes[extention] = type;
    }


    /**
     * Get the value of a mime type
     *
     * @param  {string} extention   The file extention.
     * @returns {string|null}       return null is undefined.
     */
    getMimeType(extention) {
        return (this.config.mimes[extention] === undefined ? null : this.config.mimes[extention]);
    }

    /**
     * Register a route independent of the method.
     *
     * @param  {string} path                The path / URL of the route.
     * @param  {string|function} action     Either the path to a file or the function that handles the route.
     * @param  {object} data                variables passed to Smart-tag.
     * @param  {boolean} data.noTemplate    A loophole to data where you can specify to not apply the template (also including the theme)
     * @param  {boolean} data.info          Here properties can be defined that overwrite the global application information.
     * @param  {boolean} data.data          If either the property noTemplate, info or data need to be used, then place all of the route's SmartTag properties in here. this will overwrite any property defined directly in data.
     * @returns {string}                    The uuid of the route, can later also be obtained by mathing a url.
     */
    all(path, action, data = {}) {
        return this.registerRoute({
            method: 'ALL',
            path: path,
            action: action,
            data: data
        });
    }

    /**
     * Register a route with the GET method.
     *
     * @param  {string} path                The path / URL of the route.
     * @param  {string|function} action     Either the path to a file or the function that handles the route.
     * @param  {object} data                variables passed to Smart-tag.
     * @param  {boolean} data.noTemplate     A loophole to data where you can specify to not apply the template (also including the theme)
     * @param  {boolean} data.info          Here properties can be defined that overwrite the global application information.
     * @param  {boolean} data.data          If either the property noTemplate, info or data need to be used, then place all of the route's SmartTag properties in here. this will overwrite any property defined directly in data.
     * @returns {string}                    The uuid of the route, can later also be obtained by mathing a url.
     */
    get(path, action, data = {}) {
        return this.registerRoute({
            method: 'GET',
            path: path,
            action: action,
            data: data
        });
    }

    /**
     * Register a route with the POST method.
     *
     * @param  {string} path                The path / URL of the route.
     * @param  {string|function} action     Either the path to a file or the function that handles the route.
     * @param  {object} data                variables passed to Smart-tag.
     * @param  {boolean} data.noTemplate     A loophole to data where you can specify to not apply the template (also including the theme)
     * @param  {boolean} data.info          Here properties can be defined that overwrite the global application information.
     * @param  {boolean} data.data          If either the property noTemplate, info or data need to be used, then place all of the route's SmartTag properties in here. this will overwrite any property defined directly in data.
     * @returns {string}                    The uuid of the route, can later also be obtained by mathing a url.
     */
    post(path, action, data = {}) {
        return this.registerRoute({
            method: 'POST',
            path: path,
            action: action,
            data: data
        });
    }

    /**
     * Register a static route listening for every method.
     *
     * @param  {string} path                The initial path / url of the route.
     * @param  {string} action              Path to the folder containing the static content.
     * @param  {object} data                variables passed to Smart-tag.
     * @param  {boolean} data.noTemplate    A loophole to data where you can specify to not apply the template (also including the theme)
     * @param  {boolean} data.info          Here properties can be defined that overwrite the global application information.
     * @param  {boolean} data.data          If either the property noTemplate, info or data need to be used, then place all of the route's SmartTag properties in here. this will overwrite any property defined directly in data.
     * @returns {string}                    The uuid of the route, can later also be obtained by mathing a url.
     */
    static(path, action, data = {}) {
        return this.registerRoute({
            method: 'static',
            path: path,
            action: action,
            data: data
        });
    }


    /**
     * Manually register a route with for an example, a method that has not yet been implemented in Rable.js (please open an issue or do a pull request if this is the case!)
     *
     * @param  {object} input                       Details about the route.
     * @param  {string} input.method                The method of the route.
     * @param  {string} input.path                  The path / url of the route.
     * @param  {string|function} input.action       The action of the route which can either be a function making use of (request, response), a filepath or in case of a static route, the path to a directory.
     * @param  {object} input.data                  Variables passed to Smart-tag.
     * @param  {boolean} input.data.noTemplate      A loophole to data where you can specify to not apply the template (also including the theme)
     * @param  {boolean} input.data.info            Here properties can be defined that overwrite the global application information.
     * @param  {boolean} input.data.data            If either the property noTemplate, info or data need to be used, then place all of the route's SmartTag properties in here. this will overwrite any property defined directly in data.
     * @returns {string}                            The uuid of the route, can later also be obtained by matching a url.
     */
    registerRoute(input) {
        class Route {
            constructor(input) {
                this.method = input.method;
                this.path = input.path;
                this.action = input.action;
                this.uuid = input.uuid;
                this.data = input.data;

                if (input.method == 'static' && typeof input.action != 'string') {
                    throw 'The action of a static route must be a path to a directory';
                }

                if (input.noTemplate === undefined) {
                    if (this.data.noTemplate === undefined || this.data.noTemplate === false) {
                        this.noTemplate = false;
                    } else {
                        this.noTemplate = true;
                    }
                } else {
                    this.noTemplate = input.noTemplate;
                }

                if (input.info === undefined) {
                    if (this.data.info === undefined || this.data.info.constructor.name !== 'Object') {
                        this.info = {};
                    } else {
                        this.info = this.data.info;
                    }
                } else {
                    this.info = input.info;
                }

                if (this.data.data === undefined || this.data.data.constructor.name !== 'Object') {
                    if (this.data.noTemplate !== undefined) delete this.data.noTemplate;
                    if (this.data.info !== undefined) delete this.data.info;
                } else {
                    this.data = this.data.data;
                }
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


    /**
     * Register a middleware.
     *
     * @param  {string} path            NOT REQUIRED: In case it is defined, the middleware will only be triggered if the path matches the request.
     * @param  {function} middleware    A function that will be called before calling the final action of the route. No paramenters need to be defined. req, res and next() will automatically be attached. It is required for next() to be called, instead to properly prevent the final action from being executed, updated res.finished to true.
     */
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


    /**
     * obtain a list of middlewares (that match a url).
     *
     * @param  {string} url     NOT REQUIRED: match the middlewares by a url.
     * @returns {array}         returns a list of middlewares contained in an array.
     */
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


    /**
     * Obtain a route by their uuid.
     *
     * @param  {string} uuid    The uuid assigned to the route.
     * @returns {Route}         A route class will be returned.
     */
    obtainRoute(uuid) {
        return routes[uuid];
    }


    /**
     * Match a route by url (and method).
     *
     * @param  {string} url         The url of the route you are trying to match.
     * @param  {string} method      NOT REQUIRED: The method of the route.
     * @returns {object|null}       Returns the uuid of the route and parameters if filled in. null if no route matched.
     */
    matchRoute(url, method = false) {
        var finalRoute = null;
        Object.keys(routes).forEach(route => {
            if (finalRoute === null) {
                route = routes[route];
                if (!method ? true : (route.method.toLowerCase() == method.toLowerCase() || route.method.toLowerCase() == 'static' || route.method.toLowerCase() == 'all')) {
                    var result = this.matchUrl(route.path, url, route.method.toLowerCase() == 'static');
                    if (result.match === true) {
                        finalRoute = {
                            uuid: route.uuid,
                            params: result.params
                        }

                        if (route.method == 'static') finalRoute.target = result.target;
                    }
                }
            }
        });

        return finalRoute;
    }


    /**
     * See of two url's match.
     *
     * @param  {string} original        The original url (where parameter names are defined with :parameter).
     * @param  {string} given           The given url (where parameters are filled in.)
     * @param  {boolean} staticRoute    must be true if the original url is a static route.
     * @returns {object}                states if url's match, and if so, the values of the parameters. If it is a static route, then the follow up target will also be defined.
     */
    matchUrl(original, given, staticRoute = false) {
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
            explodedOriginal.forEach((part, index) => {
                if (explodedGiven[index] !== part) {
                    if (explodedOriginal[index].charAt(0) === ':') {
                        var param = explodedOriginal[index].substring(1);
                        params[param] = part;
                    } else if (part == '~' && index == explodedGiven.length - 1) {
                    } else {
                        match = false;
                    }
                }
            });
        } else if (!(explodedGiven.length < explodedOriginal.length)) {
            if (staticRoute) {
                var target = explodedGiven.join('/');
                explodedOriginal.forEach((part, index) => {
                    if (explodedGiven[index] !== part) {
                        match = false;
                    } else {
                        target = explodedGiven.slice(index + 1).join('/');
                    }
                });
            } else if (explodedOriginal[explodedOriginal.length - 1] == '~') {
                explodedOriginal.forEach((part, index) => {
                    if (explodedGiven[index] !== part && part !== '~') {
                        match = false;
                    }
                });
            } else {
                match = false;
            }
        } else {
            match = false;
        }

        var result = {match:match};
        if (match) result.params = params;
        if (match && staticRoute) result.target = target;
        return result;
    }


    /**
     * Set allowed sources.
     *
     * @param  {string} value allowed sources, example: 'rable.app.michadevries.nl, michadevries.nl, 1.1.1.1, 8.8.8.8'
     */
    cors(value) {
        this.config.allowedSources = value;
    }
}

module.exports = Rable;
