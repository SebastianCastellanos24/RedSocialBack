const { Schema, model } = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2");

const FolllowSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    followed: {
        type: Schema.ObjectId,
        ref: "User"
    },
    create_at: {
        type: Date,
        default: Date.now()
    }
});

FolllowSchema.plugin(mongoosePaginate);

module.exports = model("Follow", FolllowSchema, "follows")