import { View, Text, StyleSheet } from 'react-native'

const LoginScreen = () => {
    return (
        <View style = {styles.container}>
            <Text>Login</Text>
        </View>

    );
};

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    }
})

export default LoginScreen;