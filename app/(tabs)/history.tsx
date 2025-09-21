import { useAuth } from "@/contexts/AuthContext";
import { formatDate, formatTime } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AttendanceData {
  id: number;
  user_id: number;
  attendance_date: string;
  clock_in: string | null;
  clock_out: string | null;
  created_at: string;
  updated_at: string;
  status: "on_time" | "late" | "absent";
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const AttendanceHistory = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth())
  );
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(
    null
  );
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState<
    AttendanceData[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };
  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatDateForAPI = (year: number, month: number, day: number) => {
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    return `${year}-${formattedMonth}-${formattedDay}`;
  };

  const handleDayPress = (day: number) => {
    setSelectedDay(day);
  };

  const calculateWorkingHours = (clockIn: string, clockOut: string): string => {
    const startTime = new Date(clockIn);
    const endTime = new Date(clockOut);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
  };

  const fetchMonthlyAttendance = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        }
        setError(null);

        const response = await fetch(
          `http://127.0.0.1:8000/api/attendance/month/${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();
        if (response.ok) {
          setMonthlyAttendanceData(result.data);
        } else {
          setError(result.message || "Failed to fetch attendance data.");
        }
      } catch (error) {
        setError("Network error. Please try again later.");
      } finally {
        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    [token, currentDate]
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMonthlyAttendance(false);
    setRefreshing(false);
  }, [fetchMonthlyAttendance]);

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [fetchMonthlyAttendance]);

  useEffect(() => {
    if (!selectedDay || !monthlyAttendanceData) {
      setAttendanceData(null);
      return;
    }

    const formattedDate = formatDateForAPI(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDay
    );

    const record = monthlyAttendanceData.find(
      (item) => item.attendance_date === formattedDate
    );

    if (!record) {
      setAttendanceData(null);
      setError("No attendance records found.");
    } else {
      setError(null);
      setAttendanceData(record);
    }
  }, [selectedDay, currentDate, monthlyAttendanceData]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-100">
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B82F6"]} // Android
              tintColor="#3B82F6" // iOS
              title="Pull to refresh" // iOS
              titleColor="#6B7280" // iOS
            />
          }
        >
          {/* Header */}
          <View className="bg-white px-4 py-4 flex-row items-center">
            <TouchableOpacity className="mr-4">
              <Ionicons name="chevron-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-gray-900">
              Attendance History
            </Text>
          </View>

          {/* Calendar Section */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
            {/* Calendar Header */}
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => navigateMonth(-1)}>
                <Ionicons name="chevron-back" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => navigateMonth(1)}>
                <Ionicons name="chevron-forward" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View className="flex-row mb-4">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <View key={index} className="flex-1 items-center">
                  <Text className="text-gray-500 font-medium text-sm">
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View className="flex-row flex-wrap">
              {days.map((day, index) => (
                <View
                  key={index}
                  style={{ width: "14.28%" }}
                  className="aspect-square items-center justify-center"
                >
                  {day && (
                    <TouchableOpacity
                      accessibilityLabel={`Select ${day}`}
                      accessibilityRole="button"
                      onPress={() => handleDayPress(day)}
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        day === selectedDay ? "bg-blue-500" : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-base font-medium ${
                          day === selectedDay ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Selected Date Details */}
          <View className="mx-4 mt-6">
            {attendanceData && (
              <Text className="text-xl font-bold text-gray-900 mb-4">
                {formatDate(new Date(attendanceData.attendance_date))}
              </Text>
            )}

            {isLoading && (
              <Text className="text-gray-500 text-base">Loading...</Text>
            )}

            {error && (
              <View className="bg-gray-100 p-4 rounded-xl mb-3">
                <Text className="text-blue-600 text-lg text-center font-medium">
                  {error}
                </Text>
              </View>
            )}

            {/* Check-in */}
            {!isLoading && !error && attendanceData && (
              <>
                <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm">
                  <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="log-in-outline" size={20} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900">
                      Check-in
                    </Text>
                    <Text className="text-gray-500">
                      {attendanceData.clock_in
                        ? formatTime(attendanceData.clock_in)
                        : "N/A"}
                    </Text>
                  </View>
                  <Text className="text-gray-500 font-medium">
                    {attendanceData.status}
                  </Text>
                </View>

                {/* Check-out */}
                <View className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm">
                  <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color="#3B82F6"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900">
                      Check-out
                    </Text>
                    <Text className="text-gray-500">
                      {attendanceData.clock_out
                        ? formatTime(attendanceData.clock_out)
                        : "N/A"}
                    </Text>
                  </View>
                  <Text className="text-gray-500 font-medium">
                    {" "}
                    {attendanceData.clock_in && attendanceData.clock_out
                      ? calculateWorkingHours(
                          attendanceData.clock_in,
                          attendanceData.clock_out
                        )
                      : "N/A"}
                  </Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AttendanceHistory;
