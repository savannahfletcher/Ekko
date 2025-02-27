import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { fetchMessage } from './src/api/api';

const App = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const getMessage = async () => {
      const data = await fetchMessage();
      if (data) setMessage(data.message);
    };
    getMessage();
  }, []);

  return (
    <View>
      <Text>{message}</Text>
    </View>
  );
};

export default App;