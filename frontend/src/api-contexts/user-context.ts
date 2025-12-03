const API_BASE_URL = 'http://127.0.0.1:5000';

export interface User {
  user_id: string;
  canvas_username?: string;
  canvas_domain?: string;
  profile_picture?: string;
  total_points: number;
  current_level: number;
  last_activity_at?: string;
  email?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

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

  async signup(email: string, password: string, displayName: string): Promise<{ user: User }> {
    const url = `${this.baseUrl}/auth/signup`;
    const signupResponse = await this.fetchWithErrorHandling(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, display_name: displayName }),
    });

    return this.login(email, password);
  }

  async login(email: string, password: string): Promise<{ user: User }> {
    const url = `${this.baseUrl}/auth/login`;
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  }

  async getUser(userId: string): Promise<User> {
    const url = `${this.baseUrl}/db/users?user_id=${encodeURIComponent(userId)}`;
    return this.fetchWithErrorHandling<User>(url);
  }

  async updateUser(
    userId: string, 
    updates: {
      canvas_username?: string;
      canvas_domain?: string;
      canvas_api_key?: string;
      profile_picture?: string;
    }
  ): Promise<{ status: string; user_id: string; user: User }> {
    const url = `${this.baseUrl}/db/users/${encodeURIComponent(userId)}`;
    return this.fetchWithErrorHandling(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  }

  async getTasks(userId: string, scheduledStartAt?: string, scheduledEndAt?: string, isCompleted?: boolean): Promise<any[]> {
    let url = `${this.baseUrl}/db/tasks?user_id=${encodeURIComponent(userId)}`;
    if (scheduledStartAt) url += `&scheduled_start_at=${encodeURIComponent(scheduledStartAt)}`;
    if (scheduledEndAt) url += `&scheduled_end_at=${encodeURIComponent(scheduledEndAt)}`;
    if (isCompleted !== undefined) {
      url += `&is_completed=${isCompleted}`;
    } else {
      url += `&is_completed=false`;
    }
    return this.fetchWithErrorHandling<any[]>(url);
  }

  async getCombinedTasks(userId: string): Promise<{
    incomplete_tasks: any[];
    completed_tasks: any[];
    available_courses: {value: string, label: string}[];
    available_task_types: {value: string, label: string}[];
  }> {
    const url = `${this.baseUrl}/db/tasks/combined?user_id=${encodeURIComponent(userId)}`;
    return this.fetchWithErrorHandling(url);
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

export const apiService = new ApiService();