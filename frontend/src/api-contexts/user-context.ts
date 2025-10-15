// src/services/api.ts
const API_BASE_URL = 'http://127.0.0.1:5000';

export interface User {
  user_id: string;
  canvas_username: string;
  total_points: number;
  current_level: number;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Generic fetch wrapper with error handling
  private async fetchWithErrorHandling<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // User endpoints
  async getUser(userId: string): Promise<User> {
    const url = `${this.baseUrl}/db/users?user_id=${encodeURIComponent(userId)}`;
    return this.fetchWithErrorHandling<User>(url);
  }

  // Task endpoints
  async getTasks(userId: string, scheduledStartAt?: string, scheduledEndAt?: string, isCompleted?: boolean): Promise<any[]> {
    let url = `${this.baseUrl}/db/tasks?user_id=${encodeURIComponent(userId)}`;
    if (scheduledStartAt) url += `&scheduled_start_at=${encodeURIComponent(scheduledStartAt)}`;
    if (scheduledEndAt) url += `&scheduled_end_at=${encodeURIComponent(scheduledEndAt)}`;
    // By default, only fetch incomplete tasks (false) unless explicitly specified
    if (isCompleted !== undefined) {
      url += `&is_completed=${isCompleted}`;
    } else {
      url += `&is_completed=false`;
    }
    return this.fetchWithErrorHandling<any[]>(url);
  }

  async completeTask(taskId: string): Promise<{
    status: string;
    task_id: string;
    assignment_completed: boolean;
    points_earned: number;
    assignment_id?: string;
  }> {
    const url = `${this.baseUrl}/db/tasks/${encodeURIComponent(taskId)}/complete`;
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
    });
  }
}

// Export a singleton instance
export const apiService = new ApiService();