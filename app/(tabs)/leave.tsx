// app/(tabs)/leave.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
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
  created_at: Date;
}

const LEAVE_TYPES = [
  { label: "Select Leave Type", value: "" },
  { label: "Annual Leave", value: "Annual Leave" },
  { label: "Sick Leave", value: "Sick Leave" },
  { label: "Casual Leave", value: "Casual Leave" },
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
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const { token } = useAuth();

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/leave_request", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedRequests: LeaveRequest[] = data.map((item: any) => ({
          id: item.id,
          leaveType: item.leave_type.name,
          startDate: new Date(item.start_date),
          endDate: new Date(item.end_date),
          reason: item.reason,
          status: item.status,
          created_at: new Date(item.created_at),
        }));

        setLeaveRequests(formattedRequests);
      } else {
        throw new Error("Failed to fetch leave requests");
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      Alert.alert("Error", "Failed to load leave requests. Please try again.");
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [token]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateDays = (start?: Date, end?: Date): number => {
    const startCalc = start || startDate;
    const endCalc = end || endDate;
    const diffTime = Math.abs(endCalc.getTime() - startCalc.getTime());
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
      // Fetch the leave type ID based on the selected leave type
      const leaveTypeResponse = await fetch(
        `http://127.0.0.1:8000/api/leave_type`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!leaveTypeResponse.ok) {
        throw new Error("Failed to fetch leave types");
      }

      const leaveTypesData = await leaveTypeResponse.json();
      const selectedLeaveType = leaveTypesData.find(
        (type: { name: string }) => type.name === leaveType
      );

      const leaveTypeId = selectedLeaveType ? selectedLeaveType.id : null;

      const requestData = {
        leave_type_id: leaveTypeId,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        reason: reason.trim(),
      };

      // Post the leave request
      const response = await fetch("http://127.0.0.1:8000/api/leave_request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        // Show success message
        Alert.alert(
          "Success",
          "Your leave request has been submitted successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                // Close the form and refresh the list
                setShowRequestForm(false);
                // Reset form
                setLeaveType("");
                setStartDate(new Date());
                setEndDate(new Date());
                setReason("");
                // Refresh the entire list from server
                fetchLeaveRequests();
              },
            },
          ]
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Submit error:", errorData);
        throw new Error(errorData.message || "Failed to submit leave request");
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
        return "text-green-600 bg-green-50 border-green-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
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
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-5 py-6 flex-row items-center justify-between ">
        <Text className="text-2xl font-bold text-gray-800">Leave Requests</Text>
        <TouchableOpacity
          className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center shadow-sm"
          onPress={() => setShowRequestForm(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-semibold ml-1">New Request</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 bg-gray-100">
        {/* Leave Requests List */}
        <ScrollView
          className="flex-1 px-5 mt-5"
          showsVerticalScrollIndicator={false}
        >
          {leaveRequests.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center shadow-sm">
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2 font-medium">
                No leave requests yet
              </Text>
              <Text className="text-gray-400 text-sm text-center">
                Submit your first leave request using the button above
              </Text>
            </View>
          ) : (
            leaveRequests.map((request, index) => (
              <View
                key={`${request.id}-${index}`}
                className="bg-white rounded-xl p-5 mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800 mb-1">
                      {request.leaveType}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {formatDate(request.startDate)} -{" "}
                      {formatDate(request.endDate)}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full flex-row items-center border ${getStatusColor(request.status)}`}
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

                <Text className="text-gray-700 mb-3 leading-5">
                  {request.reason}
                </Text>

                <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                  <Text className="text-gray-500 text-sm">
                    Applied: {formatDate(request.created_at)}
                  </Text>
                  <Text className="text-gray-500 text-sm font-medium">
                    {calculateDays(request.startDate, request.endDate)} day
                    {calculateDays(request.startDate, request.endDate) > 1
                      ? "s"
                      : ""}
                  </Text>
                </View>
              </View>
            ))
          )}
          <View className="h-6" />
        </ScrollView>
      </View>

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
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
              <TouchableOpacity
                onPress={() => setShowRequestForm(false)}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-800">
                Leave Request
              </Text>
              <View className="w-10" />
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View className="px-5 py-6">
                {/* Leave Type */}
                <View className="mb-6">
                  <Text className="text-gray-800 font-bold text-base mb-3">
                    Leave Type <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden">
                    <Picker
                      selectedValue={leaveType}
                      onValueChange={setLeaveType}
                      style={{
                        height: 55,
                        color: "#374151",
                      }}
                      itemStyle={{
                        height: 55,
                        fontSize: 16,
                      }}
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
                <View className="mb-6">
                  <Text className="text-gray-800 font-bold text-base mb-3">
                    Duration <Text className="text-red-500">*</Text>
                  </Text>

                  <View className="flex-row justify-between gap-4 mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2 text-sm">
                        Start Date
                      </Text>
                      <TouchableOpacity
                        className="bg-gray-50 rounded-2xl px-4 py-4 border-2 border-gray-200 flex-row items-center min-h-[55px]"
                        onPress={() => setShowStartPicker(true)}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#6B7280"
                        />
                        <Text className="ml-3 text-gray-800 font-medium flex-1">
                          {formatDate(startDate)}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2 text-sm">
                        End Date
                      </Text>
                      <TouchableOpacity
                        className="bg-gray-50 rounded-2xl px-4 py-4 border-2 border-gray-200 flex-row items-center min-h-[55px]"
                        onPress={() => setShowEndPicker(true)}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#6B7280"
                        />
                        <Text className="ml-3 text-gray-800 font-medium flex-1">
                          {formatDate(endDate)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Duration Display */}
                  {leaveType && (
                    <View className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                      <View className="flex-row items-center">
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#3B82F6"
                        />
                        <Text className="text-blue-800 font-bold ml-2">
                          Total Duration: {calculateDays()} day
                          {calculateDays() > 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Reason */}
                <View className="mb-8">
                  <Text className="text-gray-800 font-bold text-base mb-3">
                    Reason <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-4">
                    <TextInput
                      className="text-gray-800 min-h-[100px]"
                      placeholder="Please provide a detailed reason for your leave request..."
                      placeholderTextColor="#9CA3AF"
                      value={reason}
                      onChangeText={setReason}
                      multiline
                      textAlignVertical="top"
                      maxLength={500}
                      style={{ fontSize: 16 }}
                    />
                  </View>
                  <Text className="text-gray-400 text-sm mt-2 text-right">
                    {reason.length}/500 characters
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Submit Button */}
            <View className="px-5 py-4 bg-white border-t border-gray-200">
              <TouchableOpacity
                className={`bg-blue-500 rounded-2xl py-4 items-center shadow-sm ${
                  isLoading ? "opacity-50" : ""
                }`}
                onPress={handleSubmitRequest}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View className="flex-row items-center">
                    <Text className="text-white font-bold text-lg mr-2">
                      Submitting...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Submit Request
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
