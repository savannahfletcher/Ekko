import { Stack } from "expo-router";

const RootLayout = () => {
  return (
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
          paddingHorizontal: 10,
          paddingTop: 10,
          backgroundColor: '#fff',
        },
      }}>
        <Stack.Screen name = 'index' options = {{title: 'Ekko'}} />
      </Stack>
  );
};

export default RootLayout;