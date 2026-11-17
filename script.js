const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgakajjz';

const welcomeScreen = document.getElementById('welcome-screen');
const formScreen = document.getElementById('form-screen');
const successScreen = document.getElementById('success-screen');

const loginForm = document.getElementById('login-form');
const eleosForm = document.getElementById('eleos-form');

// Login Inputs
const fullNameInput = document.getElementById('fullName');
const fatherNameInput = document.getElementById('fatherName');
const phoneNumberInput = document.getElementById('phoneNumber');

// Form Confirmation Inputs
const confirmNameInput = document.getElementById('confirmName');
const confirmFatherInput = document.getElementById('confirmFather');
const confirmPhoneInput = document.getElementById('confirmPhone');
const greetingText = document.getElementById('greeting-text');

// Participation & Conditional Elements
const optChoirRadio = document.getElementById('opt-choir');
const optBothRadio = document.getElementById('opt-both');
const bothSubBox = document.getElementById('both-sub-box');

const expYesRadio = document.getElementById('exp-yes');
const expNeedTimeRadio = document.getElementById('exp-need-time');
const vocalTrainingBox = document.getElementById('vocal-training-box');

const vocalYesRadio = document.getElementById('vocal-yes');
const vocalNoRadio = document.getElementById('vocal-no');
const tgUsernameInput = document.getElementById('tgUsername');

let responses = JSON.parse(localStorage.getItem('eleos_responses') || '[]');
const responseCountSpan = document.getElementById('response-count');
responseCountSpan.textContent = responses.length;

function showScreen(screenToShow) {
  [welcomeScreen, formScreen, successScreen].forEach(s => s.classList.remove('active'));
  screenToShow.classList.add('active');
  window.scrollTo(0, 0);
}

// Step 1: Login Handler
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  confirmNameInput.value = fullNameInput.value.trim();
  confirmFatherInput.value = fatherNameInput.value.trim();
  confirmPhoneInput.value = phoneNumberInput.value.trim();
  greetingText.textContent = `Signed in as ${confirmNameInput.value} ${confirmFatherInput.value} (${confirmPhoneInput.value})`;
  showScreen(formScreen);
});

document.getElementById('logout-btn').addEventListener('click', () => {
  showScreen(welcomeScreen);
});

// Branching 1: Choir vs Both Choir and Worship
function updateParticipationBranching() {
  if (optBothRadio.checked) {
    bothSubBox.classList.remove('hidden');
    expYesRadio.required = true;
    expNeedTimeRadio.required = true;
  } else {
    bothSubBox.classList.add('hidden');
    vocalTrainingBox.classList.add('hidden');

    expYesRadio.checked = false;
    expNeedTimeRadio.checked = false;
    expYesRadio.required = false;
    expNeedTimeRadio.required = false;

    vocalYesRadio.checked = false;
    vocalNoRadio.checked = false;
    vocalYesRadio.required = false;
    vocalNoRadio.required = false;
  }
}

optChoirRadio.addEventListener('change', updateParticipationBranching);
optBothRadio.addEventListener('change', updateParticipationBranching);

// Branching 2: Experience -> Vocal Training (shown under both experience options)
function updateExperienceBranching() {
  if (expYesRadio.checked || expNeedTimeRadio.checked) {
    vocalTrainingBox.classList.remove('hidden');
    vocalYesRadio.required = true;
    vocalNoRadio.required = true;
  }
}

expYesRadio.addEventListener('change', updateExperienceBranching);
expNeedTimeRadio.addEventListener('change', updateExperienceBranching);

// Reset Form Selections
function resetFormChoices() {
  optChoirRadio.checked = false;
  optBothRadio.checked = false;
  tgUsernameInput.value = '';
  document.querySelectorAll('input[name="userBatch"]').forEach(r => r.checked = false);
  updateParticipationBranching();
}

// Step 2: Submit Form to Formspree + Local Backup
eleosForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = eleosForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const participation = optBothRadio.checked
    ? 'Both choir and worship (I want to participate in worship)'
    : 'In choir';

  let experience = '—';
  let vocalTraining = '—';

  if (optBothRadio.checked) {
    experience = expYesRadio.checked ? 'I had experience before' : 'I need more time for experience';
    vocalTraining = vocalYesRadio.checked ? 'Yes' : 'No';
  }

  let tg = tgUsernameInput.value.trim();
  if (tg && !tg.startsWith('@')) {
    tg = '@' + tg;
  }

  const selectedBatchEl = document.querySelector('input[name="userBatch"]:checked');
  const batch = selectedBatchEl ? selectedBatchEl.value : '—';

  const entry = {
    fullName: confirmNameInput.value.trim(),
    fatherName: confirmFatherInput.value.trim(),
    phone: confirmPhoneInput.value.trim(),
    participation: participation,
    experience: experience,
    vocalTraining: vocalTraining,
    telegramUsername: tg,
    batch: batch,
    submittedAt: new Date().toLocaleString()
  };

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(entry)
    });

    if (!res.ok) throw new Error('Network error');

    responses.unshift(entry);
    localStorage.setItem('eleos_responses', JSON.stringify(responses));
    responseCountSpan.textContent = responses.length;

    renderResponses();
    showScreen(successScreen);
  } catch (err) {
    alert('Could not send your response. Please check your internet connection and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Response';
  }
});

function renderResponses() {
  const list = document.getElementById('responses-list');
  if (responses.length === 0) {
    list.innerHTML = '<p style="color:#5f6368;">No responses recorded on this device yet.</p>';
    return;
  }

  list.innerHTML = responses.map((r, i) => `
    <div class="response-item">
      <strong>#${responses.length - i} — ${r.fullName} ${r.fatherName}</strong> (${r.phone})<br/>
      <strong>Batch:</strong> ${r.batch || '—'} | <strong>Telegram:</strong> ${r.telegramUsername || '—'}<br/>
      <strong>Participation:</strong> ${r.participation}<br/>
      <strong>Experience:</strong> ${r.experience} | <strong>Vocal Training:</strong> ${r.vocalTraining}<br/>
      <small style="color:#777;">Submitted: ${r.submittedAt}</small>
    </div>
  `).join('');
}

document.getElementById('view-responses-btn').addEventListener('click', () => {
  renderResponses();
  showScreen(successScreen);
});

document.getElementById('submit-another-btn').addEventListener('click', () => {
  resetFormChoices();
  showScreen(formScreen);
});

document.getElementById('export-csv-btn').addEventListener('click', () => {
  if (responses.length === 0) return;
  const headers = ['Full Name', 'Father Name', 'Phone', 'Batch', 'Telegram Username', 'Participation', 'Experience', 'Vocal Training', 'Submitted At'];
  const rows = responses.map(r => [
    r.fullName, r.fatherName, r.phone, r.batch, r.telegramUsername, r.participation, r.experience, r.vocalTraining, r.submittedAt
  ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','));

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', 'eleos_responses.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});