const mongoose = require("mongoose");

const connetion = async() => {

    try {
        await mongoose.connect("mongodb://localhost:27017/red_social")

        console.log("Conectado correctamente a red_social")
    } catch (error) {
        console.log(error);
        throw new Error("No se ha podido conectar a la base de datos")
    }

}

module.exports = connetion;