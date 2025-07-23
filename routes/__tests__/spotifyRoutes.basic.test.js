const request = require('supertest');
const express = require('express');
const spotifyRoutes = require('../spotifyRoutes');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/spotify', spotifyRoutes);

describe('Spotify API Basic Tests', () => {
  test('should respond to artist-info endpoint with missing URL', async () => {
    const response = await request(app)
      .post('/api/spotify/artist-info')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('URL_REQUIRED');
  });
  
  test('should respond to release-info endpoint with missing URL', async () => {
    const response = await request(app)
      .post('/api/spotify/release-info')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('URL_REQUIRED');
  });
  
  test('should validate URL format correctly', async () => {
    const response = await request(app)
      .post('/api/spotify/artist-info')
      .send({ url: 'not-a-url' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('INVALID_DOMAIN');
  });
});
