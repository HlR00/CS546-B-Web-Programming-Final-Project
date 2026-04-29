import {dbConnection} from './mongoConnection.js';
const get=(name)=>async()=> (await dbConnection()).collection(name);
export const users=get('users');
export const businesses=get('businesses');
