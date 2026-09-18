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
    label: "Ulangi",
    title: "Ulangi doa",
    summary: "Pilih doa yang sudah pernah dibaca untuk diulang.",
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
    label: "Aku",
    title: "Aku",
    summary: "Atur cara belajar yang paling nyaman.",
  },
];

export function routeForPath(pathname: string): AppRoute | undefined {
  return appRoutes.find((route) => route.path === pathname);
}
