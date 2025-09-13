// app/(tabs)/leave.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedDate: Date;
}

const LEAVE_TYPES = [
  { label: "Select Leave Type", value: "" },
  { label: "Annual Leave", value: "annual" },
  { label: "Sick Leave", value: "sick" },
  { label: "Personal Leave", value: "personal" },
  { label: "Emergency Leave", value: "emergency" },
  { label: "Maternity Leave", value: "maternity" },
  { label: "Paternity Leave", value: "paternity" },
  { label: "Bereavement Leave", value: "bereavement" },
];

export default function LeaveScreen() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: "1",
      leaveType: "Annual Leave",
      startDate: new Date("2024-03-15"),
      endDate: new Date("2024-03-17"),
      reason: "Family vacation",
      status: "approved",
      appliedDate: new Date("2024-03-01"),
    },
    {
      id: "2",
      leaveType: "Sick Leave",
      startDate: new Date("2024-03-20"),
      endDate: new Date("2024-03-20"),
      reason: "Medical appointment",
      status: "pending",
      appliedDate: new Date("2024-03-18"),
    },
  ]);

  const { token } = useAuth();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateDays = (): number => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const validateForm = (): boolean => {
    if (!leaveType) {
      Alert.alert("Error", "Please select a leave type");
      return false;
    }

    if (startDate > endDate) {
      Alert.alert("Error", "End date cannot be before start date");
      return false;
    }

    if (!reason.trim()) {
      Alert.alert("Error", "Please provide a reason for your leave");
      return false;
    }

    if (reason.trim().length < 10) {
      Alert.alert(
        "Error",
        "Please provide a more detailed reason (minimum 10 characters)"
      );
      return false;
    }

    return true;
  };

  const handleSubmitRequest = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const requestData = {
        leave_type: leaveType,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        reason: reason.trim(),
      };

      // API call to submit leave request
      const response = await fetch("http://127.0.0.1:8000/api/leave-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const newRequest: LeaveRequest = {
          id: Date.now().toString(),
          leaveType:
            LEAVE_TYPES.find((type) => type.value === leaveType)?.label ||
            leaveType,
          startDate,
          endDate,
          reason: reason.trim(),
          status: "pending",
          appliedDate: new Date(),
        };

        setLeaveRequests([newRequest, ...leaveRequests]);

        // Reset form
        setLeaveType("");
        setStartDate(new Date());
        setEndDate(new Date());
        setReason("");
        setShowRequestForm(false);

        Alert.alert("Success", "Leave request submitted successfully!");
      } else {
        throw new Error("Failed to submit leave request");
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
      Alert.alert("Error", "Failed to submit leave request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      default:
        return "text-yellow-600 bg-yellow-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      default:
        return "time";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 py-6 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-800">Leave Requests</Text>
        <TouchableOpacity
          className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center"
          onPress={() => setShowRequestForm(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-semibold ml-1">New Request</Text>
        </TouchableOpacity>
      </View>

      {/* Leave Balance Cards */}
      <View className="px-5 py-4">
        <View className="flex-row justify-between">
          <View className="flex-1 bg-white rounded-xl p-4 mr-2 shadow-sm">
            <Text className="text-gray-600 text-sm">Annual Leave</Text>
            <Text className="text-2xl font-bold text-blue-600">18</Text>
            <Text className="text-gray-500 text-xs">Days Available</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 ml-2 shadow-sm">
            <Text className="text-gray-600 text-sm">Sick Leave</Text>
            <Text className="text-2xl font-bold text-green-600">10</Text>
            <Text className="text-gray-500 text-xs">Days Available</Text>
          </View>
        </View>
      </View>

      {/* Leave Requests List */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Recent Requests
        </Text>

        {leaveRequests.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center">
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2 font-medium">
              No leave requests yet
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              Submit your first leave request using the button above
            </Text>
          </View>
        ) : (
          leaveRequests.map((request) => (
            <View
              key={request.id}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">
                    {request.leaveType}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {formatDate(request.startDate)} -{" "}
                    {formatDate(request.endDate)}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-full flex-row items-center ${getStatusColor(request.status)}`}
                >
                  <Ionicons
                    name={getStatusIcon(request.status) as any}
                    size={14}
                    color={
                      request.status === "approved"
                        ? "#16A34A"
                        : request.status === "rejected"
                          ? "#DC2626"
                          : "#D97706"
                    }
                  />
                  <Text
                    className={`ml-1 text-xs font-medium capitalize ${
                      request.status === "approved"
                        ? "text-green-600"
                        : request.status === "rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {request.status}
                  </Text>
                </View>
              </View>

              <Text className="text-gray-700 mb-3">{request.reason}</Text>

              <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-sm">
                  Applied: {formatDate(request.appliedDate)}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {calculateDays()} day{calculateDays() > 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Leave Request Form Modal */}
      <Modal
        visible={showRequestForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
              <TouchableOpacity onPress={() => setShowRequestForm(false)}>
                <Ionicons name="chevron-back" size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-800">
                Leave Request
              </Text>
              <View className="w-6" />
            </View>

            <ScrollView
              className="flex-1 px-5 py-6"
              showsVerticalScrollIndicator={false}
            >
              {/* Leave Type */}
              <View className="mb-6">
                <Text className="text-gray-700 font-semibold mb-2">
                  Leave Type
                </Text>
                <View className="bg-gray-50 rounded-xl border border-gray-200">
                  <Picker
                    selectedValue={leaveType}
                    onValueChange={setLeaveType}
                    style={{ height: 50 }}
                  >
                    {LEAVE_TYPES.map((type) => (
                      <Picker.Item
                        key={type.value}
                        label={type.label}
                        value={type.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Date Selection */}
              <View className="flex-row justify-between mb-6">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-700 font-semibold mb-2">
                    Start Date
                  </Text>
                  <TouchableOpacity
                    className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200 flex-row items-center"
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <Text className="ml-3 text-gray-800">
                      {formatDate(startDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-1 ml-2">
                  <Text className="text-gray-700 font-semibold mb-2">
                    End Date
                  </Text>
                  <TouchableOpacity
                    className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200 flex-row items-center"
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <Text className="ml-3 text-gray-800">
                      {formatDate(endDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Duration Display */}
              {leaveType && (
                <View className="bg-blue-50 rounded-xl p-4 mb-6">
                  <Text className="text-blue-800 font-medium">
                    Duration: {calculateDays()} day
                    {calculateDays() > 1 ? "s" : ""}
                  </Text>
                </View>
              )}

              {/* Reason */}
              <View className="mb-8">
                <Text className="text-gray-700 font-semibold mb-2">Reason</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200 text-gray-800"
                  placeholder="Please provide a reason for your leave..."
                  placeholderTextColor="#9CA3AF"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text className="text-gray-400 text-sm mt-1 text-right">
                  {reason.length}/500
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                className={`bg-blue-500 rounded-xl py-4 items-center ${
                  isLoading ? "opacity-50" : ""
                }`}
                onPress={handleSubmitRequest}
                disabled={isLoading}
              >
                <Text className="text-white font-bold text-lg">
                  {isLoading ? "Submitting..." : "Submit Request"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (selectedDate) {
                setStartDate(selectedDate);
                if (selectedDate > endDate) {
                  setEndDate(selectedDate);
                }
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (selectedDate) {
                setEndDate(selectedDate);
              }
            }}
            minimumDate={startDate}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}
