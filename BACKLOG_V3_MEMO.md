# 📌 PokeCountTracker Version 3.0 Architecture Memo & Backlog

**เอกสารบันทึกวิสัยทัศน์ สถาปัตยกรรม และ Roadmap สำหรับ Version 3.0**
*วันที่บันทึก: 4 กันยายน 2026*

---

## 🎯 1. แก่นและเป้าหมายของ Version 3 (v3.0 Philosophy)
ยกระดับ PokeCountTracker จาก **เครื่องมือจดแต้มและคลังสะสม (Utility & Collection Tracker)** ก้าวสู่ **Complete Pokémon TCG Competitive & Collector Platform** ที่เชื่อมโยงระหว่างผู้เล่นไทยกับมาตรฐานการแข่งขันระดับโลก

---

## 🚀 2. ฟีเจอร์เฟสแรก (Phase 1: In Progress / Completed)

### 2.1 แยกฐานข้อมูลการ์ดภาษาอังกฤษ (Comprehensive English Database)
- **สถานะ**: ✅ **Completed**
- **ไฟล์ข้อมูล**: `src/data/pokemonCardsEn.json` (6,779 การ์ด จาก 38 ชุด) และ `src/data/pokemonSetsEn.json`
- **ขอบเขต**: ครอบคลุมซีรีส์ **Sword & Shield** และ **Scarlet & Violet** ทั้งหมดจนถึงปัจจุบัน (SV1 ถึง SV8, SV8.5, SV9, SV10, Sve, Promos)
- **การแยกส่วน (Separation)**: แยกขาดจากข้อมูลการ์ดไทย (`src/data/pokemonNames.json`) โดยสิ้นเชิง เพื่อป้องกันปัญหาความซ้ำซ้อนของ ID และทำให้ Bundle ทำงานแบบ On-Demand ได้

### 2.2 Background Multi-Signal Card Matching Engine
- **สถานะ**: ✅ **Completed**
- **สคริปต์ประมวลผล**: `scripts/match-thai-english-cards.mjs`
- **ไฟล์ผลลัพธ์**: `src/data/thaiEnglishCardMap.json` (จับคู่แล้ว 5,406 ใบ, ความแม่นยำสูง > 85% จำนวน 4,876 ใบ)
- **สถาปัตยกรรม Matching**:
  - **Signal 1 (Artwork / Perceptual Visuals)**: เปรียบเทียบความสัมพันธ์ของภาพการ์ด อาร์ตเวิร์ก และอัตราส่วน
  - **Signal 2 (Name Dictionary)**: แปลชื่อโปเกมอนและเทรนเนอร์ไทย ⇄ อังกฤษ (`pokemonNameTranslations.json`)
  - **Signal 3 (Technical Specs)**: เทียบ HP, Energy Type, Stage/Category, Regulation Mark (D–I)
  - **Signal 4 (Rarity Parity)**: จัดกลุ่ม SAR/AR/UR/Regular ตรงตามเวอร์ชันญี่ปุ่นและสากล

### 2.3 Interactive Thai-English Mapping Studio UI
- **สถานะ**: ✅ **Completed**
- **คอมโพเนนต์**: `src/components/collection/CardMappingStudioModal.tsx`
- **ฟังก์ชันการทำงาน**:
  - แสดงการ์ดไทย ⇄ อังกฤษเคียงข้างกัน (Side-by-Side) พร้อม Badge % ความมั่นใจ
  - ระบบค้นหาและเปลี่ยนคู่การ์ดด้วยมือ (Manual Override / Re-Match) ด้วยระบบ Live Search
  - บันทึกการแก้ไขลงใน `localStorage` (`pokecount_custom_thai_en_mappings`) แบบถาวร
  - ฟิลเตอร์: ทั้งหมด, รอตรวจสอบ (<85%), ยังไม่พบคู่, ยืนยันแล้ว, และแก้ไขเอง

### 2.4 De-scope Real-Time Camera Vision
- **สถานะ**: ✅ **Done**
- พักการทำงานของ Real-time Camera Scanner ไว้ชั่วคราวเนื่องจากความแม่นยำของ OCR ยังไม่ถึงเกณฑ์ UX ที่น่าพอใจ

---

## 📋 3. Backlog Roadmap สำหรับเฟสถัดไป (Future Phases)

