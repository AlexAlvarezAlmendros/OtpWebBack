const EmailService = require('./services/emailService');

async function diagnoseEmailService() {
    console.log('🔍 Diagnosing Email Service...\n');
    
    // 1. Verificar variables de entorno
    console.log('1️⃣ Environment Variables:');
    console.log('   GMAIL_USER:', process.env.GMAIL_USER || '❌ NOT SET');
    console.log('   GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET');
    console.log('   EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || 'Default: OTP Records');
    console.log('   EMAIL_FROM_ADDRESS:', process.env.EMAIL_FROM_ADDRESS || '❌ NOT SET');
    
    console.log('\n2️⃣ Creating Email Service Instance...');
    
    try {
        const emailService = new EmailService();
        console.log('✅ Email service instance created');
        
        console.log('\n3️⃣ Testing Connection...');
        const connectionResult = await emailService.verifyConnection();
        
        if (connectionResult.success) {
            console.log('✅ Connection successful:', connectionResult.message);
        } else {
            console.log('❌ Connection failed:', connectionResult.message);
            return;
        }
        
        console.log('\n4️⃣ Testing Email Send (Dry Run)...');
        
        // Test con datos ficticios
        const testData = {
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test Email',
            message: 'This is a test message to verify email functionality.'
        };
        
        console.log('Preparing to send test email...');
        console.log('Test data:', testData);
        
        // Comentamos el envío real para evitar spam
        // const result = await emailService.sendContactEmail(testData);
        // console.log('✅ Test email result:', result);
        
        console.log('✅ Email service diagnosis complete - everything looks good!');
        
    } catch (error) {
        console.error('❌ Error during diagnosis:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Cargar dotenv primero
require('dotenv').config();
diagnoseEmailService();
