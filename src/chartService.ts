import QuickChart from 'quickchart-js';

export class ChartService {
  /**
   * Generates a monthly revenue bar chart
   */
  public static async generateRevenueChart(): Promise<Buffer> {
    const chart = new QuickChart();
    chart.setWidth(600);
    chart.setHeight(300);
    chart.setBackgroundColor('#1e1e2f'); // Match modern dark-themed email dashboard

    chart.setConfig({
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Revenue ($k)',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: 'rgba(99, 102, 241, 0.8)', // Indigo
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Target ($k)',
            data: [10, 15, 8, 12, 7, 9],
            backgroundColor: 'rgba(236, 72, 153, 0.4)', // Pink
            borderColor: 'rgba(236, 72, 153, 1)',
            borderWidth: 1,
            borderRadius: 6,
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
          labels: {
            fontColor: '#a5b4fc',
          }
        },
        scales: {
          yAxes: [{
            gridLines: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              fontColor: '#a5b4fc',
              beginAtZero: true,
            }
          }],
          xAxes: [{
            gridLines: {
              display: false,
            },
            ticks: {
              fontColor: '#a5b4fc',
            }
          }]
        }
      }
    });

    return await chart.toBuffer();
  }

  /**
   * Generates a user acquisition line chart
   */
  public static async generateUserGrowthChart(): Promise<Buffer> {
    const chart = new QuickChart();
    chart.setWidth(600);
    chart.setHeight(300);
    chart.setBackgroundColor('#1e1e2f');

    chart.setConfig({
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'New Signups',
            data: [150, 220, 310, 480],
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
          labels: {
            fontColor: '#a5b4fc',
          }
        },
        scales: {
          yAxes: [{
            gridLines: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              fontColor: '#a5b4fc',
            }
          }],
          xAxes: [{
            gridLines: {
              display: false,
            },
            ticks: {
              fontColor: '#a5b4fc',
            }
          }]
        }
      }
    });

    return await chart.toBuffer();
  }
}
