
import mongoose from 'mongoose';
import customLogger from '../utility/logger';
import { environment } from '../../config/environment';
mongoose.Promise = global.Promise;

const uri = environment.config.MONGO_URL + environment.config.DB_NAME;

const db = async () => {
  mongoose
    .connect(uri)
    .then(() => {
      customLogger.log('info', 'MonogoDB Connected…');
    })
    .catch((error) => {
      customLogger.log('error', `error is ${error}`);
    });
  return mongoose.connection;
};

export default db;




    
