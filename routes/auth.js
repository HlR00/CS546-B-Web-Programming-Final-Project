import express from "express";
import {
  registerUser,
  loginUser
} from "../data/users.js";

const router = express.Router();



router.get("/login", (req, res) => {
  res.render("auth/login");
});



router.get("/register", (req, res) => {
  res.render("auth/register");
});



router.post("/register", async (req, res) => {
  try {
    await registerUser(
      req.body.firstName,
      req.body.lastName,
      req.body.email,
      req.body.password
    );

    res.redirect("/login");

  } catch (e) {
    res.render("auth/register", {
      error: e
    });
  }
});



router.post("/login", async (req, res) => {
    try {
      const user = await loginUser(
        req.body.email,
        req.body.password
      );
  
      req.session.user = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        followedCultures:
          user.followedCultures || []
      };
  
      res.redirect("/dashboard");
  
    } catch (e) {
      res.render("auth/login", {
        error: "Invalid Login"
      });
    }
  });



router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});



export default router;