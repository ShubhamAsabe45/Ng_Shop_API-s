const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    quantity:{
        type:Number,
        required:true
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Products'
    }
});

orderItemSchema.virtual('id').get(function (){
    return this._id.toHexString();
});
orderItemSchema.set('toJSON',{
    virtuals:true,
})
const orderItemModel = mongoose.model('OrderItem', orderItemSchema); // Changed model name to 'OrderItem'

module.exports = orderItemModel;
