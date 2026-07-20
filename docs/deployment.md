# Huong dan ban giao deploy VPS

Tai lieu nay danh cho nguoi nhan source tu nhanh `main` va trien khai he thong len mot VPS Ubuntu moi. He thong gom PostgreSQL, Spring Boot API va React frontend, chay trong cung mot Docker Compose stack.

## 1. Ket qua sau khi deploy

- Nguoi dung truy cap giao dien qua `http://SERVER_IP` trong buoc kiem thu ban dau.
- Frontend chuyen `/api` va `/ws-queue` vao backend noi bo; API khong mo cong ra Internet.
- PostgreSQL va avatar duoc luu trong Docker volumes, khong nam trong source code.
- Lan khoi dong dau tien tu database rong se tu chay Flyway migration va tao du lieu nen: vai tro/quyen, 7 chuyen khoa, 6 dich vu kham, 5 danh muc xet nghiem, 10 thuoc, cau hinh thanh toan va mot tai khoan administrator.

Khong co bac si, benh nhan, lich hen, ho so benh an hay giao dich demo trong du lieu seed.

## 2. Yeu cau truoc khi bat dau

- VPS Ubuntu 22.04 LTS hoac 24.04 LTS, toi thieu 2 vCPU, 4 GB RAM va 30 GB SSD.
- Mot dia chi IP public. Domain la can thiet truoc khi dua he thong cho nguoi dung that su dung va bat HTTPS.
- Quyen SSH `sudo` tren VPS.
- Tai khoan GitHub co quyen clone repository `BTHL-123/clinic-management-system` neu repository la private.
- SePay API token moi, so tai khoan nhan tien va ma ngan hang. Token cu tung co trong source phai duoc vo hieu hoa sau khi token moi da kiem thu thanh cong.

Chi mo firewall cong `22`, `80` va `443` (khi da cau hinh HTTPS). Khong mo cong `5432` hoac `8080` ra Internet.

## 3. Chuan bi VPS

Dang nhap VPS bang SSH, cap nhat he dieu hanh va cai Docker Engine theo huong dan chinh thuc cua Docker. Kiem tra sau khi cai:

```bash
docker --version
docker compose version
```

Tao thu muc ung dung va clone dung nhanh release:

```bash
sudo mkdir -p /opt/clinic-management-system
sudo chown "$USER":"$USER" /opt/clinic-management-system
git clone --branch main --single-branch https://github.com/BTHL-123/clinic-management-system.git /opt/clinic-management-system
cd /opt/clinic-management-system
```

Neu repository private, dung SSH deploy key hoac GitHub fine-grained token chi co quyen doc repository; khong ghi token vao lenh shell history hay vao Git.

## 4. Tao file secrets va cau hinh

Sao chep mau, sau do sua file chi tren VPS:

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Bat buoc thay toan bo gia tri mau sau:

```dotenv
POSTGRES_PASSWORD=<mat-khau-database-manh>
JWT_SECRET=<chuoi-ngau-nhien-it-nhat-32-ky-tu>
APP_ADMIN_EMAIL=<email-admin-thuc>
APP_ADMIN_PASSWORD=<mat-khau-admin-manh>
APP_ADMIN_FULL_NAME=<ten-hien-thi-admin>
SEPAY_API_KEY=<token-API-DEPLOY-moi>
SEPAY_BANK_ACCOUNT=<so-tai-khoan-nhan-tien>
SEPAY_BANK_CODE=<ma-ngan-hang-vi-du-MBBank>
```

Tao `JWT_SECRET` bang lenh sau va dan ket qua vao `.env`:

```bash
openssl rand -base64 48
```

Trong buoc chay bang IP, giu `CORS_ALLOWED_ORIGINS=http://SERVER_IP`. Khi gan domain, doi thanh `https://TEN-MIEN-CUA-BAN`. `VITE_GOOGLE_CLIENT_ID` chi can khi su dung dang nhap Google. Cau hinh SMTP chi can khi can gui email.

Mac dinh `FRONTEND_BIND_ADDRESS=0.0.0.0` va `FRONTEND_PORT=80` de kiem thu qua IP. Hai bien nay se doi o buoc HTTPS.

Khong commit, gui qua chat, chup man hinh hay copy `.env` ra kho luu tru cong khai. `.env` da duoc Git ignore.

## 5. Khoi dong lan dau

