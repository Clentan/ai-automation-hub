import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useSignIn } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colorTokens from '@/constants/colors';

export default function SignInScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [formError, setFormError] = React.useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const finalize = async () => {
    await signIn.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) {
          console.log(session.currentTask);
          return;
        }
        router.replace('/(tabs)');
      },
    });
  };

  const handleSubmit = async () => {
    setFormError('');
    const { error } = await signIn.password({ emailAddress, password });
    if (error) {
      setFormError(error.message ?? 'Sign-in failed');
      return;
    }
    if (signIn.status === 'complete') {
      await finalize();
    } else if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (emailCodeFactor) {
        const { error: sendError } = await signIn.mfa.sendEmailCode();
        if (sendError) {
          setFormError(sendError.message ?? 'Could not send verification code.');
        }
      } else {
        setFormError('This account requires a verification method not supported here.');
      }
    } else {
      setFormError('Sign-in could not be completed. Please try again.');
    }
  };

  const handleVerify = async () => {
    setFormError('');
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) {
      setFormError(error.message ?? 'Invalid or expired code. Please try again.');
      return;
    }
    if (signIn.status === 'complete') {
      await finalize();
    } else {
      setFormError('Verification could not be completed. Please try again.');
    }
  };

  const busy = fetchStatus === 'fetching';

  if (signIn.status === 'needs_client_trust') {
    return (
      <View style={[styles.container, { backgroundColor: c.background, paddingTop: topInset }]}>
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bottomOffset={40}
        >
          <View style={[styles.logoBox, { backgroundColor: c.primary }]}>
            <Feather name="zap" size={26} color={c.primaryForeground} />
          </View>
          <Text style={[styles.title, { color: c.foreground }]}>Verify your account</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            We sent a verification code to {emailAddress}
          </Text>
          <TextInput
            testID="verify-code"
            style={[styles.input, { backgroundColor: c.card, borderColor: c.input, color: c.foreground }]}
            value={code}
            placeholder="Verification code"
            placeholderTextColor={c.mutedForeground}
            onChangeText={setCode}
            keyboardType="numeric"
          />
          {errors.fields.code && (
            <Text style={[styles.error, { color: c.destructive }]}>
              {errors.fields.code.message}
            </Text>
          )}
          {formError ? (
            <Text style={[styles.error, { color: c.destructive }]}>{formError}</Text>
          ) : null}
          <Pressable
            testID="verify-button"
            onPress={handleVerify}
            disabled={busy}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: c.primary, opacity: busy ? 0.5 : pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.buttonText, { color: c.primaryForeground }]}>Verify</Text>
          </Pressable>
          <Pressable onPress={() => signIn.mfa.sendEmailCode()}>
            <Text style={[styles.link, { color: c.primary }]}>I need a new code</Text>
          </Pressable>
          <Pressable onPress={() => signIn.reset()}>
            <Text style={[styles.link, { color: c.mutedForeground }]}>Start over</Text>
          </Pressable>
        </KeyboardAwareScrollViewCompat>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: topInset }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={40}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Feather name="arrow-left" size={20} color={c.foreground} />
        </Pressable>
        <View style={[styles.logoBox, { backgroundColor: c.primary }]}>
          <Feather name="zap" size={26} color={c.primaryForeground} />
        </View>
        <Text style={[styles.title, { color: c.foreground }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          Sign in to your Automation Hub account
        </Text>

        <Text style={[styles.label, { color: c.foreground }]}>Email</Text>
        <TextInput
          testID="email-input"
          style={[styles.input, { backgroundColor: c.card, borderColor: c.input, color: c.foreground }]}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="you@example.com"
          placeholderTextColor={c.mutedForeground}
          onChangeText={setEmailAddress}
          keyboardType="email-address"
        />
        {errors.fields.identifier && (
          <Text style={[styles.error, { color: c.destructive }]}>
            {errors.fields.identifier.message}
          </Text>
        )}

        <Text style={[styles.label, { color: c.foreground }]}>Password</Text>
        <TextInput
          testID="password-input"
          style={[styles.input, { backgroundColor: c.card, borderColor: c.input, color: c.foreground }]}
          value={password}
          placeholder="Your password"
          placeholderTextColor={c.mutedForeground}
          secureTextEntry
          onChangeText={setPassword}
        />
        {errors.fields.password && (
          <Text style={[styles.error, { color: c.destructive }]}>
            {errors.fields.password.message}
          </Text>
        )}
        {formError ? (
          <Text style={[styles.error, { color: c.destructive }]}>{formError}</Text>
        ) : null}

        <Pressable
          testID="sign-in-button"
          onPress={handleSubmit}
          disabled={!emailAddress || !password || busy}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: c.primary,
              opacity: !emailAddress || !password || busy ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: c.primaryForeground }]}>Continue</Text>
        </Pressable>

        <View style={styles.linkRow}>
          <Text style={[styles.linkMuted, { color: c.mutedForeground }]}>
            Don't have an account?{' '}
          </Text>
          <Link href="/(auth)/sign-up">
            <Text style={[styles.link, { color: c.primary }]}>Sign up</Text>
          </Link>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 60,
  },
  back: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: colorTokens.radius,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  error: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
  },
  button: {
    marginTop: 24,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  link: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginTop: 14,
  },
  linkMuted: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 14,
  },
});
