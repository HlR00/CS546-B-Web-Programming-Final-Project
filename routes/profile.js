import express from "express";

import {
  getUser,
  addCulture,
  removeCulture,
  addMustBuy,
  removeMustBuy
} from "../data/users.js";

const router = express.Router();

router.get("/dashboard", async (req, res) => {

  if (!req.session.user)
    return res.redirect("/login");



  const user = await getUser(
    req.session.user._id
  );



  req.session.user.role = user.role;



  res.render(
    "profile/dashboard",
    { user }
  );
});

router.post("/culture/add", async (req,res)=>{
  await addCulture(req.session.user._id, req.body.culture);
  res.redirect("/dashboard");
});

router.post("/culture/remove", async (req,res)=>{
  await removeCulture(req.session.user._id, req.body.culture);
  res.redirect("/dashboard");
});

router.post("/mustbuy/add", async (req,res)=>{
  await addMustBuy(req.session.user._id, req.body.item);
  res.redirect("/dashboard");
});

router.post("/mustbuy/remove", async (req,res)=>{
  await removeMustBuy(req.session.user._id, req.body.item);
  res.redirect("/dashboard");
});

export default router;