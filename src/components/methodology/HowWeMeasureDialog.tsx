import React from 'react';
import { Shield, Zap, AlertTriangle, Layers, Scale } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { useI18n } from '@/i18n';

export interface HowWeMeasureDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowWeMeasureDialog: React.FC<HowWeMeasureDialogProps> = ({ isOpen, onClose }) => {
  const { lang } = useI18n();

  const isAr = lang === 'ar';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isAr ? 'منهجية القياس ودقة الأرقام' : 'Measurement Methodology & Honesty'}
    >
      <div className="space-y-6 text-sm text-[var(--text)] max-h-[70vh] overflow-y-auto pe-2">
        {/* Honesty Pledge */}
        <div className="p-4 rounded-xl bg-[var(--accent-down)]/10 border border-[var(--accent-down)]/30 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--accent-down)]">
            <Shield className="w-4 h-4" />
            <span>{isAr ? 'ميثاق النزاهة والشفافية (أرقام حقيقية 100%)' : 'Honesty & Non-Fake Guarantee'}</span>
          </div>
          <p className="text-xs text-[var(--text)] leading-relaxed">
            {isAr
              ? 'تلتزم أداة نبض (YamkSpeed) بعدم توليد أي أرقام وهمية أو افتراضية أو مُحاكاة. جميع المؤشرات المعروضة ناتجة عن قياس فعلي لحزم البيانات عبر بروتوكولات الشبكة. يُحظر تماماً استخدام Math.random في كود المحرك ويتم التحقق من ذلك آلياً في كل عملية بناء برمجية.'
              : 'YamkSpeed guarantees 100% genuine network measurements with zero synthetic, simulated, or interpolated numbers. A continuous integration (CI) gate strictly enforces the absence of Math.random within the measurement engine.'}
          </p>
        </div>

        {/* 3-Tier Multi-Network Resilience */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
            <Layers className="w-4 h-4 text-[var(--accent-up)]" />
            <span>{isAr ? 'معمارية خوادم القياس (3 طبقات صمود)' : '3-Tier Measurement Infrastructure'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
              <div className="text-xs font-bold text-[var(--accent-down)]">
                {isAr ? '1. شبكة Cloudflare' : '1. Cloudflare Edge'}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {isAr
                  ? 'المحرك الأساسي لقياس التنزيل والرفع عبر خوادم طرفية موزعة في أكثر من 300 مدينة عالمياً.'
                  : 'Primary engine for multi-stream download and upload across 300+ global edge locations.'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
              <div className="text-xs font-bold text-[var(--accent-up)]">
                {isAr ? '2. شبكة M-Lab NDT7' : '2. M-Lab NDT7'}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {isAr
                  ? 'البديل المفتوح والمستقل عبر WebSocket لضمان استمرارية الخدمة حال تعطل المحرك الأساسي.'
                  : 'Independent open measurement platform via WebSocket protocol for automatic failover.'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
              <div className="text-xs font-bold text-[var(--accent-lat)]">
                {isAr ? '3. خادم Worker الاحتياطي' : '3. Edge Worker Backup'}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {isAr
                  ? 'نقطة نهاية احتياطية خفيفة بدون خادم تُستخدم في حالات الطوارئ الشديدة.'
                  : 'Serverless emergency fallback deployed at edge to guarantee zero downtime.'}
              </p>
            </div>
          </div>
        </div>

        {/* Methodology & Statistical Rigor */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
            <Scale className="w-4 h-4 text-[var(--accent-down)]" />
            <span>{isAr ? 'مبادئ الدقة والتحليل الإحصائي' : 'Accuracy Principles & Statistical Formulas'}</span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2.5 text-xs">
            <div className="flex items-start gap-2">
              <span className="font-bold text-[var(--accent-down)] shrink-0">•</span>
              <div>
                <strong className="text-[var(--text)]">
                  {isAr ? 'استبعاد فترة الإحماء (Warm-up Discard):' : 'Warm-up Discard:'}
                </strong>{' '}
                <span className="text-[var(--text-muted)]">
                  {isAr
                    ? 'يتم استبعاد أول ثانيتين من الحسابات النهائية للتخلص من بطء البدء (TCP slow-start) ومصافحة تشفير TLS.'
                    : 'The first 1.5–2 seconds are excluded from the final throughput calculation to eliminate TCP slow-start and TLS handshake depression.'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-[var(--accent-down)] shrink-0">•</span>
              <div>
                <strong className="text-[var(--text)]">
                  {isAr ? 'المسارات المتزامنة المتكيفة (Adaptive Streams):' : 'Adaptive Multi-Streaming:'}
                </strong>{' '}
                <span className="text-[var(--text-muted)]">
                  {isAr
                    ? 'استخدام 4 إلى 8 اتصالات متوازية تزداد تلقائياً لملء سعة القناة وإشباع السرعات العالية.'
                    : '4 to 8 parallel streams adaptively saturate high-speed links without bottlenecking slower ones.'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-[var(--accent-down)] shrink-0">•</span>
              <div>
                <strong className="text-[var(--text)]">
                  {isAr ? 'نوافذ العينات الإحصائية (Trimmed 90th Percentile):' : 'Sliding 250ms Buckets & 90th Percentile:'}
                </strong>{' '}
                <span className="text-[var(--text-muted)]">
                  {isAr
                    ? 'حساب السرعة كل 250 مللي ثانية، واستخراج النتيجة النهائية كمئين 90 مستقر أو متوسط مُشذب لمنع القمم والنزول العشوائي.'
                    : 'Throughput is calculated in sliding 250ms windows, and summarized via 90th percentile / trimmed mean to reflect true sustained speed.'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-[var(--accent-down)] shrink-0">•</span>
              <div>
                <strong className="text-[var(--text)]">
                  {isAr ? 'مقياس الميجابت العشري (Decimal Megabits):' : 'Decimal Megabits (10^6 bits/s):'}
                </strong>{' '}
                <span className="text-[var(--text-muted)]">
                  {isAr
                    ? 'الاعتماد على الميجابت العشري (1 Mbps = 1,000,000 بت/ث) كما تفعل شركات الاتصالات، مع إتاحة خيار MB/s (÷8).'
                    : 'Reported in decimal megabits (1 Mbps = 1,000,000 bits/s) matching ISP standards, with optional MB/s (÷8) display.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bufferbloat / Loaded Latency */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
            <Zap className="w-4 h-4 text-[var(--accent-lat)]" />
            <span>{isAr ? 'مؤشر تضخم المخزن المؤقت (Bufferbloat)' : 'Loaded Latency & Bufferbloat'}</span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2 text-xs">
            <p className="text-[var(--text-muted)] leading-relaxed">
              {isAr
                ? 'نقوم بقياس زمن الاستجابة أثناء ذروة التنزيل والرفع لمقارنته بزمن الاستجابة في وضع الخمول. الزيادة الكبيرة في زمن الاستجابة تدل على اختناق في المودم أو الموزع وهو ما يسبب بطء الألعاب الإلكترونية ومكالمات الفيديو أثناء استخدام الشبكة.'
                : 'We measure ping while the connection is saturated with download and upload traffic. High latency increase indicates bufferbloat in your router or ISP, leading to gaming lag and video stuttering during shared household usage.'}
            </p>
          </div>
        </div>

        {/* Known Limitations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[var(--danger)]">
            <AlertTriangle className="w-4 h-4" />
            <span>{isAr ? 'القيود التقنية وظروف القياس' : 'Known Measurement Limitations'}</span>
          </div>
          <div className="p-4 rounded-xl border border-[var(--border)] space-y-2 text-xs text-[var(--text-muted)] leading-relaxed">
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>
                {isAr
                  ? 'الشبكات اللاسلكية (Wi-Fi) تتأثر بالمسافة والتداخل؛ للسرعات الفائقة يوصى دائماً باستخدام كابل شبكة (Ethernet).'
                  : 'Wi-Fi can fluctuate due to interference and distance. Wired Ethernet is recommended for multi-hundred Mbps connections.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>
                {isAr
                  ? 'برامج VPN ومزودات البروكسي والتبويبات الخفية تستهلك موارد المعالج وتخفض الأرقام المقاسة بنسبة 10-30%.'
                  : 'VPNs, proxies, background updates, and hidden browser tabs will throttle speed and inflate latency.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>
                {isAr
                  ? 'اختلاف النتائج بنسبة ±10–15% بين أدوات القياس أمر طبيعي لاختلاف مواقع الخوادم ومسارات التوجيه (Routing).'
                  : 'Differences of ±10–15% between testing tools are normal due to edge server locations and transit peering.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
