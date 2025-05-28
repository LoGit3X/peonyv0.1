import { FC, useState, useEffect } from 'react';
import { Package, Utensils, ListMusic, Calculator, FileText } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import FeatureCard from '@/components/dashboard/FeatureCard';
import ActivityItem from '@/components/dashboard/ActivityItem';
import SalesChart from '@/components/dashboard/SalesChart';
import { Stat, ChartData, Activity } from '@/lib/types';

const Dashboard: FC = () => {
  // Default stats for loading/error state
  const defaultStats: Stat[] = [
    {
      title: 'تعداد مواد اولیه',
      value: 0,
      change: 15
    },
    {
      title: 'تعداد رسپی‌ها',
      value: 0,
      change: 8
    },
    {
      title: 'فروش ماهانه',
      value: '35.6 م',
      change: 12
    }
  ];

  const [stats, setStats] = useState<Stat[]>(defaultStats);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleActivities, setVisibleActivities] = useState(4);

  const handleShowMore = () => {
    setVisibleActivities(prev => prev + 4);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch('/api/stats');
        const statsData = await statsResponse.json();
        if (Array.isArray(statsData)) {
          // Filter out menu items stat
          const filteredStats = statsData.filter(stat => 
            stat.title === 'تعداد مواد اولیه' || 
            stat.title === 'تعداد رسپی‌ها' || 
            stat.title === 'فروش ماهانه'
          );
          setStats(filteredStats);
        } else {
          console.error('Stats data is not an array:', statsData);
          setStats(defaultStats);
        }

        // Fetch chart data
        const chartResponse = await fetch('/api/sales/chart');
        const chartData = await chartResponse.json();
        setChartData(chartData);

        // Fetch activities
        const activitiesResponse = await fetch('/api/activities');
        const activitiesData = await activitiesResponse.json();
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setStats(defaultStats);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // Default chart data for loading/error state
  const defaultChartData: ChartData = {
    labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
    datasets: [
      {
        label: 'فروش',
        data: [25.4, 28.7, 30.1, 29.8, 33.2, 35.6],
        borderColor: '#FCD40D',
        backgroundColor: 'rgba(252, 212, 13, 0.1)',
      },
      {
        label: 'هزینه‌ها',
        data: [18.2, 19.5, 21.3, 20.7, 22.8, 24.1],
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
      }
    ]
  };

  return (
    <>
      {/* Welcome Section */}
      <div className="cafe-gradient rounded-xl p-3 mb-4 shadow-lg card-3d shine-effect">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base lg:text-lg font-bold text-white">
                خوش آمدید به پنل مدیریت <span className="text-sky-300">کافه پیونی</span>
              </h1>
              <span className="text-gray-300 text-xs">|</span>
              <p className="text-gray-300 text-xs">
                مدیریت مواد اولیه و موجودی انبار، ثبت و ویرایش رسپی‌ها، تنظیم قیمت‌ها و دسته‌بندی منو، مشاهده گزارشات فروش و تحلیل هزینه‌ها و سود
              </p>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative h-12 w-12">
              {/* Saucer */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gradient-to-r from-gray-100 via-white to-gray-100 rounded-full shadow-lg border border-gray-200/50"></div>
              
              {/* Cup body */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-7 bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-b-3xl rounded-t-xl shadow-lg overflow-hidden border border-gray-200/30">
                {/* Cup rim */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-white to-gray-200"></div>
                {/* Coffee liquid */}
                <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 rounded-b-2xl">
                  {/* Coffee surface shine */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-500/40 rounded-full"></div>
                  {/* Coffee texture */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-amber-700/30 rounded-full"></div>
                </div>
              </div>
              
              {/* Cup handle */}
              <div className="absolute bottom-2 -right-1 w-2 h-4 border-r-2 border-gray-200/50 rounded-r-full shadow-sm bg-gradient-to-r from-gray-100 to-white"></div>
              
              {/* Animated Steam */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-4">
                <div className="absolute left-0 w-1 h-3 bg-white/50 rounded-full animate-rise transform -rotate-12"></div>
                <div className="absolute left-2 w-1 h-4 bg-white/50 rounded-full animate-rise delay-500 transform rotate-0"></div>
                <div className="absolute right-1 w-1 h-3 bg-white/50 rounded-full animate-rise delay-1000 transform rotate-12"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Main Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <FeatureCard 
          title="مدیریت مواد اولیه"
          description="افزودن، ویرایش و حذف مواد اولیه کافه"
          icon={<Package className="text-white text-lg" />}
          href="/materials"
          variant="materials"
        />
        
        <FeatureCard 
          title="مدیریت رسپی‌ها"
          description="ایجاد، ویرایش و مدیریت دستور تهیه آیتم‌ها"
          icon={<Utensils className="text-white text-lg" />}
          href="/recipes"
          variant="recipes"
        />
        
        <FeatureCard 
          title="مشاهده قیمت‌ها"
          description="مشاهده و مدیریت قیمت‌های منو و محصولات"
          icon={<Calculator className="text-white text-lg" />}
          href="/prices"
          variant="prices"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Section */}
        <div className="lg:col-span-2 glass-effect card-3d rounded-xl p-4 shadow-lg">
          <h3 className="text-base font-bold text-sky-300 mb-3">تحلیل هزینه و فروش</h3>
          <SalesChart data={chartData || defaultChartData} />
        </div>

        {/* Recent Activities */}
        <div className="glass-effect card-3d rounded-xl p-4 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-sky-300">فعالیت‌های اخیر</h3>
            {!isLoading && activities.length > 0 && (
              <span className="text-[11px] text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                {activities.length} فعالیت
              </span>
            )}
          </div>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-start space-x-4 space-x-reverse bg-white/5 rounded-lg p-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-white/10 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                  <FileText className="text-gray-400 w-6 h-6" />
                </div>
                <p className="text-gray-400 text-sm">فعالیتی ثبت نشده است</p>
              </div>
            ) : (
              activities.slice(0, visibleActivities).map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
          
          {activities.length > visibleActivities && (
            <div className="mt-4 text-center">
              <button 
                onClick={handleShowMore}
                className="bg-white/5 hover:bg-white/10 text-sky-400 hover:text-sky-300 text-xs font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto group"
              >
                <span>نمایش بیشتر</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 transform group-hover:translate-y-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
