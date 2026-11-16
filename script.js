// PASTE YOUR FORMSPREE URL HERE:
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgakajjz';

const welcomeScreen = document.getElementById('welcome-screen');
const formScreen = document.getElementById('form-screen');
const successScreen = document.getElementById('success-screen');

const loginForm = document.getElementById('login-form');
const eleosForm = document.getElementById('eleos-form');

const fullNameInput = document.getElementById('fullName');
const fatherNameInput = document.getElementById('fatherName');
const phoneNumberInput = document.getElementById('phoneNumber');

const confirmNameInput = document.getElementById('confirmName');
const confirmFatherInput = document.getElementById('confirmFather');
const confirmPhoneInput = document.getElementById('confirmPhone');
const greetingText = document.getElementById('greeting-text');

const teamEleosRadio = document.getElementById('team-eleos');
const teamOtherRadio = document.getElementById('team-other');
const eleosSubBox = document.getElementById('eleos-sub-box');
const otherTeamSubBox = document.getElementById('other-team-sub-box');

const freqAlwaysRadio = document.getElementById('freq-always');
const freqSometimesRadio = document.getElementById('freq-sometimes');
const sometimesReasonBox = document.getElementById('sometimes-reason-box');
const sometimesReasonInput = document.getElementById('sometimesReason');
const otherTeamReasonInput = document.getElementById('otherTeamReason');
const clearSelectionBtn = document.getElementById('clear-selection-btn');

let responses = JSON.parse(localStorage.getItem('eleos_responses') || '[]');
const responseCountSpan = document.getElementById('response-count');
responseCountSpan.textContent = responses.length;

function showScreen(screenToShow) {
  [welcomeScreen, formScreen, successScreen].forEach(s => s.classList.remove('active'));
  screenToShow.classList.add('active');
  window.scrollTo(0, 0);
}

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

function updateTeamBranching() {
  clearSelectionBtn.classList.remove('hidden');
  if (teamEleosRadio.checked) {
    eleosSubBox.classList.remove('hidden');
    otherTeamSubBox.classList.add('hidden');
    otherTeamReasonInput.required = false;
    otherTeamReasonInput.value = '';
  } else if (teamOtherRadio.checked) {
    otherTeamSubBox.classList.remove('hidden');
    otherTeamReasonInput.required = true;
    eleosSubBox.classList.add('hidden');
    sometimesReasonBox.classList.add('hidden');
    sometimesReasonInput.required = false;
    sometimesReasonInput.value = '';
    freqAlwaysRadio.checked = false;
    freqSometimesRadio.checked = false;
  }
}

teamEleosRadio.addEventListener('change', updateTeamBranching);
teamOtherRadio.addEventListener('change', updateTeamBranching);

function updateFrequencyBranching() {
  if (freqSometimesRadio.checked) {
    sometimesReasonBox.classList.remove('hidden');
    sometimesReasonInput.required = true;
  } else {
    sometimesReasonBox.classList.add('hidden');
    sometimesReasonInput.required = false;
    sometimesReasonInput.value = '';
  }
}

freqAlwaysRadio.addEventListener('change', updateFrequencyBranching);
freqSometimesRadio.addEventListener('change', updateFrequencyBranching);

clearSelectionBtn.addEventListener('click', () => {
  teamEleosRadio.checked = false;
  teamOtherRadio.checked = false;
  freqAlwaysRadio.checked = false;
  freqSometimesRadio.checked = false;
  eleosSubBox.classList.add('hidden');
  otherTeamSubBox.classList.add('hidden');
  sometimesReasonBox.classList.add('hidden');
  sometimesReasonInput.required = false;
  otherTeamReasonInput.required = false;
  sometimesReasonInput.value = '';
  otherTeamReasonInput.value = '';
  clearSelectionBtn.classList.add('hidden');
});

// Submit to Formspree Cloud + Local Backup
eleosForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = eleosForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  let selectedTeam = 'Skipped (Optional)';
  let participationFrequency = '—';
  let reason = '—';

  if (teamEleosRadio.checked) {
    selectedTeam = 'Eleos';
    if (freqAlwaysRadio.checked) {
      participationFrequency = 'Participating always';
    } else if (freqSometimesRadio.checked) {
      participationFrequency = 'Sometimes';
      reason = sometimesReasonInput.value.trim();
    } else {
      participationFrequency = 'Not specified';
    }
  } else if (teamOtherRadio.checked) {
    selectedTeam = 'Other teams';
    reason = otherTeamReasonInput.value.trim();
  }

  const entry = {
    fullName: confirmNameInput.value.trim(),
    fatherName: confirmFatherInput.value.trim(),
    phone: confirmPhoneInput.value.trim(),
    team: selectedTeam,
    frequency: participationFrequency,
    reason: reason,
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
      <strong>Team:</strong> ${r.team} | <strong>Frequency:</strong> ${r.frequency}<br/>
      <strong>Reason:</strong> ${r.reason}<br/>
      <small style="color:#777;">Submitted: ${r.submittedAt}</small>
    </div>
  `).join('');
}

document.getElementById('view-responses-btn').addEventListener('click', () => {
  renderResponses();
  showScreen(successScreen);
});

document.getElementById('submit-another-btn').addEventListener('click', () => {
  clearSelectionBtn.click();
  showScreen(formScreen);
});

document.getElementById('export-csv-btn').addEventListener('click', () => {
  if (responses.length === 0) return;
  const headers = ['Full Name', 'Father Name', 'Phone', 'Team', 'Frequency', 'Reason', 'Submitted At'];
  const rows = responses.map(r => [
    r.fullName, r.fatherName, r.phone, r.team, r.frequency, r.reason, r.submittedAt
  ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', 'eleos_responses.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});