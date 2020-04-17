const fs = require('fs');
var themes = {};
var build = null;
var loadedtheme = null;

/**
 * The themes engine for rable.js.
 */
class Theme {
    /**
     * Initialization of the themes engine.
     *
     * @param  {Rable} master The Rable class.
     */
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
                if (master.template.build() !== null && !master.config.skipThemeCompatibility) {
                    var theme = this.info(master.config.theme);
                    if (theme.compatibleTemplates.includes(master.template.build('uuid'))) {
                        build = theme;
                        build.root = themes[theme.uuid];
                    }
                }
            }
        }
    }

    /**
     * Check if theme exists (by it's uuid).
     *
     * @param  {string} uuid uuid of the theme.
     * @returns {boolean} states if the theme was registered within rable.
     */
    exists(uuid) {
        if (themes[uuid] === undefined) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Build info about a theme (by it's uuid).
     *
     * @param  {string} uuid uuid of the theme.
     * @returns {object|null} Returns information about the theme. null if non-existant.
     */
    info(uuid) {
        if (themes[uuid] === undefined) {
            return null;
        } else {
            return require(themes[uuid] + 'build.json');
        }
    }

    /**
     * obtain the value of a key of the build.
     *
     * @param {string} key The key you want to obtain. leave empty to obtain the whole build.
     * @returns {*} Returns the value of a key. null if no theme was loaded.
     */
    build(key) {
        return (build === null ? null : (key === undefined ? build : build[key]));
    }

    /**
     * Get the path of the directory a theme is located (by it's uuid).
     *
     * @param  {string} uuid The uuid if the build.
     * @returns {string|null} Returns the buildroot for the requested theme. null if non-existant.
     */
    buildRoot(uuid) {
        return (build === null ? null : themes[uuid]);
    }
}

module.exports = Theme;
