const adminDashboard = document.getElementById('adminDashboard');
const doctorDashboard = document.getElementById('doctorDashboard');
const patientBooking = document.getElementById('patientBooking');

const adminBtn = document.getElementById('adminBtn');
const doctorBtn = document.getElementById('doctorBtn');
const patientBtn = document.getElementById('patientBtn');

const dashboards = [adminDashboard, doctorDashboard, patientBooking];

function showDashboard(activeDashboard) {
  dashboards.forEach(dashboard => dashboard.classList.add('hidden'));
  activeDashboard.classList.remove('hidden');
}

adminBtn.addEventListener('click', () => showDashboard(adminDashboard));
doctorBtn.addEventListener('click', () => showDashboard(doctorDashboard));
patientBtn.addEventListener('click', () => showDashboard(patientBooking));

// Initialize data from localStorage or set to empty arrays
let hospitals = JSON.parse(localStorage.getItem('hospitals')) || [];
let doctors = JSON.parse(localStorage.getItem('doctors')) || [];
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];

// Save data to localStorage
function saveToLocalStorage() {
  localStorage.setItem('hospitals', JSON.stringify(hospitals));
  localStorage.setItem('doctors', JSON.stringify(doctors));
  localStorage.setItem('appointments', JSON.stringify(appointments));
}

// Update hospital dropdowns (for department addition and other sections)
function updateHospitalDropdown() {
  const hospitalSelect = document.getElementById('hospitalSelect');
  const doctorHospital = document.getElementById('doctorHospital');
  const searchHospital = document.getElementById('searchHospital');
  hospitalSelect.innerHTML = '<option value="">Select Hospital</option>';
  doctorHospital.innerHTML = '<option value="">Select Hospital</option>';
  searchHospital.innerHTML = '<option value="">Select Hospital</option>';
  hospitals.forEach(hospital => {
    const option = `<option value="${hospital.name}">${hospital.name}</option>`;
    hospitalSelect.innerHTML += option;
    doctorHospital.innerHTML += option;
    searchHospital.innerHTML += option;
  });
}

// Update hospital list display
function updateHospitalList() {
  const hospitalList = document.getElementById('hospitalList');
  hospitalList.innerHTML = '';
  hospitals.forEach(hospital => {
    const card = document.createElement('div');
    card.className = 'hospital-card';
    card.innerHTML = `
      <h4 class="font-semibold text-lg">${hospital.name} (${hospital.location})</h4>
      <p>Departments: ${hospital.departments.length ? hospital.departments.join(', ') : 'None'}</p>
    `;
    hospitalList.appendChild(card);
  });
}

// Hospital Registration with Unique Name Check
document.getElementById('registerHospital').addEventListener('click', () => {
  const name = document.getElementById('hospitalName').value.trim();
  const location = document.getElementById('hospitalLocation').value.trim();
  if (name && location) {
    const exists = hospitals.some(hospital => hospital.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert('Hospital with this name already exists! Please choose a different name.');
      return;
    }
    hospitals.push({ name, location, departments: [], doctors: [] });
    saveToLocalStorage();
    updateHospitalDropdown();
    updateHospitalList();
    alert('Hospital registered successfully!');
  } else {
    alert('Please enter both hospital name and location.');
  }
});

// Department Addition
document.getElementById('addDepartment').addEventListener('click', () => {
  const hospitalName = document.getElementById('hospitalSelect').value;
  const deptName = document.getElementById('departmentName').value.trim();
  if (!hospitalName) {
    alert('Please select a hospital!');
    return;
  }
  if (deptName) {
    const hospital = hospitals.find(h => h.name === hospitalName);
    if (hospital) {
      hospital.departments.push(deptName);
      saveToLocalStorage();
      updateHospitalList();
      alert('Department added!');
    }
  } else {
    alert('Please enter a department name!');
  }
});

// Doctor Registration with Email and Password
document.getElementById('registerDoctor').addEventListener('click', () => {
  const name = document.getElementById('doctorName').value.trim();
  const email = document.getElementById('doctorEmail').value.trim();
  const password = document.getElementById('doctorPassword').value.trim();
  const specializations = document.getElementById('doctorSpecialization').value.split(',').map(s => s.trim());
  const experience = document.getElementById('doctorExperience').value;
  if (name && email && password && specializations.length && experience) {
    const emailExists = doctors.some(doctor => doctor.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      alert('A doctor with this email already exists! Please use a different email.');
      return;
    }
    doctors.push({ name, email, password, specializations, experience, slots: [], earnings: 0, consultations: 0 });
    saveToLocalStorage();
    alert('Doctor registered!');
    updateStats();
  } else {
    alert('Please fill in all fields (name, email, password, specializations, experience).');
  }
});

