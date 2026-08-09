import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

export const getTeams = async () => {
  const response = await api.get('/teams');
  return response.data;
};

export const getTeamById = async (id) => {
  const response = await api.get(`/teams/${id}`);
  return response.data;
};

export const getPredictions = async () => {
  const response = await api.get('/predictions');
  return response.data;
};

export const getRecommendations = async () => {
  const response = await api.get('/recommendations');
  return response.data;
};

export const getAlignmentHistory = async (days = 7) => {
  const response = await api.get(`/alignment-history?days=${days}`);
  return response.data;
};

export const getDriftHotspots = async () => {
  const response = await api.get('/drift/hotspots');
  return response.data;
};

export const getImpactModel = async () => {
  const response = await api.get('/drift/impact-model');
  return response.data;
};

export const autoCorrectTeam = async (teamId) => {
  const response = await api.post('/drift/auto-correct', { teamId });
  return response.data;
};

export const simulateUnderstanding = async (teamId, informedPercent) => {
  const response = await api.post('/drift/simulate-understanding', { teamId, informedPercent });
  return response.data;
};

export const applyRecommendation = async (id) => {
  const response = await api.post(`/recommendations/${id}/apply`);
  return response.data;
};

export const analyzeStrategy = async (teamId, strategyDoc, communications) => {
  const response = await api.post('/analyze', {
    team_id: teamId,
    strategy_doc: strategyDoc,
    communications: communications,
  });
  return response.data;
};

export default api;
