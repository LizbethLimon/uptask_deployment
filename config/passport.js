const passport = require('passport');
const LocalStrategy = require('passport-local');

//referencia al modelo donde se va a autenticar
const Usuarios=require('../models/Usuarios');

//local strategy- login con credenciales propios(usuarios y password)
passport.use(
    new LocalStrategy(
        //por default passport espera un usuario y password
        {
            usernameField:'email',
            passwordFiel:'password'
        },
        //done finaliza la ejecucion
        async (email,password,done)=>{
            try{
                const usuario=await Usuarios.findOne({
                    where:{
                        email,
                        activo:1
                    }
                });
                //El usuario existe, password incorrecto
                if(!usuario.verificarPassword(password)){
                    return done(null,false,{
                        message: 'Password incorrecto'
                    }) 
                }
                //El email existe y el password es correcto
                return done(null,usuario);

            }catch(error){
                //Ese usuario no existe
                return done(null,false,{
                    message: 'Esa cuenta no existe'
                })
            }
        }
    )
);

//serializar el usuario
passport.serializeUser((usuario,callback)=>{
    callback(null,usuario);
});

//deserializar el usuario
passport.deserializeUser((usuario,callback)=>{
    callback(null,usuario);
});

//exportar
module.exports=passport;