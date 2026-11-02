import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PropertiesView } from './components/PropertiesView';
import { PropertyRegistrationView } from './components/PropertyRegistrationView';
import { Viewer3D } from './components/Viewer3D';
import { GISMapView } from './components/GISMapView';
import { ComplianceView } from './components/ComplianceView';
import { SettingsView } from './components/SettingsView';
import { cadastreApi } from './services/api';
import { PropertyModel, DashboardStats } from './types/cadastre';
import { Box, Layers, AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [properties, setProperties] = useState<PropertyModel[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyModel | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch initial data
  const loadData = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const [props, stats] = await Promise.all([
        cadastreApi.getAllProperties(),
        cadastreApi.getDashboardStats()
      ]);
      setProperties(props);
      setDashboardStats(stats);
      if (props.length > 0 && !selectedProperty) {
        setSelectedProperty(props[0]);
      } else if (selectedProperty) {
        // Refresh selected property with updated data
        const updated = props.find(p => p.id === selectedProperty.id) || props[0];
        setSelectedProperty(updated);
      }
    } catch (err: any) {
      console.error('Failed to load cadastre data:', err);
      setLoadError(err.message || 'Error communicating with backend API');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLaunch3D = (prop: PropertyModel) => {
    setSelectedProperty(prop);
    setCurrentView('3d');
  };

  const handleOpenMap = (prop: PropertyModel) => {
    setSelectedProperty(prop);
    setCurrentView('map');
  };

  const handlePropertyCreated = (newProp: PropertyModel) => {
    setSelectedProperty(newProp);
    loadData();
  };

  const violationsCount = properties.filter(
    p => p.compliance_status === 'Non-Compliant' || p.compliance_status === 'Critical Violation'
  ).length;

  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-100 overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        propertiesCount={properties.length}
        violationsCount={violationsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onRefresh={loadData}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-sm font-medium">Connecting to Spatial Cadastre 3D Engine...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-950/40 border border-red-800 rounded-xl p-6 text-center space-y-3 max-w-lg mx-auto mt-12">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Connection Error</h3>
              <p className="text-xs text-red-300">{loadError}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  stats={dashboardStats}
                  onSelectProperty={setSelectedProperty}
                  onNavigateToView={setCurrentView}
                  onLaunch3D={handleLaunch3D}
                />
              )}

              {currentView === 'properties' && (
                <PropertiesView
                  properties={properties}
                  onSelectProperty={setSelectedProperty}
                  onLaunch3D={handleLaunch3D}
                  onOpenMap={handleOpenMap}
                  onRefresh={loadData}
                />
              )}

              {currentView === 'register' && (
                <PropertyRegistrationView
                  onPropertyCreated={handlePropertyCreated}
                  onNavigateToView={setCurrentView}
                />
              )}

              {currentView === '3d' && (
                <div className="h-full flex flex-col space-y-4">
                  {/* Property Selector Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Box className="w-5 h-5 text-sky-400" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Active 3D Spatial Model:
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedProperty?.id || ''}
                        onChange={(e) => {
                          const match = properties.find(p => p.id === e.target.value);
                          if (match) setSelectedProperty(match);
                        }}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                      >
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.ulpin_3d}) - {p.compliance_status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 3D Visualizer Component */}
                  <div className="flex-1 min-h-[600px]">
                    {selectedProperty ? (
                      <Viewer3D property={selectedProperty} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        No property selected for 3D visualization.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentView === 'map' && (
                <div className="h-full">
                  <GISMapView
                    properties={properties}
                    selectedProperty={selectedProperty}
                    onSelectProperty={setSelectedProperty}
                    onOpen3DViewer={handleLaunch3D}
                  />
                </div>
              )}

              {currentView === 'compliance' && (
                <ComplianceView
                  properties={properties}
                  onLaunch3D={handleLaunch3D}
                />
              )}

              {currentView === 'settings' && (
                <SettingsView onRefreshData={loadData} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
