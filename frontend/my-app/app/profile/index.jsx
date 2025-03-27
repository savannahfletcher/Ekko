import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { getFirestore, collection, doc, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig"; // ✅ Ensure Firebase is correctly imported
import { getAuth, onAuthStateChanged } from "firebase/auth";

const ProfileScreen = () => {
    const [personalSongs, setPersonalSongs] = useState([]);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                fetchPersonalSongs(user.uid);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchPersonalSongs = async (uid) => {
        try {
            const songsRef = collection(db, "users", uid, "personalSongs"); // ✅ Correct Firestore path
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile Page</Text>
            <Text style={styles.title}> List of Songs</Text>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#2f2f2f",
    },
    title: {
        fontSize: 28,
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