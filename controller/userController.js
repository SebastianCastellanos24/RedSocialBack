const UserModel = require("../models/userModel.js")
const FollowModel = require("../models/followModel.js")
const PublicationModel = require("../models/publicationModel.js")

const Bcryp = require("bcrypt")
const mongoosePagination = require("mongoose-paginate-v2")
const fs = require("fs")
const path = require("path")

//Importar servicios
const jwt = require("../services/jwt.js")

//Registrar usuario
const register = async (req, res) => {
    //Recoger datos de la peticion
    let params = req.body;

    //Comprobar que me llegan bien los datos
    if (!params.name || !params.email || !params.email || !params.nick) {
        console.log("Validacion incorrecta")

        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar",
        })
    }

    //Control usuarios duplicados
    try {
        const users = await UserModel.find({
            $or: [
                { email: params.email.toLowerCase() },
                { nick: params.nick },
            ]
        }).exec();

        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe",
            });
        }

        // Cifrar la contraseña
        let pwd = await Bcryp.hash(params.password, 10);
        params.password = pwd;

        //Crear objeto de usuario
        let user_to_save = new UserModel(params);

        // Guardar usuario en la bbdd
        try {
            const userStored = await user_to_save.save();

            if (!userStored) {
                return res.status(500).send({
                    status: "error",
                    message: "No se ha almacenado el usuario",
                });
            }

            // Devolver resultado
            return res.status(200).json({
                status: "success",
                message: "Usuario registrado correctamente",
                user: userStored
            });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: "No se ha almacenado el usuario",
            });
        }

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error en la consulta de usuarios",
        });
    }

}

const login = async (req, res) => {
    //Recoger los parametros
    let params = req.body

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "Faltan datos por enviar",
        });
    }

    //Buscar en la bbdd si existe
    try {
        let user = await UserModel.findOne({ email: params.email })
            // .select({"password": 0})
            .exec();

        if (!user) {
            return res.status(404).send({
                status: "error",
                message: "No existe el usuario",
            });
        }

        //Comprobar su contraseña 
        const pwd = Bcryp.compareSync(params.password, user.password)

        if (!pwd) {
            return res.status(400).send({
                status: "error",
                message: "No te has indentificado correctamente",
            });
        }

        //Conseguir el Token
        const token = jwt.createToken(user);

        //Devolver datos de usaurio
        return res.status(200).send({
            status: "success",
            message: "Identificado correctamente",
            user: {
                id: user._id,
                name: user.name,
                nick: user.nick
            },
            token
        });

    } catch (error) {
        return res.status(404).send({
            status: "error",
            message: "No existe el usuario",
        });
    }

}

const profile = async (req, res) => {
    //Recibir el parametro del id de usaurio por la url
    const id = req.params.id;

    //Consulta para sacar los datos del usaurio
    try {
        const userProfile = await UserModel.findById(id).select({ password: 0, role: 0 }).exec();

        if (!userProfile) {
            return res.status(404).send({
                status: "error",
                message: "El usuario no existe",
            });
        }

        //Info de seguimiento
        let following = await FollowModel.findOne({ "user": req.user.id, "followed": req.params.id })

        let followers = await FollowModel.findOne({ "user": req.params.id, "followed": req.user.id })

        //Devolver resultado
        return res.status(200).send({
            status: "success",
            user: userProfile,
            following,
            followers
        });

    } catch (error) {
        return res.status(404).send({
            status: "error",
            message: "El usuario no existe",
        });
    }

    //Devolver el resultado
}

const list = async (req, res) => {
    let page = 1

    if (req.params.page) {
        page = req.params.page
    }
    page = parseInt(page)

    let itemPerPage = 5

    const opciones = {
        page: page,
        limit: itemPerPage,
        sort: { _id: -1 }
    };

    //Info de seguimiento
    let following = await FollowModel.find({ "user": req.user.id })
    console.log(following)

    let followers = await FollowModel.find({ "followed": req.user.id })
    console.log(followers)

    let following_clean = [];
    following.forEach(follow => {
        following_clean.push(follow.followed);
    });

    let followers_clean = [];
    followers.forEach(follower => {
        followers_clean.push(follower.user);
    });

    //para acceder a los usuarios del UserSchema
    UserModel.paginate({}, opciones, (error, users, totalPages) => {
        if (error || !users) return res.status(404).json({ status: "Error", message: "NO SE HA ENCONTRADO EL USUARIO" })

        //devolver resultado 
        return res.status(200).send({
            status: "success",
            message: "listado de usuarios",
            users,
            page,
            itemPerPage,
            totalPages,
            following: following_clean,
            followers: followers_clean,
            user: req.user.id
        })

    })

}

const update = async (req, res) => {
    //Rcoger info del usuario a actualizar
    const userIdentity = req.user;
    let userToUpdate = req.body

    //Eliminar campos sobrantes
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    //Comprobar si el usuario ya existe
    try {
        const users = await UserModel.find({
            $or: [
                { email: userToUpdate.email.toLowerCase() },
                { nick: userToUpdate.nick },
            ]
        }).exec();

        let userIsset = false;
        users.forEach(user => {
            if (user && user._id != userIdentity) userIsset = true;
        })

        if (userIsset) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe",
            });
        }

        if (userToUpdate.password) {
            // Cifrar la contraseña
            let pwd = await Bcryp.hash(userToUpdate.password, 10);
            userToUpdate.password = pwd;
        } else {
            delete userToUpdate.password;
        }

        //Buscar y actualizar el usuario
        try {
            const userUpdated = await UserModel.findByIdAndUpdate({ _id: userIdentity.id }, userToUpdate, { new: true })

            if (!userUpdated) {
                return res.status(400).json({
                    status: "error",
                    message: "Error al actualizar",
                });
            }

            return res.status(200).send({
                status: "success",
                message: "Metodo de actualizar usuario",
                user: userUpdated
            });

        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: "Error al actualizar",
                error
            });
        }

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "El usuario ya existe",
        });
    }

}

const upload = async (req, res) => {

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
        const userUpdated = await UserModel.findByIdAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true });

        if (!userUpdated) {
            return res.status(500).send({
                status: "error",
                message: "Error en la subida del avatar",
            });
        }

        return res.status(200).send({
            status: "success",
            user: userUpdated,
            file: req.file,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en la subida del avatar",
        });
    }

}

const avatar = async (req, res) => {
    //El parametro de la url
    const file = req.params.file;

    //Montar el path de la imagen
    const filePath = "./uploads/avatars/" + file;

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
            filePath,
            file,
        });
    }
}

const counters = async (req, res) => {
    let userId = req.user.id

    if (req.params.id) {
        userId = req.params.id;
    }

    try {
        const following = await FollowModel.count({ "user": userId });

        const followed = await FollowModel.count({ "followed": userId });

        const publications = await PublicationModel.count({ "user": userId });

        return res.status(200).send({
            userId,
            following: following,
            followed: followed,
            publications: publications
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al contar las interacciones"
        })
    }
}

//Exportar acciones
module.exports = {
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
}