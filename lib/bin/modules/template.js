const fs = require('fs');

/**
 * The templating engine for rable.js.
 */
class Template {

    #store;

    /**
     * Initialization of the templating engine.
     *
     * @param  {Rable} master The Rable class.
     */
    constructor(master) {

        this.#store = {};
        this.#store.templates = {};
        this.#store.build = null;
        this.#store.elementChanged = {};
        this.#store.finished = false;
        this.#store.scheduledElementTasks = [];

        fs.readdir(master.root + '/templates/', (err, list) => {
            if (err) throw Error(err);
            list.forEach(template => this.#store.templates[template] = master.root + '/templates/' + template + '/');

            if (master.config.templatesDatabase !== undefined && master.config.templatesDatabase !== false && master.config.templatesDatabase !== null && master.config.templatesDatabase !== '') {
                var loc = (master.config.templatesDatabase.charAt(master.config.templatesDatabase.length - 1) == '/' ? master.config.templatesDatabase : master.config.templatesDatabase + '/');

                fs.readdir(master.config.templatesDatabase, (err, list) => {
                    if (err) throw Error(err);
                    list.forEach(template => this.#store.templates[template] = loc + template + '/');
                    finish()
                });
            } else {
                finish();
            }
        });

        const finish = () => {
            if (master.config.template !== undefined && master.config.template !== false && master.config.template !== null && master.config.template !== '') {
                this.#store.build = this.info(master.config.template);
                Object.keys(this.#store.build.elements).forEach(k => this.#store.elementChanged[k] = false);
                this.#store.build.root = this.#store.templates[master.config.template];

                if (this.#store.build.errorDocument !== undefined) Object.keys(this.#store.build.errorDocument).forEach(edoc => {
                    master.setErrorDocument(edoc, this.#store.build.root + this.#store.build.errorDocument[edoc]);
                });
            }

            this.#store.finished = true;
            this.#store.scheduledElementTasks.forEach(task => {
                if (this.#store.build !== null) {
                    this.#store.build.elements[task.element] = task.value;
                    this.#store.elementChanged[task.element] = true;
                }
            })
        }
    }

    /**
     * Check if template exists (by it's uuid).
     *
     * @param  {string} uuid uuid of the template.
     * @returns {boolean} states if the template was registered within rable.
     */
    exists(uuid) {
        if (this.#store.templates[uuid] === undefined) {
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
        if (this.#store.templates[uuid] === undefined) {
            return null;
        } else {
            return require(this.#store.templates[uuid] + 'build.json');
        }
    }

    /**
     * obtain the value of a key of the build.
     *
     * @param {string} key The key you want to obtain. leave empty to obtain the whole build.
     * @returns {*} Returns the value of a key. null if no template was loaded.
     */
    build(key) {
        return (this.#store.build === null ? null : (key === undefined ? this.#store.build : this.#store.build[key]));
    }

    /**
     * set the target file for an element (navbar, footer, sidebar, etc...).
     *
     * @param  {string} element name of the element.
     * @param  {string} value The target file for the element.
     * @returns {undefined|false|null} returns nothing if successful, false if no template was loaded and null if the task is scheduled. This can happen when the templates are not yet loaded.
     */
    setElement(element, value) {
        if (!this.#store.finished) {
            this.#store.scheduledElementTasks.push({
                element: element,
                value: value
            });

            return null;
        } else {
            if (this.#store.build === null) {
                return false;
            } else {
                this.#store.build.elements[element] = value;
                this.#store.elementChanged[element] = true;
            }
        }
    }

    /**
     * get the target file for an element.
     *
     * @param  {string} element The name of the element.
     * @returns {string|null} Returns the target filepath of the element. null if no template was loaded.
     */
    getElement(element) {
        if (this.#store.build === null) {
            return null;
        } else {
            if (this.#store.elementChanged[element] !== undefined && !this.#store.elementChanged[element]) {
                return this.#store.build.root + this.#store.build.elements[element];
            } else {
                return this.#store.build.elements[element];
            }
        }
    }

    /**
     * Get the path of the directory a template is located (by it's uuid).
     *
     * @param  {string} uuid The uuid if the build.
     * @returns {string|null} Returns the buildroot for the requested template. null if non-existant.
     */
    buildRoot(uuid) {
        return (this.#store.build === null ? null : this.#store.templates[uuid]);
    }
}

module.exports = Template;
