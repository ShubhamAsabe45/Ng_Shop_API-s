const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const usersSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    street:{
        type:String,
        default:''
    },
    apartment:{
        type:String,
        default:''
    },
    zip:{
        type:String,
        default:''
    },
    city:{
        type:String,
        default:''
    },
    country:{
        type:String,
        default:''
    }

});

usersSchema.virtual('id').get(function (){
    return this._id.toHexString();
});
usersSchema.set('toJSON',{
    virtuals:true,
})

// Hash Password
usersSchema.pre('save', async function(next){
    const user = this;

    // Hash the password only if it has been modified (or is new)
    if(!user.isModified('password')) return next();
    try{
        // hash password generation
        const salt = await bcrypt.genSalt(10);

        // hash password
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        // Override the plain password with the hashed one
        user.password = hashedPassword;
        next();
    }catch(err){
        return next(err);
    }
})

usersSchema.methods.comparePassword = async function(userPassword){
    try{
        // Use bcrypt to compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(userPassword, this.password);
        return isMatch;
    }catch(err){
        throw err;
    }
}

const usersModel = mongoose.model('Users',usersSchema);


module.exports = usersModel;