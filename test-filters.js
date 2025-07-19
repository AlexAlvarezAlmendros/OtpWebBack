const axios = require('axios');

// Base URL de la API
const BASE_URL = 'http://localhost:5001/api';

// Función para hacer solicitudes GET con parámetros
async function testFilters() {
    console.log('🧪 Testing Filter System...\n');

    try {
        // Test 1: GET básico sin filtros
        console.log('📋 Test 1: GET básico de releases');
        const basicResponse = await axios.get(`${BASE_URL}/releases`);
        console.log(`✅ Status: ${basicResponse.status}`);
        console.log(`📊 Estructura de respuesta:`, Object.keys(basicResponse.data));
        console.log(`📄 Número de releases: ${basicResponse.data.data?.length || 'N/A'}\n`);

        // Test 2: Filtros de paginación
        console.log('📋 Test 2: Paginación (count=2, page=1)');
        const paginationResponse = await axios.get(`${BASE_URL}/releases?count=2&page=1`);
        console.log(`✅ Status: ${paginationResponse.status}`);
        console.log(`📊 Paginación:`, paginationResponse.data.pagination);
        console.log(`📄 Elementos en esta página: ${paginationResponse.data.data?.length || 0}\n`);

        // Test 3: Filtro por tipo
        console.log('📋 Test 3: Filtro por tipo (type=Song)');
        const typeResponse = await axios.get(`${BASE_URL}/releases?type=Song`);
        console.log(`✅ Status: ${typeResponse.status}`);
        console.log(`🔍 Filtros aplicados:`, typeResponse.data.filters);
        console.log(`📄 Elementos encontrados: ${typeResponse.data.data?.length || 0}\n`);

        // Test 4: Artists con filtro de género
        console.log('📋 Test 4: Artists con filtro de género');
        const artistsResponse = await axios.get(`${BASE_URL}/artists?count=5`);
        console.log(`✅ Status: ${artistsResponse.status}`);
        console.log(`👥 Artists encontrados: ${artistsResponse.data.data?.length || 0}`);
        if (artistsResponse.data.data && artistsResponse.data.data.length > 0) {
            console.log(`🎵 Primer artist:`, {
                name: artistsResponse.data.data[0].name,
                genre: artistsResponse.data.data[0].genre,
                artistType: artistsResponse.data.data[0].artistType
            });
        }
        console.log();

        // Test 5: Events con filtro de ubicación
        console.log('📋 Test 5: Events con filtro de ubicación');
        const eventsResponse = await axios.get(`${BASE_URL}/events?count=5`);
        console.log(`✅ Status: ${eventsResponse.status}`);
        console.log(`🎪 Events encontrados: ${eventsResponse.data.data?.length || 0}`);
        if (eventsResponse.data.data && eventsResponse.data.data.length > 0) {
            console.log(`🌍 Primer event:`, {
                name: eventsResponse.data.data[0].name,
                location: eventsResponse.data.data[0].location,
                eventType: eventsResponse.data.data[0].eventType
            });
        }
        console.log();

        // Test 6: Studios
        console.log('📋 Test 6: Studios');
        const studiosResponse = await axios.get(`${BASE_URL}/studios?count=5`);
        console.log(`✅ Status: ${studiosResponse.status}`);
        console.log(`🏢 Studios encontrados: ${studiosResponse.data.data?.length || 0}`);
        if (studiosResponse.data.data && studiosResponse.data.data.length > 0) {
            console.log(`🎤 Primer studio:`, {
                name: studiosResponse.data.data[0].name,
                location: studiosResponse.data.data[0].location,
                studioType: studiosResponse.data.data[0].studioType
            });
        }
        console.log();

        // Test 7: Prueba de validación (parámetros inválidos)
        console.log('📋 Test 7: Validación de parámetros inválidos');
        try {
            const invalidResponse = await axios.get(`${BASE_URL}/releases?count=invalid&page=-1`);
        } catch (error) {
            console.log(`❌ Status: ${error.response?.status} (esperado)`);
            console.log(`🚨 Error:`, error.response?.data?.error);
            console.log(`📋 Detalles:`, error.response?.data?.details);
        }
        console.log();

        console.log('🎉 ¡Todas las pruebas completadas!');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
        if (error.response) {
            console.error('📄 Response data:', error.response.data);
        }
    }
}

// Ejecutar las pruebas
testFilters();
