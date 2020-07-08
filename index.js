const Rable = require(__dirname + '/lib');
const app = new Rable({
	port: 3001,
	assets: 'assets',
	root: 0
});

const secondary = new Rable({
	secondary: true,
	assets: 'assets',
	root: 1
});

app.info.set('name', 'rable.js ' + app.version + ' introduction');
secondary.info.set('name', 'Secondary router');

app.get('/', __dirname + '/views/home.html');
app.get('/other', (req, res) => res.sendFile(__dirname + '/views/other.html'));
app.get('/nonauthorized', (req, res) => res.sendError(403));
app.get('/servererror', (req, res) => res.sendError(500, req.query));

app.static('/assets', __dirname + '/assets');
app.static('/docs', __dirname + '/docs/rable.js', {noTemplate: true});

app.all('/secondary', (req, res) => secondary.handle(req, res));
app.all('/secondary/~', (req, res) => secondary.handle(req, res));

secondary.get('/', (req, res) => res.send('This is the root url of the secondary router.'));
secondary.get('/other', (req, res) => res.send('This is the other page of the secondary router.'));
