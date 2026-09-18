export type RouteKey = "home" | "memorize" | "review" | "dua" | "profile";

export type AppRoute = {
  readonly key: RouteKey;
  readonly path: string;
  readonly label: string;
  readonly title: string;
  readonly summary: string;
};

export const appRoutes: readonly AppRoute[] = [
  {
    key: "home",
    path: "/",
    label: "Beranda",
    title: "Beranda",
    summary: "Pilih satu ruang belajar untuk mulai.",
  },
  {
    key: "memorize",
    path: "/hafalan",
    label: "Hafalan",
    title: "Hafalan",
    summary: "Jalur hafalan anak dimulai dari doa yang sering dipakai.",
  },
  {
    key: "review",
    path: "/murajaah",
    label: "Murajaah",
    title: "Murajaah",
    summary: "Ruang pengulangan akan hadir pada tahap berikutnya.",
  },
  {
    key: "dua",
    path: "/doa",
    label: "Doa",
    title: "Doa",
    summary: "Daftar doa akan hadir pada tahap berikutnya.",
  },
  {
    key: "profile",
    path: "/saya",
    label: "Saya",
    title: "Saya",
    summary: "Pengaturan belajar akan hadir pada tahap berikutnya.",
  },
];

export function routeForPath(pathname: string): AppRoute | undefined {
  return appRoutes.find((route) => route.path === pathname);
}
