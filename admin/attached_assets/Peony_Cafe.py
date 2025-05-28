import math
import shutil
import sqlite3
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QPushButton, QLabel, QVBoxLayout,
    QWidget, QTableWidget, QTableWidgetItem, QLineEdit, QFormLayout,
    QDialog, QFileDialog, QMessageBox, QComboBox, QHBoxLayout, QSpinBox, QToolTip,
    QToolButton, QGridLayout, QFrame, QStyle, QCalendarWidget, QDateEdit,
    QListWidget, QDialogButtonBox, QScrollArea
)
from PySide6.QtCore import Qt, Signal, QTimer, QPropertyAnimation, QEasingCurve, QDate, QSizeF, QRect
from PySide6.QtGui import QIcon, QFont, QColor, QLinearGradient, QBrush, QPixmap, QPainter, QPen, QAction
from PySide6.QtPrintSupport import QPrinter, QPrintDialog
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
import os
import sys
from datetime import datetime, timedelta
import jdatetime  # برای کار با تاریخ شمسی
from PySide6.QtPrintSupport import QPrinter, QPrintDialog


# Modern color palette
COLOR_PRIMARY = "#6a11cb"
COLOR_SECONDARY = "#2575fc"
COLOR_BACKGROUND = "#2E2E2E"
COLOR_TEXT = "#FFFFFF"
COLOR_ACCENT = "#fcd40d"
COLOR_ERROR = "#ff4444"
COLOR_SUCCESS = "#4CAF50"

# Modern button style with animations
button_style = f"""
    QPushButton {{
        color: {COLOR_TEXT};
        border: none;
        border-radius: 20px;
        padding: 20px;
        font-size: 16px;
        font-family: 'Yekan';
        font-weight: bold;
        text-align: center;
        min-width: 160px;
        min-height: 120px;
        margin: 15px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        background-color: rgba(0, 0, 0, 0.2);
    }}
    QPushButton:hover {{
        border: 2px solid rgba(255, 255, 255, 0.2);
        background-color: rgba(0, 0, 0, 0.3);
    }}
    QPushButton:pressed {{
        padding: 18px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background-color: rgba(0, 0, 0, 0.4);
    }}
"""


class ModernMainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("مدیریت هزینه‌های کافی شاپ")
        self.setGeometry(100, 100, 800, 600)
        
        # Initialize tooltip timer
        self.tooltip_timer = QTimer(self)
        self.tooltip_timer.setSingleShot(True)
        self.tooltip_timer.timeout.connect(self.show_tooltip)
        self.tooltip_widget = None
        self.tooltip_text = ""
        
        self.setStyleSheet(f"""
            QMainWindow {{
                background-color: {COLOR_BACKGROUND};
                color: {COLOR_TEXT};
                font-family: 'Yekan';
            }}
            QLabel {{
                font-size: 16px;
                color: {COLOR_TEXT};
            }}
            QLineEdit {{
                background-color: #3E3E3E;
                color: {COLOR_TEXT};
                padding: 10px;
                border-radius: 10px;
                border: 1px solid #555;
            }}
            QTableWidget {{
                background-color: #3E3E3E;
                color: {COLOR_TEXT};
                gridline-color: #555;
                font-family: 'Yekan';
                font-size: 14px;
            }}
            QHeaderView::section {{
                background-color: {COLOR_ACCENT};
                color: black;
                font-weight: bold;
                font-family: 'Yekan';
                font-size: 16px;
            }}
        """)

        # Main layout
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout(main_widget)
        layout.setSpacing(20)
        layout.setContentsMargins(20, 20, 20, 20)

        # Title layout with logo
        title_layout = QHBoxLayout()
        title_layout.setSpacing(10)  # Reduced from 20
        title_layout.setContentsMargins(0, 0, 0, 20)  # Reduced bottom margin from 30
        
        # Left logo label
        self.left_logo_label = QLabel()
        self.left_logo_label.setFixedSize(80, 80)  # Reduced from 100x100
        self.load_logo(self.left_logo_label)
        self.left_logo_label.setAlignment(Qt.AlignCenter)
        title_layout.addWidget(self.left_logo_label)
        
        # Create a vertical layout for title and subtitle
        title_container = QVBoxLayout()
        title_container.setSpacing(5)  # Space between title and subtitle
        
        # Title label with gradient effect
        title_label = QLabel("محاسبه گر قیمت منو کافه پیونی")
        title_label.setStyleSheet("font-size: 24px; font-weight: bold; color: Gold;")
        title_label.setAlignment(Qt.AlignCenter)
        title_label.setFixedHeight(50)  # Reduced height to accommodate subtitle
        title_container.addWidget(title_label)
        
        # Subtitle label
        subtitle_label = QLabel("☕️ Peony Café ... EST 2023 ☕️")
        subtitle_label.setStyleSheet("font-size: 18px; color: Gold; font-weight: bold;")
        subtitle_label.setAlignment(Qt.AlignCenter)
        subtitle_label.setFixedHeight(30)  # Match with title height
        title_container.addWidget(subtitle_label)

        # Add footer text right after subtitle
        footer_label = QLabel("Made By LoGiT3X with ❤️")
        footer_label.setStyleSheet("font-size: 14px; font-weight: bold; color: Gold;")
        footer_label.setAlignment(Qt.AlignCenter)
        footer_label.setFixedHeight(30)
        title_container.addWidget(footer_label)
        
        title_layout.addLayout(title_container, 1)  # Give title container more space
        
        # Right logo label
        self.right_logo_label = QLabel()
        self.right_logo_label.setFixedSize(80, 80)  # Reduced from 100x100
        self.load_logo(self.right_logo_label)
        self.right_logo_label.setAlignment(Qt.AlignCenter)
        title_layout.addWidget(self.right_logo_label)
        
        layout.addLayout(title_layout)
        
        # Add spacing after title section
        spacer = QLabel()
        spacer.setFixedHeight(5)  # Reduced from 10
        layout.addWidget(spacer)

        # Search box with animation
        search_layout = QHBoxLayout()
        search_layout.setSpacing(10)  # Add spacing between search box and button
        
        self.search_box = QLineEdit()
        self.search_box.setPlaceholderText("جستجو در همه بخش‌ها...")
        self.search_box.setStyleSheet("""
            QLineEdit {
                background-color: #3E3E3E;
                color: white;
                padding: 12px;
                padding-right: 15px;
                border-radius: 20px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                font-family: 'Yekan';
                font-size: 14px;
                min-width: 200px;
            }
            QLineEdit:focus {
                border: 2px solid #fcd40d;
                background-color: #4a4a4a;
            }
            QLineEdit::placeholder {
                color: #888;
            }
        """)
        self.search_box.returnPressed.connect(self.show_search_results)
        search_layout.addWidget(self.search_box)

        self.search_button = QPushButton("جستجو 🔍")
        self.search_button.setStyleSheet("""
            QPushButton {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1,
                    stop: 0 #fcd40d, stop: 1 #fce14d);
                color: black;
                padding: 12px 25px;
                border-radius: 20px;
                border: none;
                font-family: 'Yekan';
                font-size: 14px;
                font-weight: bold;
                min-width: 100px;
            }
            QPushButton:hover {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1,
                    stop: 0 #fce14d, stop: 1 #fcd40d);
                transform: scale(1.05);
            }
            QPushButton:pressed {
                padding: 10px 23px;
            }
        """)
        
        # Create a search icon with black color
        search_icon = QIcon()
        pixmap = QPixmap(24, 24)
        pixmap.fill(Qt.transparent)
        painter = QPainter(pixmap)
        painter.setPen(QPen(Qt.black, 2))
        # Draw circle
        painter.drawEllipse(4, 4, 12, 12)
        # Draw handle
        painter.drawLine(14, 14, 19, 19)
        painter.end()
        
        self.search_button.setIcon(search_icon)
        self.search_button.setLayoutDirection(Qt.RightToLeft)  # Set icon to right side
        self.search_button.clicked.connect(self.show_search_results)
        search_layout.addWidget(self.search_button)
        
        # Add some spacing around the search section
        search_container = QWidget()
        search_container.setLayout(search_layout)
        search_container.setStyleSheet("margin: 0px 0px 5px 0px;")  # Reduced bottom margin from 20px to 5px
        layout.addWidget(search_container)

        # Create a grid layout for tile buttons
        tiles_layout = QGridLayout()
        tiles_layout.setHorizontalSpacing(40)  # Reduced horizontal spacing
        tiles_layout.setVerticalSpacing(60)  # Reduced vertical spacing
        
        # Create buttons
        btn_materials = QPushButton()
        btn_materials.setText("مواد اولیه")
        btn_materials.setStyleSheet("""
            QPushButton {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, 
                    stop: 0 #FF6B6B, stop: 1 #FF8E8E);
                color: black;
                border: none;
                border-radius: 20px;
                padding: 15px;
                padding-top: 45px;
                font-size: 14px;
                font-family: 'Yekan';
                font-weight: bold;
                text-align: center;
                min-width: 160px;
                min-height: 100px;
                margin: 10px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.5);
            }
            QPushButton:hover {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, 
                    stop: 0 #FF8E8E, stop: 1 #FF6B6B);
                border: 2px solid rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            QPushButton:pressed {
                padding: 13px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
        """)
        emoji_label = QLabel("🧂")
        emoji_label.setStyleSheet("font-size: 48px; color: white; background: transparent;")
        emoji_label.setAlignment(Qt.AlignCenter)
        btn_layout = QVBoxLayout(btn_materials)
        btn_layout.setContentsMargins(0, 10, 0, 60)
        btn_layout.addWidget(emoji_label)
        btn_layout.setSpacing(30)
        btn_materials.clicked.connect(self.manage_materials)
        btn_materials.enterEvent = lambda event: self.start_tooltip_timer(btn_materials, "مدیریت مواد اولیه: اضافه کردن، ویرایش و حذف مواد اولیه.")
        btn_materials.leaveEvent = lambda event: self.hide_tooltip()

        btn_recipes = QPushButton()
        btn_recipes.setText("رسپی‌ها")
        btn_recipes.setStyleSheet("""
            QPushButton {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, 
                    stop: 0 #4ECDC4, stop: 1 #6CE5DC);
                color: black;
                border: none;
                border-radius: 20px;
                padding: 15px;
                padding-top: 45px;
                font-size: 14px;
                font-family: 'Yekan';
                font-weight: bold;
                text-align: center;
                min-width: 160px;
                min-height: 100px;
                margin: 10px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.5);
            }
            QPushButton:hover {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, 
                    stop: 0 #6CE5DC, stop: 1 #4ECDC4);
                border: 2px solid rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            QPushButton:pressed {
                padding: 13px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
        """)
        emoji_label = QLabel("📝")
        emoji_label.setStyleSheet("font-size: 48px; color: white; background: transparent;")
        emoji_label.setAlignment(Qt.AlignCenter)
        btn_layout = QVBoxLayout(btn_recipes)
        btn_layout.setContentsMargins(0, 10, 0, 60)
        btn_layout.addWidget(emoji_label)
        btn_layout.setSpacing(30)
        btn_recipes.clicked.connect(self.manage_recipes)
        btn_recipes.enterEvent = lambda event: self.start_tooltip_timer(btn_recipes, "مدیریت رسپی‌ها: اضافه کردن، ویرایش و حذف رسپی‌ها.")
        btn_recipes.leaveEvent = lambda event: self.hide_tooltip()

        btn_prices = QPushButton()
        btn_prices.setText("قیمت‌ها")
        btn_prices.setStyleSheet("""
            QPushButton {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, 
                    stop: 0 #FFD93D, stop: 1 #FFE566);
                color: black;
                border: none;
                border-radius: 20px;
                padding: 15px;
                padding-top: 45px;
                font-size: 14px;
                font-family: 'Yekan';
                font-weight: bold;
                text-align: center;
                min-width: 160px;
                min-height: 100px;
                margin: 10px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.5);
            }
            QPushButton:hover {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, 
                    stop: 0 #FFE566, stop: 1 #FFD93D);
                border: 2px solid rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            QPushButton:pressed {
                padding: 13px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
        """)
        emoji_label = QLabel("💰")
        emoji_label.setStyleSheet("font-size: 48px; color: black; background: transparent;")
        emoji_label.setAlignment(Qt.AlignCenter)
        btn_layout = QVBoxLayout(btn_prices)
        btn_layout.setContentsMargins(0, 10, 0, 60)
        btn_layout.addWidget(emoji_label)
        btn_layout.setSpacing(30)
        btn_prices.clicked.connect(self.show_prices)
        btn_prices.enterEvent = lambda event: self.start_tooltip_timer(btn_prices, "نمایش قیمت‌ها: محاسبه و نمایش قیمت نهایی منو.")
        btn_prices.leaveEvent = lambda event: self.hide_tooltip()

        btn_settings = QPushButton()
        btn_settings.setText("تنظیمات")
        btn_settings.setStyleSheet("""
            QPushButton {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, 
                    stop: 0 #9ad651, stop: 1 #b5e47f);
                color: black;
                border: none;
                border-radius: 20px;
                padding: 15px;
                padding-top: 45px;
                font-size: 14px;
                font-family: 'Yekan';
                font-weight: bold;
                text-align: center;
                min-width: 160px;
                min-height: 100px;
                margin: 10px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.5);
            }
            QPushButton:hover {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, 
                    stop: 0 #b5e47f, stop: 1 #9ad651);
                border: 2px solid rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            QPushButton:pressed {
                padding: 13px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
        """)
        emoji_label = QLabel("⚙️")
        emoji_label.setStyleSheet("font-size: 48px; color: white; background: transparent;")
        emoji_label.setAlignment(Qt.AlignCenter)
        btn_layout = QVBoxLayout(btn_settings)
        btn_layout.setContentsMargins(0, 10, 0, 60)
        btn_layout.addWidget(emoji_label)
        btn_layout.setSpacing(30)
        btn_settings.clicked.connect(self.open_settings)
        btn_settings.enterEvent = lambda event: self.start_tooltip_timer(btn_settings, "تنظیمات برنامه: تغییر فونت و تصویر پس‌زمینه.")
        btn_settings.leaveEvent = lambda event: self.hide_tooltip()

        # Add order management button
        btn_orders = QPushButton()
        btn_orders.setText("سفارشات")
        btn_orders.setStyleSheet("""
            QPushButton {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, 
                    stop: 0 #8E44AD, stop: 1 #9B59B6);
                color: white;
                border: none;
                border-radius: 20px;
                padding: 15px;
                padding-top: 45px;
                font-size: 14px;
                font-family: 'Yekan';
                font-weight: bold;
                text-align: center;
                min-width: 160px;
                min-height: 100px;
                margin: 10px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.5);
            }
            QPushButton:hover {
                background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1, 
                    stop: 0 #9B59B6, stop: 1 #8E44AD);
                border: 2px solid rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            QPushButton:pressed {
                padding: 13px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
        """)
        emoji_label = QLabel("🧾")
        emoji_label.setStyleSheet("font-size: 48px; color: white; background: transparent;")
        emoji_label.setAlignment(Qt.AlignCenter)
        btn_layout = QVBoxLayout(btn_orders)
        btn_layout.setContentsMargins(0, 10, 0, 60)
        btn_layout.addWidget(emoji_label)
        btn_layout.setSpacing(30)
        btn_orders.clicked.connect(self.manage_orders)
        btn_orders.enterEvent = lambda event: self.start_tooltip_timer(btn_orders, "مدیریت سفارشات: ثبت، ویرایش و گزارش‌گیری سفارشات")
        btn_orders.leaveEvent = lambda event: self.hide_tooltip()

        # Add buttons to grid in the specified order
        tiles_layout.addWidget(btn_recipes, 0, 0)     # Top right
        tiles_layout.addWidget(btn_materials, 0, 1)   # Top left
        tiles_layout.addWidget(btn_orders, 1, 0)      # Middle right
        tiles_layout.addWidget(btn_prices, 1, 1)      # Middle left
        tiles_layout.addWidget(btn_settings, 2, 0)    # Bottom right
        
        # Add tiles layout to main layout
        layout.addLayout(tiles_layout)

        # Initialize dialogs
        self.materials_dialog = MaterialsDialog(self)
        self.materials_dialog.material_updated.connect(self.refresh_prices)

        # اضافه کردن منوی گزارش‌گیری
        menu_bar = self.menuBar()
        report_menu = menu_bar.addMenu("گزارش‌ها")
        order_report_action = QAction("گزارش سفارشات", self)
        order_report_action.triggered.connect(self.show_order_reports)
        report_menu.addAction(order_report_action)

    def create_styled_button(self, text):
        """Create a styled button with modern appearance."""
        button = QPushButton(text)
        button.setStyleSheet(button_style)
        return button

    def manage_materials(self):
        """Open the materials management window."""
        self.materials_dialog.exec()

    def manage_recipes(self):
        """Open the recipes management window."""
        dialog = RecipesDialog(self)
        dialog.exec()

    def show_prices(self):
        """Open the prices display window."""
        self.prices_dialog = PricesDialog(self)
        self.prices_dialog.exec()

    def open_settings(self):
        """Open the settings dialog."""
        dialog = SettingsDialog(self)
        dialog.exec()

    def refresh_prices(self):
        """Refresh the prices display."""
        if hasattr(self, 'prices_dialog'):
            self.prices_dialog.refresh_prices()

    def show_search_results(self):
        """Show search results in a separate dialog."""
        search_text = self.search_box.text().strip()
        if search_text:
            dialog = SearchResultsDialog(self, search_text)
            dialog.exec()

    def start_tooltip_timer(self, widget, text):
        """Start the tooltip timer for the given widget."""
        self.tooltip_widget = widget
        self.tooltip_text = text
        self.tooltip_timer.start(3000)  # 3 seconds

    def hide_tooltip(self):
        """Hide the tooltip and stop the timer."""
        self.tooltip_timer.stop()
        QToolTip.hideText()

    def show_tooltip(self):
        """Show the tooltip after the timer finishes."""
        if self.tooltip_widget:
            QToolTip.showText(self.tooltip_widget.mapToGlobal(self.tooltip_widget.rect().bottomLeft()), self.tooltip_text)

    def load_logo(self, label):
        """Load logo from saved settings."""
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)
        cursor.execute("SELECT value FROM settings WHERE key = 'logo_path'")
        result = cursor.fetchone()
        conn.close()

        if result and result[0]:
            logo_path = result[0]
            if logo_path and QPixmap(logo_path).isNull() == False:
                pixmap = QPixmap(logo_path)
                scaled_pixmap = pixmap.scaled(80, 80, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                label.setPixmap(scaled_pixmap)

    def manage_orders(self):
        """Open the order management window."""
        dialog = OrderDialog(self)
        dialog.exec()

    def show_order_reports(self):
        dialog = OrderReportDialog(self)
        dialog.exec()


class SearchResultsDialog(QDialog):
    def __init__(self, parent=None, search_text=""):
        super().__init__(parent)
        self.setWindowTitle("نتایج جستجو")
        self.setStyleSheet(f"background-color: {COLOR_BACKGROUND}; color: {COLOR_TEXT}; font-family: 'Yekan';")
        self.setGeometry(100, 100, 1000, 600)  # Made window wider
        self.setLayoutDirection(Qt.RightToLeft)

        layout = QVBoxLayout(self)

        # Search box
        self.search_box = QLineEdit()
        self.search_box.setPlaceholderText("جستجو در نتایج...")
        self.search_box.setStyleSheet("background-color: #3E3E3E; color: white; padding: 10px; border-radius: 10px;")
        self.search_box.textChanged.connect(self.perform_search)  # Changed to perform_search
        layout.addWidget(self.search_box)

        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["بخش", "نام", "دسته‌بندی", "جزئیات", "مواد اولیه"])
        self.table.setStyleSheet(f"""
            QTableWidget {{
                background-color: #3E3E3E;
                color: {COLOR_TEXT};
                font-family: 'Yekan';
                font-size: 14px;
            }}
            QHeaderView::section {{
                background-color: {COLOR_ACCENT};
                color: black;
                font-weight: bold;
                font-family: 'Yekan';
                font-size: 16px;
            }}
        """)
        layout.addWidget(self.table)

        # Store initial search text
        self.initial_search = search_text
        self.search_box.setText(search_text)  # Set initial search text
        self.perform_search()  # Perform initial search

    def perform_search(self):
        """Search across all sections and display results."""
        results = []
        search_text = self.search_box.text().strip()

        # If search box is empty and there's an initial search term, use that
        if not search_text and self.initial_search:
            search_text = self.initial_search

        # Search in materials
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        cursor.execute("SELECT name, price_per_gram FROM materials WHERE name LIKE ?", (f"%{search_text}%",))
        materials = cursor.fetchall()
        for name, price in materials:
            results.append(("مواد اولیه", name, "-", f"قیمت هر گرم: {price} تومان", "-"))

        # Search in recipes and their categories
        cursor.execute("""
            SELECT r.id, r.name, 
                   c.name as category_name,
                   SUM(rd.quantity * m.price_per_gram) AS raw_price
            FROM recipes r
            LEFT JOIN categories c ON r.category_id = c.id
            JOIN recipe_details rd ON r.id = rd.recipe_id
            JOIN materials m ON rd.material_id = m.id
            WHERE r.name LIKE ? OR c.name LIKE ?
            GROUP BY r.id
        """, (f"%{search_text}%", f"%{search_text}%"))
        menu_items = cursor.fetchall()
        
        # Also search for exact category matches to show all items in that category
        cursor.execute("""
            SELECT r.id, r.name, 
                   c.name as category_name,
                   SUM(rd.quantity * m.price_per_gram) AS raw_price
            FROM recipes r
            JOIN categories c ON r.category_id = c.id
            JOIN recipe_details rd ON r.id = rd.recipe_id
            JOIN materials m ON rd.material_id = m.id
            WHERE c.name = ?
            GROUP BY r.id
        """, (search_text,))
        category_items = cursor.fetchall()
        
        # Combine and remove duplicates
        all_items = set()
        for recipe_id, name, category, raw_price in menu_items + category_items:
            if raw_price is None:
                continue
                
            # Get recipe ingredients
            cursor.execute("""
                SELECT m.name, rd.quantity
                FROM recipe_details rd
                JOIN materials m ON rd.material_id = m.id
                WHERE rd.recipe_id = ?
                ORDER BY m.name
            """, (recipe_id,))
            ingredients = cursor.fetchall()
            
            # Format ingredients list
            ingredients_text = "\n".join([f"• {name}: {quantity} گرم" for name, quantity in ingredients])
            
            raw_price = round(raw_price)
            secondary_price = round(raw_price * 3.3)
            price_with_tax = round(secondary_price * 1.1)
            final_price = math.ceil(price_with_tax)
            item_tuple = ("قیمت‌ها", name, category or "بدون دسته‌بندی", 
                         f"قیمت نهایی: {final_price} تومان", ingredients_text)
            all_items.add(item_tuple)
        
        results.extend(all_items)
        conn.close()

        # Display results
        self.table.setRowCount(len(results))
        for row, (section, name, category, details, ingredients) in enumerate(results):
            self.table.setItem(row, 0, QTableWidgetItem(section))
            self.table.setItem(row, 1, QTableWidgetItem(name))
            self.table.setItem(row, 2, QTableWidgetItem(category))
            self.table.setItem(row, 3, QTableWidgetItem(details))
            
            # Create a multi-line item for ingredients
            ingredients_item = QTableWidgetItem(ingredients)
            ingredients_item.setTextAlignment(Qt.AlignTop | Qt.AlignRight)
            self.table.setItem(row, 4, ingredients_item)
            
        # Adjust row heights for ingredients list
        for row in range(self.table.rowCount()):
            ingredients_text = self.table.item(row, 4).text()
            if ingredients_text != "-":
                num_lines = len(ingredients_text.split("\n"))
                self.table.setRowHeight(row, max(30, num_lines * 25))
            
        # Adjust column widths
        self.table.resizeColumnsToContents()
        
        # Make ingredients column wider
        self.table.setColumnWidth(4, 300)


class SettingsDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("تنظیمات")
        self.setStyleSheet(f"background-color: {COLOR_BACKGROUND}; color: {COLOR_TEXT}; font-family: 'Yekan';")
        self.setGeometry(100, 100, 400, 400)
        self.setLayoutDirection(Qt.RightToLeft)

        self.layout = QVBoxLayout(self)

        # Logo settings
        self.logo_label = QLabel("لوگوی برنامه:")
        self.layout.addWidget(self.logo_label)

        logo_layout = QHBoxLayout()
        self.logo_preview = QLabel()
        self.logo_preview.setFixedSize(80, 80)
        logo_layout.addWidget(self.logo_preview)

        self.select_logo_button = QPushButton("انتخاب لوگو")
        self.select_logo_button.clicked.connect(self.select_logo)
        logo_layout.addWidget(self.select_logo_button)

        self.remove_logo_button = QPushButton("حذف لوگو")
        self.remove_logo_button.clicked.connect(self.remove_logo)
        logo_layout.addWidget(self.remove_logo_button)
        
        self.layout.addLayout(logo_layout)

        # Load current logo if exists
        self.load_current_logo()

        # Font size
        self.font_size_label = QLabel("سایز فونت:")
        self.layout.addWidget(self.font_size_label)

        self.font_size_spinbox = QSpinBox()
        self.font_size_spinbox.setRange(8, 100)
        self.layout.addWidget(self.font_size_spinbox)

        # Background image
        self.background_image_label = QLabel("انتخاب تصویر پس‌زمینه:")
        self.layout.addWidget(self.background_image_label)

        self.select_background_button = QPushButton("انتخاب تصویر")
        self.select_background_button.clicked.connect(self.select_background_image)
        self.layout.addWidget(self.select_background_button)

        # Add separator
        separator = QFrame()
        separator.setFrameShape(QFrame.HLine)
        separator.setFrameShadow(QFrame.Sunken)
        separator.setStyleSheet("background-color: #555;")
        self.layout.addWidget(separator)

        # Database backup section
        backup_label = QLabel("پشتیبان‌گیری از دیتابیس:")
        backup_label.setStyleSheet("font-size: 14px; font-weight: bold; margin-top: 10px;")
        self.layout.addWidget(backup_label)

        backup_layout = QHBoxLayout()
        
        backup_button = QPushButton("تهیه نسخه پشتیبان")
        backup_button.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        backup_button.clicked.connect(self.create_backup)
        backup_layout.addWidget(backup_button)

        restore_button = QPushButton("بازیابی نسخه پشتیبان")
        restore_button.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
        """)
        restore_button.clicked.connect(self.restore_backup)
        backup_layout.addWidget(restore_button)
        
        self.layout.addLayout(backup_layout)

        # Save button
        self.save_button = QPushButton("ذخیره تنظیمات")
        self.save_button.clicked.connect(self.save_settings)
        self.layout.addWidget(self.save_button)

        self.background_image_path = ""
        self.font_size_spinbox.setValue(12)

    def create_backup(self):
        """Create a backup of the database file."""
        try:
            current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"coffee_shop_backup_{current_time}.db"
            
            backup_path, _ = QFileDialog.getSaveFileName(
                self,
                "ذخیره نسخه پشتیبان",
                backup_name,
                "Database Files (*.db)"
            )
            
            if backup_path:
                conn = sqlite3.connect("coffee_shop.db")
                conn.close()
                
                shutil.copy2("coffee_shop.db", backup_path)
                
                QMessageBox.information(
                    self,
                    "موفقیت",
                    f"نسخه پشتیبان با موفقیت در مسیر زیر ذخیره شد:\n{backup_path}"
                )
        except Exception as e:
            QMessageBox.critical(
                self,
                "خطا",
                f"خطا در ایجاد نسخه پشتیبان:\n{str(e)}"
            )

    def restore_backup(self):
        """Restore database from a backup file."""
        try:
            backup_path, _ = QFileDialog.getOpenFileName(
                self,
                "انتخاب فایل پشتیبان",
                "",
                "Database Files (*.db)"
            )
            
            if backup_path:
                # Verify backup file
                try:
                    verify_conn = sqlite3.connect(backup_path)
                    verify_cursor = verify_conn.cursor()
                    
                    # Check if it's a valid database file
                    required_tables = ['materials', 'recipes', 'recipe_details']
                    verify_cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                    existing_tables = [row[0] for row in verify_cursor.fetchall()]
                    
                    missing_tables = [table for table in required_tables if table not in existing_tables]
                    if missing_tables:
                        QMessageBox.critical(
                            self,
                            "خطا",
                            f"فایل پشتیبان معتبر نیست. جداول زیر یافت نشد:\n{', '.join(missing_tables)}"
                        )
                        return
                        
                    verify_conn.close()
                except sqlite3.Error:
                    QMessageBox.critical(
                        self,
                        "خطا",
                        "فایل انتخاب شده یک فایل دیتابیس SQLite معتبر نیست."
                    )
                    return
                
                # Confirm restoration
                confirm = QMessageBox.question(
                    self,
                    "تایید بازیابی",
                    "آیا مطمئن هستید که می‌خواهید دیتابیس را از نسخه پشتیبان بازیابی کنید؟\n"
                    "این عمل غیرقابل برگشت است و اطلاعات فعلی جایگزین خواهند شد.",
                    QMessageBox.Yes | QMessageBox.No
                )
                
                if confirm == QMessageBox.Yes:
                    # Close any open database connections
                    try:
                        conn = sqlite3.connect("coffee_shop.db")
                        conn.close()
                    except:
                        pass
                    
                    # Create a backup of current database before restore
                    current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
                    auto_backup = f"coffee_shop_auto_backup_{current_time}.db"
                    auto_backup_path = os.path.join(os.path.dirname(__file__), auto_backup)
                    shutil.copy2("coffee_shop.db", auto_backup_path)
                    
                    # Restore from backup
                    shutil.copy2(backup_path, "coffee_shop.db")
                    
                    # Initialize restored database
                    init_db()
                    
                    QMessageBox.information(
                        self,
                        "موفقیت",
                        "دیتابیس با موفقیت از نسخه پشتیبان بازیابی شد.\n"
                        f"یک نسخه پشتیبان خودکار از دیتابیس قبلی در مسیر زیر ایجاد شد:\n{auto_backup_path}"
                    )
                    
                    # Restart application
                    confirm_restart = QMessageBox.question(
                        self,
                        "راه‌اندازی مجدد",
                        "برای اعمال تغییرات، برنامه باید مجدداً راه‌اندازی شود. آیا می‌خواهید برنامه را مجدداً راه‌اندازی کنید؟",
                        QMessageBox.Yes | QMessageBox.No
                    )
                    
                    if confirm_restart == QMessageBox.Yes:
                        QApplication.quit()
                        os.execl(sys.executable, sys.executable, *sys.argv)
                    
        except Exception as e:
            QMessageBox.critical(
                self,
                "خطا",
                f"خطا در بازیابی نسخه پشتیبان:\n{str(e)}"
            )

    def load_current_logo(self):
        """Load the current logo from settings."""
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'logo_path'")
        result = cursor.fetchone()
        conn.close()

        if result and result[0]:
            logo_path = result[0]
            if logo_path and QPixmap(logo_path).isNull() == False:
                pixmap = QPixmap(logo_path)
                scaled_pixmap = pixmap.scaled(80, 80, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                self.logo_preview.setPixmap(scaled_pixmap)
                self.current_logo_path = logo_path
            else:
                self.current_logo_path = None
        else:
            self.current_logo_path = None

    def select_logo(self):
        """Open dialog to select a logo image."""
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "انتخاب لوگو",
            "",
            "Image files (*.png *.jpg *.jpeg *.bmp *.gif)"
        )
        if file_path:
            pixmap = QPixmap(file_path)
            if not pixmap.isNull():
                scaled_pixmap = pixmap.scaled(80, 80, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                self.logo_preview.setPixmap(scaled_pixmap)
                self.current_logo_path = file_path

                # Save to database
                conn = sqlite3.connect("coffee_shop.db")
                cursor = conn.cursor()
                cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                             ("logo_path", file_path))
                conn.commit()
                conn.close()

                # Update main window logos
                if isinstance(self.parent(), ModernMainWindow):
                    self.parent().load_logo(self.parent().right_logo_label)
                    self.parent().load_logo(self.parent().left_logo_label)

    def remove_logo(self):
        """Remove the current logo."""
        self.logo_preview.clear()
        self.current_logo_path = None

        # Remove from database
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM settings WHERE key = 'logo_path'")
        conn.commit()
        conn.close()

        # Update main window logos
        if isinstance(self.parent(), ModernMainWindow):
            self.parent().right_logo_label.clear()
            self.parent().left_logo_label.clear()

    def select_background_image(self):
        """Open dialog to select a background image."""
        file_path, _ = QFileDialog.getOpenFileName(self, "انتخاب تصویر پس‌زمینه", "", "Images (*.png *.jpg *.jpeg *.bmp)")
        if file_path:
            self.background_image_path = file_path

    def save_settings(self):
        """Save the settings."""
        font_size = self.font_size_spinbox.value()

        if self.current_logo_path:
            style_sheet = f"""
                QMainWindow {{
                    background-image: url('{self.background_image_path}');
                    background-repeat: no-repeat;
                    background-position: center;
                }}
                QLabel, QPushButton {{
                    font-size: {font_size}px;
                }}
            """
            self.parent().setStyleSheet(style_sheet)
        else:
            self.parent().setStyleSheet(f"QLabel, QPushButton {{ font-size: {font_size}px; }}")

        self.accept()


class MaterialsDialog(QDialog):
    material_updated = Signal()  # Custom signal

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("مدیریت مواد اولیه")
        self.setStyleSheet(f"background-color: {COLOR_BACKGROUND}; color: {COLOR_TEXT}; font-family: 'Yekan';")
        self.setGeometry(100, 100, 600, 400)
        self.setLayoutDirection(Qt.RightToLeft)  # راست‌چین کردن محتوا

        layout = QVBoxLayout(self)

        # Search box
        self.search_box = QLineEdit()
        self.search_box.setPlaceholderText("جستجو در مواد اولیه...")
        self.search_box.setStyleSheet("background-color: #3E3E3E; color: white; padding: 10px; border-radius: 10px;")
        self.search_box.textChanged.connect(self.refresh_materials)
        layout.addWidget(self.search_box)

        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(4)  # Changed to 4 to include edit button
        self.table.setHorizontalHeaderLabels(["نام مواد", "قیمت هر گرم", "ویرایش", "حذف"])
        self.table.setStyleSheet(f"""
            QTableWidget {{
                background-color: #3E3E3E;
                color: {COLOR_TEXT};
                font-family: 'Yekan';
                font-size: 14px;
            }}
            QHeaderView::section {{
                background-color: {COLOR_ACCENT};
                color: black;
                font-weight: bold;
                font-family: 'Yekan';
                font-size: 16px;
            }}
        """)
        self.refresh_materials()
        layout.addWidget(self.table)

        # Add form
        form_layout = QFormLayout()
        self.name_input = QLineEdit()
        self.price_input = QLineEdit()
        form_layout.addRow("نام:", self.name_input)
        form_layout.addRow("قیمت هر گرم:", self.price_input)

        add_button = QPushButton("اضافه کردن")
        add_button.setIcon(QIcon.fromTheme("list-add"))  # آیکون پیش‌فرض اضافه کردن
        add_button.clicked.connect(self.add_material)
        form_layout.addWidget(add_button)

        layout.addLayout(form_layout)

    def refresh_materials(self):
        """Refresh the materials table."""
        search_text = self.search_box.text().strip()
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        if search_text:
            cursor.execute("SELECT id, name, price_per_gram FROM materials WHERE name LIKE ?", (f"%{search_text}%",))
        else:
            cursor.execute("SELECT id, name, price_per_gram FROM materials")
        materials = cursor.fetchall()
        conn.close()

        self.table.setRowCount(len(materials))
        for row, material in enumerate(materials):
            material_id, name, price = material
            self.table.setItem(row, 0, QTableWidgetItem(name))
            self.table.setItem(row, 1, QTableWidgetItem(str(int(price))))  # Convert to integer

            # Add edit button
            edit_button = QPushButton("ویرایش")
            edit_button.setStyleSheet("""
                QPushButton {
                    background-color: #2196F3;
                    color: white;
                    border-radius: 5px;
                    padding: 5px;
                }
                QPushButton:hover {
                    background-color: #1976D2;
                }
            """)
            edit_button.clicked.connect(lambda checked, r=row, n=name, p=price: self.edit_material(r, n, p))
            self.table.setCellWidget(row, 2, edit_button)

            # Add delete button
            delete_button = QPushButton("حذف")
            delete_button.setStyleSheet("background-color: #ff4444; color: white; border-radius: 5px; padding: 5px;")
            delete_button.clicked.connect(lambda _, r=row: self.delete_material(r))
            self.table.setCellWidget(row, 3, delete_button)

    def edit_material(self, row, name, price):
        """Open dialog to edit a material."""
        dialog = EditMaterialDialog(self, name, price)
        if dialog.exec() == QDialog.Accepted:
            new_name, new_price = dialog.get_values()
            
            if not new_name or not new_price:
                QMessageBox.warning(self, "خطا", "لطفاً تمام فیلدها را پر کنید.")
                return
                
            try:
                new_price = int(new_price)
            except ValueError:
                QMessageBox.warning(self, "خطا", "قیمت باید عدد باشد.")
                return

            conn = sqlite3.connect("coffee_shop.db")
            cursor = conn.cursor()
            
            try:
                # Get the material ID
                cursor.execute("SELECT id FROM materials WHERE name = ?", (name,))
                material_id = cursor.fetchone()[0]
                
                # Update the material
                cursor.execute("UPDATE materials SET name = ?, price_per_gram = ? WHERE id = ?",
                             (new_name, new_price, material_id))
                
                conn.commit()
                self.refresh_materials()
                self.material_updated.emit()  # Emit signal to update other parts
                QMessageBox.information(self, "موفقیت", "ماده اولیه با موفقیت به‌روز شد.")
                
            except sqlite3.IntegrityError:
                QMessageBox.warning(self, "خطا", "این نام قبلاً استفاده شده است.")
            finally:
                conn.close()

    def add_material(self):
        """Add a new material."""
        name = self.name_input.text()
        price = self.price_input.text()

        if not name or not price:
            QMessageBox.warning(self, "خطا", "تمام فیلدها را پر کنید.")
            return

        try:
            price = int(price)  # Convert price to integer
        except ValueError:
            QMessageBox.warning(self, "خطا", "قیمت باید عدد باشد.")
            return

        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO materials (name, price_per_gram) VALUES (?, ?)", (name, price))
            conn.commit()
        except sqlite3.IntegrityError:
            QMessageBox.warning(self, "خطا", "این ماده قبلاً ثبت شده است.")
        finally:
            conn.close()

        self.refresh_materials()
        self.name_input.clear()
        self.price_input.clear()
        self.material_updated.emit()  # Emit signal

    def delete_material(self, row):
        """Delete a material from the database."""
        material_name = self.table.item(row, 0).text()
        
        # Check if material is used in any recipes
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.name 
            FROM recipes r 
            JOIN recipe_details rd ON r.id = rd.recipe_id 
            JOIN materials m ON rd.material_id = m.id 
            WHERE m.name = ?
        """, (material_name,))
        used_in_recipes = cursor.fetchall()
        
        if used_in_recipes:
            recipe_names = "\n".join([recipe[0] for recipe in used_in_recipes])
            QMessageBox.warning(
                self, 
                "هشدار", 
                f"این ماده اولیه در رسپی‌های زیر استفاده شده است و نمی‌توان آن را حذف کرد:\n{recipe_names}"
            )
            return
            
        confirm = QMessageBox.question(
            self, "حذف ماده", f"آیا مطمئن هستید که می‌خواهید ماده '{material_name}' را حذف کنید؟",
            QMessageBox.Yes | QMessageBox.No
        )
        
        if confirm == QMessageBox.Yes:
            try:
                cursor.execute("DELETE FROM materials WHERE name = ?", (material_name,))
                conn.commit()
                self.refresh_materials()
                self.material_updated.emit()  # Emit signal
                QMessageBox.information(self, "موفقیت", "ماده اولیه با موفقیت حذف شد.")
            except Exception as e:
                QMessageBox.critical(self, "خطا", f"خطا در حذف ماده اولیه:\n{str(e)}")
            finally:
                conn.close()


