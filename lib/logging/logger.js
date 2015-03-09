var winston = require('winston');
require('./date.js');
var consoleplus = require('./console-plus.js');
var fs = require("fs");
var util = require("util");
var stackTrace = require('stack-trace');
var colors = require('colors');
require("callsite");

var Logger = function(newName, maxLevel, outputFile, stdout) {
    var loggerTransports = new Array();
    var bConsolePlus = (stdout == "consoleplus");

    if(stdout == "winston") {
        loggerTransports.push(new winston.transports.Console({
            timestamp: function() {
                return new Date(Date.now()).format('yyyy-mm-dd HH:MM:ss,l');
            },
            formatter: function(options) {
                return options.timestamp() + ' ' +
                    '[' + newName + '] ' +
                    options.level.toUpperCase() + ': ' +
                    (undefined !== options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ?
                    ' ['+ JSON.stringify(options.meta) + ']' : '' );
            },
            level: maxLevel,
            handleExceptions: false
        }));
    }
    if(outputFile != undefined && outputFile != null) {
        loggerTransports.push(new winston.transports.File({
            // TODO: Add name to the file log JSON!
            level: maxLevel,
            filename: outputFile,
            handleExceptions: false
        }))
    }
    this._logger = new winston.Logger({
        transports: loggerTransports
    });
    this.name = newName;

    this.log = function(level, msg, anything) {
        this.logPlus(level, msg, anything);
    }

    this.info = function(msg, anything) {
        this.logPlus('info', msg, anything);
    }

    this.warn = function(msg, anything) {
        this.logPlus('warn', msg, anything);
    }

    this.debug = function(msg, anything) {
        this.logPlus('debug', msg, anything);
    }

    this.trace = function(msg, anything) {
        this.logPlus('trace', msg, anything);
    }

    this.error = function(msg, anything) {
        this.logPlus('error', msg, anything);
    }

    this.rainbow = function(msg, anything) {
        this.logPlus('rainbow', msg, anything);
    }

    this.logPlus = function(level, msg, anything) {
        if(winston.config.cli.levels[level.toLowerCase()] >=
            winston.config.cli.levels[maxLevel.toLowerCase()]) {
            if(anything == undefined || anything == null) {
                if(consoleplus) {
                    consoleplus[level](msg);
                }
                this._logger.log(level, msg);
            } else {
                if(consoleplus) {
                    consoleplus[level](msg, anything);
                }
                this._logger.log(level, msg, anything);
            }
        }
    }

    this._logger.setLevels(winston.config.cli.levels);

    return this;
}

var level = process.env.LEVEL ? process.env.LEVEL : 'info';
GLOBAL.logger = Logger('muon', level, '/tmp/muon.log', true,
    "console-plus");
