(() => {
'use strict';

const $ = (s) => document.querySelector(s);
const app = $('#app');
const stage = $('#stage');
const mediaHost = $('#mediaHost');
const blurLayer = $('#blurLayer');
const filmstrip = $('#filmstrip');
const prevBtn = $('#prevBtn');
const nextBtn = $('#nextBtn');
const settingsBtn = $('#settingsBtn');
const slideshowBtn = $('#slideshowBtn');
const galleryControls = $('#galleryControls');
const slideshowControls = $('#slideshowControls');
const weddingIntro = $('#weddingIntro');
const hideGalleryControlsBtn = $('#hideGalleryControlsBtn');
const showGalleryControlsBtn = $('#showGalleryControlsBtn');
const musicPlayerA = $('#musicPlayerA');
const musicPlayerB = $('#musicPlayerB');
const musicPlayers = [musicPlayerA, musicPlayerB];
const nowPlayingToast = $('#nowPlayingToast');
const nowPlayingCover = $('#nowPlayingCover');
const nowPlayingTitle = $('#nowPlayingTitle');
const nowPlayingArtist = $('#nowPlayingArtist');
const slideshowEmergencyExitBtn = $('#slideshowEmergencyExitBtn');
const uploadBtn = $('#uploadBtn');
const mobileUploadBtn = $('#mobileUploadBtn');
const uploadDialog = $('#uploadDialog');
const systemDialog = $('#systemDialog');
const guestGreeting = $('#guestGreeting');
const passwordRecoveryDialog = $('#passwordRecoveryDialog');
const recoveryKeyDialog = $('#recoveryKeyDialog');
const appToast = $('#appToast');
const musicAdminList = $('#musicAdminList');
const musicAdminFiles = $('#musicAdminFiles');
const musicAdminPreview = $('#musicAdminPreview');
const musicAdminReplaceInput = $('#musicAdminReplaceInput');
let serverConfig = null;
let systemCsrf = null;

let pendingLogoFile = null;
let currentRecoveryKey = '';
let musicAdminTracks = [];
let musicAdminReplaceName = '';
let musicAdminDraggedName = '';
let slideshowTouchStartX = 0;
let slideshowTouchStartY = 0;
let slideshowTouchActive = false;
let introTimer = null;
let isExitingSlideshow = false;

// iOS/Safari: one persistent video element is reused for the complete
// slideshow. The element is primed by the user's click on "Diashow" so
// later videos can start without another tap.
const slideshowVideoParking = document.createElement('div');
slideshowVideoParking.hidden = true;
slideshowVideoParking.setAttribute('aria-hidden', 'true');
document.body.appendChild(slideshowVideoParking);

const slideshowVideo = document.createElement('video');
slideshowVideo.preload = 'auto';
slideshowVideo.playsInline = true;
slideshowVideo.setAttribute('playsinline', '');
slideshowVideo.setAttribute('webkit-playsinline', '');
slideshowVideo.setAttribute('controlslist', 'nodownload');
slideshowVideoParking.appendChild(slideshowVideo);
let slideshowVideoPrimed = false;
let slideshowVideoPriming = null;

function normalizedMediaUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    parsed.hash = '';
    return parsed.href;
  } catch (_) {
    return String(url || '').split('#')[0];
  }
}

function firstSlideshowVideo() {
  if (!state.media.length) return null;
  for (let offset = 0; offset < state.media.length; offset += 1) {
    const item = state.media[(state.index + offset) % state.media.length];
    if (item?.type === 'video') return item;
  }
  return null;
}

function parkSlideshowVideo() {
  if (slideshowVideo.parentNode !== slideshowVideoParking) {
    slideshowVideoParking.appendChild(slideshowVideo);
  }
}

function primeSlideshowVideo() {
  const item = firstSlideshowVideo();
  if (!item || slideshowVideoPrimed) return Promise.resolve();
  if (slideshowVideoPriming) return slideshowVideoPriming;

  const targetUrl = videoPreviewUrl(item.url);
  if (normalizedMediaUrl(slideshowVideo.currentSrc || slideshowVideo.src) !== normalizedMediaUrl(targetUrl)) {
    slideshowVideo.src = targetUrl;
    slideshowVideo.load();
  }

  // The priming playback must be started directly from the slideshow button
  // click. It stays inaudible, but is deliberately not muted so iOS also
  // authorizes later videos with sound.
  slideshowVideo.muted = false;
  slideshowVideo.volume = 0;

  const playPromise = safePlay(slideshowVideo);
  if (!playPromise || typeof playPromise.then !== 'function') {
    slideshowVideoPriming = null;
    return Promise.resolve();
  }

  slideshowVideoPriming = playPromise
    .then(() => {
      slideshowVideo.pause();
      try { slideshowVideo.currentTime = 0; } catch (_) {}
      slideshowVideo.volume = 1;
      slideshowVideoPrimed = true;
      parkSlideshowVideo();
    })
    .catch(() => {
      // A blocked priming attempt is harmless. The regular fallback overlay
      // remains available when the first slideshow video is reached.
    })
    .finally(() => {
      slideshowVideoPriming = null;
    });

  return slideshowVideoPriming;
}

/**
 * Reads a persisted UI setting without allowing blocked or unavailable
 * Web Storage to abort the complete EverMoment initialization.
 */
function readStoredSetting(primaryKey, legacyKey, fallbackValue) {
  try {
    const primaryValue = localStorage.getItem(primaryKey);
    if (primaryValue !== null) return primaryValue;

    if (legacyKey && legacyKey !== primaryKey) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue !== null) return legacyValue;
    }
  } catch (error) {
    console.warn('EverMoment: Gespeicherte Einstellung konnte nicht gelesen werden.', error);
  }

  return fallbackValue;
}

const state = {
  media: [],
  music: [],
  index: 0,
  musicIndex: 0,
  mode: 'gallery',
  playing: false,
  slideTimer: null,
  uiTimer: null,
  fadeMs: Number(readStoredSetting('em_fade', 'em_fade', '900')),
  durationMs: Number(readStoredSetting('em_duration', 'em_duration', '8000')),
  kenBurns: readStoredSetting('em_ken', 'em_ken', '1') !== '0',
  blur: readStoredSetting('em_blur', 'em_blur', '1') !== '0',
  zoom: 1,
  panX: 0,
  panY: 0,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  panStartX: 0,
  panStartY: 0,
  activeLayer: null,
  introShown: false,
  galleryControlsHidden: readStoredSetting('em_gallery_controls_hidden', 'em_gallery_controls_hidden', '0') === '1',
  galleryIndexBeforeSlideshow: 0,
  activeMusicChannel: 0,
  crossfadeEnabled: readStoredSetting('em_music_crossfade_enabled', 'em_music_crossfade_enabled', '1') !== '0',
  crossfadeMs: Number(readStoredSetting('em_music_crossfade', 'em_music_crossfade', '5000')),
  crossfadeStarted: false,
  crossfadeRaf: null,
  musicResumeAfterVideo: false,
  musicBeforeVideo: null,
  videoMusicPauseActive: false,
  nowPlayingTimer: null,
  musicInfoDurationMs: Number(readStoredSetting('em_music_info_duration', 'em_music_info_duration', '6000')),
};


function setGalleryControlsHidden(hidden, persist = true) {
  state.galleryControlsHidden = Boolean(hidden);
  app.classList.toggle('gallery-controls-hidden', state.galleryControlsHidden);

  if (hideGalleryControlsBtn) {
    hideGalleryControlsBtn.setAttribute('aria-pressed', state.galleryControlsHidden ? 'true' : 'false');
  }
  if (showGalleryControlsBtn) {
    showGalleryControlsBtn.setAttribute('aria-pressed', state.galleryControlsHidden ? 'true' : 'false');
  }

  if (persist) {
    localStorage.setItem('em_gallery_controls_hidden', state.galleryControlsHidden ? '1' : '0');
  }
}

