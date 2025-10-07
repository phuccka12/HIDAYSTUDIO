import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  BarChart3, 
  CheckCircle, 
  Star, 
  Users,
  Trophy,
  Brain,
  PenTool,
  Clock,
  ArrowRight,
  Play
} from 'lucide-react';
import DebugPanel from '../components/DebugPanel';

const LandingPage: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeInUp}>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                Chinh phục{' '}
                <span className="gradient-text">IELTS</span>
                <br />
                với{' '}
                <span className="text-blue-600">AI Writing</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              Nền tảng học IELTS thông minh với công nghệ AI tiên tiến. 
              Chấm điểm Writing tự động, lộ trình học cá nhân hóa và phương pháp học hiệu quả.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              variants={fadeInUp}
            >
              <button className="btn btn-primary px-8 py-4 text-lg group">
                Bắt đầu học ngay
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button className="btn btn-outline px-8 py-4 text-lg group">
                <Play className="mr-2" size={20} />
                Xem demo AI Writing
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-8 max-w-md mx-auto"
              variants={fadeInUp}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">10K+</div>
                <div className="text-gray-600">Học viên</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">98%</div>
                <div className="text-gray-600">Đạt mục tiêu</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">24/7</div>
                <div className="text-gray-600">Hỗ trợ AI</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 bg-blue-100 rounded-full"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-20 w-16 h-16 bg-purple-100 rounded-lg"
          animate={{ y: [0, 10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </section>

      {/* AI Writing Section */}
      <section id="ai-writing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Công nghệ <span className="text-blue-600">AI Writing</span> tiên tiến
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hệ thống AI chấm điểm và đưa ra phản hồi chi tiết cho bài viết IELTS của bạn trong thời gian thực
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="bg-gray-50 rounded-2xl p-8 relative">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-600 rounded-full"></div>
                <h3 className="text-2xl font-bold mb-4">AI Writing Assistant</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Brain className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-semibold">Phân tích thông minh</h4>
                      <p className="text-gray-600">AI phân tích ngữ pháp, từ vựng và cấu trúc bài viết</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <PenTool className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-semibold">Chấm điểm tự động</h4>
                      <p className="text-gray-600">Đánh giá band điểm chính xác theo tiêu chuẩn IELTS</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Target className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-semibold">Phản hồi chi tiết</h4>
                      <p className="text-gray-600">Gợi ý cải thiện cụ thể cho từng phần của bài viết</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-semibold">Phản hồi tức thì</h4>
                      <p className="text-gray-600">Nhận kết quả chấm điểm ngay lập tức</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Demo AI Writing</h3>
                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <div className="text-sm opacity-90 mb-2">Task 2: Sample Essay</div>
                  <div className="text-sm leading-relaxed">
                    "Some people believe that technology has made our lives more complex..."
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm opacity-90">Band Score</div>
                    <div className="text-3xl font-bold">7.5</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90">Thời gian chấm</div>
                    <div className="text-lg font-semibold">2.3s</div>
                  </div>
                </div>
                <button className="w-full bg-white text-blue-600 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors">
                  Thử ngay AI Writing
                </button>
              </div>
              
              {/* Floating score indicators */}
              <motion.div
                className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                8.0
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-xl text-gray-600">
              Hệ thống học tập toàn diện với công nghệ AI tiên tiến
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Lộ trình cá nhân hóa",
                description: "AI tạo lộ trình học phù hợp với mục tiêu và khả năng của bạn"
              },
              {
                icon: BarChart3,
                title: "Theo dõi tiến độ",
                description: "Báo cáo chi tiết về quá trình học tập và điểm mạnh/yếu"
              },
              {
                icon: BookOpen,
                title: "Ngân hàng đề thi",
                description: "Hàng nghìn câu hỏi và đề thi thực tế được cập nhật liên tục"
              },
              {
                icon: Users,
                title: "Cộng đồng học tập",
                description: "Kết nối với học viên khác, thảo luận và chia sẻ kinh nghiệm"
              },
              {
                icon: Trophy,
                title: "Chứng chỉ hoàn thành",
                description: "Nhận chứng chỉ khi hoàn thành khóa học và đạt mục tiêu"
              },
              {
                icon: Star,
                title: "Giáo viên chuyên nghiệp",
                description: "Được hướng dẫn bởi đội ngũ giáo viên có kinh nghiệm"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card text-center group hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Bảng giá linh hoạt
            </h2>
            <p className="text-xl text-gray-600">
              Chọn gói phù hợp với mục tiêu học IELTS của bạn
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Cơ bản",
                price: "0",
                period: "Miễn phí",
                features: ["5 bài AI Writing/tháng", "Báo cáo cơ bản", "Hỗ trợ email"],
                popular: false
              },
              {
                name: "Pro",
                price: "299,000",
                period: "/tháng",
                features: ["AI Writing không giới hạn", "Báo cáo chi tiết", "Lộ trình cá nhân hóa", "Hỗ trợ 24/7"],
                popular: true
              },
              {
                name: "Premium",
                price: "599,000",
                period: "/tháng",
                features: ["Tất cả tính năng Pro", "1-on-1 với giáo viên", "Mock test hàng tuần", "Đảm bảo tăng 1.0 band"],
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white transform scale-105' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
                      Phổ biến nhất
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price === "0" ? "Miễn phí" : `${plan.price}đ`}
                    </span>
                    {plan.price !== "0" && (
                      <span className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className={`w-5 h-5 mr-3 ${plan.popular ? 'text-green-300' : 'text-green-500'}`} />
                        <span className={plan.popular ? 'text-blue-100' : 'text-gray-600'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                  }`}>
                    {plan.price === "0" ? "Bắt đầu miễn phí" : "Chọn gói này"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Sẵn sàng chinh phục IELTS?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Tham gia cùng hàng nghìn học viên đã đạt được mục tiêu IELTS với AI Writing
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                Đăng ký miễn phí
              </button>
              <button className="btn border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold">
                Tìm hiểu thêm
              </button>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
};

export default LandingPage;