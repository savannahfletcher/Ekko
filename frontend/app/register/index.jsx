import { View, Text, StyleSheet } from 'react-native'

const RegisterScreen = () => {
    return (
        <View style = {styles.container}>
            <Text>Register</Text>
        </View>

    );
};

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: '#2f2f2f',
        margin: 0,
      },
})

export default RegisterScreen;