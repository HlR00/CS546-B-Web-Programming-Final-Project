import { MongoClient } from 'mongodb';
const settings={serverUrl:'mongodb://localhost:27017',database:'nycRootsFlavors'};
let _db;
export const dbConnection=async()=>{if(!_db){const c=new MongoClient(settings.serverUrl);await c.connect();_db=c.db(settings.database);}return _db;};
