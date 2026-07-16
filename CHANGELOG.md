# Changelog

## 4.0.1 RC9

- Upload bleibt erfolgreich, auch wenn die Medienrevision nicht aktualisiert werden kann.
- Fehler beim Aktualisieren der Cache-Revision werden protokolliert, statt einen leeren HTTP-500-Fehler auszulösen.
- Serverseitige Uploadfehler liefern jetzt eine gültige JSON-Fehlermeldung.


## 4.0.1 RC8

- Upload-Hotfix: fehlende Einbindung der Medienrevision ergänzt
- Erfolgreich gespeicherte Uploads liefern wieder eine gültige JSON-Antwort
- Upload-Fehler zeigen künftig HTTP-Status und Serverdetails statt nur „Ungültige Serverantwort“

## 4.0.1 RC7

- iPhone-Diashow: Musik startet erst nach Abschluss der unsichtbaren Video-Freigabe.
- Verhindert, dass iOS die Hintergrundmusik direkt nach dem ersten Ton wieder stoppt.
- Automatischer Videostart in der Diashow aus RC6 bleibt erhalten.

## 4.0.1 RC6

- iPhone/iPad: Diashow-Videos starten ohne zusätzlichen Klick.
- Ein persistenter Videoplayer wird beim Start der Diashow freigegeben und während der Präsentation wiederverwendet.
- Der manuelle Startknopf bleibt nur als technische Rückfallebene erhalten.
- Musik pausiert weiterhin vor dem Video und wird danach fortgesetzt.

## 4.0.1-rc.6

- iPhone-/iPad-Videofix: native Videosteuerung ist in der Galerie antippbar.
- `playsinline` und `webkit-playsinline` werden für Galerie- und Vorschauelemente gesetzt.
- Wird der automatische Videostart von iOS/Safari blockiert, blendet EverMoment native Bedienelemente ein.

## 4.0.1-rc.2

### Dokumentation

- vollständige GitHub-README
- Installationsanleitung
- Benutzerhandbuch
- Administrationshandbuch
- technische Voraussetzungen
- Update- und Backup-Anleitung
- FAQ und Fehlerbehebung
- Verzeichnis für zukünftige Screenshots

### Release-Vorbereitung

- Versionsnummer auf Release Candidate 2 erhöht
- technische Dokumentation mit aktuellem Projektstand abgeglichen
- Lizenzentscheidung bewusst noch offen gelassen

---

## 4.0.1-rc.1

### Bereinigung

- Projektstruktur geprüft
- historische Kommentare entfernt
- Debug- und Konsolenausgaben entfernt
- neutrale Standardtexte eingeführt
- Gast-Uploads standardmäßig deaktiviert
- alte `hb_*`-Browserschlüssel auf `em_*` migriert
- feste EverMoment-Marke integriert
- leere Medienordner für Neuinstallationen aufgenommen
- `config/` und `storage/` gegen direkten Apache-Zugriff geschützt
- Musikrevision vollständig eingebunden

---

## 4.0.0-beta4.4

- Musikrevision ergänzt
- Musikreihenfolge wirkt ohne Hard-Reload
- Audioelemente werden bei Playlist-Aktualisierung neu geladen

## 4.0.0-beta4.3

- globale Medienrevision ergänzt
- Cachefehler nach Neunummerierungen behoben

## 4.0.0-beta4.2

- Mehrfachauswahl in der Medienverwaltung
- Blockverschiebung
- Mehrfachlöschen

## 4.0.0-beta4.1

- Speichern der Medienreihenfolge korrigiert
- kompakte Symbolbuttons

## 4.0.0-beta4

- große Medienverwaltung
- Rasteransicht
- Drag-and-drop
- Videovorschau
- automatische Neunummerierung

## 4.0.0-beta3

- Musikverwaltung
- MP3-Upload
- ID3-Anzeige
- Ersetzen, Löschen und Sortieren

## 4.0.0-beta2

- UX-Überarbeitung der Systemeinstellungen
- Recovery-Key-Dialog
- mobiles Upload-Bedienelement
- Branding-Logo

## 4.0.0-beta1

- Gast-Upload
- QR-Code
- Branding
- editierbares Intro
- editierbare Begrüßung
- Systemeinstellungen
