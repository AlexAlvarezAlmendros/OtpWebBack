const cron = require('node-cron');
const Newsletter = require('../models/Newsletter');
const EmailService = require('./emailService');
const emailService = new EmailService();

const initCronJobs = () => {
  // Execute every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    console.log('⏰ Running scheduled newsletter check at:', now.toISOString());
    try {
      const newslettersToSend = await Newsletter.find({
        status: 'scheduled',
        scheduledAt: { $lte: now }
      }).populate('content.uniqueBeats content.upcomingReleases content.events');

      console.log(`   📊 Found ${newslettersToSend.length} scheduled newsletter(s) to send.`);
      
      if (newslettersToSend.length > 0) {
        console.log('   📋 Newsletters details:');
        newslettersToSend.forEach(n => {
          console.log(`      - "${n.title}" (ID: ${n._id}) scheduled for ${n.scheduledAt.toISOString()}`);
        });
      }

      for (const news of newslettersToSend) {
        console.log(`   📤 Processing newsletter: ${news.title} (${news._id})`);
        
        // Send email
        await emailService.sendNewsletter(news);
        
        // Update status
        news.status = 'sent';
        news.sentAt = new Date();
        await news.save();
        
        console.log(`   ✅ Newsletter sent and updated: ${news.title}`);
      }
    } catch (error) {
      console.error('❌ Error in newsletter cron job:', error);
    }
  });
  
  console.log('✅ Cron jobs initialized - Running every hour');
};

module.exports = { initCronJobs };
