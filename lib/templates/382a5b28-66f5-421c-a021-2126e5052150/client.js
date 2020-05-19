const ClientRouter = new class ClientRouter {
    constructor() {
        this.initializeLinks();
    }

    initializeLinks() {
        const host = location.host.substring(0, 4) === 'www.' ? location.host.substring(4) : location.host;

        const parseUrl = function(url) {
            url = url.replace(/\\/g, "/");
            url = (url.charAt(0) == '/' ? url : '/' + url);
            url = (url.charAt(url.length - 1) == '/' ? url : url + '/');
            return url;
        }

        document.querySelectorAll('a').forEach(link => {
            if (link.getAttribute('href') !== null && link.initialized === undefined && link.getAttribute('noajax') === null && (link.host.includes(host) || link.host == '') && link.getAttribute('target') !== '_blank' && parseUrl(location.pathname) !== parseUrl(link.getAttribute('href')) && !(link.getAttribute('href')[0] === '#' && link.hash !== '')) {
                link.addEventListener('click', e => {
                    if (!e.ctrlKey) {
                        e.preventDefault();
                        this.navigate(link.href, link.getAttribute('href'));
                    }
                })
            }

            link.initialized = true;
        });
    }

    navigate(url, short, writeHistory = true) {
        var opts = {method:'get'};
        if (localStorage.getItem('user_token') !== null) {
            opts.credentials = 'same-origin'
            opts.headers = {
                'Authorization': 'Bearer ' + localStorage.getItem('user_token')
            }
        }

        fetch(url, opts).then(res => {
            var loadedTheme = res.headers.get('Loaded-Template');
            if (loadedTheme === '382a5b28-66f5-421c-a021-2126e5052150') {
                res.text().then(res => {
                    var parsed = document.createElement('parsed');
                    parsed.innerHTML = res;
                    const copylist = ['head > title', 'div.navbar', 'div.content', 'div.footer'];
                    copylist.forEach(item => {
                        if (document.querySelector(item) !== null && parsed.querySelector(item) !== null) {
                            document.querySelector(item).innerHTML = parsed.querySelector(item).innerHTML;
                        }
                    });

                    const clearElements = ['meta'];
                    clearElements.forEach(element => document.querySelectorAll(element).forEach(current => (current.getAttribute('consistent') === null ? current.parentNode.removeChild(current) : undefined)))

                    const metaCopyList = ['og:site_name', 'og:title', 'description', 'og:description', 'keywords'];
                    metaCopyList.forEach((item, index, items) => document.querySelector('meta[name="' + items[index] + '"]').content = parsed.querySelector('meta[name="' + items[index] + '"]').content);
                    parsed.querySelectorAll('meta[name]').forEach(item => (!metaCopyList.includes(item.getAttribute('name')) ? document.querySelector('head').appendChild(item) : undefined));

                    document.querySelectorAll('script').forEach(script => {
                        if (script.getAttribute('norefresh') === null) {
                            var replacement = document.createElement('script');

                            for (var i = 0; i < script.attributes.length; i++) {
                                var attrib = script.attributes[i];
                                replacement.setAttribute(attrib.name, attrib.value)
                            }

                            if (script.getAttribute('src') === null) {
                                replacement.innerHTML = script.innerHTML;
                            }

                            script.parentNode.replaceChild(replacement, script);
                        }
                    });

                    if (writeHistory) history.pushState({url: short}, parsed.querySelector('title').innerHTML, short);
                    this.initializeLinks();
                    window.dispatchEvent(new CustomEvent('AjaxNavigated'));
                });
            } else {
                location.replace(url);
            }
        });
    }
}

window.onhashchange = function(event) {
    window.hashchanged = true;
}

window.onpopstate = function(event) {
    setTimeout(() => {
        if (window.hashchanged === true) {
            window.hashchanged = false;
        } else {
            var url = (event.state === null ? location.pathname : event.state.url);
            var parsed = new URL(url, location);
            ClientRouter.navigate(parsed.href, url, false);
        }
    }, 1)
}

document.querySelectorAll('.current-year').forEach(el => el.innerText = new Date().getFullYear());
