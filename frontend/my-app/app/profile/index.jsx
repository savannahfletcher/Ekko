import { View, Text, StyleSheet, FlatList, Image } from 'react-native'

const ProfileScreen = () => {


    return (
        <View style = {styles.container}>
            <Text style={styles.title}>Profile Page</Text>
        </View>

    );
};

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#2f2f2f',
      },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#fff",
    },
    
})

export default ProfileScreen;