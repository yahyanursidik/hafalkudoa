import type { AppSettings } from "../content/progress.js";
import { useLearningFocus } from "./learning-focus.js";
import { LearningIcon, type LearningIconName } from "./learning-icon.js";
import { useProgress } from "./progress-provider.js";

/**
 * The reading aids, shared by the reader and the memorisation round.
 *
 * A child who needs bigger Arabic needs it in both places, so these write
 * straight to the saved settings instead of living in one page's state: set it
 * once, and it holds for the next doa and the next day.
 */

type ReaderControlProps = {
  readonly detail: string;
  readonly icon: LearningIconName;
  readonly isPressed: boolean;
  readonly label: string;
  readonly onClick: () => void;
};

export function ReaderControl({ detail, icon, isPressed, label, onClick }: ReaderControlProps) {
  return (
    <button aria-pressed={isPressed} className="reader-control" onClick={onClick} type="button">
      <span className="reader-control-heading"><LearningIcon name={icon} /><strong>{label}</strong></span>
      <span className="reader-control-detail">{detail}</span>
    </button>
  );
}

export type ReaderControlsProps = {
  /** The round hides Latin placement, which only applies to the full reading. */
  readonly compact?: boolean;
};

export function ReaderControls({ compact = false }: ReaderControlsProps) {
  const { changeSettings, settings } = useProgress();
  const { isFocusMode, setFocusMode } = useLearningFocus();

  const set = (patch: Partial<AppSettings>) => changeSettings(patch);

  return (
    <div className="reader-control-grid">
      {!compact && (
        <ReaderControl
          detail={settings.latinFirst ? "Di atas Arab" : "Di bawah Arab"}
          icon="order"
          isPressed={settings.latinFirst}
          label="Letak Latin"
          onClick={() => set({ latinFirst: !settings.latinFirst, latinVisible: true })}
        />
      )}
      <ReaderControl
        detail={settings.latinVisible ? "Bantuan terlihat" : "Bantuan baca"}
        icon="help"
        isPressed={settings.latinVisible}
        label="Latin"
        onClick={() => set({ latinVisible: !settings.latinVisible })}
      />
      <ReaderControl
        detail={settings.latinLarge ? "Sudah besar" : "Mudah dibaca"}
        icon="textLarge"
        isPressed={settings.latinLarge}
        label="Latin besar"
        onClick={() => set({ latinLarge: !settings.latinLarge, latinVisible: true })}
      />
      <ReaderControl
        detail={settings.translationVisible ? "Arti terlihat" : "Arti Indonesia"}
        icon="help"
        isPressed={settings.translationVisible}
        label="Lihat arti"
        onClick={() => set({ translationVisible: !settings.translationVisible })}
      />
      <ReaderControl
        detail={settings.colorGuidance ? "Warna aktif" : "Tandai teks"}
        icon="color"
        isPressed={settings.colorGuidance}
        label="Warna bantu"
        onClick={() => set({ colorGuidance: !settings.colorGuidance, latinVisible: true })}
      />
      <ReaderControl
        detail="Ukuran kecil"
        icon="textSmall"
        isPressed={settings.arabicSize === "small"}
        label="Arab kecil"
        onClick={() => set({ arabicSize: "small" })}
      />
      <ReaderControl
        detail="Ukuran nyaman"
        icon="textMedium"
        isPressed={settings.arabicSize === "medium"}
        label="Arab sedang"
        onClick={() => set({ arabicSize: "medium" })}
      />
      <ReaderControl
        detail="Mudah dilihat"
        icon="textLarge"
        isPressed={settings.arabicSize === "large"}
        label="Arab besar"
        onClick={() => set({ arabicSize: "large" })}
      />
      <ReaderControl
        detail={isFocusMode ? "Kembali ke menu" : "Sembunyikan menu"}
        icon="focus"
        isPressed={isFocusMode}
        label="Mode fokus"
        onClick={() => setFocusMode(!isFocusMode)}
      />
    </div>
  );
}
