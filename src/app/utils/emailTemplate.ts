import { ReportPayload, RiskIssueData } from './reportEngine';

/**
 * Generates an email-safe inline-styled HTML string for copy-pasting directly into Gmail or Outlook.
 */
export function generateGmailReportHtml(
  reportId: string,
  title: string,
  formattedDate: string,
  payload: ReportPayload,
  report?: any
): string {
  const baseUrl = 'https://rptdashboard.vercel.app';
  const reportUrl = `${baseUrl}/report/${reportId}`;

  // 1. Data Preparation
  const getRagPriority = (status?: string) => {
    if (!status) return 4;
    const lower = status.toLowerCase();
    if (lower.includes('red') || lower === 'r') return 1;
    if (lower.includes('amber') || lower === 'a') return 2;
    if (lower.includes('green') || lower === 'g') return 3;
    return 4;
  };

  const getRagDisplay = (status?: string) => {
    if (!status) return '-';
    const lower = status.toLowerCase();
    if (lower.includes('red') || lower === 'r') return '🔴 Red';
    if (lower.includes('amber') || lower === 'a') return '🟠 Amber';
    if (lower.includes('green') || lower === 'g') return '🟢 Green';
    return status;
  };

  // Sort features_data by RAG Status
  const featuresList = [...(payload.features || [])];
  featuresList.sort((a, b) => {
    const priorityA = getRagPriority(a.ragStatus);
    const priorityB = getRagPriority(b.ragStatus);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return (a.Name || '').localeCompare(b.Name || '');
  });

  // Calculate sprintProgress as the average percentageComplete of all features
  const totalFeaturesCount = featuresList.length;
  const sprintProgress = totalFeaturesCount > 0
    ? featuresList.reduce((acc, f) => acc + (f.percentageComplete || 0), 0) / totalFeaturesCount
    : 0;

  // Calculate new feature metrics
  const totalFeatures = featuresList.length;
  const featuresOnTrack = featuresList.filter(f => f.ragStatus?.toLowerCase().includes('green')).length;
  const featuresAtRisk = featuresList.filter(f => f.ragStatus?.toLowerCase().includes('amber')).length;

  // Slice risks_data and issues_data to only the Top 3 items
  const risksList: RiskIssueData[] = (report?.risks_data || []).slice(0, 3);
  const issuesList: RiskIssueData[] = (report?.issues_data || []).slice(0, 3);

  // Filter and count active risks (status is NOT 'Closed', 'Resolved', 'Completed', or 'Mitigated')
  const activeRisksCount = (report?.risks_data || []).filter((risk: any) => {
    const statusVal = risk.Status || risk.status || 'open';
    return !['closed', 'resolved', 'completed', 'mitigated'].includes(statusVal.toLowerCase());
  }).length;

  // Extract report_type
  const report_type = report?.report_type || 'Product Grow report';

  // Group and count capabilities by their goalOutcome (or Business Outcome)
  const outcomeCounts: { [key: string]: number } = {};
  featuresList.forEach(f => {
    const outcome = f.goalOutcome || f['Goal[0]'] || 'Unassigned';
    outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
  });

  // Sort them from highest count to lowest
  const sortedOutcomes = Object.entries(outcomeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Find the maximum count to act as the 100% width baseline
  const maxCount = sortedOutcomes.length > 0
    ? Math.max(...sortedOutcomes.map(o => o.count))
    : 1;

  // Major highlights HTML
  const highlightsHtml = payload.highlights
    .map(
      h => `
      <li style="margin-bottom: 8px; color: #030522; font-size: 13px; line-height: 1.5; font-family: Arial, sans-serif;">
        ${h}
      </li>
    `
    )
    .join('');

  return `
<div style="background-color: #F9FAFC; padding: 40px 20px; font-family: Arial, sans-serif; color: #030522;">
  <div style="max-width: 700px; background-color: #ffffff; border: 1px solid #E6E9EF; border-radius: 8px; margin: 0 auto; box-shadow: 0 4px 12px rgba(3, 5, 34, 0.03); overflow: hidden;">
    
    <!-- Header -->
    <div style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #E6E9EF;">
      <img src="https://lentra.ai/favicon.ico" height="32" style="display:block; margin-bottom: 16px;" alt="Lentra Logo" />
      <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: bold; color: #030522; font-family: Arial, sans-serif;">${report_type} - Executive Summary</h2>
      <p style="margin: 0; color: #6F7C95; font-size: 12px; font-family: Arial, sans-serif;">Report: ${title} &bull; Generated on ${formattedDate}</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px;">

      <!-- Executive KPI Dashboard (HTML Visual Progress Bar) -->
      <div style="margin-bottom: 32px; font-family: Arial, sans-serif;">
        <p style="color: #6F7C95; font-size: 14px; margin-bottom: 8px; font-family: Arial, sans-serif;">Overall Sprint Progress: <strong style="color: #3B42C4;">${Math.round(sprintProgress)}%</strong></p>
        <div style="width: 100%; background-color: #E6E9EF; border-radius: 4px; height: 16px; margin-bottom: 24px; overflow: hidden;">
          <div style="width: ${Math.round(sprintProgress)}%; background-color: #3B42C4; border-radius: 4px; height: 16px;"></div>
        </div>

        <!-- Summary Grid Table -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr>
            <td width="30%" valign="top" style="background-color: #F9FAFC; border: 1px solid #E6E9EF; border-radius: 6px; padding: 16px; text-align: center; font-family: Arial, sans-serif;">
              <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6F7C95; font-weight: bold;">Total Features</div>
              <div style="font-size: 24px; font-weight: bold; margin-top: 6px; color: #030522;">${totalFeatures}</div>
            </td>
            <td width="5%"></td>
            <td width="30%" valign="top" style="background-color: #F9FAFC; border: 1px solid #E6E9EF; border-radius: 6px; padding: 16px; text-align: center; font-family: Arial, sans-serif;">
              <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6F7C95; font-weight: bold;">Features on track</div>
              <div style="font-size: 24px; font-weight: bold; margin-top: 6px; color: #030522;">${featuresOnTrack}</div>
            </td>
            <td width="5%"></td>
            <td width="30%" valign="top" style="background-color: #F9FAFC; border: 1px solid #E6E9EF; border-radius: 6px; padding: 16px; text-align: center; font-family: Arial, sans-serif;">
              <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6F7C95; font-weight: bold;">Features at risk</div>
              <div style="font-size: 24px; font-weight: bold; margin-top: 6px; color: #030522;">${featuresAtRisk}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Capabilities by Business Outcome Chart -->
      <div style="margin-bottom: 32px; font-family: Arial, sans-serif;">
        <h3 style="font-size: 15px; font-weight: bold; color: #030522; border-bottom: 1px solid #E6E9EF; padding-bottom: 8px; margin-bottom: 16px; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Capabilities by Business Outcome</h3>
        ${sortedOutcomes.map(o => {
          const outcomeName = o.name;
          const count = o.count;
          return `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #6F7C95; margin-bottom: 4px;">
              <span>${outcomeName}</span>
              <strong>${count}</strong>
            </div>
            <div style="width: 100%; background-color: #E6E9EF; border-radius: 4px; height: 12px;">
              <div style="width: ${(count / maxCount) * 100}%; background-color: #3B42C4; border-radius: 4px; height: 12px;"></div>
            </div>
          </div>
          `;
        }).join('')}
      </div>


      <!-- Highlights -->
      ${payload.highlights.length > 0 ? `
      <div style="margin-bottom: 32px; font-family: Arial, sans-serif;">
        <h3 style="font-size: 15px; font-weight: bold; color: #030522; border-bottom: 1px solid #E6E9EF; padding-bottom: 8px; margin-bottom: 12px; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Major Highlights & Achievements</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${highlightsHtml}
        </ul>
      </div>
      ` : ''}

      <!-- Capabilities & Features (RAG Prioritized) -->
      <div style="margin-bottom: 32px; font-family: Arial, sans-serif;">
        <h3 style="font-size: 15px; font-weight: bold; color: #030522; border-bottom: 1px solid #E6E9EF; padding-bottom: 8px; margin-bottom: 12px; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Capabilities Status Details</h3>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; width: 100%; border: 1px solid #E6E9EF; font-family: Arial, sans-serif;">
          <thead>
            <tr style="background-color: #F9FAFC; border-bottom: 1px solid #E6E9EF;">
              <th align="left" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; border-right: 1px solid #E6E9EF;">Part ID</th>
              <th align="left" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; border-right: 1px solid #E6E9EF;">Feature Name</th>
              <th align="left" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; border-right: 1px solid #E6E9EF;">RAG Status</th>
              <th align="center" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; border-right: 1px solid #E6E9EF; text-align: center; width: 12%;">% Complete</th>
              <th align="left" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif;">Reason</th>
            </tr>
          </thead>
          <tbody>
            ${featuresList.map(f => {
              const partIdStr = f.partId || f.devRevId || f['Part id'] || '';
              return `
                <tr style="border-bottom: 1px solid #E6E9EF;">
                  <td style="padding: 10px 12px; font-size: 12px; font-family: monospace; border-right: 1px solid #E6E9EF; white-space: nowrap;">
                    ${partIdStr ? `<a href="https://app.devrev.ai/lentra/parts/${partIdStr}" target="_blank" rel="noopener noreferrer" style="color: #3B42C4; text-decoration: none; font-weight: bold;">${partIdStr}</a>` : '-'}
                  </td>
                  <td style="padding: 10px 12px; font-size: 12px; color: #030522; font-weight: bold; border-right: 1px solid #E6E9EF;">${f.Name}</td>
                  <td style="padding: 10px 12px; font-size: 12px; color: #030522; border-right: 1px solid #E6E9EF; white-space: nowrap;">${getRagDisplay(f.ragStatus)}</td>
                  <td align="center" style="padding: 10px 12px; font-size: 12px; color: #030522; border-right: 1px solid #E6E9EF; text-align: center;">${f.percentageComplete !== undefined ? `${f.percentageComplete}%` : '0%'}</td>
                  <td style="padding: 10px 12px; font-size: 12px; color: #6F7C95; line-height: 1.4;">${f.reason || 'N/A'}</td>
                </tr>
              `;
            }).join('')}
            ${featuresList.length === 0 ? `
              <tr>
                <td colspan="5" style="padding: 16px; font-size: 12px; color: #6F7C95; font-style: italic; text-align: center;">No capability details logs.</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      <!-- Top Risks -->
      <div style="margin-bottom: 32px; font-family: Arial, sans-serif;">
        <h3 style="font-size: 15px; font-weight: bold; color: #030522; border-bottom: 1px solid #E6E9EF; padding-bottom: 8px; margin-bottom: 12px; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Top Active Risks (Executive Summary)</h3>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; width: 100%; border: 1px solid #E6E9EF; font-family: Arial, sans-serif;">
          <thead>
            <tr style="background-color: #F9FAFC; border-bottom: 1px solid #E6E9EF;">
              <th align="left" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; border-right: 1px solid #E6E9EF; width: 15%;">ID</th>
              <th align="left" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; border-right: 1px solid #E6E9EF; width: 50%;">Description</th>
              <th align="left" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; border-right: 1px solid #E6E9EF; width: 20%;">Reported By</th>
              <th align="center" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; width: 15%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${risksList.map((r: RiskIssueData) => {
              const desc = r.Description || r.description || '';
              const truncatedDesc = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
              return `
                <tr style="border-bottom: 1px solid #E6E9EF;">
                  <td style="padding: 10px 12px; font-size: 12px; font-family: monospace; border-right: 1px solid #E6E9EF;">#${r.Nbr}</td>
                  <td style="padding: 10px 12px; font-size: 12px; color: #030522; border-right: 1px solid #E6E9EF;" title="${desc}">${truncatedDesc}</td>
                  <td style="padding: 10px 12px; font-size: 12px; color: #030522; border-right: 1px solid #E6E9EF;">${r.reportedBy || 'Unassigned'}</td>
                  <td align="center" style="padding: 10px 12px; font-size: 12px; text-align: center;">
                    <span style="font-weight: bold; color: ${r.Status?.toLowerCase() === 'mitigated' || r.Status?.toLowerCase() === 'closed' || r.Status?.toLowerCase() === 'resolved' ? '#10b981' : '#ef4444'}">
                      ${r.Status || 'Open'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
            ${risksList.length === 0 ? `
              <tr>
                <td colspan="4" style="padding: 16px; font-size: 12px; color: #6F7C95; font-style: italic; text-align: center;">No active risks.</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
        ${(report?.risks_data?.length || 0) > 3 ? `
          <p style="font-size: 11px; color: #6F7C95; font-style: italic; margin-top: 6px; margin-bottom: 0; font-family: Arial, sans-serif;">
            *Additional items omitted for brevity. Please view the full dashboard for complete logs.*
          </p>
        ` : ''}
      </div>

      <!-- Top Issues -->
      <div style="margin-bottom: 8px; font-family: Arial, sans-serif;">
        <h3 style="font-size: 15px; font-weight: bold; color: #030522; border-bottom: 1px solid #E6E9EF; padding-bottom: 8px; margin-bottom: 12px; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Top Active Issues (Executive Summary)</h3>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; width: 100%; border: 1px solid #E6E9EF; font-family: Arial, sans-serif;">
          <thead>
            <tr style="background-color: #F9FAFC; border-bottom: 1px solid #E6E9EF;">
              <th align="left" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; border-right: 1px solid #E6E9EF; width: 15%;">ID</th>
              <th align="left" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; border-right: 1px solid #E6E9EF; width: 50%;">Description</th>
              <th align="left" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; border-right: 1px solid #E6E9EF; width: 20%;">Reported By</th>
              <th align="center" style="padding: 10px 12px; font-size: 11px; color: #6F7C95; text-transform: uppercase; font-weight: bold; font-family: Arial, sans-serif; width: 15%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${issuesList.map((i: RiskIssueData) => {
              const desc = i.Description || i.description || '';
              const truncatedDesc = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
              return `
                <tr style="border-bottom: 1px solid #E6E9EF;">
                  <td style="padding: 10px 12px; font-size: 12px; font-family: monospace; border-right: 1px solid #E6E9EF;">#${i.Nbr}</td>
                  <td style="padding: 10px 12px; font-size: 12px; color: #030522; border-right: 1px solid #E6E9EF;" title="${desc}">${truncatedDesc}</td>
                  <td style="padding: 10px 12px; font-size: 12px; color: #030522; border-right: 1px solid #E6E9EF;">${i.reportedBy || 'Unassigned'}</td>
                  <td align="center" style="padding: 10px 12px; font-size: 12px; text-align: center;">
                    <span style="font-weight: bold; color: ${i.Status?.toLowerCase() === 'mitigated' || i.Status?.toLowerCase() === 'closed' || i.Status?.toLowerCase() === 'resolved' ? '#10b981' : '#ef4444'}">
                      ${i.Status || 'Open'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
            ${issuesList.length === 0 ? `
              <tr>
                <td colspan="4" style="padding: 16px; font-size: 12px; color: #6F7C95; font-style: italic; text-align: center;">No active issues.</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
        ${(report?.issues_data?.length || 0) > 3 ? `
          <p style="font-size: 11px; color: #6F7C95; font-style: italic; margin-top: 6px; margin-bottom: 0; font-family: Arial, sans-serif;">
            *Additional items omitted for brevity. Please view the full dashboard for complete logs.*
          </p>
        ` : ''}
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #F9FAFC; border-top: 1px solid #E6E9EF; padding: 24px; text-align: center; font-size: 11px; color: #6F7C95; font-family: Arial, sans-serif; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
      <p style="margin: 0 0 8px 0;">This email summary was exported from <a href="${baseUrl}" style="color: #3B42C4; text-decoration: none; font-weight: bold;">Product Reporting Dashboard</a>.</p>
      <p style="margin: 0;">For full task drill-downs and audit logs, please inspect the <a href="${reportUrl}" style="color: #3B42C4; text-decoration: none; font-weight: bold;">Interactive Dashboard</a> in your browser.</p>
    </div>

  </div>
</div>
  `;
}
