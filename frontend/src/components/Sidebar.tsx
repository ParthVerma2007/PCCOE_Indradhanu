import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  PlusCircle, 
  Box, 
  Map as MapIcon, 
  Scale, 
  Settings,
  Layers,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  propertiesCount: number;
  violationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  propertiesCount,
  violationsCount,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'Properties Registry', icon: Building2, count: propertiesCount },
    { id: 'register', label: 'Add 3D Property', icon: PlusCircle },
    { id: '3d', label: '3D Building Viewer', icon: Box },
    { id: 'map', label: 'GIS Cadastre Map', icon: MapIcon },
    { id: 'compliance', label: 'Compliance Audit', icon: Scale, badge: violationsCount > 0 ? `${violationsCount} Violations` : undefined },
    { id: 'settings', label: 'Settings & Datum', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between p-4 flex-shrink-0 min-h-screen">
      <div className="space-y-6">
        {/* Brand / Title */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-950">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-wider uppercase font-mono">
              SpatialCadastre<span className="text-sky-400">3D</span>
            </h1>
            <p className="text-[10px] text-slate-400">Unified 3D Spatial Index</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.count !== undefined && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                )}

                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">ULPIN Scheme:</span>
            <span className="text-sky-400 font-mono font-semibold">3D-CAD v1.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Vertical Datum:</span>
            <span className="text-slate-300 font-mono">MSL + WGS84</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span className="text-slate-400">Database:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
              SQLite Persistent
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 text-center">
          SpatialCadastre3D MVP Prototype
        </div>
      </div>
    </aside>
  );
};
