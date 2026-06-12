import { ChartService } from './chartService';
import { EmailService } from './emailService';
import { TemplateService, DashboardData } from './templateService';
import { config } from './config';

async function main() {
  console.log('🚀 Initializing Reporting Dashboard email generator...');

  try {
    // 1. Prepare Mock Data (In production, you would fetch this from a database/API)
    const reportData: DashboardData = {
      title: 'Executive Weekly Report',
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      metrics: {
        revenue: 44250,
        revenueGrowth: 12.4,
        activeUsers: 8420,
        userGrowth: 8.7,
      },
      breakdown: [
        { region: 'North America', users: 4120, revenue: 21500, conversion: 3.4 },
        { region: 'Europe', users: 2850, revenue: 14800, conversion: 2.9 },
        { region: 'Asia-Pacific', users: 1150, revenue: 6200, conversion: 2.1 },
        { region: 'Latin America', users: 300, revenue: 1750, conversion: 1.8 },
      ],
    };

    // 2. Generate Chart Image Buffers
    console.log('📊 Generating dashboard charts...');
    const revenueChartBuffer = await ChartService.generateRevenueChart();
    const userGrowthChartBuffer = await ChartService.generateUserGrowthChart();

    // 3. Render HTML Email Template
    console.log('🎨 Compiling email templates...');
    const htmlEmailContent = TemplateService.renderDashboard(reportData);

    // 4. Send Email
    const targetEmail = config.email.to || 'test-dashboard@example.com';
    console.log(`✉️ Preparing to send email report to: ${targetEmail}...`);

    await EmailService.sendReport({
      to: targetEmail,
      subject: `📊 [rptdashboard] Weekly Report - ${reportData.date}`,
      htmlContent: htmlEmailContent,
      attachments: [
        {
          filename: 'revenue_chart.png',
          content: revenueChartBuffer,
          cid: 'revenueChart',
        },
        {
          filename: 'user_growth_chart.png',
          content: userGrowthChartBuffer,
          cid: 'userGrowthChart',
        },
      ],
    });

    console.log('🏁 Process completed successfully!');
  } catch (error) {
    console.error('❌ An error occurred during report generation:', error);
    process.exit(1);
  }
}

// Run the script
main();
