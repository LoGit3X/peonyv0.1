import { FC, useEffect, useState } from 'react';
import { FileText, TrendingUp, ShoppingCart, DollarSign, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { ChartContainer } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
// @ts-ignore: Suppress missing type declaration for 'jalaali-js'
import jalaali from 'jalaali-js';

// آمار اولیه برای حالت لودینگ
const defaultStats = [
  { title: 'تعداد سفارش‌ها', value: 0, icon: <ShoppingCart className="text-sky-400 w-7 h-7 drop-shadow-glow" />, gradient: 'from-[#38BDF8] to-[#0ea5e9]' },
  { title: 'فروش ماهانه', value: '0 م', icon: <TrendingUp className="text-emerald-400 w-7 h-7 drop-shadow-glow" />, gradient: 'from-[#2DD4BF] to-[#14b8a6]' },
  { title: 'سود کل', value: '0 م', icon: <DollarSign className="text-amber-400 w-7 h-7 drop-shadow-glow" />, gradient: 'from-[#FCD34D] to-[#f59e42]' },
  { title: 'پرفروش‌ترین آیتم', value: '-', icon: <Star className="text-pink-400 w-7 h-7 drop-shadow-glow" />, gradient: 'from-[#F472B6] to-[#be185d]' },
];

const Reports: FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [barChartData, setBarChartData] = useState<any>(null);
  const [barChartLoading, setBarChartLoading] = useState(true);
  const [barChartError, setBarChartError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // گزارش‌های جدید
  const [categorySales, setCategorySales] = useState<any[]>([]);
  const [categorySalesLoading, setCategorySalesLoading] = useState(true);
  const [categorySalesError, setCategorySalesError] = useState<string | null>(null);

  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [peakHoursLoading, setPeakHoursLoading] = useState(true);
  const [peakHoursError, setPeakHoursError] = useState<string | null>(null);

  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [bestSellersLoading, setBestSellersLoading] = useState(true);
  const [bestSellersError, setBestSellersError] = useState<string | null>(null);

  const [leastSellers, setLeastSellers] = useState<any[]>([]);
  const [leastSellersLoading, setLeastSellersLoading] = useState(true);
  const [leastSellersError, setLeastSellersError] = useState<string | null>(null);

  // فیلتر ماه و سال جلالی برای پرفروش‌ترین محصولات
  const now = new Date();
  const { jy: currentJYear, jm: currentJMonth } = jalaali.toJalaali(now);
  const years = Array.from({ length: 5 }, (_, i) => currentJYear - i); // 5 سال اخیر
  const months = [
    { value: 1, label: 'فروردین' },
    { value: 2, label: 'اردیبهشت' },
    { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' },
    { value: 5, label: 'مرداد' },
    { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' },
    { value: 8, label: 'آبان' },
    { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' },
    { value: 11, label: 'بهمن' },
    { value: 12, label: 'اسفند' },
  ];
  const [selectedYear, setSelectedYear] = useState(currentJYear);
  const [selectedMonth, setSelectedMonth] = useState(currentJMonth);

  // تابع دریافت داده پرفروش‌ترین محصولات با فیلتر ماه/سال
  const fetchBestSellers = (year: number, month: number) => {
    setBestSellersLoading(true);
    setBestSellersError(null);
    fetch(`/api/sales/best-sellers?limit=5&year=${year}&month=${month}`)
      .then(res => {
        if (!res.ok) throw new Error('خطا در دریافت پرفروش‌ترین محصولات');
        return res.json();
      })
      .then(data => {
        setBestSellers(data);
        setBestSellersLoading(false);
      })
      .catch(err => {
        setBestSellersError(err.message || 'خطا در دریافت پرفروش‌ترین محصولات');
        setBestSellersLoading(false);
      });
  };

  const fetchLeastSellers = (year: number, month: number) => {
    setLeastSellersLoading(true);
    setLeastSellersError(null);
    fetch(`/api/sales/best-sellers?limit=5&year=${year}&month=${month}&order=asc`)
      .then(res => {
        if (!res.ok) throw new Error('خطا در دریافت کم‌فروش‌ترین محصولات');
        return res.json();
      })
      .then(data => {
        setLeastSellers(data);
        setLeastSellersLoading(false);
      })
      .catch(err => {
        setLeastSellersError(err.message || 'خطا در دریافت کم‌فروش‌ترین محصولات');
        setLeastSellersLoading(false);
      });
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch('/api/stats')
      .then(res => {
        if (!res.ok) throw new Error('خطا در دریافت آمار');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message || 'خطا در دریافت آمار');
        setIsLoading(false);
      });
    // Fetch BarChart data
    setBarChartLoading(true);
    setBarChartError(null);
    fetch('/api/sales/chart')
      .then(res => {
        if (!res.ok) throw new Error('خطا در دریافت داده نمودار فروش');
        return res.json();
      })
      .then(data => {
        // تبدیل داده به فرمت مورد نیاز BarChart
        const chartRows = data.labels.map((label: string, idx: number) => {
          const row: any = { name: label };
          data.datasets.forEach((ds: any) => {
            row[ds.label] = ds.data[idx];
          });
          return row;
        });
        setBarChartData(chartRows);
        setBarChartLoading(false);
      })
      .catch(err => {
        setBarChartError(err.message || 'خطا در دریافت داده نمودار فروش');
        setBarChartLoading(false);
      });

    // فروش بر اساس دسته‌بندی محصولات
    setCategorySalesLoading(true);
    setCategorySalesError(null);
    fetch('/api/sales/by-category')
      .then(res => {
        if (!res.ok) throw new Error('خطا در دریافت فروش دسته‌بندی');
        return res.json();
      })
      .then(data => {
        setCategorySales(data);
        setCategorySalesLoading(false);
      })
      .catch(err => {
        setCategorySalesError(err.message || 'خطا در دریافت فروش دسته‌بندی');
        setCategorySalesLoading(false);
      });

    // ساعات اوج فروش
    setPeakHoursLoading(true);
    setPeakHoursError(null);
    fetch('/api/sales/by-hour')
      .then(res => {
        if (!res.ok) throw new Error('خطا در دریافت ساعات اوج فروش');
        return res.json();
      })
      .then(data => {
        setPeakHours(data);
        setPeakHoursLoading(false);
      })
      .catch(err => {
        setPeakHoursError(err.message || 'خطا در دریافت ساعات اوج فروش');
        setPeakHoursLoading(false);
      });

    fetchBestSellers(selectedYear, selectedMonth);
    fetchLeastSellers(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  return (
    <div className="flex flex-col gap-8 py-8 px-4 md:px-8">
      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {isLoading ? (
          <div className="col-span-4 text-center text-sky-300 p-4">در حال بارگذاری آمار...</div>
        ) : error ? (
          <div className="col-span-4 text-center text-red-400 p-4">{error}</div>
        ) : (
          stats.map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-xl overflow-hidden shadow-lg card-3d shine-effect border-2 border-transparent transition-all duration-300 hover:shadow-xl hover:scale-[1.03] p-5 min-h-[100px] bg-gradient-to-br from-[#23272A] to-[#1e293b]`}
              style={{ boxSizing: 'border-box' }}
            >
              <div className="flex flex-col items-center gap-3">
                {/* اگر آیکون svg به صورت رشته بود، dangerouslySetInnerHTML */}
                <div className="w-14 h-14 flex items-center justify-center bg-black/20 rounded-full mb-2">
                  {stat.icon && typeof stat.icon === 'string' ? (
                    <span dangerouslySetInnerHTML={{ __html: stat.icon }} />
                  ) : stat.icon}
                </div>
                <CardTitle className="text-lg text-white font-bold tracking-tight drop-shadow-glow">{stat.title}</CardTitle>
                <span className="text-2xl font-extrabold text-white drop-shadow-glow mt-1">{stat.value}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* نمودار فروش و هزینه */}
      <div className="glass-effect card-3d rounded-xl p-5 shadow bg-gradient-to-br from-[#23272A] to-[#1e293b] border border-blue-400/30">
        <h3 className="text-lg font-bold text-sky-300 mb-4 shine-effect">نمودار فروش و هزینه‌ها</h3>
        <div className="h-56 flex items-center justify-center p-2">
          {barChartLoading ? (
            <div className="text-sky-300 p-4">در حال بارگذاری نمودار...</div>
          ) : barChartError ? (
            <div className="text-red-400 p-4">{barChartError}</div>
          ) : barChartData && barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <XAxis dataKey="name" tickMargin={8} />
                <YAxis tickMargin={8} />
                <Tooltip contentStyle={{ padding: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: '15px' }} />
                {/* داینامیک بارها */}
                {Object.keys(barChartData[0]).filter(k => k !== 'name').map((key, idx) => (
                  <Bar key={key} dataKey={key} fill={idx === 0 ? '#38BDF8' : '#F472B6'} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-400 p-4">داده‌ای برای نمایش وجود ندارد.</div>
          )}
        </div>
      </div>

      {/* نمودار دایره‌ای سهم فروش */}
      <div className="glass-effect card-3d rounded-xl p-5 shadow bg-gradient-to-br from-[#23272A] to-[#1e293b] border border-amber-400/30">
        <h3 className="text-lg font-bold text-amber-300 mb-4 shine-effect">نمودار دایره‌ای سهم فروش آیتم‌ها</h3>
        <div className="h-56 flex items-center justify-center p-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie 
                data={[
                  { name: 'لاته', value: 400 }, 
                  { name: 'کاپوچینو', value: 300 }, 
                  { name: 'موکا', value: 300 }, 
                  { name: 'چای', value: 200 }
                ]} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={85} 
                fill="#38BDF8" 
                label={({ name, value }) => `${name}: ${value}`}>
                <Cell fill="#38BDF8" />
                <Cell fill="#F472B6" />
                <Cell fill="#FCD34D" />
                <Cell fill="#2DD4BF" />
              </Pie>
              <Tooltip contentStyle={{ padding: '12px', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ paddingTop: '15px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* نمودار روند سودآوری */}
      <div className="glass-effect card-3d rounded-xl p-5 shadow bg-gradient-to-br from-[#23272A] to-[#1e293b] border border-emerald-400/30">
        <h3 className="text-lg font-bold text-emerald-300 mb-4 shine-effect">نمودار روند سودآوری</h3>
        <div className="h-56 flex items-center justify-center p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[{ name: 'فروردین', سود: 40 }, { name: 'اردیبهشت', سود: 60 }, { name: 'خرداد', سود: 70 }]} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}> 
              <XAxis dataKey="name" tickMargin={8} />
              <YAxis tickMargin={8} />
              <Tooltip contentStyle={{ padding: '12px', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ paddingTop: '15px' }} />
              <Line type="monotone" dataKey="سود" stroke="#2DD4BF" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* جدول سودآوری آیتم‌ها */}
      <div className="glass-effect card-3d rounded-xl p-5 shadow bg-gradient-to-br from-[#23272A] to-[#1e293b] border border-pink-400/30">
        <h3 className="text-lg font-bold text-pink-300 mb-4 shine-effect">جدول سودآوری آیتم‌ها</h3>
        <div className="overflow-x-auto">
          {/* فیلتر پیشرفته */}
          <div className="flex flex-col md:flex-row gap-5 items-center justify-between bg-gradient-to-br from-[#23272A] to-[#1e293b] rounded-xl p-5 mb-4 border border-blue-400/20 card-3d">
            {/* بازه زمانی */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-sm text-gray-300 mb-1">بازه زمانی</span>
              <div className="flex gap-3">
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  inputClass="w-36 bg-[#23272A] border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                  placeholder="از تاریخ"
                />
                <span className="text-gray-400 mx-2">تا</span>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  inputClass="w-36 bg-[#23272A] border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                  placeholder="تا تاریخ"
                />
              </div>
            </div>
            {/* دسته‌بندی آیتم */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-sm text-gray-300 mb-1">دسته‌بندی آیتم</span>
              <Select>
                <SelectTrigger className="w-44 bg-[#23272A] border-gray-700 text-white">
                  <SelectValue placeholder="همه دسته‌ها" />
                </SelectTrigger>
                <SelectContent className="bg-[#23272A] text-white">
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="drinks">نوشیدنی</SelectItem>
                  <SelectItem value="desserts">دسر</SelectItem>
                  <SelectItem value="food">غذا</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* جستجو */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-sm text-gray-300 mb-1">جستجو آیتم</span>
              <Input className="w-44 bg-[#23272A] border-gray-700 text-white px-3 py-2" placeholder="نام آیتم..." />
            </div>
          </div>
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="h-10">
                <TableHead className="text-center font-mono px-4 py-3">نام آیتم</TableHead>
                <TableHead className="text-center font-mono px-4 py-3">قیمت تمام‌شده</TableHead>
                <TableHead className="text-center font-mono px-4 py-3">قیمت فروش</TableHead>
                <TableHead className="text-center font-mono px-4 py-3">سود</TableHead>
                <TableHead className="text-center font-mono px-4 py-3">حاشیه سود (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* داده نمونه */}
              <TableRow className="h-10">
                <TableCell className="text-center font-mono px-4 py-3">لاته</TableCell>
                <TableCell className="text-center font-mono px-4 py-3">55,000</TableCell>
                <TableCell className="text-center font-mono px-4 py-3">90,000</TableCell>
                <TableCell className="text-center font-mono text-emerald-400 font-bold px-4 py-3">35,000</TableCell>
                <TableCell className="text-center font-mono text-emerald-300 font-bold px-4 py-3">39%</TableCell>
              </TableRow>
              <TableRow className="h-10">
                <TableCell className="text-center font-mono px-4 py-3">کاپوچینو</TableCell>
                <TableCell className="text-center font-mono px-4 py-3">60,000</TableCell>
                <TableCell className="text-center font-mono px-4 py-3">100,000</TableCell>
                <TableCell className="text-center font-mono text-emerald-400 font-bold px-4 py-3">40,000</TableCell>
                <TableCell className="text-center font-mono text-emerald-300 font-bold px-4 py-3">40%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* فروش بر اساس دسته‌بندی محصولات */}
      <div className="glass-effect card-3d rounded-xl p-5 shadow bg-gradient-to-br from-[#23272A] to-[#1e293b] border border-purple-400/30">
        <h3 className="text-lg font-bold text-purple-300 mb-4 shine-effect">فروش بر اساس دسته‌بندی محصولات</h3>
        <div className="h-56 flex items-center justify-center p-2">
          {categorySalesLoading ? (
            <div className="text-purple-300 p-4">در حال بارگذاری...</div>
          ) : categorySalesError ? (
            <div className="text-red-400 p-4">{categorySalesError}</div>
          ) : categorySales && categorySales.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Pie 
                  data={categorySales.map(c => ({ name: c.category, value: c.totalSales, totalQuantity: c.totalQuantity }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  fill="#8B5CF6"
                  label={({ name, value, totalQuantity }) => `${name}: ${value.toLocaleString()} تومان`}
                >
                  {categorySales.map((c, idx) => <Cell key={c.category} fill={["#38BDF8", "#F472B6", "#FCD34D", "#2DD4BF", "#8B5CF6"][idx % 5]} />)}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg">
                          <div className="text-base font-bold mb-2">{d.name}</div>
                          <div className="mb-1">مبلغ فروش: {d.value.toLocaleString()} تومان</div>
                          <div className="mb-1">تعداد فروش: {d.totalQuantity?.toLocaleString() ?? '-'} عدد</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '15px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-400 p-4">داده‌ای برای نمایش وجود ندارد.</div>
          )}
        </div>
        {/* جدول دسته‌بندی */}
        {!categorySalesLoading && !categorySalesError && categorySales && categorySales.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="h-10">
                  <TableHead className="text-center px-4 py-3">دسته‌بندی</TableHead>
                  <TableHead className="text-center px-4 py-3">مبلغ کل فروش (تومان)</TableHead>
                  <TableHead className="text-center px-4 py-3">تعداد فروش (عدد)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorySales.map((c, idx) => (
                  <TableRow key={c.category} className="h-10">
                    <TableCell className="text-center font-bold text-purple-300 px-4 py-3">{c.category}</TableCell>
                    <TableCell className="text-center px-4 py-3">{c.totalSales?.toLocaleString?.() ?? '-'}</TableCell>
                    <TableCell className="text-center px-4 py-3">{c.totalQuantity?.toLocaleString?.() ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* سود و زیان */}
      <div className="glass-effect card-3d rounded-xl p-5 shadow bg-gradient-to-br from-[#23272A] to-[#1e293b] border border-amber-400/30">
        <h3 className="text-lg font-bold text-amber-300 mb-4 shine-effect">گزارش سود و زیان</h3>
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-2">
          <div className="flex flex-col gap-3">
            <span className="text-white font-bold text-base">سود خالص: <span className="text-emerald-400 font-extrabold">۲۵,۰۰۰,۰۰۰</span> تومان</span>
            <span className="text-white font-bold text-base">سود ناخالص: <span className="text-amber-400 font-extrabold">۳۵,۰۰۰,۰۰۰</span> تومان</span>
            <span className="text-white font-bold text-base">هزینه‌ها: <span className="text-red-400 font-extrabold">۱۰,۰۰۰,۰۰۰</span> تومان</span>
          </div>
          <Table className="w-auto min-w-[240px] text-sm">
            <TableHeader>
              <TableRow className="h-10">
                <TableHead className="text-center px-4 py-3">شرح</TableHead>
                <TableHead className="text-center px-4 py-3">مبلغ (تومان)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="h-10">
                <TableCell className="text-center px-4 py-3">مواد اولیه</TableCell>
                <TableCell className="text-center px-4 py-3">۵,۰۰۰,۰۰۰</TableCell>
              </TableRow>
              <TableRow className="h-10">
                <TableCell className="text-center px-4 py-3">حقوق پرسنل</TableCell>
                <TableCell className="text-center px-4 py-3">۳,۰۰۰,۰۰۰</TableCell>
              </TableRow>
              <TableRow className="h-10">
                <TableCell className="text-center px-4 py-3">هزینه اجاره</TableCell>
                <TableCell className="text-center px-4 py-3">۲,۰۰۰,۰۰۰</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ساعات اوج فروش */}
      <div className="glass-effect card-3d rounded-xl p-5 shadow bg-gradient-to-br from-[#23272A] to-[#1e293b] border border-sky-400/30">
        <h3 className="text-lg font-bold text-sky-300 mb-4 shine-effect">ساعات اوج فروش</h3>
        <div className="h-56 flex items-center justify-center p-2">
          {peakHoursLoading ? (
            <div className="text-sky-300 p-4">در حال بارگذاری...</div>
          ) : peakHoursError ? (
            <div className="text-red-400 p-4">{peakHoursError}</div>
          ) : peakHours && peakHours.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakHours.map(h => ({ ساعت: h.hour, فروش: h.totalSales }))} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <XAxis dataKey="ساعت" tickMargin={8} />
                <YAxis tickMargin={8} />
                <Tooltip contentStyle={{ padding: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: '15px' }} />
                <Line type="monotone" dataKey="فروش" stroke="#38BDF8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-400 p-4">داده‌ای برای نمایش وجود ندارد.</div>
          )}
        </div>
      </div>

      {/* پرفروش‌ترین و کم‌فروش‌ترین محصولات */}
      <div className="glass-effect card-3d rounded-xl p-5 shadow bg-gradient-to-br from-[#23272A] to-[#1e293b] border border-green-400/30">
        <h3 className="text-lg font-bold text-green-300 mb-4 shine-effect">پرفروش‌ترین و کم‌فروش‌ترین محصولات</h3>
        {/* فیلتر ماه و سال */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-4 p-2">
          <Select value={selectedYear?.toString()} onValueChange={val => setSelectedYear(Number(val))}>
            <SelectTrigger className="w-36 bg-[#23272A] border-gray-700 text-white text-center">
              <SelectValue placeholder="سال جلالی" />
            </SelectTrigger>
            <SelectContent className="bg-[#23272A] text-white">
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth?.toString()} onValueChange={val => setSelectedMonth(Number(val))}>
            <SelectTrigger className="w-36 bg-[#23272A] border-gray-700 text-white text-center">
              <SelectValue placeholder="ماه جلالی" />
            </SelectTrigger>
            <SelectContent className="bg-[#23272A] text-white">
              {months.map(m => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto mb-3">
          <h4 className="text-green-400 text-sm font-bold mb-2">پرفروش‌ترین محصولات</h4>
          {bestSellersLoading ? (
            <div className="text-green-300">در حال بارگذاری...</div>
          ) : bestSellersError ? (
            <div className="text-red-400">{bestSellersError}</div>
          ) : bestSellers && bestSellers.length > 0 ? (
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="h-7">
                  <TableHead className="text-center">نام محصول</TableHead>
                  <TableHead className="text-center">تعداد فروش</TableHead>
                  <TableHead className="text-center">مبلغ کل فروش</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bestSellers.map((item, idx) => (
                  <TableRow key={item.name} className="h-7">
                    <TableCell className="text-center text-emerald-400 font-bold">{item.name}</TableCell>
                    <TableCell className="text-center">{item.totalQuantity}</TableCell>
                    <TableCell className="text-center">{item.totalSales.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-gray-400">داده‌ای برای نمایش وجود ندارد.</div>
          )}
        </div>
        <div className="overflow-x-auto">
          <h4 className="text-red-400 text-sm font-bold mb-2">کم‌فروش‌ترین محصولات</h4>
          {leastSellersLoading ? (
            <div className="text-red-300">در حال بارگذاری...</div>
          ) : leastSellersError ? (
            <div className="text-red-400">{leastSellersError}</div>
          ) : leastSellers && leastSellers.length > 0 ? (
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="h-7">
                  <TableHead className="text-center">نام محصول</TableHead>
                  <TableHead className="text-center">تعداد فروش</TableHead>
                  <TableHead className="text-center">مبلغ کل فروش</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leastSellers.map((item, idx) => (
                  <TableRow key={item.name} className="h-7">
                    <TableCell className="text-center text-red-400 font-bold">{item.name}</TableCell>
                    <TableCell className="text-center">{item.totalQuantity}</TableCell>
                    <TableCell className="text-center">{item.totalSales.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-gray-400">داده‌ای برای نمایش وجود ندارد.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
