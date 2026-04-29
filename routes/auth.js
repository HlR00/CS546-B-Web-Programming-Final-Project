import {Router} from 'express'; import {registerUser,loginUser} from '../data/users.js'; const r=Router();
r.get('/register',(q,s)=>s.render('auth/register'));
r.post('/register',async(q,s)=>{try{await registerUser(q.body.firstName,q.body.lastName,q.body.email,q.body.password);s.redirect('/login');}catch(e){s.render('auth/register',{error:e});}});
r.get('/login',(q,s)=>s.render('auth/login'));
r.post('/login',async(q,s)=>{try{const u=await loginUser(q.body.email,q.body.password);q.session.user={_id:u._id.toString(),firstName:u.firstName,role:u.role};s.redirect('/dashboard');}catch(e){s.render('auth/login',{error:e});}});
r.get('/logout',(q,s)=>q.session.destroy(()=>s.redirect('/login')));
export default r;
