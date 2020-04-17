const fs = require('fs');
var templates = {};
var build = null;

/**
 * The templating engine for rable.js.
 */
class Template {
    /**
     * Initialization of the templating engine.
     *
     * @param  {Rable} master The Rable class.
     */
    constructor(master) {
        fs.readdir(master.root + '/templates/', (err, list) => {
            if (err) throw Error(err);
            list.forEach(template => templates[template] = master.root + '/templates/' + template + '/');

            if (master.config.templatesDatabase !== undefined && master.config.templatesDatabase !== false && master.config.templatesDatabase !== null && master.config.templatesDatabase !== '') {
                var loc = (master.config.templatesDatabase.charAt(master.config.templatesDatabase.length - 1) == '/' ? master.config.templatesDatabase : master.config.templatesDatabase + '/');

                fs.readdir(master.config.templatesDatabase, (err, list) => {
                    if (err) throw Error(err);
                    list.forEach(template => templates[template] = loc + template + '/');
                    finish()
                });
            } else {
                finish();
            }
        });

        const finish = () => {
            if (master.config.template !== undefined && master.config.template !== false && master.config.template !== null && master.config.template !== '') {
                build = this.info(master.config.template);
                build.root = templates[master.config.template];

                if (build.errorDocument !== undefined) Object.keys(build.errorDocument).forEach(edoc => {
                    master.setErrorDocument(edoc, build.root + build.errorDocument[edoc]);
                });
            }
        }
    }

    /**
     * Check if template exists (by it's uuid).
     *
     * @param  {string} uuid uuid of the template.
     * @returns {boolean} states if the template was registered within rable.
     */
    exists(uuid) {
        if (templates[uuid] === undefined) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Build info about a template (by it's uuid).
     *
     * @param  {string} uuid uuid of the template.
     * @returns {object|null} Returns information about the template. null if non-existant.
     */
    info(uuid) {
        if (templates[uuid] === undefined) {
            return null;
        } else {
            return require(templates[uuid] + 'build.json');
        }
    }

    /**
     * obtain the value of a key of the build.
     *
     * @param {string} key The key you want to obtain. leave empty to obtain the whole build.
     * @returns {*} Returns the value of a key. null if no template was loaded.
     */
    build(key) {
        return (build === null ? null : (key === undefined ? build : build[key]));
    }

    /**
     * set the target file for an element (navbar, footer, sidebar, etc...).
     *
     * @param  {string} element name of the element.
     * @param  {string} value The target file for the element.
     * @returns {undefined|false} returns nothing if successful, false if no template was loaded.
     */
    setElement(element, value) {
        if (build === null) {
            return false;
        } else {
            build.elements[element] = value;
        }
    }

    /**
     * get the target file for an element.
     *
     * @param  {string} element The name of the element.
     * @returns {string|null} Returns the target filepath of the element. null if no template was loaded.
     */
    getElement(element) {
        return (build === null ? null : build.elements[element]);
    }

    /**
     * Get the path of the directory a template is located (by it's uuid).
     *
     * @param  {string} uuid The uuid if the build.
     * @returns {string|null} Returns the buildroot for the requested template. null if non-existant.
     */
    buildRoot(uuid) {
        return (build === null ? null : templates[uuid]);
    }
}

module.exports = Template;
