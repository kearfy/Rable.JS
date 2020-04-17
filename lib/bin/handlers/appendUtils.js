const fs = require('fs');

/**
  * Utils that will ba attached to the request and response objects given the the route handler.
  * @module RouteHandler\Utils
  */
const appendUtils = (req, res, master, callback) => {

    const Response = {
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
                    headers: {'Content-Type': 'text/html'},
                    process: true,
                    data: {}
                }, input);

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
                    headers: {'Content-Type': 'application/json'}
                });

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
        sendError: async code => {
            if (!res.finished) {
                var edoc = master.getErrorDocument(code);
                if (edoc.constructor.name === 'String') {
                    await fs.readFile(edoc, async (err, content) => {
                        if (err) {
                            res.writeHead(code);
                            res.write('Error ' + code);
                            await res.end();
                        } else {
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
                'Location': url
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
