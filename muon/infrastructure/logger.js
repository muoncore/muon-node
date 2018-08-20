

var level = process.env["LEVEL"]

var logger = {
  info: function(msg, val) {
    switch(level) {
      case "info":
      case "warn":
        console.log("INFO: " + msg + " " + JSON.stringify(val))
    }
  },

  warn:function(msg, val) {
    switch(level) {
      case "warn":
        console.log("WARN: " + msg + " " + JSON.stringify(val))
    }
    },

  debug:function(msg, val) {
    switch(level) {
      case "warn":
      case "debug":
      case "info":
        console.log("DEBUG: " + msg + " " + JSON.stringify(val))
    }
  },
  trace: function(msg, val) {
    switch(level) {
      case "warn":
      case "debug":
      case "info":
      case "trace":
        console.log("DEBUG: " + msg + " " + JSON.stringify(val))
    }
    console.log("TRACE: " + msg + " " + JSON.stringify(val))
  },
  setLogger: function(newLogger) {
    logger = newLogger
  }
}
module.exports = logger
