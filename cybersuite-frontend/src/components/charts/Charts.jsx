import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, BarElement, Title, Tooltip, Legend, Filler
)

const COMMON_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#4A5E80', font: { size: 11, family: 'Inter' } } },
    tooltip: {
      backgroundColor: '#101827',
      borderColor: '#1A2844',
      borderWidth: 1,
      titleColor: '#E2E8F0',
      bodyColor: '#94A3B8',
      cornerRadius: 10,
      padding: 10,
    },
  },
  scales: {
    x: {
      ticks: { color: '#4A5E80', font: { size: 10 } },
      grid:  { color: 'rgba(26,40,68,0.5)' },
      border: { color: 'rgba(26,40,68,0.5)' },
    },
    y: {
      ticks: { color: '#4A5E80', font: { size: 10 } },
      grid:  { color: 'rgba(26,40,68,0.5)' },
      border: { color: 'rgba(26,40,68,0.5)' },
    },
  },
}

const labels24h = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22']
const rnd = (n, max) => Array.from({ length: n }, () => Math.floor(Math.random() * max))

export function ThreatLineChart() {
  const data = {
    labels: labels24h,
    datasets: [
      {
        label: 'Threats Detected',
        data: rnd(12, 80),
        borderColor: '#00C2FF',
        backgroundColor: 'rgba(0,194,255,0.07)',
        fill: true,
        tension: 0.45,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#00C2FF',
        pointBorderColor: '#070B14',
        borderWidth: 2,
      },
      {
        label: 'Scans Run',
        data: rnd(12, 50),
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168,85,247,0.07)',
        fill: true,
        tension: 0.45,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#A855F7',
        pointBorderColor: '#070B14',
        borderWidth: 2,
      },
    ],
  }
  return <Line data={data} options={COMMON_OPTS} />
}

export function VulnDonutChart() {
  const data = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'None'],
    datasets: [{
      data: [4, 11, 23, 35, 12],
      backgroundColor: ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#1A2844'],
      borderColor: '#070B14',
      borderWidth: 3,
      hoverOffset: 6,
    }],
  }
  const isSmall = typeof window !== 'undefined' && window.innerWidth < 640
  const opts = {
    ...COMMON_OPTS,
    scales: {},
    plugins: {
      ...COMMON_OPTS.plugins,
      legend: {
        position: isSmall ? 'bottom' : 'right',
        labels: { color: '#94A3B8', font: { size: 11 }, padding: 14 },
      },
    },
    cutout: '70%',
  }
  return <Doughnut data={data} options={opts} />
}

export function ActivityBarChart() {
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Recon',
        data: rnd(7, 30),
        backgroundColor: 'rgba(0,194,255,0.65)',
        borderRadius: 5,
      },
      {
        label: 'VulnScan',
        data: rnd(7, 25),
        backgroundColor: 'rgba(168,85,247,0.65)',
        borderRadius: 5,
      },
      {
        label: 'Exploits',
        data: rnd(7, 12),
        backgroundColor: 'rgba(239,68,68,0.65)',
        borderRadius: 5,
      },
    ],
  }
  return <Bar data={data} options={{ ...COMMON_OPTS, plugins: { ...COMMON_OPTS.plugins } }} />
}
