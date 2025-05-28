@echo off
REM اجرای همزمان پروژه‌های user و admin و باز کردن هر دو در مرورگر

REM اجرای user
start cmd /k "cd user && npm start"

REM اجرای admin (فقط کافی است npm run dev در admin اجرا شود)
start cmd /k "cd admin && npm run dev"

REM کمی صبر برای بالا آمدن سرورها
ping 127.0.0.1 -n 8 > nul

REM باز کردن user در مرورگر (پورت 3003)
start http://localhost:3003

REM باز کردن admin در مرورگر (پورت 3000)
start http://localhost:3000 