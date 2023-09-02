const express = require("express");
const router = express.Router();
const PublicationController = require("../controller/publicationController.js")
const Auth = require("../middlewares/auth.js")
const multer = require("multer")

//Configuracion de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/publications/")
    },
    filename: (req, file, cb) => {
        cb(null, `publi${Date.now()}-${file.originalname}`)
    }
})

const uploads = multer({storage})

//Definir las rutas
router.get("/prueba-publication", PublicationController.pruebaPublication);
router.post("/save", Auth.auth, PublicationController.save);
router.get("/detail/:id", Auth.auth, PublicationController.detail);
router.delete("/remove/:id", Auth.auth, PublicationController.remove);
router.get("/user/:id/:page?", Auth.auth, PublicationController.user);
router.post("/upload/:id", [Auth.auth, uploads.single("file0")], PublicationController.upload);
router.get("/media/file", PublicationController.media);
router.get("/feed/:page?", Auth.auth, PublicationController.feed);

//Exportar router
module.exports = router;