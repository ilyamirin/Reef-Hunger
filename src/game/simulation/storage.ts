const BEST_SCORE_KEY = "reef-hunger-best-score";

export const loadBestScore = (): number => {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(BEST_SCORE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

export const saveBestScore = (value: number): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(BEST_SCORE_KEY, String(value));
};
