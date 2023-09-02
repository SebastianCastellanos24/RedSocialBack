const express = require("express");
const router = express.Router();
const UserController = require("../controller/userController.js")
const Auth = require("../middlewares/auth.js")
const multer = require("multer")

//Configuracion de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/avatars/")
    },
    filename: (req, file, cb) => {
        cb(null, `avatar${Date.now()}-${file.originalname}`)
    }
})

const uplads = multer({storage});

//Definir las rutas
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/profile/:id", Auth.auth, UserController.profile);
router.get("/list/:page?", Auth.auth, UserController.list);
router.put("/update", Auth.auth, UserController.update);
router.post("/upload", [Auth.auth, uplads.single("file0")], UserController.upload);
router.get("/avatar/:file", UserController.avatar);
router.get("/counters/:id", Auth.auth, UserController.counters);

//Exportar router
module.exports = router;