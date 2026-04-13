// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDgzmpEysJqh5AaYKR4bANAiDGMbWsnQnw",
  authDomain: "crisis-sync-01.firebaseapp.com",
  projectId: "crisis-sync-01",
  storageBucket: "crisis-sync-01.firebasestorage.app",
  messagingSenderId: "63822070238",
  appId: "1:63822070238:web:a952e411bc0a491f9ddd4f",
  measurementId: "G-G9T043VLVE"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// ================= AUTH =================

// SIGNUP
function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Signup successful!"))
    .catch(err => alert(err.message));
}

// LOGIN
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login successful!");
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}

// ================= GPS AUTO =================

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      document.getElementById("location").value = lat + "," + lng;
    });
  }
}

// ================= SUBMIT REPORT =================

function submitReport() {
  const title = document.getElementById("title").value;
  const desc = document.getElementById("desc").value;
  const location = document.getElementById("location").value;

  db.collection("reports").add({
    title,
    description: desc,
    location,
    status: "Pending",
    time: new Date()
  })
  .then(() => {
    alert("🚨 Report Submitted!");
    window.location.href = "dashboard.html";
  })
  .catch(err => alert(err.message));
}

// ================= LOAD REPORTS =================

let map;
let markers = [];

function loadReports() {
  const list = document.getElementById("list");

  // INIT MAP
  if (document.getElementById("map")) {
    map = L.map('map').setView([28.6139, 77.2090], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);
  }

  let firstLoad = true;

  db.collection("reports")
    .orderBy("time", "desc")
    .onSnapshot((snapshot) => {

      // ALERT SYSTEM
      if (!firstLoad) {
        alert("🚨 New Crisis Reported!");
      }
      firstLoad = false;

      list.innerHTML = "";
      markers.forEach(m => map.removeLayer(m));
      markers = [];

      const locationCount = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const loc = data.location;

        // COUNT LOCATIONS
        if (locationCount[loc]) {
          locationCount[loc]++;
        } else {
          locationCount[loc] = 1;
        }

        // CREATE CARD
        const div = document.createElement("div");

        div.innerHTML = `
          <h3>${data.title}</h3>
          <p>${data.description}</p>
          <p><b>Location:</b> ${data.location}</p>
          <p><b>Status:</b> ${data.status}</p>

          ${locationCount[loc] >= 3 
            ? "<p style='color:red;'><b>🚨 HIGH RISK AREA</b></p>" 
            : ""
          }

          <button onclick="markResolved('${doc.id}')">
            Mark Resolved
          </button>
        `;

        list.appendChild(div);

        // ================= MAP MARKER =================
        if (map && loc.includes(",")) {
          const coords = loc.split(",");
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);

          const marker = L.marker([lat, lng]).addTo(map)
            .bindPopup(`<b>${data.title}</b><br>${loc}`);

          markers.push(marker);
        }
      });
    });
}

// ================= FILTER =================

function filterReports(type) {
  const list = document.getElementById("list");

  db.collection("reports")
    .orderBy("time", "desc")
    .get()
    .then(snapshot => {
      list.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();

        if (type === "all" || data.title.toLowerCase().includes(type)) {
          const div = document.createElement("div");

          div.innerHTML = `
            <h3>${data.title}</h3>
            <p>${data.description}</p>
            <p>${data.location}</p>
          `;

          list.appendChild(div);
        }
      });
    });
}

// ================= RESOLVE =================

function markResolved(id) {
  db.collection("reports").doc(id).update({
    status: "Resolved"
  });
}