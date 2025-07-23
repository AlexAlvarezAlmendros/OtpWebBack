const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            // Verificar que las variables de entorno estén configuradas
            if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
                console.error('❌ Email configuration missing:');
                console.error('   GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing');
                console.error('   GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing');
                console.error('   Please configure Gmail credentials in .env file');
                this.transporter = null;
                return;
            }

            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                },
                secure: true,
                tls: {
                    rejectUnauthorized: false
                }
            });

            console.log('📧 Email service initialized successfully');
            console.log('   Gmail User:', process.env.GMAIL_USER);
            console.log('   From Name:', process.env.EMAIL_FROM_NAME || 'OTP Records');
        } catch (error) {
            console.error('❌ Error initializing email service:', error.message);
            this.transporter = null;
        }
    }

    async verifyConnection() {
        try {
            if (!this.transporter) {
                return { 
                    success: false, 
                    message: 'Email service not initialized. Check Gmail configuration in .env file.' 
                };
            }
            
            await this.transporter.verify();
            return { success: true, message: 'Email service is ready' };
        } catch (error) {
            console.error('❌ Email service verification failed:', error.message);
            return { success: false, message: error.message };
        }
    }

    async sendContactEmail(contactData) {
        const { name, email, subject, message } = contactData;

        try {
            // Verificar que el transporter esté inicializado
            if (!this.transporter) {
                throw new Error('Email service not initialized. Please check Gmail configuration.');
            }

            // Email to admin (you receive the contact form)
            const adminEmailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'OTP Records',
                    address: process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_USER
                },
                to: process.env.GMAIL_USER, // Admin email
                subject: `[CONTACTO] ${subject}`,
                html: this.generateAdminEmailTemplate(name, email, subject, message),
                text: this.generateAdminEmailText(name, email, subject, message)
            };

            // Email to user (confirmation they sent the message)
            const userEmailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'OTP Records',
                    address: process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_USER
                },
                to: email,
                subject: `Confirmación: ${subject}`,
                html: this.generateUserConfirmationTemplate(name, subject),
                text: this.generateUserConfirmationText(name, subject)
            };

            console.log('📧 Sending emails...');
            console.log('   Admin email to:', process.env.GMAIL_USER);
            console.log('   User confirmation to:', email);

            // Send both emails
            const [adminResult, userResult] = await Promise.allSettled([
                this.transporter.sendMail(adminEmailOptions),
                this.transporter.sendMail(userEmailOptions)
            ]);

            console.log('📧 Email results:');
            console.log('   Admin email:', adminResult.status);
            console.log('   User email:', userResult.status);

            return {
                success: true,
                adminEmail: adminResult.status === 'fulfilled' ? adminResult.value : null,
                userEmail: userResult.status === 'fulfilled' ? userResult.value : null,
                errors: {
                    admin: adminResult.status === 'rejected' ? adminResult.reason.message : null,
                    user: userResult.status === 'rejected' ? userResult.reason.message : null
                }
            };

        } catch (error) {
            console.error('❌ Error sending contact email:', error.message);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    generateAdminEmailTemplate(name, email, subject, message) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Nuevo Mensaje de Contacto</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1DB954; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #555; }
                .message-box { background: white; padding: 15px; border-left: 4px solid #1DB954; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Nuevo Mensaje de Contacto</h1>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">Nombre:</span> ${name}
                    </div>
                    <div class="field">
                        <span class="label">Email:</span> ${email}
                    </div>
                    <div class="field">
                        <span class="label">Asunto:</span> ${subject}
                    </div>
                    <div class="field">
                        <span class="label">Mensaje:</span>
                        <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="field">
                        <span class="label">Fecha:</span> ${new Date().toLocaleString('es-ES')}
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateAdminEmailText(name, email, subject, message) {
        return `
NUEVO MENSAJE DE CONTACTO

Nombre: ${name}
Email: ${email}
Asunto: ${subject}

Mensaje:
${message}

Fecha: ${new Date().toLocaleString('es-ES')}
        `.trim();
    }

    generateUserConfirmationTemplate(name, subject) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Mensaje Recibido - OTP Records</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1DB954; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>¡Mensaje Recibido!</h1>
                </div>
                <div class="content">
                    <p>Hola <strong>${name}</strong>,</p>
                    <p>Hemos recibido tu mensaje con el asunto "<strong>${subject}</strong>" y te responderemos lo antes posible.</p>
                    <p>Normalmente respondemos en un plazo de 24-48 horas durante días laborables.</p>
                    <p>¡Gracias por contactar con OTP Records!</p>
                </div>
                <div class="footer">
                    <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateUserConfirmationText(name, subject) {
        return `
Hola ${name},

Hemos recibido tu mensaje con el asunto "${subject}" y te responderemos lo antes posible.

Normalmente respondemos en un plazo de 24-48 horas durante días laborables.

¡Gracias por contactar con OTP Records!

---
Este es un email automático, por favor no respondas a este mensaje.
        `.trim();
    }
}

module.exports = EmailService;
