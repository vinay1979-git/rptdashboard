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
      <li style="margin-bottom: 8px; color: #cbd5e1; font-size: 13px; line-height: 1.5;">
        ${h}
      </li>
    `
    )
    .join('');

  // 2. Sprint Progress HTML
  const sprintsHtml = payload.sprintProgress
    .map(
      s => `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 8px 0; color: #f8fafc; font-size: 12px; font-weight: bold; width: 40%;">${s.sprint}</td>
        <td style="padding: 8px 0; font-family: monospace; color: #38bdf8; font-size: 12px; text-align: right; width: 60%;">${getProgressBar(
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
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 8px 0; color: #f8fafc; font-size: 12px; font-weight: bold; width: 50%;">${g.goal}</td>
        <td style="padding: 8px 0; color: #cbd5e1; font-size: 12px; text-align: right; width: 50%;">${g.count} Features</td>
      </tr>
    `
    )
    .join('');

  // 4. Open Risks list
  const openRisksHtml = payload.openRisks
    .map(
      r => `
      <div style="background-color: #1e293b; border-left: 4px solid #f43f5e; border-radius: 6px; padding: 10px; margin-bottom: 8px; border-top: 1px solid #334155; border-right: 1px solid #334155; border-bottom: 1px solid #334155;">
        <div style="font-size: 12px; font-weight: bold; color: #f8fafc; margin-bottom: 4px;">#${r.Nbr} - ${r.Scope}</div>
        <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">${r.Description}</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">Status: <span style="color: #f43f5e; font-weight: bold;">Open</span> &bull; ${r['Status Date']}</div>
      </div>
    `
    )
    .join('');

  // 5. Mitigated Risks list
  const mitigatedRisksHtml = payload.mitigatedRisks
    .map(
      r => `
      <div style="background-color: #1e293b; border-left: 4px solid #10b981; border-radius: 6px; padding: 10px; margin-bottom: 8px; border-top: 1px solid #334155; border-right: 1px solid #334155; border-bottom: 1px solid #334155;">
        <div style="font-size: 12px; font-weight: bold; color: #f8fafc; margin-bottom: 4px;">#${r.Nbr} - ${r.Scope}</div>
        <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">${r.Description}</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">Status: <span style="color: #10b981; font-weight: bold;">Mitigated</span> &bull; Comments: ${r.Comments || 'N/A'}</div>
      </div>
    `
    )
    .join('');

  // 6. Features Breakdown List (Each title links to the live report detail view)
  const featuresHtml = payload.features
    .map(f => {
      let statusColor = '#38bdf8'; // In Progress
      if (f.status === 'Completed') statusColor = '#10b981';
      if (f.status === 'Not Picked Up') statusColor = '#e2e8f0';

      return `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 10px 8px; font-size: 12px; color: #94a3b8; font-family: monospace;">${f['Part id']}</td>
        <td style="padding: 10px 8px; font-size: 12px;">
          <a href="${reportUrl}" style="color: #38bdf8; text-decoration: none; font-weight: bold;">
            ${f.Name}
          </a>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Owner: ${f['Owner[0]']} &bull; Goal: ${f['Goal[0]']}</div>
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
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <div style="width: 100%; background-color: #0b0f19; padding: 24px 0;">
    
    <table cellpadding="0" cellspacing="0" border="0" width="600" style="margin: 0 auto; background-color: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border-collapse: collapse;">
      
      <!-- HEADER CARD (Includes hyperlink back to report detail view) -->
      <tr style="background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%);">
        <td style="padding: 32px 24px; text-align: center;">
          <a href="${reportUrl}" style="text-decoration: none; display: block;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 850; color: #ffffff; letter-spacing: -0.5px; text-align: center; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${title}</h1>
          </a>
          <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500; text-align: center;">Report generated on ${formattedDate} &bull; Status: <span style="color: #ffffff; font-weight: bold; text-decoration: underline;">Active</span></p>
        </td>
      </tr>

      <!-- BODY WRAPPER -->
      <tr>
        <td style="padding: 24px;">

          <!-- SUMMARY KPIS -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px; border-collapse: collapse;">
            <tr>
              <td width="48%" valign="top" style="background-color: #1e293b; border-radius: 12px; padding: 16px; border: 1px solid #334155; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: bold;">Completion Rate</div>
                <div style="font-size: 24px; font-weight: 800; margin: 4px 0; color: #38bdf8;">${payload.stats.completionPercentage}%</div>
                <div style="font-size: 10px; color: #10b981; font-weight: 600;">${payload.stats.completedFeatures} of ${payload.stats.totalFeatures} Features</div>
              </td>
              <td width="4%"></td>
              <td width="48%" valign="top" style="background-color: #1e293b; border-radius: 12px; padding: 16px; border: 1px solid #334155; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: bold;">Open Risks</div>
                <div style="font-size: 24px; font-weight: 800; margin: 4px 0; color: #f43f5e;">${payload.openRisks.length} Items</div>
                <div style="font-size: 10px; color: #94a3b8; font-weight: 600;">Mitigated: ${payload.mitigatedRisks.length} Items</div>
              </td>
            </tr>
          </table>

          <!-- MAJOR HIGHLIGHTS -->
          ${payload.highlights.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <div style="font-size: 14px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 12px;">Major Highlights & Achievements</div>
            <ul style="margin: 0; padding-left: 20px;">
              ${highlightsHtml}
            </ul>
          </div>
          ` : ''}

          <!-- SPRINT PROGRESS TRACKER -->
          ${payload.sprintProgress.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <div style="font-size: 14px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 12px;">Sprint Completion Progress</div>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
              ${sprintsHtml}
            </table>
          </div>
          ` : ''}

          <!-- GOALS ALIGNMENT -->
          ${payload.goalChartData.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <div style="font-size: 14px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 12px;">Capabilities by Business Goal</div>
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
                  <div style="font-size: 13px; font-weight: 800; color: #ffffff; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 12px;">Top Open Risks</div>
                  ${openRisksHtml || '<div style="font-size: 11px; color: #64748b; font-style: italic;">No active open risks.</div>'}
                </td>
                <td width="4%"></td>
                <td width="48%" valign="top">
                  <div style="font-size: 13px; font-weight: 800; color: #ffffff; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 12px;">Top Mitigated Risks</div>
                  ${mitigatedRisksHtml || '<div style="font-size: 11px; color: #64748b; font-style: italic;">No mitigated risks to show.</div>'}
                </td>
              </tr>
            </table>
          </div>

          <!-- FEATURES BREAKDOWN (EACH TITLE LINKS TO DETAIL PAGE) -->
          <div style="margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 12px;">Capabilities Status Details</div>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #334155;">
                  <th align="left" style="padding: 8px; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold; width: 20%;">ID</th>
                  <th align="left" style="padding: 8px; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold; width: 60%;">Feature Name</th>
                  <th align="right" style="padding: 8px; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold; width: 20%;">Status</th>
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
      <tr style="background-color: #090d16; border-top: 1px solid #1e293b;">
        <td style="padding: 24px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin: 0 0 8px 0;">This email summary was exported from <a href="${baseUrl}" style="color: #38bdf8; text-decoration: none; font-weight: bold;">rptdashboard</a>.</p>
          <p style="margin: 0;">For full task drill-downs and audit logs, please inspect the <a href="${reportUrl}" style="color: #38bdf8; text-decoration: none; font-weight: bold;">Interactive Dashboard</a> in your browser.</p>
        </td>
      </tr>

    </table>

  </div>
</body>
</html>
  `;
}