function safePlay(el, onBlocked = null) {
  let playPromise;

  try {
    playPromise = el.play();
  } catch (error) {
    if (typeof onBlocked === 'function') onBlocked(error);
    return null;
  }

  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(error => {
      if (typeof onBlocked === 'function') onBlocked(error);
    });
  }

  return playPromise;
}

function videoPreviewUrl(url) {
  if (!url) return url;
  return `${url}#t=0.001`;
}

function addVideoStartOverlay(layer, video) {
  if (layer.querySelector('.video-start-overlay')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-start-overlay';
  button.setAttribute('aria-label', 'Video starten');
  button.innerHTML = '<span class="video-start-icon">▶</span><span>Video starten</span>';

  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();

    pauseMusicForVideo();
    video.controls = true;
    layer.classList.remove('video-play-blocked');

    safePlay(video, () => {
      resumeMusicAfterVideo();
      layer.classList.add('video-play-blocked');
    });
  });

  layer.appendChild(button);
}

function setBlur(url) {
  if (!state.blur || !url) {
    blurLayer.classList.add('off');
    return;
  }
  blurLayer.classList.remove('off');
  blurLayer.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`;
}

function updateLabels() {
  const item = state.media[state.index];
  $('#filenameLabel').textContent = item ? item.name : '';
  $('#counterLabel').textContent = `${state.index + 1} / ${state.media.length}`;
  $('#slideCounter').textContent = `${state.index + 1} / ${state.media.length}`;
  $('#zoomLabel').textContent = `${Math.round(state.zoom * 100)} %`;
}

function applyZoom() {
  if (!state.activeLayer) return;
  const img = state.activeLayer.querySelector('img');
  if (!img) return;
  img.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
}

function resetZoom() {
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
  applyZoom();
  updateLabels();
}

function buildLayer(item) {
  const layer = document.createElement('div');
  layer.className = 'media-layer';
  layer.style.transitionDuration = `${state.fadeMs}ms`;

  let el;
  if (item.type === 'video') {
    layer.classList.add('video-layer');
    el = state.mode === 'slideshow' ? slideshowVideo : document.createElement('video');
    const targetVideoUrl = videoPreviewUrl(item.url);
    if (normalizedMediaUrl(el.currentSrc || el.src) !== normalizedMediaUrl(targetVideoUrl)) {
      el.src = targetVideoUrl;
      el.load();
    }
    el.preload = 'auto';
    el.controls = state.mode === 'gallery';
    el.playsInline = true;
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.setAttribute('controlslist', 'nodownload');
    el.onended = () => {
      if (state.mode === 'slideshow') {
        go(1, true);
      }
    };
    el.onplaying = () => {
      layer.classList.remove('video-play-blocked');
      layer.querySelector('.video-start-overlay')?.remove();
    };
    el.onpause = () => {
      if (state.mode === 'gallery' || el.ended) resumeMusicAfterVideo();
    };
  } else {
    el = document.createElement('img');
    el.src = item.url;
    el.alt = item.name;
    el.draggable = false;
  }
  layer.appendChild(el);
  return { layer, el };
}

function showIndex(index, autoplay = false) {
  if (!state.media.length) return;

  state.index = (index + state.media.length) % state.media.length;
  const item = state.media[state.index];
  resetZoom();

  const { layer, el } = buildLayer(item);
  mediaHost.appendChild(layer);

  const activate = () => {
    requestAnimationFrame(() => layer.classList.add('active'));

    if (state.activeLayer) {
      state.activeLayer.classList.remove('active');
      const old = state.activeLayer;
      setTimeout(() => {
        if (old.contains(slideshowVideo)) parkSlideshowVideo();
        old.remove();
      }, state.fadeMs + 80);
    }

    state.activeLayer = layer;

    if (item.type === 'image') {
      setBlur(item.url);
      if (state.mode === 'slideshow' && state.kenBurns) {
        const cls = `ken-${1 + Math.floor(Math.random() * 4)}`;
        layer.classList.add(cls);
        layer.style.setProperty('--ken-duration', `${state.durationMs}ms`);
      }
      if (state.mode === 'slideshow') {
        resumeMusicAfterVideo();
        scheduleNext();
      }
    } else {
      setBlur('');
      clearTimeout(state.slideTimer);
      if (state.mode === 'slideshow' || autoplay) {
        // iOS kann nicht zuverlässig zwei hörbare Media-Elemente gleichzeitig
        // umschalten. Deshalb wird die Musik vor dem Videostart pausiert.
        pauseMusicForVideo();
        el.controls = false;
        el.muted = false;
        el.volume = 1;
        safePlay(el, () => {
          // Wird der automatische Start von iOS blockiert, läuft die Musik
          // weiter und ein echter, direkt antippbarer Startknopf erscheint.
          resumeMusicAfterVideo();
          el.controls = true;
          layer.classList.add('video-play-blocked');
          addVideoStartOverlay(layer, el);
        });
      }
    }

    updateLabels();
    updateThumbs();
    centerActiveThumb();
  };

  if (item.type === 'image') {
    if (el.complete) activate();
    else {
      el.addEventListener('load', activate, { once: true });
      el.addEventListener('error', () => go(1, autoplay), { once: true });
    }
  } else {
    el.addEventListener('loadeddata', activate, { once: true });
    el.addEventListener('error', () => go(1, autoplay), { once: true });
    setTimeout(() => {
      if (!layer.classList.contains('active')) activate();
    }, 900);
  }
}

function go(delta, autoplay = false) {
  clearTimeout(state.slideTimer);
  showIndex(state.index + delta, autoplay);
}

function scheduleNext() {
  clearTimeout(state.slideTimer);
  if (state.mode !== 'slideshow' || !state.playing) return;
  state.slideTimer = setTimeout(() => go(1, true), state.durationMs);
}

function updateThumbs() {
  filmstrip.querySelectorAll('.thumb').forEach((btn, i) => {
    btn.classList.toggle('active', i === state.index);
  });
}

function centerActiveThumb() {
  const active = filmstrip.querySelector('.thumb.active');
  if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function createFilmstrip() {
  filmstrip.innerHTML = '';
  state.media.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.className = 'thumb';
    btn.type = 'button';
    btn.title = item.name;
    btn.addEventListener('click', () => showIndex(i));

    if (item.type === 'image') {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = item.url;
      img.alt = '';
      btn.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = videoPreviewUrl(item.url);
      vid.preload = 'auto';
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      btn.appendChild(vid);
      const badge = document.createElement('span');
      badge.className = 'thumb-badge';
      badge.textContent = 'VIDEO';
      btn.appendChild(badge);
    }
    filmstrip.appendChild(btn);
  });
}

async function enterSlideshow() {
  if (!state.media.length || state.mode === 'slideshow') return;

  state.galleryIndexBeforeSlideshow = state.index;
  state.mode = 'slideshow';
  state.playing = true;
  state.introShown = false;
  state.musicIndex = 0;
  isExitingSlideshow = false;

  clearTimeout(state.slideTimer);
  clearTimeout(state.uiTimer);
  clearTimeout(introTimer);
  pauseAllVideos(true);
  resetMusicToStart();

  // Start the iOS video authorization directly inside the user's click,
  // then wait until the inaudible priming playback has stopped. Starting the
  // music before this promise settles would let iOS interrupt it after one tone.
  const videoPrimingPromise = primeSlideshowVideo();

  app.classList.remove('gallery-mode');
  app.classList.add('slideshow-mode', 'ui-awake');
  slideshowControls.classList.add('visible');
  slideshowControls.setAttribute('aria-hidden', 'false');
  slideshowEmergencyExitBtn?.classList.add('visible');

  await videoPrimingPromise;
  startMusic(true);

  try {
    if (!document.fullscreenElement && app.requestFullscreen) {
      await app.requestFullscreen();
    }
  } catch (_) {
  }

  if (serverConfig?.intro?.enabled !== false) weddingIntro.classList.add('show');
  introTimer = setTimeout(() => {
    weddingIntro.classList.remove('show');
    showNowPlaying(state.music[0]);
    showIndex(state.galleryIndexBeforeSlideshow, true);
  }, Number(serverConfig?.intro?.duration || 4500));

  wakeUi();
}


function exitSlideshow() {
  if (state.mode !== 'slideshow' || isExitingSlideshow) return;
  isExitingSlideshow = true;

  state.mode = 'gallery';
  state.playing = false;
  clearTimeout(state.slideTimer);
  clearTimeout(state.uiTimer);
  clearTimeout(introTimer);
  introTimer = null;

  weddingIntro.classList.remove('show');
  hideNowPlaying();
  pauseAllVideos(true);
  parkSlideshowVideo();
  resetMusicToStart();

  app.classList.remove('slideshow-mode', 'ui-awake');
  app.classList.add('gallery-mode');
  slideshowControls.classList.remove('visible', 'hidden-ui');
  slideshowControls.setAttribute('aria-hidden', 'true');
  slideshowEmergencyExitBtn?.classList.remove('visible');

  const returnIndex = state.index;

  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }

  showIndex(returnIndex, false);
  window.setTimeout(() => { isExitingSlideshow = false; }, 250);
}

function wakeUi() {
  if (state.mode !== 'slideshow') return;
  app.classList.add('ui-awake');
  slideshowControls.classList.remove('hidden-ui');
  clearTimeout(state.uiTimer);
  state.uiTimer = setTimeout(() => {
    slideshowControls.classList.add('hidden-ui');
    app.classList.remove('ui-awake');
  }, 2600);
}

function pauseAllVideos(reset = false) {
  mediaHost.querySelectorAll('video').forEach(v => {
    v.pause();
    if (reset) {
      try { v.currentTime = 0; } catch (_) {}
    }
  });
}





async function fullyPreloadFirstMusic() {
  if (!state.music.length) return;

  try {
    await fetch(state.music[0].url, { cache: 'force-cache' });
  } catch (_) {
  }
}





function showNowPlaying(track) {
  clearTimeout(state.nowPlayingTimer);
  state.nowPlayingTimer = null;
  nowPlayingToast?.classList.remove('show');

  if (state.musicInfoDurationMs === 0) return;

  if (!track?.title || !track?.artist || !track?.cover || !nowPlayingToast) return;

  nowPlayingCover.src = track.cover;
  nowPlayingCover.alt = `Cover zu ${track.title}`;
  nowPlayingTitle.textContent = track.title;
  nowPlayingArtist.textContent = track.artist;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => nowPlayingToast.classList.add('show'));
  });

  if (state.musicInfoDurationMs > 0) {
    state.nowPlayingTimer = setTimeout(() => {
      nowPlayingToast.classList.remove('show');
      state.nowPlayingTimer = null;
    }, state.musicInfoDurationMs);
  }
}

function hideNowPlaying() {
  clearTimeout(state.nowPlayingTimer);
  state.nowPlayingTimer = null;
  nowPlayingToast?.classList.remove('show');
}

function getActiveMusicPlayer() {
  return musicPlayers[state.activeMusicChannel];
}

function getStandbyMusicPlayer() {
  return musicPlayers[1 - state.activeMusicChannel];
}

function getMasterVolume() {
  return Number($('#volumeRange')?.value ?? readStoredSetting('em_volume', 'em_volume', '0.65'));
}

function cancelCrossfade() {
  if (state.crossfadeRaf) {
    cancelAnimationFrame(state.crossfadeRaf);
    state.crossfadeRaf = null;
  }
  state.crossfadeStarted = false;
}

function setPlayerVolume(player, value) {
  player.volume = Math.max(0, Math.min(1, value));
}

function prepareMusicChannel(player, trackIndex, startAt = 0) {
  if (!state.music.length) return;
  const normalized = (trackIndex + state.music.length) % state.music.length;
  const url = state.music[normalized].url;

  player.dataset.trackIndex = String(normalized);

  if (!player.src || !player.src.endsWith(url)) {
    player.src = url;
    player.load();
  }

  const seek = () => {
    try { player.currentTime = startAt; } catch (_) {}
  };

  if (player.readyState >= 1) seek();
  else player.addEventListener('loadedmetadata', seek, { once: true });
}

function preloadFirstMusic() {
  if (!state.music.length) return;

  state.activeMusicChannel = 0;
  state.musicIndex = 0;

  prepareMusicChannel(musicPlayerA, 0, 0);
  prepareMusicChannel(musicPlayerB, state.music.length > 1 ? 1 : 0, 0);

  setPlayerVolume(musicPlayerA, getMasterVolume());
  setPlayerVolume(musicPlayerB, 0);
}

function preloadNextMusic() {
  if (!state.music.length) return;

  const active = getActiveMusicPlayer();
  const standby = getStandbyMusicPlayer();
  const activeIndex = Number(active.dataset.trackIndex ?? state.musicIndex);
  const nextIndex = (activeIndex + 1) % state.music.length;

  standby.pause();
  prepareMusicChannel(standby, nextIndex, 0);
  setPlayerVolume(standby, 0);
}

function startMusic(restart = false) {
  if (!state.music.length) return;

  const active = getActiveMusicPlayer();

  if (!active.src) {
    preloadFirstMusic();
  }

  if (restart) {
    state.activeMusicChannel = 0;
    state.musicIndex = 0;
    cancelCrossfade();

    musicPlayers.forEach(player => {
      player.pause();
      try { player.currentTime = 0; } catch (_) {}
      setPlayerVolume(player, 0);
    });

    prepareMusicChannel(musicPlayerA, 0, 0);
    setPlayerVolume(musicPlayerA, getMasterVolume());

    if (state.music.length > 1) {
      prepareMusicChannel(musicPlayerB, 1, 0);
      setPlayerVolume(musicPlayerB, 0);
    }
  }

  safePlay(getActiveMusicPlayer());
}

function resetMusicToStart() {
  cancelCrossfade();

  state.activeMusicChannel = 0;
  state.musicIndex = 0;
  state.musicResumeAfterVideo = false;
  state.musicBeforeVideo = null;
  state.videoMusicPauseActive = false;

  musicPlayers.forEach(player => {
    player.pause();
    try { player.currentTime = 0; } catch (_) {}
    setPlayerVolume(player, 0);
  });

  if (state.music.length) {
    prepareMusicChannel(musicPlayerA, 0, 0);
    setPlayerVolume(musicPlayerA, getMasterVolume());

    if (state.music.length > 1) {
      prepareMusicChannel(musicPlayerB, 1, 0);
      setPlayerVolume(musicPlayerB, 0);
    }
  }
}

function pauseMusicForVideo() {
  if (state.mode !== 'slideshow' || state.videoMusicPauseActive) return;

  const audiblePlayers = musicPlayers
    .map((player, channel) => ({
      player,
      channel,
      volume: player.volume,
      playing: !player.paused && !player.ended,
      trackIndex: Number(player.dataset.trackIndex ?? state.musicIndex),
      currentTime: Number.isFinite(player.currentTime) ? player.currentTime : 0,
    }))
    .filter(entry => entry.playing);

  state.musicResumeAfterVideo = audiblePlayers.length > 0;
  state.videoMusicPauseActive = true;

  if (!state.musicResumeAfterVideo) {
    state.musicBeforeVideo = null;
    musicPlayers.forEach(player => player.pause());
    return;
  }

  const selected = audiblePlayers.reduce((best, current) =>
    current.volume >= best.volume ? current : best
  );

  cancelCrossfade();

  state.activeMusicChannel = selected.channel;
  state.musicIndex = selected.trackIndex;
  state.musicBeforeVideo = {
    channel: selected.channel,
    trackIndex: selected.trackIndex,
    currentTime: selected.currentTime,
  };

  musicPlayers.forEach((player, channel) => {
    player.pause();

    if (channel === selected.channel) {
      setPlayerVolume(player, getMasterVolume());
    } else {
      setPlayerVolume(player, 0);
      try { player.currentTime = 0; } catch (_) {}
    }
  });
}

function resumeMusicAfterVideo() {
  if (
    state.mode !== 'slideshow' ||
    !state.videoMusicPauseActive
  ) {
    return;
  }

  const shouldResume = state.musicResumeAfterVideo;
  const snapshot = state.musicBeforeVideo;

  state.videoMusicPauseActive = false;
  state.musicResumeAfterVideo = false;
  state.musicBeforeVideo = null;

  if (!shouldResume || !snapshot || !state.music.length) return;

  state.activeMusicChannel = snapshot.channel;
  state.musicIndex = snapshot.trackIndex;

  const active = getActiveMusicPlayer();
  const standby = getStandbyMusicPlayer();
  const track = state.music[snapshot.trackIndex];

  if (!active.src || !active.src.endsWith(track.url)) {
    prepareMusicChannel(active, snapshot.trackIndex, snapshot.currentTime);
  } else {
    try { active.currentTime = snapshot.currentTime; } catch (_) {}
  }

  standby.pause();
  setPlayerVolume(standby, 0);
  setPlayerVolume(active, getMasterVolume());

  preloadNextMusic();
  safePlay(active);
}

function startMusicCrossfade() {
  if (
    !state.crossfadeEnabled ||
    state.crossfadeStarted ||
    state.music.length < 2 ||
    state.mode !== 'slideshow'
  ) {
    return;
  }

  const from = getActiveMusicPlayer();
  const to = getStandbyMusicPlayer();

  const fromIndex = Number(from.dataset.trackIndex ?? state.musicIndex);
  const toIndex = (fromIndex + 1) % state.music.length;

  prepareMusicChannel(to, toIndex, 0);
  setPlayerVolume(to, 0);

  const crossfadeDuration = Math.min(
    state.crossfadeMs,
    Number.isFinite(from.duration) && from.duration > 0
      ? Math.max(500, from.duration * 1000 * 0.45)
      : state.crossfadeMs
  );

  state.crossfadeStarted = true;
  state.musicIndex = toIndex;
  showNowPlaying(state.music[toIndex]);

  safePlay(to);

  const master = getMasterVolume();
  const start = performance.now();

  const step = now => {
    const progress = Math.min(1, (now - start) / crossfadeDuration);

    const fromGain = Math.cos(progress * Math.PI / 2);
    const toGain = Math.sin(progress * Math.PI / 2);

    setPlayerVolume(from, master * fromGain);
    setPlayerVolume(to, master * toGain);

    if (progress < 1) {
      state.crossfadeRaf = requestAnimationFrame(step);
      return;
    }

    from.pause();
    try { from.currentTime = 0; } catch (_) {}
    setPlayerVolume(from, 0);

    state.activeMusicChannel = 1 - state.activeMusicChannel;
    state.crossfadeStarted = false;
    state.crossfadeRaf = null;

    preloadNextMusic();
  };

  state.crossfadeRaf = requestAnimationFrame(step);
}

function monitorMusicForCrossfade(player) {
  if (
    player !== getActiveMusicPlayer() ||
    !state.crossfadeEnabled ||
    state.crossfadeStarted ||
    state.mode !== 'slideshow' ||
    player.paused ||
    !Number.isFinite(player.duration) ||
    player.duration <= 0
  ) {
    return;
  }

  const remaining = player.duration - player.currentTime;
  if (remaining <= state.crossfadeMs / 1000) {
    startMusicCrossfade();
  }
}

musicPlayers.forEach(player => {
  player.addEventListener('timeupdate', () => monitorMusicForCrossfade(player));

  player.addEventListener('ended', () => {
    if (player !== getActiveMusicPlayer()) return;

    if (!state.crossfadeStarted) {
      const old = player;
      const next = getStandbyMusicPlayer();
      const oldIndex = Number(old.dataset.trackIndex ?? state.musicIndex);
      const nextIndex = (oldIndex + 1) % Math.max(1, state.music.length);

      prepareMusicChannel(next, nextIndex, 0);
      setPlayerVolume(next, getMasterVolume());
      state.musicIndex = nextIndex;
      state.activeMusicChannel = 1 - state.activeMusicChannel;
      showNowPlaying(state.music[nextIndex]);
      safePlay(next);

      old.pause();
      try { old.currentTime = 0; } catch (_) {}
      setPlayerVolume(old, 0);
      preloadNextMusic();
    }
  });
});


function togglePlay() {
  if (state.mode !== 'slideshow') return;
  state.playing = !state.playing;
  $('#playPauseBtn').textContent = state.playing ? 'Ⅱ' : '▶';
  const video = state.activeLayer?.querySelector('video');
  if (video) {
    if (state.playing) safePlay(video);
    else video.pause();
  } else {
    if (state.playing) scheduleNext();
    else clearTimeout(state.slideTimer);
  }
}

function adjustZoom(delta) {
  if (state.mode !== 'gallery') return;
  const item = state.media[state.index];
  if (!item || item.type !== 'image') return;
  state.zoom = Math.min(5, Math.max(1, state.zoom + delta));
  if (state.zoom === 1) {
    state.panX = 0;
    state.panY = 0;
  }
  applyZoom();
  updateLabels();
}


function syncMusicCrossfadeSettingsUi() {
  const checkbox = $('#musicCrossfadeCheck');
  const select = $('#musicCrossfadeSelect');
  if (!checkbox || !select) return;

  select.disabled = !checkbox.checked;
  select.setAttribute('aria-disabled', checkbox.checked ? 'false' : 'true');
}


async function fetchJson(url, options = {}) {
  const response = await fetch(url, {cache:'no-store', ...options});
  const text = await response.text(); let data={};
  try {
    data=JSON.parse(text);
  } catch (_) {
    const detail=text.trim().replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,180);
    throw new Error(`Serverantwort ungültig (HTTP ${response.status})${detail ? `: ${detail}` : ''}`);
  }
  if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

let toastTimer=null;
function showToast(message,type='success'){
  if(!appToast)return;
  clearTimeout(toastTimer);
  appToast.textContent=message;
  appToast.dataset.type=type;
  appToast.classList.add('show');
  toastTimer=setTimeout(()=>appToast.classList.remove('show'),2600);
}
function setFormMessage(el,message='',type=''){if(!el)return;el.textContent=message;el.dataset.type=type;}
function logoUrl(config=serverConfig){return config?.branding?.logo?`branding-logo.php?v=${encodeURIComponent(config.branding.logo)}&t=${Date.now()}`:'';}
function updateBrandingPreview(){
  const logo=$('#brandingPreviewLogo');
  const title=$('#brandingPreviewTitle');
  const subtitle=$('#brandingPreviewSubtitle');
  if(!logo || !title || !subtitle) return;

  title.textContent=$('#cfgBrandTitle')?.value||'';
  subtitle.textContent=$('#cfgBrandSubtitle')?.value||'';
  if(pendingLogoFile){
    const url=URL.createObjectURL(pendingLogoFile);
    logo.onload=()=>URL.revokeObjectURL(url);
    logo.src=url;logo.hidden=false;title.hidden=true;
  }else if(serverConfig?.branding?.logo){
    logo.src=logoUrl();logo.hidden=false;title.hidden=true;
  }else{
    logo.removeAttribute('src');logo.hidden=true;title.hidden=false;
  }
}
function showRecoveryKey(key){
  currentRecoveryKey=key;
  $('#recoveryKeyDisplay').textContent=key;
  $('#recoveryKeyConfirmed').checked=false;
  $('#closeRecoveryKeyBtn').disabled=true;
  recoveryKeyDialog.showModal();
}

function applyServerConfig(config) {
  serverConfig=config;
  const hasLogo=Boolean(config.branding.logo);
  $('#brandTitle').textContent=config.branding.title;
  $('#brandTitle').hidden=hasLogo;
  $('#brandSubtitle').textContent=config.branding.subtitle;
  if(hasLogo){
    $('#brandLogo').src=logoUrl(config);
    $('#brandLogo').alt=config.branding.title||'Logo';
    $('#brandLogo').hidden=false;
  }else{
    $('#brandLogo').removeAttribute('src');
    $('#brandLogo').hidden=true;
  }
  document.title=config.branding.title||'EverMoment';
  $('#introTitle').textContent=config.intro.title;
  $('#introSubtitle').textContent=config.intro.subtitle;
  $('#introLine3').textContent=config.intro.line3;
  const expired=config.uploads.openUntil && Date.now()>Date.parse(config.uploads.openUntil);
  const visible=config.uploads.enabled&&!expired;
  uploadBtn.textContent='＋ '+config.uploads.buttonLabel;
  uploadBtn.hidden=!visible;
  mobileUploadBtn.hidden=!visible;
  mobileUploadBtn.title=config.uploads.buttonLabel;
  mobileUploadBtn.setAttribute('aria-label',config.uploads.buttonLabel);
}
function showGreeting() {
  const g=serverConfig?.greeting; if(!g?.enabled) return;
  if(g.firstVisitOnly && sessionStorage.getItem('em_greeting_seen')==='1') return;
  $('#greetingTitle').textContent=g.title; $('#greetingText').textContent=g.text;
  guestGreeting.classList.add('show'); guestGreeting.setAttribute('aria-hidden','false');
  sessionStorage.setItem('em_greeting_seen','1');
  setTimeout(()=>{guestGreeting.classList.remove('show');guestGreeting.setAttribute('aria-hidden','true');},Number(g.duration||4000));
}
async function reloadMediaAfterUpload() {
  const data=await fetchJson(`media.php?_=${Date.now()}`); state.media=Array.isArray(data.media)?data.media:[]; state.music=Array.isArray(data.music)?data.music:[]; createFilmstrip(); showIndex(Math.max(0,state.media.length-1));
}
async function uploadSelectedFiles() {
  const files=[...$('#uploadFiles').files]; if(!files.length) return;
  $('#startUploadBtn').disabled=true; let done=0; const names=[];
  for(const file of files){
    $('#uploadStatus').textContent=`Datei ${done+1} von ${files.length}: ${file.name}`;
    const form=new FormData(); form.append('file',file);
    const result=await fetchJson('upload-api.php',{method:'POST',body:form}); names.push(result.name); done++; $('#uploadProgress').value=Math.round(done/files.length*100);
  }
  $('#uploadStatus').textContent=`${done} Medien wurden hochgeladen.`; $('#startUploadBtn').disabled=false; await reloadMediaAfterUpload();
}
function fillSystemForm(c){
  $('#cfgBrandTitle').value=c.branding.title;
  $('#cfgBrandSubtitle').value=c.branding.subtitle;
  pendingLogoFile=null;
  $('#cfgBrandLogoFile').value='';
  $('#brandLogoStatus').textContent=c.branding.logo?'Logo vorhanden':'Kein Logo hinterlegt';
  $('#cfgIntroEnabled').checked=c.intro.enabled;
  $('#cfgIntroTitle').value=c.intro.title;
  $('#cfgIntroSubtitle').value=c.intro.subtitle;
  $('#cfgIntroLine3').value=c.intro.line3;
  $('#cfgIntroDuration').value=String(c.intro.duration);
  $('#cfgGreetingEnabled').checked=c.greeting.enabled;
  $('#cfgGreetingTitle').value=c.greeting.title;
  $('#cfgGreetingText').value=c.greeting.text;
  $('#cfgGreetingDuration').value=String(c.greeting.duration);
  $('#cfgGreetingFirstOnly').checked=c.greeting.firstVisitOnly;
  $('#cfgUploadEnabled').checked=c.uploads.enabled;
  $('#cfgUploadLabel').value=c.uploads.buttonLabel;
  $('#cfgUploadMax').value=c.uploads.maxFileSizeMb;
  $('#cfgUploadUntil').value=c.uploads.openUntil||'';
  $('#cfgGalleryUrl').value=c.qr.galleryUrl||location.href.split('#')[0];
  updateBrandingPreview();
}
function collectSystemForm(){
  return {
    branding:{title:$('#cfgBrandTitle').value,subtitle:$('#cfgBrandSubtitle').value,logo:serverConfig?.branding?.logo||''},
    intro:{enabled:$('#cfgIntroEnabled').checked,title:$('#cfgIntroTitle').value,subtitle:$('#cfgIntroSubtitle').value,line3:$('#cfgIntroLine3').value,duration:Number($('#cfgIntroDuration').value)},
    greeting:{enabled:$('#cfgGreetingEnabled').checked,title:$('#cfgGreetingTitle').value,text:$('#cfgGreetingText').value,duration:Number($('#cfgGreetingDuration').value),firstVisitOnly:$('#cfgGreetingFirstOnly').checked},
    uploads:{enabled:$('#cfgUploadEnabled').checked,buttonLabel:$('#cfgUploadLabel').value,maxFileSizeMb:Number($('#cfgUploadMax').value),openUntil:$('#cfgUploadUntil').value,allowedExtensions:serverConfig.uploads.allowedExtensions},
    qr:{galleryUrl:$('#cfgGalleryUrl').value}
  };
}
async function openSystemSettings(){
  systemDialog.showModal();
  $('#systemEditorPanel').hidden=true;
  $('#systemAuthPanel').hidden=false;
  $('#systemPassword').value='';
  $('#systemPasswordConfirm').value='';
  setFormMessage($('#systemAuthMessage'));
  const st=await fetchJson('system-api.php?action=status');
  const configured=Boolean(st.configured);
  $('#systemAuthHint').textContent=configured?'Bitte gib das Administratorpasswort ein.':'Ersteinrichtung: Lege jetzt ein Administratorpasswort fest.';
  $('#systemLoginBtn').textContent=configured?'Öffnen':'Initiales Passwort setzen';
  $('#systemLoginBtn').dataset.configured=configured?'1':'0';
  $('#systemPasswordConfirmRow').hidden=configured;
  $('#forgotPasswordBtn').hidden=!configured;
  if(st.authenticated){
    const d=await fetchJson('system-api.php?action=get');
    systemCsrf=d.csrf;
    fillSystemForm(d.config);
    $('#systemAuthPanel').hidden=true;
    $('#systemEditorPanel').hidden=false;
    await loadMusicAdmin();
  }
}
async function systemLogin(){
  const configured=$('#systemLoginBtn').dataset.configured==='1';
  const password=$('#systemPassword').value;
  setFormMessage($('#systemAuthMessage'));
  if(!configured&&password!==$('#systemPasswordConfirm').value)throw new Error('Die Passwörter stimmen nicht überein.');
  const action=configured?'login':'setup';
  const d=await fetchJson(`system-api.php?action=${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
  systemCsrf=d.csrf;
  const g=await fetchJson('system-api.php?action=get');
  fillSystemForm(g.config);
  $('#systemAuthPanel').hidden=true;
  $('#systemEditorPanel').hidden=false;
  await loadMusicAdmin();
  if(d.recoveryKey)showRecoveryKey(d.recoveryKey);
}
async function uploadBrandLogoIfNeeded(){
  if(!pendingLogoFile)return null;
  const form=new FormData();
  form.append('csrf',systemCsrf);
  form.append('logo',pendingLogoFile);
  const d=await fetchJson('logo-api.php?action=upload',{method:'POST',body:form});
  pendingLogoFile=null;
  serverConfig=d.config;
  return d.config;
}
async function removeBrandLogo(){
  const form=new FormData();
  form.append('csrf',systemCsrf);
  const d=await fetchJson('logo-api.php?action=delete',{method:'POST',body:form});
  serverConfig=d.config;
  fillSystemForm(d.config);
  applyServerConfig(d.config);
  showToast('Logo entfernt.');
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function escapeText(value) {
  return String(value ?? '');
}

function renderMusicAdminList(tracks) {
  musicAdminTracks = Array.isArray(tracks) ? tracks : [];
  musicAdminList.innerHTML = '';

  if (!musicAdminTracks.length) {
    const empty = document.createElement('div');
    empty.className = 'music-admin-empty';
    empty.textContent = 'Noch keine Musik vorhanden.';
    musicAdminList.appendChild(empty);
    return;
  }

  musicAdminTracks.forEach((track, index) => {
    const row = document.createElement('article');
    row.className = 'music-admin-row';
    row.draggable = true;
    row.dataset.name = track.name;

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'music-drag-handle';
    handle.title = 'Zum Sortieren ziehen';
    handle.setAttribute('aria-label', `${track.name} verschieben`);
    handle.textContent = '⋮⋮';

    const cover = document.createElement('div');
    cover.className = 'music-admin-cover';
    if (track.cover) {
      const img = document.createElement('img');
      img.src = track.cover;
      img.alt = '';
      cover.appendChild(img);
    } else {
      cover.textContent = '♪';
    }

    const copy = document.createElement('div');
    copy.className = 'music-admin-copy';

    const title = document.createElement('strong');
    title.textContent = track.title || 'Kein ID3-Titel';

    const artist = document.createElement('span');
    artist.textContent = track.artist || 'Kein Interpret';

    const meta = document.createElement('small');
    meta.textContent = `${track.name} · ${formatBytes(track.size)}`;

    copy.append(title, artist, meta);

    const actions = document.createElement('div');
    actions.className = 'music-admin-actions';

    const listen = document.createElement('button');
    listen.type = 'button';
    listen.textContent = 'Anhören';
    listen.addEventListener('click', () => {
      musicAdminPreview.src = track.url;
      musicAdminPreview.play().catch(() => {});
      row.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    });

    const replace = document.createElement('button');
    replace.type = 'button';
    replace.textContent = 'Ersetzen';
    replace.addEventListener('click', () => {
      musicAdminReplaceName = track.name;
      musicAdminReplaceInput.value = '';
      musicAdminReplaceInput.click();
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger-button';
    remove.textContent = 'Löschen';
    remove.addEventListener('click', async () => {
      const label = track.title || track.name;
      if (!confirm(`„${label}“ wirklich löschen? Die übrigen Titel werden neu nummeriert.`)) return;
      try {
        setFormMessage($('#musicAdminMessage'), 'Titel wird gelöscht …');
        const data = await fetchJson('music-admin-api.php?action=delete', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({csrf: systemCsrf, name: track.name})
        });
        renderMusicAdminList(data.tracks);
        await refreshMusicPlaylist();
        showToast('Musiktitel gelöscht.');
        setFormMessage($('#musicAdminMessage'));
      } catch (error) {
        setFormMessage($('#musicAdminMessage'), error.message, 'error');
      }
    });

    actions.append(listen, replace, remove);
    row.append(handle, cover, copy, actions);

    row.addEventListener('dragstart', event => {
      musicAdminDraggedName = track.name;
      row.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', track.name);
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      musicAdminList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    row.addEventListener('dragover', event => {
      event.preventDefault();
      if (track.name !== musicAdminDraggedName) row.classList.add('drag-over');
    });

    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));

    row.addEventListener('drop', async event => {
      event.preventDefault();
      row.classList.remove('drag-over');

      const from = musicAdminTracks.findIndex(item => item.name === musicAdminDraggedName);
      const to = musicAdminTracks.findIndex(item => item.name === track.name);
      if (from < 0 || to < 0 || from === to) return;

      const order = [...musicAdminTracks];
      const [moved] = order.splice(from, 1);
      order.splice(to, 0, moved);

      try {
        setFormMessage($('#musicAdminMessage'), 'Reihenfolge wird gespeichert …');
        const data = await fetchJson('music-admin-api.php?action=reorder', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({csrf: systemCsrf, order: order.map(item => item.name)})
        });
        renderMusicAdminList(data.tracks);
        await refreshMusicPlaylist();
        showToast('Musikreihenfolge gespeichert.');
        setFormMessage($('#musicAdminMessage'));
      } catch (error) {
        setFormMessage($('#musicAdminMessage'), error.message, 'error');
        await loadMusicAdmin();
      }
    });

    musicAdminList.appendChild(row);
  });
}

async function loadMusicAdmin() {
  if (!systemCsrf) return;
  setFormMessage($('#musicAdminMessage'), 'Musikliste wird geladen …');
  const data = await fetchJson(`music-admin-api.php?action=list&_=${Date.now()}`);
  renderMusicAdminList(data.tracks);
  const limits = data.limits || {};
  $('#musicAdminLimits').textContent =
    `Serverlimit pro Upload: ${limits.uploadMax || 'unbekannt'} · POST-Limit: ${limits.postMax || 'unbekannt'}`;
  setFormMessage($('#musicAdminMessage'));
}

async function refreshMusicPlaylist() {
  musicPlayers.forEach(player => {
    player.pause();
    player.removeAttribute('src');
    player.load();
  });

  const data = await fetchJson(`media.php?_=${Date.now()}`);
  state.music = Array.isArray(data.music) ? data.music : [];
  resetMusicToStart();
  preloadFirstMusic();
}

async function uploadMusicAdminFiles() {
  const files = [...(musicAdminFiles.files || [])];
  if (!files.length) throw new Error('Bitte mindestens eine MP3 auswählen.');

  const button = $('#musicAdminUploadBtn');
  button.disabled = true;
  $('#musicAdminProgress').value = 5;
  setFormMessage($('#musicAdminMessage'), `${files.length} Titel werden hochgeladen …`);

  const form = new FormData();
  form.append('csrf', systemCsrf);
  files.forEach(file => form.append('tracks[]', file));

  try {
    const data = await fetchJson('music-admin-api.php?action=upload', {
      method: 'POST',
      body: form
    });
    $('#musicAdminProgress').value = 100;
    musicAdminFiles.value = '';
    renderMusicAdminList(data.tracks);
    await refreshMusicPlaylist();
    showToast(`${files.length} Musiktitel hinzugefügt.`);
    setFormMessage($('#musicAdminMessage'), 'Upload abgeschlossen.', 'success');
    setTimeout(() => {
      $('#musicAdminProgress').value = 0;
      setFormMessage($('#musicAdminMessage'));
    }, 1800);
  } finally {
    button.disabled = false;
  }
}

async function replaceMusicAdminFile(file) {
  if (!musicAdminReplaceName || !file) return;

  const form = new FormData();
  form.append('csrf', systemCsrf);
  form.append('name', musicAdminReplaceName);
  form.append('track', file);

  setFormMessage($('#musicAdminMessage'), `${musicAdminReplaceName} wird ersetzt …`);

  const data = await fetchJson('music-admin-api.php?action=replace', {
    method: 'POST',
    body: form
  });

  renderMusicAdminList(data.tracks);
  await refreshMusicPlaylist();
  musicAdminReplaceName = '';
  showToast('Musiktitel ersetzt.');
  setFormMessage($('#musicAdminMessage'));
}


function generateQr(){ const url=$('#cfgGalleryUrl').value.trim(); if(!url)return; const encoded=encodeURIComponent(url); const png=`https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&data=${encoded}`; const svg=`https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=svg&data=${encoded}`; $('#qrPreview').innerHTML=`<img src="${png}" alt="QR-Code">`; $('#qrPngLink').href=png; $('#qrSvgLink').href=svg; }

function installEvents() {
  prevBtn.addEventListener('click', e => { e.stopPropagation(); go(-1); });
  nextBtn.addEventListener('click', e => { e.stopPropagation(); go(1); });
  settingsBtn.addEventListener('click', e => {
    e.stopPropagation();
    syncMusicCrossfadeSettingsUi();
    $('#settingsDialog').showModal();
  });

  $('#musicCrossfadeCheck')?.addEventListener('change', syncMusicCrossfadeSettingsUi);
  slideshowBtn.addEventListener('click', e => { e.stopPropagation(); enterSlideshow(); });
  if (hideGalleryControlsBtn) {
    hideGalleryControlsBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      setGalleryControlsHidden(true);
    });
  }

  if (showGalleryControlsBtn) {
    showGalleryControlsBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      setGalleryControlsHidden(false);
    });
  }

  $('#slidePrevBtn').addEventListener('click', () => go(-1, true));
  $('#slideNextBtn').addEventListener('click', () => go(1, true));
  $('#playPauseBtn').addEventListener('click', togglePlay);
  const exitSlideshowBtn = $('#exitSlideshowBtn');
  if (exitSlideshowBtn) {
    exitSlideshowBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      exitSlideshow();
    });
  }

  if (slideshowEmergencyExitBtn) {
    slideshowEmergencyExitBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      exitSlideshow();
    });
  }

  $('#zoomOutBtn').addEventListener('click', () => adjustZoom(-0.25));
  $('#zoomInBtn').addEventListener('click', () => adjustZoom(0.25));
  $('#zoomResetBtn').addEventListener('click', resetZoom);

  $('#volumeRange').addEventListener('input', e => {
    const value = Number(e.target.value);
    localStorage.setItem('em_volume', String(value));

    if (state.crossfadeStarted) {
    } else {
      setPlayerVolume(getActiveMusicPlayer(), value);
      setPlayerVolume(getStandbyMusicPlayer(), 0);
    }
  });

  $('#muteBtn').addEventListener('click', () => {
    const newMuted = !musicPlayers.every(player => player.muted);
    musicPlayers.forEach(player => { player.muted = newMuted; });
    $('#muteBtn').textContent = newMuted ? '🔇' : '🔊';
  });

  filmstrip.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      filmstrip.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  stage.addEventListener('wheel', e => {
    if (state.mode === 'gallery' && state.media[state.index]?.type === 'image') {
      e.preventDefault();
      adjustZoom(e.deltaY < 0 ? 0.15 : -0.15);
    }
  }, { passive: false });

  stage.addEventListener('dblclick', () => {
    if (state.mode === 'gallery') {
      state.zoom = state.zoom > 1 ? 1 : 2;
      if (state.zoom === 1) { state.panX = 0; state.panY = 0; }
      applyZoom();
      updateLabels();
    }
  });

  stage.addEventListener('pointerdown', e => {
    if (state.mode === 'slideshow') {
      wakeUi();
      slideshowTouchStartX = e.clientX;
      slideshowTouchStartY = e.clientY;
      slideshowTouchActive = e.pointerType === 'touch' || e.pointerType === 'pen';
      return;
    }
    if (state.mode !== 'gallery' || state.zoom <= 1) return;
    state.dragging = true;
    state.dragStartX = e.clientX;
    state.dragStartY = e.clientY;
    state.panStartX = state.panX;
    state.panStartY = state.panY;
    stage.setPointerCapture(e.pointerId);
  });

  stage.addEventListener('pointermove', e => {
    if (state.mode === 'slideshow') wakeUi();
    if (!state.dragging) return;
    state.panX = state.panStartX + e.clientX - state.dragStartX;
    state.panY = state.panStartY + e.clientY - state.dragStartY;
    applyZoom();
  });

  stage.addEventListener('pointerup', e => {
    if (state.mode === 'slideshow' && slideshowTouchActive) {
      const deltaX = e.clientX - slideshowTouchStartX;
      const deltaY = e.clientY - slideshowTouchStartY;
      slideshowTouchActive = false;
      if (deltaY >= 90 && Math.abs(deltaY) > Math.abs(deltaX) * 1.35) {
        exitSlideshow();
      } else {
        wakeUi();
      }
      return;
    }
    state.dragging = false;
    try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
  });

  stage.addEventListener('pointercancel', () => {
    slideshowTouchActive = false;
    state.dragging = false;
  });


  stage.addEventListener('touchstart', e => {
    if (state.mode !== 'slideshow' || e.touches.length !== 1) return;
    slideshowTouchStartX = e.touches[0].clientX;
    slideshowTouchStartY = e.touches[0].clientY;
    slideshowTouchActive = true;
    wakeUi();
  }, { passive: true });

  stage.addEventListener('touchend', e => {
    if (state.mode !== 'slideshow' || !slideshowTouchActive || !e.changedTouches.length) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - slideshowTouchStartX;
    const deltaY = touch.clientY - slideshowTouchStartY;
    slideshowTouchActive = false;

    if (deltaY >= 70 && Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
      exitSlideshow();
    } else {
      wakeUi();
    }
  }, { passive: true });

  stage.addEventListener('touchcancel', () => {
    slideshowTouchActive = false;
  }, { passive: true });


  const openUploadDialog=()=>uploadDialog.showModal();
  uploadBtn?.addEventListener('click',openUploadDialog);
  mobileUploadBtn?.addEventListener('click',openUploadDialog);
  $('#uploadFiles')?.addEventListener('change',e=>{$('#uploadSummary').textContent=e.target.files.length?`${e.target.files.length} Dateien ausgewählt`:'Keine Dateien ausgewählt';});
  $('#startUploadBtn')?.addEventListener('click',()=>uploadSelectedFiles().catch(e=>{$('#uploadStatus').textContent=e.message;$('#startUploadBtn').disabled=false;}));

  $('#systemSettingsBtn')?.addEventListener('click',e=>{e.preventDefault();$('#settingsDialog').close();openSystemSettings().catch(e=>showToast(e.message,'error'));});
  $('#systemLoginBtn')?.addEventListener('click',()=>systemLogin().catch(e=>setFormMessage($('#systemAuthMessage'),e.message,'error')));
  $('#systemPassword')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#systemLoginBtn').click();}});
  $('#systemPasswordConfirm')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#systemLoginBtn').click();}});

  $('#forgotPasswordBtn')?.addEventListener('click',()=>{setFormMessage($('#recoveryMessage'));passwordRecoveryDialog.showModal();});
  $('#resetPasswordBtn')?.addEventListener('click',async()=>{
    try{
      const password=$('#recoveryNewPassword').value;
      if(password!==$('#recoveryNewPasswordConfirm').value)throw new Error('Die Passwörter stimmen nicht überein.');
      const d=await fetchJson('system-api.php?action=reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recoveryKey:$('#recoveryKey').value,newPassword:password})});
      systemCsrf=d.csrf;
      passwordRecoveryDialog.close();
      systemDialog.close();
      showRecoveryKey(d.recoveryKey);
      showToast('Passwort wurde zurückgesetzt.');
    }catch(e){setFormMessage($('#recoveryMessage'),e.message,'error');}
  });

  $('#cfgBrandTitle')?.addEventListener('input',updateBrandingPreview);
  $('#cfgBrandSubtitle')?.addEventListener('input',updateBrandingPreview);
  $('#cfgBrandLogoFile')?.addEventListener('change',e=>{pendingLogoFile=e.target.files?.[0]||null;$('#brandLogoStatus').textContent=pendingLogoFile?pendingLogoFile.name:'';updateBrandingPreview();});
  $('#removeBrandLogoBtn')?.addEventListener('click',()=>removeBrandLogo().catch(e=>showToast(e.message,'error')));

  $('#saveSystemBtn')?.addEventListener('click',async()=>{
    const button=$('#saveSystemBtn'), original=button.textContent;
    try{
      button.disabled=true;button.textContent='Speichert …';setFormMessage($('#systemMessage'));
      const d=await fetchJson('system-api.php?action=save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrf:systemCsrf,config:collectSystemForm()})});
      serverConfig=d.config;
      const logoConfig=await uploadBrandLogoIfNeeded();
      const finalConfig=logoConfig||d.config;
      applyServerConfig(finalConfig);
      fillSystemForm(finalConfig);
      button.textContent='✓ Gespeichert';
      showToast('Systemeinstellungen gespeichert.');
      setTimeout(()=>{button.textContent=original;button.disabled=false;},1800);
    }catch(e){
      button.textContent=original;button.disabled=false;
      setFormMessage($('#systemMessage'),e.message,'error');
      showToast(e.message,'error');
    }
  });

  $('#changePasswordBtn')?.addEventListener('click',async()=>{
    try{
      const password=$('#newPassword').value;
      if(password!==$('#newPasswordConfirm').value)throw new Error('Die neuen Passwörter stimmen nicht überein.');
      await fetchJson('system-api.php?action=change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrf:systemCsrf,currentPassword:$('#currentPassword').value,newPassword:password})});
      $('#currentPassword').value='';$('#newPassword').value='';$('#newPasswordConfirm').value='';
      showToast('Passwort geändert.');
    }catch(e){setFormMessage($('#systemMessage'),e.message,'error');}
  });

  $('#recoveryKeyConfirmed')?.addEventListener('change',e=>{$('#closeRecoveryKeyBtn').disabled=!e.target.checked;});
  $('#closeRecoveryKeyBtn')?.addEventListener('click',()=>{
    recoveryKeyDialog.close();
    if(systemDialog.open){$('#systemAuthPanel').hidden=true;$('#systemEditorPanel').hidden=false;}
    else openSystemSettings().catch(e=>showToast(e.message,'error'));
  });
  $('#copyRecoveryKeyBtn')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentRecoveryKey);showToast('Recovery-Key kopiert.');}catch(_){showToast('Kopieren nicht möglich.','error');}});
  $('#downloadRecoveryKeyBtn')?.addEventListener('click',()=>{
    const blob=new Blob([`EverMoment Recovery-Key\n\n${currentRecoveryKey}\n\nBitte sicher aufbewahren.`],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='evermoment-recovery-key.txt';a.click();URL.revokeObjectURL(url);
  });
  $('#printRecoveryKeyBtn')?.addEventListener('click',()=>{
    const win=window.open('','_blank','width=700,height=500');if(!win)return;
    win.document.write(`<title>EverMoment Recovery-Key</title><style>body{font-family:Arial;padding:50px;text-align:center}code{display:block;font-size:28px;letter-spacing:2px;padding:30px;border:2px solid #222;margin:30px auto;max-width:600px;word-break:break-word}</style><h1>EverMoment Recovery-Key</h1><p>Bitte sicher aufbewahren.</p><code>${currentRecoveryKey}</code>`);
    win.document.close();win.print();
  });

  $('#musicAdminUploadBtn')?.addEventListener('click', () => {
    uploadMusicAdminFiles().catch(error => {
      setFormMessage($('#musicAdminMessage'), error.message, 'error');
      $('#musicAdminUploadBtn').disabled = false;
    });
  });

  musicAdminFiles?.addEventListener('change', () => {
    const count = musicAdminFiles.files?.length || 0;
    setFormMessage(
      $('#musicAdminMessage'),
      count ? `${count} MP3-Datei${count === 1 ? '' : 'en'} ausgewählt.` : ''
    );
  });

  musicAdminReplaceInput?.addEventListener('change', () => {
    const file = musicAdminReplaceInput.files?.[0];
    replaceMusicAdminFile(file).catch(error => {
      setFormMessage($('#musicAdminMessage'), error.message, 'error');
    });
  });

  $('#generateQrBtn')?.addEventListener('click',generateQr);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.mode === 'slideshow') {
      e.preventDefault();
      exitSlideshow();
      return;
    }
    if (e.key === 'ArrowLeft') go(-1, state.mode === 'slideshow');
    if (e.key === 'ArrowRight') go(1, state.mode === 'slideshow');
    if (e.key === ' ' && state.mode === 'slideshow') {
      e.preventDefault();
      togglePlay();
    }
    if (e.key.toLowerCase() === 'f') {
      state.mode === 'slideshow' ? exitSlideshow() : enterSlideshow();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && state.mode === 'slideshow' && !isExitingSlideshow) exitSlideshow();
  });

  $('#saveSettingsBtn').addEventListener('click', () => {
    state.durationMs = Number($('#durationSelect').value);
    state.fadeMs = Number($('#fadeSelect').value);
    state.kenBurns = $('#kenBurnsCheck').checked;
    state.blur = $('#blurCheck').checked;
    state.crossfadeEnabled = $('#musicCrossfadeCheck').checked;
    state.crossfadeMs = Number($('#musicCrossfadeSelect').value);
    state.musicInfoDurationMs = Number($('#musicInfoDurationSelect').value);

    localStorage.setItem('em_duration', String(state.durationMs));
    localStorage.setItem('em_fade', String(state.fadeMs));
    localStorage.setItem('em_ken', state.kenBurns ? '1' : '0');
    localStorage.setItem('em_blur', state.blur ? '1' : '0');
    localStorage.setItem('em_music_crossfade_enabled', state.crossfadeEnabled ? '1' : '0');
    localStorage.setItem('em_music_crossfade', String(state.crossfadeMs));
    localStorage.setItem('em_music_info_duration', String(state.musicInfoDurationMs));

    if (state.musicInfoDurationMs === 0) {
      hideNowPlaying();
    }

    syncMusicCrossfadeSettingsUi();
    if (!state.blur) blurLayer.classList.add('off');
    else setBlur(state.media[state.index]?.type === 'image' ? state.media[state.index].url : '');
  });
}

