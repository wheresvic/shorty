const { createLogger, transports, format } = require("winston");

const myFormat = format.printf(info => {
  if (typeof info.message === "string" || info.message instanceof String) {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  }

  return `${info.timestamp} ${info.level}: ${JSON.stringify(info.message)}`;
});

class LogService {
  constructor(logLevel = "debug") {
    const effectiveLogLevel = process.env.LOG_LEVEL || logLevel;

    this.logger = createLogger({
      format: format.combine(format.colorize(), format.timestamp(), myFormat),
      level: effectiveLogLevel,
      transports: [
        new transports.Console({
          timestamp: true,
          colorize: true
        }) //,
        // new (transports.File)({ filename: 'somefile.log', level: 'error' })
      ]
    });

    this.logger.stream = {
      write: message => {
        this.logger.info(message);
      }
    };
  }
}

module.exports = LogService;
