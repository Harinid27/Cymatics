import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { calendarService, CalendarEventData, DayEvents } from '@/src/services/CalendarService';

// Use types from CalendarService

export default function CalendarScreen() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<DayEvents>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  const handleDatePress = (date: number) => {
    setSelectedDate(date);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(1); // Reset to first day of new month
    loadCalendarData(newDate); // Load data for new month
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(1); // Reset to first day of new month
    loadCalendarData(newDate); // Load data for new month
  };

  // Load calendar data for the current month
  const loadCalendarData = async (date: Date = currentDate) => {
    try {
      setError(null);

      // Validate the date
      if (!date || isNaN(date.getTime())) {
        console.warn('Invalid date provided to loadCalendarData, using current date');
        date = new Date();
      }

      console.log('Loading calendar data for:', date.getFullYear(), date.getMonth() + 1);

      // Get all events for the month from the backend
      const monthEvents = await calendarService.getAllEventsForMonth(
        date.getFullYear(),
        date.getMonth()
      );

      console.log('Loaded calendar events:', monthEvents);

      // Ensure monthEvents is a valid object
      if (monthEvents && typeof monthEvents === 'object') {
        setEvents(monthEvents);
      } else {
        console.warn('Invalid events data received, using empty object');
        setEvents({});
      }

    } catch (error) {
      console.error('Error loading calendar data:', error);
      setError('Failed to load calendar data. Please try again.');
      setEvents({}); // Set empty events on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle event press (for future implementation)
  const handleEventPress = (event: CalendarEventData) => {
    console.log('Event pressed:', event);
    // TODO: Navigate to event details or show modal
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCalendarData();
  };

  // Load data on component mount
  useEffect(() => {
    loadCalendarData();
  }, []);

  // Days of the week (starting with Monday like in the image)
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Day names for current date display
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar dates dynamically (starting with Monday)
  const generateCalendarDates = () => {
    try {
      if (!currentDate || isNaN(currentDate.getTime())) {
        console.warn('Invalid currentDate, using current date');
        const fallbackDate = new Date();
        return generateCalendarDatesForDate(fallbackDate);
      }

      return generateCalendarDatesForDate(currentDate);
    } catch (error) {
      console.error('Error generating calendar dates:', error);
      return []; // Return empty array on error
    }
  };

  const generateCalendarDatesForDate = (date: Date) => {
    const dates = [];
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of the month and number of days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    if (isNaN(firstDay.getTime()) || isNaN(lastDay.getTime())) {
      console.warn('Invalid date calculations for:', year, month);
      return [];
    }

    let firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = lastDay.getDate();

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

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

  // Get events for a specific date
  const getEventsForDate = (date: number): CalendarEventData[] => {
    try {
      if (!date || isNaN(date) || !currentDate || isNaN(currentDate.getTime())) {
        return [];
      }

      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
      if (isNaN(targetDate.getTime())) {
        return [];
      }

      const dateKey = targetDate.toISOString().split('T')[0];

      if (!events || typeof events !== 'object') {
        return [];
      }

      return Array.isArray(events[dateKey]) ? events[dateKey] : [];
    } catch (error) {
      console.warn('Error getting events for date:', date, error);
      return [];
    }
  };

  // Render event chip
  const renderEventChip = (event: CalendarEventData, index: number) => {
    try {
      if (!event) {
        return null;
      }

      const eventId = event.id || `event-${index}`;
      const eventTitle = event.projectCode || event.title || 'Untitled Event';
      const eventColor = event.color || '#95A5A6';

      return (
        <TouchableOpacity
          key={`${eventId}-${index}`}
          style={[styles.eventChip, { backgroundColor: eventColor }]}
          onPress={() => handleEventPress(event)}
        >
          <Text style={styles.eventChipText} numberOfLines={1}>
            {eventTitle}
          </Text>
        </TouchableOpacity>
      );
    } catch (error) {
      console.warn('Error rendering event chip:', event, error);
      return null;
    }
  };

  const renderCalendarDate = (date: number | null, index: number) => {
    try {
      if (date === null || date === undefined) {
        return <View key={`empty-${index}`} style={styles.emptyDate} />;
      }

      const isSelected = date === selectedDate;
      const isTodayDate = isToday(date);
      const dayEvents = getEventsForDate(date);
      const visibleEvents = Array.isArray(dayEvents) ? dayEvents.slice(0, 2) : []; // Show max 2 events
      const moreCount = Math.max(0, dayEvents.length - visibleEvents.length);

      return (
        <TouchableOpacity
          key={`date-${index}-${date}`}
          style={styles.dateContainer}
          onPress={() => handleDatePress(date)}
        >
          {/* Date number */}
          <View style={styles.dateHeader}>
            <Text
              style={[
                styles.dateText,
                isTodayDate && styles.todayDateText,
                isSelected && !isTodayDate && styles.selectedDateText,
              ]}
            >
              {date}
            </Text>
            {isTodayDate && <View style={styles.todayIndicator} />}
          </View>

          {/* Events */}
          <View style={styles.eventsContainer}>
            {visibleEvents.map((event, eventIndex) => {
              const renderedChip = renderEventChip(event, eventIndex);
              return renderedChip;
            }).filter(Boolean)}
            {moreCount > 0 && (
              <Text style={styles.moreEventsText}>+{moreCount} more</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    } catch (error) {
      console.warn('Error rendering calendar date:', date, error);
      return <View key={`error-${index}`} style={styles.emptyDate} />;
    }
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#000']}
            tintColor="#000"
          />
        }
      >
        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity style={styles.navButton} onPress={handlePrevMonth}>
            <MaterialIcons name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.monthYearContainer}>
            <Text style={styles.monthYearText}>
              {getCurrentMonthName()} {currentDate.getFullYear()}
            </Text>
          </View>

          <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
            <MaterialIcons name="chevron-right" size={24} color="#000" />
          </TouchableOpacity>
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

          {/* Loading State */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading calendar...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadCalendarData()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Calendar Grid */
            <View style={styles.calendarGrid}>
              {Array.isArray(calendarDates) && calendarDates.length > 0 ? (
                calendarDates.map((date, index) => renderCalendarDate(date, index))
              ) : (
                <View style={styles.calendarErrorContainer}>
                  <Text style={styles.calendarErrorText}>Unable to generate calendar</Text>
                </View>
              )}
            </View>
          )}
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
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 12,
    padding: 15,
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayOfWeekContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDate: {
    width: '14.28%',
    height: 80,
  },
  dateContainer: {
    width: '14.28%',
    height: 80,
    padding: 4,
    marginBottom: 5,
  },
  dateHeader: {
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  todayDateText: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedDateText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  todayIndicator: {
    position: 'absolute',
    top: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    zIndex: -1,
  },
  eventsContainer: {
    flex: 1,
  },
  eventChip: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 1,
  },
  eventChipText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '500',
  },
  moreEventsText: {
    fontSize: 8,
    color: '#666',
    fontWeight: '500',
    marginTop: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarErrorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  calendarErrorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 50,
  },
});
