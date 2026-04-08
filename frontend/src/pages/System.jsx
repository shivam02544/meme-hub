import React, { useState, useEffect, useRef } from 'react';
import { Database, Server, Monitor, Activity, TerminalSquare } from 'lucide-react';

const formatSQL = (sql) => {
    if (!sql) return '';
    const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'DEFAULT', 'JOIN', 'ON', 'ORDER BY', 'AND', 'OR', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'AS', 'COUNT', 'DESC', 'ASC', 'FETCH', 'FIRST', 'ROWS', 'ONLY', 'ROWNUM'];
    let formatted = sql;
    keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        formatted = formatted.replace(regex, `<span style="color: #c678dd; font-weight: 600;">$&</span>`);
    });
    formatted = formatted.replace(/'[^']*'/g, `<span style="color: #98c379;">$&</span>`);
    formatted = formatted.replace(/:\w+/g, `<span style="color: #e5c07b;">$&</span>`);
    return formatted;
};

export default function System() {
    const [sqlLogs, setSqlLogs] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [hideSelects, setHideSelects] = useState(false);
    const logsEndRef = useRef(null);

    const fetchLogs = async () => {
        try {
            const [sqlRes, activityRes] = await Promise.all([
                fetch('http://localhost:5000/api/system-logs'),
                fetch('http://localhost:5000/api/activity-logs')
            ]);
            
            if (sqlRes.ok) {
                const sl = await sqlRes.json();
                setSqlLogs(sl);
            }
            if (activityRes.ok) {
                const al = await activityRes.json();
                setActivityLogs(al);
            }
        } catch (err) {
            console.error('Failed to fetch logs', err);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 2000); // refresh every 2 seconds
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll disabled per user request
    // useEffect(() => {
    //     if (logsEndRef.current) {
    //         logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    //     }
    // }, [sqlLogs]);

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <Monitor color="var(--primary-color)" size={40} />
                    DBMS System & Architecture
                </h1>
                <p>Live technical overlay of how the system operates under the hood.</p>
            </div>

            {/* Architecture Section */}
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Server size={24} /> Architecture Flow
            </h2>
            <div className="card-minimal" style={{ padding: '3rem 2rem', marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                
                <div style={{ flex: 1, textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ background: '#61dafb', color: '#000', padding: '1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                        React.js
                    </div>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Frontend UI</p>
                </div>

                <div style={{ flex: 1, borderTop: '2px dashed var(--primary-color)', position: 'relative', height: '0px', minWidth: '100px' }}>
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface-color)', padding: '0 0.5rem', fontSize: '0.75rem', color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>
                        HTTP REST
                    </div>
                </div>

                <div style={{ flex: 1, textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ background: '#8cc84b', color: '#000', padding: '1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                        Express.js
                    </div>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Backend + Auth</p>
                </div>

                <div style={{ flex: 1, borderTop: '2px dashed var(--danger-color)', position: 'relative', height: '0px', minWidth: '100px' }}>
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface-color)', padding: '0 0.5rem', fontSize: '0.75rem', color: 'var(--danger-color)', whiteSpace: 'nowrap' }}>
                        Oracle Driver
                    </div>
                </div>

                <div style={{ flex: 1, textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ background: '#f80000', color: '#fff', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Database size={18} /> Oracle DB 
                    </div>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Relational Data</p>
                </div>

            </div>

            {/* Split View for Logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                
                {/* Live SQL Terminal */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TerminalSquare size={24} /> Live SQL Terminal
                        </h2>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={hideSelects} onChange={e => setHideSelects(e.target.checked)} />
                                Hide SELECT queries
                            </label>
                            <button onClick={() => setSqlLogs([])} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'transparent', borderColor: '#ccc' }}>Clear</button>
                        </div>
                    </div>
                    <div className="card-minimal" style={{ background: '#1e1e1e', height: '600px', overflowY: 'auto', fontFamily: 'monospace', position: 'relative', border: '1px solid #333' }}>
                        {/* Fake Mac Window Header */}
                        <div style={{ position: 'sticky', top: 0, background: '#2d2d2d', padding: '0.5rem 1rem', borderBottom: '1px solid #111', display: 'flex', gap: '0.4rem', zIndex: 10 }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
                            <div style={{ marginLeft: '1rem', color: '#888', fontSize: '0.75rem' }}>oracle-xe-11g — bash</div>
                        </div>

                        <div style={{ padding: '1rem' }}>
                            <div style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '1rem' }}>
                                [System Connected] Intercepting DBMS execution stream...
                            </div>
                            {sqlLogs.length === 0 && <p style={{ color: '#888' }}>Waiting for database interactions...</p>}
                            
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {sqlLogs
                                    .filter(log => hideSelects ? !log.sql.toUpperCase().startsWith('SELECT') : true)
                                    .slice().reverse().map(log => (
                                    <div key={log.id} style={{ marginBottom: '1.5rem', color: '#d4d4d4' }}>
                                        <div style={{ color: '#569cd6', fontSize: '0.8rem', marginBottom: '0.2rem' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</div>
                                        <div style={{ color: '#abb2bf', paddingLeft: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.4' }} dangerouslySetInnerHTML={{ __html: formatSQL(log.sql) }}></div>
                                        {log.binds && log.binds !== '{}' && (
                                            <div style={{ color: '#5c6370', paddingLeft: '1rem', fontSize: '0.85rem', marginTop: '0.4rem', fontStyle: 'italic' }}>Binds: {log.binds}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Logs */}
                <div>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={24} /> Core Business Logic Logs
                    </h2>
                    <div className="card-minimal" style={{ height: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-color)', zIndex: 1 }}>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>User</th>
                                    <th style={{ padding: '1rem' }}>Action</th>
                                    <th style={{ padding: '1rem' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityLogs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{log.userName}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ background: 'var(--surface-lighter)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', marginRight: '0.5rem' }}>{log.action}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.details}</span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(log.createdAt).toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