async function init() {
  installEvents();
  try { const c=await fetchJson(`config-api.php?_=${Date.now()}`); applyServerConfig(c.config); showGreeting(); } catch(e) { }
  setGalleryControlsHidden(state.galleryControlsHidden, false);

  $('#durationSelect').value = String(state.durationMs);
  $('#fadeSelect').value = String(state.fadeMs);
  $('#kenBurnsCheck').checked = state.kenBurns;
  $('#blurCheck').checked = state.blur;
  $('#musicCrossfadeCheck').checked = state.crossfadeEnabled;
  $('#musicCrossfadeSelect').value = String(state.crossfadeMs);
  $('#musicInfoDurationSelect').value = String(state.musicInfoDurationMs);
  syncMusicCrossfadeSettingsUi();

  const savedVolume = Number(readStoredSetting('em_volume', 'em_volume', '0.65'));
  $('#volumeRange').value = String(savedVolume);
  setPlayerVolume(musicPlayerA, savedVolume);
  setPlayerVolume(musicPlayerB, 0);

  try {
    const response = await fetch(`media.php?_=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`media.php antwortet mit HTTP ${response.status}`);
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      throw new Error('media.php liefert kein gültiges JSON', { cause: jsonError });
    }
    state.media = Array.isArray(data.media) ? data.media : [];
    state.music = Array.isArray(data.music) ? data.music : [];

    if (state.music.length) {
      preloadFirstMusic();
      state.musicPreloadPromise = fullyPreloadFirstMusic();
    }

    if (!state.media.length) {
      mediaHost.innerHTML = '<div style="position:relative;z-index:5;background:rgba(0,0,0,.7);padding:24px;border-radius:12px">Keine Medien in <code>public/img</code> gefunden.</div>';
      updateLabels();
      return;
    }

    createFilmstrip();
    showIndex(0);
  } catch (error) {
    mediaHost.innerHTML = '<div style="position:relative;z-index:5;background:rgba(80,0,0,.75);padding:24px;border-radius:12px"><strong>Medien konnten nicht initialisiert werden.</strong><br><small>Bitte prüfe die Serverkonfiguration und media.php.</small></div>';
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js?v=4.0.1-rc.3', { updateViaCache: 'none' })
      .then(registration => registration.update())
      .catch(() => {});
  }
}

init();
})();
