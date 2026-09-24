import React, { useState, useEffect, useRef } from 'react';
import { Compass, Navigation, MapPin, RefreshCw, Smartphone, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';
import { CityPreset } from '../utils/prayerTimes';

interface QiblaCompassProps {
  selectedCity: CityPreset;
}

export function calculateQibla(latitude: number, longitude: number): { bearing: number; distanceKm: number } {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    return { bearing: 136, distanceKm: 1286 }; // Default Cairo -> Makkah
  }

  const phiK = (21.422487 * Math.PI) / 180; // Precise Kaaba lat
  const lambdaK = (39.826206 * Math.PI) / 180; // Precise Kaaba lng
  const phi = (latitude * Math.PI) / 180;
  const lambda = (longitude * Math.PI) / 180;

  const y = Math.sin(lambdaK - lambda);
  const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);

  let qiblaRad = Math.atan2(y, x);
  let qiblaDeg = (qiblaRad * 180) / Math.PI;
  qiblaDeg = (qiblaDeg + 360) % 360;

  const R = 6371; // Earth radius in km
  const dLat = phiK - phi;
  const dLon = lambdaK - lambda;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi) * Math.cos(phiK) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const safeA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA));
  const distanceKm = Math.round(R * c);

  return { 
    bearing: isNaN(qiblaDeg) ? 136 : Math.round(qiblaDeg), 
    distanceKm: isNaN(distanceKm) ? 1286 : distanceKm 
  };
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({ selectedCity }) => {
  // Sensor State
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [sensorStatus, setSensorStatus] = useState<'checking' | 'active' | 'inactive' | 'unsupported'>('checking');
  
  // GPS Geolocation State
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; nameAr: string } | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Manual Dial Rotation State (for Desktop & Non-Sensor devices)
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const compassDialRef = useRef<HTMLDivElement>(null);

  // Effective Coordinates: Preference to GPS if available, else selected city
  const cityLat = selectedCity?.lat ?? (selectedCity as any)?.latitude ?? 30.0444;
  const cityLng = selectedCity?.lng ?? (selectedCity as any)?.longitude ?? 31.2357;

  const effectiveLat = gpsLocation ? gpsLocation.lat : cityLat;
  const effectiveLng = gpsLocation ? gpsLocation.lng : cityLng;
  const locationLabel = gpsLocation ? gpsLocation.nameAr : selectedCity.nameAr;

  const { bearing, distanceKm } = calculateQibla(effectiveLat, effectiveLng);

  // Real Hardware Orientation Sensor Listener
  useEffect(() => {
    let receivedEvents = 0;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;

      if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
        heading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null && typeof e.alpha === 'number') {
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null && !isNaN(heading)) {
        receivedEvents++;
        if (receivedEvents >= 2) {
          setDeviceHeading(Math.round(heading));
          setSensorStatus('active');
        }
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation as any, true);
      window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
      
      // Fallback check if no events received within 1 font-tick
      const timer = setTimeout(() => {
        if (receivedEvents < 2) {
          setSensorStatus('inactive');
        }
      }, 1500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('deviceorientation', handleOrientation as any, true);
        window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true);
      };
    } else {
      setSensorStatus('unsupported');
    }
  }, []);

  // Request Compass Permission (iOS Safari)
  const requestCompassPermission = async () => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setSensorStatus('checking');
        } else {
          setSensorStatus('inactive');
        }
      } catch (err) {
        setSensorStatus('inactive');
      }
    } else {
      setSensorStatus('inactive');
    }
  };

  // Real GPS Location Fetch
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('خاصية تحديد الموقع (GPS) غير مدعومة في هذا المتصفح.');
      return;
    }

    setIsGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          nameAr: `موقع GPS حي (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`
        });
        setIsGpsLoading(false);
      },
      (err) => {
        setIsGpsLoading(false);
        setGpsError('تعذر الوصول لموقع GPS. يُرجى السماح بالإذن في المتصفح.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Effective Heading: Hardware sensor if active, else manual heading
  const currentHeading = sensorStatus === 'active' && deviceHeading !== null ? deviceHeading : manualHeading;
  const needleRotation = (bearing - currentHeading + 360) % 360;

  // Check if phone/dial is currently aligned with Qibla (within ±5 degrees)
  const diff = Math.abs((currentHeading - bearing + 360) % 360);
  const isAligned = diff <= 5 || diff >= 355;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5" dir="rtl">
      
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-['Amiri',serif]">
              بوصلة القبلة المشرفة
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span>الحساب بناءً على:</span>
              <strong className="text-teal-800 font-bold">{locationLabel}</strong>
            </p>
          </div>
        </div>

        {/* Real Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {sensorStatus === 'active' ? (
            <span className="text-[11px] bg-emerald-50 text-emerald-800 font-extrabold px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              مستشعر البوصلة المغناطيسي حي 🧲
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                تدوير يدوي / حسّاب زاوية
              </span>
              <button
                onClick={requestCompassPermission}
                className="text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold px-2.5 py-1 rounded-full border border-teal-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                title="محاولة تشغيل مستشعر الجيروسكوب بالهاتف"
              >
                <RefreshCw className="w-3 h-3 text-teal-600" />
                <span>تفعيل المستشعر</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GPS Fetch Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            {gpsLocation 
              ? 'تم تحديد القبلة وفق إحداثيات GPS المباشرة بدقة عالية.' 
              : `القبلة محسوبة حالياً لإحداثيات (${selectedCity.nameAr}).`}
          </span>
        </div>

        <button
          onClick={handleGetGpsLocation}
          disabled={isGpsLoading}
          className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
          <span>{isGpsLoading ? 'جاري جلب موقع GPS...' : 'تحديد بموقعي المباشر (GPS)'}</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Main Compass Visual & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-1">
        
        {/* Interactive Visual Compass Dial */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div 
            ref={compassDialRef}
            className={`relative w-56 h-56 rounded-full border-4 transition-all duration-300 flex items-center justify-center shadow-md p-2 bg-gradient-to-b from-slate-50 to-white select-none ${
              isAligned 
                ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-emerald-200' 
                : 'border-slate-200'
            }`}
          >
            {/* Outer Compass Degrees Ring */}
            <div 
              className="absolute inset-0 rounded-full flex items-center justify-center transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${-currentHeading}deg)` }}
            >
              {/* Cardinal Directions */}
              <span className="absolute top-2 text-xs font-black text-rose-600">شمال N (0°)</span>
              <span className="absolute bottom-2 text-xs font-black text-slate-500">جنوب S (180°)</span>
              <span className="absolute left-2 text-xs font-black text-slate-500">غرب W (270°)</span>
              <span className="absolute right-2 text-xs font-black text-slate-500">شرق E (90°)</span>
            </div>

            {/* Inner Needle & Kaaba Pointer */}
            <div className="w-40 h-40 rounded-full border border-dashed border-teal-200 flex items-center justify-center relative">
              
              {/* Rotating Kaaba Indicator */}
              <div 
                className="absolute inset-0 flex items-start justify-center transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${needleRotation}deg)` }}
              >
                <div className="flex flex-col items-center -mt-4">
                  <div className={`w-8 h-8 rounded-xl bg-slate-950 border-2 shadow-lg flex items-center justify-center text-white text-xs font-black transition-all ${
                    isAligned ? 'border-amber-400 scale-110 ring-2 ring-amber-300' : 'border-amber-400/80'
                  }`}>
                    🕋
                  </div>
                  <div className={`w-1.5 h-16 rounded-full transition-colors ${
                    isAligned ? 'bg-emerald-500' : 'bg-teal-600'
                  }`} />
                </div>
              </div>

              {/* Center Pivot Axis */}
              <div className={`w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center z-10 transition-colors ${
                isAligned ? 'bg-emerald-600' : 'bg-teal-700'
              }`}>
                <Navigation className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Alignment Feedback */}
          {isAligned ? (
            <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>أنت تواجه عين القبلة المشرفة الآن 🕋✅</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 text-center">
              {sensorStatus === 'active' 
                ? 'تدوير الهاتف أفقياً يحرّك المؤشر تلقائياً نحو اتجاه القبلة.' 
                : 'استخدم الشريط أدناه لتدوير البوصلة يدوياً وضبط الاتجاه.'}
            </p>
          )}
        </div>

        {/* Details & Manual Controls */}
        <div className="space-y-3.5 text-right">
          
          <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4">
            <span className="text-xs text-teal-900 font-bold block">زاوية انحراف القبلة الحقيقية:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-teal-950 font-mono">{bearing}°</span>
              <span className="text-xs text-teal-800 font-bold">جنوب شرق (بالنسبة للشمال الحقيقي)</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <span className="text-xs text-slate-600 font-bold block">المسافة إلى المكة المكرمة:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">{distanceKm.toLocaleString('ar-EG')}</span>
              <span className="text-xs text-slate-600 font-bold">كيلومتر تقريباً</span>
            </div>
          </div>

          {/* Manual Heading Slider for Desktop / Non-sensor devices */}
          {sensorStatus !== 'active' && (
            <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                  <span>تدوير الاتجاه يدوياً:</span>
                </span>
                <span className="font-mono text-teal-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {manualHeading}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={manualHeading}
                onChange={(e) => setManualHeading(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono dir-ltr">
                <span>0° (شمال)</span>
                <span>90° (شرق)</span>
                <span>180° (جنوب)</span>
                <span>270° (غرب)</span>
                <span>360°</span>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
