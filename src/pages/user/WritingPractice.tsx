import React from 'react';
import WritingEditor from '../../components/user/writing/WritingEditor';
import { Brain } from 'lucide-react';

const WritingPractice: React.FC = () => {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full shadow-lg">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">Luyện Writing với AI</h1>
      </div>
      <p className="text-lg text-gray-700 mb-8 max-w-2xl">Viết bài IELTS và nhận chấm điểm tự động từ AI. Hệ thống sẽ phân tích, chấm điểm band, và đưa ra phản hồi chi tiết giúp bạn cải thiện kỹ năng Writing nhanh chóng.</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <WritingEditor />
        </div>
        <div>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-xl border border-blue-100">
            <h3 className="font-bold text-blue-700 mb-3 flex items-center gap-2"><Brain className="w-5 h-5 text-purple-600" /> Tips luyện với AI</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2 text-base">
              <li>Viết đủ số từ yêu cầu (&gt;=250 từ)</li>
              <li>Tập trung vào cấu trúc bài, luận điểm rõ ràng</li>
              <li>Đọc kỹ phản hồi AI để cải thiện từng phần</li>
              <li>Thử nhiều đề khác nhau để luyện đa dạng</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingPractice;