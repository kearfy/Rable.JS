/**
 * An extention module that handles global variables for SmartTag.
 */
class SmartTag {
    /**
     * Initialization of the class.
     *
     * @param  {Rable} master The Rable class.
     */

    constructor(master) {
        globalVariables.rable.version = master.version;
    }

    /**
     * Create / set the value for a global variable (within SmartTag).
     * @param {string} key Name of the key.
     * @param {*} value The value for the key.
     * @returns {boolean} states if the value was set or not. A reason for a key not being changed is it being a system-reserved key.
     */
    setGlobalVariable(key, value) {
        var reserved = ['rable'];
        if (reserved.includes(key)) {
            return false;
        } else {
            globalVariables[key] = value;
            return true;
        }
    }

    /**
     * Obtain the value for a global variable (within SmartTag).
     * @param {string} path Location of the key. leaving this empty will return all the global variables.
     * @returns {*} value for the key.
     */
    getGlobalVariable(path = '') {
        const original = path;
        path = path.split('.');
        var result = globalVariables;
        path.forEach(part => {
            if (result.constructor.name === 'Object') result = result[part];
        });

        return result;
    }
}

var globalVariables = {
    rable: {
        version: null
    }
}

module.exports = SmartTag;
