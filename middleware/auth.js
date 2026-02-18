const passport = require('passport');

// Named auth middleware - replaces 35 inline passport.authenticate() calls
const auth = passport.authenticate('jwt', { session: false });

module.exports = auth;
