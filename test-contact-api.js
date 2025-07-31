const axios = require('axios');

// Configuración de prueba
const API_BASE_URL = 'http://localhost:5001/api';

async function testContactEndpoint() {
    console.log('🧪 Testing Contact API Endpoint...\n');
    
    // Test 1: Health check del servicio de email
    try {
        console.log('1️⃣ Testing email service health check...');
        const healthResponse = await axios.get(`${API_BASE_URL}/contact/health`);
        console.log('✅ Health check successful:', healthResponse.data);
    } catch (error) {
        console.log('❌ Health check failed:', error.response?.data || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 2: Enviar mensaje de contacto
    try {
        console.log('2️⃣ Testing contact message submission...');
        const contactData = {
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test Message',
            message: 'This is a test message from the contact form API endpoint.'
        };
        
        const response = await axios.post(`${API_BASE_URL}/contact`, contactData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Contact message sent successfully:');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        return response.data.id; // Retornar el ID para otros tests
        
    } catch (error) {
        console.log('❌ Contact message failed:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
    
    console.log('\n---\n');
    
    // Test 3: Validación de campos requeridos
    try {
        console.log('3️⃣ Testing validation (missing fields)...');
        const invalidData = {
            name: 'Test User'
            // Missing email, subject, message
        };
        
        await axios.post(`${API_BASE_URL}/contact`, invalidData);
        console.log('❌ Validation test failed - should have returned error');
        
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Validation working correctly:', error.response.data.message);
        } else {
            console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
    }
    
    console.log('\n---\n');
    
    // Test 4: Rate limiting (múltiples requests)
    try {
        console.log('4️⃣ Testing rate limiting...');
        const promises = [];
        const contactData = {
            name: 'Rate Limit Test',
            email: 'ratelimit@example.com',
            subject: 'Rate Limit Test',
            message: 'Testing rate limiting functionality.'
        };
        
        // Enviar 6 requests rápidamente (el límite es 5 por hora)
        for (let i = 0; i < 6; i++) {
            promises.push(
                axios.post(`${API_BASE_URL}/contact`, {
                    ...contactData,
                    subject: `Rate Limit Test ${i + 1}`
                }).catch(err => err.response)
            );
        }
        
        const results = await Promise.all(promises);
        const successfulRequests = results.filter(r => r.status === 200).length;
        const rateLimitedRequests = results.filter(r => r.status === 429).length;
        
        console.log(`✅ Rate limiting test complete:`);
        console.log(`   - Successful requests: ${successfulRequests}`);
        console.log(`   - Rate limited requests: ${rateLimitedRequests}`);
        
    } catch (error) {
        console.log('❌ Rate limiting test failed:', error.message);
    }
}

// Ejecutar tests
testContactEndpoint().catch(console.error);
