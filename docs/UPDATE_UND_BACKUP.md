# Update und Backup

## Grundregel

EverMoment trennt Programmdateien und Nutzerdaten.

### Nutzerdaten

Diese Ordner dürfen durch ein Update niemals überschrieben werden:

```text
config/
storage/
public/
```

Besonders wichtig:

```text
public/img/
public/music/
```

Dort liegen die persönlichen Medien.

---

## Vor jedem Update

Erstelle ein Backup von:

```text
config/
storage/
public/img/
public/music/
```

Bei sehr großen Medienbeständen kann `public/` separat gesichert werden.

---

## Programmupdate

1. EverMoment-Update herunterladen
2. ZIP lokal entpacken
3. Changelog lesen
4. Backup erstellen
5. nur Programmdateien überschreiben
6. `config/`, `storage/` und `public/` nicht löschen
7. Browsercache aktualisieren

Nach einem Update:

- Desktop: `Strg + F5`
- iPhone/iPad: Browser oder Web-App vollständig schließen und neu öffnen

---

## Vollständiges Backup

Ein vollständiges Backup umfasst:

```text
gesamter EverMoment-Ordner
```

Damit werden gesichert:

- Programm
- Konfiguration
- Passworthash
- Branding
- Bilder
- Videos
- Musik
- technische Revisionsstände

---

## Wiederherstellung

1. beschädigten Ordner umbenennen oder entfernen
2. Backup hochladen
3. Schreibrechte prüfen
4. EverMoment öffnen
5. Funktionen testen

---

## Umzug auf einen anderen Server

1. gesamten EverMoment-Ordner herunterladen
2. auf neuen Server hochladen
3. Schreibrechte prüfen
4. Galerieadresse in den Systemeinstellungen aktualisieren
5. QR-Code neu erzeugen
6. Uploadlimits des neuen Servers prüfen

---

## Medien nicht manuell umbenennen

Wenn möglich, verwende die Medien- und Musikverwaltung.

Manuelles Umbenennen per FTP kann:

- Reihenfolgen verändern
- Caches verwirren
- Nummernlücken verursachen
- parallele Uploads beeinträchtigen

---

## Notfall

Wenn EverMoment nicht mehr startet:

1. PHP-Version prüfen
2. Server-Fehlerprotokoll prüfen
3. Schreibrechte prüfen
4. letzte Programmänderung zurücknehmen
5. Backup wiederherstellen

Persönliche Medien nicht vorschnell löschen.
