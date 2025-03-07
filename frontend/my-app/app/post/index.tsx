import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useState} from 'react';

const PostScreen = () => {

    const [input, setInput] = useState("");
    return (
        <View style = {styles.container}>
            <Text style = {styles.title} >Search Songs</Text>

            <Pressable style = {styles.searchBar}>
                <Icon style={styles.searchIcon} name="search" size={30} color="#000"/>
                <TextInput
                    value ={input}
                    onChangeText={(text) => setInput(text)}
                    placeholder= "Search songs on Spotify"
                    placeholderTextColor={"#888888"}
                />
            </Pressable>

            <Text style = {styles.tagline}>
                Post a song of the day for your friends to see!
            </Text>
            <Text style = {styles.tagline_sub}>
                It could be what you’re listening to right now or a song that captures your vibe for the day!
            </Text>

        </View>

    );
};

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        padding: 30,
        backgroundColor: '#2f2f2f',
        color: '#fff',
      },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#fff',
    },
    searchIcon: {
        paddingLeft: 10,
        paddingRight: 15,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 14,
        padding: 10,
    },
    tagline: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 50,
        marginBottom: 30,
        alignSelf: "center",
        textAlign: "center",
        color: '#CD60FF',
    },

    tagline_sub: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#B3B3B3',
    }
})

export default PostScreen;