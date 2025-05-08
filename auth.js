// auth.js (v4 - Robust Initialization & Persistence)

// --- Core Data Handling ---

function getUsers() {
    try {
        const usersData = localStorage.getItem('nutriFoodUsers');
        if (!usersData) return [];
        const parsed = JSON.parse(usersData);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Error parsing users from localStorage:", error);
        localStorage.removeItem('nutriFoodUsers'); // Clear potentially corrupted data
        return [];
    }
}

function saveUsers(users) {
    if (!Array.isArray(users)) {
        console.error("Attempted to save non-array as users list.");
        return;
    }
    try {
        localStorage.setItem('nutriFoodUsers', JSON.stringify(users));
    } catch (error) {
        console.error("Error saving users list to localStorage:", error);
        if (error.name === 'QuotaExceededError') {
            alert("Error: Storage limit exceeded. Cannot save user data.");
        }
    }
}

function getCurrentUser() {
    try {
        const userData = localStorage.getItem('loggedInUser');
        if (!userData) return null;
        const user = JSON.parse(userData);

        // **Crucial:** Ensure nested objects and arrays exist *after* parsing
        user.foodLog = user.foodLog || [];
        user.partner = user.partner || createDefaultPartnerData(); // Ensure partner object exists
        user.partner.foodLog = user.partner.foodLog || []; // Ensure partner food log exists
        // Ensure goal objects exist
        user.calorieGoal = user.calorieGoal || { min: 1800, max: 2200 };
        user.proteinGoal = user.proteinGoal || { min: 120, max: 180 };
        user.carbGoal = user.carbGoal || { min: 200, max: 250 };
        user.fatGoal = user.fatGoal || { min: 50, max: 80 };
        user.partner.calorieGoal = user.partner.calorieGoal || { min: 1600, max: 2000 };
        user.partner.proteinGoal = user.partner.proteinGoal || { min: 80, max: 120 };
        user.partner.carbGoal = user.partner.carbGoal || { min: 150, max: 200 };
        user.partner.fatGoal = user.partner.fatGoal || { min: 40, max: 60 };


        return user;
    } catch (error) {
        console.error("Error parsing loggedInUser from localStorage:", error);
        try { localStorage.removeItem('loggedInUser'); } catch (e) {}
        return null;
    }
}

// Saves the currently logged-in user's data back to BOTH stores
function saveCurrentUser(userData) {
    if (!userData || !userData.id) {
        console.error("Cannot save current user: Invalid user data or missing ID.", userData);
        return false;
    }
     // Ensure nested objects exist before saving
     userData.foodLog = userData.foodLog || [];
     userData.partner = userData.partner || createDefaultPartnerData();
     userData.partner.foodLog = userData.partner.foodLog || [];

    try {
        localStorage.setItem('loggedInUser', JSON.stringify(userData));
        let allUsers = getUsers();
        const userIndex = allUsers.findIndex(u => u && u.id === userData.id);
        if (userIndex !== -1) {
            allUsers[userIndex] = userData;
        } else {
            console.warn(`User ID ${userData.id} not found in main list. Adding.`);
            allUsers.push(userData);
        }
        saveUsers(allUsers);
        console.log("Current user data saved:", userData);
        return true;
    } catch (error) {
        console.error("Error saving current user data:", error);
        if (error.name === 'QuotaExceededError') {
             alert("Error: Storage limit exceeded. Cannot save user data.");
         }
        return false;
    }
}

// --- Authentication Logic ---

function registerUser(userData) {
    // Basic Input Validation
    if (!userData || !userData.username || !userData.email || !userData.password || !userData.firstName) {
        return { success: false, message: 'Missing required registration fields (username, email, password, first name).' };
    }
    const users = getUsers();
    // Check Existence
    if (users.some(user => user && user.username === userData.username)) {
        return { success: false, message: 'Username already exists.' };
    }
    if (users.some(user => user && user.email === userData.email)) {
        return { success: false, message: 'Email already registered.' };
    }

    // Create New User with ALL nested structures initialized
    const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        firstName: userData.firstName,
        lastName: userData.lastName || '',
        username: userData.username,
        email: userData.email,
        password: userData.password, // WARNING: Hash server-side!
        phone: userData.phone || null,
        dob: userData.dob || null,
        gender: userData.gender || null,
        address: userData.address || null,
        dietaryPreference: userData.dietaryPreference || null,
        fitnessGoal: userData.fitnessGoal || null,
        profilePic: userData.profilePic || createDefaultAvatar(userData.firstName || userData.username),
        currentWeight: userData.currentWeight || null,
        targetWeight: userData.targetWeight || null,
        height: userData.height || null,
        foodLog: [], // Initialize
        // Initialize goals
        calorieGoal: { min: 1800, max: 2200 },
        proteinGoal: { min: 120, max: 180 },
        carbGoal: { min: 200, max: 250 },
        fatGoal: { min: 50, max: 80 },
        waterGoal: 2500,
        // Initialize Partner Data
        partner: createDefaultPartnerData() // Use helper
    };

    users.push(newUser);
    saveUsers(users);
    console.log("User registered:", newUser);
    return { success: true, message: 'Registration successful!' };
}

