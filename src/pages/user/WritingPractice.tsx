import React from 'react';
import WritingEditor from '../../components/user/writing/WritingEditor';

const WritingPractice: React.FC = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Writing Practice (AI chấm ngay)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Editor: tạo đề ngẫu nhiên, nộp và poll kết quả */}
          <WritingEditor />
        </div>

        <aside className="lg:col-span-1">
          {/* Lịch sử/quick view */}
        </aside>
      </div>
    </div>
  );
};

export default WritingPractice;