if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in .env file');
}

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in .env file');
}

module.exports = {
    mongoURI: process.env.MONGODB_URI,
    secretOrKey: process.env.JWT_SECRET
};