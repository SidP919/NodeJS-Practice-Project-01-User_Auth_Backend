const mongoose = require('mongoose');

const MONGO_DB_URL = process.env.MONGO_DB_URL;

exports.connect = async () => {
    await mongoose.connect(MONGO_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(console.log("DB Connection Successful."))
    .catch((error)=>{
        console.log("DB Connection Failed!");
        console.log(error);
        process.exit(1);
    })
}