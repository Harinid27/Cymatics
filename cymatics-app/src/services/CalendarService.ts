import ApiService from './ApiService';
import envConfig from '../config/environment';

// Types for calendar events
export interface CalendarEvent {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectEvent {
  id: number;
  code: string;
  name: string;
  company: string;
  type: string;
  status: string;
  shootStartDate: string;
  shootEndDate: string;
  amount: number;
  location: string;
  client: {
    name: string;
    company: string;
  };
}

export interface CalendarEventData {
  id: number;
  title: string;
  type: 'project' | 'calendar' | 'income' | 'expense' | 'entertainment' | 'project-start' | 'project-end';
  startDate: Date;
  endDate?: Date;
  color: string;
  projectCode?: string;
  projectId?: number;
  amount?: number;
  location?: string;
  description?: string;
  status?: string;
  isCompleted?: boolean;
  projectStartDate?: Date; // Add project start date for sorting priority
}

export interface DayEvents {
  [key: string]: CalendarEventData[]; // key is date string (YYYY-MM-DD)
}

export interface CalendarResponse {
  success: boolean;
  data: CalendarEvent[];
  message: string;
}

export interface ProjectsResponse {
  success: boolean;
  data: {
    projects: ProjectEvent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

class CalendarService {
  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      // Check if ApiService is available
      if (!ApiService || typeof ApiService.get !== 'function') {
        console.warn('ApiService not available for calendar events');
        return [];
      }

      // Validate input dates
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Invalid dates provided to getCalendarEvents');
        return [];
      }

      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const response = await ApiService.get<CalendarEvent[]>(
        '/api/calendar/events/range',
        params
      );

      console.log('Calendar events API response:', response);

      if (response && response.success && response.data) {
        // Ensure response.data is an array and filter out invalid events
        const events = Array.isArray(response.data) ? response.data : [];
        return events.filter(event =>
          event &&
          event.id &&
          event.title &&
          event.startTime &&
          event.endTime
        );
      }

      console.log('No calendar events found or API error:', response?.error || 'Unknown error');
      return [];
    } catch (error) {
      console.error('Calendar events fetch error:', error);
      return [];
    }
  }

