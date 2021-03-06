const Usuarios=require('../models/Usuarios');
const enviarEmail=require('../handlers/email');

exports.formCrearCuenta= async (req,res) =>{
    res.render('crearCuenta',{
        nombrePagina: 'Crear cuenta en UpTask'
    });
}

exports.formIniciarSesion= async (req,res) =>{
    const {error}= res.locals.mensajes;
    res.render('iniciarSesion',{
        nombrePagina: 'Iniciar Sesion en UpTask',
        error
    });
}

exports.crearCuenta=async(req,res)=>{
    //leer los datos
    const { email,password }=req.body;

    try{
        //crear usuario
        await Usuarios.create({
            email,
            password
        });

        //crear una URL de confirmar
        const confirmarUrl=`http://${req.headers.host}/confirmar/${email}`;

        //crear el objeto de usuario
        const usuario={
            email
        }

        //enviar email
        await enviarEmail.enviar({
            usuario,
            subject:'Confirma tu cuenta UpTask',
            confirmarUrl,
            archivo:'confirmar-cuenta'
        });


        //redirifir al usuario
        req.flash('correcto','Enviamos un correo, confirma tu cuenta')
        res.redirect('/iniciar-sesion');

    }catch(error){
        req.flash('error',error.errors.map(error=>error.message));
        res.render('crearCuenta',{
            errores:req.flash(),
            nombrePagina: 'Crear cuenta en UpTask',
            email,
            password
        });
    }
}

exports.formRestablecerPassword= (req,res)=>{
    res.render('restablecer',{
        nombrePagina:'Restablecer tu Contraseña'
    })
}

//cambia el estado de una cuenta
exports.confirmarCuenta=async (req,res)=>{
    const usuario= await Usuarios.findOne({
        where:{
            email:req.params.correo
        }
    });

    //si no existe el usuario
    if(!usuario){
        req.flash('error','No valido');
        res.redirect('/crear-cuenta');
    }

    usuario.activo=1;
    await usuario.save();

    req.flash('correcto','Cuenta Activada Correctamente');
    res.redirect('/iniciar-sesion');
}