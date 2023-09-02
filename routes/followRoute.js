const express = require("express");
const router = express.Router();
const FollowController = require("../controller/followController.js")
const Auth = require("../middlewares/auth.js")

//Definir las rutas
router.post("/save", Auth.auth, FollowController.save);
router.delete("/unfollow/:id", Auth.auth, FollowController.unfollow);
router.get("/following/:id?/:page?", Auth.auth, FollowController.following);
router.get("/followers/:id?/:page?", Auth.auth, FollowController.followers);

//Exportar router
module.exports = router;