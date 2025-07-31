// Test script for the new artist releases endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/releases';

async function testArtistReleasesEndpoint() {
    try {
        console.log('🧪 Testing Artist Releases Endpoint\n');

        // Test 1: Search for an artist
        console.log('1. Searching for releases with artist "Example Artist"...');
        const response1 = await axios.get(`${BASE_URL}/artist/Example Artist`);
        
        console.log('Status:', response1.status);
        console.log('Results found:', response1.data.pagination.total);
        console.log('Pagination info:', response1.data.pagination);
        console.log('Message:', response1.data.message);
        console.log('---');

        // Test 2: Search with pagination
        console.log('2. Searching with pagination (page 1, limit 5)...');
        const response2 = await axios.get(`${BASE_URL}/artist/Example Artist?page=1&limit=5`);
        
        console.log('Status:', response2.status);
        console.log('Page:', response2.data.pagination.page);
        console.log('Limit:', response2.data.pagination.limit);
        console.log('Total pages:', response2.data.pagination.pages);
        console.log('Has next page:', response2.data.pagination.hasNext);
        console.log('---');

        // Test 3: Search for non-existent artist
        console.log('3. Searching for non-existent artist...');
        const response3 = await axios.get(`${BASE_URL}/artist/NonExistentArtist123`);
        
        console.log('Status:', response3.status);
        console.log('Results found:', response3.data.pagination.total);
        console.log('Message:', response3.data.message);
        console.log('---');

        // Test 4: Search with special characters (URL encoded)
        console.log('4. Searching for artist with special characters...');
        const artistName = encodeURIComponent('Artist & Friends');
        const response4 = await axios.get(`${BASE_URL}/artist/${artistName}`);
        
        console.log('Status:', response4.status);
        console.log('Searching for:', decodeURIComponent(artistName));
        console.log('Results found:', response4.data.pagination.total);
        console.log('---');

        console.log('✅ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Error testing endpoint:', error.response?.data || error.message);
    }
}

// Run the test
if (require.main === module) {
    testArtistReleasesEndpoint();
}

module.exports = { testArtistReleasesEndpoint };
