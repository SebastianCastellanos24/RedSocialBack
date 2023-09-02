const connection = require("./database/connection.js");
const express = require("express");
const cors = require("cors");

//Mensaje de bienvenida
console.log("Api Red Social arrancada")

//Conectar a base de datos
connection();

//Crear servidor
const app = express();
const puerto = 3900;

//Configurar cors
app.use(cors());

//Convertir datos del body a objetos js
app.use(express.json());
app.use(express.urlencoded({extended: true}))

//Cargar rutas
const UserRoutes = require("./routes/userRoute.js")
const PublicationRoutes = require("./routes/publicationRoute.js")
const FollowRoutes = require("./routes/followRoute.js")

app.use("/api/user", UserRoutes)
app.use("/api/publication", PublicationRoutes)
app.use("/api/follow", FollowRoutes)

//Servidos a escuchar peticiones http
app.listen(puerto, () => {
    console.log("Servidor de node corriendo en el puerto " + puerto)
})