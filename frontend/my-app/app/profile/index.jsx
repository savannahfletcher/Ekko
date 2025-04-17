import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TextInput } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, getDoc, getDocs, collection, doc, setDoc, deleteDoc,query, where, } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { TouchableOpacity, Modal } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { useFonts } from 'expo-font';
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator"; // ✅ Import Image Manipulator
import { serverTimestamp } from 'firebase/firestore';
import { getAuth, signOut, deleteUser } from "firebase/auth";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';



const ProfileScreen = () => {
    const [personalSongs, setPersonalSongs] = useState([]);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState("Loading...");
    const [profilePic, setProfilePic] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [matchedUsers, setMatchedUsers] = useState([]);
    const [currentFriends, setCurrentFriends] = useState([]);
    const [friendsList, setFriendsList] = useState([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newProfilePic, setNewProfilePic] = useState("");
    const router = useRouter(); 

    const [fontsLoaded] = useFonts({
        'MontserratAlternates-ExtraBold': require('./../../assets/fonts/MontserratAlternates-ExtraBold.ttf'),
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                fetchUserData(user.uid);
                fetchPersonalSongs(user.uid);
                fetchCurrentFriends(user.uid); 
            }
        });

        return () => unsubscribe();
    }, []);

     const pickImage = async () => {
         let result = await ImagePicker.launchImageLibraryAsync({
           mediaTypes: ImagePicker.MediaTypeOptions.Images,  // ✅ Fix mediaType
           allowsEditing: true,
           aspect: [4, 4],
           quality: 0.3,
         });
       
         console.log("🔥 DEBUG: ImagePicker result:", result);
       
         if (!result.canceled) {
           const manipResult = await ImageManipulator.manipulateAsync(
             result.assets[0].uri,
             [{ resize: { width: 300, height: 300 } }],
             { base64: true, compress: 0.3 }
           );
       
           console.log("🔥 DEBUG: Manipulated Image:", manipResult);
       
           if (manipResult.base64) {
             console.log("✅ DEBUG: Base64 image size:", manipResult.base64.length);
             setProfilePic(`data:image/jpeg;base64,${manipResult.base64}`);
           } else {
             console.error("❌ ERROR: Image conversion to Base64 failed.");
           }
         }
       };

       const handleSaveProfileChanges = async () => {
        if (!userId) return;
      
        try {
          await setDoc(doc(db, "users", userId), {
            username: newUsername,
            profilePic: profilePic,
          }, { merge: true });
      
          setUsername(newUsername);
          setEditModalVisible(false);
        } catch (err) {
          console.error("Error saving profile:", err);
        }
      };

    const fetchUserData = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUsername(userData.username || "Unknown User");
                setProfilePic(userData.profilePic || null);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchPersonalSongs = async (uid) => {
        try {
            const songsRef = collection(db, "users", uid, "personalSongs");
            const snapshot = await getDocs(songsRef);
            const songs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds); // 🔥 sort newest to oldest
    
            setPersonalSongs(songs);
        } catch (error) {
            console.error("Error fetching songs:", error);
        }
    };

    const fetchCurrentFriends = async (uid) => {
        try {
            const ref = collection(db, "users", uid, "friends");
            const snapshot = await getDocs(ref);
            const friends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCurrentFriends(friends.map(f => f.userID));
            setFriendsList(friends);
        } catch (error) {
            console.error("Error fetching friends:", error);
        }
    };

    const searchForFriend = async (input) => {
        setSearchInput(input);
        if (!input.trim()) return setMatchedUsers([]);

        try {
            const snapshot = await getDocs(collection(db, "users"));
            const matches = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(user =>
                    user.username?.toLowerCase().includes(input.toLowerCase())
                );
            setMatchedUsers(matches);
        } catch (error) {
            console.error("Search error:", error);
        }
    };

    const handleAddFriend = async (friend) => {
        if (!userId || !username){
            console.log("does not exist"); 
            return; 
        }
        console.log("user: ", username); 

        const yourRef = doc(db, "users", userId, "friends", friend.id);
        const theirRef = doc(db, "users", friend.id, "friends", userId);

        try {
            const exists = await getDoc(yourRef);
            if (exists.exists()) return;

            await setDoc(yourRef, {
                username: friend.username,
                userID: friend.id,
                profilePic: friend.profilePic || null,
            });

            await setDoc(theirRef, {
                username,
                userID: userId,
                profilePic: profilePic || null,
            });

            await fetchCurrentFriends(userId);
            console.log("friend added"); 
        } catch (error) {
            console.error("Error adding friend:", error);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        if (!userId) return;

        try {
            await deleteDoc(doc(db, "users", userId, "friends", friendId));
            await deleteDoc(doc(db, "users", friendId, "friends", userId));
        
            // 🔁 Refetch updated friends
            const ref = collection(db, "users", userId, "friends");
            const snapshot = await getDocs(ref);
            const updatedFriends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
            setCurrentFriends(updatedFriends.map(f => f.userID));
            setFriendsList(updatedFriends);
            console.log("✅ Friend removed and state refreshed");
          } catch (error) {
            console.error("Error removing friend:", error);
          }
    };
        const handleDeleteEkko = async (postId) => {
            try {
              if (!userId) return;
          
              // Delete from personalSongs
              await deleteDoc(doc(db, "users", userId, "personalSongs", postId));
              console.log("✅ Deleted from personalSongs");
          
              // Delete from feed
              await deleteDoc(doc(db, "feed", postId));
              console.log("✅ Deleted from feed");

               // Refresh list from Firestore
                await fetchPersonalSongs(userId);
          
              // Update UI
              setPersonalSongs(prev => prev.filter(song => song.id !== postId));
              await fetchPersonalSongs(userId);
            } catch (error) {
              console.error("❌ Error deleting ekko:", error);
            }
        };
    const handleLogout = async () => {
        try {
          const authInstance = getAuth();
          await signOut(authInstance);
      
          // Clear local states
          setUserId(null);
          setUsername('');
          setProfilePic(null);
          setFriendsList([]);
          setCurrentFriends([]);
          setSearchInput('');
          setMatchedUsers([]);
          setPersonalSongs([]);
      
          router.replace('/'); // go to welcome page
      
          console.log("✅ Logged out and cache cleared");
          await AsyncStorage.clear();
        } catch (error) {
          console.error("❌ Error logging out:", error);
        }
      };

      const handleDeleteAccount = async () => {
        try {
          const auth = getAuth();
          const db = getFirestore();
          const user = auth.currentUser;
      
          if (!user) throw new Error("No user is signed in.");
      
          const userId = user.uid;
          console.log("attempting to delete userId:", userId);
      
          // 1. Delete friends subcollection
          const friendsRef = collection(db, "users", userId, "friends");
          const friendsSnapshot = await getDocs(friendsRef);
          await Promise.all(friendsSnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
          console.log("✅ Deleted user’s own friends");
      
          // 2. Delete personalSongs subcollection
          const songsRef = collection(db, "users", userId, "personalSongs");
          const songsSnapshot = await getDocs(songsRef);
          await Promise.all(songsSnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
          console.log("✅ Deleted user’s personal songs");
      
          // 3. Remove user from other users' friends lists
          const allUsersSnapshot = await getDocs(collection(db, "users"));
          for (const otherUser of allUsersSnapshot.docs) {
            const otherUserId = otherUser.id;
            if (otherUserId === userId) continue;
      
            const otherFriendsRef = collection(db, "users", otherUserId, "friends");
            const otherFriendsSnapshot = await getDocs(otherFriendsRef);
      
            for (const friendDoc of otherFriendsSnapshot.docs) {
              if (friendDoc.id === userId) {
                await deleteDoc(friendDoc.ref);
                console.log(`❌ Removed ${userId} from ${otherUserId}'s friends`);
              }
            }
          }
      
          // 4. Delete user’s posts in the feed
          const userPostsQuery = query(collection(db, "feed"), where("userId", "==", userId));
          const userPostsSnapshot = await getDocs(userPostsQuery);
          await Promise.all(userPostsSnapshot.docs.map((docSnap) => {
            console.log(`🗑️ Deleting post by user: ${docSnap.id}`);
            return deleteDoc(docSnap.ref);
          }));
      
          // 5. Delete user's likes and comments from all posts
          const feedSnapshot = await getDocs(collection(db, "feed"));
          for (const postDoc of feedSnapshot.docs) {
            const postId = postDoc.id;
      
            // Delete comments by user
            const commentRef = collection(db, "feed", postId, "comments");
            const commentQuery = query(commentRef, where("userId", "==", userId));
            const commentSnapshot = await getDocs(commentQuery);
            await Promise.all(commentSnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
      
            // Delete likes by user
            const likeRef = collection(db, "feed", postId, "likes");
            const likeQuery = query(likeRef, where("userId", "==", userId));
            const likeSnapshot = await getDocs(likeQuery);
            await Promise.all(likeSnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
          }
          console.log("🧹 Cleaned up user’s likes and comments");
      
          // 6. Delete main user document
          await deleteDoc(doc(db, "users", userId));
          console.log("🗑️ Deleted main user document");
      
          // 7. Delete Firebase Auth account
          await deleteUser(user);
          console.log("🔥 Deleted Firebase Auth account");
      
          // 8. Redirect
          router.replace('/');
          // 🔄 Refresh the feed to update like counts
          await fetchFeedWithSongs();
          
        } catch (error) {
          console.error("❌ Error deleting account:", error);
          // Optionally display an error to the user
        }
      };
      

    if (!fontsLoaded) return <Text>Loading fonts...</Text>;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.ekkoText}>Ekko</Text>
            <LinearGradient
                colors={['#3A0398', '#150F29']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.7 }}
                style={styles.loginBox}
            >
                <View style={styles.profileHeader}>
                    <Image
                        source={profilePic ? { uri: profilePic } : require('@/assets/images/profileImages/image.png')}
                        style={styles.profilePic}
                    />
                    <View style={styles.subHeader}>
                        <Text style={styles.userNameText}>{username}</Text>
                        <Text style={styles.friendsText}>
                            {friendsList.length} friend{friendsList.length !== 1 ? 's' : ''}
                        </Text>
                        <TouchableOpacity onPress={() => {
                            setNewUsername(username);
                            setNewProfilePic(profilePic || "");
                            setEditModalVisible(true);
                        }}>
                        <Text style={styles.editBtn}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.title}>Badges</Text>
                <Text style={styles.title}>Friends</Text>
                {friendsList.map((friend) => (
                    <View key={friend.userID} style={styles.friendItem}>
                        <Image
                            source={friend.profilePic ? { uri: friend.profilePic } : require('@/assets/images/profileImages/image.png')}
                            style={styles.friendPic}
                        />
                        <Text style={styles.friendName}>@{friend.username}</Text>
                        <Text
                            onPress={() => handleRemoveFriend(friend.userID)}
                            style={styles.removeBtn}
                        >
                            Remove
                        </Text>
                    </View>
                ))}

                <Text style={styles.title}>Search for Friends</Text>
                <TextInput
                    placeholder="Enter username"
                    placeholderTextColor="#aaa"
                    value={searchInput}
                    onChangeText={searchForFriend}
                    style={styles.searchInput}
                />
                {matchedUsers.map((user) => (
                    <View key={user.id} style={styles.friendItem}>
                        <Image
                            source={user.profilePic ? { uri: user.profilePic } : require('@/assets/images/profileImages/image.png')}
                            style={styles.friendPic}
                        />
                        <Text style={styles.friendName}>@{user.username}</Text>
                        {user.id !== userId && !currentFriends.includes(user.id) && (
                            <Text
                                onPress={() => handleAddFriend(user)}
                                style={styles.addBtn}
                            >
                                Add Friend
                            </Text>
                        )}
                    </View>
                ))}

                <Text style={styles.title}>Previous Ekkos</Text>
                {personalSongs.map((song) => (
                    <View key={song.id} style={styles.songItem}>
                        <Text style={styles.songTitle}>{song.title}</Text>
                        <Text style={styles.songArtist}>Artist: {song.artist}</Text>
                        <Text style={styles.songCaption}>{song.caption}</Text>
                        {song.timestamp && (
                        <Text style={styles.timestamp}>
                            Posted on: {song.timestamp.toDate().toLocaleString()}
                        </Text>
                        )}
                        <TouchableOpacity
                    onPress={() => handleDeleteEkko(song.id, song.feedId)} // Add `feedId` when saving to Firestore
                    style={styles.deleteButton}
                    >
                    <Text style={styles.deleteButtonText}>Delete Ekko</Text>
                    </TouchableOpacity>
                    </View>
                ))}
                 <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <LinearGradient
                    colors={['#ff4e50', '#f9d423']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.logoutGradient}
                >
                    <Text style={styles.logoutText}>Log Out</Text>
                </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleDeleteAccount} style={styles.logoutButton}>
                <LinearGradient
                    colors={['#ff4e50', '#f9d423']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.logoutGradient}
                >
                    <Text style={styles.logoutText}>Delete Account</Text>
                </LinearGradient>
                </TouchableOpacity>


            </LinearGradient>

            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <Image
                            source={newProfilePic ? { uri: newProfilePic } : require('@/assets/images/profileImages/image.png')}
                            style={styles.modalPic}
                        />
                        <Text style={styles.saveBtn} onPress={pickImage}>Edit Picture</Text>
                        <Text style={styles.userNameText}>Username</Text>
                        <TextInput
                            placeholder="New Username"
                            placeholderTextColor="#aaa"
                            value={newUsername}
                            onChangeText={setNewUsername}
                            style={styles.modalInput}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>Cancel</Text>
                            <Text style={styles.saveBtn} onPress={handleSaveProfileChanges}>Save</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#2f2f2f", 
        padding: 20, },
    ekkoText: {
        fontSize: 36,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'MontserratAlternates-ExtraBold',
        padding: 10,
    },
    loginBox: {
        padding: 20,
        borderRadius: 19,
        marginBottom: 30,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    profilePic: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    subHeader: { marginLeft: 15 },
    userNameText: { fontSize: 24, fontWeight: "bold", color: "#fff" },
    friendsText: { fontSize: 16, fontWeight: "bold", color: '#B3B3B3' },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 10,
        color: "#fff",
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    friendPic: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    friendName: {
        color: '#fff',
        fontSize: 16,
        flex: 1,
    },
    removeBtn: {
        backgroundColor: '#ff4444',
        color: '#fff',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
        fontSize: 14,
    },
    addBtn: {
        backgroundColor: '#6E1FD1',
        color: '#fff',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
        fontSize: 14,
    },
    searchInput: {
        backgroundColor: '#1e1e1e',
        color: 'white',
        padding: 10,
        borderRadius: 8,
        borderColor: '#6E1FD1',
        borderWidth: 1,
        marginBottom: 10,
    },
    songItem: {
        backgroundColor: "#3A0398",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    songTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    songArtist: {
        fontSize: 16,
        color: "#ddd",
    },
    songCaption: {
        fontSize: 14,
        color: "#bbb",
    },
    timestamp: {
        fontSize: 12,
        color: '#aaa',
        marginTop: 5,
    },
    editBtn: {
        fontSize: 14,
        color: '#A338F4',
        marginTop: 5,
        fontWeight: 'bold',
    },
    
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    
    modalContent: {
        backgroundColor: '#222',
        padding: 20,
        borderRadius: 12,
        width: '100%',
    },
    
    modalTitle: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    
    modalPic: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignSelf: 'center',
        marginBottom: 15,
    },
    
    modalInput: {
        backgroundColor: '#333',
        color: 'white',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    cancelBtn: {
        color: '#aaa',
        fontSize: 16,
        padding: 10,
    },
    
    saveBtn: {
        color: '#6E1FD1',
        fontSize: 16,
        padding: 10,
        fontWeight: 'bold',
    },
    logoutButton: {
        marginTop: 20,
        alignSelf: 'center',
        borderRadius: 30,
        overflow: 'hidden',
      },
      
      logoutGradient: {
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 30,
      },
      
      logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
      },
      deleteButton: {
        backgroundColor: '#ff4444',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 10,
        alignSelf: 'flex-start',
      },
      deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
      },
});

export default ProfileScreen;