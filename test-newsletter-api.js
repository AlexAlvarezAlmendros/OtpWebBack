const axios = require('axios');

// Configuración de prueba
const API_BASE_URL = 'http://localhost:5001/api/newsletter';

async function testNewsletterEndpoints() {
    console.log('📬 Testing Newsletter API Endpoints...\n');
    
    const testEmails = [
        'test1@example.com',
        'test2@example.com',
        'invalid-email',
        'test1@example.com' // Duplicado para probar
    ];
    
    // Test 1: Suscribir emails
    console.log('1️⃣ Testing newsletter subscriptions...');
    
    for (const email of testEmails) {
        try {
            const response = await axios.post(`${API_BASE_URL}/subscribe`, {
                email: email,
                source: 'api-test'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`✅ Subscription successful for ${email}:`, response.data.message);
            
        } catch (error) {
            if (error.response) {
                console.log(`❌ Subscription failed for ${email}:`, error.response.data.message);
            } else {
                console.log(`❌ Network error for ${email}:`, error.message);
            }
        }
    }
    
    console.log('\n---\n');
    
    // Test 2: Verificar estado de suscripción
    console.log('2️⃣ Testing subscription status check...');
    
    try {
        const response = await axios.get(`${API_BASE_URL}/status`, {
            params: { email: 'test1@example.com' }
        });
        
        console.log('✅ Status check successful:', response.data);
        
    } catch (error) {
        console.log('❌ Status check failed:', error.response?.data || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 3: Desuscribir
    console.log('3️⃣ Testing newsletter unsubscription...');
    
    try {
        const response = await axios.post(`${API_BASE_URL}/unsubscribe`, {
            email: 'test2@example.com'
        });
        
        console.log('✅ Unsubscription successful:', response.data.message);
        
    } catch (error) {
        console.log('❌ Unsubscription failed:', error.response?.data || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 4: Verificar estado después de desuscribirse
    console.log('4️⃣ Testing status after unsubscription...');
    
    try {
        const response = await axios.get(`${API_BASE_URL}/status`, {
            params: { email: 'test2@example.com' }
        });
        
        console.log('✅ Status after unsubscription:', response.data);
        
    } catch (error) {
        console.log('❌ Status check failed:', error.response?.data || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 5: Re-suscribir email previamente desuscrito
    console.log('5️⃣ Testing re-subscription...');
    
    try {
        const response = await axios.post(`${API_BASE_URL}/subscribe`, {
            email: 'test2@example.com',
            source: 'api-reactivation-test'
        });
        
        console.log('✅ Re-subscription successful:', response.data.message);
        
    } catch (error) {
        console.log('❌ Re-subscription failed:', error.response?.data || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 6: Rate limiting
    console.log('6️⃣ Testing rate limiting...');
    
    try {
        const promises = [];
        
        // Intentar 12 suscripciones rápidas (límite es 10 por hora)
        for (let i = 0; i < 12; i++) {
            promises.push(
                axios.post(`${API_BASE_URL}/subscribe`, {
                    email: `ratelimit${i}@example.com`,
                    source: 'rate-limit-test'
                }).catch(err => err.response)
            );
        }
        
        const results = await Promise.all(promises);
        const successful = results.filter(r => r.status === 201 || r.status === 409).length;
        const rateLimited = results.filter(r => r.status === 429).length;
        
        console.log(`✅ Rate limiting test complete:`);
        console.log(`   - Successful/duplicate requests: ${successful}`);
        console.log(`   - Rate limited requests: ${rateLimited}`);
        
    } catch (error) {
        console.log('❌ Rate limiting test failed:', error.message);
    }
    
    console.log('\n🎉 Newsletter API testing complete!');
}

// Ejecutar tests
testNewsletterEndpoints().catch(console.error);
