import React from 'react';

interface ReportPDFTemplateProps {
    report: {
        id: string;
        image_data: string;
        diagnosis: string | null;
        treatment?: string | null;
        follow_up?: string | null;
        status: string;
        created_at: string;
        ai_condition?: string;
        ai_confidence?: number;
        ai_result?: string;
    };
    patientName: string;
}

const ReportPDFTemplate = React.forwardRef<HTMLDivElement, ReportPDFTemplateProps>(
    ({ report, patientName }, ref) => {
        const date = new Date(report.created_at);
        const formattedDate = date.toLocaleDateString('en-US', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        const reportId = `RPT-${report.id.substring(0, 8).toUpperCase()}`;
        const confidence = report.ai_confidence ?? 0;
        const aiResult = report.ai_result ?? 'unknown';
        const riskColor = aiResult === 'malignant' ? '#ef4444' : '#10B981';
        const riskLabel = aiResult === 'malignant' ? 'HIGH RISK' : aiResult === 'benign' ? 'LOW RISK' : 'PENDING';

        return (
            <div
                ref={ref}
                style={{
                    width: '794px',          // A4 at 96dpi
                    minHeight: '1123px',
                    backgroundColor: '#ffffff',
                    fontFamily: "'Segoe UI', Arial, sans-serif",
                    color: '#1e293b',
                    position: 'absolute',
                    left: '-9999px',
                    top: '0',
                    padding: '0',
                    boxSizing: 'border-box',
                }}
            >
                {/* ═══════════════ HEADER BAND ═══════════════ */}
                <div style={{
                    background: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 50%, #0284c7 100%)',
                    padding: '32px 40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    {/* Logo + Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.4)',
                        }}>
                            {/* Simple SVG shield icon */}
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <polyline points="9 12 11 14 15 10" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
                                DermaScan <span style={{ color: '#bae6fd' }}>AI</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: '500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                Medical Dermatology Report
                            </div>
                        </div>
                    </div>

                    {/* Report meta */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px' }}>Report ID</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}>{reportId}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '6px' }}>{formattedDate}</div>
                    </div>
                </div>

                {/* ═══════════════ PATIENT INFO STRIP ═══════════════ */}
                <div style={{
                    backgroundColor: '#f0f9ff',
                    borderBottom: '1px solid #bae6fd',
                    padding: '16px 40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', gap: '40px' }}>
                        <div>
                            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '3px' }}>Patient Name</div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{patientName || 'Patient'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '3px' }}>Date of Report</div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{formattedDate}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '3px' }}>Status</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#10B981', backgroundColor: '#d1fae5', borderRadius: '20px', padding: '2px 12px', display: 'inline-block', border: '1px solid #6ee7b7' }}>
                                ✓ REVIEWED
                            </div>
                        </div>
                    </div>
                    <div style={{
                        backgroundColor: riskColor,
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '800',
                        letterSpacing: '2px',
                        borderRadius: '20px',
                        padding: '6px 16px',
                        textTransform: 'uppercase',
                    }}>
                        {riskLabel}
                    </div>
                </div>

                {/* ═══════════════ MAIN BODY ═══════════════ */}
                <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

                    {/* SCAN IMAGE + AI RESULTS ROW */}
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

                        {/* Scan Image */}
                        <div style={{ flexShrink: 0 }}>
                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '10px' }}>
                                📷 Scan Image
                            </div>
                            <div style={{
                                width: '200px', height: '200px', borderRadius: '12px',
                                overflow: 'hidden', border: '2px solid #e2e8f0',
                                backgroundColor: '#f8fafc',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}>
                                {report.image_data ? (
                                    <img
                                        src={report.image_data}
                                        alt="Skin Scan"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                                        No image
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Analysis Panel */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '10px' }}>
                                🤖 AI Analysis Results
                            </div>
                            <div style={{
                                backgroundColor: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden',
                            }}>
                                {/* AI Condition */}
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Detected Condition</div>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                        {report.ai_condition || 'Unknown'}
                                    </div>
                                </div>

                                {/* Confidence Bar */}
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>AI Confidence Score</div>
                                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#06b6d4' }}>{confidence}%</div>
                                    </div>
                                    <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${confidence}%`,
                                            background: confidence >= 80 ? 'linear-gradient(90deg, #06b6d4, #0284c7)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                                            borderRadius: '99px',
                                            transition: 'width 0.3s',
                                        }} />
                                    </div>
                                </div>

                                {/* Risk Classification */}
                                <div style={{ padding: '16px 20px' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>Risk Classification</div>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        backgroundColor: aiResult === 'malignant' ? '#fef2f2' : '#f0fdf4',
                                        color: aiResult === 'malignant' ? '#ef4444' : '#10B981',
                                        border: `1px solid ${aiResult === 'malignant' ? '#fecaca' : '#bbf7d0'}`,
                                        borderRadius: '8px', padding: '6px 14px',
                                        fontSize: '13px', fontWeight: '700',
                                    }}>
                                        <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            backgroundColor: 'currentColor',
                                            display: 'inline-block',
                                        }} />
                                        {aiResult === 'malignant' ? 'Potentially Malignant — Urgent Review Advised'
                                            : aiResult === 'benign' ? 'Benign — Low Risk'
                                                : 'Pending Classification'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DIVIDER */}
                    <div style={{ borderTop: '2px solid #f1f5f9', position: 'relative' }}>
                        <div style={{
                            position: 'absolute', top: '-11px', left: '40px',
                            backgroundColor: '#fff', padding: '0 12px',
                            fontSize: '12px', fontWeight: '700', color: '#06b6d4',
                            textTransform: 'uppercase', letterSpacing: '1.5px',
                        }}>
                            Doctor's Medical Report
                        </div>
                    </div>

                    {/* DOCTOR DIAGNOSIS SECTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>

                        {/* Final Diagnosis */}
                        <div>
                            <div style={{
                                fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                                letterSpacing: '1.5px', color: '#0284c7', marginBottom: '8px',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                <span style={{ display: 'inline-block', width: '3px', height: '14px', backgroundColor: '#06b6d4', borderRadius: '2px' }} />
                                Final Diagnosis
                            </div>
                            <div style={{
                                backgroundColor: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: '10px',
                                padding: '14px 18px',
                                fontSize: '14px',
                                color: '#0f172a',
                                lineHeight: '1.7',
                                fontWeight: '500',
                            }}>
                                {report.diagnosis || 'No diagnosis provided.'}
                            </div>
                        </div>

                        {/* Treatment */}
                        {report.treatment && (
                            <div>
                                <div style={{
                                    fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                                    letterSpacing: '1.5px', color: '#059669', marginBottom: '8px',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                    <span style={{ display: 'inline-block', width: '3px', height: '14px', backgroundColor: '#10B981', borderRadius: '2px' }} />
                                    Treatment Recommendation
                                </div>
                                <div style={{
                                    backgroundColor: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '10px',
                                    padding: '14px 18px',
                                    fontSize: '14px',
                                    color: '#0f172a',
                                    lineHeight: '1.7',
                                    fontWeight: '500',
                                }}>
                                    {report.treatment}
                                </div>
                            </div>
                        )}

                        {/* Follow-up */}
                        {report.follow_up && (
                            <div>
                                <div style={{
                                    fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                                    letterSpacing: '1.5px', color: '#7c3aed', marginBottom: '8px',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                    <span style={{ display: 'inline-block', width: '3px', height: '14px', backgroundColor: '#7c3aed', borderRadius: '2px' }} />
                                    Follow-up Schedule
                                </div>
                                <div style={{
                                    backgroundColor: '#faf5ff',
                                    border: '1px solid #ddd6fe',
                                    borderRadius: '10px',
                                    padding: '14px 18px',
                                    fontSize: '14px',
                                    color: '#0f172a',
                                    lineHeight: '1.7',
                                    fontWeight: '600',
                                }}>
                                    📅 {report.follow_up}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════ FOOTER ═══════════════ */}
                <div style={{
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    padding: '20px 40px',
                    marginTop: 'auto',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: '8px',
                                backgroundColor: '#fff7ed',
                                border: '1px solid #fed7aa',
                                borderRadius: '8px',
                                padding: '10px 14px',
                            }}>
                                <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                                <p style={{ fontSize: '11px', color: '#92400e', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                                    <strong>Medical Disclaimer:</strong> This report is AI-assisted and intended for informational purposes only. It should not replace professional medical advice. Please consult a licensed dermatologist for diagnosis and treatment decisions.
                                </p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7' }}>DermaScan AI</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>dermascan.ai</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Generated: {formattedDate}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

ReportPDFTemplate.displayName = 'ReportPDFTemplate';
export default ReportPDFTemplate;
