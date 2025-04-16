import { Stack, usePathname } from "expo-router";
import { View, StyleSheet } from "react-native";
import Navbar from './components/Navbar';

const RootLayout = () => {
  const pathname = usePathname();
  const hideNavbar = ["/", "/login", "/register"];

  return (
    <View style={styles.appWrapper}>
      <View style={styles.appContainer}>
    <Stack 
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2f2f2f',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
        },
        contentStyle: {
          // paddingHorizontal: 10,
          // paddingTop: 10,
          backgroundColor: '#fff',
          maxWidth: 400,
          paddingBottom: 80, // making sure navbar doesnt cover content
        },
      }}>

      <Stack.Screen name = 'index' options = {{title: 'Ekko Home'}} />
      <Stack.Screen name = 'register' options = {{headerTitle: 'Register'}} />
      <Stack.Screen name = 'login' options = {{headerTitle: 'Login'}} />
      <Stack.Screen name = 'feed' options = {({ route }) => ({ headerTitle: 'Feed', animation: route.params?.instant ? 'none' : 'default', })} />
      <Stack.Screen name = 'post' options = {({ route }) => ({ headerTitle: 'Search', animation: route.params?.instant ? 'none' : 'default', })} />
      <Stack.Screen name = 'profile' options = {({ route }) => ({ headerTitle: 'Profile', animation: route.params?.instant ? 'none' : 'default', })} />
      <Stack.Screen name = 'friendProfile' options = {({ route }) => ({ headerTitle: 'FriendProfile', animation: route.params?.instant ? 'none' : 'default', })} />
    </Stack>

    {!hideNavbar.includes(pathname) && <Navbar />}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
    backgroundColor: '#111', // outer background color
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    maxWidth: 400,
    width: '100%',
    backgroundColor: '#fff',
  },
});

export default RootLayout;