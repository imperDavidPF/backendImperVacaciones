require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

const app = express();

// Configura CORS
app.use(cors({
    origin: 'https://imperquimia-vacaciones.vercel.app',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

app.use(bodyParser.json());

// Configura Firebase
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Configura Nodemailer
const transporter = nodemailer.createTransport({
    service: process.env.NODEMAILER_SERVICE,
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    }
});

// Ruta para enviar el correo al supervisor
app.post('/send-email', async (req, res) => {
    const { supervisorEmail, nombreEmpleado, numeroEmpleado, departamento, fechaInicio, fechaFin, diasSolicitados, comentarios, nombreSupervisor, emailSolicitante, requestId, responsableNominas, emailNominas } = req.body;

    // Crear el contenido HTML del correo con botones de Aceptar y Rechazar
    const htmlContent = `
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0;">
                <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th colspan="2" style="font-size: 20px; background-color: #4CAF50; color: white; padding: 12px; text-align: left;">
                                    Hola ${nombreSupervisor}, tienes una nueva solicitud de vacaciones de ${nombreEmpleado}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Nombre:</strong></td>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;">${nombreEmpleado}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Número de Empleado:</strong></td>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;">${numeroEmpleado}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Departamento:</strong></td>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;">${departamento}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Fecha de Inicio:</strong></td>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;">${fechaInicio}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Fecha de Fin:</strong></td>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;">${fechaFin}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Días Solicitados:</strong></td>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;">${diasSolicitados}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Comentarios:</strong></td>
                                <td style="padding: 12px; border-bottom: 1px solid #ddd;">${comentarios}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="text-align: center; padding: 20px;">
                        <a href="https://backendimpervacaciones.onrender.com/${requestId}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                            Aceptar
                        </a>
                        <a href="https://backendimpervacaciones.onrender.com/${requestId}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Rechazar
                        </a>
                    </div>
                    <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
                        Este es un correo automático, por favor no responder.
                    </div>
                </div>
            </body>
        </html>
    `;

    const mailOptions = {
        from: 'dpromontor@imperquimia.com.mx', // Reemplaza con tu correo
        to: supervisorEmail,
        subject: 'Nueva Solicitud de Vacaciones',
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);

        // Enviar correo al responsable de nóminas
        if (emailNominas) {
            const mailOptionsNominas = {
                from: 'dpromontor@imperquimia.com.mx',
                to: emailNominas,
                subject: 'Confirmación de Vacaciones',
                html: `
                    <html>
                        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0;">
                            <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr>
                                            <th colspan="2" style="font-size: 20px; background-color: #4CAF50; color: white; padding: 12px; text-align: left;">
                                                Hola ${responsableNominas}, tienes una nueva solicitud de vacaciones de ${nombreEmpleado}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Nombre:</strong></td>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${nombreEmpleado}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Número de Empleado:</strong></td>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${numeroEmpleado}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Departamento:</strong></td>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${departamento}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Fecha de Inicio:</strong></td>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${fechaInicio}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Fecha de Fin:</strong></td>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${fechaFin}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Días Solicitados:</strong></td>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${diasSolicitados}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Comentarios:</strong></td>
                                            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${comentarios}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div style="text-align: center; padding: 20px;">
                                    <a href="https://backendimpervacaciones.onrender.com/confirmar-vacaciones/${requestId}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                        Confirmar Vacaciones
                                    </a>
                                </div>
                                <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
                                    Este es un correo automático, por favor no responder.
                                </div>
                            </div>
                        </body>
                    </html>
                `
            };

            await transporter.sendMail(mailOptionsNominas);
        }

        res.status(200).send('Correo enviado al supervisor y al responsable de nóminas.');
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.status(500).send('Error al enviar el correo: ' + error.toString());
    }
});

app.get('/confirmar-vacaciones/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        // Recuperar la solicitud de Firestore
        const requestRef = doc(db, 'vacationRequests', requestId);
        const requestDoc = await getDoc(requestRef);

        if (!requestDoc.exists()) {
            return res.status(404).send('Solicitud no encontrada.');
        }

        // Actualizar el estado en Firestore
        await updateDoc(requestRef, { confirmacion_nominas: 'vacaciones registradas' });

        res.status(200).send(`
            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; align-items: center;">
                <h1 style="font-size: 24px; margin: 0; font-family: Arial, sans-serif;">
                    Vacaciones confirmadas y registradas en nóminas.
                </h1>
            </div>
        `);
    } catch (error) {
        console.error('Error al confirmar las vacaciones:', error);
        res.status(500).send('Error al confirmar las vacaciones: ' + error.toString());
    }
});


