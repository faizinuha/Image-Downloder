# Instagram Media Downloader

Browser extension untuk mengunduh gambar dan video dari Instagram.

## Fitur

- Download gambar dari post Instagram
- Download video dari post Instagram
- Mendukung format WebP (otomatis terunduh sebagai WebP)
- Tombol download muncul di setiap post
- Mendukung multiple media dalam satu post

## Instalasi

1. Buka Chrome/Edge browser
2. Pergi ke menu Extensions
3. Aktifkan "Developer mode"
4. Klik "Load unpacked"
5. Pilih folder extension ini

## Penggunaan

1. Buka Instagram di browser
2. Scroll timeline atau buka post Instagram
3. Tombol download akan muncul di pojok kanan atas setiap post
4. Klik tombol untuk mengunduh media

## File Structure

```
Image-Downloader/
├── manifest.json        # Extension configuration
├── background.js       # Background service worker
├── context.js         # Content script for Instagram
├── button-download.png # Download button icon
└── icon.jpg           # Extension icon
```

## Requirements

- Chrome/Edge browser dengan support Manifest V3
- Developer mode diaktifkan di browser

## Permissions

- downloads: untuk mengunduh media
- host permissions: akses ke domain Instagram dan CDN

## Notes

- Extension ini hanya berfungsi di website Instagram
- Beberapa media mungkin tidak bisa diunduh karena pembatasan Instagram
- Format WebP akan tetap diunduh sebagai WebP
