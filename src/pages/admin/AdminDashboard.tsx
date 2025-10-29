import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Database,
  UserPlus,
  Lock,
  ArrowRight,
} from "lucide-react";
import { dashboardService } from "../../services/dashboard";
import type { DashboardStats, WritingSubmission } from "../../services/dashboard";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";


const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // === Logic giữ nguyên ===
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSubmissions: 0,
    activeUsers: 0,
    databaseSize: "Loading...",
  });
  const [recentSubmissions, setRecentSubmissions] = useState<WritingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (mounted) setIsLoading(true);
      try {
        const adminStats = await dashboardService.getAdminStats();
        if (mounted) setStats(adminStats);
        const submissions = await dashboardService.getRecentSubmissions(5);
        if (mounted) setRecentSubmissions(submissions || []);
      } catch (e) {
        console.error("Error loading admin data", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // === UI helpers ===
  const StatSkeleton = () => (
    <Card className="rounded-2xl shadow-sm border border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StatCard = ({
    icon: Icon,
    label,
    value,
    accent,
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    accent: "blue" | "green" | "purple" | "orange";
  }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div
              className={
                "p-3 rounded-xl " +
                (accent === "blue"
                  ? "bg-blue-50 text-blue-600"
                  : accent === "green"
                  ? "bg-green-50 text-green-600"
                  : accent === "purple"
                  ? "bg-purple-50 text-purple-600"
                  : "bg-orange-50 text-orange-600")
              }
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const ActionLink = ({ to, children, variant = "default" }: { to: string; children: React.ReactNode; variant?: "default" | "green" | "purple" | "orange" | "blue" }) => {
    const color =
      variant === "green"
        ? "bg-green-600 hover:bg-green-700"
        : variant === "purple"
        ? "bg-purple-600 hover:bg-purple-700"
        : variant === "orange"
        ? "bg-orange-600 hover:bg-orange-700"
        : "bg-blue-600 hover:bg-blue-700";

    return (
      <Link to={to} className="block">
        <Button className={`w-full justify-between ${color} text-white h-11 rounded-xl`}> {children} <ArrowRight className="h-4 w-4" /> </Button>
      </Link>
    );
  };

  const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Card className="rounded-2xl shadow-sm border border-gray-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Icon className="h-5 w-5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">{children}</CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl border border-red-100 shadow-sm mb-8">
            <CardContent className="p-6 md:p-8 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"><Shield className="h-5 w-5" /></span>
                  Admin Dashboard
                  <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700 border-red-200">ADMIN</Badge>
                </h1>
                <p className="text-gray-600 mt-2">Xin chào, {user?.fullName || user?.email} — Bảng điều khiển quản trị</p>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">Bảo mật nâng cao</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {isLoading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <StatCard icon={Users} label="Tổng học viên" value={stats.totalUsers.toLocaleString()} accent="blue" />
              <StatCard icon={FileText} label="Bài writing đã chấm" value={stats.totalSubmissions.toLocaleString()} accent="green" />
              <StatCard icon={BarChart3} label="Người dùng hoạt động" value={stats.activeUsers.toLocaleString()} accent="purple" />
              <StatCard icon={Database} label="Dung lượng DB" value={stats.databaseSize} accent="orange" />
            </>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Section title="Quản lý người dùng" icon={Users}>
            <ActionLink to="/admin/users" variant="blue">
              <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Danh sách người dùng</span>
            </ActionLink>
            <ActionLink to="/admin/users/create" variant="green">
              <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Thêm người dùng</span>
            </ActionLink>
            <ActionLink to="/admin/users/status" variant="orange">
              <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Khóa / Mở khóa tài khoản</span>
            </ActionLink>
          </Section>

          <Section title="Quản lý nội dung" icon={FileText}>
            <ActionLink to="/admin/recent-submissions" variant="blue">
              <span className="flex items-center gap-2">📝 <span>Xem bài writing đã chấm</span></span>
            </ActionLink>
            <ActionLink to="/admin/content/lessons" variant="green">
              <span className="flex items-center gap-2">📚 <span>Quản lý bài học</span></span>
            </ActionLink>
            <ActionLink to="/admin/content/exams" variant="purple">
              <span className="flex items-center gap-2">🎯 <span>Quản lý đề thi</span></span>
            </ActionLink>
            <Button disabled className="w-full justify-between bg-orange-600/80 text-white h-11 rounded-xl">
              <span className="flex items-center gap-2">📊 Báo cáo chi tiết</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Section>

          <Section title="Cài đặt hệ thống" icon={Settings}>
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
              Khu vực cài đặt tổng quát, tích hợp và phân quyền (đang cập nhật giao diện). Bạn có thể thêm các mục con ở đây sau.
            </div>
          </Section>
        </div>

        {/* Recent Activity */}
        <Card className="rounded-2xl shadow-sm border border-gray-100 mt-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">Bài writing gần đây</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="py-8 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-3 w-64" />
                        <Skeleton className="h-3 w-80" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            ) : recentSubmissions.length === 0 ? (
              <div className="py-10 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 mb-3">🗒️</div>
                <p className="text-gray-600">Chưa có bài writing nào được nộp</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentSubmissions.map((submission) => {
                  const timeAgo = new Date(submission.createdAt).toLocaleString("vi-VN");
                  return (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-4 hover:bg-gray-50/80 rounded-xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`inline-block shrink-0 h-2.5 w-2.5 rounded-full ${submission.aiScore ? "bg-green-500" : "bg-blue-500"}`}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            Writing {(submission.taskType || "unknown").toUpperCase()}{" "}
                            {submission.aiScore && (
                              <span className="ml-2 text-sm text-green-700 font-semibold">(Điểm: {submission.aiScore})</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{submission.userEmail || "Unknown user"}</p>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {(submission.content || "").substring(0, 120)}...
                          </p>
                        </div>
                      </div>
                      <span className="text-xs md:text-sm text-gray-400 whitespace-nowrap">{timeAgo}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
