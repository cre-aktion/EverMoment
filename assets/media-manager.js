(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);

  const grid = $('#mediaGrid');
  const message = $('#managerMessage');
  const countLabel = $('#mediaCountLabel');
  const filterSelect = $('#mediaTypeFilter');
  const searchInput = $('#mediaSearchInput');
  const gridSizeRange = $('#gridSizeRange');
  const changeCountLabel = $('#changeCountLabel');
  const saveTop = $('#saveOrderBtn');
  const saveBottom = $('#saveOrderFooterBtn');
  const discardButton = $('#discardChangesBtn');
  const previewDialog = $('#previewDialog');
  const previewHost = $('#previewHost');
  const previewCaption = $('#previewCaption');
  const moveDialog = $('#moveDialog');
  const movePositionInput = $('#movePositionInput');
  const moveDialogLabel = $('#moveDialogLabel');
  const deleteDialog = $('#deleteDialog');
  const deleteDialogLabel = $('#deleteDialogLabel');
  const toast = $('#managerToast');
  const footerPosition = $('#footerPosition');
  const selectionBar = $('#selectionBar');
  const selectionCountLabel = $('#selectionCountLabel');
  const multiDeleteDialog = $('#multiDeleteDialog');
  const multiDeleteDialogLabel = $('#multiDeleteDialogLabel');

  let items = [];
  let originalOrder = [];
  let signature = '';
  let csrf = '';
  let mediaRevision = '';
  let selectedMoveName = '';
  let selectedDeleteName = '';
  let draggedName = '';
  let changed = false;
  let toastTimer = null;
  let videoObserver = null;
  let autoScrollFrame = null;
  let lastDragY = 0;
  const selectedNames = new Set();
  let movingSelection = false;

  function showMessage(text = '', type = '') {
    message.textContent = text;
    message.dataset.type = type;
  }

  function showToast(text, type = 'success') {
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.dataset.type = type;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {cache: 'no-store', ...options});
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error('Der Server liefert keine gültige Antwort.');
    }
    if (!response.ok || data.ok === false) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.reload = Boolean(data.reload);
      throw error;
    }
    return data;
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (value < 1024) return `${value} B`;
    if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
    if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
    return `${(value / 1024 ** 3).toFixed(2)} GB`;
  }

  function mediaNumber(name) {
    const match = String(name).match(/^(\d+)/);
    return match ? Number(match[1]) : null;
  }

  function setChanged(value) {
    changed = Boolean(value);
    const diff = items.reduce((count, item, index) => (
      item.name !== originalOrder[index] ? count + 1 : count
    ), 0);

    saveTop.disabled = !changed;
    saveBottom.disabled = !changed;
    discardButton.disabled = !changed;
    changeCountLabel.textContent = changed
      ? `${Math.max(1, diff)} Position${diff === 1 ? '' : 'en'} geändert`
      : 'Keine ungespeicherten Änderungen';
    changeCountLabel.classList.toggle('has-changes', changed);
  }

  function currentFilter() {
    return filterSelect.value;
  }

  function visibleItems() {
    const filter = currentFilter();
    return filter === 'all' ? items : items.filter(item => item.type === filter);
  }


  function updateSelectionUi() {
    const count = selectedNames.size;
    selectionBar.hidden = count === 0;
    selectionCountLabel.textContent = `${count} Medium${count === 1 ? '' : 'en'} ausgewählt`;
    $('#moveSelectionBtn').disabled = count === 0;
    $('#deleteSelectionBtn').disabled = count === 0;

    grid.querySelectorAll('.media-card').forEach(card => {
      const selected = selectedNames.has(card.dataset.name);
      card.classList.toggle('selected', selected);
      const toggle = card.querySelector('.media-select-toggle');
      if (toggle) {
        toggle.textContent = selected ? '✓' : '';
        toggle.setAttribute('aria-pressed', selected ? 'true' : 'false');
        toggle.title = selected ? 'Auswahl aufheben' : 'Medium auswählen';
      }
    });
  }

  function toggleSelection(name, force = null) {
    const shouldSelect = force === null ? !selectedNames.has(name) : Boolean(force);
    if (shouldSelect) selectedNames.add(name);
    else selectedNames.delete(name);
    updateSelectionUi();
  }

  function clearSelection() {
    selectedNames.clear();
    updateSelectionUi();
  }

  function selectedInCurrentOrder() {
    return items.filter(item => selectedNames.has(item.name));
  }

  function moveSelectedBlockBefore(targetName) {
    const selected = selectedInCurrentOrder();
    if (!selected.length) return;

    const targetIndexOriginal = items.findIndex(item => item.name === targetName);
    if (targetIndexOriginal < 0) return;

    const remaining = items.filter(item => !selectedNames.has(item.name));
    let targetIndex = remaining.findIndex(item => item.name === targetName);

    if (targetIndex < 0) return;

    remaining.splice(targetIndex, 0, ...selected);
    items = remaining;
    setChanged(true);
    render();
    updateSelectionUi();

    requestAnimationFrame(() => {
      const first = selected[0];
      grid.querySelector(`[data-name="${CSS.escape(first.name)}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
  }

  function moveSelectionToPosition(position) {
    const selected = selectedInCurrentOrder();
    if (!selected.length) return;

    const remaining = items.filter(item => !selectedNames.has(item.name));
    const targetIndex = Math.max(0, Math.min(remaining.length, Number(position) - 1));
    remaining.splice(targetIndex, 0, ...selected);
    items = remaining;

    setChanged(true);
    render();
    updateSelectionUi();

    requestAnimationFrame(() => {
      grid.querySelector(`[data-name="${CSS.escape(selected[0].name)}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
  }

  function setupVideoObserver() {
    videoObserver?.disconnect();

    videoObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        const source = video.dataset.src;

        if (entry.isIntersecting) {
          if (!video.src && source) {
            video.src = source;
            video.load();
          }
        } else if (video.src) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
      });
    }, {
      root: null,
      rootMargin: '500px 0px',
      threshold: 0.01
    });

    grid.querySelectorAll('video[data-src]').forEach(video => videoObserver.observe(video));
  }

  function createPreview(item) {
    const preview = document.createElement('div');
    preview.className = 'media-card-preview';

    if (item.type === 'image') {
      const image = document.createElement('img');
      image.src = item.url;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      preview.appendChild(image);
    } else {
      const video = document.createElement('video');
      video.dataset.src = item.url;
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('aria-label', `Videovorschau ${item.name}`);

      video.addEventListener('loadedmetadata', () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        const target = Math.min(
          Math.max(0.2, video.duration * 0.24),
          Math.max(0.2, video.duration - 0.15)
        );
        try {
          video.currentTime = target;
        } catch (_) {}
      });

      video.addEventListener('seeked', () => video.pause());

      const badge = document.createElement('span');
      badge.className = 'video-badge';
      badge.textContent = '▶ VIDEO';

      preview.append(video, badge);
    }

    preview.addEventListener('dblclick', () => openPreview(item.name));
    return preview;
  }

  function createCard(item, absoluteIndex) {
    const card = document.createElement('article');
    card.className = 'media-card';
    card.draggable = true;
    card.dataset.name = item.name;
    card.dataset.type = item.type;

    const preview = createPreview(item);

    const selectToggle = document.createElement('button');
    selectToggle.type = 'button';
    selectToggle.className = 'media-select-toggle';
    selectToggle.setAttribute('aria-label', `${item.name} auswählen`);
    selectToggle.setAttribute('aria-pressed', selectedNames.has(item.name) ? 'true' : 'false');
    selectToggle.textContent = selectedNames.has(item.name) ? '✓' : '';
    selectToggle.addEventListener('click', event => {
      event.stopPropagation();
      toggleSelection(item.name);
    });
    preview.appendChild(selectToggle);

    const info = document.createElement('div');
    info.className = 'media-card-info';

    const title = document.createElement('strong');
    title.textContent = item.name;

    const meta = document.createElement('small');
    meta.textContent = `${item.type === 'video' ? 'Video' : 'Bild'} · ${formatBytes(item.size)}`;

    info.append(title, meta);

    const actions = document.createElement('div');
    actions.className = 'media-card-actions';

    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.textContent = '👁';
    previewButton.title = 'Ansehen';
    previewButton.setAttribute('aria-label', `${item.name} ansehen`);
    previewButton.addEventListener('click', () => openPreview(item.name));

    const moveButton = document.createElement('button');
    moveButton.type = 'button';
    moveButton.textContent = '⇵';
    moveButton.title = 'An Position verschieben';
    moveButton.setAttribute('aria-label', `${item.name} an Position verschieben`);
    moveButton.addEventListener('click', () => openMove(item.name));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger-button';
    deleteButton.textContent = '×';
    deleteButton.title = 'Löschen';
    deleteButton.setAttribute('aria-label', `${item.name} löschen`);
    deleteButton.addEventListener('click', () => openDelete(item.name));

    actions.append(previewButton, moveButton, deleteButton);
    card.append(preview, info, actions);

    card.addEventListener('dragstart', event => {
      if (!selectedNames.has(item.name)) {
        selectedNames.clear();
        selectedNames.add(item.name);
        updateSelectionUi();
      }

      draggedName = item.name;
      movingSelection = selectedNames.size > 1;
      card.classList.add('dragging');
      grid.querySelectorAll('.media-card.selected').forEach(selectedCard => {
        selectedCard.classList.add('dragging-group');
      });

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.name);
      event.dataTransfer.setData('application/x-evermoment-count', String(selectedNames.size));
    });

    card.addEventListener('dragend', () => {
      draggedName = '';
      movingSelection = false;
      card.classList.remove('dragging');
      grid.querySelectorAll('.dragging-group').forEach(el => el.classList.remove('dragging-group'));
      grid.querySelectorAll('.drag-target').forEach(el => el.classList.remove('drag-target'));
      stopAutoScroll();
    });

    card.addEventListener('dragover', event => {
      event.preventDefault();
      lastDragY = event.clientY;
      startAutoScroll();
      if (
        draggedName &&
        draggedName !== item.name &&
        !(movingSelection && selectedNames.has(item.name))
      ) {
        card.classList.add('drag-target');
      }
    });

    card.addEventListener('dragleave', () => card.classList.remove('drag-target'));

    card.addEventListener('drop', event => {
      event.preventDefault();
      card.classList.remove('drag-target');

      if (selectedNames.size > 1 && selectedNames.has(draggedName)) {
        moveSelectedBlockBefore(item.name);
      } else {
        moveBefore(draggedName, item.name);
      }

      stopAutoScroll();
    });

    card.addEventListener('focusin', () => {
      footerPosition.textContent = `Position ${absoluteIndex + 1} von ${items.length} · ${item.name}`;
    });

    return card;
  }

  function render() {
    videoObserver?.disconnect();
    grid.innerHTML = '';

    const filtered = visibleItems();
    const fragment = document.createDocumentFragment();

    filtered.forEach(item => {
      const absoluteIndex = items.findIndex(entry => entry.name === item.name);
      fragment.appendChild(createCard(item, absoluteIndex));
    });

    grid.appendChild(fragment);
    setupVideoObserver();
    updateSelectionUi();

    const imageCount = items.filter(item => item.type === 'image').length;
    const videoCount = items.filter(item => item.type === 'video').length;
    countLabel.textContent = `${items.length} Medien · ${imageCount} Bilder · ${videoCount} Videos`;

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-grid';
      empty.textContent = 'Für diesen Filter wurden keine Medien gefunden.';
      grid.appendChild(empty);
    }
  }

  function moveBefore(sourceName, targetName) {
    if (!sourceName || !targetName || sourceName === targetName) return;

    const sourceIndex = items.findIndex(item => item.name === sourceName);
    const targetIndex = items.findIndex(item => item.name === targetName);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [moved] = items.splice(sourceIndex, 1);
    const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    items.splice(adjustedTarget, 0, moved);

    setChanged(true);
    render();

    requestAnimationFrame(() => {
      grid.querySelector(`[data-name="${CSS.escape(sourceName)}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
  }

  function moveToPosition(name, position) {
    const sourceIndex = items.findIndex(item => item.name === name);
    if (sourceIndex < 0) return;

    const targetIndex = Math.max(0, Math.min(items.length - 1, Number(position) - 1));
    if (sourceIndex === targetIndex) return;

    const [moved] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, moved);
    setChanged(true);
    render();

    requestAnimationFrame(() => {
      grid.querySelector(`[data-name="${CSS.escape(name)}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
  }

  function startAutoScroll() {
    if (autoScrollFrame) return;

    const step = () => {
      const edge = 100;
      let speed = 0;

      if (lastDragY < edge) {
        speed = -Math.max(4, (edge - lastDragY) * 0.22);
      } else if (lastDragY > window.innerHeight - edge) {
        speed = Math.max(4, (lastDragY - (window.innerHeight - edge)) * 0.22);
      }

      if (speed !== 0) window.scrollBy(0, speed);
      autoScrollFrame = requestAnimationFrame(step);
    };

    autoScrollFrame = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = null;
  }

  function itemByName(name) {
    return items.find(item => item.name === name) || null;
  }

  function openPreview(name) {
    const item = itemByName(name);
    if (!item) return;

    previewHost.innerHTML = '';

    if (item.type === 'image') {
      const image = document.createElement('img');
      image.src = item.url;
      image.alt = item.name;
      previewHost.appendChild(image);
    } else {
      const video = document.createElement('video');
      video.src = item.url;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      previewHost.appendChild(video);
    }

    const index = items.findIndex(entry => entry.name === name);
    previewCaption.textContent = `${item.name} · Position ${index + 1} von ${items.length}`;
    previewDialog.showModal();
  }

  function openMove(name) {
    const item = itemByName(name);
    if (!item) return;

    selectedMoveName = name;
    const index = items.findIndex(entry => entry.name === name);
    moveDialogLabel.textContent = `${name} befindet sich derzeit auf Position ${index + 1}.`;
    movePositionInput.max = String(items.length);
    movePositionInput.value = String(index + 1);
    moveDialog.showModal();
    requestAnimationFrame(() => movePositionInput.select());
  }

  function openDelete(name) {
    selectedDeleteName = name;
    deleteDialogLabel.textContent = `${name} wirklich löschen?`;
    deleteDialog.showModal();
  }

  async function loadItems() {
    showMessage('Medienliste wird geladen …');
    const data = await api(`media-manager-api.php?action=list&_=${Date.now()}`);

    csrf = data.csrf;
    signature = data.signature;
    mediaRevision = data.revision || '';
    items = data.items || [];
    originalOrder = items.map(item => item.name);
    selectedNames.clear();
    setChanged(false);
    render();
    showMessage('');
  }

  async function saveOrder() {
    if (!changed) return;

    saveTop.disabled = true;
    saveBottom.disabled = true;
    showMessage('Reihenfolge wird gespeichert und Dateien werden neu nummeriert …');

    try {
      const data = await api('media-manager-api.php?action=reorder', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          csrf,
          signature,
          order: items.map(item => item.name)
        })
      });

      signature = data.signature;
      mediaRevision = data.revision || mediaRevision;
      items = Array.isArray(data.items) ? data.items : [];
      originalOrder = items.map(item => item.name);
      setChanged(false);
      render();
      showMessage('');
      showToast('Reihenfolge gespeichert und Medien neu nummeriert.');
    } catch (error) {
      showMessage(error.message, 'error');
      if (error.reload) {
        saveTop.disabled = false;
        saveBottom.disabled = false;
      }
    }
  }

  async function deleteSelected() {
    if (!selectedDeleteName) return;

    $('#confirmDeleteBtn').disabled = true;
    showMessage(`${selectedDeleteName} wird gelöscht …`);

    try {
      const data = await api('media-manager-api.php?action=delete', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          csrf,
          signature,
          name: selectedDeleteName
        })
      });

      signature = data.signature;
      mediaRevision = data.revision || mediaRevision;
      items = Array.isArray(data.items) ? data.items : [];
      originalOrder = items.map(item => item.name);
      selectedDeleteName = '';
      selectedNames.delete(selectedDeleteName);
      clearSelection();
      setChanged(false);
      deleteDialog.close();
      render();
      showMessage('');
      showToast('Medium gelöscht und Dateien neu nummeriert.');
    } catch (error) {
      showMessage(error.message, 'error');
      if (error.reload) deleteDialog.close();
    } finally {
      $('#confirmDeleteBtn').disabled = false;
    }
  }


  async function deleteSelection() {
    const names = selectedInCurrentOrder().map(item => item.name);
    if (!names.length) return;

    $('#confirmMultiDeleteBtn').disabled = true;
    showMessage(`${names.length} Medien werden gelöscht …`);

    try {
      const data = await api('media-manager-api.php?action=delete-many', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          csrf,
          signature,
          names
        })
      });

      signature = data.signature;
      mediaRevision = data.revision || mediaRevision;
      items = data.items;
      originalOrder = items.map(item => item.name);
      clearSelection();
      setChanged(false);
      multiDeleteDialog.close();
      render();
      showMessage('');
      showToast(`${names.length} Medien gelöscht und Dateien neu nummeriert.`);
    } catch (error) {
      showMessage(error.message, 'error');
      if (error.reload) multiDeleteDialog.close();
    } finally {
      $('#confirmMultiDeleteBtn').disabled = false;
    }
  }

  function jumpToNumber() {
    const wanted = Number(searchInput.value);
    if (!Number.isFinite(wanted)) return;

    const exact = items.find(item => mediaNumber(item.name) === wanted);
    const fallback = items[Math.max(0, Math.min(items.length - 1, wanted - 1))];
    const item = exact || fallback;
    if (!item) return;

    if (currentFilter() !== 'all' && item.type !== currentFilter()) {
      filterSelect.value = 'all';
      render();
    }

    requestAnimationFrame(() => {
      const card = grid.querySelector(`[data-name="${CSS.escape(item.name)}"]`);
      card?.scrollIntoView({behavior: 'smooth', block: 'center'});
      card?.classList.add('flash-card');
      setTimeout(() => card?.classList.remove('flash-card'), 1300);
    });
  }


  $('#clearSelectionBtn').addEventListener('click', clearSelection);

  $('#moveSelectionBtn').addEventListener('click', () => {
    const selected = selectedInCurrentOrder();
    if (!selected.length) return;

    movingSelection = true;
    selectedMoveName = '';
    moveDialogLabel.textContent =
      `${selected.length} Medien als zusammenhängenden Block verschieben.`;
    movePositionInput.max = String(items.length - selected.length + 1);
    movePositionInput.value = '1';
    moveDialog.showModal();
    requestAnimationFrame(() => movePositionInput.select());
  });

  $('#deleteSelectionBtn').addEventListener('click', () => {
    const count = selectedNames.size;
    if (!count) return;
    multiDeleteDialogLabel.textContent =
      `${count} ausgewählte Medien wirklich endgültig löschen?`;
    multiDeleteDialog.showModal();
  });

  $('#confirmMultiDeleteBtn').addEventListener('click', deleteSelection);

  filterSelect.addEventListener('change', render);

  gridSizeRange.addEventListener('input', () => {
    document.documentElement.style.setProperty('--card-min', `${gridSizeRange.value}px`);
  });

  $('#jumpToMediaBtn').addEventListener('click', jumpToNumber);
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      jumpToNumber();
    }
  });

  saveTop.addEventListener('click', saveOrder);
  saveBottom.addEventListener('click', saveOrder);

  discardButton.addEventListener('click', () => {
    items.sort((a, b) => originalOrder.indexOf(a.name) - originalOrder.indexOf(b.name));
    clearSelection();
    setChanged(false);
    render();
    showToast('Ungespeicherte Änderungen verworfen.');
  });

  $('#reloadMediaBtn').addEventListener('click', async () => {
    if (changed && !confirm('Ungespeicherte Änderungen verwerfen und neu laden?')) return;
    await loadItems().catch(error => showMessage(error.message, 'error'));
  });

  $('#confirmMoveBtn').addEventListener('click', () => {
    if (movingSelection && selectedNames.size > 1) {
      moveSelectionToPosition(movePositionInput.value);
    } else {
      moveToPosition(selectedMoveName, movePositionInput.value);
    }

    movingSelection = false;
    moveDialog.close();
  });

  movePositionInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      $('#confirmMoveBtn').click();
    }
  });

  $('#confirmDeleteBtn').addEventListener('click', deleteSelected);

  previewDialog.addEventListener('close', () => {
    previewHost.querySelector('video')?.pause();
    previewHost.innerHTML = '';
  });

  window.addEventListener('beforeunload', event => {
    if (!changed) return;
    event.preventDefault();
    event.returnValue = '';
  });

  loadItems().catch(error => showMessage(error.message, 'error'));
})();
