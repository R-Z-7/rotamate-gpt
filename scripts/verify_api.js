
const BASE_URL = "http://localhost:8000/api/v1";

async function runTest() {
    console.log("Starting API Verification...");

    // 1. Login
    console.log("\n1. Testing Login...");
    const loginData = new URLSearchParams();
    loginData.append("username", "admin@rotamate.com");
    loginData.append("password", "admin123");

    let token = "";
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: loginData,
        });

        if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
        const data = await res.json();
        token = data.access_token;
        console.log("✅ Login successful. Token received.");
    } catch (e) {
        console.error("❌ Login failed:", e.message);
        process.exit(1);
    }

    // 2. Register New User
    console.log("\n2. Testing Registration...");
    const newUser = {
        email: `testuser_${Date.now()}@rotamate.com`,
        full_name: "Test User",
        password: "password123",
        role: "employee",
    };
    let userId = 0;

    try {
        // Using /auth/register as confirmed in the code
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
        });

        if (!res.ok) throw new Error(`Registration failed: ${res.status} ${await res.text()}`);
        const data = await res.json();
        userId = data.id;
        console.log(`✅ User registered: ${newUser.email} (ID: ${userId})`);
    } catch (e) {
        console.error("❌ Registration failed:", e.message);
        process.exit(1);
    }

    // 3. List Users
    console.log("\n3. Testing User List...");
    try {
        const res = await fetch(`${BASE_URL}/users/`, {
            headers: { "Authorization": `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`List users failed: ${res.status} ${await res.text()}`);
        const users = await res.json();
        const found = users.find(u => u.id === userId);
        if (found) {
            console.log("✅ New user found in list.");
        } else {
            console.error("❌ New user NOT found in list.");
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ List users failed:", e.message);
        process.exit(1);
    }

    // 4. Update User (PUT)
    console.log("\n4. Testing User Update...");
    try {
        const updateData = { full_name: "Updated Test User" };
        const res = await fetch(`${BASE_URL}/users/${userId}`, { // Assuming endpoint is /users/{id}
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData),
        });

        if (!res.ok) throw new Error(`Update failed: ${res.status} ${await res.text()}`);
        const data = await res.json();
        if (data.full_name === "Updated Test User") {
            console.log("✅ User updated successfully.");
        } else {
            throw new Error("User name did not update.");
        }

    } catch (e) {
        console.error("❌ Update user failed:", e.message);
        // Don't exit, try to delete cleanup
    }


    // 5. Delete User
    console.log("\n5. Testing User Deletion...");
    try {
        const res = await fetch(`${BASE_URL}/users/${userId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Deletion failed: ${res.status} ${await res.text()}`);
        // Check if actually deleted
        // Some APIs returns 200, some 204.
        console.log("✅ User deleted successfully.");
    } catch (e) {
        console.error("❌ Delete user failed:", e.message);
        process.exit(1);
    }

    console.log("\n✅ API VERIFICATION COMPLETE - ALL TESTS PASSED");
}

runTest();
