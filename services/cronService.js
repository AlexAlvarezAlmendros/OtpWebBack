const cron = require('node-cron');
const Newsletter = require('../models/Newsletter');
const EmailService = require('./emailService');
const emailService = new EmailService();

const initCronJobs = () => {
  // Execute every minute for debugging
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    console.log('⏰ Running scheduled newsletter check at:', now.toISOString());
    try {
      console.log('   🔍 Connecting to database...');
      
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
        try {
          console.log(`   📤 Processing newsletter: ${news.title} (${news._id})`);
          
          // Send email
          console.log(`   📧 Sending email for newsletter: ${news.title}`);
          await emailService.sendNewsletter(news);
          console.log(`   ✉️ Email sent successfully for: ${news.title}`);
          
          // Update status
          news.status = 'sent';
          news.sentAt = new Date();
          await news.save();
          
          console.log(`   ✅ Newsletter sent and updated: ${news.title}`);
        } catch (newsletterError) {
          console.error(`   ❌ Error processing newsletter ${news.title}:`, newsletterError);
          console.error(`   ❌ Error stack:`, newsletterError.stack);
          // Don't break the loop, continue with next newsletter
        }
      }
      
      console.log('   ✅ Cron job completed successfully');
    } catch (error) {
      console.error('❌ Error in newsletter cron job:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error name:', error.name);
    }
  });
  
  console.log('✅ Cron jobs initialized - Running every minute for debugging');
};

module.exports = { initCronJobs };
