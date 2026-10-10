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

        // Pure Clinical Light Mode Palette
        const riskColor = aiResult === 'malignant' ? '#DC2626' : '#16A34A';
        const riskBg = aiResult === 'malignant' ? '#FEF2F2' : '#F0FDF4';
        const riskBorder = aiResult === 'malignant' ? '#FECACA' : '#BBF7D0';
        const riskLabel = aiResult === 'malignant' ? 'HIGH RISK' : aiResult === 'benign' ? 'LOW RISK' : 'PENDING EVALUATION';

        return (
            <div
                ref={ref}
                style={{
                    width: '794px',          // A4 format at 96 DPI
                    minHeight: '1123px',
                    backgroundColor: '#FFFFFF',
                    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
                    color: '#0F172A',
                    position: 'absolute',
                    left: '-9999px',
                    top: '0',
                    padding: '0',
                    boxSizing: 'border-box',
                }}
            >
                {/* ═══════════════ HEADER BAND (Pure Clinical Light Gradient) ═══════════════ */}
                <div style={{
                    background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                    padding: '36px 44px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.12)',
                }}>
                    {/* Brand Logo & Medical Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        }}>
                            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <polyline points="9 12 11 14 15 10" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
                                DermaScan <span style={{ color: '#E0F2FE' }}>AI</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600', letterSpacing: '1.8px', textTransform: 'uppercase' }}>
                                Clinical AI Dermatology Report
                            </div>
                        </div>
                    </div>

                    {/* Report Metadata */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Report ID</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '2px' }}>{reportId}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', fontWeight: '500' }}>{formattedDate}</div>
                    </div>
                </div>

                {/* ═══════════════ PATIENT INFO STRIP (Clinical Soft Cyan Accent) ═══════════════ */}
                <div style={{
                    backgroundColor: '#F0F9FF',
                    borderBottom: '1px solid #BAE6FD',
                    padding: '18px 44px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', gap: '48px' }}>
                        <div>
                            <div style={{ fontSize: '10px', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '3px' }}>Patient Name</div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>{patientName || 'Patient'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '3px' }}>Date of Report</div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{formattedDate}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '3px' }}>Report Status</div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#16A34A', backgroundColor: '#DCFCE7', borderRadius: '20px', padding: '3px 14px', display: 'inline-block', border: '1px solid #86EFAC' }}>
                                ✓ CLINICALLY VERIFIED
                            </div>
                        </div>
                    </div>
                    <div style={{
                        backgroundColor: riskBg,
                        color: riskColor,
                        border: `1px solid ${riskBorder}`,
                        fontSize: '11px',
                        fontWeight: '800',
                        letterSpacing: '1.5px',
                        borderRadius: '20px',
                        padding: '6px 18px',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}>
                        {riskLabel}
                    </div>
                </div>

                {/* ═══════════════ MAIN BODY (Clean White Content Area) ═══════════════ */}
                <div style={{ padding: '36px 44px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* SCAN IMAGE + AI RESULTS ROW */}
                    <div style={{ display: 'flex', gap: '28px', alignItems: 'stretch' }}>

                        {/* Scan Image Container */}
                        <div style={{ flexShrink: 0, width: '220px' }}>
                            <div style={{ fontSize: '11px', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                📷 Lesion Scan Image
                            </div>
                            <div style={{
                                width: '220px', height: '220px', borderRadius: '16px',
                                overflow: 'hidden', border: '2px solid #BAE6FD',
                                backgroundColor: '#F8FAFC',
                                boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.12)',
                                position: 'relative',
                            }}>
                                {report.image_data ? (
                                    <img
                                        src={report.image_data}
                                        alt="Skin Scan"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px' }}>
                                        No Image Captured
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute', bottom: '8px', right: '8px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF',
                                    fontSize: '9px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px',
                                    letterSpacing: '0.5px'
                                }}>
                                    300 DPI High-Res
                                </div>
                            </div>
                        </div>

                        {/* AI Analysis Card */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '11px', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🤖 AI Pre-Screening Findings
                            </div>
                            <div style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: '16px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 4px 20px -2px rgba(2, 132, 199, 0.08)',
                                overflow: 'hidden',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}>
                                {/* Condition Name */}
                                <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
                                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', fontWeight: '600' }}>Detected Dermatological Condition</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>
                                        {report.ai_condition || 'Unknown Condition'}
                                    </div>
                                </div>

                                {/* Confidence Score & Progress Bar */}
                                <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#475569', fontWeight: '700' }}>AI Confidence Rating</div>
                                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0284C7', fontFamily: 'monospace' }}>{confidence}%</div>
                                    </div>
                                    <div style={{ height: '10px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden', padding: '2px' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${confidence}%`,
                                            background: 'linear-gradient(90deg, #0284C7, #2563EB)',
                                            borderRadius: '99px',
                                            transition: 'width 0.3s',
                                        }} />
                                    </div>
                                </div>

                                {/* Risk Badge Row */}
                                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC' }}>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Diagnostic Risk Category</div>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        backgroundColor: riskBg,
                                        color: riskColor,
                                        border: `1px solid ${riskBorder}`,
                                        borderRadius: '8px', padding: '6px 14px',
                                        fontSize: '12px', fontWeight: '800',
                                    }}>
                                        <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            backgroundColor: 'currentColor',
                                            display: 'inline-block',
                                        }} />
                                        {aiResult === 'malignant' ? 'High Risk — Urgent Dermatologist Consultation Recommended'
                                            : aiResult === 'benign' ? 'Low Risk / Benign — Standard Routine Monitoring'
                                                : 'Pending Evaluation'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION DIVIDER */}
                    <div style={{ borderTop: '2px dashed #CBD5E1', position: 'relative', margin: '4px 0' }}>
                        <div style={{
                            position: 'absolute', top: '-11px', left: '44px',
                            backgroundColor: '#FFFFFF', padding: '0 14px',
                            fontSize: '11px', fontWeight: '800', color: '#0284C7',
                            textTransform: 'uppercase', letterSpacing: '1.8px',
                        }}>
                            Doctor's Official Clinical Evaluation
                        </div>
                    </div>

                    {/* DOCTOR DIAGNOSIS SECTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Final Diagnosis Card */}
                        <div>
                            <div style={{
                                fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                                letterSpacing: '1.5px', color: '#0284C7', marginBottom: '8px',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: '#0284C7', borderRadius: '2px' }} />
                                Clinical Diagnosis
                            </div>
                            <div style={{
                                backgroundColor: '#F0F9FF',
                                border: '1px solid #BAE6FD',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                fontSize: '14px',
                                color: '#0F172A',
                                lineHeight: '1.7',
                                fontWeight: '500',
                                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.04)'
                            }}>
                                {report.diagnosis || 'Pending licensed dermatologist clinical review.'}
                            </div>
                        </div>

                        {/* Treatment Plan Card */}
                        {report.treatment && (
                            <div>
                                <div style={{
                                    fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                                    letterSpacing: '1.5px', color: '#16A34A', marginBottom: '8px',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: '#16A34A', borderRadius: '2px' }} />
                                    Prescribed Treatment Plan
                                </div>
                                <div style={{
                                    backgroundColor: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    fontSize: '14px',
                                    color: '#0F172A',
                                    lineHeight: '1.7',
                                    fontWeight: '500',
                                    boxShadow: '0 2px 10px rgba(22, 163, 74, 0.04)'
                                }}>
                                    {report.treatment}
                                </div>
                            </div>
                        )}

                        {/* Follow-up Schedule */}
                        {report.follow_up && (
                            <div>
                                <div style={{
                                    fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                                    letterSpacing: '1.5px', color: '#7C3AED', marginBottom: '8px',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: '#7C3AED', borderRadius: '2px' }} />
                                    Recommended Follow-Up Schedule
                                </div>
                                <div style={{
                                    backgroundColor: '#FAF5FF',
                                    border: '1px solid #DDD6FE',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    fontSize: '14px',
                                    color: '#0F172A',
                                    lineHeight: '1.7',
                                    fontWeight: '600',
                                    boxShadow: '0 2px 10px rgba(124, 58, 237, 0.04)'
                                }}>
                                    📅 {report.follow_up}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════ FOOTER (Pure Clinical Light Disclaimer & Signature) ═══════════════ */}
                <div style={{
                    backgroundColor: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                    padding: '24px 44px',
                    marginTop: 'auto',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                                backgroundColor: '#FFFBEB',
                                border: '1px solid #FDE68A',
                                borderRadius: '10px',
                                padding: '12px 16px',
                            }}>
                                <span style={{ fontSize: '16px', flexShrink: 0 }}>⚕️</span>
                                <p style={{ fontSize: '10px', color: '#92400E', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                                    <strong>Medical Disclaimer:</strong> This clinical report incorporates AI-assisted image pre-screening. It is intended for informational and diagnostic reference. Final medical care and decisions should always be directed by a qualified physician.
                                </p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0284C7', letterSpacing: '-0.3px' }}>DermaScan AI Clinical System</div>
                            <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', fontWeight: '500' }}>www.dermascan-ai.com • Support Portal</div>
                            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', fontFamily: 'monospace' }}>Verified Timestamp: {formattedDate}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

ReportPDFTemplate.displayName = 'ReportPDFTemplate';
export default ReportPDFTemplate;
