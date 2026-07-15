# Installation

## Überblick

EverMoment benötigt keinen klassischen Installationsassistenten und keine Datenbank.

Die Installation besteht aus fünf Schritten:

1. ZIP-Datei entpacken
2. Ordner auf den Server hochladen
3. Schreibrechte prüfen
4. EverMoment im Browser öffnen
5. Administratorpasswort und Grundeinstellungen anlegen

---

## 1. ZIP-Datei entpacken

Entpacke die heruntergeladene ZIP-Datei auf deinem Computer.

Danach liegt ein Ordner mit den EverMoment-Dateien vor.

---

## 2. Ordner auf den Webserver laden

Lade den vollständigen EverMoment-Ordner mit einem FTP-Programm oder dem Dateimanager deines Hostinganbieters auf den Webserver.

Beispiel:

```text
https://example.de/evermoment/
```

Die Datei `index.php` muss direkt in diesem Ordner liegen.

---

## 3. Schreibrechte prüfen

PHP muss in folgende Ordner schreiben dürfen:

```text
config/
storage/
public/img/
public/music/
```

Je nach Hostinganbieter funktionieren üblicherweise Berechtigungen wie `755` oder `775`.

Verwende nicht pauschal `777`, sofern dein Hoster dies nicht ausdrücklich verlangt.

### Bedeutung der Ordner

- `config/` speichert Branding, Einstellungen und Sicherheitsdaten
- `storage/` speichert Sperrdateien und Revisionsstände
- `public/img/` enthält Bilder und Videos
- `public/music/` enthält MP3-Dateien

---

## 4. PHP-Uploadlimits prüfen

Für größere Bilder, Videos und Musikdateien müssen die PHP-Limits ausreichend hoch sein.

Wichtige Einstellungen:

```text
upload_max_filesize
post_max_size
max_file_uploads
max_execution_time
memory_limit
```

`post_max_size` muss mindestens so groß wie `upload_max_filesize` sein.

Für Videos sind je nach Dateigröße beispielsweise 256 MB, 512 MB oder mehr sinnvoll.

---

## 5. EverMoment öffnen

Öffne die Adresse im Browser:

```text
https://example.de/evermoment/
```

Rufe anschließend auf:

```text
Einstellungen → Systemeinstellungen
```

Beim ersten Aufruf legst du das Administratorpasswort fest.

Danach wird einmalig ein Recovery-Key angezeigt.

Speichere diesen Schlüssel sicher. Er wird benötigt, falls das Administratorpasswort vergessen wird.

---

## 6. Grundeinstellungen

In den Systemeinstellungen kannst du festlegen:

- Player-Titel oder Branding-Logo
- Untertitel
- Diashow-Intro
- Begrüßung
- Gast-Uploads
- Galerieadresse für den QR-Code
- Hintergrundmusik
- Administratorpasswort

---

## 7. Medien hinzufügen

### Bilder und Videos

Bilder und Videos können auf zwei Wegen hinzugefügt werden:

- Gast-Upload über die Galerie
- geschützte Medienverwaltung

### Musik

MP3-Dateien werden über die Musikverwaltung in den Systemeinstellungen hochgeladen.

FTP ist nach der Erstinstallation für die laufende Medienpflege nicht erforderlich.

---

## 8. HTTPS

HTTPS wird dringend empfohlen.

Vorteile:

- sichere Passwort- und Uploadübertragung
- zuverlässigere PWA-Funktionen
- bessere Unterstützung auf Mobilgeräten
- sichere Session-Cookies

---

## Installation prüfen

Nach der Einrichtung sollten folgende Funktionen getestet werden:

- Galerie öffnet sich
- Bilder und Videos werden angezeigt
- Systemeinstellungen lassen sich öffnen
- Musik kann hochgeladen werden
- Gast-Upload funktioniert
- Medienverwaltung lässt sich öffnen
- QR-Code wird erzeugt
- Diashow startet
- Musik setzt nach Videos wieder ein
