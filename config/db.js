const mongoose = require("mongoose");
// const db = process.env.MONGO_URI;
const db = "mongodb+srv://huntscape:EZOyrd8hw4dzaVrY@hunt-db.tnxetxx.mongodb.net/";
const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("MongoDB is connected");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
