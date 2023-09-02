const { Schema, model } = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2");

const PublicationSchema = Schema({

    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    text: {
        type: String,
        require: true
    },
    file: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now()
    }

})

PublicationSchema.plugin(mongoosePaginate);

module.exports = model("Publication", PublicationSchema, "publications")