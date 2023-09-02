const jwt = require("jwt-simple");
const moment = require("moment");

//Clave secreta
const secret = "CEBOLLAS";

//Crear una funcion para generar tokens
const createToken = (user) => {
    const payLoad = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, "days").unix()
    }

    //Devolver jwt token codificado
    return jwt.encode(payLoad, secret);
}

module.exports = {
    secret,
    createToken
}