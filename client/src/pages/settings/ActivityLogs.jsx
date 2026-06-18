import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getActivityLogs } from '../../redux/activitySlice';
import { Clock, Filter, Activity, Users, FileText, Download, ShieldCheck } from 'lucide-react';
import { downloadCSV } from '../../utils/exportCsv';

const ActivityLogs = () => {
  const dispatch = useDispatch();
  const { logs = [], isLoading } = useSelector((state) => state.activity || {});

  const [filterModule, setFilterModule] = useState('All');
  const [filterUser, setFilterUser] = useState('All');

  useEffect(() => {
    dispatch(getActivityLogs());
  }, [dispatch]);

  // Extract unique users and modules for filters
  const uniqueModules = ['All', ...new Set(logs.map(log => log.module))];
  const uniqueUsers = ['All', ...new Set(logs.map(log => log.user?.name || 'Unknown'))];

  const filteredLogs = logs.filter(log => {
    const matchModule = filterModule === 'All' || log.module === filterModule;
    const matchUser = filterUser === 'All' || (log.user?.name === filterUser);
    return matchModule && matchUser;
  });

  const getModuleIcon = (module) => {
    switch (module) {
      case 'Billing': return <FileText size={16} className="text-blue-500" />;
      case 'Products':
      case 'Stock': return <ShieldCheck size={16} className="text-green-500" />;
      case 'Customers':
      case 'Suppliers': return <Users size={16} className="text-purple-500" />;
      default: return <Activity size={16} className="text-orange-500" />;
    }
  };

  const getModuleColor = (module) => {
    switch (module) {
      case 'Billing': return 'bg-blue-50 border-blue-100 text-blue-700';
      case 'Products':
      case 'Stock': return 'bg-green-50 border-green-100 text-green-700';
      case 'Customers':
      case 'Suppliers': return 'bg-purple-50 border-purple-100 text-purple-700';
      default: return 'bg-orange-50 border-orange-100 text-orange-700';
    }
  };

  const handleExport = () => {
    const data = filteredLogs.map(log => ({
      'Date & Time': new Date(log.createdAt).toLocaleString('en-IN'),
      'User': log.user?.name || 'System',
      'Role': log.user?.role || '-',
      'Module': log.module,
      'Action': log.action,
      'Details': log.details,
      'IP Address': log.ipAddress || 'Unknown'
    }));
    downloadCSV(data, 'activity_logs.csv');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity & Audit Logs</h2>
          <p className="text-sm text-gray-500 mt-1">Track actions performed by staff across the system for security and compliance.</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors bg-white shadow-sm w-fit">
          <Download size={16} /> Export Logs
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider pl-2">
          <Filter size={14} /> Filter By:
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select 
            value={filterModule} 
            onChange={(e) => setFilterModule(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:border-primary transition-colors cursor-pointer"
          >
            {uniqueModules.map(m => (
              <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>
            ))}
          </select>
          <select 
            value={filterUser} 
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:border-primary transition-colors cursor-pointer"
          >
            {uniqueUsers.map(u => (
              <option key={u} value={u}>{u === 'All' ? 'All Users' : u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Timeline Log Display ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-500 font-medium">Fetching activity logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
              <ShieldCheck size={24} />
            </div>
            <p className="font-bold text-gray-900">No activity found</p>
            <p className="text-sm text-gray-500 mt-1">No logs match your selected filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredLogs.map(log => (
              <div key={log._id} className="p-5 hover:bg-gray-50/50 transition-colors flex gap-5">
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-2 mt-1 shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${getModuleColor(log.module)}`}>
                    {getModuleIcon(log.module)}
                  </div>
                </div>
                
                {/* Content Column */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-snug">
                        {log.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                    </div>
                    
                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                        <Clock size={12} /> {new Date(log.createdAt).toLocaleString('en-IN', { hour12: true })}
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full w-fit">
                        <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-[8px] font-black text-gray-600">
                          {log.user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-[10px] font-bold text-gray-700">{log.user?.name || 'System'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ActivityLogs;
