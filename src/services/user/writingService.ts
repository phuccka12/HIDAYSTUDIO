import { apiFetch } from '../../services/_apiClient';

export interface CreateSubmissionPayload {
  user_id: string;
  task_type: string;
  prompt: string;
  content: string;
}

export const writingService = {
  async createSubmission(payload: CreateSubmissionPayload) {
    const { data, error } = await apiFetch('/submissions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (error) {
      console.error('Error creating submission:', error);
      throw error;
    }

    return data;
  },

  async getSubmission(id: string) {
    const { data, error } = await apiFetch(`/submissions/${id}`);
    if (error) {
      console.error('Error fetching submission:', error);
      throw error;
    }
    return data;
  }
};
