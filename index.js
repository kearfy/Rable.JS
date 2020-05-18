const Rable = require(__dirname + '/lib');
const app = new Rable({
	port: 3001,
	assets: 'assets'
});

var count = 0;

app.info.set('name', 'rable.js ' + app.version + ' introduction');

app.get('/', __dirname + '/views/home.html');
app.get('/other', (req, res) => res.sendFile(__dirname + '/views/other.html'));
app.get('/nonauthorized', (req, res) => res.sendError(403));
app.get('/servererror', (req, res) => res.sendError(500, req.query));

app.static('/assets', __dirname + '/assets');
app.static('/docs', __dirname + '/docs/rable.js', {noTemplate: true});
