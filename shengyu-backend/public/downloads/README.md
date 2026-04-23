# APK 下载目录

此目录用于存放声愈应用的 APK 安装包，供官网下载页面使用。

## 文件命名规范

- 主版本：`shengyu.apk`（始终指向最新版本）
- 版本备份：`shengyu-v{版本号}.apk`（例如：shengyu-v1.0.0.apk）

## 下载链接

官网下载地址：`https://shengyu.supersyh.xyz/downloads/shengyu.apk`

## 部署说明

1. 将打包好的 APK 文件放入此目录
2. 确保文件名与下载页面中的链接一致
3. Nginx 已配置自动添加下载响应头

## Nginx 配置

```nginx
location /downloads/ {
    alias /www/wwwroot/shengyu/shengyu-backend/public/downloads/;
    add_header Content-Disposition "attachment";
    add_header Content-Type "application/vnd.android.package-archive";
    expires 30d;
}
```
