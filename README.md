# Rable
Rable is a library for NodeJS providing an advanced router and templating system.

## Installation
Use the package manager [npm](https://npmjs.com) to install Rable.
```bash
npm install rable.js
```
Afterwards, you can create a Rable instance like the following
```javascript
const Rable = require('rable.js');
const app = new Rable();
```

## Example files
The index.js and the files within /views/ are there as an example and being used in development. In case you want to to try it out, do as follows:
For this example git and npm need to be installed on your system.
```bash
    git clone https://github.com/kearfy/rable.js rablejs-example && cd rablejs-example/lib && npm install && cd ../
    node .
```
The example is now available through port 3001.
You can also take a look at the publicly hosted example over here: https://rable.app.michadevries.nl

## Documentation
See https://rable.app.michadevries.nl/docs/ for further documentation.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
Please make sure to update tests as appropriate.

## License
[MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/)
