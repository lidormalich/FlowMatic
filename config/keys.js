module.exports = {
    mongoURI: process.env.MONGODB_URI || "mongodb+srv://admin:PSE7DG6zdi97pYxB@cluster0.o8s2oet.mongodb.net/Calander?retryWrites=true&w=majority",
    secretOrKey: process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex')
};