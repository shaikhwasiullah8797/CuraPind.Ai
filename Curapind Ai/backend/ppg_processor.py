"""
CuraPind AI v2.0 - Camera Pulse Check (HR Fallback - Screening Only)
Processes photoplethysmogram (PPG) waveforms with Butterworth bandpass filtering
(0.7 Hz - 4.0 Hz, corresponding to 42 - 240 BPM) and scipy.signal.find_peaks.

Enforces a strict Signal Quality Index (SQI >= 75%) gate to reject motion-corrupted signals.
"""

import numpy as np
from scipy.signal import butter, filtfilt, find_peaks

# Filter constraints: 0.7 Hz to 4.0 Hz
LOW_CUT_HZ = 0.7
HIGH_CUT_HZ = 4.0

def butter_bandpass(lowcut, highcut, fs, order=2):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    # Clip to valid range
    low = max(0.01, min(0.95, low))
    high = max(low + 0.01, min(0.99, high))
    b, a = butter(order, [low, high], btype='band')
    return b, a

def apply_butterworth_filter(signal_array, fs=30.0):
    """
    Applies zero-phase 2nd-order Butterworth bandpass filter (0.7 - 4.0 Hz).
    """
    if len(signal_array) < 15:
        return signal_array
    b, a = butter_bandpass(LOW_CUT_HZ, HIGH_CUT_HZ, fs=fs, order=2)
    try:
        filtered = filtfilt(b, a, signal_array)
        return filtered
    except Exception:
        return signal_array

def compute_signal_quality_index(raw_signal, peak_indices, fs=30.0):
    """
    Strict Signal Quality Index (SQI %) Gate:
    1. Inter-beat Interval (IBI) regularity: Low coefficient of variation (CV) in peaks
    2. Signal-to-Noise Ratio (SNR) in pulsatile physiological band
    3. Peak amplitude consistency

    Returns SQI as percentage (0 - 100).
    """
    if len(peak_indices) < 3 or len(raw_signal) < 30:
        return 0.0

    # 1. Interval regularity
    ibi = np.diff(peak_indices) / fs
    mean_ibi = np.mean(ibi)
    std_ibi = np.std(ibi)
    cv = std_ibi / mean_ibi if mean_ibi > 0 else 1.0
    regularity_score = max(0.0, 1.0 - cv * 2.0)

    # 2. Pulsatile signal power vs high-frequency noise
    mean_val = np.mean(raw_signal)
    signal_power = np.var(raw_signal)
    diffs = np.diff(raw_signal)
    noise_power = np.var(diffs) if len(diffs) > 0 else 1.0
    snr_score = min(1.0, signal_power / (noise_power * 3.0 + 1e-6))

    # 3. Peak amplitude consistency
    peak_amps = raw_signal[peak_indices]
    mean_amp = np.mean(peak_amps)
    std_amp = np.std(peak_amps)
    amp_score = max(0.0, 1.0 - (std_amp / (mean_amp + 1e-6))) if mean_amp > 0 else 0.0

    sqi = (regularity_score * 0.45 + snr_score * 0.30 + amp_score * 0.25) * 100.0
    return round(float(np.clip(sqi, 0.0, 100.0)), 1)

def extract_heart_rate_from_ppg(signal_values, fs=30.0, duration_sec=8.0):
    """
    Main PPG processing pipeline:
    1. Bandpass filter
    2. Peak detection using scipy.signal.find_peaks
    3. SQI evaluation and gating (SQI >= 75%)
    4. Heart rate calculation
    """
    signal = np.asarray(signal_values, dtype=float)
    if len(signal) < int(fs * 2.0):
        return {
            'accepted': False,
            'heart_rate': None,
            'sqi': 0.0,
            'reason': 'Insufficient frame data captured.'
        }

    # Bandpass filter
    filtered = apply_butterworth_filter(signal, fs=fs)

    # Peak detection (min distance corresponding to 240 bpm max -> 0.25s)
    min_dist = max(1, int(fs * 0.25))
    std_filtered = np.std(filtered)
    height_thresh = np.mean(filtered) + 0.3 * std_filtered if std_filtered > 0 else 0.0

    peaks, _ = find_peaks(filtered, distance=min_dist, height=height_thresh)

    sqi = compute_signal_quality_index(signal, peaks, fs=fs)

    # SQI gate check: reject if < 75%
    if sqi < 75.0:
        return {
            'accepted': False,
            'heart_rate': None,
            'sqi': sqi,
            'reason': f'Signal Quality Index ({sqi}%) is below 75% threshold. Please hold finger steady and ensure adequate lighting.'
        }

    # Calculate BPM
    actual_duration = len(signal) / fs
    bpm = round((len(peaks) / actual_duration) * 60.0)

    # Clamp to valid human physiological bounds
    bpm = int(np.clip(bpm, 42, 240))

    return {
        'accepted': True,
        'heart_rate': bpm,
        'sqi': sqi,
        'num_peaks': len(peaks),
        'disclaimer': 'Camera Pulse Check is a screening fallback only. Manual oximeter readings take priority when available.'
    }
