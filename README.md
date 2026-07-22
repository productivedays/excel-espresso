# Excel Espresso — เว็บไซต์เทมเพลต Excel ฟรี

☕ **Excel ง่ายๆสำหรับทุกคน**

เว็บไซต์ static สำหรับแบรนด์ Excel Espresso — รวมเทมเพลต Excel ฟรีและบทความสอนใช้ Excel ภาษาไทย

## วิธีรันในเครื่อง

### วิธีที่ 1: เปิดไฟล์ตรง
เปิดไฟล์ `index.html` ในเบราว์เซอร์ได้เลย

> **หมายเหตุ:** หน้า Templates และ Blog ที่ดึงข้อมูลจาก JSON อาจไม่ทำงานเพราะ CORS policy ของเบราว์เซอร์ ใช้วิธีที่ 2 แทน

### วิธีที่ 2: VS Code Live Server (แนะนำ)
1. ติดตั้ง [VS Code](https://code.visualstudio.com/)
2. ติดตั้ง Extension: **Live Server** โดย Ritwick Dey
3. เปิดโฟลเดอร์โปรเจกต์ใน VS Code
4. คลิกขวาที่ `index.html` → **Open with Live Server**
5. เบราว์เซอร์จะเปิดที่ `http://127.0.0.1:5500`

### วิธีที่ 3: Python HTTP Server
```bash
cd excel-espresso
python3 -m http.server 8000
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:8000`

### วิธีที่ 4: Node.js
```bash
npx serve .
```

## โครงสร้างโปรเจกต์

```
excel-espresso/
├── index.html                              # หน้าแรก
├── start-here.html                         # เริ่มตรงนี้
├── templates.html                          # คลังเทมเพลต (filter + search)
├── templates-inventory.html                # หมวดสต็อก
├── templates-budget.html                   # หมวดงบประมาณ
├── templates-weekly-report.html            # หมวดรายงานประจำสัปดาห์
├── template-detail.html                    # แม่แบบหน้ารายละเอียด
├── template-inventory-reorder-v1.html      # เทมเพลตจุดสั่งซื้อ
├── template-budget-monthly-v1.html         # เทมเพลตงบรายเดือน
├── template-weekly-report-generator-v1.html # เทมเพลตรายงานสัปดาห์
├── blog.html                               # รายการบทความ
├── blog-post.html                          # แม่แบบบทความ
├── blog-inventory-reorder-basics.html      # บทความ Reorder Point
├── blog-budget-simple-system.html          # บทความงบประมาณง่ายๆ
├── blog-weekly-report-fast.html            # บทความรายงาน 10 นาที
├── about.html                              # เกี่ยวกับ
├── contact.html                            # ติดต่อเรา
├── privacy.html                            # นโยบายความเป็นส่วนตัว
├── terms.html                              # ข้อกำหนดการใช้งาน
├── template-license.html                   # สัญญาอนุญาตเทมเพลต
├── sitemap.xml                             # Sitemap สำหรับ SEO
├── robots.txt                              # Robots.txt
├── styles/
│   └── main.css                            # CSS หลัก (shared)
├── scripts/
│   └── main.js                             # JS หลัก (shared)
├── data/
│   ├── templates.json                      # ข้อมูลเทมเพลต
│   └── posts.json                          # ข้อมูลบทความ
├── assets/
│   └── logo.png                            # โลโก้ (placeholder)
└── downloads/
    ├── inventory-reorder-v1.xlsx           # ไฟล์เทมเพลต (placeholder)
    ├── inventory-tracker-v1.xlsx
    ├── budget-monthly-v1.xlsx
    ├── budget-yearly-v1.xlsx
    ├── weekly-report-generator-v1.xlsx
    └── weekly-kpi-dashboard-v1.xlsx
```

## เทคโนโลยีที่ใช้

- **HTML5** — Semantic markup, ARIA labels, Open Graph tags
- **CSS3** — CSS variables, Flexbox, Grid, responsive mobile-first
- **Vanilla JavaScript** — Client-side rendering, filter, search
- **Google Fonts** — Kanit (ฟอนต์ไทย)
- **ไม่มี framework** — ไม่ต้อง build, ไม่ต้อง install

## สิ่งที่ต้องทำต่อ (TODO)

- [ ] เพิ่มรูปภาพจริง (screenshot เทมเพลต, รูปประกอบบทความ)
- [ ] สร้างไฟล์ Excel จริงใส่ใน `/downloads/`
- [ ] เพิ่มโลโก้จริงใน `/assets/logo.png`
- [ ] ต่อ Google Analytics (เพิ่ม script ใน header)
- [ ] ตั้งค่า domain จริงและอัปเดต canonical URLs
- [ ] เพิ่มบทความและเทมเพลตใหม่
- [ ] พิจารณาเชื่อม email service (Mailchimp, ConvertKit)

## สัญญาอนุญาต

เนื้อหาและเทมเพลต © 2025 Excel Espresso — ดูรายละเอียดที่ [template-license.html](template-license.html)
