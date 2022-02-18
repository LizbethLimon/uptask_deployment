const passport= require('passport');
const Usuarios=require('../models/Usuarios');
const Sequelize=require('sequelize');
const Op=Sequelize.Op;
const crypto=require('crypto');
const bcrypt=require('bcrypt-nodejs');
const enviarEmail=require('../handlers/email');


exports.autenticarUsuario=passport.authenticate('local',{
    successRedirect: '/',
    failureRedirect:'/iniciar-sesion',
    failureFlash:true,
    badRequestMessage:'Ambos campos son obligatorios'
});

//Funcion para revisar si el usuario esta logueado o no
exports.usuarioAutenticado=(req,res,next)=>{

    //si el usuario esta autenticado, adelante
    if(req.isAuthenticated()){
        return next();
    }

    //si no esta autenticado, redirigir al formulario
    return res.redirect('/iniciar-sesion');
}

//funcion para cerrar sesion
exports.cerrarSesion=(req,res)=>{
    req.session.destroy(()=>{
        res.redirect('/iniciar-sesion'); //al cerrar sesion lleva a login
    });
}

//genera un token si el usuario es valido
exports.enviarToken=async(req,res)=>{
    const {email}=req.body;
    const usuario=await Usuarios.findOne({where:{email}});

    //Si no existe el usuario
    if(!usuario){
        req.flash('error', 'No existe esa cuenta');
        res.redirect('/restablecer');
    }

    //usuario existe
    usuario.token=crypto.randomBytes(20).toString('hex');
    usuario.expiracion=Date.now() + 3600000;

    //guardarlos en la base de datos
    await usuario.save();

    //url reset
    const resetUrl=`http://${req.headers.host}/restablecer/${usuario.token}`;

    //Enviar el correo con el token
    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'restablecer-password'
    });

    //terminar
    req.flash('correcto','Se envio un mensaje a tu correo');
    res.redirect('/iniciar-sesion');
}

exports.validarToken= async (req,res)=>{
    const usuario=await Usuarios.findOne({
        where:{
            token:req.params.token
        }
    });

    //si no encuentra el usuario
    if(!usuario){
        req.flash('error','No valido');
        res.redirect('/restablecer');
    }
    
    //Formulario para generar el password
    res.render('resetPassword',{
        nombrePagina:'Restablecer Contraseña'
    })
}

//cambia el password por uno nuevo
exports.actualizarPassword=async(req,res)=>{
    //Verifica el token valido pero tambien la fecha de expiracion
    const usuario=await Usuarios.findOne({
        where:{
            token:req.params.token,
            expiracion:{
                [Op.gte]:Date.now()
            }
        }
    });

    //verificar que si el usuario existe
    if(!usuario){
        req.flash('error','No Válido');
        res.redirect('/restablecer');
    }

     //hashear el nuevo password
    usuario.password=bcrypt.hashSync(req.body.password,bcrypt.genSaltSync(10));   
    usuario.token=null;
    usuario.expiracion=null; 

    //guardar el nuevo password
    await usuario.save();
    req.flash('correcto','Tu password se ha modificado correctamente');
    res.redirect('/iniciar-sesion');






}