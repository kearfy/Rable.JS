const Rable = require(__dirname + '/lib');
const app = new Rable({
	port: 3001
});

var count = 0;

app.setProxy({
	host: 'rable.app.michadevries.nl',
	secure: true
});

app.info.set('name', 'Rable.JS Introduction');

app.get('/', __dirname + '/views/home.html');
app.get('/other', (req, res) => res.sendFile(__dirname + '/views/other.html'));
app.static('/docs', __dirname + '/docs', {noTemplate: true});
