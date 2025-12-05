const CSC_CONFIG = {
  cUrl: 'https://api.countrystatecity.in/v1',
  ckey: 'NHhvOEcyWk50N2Vna3VFTE00bFp3MjFKR0ZEOUhkZlg4RTk1MlJlaA=='
};

const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('submitBtn');
const cancelButton = document.getElementById('cancelBtn');
const resultContainer = document.getElementById('resultContainer');
const formTitle = document.getElementById('formTitle');
const countryInput = $('#country');
const stateInput = $('#state');
const cityInput = $('#city');
const tagInput = document.getElementById('tagInput');
const tagBox = document.getElementById('tagBox');
const tagCount = document.getElementById('tagCount');
const tagSuggestionBox = document.getElementById("tagSuggestions");

let maxTags = 20;
let tags = [];
const users = [];
let userIdCounter = 1;
let editMode = false;
let currentEditId = null;

const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

let marker;
let countryBoundaryLayer = [];
let suggestionIndex = -1;
function highlightSuggestion(index) {
  const suggestions = tagSuggestionBox.querySelectorAll("div");
  suggestions.forEach((div, i) => {
    div.classList.toggle("bg-gray-200", i === index);
  });
}

function updateTagCount() {
  tagCount.innerText = `${maxTags - tags.length} tags remaining`;
}

function createTags() {
  tagBox.querySelectorAll('.tag').forEach(li => li.remove());
  tags.slice().forEach(tag => {
    const li = document.createElement('li');
    li.classList.add('tag');
    li.innerHTML = `${tag} <i onclick="removeTag(this,'${tag}')">×</i>`;
    tagBox.insertBefore(li, tagInput);
  });
  updateTagCount();
}

function removeTag(element, tag) {
  tags = tags.filter(t => t !== tag);
  element.parentElement.remove();
  updateTagCount();
}

function getUsedTags() {
  const allTags = users.flatMap(u => u.tags);
  return [...new Set(allTags)];
}


function showTagSuggestions(inputValue) {
  const value = inputValue.toLowerCase().trim();
  tagSuggestionBox.style.display = 'none'; 

  if (value.length > 1) {
    const usedTags = getUsedTags();
    const filtered = usedTags.filter(s =>
      s.toLowerCase().includes(value) && !tags.includes(s)
    );

    if (filtered.length > 0) {
      tagSuggestionBox.innerHTML = "";
      filtered.forEach(suggestion => {
        const div = document.createElement("div");
        div.textContent = suggestion;
        div.onmouseover = () => {
          suggestionIndex = -1;
          highlightSuggestion(-1);
        };

       
        div.onclick = () => {
          if (!tags.includes(suggestion) && tags.length < maxTags) {
            tags.push(suggestion);
            createTags();
          }
          tagInput.value = "";
          tagSuggestionBox.style.display = "none";
          suggestionIndex = -1;
        };

        tagSuggestionBox.appendChild(div);
      });
      tagSuggestionBox.style.display = "block";
      suggestionIndex = -1; 
    }
  }
}


tagInput.addEventListener('keyup', e => {
  const value = tagInput.value.toLowerCase().trim();
  const suggestions = tagSuggestionBox.querySelectorAll("div");

  if (tagSuggestionBox.style.display === "block" && suggestions.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      suggestionIndex = (suggestionIndex + 1) % suggestions.length;
      highlightSuggestion(suggestionIndex);
      return;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      suggestionIndex = (suggestionIndex - 1 + suggestions.length) % suggestions.length;
      highlightSuggestion(suggestionIndex);
      return;
    } else if (e.key === 'Enter' && suggestionIndex !== -1) {
      e.preventDefault();
      suggestions[suggestionIndex].click(); 
      tagInput.value = ""; 
      suggestionIndex = -1; 
      return;
    }
  }
  
 
  if (!['ArrowDown', 'ArrowUp', 'Enter', ','].includes(e.key)) {
     showTagSuggestions(tagInput.value);
  }

  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    let newTag = tagInput.value.replace(/,/g, '').trim();

    if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
      tags.push(newTag);
      createTags();
    }

    tagInput.value = "";
    tagSuggestionBox.style.display = 'none';
  }
});
tagInput.addEventListener("blur", () => {
  setTimeout(() => tagSuggestionBox.style.display = "none", 200);
});

tagInput.addEventListener('focus', () => {
  tagBox.classList.add('always-active');
  showTagSuggestions(tagInput.value); 
});

