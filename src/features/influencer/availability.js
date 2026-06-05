export const AVAILABILITY_STATUS = {
  available: 'available',
  busy: 'busy',
};

export const AVAILABILITY_STATUS_OPTIONS = [
  {
    value: AVAILABILITY_STATUS.available,
    label: 'Tersedia',
    shortLabel: 'Ada',
    description: 'Bisa menerima campaign di tanggal ini.',
    badgeClassName: 'bg-green-50 text-green-700 border-green-200',
    panelClassName: 'bg-green-50 border-green-100 text-green-900',
    dotClassName: 'bg-green-500',
  },
  {
    value: AVAILABILITY_STATUS.busy,
    label: 'Sibuk',
    shortLabel: 'Sibuk',
    description: 'Sedang penuh atau tidak menerima campaign.',
    badgeClassName: 'bg-red-50 text-red-700 border-red-200',
    panelClassName: 'bg-red-50 border-red-100 text-red-900',
    dotClassName: 'bg-red-500',
  },
];

export const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const padDatePart = (value) => String(value).padStart(2, '0');

export const toDateKey = (date) => {
  const safeDate = date instanceof Date ? date : new Date(date);

  return [
    safeDate.getFullYear(),
    padDatePart(safeDate.getMonth() + 1),
    padDatePart(safeDate.getDate()),
  ].join('-');
};

export const parseDateKey = (dateKey) => {
  if (!DATE_KEY_PATTERN.test(String(dateKey || ''))) {
    return null;
  }

  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

export const getMonthRangeKeys = (monthDate) => {
  const date = monthDate instanceof Date ? monthDate : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    startDate: toDateKey(start),
    endDate: toDateKey(end),
  };
};

export const getMonthGrid = (monthDate) => {
  const date = monthDate instanceof Date ? monthDate : new Date();
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const currentMonth = monthStart.getMonth();
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -mondayOffset);
  const todayKey = toDateKey(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const day = addDays(gridStart, index);
    const dateKey = toDateKey(day);

    return {
      date: day,
      dateKey,
      dayNumber: day.getDate(),
      isCurrentMonth: day.getMonth() === currentMonth,
      isToday: dateKey === todayKey,
    };
  });
};

export const getRollingDateWindow = (startDate = new Date(), dayCount = 14) => (
  Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(startDate, index);
    const dateKey = toDateKey(date);

    return {
      date,
      dateKey,
      isToday: index === 0,
    };
  })
);

export const formatMonthTitle = (date) => (
  new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date)
);

export const formatAvailabilityDate = (dateKey) => {
  const date = parseDateKey(dateKey);
  if (!date) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const mapAvailabilityByDate = (items = []) => (
  items.reduce((acc, item) => {
    if (item?.date) {
      acc[item.date] = item;
    }

    return acc;
  }, {})
);

export const getAvailabilityStatusOption = (status) => (
  AVAILABILITY_STATUS_OPTIONS.find((option) => option.value === status)
  || AVAILABILITY_STATUS_OPTIONS[0]
);

export const countAvailabilityByStatus = (items = []) => (
  items.reduce((acc, item) => {
    if (item?.status === AVAILABILITY_STATUS.available) {
      acc.available += 1;
    }

    if (item?.status === AVAILABILITY_STATUS.busy) {
      acc.busy += 1;
    }

    if (item?.is_public === false) {
      acc.private += 1;
    }

    return acc;
  }, { available: 0, busy: 0, private: 0 })
);

export const createEmptyAvailabilityForm = (dateKey = toDateKey(new Date())) => ({
  date: dateKey,
  status: AVAILABILITY_STATUS.available,
  note: '',
  is_public: true,
});

export const toAvailabilityForm = (item, fallbackDateKey) => {
  if (!item) {
    return createEmptyAvailabilityForm(fallbackDateKey);
  }

  return {
    date: item.date || fallbackDateKey,
    status: item.status || AVAILABILITY_STATUS.available,
    note: item.note || '',
    is_public: item.is_public !== false,
  };
};

export const sanitizeAvailabilityPayload = (formData, influencerId) => {
  const date = String(formData.date || '').trim();
  const status = String(formData.status || '').trim();
  const note = String(formData.note || '').trim();

  if (!influencerId) {
    throw new Error('Profil influencer belum siap. Lengkapi profil terlebih dahulu.');
  }

  if (!parseDateKey(date)) {
    throw new Error('Tanggal ketersediaan tidak valid.');
  }

  if (!AVAILABILITY_STATUS_OPTIONS.some((option) => option.value === status)) {
    throw new Error('Status ketersediaan tidak valid.');
  }

  if (note.length > 240) {
    throw new Error('Catatan maksimal 240 karakter.');
  }

  return {
    influencer_id: influencerId,
    date,
    status,
    note: note || null,
    is_public: Boolean(formData.is_public),
  };
};
