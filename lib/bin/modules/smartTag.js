module.exports = class SmartTag {
    constructor(master) {
        globalVariables.rable.version = master.version;
    }

    setGlobalVariable(key, value) {
        var reserved = ['rable'];
        if (reserved.includes(key)) {
            return false;
        } else {
            globalVariables[key] = value;
            return true;
        }
    }

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
