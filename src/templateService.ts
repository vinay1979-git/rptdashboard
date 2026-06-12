import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

export interface DashboardData {
  title: string;
  date: string;
  metrics: {
    revenue: number;
    revenueGrowth: number;
    activeUsers: number;
    userGrowth: number;
  };
  breakdown: Array<{
    region: string;
    users: number;
    revenue: number;
    conversion: number;
  }>;
}

export class TemplateService {
  /**
   * Renders the EJS template with data to produce the final HTML
   */
  public static renderDashboard(data: DashboardData): string {
    const templatePath = path.join(__dirname, 'dashboard.ejs');
    
    // Fallback template loading logic to handle running from build directory (dist) vs source
    let templateSource: string;
    if (fs.existsSync(templatePath)) {
      templateSource = fs.readFileSync(templatePath, 'utf8');
    } else {
      // If we are in dist, the EJS file might be in the parent src dir or copy to dist
      const srcTemplatePath = path.join(__dirname, '..', 'src', 'dashboard.ejs');
      if (fs.existsSync(srcTemplatePath)) {
        templateSource = fs.readFileSync(srcTemplatePath, 'utf8');
      } else {
        throw new Error(`Template not found at: ${templatePath}`);
      }
    }

    return ejs.render(templateSource, data);
  }
}
