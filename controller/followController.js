const FollowModel = require("../models/followModel.js")
const UserModel = require("../models/userModel.js")

const mongoosePaginate = require("mongoose-paginate-v2");

const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde el controlador pruebaFollow"
    })
}

//Guardar follow
const save = async (req, res) => {
    //Conseguir datos body
    const params = req.body;

    //Sacar el id del usuario identificado
    const identity = req.user;

    //Crear objeto con follow
    let userToFollow = new FollowModel({
        user: identity.id,
        followed: params.followed
    });

    //Guardar objeto
    try {
        const followStored = await userToFollow.save();

        if (!followStored) {
            return res.status(500).send({
                status: "error",
                message: "Error al guardar el seguimiento",
            });
        }

        return res.status(200).send({
            status: "success",
            identity: req.user,
            follow: followStored,
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al guardar el seguimiento",
        });
    }
}

//Borrar follow
const unfollow = async (req, res) => {
    //Recoger el id del usaurio identificado
    const userId = req.user.id;

    //id del usuario que deseo dejar de seguir
    const followId = req.params.id

    //Find de las coincidencias y remover
    try {
        const followDelete = await FollowModel.deleteMany({
            "user": userId,
            "followed": followId,
        });

        if (followDelete.deletedCount === 0) {
            return res.status(500).send({
                status: "error",
                message: "No ha dejado de seguir a nadie",
            });
        }

        return res.status(200).send({
            status: "success",
            identity: req.user,
            followDelete,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al dejar de seguir",
        });
    }

}

//Listado de usuarios que estoy siguiendo
const following = async (req, res) => {
    //Sacar id del usaurio identificado
    let userId = req.user.id;

    //Comprobar si me llega el id por parametro
    if (req.params.id) userId = req.params.id;

    //Comprobar si me llega la pagina
    let page = 1;
    if (req.params.page) page = req.params.page;

    //Cuantos usaurios por pagina quiero mostrar
    const iteamPerPage = 5;

    FollowModel.paginate({ user: userId }, {
        page,
        limit: iteamPerPage,
        populate: { path: "user followed", select: "-password -role -__v" },
        sort: { create_at: -1 },
    }).then(async (follows) => {

        //Sacar info seguimiento
        let following = await FollowModel.find({ "user": req.user.id })
            .select({ "followed": 1, "_id": 0 })
            .exec();

        let followers = await FollowModel.find({ "followed": req.user.id })
            .select({ "user": 1, "_id": 0 })
            .exec();

        //Array de indentificadores
        let following_clean = [];
        following.forEach(follow => {
            following_clean.push(follow.followed);
        });

        let followers_clean = [];
        followers.forEach(follower => {
            followers_clean.push(follower.user);
        });

        return res.status(200).send({
            status: "success",
            message: "Lista de following",
            follows: follows.docs,
            totalPages: follows.totalPages,
            page: follows.page,
            user_following: following_clean,
            user_following_me: followers_clean,
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

//Lista de usuarios que me siguen
const followers = (req, res) => {
    //Sacar id del usaurio identificado
    let userId = req.user.id;

    //Comprobar si me llega el id por parametro
    if (req.params.id) userId = req.params.id;

    //Comprobar si me llega la pagina
    let page = 1;
    if (req.params.page) page = req.params.page;

    //Cuantos usaurios por pagina quiero mostrar
    const iteamPerPage = 5;

    FollowModel.paginate({ followed: userId }, {
        page,
        limit: iteamPerPage,
        populate: { path: "user", select: "-password -role -__v" },
    }).then(async (follows) => {

        //Sacar info seguimiento
        let following = await FollowModel.find({ "user": req.user.id })
            .select({ "followed": 1, "_id": 0 })
            .exec();

        let followers = await FollowModel.find({ "followed": req.user.id })
            .select({ "user": 1, "_id": 0 })
            .exec();

        //Array de indentificadores
        let following_clean = [];
        following.forEach(follow => {
            following_clean.push(follow.followed);
        });

        let followers_clean = [];
        followers.forEach(follower => {
            followers_clean.push(follower.user);
        });

        return res.status(200).send({
            status: "success",
            message: "Lista de following",
            follows: follows.docs,
            totalPages: follows.totalPages,
            page: follows.page,
            user_following: following_clean,
            user_following_me: followers_clean,
            user: userId,
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
    pruebaFollow,
    save,
    unfollow,
    following,
    followers
}