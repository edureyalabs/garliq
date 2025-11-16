export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  subscription_status: 'none' | 'active' | 'expired' | 'cancelled' | 'trial';
  subscription_expires_at: string | null;
}

export interface Post {
  id: string;
  caption: string;
  html_code: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  prompt: string | null;
  prompt_visible: boolean;
  user_id: string;
  session_id: string | null;
  is_liked?: boolean;
  is_saved?: boolean;
  first_page_content?: string | null;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface Project {
  id: string;
  title: string;
  html_code: string;
  created_at: string;
  session_id: string | null;
  is_draft: boolean;
  is_shared: boolean;
  post_id: string | null;
  prompt: string;
  updated_at: string;
  first_page_content?: string | null;
}

export interface Simulation {
  id: string;
  title: string;
  prompt: string;
  html_code: string | null;
  topic_category: string;
  framework_used: string | null;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  generation_error: string | null;
  retry_count: number;
  is_published: boolean;
  post_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimulationPost {
  id: string;
  caption: string;
  html_code: string;
  topic_category: string;
  framework_used: string;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  created_at: string;
  user_id: string;
  simulation_id: string;
  is_liked?: boolean;
  is_saved?: boolean;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface SubscriptionStatus {
  is_active: boolean;
  status: string;
  expires_at: string | null;
  days_remaining: number;
}

export type ActiveSection = 'feed' | 'course-posts' | 'course-projects' | 'sim-shared' | 'sim-labs' | 'saved-courses' | 'saved-labs' | 'subscription';

export interface DashboardStats {
  posts: number;
  projects: number;
  sharedSimulations: number;
  myLabs: number;
  savedCourses: number;
  savedLabs: number;
}