const passport = require('passport');
const LocalStratergy = require('passport-local');
const Users = require('./../models/users');


passport.use(new LocalStratergy(async(User,password, done)=>{
    try{
        const user = await Users.findOne({name:User});

        if(!user)
            return done(null,false,{message:'Incorrect Username'});

        // const isPasswordMatch = user.password === password ? true:false;
        const isPasswordMatch = await user.comparePassword(password);
        if(isPasswordMatch){
            return done(null,user);
        }else{
            return done(null,false,{message:'Incorrect password'})
        }
    }catch(err){
        return done(err);
    }
}))


// Export

module.exports = passport