Tai thu muc repository tren VPS:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Cho den khi log backend co thong bao khoi dong hoan tat. `docker compose ps` phai hien `db`, `backend` va `frontend` dang `running`. Mo `http://SERVER_IP` tren trinh duyet, dang nhap bang `APP_ADMIN_EMAIL` va `APP_ADMIN_PASSWORD` da dat trong `.env`.

Neu can xem log rieng:

```bash
docker compose logs --tail=200 backend
docker compose logs --tail=200 frontend
docker compose logs --tail=200 db
```

## 6. Kiem thu truoc khi ban giao

1. Dang nhap administrator va doi mat khau admin ban dau.
2. Kiem tra chuyen khoa, dich vu, gia kham, danh muc lab va thuoc da co du lieu nen.
3. Tao mot bac si that va lich lam viec, sau do dat mot lich hen bang tai khoan benh nhan.
4. Kiem tra check-in, kham benh, don thuoc, xet nghiem va bao cao doanh thu.
5. Tao mot giao dich SePay gia tri nho; xac nhan webhook/cap nhat thanh toan hoat dong voi token moi.
6. Chi sau khi buoc 5 thanh cong moi vo hieu hoa SePay token cu.
7. Kiem tra real-time hang doi tren hai trinh duyet khac nhau.

## 7. Domain va HTTPS voi Caddy

Khong dua he thong co tai khoan va thanh toan cho nguoi dung that qua HTTP/IP. Nguoi trien khai can gan ban ghi `A` cua domain vao IP VPS, sau do dung Caddy de cap va gia han HTTPS tu dong.

Tren VPS, cai Caddy theo huong dan chinh thuc cua Caddy. Truoc khi khoi dong Caddy, sua `.env` de frontend chi nghe noi bo va dat dung domain:

```dotenv
CORS_ALLOWED_ORIGINS=https://TEN-MIEN-CUA-BAN
FRONTEND_BIND_ADDRESS=127.0.0.1
FRONTEND_PORT=8081
```

Cap nhat container frontend:

```bash
docker compose up -d --build
```

Tao `/etc/caddy/Caddyfile` voi noi dung sau, thay `TEN-MIEN-CUA-BAN` bang domain that:

```caddyfile
TEN-MIEN-CUA-BAN {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8081
}
```

Kiem tra va nap lai Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy chuyen tiep ca API va WebSocket vi toan bo traffic di qua frontend Nginx. Khi HTTPS hoan tat, chi cho phep `22`, `80`, `443` tren firewall; backend da chi bind `127.0.0.1:8080` va khong can cong khai.

## 8. Van hanh va cap nhat phien ban

Truoc moi lan cap nhat, sao luu database. Cach don gian nhat:

```bash
mkdir -p backups
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "backups/clinic-$(date +%F-%H%M).sql.gz"
```

Cap nhat dung nhanh `main`:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
docker compose up -d --build
docker compose ps
```

Khong dung `docker compose down -v` trong van hanh binh thuong, vi lenh nay xoa volumes va toan bo database/upload. Lenh dung de dung dich vu la:

```bash
docker compose down
```

Database va avatar nam trong named volumes `postgres_data` va `backend_uploads`. Can sao luu dinh ky ca database va upload. Kiem tra dung luong dia:

```bash
docker system df
df -h
```

## 9. Xu ly su co nhanh

```bash
docker compose ps
docker compose logs --tail=300 backend
docker compose restart backend
docker compose up -d --build
```

- Backend khong len: kiem tra `POSTGRES_*`, `DB_*`, `JWT_SECRET` va log Flyway.
- Dang nhap khong duoc: kiem tra `APP_ADMIN_EMAIL`/`APP_ADMIN_PASSWORD`; bien nay chi tao admin o lan seed dau tien, khong tu dong doi lai mat khau da ton tai.
- SePay khong cap nhat: kiem tra `SEPAY_API_KEY`, thong tin ngan hang, URL HTTPS public va log backend.
- Frontend khong goi duoc API: kiem tra reverse proxy, `CORS_ALLOWED_ORIGINS`, va Network tab cua trinh duyet.

## 10. Luu y phat hanh

Chi deploy commit da co tren nhanh `main` sau khi PR deployment-cleanup duoc merge. Khong mang file `.env`, log, database dump hay uploads cua may phat trien len GitHub. Sau khi deploy on dinh, nen tao Git tag phien ban de co diem quay lai ro rang.
