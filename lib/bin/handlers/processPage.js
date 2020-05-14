const fs = require('fs')
      jsdom = require('jsdom');

module.exports = (req, res, master, content) => {
    const processedContent = content.replace(/<\?(.*?)\?>/g, item => {
        const original = item;
        item = item.split(':');

        if (item.length == 2) {
            var selector = item[0].substring(2);
            var value = item[1].slice(0, -2);
            if (selectors[selector] === undefined) {
                return '<b>&nbsp;UNKNOWN_SELECTOR&nbsp;</b>';
            } else {
                return selectors[selector](value, {
                    req: req,
                    res: res,
                    master: master,
                    content: content
                });
            }
        } else {
            return '<b>&nbsp;NO_SELECTOR&nbsp;</b>';
        }
    });

    if (master.template.build() !== null) {
        if (req.noTemplate) {
            return processedContent;
        } else {
            var templatePath = master.template.build('root') + master.template.build('file');
            var process = true;
            try {
                var result = fs.readFileSync(templatePath);
            } catch(e) {
                console.log('Error while reading file of element, logging result');
                console.log(e);
                var result = generateError('An error occured while attempting to read file of template itself');
                result + '<br><br>' + processedContent;
                process = false;
            }

            if (!process) {
                return processedContent;
            } else {
                var processedResult = result.toString().replace(/<\?(.*?)\?>/g, item => {
                    const original = item;
                    item = item.split(':');

                    if (item.length == 2) {
                        var selector = item[0].substring(2);
                        var value = item[1].slice(0, -2);
                        if (selectors[selector] === undefined) {
                            return '<b>&nbsp;UNKNOWN_SELECTOR&nbsp;</b>';
                        } else {
                            return selectors[selector](value, {
                                req: req,
                                res: res,
                                master: master,
                                content: content,
                                processedContent: processedContent
                            });
                        }
                    } else {
                        return '<b>&nbsp;NO_SELECTOR&nbsp;</b>';
                    }
                });

                return processedResult;
            }
        }
    } else {
        return processedContent;
    }
}

const selectors = {
    var: (value, sources) => {
        const original = value;
        value = value.split('.');

        if (value[0] === 'global') {
            value.splice(0, 1);
            var result = sources.master.smarttag.getGlobalVariable(value.join('.'));
        } else {
            var result = sources.req.data;
            value.forEach(part => {
                if (result.constructor.name === 'Object') result = result[part];
            });
        }

        var validResults = ['string', 'number', 'boolean'];
        if (validResults.includes(typeof result)) {
            return result;
        } else {
            generateError('invalid_result_type');
        }
    },
    param: (param, sources) => {
        if (sources.req.params[param] === undefined) {
            return generateError('unknown_param');
        } else {
            return sources.req.params[param];
        }
    },
    app: (value, sources) => {
        if (sources.master.info.get(value) === undefined) {
            return generateError('unknown_key');
        } else {
            return sources.master.info.get(value);
        }
    },
    template: (value, sources) => {
        if (sources.master.template.build() === null) {
            return generateError('no_template_loaded');
        } else if (value == 'developer') {
            return "Template '" + sources.master.template.build('name') + "' by <a href='" + sources.master.template.build('authorReferral') + "' target='_blank'>" + sources.master.template.build('author') + "</a>.";
        } else {
            if (value == 'content') {
                return sources.processedContent;
            } else if (value == 'script') {
                var scriptPath = sources.master.template.build('root') + sources.master.template.build('clientScript');
                try {
                    var result = fs.readFileSync(scriptPath);
                } catch(e) {
                    var result = 'alert("An error occured while trying read the file of the client script")';
                }

                return result;
            } else if (sources.master.template.getElement(value) === undefined) {
                return generateError('unknown_template_element');
            } else {
                var elementPath = sources.master.template.getElement(value);

                try {
                    var result = fs.readFileSync(elementPath).toString();
                    result = result.replace(/<\?(.*?)\?>/g, item => {
                        const original = item;
                        item = item.split(':');

                        if (item.length == 2) {
                            var selector = item[0].substring(2);
                            var value = item[1].slice(0, -2);
                            if (selectors[selector] === undefined) {
                                return '<b>&nbsp;UNKNOWN_SELECTOR&nbsp;</b>';
                            } else {
                                return selectors[selector](value, sources);
                            }
                        } else {
                            return '<b>&nbsp;NO_SELECTOR&nbsp;</b>';
                        }
                    });
                } catch(e) {
                    console.log('Error while reading file of element, logging result');
                    console.log(e);
                    var result = generateError('An error occured while attempting to read file of template element');
                }

                return result;
            }
        }
    },
    theme: (value, sources) => {
        if (sources.master.theme.build() === null) {
            return generateError('no_theme_loaded');
        } else if (value == 'developer') {
            return "Theme '" + sources.master.theme.build('name') + "' by <a href='" + sources.master.theme.build('authorReferral') + "' target='_blank'>" + sources.master.theme.build('author') + "</a>.";
        } else {
            var filePath = sources.master.theme.build('root') + sources.master.theme.build('assetsFolder') + '/' + value;

            try {
                var result = fs.readFileSync(filePath);
            } catch(e) {
                console.log('Error while reading file "' + filePath + '", logging result');
                console.log(e);
                var result = generateError('An error occured while attempting to read theme file');
            }

            return result;
        }
    },
    file: (value, sources) => {
        var filePath = process.env.PWD + '/' + value;

        try {
            var result = fs.readFileSync(filePath);
        } catch(e) {
            console.log('Error while reading file "' + filePath + '", logging result');
            console.log(e);
            var result = generateError('An error occured while attempting to read file');
        }

        return result;
    }
}

const generateError = message => {
    return '<span style="border: 2px solid red !important; background-color: white !important; color: black !important; display: inline !important; visibility: visible !important; width: auto !important; height: auto !important; margin: 0px 10px !important; padding: 5px !important;"><b>Smart-tag:</b> ' + message + '</span>';
}
