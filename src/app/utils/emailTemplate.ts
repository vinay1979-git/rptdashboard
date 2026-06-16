import { ReportPayload } from './reportEngine';

function getProgressBar(percentage: number): string {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
}

/**
 * Generates an email-safe inline-styled HTML string for copy-pasting directly into Gmail or Outlook.
 */
export function generateGmailReportHtml(
  reportId: string,
  title: string,
  formattedDate: string,
  payload: ReportPayload
): string {
  const baseUrl = 'https://rptdashboard.vercel.app';
  const reportUrl = `${baseUrl}/report/${reportId}`;

  // 1. Highlights list HTML
  const highlightsHtml = payload.highlights
    .map(
      h => `
      <li style="margin-bottom: 8px; color: #030522; font-size: 13px; line-height: 1.5;">
        ${h}
      </li>
    `
    )
    .join('');

  // 2. Sprint Progress HTML
  const sprintsHtml = payload.sprintProgress
    .map(
      s => `
      <tr style="border-bottom: 1px solid #E6E9EF;">
        <td style="padding: 8px 0; color: #030522; font-size: 12px; font-weight: bold; width: 40%;">${s.sprint}</td>
        <td style="padding: 8px 0; font-family: monospace; color: #3B42C4; font-size: 12px; text-align: right; width: 60%;">${getProgressBar(
          s.percentage
        )} (${s.completed}/${s.total})</td>
      </tr>
    `
    )
    .join('');

  // 3. Goal aggregation progress (Recharts fallback text blocks)
  const goalsHtml = payload.goalChartData
    .map(
      g => `
      <tr style="border-bottom: 1px solid #E6E9EF;">
        <td style="padding: 8px 0; color: #030522; font-size: 12px; font-weight: bold; width: 50%;">${g.goal}</td>
        <td style="padding: 8px 0; color: #6F7C95; font-size: 12px; text-align: right; width: 50%;">${g.count} Features</td>
      </tr>
    `
    )
    .join('');

  // 4. Open Risks list
  const openRisksHtml = payload.openRisks
    .map(
      r => `
      <div style="background-color: #F9FAFC; border-left: 4px solid #ef4444; border-radius: 6px; padding: 10px; margin-bottom: 8px; border-top: 1px solid #E6E9EF; border-right: 1px solid #E6E9EF; border-bottom: 1px solid #E6E9EF;">
        <div style="font-size: 12px; font-weight: bold; color: #030522; margin-bottom: 4px;">#${r.Nbr} - ${r.Scope}</div>
        <div style="font-size: 11px; color: #030522; line-height: 1.4;">${r.Description}</div>
        <div style="font-size: 10px; color: #6F7C95; margin-top: 6px;">Status: <span style="color: #ef4444; font-weight: bold;">Open</span> &bull; ${r['Status Date']}</div>
      </div>
    `
    )
    .join('');

  // 5. Mitigated Risks list
  const mitigatedRisksHtml = payload.mitigatedRisks
    .map(
      r => `
      <div style="background-color: #F9FAFC; border-left: 4px solid #10b981; border-radius: 6px; padding: 10px; margin-bottom: 8px; border-top: 1px solid #E6E9EF; border-right: 1px solid #E6E9EF; border-bottom: 1px solid #E6E9EF;">
        <div style="font-size: 12px; font-weight: bold; color: #030522; margin-bottom: 4px;">#${r.Nbr} - ${r.Scope}</div>
        <div style="font-size: 11px; color: #030522; line-height: 1.4;">${r.Description}</div>
        <div style="font-size: 10px; color: #6F7C95; margin-top: 6px;">Status: <span style="color: #10b981; font-weight: bold;">Mitigated</span> &bull; Comments: ${r.Comments || 'N/A'}</div>
      </div>
    `
    )
    .join('');

  // 6. Features Breakdown List (Each title links to the live report detail view)
  const featuresHtml = payload.features
    .map(f => {
      let statusColor = '#030522'; // In Progress
      if (f.status === 'Completed') statusColor = '#10b981';
      if (f.status === 'Not Picked Up') statusColor = '#6F7C95';

      return `
      <tr style="border-bottom: 1px solid #E6E9EF;">
        <td style="padding: 10px 8px; font-size: 12px; color: #6F7C95; font-family: monospace;">${f['Part id']}</td>
        <td style="padding: 10px 8px; font-size: 12px;">
          <a href="${reportUrl}" style="color: #3B42C4; text-decoration: none; font-weight: bold;">
            ${f.Name}
          </a>
          <div style="font-size: 10px; color: #6F7C95; margin-top: 2px;">Owner: ${f['Owner[0]']} &bull; Goal: ${f['Goal[0]']}</div>
        </td>
        <td style="padding: 10px 8px; font-size: 11px; text-align: right; font-weight: bold; color: ${statusColor};">${f.status}</td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Product Reporting Export</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFC; color: #030522; -webkit-font-smoothing: antialiased;">
  <div style="width: 100%; background-color: #F9FAFC; padding: 24px 0;">
    
    <table cellpadding="0" cellspacing="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #E6E9EF; box-shadow: 0 10px 25px -5px rgba(3, 5, 34, 0.05); border-collapse: collapse;">
      
      <!-- HEADER LOGO CARD -->
      <tr style="background-color: #ffffff; border-bottom: 1px solid #E6E9EF;">
        <td style="padding: 24px 24px; text-align: left;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="left" style="vertical-align: middle;">
                <img src="https://lentra.ai/favicon.ico" alt="Lentra" style="height: 32px; width: auto; display: block;" />
              </td>
              <td align="right" style="vertical-align: middle;">
                <span style="color: #6F7C95; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Product status export</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- TITLE CARD -->
      <tr style="background-color: #ffffff;">
        <td style="padding: 24px 24px 8px 24px;">
          <a href="${reportUrl}" style="text-decoration: none; display: block;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #030522; letter-spacing: -0.5px;">Product Reporting Export</h1>
          </a>
          <p style="margin: 6px 0 0 0; color: #6F7C95; font-size: 12px; font-weight: 500;">Report: ${title} &bull; Generated on ${formattedDate}</p>
        </td>
      </tr>

      <!-- BODY WRAPPER -->
      <tr>
        <td style="padding: 24px;">

          <!-- SUMMARY KPIS -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px; border-collapse: collapse;">
            <tr>
              <td width="48%" valign="top" style="background-color: #F9FAFC; border-radius: 6px; padding: 16px; border: 1px solid #E6E9EF; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6F7C95; font-weight: bold;">Completion Rate</div>
                <div style="font-size: 24px; font-weight: 800; margin: 4px 0; color: #030522;">${payload.stats.completionPercentage}%</div>
                <div style="font-size: 10px; color: #10b981; font-weight: 600;">${payload.stats.completedFeatures} of ${payload.stats.totalFeatures} Features</div>
              </td>
              <td width="4%"></td>
              <td width="48%" valign="top" style="background-color: #F9FAFC; border-radius: 6px; padding: 16px; border: 1px solid #E6E9EF; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6F7C95; font-weight: bold;">Open Risks</div>
                <div style="font-size: 24px; font-weight: 800; margin: 4px 0; color: #ef4444;">${payload.openRisks.length} Items</div>
                <div style="font-size: 10px; color: #6F7C95; font-weight: 600;">Mitigated: ${payload.mitigatedRisks.length} Items</div>
              </td>
            </tr>
          </table>

          <!-- MAJOR HIGHLIGHTS -->
          ${payload.highlights.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <div style="font-size: 14px; font-weight: 800; color: #030522; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E6E9EF; padding-bottom: 6px; margin-bottom: 12px;">Major Highlights & Achievements</div>
            <ul style="margin: 0; padding-left: 20px;">
              ${highlightsHtml}
            </ul>
          </div>
          ` : ''}

          <!-- SPRINT PROGRESS TRACKER -->
          ${payload.sprintProgress.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <div style="font-size: 14px; font-weight: 800; color: #030522; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E6E9EF; padding-bottom: 6px; margin-bottom: 12px;">Sprint Completion Progress</div>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
              ${sprintsHtml}
            </table>
          </div>
          ` : ''}

          <!-- GOALS ALIGNMENT -->
          ${payload.goalChartData.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <div style="font-size: 14px; font-weight: 800; color: #030522; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E6E9EF; padding-bottom: 6px; margin-bottom: 12px;">Capabilities by Business Goal</div>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
              ${goalsHtml}
            </table>
          </div>
          ` : ''}

          <!-- OPEN RISKS & MITIGATED SECTION -->
          <div style="margin-bottom: 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
              <tr>
                <td width="48%" valign="top">
                  <div style="font-size: 13px; font-weight: 800; color: #030522; border-bottom: 1px solid #E6E9EF; padding-bottom: 6px; margin-bottom: 12px;">Top Open Risks</div>
                  ${openRisksHtml || '<div style="font-size: 11px; color: #6F7C95; font-style: italic;">No active open risks.</div>'}
                </td>
                <td width="4%"></td>
                <td width="48%" valign="top">
                  <div style="font-size: 13px; font-weight: 800; color: #030522; border-bottom: 1px solid #E6E9EF; padding-bottom: 6px; margin-bottom: 12px;">Top Mitigated Risks</div>
                  ${mitigatedRisksHtml || '<div style="font-size: 11px; color: #6F7C95; font-style: italic;">No mitigated risks to show.</div>'}
                </td>
              </tr>
            </table>
          </div>

          <!-- FEATURES BREAKDOWN -->
          <div style="margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 800; color: #030522; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E6E9EF; padding-bottom: 6px; margin-bottom: 12px;">Capabilities Status Details</div>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #E6E9EF;">
                  <th align="left" style="padding: 8px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; width: 20%;">ID</th>
                  <th align="left" style="padding: 8px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; width: 60%;">Feature Name</th>
                  <th align="right" style="padding: 8px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; width: 20%;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${featuresHtml}
              </tbody>
            </table>
          </div>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr style="background-color: #F9FAFC; border-top: 1px solid #E6E9EF;">
        <td style="padding: 24px; text-align: center; font-size: 11px; color: #6F7C95;">
          <p style="margin: 0 0 8px 0;">This email summary was exported from <a href="${baseUrl}" style="color: #3B42C4; text-decoration: none; font-weight: bold;">Product Reporting Dashboard</a>.</p>
          <p style="margin: 0;">For full task drill-downs and audit logs, please inspect the <a href="${reportUrl}" style="color: #3B42C4; text-decoration: none; font-weight: bold;">Interactive Dashboard</a> in your browser.</p>
        </td>
      </tr>

    </table>

  </div>
</body>
</html>
  `;
}
