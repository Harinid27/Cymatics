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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import MenuDrawer from '@/components/MenuDrawer';
import { calendarService, CalendarEventData, DayEvents } from '@/src/services/CalendarService';
import { useTheme } from '@/contexts/ThemeContext';

// Use types from CalendarService

export default function CalendarScreen() {
  const { colors } = useTheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<DayEvents>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event creation/editing modal states
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [isEventDetailModalVisible, setIsEventDetailModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<DayEvents>({});

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

  // Handle event press - show event details
  const handleEventPress = (event: CalendarEventData) => {
    console.log('Event pressed:', event);
    setSelectedEvent(event);
    setIsEventDetailModalVisible(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCalendarData();
  };

  // Event creation functions
  const handleCreateEvent = () => {
    // Set default time for selected date
    const selectedDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate);
    const defaultStartTime = new Date(selectedDateTime);
    defaultStartTime.setHours(9, 0, 0, 0); // 9:00 AM
    const defaultEndTime = new Date(selectedDateTime);
    defaultEndTime.setHours(10, 0, 0, 0); // 10:00 AM

    setEventTitle('');
    setEventStartTime(defaultStartTime.toISOString().slice(0, 16)); // Format for datetime-local input
    setEventEndTime(defaultEndTime.toISOString().slice(0, 16));
    setIsEditingEvent(false);
    setIsEventModalVisible(true);
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;

    setEventTitle(selectedEvent.title);
    setEventStartTime(selectedEvent.startDate.toISOString().slice(0, 16));
    setEventEndTime(selectedEvent.endDate?.toISOString().slice(0, 16) || selectedEvent.startDate.toISOString().slice(0, 16));
    setIsEditingEvent(true);
    setIsEventDetailModalVisible(false);
    setIsEventModalVisible(true);
  };

  const handleSaveEvent = async () => {
    if (!eventTitle.trim() || !eventStartTime || !eventEndTime) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const startDate = new Date(eventStartTime);
    const endDate = new Date(eventEndTime);

    if (endDate <= startDate) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    setIsCreatingEvent(true);

    try {
      if (isEditingEvent && selectedEvent) {
        // Update existing event
        const updatedEvent = await calendarService.updateCalendarEvent(
          selectedEvent.id,
          eventTitle,
          startDate,
          endDate
        );

        if (updatedEvent) {
          Alert.alert('Success', 'Event updated successfully');
          setIsEventModalVisible(false);
          loadCalendarData(); // Refresh calendar data
        } else {
          Alert.alert('Error', 'Failed to update event');
        }
      } else {
        // Create new event
        const newEvent = await calendarService.createCalendarEvent(
          eventTitle,
          startDate,
          endDate
        );

        if (newEvent) {
          Alert.alert('Success', 'Event created successfully');
          setIsEventModalVisible(false);
          loadCalendarData(); // Refresh calendar data
        } else {
          Alert.alert('Error', 'Failed to create event');
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event. Please try again.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await calendarService.deleteCalendarEvent(selectedEvent.id);

              if (success) {
                Alert.alert('Success', 'Event deleted successfully');
                setIsEventDetailModalVisible(false);
                loadCalendarData(); // Refresh calendar data
              } else {
                Alert.alert('Error', 'Failed to delete event');
              }
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredEvents(events);
      return;
    }

    const filtered: DayEvents = {};
    const lowerQuery = query.toLowerCase();

    Object.keys(events).forEach(dateKey => {
      const dayEvents = events[dateKey];
      const matchingEvents = dayEvents.filter(event =>
        event.title.toLowerCase().includes(lowerQuery) ||
        event.description?.toLowerCase().includes(lowerQuery) ||
        event.projectCode?.toLowerCase().includes(lowerQuery)
      );

      if (matchingEvents.length > 0) {
        filtered[dateKey] = matchingEvents;
      }
    });

    setFilteredEvents(filtered);
  };

  // Load data on component mount
  useEffect(() => {
    loadCalendarData();
  }, []);

  // Update filtered events when events change
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setFilteredEvents(events);
    }
  }, [events, searchQuery]);

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

  // Get events for a specific date (using filtered events if search is active)
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
      const eventsToUse = searchQuery.trim() ? filteredEvents : events;

      if (!eventsToUse || typeof eventsToUse !== 'object') {
        return [];
      }

      return Array.isArray(eventsToUse[dateKey]) ? eventsToUse[dateKey] : [];
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <MaterialIcons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="clear" size={20} color="#999" />
            </TouchableOpacity>
          )}
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

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateEvent}>
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Event Creation/Edit Modal */}
      <Modal
        visible={isEventModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEventModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEventModalVisible(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditingEvent ? 'Edit Event' : 'New Event'}
            </Text>
            <TouchableOpacity
              onPress={handleSaveEvent}
              disabled={isCreatingEvent}
            >
              <Text style={[styles.modalSaveButton, isCreatingEvent && styles.disabledButton]}>
                {isCreatingEvent ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event Title</Text>
              <TextInput
                style={styles.textInput}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Enter event title"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Time</Text>
              <TextInput
                style={styles.textInput}
                value={eventStartTime}
                onChangeText={setEventStartTime}
                placeholder="YYYY-MM-DDTHH:MM"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Time</Text>
              <TextInput
                style={styles.textInput}
                value={eventEndTime}
                onChangeText={setEventEndTime}
                placeholder="YYYY-MM-DDTHH:MM"
                placeholderTextColor="#999"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        visible={isEventDetailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEventDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEventDetailModalVisible(false)}>
              <Text style={styles.modalCancelButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Event Details</Text>
            <TouchableOpacity onPress={handleEditEvent}>
              <Text style={styles.modalSaveButton}>Edit</Text>
            </TouchableOpacity>
          </View>

          {selectedEvent && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.eventDetailContainer}>
                <Text style={styles.eventDetailTitle}>{selectedEvent.title}</Text>

                <View style={styles.eventDetailRow}>
                  <MaterialIcons name="event" size={20} color="#666" />
                  <Text style={styles.eventDetailText}>
                    {selectedEvent.startDate.toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.eventDetailRow}>
                  <MaterialIcons name="access-time" size={20} color="#666" />
                  <Text style={styles.eventDetailText}>
                    {selectedEvent.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {selectedEvent.endDate && ` - ${selectedEvent.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </Text>
                </View>

                {selectedEvent.type && (
                  <View style={styles.eventDetailRow}>
                    <MaterialIcons name="category" size={20} color="#666" />
                    <Text style={styles.eventDetailText}>{selectedEvent.type}</Text>
                  </View>
                )}

                {selectedEvent.projectCode && (
                  <View style={styles.eventDetailRow}>
                    <MaterialIcons name="work" size={20} color="#666" />
                    <Text style={styles.eventDetailText}>{selectedEvent.projectCode}</Text>
                  </View>
                )}

                {selectedEvent.location && (
                  <View style={styles.eventDetailRow}>
                    <MaterialIcons name="location-on" size={20} color="#666" />
                    <Text style={styles.eventDetailText}>{selectedEvent.location}</Text>
                  </View>
                )}

                {selectedEvent.description && (
                  <View style={styles.eventDetailRow}>
                    <MaterialIcons name="description" size={20} color="#666" />
                    <Text style={styles.eventDetailText}>{selectedEvent.description}</Text>
                  </View>
                )}

                {/* Only show delete button for calendar events (not project events) */}
                {selectedEvent.type === 'calendar' && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteEvent}
                  >
                    <MaterialIcons name="delete" size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>Delete Event</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

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
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#000',
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
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  // Event Detail Modal
  eventDetailContainer: {
    padding: 20,
  },
  eventDetailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  eventDetailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 30,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
