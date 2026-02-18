import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import api from '../../services/api';
import HeatmapChart from '../common/HeatmapChart';

const Reports = () => {
    const [data, setData] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('year'); // 'month', 'year'

    useEffect(() => {
        fetchReports();
        fetchHeatmap();
    }, [range]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/reports/revenue?range=${range}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHeatmap = async () => {
        try {
            const response = await api.get('/reports/heatmap?months=3');
            setHeatmapData(response.data);
        } catch (error) {
            console.error('Error fetching heatmap:', error);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) return <div className="p-8 text-center text-xl">טוען דוחות...</div>;
    if (!data) return <div className="p-8 text-center text-xl">אין נתונים להצגה</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">דוחות הכנסות ופעילות</h1>
                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="p-2 border rounded-lg bg-white shadow-sm"
                >
                    <option value="year">שנה אחרונה</option>
                    <option value="month">חודש אחרון</option>
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                    <div className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-2">סה״כ הכנסות</div>
                    <div className="text-3xl font-bold text-blue-900">₪{(data.totalRevenue || 0).toLocaleString('he-IL')}</div>
                    <p className="text-xs text-blue-700 mt-2">בתקופה שנבחרה</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                    <div className="text-green-600 text-sm font-semibold uppercase tracking-wide mb-2">סה״כ תורים</div>
                    <div className="text-3xl font-bold text-green-900">{data.totalAppointments || 0}</div>
                    <p className="text-xs text-green-700 mt-2">שולמו וביטלו</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                    <div className="text-purple-600 text-sm font-semibold uppercase tracking-wide mb-2">ממוצע תור</div>
                    <div className="text-3xl font-bold text-purple-900">₪{Math.round((data.totalRevenue || 0) / Math.max(data.totalAppointments || 1, 1))}</div>
                    <p className="text-xs text-purple-700 mt-2">מחיר ממוצע</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                    <div className="text-orange-600 text-sm font-semibold uppercase tracking-wide mb-2">שיעור הצלחה</div>
                    <div className="text-3xl font-bold text-orange-900">{Math.round(((data.totalAppointments - (data.cancelledAppointments || 0)) / Math.max(data.totalAppointments || 1, 1)) * 100)}%</div>
                    <p className="text-xs text-orange-700 mt-2">תורים שהתקיימו</p>
                </div>
            </div>

            {/* Revenue Bar Chart */}
            <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-700 mb-6">
                    {range === 'month' ? 'הכנסות יומיות' : 'הכנסות לפי חודש'} (₪)
                </h2>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.revenueByMonth || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                formatter={(value) => `₪${value}`}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="revenue" name="הכנסות" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Appointment Types Pie Chart */}
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">התפלגות סוגי תורים</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.appointmentsByType || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    label
                                >
                                    {(data.appointmentsByType || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Daily Activity Line Chart */}
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">פעילות יומית (30 ימים אחרונים)</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.dailyAppointments || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickFormatter={(str) => str ? str.split('-').slice(1).join('/') : ''} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" name="מספר תורים" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Heatmap */}
                <section className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">שעות חמות</h2>
                    <p className="text-slate-500 text-sm mb-4">התפלגות תורים לפי יום ושעה (3 חודשים אחרונים)</p>
                    {heatmapData.length > 0 ? (
                        <HeatmapChart data={heatmapData} />
                    ) : (
                        <p className="text-slate-400 text-center py-8">אין מספיק נתונים להצגת מפת חום</p>
                    )}
                </section>

                {/* Cancellation Rate */}
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">שיעור ביטולים וחוסרות</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <span className="text-gray-600">תורים שביטלו</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-red-600">{data.cancelledAppointments || 0}</span>
                                <span className="text-sm text-gray-500">({Math.round(((data.cancelledAppointments || 0) / Math.max(data.totalAppointments || 1, 1)) * 100)}%)</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <span className="text-gray-600">לקוחות שלא הגיעו</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-orange-600">{data.noShowAppointments || 0}</span>
                                <span className="text-sm text-gray-500">({Math.round(((data.noShowAppointments || 0) / Math.max(data.totalAppointments || 1, 1)) * 100)}%)</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">תורים שהתקיימו</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-green-600">{(data.totalAppointments || 0) - (data.cancelledAppointments || 0) - (data.noShowAppointments || 0)}</span>
                                <span className="text-sm text-gray-500">({Math.round((((data.totalAppointments || 0) - (data.cancelledAppointments || 0) - (data.noShowAppointments || 0)) / Math.max(data.totalAppointments || 1, 1)) * 100)}%)</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Services Performance */}
            {data.appointmentsByStaff && data.appointmentsByStaff.length > 0 && (
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">ביצועים לפי שירות/עובד</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="px-4 py-3 text-gray-600 font-semibold">שם</th>
                                    <th className="px-4 py-3 text-gray-600 font-semibold">מספר תורים</th>
                                    <th className="px-4 py-3 text-gray-600 font-semibold">הכנסות</th>
                                    <th className="px-4 py-3 text-gray-600 font-semibold">ממוצע תור</th>
                                    <th className="px-4 py-3 text-gray-600 font-semibold">שיעור הצלחה</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.appointmentsByStaff.map((staff, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">{staff.name || staff._id}</td>
                                        <td className="px-4 py-3 text-gray-700">{staff.appointmentCount || 0}</td>
                                        <td className="px-4 py-3 text-green-600 font-semibold">₪{(staff.revenue || 0).toLocaleString('he-IL')}</td>
                                        <td className="px-4 py-3 text-gray-700">₪{Math.round((staff.revenue || 0) / Math.max(staff.appointmentCount || 1, 1))}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                                                {Math.round(((staff.appointmentCount - (staff.cancelledCount || 0)) / Math.max(staff.appointmentCount || 1, 1)) * 100)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Revenue Trend */}
            {data.revenueByDay && data.revenueByDay.length > 0 && (
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">טרנד הכנסות</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.revenueByDay}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickFormatter={(str) => str ? str.split('-').slice(1).join('/') : ''} />
                                <YAxis />
                                <Tooltip formatter={(value) => `₪${value}`} />
                                <Line type="monotone" dataKey="revenue" name="הכנסות" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {/* Top Clients */}
            {data.topClients && data.topClients.length > 0 && (
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">לקוחות מובילים</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="px-4 py-3 text-gray-600 font-semibold">שם</th>
                                    <th className="px-4 py-3 text-gray-600 font-semibold">מספר תורים</th>
                                    <th className="px-4 py-3 text-gray-600 font-semibold">הכנסות</th>
                                    <th className="px-4 py-3 text-gray-600 font-semibold">תאריך ביקור אחרון</th>
                                    <th className="px-4 py-3 text-gray-600 font-semibold">טלפון</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topClients.map((client, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">{client.name}</td>
                                        <td className="px-4 py-3 text-gray-700">{client.appointmentCount || 0}</td>
                                        <td className="px-4 py-3 text-green-600 font-semibold">₪{(client.totalSpent || 0).toLocaleString('he-IL')}</td>
                                        <td className="px-4 py-3 text-gray-600 text-sm">{client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('he-IL') : '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 dir-ltr">{client.phone || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Time Analytics */}
            {data.timeAnalytics && (
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">ניתוח זמנים</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 rounded-xl p-4">
                            <div className="text-blue-600 text-sm font-semibold uppercase mb-2">ממוצע זמן ביקור</div>
                            <div className="text-3xl font-bold text-blue-900">{data.timeAnalytics.avgAppointmentDuration || 0} דק׳</div>
                            <p className="text-xs text-blue-700 mt-2">משך ממוצע לתור</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                            <div className="text-purple-600 text-sm font-semibold uppercase mb-2">ממוצע זמן הכנה</div>
                            <div className="text-3xl font-bold text-purple-900">{data.timeAnalytics.avgPreparationTime || 0} דק׳</div>
                            <p className="text-xs text-purple-700 mt-2">בין תורים</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                            <div className="text-green-600 text-sm font-semibold uppercase mb-2">זמן המתנה ממוצע</div>
                            <div className="text-3xl font-bold text-green-900">{data.timeAnalytics.avgWaitTime || 0} דק׳</div>
                            <p className="text-xs text-green-700 mt-2">ביקור לעומת ביקור</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Seasonality Analysis */}
            {data.monthlyComparison && data.monthlyComparison.length > 0 && (
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">ניתוח עונתיות וחודשים</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.monthlyComparison}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => `${value}`} />
                                <Legend />
                                <Bar dataKey="appointmentCount" name="מספר תורים" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="revenue" name="הכנסות (₪)" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {/* Busiest Times */}
            {data.busiestTimes && data.busiestTimes.length > 0 && (
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">שעות השיא</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.busiestTimes.slice(0, 6).map((time, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                <div>
                                    <div className="text-sm font-semibold text-blue-900">{time.timeSlot}</div>
                                    <p className="text-xs text-blue-700 mt-1">{time.dayName}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">{time.count}</div>
                                    <p className="text-[10px] text-blue-700">תורים</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Payment Methods */}
            {data.paymentMethods && data.paymentMethods.length > 0 && (
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">שיטות תשלום</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    label
                                >
                                    {data.paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `₪${value}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {/* Repeat Clients Rate */}
            {data.clientMetrics && (
                <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">מדדי לקוחות</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                            <div className="text-indigo-600 text-sm font-semibold uppercase mb-2">לקוחות חוזרים</div>
                            <div className="text-3xl font-bold text-indigo-900">{Math.round((data.clientMetrics.repeatClientRate || 0) * 100)}%</div>
                            <p className="text-xs text-indigo-700 mt-2">מלקוחות שחזרו</p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                            <div className="text-cyan-600 text-sm font-semibold uppercase mb-2">סה״כ לקוחות</div>
                            <div className="text-3xl font-bold text-cyan-900">{data.clientMetrics.totalUniqueClients || 0}</div>
                            <p className="text-xs text-cyan-700 mt-2">לקוחות ייחודיים</p>
                        </div>
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                            <div className="text-pink-600 text-sm font-semibold uppercase mb-2">ממוצע תורים לאדם</div>
                            <div className="text-3xl font-bold text-pink-900">{Math.round((data.clientMetrics.avgAppointmentsPerClient || 0) * 10) / 10}</div>
                            <p className="text-xs text-pink-700 mt-2">ביקורים ממוצעים</p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Reports;
