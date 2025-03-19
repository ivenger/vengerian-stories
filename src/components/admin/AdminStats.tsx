
import React from 'react';

interface StatsProps {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
}

interface LanguageData {
  name: string;
  count: number;
}

interface ActivityItem {
  type: string;
  title: string;
  time: string;
}

interface AdminStatsProps {
  stats: StatsProps;
  languages: LanguageData[];
  recentActivity: ActivityItem[];
}

const AdminStats: React.FC<AdminStatsProps> = ({
  stats,
  languages,
  recentActivity
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Statistics</h2>
        <p>Total Posts: {stats.totalPosts}</p>
        <p>Published Posts: {stats.publishedPosts}</p>
        <p>Draft Posts: {stats.draftPosts}</p>
      </div>

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Languages</h2>
        <ul>
          {languages.map((lang) => (
            <li key={lang.name}>
              {lang.name}: {lang.count}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
        <ul>
          {recentActivity.map((activity, index) => (
            <li key={index}>
              {activity.title} - {activity.time}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminStats;
