//Importar modulos
const jwt = require("jwt-simple");
const moment = require("moment");

//Importar claves secretas
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

//Funciones de autentificaciones
exports.auth = (req, res, next) => {
    //Comprobar si me llega la cabecera de auth
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "error",
            message: "La petición no tiene la cabecera de autentificación",
        })
    }

    //Limpiar el token
    let token = req.headers.authorization.replace(/['"]+/g, "")

    //Decodificar el token
    try {
        let payLoad = jwt.decode(token, secret);

        //Comprobar expiracion del token
        if (payLoad.exp <= moment().unix()) {
            return res.status(401).send({
                status: "error",
                message: "Token expirado",
            })
        }

        //Agregar datos de usuario al request
        req.user = payLoad;

    } catch (error) {
        return res.status(404).send({
            status: "error",
            message: "Token invalido",
            error
        })
    }

    //Pasar a ejecucion de accion
    next();
}

