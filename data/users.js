import bcrypt from 'bcrypt'; import {ObjectId} from 'mongodb'; import {users} from '../config/mongoCollections.js'; import {checkString,validateEmail} from '../helpers/validation.js';
const salt=10;
export const registerUser=async(fn,ln,email,pw)=>{fn=checkString(fn,'first');ln=checkString(ln,'last');email=validateEmail(email);pw=checkString(pw,'password');const col=await users(); if(await col.findOne({email})) throw 'Email exists'; const hashedPassword=await bcrypt.hash(pw,salt); await col.insertOne({firstName:fn,lastName:ln,email,hashedPassword,role:'user',followedCultures:[],mustBuyList:[]});};
export const loginUser=async(email,pw)=>{email=validateEmail(email); const u=await (await users()).findOne({email}); if(!u) throw 'Invalid credentials'; if(!await bcrypt.compare(pw,u.hashedPassword)) throw 'Invalid credentials'; return u;};
export const getUserById=async(id)=> await (await users()).findOne({_id:new ObjectId(id)});
