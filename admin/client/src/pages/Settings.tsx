import { FC, useState } from 'react';
import { Settings as SettingsIcon, Trash2, CalendarDays, CalendarCheck2, CalendarHeart, Trash } from 'lucide-react';

const clearOrderCache = async (type: 'daily' | 'monthly' | 'yearly' | 'all') => {
  let url = '/api/orders/clear-cache';
  if (type !== 'all') url += `?type=${type}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('خطا در پاک‌سازی کش سفارشات');
  return res.json();
};

const BUTTONS = [
  {
    type: 'daily',
    label: 'پاک کردن کش سفارشات روزانه',
    color: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400',
    icon: <CalendarDays className="w-5 h-5 mr-2" />,
  },
  {
    type: 'monthly',
    label: 'پاک کردن کش سفارشات ماهیانه',
    color: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400',
    icon: <CalendarCheck2 className="w-5 h-5 mr-2" />,
  },
  {
    type: 'yearly',
    label: 'پاک کردن کش سفارشات سالیانه',
    color: 'bg-green-500 hover:bg-green-600 focus:ring-green-400',
    icon: <CalendarHeart className="w-5 h-5 mr-2" />,
  },
  {
    type: 'all',
    label: 'پاک کردن تمامی سفارشات',
    color: 'bg-red-600 hover:bg-red-700 focus:ring-red-400',
    icon: <Trash className="w-5 h-5 mr-2" />,
  },
];

const Settings: FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClear = async (type: 'daily' | 'monthly' | 'yearly' | 'all') => {
    setLoading(type);
    setSuccess(null);
    setError(null);
    try {
      await clearOrderCache(type);
      setSuccess('کش سفارشات با موفقیت پاک شد.');
    } catch (e) {
      setError('خطا در پاک‌سازی کش سفارشات');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center py-12 w-full max-w-2xl mx-auto">
      <SettingsIcon className="text-accent mb-4 h-16 w-16" />
      <h2 className="text-2xl font-bold text-white mb-4">تنظیمات</h2>
      <div className="w-full bg-muted/30 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Trash2 className="text-destructive" /> تنظیمات سفارشات
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {BUTTONS.map(btn => (
            <button
              key={btn.type}
              className={`flex items-center justify-center gap-2 text-white text-base font-bold py-4 rounded-xl shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${btn.color} disabled:opacity-60 disabled:cursor-not-allowed`}
              onClick={() => handleClear(btn.type as any)}
              disabled={loading === btn.type}
            >
              {btn.icon}
              {btn.label}
              {loading === btn.type && (
                <span className="ml-2 animate-spin">⏳</span>
              )}
            </button>
          ))}
        </div>
        {success && <div className="text-green-500 font-bold mt-2 text-center">{success}</div>}
        {error && <div className="text-red-500 font-bold mt-2 text-center">{error}</div>}
      </div>
      {/* سایر تنظیمات اینجا اضافه شود */}
    </div>
  );
};

export default Settings;
