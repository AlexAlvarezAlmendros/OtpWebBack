const request = require('supertest');
const express = require('express');
const spotifyRoutes = require('../spotifyRoutes');

// Mock del SpotifyService
jest.mock('../../services/spotifyService');

const app = express();
app.use(express.json());
app.use('/api/spotify', spotifyRoutes);

describe('Spotify Routes Integration Tests', () => {
  
  describe('POST /api/spotify/artist-info', () => {
    test('should import artist data successfully', async () => {
      const validArtistUrl = 'https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY';
      
      const response = await request(app)
        .post('/api/spotify/artist-info')
        .send({ url: validArtistUrl });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('source', 'spotify');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('genre');
      expect(response.body.data).toHaveProperty('img');
      expect(response.body.data).toHaveProperty('spotifyLink');
    });
    
    test('should reject request without URL', async () => {
      const response = await request(app)
        .post('/api/spotify/artist-info')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URL_REQUIRED');
    });
    
    test('should reject invalid URL format', async () => {
      const response = await request(app)
        .post('/api/spotify/artist-info')
        .send({ url: 'https://invalid-site.com/artist/123' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_DOMAIN');
    });
    
    test('should reject non-artist URLs', async () => {
      const albumUrl = 'https://open.spotify.com/album/1A2GTWGtFfWp7KSQTwWOyo';
      
      const response = await request(app)
        .post('/api/spotify/artist-info')
        .send({ url: albumUrl });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_URL_TYPE');
    });
    
    test('should handle URL that is too long', async () => {
      const longUrl = 'https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY?' + 'x'.repeat(1000);
      
      const response = await request(app)
        .post('/api/spotify/artist-info')
        .send({ url: longUrl });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URL_TOO_LONG');
    });
    
    test('should sanitize malicious input', async () => {
      const maliciousUrl = 'https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/spotify/artist-info')
        .send({ url: maliciousUrl });
      
      // Should still process the URL after sanitization
      expect(response.status).toBe(200);
    });
  });
  
  describe('POST /api/spotify/release-info', () => {
    test('should import release data successfully', async () => {
      const validAlbumUrl = 'https://open.spotify.com/album/1A2GTWGtFfWp7KSQTwWOyo';
      
      const response = await request(app)
        .post('/api/spotify/release-info')
        .send({ url: validAlbumUrl });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('source', 'spotify');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('artist');
      expect(response.body.data).toHaveProperty('date');
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('spotifyLink');
    });
    
    test('should reject non-album URLs', async () => {
      const artistUrl = 'https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY';
      
      const response = await request(app)
        .post('/api/spotify/release-info')
        .send({ url: artistUrl });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_URL_TYPE');
    });
    
    test('should map release types correctly', async () => {
      const validAlbumUrl = 'https://open.spotify.com/album/1A2GTWGtFfWp7KSQTwWOyo';
      
      const response = await request(app)
        .post('/api/spotify/release-info')
        .send({ url: validAlbumUrl });
      
      expect(response.status).toBe(200);
      expect(['Album', 'Song']).toContain(response.body.data.type);
    });
  });
  
  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      const validUrl = 'https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY';
      
      // Make 11 requests quickly (exceeding the 10 request limit)
      const requests = [];
      for (let i = 0; i < 11; i++) {
        requests.push(
          request(app)
            .post('/api/spotify/artist-info')
            .send({ url: validUrl })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body.error).toBe('RATE_LIMIT_EXCEEDED');
      }
    });
  });
  
  describe('Error Handling', () => {
    test('should handle invalid Spotify URLs gracefully', async () => {
      const invalidUrl = 'https://open.spotify.com/invalid/123';
      
      const response = await request(app)
        .post('/api/spotify/artist-info')
        .send({ url: invalidUrl });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    test('should handle network errors', async () => {
      // This would require mocking the SpotifyService to throw network errors
      // Implementation depends on how you want to simulate network failures
    });
  });
});
