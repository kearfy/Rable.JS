const fs = require('fs');

module.exports = (req, res, master, callback) => {
    res.sendFile = (path, input) => {
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

        fs.readFile(path, (err, content) => {
            if (err) {
                res.sendError(404);
            } else {
                res.writeHead(config.status, config.headers);
                res.write((config.headers['Content-Type'] == 'text/html' && config.process ? require('./processPage.js')(req, res, master, content.toString()) : content));
                res.end();
            }
        });
    };

    res.send = (content, input) => {
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
            res.end();
        } else {
            res.sendError(500, {
                error: 'invalid_content_type'
            })
        }
    }

    res.json = (data, input) => {
        var config = Object.assign({
            status: 200,
            headers: {'Content-Type': 'application/json'}
        });

        if (['Object', 'Array'].includes(data.constructor.name)) {
            res.writeHead(config.status, config.headers);
            res.write(JSON.stringify(data));
            res.end();
        } else {
            res.sendError(500, {
                error: 'invalid_content_type'
            })
        }
    }

    res.sendError = code => {
        var edoc = master.getErrorDocument(code);
        if (edoc.constructor.name === 'String') {
            fs.readFile(edoc, (err, content) => {
                if (err) {
                    res.writeHead(code);
                    res.write('Error ' + code);
                    res.end();
                } else {
                    res.writeHead(code, {'Loaded-Template': master.template.build('uuid')});
                    res.write(require('./processPage.js')(req, res, master, content.toString()));
                    res.end();
                }
            });
        } else {
            edoc(req, res);
        }
    }

    res.cors = (value = '*') => res.setHeader('Access-Control-Allow-Origin', value);
    callback(req, res);
}
