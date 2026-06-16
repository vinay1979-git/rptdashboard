export interface FeatureData {
  'Part id': string;
  devRevId?: string;
  Name: string;
  'Owner[0]': string;
  'Theme[0]': string;
  'Goal[0]': string;
  'Service (Temp)[0]': string;
  'Created date': string;
  'Tags[0]': string;
}

export interface TaskData {
  Items: string;
  Title: string;
  Stage: string;
  'Owner[0]': string;
  'Target Close Date': string;
  'Close date': string;
  'Part-ID': string;
}

export interface RiskIssueData {
  Nbr: string;
  'Date Opened': string;
  Scope: string;
  Description: string;
  description?: string;
  'Feature Name': string;
  'DevRev ID': string;
  Status: string;
  'Status Date': string;
  Comments: string;
}

export interface MappedFeature extends FeatureData {
  status: 'Completed' | 'Not Picked Up' | 'In Progress';
  tasks: TaskData[];
}

export interface ReportPayload {
  features: MappedFeature[];
  goalChartData: Array<{ goal: string; count: number }>;
  sprintProgress: Array<{ sprint: string; total: number; completed: number; percentage: number }>;
  openRisks: RiskIssueData[];
  mitigatedRisks: RiskIssueData[];
  stats: {
    totalFeatures: number;
    completedFeatures: number;
    inProgressFeatures: number;
    notPickedUpFeatures: number;
    completionPercentage: number;
  };
  highlights: string[];
}

/**
 * Transforms client-parsed raw CSV datasets into the structured reporting payload.
 */
export function processReport(
  features: FeatureData[],
  tasks: TaskData[],
  risksIssues: RiskIssueData[],
  highlights: string[]
): ReportPayload {
  
  // 1. Map every Feature to its Tasks and assign completion status
  const mappedFeatures: MappedFeature[] = features.map(feature => {
    const partId = feature['Part id'];
    const matchingTasks = tasks.filter(task => task['Part-ID'] === partId);

    let status: 'Completed' | 'Not Picked Up' | 'In Progress' = 'In Progress';
    
    if (matchingTasks.length === 0) {
      status = 'Not Picked Up';
    } else {
      const allClosedOrApproved = matchingTasks.every(
        task => {
          const stage = task.Stage?.toLowerCase() || '';
          return stage === 'closed' || stage === 'approved';
        }
      );
      
      const allOpen = matchingTasks.every(
        task => (task.Stage?.toLowerCase() || '') === 'open'
      );

      if (allClosedOrApproved) {
        status = 'Completed';
      } else if (allOpen) {
        status = 'Not Picked Up';
      } else {
        status = 'In Progress';
      }
    }

    return {
      ...feature,
      status,
      tasks: matchingTasks
    };
  });

  // 2. Aggregate features per Goal[0] for Recharts charting
  const goalAggregation: { [key: string]: number } = {};
  mappedFeatures.forEach(feature => {
    const goal = feature['Goal[0]'] || 'Unspecified';
    goalAggregation[goal] = (goalAggregation[goal] || 0) + 1;
  });
  
  const goalChartData = Object.entries(goalAggregation).map(([goal, count]) => ({
    goal,
    count
  }));

  // 3. Aggregate sprint progress via Tags[0] (e.g. "GROW Sprint 1")
  const sprintAggregation: { [key: string]: { total: number; completed: number } } = {};
  mappedFeatures.forEach(feature => {
    const tags = feature['Tags[0]'] || '';
    // Matches "Sprint X" or "Sprint-X" or "SprintX" (case-insensitive)
    const sprintMatch = tags.match(/sprint\s*[-_]*\s*\d+/i);
    
    if (sprintMatch) {
      // Normalize to "Sprint X" format
      const sprintName = sprintMatch[0].replace(/\s*[-_]*\s*/i, ' ').toUpperCase();
      
      if (!sprintAggregation[sprintName]) {
        sprintAggregation[sprintName] = { total: 0, completed: 0 };
      }
      sprintAggregation[sprintName].total += 1;
      if (feature.status === 'Completed') {
        sprintAggregation[sprintName].completed += 1;
      }
    }
  });

  const sprintProgress = Object.entries(sprintAggregation)
    .map(([sprint, stats]) => ({
      sprint,
      total: stats.total,
      completed: stats.completed,
      percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }))
    .sort((a, b) => a.sprint.localeCompare(b.sprint, undefined, { numeric: true }));

  // 4. Isolate top 3 Open and top 3 Mitigated risks/issues
  const openStatuses = ['open', 'active', 'unresolved', 'todo'];
  const mitigatedStatuses = ['mitigated', 'closed', 'resolved', 'done'];

  const openRisks = risksIssues
    .filter(item => openStatuses.includes(item.Status?.toLowerCase() || ''))
    .slice(0, 3);

  const mitigatedRisks = risksIssues
    .filter(item => mitigatedStatuses.includes(item.Status?.toLowerCase() || ''))
    .slice(0, 3);

  // 5. Calculate global performance stats
  const totalFeatures = mappedFeatures.length;
  const completedFeatures = mappedFeatures.filter(f => f.status === 'Completed').length;
  const inProgressFeatures = mappedFeatures.filter(f => f.status === 'In Progress').length;
  const notPickedUpFeatures = mappedFeatures.filter(f => f.status === 'Not Picked Up').length;

  const stats = {
    totalFeatures,
    completedFeatures,
    inProgressFeatures,
    notPickedUpFeatures,
    completionPercentage: totalFeatures > 0 ? Math.round((completedFeatures / totalFeatures) * 100) : 0
  };

  return {
    features: mappedFeatures,
    goalChartData,
    sprintProgress,
    openRisks,
    mitigatedRisks,
    stats,
    highlights: highlights.filter(h => h.trim() !== '')
  };
}
