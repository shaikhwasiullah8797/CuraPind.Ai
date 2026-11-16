import React, { useState, useMemo } from 'react';
import { QrCode, MessageSquare, Send, Download } from 'lucide-react';
import { generateQRDataURL, buildQRPayload, buildSMSBody } from '../utils/qrGenerator';

const ReferralBridge = ({ result }) => {
  const [showQR, setShowQR] = useState(false);

  const qrDataURL = useMemo(() => {
    if (!showQR) return null;
    const payload = buildQRPayload(result);
    return generateQRDataURL(payload, 240);
  }, [showQR, result]);

  const smsBody = useMemo(() => buildSMSBody(result), [result]);
  const smsURI = `sms:?body=${encodeURIComponent(smsBody)}`;

  return (
    <div className="space-y-3 animate-[fadeIn_0.4s_ease-out]">
      <div className="text-center">
        <p className="text-sm font-bold text-white mb-0.5">PHC Referral Bridge</p>
        <p className="text-xs text-zinc-400">Generate a pre-triage digital slip for the nearest Primary Health Centre</p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* QR Code Button */}
        <button
          type="button"
          onClick={() => setShowQR(!showQR)}
          className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex flex-col items-center gap-1.5 shadow-sm ${
            showQR
              ? 'bg-[#29A683]/20 border-[#29A683] text-[#D2FF8F]'
              : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-[#29A683]/50 hover:text-white'
          }`}
        >
          <QrCode className="w-5 h-5 text-[#29A683]" />
          {showQR ? 'Hide QR Slip' : 'QR Triage Slip'}
        </button>

        {/* SMS Button */}
        <a
          href={smsURI}
          className="p-3 rounded-xl border bg-emerald-500/15 border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold transition-all flex flex-col items-center gap-1.5 hover:bg-emerald-500/25 shadow-sm"
        >
          <Send className="w-5 h-5 text-emerald-400" />
          SMS to PHC
        </a>
      </div>

      {/* QR Code Display */}
      {showQR && qrDataURL && (
        <div className="bg-white rounded-xl p-4 text-center mx-auto max-w-[280px] animate-[fadeIn_0.3s_ease-out] shadow-xl">
          <img
            src={qrDataURL}
            alt="CuraPind Triage QR Code"
            className="w-56 h-56 mx-auto"
          />
          <p className="text-xs text-zinc-800 mt-2 font-bold">
            Scan at PHC for instant pre-triage vitals
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
            {result.patientName || 'Patient'} • {result.riskLevel} • {new Date().toLocaleDateString('en-IN')}
          </p>
        </div>
      )}

      {/* SOAP Note Preview */}
      <details className="group">
        <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors flex items-center pt-1">
          <MessageSquare className="w-3.5 h-3.5 mr-1 text-[#29A683]" />
          Preview Clinical SOAP Note
        </summary>
        <pre className="mt-2 text-[10px] text-zinc-300 bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed">
          {smsBody}
        </pre>
      </details>
    </div>
  );
};

export default ReferralBridge;
