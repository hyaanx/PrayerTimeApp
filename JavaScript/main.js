// ====== DOM ELEMENTS ======
const pageHeader = document.querySelector(".head");
const adhanNameDisplay = document.querySelector(".adhan-name");
const adhanTimeDisplay = document.querySelector(".adhan-time");
const cityTitleDisplay = document.querySelector(".localization h1");
const prayerCards = document.querySelectorAll(".timings > div");
const prayerTimeFields = document.querySelectorAll(".timings > div span div");
const dateDisplay = document.querySelector(".date");
const citySelect = document.getElementById("citySelect");
const dayNavigationButtons = document.querySelectorAll(".navigation");

// ====== STATE OBJECT ======
const state = {
  now: new Date(),
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  currentDay: new Date().getUTCDate(),
  currentHour: new Date().getHours(),
  currentMinute: new Date().getMinutes(),
  currentTimeInMinutes: 0,
  daysInMonth: new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate(),
  prayerTimesInMinutes: [],
  countdownInterval: null,
  activePrayerCard: document.querySelector(".timings .active"),
  autoCountdown: true,
  city: citySelect.value,
  country: citySelect.options[citySelect.selectedIndex].dataset.country,
};

// ====== MAIN FUNCTIONS ======

// 🔹 1. Fetch prayer times from API
async function fetchPrayerTimes(country, city) {
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/calendarByCity/${state.currentYear}/${state.currentMonth}?country=${country}&city=${city}`
    );
    const data = await res.json();

    if (!data?.data?.[state.currentDay - 1]) {
      console.error("Prayer data not available");
      return;
    }

    const todayPrayerData = data.data[state.currentDay - 1];
    updatePrayerDisplay(todayPrayerData);
  } catch (error) {
    console.error("Error fetching prayer times:", error);
  }
}

// 🔹 2. Update page with prayer times
function updatePrayerDisplay(todayPrayerData) {
  state.prayerTimesInMinutes = [];

  prayerCards.forEach((card, index) => {
    const prayerName = card.classList[0];
    const timeString = todayPrayerData.timings[prayerName].slice(0, 5);
    const [hour, minute] = timeString.split(":").map(Number);
    const timeInMinutes = hour * 60 + minute;

    state.prayerTimesInMinutes.push(timeInMinutes);
    prayerTimeFields[index].textContent = timeString;
  });

  state.currentTimeInMinutes = state.currentHour * 60 + state.currentMinute;
  const nextPrayerTime = getNextPrayerTime();

  if (!nextPrayerTime) state.autoCountdown = false;

  if (state.autoCountdown && nextPrayerTime) {
    activateNextPrayerCard(nextPrayerTime);
    startCountdown(nextPrayerTime);
  }

  updateUI(todayPrayerData);
}

// 🔹 3. Get next upcoming prayer
function getNextPrayerTime() {
  const upcoming = state.prayerTimesInMinutes.filter(
    (time) => time >= state.currentTimeInMinutes
  );
  return upcoming.length ? Math.min(...upcoming) : null;
}

// 🔹 4. Start countdown (محسّن)
function startCountdown(nextPrayerTime) {
  if (state.countdownInterval) clearInterval(state.countdownInterval);


  let timeRemaining = nextPrayerTime - state.currentTimeInMinutes;
  let remainingHours = Math.floor(timeRemaining / 60);
  let remainingMinutes = timeRemaining % 60;
  let remainingSeconds = 0;

  state.countdownInterval = setInterval(() => {
    const displayHours = remainingHours.toString().padStart(2, "0");
    const displayMinutes = remainingMinutes.toString().padStart(2, "0");
    const displaySeconds = remainingSeconds.toString().padStart(2, "0");

    
    // 🔹 تحديث البطاقة النشطة فقط
    if (state.activePrayerCard) {
      const card = state.activePrayerCard;
      adhanNameDisplay.textContent = card.children[0].textContent;
      adhanTimeDisplay.textContent = `-${displayHours}:${displayMinutes}:${displaySeconds}`;
      pageHeader.style.backgroundImage = `url("../Image/${card.classList[0]}.webp")`;
    }

    // تحديث الوقت المتبقي
    remainingSeconds--;
    if (remainingSeconds < 0) {
      remainingSeconds = 59;
      remainingMinutes--;
      if (remainingMinutes < 0) {
        remainingMinutes = 59;
        remainingHours--;
      }
    }


    // نهاية العد التنازلي
    if (remainingHours <= 0 && remainingMinutes <= 0 && remainingSeconds <= 0) {
      clearInterval(state.countdownInterval);
      adhanTimeDisplay.textContent = "It's prayer time 🕌";
    }

    if (!state.autoCountdown) {
      clearInterval(state.countdownInterval);
      adhanNameDisplay.textContent =
        state.activePrayerCard.children[0].textContent;
      adhanTimeDisplay.textContent =
        state.activePrayerCard.children[1].textContent;
    }
  }, 1000);
}

// 🔹 5. Highlight next prayer card
function activateNextPrayerCard(nextPrayerTime) {
  // const nextHour = Math.floor(nextPrayerTime / 60);
  // const nextMinute = nextPrayerTime % 60;
  const nextHour = Math.floor(nextPrayerTime / 60)
    .toString()
    .padStart(2, "0");
  const nextMinute = nextPrayerTime % (60).toString().padStart(2, "0");

  prayerCards.forEach((card) => card.classList.remove("active"));

  prayerCards.forEach((card) => {
    if (
      card.children[1].children[0].textContent.slice(0, 2) == nextHour &&
      card.children[1].children[0].textContent.slice(3, 5) == nextMinute
    ) {
      card.classList.add("active");
      state.activePrayerCard = card;
    }
  });
}

// 🔹 6. Update UI
function updateUI(todayPrayerData) {
  if (state.activePrayerCard) {
    pageHeader.style.backgroundImage = `url("../Image/${state.activePrayerCard.classList[0]}.webp")`;
    adhanNameDisplay.textContent =
      state.activePrayerCard.children[0].textContent;
    adhanTimeDisplay.textContent =
      state.activePrayerCard.children[1].textContent;
  }
  dateDisplay.textContent = todayPrayerData.date.readable;
  cityTitleDisplay.textContent = state.city;
}

// 🔹 7. City change
function handleCityChange() {
  clearInterval(state.countdownInterval);
  state.city = citySelect.value;
  state.country = citySelect.options[citySelect.selectedIndex].dataset.country;
  state.autoCountdown = true;
  fetchPrayerTimes(state.country, state.city);
}

// 🔹 8. Day navigation
function handleDayNavigation(next = true) {
  state.currentDay += next ? 1 : -1;
  if (state.currentDay < 1) state.currentDay = 1;
  if (state.currentDay > state.daysInMonth)
    state.currentDay = state.daysInMonth;
  fetchPrayerTimes(state.country, state.city);
}

// ====== EVENT LISTENERS ======
citySelect.addEventListener("change", handleCityChange);

prayerCards.forEach((card) => {
  card.addEventListener("click", () => {
    state.autoCountdown = false;
    prayerCards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    state.activePrayerCard = card;
    updateUI({ date: { readable: dateDisplay.textContent } });
  });
});

dayNavigationButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.autoCountdown = false;
    handleDayNavigation(btn.classList.contains("button-next"));
  });
});

// ====== INITIAL CALL ======
fetchPrayerTimes(state.country, state.city);
