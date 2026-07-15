# Technische Voraussetzungen

## Mindestanforderungen

### Server

- PHP 8.1 oder neuer
- Webserver mit PHP-Unterstützung
- ausreichend Speicherplatz für Bilder, Videos und Musik
- Schreibrechte für definierte Laufzeitordner

### PHP-Erweiterungen

Erforderlich:

- `json`
- `fileinfo`
- `mbstring`
- `session`

Üblicherweise sind diese Erweiterungen bei modernen Hostingpaketen bereits aktiv.

### Browser

Empfohlen:

- aktuelles Firefox
- aktuelles Chrome
- aktuelles Edge
- aktuelles Safari
- aktuelles Mobile Safari
- aktuelles Chrome für Android

---

## Nicht erforderlich

EverMoment benötigt nicht:

- MySQL oder MariaDB
- SQLite
- Composer
- Node.js
- npm
- FFmpeg
- ImageMagick
- externen Cloudspeicher
- externen Loginanbieter

---

## Schreibrechte

Benötigt:

```text
config/
storage/
public/img/
public/music/
```

### Aufgaben

`config/`

- Konfiguration
- Sicherheitseinstellungen
- Branding-Logo

`storage/`

- Sperrdateien
- Medienrevision
- Musikrevision

`public/img/`

- Bilder
- Videos

`public/music/`

- MP3-Dateien

---

## PHP-Limits

Für normale Bilder können geringe Limits ausreichen.

Für Videos und Massenuploads sollten folgende Werte geprüft werden:

```ini
upload_max_filesize = 512M
post_max_size = 512M
max_file_uploads = 100
max_execution_time = 300
memory_limit = 256M
```

Dies sind Beispiele, keine zwingenden Werte.

Die tatsächlichen Werte hängen von den verwendeten Dateigrößen ab.

---

## FFmpeg

FFmpeg ist nicht erforderlich.

Videovorschaubilder werden im Browser über echte Videoelemente erzeugt.

Videos werden nur im sichtbaren Bereich des Verwaltungsrasters geladen.

---

## HTTPS

HTTPS ist dringend empfohlen.

Ohne HTTPS können Browser folgende Funktionen einschränken:

- sichere Session-Cookies
- PWA-Funktionen
- Zwischenablagezugriff
- bestimmte Vollbild- und Medienfunktionen

---

## Webserver

EverMoment wurde für klassische PHP-Hostingumgebungen entwickelt.

Unter Apache schützen `.htaccess`-Dateien die Ordner `config/` und `storage/`.

Bei nginx müssen entsprechende Regeln in der Serverkonfiguration eingerichtet werden.

Beispiel:

```nginx
location ~ ^/(config|storage)/ {
    deny all;
}
```

---

## Speicherbedarf

Der Programmcode benötigt nur wenig Speicherplatz.

Der tatsächliche Bedarf wird fast vollständig durch Medien bestimmt.

Beispiel:

- 600 Bilder mit je 4 MB: ca. 2,4 GB
- 50 Videos mit je 100 MB: ca. 5 GB
- 20 MP3-Dateien mit je 10 MB: ca. 200 MB

Plane ausreichend Reserve ein.

---

## Maximale Medienanzahl

EverMoment besitzt keine feste kleine Obergrenze.

Die praktische Grenze hängt ab von:

- Browserleistung
- Hostinggeschwindigkeit
- Dateigrößen
- Anzahl der Videos
- verfügbarem Speicherplatz

Die Medienverwaltung ist für mehrere hundert Dateien ausgelegt.
