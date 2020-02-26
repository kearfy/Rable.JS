module.exports = (req, res, next) => {
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
            })
        }        
    });

    req.on('end', () => next(req, res));
}