tagInput.addEventListener('keydown', event => {
  if (tagInput.value.trim() !== "") return;

  if (event.key === "Backspace") {
    if (tags.length > 0) {
      tags.pop();
      createTags();
    }
  }
});

tagInput.addEventListener('focus', () => tagBox.classList.add('always-active'));
tagInput.addEventListener('blur', () => tagBox.classList.remove('always-active'));

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `px-4 py-3 rounded-lg shadow-md text-white ${type === "success" ? "bg-green-500" : "bg-red-500"} transition transform animate-fadeInUp`;
  toast.textContent = message;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

function resetForm() {
  firstNameInput.value = "";
  lastNameInput.value = "";
  emailInput.value = "";
  passwordInput.value = "";
  countryInput.val(null).trigger('change');
  stateInput.val(null).trigger('change');
  cityInput.val(null).trigger('change');
  tags = [];
  createTags();
  editMode = false;
  currentEditId = null;
  submitButton.textContent = "Submit";
  formTitle.textContent = "Create Account";
  cancelButton.classList.add("hidden");
  if (marker) marker.remove();
  countryBoundaryLayer.forEach(layer => {
    map.removeLayer(layer);
  });
  countryBoundaryLayer = [];
  map.setView([20, 0], 2);
}

function maintainActive(select) {
  select.on("select2:open", function () {
    $(this).next('.select2-container').find('.select2-selection').addClass("always-active");
  });
  select.on("select2:close", function () {
    $(this).next('.select2-container').find('.select2-selection').removeClass("always-active");
  });
}

function setSelect2EditValue(selectInput, value, text) {
  selectInput.empty();
  if (value) {
    const newOption = new Option(text, value, true, true);
    selectInput.append(newOption);
    selectInput.trigger('change');
  } else {
    selectInput.val(null).trigger('change');
  }
}

