const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    user: {
        type: String,
        required: true,
        unique:true,
    },
    items: [{
        type: Schema.Types.ObjectId,
        ref: 'Note' // Assuming 'Note' is your model for notes
    }]
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
