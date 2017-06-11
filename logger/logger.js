const tsFormat = () => (new Date()).toLocaleTimeString();
    winston = require('winston');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true,
    timestamp: tsFormat
});

winston.level = 'debug'; //{ error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
//winston.level = 'silly';
module.exports = winston;

