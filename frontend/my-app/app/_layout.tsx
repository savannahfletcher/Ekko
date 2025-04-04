import { Stack, usePathname } from "expo-router";
import Navbar from './components/Navbar';

const RootLayout = () => {
  const pathname = usePathname();
  const hideNavbar = ["/", "/login", "/register"];

  return (
    <>
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
        },
      }}>

      <Stack.Screen name = 'index' options = {{title: 'Ekko Home'}} />
      <Stack.Screen name = 'register' options = {{headerTitle: 'Register'}} />
      <Stack.Screen name = 'login' options = {{headerTitle: 'Login'}} />
      <Stack.Screen name = 'feed' options = {{headerTitle: 'Feed'}} />
      <Stack.Screen name = 'post' options = {{headerTitle: 'Search'}} />
      <Stack.Screen name = 'profile' options = {{headerTitle: 'Profile'}} />
    </Stack>

    {!hideNavbar.includes(pathname) && <Navbar />}
    </>
  );
};

export default RootLayout;