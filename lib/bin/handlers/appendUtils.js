const fs = require('fs');

/**
  * Utils that will ba attached to the request and response objects given the the route handler.
  * @module RouteHandler\Utils
  */
const appendUtils = (req, res, master, callback) => {
    res.newCookies = [];
    const Response = {

        /**
         * Send a cookie to the client.
         * @method setCookie
         * @async
         *
         * @param {string} name Name of the cookie.
         * @param {string} value Value of the cookie.
         * @param {object} config NOT REQUIRED: Further configuration for the cookie. (the names of the subitems are case sensitive!)
         * @param {number} config.Expires The Expiration of the cookie (timestamp).
         * @param {number} config.MaxAge number of seconds before the cookie expires. MaxAge will precede Expires!
         * @param {string} config.Domain On which (sub)domain the cookie should be applied.
         * @param {string} config.Path The root Path on which the cookie will be applied.
         * @param {boolean} config.Secure states if the cookie is secure which results in the cookie only being sent over https.
         * @param {boolean} config.HttpOnly states if the cookie is httponly which forbids javascript from accessing the cookie.
         * @param {string} config.SameSite the policy for when a cookie is accessed from outside the current website. [Strict, Lax or None]
         */
        setCookie: (name, value, input = {}) => {
            var cookie = Object.assign({
                Expires: null,
                MaxAge: null,
                Domain: null,
                Path: null,
                Secure: false,
                HttpOnly: false,
                SameSite: null
            }, input);

            var cookieString = [name, value].join('=') + ';';
            Object.keys(cookie).forEach(key => {
                var val = cookie[key];
                if (val != null) {
                    if (key === 'Secure' || key === 'HttpOnly') {
                        if (val === true) cookieString += ' ' + key + ';';
                    } else {
                        cookieString += ' ' + ([(key === 'MaxAge' ? 'Max-Age' : key), val]).join('=') + ';';
                    }
                }
            });

            res.newCookies.push(cookieString);
        },

        /**
         * Read the contents of a file and send it to the client.
         * @method sendFile
         * @async
         *
         * @param {string} path The path of the file.
         * @param {object} config NOT REQUIRED: Further configuration of the response.
         * @param {number} config.status The status of the response.
         * @param {object} config.headers Set specific headers for the response.
         * @param {boolean} config.process Apply a loaded template yes or no.
         * @param {object} config.data Variables that will be passed on to Smart-tag
         */
        sendFile: async (path, input) => {
            if (!res.finished) {
                var config = Object.assign({
                    status: 200,
                    headers: {},
                    process: true,
                    data: {}
                }, input);

                config.headers['Set-Cookie'] = res.newCookies;
                if (master.template.build() !== null && !req.noTemplate) config.headers['Loaded-Template'] = master.template.build('uuid');
                if (master.theme.build() !== null) config.headers['Loaded-Theme'] = master.theme.build('uuid');
                req.data = Object.assign({}, req.data, config.data);
                if (config.headers['Content-Type'] === undefined) {
                    var explodedPath = path.split('.');
                    if (explodedPath.length < 2) {
                        config.headers['Content-Type'] = 'text/plain';
                    } else {
                        config.headers['Content-Type'] = master.getMimeType(explodedPath[explodedPath.length - 1]);
                        if (config.headers['Content-Type'] === null) config.headers['Content-Type'] = 'text/plain';
                    }
                }

                await fs.readFile(path, async (err, content) => {
                    if (err) {
                        await res.sendError(404);
                    } else {
                        res.writeHead(config.status, config.headers);
                        res.write((config.headers['Content-Type'] == 'text/html' && config.process ? require('./processPage.js')(req, res, master, content.toString()) : content));
                        await res.end();
                    }
                });
            } else {
                return false;
            }
        },


        /**
         * Send content to the client.
         * @method send
         * @async
         *
         * @param {string} content The content that needs to be send to the client.
         * @param {object} config NOT REQUIRED: Further configuration of the response.
         * @param {number} config.status The status of the response.
         * @param {object} config.headers Set specific headers for the response.
         * @param {boolean} config.process Apply a loaded template yes or no.
         * @param {object} config.data Variables that will be passed on to Smart-tag
         */
        send: async (content, input) => {
            if (!res.finished) {
                var config = Object.assign({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/html'
                    },
                    process: true,
                    data: {}
                }, input);

                config.headers['Set-Cookie'] = res.newCookies;
                if (master.template.build !== null && !req.noTemplate) config.headers['Loaded-Template'] = master.template.build('uuid');
                req.data = Object.assign({}, req.data, config.data);
                if (['Number', 'String'].includes(content.constructor.name)) {
                    res.writeHead(config.status, config.headers);
                    res.write((config.headers['Content-Type'] == 'text/html' && config.process ? require('./processPage.js')(req, res, master, content) : content));
                    await res.end();
                } else {
                    await res.sendError(500, {
                        error: 'invalid_content_type'
                    })
                }
            } else {
                return false;
            }
        },

        /**
         * Send a json object to the client.
         * @method json
         * @async
         *
         * @param {string} data Object that needs to be send to the client. Will automatically be converted to json.
         * @param {object} config NOT REQUIRED: Further configuration of the response.
         * @param {number} config.status The status of the response.
         * @param {object} config.headers Set specific headers for the response.
         */
        json: async (data, input) => {
            if (!res.finished) {
                var config = Object.assign({
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                config.headers['Set-Cookie'] = res.newCookies;
                if (['Object', 'Array'].includes(data.constructor.name)) {
                    res.writeHead(config.status, config.headers);
                    res.write(JSON.stringify(data));
                    await res.end();
                } else {
                    await res.sendError(500, {
                        error: 'invalid_content_type'
                    })
                }
            } else {
                return false;
            }
        },

        /**
         * Send an error page to the client.
         * @method sendError
         * @async
         *
         * @param {number} content The error code.
         */
        sendError: async (code, data) => {
            if (!res.finished) {
                var edoc = master.getErrorDocument(code);
                if (edoc.constructor.name === 'String') {
                    await fs.readFile(edoc, async (err, content) => {
                        if (err) {
                            res.writeHead(code);
                            res.write('Error ' + code);
                            await res.end();
                        } else {
                            req.noTemplate = false;
                            req.data = Object.assign({
                                error: 'not_provided',
                                errorMessage: 'not_provided'
                            }, data);

                            res.writeHead(code, {'Loaded-Template': master.template.build('uuid')});
                            res.write(require('./processPage.js')(req, res, master, content.toString()));
                            await res.end();
                        }
                    });
                } else {
                    edoc(req, res);
                }
            } else {
                return false;
            }
        },

        /**
         * Redirect the client to a different location.
         * @method redirect
         * @async
         *
         * @param {string} url The follow-up URL.
         * @param {boolean} permanent State if the redirect is permanent. default = false.
         */
        redirect: async (url, permanent = false) => {
            res.writeHead(permanent ? 301 : 302, {
                'Location': url,
                'Set-Cookie': res.newCookies
            });

            await res.end();
        },

        /**
         * Apply a different cors policy than globally applied.
         * @method cors
         *
         * @param {string} value Allowed sources. Default = * (uppon called, otherwise the global configuration is applied).
         */
        cors: (value = '*') => res.setHeader('Access-Control-Allow-Origin', value)

    }

    Object.keys(Response).forEach(key => res[key] = Response[key]);
    callback(req, res);
}

module.exports = appendUtils;
