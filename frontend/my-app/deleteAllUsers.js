// delete to delete all users in user authentication table 
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // file in gitignore 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function deleteAllUsers(nextPageToken) {
  const result = await admin.auth().listUsers(1000, nextPageToken);
  const uids = result.users.map(user => user.uid);

  if (uids.length) {
    await admin.auth().deleteUsers(uids);
    console.log(`🧹 Deleted ${uids.length} user(s)`);
  }

  if (result.pageToken) {
    return deleteAllUsers(result.pageToken); // Recursively delete next page
  }
}

deleteAllUsers()
  .then(() => console.log("✅ All users deleted"))
  .catch(err => console.error("❌ Error deleting users:", err));
