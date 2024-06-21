const mongoose = require('mongoose');
require('dotenv').config()

const connectionDB=mongoose.connect(process.env.DATABASE)

module.exports={connectionDB}