  /**
   * Get projects with shoot dates for calendar display
   */
  async getProjectEvents(startDate: Date, endDate: Date): Promise<ProjectEvent[]> {
    try {
      // Check if ApiService is available
      if (!ApiService || typeof ApiService.get !== 'function') {
        console.warn('ApiService not available for project events');
        return [];
      }

      // Validate input dates
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Invalid dates provided to getProjectEvents');
        return [];
      }

      // Check if envConfig is available
      if (!envConfig || !envConfig.PROJECTS_ENDPOINT) {
        console.warn('Environment config not available for projects endpoint');
        return [];
      }

      const params = {
        limit: 1000, // Get all projects for calendar view
        page: 1,
      };

      console.log('🔄 Fetching projects for calendar from:', envConfig.PROJECTS_ENDPOINT);
      const response = await ApiService.get<any>(envConfig.PROJECTS_ENDPOINT, params);

      console.log('📅 Project events API response:', {
        success: response?.success,
        hasData: !!response?.data,
        dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
        dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A',
        error: response?.error,
        status: response?.status,
      });

      if (response && response.success && response.data) {
        // Handle different response formats
        let projects: any[] = [];

        if (Array.isArray(response.data)) {
          // Direct array response
          projects = response.data;
        } else if (response.data.projects && Array.isArray(response.data.projects)) {
          // Wrapped in projects property
          projects = response.data.projects;
        } else {
          console.warn('Unexpected project data format:', response.data);
          return [];
        }

        console.log(`📊 Found ${projects.length} projects, filtering for calendar dates...`);

        // Filter projects that have valid shoot dates
        const validProjects = projects.filter(project => {
          if (!project) {
            return false;
          }

          const hasStartDate = project.shootStartDate && project.shootStartDate !== null;
          const hasEndDate = project.shootEndDate && project.shootEndDate !== null;

          if (!hasStartDate && !hasEndDate) {
            return false;
          }

          try {
            const shootStartDate = new Date(project.shootStartDate);
            if (isNaN(shootStartDate.getTime())) {
              return false;
            }

            // Check if project start date is in the range
            const startInRange = shootStartDate >= startDate && shootStartDate <= endDate;

            // Check if project end date is in the range (if it exists)
            let endInRange = false;
            if (project.shootEndDate) {
              const shootEndDate = new Date(project.shootEndDate);
              if (!isNaN(shootEndDate.getTime())) {
                endInRange = shootEndDate >= startDate && shootEndDate <= endDate;
              }
            }

            // Include project if either start or end date is in the range
            return startInRange || endInRange;
          } catch (error) {
            console.warn('Invalid shoot date for project:', project.id, project.shootStartDate);
            return false;
          }
        });

        console.log(`✅ Found ${validProjects.length} projects with valid dates for calendar`);
        return validProjects;
      }

      console.log('❌ No project events found or API error:', response?.error || 'Unknown error');
      return [];
    } catch (error) {
      console.error('Project events fetch error:', error);
      return [];
    }
  }

  /**
   * Get all events for calendar display (combines calendar events and projects)
   */
  async getAllEventsForMonth(year: number, month: number): Promise<DayEvents> {
    try {
      // Validate input parameters
      if (!year || !month || isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        console.warn('Invalid year or month provided to getAllEventsForMonth:', year, month);
        return {};
      }

      // Get first and last day of the month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      // Validate generated dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Invalid date range generated:', startDate, endDate);
        return {};
      }

      console.log(`Fetching events for ${year}-${month + 1} (${startDate.toISOString()} to ${endDate.toISOString()})`);

      // Fetch both calendar events and project events
      let calendarEvents: CalendarEvent[] = [];
      let projectEvents: ProjectEvent[] = [];

      try {
        [calendarEvents, projectEvents] = await Promise.all([
          this.getCalendarEvents(startDate, endDate),
          this.getProjectEvents(startDate, endDate),
        ]);
      } catch (apiError) {
        console.error('API calls failed:', apiError);
        return {};
      }

      console.log(`Found ${calendarEvents.length} calendar events and ${projectEvents.length} project events`);

      // Debug: Log project events details
      if (projectEvents.length > 0) {
        console.log('Project events details:');
        projectEvents.forEach((project, index) => {
          console.log(`  Project ${index + 1}:`, {
            id: project.id,
            name: project.name,
            code: project.code,
            shootStartDate: project.shootStartDate,
            shootEndDate: project.shootEndDate,
            hasStartDate: !!project.shootStartDate,
            hasEndDate: !!project.shootEndDate
          });
        });
      } else {
        console.log('No project events found for this month');
      }

      // Combine and organize events by date
      const dayEvents: DayEvents = {};

      // Add calendar events
      if (Array.isArray(calendarEvents) && calendarEvents.length > 0) {
        calendarEvents.forEach(event => {
          try {
            if (!event || !event.startTime || !event.title) {
              console.warn('Invalid calendar event:', event);
              return;
            }

            const eventDate = new Date(event.startTime);
            if (isNaN(eventDate.getTime())) {
              console.warn('Invalid event start time:', event.startTime);
              return;
            }

            const dateKey = eventDate.toISOString().split('T')[0];

            if (!dayEvents[dateKey]) {
              dayEvents[dateKey] = [];
            }

            dayEvents[dateKey].push({
              id: event.id || Math.random(),
              title: event.title || 'Untitled Event',
              type: 'calendar',
              startDate: eventDate,
              endDate: event.endTime ? new Date(event.endTime) : eventDate,
              color: '#4ECDC4',
              description: event.title || 'Calendar Event',
            });
          } catch (error) {
            console.warn('Error processing calendar event:', event, error);
          }
        });
      }

      // Add project events (separate start and end dates)
      if (Array.isArray(projectEvents) && projectEvents.length > 0) {
        console.log(`Processing ${projectEvents.length} project events for calendar display`);
        projectEvents.forEach((project, index) => {
          try {
            if (!project || !project.shootStartDate) {
              console.warn('Invalid project event:', project);
              return;
            }

            // Safely extract project data with fallbacks
            const projectName = project.name || 'Untitled Project';
            const projectType = project.type || 'Unknown';
            const clientCompany = project.client?.company || 'Unknown Client';
            const projectCode = project.code || 'N/A';

            console.log(`Processing project ${index + 1}: ${projectName} (${projectCode})`);
            console.log(`  Start Date: ${project.shootStartDate}`);
            console.log(`  End Date: ${project.shootEndDate}`);

            // Determine project status and colors
            const projectStatus = project.status?.toLowerCase() || 'unknown';
            const isCompleted = projectStatus === 'completed' || projectStatus === 'finished' || projectStatus === 'done';

            console.log(`  Project Status: ${projectStatus}, Is Completed: ${isCompleted}`);

            // Add project start date event
            if (project.shootStartDate) {
              const startDate = new Date(project.shootStartDate);
              console.log(`  Parsed Start Date: ${startDate}, Valid: ${!isNaN(startDate.getTime())}`);

              if (!isNaN(startDate.getTime())) {
                const startDateKey = startDate.toISOString().split('T')[0];
                console.log(`  Adding start date event for ${startDateKey}`);

                if (!dayEvents[startDateKey]) {
                  dayEvents[startDateKey] = [];
                }

                // Use grey color for completed projects, green for active projects
                const startColor = isCompleted ? '#9E9E9E' : '#4CAF50';

                dayEvents[startDateKey].push({
                  id: project.id || Math.random(),
                  title: `${projectCode} Start`,
                  type: 'project-start',
                  startDate: startDate,
                  endDate: undefined,
                  color: startColor,
                  projectCode: projectCode,
                  projectId: project.id,
                  amount: project.amount || 0,
                  location: project.location || '',
                  description: `${projectName} - Start Date${isCompleted ? ' (Completed)' : ''}`,
                  status: projectStatus,
                  isCompleted: isCompleted,
                  projectStartDate: startDate, // Add project start date for sorting
                });
                console.log(`  ✅ Start date event added successfully with color: ${startColor}`);
              } else {
                console.log(`  ❌ Invalid start date: ${project.shootStartDate}`);
              }
            } else {
              console.log(`  ⚠️ No start date provided for project ${projectCode}`);
            }

            // Add project end date event (if exists)
            if (project.shootEndDate) {
              const endDate = new Date(project.shootEndDate);
              console.log(`  Parsed End Date: ${endDate}, Valid: ${!isNaN(endDate.getTime())}`);

              if (!isNaN(endDate.getTime())) {
                const endDateKey = endDate.toISOString().split('T')[0];
                console.log(`  Adding end date event for ${endDateKey}`);

                if (!dayEvents[endDateKey]) {
                  dayEvents[endDateKey] = [];
                }

                // Use grey color for completed projects, red for active projects
                const endColor = isCompleted ? '#9E9E9E' : '#F44336';

                dayEvents[endDateKey].push({
                  id: (project.id || Math.random()) + 0.1, // Slightly different ID for end date
                  title: `${projectCode} End`,
                  type: 'project-end',
                  startDate: endDate,
                  endDate: undefined,
                  color: endColor,
                  projectCode: projectCode,
                  projectId: project.id,
                  amount: project.amount || 0,
                  location: project.location || '',
                  description: `${projectName} - End Date${isCompleted ? ' (Completed)' : ''}`,
                  status: projectStatus,
                  isCompleted: isCompleted,
                  projectStartDate: startDate, // Add project start date for sorting (use start date even for end events)
                });
                console.log(`  ✅ End date event added successfully with color: ${endColor}`);
              } else {
                console.log(`  ❌ Invalid end date: ${project.shootEndDate}`);
              }
            } else {
              console.log(`  ⚠️ No end date provided for project ${projectCode}`);
            }
          } catch (error) {
            console.warn('Error processing project event:', project, error);
          }
        });
      }

      // Sort events by priority within each day
      Object.keys(dayEvents).forEach(dateKey => {
        dayEvents[dateKey].sort((a, b) => {
          // Priority 1: For project events on the same date, prioritize by project start date
          if (a.type?.includes('project') && b.type?.includes('project')) {
            // Extract project start dates for comparison
            const aProjectStartTime = a.projectStartDate ? new Date(a.projectStartDate).getTime() :
                                     (a.type === 'project-start' ? a.startDate.getTime() : Infinity);
            const bProjectStartTime = b.projectStartDate ? new Date(b.projectStartDate).getTime() :
                                     (b.type === 'project-start' ? b.startDate.getTime() : Infinity);

            if (aProjectStartTime !== bProjectStartTime) {
              return aProjectStartTime - bProjectStartTime;
            }
          }

          // Priority 2: Sort by event start time
          return a.startDate.getTime() - b.startDate.getTime();
        });
      });

      const eventDaysCount = Object.keys(dayEvents).length;
      console.log(`Organized events into ${eventDaysCount} days`);

      // If no events found, calendar will show empty (which is correct for empty database)
      if (eventDaysCount === 0) {
        console.log('No events found for this month, calendar will show empty');
      }

      return dayEvents;
    } catch (error) {
      console.error('Error fetching all events for month:', error);
      return {};
    }
  }

  /**
   * Get color for project type
   */
  private getProjectColor(type: string | null | undefined): string {
    if (!type || typeof type !== 'string') {
      return '#95A5A6'; // Default gray color
    }

    const colors: { [key: string]: string } = {
      'Wedding': '#FF6B6B',
      'Corporate': '#4ECDC4',
      'Photography': '#45B7D1',
      'Videography': '#96CEB4',
      'Event': '#FFEAA7',
      'Portrait': '#DDA0DD',
      'Product': '#98D8C8',
    };

    return colors[type.trim()] || '#95A5A6';
  }

  /**
   * Create a new calendar event
   */
  async createCalendarEvent(title: string, startTime: Date, endTime: Date): Promise<CalendarEvent | null> {
    try {
      // Check if ApiService is available
      if (!ApiService || typeof ApiService.post !== 'function') {
        console.warn('ApiService not available for creating calendar event');
        return null;
      }

      const eventData = {
        title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const response = await ApiService.post<CalendarEvent>(
        '/api/calendar/events',
        eventData
      );

      console.log('Create calendar event response:', response);

      if (response.success) {
        return response.data;
      }

      console.error('Failed to create calendar event:', response.error);
      return null;
    } catch (error) {
      console.error('Create calendar event error:', error);
      return null;
    }
  }

  /**
   * Update a calendar event
   */
  async updateCalendarEvent(id: number, title?: string, startTime?: Date, endTime?: Date): Promise<CalendarEvent | null> {
    try {
      // Check if ApiService is available
      if (!ApiService || typeof ApiService.put !== 'function') {
        console.warn('ApiService not available for updating calendar event');
        return null;
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (startTime !== undefined) updateData.startTime = startTime.toISOString();
      if (endTime !== undefined) updateData.endTime = endTime.toISOString();

      const response = await ApiService.put<CalendarEvent>(
        `/api/calendar/events/${id}`,
        updateData
      );

      console.log('Update calendar event response:', response);

      if (response.success) {
        return response.data;
      }

      console.error('Failed to update calendar event:', response.error);
      return null;
    } catch (error) {
      console.error('Update calendar event error:', error);
      return null;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(id: number): Promise<boolean> {
    try {
      // Check if ApiService is available
      if (!ApiService || typeof ApiService.delete !== 'function') {
        console.warn('ApiService not available for deleting calendar event');
        return false;
      }

      const response = await ApiService.delete(`/api/calendar/events/${id}`);

      console.log('Delete calendar event response:', response);

      if (response.success) {
        return true;
      }

      console.error('Failed to delete calendar event:', response.error);
      return false;
    } catch (error) {
      console.error('Delete calendar event error:', error);
      return false;
    }
  }

  /**
   * Get today's events
   */
  async getTodayEvents(): Promise<CalendarEventData[]> {
    try {
      const today = new Date();
      const events = await this.getAllEventsForMonth(today.getFullYear(), today.getMonth());
      const todayKey = today.toISOString().split('T')[0];
      return events[todayKey] || [];
    } catch (error) {
      console.error('Error fetching today\'s events:', error);
      return [];
    }
  }
}

export const calendarService = new CalendarService();
