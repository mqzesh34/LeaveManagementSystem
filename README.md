# Leave Management System

Leave Management System; çalışan izin taleplerini, takım yönetimini, onay akışlarını ve bildirimleri yöneten bir web uygulamasıdır. Proje React tabanlı bir istemci ve üç ayrı Node.js servisten oluşur.

## Teknolojiler

- İstemci: React, Vite, TypeScript, Tailwind CSS
- Kimlik servisi: Node.js, Express, MongoDB, JWT
- Yönetim servisi: Node.js, Express, PostgreSQL, Sequelize
- Bildirim servisi: Node.js, Express, MongoDB, Socket.IO
- Çalıştırma ortamı: Docker

## Proje Yapısı

```text
client/                     React istemcisi
backend/authService/        Kimlik doğrulama ve kullanıcı yönetimi
backend/managementService/  Takım ve izin yönetimi
backend/socketService/      Bildirim API'si ve Socket.IO bağlantısı
docker-compose.yml          Docker tanımlaması
.env.example                Ortam değişkenleri şablonu
docs/screenshots/           README ekran görüntüleri
```

## Kurulum

Önce ortam değişkenleri dosyasını oluşturun:

```bash
cp .env.example .env
```

`.env` içindeki `JWT_SECRET`, `SOCKET_SERVICE_TOKEN` ve veritabanı parolası gibi değerleri kendi ortamınıza göre değiştirin.

Ardından uygulamayı Docker Compose ile başlatın:

```bash
docker compose up --build
```

Servisler varsayılan olarak şu adreslerde çalışır:

- İstemci: `http://localhost:5173`
- Auth Service: `http://localhost:1001`
- Management Service: `http://localhost:1002`
- Socket Service: `http://localhost:1003`

## İlk Kurulum

MongoDB içindeki kullanıcı koleksiyonu boşken uygulama ilk kurulum modunda açılır. Login ekranında geçici bir admin kayıt formu görünür.

Bu form üzerinden ilk admin hesabı oluşturulduğu anda:

- Kullanıcı `admin` rolüyle kaydedilir.
- Oturum otomatik başlatılır.
- `/api/auth/register` endpoint'i artık erişime kapanır.
- Login ekranı normal giriş formuna döner.

İlk admin oluşturulduktan sonra yeni kullanıcılar yalnızca admin panelinden, yetkili admin hesabı ile oluşturulabilir.

## Kullanım

1. `http://localhost:5173` adresini açın.
2. İlk çalıştırmada admin hesabınızı oluşturun.
3. Admin hesabı ile giriş yaptıktan sonra kullanıcı, takım ve izin yönetimi ekranlarını kullanın.
4. Çalışanlar izin talebi oluşturabilir; takım liderleri ve adminler yetkilerine göre talepleri yönetebilir.

## Ekran Görüntüleri

Ekran görüntüleri rol bazlı klasörlerde tutulur. Ortak ekranlar [`docs/screenshots/global`](docs/screenshots/global), admin görünümü [`docs/screenshots/admin`](docs/screenshots/admin), takım lideri görünümü [`docs/screenshots/team_lead`](docs/screenshots/team_lead), çalışan görünümü ise [`docs/screenshots/emplooye`](docs/screenshots/emplooye) klasöründedir.

### Ortak Ekranlar

#### Giriş

![Giriş ekranı](docs/screenshots/global/login.png)

Kullanıcılar e-posta ve şifreleriyle giriş yapar; beni hatırla seçeneğiyle oturum tercihi korunabilir.

#### İlk Kurulum

![İlk kurulum ekranı](docs/screenshots/global/first-run-setup.png)

Veritabanında kullanıcı yokken ilk admin hesabı bu geçici kurulum formu üzerinden oluşturulur.

### Admin Görünümü

#### Anasayfa

![Admin anasayfa görünümü](docs/screenshots/admin/dashboard.png)

Admin; izin taleplerinin onay, red ve bekleyen durumlarını, en çok izin kullanan liderleri, onay bekleyen lider izinlerini, bugün izinde olan liderleri, yaklaşan resmi tatilleri ve yaklaşan izinleri tek ekrandan takip eder.

#### Takvim

![Admin takvim görünümü](docs/screenshots/admin/calendar.png)

Takvim ekranında liderlerin izin kullandığı tarihler ve resmi tatiller görünür. Çalışan izinleri bu admin takvim özetine dahil edilmez.

#### İzin İstekleri

![Admin izin istekleri görünümü](docs/screenshots/admin/leader-leave-requests.png)

Liderlerin oluşturduğu izin talepleri onaylanan, reddedilen ve bekleyen durumlarına göre ayrı kolonlarda listelenir.

![Admin izin talebi detay ekranı](docs/screenshots/admin/leader-leave-detail.png)

Bekleyen lider talebinde izin türü, tarih aralığı, süre, açıklama ve kullanıcının izin özeti görüntülenir; admin talebi bu ekrandan onaylayabilir veya reddedebilir.

#### İstek Geçmişi

![Admin istek geçmişi görünümü](docs/screenshots/admin/request-history.png)

