// app/(tabs)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const profileOptions = [
    {
      id: "1",
      title: "Personal Information",
      icon: "person-outline",
      onPress: () => console.log("Personal Information"),
    },
    {
      id: "2",
      title: "Attendance Settings",
      icon: "settings-outline",
      onPress: () => console.log("Attendance Settings"),
    },
    {
      id: "3",
      title: "Notifications",
      icon: "notifications-outline",
      onPress: () => console.log("Notifications"),
    },
    {
      id: "4",
      title: "Help & Support",
      icon: "help-circle-outline",
      onPress: () => console.log("Help & Support"),
    },
    {
      id: "5",
      title: "Privacy Policy",
      icon: "shield-checkmark-outline",
      onPress: () => console.log("Privacy Policy"),
    },
    {
      id: "6",
      title: "Terms of Service",
      icon: "document-text-outline",
      onPress: () => console.log("Terms of Service"),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 py-6 mb-4">
        <Text className="text-2xl font-bold text-gray-800 text-center">
          Profile
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View className="mx-5 mb-6 bg-white rounded-2xl p-6 shadow-sm">
          <View className="items-center mb-4">
            <View className="w-24 h-24 bg-blue-500 rounded-full items-center justify-center mb-4">
              <Ionicons name="person" size={48} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-800 mb-1">
              {user?.name || "User Name"}
            </Text>
            <Text className="text-gray-600 text-base">
              {user?.email || "user@example.com"}
            </Text>
          </View>

          {/* Stats Row */}
          <View className="flex-row justify-around pt-4 border-t border-gray-100">
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600">24</Text>
              <Text className="text-gray-600 text-sm">Days Present</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">160</Text>
              <Text className="text-gray-600 text-sm">Hours Worked</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-orange-600">2</Text>
              <Text className="text-gray-600 text-sm">Leave Taken</Text>
            </View>
          </View>
        </View>

        {/* Profile Options */}
        <View className="mx-5 mb-6">
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
              onPress={option.onPress}
            >
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                <Ionicons name={option.icon as any} size={20} color="#6B7280" />
              </View>

              <Text className="flex-1 text-gray-800 font-medium text-base">
                {option.title}
              </Text>

              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View className="mx-5 mb-8">
          <TouchableOpacity
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center justify-center"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text className="text-red-600 font-bold text-base ml-2">
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="items-center pb-6">
          <Text className="text-gray-400 text-sm">AttendEase v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
