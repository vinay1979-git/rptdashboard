export interface ReportMetrics {
  title: string;
  revenue: number;
  revenueGrowth: number;
  activeUsers: number;
  userGrowth: number;
  breakdown: Array<{
    region: string;
    users: number;
    revenue: number;
    conversion: number;
  }>;
}

/**
 * Generates the URL for the QuickChart Revenue Bar Chart
 */
export function getRevenueChartUrl(revenue: number): string {
  const scale = revenue / 44250;
  const revenueData = [12 * scale, 19 * scale, 32 * scale, 25 * scale, 42 * scale, 38 * scale].map(v => Math.round(v * 10) / 10);
  const targetData = [10 * scale, 15 * scale, 28 * scale, 30 * scale, 35 * scale, 35 * scale].map(v => Math.round(v * 10) / 10);

  const chartConfig = {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue ($k)',
          data: revenueData,
          backgroundColor: 'rgba(99, 102, 241, 0.85)', // Indigo
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
        {
          label: 'Target ($k)',
          data: targetData,
          backgroundColor: 'rgba(236, 72, 153, 0.45)', // Pink
          borderColor: 'rgba(236, 72, 153, 1)',
          borderWidth: 1,
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: 'Monthly Revenue vs Target',
        fontColor: '#ffffff',
        fontSize: 16,
      },
      legend: {
        labels: { fontColor: '#a5b4fc' }
      },
      scales: {
        yAxes: [{
          gridLines: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { fontColor: '#a5b4fc', beginAtZero: true }
        }],
        xAxes: [{
          gridLines: { display: false },
          ticks: { fontColor: '#a5b4fc' }
        }]
      }
    }
  };

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&bkg=%231e1e2f&w=600&h=300`;
}

/**
 * Generates the URL for the QuickChart User Growth Line Chart
 */
export function getUserGrowthChartUrl(activeUsers: number): string {
  const scale = activeUsers / 8420;
  const growthData = [1200 * scale, 3200 * scale, 5800 * scale, 8420 * scale].map(v => Math.round(v));

  const chartConfig = {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'New Signups',
          data: growthData,
          fill: true,
          backgroundColor: 'rgba(16, 185, 129, 0.1)', // Emerald
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          lineTension: 0.4,
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: 'User Growth (Weekly)',
        fontColor: '#ffffff',
        fontSize: 16,
      },
      legend: {
        labels: { fontColor: '#a5b4fc' }
      },
      scales: {
        yAxes: [{
          gridLines: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { fontColor: '#a5b4fc' }
        }],
        xAxes: [{
          gridLines: { display: false },
          ticks: { fontColor: '#a5b4fc' }
        }]
      }
    }
  };

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&bkg=%231e1e2f&w=600&h=300`;
}

/**
 * Compiles the dynamic metrics into email-safe styled HTML
 */
export function generateReportHtml(data: ReportMetrics): string {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const revChartUrl = getRevenueChartUrl(data.revenue);
  const userChartUrl = getUserGrowthChartUrl(data.activeUsers);

  // Generate Table Rows
  const tableRowsHtml = data.breakdown
    .map((row, index) => {
      const isEven = index % 2 === 1;
      const bgStyle = isEven ? 'background-color: #111827;' : '';
      return `
        <tr style="${bgStyle}">
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; color: #cbd5e1; font-weight: bold;">${row.region}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; color: #cbd5e1;">${row.users.toLocaleString()}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; color: #cbd5e1;">$${row.revenue.toLocaleString()}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #1e293b; color: #38bdf8;">${row.conversion}%</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <div class="wrapper" style="width: 100%; background-color: #0b0f19; padding: 24px 0;">
    <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
      
      <!-- Header -->
      <div class="header" style="background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${data.title}</h1>
        <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px; font-weight: 500;">Report generated on ${formattedDate} &bull; Status: <span style="color: #10b981; font-weight: bold;">Active</span></p>
      </div>

      <!-- Content -->
      <div class="content" style="padding: 24px;">
        
        <!-- KPI Cards Grid -->
        <table class="kpi-grid" width="100%" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td width="48%" valign="top">
              <div class="kpi-card" style="background-color: #1e293b; border-radius: 12px; padding: 16px; border: 1px solid #334155; text-align: center;">
                <div class="kpi-label" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Total Revenue</div>
                <div class="kpi-val" style="font-size: 24px; font-weight: 700; margin: 4px 0; color: #38bdf8;">$${data.revenue.toLocaleString()}</div>
                <div class="kpi-trend trend-up" style="font-size: 12px; font-weight: 600; color: #10b981;">▲ ${data.revenueGrowth}% vs last month</div>
              </div>
            </td>
            <td width="4%"></td>
            <td width="48%" valign="top">
              <div class="kpi-card" style="background-color: #1e293b; border-radius: 12px; padding: 16px; border: 1px solid #334155; text-align: center;">
                <div class="kpi-label" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Active Users</div>
                <div class="kpi-val" style="font-size: 24px; font-weight: 700; margin: 4px 0; color: #38bdf8;">${data.activeUsers.toLocaleString()}</div>
                <div class="kpi-trend trend-up" style="font-size: 12px; font-weight: 600; color: #10b981;">▲ ${data.userGrowth}% vs last week</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Chart 1 Section -->
        <div class="section-title" style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 24px 0 12px 0; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">Performance Analytics</div>
        
        <div class="chart-container" style="background-color: #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; border: 1px solid #334155;">
          <img src="${revChartUrl}" alt="Revenue Chart" class="chart-img" style="max-width: 100%; height: auto; border-radius: 6px;" />
        </div>

        <div class="chart-container" style="background-color: #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; border: 1px solid #334155;">
          <img src="${userChartUrl}" alt="User Growth Chart" class="chart-img" style="max-width: 100%; height: auto; border-radius: 6px;" />
        </div>

        <!-- Data Table Section -->
        <div class="section-title" style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 24px 0 12px 0; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">Breakdown by Region</div>
        
        <table class="data-table" style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
          <thead>
            <tr>
              <th style="background-color: #1e293b; color: #94a3b8; text-align: left; padding: 10px 12px; font-weight: 600; border-bottom: 2px solid #334155;">Region</th>
              <th style="background-color: #1e293b; color: #94a3b8; text-align: left; padding: 10px 12px; font-weight: 600; border-bottom: 2px solid #334155;">Active Users</th>
              <th style="background-color: #1e293b; color: #94a3b8; text-align: left; padding: 10px 12px; font-weight: 600; border-bottom: 2px solid #334155;">Revenue</th>
              <th style="background-color: #1e293b; color: #94a3b8; text-align: left; padding: 10px 12px; font-weight: 600; border-bottom: 2px solid #334155;">Conversion</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

      </div>

      <!-- Footer -->
      <div class="footer" style="background-color: #090d16; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b;">
        <p style="margin: 0 0 10px 0;">This is an automated system-generated report from rptdashboard.</p>
        <p style="margin: 0;">
          <a href="#" style="color: #38bdf8; text-decoration: none;">Dashboard Web Console</a> &bull; 
          <a href="#" style="color: #38bdf8; text-decoration: none;">Manage Subscriptions</a> &bull; 
          <a href="#" style="color: #38bdf8; text-decoration: none;">Privacy Settings</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
}
