
// JS.js
const API_URL =       "http://localhost:8000/people"; // backend API //"https://vutukuruvarshini.github.io/json/people" 
const UPLOAD_URL =    "http://localhost:8000/upload";// upload endpoint for avatars// "https://vutukuruvarshini.github.io/json/upload"  

let currentPage = 1;
let isLoggedIn = false;
let currentUser = null;

// DOM Elements
const loginContainer = document.getElementById("login-container");
const personForm = document.getElementById("personForm");
const peopleContainer = document.getElementById("people");
const paginationContainer = document.getElementById("pagination");
const optionContainer = document.getElementById("option-container");
const loginBtnOption = document.getElementById("login-btn");
const newEntryBtnOption = document.getElementById("new-entry-btn");
const logoutBtn = document.getElementById("logout-btn");

// --- INITIAL STATE ---
function resetView() {
  optionContainer.style.display = "block";
  loginContainer.style.display = "none";
  personForm.style.display = "none";
  peopleContainer.style.display = "none";
  paginationContainer.style.display = "none";
  logoutBtn.style.display = "none";
}
resetView();

// --- Toggle Login / New Person ---
loginBtnOption.addEventListener("click", () => {
  optionContainer.style.display = "none";
  loginContainer.style.display = "block";
  personForm.style.display = "none";
});

newEntryBtnOption.addEventListener("click", () => {
  optionContainer.style.display = "none";
  personForm.style.display = "block";
  loginContainer.style.display = "none";
});

// --- Render Login Form ---
const loginForm = document.createElement("form");
loginForm.innerHTML = `
  <h2>Login</h2>
  <input type="text" id="login_name" placeholder="First Name" required>
  <input type="email" id="login_email" placeholder="Email" required>
  <button type="submit">Login</button>
`;
loginContainer.appendChild(loginForm);

// --- Helper: non-blocking success banner ---
function showBanner(msg, bg = "lightgreen") {
  const bar = document.createElement("div");
  bar.textContent = msg;
  bar.style.background = bg;
  bar.style.padding = "10px";
  bar.style.textAlign = "center";
  bar.style.fontWeight = "600";
  bar.style.borderBottom = "1px solid #ccc";
  document.body.prepend(bar);
  return bar;
}

