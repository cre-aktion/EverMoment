# EverMoment

### Beautiful photo & video presentations.

**EverMoment verwandelt Fotos und Videos in eine moderne, interaktive Erinnerungsgalerie.**

Ob Hochzeit, Geburtstag, Jubiläum, Vereinsfeier oder Firmenevent – mit EverMoment werden aus hunderten Bildern und Videos eindrucksvolle Präsentationen, die auf Smartphone, Tablet, Fernseher oder PC gleichermaßen gut aussehen.

**EverMoment ist kein gewöhnlicher Medienplayer. Es ist ein digitaler Ort für Erinnerungen – zum Anschauen, Teilen und gemeinsamen Erleben.**

Anstatt Dateien mühsam über Messenger oder Cloud-Dienste zu verteilen, stellst du deine schönsten Momente an einem zentralen Ort bereit. Deine Gäste können die Galerie bequem im Browser öffnen, Bilder in einer hochwertigen Vollbildansicht genießen und – wenn gewünscht – sogar eigene Fotos und Videos direkt hochladen.

Dank der integrierten Musik- und Diashowfunktion entsteht eine emotionale Präsentation, die Erinnerungen lebendig werden lässt – ganz ohne Installation oder technische Vorkenntnisse.

---

## Highlights

- Fotos und Videos in einer gemeinsamen Galerie
- Hintergrundmusik und automatische Diashow
- Musiküberblendung zwischen mehreren Titeln
- ID3-Titel, Interpret und Coveranzeige
- hochwertige Vollbildansicht mit Zoom
- Filmstreifen zur Navigation
- echte Videovorschau in der Medienverwaltung
- Gast-Upload für einzelne oder mehrere Medien
- automatische fortlaufende Nummerierung
- große Medienverwaltung mit Rasteransicht
- Drag-and-drop und Mehrfachauswahl
- Musikverwaltung ohne FTP
- individuelles Branding
- editierbares Intro und editierbare Begrüßung
- QR-Code zum schnellen Teilen
- passwortgeschützte Systemeinstellungen
- Recovery-Key für vergessene Passwörter
- responsive Darstellung für Smartphone, Tablet und Desktop
- keine Datenbank erforderlich
- kein Buildprozess erforderlich
- selbst gehostet

---

## Typische Einsatzbereiche

EverMoment eignet sich für:

- Hochzeiten
- Geburtstage
- Jubiläen
- Taufen
- Abschlussfeiern
- Vereinsveranstaltungen
- Firmenevents
- Reisen und Urlaube
- Familienfeiern
- private Foto- und Videoprojekte

---

## Schnellstart

1. ZIP-Datei entpacken.
2. Den vollständigen Ordner auf den Webserver hochladen.
3. EverMoment im Browser öffnen.
4. Unter **Einstellungen → Systemeinstellungen** das Administratorpasswort anlegen.
5. Branding, Intro, Begrüßung, Gast-Uploads und Musik konfigurieren.
6. Bilder und Videos über die Medienverwaltung beziehungsweise den Gast-Upload hinzufügen.

Ausführliche Hinweise stehen in [docs/INSTALLATION.md](docs/INSTALLATION.md).

---

## Technische Voraussetzungen

- PHP 8.1 oder neuer
- Webserver mit PHP-Unterstützung
- PHP-Erweiterungen `json`, `fileinfo`, `mbstring`
- Schreibrechte für `config/`, `storage/`, `public/img/` und `public/music/`
- ausreichend hohe PHP-Uploadlimits
- moderner Browser
- HTTPS empfohlen

Keine Datenbank, kein Node.js, kein Composer und kein Buildprozess erforderlich.

Details: [docs/TECHNISCHE_VORAUSSETZUNGEN.md](docs/TECHNISCHE_VORAUSSETZUNGEN.md)

---

## Dokumentation

- [Installation](docs/INSTALLATION.md)
- [Benutzerhandbuch](docs/BENUTZERHANDBUCH.md)
- [Administrationshandbuch](docs/ADMINISTRATION.md)
- [Technische Voraussetzungen](docs/TECHNISCHE_VORAUSSETZUNGEN.md)
- [Update und Backup](docs/UPDATE_UND_BACKUP.md)
- [FAQ und Fehlerbehebung](docs/FAQ.md)
- [Changelog](CHANGELOG.md)

---

## Verzeichnisstruktur

```text
EverMoment/
├── assets/
│   ├── branding/
│   ├── app.css
│   ├── app.js
│   ├── media-manager.css
│   └── media-manager.js
├── config/
├── docs/
├── includes/
├── public/
│   ├── img/
│   └── music/
├── storage/
├── index.php
├── media.php
├── media-manager.php
├── media-manager-api.php
├── music-admin-api.php
├── music-cover.php
├── upload-api.php
├── system-api.php
├── manifest.webmanifest
└── sw.js
```

`public/img/` und `public/music/` enthalten ausschließlich auszugebende Medien. Programmupdates dürfen diese Ordner niemals überschreiben.

---

## Sicherheit

EverMoment verwendet:

- serverseitige Passwortprüfung
- Passwort-Hashes statt Klartextpasswörtern
- PHP-Sessions
- CSRF-Schutz bei schreibenden Aktionen
- MIME- und Dateiendungsprüfung
- Dateisperren bei parallelen Uploads und Umbenennungen
- geschützte Konfigurations- und Storage-Ordner
- Recovery-Key für den Notfall

EverMoment ersetzt keine professionelle Benutzerverwaltung und ist für eine einzelne administrierende Person beziehungsweise ein einzelnes Betreiberteam ausgelegt.

---

## Lizenz

Die Lizenz wird vor der öffentlichen Veröffentlichung noch festgelegt.

Kommerzielle Nutzung soll nicht ohne ausdrückliche Genehmigung des Urhebers erlaubt sein.

---

## Status

**EverMoment 4.0.1 Release Candidate 9**

Dieser Stand dient den abschließenden Stabilitäts- und Praxistests vor der ersten finalen Veröffentlichung.
