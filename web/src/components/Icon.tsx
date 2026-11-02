// Uygulamanın tüm ikonları: 24x24 çizgi stili, ek paket gerekmez.
export const icons = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  building: "M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2",
  calendar: "M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 10h16M8 3v4M16 3v4M8.5 14.5l2 2 4-4",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14.5h1",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
  vault: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM7 19v2M17 19v2",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4",
  logo: "M5 21V8.5L12 4l7 4.5V21M3 21h18M9.5 21v-5h5v5M9.5 11h.01M14.5 11h.01",
  plus: "M12 5v14M5 12h14",
  chevron: "m9 18 6-6-6-6",
  chevronLeft: "m15 18-6-6 6-6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  close: "M18 6 6 18M6 6l12 12",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  layers: "m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  coins: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  trendUp: "m3 17 6-6 4 4 8-8M15 7h6v6",
  trendDown: "m3 7 6 6 4-4 8 8M15 17h6v-6",
  check: "m5 12 4 4L19 6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
};

export type IconName = keyof typeof icons;

export function Icon({ name, path }: { name?: IconName; path?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={name ? icons[name] : path} />
    </svg>
  );
}
