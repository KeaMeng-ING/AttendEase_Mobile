import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TimeLog {
  id: string;
  type: "clockIn" | "clockOut";
  date: string;
  time: string;
}

// ✅ Utility function to format time with padded hours
const formatTime = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const isPM = hours >= 12;

  // Convert to 12-hour format
  hours = hours % 12 || 12;

  // Pad hours and minutes
  const hourStr = hours.toString().padStart(2, "0");
  const minuteStr = minutes.toString().padStart(2, "0");

  return `${hourStr}:${minuteStr} ${isPM ? "PM" : "AM"}`;
};

// ✅ Utility function to format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [isClocked, setIsClocked] = useState(false);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(formatTime(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        // Need Authorization header for real API calls
        const response = await fetch("http://127.0.0.1:8000/api/attendance");
        const data = await response.json();

        const mappedLogs: TimeLog[] = data
          .map((item: any) => {
            const clockInDate = new Date(item.clock_in);
            const clockOutDate = new Date(item.clock_out);

            return [
              {
                id: `${item.id}-clockOut`,
                type: "clockOut",
                date: formatDate(clockOutDate),
                time: formatTime(clockOutDate),
              },
              {
                id: `${item.id}-clockIn`,
                type: "clockIn",
                date: formatDate(clockInDate),
                time: formatTime(clockInDate),
              },
            ];
          })
          .flat();

        setTimeLogs(mappedLogs);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    fetchAttendance();
  }, []);

  const handleClockIn = () => {
    const now = new Date();

    const newLog: TimeLog = {
      id: Date.now().toString(),
      type: "clockIn",
      date: formatDate(now),
      time: formatTime(now),
    };

    setTimeLogs([newLog, ...timeLogs]);
    setIsClocked(true);
  };

  const handleClockOut = () => {
    const now = new Date();

    const newLog: TimeLog = {
      id: Date.now().toString(),
      type: "clockOut",
      date: formatDate(now),
      time: formatTime(now),
    };

    setTimeLogs([newLog, ...timeLogs]);
    setIsClocked(false);
  };

  const renderTimeLogIcon = (type: "clockIn" | "clockOut") => {
    return (
      <View
        className={`w-12 h-12 rounded-xl justify-center items-center mr-4 ${
          type === "clockIn" ? "bg-green-50" : "bg-red-50"
        }`}
      >
        <Ionicons
          name={type === "clockIn" ? "arrow-down" : "arrow-up"}
          size={22}
          color={type === "clockIn" ? "#22c55e" : "#ef4444"}
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar backgroundColor="white" barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white">
        <View className="w-10" />

        <Text className="text-2xl font-bold text-gray-800 text-center flex-1">
          AttendEase
        </Text>

        <TouchableOpacity className="w-10 h-10 justify-center items-center">
          <Ionicons name="settings-sharp" size={24} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
        >
          {/* Current Time Section */}
          <View className="items-center my-8">
            <Text className="text-xl font-semibold text-gray-500 mb-2">
              Current Time
            </Text>
            <Text className="text-6xl font-extrabold text-gray-800">
              {currentTime}
            </Text>
          </View>

          {/* Clock In/Out Buttons */}
          <View className="flex-row justify-between mb-10 gap-4">
            <TouchableOpacity
              className={`flex-1 h-32 rounded-2xl justify-center items-center shadow-sm gap-1 ${
                isClocked ? "bg-gray-300" : "bg-green-500"
              }`}
              onPress={handleClockIn}
              disabled={isClocked}
            >
              <Ionicons name="enter" color={"white"} size={35} />
              <Text className="text-xl font-bold text-white">Clock In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 h-32 rounded-2xl justify-center items-center shadow-sm gap-1 ${
                !isClocked ? "bg-white" : "bg-gray-400"
              }`}
              onPress={handleClockOut}
              disabled={!isClocked}
            >
              <Ionicons name="exit" color={"gray"} size={35} />
              <Text className="text-xl font-bold text-gray-600">Clock Out</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Time Logs */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-800 mb-5">
              Recent Time Logs
            </Text>

            {timeLogs.map((log) => (
              <View
                key={log.id}
                className="flex-row items-center bg-white py-4 px-4 rounded-xl mb-3 shadow-sm"
              >
                {renderTimeLogIcon(log.type)}

                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-800 mb-0.5">
                    {log.type === "clockIn" ? "Clock In" : "Clock Out"}
                  </Text>
                  <Text className="text-sm text-gray-500">{log.date}</Text>
                </View>

                <Text className="text-base font-bold text-gray-800">
                  {log.time}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;
