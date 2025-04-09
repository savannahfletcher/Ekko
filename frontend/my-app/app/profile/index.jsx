import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig"; 
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useFonts } from 'expo-font';
import { TextInput } from 'react-native';
import { ScrollView } from 'react-native';
import { setDoc, deleteDoc, query, where } from "firebase/firestore";

const ProfileScreen = () => {
    const [personalSongs, setPersonalSongs] = useState([]);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState("Loading...");
    const [profilePic, setProfilePic] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [matchedUsers, setMatchedUsers] = useState([]);
    const [currentFriends, setCurrentFriends] = useState([]);
    const [friendsList, setFriendsList] = useState([]);

    const [fontsLoaded] = useFonts({
        'MontserratAlternates-ExtraBold': require('./../../assets/fonts/MontserratAlternates-ExtraBold.ttf'),
    });
    
    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

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

    const fetchUserData = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUsername(userData.username || "Unknown User");
                setProfilePic(userData.profilePic || null);
            } else {
                console.error("User document not found!");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchPersonalSongs = async (uid) => {
        try {
            const songsRef = collection(db, "users", uid, "personalSongs");
            const songsSnapshot = await getDocs(songsRef);

            const songsList = songsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setPersonalSongs(songsList);
        } catch (error) {
            console.error("Error fetching personal songs:", error);
        }
    };
// ---------------------------------------FRIENDS FETCHING FUNCTIONS------------------------------------
    const searchForFriend = async (input) => {
        setSearchInput(input);
        if (!input.trim()) {
            setMatchedUsers([]);
            return;
        }
    
        try {
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);
    
            const matches = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(user =>
                    user.username &&
                    user.username.toLowerCase().includes(input.toLowerCase())
                );
    
            setMatchedUsers(matches);
        } catch (error) {
            console.error("Error searching for friends:", error);
        }
    };
    const handleAddFriend = async (friend) => {
        if (!userId || !username || !profilePic) return;
    
        const yourFriendRef = doc(db, "users", userId, "friends", friend.id);
        const theirFriendRef = doc(db, "users", friend.id, "friends", userId);
    
        try {
            const existingDoc = await getDoc(yourFriendRef);
            if (existingDoc.exists()) {
                console.log(`${friend.username} is already a friend.`);
                return;
            }
    
            // Add friend to your list
            await setDoc(yourFriendRef, {
                username: friend.username,
                userID: friend.id,
                profilePic: friend.profilePic || null,
            });
    
            // Add yourself to their list
            await setDoc(theirFriendRef, {
                username,
                userID: userId,
                profilePic: profilePic || null,
            });
    
            console.log(`Added ${friend.username} to your friends, and you to theirs!`);
    
            await fetchCurrentFriends(userId); // Refresh
        } catch (error) {
            console.error("Error adding friend:", error);
        }
    };
    const fetchCurrentFriends = async (uid) => {
        try {
            const friendsRef = collection(db, "users", uid, "friends");
            const snapshot = await getDocs(friendsRef);
    
            const friends = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
    
            setCurrentFriends(friends.map(f => f.userID)); // for checking duplicates
            setFriendsList(friends); // for display
        } catch (error) {
            console.error("Error fetching friends:", error);
        }
    };
    const handleRemoveFriend = async (friendId) => {
        if (!userId) return;
    
        try {
            // Remove friend from your list
            await setDoc(doc(db, "users", userId, "friends", friendId), {}, { merge: false });
            await deleteDoc(doc(db, "users", userId, "friends", friendId));
    
            // Remove yourself from their list
            await setDoc(doc(db, "users", friendId, "friends", userId), {}, { merge: false });
            await deleteDoc(doc(db, "users", friendId, "friends", userId));
    
            console.log(`Removed friendship between you and ${friendId}`);
            await fetchCurrentFriends(userId); // Refresh list
        } catch (error) {
            console.error("Error removing friend:", error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.ekkoText}> Ekko </Text>
            <LinearGradient
                colors={['#3A0398', '#150F29']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.7 }}
                style={styles.loginBox}
            >
                <View style={styles.profileHeader}>
                    <Image source={profilePic ? { uri: profilePic } : require('@/assets/images/profileImages/image.png')} style={styles.profilePic} />
                    <View style={styles.subHeader}>
                        <Text style={styles.userNameText}>{username}</Text>
                        <Text style={styles.friendsText}>{friendsList.length} friend{friendsList.length !== 1 ? 's' : ''}</Text>
                    </View>
                </View>
                <Text style={styles.title}>Badges</Text>
{/* --------------------------------------------------------FRIENDS DISPLAY----------------------------------------------------------------------- */}
            {friendsList.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.title}>Friend (Debug)</Text>
                    <FlatList
                        data={friendsList}
                        keyExtractor={(item) => item.userID}
                        renderItem={({ item }) => (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <Image
                                    source={item.profilePic ? { uri: item.profilePic } : require('@/assets/images/profileImages/image.png')}
                                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                                />
                               <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ color: '#fff', fontSize: 16 }}>@{item.username}</Text>
                                    <Text
                                        onPress={() => handleRemoveFriend(item.userID)}
                                        style={{
                                            backgroundColor: '#ff4444',
                                            color: '#fff',
                                            paddingVertical: 5,
                                            paddingHorizontal: 10,
                                            borderRadius: 6,
                                            fontSize: 14,
                                        }}
                                    >
                                        Remove
                                    </Text>
                                </View>
                            </View>
                        )}
                    />
                </View>
            )}
{/* ----------------------------------------------------FRIENDS SEARCH FEATURE----------------------------------------------------------- */}
                <View>
                    <Text style={styles.title}> Search for Friends (Debug)</Text>
                    <TextInput
                        placeholder="Enter username"
                        placeholderTextColor="#aaa"
                        value={searchInput}
                        onChangeText={searchForFriend}
                        style={{
                            backgroundColor: '#1e1e1e',
                            color: 'white',
                            padding: 10,
                            borderRadius: 8,
                            borderColor: '#6E1FD1',
                            borderWidth: 1,
                            marginBottom: 10,
                        }}
                    />

                    {matchedUsers.length > 0 && (
                       <FlatList
                       data={matchedUsers}
                       keyExtractor={(item) => item.id}
                       renderItem={({ item }) => (
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                               <Image
                                   source={item.profilePic ? { uri: item.profilePic } : require('@/assets/images/profileImages/image.png')}
                                   style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                               />
                               <Text style={{ color: '#fff', fontSize: 16, flex: 1 }}>@{item.username}</Text>
           
                               {/* ✅ Only show if not yourself AND not already a friend */}
                               {item.id !== userId && !currentFriends.includes(item.id) && (
                                   <Text
                                       onPress={() => handleAddFriend(item)}
                                       style={{
                                           backgroundColor: '#6E1FD1',
                                           color: '#fff',
                                           paddingVertical: 5,
                                           paddingHorizontal: 10,
                                           borderRadius: 6,
                                           fontSize: 14,
                                       }}
                                   >
                                       Add Friend
                                   </Text>
                               )}
                           </View>
                       )}
                        />
                    )}
                </View>
{/* ----------------------------------------------------------------------------------------------------------------------------- */}
                <Text style={styles.title}>Previous Ekkos</Text>
                <FlatList
                    data={personalSongs}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.songItem}>
                            <Text style={styles.songTitle}>{item.title}</Text>
                            <Text style={styles.songArtist}>Artist: {item.artist}</Text>
                            <Text style={styles.songCaption}>{item.caption}</Text>
                        </View>
                    )}
                />
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#2f2f2f",
    },
    ekkoText: {
        fontSize: 36,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'MontserratAlternates-ExtraBold',
        padding: 10,
    },
    loginBox: {
        padding: 20,
        marginBottom: 50,
        borderRadius: 19,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    profilePic: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    subHeader: {
        marginLeft: 15,
    },
    userNameText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
    },
    friendsText: {
        fontSize: 16,
        fontWeight: "bold",
        color: '#B3B3B3',
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#fff",
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
});

export default ProfileScreen;