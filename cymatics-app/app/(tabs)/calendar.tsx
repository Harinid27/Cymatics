import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';

export default function CalendarScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(17);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  const handleDatePress = (date: number) => {
    setSelectedDate(date);
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
    setCurrentDate(newDate);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(1); // Reset to first day of new month
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(1); // Reset to first day of new month
  };

  // Days of the week
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Day names for current date display
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar dates dynamically
  const generateCalendarDates = () => {
    const dates = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of the month and number of days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = lastDay.getDate();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      dates.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(day);
    }

    return dates;
  };

  const calendarDates = generateCalendarDates();

  // Format current date for display
  const formatCurrentDate = () => {
    const dayName = dayNames[currentDate.getDay()];
    const monthName = monthNames[currentDate.getMonth()].substring(0, 3); // Short month name
    const day = selectedDate;
    return `${dayName}, ${monthName} ${day}`;
  };

  // Get current month name for month selector
  const getCurrentMonthName = () => {
    return monthNames[currentDate.getMonth()];
  };

  // Check if a date is today
  const isToday = (date: number) => {
    const today = new Date();
    return date === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const renderCalendarDate = (date: number | null, index: number) => {
    if (date === null) {
      return <View key={index} style={styles.emptyDate} />;
    }

    const isSelected = date === selectedDate;
    const isTodayDate = isToday(date);
    const isHighlighted = isSelected && !isTodayDate; // Selected dates get highlighted

    return (
      <TouchableOpacity
        key={index}
        style={styles.dateContainer}
        onPress={() => handleDatePress(date)}
      >
        {(isTodayDate || isHighlighted) && (
          <View
            style={[
              styles.dateCircle,
              isTodayDate && styles.todayCircle,
              isHighlighted && !isTodayDate && styles.highlightedCircle,
            ]}
          />
        )}
        <Text
          style={[
            styles.dateText,
            isTodayDate && styles.todayDateText,
            isHighlighted && !isTodayDate && styles.highlightedDateText,
          ]}
        >
          {date}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <MaterialIcons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#999" />
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <Text style={styles.currentDate}>{formatCurrentDate()}</Text>
          <View style={styles.monthNavigation}>
            <TouchableOpacity style={styles.monthSelector}>
              <Text style={styles.monthText}>{getCurrentMonthName()}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handlePrevMonth}>
              <MaterialIcons name="chevron-left" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
              <MaterialIcons name="chevron-right" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          {/* Days of Week Header */}
          <View style={styles.daysOfWeekContainer}>
            {daysOfWeek.map((day, index) => (
              <View key={index} style={styles.dayOfWeekContainer}>
                <Text style={styles.dayOfWeekText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDates.map((date, index) => renderCalendarDate(date, index))}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Menu Drawer */}
      <MenuDrawer visible={isMenuVisible} onClose={handleMenuClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  menuButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 0,
    backgroundColor: '#fff',
    marginBottom: 20,
    marginTop: -5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: '#999',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  currentDate: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  monthText: {
    fontSize: 16,
    color: '#000',
    marginRight: 5,
  },
  navButton: {
    padding: 8,
    marginHorizontal: 5,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dayOfWeekContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayOfWeekText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDate: {
    width: '14.28%',
    height: 50,
  },
  dateContainer: {
    width: '14.28%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  dateText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '400',
    zIndex: 2,
  },
  dateCircle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    zIndex: 1,
  },
  todayCircle: {
    backgroundColor: '#000',
  },
  todayDateText: {
    color: '#fff',
    fontWeight: '600',
  },
  highlightedCircle: {
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: 'transparent',
  },
  highlightedDateText: {
    color: '#000',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 50,
  },
});