### 🏆 Phase 2: Live Meta Decks & Tournament Analytics (เมต้าสากลเทียบการ์ดไทย)
* **โจทย์**: ฐานข้อมูลการแข่งขันระดับโลก (LimitlessTCG, Justinbasil, Champions League) ใช้ชื่อการ์ดภาษาอังกฤษ
* **แนวทางพัฒนา**:
  1. **Scraper / Sync Engine**: ดึงข้อมูล Meta Decks ยอดนิยมรายสัปดาห์ (Top 10-20 Archetypes เช่น Charizard ex, Regidrago VSTAR, Lugia VSTAR, Dragapult ex, Miraidon ex, Gardevoir ex)
  2. **Cross-Language Translation**: นำรายการการ์ดอังกฤษในเด็คเมต้า มาแปลงเป็นการ์ดไทยอัตโนมัติผ่าน `thaiEnglishCardMap`
  3. **One-Tap Deck Import & Missing Calculator**:
     - ผู้ใช้กดปุ่มเดียว ดึงเด็คเมต้าระดับโลกเข้ามาใน Deck Builder ของตนเองเป็นภาษาไทย
     - คำนวณทันทีว่าในคลังสะสมของผู้ใช้ ขาดการ์ดใบไหนบ้าง ต้องหาเพิ่มกี่ใบ
  4. **Tier List & Win Rate Matrix**: แสดงกราฟสัดส่วน Share % และ Win Rate ของแต่ละ Archetype

---

### 🎮 Phase 3: Solitaire / Playtest Simulator (ระบบจำลองการซ้อมมือคนเดียว)
* **โจทย์**: ผู้เล่นอยากลองจั่วการ์ดและซ้อมมือโดยไม่ต้องพกการ์ดจริง
* **แนวทางพัฒนา**:
  1. **Opening Hand & Prize Simulator**:
     - สุ่มจั่วการ์ด 7 ใบแรก
     - แจกการ์ดรางวัล (Prizes) 6 ใบ คว่ำหน้า
     - ตรวจสอบ Mulligan อัตโนมัติ (หากไม่มี Basic Pokémon ให้ปุ่มสับจั่วใหม่)
  2. **Turn 1-3 Goldfish Mode**:
     - กองการ์ดในเด็ค (Deck Pile): จั่วการ์ด (+1), ค้นหาการ์ดในเด็ค (Search Deck เช่น ใช้ Nest Ball, Poffin, Ultra Ball)
     - ย้ายการ์ดลงตำแหน่ง Active / Bench / Discard Pile / Lost Zone
  3. **Starting Hand Consistency Math Engine**:
     - คำนวณความน่าจะเป็นทางคณิตศาสตร์ (Hypergeometric Distribution)
     - % โอกาสจั่วติด Basic เทิร์นแรก
     - % ได้ Supporter หรือ Ball Search ในเทิร์นแรก

---

### 💎 Phase 4: Portfolio Value & Have/Want Smart Trade Matcher
* **โจทย์**: ผู้สะสมต้องการทราบมูลค่าคลัง และอยากแลกการ์ดกับเพื่อนในงานแข่ง/การ์ดช็อป
* **แนวทางพัฒนา**:
  1. **Price Index Sync**: ดึงราคาตลาดอ้างอิง (การ์ดไทย / ญี่ปุ่น / TCGPlayer)
  2. **Binder Valuation**: แสดงมูลค่ารวมของสมุดสะสมแต่ละเล่ม และการ์ดมูลค่าสูงสุด (Top Cards)
  3. **Trade Matcher via QR / Link**:
     - กำหนดแท็กการ์ด `For Trade` (มีซ้ำ) และ `Wishlist` (ตามหา)
     - แลกเปลี่ยน QR Code กับเพื่อน แล้วระบบวิเคราะห์ทันทีว่า *"เพื่อนมีการ์ดที่คุณขาด 3 ใบ และคุณมีการ์ดที่เขาต้องการ 2 ใบ"*

---

### ✨ Phase 5: 3D Holographic Card Showcase Showroom
* **โจทย์**: สร้างความประทับใจระดับพรีเมียมให้ผู้ใช้แชร์คอลเลกชันตนเองลงโซเชียล
* **แนวทางพัฒนา**:
  1. **WebGL / CSS 3D Parallax**: การ์ดเอียง 3 มิติตามทิศทางการขยับเมาส์หรือ Gyroscope บนสมาร์ตโฟน
  2. **Foil Reflection Shaders**: แสงสะท้อนวิบวับแบบ Holo / Reverse Holo / SAR Texture
  3. **Public Share Link**: ลิงก์สาธารณะเปิดดู Showcase สมุดสะสมแบบ 3D ได้ทันทีโดยไม่ต้องล็อกอิน

---

*บันทึกโดย Antigravity AI เพื่อเป็นแนวทางการส่งมอบงานในเวอร์ชัน 3.0*
