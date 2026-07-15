# FAQ und Fehlerbehebung

## Benötigt EverMoment eine Datenbank?

Nein.

EverMoment speichert Einstellungen in Dateien und verwaltet Medien direkt im Dateisystem.

---

## Benötigt EverMoment FFmpeg?

Nein.

Videovorschauen werden direkt im Browser erzeugt.

---

## Muss ich FTP verwenden?

Für die Erstinstallation und Programmupdates: ja, sofern dein Hostinganbieter keinen Dateimanager anbietet.

Für die laufende Pflege von Bildern, Videos und Musik: nein.

---

## Wo liegen Bilder und Videos?

```text
public/img/
```

---

## Wo liegt die Musik?

```text
public/music/
```

---

## Darf ich Dateien direkt in `public/` ablegen?

Technisch ja.

Empfohlen sind jedoch Gast-Upload, Medienverwaltung und Musikverwaltung, weil EverMoment dort Nummerierung und Cache-Aktualisierung übernimmt.

---

## Warum erscheint ein hochgeladenes Medium nicht sofort?

- Galerie neu laden
- prüfen, ob Uploads aktiviert sind
- Dateiformat prüfen
- PHP-Uploadlimit prüfen

---

## Warum wird ein altes Bild an einer neuen Position angezeigt?

Aktuelle EverMoment-Versionen verwenden eine Medienrevision.

Nach Updates einmal hart neu laden.

Tritt das Problem weiterhin auf:

- `storage/` auf Schreibrechte prüfen
- Browsercache leeren
- Medienverwaltung neu öffnen

---

## Warum wird die geänderte Musikreihenfolge nicht übernommen?

Aktuelle Versionen verwenden eine Musikrevision.

Prüfe:

- Schreibrechte für `storage/`
- Browser einmal nach dem Programmupdate hart neu laden
- Musikverwaltung schließen und erneut öffnen

---

## Warum startet Musik nicht automatisch?

Browser verhindern automatische Tonwiedergabe häufig ohne vorherige Benutzeraktion.

Starte die Diashow über den vorgesehenen Button.

---

## Warum zeigt die MP3 kein Cover?

Das Cover muss im ID3-Tag der MP3 eingebettet sein.

Prüfe die heruntergeladene Serverdatei in einem externen Player.

---

## Warum ist der Uploadbutton auf dem Smartphone nicht in der Bedienleiste?

Auf kleinen Displays erscheint ein eigener schwebender Uploadbutton.

---

## Was passiert bei gleichzeitigen Uploads?

EverMoment verwendet Dateisperren.

Dadurch werden doppelte Nummern und parallele Umbenennungen verhindert.

---

## Was passiert, wenn während der Medienverwaltung ein Gast etwas hochlädt?

EverMoment erkennt den Konflikt.

Die Speicherung wird abgelehnt und die Medienverwaltung muss neu geladen werden.

---

## Wie ändere ich das Administratorpasswort?

```text
Systemeinstellungen → Sicherheit
```

---

## Was mache ich bei vergessenem Passwort?

Im Passwortdialog:

```text
Passwort vergessen?
```

Anschließend Recovery-Key und neues Passwort eingeben.

---

## Ich habe auch den Recovery-Key verloren

Ohne Passwort und Recovery-Key ist kein normaler Reset möglich.

Stelle die Sicherheitsdateien aus einem Backup wieder her oder setze die Installation kontrolliert neu auf.

---

## Welche Formate werden unterstützt?

Typischerweise:

### Bilder

- JPG
- JPEG
- PNG
- WebP
- GIF
- AVIF, abhängig vom Browser

### Videos

- MP4
- WebM
- MOV, abhängig vom Browser
- M4V
- OGV

### Musik

- MP3

Die tatsächliche Wiedergabe hängt auch vom Browser und den verwendeten Codecs ab.

---

## Warum spielt ein MOV-Video nicht?

MOV ist nur ein Container.

Der darin verwendete Codec muss vom Browser unterstützt werden.

Für höchste Kompatibilität wird MP4 mit H.264-Video und AAC-Audio empfohlen.

---

## Wo finde ich Serverfehler?

Je nach Hostinganbieter:

- PHP-Fehlerprotokoll
- Webserver-Error-Log
- Hosting-Kontrollzentrum
- Dateimanager des Hosters

---

## Kann EverMoment öffentlich erreichbar sein?

Ja.

Die Galerie ist öffentlich, sofern der Webserver sie öffentlich bereitstellt.

Nur Systemeinstellungen und Verwaltungsfunktionen sind passwortgeschützt.

---

## Kann ich Gast-Uploads zeitlich begrenzen?

Ja.

In den Systemeinstellungen kann ein Enddatum festgelegt werden.