Geçmiş kayıtlar yıl, ay, takım, kullanıcı ve durum filtreleriyle incelenebilir. Liste hem bekleyen hem de sonuçlanmış talepleri kapsar.

![Admin istek geçmişi detay ekranı](docs/screenshots/admin/request-history-detail.png)

Geçmiş talep detayı; kullanıcı bilgilerini, izin türünü, tarih aralığını, süreyi ve talep açıklamasını sade bir özet halinde gösterir.

#### Yönetim

![Admin yönetim paneli görünümü](docs/screenshots/admin/management.png)

Admin bu ekranda kullanıcı oluşturabilir, takım tanımlayabilir, lider atayabilir ve mevcut kullanıcı/takım kayıtlarını takip edebilir.

![Admin kullanıcı detayı görünümü](docs/screenshots/admin/user-detail.png)

Kullanıcı detayında takım bilgisi, rol, izin kullanım durumu, talep geçmişi ve hesap silme aksiyonu yer alır.

![Admin takım detayı görünümü](docs/screenshots/admin/team-detail.png)

Takım detayında lider, çalışan sayısı, ekip üyeleri ve takım yönetimi aksiyonları birlikte gösterilir.

### Takım Lideri Görünümü

#### Anasayfa

![Takım lideri takım görünümü](docs/screenshots/team_lead/team-dashboard.png)

Takım lideri, takımındaki çalışanların izin istatistiklerini, en çok izin kullanan çalışanları, onay bekleyen talepleri, bugün izinde olan çalışanları, yaklaşan resmi tatilleri ve yaklaşan çalışan izinlerini takip eder.

![Takım lideri kişisel görünümü](docs/screenshots/team_lead/personal-dashboard.png)

Kişisel sekmede takım lideri kendi izin hakkını, yaklaşan onaylı izinlerini ve geçmiş izin kayıtlarını görüntüler.

#### Takvim

![Takım lideri takvim görünümü](docs/screenshots/team_lead/calendar.png)

Takvim ekranında takım liderinin kendi izinleri, takımındaki çalışan izinleri ve resmi tatiller birlikte görünür.

#### İzin İstekleri

![Takım lideri izin istekleri görünümü](docs/screenshots/team_lead/leave-requests.png)

Takımdaki çalışanların izin talepleri onaylanan, reddedilen ve bekleyen durumlarına göre ayrılır.

#### İstek Geçmişi

![Takım lideri istek geçmişi görünümü](docs/screenshots/team_lead/request-history.png)

Geçmiş talepler yıl, ay, takım, çalışan ve durum filtreleriyle incelenebilir.

#### İzin Talebi

![Takım lideri izin talebi oluşturma ekranı](docs/screenshots/team_lead/create-leave-request.png)

Takım lideri kendi adına izin türü, açıklama ve tarih aralığı seçerek izin talebi oluşturur; sağ panelde izin özeti ve ekip durumu görünür.

#### Bildirimler

![Takım lideri bildirim görünümü](docs/screenshots/team_lead/notifications.png)

Bildirim panelinde yeni çalışan talepleri ve takım liderinin kendi izin sonucuna ait bildirimler listelenir.

### Çalışan Görünümü

#### Anasayfa

![Çalışan anasayfa görünümü](docs/screenshots/emplooye/personal-dashboard.png)

Çalışan kendi izin hakkını, yaklaşan onaylı izinlerini, resmi tatilleri, ekipte yaklaşan izinleri ve geçmiş izin kayıtlarını görüntüler.

#### Takvim

![Çalışan takvim görünümü](docs/screenshots/emplooye/calendar.png)

Takvim ekranında çalışanın kendi izinleri, ekip izinleri ve resmi tatiller birlikte takip edilir.

#### İzin Talebi

![Çalışan izin talebi oluşturma ekranı](docs/screenshots/emplooye/create-leave-request.png)

Çalışan izin türü, açıklama ve tarih aralığı seçerek yeni izin talebi oluşturur; sağ panelde izin özeti ve seçilen tarihlere göre ekip durumu yer alır.

#### Bildirimler

![Çalışan bildirim görünümü](docs/screenshots/emplooye/notifications.png)

Bildirim panelinde çalışanın izin taleplerine ait onay ve red sonuçları gösterilir.

## Geliştirme Komutları

Docker kullanmadan servisleri ayrı ayrı çalıştırmak isterseniz ilgili dizinlerde bağımlılıkları kurup geliştirme komutlarını çalıştırabilirsiniz:

```bash
cd client && npm install && npm run dev
cd backend/authService && npm install && npm run dev
cd backend/managementService && npm install && npm run dev
cd backend/socketService && npm install && npm run dev
```

Bu yöntemle çalıştırırken `.env` içindeki servis adreslerini yerel adreslere göre güncellemeniz gerekir.

## Lisans

Bu proje özel bir kaynak inceleme lisansı ile sunulur. Kaynak kodları inceleme ve değerlendirme amacıyla görüntülenebilir; değiştirilmiş sürümlerin ticari amaçla kullanımı, dağıtımı veya satışı yasaktır. Ayrıntılar için `LICENSE` dosyasına bakabilirsiniz.
