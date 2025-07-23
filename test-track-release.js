const axios = require('axios');

async function testTrackRelease() {
  try {
    console.log('🧪 Testing track release endpoint...');
    
    const testUrl = 'https://open.spotify.com/intl-es/track/7vsOrcyJk9KRI3LEMUwj4f?si=dfe12ee382ef4511';
    
    const response = await axios.post('http://localhost:5001/api/spotify/release-info', {
      spotifyUrl: testUrl
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Request successful!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Request failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Función para probar también con un álbum
async function testAlbumRelease() {
  try {
    console.log('\n🧪 Testing album release endpoint...');
    
    const testUrl = 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy';
    
    const response = await axios.post('http://localhost:5001/api/spotify/release-info', {
      spotifyUrl: testUrl
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Request successful!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Request failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function runTests() {
  await testTrackRelease();
  await testAlbumRelease();
}

runTests();
