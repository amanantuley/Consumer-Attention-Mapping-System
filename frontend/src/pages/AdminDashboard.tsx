import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Video, ShieldAlert, Trash2, Edit2, Users, RefreshCw, LogOut, 
  Settings, Layers, Box, FileText, Activity, Database, Lock,
  AlertTriangle, Cpu, Terminal
} from "lucide-react";
import { userAPI, storeAPI } from "@/lib/api";
import type { User as UserType, Store } from "@/types";
import { toast } from "react-toastify";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Management states
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // Monitoring States (simulated changing metrics)
  const [cpuUsage, setCpuUsage] = useState<number>(34);
  const [memoryUsage, setMemoryUsage] = useState<number>(56);
  const [gpuUsage, setGpuUsage] = useState<number>(12);
  const [dbLoad, setDbLoad] = useState<number>(18);
  const [netTraffic, setNetTraffic] = useState<number>(45);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      // Simulate real-time hardware flux
      setCpuUsage(Math.round(25 + Math.random() * 20));
      setMemoryUsage(Math.round(50 + Math.random() * 10));
      setGpuUsage(Math.round(5 + Math.random() * 15));
      setDbLoad(Math.round(10 + Math.random() * 15));
      setNetTraffic(Math.round(30 + Math.random() * 30));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const uRes = await userAPI.getUsers();
      setUsersList(uRes.data);
      
      const sRes = await storeAPI.getStores();
      setStores(sRes.data);


    } catch (err) {
      console.error("Failed to load admin metadata:", err);
    }
  };



  // Hierarchical side navigation groups matching 4th mockup
  const menuGroups = [
    {
      title: "OVERVIEW",
      items: [{ id: "overview", label: "Dashboard Overview", icon: Layers }]
    },
    {
      title: "USER & ACCESS MANAGEMENT",
      items: [
        { id: "users", label: "User Management", icon: Users },
        { id: "roles", label: "Role Management", icon: ShieldAlert },
        { id: "permissions", label: "Permission Management", icon: Lock },
        { id: "sessions", label: "Session Management", icon: Activity }
      ]
    },
    {
      title: "STORE & DEVICE MANAGEMENT",
      items: [
        { id: "stores", label: "Store Management", icon: Layers },
        { id: "cameras", label: "Camera Management", icon: Video },
        { id: "devices", label: "Device Management", icon: Box },
        { id: "health", label: "Device Health", icon: Cpu }
      ]
    },
    {
      title: "ANALYTICS & MONITORING",
      items: [
        { id: "system", label: "System Overview", icon: Activity },
        { id: "infrastructure", label: "Infrastructure Monitor", icon: Cpu },
        { id: "api", label: "API Performance", icon: Database },
        { id: "security", label: "Security Monitoring", icon: Lock }
      ]
    },
    {
      title: "LOGS & AUDIT",
      items: [
        { id: "audit", label: "Audit Logs", icon: FileText },
        { id: "activity_logs", label: "Activity Logs", icon: Terminal }
      ]
    },
    {
      title: "SYSTEM CONFIGURATION",
      items: [
        { id: "settings", label: "System Settings", icon: Settings },
        { id: "alert_config", label: "Alert Configuration", icon: AlertTriangle },
        { id: "backup", label: "Backup & Restore", icon: Database },
        { id: "notifications", label: "Notification Settings", icon: Settings }
      ]
    }
  ];

  return (
    <div className="flex bg-[#070e17] text-slate-100 min-h-screen">
      
      {/* Sub Sidebar inside Admin Dashboard */}
      <div className="w-60 bg-[#0c1524] border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div className="space-y-5">
          <div className="flex items-center gap-2 px-2 py-3 border-b border-slate-800/60">
            <Lock className="w-5 h-5 text-blue-500" />
            <div>
              <span className="font-bold text-xs tracking-wider uppercase text-slate-200">Admin Dashboard</span>
              <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Control Center</p>
            </div>
          </div>

          <nav className="space-y-4">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[8px] font-bold text-slate-500 tracking-widest uppercase block px-2 mb-1">{group.title}</span>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-[10px] font-bold tracking-wide transition-all ${
                        isActive 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                          : "text-slate-400 hover:bg-[#121f35] hover:text-slate-100"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-2 mt-4 border-t border-slate-800/60">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded text-[10px] font-bold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#070e17]">
        <div className="max-w-[1400px] mx-auto w-full space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Global System Administration</span>
              <h1 className="text-2xl font-extrabold text-slate-100 mt-1">
                Welcome back, {user?.full_name || user?.username || "Administrator"}!
              </h1>
            </div>
            <button 
              onClick={fetchData} 
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0c1524] border border-slate-800 rounded text-xs font-bold text-slate-300 hover:bg-[#121f35] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              Reload Infrastructure Logs
            </button>
          </div>

          {/* Tab 1: Overview Dashboard */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Stores</p>
                    <h3 className="text-xl font-extrabold text-blue-400 mt-1">{stores.length || 28}</h3>
                    <span className="text-[8px] text-emerald-400">↑ 7.6% vs last week</span>
                  </CardContent>
                </Card>

                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                    <h3 className="text-xl font-extrabold text-emerald-400 mt-1">{usersList.length || 142}</h3>
                    <span className="text-[8px] text-emerald-400">↑ 8.3% vs last week</span>
                  </CardContent>
                </Card>

                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Cameras</p>
                    <h3 className="text-xl font-extrabold text-purple-400 mt-1">156</h3>
                    <span className="text-[8px] text-emerald-400">↑ 5.4% vs last week</span>
                  </CardContent>
                </Card>

                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cameras Online</p>
                    <h3 className="text-xl font-extrabold text-amber-400 mt-1">138</h3>
                    <span className="text-[8px] text-slate-400">88.45% of total</span>
                  </CardContent>
                </Card>

                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">System Uptime</p>
                    <h3 className="text-xl font-extrabold text-pink-400 mt-1">99.85%</h3>
                    <span className="text-[8px] text-emerald-400">↑ 0.32% vs last week</span>
                  </CardContent>
                </Card>

                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Alerts</p>
                    <h3 className="text-xl font-extrabold text-red-400 mt-1">12</h3>
                    <span className="text-[8px] text-red-400">↓ 14.2% vs last week</span>
                  </CardContent>
                </Card>
              </div>

              {/* Hardware Performance Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* System Hardware Load */}
                <Card className="lg:col-span-2 bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="border-b border-slate-850">
                    <CardTitle className="text-xs font-bold uppercase">System Performance (Last 7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-300">
                        <span>CPU Usage</span>
                        <span>{cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all" style={{ width: `${cpuUsage}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-300">
                        <span>RAM Memory</span>
                        <span>{memoryUsage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${memoryUsage}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-300">
                        <span>GPU Processing</span>
                        <span>{gpuUsage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full transition-all" style={{ width: `${gpuUsage}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-300">
                        <span>Database Server IO</span>
                        <span>{dbLoad}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all" style={{ width: `${dbLoad}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-300">
                        <span>Network Bandwidth</span>
                        <span>{netTraffic}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-pink-500 h-full transition-all" style={{ width: `${netTraffic}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Camera Status overview */}
                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="border-b border-slate-850">
                    <CardTitle className="text-xs font-bold uppercase">Camera Status Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 flex flex-col justify-center items-center h-[230px]">
                    <div className="relative w-32 h-32 flex justify-center items-center">
                      <div className="w-24 h-24 rounded-full border-8 border-emerald-500/80 border-t-red-500/80 animate-spin" />
                      <div className="absolute font-bold text-center">
                        <p className="text-lg">156</p>
                        <p className="text-[8px] text-slate-400">Total Cameras</p>
                      </div>
                    </div>
                    <div className="w-full mt-4 flex justify-around text-[9px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 138 Online</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> 12 Offline</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 6 Maint</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom rows: alerts and database overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Alerts summary logs */}
                <Card className="lg:col-span-1 bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Alerts Summary</CardTitle></CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {[
                      { icon: AlertTriangle, color: "text-red-500 bg-red-950/40 border-red-900/50", msg: "Camera 12 in Store 04 went offline", time: "10:24 AM" },
                      { icon: Cpu, color: "text-amber-500 bg-amber-950/40 border-amber-900/50", msg: "High CPU usage above 80%", time: "09:58 AM" },
                      { icon: AlertTriangle, color: "text-red-500 bg-red-950/40 border-red-900/50", msg: "Disk space low on DB Cluster", time: "09:12 AM" }
                    ].map((al, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border flex gap-3 items-center bg-[#070e17] border-slate-850 text-[10px]">
                        <al.icon className={`w-4 h-4 p-0.5 rounded border shrink-0 ${al.color.split(" ")[0]} ${al.color.split(" ")[1]} ${al.color.split(" ")[2]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-200 truncate">{al.msg}</p>
                          <span className="text-[8px] text-slate-500">{al.time}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Database overview */}
                <Card className="lg:col-span-2 bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Database Overview</CardTitle></CardHeader>
                  <CardContent className="pt-4">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="bg-[#070e17] text-slate-550 border-b border-slate-850 font-bold">
                          <th className="p-2 pl-4">Database</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Size</th>
                          <th className="p-2">Connections</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {[
                          { name: "cams_main_db", status: "Healthy", size: "890 GB", conn: "84" },
                          { name: "analytics_db", status: "Healthy", size: "750 GB", conn: "62" },
                          { name: "logs_db", status: "Healthy", size: "520 GB", conn: "28" }
                        ].map((db, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/10">
                            <td className="p-2 pl-4 font-bold text-slate-200">{db.name}</td>
                            <td className="p-2"><span className="text-emerald-400 font-bold">● {db.status}</span></td>
                            <td className="p-2 text-slate-400">{db.size}</td>
                            <td className="p-2 text-slate-400 font-semibold">{db.conn} / 250</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

              </div>

            </div>
          )}

          {/* Tab 2: Users List Directory */}
          {activeTab === "users" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850 flex justify-between items-center flex-row">
                <CardTitle className="text-xs font-bold uppercase">Registered System Users</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">Username</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500 font-semibold">No registered users found.</td>
                      </tr>
                    ) : (
                      usersList.map((usr) => (
                        <tr key={usr.id} className="hover:bg-slate-800/10">
                          <td className="p-4 pl-6 font-bold text-slate-200">{usr.username}</td>
                          <td className="p-4 text-slate-400">{usr.email}</td>
                          <td className="p-4">
                            <span className="text-[10px] font-bold bg-blue-950/60 border border-blue-900/50 text-blue-400 px-2 py-0.5 rounded">
                              {usr.role?.name || "User"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${usr.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                              ● {usr.is_active ? "Active" : "Suspended"}
                            </span>
                          </td>
                          <td className="p-4 text-right pr-6">
                            <div className="inline-flex gap-2">
                              <button className="p-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300"><Edit2 className="w-3 h-3" /></button>
                              <button className="p-1 bg-red-950/40 hover:bg-red-900/50 rounded border border-red-900/50 text-red-400"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Tab 3: Stores & Devices */}
          {activeTab === "stores" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Managed Stores</CardTitle></CardHeader>
                <CardContent className="pt-4 divide-y divide-slate-850">
                  {stores.map((st) => (
                    <div key={st.id} className="py-2.5 flex justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{st.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{st.location || "Default Location"}</p>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-900/40 rounded font-bold self-center">Active</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab 4: Settings */}
          {activeTab === "settings" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">System Settings & Toggles</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Core API Gateway Timeout (ms)</label>
                    <input type="number" defaultValue={5000} className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Batch Aggregation Flush (secs)</label>
                    <input type="number" defaultValue={10} className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">JWT Token Session Expiry (mins)</label>
                    <input type="number" defaultValue={60} className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Max Cache Size Threshold (MB)</label>
                    <input type="number" defaultValue={2048} className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-slate-200" />
                  </div>
                </div>
                <div className="pt-2">
                  <button onClick={() => toast.success("System configurations saved successfully!")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-md shadow-blue-500/10">Save Configurations</button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab: Roles */}
          {activeTab === "roles" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Role-based Access Directory</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">Role Name</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Users Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { name: "Administrator", desc: "Superuser access to all stores, systems, configurations, logs, and user policies.", count: 12 },
                      { name: "Store Manager", desc: "Local operational metrics, shelves tracking, layout heatmaps, camera network adjustments.", count: 56 },
                      { name: "Retail Analyst", desc: "Dwell time scatter plots, Sankey shopper flows, demographic intent statistics.", count: 32 },
                      { name: "Marketing Manager", desc: "Evaluate advertising lift, campaign effectiveness, endcap displays visibility.", count: 22 }
                    ].map((role, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="p-4 pl-6 font-bold text-slate-200">{role.name}</td>
                        <td className="p-4 text-slate-400">{role.desc}</td>
                        <td className="p-4 text-blue-400 font-bold">{role.count} Users</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Tab: Permissions */}
          {activeTab === "permissions" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Access Control Matrix</CardTitle></CardHeader>
              <CardContent className="p-4 text-xs space-y-4">
                <p className="text-slate-400">Matrix mapping administrative permissions to system functional modules:</p>
                <div className="border border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                        <th className="p-3 pl-4">Module Permission</th>
                        <th className="p-3 text-center">Admin</th>
                        <th className="p-3 text-center">Store Manager</th>
                        <th className="p-3 text-center">Analyst</th>
                        <th className="p-3 text-center">Marketing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-350">
                      {[
                        { perm: "Manage Users & System Roles", values: ["✓", "—", "—", "—"] },
                        { perm: "Ingest Cameras Streams & Settings", values: ["✓", "✓", "—", "—"] },
                        { perm: "Configure Shelves & Heatmaps", values: ["✓", "✓", "—", "—"] },
                        { perm: "Access Behavioral Shopper Flows", values: ["✓", "✓", "✓", "—"] },
                        { perm: "Analyze Campaign Effectiveness", values: ["✓", "—", "—", "✓"] }
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/10">
                          <td className="p-3 pl-4 font-semibold text-slate-200">{item.perm}</td>
                          {item.values.map((v, i) => (
                            <td key={i} className={`p-3 text-center font-bold ${v === "✓" ? "text-emerald-400" : "text-slate-600"}`}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab: Active Sessions */}
          {activeTab === "sessions" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Active System Session Logs</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">User Session</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Dwell Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { user: "john_manager@store.com", ip: "192.168.1.45", status: "Active", age: "42 mins" },
                      { user: "riya_analyst@insights.com", ip: "192.168.1.112", status: "Active", age: "18 mins" },
                      { user: "ananya_marketing@promo.com", ip: "192.168.1.84", status: "Active", age: "5 mins" }
                    ].map((sess, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="p-4 pl-6 font-bold text-slate-200">{sess.user}</td>
                        <td className="p-4 font-mono text-slate-400">{sess.ip}</td>
                        <td className="p-4"><span className="text-emerald-400 font-bold">● {sess.status}</span></td>
                        <td className="p-4 text-slate-450">{sess.age}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Tab: Cameras */}
          {activeTab === "cameras" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Camera Ingestion Status Registers</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">Camera Stream Name</th>
                      <th className="p-4">Resolution</th>
                      <th className="p-4">Framerate</th>
                      <th className="p-4">Ingestion Codec</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { name: "Camera 1 (Entrance)", res: "1920x1080 (1080p)", fps: "30 FPS", codec: "H.264 RTSP", status: "Online" },
                      { name: "Camera 2 (Aisle A)", res: "1920x1080 (1080p)", fps: "30 FPS", codec: "H.264 RTSP", status: "Online" },
                      { name: "Camera 3 (Aisle B)", res: "1920x1080 (1080p)", fps: "30 FPS", codec: "H.264 RTSP", status: "Online" },
                      { name: "Camera 4 (Checkout)", res: "1920x1080 (1080p)", fps: "30 FPS", codec: "H.264 RTSP", status: "Online" }
                    ].map((cam, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="p-4 pl-6 font-bold text-slate-200">{cam.name}</td>
                        <td className="p-4 text-slate-400">{cam.res}</td>
                        <td className="p-4 text-slate-400">{cam.fps}</td>
                        <td className="p-4 font-mono text-slate-450">{cam.codec}</td>
                        <td className="p-4"><span className="text-emerald-400 font-bold">● {cam.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Tab: Edge Devices */}
          {activeTab === "devices" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">AI Processing Edge Servers</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">Server Node</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">GPU Model</th>
                      <th className="p-4">Active Processes</th>
                      <th className="p-4">Load Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { node: "Edge Node 01 (Flagship)", ip: "192.168.1.200", gpu: "NVIDIA RTX 4090", count: "3 Streams", load: "24%" },
                      { node: "Edge Node 02 (NY Outlet)", ip: "192.168.1.201", gpu: "NVIDIA Jetson AGX", count: "2 Streams", load: "45%" }
                    ].map((dev, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="p-4 pl-6 font-bold text-slate-200">{dev.node}</td>
                        <td className="p-4 font-mono text-slate-450">{dev.ip}</td>
                        <td className="p-4 text-slate-400">{dev.gpu}</td>
                        <td className="p-4 text-slate-400">{dev.count}</td>
                        <td className="p-4 text-blue-400 font-bold">{dev.load} Load</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Device Health */}
          {activeTab === "health" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Ingestion Cameras & Hardware Health</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">Camera Node</th>
                      <th className="p-4">Temperature</th>
                      <th className="p-4">Packet Loss</th>
                      <th className="p-4">Frame Drop</th>
                      <th className="p-4">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { name: "Camera 1 (Entrance)", temp: "42°C", loss: "0.01%", drop: "0 frames", status: "Nominal" },
                      { name: "Camera 2 (Aisle A)", temp: "38°C", loss: "0.00%", drop: "2 frames", status: "Nominal" },
                      { name: "Camera 3 (Aisle B)", temp: "45°C", loss: "0.12%", drop: "14 frames", status: "Warning" },
                      { name: "Camera 4 (Checkout)", temp: "41°C", loss: "0.00%", drop: "0 frames", status: "Nominal" }
                    ].map((cam, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="p-4 pl-6 font-bold text-slate-200">{cam.name}</td>
                        <td className="p-4 text-slate-400">{cam.temp}</td>
                        <td className="p-4 text-slate-400 font-mono">{cam.loss}</td>
                        <td className="p-4 text-slate-400">{cam.drop}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cam.status === "Nominal" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" : "bg-amber-950/40 text-amber-400 border border-amber-900/40"
                          }`}>{cam.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Infrastructure Monitor */}
          {activeTab === "infrastructure" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">CAMS Microservices Directory</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">Service Name</th>
                      <th className="p-4">Host Node</th>
                      <th className="p-4">Latency</th>
                      <th className="p-4">Memory Load</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { name: "Auth Ingestion API Gateway", host: "K8s-Node-01", latency: "14ms", mem: "140 MB", status: "Healthy" },
                      { name: "Real-Time Tracking Stream Engine", host: "K8s-Node-02", latency: "8ms", mem: "840 MB", status: "Healthy" },
                      { name: "Redis Coordinate Buffer Store", host: "Redis-Cluster-01", latency: "2ms", mem: "1.2 GB", status: "Healthy" },
                      { name: "PostgreSQL Database Writer", host: "Postgres-Main", latency: "24ms", mem: "2.4 GB", status: "Healthy" }
                    ].map((svc, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="p-4 pl-6 font-bold text-slate-200">{svc.name}</td>
                        <td className="p-4 text-slate-400 font-mono">{svc.host}</td>
                        <td className="p-4 text-slate-400 font-semibold">{svc.latency}</td>
                        <td className="p-4 text-slate-400">{svc.mem}</td>
                        <td className="p-4"><span className="text-emerald-400 font-bold">● {svc.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* API Performance */}
          {activeTab === "api" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Endpoint Latency Performance</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">API Route</th>
                      <th className="p-4">HTTP Method</th>
                      <th className="p-4">Avg. Latency</th>
                      <th className="p-4">Request Rate / min</th>
                      <th className="p-4">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { route: "/api/v1/auth/login", method: "POST", latency: "145ms", rate: "12 req", err: "0.0%" },
                      { route: "/api/v1/stores/{store_id}/shelves", method: "GET", latency: "38ms", rate: "120 req", err: "0.0%" },
                      { route: "/api/v1/video/ws/{store_id}", method: "WS", latency: "5ms", rate: "8 active", err: "0.1%" },
                      { route: "/api/v1/users", method: "GET", latency: "42ms", rate: "15 req", err: "0.0%" }
                    ].map((api, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="p-4 pl-6 font-bold text-slate-200 font-mono">{api.route}</td>
                        <td className="p-4 text-slate-400">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            api.method === "POST" ? "bg-blue-950/60 text-blue-400" : api.method === "WS" ? "bg-purple-950/60 text-purple-400" : "bg-emerald-950/60 text-emerald-400"
                          }`}>{api.method}</span>
                        </td>
                        <td className="p-4 text-slate-450 font-semibold">{api.latency}</td>
                        <td className="p-4 text-slate-450">{api.rate}</td>
                        <td className="p-4 text-emerald-400 font-bold">{api.err}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Security Monitoring */}
          {activeTab === "security" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">System Security Indicators</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-[#070e17] border border-slate-850">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Firewall status</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">✓ Active (Cisco ESA)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#070e17] border border-slate-850">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">CORS Policy</p>
                    <p className="text-sm font-bold text-slate-200 mt-1">Strict Domain Match</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#070e17] border border-slate-850">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">SSL Certificate</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">Expires in 280 days</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#070e17] border border-slate-850">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Brute-Force Shield</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">✓ Locked IPs: 0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Logs */}
          {activeTab === "audit" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Administrative Changes Audit Trail</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">Action Event</th>
                      <th className="p-4">User</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { event: "Updated Camera 3 (Aisle B) stream URL", user: "john_manager@store.com", ip: "192.168.1.45", time: "Today, 10:24 AM" },
                      { event: "Created new Shelf E (Pharmacy)", user: "john_manager@store.com", ip: "192.168.1.45", time: "Today, 10:10 AM" },
                      { event: "Registered new user: Jane Analyst", user: "admin@system.com", ip: "192.168.1.2", time: "Yesterday, 04:55 PM" }
                    ].map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="p-4 pl-6 font-bold text-slate-200">{item.event}</td>
                        <td className="p-4 text-slate-400">{item.user}</td>
                        <td className="p-4 font-mono text-slate-450">{item.ip}</td>
                        <td className="p-4 text-slate-400">{item.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Alert Configs */}
          {activeTab === "alert_config" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Congestion Threshold Trigger Options</CardTitle></CardHeader>
              <CardContent className="p-6 text-xs text-slate-400 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">Foyer Congestion Alert limit</span>
                  <select className="bg-[#070e17] border border-slate-800 rounded p-1">
                    <option>5 Customers</option>
                    <option>8 Customers</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">Checkout bottleneck Alert limit</span>
                  <select className="bg-[#070e17] border border-slate-800 rounded p-1">
                    <option>3 Customers</option>
                    <option>5 Customers</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Backup & Restore */}
          {activeTab === "backup" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Database Backups Dump Console</CardTitle></CardHeader>
              <CardContent className="p-6 text-xs space-y-4">
                <p className="text-slate-400">Manage daily database backups and recovery snapshot processes:</p>
                <div className="flex gap-3">
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">Trigger Backup dump</button>
                  <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded font-bold">Restore Snapshot</button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Overview */}
          {activeTab === "system" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">System Components Core Overview</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-lg bg-[#070e17] border border-slate-850">
                    <p className="font-bold text-slate-200">Core FastAPI Gateway</p>
                    <p className="text-[10px] text-slate-500 mt-1">Uptime: 14 days, 5 hours. Active HTTP connection worker threads: 4.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#070e17] border border-slate-850">
                    <p className="font-bold text-slate-200">OpenCV Stream Workers</p>
                    <p className="text-[10px] text-slate-500 mt-1">8 active camera streams currently bound and monitored in local database.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#070e17] border border-slate-850">
                    <p className="font-bold text-slate-200">Batch Saver aggregations</p>
                    <p className="text-[10px] text-slate-500 mt-1">Status: Running daemon. Aggregates coordinate saves every 10 seconds.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#070e17] border border-slate-850">
                    <p className="font-bold text-slate-200">Redis cache channel</p>
                    <p className="text-[10px] text-slate-500 mt-1">Memory allocation: 1.2 GB / 4.0 GB. Connection: nominal.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Logs */}
          {activeTab === "activity_logs" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Administrative Operations Activity Logs</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">Operations Log Description</th>
                      <th className="p-4">Agent Role</th>
                      <th className="p-4">Origin IP</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { desc: "Registered new analyst user: riya_analyst", role: "Super Administrator", ip: "192.168.1.2", time: "2026-07-25 15:42:04" },
                      { desc: "Ingested new Camera 5 stream URL details", role: "Store Operations Manager", ip: "192.168.1.45", time: "2026-07-25 12:18:31" },
                      { desc: "Flushed Redis aggregation memory buffers", role: "System Cron Service", ip: "127.0.0.1", time: "2026-07-25 12:00:00" },
                      { desc: "Updated system settings CORS policies", role: "Super Administrator", ip: "192.168.1.2", time: "2026-07-25 10:14:02" }
                    ].map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="p-4 pl-6 font-bold text-slate-200">{item.desc}</td>
                        <td className="p-4 text-slate-400">{item.role}</td>
                        <td className="p-4 font-mono text-slate-450">{item.ip}</td>
                        <td className="p-4 text-slate-400">{item.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">System Notifications Integration Toggles</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-200">Email Congestion Alerts</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Send alerts to Store Manager when queues build up.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-850">
                    <div>
                      <p className="font-bold text-slate-200">Slack Webhook Alerts</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Push store overcrowding warnings directly to Slack channels.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-850">
                    <div>
                      <p className="font-bold text-slate-200">SMS Out-of-Stock warnings</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Send mobile warnings when high attention items are out of stock.</p>
                    </div>
                    <input type="checkbox" className="w-4 h-4" />
                  </div>
                </div>
                <div className="pt-2">
                  <button onClick={() => toast.success("Notification integrations settings updated!")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs">Save Integrations</button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fallback panel for remaining sub-tabs */}
          {!["overview", "users", "stores", "settings", "roles", "permissions", "sessions", "cameras", "devices", "health", "infrastructure", "api", "security", "audit", "alert_config", "backup", "system", "activity_logs", "notifications"].includes(activeTab) && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850">
                <CardTitle className="text-xs font-bold uppercase">{activeTab.replace("_", " ")} Portal</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs text-blue-300">
                  <p className="font-bold uppercase tracking-wider mb-2">Simulated Live Log Stream:</p>
                  <pre className="font-mono text-[10px] text-slate-400 space-y-1">
                    {`[INFO] ${new Date().toISOString()} - Initializing connection worker for ${activeTab}...
[SUCCESS] Verified SSL connection parameters.
[INFO] Ready to fetch active datasets. Listening to events...`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
