/**
  * Parses both the body and the query.
  * @module RouteHandler\DataParser
  * @property {object} query Parsed query that was passed through the url. If none was given, it's just an empty Object.
  * @property {*} query.exampleKey exampleValue
  * @property {object} cookies Parsed cookies that were passed from the client. If none were given, it's just an empty Object.
  * @property {*} cookies.exampleKey exampleValue
  * @property {object} body Parsed body that was passed through the headers. If none was given, it's just an empty Object.
  * @property {*} body.exampleKey exampleValue
  */
const data = (req, res, next) => {
    req.query = {};
    var explodedUrl = req.url.split('?');
    if (explodedUrl.length > 1) {
        req.url = explodedUrl[0];
        explodedUrl[1].split('&').forEach(query => {
            var exploded = query.split('=');
            if (exploded.length < 2) exploded.push('');
            var key = exploded[0];
            var value = exploded[1];
            req.query[key] = value;
        });
    }

    req.cookies = {};
    req.headers && req.headers.cookie && req.headers.cookie.split(';').forEach(function(cookie) {
        var parts = cookie.match(/(.*?)=(.*)$/)
        req.cookies[ parts[1].trim() ] = (parts[2] || '').trim();
    });

    req.body = {};
    req.on('data', chunk => {
        try {
            req.body = JSON.parse(chunk.toString());
        } catch(e) {
            chunk.toString().split('&').forEach(query => {
                var exploded = query.split('=');
                if (exploded.length < 2) exploded.push('');
                var key = exploded[0];
                var value = exploded[1];
                req.body[key] = value;
            });
        }
    });

    req.on('end', () => next(req, res));
}

module.exports = data;
