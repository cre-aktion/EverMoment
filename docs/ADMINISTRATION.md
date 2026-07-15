# Administrationshandbuch

## Systemeinstellungen öffnen

1. EverMoment öffnen
2. Zahnrad auswählen
3. **Systemeinstellungen** öffnen
4. Administratorpasswort eingeben

Nach erfolgreicher Anmeldung stehen die zentralen Einstellungen zur Verfügung.

---

## Ersteinrichtung

Beim ersten Öffnen wird ein Administratorpasswort angelegt.

Anschließend zeigt EverMoment einmalig einen Recovery-Key an.

Der Recovery-Key kann:

- kopiert
- als Textdatei gespeichert
- ausgedruckt

werden.

Bewahre ihn außerhalb des Servers sicher auf.

---

## Branding

EverMoment unterstützt zwei Varianten.

### Ohne Branding-Logo

Es werden angezeigt:

- Player-Titel
- Untertitel

### Mit Branding-Logo

Es werden angezeigt:

- Branding-Logo
- Untertitel

Der Player-Titel wird automatisch ausgeblendet.

Das feste EverMoment-Mark links daneben bleibt immer sichtbar.

---

## Diashow-Intro

Konfigurierbar sind:

- Intro aktivieren oder deaktivieren
- Titel
- Untertitel
- Zusatzzeile oder Datum
- Anzeigedauer

Das Intro erscheint beim Start der Diashow.

---

## Begrüßung

Konfigurierbar sind:

- Begrüßung aktivieren
- Überschrift
- Text
- Anzeigedauer
- nur beim ersten Besuch anzeigen

Die Begrüßung verschwindet automatisch.

---

## Gast-Uploads

Konfigurierbar sind:

- Uploads aktivieren oder deaktivieren
- Beschriftung des Uploadbuttons
- maximale Dateigröße
- optionales Enddatum

Gast-Uploads werden direkt nach `public/img/` gespeichert und automatisch nummeriert.

Es gibt keinen Freigabeordner.

Aktiviere die Funktion nur, wenn sie gewünscht ist.

---

## QR-Code

Trage die vollständige Galerieadresse ein.

Beispiel:

```text
https://example.de/evermoment/
```

EverMoment erzeugt daraus QR-Code-Dateien.

Diese können anschließend beispielsweise in Canva, Word oder einem Layoutprogramm verwendet werden.

---

## Musikverwaltung

Die Musikverwaltung befindet sich in den Systemeinstellungen.

Funktionen:

- einzelne MP3 hochladen
- mehrere MP3 gleichzeitig hochladen
- ID3-Titel anzeigen
- Interpret anzeigen
- Cover anzeigen
- Titel anhören
- Titel ersetzen
- Titel löschen
- Reihenfolge per Drag-and-drop ändern
- automatische Neunummerierung

Die Dateinamen werden automatisch als `001.mp3`, `002.mp3` usw. vergeben.

Nach Änderungen wird die Playlist automatisch aktualisiert.

---

## Medienverwaltung

Die Medienverwaltung öffnet sich auf einer eigenen großen Seite.

### Funktionen

- Rastergröße verändern
- nur Bilder anzeigen
- nur Videos anzeigen
- zu einer Nummer springen
- Bild oder Video ansehen
- Medium an eine Position verschieben
- Drag-and-drop
- Mehrfachauswahl
- mehrere Medien gemeinsam verschieben
- mehrere Medien löschen
- automatische Neunummerierung

### Auswahl

Jede Kachel besitzt links oben einen Auswahlkreis.

- leerer Kreis: nicht ausgewählt
- Haken: ausgewählt

Bei mehreren ausgewählten Medien erscheint eine Aktionsleiste.

### Reihenfolge speichern

Änderungen werden zunächst nur im Browser vorgenommen.

Erst mit **Reihenfolge speichern** werden die Dateien auf dem Server neu nummeriert.

### Konflikte

Wenn während der Bearbeitung ein Gast neue Medien hochlädt, kann EverMoment die Speicherung ablehnen.

In diesem Fall:

1. Medienverwaltung neu laden
2. Änderungen erneut vornehmen

Damit werden versehentliche Überschreibungen verhindert.

---

## Passwort ändern

Im Abschnitt **Sicherheit**:

1. aktuelles Passwort eingeben
2. neues Passwort eingeben
3. neues Passwort wiederholen
4. Passwort ändern

---

## Passwort vergessen

Im Anmeldedialog **Passwort vergessen?** öffnen.

Benötigt werden:

- Recovery-Key
- neues Passwort
- Passwortwiederholung

Nach dem Zurücksetzen wird ein neuer Recovery-Key erzeugt.

Der alte Recovery-Key ist danach ungültig.

---

## Schreibrechte

Folgende Ordner müssen beschreibbar bleiben:

```text
config/
storage/
public/img/
public/music/
```

---

## Sicherheitsgrundsätze

- Administratorpasswort nicht weitergeben
- Recovery-Key getrennt aufbewahren
- HTTPS verwenden
- Uploads nur bei Bedarf aktivieren
- regelmäßige Backups anlegen
- Programmupdates niemals ungeprüft in `public/` entpacken