function loginUser(usernameOrEmail, password) {
    const users = getUsers();
    const user = users.find(u =>
        u && (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password
    );

    if (user) {
        // **Critical Login Initialization Check**
        user.foodLog = user.foodLog || [];
        user.partner = user.partner || createDefaultPartnerData();
        user.partner.foodLog = user.partner.foodLog || [];
        // Ensure goals exist
        user.calorieGoal = user.calorieGoal || { min: 1800, max: 2200 };
        user.proteinGoal = user.proteinGoal || { min: 120, max: 180 };
        // ... check/initialize other goals if needed ...
         user.partner.calorieGoal = user.partner.calorieGoal || { min: 1600, max: 2000 };
         user.partner.proteinGoal = user.partner.proteinGoal || { min: 80, max: 120 };
         // ... check/initialize other partner goals ...

        if (saveCurrentUser(user)) { // Save the potentially updated user object
             console.log("User logged in:", user.username);
             return true;
        } else {
            console.error("Failed to save user session during login.");
            return false;
        }
    }
    console.log("Login failed for:", usernameOrEmail);
    return false;
}

function isUserLoggedIn() {
    return getCurrentUser() !== null;
}

function logoutUser() {
    try { localStorage.removeItem('loggedInUser'); } catch (e) {}
    console.log("User logged out.");
    // Redirect to login page after logout
    window.location.href = 'login.html';
}

// --- Default Data Creation ---

function createDefaultPartnerData() {
    console.log("Creating default partner data structure."); // Debug log
    return {
        name: "Partner", profilePic: createDefaultAvatar("P", 180), age: null, gender: null,
        currentWeight: null, targetWeight: null, height: null, dietaryPreference: null,
        fitnessGoal: null, foodLog: [],
        calorieGoal: { min: 1600, max: 2000 }, proteinGoal: { min: 80, max: 120 },
        carbGoal: { min: 150, max: 200 }, fatGoal: { min: 40, max: 60 }, waterGoal: 1800
    };
}

function createDefaultAvatar(name = '?', size = 180) {
    // Canvas logic remains the same as before
     const canvas = document.createElement('canvas');
     const context = canvas.getContext('2d');
     canvas.width = size; canvas.height = size;
     const colors = ['#1abc9c', '#3498db', '#9b59b6', '#34495e', '#f1c40f', '#e67e22', '#e74c3c', '#2ecc71'];
     context.fillStyle = colors[Math.floor(Math.random() * colors.length)];
     context.fillRect(0, 0, size, size);
     context.fillStyle = "#ffffff"; context.font = `bold ${size * 0.5}px Poppins`;
     context.textAlign = "center"; context.textBaseline = "middle";
     context.fillText((name[0] || '?').toUpperCase(), size / 2, size / 2 + size * 0.05); // Slight vertical adjust
     return canvas.toDataURL();
}

// --- Header UI Update ---
// Use the exact same 'updateHeaderAuthState' function from the previous response
// as it's designed to work with container IDs passed to it.
// Make sure it's included here or correctly sourced.
 function updateHeaderAuthState(authActionsContainerId, userInfoContainerId) {
     const authActionsContainer = document.getElementById(authActionsContainerId);
     const userInfoContainer = document.getElementById(userInfoContainerId);
     const mainNavUl = document.querySelector('header nav ul'); // Re-select nav list

     if (!authActionsContainer || !userInfoContainer || !mainNavUl) {
         console.error("Header elements not found for auth update:", authActionsContainerId, userInfoContainerId);
         return;
     }

     // Clear previous state
     authActionsContainer.innerHTML = '';
     userInfoContainer.innerHTML = '';
     const dynamicLinks = mainNavUl.querySelectorAll('.dynamic-profile-link');
     dynamicLinks.forEach(link => link.remove());
     const staticProfileLinkItem = mainNavUl.querySelector('a[href="profile.html"].active')?.parentElement; // Find static active link item
     if (staticProfileLinkItem && !staticProfileLinkItem.classList.contains('dynamic-profile-link')) {
          staticProfileLinkItem.style.display = 'none'; // Hide static one
     }


     if (isUserLoggedIn()) {
         const user = getCurrentUser();
         if (!user) { logoutUser(); return; }

         // Logged-in User's Pic in Header
         const profilePic = document.createElement('img');
         profilePic.src = user.profilePic || createDefaultAvatar(user.firstName || user.username, 45);
         profilePic.alt = "Profile";
         profilePic.title = "View Profile";
         // Apply styles consistent with previous attempts or CSS
         Object.assign(profilePic.style, {
            width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer',
            border: '2px solid var(--purple)', objectFit: 'cover'
         });
         profilePic.onerror = function() { this.src = createDefaultAvatar(user.firstName || user.username, 45); };
         profilePic.onclick = () => { window.location.href = 'profile.html'; };
         userInfoContainer.appendChild(profilePic);

         // Welcome Message
         const welcomeMsg = document.createElement('span');
         welcomeMsg.textContent = `Hi, ${user.firstName || user.username}!`;
          Object.assign(welcomeMsg.style, {
             fontWeight: '600', color: 'var(--purple)', marginLeft: '8px', whiteSpace: 'nowrap'
          });
         userInfoContainer.appendChild(welcomeMsg);

         // Add Dynamic Profile Link to Nav (if not already there statically)
          // Check if the static one exists AND is currently hidden by our logic
          if (staticProfileLinkItem && staticProfileLinkItem.style.display === 'none') {
             // Make the existing static one visible and mark it dynamic (optional)
              staticProfileLinkItem.style.display = ''; // Make visible
              staticProfileLinkItem.classList.add('dynamic-profile-link'); // Mark it
          } else if (!mainNavUl.querySelector('.dynamic-profile-link')) {
             // Only add if no profile link (static or dynamic) is currently visible/marked
             const profileLi = document.createElement('li');
             profileLi.classList.add('dynamic-profile-link');
             const profileLink = document.createElement('a');
             profileLink.href = 'profile.html';
             profileLink.textContent = 'Profile';
             if (window.location.pathname.includes('profile.html')) {
                 profileLink.classList.add('active'); // Ensure active class is set
             }
             profileLi.appendChild(profileLink);
             if (mainNavUl.children.length > 1) {
                 mainNavUl.insertBefore(profileLi, mainNavUl.children[1]);
             } else {
                 mainNavUl.appendChild(profileLi);
             }
          }


         // Logout Button
         const logoutButton = document.createElement('button');
         logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
         logoutButton.classList.add('logout-btn');
          Object.assign(logoutButton.style, {
             backgroundColor: 'var(--black)', color: 'var(--white)', padding: '10px 18px',
             border: 'none', borderRadius: 'var(--border-radius-lg)', cursor: 'pointer',
             fontSize: '0.9em', fontWeight: '600', marginLeft: '10px', display: 'flex',
             alignItems: 'center', gap: '5px', transition: 'var(--transition-fast)'
         });
         logoutButton.onmouseover = () => { logoutButton.style.backgroundColor = 'var(--red)'; logoutButton.style.transform = 'translateY(-1px)'; };
         logoutButton.onmouseout = () => { logoutButton.style.backgroundColor = 'var(--black)'; logoutButton.style.transform = 'translateY(0)'; };
         logoutButton.onclick = logoutUser;
         authActionsContainer.appendChild(logoutButton);

     } else {
         // Show Sign In Button
         const signInButton = document.createElement('a');
         signInButton.href = 'login.html';
         signInButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
         signInButton.classList.add('sign-in');
          Object.assign(signInButton.style, {
             backgroundColor: 'var(--black)', color: 'var(--white)', padding: '10px 18px',
             border: 'none', borderRadius: 'var(--border-radius-lg)', cursor: 'pointer',
             fontSize: '0.9em', fontWeight: '600', textDecoration: 'none', display: 'flex',
             alignItems: 'center', gap: '5px', transition: 'var(--transition-fast)'
         });
          signInButton.onmouseover = () => { signInButton.style.backgroundColor = 'var(--purple)'; signInButton.style.transform = 'translateY(-1px)'; };
          signInButton.onmouseout = () => { signInButton.style.backgroundColor = 'var(--black)'; signInButton.style.transform = 'translateY(0)'; };
         authActionsContainer.appendChild(signInButton);

         // Ensure static profile link is hidden
          if (staticProfileLinkItem) {
             staticProfileLinkItem.style.display = 'none';
         }
     }
 }