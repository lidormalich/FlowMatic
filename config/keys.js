module.exports = {
    mongoURI: process.env.MONGODB_URI || "process.env.MONGODB_URI
    secretOrKey: process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex')
};