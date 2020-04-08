# Rable
Rable is a library for NodeJS providing an advanced router and templating system.

## Installation

Use the package manager [npm](https://npmjs.com) to install Rable.

```bash
npm install rable.js
```

## Example files

The index.js and the files within /views/ are there as an example and being used in development. In case you want to to try it out, do as follows:
For this example git and npm need to be installed on your system.

```bash
    git clone https://github.com/kearfy/rable.js rablejs-example && cd rablejs-example/lib && npm install && cd ../
    node .
```

The example is now available through port 3001

## Basic Usage

To import Rable into your project, we will first have to require the library, then initialize it.

```javascript
    const Rable = require('rable.js');
    const app = new Rable();
```

There also are a few configurable options while initializing Rable, some of which are unchangeable afterwards. In the example we make use of the default options.

```javascript
    const Rable = require('rable.js');
    const app = new Rable({
        port: 80,                                          //the port the server has to listen on.
        ssl: false,                                        //ssl support yet to be included.
        matchByProxy: false,                               //only works once a proxy is configured.
        template: "382a5b28-66f5-421c-a021-2126e5052150",  //default template, set to false to not load a template.
        theme: "5eed5a00-5897-11ea-8e2d-0242ac130003",     //default theme, set to false to not load a theme.
        allowedSources: false,                             //an array of allowed hosts can be included (CORS).
        skipThemeCompatibility: false                      //once loading a template, don't bother the compatability between the theme and template.
    });
```

In case rable runs under a proxy, some additional data needs to be provided.

```javascript
    app.setProxy({
        root: '/rable-app-url',
        host: 'theHostOfTheApplication.tld', //not limited to domainnames.
        port: 80,
        secure: false //defines use of either https:// or http://
    });
```

A note about the secure and port keys, if secure is set to true and no port is defined, we will automatically set it to port 443. The otherway around when port is set to 443 and secure is not defined, we will automatically set it to secure.

If for some reason the proxy needs to be reset, you can make use of app.clearProxy()

```javascript
    app.clearProxy();

    //in case an invalid input will be provided to app.setProxy(), the proxy will also be reset.
```

To register your first route, make use of one of the following functions (currently we only build functions for GET and POST, but other request methods can be registered aswell).

```javascript
    app.get('/', () => res.send('welcome to my website!'));
    app.post('/', () => res.json({
        my: 'first',
        ever: 'API!'
    }));

    app.get('/plainfile', __dirname + '/views/plainfile.html');
```

To register a route with different type of method, make use of registerRoute().

```javascript
    app.registerRoute({
        method: 'YOUR_METHOD',
        path: '/your/url',
        action: (req, res) => res.send('content'),  //a path to a file can also be included.
        data: {}   //data for SmartTag, will be documentated later in this document.
    });
```

To register or obtain an error document, do as follows.

```javascript
    app.setErrorDocument(404, yourAction);
    //the action provided can either be the path to a file, or a function.

    app.getErrorDocument(404);
    //this will return the action of an error document.
```

If the mimetype of a file you want to send back to the client is not registered by default, the server will send it back as text/plain. To solve this, register you own mime type:

```javascript
    app.registerMimeType('fileExtention', 'mime/type');
```

you can also obtain a mime type.

```javascript
    app.getMimeType('html'); //text/html
```

Rable also supports middlewares, globally as well as for a specific url. The great thing about the way we handle middlewares, is that you need to define neither req, res or next. we provide those to you automatically.

```javascript
    app.use(() => {
        res.setHeader('Header', 'Value');
        next();
    });

    app.use('/route', () => {
        res.setHeader('SpecificHeader', 'forThisRoute');
    });
```

Of course you are not limited to headers, you can do everything you would normally run within the function of a route.

You can also obtain a list of registered middlewares. Url-specific middlewares are excluded from this list.

```javascript
    app.middlewares();
    //An array with all the middlewares will be returned.
```

In case you do want to obtain url-specific middlewares, do as follows.

```javascript
    app.middlewares('/route');
```

With rable.js, it's also possible to obtain and potentially delete a route, after it has been registered.

In case you haven't stored the uuid of the route given to you while registering the route, you first need to match it. Note that app.matchRoute will always pick the first matching route it can find and will just skip all the others. so by definition, when you register two of the same routes with both the same method, the first one in line will be triggered.

```javascript
    app.matchRoute('/the/url/of/my/route');

    //or with the method:
    app.matchRoute('/the/url/of/my/route', 'method');
```

if null is returned, rable.js hasn't found any matching route.
Now that we have got our uuid, we can go ahead and obtain our route.

```javascript
    app.obtainRoute('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
```

afterwards a class with relevant data will be returned. usage:

```
    Route.method: stores the method of the route.
    Route.path: stores the url of the route.
    Route.action: stores either the path to a file or a function.
    Route.uuid: stores the uuid of the route.
    Route.data: stores data for SmartTag (documentated later in this document).

    Route.purge(): removes the route.
```

If you want to set cors headers, you can do so:

```javascript
    app.cors([
        'domain.com',
        'example.tld'
    ]);
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
