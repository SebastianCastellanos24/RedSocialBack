const PublicationModel = require("../models/publicationModel.js");
const fs = require("fs")
const path = require("path")
const FollowModel = require("../models/followModel.js")

const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde el controlador pruebaPublication"
    })
}

//Guardar una publicacion
const save = async (req, res) => {
    //Datos del body
    const params = req.body;

    //Si no llegan dar respuesta
    if (!params) return res.status(400).send({ status: "error", "message": "Debes enviar el texo de la publicación" });

    //Crear y rellenar el objeto del modelo
    let newPublication = new PublicationModel(params);
    newPublication.user = req.user.id;

    //Guardar en la base de datos
    try {
        publicationStored = await newPublication.save();

        if (!publicationStored) {
            return res.status(400).send({ status: "error", "message": "No se ha guardado la publicación" });
        }

        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicación guardada",
            publicationStored
        })

    } catch (error) {
        return res.status(400).send({ status: "error", "message": "No se ha guardado la publicación" });
    }

}

const detail = async (req, res) => {
    //Sacar el id de publicacion de la url
    const publicationId = req.params.id;

    //Find con la condicion del id
    try {
        const publicationStored = await PublicationModel.findById(publicationId);

        if (!publicationStored) {
            return res.status(400).send({
                status: "error",
                message: "No existe la publicación",
            })
        }

        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Mostrar publicación",
            publicatio: publicationStored
        })

    } catch (error) {
        return res.status(400).send({
            status: "error",
            message: "No existe la publicación",
            error
        })
    }

}

//Eliminar publicacion
const remove = async (req, res) => {
    //Id de la publicación a eliminar
    const publicationId = req.params.id;

    try {
        await PublicationModel.findOneAndDelete({ "user": req.user.id, "_id": publicationId });

        return res.status(200).send({
            status: "success",
            message: "Eliminar publicación",
            publicationId
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "No se ha eliminado la publicación",
            error: error.message
        });
    }
}

//Listar las publicaciones de usaurio
const user = async (req, res) => {
    const userId = req.params.id

    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    const iteamPerPage = 5;

    PublicationModel.paginate({ "user": userId }, {
        page,
        limit: iteamPerPage,
        populate: { path: "user", select: "-password -__v -role" }
    }).then(async (publications) => {

        return res.status(200).send({
            status: "success",
            message: "Publicaciones de un usuario",
            user: req.user,
            publications: publications.docs,
            page: publications.page,
            total: publications.totalDocs,
            totalPages: publications.totalPages,
        });

    })
        .catch((error) => {
            return res.status(500).send({
                status: "error",
                message: "Error al paginar las publicaciones",
                error: error.message
            });
        });

}

//Subir ficheros
const upload = async (req, res) => {
    //Sacar publication id
    const publicationId = req.params.id

    //Recoger fichero de imagen que existe
    if (!req.file) {
        return res.status(404).json({
            status: "error",
            message: "No incluye la imagen",
        });
    }

    //Conseguir el nombre del archvio
    const image = req.file.originalname;

    //Sacar la extension del archivo
    const imageSplit = image.split("\.")
    const extension = imageSplit[1];

    //Comprobar extension
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif" && extension != "webp" && extension != "avif") {

        //Si no es correcta borrar archivo
        const filePath = req.file.path;
        const fileDeleted = fs.unlinkSync(filePath);

        return res.status(400).json({
            status: "error",
            message: "Extensión del fichero invalida",
        });

    }

    try {
        const publicationUpdated = await PublicationModel.findByIdAndUpdate({ "user": req.user.id, "_id": publicationId }, { file: req.file.filename }, { new: true });

        if (!publicationUpdated) {
            return res.status(500).send({
                status: "error",
                message: "Error en la subida del avatar",
            });
        }

        return res.status(200).send({
            status: "success",
            publication: publicationUpdated,
            file: req.file,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en la subida del avatar",
        });
    }

}


const media = async (req, res) => {
    //El parametro de la url
    const file = req.params.file;

    //Montar el path de la imagen
    const filePath = "./uploads/publications/" + file;

    //Archivo existe
    try {
        const stats = await fs.promises.stat(filePath);
        console.log(stats)

        if (!stats) {
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen",
            });
        }

        return res.sendFile(filePath);

    } catch (error) {
        return res.status(404).send({
            status: "error",
            message: "Error al buscar la imagen",
        });
    }
}

const feed = async (req, res) => {
    //Sacar pagina actual
    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    //Establecer el numero de elementos por pagina
    const iteamPerPage = 5;

    //Sacar info seguimiento
    let following = await FollowModel.find({ "user": req.user.id })
        .select({ "followed": 1, "_id": 0 })
        .exec();

    //Array de indentificadores
    let following_clean = [];
    following.forEach(follow => {
        following_clean.push(follow.followed);
    });

    PublicationModel.paginate({ "user": following_clean }, {
        page,
        limit: iteamPerPage,
        populate: { path: "user", select: "-password -role -__v -email" },
        sort: { create_at: -1 },
    }).then(async (publication) => {

        return res.status(200).send({
            status: "success",
            user_following: following_clean,
            publication: publication.docs,
            totalPages: publication.totalPages,
            page: publication.page,
        });

    })
        .catch((error) => {
            return res.status(500).send({
                status: "error",
                message: "Error al paginar los follows",
                error
            });
        });


}

//Exportar acciones
module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed
}