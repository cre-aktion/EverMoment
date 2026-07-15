<?php
declare(strict_types=1);

session_name('evermoment_admin');
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Strict',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

$authenticated = !empty($_SESSION['em_admin']);
?><!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="color-scheme" content="dark">
  <title>EverMoment Medienverwaltung</title>
  <link rel="stylesheet" href="assets/media-manager.css?v=4.0.1-rc.3">
</head>
<body>
<?php if (!$authenticated): ?>
  <main class="access-denied">
    <section>
      <h1>Medienverwaltung</h1>
      <p>Die Administrationssitzung ist nicht aktiv.</p>
      <p>Öffne zuerst im Player die passwortgeschützten Systemeinstellungen und starte die Medienverwaltung von dort.</p>
      <a href="index.php">Zum Player</a>
    </section>
  </main>
<?php else: ?>
  <div id="mediaManagerApp" class="media-manager-app">
    <header class="manager-header">
      <div class="manager-brand">
        <img src="assets/branding/evermoment-mark.png" alt="" aria-hidden="true">
        <div>
          <h1>Medienverwaltung</h1>
          <p id="mediaCountLabel">Medien werden geladen …</p>
        </div>
      </div>
      <div class="manager-header-actions">
        <a class="secondary-button" href="index.php">Zum Player</a>
        <button id="reloadMediaBtn" class="secondary-button" type="button">Neu laden</button>
        <button id="saveOrderBtn" class="primary-button" type="button" disabled>Reihenfolge speichern</button>
      </div>
    </header>

    <section class="manager-toolbar" aria-label="Werkzeuge">
      <div class="toolbar-group">
        <label>Filter
          <select id="mediaTypeFilter">
            <option value="all">Alle Medien</option>
            <option value="image">Nur Bilder</option>
            <option value="video">Nur Videos</option>
          </select>
        </label>
        <label>Nummer suchen
          <input id="mediaSearchInput" type="search" inputmode="numeric" placeholder="z. B. 247">
        </label>
        <button id="jumpToMediaBtn" type="button">Springen</button>
      </div>

      <div class="toolbar-group">
        <label>Rastergröße
          <input id="gridSizeRange" type="range" min="120" max="260" step="10" value="180">
        </label>
        <span id="changeCountLabel" class="change-count">Keine ungespeicherten Änderungen</span>
      </div>
    </section>

    <section id="selectionBar" class="selection-bar" hidden>
      <strong id="selectionCountLabel">0 Medien ausgewählt</strong>
      <div class="selection-actions">
        <button id="moveSelectionBtn" type="button">Verschieben</button>
        <button id="deleteSelectionBtn" class="danger-button" type="button">Löschen</button>
        <button id="clearSelectionBtn" type="button">Auswahl aufheben</button>
      </div>
    </section>

    <main class="manager-content">
      <div id="managerMessage" class="manager-message" role="status" aria-live="polite"></div>
      <div id="mediaGrid" class="media-grid" aria-live="polite"></div>
      <div id="gridSentinel" class="grid-sentinel" aria-hidden="true"></div>
    </main>

    <footer class="manager-footer">
      <span id="footerPosition">–</span>
      <div>
        <button id="discardChangesBtn" class="secondary-button" type="button" disabled>Änderungen verwerfen</button>
        <button id="saveOrderFooterBtn" class="primary-button" type="button" disabled>Reihenfolge speichern</button>
      </div>
    </footer>
  </div>

  <dialog id="previewDialog" class="manager-dialog preview-dialog">
    <form method="dialog">
      <button class="dialog-close" value="cancel" aria-label="Vorschau schließen">×</button>
      <div id="previewHost" class="preview-host"></div>
      <div id="previewCaption" class="preview-caption"></div>
    </form>
  </dialog>

  <dialog id="moveDialog" class="manager-dialog move-dialog">
    <form method="dialog">
      <h2>Medium verschieben</h2>
      <p id="moveDialogLabel"></p>
      <label>Neue Position
        <input id="movePositionInput" type="number" min="1" step="1">
      </label>
      <div class="dialog-actions">
        <button value="cancel">Abbrechen</button>
        <button id="confirmMoveBtn" type="button">Verschieben</button>
      </div>
    </form>
  </dialog>

  <dialog id="multiDeleteDialog" class="manager-dialog delete-dialog">
    <form method="dialog">
      <h2>Ausgewählte Medien löschen</h2>
      <p id="multiDeleteDialogLabel"></p>
      <p class="warning-text">Die Dateien werden endgültig gelöscht. Die übrigen Medien werden danach automatisch neu nummeriert.</p>
      <div class="dialog-actions">
        <button value="cancel">Abbrechen</button>
        <button id="confirmMultiDeleteBtn" class="danger-button" type="button">Endgültig löschen</button>
      </div>
    </form>
  </dialog>

  <dialog id="deleteDialog" class="manager-dialog delete-dialog">
    <form method="dialog">
      <h2>Medium löschen</h2>
      <p id="deleteDialogLabel"></p>
      <p class="warning-text">Die Datei wird endgültig gelöscht. Die übrigen Medien werden danach automatisch neu nummeriert.</p>
      <div class="dialog-actions">
        <button value="cancel">Abbrechen</button>
        <button id="confirmDeleteBtn" class="danger-button" type="button">Endgültig löschen</button>
      </div>
    </form>
  </dialog>

  <div id="managerToast" class="manager-toast" role="status" aria-live="polite"></div>
  <script src="assets/media-manager.js?v=4.0.1-rc.3"></script>
<?php endif; ?>
</body>
</html>
