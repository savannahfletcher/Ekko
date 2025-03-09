import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, StyleSheet, FlatList, Image, Alert } from "react-native";

const FeedScreen = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5001/feed");
            const data = await response.json();
            setPosts(data);
        } catch (error) {
            Alert.alert("Error", "Failed to fetch feed.");
            console.error("Error fetching feed:", error);
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <LinearGradient
                        colors={["#3A0398", "#150F29"]}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.7 }}
                        style={styles.postItem}
                    >
                        <View style={styles.postHeader}>
                            <Image source={{ uri: item.profile }} style={styles.profilePic} />
                            <Text style={styles.postUsername}>{item.username}</Text>
                        </View>

                        <Image source={{ uri: item.albumCover }} style={styles.image} />
                        <Text style={styles.postSongName}>{item.songName}</Text>
                        <Text style={styles.postDetails}>Song • {item.artist}</Text>
                    </LinearGradient>
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
    postItem: {
        padding: 20,
        marginBottom: 50,
        borderRadius: 19,
    },
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    postUsername: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        paddingLeft: 5,
        paddingBottom: 5,
    },
    postSongName: {
        fontSize: 17,
        color: "#fff",
        paddingLeft: 2,
        paddingTop: 5,
    },
    postDetails: {
        fontSize: 12,
        color: "#A7A7A7",
        paddingLeft: 2,
    },
    profilePic: {
        width: 50,
        height: 50,
        borderRadius: 50,
    },
    image: {
        width: 300,
        height: 300,
        borderRadius: 9,
    },
});

export default FeedScreen;