class EditMaterialDialog(QDialog):
    def __init__(self, parent=None, material_name=None, material_price=None):
        super().__init__(parent)
        self.setWindowTitle("ویرایش ماده اولیه")
        self.setStyleSheet(f"background-color: {COLOR_BACKGROUND}; color: {COLOR_TEXT}; font-family: 'Yekan';")
        self.setGeometry(100, 100, 400, 200)
        self.setLayoutDirection(Qt.RightToLeft)

        layout = QVBoxLayout(self)

        # Form layout for inputs
        form_layout = QFormLayout()
        
        # Name input
        self.name_input = QLineEdit()
        if material_name:
            self.name_input.setText(material_name)
        self.name_input.setStyleSheet("""
            QLineEdit {
                background-color: #3E3E3E;
                color: white;
                padding: 8px;
                border-radius: 5px;
                border: 1px solid #555;
            }
        """)
        form_layout.addRow("نام:", self.name_input)
        
        # Price input
        self.price_input = QLineEdit()
        if material_price:
            self.price_input.setText(str(material_price))
        self.price_input.setStyleSheet("""
            QLineEdit {
                background-color: #3E3E3E;
                color: white;
                padding: 8px;
                border-radius: 5px;
                border: 1px solid #555;
            }
        """)
        form_layout.addRow("قیمت (تومان):", self.price_input)
        
        layout.addLayout(form_layout)

        # Save button
        save_button = QPushButton("ذخیره تغییرات")
        save_button.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-weight: bold;
                border: none;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:pressed {
                background-color: #3d8b40;
                padding: 9px;
            }
        """)
        save_button.clicked.connect(self.accept)
        layout.addWidget(save_button)

    def get_values(self):
        return self.name_input.text(), self.price_input.text()


class RecipesDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("مدیریت رسپی‌ها")
        self.setStyleSheet(f"background-color: {COLOR_BACKGROUND}; color: {COLOR_TEXT}; font-family: 'Yekan';")
        self.setGeometry(100, 100, 1000, 500)  # Made window wider
        self.setLayoutDirection(Qt.RightToLeft)  # راست‌چین کردن محتوا

        layout = QVBoxLayout(self)

        # Search box
        self.search_box = QLineEdit()
        self.search_box.setPlaceholderText("جستجو در رسپی‌ها...")
        self.search_box.setStyleSheet("background-color: #3E3E3E; color: white; padding: 10px; border-radius: 10px;")
        self.search_box.textChanged.connect(self.refresh_recipes)
        layout.addWidget(self.search_box)

        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(4)  # Added column for price factor
        self.table.setHorizontalHeaderLabels(["نام رسپی", "تعداد مواد اولیه", "مواد اولیه و مقادیر", "ضریب قیمت"])
        self.table.setStyleSheet(f"""
            QTableWidget {{
                background-color: #3E3E3E;
                color: {COLOR_TEXT};
                font-family: 'Yekan';
                font-size: 14px;
            }}
            QHeaderView::section {{
                background-color: {COLOR_ACCENT};
                color: black;
                font-weight: bold;
                font-family: 'Yekan';
                font-size: 16px;
            }}
        """)
        self.refresh_recipes()
        layout.addWidget(self.table)

        # Buttons
        button_layout = QHBoxLayout()
        add_button = QPushButton("اضافه کردن رسپی")
        add_button.setIcon(QIcon.fromTheme("list-add"))  # آیکون پیش‌فرض اضافه کردن
        add_button.clicked.connect(self.add_recipe)
        button_layout.addWidget(add_button)

        edit_button = QPushButton("ویرایش رسپی")
        edit_button.setIcon(QIcon.fromTheme("document-edit"))  # آیکون پیش‌فرض ویرایش
        edit_button.clicked.connect(self.edit_recipe)
        button_layout.addWidget(edit_button)

        delete_button = QPushButton("حذف رسپی")
        delete_button.setIcon(QIcon.fromTheme("edit-delete"))  # آیکون پیش‌فرض حذف
        delete_button.clicked.connect(self.delete_recipe)
        button_layout.addWidget(delete_button)

        layout.addLayout(button_layout)

    def refresh_recipes(self):
        """Fetch recipes and display them in the table."""
        search_text = self.search_box.text().strip()
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        if search_text:
            cursor.execute("""
                SELECT r.id, r.name, COUNT(rd.material_id), r.price_factor
                FROM recipes r
                LEFT JOIN recipe_details rd ON r.id = rd.recipe_id
                WHERE r.name LIKE ?
                GROUP BY r.id
            """, (f"%{search_text}%",))
        else:
            cursor.execute("""
                SELECT r.id, r.name, COUNT(rd.material_id), r.price_factor
                FROM recipes r
                LEFT JOIN recipe_details rd ON r.id = rd.recipe_id
                GROUP BY r.id
            """)
        recipes = cursor.fetchall()

        self.table.setRowCount(len(recipes))
        for row, (recipe_id, name, material_count, price_factor) in enumerate(recipes):
            self.table.setItem(row, 0, QTableWidgetItem(name))
            self.table.setItem(row, 1, QTableWidgetItem(str(material_count)))

            # Get recipe ingredients with quantities
            cursor.execute("""
                SELECT m.name, rd.quantity
                FROM recipe_details rd
                JOIN materials m ON rd.material_id = m.id
                WHERE rd.recipe_id = ?
                ORDER BY m.name
            """, (recipe_id,))
            ingredients = cursor.fetchall()
            
            # Format ingredients list
            ingredients_text = "\n".join([f"• {name}: {quantity} گرم" for name, quantity in ingredients])
            
            # Create a multi-line item for ingredients
            ingredients_item = QTableWidgetItem(ingredients_text)
            ingredients_item.setTextAlignment(Qt.AlignTop | Qt.AlignRight)
            self.table.setItem(row, 2, ingredients_item)
            
            # Add price factor
            price_factor_item = QTableWidgetItem(str(price_factor if price_factor is not None else 3.3))
            price_factor_item.setTextAlignment(Qt.AlignCenter)
            self.table.setItem(row, 3, price_factor_item)
            
            # Adjust row height based on number of ingredients
            if ingredients:
                num_lines = len(ingredients)
                self.table.setRowHeight(row, max(30, num_lines * 25))

        # Adjust column widths
        self.table.resizeColumnsToContents()
        
        # Make ingredients column wider
        self.table.setColumnWidth(2, 400)
        
        conn.close()

    def add_recipe(self):
        """Open a dialog to add a new recipe."""
        dialog = RecipeEditDialog(self)
        dialog.exec()
        self.refresh_recipes()

    def edit_recipe(self):
        """Open a dialog to edit the selected recipe."""
        selected_row = self.table.currentRow()
        if selected_row == -1:
            QMessageBox.warning(self, "خطا", "لطفاً یک رسپی را انتخاب کنید.")
            return

        recipe_name = self.table.item(selected_row, 0).text()
        dialog = RecipeEditDialog(self, recipe_name)
        dialog.exec()
        self.refresh_recipes()

    def delete_recipe(self):
        """Delete the selected recipe."""
        selected_row = self.table.currentRow()
        if selected_row == -1:
            QMessageBox.warning(self, "خطا", "لطفاً یک رسپی را انتخاب کنید.")
            return

        recipe_name = self.table.item(selected_row, 0).text()
        confirm = QMessageBox.question(
            self, "حذف رسپی", f"آیا مطمئن هستید که می‌خواهید رسپی '{recipe_name}' را حذف کنید؟",
            QMessageBox.Yes | QMessageBox.No
        )
        if confirm == QMessageBox.Yes:
            conn = sqlite3.connect("coffee_shop.db")
            cursor = conn.cursor()
            cursor.execute("DELETE FROM recipes WHERE name = ?", (recipe_name,))
            cursor.execute("DELETE FROM recipe_details WHERE recipe_id = (SELECT id FROM recipes WHERE name = ?)",
                           (recipe_name,))
            conn.commit()
            conn.close()
            self.refresh_recipes()


class RecipeEditDialog(QDialog):
    def __init__(self, parent=None, recipe_name=None):
        super().__init__(parent)
        self.recipe_name = recipe_name
        self.setWindowTitle("ویرایش رسپی" if recipe_name else "اضافه کردن رسپی")
        self.setStyleSheet(f"background-color: {COLOR_BACKGROUND}; color: {COLOR_TEXT}; font-family: 'Yekan';")
        self.setGeometry(100, 100, 600, 400)
        self.setLayoutDirection(Qt.RightToLeft)  # راست‌چین کردن محتوا

        layout = QVBoxLayout(self)

        # Recipe name, category and price factor
        form_layout_top = QFormLayout()
        self.name_input = QLineEdit()
        if recipe_name:
            self.name_input.setText(recipe_name)
        
        # Add category combo box
        self.category_combo = QComboBox()
        self.category_combo.addItems(self.get_categories())
        self.category_combo.setStyleSheet(f"""
            QComboBox {{
                background-color: #3E3E3E;
                color: {COLOR_TEXT};
                padding: 5px;
                border-radius: 5px;
                border: 1px solid #555;
            }}
        """)
        
        # Add price factor input
        self.price_factor_input = QLineEdit()
        self.price_factor_input.setPlaceholderText("3.3")
        self.price_factor_input.setStyleSheet(f"""
            QLineEdit {{
                background-color: #3E3E3E;
                color: {COLOR_TEXT};
                padding: 5px;
                border-radius: 5px;
                border: 1px solid #555;
            }}
        """)
        
        form_layout_top.addRow("نام رسپی:", self.name_input)
        form_layout_top.addRow("دسته‌بندی:", self.category_combo)
        form_layout_top.addRow("ضریب قیمت:", self.price_factor_input)
        layout.addLayout(form_layout_top)

        # Materials table
        self.table = QTableWidget()
        self.table.setColumnCount(3)  # Changed to 3 to include delete button column
        self.table.setHorizontalHeaderLabels(["مواد اولیه", "مقدار (گرم)", "عملیات"])
        self.table.setStyleSheet(f"""
            QTableWidget {{
                background-color: #3E3E3E;
                color: {COLOR_TEXT};
                font-family: 'Yekan';
                font-size: 14px;
            }}
            QHeaderView::section {{
                background-color: {COLOR_ACCENT};
                color: black;
                font-weight: bold;
                font-family: 'Yekan';
                font-size: 16px;
            }}
        """)
        layout.addWidget(self.table)

        # Add material
        form_layout = QFormLayout()
        self.material_combo = QComboBox()
        self.material_combo.addItems(self.get_material_names())
        self.quantity_input = QLineEdit()
        form_layout.addRow("مواد اولیه:", self.material_combo)
        form_layout.addRow("مقدار (گرم):", self.quantity_input)

        add_material_button = QPushButton("اضافه کردن ماده")
        add_material_button.setIcon(QIcon.fromTheme("list-add"))  # آیکون پیش‌فرض اضافه کردن
        add_material_button.clicked.connect(self.add_material)
        form_layout.addWidget(add_material_button)
        layout.addLayout(form_layout)

        # Save button
        save_button = QPushButton("ذخیره رسپی")
        save_button.setIcon(QIcon.fromTheme("document-save"))  # آیکون پیش‌فرض ذخیره
        save_button.clicked.connect(self.save_recipe)
        layout.addWidget(save_button)

        if recipe_name:
            self.load_recipe()

    def get_categories(self):
        """Get all categories from the database."""
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM categories")
        categories = [row[0] for row in cursor.fetchall()]
        conn.close()
        return categories

    def get_material_names(self):
        """Get all material names from the database."""
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM materials")
        materials = [row[0] for row in cursor.fetchall()]
        conn.close()
        return materials

    def load_recipe(self):
        """Load the selected recipe details."""
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        
        # Get recipe category and price factor
        cursor.execute("""
            SELECT r.name, r.category_id, c.name, r.price_factor
            FROM recipes r
            LEFT JOIN categories c ON r.category_id = c.id
            WHERE r.name = ?
        """, (self.recipe_name,))
        recipe_data = cursor.fetchone()
        if recipe_data:
            if recipe_data[2]:  # category name
                category_index = self.category_combo.findText(recipe_data[2])
                if category_index >= 0:
                    self.category_combo.setCurrentIndex(category_index)
            if recipe_data[3]:  # price factor
                self.price_factor_input.setText(str(recipe_data[3]))
        
        # Get recipe materials
        cursor.execute("""
            SELECT m.name, rd.quantity
            FROM recipe_details rd
            JOIN materials m ON rd.material_id = m.id
            WHERE rd.recipe_id = (SELECT id FROM recipes WHERE name = ?)
        """, (self.recipe_name,))
        materials = cursor.fetchall()
        conn.close()

        self.table.setRowCount(len(materials))
        for row, (material_name, quantity) in enumerate(materials):
            self.table.setItem(row, 0, QTableWidgetItem(material_name))
            self.table.setItem(row, 1, QTableWidgetItem(str(int(quantity))))
            
            # Add delete button for each row
            delete_btn = QPushButton("حذف")
            delete_btn.setStyleSheet("background-color: #ff4444; color: white; border-radius: 5px; padding: 5px;")
            delete_btn.clicked.connect(lambda checked, r=row: self.delete_material_row(r))
            self.table.setCellWidget(row, 2, delete_btn)

    def add_material(self):
        """Add a material to the recipe."""
        material_name = self.material_combo.currentText()
        quantity = self.quantity_input.text()
        if not quantity:
            QMessageBox.warning(self, "خطا", "لطفاً مقدار را وارد کنید.")
            return

        try:
            quantity = int(quantity)  # Convert to integer
        except ValueError:
            QMessageBox.warning(self, "خطا", "مقدار باید عدد باشد.")
            return

        current_row_count = self.table.rowCount()
        self.table.insertRow(current_row_count)
        self.table.setItem(current_row_count, 0, QTableWidgetItem(material_name))
        self.table.setItem(current_row_count, 1, QTableWidgetItem(str(quantity)))

        # Add delete button for the new row
        delete_btn = QPushButton("حذف")
        delete_btn.setStyleSheet("""
            QPushButton {
                background-color: #ff4444;
                color: white;
                border-radius: 5px;
                padding: 5px;
                border: none;
            }
            QPushButton:hover {
                background-color: #ff6666;
            }
            QPushButton:pressed {
                background-color: #cc3333;
                padding: 4px;
            }
        """)
        delete_btn.clicked.connect(lambda checked, r=current_row_count: self.delete_material_row(r))
        self.table.setCellWidget(current_row_count, 2, delete_btn)

        self.quantity_input.clear()

    def delete_material_row(self, row):
        """Delete a material row from the recipe."""
        confirm = QMessageBox.question(
            self,
            "حذف ماده",
            "آیا مطمئن هستید که می‌خواهید این ماده را حذف کنید؟",
            QMessageBox.Yes | QMessageBox.No
        )
        if confirm == QMessageBox.Yes:
            self.table.removeRow(row)

    def save_recipe(self):
        """Save the recipe to the database."""
        recipe_name = self.name_input.text()
        category_name = self.category_combo.currentText()
        price_factor = self.price_factor_input.text()
        
        if not recipe_name:
            QMessageBox.warning(self, "خطا", "لطفاً نام رسپی را وارد کنید.")
            return

        # Validate price factor
        if price_factor:
            try:
                price_factor = float(price_factor)
                if price_factor <= 0:
                    raise ValueError("Price factor must be positive")
            except ValueError:
                QMessageBox.warning(self, "خطا", "ضریب قیمت باید عدد مثبت باشد.")
                return
        else:
            price_factor = 3.3  # Default value

        materials = []
        for row in range(self.table.rowCount()):
            material_name = self.table.item(row, 0).text()
            quantity = self.table.item(row, 1).text()
            try:
                quantity = int(quantity)
                materials.append((material_name, quantity))
            except ValueError:
                QMessageBox.warning(self, "خطا", f"مقدار برای '{material_name}' نامعتبر است.")
                return

        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()

        # Get category ID
        cursor.execute("SELECT id FROM categories WHERE name = ?", (category_name,))
        category_id = cursor.fetchone()[0]

        if self.recipe_name:  # Update existing recipe
            cursor.execute("""
                UPDATE recipes 
                SET name = ?, category_id = ?, price_factor = ? 
                WHERE name = ?
            """, (recipe_name, category_id, price_factor, self.recipe_name))
            cursor.execute("DELETE FROM recipe_details WHERE recipe_id = (SELECT id FROM recipes WHERE name = ?)",
                         (self.recipe_name,))
        else:  # Insert new recipe
            cursor.execute("""
                INSERT INTO recipes (name, category_id, price_factor) 
                VALUES (?, ?, ?)
            """, (recipe_name, category_id, price_factor))
            
        recipe_id = cursor.execute("SELECT id FROM recipes WHERE name = ?", (recipe_name,)).fetchone()[0]

        for material_name, quantity in materials:
            material_id = cursor.execute("SELECT id FROM materials WHERE name = ?", (material_name,)).fetchone()[0]
            cursor.execute("INSERT INTO recipe_details (recipe_id, material_id, quantity) VALUES (?, ?, ?)",
                         (recipe_id, material_id, quantity))

        conn.commit()
        conn.close()
        QMessageBox.information(self, "موفقیت", "رسپی با موفقیت ذخیره شد.")
        self.accept()


class PricesDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("قیمت‌ها")
        self.setStyleSheet(f"background-color: {COLOR_BACKGROUND}; color: {COLOR_TEXT}; font-family: 'Yekan';")
        self.setGeometry(100, 100, 800, 500)
        self.setLayoutDirection(Qt.RightToLeft)  # راست‌چین کردن محتوا

        layout = QVBoxLayout(self)

        # Search box
        self.search_box = QLineEdit()
        self.search_box.setPlaceholderText("جستجو در قیمت‌ها...")
        self.search_box.setStyleSheet("background-color: #3E3E3E; color: white; padding: 10px; border-radius: 10px;")
        self.search_box.textChanged.connect(self.refresh_prices)
        layout.addWidget(self.search_box)

        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(6)  # Added column for price factor
        self.table.setHorizontalHeaderLabels([
            "نام محصول", "دسته‌بندی", "قیمت اولیه", "قیمت ثانویه", "قیمت نهایی (تومان)", "ضریب قیمت"
        ])
        self.table.setStyleSheet(f"""
            QTableWidget {{
                background-color: #3E3E3E;
                color: {COLOR_TEXT};
                font-family: 'Yekan';
                font-size: 14px;
            }}
            QHeaderView::section {{
                background-color: {COLOR_ACCENT};
                color: black;
                font-weight: bold;
                font-family: 'Yekan';
                font-size: 16px;
            }}
        """)
        self.refresh_prices()
        layout.addWidget(self.table)

        # Export button
        export_button = QPushButton("ذخیره به PNG")
        export_button.setIcon(QIcon.fromTheme("document-save-as"))
        export_button.clicked.connect(self.export_to_image)
        layout.addWidget(export_button)

    def calculate_prices(self):
        """Calculate prices for each recipe."""
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.name, 
                   c.name as category_name,
                   SUM(rd.quantity * m.price_per_gram) AS raw_price,
                   r.price_factor
            FROM recipes r
            LEFT JOIN categories c ON r.category_id = c.id
            JOIN recipe_details rd ON r.id = rd.recipe_id
            JOIN materials m ON rd.material_id = m.id
            GROUP BY r.id
        """)
        data = cursor.fetchall()
        conn.close()

        prices = []
        for name, category, raw_price, price_factor in data:
            if raw_price is None:
                continue
            raw_price = round(raw_price)
            # Use recipe-specific price factor, fallback to 3.3 if not set
            factor = price_factor if price_factor is not None else 3.3
            secondary_price = round(raw_price * factor)
            price_with_tax = round(secondary_price * 1.1)
            final_price = math.ceil(price_with_tax)
            prices.append((name, category or "بدون دسته‌بندی", raw_price, secondary_price, final_price, factor))
        return prices

    def refresh_prices(self):
        """Fetch menu items and display them in the table."""
        search_text = self.search_box.text().strip()
        prices = self.calculate_prices()
        if search_text:
            prices = [item for item in prices if search_text.lower() in item[0].lower() or 
                     (item[1] and search_text.lower() in item[1].lower())]
        
        self.table.setRowCount(len(prices))
        for row, (name, category, raw_price, secondary_price, final_price, factor) in enumerate(prices):
            self.table.setItem(row, 0, QTableWidgetItem(name))
            self.table.setItem(row, 1, QTableWidgetItem(category))
            self.table.setItem(row, 2, QTableWidgetItem(f"{raw_price} تومان"))
            self.table.setItem(row, 3, QTableWidgetItem(f"{secondary_price} تومان"))
            self.table.setItem(row, 4, QTableWidgetItem(f"{final_price} تومان"))
            self.table.setItem(row, 5, QTableWidgetItem(str(factor)))

    def export_to_image(self):
        """Export the menu as a PNG image."""
        file_path, _ = QFileDialog.getSaveFileName(self, "ذخیره فایل", filter="PNG Files (*.png)")
        if not file_path:
            return

        prices = self.calculate_prices()
        if not prices:
            QMessageBox.warning(self, "خطا", "هیچ محصولی برای ذخیره وجود ندارد.")
            return

        try:
            # Create image with higher resolution
            width = 1200
            height = 1800
            img = Image.new('RGB', (width, height), color='white')
            draw = ImageDraw.Draw(img)

            # Load font with proper error handling
            font_path = os.path.join(os.path.dirname(__file__), "Yekan.ttf")
            if not os.path.exists(font_path):
                QMessageBox.warning(self, "هشدار", "فایل فونت Yekan.ttf در کنار برنامه یافت نشد. لطفاً فونت را در کنار برنامه قرار دهید.")
                return

            # Initialize fonts with different sizes
            title_font = ImageFont.truetype(font_path, 60)
            subtitle_font = ImageFont.truetype(font_path, 40)
            category_font = ImageFont.truetype(font_path, 45)
            item_font = ImageFont.truetype(font_path, 32)
            price_font = ImageFont.truetype(font_path, 32)

            # Draw gradient header
            for y in range(200):
                color = self.interpolate_color((106, 17, 203), (37, 117, 252), y/200)
                draw.line([(0, y), (width, y)], fill=color, width=1)

            # Reshape and reorder Persian text for proper display
            title_text = get_display(arabic_reshaper.reshape("منوی کافه پیونی"))
            subtitle_text = "☕️ Peony Café ... EST 2023 ☕️"
            
            # Add shadow effect to title
            draw.text((width//2+2, 72), title_text, font=title_font, fill=(0, 0, 0, 128), anchor='mm')
            draw.text((width//2, 70), title_text, font=title_font, fill='white', anchor='mm')
            
            # Add subtitle
            draw.text((width//2, 140), subtitle_text, font=subtitle_font, fill='#fcd40d', anchor='mm')

            # Draw decorative line
            draw.line([100, 180, width-100, 180], fill='#fcd40d', width=3)

            # Organize items by category
            categories = {}
            for name, category, _, _, final_price, _ in prices:
                if category not in categories:
                    categories[category] = []
                categories[category].append((name, final_price))

            # Draw menu items
            y = 250
            for category, items in sorted(categories.items()):
                if y > height - 200:
                    new_height = height + 500
                    new_img = Image.new('RGB', (width, new_height), color='white')
                    new_img.paste(img, (0, 0))
                    img = new_img
                    draw = ImageDraw.Draw(img)
                    height = new_height

                # Draw category header with decorative elements
                category_text = get_display(arabic_reshaper.reshape(f"⚜ {category} ⚜"))
                draw.text((width-80, y), category_text, font=category_font, fill='#2575fc', anchor='ra')
                draw.line([80, y+50, width-80, y+50], fill='#fcd40d', width=2)
                y += 80

                # Draw items with proper RTL alignment
                for name, price in sorted(items, key=lambda x: x[0]):
                    if y > height - 100:
                        new_height = height + 500
                        new_img = Image.new('RGB', (width, new_height), color='white')
                        new_img.paste(img, (0, 0))
                        img = new_img
                        draw = ImageDraw.Draw(img)
                        height = new_height

                    # Reshape and reorder Persian text
                    reshaped_name = get_display(arabic_reshaper.reshape(name))
                    price_text = get_display(arabic_reshaper.reshape(f"{price:,} تومان"))
                    
                    # Draw item name (right-aligned)
                    draw.text((width-80, y), reshaped_name, font=item_font, fill=(46, 46, 46), anchor='ra')
                    
                    # Draw dots between name and price
                    name_width = draw.textlength(reshaped_name, font=item_font)
                    price_width = draw.textlength(price_text, font=price_font)
                    dots_width = width - 160 - name_width - price_width
                    dots = "." * int(dots_width / 5)
                    draw.text((width-80-name_width-10, y), dots, font=item_font, fill=(136, 136, 136), anchor='ra')
                    
                    # Draw price (left-aligned)
                    draw.text((80, y), price_text, font=price_font, fill=(106, 17, 203), anchor='la')
                    
                    y += 50

                y += 30

            # Add footer
            footer_font = ImageFont.truetype(font_path, 24)
            footer_text = "Made By LoGiT3X with ❤️"
            draw.text((width//2, y-10), footer_text, font=footer_font, fill=(136, 136, 136), anchor='mm')

            # Crop image to actual content
            img = img.crop((0, 0, width, y + 50))

            # Save image with high quality
            img.save(file_path, "PNG", optimize=True, quality=95)
            QMessageBox.information(self, "موفقیت", "منو با موفقیت به تصویر ذخیره شد.")

        except Exception as e:
            QMessageBox.critical(self, "خطا", f"خطایی در ذخیره تصویر رخ داد: {str(e)}")

    def interpolate_color(self, color1, color2, factor):
        """Create a gradient color between two colors."""
        return tuple(int(color1[i] + (color2[i] - color1[i]) * factor) for i in range(3))


class OrderDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("مدیریت سفارشات")
        self.setStyleSheet(f"background-color: {COLOR_BACKGROUND}; color: {COLOR_TEXT}; font-family: 'Yekan';")
        
        # Initialize category_buttons list
        self.category_buttons = []
        
        # Set window to maximize by default
        self.setWindowState(Qt.WindowMaximized)
        
        # Setup timer for live time update
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_jalali_date)
        self.timer.start(1000)  # Update every second
        
        # Main layout
        main_layout = QVBoxLayout(self)
        main_layout.setSpacing(10)
        main_layout.setContentsMargins(10, 10, 10, 10)

        # Top section with date and receipt number
        top_info_layout = QHBoxLayout()
        
        # تاریخ شمسی
        self.lbl_date = QLabel()
        self.update_jalali_date()
        top_info_layout.addWidget(self.lbl_date)
        
        # شماره فیش
        self.receipt_number = self.generate_receipt_number()
        self.lbl_receipt = QLabel(f"شماره فیش: {self.receipt_number}")
        self.lbl_receipt.setStyleSheet("font-weight: bold; color: #fcd40d;")
        top_info_layout.addWidget(self.lbl_receipt)
        
        main_layout.addLayout(top_info_layout)

        # Category buttons in two horizontal rows
        categories = self.get_categories()
        num_categories = len(categories)
        num_per_row = (num_categories + 1) // 2  # Split categories into two rows
        
        # First row of categories
        first_row = QHBoxLayout()
        for i in range(num_per_row):
            btn = self.create_category_button(categories[i])
            first_row.addWidget(btn)
        main_layout.addLayout(first_row)
        
        # Second row of categories
        second_row = QHBoxLayout()
        for i in range(num_per_row, num_categories):
            btn = self.create_category_button(categories[i])
            second_row.addWidget(btn)
        main_layout.addLayout(second_row)

        # Split the main content into two columns
        content_layout = QHBoxLayout()
        
        # Right column (Recipe list)
        right_column = QVBoxLayout()
        right_column.addWidget(QLabel("منو:"))
        self.recipes_list = QListWidget()
        self.recipes_list.setMaximumWidth(300)
        self.recipes_list.setLayoutDirection(Qt.RightToLeft)  # Set layout direction to RTL
        self.recipes_list.setStyleSheet("""
            QListWidget {
                background-color: #3E3E3E;
                color: white;
                border-radius: 10px;
                padding: 5px;
                text-align: right;  /* Right align text */
            }
            QListWidget::item {
                padding: 5px;
                border-radius: 5px;
                text-align: right;  /* Right align items */
            }
            QListWidget::item:selected {
                background-color: #4a4a4a;
                color: #fcd40d;
            }
        """)
        self.recipes_list.itemClicked.connect(self.show_recipe_details)
        right_column.addWidget(self.recipes_list)

        # Left column (Order details)
        left_column = QVBoxLayout()
        
        # Order details table
        self.order_details = QTableWidget()
        self.order_details.setColumnCount(5)  # Changed from 4 to 5 to add delete button column
        self.order_details.setHorizontalHeaderLabels(["آیتم", "قیمت واحد", "تعداد", "جمع کل", "حذف"])
        self.order_details.setLayoutDirection(Qt.RightToLeft)  # Set table layout to RTL
        self.order_details.setStyleSheet("""
            QTableWidget {
                background-color: #3E3E3E;
                color: white;
                border-radius: 10px;
                padding: 5px;
            }
            QHeaderView::section {
                background-color: #4a4a4a;
                color: #fcd40d;
                padding: 5px;
                border-radius: 5px;
                text-align: center;  /* Center align headers */
            }
            QTableWidget::item {
                text-align: center;  /* Center align items */
            }
        """)
        
        # Set alignment for each column header
        for i in range(5):
            self.order_details.horizontalHeader().setDefaultAlignment(Qt.AlignCenter)
        left_column.addWidget(self.order_details)

        # Controls section
        controls_layout = QHBoxLayout()
        
        # Add spacer to push everything to the right
        controls_layout.addStretch()
        
        # Add quantity spinbox with improved styling
        self.quantity_spin = QSpinBox()
        self.quantity_spin.setMinimum(1)
        self.quantity_spin.setMaximum(99)
        self.quantity_spin.setStyleSheet("""
            QSpinBox {
                background-color: #3E3E3E;
                color: white;
                border-radius: 5px;
                padding: 5px;
                min-width: 80px;
                min-height: 35px;
            }
            QSpinBox::up-button {
                width: 25px;
                border-radius: 3px;
                background-color: #4CAF50;
                subcontrol-position: right;
                image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTcgMTRsNS01IDUgNXoiLz48L3N2Zz4=);
            }
            QSpinBox::down-button {
                width: 25px;
                border-radius: 3px;
                background-color: #f44336;
                subcontrol-position: left;
                image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTcgMTBsNSA1IDUtNXoiLz48L3N2Zz4=);
            }
            QSpinBox::up-button:hover {
                background-color: #45a049;
            }
            QSpinBox::down-button:hover {
                background-color: #da190b;
            }
            QSpinBox::up-button:pressed {
                background-color: #3d8b40;
            }
            QSpinBox::down-button:pressed {
                background-color: #c62828;
            }
        """)
        self.quantity_spin.setAlignment(Qt.AlignCenter)
        
        # Add label after spinbox (will appear on the right in RTL layout)
        quantity_label = QLabel("تعداد:")
        quantity_label.setStyleSheet("color: white; font-weight: bold;")
        
        controls_layout.addWidget(self.quantity_spin)
        controls_layout.addWidget(quantity_label)
        
        btn_add = QPushButton("اضافه به سفارش")
        btn_add.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border-radius: 5px;
                padding: 8px 15px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        btn_add.clicked.connect(self.add_to_order)
        controls_layout.addWidget(btn_add)
        left_column.addLayout(controls_layout)

        # Total amount with better styling
        total_container = QFrame()
        total_container.setStyleSheet("""
            QFrame {
                background-color: #3E3E3E;
                border-radius: 10px;
                padding: 10px;
            }
        """)
        total_layout = QHBoxLayout(total_container)
        self.lbl_total = QLabel("مجموع کل: 0 تومان")
        self.lbl_total.setStyleSheet("font-size: 18px; font-weight: bold; color: #fcd40d;")
        total_layout.addWidget(self.lbl_total)
        left_column.addWidget(total_container)

        # Add columns to content layout in correct order (right to left)
        content_layout.addLayout(left_column)  # Order details on the left
        content_layout.addLayout(right_column)  # Menu on the right
        main_layout.addLayout(content_layout)

        # Bottom buttons with better styling
        btn_layout = QHBoxLayout()
        
        # Save button (ثبت سفارش)
        save_btn = QPushButton("ثبت سفارش")
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border-radius: 5px;
                padding: 10px 20px;
                font-weight: bold;
                min-width: 120px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        save_btn.clicked.connect(self.save_order)
        
        # Print button (پرینت سفارش)
        print_btn = QPushButton("پرینت سفارش")
        print_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border-radius: 5px;
                padding: 10px 20px;
                font-weight: bold;
                min-width: 120px;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
        """)
        print_btn.clicked.connect(self.print_order)
        
        # Cancel button (لغو سفارش)
        cancel_btn = QPushButton("لغو سفارش")
        cancel_btn.setStyleSheet("""
            QPushButton {
                background-color: #f44336;
                color: white;
                border-radius: 5px;
                padding: 10px 20px;
                font-weight: bold;
                min-width: 120px;
            }
            QPushButton:hover {
                background-color: #da190b;
            }
        """)
        cancel_btn.clicked.connect(self.reject)
        
        btn_layout.addWidget(save_btn)
        btn_layout.addWidget(print_btn)
        btn_layout.addWidget(cancel_btn)
        main_layout.addLayout(btn_layout)

        # Load initial data
        if self.category_buttons:
            self.category_buttons[0].setChecked(True)
            self.on_category_clicked('همه')

    def create_category_button(self, category):
        """Create a styled category button with rotating neon border animation"""
        btn = QPushButton(category)
        btn.setCheckable(True)
        
        # Create animation for rotating neon border
        neon_animation = QPropertyAnimation(btn, b"styleSheet")
        neon_animation.setDuration(2000)  # 2 seconds for one full rotation
        neon_animation.setLoopCount(-1)  # Infinite loop
        
        # Define the keyframes for the animation with rotating border colors
        keyframes = [
            f"""
            QPushButton {{
                background-color: {COLOR_SECONDARY};
                color: white;
                border-radius: 10px;
                padding: 5px 10px;
                font-size: 12px;
                font-weight: bold;
                min-width: 84px;
                height: 28px;
                border: 2px solid #ff0000;
            }}
            QPushButton:checked {{
                background-color: {COLOR_PRIMARY};
                border: 2px solid #ff0000;
            }}
            QPushButton:hover {{
                background-color: {COLOR_PRIMARY};
                border: 2px solid #ff0000;
            }}
            """,
            f"""
            QPushButton {{
                background-color: {COLOR_SECONDARY};
                color: white;
                border-radius: 10px;
                padding: 5px 10px;
                font-size: 12px;
                font-weight: bold;
                min-width: 84px;
                height: 28px;
                border: 2px solid #ffd700;
            }}
            QPushButton:checked {{
                background-color: {COLOR_PRIMARY};
                border: 2px solid #ffd700;
            }}
            QPushButton:hover {{
                background-color: {COLOR_PRIMARY};
                border: 2px solid #ffd700;
            }}
            """,
            f"""
            QPushButton {{
                background-color: {COLOR_SECONDARY};
                color: white;
                border-radius: 10px;
                padding: 5px 10px;
                font-size: 12px;
                font-weight: bold;
                min-width: 84px;
                height: 28px;
                border: 2px solid #00ff00;
            }}
            QPushButton:checked {{
                background-color: {COLOR_PRIMARY};
                border: 2px solid #00ff00;
            }}
            QPushButton:hover {{
                background-color: {COLOR_PRIMARY};
                border: 2px solid #00ff00;
            }}
            """
        ]
        
        # Set up the animation with easing curve for smooth rotation
        neon_animation.setEasingCurve(QEasingCurve.Linear)
        neon_animation.setKeyValueAt(0, keyframes[0])
        neon_animation.setKeyValueAt(0.33, keyframes[1])
        neon_animation.setKeyValueAt(0.66, keyframes[2])
        neon_animation.setKeyValueAt(1, keyframes[0])
        
        # Store animation as a property of the button
        btn.neon_animation = neon_animation
        
        # Connect hover events to start/stop animation
        btn.enterEvent = lambda event: self.start_neon_animation(btn)
        btn.leaveEvent = lambda event: self.stop_neon_animation(btn)
        
        # Set initial style
        btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {COLOR_SECONDARY};
                color: white;
                border-radius: 10px;
                padding: 5px 10px;
                font-size: 12px;
                font-weight: bold;
                min-width: 84px;
                height: 28px;
                border: 2px solid {COLOR_ACCENT};
            }}
            QPushButton:checked {{
                background-color: {COLOR_PRIMARY};
                border: 2px solid {COLOR_ACCENT};
            }}
            QPushButton:hover {{
                background-color: {COLOR_PRIMARY};
                border: 2px solid {COLOR_ACCENT};
            }}
        """)
        
        btn.clicked.connect(lambda checked, cat=category: self.on_category_clicked(cat))
        self.category_buttons.append(btn)
        return btn

    def start_neon_animation(self, button):
        """Start the neon animation for the button"""
        if hasattr(button, 'neon_animation'):
            button.neon_animation.start()

    def stop_neon_animation(self, button):
        """Stop the neon animation for the button"""
        if hasattr(button, 'neon_animation'):
            button.neon_animation.stop()
            # Reset to default style
            button.setStyleSheet(f"""
                QPushButton {{
                    background-color: {COLOR_SECONDARY};
                    color: white;
                    border-radius: 10px;
                    padding: 5px 10px;
                    font-size: 12px;
                    font-weight: bold;
                    min-width: 84px;
                    height: 28px;
                    border: 2px solid {COLOR_ACCENT};
                }}
                QPushButton:checked {{
                    background-color: {COLOR_PRIMARY};
                    border: 2px solid {COLOR_ACCENT};
                }}
                QPushButton:hover {{
                    background-color: {COLOR_PRIMARY};
                    border: 2px solid {COLOR_ACCENT};
                }}
            """)

    def generate_receipt_number(self):
        """Generate a unique receipt number based on current Jalali date and time"""
        now = datetime.now()
        jalali_datetime = jdatetime.datetime.fromgregorian(datetime=now)
        # Format: YYYYMMDD-HHMMSS in Jalali
        return jalali_datetime.strftime("%Y%m%d-%H%M%S")

    def update_jalali_date(self):
        """Update the Jalali date and time display"""
        now = datetime.now()
        jalali_date = jdatetime.datetime.fromgregorian(datetime=now)
        formatted_date = jalali_date.strftime("%Y/%m/%d %H:%M:%S")
        self.lbl_date.setText(f"تاریخ و زمان: {formatted_date}")
        self.lbl_date.setStyleSheet("font-weight: bold; color: #fcd40d;")

    def save_order(self):
        try:
            conn = sqlite3.connect("coffee_shop.db")
            cursor = conn.cursor()
            
            # Get current Jalali date and time
            now = datetime.now()
            jalali_datetime = jdatetime.datetime.fromgregorian(datetime=now)
            jalali_date = jalali_datetime.strftime("%Y/%m/%d")
            jalali_time = jalali_datetime.strftime("%H:%M:%S")
            
            # Calculate total
            total = sum(
                int(self.order_details.item(row, 3).text().replace(',', ''))
                for row in range(self.order_details.rowCount())
            )
            
            # Save order details
            cursor.execute("""
                INSERT INTO orders 
                (receipt_number, order_date, jalali_date, jalali_time, total_amount) 
                VALUES (?, ?, ?, ?, ?)
            """, (self.receipt_number, now.strftime("%Y-%m-%d %H:%M:%S"), 
                  jalali_date, jalali_time, total))
            
            order_id = cursor.lastrowid
            
            # Save order items
            for row in range(self.order_details.rowCount()):
                item_name = self.order_details.item(row, 0).text()
                quantity = int(self.order_details.item(row, 2).text())
                unit_price = int(self.order_details.item(row, 1).text().replace(',', ''))
                
                cursor.execute("SELECT id FROM recipes WHERE name = ?", (item_name,))
                recipe_id = cursor.fetchone()[0]
                
                cursor.execute("""
                    INSERT INTO order_items 
                    (order_id, recipe_id, quantity, unit_price, total_price) 
                    VALUES (?, ?, ?, ?, ?)
                """, (order_id, recipe_id, quantity, unit_price, unit_price * quantity))
            
            conn.commit()
            
            # Show success message with receipt details
            receipt_details = f"""
            سفارش با موفقیت ثبت شد!
            
            شماره فیش: {self.receipt_number}
            تاریخ: {jalali_date}
            ساعت: {jalali_time}
            تعداد آیتم‌ها: {self.order_details.rowCount()}
            مبلغ کل: {total:,} تومان
            """
            QMessageBox.information(self, "موفقیت", receipt_details)
            self.accept()
            
        except Exception as e:
            QMessageBox.critical(self, "خطا", f"خطا در ثبت سفارش:\n{str(e)}")
        finally:
            conn.close()

    def on_category_clicked(self, category):
        """Handle category button clicks"""
        # Uncheck all other buttons
        for btn in self.category_buttons:
            if btn.text() != category:
                btn.setChecked(False)
            elif btn.text() == category:
                btn.setChecked(True)
        
        self.load_recipes(category)

    def load_recipes(self, category=None):
        """Load recipes based on selected category"""
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        
        if category == 'همه':
            query = """
                SELECT r.name, SUM(rd.quantity * m.price_per_gram) * COALESCE(r.price_factor, 3.3) * 1.1 as final_price
                FROM recipes r
                JOIN recipe_details rd ON r.id = rd.recipe_id
                JOIN materials m ON rd.material_id = m.id
                GROUP BY r.id, r.name
                ORDER BY r.name
            """
            cursor.execute(query)
        else:
            query = """
                SELECT r.name, SUM(rd.quantity * m.price_per_gram) * COALESCE(r.price_factor, 3.3) * 1.1 as final_price
                FROM recipes r
                JOIN recipe_details rd ON r.id = rd.recipe_id
                JOIN materials m ON rd.material_id = m.id
                JOIN categories c ON r.category_id = c.id
                WHERE c.name = ?
                GROUP BY r.id, r.name
                ORDER BY r.name
            """
            cursor.execute(query, (category,))
            
        self.recipes = {row[0]: row[1] for row in cursor.fetchall()}
        self.recipes_list.clear()
        for name in self.recipes:
            self.recipes_list.addItem(name)
            
        conn.close()

    def show_recipe_details(self, item):
        recipe_name = item.text()
        price = self.recipes[recipe_name]
        self.selected_recipe = (recipe_name, price)

    def add_to_order(self):
        if hasattr(self, 'selected_recipe'):
            name, price = self.selected_recipe
            quantity = self.quantity_spin.value()
            total = price * quantity

            row = self.order_details.rowCount()
            self.order_details.insertRow(row)
            
            # Create items with center alignment
            name_item = QTableWidgetItem(name)
            name_item.setTextAlignment(Qt.AlignCenter)
            
            price_item = QTableWidgetItem(f"{int(price):,}")
            price_item.setTextAlignment(Qt.AlignCenter)
            
            quantity_item = QTableWidgetItem(str(quantity))
            quantity_item.setTextAlignment(Qt.AlignCenter)
            
            total_item = QTableWidgetItem(f"{int(total):,}")
            total_item.setTextAlignment(Qt.AlignCenter)
            
            # Create delete button
            delete_btn = QPushButton("حذف")
            delete_btn.setStyleSheet("""
                QPushButton {
                    background-color: #ff4444;
                    color: white;
                    border-radius: 5px;
                    padding: 5px;
                    border: none;
                }
                QPushButton:hover {
                    background-color: #ff6666;
                }
                QPushButton:pressed {
                    background-color: #cc3333;
                    padding: 4px;
                }
            """)
            delete_btn.clicked.connect(lambda checked, r=row: self.delete_order_item(r))
            
            # Set items in table
            self.order_details.setItem(row, 0, name_item)
            self.order_details.setItem(row, 1, price_item)
            self.order_details.setItem(row, 2, quantity_item)
            self.order_details.setItem(row, 3, total_item)
            self.order_details.setCellWidget(row, 4, delete_btn)
            
            self.update_total()

    def delete_order_item(self, row):
        """Delete an item from the order details table."""
        confirm = QMessageBox.question(
            self,
            "حذف آیتم",
            "آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟",
            QMessageBox.Yes | QMessageBox.No
        )
        
        if confirm == QMessageBox.Yes:
            self.order_details.removeRow(row)
            self.update_total()

    def update_total(self):
        total = sum(
            int(self.order_details.item(row, 3).text().replace(',', ''))
            for row in range(self.order_details.rowCount())
        )
        self.lbl_total.setText(f"مجموع کل: {total:,} تومان")

    def get_categories(self):
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM categories")
        categories = [row[0] for row in cursor.fetchall()]
        conn.close()
        return ['همه'] + categories

    def print_order(self):
        if self.order_details.rowCount() == 0:
            QMessageBox.warning(self, "هشدار", "هیچ سفارشی برای چاپ وجود ندارد.")
            return

        # Calculate jalali date
        now = datetime.now()
        jalali_datetime = jdatetime.datetime.fromgregorian(datetime=now)
        self.jalali_date = jalali_datetime.strftime("%Y/%m/%d %H:%M:%S")

        # Calculate total amount
        self.total_amount = sum(
            int(self.order_details.item(row, 3).text().replace(',', ''))
            for row in range(self.order_details.rowCount())
        )

        # Create print preview dialog
        dialog = QDialog(self)
        dialog.setWindowTitle("پیش‌نمایش چاپ")
        dialog.setFixedWidth(208)  # 55mm = 208 pixels
        dialog.setMinimumHeight(400)
        dialog.setLayoutDirection(Qt.RightToLeft)
        
        main_layout = QVBoxLayout(dialog)
        main_layout.setContentsMargins(2, 2, 2, 2)
        main_layout.setSpacing(1)

        # Create a scroll area
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        scroll.setStyleSheet("QScrollArea { border: none; background: white; }")
        
        # Create a widget to hold all content
        content_widget = QWidget()
        content_widget.setStyleSheet("background: white;")
        layout = QVBoxLayout(content_widget)
        layout.setContentsMargins(2, 2, 2, 2)
        layout.setSpacing(1)

        # Store name
        store_name = QLabel("کافه پیونی")
        store_name.setAlignment(Qt.AlignCenter)
        store_name.setStyleSheet("font-size: 11px; font-weight: bold; color: black; margin: 2px;")
        layout.addWidget(store_name)

        # Receipt info
        receipt_info = QLabel(f"شماره فیش: {self.receipt_number}")
        receipt_info.setAlignment(Qt.AlignCenter)
        receipt_info.setStyleSheet("font-size: 9px; color: black; margin: 1px;")
        layout.addWidget(receipt_info)

        date_info = QLabel(f"{self.jalali_date}")
        date_info.setAlignment(Qt.AlignCenter)
        date_info.setStyleSheet("font-size: 9px; color: black; margin: 1px;")
        layout.addWidget(date_info)

        # Separator
        layout.addWidget(self.create_separator())

        # Order items table
        table = QTableWidget()
        table.setStyleSheet("""
            QTableWidget {
                border: none;
                background-color: white;
                gridline-color: #cccccc;
                color: black;
            }
            QTableWidget::item {
                padding: 2px;
                border-bottom: 1px solid #eee;
            }
            QHeaderView::section {
                background-color: white;
                color: black;
                font-size: 8px;
                font-weight: bold;
                padding: 2px;
                border: none;
                border-bottom: 1px solid black;
            }
        """)
        
        table.setColumnCount(4)
        table.setHorizontalHeaderLabels(["نام", "قیمت", "تعداد", "جمع"])
        
        # Calculate optimal column widths (total 200 pixels)
        table.setColumnWidth(0, 80)  # نام
        table.setColumnWidth(1, 40)  # قیمت
        table.setColumnWidth(2, 30)  # تعداد
        table.setColumnWidth(3, 50)  # جمع

        # Add items to table
        items = []
        for row in range(self.order_details.rowCount()):
            name = self.order_details.item(row, 0).text()
            price = int(self.order_details.item(row, 1).text().replace(",", ""))
            quantity = int(self.order_details.item(row, 2).text())
            total = price * quantity
            items.append((name, price, quantity, total))

        table.setRowCount(len(items))
        
        for i, (name, price, quantity, total) in enumerate(items):
            name_item = QTableWidgetItem(name)
            name_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            name_item.setFont(QFont("Arial", 8))
            
            price_item = QTableWidgetItem(f"{price:,}")
            price_item.setTextAlignment(Qt.AlignCenter)
            price_item.setFont(QFont("Arial", 8))
            
            qty_item = QTableWidgetItem(str(quantity))
            qty_item.setTextAlignment(Qt.AlignCenter)
            qty_item.setFont(QFont("Arial", 8))
            
            total_item = QTableWidgetItem(f"{total:,}")
            total_item.setTextAlignment(Qt.AlignLeft | Qt.AlignVCenter)
            total_item.setFont(QFont("Arial", 8))

            table.setItem(i, 0, name_item)
            table.setItem(i, 1, price_item)
            table.setItem(i, 2, qty_item)
            table.setItem(i, 3, total_item)
            table.setRowHeight(i, 18)

        table.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        table.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        table.setSelectionMode(QTableWidget.NoSelection)
        table.setFocusPolicy(Qt.NoFocus)
        layout.addWidget(table)

        # Add separator before total
        layout.addWidget(self.create_separator())

        # Total amount
        total_label = QLabel(f"جمع کل: {self.total_amount:,} تومان")
        total_label.setAlignment(Qt.AlignCenter)
        total_label.setStyleSheet("font-size: 10px; font-weight: bold; color: black; margin: 2px;")
        layout.addWidget(total_label)

        # Set the content widget as the scroll area's widget
        scroll.setWidget(content_widget)
        main_layout.addWidget(scroll)

        # Print button
        print_button = QPushButton("چاپ فیش")
        print_button.setStyleSheet("""
            QPushButton {
                background-color: white;
                color: black;
                border: 1px solid black;
                padding: 5px;
                font-size: 10px;
                margin: 2px;
            }
            QPushButton:hover {
                background-color: #f0f0f0;
            }
        """)
        print_button.clicked.connect(lambda: self.print_receipt(dialog))
        main_layout.addWidget(print_button)

        dialog.exec_()

    def create_separator(self):
        separator = QLabel("- - - - - - - - - - - - - - - - - -")
        separator.setAlignment(Qt.AlignCenter)
        separator.setStyleSheet("color: black; font-size: 8px; margin: 1px;")
        return separator

    def print_receipt(self, dialog):
        """Print the receipt"""
        try:
            # Create a printer object
            printer = QPrinter(QPrinter.HighResolution)
            
            # Set custom paper size for POS printer (55mm width)
            width_mm = 55
            height_mm = 200  # Adjustable height
            
            # Set paper size
            printer.setFullPage(True)
            printer.setOrientation(QPrinter.Portrait)
            printer.setPaperSize(QSizeF(width_mm, height_mm), QPrinter.Millimeter)
            printer.setColorMode(QPrinter.GrayScale)
            printer.setResolution(203)  # Standard thermal printer resolution
            
            # Set printer name if available (for POS printers)
            available_printers = QPrinter.availablePrinters()
            if available_printers:
                # Try to find a POS printer
                pos_printer = next((p for p in available_printers if any(pos_term in p.printerName().upper() 
                    for pos_term in ["POS", "THERMAL", "RECEIPT", "TM-", "TSP", "CUSTOM", "80MM", "58MM", "EPSON"])), None)
                if pos_printer:
                    printer.setPrinterName(pos_printer.printerName())
            
            # Show printer dialog
            print_dialog = QPrintDialog(printer, self)
            print_dialog.setWindowTitle("انتخاب پرینتر")
            print_dialog.setOption(QPrintDialog.PrintToFile, False)
            print_dialog.setOption(QPrintDialog.PrintPageRange, False)
            print_dialog.setOption(QPrintDialog.PrintShowPageSize, False)
            
            if print_dialog.exec() == QPrintDialog.Accepted:
                # Create a painter
                painter = QPainter()
                if not painter.begin(printer):
                    raise Exception("خطا در اتصال به پرینتر")
                
                try:
                    # Get the dialog's content as a pixmap
                    pixmap = dialog.grab()
                    
                    # Calculate scaling to fit the width while maintaining aspect ratio
                    page_rect = printer.pageRect()
                    pixmap_rect = pixmap.rect()
                    
                    # Scale to fit width
                    scale = page_rect.width() / pixmap_rect.width()
                    
                    # Center horizontally, align to top vertically
                    x = (page_rect.width() - pixmap_rect.width() * scale) / 2
                    y = 0  # Align to top
                    
                    painter.translate(x, y)
                    painter.scale(scale, scale)
                    
                    # Draw the pixmap
                    painter.drawPixmap(0, 0, pixmap)
                    
                finally:
                    painter.end()
                
                QMessageBox.information(self, "موفقیت", "فیش با موفقیت چاپ شد.")
        except Exception as e:
            QMessageBox.critical(self, "خطا", f"خطا در چاپ فیش:\n{str(e)}")


class OrderReportDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("گزارش سفارشات")
        self.setStyleSheet(f"background-color: {COLOR_BACKGROUND}; color: {COLOR_TEXT}; font-family: 'Yekan';")
        self.setGeometry(100, 100, 1000, 600)
        self.setLayoutDirection(Qt.RightToLeft)

        layout = QVBoxLayout(self)

        # فیلتر تاریخ
        self.date_filter = QDateEdit()
        self.date_filter.setCalendarPopup(True)
        self.date_filter.setDate(QDate.currentDate())
        self.date_filter.dateChanged.connect(self.load_orders)
        
        filter_layout = QHBoxLayout()
        filter_layout.addWidget(QLabel("فیلتر بر اساس تاریخ:"))
        filter_layout.addWidget(self.date_filter)
        layout.addLayout(filter_layout)

        # جدول سفارشات
        self.orders_table = QTableWidget()
        self.orders_table.setColumnCount(5)
        self.orders_table.setHorizontalHeaderLabels(["شماره سفارش", "تاریخ", "تعداد آیتم‌ها", "مبلغ کل", "جزئیات"])
        self.orders_table.doubleClicked.connect(self.show_order_details)
        layout.addWidget(self.orders_table)

        self.load_orders()

    def load_orders(self):
        selected_date = self.date_filter.date().toPython()
        jalali_date = jdatetime.date.fromgregorian(date=selected_date).strftime("%Y/%m/%d")
        
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT o.id, o.jalali_date, 
                   COUNT(oi.id), o.total_amount 
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.jalali_date = ?
            GROUP BY o.id
        """, (jalali_date,))
        
        orders = cursor.fetchall()
        
        self.orders_table.setRowCount(len(orders))
        for row, (order_id, date, item_count, total) in enumerate(orders):
            self.orders_table.setItem(row, 0, QTableWidgetItem(str(order_id)))
            self.orders_table.setItem(row, 1, QTableWidgetItem(date))
            self.orders_table.setItem(row, 2, QTableWidgetItem(str(item_count)))
            self.orders_table.setItem(row, 3, QTableWidgetItem(f"{total:,}"))
            
            btn_details = QPushButton("مشاهده جزئیات")
            btn_details.clicked.connect(lambda _, oid=order_id: self.show_order_details(oid))
            self.orders_table.setCellWidget(row, 4, btn_details)
            
        conn.close()

    def show_order_details(self, order_id):
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT r.name, oi.quantity, oi.unit_price, oi.total_price 
            FROM order_items oi
            JOIN recipes r ON oi.recipe_id = r.id
            WHERE oi.order_id = ?
        """, (order_id,))
        
        items = cursor.fetchall()
        
        dialog = QDialog(self)
        dialog.setWindowTitle(f"جزئیات سفارش #{order_id}")
        layout = QVBoxLayout(dialog)
        
        table = QTableWidget()
        table.setColumnCount(4)
        table.setHorizontalHeaderLabels(["آیتم", "تعداد", "قیمت واحد", "جمع کل"])
        table.setRowCount(len(items))
        
        for row, (name, qty, price, total) in enumerate(items):
            table.setItem(row, 0, QTableWidgetItem(name))
            table.setItem(row, 1, QTableWidgetItem(str(qty)))
            table.setItem(row, 2, QTableWidgetItem(f"{price:,}"))
            table.setItem(row, 3, QTableWidgetItem(f"{total:,}"))
            
        layout.addWidget(table)
        dialog.exec()
        conn.close()


if __name__ == "__main__":
    # Initialize SQLite database
    def init_db():
        conn = sqlite3.connect("coffee_shop.db")
        cursor = conn.cursor()
        
        try:
            # Delete existing categories
            cursor.execute("DELETE FROM categories WHERE name IN ('نوشیدنی‌های گرم', 'نوشیدنی‌های سرد', 'دسر')")
            
            # جداول موجود
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS db_version (
                version INTEGER PRIMARY KEY
            )
            """)
            
            # Drop and recreate orders table
            cursor.execute("DROP TABLE IF EXISTS order_items")
            cursor.execute("DROP TABLE IF EXISTS orders")
            
            # جدول سفارشات
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY,
                receipt_number TEXT UNIQUE NOT NULL,
                customer_name TEXT,
                table_number INTEGER,
                order_date TEXT NOT NULL,
                jalali_date TEXT NOT NULL,
                jalali_time TEXT NOT NULL,
                total_amount INTEGER NOT NULL,
                payment_status TEXT DEFAULT 'pending',
                order_status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            
            # جدول آیتم‌های سفارش
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY,
                order_id INTEGER NOT NULL,
                recipe_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price INTEGER NOT NULL,
                total_price INTEGER NOT NULL,
                FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY(recipe_id) REFERENCES recipes(id)
            )
            """)
            
            # جدول تنظیمات
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
            """)
            conn.commit()
                
        except Exception as e:
            conn.rollback()
            QMessageBox.critical(None, "خطا در پایگاه داده", f"خطایی در هنگام آماده‌سازی پایگاه داده رخ داد:\n{str(e)}")
        finally:
            conn.close()

    init_db()

    app = QApplication([])
    window = ModernMainWindow()
    window.setStyleSheet("QApplication { font-family: 'Yekan'; }")
    window.show()
    app.exec()