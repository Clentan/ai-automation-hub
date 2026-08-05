import React from 'react';
import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isSignedIn } = useAuth();
  if (isSignedIn) return <Redirect href="/(tabs)/account" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
