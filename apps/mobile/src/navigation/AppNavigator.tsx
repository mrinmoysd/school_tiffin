import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { linking } from './linking';
import { RootStackParamList } from './types';
import {
  AddStudentScreen,
  ChangePasswordScreen,
  DateSelectionScreen,
  DeliveryScheduleScreen,
  EditProfileScreen,
  HomeScreen,
  MealPlanDetailScreen,
  NotificationsScreen,
  OrderDetailScreen,
  OrdersScreen,
  PaymentScreen,
  ProfileScreen,
  PauseRequestScreen,
  PauseRequestsScreen,
  SelectStudentScreen,
  SchoolDetailScreen,
  SchoolListScreen,
  StudentsScreen,
  SubscriptionsListScreen,
  SubscriptionReviewScreen,
  SubscriptionDetailScreen,
} from '../screens/app';
import {
  ForgotPasswordScreen,
  LoginScreen,
  OtpVerificationScreen,
  PhoneLoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
} from '../screens/auth';
import { useAppSelector } from '../store/hooks';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { isAuthenticated, bootstrapLoading } = useAppSelector(state => state.auth);

  if (bootstrapLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SchoolList" component={SchoolListScreen} />
            <Stack.Screen
              name="SchoolDetail"
              component={SchoolDetailScreen}
              options={{ title: 'School Details' }}
            />
            <Stack.Screen
              name="MealPlanDetail"
              component={MealPlanDetailScreen}
              options={{ title: 'Meal Plan Details' }}
            />
            <Stack.Screen
              name="SelectStudent"
              component={SelectStudentScreen}
              options={{ title: 'Select Student' }}
            />
            <Stack.Screen
              name="Students"
              component={StudentsScreen}
              options={{ title: 'Students' }}
            />
            <Stack.Screen
              name="AddStudent"
              component={AddStudentScreen}
              options={{ title: 'Add Student' }}
            />
            <Stack.Screen
              name="DateSelection"
              component={DateSelectionScreen}
              options={{ title: 'Date Selection' }}
            />
            <Stack.Screen
              name="SubscriptionReview"
              component={SubscriptionReviewScreen}
              options={{ title: 'Review Subscription' }}
            />
            <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ title: 'Change Password' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Notifications' }}
            />
            <Stack.Screen
              name="SubscriptionsList"
              component={SubscriptionsListScreen}
              options={{ title: 'My Subscriptions' }}
            />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{ title: 'Order Details' }}
            />
            <Stack.Screen
              name="SubscriptionDetail"
              component={SubscriptionDetailScreen}
              options={{ title: 'Subscription Details' }}
            />
            <Stack.Screen
              name="DeliverySchedule"
              component={DeliveryScheduleScreen}
              options={{ title: 'Delivery Schedule' }}
            />
            <Stack.Screen
              name="PauseRequest"
              component={PauseRequestScreen}
              options={{ title: 'Pause Request' }}
            />
            <Stack.Screen
              name="PauseRequests"
              component={PauseRequestsScreen}
              options={{ title: 'Pause Requests' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PhoneLogin"
              component={PhoneLoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="OtpVerification"
              component={OtpVerificationScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