// --- LOGIN ---
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("login_name").value.trim();
  const email = document.getElementById("login_email").value.trim();

  try {
    const res = await fetch(`${API_URL}/search?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    const found = data.data.find(p => p.first_name.toLowerCase() === name.toLowerCase());

    if (found) {
      isLoggedIn = true;
      currentUser = found;

      const banner = showBanner("Login successful!");
      setTimeout(() => {
        banner.remove();
        showProfilesPage();
      }, 1000);
    } else {
      alert("Invalid login!");
    }
  } catch (err) {
    console.error(err);
    alert("Error logging in!");
  }
});

// --- ADD NEW PERSON ---
personForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("first_name").value.trim();
  const lastName = document.getElementById("last_name").value.trim();
  const email = document.getElementById("email").value.trim();
  const avatarUrl = document.getElementById("avatar_url")?.value.trim() || "";
  const avatarFile = document.getElementById("avatar_file")?.files?.[0];

  let finalAvatarUrl = avatarUrl;

  if (avatarFile) {
    const formData = new FormData();
    formData.append("file", avatarFile);

    try {
      const uploadRes = await fetch(UPLOAD_URL, { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      finalAvatarUrl = uploadData.url;
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Error uploading image!");
      return;
    }
  }

  const person = { first_name: firstName, last_name: lastName, email, avatar: finalAvatarUrl };

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(person)
    });
    alert("New person added successfully!");
    personForm.reset();
    loginContainer.style.display = "block";
    personForm.style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Error adding new person!");
  }
});

// --- LOGOUT ---
logoutBtn.addEventListener("click", () => {
  isLoggedIn = false;
  currentUser = null;
  peopleContainer.innerHTML = "";
  paginationContainer.innerHTML = "";
  resetView();
});

// --- SHOW PROFILES PAGE ---
function showProfilesPage() {
  loginContainer.style.display = "none";
  personForm.style.display = "none";
  optionContainer.style.display = "none";
  logoutBtn.style.display = "block";
  peopleContainer.style.display = "block";
  paginationContainer.style.display = "block";
  loadPeople(1);
}

// --- LOAD PEOPLE ---
async function loadPeople(page = 1) {
  if (!isLoggedIn) return;

  try {
    const res = await fetch(`${API_URL}?page=${page}`);
    const data = await res.json();
    currentPage = page;

    // Clear container
    peopleContainer.innerHTML = "";

    const row4 = document.createElement("div");
    row4.style.display = "flex";
    row4.style.justifyContent = "space-between";
    row4.style.flexWrap = "wrap";
    row4.style.marginBottom = "20px";

    const row2 = document.createElement("div");
    row2.style.display = "flex";
    row2.style.justifyContent = "center";
    row2.style.gap = "20px";

    data.data.forEach((p, index) => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.style.width = "23%";
      card.style.boxSizing = "border-box";
      card.style.textAlign = "center";

      const isOwner = currentUser.id === p.id;

      card.innerHTML = `
        <div style="position:relative;">
          <img src="${p.avatar}" alt="${p.first_name}" class="avatar-img"
            style="width:100px;height:100px;border-radius:50%;object-fit:cover;margin-bottom:10px;cursor:${isOwner ? "pointer" : "default"}"
            onerror="this.src='https://via.placeholder.com/100'">
          <h3 ${isOwner ? 'contenteditable="true"' : ""} style="margin:6px 0;">${p.first_name} ${p.last_name}</h3>
          <p ${isOwner ? 'contenteditable="true"' : ""} class="email-field" style="margin:0;">${p.email}</p>

          <div class="menu" style="position:absolute;top:10px;right:10px;">
            <button class="menu-btn">⋮</button>
            <div class="menu-content" style="display:none;position:absolute;right:0;background:#fff;border:1px solid #ccc;padding:5px;border-radius:4px;z-index:1;">
              ${isOwner ? `<button class="save-btn">Save</button><button class="delete-btn">Delete</button>` : ""}
            </div>
          </div>
        </div>
      `;

      card.querySelector(".menu-btn").addEventListener("click", () => {
        const menu = card.querySelector(".menu-content");
        menu.style.display = menu.style.display === "block" ? "none" : "block";
      });

      if (isOwner) {
        const saveBtn = card.querySelector(".save-btn");
        const deleteBtn = card.querySelector(".delete-btn");
        const avatarImg = card.querySelector(".avatar-img");

        avatarImg.addEventListener("click", () => openAvatarModal(p));

        saveBtn.addEventListener("click", async () => {
          const nameText = card.querySelector("h3").textContent.trim().split(/\s+/);
          const emailText = card.querySelector(".email-field").textContent.trim();
          const updated = {
            first_name: nameText[0],
            last_name: nameText.slice(1).join(" "),
            email: emailText,
            avatar: p.avatar
          };

          await fetch(`${API_URL}/${p.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated)
          });

          alert("Profile updated!");
          loadPeople(currentPage);
        });

        deleteBtn.addEventListener("click", async () => {
          if (!confirm("Are you sure you want to delete your profile?")) return;
          await fetch(`${API_URL}/${p.id}`, { method: "DELETE" });
          alert("Profile deleted!");
          logoutBtn.click();
        });
      }

      if (index < 4) row4.appendChild(card);
      else row2.appendChild(card);
    });

    peopleContainer.appendChild(row4);
    peopleContainer.appendChild(row2);

    // Pagination
    paginationContainer.innerHTML = "";
    for (let i = 1; i <= data.total_pages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === page) btn.disabled = true;
      btn.addEventListener("click", () => loadPeople(i));
      paginationContainer.appendChild(btn);
    }
  } catch (err) {
    console.error(err);
    alert("Error loading profiles!");
  }
}

// --- Avatar Zoom + Change Modal ---
function openAvatarModal(person) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";

  const modal = document.createElement("div");
  modal.style.background = "#fff";
  modal.style.padding = "16px";
  modal.style.borderRadius = "8px";
  modal.style.maxWidth = "90vw";
  modal.style.boxSizing = "border-box";
  modal.style.textAlign = "center";

  modal.innerHTML = `
    <img src="${person.avatar}" alt="avatar" style="max-width:300px; width:100%; height:auto; border-radius:8px;">
    <input type="file" id="newAvatarFile" accept="image/*" style="margin-top:10px; display:block; width:100%;">
    <div style="margin-top:10px;">
      <button id="uploadNewAvatar">Upload</button>
      <button id="closeModal">Back</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector("#closeModal").addEventListener("click", () => overlay.remove());

  modal.querySelector("#uploadNewAvatar").addEventListener("click", async () => {
    const fileInput = modal.querySelector("#newAvatarFile");
    if (fileInput.files.length === 0) return alert("Select a file first!");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
      const uploadRes = await fetch(UPLOAD_URL, { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      const updated = { ...person, avatar: uploadData.url };

      await fetch(`${API_URL}/${person.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });

      alert("Avatar updated!");
      overlay.remove();
      loadPeople(currentPage);
    } catch (err) {
      console.error(err);
      alert("Failed to upload avatar");
    }
  });
}
