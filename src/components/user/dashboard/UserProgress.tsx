import React from 'react';
import type { UserProgressItem } from '../../services/user/userService';

const UserProgress: React.FC<{items: UserProgressItem[]}> = ({ items }) => {
  if (!items || items.length === 0) return (
    <div className="bg-white rounded-2xl p-6 shadow">Chưa có tiến độ</div>
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <h3 className="text-lg font-semibold mb-4">Tiến độ học</h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <div className="font-medium">{item.skill_type}</div>
              <div className="text-sm text-gray-500">Current: {item.current_level} • Target: {item.target_score}</div>
            </div>
            <div className="text-right text-sm text-gray-600">Exercises: {item.completed_exercises}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProgress;