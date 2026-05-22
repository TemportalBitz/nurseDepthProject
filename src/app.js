// ===== DOM =====
const screenHome = document.getElementById('screenHome');
const screenForm = document.getElementById('screenForm');
const screenDashboard = document.getElementById('screenDashboard');
const screenQuiz = document.getElementById('screenQuiz');
const screenResults = document.getElementById('screenResults');

const startBtn = document.getElementById('startBtn');
const patientForm = document.getElementById('patientForm');
const formBackBtn = document.getElementById('formBackBtn');
const dashBackBtn = document.getElementById('dashBackBtn');
const startTestBtn = document.getElementById('startTestBtn');
const backHomeBtn = document.getElementById('backHomeBtn');

const historyList = document.getElementById('historyList');
const emptyState = document.getElementById('emptyState');
const recordCount = document.getElementById('recordCount');

// Dashboard elements
const bisSlider = document.getElementById('bisSlider');
const bisValue = document.getElementById('bisValue');
const bisStatus = document.getElementById('bisStatus');
const dashPatient = document.getElementById('dashPatient');
const dashAge = document.getElementById('dashAge');
const dashNurse = document.getElementById('dashNurse');

// Quiz elements
const quizBisValue = document.getElementById('quizBisValue');
const quizBisStatus = document.getElementById('quizBisStatus');
const quizPatient = document.getElementById('quizPatient');
const quizAge = document.getElementById('quizAge');
const quizNurse = document.getElementById('quizNurse');
const quizRound = document.getElementById('quizRound');
const quizFeedback = document.getElementById('quizFeedback');
const feedbackIcon = document.getElementById('feedbackIcon');
const feedbackText = document.getElementById('feedbackText');
const quizButtons = document.querySelectorAll('.quiz-btn');

// Results elements
const resultsScore = document.getElementById('resultsScore');
const resultsLabel = document.getElementById('resultsLabel');
const resultsDetail = document.getElementById('resultsDetail');
const resultsTimer = document.getElementById('resultsTimer');

const toast = document.getElementById('toast');
let toastTimer = null;
let homeTimer = null;
let homeCountdown = null;

// ===== State =====
let currentPatient = { name: '', age: '', nurse: '' };
let quizState = { round: 0, aciertos: 0, currentValue: 0, results: [], waiting: false };

// ===== Screen navigation =====
function showScreen(screen) {
  [screenHome, screenForm, screenDashboard, screenQuiz, screenResults].forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
  screen.style.animation = 'none';
  screen.offsetHeight;
  screen.style.animation = '';
}

function goHome() {
  clearTimeout(homeTimer);
  clearInterval(homeCountdown);
  showScreen(screenHome);
}

// ===== Toast =====
function showToast(message, type = 'default') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => toast.classList.add('show'));
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== BIS helpers =====
function getBisCategory(score) {
  if (score >= 80) return { label: 'Despierto', key: 'awake', cls: 'bis-awake' };
  if (score >= 60) return { label: 'Sedación', key: 'light', cls: 'bis-light' };
  if (score >= 40) return { label: 'Anestesia adecuada', key: 'anesthesia', cls: 'bis-anesthesia' };
  return { label: 'Anestesia profunda', key: 'deep', cls: 'bis-deep' };
}

function getAciertosChipClass(aciertos) {
  if (aciertos === 3) return 'score-perfect';
  if (aciertos === 2) return 'score-good';
  if (aciertos === 1) return 'score-fair';
  return 'score-poor';
}

function getAciertosLabel(aciertos) {
  if (aciertos === 3) return 'Perfecto';
  if (aciertos === 2) return 'Bien';
  if (aciertos === 1) return 'Regular';
  return 'Necesita practica';
}

function updateDashboardDisplay(value) {
  const num = parseInt(value, 10);
  bisValue.textContent = num;
  const { label, cls } = getBisCategory(num);
  const display = document.querySelector('#screenDashboard .monitor-display');
  display.className = 'monitor-display';
  if (cls) display.classList.add(cls);
  bisStatus.textContent = label;
}

function updateSliderColor(value) {
  const num = parseInt(value, 10);

  bisSlider.classList.remove(
    'primary',
    'teal',
    'warning',
    'error'
  );

  if (num < 40) {
    bisSlider.classList.add('primary');

  } else if (num < 60) {
    bisSlider.classList.add('teal');

  } else if (num < 80) {
    bisSlider.classList.add('warning');

  } else {
    bisSlider.classList.add('error');
  }
}

function updateQuizDisplay(value) {
  const num = parseInt(value, 10);
  quizBisValue.textContent = num;
  const { cls } = getBisCategory(num);
  const display = document.querySelector(' .monitor-display');
  display.className = 'monitor-display';
  if (cls) display.classList.add(cls);
  quizBisStatus.textContent = '???';
}

// ===== Random BIS value =====
function randomBisValue() {
  return Math.floor(Math.random() * 101);
}

// ===== Dashboard =====
function showDashboard() {
  dashPatient.textContent = currentPatient.name;
  dashAge.textContent = currentPatient.age + ' años';
  dashNurse.textContent = currentPatient.nurse;
  bisSlider.value = 0;
  updateDashboardDisplay(0);
  updateSliderColor(0);
  showScreen(screenDashboard);
}

// ===== Quiz logic =====
function startQuiz() {
  quizState = { round: 1, aciertos: 0, currentValue: 0, results: [], waiting: false };
  quizPatient.textContent = currentPatient.name;
  quizAge.textContent = currentPatient.age + ' años';
  quizNurse.textContent = currentPatient.nurse;
  quizRound.textContent = '1 / 3';
  quizFeedback.classList.add('hidden');
  enableQuizButtons();
  nextRound();
  showScreen(screenQuiz);
}

function nextRound() {
  const value = randomBisValue();
  quizState.currentValue = value;
  quizState.waiting = false;
  updateQuizDisplay(value);
  quizFeedback.classList.add('hidden');
  enableQuizButtons();
  quizRound.textContent = `${quizState.round} / 3`;
}

function enableQuizButtons() {
  quizButtons.forEach(btn => {
    btn.disabled = false;
    btn.className = 'quiz-btn';
  });
}

function disableQuizButtons(correctKey) {
  quizButtons.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.answer === correctKey) btn.classList.add('correct');
  });
}

function handleAnswer(answerKey) {
  if (quizState.waiting) return;
  quizState.waiting = true;

  const correct = getBisCategory(quizState.currentValue);
  const isCorrect = answerKey === correct.key;

  if (isCorrect) quizState.aciertos++;
  quizState.results.push(isCorrect);

  disableQuizButtons(correct.key);
  if (!isCorrect) {
    quizButtons.forEach(btn => {
      if (btn.dataset.answer === answerKey) btn.classList.add('wrong');
    });
  }

  quizFeedback.classList.remove('hidden', 'correct', 'wrong');
  quizFeedback.classList.add(isCorrect ? 'correct' : 'wrong');

  if (isCorrect) {
    feedbackIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>';
    feedbackText.textContent = 'Correcto!';
  } else {
    feedbackIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/><circle cx="12" cy="12" r="10"/></svg>';
    feedbackText.textContent = `Incorrecto. La respuesta era: ${correct.label}`;
  }

  setTimeout(() => {
    if (quizState.round < 3) {
      quizState.round++;
      nextRound();
    } else {
      showResults();
    }
  }, 1500);
}

// ===== Results =====
function showResults() {
  const aciertos = quizState.aciertos;
  resultsScore.textContent = `${aciertos} / 3`;

  if (aciertos === 3) resultsLabel.textContent = 'Perfecto! Todos correctos';
  else if (aciertos === 2) resultsLabel.textContent = 'Bien! Casi perfecto';
  else if (aciertos === 1) resultsLabel.textContent = 'Sigue practicando';
  else resultsLabel.textContent = 'Necesitas mas practica';

  resultsDetail.innerHTML = '';
  quizState.results.forEach(hit => {
    const dot = document.createElement('span');
    dot.className = `result-dot ${hit ? 'hit' : 'miss'}`;
    resultsDetail.appendChild(dot);
  });

  showScreen(screenResults);

  saveRecord(currentPatient.name, currentPatient.age, currentPatient.nurse, aciertos);

  // Auto-redirect countdown
  let seconds = 20;
  resultsTimer.textContent = `Regresando al inicio en ${seconds}s...`;

  homeCountdown = setInterval(() => {
    seconds--;
    if (seconds > 0) {
      resultsTimer.textContent = `Regresando al inicio en ${seconds}s...`;
    } else {
      clearInterval(homeCountdown);
    }
  }, 1000);

  homeTimer = setTimeout(() => {
    goHome();
  }, 20000);
}

// ===== Form validation =====
function clearErrors() {
  ['patientName', 'patientAge', 'nurseName'].forEach(id => {
    document.getElementById(id).classList.remove('invalid');
    document.getElementById(`${id}Error`).textContent = '';
  });
}

function validateForm() {
  let valid = true;
  clearErrors();

  const name = document.getElementById('patientName').value.trim();
  const age = document.getElementById('patientAge').value.trim();
  const nurse = document.getElementById('nurseName').value.trim();

  // Solo letras, espacios y tildes
  const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

  // ===== Nombre paciente =====
  if (!name) {
    document.getElementById('patientName').classList.add('invalid');
    document.getElementById('patientNameError').textContent =
      'El nombre del paciente es requerido';
    valid = false;

  } else if (!nameRegex.test(name)) {
    document.getElementById('patientName').classList.add('invalid');
    document.getElementById('patientNameError').textContent =
      'El nombre no puede contener números';
    valid = false;
  }

  // ===== Edad =====
  if (!age) {
    document.getElementById('patientAge').classList.add('invalid');
    document.getElementById('patientAgeError').textContent =
      'La edad es requerida';
    valid = false;

  } else if (!/^\d+$/.test(age)) {
    document.getElementById('patientAge').classList.add('invalid');
    document.getElementById('patientAgeError').textContent =
      'La edad no debe contener simbolos';
    valid = false;

  } else if (parseInt(age, 10) <= 0 || parseInt(age, 10) > 100) {
    document.getElementById('patientAge').classList.add('invalid');
    document.getElementById('patientAgeError').textContent =
      'Ingrese una edad válida mayor a 0 y menor o igual a 100';
    valid = false;
  } 

  // ===== Enfermera =====
  if (!nurse) {
    document.getElementById('nurseName').classList.add('invalid');
    document.getElementById('nurseNameError').textContent =
      'El nombre de la enfermera es requerido';
    valid = false;

  } else if (!nameRegex.test(nurse)) {
    document.getElementById('nurseName').classList.add('invalid');
    document.getElementById('nurseNameError').textContent =
      'El nombre no puede contener números';
    valid = false;
  }

  return valid;
}

