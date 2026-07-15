<?php
declare(strict_types=1);
?><!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#111111">
  <title>EverMoment</title>
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="stylesheet" href="assets/app.css?v=4.0.1-rc.7">
</head>
<body>
<div id="app" class="app gallery-mode" data-version="4.0.1-rc.7">
  <div id="blurLayer" class="blur-layer" aria-hidden="true"></div>

  <header id="topbar" class="topbar ui-layer">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">
        <img src="assets/branding/evermoment-mark.png" alt="">
      </div>
      <div class="brand-content">
        <img id="brandLogo" class="brand-logo" src="" alt="" hidden>
        <div id="brandTitle" class="brand-title">EverMoment</div>
        <div id="brandSubtitle" class="brand-subtitle">Beautiful photo &amp; video presentations.</div>
      </div>
    </div>
    <div class="top-actions">
      <button id="settingsBtn" class="icon-btn" type="button" title="Einstellungen" aria-label="Einstellungen">⚙</button>
      <button id="slideshowBtn" class="icon-btn" type="button" title="Diashow starten" aria-label="Diashow starten">⛶</button>
    </div>
  </header>

  <main id="stage" class="stage">
    <div id="mediaHost" class="media-host"></div>
    <button id="prevBtn" class="nav-btn nav-prev ui-layer" type="button" aria-label="Vorheriges Medium">‹</button>
    <button id="nextBtn" class="nav-btn nav-next ui-layer" type="button" aria-label="Nächstes Medium">›</button>

    <div id="weddingIntro" class="wedding-intro" aria-hidden="true">
      <div class="intro-card">
        <div id="introTitle" class="intro-title">Deine schönsten Momente</div>
        <div id="introSubtitle" class="intro-subtitle">Fotos und Videos gemeinsam erleben</div>
        <div id="introLine3" class="intro-date"></div>
      </div>
    </div>
  </main>

  <section id="galleryControls" class="gallery-controls ui-layer">
    <div class="zoom-controls">
      <button id="zoomOutBtn" type="button">−</button>
      <span id="zoomLabel">100 %</span>
      <button id="zoomInBtn" type="button">+</button>
      <button id="zoomResetBtn" type="button">Zurücksetzen</button>
      <span id="filenameLabel"></span>
    </div>
    <div class="gallery-controls-right">
      <button id="uploadBtn" class="upload-open-btn" type="button">＋ Medien hochladen</button>
      <div id="counterLabel" class="counter-label">0 / 0</div>
      <button id="hideGalleryControlsBtn" class="controls-toggle-inline" type="button" title="Bedienleiste ausblenden" aria-label="Bedienleiste ausblenden"><span class="chevron chevron-down" aria-hidden="true">⌄</span></button>
    </div>
  </section>

  <button id="showGalleryControlsBtn" class="controls-toggle-floating ui-layer" type="button" title="Bedienleiste einblenden" aria-label="Bedienleiste einblenden"><span class="chevron chevron-up" aria-hidden="true">∧</span></button>

  <button id="mobileUploadBtn" class="mobile-upload-btn ui-layer" type="button"
          title="Medien hochladen" aria-label="Medien hochladen">＋</button>

  <div id="filmstripWrap" class="filmstrip-wrap ui-layer">
    <div id="filmstrip" class="filmstrip" tabindex="0" aria-label="Medienübersicht"></div>
  </div>

  <aside id="nowPlayingToast" class="now-playing-toast ui-layer" aria-live="polite" aria-atomic="true">
    <img id="nowPlayingCover" class="now-playing-cover" alt="" src="">
    <div class="now-playing-copy">
      <div id="nowPlayingTitle" class="now-playing-title"></div>
      <div id="nowPlayingArtist" class="now-playing-artist"></div>
    </div>
  </aside>

  <button id="slideshowEmergencyExitBtn" class="slideshow-emergency-exit ui-layer" type="button"
          title="Diashow beenden" aria-label="Diashow beenden">×</button>

  <section id="slideshowControls" class="slideshow-controls ui-layer" aria-hidden="true">
    <button id="slidePrevBtn" type="button" title="Zurück">‹</button>
    <button id="playPauseBtn" type="button" title="Pause/Weiter">Ⅱ</button>
    <button id="slideNextBtn" type="button" title="Weiter">›</button>
    <span id="slideCounter">0 / 0</span>
    <span class="music-label">Musik</span>
    <input id="volumeRange" type="range" min="0" max="1" step="0.01" value="0.65" aria-label="Lautstärke">
    <button id="muteBtn" type="button" title="Stumm">🔊</button>
    <button id="exitSlideshowBtn" class="exit-slideshow-btn" type="button" title="Diashow beenden" aria-label="Diashow beenden">⤫</button>
    <span class="esc-hint">ESC beendet</span>
  </section>

  <dialog id="settingsDialog" class="settings-dialog">
    <form method="dialog">
      <h2>Einstellungen</h2>
      <label>Bilddauer
        <select id="durationSelect">
          <option value="5000">5 Sekunden</option>
          <option value="8000" selected>8 Sekunden</option>
          <option value="10000">10 Sekunden</option>
          <option value="15000">15 Sekunden</option>
          <option value="20000">20 Sekunden</option>
        </select>
      </label>
      <label>Überblendzeit
        <select id="fadeSelect">
          <option value="500">0,5 Sekunden</option>
          <option value="900" selected>0,9 Sekunden</option>
          <option value="1500">1,5 Sekunden</option>
          <option value="2000">2 Sekunden</option>
        </select>
      </label>
      <label class="check-row"><input id="kenBurnsCheck" type="checkbox" checked> Ken-Burns-Effekt</label>
      <label class="check-row"><input id="blurCheck" type="checkbox" checked> Unscharfer Hintergrund</label>

      <div class="settings-section">
        <h3>Musik</h3>
        <label class="check-row">
          <input id="musicCrossfadeCheck" type="checkbox" checked>
          Musik überblenden
        </label>
        <label>Überblendzeit
          <select id="musicCrossfadeSelect">
            <option value="2000">2 Sekunden</option>
            <option value="3000">3 Sekunden</option>
            <option value="5000" selected>5 Sekunden</option>
            <option value="8000">8 Sekunden</option>
            <option value="10000">10 Sekunden</option>
          </select>
        </label>

        <label>Lieddaten anzeigen
          <select id="musicInfoDurationSelect">
            <option value="0">Aus</option>
            <option value="3000">3 Sekunden</option>
            <option value="5000">5 Sekunden</option>
            <option value="6000" selected>6 Sekunden</option>
            <option value="8000">8 Sekunden</option>
            <option value="-1">Dauerhaft bis zum nächsten Titel</option>
          </select>
        </label>
      </div>

      <div class="dialog-actions dialog-actions-split">
        <button id="systemSettingsBtn" type="button">Systemeinstellungen</button>
        <span class="dialog-spacer"></span>
        <button value="cancel">Schließen</button>
        <button id="saveSettingsBtn" value="default">Speichern</button>
      </div>
    </form>
  </dialog>

  <div id="guestGreeting" class="guest-greeting" aria-hidden="true">
    <div class="guest-greeting-card">
      <h2 id="greetingTitle"></h2><p id="greetingText"></p>
    </div>
  </div>

  <dialog id="uploadDialog" class="settings-dialog upload-dialog">
    <form method="dialog" id="uploadForm">
      <h2>Medien hochladen</h2>
      <p class="dialog-note">Einzelne oder mehrere Bilder und Videos auswählen.</p>
      <label class="upload-dropzone" id="uploadDropzone">
        <input id="uploadFiles" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime">
        <strong>Dateien auswählen</strong><span>oder hier ablegen</span>
      </label>
      <div id="uploadSummary" class="upload-summary">Keine Dateien ausgewählt</div>
      <progress id="uploadProgress" max="100" value="0"></progress>
      <div id="uploadStatus" class="upload-status"></div>
      <div class="dialog-actions"><button value="cancel">Schließen</button><button id="startUploadBtn" type="button">Hochladen</button></div>
    </form>
  </dialog>

  <dialog id="systemDialog" class="settings-dialog system-dialog">
    <form method="dialog" id="systemForm">
      <h2>Systemeinstellungen</h2>

      <section id="systemAuthPanel">
        <p id="systemAuthHint" class="dialog-note"></p>
        <label>Passwort
          <input id="systemPassword" type="password" autocomplete="current-password">
        </label>
        <label id="systemPasswordConfirmRow" hidden>Passwort wiederholen
          <input id="systemPasswordConfirm" type="password" autocomplete="new-password">
        </label>
        <div id="systemAuthMessage" class="form-message" aria-live="polite"></div>
        <div class="dialog-actions">
          <button value="cancel">Abbrechen</button>
          <button id="systemLoginBtn" type="button">Öffnen</button>
        </div>
        <button id="forgotPasswordBtn" class="text-button" type="button">Passwort vergessen?</button>
      </section>

      <section id="systemEditorPanel" hidden>
        <div class="settings-section">
          <h3>Branding</h3>
          <div class="branding-editor-grid">
            <div class="branding-fields">
              <label>Logo
                <input id="cfgBrandLogoFile" type="file" accept="image/png,image/jpeg,image/webp">
              </label>
              <div class="branding-logo-actions">
                <button id="removeBrandLogoBtn" type="button">Logo entfernen</button>
                <span id="brandLogoStatus" class="dialog-note"></span>
              </div>
              <label>Player-Titel<input id="cfgBrandTitle" maxlength="80"></label>
              <label>Untertitel<input id="cfgBrandSubtitle" maxlength="160"></label>
              <p class="dialog-note">Ist ein Logo vorhanden, wird der Player-Titel ausgeblendet. Der Untertitel bleibt sichtbar.</p>
            </div>
            <div class="branding-preview-wrap">
              <span class="dialog-note">Vorschau</span>
              <div id="brandingPreview" class="branding-preview">
                <img id="brandingPreviewLogo" alt="" hidden>
                <div id="brandingPreviewTitle" class="branding-preview-title">EverMoment</div>
                <div id="brandingPreviewSubtitle" class="branding-preview-subtitle">Beautiful photo &amp; video presentations.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-section"><h3>Diashow-Intro</h3>
          <label class="check-row"><input id="cfgIntroEnabled" type="checkbox"> Intro anzeigen</label>
          <label>Titel<input id="cfgIntroTitle"></label>
          <label>Untertitel<input id="cfgIntroSubtitle"></label>
          <label>Zusatzzeile / Datum<input id="cfgIntroLine3"></label>
          <label>Anzeigedauer<select id="cfgIntroDuration"><option value="3000">3 Sekunden</option><option value="4500">4,5 Sekunden</option><option value="6000">6 Sekunden</option><option value="8000">8 Sekunden</option></select></label>
        </div>

        <div class="settings-section"><h3>Begrüßung</h3>
          <label class="check-row"><input id="cfgGreetingEnabled" type="checkbox"> Begrüßung anzeigen</label>
          <label>Überschrift<input id="cfgGreetingTitle"></label>
          <label>Text<textarea id="cfgGreetingText" rows="4"></textarea></label>
          <label>Anzeigedauer<select id="cfgGreetingDuration"><option value="2000">2 Sekunden</option><option value="3000">3 Sekunden</option><option value="4000">4 Sekunden</option><option value="5000">5 Sekunden</option><option value="8000">8 Sekunden</option><option value="10000">10 Sekunden</option></select></label>
          <label class="check-row"><input id="cfgGreetingFirstOnly" type="checkbox"> Nur beim ersten Besuch anzeigen</label>
        </div>

        <div class="settings-section"><h3>Gast-Uploads</h3>
          <label class="check-row"><input id="cfgUploadEnabled" type="checkbox"> Uploads erlauben</label>
          <label>Beschriftung des Buttons<input id="cfgUploadLabel"></label>
          <label>Maximale Dateigröße (MB)<input id="cfgUploadMax" type="number" min="1" max="2048"></label>
          <label>Geöffnet bis (optional)<input id="cfgUploadUntil" type="datetime-local"></label>
        </div>



        <div class="settings-section">
          <h3>Medienverwaltung</h3>
          <p class="dialog-note">
            Bilder und Videos in einer großen Rasteransicht sortieren, verschieben und löschen.
          </p>
          <a id="openMediaManagerBtn" class="button-link media-manager-open-link"
             href="media-manager.php" target="_blank" rel="noopener">
            Medienverwaltung öffnen
          </a>
        </div>

        <div class="settings-section music-manager-section">
          <h3>Musikverwaltung</h3>
          <p class="dialog-note">
            MP3-Dateien hinzufügen, anhören, ersetzen, löschen und per Drag-and-drop sortieren.
            EverMoment nummeriert die Playlist automatisch als 001.mp3, 002.mp3 usw.
          </p>

          <div class="music-upload-panel">
            <label class="music-upload-picker">
              <input id="musicAdminFiles" type="file" accept="audio/mpeg,.mp3" multiple>
              <span>MP3-Titel auswählen</span>
            </label>
            <button id="musicAdminUploadBtn" type="button">Titel hinzufügen</button>
          </div>

          <div id="musicAdminLimits" class="dialog-note"></div>
          <progress id="musicAdminProgress" class="music-admin-progress" max="100" value="0"></progress>
          <div id="musicAdminMessage" class="form-message" aria-live="polite"></div>

          <div id="musicAdminList" class="music-admin-list" aria-live="polite"></div>

          <audio id="musicAdminPreview" class="music-admin-preview" controls preload="metadata"></audio>
          <input id="musicAdminReplaceInput" type="file" accept="audio/mpeg,.mp3" hidden>
        </div>

        <div class="settings-section"><h3>QR-Code</h3>
          <label>Galerie-Adresse<input id="cfgGalleryUrl" type="url" placeholder="https://example.de/evermoment/"></label>
          <div id="qrPreview" class="qr-preview"></div>
          <div class="dialog-actions"><button id="generateQrBtn" type="button">QR-Code erzeugen</button><a id="qrPngLink" class="button-link" target="_blank" rel="noopener">PNG öffnen</a><a id="qrSvgLink" class="button-link" target="_blank" rel="noopener">SVG öffnen</a></div>
          <p class="dialog-note">Die QR-Dateien werden über api.qrserver.com erzeugt und können anschließend in Canva weiterverarbeitet werden.</p>
        </div>

        <div class="settings-section"><h3>Sicherheit</h3>
          <label>Aktuelles Passwort<input id="currentPassword" type="password" autocomplete="current-password"></label>
          <label>Neues Passwort<input id="newPassword" type="password" autocomplete="new-password"></label>
          <label>Neues Passwort wiederholen<input id="newPasswordConfirm" type="password" autocomplete="new-password"></label>
          <button id="changePasswordBtn" type="button">Passwort ändern</button>
        </div>

        <div id="systemMessage" class="form-message" aria-live="polite"></div>
        <div class="dialog-actions"><button value="cancel">Schließen</button><button id="saveSystemBtn" type="button">Speichern</button></div>
      </section>
    </form>
  </dialog>

  <dialog id="passwordRecoveryDialog" class="settings-dialog recovery-dialog">
    <form method="dialog" id="passwordRecoveryForm">
      <h2>Passwort zurücksetzen</h2>
      <p class="dialog-note">Gib den gespeicherten Recovery-Key und ein neues Passwort ein.</p>
      <label>Recovery-Key<input id="recoveryKey" autocomplete="off"></label>
      <label>Neues Passwort<input id="recoveryNewPassword" type="password" autocomplete="new-password"></label>
      <label>Neues Passwort wiederholen<input id="recoveryNewPasswordConfirm" type="password" autocomplete="new-password"></label>
      <div id="recoveryMessage" class="form-message" aria-live="polite"></div>
      <div class="dialog-actions"><button value="cancel">Abbrechen</button><button id="resetPasswordBtn" type="button">Passwort zurücksetzen</button></div>
    </form>
  </dialog>

  <dialog id="recoveryKeyDialog" class="settings-dialog recovery-key-dialog">
    <form method="dialog">
      <h2>Recovery-Key</h2>
      <p>Bitte speichere diesen Schlüssel sicher. Er wird nur einmal vollständig angezeigt.</p>
      <div id="recoveryKeyDisplay" class="recovery-key-display"></div>
      <div class="recovery-key-actions">
        <button id="copyRecoveryKeyBtn" type="button">Kopieren</button>
        <button id="downloadRecoveryKeyBtn" type="button">Als TXT speichern</button>
        <button id="printRecoveryKeyBtn" type="button">Drucken</button>
      </div>
      <label class="check-row recovery-confirm-row"><input id="recoveryKeyConfirmed" type="checkbox"> Ich habe den Recovery-Key sicher gespeichert.</label>
      <div class="dialog-actions"><button id="closeRecoveryKeyBtn" type="button" disabled>Weiter zu den Systemeinstellungen</button></div>
    </form>
  </dialog>

  <div id="appToast" class="app-toast" role="status" aria-live="polite"></div>

  <audio id="musicPlayerA" preload="auto"></audio>
  <audio id="musicPlayerB" preload="auto"></audio>
</div>
<script src="assets/app.js?v=4.0.1-rc.7"></script>
</body>
</html>