// Ruta para manejar la aceptación de la solicitud
app.get('/aceptar/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        // Recuperar la solicitud de Firestore
        const requestRef = doc(db, 'vacationRequests', requestId);
        const requestDoc = await getDoc(requestRef);

        if (!requestDoc.exists()) {
            return res.status(404).send('Solicitud no encontrada.');
        }

        const { nombreEmpleado, fechaInicio, fechaFin, diasSolicitados, emailSolicitante } = requestDoc.data();

        // Validar que los campos requeridos estén presentes
        if (!emailSolicitante || !nombreEmpleado || !fechaInicio || !fechaFin || !diasSolicitados) {
            return res.status(400).send('Faltan datos requeridos en la solicitud.');
        }

        // Actualizar el estado en Firestore
        await updateDoc(requestRef, { aprobado: 'Aceptado' });

        // Enviar correo al solicitante notificando la aceptación
        const mailOptions = {
            from: 'dpromontor@imperquimia.com.mx',
            to: emailSolicitante,
            subject: 'Solicitud de Vacaciones Aceptada',
            html: `
                <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0;">
                        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th colspan="2" style="font-size: 20px; background-color: #4CAF50; color: white; padding: 12px; text-align: left;">
                                            Hola <span style="font-weight: bold;">${nombreEmpleado}</span>, Ya tenemos un status de tus vacaciones.
                                        </th>
                                    </tr>
                                </thead>
                                <tbody style="padding: 15px;">
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;">Vacaciones Aprobadas</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Fecha de Inicio:</strong></td>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${new Date(fechaInicio).toLocaleDateString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Fecha de Fin:</strong></td>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${new Date(fechaFin).toLocaleDateString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Días Solicitados:</strong></td>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${diasSolicitados}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style="text-align: center">
                                <p style="font-size: 16px; color: #333;">
                                    Por favor, toma en cuenta lo siguiente antes de tu ausencia:
                                </p>
                                <ul style="font-size: 14px; color: #555;">
                                    <li>Deja un respaldo con alguien que pueda atender tus responsabilidades mientras estás fuera.</li>
                                    <li>Notifica a tu departamento sobre tu ausencia para evitar contratiempos.</li>
                                    <li>Asegúrate de concluir o delegar cualquier tarea pendiente antes de tu salida.</li>
                                </ul>
                                <p style="font-size: 16px; color: #333;">
                                    Si tienes dudas, puedes acercarte con tu jefe inmediato.
                                </p>
                                <p style="font-size: 16px; color: #333;">
                                    Saludos, <strong>Botquim Manager Flows</strong>
                                </p>
                            </div>
                        </div>
                    </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        // Enviar una respuesta HTML con estilos para la ventana emergente
        res.status(200).send(`
            <div  style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; align-items: center;">
                <h1 style="font-size: 24px; margin: 0; font-family: Arial, sans-serif;">
                    Solicitud aceptada y correo enviado al solicitante.
                </h1>

            </div>
        `);
    } catch (error) {
        console.error('Error al aceptar la solicitud:', error);
        res.status(500).send('Error al aceptar la solicitud: ' + error.toString());
    }
});

// Ruta para manejar el rechazo de la solicitud
app.get('/rechazar/:requestId', async (req, res) => {
    const { requestId } = req.params;
    try {
        // Recuperar la solicitud de Firestore
        const requestRef = doc(db, 'vacationRequests', requestId);
        const requestDoc = await getDoc(requestRef);

        if (!requestDoc.exists()) {
            return res.status(404).send('Solicitud no encontrada.');
        }

        const { nombreEmpleado, fechaInicio, fechaFin, diasSolicitados, emailSolicitante } = requestDoc.data();

        // Validar que los campos requeridos estén presentes
        if (!emailSolicitante || !nombreEmpleado || !fechaInicio || !fechaFin || !diasSolicitados) {
            return res.status(400).send('Faltan datos requeridos en la solicitud.');
        }
        // Actualizar el estado en Firestore
        await updateDoc(requestRef, { aprobado: 'Rechazado' });


        // Enviar correo al solicitante notificando el rechazo
        const mailOptions = {
            from: 'dpromontor@imperquimia.com.mx',
            to: emailSolicitante,
            subject: 'Solicitud de Vacaciones Rechazada',
            html: `
                <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0;">
                        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th colspan="2" style="font-size: 20px; background-color: #f44336; color: white; padding: 12px; text-align: left;">
                                            Hola <span style="font-weight: bold;">${nombreEmpleado}</span>, Ya tenemos un status de tus vacaciones.
                                        </th>
                                    </tr>
                                </thead>
                                <tbody style="padding: 15px;">
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;">Vacaciones Rechazadas</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Fecha de Inicio:</strong></td>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${new Date(fechaInicio).toLocaleDateString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Fecha de Fin:</strong></td>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${new Date(fechaFin).toLocaleDateString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Días Solicitados:</strong></td>
                                        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${diasSolicitados}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style="text-align: center">
                                <p style="font-size: 16px; color: #333;">
                                    Te recomendamos acercarte con tu jefe inmediato para conocer los motivos y, en caso necesario, coordinar una mejor planificación para futuras solicitudes.
                                </p>
                                
                                <p style="font-size: 16px; color: #333;">
                                    Saludos, <strong>Botquim Manager Flows</strong>
                                </p>
                            </div>
                        </div>
                    </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send(`
            <div  style="background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; align-items: center;">
                <h1 style="font-size: 24px; margin: 0; font-family: Arial, sans-serif;">
                    Solicitud rechazada y correo enviado al solicitante.
                </h1>

            </div>
        `);
    } catch (error) {
        console.error('Error al rechazar la solicitud:', error);
        res.status(500).send('Error al rechazar la solicitud: ' + error.toString());
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});