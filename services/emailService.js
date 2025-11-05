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

    /**
     * Envía el ticket por email al comprador
     */
    async sendTicketEmail(ticket, eventName, event) {
        try {
            // Verificar que el transporter esté inicializado
            if (!this.transporter) {
                throw new Error('Email service not initialized. Please check Gmail configuration.');
            }

            const emailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'Other People Records',
                    address: process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_USER
                },
                to: ticket.customerEmail,
                subject: `Tu entrada para ${eventName}`,
                html: this.generateTicketEmailTemplate(ticket, eventName, event),
                text: this.generateTicketEmailText(ticket, eventName, event),
                attachments: [{
                    filename: 'ticket-qr.png',
                    content: ticket.qrCode.split('base64,')[1],
                    encoding: 'base64',
                    cid: 'qrcode'
                }]
            };

            console.log('🎫 Sending ticket email to:', ticket.customerEmail);

            const result = await this.transporter.sendMail(emailOptions);

            console.log('✅ Ticket email sent successfully');
            
            return {
                success: true,
                result: result
            };

        } catch (error) {
            console.error('❌ Error sending ticket email:', error.message);
            throw new Error(`Failed to send ticket email: ${error.message}`);
        }
    }

    generateTicketEmailTemplate(ticket, eventName, event) {
        const eventDate = event && event.date ? new Date(event.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Fecha por confirmar';

        const eventLocation = event && event.location ? event.location : 'Ubicación por confirmar';

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Tu entrada para ${eventName}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    background-color: #f4f4f4;
                }
                .container { 
                    max-width: 600px; 
                    margin: 20px auto; 
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #ff003c 0%, #cc0030 100%);
                    color: white; 
                    padding: 30px 20px; 
                    text-align: center; 
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .content { 
                    padding: 30px 20px; 
                }
                .ticket-info {
                    background: #f9f9f9;
                    border-left: 4px solid #ff003c;
                    padding: 20px;
                    margin: 20px 0;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }
                .info-label {
                    font-weight: bold;
                    color: #555;
                }
                .info-value {
                    color: #333;
                }
                .qr-section {
                    text-align: center;
                    margin: 30px 0;
                    padding: 20px;
                    background: #fff;
                    border: 2px dashed #ff003c;
                    border-radius: 10px;
                }
                .qr-code {
                    max-width: 250px;
                    margin: 20px auto;
                }
                .ticket-code {
                    font-size: 18px;
                    font-weight: bold;
                    color: #ff003c;
                    letter-spacing: 2px;
                    margin: 15px 0;
                }
                .important-note {
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer { 
                    text-align: center; 
                    padding: 20px; 
                    background: #f9f9f9;
                    color: #666; 
                    font-size: 14px; 
                }
                .btn {
                    display: inline-block;
                    padding: 12px 30px;
                    background: #ff003c;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 ¡Gracias por tu compra!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Tu entrada está confirmada</p>
                </div>
                
                <div class="content">
                    <p>Hola <strong>${ticket.customerName}</strong>,</p>
                    <p>¡Estamos emocionados de verte en el evento! Tu compra ha sido confirmada exitosamente.</p>

                    <div class="ticket-info">
                        <h2 style="margin-top: 0; color: #ff003c;">📋 Detalles del Evento</h2>
                        <div class="info-row">
                            <span class="info-label">Evento:</span>
                            <span class="info-value">${eventName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Fecha:</span>
                            <span class="info-value">${eventDate}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Ubicación:</span>
                            <span class="info-value">${eventLocation}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Cantidad:</span>
                            <span class="info-value">${ticket.quantity} entrada(s)</span>
                        </div>
                        <div class="info-row" style="border-bottom: none;">
                            <span class="info-label">Total Pagado:</span>
                            <span class="info-value"><strong>${ticket.totalAmount.toFixed(2)} ${ticket.currency}</strong></span>
                        </div>
                    </div>

                    <div class="qr-section">
                        <h3 style="margin-top: 0;">🎫 Tu Código de Entrada</h3>
                        <p>Presenta este código QR en la entrada del evento:</p>
                        <img src="cid:qrcode" alt="QR Code" class="qr-code" />
                        <div class="ticket-code">${ticket.ticketCode}</div>
                        <p style="font-size: 14px; color: #666;">Guarda este email o toma una captura de pantalla</p>
                    </div>

                    <div class="important-note">
                        <strong>⚠️ Importante:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Este código es único y solo puede ser usado una vez</li>
                            <li>Llega con antelación al evento para validar tu entrada</li>
                            <li>No compartas este código con nadie</li>
                        </ul>
                    </div>

                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                    <p><strong>¡Nos vemos en el evento!</strong></p>
                </div>

                <div class="footer">
                    <p><strong>Other People Records</strong></p>
                    <p>Este es un email automático con tu confirmación de compra.</p>
                    <p style="font-size: 12px; margin-top: 10px;">
                        Ticket ID: ${ticket.ticketCode}<br>
                        Fecha de compra: ${new Date(ticket.createdAt).toLocaleString('es-ES')}
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateTicketEmailText(ticket, eventName, event) {
        const eventDate = event && event.date ? new Date(event.date).toLocaleDateString('es-ES') : 'Fecha por confirmar';
        const eventLocation = event && event.location ? event.location : 'Ubicación por confirmar';

        return `
¡GRACIAS POR TU COMPRA!
========================

Hola ${ticket.customerName},

Tu entrada para ${eventName} ha sido confirmada.

DETALLES DEL EVENTO:
- Evento: ${eventName}
- Fecha: ${eventDate}
- Ubicación: ${eventLocation}
- Cantidad: ${ticket.quantity} entrada(s)
- Total pagado: ${ticket.totalAmount.toFixed(2)} ${ticket.currency}

TU CÓDIGO DE ENTRADA:
${ticket.ticketCode}

Presenta este código en la entrada del evento.
Puedes escanear el código QR adjunto o mostrar el código de texto.

IMPORTANTE:
- Este código es único y solo puede ser usado una vez
- Llega con antelación al evento para validar tu entrada
- No compartas este código con nadie

¡Nos vemos en el evento!

---
Other People Records
Ticket ID: ${ticket.ticketCode}
Fecha de compra: ${new Date(ticket.createdAt).toLocaleString('es-ES')}
        `.trim();
    }
}

module.exports = EmailService;
