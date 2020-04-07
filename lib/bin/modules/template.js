const fs = require('fs');
var templates = {};
var build = null;

module.exports = class Template {
    constructor(master) {
        fs.readdir(master.root + '/templates/', (err, list) => {
            if (err) throw Error(err);
            list.forEach(template => templates[template] = master.root + '/templates/' + template + '/');
        });

        if (master.config.templatesDatabase !== undefined && master.config.templatesDatabase !== false && master.config.templatesDatabase !== null && master.config.templatesDatabase !== '') {
            var loc = (master.config.templatesDatabase.charAt(master.config.templatesDatabase.length - 1) == '/' ? master.config.templatesDatabase : master.config.templatesDatabase + '/');

            fs.readdir(master.config.templatesDatabase, (err, list) => {
                if (err) throw Error(err);
                list.forEach(template => templates[template] = loc + template + '/');
            });
        }

        //since were not loading sync, wait for 100ms to make sure all templates are indexed.
        setTimeout(() => {
            if (master.config.template !== undefined && master.config.template !== false && master.config.template !== null && master.config.template !== '') {
                build = this.info(master.config.template);
                build.root = templates[master.config.template];

                if (build.errorDocument !== undefined) Object.keys(build.errorDocument).forEach(edoc => {
                    master.setErrorDocument(edoc, build.root + build.errorDocument[edoc]);
                });
            };
        }, 100);
    }

    exists(uuid) {
        if (templates[uuid] === undefined) {
            return false;
        } else {
            return true;
        }
    }

    info(uuid) {
        if (templates[uuid] === undefined) {
            return null;
        } else {
            return require(templates[uuid] + 'build.json');
        }
    }

    build(key) {
        return (build === null ? null : (key === undefined ? build : build[key]));
    }

    setElement(element, value) {
        if (build === null) {
            return false;
        } else {
            build.elements[element] = value;
        }
    }

    getElement(element) {
        return (build === null ? null : build.elements[element]);
    }

    buildRoot(uuid) {
        return (build === null ? null : templates[uuid]);
    }
}
