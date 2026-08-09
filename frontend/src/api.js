import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export const getTeams              = async ()              => (await api.get('/teams')).data;
export const getTeamById           = async (id)            => (await api.get(`/teams/${id}`)).data;
export const getPredictions        = async ()              => (await api.get('/predictions')).data;
export const getRecommendations    = async ()              => (await api.get('/recommendations')).data;
export const getAlignmentHistory   = async (days = 7)     => (await api.get(`/alignment-history?days=${days}`)).data;
export const getDriftHotspots      = async ()              => (await api.get('/drift/hotspots')).data;
export const getImpactModel        = async ()              => (await api.get('/drift/impact-model')).data;
export const autoCorrectTeam       = async (teamId)        => (await api.post('/drift/auto-correct', { teamId })).data;
export const simulateUnderstanding = async (teamId, pct)   => (await api.post('/drift/simulate-understanding', { teamId, informedPercent: pct })).data;
export const applyRecommendation   = async (id)            => (await api.post(`/recommendations/${id}/apply`)).data;
export const analyzeStrategy       = async (teamId, doc, comms) => (await api.post('/analyze', { team_id: teamId, strategy_doc: doc, communications: comms })).data;

// ── Causal Reasoning ──────────────────────────────────────────────────────────
export const getCausalReport       = async ()       => (await api.get('/causal/report')).data;
export const getCausalReportByTeam = async (teamId) => (await api.get(`/causal/report/${teamId}`)).data;

// ── Network Intelligence ──────────────────────────────────────────────────────
export const getNetworkGraph        = async ()       => (await api.get('/network/graph')).data;
export const getMessageDegradation  = async (teamId) => (await api.get(`/network/degradation/${teamId}`)).data;

export default api;