async function fetchAndSetDependentLocation(countryCode, stateCode, cityName) {
  if (countryCode) {
    try {
      const stateRes = await fetch(`${CSC_CONFIG.cUrl}/countries/${countryCode}/states`, {
        headers: { "X-CSCAPI-KEY": CSC_CONFIG.ckey }
      });
      const states = await stateRes.json();
      const stateData = states.find(s => s.iso2 === stateCode);
      if (stateData) {
        setSelect2EditValue(stateInput, stateData.iso2, stateData.name);
        if (stateCode) {
          try {
            const cityRes = await fetch(`${CSC_CONFIG.cUrl}/countries/${countryCode}/states/${stateCode}/cities`, {
              headers: { "X-CSCAPI-KEY": CSC_CONFIG.ckey }
            });
            const cities = await cityRes.json();
            const cityData = cities.find(c => c.name === cityName);
            if (cityData) {
              setSelect2EditValue(cityInput, cityData.name, cityData.name);
            }
          } catch (err) {
            console.error("Error fetching city for edit:", err);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching state for edit:", err);
    }
  }
}

function renderUsers() {
  resultContainer.innerHTML = "";
  users.forEach(user => {
    const card = document.createElement("div");
    card.className = "relative flex flex-col items-start gap-2 p-5 w-[300px] rounded-xl bg-gradient-to-br from-white via-[#e8faff] to-[#f5fff3] shadow-lg border border-[#d1fae5] transform hover:scale-105 transition-all duration-300";

    let tagsHtml = user.tags.map(tag => `<li class="tag result-tag">${tag}</li>`).join('');
    const tagsDisplay = `<div class="flex flex-wrap items-center mt-1">${tagsHtml}</div>`;

    card.innerHTML = `
      <div class="absolute top-3 right-3 flex gap-2">
        <button class="edit-btn" title="Edit">
          <i class="hgi hgi-stroke hgi-edit-03 text-blue-500 w-5 h-5 hover:scale-110 transition"></i>
        </button>
        <button class="delete-btn" title="Delete">
          <i class="hgi hgi-stroke hgi-delete-03 text-red-500 w-5 h-5 hover:scale-110 transition"></i>
        </button>
      </div>
      <h3 class="text-lg font-semibold text-[#0f766e] mb-2">User Information</h3>
      <p><span class="font-semibold text-[#14532d]">First Name:</span> ${user.firstName}</p>
      <p><span class="font-semibold text-[#14532d]">Last Name:</span> ${user.lastName}</p>
      <p><span class="font-semibold text-[#14532d]">Email:</span> ${user.email}</p>
      <p><span class="font-semibold text-[#14532d]">Password:</span> ${user.password}</p>
      <p><span class="font-semibold text-[#14532d]">Country:</span> ${user.countryName}</p>
      <p><span class="font-semibold text-[#14532d]">State:</span> ${user.stateName}</p>
      <p><span class="font-semibold text-[#14532d]">City:</span> ${user.city}</p>
      <p class="w-full"><span class="font-semibold text-[#14532d]">Tags:</span></p>
      ${tagsDisplay}
    `;

    card.querySelector(".edit-btn").addEventListener("click", () => {
      editMode = true;
      currentEditId = user.id;
      firstNameInput.value = user.firstName;
      lastNameInput.value = user.lastName;
      emailInput.value = user.email;
      passwordInput.value = user.password;
      tags = [...user.tags];
      createTags();
      submitButton.textContent = "Update";
      formTitle.textContent = "Update User";
      cancelButton.classList.remove("hidden");

      setSelect2EditValue(countryInput, user.country, user.countryName);

      setTimeout(() => {
        fetchAndSetDependentLocation(user.country, user.state, user.city);
      }, 500);
    });

    card.querySelector(".delete-btn").addEventListener("click", () => {
      const index = users.findIndex(u => u.id === user.id);
      users.splice(index, 1);
      showToast("User deleted!", "error");
      renderUsers();
    });

    resultContainer.appendChild(card);
  });
}

submitButton.addEventListener("click", () => {
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();
  const country = countryInput.val();
  const state = stateInput.val();
  const city = cityInput.val();
  const countryName = countryInput.find('option:selected').text();
  const stateName = stateInput.find('option:selected').text();
  if (!firstName || !lastName || !email || !password || !country || !state || !city) {
    showToast("Please fill all fields!", "error");
    return;
  }
  if (!isValidEmail(email)) {
    showToast("Invalid email format!", "error");
    return;
  }

  const userData = {
    firstName,
    lastName,
    email,
    password,
    country,
    state,
    city,
    tags: [...tags],
    countryName,
    stateName
  };

  if (editMode) {
    const user = users.find(u => u.id === currentEditId);
    if (!user) return;
    const duplicate = users.find(u => u.email === email && u.id !== currentEditId);
    if (duplicate) {
      showToast("Email already exists!", "error");
      return;
    }
    Object.assign(user, userData);
    showToast("User updated successfully!");
  } else {
    const duplicate = users.find(u => u.email === email);
    if (duplicate) {
      showToast("Email already exists!", "error");
      return;
    }
    const newUser = { id: userIdCounter++, ...userData };
    users.push(newUser);
    showToast("User added successfully!");
  }

  resetForm();
  renderUsers();
});

cancelButton.addEventListener('click', () => {
  resetForm();
  showToast("Edit cancelled.", "error");
});

function initCountrySelect2() {
  $('.country-select-placeholder').remove();
  countryInput.select2({
    ajax: {
      url: `${CSC_CONFIG.cUrl}/countries`,
      dataType: 'json',
      delay: 250,
      headers: { "X-CSCAPI-KEY": CSC_CONFIG.ckey },
      data: function (params) { return { search: params.term }; },
      processResults: function (data, params) {
        const searchTerm = (params.term || '').toLowerCase();
        const filteredData = data.filter(country => country.name.toLowerCase().includes(searchTerm))
          .map(country => ({ id: country.iso2, text: country.name }));
        return { results: filteredData };
      },
      cache: true
    },
    placeholder: 'Search country...',
    minimumInputLength: 0,
    width: '100%',
    dropdownParent: countryInput.parent(),
    language: { searching: () => '', noResults: () => 'No results found' }
  });
  maintainActive(countryInput);
}

function initStateSelect2() {
  $('.state-select-placeholder').remove();
  stateInput.select2({
    ajax: {
      url: function() {
        const countryCode = countryInput.val();
        if (!countryCode) return '';
        return `${CSC_CONFIG.cUrl}/countries/${countryCode}/states`;
      },
      dataType: 'json',
      delay: 250,
      headers: { "X-CSCAPI-KEY": CSC_CONFIG.ckey },
      data: function (params) { return { search: params.term }; },
      processResults: function (data, params) {
        const searchTerm = (params.term || '').toLowerCase();
        const filteredData = data.filter(state => state.name.toLowerCase().includes(searchTerm))
          .map(state => ({ id: state.iso2, text: state.name }));
        return { results: filteredData };
      },
      cache: true
    },
    placeholder: 'Select a country first',
    minimumInputLength: 0,
    width: '100%',
    dropdownParent: stateInput.parent(),
    language: { searching: () => '', noResults: () => 'No results found' }
  });
  maintainActive(stateInput);
}

function initCitySelect2() {
  $('.city-select-placeholder').remove();
  cityInput.select2({
    ajax: {
      url: function() {
        const countryCode = countryInput.val();
        const stateCode = stateInput.val();
        if (!countryCode || !stateCode) return '';
        return `${CSC_CONFIG.cUrl}/countries/${countryCode}/states/${stateCode}/cities`;
      },
      dataType: 'json',
      delay: 250,
      headers: { "X-CSCAPI-KEY": CSC_CONFIG.ckey },
      data: function (params) { return { search: params.term }; },
      processResults: function (data, params) {
        const searchTerm = (params.term || '').toLowerCase();
        const filteredData = data.filter(city => city.name.toLowerCase().includes(searchTerm))
          .map(city => ({ id: city.name, text: city.name }));
        return { results: filteredData };
      },
      cache: true
    },
    placeholder: 'Select a state first',
    minimumInputLength: 0,
    width: '100%',
    dropdownParent: cityInput.parent(),
    language: { searching: () => '', noResults: () => 'No results found' }
  });
  maintainActive(cityInput);
}

async function drawCountryBoundary(countryName) {
  countryBoundaryLayer.forEach(layer => {
    map.removeLayer(layer);
  });
  countryBoundaryLayer = []; 

  if (!countryName) return;

  try {
    const searchRes = await fetch(`https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(countryName)}&format=json&polygon_geojson=1&limit=1`);
    const searchData = await searchRes.json();

    if (!searchData || searchData.length === 0 || !searchData[0].geojson) return;

    const geojsonData = searchData[0].geojson;
    const newLayer = L.geoJSON(geojsonData, {
      style: { color: "red", weight: 2, opacity: 0.5, fillColor: "green", fillOpacity: 0.1 }
    }).addTo(map);
    
 
    countryBoundaryLayer.push(newLayer);

    map.fitBounds(newLayer.getBounds());

  } catch (err) {
    console.error("Error drawing country boundary:", err);
    showToast("Failed to load country boundary on map", "error");
  }
}

async function updateMap() {
  const countryName = countryInput.find('option:selected').text();
  const stateName = stateInput.find('option:selected').text();
  const cityName = cityInput.find('option:selected').text();
  drawCountryBoundary(countryInput.val() ? countryName : null);

  let query = '';

  if (cityInput.val()) query = `${cityName}, ${stateName}, ${countryName}`;
  else if (stateInput.val()) query = `${stateName}, ${countryName}`;
  else if (!countryInput.val()) {
    if (marker) marker.remove();
    map.setView([20, 0], 2);
    return;
  } else return;

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data.length) return showToast("Location not found on map", "error");

    const lat = data[0].lat;
    const lon = data[0].lon;

    if (marker) marker.remove();
    marker = L.marker([lat, lon]).addTo(map);

    map.setView([lat, lon], cityInput.val() ? 4 : stateInput.val() ? 4 : 4);

  } catch (err) {
    console.error("Error updating map:", err);
    showToast("Failed to update map", "error");
  }
}
function attachSelect2Handlers() {
  countryInput.on('change', function (e) {
    const countryCode = $(this).val();
    stateInput.val(null).trigger('change');
    cityInput.val(null).trigger('change');

    if (countryCode) {
      stateInput.prop('disabled', false);
    } else {
      stateInput.prop('disabled', true);
      stateInput.val(null).trigger('change');
      cityInput.prop('disabled', true);
      cityInput.val(null).trigger('change');
    }
    updateMap();
  });

  stateInput.on('change', function (e) {
    const stateCode = $(this).val();
    cityInput.val(null).trigger('change');

    if (stateCode) {
      cityInput.prop('disabled', false);
    } else {
      cityInput.prop('disabled', true);
      cityInput.val(null).trigger('change');
    }
    updateMap();
  });

  cityInput.on('change', updateMap);
}

$(document).ready(function () {
  initCountrySelect2();
  initStateSelect2();
  initCitySelect2();
  attachSelect2Handlers();
  createTags();
  stateInput.prop('disabled', true);
  cityInput.prop('disabled', true);

  $(document).on("select2:open", () => {
    const searchField = document.querySelector(".select2-container--open .select2-search__field");
    if(searchField) searchField.focus();
  });
});
const style = document.createElement('style');
style.textContent = `
  .select2-results__option--loading {
    display: none !important;
  }
  .select2-results__message {
    display: none !important;
  }
`;
document.head.appendChild(style);
