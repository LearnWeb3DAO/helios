import winston from "winston";
import TelegramLogger from "winston-telegram";

function NewLogger(botToken: string, chatId: number): winston.Logger {
  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
    defaultMeta: {
      service: "helios",
    },
    transports: [
      new winston.transports.Console(),
      new TelegramLogger({
        level: "error",
        token: botToken,
        chatId,
      }),
    ],
  });

  return logger;
}

export default NewLogger;
