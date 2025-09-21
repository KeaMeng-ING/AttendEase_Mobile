import { useAuth } from "@/contexts/AuthContext";
import { formatDate, formatPadTime } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
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

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [isClocked, setIsClocked] = useState(false);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [attendanceId, setAttendanceId] = useState<number | null>(null);
  const [finish, setFinish] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(formatPadTime(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/attendance", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
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
                time: formatPadTime(clockOutDate),
              },
              {
                id: `${item.id}-clockIn`,
                type: "clockIn",
                date: formatDate(clockInDate),
                time: formatPadTime(clockInDate),
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

  useEffect(() => {
    const checkClockedInStatus = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/attendance/current",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();

        if (data.clock_in && data.clock_out) {
          setFinish(true);
          return;
        } else if (data.clock_in) {
          setIsClocked(true);
          setAttendanceId(data.id);
        }
      } catch (error) {
        console.error("Error checking clocked-in status:", error);
      }
    };

    checkClockedInStatus();
  }, []);

  const handleClockIn = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/clock_in", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const now = new Date();
        const newLog: TimeLog = {
          id: Date.now().toString(),
          type: "clockIn",
          date: formatDate(now),
          time: formatPadTime(now),
        };

        setTimeLogs([newLog, ...timeLogs]);
        setIsClocked(true);
        setAttendanceId((await response.json()).attendance_id);
      }
    } catch (error) {
      console.error("Error during clock-in:", error);
    }
  };

  const handleClockOut = async () => {
    Alert.alert(
      "Confirm Clock Out",
      "Are you sure you want to clock out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clock Out",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `http://127.0.0.1:8000/api/clock_out/${attendanceId}`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
                const now = new Date();
                const newLog: TimeLog = {
                  id: Date.now().toString(),
                  type: "clockOut",
                  date: formatDate(now),
                  time: formatPadTime(now),
                };

                setTimeLogs([newLog, ...timeLogs]);
                setIsClocked(false);
                setFinish(true);
              } else {
                const errorText = await response.text();
                console.error("Clock-out failed:", errorText);
              }
            } catch (error) {
              console.error("Clock out error:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
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

        <Text className="text-2xl font-bold text-blue-500 text-center flex-1">
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
          {!finish ? (
            <>
              <View className="items-center mt-8">
                <Text className="text-xl font-semibold text-gray-500 mb-2">
                  Current Time
                </Text>
                <Text className="text-6xl font-extrabold text-gray-800">
                  {currentTime}
                </Text>
              </View>

              <View className="flex-row justify-between mb-10 gap-4 mt-8">
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
                    !isClocked ? "bg-white" : "bg-red-500"
                  }`}
                  onPress={handleClockOut}
                  disabled={!isClocked}
                >
                  <Ionicons
                    name="exit"
                    color={!isClocked ? "gray" : "white"}
                    size={35}
                  />
                  <Text
                    className={`text-xl font-bold ${
                      !isClocked ? "text-gray-600" : "text-white"
                    }`}
                  >
                    Clock Out
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="items-center mb-10 mt-3 px-6">
              <View className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm items-center">
                <Ionicons name="checkmark-circle" size={48} color="#3B82F6" />
                <Text className="text-2xl font-bold text-gray-800 mt-4">
                  Enjoy your day 🎉!
                </Text>
                <Text className="text-md font-medium text-gray-600 mt-2 text-center">
                  You have successfully completed your attendance for today.
                </Text>
              </View>
            </View>
          )}

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
