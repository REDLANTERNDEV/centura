import { getMessage } from '../config/messages.js';

export function errorHandler(err, req, res, _next) {
  console.error(err.stack);
  const status = err.status || 500;

  // If error has a custom message, use it; otherwise use default
  let message = err.message || getMessage('ERROR.INTERNAL_SERVER_ERROR');

  // If the error message is a path to MESSAGES, get the translated message
  if (typeof message === 'string' && message.includes('.')) {
    const translatedMessage = getMessage(message);
    if (translatedMessage !== message) {
      message = translatedMessage;
    }
  }

  res.status(status).json({
    success: false,
    error: message,
  });
}

export default errorHandler;