// ===== History rendering =====
function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCard(record) {
  const aciertos = record.aciertos || 0;
  const chipCls = getAciertosChipClass(aciertos);
  const chipLabel = getAciertosLabel(aciertos);

  const card = document.createElement('div');
  card.className = 'history-card';
  card.innerHTML = `
    <div class="card-main">
      <span class="card-patient">${escapeHtml(record.patient_name)}</span>
      <div class="card-meta">
        <span class="card-nurse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          ${escapeHtml(record.nurse_name)}
        </span>
        <span class="card-age">${record.edad} años</span>
        <span class="card-date">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          ${formatDate(record.created_at)}
        </span>
      </div>
    </div>
    <div class="card-actions">

  <div class="score-chip ${chipCls}" title="${chipLabel}">
    <span class="chip-value">${aciertos}/3</span>
    <span class="chip-label">${chipLabel}</span>
  </div>

  <button
    class="delete-btn"
    onclick="deleteRecord(${record.id})"
    title="Eliminar registro"
  >
    ✕
  </button>

  </div>
  `;
  return card;
}

function updateEmptyState(count) {
  if (count === 0) {
    if (!historyList.contains(emptyState)) historyList.appendChild(emptyState);
    emptyState.style.display = '';
  } else {
    emptyState.style.display = 'none';
  }
  recordCount.textContent = `${count} ${count === 1 ? 'registro' : 'registros'}`;
}

// ===== Load records =====
async function loadRecords() {
  try {
    const response = await fetch('/api/records');
    const data = await response.json();

    historyList.innerHTML = '';

    data.forEach(r => {
      historyList.appendChild(renderCard(r));
    });

    if (data.length === 0) {
      historyList.appendChild(emptyState);
    }

    updateEmptyState(data.length);

  } catch (error) {
    showToast('Error al cargar registros', 'error');
  }
}

// ===== Save record =====
async function saveRecord(patientName, edad, nurseName, aciertos) {
  try {
    const response = await fetch('/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient_name: patientName,
        edad: parseInt(edad, 10),
        nurse_name: nurseName,
        score: 0,
        aciertos
      })
    });

    const data = await response.json();

    showToast('Registro guardado correctamente', 'success');

    emptyState.style.display = 'none';

    historyList.insertBefore(
      renderCard(data),
      historyList.firstChild
    );

    const count =
      historyList.querySelectorAll('.history-card').length;

    updateEmptyState(count);

    return data;

  } catch (error) {
    showToast('Error al guardar registro', 'error');
    return null;
  }
}

// ===== Delete record =====
async function deleteRecord(id) {
  const confirmDelete = confirm('¿Desea eliminar este registro?');

  if (!confirmDelete) return;

  const { error } = await fetch(`/api/records/${id}`, {
    method: 'DELETE'
  }).then(res => res.json());

  if (error) {
    showToast('Error al eliminar registro', 'error');
    return;
  }

  showToast('Registro eliminado', 'success');

  loadRecords();
}

window.deleteRecord = deleteRecord;

// ===== Event handlers =====

startBtn.addEventListener('click', () => {
  patientForm.reset();
  clearErrors();
  showScreen(screenForm);
  document.getElementById('patientName').focus();
});

formBackBtn.addEventListener('click', () => showScreen(screenHome));

patientForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  currentPatient.name = document.getElementById('patientName').value.trim();
  currentPatient.age = document.getElementById('patientAge').value.trim();
  currentPatient.nurse = document.getElementById('nurseName').value.trim();

  showDashboard();
});

bisSlider.addEventListener('input', () => {
  updateDashboardDisplay(bisSlider.value);
  updateSliderColor(bisSlider.value);
});

dashBackBtn.addEventListener('click', () => showScreen(screenForm));

startTestBtn.addEventListener('click', () => startQuiz());

quizButtons.forEach(btn => {
  btn.addEventListener('click', () => handleAnswer(btn.dataset.answer));
});

backHomeBtn.addEventListener('click', () => goHome());

// ===== Init =====
loadRecords();


window.addEventListener('load', () => {
  document.body.style.opacity = '1';
  document.body.style.transition = 'opacity 150ms ease';
});