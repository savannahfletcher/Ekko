import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TextInput } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { getDoc, getDocs, collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { useFonts } from 'expo-font';

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
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchPersonalSongs = async (uid) => {
        try {
            const songsRef = collection(db, "users", uid, "personalSongs");
            const snapshot = await getDocs(songsRef);
            const songs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        if (!userId || !username || !profilePic) return;

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
        } catch (error) {
            console.error("Error adding friend:", error);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        if (!userId) return;

        try {
            await deleteDoc(doc(db, "users", userId, "friends", friendId));
            await deleteDoc(doc(db, "users", friendId, "friends", userId));
            await fetchCurrentFriends(userId);
        } catch (error) {
            console.error("Error removing friend:", error);
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
                    </View>
                ))}
            </LinearGradient>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#2f2f2f" },
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
});

export default ProfileScreen;