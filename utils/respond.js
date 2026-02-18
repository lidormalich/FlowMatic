/**
 * Standard response helpers - replaces duplicated error response patterns across routes
 */

const notFound = (res, label = 'פריט') => {
  return res.status(404).json({ message: `${label} לא נמצא` });
};

const forbidden = (res) => {
  return res.status(403).json({ message: 'אין הרשאה' });
};

const badRequest = (res, message = 'בקשה לא תקינה') => {
  return res.status(400).json({ message });
};

const serverError = (res, message = 'שגיאת שרת') => {
  return res.status(500).json({ message });
};

module.exports = {
  notFound,
  forbidden,
  badRequest,
  serverError
};
