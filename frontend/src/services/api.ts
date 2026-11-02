import { PropertyModel, DashboardStats, DocumentExtractionResult } from '../types/cadastre';

const API_BASE = '/api';

export const cadastreApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to load dashboard stats');
    return res.json();
  },

  async getAllProperties(query?: string): Promise<PropertyModel[]> {
    const url = query ? `${API_BASE}/properties?query=${encodeURIComponent(query)}` : `${API_BASE}/properties`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch properties');
    return res.json();
  },

  async getPropertyById(id: string): Promise<PropertyModel> {
    const res = await fetch(`${API_BASE}/properties/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to fetch property details');
    return res.json();
  },

  async createProperty(data: any): Promise<PropertyModel> {
    const res = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to register 3D property');
    return res.json();
  },

  async deleteProperty(id: string): Promise<{ status: string; id: string }> {
    const res = await fetch(`${API_BASE}/properties/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete property');
    return res.json();
  },

  async uploadAndExtractDocument(file: File): Promise<DocumentExtractionResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/documents/upload-extract`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Document extraction failed');
    return res.json();
  },

  async resetSampleData(): Promise<{ status: string; count: number }> {
    const res = await fetch(`${API_BASE}/reset-sample-data`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset sample data');
    return res.json();
  }
};
