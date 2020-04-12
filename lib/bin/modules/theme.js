const fs = require('fs');
var themes = {};
var build = null;
var loadedTemplate = null;

module.exports = class Theme {
    constructor(master) {
        fs.readdir(master.root + '/themes/', (err, list) => {
            if (err) throw Error(err);
            list.forEach(theme => themes[theme] = master.root + '/themes/' + theme + '/');
            if (master.config.themesDatabase !== undefined && master.config.themesDatabase !== false && master.config.themesDatabase !== null && master.config.themesDatabase !== '') {
                var loc = (master.config.themesDatabase.charAt(master.config.themesDatabase.length - 1) == '/' ? master.config.themesDatabase : master.config.themesDatabase + '/');

                fs.readdir(master.config.themesDatabase, (err, list) => {
                    if (err) throw Error(err);
                    list.forEach(theme => themes[theme] = loc + theme + '/');
                    finish();
                });
            } else {
                finish();
            }
        });

        const finish = () => {
            if (master.config.theme !== undefined && master.config.theme !== false && master.config.theme !== null && master.config.theme !== '') {
                if (master.template.build !== undefined && !master.config.skipThemeCompatibility) {
                    var theme = this.info(master.config.theme);
                    if (theme.compatibleTemplates.includes(master.template.build('uuid'))) {
                        build = theme;
                        build.root = themes[theme.uuid];
                    }
                }
            }
        }
    }

    exists(uuid) {
        if (themes[uuid] === undefined) {
            return false;
        } else {
            return true;
        }
    }

    info(uuid) {
        if (themes[uuid] === undefined) {
            return null;
        } else {
            return require(themes[uuid] + 'build.json');
        }
    }

    build(key) {
        return (build === null ? null : (key === undefined ? build : build[key]));
    }

    buildRoot(uuid) {
        return (build === null ? null : themes[uuid]);
    }
}