// Add Availability
document.getElementById('addAvailability').addEventListener('click', () => {
  const hospital = document.getElementById('doctorHospital').value;
  const slot = document.getElementById('doctorSlot').value;
  const fee = document.getElementById('consultationFee').value;
  if (hospital && slot && fee) {
    const doctor = doctors[doctors.length - 1];
    const isConflict = doctor.slots.some(s => s.slot === slot);
    if (!isConflict) {
      doctor.slots.push({ hospital, slot, fee: parseFloat(fee) });
      saveToLocalStorage();
      alert('Availability added!');
    } else {
      alert('Conflicting time slot!');
    }
  }
});

// Search Doctors
document.getElementById('searchDoctors').addEventListener('click', () => {
  const patientName = document.getElementById('patientName').value.trim();
  const specialization = document.getElementById('searchSpecialization').value.trim();
  const hospital = document.getElementById('searchHospital').value;
  const doctorList = document.getElementById('doctorList');
  doctorList.innerHTML = '';
  if (!patientName) {
    alert('Please enter your name!');
    return;
  }
  doctors.forEach(doctor => {
    if ((!specialization || doctor.specializations.includes(specialization)) &&
        (!hospital || doctor.slots.some(s => s.hospital === hospital))) {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded shadow';
      const slotOptions = doctor.slots.length
        ? doctor.slots.map((s, index) => `<option value="${index}">${new Date(s.slot).toLocaleString()}</option>`).join('')
        : '<option value="">No slots available</option>';
      card.innerHTML = `
        <h4 class="font-semibold">${doctor.name}</h4>
        <p>Specializations: ${doctor.specializations.join(', ')}</p>
        <p>Experience: ${doctor.experience} years</p>
        <select class="slot-select" data-doctor="${doctor.name}">
          <option value="">Select Time Slot</option>
          ${slotOptions}
        </select>
        <button class="bookBtn bg-blue-500 text-white p-2 rounded mt-2" data-doctor="${doctor.name}" disabled>Book</button>
      `;
      doctorList.appendChild(card);
    }
  });

  // Enable/disable Book button based on slot selection
  document.querySelectorAll('.slot-select').forEach(select => {
    select.addEventListener('change', () => {
      const bookBtn = select.parentElement.querySelector('.bookBtn');
      bookBtn.disabled = !select.value;
    });
  });

  // Book Appointment
  document.querySelectorAll('.bookBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const doctorName = btn.dataset.doctor;
      const doctor = doctors.find(d => d.name === doctorName);
      const slotIndex = btn.parentElement.querySelector('.slot-select').value;
      if (slotIndex === '') {
        alert('Please select a time slot!');
        return;
      }
      const slot = doctor.slots[slotIndex];
      if (slot) {
        appointments.push({
          patientName,
          doctor: doctorName,
          hospital: slot.hospital,
          slot: slot.slot,
          fee: slot.fee
        });
        doctor.earnings += slot.fee * 0.6;
        doctor.consultations += 1;
        doctor.slots.splice(slotIndex, 1); // Remove the booked slot
        saveToLocalStorage();
        alert('Appointment booked!');
        updateStats();
        document.getElementById('searchDoctors').click(); // Refresh doctor list
      }
    });
  });
});

// Update Stats
function updateStats() {
  document.getElementById('totalConsultations').textContent = appointments.length;
  document.getElementById('totalRevenue').textContent = appointments.reduce((sum, a) => sum + a.fee * 0.4, 0);
  document.getElementById('hospitalDoctors').textContent = doctors.map(d => d.name).join(', ') || 'None';
  if (doctors.length) {
    document.getElementById('doctorEarnings').textContent = doctors[0].earnings;
    document.getElementById('doctorConsultations').textContent = doctors[0].consultations;
  }
}

// Initialize: Load data and update UI
updateHospitalDropdown();
updateHospitalList();
updateStats();
showDashboard(adminDashboard);